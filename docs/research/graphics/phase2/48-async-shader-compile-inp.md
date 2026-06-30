# 48 — Async Shader Compile + Alloc-Free Loop for INP

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 48_
_Cluster: G-architecture-perf · Focus: `renderer.compileAsync(scene, camera)` before the loader lifts so
the first scroll isn't blocked by a multi-hundred-ms synchronous shader compile, plus auditing
`useFrame`/`Embers`/`CameraRig`/`ForgeDriver` for zero per-frame allocation and zero React state
mid-scroll. Directly protects **INP < 200 ms** at the critical first interaction._

> Read `00-COHESION-MAP.md` §10 (the perf-budget envelope, "INP insurance: `renderer.compileAsync`
> before first interaction; alloc-free per-frame loop") and Phase-2 deep-dive 39 (the Master Forge
> Uniform pool + `<ForgeDriver/>` single writer) first. This document is the concrete build of the two
> bullet points §10 promises but does not implement: (1) compile every hot program *before* the loader
> dismisses, and (2) prove the steady-state loop allocates nothing and never calls React `setState`.
> Both target the same metric — the responsiveness of the **first scroll** on an iPhone 15 — and both
> are pure plumbing: they change *when* work happens and *what gets allocated*, never the look. The
> acceptance test mirrors deep-dive 39's: `/` must render byte-identical, just smoother at the seam.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is the worst-case INP scene by construction. It is a **single full-screen `MeshPhysicalMaterial`
with a large injected fragment program** (`ObsidianSlab.jsx`: `gw_fbm` domain-warp, opal `cos()`
iridescence, derivative bump, Fresnel, the temperature COLOR chunk), a faceted-jewel material on the
`/web` chamber, an additive `Embers` `ShaderMaterial`, and a full merged `EffectPass` (bloom + grade +
CA + SMAA). Every one of those programs is **compiled lazily by three on the first frame the material is
visible** — and `MeshPhysicalMaterial` with `transmission`, `clearcoat`, and `iridescence` enabled is
one of the heaviest shader permutations three ships. On an M1 the canonical r3f case (#3073) measured
**74.6 ms of compile spread across several frames** for a single frosted-glass material; the GAELWORX
slab is in the same weight class, and the iPhone 15's A16/A17 GLES driver compiles slower than desktop.

The exact failure this doc kills: today the loader (`src/ui/Loader.jsx`) dismisses on a **timer**
(`document.fonts.ready` + a 1700 ms minimum), and the scene mounts independently on
`requestIdleCallback` (`ForgeExperience.jsx`). There is **no coordination** between "the loader lifted,
the user can now scroll" and "the slab/jewel/embers/post programs are actually compiled and linked." So
the realistic sequence on a cold load is: loader lifts → user flicks the wheel → that flick is the
*first frame the slab is drawn* → three synchronously compiles the physical-material program + the post
chain → the main thread blocks for a few hundred milliseconds → the scroll interaction's "next paint"
lands late → **INP spikes into the red on the single most-judged interaction of the session.** On an
OLED held in one hand, that stall is a visible lurch, not a soft hitch (29 §1: dropped frames read
*cleaner* on instant-response panels).

The fix has two halves, both named in §10 of the cohesion map:

1. **Async compile gate.** Call `await gl.compileAsync(scene, camera)` (which uses
   `KHR_parallel_shader_compile` to compile *off* the blocking path) and only dismiss the loader once it
   resolves. The compile cost is paid *under* the loader's existing 1700 ms dwell, where the user is
   already waiting — so it is free wall-clock time — and the first scroll hits warm programs.
2. **Alloc-free, React-free steady loop.** Audit every `useFrame` (`CameraRig`, `ObsidianSlab`,
   `Embers`, the future `ForgeDriver`) for `new` in the hot path and for any `setState`/store-driven
   re-render mid-scroll. A single `new THREE.Vector3()` at 60 fps is 3,600 allocations/minute → GC saw-
   tooth → periodic INP spikes that *also* land during scroll. The store pattern (`forge.*` mutated
   outside React) already exists; this is the audit that proves it holds end-to-end.

This is the keystone of the perf cluster: it does not make the steady state faster (29 owns that), it
makes the **transitions** — first paint, route swap, strike — not block input. INP is a tail metric;
this is tail-latency engineering.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 What actually blocks INP in a WebGL scene

The 2025/2026 Core-Web-Vitals model (web.dev *Optimize INP*; Utsubo *WebGL & Three.js Site SEO 2026*)
decomposes an interaction into **input delay → processing time → presentation delay**, and INP is the
worst interaction's total over the session, with the **< 200 ms** "good" threshold. In a Three.js page
three things on the main thread blow past it: (a) **synchronous shader compile/link** on first-draw of a
material (the COMPILE/LINK status read *blocks* until the driver finishes — exactly what
`KHR_parallel_shader_compile` exists to avoid), (b) **long `useFrame` tasks + GC pauses** from per-frame
allocation, and (c) **React reconciliation** triggered by `setState` inside the loop. GAELWORX is
exposed to all three, and the first one is the spike; (b)/(c) are the recurring saw-tooth.

### 2.2 `renderer.compileAsync(scene, camera)` — the modern primitive (RECOMMENDED core)

Three.js **r158** added `WebGLRenderer.compileAsync(scene, camera, targetScene?)`, the async sibling of
`.compile()`. It "uses the `KHR_parallel_shader_compile` extension" and "returns a `Promise` that
resolves when the given scene can be rendered without unnecessary stalling due to shader compilation"
(three.js docs, current 2025–2026). The mechanism: instead of reading `COMPILE_STATUS`/`LINK_STATUS`
(which stalls), it polls the non-blocking `COMPLETION_STATUS_KHR` query, so the driver compiles on its
own threads and the main thread stays free (Khronos `KHR_parallel_shader_compile` registry; MDN
*KHR_parallel_shader_compile*, 2025). The MoldStud r3f roundup (2025/2026) reports the practical
payoff: pre-warming with `compileAsync` cut **start-up hitches by ~70%** versus synchronous compile.

Three required arguments-of-correctness for GAELWORX:
- It must be called **after** the materials/meshes exist in the scene graph and the camera is the one
  that will render — `compile` walks the actual scene and compiles the programs it *finds*, with the
  *lights and fog state* that are present. Compile a slab that isn't mounted yet and you've warmed
  nothing.
- **Browser caveat (still true in 2026):** the extension is broadly supported on Chromium/Safari but the
  benefit degrades where it's absent (the #3073 author flagged Firefox specifically). `compileAsync`
  *still works* without it — it just falls back to compiling synchronously inside the promise, so it's
  never *worse* than the status quo, only *better* where the extension exists. iPhone 15 Safari supports
  it (web3dsurvey shows near-universal WebGL2 coverage), which is the judge device.
- **The MRT / cache-key sharp edges (2025 bugs).** mrdoob/three.js #31220 (June 2025): calling
  `compileAsync` *before* setting up a postprocessing MRT broke the renderer in both WebGL and WebGPU
  backends. And the threejs forum thread *"WebGLRenderer compile async and possible wrong shader cache
  key"* (2025) documents that a material whose program identity depends on a `customProgramCacheKey`
  (exactly our `GW_FBM_OCTAVES` tier define from deep-dive 39 §2.1) must have that key **stable and set
  before** `compileAsync`, or the warm-up compiles a *different* program than the one drawn at runtime —
  a silent miss that re-introduces the very first-frame stall you tried to remove. Both are order-of-
  operations constraints, not blockers.

### 2.3 drei `<Preload all />` — the ergonomic wrapper (ADJACENT)

drei's `<Preload all />` walks the scene and calls the renderer's compile path so programs are warm
before reveal; r3f issue #3073 is the open design discussion about making it (and the reconciler) use
`compileAsync` + Suspense so "children are compiled asynchronously, and only added to the *real* scene
when compilation has completed." It's the idiomatic move for asset-heavy GLTF scenes. For GAELWORX it's
*almost* right but has two mismatches: (1) our heroes are **route-gated and tier-defined**, so "compile
everything once at boot" doesn't capture the jewel program that only mounts on `/web` with a possibly-
different `customProgramCacheKey`; (2) we want the compile gate wired to **our** loader's dismiss, not
drei's Suspense fallback, because the loader is a brand beat (the ignition wordmark) with a deliberate
1700 ms dwell we're hiding the compile *inside*. So we call `gl.compileAsync` **imperatively** from a
small in-canvas component and resolve our own ready flag — the same result, under our control.

### 2.4 OffscreenCanvas + Web Worker — the heavy INP hammer (DEFERRED)

Moving the entire renderer to a worker via `OffscreenCanvas` takes shader compile, parsing, and the rAF
loop fully off the main thread (Utsubo *WebGL & Three.js Site SEO 2026*; web.dev INP). It is the
*maximal* INP fix. The cohesion map (§2.8 of doc 29) already adjudicates this: it "complicates the
r3f/Lenis/scroll plumbing" — pointer events, Lenis' `window.scrollY` coupling, and the `forge` store
reads would all need a postMessage bridge — for a marginal gain *over* `compileAsync` once the steady
loop is already alloc-free. **Verdict: deferred.** `compileAsync` + alloc-free loop captures the
first-interaction spike (the thing being judged) at a fraction of the risk; OffscreenCanvas is a
post-judge candidate (29 §9.4, restated in §9 below).

### 2.5 Alloc-free `useFrame` — the steady-state half (RECOMMENDED)

The 2025/2026 r3f consensus (r3f *Performance pitfalls*; Codrops *Building Efficient Three.js Scenes*,
Feb 2025; Utsubo *100 Tips 2026*): **never allocate in the loop, never `setState` in the loop.** "Re-pool
objects when you can"; "instantiating `new THREE.Vector3()` in tight loops causes frequent allocation
and GC, degrading performance"; "calling setState 60 times/sec will tank your frame rate … mutate via
refs." R3F's reconciler runs *outside* the rAF loop — `useFrame` callbacks fire directly inside the
single `requestAnimationFrame`, and React only re-renders on prop changes — so an alloc-free loop reading
a mutable store performs within a few percent of vanilla three. GAELWORX already lives this pattern
(`forge` store mutated outside React, `CameraRig` reuses a module-level `tmp`); the work here is to
**audit it closed** so no future writer (the `ForgeDriver`, the sparks, the A/E radiance writer) re-opens
it.

### 2.6 TSL / WebGPU compile model (PORTABLE FUTURE, not shipped)

Under `WebGPURenderer`, programs are WGSL pipelines built lazily on first use; the modern path warms them
via the renderer's async compile too, and TSL node materials hash by their node graph. Maxime Heckel's
*Field Guide to TSL and WebGPU* (Oct 2025) and the Utsubo WebGPU migration guide (2026) describe
`RenderPipeline` (r183) replacing `EffectComposer`, with the same "compile before you reveal" discipline.
We don't ship WebGPU to the judge (29 §2.7 — the WebGL2 fallback branch is the *less*-tested path), but
the compile-gate component is authored so its body swaps `gl.compileAsync` for the WebGPU equivalent with
no structural change.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A single in-canvas `<ForgeWarmup/>` component that, on mount, sets every tier `#define`/cache-key,
forces one off-screen warm render of the heaviest material permutation, awaits
`gl.compileAsync(scene, camera)`, and only then flips `forge.compiled = true`; the loader's dismiss is
gated on `forge.compiled && fonts.ready && minDwell`. In parallel, a closed audit of all `useFrame`
bodies guaranteeing zero `new`/`setState` in steady state, enforced by a lint-style grep + a CI alloc
probe.** Concretely:

1. **Compile gate.** A `<ForgeWarmup/>` inside `<Canvas>` (so it has `useThree().gl/scene/camera`) calls
   `await gl.compileAsync(scene, camera)` after the slab + env + (route hero) are in the graph, then
   `forge.compiled = true`. Because the slab mounts immediately in `ForgeCanvas`, and the env is the
   only other always-present program, the boot warm-up covers the home program set. Route heroes warm on
   their own mount (the jewel) via the same component re-running on a `scene`-graph-change effect — or, on
   `high`, a one-time **pre-warm of the jewel program off-screen at boot** so the first `/web` nav
   doesn't stall either (see §4.4).

2. **Loader coordination.** `Loader.jsx` already awaits `Promise.all([fonts, minTime])`. Add
   `forge.compiledPromise` to that `Promise.all`. The 1700 ms dwell *hides* the compile; if compile is
   faster than 1700 ms (it usually is), the loader still waits its brand-minimum and the compile is free;
   if compile is slower (cold cache, weak device), the loader holds a beat longer rather than dismissing
   into a stall — strictly better.

3. **Cache-key correctness before warm-up.** Set `material.customProgramCacheKey = () =>
   'forge:'+GW_FBM_OCTAVES+':'+(transmissive?1:0)` (deep-dive 39 §4.3) **before** the warm render, so
   `compileAsync` warms the *exact* program the runtime draws. This is the #1 silent-miss guard (2.2).

4. **Post-chain order guard.** Ensure `EffectComposer`/`EffectPass` exists (or is explicitly deferred)
   in a way that doesn't trip the r158 MRT-before-compileAsync bug (#31220): warm the **scene** programs
   with `compileAsync`, let the composer build its own pass programs on its first `render()` (one frame,
   under the loader), and never call `compileAsync` *between* composer construction and its first render.

5. **Alloc-free loop, closed.** Every `useFrame` writes only `.value =`, `.set()`, `.copy()`, `.lerp()`,
   `.damp()` on pre-allocated objects. `Embers` stops minting a per-frame anything (already true — it
   only writes `uTime.value`); `Embers`' separate `uTime` either binds the shared `U.uTime` (deep-dive
   39) or stays local but still alloc-free. A grep gate + a 5-second headless alloc probe (§4.6) prove
   it.

