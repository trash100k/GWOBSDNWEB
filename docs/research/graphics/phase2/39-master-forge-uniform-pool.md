# 39 — The Master Forge Uniform Pool `U` + the single `<ForgeDriver/>` writer

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 39_
_Cluster: G-architecture-perf · Focus: `src/scene/forgeUniforms.js` (the pool `U`), shared references
assigned into every chamber material via `Object.assign` in `onBeforeCompile`, and a headless
`<ForgeDriver/>` as the SOLE per-frame author so ONE float drives the whole world. Repoint the slab +
jewel to bind `U`; confirm `/` is byte-identical. This is the literal cohesion mechanism._

> Read `00-COHESION-MAP.md` §1.5 and §4.2 first. This document is the concrete build of the contract those
> sections describe: the one place "how hot is the forge right now" lives, and the one writer that authors
> it. Every other Phase-2 deep-dive (cooling, divine-fire, basalt reveal, sparks, caustics, post) is a
> *consumer* of the pool specified here. Get this wrong and the world is a collage; get it right and a
> single scroll heats the slab, the jewel, the channels, the letters, the Ogham, and the sparks on one
> heartbeat.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten forge on **one** WebGL renderer (`src/scene/ForgeCanvas.jsx`), route-swapped into
eight-plus chambers. The cohesion map's thesis is blunt: "there is exactly one of each shared system, and
every element reads from it rather than inventing its own." The single most load-bearing instance of that
rule is **temperature** — the scalar that drives emissive color, emissive intensity, cooling, bloom gating,
heat-haze strength, spark color, caustic tint, god-ray brightness, and the divine-fire A/E exception. This
deep-dive owns the *plumbing* of that signal: the data structure that holds it (`U`), the binding mechanism
that wires it into every material (`Object.assign` in `onBeforeCompile`), and the single authority that
writes it each frame (`<ForgeDriver/>`).

Today the codebase is *almost* there but **forks the signal**, which is exactly the crack the cohesion map
warns against. `ObsidianSlab.jsx` builds its own private `uniforms` object (lines 89–102) and drives
`uTemp = min(scrollDamped + vel*0.25, 1)` in its own `useFrame` (line 159). `FacetedJewel.jsx` builds a
*different* private `uHeat` ref and drives it from a *different* formula —
`min(scrollVel*0.6, 0.7) + pulse` (lines 84–86). The two heroes therefore heat on two different curves
from two different `useFrame` loops: scroll into the jewel chamber and the slab behind it and the jewel in
front of it are **not the same fire**. The strike pulse is even re-derived twice
(`exp(-since*3.0)*0.85` in the slab, `exp(-sinceStrike*3)*0.5` in the jewel). That is the bolt-on smell at
the structural level, before a single shader stop is mistuned.

The job here is to **delete the forks**. One pool `U`. One `<ForgeDriver/>`. Every material binds the same
references. `U.uTemp.value = x` updates the slab, the jewel, and every future chamber in the same frame.
The hard acceptance test is brand-critical: after the refactor, **`/` must render byte-identical** to today
— the pool is a re-plumb, not a re-look. Cohesion becomes *structural*, not retrofitted, before any new
chamber is built on top of it.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are four viable ways to make N materials share one animated value on the web today. They differ on
cohesion guarantee, recompile risk, mobile cost, and how WebGPU-portable they are.

### 2.1 Shared `THREE.IUniform` references via `Object.assign(shader.uniforms, U)` — RECOMMENDED

The pattern the cohesion map already specifies (§4.2): build one module-level pool of `{ value }` objects,
and in each material's `onBeforeCompile`, do `Object.assign(shader.uniforms, U)`. Because three stores
uniforms by **reference**, every material that ran that line now points at the *same* `IUniform` instances.
Mutating `U.uTemp.value` once is seen by all of them on the next draw — no per-material write, no clone, no
drift. three's own renderer relies on exactly this property internally: as the forum notes, "lights
uniforms are shared instead of cloned for every material" — the engine assigns one value for all materials
equally (three.js forum, *Chainable onBeforeCompile + Uniforms per Mesh*; still the canonical reference in
2025–2026). The 2026 best-practices roundup states the corollary that makes this *cheap*: "Three.js reuses
programs for identical shaders. If you define uniforms the same way, programs are shared. Unnecessary
variations create program proliferation" (utsubo, *100 Three.js Tips That Actually Improve Performance*,
2026). Shared uniforms add **zero** draw-call or program cost; they are the cheapest possible cohesion.

