# 08 — Worley F1/F2 Cooling-Crust Crack Network as a Dedicated System

_Phase 2 deep-dive · GAELWORX forge world · cluster **F-noise-shared** · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js), no runtime EXR._

> **What this doc owns, and how it differs from `05-surface-tension-crust-modeling`.** Doc 05 solved the
> _close-camera molten **surface**_ — the live, hot, churning membrane that tears and re-melts under shear,
> where Worley was one of four layered terms. **This doc owns the opposite end of the timeline: the
> **fully-cooled iron-black letterform**, where the metal has stopped moving and the crust is a permanent,
> brittle **fracture network** of cracked oxide scale.** It promotes `gw_worley` from "one term in the molten
> skin" to a **dedicated, standalone crack-network system** with three things doc 05 deliberately deferred:
> (1) **nucleation** — cracks seeded from discrete cooling-stress points, not a uniform film; (2) **fracture
> growth animated by the cooling front** — cracks that *propagate outward as the letter cools*, not a static
> texture revealed by a mask; and (3) **a rigorous baked-vs-live tradeoff for the 3×3 cell-search cost on
> mobile**, the single most expensive primitive in the whole `gw_` toolkit. It is held to the
> `00-COHESION-MAP` contract: one temperature signal (`gwCool`/`gw_forge`), one noise basis (`gw_worley`
> from `shaders.js`), one palette, **Worley high-tier only with a hard `crust=0` fallback on low/static**,
> and the A/E divine-fire keystone (the divine letters never crack, because they never cool).

---

## 1. SCOPE

This is the **terminal state of a GAELWORX letter's cooling timeline** as a discrete, brittle phenomenon.
Doc 02 (`per-letter-cooling-timeline`) authored `temp = gwCool(age, k)` marching `1 → 0.08` white-hot to
iron-black; doc 05 authored the *molten* membrane that lives at the hot end of that march. **This doc owns
the cold end: what the iron-black metal's surface does once `temp` has dropped past the solidus and the
oxide skin becomes a rigid, cracked crust** — the forged-scale fracture network you read on a casting that
has cooled, with deep ember veins still glowing in the crack roots (the "metal is alive" floor).

