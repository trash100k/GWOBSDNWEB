# 00 — THE COHESION MAP

_GAELWORX forge-world graphics · master architecture · the single document that fuses all 33 Phase-1
topics into ONE coherent, buildable world._

> **Read this before any other graphics doc.** The 33 Phase-1 docs each answer "how do I build the
> molten metal / the basalt / the bloom / the camera?" This document answers the only question that
> makes them a *world* and not 33 effects: **what is the single system they all share, and how does
> every element bind to it so nothing looks bolted-on?** It is the Technical Director's contract. Every
> downstream doc, every Phase-2 deep-dive, and every line of shipped shader is held to the systems
> defined here. The companion `00-INDEX.md` is the annotated map of the 33 source docs and the reading
> order; this is the synthesis.

---

## 0. THE THESIS IN ONE PARAGRAPH

GAELWORX is a Middle-Earth-meets-true-Gaelic **giant dwarf forge** rendered in React + react-three-fiber +
three.js, on **one** WebGL renderer, route-swapped into eight-plus "chambers," cinematic to an
Active-Theory / Lusion / Unseen caliber, and it has to hold 60fps on an **iPhone 15 OLED**. The entire
illusion rests on a single engineering decision repeated everywhere: **there is exactly one of each
shared system, and every element reads from it rather than inventing its own.** One renderer. One scroll
clock. One temperature signal. One noise basis. One palette. One tone-map and grade. One bloom contract.
One lighting model (the metal is the only light). One camera. When the molten metal, the cooling
letterforms, the basalt, the forged iron, the sparks, the heat-haze, the channels, the Ogham, the
caustics, the god-rays, and the divine-fire **A** and **E** all sample the *same* functions at *different*
inputs, they read as **one substance at different points on one cooling timeline, lit by one fire**. The
moment any element forks its own orange, its own noise, or its own clock, the world fractures into a
collage. This document specifies the shared systems and the binding rules so it never does.

The brand law that anchors the whole world: every poured letter cools through the temperature ramp
white-hot → orange → forge-red → iron-black **except the first `A` and first `E`**, which hold unearthly
white-gold "divine fire" forever and radiate light onto adjacent basalt to make carved Ogham readable.
That single exception — the 3D embodiment of the DOM `.forge-letter` ignite rule from `CLAUDE.md` — is
expressed everywhere as "the same system, with the A/E clamped." It is the keystone, not a bolt-on.

---

## 1. THE MASTER TEMPERATURE SYSTEM (the spine of the world)

Temperature is the one signal that drives emissive **color**, emissive **intensity**, **cooling**, bloom
gating, heat-haze strength, spark color, caustic tint, god-ray brightness, and the divine-fire exception
— **everywhere, from one authority.** It has two halves: a spatial/color half (owned by topics
01/02/04) and a temporal/cooling half (owned by topic 03). They meet in two pure GLSL functions that live
beside `GLSL_NOISE` in `src/scene/shaders.js` and are inlined into every hot material via the existing
`onBeforeCompile` chunk-injection pattern.

### 1.1 One temperature→color function

The canonical function turns a scalar `temp ∈ [0,1]` (0 = iron-black/cold, 1 = white-hot) into HDR linear
RGB, following the **Planckian-locus hue ordering** (red → orange → yellow → white as it heats) but landing
the stops on the **brand `PAL` ramp** rather than on physically-exact muddy blackbody triplets. This is the
deliberate hybrid of the closed-form Planckian-locus approximation (MaterialX `mx_blackbody`) and the
Unity-Blackbody-node curve fit, snapped to art direction:

```glsl
// ONE temperature→color authority. Monotonic hue march, brand-anchored stops, overlapping smoothstep
// bands (no plateaus, no seams). Cold band < 1.0 (true black on OLED, no bloom); hot band > 1.0 (blooms).
vec3 gw_tempColor(float temp){
  float t = clamp(temp, 0.0, 1.0);
  vec3 ironBlack = ${v3(PAL.void)};        // 0.00  cold iron, near-void
  vec3 dullRed   = ${v3(PAL.crimsonDeep)}; // 0.22  first dull red
  vec3 forgeRed  = ${v3(PAL.crimson)};     // 0.45  Celtic Blood #C1292E
  vec3 ember     = ${v3(PAL.ember)};       // 0.66  Ember Glow #E85D04
  vec3 gold      = ${v3(PAL.gold)};        // 0.85  HDR shoulder
  vec3 whiteHot  = ${v3(PAL.hot)};         // 1.00  PAL.hot (HDR > 1 → blooms)
  vec3 c = mix(ironBlack, dullRed,  smoothstep(0.00, 0.22, t));
  c = mix(c,             forgeRed,  smoothstep(0.18, 0.45, t));
  c = mix(c,             ember,     smoothstep(0.42, 0.66, t));
  c = mix(c,             gold,      smoothstep(0.64, 0.85, t));
  c = mix(c,             whiteHot,  smoothstep(0.82, 1.00, t));
  return c;
}
```

### 1.2 One temperature→intensity function

Hue and brightness are kept **separate** so the single knob (`temp`) controls bloom for free. Brightness
follows a tamed Stefan–Boltzmann curve (`T⁴` softened to ~`T³`) so only the hottest band exceeds 1.0:

```glsl
float gw_tempEmissive(float temp){           // cold ≈ 0 (no bloom), hot pushes > 1 (blooms)
  float t = clamp(temp, 0.0, 1.0);
  return pow(t, 3.0) * 2.6 + t * 0.12;       // small linear floor so warm iron still reads
}
vec3 gw_forge(float temp){ return gw_tempColor(temp) * gw_tempEmissive(temp); }
```

### 1.3 The cooling clock (the temporal half)

Per-fragment cooling runs off **one scalar: `age` (seconds since this point received metal)**, mapped
through an eased normalized cooling curve, identical to the dissolve-threshold data structure but used to
*cool* rather than cull. `age` is derived **analytically** from a left-to-right fill front (`uFillFront`
vs a UV/arc-length coordinate) so the hero needs **no GPGPU ping-pong** on mobile:

```glsl
float gwCool01(float age, float uCoolRate){ return pow(clamp(age * uCoolRate, 0.0, 1.0), 0.7); }
// T: 0 = white-hot, 1 = iron-black. Hot phase lingers, then drops fast.
```

The cooling system also owns: **frozen flow ripples** (warp phase locked at `poured = uTime - age` once a
fragment solidifies — molten regions keep `uTime`, solid regions swap to `poured`, one `mix()` branch); a
**crust skin** (noise-thresholded matte layer that creeps in as `age` rises, the thin transition band is
the glowing cooling front); and **ember veins** (high-frequency ridged fbm that crack the skin and glow
through, floored so they **never die to black** — the "metal is alive" law).

### 1.4 The divine-fire exception (the keystone)

The A/E never read the temperature signal. A per-letter `uIsAE` flag routes them through a separate locked
path — `gw_divineFire(flick)` returns white-gold HDR that **ignores `uTemp` and never cools**:

```glsl
vec3 gw_divineFire(float flick){             // unearthly white-gold, eternal, always blooms
  return ${v3(PAL.divine)} * (1.0 + flick * 0.18);   // PAL.divine = HDR, whiter+brighter than molten hot
}
// In any hot material:  metal = mix(gw_forge(temp), gw_divineFire(flick), uIsAE);
```

This is the single most important code path in the build. **The A/E must never reach `uTemp`** — keep the
branch hard-separated or you break the brand's central rule. The same two letters that ignite in the DOM
wordmark glow in the metal forever; same concept, two renderers.

### 1.5 The shared driver and socket

There is exactly **one source of "how hot is the forge right now"**: the `forge` store
(`src/store.js`) computes `scrollDamped + scrollVel*0.25` plus a strike pulse, and a single per-frame
writer (`<ForgeDriver/>`, mounted once in `ForgeCanvas`) damps the master uniforms toward it. Every hot
material binds the *same uniform references* (not clones) in `onBeforeCompile`, so one writer drives the
whole world. Per-letter `temp[]` arrays, spark proximity, and channel fill all derive their local `temp`
from this one signal, `dt`-damped via `THREE.MathUtils.damp` — never frame-rate `lerp`, never a second
rAF. (Topics 02/03/31; perf gate topic 29.)

---

## 2. THE SHARED NOISE BASIS (one well, every effect drinks from it)

Noise is not "an effect" in GAELWORX — it is the **substrate every effect samples**. Molten flow, the pour
front, cooling crust, ember veins, basalt grain, heat-haze, smoke, sparks, caustics, and channel carving
are all the **same handful of `gw_`-namespaced GLSL functions** in `src/scene/shaders.js`, read at
different scales/warps/time-rates. The repo already ships the seed (`gw_snoise`, `gw_fbm`, `gw_caustic`);
the master toolkit grows it **additively** so the obsidian slab keeps compiling unchanged. (Topic 10.)

The complete shared toolkit:

- **`gw_snoise` / `gw_snoise3`** — 2D and 3D simplex (isotropic, no axis-streaks; cheap analytic gradients
  feed curl). The default primitive.
- **`gw_fbm` / `gw_fbm3`** — fractal Brownian motion, **3 octaves on `high`, 2 on `low`/`static`** via a
  compile-time `#define GW_FBM_OCTAVES`, with a small 2×2 rotation between octaves to kill residual
  axis-alignment. This single define is a **cohesion hinge**: dropping a tier thins *all* procedural detail
  uniformly so nothing looks selectively broken (topic 29 §4.7).
- **`gw_warp`** — IQ two-level domain warp `fbm(p + fbm(p + fbm(p)))`, parameterized so the **molten** uses
  two warp levels (churning, folding, *thick*) and the **basalt veins** use one (cheaper). The single term
  that most makes metal read as viscous, not scrolling.