**Justification.** This is the precise pairing the cohesion map's §10 budget table calls "INP insurance,"
built to the two documented sharp edges (cache-key, MRT order) that the 2025 three.js issues surfaced.
It is minimum-surface-area: one new headless component, one `Promise.all` addition in the loader, one
cache-key line per hot material (already needed for tiers), and an audit. It changes *no look* — the
acceptance test is byte-identical `/`, just without the first-scroll lurch. And it composes cleanly with
deep-dive 39: the warm-up compiles the *same* `U`-bound programs the driver feeds, so warming and driving
share one program identity.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (already in this build)

- `three` r17x (has `compileAsync` since r158; `KHR_parallel_shader_compile` auto-detected by the
  WebGL2 backend). `@react-three/fiber` v9/v10, `@react-three/drei` (`Preload` available but we go
  imperative), `@react-three/postprocessing` + `postprocessing`.
- **No new runtime dependency.** `gl.compileAsync` is vanilla three; the audit is a code change + a CI
  probe script. WebGPU/TSL deliberately not added (29 §2.7).

### 4.2 `forge` store additions (edit `src/store.js`)

```js
export const forge = {
  // ...existing fields...
  ready: false,        // loader dismissed (already present)
  compiled: false,     // NEW: every hero/env/post program is warm (compileAsync resolved)
  // a deferred promise the Loader can await; resolved by <ForgeWarmup/>
  compiledResolve: null,                       // NEW
}
// module-scope deferred promise so the Loader (outside the Canvas) can await the
// in-canvas warm-up without prop-drilling. Created once, alloc-free at steady state.
forge.compiledPromise = new Promise((res) => { forge.compiledResolve = res })
```

