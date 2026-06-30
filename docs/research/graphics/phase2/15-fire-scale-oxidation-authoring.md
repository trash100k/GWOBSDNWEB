# 15 — Procedural Fire-Scale & Temper-Color Oxidation Authoring

_Phase 2 deep-dive · GAELWORX forge world · cluster **B-stone-glass-surfaces** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js), no runtime EXR._

> **What this doc owns, and how it differs from `08-worley-cooling-crust-system` and
> `10-basalt-green-reveal-transport`.** Doc 08 promoted `gw_worley` into a dedicated **crack-network
> system** on the cooled letterform (nucleation, front-driven growth, ember roots) and settled the
> bake-vs-live cost question. Doc 10 built the **basalt green-reveal + heat-stain** light-transport model.
> **This doc owns the third leg that ties them together as one continuous surface phenomenon:**
> (1) the **flake morphology** of the oxide scale itself — the Worley-cell *plate* silhouette, plate-edge
> spalling, and the layered FeO/Fe₃O₄/Fe₂O₃ thickness read, authored as a reusable `gw_flake()` field;
> (2) the **temper-color oxidation sequence** — the physical blue→straw→violet thin-film interference march,
> deliberately **desaturated and warm-clamped** so it never reads cool/off-brand, packaged as `gw_temper()`;
> and (3) the **crack-network topology continuity** — one fracture graph that runs *unbroken* from a cooled
> letter, across the basalt channel lip, and out into the divine-fire radiance, so the eye never sees a seam
> between letter, stone, and light. It is held to the `00-COHESION-MAP` contract: one temperature signal,
> one noise basis (`gw_worley`/`gw_fbm`), one palette, **flake/temper high-tier with hard fallbacks on
> low/static**, and the A/E divine-fire keystone (the divine glyphs never scale, never temper, never crack).

---

## 1. SCOPE — this element in the GAELWORX world

When the molten GAELWORX pour fills a letterform and that letter cools through the master ramp
(white-hot → orange → forge-red → iron-black), the *surface* of the cooling iron does not just darken — it
**oxidizes**. A real forged casting cools wearing a skin of fire-scale: a brittle, cellular oxide crust that
flakes into polygonal plates, tinted by thin-film interference into the bladesmith's temper palette, cracked
by thermal-contraction stress into a fracture network. This is the **surface-authoring layer** that sits on
top of doc 08's crack *system* and doc 10's basalt *reveal*, and binds them into one substance.

Three readable behaviors this doc owns, none of which docs 08/10 fully resolve:

1. **Worley-cell flake morphology.** The oxide scale is not a uniform film — it is a mosaic of raised
   polygonal *plates* (the Worley **F1** cell interiors), separated by creased crack seams (the **F2−F1**
   boundary channel), with plate *edges* that lift and spall (a derivative-driven rim term). The plate
   silhouette is angular (Chebyshev-blend), the plate surface carries a layered FeO/Fe₃O₄/Fe₂O₃ thickness
   variation, and the whole field reads as *forged scale*, not painted rust. This is `gw_flake()`.

2. **The temper-color oxidation sequence, warm-clamped.** Heated iron in air grows an oxide film whose
   thickness drives thin-film interference, marching the surface through **pale-straw → gold → bronze →
   purple → blue** (the BSSA/bladesmith chart) as temperature/time rises. GAELWORX wants the *physical
   credibility* of this march but **not its cool tail** — purple and blue are a brand violation (no
   cool/green/blue in the warm grade, `00-COHESION-MAP §3.3`). The pick is a **low-saturation, warm-clamped**
   temper ramp: we keep the straw/gold/bronze body, fold the violet into a *desaturated dusky-rose ember*,
   and refuse blue entirely — so the oxidation reads as authentic temper iridescence that *never goes cold*.
   This is `gw_temper()`.

3. **Crack-network topology that continues unbroken.** The single most cohesion-critical behavior: the
   fracture graph on a cooled letter must **continue, as the same graph, into the basalt channel walls and
   into the divine-fire radiance**. A crack that terminates exactly at the letter's silhouette reads as a
   decal; a crack that runs from the iron-black serif, across the channel lip it sits in, and dissolves into
   the white-gold A/E spill reads as *one cracked surface lit by one fire*. This is achieved by sampling the
   **same `gw_worley` field in shared world-space** for letter, channel, and the reveal mask — never per-glyph
   UV — so the cell layout is continuous across material boundaries.

The cardinal failure this guards against: oxide scale that looks like a **tiled rust texture stamped onto the
letter** (forks its own noise, its own orange, terminates at the glyph edge, and tempers into cold blue).
The fire-scale must be **the same metal's own skin, at the cold end of the one cooling timeline, cracked by
one continuous field, tinted by one warm-clamped temper ramp, lit by one fire.**

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Each approach rated **quality / perf / mobile / complexity** against the hard constraint: one WebGL
renderer, `onBeforeCompile` GLSL, iPhone-15 fill-rate budget, no EXR, sharing `gw_worley`/`gw_fbm` and the
master temperature field.

### 2.A Worley F1/F2 plate morphology (the flake silhouette) — adopted
F1 (distance to nearest seed) gives the flat plate interiors; F2−F1 gives the inter-plate crack channel;
a **derivative of F2−F1** along the gradient gives the plate-edge lift/spall. The Dec-2025 Three.js Roadmap
*10 Noise Functions for TSL Shaders* ships the 3×3 cellular search with TSL+GLSL parity and names exactly
this: "*The result looks like cells, cracks, or organic structures…stone/tile textures, cracked surfaces,
scales*," with **F1 cells vs F2−F1 cracks** and FBM-Worley for lacunarity detail. The Apr-2025 Sangil Lee
*Understanding the Variations of Cellular Noise* catalogs F1/F2/F2−F1 and the distance metrics. This is the
established flake primitive.
- Quality: **highest** for cellular scale. Perf: the 3×3 search is the most expensive primitive in the
  toolkit. Mobile: **high-tier** (or baked, per doc 08). Complexity: **medium**.
  → **The flake-morphology primitive; reuses doc 08's `gw_worley`, adds the plate-edge spall term.**

