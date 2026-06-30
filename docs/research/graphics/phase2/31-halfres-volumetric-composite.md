# 31 — Half-Resolution Volumetric Composite + Blue-Noise Upscale on Mobile WebGL2

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · primary judge target iPhone 15 (OLED), one WebGL2 renderer, strict mobile budget._
_Author lane: senior real-time-graphics / technical art · all cited sources 2025–2026._

> Reads against `00-COHESION-MAP.md` (§5.4 Atmosphere, §6 Post-FX order, §10 Perf envelope) and the
> Phase-1 docs **17** (Volumetric Smoke/Mist) and **18** (God-Rays). Those two named this as their #1
> Phase-2 candidate. This doc is the make-or-break **perf-lever build sheet** for the raymarched
> atmosphere: how the half-res FBO lives inside the existing pmndrs composer, how it upsamples without
> haloing the basalt edges, where the blue noise comes from, the early-out math, and the temporal
> question — **all bound to the one master temperature/uniform system so the smoke is the same metal,
> one phase colder.**

---

## 1. SCOPE — what this element is in the GAELWORX world

Phase-1 doc 17 §C and doc 18 §2c each call for **one bounded raymarch accent** — at the pour-front, and
as the depth-aware god-ray shafts from the A/E divine fire — and each reaches the same conclusion: this
is the **single budget hog** of the atmosphere. The Guerrilla/Horizon cloudscape table everyone re-cites
is brutal: full-res 128-step ≈ **298 ms**; **half-res 8-step + jitter + reproject ≈ 7.5 ms**;
quarter-res 8-step ≈ 2.4 ms. The technique is not the question — Beer–Lambert + Henyey–Greenstein +
short light-march is settled — **the perf lever is.** A 40× swing between "instant death" and "ships on
an iPhone" lives entirely in four decisions: render resolution, step count, dither source, and the
upscale/composite. This doc owns those four.

In the world: the raymarch is the volume of forge-smoke that the metal's light has _body_ in. Without
it, glow stops at the surface of geometry and the void is a flat black canvas. With it, the white-hot
pour-front and the never-cooling **A** and **E** shaft light through a real participating medium, the
ember-dust hangs in the beams, and the carved Ogham becomes readable because divine fire is _scattering
through air_ onto the basalt. The brand law — "pure-VOID darkness lit ONLY by the metal itself" — is
_sold_ by this pass more than any other, because it is the only element that makes light visible between
surfaces. But it is `high`-tier-only; the entire engineering job here is making it cheap enough that the
`high` tier survives the iPhone-15 thermal envelope (§10 of the map: ~9–10 ms steady-state, 5–6 ms
throttle headroom), and degrading it cleanly to nothing on `low`/`static`.

The hard constraint that frames everything: **it must live inside the one existing
`@react-three/postprocessing` `EffectComposer`** (cohesion map §6 — one composer, one finish), share the
half-float buffer, the depth buffer, and the master uniform pool `U`, and never spawn a second renderer
or a runtime EXR.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The volumetric _maths_ is done elsewhere (doc 17). This section is strictly the **resolution / dither /
upscale / temporal** axis — the levers that decide whether it ships.

### 2.1 Half-res render to a dedicated FBO, then composite up

The canonical mobile move, and the one every 2025–2026 reference lands on. Render the raymarch to an
off-screen target at **½ width × ½ height** (¼ the pixels, ≈4× cheaper per step) and composite it back
over the full-res scene. Maxime Heckel's _On Shaping Light_ (2025-06-10) does exactly this for web
volumetrics; Ameobea's `three-volumetric-pass` exposes it as a literal `halfRes: true` flag; the
Utsubo _100 Three.js Tips (2026)_ guide states the blunt version — "rendering at half resolution then
upscaling can double frame rate" via `composer.setSize(w/2, h/2)`. For a low-frequency effect like
fog/smoke, the resolution loss is nearly invisible **if the upscale is depth-aware** (§2.3). ARM's
mobile _Clustered Volumetric Fog_ post pushes this to the extreme — fog raymarched at **1/16** of
framebuffer res with bilateral upsample, because fog is low-frequency.
- **Quality:** high for smoke; the danger is *edges* (haloing where the half-res buffer straddles a
  sharp depth discontinuity — the standing letterforms, channel walls).
- **Perf:** the single biggest win on the table. ~4× at half, ~16× at quarter.
- **Mobile:** essential — non-negotiable for the iPhone-15 read.
- **Complexity:** medium. The cost is the *upscale*, not the downscale.

### 2.2 Step count + blue-noise dither (the "look like 64 steps at 8 steps" trick)

