# 10 — Procedural Noise Toolkit for Fire / Lava / Heat

> Phase-1 graphics research · GAELWORX forge world
> Focus: the SHARED noise basis — FBM, curl, domain warping, value/simplex/worley, flow noise — underpinning molten metal, embers, heat shimmer, smoke, and the cooling temperature field.
> Author target: senior real-time-graphics / technical-artist. Buildable in THIS codebase (Vite + R3F + three.js, `onBeforeCompile` chunk injection, `src/scene/shaders.js`).

---

## 1. SCOPE

Noise is not "an effect" in GAELWORX — it is the **substrate every effect samples from**. The living molten metal (bubbling, viscous, churning), the pour front creeping left-to-right through Celtic-interlace channels, the per-letter cooling gradient (white-hot → orange → forge-red → iron-black), the heat shimmer warping the air, the sparks orbiting the hottest point, the deep ember veins in the basalt, and the smoke off the altar are all the **same handful of noise fields** read at different scales, warps, and time rates. If each chamber invents its own noise, the world fractures: the molten in the casting-room won't "rhyme" with the veins in the obsidian slab or the embers drifting through every scene. The goal of this element is therefore a **single, namespaced, dimension-flexible GLSL noise library** (`gw_*` in `src/scene/shaders.js`) — value/simplex/worley primitives, FBM on top, curl + domain-warp + flow-noise composites — tuned for the warm-forge palette and the iPhone-15 perf budget, so every shader in the forge draws from one well. The repo already ships the seed of this (`gw_snoise`, `gw_fbm`, `gw_caustic`); this document specifies how to grow it into the full toolkit without breaking the existing obsidian slab.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 The primitive layer — value / gradient(simplex) / worley

The 2025 consensus (Dan Greenheck's _10 Noise Functions for Three.js TSL Shaders_, Dec 2025) ranks the primitives the same way they've ranked for 20 years, but now with copy-paste TSL **and** GLSL parity:

- **White noise** (`fract(sin(dot(p, k)))`): free, the seed for everything, but hash-quality is GPU-dependent — fine for grain/dither, never for structure.
- **Value noise**: cheapest structured noise (4 hashes + smoothstep lerp in 2D). Soft, blobby, slightly grid-biased. Good for cheap low-frequency masks (the coverage mask deciding _where_ veins live) where artifacts hide.
- **Gradient / Perlin / Simplex**: the workhorse. Simplex (Ashima/Gustavson port) costs more per call than value noise but is **isotropic** (no axis-aligned streaks), which matters enormously for fire and flowing metal where directional bias reads as "fake." The repo's `gw_snoise` is exactly this. Simplex also has cheap analytic derivatives — the key to fast curl (see 2.3). **This stays the GAELWORX default primitive.**
- **Worley / cellular (`mx_cell_noise_float` in TSL, hand-rolled in GLSL)**: distance-to-feature-points. Gives the **crackle/cell structure** that pure FBM cannot — cooling-crust fracture patterns, the broken-iron skin on a cooled letter, bubble nucleation sites in churning metal. F2−F1 (second-nearest minus nearest) draws the crack network directly. More expensive (a 3×3 cell search), so reserve for the hero molten / cooled-crust surface, not ambient.

### 2.2 FBM (fractal Brownian motion) — the texture multiplier

FBM sums octaves of a primitive at doubling frequency (lacunarity ≈ 2.0) and halving amplitude (gain ≈ 0.5). It is the single most important composite: it turns one smooth noise into the multi-scale detail that reads as "real." Every 2025 source converges on the same dials — 6 octaves for offline-quality, **3 octaves for realtime/mobile** (which is exactly what `gw_fbm` already does). Honest tradeoff: each octave is another full primitive evaluation, so FBM cost is `octaves × primitive_cost`. Mobile lives or dies on octave count. A subtle 2025 refinement seen across Shadertoy/Codrops ports: **rotate the domain a few degrees between octaves** (a 2×2 rotation matrix) to kill the residual axis-alignment that stacked simplex octaves can still show — `gw_fbm` currently only offsets (`p*2.03 + offset`); adding a small rotation is a near-free quality win.

### 2.3 Curl noise — divergence-free flow

Curl noise takes the curl of a vector potential, giving a **divergence-free** field — flow with no sinks or sources, so advected particles _swirl_ instead of clumping (Bridson, SIGGRAPH 2007; covered in 2025 by the al-ro embers writeup, the three.js-blocks `CurlNoise` module, and multiple Codrops/Medium GPGPU pieces). Two implementations matter:

- **Finite-difference curl**: sample noise at `p±ε` on each axis → 6–18 noise calls. Simple, correct, **slow**.
- **Analytic-derivative curl** (the 2025 default): use simplex noise's analytic gradient, or the atyuwen "cross product of two gradient fields is divergence-free" trick — **3 noise evaluations** instead of 18. three.js-blocks and al-ro both ship this. For GAELWORX this is how the **sparks orbit the pour front** and how smoke off the altar curls believably.

Curl is a _velocity field_, not a look — you must **advect** (`p += curl(p)·dt`, 4–8 substeps) to reveal coherent vortices, or it just looks like generic displacement (three.js-blocks calls this "the missing piece").

### 2.4 Domain warping — the molten / viscous look

Domain warping feeds noise into the _coordinates_ of more noise: `fbm(p + fbm(p + fbm(p)))`. This is what makes the difference between "orange noise" and **molten, marbled, viscous metal**. IQ's canonical recipe is re-covered everywhere in 2025 (AltPsyche's _FBM and Domain Warping_, the MiniMax-AI shader-dev skill, multiple Shadertoy studies). The repo **already uses single-level warp** in `gw_caustic` and the slab's `gwVeins` (`p += w * 1.1`). The molten metal wants **two warp levels** for the churning, folding flow; the basalt veins want one. Cost is linear in warp depth (each level is another FBM), so it's the first knob to drop on mobile.

