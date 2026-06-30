# 30 — Depth-Aware Raymarched God-Ray Shafts with Correct Occlusion

_Phase-2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js r17x + pmndrs `postprocessing`)_

> **What this doc owns.** Phase-1 doc `18-volumetric-lighting-godrays.md` ranked the four god-ray
> families and picked a **hybrid**: screen-space radial-blur god-rays (techniques 2a/2b) as the
> mobile-safe base, with the **technique-2c depth-aware raymarch reserved as the `high`-tier upgrade**.
> It named that raymarch as deep-dive candidate #1. *This document is that build.* It specifies the full
> high-tier pass: reconstructing the world-space ray from the depth buffer, raymarching a cone/spot light
> volume, **sampling occlusion against the Cinzel letterform geometry and the basalt channel walls** so
> the shafts are correctly blocked (the metal letters cast god-ray shadows, the carved channels carve the
> light), blue-noise-dithered low step count to kill banding, half-res render with **depth-aware bilateral
> upsample**, and a **cone proxy** so the rays survive when the pour front drifts off-frame. It plugs into
> the shared master-temperature/uniform system from `00-COHESION-MAP.md §1` and `phase2/28-heat-mask-provenance.md`.
> The keystone: this pass is *the* mechanism by which "the metal is the only light" gets **body** — it
> turns the glow into a room full of lit smoke, and it is the literal implementation of the A/E "radiate
> light onto adjacent stone" brief, with the divine pair throwing a second, holier shaft.

---

## 1. SCOPE — the element in the GAELWORX world

In the forge there is no sun. The only light is the pour itself: the white-hot molten front travelling
left-to-right through the Celtic-interlace channels, the freshly-filled letter cores, and — above all —
the eternal divine-fire **A** and **E**. Phase-1 doc 18 established that volumetrics are *the single
biggest lever* for selling "the metal is the only light source in the room": without them the glow stops
at the geometry surface; with them the light has volume, the void has depth, and the chamber reads as a
cathedral full of forge-smoke.

The base radial-blur god-rays (doc 18 §3, technique 2a/2b) already streak warmth *from* the bright cores.
But radial blur is a **2D screen-space smear toward a point** — it knows nothing about the 3D scene. It
streaks *through* the standing Cinzel letterforms as if they were transparent, and it cannot make the
basalt channel walls throw shadow-shafts. The result reads as a glow overlay, not as light passing
through a real volume of smoke with real occluders in it.

**This pass fixes exactly that.** The depth-aware raymarch reconstructs each pixel's world position from
the depth buffer, marches a ray from the camera into the scene, and at every step asks two questions:
*how much glowing smoke is here* (an fBM in-scatter field driven by `uTemp`) and *is this point in shadow
from the light* (a shadow-map test against the letterforms + channel walls). The metal letters now cast
**volumetric shadows** — dark rakes between the bright shafts. The carved channels **carve the light**. A
spark drifting in front of the pour casts a thin moving shadow-finger. This is the AAA tier the brief asks
for (Active Theory / Lusion / Unseen caliber), and it is gated to `high` only — `low`/`static` keep the
cheap radial-blur path from doc 18.

The divine **A/E** get a **second raymarch source** with a whiter, tighter, brighter scattering profile
that *never cools* (`uDivine = 1.0`). Its shaft is the physical light that "reveals the carved Ogham for
the first time" — the same `uAEFire`/`uAEFirePow` signal that doc 22 (`ae-divine-stone-light-transport`)
and doc 24 (`ogham-relief-grazing-model`) consume on the stone side. The shaft and the stone-reveal are
**one light**, sampled by two systems.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Doc 18 surveyed the four families broadly. This deep-dive zooms into the **depth-aware raymarch** itself
and the sub-decisions inside it, all on 2025–2026 sources.

### 2.1 The canonical web reference: Heckel "On Shaping Light" (Jun 10 2025)

Maxime Heckel's *On Shaping Light* is the definitive modern web write-up of exactly this technique. Its
spine, confirmed in the 2025 article: a **post-processing pass that reconstructs world-space rays from the
depth buffer** and raymarches a (spot/cone) light volume, accumulating in-scattering with **shadow-map
occlusion**, **blue-noise-dithered step offsets** to kill banding at low step counts, and **downsampled
(½-res) rendering** for perf. Two load-bearing ideas the 2025 article stresses:

1. **Depth gives you the ray's far end.** Sample the depth buffer at the pixel's UV, reconstruct the
   world-space point (via `projectionMatrixInverse` then `viewMatrixInverse`), and that point is where the
   ray must **stop** — "stop raymarching earlier whenever sampling beyond the scene's depth." This is what
   makes the volumetric *occlude*: the light cannot continue through walls or objects, so you don't get
   atmosphere bleeding through solid geometry (the realism-breaking, perf-wasting failure he calls out).