### 2.B Layered-thickness FBM-Worley (the FeO/Fe₃O₄/Fe₂O₃ read) — adopted
Real scale is three oxide layers of differing thickness (Springer 2025 thermophysical-properties paper). We
fake the layered look by modulating the *temper thickness parameter* with a second, finer `gw_fbm` octave
masked into the plate interiors — so each plate carries a subtle thickness gradient (and therefore a subtle
temper-color gradient), exactly as a real scale plate shows banded interference. The Dec-2025 Roadmap's
FBM-Worley (lacunarity/gain) is the mechanism; we drive *thickness*, not displacement.
- Quality: **high** (the banded-plate read that sells "oxide" over "rust"). Perf: **+1 fbm octave** inside
  the plate mask only. Mobile: high/low. Complexity: **low** (one extra sample, gated by the plate mask).
  → **Adopt — the thickness modulator feeding `gw_temper`.**

### 2.C Temper-color via thin-film interference (physical, full march) — adapted, warm-clamped
The physically-correct path: model the oxide film thickness → optical path difference → interference color,
which marches straw→brown→**purple→blue** with thickness. The metallurgy is well-documented (BSSA *Heat Tint
(Temper) Colours*; the 2026 Sheffield/Raykam tempering guides; the Cambridge phase-trans oxide notes). The
2025-2026 graphics analog is the thin-film iridescence lane — three.js `MeshPhysicalMaterial.iridescence`
(thickness/IOR), the DerSchmale thin-film approach, and Nikos Papadopoulos's Aug-2025 *foil sticker* write-up
(angle-based color shift via thin-film interference). **But** the full march is a **brand violation**: its
cool purple/blue tail breaks `00-COHESION-MAP §3.3` (no cool hue in the warm grade). The adaptation: keep the
interference *mechanism* (thickness → hue march) but **author the ramp on warm-clamped, low-saturation
stops** — straw → gold → bronze → dusky-rose ember, with the violet folded to desaturated rose and blue
removed. Saturation is held low so even the warmest temper never reads as a candy iridescent foil.
- Quality: **high + on-brand** (authentic temper credibility, zero cool cast). Perf: **free** (a color ramp,
  not a real thin-film BRDF). Mobile: every tier. Complexity: **low**.
  → **The temper mechanism; the warm-clamp is the GAELWORX-specific art-direction (§3).**

### 2.D True `MeshPhysicalMaterial.iridescence` / angle-dependent thin-film BRDF — rejected for the hero
Use three's built-in `iridescence`/`iridescenceThicknessRange` (a real view-angle-dependent thin-film term)
to get physically-correct temper that shifts with viewing angle. The threejs docs + DerSchmale lab confirm
it is available and correct. **But** (1) it is **view-dependent** — the temper color would *swim* as the
camera moves, reading as an oily foil rather than a fixed oxide stain, the opposite of the "stone took the
heat" read; (2) its hue is driven by physics, not the brand ramp, so it will produce the cool blue tail we
must forbid; (3) it costs a full BRDF lobe per fragment. For a stylized warm forge the fixed,
thickness-driven, brand-anchored ramp (2.C) is both cheaper and on-brand.
- Quality: **physically highest**, but off-brand and swimming. Perf: BRDF lobe. Mobile: high-tier only.
  Complexity: medium.
  → **Rejected for the temper stain; named as a §9 candidate for the jewel-chamber's *intended* iridescence
  (where view-dependent play-of-color is correct), never for the oxide scale.**

### 2.E Continuous world-space cell field (the crack-continuity mechanism) — adopted
The continuity insight: if the letter samples `gw_worley` in **glyph-local UV** and the basalt samples it in
**world space**, their cell layouts are unrelated and the crack network *visibly breaks* at the glyph
silhouette. The fix is to sample the **same `gw_worley(worldPos · scale)`** for the letter crust, the channel
wall, and the reveal mask — one field in one space — so a cell that starts on the iron letter *continues* onto
the basalt lip it rests in. The May-2026 Codrops *Shader.se WebGPU pipeline* (single-renderer, shared
scroll-coupled uniforms across scenes) and the Apr-2026 Codrops *More Than a Portfolio* (a fracture pattern
"sculpted so it reads correctly from multiple camera angles," cracks-as-narrative-beat) both validate
authoring **one continuous fracture field** across a scene rather than per-object decals. This is the
cohesion payoff and the reason this is a B-cluster (stone+surface) topic, not just an F-noise one.
- Quality: **decisive** for the "one cracked surface" read. Perf: **free** (it's a coordinate-space choice,
  not extra work). Mobile: every tier. Complexity: **low** (share the world-space sample point + scale).
  → **Adopt — the crack-continuity contract; the single most important idea in this doc.**

### 2.F Baked flake/temper atlas (the cost answer) — adopted on high, per doc 08
Per doc 08 §2.B/2.C, the flake *network* is intrinsically static in world/UV space (the wordmark and channels
do not move), so bake `vec4(F1, F2−F1, thickness, plateEdge)` once and collapse the 3×3 loop + extra octaves
to **one fetch**. The 2026 utsubo *100 Three.js Tips* ("bake what you can") and Heckel's Oct-2025 *Field Guide
to TSL and WebGPU* (compute pass → storage texture) are the authority. Only the *temper march* and the
*fracture growth* stay live (cheap analytic functions of the shared `temp`). For crack continuity the bake
must be in the **shared world-space projection**, not per-glyph, so the baked field is continuous across the
letter/channel boundary.
- Quality: **identical** (static field). Perf: **excellent** (one fetch). Mobile: **green**. Complexity:
  medium (the world-space bake + channel packing).
  → **Adopt for high; the live search only where a chamber needs drifting cells (none currently).**

### 2.G Crack-junction vector extraction & ping-pong fracture state — rejected (same as doc 08)
True vector crack lines (Dec-2025 TouchDesigner Voronoi-fracture lesson) and ping-pong GPGPU fracture state
(Heckel 2025 compute-state textures) are the gold standard for *shatter-into-shards* and *healing/re-melt*
beats. For a cooled letter the growth is monotonic, so analytic `smoothstep(temp)` is visually identical at
zero RT cost.
- → **Rejected for the cooled-scale hero; the §9 candidates for a strike-shatter / re-melt beat.**

### 2.H TSL `Fn()` + MRT-tagged ember roots (the forward port)
On `WebGPURenderer`, `gw_flake`/`gw_temper` become reusable `Fn()` nodes; the field is baked by a compute
pass to a storage texture (Heckel 2025); the glowing crack roots write to a dedicated **MRT `emissive`**
attachment so bloom catches the seams exactly (Jan-2026 Codrops *WebGPU Gommage* MRT-on-text pattern). The
judge device runs WebGL2 + the `@react-three/postprocessing` composer, so this is the port target.
- → **Author the GLSL pure-functions TSL-portable; ship GLSL, gate WebGPU post-judge.**