The physical event we are dramatizing is real and is the correct mental model. When hot iron cools, an
oxide scale (FeO / Fe₃O₄ / Fe₂O₃ layers) forms on the surface; as the metal contracts, the **thermal-
expansion mismatch between the scale and the substrate builds stress, which is relieved by cracking** — the
scale fractures into a cellular network and partially spalls. The 2025 materials-science literature (Nature
Scientific Reports' ML crack-prediction study; the Springer thermophysical-properties paper, §8) frames it
exactly this way: cracking is **stress-driven, nucleates at discrete points, and propagates as a front as
the temperature gradient sweeps through.** That is *precisely* a Voronoi/Worley process animated by the
cooling front — which is why this is the right primitive and the right animation driver, not an arbitrary
art choice.

The five readable behaviors this system must produce on the cooled letter:

1. **Nucleated cells, not a film.** The crust solidifies and cracks outward from discrete **nucleation
   seeds**, so the cell structure is cellular (Worley/Voronoi), not fBm-blobby. **F1** (distance to nearest
   seed) gives the flat plate interiors; **F2−F1** gives the thin crack network exactly along the cell
   boundaries.
2. **Fracture growth driven by the cooling front.** A crack does not exist until the metal beneath it has
   cooled past a stress threshold. As the per-fragment `temp` falls (driven by the shared cooling clock),
   cracks **widen and the network completes** — the fracture *propagates* behind the cooling front rather
   than appearing all at once.
3. **Ember veins glowing in the crack roots.** The crack network is where the cold skin is *thinnest*, so
   the hot substrate shows through — the deep ember seams (`uVeinFloor`, never black) live in the F2−F1
   channel, glowing forge-red in an otherwise iron-black plate.
4. **Forged plate relief.** The flat F1 plate interiors are slightly raised; the crack network creases
   inward — a `dFdx/dFdy` normal perturbation lets the cool procedural env key catch the plate edges so the
   crust reads as physically forged scale, not a painted texture.
5. **The A/E never crack.** The divine-fire glyphs (`uIsAE`) hold `gw_divineFire` forever and never cool, so
   the entire nucleation/crack/growth machine is multiplied to zero for those two letters — the keystone,
   expressed identically to every other system.

This is a **F-noise-shared** topic because the crack network is the single most demanding consumer of the
shared `gw_worley` primitive, and its cost discipline (baked vs live, high-tier-only, `crust=0` fallback)
sets the budget rule for *every* cellular use in the world (doc 05's molten skin, future bubble nucleation).
The cooled crust is also the **bridge value-range to the basalt** — its matte iron-black oxide sits in the
same `PAL.void` band as the green-black Connemara stone, so a fully-cooled letter reads continuous with the
stone it sits in.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every approach is rated **quality / perf / mobile / complexity** against our hard constraint: one WebGL
renderer, `onBeforeCompile` GLSL, iPhone-15 fill-rate budget, no EXR, and it must share the existing
`gw_worley` + master temperature field.

### 2.A Live per-pixel Worley F1/F2 (the 3×3 neighbor search) — the reference quality
The canonical cellular evaluation: hash a feature point into each of the 9 cells of a 3×3 neighborhood,
track the two smallest distances (F1, F2). The Dec-2025 Three.js Roadmap *10 Noise Functions for TSL
Shaders* ships this with TSL+GLSL parity and explicitly names the 3×3 search and **F2−F1 for "cracks, cells,
organic structures"**; the Apr-2025 Sangil Lee *Understanding the Variations of Cellular Noise* catalogs
F1 / F2 / F2−F1 and the distance metrics (§2.E). This is the **highest-quality, fully-dynamic** option — the
crack network can drift, the cells can be re-seeded, F2−F1 is mathematically exact along every boundary.
- Quality: **highest** (exact, infinitely sharp, fully animatable). Perf: **the most expensive primitive in
  the toolkit** — 9 hashes + 9 distance evals + the two-smallest bookkeeping, *per fragment*, on a near-
  full-frame letter. Mobile: **high-tier only** (per `00-COHESION-MAP §2`). Complexity: **medium**.
  → **The `high`-tier live path, when the camera is close and the cells must animate.**

### 2.B Baked Worley → texture (the F-noise-shared cost answer)
Bake the F1 and F2−F1 channels **once** into a texture (offline at build, or once at boot via a single
fullscreen pass), then the per-fragment cost collapses to **one `texture2D` fetch** instead of a 9-iteration
loop. The 2026 utsubo *100 Three.js Tips* makes "**bake what you can**" its headline mobile rule, and Heckel's
Oct-2025 *Field Guide to TSL and WebGPU* shows the modern bake path: a WebGPU/TSL **compute pass writes the
cellular field to a storage texture once**, then every material samples it. For a **letter whose geometry
and cell layout are fixed** (the wordmark does not move), the crack network is *intrinsically static in
texture space* — only its *reveal* is animated — so baking loses almost nothing. This is the lever that lets
the crust ship on a wider device range than the live search.
- Quality: **high** (identical network; only loses the ability to *re-seed* cells live, which we never do
  on a fixed letter). Perf: **excellent** (one fetch). Mobile: **green** — this is what makes a crust
  *possible* below high-tier if we choose. Complexity: **medium** (the bake pass, channel packing, the
  static-UV requirement). One caveat the 2026 tips flag: a dependent texture read + the texture binding cost
  must be weighed against the ALU it saves — on a tiny on-screen letter the live search may already be
  cheap enough that the binding isn't worth it (§6 settles this).
  → **The recommended `high`-tier path for the *crack network channel*; the enabler for an optional `low`
  crust if device data justifies it.** The reveal/growth stays live (cheap) regardless.

### 2.C Hybrid: bake the *network*, animate the *growth* live (the pick)
The insight that resolves the tradeoff: **the crack *network geometry* is static (bake it), but the crack
*propagation* is a cheap analytic function of the live cooling front (compute it per-pixel).** Sample the
baked `vec2(F1, F2−F1)` texture (one fetch), then animate growth with `smoothstep` against the shared
`temp` — the cracks widen as `temp` falls, fully live, for the cost of two `smoothstep`s. You get the
exact static network *and* the front-driven fracture growth, with neither a per-pixel 3×3 loop nor a
ping-pong state texture.
- Quality: **highest practical** (exact network + live front-driven growth). Perf: **excellent** (one
  fetch + a few ALU). Mobile: **green on high, viable on low**. Complexity: **medium**.
  → **The GAELWORX pick (§3).**

### 2.D Jump-Flood Algorithm (JFA) for the distance field
If we needed a *true Euclidean distance field* to arbitrary seeds (or wanted to re-seed at runtime), JFA
builds an approximate Voronoi/distance transform in `O(log n)` passes on the GPU. The 2025 surveys
(Grokipedia/Wikipedia note JFA's continued wide use and dynamic-seed variants for moving seeds in real-time
sims) confirm it is the standard GPU Voronoi builder. **But** for a *fixed* letter we don't need runtime
re-seeding, and JFA is a multi-pass build — overkill versus a single bake pass (2.B). JFA is the right tool
*only* if a future chamber needs cracks that nucleate from a moving impact point live.
- Quality: **highest** for dynamic seeds. Perf: multi-pass build (cheap to *sample* after). Mobile: the
  *build* is the cost; fine if done once. Complexity: **high** (ping-pong passes, seed encoding).
  → **Rejected for the fixed wordmark crust; named as a candidate (§9) for a live-impact crack chamber.**

### 2.E Distance-metric choice (Euclidean vs Manhattan vs Chebyshev) — the *shape* knob
Independent of how the field is produced, the **distance metric sets the cell silhouette**. Sangil Lee's
2025 catalog and Catlike Coding's Voronoi tutorial agree: **Euclidean** → rounded cells (organic, blobby);
**Manhattan** → jagged, diamond-oriented cells; **Chebyshev** → angular, box-like cells rotated ~45°. For
**forged iron scale**, the real reference (oxide plates) is **angular and polygonal**, so a Euclidean→
Chebyshev blend (or pure Chebyshev) reads more like cracked scale than rounded Euclidean cells. This is a
free art knob — it changes which distance function the bake/search uses, not the cost structure.
- Quality: **decisive for the "forged" read**. Perf: **free**. Mobile: **free**. Complexity: **trivial**.
  → **Use a Euclidean↔Chebyshev `mix` (`uCellAngular ≈ 0.5`) for angular, forged plates.**

### 2.F Crack-junction extraction (vector cracks) — rejected for the hero
The Dec-2025 TouchDesigner *GLSL Advanced POP — Voronoi Fracture pt. 2* lesson extracts **exact crack lines
and 2-point/3-point junctions** as geometry (repositioning pre-allocated line geometry on the GPU). This is
the gold standard for *crisp vector cracks* and is how you'd build a shatter-into-shards effect. For a
near-full-frame emissive letter at the GAELWORX perf budget, a **fragment-space F2−F1 band** gives the
same read at a fraction of the cost; vector-line extraction is a geometry-pass technique reserved for an
actual fracture-into-shards beat (not the cooled-letter crust).
- Quality: **highest crisp-line** (true vector cracks, sharp junctions). Perf: **geometry pass**, heavier.
  Mobile: **risky** for full-frame. Complexity: **high**.
  → **Rejected for the crust; the candidate for a "letter shatters" finale (§9).**

### 2.G Ping-pong GPGPU fracture state (true propagation memory)
A render target that *remembers* which cracks have opened, advancing the fracture front frame-to-frame so a
crack, once open, stays open (genuine hysteresis/history). Heckel's 2025 compute-state-texture work is the
model. This is the only path to a crack network that *grows and remembers* truly independently of an
analytic `temp` driver. **But** our growth driver (`temp` from the shared cooling clock) is monotonic on a
cooling letter — cracks only ever open, never heal — so the analytic `smoothstep(temp)` growth (2.C) is
*visually identical* to a stateful one for the cooled letter, at zero render-target cost. The FBO version
earns its keep only if cracks must heal/re-melt (the molten skin of doc 05, or a strike re-melt beat).
- Quality: **highest** for healing/re-melting cracks. Perf: **a persistent RT + ping-pong**. Mobile:
  **marginal**, high-tier-only. Complexity: **high**.
  → **Rejected for the cooled-letter crust (monotonic growth needs no memory); a candidate for strike-driven
  re-melt (§9).**

### 2.H TSL `Fn()` + MRT-tagged crack emissive (the forward port)
On `WebGPURenderer`, `gw_worley` becomes a reusable `Fn()` node, the field is baked by a **compute pass to a
storage texture** (Heckel 2025), and the glowing crack roots write to a dedicated **MRT `emissive`
attachment** so bloom catches the ember veins exactly (no luminance-threshold false positives). The Jan-2026
Codrops *WebGPU Gommage* piece demonstrates the noise-mask + MRT + selective-bloom pattern on text. **But**
the judge device runs WebGL2 + the WebGL `@react-three/postprocessing` composer, so this is the port target,
not the build.
- Quality: **equal-to-better** (cleaner bloom selection). Perf: WebGPU win. Mobile: iOS WebGPU is the 2026
  risk surface. Complexity: **high migration**.
  → **Author the GLSL pure-function and TSL-portable; ship GLSL, gate WebGPU post-judge.**

**Landscape verdict.** The cooled-letter crack network is **2.C (bake the network, animate the growth live)
+ 2.E (Chebyshev-blend angular cells)**, with **2.A (live 3×3 search) as the high-tier option when a chamber
needs live-drifting cells**, and a **hard `crust=0` fallback on low/static**. JFA (2.D), vector junctions
(2.F), ping-pong state (2.G) are named candidates for specific future beats; TSL/MRT (2.H) is the port.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a dedicated `gw_crust()` GLSL block in `src/scene/shaders.js` that reads a baked `vec2(F1, F2−F1)`
crust texture (one fetch on `high`) or runs the live `gw_worley` 3×3 search (when a chamber needs drifting
cells), animates fracture growth analytically from the shared `temp`, glows ember veins in the crack roots
via the master ramp, and is multiplied to zero on `low`/`static` and for the A/E.** The justification:

1. **It is the *cold terminus* of the one cooling timeline, not a new effect.** The crack growth is driven
   by `temp = gwCool(age, k)` from doc 02 — the *same* clock that cools the letter's color. As `temp` falls
   past the solidus band, the cracks open. There is no second clock, no second orange, no second noise: the
   crust is literally "the same metal, at the cold end of the same timeline, cracking as it contracts."

2. **Bake-the-network is the correct answer to the F-noise-shared cost question.** A fixed letter's cell
   layout never changes; only the *reveal* animates. Baking F1/F2−F1 once collapses the most expensive
   primitive in the toolkit (the 3×3 loop) to a single fetch (utsubo 2026 "bake what you can"; Heckel 2025
   compute-to-texture), which is the structural reason the crust can be *cheap enough to keep on `high`
   without eating the slab's budget* — and the reason an optional `low` crust is even on the table.

3. **Front-driven growth is analytic and free.** Because a cooling letter's cracks only ever open (monotonic
   `temp`), the propagation is `smoothstep` against the live `temp` — no ping-pong state texture, no FBO. The
   fracture "grows behind the cooling front" for the cost of two `smoothstep`s, identical-looking to a
   stateful sim (§2.G) for this monotonic case.

4. **The ember veins are the master ramp, reused.** The crack roots glow `gw_forge(vein)` floored by
   `uVeinFloor` — byte-identical to the slab veins and the cooling-letter veins of doc 02. The crust adds
   *where* the metal glows (the crack network), never *what color* it glows.

5. **Chebyshev-blend cells give the forged read for free.** The angular, polygonal oxide-plate silhouette
   (matching the real scale reference, §8) is a metric `mix`, costing nothing.

6. **The A/E exception is one multiply.** `crust *= (1.0 - uIsAE)` and `metal = mix(metal,
   gw_divineFire(flick), uIsAE)` — the divine letters never crack because they never cool.

7. **It degrades uniformly to nothing.** `high` = baked-network (or live search) + front growth + relief;
   `low`/`static` = **`crust = 0`** (the letter is the smooth cooled `gw_forge(temp)` with floored ember
   veins from doc 02, no cellular layer at all). A tier drop removes the *whole* crust system cleanly — the
   letter is still on-brand cooled iron, just without the forged-scale fracture detail. This is the explicit
   `crust=0 fallback on low` the brief mandates and the `00-COHESION-MAP §7.9` "degrade uniformly" rule.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new dependency)