2. **Shadow-map sampling inside the march** gives true occlusion *within* the volume — at each step,
   transform the world point into the light's clip space and compare against the light's depth map; if
   occluded, that step contributes no scatter. That is the dark-shaft-between-bright-shafts read.

- **Quality:** highest. True depth-aware shafts that respect occluders, fade with distance, and exist even
  when the source is off-screen (cone). The "AAA" tier.
- **Perf:** the heavy one — cost is `steps × pixels`; mitigated hard by ½-res + blue noise + early-out +
  low step count.
- **Mobile:** *possible* at ½-res / low steps; this is where you burn budget. `high` tier only.
- **Complexity:** high — coordinate-space transforms, shadow sampling, dithering, bilateral upsample.

### 2.2 The drop-in cousin: Ameobea `three-good-godrays` (maintained through three r182, 2026)

`three-good-godrays` is a pmndrs-`postprocessing`-compatible screen-space **raymarched** godrays pass that
samples the three.js shadow map for occlusion — the same math as Heckel, packaged. Its `GodraysPass`
params (confirmed current): `raymarchSteps: 60`, `density: 1/128`, `maxDensity: 0.5`, `distanceAttenuation:
2`, `color`, `edgeStrength: 2`, `edgeRadius: 2`, `blur: true`, `gammaCorrection`. It casts from a
**`PointLight` or `DirectionalLight`** and reads that light's shadow map directly (`BasicShadowMap`,
`PCFSoftShadowMap`, `VSMShadowMap` sampled directly; `PCFShadowMap` needs a depth-texture copy). Casey
Primozic's 2026 note *Updating three-good-godrays for Three.JS 0.182* documents the breaking changes the
r182 shadow-mapping modernization forced (native cube depth textures for `PointLight` shadows, depth-pack
internals) — directly relevant because **we ship on r17x and must pin against exactly this churn.**

- **Verdict for GAELWORX:** *valuable as a reference and a fast-path,* but it casts from a real
  shadow-casting light and pulls its own depth/shadow plumbing tied to three's shadow internals (which
  r182 just broke). For full palette/uniform control and to avoid betting the judge device on a dep that
  tracks three's shadow churn, we **hand-roll** the pass (Heckel-style) and use `three-good-godrays` as the
  cross-check oracle. We still borrow its **edge-aware blur** (`edgeStrength`/`edgeRadius`) idea for the
  upsample.

### 2.3 Blue-noise dithered low step count (Heckel cloudscapes lineage + demofox, 2025)

The decisive perf trick: instead of marching many uniform steps (banding-free but expensive), march **few
steps** and offset the *start* of each pixel's ray by a **blue-noise** value. Blue noise has "fewer clumps
than other noises and is less visible to the human eye," so the banding from a low step count is converted
into imperceptible high-frequency dither. Heckel's *Cloudscapes* and *On Shaping Light* both apply this;
the broader 2025 write-ups note you can get visually-similar results with **~1/16 the steps** when you
jitter + (optionally) temporally accumulate. We add a **per-frame temporal rotation** of the blue-noise
offset (golden-ratio increment) so the static dither pattern dissolves into motion — but *bounded*, since
we have no TAA history buffer on mobile.

### 2.4 Half-res render + depth-aware bilateral upsample (the half-res-without-halos problem)

Rendering the volume at ½-res (Heckel/Ameobea `halfRes:true`) roughly quarters the cost — the single
biggest win. The catch, well-documented across the depth-aware-upsampling literature the 2025 search
surfaced (c0de517e, hikiko's series): naive bilinear upsample **halos at depth discontinuities** — the
shaft bleeds a fringe across the silhouette of a letterform. The fix is a **depth-aware (bilateral)
upsample**: point-sample the 4 nearest half-res pixels, weight them by bilinear weights *times* a
depth-similarity term (down-weight half-res taps whose depth differs from the full-res pixel), normalize.
This keeps shaft edges crisp against the Cinzel silhouettes and the channel lips — exactly where GAELWORX
has hard geometry the rays must respect. `three-good-godrays`' `edgeStrength`/`edgeRadius` are its packaged
version of this idea.

### 2.5 Cone proxy for off-screen sources (the documented pmndrs limitation, still true 2025–2026)

The hard limitation that pushed doc 18 to a hybrid: screen-space godrays blur an **on-screen** source — "if
the source isn't on screen, there's nothing to blur." The pour front *scrolls off-frame* by design. Two
2025-era fixes carry into the raymarch: (a) the raymarch variant **doesn't depend on a screen-space source
point at all** — it scatters from a *world-space cone/spot volume*, so a source just outside the frustum
still throws rays into the visible volume; and (b) a **wide low-poly cone proxy** behind each bright core
guarantees the volume's apex stays near-frame. We keep the cone proxy from doc 18 §4b (it also seeds the
base radial-blur tier) and define the raymarch's light as a **world-space spot cone** (position + axis +
half-angle), not a screen point — so off-screen survival is structural, not a patch.