**Landscape verdict.** Fire-scale = **2.A flake morphology + 2.B layered thickness + 2.C warm-clamped
temper + 2.E world-space crack continuity + 2.F baked field on high**, hard fallback to a flat warm-iron
oxide tint on low/static, A/E clamped to divine fire. View-dependent iridescence (2.D), vector cracks /
ping-pong state (2.G) are named §9 candidates; TSL/MRT (2.H) is the port.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship two pure GLSL blocks in `src/scene/shaders.js` — `gw_flake()` and `gw_temper()` — that together author
the oxide fire-scale on top of doc 02's cooled-letter metal and doc 10's basalt: `gw_flake` reads the
*world-space* baked `vec4(F1, F2−F1, thickness, plateEdge)` (one fetch on `high`) or the live `gw_worley`,
producing plate mask / crack channel / spall rim; `gw_temper` maps the per-plate oxide thickness to a
warm-clamped low-saturation temper ramp anchored on `PAL`; the crack roots glow `gw_forge` from the master
ramp; the whole field is sampled in shared world space so the network is continuous from letter to channel
to divine-fire reveal; multiplied to zero on low/static and for the A/E.** Justification:

1. **It is the *oxide skin* of the one cooling timeline, not a new effect.** The temper march and the
   fracture growth are both driven by `temp = gwCool(age, k)` (doc 02) — the *same* clock that cools the
   letter's body color. As the metal cools, the oxide thickens (temper marches up) and the scale cracks
   (fracture grows). One clock, no second orange, no second noise.

2. **Warm-clamping the temper ramp is the on-brand resolution of real metallurgy.** We get the *credibility*
   of thin-film temper colors (straw/gold/bronze) without the *cost* of a real iridescence BRDF and without
   the *brand violation* of the cool purple/blue tail. Saturation is held deliberately low so the temper
   never reads as a gaudy foil — it reads as iron that took heat. This is the doc's signature contribution:
   the physical sequence, kept warm and quiet.

3. **World-space sampling makes the crack network continuous — the cohesion keystone of this doc.** Sampling
   `gw_worley(worldPos · uCellScale)` for the letter crust, the channel wall (doc 10), and the reveal grazing
   mask means a crack that starts on the iron serif *continues* across the basalt lip and dissolves into the
   A/E spill. The eye reads one cracked surface, one fire — never a decal stamped on a glyph.

4. **Baking the world-space field is the cost answer (doc 08, reaffirmed).** One fetch replaces the 3×3 loop
   + the layered-thickness octave; the temper and growth stay live and analytic. The bake is in the *shared*
   projection so continuity survives baking.

5. **Every color is the master ramp or `PAL`, reused.** Crack roots = `gw_forge(temp+Δ)` (byte-identical to
   slab veins). Iron-black plates = `gw_forge` at low temp / `PAL.void`. Temper stops = `PAL`-anchored warm
   hues. The scale adds *where* and *how thick the oxide is*, never a private color.

6. **The A/E exception is one multiply.** `flake *= (1−uIsAE)`; `temper` is bypassed; `metal = mix(metal,
   gw_divineFire(flick), uIsAE)`. The divine glyphs never scale, never temper, never crack — they never cool.

7. **It degrades uniformly to a flat warm-iron tint.** `high` = baked flake + temper + spall + continuity;
   `low` = no Worley, a single `gw_temper(uTemp·k)` warm wash over doc-02's cooled metal (oxide *color*
   without the cellular *structure*); `static` = frozen, a fixed warm-iron oxide tone. A tier drop removes the
   cellular layer cleanly — still on-brand tempered iron, just without the forged-scale fracture.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new dependency)
- `three` (repo r17x line; **WebGL `onBeforeCompile` path**). r185 (2026) is the TSL-portability target, not
  the ship renderer.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `maath` (`damp`), `leva`
  (`?debug`). All present.
- Reuse `GLSL_NOISE` (`gw_snoise`, `gw_fbm`, `gw_warp`, `gw_worley`), the master temperature string
  `GW_TEMPERATURE` (`gw_tempColor`, `gw_forge`, `gwCool`, `gw_divineFire`), and the doc-08 `gw_crust`/
  `gw_fractureProgress` block from `src/scene/shaders.js`; `PAL`/`v3` from `palette.js`; the shared pool `U`
  from `forgeUniforms.js`. **No new files of substance** — two `gw_` blocks appended to `shaders.js`, plus the
  doc-08 `bakeCrust()` helper extended to bake in **world space** and pack two more channels.

### 4.2 `gw_temper()` — the warm-clamped, low-saturation temper-color ramp
The heart of the on-brand oxidation. Input is normalized oxide *thickness* `th ∈ [0,1]` (0 = bare hot metal,
1 = thick cool scale). Output is a temper tint, low-saturation, warm-clamped — straw → gold → bronze →
dusky-rose ember, **no blue**. The violet end of the real march is folded to a desaturated rose so the
sequence stays warm.

```glsl
// gw_temper — physical thin-film temper march (straw->gold->bronze->violet->blue) WARM-CLAMPED.
// We keep the warm body, fold violet -> desaturated dusky-rose ember, and REMOVE blue entirely
// (00-COHESION-MAP §3.3: no cool/green/blue in the warm grade). Low saturation so it never reads as foil.
// th: oxide thickness 0..1 (0 bare hot metal .. 1 thick cool scale). uSat: global temper saturation cap.
vec3 gw_temper(float th, float uSat){
  float t = clamp(th, 0.0, 1.0);
  // brand-anchored warm stops (NO blue). Desaturated on purpose.
  vec3 bare   = ${v3(PAL.void)};                 // 0.00  bare iron, near-void (no oxide yet)
  vec3 straw  = vec3(0.62, 0.50, 0.30);          // 0.22  pale straw (warm yellow-grey)
  vec3 gold   = vec3(0.70, 0.46, 0.20);          // 0.45  amber-gold (toward PAL.ember hue, muted)
  vec3 bronze = vec3(0.52, 0.30, 0.22);          // 0.66  bronze-brown
  vec3 rose   = vec3(0.46, 0.26, 0.28);          // 0.85  DUSKY ROSE — the violet end, warm-folded, low-sat
  vec3 dusk   = vec3(0.30, 0.20, 0.24);          // 1.00  deep desaturated ember-violet (NEVER blue)
  vec3 c = mix(bare,  straw,  smoothstep(0.00, 0.22, t));
  c = mix(c,          gold,   smoothstep(0.18, 0.45, t));
  c = mix(c,          bronze, smoothstep(0.42, 0.66, t));
  c = mix(c,          rose,   smoothstep(0.62, 0.85, t));
  c = mix(c,          dusk,   smoothstep(0.82, 1.00, t));
  // desaturate toward luma so even the warmest temper is QUIET, not candy-iridescent foil.
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(luma), c, clamp(uSat, 0.0, 1.0));   // uSat ~0.35..0.55 keeps it warm but subdued
}
```

