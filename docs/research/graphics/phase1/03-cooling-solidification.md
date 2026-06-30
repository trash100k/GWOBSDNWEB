# 03 — Cooling & Solidification Effects

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED, one WebGL renderer (r3f + three.js)_

---

## 1. SCOPE

In the GAELWORX world, **cooling & solidification is the temporal spine of the entire experience** — it is what turns a static letterform into a forged artifact and what makes the A+E read as sacred. After the molten POUR fills a Cinzel `GAELWORX` letterform left-to-right, each filled region must visibly **freeze through a thermal life**: white-hot at the moment of fill, crawling down through orange → forge-red → iron-black as a **cooling front** sweeps across it, a **scale/crust skinning over** the surface (matte, fractured, basalt-adjacent), **frozen flow ripples** locked into the solidified metal where the pour churned, and **ember veins persisting under a darkening skin** — the deep-glow seams that keep the metal from ever reading as truly dead. Critically, this whole cooling machine runs off **one scalar per fragment: `timeSincePoured`** (seconds since this point of the surface received metal), mapped through a shared temperature curve. The single exception is the **permanent-hot mask**: the first A and first E of the wordmark are stamped `HOT = 1.0` forever, so they never cool — they hold unearthly white-gold DIVINE FIRE and radiate onto the adjacent basalt to make carved OGHAM readable. Cooling is therefore not a one-off effect; it is the master clock that the molten pour, the sparks, the basalt glow, and the post-processing bloom all read from.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every modern approach below has been mapped against our hard constraints: mobile-first, one renderer, no runtime EXR, warm-forge palette, HDR-only-blooms.

### 2.1 Per-fragment temperature mapping from a `timeSincePoured` field (the spine)
The canonical modern pattern: store a **fill/pour timestamp per surface point** and, in the fragment shader, compute `age = uTime - poured` and map it through a temperature curve `T(age)` → emissive color via a blackbody-style ramp. This is the same data structure used in the 2025 dissolve work (a moving threshold compared per-fragment against a noise-perturbed field), repurposed: instead of culling, we _cool_. The `poured` value can be (a) baked into a vertex attribute / texture for letterforms (cheap, deterministic), or (b) written by a small **GPGPU ping-pong "fill texture"** for the live pour front (a compute/FBO pass that floods UV space). Maxime Heckel's Oct 2025 _Field Guide to TSL and WebGPU_ documents exactly this class of compute-driven state texture for particles and instanced data — the same mechanism feeds a fill mask.
**Tradeoffs:** Quality: excellent, fully art-directable curve. Perf: trivial in the fragment stage; the only cost is the optional FBO. Mobile: green. Complexity: low for baked attribute, medium for live GPGPU fill.

### 2.2 Noise-thresholded skinning / crust (dissolve-in-reverse)
The 2025 Codrops dissolve technique (noise field + moving threshold + thin edge band → emissive glow) is the **single most reusable primitive for crust formation**. Run it inverted: as `age` rises, a noise-driven threshold reveals an opaque dark **scale skin** creeping over the bright metal, and the thin transition band is where the molten edge still glows (the "cooling front"). The Jan 2026 Codrops _WebGPU Gommage_ piece extends this to TSL + MRT with selective bloom — directly relevant to making the cooling front bloom while the cold skin does not.
**Tradeoffs:** Quality: very high — fractured crust reads as real basalt scale. Perf: one extra fbm eval; cheap. Mobile: green. Complexity: low (we already ship `gw_fbm`).

### 2.3 Two-layer material: hot substrate + darkening skin with `step`/`smoothstep` blend
Rather than one color, composite a **hot emissive substrate** (the molten body) under a **cold scale layer** (matte, near-black, micro-scratched), with the skin's coverage and opacity driven by `age`. Ember veins are simply the substrate showing through cracks in the skin (crack mask = high-frequency fbm ridges). This mirrors the obsidian slab's existing `body`/`opal` mix pattern in `ObsidianSlab.jsx` — we keep the same compositing grammar.
**Tradeoffs:** Quality: highest fidelity for "ember veins under skin." Perf: cheap (two color computes + a mask). Mobile: green. Complexity: medium.

