# 34 — OLED Dither Pipeline: Blue-Noise vs Triangular Grain vs Bayer

_Phase-2 deep-dive · GAELWORX forge world · target: iPhone 15 OLED, single WebGL renderer_
_Parent: Phase-1 doc 21 (Color Grading & Tone Mapping for OLED), deep-dive candidate #2 · sibling of doc 20 (Bloom & post stack)_

> Scope note: doc 21 picked the tone-map operator (AgX) and the grade, and declared that **animated film
> grain doubles as OLED dither** to kill the void→crimson banding the deep gradients show on a true-black
> panel. This deep-dive is the measured answer to the question doc 21 deferred: **which dither, at what
> amplitude, in which color space, kills the banding most cleanly at the lowest visible cost on the
> iPhone-15 OLED** — blue-noise texture, triangular-PDF procedural grain, or ordered Bayer. It also names
> the **one mobile QUALITY (not perf) risk** of the whole build: 8-bit quantization banding in the dark
> gradients, on a panel deep enough to expose it. This is the document that turns "a whisper of grain" into
> an engineered, signal-correct dither contract bound to the shared post stack.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is **60% void**. The dominant pixel in every chamber is a near-black value sliding from Forged
Iron `#0B0C10` up through deep Celtic-Blood crimson toward the ember accent — a gradient that lives almost
entirely in the **bottom 5% of the 8-bit output range**. That is precisely the region where 8-bit
quantization steps are largest *relative to the values being represented*, and the iPhone-15 OLED — which
renders true `(0,0,0)` (pixels off) and resolves near-black gradation with no backlight to hide it — is the
single most banding-revealing display the work will ever be judged on. The deep void→crimson ramp behind
the cooling letterforms, the radial falloff of the divine-fire A/E spill onto basalt, the smoke/haze
absorption tint, and the dim warm forge-fill on the lower hemisphere of the reflection env are all smooth
dark gradients. **Every one of them bands** at 8-bit without a dither, and on the OLED the band edges read
as hard contour lines the eye locks onto — the single fastest "web demo, not cinematic" tell in a dark
scene.

Dither is the fix: add a sub-LSB (less than one 8-bit step) noise to the linear color *before* the GPU
quantizes to 8-bit, so the rounding decision is made stochastically per pixel and the hard band edge
dissolves into imperceptible high-frequency stipple. The human visual system integrates that stipple back
into a smooth gradient — the same trick that has let 1-bit and audio systems represent more levels than
their bit depth since the 1960s. This document owns: the **choice of dither source** (blue-noise vs
triangular-PDF grain vs Bayer), the **amplitude** (how much noise, exactly), the **color space** to dither
in (linear vs display), the **animation** (static vs per-frame), where it **sits in the post chain**, and
how it **degrades** across tiers without ever reintroducing the banding it exists to kill. It is bound to
the shared post stack (doc 20), the AgX grade (doc 21), and the master temperature bus only loosely — dither
is the one post element that is deliberately *content-independent* (it must be there at every temperature),
so its main cohesion job is to be **one dither, applied once, in the right space**, not eight private grains.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are three families of GPU dither in current web-graphics practice, plus the color-space and
animation axes that cut across all three. Every option below is fragment-shader-affordable; the decision is
about **quality-per-LSB** and **artifact signature**, not raw cost.

### 2.1 Ordered / Bayer dithering

A fixed N×N threshold matrix (2×2, 4×4, 8×8, 16×16) tiled across the screen; each pixel's threshold is
looked up by `mod(gl_FragCoord.xy, N)` and used to bias the quantization. It is the cheapest and most
deterministic dither — Codrops' July-2025 "Quick Guide to Bayer Dithering" generates an entire interactive
Bayer-dithered background **in a single GPU pass, under 0.2 ms even at 4K, in ~3 KB** — and three.js now
ships it **first-class** as a TSL node: `bayer16` from `three/addons/tsl/math/Bayer.js` samples a
base64-embedded 16×16 Bayer texture and is documented explicitly as a banding-killer for
`VolumeNodeMaterial.offsetNode` ray-march offsets and "as an alternative to blue-noise."

