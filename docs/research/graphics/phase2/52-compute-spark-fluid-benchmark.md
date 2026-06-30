# 52 — WebGPU Compute Sparks + Fluid Benchmark vs the WebGL2 FBO Path

_Phase 2 deep-dive · GAELWORX forge world · cluster **H-webgpu-tsl-future** · target: iPhone 15 OLED, one
renderer (r3f + three.js) · the files under the lens: `src/scene/Sparks.jsx` + `src/scene/makeGPGPU.js`
(the shipped WebGL2 FBO sim, `phase2/27`), a staged `src/scene/gpu/SparksCompute.js` (the TSL `.compute()`
twin), `src/scene/FillField.js` (`phase2/42`), and a new dev-only `parity/bench/` harness_

> **Reads on top of `00-COHESION-MAP.md`** (§1 the master temperature system every spark/fluid texel samples,
> §5.1 "the sparks … are literally cooling metal droplets," §10 the iPhone-15 fill-rate budget + the
> hard-constraint clause "WebGPU/TSL is a gated post-judge upgrade, authored TSL-portable"), **`phase1/15`**
> (the spark landscape — GPGPU ping-pong as the WebGL2 hero, TSL compute as candidate #1), **`phase1/08`**
> (the fluid landscape — MLS-MPM/`holtsetio/flow` as the WebGPU fluid option, the analytic/flow-map pour as
> the ship pick), **`phase1/30`** (the renderer-stack verdict — ship WebGL2, prototype WebGPU on desktop
> Chrome first; this doc is its named deep-dive **9.2**), **`phase2/27`** (the *exact* WebGL2 `GPUComputation
> Renderer` ping-pong build this benchmarks against), and **`phase2/42`** (the GPGPU fill-field, the
> *field*-shaped cousin of the *particle*-shaped spark sim). Where `phase1/30` said "prototype on desktop
> Chrome first" and `phase2/27` built the WebGL2 path "as a clean re-host target for the post-judge WebGPU
> port," **this document is the actual benchmark**: it ports the spark sim to a TSL `instancedArray` +
> `.compute()` kernel, scopes MLS-MPM fluid via `holtsetio/flow`, and **quantifies the 2–10× claim on THIS
> exact scene** — slab + bloom + N sparks — on iPhone 15 Safari WebGPU vs the `GPUComputationRenderer`
> ping-pong, including the often-ignored WebGL2-fallback branch of `WebGPURenderer`. It does not change what
> ships to the judge. It produces the **number that decides whether WebGPU is ever worth flipping on for the
> forge.**

---

## 1. SCOPE — this element in the GAELWORX world

The forge's two hero GPU-simulation workloads are **(a) the living sparks** that orbit the white-hot
pour-front as it winds the Celtic-interlace channels and fills the GAELWORX letterforms (`00 §5.1`,
`phase2/27`), and **(b) the living molten metal itself** — bubbling, viscous, churning, "alive" (`00 §0`,
`phase1/08`). Today both are solved without compute shaders: sparks run a WebGL2 `GPUComputationRenderer`
two-pass ping-pong (velocity texture → position texture, `phase2/27`); the molten is a faked directed flow —
`gw_warp`+`gw_flow` noise on the surface (`phase1/01`) advected by a baked flow-map (`phase1/09`), with the
fill front derived **analytically** (`00 §1.3`) or, on `high`, by a small ping-pong fill-field (`phase2/42`).
Neither runs a true particle fluid solver. This is the deliberate ship posture (`phase1/08 §3`,
`phase1/30 §3`): WebGL2, no `WebGPURenderer`, no betting the judged iPhone on a renderer path new to iOS.

This deep-dive answers the single question that is *the biggest reason to ever want WebGPU* for this world:
**is the compute path enough faster — on this exact scene, on this exact phone — to be worth the migration
tax, and at what point does it unlock something the FBO path simply cannot reach?** WebGPU adds a third shader
stage WebGL2 does not have — **compute** — and the headline is 2–10× (draw-call/compute-bound) up to 150×
(pure particle integration) ([Heckel 2025]; [Three.js Roadmap, *Introduction to WebGPU Compute Shaders*,
2025]). Those numbers are real, but they are measured on *particle-integration-bound* scenes. The forge is
**fill-rate-bound**, not compute-bound (`00 §10`): a near-full-screen emissive fbm slab + a half-res bloom
pyramid dominate the frame; the spark sim is two passes over a 64×64 texture (a postage stamp). So the
GAELWORX-specific hypothesis — the thing this doc must measure, not assume — is: **the compute speedup is
enormous on the part of the frame that costs almost nothing, and ~neutral on the part that costs everything.**
If true, WebGPU buys *headroom for more sparks / a real fluid*, not a faster current frame — and that is a
very different value proposition than "2–10× faster."

The scope boundary: this benchmarks the **simulation substrate** only (where particle/fluid state lives and
integrates). It does **not** re-decide the renderer (that's `phase1/30`, locked: WebGL2 ships), the post
chain (that's `phase1/30` 9.3 / the TSL `PostProcessing` parity), or the iOS stability matrix (`phase1/30`
9.4). It owns the **compute-vs-FBO number** and the **MLS-MPM fluid feasibility call** for the forge.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Three substrates are on the table for *stateful GPU simulation*, and the fluid question forks into a fourth.
Each is judged against the one-renderer / fill-rate-bound / iPhone-15-thermal envelope.

### 2.1 WebGL2 `GPUComputationRenderer` ping-pong (the shipped baseline — `phase2/27`)

Particle state lives in **HalfFloat render targets** (`texturePosition` xyz+age, `textureVelocity` xyz+seed),
two targets per variable, ping-ponging each frame; a fragment "compute" shader integrates velocity (curl +
`1/(1+d²)` heat-attractor + drag + buoyancy) and position (Euler + front-respawn). three's bundled helper
formalizes it; the 2025 Codrops/Medium R3F GPGPU walkthroughs run it at 16,384 particles with curl flow
([three.js docs *GPUComputationRenderer*, 2025]; [Anas, *Chaotic Flow Fields with GPGPU in R3F*, Jul 2025]).
**This is the benchmark's control.** Its costs (`phase2/27 §6`): two tiny fragment passes (~4k–16k texels
each) + additive overdraw. iOS-correct **only** with `HalfFloatType` (no FP32 RT on iOS — the silent killer,
`phase2/27 §3.3`). **Pros:** real GPU physics on the renderer we ship, zero migration, `@react-three/post
processing` untouched. **Cons:** float-RT bookkeeping (read-write race, linear-filter corruption, RT disposal),
bandwidth heavier than CPU points, and a ceiling — past ~16k particles the float-texture bandwidth and the
fixed two-pass overhead start to bite where compute would not.

### 2.2 WebGPU + TSL `instancedArray` + `.compute()` (the candidate this doc ports)

WebGPU's compute stage lets you allocate a **GPU-persistent storage buffer** with `instancedArray(count,
'vec3')` that lives on the GPU permanently — **no per-frame upload/download, no float-texture juggling** — and
run a `.compute(count)` pass that integrates state in place. `SpriteNodeMaterial` gives free billboarding;
`colorNode` reads the same temperature ramp the slab veins use, so a compute spark and the vein it left are
the same metal (`phase1/30 §4.5`). The reported wins: **50K–350K+ particles at full framerate, 2–10× over the
CPU/FBO path** ([Heckel, *Field Guide to TSL and WebGPU*, Oct 14 2025]; [utsubo, *100 Three.js Tips (2026)*]),
and on pure integration **"10k particles at 30 ms on CPU → 100k under 2 ms on WebGPU compute, ~150×"**
([Three.js Roadmap, *Introduction to WebGPU Compute Shaders*, 2025]); the Roadmap galaxy demo runs **1M
particles at 60 fps** ([Three.js Roadmap, *Interactive Galaxy with WebGPU Compute Shaders*, 2025]); a
million-particle WebGPU installation shipped at Expo 2025 Osaka ([utsubo *100 Tips*, 2026]).

The crucial 2025–26 nuance the headline hides: **the ping-pong does not disappear.** For a *stateful* sim you
still "read from buffer A, write to buffer B, swap pointers next pass" — confirmed by the three.js forum
thread on recreating WebGL ping-pong in WebGPU/TSL ([discourse.threejs.org, 2025]) and the utsubo migration
guide. So our two-state-texture architecture (`phase2/27`) re-hosts to **two `instancedArray` buffers + swap**
*without redesign* — the velocity pass, the position pass, the curl, the attractor, the lifecycle all become
`.compute()` kernels. That architectural identity is exactly why `phase2/27` was built the way it was.

### 2.3 The WebGL2-**fallback** branch of `WebGPURenderer` (the trap this doc must measure)

`WebGPURenderer` falls back to WebGL2 automatically when WebGPU is unavailable, lowering the TSL graph to GLSL
([three.js manual *WebGPURenderer*]). **This is not the same code as classic `WebGLRenderer`** — it is a
distinct, less-tested backend (`00 §10`, `phase1/30 §6`). The honest benchmark must therefore measure **three**
paths, not two: classic-WebGL2 FBO (what ships), WebGPU-active compute (the prize), and **WebGPU-renderer
falling back to WebGL2** (what an iOS user *actually* gets if Safari WebGPU is flaky/unavailable). The third
is the one nobody benchmarks and the one that decides the judge-device risk. The 2025 reality check that makes
this non-optional: **as of r176 (May 2025), `WebGLRenderer` can run ~4× faster than `WebGPURenderer` for many
separate (non-instanced) meshes** ([ICS Media, *Getting started with Three.js on WebGPU*, May 2025];
[three.js issue #30560, *WebGPURenderer UBO perf with many render items*, 2025]). WebGPU is **not universally
faster** — it wins on compute and high-draw-call/instanced scenes, and can *lose* on scenes the forge actually
resembles in its non-particle parts.

### 2.4 MLS-MPM fluid via `holtsetio/flow` (the WebGPU-only fluid option — `phase1/08 A`)

For the *molten metal itself* (not the sparks), the 2025 state of the art is **MLS-MPM (Moving Least Squares
Material Point Method)** on WebGPU compute: a Particle-to-Grid (P2G) stage using `atomicAdd`, ~2 sim steps per
frame, rendered with screen-space fluid rendering. matsuoka's WebGPU-Ocean hits **~100k particles on
integrated graphics, ~300k on a mid GPU**; **`holtsetio/flow` (MIT, created Apr 1 2025) ports this directly to
the three.js `WebGPURenderer`** — proof it composes with our stack — and three.js now ships
`webgpu_compute_particles_fluid` as a core example ([Codrops, *WebGPU Fluid Simulations*, Feb 26 2025];
[80.lv, Jan 13 2025]; [github.com/holtsetio/flow, 2025]; [threejs.org examples, 2025]). The decisive caveat
for *us*: the matsuoka demo runs on a 6-year-old iPad Air 3 **only with particles set to "small,"** and even
on capable hardware the solver **eats the whole frame budget** — "nothing else heavy can share it"
(`phase1/08 A`; [Codrops Feb 2025]). For a forge whose frame is *already* dominated by a near-full-screen
emissive slab + bloom, a fluid solver that wants the whole budget is **mutually exclusive with the rest of the
world** on mobile. MLS-MPM is therefore a *desktop-only spectacle* for GAELWORX, never the mobile pour.

### 2.5 The summary tradeoff table (this scene, this device)

| Substrate | Sim ceiling (this scene) | iPhone-15 frame fit | Migration cost | Look cohesion | Verdict for GAELWORX |
|---|---|---|---|---|---|
| **WebGL2 `GPUComputationRenderer`** (ship) | ~4k mobile / ~16k desktop | **Fits** (sim is a postage stamp; fill-rate dominates) | **Zero** | Native (binds `U`, `gw_forge`) | **Ships to judge** (`phase2/27`) |
| **WebGPU `instancedArray`/`.compute()`** | 50k–350k+ | Fits *if* WebGPU active + thermally stable | High (r3f v8→v9, `extend`, async-gl, **post rewrite**) | Native (same ramp via `colorNode`) | **Prototype on desktop; gated upgrade** |
| **WebGPU-renderer → WebGL2 fallback** | ~as FBO, *less tested* | **Unproven**; can be ~4× slower for non-instanced (#30560) | High (same as above) | Same graph, lowered | **The risk — must be measured** |
| **MLS-MPM `holtsetio/flow`** | 100k–300k particles | **Does not fit mobile** (eats whole budget) | High + bespoke solver | Owns its own look/render | **Desktop spectacle only; not the mobile pour** |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship the WebGL2 `GPUComputationRenderer` spark sim (`phase2/27`) to the judge unchanged. Port it to a
TSL `instancedArray` + `.compute()` twin staged behind the `gw_webgpu` capability gate, and stand up a
three-path benchmark harness — classic-WebGL2 FBO vs WebGPU-compute vs WebGPU-WebGL2-fallback — that produces
real `ms` numbers on desktop Chrome first and then on a real iPhone 15 Safari (the device read that does not
simulate headless). Treat MLS-MPM fluid (`holtsetio/flow`) as a desktop-only spectacle prototype, never the
mobile pour — the mobile pour stays the analytic/flow-map fake (`phase1/08`/`09`, `phase2/42`).** The
benchmark's job is to *retire or confirm* the 2–10× claim **for this scene**, not to repeat it. Justification:

1. **The number is the deliverable, because the headline number doesn't apply to this scene.** The 150× / 2–10×
   wins are particle-integration-bound; the forge is fill-rate-bound (`00 §10`). The *prediction* is that
   compute is hugely faster on the spark sim (which costs ~0.1–0.3 ms today) and ~neutral on the slab+bloom
   (which costs ~6–8 ms) — so the *frame* barely moves, but the *spark ceiling* leaps from ~4k to ~100k. The
   harness measures whether that prediction holds, turning a borrowed claim into a forge-specific decision.

2. **The architecture already re-hosts (we paid that tax in `phase2/27`).** Two state textures + swap = two
   `instancedArray` + swap; velocity/position passes → `.compute()` kernels; the curl, the `1/(1+d²)`
   attractor, the front-respawn lifecycle are math, not API (`phase2/27 §2.3`). The port is a re-host, so the
   benchmark is cheap to build and the result is trustworthy (same algorithm, two substrates).

3. **Desktop-Chrome-first is mandatory (`phase1/30 §7`).** WebGPU compute is dependable on desktop Chrome;
   iPhone 15 Safari WebGPU is new (Safari 26, Sept 2025) and unproven under sustained thermal load. Prototype
   and tune on Chrome, *then* measure the phone — never the reverse, and never ship the phone the unmeasured
   fallback branch.

4. **MLS-MPM is the wrong tool for the mobile pour, full stop.** A solver that wants the whole frame budget
   (`phase1/08 A`; [Codrops Feb 2025]) cannot coexist with a near-full-screen emissive slab + bloom on an
   iPhone 15. The forge's "living metal" is achieved by `gw_warp`/`gw_flow` viscous noise (`phase1/01`,
   `phase2/04`), not Navier–Stokes. `holtsetio/flow` is worth a *desktop* prototype to learn the screen-space
   fluid render, but it is never the judged pour. This confirms `phase1/08 §3`.

5. **Cohesion is non-negotiable across substrates.** Whether a spark's motion is computed in an FBO texel or a
   compute buffer, its *color* is `gw_forge(temp)`, its attractor is `U.uPourFront`, its heat is `U.uHeat`
   (`00 §1`). The benchmark must prove the two substrates are visually identical, not just fast — a faster sim
   that shifts the spark hue has failed the world (`phase1/30 §7`).

**In one line:** *the FBO path ships; the compute twin is benchmarked, not assumed; the 2–10× is re-measured
on this fill-rate-bound scene where it buys headroom not frametime; MLS-MPM stays on desktop.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Now (ship — control arm):** `three` r17x/r18x classic `WebGLRenderer` via `@react-three/fiber` v8;
  bundled `GPUComputationRenderer` (`three/examples/jsm/misc/GPUComputationRenderer.js`); `@react-three/post
  processing`. **No new runtime dep.** (Exactly `phase2/27 §4.1`.)
- **Gated (benchmark + post-judge upgrade — test arm):** `three/webgpu` (`WebGPURenderer`, `SpriteNodeMaterial`),
  `three/tsl` (`instancedArray`, `Fn`, `uniform`, `instanceIndex`, `.compute()`, `mx_noise_float`), `@react-
  three/fiber` **v9** (async `gl` + `extend(three/webgpu)`). Pin r177+ for stable compute; r181+/r184 for the
  node post path. `forceWebGL: true` is the pin that drives the *fallback* arm without code changes.
- **Fluid (desktop spectacle prototype only):** `holtsetio/flow` (MIT) or the core
  `three/examples/jsm` MLS-MPM compute example as reference — **never imported on the mobile path.**
- **Bench (dev-only, never shipped):** a tiny rAF timer + `EXT_disjoint_timer_query_webgl2` (WebGL2 GPU time)
  / `GPUQuerySet` timestamp-queries (WebGPU), wrapped in a `parity/bench/` rig (§4.5).

### 4.2 The compute-spark kernel (the TSL twin of `phase2/27 §4.3/4.4`)

The shipped GLSL velocity/position passes re-host to one `.compute()` kernel over two ping-ponged
`instancedArray` buffers. **Same constants, same `1/(1+d²)` orbit falloff, same drag/buoyancy, same
front-respawn** — only the substrate changes:

```js
// src/scene/gpu/SparksCompute.js  — STAGED behind gw_webgpu; tree-shaken out of the judge build
import { instancedArray, Fn, uniform, vec3, float, instanceIndex, hash,
         mx_noise_vec3, normalize, length } from 'three/tsl'
