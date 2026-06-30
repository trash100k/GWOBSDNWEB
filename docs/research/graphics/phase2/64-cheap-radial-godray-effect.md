# 64 — Cheap Radial God-Ray as a Blue-Noise-Dithered Postprocessing Effect

_Phase-2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js r17x + pmndrs `postprocessing`)_

> **What this doc owns.** Phase-1 doc `18-volumetric-lighting-godrays.md` ranked the four god-ray families
> and picked a **hybrid**: a cheap screen-space radial-blur god-ray as the mobile-safe base across *all*
> tiers, with the depth-aware raymarch (built in `phase2/30-depth-aware-raymarch-godrays.md`) reserved as
> the `high`-tier upgrade. **This document is the base.** It is the full build of `GodRay.jsx` as a *single
> hand-rolled `wrapEffect` Effect* — not the drei `<GodRays>` mesh-blur primitive — because GAELWORX needs:
> (1) the brightest emitter **projected world→screen every frame** so the streaks track the moving pour
> front even as it scrolls; (2) **sample-count tiers** (24 high / 12 low) so it fits the iPhone-15 budget;
> (3) **placement BEFORE bloom** so the streaks themselves bloom into soft halos; and (4) **blue-noise
> jitter** so 12 samples don't band into a stepped fan. It is the **mobile-cheap approximation of the
> Heckel march** — same intent (light with body), a fraction of the cost (no depth reconstruction, no
> shadow map, no per-step world transform). It plugs into the Master Forge Uniform pool `U`
> (`phase2/39`) and shares the temperature/noise/palette authorities from `00-COHESION-MAP.md`.

---

## 1. SCOPE — this element in the GAELWORX world

In the forge there is no sun. The only light is the pour itself — the white-hot molten front travelling
left-to-right through the Celtic-interlace channels, the freshly-filled letter cores, and above all the
eternal divine-fire **A** and **E**. The cohesion map names volumetrics as *the single biggest lever* for
selling "the metal is the only light in the room" (§5.4): without shafts, the glow stops at the geometry
surface; with them the light has body, the void has depth, the chamber reads as a cathedral of forge-smoke.

The **depth-aware raymarch** (doc 30) is the AAA expression of that — true occlusion, letters casting
volumetric shadows. But it is `high`-tier-only and it is the single most expensive thing in the post chain.
**Every other tier still needs shafts**, and `low` is the *common* iPhone-throttled steady-state after the
90-second thermal ceiling bites. This element is the shaft that every device gets, every frame, cheaply.

The technique is the **GPU-Gems-3 "Volumetric Light Scattering as a Post-Process"** lineage (Mitchell):
take the lit HDR frame, find the bright emitter's screen position, and **radial-blur the frame toward that
point** with exponential decay — accumulating samples along the ray from each pixel back to the light. The
already-bright pixels (the molten front, the A/E cores) smear into streaks; everything else stays put. It
is a 2D smear, it knows nothing of the 3D scene, and that is exactly why it is cheap. We make it read as
*forge* light rather than a generic crepuscular postcard by: keying its source position to the **brightest
emitter projected each frame** (so streaks fan from the actual pour, not a fixed point); tinting it through
the **shared `gw_forge(uTemp)`** ramp (so warm shafts cool in lockstep with the metal, while the A/E shaft
holds `gw_divineFire` forever); placing it **before bloom** (so the streaks bloom into the soft halo that
makes them read as *light through smoke*, not a hard 2D fan); and **blue-noise jittering** the per-pixel
sample start so the 12-sample `low` path doesn't band.

The one thing this element is **not**: it is not on the `static` tier. Reduced-motion / weak-GPU / no-WebGL
unmounts the whole composer; the shaft look is carried there by the baked bloom + a faint ramp gradient
(cohesion-map §10). This Effect lives only where the composer lives — `high` and `low`.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Doc 18 surveyed the four god-ray families broadly. This deep-dive zooms into the **cheap radial-blur**
family and the sub-decisions inside *building it as a single custom Effect*, all on 2025–2026 sources.

### 2.1 The drei `<GodRays>` mesh-blur primitive — the default, and why we don't ship it

`@react-three/postprocessing` ships a `<GodRays sun={meshRef} …>` effect (params confirmed current 2025/26:
`samples 60`, `density 0.96`, `decay 0.9`, `weight 0.4`, `exposure 0.6`, `clampMax`, `blur`, `kernelSize`,
`blendFunction`). Under the hood it is exactly the Mitchell radial blur — but it blurs **a rendered light
*mesh*** (the `sun` prop), rendering that mesh to its own occlusion target and smearing it toward the
mesh's screen position. This is convenient and it is what doc 18 §4b prototyped.

Two reasons GAELWORX hand-rolls instead:

1. **The off-screen-source death.** The pmndrs maintainer states it plainly (still true 2025–2026, three.js
   forum thread on `three-good-godrays`): *"if the source isn't on screen, there's nothing to blur."* The
   pour front **scrolls off-frame by design** (left→right fill). With a mesh source, the rays pop out the
   instant the mesh exits the frustum. Doc 18's workaround is a wide cone proxy. That works, but it adds a
   transparent additive draw call per source and ties the look to a mesh's framing.