The one sharp edge, also 2026-documented: `onBeforeCompile` participates in the program **cache key**.
WebGLPrograms appends `onBeforeCompile.toString()` to the program hash, and you can extend that with
`material.customProgramCacheKey()` "to identify values of settings used in `onBeforeCompile`, so three.js
can reuse a cached shader or recompile the shader as needed" (three.js docs / Issue #11475, the live
reference in the 2026 onBeforeCompile guidance). Implication for `U`: **runtime uniform mutation never
recompiles** (uniforms are not in the cache key), but a *compile-time `#define`* like `GW_FBM_OCTAVES`
**is** look-affecting and must be reflected in `customProgramCacheKey` so two tiers don't collide on one
cached program. Tradeoffs: maximal cohesion, zero runtime cost, WebGL2-native, ships to the judge device
today; cost is the string-injection discipline (stable chunk markers) and the cache-key caveat.

### 2.2 `three-custom-shader-material` (CSM) wrapper — STRONG, heavier

FarazzShaikh's CSM (`three-custom-shader-material`, actively maintained through 2025) wraps a base material
and lets you inject vertex/fragment with a declarative `uniforms` prop, chaining cleanly with R3F and drei.
It solves the same problem more ergonomically and handles the cache key for you: "CSM uses ThreeJS's
default shader program caching system. Materials with the same cache key will use the same shader program …
Cache key calculation takes into account base material's cache key" (CSM README / npm, 2025). For a *shared
pool* across many materials it still needs the same discipline — pass the same memoized `uniforms` object
to every instance, because "CSM will only rebuild if the reference to the uniforms prop changes … in React
doing `uniforms={{...}}` means the uniforms object is unstable and re-created with a new reference every
render" (CSM docs, 2025). Verdict for GAELWORX: a fine tool, but it's a dependency and an abstraction over
the exact `onBeforeCompile` injection the repo *already* uses successfully in two places. Adopting it now
would mean rewriting the working slab/jewel injection for no cohesion gain. Keep `Object.assign(U)`.

### 2.3 R3F stable-uniform material piercing — ADJACENT, not the mechanism

R3F v9.6 (Apr 2024) and the v10 line make the uniforms object on `ShaderMaterial` and derivatives have a
**stable reference**: "Objects passed into uniforms will instead copy into it," enabling
`uniforms-uTime-value={t}` prop piercing (pmndrs/react-three-fiber releases, 2024–2025). This is great for a
*single* `ShaderMaterial` driven by React, but it's the wrong shape for a *pool shared by built-in
`MeshPhysicalMaterial` derivatives* — GAELWORX's slab and jewel are physical materials with injected
chunks, not raw `ShaderMaterial`s, and the pool must be authored imperatively from a mutable store (no React
re-render per frame). The v10 note that matters more here is the **decoupled scheduler**: "a new scheduler,
allowing `useFrame` to have advanced scheduling and also … to be used outside of `<Canvas/>` … The scheduler
no longer depends on R3F and can run standalone" (R3F v10.0.0-alpha.1, Jan 17 2025). That is the formal
blessing of the **single-writer** pattern: one scheduled `useFrame` (the `<ForgeDriver/>`) authors global
state; everything else reads it.

### 2.4 TSL `uniform()` shared node + `.onFrameUpdate()` (WebGPU future) — PORTABLE TARGET

