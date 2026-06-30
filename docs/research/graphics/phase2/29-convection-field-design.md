# 29 — Convection Field Design: Forge Air, Not Water

_Phase 2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · the noise composition,
frequency stacking, sample-below geometry, per-region turbulence, and `uStrength`/`uScale` envelope that
makes the heat-haze read as **rising forge air** and never as **sloshing water** or seasickness on the
iPhone 15 OLED._

> **Reads from `00-COHESION-MAP.md` (§1 temperature, §2 noise, §5.4 atmosphere, §6 post-FX order, §10 budget)
> and from Phase-1 doc `16-heat-haze-refraction.md`, which settled the *family* (a single custom pmndrs
> `HeatHazeEffect`, `mainImage`-style screen-UV warp, luminance-derived hot-mask, before Bloom).** That doc
> deliberately deferred *the field itself* to a Phase-2 deep-dive — this is it. Doc 16 owns the **plumbing**
> (the Effect class, the composer slot, the convolution attribute, the mask provenance). This doc owns the
> **physics of the wobble**: how the noise is composed so the air *rises, shimmers, and convects* instead of
> drifting sideways like a pool of water, and the exact amplitude/frequency envelope that survives a 6.1"
> OLED held 30 cm from the eye without inducing motion sickness or tearing a Cinzel letterform.

---

## 1. SCOPE — this element in the GAELWORX world

In the forge, **the air is not silent**. A column of superheated gas rises off the white-hot pour front, off
each freshly-filled GAELWORX letter, and — eternally — off the divine-fire **A** and **E**. That column must
**bend the framebuffer behind it**: the carved basalt, the Ogham grooves, the channel walls, the cooler
letter bodies all *swim and wobble* when seen through the rising heat. This is the cheapest, highest-impact
"this is a real furnace" cue in the whole scene, and it is the connective tissue that makes the molten pour,
the cooling letters, the A/E, and the sparks feel like they share **one physical atmosphere**.

The narrow problem this document solves is the one thing that separates a convincing forge from a cheap
"wavy filter": **real hot air does not behave like water.** Water refraction (the canonical Bebber / Far Cry
move) is an *isotropic, omnidirectional* low-frequency swell — equal sway in X and Y, slow, syrupy. Hot air
is the opposite: it is **buoyancy-driven and strongly vertical** — fine high-frequency cells *rise* through a
slower large-scale updraft, the turbulence is *intense and chaotic right at the heat source* and *calms as
it climbs and cools*, and the dominant motion vector points **up**, not sideways. Get the composition wrong
and the forge looks like it is underwater. Get the amplitude wrong and the OLED viewer feels seasick within
seconds — fatal, because the iPhone 15 is held close and the judge will scroll for two minutes straight.

This element binds to the world through four shared systems already locked by the cohesion map: the **master
temperature** signal (`uHeat`/`uTemp` — the air shimmers harder when the forge runs hotter), the **shared
noise basis** (`gw_fbm`/`gw_snoise` — the air's grain *is* the metal's grain), the **palette-as-mask
discipline** (only HDR `>1` pixels are "hot," so shimmer and Bloom agree on what is hot for free), and the
**one composer / one clock** law (`dt`-damped, before Bloom, frozen on `static`). Nothing here invents a new
orange, a new noise, or a new rAF. It is a *composition* of existing primitives, tuned to a physical brief.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Doc 16 chose the *delivery mechanism* (screen-space UV warp in a pmndrs Effect). The open question for this
deep-dive is **how to compose the displacement field**. Six approaches are alive in 2025–2026 work, ordered
roughly cheap→expensive.

### 2.A Single-octave vertical-scroll sine/noise (the naïve "wavy filter")
`offset.y = sin(uv.x*f + t)`; one frequency, time added to a coordinate. This is the 2006 Wolfire / Far Cry
screen-space-distortion lineage, still the most-copied snippet (Godot Shaders' "Heat haze shader" is exactly
this in 2025). **Tradeoff:** trivial and free, but it *scrolls* — the texture visibly slides in one
direction, reads as a fake repeating band, and has none of the fine-over-slow structure that sells
convection. Rejected as the field, but its **vertical bias** is the one correct instinct to keep.

