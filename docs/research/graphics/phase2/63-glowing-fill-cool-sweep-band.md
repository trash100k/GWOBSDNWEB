# 63 — The Glowing Fill / Cool-Sweep Band (the white-gold threshold ridge)

_Phase 2 deep-dive · GAELWORX forge world · cluster **D-type-knot-reveal** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js), no runtime EXR._

> **The problem this doc solves.** Two moving thresholds sweep across every poured glyph in the hero:
> the **fill front** (left→right, where liquid metal *arrives* at dry stone) and the **cooling sweep**
> (trailing behind it, where white-hot metal *crosses into* solidified iron). The 2025–26 "dissolve /
> x-ray / Gommage" aesthetic — a razor-thin glowing ridge riding a noise-warped threshold — is the
> single cinematic gesture that turns both of those thresholds from a *gradient sliding across a letter*
> into a *substance transforming at a visible burn-line*. This doc gives the fill front and the cooling
> sweep that **thin glowing white-gold ridge at the moving boundary**: how it is shaped, how it is
> pushed HDR so it (and only it) blooms, how it is gated — the **A and E permanently white-gold, the
> particle shedding gated to `high` tier and the finale beat only**, the rest of the wordmark cooling
> to iron behind a single bright sweep. It is the hero reveal's cinematic finish.
>
> It is bounded by the `00-COHESION-MAP` contract: one temperature signal (`uTemp`/`gw_forge`), one
> noise basis (`gw_*`), one palette (`PAL`), one cooling clock (`gwCool01`, `age`), the A/E divine-fire
> keystone, the one bloom contract, and the iPhone-15 fill-rate budget. It is the **edge layer** that
> sits between `13`/`14` (fill control), `02` (the cooling curve), and `18` (the wet-front lip). Where
> `18` shapes the *physical liquid lip* (meniscus bead, bubbles, surface tension), **this doc owns the
> graphic-design gesture**: the clean luminous ridge — the 2025-26 reveal idiom — that reads as
> "x-ray / threshold / burn" rather than "wet metal." The two stack: `18` is the close-up physics, `63`
> is the readable cinematic line that survives at any distance and on the OLED.

---

## 1. SCOPE

There are **two** glowing threshold ridges in the GAELWORX wordmark sequence, and they are the *same
shader band evaluated against two different signed-distance fields*:

1. **The fill-front ridge** — the leading edge of the pour as it floods a glyph left→right. Ahead of it
   is dark un-filled stone (`temp ≈ 0`); at the ridge is the **white-hot arrival line** (`temp = 1`);
   behind it is freshly-poured molten metal. This is the *Gommage-in-reverse*: instead of dust
   dissolving *away* at a noise threshold, **metal materialises *in*** at a noise-warped threshold, with
   the same razor glowing ridge marking the boundary.

2. **The cool-sweep ridge** — a *second*, trailing threshold that follows the fill front by a fixed
   cooling-time offset. As each region crosses from white-hot to solidifying iron, a thin **bright
   sweep band** passes over it once — the visible instant of solidification — then the metal is iron-dark
   behind it with only ember veins glowing through. This is the "cooling sweep" of the title: a moving
   bright line that *crosses the letter once and leaves it cold*.

Both ridges are **the dissolve/x-ray reveal aesthetic** (Codrops *Dissolve Effect* Feb 2025, *Gommage*
Jan 2026): a thin emissive band isolated by `smoothstep` around a noise-warped moving threshold, pushed
to HDR so it blooms while everything else stays sub-1.0. The difference from a generic dissolve is the
GAELWORX binding: the ridge color is **not** an arbitrary "burn orange" — it is `gw_forge(1.0)`
white-gold drawn from the one temperature ramp, the noise that warps the threshold is the **same
`gw_fbm`** that boils the metal, and the band is gated by `uIsAE` so the A and E ridges are eternal
white-gold divine fire that *never sweep past* — they are the still bright keystone while every neighbour
cools behind its sweep.

Four behaviours define this element, each a section below:

- **The thin warped ridge (§4.1–4.2).** A `smoothstep`-isolated band around `threshold = noise`, ~1–3px
  wide, riding a `gw_fbm`-warped contour so it is ragged-capillary, never a clean wipe line. The
  load-bearing 2025-26 grammar (`edge = smoothstep(p, p+w, noise)`).
- **The HDR white-gold push (§4.3).** The ridge alone exceeds 1.0 (`gw_forge(1.0)` × boost), so the
  palette-as-bloom-selector contract makes it the *only* part of the band that blooms — selective bloom
  for free, no extra pass.
- **The A/E permanent gate (§4.4).** `uIsAE` routes the A/E ridge to `gw_divineFire`, removes its cooling
  sweep entirely (the divine fire floods and *stays*), and tints its shed particles gold. The keystone.
- **The finale particle shedding (§4.5).** On `high` tier **and the finale beat only**, the ridge sheds
  sparks/dust into the *shared* ember emitter (`15`/`09`) — never a new `Points`. Gated off on `low`,
  `static`, and during the scroll-scrub fill; on only when the reveal lands.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every approach is rated **quality / perf / mobile / complexity** against the hard constraint: one WebGL2