import * as THREE from 'three'

const COUNT = 4096                                  // 64² parity with the FBO sim (16384 on desktop)
const positions  = instancedArray(COUNT, 'vec3')    // GPU-persistent — survives frames, no upload
const velocities = instancedArray(COUNT, 'vec3')
const ages       = instancedArray(COUNT, 'vec3')    // x=age, y=life, z=seed  (vec3 to dodge scalar-array quirks)

// SHARED uniforms — the SAME references the rest of the world mutates (cohesion, 00 §4.2)
const uDt        = uniform(0)
const uHeat      = uniform(0)                        // ← forge.heat (damped), bound, not cloned
const uTime      = uniform(0)
const uPourFront = uniform(new THREE.Vector3())      // ← forge.pourFront (moving attractor + respawn origin)
const uCurlAmp   = uniform(0.9)
const uFreq      = uniform(0.6)                       // == vein spatial frequency (one grain, 00 §2)

// curl via MaterialX noise — NEW effect, no GLSL original to match → built-in is allowed (phase2/50 §3.4)
const gwCurl = /*#__PURE__*/ Fn(([p]) => {
  const e = float(0.1)
  const dx = mx_noise_vec3(p.add(vec3(e, 0, 0))).sub(mx_noise_vec3(p.sub(vec3(e, 0, 0))))
  const dy = mx_noise_vec3(p.add(vec3(0, e, 0))).sub(mx_noise_vec3(p.sub(vec3(0, e, 0))))
  const dz = mx_noise_vec3(p.add(vec3(0, 0, e))).sub(mx_noise_vec3(p.sub(vec3(0, 0, e))))
  return normalize(vec3(dy.z.sub(dz.y), dz.x.sub(dx.z), dx.y.sub(dy.x)))   // divergence-free swirl
})

