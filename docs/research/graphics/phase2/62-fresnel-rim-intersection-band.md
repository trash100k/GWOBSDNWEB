# 62 — Fresnel Hot-Rim + Depth-Intersection Skin-Tear Edge Band

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **C-flow-pour** · target: iPhone 15 OLED,
one WebGL2 renderer (r3f + three.js + pmndrs `postprocessing`), warm-forge palette._
_Author lane: senior real-time-graphics / technical art · all cited sources 2025–2026._

> **What this doc owns.** Two surface-edge signals that, together, make the molten metal read as a living,
> tensioned, *physical* body rather than a glowing decal: **(1) a Fresnel-weighted hot rim** that brightens
> the molten surface at grazing angles — the optical signature of surface tension on an incandescent skin —
> and **(2) a depth-intersection white-hot "skin-tear" band** that ignites the contact line where the moving
> pour meets cooler standing geometry (the channel→letter mouth, the meniscus front against the basalt wall,
> the pour lapping the slab). Phase-1 doc `01-molten-metal-surface.md §4.4` already sketched a rim-Fresnel
> one-liner and named "surface-tension & crust modeling" as a candidate; doc `18-meniscus-wet-front-physics`
> and doc `19-channel-letter-handoff-seam` named the contact tear as the seam that sells the pour. This doc
> resolves both as **one coupled edge system** built on the shared master temperature, noise, and uniform
> pool — the rim is a *material* term (cheap, ships everywhere), the tear is a *depth* term (needs the
> composer depth pass on `high`, falls back to rim-only on `low`). It does **not** re-derive the temperature
> ramp (cohesion §1 / doc 01), the cooling clock (doc 02), the meniscus bulge (doc 18), or the smin bridge
> (doc 19) — it is the **bright contact skin** layered over those.

---

## 1. SCOPE — this element in the GAELWORX world

A river of molten metal pours from the stone altar, winds the Celtic-interlace channels, and fills the
`GAELWORX` letterforms. Everywhere that river has a **surface** and everywhere it **touches something
colder**, two things happen in real molten metal that the brief demands we reproduce:

1. **Surface-tension skin tension at grazing angles.** Look across a pool of molten metal at a shallow angle
   and the rim — the part of the surface curving away from you — reads *brighter and hotter*, because you are
   seeing more incandescent depth through the skin and because the tensioned meniscus bends light back toward
   you. This is the Fresnel response of an emissive, semi-translucent, surface-tension-bound fluid. Without
   it, the molten plane reads flat and matte, like glowing paint. With it, the metal has a **rounded, heavy,
   skinned edge** — it reads as a *body* with volume. This is the rim term, and it lives entirely in the
   molten material's own fragment shader.

2. **The white-hot tear where hot metal meets cold geometry.** Where the advancing pour-front laps against
   the cooler basalt channel wall, where the molten neck necks down into a letter mouth (doc 19), where the
   fresh fill meets the already-solidified iron-black tail of a glyph — there is a razor-thin line of *maximum
   incandescence*. Physically it is the contact discontinuity: the hottest, freshest metal is exactly at the
   leading interface, and the skin has not yet formed there, so it tears open and the white-hot interior
   shows through. Visually it is the single most "alive" cue in the whole pour — a glowing seam that travels
   with the front and ignites on contact. This is the **depth-intersection band**: it requires knowing, per
   pixel, the depth of the *other* geometry behind the molten fragment, so it is a depth-buffer effect.

Both belong to cluster **C-flow-pour** because they are the *edges of the flowing body* — the rim is the edge
in screen-grazing, the tear is the edge in depth-contact. Together they are why the pour reads as a tensioned,
self-illuminating liquid that **reacts to what it touches**. Get them wrong and the most cinematic beat — the
white-hot front arriving at the `G` — reads as two flat shaders kissing (the exact failure doc 19 guards
against). Get them right and the metal is singular, heavy, and **hot precisely at the contact**, which is
where the eye looks.

The keystone exception threads through both: where the contact feeds the first `A` or first `E`, the tear
band is not the cooling white-hot ramp but the **eternal white-gold divine fire** — the same first-A/first-E
rule as the DOM `.forge-letter` ignite (cohesion §1.4, §7 rule 5).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The system decomposes into two independent signals — **(A)** the view-grazing rim (a material-local term) and
**(B)** the depth-contact tear (a depth-buffer term) — plus **(C)** the question of *where each is computed*
(in-material vs. post-pass) and **(D)** the WebGPU/TSL forward path. Honest tradeoffs below.

### 2A. The Fresnel hot-rim (view-grazing brighten)

**2A.1 — In-material Fresnel from `dot(normal, viewDir)` (recommended).** The canonical rim term, re-surfaced
across every 2025-2026 three.js teaching resource. The Three.js Roadmap _Rim Lighting Shader_ (Dec 2025)
states the exact GLSL: `float rim = 1.0 - max(0.0, dot(normal, viewDir)); rim = pow(rim, rimPower) *
rimIntensity;`. In our `onBeforeCompile` molten material we already have `vNormal` and `vViewPosition`
(the view-space fragment position three.js provides), so `viewDir = normalize(vViewPosition)` and the rim is
**three ALU ops plus a `pow`** — effectively free. It rides on top of the existing temperature ramp by
*biasing the temperature input upward* at the rim (`gw_forge(heat + rimBoost)`) rather than adding a separate
color, so the rim is the **same metal, one band hotter** — guaranteed cohesion. **Quality:** high; this is the
single term that gives the molten plane a rounded, skinned edge. **Perf:** negligible. **Mobile:** ideal —
ships on every tier including `static`. **Fit: the always-on half of the system.**

**2A.2 — Fresnel-Schlick with a bias/scale/power triple (the "ultimate control" variant).** The OtanoStudio
_Fresnel-Shader-Material_ (r3f, maintained 2025) and the classic `bias + scale * pow(1 - dot(N,V), power)`
form give independent control of the rim's floor, gain, and falloff width. Useful when art direction wants a
*wide soft* rim (low power) on the calm pool vs. a *tight bright* rim (high power) on the churning pour. We
adopt the `power`/`intensity` pair and expose `bias` only if needed — the extra knob is cheap. **Quality:**
high, more tunable. **Perf:** identical. **Fit: the parameterization we ship.**