### 2.B Two-octave stacked fbm with anisotropic time advection (the recommended composition)
Two `gw_fbm` evaluations at different scales and time-rates, the coarse one supplying a slow large-scale
updraft and the fine one supplying fast shimmer cells, summed with a **vertical-dominant** weight vector and
**advected upward in time** (the noise's 3rd coordinate / offset moves *up*, so cells are born low and rise).
This is the modern frequency-stacking pattern documented across 2025 noise write-ups — Inigo Quilez's
domain-warp lineage as recompiled in the 2025 MiniMax-AI shader-dev "domain-warping" skill notes ("chaining
FBM layers, each feeding the next, lacunarity ~2, a rotation between octaves to break lattice alignment"),
and the Three.js Roadmap's 2025 *10 Noise Functions for TSL Shaders* (fbm + flow-noise + curl as the
distortion toolbox). **Tradeoff:** two fbm evals (3-octave each on `high`) is the ceiling cost doc 16 set; it
*boils in place* and convects upward without scrolling. **This is the pick** — detailed in §3–§4.

### 2.C Domain-warped fbm (`fbm(p + fbm(p))`) for the field itself
Use IQ two-level domain warping to generate the offset, so the shimmer cells themselves curl and fold like
real turbulence rather than being smooth blobs. The 2025 AltPsyche "FBM and Domain Warping" write-up and the
Shadertoy 2025 "Domain Warping Study" (W3KyR3) both show this giving the characteristic *licking, folding*
quality of rising heat. **Tradeoff:** one extra fbm eval per warp level — a domain-warped field is ~50%
dearer than 2.B. Reserve **one warp level for `high` only**, as an additive upgrade on top of 2.B (the base
field stays 2.B on `low`). This is the cohesion-correct way to add detail: *one more octave / one more warp
level*, never a second noise.

### 2.D Curl-noise advected field (divergence-free, physically-grounded)
Drive the offset with analytic-derivative 3D curl noise (`gw_curl3`, already in the master toolkit for sparks
per cohesion §2). Curl is *divergence-free*, so the field has no sources/sinks — it looks like genuine
incompressible gas swirl, and it is the same primitive the pour-front sparks ride, so the air and the sparks
share a flow. **Tradeoff:** curl is 3 noise evals minimum (and the master `gw_curl3` is built for *particle
advection over substeps*, not a per-pixel post fetch). For a full-screen post pass it is dearer than 2.B for
a benefit (true incompressibility) the eye barely reads in a 0.007-amplitude warp. **Verdict: not for the
post pass** — but the *spark* haze coupling (§5) can borrow the sparks' existing curl field cheaply.

### 2.E `MeshTransmissionMaterial` "heat panel" (true depth-aware geometry refraction)
drei's transmission material with `distortion`/`temporalDistortion` over an invisible quad — the Codrops
March-2025 glass-torus article documents these exact props as "heat distortion." **Tradeoff:** each
transmission surface re-renders the scene into a buffer; the three.js forum's recurring 2025
"MeshTransmissionMaterial poor performance" threads (incl. Apple silicon) confirm it is a mobile killer for a
*field*. Doc 16 already gates transmission to `high` on the slab alone. Out for the convection field.

### 2.F TSL / WebGPU `viewportSharedTexture` screen-UV refraction with depth compare
The 2025–2026 forward path: sample the framebuffer via a viewport-texture node, offset the screen UV by the
noise field, and use Maxime Heckel's Oct-2025 *Field Guide to TSL and WebGPU* "screen-UV function with depth
comparison" to kill the classic "sample a pixel in front of the surface" bleed artifact. The Jan-2026 Codrops
*WebGPU Gommage* piece shows the matching modern stack (noise-driven TSL + **MRT selective bloom**), which is
relevant because on WebGPU the hot-mask would come from an MRT `emissive` attachment rather than a luminance
threshold — strictly cleaner. **Tradeoff:** the whole `@react-three/postprocessing` composer is WebGL today,
iOS Safari WebGPU is the 2026 risk surface, and betting the judge device on the less-tested WebGPU WebGL2
fallback is the documented mistake (cohesion §10). **Author the field so it ports to TSL `Fn()` 1:1; ship
GLSL now; gate WebGPU post-judge.**

**Landscape verdict:** the field is **2.B (two-octave vertical-advected fbm), with 2.C's one domain-warp
level as the `high`-only upgrade, and 2.D's curl borrowed only for the spark-haze coupling.** Everything else
is either too cheap to convect (2.A) or too dear for mobile (2.D-full / 2.E / 2.F-now).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Compose the displacement as a vertically-biased, upward-advected, two-frequency `gw_fbm` field —
`offset = vec2(smallSway, dominantRise)` — whose amplitude is gated by the heat-mask-sampled-below-the-
fragment, modulated by a per-region turbulence term (hot near the pour front, calm above cooled letters), and
clamped by a strict `uStrength`/`uScale` envelope. On `high`, add one domain-warp level so the cells fold.**

The composition has five named ingredients, each answering one word of the brief "rising forge air, not
water":

1. **Vertical bias (`rises`).** The Y component of the offset is ~2.5× the X component, and the X sway is
   itself derived from a *different, lower-frequency* noise so the horizontal motion is a lazy lean, not a
   matching wobble. Real heat columns shear sideways slowly while shimmering fast vertically. A 1:1 X:Y
   weight is the single biggest "underwater" tell.

2. **Upward time advection (`convects`).** Instead of `fbm(p + t)` (which scrolls the texture sideways and
   reads fake), the fine octave's *sample point* moves **up** over time: `p.y -= uTime * riseSpeed`. Cells
   are therefore born at the heat source and travel up the screen, the literal motion of convection. The
   coarse octave advects up *slower* (parallax: distant updraft moves less), which gives depth for free.

3. **Frequency stacking (`shimmers over drift`).** A **slow coarse** octave (`uScale` base, the large-scale
   updraft and lean) carries a **fast fine** octave (`uScale × ~2.1`, the shimmer cells). The fine octave is
   what reads as "heat"; the coarse octave is what keeps it from looking like static TV noise. The fine:coarse
   *time-rate* ratio (~3:1) matters as much as the spatial ratio — shimmer must visibly out-pace drift.

4. **Per-region turbulence (`intense at the source, calm aloft`).** Turbulence amplitude is **not uniform**.
   It is highest directly above the hottest pixels (pour front, white-hot letter tips, A/E) and decays as the
   air climbs and as the metal beneath cools. This falls out *almost for free* from the **sample-below
   mask**: because we read the hot-mask from a texel *beneath* the fragment, a fragment high above cooled
   iron-black metal sees a cold mask and gets near-zero warp, while a fragment just above the white-hot pour
   front sees a blazing mask and gets full warp. We reinforce it with a small turbulence-frequency boost
   tied to the same mask (hotter air = finer, busier cells).

5. **The seasickness/letterform envelope (`sub-nausea, never tears Cinzel`).** `uStrength` is the max
   screen-UV offset and is the single nausea dial; it stays **≤ 0.010** screen-units (doc 16's bound), starts
   at 0.004, and is scaled down by `uHeat` so it only reaches max when the forge is genuinely raging. The A/E
   get an explicit *protective clamp* so the divine-fire glyphs never warp enough to read as broken.

Why this is the GAELWORX-correct pick and not a generic heat shader:

- **It hooks the master temperature system as a multiplier, not a copy.** The whole field amplitude is
  `uStrength × mask × (0.35 + 0.65·uHeat)`. `uHeat` is the *same* scroll/strike-driven signal the slab veins,
  Bloom intensity, god-rays, and caustics read (cohesion §1.5). Scroll into a hot chamber and the air
  convects harder on the *same heartbeat* the veins flare — the synchrony is the cohesion proof.
- **The mask is the cooling gradient, for free.** Because the mask thresholds HDR luminance (cohesion §3.1:
  only the 10% accent band exceeds 1.0), the white-hot tip of a letter shimmers and the iron-black foot of
  the *same letter* is glassy-still — the cooling temperature ramp drives the haze falloff with zero extra
  code. A cooling letter and the calming air above it are visibly one cooling event.
- **It degrades uniformly (cohesion §9).** `high` = 2 fbm + 1 domain-warp + chromatic split; `low` = 2 fbm,
  no warp, no split; `static` = the entire `<Effects>` tree is unmounted (doc 16), so the haze is frozen and
  free — a dignified still, not a broken fallback.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new dependency)
- `postprocessing` ^6.37 + `@react-three/postprocessing` ^3 — already in the repo (`Effects.jsx`).
- `three` r17x (current repo pin) — WebGL `MeshPhysicalMaterial` + pmndrs, **no TSL/WebGPU**.
- Reuse `GLSL_NOISE` (`gw_fbm`, `gw_snoise`) from `src/scene/shaders.js` and `PAL`/`v3` from
  `src/scene/palette.js`. This builds *on top of* doc 16's `HeatHazeEffect` — same file, richer frag.

### 4.2 The convection field, in GLSL
This replaces the placeholder offset block inside doc 16's `HeatHazeEffect` frag. Everything new is the
`gwConvection()` function and the per-region turbulence; the mask, the chromatic split, and the class
scaffold are unchanged from doc 16.

```glsl
uniform float uTime;
uniform float uHeat;       // master temperature 0..1 (scroll + strike + vel)
uniform float uStrength;   // max screen-UV offset — THE nausea dial (≤0.010)
uniform float uScale;      // base (coarse) noise frequency
uniform float uThreshold;  // HDR luminance gate (~0.9) — same convention as Bloom
uniform float uRise;       // upward advection speed (cells/sec)  (~0.45)
uniform float uAspect;     // resolution.x / resolution.y — keep cells round
${GLSL_NOISE}              // gw_fbm, gw_snoise, gw_warp  (shared basis)

// HDR-luminance hot mask. Hot metal is the only thing >1 (palette discipline),
// so shimmer & bloom agree on "what is hot" with zero extra render cost.
float gwHotMask(vec3 c){
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return smoothstep(uThreshold, uThreshold + 0.6, l);
}

// THE CONVECTION FIELD. Returns a screen-UV offset (pre-amplitude).
// p   : aspect-corrected uv*scale
// turb: 0..1 local turbulence (1 = right above the pour front, 0 = calm aloft)
vec2 gwConvection(vec2 p, float turb){
  // Coarse octave: the slow large-scale UPDRAFT + lazy sideways lean.
  // Advect UP slowly (parallax: distant column moves least). Boil, don't scroll.
  vec2 pc = p;
  pc.y -= uTime * uRise * 0.45;
  float drift = gw_fbm(pc);                       // 0..1

  // Fine octave: the fast SHIMMER cells. Higher freq, ~3x faster rise.
  // Frequency itself rises with turbulence (hotter air = busier cells).
  vec2 pf = p * (2.1 + turb * 0.9);
  pf.y -= uTime * uRise * (1.4 + turb * 0.6);
  float shimmer = gw_fbm(pf);

  // HIGH-TIER ONLY: one domain-warp level so cells fold/lick (gw_warp).
  // #ifdef GW_HAZE_HIGH adds ~one fbm eval; low tier compiles it out.
  #ifdef GW_HAZE_HIGH
    shimmer = mix(shimmer, gw_warp(pf), 0.45);
  #endif

  // Vertical-dominant compose. X sway is the SLOW drift (lazy lean);
  // Y is shimmer+drift and ~2.5x heavier. 1:1 X:Y is the "underwater" tell.
  float sway = (drift   - 0.5);                    // lazy horizontal lean
  float rise = (shimmer - 0.5) * 0.8 + (drift - 0.5) * 0.2;
  return vec2(sway * 0.40, rise * 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  // SAMPLE BELOW THE FRAGMENT: heat rises, so the air at `uv` is heated by the
  // metal BENEATH it. Sampling at-fragment makes the silhouette wobble (wrong);
  // sampling below makes the air ABOVE the metal wobble (right).
  vec2 belowUv  = uv - vec2(0.0, 0.055);
  float maskLo  = gwHotMask(texture2D(inputBuffer, belowUv).rgb);   // primary driver
  float maskHi  = gwHotMask(inputColor.rgb) * 0.5;                  // tiny at-fragment
  float mask    = max(maskLo, maskHi);

  // PER-REGION TURBULENCE: hot near source, calm aloft. Use the below-mask as
  // the turbulence proxy (it is already "how hot is the metal under me").
  float turb = maskLo;

  vec2 p = vec2(uv.x * uAspect, uv.y) * uScale;
  vec2 offset = gwConvection(p, turb);

  // Amplitude envelope: clamped, heat-scaled, mask-gated. uStrength ≤ 0.010.
  float amp = uStrength * mask * (0.35 + 0.65 * uHeat);
  vec2 warped = clamp(uv + offset * amp, vec2(0.0), vec2(1.0)); // no edge bleed

  // Air's own micro chromatic shimmer (high only — mirrors the slab CA).
  #ifdef GW_HAZE_HIGH
    float ca = amp * 0.18;
    vec3 col;
    col.r = texture2D(inputBuffer, clamp(warped + vec2(ca,0.0),0.0,1.0)).r;
    col.g = texture2D(inputBuffer, warped).g;
    col.b = texture2D(inputBuffer, clamp(warped - vec2(ca,0.0),0.0,1.0)).b;
    outputColor = vec4(col, inputColor.a);
  #else
    outputColor = vec4(texture2D(inputBuffer, warped).rgb, inputColor.a);
  #endif
}
```

The three additions over doc 16's frag: (1) **`gwConvection()`** with explicit coarse/fine octaves, upward
advection, and vertical-dominant compose; (2) **`turb`** wired from the below-mask so turbulence is
per-region (hot at source, calm aloft) and *raises the fine-octave frequency* locally; (3) **`uAspect`** so
cells stay round instead of stretching on a portrait phone (the iPhone 15 is ~0.46 aspect held vertically —
without this, "vertical" cells become smeared horizontal streaks).

### 4.3 The r3f component shape
Unchanged from doc 16 in structure — `wrapEffect`, its own `EffectPass` (the `CONVOLUTION` attribute forces
the split from Bloom), driven from the shared `forge` store. The new uniforms (`uRise`, `uAspect`) are set
once / on resize; `uHeat`/`uTime` are the only per-frame writes, both `dt`-damped.

```jsx
const HeatHazeImpl = wrapEffect(HeatHazeEffect)

export function HeatHaze({ quality }) {
  const ref = useRef()
  const { size, viewport } = useThree()
  useEffect(() => {                       // aspect on mount + resize, not per-frame
    const e = ref.current; if (!e) return
    e.uniforms.get('uAspect').value = size.width / size.height
  }, [size.width, size.height])
  useFrame((state, dt) => {
    const e = ref.current; if (!e) return
    if (quality === 'static') { e.uniforms.get('uTime').value = 2; e._frozen = true; return }
    e._frozen = false
    e.uniforms.get('uTime').value += dt
    const vel   = Math.min(forge.scrollVel * 1.4, 1)
    const since = performance.now() / 1000 - forge.strikeAt
    const surge = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) * 0.6 : 0
    const target = Math.min(forge.scrollDamped * 0.6 + vel * 0.4 + surge, 1)
    const u = e.uniforms.get('uHeat')
    u.value = damp(u.value, forge.ready ? target : 0, 3, dt)   // dt-damped, never lerp
  })
  return (
    <HeatHazeImpl ref={ref}
      strength={quality === 'high' ? 0.007 : 0.0045}
      scale={quality === 'high' ? 3.2 : 2.4}
      rise={0.45} high={quality === 'high'} />
  )
}
```

The `high` prop drives a `#define GW_HAZE_HIGH` in the Effect constructor (defines-as-tier, so the loop
unrolls and the low path has zero dead branches — the same `GW_FBM_OCTAVES` discipline from cohesion §2/§10).

### 4.4 Key uniforms / params (leva-tunable via `?debug`)
| Uniform | high / low | Meaning · tuning law |
|---|---|---|
| `uStrength` | 0.007 / 0.0045 | max UV offset. **The nausea dial.** Start 0.004, raise slowly, hard-cap 0.010. |
| `uScale` | 3.2 / 2.4 | base (coarse) frequency. Higher = finer "shimmer," lower = wider "wobble." |
| `uRise` | 0.45 | upward advection speed. Too high = "rocket exhaust"; too low = static noise. |
| `uThreshold` | 0.9 | HDR-luminance gate. Higher than Bloom's 0.55 so only the *hottest* air convects. |
| `uHeat` | runtime, damped | master temperature; scales amplitude 0.35→1.0. Same signal as veins/Bloom. |
| `uAspect` | resolution ratio | keeps cells round on portrait; without it vertical cells smear. |
| `uTime` | accumulated dt | frozen to `2` on `static`. |

### 4.5 How it hooks the shared master temperature system
- **Amplitude = `f(uHeat)`.** `uHeat` damps off `forge.scrollDamped + scrollVel*0.4 + strikeSurge` — byte-for-
  byte the same expression `ObsidianSlab` uses for its veins. One temperature, two manifestations.
- **Localization = the cooling ramp.** The HDR-luminance mask *is* `gw_tempEmissive` output: a fragment only
  exceeds 1.0 when its `temp` is in the hot band (cohesion §1.2). So the haze's spatial falloff is literally
  the master temperature field projected to screen — no second heat source.
- **Per-region turbulence = the pour-front + cooling clock.** `turb` rides the below-mask, which is hottest
  at the pour front (`uPourFront`, freshest metal) and cools as `gwCool01(age)` climbs — so the air is most
  violent exactly where the metal just poured and calmest above letters that have cooled to iron-black.
- **A/E divine fire.** The eternal white-gold A/E never cool, so they are always the brightest emitters →
  always under a convecting column. The haze *ratifies* the keystone rule (their air never calms) instead of
  fighting it — but the §7 clamp guarantees the warp never dissolves the glyph.

---

## 5. COHESION — shared palette / lighting / uniforms

- **One noise basis.** `gwConvection` calls `gw_fbm`/`gw_warp` from `shaders.js` — the *same* field driving
  the obsidian veins, the molten flow, the embers, and the caustics. The air's grain is the metal's grain;
  they are one substance, sampled at different scales. "More detail" is the `GW_HAZE_HIGH` warp level, never a
  forked noise (cohesion §2 binding rule).
- **One mask convention = the palette.** The luminance gate keys off the HDR `>1` band that `palette.js`
  reserves for the hottest 10% (`PAL.hot`, `PAL.emberHot`, `PAL.divine`, vein cores). Shimmer, Bloom, god-
  rays, and the heat mask all agree on "what is hot" because they read the *same* HDR convention — the
  palette is the heat selector (cohesion §3.1).
- **One clock, one rAF, `dt`-damped.** `uTime += dt`, `uHeat` via `damp(...,dt)`; no `setInterval`, no
  `lerp(a,b,k)`, no competing rAF. A strike surges veins + Bloom + god-rays + **the convection amplitude** in
  the same frame (cohesion §7.6).
- **One composer, correct order.** The haze sits **before Bloom** (cohesion §6): lens physics first, light
  second — so the *warped* hot pixels bloom, giving the soft filmic heat read instead of a sharp bloom ring
  smeared by air. Its `CONVOLUTION` attribute forces its own `EffectPass`, which is correct and intended.
- **Shared chromatic language.** The `high`-only per-channel split mirrors the slab's `ChromaticAberration`
  — the air refracts color the way the obsidian's edges do, not as a foreign rainbow.
- **Spark coupling (the one cross-element borrow).** Additive embers are bright enough to trip the mask, so
  the air around a rising spark trail wobbles automatically — desirable and physical. If a tighter coupling
  is wanted on `high`, the sparks already carry a `gw_curl3` velocity (cohesion §2 / Phase-2 doc 09); feeding
  a low-weight curl sample into `gwConvection`'s sway near spark clusters ties air and sparks to one flow
  **without** adding a full curl field to the post pass.
- **Brutalism / palette untouched.** Pure screen-space, no DOM, no rounding, no cool/green/blue cast — fully
  inside the warm-forge + 0px-brutalism constraints.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The judge device is an iPhone 15 OLED, DPR-capped to 1.5, ~9–10 ms steady-state high-tier budget with
thermal throttle after ~90 s (cohesion §10). Heat-haze is a **fill-rate** cost (one full-screen pass), the
exact thing the budget guards.

- **Cost on `high`:** one extra full-screen pass — **~4 texture fetches** (below-mask, +3 for the CA split)
  **+ 2 `gw_fbm` (3-octave) evals + 1 `gw_warp` eval**. Comparable to the Bloom prefilter, ~0.6–0.9 ms at
  DPR 1.5. No scene re-render, no transmission buffer (the family-2.E mobile killer), no depth pass
  (`disableNormalPass` stays — the luminance mask needs no depth).
- **Cost on `low`:** drop the CA split (1 fetch instead of 3) and the domain-warp (`GW_HAZE_HIGH` off) → **2
  fetches + 2 fbm**, ~0.35–0.5 ms. The frag compiles a genuinely shorter path because the high blocks are
  `#ifdef`-gated, not runtime-branched.
- **`static` tier:** the entire `<Effects>` tree is unmounted (`ForgeCanvas` gates it on reduced-motion /
  weak GPU), so the haze is **frozen and zero-cost** — `uTime=2`, no shimmer. This satisfies the mandatory
  reduced-motion law (vestibular safety — see §7) with no extra branch.
- **Half-res fallback (only if profiling demands).** The field is low-frequency enough to tolerate a
  half-res `inputBuffer` read; wire a `resolutionScale 0.5` variant *only if* on-device profiling shows
  pressure. Start full-res — premature downsampling softens the shimmer.
- **The three fill-rate levers, applied:** DPR is capped upstream (1.5); the fbm octave count rides the
  shared `GW_FBM_OCTAVES` (3 on high, 2 on low) so the haze thins in lockstep with every other procedural
  surface; the pass merges nothing (it is convolution) but is a single cheap pass.
- **Verify the repo way:** `npm run build` green → `qa-route` at 393×852 + 1440×900 with **0 console errors**
  (SwiftShader compiles the GLSL in CI, so a typo surfaces) → **then the iPhone 15 OLED read** — the subtle
  warp + true-black + OLED saturation do not simulate headless, and the seasickness threshold can only be
  judged on the device, held at arm's length, scrolling for two minutes.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

1. **Aspect-correct the field first.** The iPhone 15 held vertically is ~0.46 aspect. Without `uAspect`,
   "vertical" cells stretch into horizontal smears — the exact *opposite* of the brief. Apply `uAspect` to
   `uv.x` before anything else and confirm cells look round.
2. **Vertical bias is the anti-water law.** Keep Y ≥ ~2× X, and derive X from the *slow drift* octave, not
   the fast shimmer octave. A 1:1 isotropic offset is instantly "underwater." If it looks like a pool, the
   X:Y ratio is wrong before the strength is.
3. **Advect up, don't scroll sideways.** `p.y -= uTime*rise` (cells rise), never `p += uTime` (texture
   slides). Scrolling is the single most common "fake heat" tell in 2025 copy-paste shaders.
