# 49 — OffscreenCanvas + Worker vs `compileAsync`: The INP Decision

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 49_
_Cluster: G-architecture-perf · Focus: scope moving the single renderer into a Web Worker (the INP win)
against the scroll / pointer / Lenis plumbing complexity, and whether `compileAsync` alone captures most of
the INP gain at a fraction of the risk._

> Read `00-COHESION-MAP.md` §4 (single-renderer multi-chamber scene graph), §10 (the iPhone-15 budget +
> the "INP insurance: `renderer.compileAsync` before first interaction" line), and phase1
> `27-scroll-camera-paths-r3f.md` (Lenis-on-the-r3f-loop) + `31-single-renderer-multiworld-arch.md` first.
> Phase-2 `47-tiered-detection-perf-ladder.md` owns the thermal ladder; **this doc owns the orthogonal
> question of which THREAD the one renderer lives on**, and whether the cheaper `compileAsync` fix is
> sufficient. The cohesion map already commits to one renderer, one `<Canvas>`, one composer, one `Points`,
> one store, one Lenis-on-one-rAF. The only thing in play here is: does that single context run on the main
> thread (with `compileAsync` to de-stall the first scroll) or transfer to a worker (for a structurally
> lower INP, at the cost of re-plumbing every input the world reads)?

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten forge on **one** `THREE.WebGLRenderer`, route-swapped into eight chambers, sold at
Active-Theory / Lusion caliber, holding 60fps on an **iPhone 15 OLED held in one hand, in a Safari tab.**
The cohesion map's §10 names the device as "the whole game" and lists, under runtime adaptivity, a single
INP line: _"`renderer.compileAsync` before first interaction so a multi-hundred-ms shader compile doesn't
block the first scroll; alloc-free per-frame loop."_ This deep-dive is the full investigation behind that
one line — and the much larger architectural question it implies.

The problem is concrete and measurable. GAELWORX's hero is **near-full-screen emissive fbm** — the obsidian
slab vein shader, the molten pour, basalt, heat-haze, smoke, caustics — all `MeshPhysicalMaterial` +
`onBeforeCompile` chunk injection (`ObsidianSlab.jsx`, `shaders.js`), plus a merged `EffectPass` post
chain. That is a **lot of long, branchy GLSL** to compile and link. On the first frame the slab is visible,
three.js compiles and links every program *synchronously on whatever thread the renderer is on* — and on a
mobile GPU that link (the GPU-readback to get `LINK_STATUS`) can stall the thread for **tens to hundreds of
milliseconds** (the documented "74.6 ms in total on an M1" figure is desktop; an A16 under a cold scene is
worse and bunched into the first second). If that thread is the **main thread**, that stall lands exactly
when the user is doing their first thing — the **first scroll** that drives the whole Lenis→`forge.scroll`→
camera→`uTemp` journey. A 200–400 ms hitch on the first scroll input is a catastrophic **INP** (Interaction
to Next Paint) score, and worse, it reads as "the site froze the instant I touched it" on the one device the
whole build is tuned for.

There are two structurally different cures, and they are not the same size:

1. **`compileAsync`** — keep the renderer on the main thread, but pre-compile/link every program *before*
   the curtain lifts, using the non-blocking `KHR_parallel_shader_compile` poll so the link doesn't stall.
   A ~30-line change, fully inside the existing architecture, already named in the budget.
2. **OffscreenCanvas + Web Worker** — `transferControlToOffscreen()` the canvas and run the *entire* r3f
   render loop, shader compile, and post chain on a **worker thread**, so a compile stall (or a heavy frame,
   or a GC pause in the 3D code) **cannot touch the main thread at all**. The main thread keeps painting the
   DOM headline, the Nav, and — critically — the **native scroll**, so INP stays low *by construction*. A
   large change that re-plumbs every input the world reads (pointer, resize, **scroll/Lenis**, route) across
   a `postMessage` boundary, and forks the app into a worker build + a main-thread fallback.

This doc scopes (2) honestly against (1): the size of the INP win, the plumbing tax — especially on Lenis,
which the cohesion architecture deliberately runs on the one r3f rAF (phase1 doc 27 §4a) — and whether the
cheaper fix captures "most of it" for the judge. **The verdict steers the §8 build order, the
`ForgeCanvas.jsx` mount, and whether `forge.lenis` plumbing changes shape.** It does not touch a single
shader, palette stop, or uniform value — the worker question is about *where the one context runs*, not
*what it draws*, so cohesion is invariant under the choice either way (§5).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Three sub-problems sit under "get the compile stall off the user's first interaction": **(A)** async compile
on the main thread, **(B)** transferring the whole renderer to a worker, and **(C)** the input plumbing that
a worker forces. Each has a small, dated 2025–2026 field.

### 2.1 (A) Async shader compile on the main thread