2. **No control over the source-selection or the tint.** We want the source to be **the brightest *emitter*
   projected to screen each frame** — which may be the molten front, or the A/E, or a strike flash —
   computed in JS from the world's own state (`U.uPourFront`, `U.uAEFire`, `U.uHeat`), not pinned to one
   mesh. And we want the streak color to come from `gw_forge(uTemp)` / `gw_divineFire`, the shared
   temperature authority — not a flat mesh color.

A hand-rolled Effect projects an arbitrary world point to a `vec2 uLightScreen` uniform each frame (JS
`vector.project(camera)` → NDC → `[0,1]` UV), and radial-blurs **the already-lit input buffer** toward it.
No proxy mesh, no extra draw call, full source/tint control. The off-screen case becomes a clamped-and-faded
`uLightScreen` (§4d), not a popping mesh.

### 2.2 The custom-Effect / `wrapEffect` mechanism (pmndrs, current 2025–2026)

The pmndrs `postprocessing` "Custom Effects" wiki (current) is unambiguous on the shape: subclass `Effect`,
pass `(name, fragmentShader, { blendFunction, attributes, uniforms })` where `uniforms` is a **`Map` of
`[name, new Uniform(value)]`**, and implement `void mainImage(const in vec4 inputColor, const in vec2 uv,
out vec4 outputColor)` in the fragment. A radial blur **fetches additional samples from the input buffer**,
so it **must** declare `attributes: EffectAttribute.CONVOLUTION` — and the wiki's hard rule follows: *only
one CONVOLUTION effect per `EffectPass`, and CONVOLUTION effects can't `mainUv`*. This is the same attribute
Bloom uses; it is why this Effect is its **own pass**, not merged into the grade pass.

On the r3f side, the `@react-three/postprocessing` "Custom effects" docs (current 2025; updated for React 19)
give the wrapper: a `forwardRef` component that `useMemo`s the Effect instance and returns
`<primitive object={effect} dispose={null}/>`. drei/r3f-postprocessing also expose a `wrapEffect(EffectClass)`
helper that does this boilerplate for you and lets props flow straight to the constructor — the cleanest
form for our case, since `GodRay.jsx` wants to expose `samples`/`weight`/`decay` as JSX props that change by
tier. (React 19: `forwardRef` optional — ref is a prop — but `wrapEffect` abstracts that anyway.)

### 2.3 Blue-noise jitter for low sample counts (Heckel 2025 lineage + demofox)

The decisive perf trick. A uniform radial blur with few samples produces a **stepped fan** — visible
concentric bands where the discrete samples land. The fix isn't more samples (that's the cost we're cutting);
it is to **offset each pixel's sample march by a per-pixel blue-noise value** so the banding is converted to
high-frequency dither the eye doesn't resolve. Heckel's *On Shaping Light* (2025-06-10) and *Cloudscapes*
apply exactly this to volumetric step offsets — blue noise has *"fewer clumps than other noises and is less
visible to the human eye,"* so a low step count looks smooth. demofox's *Ray Marching Fog With Blue Noise*
(the canonical derivation the 2025 articles cite) shows ~32 jittered samples matching a far larger uniform
count. The same logic transfers verbatim from a **ray-march start offset** to a **radial-blur start offset**:
both are "march N samples along a 1-D path; jitter the start so the step grid dissolves." We add a **temporal
golden-ratio rotation** of the jitter (`fract(bn + uFrame * 0.618…)`) so the static dither pattern drifts
into motion and never reads as a fixed film-grain stamp — bounded, since mobile has no TAA history buffer.

The blue-noise source is a **tiny 64×64 8-bit PNG** (a few KB) bundled via the existing asset path — *not*
an EXR/HDR (honors the no-runtime-HDR constraint), or generated once at boot into a `DataTexture`
(void-and-cluster), cached. Heckel's dithering write-up (the 2024 reference re-surfaced across 2025 lanes)
and the 2025 volumetric posts both sample blue noise this way: `texture2D(uBlueNoise, gl_FragCoord.xy/64.0)`,
tiled in screen space so it stays high-frequency regardless of the scene.

### 2.4 Placement before bloom (the streaks must bloom)

The cohesion-map post chain (§6) is explicit: `… → GodRays → Bloom → …`. The radial blur produces sharp
streaks; **bloom is what gives them the soft glowing halo** that reads as light scattering through smoke
rather than a hard vector fan. If god-rays sit *after* bloom, the streaks are crisp and synthetic and the
HDR cores they smear were already consumed by bloom upstream, so the streak energy never re-blooms. Placing
god-rays **before** bloom means the streaks are *part of the HDR frame bloom then operates on* — the bright
streak pixels (which we author additively, peaking >1 in the accent band) get caught by
`luminanceThreshold 0.55` and bloom along with the cores. One HDR convention, two consumers, in the right
order. (utsubo *100 Three.js Tips … (2026)* and threejsroadmap's *Complete Guide to Three.js Post-Processing
(2026)* both stress that pmndrs merges compatible effects into one `EffectPass` and that **CONVOLUTION
effects each force their own pass** — so god-rays + bloom are two passes regardless; the only question is
their *order*, and it is god-rays-first.)