### 4.3 `<ForgeWarmup/>` — the compile gate (new: `src/scene/ForgeWarmup.jsx`)

```jsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { forge } from '../store.js'

/**
 * The SOLE async-compile authority. Mounted once inside <Canvas>, AFTER the slab +
 * env exist in the graph. Walks the live scene with the live camera and awaits
 * KHR_parallel_shader_compile so the FIRST scroll hits warm programs (no sync
 * compile stall → protects INP at the critical first interaction). Renders nothing.
 *
 * ORDER CONTRACT (from r158 bugs):
 *  - cache keys (GW_FBM_OCTAVES / transmissive) are set on materials BEFORE this runs,
 *    so we warm the EXACT program drawn at runtime (no wrong-cache-key silent miss).
 *  - we compile the SCENE programs here; the EffectComposer builds its OWN pass
 *    programs on its first render() (one frame, still under the loader). We never call
 *    compileAsync between composer construction and its first render (#31220).
 */
export default function ForgeWarmup() {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    let cancelled = false
    // give the slab + env one tick to be in the graph, then warm.
    const id = requestAnimationFrame(async () => {
      try {
        if (gl.compileAsync) {
          await gl.compileAsync(scene, camera)   // KHR_parallel_shader_compile path
        } else {
          gl.compile(scene, camera)              // ancient fallback: sync, still under loader
        }
      } catch (e) {
        // never let a warm-up failure strand the loader — fail OPEN.
        if (import.meta.env.DEV) console.warn('[ForgeWarmup] compile failed, proceeding', e)
      }
      if (cancelled) return
      forge.compiled = true
      forge.compiledResolve?.()
    })
    return () => { cancelled = true; cancelAnimationFrame(id) }
  }, [gl, scene, camera])

  return null
}
```

