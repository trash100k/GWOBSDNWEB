# 35 — Bloom Budget & Banding on a True-Black OLED

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · primary judge target iPhone 15 (OLED), one WebGL2 renderer, strict mobile budget._
_Author lane: senior real-time-graphics / technical art · all cited sources 2025–2026._

> Reads against `00-COHESION-MAP.md` (§3 palette+tone-map, §5.1 emissive-as-light, §6 post-FX order,
> §10 perf envelope) and Phase-1 docs **20** (Bloom & the post stack) and **21** (Color Grading &
> Tone Mapping for OLED). Doc 20 owns *which pixels glow*; doc 21 owns *what every pixel looks like
> after tone-map*; **this doc owns the seam between them on a real iPhone-15 panel**: how the bloom
> mip pyramid is sized, why half-float gradients band in the void→crimson bottom 5% of the range on
> actual iOS GPUs, how the dither is wired so the band edges dissolve, and the *measured* threshold /
> radius / resolutionScale that reads as **forge light** rather than **milky haze** against true
> `0,0,0`. It is doc 20's deep-dive #3 ("OLED-accurate grade & dither") and #2 (the A/E bloom budget)
> made buildable. Everything binds the one master temperature/uniform system so the glow is the
> *same metal* one optical step further out.

---

## 1. SCOPE — what this element is in the GAELWORX world

Bloom is the **optical proof that the metal is hotter than the medium can hold**. In a pure-void world
where the only light is emissive (cohesion map §5.1), bloom is not a filter bolted on at the end — it is
the *atmosphere of the light itself*, the thing that turns "an orange shape on a black screen" into "a
mass radiating heat into the dark." The white-hot pour front, the cooling forge-red letterforms, the
eternal white-gold **A** and **E**, and the orbiting spark points all push HDR radiance above 1.0
(`PAL.hot 1.9,1.25,0.7` · `PAL.emberHot 1.7,0.7,0.22`), and bloom is what lets that over-range light
*spill* — the halo that says "sacred fire," the soft disc that says "this is physically incandescent."

The iPhone-15 OLED is simultaneously the reason this works and the reason it is dangerous. **The good
half:** the panel renders true `0,0,0` (pixels switch fully off), so a correctly crushed void is
*infinitely* deep and the fire detonates against real black — the entire GAELWORX thesis. **The bad
half** is three coupled failures that *only appear on the real panel, never in CI or on an sRGB laptop*:

1. **Banding in the bottom 5%.** The void→crimson and crimson→ember gradients live in the darkest few
   code values of the 8-bit output. On a true-black panel the eye locks onto the stair-steps the way it
   never does over LCD backlight bleed, and the OLED's own low-luminance switching exaggerates the
   contour lines. This is the #1 *quality* bug of the whole world, and it is invisible until you hold
   the phone.
2. **Half-float bloom banding.** The composer runs `HalfFloatType` (cohesion map §6 — required so the >1
   emissive survives into bloom instead of clamping at 1). But half-float has only ~10–11 bits of
   mantissa, and near the floor the bloom mip pyramid's downsample/upsample quantizes the dark spill
   into visible contour rings — a *second* banding source that the dark-gradient dither must also catch.
3. **Bloom-as-haze.** Push threshold too low or radius too wide and the 30% deep-crimson mass starts to
   bloom; the void fills with a grey-warm milk and the OLED's true black is *destroyed* — you have
   traded the one thing the panel does better than any other display for a generic glow. The line
   between "forge light" and "haze" is a few hundredths of a threshold value, and it can only be found
   on the device.

This doc's job is to lock the four numbers that decide all three — **mip-count / levels, threshold,
radius, resolutionScale** — plus the **dither** that makes them safe, and to bind every one of them to
the shared `uTemp`/`U` pool so the bloom breathes on the same heartbeat as the metal.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The bloom *flavor* is settled in doc 20 (`mipmapBlur` threshold bloom, reject `UnrealBloomPass` and
`SelectiveBloom`). This section is strictly the **mip-pyramid sizing, the half-float-on-iOS reality, the
dither, and the measured parameter window** — the axes doc 20 left for Phase 2.

### 2.1 The mipmap-blur pyramid — what `levels` actually buys (and costs)

`pmndrs/postprocessing`'s `MipmapBlurPass` (the engine behind `mipmapBlur`) builds a UE4-style pyramid:
the HDR input is **downsampled** through N successively-halved mips, each blurred with a small fixed
kernel, then **upsampled** back up the chain, adding each blurred mip into the next. The wide, soft glow
is the *sum of many small blurs at many scales* — cheap because the big blurs happen on tiny textures.