### 2.5 World→screen projection of the brightest emitter (per frame)

The Mitchell shader needs the light's **screen-space position** as the radial-blur focus. GPU Gems computes
it by projecting the world-space light. In r3f this is a one-liner in the per-frame writer:
`v.copy(worldPos).project(camera)` returns NDC `[-1,1]`; map to `[0,1]` UV (`x*0.5+0.5`, `y*0.5+0.5`) and
write `U`/the Effect uniform `uLightScreen`. The three.js forum/docs confirm `Vector3.project(camera)` is
the supported world→NDC path (2025 forum reaffirmations). The *which point* is the GAELWORX-specific
decision: each frame pick the **brightest emitter** — pour front vs. A/E vs. strike flash — by comparing
their current intensities (`uPourTemp`, `uAEFirePow`, `uHeat`) and project *that*. The streaks then fan from
wherever the fire is actually loudest, which during a strike is the strike, during the fill is the front,
and at rest is the A/E.

### 2.6 WebGPU / TSL node form (forward-looking, not the ship path)

Wawa Sensei's *How to Fake Godrays in Three.js (WebGPU + React)* (2025-08-22) builds essentially this cheap
radial-streak look as **TSL nodes** compiling to WGSL **and** WebGL, projecting the emitter and smearing the
frame. It is the migration target: author the GLSL `mainImage` so the project→jitter→march→tint maps cleanly
to TSL later (a re-host, not a rewrite). WebGPU on iOS Safari is still uneven in 2026 (cohesion-map §10), so
this WebGL2 `Effect` is the iPhone-safe baseline; the TSL form is the post-judge upgrade.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Hand-roll one pmndrs `Effect` (`CONVOLUTION`, additive `SCREEN`-ish blend via `outputColor = input + streak`)
that radial-blurs the lit HDR input buffer toward a per-frame world→screen-projected `uLightScreen`,
sample-count-tiered (24 high / 12 low), blue-noise-jittered start offset, tinted by the shared
`gw_forge(uTemp)` / `gw_divineFire` authorities, and inserted in the composer chain *before* `<Bloom>`.**
Expose it as `GodRay.jsx` via `wrapEffect`. Drive its uniforms from the Master Forge pool `U` in the single
`<ForgeDriver/>`. Mount on `high` and `low`; **not** on `static`. On `high`, this is the *fallback* the
runtime-adaptivity ladder drops to when the depth-aware raymarch (doc 30) is demoted under thermal load — so
the two god-ray docs share one chain slot and one set of `U` inputs, never two stacked passes.

**Why this pick, tied to the world + constraints:**

- **It is the cheapest possible "light with body."** No depth reconstruction, no shadow map, no per-step
  world transform — just N taps of the already-rendered frame along one screen-space line. It is the
  Mitchell post-process, the canonical mobile-friendly god-ray, re-derived across 2025–2026 web write-ups.
- **It survives the off-screen pour** without a proxy mesh — the source is a *uniform we set*, clamped to a
  near-frame point and faded when the emitter exits, not a mesh that has to stay in frame.
- **It reuses the shared systems wholesale.** Streak tint = `gw_forge(uTemp)` warm / `gw_divineFire` divine
  (no private orange). Source = the world's own `uPourFront`/`uAEFire`/`uHeat`. Jitter texture is the *same*
  blue-noise tile the dither/grade and the doc-30 raymarch use. Nothing new is invented.