- **Quality:** good for *retro/stylized* looks (the cross-hatch is part of the aesthetic), **but its
  structured grid is its liability for a photoreal forge** — a regular 4×4/8×8 pattern is visible as a
  faint cross-hatch weave on a large flat dark gradient, and the eye, which is excellent at spotting
  periodicity, finds it. On a true-black OLED a static Bayer weave over the void reads as a screen-door
  artifact. A 16×16 matrix (three's choice) and per-frame animation hide it better, but you are then paying
  to hide a pattern blue-noise never had.
- **Perf:** the cheapest of the three — a texture fetch (or a few ALU ops for a procedural 8×8).
- **Mobile:** trivial. **Complexity:** trivial (built into three's TSL).
- **Verdict for GAELWORX:** the *fallback/static-tier* dither and the *ray-march offset* dither (god-rays,
  smoke — doc 30 already uses blue-noise there; Bayer is the zero-asset substitute), **not** the hero
  full-screen grade dither, because the weave fights the "raw, cinematic, not stylized" quality bar.

### 2.2 Blue-noise texture dither

Sample a precomputed blue-noise texture (e.g. the free 64×64 / 128×128 tileable textures from Christoph
Peters' *Moments in Graphics* set, or Heckel's web-dithering lineage) at `gl_FragCoord.xy` and use the
value to dither. Blue noise is white noise with the **low frequencies removed** — its energy sits where the
eye is least sensitive (high spatial frequency) and it has "fewer clumps than other noises and is less
visible to the human eye." This is the quality champion: it dissolves bands into a stipple that reads as
*clean film grain*, not structure and not clumpy TV static.

- **Quality:** best-in-class. The Maxime-Heckel 2025 dithering write-up and the Codrops 2025 dithering
  pieces all rank blue-noise above Bayer for smooth-gradient work; it is what doc 30's god-rays already use.
- **Cost vs procedural:** one texture fetch per pixel + the VRAM/bytes of the texture. A 64×64 R8 tile is
  ~4 KB; bundled (not network-fetched) it is negligible — but it is **one more texture binding and one
  more sampler** in the merged `EffectPass`, and on mobile every bound texture and dependent fetch counts.
  The texture must be sampled with `NearestFilter`, `RepeatWrapping`, and **no mipmaps** (a mip-filtered or
  linearly-interpolated blue-noise texture loses its spectral property and bands again).
- **Animation:** a *static* blue-noise tile is the gold standard for a still frame, but if the camera is
  still the stipple is frozen and can read as fixed dirt on the lens. The standard 2025 fix (doc 30 already
  applies it) is a **per-frame offset by the golden-ratio increment** (`+0.61803398875` to the sampled
  value each frame, fract-wrapped) — this animates the dither into temporal stipple that the eye averages
  to a cleaner gradient, *without* re-fetching or scrolling the texture (scrolling would reintroduce
  low-frequency drift). This is "Animated Noise" in the demofox/Wronski lineage, restated in the 2025 web
  write-ups.
- **Mobile:** fine, but it is the heaviest of the three by a hair (the fetch). **Complexity:** low — but you
  own a texture asset and its sampler state.

### 2.3 Triangular-PDF (TPDF) procedural grain

Generate noise procedurally in the shader (no texture) and — critically — shape it to a **triangular
probability distribution** before adding it. This is the move most web dither code gets wrong and the one
that matters most for *correctness*. A naïve `hash(uv)` gives a **uniform (rectangular, RPDF)**
distribution; dithering with RPDF leaves the quantization noise **signal-dependent** (its variance pumps
with the input value — visible as the grain "breathing" as the gradient passes through band centers). The
signal-processing-correct dither is **TPDF**: triangular, amplitude **±1 LSB peak (2 LSB wide)**, which
renders the quantization error's mean *and variance* independent of the signal — a flat, non-pumping noise
floor. TPDF is trivially generated by **summing/subtracting two independent uniform random values**
(convolution of two rectangles is a triangle): `tri = R(a) - R(b)`, each `R∈[0,1)`, giving `tri∈(-1,1)`
with a triangular PDF; scale to `±1/255`.

- **Quality:** the *signal-correct* choice — no pumping, flat floor. Spatially it is **white-spectrum**
  (the two hashes are uncorrelated), so it is slightly clumpier than blue-noise at the same amplitude (the
  eye can see faint white-noise grain where blue-noise would be invisible), but for the **very low amplitude
  GAELWORX needs (±0.5–1 LSB)** the spectral difference is barely perceptible and the *temporal* animation
  (a per-frame seed) hides it completely. This is exactly the "animated film grain ≈ dither" doc 20/21
  already specified, now made *triangular* and *amplitude-locked* instead of an eyeballed `SOFT_LIGHT`
  blend.
- **Cost:** **zero texture, zero binding** — two cheap hashes (or one interleaved-gradient-noise eval, §2.4)
  and a subtract. The lowest *system* cost (no asset, no sampler) even though it is marginally more ALU than
  a single Bayer/blue-noise fetch.
- **Mobile:** ideal — no extra texture pressure, no sampler, fully procedural. **Complexity:** low, but you
  must get the **±1 LSB amplitude and the TPDF shaping** right (the two pitfalls in §7).
- **The near-black caveat:** TPDF (and any symmetric dither) at full ±1 LSB amplitude **lifts true black**
  by ~20% of a quantization step and darkens pure white, because the noise can push a `0` value above the
  0.5-LSB rounding threshold. On a true-black OLED that means the void is no longer pixels-off — a faint
  glow. The fix (Wronski; restated 2025) is to **fade the dither amplitude to zero as the value approaches
  0 and 1** (`amp *= smoothstep(0.0, 2/255, luma)` near black), or simply run at ±0.5 LSB. GAELWORX must do
  this — the true-black void is the whole thesis.

### 2.4 Interleaved Gradient Noise (IGN) — the cheap structured hybrid

Activision's IGN (`fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))))`) is "halfway between a
dither pattern and noise," ~half the instruction count of a good white-noise hash, low-discrepancy, evenly
distributed, and artifact-resistant. The 2026 ecosystem treats it as the default *procedural* dither basis
(Phaser 4's March-2026 dev log uses GPU dithering for its color ramps; the *Good TSL* and Three.js-Roadmap
2026 noise references list IGN as the go-to). It is a strong **source** to feed into the TPDF construction
(use two IGN evals with different seeds → triangular), giving "blue-noise-ish for free" without a texture.
Its only weakness is a faint diagonal structure at higher amplitudes — irrelevant at ±1 LSB.

### 2.5 The color-space axis (cuts across all three)

Where you add the dither matters as much as which noise you use. **Dither must be applied in the space where
quantization happens — i.e. immediately before the 8-bit write, in the *display-referred / gamma-encoded*
signal, scaled to that space's LSB (`1/255`).** This is the consensus of the 2025 references (frost.kiwi;
shadertoy "Dithering: linear vs gamma"; threadlocalmutex): the visible band is a *post-quantization* artifact
in display space, so the corrective noise must be ±1 LSB *in display space*. Dithering in **linear** light
before the sRGB/AgX encode is **wrong for banding** — a fixed linear amplitude becomes a wildly varying
display-space amplitude (huge in shadows, invisible in highlights), so it over-grains the void and
under-dithers the mids, the exact opposite of what you want. (Linear-space dithering is the right call only
for a *different* problem — error-diffusion intensity correctness — which we are not doing.) **Conclusion:
dither last, in display space, after tone-map+grade, scaled to `1/255`.** With AgX on the renderer flag, the
tone-map is the terminal output stage, so the dither pass must sit just before it conceptually — in practice,
because pmndrs applies tone-mapping as the very last renderer step, the grain effect runs on tone-mapped (but
not-yet-8-bit-written) color, which is display-referred — correct.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship triangular-PDF (TPDF) procedural grain as the hero full-screen dither — amplitude ±1 LSB
(`1.0/255.0`), built from two interleaved-gradient-noise evals, animated per-frame by a frame-seed,
near-black/near-white amplitude rolloff to protect the OLED true-black, applied in display space as the
terminal post step. Keep a static `bayer16` TSL node as the static-tier / WebGPU-port dither, and keep
blue-noise reserved for the ray-march offsets (god-rays/smoke, doc 30) where its spatial spectrum buys
step-count.** Justification, tied to the world and the constraints:

1. **TPDF is the signal-correct dither, and "no pumping" is what a slow dark gradient needs.** The hero
   artifact is the void→crimson ramp; an RPDF grain would visibly breathe as that ramp animates with
   `uTemp`. TPDF's signal-independent floor is the difference between "clean film stock" and "noisy in the
   mids, clean at the edges." This is the upgrade over the eyeballed `SOFT_LIGHT` grain doc 21 shipped.

2. **Zero texture, zero sampler = it fits the mobile budget with no asset.** The forge has a tiny texture
   budget (no EXR, compressed everything). A procedural TPDF grain adds **no binding, no VRAM, no network**,
   only a handful of ALU ops folded into the already-merged `EffectPass` — it is effectively free in the
   fill-rate-bound budget (doc 29: pixels are the enemy, but ALU-light per-pixel math is the cheap kind).
   Blue-noise's one fetch is affordable but unnecessary at the amplitude we need; we spend that texture
   slot where it actually buys something (the raymarch, doc 30).

3. **Blue-noise's spatial advantage is wasted at ±1 LSB on an animated grain.** Blue-noise wins when the
   dither is *large and static* (big stipple you'd otherwise see clumping). At ±0.5–1 LSB, animated, the
   stipple is sub-perceptual regardless of spectrum; paying a texture fetch to make invisible grain
   *more* invisible is not a good trade on mobile. (We still use blue-noise for the raymarch, where the
   offset is large and the spectrum genuinely buys fewer steps.)

4. **Bayer's weave fights the brand.** GAELWORX is "raw, cinematic, NOT stylized retro." A structured
   ordered-dither grid is a *look*, and it's the wrong one for a photoreal molten forge. Bayer earns its
   place only on the **static tier** (a frozen poster where a single deterministic pass and zero animation
   cost matters, and the weave is invisible at ±1 LSB on a still) and as the **WebGPU-port** dither
   (three's built-in `bayer16` node is a one-liner there).

5. **Display-space, terminal, amplitude-rolloff — because the OLED is the judge.** The banding is a
   display-space artifact, so the noise is `1/255` in display space, added last. And because the panel
   shows true black, the near-black amplitude rolloff is **non-negotiable** — a flat ±1 LSB grain would
   lift the void off pure black and forfeit the entire OLED thesis. This is the one place the dither must be
   *content-aware* (of luma proximity to 0/1), nothing else.

**Net deliverable:** a `<ForgeDither>` effect (or a TSL `forgeDither` node) running TPDF grain at
`1/255`, IGN-sourced, frame-animated, rolled-off near black/white, display-space, terminal — replacing the
generic `Noise(SOFT_LIGHT)` from doc 21 with an amplitude-locked, signal-correct dither that **never drops
below the banding-kill threshold on any non-static tier**.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (repo) — provides `THREE.AgXToneMapping` (terminal, owns the output encode) and, for the
  WebGPU port, the `bayer16` TSL node at `three/addons/tsl/math/Bayer.js`.
- `postprocessing` (pmndrs) + `@react-three/postprocessing` (repo) — the hero dither ships as a **custom
  `Effect`** subclass so it (a) merges into the single `EffectPass` fragment shader and (b) runs as the
  terminal effect, after grade, in display space. We do **not** use the stock `Noise` effect for the hero
  (it's a blend mode, not an amplitude-locked LSB dither); we keep `Noise` only as a coarse fallback.
- No new dependency. The grain is one custom effect file.

### 4.2 The GLSL — TPDF grain effect (WebGL2 hero path)

A pmndrs custom `Effect` injects a fragment-shader chunk that runs last. The math:

```glsl
// ── ForgeDither: signal-correct TPDF dither, display-space, terminal ──────────────
// Runs as the FINAL effect in the merged EffectPass, on tone-mapped (display-referred)
// color, immediately before the 8-bit write. Amplitude is ONE display-space LSB.

uniform float uDitherAmp;   // 1.0 typically (×1/255). Drops to ~0.6 on close-up dark chambers.
uniform float uFrame;       // frame counter (or uTime*60), animates the grain temporally.

// Interleaved Gradient Noise (Activision) — cheap, low-discrepancy, ~half a white hash.
// Seeded per-frame so the pattern is *animated*, not fixed lens-dirt.
float ign(vec2 p){
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// Two independent uniform sources → triangular PDF (convolution of two rects = triangle).
// Output in (-1, 1) with a triangular distribution; signal-INDEPENDENT noise floor.
float tpdf(vec2 frag, float frame){
  float r0 = ign(frag + 11.37 + frame * 1.000);
  float r1 = ign(frag + 71.13 + frame * 1.618);   // golden-ratio frame offset → clean temporal avg
  return r0 - r1;                                   // (-1,1), triangular
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec3 c = inputColor.rgb;                          // tone-mapped, display-referred (sRGB-ish)
  float frag = gl_FragCoord.x;                      // (use full vec2 below)
  // ONE LSB of triangular dither in display space:
  float n = tpdf(gl_FragCoord.xy, uFrame) * (uDitherAmp / 255.0);
  // Protect the OLED true-black (and true-white): fade the dither out near the rails so a
  // pure-black void stays pixels-OFF and isn't lifted ~0.2 LSB by symmetric noise.
  float luma = max(max(c.r, c.g), c.b);
  float rail = smoothstep(0.0, 2.0/255.0, luma) * smoothstep(0.0, 2.0/255.0, 1.0 - luma);
  c += n * rail;
  outputColor = vec4(c, inputColor.a);
}
```

Notes that make this correct, not just plausible:
- **One TPDF value, added to all three channels** (a single luma-grain) keeps the dither *colorless* — it
  must not tint the void. (Per-channel independent dither is technically slightly better at killing chroma
  banding but reads as colored sparkle on a dark panel; a single luma grain is the right call for a
  monochrome-dark world. If chroma banding survives in the crimson mids, switch to three independent `tpdf`
  evals — measure first.)
- **`gl_FragCoord.xy` not `uv`** — the dither is a *device-pixel* phenomenon; using normalized UV would
  scale the grain with DPR and resolution and break the 1-LSB-per-pixel contract.
- **`uFrame` animation** is what lets the eye temporally integrate the stipple to an even smoother result;
  the golden-ratio offset between the two IGN seeds keeps successive frames decorrelated. On the static tier
  `uFrame` is frozen → a fixed (still acceptable at ±1 LSB) pattern.

### 4.3 The r3f component shape

```jsx
// ForgeDither.jsx — pmndrs custom Effect, mounted LAST in the EffectComposer.
import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import { forwardRef, useMemo } from 'react'
import { wrapEffect } from '@react-three/postprocessing'

const frag = /* glsl */`
  uniform float uDitherAmp; uniform float uFrame;
  float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715)))); }
  float tpdf(vec2 f,float fr){ return ign(f+11.37+fr)-ign(f+71.13+fr*1.618); }
  void mainImage(const in vec4 ic, const in vec2 uv, out vec4 oc){
    vec3 c = ic.rgb;
    float n = tpdf(gl_FragCoord.xy, uFrame) * (uDitherAmp/255.0);
    float l = max(max(c.r,c.g),c.b);
    float rail = smoothstep(0.0,2.0/255.0,l) * smoothstep(0.0,2.0/255.0,1.0-l);
    oc = vec4(c + n*rail, ic.a);
  }`

class ForgeDitherEffect extends Effect {
  constructor({ amp = 1.0 } = {}) {
    super('ForgeDither', frag, {
      uniforms: new Map([['uDitherAmp', new Uniform(amp)], ['uFrame', new Uniform(0)]]),
    })
  }
  update(_renderer, _input, dt){ this.uniforms.get('uFrame').value += 1.0 } // animate per frame
}
const ForgeDither = wrapEffect(ForgeDitherEffect)
export default forwardRef(function (props, ref){ return <ForgeDither ref={ref} {...props} /> })
```

