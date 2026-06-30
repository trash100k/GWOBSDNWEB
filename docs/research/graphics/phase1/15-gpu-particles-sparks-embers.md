# 15 — GPU Particle System: Sparks, Embers, Ash

_Phase 1 graphics research · GAELWORX forge world · target device iPhone 15 (OLED)_
_Focus: instanced / GPGPU / transform-feedback particles for heat-seeking sparks, drifting embers, cold ash._

---

## 1. SCOPE

In the GAELWORX forge, particles are the **living breath of the heat** — the tell that the metal is alive, not a static texture. Three families share one system: **LIVING SPARKS** that orbit the moving pour-front (the white-hot leading edge of molten metal flowing through the Celtic-interlace channels), drawn in by heat via curl-noise attraction, born bright, dying fast as they cool; **drifting EMBERS** that lift off cooling letterforms and the altar in slow Atmospheric Drift, the warm ambient mote-field already prototyped in `src/scene/Embers.jsx`; and **cold ASH** — sparse, near-black-grey flecks that fall and settle, the spent residue that makes the bright sparks read as genuinely hot by contrast. All three are pure additive light against the `#0B0C10` void (except ash, which is the one alpha-blended dark element), and all three must read their color and intensity from the **shared master temperature field** that drives the slab veins, so a spark near the pour-front is white-gold and a far ember is deep ember-red — never a bolted-on, uniformly-colored sprite cloud. The A/E divine-fire zones spawn the rarest, brightest, never-cooling sparks; the rest of the world cools.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

The decision tree forks first on **renderer** (the codebase is WebGL2 today via the classic `WebGLRenderer`), then on **where the simulation runs** (CPU vs GPU), then on **library vs hand-rolled**.

### 2.1 CPU-stepped points (the current `Embers.jsx` pattern)
A `BufferGeometry` of N points; positions seeded once on the CPU, then **animated entirely in the vertex shader** from immutable seed/speed/size attributes plus `uTime` (rise-and-wrap, `sin` drift). This is what ships today (320 points, additive, `depthWrite:false`). **Pros:** trivially cheap, zero per-frame CPU work, WebGL2-safe, mobile-friendly, already in-house and brand-correct. **Cons:** particles can't *react* — no real velocity integration, no attraction to a moving pour-front, no curl-noise turbulence, no collision/settling. Lifetimes are faked by a wrap function. Fine for ambient embers; **insufficient for heat-seeking sparks** that must orbit a moving emitter.

### 2.2 GPGPU ping-pong (FBO) on WebGL2 — the proven workhorse
Particle state (position, velocity, age) lives in **floating-point textures**; two compute passes (`createVelocityComputeShader` → `createPositionComputeShader`) write to render targets, **ping-ponging** between two texture sets each frame to avoid read/write races, then a render material samples the position texture to place points/instances. The 2025 Codrops-adjacent walkthroughs run **16,384 particles with curl-noise flow fields** comfortably this way, and `three`'s own `GPUComputationRenderer` helper formalizes the pattern. **Pros:** real GPU-side velocity integration, curl-noise turbulence, moving attractors, divergence-free organic motion — exactly the spark behavior we need; runs on the existing WebGL2 renderer with no migration. **Cons:** float-texture render targets and the ping-pong bookkeeping are fiddly; `RGBA32F`/`RGBA16F` render-target support and `EXT_color_buffer_float` must be checked (universally available on iPhone 15 / A16, but a fallback tier is mandatory); more GPU bandwidth than 2.1.

