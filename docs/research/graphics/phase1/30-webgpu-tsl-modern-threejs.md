# 30 — WebGPU & TSL (Three Shading Language), 2025–2026

_Phase-1 graphics research · GAELWORX forge world · target device iPhone 15 (OLED), single WebGL renderer_
_Focus: where `WebGPURenderer` + TSL node materials stand in 2025–26, iOS Safari support, perf vs the WebGL2
fallback, authoring the forge shaders in TSL, compute for particles/fluid — and the **adopt-now vs WebGL2**
decision for THIS build._

> Scope note: this doc is the **renderer/authoring-stack decision** for the whole forge world. It does not own
> a single effect; it owns the substrate every other doc compiles onto. Its verdict binds docs 01–29: whether
> the master temperature/material/noise system is authored as GLSL `onBeforeCompile` chunk-injection
> (`shaders.js` / `ObsidianSlab.jsx` today) or as TSL node graphs on `WebGPURenderer`. It is the partner to
> doc 29 (the perf budget that gatekeeps any renderer choice) and doc 15 (GPGPU sparks, which is the single
> biggest reason to *want* WebGPU). The other docs assume one answer; this one produces it.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one cohesive molten-forge world built on **one master temperature/material/noise/lighting system** —
every element (obsidian veins, the channel pour, letterform fill, divine-fire A+E, sparks, heat haze, bloom)
shares uniforms so nothing looks bolted-on. The question this doc settles is *what language and renderer that
master system is written in.* Two stacks are on the table for 2025–26:

- **WebGL2 + `WebGLRenderer` + GLSL** — what ships today. The slab is a `MeshPhysicalMaterial` with
  `onBeforeCompile` chunk injection (`ObsidianSlab.jsx`), the shared noise is a GLSL string (`shaders.js`,
  `gw_snoise`/`gw_fbm`/`gw_caustic`), embers are a hand-written `ShaderMaterial` (`Embers.jsx`), and post is
  `@react-three/postprocessing` (`Effects.jsx`). Mature, predictable, judge-safe.
- **WebGPU + `WebGPURenderer` + TSL (Three Shading Language)** — three.js's 2025/26 frontier. TSL is a
  JavaScript node graph (`Fn`, `uniform`, `mix`, `smoothstep`, `mx_noise_float`, `positionLocal`, `colorNode`)
  that **transpiles to WGSL on WebGPU and GLSL on WebGL2** from one source, replaces `onBeforeCompile`, adds
  true **compute shaders** (`instancedArray` storage buffers, `.compute()` passes) for particles and fluid, and
  brings a node-based `PostProcessing` pipeline (TSL bloom, MRT) that replaces EffectComposer.

The stakes are specific to this world. The forge's hero behaviors — **living sparks orbiting the moving pour
front** (doc 15) and **viscous molten flow through Celtic-interlace channels** (docs 08/09) — are exactly the
GPGPU/compute workloads WebGPU makes 2–10× cheaper. But the **judge device is an iPhone 15 in Safari**, and the
single rule that dominates everything is: *whatever runs on that phone is the product.* So this is not "is
WebGPU good" (it is); it is "is iOS-Safari WebGPU dependable enough in 2026 that we ship the WebGPU path to the
judge, or do we ship the WebGL2 fallback and treat WebGPU as upside." That framing drives §3.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 Where WebGPU + TSL actually stands (the milestones, dated)

The picture changed decisively in late 2025. **Safari 26 shipped WebGPU in September 2025** across macOS, iOS,
iPadOS, and visionOS — Apple was the last major-browser holdout, so as of Sept 2025 WebGPU is "supported" in
Chrome, Edge, Firefox, and Safari/iOS, ~79% global ([caniuse / brandlens "Untold Revolution in iOS 26", 2025];
[utsubo "What's New in Three.js (2026)"]). On the three.js side, **since r171 (Sept 2025) you import
`WebGPURenderer` from `three/webgpu` with zero config and it is no longer a preview**; by **r184 (early 2026)
TSL ships as a first-class shading API** — compose a node graph in JS and assign to `material.colorNode` /
`material.positionNode` instead of writing GLSL strings ([utsubo migration guide 2026];
[LearnWithHasan "Three.js Shaders Guide r184", 2026]; [threejsroadmap "TSL: A Better Way to Write Shaders", 2025]).
r181/r182 (≈ early 2026) hardened the node `PostProcessing` path (TSL bloom toggled by reassigning `outputNode`,
MRT scene passes emitting color+normal in one go) ([three.js r181/r182 release notes, 2026];
[threejsroadmap "Complete Guide to Three.js Post-Processing in 2026"]).

