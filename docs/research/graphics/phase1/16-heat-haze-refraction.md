# 16 — Heat Shimmer / Heat-Haze Refraction

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer (r3f / three.js), warm-forge palette._

---

## 1. SCOPE

Heat shimmer is the **air made visible**. In the GAELWORX world, molten metal pours from the stone altar, fills the GAELWORX letterforms, and cools through a temperature gradient — and that heat is not silent. The column of superheated air rising off the white-hot pour front, off the freshly-filled letters, and off the divine-fire **A** and **E** must **bend the framebuffer behind it**: the carved basalt, the Ogham, the channel walls, the cooler letter bodies all _wobble and swim_ as you look through the rising heat. This is a screen-space refraction effect — a localized, noise-animated warp of the rendered image, **driven by a heat mask** so distortion lives _only_ where the metal is genuinely hot (white-hot > orange) and fades to zero on iron-black metal and cold basalt. It must read as **convection, not water** — vertical bias, fine high-frequency ripple riding a slow low-frequency drift, subtle enough never to induce seasickness, strong enough that the iPhone-15 OLED viewer instantly reads "that air is _on fire_." It is one of the cheapest, highest-impact "this is a real furnace" cues in the entire scene, and it is the connective tissue that makes the molten, the cooling letters, the divine-fire A/E, and the sparks feel like they share one physical atmosphere.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four families of approach. All are alive and shipping in 2025–2026; they differ in where the distortion is computed and how it is masked.

### A. Full-screen post-pass UV warp (`mainUv`) — "the Bebber pattern, modernized"
A single fullscreen pass perturbs the screen UV before sampling the input buffer: `uv += distortion(uv, time, mask)`. The canonical, still-cited reference is Lucas Bebber's Codrops heat-distortion tutorial (the foundational `texture2D(buf, uv + sin(...))` move); 2025 work (the GSAP-driven Codrops shader-animation piece) revives exactly this UV-offset technique with modern animated uniforms and noise. In pmndrs `postprocessing` this is a custom `Effect` implementing `void mainUv(inout vec2 uv)` — the cleanest, cheapest hook, **no extra buffers**, runs as one node in the existing `EffectPass`.
- **Quality:** Good. Refraction is "fake" (a 2D offset, not true depth-aware bending) but for hot-air convection that is _physically correct enough_ — real heat haze is a thin-lens screen-space distortion to the eye.
- **Perf:** Excellent. One extra texture fetch + a couple of noise evals per pixel. No FBO, no second render of the scene.
- **Mobile:** Excellent — this is the only family that comfortably fits the iPhone-15 budget at full-screen.
- **Complexity:** Low. The hard part is the **mask**, not the warp.
- **Caveat:** `mainUv` effects are **incompatible with convolution effects** in the same `EffectPass` and cannot read neighbor samples — so it must run as its own pass or be ordered carefully relative to Bloom (which is convolution).

### B. Heat-mask-driven post-pass (`mainImage` with a mask texture) — "localized warp"
Same idea as A, but the distortion amount is multiplied by a **heat mask** sampled from a texture (or reconstructed from emissive luminance / a depth-tagged region). This is the GAELWORX-correct variant: distortion is _zero_ except above hot metal. The mask can come from (i) a dedicated low-res render of just the hot emissive, (ii) thresholding the luminance of the input buffer itself (cheap, no extra pass — hot metal is the only thing emitting > 1), or (iii) an analytic mask projected from the pour-front position. The pmndrs custom-effect wiki documents exactly the uniforms available (`inputBuffer`, `time`, `resolution`, `texelSize`) and the `mainImage(inputColor, uv, outputColor)` signature for this.
- **Quality:** Very good — looks intentional and localized, not a global wobble.
- **Perf:** Excellent if the mask is luminance-derived (no extra pass); one cheap pass if a dedicated mask render is used at quarter-res.
- **Mobile:** Excellent.
- **Complexity:** Low–medium (the mask source is the design decision).

