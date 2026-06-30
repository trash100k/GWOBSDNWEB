# 24 — Ogham-Reveal Relief Authoring & the Grazing-Dot Legibility Curve

_Phase 2 deep-dive · GAELWORX forge world · cluster **D-type-knot-reveal** · target iPhone 15 OLED · one
WebGLRenderer (r3f + three.js r17x) · `MeshPhysicalMaterial` + `onBeforeCompile` · warm-forge palette ·
reads the master temperature / noise / lighting / uniform system (`00-COHESION-MAP.md`)._

> **Reads first:** `00-COHESION-MAP.md` (§1 master temperature, §4.2 the uniform pool `U`, §5.2 the A/E
> divine radiance). Phase-2 `22-ae-divine-stone-light-transport.md` (the **emitter** — the canonical
> `gw_aeLight()` returning `{fall, graze, lit, diffuse, spill}`), `11-clamped-pom-carved-stone.md` (the
> **POM march loop** + 6-tap self-shadow), `12-thin-ogham-stroke-pom-fidelity.md` (the **thin-stroke
> correctness** layers), `25-ogham-carved-stone-text.md` (the **stroke SDF** `oghamBand`/`sdSeg`/`ogChar`
> alphabet). Those docs own the light, the march, the thin-feature fixes, and the alphabet. **This doc owns
> the two questions they each leave open: (1) which relief _representation_ feeds `carveNormal` so the
> `dot(carveN, toSrc)` grazing term reads as a real chisel cut and not a painted line — geometry vs POM vs
> baked normal+AO, per tier; and (2) the exact temporal _legibility curve_ that makes the strokes appear
> for the first time without looking painted.** It is the authoring + curve authority for the
> grazing-dot read.

---

## 1. SCOPE — the moment this element delivers

The whole D-cluster narrative collapses to a single second of screen time: the eternal white-gold **A/E
divine fire** swings its light across the green-black Connemara basalt of the altar wall, and a band of
**Ogham** — a continuous stemline (the _droim_) with short score strokes in the four families (_aicme_),
read bottom-to-top up the stone edge — **rises out of pure void for the first time, legible because the
holy fire rakes it at a grazing angle**. That is the payoff. Everything in the D-cluster exists to make
that one rake-and-reveal feel ancient, sacred, and _physically real_ rather than a label fading up.

Two distinct failure modes can kill it, and they are owned by two different sub-systems:

1. **The carve reads flat / painted-on.** The strokes have lit edges but no _depth_; light doesn't pool in
   the groove, the near wall never occludes the floor at the rake angle, and the eye instantly clocks it as
   a decal printed on the rock. This is a **relief-representation** problem — what feeds the `carveNormal`
   that the grazing term `dot(carveN, toSrc)` consumes. Docs 11/12 build the POM _march_; this doc decides
   **which representation each tier should actually ship** (real geometry, live POM, or a baked
   normal+AO+height texture) so the grazing dot reads as carving on _every_ device, and specifies the exact
   normal/AO authoring that makes the dot legible.

2. **The strokes _appear_ wrong — they look painted, not revealed.** Even with perfect depth, if the band
   simply `mix()`es from black to lit albedo on a linear progress, it reads as a brightness fade — a
   Photoshop layer turning on — not as **fire crossing stone**. The reveal has to behave like _light
   sweeping across relief_: a spatial wavefront that follows the rake direction, an edge band with the
   right contrast curve, and a sub-pixel-dither / grain coupling so the first-appearance frame never shows
   a clean painted seam. This is the **legibility curve** — the temporal/spatial transfer function from
   `gw_aeLight().lit` to on-screen ink. This doc owns it.

The light itself is **not** ours: doc 22's `gw_aeLight()` is the emitter and already returns the `graze`,
`fall`, `lit`, and `spill` channels. The stroke shapes are **not** ours: doc 25's `oghamBand` SDF is the
height/mask source. The march is **not** ours: docs 11/12 own the clamped POM and its thin-feature fixes.
**Ours is the join:** how the relief is _represented_ so `carveN` is trustworthy at the rake angle, and how
`lit` is _curved_ into appearance so the strokes surface like carving caught in firelight. Authentic
construction is mandatory — real stemline, four aicme, bottom-to-top on the stone edge (doc 25 §4; Unicode
16 Ogham block).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Two landscapes, because this doc has two jobs. **Landscape I** is _relief representation_ (what authors
`carveN`/`carveH`). **Landscape II** is the _legibility curve_ (how `lit` becomes ink). Each is scored
against this build: one `WebGLRenderer`, `MeshPhysicalMaterial` + `onBeforeCompile`, no runtime EXR, the
iPhone-15 fill-rate envelope, the shared `gw_*`/`PAL`/`U`.

### Landscape I — Relief representation for the grazing-dot read

The grazing legibility term every approach must serve is, at heart,

```glsl
float dot_term = dot(carveN, toSrc);   // carveN = carved surface normal, toSrc = dir to the A/E fire
```

A real chisel cut has groove **walls** whose normals tilt sharply away from the un-incised surface plane;
when `toSrc` rakes the wall at a low angle, one wall faces the fire (`dot_term` high → lit lip) and the
opposite wall and the floor face away (`dot_term` low → pooled shadow). The whole question is: **where does
`carveN` come from, and is it trustworthy at the rake angle?** Five representations:

**A. Real carved geometry (CSG-subtract / displaced dense mesh).** `carveN` is the _actual_ shaded normal —
honest walls, honest self-occlusion from the scene, correct silhouette. _Quality:_ unbeatable; the only one
with a true silhouette. _Perf:_ fine notches need huge vertex counts; CSG is fragile; can't animate the
reveal cheaply. _Mobile:_ a non-starter for a whole band. _Fit:_ **reserve for 1–2 hero glyphs at the
closest altar focus** via `<Detailed>` LOD — where the camera is close enough that a faked silhouette
would betray itself — and fake the rest. (Confirmed by the 2025 POM survey lineage: ray-march fakes are
chosen precisely _because_ honest geometry for sub-mm relief is uneconomical — Grokipedia POM
consolidation, 2025.)