4. **Frequency stack, don't single-octave.** Fast fine *over* slow coarse, with the fine octave ~3× faster
   in time. One octave reads as TV static or a sine band; the stack reads as shimmer-over-drift.
5. **Sample below, not at.** Drive each fragment from the mask ~0.055 *beneath* it. At-fragment sampling
   wobbles the metal's silhouette (wrong); below-sampling wobbles the air rising off it (right) and gives the
   per-region turbulence falloff for free.
6. **The seasickness gate — start LOW.** Begin `uStrength` at 0.004, raise toward 0.007 max, hard-cap 0.010,
   and scale by `uHeat` so it only peaks when the forge rages. This is the WCAG-2.2 / vestibular-safety line:
   2025 accessibility guidance is explicit that *large-area, continuous, vertical* motion is the prime nausea
   trigger, and a close-held OLED amplifies it. Brutalist Snap = "no bounce, only impact" — the air *drifts*,
   it must never *slosh*.
7. **Protect the A/E and the letterforms.** Bounded `uStrength` + the per-fragment mask means the divine-fire
   A/E shimmer their *surrounding air* without dissolving the glyph. Eyeball the Cinzel **A** and **E**
   specifically; if a stroke ever tears, the strength is over budget — lower it, do not mask the letter out
   (masking it out kills the "eternally hot" read).
