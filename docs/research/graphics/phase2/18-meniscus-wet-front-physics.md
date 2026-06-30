# 18 — The Molten Wet-Front Lip, Meniscus & Glassy-Settle Fake

_Phase 2 deep-dive · GAELWORX forge world · cluster **D-type-knot-reveal** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js), no runtime EXR._

> **The problem this doc solves.** Phase-1 docs `13-per-letter-progressive-fill.md` and
> `14-liquid-fill-letterform.md` establish *that* a glyph fills left-to-right off a moving
> `uFillFront`, and Phase-2 `05-surface-tension-crust-modeling.md` handles the *bulk* surface skin once
> metal has settled. Neither owns the **half-millimetre of screen where liquid meets dry stone** — the
> advancing **wet front**. In the hero close-up reveal (`/software` casting-room and the `/about` altar
> approach), that advancing lip is the single most-scrutinised pixel band in the whole world: it is
> where the eye decides "is this real molten metal, or a glowing gradient sliding across a letter?"
> This doc shapes that edge: the **surface-tension curl** where liquid climbs and clings to the glyph
> wall, the **bulging meniscus highlight** with its normal perturbation, the **bubble lifecycle** that
> rides the front and pops, the **cooled glassy clearcoat transition** that trails behind the lip as
> metal settles and vitrifies, and the **tiny sparks shed from the lip** into the shared ember system.
> It is held to the `00-COHESION-MAP` contract: one temperature signal (`uTemp`/`gw_forge`), one noise
> basis (`gw_*`), one palette (`PAL`), one cooling clock (`gwCool01`, `age`), the A/E divine-fire
> keystone, and the iPhone-15 fill-rate budget. Nothing here is a new substance — it is the *same
> metal*, observed at the instant of arrival.

---

## 1. SCOPE

The **wet front** is the moving boundary between three states that all coexist within a ~30px band on a
hero close-up:

1. **Dry, dark basalt/iron** ahead of the front (un-filled glyph interior, temperature ≈ 0).
2. **The lip itself** — a 2–6px ribbon of *white-hot, bulging, surface-tension-curled* liquid that is
   the leading edge of the pour. This is where the metal is hottest (freshest), highest (the meniscus
   bulge), and most active (bubbles nucleate and shed sparks here).
3. **The settling tail** behind the lip — metal that arrived seconds ago, now skinning (Phase-2 `05`),
   cooling along its `age` clock (`03`), and developing the **glassy clearcoat** of vitrified slag.

This is a **D-cluster (type / knot / reveal)** topic because the wet front is the *narrative verb* of
the entire GAELWORX sequence: the metal **arrives**, the letter **becomes**. Phase-1 `13` and `14` give
us the *fill control* (a per-glyph `fillProgress` and a layout-U axis); `05` gives us the *bulk skin*.
This doc is the **leading-edge detail layer** that lives in the thin transition band between "not yet
filled" and "filled and skinning" — the place none of the prior docs resolve at close distance.

Four readable behaviours distinguish a real advancing molten lip from a sliding gradient, and each maps
to one section of the implementation:

- **Surface-tension curl & wall-climb (§4.1).** Liquid metal does not have a straight edge. Held by
  surface tension, the front *curls* — it lags in the open and *climbs* (wets up) where it meets a glyph
  wall, forming a concave fillet against vertical strokes. The front's shape is a noisy, capillary-warped
  contour, never a clean `step`.
- **The meniscus bulge (§4.2).** The leading ~4px is *raised* — a rounded bead of liquid pulled up by
  tension. Optically this is a **bright specular highlight** sitting on a **perturbed normal** (the bead's
  curvature), the single brightest non-A/E pixel in frame, and the thing that sells "wet."
- **The bubble lifecycle (§4.3).** Gas bubbles nucleate just behind the lip (hottest, most fluid metal),
  rise, dome the skin, thin, and **pop** — shedding a spark and leaving a momentary dark crater that
  re-melts. They ride the front because that is where the metal is liquid enough to outgas.
- **The glassy-settle clearcoat (§4.4).** As the tail cools past a threshold, the matte molten surface
  **vitrifies** — a thin glassy slag skin forms with a sharp specular clearcoat lobe (wet-look gloss)
  that then *fades to matte* as oxide rind takes over. This is the "cooled glassy clearcoat transition":
  a brief, travelling band of high-gloss that trails the lip by a fixed cooling-time offset.

The keystone exception stands and is **load-bearing here**: the **A and E never have a normal wet front
that cools**. Their fill front is still animated (the divine fire *floods in*), but `uIsAE` clamps the
lip, meniscus, bubbles, and clearcoat-fade to the eternal `gw_divineFire` path — the A/E lip is
white-gold, never skins, never vitrifies, and its shed sparks are gold not ember. The reveal of the A/E
*is* the moment their lip refuses to cool while every neighbour's does.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every approach is rated **quality / perf / mobile / complexity** against the hard constraint: one WebGL2
renderer, `onBeforeCompile` GLSL chunk-injection, iPhone-15 fill-rate budget, no EXR, the surface is a
near-flat glyph patch (an SDF/MSDF quad per `13` option A), and every term must share the existing
`gw_*` field and `U` uniform pool.