**B. Live parallax-occlusion mapping (POM) — `carveN` from the parallaxed hit, walls that occlude.**
`carveH` is ray-marched in tangent space; `carveN` is taken at the parallax-shifted hit so the wall
genuinely faces the fire and the near wall **occludes** the floor at grazing. This is the docs 11/12
mechanism. _Quality:_ the real grazing read — the one representation where `dot(carveN, toSrc)` shifts and
self-shadows as the camera/light move. _Perf:_ the most expensive per-pixel option; grazing-hungry (the
2006 Tatarchuk POM sketch and the 2025 Grokipedia survey both note step-count rises _at_ grazing — exactly
the rake angle; the Sep-2025 Blender Parallax Node ships the same adaptive-iteration loop). _Mobile:_
affordable **only** clamped (8→24 not 24→96, doc 11) + thin-feature-correct (doc 12) + gated to
close-oblique chambers. _Fit:_ **the `high`-tier hero carve.**

**C. Baked normal + AO + height texture — `carveN` sampled, no march.** Author the band once offline (the
SDF rasterized to a height map; normal map = its gradient; AO map = a cavity/occlusion bake), ship a single
small `.ktx2`, and sample `carveN` straight from the normal map with the groove darkened by the AO map.
_Quality:_ a baked normal+AO gives a **genuinely correct lit-lip / pooled-shadow read at moderate angles**
for the cost of two texture taps — and a baked AO is the one thing the live derivative-bump path _can't_
cheaply produce (true cavity occlusion, not just a normal tilt). _Perf:_ two samples, constant cost,
independent of stroke count (unlike the SDF `min()` chain). _Mobile:_ ideal — runs on `low` and feeds a
believable rake read with zero march. _Limit:_ no true parallax/occlusion — the groove won't _shift_ as the
camera moves and the silhouette stays flat at extreme grazing. _Fit:_ **the `low`-tier representation of
record and the constant-cost path for long verses** (the option-B atlas fallback docs 12/13 name). The 2025
baking guidance is explicit that baked AO/normal is the performance-correct choice for real-time/mobile
versus generating occlusion live (RapidPipeline AO-baking guide, 2025; Substance 3D AO baker docs, 2025).

**D. Live derivative-bump normal only (no march, no baked AO) — `carveN` from `dFdx/dFdy(carveH)`.** The
cheapest: perturb the normal from screen-space derivatives of the live SDF groove, the exact
`normal = normalize(normal - gwBmp*u)` idiom the obsidian slab already ships. _Quality:_ convincing
perpendicular-to-moderate; **flat at grazing** (the wall never occludes) and the derivative spans multiple
thin strokes per pixel at the rake angle → shimmer (doc 12 §B). _Perf:_ ~free. _Fit:_ the **universal floor
and `static` fallback**, but on its own it is the weakest grazing read — it is why we _add_ a baked AO (C)
on `low` rather than ship bump-only.

**E. POM/relief node in TSL/WebGPU.** The `parallaxOcclusion` node (Three.js Blocks, 2025) makes B a node
graph; clean future, wrong renderer for the judge build (doc 11 §H; `00-COHESION-MAP §10`). **Author
GLSL TSL-portable; defer.**

**Representation verdict.** This is a _tiered_ pick, not a single winner: **A** for 1–2 hero altar glyphs,
**B** (clamped, thin-feature-correct POM) for the `high`-tier band, **C** (baked normal+**AO**+height) for
`low` and long verses, **D** as the floor under everything and the `static` still. The non-obvious call
this doc adds to the cluster: **`low` should ship the baked AO (C), not bare derivative-bump (D)** — the
baked cavity AO is what makes the grazing-dot read as a _cut_ rather than a tilted-flat decal when there is
no march to occlude, and two texture taps is well inside the `low` budget.

### Landscape II — The legibility curve (how `lit` becomes ink without looking painted)

The input is doc 22's `gw_aeLight().lit` (∈ ~[0,1.6], the master reveal scalar) and its `graze`/`spill`
channels. The question is the **transfer function** from that scalar to visible Ogham, and the answer is
what separates "carving caught in firelight" from "label fading up."

**F. Linear / single-smoothstep brightness fade.** `ink = smoothstep(a, b, lit)`. _Quality:_ the painted
look. A uniform brightness ramp on the whole band reads as opacity, not light. _Fit:_ **reject as the only
curve** — it is the baseline everyone accidentally ships and the thing this doc exists to beat. (It is fine
as the _inner_ contrast curve once a wavefront and dither are layered on; see the recommendation.)

**G. Wavefront reveal (spatial gradient along the rake direction).** Drive the threshold by a **directional
coordinate** so the reveal _sweeps_ across the band in the direction the fire rakes — strokes nearest the
fire surface first, the band lights up as a moving front, not all at once. This is the Codrops
shader-reveal grammar (the GSAP/uProgress reveal lineage, 2024–2026; the Feb-2025 dissolve effect thresholds
a field against a progress uniform so pixels cross in spatial order) made _physical_ here: the "progress"
is not a timeline scrub, it is `gw_aeLight().fall` itself — distance from the fire — so the wavefront is the
falloff, automatically aimed at the emitter. _Quality:_ the single biggest "revealed not painted" win.
_Perf:_ free (reuses `fall`). _Fit:_ **mandatory — the spine of the curve.**

**H. Edge-band emission (the bright lip at the reveal front).** As the wavefront crosses each stroke, the
**transition band** — the thin region where the stroke is _just_ catching the fire — emits a hotter
white-gold lip than the settled interior, exactly like real metal/stone catching a raking light edge-on.
This is the dissolve-effect "burning edge" idiom (Codrops dissolve, Feb 2025: an emissive band tracks the
threshold crossing) and the X-ray-reveal "near-black core → bright edge" mix (Codrops Dual-Scene Fluid
X-Ray Reveal, Mar 2026, piped into the emissive channel). Here the lip is `PAL.gold` pushed >1 so it — and
only it — crosses the bloom threshold; the lip is the carving's own `graze` term spiking at the wavefront.
_Quality:_ this is what makes it read as _fire moving_ — a travelling glint, not a static fill. _Perf:_
free. _Fit:_ **mandatory — the lip is the life of the reveal.**