- **`gw_flow`** — per-octave flow noise (advected FBM, mixes back to a slowly-advancing base point with
  `ADVECTION ≈ 0.77` so it can't diverge). The "real lava churning" upgrade; octave-LOD'd 4/2 by tier.
- **`gw_worley`** — F1/F2 cellular for cooling-crust crack networks and bubble nucleation. **High-tier
  only** (a 3×3 cell search is the most expensive primitive here).
- **`gw_curl3`** — analytic-derivative 3D curl (3 evaluations, not 18) for divergence-free spark/smoke
  advection; integrated over 4–8 substeps (`p += curl·dt`), never used as raw displacement.
- **`gw_caustic`** — domain-warped fbm with `pow(1 - abs(fbm), 4.5)` ridges = the focused bright filaments
  caustics are made of. Already in the repo header for exactly this purpose.

**The binding rule:** if a new element needs "more detail," add an octave to `gw_fbm` — never fork a second
noise. A bare `permute`/`snoise` collides with three's built-in chunks; everything stays `gw_`-prefixed.
The animation must **boil in place** (time-as-3rd-dimension or animated warp offset), never **scroll**
(time added to a coordinate slides the texture and reads thin/fake).

---

## 3. THE SHARED PALETTE + OLED TONE-MAP/GRADE (one film stock)

### 3.1 The palette and the HDR convention

Every color in the world comes from `src/scene/palette.js` `PAL`, inlined via the `v3()` GLSL helper —
**no raw hex anywhere.** The Industrial-Metallurgy set (Celtic Blood `#C1292E`, Ember Glow `#E85D04`,
Forged Iron void `#0B0C10`, Cold Steel `#1F2833`, Fog White `#F1F2F6`, Ash `#8D99AE`), held at a 60/30/10
discipline: **60% void** dominates, **30% deep-crimson** is the mass, **10% ember-gold** is the accent.

The load-bearing rule that ties color to bloom and lighting: **only the ~10% accent band exceeds 1.0**
(`PAL.hot`, `PAL.emberHot`, `PAL.gold`, `PAL.divine`). Cold iron, basalt, and the deep crimson mass all sit
≤ 1.0 and **never bloom**. This is not a coincidence — it is *why* threshold bloom works as selective
bloom for free (§5), *why* heat-haze and god-rays can key off the same luminance, and *why* the void stays
true black on the OLED. The palette **is** the bloom selector, the heat mask, and the light source list, all
in one convention. (Topics 02/04/20/21; brand source `CLAUDE.md`.)

### 3.2 The tone-map (the make-or-break decision)

Tone mapping is set **once**, on the renderer (`gl.toneMapping`), never also as a composer pass (double-grade
washes blacks and over-saturates fire). Two operators are in play:

- **AgX** is the recommended hero/high+low operator. Its **graceful path-to-white** (it transforms into a
  wider gamut, curves there, maps back) bleaches hot warm content to a *hue-stable* white-gold instead of
  ACES's brightness-driven orange-skew-then-clip. This directly serves the divine-fire brief and protects
  Celtic Blood from clipping to flat salmon on the P3 OLED. Its cost — AgX reads soft/flat by default — is
  paid back with the existing grade (more contrast, more saturation, re-tuned *for AgX*, not left at ACES
  values).
- **ACES Filmic** (the current renderer setting) is the conservative fallback. Its white-out *is* the
  white-hot and its toe crushes the void; its hue-shift is the documented risk for a saturated-red world.
  If AgX is unavailable in a pinned version, fall back to ACES **with the original grade values**.
- **Khronos Neutral** is the static-tier floor and the color-accuracy truth-meter (flip to it for one frame
  to verify the brand red is actually `#C1292E`).

The two color-science docs (04 ACES-as-cooling-gradient, 21 AgX-as-divine-fire) reach different default
operators; the resolution is: **the operator is a Phase-2 look-dev A/B on the device** (a named deep-dive),
but the *structure* is locked now — one operator on the renderer, the grade re-tuned to it, no pass.

### 3.3 The grade and the OLED dither

After tone-map: a warm `HueSaturation` (+0.12 ACES / +0.18 AgX), crushed-black `BrightnessContrast`
(`brightness ≈ -0.04 / -0.05`, `contrast ≈ 0.16 / 0.22`) so the void maps to pixels-off black, a neutral
vignette, and a **whisper of animated film grain** (`SOFT_LIGHT`, opacity ≈ 0.035–0.05). The grain does
double duty as **OLED triangular dither** — it kills the 8-bit banding that the dark void→crimson gradient
shows on a true-black panel, so it must **never drop below ~0.03 even on low**. An optional **forge-look
3D LUT** (32³ `.cube`, high-tier only, hue/sat/contrast only — *no* tone curve, AgX already rolled the
highlights) bottles the authored mood and cross-fades per route. **No cool/green/blue ever enters the
grade** (brand law) — the basalt's green lives in the *material*, never the post. The black point of any
LUT must be forced to `(0,0,0)`. (Topics 20/21.)

---

## 4. THE SINGLE-RENDERER MULTI-CHAMBER SCENE GRAPH + MASTER UNIFORMS

### 4.1 One context, route = preset swap

Exactly **one** `THREE.WebGLRenderer` (one `<Canvas>` in `ForgeCanvas.jsx`), mounted once by the persistent
React-Router layout, that **never tears down on navigation**. Routes do not mount new WebGL contexts (the
anti-pattern that exhausts the ~8-16 context cap, stalls mobile for hundreds of ms, and makes cohesion
literally impossible — two contexts cannot share a uniform). Instead, each route **re-tempers a shared
scene** by damping a small preset table (`scenes.js`: `veinScale`, `veinGlow`, `irid`, `camZ`, `rotY`,
`rotX`, plus new fields below) toward the active chamber. The persistent obsidian slab is the **back wall
of every chamber** — the world never goes empty between routes. (Topic 31; reference validation topic 32.)

### 4.2 The Master Forge Uniform pool

The cohesion mechanism is concrete: a **single shared uniform pool** (`src/scene/forgeUniforms.js`,
`export const U`) whose references are assigned into *every* chamber material via
`Object.assign(shader.uniforms, U)` in `onBeforeCompile`. Mutating `U.x.value` updates every material at
once — true cohesion, zero drift. The pool:

| Uniform | Meaning | Driven by |
|---|---|---|
| `uTime` | clock seconds (frozen to `2` on `static`) | `state.clock`, the one writer |
| `uTemp` | 0..1 master **temperature** (scroll-driven forge heat) | `scrollDamped + vel*0.25` |
| `uHeat` | 0..1 transient **heat** pulse (strike + scroll velocity) | strike `exp(-since*3)` + `vel` |
| `uScroll` | 0..1 damped scroll progress | `forge.scrollDamped` |
| `uPointer` / `uPointerOn` | uv-space pointer + presence | `forge.pointer*` |
| `uPourFront` (vec3 + scalar) | moving pour-front world pos + arc coord | journey/fill timeline |
| `uVeinScale` / `uVeinGlow` / `uIrid` | per-route look, damped to `sceneFor(route)` | scene preset |
| `uAEFire` (vec3) / `uAEFirePow` | nearest divine-fire position + intensity | A/E letterforms |

One headless `<ForgeDriver/>` is the **sole author** of this pool (moved out of the slab's `useFrame` so the
pool is driven even on routes whose hero is the jewel, not the slab). The slab, the jewel, the channel
metal, the letterform fill, the basalt, the Ogham, the sparks, and the caustics all bind the *same* `U`.
Result: scroll into the casting-room and the slab, jewel, channels, letters, and Ogham **all heat together
from one float** — the definition of "shares uniforms so nothing looks bolted-on."

### 4.3 Route-gated bespoke chamber meshes (with disposal)

Beyond the shared slab, four routes earn a bespoke hero, gated on `forge.route` and **mounted/unmounted
with React** so the disposal effect fires (`useEffect(() => () => { geo.dispose(); material.dispose() })`).
Per topic 33, each is "the forge through a different aperture," binding the same `U`:

| Chamber | Route | Bespoke element | Technique (no extra passes on mobile) |
|---|---|---|---|
| scrying-**pool** | `/voice` | still water + sub-surface ember | sine-vertex + fake SSS in fragment, no FBO |
| casting-room | `/software` | the live pour + molten surface | `gw_warp`+`gw_flow` molten material |
| channel-hall | `/automations` | top-down Celtic interlace | analytic-SDF carved channels |
| **jewel**-chamber | `/web` | faceted gem dispersion | single-pass cos-split (3-tap RGB on `high`) |
| altar-approach | `/about` | the source + Ogham reveal | basalt + AE radiance + carved engraving |
| stone-**ledger** | `/pricing` | Ogham verse up the edge | basalt + Ogham bands |
| four-**plinths** | `/work` | cooled casts, gallery lit | `buildGem` casts + Lightformer keys + `ContactShadows frames={1}` |
| forge-mouth **arch** | `/contact` | white-hot mouth radiating | extruded arch + additive mouth + redirected Embers |

`renderer.info.memory` must be **flat across navigation** — if `geometries`/`textures` climb on each nav, a
chamber mesh isn't disposing. Peak memory is `backdrop + one chamber`, never `backdrop + eight chambers`.
`<View>` (drei scissoring) is reserved for the genuinely tiled four-plinths route; a portal-FBO crossfade
is reserved for one or two marquee room transitions — both in the toolbox, neither the everyday swap.

---

## 5. THE LIGHTING MODEL (the metal is the only light)

The world is **pure-void darkness lit ONLY by the metal itself** — no sky, no sun, no fill. This is a
strength the studio references (Lusion/Unseen) confirm, not a limitation; do **not** add fill light to "fix"
darkness. The lighting model has three layers:

### 5.1 Emissive-as-light (the molten, cooling, sparks)

Every hot surface is **the light source**, not a lit object. It outputs radiance > 1.0 (HDR) for its hot
band via `gw_forge`/`gw_divineFire`, added **before** `#include <tonemapping_fragment>` so ACES/AgX
processes it. The "push color out of 0–1, only >1 blooms" discipline (topic 04) means temperature *controls
bloom for free* — no per-effect bloom tuning, no SelectiveBloom pass (the palette *is* the selection). The
sparks (`Embers.jsx` + the GPGPU pour-front orbiters of topic 15) are literally cooling metal droplets:
each samples `gw_forge(sparkTemp)` where `sparkTemp` rides high near the pour front and decays as it drifts.

### 5.2 The A/E divine radiance (the signature beat)

The single most narratively-loaded lighting moment: the eternal white-gold A/E **spill light onto adjacent
stone** and **reveal carved Ogham for the first time**. This is *not* a bolt-on light — it is a shared
`uAEFire`/`uAEFirePow` signal (the A/E letterform position + intensity) that **every receiver material
reads**:

- The **basalt** lifts its serpentine Connemara green out of black where the AE light lands (`reveal =
  uLightAmt + uAEFirePow`), and the same value casts a white-gold spill (topic 05).
- The **Ogham** becomes legible: a light-gated rim on the groove lips keyed to `dot(carveNormal, toAE) ·
  uAEFirePow` (topics 25/26).
- The **caustic** divine-fire preset throws a tight, calm, white-gold pool (topic 23).

The mechanism of record is a **cheap in-shader proximity/grazing term** (the only approach that runs on
`low`/`static` and that can *sample the carving's relief* to brighten groove walls), with `high`-tier
RectAreaLights (capped at **2**, one per A/E, touching only the metal-letter materials — RectArea has no
shadows and is per-pixel expensive) and an optional **baked emissive-AO lightmap** for the static stone
spill once geometry is frozen. The reveal **cannot be baked alone** — its live half must be
`f(uAEFirePow, grazing)` so the Ogham literally rises from black as the divine light approaches. (Topics
19/05/25/26.)

### 5.3 Procedural IBL (the reflections, no EXR)

Reflective surfaces (the polished obsidian slab `roughness 0.05`, the faceted jewel `envMapIntensity 2.2`)
read off an **environment map synthesized at runtime** — **never a loaded EXR/HDR** (the cardinal scar:
EXR fetches suspend, throw, blow the bundle, stall first paint). A unified `<ForgeEnvironment>` bakes once
via PMREM from drei `<Lightformer>` shapes + an optional procedural warm-gradient sphere: a **cool key**
(the clean specular streak — the validated look that avoids the "orange band across the glass" scar) over
a **dim warm forge fill on the lower hemisphere only** (welling heat, no band). `frames={1}` (bake once,
never `Infinity` on mobile). The *animated* reflection coupling lives on the materials — `envMapIntensity`
/ `scene.environmentIntensity` ride `uTemp`+`uHeat` so reflections brighten on the same heartbeat as the
fire, with no re-bake. The env is **reflection-only**, never the skybox (the world is pure void). (Topic
22.)

### 5.4 Atmosphere (god-rays, smoke, heat-haze)

The metal's light gets *body* through the air: cheap radial-blur god-rays seeded from the brightest
emissive cluster (cone proxy so they survive the source drifting off-frame), blue-noise dithered to drop
step count without banding; fBM smoke banks + depth-fog haze tinted by `uTemp` (cold smoke = void, hot
smoke = ember, with wavelength-dependent absorption `exp(-d·σ·vec3(1,1.6,2.4))` so light through it is
always forge-colored); and screen-space heat-haze UV-warp masked by the same HDR luminance bloom uses.
All read `uTemp`/`uHeat`; all gate to `high` (raymarch volume, full god-ray) / `low` (cheap forms) /
`static` (depth-fog only, frozen). (Topics 17/18/16/23.)

---

## 6. THE LAYERED POST-FX ORDER (one composer, one finish)

Exactly **one** `EffectComposer` over the one renderer, with `frameBufferType={HalfFloatType}` so the >1
emissive we worked to create survives into bloom instead of being clamped at 1 in an 8-bit buffer (the #1
silent bug). The pmndrs `EffectPass` **merges** all compatible effects into one fragment shader / one
fullscreen pass, which is the load-bearing reason the chain is affordable on mobile (only bloom, DOF, and
SMAA are separate passes). The **load-bearing order**:

```
HeatHaze → DepthOfField → GodRays → Bloom → ChromaticAberration → HueSaturation
  → BrightnessContrast → Vignette → Noise(grain) → SMAA   [tone-map on renderer, terminal]
```

The logic (validated against the False-Earth / Shader.se 2026 chains): **lens physics first** (heat-haze
warp + DOF defocus operate on the raw depth-sorted scene), **then light** (god-rays + bloom bloom the
*already-warped, already-defocused* hot pixels — soft disc + soft halo = the filmic heat read), **then
grade** (CA, vignette), **then grain** (dither on the composited frame), **then AA**, **then tone-map**
(once, on the renderer). Getting this wrong — DOF after bloom, or haze after bloom — smears glow with the
air or leaves sharp bloom rings inside soft areas, and reads as a bug.

`mipmapBlur` bloom (`luminanceThreshold ≈ 0.55–0.6`, `resolutionScale 0.5`) is the cheap wide
mobile-correct kernel; reject `UnrealBloomPass` (breaks the merge) and `SelectiveBloom` (extra render, the
palette already selects). Heat-haze and god-rays declare `EffectAttribute.CONVOLUTION`/their own pass and
must sit before bloom. The lens (DOF via `worldFocusDistance` locked to the pour-front — *not* the flaky
`target` prop — with `TiltShift2` as the low-tier substitute) and the camera fov/dolly-zoom read the same
`forge.focusDist`/`pourFront` the world uses, so **the metal that is hottest is the metal in focus**.
(Topics 20/21/16/18/28.)

---

## 7. THE CROSS-ELEMENT COHESION RULES (the binding contract)

This is the checklist that keeps 33 effects reading as one world. Every element, without exception:

1. **Reads the master temperature, never invents heat.** Color from `gw_tempColor`/`gw_forge`, cooling from
   `gwCool01`, divine-fire from `gw_divineFire`. The slab's veins, the molten pour, the channel metal, the
   cooling letterforms, the cold forged-iron skin, the sparks, the basalt heat-staining, the caustic tint,
   the god-ray color, the heat-haze mask, and the smoke absorption are all functions of one `uTemp`/`uHeat`.
   A cooling letter and a cooling vein are *visibly the same metal* because they sample the same curve.

2. **Reads the shared noise, never forks it.** All sample `gw_fbm`/`gw_warp`/`gw_caustic`/`gw_curl3` from
   `shaders.js` at the *same* `GW_FBM_OCTAVES`. A vein leaving the slab and entering a channel uses one
   noise basis; the air's wobble is the same grain as the metal's flow; spark motion shares the veins'
   spatial frequency. "More detail" = one more octave, never a second noise.

3. **Uses only `PAL`, inlined via `v3()`.** No raw hex. The 60/30/10 holds. Only the 10% accent (`PAL.hot`/
   `emberHot`/`gold`/`divine`) exceeds 1.0 and therefore is the *only* thing that blooms, the *only* heat
   that the haze/god-ray mask catches, and the *only* light in the void.

4. **Is lit only by the metal.** No fill light. Emissive surfaces output radiance; opaque surfaces (basalt,
   forged iron, plinths) are *lit* by `uAEFire`/`uLightAmt`/proximity terms and reflect the cool procedural
   env. Cooling *is* the transition from "light source" to "lit object." Reflections come from one PMREM env,
   never an EXR.

5. **Clamps the A/E to divine fire — the one exception, expressed identically everywhere.** The DOM
   `.forge-letter`, the 3D wordmark `uIsAE`, the basalt reveal, the Ogham legibility, the caustic preset, the
   spark emitters, and the god-ray pair all key off the *same* "first A + first E per word" rule (computed at
   build time as data, never a fragile string match in a shader). The same letters ignite in prose and in
   metal and are the light that reveals the lore.

6. **Shares one clock and one rAF, `dt`-damped.** Every uniform animates via `damp(cur, tgt, λ, dt)` from
   the `forge` store in the one `useFrame` writer. No `setInterval`, no `lerp(a,b,k)`, no competing rAF.
   Freeze `uTime` to a constant on `static`. A strike (`forge.strikeAt`, `exp(-since*3)`) surges the slab
   veins, the jewel edges, the pour band, the sparks, the god-ray weight, the caustic, and the bloom
   intensity **in the same frame** — that synchrony is the cohesion proof.

7. **Obeys one bloom contract and one grade.** Pre-tone-map emissive add, half-float buffer, threshold
   bloom, the merged grade pass, grain-as-dither. No per-element bloom pass, no per-route post tweak (route
   mood is a LUT cross-fade or a `scenes.js` preset, never a different composer).

8. **Shares the channel curve data three ways.** The hand-authored Celtic-interlace arc-length curves are
   the single source of truth for the **channel geometry** (the carved SDF groove), the **pour flow**
   (advection + front position), and the **spark orbit path**. One knot, consumed three ways — the contract
   that keeps fill, weave, and depth from drifting.

9. **Degrades uniformly, never selectively.** A tier drop thins *all* detail (`GW_FBM_OCTAVES`), drops
   passes/particles together, never recolors or restructures. The `static` tier is a dignified, on-brand
   frozen still (warm veins on true-black void), not a broken fallback.

The single failure mode the whole document guards against: **a new element with its own orange, its own
noise, or its own clock.** That is the crack that makes it look bolted-on. Everything asks the same
functions "what does metal at temperature `t` look like, in this world's grain, in this palette, lit by
this fire, on this heartbeat?"

---

## 8. THE BUILD SEQUENCE (each layer de-risks the next)

The order is not arbitrary — each layer is the foundation the next is verified against, and the hardest-to-
retrofit things (the shared ramp, the cohesion lock, the divine-fire path) come first. Every step is
verified the repo way: `npm run build` green → `qa-route` at 393×852 + 1440×900 with **0 console errors**
(SwiftShader compiles the GLSL in CI, so a shader typo surfaces as an error) → **then the iPhone 15 OLED
read** (bloom spread, true-black, OLED saturation, the divine-fire white-gold do **not** simulate headless).

**Phase A — the spine (no look ships until this is right):**
1. **The master temperature functions**, in isolation, in `shaders.js` (`gw_tempColor`, `gw_tempEmissive`,
   `gw_forge`, `gwCool01`, `gw_divineFire`). Wire *only* the existing slab's veins to `gw_forge`; tune the
   six stops *through the tone-mapper on the device* (the #1 first-build mistake is authoring for the raw
   value, not the ACES/AgX output). The ramp is load-bearing everywhere — get it right before any consumer.
2. **The shared uniform pool** `U` + `<ForgeDriver/>`; repoint the slab and jewel to bind `U`. Confirm `/`
   is byte-identical. This makes cohesion *structural*, not retrofitted.
3. **The noise toolkit grows** (`gw_snoise3`, `gw_fbm3`, rotated `gw_fbmR`, `gw_warp`, `gw_worley`,
   `gw_curl3`) with the `GW_FBM_OCTAVES` define + tier gate. Land the primitives + compile-green before any
   look.
4. **The OLED tone-map/grade decision** (operator on the renderer, grade re-tuned to it, grain-as-dither,
   half-float composer buffer). The void must be pixels-off black on the panel and the brand red vivid.

**Phase B — the substance:**
5. **The molten surface material** (`gw_warp`+`gw_flow`, tension-skin plateau, boil bulge, hot-rim Fresnel)
   — slow it down *first* (the failure mode is "thin glowing water"), ramp second, skin third, flow last.
6. **The cooling system** (per-letter `age`, crust skin, ember veins, frozen ripples) and the **divine-fire
   exception** — stamp A/E early and verify they stay white-gold while neighbors cool (catch masking bugs
   before they hide under skin).
7. **Basalt + forged iron** (procedural green-black, the AE green-reveal as the first visible milestone,
   anisotropic fire-scale, ember veins under the cold skin) — `computeTangents()` before anisotropy.

**Phase C — the journey of the metal:**
8. **3D Cinzel letterforms** (SVG→ExtrudeGeometry or MSDF) + **progressive fill** (`uFillFront` vs a
   per-glyph layout-U, the meniscus band, per-letter cooling) — own the UVs in the shader, not
   ExtrudeGeometry; first A + first E `uIsAE` as baked data.
9. **The Celtic-interlace channels** (hand-authored knot → arc-length curves → carved SDF groove, strict
   over/under, four-fork `smin`) and the **pour** (baked flow-map advection, two-sample cross-fade, the
   white-hot front, channel→letter handoff sharing one clock).
10. **The camera journey** (CatmullRomCurve3 sampled by arc-length at `scrollDamped` + Lenis input,
    look-ahead down the flow, journey↔chamber blend so navigation travels not cuts) and the **lens** (fov
    per route, finale dolly-zoom, focus locked to the pour-front).

**Phase D — the atmosphere and the finish:**
11. **Sparks/embers** (GPGPU pour-front orbiters on `high`, CPU points on `low`, `<Sparkles>` on `static`),
    **heat-haze**, **smoke/haze**, **god-rays**, **caustics on stone** — each reads the shared `uTemp`/
    `uPourFront`, each tier-gated.
12. **Ogham + carved engraving** (procedural SDF strokes, derivative-bump carve everywhere, clamped POM on
    `high` close-oblique chambers, the AE-gated reveal) — the sacred payoff, built last because it lights
    the lore the rest of the world establishes.
13. **The per-chamber bespoke heroes** (pool, jewel dispersion, plinths, arch) as `scenes.js` configs +
    route-gated meshes binding `U`, one at a time, each with disposal + QA + a `renderer.info.memory` check.
14. **The post-FX finish + the choreography pass** — stagger pour/fill/camera/strike into one Brutalist-Snap
    beat; full grade, god-ray, DOF on `high`; verify the static tier still reads cinematic.

**The perf budget (topic 29) gatekeeps every step.** No technique ships unless it survives the iPhone-15
envelope.

---

## 9. PER-CHAMBER VARIATIONS AS CONFIGS (one world, eight apertures)

Cohesion does not mean uniformity — each chamber is a *distinct read* achieved by **damping the shared
preset table**, never by a different system. The `scenes.js` row per route is extended from the existing
`{ veinScale, veinGlow, irid, camZ, rotY, rotX }` with: `chamber` (the bespoke-mesh flag), `fov` (lens
choice), `envTone` (0 cool → 1 warm reflection temper), `ogham` (0..1 carve enable), `lutWarm` (per-route
grade mood), `heat`/`tempBias` (per-route base temperature), and `caustic`/`smoke` density. On navigation,
**damp toward the new preset** (λ ≈ 2.2–2.4) — never cut. Representative configs:

- **scrying-pool `/voice`** — cool (`envTone 0.05`), mirror-still, low grazing camera, ogham 0, calm sub-
  surface ember. *Calm, listening, a dark mirror with fire under it.*
- **casting-room `/software`** — the live molten pour, mid heat, the surface churning, sparks on.
- **channel-hall `/automations`** — top-down (high `rotX`), long lens (`fov 30`, oppressive compression),
  dense interlace, ogham on the walls, the pour winding the knot.
- **jewel-chamber `/web`** — wide lens (`fov 50`, vast), warm reflections (`envTone 0.6`), the high-tier
  3-tap chromatic dispersion — *the vivid prismatic OLED payoff.*
- **altar-approach `/about`** — the source; close oblique camera, ogham 1 + carved engraving + the AE green-
  reveal at full strength (the keystone beat).
- **stone-ledger `/pricing`** — ogham verse up the stone edge (authentic bottom-to-top), cool, still.
- **four-plinths `/work`** — slight high three-quarter, gallery Lightformer keys, four casts cooling out of
  phase, baked contact shadows.
- **forge-mouth arch `/contact`** — head-on approach, hottest reflections (`envTone 0.85`), thickest smoke,
  the white-hot mouth radiating toward the viewer, embers pouring through.

The camera framing carries over (the chamber object sits where the slab is); the grade is one film stock
with a per-route LUT cross-fade; the bloom threshold is shared. **No chamber introduces a cool/green/blue
cast, a second noise, a private orange, or a different operator.**

---

## 10. THE PERFORMANCE BUDGET ENVELOPE (the contract every element is held to)

The judge device is the whole game: an **iPhone 15 (A16/A17, OLED) held in one hand, in a Safari tab, with
a thermal ceiling that throttles after ~90 seconds.** On this scene, **pixels are the enemy, not
triangles** — it is a pure-void world with a tiny material/draw count, so the cost is **fill-rate**
(near-full-screen emissive fbm shaders + post) and **overdraw** (additive particles + transparent glass),
not geometry.

**The frame budget:** 60fps = 16.67 ms, but reserve ~3–4 ms for compositor/Lenis/React/OS, leaving ~11–12
ms of scene budget. Design to **~9–10 ms steady-state on `high`** so there is headroom to absorb thermal
throttle without falling below 16.67. Representative high-tier allocation (iPhone 15, DPR **1.5**):

| Cost center | Budget | How it's held |
|---|---|---|
| Slab vein shader (full-ish screen) | ~3.5–4.5 ms | 3-octave fbm, DPR-capped |
| Post chain (1 merged pass + half-res bloom) | ~2.5–3 ms | `mipmapBlur resolutionScale 0.5`, merged `EffectPass` |
| Embers/sparks (1 draw, additive) | ~0.8–1.2 ms | ≤320 pts, modest point size, overdraw-bounded |
| Procedural env (Lightformers, 256) | ~0.5 ms | static PMREM cubemap, no EXR |
| Camera/scroll JS + React + Lenis | ~2–3 ms | alloc-free `useFrame`, mutable store |
| **Throttle headroom** | **~5–6 ms** | the gap to 16.67 |

**The four levers that move fill-rate most**, in priority order: **(1) DPR cap** (iPhone reports DPR 3;
rendering the void shader at 3× is instant death — cap to **1.5** on mobile, 2 on desktop); **(2) bloom
`resolutionScale 0.5`** (the half-res mip pyramid, can roughly double frame rate); **(3) `GW_FBM_OCTAVES`**
(4→3→2 by tier, a compile-time define so the loop unrolls with zero runtime branch); **(4) particle
overdraw** (bounded by *covered pixels*, not count — modest `gl_PointSize`, short lifetimes).

**The three tiers** (`high|low|static`, one `TIERS` table, driven by a boot capability probe — iPhone 15 →
`high` with DPR capped 1.5):
- **`high`** — full post (DOF 480px, CA, SMAA), GPGPU sparks ≤320, fbm 4-octave (slab) / worley on,
  transmission on, env 256, all atmosphere.
- **`low`** — bloom + half-float + grade (no DOF→TiltShift2, no CA/SMAA), CPU points ≤160, fbm 3, no worley,
  no transmission, env 128, cheap atmosphere only.
- **`static`** (reduced-motion / weak GPU / no-WebGL) — `frameloop='demand'`, **`Effects` unmounted**,
  `uTime` frozen to `2`, no embers, DPR 1, env 64, baked-feel poster. The shader still resolves so the void
  isn't black — a still, dignified, fully-lit forge.

**Runtime adaptivity:** one `PerformanceMonitor` `factor` feeds a ladder read from the mutable `forge`
store (never React state mid-scroll): factor dips → `AdaptiveDpr` drops pixel ratio → halve embers + drop
SMAA → drop CA → demote `high`→`low`. Designed to ride the *slow* thermal decline over a 2–3 minute
session, not just hold 60 cold. **INP insurance:** `renderer.compileAsync` before first interaction so a
multi-hundred-ms shader compile doesn't block the first scroll; alloc-free per-frame loop (no `new` in
`useFrame`).

**Hard constraints, non-negotiable across the whole build:** one renderer / one `<Canvas>` / one composer
/ one `Points` system; **no runtime EXR/HDR loads** (procedural env only); WebGL2 + `onBeforeCompile` GLSL
ships to the judge (WebGPU/TSL is a gated post-judge upgrade, authored TSL-portable so the port is a
re-host not a rewrite — the WebGL2-fallback branch of `WebGPURenderer` is *less* tested than classic
`WebGLRenderer`, so betting the judge device on it is the documented mistake); `dispose()` on every
unmount; the static tier and `<noscript>`/AEO path always present and on-brand. (Topics 29/30, gatekeeping
01–28.)

---

## 11. SUMMARY — THE ONE-SENTENCE CONTRACT

**GAELWORX is one molten forge built on one renderer, one temperature signal, one noise basis, one palette,
one tone-map, one bloom contract, one lighting model, and one camera — every element samples those shared
systems at different inputs, the A and E are the single eternal exception, and the perf budget gatekeeps it
all to 60fps on an iPhone 15 OLED.** Build the spine first; clamp the A/E; share everything; degrade
uniformly; verify on the device. Nothing is bolted on because nothing has its own logic.
