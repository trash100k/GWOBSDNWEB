# 65 — The Scrying-Pool Sub-Surface Ember Model (no FBO)

_Phase 2 deep-dive · cluster **J-chambers** · GAELWORX forge world · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js), warm-forge palette._

> **Read `00-COHESION-MAP.md` §1 (master temperature), §2 (shared noise), §5 (the metal is the only
> light) and Phase-1 doc `33-perpage-worlds-water-gem-plinths.md` §2.1/§4.3 first.** Phase-1 doc 33 picked
> the technique family — "procedural sine surface + a fake sub-surface ember glow done entirely in the
> fragment shader (no FBO)" — and named this exact comparison as deep-dive candidate #1. This document is
> that deep-dive: it pits the §4.3 fbm-glow-from-below fake-SSS against a **thickness/depth deep→shallow
> gradient** and against a **1-tap screen-space refraction**, settles the **sine/Gerstner vertex ripple +
> analytic-normal** question, caps the amplitude (it is a *still scrying pool*, not an ocean), and proves
> the whole thing fits **zero extra passes** on iPhone 15. The output is buildable: exact GLSL, the r3f
> component shape, the uniform list, and the wiring into the Master Forge Uniform pool `U` (doc 39).

---

## 1. SCOPE — this element in the GAELWORX world

The scrying-pool is the chamber for `/voice` (Maeve, the listening voice of the clan). The cohesion map's
per-chamber row is blunt about the read: _"cool (`envTone 0.05`), mirror-still, low grazing camera, ogham
0, calm sub-surface ember. Calm, listening, a **dark mirror with fire under it**."_ Every other chamber is
the forge with its lid off — the casting-room pour, the channel-hall knot, the arch mouth radiating. The
pool is the forge **seen through still water**: the same molten heat, but read indirectly, slowed, held
under a black obsidian-still surface that mirrors the void above it and lets a deep ember breathe up from
below. It is the quietest beat in the world and therefore the one most easily ruined by over-animation: the
moment the surface reads as "ocean" or "swimming pool," the sacred listening-chamber tone collapses into
stock-asset water.

The element has three jobs, in priority order:

1. **Read as a dark mirror.** A near-black, very-low-roughness surface that reflects the cool procedural
   env (`<ForgeEnvironment>`, doc 22) — a faint specular streak, not a bright sky. On the OLED this is a
   true-black plane with one cool highlight.
2. **Have fire *under* it, not on it.** A deep ember glow that lives *below* the mirror plane, strongest
   where the eye looks *into* the water (low Fresnel, near-normal incidence) and occluded by the mirror
   sheen at grazing angles. This is the "scrying" — you stare into the dark glass and the forge answers.