- **It obeys every non-negotiable:** one renderer, one composer, one *additional* CONVOLUTION pass (forced,
  like Bloom), gated by `useQuality`, no EXR, blue-noise as a few-KB PNG, dispose on unmount,
  `dt`-damped uniforms, `uFrame`/`uTime` frozen on `static` (where it's unmounted anyway).

---

## 4. IMPLEMENTATION

### 4a. Libraries / versions

- `three` r17x (installed). Needs `camera.project()` (built-in) for the per-frame world→screen projection.
  No shadow internals, no `DepthTexture` — this is a pure color-buffer convolution, so it is **immune to the
  r182 shadow-internals churn** that complicates the raymarch (doc 30 §2.2). That immunity is a feature: the
  cheap path is the *robust* path.
- `@react-three/postprocessing` + `postprocessing` (already in `Effects.jsx`). We subclass `Effect`, declare
  `EffectAttribute.CONVOLUTION`, and add the wrapped component to the existing `<EffectComposer>` **before**
  `<Bloom>`.
- A **64×64 RG/R blue-noise PNG** (a few KB) bundled via the asset path, or a boot-time void-and-cluster
  `DataTexture`. Shared with doc 30 and the OLED dither grade — one tile, three consumers.
- **No new heavy deps.** drei `<GodRays>` is kept out of the bundle (we hand-roll for the reasons in §2.1).

### 4b. The fragment shader (the Mitchell radial blur, GAELWORX-tinted)

```glsl
// GodRayEffect.frag — CONVOLUTION. SAMPLES is a compile-time #define: 24 high / 12 low (loop unrolls).
uniform vec2  uLightScreen;   // brightest emitter, world->screen, [0,1] UV (set per frame in JS)
uniform float uExposure;      // overall scale of accumulated light
uniform float uDecay;         // per-sample multiplicative falloff (≈0.92)
uniform float uDensity;       // how far toward the light each step travels (≈0.92)
uniform float uWeight;        // per-sample contribution weight
uniform float uClampMax;      // cap so a hot core can't blow the streak to pure white
uniform float uTemp;          // SHARED master temperature (cools the warm shaft)
uniform float uSurge;         // SHARED strike pulse (flares the shaft, same frame as veins/bloom)
uniform float uDivineMix;     // 0 warm pour .. 1 divine A/E (set by which emitter won this frame)
uniform float uOnScreen;      // 0..1 fade as the emitter nears/exits the frame (off-screen safety)
uniform sampler2D uBlueNoise; // 64x64 tile, screen-space
uniform float uFrame;         // integer frame, for temporal jitter rotation

// gw_forge / gw_divineFire injected from shaders.js (the ONE temperature authority). No literal orange.

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  // vector FROM the pixel TO the light, divided into SAMPLES steps scaled by density
  vec2 delta = (uLightScreen - uv) * (uDensity / float(SAMPLES));

  // blue-noise jitter: offset this pixel's march start so SAMPLES taps don't band.
  // Temporal golden-ratio rotation dissolves the static pattern into motion.
  float bn = texture2D(uBlueNoise, gl_FragCoord.xy / 64.0).r;
  bn = fract(bn + uFrame * 0.61803399);

  vec2  pos  = uv + delta * bn;     // start jittered, not on the grid
  float illum = 1.0;                // exponential decay accumulator
  float lum = 0.0;                  // accumulated source luminance along the ray

  for(int i = 0; i < SAMPLES; i++){
    pos += delta;
    // sample the LIT frame; take its luminance as "how much fire is along this ray"
    vec3 s = texture2D(inputBuffer, pos).rgb;        // pmndrs provides inputBuffer
    float l = max(max(s.r, s.g), s.b);               // peak channel = the hot accent band
    lum += l * illum * uWeight;
    illum *= uDecay;                                 // light fades with distance from source
  }
  lum = min(lum * uExposure * (1.0 + uSurge * 0.6), uClampMax);  // strike flare + clamp

  // TINT through the shared authority: warm pour cools with uTemp; divine A/E stays white-gold forever.
  vec3 streak = mix(gw_forge(uTemp), gw_divineFire(uSurge), uDivineMix);

  // additive over the lit frame, faded when the emitter leaves the frame. BLOOM (next pass) softens this.
  outputColor = vec4(inputColor.rgb + streak * lum * uOnScreen, inputColor.a);
}
```

Notes that matter:
- **`delta = (uLightScreen - uv) * density / SAMPLES`** is the radial march vector — every pixel marches
  *toward* the projected emitter. This is the entire Mitchell trick: pixels behind a bright core accumulate
  its luminance, pixels in dark void accumulate ~nothing, so the bright cores smear into streaks.
- **The source is the *input buffer's own luminance*** (`max` channel), not a separate occlusion render.
  Because the palette reserves `>1` for the 10% accent (cohesion-map §3.1), the molten front and A/E cores
  are *already* the only pixels bright enough to streak — the palette **is** the occlusion mask, for free.
  No black-material traverse, no second render target. This is what makes it cheaper than even doc 18's
  layer-occlusion variant.
- **Tint is `gw_forge(uTemp)` / `gw_divineFire`** — never a literal orange. As `uTemp` cools, the warm shaft
  dims and reddens in lockstep with the slab veins and cooling letters; the divine streak (when the A/E win
  the frame, `uDivineMix→1`) holds white-gold and never cools.
- **`uSurge`** multiplies the accumulation *and* feeds `gw_divineFire`'s flicker — a strike flares the shaft
  on the same `exp(-since*3)` heartbeat as the veins, the jewel, the sparks, and the bloom (the synchrony
  that is the cohesion proof, §7.6 of the map).

### 4c. The `wrapEffect` component (`GodRay.jsx`)

```jsx
// scene/GodRay.jsx
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2 } from 'three'
import { wrapEffect } from '@react-three/postprocessing'
import { GLSL_FORGE } from './shaders'   // gw_forge / gw_divineFire / PAL inlines via v3()

const frag = /* glsl */ `
  ${GLSL_FORGE}                 // the shared temperature authority, inlined (no forked color)
  uniform vec2 uLightScreen; uniform float uExposure, uDecay, uDensity, uWeight, uClampMax;
  uniform float uTemp, uSurge, uDivineMix, uOnScreen, uFrame;
  uniform sampler2D uBlueNoise;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){ /* §4b body */ }
`

class GodRayEffectImpl extends Effect {
  constructor({ samples = 24, density = 0.92, decay = 0.92, weight = 0.5,
                exposure = 0.42, clampMax = 0.9, blueNoise } = {}) {
    super('GodRayEffect', `#define SAMPLES ${samples}\n${frag}`, {
      attributes: EffectAttribute.CONVOLUTION,   // own pass; before Bloom in the chain
      uniforms: new Map([
        ['uLightScreen', new Uniform(new Vector2(0.5, 0.5))],
        ['uExposure',  new Uniform(exposure)], ['uDecay', new Uniform(decay)],
        ['uDensity',   new Uniform(density)],  ['uWeight', new Uniform(weight)],
        ['uClampMax',  new Uniform(clampMax)],
        ['uTemp', new Uniform(0)], ['uSurge', new Uniform(0)],
        ['uDivineMix', new Uniform(0)], ['uOnScreen', new Uniform(1)],
        ['uFrame', new Uniform(0)], ['uBlueNoise', new Uniform(blueNoise)],
      ]),
    })
  }
  get u(){ return this.uniforms }     // convenience for the driver
}