Mounted as the **terminal** effect in `Effects.jsx`, replacing the generic `<Noise>`:

```jsx
<EffectComposer disableNormalPass multisampling={high ? 2 : 0} frameBufferType={HalfFloatType}>
  {/* … HeatHaze → DOF → GodRays → Bloom → CA → LUT → HueSaturation → BrightnessContrast → Vignette … */}
  {tier !== 'static'
    ? <ForgeDither amp={sceneFor(forge.route).ditherAmp ?? 1.0} />   {/* hero TPDF grain */}
    : <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.035} /> /* static fallback */}
  {high && <SMAA />}
  {/* tone-map (AgX) terminal on the renderer */}
</EffectComposer>
```

> Ordering note vs doc 20: doc 20's chain has `Noise(grain) → SMAA`. SMAA is an edge-AA pass that should not
> blur the dither away, and in practice the grain survives it; if SMAA visibly softens the stipple on
> device, move `ForgeDither` to run **after** SMAA (SMAA → ForgeDither). Verify on the panel.

### 4.4 The WebGPU / TSL port (Phase-2 upgrade, authored now)

When the build ports to `WebGPURenderer` (doc 30), the hero dither becomes a TSL node — and three ships the
pieces. A TPDF node mirrors the GLSL; `bayer16` is the drop-in static-tier alternative:

```js
import { Fn, vec3, float, fract, dot, vec2, screenCoordinate, frameId } from 'three/tsl'
import { bayer16 } from 'three/addons/tsl/math/Bayer.js' // static-tier / cheap path

const ign = Fn(([p]) => fract(float(52.9829189).mul(fract(dot(p, vec2(0.06711056, 0.00583715))))))
const forgeDither = Fn(([color]) => {
  const f  = screenCoordinate.xy
  const fr = frameId.toFloat()
  const n  = ign(f.add(11.37).add(fr)).sub(ign(f.add(71.13).add(fr.mul(1.618))))  // TPDF (-1,1)
  const l  = color.r.max(color.g).max(color.b)
  const rail = l.smoothstep(0, 2/255).mul(l.oneMinus().smoothstep(0, 2/255))
  return color.add(n.mul(rail).div(255))
})
// outputNode = forgeDither(tonemappedColor)   // or: tonemappedColor.add(bayer16(uv).sub(0.5).div(255))
```

### 4.5 Hooking the shared master system

Dither is intentionally **content-independent** — it must be present at every temperature, so it does *not*
read `uTemp` for its core behavior (a temperature-coupled dither would vanish when the forge cools, exactly
when the dark void is largest and bands worst). It binds the shared system in only two light ways:

1. **`ditherAmp` is a `scenes.js` per-route field**, dt-damped on navigation like `veinGlow`/`irid`/
   `lutWarm`. Close, oblique, near-black chambers (scrying-pool `/voice`, altar `/about`) where the dark
   gradient fills the frame get **`ditherAmp ≈ 1.0`**; bright, busy chambers (jewel `/web`, forge-mouth
   `/contact`) can sit at **`≈ 0.7`** because bloom/CA/specular already break up the gradient. This is the
   one cohesion coupling, and it damps on the same heartbeat as the rest of the preset table.
2. **`uFrame` shares the one clock / one rAF.** It is incremented in the effect's `update(dt)` (driven by the
   composer's render loop, not a private rAF) so the grain animates on the same frame cadence as `uTime`,
   and freezes when `uTime` freezes on the static tier. No `setInterval`, no second loop — obeys cohesion
   rule §7.6.

Everything else (palette, lighting, noise basis) the dither is deliberately decoupled from — it is the
*finishing* layer that sits above the world, not a world element. Its cohesion contract is "**one dither,
applied once, in display space, after the grade**," not "samples `gw_fbm`."

---

## 5. COHESION — shared palette / lighting / uniforms

- **It protects the palette, never invents color.** The dither is a single colorless luma grain; it must
  not tint the void warm or cool (a per-channel grain with a warm bias would violate brand law — no
  cool/green/blue, and equally no spurious warm cast from noise). It exists to let the *authored*
  void→crimson→ember ramp render *smoothly*, i.e. to make `gw_tempColor`'s gradient legible at 8-bit. It is
  the palette's delivery mechanism, not a palette element.
