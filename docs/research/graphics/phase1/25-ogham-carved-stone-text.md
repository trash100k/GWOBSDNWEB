# 25 — Ogham Script as Carved-Stone Text

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED · one WebGL renderer · warm-forge palette_

---

## 1. SCOPE

The Ogham is the **sacred small print of the world** — the notched Irish alphabet **cut into the
green-black Connemara basalt** that the molten channels wind through. It is not decoration laid on the
stone; it is _carved into_ it, and it is the single clearest payoff of the brief's central conceit:
**the carved Ogham is invisible in the pure void and only becomes readable where the A/E "divine fire"
white-gold light spills onto the adjacent stone.** When a viewer reaches a chamber where a divine A or
E burns, its light rakes across the basalt at a grazing angle, the incised notches throw hard little
self-shadows, and lines of Ogham _surface out of the black_ for the first time — ancient, sacred,
legible only in the fire of the forge. That is the moment this element exists to deliver.

Concretely the Ogham appears as **incised bands along the channel walls and the altar approach**, and
as **a verse cut up the edge of the stone-ledger / four-plinths** — exactly where real Ogham lives
(monumental Ogham was cut into the _edge_ of standing stones, the **droim** or **faobhar**, which forms
the stemline). Three jobs from one technique:

1. **Authentic Ogham letterforms** — a continuous **stemline** with perpendicular / angled **score
   strokes** in the four families (aicme), readable bottom-to-top or left-to-right (never top-down),
   per the Unicode/ScriptSource rendering rules.
2. **A convincing carved look** — real incised _depth_ at grazing angles (the notches must occlude and
   self-shadow), not a flat decal printed on the rock.
3. **Light-gated legibility** — the carving is keyed to the **shared A/E divine-fire light term** so it
   reads as a _consequence_ of the world's brightest light source, identical to the value that reveals
   the serpentine green in the basalt (doc 05) and that makes the A/E letterforms bloom (doc 12).

This is the natural meeting point of the SDF-text research (doc 12) and the basalt research (doc 05):
the Ogham is **SDF strokes etched into the basalt material**, lit by the **AE divine fire**, inside the
**one master temperature/lighting system**.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable way to put readable, carved-looking Ogham into the basalt on a mobile WebGL slab, judged
against _this_ build (one `WebGLRenderer`, `MeshPhysicalMaterial` + `onBeforeCompile`, no runtime EXR,
iPhone-15 budget, shared `gw_fbm`/`PAL`/`forge.*`).

**A. Generate the Ogham as a live procedural SDF in the fragment shader.**
Ogham is the rare alphabet that is **trivially synthesisable as 2D SDF primitives** — it is literally a
line (the stemline) with short line-segments crossing it. Inigo Quilez's exact line-segment SDF
(`sdSegment`, re-surfaced and re-derived in the Jelly Renders _2D Signed Distance Fields_ writeup, Dec
2025, and the GM Shaders _Signed Distance Fields_ piece) plus `min()` union gives the whole script from
~5 lines of GLSL: one long segment for the droim, N short segments per character laid out along it,
each family (aicme) just a different offset/angle/side. Zero texture bytes, infinitely crisp,
animatable, and the SDF doubles as a height field for the carve (negative inside the groove). Tradeoff:
ALU per pixel scales with character count (each glyph is a `min` over its strokes), so long passages
get expensive; layout/spacing is hand-coded; and it can't render the _Latin_ transliteration, only the
Ogham marks (fine — we want the marks).

