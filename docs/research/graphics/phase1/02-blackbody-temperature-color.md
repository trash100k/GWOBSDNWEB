# 02 — Blackbody Temperature→Color Master System

_Phase 1 graphics research · GAELWORX forge world · the single color-science layer the whole world shares._

---

## 1. SCOPE

This is the **master temperature→color system**: one canonical function that turns a scalar
temperature (`uTemp`, normalized `0..1`, or a real Kelvin value `T`) into an **emissive HDR RGB
color** — white-hot → yellow → orange → forge-red → dull-red → iron-black with deep ember veins —
plus the **emissive intensity** that drives bloom. Every hot thing in GAELWORX reads from this one
function: the living molten metal in the channels, the cooling GAELWORX letterforms (each letter on
its own cooling curve), the pour front, the heat-shimmer tint, the sparks orbiting the front, the
ember glow radiating onto basalt, and — the one exception — the **A and E held at unearthly
white-gold "divine fire" forever**. Because there is exactly one WebGL renderer (`ForgeCanvas.jsx`)
and one shared store (`src/store.js`), there must be exactly one temperature→color authority,
inlined into shaders as a GLSL helper the way `GLSL_NOISE` already is in `src/scene/shaders.js`. If
the molten, the letters, and the sparks each invent their own orange, the world fractures into a
collage of effects; if they all sample the same Planckian curve at different temperatures, it reads
as **one material at different points on one cooling timeline**. That single-authority property is
the entire point of this document.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four families of "hot-object color," and they differ mostly in **how physically grounded**
the temperature→chromaticity step is and **where the cost lands**.

### A. Full spectral integration (Planck's law → CIE XYZ → linear sRGB), precomputed to a LUT
Evaluate Planck's spectral radiance across 380–780 nm, integrate against the CIE 1931 color-matching
functions to XYZ, convert XYZ→linear sRGB. This is the ground truth. The dominant 2025 pattern is to
do this **offline in Python and bake a 1-D gradient texture** (a 256×1 strip indexed by normalized
temperature), then sample it in the shader. `MMqd/plancks-law-colors` (Mar 2025) is exactly this:
a Python script using Planck's law + CIE XYZ matching functions that emits a temperature→color LUT,
with an exponential `t∈[0,1] → Kelvin∈[600, 60000]` mapping and a Godot shader that samples it and
applies **Newton's law of cooling** to drive `T` over time. Scratchapixel's blackbody lesson
(updated, cited in 2025 surveys) walks the identical spectrum→XYZ→RGB pipeline and is the canonical
explainer. **Tradeoffs:** physically exact, trivially cheap at runtime (one texture fetch), but you
inherit a texture dependency and an authoring step. GAELWORX bans **runtime** EXR/HDR loads
(`forge-scene` / `fx-resources`), but a baked LUT is a tiny `DataTexture` built at module-eval in JS
— no file load — so this family is viable if we generate the strip in JS, not load an `.exr`.

### B. Closed-form Planckian-locus approximation (Kang/Krystek polynomials) in-shader
Skip the spectrum. Use the cubic-spline approximation of the Planckian locus to get CIE `xy`
chromaticity directly from Kelvin, then `xy→XYZ→linear RGB`. This is what
`AcademySoftwareFoundation/MaterialX`'s `mx_blackbody.glsl` ships today (the live `main` version
carries 2024–2025 commentary refining the Kang et al. 2002 polynomial bounds down to ~800 K, the
Draper point). It clamps `T∈[800, 25000]`, branches the `xc`/`yc` polynomials by temperature band,
builds `XYZ = vec3(xc/yc, 1, (1-xc-yc)/yc)`, and multiplies by the `XYZ→Rec.709` matrix.
**Tradeoffs:** no texture, fully procedural, exact enough that no one will tell it from spectral in a
stylized scene; cost is a handful of polynomials + a 3×3 matrix per pixel (cheap). Chromaticity only
— it gives you *hue*, not *brightness*; you still supply the emissive scale (Stefan–Boltzmann or an
artistic curve). This is the most "engineering-correct procedural" option.