8. **Order before tuning.** Lock the composer slot (**before Bloom**) and the `CONVOLUTION` attribute first;
   a haze after Bloom smears glow with air (reads as a bug) and no field tuning fixes it.
9. **Mask before field.** Visualize the mask (`outputColor = vec4(vec3(mask),1.0)`) and confirm it lights
   only white-hot regions and is black on cooled letters/basalt *before* touching the offset. A wrong mask
   can't be tuned away with field params.
10. **Clamp the warped UV.** `clamp(warped,0,1)` so an edge fragment can't sample outside the buffer and
    smear; at 0.007 the offset is small, but the clamp is free insurance.

**Order of operations:** (1) lock composer slot + `CONVOLUTION` → (2) build + visualize mask → (3)
aspect-correct + static field at low strength → (4) add upward advection + frequency stack + vertical bias →
(5) wire `turb` from the below-mask (per-region) → (6) wire `uHeat` + strike surge to amplitude → (7)
`high`-only domain-warp + chromatic split + tiering defines → (8) `qa-route` 0-errors → (9) iPhone-15 device
read, scroll for 2 min, tune `uStrength`/`uScale`/`uRise` to taste.

---

## 8. SOURCES (2025–2026)

- Maxime Heckel — **Field Guide to TSL and WebGPU** (2025-10-14): the depth-compare screen-UV / viewport-
  texture node for refraction, and `Fn()` as the reuse primitive for porting the field to TSL.
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Three.js Roadmap — **10 Noise Functions for Three.js TSL Shaders** (2025): fbm, flow-noise, curl, and
  domain-warp as the modern distortion toolbox; frequency stacking and lacunarity guidance.
  https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