The WebGPU/TSL successor to `Object.assign(U)` is a **shared uniform node**. The TSL spec demonstrates it
explicitly: `const sharedColor = uniform(new THREE.Color()); materialA.colorNode = sharedColor.div(2);
materialB.colorNode = sharedColor.mul(.5); materialC.colorNode = sharedColor.add(.5);` — "Updating
`sharedColor.value` once propagates to all three materials simultaneously" (three.js TSL docs / Shading
Language wiki, current 2025–2026). And the single-writer authority is a first-class API:
`.onFrameUpdate(fn)` runs "once per frame," `.onRenderUpdate(fn)` once per render — the renderer-native
version of `<ForgeDriver/>` (Maxime Heckel, *Field Guide to TSL and WebGPU*, Oct 14 2025, on TSL's
"shared uniform group node updated once per frame"). This is the cohesion mechanism's exact analogue, which
means: **author `U` so each member maps 1:1 to a future `uniform()` node.** The port becomes a re-host, not
a rewrite — consistent with the cohesion map's WebGPU stance (§10: "authored TSL-portable so the port is a
re-host not a rewrite"). We do **not** ship WebGPU to the judge (the WebGL2-fallback branch of
`WebGPURenderer` is less battle-tested; betting the iPhone-15 read on it is the documented mistake), but we
shape `U` for it.

### 2.5 Per-material private uniforms (the current state) — REJECTED