// `samples` is a #define => it is part of the compiled program. Different tiers => different programs.
// That is correct: we want one program per tier, mounted by tier, never a runtime branch on sample count.
export const GodRay = wrapEffect(GodRayEffectImpl)
```

The single `samples` `#define` bakes the loop length into the program — the loop unrolls, **zero runtime
branch** (the cohesion-map perf rule for `GW_FBM_OCTAVES`, applied here). High and low mount different
`samples` props → different compiled programs; that is intended, and it is why we tier by *mounting a
different instance*, not by mutating a uniform.

### 4d. Driving it from the pool `U` (the per-frame writer)

The brightest-emitter projection and all tint inputs are written **once**, in the single `<ForgeDriver/>`
`useFrame`, `dt`-damped, alloc-free (one reused `Vector3`):

```jsx
// inside <ForgeDriver/> useFrame(( { camera }, dt ) => { ... })  — godRayRef is the GodRay effect
const e = godRayRef.current; if (!e) return
const u = e.u

// 1) pick the brightest emitter this frame: pour front vs A/E vs strike flash
const pourI = U.uPourTemp.value
const aeI   = U.uAEFirePow.value
const src   = aeI > pourI ? U.uAEFire.value : U.uPourFront.value     // Vector3 (world)
u.get('uDivineMix').value = THREE.MathUtils.damp(u.get('uDivineMix').value, aeI > pourI ? 1 : 0, 6, dt)

// 2) world -> screen (NDC -> [0,1] UV). _v is a module-level reused Vector3 (alloc-free).
_v.copy(src).project(camera)
const sx = _v.x * 0.5 + 0.5, sy = _v.y * 0.5 + 0.5

// 3) off-screen safety: clamp the focus to a near-frame point and FADE as it exits (no proxy mesh).
const inX = sx > -0.15 && sx < 1.15, inY = sy > -0.15 && sy < 1.15, front = _v.z < 1.0
const onScreen = inX && inY && front ? 1 : 0
u.get('uLightScreen').value.set(THREE.MathUtils.clamp(sx, -0.1, 1.1),
                               THREE.MathUtils.clamp(sy, -0.1, 1.1))
u.get('uOnScreen').value = THREE.MathUtils.damp(u.get('uOnScreen').value, onScreen, 5, dt)

// 4) shared temperature / strike — the SAME refs the slab veins read
u.get('uTemp').value  = U.uTemp.value
u.get('uSurge').value = U.uHeat.value      // strike exp(-since*3) + scroll vel
u.get('uFrame').value = (u.get('uFrame').value + 1) % 4096   // temporal jitter rotation
```

The `uOnScreen` damp is the off-screen fix: as the pour front scrolls past the frame edge, the focus point
is held clamped just outside and the streak **fades out smoothly** over ~0.2 s rather than popping — the
mesh-source failure mode (§2.1) solved with one damped float instead of a cone proxy.

### 4e. Chain placement (cohesion-map §6, unchanged)

```jsx
// Effects.jsx — order is load-bearing. God-ray BEFORE bloom so the streaks bloom.
<EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
  {/* HeatHaze → DepthOfField (high) → */}
  {rays && (
    <GodRay
      ref={godRayRef}
      samples={high ? 24 : 12}        // tier — a #define, different program per tier
      weight={high ? 0.5 : 0.4}
      density={0.92} decay={0.92}
      exposure={high ? 0.42 : 0.34}   // gentler on low so it can't wash the frame
      clampMax={0.9}
      blueNoise={blueNoiseTex}
    />
  )}
  <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3}
         intensity={high ? 0.9 : 0.6} radius={0.8} />
  {high && <ChromaticAberration … />}
  <HueSaturation saturation={0.12} />
  <BrightnessContrast brightness={-0.04} contrast={0.16} />
  <Vignette eskil={false} offset={0.22} darkness={0.96} />
  <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.035} />
  {high && <SMAA />}
</EffectComposer>
```

`const rays = quality !== 'static'`. On `high`, the runtime-adaptivity ladder may *swap* this `<GodRay>` for
the doc-30 raymarch and back under thermal load — same chain slot, same `U` inputs, never both.

### 4f. Key uniforms & the master-temperature hook

| Uniform | Source (pool `U` / store) | Meaning |
|---|---|---|
| `uLightScreen` | `brightestEmitter.project(camera)` → `[0,1]` | radial-blur focus; tracks the moving pour / A/E / strike |
| `uTemp` | `U.uTemp` (`scrollDamped + vel*0.25`) | warm-shaft color + brightness; cools the pour shaft with the veins |
| `uSurge` | `U.uHeat` (strike `exp(-since*3)` + vel) | Brutalist-Snap flare, same frame as veins/jewel/bloom |
| `uDivineMix` | `aeI > pourI ? 1 : 0` (damped) | whose fire wins the frame; 1 → `gw_divineFire`, never cools |
| `uOnScreen` | damped frustum test on the emitter | off-screen fade (no proxy mesh) |
| `uFrame` | integer counter `% 4096` | temporal golden-ratio rotation of the blue-noise jitter |
| `uBlueNoise` | shared 64² tile | per-pixel jitter so 12/24 samples don't band |