### 2.5 Flow noise — animating without "scrolling"

Naively animating noise by adding time to a coordinate makes texture _slide_ — wrong for fire, which boils in place. Three 2025-relevant approaches:

- **Rotating-gradient flow noise** (Perlin–Neyret): rotate each octave's gradients over time so the pattern _boils_ rather than scrolls. Highest quality, more math.
- **Time as a 3rd/4th noise dimension**: evaluate `snoise(vec3(p, t))` — the field evolves in place. Clean, isotropic, one extra dimension of cost. **Recommended default for the molten surface.**
- **Domain-warp advection**: animate the _warp offset_ over time (what the slab does: `uTime*0.05` inside the warp). Cheap, reads as flow, already in the codebase.

### 2.6 The TSL / WebGPU question (the big 2025 shift)

The defining 2025 development is **TSL (Three Shading Language)** maturing in three.js (r168+ for the node fire paths; r184 ships TSL as first-class — Greenheck, LearnWithHasan, Maxime Heckel's _Field Guide to TSL and WebGPU_, Oct 2025). TSL lets you compose a node graph in JS that lowers to **WGSL on WebGPURenderer and GLSL on WebGLRenderer** from one source, and unlocks **compute shaders** (GPGPU particle advection without ping-pong FBO hacks — see Plume, three-fluid-fx, Scenes3D's curl flow field). It ships `mx_noise_float` / `mx_cell_noise_float` / `mx_noise_vec3` (MaterialX noise) built in.

**Honest tradeoff for GAELWORX:** TSL is the future and the cohesion story is beautiful (one noise graph, every chamber), but it **requires WebGPURenderer for the WGSL/compute path**, Safari iOS WebGPU only landed in 18, and **R3F does not natively support WebGPU's async renderer init** (every 2025 R3F-TSL example flags this as "experimental"). Our hard constraints — single WebGLRenderer, `MeshPhysicalMaterial.onBeforeCompile`, iPhone-15 primary target, content-first degrade — mean **a WebGPU migration now is a budget and reliability risk**. The pragmatic 2025 read: stay on the WebGL/GLSL `onBeforeCompile` path the slab already uses, but **author the noise library so it can be ported to TSL `Fn()` later** (matching names, same FBM/warp/curl structure).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Grow `src/scene/shaders.js` into a complete `gw_`-namespaced GLSL noise toolkit, injected via the existing `onBeforeCompile` pattern, with TSL as a deferred Phase-2 port — not a Phase-1 rewrite.**