- **One dither for the whole world, one place.** Like the single tone-map operator and single bloom
  contract, there is **exactly one** dither, applied **once**, as the terminal post step, across every
  route-swapped chamber. No chamber gets its own grain; per-route variation is only the `ditherAmp` scalar.
  This is the dither analogue of "one operator, every chamber" (doc 21 §5).
- **It is the reason the >1 / ≤1 palette convention reads clean.** The 60% void and 30% deep-crimson mass
  sit ≤1 and map to the bottom of the output range — exactly the band-prone region. The dither is what makes
  that 90% of the frame render as a smooth dark field instead of contoured steps, so the 10% accent that
  *does* exceed 1 and bloom detonates against a *clean* black, not a banded one. Dither and the HDR palette
  convention are two halves of "true black, vivid accent."
- **Shared clock, shared preset table, shared composer** — the only three things it touches (§4.5). It does
  **not** add a pass (merges into `EffectPass`), does **not** add a texture (procedural), does **not** add a
  uniform pool entry beyond the per-route `ditherAmp` damped value.
- **Wordmark/3D parity guard:** the DOM `.forge-letter` CSS gradient bands too, in the browser's own 8-bit
  compositor — but that is out of our shader's reach. The cohesion note: author the 3D forge-red and the CSS
  ramp to *match on the OLED with dither on*, so the dithered 3D gradient and the (browser-dithered or not)
  CSS gradient read as one material side-by-side.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Cost: effectively free, and it is the cheapest kind of cost.** TPDF grain is ~4–6 ALU ops + a couple of
  `fract`/`dot` (two IGN evals + a subtract + a smoothstep), **folded into the existing merged
  `EffectPass`** — no new pass, no new draw, no texture binding, no sampler. In the fill-rate-bound budget
  (doc 29), per-pixel ALU this light is in the noise of the post chain's ~2.5–3 ms; it adds well under
  ~0.1 ms even full-screen at DPR 1.5. It is the rare element with no perf objection.
- **Blue-noise's marginal cost is the one we *avoid*** for the hero: one dependent texture fetch + sampler +
  VRAM per pixel, on a device where texture bandwidth is precious. We spend that exactly once, on the
  raymarch (doc 30), where it converts to step-count savings; the hero grain pays nothing.
- **DPR interaction:** because the grain is keyed to `gl_FragCoord` (device pixels), it is automatically
  correct at the capped DPR 1.5 — one LSB per *rendered* pixel, which is what quantization operates on. It
  does **not** need rescaling when `AdaptiveDpr` drops the pixel ratio under thermal load.
- **Tiers (degrade uniformly, never selectively — cohesion §7.9):**
  - **`high` / `low`** — identical hero `ForgeDither` TPDF at `amp ≈ 0.7–1.0` (per route), animated. The
    dither is **the one post element that does NOT drop on the low tier** — doc 20/21's standing rule
    ("never below ~0.03 even on low") is enforced here as "amp never below ~0.6 LSB," because dropping it
    reintroduces the banding on the exact dark gradients the low tier still shows.
  - **`static`** — `uFrame` frozen; the TPDF still resolves to a fixed (acceptable) pattern, **or** swap to
    the `bayer16` TSL node / a static `Noise(OVERLAY, 0.035)` for a deterministic single-pass dither with
    zero animation cost. The void must still be smooth on the frozen poster — a banded still is the worst
    possible "broken fallback."