You cannot afford many steps. The fix is **not** more steps — it's a **blue-noise-dithered per-pixel
start offset** so the under-sampling becomes high-frequency noise the eye ignores instead of visible
banding rings. Heckel's 2025 article is explicit that low step counts band, and that a blue-noise
offset (vs. white noise or a hash) gives a perceptually-flat error that the upscale + grain then hide.
NVIDIA's _Spatiotemporal Blue Noise_ work (the canonical reference, re-surfaced through 2025 volumetric
write-ups) shows blue noise specifically distributes error in the high-frequency band where it's least
visible and converges fastest under any temporal accumulation. The two flavours:
- **Static 2D blue noise**, tiled, sampled at `gl_FragCoord`. Cheapest, zero temporal cost, but the
  dither pattern is *frozen* — on a near-static camera it reads as a fixed film of grain over the smoke.
- **Animated / spatiotemporal blue noise** — offset the sample per frame (golden-ratio increment of the
  threshold, or a Z-slice of an STBN texture). Heckel's finding (paraphrased across 2025 coverage):
  *introducing a temporal aspect to the blue noise attenuates the dithering pattern* — the grain
  shimmers instead of sitting, which on GAELWORX's drifting smoke reads as the smoke moving, not as
  noise. This is the cheap cousin of full temporal reprojection (§2.5) and gets ~80% of the benefit.
- **Quality:** blue > white > hash, by a wide margin, at equal step count. Animated > static for a
  living medium.
- **Perf:** one extra texture tap (or a cheap analytic blue-noise function). Negligible.

### 2.3 The upscale: bilinear vs. depth-aware (joint-bilateral / nearest-depth)

This is where half-res lives or dies. Three options, cheapest→best:
- **Plain bilinear** (`linear` filter on the half-res texture, sample at full-res UV). Free. **Halos**
  every sharp silhouette: the half-res buffer averages smoke-in-front-of-letterform with the void
  behind, so on upscale a bright fringe bleeds one half-pixel past the letter edge. On the dark void
  this fringe is *very* visible. Acceptable only where the scene has no sharp depth edges (pure haze) —
  not acceptable where the raymarch must occlude behind Cinzel letterforms and channel walls.
- **Nearest-depth upsample** (NVIDIA / hikiko 2016 lineage, still the cited 2025 baseline): for each
  full-res pixel, compare the full-res depth to the **4 half-res depths** of the source texels and pick
  the texel whose depth is closest. Kills the worst haloing for ~4 extra depth taps + a min. The
  fast-and-good default.
- **Joint-bilateral upsample**: weight the 4 (or more) half-res samples by a **spatial** kernel ×
  a **range (depth-delta) kernel**, so samples across a depth discontinuity get ~zero weight. The
  highest-quality option (the c0de517e / fast-bilateral-solver lineage that the 2025 forum threads still
  point to). `three-good-godrays` (maintained through r18x, three 0.125–0.182) ships exactly this idea
  as user-facing `edgeStrength` + `edgeRadius` params on its composite — proof it's the production move
  for this exact problem in the pmndrs ecosystem.
- **Verdict:** **nearest-depth as the baseline, joint-bilateral with a tight depth sigma as the `high`
  upgrade.** Both need the **depth buffer downsampled with `min`** (not averaged) into the half-res
  pass so the half-res depths used for weighting are real scene depths, not blurred ones.

### 2.4 Bicubic / sharpen on upscale (the cheap polish)

A bicubic (Catmull-Rom, 5-tap optimized) upscale instead of bilinear smooths the dither pattern while
keeping more detail — the 2025 mobile-volumetric write-ups note bicubic filtering "smooths out noise
patterns while retaining details during upscaling." Modest cost, modest win; optional, `high`-only.
Generally redundant once you have nearest-depth + animated blue noise + the grade's grain, so it's a
*last* knob, not a *first* one.

### 2.5 Temporal reprojection (the question the brief asks)

Reproject the previous frame's volumetric result into the current frame (using camera motion vectors),
blend the new sample with the reprojected history at a low weight (`α ≈ 0.05–0.1`), and you can drop to
**4–8 steps** while accumulating quality over many frames — the other half of the Guerrilla "7.5 ms"
number. **On a near-static camera this is tempting and dangerous.**
- **Upside:** lets step count drop further and stabilizes the dither into a clean image.
- **The ghosting risk (the real answer):** GAELWORX's `CameraRig` is a gentle cursor-parallax + tiny
  dolly — *near-static*, exactly the case the 2025 temporal-AA literature warns is **both least
  necessary and most exposed to ghosting**. The smoke *itself* moves (drifting `gw_fbm`), the pour-front
  *translates* left-to-right, the strike *pulses* — so even with a still camera the **content** is in
  motion, and reprojection has no per-fragment motion vector for the smoke's internal advection.
  Reprojecting a moving medium under a still camera = smear trails behind the pour-front and a laggy,
  over-blurred A/E shaft. History-rejection (neighbourhood colour-clamp / variance clamp) fixes static
  scenes, not a translating volumetric source, and the rejection logic is itself a per-pixel cost that
  eats the saving.