- `three` (repo r17x line; **WebGL `onBeforeCompile` path** — no WebGPU features required, forward-safe).
  r185 (2026-06-25) is the TSL-portability target, not the ship renderer.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `maath` (`damp`), `leva`
  (`?debug`). All present.
- Reuse `GLSL_NOISE` (`gw_snoise`, `gw_fbm`, `gw_warp`, `gw_worley` — *the* shared primitive) and the master
  temperature string `GW_TEMPERATURE` (`gw_tempColor`, `gw_forge`, `gwCool`, `gw_divineFire`) from
  `src/scene/shaders.js`, plus `PAL`/`v3` from `src/scene/palette.js`. **No new files of substance** — one
  `gw_crust` block appended to `shaders.js`, plus a tiny optional `bakeCrust()` helper for the texture path.

### 4.2 The shared Worley primitive (the one already budgeted in `shaders.js`)
F1 + F2 in one 3×3 search with a Euclidean↔Chebyshev metric blend. This is the *same* `gw_worley` doc 05
uses; this doc adds the angular metric and uses it as a **bake source** as well as a live path.

```glsl
// gw_worley — F1 (nearest) + F2 (second-nearest), 3x3 search, fixed-trip (unrolls).
// uAngular: 0 = Euclidean (rounded cells) .. 1 = Chebyshev (angular forged plates) [Sangil Lee 2025].
// Returns vec2(F1, F2). (F2 - F1) -> the crack network. HIGH-TIER live; also the bake source.
vec2 gw_worley(vec2 p, float uAngular){
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float f1 = 8.0, f2 = 8.0;
  #pragma unroll_loop_start            // utsubo 2026: unroll short fixed loops on mobile
  for(int j = -1; j <= 1; j++){
    for(int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j));
      // hash the seed from ip+g (NEVER fp) — avoids the off-by-one grid-lock seam
      // (00-COHESION-MAP §2; repeated in phase2/01 §7).
      vec2 o = fract(sin(vec2(
        dot(ip + g, vec2(127.1, 311.7)),
        dot(ip + g, vec2(269.5, 183.3)))) * 43758.5453);
      vec2 d  = g + o - fp;
      float eu = dot(d, d);                       // squared Euclidean
      float ch = max(abs(d.x), abs(d.y));         // Chebyshev (angular)
      float dist = mix(eu, ch * ch, uAngular);    // blend in squared space, sqrt once below
      if(dist < f1){ f2 = f1; f1 = dist; }
      else if(dist < f2){ f2 = dist; }
    }
  }
  #pragma unroll_loop_end
  return sqrt(vec2(f1, f2));
}
```