**2A.3 — Normal-perturbed Fresnel (skin micro-tension).** Because our molten normal is already perturbed by
the `dFdx`/`dFdy` of the heat field (doc 01 §4.4 NORMAL block), the Fresnel computed from that *perturbed*
normal automatically brightens the rims of individual convection cells, not just the silhouette — so each
bubbling cell gets its own tensioned hot edge. This is the upgrade that makes it read as *skin tension* rather
than *outline glow*: the rim follows the boil. **Quality:** highest "alive skin" read. **Perf:** free (reuses
the normal we already compute). **Fit: use the perturbed normal, not the geometric one.**

**2A.4 — Matcap / baked rim (reject).** A matcap texture can fake rim light cheaply, but it bakes a *fixed*
light direction and cannot couple to `uTemp` or the divine-fire exception, and it needs a texture load. The
analytic Fresnel is cheaper, fully coupled, and zero-asset. **Reject** for the molten body (matcaps stay a
tool for the cold cast plinths if ever needed).

### 2B. The depth-intersection tear band (contact line)

**2B.1 — In-material scene-depth compare (recommended for the molten mesh itself).** The classic stylized-water
"intersection foam" move, alive across 2025 three.js water work (Harry Alisavakis' stylized-water lineage; the
2025 three.js-forum toon-water-with-intersection-foam threads): bind the scene's `depthTexture` as a uniform,
sample it at the fragment's screen UV (`gl_FragCoord.xy / resolution`), linearize both the sampled scene depth
and the fragment's own depth to view-space, and the **band is a smoothstep of their difference**: where the
molten fragment is *very close in depth to the geometry behind it*, the surfaces are intersecting → ignite.
`float diff = sceneZ - fragZ; float band = 1.0 - smoothstep(0.0, uBandWidth, diff);`. The molten material
already renders into the scene, so it can read the depth target the renderer fills. **Quality:** high, true 3D
contact. **Perf:** one depth tap + two linearizations per molten fragment. **Mobile:** affordable on `high`
(needs `renderer.depthTexture` / a `DepthTexture` attached). **Complexity:** medium — requires a depth target,
and the molten mesh must read it without reading-and-writing the same buffer. **Fit: the band on the molten
surface where it laps standing geometry.**

**2B.2 — Post-pass depth-intersection via a pmndrs custom `Effect` with the DEPTH attribute (the high-tier
hero path).** pmndrs `postprocessing` custom effects can declare `EffectAttribute.DEPTH`, which makes the
composer hand the effect a depth texture and a depth-aware `mainImage(inputColor, uv, depth, outputColor)`
with `readDepth(uv)`, `getViewZ(depth)`, `cameraNear`/`cameraFar` provided automatically (confirmed from the
pmndrs _Custom Effects_ wiki, current 2025). A post-pass can compute the tear band against the *whole composited
scene depth* — so it ignites contact lines the molten material alone can't see (e.g. the meniscus against a
letter wall on an adjacent draw). This is the path that also drives the **heat-haze mask** (doc 28) and the
**half-res volumetric composite** (doc 31), so the depth pass is *already paid for on `high`* — the tear band
is a near-free rider on a buffer the composer already produces. **Quality:** highest, scene-wide. **Perf:** the
depth texture is the cost, shared with haze/god-rays/DOF; the band math is a handful of ops in the merged
`EffectPass`. **Mobile:** `high`-tier only (the depth pass is the gate). **Fit: the scene-wide tear on `high`,
keyed off the same depth buffer doc 28/31 require.**

**2B.3 — WebGPU/TSL depth-map scan (forward path).** The Codrops _WebGPU Scanning Effect with Depth Maps_
(2025-03-31) ships the TSL idiom for reading scene depth and driving an edge/scan line from a depth threshold
in a renderer-agnostic node graph; r17x+ exposes scene depth via `pass(scene,camera).getDepthNode()` /
`viewportDepthTexture`, and MRT (`mrt({ output, emissive })`) can isolate the emissive that the band keys off.
This is where the system eventually ports, but the judge ships WebGL2; **author the band math portable, ship
GLSL now** (cohesion §10). **Fit: the post-judge port, not the Phase-2 build.**

