# 32 — Ember-Tinted Participating-Media Absorption as ONE Forge-Material Model

_Phase 2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · the single absorption-spectrum
constant that makes smoke, obsidian transmission, and the molten pour all eat the cool end and pass the warm
end of the spectrum — by the same math, not by eye · target: iPhone 15 OLED, one WebGL renderer (r3f + three.js r17x)_

> **The load-bearing claim of this doc.** Three separate elements in the world tint light as it passes through
> a medium: the **forge smoke** (`exp(-d·σ·vec3(1,1.6,2.4))`, `00-COHESION-MAP §5.4`, doc `17 §4`), the
> **obsidian/jewel transmission** (`MeshPhysicalMaterial.attenuationColor` / `attenuationDistance`, doc `07
> §2.2`), and the **molten pour's** sub-surface warmth (the depth-tint inside the meniscus, docs `01`/`18`).
> Today each one would be hand-tuned with its own magic numbers. This doc proves they are **the same physical
> operation** — Beer–Lambert extinction with a per-channel coefficient — and collapses all three onto **one
> exported constant, `GW_SIGMA_EMBER`**, plus one helper, `gw_absorb(d)`. The structural insight that makes
> this possible is that three.js's own transmission absorption (via the glTF `KHR_materials_volume` extension)
> is defined as `σt = -log(attenuationColor) / attenuationDistance` and `T(x) = exp(-σt·x) = c^(x/d)` — the
> *exact* Beer–Lambert form the smoke raymarch already uses. So `attenuationColor` and the smoke's `vec3(1,1.6,2.4)`
> are not two ideas; they are two encodings of one absorption spectrum. Derive both from one constant and the
> "warm light through medium" cohesion becomes **structural, not eyeballed.**

---

## 1. SCOPE (this element in the GAELWORX world)

GAELWORX is "pure-VOID darkness lit ONLY by the metal itself." Every photon the viewer sees is born hot
(`gw_forge`/`gw_divineFire`) and then **travels through something** before it reaches the eye: through the
**air** (forge smoke, void haze, heat-shimmer column over the hottest letters), through the **glass** (the
polished obsidian slab body, the faceted jewel-chamber gem, the scrying-pool water), or through the **thin
warm skin of the molten pour itself** (light entering the meniscus, bouncing once, and leaving — the read
that makes the metal look *liquid and deep* rather than a glowing decal). In all three cases the medium
**subtracts** energy from the beam, and — this is the whole point — it subtracts *unequally across the
spectrum*. A warm forge medium (soot, iron-rich glass, hot metal) absorbs blue and green far more strongly
than red. So whatever color the light started, **after passing through forge-medium it is warmer**: white-hot
behind smoke reads ember-orange; a cool reflection through the obsidian body picks up a Connemara-warm
under-tint; the pour's interior glows red where its surface glows white. This is the single most cohesive
"tell" a forge world can have — *the air, the stone, and the metal all carry the same warm bias because they
are all the same medium at different densities.* If smoke is grey, glass is neutral, and the pour is a flat
decal, the world fractures into three materials. If all three eat the same cool end of one spectrum, the world
reads as **one substance** — soot, obsidian, and molten iron are the same iron at three densities and three
temperatures.

This doc owns the **absorption half** of light-transport (how much of each channel survives distance `d`). It
is deliberately *separate* from emission (doc `01`, what color light is born), scattering/phase (doc `17`, how
light bends in smoke), and refraction/dispersion (doc `07`/jewel, how the ray bends at an interface). Those
are the other terms of the rendering equation; this is the `exp(-σ·d)` extinction term, formalized once and
shared. It binds directly to the master temperature system: `σ` itself is temperature-modulated, so a hotter
forge has *thinner, warmer-passing* media (heat thins soot, brightens glass) — one more thing that moves on the
single `uTemp` heartbeat.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are five honest ways to make a medium tint transmitted light, ordered by physical fidelity and cost.
Every one reduces, at its core, to Beer–Lambert; they differ in *where* the path length `d` comes from and
*how* the per-channel coefficient is encoded.