- Codrops — **How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects**
  (2025-10-08): modern animated-uniform UV-offset / noise-driven distortion patterns.
  https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
- Codrops — **WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL**
  (2026-01-28): the current noise-driven TSL + **MRT selective bloom** stack — the WebGPU path the mask would
  take post-judge. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
- Codrops — **Warping 3D Text Inside a Glass Torus** (2025-03-13): `MeshTransmissionMaterial`
  `distortion`/`temporalDistortion` for heat-style refraction and its resolution/samples perf cost (family
  2.E). https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- MiniMax-AI / skills — **shader-dev: Domain Warping technique reference** (2025): IQ-lineage `fbm(p+fbm(p))`
  layering, inter-octave rotation, lacunarity ~2 — the composition basis for the folding cells.
  https://github.com/MiniMax-AI/skills/blob/main/skills/shader-dev/techniques/domain-warping.md
- AltPsyche — **FBM and Domain Warping** (2025): frequency stacking and the "swirling liquid / rising heat"
  folding quality of domain-warped fbm. https://altpsyche.dev/blog/sf-fbm-and-warping
- arXiv — **Real-Time 3D Simulation of Heat-Induced Air Turbulence** (2026, 2603.02048): the physics this
  effect approximates — buoyant flow → spatially-varying refractive index → vertical-biased screen
  distortion; confirms the vertical/convection bias is physically correct, not stylistic.
  https://arxiv.org/pdf/2603.02048