**I. Blue-noise / ordered-dither stippled threshold (defeats the painted seam).** A clean `smoothstep`
edge, even a moving one, draws a **mathematically perfect contour** — and a perfect contour is exactly what
reads as "painted." Real carving emerging in firelight has a _stochastic_ edge: micro-cavities and grain
catch the light unevenly. Threshold the reveal against a **blue-noise field** (or the world's existing
grain) so the wavefront edge **stipples** instead of sweeping as a clean line — the first-appearance frame
shows strokes resolving out of a fine dither, not a crisp seam (the dissolve/stipple lineage: Codrops
dissolve Feb 2025; Bart Wronski progressive stippling / blue-noise; the LOD dithered-opacity transition
pattern that ramps a blue-noise threshold to avoid a hard cut). Crucially this **doubles as the OLED
dither** the cohesion map already mandates (`§3.3`) — the same grain that kills 8-bit banding on the
void→crimson gradient breaks the reveal contour. _Quality:_ the detail that defeats "painted" at the
sub-pixel level. _Perf:_ one texture tap or a hash; ~free. _Fit:_ **mandatory — the anti-paint dither.**

**J. Heat-shimmer warp of the reveal coordinate.** Warp the wavefront coordinate by a slow `gw_fbm`/the
shared heat-haze field so the front _wavers_ like air over a forge as it crosses, not a ruler-straight
sweep. _Quality:_ a final organic touch; ties the reveal to the world's heat-haze (`§5.4`). _Perf:_ one fbm
tap (already paid if haze is on). _Fit:_ **`high`-tier polish, optional.**

**K. Halftone / print-dot quantization of the reveal.** Maxime Heckel's _Shades of Halftone_ (Feb 2026)
quantizes value into dot grids. _Quality:_ a striking _stylized_ reveal. _Tradeoff:_ it reads as **print
art**, not carved stone — wrong register for a sacred incision. **Reject the look; borrow only the insight**
that thresholding value through a structured (vs random) field changes the _texture_ of an edge — which is
exactly the spatial-vs-blue-noise choice in (I).

**Curve verdict.** The legibility curve is **G (wavefront from `fall`) → H (bright lip at the front) → I
(blue-noise stipple of the edge) → inner F (a contrast smoothstep) → optional J (shimmer warp)**. Not one
of these alone; the _stack_ is what reads as carving revealed by fire. The painted look comes from shipping
F alone; the cure is G+H+I layered on top of it.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick — Representation:** a tiered `carveN`/`carveH` source — **POM (B, clamped + thin-feature-correct,
docs 11/12) on `high`**, **baked normal+AO+height `.ktx2` (C) on `low` and for long verses**,
**derivative-bump (D) as the floor and `static` still**, and **real geometry (A) only for 1–2 hero altar
glyphs** via `<Detailed>`. All four feed the _same_ `dot(carveN, toSrc)` grazing term against the _same_
`toSrc = normalize(uAEFire - vWPos)`.