### 2.A Analytic moving-threshold front (the Phase-1 baseline — what we extend)

The fill is `reveal = layoutU; filled = step(reveal, uFillFront)` (Codrops *Responsive WebGL Text*,
Jun 2025, uses exactly this `1.0 - vUv.y > uProgress → discard` grammar). The front is the iso-line
`layoutU == uFillFront`. To shape the lip you don't `step`, you take the **signed distance to the front**
in layout-U space, `d = uFillFront - layoutU`, and band it: everything is a `smoothstep`/`fwidth` mask of
`d`. The Codrops *GSAP ripples/reveals* piece (Oct 2025) and the *Real-Time Dithering* piece (Jun 2025)
are the modern grammar for animating a `progress`/threshold uniform with `smoothstep` edges and
`fwidth`-based resolution-independent AA.

- Quality: **medium** alone (a clean band — reads as a wipe, not a liquid). Perf: **excellent**.
  Mobile: **excellent**. Complexity: **low**.
  → **The substrate.** `d` (signed distance to front, in layout-U) is the master coordinate every other
  term in this doc is a function of. It is *free* because `13` already computes `layoutU` and
  `uFillFront`. We do not replace it; we **warp it and decorate it**.

### 2.B Capillary front warp — noisy contour + wall-climb (the surface-tension curl)

A straight iso-line is the giveaway. Warp `d` by the shared noise so the front becomes a ragged,
capillary-curled contour: `d += gw_fbm(p*Kfront + uTime*flow) * amp`. Two refinements make it read as
*tension* rather than *erosion*: (1) modulate `amp` by **flow speed** so the front is raggeder where it
moves fast and crisper where it pools (a tension read); (2) add a **wall-climb** term — sample the glyph
SDF (`13`/`14` give us the MSDF distance) and pull the front *forward* near walls (`d += wallClimb *
smoothstep(wallNear, 0.0, sdfWall)`), faking capillary wetting up vertical strokes. The 2026
Damian Van Der Merwe *Painting with Math: Lava Lamp* piece (Apr 2026) is the canonical modern reference
for shaping organic liquid boundaries from layered noise + `smoothstep` banding + metaball-style fields,
and for click-spawned heat pools that locally re-melt — directly applicable to the front's local
re-flooding behaviour.

- Quality: **high** (the curl is what kills the wipe read). Perf: **cheap** (one `gw_fbm` already in
  budget + one SDF sample we already have). Mobile: **green**. Complexity: **low–medium**.
  → **Ship on all tiers** (the front warp is the cheapest, highest-impact upgrade); wall-climb on
  `high`/`low`, dropped on `static`.

### 2.C Meniscus bulge via height-field + analytic normal perturbation

The lip is *raised*. Build a thin **height bump** as a function of `d`: a `cubicPulse`/`pcurve` ridge
peaking just behind the front (IQ remap functions, the 2025-resurfaced canonical catalog). Convert the
height to a **normal perturbation** analytically — `dHdx = dFdx(height)`, `dHdy = dFdy(height)` (or the
gradient of the front-distance field) — and perturb the fragment normal *before lighting*, so the bead
catches a real specular highlight off the procedural env (`22`) and the A/E light (`19`). This is the
"bulging meniscus highlight + normal perturbation." The 2025 Maxime Heckel *Field Guide to TSL and
WebGPU* (Oct 2025) and his *Refraction/dispersion light effects* posts establish the Fresnel-power +
specular-lobe grammar we key the bead's highlight to (high Fresnel power = a *focused*, tight wet
highlight; the bead reads glossier the sharper the power).

- Quality: **highest** (the bead is the "wet" tell). Perf: **cheap** (two screen-space derivatives, no
  extra texture). Mobile: **green** on `high`/`low`; on `static` use a flat emissive rim (no normal
  perturb) since `static` is frozen. Complexity: **medium** (tuning bead height vs highlight without
  it reading as a plastic seam).
  → **Ship the full bead on `high`/`low`; flat emissive rim on `static`.**

### 2.D Bubble lifecycle — Worley-nucleated, age-phased domes that pop

Bubbles nucleate at discrete points (gas pockets), not uniformly — the same argument that makes crust
**Worley/cellular** in `05`. Reuse that **F1/F2** field: each Worley cell behind the lip is a potential
bubble site; a per-cell pseudo-random phase (`hash(cellId)`) drives a lifecycle `phase01 = fract(uTime *
rate + hash)` mapping to *nucleate → dome (skin lifts, normal bulges) → thin (rim brightens) → pop (dark
crater + spark shed) → heal*. The 2025 Three.js Roadmap *10 Noise Functions for TSL Shaders* (Dec 2025)
ships Worley with TSL+GLSL parity and the 3×3 neighbour search, explicitly for "cells, cracks, organic
structures," and the 2025 Sangil Lee *Understanding the Variations of Cellular Noise* (Apr 2025)
catalogs F1 / F2 / F2−F1 and the distance metrics (Euclidean = round bubbles; Chebyshev = angular). We
gate bubbles to the **liquid band only** (`d` within the hot zone *and* `T` above a fluidity threshold)
so they live on the front and die in the tail.

