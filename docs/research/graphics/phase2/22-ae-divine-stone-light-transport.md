# 22 — The Unified A/E Divine-Fire → Stone Light-Transport Model

_Phase 2 deep-dive · GAELWORX forge world · Cluster E-light-finish-arch · target: iPhone 15 OLED ·
one WebGL renderer (r3f + three.js)_

> **Reads first:** `00-COHESION-MAP.md` (§1 master temperature, §4.2 the master uniform pool `U`,
> §5 the lighting model — "the metal is the only light", §5.2 the A/E divine radiance). Phase-1
> `19-emissive-light-bleed-arealights.md` (the five families for "an emissive letter lights the
> stone"), `23-caustics-refraction-molten.md` (the caustic receiver), `25-ogham-carved-stone-text.md`
> + `26-carved-stone-engraving-shader.md` (the Ogham receiver). Phase-2 `10-basalt-green-reveal-transport.md`
> (the basalt receiver that already calls `gw_reveal()`). This document is the **emitter/transport
> authority** those receiver docs point at: it defines the ONE canonical `gw_aeLight()` light model —
> falloff, colored bounce, grazing term — that turns the single `uAEFire`/`uAEFirePow` signal into the
> green-reveal, the Ogham legibility rim, and the caustic pool as ONE physically-motivated causal
> lighting event, not three look-alike fakes tuned per route.

---

## 1. SCOPE — the world-defining beat every doc points at

In a world that is **pure void lit only by the metal itself** (`00-COHESION-MAP §5`), there is exactly
one *eternal* light: the white-gold "divine fire" held forever by the first `A` and first `E` of the
poured wordmark. Every other letter cools from white-hot to iron-black and *stops being a light*; the
A and the E never cool, so they are the only **permanent** light sources in the forge. The brand canon
fixes this (`CLAUDE.md`, "A+E IGNITED"); the cohesion map elevates it to the keystone (`§1.4`, `§5.2`).
This document is about the **light those two letters cast** — the transport from the divine emitter to
the basalt it rakes, the Ogham it reveals, and the caustic pool it throws.

The single failure this guards against is the one the whole cohesion map exists to prevent: **three
separate fakes**. Today the green-reveal could be a hand-tuned `1/(1+d²)` in the basalt shader, the
Ogham rim a different `dot(N,L)` in the engraving shader, and the caustic pool a third magic radius in
the caustic preset — three expressions that *look* similar at one tuning and **drift apart the moment
anyone touches a knob**, so the green surfaces at a different distance than the Ogham becomes legible
than the pool brightens, and the "one fire revealing the lore" illusion shatters into three decals.
The fix is structural: **one function, `gw_aeLight()`, in `src/scene/shaders.js`, called by all three
receivers**, driven by one signal pair (`uAEFire` position, `uAEFirePow` intensity) written once by
`<ForgeDriver/>`. When the A/E intensity surges on a strike, the green lifts, the Ogham rises, and the
pool brightens **in the same frame, from the same float** — that synchrony *is* the proof the light is
real and not painted.

What this doc owns (the emitter + transport model):

1. **The falloff** — how divine-fire intensity decays with distance from the A/E, physically motivated
   (windowed inverse-square, the Filament/Khronos punctual-light formula) but art-directed for a soft,
   warm, *radiant* pool rather than a hard spotlight cookie.
2. **The colored bounce** — the white-gold light does not stay white. It picks up the **stone's own
   serpentine green** as diffuse colored bounce (the green-reveal) and lays down a **white-gold
   specular/wash** on top (the legibility spill). This is a one-bounce radiosity approximation, not a
   tinted multiply.
3. **The grazing term** — light raking *across* incised relief at a low angle is what makes carved
   Ogham notches throw their hardest self-shadow and become readable. The grazing boost is the term the
   Ogham *needs*, and it is shared so the stone-green and the carving surface from black on the identical
   event.
4. **The three consumers** — basalt green-reveal, Ogham legibility rim, caustic divine pool — as three
   *call sites* of one function, differing only in which output channel they read (diffuse lift vs.
   groove-rim vs. focused caustic filament).

What this doc does **not** own: the basalt material body (`10`/`05`), the Ogham stroke SDF (`25`), the
caustic ridge pattern (`23`). It owns the **light that drives all of them**.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

How modern real-time WebGL/WebGPU work models "a localized emissive object lights an opaque surface
near it, revealing hidden detail," scored for *this* build on quality / perf / mobile / complexity.

### A. Analytic in-shader light-transport term (windowed inverse-square + grazing) — **the spine**
Compute the divine-fire contribution as a closed-form function of distance and grazing angle, in the
receiver's fragment shader, and use it to lift hidden detail out of black. This is the direct heir of
the **Filament** point-light model (the `getSquareFalloff` windowed inverse-square) and the
**Khronos glTF punctual-lights** range attenuation (`(1 - (d/range)⁴)²` clamped, divided by `d²`). The
2025-2026 *reveal* idiom layers a Fresnel/grazing term on top and routes it into the emissive channel:
Codrops' **Dual-Scene Fluid X-Ray Reveal** (Mar 2026) computes a Fresnel term, mixes a near-black core
to a bright edge, pipes it into the **emissive channel so dark surfaces glow on their own at grazing
edges**, and adds a `smoothstep` along an axis to fade the hard edge to black — exactly the "dark by
default, light only where raked" grammar GAELWORX needs. _Quality:_ excellent for a stylized sacred
forge, fully art-directable. _Perf:_ near-free (≈8 ALU ops, no extra pass, no light list). _Mobile:_
ideal — runs on every tier including `static`. _Complexity:_ low; lives entirely inside the existing
`onBeforeCompile` chunk-injection grammar. **This is the mechanism of record.**

### B. Physically-based punctual / area lights (real three.js lights)
Park a real light at each A/E: a `PointLight` with `decay=2`, or a `RectAreaLight` (LTC — Linearly
Transformed Cosines, the SIGGRAPH-2016 technique three.js ships, init via `RectAreaLightUniformsLib`
for WebGLRenderer / `RectAreaLightTexturesLib` for WebGPURenderer). _Quality:_ a `RectAreaLight` is the
*correct shape* for a glowing letter slab — soft, directional, correct grazing on relief — and the
bounce is genuinely "real." _Perf:_ `RectAreaLight` is the historically expensive light, cost is
**per-light × per-lit-pixel**, has **no shadows** (light leaks through the letter geometry), and two of
them over a near-full-screen basalt floor is a documented mobile fill-rate trap (`19` §2A,
`00-COHESION-MAP §5.2`). _Mobile:_ `high`-tier only, **capped at 2** (one per A/E), and even then it
must touch only the **metal-letter materials**, never the stone floor. _Complexity:_ low to wire, but
the no-shadow leak and LTC init are real. **Use as a `high`-tier garnish on the letters; never the
reveal mechanism of record.**

### C. Baked emissive / light-map spill
Bake the green-spill + groove-AO into a lightmap once geometry is frozen. _Quality:_ great static look,
free at runtime. _Mobile:_ perfect. _Fatal flaw for the hero beat:_ it is **static** — it cannot rise
as the divine light *approaches* on scroll, and the whole point is the live reveal as the fire nears.
**Reserved for the `static` tier and far background stone only.**

### D. Distance-field / SDF light reveal
Treat the light as an SDF and reveal where `sceneSDF < radius` (the Unity world-reveal lineage).
_Quality:_ crisp but reads *geometric/UI* — a spotlight cookie, not radiance. _Tradeoff:_ a divine
fire's light is soft and warm and falls off smoothly; a hard SDF radius reads as a torch circle. **Take
the idea (the falloff is a smooth radial band) and reject the hard edge** — the windowed inverse-square
in (A) *is* the smooth version of this.

### E. Screen-space reveal pass (post-process)
Do the reveal as a fullscreen pass keyed to a luminance/emissive buffer (the Susurrus `uProgress`
screen-quad, Apr 2026; or an MRT emissive attachment per Maxime Heckel's Field Guide, Oct 2025).
_Quality:_ good for *global* wipes. _Tradeoff:_ the green-reveal and Ogham rim are **per-surface and
view-dependent** (grazing angle and distance to *this* fragment, on *this* facet) which a screen-space
pass cannot see — it would reveal screen *regions*, not stone *facets*. **Wrong layer for this effect;
the transport belongs in the material.** (MRT is still the right answer for *bloom selection* of the
hottest spill — §6, and the WebGPU forward path.)

### F. One-bounce colored radiosity / GI approximation (the colored-bounce half)
The white-gold light hitting green stone should reflect *green-tinted* light (color bleeding), and that
green should diffuse onto the carving. Real-time GI families (radiance cascades — Osborne/Sannikov,
arXiv 2024-2025; probe GI; voxel cone tracing) model this exactly. _Quality:_ physically correct color
bleed. _Perf/Mobile:_ all are far over the iPhone-15 budget (extra passes, probes, volumes). **Out of
scope as a system — but borrow the *insight*:** a single analytic one-bounce term (light color ×
surface albedo for the diffuse bounce, plus a separate specular wash) captures the read for free. This
is the principled reason the bounce in (A) is `lightColor * stoneAlbedo` for the green and a separate
`lightColor` wash for the legibility — not an arbitrary tint.

### G. Caustics as a projected light contribution (the caustic-pool half)
The divine pool on the stone is a focused-light caustic. The 2025-2026 WebGL caustic idiom (Evan
Wallace's differential-area method, ported to three.js and *modified in 2026* for arbitrary geometry;
Maxime Heckel's R3F caustics) computes a caustic intensity from screen-space derivatives / a
domain-warped ridge and **multiplies it onto the receiving surface as added light**, with a small
chromatic offset for colored caustics. _Quality:_ the signature "fire under water" filament read.
_Perf:_ the GAELWORX repo already ships `gw_caustic` (domain-warped fbm with `pow(1-abs(fbm), 4.5)`
ridges) for exactly this — so the caustic is *free* if it is **gated by the same `gw_aeLight()`
falloff** rather than a private radius. _Mobile:_ `high`/`low`. **Adopt: the caustic ridge is existing
noise; the caustic *pool placement and brightness* is `gw_aeLight()`.**

### H. TSL / WebGPU node rewrite (the forward path)
Express `gw_aeLight()` as a composable TSL `Fn()` on `WebGPURenderer`; the `webgpu_lights_custom`
example (2025) exposes `getDistanceAttenuation` as a node, and `setMRT` (Maxime Heckel Field Guide, Oct
2025) gives an emissive attachment for **exact** bloom selection of the spill (no luminance guess).
_Quality:_ identical look, cleaner authoring, exact bloom. _Mobile:_ the WebGL2-fallback branch of
`WebGPURenderer` is **less battle-tested on mobile Safari** — betting the judge device on it is the
documented mistake (`00-COHESION-MAP §10`). **Out of scope for the judge build; author the GLSL
TSL-portable so the eventual port is a re-host, not a rewrite.**

**Verdict.** The model of record is **A** (analytic windowed-inverse-square + grazing, X-ray-reveal
grammar) with **F**'s one-bounce colored insight baked into the output, **G** for the caustic consumer
(existing `gw_caustic` gated by the *same* falloff), **B** as a `high`-tier letter-only garnish, **C**
as the `static` fallback, and **H** as the post-judge forward path. One cheap fragment-shader function
is the only approach that runs on `static`, can sample the carving relief to reveal Ogham, and costs
nothing — and, critically, is the only one that can be *literally shared* by all three consumers.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: one canonical `gw_aeLight()` light-transport function in `src/scene/shaders.js` that returns a
small struct — `{ diffuse, graze, spill, fall }` — from the single `uAEFire`/`uAEFirePow` signal, and
three thin consumer expressions (basalt green-reveal, Ogham legibility rim, caustic divine pool) that
each read the channels they need. The falloff is a windowed inverse-square (Filament/Khronos), the
colored bounce is `aeColor·stoneAlbedo` (diffuse) + `aeColor` (white-gold wash), and the grazing term
is the shared driver of carved-relief legibility. Injected via the existing `onBeforeCompile` pattern,
binding the master uniform pool `U`; the A/E itself never touches this (it reads `gw_divineFire`).**

Why this, against the world and the constraints:

- **One function, three consumers = the cohesion guarantee, not a coincidence.** The cohesion map's
  promise — "shares the falloff with the Ogham reveal" and "the caustic divine preset throws a tight,
  calm, white-gold pool" (`§5.2`) — becomes a literal shared symbol. Doc `10` already *calls*
  `gw_reveal()`; this doc generalizes that into `gw_aeLight()` returning the **graze** and **spill**
  channels the Ogham and caustic also need, so all three are mathematically the same event. The
  `02`/`03` "one authority, never two parallel copies" lesson, applied to light.
- **Physically motivated, then art-directed.** The falloff is the *real* punctual-light windowed
  inverse-square (so distance behaves correctly and the pool can't go infinitely bright at the source
  or leak forever), but the window radius and the grazing weight are art knobs so the divine fire reads
  *radiant and sacred*, not like a Quake torch. Physically grounded where it matters (causal, consistent
  across consumers), stylized where the brand demands.
- **Colored bounce is one-bounce radiosity, free.** `aeColor * serpentine` for the diffuse green-lift is
  *why* the stone glows green near the fire and not, say, cyan — it is the divine light reflecting off
  green rock. The white-gold `aeColor` wash on top is the specular/legibility spill. Two analytic terms
  capture what a GI solver would, at zero pass cost.
- **The A/E never reach `uTemp`.** This is the keystone branch (`00-COHESION-MAP §1.4`). `gw_aeLight`
  is driven by `uAEFirePow` (from `gw_divineFire`, never the temperature ramp), so the eternal fire
  stays white-gold forever regardless of forge heat — and the *stone it lights* warms/cools with the
  ambient `uTemp` independently, which is correct (the rock takes ambient heat; the divine fire does
  not).
- **Stays in the proven engine.** No new canvas, no EXR, no renderer swap — `onBeforeCompile` +
  `${GLSL_NOISE}` + `v3(PAL.x)`, verifiable today via `shader-fx` + `qa-route`. The TSL mirror (§4.9) is
  authored now so the WebGPU port is a re-host.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` r17x (in repo) — `MeshPhysicalMaterial`/`MeshStandardMaterial` + `onBeforeCompile`. No
  renderer change. `RectAreaLight` + `RectAreaLightUniformsLib` only on the `high`-tier letter
  materials.
- `@react-three/fiber` ^8 / `@react-three/drei` (existing) — `<Detailed>` LOD for far stone.
- `@react-three/postprocessing` (existing) — `mipmapBlur` bloom catches the white-gold spill that
  crosses 1.0.
- Shared in-repo: `GLSL_NOISE`/`gw_caustic` (`src/scene/shaders.js`), `PAL`/`v3`
  (`src/scene/palette.js`), the master temperature GLSL (`gw_tempColor`/`gw_forge`/`gw_divineFire`,
  Phase-2 doc 01), the master uniform pool `U` (`src/scene/forgeUniforms.js`), `forge`/`damp`/`sceneFor`
  (`src/store.js`).
- **No new runtime asset.** Pure function + uniforms.

### 4.2 The canonical light-transport function (the deliverable — add to `shaders.js`)

This is the symbol the basalt, the Ogham, and the caustic preset all call. It is **pure** (no uniform
reads inside), so it inlines into any material and ports 1:1 to TSL. It returns a small struct so each
consumer reads only the channel it needs, and the falloff is computed **once** for all three.

```glsl
// ── GAELWORX canonical A/E divine-fire light transport ───────────────────────
// ONE light model. Consumed identically by basalt green-reveal, Ogham legibility,
// and the caustic divine pool. Physically-motivated falloff, one-bounce colored
// bounce, grazing term. Pure function of geometry + the uAEFire/uAEFirePow signal.
struct GwAE { float fall; float graze; float lit; vec3 diffuse; vec3 spill; };

// Filament/Khronos windowed inverse-square: smooth, bounded at the source, and
// forced to ZERO at uRange so the pool can't leak across the whole floor.
float gw_aeFalloff(float d2, float range, float k){
  float invSq  = 1.0 / (1.0 + d2 * k);             // bounded inverse-square (no infinity at d=0)
  float w      = clamp(1.0 - d2 / (range*range), 0.0, 1.0);
  float window = w * w;                            // (1 - (d/range)^4)^2 shape, computed on d2
  return invSq * window;                           // smooth radiant pool, hard zero at the rim
}

// aePos/aePow : the single signal (nearest A/E world pos + intensity, from U).
// aeColor     : the divine white-gold (PAL.divine), the light's OWN color.
// albedo      : the receiver's hidden color (serpentine green) — for the colored bounce.
// k, range    : falloff tightness + hard cutoff (route-tuned).
// grazeAmt    : how much grazing is weighted over front-fill (Ogham wants high).
GwAE gw_aeLight(vec3 wp, vec3 wn, vec3 aePos, float aePow, vec3 aeColor,
                vec3 albedo, float k, float range, float grazeAmt){
  vec3  toAE  = aePos - wp;
  float d2    = dot(toAE, toAE);
  float fall  = gw_aeFalloff(d2, range, k);
  vec3  L     = toAE * inversesqrt(max(d2, 1e-4));     // unit dir to the fire
  float ndl   = max(dot(wn, L), 0.0);
  // grazing boost: light raking ACROSS the surface (low N·L) surfaces incised relief hardest.
  float graze = mix(ndl, 1.0 - ndl, grazeAmt);        // grazeAmt~0 = front-lit, ~1 = pure raking
  float lit   = aePow * fall * graze;                 // the master scalar all consumers gate on
  GwAE o;
  o.fall    = fall;
  o.graze   = graze;
  o.lit     = lit;
  o.diffuse = aeColor * albedo * lit;                 // ONE-BOUNCE colored bounce (green lift)
  o.spill   = aeColor * (aePow * fall) * 0.18;        // white-gold legibility wash (grazing-independent)
  return o;
}
```

Notes that matter:
- **Falloff uses `d2` throughout** — no `length()`/`sqrt` for the window (the `(1-(d/range)⁴)²`
  collapses to operations on `d2`). Only one `inversesqrt` for the direction `L`. Cheapest possible.
- **`graze = mix(ndl, 1-ndl, grazeAmt)`** unifies front-fill and pure-raking into one slider. Basalt
  uses `grazeAmt≈0.55` (mostly raked, some fill so front faces don't vanish); Ogham uses `grazeAmt≈0.8`
  (notches need hard raking); the caustic pool uses `grazeAmt≈0.2` (the pool sits on the floor the fire
  faces). One term, three weights — *not* three terms.
- **`o.diffuse = aeColor * albedo * lit`** is the colored bounce: feed the receiver's hidden albedo and
  get back light-tinted-by-stone. **`o.spill = aeColor * fall * 0.18`** is the separate white-gold wash
  that makes carving legible regardless of facet angle (so the Ogham doesn't disappear on front faces).
- **`o.lit`** is the single scalar every consumer thresholds on — the Ogham rim, the caustic brightness,
  and the green-reveal smoothstep all key off `lit` so they rise from black on the *same* value.

### 4.3 Consumer 1 — basalt green-reveal (after `#include <color_fragment>`)

The basalt (doc `10`) now calls `gw_aeLight()` instead of the standalone `gw_reveal()`:

```glsl
vec3 serpentine = vec3(0.045, 0.115, 0.085);                  // hidden, DARK, desaturated (PBR floor)
vec3 ironBlack  = ${v3(PAL.void)};
GwAE ae = gw_aeLight(vWPos, normalize(vWNrm), uAEFire, uAEFirePow,
                     ${v3(PAL.divine)}, serpentine, uRevealK, uAERange, 0.55);

float rev      = clamp(uAmbient + ae.lit + uReveal, 0.0, 1.6);   // ambient floor + divine fire
float greenLift = gwVein * smoothstep(0.06, 0.62, rev);          // band: faint-lit stone stays near-black
vec3  stone     = mix(ironBlack, serpentine, greenLift);
stone          += ae.diffuse * 1.6;                              // colored bounce: green BLOOMS toward fire
stone          += ae.spill;                                      // white-gold wash (legibility)
diffuseColor.rgb = stone;   // replace ALBEDO at <color_fragment> — NOT the emissive hook
```

### 4.4 Consumer 2 — Ogham legibility rim (after `#include <color_fragment>` in the engraving material)

The Ogham (docs `25`/`26`) is incised strokes in the basalt. Legibility = the **groove lip catches the
raking divine light** while the groove floor stays in shadow. The same `gw_aeLight` with a high
`grazeAmt`, multiplied by the carve relief, is the rim:

```glsl
// carveH in [0,1]: 1 = un-incised stone surface, 0 = deepest groove floor (from SDF strokes / POM).
// carveLip: the derivative magnitude of carveH — high on the groove WALLS (where the rim lives).
GwAE ae = gw_aeLight(vWPos, normalize(carveNormal), uAEFire, uAEFirePow,
                     ${v3(PAL.divine)}, serpentine, uRevealK, uAERange, 0.8);

float rim   = ae.graze * carveLip * ae.fall * uAEFirePow;       // raked light on the groove wall
float floorShadow = mix(0.35, 1.0, carveH);                     // groove floor self-occludes
vec3  ogham = mix(ironBlack, serpentine, smoothstep(0.05, 0.6, ae.lit) * floorShadow);
ogham += ${v3(PAL.gold)} * rim * 0.9;                           // the white-gold legibility rim
ogham += ae.spill * carveH;                                     // wash on the flat stone only
diffuseColor.rgb = mix(diffuseColor.rgb, ogham, uOgham);        // uOgham per-route enable (scenes.js)
```

The Ogham `rim` and the basalt `greenLift` are driven by the **same `ae.fall`, `ae.graze`, `ae.lit`** —
so as the fire approaches, the green surfaces and the notches become legible on the identical curve.

### 4.5 Consumer 3 — caustic divine pool (the `gw_caustic` ridge, gated by `gw_aeLight`)

The caustic (doc `23`) is the existing `gw_caustic` ridge pattern; its **placement and brightness is
the AE falloff**, not a private radius. A small chromatic offset gives the colored "fire under glass"
filament:

```glsl
// caustic ridge from the SHARED noise, animated by uTime (boils in place, never scrolls).
float cR = gw_caustic(vWPos.xz * uCausticScale + vec2( 0.0, 0.0), uTime);
float cG = gw_caustic(vWPos.xz * uCausticScale + vec2(0.012, 0.0), uTime);  // chromatic split
float cB = gw_caustic(vWPos.xz * uCausticScale + vec2(0.024, 0.0), uTime);
vec3  caustic = vec3(cR, cG, cB);

GwAE ae = gw_aeLight(vWPos, normalize(vWNrm), uAEFire, uAEFirePow,
                     ${v3(PAL.divine)}, vec3(1.0), uRevealK, uAERange, 0.2);
// the POOL is the falloff: a tight, calm, white-gold caustic ONLY where the fire pools.
vec3 pool = caustic * ${v3(PAL.gold)} * ae.fall * uAEFirePow * uCausticGain;
diffuseColor.rgb += pool;   // added light on the floor — gated by the SAME falloff as green/Ogham
```

### 4.6 Vertex hook (after `#include <worldpos_vertex>`, all three receivers)

```glsl
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;     // world position — falloff/grazing need WORLD space
vWNrm = normalize(mat3(modelMatrix) * normal);          // world normal — view-space breaks the grazing term
```

### 4.7 HEAD declarations (after `#include <common>`, fragment)

```glsl
uniform vec3  uAEFire;                                   // nearest A/E divine-fire world position (U)
uniform float uAEFirePow, uAERange, uRevealK;            // intensity (U) + cutoff + tightness (local)
uniform float uTime, uTemp, uAmbient, uReveal, uOgham, uCausticScale, uCausticGain;
varying vec3  vWPos; varying vec3 vWNrm;
${GLSL_NOISE}                 // gw_snoise / gw_fbm / gw_caustic + gw_aeFalloff + gw_aeLight (above)
${GW_TEMPERATURE}             // gw_tempColor / gw_forge / gw_divineFire — the ONE ramp (doc 01)
```

### 4.8 The r3f binding + the ONE driver of the signal

The two uniforms that *define the light* — `uAEFire` (vec3 position) and `uAEFirePow` (intensity) —
live in the shared pool `U` and are written by the single headless `<ForgeDriver/>`, never per-material.
This is what makes all three consumers update from one float in one frame.

```jsx
// ── forgeUniforms.js (the shared pool, references not clones) ──
// uAEFire:    { value: new THREE.Vector3() }   // nearest A/E world pos
// uAEFirePow: { value: 0 }                      // divine-fire intensity (0..~1.5)

// ── ForgeDriver.jsx (the SOLE author of the AE signal) ──
useFrame((state, dt) => {
  // the A/E letterforms register their world positions + a base intensity; the driver picks the
  // NEAREST to the active chamber's focus and damps the pool toward it.
  const ae = forge.aeNearest                     // {pos: Vector3, base: number} computed from layout data
  U.uAEFire.value.copy(ae.pos)
  // divine fire NEVER cools: base is constant; a strike + scroll velocity surge it transiently.
  const target = ae.base * (1.0 + forge.strike * 0.6 + forge.scrollVel * 0.15)
  U.uAEFirePow.value = damp(U.uAEFirePow.value, target, 3.0, dt)   // dt-damped, one rAF
})

// ── BasaltStone / Ogham / Caustic materials: bind U, damp only LOCAL look knobs ──
const local = useMemo(() => ({
  uAERange:      { value: 6.0 },   // hard cutoff radius (world units) — the pool can't leak past this
  uRevealK:      { value: 0.26 },  // inverse-square tightness
  uAmbient:      { value: 0.22 },  // broad molten-spill floor
  uReveal:       { value: 0.0 },   // per-route/static floor
  uOgham:        { value: 0.0 },   // per-route Ogham enable
  uCausticScale: { value: 1.8 }, uCausticGain: { value: 0.0 },
}), [])
m.onBeforeCompile = (shader) => { Object.assign(shader.uniforms, U, local); /* …injection… */ }
useFrame((_, dt) => {
  const sc = sceneFor(forge.route)
  local.uOgham.value     = damp(local.uOgham.value, sc.ogham ?? 0, 2.4, dt)
  local.uCausticGain.value = damp(local.uCausticGain.value, sc.caustic ?? 0, 2.4, dt)
  local.uAERange.value   = damp(local.uAERange.value, sc.aeRange ?? 6.0, 2.2, dt)
  // uAEFire / uAEFirePow / uTime / uTemp are driven ONCE by <ForgeDriver/> into U.
})
```

### 4.9 Key uniforms / params (tuning table)

| Uniform | Source | Range | Meaning |
|---|---|---|---|
| `uAEFire` (vec3) | `U` / ForgeDriver | world | nearest A/E divine-fire position — **the emitter** |
| `uAEFirePow` | `U` / ForgeDriver | 0..~1.5 | divine-fire intensity — **the one driver of all three reveals** |
| `uAERange` | local ← `scene.aeRange` | 3..10 | hard falloff cutoff (world units); the pool's outer rim |
| `uRevealK` | local ← `scene.revealK` | 0.18..0.35 | inverse-square tightness; higher = tighter, more dramatic |
| `uAmbient` | local ← `scene.veinGlow` | 0.15..0.3 | broad molten-spill floor (baseline visibility) |
| `grazeAmt` (arg) | call site | 0.2 / 0.55 / 0.8 | caustic / basalt / Ogham raking weight |
| `uOgham` | local ← `scene.ogham` | 0..1 | per-route Ogham legibility enable |
| `uCausticGain` | local ← `scene.caustic` | 0..1 | divine caustic-pool brightness |
| `uTemp` | `U` / scroll | 0..1 | ambient forge heat — warms the *stone*, never the divine fire |

### 4.10 TSL-portable mirror (forward path, authored now, hosted later)

```js
// three/tsl — gw_aeLight as a node Fn (Maxime Heckel Field Guide, Oct 2025; webgpu_lights_custom 2025)
const gwAeFalloff = Fn(([d2, range, k]) => {
  const invSq = float(1).div(d2.mul(k).add(1))
  const w = d2.div(range.mul(range)).oneMinus().clamp(0, 1)
  return invSq.mul(w.mul(w))
})
const gwAeLight = Fn(([wp, wn, aePos, aePow, aeColor, albedo, k, range, grazeAmt]) => {
  const toAE = aePos.sub(wp), d2 = toAE.dot(toAE)
  const fall = gwAeFalloff(d2, range, k)
  const L = toAE.mul(d2.max(1e-4).inverseSqrt())
  const ndl = wn.dot(L).max(0)
  const graze = mix(ndl, ndl.oneMinus(), grazeAmt)
  const lit = aePow.mul(fall).mul(graze)
  return { fall, graze, lit, diffuse: aeColor.mul(albedo).mul(lit), spill: aeColor.mul(aePow.mul(fall)).mul(0.18) }
})
// bloom reads a dedicated MRT emissive attachment (setMRT) → EXACT selection of the white-gold spill.
```

---

## 5. COHESION — how this binds the one world

- **One light model, three consumers.** `gw_aeLight()` is the single function the basalt green-reveal,
  the Ogham legibility rim, and the caustic divine pool all call. The brief's "ONE causal lighting
  event from one uAEFire/uAEFirePow signal" is satisfied by a literal shared symbol returning shared
  channels — `fall`/`graze`/`lit`/`diffuse`/`spill` — not three look-alike fakes. This *is* the
  E-light-finish-arch cluster's keystone.
- **One signal, one driver, one heartbeat.** `uAEFire`/`uAEFirePow` come from the shared pool `U`
  written by the single `<ForgeDriver/>`, `dt`-damped. A strike surges `uAEFirePow` once and the green
  lifts, the Ogham rises, and the pool brightens **in the same frame** (`00-COHESION-MAP §4.2, §7.6`) —
  the synchrony is the cohesion proof.
- **One palette, one bloom contract.** Every color is `PAL` via `v3()`: `PAL.divine` is the light's own
  white-gold, `PAL.gold` the spill, the serpentine green the colored bounce, `PAL.void` iron-black. Only
  the close, strong spill crosses 1.0, so the shared `mipmapBlur` (`luminanceThreshold ≈ 0.55`) catches
  *exactly* the white-gold divine pool — the palette IS the bloom selector (`§3.1, §7.3`).
- **One light source: the metal/divine fire.** No fill light reveals this stone. `uAmbient` is molten
  spill, `uAEFirePow` is divine fire — both metal-sourced. Cooling *is* the transition from light source
  to lit object; the A/E never cool, so they are the eternal source (`§5, §1.4`).
- **The A/E branch stays hard-separated.** `gw_aeLight` is driven only by `uAEFirePow` (from
  `gw_divineFire`), never `uTemp`. The eternal fire stays white-gold regardless of forge heat; the stone
  it lights warms/cools with ambient `uTemp` independently — exactly the keystone rule (`§1.4`).
- **One noise basis.** The caustic ridge is `gw_caustic` from `shaders.js` at the shared
  `GW_FBM_OCTAVES`; the stone vein the green lifts through is `gw_fbm`/`gw_warp`. The pool's grain is the
  veins' grain is the embers' grain (`§2, §7.2`).

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The transport function is cheap *by design* — it is the part that costs almost nothing; the budget
pressure is the receiver's procedural field (triplanar fbm for basalt, POM for Ogham, ridge for
caustic), not the light. Cost of `gw_aeLight`: one `dot`, one `inversesqrt`, one `dot`, two `mul`, two
`mix`, a clamp — **≈10 ALU ops, no branch, no extra pass, no light list.** Tiering mirrors `useQuality`
(`high | low | static`):

- **`high`:** full `gw_aeLight` (falloff + grazing + colored bounce + spill) on basalt, Ogham, and the
  caustic pool. `dpr` capped 1.5. **`RectAreaLight` ×2** (one per A/E) as a garnish on the *metal-letter*
  materials only — never the stone floor. Chromatic 3-tap caustic. MRT-emissive bloom selection if/when
  WebGPU.
- **`low`:** `gw_aeLight` unchanged (it's free) on basalt + Ogham. **No RectAreaLight.** Caustic drops to
  a single channel (no chromatic split) or off. `dpr` 1.4.
- **`static` / `prefers-reduced-motion`:** freeze `uTime = 2`; hold `uAEFirePow` at a fixed value and
  `uReveal` at a floor (~0.22) so the green-black stone and a dim Ogham still read without live light
  math; no RectAreaLight, no caustic animation; `frameloop='demand'`. The baked-feel still — dignified,
  on-brand, not broken.

Hard rules:
1. **The transport stays analytic on every tier.** It is the one lighting term that runs on `static` and
   the only one that can sample the carving relief to reveal Ogham. Never promote it to a
   RectAreaLight-only mechanism (`00-COHESION-MAP §5.2`).
2. **Compute `gw_aeLight` ONCE per fragment.** The struct return means all consumer channels come from a
   single evaluation — never call it twice (once for green, once for spill). One eval, read `.diffuse`,
   `.spill`, `.graze`, `.lit`.
3. **`uAERange` hard-zeros the pool.** The windowed falloff forces light to 0 at `uAERange` so the divine
   pool is *local* — without it the inverse-square tail dimly lifts the entire floor and wastes bloom
   mip work on a near-black mass.
4. **Bloom catches only the spill.** Keep everything but the close white-gold spill < 1.0 so the
   half-float buffer + `mipmapBlur resolutionScale 0.5` don't mip the dark stone (`§6, §10`).
5. **`RectAreaLight` is `high`-only and letter-only.** Two LTC area lights over a full-screen matte
   basalt floor is a fill-rate trap (`19` §2A); they exist for the letter bounce, not the stone reveal.
6. **`dispose()` + `renderer.info.memory` flat across navigation.** Standard chamber discipline.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

1. **Build `gw_aeLight` and the green-reveal FIRST, as one milestone** (`00-COHESION-MAP §8 Phase-B/7`).
   In the `?debug` leva panel, ramp `uAEFirePow` and prove the green *literally rises from black* — then
   immediately wire the Ogham rim to the *same* call and prove the notches surface on the *same* ramp.
   If the two surface at different intensities, the function isn't shared — fix that before anything else.
2. **World-space, always.** `gw_aeLight`'s falloff and grazing need **world position + world normal**.
   View-space normals make the grazing term swim with the camera and the falloff drift — the single most
   likely silent bug. Set `vWPos`/`vWNrm` in the vertex hook first.
3. **Hook `<color_fragment>` for the receivers, not `<tonemapping_fragment>`.** Basalt/Ogham/caustic
   replace or add to *lit albedo*. The slab's emissive-add hook is `<tonemapping_fragment>` — copy-pasting
   from the slab makes the stone glow like lava instead of being *lit* like rock (doc `10` §7.3).
4. **The A/E source must NOT read `uTemp`.** Wire `uAEFirePow` from `gw_divineFire`/a constant base in the
   driver, never from the temperature signal. If the divine fire dims when the forge cools, the keystone
   is broken (`§1.4`).
5. **Window the falloff or the pool leaks.** A bare `1/(1+d²k)` never reaches zero, so faint divine light
   lifts the whole floor and blooms everywhere. The `(1 - d²/range²)²` window (Filament/Khronos) is
   non-optional — it gives the pool a real edge.
6. **Keep grazing weighted but not total.** `grazeAmt=1` (pure raking) makes front-facing stone vanish;
   `grazeAmt=0` (front-lit) stops carved relief surfacing. 0.55 basalt / 0.8 Ogham / 0.2 caustic are the
   starting balances — tune per chamber camera.
7. **Colored bounce uses the receiver's albedo, not a tint constant.** `aeColor * serpentine` is *why*
   the bounce is green; hardcoding a green tint instead breaks cohesion the day someone re-authors the
   stone color. Pass the real albedo in.
8. **Share the symbol, never copy it.** The Ogham and caustic materials must inline the *same*
   `gw_aeLight` from `shaders.js`, not a hand-copied `1/(1+d²)`. Two copies drift in tuning and the
   cohesion silently breaks (the `02`/`03` "one authority" lesson).
9. **Verify the SwiftShader way then the device.** `qa-route` build-green + 0 console errors @ 393×852
   and 1440×900 (the GLSL compiled). Then the **iPhone-15 OLED read is mandatory** — the green rising
   from true black, the white-gold spill, the bloom on the pool, and the Ogham becoming legible as the
   fire nears do not simulate headless (`shader-fx`, `post-fx`).

---

## 8. SOURCES (2025–2026)

1. **Google — "Physically Based Rendering in Filament"** (maintained reference, 2025–2026 revisions) —
   the canonical real-time **point-light windowed inverse-square** (`getSquareFalloff`) and the
   luminous-intensity convention; the physical basis for `gw_aeFalloff`. Confirmed via the 2025 falloff
   survey (Skyrim Community Shaders inverse-square falloff, Aug 2025).
   https://google.github.io/filament/Filament.md.html
2. **Khronos glTF-Sample-Renderer — "Punctual Lights"** (DeepWiki reference, 2025) — the exact
   `getRangeAttenuation` smooth-windowing function `max(1 - (d/range)⁴, 0)² / d²` and the
   `intensity·color·attenuation·N·L` composition that `gw_aeLight` mirrors and clamps for the divine pool.
   https://deepwiki.com/KhronosGroup/glTF-Sample-Renderer/12.3-punctual-lights
3. **Skyrim Community Shaders — "Inverse Square Lighting"** (Nexus mod page, updated Aug 2025) — a 2025
   real-time implementation of inverse-square falloff with intensity/size/cutoff per light fading
   smoothly to a cutoff; corroborates the windowed-falloff-with-hard-cutoff pattern used here.
   https://www.nexusmods.com/skyrimspecialedition/mods/153542
4. **Codrops — "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js"** (Mar 23, 2026) — the
   Fresnel/grazing term piped into the **emissive channel so dark surfaces glow only at grazing edges**,
   near-black core to bright edge mix, and a `smoothstep` fade-to-black — the direct reference for "dark
   by default, light only where raked" that the grazing term and the green-lift band implement.
   https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
5. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (Oct 2025) — `Fn()` as the function-reuse
   primitive and `setMRT`/emissive attachment for **exact selective bloom** of the white-gold spill (vs
   luminance thresholding); the TSL-portable target for `gw_aeLight` and the bloom-selection forward path.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
6. **Three.js — `webgpu_lights_custom` custom lighting-model example** (r17x, 2025) — defining a custom
   lighting model and `getDistanceAttenuation` as composable nodes; reference for the TSL mirror and the
   `high`-tier RectAreaLight garnish.
   https://threejs.org/examples/webgpu_lights_custom.html
7. **Three.js — RectAreaLight (LTC) docs + `RectAreaLightUniformsLib`** (r17x docs, 2025) — the
   Linearly-Transformed-Cosines area light (SIGGRAPH 2016), its WebGLRenderer init, and the no-shadow /
   per-pixel-cost caveats that confine it to a `high`-tier, letters-only, ≤2-instance garnish.
   https://threejs.org/docs/pages/RectAreaLight.html
8. **Maxime Heckel — "Shining a Light on Caustics with Shaders and React Three Fiber"** (re-surfaced via
   the 2026 three.js water ports) + **martinRenou/jeantimex `threejs-water`** (modified 2026, arbitrary
   geometry + caustic shadows) — the differential-area caustic intensity and chromatic-offset colored
   caustic the divine-pool consumer multiplies onto the floor, gated by `gw_aeLight`.
   https://blog.maximeheckel.com/posts/caustics-in-webgl/ · https://github.com/jeantimex/threejs-water
9. **Codrops — "Susurrus: Crafting a Cozy Watercolor World with Three.js and Shaders"** (Apr 24, 2026) —
   a `uProgress` reveal shader + NPR low-value stylization as both aesthetic and perf discipline; the
   reveal-as-one-scalar × smoothstep pattern the green-lift band uses.
   https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/
10. **Osborne & Sannikov — "Radiance Cascades" / "Holographic Radiance Cascades for 2D GI"** (arXiv,
    2024–May 2025) — the modern real-time one-bounce/color-bleed GI reference whose *insight*
    (`lightColor · surfaceAlbedo` colored bounce) justifies the analytic `o.diffuse = aeColor·albedo`
    term, while its full machinery stays out of the mobile budget.
    https://arxiv.org/pdf/2505.02041
11. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026) — `onBeforeCompile`
    variant cost, `<Detailed>` LOD, the fill-rate-not-triangles framing the mobile budget here is held
    to. https://www.utsubo.com/blog/threejs-best-practices-100-tips
12. **Three.js Roadmap — "TSL: A Better Way to Write Shaders in Three.js"** (2025) — node reuse as the
    explicit replacement for fragile `.replace()`/`onBeforeCompile` injection; rationale for authoring
    `gw_aeLight` TSL-portable now. https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The colored-bounce two-term split vs. a real one-bounce probe.** Whether the analytic
   `aeColor·albedo` diffuse + `aeColor` spill split holds up against the close, oblique altar camera, or
   whether a single tiny irradiance probe at each A/E (baked once, modulated by `uAEFirePow`) reads
   visibly richer — the exact threshold where the cheap split stops convincing and the probe earns its
   keep on `high`.
2. **Grazing-to-relief coupling — `gw_aeLight.graze` × POM groove depth.** The precise math tying the
   grazing boost to the Ogham's POM-sampled groove depth so notches surface *harder* than flat stone in
   the same divine light, on a clamped mobile POM budget — the term that makes the carving "pop" out of
   the green at the moment of reveal (the candidate doc `10` §9.1 also names).
3. **The nearest-A/E selection + multi-emitter blend.** How `<ForgeDriver/>` picks `uAEFire` when both
   the A and the E are in frame (the wordmark has two divine letters): a single nearest, a 2-light max
   accumulation, or a weighted blend — and how the pool reads when the camera frames both at once without
   doubling the per-fragment cost.
4. **MRT emissive bloom selection for the white-gold spill (the WebGPU port).** Replacing the
   luminance-threshold bloom with a dedicated `setMRT` emissive attachment so the divine pool and spill
   bloom *exactly*, and how `gw_aeLight` as a `Fn()` plugs into `material.outputNode`/`emissiveNode`
   (Maxime Heckel Field Guide pattern) — the forward path when the forge moves to `WebGPURenderer`.