**Pick — Curve:** one shared `gw_oghamReveal()` function in `shaders.js` that turns doc 22's
`gw_aeLight()` struct into ink via the stack **wavefront (`fall`) → lip (`graze`-spiked, `PAL.gold` >1) →
blue-noise stipple → inner contrast smoothstep → optional fbm-shimmer warp**, applied identically in every
chamber and tier (terms drop, the curve's _shape_ never changes).

Why this exact split, against the world and the budget:

- **The grazing dot is only as honest as `carveN`, and `carveN` is tier-dependent — so the representation
  must be too.** On `high`, only POM gives a wall normal that _occludes_ at the rake angle (B); on `low`,
  the cheapest thing that still reads as a cut is a **baked AO+normal** (C), because a baked cavity occlusion
  is the one cue derivative-bump can't fake — and it costs two taps. Shipping bump-only on `low` is the
  trap that makes the carve flatten exactly where the fire rakes it. This is the doc's central
  recommendation and it is _not_ in docs 11/12 (which assume the live SDF height everywhere).

- **The reveal must be a _light event_, not a brightness fade — and the only way to guarantee that is to
  drive the wavefront from the falloff itself.** Using `gw_aeLight().fall` as the reveal coordinate (G)
  means the strokes nearest the fire surface first, automatically, aimed at the real emitter, on the same
  curve the basalt green and the caustic pool use (doc 22 §4). The reveal _is_ the falloff with a contrast
  curve and a stochastic edge — it can't drift from the green-reveal because it shares the input.

- **Blue-noise stipple is the difference between "revealed" and "painted," and it's already in the
  build.** The cohesion map mandates grain-as-OLED-dither at ≥0.03 everywhere (`§3.3`); reusing that field
  as the reveal threshold (I) makes the wavefront edge stipple for free and ties the carving's first frame
  to the world's grain. One field, two jobs.

- **It stays one material, one height source, one light, one curve.** The POM marches the same `oghamBand`
  SDF (doc 25) the baked map rasterizes from; both feed the same `carveN` into the same
  `dot(carveN, toSrc)`; the same `gw_aeLight()` (doc 22) drives the same `gw_oghamReveal()` everywhere.
  Depth, reveal, and light are one evaluation — they cannot drift (the `02`/`03` "one authority" lesson).

- **Correctly gated, degrades uniformly.** `high` = POM + full curve + shimmer; `low` = baked normal+AO +
  curve (no shimmer); `static` = bump + a frozen reveal floor. The grazing-dot read survives on every tier;
  what drops is parallax shift and shimmer-warp, never the _cut_ or the _wavefront_.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` **r17x** (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`; tangent basis for POM; `KTX2Loader`
  (+ local Basis transcoder) **only** for the `low`/long-verse baked normal+AO+height map.
- `@react-three/fiber`, `@react-three/drei` (in repo) — `<Detailed>` for hero-glyph geometry LOD.
- `@react-three/postprocessing` (in repo) — `mipmapBlur` bloom catches the >1 white-gold reveal lip only.
- Shared in-repo: `${GLSL_NOISE}` / `gw_*` (`src/scene/shaders.js`), `gw_aeLight`/`gw_aeFalloff` (doc 22, in
  `shaders.js`), `oghamBand`/`sdSeg`/`ogChar` (doc 25, in `shaders.js`), the POM loop + thin-feature layers
  (docs 11/12), `PAL`/`v3` (`src/scene/palette.js`), the master pool `U` (`src/scene/forgeUniforms.js`),
  `forge`/`damp`/`sceneFor` (`src/store.js`).
- **No new heavy deps. No EXR.** Optional one 512²–1024² ETC1S `.ktx2` (normal in RG, AO in B, height in A —
  one texture, four channels), `LinearFilter`, `colorSpace = NoColorSpace`. `high`/`static`/short-band path
  ships **zero new bytes** (procedural SDF).

### 4.2 The shared carve-normal contract (so every tier feeds the same grazing dot)

Whatever the tier, the consumer is identical. Define `carveH` ∈ [0,1] (1 = un-incised surface, 0 = groove
floor) and `carveN` (world-space carved normal), then everything reads them the same way:

```glsl
// toSrc = direction to the divine fire (doc 22). graze/fall/lit come from gw_aeLight().
vec3  toSrc   = normalize(uAEFire - vWPos);
float dotN    = dot(carveN, toSrc);                 // THE grazing-dot legibility term
// lip lives where the wall faces the fire; floor self-occludes where it faces away.
float lip     = pow(clamp(dotN, 0.0, 1.0), uLipPow) * carveLip;   // carveLip = groove-WALL mask (|∇carveH|)
float floorAO = mix(uGrooveAO, 1.0, carveH);        // pooled shadow in the cut (1=flat stone)
```

`carveLip` is the **groove-wall mask** — high on the cut walls (where the lip lives), low on flat stone and
the groove floor. It is `|∇carveH|` (analytic SDF gradient magnitude on POM/SDF tiers; the normal-map's
deviation-from-up on the baked tier). `uLipPow` (≈3–6) sharpens the lip so only the wall genuinely facing
the fire glints — the higher the power, the thinner and more chisel-like the lit edge.

### 4.3 Where `carveN` / `carveH` come from, per tier

```glsl
// ───── high: POM (docs 11/12) — carveN at the parallax-shifted, self-occluding hit ─────
#ifdef OGHAM_POM
  vec2  pUV; float pH; vec3 pN;
  gwOghamPOM(ogUV, vTangentView, /*out*/ pUV, /*out*/ pH, /*out*/ pN);  // doc 11/12 march
  float carveH   = pH;                                   // marched height (true occlusion)
  vec3  carveN   = normalize(mat3(modelMatrix) * pN);    // analytic-SDF gradient normal (doc 12 §B)
  float carveLip = clamp(length(vec2(dFdx(pH), dFdy(pH))) * uLipGain, 0.0, 1.0);
#else
  // ───── low: baked normal+AO+height (constant cost, no march) ─────
  #ifdef OGHAM_BAKED
    vec3  nT       = texture2D(uOghamNAH, ogUV).xyz * 2.0 - 1.0;   // tangent-space normal (RG→xy)
    nT.z           = sqrt(max(0.0, 1.0 - dot(nT.xy, nT.xy)));      // reconstruct z
    vec3  carveN   = normalize(vTBN * nT);                         // world-space carved normal
    float carveAO  = texture2D(uOghamNAH, ogUV).z;                 // baked cavity AO (the key cue)
    float carveH   = texture2D(uOghamNAH, ogUV).w;                 // baked height (for floorAO/contrast)
    float carveLip = 1.0 - carveN.z * carveN.z;                    // wall-ness from normal tilt
    floorAO       *= carveAO;                                      // multiply baked occlusion in
  #else
  // ───── static / floor: live derivative-bump from the SDF (doc 25/§D) ─────
    float ogSdf    = oghamBand(ogUV);
    float ogEdge   = fwidth(ogSdf) + 1e-4;
    float carveH   = 1.0 - (1.0 - smoothstep(0.0, 0.010 + ogEdge, ogSdf)) * uCarveDepth;
    vec2  gC       = vec2(dFdx(carveH), dFdy(carveH));
    vec3  carveN   = normalize(vWNrm - vec3(gC, 0.0) * uCarveDepth);
    float carveLip = clamp(length(gC) * uLipGain, 0.0, 1.0);
  #endif
#endif
```

The contract holds across all three: `carveN`, `carveH`, `carveLip` exist and mean the same thing, so §4.2
and §4.4 below are **tier-independent**. Only the _source_ changes; the grazing dot and the curve do not.

### 4.4 The shared legibility curve (the deliverable — add to `shaders.js`)

This is the function that makes the strokes _appear like carving in firelight_. It consumes the
`gw_aeLight()` struct (doc 22) + the carve terms above + a blue-noise tap, and returns the final ink
contribution. **Pure** (no uniform reads inside) so it inlines anywhere and ports 1:1 to TSL.

```glsl
// ── GAELWORX Ogham legibility curve ─────────────────────────────────────────
// Turns the divine-fire reveal scalar into CARVED INK that surfaces like light
// crossing relief, not a brightness fade. Stack: wavefront → lip → stipple →
// contrast → (optional) shimmer. All knobs are curve SHAPE, identical per tier.
//
// fall    : gw_aeLight().fall   — distance falloff (the wavefront coordinate)
// graze   : gw_aeLight().graze  — raking weight (lip emphasis)
// lit     : gw_aeLight().lit    — master reveal scalar
// dotN    : dot(carveN, toSrc)  — the grazing-dot legibility term (§4.2)
// carveH  : 1 flat stone, 0 groove floor
// carveLip: groove-wall mask (where the lip lives)
// noise   : a BLUE-NOISE sample in [0,1] (or the world grain) — the anti-paint dither
// edge    : reveal contour softness (≈ fwidth-scaled), keeps it ~1px crisp
vec3 gw_oghamReveal(float fall, float graze, float lit, float dotN,
                    float carveH, float carveLip, float noise, float edge,
                    float lipPow, float grooveAO){
  // 1) WAVEFRONT: the threshold is the FALLOFF, so strokes nearest the fire surface FIRST.
  //    Stipple the threshold with blue noise so the front edge is stochastic, not a clean line.
  float front  = lit + (noise - 0.5) * uStipple;          // uStipple ~0.12: dither width
  float appear = smoothstep(0.05, 0.05 + edge, front)      // base: surfaced at all
              *  smoothstep(0.0, 0.6, front);              // inner CONTRAST curve (sharpens the read)

  // 2) FLOOR SHADOW: the cut self-occludes — darkness pools where carveH is low.
  float floorShadow = mix(grooveAO, 1.0, carveH);

  // 3) THE BASE INK: serpentine stone surfacing from iron-black, gated by the wavefront.
  vec3  ironBlack  = ${v3(PAL.void)};
  vec3  serpentine = vec3(0.045, 0.115, 0.085);            // hidden, dark, desaturated (shared w/ doc 22)
  vec3  ink = mix(ironBlack, serpentine, appear * floorShadow);

  // 4) THE LIP (the LIFE of the reveal): a hot white-gold edge where the wall faces the fire
  //    AND the wavefront is crossing — a TRAVELLING glint, not a static fill. Pushed >1 → blooms.
  float wall   = pow(clamp(dotN, 0.0, 1.0), lipPow) * carveLip;
  float front2 = appear * (1.0 - appear) * 4.0;            // peaks AT the reveal front (×4 normalizes)
  float lipAmt = wall * graze * (0.6 + front2);            // settled glint + a brighter travelling front
  ink += ${v3(PAL.gold)} * lipAmt * (0.7 + lit) * 1.3;     // >1 → only this crosses the bloom threshold

  return ink;
}
```

Notes that matter:

- **`front = lit + (noise-0.5)*uStipple`** is the whole anti-paint trick: thresholding `appear` against a
  blue-noise-perturbed `lit` makes the reveal _stipple_ across the band instead of sweeping a perfect
  contour. Drop `uStipple` to 0 and you get the painted look back — it is the single knob that proves the
  point. (Blue-noise/dissolve lineage, §2-I.)
- **`appear*(1-appear)*4`** is a parabola that **peaks exactly at the wavefront** (`appear≈0.5`) and is zero
  in the already-revealed interior and the not-yet-revealed void — so the bright lip _travels_ with the
  front and settles to a dim glint behind it. This is what reads as fire moving across stone (the
  dissolve-burning-edge idiom, §2-H).
- **`lit` as the wavefront coordinate** (not a separate timeline) is what ties this to doc 22: the strokes
  surface on the _same_ scalar that lifts the basalt green and brightens the caustic pool. One fire, three
  reveals, one curve input.
- **Only the lip exceeds 1.0** (`PAL.gold * ... * 1.3`); the surfacing serpentine stays <1. So bloom
  (`mipmapBlur luminanceThreshold ≈ 0.55`) catches the travelling glint and nothing else — the palette is
  the bloom selector (`§3.1`).

### 4.5 The call site (after `#include <color_fragment>`, in the basalt/engraving material)

```glsl
// --- local 2D band coord (stable) + world-space reveal inputs (doc 22) ---
vec2 ogUV = (vUv - uOghamUV.xy) * uOghamUV.zw;          // band layout: bottom-to-top up the edge (rotate 90°)
// ... carveN / carveH / carveLip resolved per tier (§4.3) ...

vec3 toSrc = normalize(uAEFire - vWPos);
float dotN = dot(carveN, toSrc);

// doc 22 — ONE shared light model (grazeAmt 0.8 for Ogham: notches need hard raking)
GwAE ae = gw_aeLight(vWPos, carveN, uAEFire, uAEFirePow,
                     ${v3(PAL.divine)}, vec3(0.0,0.0,0.0), uRevealK, uAERange, 0.8);

// blue-noise tap = the world grain (also the OLED dither, §3.3). Screen-stable hash if no texture.
float bn  = texture2D(uBlueNoise, gl_FragCoord.xy / 64.0).r;
float edge = fwidth(ae.lit) + 1e-3;                    // fwidth-scaled → ~1px crisp at any tilt/zoom

vec3 ogham = gw_oghamReveal(ae.fall, ae.graze, ae.lit, dotN,
                            carveH, carveLip, bn, edge, uLipPow, uGrooveAO);

diffuseColor.rgb = mix(diffuseColor.rgb, ogham, uOghamOn);   // per-route enable (scenes.js), damped
```

> **Read direction:** `ogUV` is laid so `cx` runs **bottom-to-top up the stone edge** for the
> plinth/ledger inscriptions (rotate the band 90°) and left-to-right for horizontal channel-wall bands —
> the authentic monumental orientation (doc 25; Unicode 16 Ogham, never top-down).

### 4.6 The r3f hook + driving signals

```jsx
// material local uniforms (curve SHAPE + per-tier source), bound alongside the shared pool U:
const local = useMemo(() => ({
  uOghamOn:   { value: 0 },                       // per-route enable (scenes.js), damped
  uOghamUV:   { value: new THREE.Vector4(0.05, 0.1, 1.0, 1.0) },
  uLipPow:    { value: 4.0 },                     // wall-glint sharpness (chisel thinness)
  uLipGain:   { value: 6.0 },                     // groove-wall mask gain
  uGrooveAO:  { value: 0.30 },                    // how dark the cut floor pools (×0.30)
  uStipple:   { value: 0.12 },                    // blue-noise reveal-edge width (THE anti-paint knob)
  uCarveDepth:{ value: 0.06 },                    // bump/POM groove depth
  uOghamReveal:{ value: 0.0 },                    // static-tier legibility floor
}), [])

// tier gating (defines compile the right carveN source — zero runtime branch):
if (quality === 'high') m.defines.OGHAM_POM   = ''
else if (quality === 'low') m.defines.OGHAM_BAKED = ''     // baked normal+AO+height .ktx2
// static: neither define → live derivative-bump floor

// useFrame — uAEFire / uAEFirePow / uTime driven ONCE by <ForgeDriver/> into U (doc 22 §4.8).
// Only LOCAL look knobs damped here:
const sc = sceneFor(forge.route)
local.uOghamOn.value = damp(local.uOghamOn.value, sc.ogham ?? 0, 2.4, dt)
```

Per-route presets in `scenes.js` (the existing `veinScale`/`veinGlow` pattern): `/about` altar-approach
`ogham 1` (the keystone), `/automations` channel-hall `1`, `/pricing` stone-ledger `0.8` (bottom-to-top
edge verse), others `0`. On `static`, hold `uOghamReveal ≈ 0.22` so a dim, dignified inscription reads
without the live AE math, `uStipple` frozen.

### 4.7 Key uniforms / params (tuning table)

| Uniform | Source | Range | Drives |
|---|---|---|---|
| `uAEFire` (vec3) | `U` / ForgeDriver | world | nearest A/E divine-fire position — `toSrc` + falloff |
| `uAEFirePow` | `U` / ForgeDriver | 0..~1.5 | divine-fire intensity — the reveal driver (shared, doc 22) |
| `uLipPow` | local | 3..6 | grazing-dot lip sharpness (chisel thinness of the lit edge) |
| `uStipple` | local | 0..0.2 | **blue-noise reveal-edge width — the anti-paint knob** (0 = painted) |
| `uGrooveAO` | local | 0.2..0.4 | pooled-shadow darkness in the cut floor |
| `uCarveDepth` | local | 0..0.1 | groove depth (POM scale / bump strength) |
| `uOghamOn` | local ← `scene.ogham` | 0..1 | per-route Ogham enable (damped) |
| `uOghamReveal` | local | 0..0.3 | `static`-tier legibility floor |
| `OGHAM_POM` / `OGHAM_BAKED` (defines) | tier | on/off | which `carveN` source compiles |

### 4.8 TSL-portable mirror (forward path, authored now)

```js
// three/tsl — gw_oghamReveal as a node Fn (Heckel Field Guide 2025; webgpu parallaxOcclusion node 2025)
const gwOghamReveal = Fn(([fall, graze, lit, dotN, carveH, carveLip, noise, edge, lipPow, grooveAO]) => {
  const front  = lit.add(noise.sub(0.5).mul(uStipple))
  const appear = smoothstep(0.05, edge.add(0.05), front).mul(smoothstep(0.0, 0.6, front))
  const floorS = mix(grooveAO, 1.0, carveH)
  const ink    = mix(ironBlack, serpentine, appear.mul(floorS)).toVar()
  const wall   = dotN.clamp(0,1).pow(lipPow).mul(carveLip)
  const front2 = appear.mul(appear.oneMinus()).mul(4.0)
  ink.addAssign(gold.mul(wall.mul(graze).mul(front2.add(0.6))).mul(lit.add(0.7)).mul(1.3))
  return ink
})
// bloom reads a dedicated MRT emissive attachment (setMRT) → EXACT selection of the gold lip.
```

---

## 5. COHESION — how this binds the one world

- **The grazing dot reads the same light every other reveal reads.** `toSrc`, `fall`, `graze`, `lit` all
  come from doc 22's single `gw_aeLight()` (one `uAEFire`/`uAEFirePow` from the pool `U`, written once by
  `<ForgeDriver/>`). The Ogham surfacing, the basalt green lifting, and the caustic pool brightening are
  **one causal event on one curve input** — the carving cannot rise at a different distance than the green
  (`00-COHESION-MAP §5.2`; doc 22 §5).