The crucial nuance for us: **"Safari supports WebGPU" ≠ "Safari WebGPU is fast and bug-free on a specific
iPhone-15 forge scene under thermal load."** Shipped-and-enabled is a 2025 fact; *production-grade for a judged
cinematic mobile demo in mid-2026* is a risk assessment, not a checkbox. The 2026 community guidance is
consistent: **adopt `WebGPURenderer` for its automatic WebGL2 fallback and author in TSL for portability — but
do not assume the WebGPU branch is the one your iOS user hits** ([utsubo migration guide]; [Loopspeed/Pragmattic
r3f-WebGPU-TSL guide, 2025]).

### 2.2 TSL authoring model (vs our current GLSL chunk-injection)

Today's slab uses the classic escape hatch: a `MeshPhysicalMaterial` whose `onBeforeCompile` string-replaces
`#include <common>` / `#include <normal_fragment_maps>` / `#include <tonemapping_fragment>` to inject `HEAD` /
`NORMAL` / `COLOR` GLSL (`ObsidianSlab.jsx:123–129`). This is powerful but brittle — it depends on three.js's
internal chunk names, breaks on engine upgrades, and is string soup.

TSL replaces this entirely. The same look is built from typed nodes:

```js
import { Fn, uniform, vec3, float, mix, smoothstep, pow, dot, normalize,
         positionLocal, normalLocal, mx_noise_float, time } from 'three/tsl'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'

const uTime   = uniform(0)
const uTemp   = uniform(0)
const uVeinGlow = uniform(0.85)

// gw_fbm as a reusable TSL function — ONE definition, compiles to WGSL or GLSL
const gwFbm = Fn(([p]) => {
  const s = float(0).toVar(); const a = float(0.5).toVar(); const q = p.toVar()
  // Loop(3, () => { s.addAssign(a.mul(mx_noise_float(q))); q.mulAssign(2.03); a.mulAssign(0.5) })
  return s
})
```
`material.colorNode = forgeColor(...)`, `material.normalNode = ...`, `material.emissiveNode = vein.mul(uVeinGlow)`.
No chunk names, autocomplete + type-checking, and the **identical graph runs on both APIs**
([Heckel "Field Guide to TSL and WebGPU", 2025-10-14]; [niklever TSL tutorials, 2025]; [sbcode TSL, 2025]).
TSL ships MaterialX noises out of the box — `mx_noise_float(vec3)` is a drop-in Perlin replacement for our
hand-rolled `gw_snoise`, and the roadmap catalogues 10 TSL noise functions for exactly this
([threejsroadmap "10 Noise Functions for Three.js TSL Shaders", 2025]).

### 2.3 Compute shaders — the actual prize (particles & fluid)

This is why WebGPU matters to *this* world, not abstractly. WebGPU adds a third shader stage — **compute** —
that WebGL2 simply does not have. In TSL you allocate GPU-persistent storage with `instancedArray(count, 'vec3')`
and run a `.compute(count)` pass that integrates particle state on-GPU with no CPU round-trip and no
float-texture ping-pong. The reported wins are large: **50K–350K+ particles at full framerate, 2–10× over the
CPU/FBO path**, with attractors, curl-noise turbulence, and lifetime curves living in the compute kernel
([Heckel field guide 2025]; [utsubo "100 Three.js Tips (2026)"]; [Wawa Sensei "GPGPU particles with TSL", 2025]).