**The single most important cohesion move:** the streak color and intensity are read from the *exact same*
`gw_forge(uTemp)` / `gw_divineFire` / `uHeat` that drive the slab veins, the cooling letters, and the sparks.
One temperature, many surfaces — the shaft and the metal it pours from are the same fire, on one heartbeat.

---

## 5. COHESION

- **Palette:** streaks are authored *only* through `gw_forge(uTemp)` (warm pour: `PAL.ember`→`PAL.hot`) and
  `gw_divineFire` (white-gold A/E). No cool/green/blue cast (brand law). The green-black Connemara basalt is
  the surface the streaks rake across, never a streak color.
- **The palette IS the occlusion mask (zero-cost cohesion).** Because only the 10% accent exceeds the
  bright threshold, the radial blur's luminance sampling streaks *only* the molten front + A/E cores
  automatically — no separate occlusion render, no black-material traverse. The same convention that makes
  `<Bloom luminanceThreshold 0.55>` selective-for-free makes the god-ray source-selective-for-free. Bloom,
  heat-haze mask, and god-ray source **cannot disagree about what's hot** — they read one HDR frame.
- **Master temperature:** `uTemp`/`uHeat` are shared verbatim with `ObsidianSlab` and the letterform fill,
  so a scroll that runs the veins hotter *also* brightens the shafts; a strike flares the veins, the jewel,
  the pour band, the sparks, the bloom, **and** the streaks in the same frame.
- **Shared blue-noise tile:** the jitter texture is the *same* 64² tile the OLED dither grade
  (`phase2/34`) and the depth-aware raymarch (doc 30) sample — one well, three consumers.
- **The A/E exception, expressed identically:** when the A/E win the frame (`uDivineMix→1`), the streak is
  `gw_divineFire`, white-gold, never cooling — the same "first A + first E, clamped to divine fire" rule as
  the DOM `.forge-letter`, the 3D `uIsAE`, the basalt reveal, and the Ogham legibility. The shaft in the air
  and the glow on the stone are one light (`uAEFire`/`uAEFirePow`).
- **Bloom symbiosis, ordered:** placed *before* `<Bloom>`, the streaks become part of the HDR frame bloom
  operates on — the streak halos are bloom's, so they read as light through smoke, not a hard fan. The shaft
  and its glow are one effect, not two stacked.
- **Motion law:** shaft intensity follows **Atmospheric Drift** (slow temporal jitter rotation, no scroll of
  the pattern) + **Brutalist Snap** flare on `uSurge` (0 ms, `exp` decay, no bounce).
- **One slot with doc 30:** on `high`, this Effect and the raymarch share the single god-ray chain slot and
  the single set of `U` inputs (`uTemp`/`uHeat`/`uPourFront`/`uAEFire`). The adaptivity ladder swaps between
  them; they are never two passes. Cohesion at the *architecture* level, not just the color level.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

The judge device is an iPhone 15 (A16/A17, OLED), Safari tab, thermal throttle after ~90 s. On this world
**pixels are the enemy, not triangles** — a god-ray is a near-fullscreen `samples × pixels` cost. The cheap
radial blur is the *affordable* god-ray precisely because its per-sample work is one cheap `texture2D` of the
already-rendered frame (no world transform, no shadow lookup), so its cost is `samples × pixels × (1 tap)` —
roughly one Bloom-mip-tap's worth per sample.

- **Tier gating (mandatory):**
  - **`static`** (reduced-motion / weak GPU / no-WebGL): **no god-ray pass at all.** Composer unmounted; look
    carried by baked bloom + a faint ramp.
  - **`low`**: this Effect, **`samples 12`**, `exposure 0.34`, blue-noise jittered. This is the *common*
    iPhone steady-state after thermal throttle. 12 samples is the floor where blue-noise jitter still hides
    the banding; below that, drop the pass before dropping samples.
  - **`high`**: this Effect at **`samples 24`** *or* (when headroom allows) the doc-30 depth-aware raymarch
    in the same slot. The adaptivity ladder demotes raymarch → this 24-sample blur → 12-sample → drop.