### 2.4 Frozen flow ripples via locked domain-warp
The molten pour churns using animated domain warping; **at the moment a fragment solidifies, freeze its warp coordinates** by sampling the warp at `t = poured` instead of `t = now`. The ripples that existed at freeze-time become permanent surface relief (perturbed normals via `dFdx/dFdy`, exactly the slab's `NORMAL` block). This is a one-line trick on top of the existing flow field and is the difference between "painted texture" and "this metal remembers how it moved."
**Tradeoffs:** Quality: huge believability win. Perf: free (same noise, frozen phase). Mobile: green. Complexity: low.

### 2.5 TSL / WebGPU node materials (`MeshPhysicalNodeMaterial`, `emissiveNode`)
three.js r184 (2025) ships TSL as first-class; `material.emissiveNode` accepts a node graph, and compute shaders (Heckel 2025) make GPGPU fill fields ergonomic. This is the future-proof path and would let the cooling curve live as a reusable node.
**Tradeoffs:** Quality: equal. Perf: WebGPU faster where available, **but Safari/iOS WebGPU is still the risk surface in 2026** and our entire renderer + `@react-three/postprocessing` chain is WebGL/`onBeforeCompile`-based. Migrating now means rewriting the whole composer. Complexity: high (whole-pipeline). **Verdict: design the math TSL-portable, ship it in GLSL today.**

### 2.6 Full SPH / FEM thermal simulation
Physically-accurate solidification (the arXiv 2024–2025 SPH and laser-melt thermal-gradient papers) models real solidus fronts and columnar grains. **Categorically out** for a mobile real-time hero — these are offline solvers. We borrow only the _vocabulary_ (solidus front, columnar growth direction along the thermal gradient) to art-direct the fake.

### 2.7 Heat-shimmer / cooling-haze as a coupled post pass
Heat distortion over still-hot regions is a screen-space UV-refraction effect (sample scene texture with an fbm/normal offset, masked by `T`). It belongs in a separate research lane (heat shimmer), but cooling **owns the mask that drives it**: shimmer intensity = current temperature. Noted here for cohesion; the shimmer pass reads our `T` buffer.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a GLSL fragment system, injected via `onBeforeCompile` into a `MeshPhysicalMaterial`, that is one master function: `T = temperature(age, poured)` → composited hot-substrate / cold-skin / ember-veins, with a permanent-hot mask override.** Concretely, combine techniques 2.1 + 2.2 + 2.3 + 2.4:

1. **`timeSincePoured` field** (2.1) is the only animated input. For the GAELWORX letterforms it comes from a **per-letter fill progress** (baked UV-x ordering + a `uFillFront` uniform advancing left-to-right) so we don't need a live FBO on mobile; the live churn in the channels can use a cheap fill where budget allows.
2. **Temperature curve** maps `age` → a warm ramp built _entirely from `PAL`_ (white-hot `PAL.hot` → `PAL.ember` → `PAL.red` → `PAL.crimson` → near-`PAL.void`), keeping HDR>1 only at the white-hot/ember end so **only the still-hot metal blooms** (post-fx rule).
3. **Crust skin** (2.2/2.3): a noise-thresholded matte layer creeps in as `age` rises; the thin band is the glowing cooling front.
4. **Ember veins** (2.3): high-frequency fbm ridges crack the skin; substrate glows through, decaying with `age` but **never to zero** (a floor keeps deep-ember seams alive — the brand's "metal is alive" law).
5. **Frozen ripples** (2.4): warp phase locked at `poured`, fed into the slab's existing `dFdx/dFdy` normal-perturb.
6. **Permanent-hot mask**: a `uHotMask` (per-letter, A+E = 1) clamps `age→0` and biases the curve to white-gold, plus boosts emissive so the A+E radiate.

This is the right pick because it is **buildable in THIS codebase tonight** (it is the slab's exact injection grammar + the shared `gw_fbm`), it is **mobile-cheap** (all fragment-stage, no second canvas, no FBO required for the hero), it **shares the master temperature scalar** that the pour, sparks, basalt glow, and bloom all key off — so nothing is bolted on — and it keeps **TSL portability** as a clean follow-up (the curve is a pure function).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` (current repo r17x line; keep the WebGL renderer — do **not** switch to WebGPURenderer for this).
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (unchanged — bloom already gates HDR).
- `leva` for `?debug` live tuning (existing).
- Reuse `GLSL_NOISE` (`src/scene/shaders.js`) and `PAL`/`v3` (`src/scene/palette.js`). **No new deps.**

### 4.2 The shared temperature module (new: `src/scene/cooling.js`)
Export a GLSL string so every material (letterforms, channels, basalt-glow receiver) imports the **same** curve — this is the cohesion linchpin.

```glsl
// src/scene/cooling.js  → export const GLSL_COOLING = `…`
// Requires GLSL_NOISE (gw_fbm) already injected, and PAL colors inlined by caller.

// age: seconds since this fragment received metal (>=0). hot: permanent-hot mask 0..1.
// returns vec3 emissive + writes a temperature scalar via out param.
float gwCool01(float age, float uCoolRate){
  // normalized 0(hot)..1(cold); ease so the hot phase lingers then drops fast.
  float x = clamp(age * uCoolRate, 0.0, 1.0);
  return pow(x, 0.7);                 // T: 0=white-hot … 1=iron-black
}

vec3 gwTempRamp(float T){
  // PAL-only blackbody-style ramp; HDR (>1) reserved for the hot end so only it blooms.
  vec3 c = mix(WHITEHOT, EMBER, smoothstep(0.0, 0.30, T));   // WHITEHOT = PAL.hot (HDR)
  c = mix(c, RED,        smoothstep(0.25, 0.55, T));         // EMBER = PAL.ember
  c = mix(c, CRIMSON,    smoothstep(0.50, 0.80, T));         // RED = PAL.red
  c = mix(c, IRON,       smoothstep(0.75, 1.0,  T));         // IRON ≈ PAL.void
  return c;
}
```

### 4.3 The cooling fragment block (injected like the slab's `COLOR`)
```glsl
// HEAD additions
uniform float uTime, uCoolRate, uFillFront, uVeinFloor;
uniform float uHotBoost;          // A+E radiance multiplier

// per-fragment age. For letterforms: fill advances along UV.x.
// poured = the uTime at which uFillFront passed this fragment (approx from front pos).
float gwFillEdge = smoothstep(vUv.x - 0.04, vUv.x, uFillFront); // 1 once filled
float age = max((uFillFront - vUv.x), 0.0) * uFillSpan;          // seconds since fill

// PERMANENT-HOT override (A+E):  age forced to 0, white-gold biased.
age = mix(age, 0.0, uHotMask);

float T = gwCool01(age, uCoolRate);

// ---- substrate (molten body) ----
vec3 substrate = gwTempRamp(T);

// ---- frozen flow ripples: warp phase LOCKED at poured time ----
float poured = uTime - age;                      // the instant this froze
vec2  warp   = vec2(gw_fbm(vUv*3.0 + poured*0.0  + 11.0),  // phase frozen → static relief
                    gw_fbm(vUv*3.0 + poured*0.0  + 27.0));
// (molten regions, T~0, use uTime instead of poured to keep churning — see §5)

// ---- cold scale skin (dissolve-in-reverse) ----
float crustN = gw_fbm(vUv * 6.0 + warp);
float skin   = smoothstep(0.35, 0.75, T) * step(crustN, T*1.3); // creeps in as it cools
vec3  scale  = SCALE_DARK * (0.9 + 0.1*crustN);                 // matte basalt-ish

// ---- ember veins under the skin (cracks) ----
float crack  = pow(clamp(1.0 - abs(gw_fbm(vUv*9.0 + warp*1.5)), 0.0, 1.0), 7.0);
float vein   = max(crack * (1.0 - T), uVeinFloor*crack);        // never fully dies
vec3  ember  = mix(RED, EMBER, crack) * vein;

// ---- composite ----
vec3 metal = mix(substrate, scale, skin);        // skin darkens the surface
metal += ember * (1.0 - skin*0.6);               // veins glow through cracks
// A+E divine fire: stay white-gold + radiate
metal = mix(metal, WHITEGOLD * uHotBoost, uHotMask);

vec3 fire = metal * gwFillEdge;                  // unfilled = void
gl_FragColor.rgb += fire;
```

### 4.4 r3f component shape (`src/scene/ForgeLetter.jsx`, gated per route)
Mirror `ObsidianSlab.jsx` exactly:
```jsx
const uniforms = useMemo(() => ({
  uTime:{value:0}, uCoolRate:{value:0.18}, uFillFront:{value:0},
  uFillSpan:{value:6.0}, uVeinFloor:{value:0.12}, uHotMask:{value:0}, uHotBoost:{value:2.4},
}), [])
// material = MeshPhysicalMaterial + onBeforeCompile injecting GLSL_NOISE + GLSL_COOLING
// per-letter mesh sets uHotMask = (isFirstA || isFirstE) ? 1 : 0
useFrame((s,dt)=>{
  uniforms.uTime.value = forge.quality==='static' ? 2 : s.clock.elapsedTime
  const target = forge.ready ? range(forge.scrollDamped,0,0.6) : 0   // pour follows scroll
  uniforms.uFillFront.value = damp(uniforms.uFillFront.value, target, 3, dt)
})
useEffect(()=>()=>material.dispose(),[material])
```

### 4.5 Key uniforms & parameters
| Uniform | Meaning | Default | Range |
|---|---|---|---|
| `uFillFront` | pour position 0..1 (drives `age`) | 0 | 0–1, damped |
| `uFillSpan` | seconds the full fill represents | 6.0 | 2–12 |
| `uCoolRate` | how fast metal cools (1/sec) | 0.18 | 0.05–0.5 |
| `uVeinFloor` | minimum ember-vein glow (never dies) | 0.12 | 0–0.3 |
| `uHotMask` | per-letter A+E flag | 0 / 1 | 0 or 1 |
| `uHotBoost` | A+E radiance (HDR, blooms) | 2.4 | 1.5–3.5 |

### 4.6 Hook into the master temperature system
`uTime`, `uFillFront`, and the per-route preset all come from `forge.*` (`src/store.js`) read in `useFrame`, **dt-damped** (never `lerp(a,b,k)`), identical to the slab. The single scalar `T` is exported (write it to a varying or a tiny MRT target later) so the sparks, basalt glow, and shimmer read the **same temperature**. Freeze `uTime` on `quality==='static'`.

---

## 5. COHESION

- **Palette:** the temperature ramp is built **only** from `PAL` (`PAL.hot`, `PAL.ember`, `PAL.red`, `PAL.crimson`, `PAL.void`) via `v3()` inlining — the exact tokens the obsidian slab uses, so the cooling metal and the fire-opal veins are visibly the same fire. HDR (>1) lives only at the white-hot/ember end → **only still-hot metal and the A+E blooms** (post-fx's "only HDR blooms" law), and the cold scale skin sits below 1 so it stays a true dark on the OLED.
- **Lighting:** same `<Lightformer>` env + neutral-cool key as `ForgeCanvas.jsx`; the cold skin is lit PBR (it reflects the cool key like the slab), the hot metal is self-emissive — so cooling _is_ the transition from "lit object" to "light source," which is the whole forge.
- **Shared `age`/`T`:** the molten pour, the **sparks orbiting the pour front** (the front = where `T≈0`, the hottest band — sparks spawn there), the **basalt glow** (the A+E's `WHITEGOLD * uHotBoost` is the same value that lights adjacent OGHAM), and the **heat shimmer** (intensity = `1 - T`) all read the same temperature. Nothing computes its own heat.
- **Frozen ripples vs. live churn:** molten regions (`T` near 0) keep `uTime` in their warp so they churn; solidified regions swap to `poured` phase so they lock — one branch, one material, continuous.
- **A+E law:** the permanent-hot mask is the 3D embodiment of the brand's `.forge-letter` ignite — the same A+E that glow in the DOM wordmark glow in the metal, forever.
- **Brutalism:** the DOM chrome stays 0px/hard-bordered; the cooling is purely in the WebGL layer, so no conflict with the Iron Grid.

---

## 6. MOBILE & PERFORMANCE

Target: iPhone 15 OLED, one renderer, the existing `high|low|static` tiers (`useQuality`).
- **Fragment cost:** ~4 `gw_fbm` calls (3-octave each) per letter pixel. Letters cover a fraction of screen, not the full slab — well inside budget. **Low tier:** drop the crack/vein fbm to 2 calls and skip the frozen-ripple normal perturb; **static:** freeze `uTime` (curve still resolves from `uFillFront`), no churn, no shimmer.
- **No FBO on the hero:** `age` is derived analytically from `uFillFront` + UV — **zero render targets**, so we don't pay a ping-pong pass on mobile. The live GPGPU fill (technique 2.1b) is **high-tier-only** and optional.
- **DPR / frameloop:** inherit `ForgeCanvas` (`dpr` per tier, `frameloop='demand'` on static). The cooling animation is `uFillFront`-driven, so on `static`/reduced-motion it presents a **fully-solidified, correct end-state** (everything cold except the eternal A+E) with no animation — the mandatory reduced-motion path.
- **Bloom budget:** because only `T<~0.25` and the A+E exceed 1.0, bloom catches a small bright fraction; the cold skin and deep veins never bloom → **no washout**, no extra bloom intensity needed (keep `luminanceThreshold=0.55`).
- **Fallback poster:** `CanvasBoundary` already posters on WebGL failure; the static poster should depict the cooled end-state with lit A+E so the brand reads with zero GL.
- **Dispose:** `useEffect(()=>()=>material.dispose(),[material])` — non-negotiable per `forge-scene`.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder):**
1. **Curve first, in isolation.** Build `gwCool01` + `gwTempRamp` and drive it with a single leva slider standing in for `age`. Get the white-hot→iron-black ramp reading like real cooling metal **before** adding any skin/veins. If the ramp is wrong, everything downstream is wrong.
2. **Add the fill front.** Wire `uFillFront` to scroll; confirm left-to-right fill and that `age` increases correctly behind the front.
3. **Add the permanent-hot mask early.** Stamp A+E = 1 and verify they stay white-gold while neighbors cool — this is the brand-critical beat; catch masking bugs before they hide under skin.
4. **Then skin, then veins, then frozen ripples** — in that order, each behind a leva toggle.

**Pitfalls (each has bitten this kind of effect):**
- **HDR leakage → washout.** If the cold skin or mid-ramp colors exceed 1.0, bloom blooms everything. Keep HDR strictly at the hot end; verify on the OLED, not the headless shot (`post-fx`).
- **`age` discontinuity at the fill edge.** A hard `step` on the fill front pops; use `smoothstep` over a ~0.04 UV band so the cooling front is a band, not a line.
- **Veins dying to black.** Without `uVeinFloor`, fully-cooled metal reads dead — brand violation ("living molten metal"). Floor the vein glow.
- **Frozen ripples that still move.** Forgetting to swap `uTime`→`poured` in the warp makes "solid" metal shimmer — instantly fake. Branch on `T`.
- **Frame-rate-dependent fill.** Driving `uFillFront` with `lerp(a,b,0.1)` makes the pour speed device-dependent. Use `damp(...,λ,dt)` (`store.js`).
- **Per-pixel branches.** Keep the molten-vs-frozen warp switch as a `mix()`/`step()` blend, not an `if`, to stay mobile-friendly (`shader-fx`).
- **GLSL namespace collisions.** Prefix every helper `gw_`/`gw…` (the repo rule) so they don't clash with three's `permute`/`snoise`.
- **Verify path:** `npm run build` green → `qa-route` (SwiftShader compiles GLSL; 0 console errors ≈ shader compiled) at 393×852 + 1440×900 → **then** the iPhone 15 read (bloom spread, true-black, A+E radiance don't simulate headless).

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — _Field Guide to TSL and WebGPU_ (Oct 14, 2025). Compute-driven state textures, fbm domain-warp veins, node materials. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
2. Codrops — _Implementing a Dissolve Effect with Shaders and Particles in Three.js_ (Feb 17, 2025). Noise + moving threshold + thin emissive edge band + selective Unreal bloom — the crust/cooling-front primitive. https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/
3. Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_ (Jan 28, 2026). Noise-driven TSL mask + MRT + selective bloom on text — directly maps to letterform cooling fronts. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
4. Codrops — _WebGL Shader Techniques for Dynamic Image Transitions_ (Jan 22, 2025). Threshold/progress-mask transition grammar (the same `step`+edge-width approach reused for the cooling front). https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/
5. mrdoob/three.js — _Release r184_ + TSL docs (2025). `MeshPhysicalNodeMaterial`, `emissiveNode` node graphs — the TSL-portability target for the cooling curve. https://github.com/mrdoob/three.js/releases/tag/r184 · https://threejs.org/docs/TSL.html
6. Three.js Roadmap — _10 Noise Functions for Three.js TSL Shaders_ (2025). fbm/ridged-noise recipes for crust crack masks and frozen ripples. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
7. LearnWithHasan — _Three.js Shaders Guide — GLSL, ShaderMaterial & TSL (r184)_ (2025). Confirms the `onBeforeCompile` vs. node-material tradeoff for current builds. https://learnwithhasan.com/threejs-guide/shaders/
8. _Resolving thermal gradients and solidification velocities during laser melting of a refractory alloy_ (arXiv, 2024/2025 update). Vocabulary only: solidus front, thermal-gradient-aligned columnar growth — borrowed to art-direct the fake. https://arxiv.org/pdf/2410.22496

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **The live GPGPU fill field (technique 2.1b).** A ping-pong FBO that floods UV/world space for the channel-hall pour and rejoining interlace, so the front is data-driven (branches, merges) rather than a UV-x ramp. Heckel's 2025 compute material is the starting point; needs a mobile cost study and a high-tier gate.
2. **Shared temperature buffer / MRT export.** Write `T` to a small render target (Gommage 2026 uses MRT) so sparks, basalt glow, and heat shimmer **sample** the exact field instead of recomputing — true single-source-of-truth heat. Study MRT cost on iOS WebGL2.
3. **TSL port of the cooling curve.** Reimplement `gwCool01`/`gwTempRamp`/skin/vein as a reusable TSL node for a future WebGPU renderer, with a WebGL fallback — and the Safari/iOS WebGPU readiness audit that gates it.
4. **Frozen-ripple normal & micro-relief fidelity.** Deeper look at locking domain-warp phase into a normal/height field (and optional clearcoat-roughness modulation) so the solidified scale reads as physically forged relief under the cool key light, not a flat painted texture.