- A List Apart — **Designing Safer Web Animation for Motion Sensitivity** / Adobe Design — **Animation that
  fails safely** (2025): large-area continuous motion as the prime vestibular trigger and the reduced-motion
  fail-safe — the basis for the `uStrength` cap and the frozen `static` tier.
  https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/ ·
  https://adobe.design/stories/leading-design/animation-that-fails-safely-defensive-design-for-motion-sensitive-users
- pmndrs — **postprocessing: Custom Effects wiki** (maintained 2025): `mainImage` signature,
  `CONVOLUTION`/`DEPTH` attributes, `inputBuffer`/`resolution`/`texelSize` uniforms — the API this field
  extends. https://github.com/pmndrs/postprocessing/wiki/Custom-Effects

_(Foundational pre-2025 lineage — Wolfire's 2006 screen-space distortion, Far Cry's texture-perturbation
refraction, IQ's domain-warping article — cited only as ancestry; all implementation guidance tracks the
2025–2026 sources above.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Per-chamber convection presets.** The field amplitude/scale/rise should differ per chamber — violent
   above the live pour in casting-room, near-still over the mirror in scrying-pool, a long calm column in the
   top-down channel-hall. How to drive `uStrength`/`uScale`/`uRise` from the `scenes.js` preset table
   (damped, never cut) so each aperture has its own air without a second system.
2. **A/E divine-fire heat column as a distinct signature.** Whether the eternal white-gold A/E should get a
   *different* convection character (tighter, brighter, more vertical, never-calming) than cooling-letter
   haze — and how to author that from `uAEFire`/`uAEFirePow` without a second pass, so the divine fire's air
   visibly differs from mortal-metal air.
3. **Curl-coupled spark/air unification.** Feeding the sparks' existing `gw_curl3` velocity field into the
   convection sway near spark clusters so air and embers share one incompressible flow — the cost/benefit of
   sampling a real curl field in the post pass vs. the cheap below-mask approximation.
4. **WebGPU/TSL migration of the field.** Porting `gwConvection` to a `viewportSharedTexture` + depth-compare
   screen-UV node (Heckel pattern) with MRT-`emissive` hot-mask, and what the renderer migration costs the
   whole `Effects` chain — the gated post-judge upgrade.
</content>
</invoke>
