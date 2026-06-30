# 17 — Volumetric Smoke / Mist / Forge Atmosphere

_Phase 1 graphics research · GAELWORX forge world · target device: iPhone 15 (OLED), one WebGL renderer, strict mobile budget._

---

## 1. SCOPE

In the GAELWORX world this element is **the thick, breathing air of a giant dwarf-forge** — not a weather effect, but the *medium* the entire scene is suspended in. Two jobs: (a) the **void haze** that fills the pure-black negative space so the darkness reads as a cavernous, particulate room rather than a flat empty canvas (you should feel air between the camera and the altar); and (b) **forge smoke** — slow rolling banks of grey-black smoke off the molten pour, lazy rising columns where white-hot metal hits cold basalt, and a low ground-haze pooling in the Celtic-interlace channels. Critically, the atmosphere is **not neutral**: it is *lit by the metal itself*. Smoke near the pour-front and near the A/E divine-fire glows warm (Ember Glow `#E85D04` → Celtic Blood `#C1292E`), absorbs and re-scatters that light, and falls to near-black `#0B0C10` away from any heat source. Heat-shimmer over the hottest letters is the same system at micro-scale. The atmosphere is the connective tissue that makes the forge feel like one airless, sacred, **occupied volume** — the difference between "3D objects on black" and "a place."

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four honest families of technique, and a fifth that's really a hybrid. Ranked roughly by cost.