What the slab and jewel do today: each material owns its uniforms and its own `useFrame`. This is the
anti-pattern. Two formulas, two clocks, two strike pulses, guaranteed drift, and no place to add a
chamber that "heats with everything else." It is rejected by §7.1 of the cohesion map ("Reads the master
temperature, never invents heat"). This deep-dive exists to replace it.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build `src/scene/forgeUniforms.js` exporting one module-level pool `U` of shared `IUniform`s. Bind it
into every hot material with `Object.assign(shader.uniforms, U)` inside `onBeforeCompile`. Author it from a
single headless `<ForgeDriver/>` mounted once in `ForgeCanvas`, which is the SOLE per-frame writer. Repoint
the slab and jewel to bind `U` and read its members; delete their private temp/heat uniforms and their
private driver logic. Shape each `U` member 1:1 to a future TSL `uniform()` node.**

Justification:

- **It is the cohesion map's named mechanism (§4.2), made literal.** Shared references mean
  `U.uTemp.value = x` is the whole-world write. No per-material plumbing can drift.
- **Zero runtime cost, WebGL2-native, ships to the judge.** Shared uniforms add no draw calls and don't
  recompile (uniforms aren't in the program cache key — §2.1). The merged-program benefit (utsubo 2026) is
  a *bonus*: slab and jewel injecting the *same* helper chunks improves program reuse.
- **It de-risks everything downstream.** Cooling (`gwCool01`), divine-fire (`uAEFire`), basalt reveal,
  sparks, caustics, and post all become consumers of one pool. Build the spine once; every later chamber
  binds `U` and is *automatically* in sync.
- **The single-writer is now an official R3F pattern** (v10 standalone scheduler, §2.3) and the exact shape
  of TSL's `.onFrameUpdate` (§2.4), so the architecture is both current and forward-portable.
- **`/` stays byte-identical** because the pool reproduces today's formulas exactly; only *who owns the
  numbers* changes.

---

## 4. IMPLEMENTATION

### 4.1 Libs / versions (already in the repo)

- `three` (r17x, WebGL2 + `onBeforeCompile`), `@react-three/fiber` (v9/v10 line), `@react-three/drei`,
  `@react-three/postprocessing`. No new dependency — `Object.assign(U)` is vanilla three.
- TSL port (post-judge, gated): `three/webgpu` + `three/tsl` `uniform()`. Authored-for now, not shipped.

### 4.2 `src/scene/forgeUniforms.js` — the pool

One module-level object of shared `IUniform`s. Members map 1:1 to the cohesion-map §4.2 table and to future
TSL nodes. Reset helper keeps it alloc-free.

```js
// src/scene/forgeUniforms.js
import * as THREE from 'three'

/**
 * THE MASTER FORGE UNIFORM POOL.
 * One shared reference per signal. Every hot material binds THESE objects (not clones)
 * via Object.assign(shader.uniforms, U) in onBeforeCompile, so mutating U.x.value
 * updates the whole world in one frame. The SOLE writer is <ForgeDriver/>.
 * Member order/types are chosen to map 1:1 to TSL uniform() nodes for the WebGPU port.
 */
export const U = {
  uTime:      { value: 0 },                       // clock seconds (frozen to 2 on 'static')
  uTemp:      { value: 0 },                       // 0..1 master TEMPERATURE (scroll-driven forge heat)
  uHeat:      { value: 0 },                       // 0..1 transient HEAT pulse (strike + scroll velocity)
  uScroll:    { value: 0 },                       // 0..1 damped scroll progress
  uPointer:   { value: new THREE.Vector2(0.5, 0.5) },
  uPointerOn: { value: 0 },
  uPourFront: { value: new THREE.Vector3() },     // moving pour-front world pos
  uPourArc:   { value: 0 },                       // pour-front arc coord 0..1 along the channel
  uVeinScale: { value: 1.8 },                     // per-route look (damped to sceneFor(route))
  uVeinGlow:  { value: 0.6 },
  uIrid:      { value: 1.35 },
  uAEFire:    { value: new THREE.Vector3() },     // nearest divine-fire world pos
  uAEFirePow: { value: 0 },                       // divine-fire intensity (A/E radiance)
}

// Optional: a list so a TSL port can iterate and build matching uniform() nodes.
export const U_KEYS = Object.keys(U)
```

**Why one flat object, not a class:** `Object.assign(shader.uniforms, U)` copies key→reference pairs
verbatim, so a flat record is exactly the right shape. A class would need a `.uniforms` accessor and buy
nothing. Vectors are shared *instances* — never reassign `U.uPointer.value = new Vector2(...)` in the
driver (that would orphan every material's reference); mutate in place with `.set()`.

### 4.3 The binding pattern in any hot material

Every chamber material's `onBeforeCompile` runs the *same two lines* before its own injection:

```js
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, U)            // bind the SHARED pool (references, not clones)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FORGE_UNIFORM_DECLS}\n${GW_FORGE}\n${HEAD}`)
    .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
}
// Look-affecting compile flags (NOT uniforms) must enter the cache key so tiers don't collide:
m.customProgramCacheKey = () => `forge:${GW_FBM_OCTAVES}:${transmissive ? 1 : 0}`
```

`FORGE_UNIFORM_DECLS` is one shared GLSL string declaring every pool member so a material can reference any
of them without redeclaring (declare-all is harmless; the GLSL compiler strips unused uniforms):

```glsl
// FORGE_UNIFORM_DECLS — declared once, matches U exactly.
uniform float uTime; uniform float uTemp; uniform float uHeat; uniform float uScroll;
uniform vec2  uPointer; uniform float uPointerOn;
uniform vec3  uPourFront; uniform float uPourArc;
uniform float uVeinScale; uniform float uVeinGlow; uniform float uIrid;
uniform vec3  uAEFire; uniform float uAEFirePow;
```

Keep these decls **out of** the per-material `HEAD` so two materials can't disagree on a type. They live
beside `GLSL_NOISE` / the `gw_*` toolkit in `src/scene/shaders.js`, exported as one constant.

### 4.4 `<ForgeDriver/>` — the SOLE writer

One headless component, mounted once in `ForgeCanvas` (sibling of `CameraRig`, NOT inside a hero — so the
pool is driven even on routes whose hero is the jewel, not the slab). It reproduces today's slab formula
exactly so `/` is unchanged, and folds the jewel's heat into the *same* `uHeat`:

```jsx
// src/scene/ForgeDriver.jsx
import { useFrame } from '@react-three/fiber'
import { forge, range, damp } from '../store.js'
import { sceneFor } from './scenes.js'
import { U } from './forgeUniforms.js'

/** The ONE per-frame author of the Master Forge Uniform pool. No mesh, no render. */
export default function ForgeDriver() {
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const sc = sceneFor(forge.route)
    const reduced = forge.quality === 'static'

    // --- clock (frozen on static, exactly as the slab did) -------------------
    U.uTime.value = reduced ? 2 : t

    // --- TEMPERATURE: the master forge heat (slab's original formula, verbatim)
    const vel = Math.min(forge.scrollVel * 1.4, 1)             // 0..1 scroll energy
    U.uTemp.value = Math.min(forge.scrollDamped + vel * 0.25, 1)
    U.uScroll.value = forge.scrollDamped

    // --- HEAT: one transient pulse for the whole world ----------------------
    // ONE strike pulse (was derived twice). exp(-since*3) is the shared decay.
    const since = performance.now() / 1000 - forge.strikeAt
    const strike = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) : 0
    const heatTarget = Math.min(vel * 0.6 + strike, 1)
    U.uHeat.value = damp(U.uHeat.value, heatTarget, 6, dt)

    // --- per-route LOOK, damped (was in the slab's useFrame) -----------------
    U.uVeinGlow.value = damp(U.uVeinGlow.value, forge.ready ? veinRamp(sc, vel, t, reduced) : 0, 3, dt)
    U.uIrid.value     = damp(U.uIrid.value,     sc.irid,     2.4, dt)
    U.uVeinScale.value= damp(U.uVeinScale.value,sc.veinScale,2.4, dt)

    // --- pointer (shared, in-place mutation) --------------------------------
    U.uPointer.value.lerp(forge.pointerUv ?? U.uPointer.value, 1 - Math.pow(0.002, dt))
    U.uPointerOn.value = damp(U.uPointerOn.value, forge.pointerOn ?? 0, 6, dt)

    // uPourFront / uAEFire* are written by their owning systems (pour, A/E letters)
    // into the SAME U references — still one pool, multiple informed writers for
    // signals that are spatial, not global. The global heat signals stay here.
  })
  return null
}
```

The slab's idle-breath + scroll-flare ramp moves into a small pure helper so the formula is preserved
exactly:

```js
function veinRamp(sc, vel, t, reduced) {
  const breath = reduced ? 0 : (0.5 + 0.5 * Math.sin(t * 0.7)) * (1 - Math.min(vel * 2.5, 1))
  return sc.veinGlow + range(forgeScrollDamped(), 0.0, 0.5) * 0.5 + vel * SCROLL_FLARE + breath * IDLE_BREATH
}
```

(`SCROLL_FLARE`/`IDLE_BREATH` are the former leva defaults `0.7`/`0.12`, promoted to module constants so the
debug panel still tunes them but the driver owns them — keep the leva folder reading/writing those
constants so `?debug` is unchanged.)

### 4.5 Repointing the slab and jewel

**Slab:** delete the private `uniforms` `useMemo` (lines 89–102) and the per-frame writes to it. Keep only
material *property* writes that are genuinely material-local (`envMapIntensity`, `roughness`,
`transmission`). The material binds `U`; the shader `HEAD`/`COLOR` reference `uTemp`/`uVeinGlow`/`uIrid`/
`uVeinScale`/`uPointer`/`uPointerOn` from the shared decls; `uSurge` is replaced by reading **`uHeat`** (the
strike now lives in the shared pulse). The slab's `useFrame` shrinks to material-prop writes + pointer
*targets* fed into `forge.pointerUv` (so the driver owns the damping). Net: the slab stops authoring
temperature; it only *consumes* it.

**Jewel:** delete the private `uHeat` ref and its strike re-derivation (lines 32, 84–86). In
`onBeforeCompile`, replace `shader.uniforms.uHeat = uHeat.current` with `Object.assign(shader.uniforms, U)`
and have the COLOR chunk read the shared `uHeat`. The jewel's emissive/edge-glow now ride the **same**
`U.uHeat` as the slab's surge — scroll into the jewel chamber and slab+jewel pulse together, which is the
whole point. The jewel keeps its *local* motion (spin, parallax, rise) in its own `useFrame`; only the
*heat signal* is centralized.

### 4.6 Mount and the `/` byte-identical proof

```jsx
// ForgeCanvas.jsx — mount the driver once, before the heroes.
<CameraRig />
<ForgeDriver />            {/* SOLE author of U; runs on every route */}
<ObsidianSlab quality={quality} />
```

Because `U.uTemp`/`uVeinGlow`/`uVeinScale`/`uIrid` reproduce the slab's exact formulas and the strike now
feeds `uHeat` with the *same* `exp(-since*3)` shape the slab used (scaled into the COLOR read so the visible
surge magnitude matches the old `*0.85`), the home page is unchanged. Verify byte-identity per §7.

---

## 5. COHESION — how it binds the rest of the world

`U` **is** the cohesion contract from `00-COHESION-MAP.md` §7, made concrete:

- **One temperature, never invented (§7.1).** `gw_forge(uTemp)` colours the slab veins, the jewel fire, the
  channel metal, the cooling letters, the basalt heat-stain, the caustic tint, the god-ray colour, the
  heat-haze mask. All read `U.uTemp` / `U.uHeat`. A cooling letter and a cooling vein are the same metal
  because they sample the same curve from the same uniform.
- **One clock, one rAF, dt-damped (§7.6).** `U.uTime` is the only clock; `<ForgeDriver/>` is the only writer;
  every value damps via `THREE.MathUtils.damp` — no `setInterval`, no `lerp(a,b,k)`, no second rAF. A strike
  surges `U.uHeat` once and the slab veins, jewel edges, sparks, god-ray weight, and bloom move **in the
  same frame** — that synchrony is the cohesion proof.
- **The divine-fire keystone routes through the pool, never around it (§1.4/§7.5).** `U.uAEFire` /
  `U.uAEFirePow` are written by the A/E letterform system into the shared references and *read* by the
  basalt reveal, the Ogham legibility rim, and the caustic divine preset. The A/E never touch `uTemp`; the
  pool's separation of `uTemp` from `uAEFire*` is the structural guarantee of "the A/E must never reach
  `uTemp`."
- **Per-route variation is damping the same pool (§9).** `U.uVeinScale`/`uVeinGlow`/`uIrid` damp toward
  `sceneFor(route)`; no chamber forks a private orange, noise, clock, or operator. The pour-front
  (`uPourFront`/`uPourArc`) is the single source shared by channel geometry, pour flow, and spark orbit
  (§7.8).
- **Palette + noise stay shared (§7.2/§7.3).** The pool carries *signals*; colours still come from `PAL` via
  `v3()` and noise from the `gw_*` toolkit. `U` doesn't duplicate those — it parameterizes them.

The acceptance image of cohesion: scroll into the casting-room and slab, jewel, channels, letters, and Ogham
**all heat together from one float** — the definition of "shares uniforms so nothing looks bolted-on."

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

- **The pool is effectively free.** Shared uniforms add no draw calls, no programs, and don't trigger
  recompiles (uniforms aren't in the program cache key; only `customProgramCacheKey` flags are — §2.1).
  Centralizing the writer *removes* work: today two `useFrame` loops each compute a strike pulse and scroll
  energy; the driver computes them **once** and broadcasts. The §10 budget reserves ~2–3 ms for camera/JS;
  one alloc-free driver loop keeps well under it.
- **Alloc-free per frame (INP insurance, §10).** No `new` inside `<ForgeDriver/>`; vectors mutate in place
  with `.set()`/`.lerp()`. Reassigning a `.value` vector would orphan every material's shared reference —
  forbidden. This is the single most common pool bug.
- **Program reuse bonus.** Slab and jewel injecting the *same* `FORGE_UNIFORM_DECLS` + `GW_FORGE` helper
  text makes their programs more similar, aiding three's program cache (utsubo 2026: identical uniform
  definitions → shared programs). Keep the injected helper strings byte-identical across materials.
- **Static tier.** `<ForgeDriver/>` still mounts; it sets `U.uTime = 2`, zeroes velocity-driven heat, and
  damps look toward the route preset, then the `frameloop='demand'` canvas renders one frame. The pool makes
  the still **lit and on-brand** (warm veins on true-black), not a dead fallback (§10). The driver's
  `useFrame` under `demand` runs only on invalidation — cheap.
- **Tier define in the cache key.** `GW_FBM_OCTAVES` (4/3/2 by tier) is a compile-time `#define`, not a
  uniform; it **must** appear in `customProgramCacheKey` so a tier change recompiles rather than silently
  reusing a wrong-octave program. Dropping a tier thins *all* detail uniformly (§7.9) because every material
  reads the same define and the same `U`.