- **Verdict for GAELWORX: do NOT ship temporal reprojection.** The risk/reward is wrong for this scene.
  Instead, take its *cheap benefit* — temporal stability — via **animated blue noise (§2.2)**, which
  gives the "moving grain reads as moving smoke" win with **zero history buffer, zero motion vectors,
  zero ghosting, zero extra RT**. This is the deliberate, defensible call: the camera is too static to
  *need* reprojection's quality and too dynamic-in-content to *survive* its ghosting. (Re-evaluate only
  if the high tier ever moves to WebGPU froxels, where temporal accumulation is integral and the motion
  model is per-voxel — see §9.)

### 2.6 WebGPU / TSL froxel path (forward-looking, not the ship)

The 2025–2026 WebGPU stack (three.js `PostProcessing` + TSL `pass().pipe(bloom())`; the Shader.se
scroll-driven pipeline; the "Volumetric lighting in WebGPU" froxel thread reporting sub-1 ms shading)
makes the half-res problem partly moot — froxel volumetrics shade in one texture lookup and bake
temporal accumulation in. But iOS Safari WebGPU is not a safe 2026 judge baseline (map §10 hard
constraint), so this is the **migration target**, authored TSL-portable, never the WebGL2 ship.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Half-res FBO inside the existing composer + downsampled-min depth + animated blue-noise-dithered
8-step march + nearest-depth (→ joint-bilateral on `high`) depth-aware upsample. No temporal
reprojection.** Concretely, the ship config:

| Decision | Choice | Why |
|---|---|---|
| Render res | **½×½ FBO** (`high`), **¼×¼** fallback under thermal load | 4×/16× pixel saving; smoke is low-frequency |
| Steps | **8 primary + 4 light** (`high`); early-out aggressive | Guerrilla 8-step + jitter is the proven mobile point |
| Dither | **animated blue noise** (golden-ratio temporal offset) | stability without a history buffer; "grain reads as smoke" |
| Upscale | **nearest-depth** baseline, **joint-bilateral** on `high` | kills haloing on letterform/channel-wall edges |
| Temporal reproject | **none** | near-static camera + translating source = ghosting, no payoff |
| Composite | additive over scene, **before Bloom-already-done**, after the warp/DOF lens passes | map §6 order; rays bloom only via their own >1 cores |

**Why this pick, bound to the world:**

1. **It honours the one-composer / one-buffer contract.** The half-res pass is a custom pmndrs `Effect`
   (or a manual `Pass`) inside the *same* `EffectComposer` that already runs Bloom/grade, reading the
   *same* `HalfFloatType` buffer and the *same* depth buffer. No second renderer, no second canvas.

2. **Animated blue noise > reprojection is the GAELWORX-specific insight.** The cohesion map's lighting
   model (§5) makes the *content* move (drifting smoke, translating pour-front, strike pulse) while the
   *camera* barely does. That is precisely the regime where reprojection ghosts and where temporal blue
   noise wins. We get temporal stability for free and dodge the one artifact that would scream "bug" on
   the OLED.

3. **Depth-aware upscale is mandatory _here_, not optional.** Unlike a pure haze, this raymarch must
   correctly **occlude behind the Cinzel letterforms and basalt channel walls** (map §5.4, doc 18) so
   the A/E shafts belong _in_ the room. Plain bilinear haloes every letter edge against the true-black
   void — the most visible possible artifact on this scene. Nearest-depth is the floor.

4. **It plugs straight into the master temperature.** Density tint, light colour, and intensity all read
   `U.uTemp` / `U.uHeat` / `U.uPourFront` from the shared pool — the smoke is the metal one phase colder,
   the shaft is the same `PAL.ember`→`PAL.hot` the veins use, and a strike surges the volume on the same
   frame as the veins, jewel, and sparks (map §7 rule 6 — the synchrony _is_ the cohesion proof).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x+ (repo current; `three-good-godrays` confirms the depth-composite pattern works through
  0.182). `@react-three/fiber`, `@react-three/postprocessing` + `postprocessing` (already in
  `Effects.jsx`), `@react-three/drei`. **No new hard dependency.**
- **Study, don't necessarily add:** `Ameobea/three-volumetric-pass` (the `halfRes` + depth-composite
  reference implementation, pmndrs-compatible) and `three-good-godrays` (the `edgeStrength`/`edgeRadius`
  bilateral composite). Prefer a **hand-rolled in-repo pass** to keep palette/uniform control and the
  dispose lifecycle ours (map §4.3).
- **Blue noise:** ship a tiny **64×64 tiling blue-noise PNG** (sRGB-off, `RepeatWrapping`,
  `NearestFilter`) in `/public` — ~6 KB, **not** an EXR, satisfies the no-runtime-EXR scar. Or use an
  analytic blue-noise function to avoid the texture entirely (one less bind on mobile). The texture is
  the safer quality.