### 2.6 WebGPU / TSL node volumetrics (forward-looking, not the ship path)

The 2025–2026 WebGPU stack (Wawa Sensei's *How to Fake Godrays in Three.js — WebGPU + React + TSL*;
Heckel's *Field Guide to TSL and WebGPU*; three's `webgpu_postprocessing` MRT examples) expresses the same
raymarch as TSL nodes compiling to WGSL **and** WebGL, with MRT making the emissive/occlusion split nearly
free. **Quality equal-or-better; device-gated.** WebGPU on iOS Safari is still uneven in 2026, so per the
cohesion map's hard constraint this is the **migration target, not the base path** — we author the GLSL so
the `worldPos`/march/scatter maps cleanly to TSL later (a re-host, not a rewrite).

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Hand-roll a custom pmndrs `Effect` (CONVOLUTION attribute) that, on the `high` tier only, replaces the
base radial-blur god-rays with a depth-buffer raymarch through a world-space cone volume, occluded by a
shared shadow map of the letterforms + channel walls, blue-noise dithered at a low step count, rendered at
½-res and depth-aware-bilateral-upsampled.** Two cone sources — the warm pour-front and the whiter divine
A/E — share the pass (two cones in one loop, not two passes, to save a fullscreen pass on mobile). On
`low`/`static`, this pass is *not mounted*; doc 18's radial-blur `<GodRays>` carries those tiers.

**Why this pick, tied to the world + constraints:**

- **It is the only family that makes the metal letters cast real light-shadows.** The brand law is "the
  metal is the only light," and the most cinematic expression of a single embedded light is *shafts raking
  past solid occluders*. Radial blur can't do that; the depth-aware raymarch is built for exactly it.
- **It implements the A/E brief literally.** The divine cone's shaft *is* the light that reaches the
  adjacent basalt and reveals the Ogham. The shaft brightness and the stone-reveal both read
  `uAEFirePow` — one signal, the shaft in the air and the glow on the stone are causally the same light.
- **It reuses the shared systems wholesale.** In-scatter smoke = `gw_fbm`/`gw_caustic` from `shaders.js`
  (no forked noise). Ray color = `gw_forge(uTemp)` warm / `gw_divineFire` divine (no private orange). It
  reads the same `uTemp`/`uHeat`/`uSurge`/`uPourFront`/`uAEFire` from the Master Forge Uniform pool `U`.
  Nothing new is invented — it's the existing temperature/noise/palette system, marched through air.