Concretely:

1. **Keep `gw_snoise` (simplex 2D) as the primitive** and add **`gw_snoise3` (simplex 3D)** so molten/flow can use time-as-3rd-dimension and curl can use analytic 3D gradients.
2. **Keep `gw_fbm`, add a domain-rotation between octaves**, and add **`gw_fbm3`** (3D) + an octave-count `#define GW_OCTAVES` so the quality tier can drop octaves on `low`/`static`.
3. **Add `gw_warp`** (the IQ two-level domain-warp composite) for the molten/viscous look, parameterized so the basalt veins use one level and the hero molten uses two.
4. **Add `gw_worley` (F1/F2)** for cooling-crust crackle and bubble cells — high-tier only.
5. **Add `gw_curl3`** (analytic-derivative, 3-evaluation) for sparks + smoke advection.
6. **Centralize the temperature ramp** as `gw_tempColor(float t)` so the molten, the cooling letters, and the embers all map heat→color through the **same** function and the same palette constants.

Justification tied to the world + constraints: this is **additive** (the obsidian slab keeps compiling unchanged — we only append functions), it **reuses the proven injection path** (`shader-fx` skill), it keeps **one noise basis** so every chamber rhymes (cohesion), the `#define` octave gate plus high-tier-only worley honors the **three quality tiers**, and it sidesteps the **WebGPU/Safari/R3F-async risk** while leaving a clean TSL migration seam.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js** — current pin (WebGLRenderer + `MeshPhysicalMaterial.onBeforeCompile`). No new dep.
- **react-three-fiber / drei / @react-three/postprocessing** — as installed. No new dep.
- **Reference only (do NOT add at runtime):** `lygia` (includable GLSL noise — read for the rotation-between-octaves and worley impls), three.js-blocks `CurlNoise` (analytic-derivative curl reference), al-ro embers (curl), three-fluid-fx (heat-haze distortion — see §5).
- **Deferred (Phase 2, WebGPU only):** `three/tsl` (`Fn`, `mx_noise_float`, `mx_cell_noise_float`, `mx_noise_vec3`), optionally `three-plume` for GPU-compute sparks once WebGPU is greenlit.

### 4.2 The extended noise library (append to `src/scene/shaders.js`)