### 4.2 The pass shape — a half-res `Pass` driving a full-res composite `Effect`

The cleanest fit for the pmndrs composer is **two stages**: (a) a custom `Pass` that owns the half-res
render target and runs the march, and (b) the upsample/composite folded into the chain. Pseudocode for
the manual pass (it manages its own RT so it can be half-res while the composer stays full-res):

```js
// scene/VolumetricForgePass.js  — a postprocessing Pass, mounted inside the one EffectComposer
import { Pass, RenderTargetPool } from 'postprocessing'
import * as THREE from 'three'
import { U } from './forgeUniforms'           // the shared master uniform pool
import { GLSL_NOISE, GW_FORGE } from './shaders'

export class VolumetricForgePass extends Pass {
  constructor({ camera, blueNoise, scale = 0.5, steps = 8 }) {
    super('VolumetricForge')
    this.needsDepthTexture = true              // pmndrs hands us the scene depth
    this.camera = camera
    this.scale = scale                         // 0.5 = half-res ; 0.25 = quarter under load
    // half-res HDR target (HalfFloat so >1 emissive survives, like the main buffer)
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false })
    this.march = new THREE.ShaderMaterial({
      defines: { STEPS: steps, LIGHT_STEPS: 4 },
      uniforms: Object.assign({
        tDepth:     { value: null },           // FULL-res scene depth (read, min-downsample in-shader)
        tBlueNoise: { value: blueNoise },
        uProjInv:   { value: new THREE.Matrix4() },
        uViewInv:   { value: new THREE.Matrix4() },
        uCamPos:    { value: new THREE.Vector3() },
        uFrame:     { value: 0 },              // drives animated blue noise
        uTexel:     { value: new THREE.Vector2() },
      }, U),                                    // <-- binds the SAME refs as every hot material
      vertexShader:  FS_TRI_VERT,
      fragmentShader: MARCH_FRAG,
    })
    this.fsq = new FullScreenQuad(this.march)
  }
  setSize(w, h) { this.rt.setSize(Math.ceil(w*this.scale), Math.ceil(h*this.scale)) }
  render(renderer, inputBuffer, outputBuffer) {
    this.march.uniforms.tDepth.value      = this.depthTexture
    this.march.uniforms.uProjInv.value.copy(this.camera.projectionMatrixInverse)
    this.march.uniforms.uViewInv.value.copy(this.camera.matrixWorld)
    this.camera.getWorldPosition(this.march.uniforms.uCamPos.value)
    this.march.uniforms.uFrame.value++
    renderer.setRenderTarget(this.rt)         // <-- HALF-RES render here
    this.fsq.render(renderer)
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer)
    // ... then composite: bind this.rt.texture as a half-res input to the upsample Effect
  }
}
```

The **upsample + additive composite** then runs as the next merged `Effect` in the chain (so it joins
the single merged fragment pass where possible), sampling `tHalfRes` with the nearest-depth weighting:

```glsl
// composite Effect fragment — depth-aware upsample of the half-res volumetric
uniform sampler2D tHalfRes;       // the half-res HDR march result (RGB = scatter colour, A = optthick)
uniform sampler2D tHalfDepth;     // half-res depths (min-downsampled)
uniform vec2  uHalfTexel;         // 1.0 / halfResSize

void mainImage(const in vec4 c, const in vec2 uv, const in float depth, out vec4 o){
  float dFull = getViewZ(depth);                       // full-res linear view-Z (pmndrs helper)
  // 4 nearest half-res taps
  vec2 base = uv;
  vec2 offs[4]; offs[0]=vec2(0); offs[1]=vec2(uHalfTexel.x,0.0);
  offs[2]=vec2(0.0,uHalfTexel.y); offs[3]=uHalfTexel;
  float bestW = -1e9; vec4 best = vec4(0.0);
  for(int i=0;i<4;i++){
    vec2 p = base + offs[i];
    float dHalf = getViewZ(texture2D(tHalfDepth, p).x);
    float w = -abs(dHalf - dFull);                     // nearest-depth: pick smallest |Δz|
    if(w > bestW){ bestW = w; best = texture2D(tHalfRes, p); }
  }
  // HIGH tier: replace the argmax with a depth-weighted joint-bilateral sum
  //   w_i = exp(-|dHalf-dFull| / uDepthSigma) ; best = Σ w_i·s_i / Σ w_i
  o = vec4(c.rgb + best.rgb, c.a);                     // additive — rays are light, never occlude colour
}
```

### 4.3 The march fragment — bound to the master temperature

The march reuses the cohesion map's authorities: `gw_fbm` for density, `gw_forge`/`gw_tempColor` for
the in-scatter colour, `U.uTemp`/`U.uHeat` for strength, `U.uPourFront` for the light position. The
**ember-tinted wavelength absorption** (`exp(-d·σ·vec3(1,1.6,2.4))` — doc 17) makes light through the
smoke automatically forge-coloured and on-palette.