### 4.4 Pre-warming the route heroes (the jewel) — optional `high`-tier boot warm

The slab + env are always in the graph at boot, so 4.3 warms them. The jewel (`/web`) and future
chambers mount lazily, so their *first* nav would stall. Two options, gated by tier:

- **`high`:** at boot, construct the jewel material *once* off-screen (no mesh added to the visible
  scene — a throwaway `THREE.Scene` holding just the jewel mesh) and `await gl.compileAsync(warmScene,
  camera)` for it too, **with its own `customProgramCacheKey` matching the runtime jewel's** so the
  program identity is shared (three caches programs by key globally on the renderer — warming it in a
  throwaway scene still populates the renderer's program cache). Dispose the throwaway geometry; the
  *program* stays cached.
- **`low`/`static`:** skip hero pre-warm (the jewel's transmission/CA are off on `low`; the simpler
  program compiles fast enough on nav). Only the slab + env are warmed.

```jsx
// inside <ForgeWarmup/>, after the main scene warm, on high only:
if (forge.quality === 'high') {
  const warmScene = new THREE.Scene()
  const jewel = buildJewelMesh()          // same material + customProgramCacheKey as runtime
  warmScene.add(jewel)
  await gl.compileAsync(warmScene, camera) // populates the renderer's GLOBAL program cache
  jewel.geometry.dispose()                 // program stays cached; geometry freed
  jewel.material.dispose()
}
```

> Cohesion note: the jewel's material here binds the **same `U` pool** (deep-dive 39) and the same
> `GW_FBM_OCTAVES` define, so the program warmed off-screen is byte-identical to the one the `/web`
> chamber draws. Warming and drawing share one program because they share one cache key.

### 4.5 Loader coordination (edit `src/ui/Loader.jsx`)

```jsx
useEffect(() => {
  let outT, goneT
  const fonts = (document.fonts && document.fonts.ready) || Promise.resolve()
  const minTime = new Promise((r) => setTimeout(r, 1700))          // brand dwell (unchanged)
  const compiled = forge.compiledPromise || Promise.resolve()      // NEW: warm programs
  // The 1700ms dwell HIDES the compile. If compile < 1700ms → free. If compile is
  // slower (cold/weak) → hold a beat rather than dismiss INTO a stall.
  Promise.all([fonts, minTime, compiled]).then(() => {
    setPhase('out')
    forge.ready = true
    goneT = setTimeout(() => setPhase('gone'), 1200)
  })
  return () => { clearTimeout(outT); clearTimeout(goneT) }
}, [])
```

Two safety rails so the loader can never hang on a warm-up that never resolves:
- **`<ForgeWarmup/>` fails open** (4.3 catch resolves anyway).
- **The scene mounts on `requestIdleCallback` *and* the canvas may not exist on `static`.** On `static`
  there's no Canvas → `forge.compiledPromise` would never resolve, so seed it resolved on `static`:
  in `ForgeExperience`, `if (quality === 'static') forge.compiledResolve?.()`. Add a hard timeout
  fallback too: `Promise.race([compiled, new Promise(r => setTimeout(r, 4000))])` so a pathological
  device still dismisses.

### 4.6 The alloc-free audit (the steady-state half)

**Current state of each `useFrame` (audited against the repo):**

| Loop | Allocation in steady state? | React state in loop? | Verdict |
|---|---|---|---|
| `CameraRig.useFrame` | No — reuses module `tmp` (`new THREE.Vector3()` once at module load) | No — mutates `forge.*` + `camera.position` | **clean** |
| `ObsidianSlab.useFrame` | No — writes `uniforms.*.value`, `.lerp()`, `.damp()` on preexisting objects | No | **clean** |
| `Embers.useFrame` | No — writes `material.uniforms.uTime.value` only | No | **clean** |
| `ForgeDriver.useFrame` (deep-dive 39) | Must stay no — vectors `.set()`/`.lerp()` in place, never reassign `.value` | No | **enforce** |

The repo is *already* alloc-free — the job is to **keep it closed** as new writers land. Two gates:

**(a) Grep gate (cheap, CI or pre-commit):**
```sh
# fail if any useFrame body allocates or sets React state in the hot path
rg -n 'useFrame' -A 30 src/scene src/ui \
  | rg -n 'new (THREE\.)?(Vector|Color|Matrix|Quaternion|Euler)|setState|set[A-Z]\w+\(' \
  && echo "ALLOC/STATE IN useFrame — fix before commit" && exit 1 || true
```
(Tune to ignore module-scope `const tmp = new ...` declarations — only flag `new`/`set*` *inside* the
callback body.)

**(b) Headless alloc probe (the real proof):** drive the scene 5 s under Playwright with
`performance.measureUserAgentSpecificMemory()` or repeated `performance.memory.usedJSHeapSize` samples
across forced GCs; the steady-state slope must be ~flat. A rising saw-tooth = a hidden allocation.
This is the same `qa-route` harness the repo already uses; add a memory-slope assertion.

**Rule for every future writer (the contract):**
- Pre-allocate every `Vector*/Color/Matrix` at module or `useMemo` scope; mutate in place.
- Never reassign a shared uniform's `.value` object (orphans every material's reference — deep-dive 39
  pitfall #1); always `.set()`/`.copy()`.
- Never call `setState`/`useState` setters, Zustand `set`, or anything that re-renders from inside
  `useFrame`. Read/write the mutable `forge` store only (store.js pattern).
- `PerformanceMonitor` callbacks (29 §4.5) write `forge.perf` (a plain number), **never** React state,
  so a thermal regression never re-renders mid-scroll.

### 4.7 Key params / where it hooks the master system

- `forge.compiled` / `forge.compiledPromise` — the new boot-coordination signals; consumed by `Loader`.
- `gl.compileAsync(scene, camera)` — the one async-compile call; the camera is the same one `CameraRig`
  drives, so the warmed program matches the runtime fog/lights/camera state.
- `customProgramCacheKey = 'forge:'+GW_FBM_OCTAVES+':'+transmissive` — the shared identity between the
  warm-up and the runtime draw; it is the *same* key deep-dive 39 §4.3 and doc 29 §4.7 require for tier
  correctness. One key, three jobs: tier recompile, program reuse, warm-up-matches-runtime.
- The warm-up touches **no uniforms** — it compiles programs; the `<ForgeDriver/>` (deep-dive 39) then
  drives the shared `U` pool through those warm programs. Compile-gate and uniform-pool are orthogonal
  and compose.

---

## 5. COHESION — shared palette / lighting / uniforms

This deep-dive carries no color and no light of its own — it is the *timing layer* under the one-world
system, and it binds to it precisely:

- **One program identity, warmed and drawn.** Because every hot material binds the shared `U` pool and
  the same `GW_FBM_OCTAVES` define (deep-dive 39; cohesion map §4.2), the program `compileAsync` warms
  is byte-identical to the one drawn. The compile gate *protects* cohesion: it can't warm a "different
  orange" because there is only one program per cache key.
- **The strike beat stays synchronous-in-frame.** A strike (`forge.strikeAt`) surges the slab veins,
  jewel edges, sparks, and bloom *in the same frame* (cohesion map §7.6) — but only because no element
  recompiles on a strike (strike is a *uniform* write, never a define change). The compile gate's job is
  to ensure that synchrony is never broken by a *first-draw* compile masquerading as a strike-frame
  stall. Warm everything once; from then on the heartbeat is pure uniform mutation.
- **`static` tier stays on-brand and never hangs.** On `static` there is no Canvas; we resolve
  `compiledPromise` immediately so the loader dismisses to the frozen warm-vein slab poster (cohesion
  map §10; doc 29 §3) — the degraded path is dignified, and the compile gate doesn't strand it.
- **Degrades uniformly.** The compile gate honors the tier define: it warms a 4-octave program on `high`,
  a 3-octave on `low`, a 2-octave on `static` — the *same* program the runtime then draws. Dropping a
  tier thins detail everywhere (cohesion map §7.9) *and* warms the thinner program, so a tier switch
  mid-session pre-warms the new define before the first frame that needs it (29 §9.2 thermal ladder).
- **One clock, one rAF.** The warm-up uses a single `requestAnimationFrame` to defer to graph-ready,
  then resolves; it never opens a second loop (cohesion map §7.6). The steady loop remains the one r3f
  `useFrame` scheduler.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

- **The spike this removes is the biggest single INP risk in the scene.** Doc 29 §10 reserves "throttle
  headroom" for steady state but explicitly lists `compileAsync` as the *transition* insurance. A
  `MeshPhysicalMaterial` + transmission + clearcoat + iridescence program compiling synchronously on
  iPhone Safari is a multi-hundred-ms main-thread block; moving it under the loader's existing 1700 ms
  dwell makes it **zero added wall-clock** (the user is already watching the ignition mark) and removes
  the entire risk from the first-scroll interaction.
- **`compileAsync` cost is off-thread where the extension exists** (iPhone 15 Safari WebGL2 has it), so
  it doesn't even eat the loader's main-thread budget — the GPU driver compiles on its own threads while
  the loader animation runs at 60 fps. Where absent, it falls back to sync-under-the-loader: still hidden
  from the user, never worse.
- **Alloc-free loop = no GC saw-tooth during scroll.** A single `new Vector3()`/frame is ~3,600
  allocs/min; the resulting periodic GC pause is a 1–10 ms main-thread stall that, if it lands during a
  scroll interaction, *is* an INP hit. The repo is already clean (4.6 table); the gates keep it clean as
  the pour-front, A/E radiance, and spark writers land. This is "alloc-free per-frame loop (no `new` in
  `useFrame`)" from §10, made enforceable.