### 2.3 WebGPU + TSL compute shaders — the 2026 frontier
With **Safari 26 shipping WebGPU in September 2025**, WebGPU now has all-major-browser support (~79% global per caniuse), and Three.js's **TSL (Three Shading Language)** lets you write a single node-graph that compiles to **WGSL on WebGPU and GLSL on WebGL2** — including true **compute shaders** via `instancedArray` (GPU-persistent storage buffers) + `.compute()` passes. Maxime Heckel's _Field Guide to TSL and WebGPU_ (Oct 2025) and the utsubo _100 Tips (2026)_ both lead with "move particle systems to compute shaders" and report **2–10× gains in draw-call-heavy / compute-heavy scenes**, with counts of **50K–350K+ particles** at full framerate. **Pros:** the highest ceiling, cleanest simulation code (`instancedArray` replaces manual ping-pong), single codebase targets both APIs, sprite-based particles via `SpriteNodeMaterial` get free billboarding. **Cons:** requires swapping `WebGLRenderer` → `WebGPURenderer` (a real migration for this repo's `ForgeCanvas`/`@react-three/postprocessing` stack — the postprocessing chain would need the native node-based pipeline); `instancedArray` is **undocumented** (learned from examples/source); WebGPU on iOS is new enough that a WebGL2 fallback is non-negotiable for a judged mobile demo. **Not recommended to adopt wholesale in Phase 1**, but the architecture should be TSL-portable.

### 2.4 Library: `Three-VFX` / `r3f-vfx` (Jan 2026)
A brand-new (created 2026-01-26), MIT, **WebGPU-native GPU-compute particle system** with first-class R3F support: `<VFXParticles>` with `maxParticles`, emitter shapes (Point/Box/Sphere/Cone/Disk/Edge), **attractors, turbulence, gravity, friction**, bezier curves over lifetime, `ADDITIVE` blending, decoupled emitters, and a debug panel that copies generated code. It has a **CPU fallback** for non-WebGPU. **Pros:** ships exactly our feature set (attractors + turbulence + additive + lifetime curves) with near-zero shader code. **Cons:** WebGPU-first (same renderer-migration cost as 2.3); a Jan-2026 v0 library is a risk for a judged build; opinionated component shape may fight the shared-uniform cohesion model (it owns its own color/intensity, not our `uTemp` field).

### 2.5 Library: `three-nebula`
Mature, designer-driven WebGL particle engine (emitters/behaviors/renderers, JSON presets). **Pros:** battle-tested, rich behaviors, GPU sprite renderer. **Cons:** **largely CPU-stepped** behaviors (the simulation cost scales on the main thread), a heavier dependency, and — critically — it wants to **own the particle look and lifecycle**, which collides head-on with the single-shared-temperature cohesion rule. Hard to make a nebula sprite sample our `uTemp` gradient. Good for generic UI confetti; **wrong fit for a cohesive shared-material forge.**

### 2.6 drei `<Sparkles>`
The cheapest possible drop-in: `count/speed/opacity/color/size/scale/noise`, GPU points, custom-shader-friendly. **Pros:** one line, already in the drei dep, perfect for the **`low`/`static` fallback tier**. **Cons:** ambient-only (no attractor/heat-seeking), single flat color (no temperature gradient). It's the floor, not the hero.

### 2.7 Transform feedback
WebGL2's native GPU simulation primitive (vertex shader writes back to buffers). **Pros:** no float-texture juggling. **Cons:** in the three.js ecosystem the FBO/`GPUComputationRenderer` path is far better-trodden and r3f-idiomatic; 2025 sources uniformly reach for FBO ping-pong or TSL compute, not raw transform feedback. **Skip** — no ecosystem leverage.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A two-tier, WebGL2-native, GPGPU-ping-pong spark/ember system, with a TSL-portable architecture and a `<Sparkles>`/CPU-points fallback — NOT a renderer migration in Phase 1.**

Rationale tied to the world + the repo's hard constraints:

1. **One renderer, no migration risk.** `forge-scene` mandates exactly one WebGL renderer and the whole post-FX chain (`Effects.jsx`) is `@react-three/postprocessing` on `WebGLRenderer`. Swapping to `WebGPURenderer` (2.3 / 2.4) for one effect would force a postprocessing-pipeline rewrite and put the judged iOS demo on a still-new browser path. **GPGPU ping-pong gives us real heat-seeking spark physics on the renderer we already ship.**
2. **The pour-front is a moving attractor** — sparks must *orbit* it with curl-noise turbulence. That is precisely what 2.2 does and what 2.1 (current embers) cannot. So the **hero sparks** get the GPGPU treatment; the **ambient embers** keep the cheap `Embers.jsx` vertex-shader pattern (it already nails Atmospheric Drift); **ash** is a second cheap point cloud with downward velocity and an alpha-blended dark sprite.
3. **Cohesion by construction.** We hand-roll the sim so the render material samples the **shared `uTemp` / pour-front uniforms** (see §5) and inlines `PAL` colors via `v3()` — a library (2.4/2.5) would own the look and break that.
4. **TSL-portable, not TSL-now.** Write the curl-noise and color logic as small pure functions so a Phase-2 WebGPU/TSL port (per Heckel/utsubo) is a re-host, not a rewrite. We adopt the *pattern* (`instancedArray` ≈ our position texture) without paying the migration tax yet.
5. **Mobile budget honored.** GPGPU at the counts below (§6) is cheap on A16; the `low` tier drops to CPU points, `static` to drei `<Sparkles>` frozen.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- **No new hard dependency.** Use `three`'s bundled `GPUComputationRenderer` (`three/examples/jsm/misc/GPUComputationRenderer.js`) for the ping-pong plumbing — same `three` already in the repo.
- Reuse `GLSL_NOISE` from `src/scene/shaders.js` (`gw_snoise`/`gw_fbm`) for the curl field; reuse `PAL`/`v3` from `src/scene/palette.js`.
- Keep `@react-three/drei` `<Sparkles>` available for the fallback tier (already a dep).
- (Phase-2 only, gated: `three/webgpu` + `three/tsl` `instancedArray`/`SpriteNodeMaterial`, or evaluate `r3f-vfx`.)

### 4.2 Curl noise (the heart — divergence-free swirl, no sources/sinks)
Standard noise converges; **curl noise** gives flows that never collapse to a point — ideal for sparks that swirl around the pour-front without all piling onto it. Derive 3D curl by finite-difference of an fbm potential (extend the in-repo 2D `gw_fbm` to 3D, or sample three offset 2D fields):

```glsl
// in the velocity compute pass — reuse gw_fbm from shaders.js
vec3 gwPotential(vec3 p){
  return vec3( gw_fbm(p.yz + 13.1), gw_fbm(p.zx + 47.7), gw_fbm(p.xy + 91.3) );
}
vec3 gwCurl(vec3 p){
  const float e = 0.1;
  vec3 dx = vec3(e,0.,0.), dy = vec3(0.,e,0.), dz = vec3(0.,0.,e);
  vec3 p_x0 = gwPotential(p-dx), p_x1 = gwPotential(p+dx);
  vec3 p_y0 = gwPotential(p-dy), p_y1 = gwPotential(p+dy);
  vec3 p_z0 = gwPotential(p-dz), p_z1 = gwPotential(p+dz);
  float x = (p_y1.z - p_y0.z) - (p_z1.y - p_z0.y);
  float y = (p_z1.x - p_z0.x) - (p_x1.z - p_x0.z);
  float z = (p_x1.y - p_x0.y) - (p_y1.x - p_y0.x);
  return normalize(vec3(x,y,z) / (2.0*e));
}
```

### 4.3 Velocity compute pass (heat attraction + curl turbulence + drag)
```glsl
uniform float uDt, uTime;
uniform vec3  uPourFront;   // world pos of the moving leading edge (shared)
uniform float uHeat;        // master heat 0..1 (shared, == slab uTemp lineage)
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D( texturePosition, uv );   // xyz pos, w = age
  vec4 vel = texture2D( textureVelocity, uv );   // xyz vel, w = seed

  vec3 toFront = uPourFront - pos.xyz;
  float d = length(toFront) + 1e-3;
  // ORBIT, don't crash in: attraction falls off, + tangential curl swirl
  vec3 attract = (toFront / d) * (0.6 * uHeat) / (1.0 + d*d);
  vec3 swirl   = gwCurl(pos.xyz * 0.6 + uTime * 0.15) * (0.9 + 0.6*uHeat);
  vel.xyz += (attract + swirl) * uDt;
  vel.xyz *= 0.96;                  // drag → settles, no runaway
  vel.y   += 0.25 * uDt;            // buoyant lift (hot air)
  gl_FragColor = vel;
}
```

### 4.4 Position compute pass (integrate + lifecycle/respawn)
```glsl
uniform float uDt; uniform vec3 uPourFront;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D( texturePosition, uv );
  vec4 vel = texture2D( textureVelocity, uv );
  pos.xyz += vel.xyz * uDt;
  pos.w   += uDt;                              // age
  float life = 0.8 + 2.2 * fract(vel.w*131.7); // 0.8–3.0s, seed-stable
  if (pos.w > life){                           // respawn at the pour-front
    vec3 j = (vec3(fract(vel.w*7.0), fract(vel.w*13.0), fract(vel.w*29.0))-0.5);
    pos.xyz = uPourFront + j * 0.25;           // born hot, at the heat source
    pos.w = 0.0;
  }
  gl_FragColor = pos;
}
```

### 4.5 Render material (samples sim + the SHARED temperature → color)
Spark color is **not** a constant — it's the master temperature ramp, so a fresh spark is white-gold and an aged/cooled one is ember-red, matching the slab veins:

```glsl
// vertex: read position texture by particle index → place point, size by age
// fragment:
uniform float uHeat;                 varying float vAge; varying float vLife;
vec3 gwTempRamp(float t){            // t: 1=white-hot … 0=ember
  vec3 c = mix(${'${v3(PAL.ember)}'}, ${'${v3(PAL.red)}'}, 1.0 - t);     // hot→red
  c = mix(c, ${'${v3(PAL.hot)}'}, smoothstep(0.7, 1.0, t));               // white core
  return c;
}
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = smoothstep(0.5, 0.0, length(d));        // soft round sprite
  float heat = clamp(1.0 - vAge/vLife, 0.0, 1.0) * (0.5 + 0.5*uHeat);
  vec3 col = gwTempRamp(heat) * (1.0 + 1.4*heat);   // HDR core (>1) → blooms
  gl_FragColor = vec4(col * r, r * heat);
}
```
Set `blending: THREE.AdditiveBlending`, `transparent:true`, `depthWrite:false`, `depthTest:true` (so sparks occlude behind the slab but still glow). The `>1` core is what `Bloom` (`luminanceThreshold 0.55`) catches — per `post-fx`, **push emissive above 1, never crank bloom**.

### 4.6 The r3f component shape (matches `Embers.jsx` conventions)
```jsx
// src/scene/Sparks.jsx
export default function Sparks({ count = 4096, quality }) {
  const { gl } = useThree()
  // high → GPGPU ping-pong; low → CPU points; static → <Sparkles frozen/>
  const tier = quality === 'high' ? 'gpgpu' : quality === 'low' ? 'points' : 'static'
  const gpu = useMemo(() => tier === 'gpgpu' ? makeGPGPU(gl, count) : null, [gl, count, tier])
  useEffect(() => () => { gpu?.dispose(); material.dispose(); geo.dispose() }, [gpu])

  useFrame((state, dt) => {
    if (forge.quality === 'static') return
    const dtc = Math.min(dt, 1/30)                      // clamp hitches
    sim.uDt.value = dtc
    sim.uTime.value = state.clock.elapsedTime
    sim.uPourFront.value.copy(forge.pourFront)          // shared moving emitter
    sim.uHeat.value = damp(sim.uHeat.value, forge.heat, 3, dtc)  // shared temp
    gpu?.compute()
    render.uPosTex.value = gpu?.getCurrentRenderTarget(posVar).texture
    render.uHeat.value = sim.uHeat.value
  })
  return <points geometry={geo} material={material} frustumCulled={false} />
}
```
Gate the mount by `forge.route` inside `ForgeCanvas` so sparks appear in the **casting-room / channel-hall / forge-mouth** chambers and stay quiet in the scrying-pool.

### 4.7 Key uniforms & parameters
| Uniform | Source | Meaning |
|---|---|---|
| `uPourFront` (vec3) | `forge.pourFront` (new store field) | moving attractor = leading edge of the pour |
| `uHeat` (float 0..1) | `forge.heat` (shared master temp, damped) | drives attraction strength, color, alpha |
| `uDt` / `uTime` | `useFrame` (clamped dt) | dt-correct integration |
| count | 4096 high / 1024 low / 200 static | particle budget per tier |
| lifetime | 0.8–3.0 s | seed-stable per particle |
| drag | 0.96 / frame | prevents runaway, lets them settle |

---

## 5. COHESION

The particles are wired into the **one master temperature/material/lighting system**, not a parallel look:

- **Shared temperature field.** Today the slab derives heat from `forge.scrollDamped`/`scrollVel` into `uTemp` (`ObsidianSlab.jsx:159`). Phase 1 should **promote this to a named `forge.heat`** in `src/store.js` and a `forge.pourFront` vec3, set once per frame (e.g. in `CameraRig`'s existing `useFrame`, the single shared rAF). The slab veins, the letterform fill, the sparks, and the ember glow all read the **same `forge.heat`** — so when the scroll/pour intensifies, veins flare *and* sparks brighten *and* embers multiply, in lockstep. No second clock, no second rAF (`motion-feel` rule 6).
- **Shared palette.** Spark/ember color comes from the same `PAL` tokens the slab uses — `PAL.ember (#ff5a1e)`, `PAL.red (#c8200a)`, `PAL.hot (HDR 1.9,1.25,0.7)` — inlined with `v3()`. The temperature ramp `gwTempRamp` mirrors the slab's `body = mix(crimson, ember, …); mix(.., hot, core)` logic so a spark and the vein it left look like the same metal.
- **Shared noise.** Curl noise is built on the in-repo `gw_fbm`/`gw_snoise` (`shaders.js`) — the exact field that warps the veins — so spark motion and vein flow share a visual grammar.
- **Shared bloom budget.** Only the `>1` HDR spark cores bloom, exactly like the vein cores (`post-fx`: "only HDR blooms"). Sparks don't need their own bloom pass; the existing `Effects.jsx` `Bloom` catches them. This is *why* additive + HDR core matters — it ties them into the one cinematic finish.
- **A/E divine fire.** The never-cooling A and E zones become **special emitters**: a small, rare, high-`uHeat`-pinned spark population whose `gwTempRamp` is clamped near white-gold, and which "RADIATE onto adjacent stone" — i.e. their position also feeds a cheap point-light-ish glow term in the basalt/ogham shader. Same uniform, special clamp — cohesive, not bolted-on.
- **Lighting.** Sparks are self-lit additive (they ARE the light in a void lit only by metal), matching the world's "pure VOID lit only by the metal itself" rule — they don't need the cool Lightformer env, and won't fight the slab's neutral reflections.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 / A16 budget)

The judged device is iPhone 15 OLED: true blacks make additive sparks *pop*, but the fill-rate and bandwidth budget is real. Honor the three `useQuality` tiers (`high|low|static`):

- **`high` (GPGPU):** **4,096 sparks** (a 64×64 sim texture) + ~512 embers + ~256 ash. Two compute passes on tiny 64×64 `RGBA16F` targets are near-free on A16. Use **`HalfFloatType`** render targets (faster than `FloatType` on tile-based mobile GPUs, plenty of range for positions in our small scene). Particle sprite is a soft round computed in-shader — **no texture fetch** (saves bandwidth; texture-bound fill is the real mobile cost, per the 2025 Codrops perf piece and utsubo tips 43–46). `depthWrite:false`, additive — overdraw is the watch-item, so **keep `gl_PointSize` modest** and lifetimes short so the screen is never carpeted.
- **`low` (CPU points):** drop GPGPU; reuse the `Embers.jsx` vertex-shader-animated points at **~1,024** with a simplified fake-orbit (sin/cos around `uPourFront`). No render targets, no `EXT_color_buffer_float` dependency.
- **`static` (reduced-motion / low-power):** drei `<Sparkles count={200}>` with `speed={0}` (or our points with frozen `uTime`), so reduced-motion users and crawlers get a still, on-brand ember field at zero per-frame cost. `frameloop='demand'` already set by `ForgeCanvas` here.
- **Fallbacks & feature detection:** check `gl.getExtension('EXT_color_buffer_float')` / `getContext` float-RT support; if absent (won't be on A16, but defensively), demote to the `low` path. Wrap GPGPU init so a failure degrades to points, never to a black canvas (mirrors `CanvasBoundary`).
- **Budget guardrails (utsubo 2026 / Codrops 2025):** mutate in `useFrame` never `setState`; never allocate in the loop (pre-make vectors); `AdaptiveDpr` already on; clamp `dt`; dispose render targets + geometry + material on unmount (utsubo tips 37/41/42).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations and the specific traps:

1. **Promote shared state first.** Add `forge.heat` (float) and `forge.pourFront` (THREE.Vector3) to `src/store.js`, and set them in the existing single `useFrame` (CameraRig). Repoint the slab's `uTemp` to read `forge.heat`. *Do this before any particle code* so cohesion is structural, not retrofitted. **Trap:** spawning a second rAF/`setInterval` — forbidden (`motion-feel` rule 6).
2. **Stand up GPGPU with a trivial sim** (gravity only) and confirm the **ping-pong actually swaps** — the #1 GPGPU bug is reading the texture you're currently writing (race → garbage/flicker). `GPUComputationRenderer` handles this if you use `getCurrentRenderTarget(var)` each frame, not a cached texture.
3. **Render-target type:** use `HalfFloatType` and **set `magFilter/minFilter = NearestFilter`** on sim textures — linear filtering corrupts packed position data (classic GPGPU footgun).
4. **Then add curl + attraction.** Tune so sparks **orbit, not collide** — if they all crash onto `uPourFront`, the attraction `1/(1+d*d)` falloff is too strong or drag too low. Curl swirl must dominate near the front.
5. **Bloom last.** Sparks look dull until the HDR core (>1) meets the existing `Bloom`. **Trap:** cranking `Bloom.intensity` to make them glow — that washes the whole scene (`post-fx`). Instead push the spark core emissive above 1; leave `Effects.jsx` alone.
6. **Additive depth:** `depthWrite:false` + `depthTest:true`. Forgetting `depthWrite:false` → black halos / sorting artifacts where sparks overlap.
7. **dt clamp:** `Math.min(dt, 1/30)` — an unclamped tab-restore `dt` integrates positions to infinity and the whole field vanishes.
8. **Verify the way the repo verifies:** `npm run build` green, then `qa-route` at 393×852 + 1440×900 with **0 console errors** (SwiftShader compiles the GLSL in CI, so a compute-shader typo surfaces as an error). Then the **iPhone 15 OLED read** — additive bloom and true-black don't simulate headless. Use `?debug` leva for live count/heat/drag tuning.
9. **Dispose everything** on unmount (render targets included) — `forge-scene` non-negotiable; leaked float RTs are a fast OOM on mobile.

---

## 8. SOURCES

1. Maxime Heckel — _Field Guide to TSL and WebGPU_ — blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — **2025-10-14**. (TSL/WebGPU roles, compute shaders for particles, `instancedArray`, WebGL2 cross-target, glslFn/wgslFn.)
2. utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_ — utsubo.com/blog/threejs-best-practices-100-tips — **2026-01-12**. (Move particles to compute shaders, `instancedArray`, mediump on mobile, dispose RTs, mutate-in-useFrame, draw-call budget.)
3. Wawa Sensei — _GPGPU particles with TSL & WebGPU_ — wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu — **2025** (course VFX chapter, lesson 42). (`SpriteNodeMaterial` + `AdditiveBlending`, `instancedArray` for pos/age, Sprite vs InstancedMesh, hundreds of thousands of particles.)
4. Muhammad Anas — _Creating Chaotic Flow Fields with GPGPU in React Three Fiber_ — medium.com/@midnightdemise123/creating-chaotic-flow-fields-with-gpgpu-in-react-three-fiber-f9aad608c534 — **2025-07-04**. (FBO ping-pong velocity+position compute, curl noise = divergence-free, 16,384 particles, R3F implementation.)
5. mustache-dev / verekia — _Three-VFX / r3f-vfx_ — github.com/mustache-dev/Three-VFX — **created 2026-01-26** (MIT). (WebGPU GPU-compute particles for R3F: attractors, turbulence, gravity, friction, lifetime curves, ADDITIVE blending, emitter shapes, CPU fallback.)
6. Niccolò Fanton — _Building Efficient Three.js Scenes_ (Codrops) — tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ — **2025-02-11**. (Pixel-ratio/DPR, r3f-perf/spector.js, LOD, texture-size discipline — the mobile perf grounding.)
7. drei docs — _Sparkles_ — drei.docs.pmnd.rs/staging/sparkles — **2025** (current). (count/speed/opacity/color/size/scale/noise; custom shaders — the fallback tier.)
8. three.js forum — _GPGPU Particles (showcase)_ — discourse.threejs.org/t/gpgpu-particles/90558 — **2025**. (Contemporary GPGPU particle reference / counts.)

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **WebGPU/TSL migration cost-benefit for the whole forge.** Whether to move `ForgeCanvas` to `WebGPURenderer` (native node post-processing replacing `@react-three/postprocessing`) to unlock `instancedArray` compute everywhere — quantify the 2–10× claim against this exact slab+bloom scene on iPhone 15, and assess the iOS-WebGPU stability risk for a judged demo.
2. **Pour-front emitter geometry along the Celtic-interlace channels.** How to feed the spark `uPourFront` not as a single point but as a **moving parametric position along the interlace path** (and at multiple branches), so sparks track the metal as it winds/branches/rejoins — curve sampling + per-branch heat weighting.
3. **Spark→stone light radiation (A/E divine fire onto ogham).** A cheap real-time "particles emit light onto nearby basalt" term — accumulate the nearest bright sparks into the basalt/ogham shader to make carved ogham readable, without true dynamic lights (perf). Tie to the never-cooling A/E zones.
4. **Heat-shimmer coupling.** Integrating the air-distortion (heat haze) post-pass with the spark/ember field so shimmer concentrates where particles are densest — shared density buffer or screen-space heat accumulation, within the bloom/aberration order in `Effects.jsx`.