### 2.A Scalar density × tint color (the naïve baseline)
`outColor = mix(mediumColor, lightColor, exp(-density*d))`. A single scalar density and a hand-picked tint.
This is what most "fog tutorials" ship and what the depth-fog Tier-1 in doc `17` uses for the void haze. It is
free and it works for *flat* haze, but the tint is **eyeballed** — there is no guarantee the smoke's grey, the
glass's tint, and the pour's interior agree, because each picks its own `mediumColor`. **This is precisely the
non-cohesion this doc exists to kill.** Keep it only for the cheapest void-haze tier, and even there feed it
the shared constant.

### 2.B Per-channel Beer–Lambert: `exp(-d·σ)` with `σ` a `vec3` (the recommended core)
Promote the scalar to a **vec3 extinction coefficient**: `transmittance = exp(-d * sigma)` where
`sigma = vec3(σr, σg, σb)`. Because `σb > σg > σr`, blue dies first, red survives longest, and the medium is
*physically* warm-passing. This is the form already written into the cohesion map (`vec3(1.0,1.6,2.4)`) and the
smoke raymarch (doc `17 §4` Tier 3). It is the closed-form constant-density integral of the radiative-transfer
equation's extinction term; the 2025 analytic-fog write-up (matejlou) makes the point that for constant-density
volumes this integral is exact and needs no marching. The whole proposal of this doc is to make **this** form
the universal one and derive everyone else from it. Cost: one `exp()` of a vec3 — three `exp` ops, negligible.

### 2.C glTF `KHR_materials_volume` attenuation (what three.js *already does* for transmission)
three.js `MeshPhysicalMaterial` exposes `attenuationColor` (a `Color`) and `attenuationDistance` (a float). The
Khronos `KHR_materials_volume` spec defines the relationship **exactly**: `σt = -log(attenuationColor) /
attenuationDistance`, giving `T(x) = exp(-σt·x) = attenuationColor^(x/d)`. In words: `attenuationColor` is "the
color white light becomes after travelling `attenuationDistance` through the medium," and three computes the
per-channel coefficient internally as the negative log of that color over that distance. **This is the same
`vec3` Beer–Lambert as 2.B, just parameterized by an artist-facing color+distance instead of a raw coefficient.**
That equivalence is the bridge: if I pick `attenuationColor` to be `exp(-σ_ember * dRef)` for some reference
distance, the obsidian's built-in transmission absorption and the smoke's hand-rolled raymarch are **driven by
one spectrum**. The spec's documented edge case (a zero color channel makes `log(0)` undefined → NaN) is a
real trap, handled in §7. This is the cohesion linchpin: I do **not** re-implement glass absorption; I *feed*
three's existing one from the same constant.

### 2.D Spectral / Hero-wavelength upgrade (overkill, named for completeness)
Render absorption at N sampled wavelengths (e.g. 8–16 bins) and recombine to RGB at the end — the physically-
correct way to get hue-shifts through thick media (the OpenPBR 2025 implementation notes discuss
absorption-coefficient layering and spectral upsampling for exactly this fidelity). On a mobile WebGL2 forge
this is pure cost for a difference the OLED and the bloom will swallow. **Three channels is the right
resolution for this world** — the warm bias is a gross, intentional, art-directed shift, not a subtle
spectral gradient. Reject for ship; the three-channel `σ` *is* a 3-bin spectral model already.

### 2.E Dispersion-as-absorption confusion (a thing to NOT do)
The jewel-chamber wants chromatic **dispersion** (R/G/B refract at different angles — different *IOR* per
channel, the Cauchy `n(λ)` split the 2025 Codrops glass-torus and Pinterest-cube articles describe). That is a
*refraction* effect, not an *absorption* effect, and it must stay separate: dispersion splits where the ray
*goes*, absorption tints how much *survives*. They can and should coexist on the gem (split the ray three ways
by IOR, then attenuate each split by the same `σ_ember`), but conflating them — e.g. faking dispersion by
tinting RGB without bending the ray — produces the flat "chromatic-aberration sticker" look the references warn
against. This doc owns absorption; doc `07`/jewel owns the IOR split; they meet, they don't merge.