export const sparkUpdate = /*#__PURE__*/ Fn(() => {
  const p = positions.element(instanceIndex)
  const v = velocities.element(instanceIndex)
  const a = ages.element(instanceIndex)

  const toFront = uPourFront.sub(p)
  const d       = length(toFront).add(1e-3)
  // ORBIT, don't crash — attraction falls off with distance; curl wins near the front (phase2/27 §4.3)
  const attract = toFront.div(d).mul(uHeat.mul(0.6)).div(float(1).add(d.mul(d)))
  const swirl   = gwCurl(p.mul(uFreq).add(uTime.mul(0.15))).mul(uCurlAmp.mul(float(0.9).add(uHeat.mul(0.6))))

  v.addAssign(attract.add(swirl).mul(uDt))
  v.mulAssign(0.96)                                   // drag
  v.y.addAssign(uDt.mul(float(0.25).mul(float(0.5).add(uHeat))))   // buoyant lift
  p.addAssign(v.mul(uDt))
  a.x.addAssign(uDt)                                  // age

  // front-respawn lifecycle — reborn at the CURRENT moving pour-front (tracks the metal down the channel)
  a.x.greaterThan(a.y).select(/* then */ (() => {
    const j = vec3(hash(a.z.mul(7)), hash(a.z.mul(13)), hash(a.z.mul(29))).sub(0.5)
    p.assign(uPourFront.add(j.mul(0.36)))
    a.x.assign(0)
  })(), /* else */ null)
}).compute(COUNT)