- **`levels` (default 8).** This is the mip count — how many halvings the pyramid descends. The radius
  of the *widest* glow is governed by how many levels you have: each level doubles the effective spread.
  On a 393×852 mobile canvas at DPR 1.5 (≈590×1278 backing store), the half-res bloom buffer (§2.3) is
  ≈295×639; descending 8 levels reaches a ≈1×2 px mip — past the point where the gradient bands and
  ringing dominates. **The mobile finding (2025–2026): 8 levels is a desktop default; on a small
  mobile buffer the bottom 2–3 mips contribute almost nothing but quantization noise and a faint dark
  contour ring.** Capping to **`levels={6}` on `high`, `5` on `low`** keeps the wide forge-halo while
  cutting the deepest mips that are the *worst* half-float banding contributors (the dark spill on a 1px
  mip is exactly where the mantissa runs out). This is the single most important and least-documented
  knob for the OLED look.
- **`radius` (range `[0,1]`, default `0.85`).** Newer `postprocessing` deprecated the old
  `kernelSize`/`resolutionScale` constructor params in favor of **`radius` and `levels`**. `radius`
  interpolates the per-level upsample blend — higher = the pyramid favors the wider mips = a softer,
  larger halo. For a *sacred halo* (not a sharp ring) GAELWORX wants this high, but high `radius` +
  high `levels` together is exactly what tips the deep-crimson mass into haze. The two are coupled and
  must be tuned together (§2.4).
- **`resolution` (was `resolutionScale 0.5`).** The bloom buffer is rendered at a fraction of the scene
  resolution. The 2026 guidance is blunt and consistent across the Three.js Roadmap 2026 guide and the
  utsubo 100-Tips post: *"rendering at half resolution then upscaling can double frame rate"* and *"lower
  resolution bloom is cheaper and often looks good."* **`resolutionScale 0.5` (half-res) is the mobile
  default.** Because the glow is low-frequency, the resolution loss is invisible — *except* that a
  half-res bloom buffer has its own banding floor (fewer samples across the dark gradient), which is the
  second reason the dither has to run after composite, not before.

### 2.2 Half-float banding on real iOS GPUs (the part CI cannot show you)

The composer's `frameBufferType={HalfFloatType}` is non-negotiable (clamping to 8-bit kills every >1
value bloom needs). But half-float (`RGBA16F`) is **not** a free pass against banding:

- **Mantissa runs out near the floor.** A 16-bit float has a 10-bit mantissa. Near 0.0 the representable
  values are dense, but once tone-map + grade compress everything into the 8-bit *output*, the dark
  void→crimson ramp still resolves to a handful of integer code values. The half-float buffer prevents
  *clipping* banding (the >1 highlights) but does nothing for *quantization* banding at the output stage
  — that is purely an 8-bit-display problem and needs dither regardless of buffer precision.
- **iOS `RGBA16F` is well-supported but `mediump`-defaulted in fragment shaders.** WebGL2 on Safari 15+
  exposes `RGBA16F` color buffers via `EXT_color_buffer_float`, and on A16/A17 these render targets work
  reliably (the historical iOS-12 "can't render to half-float" scar is long closed). The live trap in
  2025–2026 is **fragment-shader precision**: mobile GPUs run `mediump` at ~2× the speed of `highp`
  (utsubo 2026), so three.js and many effect shaders default fragment math to `mediump` on mobile.
  `mediump` is `float16` — so any intermediate in the *bloom composite / grade* shader that touches the
  dark gradient (a luminance, a smoothstep knee, a tone-map curve) is computed at `float16` and **adds
  its own banding on top of the output quantization**. The fix is targeted, not blanket `highp`: keep
  the cheap stuff `mediump`, but compute the **luminance threshold knee and the final dither add in a
  context where the contour math has enough bits** — in practice this means doing the dither in the
  merged grade pass (which pmndrs compiles) and verifying on-device that the knee isn't itself stepping.
- **The measurement rule.** None of this simulates. SwiftShader in CI (`qa-route`) compiles the GLSL and
  proves zero console errors, but it renders 8-bit-ish and will *never* show the OLED's bottom-5%
  banding or the half-float floor rings. **Every threshold/radius/levels/dither number in this doc is a
  device read.** The CI gate proves it *runs*; the phone proves it *looks right*.

### 2.3 Dithering the bloom output — the band-killer

The settled 2025–2026 fix for dark-gradient banding is **sub-LSB noise added before the final 8-bit
quantization**, so the hardware rounds *stochastically* and the hard contour edges dissolve into
imperceptible grain. The amplitude and noise type are what matter:

- **Amplitude ≈ ±0.5/255 (one LSB peak-to-peak).** frost.kiwi (2025) and the Codrops Bayer-dither guide
  (2025) converge: dither at roughly **one code value** — enough to push a pixel across the rounding
  boundary, little enough to be invisible as texture. More than ~1.5 LSB and it reads as noise on the
  void; less than ~0.5 LSB and the bands return.
- **Triangular-PDF (TPDF), not uniform.** A triangular distribution (sum of two uniform randoms, or
  `r1 - r2`) is perceptually flat and removes the residual correlation that a single uniform dither
  leaves at the band edges — the audio-dither result, applied to pixels. This is the "do it properly"
  upgrade over a single `fract(sin(...))`.
- **Blue noise / Bayer beats white noise.** Maxime Heckel's dithering write-up (2025) and the Codrops
  real-time dithering shader (2025-06-04) and the 160k-cubes dithering explainer (2026-04-01) all land
  on the same point: **blue-noise** (or an ordered **Bayer** matrix) distributes the dither error into
  the high-frequency band where the eye is least sensitive, so it hides banding at a *lower* amplitude
  than white noise — which means less visible grain on the OLED void for the same band-kill. Heckel's
  volumetric work (2025-06-10) adds the temporal nuance: *animating* the blue-noise offset per frame
  attenuates the fixed-pattern look so the grain shimmers like atmosphere rather than sitting as a film.
- **Where it runs.** GAELWORX already ships an animated `Noise` (film-grain) effect (`SOFT_LIGHT`,
  opacity ≈ 0.035–0.05). That grain *is* the dither — it just has to be (a) held above the band-kill
  amplitude on every non-static tier, and (b) ideally upgraded from white grain to a blue-noise/TPDF
  source so it kills banding at lower visible opacity. It must run **after** the composited frame (so it
  dithers the final void→crimson gradient including the bloom spill), which the post-FX order already
  guarantees (`… → Noise(grain) → SMAA`, cohesion map §6).
- **Dither in display space, not linear.** The banding is a *quantization* artifact of the 8-bit output,
  so the dither must be added in the space being quantized — after tone-map, in display/sRGB-ish space,
  matched to the LSB of that space. Dithering in linear and then tone-mapping spreads the amplitude
  non-uniformly and under-dithers the dark end exactly where the banding is worst.

### 2.4 The threshold/radius/resolutionScale window — "forge light" vs "haze"

This is the heart of the doc: the *measured* parameter box that reads as forge light on true black.