- **No `setState` mid-scroll = no React reconciliation on the hot path.** `forge.*` mutation + the
  `PerformanceMonitor → forge.perf` number (29 §4.5) means a thermal regression re-trims quality
  *without* a re-render — the difference between "designed for 60" and "holds 60 without a reconciliation
  hitch mid-scroll."
- **Budget impact: net negative cost.** The warm-up adds **one** off-screen warm render at boot (paid
  under the loader) and **zero** steady-state cost. It actually *reduces* peak main-thread time by moving
  compile off the first interaction. Draw calls, fill-rate, and the §10 frame table are unchanged.
- **LOD / fallback:** `high` warms slab + env + jewel; `low` warms slab + env; `static` resolves the
  gate immediately (no Canvas). A 4 s `Promise.race` timeout guarantees the loader always dismisses.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**

1. **Add `forge.compiled` + the deferred `compiledPromise` to the store first**, and resolve it
   immediately on `static` (and as a 4 s race fallback). Build green. The loader now awaits a
   promise that already resolves — no behavior change yet, proves the wiring.
2. **Set `customProgramCacheKey` on the slab (and jewel) before anything warms** — the tier define +
   transmissive flag. This is the silent-miss guard; do it before `compileAsync` exists or the warm-up
   compiles the wrong program (2.2; forum *wrong shader cache key* 2025).