**Landscape verdict.** The universal core is **2.B** (`exp(-d·σ)` with a `vec3` σ). The cohesion *mechanism*
is **2.C** — the realization that three's transmission `attenuationColor` is the *same* Beer–Lambert and can be
fed from the same σ. **2.A** survives only as the cheapest tier, fed the shared constant. **2.D/2.E** are
explicitly out of scope. Novelty over Phase-1: Phase-1 doc `17` *used* `vec3(1,1.6,2.4)` for smoke in
isolation; this doc *promotes that vec3 to a world constant* and proves smoke, glass, and pour all derive from
it.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship one new exported constant + one helper in a tiny module `src/scene/absorption.js`, and route all three
media (smoke, glass-transmission, pour-interior) through it.** Concretely:

1. **One spectrum constant.** `GW_SIGMA_EMBER = vec3(σr, σg, σb)` with `σr : σg : σb ≈ 1.0 : 1.6 : 2.4` (the
   cohesion-map ratio), exported as a GLSL string for shaders *and* as a JS `THREE.Vector3`/derived `Color`
   for material props. This is the world's single absorption spectrum. Its *magnitude* (overall density) is a
   uniform; its *ratio* is the locked constant that makes everything warm-passing.

2. **One helper, `gw_absorb(d)`.** `vec3 gw_absorb(float d){ return exp(-d * uSigma); }` where `uSigma =
   GW_SIGMA_EMBER * uDensity`. Every shader that has a path length calls this. The smoke raymarch's
   `exp(-d*SIGMA*vec3(1,1.6,2.4))` *becomes* `gw_absorb(d)`. No element re-spells the ratio.

3. **Feed three's transmission from the same constant (no shader edit on glass).** For the obsidian body and
   the jewel, compute `attenuationColor` and `attenuationDistance` **in JS** from `GW_SIGMA_EMBER` so three's
   built-in absorption (2.C) produces the identical warm bias. The math is the inverse of σt: pick a reference
   `attenuationDistance d0` (the geometric scale of the object), then `attenuationColor = exp(-GW_SIGMA_EMBER *
   k * d0)` for a density scalar `k`. Now the glass eats blue exactly like the smoke does. **The slab is opaque
   (`transmission:0`, doc `07`)** so it uses the *cheap* in-shader `gw_absorb` on its inner-vein parallax depth
   instead; the **jewel** (genuinely transmissive) uses the real `attenuationColor`. Both spectra are the same
   bytes.

4. **Feed the pour interior from the same constant.** The molten meniscus depth-tint (light entering the wet
   front, travelling a short `d`, leaving warmer) is `gw_absorb(meniscusDepth)` applied to the emitted
   `gw_forge` color. This is why the pour reads white-on-top, red-in-the-belly: same σ, larger `d` deeper in.

5. **Modulate σ by temperature, not by element.** `uDensity` (the σ magnitude) rides `uTemp`/`uHeat`: a hotter
   forge thins the soot and brightens the glass (lower density) and the heat-shimmer pushes warmer. One
   `damp()` on one uniform moves the air, the glass, and the pour together — the cohesion heartbeat.

**Justification.** This is the only approach that satisfies every hard constraint *and* makes cohesion
mechanical: (a) it adds **zero dependencies** and ~10 lines of GLSL; (b) it costs **one `exp(vec3)`** per
medium sample (negligible, fits the budget); (c) it requires **no shader rewrite on the glass** — three's own
`attenuationColor` is fed from the constant, so the most expensive material is untouched; (d) it ports to TSL
1:1 (`exp(d.negate().mul(uSigma))`); (e) it is the literal embodiment of cohesion-rule #1 ("reads the master
temperature, never invents heat") extended to "reads the master *spectrum*, never invents a tint." The single
failure mode it guards against is three different greys/tints — the constant makes that impossible.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
**No new dependencies.** `three` (current r17x line — r178 (2025-07) and r179 keep the WebGL transmission /
`attenuationColor` path maintained), `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
(the existing smoke/fog Effects), `leva` for `?debug`. New code: **one file** `src/scene/absorption.js` (a GLSL
string + JS exports) and a few uniform wirings. Authored TSL-portable per `00-COHESION-MAP §10`.

### 4.2 `src/scene/palette.js` — the spectrum is a palette citizen
Brand law: no raw vec3 ratios floating in shaders. The ratio lives next to `PAL`:

```js
// append to palette.js — the world's single absorption spectrum (warm-passing forge medium).
// Ratio is the law (blue/green die first); magnitude is a runtime uniform.
sigmaEmber: new THREE.Vector3(1.0, 1.6, 2.4), // σr:σg:σb — Beer–Lambert per-channel extinction
```
The ratio `1.0 : 1.6 : 2.4` is the cohesion-map value and is sane: it places the medium's "passband" squarely
on the ember/Celtic-Blood hues. (Optional look-dev: a slightly steeper `1.0 : 1.7 : 2.8` reads as denser soot;
shallower `1.0 : 1.3 : 1.7` — note this is the Jelly-Renders iridescence ratio, doc `07 §2.5` — reads as thin
hot glass. Tune the *ratio* once on-device; never per element.)

### 4.3 `src/scene/absorption.js` — the one module (the deliverable)

```js
import * as THREE from 'three'
import { PAL } from './palette.js'