renderer, `onBeforeCompile` GLSL chunk-injection (TSL-portable per `50`), iPhone-15 fill-rate budget, no
EXR, the surface is a near-flat SDF/MSDF glyph patch, and every term shares the existing `gw_*` field and
the `U` uniform pool.

### 2.A The dissolve/x-ray edge band — `smoothstep(threshold)` ridge (the canonical 2025-26 idiom)

The dominant modern reveal. A noise field is compared to a moving `progress` uniform; the **edge** is the
thin band where the noise sits between `progress` and `progress + edgeWidth`:

```glsl
float n    = gw_fbm(p * scale);              // the dissolve noise (shared)
float edge = smoothstep(prog, prog + W, n) - smoothstep(prog + W, prog + 2.0*W, n);
//           ^ rising side                    ^ falling side  → a thin hat band
vec3  ridge = edgeColor * edge;              // pushed HDR → blooms
```

The Codrops *Dissolve Effect with Shaders and Particles* (Feb 17, 2025) is the canonical reference: it
discards fragments where `noise < uProgress`, fills the band `uProgress..uProgress+uEdge` with an
**emissive edge color**, and applies **selective bloom** so the edge glows. The Codrops *WebGPU Gommage
Effect* (Jan 28, 2026) is the 2026 evolution: **MSDF text** dissolved by a **noise-driven TSL** shader
with a glowing edge, dust+petal particles shed at the threshold, finished with **MRT selective bloom**.
Bugnet's *Fix a Dissolve Shader Missing Its Glowing Burn Edge* (2025) catalogs the exact band formula
`edge = smoothstep(threshold, threshold+edgeWidth, noise)` and the three bugs that kill it (edgeWidth=0,
inverted threshold direction, missing HDR/bloom). Codrops *How to Animate WebGL Shaders with GSAP:
Ripples, Reveals, and Dynamic Blur* (Oct 8, 2025) is the grammar for *animating* the `progress` uniform
with soft `smoothstep` edges.

- Quality: **highest** — this *is* the 2025-26 reveal look. Perf: **excellent** (one noise + two
  `smoothstep`). Mobile: **green**. Complexity: **low**.
  → **The substrate.** Adopt directly for both the fill ridge and the cool-sweep ridge. The only GAELWORX
  change: `edgeColor = gw_forge(1.0)` (not an arbitrary burn hue), and the threshold is the fill-front /
  cooling-age signed distance, not a global dissolve progress.

### 2.B Ridged-noise edge emphasis (sharpening the ridge contour)

A plain fbm threshold gives a soft band. **Ridged noise** — `1 - abs(noise)` — concentrates energy into
sharp creases, which reads as a *crisper, more electric* ridge. The Three.js Roadmap *10 Noise Functions
for Three.js TSL Shaders* (Dec 8, 2025) ships ridged noise (abs+invert) with TSL+GLSL parity, explicitly
"emphasizing edges / mountain-ridge patterns." Used here to *modulate the ridge width* (`W` narrows where
ridged-noise is high) so the glowing line has variable intensity along its length — bright, taut filigree
rather than a uniform stroke.

- Quality: **high** (the ridge gets filigree life). Perf: **cheap** (one extra `abs`). Mobile: **green**.
  Complexity: **low**.
  → **Ship on `high`/`low`** as a width/intensity modulator; dropped on `static` (frozen single width).

### 2.C Fresnel-rim ridge (the alternative — view-dependent edge)

Instead of a threshold band, make the ridge a **rim-light** term: `rim = pow(1 - dot(N,V), rimPower)`,
glowing where the surface grazes the camera. The Three.js Roadmap *Rim Lighting Shader* (2025) gives the
`rimColor` / `rimPower` / `rimIntensity` grammar. This is *not* the reveal threshold — it's a geometric
edge — but it's the right tool for the **meniscus bead highlight** (overlaps `18 §2.C`) and for giving the
white-gold ridge a *view-dependent shimmer* on top of the threshold band.