```glsl
${GLSL_NOISE}        // gw_fbm, gw_snoise3, gw_warp
${GW_FORGE}          // gw_tempColor, gw_forge, gw_divineFire  (the ONE temperature authority)
#define SIGMA 1.6

vec3 worldPos(vec2 uv, float d){                       // reconstruct world ray (Heckel 2025)
  vec4 clip = vec4(uv*2.0-1.0, d*2.0-1.0, 1.0);
  vec4 vp = uProjInv * clip; vp /= vp.w;
  return (uViewInv * vp).xyz;
}
float density(vec3 p){                                  // shared fbm, boils in place (never scrolls)
  float n = gw_fbm(p * uHazeScale + vec3(0.0, uTime*0.05, 0.0));
  return clamp(n*0.5+0.5 - 0.45, 0.0, 1.0);             // threshold -> wisps, not a wall
}
float blue(vec2 frag){                                  // ANIMATED blue noise: golden-ratio temporal
  float b = texture2D(tBlueNoise, frag * uTexel * uNoiseScale).r;
  return fract(b + float(uFrame) * 0.61803399);         // shimmer => reads as moving smoke
}

void main(){
  vec2 uv = vUv;
  float d  = texture2D(tDepth, uv).x;                   // full-res scene depth (occluder)
  vec3 end = worldPos(uv, d);
  vec3 ro  = uCamPos, rd = normalize(end - ro);
  float tMax = min(distance(ro, end), uMaxDist);        // march only up to the nearest opaque surface
  float stp  = tMax / float(STEPS);
  float t = blue(gl_FragCoord.xy) * stp;                // <-- blue-noise start offset kills banding
  float T = 1.0; vec3 C = vec3(0.0);

  // light position + colour from the SHARED pool — the metal is the only light
  vec3 Lp  = uPourFront;                                 // (A/E divine pass swaps this for uAEFire)
  vec3 Lcol = mix(gw_forge(uTemp), gw_divineFire(1.0), uDivine);

  for(int i=0;i<STEPS;i++){
    vec3 p = ro + rd * t;
    float dn = density(p);
    if(dn > 0.01){
      vec3 lv = normalize(Lp - p); float ls = 0.0;
      for(int j=1;j<=LIGHT_STEPS;j++) ls += density(p + lv * float(j) * 0.3);
      float lightT = exp(-ls * SIGMA);
      float phase  = hg(dot(rd, lv), 0.35);             // Henyey–Greenstein forward scatter
      vec3 absorb  = exp(-dn * SIGMA * vec3(1.0, 1.6, 2.4)); // ember-tinted, on-palette by construction
      C += T * dn * stp * Lcol * lightT * phase * absorb;
      T *= exp(-dn * SIGMA * stp);
    }
    t += stp;
    if(T < 0.02 || t > tMax) break;                      // EARLY-OUT — saturated or hit a surface
  }
  // scale by master heat + strike surge so the volume flares with the veins on the SAME frame
  gl_FragColor = vec4(C * (uIntensity * (0.6 + 0.6*uHeat)), 1.0 - T);
}
```

### 4.4 The r3f component shape

```jsx
// scene/Effects.jsx  — inside the ONE <EffectComposer frameBufferType={HalfFloatType}>
function ForgeVolumetric() {
  const { quality } = useQuality()
  const blue = useTexture('/bluenoise64.png')           // tiled, NearestFilter, no sRGB
  const { camera } = useThree()
  const passRef = useRef()
  useEffect(() => {
    blue.wrapS = blue.wrapT = THREE.RepeatWrapping
    blue.minFilter = blue.magFilter = THREE.NearestFilter
    return () => passRef.current?.dispose()             // dispose the half-res RT + materials
  }, [])
  // gate: high only ; quarter-res + bilinear when PerfMonitor demotes
  if (quality !== 'high') return null
  return <volumetricForgePass ref={passRef}
            args={[{ camera, blueNoise: blue, scale: 0.5, steps: 8 }]} />
}
```

`U.*` is driven by the single `<ForgeDriver/>` (map §1.5 / §4.2) — this pass binds the *same refs*, so
the writer that heats the veins heats the smoke. **Per-frame `dt`-damped, never `lerp`, no second rAF.**

### 4.5 Key uniforms / params

| Uniform / param | Source | Meaning |
|---|---|---|
| `scale` | tier (0.5 high → 0.25 demoted) | render-target resolution fraction — the #1 lever |
| `STEPS` / `LIGHT_STEPS` | `#define` (8/4 high) | compile-time, loop unrolls, zero runtime branch |
| `uTemp` / `uHeat` | shared `U` (`scrollDamped + vel·0.25`; strike `exp(-since·3)`) | shaft strength + density tint heat with the forge |
| `uPourFront` | shared `U` (journey/fill timeline) | the light position the smoke shafts from |
| `uDivine` | `0` (pour pass) / `1` (A/E pass) | swaps `gw_forge` → `gw_divineFire`, never cools |
| `uFrame` | `++` per render | drives the **animated** blue-noise temporal offset |
| `uDepthSigma` | leva / tier | joint-bilateral edge tightness (high tier upscale) |
| `uHazeScale` / `uMaxDist` | `sceneFor(route)` | per-chamber density + march bound (thick in arch, off in jewel) |