- **One height source, three consumers.** The POM marches and the baked map rasterizes from the _same_
  `oghamBand` SDF (doc 25) the reveal reads — depth, mask, and ink are one definition. The `carveN`
  contract (§4.2) means every tier feeds the identical grazing term.
- **One palette, one bloom contract.** `PAL.void` iron-black, the shared serpentine, `PAL.gold` for the
  travelling lip, `PAL.divine` as the light's own color — all `v3(PAL.x)`, no raw hex. Only the lip exceeds
  1.0, so the shared `mipmapBlur` catches _exactly_ the white-gold glint and nothing else (`§3.1`, the
  palette is the bloom selector).
- **One grain, doing double duty.** The blue-noise field that stipples the reveal edge (§4.4) **is** the
  OLED triangular-dither grain the cohesion map mandates at ≥0.03 (`§3.3`). The same noise that kills
  void→crimson banding breaks the reveal contour — one field, the carving's first frame tied to the
  world's grain.
- **One temperature, independently warming the stone.** The cut pools `PAL.ember` when `uTemp` runs hot
  (the world heating), while the **divine fire never reads `uTemp`** (the keystone, `§1.4`) — the stone
  the fire lights warms ambiently; the fire itself stays white-gold. Correct and shared.
- **Same carve idiom as the slab.** The derivative-bump floor (§4.3) is the slab's exact
  `normal = normalize(normal - gwBmp·u)` pattern (`ObsidianSlab.jsx`), so the incision shades with the same
  micro-relief logic as the obsidian ripple — one hand carved the world.