- Quality: **medium alone** (it's an outline, not a reveal); **high as a multiplier** on the threshold
  ridge. Perf: **trivial**. Mobile: **green**. Complexity: **low**.
  → **Use as a secondary multiplier** on the ridge (`ridge *= 1.0 + rim*0.3`) on `high` only, so the line
  catches the camera as the letter turns. Not the primary mechanism.

### 2.D Baked gradient-ramp ridge LUT (designer-painted edge profile)

Bake the ridge's *cross-section* (color × intensity vs distance-from-threshold) into a 1-D gradient
texture and `texture2D(uRidgeRamp, vec2(dband, 0.5))`. Lets a designer paint the exact falloff (a hot
white core → ember shoulder → fade). The same threshold-ramp grammar `02 §2.2` and `03` discuss for the
cooling curve.

- Quality: **high** (hand-painted falloff). Perf: one dependent texture read. Mobile: **good**, but adds
  a texture binding and an HDR/half-float texture is needed to hold the >1 core (the cohesion map's
  "palette is the bloom selector" rule means the ramp must keep only the core above 1.0).
  Complexity: **low**, but it **forks the temperature authority into an art asset**, fighting the
  one-function cohesion linchpin.
  → **Rejected as the default.** A closed-form `gw_forge(1.0)` ridge keeps the HDR contract obvious and
  shares the one ramp. The LUT is a Phase-2 look-dev candidate (§9) only if a designer must paint the
  cross-section.

### 2.E Particle shedding at the ridge (the finale flourish)

The Gommage/dissolve look *sheds matter* at the threshold — dust, petals, sparks spawned where the band
passes. Codrops *Gommage* (Jan 2026) bursts dust+petals at the dissolve edge; *Interactive Text
Destruction* (Jul 22, 2025) notes the WebGPU constraint that **variable point size isn't supported**, so
modern WebGPU particle systems use **Sprites or InstancedMesh**, not `Points` (relevant to the `50`/`30`
WebGPU port; on the WebGL2 ship the shared `Points` emitter is fine). For GAELWORX the shed is **not a new
system** — the ridge writes spawn data into the existing GPGPU pour-front orbiters (`15`/`09`), gated to
`high` tier **and the finale beat only** (no shedding during scroll-scrub — it would shimmer constantly
and read cheap).

- Quality: **high** (the ridge "ignites" on the finale). Perf: **free at the ridge** (reuses `15`/`09`
  budget). Mobile: **`high`+finale only**. Complexity: **low** (a spawn-source hook + a gate).
  → **Hook into the shared emitter, gated `high` && `finale`.** The single most important gate after the
  A/E gate: shedding must be *rationed to the climax*, not continuous.

### 2.F MRT / selective-bloom isolation of the ridge (how it blooms without a pass)

Two ways to make *only the ridge* bloom. (i) **Palette-as-selector** (the GAELWORX default, `00 §3.1`):
the ridge is the only band > 1.0, so the shared threshold bloom catches it for free — no extra pass. (ii)
**MRT selective bloom**: write the ridge to a second render-target via `scenePass.setMRT(mrt({ output,
emissive }))` and bloom only the emissive target (three.js WebGPU `bloom_selective`/`bloom_emissive`
examples, BloomNode docs, 2026; Codrops *Gommage* uses exactly this MRT path on WebGPU). MRT is the
*correct* future-proof path on the WebGPU/TSL port (`53 mrt-emissive-bloom-port`) but on the WebGL2 ship
it is an extra target we don't need — the palette already selects.

- Quality: **identical** (both isolate the ridge). Perf: palette-selector = **free**; MRT = one extra RT.
  Mobile: palette-selector **green**; MRT a measurable cost on iPhone. Complexity: low / medium.
  → **WebGL2 ship: palette-as-selector (no MRT).** WebGPU port: MRT emissive target (per `53`). The ridge
  HDR value is authored once; both backends read it.

### 2.G (Rejected) Geometry-shell / extruded ridge mesh

A literal extruded ridge mesh swept along the front (a glowing tube following the threshold) gives perfect
control but needs per-frame geometry rebuild as the front moves — CPU cost, a second draw call, and it
can't follow the `gw_fbm`-warped contour without absurd tessellation. **Rejected.** The ridge is a
fragment band on the existing glyph quad; it costs nothing and follows the noise exactly.

**Verdict.** The glowing band is **2.A (smoothstep threshold ridge) as the substrate, on every tier**,
**2.B (ridged-noise width modulation) on `high`/`low`**, **2.C (Fresnel multiplier) on `high`**, **2.E
(particle shedding) on `high` && finale only**, **2.F via palette-as-selector on WebGL2 / MRT on the
WebGPU port**. The ridge color is `gw_forge(1.0)`/`gw_divineFire`, the warp is `gw_fbm`, the threshold is
the fill-front and cooling-age signed distances — so the band is provably the *same metal* as the slab
veins and the cooling letters, not a bolted-on dissolve.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build the glowing band as a thin emissive ridge on the SDF/MSDF glyph fragment, isolated by a
`smoothstep` hat around a `gw_fbm`-warped moving threshold, evaluated twice — once on the fill-front
distance, once on the cooling-age distance — and pushed to HDR `gw_forge(1.0)` so it is the only band that
blooms.** Two ridges, one shader, two threshold inputs:

```
// FILL RIDGE — leading edge of arrival (in layout-U space)
dFill   = uFillFront - layoutU                       // >0 = filled  (from 13)
nFill   = gw_fbm(p*Kfill + uTime*flow)               // shared boil noise
ridgeF  = gw_band(dFill, nFill, Wfill)               // smoothstep hat (2.A)

// COOL RIDGE — the solidification sweep, trailing by a cooling-time offset
Tnow    = 1.0 - gwCool01(age, uCoolRate)             // this fragment's temperature (02/03)
ridgeC  = gw_band(Tnow - uCoolEdge, nFill, Wcool)    // a band crossing the vitrify temp once

// COMBINE — both ridges are the white-gold line; A/E permanent
line    = max(ridgeF, ridgeC) * (1.0 - uIsAE) + ridgeAE * uIsAE
emissive += mix(gw_forge(1.0), gw_divineFire(uFlick), uIsAE) * line * uRidgeHDR
```

Justification against the cohesion contract:

1. **One temperature, one cooling clock.** The ridge color is `gw_forge(1.0)` — the *top* of the one
   ramp the veins, the cooling letters, and the sparks all read. The cool-sweep ridge is literally a
   slice of `gwCool01(age)`: it lights up exactly as a fragment crosses the vitrify temperature, so the
   sweep is *the cooling curve made visible*, not a separate animation. **No private orange.**
2. **One noise basis.** The threshold warp `nFill` is the **same `gw_fbm`** that boils the molten surface
   (`01`/`04`) at the same `GW_FBM_OCTAVES`. The ridge is ragged because the metal is ragged — same grain.
   "More ridge detail" = one more `gw_fbm` octave, never a second noise.
3. **The A/E keystone is structural.** `uIsAE` swaps the ridge color to `gw_divineFire`, **removes the
   cool-sweep ridge entirely** (`ridgeC *= (1.0 - uIsAE)`) so the A/E never solidify, and tints the shed
   particles gold. The A/E ridge is the still white-gold keystone while every neighbour's sweep passes and
   leaves it cold. This is the reveal: the A and E *refuse to cool*.
4. **One bloom contract.** The ridge is the only band `> 1.0`; the shared threshold bloom (`20`/`35`)
   catches it with no extra pass (palette-as-selector). On the WebGPU port it moves to an MRT emissive
   target (`53`) — same authored HDR value, mechanical port.
5. **Mobile-first, no sim, no new pass/draw/RT.** Everything is analytic from `dFill`, `Tnow`, `age`,
   `nFill`. The expensive flourish (particle shedding) is gated to `high` *and the finale*. It rides the
   existing glyph quad's fragments.
6. **It plugs the gap cleanly.** `13`/`14` own fill control; `02`/`03` own the cooling curve; `18` owns
   the wet-lip physics; **this owns the readable graphic ridge** — the clean luminous line that survives
   at distance and on the OLED where `18`'s subtle bead does not. `63` and `18` stack: the bead is the
   close-up wet tell, the ridge is the cinematic threshold line. The cool ridge's tail hands off to `05`'s
   skin coverage at the same `age` threshold — no seam.

---

## 4. IMPLEMENTATION

**Libs/versions (matching the rest of the build):** `three@^0.17x` (r170+, `onBeforeCompile`
chunk-injection, WebGL2 ship; r184/r185 TSL path authored portable per `50`), `@react-three/fiber@^9`,
`@react-three/drei@^10`, `@react-three/postprocessing@^3` (the ridge owns *no* post — it feeds the shared
bloom via HDR emissive). Text per `13` option A/B + `16-cinzel-msdf-atlas-pipeline.md`:
`troika-three-text` + `three-instanced-uniforms-mesh` for per-glyph `uIsAE`/`fillStart`/`tempSeed`, or the
MSDF atlas. The ridge is injected into the **same glyph material** — not a separate mesh.

### 4.1 Shared GLSL added to `src/scene/shaders.js`

Lives beside `gw_tempColor`/`gw_forge`/`gwCool01`/`gw_divineFire`/`gw_fbm`, inlined via the existing
chunk-injection. Depends only on functions already in the toolkit.

```glsl
// ---- the dissolve/x-ray ridge band. One threshold-distance → a thin glowing hat. ----
// db : signed distance from this fragment to the moving threshold (>0 past it)
// n  : the warp noise sample (shared gw_fbm) used to ragged the contour
// W  : ridge half-width (px-ish in the threshold's units)
float gw_band(float db, float n, float W){
  // warp the threshold by shared noise so the ridge is capillary-ragged, never a clean line (2.A/2.B)
  float dw   = db + (n - 0.5) * W * 1.6;
  // ridged-noise width modulation: ridge narrows+brightens where the crease is sharp (2.B)
  float ridg = 1.0 - abs(n * 2.0 - 1.0);                 // 0..1, peaks on the crease
  float w    = W * mix(1.0, 0.45, ridg);                 // taut filigree where ridged
  // the thin hat: rising minus falling smoothstep around 0 (Bugnet/Codrops grammar)
  float hat  = smoothstep(-w, 0.0, dw) - smoothstep(0.0, w, dw);
  // brighten the crease so the line has filigree life, not a uniform stroke
  return hat * (0.7 + 0.6 * ridg);
}

// optional view-dependent shimmer on the ridge (2.C, high only)
float gw_ridgeRim(vec3 N, vec3 V, float power){
  return pow(1.0 - max(dot(normalize(N), normalize(V)), 0.0), power);
}
```

### 4.2 Injection into the glyph fragment (`onBeforeCompile`)

```glsl
// --- after the molten/cooling block (02/03/18), before <tonemapping_fragment> ---

// the ONE temperature authority for this fragment
float Tcool   = gwCool01(vAge, uCoolRate);             // 0 hot .. 1 iron (02/03)
float Tnow    = 1.0 - Tcool;                            // current temperature
vec3  metal   = mix(gw_forge(Tnow), gw_divineFire(uFlick), uIsAE);   // KEYSTONE: A/E never reach uTemp

// shared boil noise — the SAME field that warps the wet front (18) and boils the surface (01/04)
float nFill   = gw_fbm(vWorldP * uRidgeScale + U.uTime * 0.6);

// (a) FILL RIDGE — leading edge of arrival, in layout-U space
float dFill   = U.uFillFront - vLayoutU;               // from 13, shared writer
float ridgeF  = gw_band(dFill, nFill, uWfill);

// (b) COOL-SWEEP RIDGE — the solidification line, crossing the vitrify temp once.
//     uCoolEdge centres the band on the vitrify temperature; it sweeps as Tnow falls.
float ridgeC  = gw_band(Tnow - uCoolEdge, nFill, uWcool) * (1.0 - uIsAE);  // A/E never solidify

// (c) combine — both ridges are the same white-gold line; A/E permanent
float line    = max(ridgeF, ridgeC);
#ifdef GW_HIGH
  line *= 1.0 + gw_ridgeRim(normal, viewDir, 3.0) * 0.3;   // view-dependent shimmer
#endif

// (d) push HDR — the ridge is the ONLY band > 1.0, so the shared bloom selects it for free (00 §3.1)
vec3 ridgeCol = mix(gw_forge(1.0), gw_divineFire(uFlick), uIsAE);   // white-gold; A/E = divine
metal        += ridgeCol * line * uRidgeHDR;            // uRidgeHDR ~ 2.2 → blooms

// (e) finale particle shedding — write spawn intensity for the SHARED emitter (15/09).
//     gated to high tier AND the finale beat only — NO new Points, NO continuous shimmer.
#ifdef GW_HIGH
  float shed = ridgeF * uFinale * step(0.5, line);     // uFinale 0..1 from the choreography (61)
  uSparkSeed = max(uSparkSeed, shed);                  // → ember emitter; A/E sparks gold via uIsAE
#endif

totalEmissiveRadiance += metal;                        // emissive-as-light, pre-tonemap (04)
```

### 4.3 TSL-portable form (the `50`/`30` WebGPU upgrade path)

Authored so the port is mechanical (the cohesion map mandates TSL-portability). The band as a `Fn()` node:

```js
// gwBand(db, n, W) — the same hat, as TSL nodes (r184+)
const gwBand = Fn(([db, n, W]) => {
  const dw   = db.add(n.sub(0.5).mul(W).mul(1.6));
  const ridg = float(1).sub(n.mul(2).sub(1).abs());
  const w    = W.mul(mix(float(1), float(0.45), ridg));
  const hat  = smoothstep(w.negate(), 0, dw).sub(smoothstep(0, w, dw));
  return hat.mul(ridg.mul(0.6).add(0.7));
});
// emissiveNode: mix(gwForge(1.0), gwDivineFire(flick), uIsAE).mul( gwBand(...).mul(uRidgeHDR) )
// selective bloom via MRT emissive target (53): scenePass.setMRT(mrt({ output, emissive }))
```

### 4.4 The r3f component shape

The ridge owns **no new mesh** — it is a behaviour of the wordmark material. Two small JS pieces:

```jsx
// inside <WordmarkFill/> (the 13/14 mesh). Thread the ridge uniforms + per-glyph uIsAE/age,
// and bind the SHARED pool U (same refs → true cohesion).
function useRidgeMaterial(glyphMat) {
  useLayoutEffect(() => {
    glyphMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U);               // SHARED pool (cohesion)
      shader.uniforms.uRidgeScale = { value: 14.0 };
      shader.uniforms.uWfill      = { value: 0.020 };  // fill-ridge half-width (layout-U units)
      shader.uniforms.uWcool      = { value: 0.10 };   // cool-sweep half-width (temp units)
      shader.uniforms.uCoolEdge   = { value: 0.66 };   // vitrify temperature the sweep centres on
      shader.uniforms.uRidgeHDR   = { value: 2.2 };    // HDR boost → only the ridge blooms
      shader.uniforms.uCoolRate   = U.uCoolRate;       // SAME cooling clock as letters/veins (02)
      shader.uniforms.uFinale     = U.uFinale;         // SHARED finale gate (61) for particle shed
      injectChunks(shader);                            // the §4.1–4.2 GLSL
    };
    glyphMat.customProgramCacheKey = () => `gwridge-${TIER}`;  // GW_HIGH define per tier
  }, [glyphMat]);
}

// uFillFront and uFinale are NOT new clocks — driven once by <ForgeDriver/>:
//   uFillFront ← forge.scrollDamped (the one writer), uFinale ← the choreography beat (61).
//   The SAME uPourFront feeds DOF focus (28), env intensity (22), and the ember spawn (15/09).
```

### 4.5 Key uniforms / params (and the shared system they hook)

| Uniform / param | Meaning | Bound to / driven by |
|---|---|---|
| `uFillFront` | fill front position in layout-U (0..1/glyph) | **shared** `U`, `<ForgeDriver/>` ← `scrollDamped` |
| `vLayoutU` / `dFill` | per-fragment layout coord / distance to fill front | from `13` |
| `uTemp` / `uHeat` | master temperature / transient pulse | **shared** `U` (ridge raggedness, HDR) |
| `uCoolRate` | cooling-clock rate | **shared** `U` (same as letters/veins, `02`) |
| `vAge` / `Tnow` | seconds since metal arrived / current temp | analytic from `uFillFront` (no GPGPU) |
| `uCoolEdge` | vitrify temperature the cool-sweep centres on | look-dev (~0.66, the ember stop) |
| `uWfill` / `uWcool` | fill / cool ridge half-widths | look-dev knobs |
| `uRidgeScale` | dissolve-noise frequency | look-dev (shares `gw_fbm`) |
| `uRidgeHDR` | ridge HDR boost (the bloom selector) | look-dev (~2.2), tuned through the tone-map |
| `uIsAE` | per-glyph divine-fire flag | baked build-time data (`13`/`24`/CLAUDE.md) |
| `uFinale` | finale-beat gate (0..1) for particle shed | **shared** `U` ← choreography (`61`) |
| `uSparkSeed` | ridge spark spawn intensity | → **shared** ember emitter (`15`/`09`) |

The cohesion mechanism is literal: the ridge **mutates nothing of its own** — it reads `U`, writes
`uSparkSeed` into the shared emitter, feeds the shared bloom via HDR emissive. Move `uTemp` or fire a
strike and the ridge brightens, raggeds, and (at finale) sheds heavier on the *same frame* as the slab
veins — the cohesion proof.

---

## 5. COHESION

The glowing band is bound to every shared system in the `00-COHESION-MAP`:

- **Temperature (§1).** Ridge color = `gw_forge(1.0)` — the top of the one ramp. The cool-sweep ridge is
  a slice of `gwCool01(age)`: it is *the cooling curve made visible*, lighting up as a fragment crosses
  the vitrify temperature. A cooling vein and a sweeping ridge are visibly the same metal. The A/E ridge =
  `gw_divineFire`, never `uTemp`. **One ramp.**
- **Noise (§2).** The threshold warp is the **same `gw_fbm`** (same `GW_FBM_OCTAVES`) that boils the
  surface (`01`/`04`) and warps the wet front (`18`). The ridged-noise width modulation is `1 - abs(n)`
  from the shared field. The ridge is ragged because the metal is ragged. The animation **boils** (time as
  warp offset), it does not **scroll** the threshold texture.
- **Palette (§3).** All color from `PAL` via `v3()`. Only the ridge exceeds 1.0 — so it is the *only* part
  of the band that blooms, the only part the heat-haze/god-ray luminance mask catches, the only light the
  ridge casts. The 60/30/10 holds: the ridge is the **10% accent** drawn across the 60% void glyph.
- **Lighting (§5).** The ridge is emissive-as-light. Its white-gold spill on the A/E feeds `uAEFire`
  (`19`/`22`) so the divine ridge begins to reveal the Ogham (`25`/`26`) as it arrives. No fill light.
- **Bloom (§6).** One bloom contract: HDR emissive add pre-tonemap, half-float buffer, threshold bloom,
  no per-element pass (palette-as-selector). On the WebGPU port, MRT emissive target (`53`) — same authored
  HDR value.
- **Cooling handoff.** The cool-sweep ridge's trailing edge fades into `05`'s `skinCoverage` at the same
  `age` threshold; the molten→glassy→matte-rind→iron-dark march is one continuous `T`/`age` curve. The
  ridge is the *bright instant* in that march, not a separate event. No seam with `18` (the bead sits
  *inside* the fill ridge) or `05` (the skin starts where the cool ridge ends).
- **Clock (§6).** `uFillFront`, `uFinale`, `uPourFront` all come from the one `<ForgeDriver/>` writer,
  `dt`-damped. A strike (`forge.strikeAt`) surges `uHeat` → the ridge brightens and raggeds, and (at
  finale) sheds heavier — in the same frame as the slab, jewel, and sparks. That synchrony is the proof.
- **Channel → letter handoff (§7.8).** The same hand-authored interlace arc-length curve positions
  `uPourFront`; the fill ridge is that pour *arriving* at the glyph. One knot, consumed by channel + pour +
  this ridge.

---

## 6. MOBILE & PERFORMANCE

Judge device: iPhone 15 (A16/A17, OLED), DPR-capped **1.5**, ~9–10 ms steady-state on `high`. The ridge is
**fill-rate**, not geometry — it runs on the existing glyph quad's fragments, and the cheap `line` mask
early-outs everywhere the band isn't.

**Cost (high-tier, hero close-up where the wordmark fills a chunk of frame):**

| Term | Cost | How it's held |
|---|---|---|
| Fill ridge (2.A) — 1 `gw_fbm` + 2 `smoothstep` | ~0.2–0.3 ms | the `gw_fbm` is shared with the boil (already in budget) |
| Cool-sweep ridge (2.A) — reuses `nFill`, 2 `smoothstep` | ~0.05 ms | no new noise sample |
| Ridged-noise width mod (2.B) | ~0.02 ms | one `abs` |
| Fresnel ridge shimmer (2.C) | ~0.05 ms | **`high` only**, one `pow` |
| Particle shed (2.E) | **~0 ms** | reuses `15`/`09`; writes spawn data; **`high` && finale only** |
| Bloom of the ridge | **shared** | palette-as-selector; **no extra pass** on WebGL2 |

**Tier ladder (one `TIERS` table, uniform degradation per `§7` rule 9):**

- **`high`** — both ridges + ridged-noise width mod + Fresnel shimmer + finale particle shed (GPGPU).
  `GW_HIGH` define on. `GW_FBM_OCTAVES` 3–4.
- **`low`** — both ridges + ridged-noise width mod (cheaper). **No** Fresnel shimmer, **no** particle
  shed. `GW_FBM_OCTAVES` 3. The ridge still reads as the dissolve line — only the flourishes drop.
- **`static`** (reduced-motion / weak GPU) — `uTime` frozen to `2`: a single frozen fill ridge and a
  frozen cool-sweep line at a fixed position (one bright threshold, no animation, no shed). It reads as a
  dignified frozen pour mid-reveal — a poster, not a broken fallback. Width fixed (no ridged modulation
  needed when static).

**The levers (priority order per `§10`):** DPR cap 1.5 first; the particle shed is the single
`high`+finale-only term and the first to drop under throttle (the `#ifdef` + `uFinale` gate); the Fresnel
shimmer drops next (demote `high`→`low`); the two ridges and the noise warp are cheap enough to keep on
`low`. The ridge adds **no new pass, no new draw call, no new RT** — it is fragments on an existing quad.

**INP / first-paint:** the ridge's `customProgramCacheKey` is tier-stamped so the variant compiles once
under `renderer.compileAsync` before first scroll; no `new` in the per-frame loop (reads `U`, never
allocates). The only derivatives are the optional Fresnel `viewDir` (standard on WebGL2).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this exact effect):**