The warm-clamp is enforced three ways: the stop *hues* never go blue; the violet is folded to dusky rose;
and `uSat` (≈0.4) pulls everything toward luma. Even at full thickness the temper is a desaturated
ember-violet that reads warm against the void, never cool.

### 4.3 `gw_flake()` — Worley plate morphology, layered thickness, spall rim
Reads the flake field (baked `vec4` or live), produces the plate mask, crack channel, plate-edge spall, and
the per-plate oxide thickness that feeds `gw_temper`. The crack growth driver is doc 08's
`gw_fractureProgress(temp, solidus)` — reused, not re-derived.

```glsl
// gw_flake — oxide FIRE-SCALE morphology on cooled iron. Pure function (TSL-portable).
// field: vec4(F1, F2-F1, thicknessNoise, plateEdge) from the WORLD-SPACE bake (or live gw_worley + fbm).
// temp:  1=white-hot .. 0=iron-black (gw_forge convention) from the shared cooling clock.
// out crack/plate/thick for relief + temper coupling.
vec3 gw_flake(vec4 field, float temp, float isAE, float uSat,
              out float crack, out float plate, out float thick){
  float f1     = field.x;                  // 0 at cell centre .. 1 at edge
  float border = field.y;                  // F2-F1: ~0 along cracks
  float thNoise= field.z;                  // per-plate thickness variation (layered FeO/Fe3O4/Fe2O3 read)
  float edge   = field.w;                  // plate-edge lift/spall (derivative of border, baked)

  // 1) FRACTURE GROWTH from the shared cooling front (doc 08, reused verbatim).
  float frac   = gw_fractureProgress(temp, 0.42);          // 0 hot .. 1 fully cracked
  float crackW = mix(0.02, 0.10, frac);
  crack = smoothstep(crackW, 0.0, border) * frac;

  // 2) PLATES: raised oxide-scale interiors, present once cooled.
  plate = smoothstep(0.18, 0.55, f1) * frac;

  // 3) OXIDE THICKNESS per plate: thicker on cooler metal + per-plate variation (the temper driver).
  //    cooler -> thicker scale -> further along the temper march. Spalled edges read THINNER (fresh metal).
  thick = clamp((1.0 - temp) * (0.55 + 0.45 * thNoise) - edge * 0.35, 0.0, 1.0);

  // 4) COLOUR: warm-clamped TEMPER tint on the plates + glowing ember crack ROOTS from the master ramp.
  vec3 temperCol = gw_temper(thick, uSat);                 // straw->gold->bronze->dusky-rose, low-sat
  vec3 oxide     = mix(gw_forge(temp), temperCol, plate * 0.80);   // plates take the temper; cracks stay metal
  float root     = crack * (0.35 + 0.65 * (1.0 - temp));
  float vein     = max(root, uVeinFloor * crack);
  vec3 emberRoot = gw_forge(clamp(temp + 0.45, 0.0, 1.2)) * vein;  // crack roots > 1 -> bloom (NOT tempered)
  vec3 metal     = oxide + emberRoot;

  // A/E divine-fire: NEVER scales, tempers, or cracks — the keystone.
  crack *= (1.0 - isAE); plate *= (1.0 - isAE); thick *= (1.0 - isAE);
  metal = mix(metal, gw_divineFire(0.5), isAE);
  return metal;
}
```

Two morphology subtleties that sell "forged scale" over "rust":
- **The crack roots are NOT tempered.** They glow `gw_forge(temp+0.45)` (hot substrate showing through),
  while only the *plate faces* take the temper tint. Real scale tempers on its exposed face and shows fresh
  hot metal in the cracks — tempering the cracks would read as paint.
- **Spalled edges read thinner/fresher.** `edge` subtracts from `thick`, so a lifted plate corner shows
  *less* temper (younger oxide) — the differential thickness across a plate is what makes it look layered.

### 4.4 The world-space bake helper (continuity-critical — extends doc 08's `bakeCrust`)
The bake must use the **shared world-space projection** the basalt also uses, not glyph UV — otherwise the
crack network breaks at the letter silhouette. Pack four channels. Run once at boot on `high`.

```js
// bakeFlake.js — extends bakeCrust (doc 08). Bakes the WORLD-SPACE flake field so the crack network is
// CONTINUOUS across letter / channel / reveal. R=F1, G=F2-F1, B=thicknessNoise, A=plateEdge.
export function bakeFlake(renderer, w = 512, h = 512, cellScale = 9.0, angular = 0.5) {
  const rt = new THREE.WebGLRenderTarget(w, h, { format: THREE.RGBAFormat, type: THREE.UnsignedByteType });
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: cellScale }, uAngular: { value: angular } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      precision highp float; varying vec2 vUv; uniform float uScale, uAngular;
      ${GLSL_NOISE}                                      // gw_worley, gw_fbm
      void main(){
        // vUv here stands in for the SHARED world-space plane coord (xz of the forge floor / letter plane),
        // so the SAME cell layout is sampled by letter, channel, and reveal at render time.
        vec2 P  = vUv * uScale;
        vec2 w  = gw_worley(P, uAngular);
        float f1     = clamp(w.x, 0.0, 1.0);
        float border = clamp(w.y - w.x, 0.0, 1.0);       // crack network
        float thN    = gw_fbm(P * 2.3) * 0.5 + 0.5;      // per-plate thickness variation (FeO/Fe3O4 read)
        // plate edge: how fast border changes -> the spall rim. Cheap screen-space derivative of border.
        float edge   = clamp(length(vec2(dFdx(border), dFdy(border))) * 6.0, 0.0, 1.0);
        gl_FragColor = vec4(f1, border, thN, edge);
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
  return rt.texture;                                     // dispose on unmount
}
```