// per frame:  renderer.computeAsync(sparkUpdate)   (uDt/uHeat/uTime/uPourFront already driven by ForgeDriver)
```

The render side is a `SpriteNodeMaterial` whose `positionNode` reads `positions.element(...)` (free
billboarding) and whose `colorNode` is the **shared ramp** — identical to the FBO render material
(`phase2/27 §4.7`), so a compute spark and an FBO spark are the same metal:

```js
import { SpriteNodeMaterial } from 'three/webgpu'
import { gwForge, gwDivineFire } from './tsl/temperature.tsl.js'   // the phase2/50 sibling pair
const t01 = ages.element(instanceIndex).x.div(ages.element(instanceIndex).y).oneMinus().clamp(0, 1)
const mat = new SpriteNodeMaterial({ blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
mat.positionNode = positions.element(instanceIndex)
mat.scaleNode    = t01.mul(5).add(1).mul(0.02)
mat.colorNode    = gwForge(t01.mul(uHeat.mul(0.45).add(0.55)))          // THE shared temperature ramp
mat.colorNode    = mat.colorNode.mix(gwDivineFire(uHeat), ages.element(instanceIndex).z.greaterThan(0.97))
```

### 4.3 The ping-pong question, settled for the kernel

The FBO path ping-pongs because a fragment shader cannot read-and-write the same texel safely (`phase2/27`).
A compute kernel **can** read and write the same `instancedArray` element in place when each invocation only
touches its *own* index (`instanceIndex`) — which is true for our per-particle integration (no particle reads
a neighbour). So the spark sim **collapses to a single in-place buffer per attribute, no swap** — a genuine
simplification over the FBO path. Ping-pong only returns for the *fill-field* (`phase2/42`) and MLS-MPM, where
a texel reads its **neighbours** (diffusion / P2G scatter) — there the two-buffer swap survives the port
([discourse.threejs.org, 2025]). Document this in the bench: the spark kernel is the *best case* for compute
(embarrassingly parallel, no neighbour reads), the fill-field is the *typical case* (still ping-pongs).

### 4.4 The fluid scope (MLS-MPM, desktop spectacle only)

For the desktop-only "real fluid" prototype, the integration shape (never on the mobile path) is:

```js
// DESKTOP PROTOTYPE ONLY — gw_webgpu && !isMobile.  Reference holtsetio/flow's mlsMpmSimulator.js structure.
// P2G compute pass (atomicAdd grid scatter) → grid update → G2P → integrate → screen-space fluid render.
// Bind uHeat/uPourFront so the fluid TINTS via gw_forge (cohesion); cap particles to ~32k even on desktop
// so the slab+bloom still fit. On mobile: this component never mounts; the pour stays gw_warp/gw_flow noise.
```

The MLS-MPM prototype's value is **learning the screen-space fluid render** (depth → smoothed normals →
thickness → `gw_forge`-tinted shading) for a possible *desktop-tier* casting-room, and **quantifying** that
even at "small" particle counts it overruns the mobile budget — the data that confirms `phase1/08`'s "fake the
pour on mobile" verdict with a number instead of a citation.

### 4.5 The three-path benchmark harness (the deliverable's spine)

```
parity/bench/
  spark-bench.js     # mounts slab + bloom + N sparks; cycles N ∈ {1k,4k,16k,64k,256k}; logs GPU ms/frame
  runs:
    A) classic WebGLRenderer + GPUComputationRenderer FBO         (the ship path — control)
    B) WebGPURenderer (WebGPU active) + instancedArray/.compute   (the prize)
    C) WebGPURenderer { forceWebGL:true } + same TSL graph        (the fallback trap)
  measures (per arm, per N, steady-state after 90s thermal soak on device):
    - sim ms      (compute/FBO pass only — EXT_disjoint_timer_query / GPUQuerySet timestamps)
    - frame ms    (full: slab + bloom + sim + post)
    - fps + 1%-low
    - draw calls / renderer.info
  asserts (cohesion gate, not just perf):
    - spark hue at matched (age,heat) within 2/255 across A vs B  (through the tone-mapper, 00 §3.2)
    - true-black void unchanged; PAL.divine white-gold unchanged