**`renderer.compileAsync(scene, camera)` (three.js ≥ r158) — the cheap, in-architecture fix.** Added in
r158 and stable through r17x, `compileAsync` returns a `Promise` that resolves when every material in the
scene has finished compiling *and linking*, using `KHR_parallel_shader_compile`'s `COMPLETION_STATUS_KHR`
poll so the engine can check link status **without the blocking GPU readback** that the synchronous
`compile()` path incurs (three.js docs, `WebGLRenderer.compileAsync`, 2025). The pattern in r3f: in a
`useEffect` after the scene graph and all hot materials are mounted, `await gl.compileAsync(scene, camera)`,
then lift the intro curtain / enable the first interaction. r3f's own roadmap (pmndrs/r3f issue #3073,
"Exploring asynchronous compilation of materials with Suspense," live 2025) wires this into React's
lifecycle so the tree **Suspends during compilation** and attaches when ready — the idiomatic r3f shape.

- **Quality:** No visual change — it only moves *when* the compile happens (during the loader, not on first
  scroll). The world is byte-identical.
- **Perf / INP:** Captures the **specific** INP regression GAELWORX has — the first-scroll compile stall —
  by relocating it behind the loader where there is no pending interaction to delay.
- **Mobile / Safari caveat (load-bearing):** `compileAsync` only *de-stalls* where
  `KHR_parallel_shader_compile` is present and where the driver actually compiles in parallel. The extension
  has broad WebGL2 support, but the Khronos/registry testing (and multiple 2025 write-ups) note that **on
  several browser/OS combinations the main thread still hitches during the final link/program-upload even
  with the extension** — the poll is non-blocking, but the actual GL link work the driver schedules can
  still land on the GL thread, which on a main-thread renderer *is* the main thread. So `compileAsync`
  reliably moves the stall *off the interaction* (it happens during the loader), but it does **not guarantee
  the stall vanishes** — it guarantees it lands somewhere the user isn't waiting on input. For an
  intro-loader build (which GAELWORX has), that is exactly the right guarantee.
- **Complexity:** ~30 lines, zero new deps, zero architecture change. Already in the budget.