```glsl
// --- add below the existing gw_snoise / gw_fbm / gw_caustic ---

#ifndef GW_OCTAVES
#define GW_OCTAVES 3            // 3 = realtime/mobile; tier drops to 2 on low/static
#endif

// 2x2 rotation to break axis-alignment between FBM octaves (cheap quality win)
const mat2 GW_ROT = mat2(0.80, 0.60, -0.60, 0.80);

// rotated-octave FBM (replaces the offset-only loop; same call signature)
float gw_fbmR(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i = 0; i < GW_OCTAVES; i++){
    s += a * gw_snoise(p);
    p = GW_ROT * p * 2.02 + vec2(11.3, 7.7);
    a *= 0.5;
  }
  return s;
}

// 3D simplex (Ashima/Gustavson 3D) — needed for time-as-Z flow + analytic curl.
float gw_snoise3(vec3 v){ /* paste Ashima snoise(vec3) here, gw_-prefixed */ }
float gw_fbm3(vec3 p){
  float s = 0.0, a = 0.5;
  for(int i = 0; i < GW_OCTAVES; i++){ s += a * gw_snoise3(p); p = p*2.03 + 19.1; a *= 0.5; }
  return s;
}

// Two-level domain warp — the MOLTEN / viscous look (IQ recipe).
// warpAmt2 = 0.0 collapses to single-level for the cheaper basalt-vein path.
float gw_warp(vec2 p, float t, float warpAmt2){
  vec2 q = vec2(gw_fbmR(p + vec2(0.0, t*0.10)),
                gw_fbmR(p + vec2(5.2, t*0.08)));
  vec2 r = vec2(gw_fbmR(p + 1.7*q + vec2(1.7, 9.2) - t*0.06),
                gw_fbmR(p + 1.7*q + vec2(8.3, 2.8) + t*0.05)) * warpAmt2;
  return gw_fbmR(p + 1.7*q + 1.4*r);
}

// Worley F1/F2 — cooling-crust crackle + bubble cells. HIGH tier only.
vec2 gw_worley(vec2 p){
  vec2 ip = floor(p), fp = fract(p);
  float f1 = 9.0, f2 = 9.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 g = vec2(float(i), float(j));
    vec2 o = fract(sin(vec2(dot(ip+g, vec2(127.1,311.7)),
                            dot(ip+g, vec2(269.5,183.3)))) * 43758.5453);
    vec2 d = g + o - fp; float r = dot(d,d);
    if(r < f1){ f2 = f1; f1 = r; } else if(r < f2){ f2 = r; }
  }
  return sqrt(vec2(f1, f2));            // .y - .x = crack network
}

// Analytic-derivative-style 3D curl (finite-diff shown; swap for analytic in HW path).
vec3 gw_curl3(vec3 p){
  const float e = 0.1;
  float x1=gw_fbm3(p+vec3(0,e,0)), x2=gw_fbm3(p-vec3(0,e,0));
  float y1=gw_fbm3(p+vec3(0,0,e)), y2=gw_fbm3(p-vec3(0,0,e));
  float z1=gw_fbm3(p+vec3(e,0,0)), z2=gw_fbm3(p-vec3(e,0,0));
  return normalize(vec3(x1-x2, y1-y2, z1-z2) / (2.0*e));
}

// MASTER TEMPERATURE RAMP — single source of heat->color for the whole world.
// t in [0,1]: 0 = iron-black cooled, 1 = white-hot. AE letters clamp t>=0.9 forever.
vec3 gw_tempColor(float t){
  vec3 c = mix(${'`'}${'$'}{v3(PAL.void)}${'`'},  ${'`'}${'$'}{v3(PAL.crimsonDeep)}${'`'}, smoothstep(0.05, 0.30, t));
  c     = mix(c,              ${'`'}${'$'}{v3(PAL.red)}${'`'},         smoothstep(0.30, 0.55, t));
  c     = mix(c,              ${'`'}${'$'}{v3(PAL.ember)}${'`'},       smoothstep(0.55, 0.80, t));
  c     = mix(c,              ${'`'}${'$'}{v3(PAL.hot)}${'`'},         smoothstep(0.80, 1.00, t)); // HDR core -> blooms
  return c;
}
```

> Note: the `${'`'}...${'`'}` placeholders above are written so the `v3(PAL.x)` template interpolation reads cleanly when this block is pasted into the JS template string in `shaders.js` (same inlining the slab already uses: `${'`'}${'$'}{v3(PAL.ember)}${'`'}`). In the real file they are just `${'$'}{v3(PAL.void)}` etc.

### 4.3 R3F component shape (a molten surface, matching the slab pattern)

```jsx
// MoltenSurface.jsx — gated by forge.route (casting-room / channel-hall).
// Mirrors ObsidianSlab.jsx: MeshPhysicalMaterial + onBeforeCompile + dt-damped uniforms.
const HEAD = /* glsl */ `
  uniform float uTime, uTempBias, uFlow, uViscosity, uPourFront;
  ${GLSL_NOISE}                         // gw_snoise(3)/gw_fbmR/gw_warp/gw_worley/gw_curl3/gw_tempColor