### 4.3 The bake helper (one fullscreen pass at boot, `high` tier)
Bake `F1` into R and `F2−F1` into G of an `RGBAFormat` texture sized to the wordmark's UV footprint
(e.g. 512×128 for a wide wordmark). Done once; the result is sampled by `gw_crust` for one fetch instead of
the 3×3 loop. The reveal/growth stays live, so the bake holds *no* time information.

```js
// bakeCrust.js — run ONCE at boot on `high`. Returns a THREE.Texture (R=F1, G=F2-F1).
// (Heckel 2025: the WebGPU equivalent is a compute pass to a storage texture; this is the WebGL2 form.)
export function bakeCrust(renderer, w = 512, h = 128, cellScale = 9.0, angular = 0.5) {
  const rt = new THREE.WebGLRenderTarget(w, h, { format: THREE.RGBAFormat, type: THREE.UnsignedByteType });
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: cellScale }, uAngular: { value: angular } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      precision highp float; varying vec2 vUv; uniform float uScale, uAngular;
      ${GLSL_NOISE}                                   // brings gw_worley
      void main(){
        vec2 w = gw_worley(vUv * uScale, uAngular);
        float f1     = clamp(w.x, 0.0, 1.0);
        float border = clamp(w.y - w.x, 0.0, 1.0);    // the crack network
        gl_FragColor = vec4(f1, border, 0.0, 1.0);
      }`,
  });
  const scene = new THREE.Scene();
  const quad  = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(quad);
  const cam = new THREE.Camera();
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(prev);
  quad.geometry.dispose(); mat.dispose();
  rt.texture.wrapS = rt.texture.wrapT = THREE.RepeatWrapping;
  rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
  return rt.texture;                                  // dispose rt.texture on unmount
}
```

### 4.4 The `gw_crust` block — nucleated plates + front-driven fracture growth + ember roots
The heart of the dedicated system. Takes the baked crust sample (or a live `gw_worley`), the master `temp`
(0 cold .. 1 hot — note this doc uses the `gw_tempColor` convention, `1=hot`), the cooling-front-derived
fracture progress, and the A/E flag. Pure function → TSL-portable.

```glsl
// --- fracture growth: cracks OPEN as the metal cools past the solidus band. ---
// temp: 1=white-hot .. 0.08=iron-black (gw_forge convention).
// As temp falls below uSolidus, fracture progress climbs 0->1 (monotonic on a cooling letter).
float gw_fractureProgress(float temp, float uSolidus){
  // 1 only once well below the solidus; 0 while still hot/molten (no crust on hot metal).
  return smoothstep(uSolidus, uSolidus - 0.30, temp);
}

// MASTER cooled-crust crack network. crustField = vec2(F1, F2-F1) (baked or live).
// returns vec3 emissive; writes crack/plate via out for relief coupling.
vec3 gw_crust(vec2 crustField, float temp, float isAE, out float crack, out float plate){
  float f1     = crustField.x;             // 0 at cell centre .. 1 at edge
  float border = crustField.y;             // F2-F1: ~0 along cracks, large in plate interiors

  // 1) FRACTURE GROWTH driven by the shared cooling front. Cracks widen as the letter cools.
  float frac   = gw_fractureProgress(temp, 0.42);          // 0 hot .. 1 fully cracked
  // crack band: thin where border is small; WIDENS as frac grows (propagation read).
  float crackW = mix(0.02, 0.10, frac);                    // crack width grows with cooling
  crack = smoothstep(crackW, 0.0, border) * frac;          // the live, growing crack network

  // 2) PLATES: flat raised oxide scale interiors (the F1 cell cores), present once cooled.
  plate = smoothstep(0.18, 0.55, f1) * frac;               // raised plate, only on cooled metal

  // 3) EMBER VEINS in the crack ROOTS — hot substrate shows where the skin is thinnest.
  //    Floored so deep seams NEVER die to black ("metal is alive" law, doc 02).
  float root  = crack * (0.35 + 0.65 * (1.0 - temp));      // hotter glow deeper into the cool
  float vein  = max(root, uVeinFloor * crack);

  // 4) COLOUR: iron-black oxide plates + glowing ember roots, all from the MASTER ramp.
  vec3 oxide  = mix(gw_forge(temp), ${v3(PAL.void)}, plate * 0.85);  // plate darkens toward void
  vec3 emberRoot = gw_forge(clamp(temp + 0.45, 0.0, 1.2)) * vein;    // crack roots > 1 -> bloom
  vec3 metal  = oxide + emberRoot;

  // A/E divine-fire: NEVER cracks, plates, or roots — the keystone, one multiply + one mix.
  crack *= (1.0 - isAE); plate *= (1.0 - isAE);
  metal = mix(metal, gw_divineFire(0.5), isAE);
  return metal;
}
```

### 4.5 Injection (extends doc 02's `PourWordmark` / `ForgeLetter` COLOR hook)
The crust is composited *over* the cooled-letter color from doc 02 (§4.4 step 9), only once the metal has
cooled. On `low`/`static` the entire block is `#ifdef`-gated out — the letter is doc 02's smooth cooled
metal with no crust at all.