- **It respects every non-negotiable.** One renderer, one composer, one extra pass (merged-incompatible by
  necessity — it's CONVOLUTION, like Bloom), gated by `useQuality`, no EXR, ½-res, dispose on unmount.

---

## 4. IMPLEMENTATION

### 4a. Libraries / versions

- `three` r17x (installed). The raymarch needs `camera.projectionMatrixInverse`, `camera.matrixWorld`,
  `camera.position`, and a `DepthTexture` on the scene render — pmndrs `postprocessing` already provides
  `depthBuffer` to a CONVOLUTION effect. **Pin three exactly**: the r182 shadow-internals churn (Primozic
  2026) means any shadow-map reads are version-fragile; our hand-rolled shadow uses a *plain* light-view
  depth render we own, decoupled from three's shadow system, to dodge that churn.
- `@react-three/postprocessing` + `postprocessing` (already in `Effects.jsx`). We subclass `Effect` and add
  it to the existing `<EffectComposer>` between Bloom and the grade (see chain order, §4f).
- A small precomputed **blue-noise tile** (64×64, RG channels). Bundle it as a tiny PNG via the existing
  asset path — *not* an EXR/HDR (honors the no-runtime-HDR constraint; a 64² 8-bit PNG is a few KB). Or
  generate it once at boot into a `DataTexture` (void-and-cluster), cached.
- **No new heavy deps.** `three-good-godrays` is kept *out of the bundle* and used only as a local
  cross-check during look-dev.

### 4b. The shared occluder shadow map (the occlusion source)

The pass needs to know "is world point `p` lit by the cone source, or shadowed by a letterform/channel
wall." We render **one small depth map from each cone source's viewpoint**, containing **only** the
shadow-casting geometry: the extruded Cinzel letterforms (doc 11/17) and the basalt channel walls (doc
20/21). This is a single extra `WebGLRenderTarget` depth render per source, at low res (512² on `high`),
updated only when geometry/camera-relevant state changes (the letters are static once cast; the channels
are static), so it is **effectively a one-time bake per route** — not a per-frame shadow render.

```jsx
// scene/ForgeRayShadow.jsx — owns one DepthTexture per cone source, baked on route settle.
// occluderScene contains ONLY letterform + channel meshes (a Layers channel, traversed once).
const rt = new THREE.WebGLRenderTarget(512, 512, { depthTexture: new THREE.DepthTexture(512,512) })
rt.depthTexture.format = THREE.DepthFormat
rt.depthTexture.type   = THREE.UnsignedShortType
// lightCam: an orthographic or perspective cam at the cone apex looking down the cone axis.
// Render occluders to rt ONCE per route change (geometry is static). Expose:
//   uShadowMap (depthTexture), uLightViewProj (lightCam.projectionMatrix * lightCam.matrixWorldInverse)
```

Because the letterforms and channels are **static within a route**, this depth map is baked on route
settle and frozen — zero per-frame shadow cost. Only the *march* runs per frame. (Moving occluders —
drifting sparks — are deliberately *not* in this map; their thin shadows aren't worth a per-frame
re-bake, and the fBM smoke hides their absence.)

### 4c. World-ray reconstruction from depth (Heckel 2025)

```glsl
// Reconstruct the world-space position of the scene point behind this pixel.
// uProjInv = camera.projectionMatrixInverse ; uViewInv = camera.matrixWorld (cam->world)
vec3 gw_worldFromDepth(vec2 uv, float depth){
  vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0); // NDC, depth in [0,1] -> [-1,1]
  vec4 view = uProjInv * clip;  view /= view.w;             // to view space (perspective divide)
  vec4 world = uViewInv * view;                              // to world space
  return world.xyz;
}
```

`depth` comes from the pmndrs-provided `depthBuffer`. For a perspective camera the divide by `view.w` is
mandatory (the #1 reconstruction bug is forgetting it and getting a skewed volume).

### 4d. The raymarch loop (two cones, blue-noise, shadowed, early-out)

```glsl
// CONVOLUTION Effect fragment. STEPS is a compile-time #define: 20 high.
uniform sampler2D uBlueNoise;     // 64x64 RG tile
uniform float uTime, uTemp, uHeat, uSurge;
uniform vec3  uCamPos;
uniform mat4  uProjInv, uViewInv;
// per cone: apex pos, axis (unit), cos(halfAngle), reach, intensity, divine flag
uniform vec3  uConePos[2];  uniform vec3 uConeAxis[2];
uniform float uConeCos[2];  uniform float uConeReach[2];
uniform float uConeAmt[2];  uniform float uConeDivine[2];
uniform sampler2D uShadowMap[2]; uniform mat4 uLightVP[2];

float gw_coneShadow(int i, vec3 p){
  vec4 lc = uLightVP[i] * vec4(p, 1.0);
  vec3 ndc = lc.xyz / lc.w;
  if(any(greaterThan(abs(ndc.xy), vec3(1.0).xy))) return 1.0;   // outside map = lit
  vec2 suv = ndc.xy * 0.5 + 0.5;
  float occl = texture2D(uShadowMap[i], suv).x;                 // nearest occluder depth
  float here = ndc.z * 0.5 + 0.5;
  return step(here - 0.0015, occl);                             // 1 lit, 0 shadowed (bias 1.5e-3)
}

float gw_coneScatter(int i, vec3 p){
  vec3  toApex = uConePos[i] - p;
  float dist   = length(toApex);
  vec3  dir    = toApex / max(dist, 1e-4);
  float inCone = smoothstep(uConeCos[i], uConeCos[i] + 0.06, dot(-dir, uConeAxis[i]));
  float fall   = exp(-dist / uConeReach[i]);                    // distance attenuation
  return inCone * fall;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outColor){
  float depth = texture2D(depthBuffer, uv).x;
  vec3  endP  = gw_worldFromDepth(uv, depth);
  vec3  ro    = uCamPos;
  vec3  rd    = endP - ro;
  float tMax  = length(rd);  rd /= max(tMax, 1e-4);
  tMax        = min(tMax, uMaxDist);                            // never march past the scene OR a cap

  // blue-noise start offset (temporal rotation by golden ratio so the dither dissolves)
  float bn   = texture2D(uBlueNoise, uv * uResolution / 64.0).r;
  bn         = fract(bn + uTime * 0.61803399);
  float step = tMax / float(STEPS);
  float t    = bn * step;

  vec3 acc = vec3(0.0);
  for(int s = 0; s < STEPS; s++){
    vec3 p = ro + rd * t;
    // smoke density: shared fbm, BOILS in place (time as warp offset, never scroll), rising bias
    float smoke = 0.55 + 0.45 * gw_fbm(p.xy * uHazeScale + vec2(0.0, -uTime*0.04) + gw_warp(p*0.5));
    for(int i = 0; i < 2; i++){
      float sc = gw_coneScatter(i, p) * gw_coneShadow(i, p) * smoke;
      // warm pour vs divine white-gold, from the SHARED temperature authority
      vec3 col = mix(gw_forge(uTemp), gw_divineFire(uSurge), uConeDivine[i]);
      acc += col * sc * uConeAmt[i];
    }
    t += step;
    if(t >= tMax) break;                                        // early-out at the occluder
  }
  acc *= step * uIntensity * (1.0 + uHeat * 0.4 + uSurge * 0.6); // strike flares the shafts
  outColor = vec4(inputColor.rgb + acc, inputColor.a);          // additive over the lit frame
}
```

Notes that matter:
- **The shadow term `gw_coneShadow` is what makes the letters occlude the smoke** — the dark rakes between
  shafts. It reads the baked occluder depth map (§4b), so it costs one `texture2D` per cone per step, no
  per-frame shadow render.
- **`tMax = min(scene-depth-distance, uMaxDist)`** is the depth-occlusion: the march stops at the first
  solid surface, so light never bleeds through the basalt back wall (Heckel's core point).
- **Smoke `boils`, never scrolls** — `uTime` enters as a warp offset (`gw_warp`) / 3rd-noise-dim, never
  added straight to a coordinate (cohesion-map §2 binding rule). Shares `gw_fbm`/`gw_warp` at the world's
  `GW_FBM_OCTAVES`.
- **Color is `gw_forge(uTemp)` / `gw_divineFire`** — never a literal orange. As `uTemp` cools, the warm
  shaft dims and reddens *in lockstep with the slab veins and the cooling letters*. The divine cone reads
  `gw_divineFire` and **never cools**.

### 4e. Half-res render + depth-aware bilateral upsample

The Effect's fragment runs at ½-res (pmndrs `resolutionScale: 0.5` on the pass, or render the raymarch to
a ½-res FBO and composite). The composite is **not** plain bilinear — it is depth-aware:

```glsl
// Upsample ½-res scatter to full res, rejecting taps across depth discontinuities (no halos on letter edges)
vec3 gw_bilateralUpsample(sampler2D loRes, sampler2D loDepth, vec2 uv, float fullDepth){
  vec2 px = 1.0 / uHalfResolution;
  vec3  sum = vec3(0.0); float wsum = 0.0;
  for(int y=0;y<2;y++) for(int x=0;x<2;x++){
    vec2 o = vec2(float(x), float(y)) * px;
    float d = texture2D(loDepth, uv + o).x;
    float w = exp(-abs(d - fullDepth) * uDepthSigma);  // down-weight taps at different depth
    sum += texture2D(loRes, uv + o).rgb * w;  wsum += w;
  }
  return sum / max(wsum, 1e-4);
}
```

`uDepthSigma` is tuned so a letterform silhouette (a hard depth step) cuts the bleed; the shaft edge stays
crisp against the Cinzel outline and the channel lip. This is the half-res-without-halos fix and the single
most important quality detail after the shadow term.

### 4f. The r3f component shape + chain order

- `scene/ForgeRayShadow.jsx` — bakes the occluder depth map per cone per route settle; exposes
  `uShadowMap[i]`/`uLightVP[i]`. Disposes RTs on unmount.
- `scene/ForgeRaymarchGodrays.jsx` — the cone source transforms (pour-front cone follows `uPourFront`; A/E
  cone follows `uAEFire`), the blue-noise texture, the custom `Effect` subclass. Mounted **only when
  `quality === 'high'`**; on `low`/`static` the doc-18 `<GodRays>` radial-blur path is used instead.
- Extend `scene/Effects.jsx`. **Chain order (cohesion-map §6, unchanged):**
  `HeatHaze → DepthOfField → GodRays(raymarch on high / radial on low) → Bloom → ChromaticAberration →
  HueSaturation → BrightnessContrast → Vignette → Noise(grain) → SMAA` — tone-map terminal on the
  renderer. God-rays sit **after** the lens passes and **before/with** Bloom-grade so the crushed-black
  grade and vignette still bite the shafts and the void stays true-black.

### 4g. Key uniforms & the master-temperature hook

Driven from the Master Forge Uniform pool `U` in the one `<ForgeDriver/>` `useFrame`, **`dt`-damped**:

| Uniform | Source (pool `U` / store) | Meaning |
|---|---|---|
| `uTemp` | `U.uTemp` (`scrollDamped + vel*0.25`) | warm-shaft color + brightness; cools the pour shaft |
| `uHeat` / `uSurge` | `U.uHeat` (strike `exp(-since*3)` + vel) | Brutalist-Snap flare on a strike, same frame as veins/bloom |
| `uConePos[0]` / `uConeAxis[0]` | `U.uPourFront` (xyz + axis) | pour-front cone tracks the moving molten front |
| `uConePos[1]` / `uConeDivine[1]=1` | `U.uAEFire` / `U.uAEFirePow` | divine A/E cone; never cools; same signal the stone reveal reads |
| `uHazeScale` | `sceneFor(route).smoke` | per-chamber smoke density (arch thick, pool calm) |
| `uIntensity` | `damp` of `sceneFor(route)` + `scrollDamped` | per-route/scroll shaft strength |
| `uTime` | `U.uTime` (frozen to `2` on static — but pass unmounted there) | boils the smoke |
| `uMaxDist` | const cap | bounds the march; also the off-screen cone reach |

**The single most important cohesion move:** the shaft color and intensity are read from the *exact same*
`gw_forge(uTemp)` / `gw_divineFire` / `uSurge` that drive the slab veins, the cooling letters, and the
sparks. One temperature, many surfaces — the shaft and the metal it pours from are the same fire.

---

## 5. COHESION

- **Palette:** shafts are authored *only* through `gw_forge(uTemp)` (warm pour: `PAL.ember`→`PAL.hot`) and
  `gw_divineFire` (white-gold A/E). No cool/green/blue cast (brand law). The green-black Connemara basalt is
  the *surface the rays rake across and the geometry that shadows them* — never a ray color.
- **Bloom symbiosis (one HDR convention, two consumers):** the raymarch scatters from the *same* HDR (>1)
  cores that `<Bloom luminanceThreshold≈0.55>` isolates and that doc 28's heat-mask thresholds. The
  palette's "only the 10% accent exceeds 1.0" rule means bloom, heat-haze mask, and god-ray source can't
  disagree about "what's hot." Push the molten/A-E emissive above 1 in the slab/letter shaders; bloom,
  haze, and these shafts all consume it.
- **Master temperature:** `uTemp`/`uHeat`/`uSurge` are shared verbatim with `ObsidianSlab` and the
  letterform fill, so a scroll that runs the veins hotter *also* brightens the shafts; a strike flares the
  veins, the jewel, the pour band, the sparks, the bloom, **and** the shafts in the same frame — that
  synchrony is the cohesion proof (cohesion-map §7.6).
- **Shared noise:** smoke density is `gw_fbm`/`gw_warp`/`gw_caustic` from `shaders.js` at the world's
  `GW_FBM_OCTAVES` — the air's wobble is the same grain as the metal's flow. "More detail" = one more
  octave, never a second noise.
- **Occlusion shares the world's geometry:** the shadow map renders the *same* extruded Cinzel letterforms
  (doc 11/17) and basalt channel walls (doc 20/21) the rest of the world uses — the shafts are occluded by
  the actual room, so they belong *in* it, not painted over it. The channel curve data (cohesion-map §7.8)
  that builds the channel geometry also defines what carves the light.
- **Sparks-in-the-beam:** `Embers.jsx` rises in the same warm additive color; embers become the literal
  dust the shafts scatter through. (Deep-dive candidate: per-particle shaft sampling so embers brighten
  *inside* a beam — §9.)
- **The A/E exception, expressed identically:** the divine cone (`uConeDivine=1`, `gw_divineFire`, never
  cools) is the same "first A + first E, clamped to divine fire" rule as the DOM `.forge-letter`, the 3D
  `uIsAE`, the basalt reveal, and the Ogham legibility. The shaft in the air and the glow on the stone are
  one light (`uAEFire`/`uAEFirePow`).
- **Motion law:** shaft intensity follows **Atmospheric Drift** (slow `uTime` boil) + **Brutalist Snap**
  flare on `uSurge` (0ms, `exp` decay, no bounce).

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

The judge device is an iPhone 15 (A16/A17, OLED), Safari tab, thermal throttle after ~90s. On this world
**pixels are the enemy, not triangles** — the raymarch is a near-fullscreen `steps × pixels` cost, the most
expensive single thing in the post chain. It is therefore **`high`-tier ONLY**, and even there it must fit
the ~9–10 ms steady-state budget with throttle headroom (cohesion-map §10).

- **Tier gating (mandatory):**
  - **`static`** (reduced-motion / weak GPU / no-WebGL): no god-ray pass at all; look carried by Bloom + a
    baked faint ramp. (Composer unmounted anyway.)
  - **`low`**: the cheap **radial-blur `<GodRays>` from doc 18** (single merged cone proxy, `samples 30`,
    ½-res, `kernelSize.SMALL`). **The raymarch is NOT mounted.**
  - **`high`**: this depth-aware raymarch, ½-res, `STEPS 20`, blue-noise dithered, depth-aware upsample,
    two cones in one loop.
- **The four levers, applied here:**
  1. **½-res render** — the single biggest win (~4× fewer marched pixels). Depth-aware upsample hides it.
  2. **Low step count + blue noise** — `STEPS 20` (compile-time `#define`, loop unrolls, no runtime
     branch), dithered so 20 steps don't band. Drop to 14 under thermal load before dropping the pass.
  3. **Baked occluder shadow map** — rendered once per route settle, **not per frame** (letters/channels
     are static), so the only per-frame cost is the march + 1 `texture2D`/cone/step. This is what makes
     correct occlusion affordable at all on mobile.
  4. **Early-out at the occluder** (`if(t >= tMax) break`) — pixels looking at near basalt march few steps;
     only pixels looking into the deep void volume pay the full count.
- **Pass count:** **one** fullscreen CONVOLUTION pass (two cones folded into one loop) — *not* two passes.
  Each extra fullscreen pass is the cost, not the cones.
- **Runtime adaptivity:** the existing `PerformanceMonitor` ladder demotes in order: `STEPS 20→14` → drop
  the depth-aware upsample to bilinear → demote `high→low` (swap raymarch for radial blur). Designed to ride
  the *slow* thermal decline over a 2–3 min session.
- **INP insurance:** `renderer.compileAsync` the raymarch shader before first interaction (a multi-hundred-ms
  compile of a loop-heavy fragment must not block first scroll). Alloc-free `useFrame` (no `new` per frame).
- **Memory:** the per-cone shadow RTs (512², 2×) and the ½-res scatter FBO must `dispose()` on unmount;
  `renderer.info.memory` flat across navigation.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder) — each step de-risks the next:**

1. **Confirm the base path first.** The doc-18 radial-blur `<GodRays>` must read right at all tiers before
   this exists. This pass is the `high`-tier *upgrade*, not the foundation.
2. **World-ray reconstruction in isolation.** Output `gw_worldFromDepth` as a color and eyeball it — a
   smooth world-position gradient, no skew. Catch the missing `/view.w` divide here, not 5 steps later.
3. **Single cone, no shadow, no blue noise, full steps.** Get a clean cone of glowing smoke from the
   pour-front cone. Confirm it composites after the lens passes, before the grade, additive.
4. **Add the depth `tMax` clamp.** Confirm the smoke **stops at the basalt back wall** and doesn't bleed
   through (Heckel's core occlusion). This is the first "it's a real volume" moment.
5. **Add the baked shadow map + `gw_coneShadow`.** Confirm the standing Cinzel letters throw **dark rakes**
   between shafts and the channels carve the light. Tune the shadow **bias** (`~1.5e-3`) — too low = acne
   (self-shadow stripes), too high = peter-panning (shadow detaches from the letter).
6. **Drop steps + add blue noise.** Lower `STEPS` to 20; add the dithered start offset + temporal rotation;
   confirm banding becomes imperceptible dither, *not* visible noise crawl. Don't fix banding by raising
   steps (kills mobile) — fix it with the dither.
7. **Half-res + depth-aware upsample.** Render at ½-res; confirm shaft edges stay crisp on letter
   silhouettes (no halo fringe). Tune `uDepthSigma`. This is where ½-res either looks free or looks broken.
8. **Add the divine A/E cone** (`gw_divineFire`, never cools, whiter/tighter). *Now* the sacred read and the
   Ogham-reveal coupling land. Verify the A/E shaft holds white-gold while the pour shaft cools.

**Specific pitfalls (each costs a day):**

- **Forgetting the perspective divide** (`view /= view.w`) in `gw_worldFromDepth` → skewed volume, shafts
  bend wrong. The #1 reconstruction bug.
- **Depth bleed through walls** → forgot `tMax = min(sceneDist, cap)`; smoke glows *through* the basalt.
- **Shadow acne / peter-panning** → tune the bias; consider a slope-scaled bias if letters self-stripe.
- **Half-res halos on letter edges** → naive bilinear upsample; you *must* use the depth-aware bilateral
  upsample (§4e). This is the single most common "½-res looks broken" cause.
- **Banding from low steps** → blue-noise the *start offset*, not the step size; temporally rotate it. Never
  raise steps to fix banding on mobile.
- **Off-screen pour = dead shafts** → ensure the cone is a **world-space volume** (scatters even when the
  apex is outside the frustum) and keep the cone proxy near-frame. Don't regress to a screen-point source.
- **Shadow map re-baked per frame** → it must bake on route settle only (static geometry); a per-frame
  shadow render blows the budget instantly.
- **r182 shadow-internals churn** → we own a plain light-view depth render, *decoupled* from three's shadow
  system, so the Primozic-2026 breaking changes can't touch us. Pin three; don't read three's internal
  shadow atlas.
- **Washed-out frame** → shafts are additive; keep `uIntensity` low and lean on the crushed-black grade.
  Don't crank shafts to compensate for weak emissive — fix the emissive (same rule as Bloom).
- **Frame-rate-dependent animation** → all uniforms via `THREE.MathUtils.damp(cur,tgt,λ,dt)`, never
  `lerp(a,b,k)`; freeze `uTime` on `static` (pass unmounted there anyway).
- **Verify the cheap way:** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with **0 console
  errors** (SwiftShader compiles the GLSL → a typo throws). Then the real iPhone 15 OLED read — shaft
  occlusion, true-black void, and the divine white-gold **do not** simulate headless.

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching
   for the Web* — **2025-06-10**. The definitive modern web reference: depth-buffer world-ray
   reconstruction, shadow-map occlusion, blue-noise dither, ½-res, stop-at-scene-depth.
   https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
2. Casey Primozic (Ameobea) — *Updating three-good-godrays for Three.JS 0.182* — **2026** (r182 shadow
   modernization: native cube depth textures for PointLight shadows, depth-pack internals; the churn we pin
   against). https://cprimozic.net/notes/posts/updating-three-good-godrays-for-threejs-182/
3. Ameobea — *three-good-godrays* (screen-space **raymarched** godrays for three.js on pmndrs
   `postprocessing`; `raymarchSteps`, `density`, `maxDensity`, `distanceAttenuation`, `edgeStrength`,
   `edgeRadius`, `blur`; shadow-map sampling; tested `>=0.125.0 <=0.182.0`) — maintained through 2026.
   https://github.com/Ameobea/three-good-godrays
4. Maxime Heckel — *Real-time dreamy Cloudscapes with Volumetric Raymarching* (the raymarch loop +
   blue-noise dithered start offset + early-termination lineage these god-rays reuse) — referenced across
   2025 volumetric lanes. https://blog.maximeheckel.com/posts/real-time-cloudscapes-with-volumetric-raymarching/
5. Maxime Heckel — *The Art of Dithering and Retro Shading for the Web* (blue-noise vs ordered dither, why
   blue noise hides banding to the eye) — 2025. https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/
6. Wawa Sensei — *How to Fake Godrays in Three.js (WebGPU + React + TSL)* — 2025 (the TSL/WebGPU migration
   target; node-composed effect, MRT emissive/occlusion split). https://wawasensei.dev/tuto/how-to-build-godrays
7. Maxime Heckel — *Field Guide to TSL and WebGPU* — 2025 (porting GLSL raymarch passes to TSL nodes; the
   WebGL→WebGPU re-host path). https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
8. The Front Dev — *Creating Volumetric Lights with Radial Blur in Three.js Using Layers* (per-object
   occlusion via Layers, the base-tier cross-reference) — 2025.
   https://www.thefrontdev.co.uk/creating-volumetric-lights-with-radial-blur-in-three.js-using-layers/
9. three.js Resources — *Three good godrays* catalog entry (screen-space raymarched godrays, current) —
   2025. https://threejsresources.com/tool/three-good-godrays
10. three.js forum — *three-good-godrays: screen-space godrays for Three.JS* (maintainer thread; the
    off-screen-source limitation + depth-buffer-as-source workaround discussion) — ongoing 2025–2026.
    https://discourse.threejs.org/t/three-good-godrays-screen-space-godrays-for-three-js/43422

_(Foundational math — Mitchell / GPU Gems 3 "Volumetric Light Scattering as a Post-Process," the
depth-aware/bilateral-upsampling literature, and IQ's raymarch/SDF references — predate 2025 and are cited
here only via the 2025–2026 articles above that re-derive them, per the recency requirement.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Dust-in-the-beam: per-particle shaft sampling.** Make each `Embers`/spark particle sample the local
   shaft scatter intensity (reconstruct its cone-scatter + shadow term in the particle shader, or read a
   ½-res scatter buffer at its screen pos) so embers visibly **brighten when inside a beam** and dim in the
   dark rakes — fusing the volumetrics and the orbiting sparks into one causal system, not two stacked
   effects. (Overlaps cohesion-map §5.1; flagged in doc 18 §9.3.)
2. **Temporal accumulation without a TAA buffer.** A bounded reprojection of last frame's ½-res scatter
   (velocity-free, since the camera is on a scrubbed scroll path) to let `STEPS` drop to ~10 while staying
   smooth — the mobile holy grail. Edge cases: disocclusion on fast scroll, ghosting on the moving pour
   front, when to clamp/reject history.
3. **The A/E divine shaft ↔ Ogham-reveal lock.** A dedicated build of how the divine cone's shaft, the
   basalt green-reveal (doc 22), and the Ogham grazing-legibility mask (doc 24) all derive from one
   `uAEFire`/`uAEFirePow` — so the shaft in the air, the spill on the stone, and the lit carving rise from
   black **together** as the divine light approaches. The brand-critical keystone beat.
4. **WebGPU/TSL port with MRT occlusion split.** Porting this raymarch to TSL nodes with an `mrt({ output,
   emissive })` pass feeding the occlusion/source split for free, behind a renderer-capability gate, so the
   `high` tier uses WebGPU where available while WebGL stays the iPhone-safe baseline (authored portable per
   cohesion-map §10).