For GAELWORX that maps directly: the **pour-front orbiting sparks** (doc 15) and **SPH/grid molten fluid**
(doc 08) are textbook compute workloads. On WebGL2 we emulate compute with `GPUComputationRenderer`
ping-pong float textures (doc 15 §2.2) — it works on A16, but it is fiddlier and bandwidth-heavier than a clean
`instancedArray` kernel. So compute is the single strongest *pull* toward WebGPU.

### 2.4 Node post-processing (vs `@react-three/postprocessing`)

The WebGPU path replaces EffectComposer with a TSL `PostProcessing` graph: `pp.outputNode = scenePass(...)`
composed with `bloom()`, tone-mapping, and grade nodes; toggling an effect is reassigning `outputNode` +
`needsUpdate`. MRT lets one scene pass emit color **and** normals for cheap normal-aware effects
([threejsroadmap "Complete Guide to Post-Processing in 2026"]; [three.js r181/r182 notes]). This is cleaner than
our six-effect merged `EffectPass` — **but** `@react-three/postprocessing` (pmndrs) is a `WebGLRenderer`-era
library; on `WebGPURenderer` parts of it need WebGPU-specific versions or TSL rewrites, and the r3f wiring
changes (drei's composer wraps pmndrs; some effects need TSL equivalents). So **migrating the renderer also
means migrating `Effects.jsx`** — not a free swap ([utsubo migration guide]; [r3f WebGPU issue #3352];
[ektogamat `r3f-webgpu-starter`, 2025]).

### 2.5 r3f integration cost (the plumbing reality)

r3f v9 added an **async `gl` prop** specifically because `WebGPURenderer` needs `await renderer.init()`. The
canonical pattern:

```jsx
import * as THREE from 'three/webgpu'
import { extend, Canvas } from '@react-three/fiber'
extend(THREE)   // register three/webgpu namespace with r3f

<Canvas
  gl={async (props) => {
    const r = new THREE.WebGPURenderer({ ...props, antialias: true })
    await r.init()
    return r
  }}
/>
```
`WebGPURenderer` **falls back to WebGL2 automatically** when WebGPU is unavailable, and exposes a
`forceWebGL: true` option to pin the fallback for testing/safety ([three.js manual "WebGPURenderer"];
[Loopspeed/Pragmattic guide 2025]; [ICS Media "Getting started with Three.js on WebGPU", 2025]). The repo is
on **r3f v8 today** (`ForgeCanvas.jsx` uses the classic `gl={{ ... }}` object), so adopting WebGPU implies a
**v8→v9 migration** plus the `three/webgpu` `extend` plus the async-gl change — real surface area, touching the
one file every chamber renders through.

### 2.6 Performance: WebGPU vs WebGL2 fallback — the honest read

The 2–10× headline is real **for compute-/draw-call-bound scenes** (tens of thousands of instances, GPU
particles, heavy MRT). For a **fill-rate-bound void scene** like ours — a near-full-screen emissive fbm shader
plus a bloom pass plus a few hundred additive points — the per-pixel fragment cost is roughly the same whether
the fragment is WGSL or GLSL; WebGPU's win there is mostly lower driver/draw-call overhead, which our ~<20
draw calls (doc 29) barely exercise. **Net: WebGPU buys us a lot on the parts we haven't built yet (compute
sparks, fluid) and little on the part that dominates today's budget (the slab + bloom fill-rate).** And the
fallback caveat bites: if iOS Safari WebGPU is flaky/throttly on the judge phone and we fall back to WebGL2,
we're running TSL-transpiled GLSL through `WebGPURenderer`'s WebGL2 backend — a **less battle-tested path than
the classic `WebGLRenderer`** we ship today, on the exact device that decides the outcome.

### 2.7 The summary tradeoff table

| Stack | Quality ceiling | Mobile/iOS safety (mid-2026) | Compute (particles/fluid) | Authoring | Migration cost from THIS repo |
|---|---|---|---|---|---|
| **WebGL2 + `WebGLRenderer` + GLSL** (today) | High (proven) | **Highest** — the trodden path | Emulated (FBO ping-pong) | GLSL `onBeforeCompile` chunk-injection (brittle but known) | **Zero** |
| **`WebGPURenderer` + TSL, WebGPU active** | **Highest** (compute) | Medium — Safari 26 ships it, but unproven under thermal load for a judged demo | **Native** (`instancedArray`/`.compute()`) | TSL nodes (typed, portable, cleaner) | High: r3f v8→v9, `three/webgpu` extend, async-gl, **post rewrite** |
| **`WebGPURenderer` + TSL, WebGL2 fallback** | High | Medium — less-tested than classic `WebGLRenderer` | Emulated | TSL → GLSL transpile | High (same as above) |
| **TSL-authored, but run on classic WebGLRenderer** | High | High | Emulated | TSL (forward-compatible) | Medium (TSL adoption only, no renderer swap) |

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship WebGL2 + `WebGLRenderer` + GLSL for the judged build. Author the master system to be TSL-portable, and
treat `WebGPURenderer`/TSL/compute as a gated, post-judge upgrade behind a runtime capability flag — never as
the path the iPhone-15 judge depends on.**

This is the same verdict docs 29 (§2.7) and 15 (§3) reach, and this doc is where it is argued in full:

1. **The judge device is the whole game, and the safe path on it is classic WebGL2.** iOS Safari shipped WebGPU
   in Sept 2025, but a mid-2026 *judged cinematic mobile demo* cannot bet the result on a renderer path that is
   (a) new on iOS, (b) unproven under sustained thermal throttle, and (c) — if it falls back — lands on
   `WebGPURenderer`'s WebGL2 backend, which is *less* tested than the `WebGLRenderer` we already ship. Building
   on WebGPU now means shipping the **fallback as the product** on the device that matters (doc 29 §7).
2. **WebGPU's biggest wins don't move today's bottleneck.** Our budget is fill-rate (slab fbm + bloom), not
   draw calls or compute — so the 2–10× compute headline doesn't pay rent until we build the GPU sparks (doc 15)
   and fluid (doc 08). Those are exactly the things to *prototype* on WebGPU, not the things shipping in the
   first judged pass.
3. **The migration is not a swap — it's a stack change.** Renderer (`three/webgpu`), r3f v8→v9 + `extend`,
   async-gl init, and a **post-processing rewrite** (pmndrs EffectComposer → TSL `PostProcessing` nodes). That
   touches the one file every chamber renders through (`ForgeCanvas.jsx`) and the finish every chamber wears
   (`Effects.jsx`). Too much surface area to absorb before the judge with no fill-rate payoff.
4. **But TSL-portability is cheap insurance and we take it now.** Writing `gw_fbm`/vein/temperature as small
   pure functions with a single octave knob (doc 29 §4.7 `GW_FBM_OCTAVES`) means the future TSL port is a
   re-host, not a rewrite. We adopt the *discipline* of TSL (pure functions, one noise source, shared
   uniforms) without paying the renderer-migration tax. This is deep-dive 9.1.

**In one line:** *WebGL2 ships; TSL is how we write it so WebGPU is a later flip, not a rebuild.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Now (judged build):** `three` r17x/r18x (classic `WebGLRenderer` via `@react-three/fiber` v8),
  `@react-three/drei`, `@react-three/postprocessing` + `postprocessing` (pmndrs). **No new runtime deps.** This
  is exactly the current `package.json` posture.
- **Gated upgrade (post-judge, behind a flag):** `three/webgpu` (`WebGPURenderer`, `MeshPhysicalNodeMaterial`,
  `SpriteNodeMaterial`), `three/tsl` (`Fn`, `uniform`, `instancedArray`, `mx_noise_float`, `bloom`,
  `scenePass`, `PostProcessing`), and `@react-three/fiber` **v9** (async-gl + `extend(three/webgpu)`). r3f WebGPU
  needs r181+/r184 for stable TSL post; pin to the version your post nodes require.

### 4.2 The TSL-portable master noise (the cohesion hinge)

Keep ONE noise definition that both stacks can consume. GLSL today (`shaders.js`), with a TSL sibling staged for
the port. Same octave knob, same warp, same caustic — so a port doesn't change the *look*:

```js
// GLSL today (shaders.js) — unchanged, parameterized by a compile-time define
float gw_fbm(vec2 p){
  float a = 0.5, v = 0.0;
  for (int i = 0; i < GW_FBM_OCTAVES; i++){ v += a*gw_snoise(p); p = p*2.03 + vec2(11.3,7.7); a *= 0.5; }
  return v;
}
```
```js
// TSL sibling (staged for WebGPU port) — same shape, same octave count, mx_noise_float
import { Fn, float, vec2, Loop, mx_noise_float } from 'three/tsl'
export const gwFbm = Fn(([p]) => {
  const v = float(0).toVar(), a = float(0.5).toVar(), q = p.toVar()
  Loop({ start: 0, end: GW_FBM_OCTAVES }, () => {
    v.addAssign(a.mul(mx_noise_float(q))); q.assign(q.mul(2.03).add(vec2(11.3, 7.7))); a.mulAssign(0.5)
  })
  return v
})
```

### 4.3 Capability flag + renderer selection (the gate)

A single boot probe decides the path, so WebGPU is *opt-in by capability*, never assumed:

```js
// src/scene/gpu.js
export async function pickRenderer() {
  const allowWebGPU = localStorage.getItem('gw_webgpu') === '1'   // off by default for the judge
  const can = !!navigator.gpu && (await navigator.gpu.requestAdapter().catch(() => null))
  return allowWebGPU && can ? 'webgpu' : 'webgl2'
}
```
The judged build never sets `gw_webgpu`; it always lands on `webgl2` and the existing `WebGLRenderer` Canvas.
The upgrade path flips the flag, swaps to the v9 async-gl Canvas (§2.5), and mounts the TSL materials. Both
share the same `forge` store uniforms (§5), so the chambers don't know which renderer drew them.

### 4.4 The r3f component shape (today vs gated)

```jsx
// ForgeCanvas.jsx — TODAY (unchanged, WebGL2): classic gl object, pmndrs Effects
<Canvas gl={{ antialias: true, alpha: false, powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping }} ... >
  <ObsidianSlab quality={quality} />
  {quality !== 'static' && <Effects quality={quality} />}
</Canvas>

// ForgeCanvasGPU.jsx — GATED (WebGPU, post-judge): async gl + extend(three/webgpu)
import * as WGPU from 'three/webgpu'; extend(WGPU)
<Canvas gl={async (p) => { const r = new WGPU.WebGPURenderer({ ...p, antialias: true,
              forceWebGL: false }); await r.init(); return r }} ... >
  <ObsidianSlabGPU quality={quality} />   {/* MeshPhysicalNodeMaterial + colorNode/emissiveNode */}
  {quality !== 'static' && <EffectsGPU quality={quality} />}  {/* TSL PostProcessing nodes */}
</Canvas>
```
`forceWebGL: true` is the safety pin: if the WebGPU branch ever misbehaves on a device, the same Canvas runs the
WebGL2 backend without code changes — useful for the gated path's own fallback testing.

### 4.5 Compute sparks on the gated path (the payoff)

When WebGPU is active, the doc-15 GPGPU ping-pong collapses into a clean compute kernel — same shared
`forge.heat`/`forge.pourFront` uniforms, same `PAL` colors, same bloom selection:

```js
import { instancedArray, Fn, uniform, vec3, float } from 'three/tsl'
const positions = instancedArray(COUNT, 'vec3')
const velocities = instancedArray(COUNT, 'vec3')
const uHeat = uniform(0), uPourFront = uniform(new THREE.Vector3())

const update = Fn(() => {
  const p = positions.element(instanceIndex), v = velocities.element(instanceIndex)
  const toFront = uPourFront.sub(p)
  v.addAssign(toFront.normalize().mul(uHeat.mul(0.6)).add(curl(p.mul(0.6))).mul(uDt))
  v.mulAssign(0.96); p.addAssign(v.mul(uDt))
})().compute(COUNT)   // renderer.computeAsync(update) per frame
```
`SpriteNodeMaterial` gives free billboarding; `colorNode` reads the **same temperature ramp** the slab veins use,
so a compute spark and the vein it left look like the same metal. This is the doc-15 architecture, natively.

### 4.6 Key uniforms / params (shared by BOTH stacks)

| Uniform | Source (mutable `forge` store) | Drives |
|---|---|---|
| `uTime` | `state.clock.elapsedTime` (frozen on `static`) | all animation |
| `uHeat` (0..1) | `forge.heat` (promote from today's `uTemp`, doc 15 §5) | vein flare, spark color, ember count |
| `uPourFront` (vec3) | `forge.pourFront` | spark attractor (compute) |
| `uVeinGlow` / `uIrid` / `uVeinScale` | `sceneFor(forge.route)` presets, dt-damped | per-chamber vein look |
| `GW_FBM_OCTAVES` | tier table (doc 29) — `#define` (GLSL) / loop bound (TSL) | uniform detail thinning |

The point of the table: **the names and meanings are identical across WebGL2-GLSL and WebGPU-TSL.** A port
changes *syntax*, not the contract.

---

## 5. COHESION — shared palette / lighting / uniforms

WebGPU/TSL is a substrate choice, and the rule is that the **substrate must not change the world's identity.**

- **One renderer, one store, one temperature field — regardless of backend.** Both the WebGL2 and gated-WebGPU
  Canvases route every chamber through one renderer and read the same mutable `forge` store (`forge.heat`,
  `forge.pourFront`, `forge.route`, `forge.scrollVel`) exactly as `ObsidianSlab.jsx` does today (`:143–172`). No
  prop-drilling, no second clock (`motion-feel` rule 6). The chambers never branch on renderer.
- **One palette.** `PAL` (`palette.js`) is plain `THREE.Color` + the `v3()` GLSL helper today; under TSL the
  same hex values become `uniform(color(...))` / `vec3(...)` nodes. `PAL.hot`/`PAL.emberHot` stay the >1 HDR
  values that select what blooms — the palette is the bloom selector on either backend (doc 20 / post-fx).
- **One noise grammar.** `gw_fbm`/`gw_snoise`/`gw_caustic` (GLSL) ↔ `gwFbm`/`mx_noise_float` (TSL), same octave
  knob, same warp constants — so veins, heat haze (doc 16), pour flow (doc 09), and sparks share visual DNA on
  either stack.
- **One finish.** WebGL2 ships the pmndrs merged `EffectPass` (bloom + CA + grade + vignette + grain + SMAA,
  `Effects.jsx`); the gated path mirrors it with TSL `PostProcessing` nodes tuned to the *same* numbers
  (`luminanceThreshold 0.55`, warm grade, crushed blacks, OLED grain-as-dither). The grade is brand law
  (post-fx), not a renderer feature — it must read identical on both.
- **Brand law is renderer-agnostic.** The A+E divine-fire (>1 white-gold, never cooling, radiating onto ogham),
  the warm-forge palette, and the pure-void darkness are shader *values*, not API features. Porting must
  reproduce them byte-for-byte; a WebGPU build that shifts the fire hue or the black point has failed cohesion.

---

## 6. MOBILE & PERFORMANCE (the iPhone-15 envelope)

WebGPU does not get a budget exemption — it must fit doc 29's ~9–10 ms steady-state design target on iPhone 15
(DPR capped 1.5), with headroom for A-series thermal throttle.

- **Fill-rate is unchanged by the renderer.** The slab's per-pixel fbm + the bloom pass cost roughly the same in
  WGSL or GLSL. So adopting WebGPU does **not** relax the doc-29 levers (DPR cap, bloom `resolutionScale 0.5`,
  `GW_FBM_OCTAVES` cap, particle overdraw bound). The biggest single lever stays **DPR**, not the API.
- **Where WebGPU helps the budget:** native compute lets us push spark/fluid counts far higher *at the same ms*
  than the FBO path, and MRT/node post can fuse passes. But those are upside on not-yet-built features — the
  judged scene's budget is dominated by what's already here.
- **Tiering still rules.** The three tiers (`high`/`low`/`static`) and the `PerformanceMonitor`+`AdaptiveDpr`
  regression ladder (doc 29 §4.5) are renderer-independent. On the gated WebGPU path, `static`/reduced-motion
  must still produce the frozen warm-vein slab at zero per-frame cost (`frameloop="demand"`).
- **The fallback-quality trap.** If WebGPU is enabled and iOS Safari quietly falls back to WebGL2, we're on
  `WebGPURenderer`'s WebGL2 backend — verify *that* path holds 60fps on a real iPhone 15, because it is **not**
  the same code as classic `WebGLRenderer`. This is the core reason the judged build stays on classic WebGL2.
- **No runtime EXR, ever** — unchanged on both stacks. Env stays the procedural Lightformer rig (`ForgeCanvas`).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**
1. **Ship the world on WebGL2 first.** Do not let WebGPU block the judged build. Lock the master system
   (shared `forge.heat`/`pourFront`, the `GW_FBM_OCTAVES` knob, doc-29 tiers) on the renderer we trust.
2. **Refactor the GLSL into pure functions now** (the TSL-portable discipline), so the later port is a re-host.
   Single noise source, single temperature ramp, single palette — no logic duplicated per effect.
3. **Prototype WebGPU off the critical path** behind the `gw_webgpu` flag, starting with **compute sparks**
   (doc 15) and **fluid** (doc 08) — the features that actually pay for the migration — on desktop Chrome first.
4. **Only then** evaluate flipping the gated path on, and only after measuring the **WebGL2-fallback branch** on
   a real iPhone 15 under sustained load.

**Pitfalls (each has bitten this class of build):**
- **Assuming "Safari ships WebGPU" = "ship WebGPU to the judge."** Shipped ≠ proven-under-thermal-load on iOS.
  The fallback becomes your product on the device that decides the result.
- **Treating the renderer swap as a one-liner.** It's r3f v8→v9 + `extend(three/webgpu)` + async-gl +
  **a post-processing rewrite** (pmndrs → TSL nodes). `@react-three/postprocessing` is WebGL-era; it does not
  drop onto `WebGPURenderer` intact.
- **`onBeforeCompile` muscle memory in TSL.** TSL has no chunk strings; you assign `colorNode`/`normalNode`/
  `emissiveNode`. Porting the slab means rethinking the injection points as nodes, not find-and-replace.
- **Forgetting `await renderer.init()`** before first render (the reason r3f v9's async-gl exists) — a sync gl
  factory returning `WebGPURenderer` renders black.
- **Letting WebGPU change the look.** A port that shifts the fire hue, the black point, the bloom threshold, or
  the grain breaks cohesion. The brand values are shader constants, not API behavior — reproduce them exactly.
- **Float-RT / compute footguns on the fallback.** `instancedArray` is undocumented (learned from
  source/examples); the WebGL2-backend behavior differs from WebGPU — test both, don't assume parity.
- **Skipping the capability gate.** Default-on WebGPU on an unknown device is how you hand the judge a black
  canvas. Default **off**; opt in by measured capability.

---

## 8. SOURCES (2025–2026)

1. brandlens — "The Untold Revolution Beneath iOS 26: WebGPU Is Coming Everywhere" (2025). Safari 26 ships
   WebGPU on iOS/iPadOS/macOS/visionOS, Sept 2025.
   https://brandlens.io/blog/the-untold-revolution-beneath-ios-26-webgpu-is-coming-everywhere-and-it-changes-everything/
2. utsubo — "What's New in Three.js (2026): WebGPU, New Workflows & Beyond."
   https://www.utsubo.com/blog/threejs-2026-what-changed
3. utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist" (r171/r184, RenderPipeline, fallback,
   post migration). https://www.utsubo.com/blog/webgpu-threejs-migration-guide
4. Maxime Heckel — "Field Guide to TSL and WebGPU" (2025-10-14). TSL node system replacing onBeforeCompile,
   r3f WebGPU setup, compute shaders / `instancedArray` particles, WebGL2 cross-target.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026" (TSL bloom via `outputNode`, MRT,
   node PostProcessing). https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
6. Three.js Roadmap — "TSL: A Better Way to Write Shaders in Three.js" (2025).
   https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
7. Three.js Roadmap — "10 Noise Functions for Three.js TSL Shaders" (2025) — `mx_noise_float`, Worley, fbm.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
8. utsubo — "100 Three.js Tips That Actually Improve Performance (2026)" — move particles to compute,
   `instancedArray`, dispose RTs, mutate-in-useFrame. https://www.utsubo.com/blog/threejs-best-practices-100-tips
9. Wawa Sensei — "WebGPU / TSL" + "GPGPU particles with TSL & WebGPU" (2025) — `SpriteNodeMaterial`,
   `instancedArray`, compute particle counts. https://wawasensei.dev/courses/react-three-fiber/lessons/webgpu-tsl
10. Loopspeed / Pragmattic — "React Three Fiber with WebGPU and TSL Node Material" (2025) — r3f v9 async gl,
    `extend(three/webgpu)`, MeshStandardNodeMaterial. https://blog.loopspeed.co.uk/react-three-fiber-webgpu-typescript
11. ektogamat — `r3f-webgpu-starter` (2025) — r3f + WebGPU + post-processing reference (three ^0.177).
    https://github.com/ektogamat/r3f-webgpu-starter
12. ICS Media — "Getting started with Three.js on WebGPU" (2025-05-01) — `WebGPURenderer`, `forceWebGL`, TSL.
    https://ics.media/en/entry/250501/
13. three.js — "WebGPURenderer" manual + docs (r18x) — constructor, `forceWebGL`, `init()`, auto WebGL2 fallback.
    https://threejs.org/manual/en/webgpurenderer.html · https://threejs.org/docs/pages/WebGPURenderer.html
14. LearnWithHasan — "Three.js Shaders Guide — GLSL, ShaderMaterial & TSL (r184)" (2026) — TSL as first-class,
    `colorNode`/`positionNode`. https://learnwithhasan.com/threejs-guide/shaders/
15. three.js GitHub — Release notes r181 / r182 (2026) — node PostProcessing / TSL hardening.
    https://github.com/mrdoob/three.js/releases
16. pmndrs/react-three-fiber — Issue #3352 "WebGPU support" + v9 migration guide — async gl, extend.
    https://github.com/pmndrs/react-three-fiber/issues/3352 · https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

- **9.1 TSL-portability refactor of the master shader.** Rewrite `gw_fbm`/vein/temperature/iridescence as pure
  functions with the single `GW_FBM_OCTAVES` knob and a GLSL↔TSL pair, so a future `WebGPURenderer` build is a
  re-host not a rewrite — and prove the look is byte-identical across both backends on iPhone 15.
- **9.2 Compute-spark + fluid benchmark on WebGPU vs the WebGL2 FBO path.** Quantify the 2–10× claim on *this*
  exact scene (slab + bloom + N sparks) on iPhone 15 Safari WebGPU vs `GPUComputationRenderer` ping-pong, and
  measure the WebGL2-fallback branch of `WebGPURenderer` for parity and thermal behavior.
- **9.3 TSL `PostProcessing` parity with the pmndrs `EffectPass`.** Reproduce the exact warm/crushed-black grade,
  bloom threshold, CA, vignette, and OLED grain-as-dither as TSL nodes, verifying identical output to
  `Effects.jsx` — the gate on whether the finish survives a renderer swap.
- **9.4 iOS-Safari WebGPU stability + capability-gate design.** A real-device matrix (iPhone 15 across iOS 26.x
  point releases) for WebGPU stability under sustained thermal load, plus the `navigator.gpu`/adapter probe and
  `forceWebGL` fallback policy that decides — at boot, safely — which path each user gets.