**HEAD (fragment), after `#include <common>`:**
```glsl
uniform float uTime, uTemp, uVeinFloor, uIsAE, uCellAngular, uCellScale;
uniform sampler2D uCrustTex;       // baked F1/F2-F1 (high, when using the bake path)
varying vec2 vUv;                  // glyph-local UV (static -> bake-able)
${GLSL_NOISE}                      // gw_snoise/gw_fbm/gw_warp/gw_worley
${GW_TEMPERATURE}                  // gw_tempColor/gw_forge/gwCool/gw_divineFire
${GW_CRUST}                        // gw_fractureProgress/gw_crust (4.4)
```

**COLOR, after doc-02's cooled-letter metal is computed, before `#include <tonemapping_fragment>`:**
```glsl
#ifdef GW_CRUST_ON                                   // HIGH-tier only; absent -> crust=0 fallback
  // crust field: one fetch (baked) OR the live 3x3 search.
  #ifdef GW_CRUST_BAKED
    vec2 crustField = texture2D(uCrustTex, vUv).xy;          // R=F1, G=F2-F1 — ONE fetch
  #else
    vec2 w = gw_worley(vUv * uCellScale, uCellAngular);
    vec2 crustField = vec2(w.x, clamp(w.y - w.x, 0.0, 1.0)); // live search (drifting-cell chambers)
  #endif
  float crack, plate;
  vec3 crustCol = gw_crust(crustField, temp, uIsAE, crack, plate);
  // blend the crust over the cooled metal as the letter solidifies (frac inside gw_crust gates it)
  gl_FragColor.rgb = mix(gl_FragColor.rgb, crustCol, max(crack, plate));
#endif
```

**NORMAL, after `#include <normal_fragment_maps>`** — couple plate/crack into relief so the cool env key
catches forged scale (plates raised, cracks creased inward):
```glsl
#ifdef GW_CRUST_ON
  float relief = (plate * 0.5) - (crack * 0.6);
  vec3  bmp    = vec3(dFdx(relief), dFdy(relief), 0.0);
  normal = normalize(normal - bmp * 1.5);
  roughnessFactor = clamp(roughnessFactor + plate * 0.30 - crack * 0.10, 0.04, 1.0); // matte plates
#endif
```

### 4.6 The r3f component shape (extends doc 02's `PourWordmark.jsx`)
```jsx
export default function CrustLayer({ quality, isAE = 0, material }) {
  // bake ONCE on high; nothing on low/static (crust=0 fallback)
  const crustTex = useMemo(() => {
    if (quality !== 'high') return null;
    return bakeCrust(gl, 512, 128, 9.0, 0.5);          // R=F1, G=F2-F1
  }, [quality]);

  useEffect(() => () => { crustTex?.dispose(); }, [crustTex]);   // non-negotiable disposal

  // wired in the letter material's onBeforeCompile:
  //   if (quality === 'high') { defines.GW_CRUST_ON = ''; defines.GW_CRUST_BAKED = ''; }
  //   else  { /* no define -> the whole crust block is compiled OUT -> crust=0 */ }
  //   sh.uniforms.uCrustTex   = { value: crustTex };
  //   sh.uniforms.uVeinFloor  = { value: 0.10 };
  //   sh.uniforms.uCellAngular= { value: 0.5 };  // Chebyshev blend -> forged plates
  //   sh.uniforms.uCellScale  = { value: 9.0 };
  //   Object.assign(sh.uniforms, U);             // bind the SHARED master pool by reference
  return null;
}
```

`temp` is *not* a private uniform here — it is the same `temp` doc 02 already computes per-fragment from
`gwCool(age, k)` (driven by the shared `uPourFront`/`uTime` in the master `U` pool). The crust reads it; it
does not re-derive it.

### 4.7 Key uniforms / params (leva-tunable behind `?debug`)
| Param | Role | Default | Sweet spot |
|---|---|---|---|
| `uCellScale` | nucleation density (cells across the wordmark) | 9.0 | 6–12 (denser = finer forged scale) |
| `uCellAngular` | Euclidean↔Chebyshev cell shape | 0.5 | **0.4–0.7** (angular forged plates) |
| `gw_fractureProgress` solidus | temp at which cracks start opening | 0.42 | 0.38–0.46 (below the forge-red band) |
| `crackW` `0.02→0.10` | crack width range as cooling completes | — | wider = more spalled/brittle |
| `uVeinFloor` | min ember glow in crack roots (never black) | 0.10 | 0.08–0.18 |
| `uIsAE` | divine-fire glyph flag (baked data) | 0 / 1 | never a string match |
| bake size | crust texture resolution | 512×128 | match wordmark UV footprint |