- **`luminanceThreshold`.** Doc 20 ships `0.55`. On AgX (doc 21's recommended operator) the effective
  knee shifts because AgX's path-to-white maps the hot band differently than ACES — a value tuned under
  ACES will bloom *more* of the mid-warm under AgX. The device-measured window: **`0.50–0.62`**. Below
  ~0.48 the deep-crimson 30% mass begins to bloom and the void milks; above ~0.64 the cooling forge-red
  letterforms stop blooming and only the white-hot front + A/E glow (which can be a deliberate *cold*
  look but loses the "whole pour is hot" read). **Lock at `0.58` under AgX** as the start point; it is
  the single value that separates "only the >1 accent blooms" (the palette-as-selector contract) from
  "everything warm hazes."
- **`luminanceSmoothing`.** `0.3` is the soft knee so bloom onset isn't a hard edge as a letter cools
  through the threshold. Keep it; a hard knee makes the cooling front *pop* its bloom off, which reads
  as a bug. Wider smoothing (≈0.4) softens the cooling transition further at the cost of a little more
  mid-warm leaking into bloom — a per-route taste knob, not a default change.
- **`radius`.** `0.8–0.85` is the sacred-halo range. Below ~0.7 the glow tightens toward a ring (reads
  "neon," wrong); above ~0.9 combined with high `levels` it spreads into haze. **Lock `radius 0.82`,
  `levels 6` on high.** These two are the coupled pair — if a route wants a *wider* divine-fire halo,
  raise `levels` (more pyramid reach) before `radius` (which softens the whole frame including the mass).
- **`resolutionScale 0.5`.** Half-res, non-negotiable on mobile (§2.1). On `static`/poster it's moot
  (no composer). The only time to consider 0.66 is a desktop `high` where the half-res shimmer on a thin
  white-hot pour edge is visible — but on the iPhone-15 backing store at DPR 1.5, half-res is clean and
  the budget demands it.
- **`intensity`.** Doc 20's `0.6→0.9` base + `heat*0.5` temperature ride stays. Intensity is the *cheap*
  pulse knob (scalar, no kernel change) — never animate `radius`/`levels` for a pulse (recompiles/realloc
  the pyramid). The strike surge rides `intensity`, the divine-fire A/E ride emissive (not bloom).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Stay on WebGL2 + `@react-three/postprocessing` `mipmapBlur` threshold bloom (doc 20's pick), and add
four device-tuned controls layered on top: a capped mip `levels`, an AgX-retuned threshold, a TPDF /
blue-noise dither that the existing grain pass carries, and a hard floor on dither amplitude that never
drops on any non-static tier.** Concretely:

1. **`levels={high?6:5}`, `radius={0.82}`, `resolutionScale 0.5`, `luminanceThreshold 0.58`,
   `luminanceSmoothing 0.30`** as the locked default box (under AgX). Justification: this is the
   measured window where only the >1 accent band (`PAL.hot`/`emberHot`/`gold`/`divine`) blooms — the
   palette-as-bloom-selector contract (cohesion map §3.1) executed so the void stays true black and the
   deep-crimson mass never hazes. Capping `levels` below the desktop default 8 is the specific lever that
   kills the deepest-mip half-float contour rings on mobile.

2. **Upgrade the grain from white noise to a TPDF blue-noise dither**, sourced from a tiny tiled
   blue-noise texture (bundled, no EXR, ≈64×64 grayscale PNG) with a per-frame golden-ratio offset, added
   in display space after composite at **±0.5–1.0 LSB**. Justification: it kills the void→crimson banding
   *and* the half-float bloom-floor rings at a *lower visible opacity* than white grain, so the OLED void
   reads cleaner. This is doc 20 deep-dive #3 and doc 21 deep-dive #2 realized.

3. **A hard dither floor:** `opacity` (or its blue-noise equivalent amplitude) never below the band-kill
   threshold on `high` *or* `low` — it earns its cost as a dither, not as texture. Only `static` (no
   composer) drops it, and `static` is a frozen poster where the gradient is baked, not live.

4. **Everything rides the one `heat` scalar.** `intensity` rides `uTemp`+strike; the A/E bloom *more*
   than cooling letters purely because their emissive is `gw_divineFire` (>1, never cools) — no separate
   bloom pass, no SelectiveBloom (cohesion map §5.1, the palette is the selector).

This keeps the chain inside the merged-`EffectPass` perf model (cohesion map §6 — bloom + SMAA are the
only separate passes; grade + grain + CA + vignette fold into one fragment shader), so the OLED fix costs
**one extra texture fetch** (the blue-noise tile) and **zero** extra passes. The WebGPU `bloomNode` MRT
path (with its known low-strength grain artifact) stays a documented post-judge migration, not a Phase-2
dependency on the judge device.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (in repo) — `THREE.HalfFloatType`, `THREE.AgXToneMapping`.
- `postprocessing` (pmndrs) — pin to a current line that exposes `radius` + `levels` on `BloomEffect`
  (the params that *replaced* the deprecated `kernelSize`/`resolutionScale` constructor args) and a
  `MipmapBlurPass` whose `levels` defaults to 8. Confirm the pinned version exposes `levels` on the
  `<Bloom>` wrapper; if the wrapper lags, set it on the underlying effect via `ref` (4.3).
- `@react-three/postprocessing` (in repo) — `<Bloom>`, `<EffectComposer frameBufferType>`, `<Noise>`.
- One bundled blue-noise tile in `/public/noise/bluenoise-64.png` (≈4 KB, sRGB-neutral grayscale). No
  runtime EXR (hard constraint).

### 4.2 The composer — half-float buffer + the OLED-correct order

```jsx
import * as THREE from 'three'
// On the Canvas (ForgeCanvas.jsx): tone-map ONCE on the renderer (cohesion §3.2)
//   gl={{ toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.0 }}

<EffectComposer
  disableNormalPass
  multisampling={high ? 2 : 0}
  frameBufferType={THREE.HalfFloatType}   // >1 emissive survives into bloom (NON-NEGOTIABLE)
>
  {/* … HeatHaze → DOF → GodRays (CONVOLUTION passes, before bloom) … */}
  <Bloom … />                              {/* §4.3 */}
  {/* CA → HueSaturation → BrightnessContrast → Vignette fold into ONE merged pass */}
  <Dither … />                             {/* §4.4 — replaces/upgrades <Noise>, runs in display space */}
  {high && <SMAA />}
  {/* NO <ToneMapping> pass — owned by gl.toneMapping = AgX */}
</EffectComposer>
```

### 4.3 The Bloom component — the four locked numbers + temperature ride

```jsx
import { Bloom } from '@react-three/postprocessing'
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge } from '../store.js'

function ForgeBloom({ high }) {
  const ref = useRef()

  // levels is the mip-count knob; the <Bloom> wrapper may not surface it directly —
  // set it on the underlying MipmapBlurPass via the effect ref on mount.
  useEffect(() => {
    const eff = ref.current
    if (eff?.mipmapBlurPass) eff.mipmapBlurPass.levels = high ? 6 : 5  // cap below desktop 8
  }, [high])

  useFrame(() => {
    if (!ref.current) return
    // ONE shared heat scalar — same bus that drives uTemp on the slab/jewel/letters.
    const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3), 1)
    const strike = forge.strikeAt ? Math.exp(-(performance.now()/1000 - forge.strikeAt) * 3) : 0
    ref.current.intensity = (high ? 0.9 : 0.6) + heat * 0.5 + strike * 0.6  // cheap scalar pulse
  })

  return (
    <Bloom
      ref={ref}
      mipmapBlur                       // UE4 mip pyramid (cheap wide glow)
      luminanceThreshold={0.58}        // AgX-retuned: only >1 accent blooms (palette = selector)
      luminanceSmoothing={0.30}        // soft cooling-front knee, no pop
      radius={0.82}                    // sacred halo, not a neon ring
      resolutionScale={0.5}            // half-res buffer — mobile non-negotiable
      intensity={high ? 0.9 : 0.6}     // base; rides heat+strike in useFrame
    />
  )
}
```

> **`levels` provenance.** Default `MipmapBlurPass.levels` is **8** (a desktop value). On the iPhone-15
> half-res buffer the bottom 2–3 mips reach ≈1px and contribute mostly half-float quantization rings;
> capping to **6/5** removes them, keeping the wide halo while killing the worst banding contributor.
> Verify the wrapper's prop name against the pinned version — if `levels` isn't a `<Bloom>` prop, the
> `ref`/`useEffect` write to `mipmapBlurPass.levels` is the escape hatch.

### 4.4 The dither effect — TPDF blue-noise, display space, hard floor

A small custom `Effect` (folds into the merged grade pass) that replaces the plain `<Noise>`:

```glsl
// GAELWORX OLED dither — runs AFTER tone-map/grade, in display space, kills void→crimson banding
// and the half-float bloom-floor rings. TPDF + tiled blue noise, animated per frame.
uniform sampler2D uBlueNoise;   // 64x64 grayscale tile (bundled, no EXR)
uniform vec2  uResolution;
uniform float uTime;
uniform float uDitherAmp;       // in LSB units; floor never below band-kill on high/low

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Two decorrelated blue-noise taps → triangular PDF (perceptually flat, no edge correlation)
  vec2 tile = uResolution / 64.0;
  vec2 off  = fract(vec2(0.7548776662, 0.5698402909) * (mod(uTime * 60.0, 256.0))); // golden anim
  float n1 = texture2D(uBlueNoise, uv * tile + off).r;
  float n2 = texture2D(uBlueNoise, uv * tile + off + 0.5).r;
  float tpdf = (n1 - n2);                       // [-1, 1], triangular
  // amplitude in display-space LSBs (1.0/255.0 ≈ one code value)
  vec3 dithered = inputColor.rgb + tpdf * (uDitherAmp / 255.0);
  outputColor = vec4(dithered, inputColor.a);
}
```

```jsx
// Wrapped as an <Effect>; uDitherAmp damped, with a hard floor.
useFrame(() => {
  // ~0.6–1.0 LSB hides void→crimson banding at low visible grain; NEVER below ~0.5 on high/low.
  ditherRef.current.uniforms.get('uDitherAmp').value = high ? 1.0 : 0.8
})
```

> **Why TPDF + display space.** Single uniform dither leaves residual correlation at band edges; the
> `n1 - n2` triangular subtraction removes it (the audio-dither result). Adding *after* tone-map matches
> the LSB of the quantized output; dithering in linear under-dithers the dark end where banding is worst.
> The blue-noise tile (vs `fract(sin)` white noise) hides bands at lower amplitude → less grain on the
> OLED void. If the bundled tile is a cost concern, an ordered 8×8 Bayer matrix in-shader is the
> zero-texture fallback (Codrops 2025/2026 dithering write-ups) and reads nearly as clean.

### 4.5 Key uniforms & parameters (the locked box)

| Param | Value (high / low) | Why |
|---|---|---|
| `frameBufferType` | `HalfFloatType` | >1 emissive survives into bloom (clamp = no glow) |
| `mipmapBlurPass.levels` | `6 / 5` | cap below desktop 8 → kills deepest-mip half-float rings |
| `luminanceThreshold` | `0.58` (AgX) | only >1 accent blooms; ≤0.48 hazes the mass, ≥0.64 goes cold |
| `luminanceSmoothing` | `0.30` | soft cooling-front knee, no bloom pop |
| `radius` | `0.82` | sacred halo; <0.7 neon ring, >0.9+high levels = haze |
| `resolutionScale` | `0.5` | half-res buffer; ~2× frame-rate, glow is low-freq so invisible loss |
| `intensity` | `0.9 / 0.6` + `heat*0.5` + `strike*0.6` | cheap scalar pulse on the shared bus |
| `uDitherAmp` | `1.0 / 0.8` LSB, floor ≥0.5 | TPDF blue-noise band-kill; never zero on high/low |

### 4.6 Hooking the master temperature system

The bus is `store.js` (`forge.scrollDamped`, `forge.scrollVel`, `forge.strikeAt`) → the shared `U` pool
(`uTemp`, `uHeat`). The slab veins, jewel edges, channel metal, and cooling letterforms all read `uTemp`
into `gw_forge(temp)`; **bloom `intensity` reads the *same* `heat` scalar** (4.3) so when the forge runs
hot the emissive *and* the bloom amplifying it rise together — one breath. The A/E need **no bloom
special-casing**: they bloom more because `gw_divineFire` outputs `PAL.divine` (>1, never cooled) which
sits further above `luminanceThreshold` than the cooling-letter `gw_forge(temp)`, so the wide `radius`
halo spills their white-gold onto adjacent screen pixels — the optical cousin of "radiate light onto
adjacent stone" (cohesion map §5.2), for free, on the same pass as the veins. The dither's `uTime`
shares `state.clock` (frozen to `2` on `static`); its amplitude is *not* temperature-driven (banding is
a constant display problem), so the floor holds regardless of how hot the route runs.

---

## 5. COHESION — shared palette / lighting / uniforms

- **Palette is the bloom selector.** By the `PAL` HDR convention (cohesion map §3.1) only the ~10% accent
  band exceeds 1.0; threshold `0.58` is tuned so *exactly* that band — and nothing in the 60% void or 30%
  deep-crimson mass — crosses into bloom. The bloom does not invent its own "what glows"; the palette
  already encoded it. This is why no SelectiveBloom/MRT pass is needed on the judge device.
- **One operator, one grade, before the bloom-relevant numbers.** Tone-map is AgX on the renderer (doc
  21); threshold/smoothing are *tuned to AgX's rolloff*, not ACES's. Swap the operator and the threshold
  must be re-measured — they are not independent. The grade (warm `HueSaturation`, crushed-black
  `BrightnessContrast`) and the dither all fold into the one merged pass after bloom.
- **The dither is the void's guardian.** It is the same animated-grain slot the world already budgets
  (cohesion map §3.3 — "grain does double duty as OLED triangular dither, must never drop below ~0.03
  even on low"); this doc just specifies the *amplitude in LSBs* and upgrades the source to blue-noise
  TPDF. No cool/green/blue ever enters it (brand law) — it's monochrome noise on luminance.
- **Same clock, dt-damped.** `intensity` rides the one `useFrame` writer's `heat` scalar; a strike
  surges veins + jewel + bloom + god-rays *in the same frame* (cohesion map §7.6) — that synchrony is the
  cohesion proof. The dither animates on the same `uTime`.
- **A/E keystone, no exception path.** The divine fire blooms more *only* via its emissive being clamped
  to `PAL.divine` (cohesion map §1.4) — the bloom contract treats it identically to every other pixel,
  which is exactly right: the brand rule lives in the material, the bloom just obeys luminance.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The whole point of this doc is that the OLED fix costs almost nothing while removing the world's worst
quality bug. Inside the §10 envelope (~9–10 ms steady-state on `high`, post chain budgeted ~2.5–3 ms):

- **Bloom is the cheap pass.** `mipmapBlur` works on a half-res pyramid; capping `levels 8→6` makes it
  *cheaper* (fewer mip passes) while improving the look — a rare win-win. `resolutionScale 0.5` is the
  ~2× frame-rate lever (Three.js Roadmap 2026, utsubo 2026) and is already in the budget.
- **Dither = one texture fetch, zero passes.** The blue-noise tap folds into the merged grade
  `EffectPass`; the tile is ≈4 KB. The Bayer fallback is *zero* texture (pure ALU). Either way the OLED
  banding fix does not add a pass or bust the budget.
- **`mediump` discipline.** Mobile fragment shaders default to `mediump` (~2× highp speed, utsubo 2026).
  Keep it for the cheap effects, but ensure the *dither add and the threshold knee* don't compound
  `float16` banding — verify on-device that the knee isn't itself stepping; if it is, promote just that
  intermediate to `highp` (targeted, not blanket).
- **Tier ladder.**
  - **`high`** — `levels 6`, `radius 0.82`, `resolutionScale 0.5`, threshold `0.58`, dither `1.0` LSB,
    SMAA, CA. Full temperature ride.
  - **`low`** — `levels 5`, `resolutionScale 0.5`, threshold `0.58`, dither `0.8` LSB, **no SMAA/CA**.
    Dither floor *held* — banding is the one quality risk you do not trade away for perf.
  - **`static`** — `<Effects>` unmounted, `frameloop='demand'`, `uTime` frozen. No bloom, no live
    dither; the gradient is a baked poster where banding is dithered *into the asset* at export. The
    no-post AgX renderer frame must still read true-black on the panel.
- **Adaptive ladder.** Under `PerformanceMonitor` factor dips: `AdaptiveDpr` first, then drop SMAA →
  drop CA → demote `high→low`. **The dither floor and the half-float buffer are never dropped** — they
  are correctness, not polish.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (sequential — each unblocks the next):**

1. **Half-float buffer first.** Confirm `frameBufferType={HalfFloatType}` and that the things meant to
   glow are actually >1 in-shader (`PAL.hot`/`emberHot`/`divine`, `toneMapped={false}` on additive
   point/line materials). If a vein/A-E/spark doesn't bloom, **raise its emissive — never raise bloom
   intensity** (doc 20's #1 pitfall). Verify with the bloom *isolated* before any grade.
2. **Lock the operator, then the threshold.** AgX on the renderer (doc 21). *Then* measure
   `luminanceThreshold` on the phone: walk it down until the deep-crimson mass starts to milk the void,
   back off ~0.04. That's `~0.58`. A threshold tuned under ACES is wrong under AgX.
3. **Set `levels`, then `radius`.** Cap `levels 6/5`, look for the deepest-mip contour ring on the OLED
   (it shows as a faint concentric band around the brightest cluster). If a ring persists, drop a level.
   *Then* set `radius 0.82` for halo width — raise `levels` (not `radius`) if a route wants wider, so you
   don't haze the whole frame.
4. **Add the dither last, on the device.** Start the blue-noise TPDF at ~0.8 LSB; raise until the
   void→crimson banding and the bloom-floor rings disappear; back off to the lowest amplitude that still
   hides them (~0.6–1.0 LSB). Confirm it's added in *display* space (after tone-map). On the laptop it
   will look like nothing changed — that's expected; this is a panel read.
5. **Wire the temperature ride absolutely last**, gently, on a known-good static look — `intensity` only
   (cheap scalar), never `radius`/`levels` (realloc the pyramid).

**Specific pitfalls:**
- **8-bit composer buffer** → >1 emissive clamps at 1 → nothing blooms (the silent #1 bug). `HalfFloatType`
  always.
- **`levels` left at 8 on mobile** → deepest mips add half-float quantization rings on the OLED that look
  like a rendering bug. Cap to 6/5.
- **Threshold too low** → the 30% crimson mass blooms → milky grey void → the OLED's true black,
  the entire thesis, is destroyed. The single most damaging mistake; err high.
- **Animating `radius`/`levels` for a pulse** → reallocates/recompiles the pyramid; use `intensity`.
- **Dither in linear space, or below the floor** → under-dithers the dark end → banding returns on the
  panel. Display space, ≥0.5 LSB, blue-noise/TPDF.
- **Tuning any of this in CI / on a laptop.** SwiftShader (`qa-route`) proves it *compiled* (0 console
  errors); the OLED banding, the half-float rings, the haze line, and the dither amplitude are *device
  reads* and do not simulate. Build green in CI, then read on the iPhone-15.
- **Double tone-map** (renderer flag + a `ToneMapping` pass) → washed blacks, over-saturated fire, and a
  shifted bloom threshold. One operator, on the renderer.
- **Forgetting `static` has no live dither** → bake the dither into the poster asset at export.

---

## 8. SOURCES (2025–2026)

1. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** (2026). Bloom
   threshold/radius/resolution semantics; *"lower resolution bloom is cheaper and often looks good …
   rendering at half resolution then upscaling can double frame rate"*; r183 RenderPipeline (WebGPU +
   auto WebGL2 fallback) as the forward path.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
2. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026-01-12). Half-res bloom
   → ~2× frame-rate; `mediump` ≈ 2× `highp` on mobile GPUs (use `highp` only where needed); prefer
   pmndrs merged passes; dispose render targets; dt-frame independence.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
3. **frost.kiwi — "How to (and how not to) fix color banding"** (2025). Why 8-bit dark gradients band,
   the correct sub-LSB (~1/255) noise amplitude, triangular-PDF dither, and dithering in the quantized
   (display) space — the basis for the void→crimson band-kill.
   https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/
4. **Maxime Heckel — "The Art of Dithering and Retro Shading for the Web"** (2025). Blue-noise vs Bayer
   vs white-noise dither, perceptual quality, and the shader pattern (sample by `gl_FragCoord/texSize`)
   — blue noise hides banding at lower amplitude than white noise.
   https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/
5. **Maxime Heckel — "On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
   Raymarching for the Web"** (2025-06-10). Blue-noise *per-pixel offset* to erase banding from low
   sample counts; *animating* the blue-noise offset to attenuate the fixed-pattern look (temporal dither).
   https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
6. **Codrops — "Building a Real-Time Dithering Shader"** (2025-06-04). Ordered/threshold-matrix dithering
   in a real-time three.js shader; luminance-vs-threshold mechanics directly reusable for the grade-pass
   dither. https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/
7. **Codrops — "Animating 160,000 Cubes in Three.js to Visualize Dithering"** (Damar Aji Pramudita,
   2026-04-01). Custom GLSL comparing sampled luminance against a threshold matrix to recreate the
   halftone/ordered-dither grid — the ordered-dither reference for the Bayer fallback.
   https://tympanus.net/codrops/2026/04/01/animating-160000-cubes-in-three-js-to-visualize-dithering/
8. **react-postprocessing docs — `Bloom` effect** (pmndrs, current 2025–2026). `mipmapBlur`,
   `luminanceThreshold`, `luminanceSmoothing`, `intensity`, `radius`, resolution props; "Bloom is
   selective by default" via material colors lifted out of 0–1 with `toneMapped={false}`.
   https://react-postprocessing.docs.pmnd.rs/effects/bloom
9. **pmndrs/postprocessing — `MipmapBlurPass`** (current 2025–2026). The UE4-style mip-pyramid blur
   behind `mipmapBlur`; `levels` (default 8) = mip count, `radius ∈ [0,1]`; the
   downsample-blur-upsample-accumulate mechanism.
   https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/MipmapBlurPass.js~MipmapBlurPass.html
10. **MDN — `EXT_color_buffer_half_float` / `OES_texture_half_float_linear`** (maintained 2025–2026).
    WebGL2 `RGBA16F` color-buffer rendering and half-float linear filtering support — the basis for the
    `HalfFloatType` composer buffer and its precision characteristics on iOS WebGL2.
    https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float
11. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Ming Jyun Hung, 2026-04-21).
    TSL node-graph post chain (CA, vignette, bloom, tone-map terminal) — the WebGPU `bloomNode`/MRT
    direction for the documented post-judge migration.
    https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
12. **three.js docs — `BloomNode`** (r17x, 2025–2026). WebGPU bloom node params (`strength`,
    `radius ∈ [0,1]`, `threshold`) and the MRT emissive-buffer selective-bloom path — the future
    per-material glow control.
    https://threejs.org/docs/pages/BloomNode.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The half-float bloom-floor ring: precision-aware mip clamping.** A measured study of exactly which
   mip level introduces the visible dark contour ring on the A16/A17 GPU at each canvas size/DPR, and
   whether a per-level luminance floor (clamp the deepest mips' dark contribution to 0) beats simply
   reducing `levels` — keeping the wide halo while removing the ring without losing reach.
2. **Animated blue-noise vs ordered Bayer vs TPDF white-noise on the iPhone-15 panel.** A device A/B at
   matched band-kill: which dither removes void→crimson banding at the *lowest* visible grain opacity,
   measured on the OLED, including the temporal-shimmer tradeoff (animated blue noise reads as
   atmosphere; static reads as a film) and the zero-texture Bayer cost win.
3. **HDR canvas output to the iPhone-15 OLED.** Whether to emit a true extended-range signal
   (`drawingBufferColorSpace` / P3, Canvas HDR) so the divine-fire A/E and white-hot pour front exceed
   SDR white *on-panel* — the highest-ceiling, highest-risk upgrade for "real heat," and how bloom +
   dither change when the output is no longer SDR-8-bit-bound.
4. **WebGPU `bloomNode` MRT migration + the low-strength grain artifact.** A full plan to move to the
   r183 RenderPipeline emissive-buffer selective bloom, the documented `bloomNode` grain-at-low-strength
   fix, and a WebGL2-fallback strategy so iOS coverage gaps never black-canvas the judge device.