**2B.4 — Analytic arc-length contact (no depth — the `low`/`static` substitute).** When the depth pass is off,
the *one place the tear matters most* — the channel→letter mouth — is already a **known arc-length value**
(doc 19's `uPourFront` vs the mouth arc). So on `low`/`static` we synthesize the tear **analytically**: a thin
white-hot band placed at `abs(localArc - frontArc) < ε` along the pour axis, with **no depth read at all**.
It's not scene-general (it only lights the authored contact lines), but those are exactly the contacts the
camera cares about. **Quality:** good for the scripted pour; can't catch incidental contacts. **Perf:** ~free.
**Fit: the rim-only-tier's tear stand-in — analytic, keyed to the shared pour clock.**

### 2C. Where each signal is computed

| Signal | In-material | Post-pass | Verdict |
|---|---|---|---|
| **Rim (2A)** | ✅ cheap, couples to `uTemp`/normal/A-E | ✖ can't see surface normal post-tonemap | **in-material, always on** |
| **Depth tear (2B)** | ✅ on the molten mesh (2B.1) | ✅ scene-wide, shares haze/DOF depth (2B.2) | **material tear on the pour; post tear on `high`** |

The split is deliberate: the **rim is a property of the molten skin** (it must read the surface normal, which
only exists pre-tonemap in the material), so it is in-material and ships on every tier. The **tear is a
property of contact between surfaces** (it must read *other* geometry's depth), so its richest form is the
post-pass that already owns the depth buffer on `high`, with an in-material variant on the molten mesh for the
pour's own lapping, and an analytic stand-in when depth is off.

### 2D. The cohesion constraint that decides everything

Neither signal may invent its own orange, noise, or clock. The rim brightens by **biasing the temperature
input** into the shared `gw_forge` ramp (not by adding a hand-picked color); the tear ignites by **clamping the
temperature input toward the top band** (white-hot, or `gw_divineFire` at an A/E). Both modulate the *same*
master temperature signal through the *same* ramp — so the rim and tear are the same metal as the body, just
hotter samples of one curve. This is the rule that keeps them from reading bolted-on (cohesion §1, §7 rules
1–3).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship the Fresnel hot-rim as an always-on in-material term (2A.1 + 2A.2 + 2A.3, computed from the perturbed
molten normal), and ship the depth-intersection tear as a two-form effect: an in-material scene-depth compare
on the molten mesh for its own lapping contacts (2B.1) plus a pmndrs DEPTH-attribute post-pass tear keyed off
the shared depth buffer on `high` (2B.2); on `low`/`static` the post tear is replaced by the analytic
arc-length contact (2B.4), and on `static` the whole system freezes to a mid-pour still. Every brighten/ignite
is a temperature-input bias into the shared `gw_forge` ramp, with the A/E mouths routed to `gw_divineFire`.**

Concretely the data path is:

```
molten fragment ─┬─ rim   = pow(1 - dot(perturbedN, viewDir), uRimPow) * uRimInt   → bias temp up
                 └─ tear  = 1 - smoothstep(0, uBandW, sceneZ - fragZ)              → clamp temp to top band
                            (high: also driven scene-wide by the post DEPTH pass)
heat' = clamp(heat + rim*uRimBoost, 0, 1.2)              // rim: same metal, one band hotter
heatTear = mix(heat', 0.99, tear)                         // tear: white-hot contact skin
metal = mix( gw_forge(heatTear), gw_divineFire(flick), uIsAE )   // A/E exception, eternal white-gold
```

**Why this and not alternatives.** GAELWORX is a *designed, sacred* pour, lit only by the metal, on a strict
iPhone-15 fill-rate budget. The in-material Fresnel is the cheapest possible way to give the molten body a
tensioned skinned edge and it couples to `uTemp` and the divine-fire exception for free — a matcap (2A.4)
can't. The depth tear's richest form (2B.2) is a *free rider* on the depth buffer the heat-haze (doc 28) and
the half-res volumetric (doc 31) already force into existence on `high`, so we pay for the depth pass once and
three effects consume it — exactly the cohesion contract ("the palette *is* the bloom selector, the heat mask,
and the light source list, all in one," cohesion §3.1, extended here to the depth buffer). The analytic
fallback (2B.4) reuses doc 19's arc-length clock, so the `low` tear is the same data as the `high` tear, just
without depth. Everything reuses the codebase idioms (`onBeforeCompile`, `gw_*` GLSL, `v3(PAL.*)`, dt-damped
store uniforms, `dispose()` on unmount, tier-gated `#define`) with **zero new npm dependency**.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three@^0.169` (repo pin): `MeshPhysicalMaterial` + `onBeforeCompile`; `THREE.DepthTexture` +
  `WebGLRenderTarget` for the molten-mesh depth read (2B.1); the renderer's existing depth output for the
  post pass.
- `@react-three/fiber ^8.17`, `@react-three/drei ^9.114`, `@react-three/postprocessing ^2.16` (wrapping
  pmndrs `postprocessing ^6.3x`) — **all already present.** The post tear is a custom `Effect` subclass
  declaring `EffectAttribute.DEPTH` (pmndrs Custom-Effects API), merged into the existing `EffectPass`.
- Reuse in-repo: `gw_*` shared GLSL (`shaders.js`: `gw_tempColor`, `gw_tempEmissive`, `gw_forge`, `gwCool01`,
  `gw_divineFire`, `gw_fbm`), `PAL`/`v3` (`palette.js`), the master `U` pool (`forgeUniforms.js`),
  `forge`/`damp` (`store.js`). **No new dependency; one new custom Effect file + one shared GLSL helper.**

### 4.2 The shared GLSL — add a rim+tear helper to `shaders.js`

Append next to `gw_forge` so the molten surface, the channel metal, the letterform fill, and the post tear all
import ONE implementation. Both signals return a scalar that *biases the temperature input* — they never emit a
color of their own.

```glsl
// --- Fresnel hot-rim: grazing-angle brighten of the molten skin. ---
// N = the PERTURBED molten normal (rims follow the boil, not just the silhouette).
// V = normalize(vViewPosition) (view-space dir to camera). Returns 0..1.
float gw_rim(vec3 N, vec3 V, float power, float bias){
  float f = 1.0 - max(dot(normalize(N), normalize(V)), 0.0);
  return clamp(bias + pow(f, power), 0.0, 1.0);     // bias = soft floor; power = falloff width
}

// --- Depth-intersection tear: 1.0 exactly at a contact line, 0.0 away from it. ---
// fragZ / sceneZ are LINEAR view-space depths (negative-Z, camera looking down -Z).
// bandW = contact thickness in view units. Returns 0..1, peaked at contact.
float gw_tear(float fragZ, float sceneZ, float bandW){
  float diff = abs(sceneZ - fragZ);                 // small when the surfaces touch
  return 1.0 - smoothstep(0.0, bandW, diff);        // 1 at contact, falls off across bandW
}

// Linearize a [0,1] depth sample to view-space Z (perspective). Mirrors three's helper.
float gw_viewZ(float depth, float near, float far){
  return (near * far) / ((far - near) * depth - far);
}
```

### 4.3 The molten material injection (extends doc 01 §4.4)

The rim and the molten-mesh tear are added to the existing COLOR block. The rim uses the **perturbed** normal
(already computed in the NORMAL block, carried as `normal`); the tear needs the scene depth target bound and
the fragment's own view-Z.

**HEAD (fragment), add to doc 01's uniforms:**
```glsl
uniform float uRimPow, uRimInt, uRimBias, uRimBoost; // rim shape + how hot the rim biases
uniform float uBandW, uTearBoost;                    // tear thickness + ignite strength
uniform float uIsAE;                                 // 1.0 if this surface feeds the first A/E
uniform sampler2D uSceneDepth;                       // bound depth target (high only)
uniform vec2  uResolution; uniform float uNear, uFar;
uniform int   uTearOn;                               // 0 on low/static (rim-only fallback)
```

**COLOR (before `#include <tonemapping_fragment>`), replacing doc 01's rim line:**
```glsl
// --- existing body heat (doc 01: tension plateau + crust + uTemp) ---
float heat = clamp(uTemp * (0.55 + 0.65*skin) - crust*0.25, 0.0, 1.2);

// --- (A) Fresnel hot-rim: bias the SAME ramp upward at grazing angles (perturbed normal) ---
vec3  V    = normalize(vViewPosition);
float rim  = gw_rim(normal, V, uRimPow, uRimBias) * uRimInt;
heat += rim * uRimBoost;                              // rim = same metal, one band hotter

// --- (B) depth-intersection tear: white-hot contact line (high tier only) ---
float tear = 0.0;
if (uTearOn == 1) {
  vec2  sUv   = gl_FragCoord.xy / uResolution;
  float dRaw  = texture2D(uSceneDepth, sUv).x;        // depth of geometry BEHIND this fragment
  float sceneZ= gw_viewZ(dRaw, uNear, uFar);
  float fragZ = -vViewPosition.z;                      // our own view-space depth (positive)
  tear = gw_tear(fragZ, gw_viewZ(/*self*/ gl_FragCoord.z, uNear, uFar), uBandW); // see note
  // (in practice: compare sceneZ to this fragment's view-Z; band peaks where they meet)
  tear = gw_tear(sceneZ, -vViewPosition.z, uBandW);
}
float heatTear = mix(clamp(heat,0.0,1.2), 0.99, tear * uTearBoost); // ignite to white-hot at contact

// --- temperature → color → HDR, with the keystone A/E exception ---
float flick  = gw_fbm(vWorld.xy * 5.0 + uTime * 0.4) * 0.5 + 0.5;
vec3  molten = gw_forge(heatTear);                    // shared ramp; only top band > 1 → blooms
vec3  divine = gw_divineFire(flick);                  // eternal white-gold for the first A/E
vec3  metal  = mix(molten, divine, uIsAE);
gl_FragColor.rgb += metal * (1.0 + uSurge);
```

> **Depth-read note (pitfall #4 below):** a fragment cannot sample the depth buffer it is *currently writing*.
> The molten mesh therefore reads a **separate depth pre-pass target** (the standing geometry rendered to a
> `DepthTexture` before the molten draw), or — cleaner — the tear is driven by the **post-pass** (4.4) which
> reads the composer's finished depth. On `high` we prefer the post-pass tear for scene-wide contacts and use
> the in-material tear only for the molten body lapping itself.

### 4.4 The post-pass tear — a pmndrs DEPTH custom effect (`ForgeTearEffect.js`, high tier)

This is the hero path: a custom `Effect` that declares `EffectAttribute.DEPTH`, so the composer provides the
depth buffer and the depth-aware `mainImage`. It re-ignites *any* near-contact between the hot emissive and
standing geometry, scene-wide, and merges into the existing `EffectPass` (no extra pass — it rides the depth
already required by heat-haze doc 28 and the volumetric doc 31).

```js
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'

const frag = /* glsl */`
  uniform float uBandW;      // contact thickness (view units)
  uniform float uTearInt;    // ignite strength
  uniform vec3  uTearHot;    // v3(PAL.hot) — the white-hot tear color (HDR > 1, blooms)
  // 'depth' arg is the scene depth at this uv (pmndrs provides readDepth/getViewZ).
  void mainImage(const in vec4 inputColor, const in vec2 uv,
                 const in float depth, out vec4 outputColor){
    float here = getViewZ(depth);                 // view-Z under this pixel
    // sample neighbor depths → a contact line is where view-Z changes sharply AND
    // the pixel is hot (luminance gates to the molten front, cohesion: palette = selector).
    float dx = abs(getViewZ(readDepth(uv + vec2( 1.5,0.0)/resolution)) - here);
    float dy = abs(getViewZ(readDepth(uv + vec2(0.0, 1.5)/resolution)) - here);
    float edge = smoothstep(uBandW*0.4, uBandW, max(dx,dy));      // depth discontinuity = contact
    float lum  = dot(inputColor.rgb, vec3(0.2126,0.7152,0.0722)); // same luminance bloom/haze use
    float hot  = smoothstep(0.55, 1.15, lum);                     // only the hot front qualifies
    float tear = edge * hot * uTearInt;
    outputColor = vec4(inputColor.rgb + uTearHot * tear, inputColor.a); // HDR add → blooms
  }`

export class ForgeTearEffect extends Effect {
  constructor({ bandW = 0.06, intensity = 1.0, hot = [1.9, 1.25, 0.7] } = {}) {
    super('ForgeTearEffect', frag, {
      attributes: EffectAttribute.DEPTH,                 // → composer binds depthBuffer + provides 'depth'
      uniforms: new Map([
        ['uBandW',   new Uniform(bandW)],
        ['uTearInt', new Uniform(intensity)],
        ['uTearHot', new Uniform(hot)],                  // == v3(PAL.hot); A/E uses PAL.divine variant
      ]),
    })
  }
}
```

The r3f wrapper mounts it inside the existing `<EffectComposer>`, **before Bloom** (so the freshly-ignited tear
blooms exactly like the rest of the hot band — cohesion §6 post order: light before grade):

```jsx
const Tear = wrapEffect(ForgeTearEffect)
// inside <EffectComposer>:  HeatHaze → DOF → GodRays → <Tear/> → Bloom → … (tear ignites, then blooms)
function ForgeTear() {
  const ref = useRef()
  useFrame((_, dt) => {
    // band width breathes with heat; strike flares it (shared clock, dt-damped)
    ref.current.uniforms.get('uBandW').value   = damp(ref.current.uniforms.get('uBandW').value, U.uBandW.value, 3, dt)
    ref.current.uniforms.get('uTearInt').value = 0.85 + U.uHeat.value * 0.6   // strike surges the tear
  })
  return forge.quality === 'high' ? <Tear ref={ref} /> : null   // high only; low/static use analytic
}
```

### 4.5 The analytic arc-length tear (`low`/`static`, no depth)

When the depth pass is off, ignite the tear **only at the authored contact arcs** (the channel→letter mouths,
the pour-front), reusing doc 19's `uPourFront` axis — no depth read:

```glsl
// in the molten / slab material, low/static branch:
float frontArc = forgePourFront * uTotalLen;     // shared clock (U.uPourFront × U.uTotalLen)
float band     = 1.0 - smoothstep(0.0, uBandArc, abs(vLocalArc - frontArc));
float heatTear = mix(heat, 0.99, band * uTearBoost);
```

This lights the same contact lines the camera is scripted to watch, at ~free cost, with the same shared clock —
so the `low` tear and the `high` tear are *the same event*, one with depth and one without (cohesion §7 rule 9,
degrade uniformly).

### 4.6 The r3f component shape (`MoltenSurface.jsx` deltas)

```jsx
const TIER = { high: {tearOn:1, rimPow:2.5}, low: {tearOn:0, rimPow:2.2}, static:{tearOn:0, rimPow:2.2} }

const uniforms = useMemo(() => ({
  // ...doc 01 uniforms...
  uRimPow:{value:2.5}, uRimInt:{value:1.0}, uRimBias:{value:0.0}, uRimBoost:{value:0.22},
  uBandW:{value:0.06}, uTearBoost:{value:1.0}, uIsAE:{value:0.0}, uTearOn:{value:0},
  uSceneDepth:{value:null}, uResolution:{value:new THREE.Vector2()},
  uNear:{value:0.1}, uFar:{value:50},
}), [])

useFrame((state, dt) => {
  // ...doc 01 uTime / uTemp / uSurge...
  const t = TIER[forge.quality] ?? TIER.low
  uniforms.uTearOn.value = t.tearOn
  uniforms.uRimPow.value = t.rimPow
  // rim brightens with heat; strike surges both rim and tear in the SAME frame (cohesion proof)
  uniforms.uRimBoost.value = damp(uniforms.uRimBoost.value, 0.18 + U.uHeat.value*0.18, 4, dt)
  if (t.tearOn) {
    uniforms.uSceneDepth.value = depthTarget.depthTexture       // standing-geo depth pre-pass
    uniforms.uResolution.value.set(state.size.width*state.viewport.dpr, state.size.height*state.viewport.dpr)
    uniforms.uNear.value = state.camera.near; uniforms.uFar.value = state.camera.far
  }
})
```

### 4.7 Key uniforms & parameters (leva-tunable behind `?debug`)

| Uniform | Role | Default | Sweet spot |
|---|---|---|---|
| `uRimPow` | Fresnel falloff width (high = tight rim) | 2.5 | 2.0–3.5 |
| `uRimInt` | rim master gain | 1.0 | 0.8–1.2 |
| `uRimBias` | rim soft floor (wide glow) | 0.0 | 0.0–0.08 |
| `uRimBoost` | how many temp-bands the rim adds | 0.22 | 0.15–0.3 (more = molten edge "wells") |
| `uBandW` | tear contact thickness (view units) | 0.06 | 0.03–0.1 (too wide = puffy foam) |
| `uTearBoost` | tear ignite strength toward white-hot | 1.0 | 0.7–1.2 |
| `uIsAE` | A/E divine-fire exception flag | 0.0 | baked data, never string-matched |
| `uTearOn` | depth tear enable | tier | 1 high / 0 low+static |

### 4.8 How it hooks the shared master temperature system

Neither signal invents heat. The rim **biases the temperature input** `heat += rim * uRimBoost` and re-enters
the *same* `gw_forge` ramp — so a rim pixel is literally the body metal sampled one band hotter, blooming only
if it crosses 1.0 (the palette's HDR reservation does the rest, cohesion §3.1). The tear **clamps the
temperature input toward 0.99** (white-hot top band) `mix(heat, 0.99, tear)` — so a contact pixel is the
hottest sample of the *same* curve. Both read `U.uHeat`/`U.uTemp` (the shared pool) for their breathing and
strike-flare, so a strike (`forge.strikeAt`) surges the body, the rim, and the tear **in the same frame**
(cohesion §7 rule 6 — the synchrony is the cohesion proof). The A/E mouths route to `gw_divineFire` via the
same baked `uIsAE` data the wordmark, basalt reveal, and Ogham use (cohesion §1.4). Nothing here has its own
orange, noise, or clock.

---

## 5. COHESION — shared palette / lighting / uniforms

- **One temperature authority.** Rim and tear are *temperature-input modulations*, not colors. They funnel
  through `gw_forge` (= `gw_tempColor × gw_tempEmissive`) and the A/E exception through `gw_divineFire`
  (cohesion §1.4). A bright rim and a hot tear are *visibly the same metal* as the body because they sample
  the same ramp — the rim one band up, the tear at the top. No new hex enters anywhere.
- **One uniform pool.** The molten material and `ForgeTearEffect` bind the **same `U` references**
  (cohesion §4.2): `uTime`, `uHeat`, `uTemp`, `uPourFront`, `uBandW`. Mutating `U.uHeat.value` in
  `<ForgeDriver/>` flares the rim and the tear in lockstep with the channel front, the bridge (doc 19), and
  the cooling letters.
- **One noise basis.** The tear's flicker and the rim's micro-variation use shared `gw_fbm` at the shared
  `GW_FBM_OCTAVES` — the contact line's life is the same grain as the metal's flow (cohesion §2, §7 rule 2).
- **One HDR convention → one bloom selector.** The rim and tear only push above 1.0 in the white-hot band
  (`PAL.hot`/`gold`/`divine`), so the existing `mipmapBlur` bloom (`luminanceThreshold ≈ 0.55`) catches the
  ignited contact and the welling rim *exactly* as it catches the channel front — the palette IS the selector
  (cohesion §3.1, §5.1). Cooled iron and basalt stay ≤1 and true-black on OLED.
- **One depth buffer, three consumers.** The post tear (4.4) reads the **same depth buffer** the heat-haze mask
  (doc 28) and the half-res volumetric composite (doc 31) require on `high`. The depth pass is paid once; the
  tear is a near-free rider — the same economy as "the palette is the bloom selector AND the heat mask"
  (cohesion §3.1), extended to depth.
- **The keystone, expressed identically.** A contact feeding the first `A`/`E` routes to `gw_divineFire`
  (`uIsAE=1` / `uTearHot = v3(PAL.divine)`) — the same first-A/first-E rule as the DOM `.forge-letter`, the 3D
  wordmark `aIsAE`, the basalt reveal, the Ogham legibility, and the smin bridge (cohesion §1.4, §7 rule 5).
  The white-gold tear pouring into the `A`/`E` is the *same divine fire*, established at the contact.
- **Lit only by the metal.** Both signals are emissive-as-light: the rim and tear output radiance >1 added
  before `#include <tonemapping_fragment>`, processed by the renderer's single AgX/ACES operator. No fill
  light, no second pass for them on `high` (they merge into the existing `EffectPass`). The ignited tear also
  raises the local luminance the `uAEFire` signal reads, so a divine-fire contact contributes to the basalt/
  Ogham reveal (cohesion §5.2).
- **One clock, dt-damped.** Every value animates via `THREE.MathUtils.damp(cur,tgt,λ,dt)` from `forge` — never
  `lerp`, never a second rAF. The tear travels with the front at constant velocity (Forge Reveal / Drift);
  scroll *flares* it via `uHeat`, never springs it (cohesion §7 rule 6, Brutalist-Snap motion law).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The whole system is designed so the **always-on half (rim) is free** and the **expensive half (depth tear) is
a free rider on a buffer `high` already pays for**, degrading to analytic/nothing below.

- **Rim cost: negligible, every tier.** Three ALU ops + one `pow` + one `mad` into the heat input, reusing the
  normal and `vViewPosition` the material already computes (doc 01). It ships on `high`, `low`, and `static`
  (frozen) — the molten body never loses its tensioned edge. This is the load-bearing "ships everywhere" half
  the brief asks for.
- **In-material tear cost (2B.1): one depth tap + two linearizations** on the molten fragments only (a small
  fraction of screen — the pour, not the void). Gated to `high`. Requires a **depth pre-pass** of standing
  geometry into a `DepthTexture` (the molten mesh can't read the buffer it writes — pitfall #4). On `high` we
  prefer the post-pass tear and use the in-material tear sparingly (the pour lapping itself).
- **Post tear cost (2B.2): near-zero marginal.** It declares `EffectAttribute.DEPTH`, which makes the composer
  hand it the depth texture — **but that texture already exists on `high`** for heat-haze (doc 28) and the
  half-res volumetric (doc 31). The pmndrs `EffectPass` **merges** the tear's fragment into the same fullscreen
  shader as the other compatible effects (cohesion §6), so it adds a handful of ops to a pass that already
  runs, not a new pass. The cost is ~4 depth taps (neighbor sampling) + a smoothstep + a luminance gate per
  pixel of the merged pass — sub-fraction of a millisecond. **This is the entire reason the scene-wide tear is
  affordable: it owns no resource of its own.**
- **Tier ladder (`high|low|static`):**
  - **high:** rim (perturbed normal) + post-pass depth tear (scene-wide) + in-material tear on the pour;
    `uBandW≈0.06`; A/E contacts white-gold. The cinematic contact ignite.
  - **low:** rim only **for the surface edge** + the **analytic arc-length tear** (4.5) at the authored mouths/
    front (no depth read, ~free). Drop `GW_FBM_OCTAVES` one (thins detail uniformly). Visually: the body still
    has its skinned edge and the pour still ignites at the scripted contacts; only incidental contacts go dark.
  - **static** (reduced-motion / weak GPU): rim baked into a frozen mid-pour pose; the analytic tear frozen at
    a single contact (the front bridging into a half-filled `G`); `uTime`=2, `frameloop='demand'`,
    `ForgeTearEffect` **unmounted** (no depth pass). A dignified still — the DOM Cinzel + `.forge-letter`
    wordmark remains the no-JS/AEO truth.
- **`renderer.info` discipline.** `render.calls` does **not** rise for the post tear (it merges into the
  existing `EffectPass`); it rises by **+1** only if a standing-geometry depth pre-pass is added for the
  in-material tear (so prefer the post path). `memory.geometries`/`textures` stay **flat** across the journey —
  no per-glyph allocation. If the depth target leaks, memory climbs; watch it across navigation (cohesion
  §4.3).
- **DPR + fill-rate.** Both signals are per-pixel, so they scale with the DPR cap (1.5 mobile, cohesion §10
  lever 1). The tear's neighbor depth taps respect `resolution` (the half-float buffer's size), and the
  post-pass can run at the composer's `resolutionScale` if the depth pass is downsampled (pmndrs
  `DepthDownsamplingPass` supports the depth-aware path) — keep the tear band wide enough that half-res depth
  doesn't alias it (`uBandW ≥ 2 px` in view units at the active DPR).
- **INP/compile insurance.** `renderer.compileAsync` the molten material and the `ForgeTearEffect` at boot so
  the first contact doesn't stall the scroll (cohesion §10). Alloc-free `useFrame`: pre-allocate the
  resolution `Vector2`, mutate in place; never `new` per frame.
- **Verify** with `qa-route`: SwiftShader compiles the GLSL in CI (0 console errors ≈ it compiled), then the
  **real read is the iPhone 15 OLED** — the welling hot rim, the white-hot contact bloom, the white-gold A/E
  tear, and the true-black void do **not** simulate headless.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls (each specific to this edge system):**

1. **Rim must bias temperature, not add a color.** If you add a hand-picked orange at the rim, it forks the
   world's palette and reads bolted-on the instant `uTemp` changes. Bias the *input* to `gw_forge` and let the
   shared ramp produce the color — the rim then cools and heats with the body automatically (cohesion §1).
2. **Use the PERTURBED normal for the rim, not the geometric one.** The geometric silhouette Fresnel gives a
   flat outline glow; the perturbed-normal Fresnel (the normal already bumped by the heat field, doc 01) makes
   every convection cell get its own tensioned hot edge — the difference between "outline" and "skin tension."
3. **`viewDir` is `normalize(vViewPosition)`, in view space.** three.js provides `vViewPosition` as the
   view-space position of the fragment; the direction to the camera is its normalized negative-or-direct form
   (three's convention — verify the sign on the device, a flipped rim reads as a dark core). Don't reach for
   world-space `cameraPosition` and a world normal unless you keep both in the same space.
4. **A fragment cannot read the depth buffer it is writing.** The molten mesh's in-material tear must read a
   **separate** depth target (a pre-pass of standing geometry), or the read is undefined/feedback. Prefer the
   **post-pass tear** on `high` (it reads the composer's finished depth, no feedback), and reserve the
   in-material tear for the pour lapping itself against a pre-pass target. This is the #1 silent bug.
5. **Linearize depth before differencing.** Raw depth-buffer values are non-linear (perspective). Differencing
   them directly makes the band thickness swim with distance from camera. Convert to view-Z (`gw_viewZ` /
   pmndrs `getViewZ`) first, then `smoothstep` — so `uBandW` is a real-world thickness, constant across the
   frame (pitfall the 2025 toon-water threads call out).
6. **Tear band width is a *contact* thickness, not a foam puff.** Too wide (`uBandW` large) and the tear reads
   as soft foam ringing every object — wrong for molten metal, which tears *sharp* at the leading interface.
   Keep it thin and gate it by luminance (only the hot front qualifies) so cold contacts (basalt-on-basalt)
   never ignite.
7. **Gate the tear by luminance so only the hot front ignites.** The depth discontinuity exists at *every*
   silhouette in the scene (cold basalt edges included). Multiplying the depth-edge by a luminance smoothstep
   (the same luminance bloom/haze use) restricts the ignite to where the metal is actually hot — the palette
   is the selector again (cohesion §3.1). Without this gate, the whole scene gets a contact outline.
8. **The tear must ignite BEFORE Bloom, not after.** Place `ForgeTearEffect` before Bloom in the chain so the
   freshly-ignited white-hot contact blooms like the rest of the hot band (cohesion §6: light before grade).
   After Bloom it would be a sharp un-bloomed line inside a soft scene — reads as a bug.
9. **A/E contact = divine fire, the same first-A/first-E rule.** A contact feeding the first `A`/`E` ignites
   white-gold (`uIsAE=1` / `uTearHot = v3(PAL.divine)`), never the cooling ramp — stamped from baked data,
   never string-matched in-shader (cohesion §1.4, §7 rule 5).
10. **Degrade the tear uniformly.** On `low`, don't drop the rim *and* the tear silently — keep the rim (free)
    and swap the depth tear for the analytic arc-length tear so the scripted contacts still ignite. A tier drop
    thins detail, it doesn't delete the beat (cohesion §7 rule 9).

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**

1. **Ship the rim first, in-material, on every tier.** Wire `gw_rim` from the perturbed normal, bias the
   temperature input, and confirm on a static `uTemp` slider that the molten plane gains a rounded, welling hot
   edge that *cools and heats with the body*. This is the cheap, always-on win — land it before any depth work.
2. **Tune the rim shape on the device through the tone-mapper** (`uRimPow`/`uRimBoost`), not on the raw value —
   the rim's hotness is judged after AgX/ACES + bloom (the #1 first-build mistake is authoring pre-tonemap).
3. **Stand up the depth buffer on `high`** (confirm heat-haze doc 28 / volumetric doc 31 already require it;
   if so, the tear is a rider — do not add a second depth pass).
4. **Add `ForgeTearEffect` (post, DEPTH attribute), before Bloom.** Render the raw `tear` scalar to the screen
   first (debug view) and confirm it lights *only* the hot-metal-meets-geometry contacts, not every silhouette
   — tune the luminance gate and `uBandW` until the band is a thin sharp contact line.
5. **Confirm linearized depth** makes `uBandW` constant across the frame (move the camera; the band must not
   swell with distance).
6. **Stamp the A/E contact flag**; verify a contact pouring into the first `A`/`E` ignites white-gold and
   eternal while other contacts ride the cooling ramp.
7. **Wire the analytic arc-length tear (4.5) for `low`/`static`**; confirm the scripted mouth/front contacts
   still ignite with the depth pass off, sharing the `uPourFront` clock.
8. **Strike test:** fire `forge.strikeAt`; confirm the rim, the tear, the channel front, and the cooling
   letters flare in the **same frame** (cohesion proof).
9. **Tier gate + dispose check:** rim everywhere; post tear on `high`; analytic on `low`/`static`; freeze the
   static mid-pour contact. Confirm `render.calls` doesn't rise for the merged post tear and `info.memory`
   stays flat across navigation.
10. **Device read on the iPhone 15 OLED** — the welling hot rim, the white-hot contact bloom, the white-gold
    A/E tear, and the true-black void do **not** simulate headless.

Order summary: **rim in-material (all tiers) → tune through tonemap → depth buffer on high → post tear before
bloom → linearize + gate by luminance → A/E exception → analytic fallback → strike sync → tier gate → device.**

---

## 8. SOURCES (2025–2026)

1. **Three.js Roadmap — _Rim Lighting Shader_, 2025-12.** The exact GLSL rim term
   `rim = pow(1.0 - max(0.0, dot(normal, viewDir)), rimPower) * rimIntensity;`, the `rimPower`/`rimIntensity`
   parameterization, and the `onBeforeCompile` / TSL hooks for injecting it into a stock material — the
   canonical 2025 reference for the Fresnel hot-rim. https://threejsroadmap.com/blog/rim-lighting-shader
2. **Three.js Resources — _Fresnel: the Glow on the Edges_ (Learn Practical TSL course, ch. 11), 2026.** The
   TSL fresnel node: `dot(transformedNormalView, positionViewDirection)` → `oneMinus` → `.pow(power)`,
   renderer-agnostic, with width/intensity control — the portable form to author for the WebGPU port.
   https://threejsresources.com/courses/tsl-threejs/11-fresnel
3. **Utsubo — _Migrate Three.js to WebGPU (2026): The Complete Checklist_, 2026-01.** TSL fresnel
   `const vDotN = dot(viewDirection, normalLocal); return pow(sub(1.0, vDotN), 3.0);` and the
   `Fn(([normal,viewDir,power]) => float(1).sub(normal.dot(viewDir).saturate()).pow(power))` node — the exact
   node pattern for the rim, plus the migration guidance for the eventual WebGPU/TSL port.
   https://www.utsubo.com/blog/webgpu-threejs-migration-guide
4. **pmndrs `postprocessing` — _Custom Effects_ wiki (current 2025).** The `EffectAttribute.DEPTH` declaration,
   the depth-aware `mainImage(inputColor, uv, depth, outputColor)` signature, and the provided
   `readDepth(uv)` / `getViewZ(depth)` / `cameraNear`/`cameraFar` / `depthBuffer` — the exact API the
   `ForgeTearEffect` post-pass uses to read scene depth and ignite the contact band inside the merged
   `EffectPass`. https://github.com/pmndrs/postprocessing/wiki/Custom-Effects
5. **React Postprocessing — _EffectComposer_ docs (pmndrs, 2025).** `DepthDownsamplingPass` / `resolutionScale`
   for depth-aware effects, and how the `DEPTH` attribute makes the `EffectPass` request a depth texture from
   the composer — confirms the tear rides the depth buffer heat-haze/volumetric already require.
   https://react-postprocessing.docs.pmnd.rs/effect-composer
6. **Codrops — _WebGPU Scanning Effect with Depth Maps_, 2025-03-31.** Reading scene depth in TSL/WebGPU and
   driving an edge/scan line from a depth threshold + smoothstep band — the modern 2025 reference for the
   depth-intersection band and the WebGPU/TSL port path (2B.3).
   https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
7. **Maxime Heckel — _On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for
   the Web_, 2025-06-10.** Working with the depth buffer through pmndrs post-processing effects, half-res depth,
   and blue-noise dither — establishes that the depth pass is the shared resource on `high` that the tear,
   heat-haze (doc 28), and volumetric (doc 31) all ride.
   https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
8. **Maxime Heckel — _Field Guide to TSL and WebGPU_, 2025-10-14.** TSL targets WebGL + WebGPU from one source;
   `glslFn`/`wgslFn`; WebGPU now in iOS Safari — the basis for authoring `gw_rim`/`gw_tear` portable so the
   judge ships GLSL and the port is a re-host, not a rewrite. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
9. **OtanoStudio — _Fresnel-Shader-Material_ (three.js + r3f, maintained 2025).** A drop-in Fresnel rim material
   with explicit `intensity` / `power` / `bias` controls — the `bias + scale·pow(1−dot(N,V), power)`
   parameterization (2A.2) the rim adopts. https://github.com/otanodesignco/Fresnel-Shader-Material
10. **three.js forum — _Toon water shader with depth based fog and intersection foam_ (2025-active) & Harry
    Alisavakis — _Stylized Water Shader_ (depth-difference intersection foam, re-surfaced through 2025).** The
    `(sceneDepth − fragDepth)/threshold` → `smoothstep` intersection-foam pattern and the linearize-before-
    differencing rule — the lineage the in-material tear (2B.1) and pitfall #5 derive from.
    https://discourse.threejs.org/t/toon-water-shader-with-depth-based-fog-and-intersection-foam/35978 ·
    https://halisavakis.com/my-take-on-shaders-stylized-water-shader/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The meniscus-coupled rim (shared with doc 18).** Couple the Fresnel hot-rim to the wet-front bulge: at the
   advancing meniscus the surface curves hard away from the camera, so the rim should *peak* there and shed the
   bright sparks of doc 15 — a unified "the front is the hottest, most-curved, most-tensioned edge" model that
   ties the rim, the meniscus normal, and the spark hand-off into one front signal.
2. **Normal-buffer tear (vs. depth-only) for grazing contacts.** A depth-only tear thins when two surfaces are
   nearly parallel to the view (small depth delta over a long contact). Adding a normal-discontinuity term
   (from a normal buffer, or `dFdx` of reconstructed normal) ignites grazing contacts depth alone misses —
   quantify the cost of a normal buffer vs. the quality gain on the oblique altar-approach contact.
3. **TSL/WebGPU MRT-driven tear (2B.3).** Port the tear to a TSL node graph reading
   `pass(scene,camera).getDepthNode()` and an isolated `mrt({ output, emissive })` emissive buffer (doc 28
   B-WebGPU), so the ignite keys off true emissive instead of composited luminance — measure the precision gain
   and the iOS-WebGPU stability (doc 54) against the WebGL2 luminance-gated path.
4. **Sub-pixel tear stability under half-res depth + DPR cap.** The contact line is a thin high-frequency
   feature; half-res depth (doc 31) and the 1.5 DPR cap can alias it into a crawling dotted line. A focused pass
   on temporal/blue-noise stabilization of the tear band (the doc 31 STBN lineage applied to a 1-pixel contact)
   so the seam stays a clean continuous line on the OLED, not a shimmering dashed one.