### C. Helland/Bartlett-style RGB curve fits (the Unity Blackbody node lineage)
Direct empirical fits of R, G, B as functions of Kelvin (logs and power laws), e.g. Unity Shader
Graph's `Blackbody` node (Shader Graph 17.x, 2024–2025) based on Mitchell Charity's data:
`color.x = 56100000*pow(T,-1.5)+148`, `color.y = 100.04*log(T)-623.6` (with a `T>6500` branch),
`color.z = 194.18*log(T)-1448.6`, clamp `/255`, and fade to black below 1000 K. **Tradeoffs:**
dead simple, no matrices, no texture, well-loved in games; slightly less principled than the locus
approach and the constants assume a particular white point, but for a warm 1000–6500 K range
(exactly our forge band) it's indistinguishable and the cheapest of all. zubetto/BlackBodyRadiation
(HLSL) is the more rigorous cousin (returns linear-sRGB chromaticity **plus** an effective-radiance
alpha so you get luminance for free), and a 2025 Optics Express paper (Daneshvar et al., Jan 2025)
refines the Wien-law approximation specifically for the visible range below 4000 K if we ever want a
more accurate low-temperature tail.

### D. TSL / WebGPU node path (forward-looking)
On `WebGPURenderer`, the same math expresses as a TSL node graph feeding `material.emissiveNode`,
with bloom reading a dedicated **MRT `emissive` attachment** rather than thresholding luminance
(three.js `webgpu_postprocessing_bloom_emissive` example; Codrops "Interactive Text Destruction with
Three.js, WebGPU and TSL," Jul 2025; Wawa Sensei's TSL lessons). MRT-emissive bloom is *strictly
better* than luminance-threshold bloom — you bloom exactly the channels you mark, no false positives
from bright reflections. **Tradeoffs:** GAELWORX is WebGL today (`MeshPhysicalMaterial` +
`@react-three/postprocessing`), and iPhone-15 Safari WebGPU is still maturing; this is a Phase-2/3
migration target, not a Phase-1 build. We design the GLSL helper so it ports to TSL 1:1 later.

**Verdict on the landscape:** B (procedural locus) and C (curve fit) are the runtime contenders; A
(baked LUT) is the fallback if we want artistic control over the exact gradient stops; D is the
future. For a stylized warm forge on mobile, a **procedural in-shader curve, hand-tuned to brand
colors, is the right altitude** — it needs no texture, ports to TSL, and gives art-direction control.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Pick: a procedural, in-shader `gw_blackbody(temp)` GLSL helper** — a hybrid of (B) and (C),
authored as a **brand-anchored gradient ramp** rather than raw physics, living next to `GLSL_NOISE`
in `src/scene/shaders.js` and inlined into every hot material via the existing `onBeforeCompile`
chunk-injection pattern (`shader-fx`).

Why not pure spectral/LUT? Because the world's palette is **already an art direction**, not a
physics result: `palette.js` defines `PAL.crimson`/`PAL.red`/`PAL.ember`/`PAL.gold`/`PAL.hot` with
deliberate HDR values (`PAL.hot = (1.9,1.25,0.7)`, `PAL.emberHot = (1.7,0.7,0.22)`). A physically
exact Planck curve at 1800 K is a muddy brownish-orange that does **not** match Celtic Blood `#C1292E`
or Ember Glow `#E85D04`. We want the *shape* of the blackbody curve (the monotonic hue march and the
super-linear brightness ramp) **snapped onto the brand ramp** so it's physically *plausible* and
on-brand exact. The Planckian-locus literature (MaterialX, the 2025 plancks-law repo) tells us the
**correct ordering and curvature**; we honor that ordering but land the stops on `PAL` colors.

Why procedural over a baked LUT? Three reasons rooted in this codebase: (1) **no asset, no load** —
honors the "no runtime EXR/HDR" scar and adds zero bytes to the bundle; (2) **one uniform, many
consumers** — the slab, letters, sparks, and shimmer all `${GW_BLACKBODY}` the same function and
differ only by the `temp` they pass; (3) **TSL-portable** — a pure function of one float ports to a
TSL `Fn` for the eventual WebGPU migration with no texture-binding rework. The single tunable knob —
`uTemp` — is *already wired* in `ObsidianSlab.jsx` (`uniforms.uTemp`, driven by `forge.scrollDamped`
+ scroll velocity), so the master system slots into an existing socket.

The brightness/emissive side uses an **artistic super-linear ramp** (approximating Stefan–Boltzmann's
`T⁴` energy growth, but tamed) so that **only the hottest band exceeds 1.0 and blooms** — which is
exactly the discipline `post-fx` demands ("only HDR blooms," threshold `0.55`). Cold iron sits well
below 1.0 (no bloom, true black on OLED); the pour front and the divine-fire A/E sit above 1.0 (they
bloom). Temperature thus *controls bloom for free*, with no per-effect bloom tuning.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
No new dependencies. Stays on the current stack: `three` (WebGL `MeshPhysicalMaterial` +
`onBeforeCompile`), `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
(the `Bloom` in `Effects.jsx`). The new code is one GLSL string exported from
`src/scene/shaders.js` and one optional JS color-LUT builder (only if we ever want the LUT fallback).

### 4.2 The master GLSL helper (drop into `src/scene/shaders.js`, next to `GLSL_NOISE`)

```glsl
// GAELWORX master blackbody: ONE temperature->color authority for the whole forge.
// `temp` is normalized 0..1 (0 = iron-black/cold, 1 = white-hot pour front).
// Returns HDR linear RGB: cold band stays < 1.0 (no bloom, true-black on OLED),
// hot band exceeds 1.0 (blooms). Hue march honors the Planckian locus ordering
// (red -> orange -> yellow -> white) but lands on the GAELWORX brand ramp.
export const GW_BLACKBODY = /* glsl */ `
  // brand stops, coolest -> hottest (inlined from palette.js / PAL)
  // iron-black, dull-red, forge-red(Celtic Blood), ember(Ember Glow), gold, white-hot(HDR)
  vec3 gw_tempColor(float temp){
    float t = clamp(temp, 0.0, 1.0);
    // perceptual easing: cold tail crushes fast (most of the range reads dull),
    // so the eye spends its resolution in the orange->white "interesting" band.
    vec3 ironBlack = vec3(0.020, 0.004, 0.002);
    vec3 dullRed   = vec3(0.55,  0.045, 0.012);
    vec3 forgeRed  = vec3(0.757, 0.161, 0.180);  // #C1292E Celtic Blood (linearized-ish)
    vec3 ember     = vec3(0.910, 0.365, 0.016);  // #E85D04 Ember Glow
    vec3 gold      = vec3(1.40,  0.92,  0.40);    // HDR shoulder
    vec3 whiteHot  = vec3(1.90,  1.25,  0.70);    // PAL.hot — blooms
    vec3 c;
    c = mix(ironBlack, dullRed,  smoothstep(0.00, 0.22, t));
    c = mix(c,         forgeRed, smoothstep(0.18, 0.45, t));
    c = mix(c,         ember,    smoothstep(0.42, 0.66, t));
    c = mix(c,         gold,     smoothstep(0.64, 0.85, t));
    c = mix(c,         whiteHot, smoothstep(0.82, 1.00, t));
    return c;
  }
  // Emissive intensity vs temperature: super-linear (Stefan-Boltzmann flavored,
  // T^4 tamed to ~T^3 so mobile bloom stays controlled). Cold ~0, hot pushes >1.
  float gw_tempEmissive(float temp){
    float t = clamp(temp, 0.0, 1.0);
    return pow(t, 3.0) * 2.6 + t * 0.12; // small linear floor so warm iron still reads
  }
  // Convenience: HDR emissive color for a given temperature in ONE call.
  vec3 gw_forge(float temp){
    return gw_tempColor(temp) * gw_tempEmissive(temp);
  }
  // The exception: A/E divine fire — locked white-gold, never cools, always blooms.
  // `flick` is a tiny 0..1 sparkle term (noise) so it lives without changing hue.
  vec3 gw_divineFire(float flick){
    vec3 col = vec3(2.05, 1.62, 1.02);          // unearthly white-gold, HDR
    return col * (1.0 + flick * 0.18);
  }
`
```

> Note the stop colors are written roughly toward linear space; tune the exact triplets live in the
> `?debug` leva panel against the iPhone read (sRGB authoring vs the ACES-tonemapped output shifts
> them). The **structure** — six monotonic stops, overlapping `smoothstep` bands, a `T³` brightness
> ramp, and a separate locked divine-fire — is the load-bearing part.

### 4.3 Wiring into the slab (refit the existing COLOR block in `ObsidianSlab.jsx`)
The slab already injects `HEAD` (`#include <common>`), `NORMAL` (`#include <normal_fragment_maps>`),
and `COLOR` (before `#include <tonemapping_fragment>`). Add `${GW_BLACKBODY}` to `HEAD` (right after
`${GLSL_NOISE}`), then drive the vein body from the master function instead of the ad-hoc
`mix(crimson, ember, …) → mix(…, hot, …)` it does now:

```glsl
// in COLOR, replacing the hand-mixed `body`:
float veinTemp = clamp(gwVein * 0.55 + gwCore * 0.45 * (0.6 + 0.4 * uTemp), 0.0, 1.0);
vec3  body     = gw_forge(veinTemp);          // <- master system, HDR, blooms at the cores
// opal play-of-color stays as the iridescent overlay (unchanged), then:
vec3 fire = (mix(body, opal * 1.5, iridMix) * gwFlow) * (uVeinGlow + uSurge);
gl_FragColor.rgb += fire;
```

### 4.4 Key uniforms & parameters (the shared socket)
- **`uTemp` (float, 0..1)** — already exists; the master temperature dial. Slab drives it from
  `forge.scrollDamped + scrollVel*0.25`. Letterforms drive it per-letter from a cooling curve;
  sparks from proximity to the pour front; shimmer from local channel temp.
- **`uTime` (float)** — for the divine-fire flicker and molten churn (frozen to a constant on
  `quality==='static'`, matching the existing `uTime = static ? 2 : elapsed` pattern).
- Optional **`uPourFront` (float/vec2)** — position of the moving pour along a channel/letter so
  consumers can compute `temp = f(distance_behind_front)` (Newton's-cooling falloff, the
  plancks-law-2025 pattern).
- The brand stops are **compile-time constants** inlined from `PAL` — change them in one place.

### 4.5 R3F component shape
No new component needed for Phase 1 — it's a shared GLSL helper consumed by existing materials.
Each hot mesh keeps the `shader-fx` recipe: `MeshPhysicalMaterial` + `onBeforeCompile`, inject
`${GLSL_NOISE}\n${GW_BLACKBODY}` into `HEAD`, call `gw_forge(temp)` / `gw_divineFire(flick)` in the
COLOR hook, add the emissive **before** `<tonemapping_fragment>`, and `dispose()` on unmount. When
the letterforms land (separate doc), they become a `<Letterforms>` component that owns a per-letter
`temp[]` array updated in the one shared `useFrame`, dt-damped.

---

## 5. COHESION — how it binds the world

This function **is** the cohesion layer; everything downstream samples it.

- **Molten metal in channels:** churning fbm noise (`gw_caustic` already in `shaders.js`) modulates a
  *local* `temp` around a hot base (~0.85–1.0); `gw_forge(temp)` gives the bubbling white-orange.
  The pour front is `temp≈1.0`; trailing metal cools via Newton's-cooling falloff behind the front.
- **Cooling letterforms:** each GAELWORX letter carries its own `temp` that ramps `1.0 → ~0.08` over
  its cooling time; `gw_forge` walks it white-hot → forge-red → iron-black automatically. Because
  the *same* curve drives the slab veins, a cooling letter and a cooling vein are visibly the **same
  metal**.
- **Basalt (green-black Connemara):** stays cold — it is *lit*, not emissive. The ember glow it
  receives is `gw_tempColor(nearbyTemp) * gw_tempEmissive(nearbyTemp)` added as a cheap distance-fade
  radiance term, so the orange light spilling onto stone is the *same* orange as the metal making it.
- **A/E divine fire:** the single exception. `gw_divineFire(flick)` returns locked white-gold HDR and
  **ignores `uTemp`** — the A and E never cool. This is the 3D embodiment of the DOM `.forge-letter`
  ignite rule (`CLAUDE.md`): in the brand layer the A/E glow with the forge gradient; in the world
  they hold divine fire forever and radiate onto the Ogham. Same concept, two renderers.
- **Sparks/embers (`Embers.jsx`):** each spark samples `gw_forge(sparkTemp)` where `sparkTemp` rides
  high near the pour front and decays as it drifts — so sparks are literally cooling metal droplets,
  not a separate particle color.
- **Heat shimmer:** the refraction/distortion pass tints by `gw_tempColor(localTemp)` at low
  intensity, so hot air over the pour carries the pour's color.
- **Palette & bloom discipline:** every stop is a `PAL` color; only the `gold`/`whiteHot`/divine-fire
  bands exceed 1.0, so **only the hottest things bloom** through the existing `luminanceThreshold=0.55`
  `Bloom` — no change to `Effects.jsx`. The ACES tone-map on the Canvas (`ForgeCanvas.jsx`) and the
  crushed-black grade (`BrightnessContrast brightness=-0.04 contrast=0.16`) keep iron-black at true
  zero on the OLED.

Nothing is bolted on because nothing has its own color logic — they all ask the same function
"what does metal at temperature `t` look like?"

---

## 6. MOBILE & PERFORMANCE

Target: iPhone 15 (A16, OLED), one renderer, the `high|low|static` tiers from `useQuality`.

- **Cost is trivial.** `gw_forge` is five `mix`/`smoothstep` pairs + a `pow` — single-digit ALU,
  no texture fetch, no branch. It's cheaper than the existing `gw_fbm` (3-octave loop) it sits beside.
  This is the whole reason to go procedural over a sampled LUT on mobile: no extra texture unit, no
  bandwidth.
- **Bloom is the real budget**, not the color math. Keep `mipmapBlur` (cheap wide bloom) and resist
  raising `Bloom intensity`; instead let `gw_tempEmissive`'s `T³` ramp decide *what* blooms. Because
  cold bands stay <1.0, the bloom-pass workload doesn't grow with more cold metal on screen.
- **Tiering:** `high` gets the full ramp + transmission + SMAA/aberration; `low` keeps the identical
  `gw_forge` math (it's free) but no transmission and `multisampling=0`; `static` (reduced-motion)
  **freezes `uTime`** (so the divine-fire flicker and molten churn stop) and `Effects` is unmounted —
  the color is still correct, just not animated. Honor all three exactly as `forge-scene` mandates.
- **OLED-safe mapping:** author so the `iron-black` stop tone-maps to a code value that is *actually*
  black on the panel. Per the 2026 TFTCentral black-crush analysis, OLED crushes everything below
  ~RGB 3/255 anyway — which is *desirable* here: cold iron should disappear into the void. Keep the
  crushed-black grade; do **not** add a near-black gamma lift (that would gray the void).
- **LUT fallback (only if needed):** if a future profile shows the procedural ramp is ever a
  bottleneck (it won't be), bake the 256×1 strip in JS at module-eval into a `DataTexture` (no file
  load, honors the EXR ban) and swap `gw_tempColor` for a `texture2D(uRamp, vec2(t,0.5))`. Same
  authority, one texture fetch.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations and the specific traps:

1. **Author the helper in isolation first.** Add `GW_BLACKBODY` to `shaders.js` and wire *only* the
   slab's `body` to `gw_forge(veinTemp)`. Build green, `qa-route` (SwiftShader compiles the GLSL → 0
   console errors ≈ it compiled), then read the iPhone. Get the six stops landing on brand **before**
   any other consumer touches it — this is the master, so its colors are load-bearing everywhere.
2. **Author for the ACES output, not the raw value.** The Canvas runs `ACESFilmicToneMapping`; an HDR
   `(1.9,1.25,0.7)` does **not** display as those numbers. Tune the stops *through* the tone-mapper on
   the device (the `?debug` leva panel), or you'll over-saturate. This is the #1 first-build mistake.
3. **Linear vs sRGB.** `PAL` colors are authored from sRGB hex (`new THREE.Color('#E85D04')`), but the
   shader math is in linear space and emissive is added pre-tone-map. Don't paste sRGB triplets raw;
   either let `THREE.Color` convert (it does, with `ColorManagement`) or eyeball-linearize the inlined
   constants and verify on device. Mismatch here makes the whole ramp look washed or too dark.
4. **Keep brightness and hue separate.** `gw_tempColor` returns *hue at unit-ish brightness*;
   `gw_tempEmissive` returns *scale*. Multiplying them (`gw_forge`) is what gives the super-linear
   pop. If you bake brightness into the color stops you lose the single knob that controls bloom and
   you'll fight `Bloom` intensity forever (the washed-out failure mode `post-fx` warns about).
5. **The A/E must NOT read `uTemp`.** Route divine-fire through `gw_divineFire` only. If you ever let
   `uTemp` reach the A/E, they'll cool with everything else and you break the single most important
   brand rule in the build. Hard-separate the code path.
6. **Monotonic stops only.** The blackbody hue march is strictly red→orange→yellow→white as it heats;
   never let a hotter stop be redder than a cooler one (a classic gradient-authoring slip). Overlap
   the `smoothstep` bands (note the deliberate overlaps above) so there are no flat plateaus or hard
   seams as `t` sweeps.
7. **Drive `temp` dt-damped, never frame-dependent.** Every consumer updates its `temp` in the one
   shared `useFrame` via `THREE.MathUtils.damp` (`store.js:damp`), exactly as the slab already damps
   `uVeinGlow`/`uIrid`. No competing rAF, no `lerp(a,b,k)`.
8. **Verify on the device, not the headless shot.** Bloom spread, true-black, and OLED saturation
   don't simulate in SwiftShader. 0 console errors proves it *compiled*; only the iPhone proves it
   *reads*.

---

## 8. SOURCES (2025–2026)

1. **MMqd/plancks-law-colors** — Planck's-law temperature→color LUT (Python + CIE XYZ) with Newton's-
   law-of-cooling shader integration; exponential temp→Kelvin mapping; EXR ramp output.
   https://github.com/MMqd/plancks-law-colors — published **2025-03-16**.
2. **AcademySoftwareFoundation/MaterialX — `mx_blackbody.glsl`** (`main`) — Kang et al. (2002)
   Planckian-locus cubic-spline approximation, clamp `[800,25000] K`, `xy→XYZ→Rec.709`; carries
   2024–2025 commentary refining the lower-bound polynomials to the Draper point.
   https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/libraries/pbrlib/genglsl/mx_blackbody.glsl — accessed **2026**.
3. **Daneshvar, Finlayson, Brill, Deeb — "Introducing a temperature adjustment to make Wien's law a
   more accurate approximation of Planckian blackbody radiation in the visible range,"** Optics
   Express. https://doi.org/10.1364/oe.544854 — published **2025-01-16**.
4. **García, Monzón, Muñoz — "Techniques for Real-Time Spectral Rendering"** — real-time spectral
   upsampling pipeline (Jakob/Hanika LUTs), OpenGL, vectorized `fma`, 144 FPS.
   https://doi.org/10.26754/jji-i3a.202511962 — published **2025-07-28**.
5. **Maxime Heckel — "On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
   Raymarching for the Web"** — modern R3F post-processing/HDR practice, depth-buffer + `Effect`
   class patterns. https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/ — published **2025-06-10**.
6. **Codrops — "Interactive Text Destruction with Three.js, WebGPU and TSL"** (Lolo Armdz) — TSL
   `emissiveNode`, MRT `emissive` bloom, "bloom everything" emissive workflow.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/ — published **2025-07-22**.
7. **three.js — `webgpu_postprocessing_bloom_emissive` example** — MRT `emissive` attachment feeding
   `bloom(emissivePass, …)` under `ACESFilmicToneMapping`; the dedicated-emissive bloom pattern.
   https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_postprocessing_bloom.html — accessed **2026**.
8. **TFTCentral — "Does OLED Have a Black Crush Problem? Understanding and Testing OLED Shadow
   Detail"** (Simon Baker) — near-black gamma cliff on OLED, RGB<3 crushes to black; informs the
   iron-black stop + crushed-black grade. https://tftcentral.co.uk/articles/does-oled-have-a-black-crush-problem-understanding-and-testing-oled-shadow-detail — published **2026-02-10**.
9. **tecnobits — "Avoiding black crush on OLED: key tests and adjustments"** — OLED near-black gamma
   2.2 behavior and HDR shadow handling. https://tecnobits.com/en/OLED-monitors-avoid-black-crush/ —
   published **2025-11-14**.
10. **Maxime Heckel — "Speaking at Figma Config 2025: The future of the web is paved with shaders"** —
    2025 state-of-the-art real-time web shaders, resource set. https://blog.maximeheckel.com/posts/config-2025/ — published **2025-05-08**.

_(Foundational references that predate 2025 — Scratchapixel's blackbody lesson, Unity Shader Graph's
Blackbody node lineage / Mitchell Charity data, zubetto/BlackBodyRadiation — are cited only as
technique provenance; every load-bearing claim above is anchored to a 2025–2026 source.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Per-letter cooling curves & the Newton's-law-of-cooling timeline.** How each GAELWORX letterform
   ramps `temp 1→0` left-to-right behind the fill front, the cooling-rate falloff, and how the A/E
   branch off the curve into locked divine fire. Owns the temporal half of the temperature system
   (this doc owns the spatial/color half). Build on the plancks-law-2025 Newton's-cooling pattern.
2. **MRT-emissive bloom & the WebGPU/TSL port.** Migrating from luminance-threshold bloom to a
   dedicated `emissive` MRT attachment so divine-fire and pour-front bloom is exact and decoupled from
   reflections — and porting `gw_forge`/`gw_divineFire` to a TSL `Fn`. Direct path to better mobile
   bloom and the future renderer.
3. **OLED-safe HDR authoring through ACES (and AgX as an alternative).** Quantify where each
   temperature band lands post-tone-map on the iPhone-15 panel, whether `AgXPunchyToneMapping` (sRGB,
   contrasty) serves the warm-forge look better than ACES, and a CDL/grade pass to lock the void at
   true black without crushing the orange shoulder.
4. **Divine-fire radiance onto basalt & Ogham reveal.** The light-spill model — how `gw_forge` /
   `gw_divineFire` drives a cheap radiance term that lights the green-black Connemara basalt and makes
   carved Ogham readable only near the A/E. Bridges the emissive color system into the world's
   *lighting* (not just self-emission).
</invoke>