- **No per-route post tweak.** Route mood is a `scenes.js` preset damped through `U`, never a different
  composer or a second writer (§7.7).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**

1. **Create `src/scene/forgeUniforms.js` (`U`) and `FORGE_UNIFORM_DECLS` in `shaders.js` first.** Land them
   with the pool unused; `npm run build` green. Nothing renders differently yet.
2. **Add `<ForgeDriver/>` and mount it in `ForgeCanvas`** *while the slab still drives its own uniforms.*
   The driver writes `U`; nothing reads it. Build green. (Two writers briefly coexist — fine, because
   nothing binds `U` yet.)
3. **Repoint the slab to bind `U`** and read its members; delete the slab's private `uniforms` and its
   temp/look writes. **This is the byte-identical gate** — compare `/` before/after (see proof below). Do
   *not* touch the jewel yet; isolate the variable.
4. **Repoint the jewel to bind `U`**, fold its heat into `U.uHeat`, delete its private `uHeat`. Re-verify
   `/` and the jewel chambers.
5. **Add `customProgramCacheKey`** to both materials reflecting `GW_FBM_OCTAVES` + transmissive. Verify a
   tier switch recompiles correctly (no stale program).

**The byte-identical proof for `/`:** build, then `qa-route` at 393×852 + 1440×900 with **0 console errors**
(SwiftShader compiles the GLSL in CI, so a chunk-marker typo or undeclared uniform surfaces as an error).
Capture the same frame (fixed `uTime`, scroll=0, pointer off) before and after and diff — pixels must match.
Then the **iPhone 15 OLED read** for the things that don't simulate headless (bloom spread, true-black,
divine-fire white-gold).