3. **Breathe on the world's heartbeat.** The glow pulses and the surface agitates off the shared
   `uTemp`/`uHeat` (the same scroll + strike signal that surges the slab veins), `dt`-damped, so a headline
   strike ripples the pool in the *same frame* it flares the slab. That synchrony is the cohesion proof
   (cohesion-map rule #6).

The hard constraints from the map: **no FBO / no second scene render on any tier** (kills planar reflection
and full `MeshTransmissionMaterial`), **no runtime EXR**, **amplitude capped** (it is *still*), and it must
cost **< 0.8 ms GPU on iPhone 15 on top of the slab** (doc 33 §6). It binds the shared pool `U` (doc 39),
samples `gw_fbm`/`gw_warp` (shared noise, §2 of the map), inlines `PAL` via `v3()`, and reads `gw_forge`/
`gw_tempColor` for the ember color so the fire under the mirror is _the same metal_ as the fire everywhere
else.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

This deep-dive compares three ways to sell "fire under a dark mirror" plus the surface-ripple options. The
2025–2026 water-shader literature has converged hard on **depth as the cornerstone** of believable
water — which is directly relevant because GAELWORX's "depth" is not transparency to a pool floor, it is
*translucency to an ember source below*. Same math, repurposed.

### 2.A The fake sub-surface glow — fbm-from-below (the doc-33 baseline)

A fragment-only term: a slow-scrolling/boiling `gw_fbm` (or `gw_warp`) field, raised to a power for filament
contrast, tinted by `gw_forge(uTemp)`, and **gated by `(1 - Fresnel)`** so it only shows where you look
*into* the water. No depth read, no extra geometry, no pass. This is what doc 33 §4.3 specifies.

- **Quality:** Good-to-very-good for *this specific brief*. It is not physically sub-surface scattering;
  it is an animated emissive field painted under a Fresnel-gated mirror. But "fire glowing up through dark
  glass" has no real-world reference the viewer can check it against — the fake reads as intentional, not
  wrong. The boiling `gw_fbm` gives it _life_ (the "metal is alive" law) for free.
- **Perf:** Excellent. 1–2 fbm evals + a Fresnel. Zero passes, zero texture fetches beyond the env.
- **Mobile:** Excellent. This is the only one of the three that is unconditionally affordable at `low`.
- **Complexity:** Low. The only design work is the `pow` contrast and the Fresnel gate balance.
- **Cohesion:** Perfect — it _is_ the shared noise + the shared temperature ramp, sampled at a slow rate.
- **Weakness:** No sense of *depth*. The glow sits at a fixed "distance" under the surface everywhere; it
  cannot get dimmer in the "deep" centre and brighter at the "shallow" edges. On its own it can read flat.

### 2.B The thickness / depth deep→shallow gradient (the absorption upgrade)

Instead of a uniform glow, modulate the ember by a **thickness** scalar: how much "water" the light travels
through before it reaches the eye. Two ways to get thickness without an FBO:

1. **Analytic / geometric thickness.** The pool is a finite plane; "thickness" is a hand-authored field —
   e.g. a radial falloff (deep centre, shallow rim), or a baked vertex-attribute `aThickness` painted into
   the geometry, or simply `1 - edgeDistance`. The ember is then attenuated by **Beer–Lambert absorption**:
   `transmit = exp(-thickness * sigma)`, with `sigma` an ember-tinted `vec3` (the wavelength-dependent
   absorption already used by the smoke model, map §5.4: `exp(-d*sigma*vec3(1, 1.6, 2.4))`). Deep =
   absorbs more = darker/redder; shallow rim = lets more white-gold through. **No depth texture, no pass.**
2. **Scene-depth thickness (`depthTexture`).** The canonical 2025–26 water technique: read the camera's
   `depthTexture`, reconstruct the distance between the water surface and whatever is behind it, and fade
   color by that distance. This is what Three.js Water Pro shipped when it _"replaced the old shallow/deep
   color model with Beer–Lambert absorption"_ and added a _"depth-based shoreline foam system."_ It is the
   right model — but it requires a **depth pre-pass** (an FBO/`WebGLRenderTarget` with `DepthTexture`),
   which violates our no-extra-pass rule on mobile.

- **Quality:** The geometric variant (B.1) is the sweet spot here. Beer–Lambert with an ember `sigma` is
  _exactly_ the absorption that makes "looking into molten glass" read right, and it gives the pool a
  centre-vs-edge depth that 2.A lacks — for the cost of one `exp()`.
- **Perf:** B.1 is essentially free (one `exp`, one cheap thickness field). B.2 costs a depth pre-pass
  (~0.5–1 ms + memory) and is out of budget.
- **Mobile:** B.1 excellent; B.2 high-tier-desktop-only at best.
- **Complexity:** B.1 low. The only decision is *where the thickness comes from* (radial vs baked attribute).
- **Cohesion:** B.1 reuses the world's existing wavelength-absorption `sigma` convention (smoke, map §5.4),
  so the pool absorbs light the same way the smoke does — a quiet but real cohesion win.

### 2.C The 1-tap screen-space refraction (the "see through the glass" option)

Offset the screen UV by the surface normal's tilt and resample the already-rendered framebuffer, so the
ember/void *behind* the surface bends with the ripples. The modern WebGL way is one extra texture fetch of
the input buffer in a post-style read; the modern TSL/WebGPU way is `viewportSharedTexture(screenUV + off)`
with `viewportSafeUV` doing the depth comparison that stops geometry *in front of* the surface from
smearing onto it (three.js TSL spec; Maxime Heckel's *Field Guide to TSL and WebGPU*). The Gjoreski
stylized-water port (Godot→three.js/TSL, 2025) is the cleanest reference: _"take the tangent-space normal's
X/Y tilt, scale by depth, and distort screen UVs to resample a snapshot of the scene so the background
bends with the ripples."_

- **Quality:** High *if there is something behind the surface to refract*. In GAELWORX the pool's
  background is **the void** (and the slab back-wall). Refracting the void produces… the void. The payoff
  of 1-tap refraction is near-zero here because the scene behind the dark mirror is intentionally empty.
- **Perf:** The WebGL "resample the framebuffer" path needs the current frame as a texture — which means
  either the composer's input buffer (a pass-ordering coupling) or a copy (a fetch + memory). On the
  one-merged-`EffectPass` mobile chain this is friction we do not want for ~zero visible gain.
- **Mobile:** Marginal. TSL `viewportSharedTexture` is genuinely cheap on WebGPU, but iOS Safari WebGPU is
  still gated/uneven in 2025–26 (map §10; doc 30), and the WebGL fallback re-introduces the buffer read.
- **Complexity:** Medium (WebGL) / low (TSL, post-judge).
- **Cohesion:** Neutral. It is a real technique that simply has nothing to refract in *this* chamber.

### 2.D Surface ripples — sine vs Gerstner, and the normal

The surface needs motion and a normal for the mirror Fresnel. Three families:

1. **Summed sines (height-only) + finite-difference normal.** Add a few `sin()` waves to `position.y`,
   then sample the height function at `+e` in x and z and cross the differences for the normal. This is the
   Codrops *Stylized Water with R3F* (2025) approach and the doc-33 §4.3 snippet. Cheap, trivially correct,
   and for a *low-amplitude still pool* the height-only model is indistinguishable from Gerstner.
2. **Gerstner/trochoidal (horizontal + vertical displacement) + analytic normal.** Each wave also pushes
   vertices horizontally, producing sharp crests — the ocean look. The analytic normal is the classic
   GPU Gems Ch.1 closed form (sum of per-wave partial derivatives), and 2025 work formalizes deriving the
   tangent/bitangent by **automatic differentiation of the displacement** so the normal is exact, not
   finite-differenced (arXiv *Vertex Shader Domain Warping with Automatic Differentiation*, surfaced via
   2025 three.js-forum Gerstner threads). Correct, but the horizontal displacement and sharp crests are an
   *ocean* feature — wrong for a scrying pool.
3. **Normal-map flow (no vertex motion).** Scroll one or two normal maps over a flat plane. Cheapest of
   all, but it needs a texture asset (mild conflict with "go procedural / no runtime loads") and a flat
   plane reads *too* dead for the subtle breathing we want.

- **Verdict on ripples:** **Summed sines, height-only, analytic finite-difference normal**, amplitude
  capped. Gerstner buys sharp crests we explicitly do not want; the analytic-FD normal is exact enough at
  these amplitudes and is 2 extra height evals (cheap). We keep the *option* of a true analytic derivative
  (no `+e` evals) as a micro-optimization, documented below, but FD is the safe default.

### 2.E Verdict on the landscape

**Combine 2.A + 2.B.1 for the body, reject 2.C, use 2.D.1 for the surface.** The fire-under-a-dark-mirror
read is won by an **fbm-boiled ember field (2.A) attenuated by a geometric Beer–Lambert thickness gradient
(2.B.1)**, Fresnel-gated under a low-amplitude summed-sine mirror surface (2.D.1) — **zero extra passes,
zero texture loads, one `exp`, two fbm evals, two FD height evals.** 1-tap refraction (2.C) is the seductive
wrong answer: it is a real 2025–26 technique with nothing to refract in a void-backed chamber, so it spends
budget and pass-ordering complexity for invisible gain. We note it as the *jewel*-chamber's tool, not the
pool's.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A single `MeshPhysicalMaterial` plane, shader-injected via `onBeforeCompile`, that (1) ripples with two
or three low-amplitude summed sines and an analytic finite-difference normal in the vertex stage, and (2)
in the fragment stage paints a `gw_warp`-boiled ember field, attenuates it by a geometric Beer–Lambert
thickness gradient with an ember-tinted `sigma`, tints it through `gw_forge(uTemp)`, and composites it
*under* a Fresnel-gated cool-env mirror sheen. It binds the shared pool `U` (doc 39); no FBO, no depth
texture, no refraction tap, no extra render on any tier.**

Why this pick, against the brief and constraints:

- **It nails all three jobs.** The low-roughness `MeshPhysicalMaterial` + cool env gives the **dark
  mirror** (job 1) for free via three's own specular/env path — we don't reinvent reflection. The
  fbm×thickness ember composited under a `(1 - Fresnel)` gate gives **fire under, not on** (job 2). Binding
  `uTemp`/`uHeat` from `U` gives **the heartbeat** (job 3).
- **The thickness gradient is the upgrade that doc-33's baseline lacked.** §4.3's flat fbm glow reads
  uniform; the Beer–Lambert centre-deep/edge-shallow attenuation gives the pool a *volume* — the centre is
  a deep red-black well, the glow concentrates and whitens toward the rim where the "water" is thin — at
  the cost of a single `exp()`. This is the 2025–26 water consensus ("depth is the cornerstone") applied
  *geometrically* so it costs nothing.
- **It refuses the two budget traps.** No planar reflection (the `WaterSurface` README's own "expensive in
  medium/complex scenes" warning), no transmission buffer, no depth pre-pass, no framebuffer resample. The
  whole effect is local to one material's fragment shader.
- **It is cohesion-first.** Ember color is `gw_forge(uTemp)`, not a private orange. Noise is `gw_warp`/
  `gw_fbm` at a *slow* rate. Absorption `sigma` is the world's wavelength-dependent convention. Reflection
  is the one shared env. Heat is `U.uTemp`/`U.uHeat`. Nothing is invented locally.

The TSL `viewportSafeUV` depth-aware refraction (2.C) is recorded as the **post-judge / jewel-chamber**
path — when the renderer migrates to WebGPU (doc 50/51) and a chamber actually has content behind a
refractive surface, that is its tool. The pool does not need it.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new deps)

- `three` r17x (current), `@react-three/fiber`, `@react-three/drei`. **No new runtime asset loads** (no
  normal-map JPEG, no EXR — fully procedural).
- Reuses `src/scene/shaders.js` (`GLSL_NOISE`: `gw_fbm`, `gw_warp`, `gw_snoise`) and the temperature
  authority `gw_tempColor`/`gw_forge` (doc 01 / map §1.1), the palette helper `v3()` over `PAL`
  (`src/scene/palette.js`), and the shared pool `U` + `<ForgeDriver/>` (doc 39).
- WebGPU/TSL: **future migration only.** Do not introduce `WebGPURenderer` for this chamber. The component
  is authored TSL-portable (the fragment logic is a pure function of uniforms + position) so the eventual
  port is a re-host, not a rewrite (map §10; doc 50).

### 4.2 Uniforms — bound from the Master Forge pool `U`

The pool binds the *same references* as every other chamber (doc 39 §2.1). It does **not** build a private
`uHeat`; it reads `U`.

| Uniform | Source | Role in the pool |
|---|---|---|
| `uTime` | `U.uTime` (frozen to `2.0` on `static`) | wave phase + boil phase |
| `uTemp` | `U.uTemp` (`scrollDamped + vel*0.25`) | ember color via `gw_forge`, glow brightness |
| `uHeat` | `U.uHeat` (strike `exp(-since*3)` + vel) | transient surge: agitation + glow flare on a strike |
| `uPointer`/`uPointerOn` | `U.uPointer*` | optional: a single soft ring ripple where the eye/finger rests |

Pool-local constants (not in `U`, set once): `uAmp` (base amplitude ≈ `0.035`), `uThickSigma`
(`vec3(0.9, 1.6, 2.6)` ember-tinted absorption), `uDeepColor`/`uShallowTint` are derived from `PAL`
in-shader, not passed.

### 4.3 Vertex stage — capped summed-sine ripple + analytic normal

```glsl
// ---- HEAD (after #include <common>) ----
uniform float uTime;
uniform float uHeat;
uniform float uAmp;

// Height field: 2 base swells + 1 fine ripple. ALL amplitudes summed must stay < ~0.06 world units
// or the "still mirror" read dies (doc 33 pitfall: "amplitude creep"). Hotter = slightly more agitated.
float gwPoolH(vec2 p){
  float a = uAmp * (0.85 + 0.30 * uHeat);          // strike adds a little life, never a lot
  float h  = sin(p.x * 1.30 + uTime * 0.55) * a;
  h       += sin(p.y * 1.70 - uTime * 0.45) * a * 0.78;
  h       += sin((p.x + p.y) * 2.20 + uTime * 0.95) * a * 0.45;   // ripple detail
  return h;
}

// ---- replace <begin_vertex> ----
vec3 transformed = position;
float gwH  = gwPoolH(position.xy);                 // PlaneGeometry is in XY before the -PI/2 rotation
transformed.z += gwH;                              // displace along the plane's local up
// analytic finite-difference normal — NO normal map, NO FBO, 2 extra height evals
const float gwE = 0.06;
float gwHx = gwPoolH(position.xy + vec2(gwE, 0.0));
float gwHy = gwPoolH(position.xy + vec2(0.0, gwE));
vec3 gwNloc = normalize(vec3(gwH - gwHx, gwH - gwHy, gwE));
```

Then route `gwNloc` into the lighting normal. The cohesion-safe move is to overwrite `objectNormal` *before*
`<beginnormal_vertex>`/`<defaultnormal_vertex>` run so three's own normal→view transform and the env/specular
path consume the rippled normal (this is what gives the mirror its live, wobbling highlight):

```glsl
// just before <beginnormal_vertex>:
vec3 objectNormal = gwNloc;     // replace the geometry normal with the analytic wave normal
// (let three transform it to vNormal / transformedNormal as usual)
```

> **Analytic-derivative micro-opt (optional, high-tier nicety).** The exact normal needs no `+e` evals: the
> partial of each `sin` term is a `cos` with the same argument scaled by its frequency, so `dh/dx` and
> `dh/dy` are closed-form. It trades 2 height evals (6 sines) for 6 cosines — roughly a wash on mobile, so
> **FD is the default**; switch to the closed form only if profiling flags the vertex stage (it won't —
> this is a fill-rate scene, not a vertex scene, map §10).

**Amplitude cap is load-bearing.** `uAmp ≈ 0.035`, `uHeat` adding at most `+30%`, three summed terms whose
coefficients sum to `< 1.9·uAmp` → worst-case peak ≈ `0.066` world units on a 14×8 plane. That is a
*scrying pool*: a surface that shivers, never an ocean. Cross the `0.06` line and the dark-mirror read
breaks (doc 33 pitfall "pool amplitude creep").

### 4.4 Fragment stage — fbm ember × Beer–Lambert thickness, under a Fresnel mirror

```glsl
// ---- HEAD (fragment, after #include <common>) ----
uniform float uTime;
uniform float uTemp;
uniform float uHeat;
uniform vec3  uThickSigma;     // ember-tinted absorption, e.g. vec3(0.9, 1.6, 2.6)
${'${GLSL_NOISE}'}             // gw_fbm / gw_warp / gw_snoise (shared)
// gw_tempColor / gw_forge injected from the temperature authority (doc 01)

// ---- just before <tonemapping_fragment> ----

// (1) Fresnel of the rippled surface: low at normal incidence (look INTO water), high at grazing (mirror)
float gwNdotV = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
float gwFres  = pow(1.0 - gwNdotV, 3.0);

// (2) Geometric thickness: deep centre -> shallow rim. vUv in [0,1]; radial well, no depth texture.
float gwR     = length(vUv - 0.5) * 2.0;                 // 0 centre -> ~1 rim
float gwThick = mix(1.0, 0.18, clamp(gwR, 0.0, 1.0));    // centre thick (1.0), rim thin (0.18)

// (3) The ember field: SLOW boiling gw_warp (NOT scrolling) -> filament contrast. "Boil in place" (map §2).
float gwBoil  = gw_warp(vUv * 2.4 + vec2(0.0, uTime * 0.05));   // domain-warped, advances slowly
float gwEmber = pow(clamp(gwBoil, 0.0, 1.0), 1.6);              // pow = filament/vein contrast

// (4) Beer-Lambert: light from below travels through gwThick of "molten glass" -> ember-tinted absorption.
//     Deep centre absorbs (darker, redder); thin rim transmits (brighter, whiter-gold).
vec3 gwTransmit = exp(-gwThick * uThickSigma);                  // per-channel: more thickness -> dimmer & redder

// (5) Color the glow through the ONE temperature authority so it is the SAME metal as the rest of the world.
vec3 gwGlowCol  = gw_forge(uTemp) ;                             // HDR > 1 in the hot band -> blooms for free
vec3 gwSub      = gwGlowCol * gwEmber * gwTransmit * (0.18 + 0.82 * uHeat);

// (6) Composite: mirror sheen (env reflection already in gl_FragColor.rgb) on top, ember from below
//     showing strongest where Fresnel is LOW (we are looking INTO the dark glass).
gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.06, gwFres);  // crush body to near-void, keep spec
gl_FragColor.rgb += gwSub * (1.0 - gwFres);                                 // fire under the mirror
```

Notes on each step:

- **(1) Fresnel gate is the whole trick.** At grazing angles you see the *reflection* (the cool env streak =
  mirror); at near-normal you see *into* the water (the ember). The low grazing camera of the `/voice`
  chamber means most of the plane reads as mirror, with the ember welling up in the patch you look straight
  down into — exactly "scrying."
- **(2) Geometric thickness needs no depth read.** A radial well is the cheapest believable field for a
  round-ish pool; for a non-radial pool, bake an `aThickness` vertex attribute instead and read it as a
  varying. Either way it is *free*.
- **(3) `gw_warp` boils in place** (time as a slow phase advance on a domain-warped field), never *scrolls*
  (time added straight to the coordinate would slide the texture and read fake — map §2 binding rule).
- **(4) Beer–Lambert with an ember `sigma`** is why the centre goes deep-red-black and the rim glows
  white-gold: the green-weighted-up `sigma=(0.9,1.6,2.6)` absorbs blue fastest, then green, leaving warm
  light through thickness — the same wavelength logic as the smoke (map §5.4). One `exp`, three components.
- **(5) `gw_forge(uTemp)`** is non-negotiable for cohesion: the ember is literally `gw_tempColor(uTemp) *
  gw_tempEmissive(uTemp)` — the identical function the slab veins, the pour, the cooling letters, and the
  sparks use. Scroll the forge hotter and the pool's under-fire warms and brightens on the same curve.
- **(6) Body crush** keeps the void true-black on OLED (we crush the lit body to ~6% under the spec so the
  mirror is *dark*), and only the ember add and the env highlight survive — and only the hot band of the
  ember exceeds 1.0, so **only that blooms** (map §3.1, the palette-is-the-bloom-selector rule).

> **The A/E never touches the pool.** The pool has no letterforms, so there is no `uIsAE` branch here — but
> if the `/voice` chamber ever floats a reflected wordmark, its A/E must route through `gw_divineFire`
> (white-gold, never cools), never `gw_forge`. Keep that branch hard-separated (map §1.4).

### 4.5 The r3f component shape

```jsx
// src/scene/chambers/ScryingPool.jsx
import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge } from '../../store.js'
import { U } from '../forgeUniforms.js'                 // the shared pool (doc 39)
import { GLSL_NOISE, GLSL_TEMP } from '../shaders.js'   // gw_fbm/gw_warp + gw_forge/gw_tempColor
import { PAL, v3 } from '../palette.js'

const HEAD_V = `uniform float uTime; uniform float uHeat; uniform float uAmp;
float gwPoolH(vec2 p){
  float a = uAmp*(0.85+0.30*uHeat);
  float h  = sin(p.x*1.30+uTime*0.55)*a;
  h += sin(p.y*1.70-uTime*0.45)*a*0.78;
  h += sin((p.x+p.y)*2.20+uTime*0.95)*a*0.45;
  return h; }`

const FRAG_HEAD = `uniform float uTime; uniform float uTemp; uniform float uHeat;
uniform vec3 uThickSigma;\n${GLSL_NOISE}\n${GLSL_TEMP}`

const FRAG_BODY = `
  float gwNdotV = clamp(dot(normalize(vNormal), normalize(vViewPosition)),0.0,1.0);
  float gwFres  = pow(1.0-gwNdotV, 3.0);
  float gwR     = length(vUv-0.5)*2.0;
  float gwThick = mix(1.0, 0.18, clamp(gwR,0.0,1.0));
  float gwBoil  = gw_warp(vUv*2.4 + vec2(0.0, uTime*0.05));
  float gwEmber = pow(clamp(gwBoil,0.0,1.0), 1.6);
  vec3  gwTrans = exp(-gwThick*uThickSigma);
  vec3  gwSub   = gw_forge(uTemp)*gwEmber*gwTrans*(0.18+0.82*uHeat);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb*0.06, gwFres);
  gl_FragColor.rgb += gwSub*(1.0-gwFres);`

export function ScryingPool() {
  const seg = forge.quality === 'high' ? [96, 56] : forge.quality === 'low' ? [64, 40] : [32, 20]

  const geometry = useMemo(() => new THREE.PlaneGeometry(14, 8, seg[0], seg[1]), [seg[0], seg[1]])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#04050a', roughness: 0.04, metalness: 0.0,
      envMapIntensity: 1.2, clearcoat: 1.0, clearcoatRoughness: 0.06,
    })
    m.defines = { USE_UV: '' }
    const local = { uAmp: { value: 0.035 }, uThickSigma: { value: new THREE.Vector3(0.9, 1.6, 2.6) } }
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, U, local)            // SHARED references (uTime/uTemp/uHeat) + pool-locals
      s.vertexShader = s.vertexShader
        .replace('#include <common>', `#include <common>\n${HEAD_V}`)
        .replace('#include <beginnormal_vertex>',
          `vec3 objectNormal = vec3(0.0);\n#include <beginnormal_vertex>`)   // declared, overwritten below
        .replace('#include <begin_vertex>', `
          vec3 transformed = position;
          float gwH = gwPoolH(position.xy);
          transformed.z += gwH;
          const float gwE = 0.06;
          float gwHx = gwPoolH(position.xy+vec2(gwE,0.0));
          float gwHy = gwPoolH(position.xy+vec2(0.0,gwE));
          objectNormal = normalize(vec3(gwH-gwHx, gwH-gwHy, gwE));`)
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
        .replace('#include <tonemapping_fragment>', `${FRAG_BODY}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  return <mesh geometry={geometry} material={material}
               rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} />
}
```

Mount it from `ForgeCanvas` behind a route guard, Suspense-decoupled (map §4.3):

```jsx
{forge.route === '/voice' && <ScryingPool />}
```

**Edge cases handled in the snippet:** `objectNormal` is *declared before* `<beginnormal_vertex>` then
overwritten in `<begin_vertex>` so we don't double-declare or fight three's own `objectNormal`; `USE_UV`
is defined so `vUv` exists; `vNormal`/`vViewPosition` exist because the material is smooth-shaded
(`MeshPhysicalMaterial`, not `flatShading` — the gem's `vNormal`-undefined trap from doc 33 does **not**
apply here); `uTime` is the *shared* `U.uTime` so freezing it on `static` freezes the pool with everything
else (no separate write needed). The `local` uniforms are merged *after* `U` so pool-only values don't
collide with the pool's shared names.

---

## 5. COHESION

The pool obeys all nine binding rules of the cohesion map (§7); the load-bearing ones:

- **Reads the master temperature, never invents heat (rule 1).** The under-fire color is `gw_forge(uTemp)`
  — the identical authority the slab, pour, letters, and sparks use. A scroll that heats the forge warms
  and brightens the pool's ember on the same `gwCool01`/`gw_tempColor` curve. No private orange.
- **Reads the shared noise, never forks it (rule 2).** The ember field is `gw_warp` from `shaders.js` at the
  same `GW_FBM_OCTAVES` define; "more detail" would be one more octave, not a second noise. The pool boils
  with the same grain the slab veins flow with.
- **Uses only `PAL` via `v3()` (rule 3).** Deep body crushes toward `PAL.void`; the ember is the shared hot
  ramp; the absorption `sigma` keeps the transmitted light warm. Only the hot band exceeds 1.0, so only it
  blooms — the same selective-bloom-for-free the whole world relies on.
- **Lit only by the metal (rule 4).** No fill light is added for the pool. The surface is *lit* by its own
  sub-surface ember and *reflects* the one shared cool procedural env (`<ForgeEnvironment>`, doc 22) — never
  an EXR, never a skybox. The mirror is the void reflecting the void, with fire under it.
- **One clock, `dt`-damped (rule 6).** `uTime`/`uTemp`/`uHeat` come from `U`, written once by
  `<ForgeDriver/>`. A `forge.strikeAt` strike agitates the surface (`uHeat` → amplitude) and flares the
  ember (`uHeat` → glow) in the **same frame** the slab veins surge — the synchrony that proves it is one
  world.
- **Shares the absorption convention (map §5.4).** The ember `sigma=(0.9,1.6,2.6)` is the same
  wavelength-dependent warm-pass logic the smoke uses (`exp(-d*sigma)`), so light through the pool and light
  through the smoke obey one absorption law.
- **One finish (rule 7).** The pool emits HDR only in the ember's hot band; the single shared
  `EffectComposer` (mipmapBlur bloom + grade + grain-as-OLED-dither) finishes it identically to every other
  chamber. No per-chamber post.

The per-chamber preset (`scenes.js`, map §9): `/voice` → `chamber:'pool'`, `envTone:0.05` (cool mirror),
`fov` long-ish, `rotX` for a low grazing camera, `ogham:0`, `tempBias` low (a *calm* base heat), `caustic:0`,
`smoke` light. Navigation *damps* toward this preset (λ ≈ 2.3), never cuts.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

This is a **fill-rate** element (a 14×8 plane that can cover much of the screen at a low grazing angle),
not a vertex element, so the cost lives in the fragment shader. The whole effect is **one mesh, zero extra
passes, zero texture loads** — it slots inside the existing slab+post budget.

| Tier | Plane segments | Vertex | Fragment ember | Reflection |
|---|---|---|---|---|
| **high** | 96×56 | 3 sines + FD normal (2 evals) | `gw_warp` (2-level) + Beer–Lambert | full cool env, clearcoat |
| **low** | 64×40 | 2 sines + FD normal | `gw_warp` (1-level) + Beer–Lambert | env, no clearcoat |
| **static** | 32×20 | frozen (`uTime=2`, `uHeat≈0`, flat) | `gw_fbm` (no warp) frozen | env only |

Cost-control specifics:

- **DPR cap is the dominant lever (map §10).** The plane covers screen at a grazing angle; rendered at the
  iPhone's reported DPR 3 the fragment cost triples. `ForgeCanvas` caps DPR to **1.5** on mobile +
  `AdaptiveDpr`. This single setting matters more than the segment count.
- **`gw_warp` octave-LOD.** Two warp levels on `high`, one on `low`, none (`gw_fbm` only) on `static` — via
  the shared `GW_FBM_OCTAVES` define so the loop unrolls with zero runtime branch (uniform degrade, map
  rule 9). The 2026 R3F-mobile-perf guidance (Krapton) reinforces: cut shader work before geometry, and
  never pay for a pass you can fold into an existing material.
- **No depth pre-pass, no framebuffer resample, no planar reflection.** The whole reason 2.B.1 (geometric
  thickness) beat 2.B.2 (`depthTexture`) and 2.C (refraction tap) is that those need a buffer the mobile
  chain cannot afford. The pool stays a single forward-rendered material.
- **Vertex is cheap.** Even at 96×56 = ~5.4k verts with 9 sines + 2 FD evals, the vertex stage is far under
  budget; this is the cheap half. The amplitude cap also means low triangle deformation = no overdraw
  surprises.
- **Dispose on unmount.** Route-swapped mount; the `useEffect(() => () => { geometry.dispose();
  material.dispose() }, [])` is mandatory or the one shared context leaks geometries/textures on every nav
  (the `forge-scene` gotcha; `renderer.info.memory` must stay flat across `/voice` ↔ elsewhere).
- **Target:** < 0.8 ms GPU on iPhone 15 on top of the slab (doc 33 §6). The analytic-FD normal (no
  normal-map fetch), the single `exp` thickness, and the no-pass discipline are exactly what keep it there.

**Static-tier dignity:** frozen `uTime=2`, `uHeat≈0` → a flat dark mirror with a still, deep ember well in
the centre — a poster, not a broken fallback. The `gw_warp` drops to a single `gw_fbm` so the still frame
still has filament structure, just no motion.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**

1. **Bind `U` first, prove the heartbeat.** Mount the plane with a *plain* low-roughness
   `MeshPhysicalMaterial` (no injection yet), bound to the cool env, route-gated to `/voice`. Confirm it
   reads as a dark mirror and that `renderer.info.memory` is flat across navigation. This de-risks the
   reflection + mount/dispose before any shader.
2. **Add the vertex ripple + analytic normal.** Verify the highlight *wobbles* (proof the normal is live)
   and that amplitude is sub-`0.06` (still, not ocean). Tune `uAmp` *on the device* — headless does not
   show the OLED mirror read.
3. **Add the fragment ember (2.A only).** `gw_warp` × `gw_forge(uTemp)` × `(1-Fresnel)`, no thickness yet.
   Confirm fire shows where you look *into* the water and the mirror sheen wins at grazing.
4. **Add the Beer–Lambert thickness (2.B.1).** The centre should sink to deep red-black, the rim should
   warm to white-gold. Tune `uThickSigma` through the tone-mapper on the device.
5. **Hook the strike.** A `forge.strikeAt` strike should agitate *and* flare the pool in the same frame as
   the slab. If it lags, you forked the clock — you must be reading `U.uTime`/`U.uHeat`, not a private ref.

**Pitfalls (hard-won in this codebase + the 2025–26 literature):**

- **Amplitude creep (the #1 pool failure).** Anything above ~`0.06` world units turns the scrying pool into
  a swimming pool and kills the "dark mirror" tone. Cap it; let `uHeat` add at most +30%. A *still* pool is
  the brief.
- **Refracting the void.** Do **not** reach for a 1-tap refraction (2.C) here. There is nothing behind the
  dark mirror but void + the slab back wall; refraction spends budget and pass-ordering complexity for
  invisible gain. It is the jewel chamber's tool, not the pool's.
- **`vNormal` vs flat-shading.** The pool is smooth-shaded `MeshPhysicalMaterial`, so `vNormal` exists — but
  if anyone copies a chunk from the gem (`flatShading:true`, where `vNormal` is undefined and you must use
  in-scope `normal`), it will compile-error or render black. Keep the pool on `vNormal`.
- **`objectNormal` double-declare.** Declaring `objectNormal` in `<begin_vertex>` while three also declares
  it in `<beginnormal_vertex>` is a redefinition error. The snippet declares it once (placeholder before
  `<beginnormal_vertex>`) then assigns it — match that order.
- **Scrolling vs boiling the ember.** `gw_warp(vUv + vec2(0, uTime*k))` with a *large* k slides the texture
  (reads fake, thin). Keep k small (`~0.05`) so the field *boils in place* (map §2 binding rule). The life
  comes from the domain warp, not from translation.
- **HDR discipline.** Only the ember's hot band should exceed 1.0. If the whole pool body is >1, bloom
  smears the frame and the OLED blacks die. The `*0.06` body crush in step (6) is what keeps the mirror
  dark; do not remove it to "brighten" the pool — brighten `uHeat`/`uTemp` instead.
- **Forking the heat signal.** Building a private `uHeat` (the way `FacetedJewel` historically did, doc 39
  §1) re-introduces the exact crack the world guards against. Bind `U`. The strike must surge slab and pool
  on one curve.
- **Forgetting `USE_UV`.** Without `m.defines.USE_UV`, `vUv` is undefined and the thickness + ember sampling
  break. Set it.

---

## 8. SOURCES (2025–2026)

1. Codrops — *Creating Stylized Water Effects with React Three Fiber* (2025-03-04).
   https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/ —
   procedural sine/Perlin vertex displacement, Fresnel depth-color mixing, "paint a gradient at the water
   level," and the no-FBO perf framing that grounds the §2.D.1 surface + §2.A glow picks.
2. Aleksandar Gjoreski — *Be Water, my friend! (Stylized Water Shader, Godot → Three.js/TSL)* (2025).
   https://aleksandargjoreski.dev/blog/stylized-water-shader/ — "depth as the cornerstone": depth drives
   refraction strength and light absorption with distance; tangent-space normal X/Y tilt scaled by depth to
   distort screen UVs. The canonical 2025 statement of the §2.B/§2.C tradeoff.
3. Three.js Water Pro — *Changelog* (docs, 2025–2026).
   https://docs.threejswaterpro.com/changelog.html — explicitly *"replaced the old shallow/deep color model
   with Beer–Lambert absorption"* and added a *"depth-based shoreline foam system,"* confirming the 2025–26
   industry shift from a two-color lerp to physical absorption — the model adopted geometrically in §2.B.1.
4. three.js — *TSL Specification* (docs, r17x, 2025–2026).
   https://threejs.org/docs/TSL.html — `viewportSharedTexture()` (resample the already-rendered frame,
   preserving render-order), `viewportLinearDepth()`, and `viewportSafeUV()` (the depth-comparison screen-UV
   that stops in-front geometry smearing onto a refractive surface). The exact node set for the §2.C
   refraction path and the future WebGPU port.
5. Maxime Heckel — *Field Guide to TSL and WebGPU* (2025).
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (mirror:
   https://daily.dev/posts/field-guide-to-tsl-and-webgpu-ldfojiux9) — TSL glass/refraction `Fn()` materials,
   the depth-aware screen-UV refraction recipe, and WebGL/WebGPU dual output that defines the post-judge
   migration lane for the refraction option.
6. Maxime Heckel — *Refraction, dispersion, and other shader light effects* (2025).
   https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/ — FBO
   refraction, per-channel IOR chromatic aberration, Fresnel and specular; the reference for *why* 1-tap
   refraction needs content behind the surface (and therefore why it is wrong for the void-backed pool).
7. Maxime Heckel — *Post-Processing Shaders as a Creative Medium* (2025-02).
   https://blog.maximeheckel.com/posts/post-processing-as-a-creative-medium/ — chromatic dispersion and
   compositing post effects; informs the "only HDR blooms" finish the pool shares.
8. Krapton — *Boosting React Three Fiber Mobile Performance in 2026: A Deep Dive* (2026-04).
   https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c —
   2026 mobile guidance: DPR capping, cutting shader/fill-rate work before geometry, avoiding extra render
   passes and memory crashes on mobile web — the §6 budget rationale.
9. nhtoby311 / WaterSurface — R3F interactive water component (active 2025).
   https://github.com/nhtoby311/WaterSurface — `WaterSurfaceSimple/Complex` with the explicit "planar
   reflection is expensive in medium and complex scenes" warning that motivates the no-FBO / no-planar-
   reflection pick.
10. The Front Dev — *Workflow from Shadertoy to React Three Fiber (R3F)* (2025).
    https://www.thefrontdev.co.uk/workflow-from-shadertoy-to-react-three-fiber-r3f/ — porting fbm/noise
    fragment fields into r3f `onBeforeCompile`/shaderMaterial, the path used for the §4.4 ember field.
11. Codrops — *80s Business Tech and Seamless Scene Transitions: Inside Shader.se's Scroll-Driven WebGPU
    Pipeline* (2026-05-19).
    https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
    — current (2026) scroll-driven WebGPU + post-compose pipeline; corroborates the single-merged-pass
    finish and the WebGPU-as-future-not-now stance.

---

## 9. DEEP-DIVE CANDIDATES

1. **Geometric vs baked-attribute thickness for non-radial pools.** The §2.B.1 radial well is perfect for a
   round pool; a stone-lipped irregular scrying basin wants a painted `aThickness` vertex attribute (or a
   tiny baked grayscale ramp packed into a vertex color). Compare authoring cost, the seam at the stone lip,
   and whether a signed-distance-to-edge computed in the vertex stage beats a baked attribute.
2. **Pointer-driven single-ring ripple (the "scry" interaction).** A capped, dt-damped expanding ring at
   `U.uPointer` (the eye/finger resting on the pool) added to `gwPoolH`, so the act of *looking* disturbs
   the mirror and momentarily reveals more ember. Tune so it reads as "the pool responding," never as a
   playable water toy — the amplitude-cap discipline applied to interaction.
3. **The reflected-wordmark A/E-in-water case.** If `/voice` floats a reflected GAELWORX mark over the pool,
   the A/E must route through `gw_divineFire` (never cools, ignores `uTemp`) while the rest of the
   reflection reads `gw_forge` — and the divine-fire reflection should *not* be absorbed by Beer–Lambert
   (it is a reflection on the surface, not light from below). Specify the branch and the compositing order.
4. **TSL `viewportSafeUV` refraction as the post-judge upgrade.** When the renderer migrates to WebGPU
   (docs 50/51), revisit §2.C: with `viewportSafeUV` solving the in-front-smear artifact for free, a 1-tap
   refraction of the *slab back wall* (which does have structure) could add genuine depth. Benchmark on the
   iOS-WebGPU stability matrix (doc 54) before adopting.