### 4.8 Hooking the shared master temperature system
`gw_crust` **never invents heat.** Its growth driver `temp` is the doc-02 cooling output `gwCool(age, k)`,
itself driven by the shared `uPourFront`/`uTime` from the master `U` pool — so the crack network *propagates
in lockstep with the letter's color cooling*. The crack roots glow `gw_forge(temp + Δ)` — the same HDR ramp
as every other emissive surface, so a crack root and a slab vein are *visibly the same metal*. The A/E clamp
is the same `uIsAE → gw_divineFire` path used everywhere. Because the function is pure (`crustField`, `temp`,
`isAE` → `vec3`), it ports to a TSL `Fn()` 1:1 (§2.H), with the crack roots written to an MRT `emissive`
attachment for exact bloom selection in the post-judge WebGPU build.

---

## 5. COHESION

- **One temperature, one ramp.** Every emissive value in `gw_crust` is `gw_forge(temp)` / `gw_divineFire`
  from the master temperature module. The crust adds *where the metal cracks and where it glows*, never *what
  color* — the iron-black plates are `gw_forge` at low `temp`, the ember roots are `gw_forge` at boosted
  `temp`, and a crack root is byte-identical to a slab vein at the same heat (`00-COHESION-MAP §1, §7.1`).
- **One noise basis.** The crack network is `gw_worley` from `shaders.js` — the *same* primitive doc 05's
  molten skin uses, the *same* one the cohesion map budgeted as "high-tier only." Baked or live, it is the
  one cellular function; there is no second noise (`§7.2`). "More detail" = a denser `uCellScale`, never a
  fork.
- **One palette, the bloom selector.** Iron-black oxide plates use `PAL.void` value-range (≤1, never bloom)
  — placing them in the *same dark band as the green-black basalt*, so a fully-cooled letter's crust reads
  continuous with the stone it sits in (the F-cluster bridge to B-cluster). Only the ember crack-roots push
  `gw_forge(temp + 0.45)` > 1 and bloom — the network *glows along its cracks* while the plates stay matte
  and dark. The palette *is* the bloom selector (`§3.1`).
- **The crust is the basalt's cousin and the molten skin's grandchild.** Same `gw_worley` cells as doc 05's
  hot molten membrane, but at the *cold* end of the timeline: the molten skin tears and re-melts (hot,
  hysteretic), the cooled crust cracks permanently (cold, monotonic). They are one substance at two points
  on one timeline — the cohesion payoff of putting both in the noise-shared cluster.
- **Lit only by the metal.** The oxide plates are *lit* (PBR, reflect the cool procedural env key via the
  relief normal); the ember crack-roots are *emissive light sources*. Cooling *is* the transition from light
  source to lit object; the crust is the final lit state, with the last embers still glowing in the cracks.
- **One clock, one strike.** A `forge.strikeAt` pulse surges `uTemp` → raises `temp` → `gw_fractureProgress`
  *retreats* (the cracks momentarily glow brighter and the network reads "re-heated") in the same frame as
  the slab veins and sparks (`§7.6`) — the cohesion proof. (A *true* re-melt that heals cracks is the §2.G
  candidate; the analytic version brightens but does not heal, which is correct for a brief strike.)
- **The A/E keystone, identical everywhere.** `uIsAE` zeroes crack+plate and mixes in `gw_divineFire`. The
  same two glyphs that ignite in the DOM wordmark refuse to crack in the metal — the divine fire has no
  crust because it never cools (`§1.4`, `§7.5`).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The wordmark is a fraction of screen, but the crust is *per filled pixel* of the letter and the 3×3 live
search is the most expensive primitive in the toolkit — so the cost discipline is the whole point of this
deep-dive (`00-COHESION-MAP §10`, "fill-rate is the enemy").

- **The baked-vs-live decision, settled.** On a **fixed** wordmark the cell layout never changes, so **bake
  the network once** (`bakeCrust`, §4.3): per-fragment cost = **one `texture2D` fetch + a few ALU** for the
  growth, versus the **9-iteration 3×3 loop** of the live search. The 2026 utsubo tips ("bake what you can")
  and Heckel 2025 (compute-to-texture) both point here. The *one caveat* the 2026 tips flag — a dependent
  texture read isn't free, and on a *tiny* on-screen letter the live 9-tap may already be cheap enough that
  the texture binding isn't worth it. **Decision rule:** ship **baked** on `high` for the close
  altar/casting chambers (large on-screen letters, the fetch wins decisively); allow the **live search** only
  in a chamber that genuinely needs *drifting* cells (none currently — the wordmark is static), and **never
  ship either on `low`/`static`**.
- **`crust = 0` on `low` and `static` — the hard fallback.** The entire `gw_crust` block is behind
  `#define GW_CRUST_ON`; on `low`/`static` the define is **absent**, so the block (and the `gw_worley`
  function it would call) **never compiles into the shader** — zero cost, materially smaller shader. The
  letter falls back to doc-02's smooth cooled `gw_forge(temp)` with floored ember veins: still on-brand
  cooled iron, just without the forged-scale fracture. This is the brief's `crust=0 fallback on low` and the
  `§7.9` "degrade uniformly" rule — the crust is *removed*, never *recolored* or *half-broken*.
- **Bake once, never per-frame.** `bakeCrust` runs a single fullscreen pass at boot on `high`; the texture
  is static thereafter (it holds *no* time — growth is live and analytic). Dispose it on unmount
  (`renderer.info.memory.textures` must stay flat across navigation).
- **`#pragma unroll_loop_start/end`** on the live 3×3 search (utsubo 2026) so it unrolls to 9 straight-line
  evaluations with no runtime branch; the metric blend is branchless (`mix`), the fracture gates are
  `smoothstep`, no `if` in the hot path.
- **One field feeds three terms.** F1→plates, F2−F1→cracks *and* ember roots all come from the *single*
  baked fetch (or single `gw_worley` call). Never sample twice.
- **Varyings under budget.** The crust adds only `vUv` (already present for the letter) — no new varyings
  (utsubo 2026: keep varyings < 3, pack into vec4).