**Pre-warm by rendering off-screen once.** The older pattern (render every material once to a 1×1 scissor
before the real scene) is strictly worse than `compileAsync` now — it *forces* a synchronous compile (the
thing we're avoiding) rather than polling. Reject in favor of `compileAsync`; only relevant as a fallback on
contexts lacking the extension, and even there the deferred micro-benchmark of doc 47 §4.4 already renders
~30 frames behind the loader, which warms the programs as a side effect.

### 2.2 (B) Moving the renderer to a Web Worker

**`@react-three/offscreen` (pmndrs) — the framework path.** The maintained pmndrs package: a main-thread
`<Canvas worker={worker} fallback={<Scene/>}>` that `transferControlToOffscreen()`s the canvas to a worker,
and a worker entry `render(<Scene/>)` from `@react-three/offscreen`. It **forwards DOM events to the worker
and shims the `document`/`window` interfaces** so most of the ecosystem (drei, Rapier, postprocessing)
works, and **auto-falls-back to a main-thread `<Canvas>`** where OffscreenCanvas is absent (pmndrs/
react-three-offscreen, README, ~525★, active through 2025–2026).

- **Quality:** Identical render — same three.js, same shaders, same composer; only the thread differs.
- **Perf / INP:** This is the **structural** INP win. With the render loop, shader compile, `.glb` parse,
  and texture decode all on the worker, the main thread is "simply not the bottleneck anymore" — the 2026
  AthenaHQ case study (utsubo, "WebGL & Three.js Site SEO," 2026) reports **INP stayed under 100 ms through
  the entire load sequence** because compile/parse/decode never touched the main thread; the headline was
  visible and scroll/click were responsive while the worker compiled, and the animation faded in when ready.
  This is a *different class* of guarantee than `compileAsync`: not "the compile happens during the loader,"
  but "no 3D work of any kind can ever block input."
- **Mobile / Safari (the decisive 2025–2026 update):** The historical blocker — _"OffscreenCanvas + WebGL is
  not supported in Safari, so you maintain two forks"_ (the README's own long-standing caveat) — **has
  substantially lifted.** Safari shipped OffscreenCanvas at **16.4**, and **`new OffscreenCanvas().getContext
  ("webgl2")` works in Safari 17 / iOS 17** (mdn/browser-compat-data #21127, 2025 — filed precisely because
  the compat tables under-reported working Mobile Safari behavior). **As of the June 2026 Safari release,
  Apple added/repaired 3D OffscreenCanvas WebGL support, fixed the OffscreenCanvas `contextlost` event, and
  fixed OffscreenCanvas as a `TexImageSource`** (Releasebot Safari updates, June 2026). So on the **iPhone
  15 judge device (iOS 17/18-class)**, worker WebGL2 is a supported path in 2026, not the dead end it was in
  2023. The `fallback` prop still matters for the residual unsupported tail (very old iOS, locked-down
  privacy modes), but it is no longer "Safari = always fallback."
- **Complexity (the real cost):** High, and concentrated in exactly GAELWORX's sensitive spots:
  - The worker scene must be **self-contained** — `render(<Scene/>)` runs in a context with **no DOM**.
    Anything needing the DOM breaks: **`drei/Html`, `drei/View` (scissoring), `ScrollControls`**, and any
    component reading `window`/`document` directly. The cohesion map reserves `<View>` for the four-plinths
    route (§4.3) and a portal-FBO crossfade for marquee transitions — `<View>` **does not work in the
    worker** (it needs DOM tracking), so the plinths route would need a non-`<View>` path or a main-thread
    exception.
  - **Build/bundler friction:** Vite needs the worker plugin config; the React fast-refresh plugin injects
    styles into a non-existent `document` in the worker and must be disabled there (`fastRefresh: false`);
    Next.js needs SSR off for the worker. GAELWORX is Vite + a prerender step — the prerendered static HTML
    (the AEO/SEO path) must stay on the main thread regardless, so the worker only owns the canvas.
  - **Two code paths to QA:** the worker app and the main-thread fallback are *the same React tree* but run
    in two environments; every scene change must be verified in both, doubling the `qa-route` surface.

**Raw `transferControlToOffscreen()` + hand-rolled worker (the studio path).** Skip the pmndrs wrapper:
`canvas.transferControlToOffscreen()` on the main thread, `postMessage` the offscreen handle to a worker,
build the three.js renderer there, and proxy events yourself (the canonical Evil Martians / three.js-
fundamentals pattern, still cited in 2025–2026 roundups). **Pros:** total control over exactly which events
cross and how they're throttled; no wrapper assumptions. **Cons:** you re-implement the whole event-proxy +
fallback + shim layer that `@react-three/offscreen` already ships, and you lose the r3f `render()` worker
entry. For an r3f app, reject in favor of the maintained wrapper unless the wrapper's event model proves
insufficient.

### 2.3 (C) The input plumbing a worker forces — the Lenis problem

This is the sub-topic the FOCUS flags, and it is where the worker path collides hardest with the GAELWORX
architecture. **Lenis runs on the main thread, by design and necessity.** Lenis "wraps the browser's own
scroll" and "keeps native APIs intact" (lenis.dev / darkroomengineering, 1.3.x, 2025–2026) — it *is* a
main-thread layer over native scroll; it cannot run in a worker because there is no scroll, no `window`, no
native scrollbar in a worker. The cohesion architecture (phase1 doc 27 §4a) deliberately runs **one** Lenis
instance and pumps its `raf` from the r3f `useFrame` so there is a single loop driving both
`lenis.raf(t)` and the camera that reads `forge.scroll`.

A worker renderer **breaks that single-loop coupling**, because the render loop is now in the worker and
Lenis must stay on the main thread. The consequences, concretely:

- **Lenis stays main-thread; its output must be proxied to the worker.** The main thread keeps the Lenis
  instance, listens to its `scroll` event (`{ progress, velocity, direction }`), and `postMessage`s those
  scalars to the worker every scroll tick (or every main-thread rAF). The worker writes them into its *own*
  copy of the `forge` store and the camera reads from there. `@react-three/offscreen` forwards **scroll
  events**, but it forwards *raw DOM scroll*, not *Lenis's smoothed `progress`* — so you either (a) run Lenis
  on the main thread and proxy its computed `progress`/`velocity` yourself via a custom `postMessage`
  channel, or (b) move smoothing logic. (a) is correct.
- **Two stores, two rAFs — the cohesion-map's "one clock, one rAF" rule (§7.6) is strained.** With a worker,
  there is unavoidably a **main-thread rAF** (pumping Lenis + proxying input) and a **worker rAF** (the r3f
  loop). They are decoupled by a `postMessage` hop. The store is no longer one mutable object — it is a
  main-thread copy (input authority) and a worker copy (render authority), synced one-way each frame. This
  is workable but it is *more* moving parts than the §7.6 "one mutable store, one loop, `dt`-damped"
  contract, and it introduces **one frame of input latency** (the `postMessage` hop is async; the worker
  sees this frame's scroll on its *next* frame). For a momentum-smoothed Lenis journey at 60fps, ~16 ms of
  added scroll-to-camera latency on top of Lenis's own damping is usually imperceptible — but it must be
  measured on the device, not assumed.
- **Pointer parallax (the cursor drift in `CameraRig`) also crosses the boundary.** `forge.pointer*` (read
  by `uPointer`/`uPointerOn` in the `U` pool) comes from main-thread pointer events; the wrapper forwards
  them, but pointer-driven parallax now has the same one-frame proxy latency.
- **Strike pulse, route changes, `forge.route`** — every store field the world reads must be mirrored across
  the boundary. The cohesion map's strike-synchrony proof ("every element surges on one frame," §7.6) still
  holds *inside* the worker (one worker frame), but the *trigger* (a main-thread click) arrives one proxy
  hop later. Acceptable, but it must be wired deliberately, not assumed to "just work."

The honest summary: the worker path is **technically supported on the judge device in 2026 and delivers a
structurally lower INP, but it converts the cohesion-map's clean "one store, one rAF, one Lenis on the r3f
loop" into "two stores, two rAFs, Lenis-proxied-across-a-boundary," and it disallows `<View>`/`Html` in the
worker** — re-plumbing the exact systems (Lenis, the `U` pool driver, the plinths `<View>`) that the
architecture was built around.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship `compileAsync` now (it captures the specific INP regression GAELWORX has — the first-scroll compile
stall — at ~30 lines, zero architecture change, fully inside the one-store/one-Lenis design). Do NOT move
the renderer to a worker for the judge build. Keep the OffscreenCanvas+worker path as a documented,
gated, post-judge upgrade — authored so the port is a re-host, not a rewrite — and adopt it only if device
profiling proves a residual main-thread stall that `compileAsync` cannot remove.**

The reasoning, against the world and the budget:

1. **`compileAsync` captures most of the INP gain at a fraction of the risk — for THIS build.** The AthenaHQ
   sub-100ms-INP result comes from moving **compile + `.glb` parse + texture decode** off the main thread.
   GAELWORX has **no runtime `.glb` and no runtime EXR/texture loads** (hard constraint, cohesion map §5.3,
   §10 — procedural env only, geometry is `ExtrudeGeometry`/SDF). So the *only* main-thread INP villain the
   worker would evacuate that GAELWORX actually has is **shader compile** — and that is precisely what
   `compileAsync` + the intro loader already removes. The worker's two biggest wins (asset parse, texture
   decode) are wins GAELWORX cannot collect because it has no runtime assets to parse. The cheap fix
   captures the part of the worker's benefit that *applies to this scene*.

2. **The per-frame render cost stays on whatever thread the renderer is on — the worker does not make the
   frame cheaper.** Moving the loop to a worker does **not** reduce the ~9–10 ms steady-state scene cost
   (doc 47 §1); it only stops that cost from blocking *the main thread's* input/paint. But GAELWORX's
   main-thread work after first paint is tiny — alloc-free `useFrame`, Lenis raf, a mutable store
   (the ~2–3 ms "Camera/scroll JS + React + Lenis" line of the §10 table). There is no second heavy
   main-thread workload competing with the render that a worker would protect. The INP threat is **bunched
   at boot** (the compile), not spread across the session — and a boot-bunched stall is exactly what
   `compileAsync` + loader handles. The worker pays a permanent plumbing tax to solve a one-time boot problem
   the cheap fix already solves.

3. **The worker breaks the cohesion-map's load-bearing single-loop / single-store / single-Lenis design.**
   §7.6 ("one clock and one rAF, `dt`-damped") and phase1 doc 27 §4a (one Lenis pumped from the r3f loop)
   are *cohesion guarantees*, not incidental. The worker forces two stores, two rAFs, a `postMessage`-proxied
   Lenis, and one frame of input latency on the scroll-driven `uTemp` heartbeat that *every* element shares.
   That is a real risk to the "everything surges on one frame" strike-synchrony that sells the world.

4. **The worker disallows `<View>` in the worker thread.** The four-plinths route (§4.3, doc 46) uses drei
   `<View>` scissoring, which needs DOM tracking and **does not run in the worker.** Adopting the worker
   would force either a non-`<View>` plinths path or a main-thread exception for one route — added
   complexity for a route that is not the INP bottleneck.

5. **The judge device tolerates the main-thread path.** With `compileAsync` behind the loader, the
   first-scroll stall is gone; the per-frame budget (doc 47) holds 60 sustained; the prerendered HTML +
   `<noscript>` AEO path is on the main thread anyway. There is no measured INP failure left for the worker
   to fix on the judge device — and shipping the *less-tested* worker+fallback dual path to a judged build
   is the same class of mistake the cohesion map flags for WebGPU (§10: "betting the judge device on the
   less-tested branch is the documented mistake").

**When the worker IS worth it (the gate):** if device profiling (Web Inspector, the doc 47 `?debug` HUD)
shows a residual main-thread stall on first interaction that `compileAsync` cannot remove (e.g., a Safari
build where the driver links on the main thread *despite* the extension, §2.1), **and** the AEO/prerender
path is already worker-safe, **then** adopt `@react-three/offscreen` with the `fallback` prop and the Lenis
proxy below. Author the build so this is a re-host (wrap the existing `<Scene/>` in the worker `render()`,
add the proxy), not a rewrite. Treat it exactly like the WebGPU upgrade (doc 30): real upside, gated behind
the judge, never bet the judge device on the less-tested path.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Ship path:** `three` r17x (in repo) — `renderer.compileAsync` (≥ r158, present). `@react-three/fiber`
  (in repo) for the `useThree(s => s.gl)` handle. `lenis` 1.3.x (phase1 doc 27). **No new dependency.**
- **Gated upgrade path (only if §3 gate trips):** `@react-three/offscreen` (latest, experimental) +
  Vite worker config. Self-host nothing new; the worker bundles the existing `<Scene/>`.

### 4.2 The recommended fix — `compileAsync` behind the intro loader (`ForgeCanvas.jsx`)

The compile must run **after** every hot material is mounted (slab, jewel, channels, letterforms, basalt,
post composer) and **before** the curtain lifts / the first interaction is enabled. This folds cleanly into
the doc 47 §4.4 deferred micro-benchmark — both run behind the loader, after the scene graph exists.

```jsx
// Inside ForgeCanvas, a headless child mounted once after the scene graph + Effects.
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { forge } from '../store.js'

function ForgeWarmup({ onReady }) {
  const gl     = useThree(s => s.gl)
  const scene  = useThree(s => s.scene)
  const camera = useThree(s => s.camera)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // 1) Non-blocking parallel compile + link of EVERY program in the scene
      //    (slab veins, molten pour, basalt, letterforms, the merged EffectPass).
      //    Uses KHR_parallel_shader_compile's COMPLETION_STATUS_KHR poll under the hood,
      //    so the link status check does NOT do the blocking GPU readback.
      await gl.compileAsync(scene, camera)
      if (cancelled) return

      // 2) Deferred invisible micro-benchmark (doc 47 §4.4) — programs are now warm,
      //    so these 30 frames also confirm the tier without a cold-compile spike.
      //    confirmTier(gl, scene, camera) may pre-demote high->low here, invisibly.

      forge.ready = true          // mutable store flag the loader curtain reads
      onReady?.()                  // lift the curtain / enable first interaction
    })()
    return () => { cancelled = true }
  }, [gl, scene, camera, onReady])

  return null
}
```

Key points:
- **`compileAsync(scene, camera)`** walks the whole scene graph; mount every route's hero material that the
  first chamber needs *before* this runs. For route-gated bespoke meshes (§4.3 of the map) that mount later,
  call `gl.compileAsync(mesh, camera)` on the mesh in its own mount effect, behind a per-route mini-curtain
  or a `<Suspense>`, so a chamber's first appearance never stalls a scroll.
- **The curtain is the cover.** The compile happens while the Forge-Reveal intro (blur-to-sharp, ember
  trail) is on screen — the user has not yet scrolled, so even a residual driver link-stall (§2.1) lands on
  no pending interaction. This is the whole trick: **relocate the stall to a moment with no input to delay.**
- **Alloc-free `useFrame` everywhere else** (cohesion map §10) — no `new` in the loop — so there is no
  *steady-state* main-thread GC stall for the worker to protect against either. `compileAsync` + alloc-free
  loop together are the "INP insurance" the budget names.

### 4.3 The gated worker upgrade — shape only (build only if the §3 gate trips)

```jsx
// main entry (main thread) — App.jsx
import { Canvas } from '@react-three/offscreen'
const worker = new Worker(new URL('./forge.worker.jsx', import.meta.url), { type: 'module' })

<Canvas
  worker={worker}
  fallback={<ForgeScene />}      // SAME scene, main-thread, for the unsupported tail
  dpr={[1, 1.5]}                  // tier-capped per doc 47
  gl={{ powerPreference: 'high-performance', antialias: false }}
/>
```

```jsx
// forge.worker.jsx (worker thread — NO DOM)
import { render } from '@react-three/offscreen'
import { ForgeScene } from './ForgeScene'   // the EXACT same scene tree as the fallback
render(<ForgeScene />)                        // worker owns the render loop + compile + composer
```

**The Lenis proxy (the §2.3 plumbing made concrete) — the part that does NOT come for free:**

```js
// MAIN THREAD: Lenis stays here (it wraps native scroll). Proxy its SMOOTHED output.
import Lenis from 'lenis'
const lenis = new Lenis({ lerp: 0.1, syncTouch: true, autoRaf: false })
function mainRaf(t){ lenis.raf(t); requestAnimationFrame(mainRaf) }  // main-thread rAF #1
requestAnimationFrame(mainRaf)
lenis.on('scroll', ({ progress, velocity }) => {
  // Send the SMOOTHED progress, not raw DOM scroll. One postMessage per scroll tick.
  worker.postMessage({ t: 'scroll', progress, velocity })
})
// pointer parallax + strike + route also proxied:
addEventListener('pointermove', e =>
  worker.postMessage({ t: 'pointer', x: e.clientX / innerWidth, y: e.clientY / innerHeight }))

// WORKER THREAD: write proxied input into the WORKER's copy of the forge store.
self.addEventListener('message', ({ data }) => {
  if (data.t === 'scroll')  { forge.scroll = data.progress; forge.scrollVel = data.velocity }
  if (data.t === 'pointer') { forge.pointer.x = data.x; forge.pointer.y = data.y; forge.pointerOn = 1 }
})
// The worker's <ForgeDriver/> reads forge.scroll exactly as today and damps U.uTemp -> dt-damped.
```

The render loop, `<ForgeDriver/>` (the sole `U`-pool writer), the slab, jewel, channels, letterforms,
sparks, and composer are **unchanged inside the worker** — they read `forge.scroll`/`forge.pointer` the same
way; only the *source* of those scalars moved from a same-thread Lenis to a `postMessage` from the
main-thread Lenis. This is why it is a re-host, not a rewrite — **if** the scene tree was authored
DOM-free (no `drei/Html`, no `<View>` inside the worker subtree).

### 4.4 Key params / knobs

| Knob | Ship value | Note |
|---|---|---|
| compile timing | after full scene mount, behind loader | relocates stall off interaction |
| `gl.compileAsync` granularity | whole scene at boot; per-mesh for late chambers | avoid per-route scroll stalls |
| `forge.ready` | mutable store flag | curtain reads it; no React state mid-boot |
| (worker) proxy rate | 1 `postMessage` / scroll tick | smoothed `progress`, not raw scroll |
| (worker) added latency | ~1 frame (~16 ms) | measure on device; Lenis damping hides most |
| `fallback` | `<ForgeScene/>` | the unsupported tail (old iOS / privacy modes) |

### 4.5 How it hooks the shared master temperature system

It doesn't *change* it — it protects *when* it comes online. `compileAsync` ensures the **first** evaluation
of `gw_forge`/`gw_tempColor`/`gw_divineFire` (the master temperature functions, §1.1–1.4 of the map) happens
during the loader, not on the user's first scroll — so the divine-fire A/E light up *before* the curtain
lifts, fully warmed, instead of hitching the moment the journey starts. In the gated worker path, the `U`
pool, `<ForgeDriver/>`, and the `gw_*` functions are **identical** inside the worker; the only delta is that
`U.uTemp`'s driver reads a `forge.scroll` that arrived one `postMessage` hop ago. The temperature signal,
the noise basis, the palette, the tone-map — all unchanged. **Neither fix touches a uniform value or a
shader line.**

---

## 5. COHESION — shared palette / lighting / uniforms

This element owns **no color, no noise, no clock** — like the tier ladder (doc 47 §5), it is structurally
cohesion-safe because it is plumbing, not look. Its cohesion contract:

- **The render is byte-identical on either path.** Main-thread + `compileAsync` and worker both run the same
  three.js, the same `onBeforeCompile` GLSL, the same merged `EffectPass`, the same `U` pool, the same
  `gw_*` functions. The pixels are the same; only the thread differs. No tier, no route, no palette stop
  changes.
- **The `U` pool stays the single authority.** On the main-thread path it is one mutable object, one
  `<ForgeDriver/>` writer (cohesion map §4.2, doc 39). On the worker path it is the worker's copy, still
  written by one `<ForgeDriver/>` inside the worker — the *input* (scroll/pointer) is proxied in, but the
  *uniform authority* remains a single writer. The "mutate `U.x.value`, every material updates" guarantee
  holds in both.
- **Strike-synchrony survives.** The "every element surges on one frame" beat (§7.6) happens inside one
  worker frame on the worker path; only the *trigger* (a main-thread click) arrives one hop earlier/later.
  The synchrony of the surge itself is intact.
- **The static/AEO path is unaffected.** The prerendered static HTML, JSON-LD, `<noscript>` poster, and
  reduced-motion `static` tier (doc 47 §5) live on the **main thread / no-WebGL** path regardless of the
  worker decision — the worker only ever owns the live canvas, never the indexable DOM.

The single cohesion risk the worker introduces — and the reason it is gated — is the §7.6 "one clock, one
rAF" rule: the worker unavoidably creates two rAFs (main: Lenis+proxy; worker: render). That is a *managed*
violation (one-way synced, one frame of latency), not a free pass, which is exactly why the recommendation
keeps it off the judge build.

---

## 6. MOBILE & PERFORMANCE — the iPhone-15 envelope

**`compileAsync` costs nothing per-frame.** It runs once, behind the loader; after the curtain lifts the
render loop is identical to today. It does not add to the ~9–10 ms steady-state (doc 47 §1) — it only moves
the one-time compile spike off the first interaction. It is pure INP insurance, zero steady-state tax. This
is the cheapest possible fix for the one INP villain GAELWORX actually has.

**The worker's INP win is real but its per-frame cost is identical.** Transferring to a worker does **not**
make the frame cheaper — the GPU work is the same, the shader cost is the same, the ~5–6 ms thermal headroom
(doc 47) is the same. What it buys is *isolation*: a compile stall, a heavy frame, or a 3D-code GC pause
cannot block main-thread input/paint. For a scene with **no runtime asset loads** and an **alloc-free
loop**, that isolation protects against a threat (steady-state main-thread 3D stalls) that GAELWORX has
already designed away. The worker's cost on mobile: the `postMessage` proxy (cheap, but real per-scroll-tick
bookkeeping), one frame of input latency on the scroll heartbeat, and the dual worker+fallback QA surface.

**Safari / iPhone-15 support (2026):** worker WebGL2 is supported on the judge device — OffscreenCanvas at
Safari 16.4, WebGL2-in-worker confirmed on iOS 17 (mdn-bcd #21127), and the June 2026 Safari release added
3D OffscreenCanvas fixes (context-lost, TexImageSource). So the worker path is *viable* on the judge in 2026
— the reason to defer it is architecture risk + no measured INP need after `compileAsync`, **not** lack of
support. The `fallback` prop covers the residual tail (pre-16.4 iOS, privacy-locked contexts) and the
reduced-motion `static` tier.

**LOD / fallback / static tier:** orthogonal to this decision. The doc 47 tier ladder, the `static` poster,
and the `<noscript>` AEO path all run regardless of thread. On the worker path, the `fallback` `<Canvas>` is
the main-thread render for unsupported browsers; the `static` tier is still a boot decision below that.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**
1. **Ship `compileAsync` behind the loader first** (`ForgeWarmup`, §4.2), wired to the `forge.ready`
   curtain flag and folded into the doc 47 §4.4 micro-benchmark. This is the whole judge-build fix.
2. **Measure INP on the device before considering the worker.** Remote Web Inspector + the `?debug` HUD
   (doc 47 §9.3): scroll-jack the home journey from a cold load on a real iPhone 15 and confirm the first
   scroll has no compile hitch. If INP is clean, **stop** — the worker is unnecessary for the judge.
3. **Only if a residual main-thread stall survives `compileAsync`** (a driver that links on the main thread
   despite the extension), prototype `@react-three/offscreen` with the Lenis proxy (§4.3) on a branch,
   behind the §3 gate. Verify the worker AND the fallback both pass `qa-route` at both viewports.
4. **Author the scene DOM-free from the start** so the worker port stays a re-host. Avoid `drei/Html` in the
   3D layer; keep the plinths `<View>` path swappable; route all input through the `forge` store, never read
   `window`/`document` inside a scene component. This keeps the gated upgrade cheap *if* it's ever needed.

**Pitfalls (each has bitten this class of build):**
- **Calling `compileAsync` before the scene is mounted.** It compiles only what's *in the scene graph at
  call time*. Run it in an effect after the hero materials and the composer mount, or late-mounting chamber
  meshes will still stall on first appearance. Per-mesh `compileAsync` for route-gated heroes.
- **Assuming `compileAsync` makes the stall vanish.** It makes the link *non-blocking to poll*, but on some
  Safari/driver combos the actual program upload still hitches the GL thread (§2.1). The fix is the
  **loader**, not the extension — relocate the stall to a no-input moment. If you skip the loader, the stall
  reappears wherever the first compile lands.
- **Believing the AthenaHQ sub-100ms-INP number transfers wholesale.** It came from offloading **compile +
  `.glb` parse + texture decode**. GAELWORX has no runtime parse/decode — so the worker would only evacuate
  *compile*, which `compileAsync` already handles. Don't pay the worker tax for wins this scene can't
  collect.
- **(Worker) running Lenis in the worker.** Impossible — Lenis wraps native scroll, which doesn't exist in a
  worker. Lenis stays main-thread; proxy its **smoothed `progress`**, not raw DOM scroll, or you lose the
  momentum that the whole journey rides.
- **(Worker) proxying raw scroll instead of Lenis output.** `@react-three/offscreen` forwards *raw DOM
  scroll*; if you let the worker read that, you get un-smoothed, jumpy camera motion. Send Lenis's computed
  `progress`/`velocity` over a custom channel.
- **(Worker) `drei/Html`, `<View>`, `ScrollControls` inside the worker.** All need a DOM and break in the
  worker. The plinths `<View>` route (doc 46) must use a non-`<View>` path or a main-thread exception.
- **(Worker) forgetting the fallback / dual QA.** The `fallback` `<Canvas>` is a *second* runtime of the
  same tree; a scene change must be verified in both. Skipping the fallback strands the unsupported tail on
  a blank canvas.
- **(Worker) one-frame latency on the strike beat.** The "everything surges on one frame" synchrony is
  intact *inside* the worker, but the trigger arrives one `postMessage` hop later. Fine for scroll/strike;
  verify it doesn't desync a tightly-choreographed Brutalist-Snap moment on the device.

---

## 8. SOURCES (2025–2026)

1. three.js docs — `WebGLRenderer.compileAsync(scene, camera, [target])` (returns a Promise; compiles +
   links all materials; uses `KHR_parallel_shader_compile` to avoid the blocking link-status readback;
   ≥ r158). 2025–2026. https://threejs.org/docs/#api/en/renderers/WebGLRenderer.compileAsync
2. pmndrs/react-three-fiber — Issue #3073, "Exploring asynchronous compilation of materials with Suspense"
   (wiring `compileAsync` into React's lifecycle / Suspense; the idiomatic r3f shape). 2025.
   https://github.com/pmndrs/react-three-fiber/issues/3073
3. pmndrs/react-three-offscreen — README (`<Canvas worker fallback>`, worker `render(<Scene/>)`, event
   forwarding for pointer/resize/scroll, DOM-shim, auto-fallback, the "self-contained / no drei/Html /
   maintain two forks" caveats). 2025–2026. https://github.com/pmndrs/react-three-offscreen
4. utsubo — "WebGL & Three.js Site SEO: Make 3D Sites Rankable (2026)" (the AthenaHQ case study:
   `transferControlToOffscreen` moves render + geometry parse + texture decode to a worker; **INP stayed
   under 100 ms through the entire load sequence**; main thread free for input/scroll/paint; animation fades
   in when the worker finishes compiling). 2026. https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide
5. Khronos Registry — "WEBGL KHR_parallel_shader_compile Extension Specification" (`COMPLETION_STATUS_KHR`
   non-blocking poll for compile/link status; what `compileAsync` is built on). 2025.
   https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/
6. MDN — "KHR_parallel_shader_compile extension" (non-blocking poll; "even if the total compiling time
   could remain the same it won't be blocking the main thread"; the residual-link caveat that no tested
   browser/OS combo delivered a fully smooth animation during compile). 2025.
   https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile
7. mdn/browser-compat-data — Issue #21127, "`new OffscreenCanvas().getContext('webgl2')` in web worker —
   reported as not working in Mobile Safari, **does work**" (WebGL2-in-worker confirmed on Safari 17 /
   iOS 17). 2025. https://github.com/mdn/browser-compat-data/issues/21127
8. Releasebot — "Safari Updates by Apple — June 2026" (Safari added 3D OffscreenCanvas WebGL support; fixed
   the OffscreenCanvas `contextlost` event; fixed OffscreenCanvas as a `TexImageSource` in WebGL). June
   2026. https://releasebot.io/updates/apple/safari
9. lenis.dev / darkroomengineering/lenis — official docs + repo (Lenis 1.3.x "wraps the browser's own
   scroll," "keeps native APIs intact," runs on native scroll — i.e. it is a **main-thread** layer;
   `autoRaf:false` to drive raf yourself; `syncTouch`). 2025–2026.
   https://www.lenis.dev/ · https://github.com/darkroomengineering/lenis
10. Evil Martians — "Faster WebGL/Three.js 3D graphics with OffscreenCanvas and Web Workers" (the
    `transferControlToOffscreen` + `postMessage` event-proxy pattern; the canonical hand-rolled worker
    approach; jank-free main thread). 2025 update.
    https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers
11. web3dsurvey — "KHR_parallel_shader_compile (WebGL2)" (current support telemetry for the extension that
    `compileAsync` depends on). 2025–2026. https://web3dsurvey.com/webgl2/extensions/KHR_parallel_shader_compile
12. r3f docs — "Scaling performance" (alloc-free `useFrame`, `frameloop`, the main-thread budget context the
    INP fix sits in). 2025–2026. https://r3f.docs.pmnd.rs/advanced/scaling-performance

---

## 9. DEEP-DIVE CANDIDATES

- **9.1 The per-route `compileAsync` choreography.** Build the late-chamber warm-up: when a bespoke hero
  (jewel dispersion, plinths casts, forge-mouth arch) mounts on navigation, `gl.compileAsync(mesh, camera)`
  behind a per-route mini-Forge-Reveal so a chamber's first frame never stalls a scroll — and quantify the
  compile cost of each hero's GLSL on the device so the curtain duration is tuned, not guessed.
- **9.2 Device-measured INP attribution: where the first-scroll stall actually lives.** Use the `?debug`
  `EXT_disjoint_timer_query` HUD (doc 47 §9.3) + remote Web Inspector long-task traces to attribute the
  first-interaction INP between (a) shader link, (b) React commit, (c) Lenis init, on a cold iPhone 15 —
  the data that decides whether the §3 worker gate ever trips.
- **9.3 A worker-safe scene-authoring lint.** A build-time check that the 3D layer is DOM-free (no
  `drei/Html`, no `window`/`document` reads, `<View>` isolated) so the gated worker port stays a re-host —
  encode it as a `qa-route`/lint rule so the option never silently rots as new chambers are added.
- **9.4 SharedArrayBuffer vs `postMessage` for the Lenis→worker channel.** If the worker is ever adopted,
  benchmark a `SharedArrayBuffer` ring (zero-copy, sub-frame scroll sync, needs COOP/COEP headers) against
  per-tick `postMessage` for the scroll/pointer proxy — the SAB path could erase the one-frame latency on
  the scroll heartbeat, at the cost of cross-origin-isolation headers that interact with the Vercel deploy
  and the embedded-asset/AEO setup.