3. **Add `<ForgeWarmup/>` inside `<Canvas>`**, after the slab + env in the graph. Verify
   `forge.compiled` flips true on a real load and the loader waits for it. (Fail-open catch in place.)
4. **Gate the loader dismiss** on `compiledPromise`. Now the first scroll hits warm programs.
5. **Add the `high`-tier jewel pre-warm** off-screen (4.4) only after the home warm-up is proven, so the
   first `/web` nav doesn't stall either. One variable at a time.
6. **Land the alloc grep gate + the headless memory-slope probe last**, once the loop is confirmed clean,
   so it guards future writers rather than chasing a current bug.

**Pitfalls (each has bitten this class of build):**

- **Warming the wrong program (cache-key miss).** If `customProgramCacheKey` isn't set/stable before
  `compileAsync`, you warm program A and draw program B → the stall returns silently on first draw. Set
  the key first; keep it stable. (three forum 2025; deep-dive 39 §2.1.)
- **`compileAsync` before the MRT/composer (#31220, June 2025).** Don't call `compileAsync` *between*
  composer construction and its first `render()`. Warm scene programs; let the composer warm its passes
  on its own first render under the loader. Verify the composer still works after adding the warm-up.
- **Compiling an empty/unmounted scene.** `compileAsync` only warms what's in the graph *now*. Defer one
  rAF so the slab + env are mounted, and pre-warm route heroes explicitly — they aren't in the boot
  graph.
- **The loader hanging on a warm-up that never resolves.** Fail open in the catch, seed-resolve on
  `static`, and `Promise.race` a 4 s timeout. The loader must *never* be hostage to the GPU.
- **A future writer re-opening allocation.** The pour-front / A/E radiance / spark writers are the risk;
  the grep gate + memory probe catch a `new Vector3()` or a `.value = new Color()` before it ships. (Re-
  assigning a shared `.value` also breaks cohesion — deep-dive 39 pitfall #1 — so this guard does double
  duty.)
- **`setState` smuggled in via `PerformanceMonitor`/leva.** Regression callbacks must write `forge.perf`
  (a number), not React state; leva writes are dev-only (`?debug`) and must not run in production frames.
- **Assuming `compileAsync` exists.** Guard `if (gl.compileAsync)` with a `gl.compile` fallback so an
  older three or a stripped backend still warms (synchronously, under the loader) rather than throwing.
- **Measuring INP on desktop.** The spike is device-specific; profile the *first scroll* on a real iPhone
  15 (Safari remote Web Inspector) — desktop compiles too fast to reproduce the stall (29 §7).

**Verification (the repo way):** `npm run build` green → `qa-route` at 393×852 + 1440×900 with **0
console errors** (SwiftShader compiles the GLSL in CI; a chunk-marker/cache-key typo surfaces as an
error) → the memory-slope probe over a 5 s drive → **then the iPhone 15 OLED read**: load cold, flick the
wheel the instant the loader lifts, and confirm the first scroll is buttery (no lurch). The INP number is
the deliverable; capture it in the Web Inspector Performance panel under the *first* interaction.

---

## 8. SOURCES (2025–2026)

1. three.js docs — *WebGLRenderer.compileAsync / Renderer.compileAsync* (uses
   `KHR_parallel_shader_compile`, returns a Promise that resolves when the scene renders without
   shader-compile stalls). https://threejs.org/docs/pages/WebGLRenderer.html ·
   https://threejs.org/docs/pages/Renderer.html (live ref, 2025–2026).
2. mrdoob/three.js Issue #31220 — *"Calling renderer.compileAsync before a MRT breaks the renderer"*
   (compileAsync-before-postprocessing-MRT order bug, WebGL + WebGPU).
   https://github.com/mrdoob/three.js/issues/31220 (June 2025).
3. three.js forum — *"WebGLRenderer compile async and possible wrong shader cache key."*
   https://discourse.threejs.org/t/webglrenderer-compile-async-and-possible-wrong-shader-cache-key/89007
   (2025) — warm-up must use the runtime `customProgramCacheKey` or it compiles the wrong program.
4. pmndrs/react-three-fiber Issue #3073 — *"Exploring asynchronous compilation of materials with
   Suspense"* (74.6 ms M1 frosted-glass compile; `compileAsync` since three r158; Suspense integration;
   `KHR_parallel_shader_compile` browser caveat). https://github.com/pmndrs/react-three-fiber/issues/3073
   (open through 2025).