**B. Pre-baked SDF / MSDF atlas of the Unicode Ogham block (U+1680–U+169F).**
Treat Ogham as a font and bake an SDF atlas (doc 12's pipeline: msdf-atlas-gen, or single-channel SDF
for the soft carve shadow per Red Blob Games' "single-SDF is better for glow/shadow" point). BabelStone
ships free Unicode Ogham fonts (seven families) we could bake from. The atlas gives correct historical
glyph shapes for free and arbitrary text. Tradeoff: one more texture asset + decoder path, and the
notches of Ogham are so geometrically simple that a font atlas is arguably _overkill_ versus generating
them. **Single-channel SDF here, not MSDF** — Ogham has no sharp serif corners to preserve, and a round
SDF gives the softer, more uniform groove-shadow falloff Red Blob Games recommends for exactly this.

**C. Parallax-occlusion / relief mapping the carved depth from the SDF height field.**
Whichever way the strokes are _defined_ (A or B), the _carve_ needs apparent depth. POM ray-marches the
height field so the grooves genuinely occlude and parallax-shift at grazing angles — which is precisely
the angle the AE light rakes the wall at, so it's where carving sells or dies. three.js shipped a
first-class **`parallaxOcclusion` node** (Three.js Blocks docs, 2025) — adaptive ray-march, min 24
samples perpendicular / max 96 grazing, `scale` default 0.05, optional blue-noise jitter — but it lives
in the **TSL/WebGPU** lane. In our WebGL `onBeforeCompile` world we hand-port a **clamped** POM loop
(8–24 samples) from the same math. Tradeoff: the single most expensive per-pixel technique here;
grazing-angle hungry; must be `high`-tier-only and ideally restricted to near-perpendicular cameras.

**D. Normal-perturb-only carve (derivative bump from the SDF), no ray-march.**
The cheap carve: convert the SDF groove into a normal perturbation via `dFdx/dFdy` (the exact
`normal = normalize(normal - gwBmp*uBump)` idiom the obsidian slab already ships) plus a darkened
ambient-occlusion term inside the groove. No parallax, but with grazing AE light the perturbed normals
already throw convincing shadow/shading into the notches. Tradeoff: no true parallax/occlusion (the
groove won't "shift" as the camera moves, and won't self-occlude at extreme grazing), but ~free and
runs on every tier. This is the `low`-tier and the baseline everywhere.

**E. Real carved geometry (boolean-subtracted grooves / vertex displacement).**
CSG-subtract the strokes from the basalt mesh, or displace a dense grid by the SDF. Honest depth, real
self-shadowing from the scene lights. Tradeoff: huge vertex count for fine notches, CSG is fragile and
heavy, and it can't animate the reveal. Pointless when POM/normal-perturb fake it convincingly for a
fraction of the cost. **Reject** except possibly a single hero stroke on the altar.

**F. Decal mesh (drei `<Decal>`) carrying an SDF/normal map of the Ogham.**
Project an Ogham decal onto the curved channel wall, with a normal map for the carve. Clean separation,
reuses three.js decal machinery. Tradeoff: a decal is a _second_ material/draw and a flat projected
quad — the carve is normal-map-only (option D depth, none of C's parallax), and gating its legibility
to the AE light means re-plumbing the master uniforms into the decal material anyway. More moving parts
than injecting the SDF directly into the basalt shader. **Reserve** for a one-off inscription plaque,
not the channel-hall bands.

**G. TSL / WebGPURenderer rewrite.**
The 2025/26 zeitgeist (Maxime Heckel's _Field Guide to TSL and WebGPU_; the Codrops WebGPU run incl. the
_Gommage_ MSDF-text-in-TSL piece, Jan 2026) moves all of this to composable nodes — `parallaxOcclusion`,
SDF, triplanar all become node graphs. Genuinely the future and the cleanest expression. Tradeoff for
GAELWORX now: the scene is one hand-patched `WebGLRenderer`; a `WebGPURenderer` swap is renderer-wide
with mobile-Safari support caveats. **Out of scope for Phase 1; Phase-2 deep dive.** We borrow the math
(POM, SDF unions) into GLSL today.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: A (procedural SDF Ogham) for the carve _shape_ + D (derivative-bump carve) everywhere as the
baseline + C (clamped hand-ported POM) layered on only at `high` tier — all injected into the existing
`BasaltStone` `MeshPhysicalMaterial` via `onBeforeCompile`, gated by the shared AE-divine-fire light
term.** Single-channel SDF (option B) is the **fallback path** for arbitrary Ogham text if/when we need
real passages of authored content.

Why this pick, tied to the world + constraints:

- **Ogham is the one script you should _generate_, not texture.** Unlike Cinzel (high-contrast serif →
  MSDF atlas, doc 12), Ogham is a stemline plus straight score strokes — IQ's `sdSegment` + `min()`
  union reproduces it _exactly_ with zero asset bytes (Jelly Renders 2025; GM Shaders SDF). That keeps
  the channel-hall bands tiling-free and infinitely crisp, and the **same SDF value is the carve height
  field** — one evaluation serves shape, normal, AO, and POM. Maximum effect, minimum bytes, fully
  inside the proven shader-fx pattern.
- **The reveal cannot be baked — it must be a live function of the AE light.** The whole beat is "the
  carving appears for the first time in the divine fire." That demands legibility to be
  `f(uAEFirePow, grazing angle)` in-shader (doc 05's exact `reveal` logic), not a fixed albedo. Procedural
  SDF + light-gated emissive/shadow is the only path that lets the Ogham literally rise from black as the
  AE light climbs.
- **It rides the basalt, not a new object.** The Ogham SDF is injected into the **same** `BasaltStone`
  material (doc 05) — no second mesh, no decal draw, no extra material variant. The notch shadows perturb
  the _same_ normal, the groove darkens the _same_ albedo, and the reveal reads the _same_ `uAEFirePow`
  the green-reveal reads. Stone, carving, and divine light are one coupled system by construction.
- **Carved depth is correctly tiered.** Derivative-bump (D) gives a believable incision on every device
  for free; POM (C) adds true grazing-angle parallax only where the budget allows and the camera looks
  near-perpendicular (channel-hall top-down, altar approach). Nobody on a `low` tier sees a flat decal —
  they see a real-shaded groove; `high` tier sees it shift and self-occlude.
- **Single-SDF, not MSDF.** Per Red Blob Games (Jan 2026), a round single-channel SDF gives softer,
  more uniform shadow/glow falloff — which is exactly what a carved groove and its rim-light want — and
  Ogham has no sharp corners that MSDF exists to preserve. Cheaper and better here.

---

## 4. IMPLEMENTATION

### Libraries / versions

- `three` r17x (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`. No new renderer.
- `@react-three/fiber`, `@react-three/drei` (existing) — `<Decal>` only if we ship the option-F plaque.
- `@react-three/postprocessing` (existing) — the AE-lit rim of the groove crosses the bloom threshold.
- Shared in-repo: `GLSL_NOISE` (`src/scene/shaders.js`), `PAL`/`v3` (`src/scene/palette.js`),
  `forge`/`damp`/`range` (`src/store.js`).
- **No new runtime asset** for the recommended path (SDF is generated). If we later add option-B Ogham
  passages: bake a **single-channel SDF** atlas from a BabelStone Unicode Ogham font with msdf-atlas-gen
  (`-t sdf`), ship as `.ktx2` (ETC1S), `LinearFilter`, `colorSpace = NoColorSpace` — the doc-12 rules.

### The Ogham as procedural SDF (the alphabet, in GLSL)

Authentic construction: a single horizontal **stemline (droim)**; each character is **1–5 short score
strokes** placed by family (**aicme**):
- **Aicme Beithe** (b,l,f,s,n): strokes **below/right** of the stemline, perpendicular.
- **Aicme hÚatha** (h,d,t,c,q): strokes **above/left**, perpendicular.
- **Aicme Muine** (m,g,ng,z,r): strokes **crossing** the stemline at a slant.
- **Aicme Ailme** (a,o,u,e,i): **notches** on the stemline (short, centred).

```glsl
// IQ exact line-segment SDF (Jelly Renders 2025 / GM Shaders) — the ONLY primitive Ogham needs.
float sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// One Ogham character: cx = centre along stemline, fam = aicme (0..3), n = stroke count (1..5).
// Returns an SDF (>0 outside, ~0 on stroke). Stroke length L, spacing S, slant for Muine.
float ogChar(vec2 p, float cx, int fam, int n){
  float d = 1e3;
  float L = 0.10, S = 0.028;
  for(int i = 0; i < 5; i++){
    if(i >= n) break;
    float x = cx + (float(i) - float(n - 1) * 0.5) * S;   // strokes centred on cx
    vec2 a, b;
    if(fam == 0){ a = vec2(x, 0.0);  b = vec2(x, -L); }                 // Beithe: below
    else if(fam == 1){ a = vec2(x, 0.0); b = vec2(x, L); }              // hUatha: above
    else if(fam == 2){ a = vec2(x - L*0.6, -L); b = vec2(x + L*0.6, L);}// Muine: crossing slant
    else { a = vec2(x, -L*0.18); b = vec2(x, L*0.18); }                 // Ailme: short notch
    d = min(d, sdSeg(p, a, b));
  }
  return d;
}

// A whole inscription band: the droim + a hardcoded sequence (GAELWORX → ᚌᚐᚓᚂᚍᚑᚏᚊ, etc.)
float oghamBand(vec2 uv){
  float stem = sdSeg(uv, vec2(0.0, 0.0), vec2(1.0, 0.0));   // droim / faobhar = the edge stemline
  float d = stem;
  // GAELWORX spelled in the four families (illustrative layout; verify glyphs per Unicode chart):
  d = min(d, ogChar(uv, 0.10, 2, 2));  // G  (Muine, 2)
  d = min(d, ogChar(uv, 0.22, 3, 1));  // A  (Ailme, 1)
  d = min(d, ogChar(uv, 0.34, 3, 5));  // E  (Ailme, 5)
  d = min(d, ogChar(uv, 0.46, 0, 2));  // L  (Beithe, 2)
  d = min(d, ogChar(uv, 0.58, 2, 5));  // W~ (Muine family stand-in)
  d = min(d, ogChar(uv, 0.70, 3, 3));  // O  (Ailme, 3)
  d = min(d, ogChar(uv, 0.82, 2, 5));  // R  (Muine, 5)
  d = min(d, ogChar(uv, 0.94, 1, 5));  // X~ (hUatha family stand-in)
  return d;                            // SDF: small near a stroke, large in blank stone
}
```

> Read direction is enforced by laying `cx` left-to-right (Unicode/ScriptSource: render LTR or
> bottom-to-top, **never top-down**). For the plinth/edge inscriptions, rotate the band 90° so it reads
> **bottom-to-top up the stone edge** — the authentic monumental orientation.

### Hooking it into the BasaltStone material (the carve)

This injects into the **same** `BasaltStone` shader from doc 05 — we reuse its `vWPos`/`vWNrm`
varyings, its `uTemp`/`uLightAmt`/`uAEFire`/`uAEFirePow` uniforms, and its `#include <color_fragment>`
albedo hook. The Ogham only **adds** a groove field, its normal perturbation, and a light-gated reveal.

```glsl
// --- new uniforms appended to the basalt set ---
uniform float uOghamOn;     // 0..1 master enable (per-route; channel-hall/altar = 1)
uniform float uOghamDepth;  // groove apparent depth (carve strength)
uniform float uOghamReveal; // optional floor so a faint trace reads even without AE light
uniform vec2  uOghamUV;     // where on this wall the band sits (offset/scale into local coords)

// derive a local 2D coord on the wall from world pos (planar for a wall, or the basalt's UV)
vec2 ogUV = (vUv - uOghamUV.xy) * uOghamUV.zw;   // or build from vWPos for triplanar walls
float ogSdf  = oghamBand(ogUV);
// groove profile: 1.0 deep in the cut, 0.0 on flat stone. Edge width via fwidth = scale-correct.
float ogEdge = fwidth(ogSdf) + 1e-4;
float groove = 1.0 - smoothstep(0.0, 0.010 + ogEdge, ogSdf);   // 1 inside the incised stroke
groove *= uOghamOn;
```

```glsl
// --- NORMAL hook (after the basalt's normal-perturb, same idiom as ObsidianSlab.jsx:53) ---
// carve the groove into the surface normal: the walls of the cut tilt toward/away from light.
vec2 gN = vec2(dFdx(groove), dFdy(groove));
normal = normalize(normal - vec3(gN, 0.0) * uOghamDepth);   // notch self-shades under grazing light
```

```glsl
// --- COLOR hook (in #include <color_fragment>, after the basalt body is built) ---
// 1) darken inside the groove (ambient occlusion of the cut)
diffuseColor.rgb *= mix(1.0, 0.35, groove);

// 2) THE REVEAL — legibility is a function of the SAME AE divine light the green-reveal uses (doc 05)
float aeFall  = 1.0 / (1.0 + dot(vWPos - uAEFire, vWPos - uAEFire) * 0.25);
float aeLight = uAEFirePow * aeFall;                  // identical falloff to the basalt green-reveal
float legible = clamp(aeLight + uOghamReveal, 0.0, 1.0);

// 3) white-gold rim catches the divine fire on the upper lip of each cut → the script "lights up"
//    grazing term: rim brightest where the groove gradient faces the AE light.
vec3  toAE   = normalize(uAEFire - vWPos);
float rim    = pow(clamp(dot(normalize(normal), toAE), 0.0, 1.0), 2.0) * groove;
vec3  goldFire = ${v3(PAL.gold)};                      // shared white-gold of the divine A/E
diffuseColor.rgb += goldFire * rim * legible * 1.3;    // > 1 contributions bloom (post-fx rule)

// 4) faint warm ember pooling deep in the cut when the world runs hot (shares uTemp + gw_fbm)
float emberPool = pow(groove, 2.0) * uTemp;
diffuseColor.rgb += ${v3(PAL.ember)} * emberPool * 0.12;
```

### Optional POM (high tier only — clamped, hand-ported from the TSL node math)

```glsl
#ifdef OGHAM_POM
// ray-march the groove height (= 'groove' as a height field) in tangent space.
// min 8 perpendicular / max 24 grazing (TSL node uses 24/96 on desktop — we clamp HARD).
// bias step count by view grazing; early-out when the ray drops below the height; bail at maxSteps.
// outputs a parallax-shifted ogUV used to re-evaluate oghamBand → true occluding notches.
#endif
```

### The r3f hook (extends `BasaltStone`, doc 05)

```jsx
// inside BasaltStone's uniforms:
uOghamOn:     { value: 0 },
uOghamDepth:  { value: 1.1 },
uOghamReveal: { value: 0.0 },
uOghamUV:     { value: new THREE.Vector4(0.05, 0.1, 1.0, 1.0) },

// material defines (tier-gated):
if (quality === 'high') m.defines.OGHAM_POM = ''

// useFrame — driven by the SAME signals as the green-reveal:
const sc = sceneFor(forge.route)
uniforms.uOghamOn.value     = damp(uniforms.uOghamOn.value, sc.ogham ?? 0, 2.4, dt)   // per-route
uniforms.uAEFirePow.value   = damp(uniforms.uAEFirePow.value, forge.aeFire ?? 1.0, 2.4, dt) // shared
uniforms.uTemp.value        = damp(uniforms.uTemp.value, forge.scrollDamped, 3, dt)         // shared
```

Add `ogham` to the per-route presets in `scenes.js` (e.g. `/automations` channel-hall = `1`,
`/about` altar-approach = `1`, `/pricing` stone-ledger = `0.8`, others `0`), exactly the pattern the
existing `veinScale`/`veinGlow` presets follow.

### Key uniforms & parameters

| Uniform | Range | Drives |
|---|---|---|
| `uOghamOn` | 0→1 | per-route enable (`scenes.js` preset, damped) |
| `uOghamDepth` | 0→2 | carve strength (normal perturb + POM scale) |
| `uAEFirePow` | 0→1 | **shared** divine-fire intensity — the reveal driver (same as doc 05/12) |
| `uAEFire` | world vec3 | **shared** nearest A/E divine-fire position (same uniform as the basalt) |
| `uTemp` | 0→1 | **shared** master temperature → ember pooling in the cut |
| `uOghamReveal` | 0→0.3 | legibility floor for the `static` tier |
| `OGHAM_POM` (define) | on/off | `high`-tier true-parallax carve |

---

## 5. COHESION

The Ogham is not a new visual vocabulary — it is the basalt's grammar plus the divine-fire's light:

- **One reveal value, three surfaces.** `uAEFirePow` + the `1/(1+d²·0.25)` falloff that lights the
  Ogham is the **identical** term that surfaces the serpentine green in the basalt (doc 05, line `aeFall`)
  and that makes the A/E letterforms bloom (doc 12, `vDivine`). The green rising from the stone, the
  Ogham becoming legible, and the A/E burning are **one causal event** — the world's brightest light
  hitting three materials — not three separate effects timed to look related.
- **Shared palette only.** `PAL.gold` for the white-gold rim (the same gold the divine A/E emit),
  `PAL.ember` for the heat pooling in the cut, basalt's own `PAL.void`/serpentine for the groove
  shadow. No new hex. The script reads as cut from the same stone, lit by the same fire.
- **Same carve idiom as the slab.** The normal perturbation is the slab's exact
  `normal = normalize(normal - gwBmp·u)` derivative-bump pattern (`ObsidianSlab.jsx:53`), so the
  incision shades with the same micro-relief logic as the obsidian's surface ripple and the basalt's
  grain — a continuity the eye reads as "one hand carved this world."
- **Bloom contract honoured.** The groove sits **below 1.0** (it's shadow); only the AE-lit gold rim is
  pushed `> 1`, so it — and only it — crosses `Bloom luminanceThreshold={0.55}` (`Effects.jsx:22`). The
  script glints with the same bloom character as the vein cores and the divine A/E, never washing the
  scene (the `post-fx` "only HDR blooms" rule).
- **Shared thermostat.** `uTemp` is the same `forge.scrollDamped`-driven value the slab and basalt read,
  so when the world runs hotter the ember pooling deep in the cuts intensifies in lockstep with the
  veins glowing — one temperature, every surface.
- **Same noise DNA (optional).** If we add grain/erosion to the groove edges we reuse `gw_fbm` from
  `shaders.js`, so the carving's weathering shares spatial frequency with the slab veins, the basalt
  grain, and the ember motion.
- **Brand-rule alignment.** The reveal is keyed to the A/E divine fire specifically — the canvas
  expression of the `CLAUDE.md` A+E ignite law. The same letters that ignite in the prose
  (`<BrandText>`) and in the wordmark (doc 12 `aDivine`) are the light source that makes the ancient
  Ogham readable. The brand's central rule literally illuminates the lore.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the budget master; tiers mirror the `useQuality` → `high | low | static` contract
(`forge-scene`).

- **`high`:** procedural SDF Ogham + derivative-bump carve + AE rim reveal + **clamped POM** (8–24
  samples, grazing-biased) + ember pooling, restricted to near-perpendicular routes (channel-hall
  top-down, altar). `dpr [1,2]`.
- **`low`:** SDF Ogham + derivative-bump carve + AE reveal, **no POM**. Drop the ember-pool term if
  needed. `dpr [1,1.4]`. The groove still self-shades convincingly from the perturbed normal — nobody
  sees a flat decal.
- **`static` / `prefers-reduced-motion`:** freeze `uTime` (`=2`, the slab's frozen value), no POM, hold
  the reveal at a fixed `uOghamReveal` floor (~0.25) so the script reads even without the live AE math;
  `frameloop='demand'`.

Hard rules:

1. **Cap character count per band.** Each glyph is a `min()` over up to 5 `sdSeg` calls; the band is a
   `min` over all glyphs. ~8 glyphs (40 segments) is cheap; a 60-glyph passage per pixel is not. Keep
   bands short (a word, a verse line), and if long text is needed, switch to the **option-B baked SDF
   atlas** (one texture fetch, constant cost) rather than a giant `min` chain.
2. **Evaluate `oghamBand` ONCE.** The classic mistake: sampling it in NORMAL and again in COLOR =
   double the segment cost. Compute `groove` once in NORMAL, reuse in COLOR (the snippets do this).
3. **POM is the throttle risk.** Clamp max samples to ~24 (desktop node default is 96), early-out, blue-
   noise jitter to hide banding, and `#ifdef OGHAM_POM` gated to `high`. Enable only where the camera is
   near-perpendicular — POM is cheapest perpendicular, most expensive (and most needed) grazing, so pick
   routes where grazing is brief.
4. **`fwidth`-based groove edge = scale-correct AA for free.** No MSAA for the carve edge; the
   derivative width keeps the cut ~1px crisp at any camera distance/tilt — same reasoning as MSDF AA
   (doc 12).
5. **Reuse the basalt's varyings/uniforms — add nothing redundant.** No new mesh, no decal draw, no
   second material variant. The Ogham is extra fragment math on a surface already being shaded.
6. **No EXR / no second canvas.** Procedural path ships zero assets; the option-B fallback is a single
   `.ktx2` SDF (ETC1S, `LinearFilter`, `NoColorSpace`) — never `.exr`/`.hdr` (the cardinal rule,
   `fx-resources`).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations, and the specific pitfalls:

1. **Prove the SDF Ogham as flat white-on-black FIRST.** Before any carve/reveal, render `oghamBand`
   with `smoothstep` into a debug material and confirm the stemline + four families lay out correctly,
   read left-to-right, and look like real Ogham (check glyphs against the Unicode chart U+1680–U+169F).
   Get the alphabet right before lighting it.
2. **World-space for the reveal, local-2D for the band.** The reveal/AE falloff needs `vWPos`/`vWNrm`
   (world); the band layout needs a stable local 2D coord (`vUv` or a planar projection of `vWPos`).
   Mixing them up tiles the script or breaks the falloff. Set both clearly (doc 05's varyings).
3. **Hook `#include <color_fragment>` (lit diffuse), not `<tonemapping_fragment>`.** The Ogham darkens
   albedo and adds a _lit_ gold rim; it is not pure emissive like the slab veins. Wrong hook = the
   grooves glow like lava instead of being lit like cut rock. Most likely copy-paste error.
4. **Build the AE-light reveal as the FIRST visible milestone.** It is the narrative payoff and the
   hardest thing to retrofit. Wire `uAEFirePow`/`uAEFire`, then ramp them in the `?debug` leva panel and
   confirm the Ogham literally rises out of the black as the divine light approaches — _before_ adding
   POM or ember pooling. If the reveal isn't convincing, nothing else matters.
5. **Grazing angle is where the carve lives.** Author and tune the POM/normal-perturb at a **grazing
   camera**, not head-on — a carve that looks deep perpendicular often looks flat at the raking angle the
   AE light actually hits the wall at, and vice-versa. Tune on the route's real camera.
6. **Keep the groove DARK, lift it ONLY with light.** The cut's shadow must be near-black (`×0.35`); the
   legibility must come from the AE rim, not from a baked bright fill. A pre-lit Ogham kills the "appears
   in the fire" beat and looks like a printed decal. Crushed-black grade (`BrightnessContrast`
   `brightness=-0.04`) will eat anything timid — tune on-device.
7. **Single-channel SDF, round falloff.** Don't reach for MSDF here (doc 12's tool) — Ogham has no sharp
   corners and the round SDF gives the softer groove-shadow/rim falloff you want (Red Blob Games).
8. **Verify the project way.** `qa-route`: `npm run build` green + 0 console errors @ 393×852 and
   1440×900 ≈ the GLSL compiled (SwiftShader compiles in CI, so a shader typo surfaces here). Then the
   **iPhone 15 OLED read is mandatory** — the true-black void, the reveal rising, and the bloom on the
   gold rim do not simulate headless (`shader-fx`, `post-fx`).
9. **Dispose on unmount + tier from day one.** The Ogham rides the basalt material's lifecycle
   (`useEffect(() => () => material.dispose())`); gate `OGHAM_POM` strictly by `quality==='high'` from
   the start — retrofitting tiers later is where budgets blow.

---

## 8. SOURCES (2025–2026)

1. **Red Blob Games — _Guide to SDF+MSDF Fonts_** (updated 1 Jan 2026) — single-SDF vs MSDF tradeoff;
   single-channel round SDF is preferable for **glow/shadow** (the carved-groove case); `fwidth` AA,
   `distanceRange`. https://www.redblobgames.com/articles/sdf-fonts/
2. **Jelly Renders — _2D Signed Distance Fields_** (1 Dec 2025) — modern 2D SDF primer: line-segment
   SDF, `min()` unions, building shapes from segments, normals/edges from the field. https://jellyrenders.com/2025/12/01/signed-distance-fields/
3. **GM Shaders (Xor) — _Signed Distance Fields_** (mini.gmshaders.com, 2025) — compact SDF reference
   incl. `sdSegment`, combining/insetting, and using SDF as a height field. https://mini.gmshaders.com/p/sdf
4. **Three.js Blocks — `parallaxOcclusion` (WebGPU, WebGL) node docs** (2025) — adaptive ray-march POM,
   min 24 / max 96 samples, `scale` 0.05 default, blue-noise jitter; the math to hand-port. https://www.threejs-blocks.com/docs/parallaxOcclusion
5. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_** (2026) — KTX2/Basis, LOD,
   `onBeforeCompile` variant cost, mobile VRAM budgeting, sample-count tradeoffs for POM-class effects. https://www.utsubo.com/blog/threejs-best-practices-100-tips
6. **Maxime Heckel — _Field Guide to TSL and WebGPU_** (2025) — TSL node materials, surface detail,
   WebGPU/WebGL dual-target rationale (the Phase-2 migration target for these nodes). https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text … with Three.js & TSL_** (28 Jan 2026) —
   noise-driven SDF-text material in TSL + selective bloom via MRT (the bloom-gating/cohesion reference,
   and the WebGPU SDF-text path). https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
8. **OG(H)AM Project (University of Glasgow) — _The Future of Digital Ogam: Potential Updates to the
   Unicode Ogham Block_** (Apr 2024; project active through 2025–2026) — authentic Ogham construction
   (stemline/droim, the four aicme families, stroke placement), digital rendering direction. https://ogham.glasgow.ac.uk/index.php/2024/04/24/the-future-of-digital-ogam-potential-updates-to-the-unicode-ogham-block-to-facilitate-modern-usage/
9. **Unicode 16.0.0 Core Spec, Chapter 8 (Ogham) + Ogham code chart U+1680–U+169F** (2024/2025 standard
   in force) — canonical glyph forms, the droim stemline, render LTR or bottom-to-top (never top-down),
   the SPACE-as-stemline mechanic. https://unicode.org/versions/Unicode16.0.0/core-spec/chapter-8/ ·
   https://www.unicode.org/charts/nameslist/n_1680.html
10. **BabelStone — Unicode Ogham Fonts** (maintained through 2025) — seven free Unicode Ogham font
    families across manuscript and stone-inscription styles; the bake source for the option-B SDF-atlas
    fallback. https://www.babelstone.co.uk/Fonts/Ogham.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Clamped POM for incised Ogham on mobile.** A focused pass on a hand-ported, sample-budgeted
   parallax-occlusion loop (vs the TSL node), exact grazing-angle behavior at the AE rake angle, blue-
   noise jitter for banding, and precisely how much depth sells the carve without blowing the iPhone-15
   frame — shares directly with the basalt POM deep-dive (doc 05).
2. **The AE divine-fire → carved-stone light-transport model.** A rigorous treatment of how the white-
   gold A/E light propagates onto the basalt, rakes the grooves, and produces the rim/legibility term —
   unified with the basalt green-reveal and the doc-12 letterform lighting so one light model drives all
   three reveals, physically motivated rather than faked per-route.
3. **Authoring real Ogham content: procedural-SDF vs baked single-SDF atlas.** When passages get long
   enough that the per-pixel `min()` chain costs more than a texture fetch — the crossover point, the
   BabelStone-font bake pipeline, KTX2 single-SDF settings, and a hybrid (procedural for short hero
   bands, atlas for long verses).
4. **TSL / WebGPU migration of the carve stack.** Expressing the SDF Ogham + `parallaxOcclusion` +
   triplanar basalt as composable TSL nodes (Heckel field guide; Codrops Gommage), the draw-call win, and
   mobile-Safari WebGPU support reality — the renderer-wide question shared with docs 05 and 12.
