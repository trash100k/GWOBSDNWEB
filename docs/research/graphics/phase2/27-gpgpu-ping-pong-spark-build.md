# 27 — The WebGL2 GPGPU Ping-Pong Spark System Build

_Phase 2 deep-dive · GAELWORX forge world · cluster **C-flow-pour** · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js), `GPUComputationRenderer` velocity+position passes · the files under the knife:
`src/scene/Sparks.jsx` (new), `src/scene/shaders.js` (curl + ramp), `src/scene/forgeUniforms.js` (the shared
pool `U`), `src/store.js` (`forge.pourFront` / `forge.heat`)_

> **Reads on top of `00-COHESION-MAP.md`** (§1 the master temperature system, §2 the shared noise basis lists
> `gw_curl3`, §5.1 "the sparks … are literally cooling metal droplets," §10 the iPhone-15 perf budget),
> **`phase1/15`** (the spark/ember system landscape — which named GPGPU ping-pong as the *hero* path), and
> **`phase2/09`** (the *CPU-stepped counter-proposal* for the ~300-particle ambient case). This document owns
> the **opposite end of the same ladder**: the full **WebGL2 GPGPU ping-pong** build via three's bundled
> `GPUComputationRenderer` — the **proven workhorse** that earns its keep when the forge wants a *dense*,
> physically-advected spark cloud orbiting the pour-front (the casting-room and forge-mouth chambers), and
> the *de-risked WebGL2 path to the same look that a WebGPU/TSL compute port (`phase1/15` candidate #1) will
> later re-host*. Where `phase2/09` argues "300 points fit a CPU loop, skip GPGPU," this doc argues the
> inverse case and builds the GPU pipeline correctly: **HalfFloat targets, NearestFilter, dt-clamp,
> `getCurrentRenderTarget` every frame, curl-noise turbulence, a `1/(1+d²)` heat-attractor so sparks *orbit*
> the front instead of crashing into it, front-respawn lifecycle, and the `<Sparkles>`/CPU-points fallback
> ladder underneath.** The two docs are deliberately the two rungs of one tier system: GPGPU on `high` when
> the chamber wants density; the CPU `Points` of `phase2/09` on `low`; `<Sparkles>` frozen on `static`.

---

## 1. SCOPE (this element in the GAELWORX world)

Sparks are the **living breath of the heat** — the tell that the molten metal is *alive*, not a lit texture.
In the casting-room (the live pour) and the forge-mouth arch (the white-hot mouth radiating toward the
viewer), the metal throws a **dense, churning cloud of cooling droplets** that orbit the white-hot leading
edge of the pour (`uPourFront`) as it winds the Celtic-interlace channels and fills the GAELWORX letterforms.
These are not ambient motes drifting up a still room (that is `Embers.jsx`, the `phase2/09` CPU job); they
are **physically advected particles** — born white-hot at the pour-front, dragged into orbit by buoyant
thermals and curl-noise turbulence, cooling along the **shared master temperature ramp** as they age, dying
to ember-red and respawning at the front. The A/E divine-fire zones spawn the rarest, brightest,
never-cooling sparks (the keystone exception, `00 §1.4`).

The reason this element specifically wants a **GPU simulation** — and not the CPU loop that `phase2/09`
correctly prefers for 300 ambient embers — is **count × statefulness**. When the chamber calls for **4,000–
16,000** advected sparks (a dense forge-mouth blast, a churning casting-room), the per-frame integration of
each particle's velocity and position through a curl field, re-sampled along its path, is exactly the work
the GPU does for free and the CPU main thread does at the cost of INP. The GPGPU ping-pong pattern keeps the
entire simulation **on the GPU, never round-tripping to the CPU** — the same architectural win the WebGPU
compute path will later formalize, available *today* on the WebGL2 renderer the judge device ships. This doc
builds that pipeline so it is correct, mobile-safe, cohesion-bound, and a clean re-host target for the
post-judge WebGPU port.

The hard scope boundary: **this is the `high`-tier hero only.** It does not replace `phase2/09`'s CPU sparks
(the `low` rung) or `<Sparkles>` (the `static` rung) — it sits **above** them in one `Sparks.jsx` that picks
the rung by `forge.quality`. The cohesion contract (`00 §7`) is non-negotiable: whichever rung runs, the
render material samples the *same* `gw_forge(temp)` ramp, the *same* `uPourFront`, the *same* `uHeat`, so a
spark looks like the metal it left regardless of where its motion was computed.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The decision forks on **renderer** (WebGL2 today vs WebGPU), then on **simulation substrate** (float textures
vs storage buffers vs CPU), then on **library vs hand-rolled**. The cohesion map pins the judge device to
WebGL2 + `onBeforeCompile` (`00 §10` hard constraint), which decides the headline; the rest is the ladder.

### 2.1 GPUComputationRenderer ping-pong (WebGL2) — the proven workhorse, this doc's pick

Particle state lives in **floating-point textures**: a `texturePosition` (xyz = world pos, w = age) and a
`textureVelocity` (xyz = velocity, w = seed). Each is a *variable* with its own fragment "compute" shader and
**two render targets that ping-pong** — frame N's output texture is frame N+1's input, so you never read and
write the same texture in one pass (the race that produces garbage/flicker). three's bundled
`GPUComputationRenderer` (`three/examples/jsm/misc/GPUComputationRenderer.js`) formalizes the whole pattern:
`addVariable` / `setVariableDependencies` / `init` / `compute` / `getCurrentRenderTarget(var)`. The 2025
Codrops "Dreamy Particle Effect" walkthrough and the July-2025 Medium "Chaotic Flow Fields with GPGPU in R3F"
both run this exact pipeline with curl-noise flow fields at 16,384 particles inside r3f; the three.js forum
GPGPU-particles showcase (2025) is full of the same. **Pros:** real GPU-side velocity integration, curl
turbulence, a *moving* attractor, divergence-free organic motion — the spark behavior we need — on the
renderer we already ship, with `@react-three/postprocessing` untouched. **Cons:** float-RT support and the
ping-pong bookkeeping are fiddly; the read-what-you-write race, the linear-filter corruption footgun, and
float-RT memory that must be disposed are all real; more bandwidth than the CPU path. **The right tool when
the count is in the thousands** — which the dense chambers want.

### 2.2 CPU-stepped `Points` (the `phase2/09` rung beneath this)

Positions in a plain `Float32Array`; an alloc-free `useFrame` advects N points through `gw_curl3` over a
substep loop, writes back, flags `needsUpdate`. At N ≈ 256–320 this is **sub-millisecond CPU**, zero
render-target memory, zero float-RT dependency. **This is the correct call for the ambient ember count and
the `low` tier** — `phase2/09` builds it in full. It does **not** scale to the thousands the dense chambers
want (the per-frame JS loop is linear in N, and INP suffers past ~1–2k). The relationship to this doc:
**they are two rungs of one ladder, not competitors** — GPGPU on `high` (dense), CPU points on `low` (sparse).

### 2.3 WebGPU + TSL compute (`instancedArray` + `.compute()`) — the 2026 destination

With **Safari 26 shipping WebGPU in Sept 2025** (macOS/iOS/iPadOS) and three.js **r171+ making WebGPU
production-ready with zero-config imports**, TSL compute is the frontier. `instancedArray(count, type)`
creates a **GPU-persistent storage buffer** that lives on the GPU permanently — no per-frame upload/download —
and a `.compute()` pass updates it; the CPU "never downloads particle positions, it just tells the GPU to
execute the compute shader," eliminating the CPU↔GPU bottleneck. The Three.js Roadmap galaxy demo (2025–26)
runs **1M particles at 60fps** this way; the intro-to-compute piece quantifies **"10k particles at 30ms on
CPU → 100k in under 2ms on WebGPU compute, a 150× improvement."** Heckel's _Field Guide to TSL and WebGPU_
(Oct 2025) shows the exact recipe: an `instancedArray` of vec3 for positions, a `computeInit` pass to seed,
an update compute pass for curl + attractors. **Crucially, the ping-pong does not disappear** — for a
*stateful* sim you still "read from buffer A, write to buffer B, swap pointers next pass" (the three.js forum
"recreate WebGL ping-pong with WebGPU/TSL" thread, 2025, and the utsubo migration guide confirm this). So the
WebGL2 GPGPU pattern this doc builds is **architecturally identical** to the WebGPU port: two state buffers,
swap each frame, a velocity pass and a position pass. **Cons for the judge build:** swapping
`WebGLRenderer → WebGPURenderer` forces the postprocessing chain onto the native node pipeline (a real
migration of `Effects.jsx`), and the WebGL2-fallback branch of `WebGPURenderer` is *less* tested than classic
`WebGLRenderer` — betting the judged iOS demo on it is the documented mistake (`00 §10`). **Deferred,
authored-portable, not adopted in Phase 2.**

### 2.4 Libraries: `Three-VFX`/`r3f-vfx`, `three-nebula`, drei `<Sparkles>`

`r3f-vfx` (MIT, Jan 2026) ships our exact feature set — attractors, turbulence, gravity, friction, lifetime
bezier curves, additive blending, CPU fallback — but is **WebGPU-first** (same migration cost as 2.3) and
**owns its own color/intensity**, which collides head-on with the single-`uTemp` cohesion rule. `three-nebula`
is mature but **largely CPU-stepped** and equally wants to own the look. **drei `<Sparkles>`** is the cheapest
drop-in (`count/speed/opacity/color/size/noise`, GPU points) — ambient-only, single flat color, no attractor.
It is **not the hero; it is the `static` floor** (frozen, on-brand ember field at zero per-frame cost). All
three are rejected as the hero for the same reason: they break cohesion by owning the particle look instead of
sampling `gw_forge`/`uPourFront`/`uHeat`.

### 2.5 Transform feedback (WebGL2 native)

The vertex shader writes back to buffers — no float-texture juggling. **Cons:** in the three ecosystem the
FBO/`GPUComputationRenderer` path is vastly better-trodden and r3f-idiomatic; every 2025–26 source reaches for
ping-pong FBO or TSL compute, not raw transform feedback. **Skip — no ecosystem leverage**, and it doesn't
re-host to WebGPU as cleanly as the two-buffer ping-pong does.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A WebGL2 GPGPU ping-pong spark system via three's bundled `GPUComputationRenderer`, with HalfFloat targets +
NearestFilter, a velocity pass (curl turbulence + `1/(1+d²)` heat-attractor + drag + buoyancy) and a position
pass (dt-clamped Euler integrate + front-respawn lifecycle), a render material that samples the shared
`gw_forge(temp)` ramp into an HDR core, and a hard tier ladder underneath it: GPGPU on `high` →
`phase2/09` CPU points on `low` → frozen `<Sparkles>` on `static`.** Justification against the world and the
hard constraints:

1. **One renderer, no migration risk.** `00 §10` and `forge-scene` mandate one `WebGLRenderer` and the whole
   `@react-three/postprocessing` chain on it. GPGPU ping-pong gives **real heat-seeking spark physics on the
   renderer we already ship** — no `WebGPURenderer` swap, no postprocessing rewrite, no betting the judged iOS
   demo on the new path. (2.3's WebGPU win is real but post-judge.)

2. **The pour-front is a moving attractor; sparks must *orbit* it.** That is precisely what the velocity pass
   does — curl swirl + a *falloff* attraction so they orbit, not crash. The CPU path (`phase2/09`) does the
   same at low count; GPGPU does it at the **thousands** the dense casting-room / forge-mouth chambers want,
   without spending the CPU main thread.

3. **HalfFloat is mandatory, not a nicety — and it's an iOS *correctness* requirement, not just a perf one.**
   iOS Safari exposes `EXT_color_buffer_half_float` but **not** full-32-bit `EXT_color_buffer_float` (iOS does
   not support FP32 render targets; the WebKit/Khronos bug threads are explicit). So on the judge device,
   **`FloatType` render targets will fail to be color-renderable and the sim will silently break** — the only
   correct choice is **`HalfFloatType`**, which the small-scene position range tolerates fine. This single fact
   makes HalfFloat the headline of the build, not an optimization.

4. **Cohesion by construction.** We hand-roll the sim so the render material binds the **shared `U` pool**
   (`uTemp`/`uHeat`/`uPourFront`) and inlines `PAL` via `v3()`; the curl reuses `gw_snoise3`/`gw_fbm` from
   `shaders.js`. A library (2.4) would own the look and fracture the world.

5. **Architecturally portable to WebGPU.** Two state textures + swap each frame = two `instancedArray` buffers
   + swap each frame. The velocity/position split, the curl, the attractor, the lifecycle all re-host into
   `.compute()` passes (Heckel 2025) **without redesign** — `phase1/15` candidate #1. We pay the WebGL2 tax
   now and inherit the WebGPU ceiling later as a re-host.

6. **Mobile budget honored by the ladder.** GPGPU at these counts is cheap on A16 (§6); when the device or the
   chamber doesn't justify it, the tier drops to the CPU points of `phase2/09`, then to frozen `<Sparkles>` —
   one component, three rungs, uniform degrade (`00 §7` rule 9).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js** — current repo pin. Use the **bundled `GPUComputationRenderer`**
  (`three/examples/jsm/misc/GPUComputationRenderer.js`) — **no new dependency**. (It is the same helper the
  three docs document and the 2025 Codrops/Medium walkthroughs use; the `epranka/gpucomputationrender-three`
  npm repackage exists only for non-bundler setups — we already bundle `three`.)
- **`@react-three/fiber` / `@react-three/drei`** — as installed; `<Sparkles>` retained for the `static` floor.
- Reuse `gw_snoise3` / `gw_fbm` (`src/scene/shaders.js`, landed in `phase2/07`) for the curl potential, and
  `gw_tempColor` / `gw_tempEmissive` / `gw_forge` / `gw_divineFire` (`phase2/01`, `00 §1`) for the render-side
  color. Reuse `PAL` / `v3()` (`palette.js`) and the master pool `U` (`forgeUniforms.js`, `00 §4.2`).
- **Deferred (post-judge, WebGPU only):** `three/webgpu` + `three/tsl` `instancedArray` + `.compute()`
  (Heckel 2025; Three.js Roadmap compute series).

### 4.2 GPUComputationRenderer wiring (HalfFloat + NearestFilter — the make-or-break setup)

`GPUComputationRenderer` defaults its internal targets to `FloatType`. **On iOS that target is not
color-renderable** (no FP32 RT support) — so we **override the type to `HalfFloatType`** and force
**`NearestFilter`** on the seeded textures (linear filtering interpolates across texels and corrupts the
packed position/velocity data — the classic GPGPU footgun, `00`/`phase1/15` trap). The sim resolution is a
square sized to the count: `√count` (e.g. 64×64 = 4,096, 128×128 = 16,384).

```js
// src/scene/makeGPGPU.js
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import * as THREE from 'three'
import { velocityFrag, positionFrag } from './sparkCompute.js'  // GLSL strings (§4.3/§4.4)

export function makeGPGPU(gl, count, U) {
  const SIZE = Math.ceil(Math.sqrt(count))                 // 64 → 4096, 128 → 16384
  const gpu  = new GPUComputationRenderer(SIZE, SIZE, gl)

  // HALF-FLOAT — iOS has no FP32 RT (EXT_color_buffer_float absent); FloatType silently fails.
  gpu.setDataType(THREE.HalfFloatType)                     // overrides the FloatType default

  const pos0 = gpu.createTexture()                         // xyz = pos, w = age
  const vel0 = gpu.createTexture()                         // xyz = vel, w = seed
  seedTextures(pos0, vel0, SIZE, U)                        // §4.5 — born at the pour-front, seed-stable

  const posVar = gpu.addVariable('texturePosition', positionFrag, pos0)
  const velVar = gpu.addVariable('textureVelocity', velocityFrag, vel0)
  gpu.setVariableDependencies(posVar, [posVar, velVar])    // each pass reads BOTH state textures
  gpu.setVariableDependencies(velVar, [posVar, velVar])

  // NEAREST — linear filtering corrupts packed state. Belt-and-braces over the GPGPU default.
  for (const v of [posVar, velVar]) {
    v.minFilter = THREE.NearestFilter
    v.magFilter = THREE.NearestFilter
    v.wrapS = v.wrapT = THREE.ClampToEdgeWrapping
  }

  // Shared uniforms: bind the SAME references the rest of the world mutates (cohesion, 00 §4.2).
  const vu = velVar.material.uniforms
  vu.uDt = { value: 0 };  vu.uTime = U.uTime;  vu.uHeat = U.uHeat
  vu.uPourFront = U.uPourFront;  vu.uCurlAmp = { value: 0.9 };  vu.uFreq = { value: 0.6 }
  const pu = posVar.material.uniforms
  pu.uDt = { value: 0 };  pu.uPourFront = U.uPourFront;  pu.uHeat = U.uHeat

  const err = gpu.init()
  if (err !== null) { console.warn('[Sparks] GPGPU init failed → fallback', err); return null }
  return { gpu, posVar, velVar, SIZE, dispose: () => gpu.dispose?.() }
}
```

The `gpu.init()` return is the **fallback gate**: if HalfFloat RTs aren't renderable (shouldn't happen on A16,
but defensively), it returns non-null and we demote to the `low` CPU path rather than render a black canvas.

### 4.3 Velocity compute pass (curl turbulence + heat-attractor orbit + drag + buoyancy)

Curl noise is **divergence-free** — no sources/sinks — so sparks swirl around the front without all piling
onto it. Build the curl from the in-repo `gw_fbm`/`gw_snoise3` potential (the *same* noise the veins use, so
the air's swirl shares the metal's grain — `00 §2`). The attractor uses a **`1/(1+d²)` falloff** so the pull
weakens with distance — this is the single line that makes sparks **orbit, not crash**:

```glsl
// sparkCompute.js — velocityFrag. (texturePosition/textureVelocity provided by GPUComputationRenderer.)
uniform float uDt, uTime, uHeat, uCurlAmp, uFreq;
uniform vec3  uPourFront;
// gw_fbm / gw_snoise3 inlined from shaders.js (the shared basis)
vec3 gwPotential(vec3 p){ return vec3(gw_fbm(p.yz+13.1), gw_fbm(p.zx+47.7), gw_fbm(p.xy+91.3)); }
vec3 gwCurl(vec3 p){
  const float e = 0.1;
  vec3 dx=vec3(e,0,0), dy=vec3(0,e,0), dz=vec3(0,0,e);
  float x = (gwPotential(p+dy).z-gwPotential(p-dy).z) - (gwPotential(p+dz).y-gwPotential(p-dz).y);
  float y = (gwPotential(p+dz).x-gwPotential(p-dz).x) - (gwPotential(p+dx).z-gwPotential(p-dx).z);
  float z = (gwPotential(p+dx).y-gwPotential(p-dx).y) - (gwPotential(p+dy).x-gwPotential(p-dy).x);
  return normalize(vec3(x,y,z) / (2.0*e));        // divergence-free swirl
}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;       // resolution injected by GPUComputationRenderer
  vec4 pos = texture2D(texturePosition, uv);        // xyz pos, w age
  vec4 vel = texture2D(textureVelocity, uv);        // xyz vel, w seed

  vec3 toFront = uPourFront - pos.xyz;
  float d  = length(toFront) + 1e-3;
  // ORBIT, don't crash: attraction FALLS OFF with distance → tangential curl wins near the front
  vec3 attract = (toFront / d) * (0.6 * uHeat) / (1.0 + d*d);
  vec3 swirl   = gwCurl(pos.xyz * uFreq + uTime * 0.15) * (uCurlAmp * (0.9 + 0.6*uHeat));

  vel.xyz += (attract + swirl) * uDt;
  vel.xyz *= 0.96;                                   // drag → settles, no runaway
  vel.y   += 0.25 * uDt * (0.5 + uHeat);             // buoyant lift (hot air rises)
  gl_FragColor = vel;                                // w (seed) preserved untouched
}
```

> The **analytic-derivative `gw_curl3`** of `phase2/09 §4.3` (3 gradient evals, not 18 finite-difference) is
> the better primitive and **should replace `gwCurl` here once landed** — the cost difference matters less on
> the GPU (one eval per *particle*, not per *pixel*) than it did for the CPU loop, but sharing the one
> primitive is the cohesion win. Ship `gwCurl` (above) first if `gw_curl3` isn't yet compile-green; swap
> in-place after.

### 4.4 Position compute pass (dt-clamped Euler integrate + front-respawn lifecycle)

```glsl
// sparkCompute.js — positionFrag
uniform float uDt, uHeat;
uniform vec3  uPourFront;
float h31(float n){ return fract(sin(n*127.1)*43758.5453); }   // cheap seed hash
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);          // xyz pos, w age
  vec4 vel = texture2D(textureVelocity, uv);          // xyz vel, w seed
  float seed = vel.w;

  pos.xyz += vel.xyz * uDt;                            // Euler integrate (uDt clamped on CPU, §4.6)
  pos.w   += uDt;                                      // age

  float life = 0.8 + 2.2 * h31(seed*131.7);           // 0.8–3.0 s, seed-stable
  if (pos.w > life){                                   // RESPAWN at the moving pour-front
    float r = 0.18 * (1.2 - 0.6*uHeat);               // hotter forge → tighter, brighter spawn
    vec3 j  = vec3(h31(seed*7.0), h31(seed*13.0), h31(seed*29.0)) - 0.5;
    j.y *= 0.6;                                        // flatter in Y (born along the channel surface)
    pos.xyz = uPourFront + j * 2.0 * r;
    pos.w   = 0.0;                                     // reborn hot at the heat source
  }
  gl_FragColor = pos;
}
```

The **respawn-at-front** is what makes the cloud *track the pour* as it winds the interlace — `uPourFront`
moves, the dead particles are reborn wherever the metal's leading edge now is, so the spark cloud follows the
metal down the channel without any per-particle path data.

### 4.5 Seeding (born at the front, seed-stable)

```js
// seed both state textures: pos.xyz at the front + jitter, pos.w = random initial age (so deaths stagger);
// vel.xyz small random, vel.w = a stable per-texel seed (drives life/jitter forever).
function seedTextures(posTex, velTex, SIZE, U){
  const P = posTex.image.data, V = velTex.image.data       // HalfFloat → Uint16; write via DataView or
  const f = U.uPourFront.value                              // a Float32 staging array then convert (see note)
  for (let i=0;i<SIZE*SIZE;i++){
    const k=i*4, s=Math.random()
    P[k]=f.x+(Math.random()-0.5)*0.3; P[k+1]=f.y+(Math.random()-0.5)*0.2; P[k+2]=f.z+(Math.random()-0.5)*0.3
    P[k+3]=Math.random()*3.0                                // staggered initial age → no synchronized death
    V[k]=(Math.random()-0.5)*0.1; V[k+1]=Math.random()*0.2; V[k+2]=(Math.random()-0.5)*0.1
    V[k+3]=s                                                // stable seed
  }
}
```

> **HalfFloat write note:** `gpu.createTexture()` with `HalfFloatType` backs the image with a `Uint16Array`
> of half-float bit patterns. Either seed into a `Float32Array` staging texture and let three convert, or
> write halves with `THREE.DataUtils.toHalfFloat(x)`. Do **not** write raw floats into the Uint16 buffer —
> classic silent-garbage bug. (This is the one place the HalfFloat choice costs you ergonomics; worth it for
> iOS correctness.)

### 4.6 The r3f component shape + the per-frame drive (the four GPGPU disciplines)

```jsx
// src/scene/Sparks.jsx — one component, three rungs by forge.quality
import { useThree, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { forge } from '../store.js'
import { U } from './forgeUniforms.js'
import { makeGPGPU } from './makeGPGPU.js'
import { makeSparkRender, makeCpuSparks } from './sparkRender.js'

export default function Sparks({ count = 4096 }) {
  const { gl } = useThree()
  const quality = forge.quality
  const rung = quality === 'high' ? 'gpgpu' : quality === 'low' ? 'points' : 'static'

  const sim = React.useMemo(
    () => (rung === 'gpgpu' ? makeGPGPU(gl, count, U) : null), [gl, count, rung])
  // makeGPGPU may return null (init failed) → fall through to points
  const effectiveRung = rung === 'gpgpu' && !sim ? 'points' : rung

  const { geo, mat, posTexU } = React.useMemo(
    () => makeSparkRender(count, U, effectiveRung), [count, effectiveRung])
  const cpu = React.useMemo(
    () => (effectiveRung === 'points' ? makeCpuSparks(count, U) : null), [count, effectiveRung])

  React.useEffect(() => () => {           // DISPOSE everything (float RTs leak → fast OOM, 00 §4.3)
    sim?.dispose(); geo.dispose(); mat.dispose()
  }, [sim, geo, mat])

  useFrame((state, dt) => {
    if (forge.quality === 'static') return                  // frozen field
    const dtc = Math.min(dt, 1 / 30)                        // (1) dt-CLAMP — unclamped tab-restore → ∞

    if (effectiveRung === 'gpgpu' && sim) {
      sim.velVar.material.uniforms.uDt.value = dtc          // (2) feed clamped dt to BOTH passes
      sim.posVar.material.uniforms.uDt.value = dtc
      // U.uTime / U.uHeat / U.uPourFront already driven by <ForgeDriver/> (the one writer) — shared refs
      sim.gpu.compute()                                     // (3) ping-pong: velocity then position
      // (4) getCurrentRenderTarget EVERY frame — NEVER cache the texture (it swaps each compute)
      posTexU.value = sim.gpu.getCurrentRenderTarget(sim.posVar).texture
    } else {
      cpu.step(dtc, state.clock.elapsedTime)                // phase2/09 CPU advection
    }
  })

  if (effectiveRung === 'static')
    return <Sparkles count={200} speed={0} scale={6} size={3} color="#E85D04" />
  return <points geometry={geo} material={mat} frustumCulled={false} />
}
```

The **four GPGPU disciplines** numbered above are the entire correctness story: **(1) clamp dt**, **(2) feed
it to both passes**, **(3) `compute()` ping-pongs velocity→position**, **(4) `getCurrentRenderTarget` every
frame** (the targets swap on every `compute()`; a cached texture reference points at last frame's buffer and
the cloud freezes/flickers — the #2 GPGPU bug after the read-write race). Gate the mount by `forge.route` in
`ForgeCanvas` so the dense cloud lives in **casting-room / forge-mouth** and stays quiet in the scrying-pool.

### 4.7 The render material (samples the sim → the SHARED temperature ramp)

The vertex shader reads `texturePosition` by particle index (a `aRef` uv attribute → `texture2D`), places the
point, and passes `age/life` to the fragment. Color is **not a constant** — it is the shared `gw_forge`, so a
fresh spark is white-gold and an aged one ember-red, *visibly the same metal as the slab veins* (`00 §1`):

```glsl
// vertex (excerpt): place point from the sim texture, size by age
uniform sampler2D uPosTex;  attribute vec2 aRef;  attribute float aSeed;
varying float vTemp;  varying float vIsAE;
void main(){
  vec4 P = texture2D(uPosTex, aRef);                 // xyz pos, w age (from the ping-pong)
  float life = 0.8 + 2.2 * fract(aSeed*131.7);
  float t01  = clamp(1.0 - P.w/life, 0.0, 1.0);       // 1 = just born (hot) → 0 = cold
  vTemp = t01;  vIsAE = aSeed > 0.97 ? 1.0 : 0.0;     // rarest seeds are A/E divine emitters
  vec4 mv = modelViewMatrix * vec4(P.xyz, 1.0);
  gl_PointSize = (1.0 + 5.0*t01) * (300.0 / -mv.z);   // born big-bright, shrink as it cools
  gl_Position  = projectionMatrix * mv;
}
// fragment:
uniform float uHeat;  varying float vTemp;  varying float vIsAE;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float spr = smoothstep(0.5, 0.0, length(d));        // soft round, NO texture fetch (mobile fill-rate)
  float temp = clamp(vTemp * (0.55 + 0.45*uHeat), 0.0, 1.0);
  vec3  col  = gw_forge(temp);                         // THE shared ramp (gw_tempColor × gw_tempEmissive)
  col = mix(col, gw_divineFire(uHeat), vIsAE);         // A/E: clamped white-gold, NEVER cools (00 §1.4)
  gl_FragColor = vec4(col * spr, spr * vTemp);         // >1 HDR core → blooms via the ONE composer
}
```

Material flags: `blending: THREE.AdditiveBlending`, `transparent: true`, `depthWrite: false`,
`depthTest: true` (sparks occlude behind the slab but still glow), `toneMapped: true` (so the >1 core goes
through AgX/ACES with the rest of the world — `00 §3.2`). The `>1` core is what the existing `Bloom`
(`luminanceThreshold ≈ 0.55`) catches — **push emissive above 1, never crank bloom** (`post-fx`).

### 4.8 Key uniforms & parameters

| Param | Tier-set / source | Role |
|---|---|---|
| `count` | 4096 high (64²) / 1024 low / 200 static | sim-texture size = ⌈√count⌉² |
| RT type | **`HalfFloatType`** (forced) | iOS has no FP32 RT — `FloatType` silently fails |
| filter | **`NearestFilter`** (forced) | linear interpolation corrupts packed state |
| `uDt` | `Math.min(dt, 1/30)`, fed to **both** passes | dt-correct, hitch-proof integration |
| `uHeat` | **shared** `U.uHeat` (damped `forge.heat`) | attraction strength, spawn radius, color, alpha |
| `uPourFront` | **shared** `U.uPourFront` (vec3) | moving attractor **and** respawn origin |
| `uCurlAmp` / `uFreq` | ~0.9 / ~0.6 | swirl strength / spatial frequency (= vein grain) |
| attractor falloff | `0.6·uHeat / (1 + d²)` | **orbit, not crash** — the load-bearing line |
| drag | `×0.96` / step | settles, no runaway |
| lifetime | 0.8–3.0 s, seed-stable | staggered death, front-respawn |

---

## 5. COHESION (shared palette / lighting / uniforms with the world)

- **One temperature authority.** Spark color is `gw_forge(temp)` — the same `gw_tempColor × gw_tempEmissive`
  ramp the slab veins, the cooling letterforms, and the channel metal use (`00 §1`). A spark and the vein it
  lifted off are *visibly the same metal* because they sample one curve. Cooling is `1 − age/life`, the spark
  analogue of `gwCool01` (`00 §7` rule 1).
- **One noise basis.** The curl potential is built on `gw_fbm`/`gw_snoise3` (`shaders.js`) — the exact field
  that warps the veins and the molten boil (`00 §2`). The air's swirl is the **same grain** as the metal's
  flow; `uFreq ≈ 0.6` matches the vein spatial frequency. No second noise (`00 §7` rule 2). When `gw_curl3`
  (`phase2/09`) lands, swap the finite-difference `gwCurl` for it so CPU and GPU rungs share one primitive.
- **One clock, one rAF.** The compute drive runs in the *existing* single `useFrame`, `dt`-clamped; `uTime` /
  `uHeat` / `uPourFront` are the **shared `U` references** driven by `<ForgeDriver/>` (the one writer) —
  never a second rAF or `setInterval`, frozen on `static` (`00 §7` rule 6). A strike surges `forge.heat` → the
  same frame the slab veins flare, the spark spawn radius tightens and the cores brighten (the cohesion proof).
- **One palette, one bloom contract.** Color from `PAL` via `v3()` inside `gw_forge`; only the `>1` HDR core
  blooms — the "only the 10% accent exceeds 1.0" convention that makes the palette the bloom selector
  (`00 §3.1`). No spark bloom pass; the existing merged composer `Bloom` catches the cores (`00 §6`,
  `post-fx`).
- **One light model.** Sparks are *self-lit additive* — they ARE light in a void lit only by metal (`00 §5`).
  No fill, no env. The A/E divine-fire emitters (`vIsAE`) feed the *same* `uAEFire` proximity signal the
  basalt/Ogham reveal reads (`00 §5.2`, `phase2/25`) — a spark near an ignited letter helps light the carved
  lore.
- **Shared pour-front, three ways.** `U.uPourFront` is the *same* vec3 the channel fill, the camera DOF focus,
  and these sparks consume (`00 §7` rule 8) — the metal that's hottest is where sparks spawn *and* where the
  lens is focused.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The world is **fill-rate bound, not triangle bound** (`00 §10`). This element's costs are **(a) two compute
passes** and **(b) additive overdraw** — not geometry.

- **The two compute passes are cheap.** A 64×64 sim (4,096 particles) is two fragment passes over **4,096
  texels each** — trivial on A16 (the fill-rate cost is ~the area of a postage stamp, vs the near-full-screen
  molten shader). Even 128×128 (16,384) is two ~16k-texel passes. This is the entire reason GPGPU scales where
  the CPU loop doesn't: the per-particle work is **off the main thread**, parallel, and the texel count is
  tiny next to the screen.
- **HalfFloat is correctness *and* speed.** `HalfFloatType` is **required** on iOS (no FP32 RT,
  `EXT_color_buffer_float` absent — §3.3) **and** faster than `FloatType` on tile-based mobile GPUs, with
  ample range for our small-scene positions. This is non-negotiable, not a tuning choice.
- **Overdraw is the watch-item.** Additive `depthWrite:false` particles cost *covered pixels*, not count. Keep
  `gl_PointSize` modest, lifetimes short (0.8–3 s), spawn heat-gated so the screen is never carpeted. Soft
  round sprite computed **in-shader, no texture fetch** — texture-bound fill is the real mobile cost. At 4,096
  small short-lived additive points the overdraw fits the `00 §10` ~0.8–1.2 ms particle budget; **16,384 is
  desktop/`high`-only** — drop to 4,096 the moment the `PerformanceMonitor` factor dips.
- **The three tiers (uniform degrade, `00 §7` rule 9):**
  - **`high`** — GPGPU, 4,096 sparks (64²), full curl + attractor, HalfFloat. (16,384 reserved for desktop.)
  - **`low`** — **drop GPGPU entirely** → the `phase2/09` CPU `Points` advection at ~256–320 with a simplified
    fake-orbit. No render targets, no float-RT dependency, no ping-pong — the safer, cheaper rung.
  - **`static`** (reduced-motion / weak GPU / no-WebGL) — `frameloop='demand'`, advection skipped, frozen
    `<Sparkles count={200} speed={0}>` — a still, dignified ember field, not a broken fallback (`00 §10`).
- **The fallback gate.** `gpu.init()` non-null (HalfFloat RT not renderable) → demote to the `low` CPU path,
  **never a black canvas** (mirrors `CanvasBoundary`). Also degrade GPGPU→points under sustained thermal
  pressure via the `PerformanceMonitor` factor read from the mutable `forge` store (never React state
  mid-scroll).
- **Alloc-free, dispose-everything.** No `new` in `useFrame` (INP); `gpu.dispose()` + `geo`/`mat` dispose on
  unmount — **leaked float RTs are a fast OOM on mobile** (`00 §4.3`, `00 §10`). `renderer.info.memory` must be
  flat across navigation.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Order of operations (each step verified the repo way before the next):**

1. **Promote shared state first.** Confirm `U.uHeat`, `U.uTime`, `U.uPourFront` exist in `forgeUniforms.js`
   and are driven by `<ForgeDriver/>` (`00 §4.2`). The sim **binds those references**, never clones — do this
   before any particle code so cohesion is structural, not retrofitted. **Trap:** spawning a second
   rAF/`setInterval` (forbidden, `00 §7` rule 6).
2. **Stand up GPGPU with a trivial sim (gravity only)** and confirm the **ping-pong actually swaps** — the #1
   GPGPU bug is reading the texture you're currently writing (race → garbage/flicker). `GPUComputationRenderer`
   handles this *if* you read `getCurrentRenderTarget(var).texture` **every frame**, never a cached texture
   (the #2 bug — a stale reference freezes the cloud).
3. **Set the RT type and filter before anything else looks right.** `HalfFloatType` (iOS correctness) +
   `NearestFilter` (linear corrupts packed state). Forgetting either gives a silently-broken or frozen cloud
   that *looks* like a shader bug but is a setup bug.
4. **Then add curl + attraction.** Tune so sparks **orbit, not crash** — if they all pile onto `uPourFront`,
   the `1/(1+d²)` falloff is too weak relative to `uCurlAmp`, or drag too high. The curl swirl must dominate
   *near* the front; the attraction is a gentle leash, not a tractor beam.
5. **Lifecycle + front-respawn.** Stagger initial ages (so deaths don't synchronize into a pulsing cloud);
   respawn at the *current* `uPourFront` so the cloud tracks the moving pour. Seed-stable `life` keeps each
   particle's rhythm constant.
6. **Wire the shared `forge.heat` / `forge.pourFront`** and confirm a strike surges spawn-tightness + core
   brightness in the same frame as the slab veins (the cohesion proof).
7. **Bloom last.** Sparks look dull until the `>1` HDR core meets the existing `Bloom`. **Trap:** cranking
   `Bloom.intensity` to make them glow — that washes the whole scene (`post-fx`). Push the spark core emissive
   above 1; leave `Effects.jsx` alone.
8. **Verify the repo way:** `npm run build` green → `qa-route` at 393×852 + 1440×900 with **0 console errors**
   (SwiftShader compiles the GLSL in CI, so a compute-shader typo surfaces as an error) → **then the iPhone 15
   OLED read** (additive bloom spread, true-black, the divine-fire white-gold, and *orbit coherence* do **not**
   simulate headless). Use `?debug` leva for live count/heat/curl/falloff tuning.

**Pitfalls, ranked by cost:**

- **`FloatType` render targets on iOS (the silent killer).** iOS exposes only `EXT_color_buffer_half_float`,
  not `EXT_color_buffer_float` — `FloatType` RTs are **not color-renderable**, the sim writes nothing, the
  cloud is invisible or static, and it looks like a logic bug on the device while working in desktop Chrome.
  **Force `HalfFloatType`.**
- **Caching the position texture (the freeze bug).** The ping-pong swaps targets on every `compute()`. Read
  `getCurrentRenderTarget(posVar).texture` **inside `useFrame` every frame**; a memoized reference points at a
  stale buffer and the cloud stops updating (or flickers between two frames).
- **Reading the texture you're writing (the race).** Each variable must depend on the *previous* frame's
  textures (`setVariableDependencies` reads both state vars); `GPUComputationRenderer` ping-pongs for you, but
  only if you don't hand-wire a target you're also rendering into.
- **Linear filtering on state textures.** Interpolates across texels → corrupted positions/velocities. Force
  `NearestFilter`.
- **Writing raw floats into a HalfFloat (Uint16) texture.** Garbage seeds. Use `DataUtils.toHalfFloat` or a
  Float32 staging texture (§4.5 note).
- **Attractor too strong (the crash).** No `1/(1+d²)` falloff (or falloff too weak vs `uCurlAmp`) → every
  spark collapses onto the front into a hot dot. The falloff + curl-dominance is what produces *orbit*.
- **Unclamped `dt`.** A tab-restore `dt` integrates positions to infinity and the whole field vanishes.
  `Math.min(dt, 1/30)`, fed to **both** passes.
- **Forgetting `depthWrite:false`.** Additive sparks get black halos / sort artifacts where they overlap.
- **A/E sparks reaching the temperature ramp.** The `vIsAE` emitters must route to `gw_divineFire` and **never
  cool** (`00 §1.4` keystone) — keep the branch hard-separated.
- **Leaking float RTs.** Not disposing `gpu` on unmount is a fast mobile OOM. Dispose RTs + geo + mat;
  `renderer.info.memory` flat across nav.
- **Over-counting "for safety."** 4,096 is the `high` budget; 16,384 is desktop. Doubling count doubles
  overdraw (the real mobile cost) for no narrative gain — density comes from heat-gated spawn near the front.

---

## 8. SOURCES (2025–2026)

1. **Codrops — _Crafting a Dreamy Particle Effect with Three.js and GPGPU_** — tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/ — **Dec 19 2024 (canonical GPGPU recipe, actively cited through 2025)**. `GPUComputationRenderer` velocity+position variables, two render targets per variable ping-ponging, `addVariable`/`setVariableDependencies`, FBO flow fields. The reference build of the exact pattern this doc lands.
2. **Muhammad Anas — _Creating Chaotic Flow Fields with GPGPU in React Three Fiber_** — medium.com/@midnightdemise123/creating-chaotic-flow-fields-with-gpgpu-in-react-three-fiber-f9aad608c534 — **Jul 4 2025**. FBO ping-pong velocity+position compute, curl noise = divergence-free, 16,384 particles, the r3f `useFrame`/`getCurrentRenderTarget` integration — the contemporary R3F GPGPU reference.
3. **three.js docs — _GPUComputationRenderer_** — threejs.org/docs/pages/GPUComputationRenderer.html — **current (r17x, 2025–26)**. RGBA-float-texture variables, two render targets per variable for ping-pong, `getCurrentRenderTarget(variable)`, `setVariableDependencies`, `texturePosition`/`textureVelocity` convention. The bundled helper (no new dependency).
4. **WebKit / Khronos / MDN — _EXT_color_buffer_half_float on WebGL2; iOS lacks EXT_color_buffer_float_** — bugs.webkit.org/show_bug.cgi?id=216010 · github.com/KhronosGroup/WebGL/issues/3093 · developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float — **2025 (active threads)**. "EXT_color_buffer_float is only exposed if the device supports FP32 render targets, which iOS does not"; use half-float RTs on iOS. The fact that makes `HalfFloatType` mandatory, not optional, on the judge device.
5. **Maxime Heckel — _Field Guide to TSL and WebGPU_** — blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — **Oct 14 2025**. `instancedArray` GPU-persistent storage buffers, `computeInit` + update `.compute()` passes for GPGPU particles with attractors/curl, the FBO-ping-pong → compute-shader re-host — the deferred WebGPU port this WebGL2 build authors toward.
6. **Three.js Roadmap — _Introduction to WebGPU Compute Shaders_ & _Interactive Galaxy with WebGPU Compute Shaders_** — threejsroadmap.com/blog/introduction-to-webgpu-compute-shaders · threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders — **2025–26**. Storage buffers persist between frames for stateful sims (init → update → render); "10k particles at 30ms CPU → 100k under 2ms WebGPU, ~150×"; 1M-particle position+velocity `instancedArray`. Quantifies the WebGPU ceiling and confirms ping-pong survives the port.
7. **three.js forum — _Struggling to recreate WebGL ping-pong buffers with WebGPU and TSL_** — discourse.threejs.org/t/struggling-to-recreate-webgl-ping-pong-buffers-with-webgpu-and-tsl/87462 — **2025**. "Read from buffer A, write to buffer B, swap pointers next pass" — confirms the two-buffer ping-pong is the *same* architecture in WebGPU, so the WebGL2 pattern re-hosts cleanly (the portability argument).
8. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_ & _Migrate Three.js to WebGPU (2026)_** — utsubo.com/blog/threejs-best-practices-100-tips · utsubo.com/blog/webgpu-threejs-migration-guide — **Jan 2026**. Move particles to compute shaders, dispose render targets, mutate-in-`useFrame` (no `setState`), draw-call budget, the WebGL2-fallback-branch caveat — the mobile-budget + migration grounding.
9. **three.js forum — _GPGPU Particles (showcase)_** — discourse.threejs.org/t/gpgpu-particles/90558 — **2025**. Contemporary GPGPU particle reference / counts on the WebGL2 `GPUComputationRenderer` path.
10. **drei docs — _Sparkles_** — drei.docs.pmnd.rs/staging/sparkles — **current (2025)**. `count/speed/opacity/color/size/scale/noise` — the `static`-tier floor of the fallback ladder.

---

## 9. DEEP-DIVE CANDIDATES

1. **`gw_curl3` analytic-derivative curl in the GPGPU velocity pass — A/B vs finite-difference.** Land the
   3-gradient `gw_curl3` (`phase2/09 §4.3`) inside `velocityFrag` and A/B it against the 18-sample
   finite-difference `gwCurl` for swirl quality and per-particle GPU cost — and decide whether the GPU's
   per-particle (not per-pixel) budget even makes the difference matter, or whether the cohesion win
   (one primitive for CPU and GPU rungs) is the only reason to switch.
2. **Multi-point / branching pour-front emission into the GPGPU seeder.** Feed `uPourFront` not as one vec3 but
   as a small uniform array of moving positions sampled along the Celtic-interlace arc-length (per-branch heat
   weighting), so the respawn distributes sparks across *every* active branch as the metal winds/branches/
   rejoins — the `00 §7` rule-8 shared-curve consumption, on the GPGPU path (overlaps `phase1/15` candidate #2
   and `phase2/09` candidate #2, here in the compute seeder).
3. **The GPGPU → WebGPU `.compute()` re-host (cost-benefit at the forge's count).** Port the two-pass ping-pong
   to `instancedArray` + `.compute()` (Heckel / Roadmap) once `ForgeCanvas` migrates, and **quantify** whether
   the 50k–1M ceiling buys anything for a forge that deliberately wants 4,096 dense + 320 ambient — or whether
   the WebGL2 `GPUComputationRenderer` stays the right call even on a WebGPU renderer, given the postprocessing
   migration tax (`phase1/15` candidate #1).
4. **Spark-density → heat-haze coupling via a downsampled accumulation buffer.** Render the GPGPU spark cloud
   into a tiny density buffer and feed it to the screen-space heat-haze UV-warp (`00 §5.4`) so shimmer
   concentrates where sparks are densest — a shared density target sampled by the post-pass, within the
   bloom/aberration order in `Effects.jsx` (overlaps `phase1/15` candidate #4).