- **The amplitude-rolloff is a perf-neutral quality save**, not a cost: two extra `smoothstep`s protect the
  true-black that *is* the OLED's headline feature. Skipping it to save two ops would forfeit the thesis.
- **This is a QUALITY budget item, not a perf one.** Reiterating the parent docs: OLED banding is the
  **single mobile *quality* risk in the dark gradients**, and it costs ~nothing to fix — so it is pure
  upside. The only way to "lose" here is to under-dither (banding returns) or over-dither (visible grain /
  lifted black). Both are tuning, not budget.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each unblocks the next):**

1. **Reproduce the banding first.** Turn the dither OFF, render the void→crimson ramp full-screen on the
   iPhone-15 in a dark room. Confirm you can see the contour steps — if you can't reproduce it, you can't
   tune the fix. (It will be invisible on the laptop sRGB LCD — this only manifests on the OLED.)
2. **Add TPDF at exactly ±1 LSB (`1.0/255.0`), display-space, terminal.** Confirm the bands dissolve. Do
   this *before* the rolloff and animation, with `uFrame` static, so you're judging the core dither.
3. **Add the near-black/near-white rolloff.** Verify the void returns to **pixels-off true black** (hold a
   pure-black reference next to it on the panel). This is the OLED-specific step the laptop will lie about.
4. **Animate (`uFrame`).** Confirm the stipple now reads as moving film grain, not fixed lens dirt, and that
   it doesn't *crawl* or scroll (golden-ratio frame offset, not a UV scroll).
5. **Tune `ditherAmp` per route.** Lower it (toward 0.6–0.7) on bright/busy chambers until the grain is
   sub-perceptual but the gradient is still smooth; hold ~1.0 on dark close chambers. **Never zero.**
6. **Confirm space and order on device.** Toggle a debug switch that dithers in *linear* space — verify it
   looks worse (over-grained void, banded mids) to prove the display-space choice empirically.

**Specific pitfalls:**
- **Dithering in linear space.** The #1 conceptual error. A fixed linear amplitude is huge in shadows and
  invisible in highlights — over-grains the void, under-dithers the mids. Dither in **display space, ±1
  display LSB**, last.
- **Using a uniform (RPDF) hash instead of TPDF.** A single `hash(uv)` leaves signal-dependent noise that
  *pumps* as the gradient animates with `uTemp`. Always build the triangular distribution from **two**
  independent sources.
- **Forgetting the near-black rolloff → lifted void.** Symmetric ±1 LSB noise pushes pure black ~0.2 LSB up;
  on the OLED that's a visible grey haze over the void. Roll the amplitude to zero at the rails.
- **Keying the grain to `uv` instead of `gl_FragCoord`.** Scales the grain with resolution/DPR and breaks
  the 1-LSB-per-pixel contract; grain looks coarse at low DPR, fine at high.
- **Mip-filtered / linearly-sampled blue-noise (if you use the texture path anywhere).** Destroys the blue
  spectrum → bands again. `NearestFilter`, `RepeatWrapping`, no mips, ever.
- **A static, un-animated Bayer/blue grain on a still camera.** Reads as fixed dirt on the lens. Animate, or
  accept it only on the deliberately-frozen static tier.
- **Over-driving amplitude to "be safe."** >1.5 LSB grain becomes visible noise and (without rolloff) lifts
  black. The correct amplitude is the *minimum* that hides the bands — tune down, not up.
- **Double-dithering.** If a future LUT or the browser compositor also dithers, two stacked grains read as
  noisy. One dither, ours, terminal.
- **Bayer weave on the hero tier.** Tempting because three ships `bayer16`, but its grid fights the
  cinematic bar on large dark gradients. Bayer = static tier / raymarch only.
- **Judging on the laptop.** Banding, lifted black, and grain visibility **do not simulate** off the OLED.
  `qa-route` proves it compiled; the dither is a *device read*.

---

## 8. SOURCES (2025–2026)

1. **Codrops — "Interactive WebGL Backgrounds: A Quick Guide to Bayer Dithering"** (2025-07-30). Single-pass
   GPU Bayer dither, the 2×2/NxN matrix GLSL, the <0.2 ms-at-4K / ~3 KB cost figure, and using ordered
   dither to remove banding in dark gradient backgrounds.
   https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/
2. **Codrops — "Building a Real-Time Dithering Shader"** (2025-06-04). End-to-end WebGL dither shader; noise
   choice, thresholds, and the banding-to-stipple principle.
   https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/
3. **Codrops — "Efecto: Building Real-Time ASCII and Dithering Effects with WebGL Shaders"** (2026-01-04).
   2026 dithering-in-WebGL reference; ordered vs noise dither, real-time GPU implementation.
   https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/