### A. Analytic / depth-fog (screen-space, ~free)
A full-screen post pass reads the **depth buffer**, reconstructs linear view-Z per pixel, and applies `1 - exp(-density * z)` (Beer–Lambert) tinted by a color ramp. This is what Adam Naili's R3F depth-fog tutorial and the matejlou "Analytic Fog" write-up (Feb 2025) describe — the latter showing you can bound fog to **primitives (sphere/box/plane)** and still solve transmittance analytically (`exp(-density·rayLength)`) without marching, because constant-density volumes have a closed-form integral. three.js ships `FogExp2`/`Fog` but production wants the post-pass for per-zone color and god-ray-immune objects.
- **Quality:** low-to-medium. Gives true depth and tintable haze, but no *shape* — no rolling banks, no wisps. Perfect for **void haze**, weak for **smoke**.
- **Perf:** the cheapest thing that exists. Cost is decoupled from scene complexity (it's screen-space). Mobile-trivial.
- **Complexity:** low. One effect in the existing `@react-three/postprocessing` chain.

### B. Layered fBM "smoke" planes / fake-volumetric sprites (cheap, shapeful)
Camera-facing quads (or a few parallaxed planes) running **fBM noise** in the fragment shader, animated by scrolling the noise domain, with **soft-particle depth fade** so the sprite edges dissolve against geometry instead of cutting hard. The Front-Dev "Sublime Soft Particle Fog" piece and the `digitalstrategyforce` GLSL-atmosphere field-notes (2025) both make the same point: a few noise sprites + additive blending + a depth-softened alpha give a convincing fake-volumetric look "magnitudes quicker than real-time volumetric clouds." The soft-particle trick: fade alpha by `smoothstep` of the depth delta between the sprite and the scene behind it.
- **Quality:** medium — reads as smoke from the front, betrays itself as flat under camera orbit. GAELWORX barely orbits (see `CameraRig.jsx`), so this weakness is largely hidden.
- **Perf:** very cheap if you cap octaves (2–3) and plane count. This is the `Embers.jsx` philosophy extended from points to billboards.
- **Complexity:** low–medium. Reuses our `gw_fbm`.

### C. Bounded raymarched volumetrics (medium, real)
March a ray through a **bounded box/sphere**, sampling a density field (fBM or a 3D noise texture), accumulating transmittance via Beer–Lambert and lighting each step with a **Henyey–Greenstein phase function** + a short secondary march toward the light for self-shadowing. This is the canonical Quílez/Guerrilla recipe, and in 2026 it's packaged: **`CK42BB/procedural-clouds-threejs`** (Feb 2026, MIT) implements exactly Beer–Lambert + Henyey–Greenstein + light-march self-shadowing as a WebGPU path *with explicit WebGL2 billboard/mesh fallbacks*, and **`Ameobea/three-volumetric-pass`** wraps screen-space raymarched volumetrics as a pmndrs-`postprocessing` pass with a `halfRes: true` option. Heckel's own raymarching foundations feed this.
- **Quality:** high — real shape, real density, real light absorption. This is the only family that gives you *volumetric god-rays through smoke*.
- **Perf:** the expensive one. The Guerrilla/Horizon optimisation table (still the reference everyone cites) is brutally clear: full-res 128-step = ~298ms; **half-res 8-step + jitter + TAA = ~7.5ms**; quarter-res 8-step = ~2.4ms. Mobile *requires* half/quarter-res + low step count + blue-noise jitter, and even then it's the budget hog.
- **Complexity:** high. Coordinate-space reconstruction, blue-noise dithering, half-res composite, optional TAA.

### D. Froxel / LUT volumetrics (high quality, desktop-class, WebGPU)
Pre-integrate scattering+transmittance into a **3D frustum-voxel ("froxel") texture** once per frame, then shading is a single texture lookup. This is the Wronski-2014 / Hillaire / *Last of Us Part II* (SIGGRAPH 2020, 64 depth slices) lineage, and in Nov 2025 it landed in WebGPU three.js: the "Volumetric lighting in WebGPU" forum thread (Usnul) reports a froxel solution that **computes in sub-1ms even on 10-year-old hardware** and is "basically free (1 texture lookup)" during shading — but notes denoising and production-hardening are still open, and it's WebGPU-only (compute shaders).
- **Quality:** highest, physically-based (Mie/Rayleigh, multiple scattering, shadowmap visibility).
- **Perf:** astonishingly cheap *at shading time*, but needs WebGPU compute. iOS 26 Safari has WebGPU, but it is **not** a safe baseline for a judged mobile-first build in mid-2026.
- **Complexity:** very high. Froxel grid, compute dispatch, temporal reprojection, denoise. Overkill for this scene.

### E. Hybrid (the real-world 2025 answer)
Nobody ships one technique. The pattern across the 2025 case studies (Codrops "Crafting Nature," the Shader.se WebGPU pipeline, the Dec-2025 "High-Performance Ground Fog" thread) is **cheap base + targeted expensive accent**: depth-fog for the global haze, fBM planes/ground-fog for shaped smoke, and *optionally* a single small raymarched volume only where it earns its cost (the pour-front). The ground-fog thread also surfaces the critical mobile lesson — height-attenuated fog with **early-exit branches** (skip FBM above fog-top / outside radius) is the difference between 60fps and "almost a complete freeze on mobile."

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: a three-tier hybrid — Depth-Fog haze (always) + fBM smoke-banks/ground-haze (high & low) + one optional bounded raymarch accent at the pour-front (high only).** No froxels, no WebGPU dependency, no TAA.

Justification, tied to the world and the hard constraints:

1. **The void demands haze, not clouds.** GAELWORX is "pure-VOID darkness lit ONLY by the metal." The single highest-value, lowest-cost win is family **A**: a depth-fog post pass tinted by the master temperature so the black gains *air* and depth-cueing, and so distant embers/altar recede correctly. This is nearly free and screen-space, so it costs the same whatever chamber is loaded. It slots straight into `Effects.jsx`.

2. **Smoke needs shape, but the camera barely moves.** `CameraRig.jsx` is a gentle cursor-parallax + tiny dolly — it never orbits hard. That kills the only real weakness of family **B** (flatness under rotation). So a handful of **fBM smoke-bank planes** + a **ground-haze plane** pooling in the channels give us rolling, drifting smoke at point-cloud cost. They reuse `gw_fbm` from `shaders.js` exactly like `Embers.jsx` reuses additive points.

3. **One real volume, only where the eye is.** The pour-front (the moving molten-metal head) is the single dramatic focal point. *There only*, on `high` tier, a small **bounded raymarch** (sphere/box around the pour) with Beer–Lambert + Henyey–Greenstein and **ember-tinted absorption** gives genuine light-through-smoke and lets the divine-fire A/E actually shaft light through the haze. Bounded + low-step + blue-noise-jittered + half-res keeps it inside budget per the Guerrilla table.

4. **It must not be WebGPU-gated.** The judge device + "one WebGL renderer" + the repo's no-EXR/no-suspend scars mean WebGPU froxels (family D) are off the table for Phase 1. Everything here is WebGL2 GLSL injected the way `ObsidianSlab.jsx` already does it.

5. **It must share the master temperature.** Every tier reads the same `uTemp`/scroll-energy signal the slab already uses (`forge.scrollDamped`, `forge.scrollVel`), so the air *heats with the forge*. That's what makes it cohesive instead of bolted-on.

---

## 4. IMPLEMENTATION

### Libraries / versions
- **No new hard dependency required.** Reuse `three` (r17x, already in repo), `@react-three/fiber`, `@react-three/postprocessing`, `@react-three/drei`, `leva`, `maath`. All present per `fx-resources`.
- **Reference (study, don't necessarily add):** `Ameobea/three-volumetric-pass` (`npm i three-volumetric-pass postprocessing`, supports `halfRes`) and `CK42BB/procedural-clouds-threejs` (MIT, the WebGL2 fallback shaders are directly liftable). Treat these as the shader source-of-truth for the optional raymarch tier; prefer an in-repo hand-rolled pass to keep the bundle and the dispose-lifecycle under our control.

### Tier 1 — Depth-fog haze (a custom Effect in `Effects.jsx`)
A `postprocessing` `Effect` subclass reading `depthBuffer`. Linearize depth, Beer–Lambert, tint by master temp.

```glsl
// fragment of the fog Effect — runs after Bloom is composited
uniform float uDensity;     // base haze density (void)
uniform float uTemp;        // master temperature 0..1 (shared)
uniform vec3  uHazeCold;    // PAL.void  -> near-black
uniform vec3  uHazeHot;     // PAL.ember -> warm, where the forge runs hot
uniform float uTime;

void mainImage(const in vec4 inputColor, const in vec2 uv,
               const in float depth, out vec4 outputColor) {
  // postprocessing gives getViewZ(depth) -> linear, negative view Z
  float z   = -getViewZ(depth);                 // metres from camera
  float fog = 1.0 - exp(-uDensity * z);         // Beer–Lambert
  // gentle vertical + drifting noise break-up so the haze isn't a flat wash
  fog *= 0.85 + 0.15 * sin(uv.y * 6.0 + uTime * 0.2);
  vec3 haze = mix(uHazeCold, uHazeHot, clamp(uTemp, 0.0, 1.0));
  outputColor = vec4(mix(inputColor.rgb, haze, clamp(fog, 0.0, 1.0)), inputColor.a);
}
```
Mount it **after** `Bloom` (so haze sits in front of glow, not bloomed itself) and **before** the grade. Requires `disableNormalPass` stays, but the composer must expose the **depth buffer** — set `EffectComposer`'s `frameBufferType` and ensure the fog Effect declares `EffectAttribute.DEPTH`.

### Tier 2 — fBM smoke-banks + ground-haze (r3f component, `high`+`low`)
Same shape as `Embers.jsx`: a small set of camera-facing planes with an additive-ish (here, **alpha-over**, depthWrite off) fBM material. Reuse `GLSL_NOISE`.

```jsx
// SmokeBanks.jsx — gated by quality !== 'static', reuses gw_fbm + PAL
const SMOKE_FRAG = /* glsl */ `
  ${GLSL_NOISE}
  uniform float uTime, uTemp, uOpacity;
  varying vec2 vUv;
  void main(){
    // two-octave drift; cheap on mobile (matches the 2-octave mobile guidance)
    float n = gw_fbm(vUv * 2.2 + vec2(uTime * 0.04, -uTime * 0.025));
    n = smoothstep(0.15, 0.95, n * 0.5 + 0.5);
    // soft edge so the bank dissolves toward the plane border
    float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.6, vUv.y)
               * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    float a = n * edge * uOpacity;
    // grey-black body, warmed toward ember where the forge is hot
    vec3 col = mix(${v3(PAL.void)}, ${v3(PAL.ember)}, clamp(uTemp * n, 0.0, 0.6));
    gl_FragColor = vec4(col, a);
  }`;
```
Material: `transparent:true, depthWrite:false, blending: NormalBlending` (smoke *occludes*; additive would only ever brighten and never give a real bank). For the **ground-haze** in the channels, use one large horizontal plane with `uTemp` driven *locally* high where the pour passes (a `uPourX` uniform). Drive `uTime`/`uTemp` in `useFrame`, **dt-damped**, freeze `uTime` on `static` exactly like `Embers.jsx:67`.

### Tier 3 — bounded raymarch at the pour-front (r3f component, `high` only)
A small box/sphere around the pour head; raymarch with blue-noise jitter, Beer–Lambert transmittance, single-lobe Henyey–Greenstein, short secondary light-march toward the divine-fire / pour glow.

```glsl
// core loop — ~16 primary steps, ~4 light steps, half-res target
float hg(float c, float g){ float d = 1.0 + g*g - 2.0*g*c;
  return (1.0 - g*g) / (12.566 * d * sqrt(max(d, 1e-4))); }

vec4 marchSmoke(vec3 ro, vec3 rd, vec3 lightPos, vec3 lightCol){
  float t = tBoxNear + blueNoise(gl_FragCoord.xy) * STEP;  // jitter kills banding
  float T = 1.0;                 // transmittance
  vec3  C = vec3(0.0);           // accumulated colour
  for(int i = 0; i < 16; i++){
    vec3 p = ro + rd * t;
    float d = densityFBM(p);     // gw_fbm-based, clamped
    if(d > 0.01){
      // light march (Beer–Lambert toward the source)
      vec3  lv = normalize(lightPos - p); float ls = 0.0;
      for(int j = 0; j < 4; j++){ ls += densityFBM(p + lv * float(j) * 0.25); }
      float lightT = exp(-ls * SIGMA);
      float phase  = hg(dot(rd, lv), 0.35);
      // EMBER-TINTED absorption: smoke eats blue, lets red/orange through
      vec3 absorb  = exp(-d * SIGMA * vec3(1.0, 1.6, 2.4));
      C += T * d * STEP * lightCol * lightT * phase * absorb;
      T *= exp(-d * SIGMA * STEP);
    }
    t += STEP;
    if(T < 0.02) break;          // early-out
  }
  return vec4(C, 1.0 - T);
}
```
Render this to a **half-resolution** target and composite up (bilinear) — the single biggest mobile lever (Guerrilla table: half-res 8-step ≈ 7.5ms vs full-res 128-step ≈ 298ms). Blue-noise jitter + the early-out are the other two.

### Key uniforms (all tiers)
| Uniform | Source | Meaning |
|---|---|---|
| `uTime` | `state.clock` (frozen on `static`) | drift animation |
| `uTemp` | `Math.min(forge.scrollDamped + vel*0.25, 1)` — *the same expression `ObsidianSlab` uses* | master temperature; warms the haze |
| `uDensity` | leva, per-route via `sceneFor(forge.route)` | haze thickness (thicker in forge-mouth, thinner in jewel-chamber) |
| `uPourX` / `lightPos` | the pour-front animator | where the smoke glows hot |
| `uOpacity` | `damp`-ramped on `forge.ready` | fade-in with the rest of the scene |

### Hook into the master temperature
The cohesion contract: **read, never invent, the temperature signal.** `ObsidianSlab.jsx:159` computes `uTemp = min(scrollDamped + vel*0.25, 1)`. Lift that into a tiny shared selector (or read `forge.scrollDamped`/`forge.scrollVel` directly in each fog `useFrame`) so the air, the veins, and the future pour all heat *together*, damped with `THREE.MathUtils.damp` (`store.js:damp`) — never frame-rate `lerp`.

---

## 5. COHESION

This atmosphere must look like it was *exhaled by the same forge* as the veins, embers, and divine fire. The bindings:

- **Palette.** Every tier mixes between `PAL.void` (`#050507`, the 60% dominant dark) and `PAL.ember`/`PAL.hot` (the 10% HDR accent) — exactly the 60/30/10 in `palette.js`. Cold smoke = void; hot smoke = ember. No grey that isn't a void-tint, no cool/blue cast (brand). The **ember-tinted absorption** (`exp(-d·σ·vec3(1.0,1.6,2.4))`) means the smoke *physically eats the cool end and passes the warm end* — so light through it is always forge-coloured, automatically on-palette.

- **Shared master temperature.** `uTemp` is the *same* value the slab veins run on. Scroll harder → forge runs hotter → veins flare (existing) **and** the haze warms + the smoke banks glow (new), in lockstep. The strike `uSurge` (`ObsidianSlab.jsx:167`) can pulse a puff of smoke at the pour-front using the same `forge.strikeAt` clock so a headline-arrival "clangs" visually through air *and* metal.

- **Shared noise.** All density/drift is `gw_fbm` from `shaders.js` — the identical field that draws the veins and caustics. The smoke literally swirls with the same turbulence grammar as the molten metal, so they read as one material system at different temperatures/phases.

- **Lighting handshake.** The haze's hot tint keys off the same warm-key/ember-rim that the `Lightformer` env and slab emissive use (`ForgeCanvas.jsx`). The optional raymarch's `lightPos` is the **A/E divine-fire** position — so the unearthly white-gold letters genuinely *shaft light through the smoke* and that's what makes the carved Ogham "readable for the first time." Atmosphere becomes the delivery mechanism for the scene's signature story beat.

- **Bloom contract.** Only HDR (>1) pixels bloom (`post-fx` / `Effects.jsx` threshold 0.55). Smoke bodies stay `<1` so they **don't** bloom (smoke shouldn't glow as a sheet) — only the hot pour-front cores pushed `>1` bloom, exactly as the veins do. Mount the haze Effect *after* Bloom so haze isn't itself bloomed.