1. **No glowing edge at all (the #1 dissolve bug).** Bugnet's catalog: `edgeWidth = 0` collapses the band
   to nothing; an **inverted threshold direction** puts the band off-screen; and forgetting the **HDR
   push** (or rendering into an 8-bit buffer) clamps the ridge at 1.0 so it never blooms. Ship `uWfill`
   > 0, verify `dFill` sign, and confirm the half-float composer buffer (`00 §6`) before tuning anything.
2. **The wipe read.** A clean `smoothstep` on un-warped `db` slides like a loading bar. The `gw_fbm`
   threshold warp (in `gw_band`) is **not optional** — it is the cheapest term and the one that converts
   "wipe" into "dissolve/x-ray." Ship it first.
3. **Authoring for the raw value, not the tone-mapped output.** The `uRidgeHDR` (~2.2) must be tuned
   **through AgX/ACES on the device** (`21`/`33`). A ridge perfect on the raw buffer blooms to a flat white
   blob after the tone-map and bloom. Tune on the iPhone, not in headless QA.
4. **The ridge too thick / too uniform.** A wide, even band reads as a glowing stroke, not a threshold.
   Keep `uWfill` narrow (1–3px effective) and let the ridged-noise width modulation (2.B) give it filigree
   — bright where the crease is sharp, dim between. A uniform stroke is the tell of a fake.
5. **The cool-sweep ridge not tracking the cooling curve.** If `uCoolEdge` isn't the *same* vitrify
   temperature the skin (`05`) and the gloss window (`18 §2.E`) key off, the sweep ridge and the skinning
   happen at different moments and the metal "double-events." The sweep must be the visible instant of the
   *one* `gwCool01` crossing. Verify the sweep ridge passes exactly as the skin appears.
6. **The A/E leaking into the cooling path.** The single most important bug: every cool-path term
   (`ridgeC`, the cool-sweep, the shed tint) must be `* (1.0 - uIsAE)`, and the ridge color must be
   `mix(gw_forge(1.0), gw_divineFire, uIsAE)`. Stamp `uIsAE` early (build-time data) and verify the A/E
   ridge stays white-gold and *never sweeps/cools* while neighbours go iron behind their sweep — **before**
   adding particles, so masking bugs surface early.
7. **Particle shed running continuously.** Shedding during scroll-scrub makes the ridge shimmer the whole
   journey and reads cheap. It must be gated `GW_HIGH && uFinale` — rationed to the climax. A second
   `Points` system is also forbidden (`15`/`09` rule); the ridge only writes `uSparkSeed`.
8. **Forking the bloom.** No per-ridge bloom pass and no `SelectiveBloom` on WebGL2 — the palette selects
   (`00 §3.1`). MRT (`53`) is the *WebGPU* path only. A second bloom pass breaks the merged-`EffectPass`
   budget (`20`).

**Order of operations (each step de-risks the next):**

1. **The fill-ridge substrate** — `dFill = uFillFront - vLayoutU`, bind shared `U`, get a clean banded
   fill-front off the one writer. Verify `/software` matches `13`'s fill before decorating.
2. **The threshold warp + HDR push** — add the `gw_fbm` warp inside `gw_band` and the `uRidgeHDR` boost.
   This is the "dissolve not wipe" moment + the "it blooms" moment. Verify on the iPhone the ridge blooms
   and is ragged during a strike.
3. **The ridged-noise width modulation** — give the line filigree. Verify it's bright on creases, dim
   between, never a uniform stroke.
4. **The A/E clamp** — stamp `uIsAE`, route the ridge color to divine fire, kill `ridgeC` on A/E. Verify
   the A/E ridge is white-gold and never sweeps/cools. **Do this before the cool-sweep and particles.**
5. **The cool-sweep ridge** — add the second `gw_band` on `Tnow - uCoolEdge`, `uCoolEdge` = the shared
   vitrify temp. Verify the sweep passes exactly as `05`'s skin appears (one event, no double).
6. **The Fresnel shimmer** (`high`) — the view-dependent multiplier. Verify it catches the camera as the
   letter turns without over-brightening.
7. **The finale particle shed** — hook `uSparkSeed` into `15`/`09`, gate `GW_HIGH && uFinale`. Verify
   shedding only on the finale beat, sparks inherit `gw_forge` tint, A/E sparks gold, none during scroll.
8. **Tier-gate + QA** — `GW_HIGH` define, `low`/`static` fallbacks, `customProgramCacheKey`,
   `compileAsync`. Verify on the iPhone 15 OLED (ridge bloom spread, true-black ahead of the fill ridge,
   the white-gold A/E that refuses to cool) — these do **not** simulate in headless QA.

---

## 8. SOURCES (2025–2026)

1. **Codrops — *Implementing a Dissolve Effect with Shaders and Particles in Three.js*** (Feb 17, 2025).
   The canonical edge-band reveal: `noise < uProgress → discard`, the `uProgress..uProgress+uEdge`
   emissive edge color, particles shed at the edge, selective bloom on the glow — the substrate grammar.
   https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/
2. **Codrops — *WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL***
   (Jan 28, 2026). The 2026 evolution: MSDF text, noise-driven TSL dissolve with a glowing edge,
   dust+petal particles shed at the threshold, MRT selective bloom — the direct title reference.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
3. **Codrops — *Interactive Text Destruction with Three.js, WebGPU, and TSL*** (Jul 22, 2025). WebGPU
   particle constraint (no variable point size → Sprites/InstancedMesh) and the text-deform grammar — the
   particle-shed path on the WebGPU port.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
4. **Codrops — *How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects***
   (Oct 8, 2025). Animating a `progress`/threshold uniform with `smoothstep` soft edges — the moving
   front. https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
5. **Three.js Roadmap — *10 Noise Functions for Three.js TSL Shaders*** (Dec 8, 2025). Ridged noise
   (`1 - abs(noise)`, edge emphasis), Worley, domain warp with TSL+GLSL parity — the width-modulation and
   threshold-warp primitives. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
6. **Three.js Roadmap — *Rim Lighting Shader*** (2025). `rimColor`/`rimPower`/`rimIntensity` Fresnel grammar
   — the view-dependent ridge shimmer multiplier. https://threejsroadmap.com/blog/rim-lighting-shader
7. **Maxime Heckel — *Field Guide to TSL and WebGPU*** (Oct 2025). Emissive/MRT, Fresnel power (focused vs
   scattered highlight), `smoothstep` banding, `mix`/`oneMinus`/`step` nodes — the TSL-portable ridge +
   selective-bloom grammar. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
8. **Bugnet — *How to Fix a Dissolve Shader Missing Its Glowing Burn Edge*** (2025). The exact band formula
   `edge = smoothstep(threshold, threshold+edgeWidth, noise)`, the HDR emissive add, and the three
   ridge-killing bugs (edgeWidth=0, inverted threshold, missing bloom).
   https://bugnet.io/blog/how-to-fix-dissolve-shader-no-emissive-burn-edge
9. **three.js — WebGPU *bloom selective* / *bloom emissive* examples + BloomNode docs** (2026). MRT
   `scenePass.setMRT(mrt({ output, emissive }))` selective-bloom path — the WebGPU port isolation of the
   ridge. https://threejs.org/examples/webgpu_postprocessing_bloom_selective.html ·
   https://threejs.org/docs/pages/BloomNode.html
10. **Agate DRAGON Games — *Creating a Dissolve Shader*** (Oct 31, 2025). Independent 2025 walk-through of
    the noise-threshold + edge-width + emissive-edge dissolve, corroborating the band formula and HDR edge.
    https://agatedragon.blog/2025/10/31/creating-a-dissolve-shader/

---

## 9. DEEP-DIVE CANDIDATES

1. **Designer-painted ridge cross-section LUT (2.D)** — bottling the exact white-core → ember-shoulder →
   fade falloff in a half-float 1-D ramp, cross-faded per route, vs the closed-form `gw_forge(1.0)` ridge.
   The A/B on whether a hand-painted profile beats the one-function purity at the closest hero distance.
2. **The cool-sweep choreography vs the fill front** — the *timing offset* between the two ridges: does the
   solidification sweep chase the fill front tightly (a hot thin letter) or lag far behind (a long molten
   dwell)? Per-glyph tuning against real Cinzel stroke-mass (`02 §2`), owned against the `61` one-beat
   choreography and the `27`/`28` camera journey.
3. **MRT emissive-ridge bloom port (`53`)** — the WebGPU/TSL migration of the ridge isolation from
   palette-as-selector to an MRT emissive target: the stability matrix (`54`), the bloom-node wiring, and
   whether the iPhone Safari WebGPU path holds the budget the WebGL2 ship meets.
4. **The A/E divine-flood ridge beat** — the *finale* choreography of the A/E ridge: as every neighbour's
   cool-sweep passes and leaves iron, the A/E ridge **surges** (a brightness pulse on `uFinale`) and sheds
   its gold sparks — the single narrative climax where the divine fire visibly refuses the cooling the
   whole wordmark just underwent. Owned as a choreography sub-topic.