- Quality: **high** (motion + life on the front). Perf: **the most expensive primitive here** (3×3
  Worley = 9 hash+dist evals). Mobile: **high-tier only** (per `00-COHESION-MAP §2`). Complexity:
  **medium**.
  → **`high` only.** On `low`/`static` the bubble layer is a cheap fBm-thresholded boil that *brightens
  and dims* in place (no discrete pop, no spark), reusing the molten boil field already present.

### 2.E Cooled glassy clearcoat transition — travelling gloss band

As the tail crosses a cooling threshold, the surface vitrifies: a thin glassy slag skin with a **sharp
specular clearcoat lobe**. `MeshPhysicalMaterial.clearcoat`/`clearcoatRoughness` (three.js r17x docs)
exist for exactly "wet surfaces / a clear reflective layer," but a *uniform* clearcoat across the glyph
is wrong — we want a **travelling band** of gloss that trails the lip. Two viable routes: (i) drive a
**per-fragment clearcoat** by writing the clearcoat factor from `age`/`T` inside `onBeforeCompile`
(inject into the `clearcoat_fragment` chunk — gloss only where `T` sits in the vitrify window); (ii) fake
it entirely in emissive/specular with a Fresnel lobe gated by the same window (cheaper, no real second
BRDF lobe). The 2025 Codrops *Stylized Water* article (Mar 2025) is the modern grammar for a
store-driven surface with `smoothstep`-banded wet/foam edges and Fresnel rim — the same store-coupled,
sim-free approach we use for the gloss window.

- Quality: **high** (the "it just turned glassy" beat). Perf: real clearcoat = one extra BRDF lobe
  (modest); faked Fresnel = free. Mobile: **faked Fresnel on `low`/`static`; real per-fragment clearcoat
  on `high`**. Complexity: **medium** (the chunk injection into `clearcoat_fragment`).
  → **Hybrid:** real per-fragment clearcoat on `high`, Fresnel-fake on `low`/`static`.

### 2.F Lip sparks into the shared ember system