### 4.6 How it hooks the master temperature system

The cohesion lock is that the pass **owns no colour, no heat, and no noise of its own.** Density =
`gw_fbm` (the same field as the veins). In-scatter colour = `gw_forge(uTemp)` / `gw_divineFire(1.0)`
(the one temperature authority, the A/E clamped exactly as everywhere). Strength = `uIntensity·(0.6 +
0.6·uHeat)` so a strike surges the smoke on the same frame the slab veins, jewel edges, pour band, and
sparks surge (map §7 rule 6). The absorption spectrum `vec3(1,1.6,2.4)` is the *shared forge-material
absorption* (Phase-2 doc on ember-tinted absorption) so smoke, obsidian transmission, and the molten
pour all eat the cool end identically. Nothing forks an orange, a noise, or a clock.

---

## 5. COHESION

- **Palette / 60-30-10.** The march writes only `PAL.void`→`PAL.ember`→`PAL.hot` (pour) and a whiter
  `PAL.divine` (A/E). The ember-tinted absorption *guarantees* on-palette light-through-smoke by
  construction — there is no path to a cool/blue/green cast. The basalt's green lives in the *material*,
  never in this pass (map §3.3 brand law).
- **Bloom contract.** The composite is **additive** and feeds the same HDR (>1) cores Bloom already
  isolates (`luminanceThreshold ≈ 0.55`). Smoke *body* stays <1 (it shouldn't glow as a sheet — doc 17);
  only the hot shaft cores cross threshold. Bloom and this pass cannot disagree about "what's hot"
  because both read `gw_forge(uTemp)` (map §7 rule 3/7).
- **Master temperature.** `uTemp`/`uHeat`/`uPourFront` are the *same refs* from `U` the slab binds. One
  float heats veins + smoke + shaft together (map §1.5). Cooling letterforms shaft weaker rays as they
  darken; the **A/E never cool** because `uDivine=1` routes to `gw_divineFire`.
- **Shared noise.** Density and drift are `gw_fbm`/`gw_warp` at the shared `GW_FBM_OCTAVES` define — drop
  a tier and the smoke thins with everything else, uniformly (map §2, §7 rule 9). The smoke swirls with
  the same turbulence grammar as the molten metal: one substance, one phase apart.
- **Lighting model.** This pass *is* "the metal is the only light" made visible between surfaces — the
  light position is the pour-front / the A/E divine fire, never a sun or fill (map §5). The depth-aware
  upscale makes the shafts correctly occlude behind the letterforms and channel walls, so they belong
  _in_ the room (map §5.4).
- **Composite order** (map §6): lens physics (HeatHaze warp, DOF) → **this volumetric add** → Bloom
  blooms the already-warped hot cores → grade → grain → SMAA → tone-map on the renderer. The grain
  doubling as OLED dither further hides any residual dither/upscale noise.
- **Motion law.** Drift is **Atmospheric Drift** (slow constant `uTime`, dt-damped); strike is
  **Brutalist Snap** via `uHeat` (`exp` decay, no bounce). The animated blue noise's shimmer is sub-
  perceptual and reads as the medium breathing — not as a competing motion.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

The map's §10 envelope: ~9–10 ms steady-state on `high`, 5–6 ms throttle headroom, DPR capped 1.5, fill-
rate (not triangles) is the enemy. This pass is the most fill-rate-hungry element, so it is
`high`-only and aggressively bounded.

**The four levers, in priority order (mirroring map §10):**
1. **Resolution fraction (`scale`).** ½×½ = ¼ the march pixels ≈ 4× cheaper. The single biggest win
   (Guerrilla: 298 ms full-res → ~7.5 ms half-res-8-step). Quarter-res (`scale 0.25`) is the thermal
   fallback the `PerformanceMonitor` ladder drops to before killing the pass entirely.
2. **Step count (`#define STEPS 8` / `LIGHT_STEPS 4`).** Compile-time so the loop unrolls with no
   runtime branch. **Do not raise steps to fix banding** — that's what the blue noise is for.
3. **Early-out (`if(T<0.02 || t>tMax) break;`).** Two exits: transmittance saturated, or the ray hit an
   opaque surface (the `tMax` from full-res depth). The pour-front volume is small on screen — most
   pixels early-out in 1–2 steps. This is the difference (doc 17 §6 / the Dec-2025 ground-fog thread)
   between 60 fps and "near-complete freeze on mobile."
4. **Animated blue-noise dither** instead of more steps or temporal reprojection — temporal stability
   for one texture tap, **no history RT, no ghosting cost.**

**Tier ladder (mandatory, mirrors `Effects`/`ForgeCanvas`):**

| Tier | Volumetric pass | Resolution | Steps | Upscale | Dither |
|---|---|---|---|---|---|
| **high** | on | ½×½ | 8 + 4 | joint-bilateral (depth σ) | animated blue noise |
| **high (throttled)** | on | **¼×¼** | 6 + 3 | nearest-depth | animated blue noise |
| **low** | **off** | — | — | — | — (atmosphere = depth-fog + fBM planes only) |
| **static** | **off** | — | — | — | composer unmounted; baked-feel poster |

**Memory / leak discipline (map §4.3):** the half-res RT (+ the half-depth RT) are the **classic leak**
— `dispose()` them and the materials on unmount; `renderer.info.memory` must be **flat across
navigation**. Resize them in the composer's `setSize`, never per-frame.

**Adaptivity:** one `PerformanceMonitor` `factor` feeds the mutable `forge` store (never React state mid-
scroll). Decline path: drop `scale` 0.5→0.25 → drop the joint-bilateral to nearest-depth → drop steps
8→6 → **unmount the pass** (fall to `low` atmosphere). Designed to ride the *slow* thermal decline over a
2–3 minute session, not just hold 60 cold.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder — each de-risks the next):**