- **Brand-rule alignment.** The reveal is keyed to the A/E divine fire specifically — the canvas expression
  of the `CLAUDE.md` A+E ignite law. The same letters that ignite in prose and the wordmark are the light
  that makes the ancient Ogham readable.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The curve (`gw_oghamReveal`) is **cheap by design** — a handful of `smoothstep`/`mix`/`pow`, one blue-noise
tap, no branch, no extra pass; the budget pressure is the _representation_ (the POM march), never the
curve. Tiering mirrors `useQuality` (`high | low | static`):

- **`high`:** POM `carveN` (clamped 8→24 + thin-feature, docs 11/12) + full curve (wavefront + lip +
  stipple + contrast + **shimmer warp J**). `dpr` capped 1.5. Gated to **close-oblique chambers only**
  (altar `/about`, contact `/contact`, ledger `/pricing`) — POM barely reads top-down, so the channel-hall
  `/automations` floor uses the baked/bump path even on `high`. 1–2 hero altar glyphs may be real geometry
  via `<Detailed>`.
- **`low`:** **baked normal+AO+height `.ktx2`** `carveN` (two taps, constant cost) + curve **without
  shimmer**. The baked cavity AO is what keeps the grazing-dot reading as a _cut_ with no march. `dpr 1.4`.
- **`static` / `prefers-reduced-motion`:** derivative-bump `carveN`, freeze `uTime = 2`, hold
  `uOghamReveal ≈ 0.22` and `uStipple` frozen so a dim Ogham reads without live AE math; `frameloop='demand'`.
  Dignified frozen still, never broken.