- **The four levers, applied here:**
  1. **Sample count is the dial** — 24 high / 12 low, a compile-time `#define` (loop unrolls, no runtime
     branch). The single biggest cost lever; blue-noise jitter is what *lets* the count drop without banding.
  2. **No occlusion render** — the palette is the mask (§5). We skip the black-material traverse + second RT
     that even doc 18's layer variant pays. This is the cheapest god-ray in the survey.
  3. **Cheap per-sample work** — one `texture2D` of `inputBuffer`, a `max`, a multiply. No `gw_worldFromDepth`,
     no `texture2D` of a shadow map, no `gw_fbm` per step. ~⅓ the per-sample cost of the raymarch.
  4. **Optional ½-res** — the Effect can render to a ½-res buffer and composite; the radial blur hides the
     upscale (Mitchell's own recommendation). Reserve this for `low` under load; at `samples 12` full-res is
     usually within budget on the A16/A17.
- **Pass count:** **one** fullscreen CONVOLUTION pass — forced (like Bloom), but exactly one. It cannot merge
  into the grade pass (CONVOLUTION rule), which is why it is its own pass and why we keep it to *one*
  god-ray pass total (this Effect *or* the raymarch, never both — §5).
- **Runtime adaptivity:** the existing `PerformanceMonitor` ladder demotes in order: raymarch→this blur →
  `samples 24→12` → ½-res → drop the pass entirely (bloom alone still reads). Designed for the *slow* thermal
  decline over a 2–3 min session, not a cold-start spike.
- **INP insurance:** `renderer.compileAsync` this Effect's program before first interaction; alloc-free
  `useFrame` (one reused `Vector3` for the projection, no `new` per frame).
- **Memory:** the optional ½-res FBO and the 64² blue-noise tile must `dispose()` on unmount;
  `renderer.info.memory` flat across navigation. The blue-noise tile is shared, so it's allocated once.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder) — each step de-risks the next:**

1. **Confirm the emissive cores exceed HDR 1.0 first.** The molten front + A/E cores must peak `>1` (the
   accent band) or there is nothing bright for the radial blur to streak — same precondition as Bloom. Verify
   via the existing `<Bloom luminanceThreshold 0.55>` catching them.
2. **Static `uLightScreen` first.** Hard-code the focus to `(0.5, 0.5)`, full samples, no jitter, no tint —
   just confirm a centre-fan of streaks appears and composites **before Bloom** so the streaks bloom into
   halos (the read that proves the chain order). If the streaks are crisp/synthetic, you placed it after
   bloom.
3. **Add the per-frame world→screen projection.** Project the pour-front `Vector3`; confirm the fan now
   *tracks* the front as it moves. Catch the NDC→UV mapping here (`*0.5+0.5`, **y not flipped** for
   `inputBuffer` UVs in postprocessing).
4. **Add the off-screen clamp + `uOnScreen` fade.** Scroll the front past the frame edge; confirm the streak
   **fades out** smoothly rather than popping or snapping the fan to a corner. This is the mesh-source bug
   (§2.1) avoided.
5. **Drop samples + add blue-noise jitter.** Lower `samples` to 12; add the jittered start offset + temporal
   rotation; confirm banding becomes imperceptible dither, **not** a visible noise crawl. Don't fix banding by
   raising samples (kills mobile) — fix it with the jitter.
6. **Add the shared tint.** Route the streak color through `gw_forge(uTemp)`; confirm the warm shaft **cools
   and reddens with the veins** as `uTemp` drops. Add `uDivineMix`/`gw_divineFire` for the A/E; confirm the
   divine streak holds white-gold while the pour streak cools.
7. **Wire `uSurge`.** Confirm a strike flares the shaft on the *same frame* as the veins/bloom (the synchrony
   check). Tune `exposure`/`clampMax` so the flare never washes the frame to white.

**Specific pitfalls (each costs a day):**

- **Placed after bloom → crisp synthetic fan.** Streaks must be *before* Bloom so they bloom. (Cohesion-map
  §6 chain order.) The #1 "it looks cheap" cause.
- **Flipped Y on the focus UV.** `inputBuffer` UVs and NDC differ in handedness; if the fan tracks *opposite*
  the front vertically, you flipped `sy`. Project gives NDC y-up; postprocessing UV is y-up too — but verify
  on-device, it's the classic off-by-a-sign.
- **Off-screen pour = popping/dead streaks.** The focus is a *uniform you clamp + fade* (`uOnScreen`), never a
  mesh that must stay in frame. Don't regress to a screen-point that snaps to a corner.
- **Banding from low samples → jitter the *start offset*, not the step size**; temporally rotate it. Never
  raise samples to fix banding on mobile.
- **Washed-out frame.** Streaks are additive; keep `exposure`/`weight` low, `clampMax < 1`, and lean on the
  crushed-black grade (`BrightnessContrast -0.04 / 0.16`) to keep the OLED void true-black. Don't crank
  god-rays to compensate for weak emissive — fix the emissive (same rule as Bloom).
- **Literal orange in the streak.** Tint *must* be `gw_forge(uTemp)`/`gw_divineFire`, or the shaft forks its
  own color and the cooling desyncs from the veins. The single cohesion break this doc guards against.
- **Sample count as a runtime uniform.** It is a `#define` — different program per tier, mounted by tier.
  A runtime `for(i<uSamples)` loop won't unroll and tanks the shader. Mount a different instance instead.
- **Two god-ray passes on `high`.** This Effect *or* the raymarch (doc 30) — never both. They share one chain
  slot; the adaptivity ladder swaps. Two CONVOLUTION god-ray passes is double the most expensive post cost.
- **Frame-rate-dependent animation.** All uniforms via `THREE.MathUtils.damp(cur,tgt,λ,dt)`, never
  `lerp(a,b,k)`; `uFrame`/`uTime` frozen on `static` (pass unmounted there anyway).
- **Verify the cheap way:** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with **0 console errors**
  (SwiftShader compiles the GLSL → a typo throws). Then the real iPhone 15 OLED read — streak bloom, the
  blue-noise dither invisibility, true-black void, and the divine white-gold **do not** simulate headless.

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for
   the Web* — **2025-06-10**. The definitive modern web reference; the blue-noise-dithered step-offset
   (jitter) trick this radial blur reuses, and the "light with body" intent this cheaply approximates.
   https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
2. Wawa Sensei — *How to Fake Godrays in Three.js (WebGPU + React)* — **2025-08-22** (YouTube + tutorial).
   The cheap project-emitter-and-streak god-ray as TSL nodes; the WebGPU/TSL migration target for this
   Effect. https://wawasensei.dev/tuto/how-to-build-godrays · https://www.youtube.com/watch?v=qCqt0E-NXqU
3. utsubo — *100 Three.js Tips That Actually Improve Performance (2026)* — **2026**. EffectPass auto-merging,
   why CONVOLUTION effects force their own pass, half-res-then-upscale, disable-AA-when-post-handles-it,
   shared-program/uniform discipline. https://www.utsubo.com/blog/threejs-best-practices-100-tips
4. threejsroadmap — *The Complete Guide to Three.js Post-Processing in 2026* — **2026**. Current pmndrs
   `postprocessing` pass-merging, effect ordering, and mobile budget guidance.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
5. pmndrs `postprocessing` — *Custom Effects* wiki (current 2025–2026). The `Effect` subclass shape:
   `super(name, frag, { attributes, uniforms: Map })`, `mainImage(inputColor, uv, outputColor)`,
   `EffectAttribute.CONVOLUTION`, one-CONVOLUTION-per-pass rule.
   https://github.com/pmndrs/postprocessing/wiki/Custom-Effects
6. `@react-three/postprocessing` — *Custom effects* docs (current 2025; React-19-updated). The
   `forwardRef`/`useMemo`/`<primitive object={effect} dispose={null}/>` wrapper and the `wrapEffect` helper
   used by `GodRay.jsx`. https://react-postprocessing.docs.pmnd.rs/effects/custom-effects
7. pmndrs — *React Postprocessing: GodRays* effect reference (params confirmed current; the mesh-source
   off-screen limitation this doc hand-rolls around) — accessed 2026.
   https://react-postprocessing.docs.pmnd.rs/effects/god-rays
8. three.js forum — *three-good-godrays: screen-space godrays for Three.JS* (maintainer thread; the
   *"if the source isn't on screen, there's nothing to blur"* limitation + workarounds) — ongoing 2025–2026.
   https://discourse.threejs.org/t/three-good-godrays-screen-space-godrays-for-three-js/43422
9. Ameobea / Casey Primozic — *Updating three-good-godrays for Three.JS 0.182* — **2026** (the r182 shadow
   churn the cheap color-only blur is *immune* to — its robustness vs. the raymarch).
   https://cprimozic.net/notes/posts/updating-three-good-godrays-for-threejs-182/
10. Kenny Mitchell — *Volumetric Light Scattering as a Post-Process*, GPU Gems 3 Ch. 13 (the radial-blur
    occlusion math), re-derived for three.js in Andrew Berg's *Volumetric Light Scattering in three.js* and
    the math-araujo reference impl — cited via the 2025–2026 web write-ups above per the recency rule.
    https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process

_(Foundational math — Mitchell / GPU Gems 3, demofox's blue-noise ray-march fog, and the blue-noise sampling
literature — predates 2025 and is cited only via the 2025–2026 articles above that re-derive it, per the
recency requirement.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Brightest-emitter arbitration + smooth focus blending.** When two emitters are near-equal (the pour
   front passing under the A/E), a hard `aeI > pourI` switch snaps the focus. A build of a *weighted dual-focus*
   radial blur (two `uLightScreen`s, one loop, blended by relative intensity) so the streaks fan from *both*
   and cross-fade as dominance shifts — with the `uDivineMix` tint following the blend, not a binary flip.
2. **½-res god-ray with dither-coupled upsample.** Render the radial blur at ½-res and composite with a
   *blue-noise-dithered* (not bilateral) upsample, reusing the same tile, so the upscale cost is near-zero and
   the dither hides both the banding *and* the half-res stepping in one pass — the cheapest possible mobile
   shaft. Edge cases: streak-edge shimmer on fast scroll, interaction with the grade grain.
3. **The single god-ray chain slot: raymarch↔radial hot-swap.** A dedicated build of the adaptivity-ladder
   mechanism that swaps the doc-30 raymarch and this radial Effect in/out of one composer slot *without a
   recompile stall* (pre-compile both, toggle `enabled`), so the `high` tier degrades to the cheap path
   under thermal load with zero hitch. The architecture-level cohesion piece.
4. **WebGPU/TSL port of the cheap streak.** Porting `project→jitter→march→tint` to TSL nodes (per Wawa
   Sensei 2025), behind a renderer-capability gate, so the streak runs on WebGPU where available while this
   WebGL2 Effect stays the iPhone-safe baseline (authored portable per cohesion-map §10).