1. **Build it half-res from the *first* commit.** Never prototype full-res "just to see it" (doc 17 §7):
   you'll tune to a look you can't ship and the half-res version will then look wrong. Author the FBO at
   `scale 0.5` before writing the march body.
2. **Get the depth buffer + world-ray reconstruction correct in isolation.** The #1 first-build failure
   is the Effect not receiving a usable depth texture (declare `needsDepthTexture`, confirm the composer
   has a depth texture, `getViewZ`/`worldPos` returns sane world positions). Visualize `density(p)` as
   greyscale before lighting it.
3. **Add the blue-noise start offset *before* judging banding.** Don't fix banding by raising steps. Get
   the **animated** offset (golden-ratio `uFrame`) in early — static blue noise on a still camera reads
   as a frozen film of grain.
4. **Nearest-depth upscale next — this is the make-or-break visual.** Composite over a scene that
   *contains a sharp depth edge* (a standing letterform) from day one and confirm **no bright halo**
   bleeds past the silhouette onto the void. Plain bilinear will halo; that's the test that proves the
   depth-aware path is wired.
5. **Ember-tinted absorption in early** (`vec3(1,1.6,2.4)`) — un-tinted grey smoke is the tell that
   breaks the world (doc 17 §7). Verify light through the smoke is forge-coloured.
6. **Bind `U` (master temperature) — don't invent a second heat.** Scroll and confirm the shaft
   brightens *with* the veins; strike and confirm the volume flares on the *same* frame. That synchrony
   is the cohesion proof (map §7 rule 6).
7. **Decide temporal LAST and decide NO.** Resist reprojection. If banding/instability remains after
   steps 3–5, the fix is animated blue noise + the grade's grain, not a history buffer. (Document the
   choice so a future contributor doesn't "add reprojection to help" and reintroduce ghosting.)

**Specific pitfalls (each costs a day):**
- **Bilinear haloing on the void.** The most visible artifact possible on this scene. Nearest-depth is
  the floor, not an optimization. Downsample the depth with **`min`**, never average, or the half-res
  depths used for weighting are wrong.
- **`max(0.0, …)` clamps swallowing the dither** — keep the blue-noise offset *additive to `t`*, not
  multiplied into a clamped term.
- **`tMax` ignoring scene depth** → the march draws smoke *in front of* solid letterforms. Bound `tMax`
  to the full-res reconstructed surface distance.
- **Half-float not set on the half-res RT** → the >1 emissive in-scatter clamps at 1 and the shafts
  don't bloom (the same silent bug as the main buffer, map §6). Use `HalfFloatType`.
- **Reprojection ghosting** behind the translating pour-front — the documented trap this doc rejects.
- **Frame-rate-dependent animation / second rAF** — drive everything from the one `<ForgeDriver/>`,
  `dt`-damped; freeze `uTime` and unmount on `static`.
- **RT leak across navigation** — `renderer.info.memory` flat or a chamber RT isn't disposing.
- **Verify the cheap way:** `npm run build` green → `qa-route` @ 393×852 + 1440×900, **0 console errors**
  (SwiftShader compiles the GLSL → a typo throws). Then the **iPhone 15 OLED read** — halo on the void,
  shaft spread, true-black, the divine-fire white-gold, and dither shimmer **do not** simulate headless.

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — _On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
   Raymarching for the Web_ — **2025-06-10** — world-ray reconstruction from depth, blue-noise-dithered
   step offsets, half-res downsample, the "animated/temporal blue noise attenuates the dither pattern"
   finding. https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
2. Utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_ — half-res-then-upscale
   (`composer.setSize(w/2,h/2)`) ~doubles FPS; `PerformanceMonitor` DPR/post adaptivity; pmndrs pass
   merging. **2026** — https://www.utsubo.com/blog/threejs-best-practices-100-tips
3. ARM Developer — _Post-processing in Mobile: Clustered Volumetric Fog_ — mobile fog raymarched at a
   resolution fraction (down to 1/16) with **bilateral upsample** because fog is low-frequency; mobile
   step/cluster budget. (Accessed 2026; ARM mobile-graphics blog.)
   https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/clustered-volumetric-fog
4. `Ameobea/three-volumetric-pass` — raymarched **screen-space volumetrics as a pmndrs `postprocessing`
   pass** with a `halfRes` option and `HalfFloatType` composer; depth-buffer reconstruction shared with
   `three-good-godrays` (n8programs lineage). Active reference. https://github.com/Ameobea/three-volumetric-pass
5. `Ameobea/three-good-godrays` — screen-space raymarched godrays as a `GodraysPass`; user-facing
   **`edgeStrength` / `edgeRadius`** (depth-aware / joint-bilateral composite) + `blur`; **v0.12.0,
   compatible three 0.125–0.182** (current r18x), 60-step default — the production proof of depth-aware
   composite in this exact ecosystem. https://github.com/Ameobea/three-good-godrays
6. `CK42BB/procedural-clouds-threejs` — WebGPU raymarching **with explicit WebGL2 billboard/mesh
   fallbacks**, Beer–Lambert + Henyey–Greenstein + light-march self-shadowing, WGSL 3D-noise compute —
   **created 2026-02-07** — the modern packaged recipe + the fallback ladder this doc's tiers mirror.
   https://github.com/CK42BB/procedural-clouds-threejs
7. Codrops / Filip Kantedal — _80s Business Tech and Seamless Scene Transitions: Inside Shader.se's
   Scroll-Driven WebGPU Pipeline_ — TSL→WebGL/WebGPU dual target, **per-page render-pass skipping** (no
   draw calls off-screen), compose-pass bloom/grain/CA ordering — **2026-05-19** —
   https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
8. three.js forum — _Volumetric lighting in WebGPU_ (Usnul) — froxel/LUT pre-integration sub-1 ms even
   on old HW, the post-process-raymarch critique, denoise/temporal caveats — **2025-11-06** —
   https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959
9. three.js forum — _High-Performance Ground Fog for Games (Three.js)_ — height-attenuated multi-octave
   fBM fog, the **mobile early-exit** fixes (skip FBM outside bounds), DPR-cap-to-1.5 — **2025-12-08** —
   https://discourse.threejs.org/t/high-performance-ground-fog-for-games-three-js/88522

_Pre-2025 canon (Guerrilla/Schneider–Vos cloudscape optimisation table — full-res-128 ≈ 298 ms vs
half-res-8-step+jitter ≈ 7.5 ms; NVIDIA Spatiotemporal Blue Noise; hikiko/c0de517e nearest-depth &
depth-aware upsample; NVIDIA joint-bilateral upsampling; INSIDE temporal-AA history rejection) is cited
only as re-derived/surfaced by the 2025–2026 sources above, per the recency requirement._

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Joint-bilateral vs. nearest-depth upscale, measured on the iPhone 15.** A/B the two depth-aware
   composites for halo quality and ms cost on the actual OLED — does the bilateral's depth-σ tuning earn
   its extra taps over argmax nearest-depth, and at what `uDepthSigma` does it stop haloing the channel
   walls? Includes the `min`-downsample-depth pipeline and the half-depth RT format.
2. **Animated-blue-noise sourcing: tiled STBN texture vs. analytic golden-ratio function vs. R2 sequence.**
   Which gives the flattest perceptual error at 8 steps with the least banding *and* the least sit-still
   grain on the near-static camera — and can the analytic path drop the texture bind entirely on mobile?
3. **The A/E divine-fire shaft as a second half-res volume.** A dedicated, brighter, tighter march
   keyed to `uAEFire` (whiter `gw_divineFire`, smaller `uMaxDist`) that physically scatters onto the
   basalt and gates the Ogham reveal — how to run two half-res volumes (pour + A/E) without doubling the
   pass cost (shared RT, two light positions, one march).
4. **WebGPU/TSL froxel upgrade behind a capability gate.** Port the march to a TSL froxel pass (sub-1 ms
   shading, integral temporal accumulation, real multiple-scattering) for the `high+` tier where WebGPU
   is available, keeping this WebGL2 half-res pass as the iPhone-safe baseline — the dual-target pattern
   the Shader.se pipeline (source 7) demonstrates.