`
const COLOR = /* glsl */ `
  float molten = gw_warp(vUv * uViscosity, uTime, 1.0);          // 2-level on high
  float crust  = (gw_worley(vUv * 6.0).y - gw_worley(vUv*6.0).x);// crack network (high only)
  float heat   = clamp(molten * 0.5 + 0.5 + uTempBias, 0.0, 1.0);
  heat        *= step(vUv.x, uPourFront);                        // fill L->R behind the pour
  vec3 metal   = gw_tempColor(heat) * (0.8 + 0.6 * crust);
  gl_FragColor.rgb += metal * uFlow;
`
```

```jsx
useFrame((state, dt) => {
  u.uTime.value      = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  u.uPourFront.value = damp(u.uPourFront.value, forge.pourFront ?? 1, 2.0, dt)  // shared store
  u.uTempBias.value  = damp(u.uTempBias.value, sceneFor(forge.route).temp ?? 0, 2.4, dt)
  u.uFlow.value      = damp(u.uFlow.value, forge.ready ? 1 : 0, 3, dt)
})
```

### 4.4 Key uniforms & parameters

| Uniform | Range | Drives | Shared? |
|---|---|---|---|
| `uTime` | seconds (frozen=2 on static) | all flow/boil | every noise shader |
| `uTempBias` | −0.3 … +0.3 | per-route master heat offset | add to `SCENES` rows |
| `uPourFront` | 0…1 (UV.x) | L→R fill of channels/letters | `forge.pourFront` in `store.js` |
| `uViscosity` | 0.6…4 | molten warp scale (≈ slab's `veinScale`) | reuse `veinScale` semantics |
| `uFlow` | 0…1+ | overall emissive gain (≈ `veinGlow`) | reuse `veinGlow` semantics |
| `GW_OCTAVES` | 2 / 3 | `#define`, tier-gated FBM cost | compile-time per tier |

### 4.5 Hook into the master temperature system

`gw_tempColor(t)` **is** the master temperature system. Every emissive surface computes a scalar `heat ∈ [0,1]` from its noise field and passes it through `gw_tempColor`. The slab's existing `body = mix(crimson, ember, …); mix(…, hot, gwCore)` should be **refactored to call `gw_tempColor`** so the obsidian veins, the molten pour, the cooling letters, and the embers share one ramp. The **A+E divine fire** is just `heat = max(heat, 0.92)` clamped on the A/E letter geometry (so they never cool below white-gold) — same function, pinned input.

---

## 5. COHESION

- **Palette:** `gw_tempColor` is built _only_ from `PAL` constants (`void → crimsonDeep → red → ember → hot`). Nothing samples a raw color; the warm-forge 60/30/10 is enforced at the noise→color boundary. HDR `PAL.hot` (>1) sits at the top of the ramp so **only the hottest molten cores and the A+E divine fire bloom** (post-fx `luminanceThreshold=0.55`), exactly as the slab already relies on.
- **Lighting:** noise emissive is added **before** `#include <tonemapping_fragment>` (the slab's COLOR hook), so it rides the same ACES tone-map and the same drei-Lightformer env reflections — molten metal reflects the cool key light just like the obsidian, tying surfaces together. No new lights; no EXR (constraint honored).
- **Shared fields, not shared looks:** the basalt veins (slab), the molten pour (casting-room), and the channel-hall top-down flow all call `gw_warp`/`gw_fbmR` with different scales and warp depth — same DNA, different expression. The **embers** (`Embers.jsx`) and **sparks** advect through `gw_curl3` seeded from the _same_ `uTime`, so atmosphere in every chamber drifts coherently.
- **Pour front continuity:** `forge.pourFront` (one store value) drives `uPourFront` in the molten surface, the channel fill, AND the letter-fill mask — so the metal "arrives" in one continuous left-to-right motion across the world, not three independent animations.
- **Heat shimmer:** implement as a **screen-space UV distortion** sampling a `gw_fbm3` field (low intensity, fast time) over the hottest regions — the three-fluid-fx "heat-haze" guidance (keep intensity modest, high velocity-dissipation for quick shimmer, never let it tear text). Reuse the curl/fbm basis; do not introduce a separate fluid sim on mobile.

---

## 6. MOBILE & PERFORMANCE

The iPhone-15 budget is the hard wall. Order of cost: **worley > 2-level warp > 3D FBM > 2D FBM > simplex > value**.

- **Octave gate:** `#define GW_OCTAVES 3` on `high`, **2** on `low`/`static`. Recompile per tier (the material is memoized on `transmissive`/quality — add quality to the `#define` injection).
- **Worley is high-tier only.** On `low`, drop the crust term entirely (`crust = 0.0`) — the molten still reads from the warp.
- **Warp depth on tier:** `gw_warp(..., warpAmt2)` — pass `1.0` on high (two-level), `0.0` on low (collapses to single-level, ~⅓ cheaper).
- **3D vs 2D:** prefer time-as-warp-offset (2D) over time-as-Z (3D) on `low`; 3D FBM only where the molten/curl genuinely needs it.
- **`static` tier:** freeze `uTime` (= 2, the slab pattern), `frameloop='demand'`, no shimmer pass, no curl advection — the noise renders one still frame. Reduced-motion safe.
- **Resolution:** heat-shimmer / any noise post pass runs at **half-res** then upsamples (it's low-frequency — no one sees the blur). Never full-res noise post on mobile.
- **No per-pixel branches on the hot path:** the `step(vUv.x, uPourFront)` mask is branchless; keep worley's 3×3 loop unrolled by the compiler (fixed bounds).
- **Fallback:** if WebGL fails, `CanvasBoundary` already serves a static poster — noise never gates the LCP (3D mounts after paint).

Targets: keep added fragment cost under what the slab already spends (3-octave FBM × a couple of warp samples). The molten surface should be **one quad / one extra material**, not a particle storm — sparks stay in the existing additive `points` budget.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder):**

1. **Land the primitives first, in isolation.** Add `gw_snoise3` + `gw_fbm3` + the rotated `gw_fbmR` to `shaders.js`, `npm run build` green, and `qa-route` (SwiftShader compiles the GLSL → 0 console errors ≈ it compiled) **before** wiring any look. A 3D-simplex paste typo is the #1 first-build failure.
2. **Add `gw_tempColor` and refactor the SLAB to use it** _before_ building the molten surface — prove the ramp on the known-good slab so the molten inherits a verified color map. This also forces palette cohesion early.
3. **Build the molten as warp-only** (no worley, no shimmer), verify it reads as molten, _then_ layer crust and shimmer. Each layer behind a tier gate from the start.
4. **Advect the curl** — don't ship raw `gw_curl3` as displacement (it'll look like generic wobble); integrate `p += curl·dt` over 4–8 substeps from the first commit (the documented "missing piece").

**Specific pitfalls:**

- **Namespace collisions:** three's built-in chunks define `permute`/`snoise`/`mod289`. Everything stays `gw_`-prefixed (the repo rule) — a bare `permute` will redefine and fail to compile.
- **Scrolling instead of boiling:** animating by adding time to a coordinate slides the texture. Use time-as-Z or animate the _warp offset_ (§2.5).
- **Banding in the temperature ramp:** hard `mix` steps band on the OLED. Use `smoothstep` segment edges (done in `gw_tempColor`) and lean on the post grain.
- **Bloom blowout:** if everything glows, you pushed mid-ramp colors >1. Only `PAL.hot` (the top segment) is HDR; keep `crimson`/`ember` ≤1 so bloom catches only cores.
- **Worley seam artifacts:** the 3×3 search must wrap the cell hash consistently; an off-by-one in the neighbor loop gives visible cell edges.
- **dt-correctness:** every uniform animates via `damp(cur, tgt, λ, dt)` — never frame-rate-dependent `lerp`. Freeze on `static`.
- **Mobile compile time:** big 3D-simplex + worley + 2-level warp in one fragment can blow shader-compile time on first paint. Gate worley out of the `low` shader so the mobile variant is materially smaller, and compile after first paint.

---

## 8. SOURCES (2025–2026)

1. Dan Greenheck — **10 Noise Functions for Three.js TSL Shaders** — Three.js Roadmap, **2025-12-08**. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders (value/perlin/simplex/worley/FBM/curl/domain-warp TSL+GLSL parity, lacunarity/gain dials).
2. Maxime Heckel — **Field Guide to TSL and WebGPU** — **2025-10-14**. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (TSL `Fn()`, WGSL/GLSL dual-lowering, compute shaders, iOS18 WebGPU caveats).
3. MisterPrada — **Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL** — Codrops, **2025-03-10**. https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/ (FBM-with-Z domain warp, perf: precomputed noise texture, lower-poly).
4. Lolo Armdz — **Interactive Text Destruction with Three.js, WebGPU, and TSL** — Codrops, **2025-07-22**. https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/ (`mx_noise_vec3` in compute, GPU vertex advection).
5. Three.js Blocks — **CurlNoise (WebGPU, WebGL) module docs** — 2025. https://www.threejs-blocks.com/docs/module-CurlNoise (analytic-derivative curl = 3 noise evals, FBM-curl octaves 2–4, advection 4–8 substeps, domain-warp to break lattice artifacts).
6. Matthew Frawley (Pragmattic) — **React Three Fiber with WebGPU and TSL Node Material** — **2025-03-02**. https://blog.pragmattic.dev/react-three-fiber-webgpu-typescript (R3F + node material, `MathUtils.damp` uniform pattern — mirrors our store).
7. three-fluid-fx — **Distortion: WebGPU/TSL & WebGL/GLSL walkthroughs** — 2025. https://three-fluid-fx.artcreativecode.com/tutorials/tsl/full/distortion/ (heat-haze = velocity-field UV refraction; keep intensity modest, high velocity-dissipation for quick shimmer, don't tear text).
8. typeWolffo — **THREE.Fire (volumetric fire, GLSL + TSL/WebGPU)** — **2025-07-09**. https://github.com/typeWolffo/THREE.Fire (raymarched fire, configurable octaves/lacunarity 2.0/gain 0.5; GLSL simplex vs TSL `mx_noise_float`).
9. travisdmathis — **Plume (GPU-first Niagara-style VFX for three.js, TSL compute)** — **2026-04-24**. https://github.com/travisdmathis/plume (`CurlNoiseForce`/`TurbulenceForce`/`VortexForce` modules, procedural fire from layered flame tongues + ember streaks; WebGPU peer).
10. al-ro — **3D Curl Noise** — three.js. https://al-ro.github.io/projects/embers/ (Bridson curl, atyuwen cheap divergence-free `cross(grad0,grad1)`, plane-artifact warning).
11. AltPsyche — **FBM and Domain Warping** — 2025. https://altpsyche.dev/blog/sf-fbm-and-warping (IQ `fbm(p+fbm(p+fbm(p)))` recipe, octave structure).

> Canonical pre-2025 techniques (IQ domain warping/fbm; Bridson 2007 curl; Ashima simplex; Perlin–Neyret flow noise) are cited above _via_ 2025–2026 coverage per the recency rule.

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **TSL/WebGPU migration of the `gw_*` toolkit** — port each function to `Fn()` + `mx_noise_*`, prototype the WebGPURenderer + R3F async-init path, and measure whether compute-shader spark advection beats the WebGL additive-points budget on iPhone-15. The single biggest forward bet; gated on Safari-iOS WebGPU reliability.
2. **Worley-driven cooling-crust system** — a dedicated study of F1/F2 crack networks + nucleation for the "cooled iron-black letter" look (fracture growth animated by the cooling front), including a baked-vs-live tradeoff for mobile.
3. **Curl-advected spark & smoke system** — analytic-derivative 3D curl, multi-substep advection, drawn-by-heat seeding around `uPourFront`, and how to keep it inside the existing additive-points budget without GPGPU.
4. **Heat-shimmer screen-space distortion pass** — half-res `gw_fbm3` UV-refraction as a postprocessing effect in the existing composer (three-fluid-fx model), tuned to never tear the Cinzel letterforms, with a `static`-tier off-switch.
</content>
</invoke>