- **Motion law.** Drift is **Atmospheric Drift** (`motion-feel`): slow constant velocity, dt-driven, parallax for depth — the same law that governs embers and veins. No bounce, no snap on the smoke itself.

---

## 6. MOBILE & PERFORMANCE

The iPhone-15 budget and the repo's three quality tiers (`useQuality` → `high|low|static`) drive a strict ladder:

| Tier | Tier 1 (depth-fog) | Tier 2 (fBM smoke) | Tier 3 (raymarch) |
|---|---|---|---|
| **high** | on | on, 3 octaves, ~3 planes + ground | on, half-res, 16+4 steps, blue-noise, ember absorption |
| **low** | on (1-octave breakup) | on, **2 octaves**, ~2 planes | **off** |
| **static** | on, `uTime` frozen | **off** (or 1 frozen plane) | off |

Rules, drawn from the 2025 mobile case studies:

1. **2 octaves on mobile, not 4.** The `digitalstrategyforce` field-notes and the ground-fog thread both land on this: mobile atmospheric budget ≈ 2ms; drop FBM octaves to 2, cut plane/sprite counts. Our `gw_fbm` is already a 3-octave loop — gate a 2-octave variant for `low`.
2. **Half-resolution is non-negotiable for the raymarch.** Per the Guerrilla table, half-res 8-step+jitter ≈ 7.5ms vs ~298ms full-res. Render Tier 3 to a half-res FBO, bilinear composite. Quarter-res is the fallback if it's still hot.
3. **Blue-noise jitter, not more steps.** A blue-noise dithered start offset lets 8–16 steps look like 64 by trading banding for noise the eye ignores; cheaper than raising step count.
4. **Early-out everywhere.** `if(T < 0.02) break;` in the march; in the ground-fog, **skip FBM where heightAtten==0 / outside fog radius** (the exact fix that took the Dec-2025 ground-fog thread from "mobile freeze" to fine). Depth-fog already early-returns on far-plane pixels.
5. **No new draw context.** Everything is the **one** renderer (`forge-scene` rule). Tier 1 is a post pass (zero extra geometry). Tier 2 reuses the points/planes idiom. Tier 3 is one small mesh + one half-res RT.
6. **Cap DPR.** `ForgeCanvas` already sets per-tier DPR + `AdaptiveDpr`; the fog inherits it. The ground-fog thread's "resolution capped to 1.5 DPR on mobile" matches our `low` cap.
7. **`static`/reduced-motion** gets only the frozen, near-free depth-fog — atmosphere still *present* (so the void isn't flat) but zero per-frame cost, honoring `prefers-reduced-motion` and the `frameloop='demand'` path.
8. **Dispose** every material/geometry/RT on unmount (`ObsidianSlab.jsx:133` pattern). Half-res render targets are the classic leak.

Verify with `qa-route` (SwiftShader compiles the GLSL → 0 console errors ≈ it compiled) at 393×852 + 1440×900, then the **OLED read** (true-black haze and ember absorption don't simulate headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations — build cheap→expensive, verify each before the next, so you never debug three new systems at once:

1. **Tier 1 first, alone.** Wire the depth-fog Effect, confirm the composer actually hands you a usable depth buffer (the #1 first-build failure — the fog reads garbage or a flat 0/1 because the Effect didn't declare `EffectAttribute.DEPTH` or the composer has no depth texture). Tune `uDensity` until the void gains air without milking the blacks (watch the OLED — crushed blacks are brand).
2. **Bind `uTemp` immediately**, to the *exact* `ObsidianSlab` expression. Don't invent a second temperature — that's the cohesion crack that makes it look bolted-on. Scroll and confirm haze warms *with* the veins.
3. **Tier 2 next.** Get one fBM plane drifting and dissolving at its edges (the soft-edge mask) before adding more. Pitfall: **additive blending for smoke** — smoke must *occlude*, so use NormalBlending with `depthWrite:false`; additive only ever brightens and will never read as a bank. Second pitfall: **smoke bodies bloom** — keep their colour `<1` or they'll glow as sheets (only the hot cores `>1`).
4. **Ground-haze** in the channels with local `uTemp` from `uPourX` — verify the pool glows only where the pour is.
5. **Tier 3 last, and only on `high`.** Build it at **half-res from the very first commit** — never prototype full-res "just to see it," because you'll tune to a look you can't ship and the half-res version will look wrong. Add blue-noise jitter *before* judging banding. Get the **ember-tinted absorption** (`vec3(1.0,1.6,2.4)`) in early — un-tinted grey smoke is the tell that breaks the world.
6. **Composite order:** depth-fog Effect **after** Bloom, **before** the grade, in `Effects.jsx`. Get this wrong and either the haze blooms (sheet-glow) or the grade fights it.
7. **Per-route presets** via `sceneFor(forge.route)`: thick in forge-mouth/contact, thin in jewel-chamber/web, ground-haze only where channels exist. Damp on route change like the veins do — never cut.
8. **Quality-gate from commit one.** Don't add Tier 3, *then* gate it — ship the `high|low|static` branches together so `low` and `static` are never accidentally running the expensive path. `static` freezes `uTime`.
9. **Dispose + leak check.** Half-res RTs and the per-plane materials on unmount.

The single biggest trap: treating fog as a *separate* aesthetic. It isn't — it's the **same fBM, same palette, same `uTemp`** as the metal, one phase colder. Build it as "cooled, suspended forge-material," not "smoke."

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web* — **2025-06-10** — https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/ (screen-space→world reconstruction, `getWorldPosition`, raymarched volumetric lighting in R3F).
2. `CK42BB/procedural-clouds-threejs` — WebGPU raymarching **with WebGL2 billboard/mesh fallbacks**, Beer–Lambert + Henyey–Greenstein + light-march self-shadowing, three rendering paths (volumetric / mesh-cluster / billboard) — **created 2026-02-07** — https://github.com/CK42BB/procedural-clouds-threejs
3. three.js forum — *Volumetric lighting in WebGPU* (Usnul) — froxel/LUT pre-integration, sub-1ms even on 10-yr-old HW, post-process-raymarch critique, Wronski/Hillaire lineage — **2025-11-06** — https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959
4. matejlou — *Analytic Fog Rendering With Volumetric Primitives* — Beer–Lambert, closed-form constant-density fog, bounded primitives vs. heterogeneous raymarching — **2025-02-11** — https://matejlou.blog/2025/02/11/analytic-fog-rendering-with-volumetric-primitives/
5. three.js forum — *High-Performance Ground Fog for Games (Three.js)* — height-attenuated multi-octave-fBM ground fog, the **mobile early-exit** fixes (skip FBM above fog-top / outside radius), DPR cap — **2025-12-08** — https://discourse.threejs.org/t/high-performance-ground-fog-for-games-three-js/88522
6. Codrops — *Crafting Nature Beyond Technology* (Robin Navas) — transparency + **dark fog for depth**, high bloom threshold, `vec3(2.)` to cross bloom threshold, GPUComputationRenderer atmosphere — **2025-12-04** — https://tympanus.net/codrops/2025/12/04/crafting-nature-beyond-technology-a-project-from-roots-to-leaves/
7. Codrops — *80s Business Tech and Seamless Scene Transitions: Shader.se's Scroll-Driven WebGPU Pipeline* (Filip Kantedal) — TSL→WebGL/WebGPU dual target, **per-page render-pass skipping** (no draw calls off-screen), film-grain/CA/bloom compose — **2026-05-19** — https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
8. `digitalstrategyforce` — *What GLSL Shader Techniques Create Atmospheric Effects in WebGL* — volumetric fog + fBM noise budget discipline, **2 octaves on mobile**, 5ms desktop / 2ms mobile atmospheric budget, zone-based fog color via smoothstep — **2025** — https://digitalstrategyforce.com/journal/what-glsl-shader-techniques-create-atmospheric-effects-in-webgl/
9. `Ameobea/three-volumetric-pass` — raymarched screen-space volumetrics as a pmndrs-`postprocessing` pass, **`halfRes`** option, `HalfFloatType` composer — (active reference; Quílez-derived) — https://github.com/Ameobea/three-volumetric-pass

_Pre-2025 canon cited only as covered by the above 2025–2026 sources: Guerrilla/Schneider–Vos cloudscape optimisation table (half-res/8-step/jitter/TAA timings), Wronski 2014 froxel fog, Hillaire 2015/2020 PBR volumetrics, Last of Us Part II SIGGRAPH 2020 (64-slice froxel) — all surfaced via sources 3, 5, and the arXiv cloudscape optimisation summary._

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Half-resolution volumetric composite + blue-noise/temporal upscale on mobile WebGL2.** The make-or-break perf lever for Tier 3. Needs its own pass: how to render to a half-res FBO inside the *existing* `@react-three/postprocessing` chain, bilinear/edge-aware upsample, blue-noise texture sourcing, and whether a light temporal reprojection is worth the ghosting risk on a near-static camera. (Sources 1, 9 + Guerrilla table.)
2. **Ember-tinted participating-media absorption as a shared "forge-material" model.** Formalize the `exp(-d·σ·vec3)` wavelength-dependent absorption so smoke, obsidian transmission (`attenuationColor`), and the molten pour all derive their colour from **one** absorption-spectrum constant — making cohesion structural, not eyeballed.
3. **Heat-shimmer as a screen-space refraction pass.** The "HEAT SHIMMER distorts the air" beat is really a UV-displacement post-effect (sample the scene with an fBM-perturbed UV, masked by the hot-letter/pour regions). Distinct enough technique (refraction vs. absorption) to deserve its own pass and its own budget study.
4. **Froxel/WebGPU-TSL volumetrics as a Phase-3 `high+` tier.** With iOS 26 Safari shipping WebGPU and TSL dual-compiling (sources 2, 3, 7), scope a *capability-detected* froxel upgrade path: near-free shading, real multiple-scattering, god-rays — gated behind WebGPU, never the baseline. What it would take to keep the WebGL2 hybrid as the fallback while the same scene gets a froxel skin where supported.