Hard rules:

1. **Evaluate the carve source ONCE.** Resolve `carveN`/`carveH`/`carveLip` once (§4.3) and feed both the
   grazing dot _and_ the curve from it — never march/sample twice (the classic doc-25 §6 double-cost bug).
2. **The stipple tap is the grain tap.** Reuse the world's blue-noise/grain texture (`§3.3`) for
   `uBlueNoise`; do not add a second noise texture. If no texture is bound, a `gl_FragCoord` hash is the
   `static` fallback.
3. **Lip-only bloom.** Keep everything but the `PAL.gold` lip < 1.0 so the half-float buffer +
   `mipmapBlur resolutionScale 0.5` don't mip the dark surfacing stone (`§6`, `§10`).
4. **Cap character count per procedural band.** Each glyph is a `min()` over up to 5 `sdSeg` calls; ~8
   glyphs is cheap, a 60-glyph verse per pixel is not. Long passages → the **baked normal+AO+height path**
   (constant cost) on _every_ tier, not a giant `min` chain (docs 12/13 crossover).
5. **POM is the throttle risk, not the curve.** All the doc-11/12 POM discipline applies (early-out,
   blue-noise jitter, `#ifdef OGHAM_POM`, near-perpendicular routes). The curve is free; never let it tempt
   a POM promotion on `low`.
6. **`fwidth`-scaled `edge` = scale-correct AA for free.** The reveal contour and the groove stay ~1px
   crisp at any camera distance/tilt — no MSAA (doc 25 §4; Red Blob Games `fwidth` AA).
7. **`dispose()` + `renderer.info.memory` flat across navigation.** The Ogham rides the basalt material's
   lifecycle; the one optional `.ktx2` is bundled, never fetched as EXR.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

1. **Prove the SDF Ogham as flat white-on-black FIRST (doc 25 §7.1).** Confirm stemline + four aicme,
   bottom-to-top up the edge, glyphs matched to Unicode U+1680–U+169F — _before_ any carve or curve. Get
   the alphabet right before lighting it.
2. **Build the carve-normal contract (§4.2) and the grazing dot SECOND, on the derivative-bump floor.**
   In `?debug`, sweep a fake `uAEFire` around the band and confirm `dot(carveN, toSrc)` lights the wall
   facing the fire and pools shadow on the opposite wall — _at a grazing camera, not head-on_. The carve
   that looks deep perpendicular often looks flat at the rake angle the fire actually hits (doc 25 §7.5).
   If the dot doesn't read as a cut on bump-only, the baked AO (`low`) and POM (`high`) won't save it —
   fix the contract first.
3. **Build the legibility curve THIRD — and prove it isn't painted by toggling `uStipple` to 0.** With
   `uStipple=0` you get the painted single-smoothstep fade; ramp it to 0.12 and watch the wavefront edge
   _stipple_ into existence. That A/B is the acceptance test for "revealed, not painted." Then confirm the
   `appear*(1-appear)` lip _travels_ with the front (the parabola peaks at the wavefront), not a static fill.
4. **Drive the wavefront from `ae.fall`, never a private timeline.** If the reveal uses its own progress
   uniform instead of the falloff, it drifts from the basalt green-reveal and the "one fire" illusion
   breaks (doc 22 §7.8). The reveal coordinate _is_ the falloff.
5. **World-space for the dot, local-2D for the band.** `dot(carveN, toSrc)` and `fall` need
   `vWPos`/world `carveN`; the band layout needs a stable local 2D (`ogUV`). View-space normals make the
   grazing term swim with the camera — the single most likely silent bug (doc 22 §7.2).
6. **Hook `<color_fragment>` (lit albedo), not `<tonemapping_fragment>`.** The Ogham darkens/ surfaces
   albedo and adds a _lit_ gold lip; only the lip is emissive-HDR. Copy-pasting the slab's emissive hook
   makes the whole groove glow like lava instead of being lit like cut rock (doc 25 §7.3).