### 4.5 Injection — letter crust (extends doc 08 §4.5) and basalt channel (extends doc 10 §4.4)
The same field is sampled in both materials, **in shared world space**, so the crack network is continuous.

**HEAD (fragment, after `#include <common>`) — both materials add:**
```glsl
uniform float uTime, uTemp, uVeinFloor, uIsAE, uCellAngular, uCellScale, uTemperSat;
uniform sampler2D uFlakeTex;        // baked vec4(F1, F2-F1, thickness, plateEdge) — WORLD-SPACE
varying vec3 vWPos;                 // world position (SHARED projection — NOT glyph UV)
${GLSL_NOISE}                       // gw_snoise/gw_fbm/gw_warp/gw_worley
${GW_TEMPERATURE}                   // gw_tempColor/gw_forge/gwCool/gw_divineFire
${GW_CRUST}                         // gw_fractureProgress (doc 08)
${GW_FLAKE}                         // gw_temper/gw_flake (4.2/4.3)
```

**COLOR (letter material, after doc-02 cooled-letter metal, before `<tonemapping_fragment>`):**
```glsl
#ifdef GW_FLAKE_ON                                       // HIGH-tier; absent -> flat warm-iron fallback
  vec2 fcoord = vWPos.xz * uCellScale;                   // SHARED world-space cell coord (continuity!)
  #ifdef GW_FLAKE_BAKED
    vec4 field = texture2D(uFlakeTex, fract(fcoord / uCellScale)).xyzw;   // one fetch
  #else
    vec2 wl = gw_worley(fcoord, uCellAngular);
    vec4 field = vec4(wl.x, clamp(wl.y - wl.x, 0.0, 1.0),
                      gw_fbm(fcoord * 2.3) * 0.5 + 0.5, 0.0);            // live (drifting-cell chambers)
  #endif
  float crack, plate, thick;
  vec3 scaleCol = gw_flake(field, temp, uIsAE, uTemperSat, crack, plate, thick);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, scaleCol, max(crack, plate));
#endif
```