5. Khronos — *KHR_parallel_shader_compile Extension Specification* (non-blocking `COMPLETION_STATUS_KHR`
   poll vs blocking `COMPILE_STATUS`/`LINK_STATUS`).
   https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/ · MDN
   *KHR_parallel_shader_compile*. https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile
   (2025).
6. web.dev — *Optimize Interaction to Next Paint (INP)* (input delay / processing / presentation delay
   decomposition; < 200 ms threshold; avoid long main-thread tasks).
   https://web.dev/articles/optimize-inp (2025/2026 thresholds).
7. Utsubo — *WebGL & Three.js Site SEO: Make 3D Sites Rankable (2026)* (INP/CWV for WebGL,
   OffscreenCanvas + worker, async shader compilation, main-thread budget).
   https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide (2026).
8. Utsubo — *100 Three.js Tips That Actually Improve Performance (2026)* (re-pool objects, no `new` in
   loops, program reuse via identical uniform/define definitions, dispose discipline).
   https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026).
9. R3F docs — *Performance pitfalls* (no allocation / no `setState` in `useFrame`; mutate refs;
   reconciler runs outside the rAF loop). https://r3f.docs.pmnd.rs/advanced/pitfalls (2025–2026).
10. Codrops (Tympanus) — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining
    Quality* (re-pool temporaries, memoize materials, GC avoidance).
    https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
    (11 Feb 2025).