```

The harness produces the table that is *this doc's entire reason to exist*. The expected shape (hypothesis to
**confirm or refute on the device**, not a result to quote):

| N sparks | A) FBO **sim ms** | B) compute **sim ms** | A) **frame ms** | B) **frame ms** | Note |
|---|---|---|---|---|---|
| 1k | ~0.10 | ~0.02 | ~7.0 | ~7.0 | frame fill-rate-bound; sim negligible either way |
| 4k (ship) | ~0.25 | ~0.04 | ~7.2 | ~7.0 | **the 5–6× on sim is invisible in the frame** |
| 16k | ~0.9 | ~0.10 | ~8.0 | ~7.1 | FBO sim now visible; compute still ~free |
| 64k | ~4–6 (or RT-bound) | ~0.4 | ~11–13 | ~7.5 | **FBO breaks the budget; compute holds** — the unlock |
| 256k | not feasible (RT bandwidth) | ~1.5 | — | ~8–9 | compute-only territory; desktop/`high`-WebGPU spectacle |

**The headline this produces:** the 2–10× is *understated* on `sim ms` (often 5–20× at the counts that
matter) and *overstated* on `frame ms` (≈neutral at the ship count of 4k, because the frame is fill-rate-bound).
The real value of WebGPU for the forge is the **64k-and-up row** — densities the FBO path *cannot* reach
without breaking the budget — not a faster current frame. That distinction is the decision.

### 4.6 Key uniforms / params (identical names + meanings across both substrates)

| Param | Source (`forge` store) | FBO form | Compute form | Drives |
|---|---|---|---|---|
| `uHeat` | `forge.heat` (damped) | `uniform float` | `uniform(0)` | attraction, spawn radius, color, alpha |
| `uPourFront` | `forge.pourFront` | `uniform vec3` | `uniform(Vector3)` | moving attractor **and** respawn origin |
| `uDt` | `Math.min(dt, 1/30)` | both passes | kernel arg | dt-correct, hitch-proof integration |
| `uCurlAmp`/`uFreq` | ~0.9 / ~0.6 | uniforms | `uniform()` | swirl strength / grain (= vein freq) |
| `COUNT` | tier (4k/16k/64k) | √COUNT RT size | `instancedArray(COUNT)` | sim size |
| substrate | `gw_webgpu` gate | RT ping-pong | in-place buffer (no swap) | the benchmark variable |

The table's point (`phase1/30 §4.6`): a port changes *syntax and substrate*, not the *contract*. The names,
the meanings, and `U` are renderer-agnostic — which is why the benchmark is apples-to-apples.

---

## 5. COHESION — shared palette / lighting / uniforms with the world

This element is the cohesion stress test: two *different simulation substrates* that must produce *one world*.

- **One temperature authority, two substrates.** Both the FBO render material and the compute `SpriteNode
  Material` color from `gw_forge(temp)` / `gw_divineFire` (`phase2/50`'s sibling pair) — the *same* ramp the
  slab veins, cooling letterforms, and channel metal use (`00 §1`). A spark is the metal it left, whether its
  motion came from a texel or a buffer. The benchmark's **hue-within-2/255 assertion** (§4.5) is the proof.
- **One attractor, one heat, one clock.** `U.uPourFront`/`U.uHeat`/`U.uTime` are the **shared references**
  driven by the single `<ForgeDriver/>` (`00 §4.2`, `00 §7` rule 6) — never cloned, never a second rAF, frozen
  on `static`. A strike (`forge.strikeAt`) surges spawn-tightness and core brightness the *same frame* the
  slab veins flare — on either substrate (the cohesion proof).
- **One noise grain.** The compute curl uses `mx_noise_vec3` at `uFreq ≈ 0.6` = the vein spatial frequency.
  This is the one place the port is *allowed* to use built-in MaterialX noise instead of re-hosted Ashima:
  the spark curl is a **new motion field with no shipped-GLSL original to match** (`phase2/50 §3.4`), so a
  field shift is harmless — unlike the hero slab/vein noise, which must re-host (`phase2/50`). The bench
  records whether the swirl *reads* the same; it need not be byte-identical here.
- **One palette, one bloom contract.** Color from `PAL` via `gw_forge`; only the `>1` HDR core blooms — the
  palette *is* the bloom selector (`00 §3.1`). The compute path must feed the *same* bloom (the pmndrs merged
  `EffectPass` on WebGL2, or the TSL `bloom()` node on WebGPU tuned to the same `luminanceThreshold ≈ 0.55`,
  `phase1/30` 9.3). A faster sim that needs a *different* bloom has fractured the finish.
- **One light model.** Sparks are self-lit additive — they ARE light in a void lit only by metal (`00 §5`).
  The A/E divine emitters feed the same `uAEFire` proximity signal the basalt/Ogham reveal reads
  (`00 §5.2`, `phase2/25`) on both substrates.
- **MLS-MPM cohesion (if ever desktop-shipped):** the fluid must tint through `gw_forge(uHeat)` and never own
  its own orange (`00 §7`). `holtsetio/flow` ships its own art-directed look; adopting it means **replacing its
  color/render with our temperature system**, or it is a bolt-on. That re-skin cost is part of why MLS-MPM
  stays a prototype.

---

## 6. MOBILE & PERFORMANCE — inside the iPhone-15 budget

The world is **fill-rate bound, not compute bound** (`00 §10`) — and that single fact reframes the entire
benchmark. The ~9–10 ms steady-state design target (iPhone 15, DPR capped 1.5) is dominated by the slab fbm
(~3.5–4.5 ms) + post (~2.5–3 ms); the spark sim is ~0.1–0.3 ms at the ship count. So:

- **The 2–10× compute win lands on ~0.3 ms, not on the frame.** Halving (or 10×-ing) the sim cost moves the
  frame by a fraction of a millisecond at 4k particles. **WebGPU does not make the current forge frame faster**
  on iPhone 15 — the benchmark must say this plainly so nobody migrates expecting a frametime win.
- **Where WebGPU *does* pay on mobile: the density ceiling.** The FBO path tops out around ~16k particles on
  A16 before RT bandwidth + the two-pass overhead bite; compute holds to ~100k at the same trivial `sim ms`.
  So the mobile question is *do we want >16k sparks?* — and the honest answer for a tasteful forge is usually
  **no** (overdraw, not sim, is the mobile particle cost — `phase2/27 §6`; carpeting the OLED in additive
  sprites is off-brand, not impressive). **The density unlock is mostly a desktop/`high`-WebGPU spectacle,
  not a mobile need.** That is the most important budget conclusion in this doc.
- **The fallback-quality trap is the real mobile risk (arm C).** If WebGPU is enabled and iOS Safari falls
  back to WebGL2, we run TSL→GLSL through `WebGPURenderer`'s *less-tested* backend — which can be **~4× slower
  for non-instanced meshes** (#30560, ICS Media May 2025). The bench's arm C measures *that* branch on a real
  iPhone 15; if it doesn't hold 60 fps, the gate stays off. This is why the judged build is classic WebGL2.
- **iOS WebGPU has hard limits + thermal reality.** Safari's Metal backend imposes buffer-size caps (256 MB
  default on smaller devices, scaling up) and "binding size larger than maximum" errors on large allocations
  ([App Developer Magazine, *WebGPU in iOS 26*, 2025]); A-series neural/GPU work triggers thermal protection
  aggressively ([HackerNoon, *Thermal Throttling in Real-Time AR*, 2025]). A million-particle compute buffer
  is a desktop fact; on iPhone 15 the buffer cap + thermal ceiling bound it far lower. The bench's **90-second
  thermal-soak** measurement (not a cold 60 fps) is mandatory — the forge throttles after ~90 s (`00 §10`).
- **MLS-MPM does not fit, measured.** The bench's fluid arm confirms with a number what `phase1/08` asserted:
  even "small" MLS-MPM counts overrun the mobile budget when a near-full-screen emissive slab + bloom must
  share the frame. The mobile pour stays `gw_warp`/`gw_flow` noise; MLS-MPM is desktop-only.
- **Tiering + `static` unchanged.** GPGPU/compute on `high`, CPU points (`phase2/09`) on `low`, frozen
  `<Sparkles>` on `static` — renderer-independent (`phase1/30 §6`). No runtime EXR on either stack (`00 §5.3`).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Order of operations (each verified the repo way — `npm run build` green → `qa-route` 393×852 + 1440×900,
0 console errors → device read — before the next):**

1. **Ship + lock the FBO control arm first (`phase2/27`).** The benchmark is meaningless without a correct,
   shipped baseline. Confirm `HalfFloatType` + `NearestFilter` + `getCurrentRenderTarget` every frame + dt-clamp
   (`phase2/27 §7`). This is the control; do not touch it during the WebGPU work.
2. **Port the kernel on desktop Chrome (`phase1/30 §7`).** Author `SparksCompute.js` re-hosting the *exact*
   attractor/drag/lifecycle math. Verify the compute path *looks identical* to the FBO path side-by-side on
   desktop before measuring anything — a transcription bug masquerades as a perf difference.
3. **Build the three-arm timer harness.** Wire `EXT_disjoint_timer_query_webgl2` (arms A/C) and WebGPU
   timestamp queries (arm B). Measure **`sim ms` separately from `frame ms`** — conflating them is how the
   "2–10×" myth survives; the sim win is real and the frame win is ~nil, and only separate timers show both.
4. **Sweep N on desktop, then soak on iPhone 15.** Cycle N ∈ {1k…256k}; record steady-state *after a 90 s
   thermal soak* on the phone, not cold. Run arm C (`forceWebGL:true`) on the phone — that is the branch a real
   iOS user hits if Safari WebGPU is unavailable, and the one that decides the gate.
5. **Scope MLS-MPM on desktop only.** Stand up `holtsetio/flow`-shaped P2G/G2P; tint via `gw_forge`; measure
   it overrunning the budget. Never mount it on the mobile path. The output is a *number*, not a feature.
6. **Decide the gate from the data.** Flip `gw_webgpu` on *only* if arm B holds 60 fps thermally-soaked on the
   phone, arm C holds 60 fps (the fallback users get), and the hue/black-point assertions pass. Otherwise the
   data justifies *staying* on WebGL2 — a valid, expected outcome (`phase1/30 §3`).

**Pitfalls, ranked by cost:**

- **Quoting "2–10×" as a frametime win.** It is a *sim* win on a sim that costs ~0.3 ms here; the *frame* is
  fill-rate-bound and barely moves at 4k. Migrating for a frametime gain that doesn't exist is the headline
  trap. Measure `sim ms` and `frame ms` separately; report both.
- **Never measuring arm C (the fallback).** Benchmarking only classic-WebGL2 vs WebGPU-active hides the branch
  iOS users actually hit. `WebGPURenderer`'s WebGL2 backend is *not* classic `WebGLRenderer` and can be ~4×
  slower for non-instanced meshes (#30560). Always measure all three.
- **Cold-measuring on the phone.** iPhone 15 throttles after ~90 s (`00 §10`). A cold 60 fps that drops to 40
  under soak is a fail you won't see without the soak. Steady-state only.
- **Shipping MLS-MPM to mobile "because it ran on my M-series Mac."** It eats the whole budget (`phase1/08 A`);
  on iPhone 15 with a slab + bloom it cannot coexist. Desktop spectacle only.
- **Forgetting `.toVar()` / immutable-node footguns in the compute kernel.** TSL nodes are immutable by
  default; `instancedArray.element()` accumulators mutate in place but locals must `.toVar()` (`phase2/50 §7`;
  [Three.js Roadmap, *Getting AI to Write TSL That Works*, 2026]). The #1 transcription bug.
- **Assuming the spark kernel still ping-pongs.** It does **not** — per-particle, per-index integration reads
  no neighbour, so the buffers update in place (§4.3). Carrying the FBO swap into the kernel is wasted work.
  The fill-field (`phase2/42`) *does* still ping-pong (neighbour reads) — don't conflate them.
- **Buffer-cap / binding-size errors on iOS.** Large `instancedArray` allocations hit Safari's Metal buffer
  cap ([App Developer Magazine 2025]). Size buffers to the *mobile* count (≤16k), not the desktop spectacle.
- **Letting the compute path own its own bloom/grade.** The finish is brand law, not a renderer feature
  (`phase1/30` 9.3). The TSL `bloom()` node must match the pmndrs threshold/grade exactly, or the world
  fractures on the gated path.
- **Async footgun.** `WebGPURenderer` needs `await renderer.init()` before first render (the reason r3f v9's
  async `gl` exists); a sync factory renders black (`phase1/30 §7`).

---

## 8. SOURCES (2025–2026)

1. **Maxime Heckel — _Field Guide to TSL and WebGPU_**, **Oct 14, 2025**. `instancedArray` GPU-persistent
   storage buffers, `computeInit` + update `.compute()` passes for GPGPU particles with attractors/curl, the
   FBO-ping-pong → compute re-host, `SpriteNodeMaterial`, 2–10× / 50K–350K+ particle claims, WebGL2
   cross-target. The canonical recipe this doc ports. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
2. **Three.js Roadmap — _Introduction to WebGPU Compute Shaders_**, **2025**. "10k particles at 30 ms on CPU
   → 100k under 2 ms on WebGPU compute, ~150×"; storage buffers persist between frames (init → update →
   render); the compute stage WebGL2 lacks. The quantified ceiling.
   https://threejsroadmap.com/blog/introduction-to-webgpu-compute-shaders
3. **Three.js Roadmap — _Interactive Galaxy with WebGPU Compute Shaders_**, **2025–26**. 1M-particle
   position+velocity `instancedArray` at 60 fps; the stateful init→update→render compute pattern; ping-pong
   survives for neighbour-reading sims. https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders
4. **Codrops — _WebGPU Fluid Simulations: High Performance & Real-Time Rendering_**, **Feb 26, 2025**. MLS-MPM
   ~100k particles integrated / ~300k mid-GPU, P2G `atomicAdd`, ~2 sim steps/frame, screen-space fluid render,
   the iPad Air 3 "small particles only" caveat, "eats the whole frame budget." The fluid-feasibility data.
   https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/
5. **holtsetio/flow — _Realtime MLS-MPM particle system, three.js `WebGPURenderer`_** (MIT, created **Apr 1,
   2025**). Direct three.js `WebGPURenderer` port of matsuoka's WebGPU-Ocean MLS-MPM — proof MLS-MPM composes
   with our stack; the desktop-spectacle reference (`mlsMpmSimulator.js`: P2G/grid/G2P structure).
   https://github.com/holtsetio/flow · live: https://holtsetio.com/lab/flow/
6. **three.js — _webgpu compute particles fluid_ example** (core, **2025**). MLS-MPM in compute shaders shipped
   as a maintained three.js example — the canonical in-engine fluid compute reference.
   https://threejs.org/examples/webgpu_compute_particles_fluid.html
7. **ICS Media — _Getting started with Three.js on WebGPU_**, **May 1, 2025**. r176 benchmark: `WebGLRenderer`
   ~4× faster than `WebGPURenderer` for separate (non-instanced) meshes; `forceWebGL`, `init()`. The
   "WebGPU is not universally faster" + fallback-branch caution. https://ics.media/en/entry/250501/
8. **mrdoob/three.js — Issue #30560, _WebGPURenderer: current UBO system has severe performance issues with
   many render items_**, **2025**. Concrete evidence the WebGPU/fallback path can lose to classic WebGL on
   draw-heavy non-instanced scenes — the arm-C risk this doc measures.
   https://github.com/mrdoob/three.js/issues/30560
9. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_** & **_Migrate Three.js to WebGPU
   (2026)_**, **Jan 2026**. "Move particle systems to compute shaders," `instancedArray`, dispose RTs,
   mutate-in-`useFrame`; r171 zero-config `three/webgpu` + auto WebGL2 fallback, `forceWebGL`, post-migration
   surface; the Expo 2025 Osaka million-particle WebGPU install.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips · https://www.utsubo.com/blog/webgpu-threejs-migration-guide
10. **three.js forum — _Struggling to recreate WebGL ping-pong buffers with WebGPU and TSL_**, **2025**.
    "Read from buffer A, write to buffer B, swap pointers" — confirms ping-pong survives the port for
    neighbour-reading sims (fill-field/MLS-MPM), while per-index particle kernels update in place (§4.3).
    https://discourse.threejs.org/t/struggling-to-recreate-webgl-ping-pong-buffers-with-webgpu-and-tsl/87462
11. **Wawa Sensei — _GPGPU particles with TSL & WebGPU_**, **2025**. `instancedArray`, `.compute()`,
    `SpriteNodeMaterial`, R3F v9 async-gl wiring for a compute particle system — the r3f integration reference
    for the staged twin. https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu
12. **Codrops — _Matrix Sentinels: Building Dynamic Particle Trails with TSL_**, **May 5, 2025**, and
    _Particles, Progress, and Perseverance: A Journey into WebGPU Fluids_, **Jan 29, 2025**. `instancedArray`
    multi-buffer particle/life patterns and a first-person WebGPU-fluid build log — contemporary production
    references for the compute-particle idiom and the fluid difficulty.
    https://tympanus.net/codrops/2025/05/05/matrix-sentinels-building-dynamic-particle-trails-with-tsl/ ·
    https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/
13. **App Developer Magazine — _WebGPU in iOS 26_**, **2025**, and **HackerNoon — _Thermal Throttling in
    Real-Time AR_**, **2025**. iOS 26 Metal-backed WebGPU + buffer-size caps ("binding size larger than
    maximum") and A-series thermal-protection aggressiveness — the mobile hard limits the 90 s soak measures.
    https://appdevelopermagazine.com/webgpu-in-ios-26/ · https://hackernoon.com/what-happens-when-you-max-out-an-iphone-thermal-throttling-in-real-time-ar
14. **80.lv — _This MLS-MPM 3D Fluid Simulation Runs In Your Browser_**, **Jan 13, 2025**. Coverage of the
    matsuoka WebGPU MLS-MPM fluid — counts, hardware, the "production-ready WebGPU physics" framing.
    https://80.lv/articles/check-out-this-real-time-3d-fluid-simulation-implemented-in-webgpu

---

## 9. DEEP-DIVE CANDIDATES

1. **The arm-C fallback characterization on real iPhone 15 point releases.** A device matrix (iOS 26.x) for
   `WebGPURenderer { forceWebGL:true }` vs classic `WebGLRenderer` on the *exact* slab+bloom+sparks scene —
   the under-measured branch that decides the gate, including the #30560 non-instanced-mesh penalty and whether
   it touches our <20-draw-call forge. (Overlaps `phase1/30` 9.4.)
2. **The overdraw ceiling, not the sim ceiling, as the true mobile particle limit.** Quantify where additive
   spark overdraw (covered pixels, not count) breaks the iPhone-15 fill-rate budget — proving the WebGPU
   density unlock (16k→100k) is a desktop spectacle, not a mobile need, and pinning the tasteful mobile spark
   count from data. (Overlaps `phase2/27` §6.)
3. **MLS-MPM screen-space fluid render as a desktop-tier casting-room.** Port `holtsetio/flow`'s P2G/G2P +
   depth→normal→thickness render, re-skinned to `gw_forge`/`uHeat`, as a `high`-WebGPU-desktop-only chamber —
   and the exact budget number at which it stops coexisting with the slab+bloom, confirming the mobile-fake
   verdict with a measured frametime. (Owns the fluid half of `phase1/08`.)
4. **The fill-field compute port (`phase2/42`) — the neighbour-reading case.** Unlike the spark kernel, the
   GPGPU flood field reads neighbours (diffusion), so it *keeps* the two-buffer ping-pong on WebGPU — benchmark
   the flood-field `.compute()` twin vs its WebGL2 FBO original to measure compute's win on the *typical*
   (neighbour-reading) sim, not just the embarrassingly-parallel spark best case.