7. **Keep the groove DARK; lift it ONLY with light.** The cut floor is near-black (`uGrooveAO ≈ 0.30`); the
   legibility comes from the lip + wavefront, not a baked bright fill. A pre-lit Ogham kills the "appears in
   the fire" beat and reads as a printed decal. The crushed-black grade (`BrightnessContrast brightness ≈
   -0.04`) eats anything timid — tune on-device (doc 25 §7.6).
8. **`low` ships baked AO, not bump-only.** The non-obvious budget call (§3): on `low`, two texture taps
   for a baked cavity AO is what makes the grazing dot read as a cut without a march. Don't "save" them and
   ship bump-only — the carve flattens exactly where the fire rakes it.
9. **Single-channel round SDF, not MSDF.** Ogham has no sharp corners; the round SDF gives the softer
   groove-shadow/lip falloff the carve wants (Red Blob Games; doc 25 §7.7).
10. **Verify the project way, then the device.** `qa-route`: `npm run build` green + 0 console errors @
    393×852 and 1440×900 (SwiftShader compiled the GLSL — a typo surfaces here). Then the **iPhone-15 OLED
    read is mandatory** — the strokes stippling out of true black, the travelling white-gold lip, and the
    bloom on it do not simulate headless (`shader-fx`, `post-fx`).

---

## 8. SOURCES (2025–2026)

1. **Parallax Occlusion Mapping — Grokipedia (2025 consolidation)** — adaptive sample count (16–32, up to
   50 at oblique angles to minimize aliasing), the grazing-angle cost rise, POM-vs-relief tradeoff, and
   "parallax works well for carvings"; the survey basis for the representation tiering and why honest
   geometry for sub-mm relief is uneconomical. https://grokipedia.com/page/Parallax_occlusion_mapping
2. **Parallax Node — Blender Extensions (released Sep 2025)** — a 2025 POM implementation: multi-iteration
   height-map sampling, per-iteration UV-offset refinement, depth that responds to view angle; a current
   reference that the adaptive POM loop is live, shipping tech in 2025.
   https://extensions.blender.org/add-ons/parallax-node/
3. **Codrops — "Implementing a Dissolve Effect with Shaders and Particles in Three.js" (Feb 17, 2025)** —
   thresholding a noise field against a progress uniform so pixels cross in spatial order, with an emissive
   "burning edge" band tracking the threshold crossing; the direct reference for the wavefront (G), the
   travelling lip (H), and the stippled edge (I) of the legibility curve.
   https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/
4. **Codrops — "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js" (Mar 23, 2026)** — a
   Fresnel/grazing term piped into the emissive channel with a near-black-core → bright-edge mix and a
   smoothstep fade-to-black; the "dark by default, light only where raked" grammar the grazing-dot reveal
   implements. https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
5. **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text … with Three.js & TSL" (Jan 28, 2026)** —
   noise-driven SDF-text material in TSL with selective bloom via MRT; the SDF-text-as-reveal-surface +
   exact-bloom reference and the TSL-portable target for `gw_oghamReveal`.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
6. **Maxime Heckel — "Shades of Halftone" (Feb 2026)** — thresholding value through a _structured_ field
   (dot grids at angles) vs a random one changes an edge's texture; the insight (rejected as a _look_)
   behind the blue-noise-vs-ordered choice for the reveal contour. https://blog.maximeheckel.com/posts/shades-of-halftone/
7. **RapidPipeline — "How to Bake AO Maps Like a Pro" (2025)** + **Adobe Substance 3D — Ambient Occlusion
   Baker docs (2025)** — baked AO/normal as the performance-correct choice for real-time/mobile vs
   generating occlusion live; the basis for the `low`-tier baked normal+AO+height representation.
   https://rapidpipeline.com/en/a/how-to-bake-ao-maps-like-a-pro/ ·
   https://helpx.adobe.com/substance-3d-bake/bakers-settings/ambient-occlusion.html
8. **Hoetzlein — "Projective Displacement Mapping for Ray Traced Editable Surfaces" (CGF / arXiv
   2502.02011, Feb 2025)** — thin-feature sampling + smoothed displaced normals for carved relief at
   grazing angles; the origin (ported _in spirit_ via docs 11/12) of the trustworthy thin-stroke `carveN`
   this doc's grazing dot depends on. https://arxiv.org/abs/2502.02011
9. **Three.js Blocks — `parallaxOcclusion` node docs (2025)** — adaptive ray-march (min 24 / max 96),
   `scale` 0.05, blue-noise jitter, depth output; the canonical POM math the `high`-tier `carveN` source
   hand-ports (clamped) and the TSL forward path. https://www.threejs-blocks.com/docs/parallaxOcclusion
10. **Three.js r178 release (80.lv coverage, Jul 2025)** — the r17x line in repo (Float16Array renderer
    support, reflection/chromatic-aberration demos); confirms the WebGL `onBeforeCompile` + half-float
    bloom path this build ships on. https://80.lv/articles/three-js-178-is-now-available
11. **Red Blob Games — "Guide to SDF + MSDF Fonts" (updated Jan 1, 2026)** — single-channel round SDF is
    preferable for glow/shadow (the carved-groove case) and `fwidth` AA; why the Ogham SDF and the reveal
    contour use single-SDF + `fwidth`, not MSDF. https://www.redblobgames.com/articles/sdf-fonts/
12. **Tatarchuk — "Practical Parallax Occlusion Mapping" (re-surfaced via the 2025 Grokipedia/Blender POM
    lineage)** — the foundational adaptive-step + soft self-shadow POM that the clamped mobile loop
    descends from; cited for the grazing-angle step-count and soft-shadow accumulation the carve depends
    on. https://advances.realtimerendering.com/s2006/Tatarchuk-POM.pdf

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The baked normal+AO+height authoring pipeline for `low`/long-verse Ogham.** The exact offline bake of
   `oghamBand` → a 4-channel ETC1S `.ktx2` (normal RG, AO B, height A): rasterization resolution vs stroke
   width, max-mip for the POM clamp (doc 12 §C), the KTX2 settings, and the crossover glyph-count where the
   baked path beats the procedural `min()` chain on _every_ tier (shared with docs 12/13).
2. **The grazing-dot lip as a function of POM groove depth (`graze × carveH`).** The precise coupling that
   makes notches surface _harder_ than flat stone in the same divine light — tying the lip's `dotN`/`graze`
   to the marched groove depth so the carving "pops" out of the green at the reveal moment, on a clamped
   mobile POM budget (the candidate doc 22 §9.2 also names).
3. **Reveal-edge field selection: blue-noise vs interleaved-gradient vs the world grain.** A look-dev A/B
   of which stochastic field gives the most "stone-emerging-from-firelight" reveal contour on the OLED —
   and whether the reveal stipple and the OLED dither can truly be _one_ field at one strength without
   either job suffering.
4. **TSL/WebGPU migration of the carve+reveal stack.** Expressing the per-tier `carveN` source +
   `gw_oghamReveal` + MRT-emissive lip bloom as composable nodes (Heckel Field Guide; Codrops Gommage), the
   draw-call/bloom-exactness win, and the mobile-Safari WebGPU reality — the renderer-wide question shared
   with docs 11/12/22/25.