// JS-side: σ ratio as a Vector3 (consumers scale by density)
export const SIGMA_EMBER = PAL.sigmaEmber.clone()

// GLSL string — inlined after GLSL_NOISE / GW_TEMPERATURE in any medium material.
// Pure functions of (distance, sigma); reads no uniforms itself (consumers own uSigma).
export const GW_ABSORPTION = /* glsl */ `
  // Beer–Lambert per-channel extinction. d = path length through the medium (world units).
  // sigma = GW_SIGMA_EMBER * density.  Returns the surviving transmittance per channel (0..1).
  vec3 gw_transmit(float d, vec3 sigma){ return exp(-max(d,0.0) * sigma); }

  // Apply forge-warm absorption to a beam of color 'lit' after travelling distance d.
  vec3 gw_absorb(vec3 lit, float d, vec3 sigma){ return lit * gw_transmit(d, sigma); }

  // Convenience: mix toward the medium body color by how much light was eaten.
  // body = the medium's own dark color (PAL.void for smoke/void).  alpha-style composite.
  vec3 gw_medium(vec3 lit, vec3 body, float d, vec3 sigma){
    vec3 T = gw_transmit(d, sigma);
    return lit * T + body * (1.0 - max(T.r, max(T.g, T.b)));
  }
`

// --- JS bridge to three's built-in transmission (KHR_materials_volume parameterization) ---
// three computes σt = -log(attenuationColor)/attenuationDistance and T = exp(-σt·x).
// Inverting: to make a transmissive material absorb with OUR spectrum at density k over
// reference distance d0, set attenuationColor = exp(-SIGMA_EMBER*k*d0), attenuationDistance = d0.
export function emberAttenuation(density = 1.0, d0 = 1.0) {
  const s = SIGMA_EMBER
  const c = new THREE.Color(
    Math.exp(-s.x * density * d0),
    Math.exp(-s.y * density * d0),
    Math.exp(-s.z * density * d0),
  )
  // GUARD: a zero channel → log(0) = -inf in three's σt. Clamp away from 0 (see §7).
  c.r = Math.max(c.r, 1e-3); c.g = Math.max(c.g, 1e-3); c.b = Math.max(c.b, 1e-3)
  return { attenuationColor: c, attenuationDistance: d0 }
}
```

### 4.4 Consumer 1 — the smoke raymarch (doc `17` Tier 3), now via the constant
The Tier-3 loop's hand-spelled `exp(-d*SIGMA*vec3(1.0,1.6,2.4))` collapses to one call. The σ ratio is gone
from the smoke shader entirely — it reads `uSigma`:

```glsl
// in marchSmoke(), per step — was: vec3 absorb = exp(-d*SIGMA*vec3(1.0,1.6,2.4));
vec3 absorb = gw_transmit(d, uSigma);                 // uSigma = SIGMA_EMBER * uDensity
C += T * d * STEP * lightCol * lightT * phase * absorb;
T *= exp(-d * length(uSigma) * STEP);                 // grey transmittance for the march accumulation
```
(The *colored* `absorb` tints the in-scattered light warm; the *scalar* transmittance `T` uses a luminance/
length of σ so the march still terminates correctly — colored extinction on the accumulator is fine too, but
the scalar is one fewer vec3 and the visible warmth comes from the in-scatter term.)

### 4.5 Consumer 2 — the void haze (doc `17` Tier 1 depth-fog Effect), warm-passing
The cheap depth-fog Effect mixes toward a haze color; feed that color through absorption so even the free tier
agrees with the spectrum:

```glsl
float z   = -getViewZ(depth);                  // metres from camera
vec3  body = mix(${v3(PAL.void)}, ${v3(PAL.ember)}, uTemp);   // medium's own color (cold→hot)
vec3  T    = gw_transmit(z, uSigma);           // warm-passing transmittance over depth
outputColor.rgb = inputColor.rgb * T + body * (1.0 - clamp(dot(T, vec3(0.333)), 0.0, 1.0));
```
Now distant scene light is *warm-tinted by depth* with the same σ as the smoke and glass — the void itself is a
thin ember medium.

### 4.6 Consumer 3 — the obsidian slab (opaque, in-shader fake depth) and the jewel (real transmission)
**Slab (opaque, `transmission:0`):** the "looking into the stone" depth (doc `07 §3.4`, view-parallaxed inner
veins) gets a real warm-bias by absorbing the inner-vein emission over the parallax depth:

```glsl
// in COLOR, after computing inner-vein emission `veinCol` and a fake interior depth `dIn`:
float dIn = uVeinDepth * (0.5 + 0.5*gwFres);   // deeper near grazing angles
veinCol = gw_absorb(veinCol, dIn, uSigma);      // the stone body warms what shines through it
```
**Jewel (real transmission):** no shader edit — feed three's built-in absorption in JS so it matches:

```js
import { emberAttenuation } from '../scene/absorption.js'
// on the faceted gem material (MeshPhysicalMaterial, transmission:1):
const att = emberAttenuation(/*density*/ 0.9, /*d0 = gem radius*/ 0.6)
gem.attenuationColor.copy(att.attenuationColor)
gem.attenuationDistance = att.attenuationDistance
// dispersion stays a SEPARATE 3-tap IOR split (doc 07); each split is then attenuated by the same att.
```

### 4.7 Consumer 4 — the molten pour interior (the depth-tint that reads as "liquid")
The meniscus/wet-front (doc `18`) emits `gw_forge(temp)` at the surface; light that entered and travelled a
short interior path `dMen` leaves warmer/redder — the read that distinguishes molten liquid from a glowing
decal:

```glsl
vec3 surface  = gw_forge(temp);                       // white-hot at the very top of the front
float dMen    = uMeniscusDepth * (1.0 - topMask);     // thicker below the bright rim
vec3 belly    = gw_absorb(surface, dMen, uSigma);     // interior cools-by-absorption to red
vec3 pourCol  = mix(belly, surface, topMask);         // bright wet rim over warm deep body
```
This is the **same** σ that warms the smoke — so the air above the pour and the metal of the pour share one
warm bias. That visual rhyme is the cohesion payoff.

### 4.8 Key uniforms / params (shared pool, `00-COHESION-MAP §4.2`)

| Uniform | Source | Meaning |
|---|---|---|
| `uSigma` (vec3) | `SIGMA_EMBER.clone().multiplyScalar(density)` | the world absorption coefficient; **ratio locked**, magnitude driven |
| `uDensity` (float) | `damp` toward `sceneFor(route).mediaDensity * (1 - 0.4*uHeat)` | overall σ magnitude; **hotter forge → thinner media** |
| `uVeinDepth` / `uMeniscusDepth` | per-material constants | the fake interior path length for slab/pour |
| `attenuationColor`/`attenuationDistance` | `emberAttenuation(density,d0)` in JS | the jewel's real transmission absorption, **same spectrum** |

### 4.9 Hook into the master temperature system
`uDensity` is written by the **one** `<ForgeDriver/>` writer (`00-COHESION-MAP §1.5/§4.2`), dt-damped:
`uDensity ← damp(uDensity, base*(1 - 0.4*uHeat.value), 3, dt)`. So a scroll-driven heat surge thins the soot,
brightens the glass, and reddens the pour-belly **in the same frame** — and a strike (`exp(-since*3)`) puffs
denser smoke then clears it, all on the shared clock. The σ *ratio* never moves (it's the spectrum); only the
*amount* of medium moves with temperature. This is the difference between "absorption that belongs to the
forge" and "a fog slider."

---

## 5. COHESION (shared palette / lighting / uniforms)

This module is a cohesion *amplifier*: its entire reason to exist is to delete three independent tints.

- **One spectrum, three media.** Smoke (`gw_transmit`), obsidian/jewel (`attenuationColor` via
  `emberAttenuation`), and the pour interior (`gw_absorb`) all read `SIGMA_EMBER`. Change the ratio once in
  `palette.js` and the air, the stone, and the metal re-warm together. There is no second tint to forget.

- **Palette / 60-30-10.** The medium "body" color is always `PAL.void` (cold) → `PAL.ember` (hot), never a
  fresh grey — the absorption *produces* the warm 10% accent from any light, so the warm bias is **emergent
  from the palette**, not painted on. Crucially, absorption only ever *darkens* and *warms*; it can never push
  a channel above 1.0, so it **never creates bloom** — only the emissive sources (`gw_forge`/`gw_divineFire`,
  the >1 accent) bloom, and absorption then tints their halo warm. The bloom contract (`§6` of the map) is
  preserved automatically.

- **Master temperature.** σ magnitude rides `uTemp`/`uHeat` off the one driver. Cohesion-rule #1 is extended:
  every medium "reads the master temperature, never invents heat" — *and now* reads the master spectrum, never
  invents a tint.

- **The divine-fire exception, respected.** The white-gold A/E light **is still absorbed** as it passes through
  smoke/stone (that's *why* it shafts visible god-rays and reveals Ogham — the medium is what makes the beam
  visible). But because σ is warm-passing, the divine beam stays white-gold-warm through the haze rather than
  going grey — the keystone color survives the medium. Absorption serves the keystone; it never overrides the
  `uIsAE` emission branch (that's emission, upstream of this term).

- **Lighting model.** "Metal is the only light" (`§5`) means absorption is *how the single light source fills
  the volume*: the smoke near the pour glows because the pour's light is in-scattered then warm-absorbed; the
  basalt warms because the pour's/AE's light reaches it through a thin warm medium. Absorption is the delivery
  mechanism of the one-light world.

- **Shared noise.** The *density field* the path length `d` is sampled from is still `gw_fbm`/`gw_warp` (the one
  noise basis, `§2`) — absorption adds no new noise, it consumes the shared one. The smoke's swirl and the
  glass's interior depth are the same grain.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

Absorption is the *cheapest* term in the world — it is the rare addition that **improves** cohesion at
essentially zero cost. The budget story:

- **Cost per medium sample: one `exp(vec3)`** (3 transcendentals) plus a `vec3` multiply. On the smoke
  raymarch this is *already* in the loop (it replaces an identical hand-rolled `exp`, so net zero). On the
  slab/pour it is **one** `exp` per pixel — sub-0.05 ms full-screen. On the jewel it is **free** (computed once
  in JS into `attenuationColor`; three's transmission shader already does the absorb it was always going to do).
- **No new pass, no new FBO, no new draw call.** Every consumer is an existing material/Effect; this only
  changes the *numbers* fed in. The single biggest mobile risk in this whole world — the transmission second
  scene-pass on the jewel (doc `07 §2.2`) — is **untouched** and stays a single small `resolution:128`,
  `samples:4` gem; absorption rides on the pass that already exists.
- **Tiers** (`high|low|static`):
  - **high** — colored σ everywhere: smoke raymarch warm-absorb, slab in-shader `gw_absorb`, jewel real
    `attenuationColor`, pour-belly tint, warm-passing void haze.
  - **low** — drop the smoke raymarch entirely (doc `17`); keep the *free* wins: warm-passing depth-fog
    (`gw_transmit` on depth), slab `gw_absorb` (one `exp`), jewel `attenuationColor` (free), pour-belly tint.
    Cohesion **survives a tier drop** because the constant is the same; only the most expensive *carrier*
    (raymarch) is dropped, not the spectrum.
  - **static** — frozen: depth-fog with `uTime`-frozen, `uDensity` at its route base, no raymarch. The warm
    bias still reads (it's a still, on-brand poster, not a broken fallback).
- **Degrades uniformly (`§7` rule 9).** Dropping a tier never recolors — σ ratio is identical across all three
  tiers; only the carrier and σ *magnitude* change. The "warm light through medium" read is present even on
  static.
- **NaN/perf guard.** `max(d,0.0)` in `gw_transmit` avoids `exp` of a negative-times-positive blowing up if a
  depth reconstruction goes slightly negative at the near plane; the JS `emberAttenuation` clamps the color
  away from 0 so three's internal `-log(c)` never hits `-inf` (a single NaN texel in transmission propagates
  through the mip blur and flickers the whole gem — the classic transmission bug).

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

Build cheap→structural→carrier, verify each before the next:

1. **Land the constant + module first, wired to NOTHING.** Add `PAL.sigmaEmber`, ship `absorption.js`, build
   green (`npm run build`), `qa-route` 0 console errors (SwiftShader compiles the GLSL string — a typo surfaces
   as an error). The spectrum exists before any consumer.
2. **Wire the cheapest consumer next: the void depth-fog** (`§4.5`). This is free and full-screen — the fastest
   way to *see* warm-passing absorption and tune the σ ratio on the **iPhone 15 OLED** (the warm bias is an
   OLED/P3 judgement; the headless shot lies). Lock the ratio here, once.
3. **Then the slab `gw_absorb`** on inner-vein depth (`§4.6`). Verify the stone's "look-into-the-glass" warms
   without the slab itself blooming (absorption can't exceed 1.0, so if it blooms you've got an emission bug,
   not an absorption bug — fix upstream).
4. **Then the jewel `emberAttenuation`** (`§4.6`). **Verify the zero-channel guard** before judging — set
   density high and confirm no NaN flicker (a black `attenuationColor` channel → `-log(0)` → NaN → the whole
   gem strobes). Keep dispersion a *separate* IOR split; do not fake it by tinting (pitfall 2.E).
5. **Then the pour-belly** (`§4.7`) and **last the smoke raymarch** (`§4.4`, `high` only) — replace its
   hand-spelled `vec3(1,1.6,2.4)` with `gw_transmit(d,uSigma)` and confirm the smoke warmth now *matches* the
   glass and pour you already tuned (it must, by construction).
6. **Wire σ magnitude to `uHeat` last** (`§4.9`), via the one driver, dt-damped. Scroll and confirm air/glass/
   pour thin-and-warm *together*. If any one lags, you forgot to bind the shared `uDensity` reference (you
   cloned instead of referenced — `§4.2` of the map).

**The specific traps that bite:**
- **Two tints, one world.** The whole failure mode: someone hard-codes a grey smoke or a neutral glass tint
  "just to see it." Never let a medium pick its own color — it *derives* color from σ + the light. If you're
  typing a tint hex into a medium, you've broken the doc.
- **Zero attenuationColor → NaN** (Khronos documents this; `§4.3` clamps it). The #1 transmission crash.
- **Negative path length at the near plane** → `exp` blow-up; `max(d,0.0)` (`§4.3`).
- **Double-absorbing.** Don't both feed `attenuationColor` *and* `gw_absorb` the same ray on the jewel — pick
  one (real transmission for the gem, in-shader for the opaque slab). Two absorptions = mud.
- **Absorbing the emission you wanted to bloom.** Absorption tints the *halo* warm, but if you apply it to the
  white-hot core *before* the emissive add, you'll dim the >1 source below the bloom threshold and lose the
  glow. Order: emit (`gw_forge`) → bloom-relevant (>1) → then medium absorbs the *transmitted/scattered* copy,
  not the source. The pour `topMask` (`§4.7`) keeps the bright rim un-absorbed for exactly this reason.
- **Moving the ratio per route.** The σ *ratio* is the spectrum — a world constant. Only `uDensity` (magnitude)
  is per-route. A per-route ratio is a per-route palette: forbidden.

---

## 8. SOURCES (2025–2026)

1. Khronos glTF — **`KHR_materials_volume` extension spec** (attenuation math: `σt = -log(attenuationColor)/
   attenuationDistance`, `T(x) = exp(-σt·x) = c^(x/d)`, RGB → per-channel σ, zero-channel undefined behavior) —
   maintained spec, surfaced via three.js r178 (2025-07) transmission path —
   https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md
2. three.js — **MeshPhysicalMaterial docs + r178 release** (`attenuationColor`/`attenuationDistance`,
   transmission/volume, the WebGL transmission-pass maintenance) — **2025-07** —
   https://threejs.org/docs/pages/MeshPhysicalMaterial.html · https://80.lv/articles/three-js-178-is-now-available
3. matejlou — **Analytic Fog Rendering With Volumetric Primitives** (closed-form constant-density Beer–Lambert
   `exp(-density·rayLength)`, bounded primitives, why constant-density needs no march) — **2025-02-11** —
   https://matejlou.blog/2025/02/11/analytic-fog-rendering-with-volumetric-primitives/
4. Maxime Heckel — **On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for
   the Web** (nested raymarch toward light, Beer's-law absorption/transmittance/extinction in R3F) —
   **2025-06-10** — https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
5. Maxime Heckel — **On Rendering the Sky, Sunsets, and Planets** (RGB/per-channel extinction, ozone
   *absorption* vs Rayleigh/Mie *scattering* split, wavelength-dependent coefficients as the source of warm
   color through a medium) — 2025 — https://blog.maximeheckel.com/posts/on-rendering-the-sky-sunsets-and-planets/
6. `CK42BB/procedural-clouds-threejs` — **WebGPU raymarch + WebGL2 fallback**: Beer–Lambert absorption,
   Henyey–Greenstein phase, light-march self-shadowing; GLSL/WGSL/TSL shader bundle — **created 2026-02-07** —
   https://github.com/CK42BB/procedural-clouds-threejs
7. Codrops (Matt Park) — **Warping 3D Text Inside a Glass Torus** (`MeshTransmissionMaterial`
   chromaticAberration as wavelength-dependent IOR split, resolution/samples cost, dispersion-vs-absorption
   distinction) — **2025-03-13** — https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
8. Codrops — **Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL** (TSL volumetric
   inside transmissive glass; density→color in nodes; the TSL `exp`/absorption portability target) —
   **2025-03-10** — https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/
9. arXiv — **OpenPBR: Novel Features and Implementation Details** (2512.23696) — absorption-coefficient layering,
   transmission/volume parameterization, spectral-vs-RGB absorption tradeoffs — **2025-12** —
   https://arxiv.org/abs/2512.23696
10. Franky Hung (Medium) — **Building a Cube with Chromatic Dispersion in Three.js** (Cauchy `n(λ)` per-channel
    IOR; the dispersion split that must stay *separate* from absorption) — 2025 —
    https://franky-arkon-digital.medium.com/building-pinterest-design-of-a-cube-with-chromatic-dispersion-in-three-js-07d007316c84

_Pre-2025 canon cited only as covered by the above: Beer–Lambert / radiative-transfer extinction term, and the
Guerrilla/Schneider cloudscape absorption+phase recipe — surfaced via sources 3, 4, and 6._

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Temperature-driven σ as a 2-D LUT (density × temperature → attenuationColor).** Bake the
   `emberAttenuation(density, temp)` surface into a tiny 32×8 gradient texture so the jewel's `attenuationColor`
   can be updated per-frame from one texel fetch instead of a per-frame `exp` in JS, and so the smoke/slab read
   the *same* LUT the transmission does — closing the last gap between in-shader and built-in absorption. Ties to
   doc `03` (ramp-as-baked-gradient).
2. **Scattering albedo as the second spectrum constant.** This doc owns *extinction* (absorption). The smoke
   also *in-scatters* (doc `17` Henyey–Greenstein). Formalize a single-scattering-albedo `vec3` so the smoke's
   *glow* color and its *absorption* color are derived from one pair `(σ_extinction, albedo)` — the full
   participating-media parameterization, still one constant set.
3. **Dispersion × absorption on the jewel as one combined pass.** Spec the exact ordering: 3-tap IOR split
   (Cauchy `n(λ)`, doc `07`/source 10) → per-split `gw_absorb` with the shared σ → recombine, proving the gem's
   rainbow edges and its warm body come from one coherent light-transport model rather than two stacked tricks.
4. **Heat-shimmer as the refraction twin of absorption.** The "heat distorts the air" beat (doc `17 §9`
   candidate 3) is the *bending* counterpart to this doc's *attenuating* term — scope them as the two halves of
   one screen-space "hot-air medium" pass (UV-warp + warm absorb) sharing `uSigma` and the hot-region mask.