4. **Maxime Heckel — "The Art of Dithering and Retro Shading for the Web"** (2025). Blue-noise vs Bayer vs
   white-noise perceptual comparison, GLSL ordered-dither + blue-noise-texture implementation, animated
   noise, and the spatial-spectrum argument for blue-noise on smooth gradients.
   https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/
5. **frost.kiwi — "How to (and how not to) fix color banding"** (2025). Why 8-bit dark gradients band, the
   correct ~1/255 noise amplitude, triangular-PDF vs uniform dither, and the linear-vs-display-space
   recommendation — the core correctness reference for this doc.
   https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/
6. **three.js docs — `module-Bayer` (`bayer16`)** (current, 2025–2026). The built-in TSL Bayer node
   imported from `three/addons/tsl/math/Bayer.js`; documented as a banding-killer for
   `VolumeNodeMaterial.offsetNode` ray-march offsets and "an alternative to blue-noise."
   https://threejs.org/docs/pages/module-Bayer.html
7. **Phaser 4 Dev Log — "Gradients, Color Ramps and GPU Dithering"** (2026-03). 2026 production use of GPU
   dithering on color ramps to defeat banding, with IGN + standard-derivatives gradient-aware dithering.
   https://phaser.io/news/2026/03/phaser-4-gradients-color-ramps-dithering
8. **Meta Horizon OS Developers — "Tech Note: Shader Snippets for Efficient 2D Dithering"** (2025).
   Mobile/XR-targeted GPU dither snippets, IGN and triangular remap, amplitude and perf guidance for
   bandwidth-constrained devices. https://developers.meta.com/horizon/blog/tech-note-shader-snippets-for-efficient-2d-dithering/
9. **Shadertoy — "Dithering: linear vs gamma"** (view 7l3fDn, maintained 2025). Direct A/B of dithering in
   linear vs gamma/display space, demonstrating display-space is correct for banding removal.
   https://www.shadertoy.com/view/7l3fDn
10. **GM Shaders Mini — "Dither" (Xor)** (2025). Compact modern GLSL dither reference: Bayer, IGN, and
    blue-noise patterns with the cheap-procedural emphasis. https://mini.gmshaders.com/p/gm-shaders-mini-dither
11. **Three.js Roadmap — "10 Noise Functions for Three.js TSL Shaders"** (2025–2026). TSL noise/IGN building
    blocks for the WebGPU dither port. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
12. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** (2026). Current post
    chain ordering, tone-map terminal placement, and grain/dither position in the merged pass.
    https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
13. **TFTCentral — "Exploring the 'Grey Banding' Issue Affecting Tandem WOLED Panels"** (2025). Why OLED
    near-black gradation exposes banding (deep black + low-luminance DAC steps) — the panel-physics grounding
    for "OLED is the most banding-revealing judge." https://tftcentral.co.uk/articles/exploring-the-grey-banding-issue-affecting-tandem-woled-panels
14. **Bart Wronski — "Dithering part three: real-world 2D quantization dithering"** (canonical TPDF/animated-
    -noise reference, cited and restated across the 2025–2026 web write-ups above for the triangular-remap
    near-black lift and the animated-noise temporal-average technique).
    https://bartwronski.com/2016/10/30/dithering-part-three-real-world-2d-quantization-dithering/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Chroma-banding in the crimson mass — luma grain vs per-channel TPDF.** Measure whether a single
   colorless luma dither fully kills banding in the saturated `#C1292E` mid-region, or whether the red
   channel bands independently and needs three decorrelated TPDF evals (and at what perceptible-color-noise
   cost on the OLED).
2. **HDR display output and the dither (P3 / 10-bit canvas).** doc 21 candidate #4 — if GAELWORX emits a
   true HDR / extended-range signal to the iPhone-15's 10-bit-capable HDR pipeline, the quantization step
   shrinks 4× and the dither amplitude/space change. Quantify how much banding the 10-bit path removes for
   free and whether dither is still needed (it is, at the panel's effective bit depth).
3. **Animated-blue-noise texture vs IGN-TPDF — a measured A/B on device.** Settle empirically whether the
   blue-noise spatial spectrum buys *any* perceptible cleanliness over animated IGN-TPDF at ±1 LSB on the
   iPhone-15, to confirm the "procedural, no-texture" pick — including the cost of the one fetch under
   thermal throttle.
4. **Gradient-aware (derivative-scaled) dither.** Phaser-4's 2026 trick: scale dither amplitude by
   `fwidth(luma)` so flat gradients get full dither and high-detail regions get none — potentially removing
   the last trace of visible grain in the busy chambers while holding full banding-kill in the void.