**COLOR (basalt material — the channel lip, after doc-10's `diffuseColor.rgb = stone`):**
```glsl
#ifdef GW_FLAKE_ON
  // basalt samples the IDENTICAL world-space field so cracks CONTINUE off the letter onto the channel lip.
  vec2 fcoord = vWPos.xz * uCellScale;
  vec4 field = texture2D(uFlakeTex, fract(fcoord / uCellScale)).xyzw;
  float crack, plate, thick;
  // the basalt is COLD stone, but where the pour-front heat-stain (doc 10 uChannelHeat) reaches the lip,
  // the stone takes a faint temper too — driven by the stain, not by `temp` (stone never glows molten).
  float stoneTemp = clamp(0.30 + uChannelHeat * 0.35, 0.0, 1.0);
  vec3  scaleCol = gw_flake(field, stoneTemp, 0.0, uTemperSat, crack, plate, thick);
  // only blend the crack SEAM onto the stone lip near the metal — the network continues, the stone doesn't glow.
  float lip = smoothstep(0.0, 0.6, uChannelHeat);
  diffuseColor.rgb = mix(diffuseColor.rgb, scaleCol, crack * lip * 0.7);
#endif
```

**NORMAL (both, after `#include <normal_fragment_maps>`)** — plates raised, cracks creased, spall lifted:
```glsl
#ifdef GW_FLAKE_ON
  float relief = (plate * 0.5) - (crack * 0.6) + (field.w * 0.25);   // field.w = plateEdge spall lift
  vec3  bmp    = vec3(dFdx(relief), dFdy(relief), 0.0);
  normal = normalize(normal - bmp * 1.5);
  roughnessFactor = clamp(roughnessFactor + plate * 0.30 - crack * 0.10, 0.04, 1.0);
#endif
```

### 4.6 The r3f component shape (extends doc 08's `CrustLayer` → `FireScaleLayer`)
```jsx
import { U } from './forgeUniforms'
import { bakeFlake } from './bakeFlake'

export default function FireScaleLayer({ quality, gl }) {
  // bake ONCE on high in SHARED WORLD SPACE; nothing on low/static.
  const flakeTex = useMemo(() => {
    if (quality !== 'high') return null
    return bakeFlake(gl, 512, 512, 9.0, 0.5)            // R=F1 G=F2-F1 B=thickness A=plateEdge
  }, [quality])

  useEffect(() => () => { flakeTex?.dispose() }, [flakeTex])   // non-negotiable disposal

  // wired into BOTH the letter material AND the basalt material's onBeforeCompile:
  //   if (quality === 'high') { defines.GW_FLAKE_ON=''; defines.GW_FLAKE_BAKED=''; }
  //   else if (quality === 'low') { defines.GW_FLAKE_TINT='' }   // flat warm-iron temper wash, no Worley
  //   sh.uniforms.uFlakeTex   = { value: flakeTex }
  //   sh.uniforms.uTemperSat  = { value: 0.42 }        // low-saturation warm-clamp
  //   sh.uniforms.uCellScale  = { value: 9.0 }
  //   sh.uniforms.uCellAngular= { value: 0.5 }          // Chebyshev blend -> angular forged plates
  //   sh.uniforms.uVeinFloor  = { value: 0.10 }
  //   Object.assign(sh.uniforms, U)                     // bind the SHARED master pool by reference
  return null
}
```

`temp` (letter) and `uChannelHeat`/`uTemp` (basalt) are **not** private uniforms here — they come from the
shared `U` pool driven by the single `<ForgeDriver/>`. The flake field reads them; it never re-derives heat.

### 4.7 Key uniforms / params (leva-tunable behind `?debug`)
| Param | Role | Default | Sweet spot |
|---|---|---|---|
| `uCellScale` | flake density (plates across the surface) | 9.0 | 6–12 (denser = finer scale) |
| `uCellAngular` | Euclidean↔Chebyshev plate shape | 0.5 | **0.4–0.7** (angular forged plates) |
| `uTemperSat` | temper-color saturation cap (warm-clamp) | **0.42** | 0.35–0.55 (higher = richer, risk of foil) |
| `gw_temper` violet→rose fold | the warm-clamp of the cool tail | built-in | never let the top stop go blue |
| `gw_fractureProgress` solidus | temp at which cracks open | 0.42 | 0.38–0.46 |
| `crackW` 0.02→0.10 | crack width range as cooling completes | — | wider = more spalled/brittle |
| `plateEdge` spall scale (`*6.0`) | derivative-driven plate-edge lift | 6.0 | 4–8 (higher = more spalling) |
| `uVeinFloor` | min ember glow in crack roots (never black) | 0.10 | 0.08–0.18 |
| bake size | world-space flake atlas resolution | 512×512 | match forge-floor footprint |

### 4.8 Hooking the shared master temperature system
`gw_flake`/`gw_temper` **never invent heat.** The temper march (oxide thickness) and the fracture growth are
both functions of `temp = gwCool(age, k)` (doc 02), driven by the shared `uPourFront`/`uTime` in `U` — so the
scale tempers and cracks *in lockstep* with the letter's body cooling. The crack roots glow `gw_forge(temp+Δ)`
— the same HDR ramp as every other emissive surface. The basalt's continuation samples the *same* world-space
field, gated by `uChannelHeat` from the same pour-front. A strike pulse surges `uTemp` → `temp` rises →
`gw_fractureProgress` retreats (cracks momentarily brighten, the temper march walks *down* toward straw as the
scale "re-heats") in the same frame as the slab veins and sparks — the cohesion proof. Because both functions
are pure (`vec4`/`float` → `vec3`), they port 1:1 to TSL `Fn()` (§2.H).

---

## 5. COHESION — how this binds to the one world

- **One temperature, one ramp.** Crack roots and iron-black bodies are `gw_forge(temp)`; the temper tint is a
  warm-clamped *thickness* function whose driver `thick = f(1−temp)` is the same cooling signal. A crack root
  and a slab vein are byte-identical metal at the same heat (`00-COHESION-MAP §1, §7.1`).
- **One noise basis.** The flake morphology is `gw_worley` + `gw_fbm` from `shaders.js` — the same primitives
  doc 05's molten skin and doc 08's crust use, at the same `GW_FBM_OCTAVES`. "More detail" = a denser
  `uCellScale`, never a fork (`§7.2`).
- **One palette, the bloom selector.** Temper stops are `PAL`-anchored warm hues held **< 1.0** (matte oxide,
  never blooms); only the ember crack-roots push `gw_forge(temp+0.45)` > 1 and bloom. The plates stay in the
  `PAL.void` value band — *continuous with the green-black basalt they sit in*, the B-cluster bridge. The
  palette is the bloom selector (`§3.1, §7.3`).
- **The crack network is literally continuous (the doc's signature cohesion).** Letter crust, basalt channel
  lip, and the reveal grazing mask all sample `gw_worley(vWPos.xz · uCellScale)` in **one world-space
  projection** — so a fracture runs unbroken from the iron serif, across the stone it rests in, and dissolves
  into the A/E white-gold spill. No per-glyph UV, no decal seam. This is the "nothing looks bolted-on"
  contract made literal at the surface level (`§7.8`).
- **One warm grade, no cool hue.** The temper march is *physically* straw→…→blue, but `gw_temper` removes blue
  and folds violet to dusky rose, holding `uSat ≈ 0.42` — so the oxidation honors metallurgy *and* the
  no-cool-hue brand law (`§3.3`). The basalt's green lives in the *material*, the temper's warmth in the
  *ramp* — neither ever leaks cool into the post grade.
- **Lit only by the metal.** Oxide plates are *lit* (PBR, reflect the cool procedural env via the spall
  relief); crack roots are *emissive light*. Cooling *is* the transition from light source to lit object; the
  fire-scale is the final lit state with the last embers in the cracks.
- **The fire-scale is the molten skin's cold grandchild and the basalt's cousin.** Same `gw_worley` cells as
  doc 05's hot membrane, at the cold end of one timeline; same world-space field as doc 10's stone, tempered
  by the same pour-front heat. One substance, three points on one timeline (`§7.1`).
- **The A/E keystone, identical everywhere.** `uIsAE` zeroes crack/plate/thick and mixes `gw_divineFire`. The
  same two glyphs that ignite in the DOM wordmark refuse to scale, temper, or crack in the metal — divine fire
  has no oxide because it never cools (`§1.4, §7.5`).

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The fire-scale is per filled pixel of the letter and per channel-lip pixel of the basalt; the 3×3 Worley
search is the most expensive primitive in the toolkit — so the cost discipline (doc 08) governs here too
(`00-COHESION-MAP §10`, "fill-rate is the enemy").

- **Bake the world-space field on high.** Per-fragment cost collapses to **one `texture2D` fetch + a few
  ALU** (the temper ramp + fracture `smoothstep`s) versus the 9-iteration loop + extra fbm octave. The bake
  is the *world-space* projection so continuity survives. (utsubo 2026 "bake what you can"; Heckel 2025
  compute-to-texture.)
- **`gw_temper` is free.** It is a 5-stop `mix` chain + one desaturate — a color ramp, *not* a thin-film BRDF
  (the whole reason 2.D was rejected). No view-dependent lobe, no extra samples.
- **`low` = flat warm-iron temper wash, no Worley.** Under `GW_FLAKE_TINT` (not `GW_FLAKE_ON`), the letter
  gets `gw_temper(clamp((1−uTemp)·0.7, 0,1), uTemperSat)` mixed faintly over doc-02's cooled metal — the
  oxide *color* with no cellular *structure*, no fetch, no loop. Still on-brand tempered iron.
- **`static` = frozen flat tone.** `uTime=2`, `frameloop='demand'`; a single fixed warm-iron oxide tint, no
  fracture, no temper march. Dignified, on-brand, not broken.
- **One field feeds four terms.** F1→plates, F2−F1→cracks *and* roots, B→thickness/temper, A→spall relief —
  all from the *single* baked fetch. Never sample twice.
- **`#pragma unroll_loop_start/end`** on the live `gw_worley` (utsubo 2026); the temper/fracture gates are
  branchless `smoothstep`/`mix`; no `if` in the hot path.
- **Bloom stays surgical.** Only the ember crack-roots exceed 1.0; the tempered plates sit < 1.0. Bloom
  catches the glowing seams, ignores the matte temper — no washout, no temper-color bloom-bleed.
- **Varyings under budget.** Adds only `vWPos` (already present on basalt; add to the letter material) — pack
  into the existing world-pos varying, no new slot (utsubo 2026: varyings < 3).
- **Tier ladder (uniform degrade):**
  - **`high`** — baked world-space flake fetch, warm-clamped temper, spall relief, continuous cracks to the
    basalt lip, Chebyshev plates, DPR capped 1.5.
  - **`low`** — flat `gw_temper` warm wash, no Worley, no fetch, derivative-bump normal only.
  - **`static`** — fixed warm-iron tint, `uTime=2`, no fracture, no march.
- **Verify path.** `npm run build` green → `qa-route` 393×852 + 1440×900, **0 console errors** (SwiftShader
  compiles the GLSL; a Worley typo or `#ifdef` mismatch surfaces) → **then the iPhone 15 OLED read** (the
  temper warmth, the crack-root bloom, the continuity across the letter/stone seam, and the matte-plate
  true-black do *not* simulate headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**The failure modes are: a temper that goes cold blue (brand violation); a crack network that terminates at
the glyph silhouette (reads as a decal); a temper that swims with the camera (used a view-dependent BRDF); a
foil-bright temper (saturation too high); and the A/E scaling (brand violation).** Avoid them in this order:

1. **`gw_temper` FIRST, in isolation, warm-clamped, on the OLED.** Before any Worley, ramp a debug quad
   through `gw_temper(th, uSat)` and confirm the top stop is **dusky rose, never blue**, and that `uSat ≈
   0.42` keeps it *quiet*. Tune the stops *through the tone-mapper on the device* — AgX/ACES move the apparent
   hue, and the crushed-black grade eats timid temper. This is the #1 first-build mistake (authoring for the
   raw value). The whole on-brand-ness of this doc lives here.
2. **World-space flake field SECOND — prove continuity before anything else cellular.** Bake/sample
   `gw_worley(vWPos.xz · scale)` and render the *bare F1/F2−F1* on **both** the letter and the basalt lip with
   `frac = 1`. Confirm a cell that starts on the letter **continues onto the stone**. If the network breaks at
   the silhouette, you are sampling glyph-UV on the letter and world-space on the stone — unify to world space.
   This is the cohesion keystone; if it isn't continuous here, nothing downstream fixes it.
3. **Wire the thickness→temper coupling.** Drive `thick = f(1−temp, thNoise, edge)` and confirm the plates
   *temper* (straw on warm metal, bronze/rose on cold) while the **crack roots stay hot `gw_forge`, NOT
   tempered**. Tempered cracks read as paint.
4. **Wire front-driven fracture growth and watch cracks PROPAGATE.** `gw_fractureProgress(temp,…)` from the
   shared cooling `temp`; scrub the pour front and confirm cracks open *behind* the cooling front, absent on
   hot metal. If the whole network appears instantly, your `frac` reads the wrong sign of `temp` (this doc:
   `temp` is `1=hot`).
5. **Stamp the A/E and confirm NO scale.** `uIsAE=1` zeroes crack/plate/thick and holds `gw_divineFire`. Catch
   this before the scale hides the bug — a divine letter with fire-scale is a brand violation. First A + first
   E only.
6. **Add the ember roots + floor + spall relief LAST.** Verify roots glow > 1 and **bloom**; `uVeinFloor`
   keeps the deepest seams lit (never black); the spall rim (`field.w`) lifts plate edges so the cool env key
   catches forged scale, not paint.
7. **Tier-gate and prove the fallbacks.** Flip to `low` → flat `gw_temper` wash, no Worley compiled in;
   `static` → fixed tint. 0 console errors from the `#ifdef` path.

**Specific pitfalls (each has bitten this class):**
- **Cool temper** — sampling the full physical march introduces blue; `gw_temper` must remove blue and fold
  violet to rose, held at low `uSat`. Verify on the OLED, where saturation reads stronger.
- **Decal cracks** — sampling glyph-UV on the letter breaks continuity with the world-space basalt. Always
  `vWPos.xz`, never glyph UV, for the flake coord.
- **Swimming temper** — do *not* use `MeshPhysicalMaterial.iridescence` for the oxide; its view-dependence
  makes the temper slide as the camera moves (an oily foil). The fixed thickness→ramp is the correct read.
- **Foil temper** — `uSat` too high turns the oxide into candy iridescence. 0.35–0.55 is the warm-quiet band.
- **Worley seam/grid** — hash `ip+g`, never `fp` (`00-COHESION-MAP §2`); the 3×3 must wrap the cell hash
  consistently.
- **Cracks that don't bloom** — push the root heat `gw_forge(temp+0.45)` > 1 or the seam reads as a dark line.
- **Tempered cracks / un-tempered plates** — invert and it reads as paint; plates take temper, crack roots
  stay hot metal.
- **Namespace collisions** — `gw_flake`, `gw_temper` `gw_`-prefixed; a bare `flake`/`temper` could collide
  with a future three chunk.
- **Bake-texture leak** — `flakeTex.dispose()` on unmount; `renderer.info.memory.textures` flat across nav.

**Order of operations summary:** *`gw_temper` warm-clamp verify on device → world-space field continuity
(letter↔stone) → thickness→temper coupling (plates temper, cracks don't) → front-driven fracture growth →
A/E zero-out → ember roots + spall relief → tier-gate to flat-wash/frozen fallbacks + OLED read.*

---

## 8. SOURCES (2025–2026)

1. Dan Greenheck — **10 Noise Functions for Three.js TSL Shaders**, Three.js Roadmap, **2025-12-08**.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders — Worley/cellular with TSL+GLSL
   parity, the 3×3 neighbor search, **F1 cells vs F2−F1 cracks**, "*cells, cracks, organic structures…stone/
   tile, cracked surfaces, scales*," FBM-Worley lacunarity/gain for layered detail, domain warp for lava/
   marble. The canonical 2025 reference for `gw_worley`, the F2−F1 crack channel, and the layered-thickness
   FBM-Worley.
2. Sangil Lee — **Understanding the Variations of Cellular Noise**, **2025-04-18**.
   https://sangillee.com/2025-04-18-cellular-noises/ — the F1 / F2 / F2−F1 catalog, boundary highlighting,
   weighted/hierarchical Voronoi, and the **distance-metric choice** (Euclidean = rounded cells, Manhattan/
   Chebyshev = angular forged plates). The basis for the angular plate silhouette of the fire-scale.
3. Nikos Papadopoulos — **Implementing a Foil Sticker Effect**, **2025-08-30**.
   https://www.4rknova.com/blog/2025/08/30/foil-sticker — thin-film interference as an angle-based color shift;
   the 2025 reference for the temper-interference *mechanism* (thickness → hue) — and, by contrast, why a
   *view-dependent* foil is the wrong read for a fixed oxide stain (the rationale for warm-clamping a
   thickness-driven ramp instead).
4. Maxime Heckel — **Field Guide to TSL and WebGPU**, **2025-10-14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — `Fn()` reuse, **compute passes writing
   to storage textures** (the modern bake path), MRT emissive attachments, WGSL/GLSL dual-lowering, iOS WebGPU
   caveats. The basis for the world-space bake and the TSL-portability of `gw_flake`/`gw_temper`.
5. utsubo — **100 Three.js Tips That Actually Improve Performance (2026)**, **2026**.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips — "**bake what you can**," branchless
   `mix(...,step())` over `if`, `#pragma unroll_loop_start/end`, keep varyings < 3, reduce fBM octaves by
   viewport, profile with `renderer.info`. The mobile-cost authority for the baked field, the unrolled 3×3,
   and the flat-wash low tier.
6. Codrops — **More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say**,
   **2026-04-28**. https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
   — a production scroll-driven Three.js world with a **ground-cracking-open / fractured-lava** beat, the
   fracture pattern "*sculpted so it reads correctly from multiple camera angles*." The modern reference for
   authoring **one continuous fracture field** across a scene rather than per-object decals — the crack-
   continuity contract of this doc.
7. Codrops — **80s Business Tech and Seamless Scene Transitions: Inside Shader.se's Scroll-Driven WebGPU
   Pipeline**, **2026-05-19**. https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
   — single-renderer, scroll-coupled shared-uniform, multi-scene pipeline; validates the one-renderer
   shared-world-space-field architecture the fire-scale binds into.
8. Codrops — **WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL**,
   **2026-01-28**. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
   — noise-driven TSL mask + **MRT + selective bloom on text**, per-letter offset attributes; the model for
   writing crack-root emissive to an MRT attachment and the A/E flag in the WebGPU port (§2.H).
9. British Stainless Steel Association — **Heat Tint (Temper) Colours on Stainless Steel Surface Heated in
   Air**, **2025 reference**. https://bssa.org.uk/bssa_articles/heat-tint-temper-colours-on-stainless-steel-surface-heated-in-air/
   — the oxide-film thin-film-interference mechanism and the straw→brown→purple→blue march with temperature/
   time; the physical basis for `gw_temper`'s thickness→hue stops and the warm-clamp decision (drop the cool
   tail).
10. Sheffield Gauge Plate — **What Is Tempering? (2026 Tempering Guide)**, **2026**; and Raykam Alloys —
    **Tempering Colors of Steel (Simplified 2026)**, **2026**. https://sheffieldgaugeplate.com/blog/what-is-tempering/
    · https://raykamalloys.com/blog/tempering-colors-of-steel/ — current (2026) temperature→temper-color
    tables (straw ~220 °C, bronze, purple/blue ~290–320 °C); confirm the warm body we keep and the cool tail
    we fold/remove.
11. Springer *J. Materials Eng. & Performance* — **Thermophysical Properties of Oxide Scale on Carbon Steel
    in an Industrial Reheating Furnace**, **2025**. https://link.springer.com/article/10.1007/s11665-025-12806-x
    — the layered FeO/Fe₃O₄/Fe₂O₃ scale and thermal-expansion mismatch over 27–1000 °C; grounds the
    per-plate layered-thickness read (the B-channel of the baked field) and the iron-black oxide value-range.
12. Three.js docs / DerSchmale — **MeshPhysicalMaterial.iridescence** + **Three.js Thin Film Iridescence**,
    **r17x / 2025**. https://threejs.org/docs/#api/materials/MeshPhysicalMaterial.iridescence ·
    https://derschmale.github.io/threejs-thin-film-iridescence/ — the built-in view-dependent thin-film term;
    the reference for why a real iridescence BRDF is *rejected* for the fixed oxide stain (it swims, it goes
    cool) and *reserved* for the jewel-chamber's intended play-of-color (§9).

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The temper-color frontier that runs *ahead* of the pour.** A focused treatment of how the oxide
   thickness (and thus the temper march) leads the cooling front in time and space — the diffusion/creep model
   for the straw→bronze band sweeping across the metal just behind the white-hot lip, and how it couples to
   doc 10's `uChannelHeat` heat-stain on the adjacent stone so metal-temper and stone-stain share one
   advancing edge. Scope: the lead distance, the eased thickness curve, AgX vs ACES temper-hue stability.
2. **View-dependent iridescence for the jewel-chamber (where it's *correct*).** The thin-film BRDF rejected
   for the oxide stain is exactly right for the `/web` jewel's intended fire-opal play-of-color. A treatment of
   `MeshPhysicalMaterial.iridescence` (or a TSL thin-film `Fn()`) driven by the warm `envTone`, sharing the
   same `gw_temper` stops at *high* saturation so the gem's iridescence and the iron's temper are visibly the
   *same optical phenomenon at two saturations* — one swimming and rich, one fixed and quiet.
3. **Cross-material crack-graph authoring & verification.** A rigorous method for guaranteeing (and
   QA-proving) crack continuity across the letter/channel/reveal seam: the shared world-space projection math,
   how the bake atlas is registered to the forge-floor plane, and a `qa-route` DOM/pixel probe that samples
   across the silhouette boundary to assert the network never breaks. Scope: the projection registration, the
   wrap/repeat edge handling, and the multi-angle read (per the Codrops *More Than a Portfolio* lesson).
4. **TSL `Fn()` + compute-baked world-space flake + MRT-tagged temper/ember (the WebGPU port).** Reimplement
   `gw_flake`/`gw_temper`/`gw_fractureProgress` as TSL `Fn()` nodes; bake the `vec4` field via a compute pass
   to a storage texture (Heckel 2025); split the matte temper (lit) from the glowing crack roots (emissive) so
   bloom catches only the seams via a dedicated MRT attachment (Gommage 2026). Gated behind the iOS/Safari
   WebGPU readiness audit.