- **Bloom stays surgical.** Only the ember crack-roots exceed 1.0; the oxide plates sit in the void band.
  Bloom catches the glowing cracks, ignores the matte plates — no washout, no bloom-intensity compensation
  (`post-fx` rule).
- **Tier ladder (uniform degrade):**
  - **`high`** — baked F1/F2−F1 fetch (or live search in a drifting-cell chamber), front-driven crack
    growth, ember roots, plate/crack relief, Chebyshev-blend cells, DPR capped 1.5.
  - **`low`** — **`crust = 0`** (no Worley, no fetch); doc-02 smooth cooled metal + floored ember veins.
  - **`static`** — **`crust = 0`**, `uTime=2`, `frameloop='demand'`; the letter is the dignified fully-cooled
    iron-black end-state with lit A/E. No fracture detail, no broken fallback.
- **Verify path.** `npm run build` green → `qa-route` 393×852 + 1440×900, **0 console errors** (SwiftShader
  compiles the GLSL; a Worley typo or an `#ifdef` mismatch surfaces as an error) → **then the iPhone 15 OLED
  read** (the crack network, the ember-root bloom, the matte-plate true-black, and the live front-driven
  growth do *not* simulate headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**The failure modes are: a crack network that appears *all at once* (no front-driven growth, reads as a
static texture map); cracks that *boil/flicker* (live noise without baking or without the monotonic growth
gate); a `low` tier that tries to keep a half-crust (must be `crust=0`); and the A/E cracking (brand
violation).** Avoid them in this exact order:

1. **Static network FIRST, baked, no growth.** Bake `F1`/`F2−F1` and composite the crust at full strength
   (`frac = 1`) over a fully-cooled letter. Confirm the *network looks nucleated, not gridded* — hash `ip+g`
   (never `fp`), and verify F1 plates + F2−F1 cracks render before any animation. A gridded result is the
   off-by-one neighbor bug (`00-COHESION-MAP §2`).
2. **Get the master ramp through the crust.** The crust only *shapes and masks* `gw_forge`; verify the
   iron-black plate + glowing ember-root climb reads correctly through the bloom on the OLED. Color cohesion
   is harder to retrofit than the crack geometry.
3. **Wire front-driven growth and watch cracks PROPAGATE.** Connect `gw_fractureProgress(temp, …)` to the
   shared cooling `temp`; scrub the pour front and confirm the cracks *open behind the cooling front* and
   are *absent on freshly-poured hot metal*. If the whole network appears instantly, your `frac` is reading
   the wrong sign of `temp` (remember: this doc's `temp` is `1=hot`).
4. **Stamp the A/E and confirm NO crust.** `uIsAE=1` must zero crack+plate and hold `gw_divineFire`. Catch
   this before the crust hides the bug — a divine letter with a fracture network is a brand violation.
   Confirm it is the *first* A and *first* E only.
5. **Add the ember roots and the floor.** Verify the crack roots glow `gw_forge(temp+Δ)` > 1 and **bloom**,
   and that `uVeinFloor` keeps the deepest seams lit even on the coldest metal (never black — "metal is
   alive").
6. **Add relief LAST.** Couple plate/crack into the normal so the cool env key catches forged scale. Verify
   the plates read *raised* and the cracks read *creased*, not painted-on.
7. **Tier-gate and prove `crust=0`.** Flip to `low`/`static` and confirm the `gw_crust` block compiles *out*
   entirely (shader smaller, no `gw_worley`), the letter falls back to doc-02 smooth cooled metal, and there
   are 0 console errors from the `#ifdef` path.

**Specific pitfalls (each has bitten this class of effect):**
- **Worley seam/grid artifacts** — hash `ip+g`, never `fp`; the 3×3 search must wrap the cell hash
  consistently (`00-COHESION-MAP §2`).
- **"Static texture map" read** — if the network appears fully formed from the first frame, growth isn't
  wired to the cooling front. The whole point of this system over a baked decal is that the fracture
  *propagates* with `temp`.
- **Crack flicker** — a *live* `gw_worley` whose cells drift can boil per-frame; on the fixed wordmark,
  **bake** (cells frozen in UV space) and animate only the growth — stable by construction.
- **Cracks that don't bloom** — if the ember-root heat stays ≤1, the crack reads as a dark line, not a
  glowing seam. Push `gw_forge(temp + 0.45)` so the root exceeds 1.0 (mirrors doc 05's tear pitfall).
- **A half-crust on `low`** — do **not** try to keep a cheaper crust on low. The brief and the cohesion rule
  are explicit: `crust = 0`, the whole block compiled out. A degraded crust looks broken; an absent crust
  looks like cooled iron.
- **Plateau/plate banding on OLED** — a too-hard plate `smoothstep` bands on true-black; lean on the
  grain-as-dither (`§3.3`) and verify on device, not headless.
- **Namespace collisions** — `gw_crust`, `gw_fractureProgress`, `gw_worley` all `gw_`-prefixed; a bare
  `worley`/`crust`/`fracture` could collide with a future three chunk.
- **Bake texture leak** — `crustTex.dispose()` on unmount; `renderer.info.memory.textures` must be flat
  across navigation.

**Order of operations summary:** *bake static network → ramp-through-crust verify → wire front-driven growth
→ A/E zero-out → ember roots + floor → relief coupling → tier-gate to `crust=0` + OLED read.*

---

## 8. SOURCES (2025–2026)

1. Dan Greenheck — **10 Noise Functions for Three.js TSL Shaders**, Three.js Roadmap, **2025-12-08**.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders — Worley/cellular with
   TSL+GLSL parity, the 3×3 neighbor search, **F1 cells vs F2−F1 cracks**, FBM-Worley lacunarity/gain,
   domain warp for lava/marble. The canonical 2025 Worley reference for `gw_worley` and the F2−F1 crack
   channel.
2. Sangil Lee — **Understanding the Variations of Cellular Noise**, **2025-04-18**.
   https://sangillee.com/2025-04-18-cellular-noises/ — the F1 / F2 / F2−F1 catalog and the **distance-metric
   choice** (Euclidean = rounded cells, Manhattan/Chebyshev = jagged/angular forged cells), the cellular-
   border crack technique. The basis for the `uCellAngular` Euclidean↔Chebyshev blend.
3. AllTouchDesigner / Lake Heckaman — **GLSL for POPs in TouchDesigner: Lesson 7 (GLSL Advanced POP —
   Voronoi Fracture pt. 2)**, **2025-12-05**.
   https://alltd.org/glsl-for-pops-in-touchdesigner-lesson-7-glsl-advanced-pop-voronoi-fracture-pt-2/ —
   extracting exact crack lines, **2-point edges and 3-point junctions** from `f_dist`, GPU-side boundary
   intersection. The reference for *true vector cracks* — and why the fragment-space F2−F1 band is the
   on-budget choice for the hero (the vector path is the §9 "shatter" candidate).
4. Maxime Heckel — **Field Guide to TSL and WebGPU**, **2025-10-14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — `Fn()` reuse, **compute passes
   writing to storage textures** (the modern bake path), compute state textures (the §2.G ping-pong fracture
   candidate), WGSL/GLSL dual-lowering, iOS WebGPU caveats. The basis for the bake-once strategy and the
   TSL-portability of `gw_crust`.
5. utsubo — **100 Three.js Tips That Actually Improve Performance (2026)**, **2026**.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips — "**bake what you can**," branchless
   `mix(...,step())` over `if`, `#pragma unroll_loop_start/end` for fixed loops, keep varyings < 3 and pack
   into vec4, reduce fBM octaves by viewport, profile with `renderer.info`. The mobile-cost authority for the
   baked-vs-live decision, the unrolled 3×3, and the varying budget.
6. Codrops — **WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL**,
   **2026-01-28**.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
   — noise-driven TSL mask + **MRT + selective bloom on text**; the model for writing the crack-root emissive
   to an MRT attachment in the WebGPU port (§2.H), and per-letter offset attributes for the A/E flag.
7. Codrops — **More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say**,
   **2026-04-28**. https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
   — a production scroll-driven Three.js world with a **ground-cracking-open / fractured-lava** beat
   (fracture pattern authored to read from multiple camera angles, mesh collapsing on cue). The modern
   reference for cracks-as-narrative-beat in a scroll-driven r3f world.
8. Rong & Tan / GPU JFA, as surveyed in **2025** (Grokipedia/Wikipedia "Jump flooding algorithm,"
   continued-use + dynamic-seed variants for real-time moving seeds).
   https://grokipedia.com/page/Jump_flooding_algorithm — the GPU Voronoi/distance-field builder; the basis
   for the §2.D/§9 live-impact-crack candidate (rejected for the fixed wordmark, kept for moving seeds).
9. Nature *Scientific Reports* — **Novel method for predicting the cracks of oxide scales during high-
   temperature oxidation of metals and alloys using machine learning**, **2025**.
   https://www.nature.com/articles/s41598-025-91449-3 — the physical mechanism we dramatize: oxide-scale
   cracking is **stress-driven by thermal-expansion mismatch, nucleates at discrete points, and propagates
   as the temperature gradient sweeps** — i.e. a Voronoi process animated by the cooling front. The
   real-world justification for the nucleation + front-driven-growth model.
10. Springer *J. Materials Eng. & Performance* — **Thermophysical Properties of Oxide Scale on Carbon Steel
    in an Industrial Reheating Furnace**, **2025**. https://link.springer.com/article/10.1007/s11665-025-12806-x
    — the FeO/Fe₃O₄/Fe₂O₃ layered scale, thermal-expansion-coefficient mismatch with the substrate over
    27–1000 °C; grounds the iron-black oxide value-range and the layered-crust intuition.

---

## 9. DEEP-DIVE CANDIDATES (Phase-3)

1. **Live-impact crack nucleation via JFA (the strike-shatter chamber).** Use a Jump-Flood pass to build a
   live distance field from a *moving impact seed* (a strike on the forge), so cracks nucleate and radiate
   from where the hammer lands rather than from a fixed baked layout. Scope: the JFA `O(log n)` pass count
   on iPhone-15, dynamic-seed encoding, and whether it gates cleanly to `high` + a single marquee chamber.
   (Rong/Tan JFA, the 2025 dynamic-seed variants.)
2. **Ping-pong GPGPU fracture state with re-melt healing (high-tier, strike-coupled).** Replace the analytic
   monotonic growth with a real fracture-state texture that *remembers* which cracks opened and lets a strike
   pulse *heal/re-melt* them (cracks close, then re-open as the metal re-cools) — genuine hysteresis. Scope:
   one extra RT on iPhone-15, the ping-pong cost, gated to `high` and the casting-room only. Heckel's 2025
   compute-state-texture work is the start; bridges to doc 05's hysteretic molten skin.
3. **Vector-crack extraction for a "letter shatters" finale.** Promote the fragment-space F2−F1 band to true
   vector crack lines with 3-point junction handling (the Dec-2025 TouchDesigner technique) so a letter can
   *fracture into shards* on a finale beat — crisp, geometric, animatable along the actual crack graph.
   Scope: GPU line-geometry repositioning cost vs the fragment band, and whether it survives the full-frame
   fill budget.
4. **TSL `Fn()` + compute-baked crust + MRT-tagged ember roots (the WebGPU port).** Reimplement `gw_worley`/
   `gw_crust`/`gw_fractureProgress` as reusable TSL `Fn()` nodes; bake the F1/F2−F1 field via a **compute
   pass to a storage texture** (Heckel 2025) and write the glowing crack roots to a dedicated **MRT
   `emissive` attachment** so bloom catches exactly the seams (no luminance false-positives). Gated behind
   the iOS/Safari WebGPU readiness audit; the Gommage 2026 + Heckel 2025 pattern.