**Pitfalls, ranked:**

1. **Reassigning a shared vector's `.value`.** `U.uPointer.value = new Vector2()` silently breaks cohesion —
   materials keep the *old* reference. Always `.set()`/`.lerp()`/`.copy()` in place. (#1 pool bug.)
2. **Two writers.** If any hero still mutates a temp/heat uniform in its own `useFrame`, the world has two
   clocks again. The driver is the *sole* author of global signals. Grep for stray `uTemp.value =` /
   `uHeat.value =` outside `ForgeDriver`.
3. **`Object.assign` after three already set built-in uniform values.** Run `Object.assign(shader.uniforms,
   U)` in `onBeforeCompile` (where `shader.uniforms` already holds the built-ins) and only *add* `gw_*`
   names — never overwrite a three built-in (e.g. `uTime` is safe; `time`, `opacity` are not). All pool keys
   are `u`-prefixed and collision-free by design.
4. **Cache-key omission.** Forgetting `customProgramCacheKey` when a look-affecting `#define` changes →
   stale program → a tier that doesn't actually change octaves. Uniforms never need to be in the key;
   defines always do.
5. **Driver mounted inside a hero.** If `<ForgeDriver/>` lives in `ObsidianSlab`, the pool freezes on routes
   where the slab unmounts. Mount it in `ForgeCanvas`, route-independent.
6. **Pointer ownership split.** The slab currently damps the pointer in its own loop; move pointer *targets*
   into the store (`forge.pointerUv`/`pointerOn`) and let the driver damp `U.uPointer`, or the pointer lags
   differently per material.
7. **TSL drift.** When the WebGPU port comes, map each `U.x` to exactly one `uniform()` node and write it in
   one `.onFrameUpdate` — don't scatter writes, or you lose the single-authority guarantee on the new
   renderer too.

---

## 8. SOURCES (2025–2026)

1. utsubo — *100 Three.js Tips That Actually Improve Performance (2026)*.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips — "Three.js reuses programs for identical
   shaders. If you define uniforms the same way, programs are shared … unnecessary variations create program
   proliferation"; dispose discipline; onBeforeCompile vs Node Material guidance. (2026)
2. Maxime Heckel — *Field Guide to TSL and WebGPU*.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — TSL "shared uniform group node …
   updated once per frame," WebGPU uniform-buffer model, `.onFrameUpdate` single-authority pattern.
   (Oct 14 2025)
3. three.js docs / wiki — *Three.js Shading Language (TSL)* uniform sharing.
   https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language — `const sharedColor = uniform(...)`
   shared across `materialA/B/C`; `.onObjectUpdate` / `.onRenderUpdate` / `.onFrameUpdate`. (current 2025–26)
4. pmndrs/react-three-fiber — *Releases* (v9.6 stable uniform refs; v10.0.0-alpha.1 standalone scheduler).
   https://github.com/pmndrs/react-three-fiber/releases — "uniforms objects on ShaderMaterial … now have a
   stable reference"; "a new scheduler … `useFrame` … used outside of `<Canvas/>` … no longer depends on
   R3F." (2024–2025; v10 alpha Jan 17 2025)
5. FarazzShaikh — *three-custom-shader-material* (CSM) README / npm.
   https://www.npmjs.com/package/three-custom-shader-material — cache-key propagation across chained
   instances; memoize the `uniforms` prop or CSM rebuilds on every render. (2025)
6. three.js forum — *Chainable onBeforeCompile + Uniforms per Mesh*.
   https://discourse.threejs.org/t/chainable-onbeforecompile-uniforms-per-mesh/8905 — shared-by-reference
   uniforms; lights uniforms shared not cloned; the chainable-plugin pattern. (canonical, cited in 2025–26
   write-ups)
7. three.js — *Material.onBeforeCompile / customProgramCacheKey* docs + Issue #11475.
   https://threejs.org/docs/#api/en/materials/Material.onBeforeCompile ·
   https://github.com/mrdoob/three.js/issues/11475 — `onBeforeCompile.toString()` in the program hash;
   `customProgramCacheKey()` to identify onBeforeCompile settings for reuse/recompile. (live ref, 2026
   onBeforeCompile guidance)
8. Three.js Roadmap — *TSL: A Better Way to Write Shaders in Three.js* / *Complete Guide to Three.js
   Post-Processing in 2026*. https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs —
   TSL node/uniform model and update frequencies as the WebGPU successor to GLSL injection. (2026)

---

## 9. DEEP-DIVE CANDIDATES

1. **`U.uAEFire` / `uAEFirePow` as a multi-writer spatial channel.** The A/E letterforms write position +
   intensity into the shared pool while `<ForgeDriver/>` owns the *global* heat — formalize the rule for
   which signals are single-writer (global heat, time) vs informed-multi-writer (pour-front, A/E radiance),
   and prove no two writers race the same `.value` in a frame.
2. **The `customProgramCacheKey` + `GW_FBM_OCTAVES` tier-switch protocol.** Exactly how to flip a
   compile-time define across all `U`-bound materials at once without a per-material recompile stall —
   `compileAsync` warm-up of both programs on boot, swap on tier change, and the cache-key contract that
   keeps the swap correct.
3. **The TSL port of `U` (`forgeUniformsTSL.js`).** Build the parallel `uniform()`-node pool and a single
   `.onFrameUpdate` writer; A/B the WebGPU path against the GLSL path for the *same* `/` frame to prove the
   re-host (not rewrite) claim, and document the WebGL2-fallback risk for the judge device.
4. **Pool-driven debug bus.** A `?debug` leva panel that writes directly into `U` (scrub `uTemp`, pulse
   `uHeat`, jump `uPourArc`) so the whole world can be hand-driven for look-dev — the cohesion test made
   interactive, and the fastest way to catch a material that forgot to bind `U`.