11. MoldStud — *Exciting New Features Coming to Three.js* (`compileAsync` pre-warm cuts start-up hitches
    ~70% vs synchronous compile; `onBeforeCompile` warm-up gotchas).
    https://moldstud.com/articles/p-exciting-new-features-coming-to-threejs-what-developers-need-to-know
    (2025/2026).
12. Maxime Heckel — *Field Guide to TSL and WebGPU* (WGSL pipeline compile model, `RenderPipeline`
    r183, "compile before reveal" under WebGPU; the TSL port target).
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (14 Oct 2025).

---

## 9. DEEP-DIVE CANDIDATES

1. **The route-hero pre-warm matrix.** Formalize *which* chamber programs to pre-warm at boot vs warm-on-
   nav per tier — the jewel, the casting-room molten material, the channel-hall SDF, the arch mouth —
   each with its own `customProgramCacheKey`, and benchmark first-nav INP with/without boot pre-warm on a
   real iPhone 15. The trade is boot time (more programs warmed under the loader) vs first-nav smoothness.
2. **OffscreenCanvas + Web Worker cost/benefit (the 29 §9.4 hammer).** Scope moving the renderer to a
   worker for the *maximal* INP win against the Lenis/`window.scrollY`/pointer/`forge`-store postMessage
   bridge complexity — and quantify how much INP headroom `compileAsync` + alloc-free already captures,
   to decide if the worker is ever worth it pre-judge.
3. **The CI alloc/INP regression harness.** Build the headless memory-slope probe + a synthetic-first-
   scroll INP measurement into `qa-route` so every PR proves "no new allocation in `useFrame`" and "first
   interaction < 200 ms (proxy)" — turning the §4.6 audit into a permanent gate, with the grep as the
   fast pre-check and the probe as the truth.
4. **`compileAsync` under the tier-switch / thermal ladder.** When `PerformanceMonitor` demotes
   `high`→`low` mid-session (29 §9.2), the `GW_FBM_OCTAVES` define changes → a new program must compile.
   Design a *background* `compileAsync` of the demoted-tier programs *before* the swap (warm the 3-octave
   program while still drawing the 4-octave) so the thermal demotion itself doesn't introduce a compile
   stall — the same insurance, applied to the runtime tier transition rather than just boot.