### C. Refractive geometry / `MeshTransmissionMaterial` "heat panel"
Place an invisible-ish transmissive plane (or a few quads) in front of the hot regions and let drei's `MeshTransmissionMaterial` (`distortion`, `distortionScale`, `temporalDistortion`) bend what's behind it. The 2025 Codrops glass-torus article documents these exact properties as the way to "simulate heat distortion." Drei layers shaders over `MeshPhysicalMaterial` and re-renders the scene into a buffer per transmissive surface.
- **Quality:** High, physically grounded, true depth-aware.
- **Perf:** **Poor on mobile.** Each transmission surface triggers extra scene render passes (the `samples`/`resolution` cost); the three.js forum has repeated 2025 "MeshTransmissionMaterial poor performance" threads, including on Apple silicon. Already only enabled on `high` tier for the slab here.
- **Mobile:** Bad fit for a _full_ heat field. Viable only as a tiny, single, low-`samples` panel over one hero region.
- **Complexity:** Medium, but the perf ceiling kills it as the primary technique.

### D. TSL / WebGPU screen-space refraction node (`viewportSharedTexture` / screen-UV)
The 2025–2026 forward path: in Three Shading Language you sample the framebuffer via a viewport texture node and offset the screen UV by a noise field — Maxime Heckel's Oct-2025 "Field Guide to TSL and WebGPU" documents the special **screen-UV function with depth comparison** that mitigates the classic refraction artifact (sampling pixels in front of the surface). Same math as A/B, but node-based and WebGPU-native, with WebGL fallback.
- **Quality:** Excellent, with the depth-aware screen-UV solving the "bleed" artifact for free.
- **Perf:** Great on WebGPU; the WebGL fallback equals family A.
- **Mobile:** WebGPU on iOS is still maturing (Safari support landed but is uneven); r182 WebGPU perf-regression threads exist. **Not** where this codebase lives today (it's WebGL `MeshPhysicalMaterial` + pmndrs `postprocessing`).
- **Complexity:** High for this repo — would mean a renderer/material-system migration. Right answer for a future Phase-2/3, wrong answer for shipping now.

**Verdict on the landscape:** families A+B are the same cheap screen-space warp; the only real question is the **mask**. C is a per-region luxury, D is the future. The build is A+B.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship a single custom pmndrs `postprocessing` Effect — `HeatHazeEffect` — that warps the screen UV (`mainUv`-style offset computed inside `mainImage`) driven by a heat mask derived from the framebuffer's own HDR luminance, animated by the shared `gw_fbm` noise, with a vertical convection bias.**

Justification, point by point against the world + constraints:

- **It's the only family that fits the iPhone-15 budget as a scene-wide effect.** One extra pass, a handful of texture fetches and noise evals. No re-render, no transmission buffers. Transmission is already `high`-only on the slab for exactly this reason (`ObsidianSlab.jsx:69`).
- **The mask comes free from the palette discipline.** `palette.js` already reserves HDR (`>1`) values (`PAL.hot = (1.9,1.25,0.7)`, `PAL.emberHot`, the vein cores) for the hottest 10%. That is _already a heat mask_: threshold the input-buffer luminance at ~1.0 and you have a per-pixel "is this white-hot" signal with **zero extra render cost** — the same threshold Bloom uses (`luminanceThreshold={0.55}` in `Effects.jsx`). The shimmer and the bloom will therefore agree on what is hot, which is exactly the cohesion we want.
- **It reuses the in-repo noise.** `gw_fbm` / `gw_snoise` in `shaders.js` are the same field driving the obsidian veins and embers. Driving the haze with the same noise basis ties the wobble to the world's "grain."
- **It hooks the master temperature system.** A single `uHeat` uniform damped off `forge.scrollDamped` + scroll velocity + strike surge (the exact signals `ObsidianSlab` already reads) scales distortion globally, so the air shimmers _harder when the forge runs hotter_.
- **It respects the existing composer order and the "only HDR blooms" rule** without fighting it — the haze pass slots in **before** Bloom so warped emissive still blooms correctly, and the luminance mask piggybacks on the same HDR convention.

It is buildable in this codebase in one new file plus ~6 lines in `Effects.jsx`, with no renderer change.

---

## 4. IMPLEMENTATION

### Libraries / versions
- `postprocessing` and `@react-three/postprocessing` — already in the project (`Effects.jsx`). No new dependency.
- `three` — existing version. No upgrade needed (this is WebGL `postprocessing`, not TSL).
- Reuse `GLSL_NOISE` from `src/scene/shaders.js` and `PAL`/`v3` from `src/scene/palette.js`.

### The Effect class
pmndrs effects extend `Effect` and provide `mainImage`. We compute the heat mask from `inputColor` luminance (no extra buffer), build a vertically-biased fbm distortion vector, and **re-sample the input buffer at the warped UV**. Because we need a second fetch of `inputBuffer`, we declare the **`CONVOLUTION`** attribute (we read a non-local sample) and run this effect in **its own `EffectPass`**, ordered before Bloom.

```js
// src/scene/HeatHaze.js
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2 } from 'three'
import { GLSL_NOISE } from './shaders.js'

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;        // master temperature 0..1 (scroll/strike driven)
  uniform float uStrength;    // max UV offset in screen units (~0.004–0.010)
  uniform float uScale;       // noise frequency
  uniform float uThreshold;   // luminance above which air is "hot" (~0.9)
  ${GLSL_NOISE}

  // luminance -> hot mask. Hot metal is the only thing emitting HDR (>1),
  // same convention Bloom uses, so shimmer & bloom agree on "what is hot".
  float gwHotMask(vec3 c){
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    return smoothstep(uThreshold, uThreshold + 0.6, l);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    // Sample the mask a touch BELOW the fragment: heat rises, so distortion
    // above a hot pixel is driven by the hot pixel beneath it.
    float belowMask = gwHotMask(texture2D(inputBuffer, uv - vec2(0.0, 0.06)).rgb);
    float hereMask  = gwHotMask(inputColor.rgb);
    float mask = max(belowMask, hereMask * 0.5);

    // Convection field: fast vertical-biased ripple over a slow drift.
    vec2 p = uv * uScale;
    float n1 = gw_fbm(p + vec2(0.0, uTime * 0.9));          // rising
    float n2 = gw_fbm(p * 2.1 + vec2(uTime * 0.15, uTime * 0.6));
    vec2 offset = vec2(
      (n1 - 0.5) * 0.6 + (n2 - 0.5) * 0.4,                  // small horizontal sway
      (n2 - 0.5) * 1.0                                       // dominant vertical
    );

    float amp = uStrength * mask * (0.35 + 0.65 * uHeat);
    vec2 warped = uv + offset * amp;

    // tiny per-channel split = the air's own micro chromatic shimmer (cheap,
    // mirrors the refraction-edge aberration already used on 'high').
    float ca = amp * 0.18;
    vec3 col;
    col.r = texture2D(inputBuffer, warped + vec2(ca, 0.0)).r;
    col.g = texture2D(inputBuffer, warped).g;
    col.b = texture2D(inputBuffer, warped - vec2(ca, 0.0)).b;

    outputColor = vec4(col, inputColor.a);
  }
`

export class HeatHazeEffect extends Effect {
  constructor({ strength = 0.006, scale = 3.0, threshold = 0.9 } = {}) {
    super('HeatHazeEffect', frag, {
      attributes: EffectAttribute.CONVOLUTION, // reads non-local inputBuffer samples
      uniforms: new Map([
        ['uTime', new Uniform(0)],
        ['uHeat', new Uniform(0)],
        ['uStrength', new Uniform(strength)],
        ['uScale', new Uniform(scale)],
        ['uThreshold', new Uniform(threshold)],
      ]),
    })
  }
  update(_renderer, _input, dt) {
    if (this._frozen) return
    this.uniforms.get('uTime').value += dt
  }
}
```

### The r3f wrapper component
Wrap with `wrapEffect` from `@react-three/postprocessing` so it's declarative, and drive `uHeat`/`uTime` from the shared store in a tiny `useFrame`. It must live in **its own `<EffectPass>`** (react-postprocessing puts each `wrapEffect` primitive in the chain; keep it ABOVE Bloom).

```jsx
// inside or beside Effects.jsx
import { forwardRef, useMemo, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { wrapEffect } from '@react-three/postprocessing'
import { HeatHazeEffect } from './HeatHaze.js'
import { forge, damp } from '../store.js'

const HeatHazeImpl = wrapEffect(HeatHazeEffect)

export function HeatHaze({ quality }) {
  const ref = useRef()
  useFrame((state, dt) => {
    const e = ref.current
    if (!e) return
    if (quality === 'static') { e.uniforms.get('uTime').value = 2; e._frozen = true; return }
    e._frozen = false
    const vel = Math.min(forge.scrollVel * 1.4, 1)
    const since = performance.now() / 1000 - forge.strikeAt
    const surge = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) * 0.6 : 0
    const target = Math.min(forge.scrollDamped * 0.6 + vel * 0.4 + surge, 1)
    const u = e.uniforms.get('uHeat')
    u.value = damp(u.value, forge.ready ? target : 0, 3, dt)
  })
  return <HeatHazeImpl ref={ref} strength={quality === 'high' ? 0.007 : 0.0045} scale={quality === 'high' ? 3.2 : 2.4} />
}
```

### Wiring into the composer (order matters)
In `Effects.jsx`, insert the haze **first** in the chain so the warped image is what blooms / grades:

```jsx
<EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
  <HeatHaze quality={quality} />               {/* warp BEFORE bloom */}
  <Bloom mipmapBlur luminanceThreshold={0.55} ... />
  {high ? <ChromaticAberration ... /> : <></>}
  ...
</EffectComposer>
```

Note: because `HeatHaze` declares `CONVOLUTION`, react-postprocessing will place it in its own `EffectPass` automatically (a convolution effect can't share a pass with another convolution effect like Bloom). This is correct and intended.

### Key uniforms & parameters (leva-tunable via `?debug`)
| Uniform | Default (high / low) | Meaning |
|---|---|---|
| `uStrength` | 0.007 / 0.0045 | max screen-UV offset. **The seasickness dial.** Keep ≤ ~0.010. |
| `uScale` | 3.2 / 2.4 | noise frequency — higher = finer, more "shimmer," less "wobble." |
| `uThreshold` | 0.9 | luminance gate; tie to Bloom's 0.55 conceptually but set higher so only the _hottest_ air shimmers. |
| `uHeat` | damped, runtime | master temperature; from `forge.scrollDamped` + `scrollVel` + strike surge. |
| `uTime` | accumulated dt | frozen to a constant on `static`. |

---

## 5. COHESION

The haze must feel _emitted by_ the world, not pasted over it.

- **Shared temperature system.** `uHeat` reads the **exact same signals** the obsidian slab uses (`ObsidianSlab.jsx:149-168`): `forge.scrollDamped`, `forge.scrollVel`, and the `forge.strikeAt` surge with the same `Math.exp(-since*3.0)` decay. When the user scrolls and the veins flare hotter (`uTemp`, `uVeinGlow`), the air shimmers harder in lockstep — one temperature, two manifestations. No new state, no competing rAF (honors the one-rAF/shared-store law in `motion-feel`).
- **Shared mask convention = palette discipline.** The luminance gate keys off HDR (`>1`) values, which `palette.js` _already_ reserves for the hottest 10% (`PAL.hot`, `PAL.emberHot`, vein cores). So distortion appears precisely where the molten/letter cores are white-hot, and **vanishes on iron-black cooled letters and cold basalt** — automatically, because those simply aren't bright. The cooling temperature gradient (white→orange→red→iron-black) therefore _drives the haze falloff for free_: hot end of a letter shimmers, cold end is glassy-still. That is the single most important cohesion win.
- **A+E divine fire reads correctly.** The white-gold A and E never cool — they stay the brightest emitters in the frame, so they will always sit under a column of shimmering air, reinforcing their "unearthly, eternally hot" status and the radiance that lights the Ogham. The haze _ratifies_ the A/E rule rather than competing with it. (The shimmer must never warp the A/E so much that the letterform reads broken — bounded `uStrength` protects this.)
- **Shared noise basis.** `gw_fbm` is the same field used by the veins (`ObsidianSlab` HEAD) and the warm caustic; the air's wobble is literally the same noise grain as the metal's flow, so they feel like one substance.
- **Shared chromatic-edge language.** The micro per-channel split inside the haze mirrors the `ChromaticAberration` already used on `high` (`Effects.jsx:24`) — the air refracts color the way the obsidian's edges do.
- **Sparks & embers.** `Embers.jsx` rises with `uColor (1.0,0.45,0.12)` warm additive points; the haze sits behind/around them. Since embers are additive and bright, they may lightly trip the mask too — desirable: the air around a rising spark trail wobbles, exactly like a real forge.
- **Palette/brutalism untouched.** Pure screen-space; no DOM geometry, no rounding, no cool casts — fully inside the warm-forge + 0px-brutalism constraints.

---

## 6. MOBILE & PERFORMANCE

The iPhone-15 OLED is the judge. Budget discipline:

- **One extra fullscreen pass, ~4 texture fetches + 3 fbm(3-octave) evals per pixel.** That is cheap — comparable to the Bloom prefilter. No re-render of the scene, no transmission buffer (unlike family C, which the forum repeatedly flags as a mobile killer in 2025).
- **Tiering (mirror the existing model in `ForgeCanvas`/`Effects`):**
  - `high`: full `uStrength` 0.007, `uScale` 3.2, the per-channel CA split on.
  - `low`: `uStrength` 0.0045, `uScale` 2.4, **drop the chromatic split** (single fetch, sample all channels at once) — change the frag to a `uHighTier` define so low compiles a 1-fetch path.
  - `static` (`prefers-reduced-motion`): **the whole `<Effects>` tree is already not mounted** (`ForgeCanvas.jsx:47` gates it). So the haze inherits the correct reduced-motion behavior automatically — no shimmer, frozen `uTime`, zero cost. This satisfies the mandatory reduced-motion law without any extra branch.
- **Resolution.** The pass runs at composer resolution. If profiling on-device shows headroom pressure, run the haze at **half-res** via a downsampled `inputBuffer` read (the warp is low-frequency enough to tolerate it) — but only if needed; start full-res.
- **fbm cost.** Reuse the 3-octave `gw_fbm` as-is (matches `shader-fx`'s "keep loops small"); do **not** add octaves. Two fbm calls is the ceiling.
- **No depth pass.** `disableNormalPass` stays; the luminance mask needs no depth, so we avoid the `DEPTH` attribute and its buffer entirely.
- **Verify** the SwiftShader/`qa-route` way: 0 console errors @ 393×852 + 1440×900 proves the GLSL compiled; then read the real shimmer on the iPhone 15 (subtle warp + OLED true-black don't simulate headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Pitfalls, and the order of operations that avoids them:

1. **Order in the composer, first.** Put `HeatHaze` **before** `Bloom`. If it goes after Bloom, you warp already-bloomed pixels and the glow smears with the air (wrong, and reads as a bug). Lock the order before tuning anything.
2. **Convolution attribute is mandatory.** Because we re-fetch `inputBuffer` at a warped UV, the effect MUST declare `EffectAttribute.CONVOLUTION`, and it **cannot share an `EffectPass` with Bloom** (also convolution) or with any `mainUv` effect. react-postprocessing handles the split if the attribute is set; forget it and you get subtle wrong sampling or a runtime warning. (pmndrs custom-effects wiki.)
3. **Mask first, warp second.** Build and _visualize the mask_ (`outputColor = vec4(vec3(mask),1.0)`) before touching distortion. If the mask is wrong, no amount of warp tuning helps. Confirm it lights up only on white-hot regions and is black on cooled letters/basalt.
4. **The seasickness gate.** Start `uStrength` LOW (0.004) and raise. Heat haze that's too strong is instantly nauseating and off-brand (Brutalist Snap = "no bounce, only impact" — the air drifts, it does not slosh). Vertical bias + high-frequency-over-low-frequency is what makes it read as _convection_ not _water_. If it looks like underwater, lower `uScale`'s low-frequency term and raise the high.
5. **Heat rises — sample below.** Drive a fragment's distortion from the mask **beneath** it (`uv - vec2(0, ~0.06)`), not at it. Otherwise the shimmer sits _on_ the metal instead of _rising off_ it, and the silhouette of the hot region wobbles (wrong) instead of the air above it (right).
6. **Don't break the A/E letterforms.** Bounded `uStrength` + the per-fragment mask means the divine-fire A/E shimmer their _surrounding air_ without dissolving the glyph. Eyeball this specifically on the Cinzel A and E.
7. **dt-correct everything.** `uTime += dt` and `uHeat` via `damp(...,dt)` — never a frame-rate-dependent step (forge-scene / motion-feel non-negotiable). Freeze `uTime` to a constant on `static`.
8. **Tonemapping note.** The effect samples the input buffer (already in the composer's working space). Keep the per-channel split tiny (`amp*0.18`) so it reads as shimmer, not a rainbow fringe, after ACES grade downstream.
9. **Edge bleed.** A warp near screen edges can sample outside the buffer → a smear. Clamp/saturate `warped` or keep `uStrength` small enough that edge offset is sub-pixel-ish; in practice 0.007 is safe.

**Order of operations:** (1) lock composer order → (2) build + visualize mask → (3) add static warp at low strength → (4) animate with fbm + vertical bias → (5) wire `uHeat` to the shared store + strike surge → (6) add `high`-only chromatic split + tiering → (7) `qa-route` 0-errors → (8) iPhone-15 device read + leva tune.

---

## 8. SOURCES (2025–2026)

- Maxime Heckel — **Field Guide to TSL and WebGPU** (Oct 2025): documents the screen-UV / viewport-texture node with depth comparison for refraction, and custom post-processing in TSL. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Codrops / Matt Park — **Playing with Light and Refraction in Three.js: Warping 3D Text Inside a Glass Torus** (2025-03-13): `MeshTransmissionMaterial` `distortion`/`distortionScale`/`temporalDistortion` for heat-distortion-style refraction, plus the resolution/samples perf tradeoffs. https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Codrops — **How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects** (2025-10-08): modern animated-uniform UV-offset / noise-driven distortion patterns. https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
- Codrops — **Interactive Text Destruction with Three.js, WebGPU, and TSL** (2025-07-22): current WebGPU/TSL screen-space effect practice and node patterns. https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
- pmndrs — **postprocessing: Custom Effects wiki** (referenced/maintained 2025): `mainImage`/`mainUv` signatures, `CONVOLUTION`/`DEPTH` attributes, available uniforms (`inputBuffer`, `time`, `resolution`, `texelSize`) — the exact API this build extends. https://github.com/pmndrs/postprocessing/wiki/Custom-Effects
- three.js — **TSL documentation** (current, r17x/r18x 2025): screen-UV-with-depth function for viewport-texture refraction. https://threejs.org/docs/pages/TSL.html
- three.js forum — **MeshTransmissionMaterial poor performance** (active 2025, incl. Apple silicon): evidence that transmission-based refraction is the wrong primary path on mobile. https://discourse.threejs.org/t/meshtransmissionmaterial-poor-performances-urgent/68566
- three.js — **r180 release** (2025, SourceForge mirror) / Releases: confirms current renderer/WebGPU module state for fallback decisions. https://sourceforge.net/projects/three-js.mirror/files/r180/ · https://github.com/mrdoob/three.js/releases

_(Foundational pre-2025 technique — Bebber's 2016 Codrops heat-distortion UV-offset — is cited only as the lineage; the implementation guidance above tracks the 2025 sources.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Heat-mask provenance: luminance-threshold vs. dedicated emissive render vs. analytic pour-front projection.** Which mask source gives the cleanest localization with the least cost, and how to make it agree perfectly with Bloom's threshold and the cooling temperature gradient across letterforms.
2. **Convection field design — making it read as forge air, not water.** Vertical-bias noise composition, frequency stacking (fine shimmer over slow drift), per-region turbulence near the pour front vs. calm above cooled letters, and the precise `uStrength`/`uScale` envelope that stays sub-seasickness on the OLED.
3. **WebGPU/TSL migration path for the haze.** Porting the warp to a `viewportSharedTexture` + depth-aware screen-UV node (Heckel field-guide pattern) with a clean WebGL fallback — what a renderer migration would cost the whole `Effects` chain, and whether iOS Safari WebGPU is ready.
4. **Coupling shimmer to sparks & embers + the divine-fire A/E radiance.** Whether ember/spark trails should locally boost the mask (air wobble around a rising spark) and how the eternal A/E heat column should differ from cooling-letter haze to sell "divine fire."