The front sheds metal. Rather than a *new* particle system (forbidden — one `Points`), the lip **seeds
the existing GPGPU pour-front orbiters** (`15` / Phase-2 `09 curl-advected-spark-smoke`): the spawn
position is sampled along the current front contour (we already have `uPourFront` world pos + the
front's screen band), spawn rate spikes on bubble-pops and high front-shear, and the seeded `sparkTemp`
starts white-hot and decays via `gw_forge`. The 2026 Damian Van Der Merwe lava piece's click-spawned
heat-pool grammar and `09`'s curl advection are the basis. **No new draw call** — we write spawn data
into the shared emitter's input.

- Quality: **high** (the lip "spits"). Perf: **free at the front** (reuses `15`/`09` budget). Mobile:
  **`high` GPGPU / `low` CPU points / `static` none**. Complexity: **low** (it's a spawn-source hook).
  → **Hook into the existing ember emitter**, gated by tier exactly as `15`/`09` already are.

### 2.G (Rejected) Real 2-phase fluid / level-set front

A true level-set or PIC/FLIP front with surface tension (the arxiv two-phase benchmark grammar) gives a
physically-curling lip but needs ping-pong velocity/pressure/level-set FBOs per frame — multiple
full-screen passes, the #1 fill-rate killer on the iPhone, and overkill for a front that is *authored*
to follow a known left-to-right `uFillFront`. **Rejected for the hero.** A single-FBO heat-pool
re-flood (lava-lamp grammar) is a named candidate (§9) only if the analytic curl ever reads too regular.

**Verdict.** The wet front is **2.A (signed-distance substrate) + 2.B (capillary warp) + 2.C (meniscus
bead) on every tier**, **2.D (Worley bubbles) + 2.E (real clearcoat) on `high`**, **2.F (lip sparks)
hooked into the shared emitter at each tier's particle budget**. No fluid sim. Every term is a function
of `d` (distance to front), `T` (master temperature), `age` (cooling clock), and the shared `gw_*`
noise — so the lip is provably the *same metal* as the slab veins and the cooling letters.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build the wet front as a thin decoration layer on the SDF/MSDF glyph fragment, driven entirely by one
master coordinate `d = uFillFront - layoutU` and the shared `U` pool.** Concretely, the front fragment
is computed in four nested bands, all functions of the *warped* signed distance `dw`:

```
dw  = d + gw_fbm(p)*amp + wallClimb           // 2.B  capillary-warped front distance
lip      = cubicPulse(0.0, lipW,  dw)          // 2.C  the hot ribbon (emissive boost)
bead     = pcurve(dw/beadW)                    // 2.C  meniscus height → normal perturb
tail     = smoothstep(0.0, tailW, dw)          // settled metal (1.0 behind the lip)
glossWin = window(T, vitLo, vitHi)             // 2.E  travelling clearcoat band
bubbles  = worleyLifecycle(p, dw)              // 2.D  high-tier only
```

Justification against the cohesion contract:

1. **One temperature, one cooling clock.** The lip's white-hot is `gw_forge(1.0)` (freshest metal); the
   tail cools via the *exact* `gwCool01(age)` curve the letters and veins use; the gloss window is a
   slice of that same `T`. A cooling lip and a cooling vein are visibly one metal because they sample
   one curve. **No private orange.**
2. **One noise basis.** The capillary curl, the bubble nucleation, and the spark spawn jitter are all
   `gw_fbm` / `gw_worley` / `gw_curl3` at front-appropriate scales — the *same grain* as the molten
   boil. "More detail on the front" = one more `gw_fbm` octave, never a second noise.
3. **The A/E keystone is structural, not bolted on.** `uIsAE` routes the entire front through the
   divine path: `lipColor = mix(gw_forge(1.0), gw_divineFire(flick), uIsAE)`, and `glossWin`,
   `bubbles`, the cooling, and the ember spark-tint are all `*= (1.0 - uIsAE)`. The A/E lip floods,
   glows white-gold, and **never settles** — the reveal beat.
4. **Mobile-first, no sim.** Everything is analytic from `d`, `T`, `age` — zero ping-pong, zero extra
   RT. The expensive term (Worley bubbles) is the one gated to `high`. It fits the existing glyph draw
   call; it adds **zero new passes and zero new draw calls**.
5. **It plugs the gap the prior docs leave.** `13`/`14` own *fill control*; `05` owns *bulk skin*; this
   owns the *leading edge*. The handoff is clean: `tail` (this doc) fades into `05`'s skin coverage at
   the same `age` threshold, so there is no seam between "the lip" and "the settled surface."

---

## 4. IMPLEMENTATION

**Libs/versions (matching the rest of the build):** `three@^0.17x` (r170+, `onBeforeCompile`
chunk-injection, WebGL2), `@react-three/fiber@^9`, `@react-three/drei@^10`,
`@react-three/postprocessing@^3` (front owns *no* post — it feeds bloom via HDR emissive). Text per `13`
option A/B: `troika-three-text` + `three-instanced-uniforms-mesh` for per-glyph `uIsAE`, `fillStart`,
`tempSeed`, or the MSDF atlas from Phase-2 `16-cinzel-msdf-atlas-pipeline.md`. The front shader is
injected into the **same glyph material** — it is not a separate mesh.

### 4.1 Shared GLSL added to `src/scene/shaders.js`

These live beside `gw_tempColor`/`gw_forge`/`gwCool01`/`gw_divineFire` and are inlined into the glyph
material via the existing chunk-injection. They depend **only** on functions already in the toolkit.

```glsl
// ---- front-shaping remaps (free, all tiers) — IQ remap catalog ----
float gw_cubicPulse(float c, float w, float x){           // flat-zero outside, smooth bump inside
  x = abs(x - c); if (x > w) return 0.0; x /= w; return 1.0 - x*x*(3.0 - 2.0*x);
}
float gw_pcurve(float x, float a, float b){               // tensioned plateau / bead shaper
  float k = pow(a+b, a+b) / (pow(a,a) * pow(b,b));
  return k * pow(clamp(x,0.0,1.0), a) * pow(1.0 - clamp(x,0.0,1.0), b);
}

// ---- the wet-front authority. One coord (d) → all bands. ----
// d      : signed distance to fill front in layout-U space (uFillFront - layoutU); >0 = filled
// p      : world/uv sample point (shared with the molten boil)
// sdfWall: glyph SDF distance to nearest stroke wall (from MSDF; 0 at wall)
// U.uTime, U.uTemp, U.uHeat bound from the shared pool
struct GWFront { float lip; float beadH; float tail; float glossWin; float shear; };

GWFront gw_wetFront(float d, vec3 p, float sdfWall, float ageLocal){
  // 2.B capillary curl: warp the front by shared noise, raggeder where it moves fast
  float flow   = U.uTime * 0.6;
  float curl   = gw_fbm(p * 9.0 + flow) - 0.5;                 // same gw_fbm as the boil
  float amp    = mix(0.010, 0.045, U.uHeat);                   // hotter/faster front = raggeder
  // capillary wall-climb: pull the front forward near vertical strokes
  float climb  = 0.05 * smoothstep(0.08, 0.0, sdfWall);
  float dw     = d + curl * amp + climb;

  GWFront f;
  f.lip      = gw_cubicPulse(0.0, 0.018, dw);                  // 2px hot ribbon at the boundary
  f.beadH    = gw_pcurve(clamp(dw/0.05 + 0.0, 0.0, 1.0), 2.0, 3.0); // raised bead just behind lip
  f.tail     = smoothstep(0.0, 0.06, dw);                      // 1.0 = fully settled metal
  // 2.E travelling gloss window: vitrify band in temperature, trailing the lip by a cool-offset
  float Ttail = 1.0 - gwCool01(ageLocal, U.uCoolRate);         // current temp of this fragment
  f.glossWin = smoothstep(0.62, 0.70, Ttail) * (1.0 - smoothstep(0.70, 0.80, Ttail));
  f.shear    = length(vec2(dFdx(dw), dFdy(dw)));               // front shear → spark/tear rate
  return f;
}
```

### 4.2 Injection into the glyph fragment (`onBeforeCompile`)

```glsl
// --- after the molten/cooling block, before <tonemapping_fragment> ---
GWFront F = gw_wetFront(vFrontDist, vWorldP, vSdfWall, vAge);

// (a) base metal color from the ONE temperature authority
float Tcool   = gwCool01(vAge, uCoolRate);          // 0 hot .. 1 iron
vec3  metalHot= gw_forge(1.0 - Tcool);              // shared ramp+intensity
vec3  divine  = gw_divineFire(uFlick);              // eternal white-gold
vec3  metal   = mix(metalHot, divine, uIsAE);       // KEYSTONE: A/E never reach uTemp

// (b) the hot lip ribbon — pushed HDR so it (and only it) blooms (palette = bloom selector)
vec3  lipCol  = mix(gw_forge(1.0), divine, uIsAE);  // freshest metal at the front
metal += lipCol * F.lip * 2.2;                      // >1 → blooms; A/E lip is gold

// (c) meniscus bead → perturb the normal BEFORE lighting (the "wet" specular)
float bH = F.beadH * 0.04;
vec3  bn = normalize(vec3(-dFdx(bH), -dFdy(bH), 1.0));
normal   = normalize(normal + bn * (1.0 - uIsAE) * uBeadStrength);   // bead, never on A/E

// (d) glassy-settle clearcoat — real per-fragment on high (inject into clearcoat_fragment),
//     Fresnel-fake elsewhere. The window travels with the cooling tail.
#ifdef GW_HIGH
  material.clearcoat          = F.glossWin * 0.9 * (1.0 - uIsAE);
  material.clearcoatRoughness = mix(0.06, 0.25, Tcool);
#else
  float fres = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);       // tight wet lobe (high power)
  totalEmissiveRadiance += vec3(1.0) * fres * F.glossWin * 0.20 * (1.0 - uIsAE);
#endif

// (e) bubbles (high only): Worley lifecycle behind the lip, in the liquid band
#ifdef GW_HIGH
  if (F.tail > 0.2 && Tcool < 0.45) {               // liquid enough to outgas
    vec2 wc = gw_worley(vWorldP.xy * uBubbleScale);  // x=F1, y=F2 (reuse 05's worley)
    float cellId = wc.y;                             // stable-ish per-cell seed
    float phase  = fract(U.uTime * 0.7 + hash11(cellId*97.0));
    float dome   = gw_cubicPulse(0.5, 0.5, phase);   // rise..thin..pop over the cycle
    float pop    = step(0.92, phase);                // last 8% = burst
    metal       += lipCol * dome * 1.4 * (1.0 - uIsAE);            // bubble glows through
    metal       *= (1.0 - pop * 0.6 * (1.0 - uIsAE));             // dark crater on pop
    uSparkSeed   = max(uSparkSeed, pop * (1.0 - uIsAE));          // → feeds ember emitter
  }
#endif

// (f) lip sparks: write spawn intensity for the SHARED emitter (no new Points)
//     consumed by the GPGPU pour-front orbiters (15 / phase2-09)
//     spawnRate ∝ F.lip presence * (front shear + bubble pops)
```

### 4.3 The r3f component shape

The front owns **no new mesh** — it is a behaviour of the wordmark material. Two small JS pieces:

```jsx
// inside <WordmarkFill/> (the 13/14 mesh). The material is the glyph material; we only
// thread the front uniforms + the per-glyph uIsAE/age and bind the shared pool U.
function useWetFrontMaterial(glyphMat) {
  useLayoutEffect(() => {
    glyphMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U);                 // SHARED pool (cohesion: same refs)
      shader.uniforms.uBeadStrength = { value: 1.0 };
      shader.uniforms.uBubbleScale  = { value: 22.0 };
      shader.uniforms.uCoolRate     = U.uCoolRate;       // same cooling clock as letters/veins
      injectChunks(shader);                              // the §4.2 GLSL
    };
    glyphMat.customProgramCacheKey = () => `gwfront-${TIER}`; // GW_HIGH define per tier
  }, [glyphMat]);
}

// The front position is NOT a new clock — it reads the shared journey timeline:
// uFillFront is driven once by <ForgeDriver/> from forge.scrollDamped (the one writer),
// and the SAME uPourFront world pos feeds DOF focus (28) and the ember spawn (15/09).
```

### 4.4 Key uniforms / params (and the shared system they hook)

| Uniform / param | Meaning | Bound to / driven by |
|---|---|---|
| `uFillFront` | front position in layout-U (0..1 per glyph) | **shared** `U`, `<ForgeDriver/>` ← `scrollDamped` |
| `vFrontDist` (`d`) | signed distance to front (per-fragment) | `uFillFront - layoutU` (from `13`) |
| `uTemp` / `uHeat` | master temperature / transient pulse | **shared** `U` (front raggedness, lip HDR) |
| `uCoolRate` | cooling-clock rate | **shared** `U` (same as letters/veins) |
| `vAge` | seconds since this point received metal | analytic from `uFillFront` (no GPGPU) |
| `uIsAE` | per-glyph divine-fire flag | baked build-time data (`13`/`24`/CLAUDE.md rule) |
| `uBeadStrength` | meniscus normal-perturb gain | look-dev knob (off on `static`) |
| `uBubbleScale` | Worley bubble density | `high` only |
| `uSparkSeed` | lip spark spawn intensity | → **shared** ember emitter (`15`/`09`) |
| `uPourFront` (vec3) | front world pos | **shared** `U` → DOF focus, env intensity, sparks |

The cohesion mechanism is literal: the front **mutates nothing of its own** — it reads `U`, writes
`uSparkSeed` into the shared emitter, and feeds `uPourFront` into DOF and bloom. Move the master `uTemp`
and the lip, the bead highlight, the bubble fluidity, and the gloss window all shift on the same frame
as the slab veins.

---

## 5. COHESION

The wet front is bound to every shared system in the `00-COHESION-MAP`:

- **Temperature (§1).** Lip = `gw_forge(1.0)`; tail color = `gw_forge(1.0 - gwCool01(age))`; gloss
  window = a slice of that same `T`. The A/E lip = `gw_divineFire`, never `uTemp`. **One ramp.**
- **Noise (§2).** Capillary curl = `gw_fbm`; bubbles = `gw_worley` (the *same* cells `05` uses for crust
  nucleation); spark jitter = `gw_curl3`. Same `GW_FBM_OCTAVES`. The front's grain *is* the metal's
  grain. The animation **boils** (time as warp offset), it does not **scroll** the front texture.
- **Palette (§3).** All color from `PAL` via `v3()`. Only the lip ribbon, the bead highlight, the
  bubble-glow, and the divine A/E exceed 1.0 — so they are the *only* part of the front that blooms,
  the only part the heat-haze/god-ray luminance mask catches, and the only light the front casts. The
  60/30/10 holds: the front is the **10% accent** painted onto the 60% void glyph interior.
- **Lighting (§5).** The bead's perturbed normal catches the cool procedural env key (`22`) and the A/E
  `uAEFire` spill (`19`); the front itself is emissive-as-light. No fill light. The A/E lip *is* the
  light that begins to reveal the Ogham as the divine fire arrives.
- **Cooling handoff.** `tail` fades into `05`'s `skinCoverage` at the same `age` threshold; the gloss
  window sits *between* "molten" and "skinned," so the journey molten→glassy→matte-rind→basalt-dark is
  one continuous `T`/`age` march. No seam.
- **Clock (§6).** `uFillFront` and `uPourFront` come from the one `<ForgeDriver/>` writer, `dt`-damped.
  A strike (`forge.strikeAt`) surges `uHeat` → the front gets raggeder, the lip brighter, bubbles
  faster, sparks heavier — **in the same frame** as the slab and jewel. That synchrony is the proof.
- **Channel → letter handoff (§7.8).** The same hand-authored interlace arc-length curve that positions
  the channel pour positions `uPourFront`; the wet front is that pour *arriving* at the glyph. One knot,
  consumed by channel + pour + this lip.

---

## 6. MOBILE & PERFORMANCE

The judge device is an iPhone 15 (A16/A17, OLED), DPR-capped **1.5**, ~9–10 ms steady-state budget on
`high`. The front is **fill-rate**, not geometry — it runs on the existing glyph quad's fragments, only
where `vFrontDist` is within the band (the rest early-outs via the cheap `tail`/`lip` masks).

**Cost (high-tier, hero close-up where the front fills a chunk of frame):**

| Term | Cost | How it's held |
|---|---|---|
| `d` substrate + capillary warp (2.A/2.B) | ~0.2–0.3 ms | one `gw_fbm` (already in budget) + 1 SDF sample |
| Meniscus bead + normal perturb (2.C) | ~0.1 ms | 2 screen-space derivatives, no texture |
| Gloss clearcoat (2.E) | ~0.2–0.4 ms | one extra BRDF lobe on `high`; **free Fresnel** elsewhere |
| Worley bubbles (2.D) | ~0.5–0.8 ms | **`high` only**; 3×3 cell search, gated to the liquid band |
| Lip sparks (2.F) | **~0 ms** | reuses `15`/`09` emitter; just writes spawn data |

**Tier ladder (one `TIERS` table, uniform degradation per `§7` rule 9):**

- **`high`** — full: capillary warp + bead + real per-fragment clearcoat + Worley bubble lifecycle +
  GPGPU lip sparks. `GW_HIGH` define on.
- **`low`** — capillary warp + bead (cheaper amp) + **Fresnel-fake gloss** + **fBm-boil bubbles** (no
  discrete pop/crater, just a brighten/dim in place) + CPU-point lip sparks. No Worley, no real
  clearcoat. `GW_FBM_OCTAVES` 3.
- **`static`** (reduced-motion / weak GPU) — frozen front (`uTime` = 2): a single still lip with a flat
  **emissive rim** (no normal perturb, no bead specular since there's no animation to sell it), no
  bubbles, no sparks, no travelling gloss (one baked-feel gloss band). The front reads as a dignified,
  fully-lit frozen pour, not a broken fallback.

**The levers (priority order per `§10`):** DPR cap 1.5 first; the bubble Worley is the single
`high`-only term to drop under thermal throttle (demote `high`→`low` kills it via the `#ifdef`); the
bead and capillary warp are cheap enough to keep on `low`. The front adds **no new pass, no new draw
call, no new RT** — it is fragments on an existing quad, which is why it fits.

**INP / first-paint:** the front's `customProgramCacheKey` is tier-stamped so the variant compiles once
under `renderer.compileAsync` before first scroll; no `new` in the per-frame loop (the front reads
`U`, never allocates). The bead's `dFdx`/`dFdy` are the only derivative cost and are standard on WebGL2.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this exact effect):**

1. **The wipe read.** If you `step` the front or band a *clean* `d`, it slides like a loading bar. The
   capillary `gw_fbm` warp (2.B) is **not optional** — it is the cheapest term and the one that converts
   "wipe" into "liquid." Ship it first, before the bead or bubbles.
2. **Authoring for the raw value, not the tone-mapped output.** The lip HDR boost (`*2.2`) and the bead
   specular must be tuned **through AgX/ACES on the device** (`21`). A lip that looks perfect on the raw
   buffer blooms to a flat white blob after the tone-map. Tune on the iPhone, not in the headless QA.
3. **The bead reading as a plastic seam.** Over-driving `uBeadStrength` makes a hard ridge that looks
   like a bevel, not a meniscus. The bead must be *narrow* (peaks just behind the lip) and its highlight
   must come from the **env reflection** (Fresnel), not a baked-in white line. Keep `beadW` ≲ the lip
   width and let lighting do the work.
4. **Bubbles flickering instead of living.** A pure `step`/`fract` per cell pops every bubble on the
   same frame (banding). Use the per-cell `hash` phase offset so the field is *desynchronised*, and
   confine bubbles to the liquid band (`Tcool < 0.45`) so they **die as the tail cools** — bubbles in
   cooled metal is the tell of a fake.
5. **The clearcoat covering the whole glyph.** Clearcoat must be the **travelling window** keyed to `T`,
   not a global material flag. A glyph that is uniformly glossy reads as wet plastic, not cooling metal.
   The gloss must trail the lip and **fade** as the rind takes over (`05`).
6. **The A/E leaking into the cooling path.** The single most important bug to prevent: every front
   term (`lip` color, `bead`, `bubbles`, `glossWin`, spark tint, cooling) must be `mix(..., uIsAE)` or
   `* (1.0 - uIsAE)`. Stamp `uIsAE` early (build-time data) and verify the A/E lip stays white-gold and
   *never settles* while neighbours cool — catch this before skin/bubbles hide it.
7. **Forking the spark system.** The lip must **not** spawn its own `Points` — it writes `uSparkSeed`
   into the shared `15`/`09` emitter. A second particle system breaks the one-`Points` rule and the
   shared `gw_forge` spark tint.
8. **Front shear from the wrong field.** `F.shear = length(grad(dw))` must use the *warped* `dw`, so the
   tear/spark rate spikes exactly where the capillary curl is steepest — otherwise sparks shed
   uniformly and the lip doesn't "spit" where it's working hardest.

**Order of operations (each step de-risks the next):**

1. **The signed-distance substrate** — `d = uFillFront - layoutU`, bind the shared `U`, get a clean
   banded front filling left-to-right off the one writer. Verify `/software` is byte-identical to `13`'s
   fill before decorating.
2. **The capillary warp** — add `gw_fbm` curl + wall-climb. This is the make-or-break "liquid not wipe"
   moment; tune `amp` vs `uHeat` on the device. Verify the front is raggeder during a strike.
3. **The meniscus bead** — height ridge + analytic normal perturb + env-reflected highlight. Tune
   narrow; verify the bead catches the cool env key and reads "wet," not "beveled."
4. **The A/E clamp** — stamp `uIsAE`, route the entire front through the divine path. Verify A/E lip is
   white-gold and refuses to settle while neighbours cool. **Do this before bubbles/clearcoat** so
   masking bugs surface early.
5. **The glassy-settle clearcoat** — the travelling gloss window keyed to `T`; real per-fragment on
   `high`, Fresnel-fake on `low`. Verify it trails the lip and fades into `05`'s rind.
6. **The bubble lifecycle** (`high`) — Worley reuse from `05`, per-cell phase, pop→crater→spark.
   Verify bubbles live on the front and die in the tail.
7. **The lip sparks** — hook `uSparkSeed` into the `15`/`09` emitter; verify spawn spikes on pops and
   shear, sparks inherit `gw_forge` tint, A/E sparks are gold.
8. **Tier-gate + QA** — `GW_HIGH` define, `low`/`static` fallbacks, `customProgramCacheKey`,
   `compileAsync`. Verify on the iPhone 15 OLED (bloom spread of the lip, true-black ahead of the front,
   the white-gold A/E reveal) — these do **not** simulate in headless QA.

---

## 8. SOURCES (2025–2026)

1. **Three.js Roadmap — *10 Noise Functions for Three.js TSL Shaders*** (Dec 2025). Worley/cellular with
   TSL+GLSL parity, 3×3 neighbour search, F1/F2, domain warp, curl — the bubble-nucleation and
   front-warp primitives. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
2. **Sangil Lee — *Understanding the Variations of Cellular Noise*** (Apr 18, 2025). F1 / F2 / F2−F1 and
   Euclidean vs Manhattan/Chebyshev distance metrics — round vs angular bubbles/cells.
   https://sangillee.com/2025-04-18-cellular-noises/
3. **Codrops — *Creating Stylized Water Effects with React Three Fiber*** (Mar 4, 2025). Store-driven
   surface params, `smoothstep`-banded wet/foam edges, Fresnel rim — the gloss-window and edge grammar.
   https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/
4. **Codrops — *How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects***
   (Oct 8, 2025). Animating a `progress`/threshold uniform with `smoothstep` soft edges — the moving
   front. https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
5. **Codrops — *Building a Real-Time Dithering Shader*** (Jun 4, 2025). `smoothstep` banding + OLED
   dither grammar relevant to the front's dark-ahead-of-lip gradient on a true-black panel.
   https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/
6. **Maxime Heckel — *Field Guide to TSL and WebGPU*** (Oct 2025). Glass/clearcoat material, Fresnel
   power (focused vs scattered highlight), specular lobe — the meniscus bead highlight + clearcoat
   grammar. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. **Maxime Heckel — *Refraction, dispersion, and other shader light effects*** (cited via the 2025
   Field Guide; Fresnel-power tuning for tight wet highlights).
   https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
8. **Damian Van Der Merwe — *Painting with Math: Building an Interactive Lava Lamp Shader from Scratch***
   (Apr 3, 2026). Layered-noise organic liquid boundaries, `smoothstep` banding, metaball fields,
   click-spawned heat pools that locally re-melt — the front warp + re-flood grammar.
   https://damianvandermerwe.com/blog/painting-with-math-lava-lamp-shader
9. **Codrops — *From Shader Uniforms to Clip-Path Wipes: How GSAP Drives My Portfolio*** (May 6, 2026).
   Shader-uniform-driven reveals as the modern reveal idiom for a scroll-driven front.
   https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/
10. **three.js MeshPhysicalMaterial docs (r17x)** — `clearcoat` / `clearcoatRoughness` for wet-surface
    reflective layers; the per-fragment `clearcoat_fragment` injection target.
    https://threejs.org/docs/pages/MeshPhysicalMaterial.html

---

## 9. DEEP-DIVE CANDIDATES

1. **Single-FBO heat-pool re-flood front** — if the analytic capillary curl ever reads too regular at
   the closest hero distance, a *one* ping-pong fill texture (lava-lamp grammar, source 8) gives the
   front true hysteretic memory (re-flood pools, persistent bubble craters) for `high` only. The
   analytic-vs-FBO A/B is the deliverable.
2. **The meniscus as real refraction, not just specular** — on `high`, refracting the basalt/Ogham seen
   *through* the raised bead (thin-lens UV offset off the bead normal, Maxime Heckel refraction grammar)
   so the lip magnifies the carved stone it's about to cover. A jewel-chamber-grade flex.
3. **Bubble→spark→smoke coupling** — wiring the bubble-pop `uSparkSeed` not just to the ember emitter
   but to the `17` smoke bank (each pop puffs a wisp), closing the lip→spark→smoke loop on one event.
4. **A/E divine-flood front choreography** — the *timing* of how the divine fire floods the A/E vs the
   normal pour fills neighbours: does it lead, lag, or surge? The narrative beat of the reveal, owned as
   a choreography sub-topic against the `27`/`28` camera journey.
