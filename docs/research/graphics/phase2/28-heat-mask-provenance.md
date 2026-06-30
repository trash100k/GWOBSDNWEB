# 28 — Heat-Mask Provenance: Luminance vs. Dedicated Emissive vs. Analytic

_Phase-2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js + pmndrs `postprocessing`)_

> **What this doc owns.** Phase-1 doc `16-heat-haze-refraction.md` settled the *warp* (a single custom
> pmndrs `Effect` that offsets screen UV with `gw_fbm`, vertical convection bias, before Bloom). It
> declared, but did not resolve, the one remaining design decision: **where does the heat mask come from?**
> The shimmer is only as good as the signal that says "distort *here* and nowhere else." This document is
> the bake-off between the three viable 2025-2026 mask sources — **(1) input-buffer luminance threshold**
> (free, no extra pass, agrees with Bloom by construction), **(2) a quarter-res dedicated emissive render**
> (MRT on WebGPU, or a layer re-render on WebGL), and **(3) an analytic pour-front projection** (math, no
> texture). It picks one, proves it agrees byte-for-byte with the Bloom threshold and the cooling gradient
> across the letterforms, and specifies the exact code that hooks it into the shared master-temperature
> system from `00-COHESION-MAP.md §1` and `phase2/01-master-temperature-module.md`. The keystone constraint:
> the mask must light up on **exactly** the same pixels Bloom blooms, so the air shimmers precisely where
> the metal glows — one HDR convention, two consumers.

---

## 1. SCOPE — the mask is the localization, not the warp

In the GAELWORX forge the air over the white-hot pour front, the freshly-filled letter cores, and the
eternal divine-fire **A** and **E** must bend the framebuffer behind it — the basalt, the Ogham, the
channel walls, the cooler letter bodies *swim* as you look through rising heat. Doc 16 built that warp.
But a warp applied uniformly across the screen is **wrong** and instantly reads as a bug: it wobbles the
cold basalt, the void, the UI — everything. The thing that makes heat haze read as *convection off hot
metal* rather than *the whole page underwater* is the **mask**: a per-pixel scalar `m ∈ [0,1]` that is `1`
above genuinely white-hot metal and `0` everywhere else, so `uv += offset * m`.

The mask is therefore the load-bearing decision, and it is a **cohesion decision before it is a perf
decision**. The cooling gradient (white-hot → orange → forge-red → iron-black, owned by `gwCool01` +
`gw_forge`) means a single GAELWORX letter is hot at its newly-filled edge and cold at its solidified tail
*within one glyph*. The mask has to track that gradient — the hot end of the **W** shimmers, the cold end
of the **G** is glassy-still — or the haze and the metal disagree and the illusion of "one substance
cooling on one timeline" cracks. And the mask has to agree with Bloom: the same `PAL.hot`/`PAL.emberHot`/
`PAL.divine` cores that bloom are the only cores that should shimmer. If Bloom says "this is hot" and the
haze says "this is cold," the world is incoherent. So the question "which mask source?" is really "which
source localizes cleanest, costs least on the iPhone-15, **and is structurally guaranteed to agree with the
bloom threshold and the cooling ramp** — not tuned to agree, but *forced* to agree by sharing the signal."

This sits in cluster **E-light-finish-arch** because the mask is the bridge between the *light* system
(emissive HDR, the palette's >1 reservation, Bloom) and the *finish* system (the post chain, the haze
pass, the grade). It is the same HDR luminance convention §3.1 of the cohesion map calls "the palette *is*
the bloom selector, the heat mask, and the light source list, all in one."

---

## 2. TECHNIQUE LANDSCAPE 2025-2026

Three sources can produce the mask. All three are alive in 2025-2026 work; they differ in **where the
"is this hot" signal is computed**, **whether it costs an extra render**, and **how tightly it is coupled
to the bloom threshold and the cooling ramp.**

### 2.1 Source A — input-buffer luminance threshold (free, agrees with bloom by construction)

Compute the mask *inside the haze pass* from the luminance of the framebuffer the pass already receives:

```glsl
float l = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
float mask = smoothstep(uThreshold, uThreshold + 0.6, l);
```

This is the variant doc 16 sketched. Its decisive property: it reads the **same HDR signal Bloom reads**.
pmndrs `BloomEffect` thresholds luminance at `luminanceThreshold` and only pixels above it bloom; if the
haze thresholds the *same* luminance at the *same* (or a derived) value, the two passes are looking at the
identical pixels. The cohesion map's central rule — "only the ~10% accent band exceeds 1.0
(`PAL.hot`/`emberHot`/`gold`/`divine`); cold iron, basalt, deep crimson all sit ≤ 1.0 and never bloom"
(§3.1) — means the framebuffer's own luminance *is already a heat map*. Threshold it and you have the mask
for free, with **zero extra render**.

- **Quality:** Very good for this world. Because GAELWORX is pure-void darkness lit only by the metal, the
  bright pixels in the buffer *are* the hot metal — there is no bright sky, no bright UI, no specular
  sunlight to false-positive on. The signal is unusually clean here precisely because of the lighting
  model. (In a daylit scene, luminance masking is noisy — bright sky trips it — which is the documented
  weakness that pushes other projects to dedicated buffers. GAELWORX doesn't have that scene.)
- **Perf:** Best possible. One extra `texture2D` of the input buffer at the warped UV (which the warp needs
  anyway) plus a `dot` and a `smoothstep`. No second scene render, no extra render target, no MRT. The
  pmndrs custom-effects model (the `mainImage(inputColor, uv, outputColor)` signature, `inputBuffer`
  sampler, `texelSize`/`resolution` uniforms) is exactly built for this; reading non-local samples requires
  declaring the `CONVOLUTION` attribute, which the 2025 pmndrs wiki documents and which forces the effect
  into its own `EffectPass` (correct — Bloom is also convolution; they can't share a pass).
- **Mobile:** Ideal. This is the only family that fits the iPhone-15 budget as a scene-wide effect with
  no extra render.
- **Agreement with bloom:** *Structural, not tuned.* Same buffer, same luminance formula, same HDR
  reservation. You cannot drift them apart by accident.
- **Agreement with cooling ramp:** *Free.* The cooling letter's emissive falls off `gw_forge(temp)` ·
  `gw_tempEmissive(temp)`, which crosses 1.0 only at the hot band. As a letter cools left-to-right its
  luminance drops below threshold tail-first, so the mask retreats up the glyph in lockstep with the
  metal. The temperature ramp drives the haze falloff *for free* — the single biggest cohesion win.
- **Weakness:** The mask lives in *screen space after compositing*, so it can only know "this pixel is
  bright," not "this is the pour front specifically." It can't distinguish a white-hot letter core from an
  equally-bright spark. For GAELWORX that's *desirable* (the air around a rising spark *should* wobble),
  but it means you can't author region-specific behavior (e.g. "more turbulence at the pour front, calm
  above cooled letters") from luminance alone. That needs Source C blended in.

### 2.2 Source B — dedicated quarter-res emissive render (MRT / layer re-render)

Render *only the hot emissive* into a separate, downsampled target and sample that as the mask. Two
sub-variants by renderer:

**B-WebGPU (MRT, the 2025-2026 forward path).** Multiple Render Targets let one scene pass write color
**and** an emissive buffer simultaneously, with no second geometry pass. The three.js TSL idiom (r17x+,
documented across the 2026 tutorials and the WebGPU bloom examples) is:

```js
import { pass, mrt, output, emissive } from 'three/tsl'
const scenePass = pass(scene, camera)
scenePass.setMRT(mrt({ output: output, emissive: emissive }))
const emissiveTex = scenePass.getTextureNode('emissive')   // <-- the heat mask source
```

The official `webgpu_postprocessing_bloom_selective` / `_bloom_emissive` examples and the Jan-2026 Codrops
"Gommage" tutorial use exactly this `mrt({ output, emissive })` pattern to drive selective bloom; the same
`emissive` buffer is a *perfect* heat mask — it is the hot emissive isolated from the rest of the frame,
before any tone-map or grade muddies it. r183 (2026) goes further with `RenderPipeline`, a modern
replacement for `EffectComposer` that makes wiring these multi-target chains "dramatically simpler."

**B-WebGL (layer re-render, the only option on the ship renderer).** WebGL2 + pmndrs has no MRT-to-effect
plumbing for this; the classic equivalent is the `SelectiveBloom` approach — put hot meshes on a layer,
render that layer alone into a small target, sample it as the mask. This is a **second scene render** of
the hot geometry.

- **Quality:** Highest *theoretical* localization — the mask is the true emissive, untouched by
  compositing, so it never false-positives on a bright non-hot pixel and never needs a luminance guess.
- **Perf:** **On WebGPU, nearly free** (MRT is one pass, the cohesion map and doc 30 both note MRT
  "collapses multiple geometry passes into a single pass writing multiple attachments"). **On WebGL, a
  second scene render** — the exact cost pmndrs explicitly warns against for `SelectiveBloom` ("costs an
  extra render of the selection, more fragile across browsers"), and the cohesion map's §5/§6 reason the
  whole project rejects `SelectiveBloom`: "the palette already selects." A quarter-res re-render is cheaper
  than full-res but still a draw-call multiplier on a fill-rate-bound mobile scene.
- **Mobile:** WebGPU path not on the judge device (WebGL2 + `onBeforeCompile` ships to the iPhone-15 per
  the hard constraints; WebGPU/TSL is a gated post-judge upgrade). WebGL re-render path is affordable only
  at low res and only if it buys something luminance can't — and in this pure-void world, it largely
  doesn't.
- **Agreement with bloom:** On WebGPU, *perfect and shared* — the same `emissive` MRT buffer feeds both
  bloom and haze. This is the cleanest possible agreement and is the reason this is the right Phase-3
  target. On WebGL, the layer-render mask and the luminance-threshold bloom are **two different signals**
  that must be hand-kept-consistent — a regression risk.
- **Agreement with cooling ramp:** Excellent — the emissive buffer *is* `gw_forge(temp)`, so it tracks
  cooling exactly, same as luminance but without the tone-map in the way.
- **Weakness on the ship renderer:** It pays a render to solve a problem the pure-void lighting model
  already solves for free. Right answer once the renderer is WebGPU; over-engineering before then.

### 2.3 Source C — analytic pour-front projection (math, no texture)

Don't sample the frame at all. The world *already knows* where the heat is: `U.uPourFront` (the moving
pour-front world position + arc coordinate, doc 26 + cohesion map §4.2) and the per-letter fill front
(`uFillFront`, doc 13/17). Project those into screen space (or carry a screen-space pour-front UV as a
uniform) and build the mask as a distance falloff:

```glsl
// uPourFrontUV: pour-front position in screen UV, written by ForgeDriver each frame
// uFrontHeat:   0..1 master heat at the front (from uTemp/uHeat)
float d = distance(uv, uPourFrontUV);
float mask = uFrontHeat * smoothstep(uFrontRadius, 0.0, d);   // 1 at the front, fades with distance
```

- **Quality:** Surgically localized to *intent* — you can author exactly where the air is most turbulent
  (a tight hot core at the pour front, a calmer wide skirt over cooled letters) because you control the
  falloff function, not a luminance accident. It is the only source that can express "more turbulence at
  the front, calm above the cooled tail" cleanly.
- **Perf:** Cheapest of all — no texture fetch for the mask at all, just a `distance` + `smoothstep` on
  uniforms. (You still fetch the warped color, but the *mask* costs nothing.)
- **Mobile:** Excellent, renderer-agnostic, works identically on WebGL and WebGPU.
- **Agreement with bloom:** **None, structurally.** The analytic mask knows nothing about which pixels
  actually exceeded 1.0; it's a geometric guess about where heat *should* be. It can shimmer air over a
  letter that has already cooled below the bloom threshold (front passed, metal cooled, but the analytic
  falloff still says "hot here") — a visible disagreement. This is its fatal flaw as a *sole* source.
- **Agreement with cooling ramp:** Only as good as you wire it. You'd have to feed it per-letter `age`/
  `temp` to make it retreat as letters cool, which means re-deriving the cooling ramp the haze pass instead
  of reading it — duplicating logic the cohesion map forbids (rule 1: "reads the master temperature, never
  invents heat").
- **Weakness:** It's a *prior*, not a *measurement*. Brilliant for shaping turbulence, wrong as the
  authority on "is this hot right now."

### 2.4 Verdict on the landscape

| | Source A (luminance) | Source B (emissive render) | Source C (analytic) |
|---|---|---|---|
| Extra render cost | **none** | WebGPU: ~none · WebGL: a re-render | **none** |
| Agrees with Bloom | **structural (same buffer)** | WebGPU: perfect (shared MRT) · WebGL: hand-kept | none |
| Tracks cooling ramp | **free (luminance falls with temp)** | free (emissive = `gw_forge`) | only if re-derived |
| False-positive risk | low (pure-void scene) | lowest | n/a (it's a prior) |
| Region authoring | no | no | **yes** |
| Ships on iPhone-15 WebGL today | **yes** | re-render only | yes |
| Right for WebGPU Phase-3 | ok | **best** | as a shaping blend |

The three are not really competitors — **A is the authority, C is the shaper, B is the WebGPU upgrade of
A.** A answers "is this hot" for free and in perfect agreement with Bloom; C answers "how should the
turbulence be shaped" without claiming to know what's hot; B becomes the better A once the renderer is
WebGPU. The wrong move is to treat them as either/or.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship Source A (input-buffer luminance threshold) as the mask authority, derived from the *exact same*
luminance signal and HDR convention Bloom uses, and blend in Source C (analytic pour-front falloff) only
as a low-weight *turbulence shaper* — never as a heat authority. Reserve Source B (MRT emissive buffer) as
the documented Phase-3 upgrade that lands automatically when the renderer migrates to WebGPU, because the
same `mrt({ output, emissive })` buffer then feeds both Bloom and the haze.**

Justification, against the world and the constraints:

1. **It is the only family that fits the iPhone-15 budget as a scene-wide effect with zero extra render.**
   The scene is fill-rate-bound (near-full-screen emissive fbm + post), not triangle-bound; a second scene
   render (Source B on WebGL) spends the scarcest resource to solve a problem the lighting model already
   solves. Source A is one extra texture fetch the warp needs anyway.

2. **The pure-void lighting model makes luminance masking unusually *clean* here.** The documented weakness
   of luminance masking (bright sky / UI false-positives) does not exist in a world that is black except
   for the metal. The brightest pixels *are* the hot metal. This is the rare scene where the cheapest mask
   is also the most accurate.

3. **It agrees with Bloom by construction, not by tuning.** Both read the framebuffer luminance; both key
   off the palette's "only >1 blooms" reservation. There is no way to drift them apart — the cohesion the
   cohesion map demands ("shimmer & bloom agree on what is hot") is *structural*. Tie `uThreshold` to
   Bloom's `luminanceThreshold` as a derived value (`uThreshold = bloomThreshold + 0.35`, set *only the
   hottest* air to shimmer) so a future threshold change propagates to both.

4. **It tracks the cooling gradient across letterforms for free.** The mask is a function of the
   framebuffer luminance, which is a function of `gw_forge(gwCool01(age))` — so as a letter cools
   left-to-right and its emissive drops below threshold tail-first, the mask retreats up the glyph
   automatically. The divine-fire A/E never cool (`gw_divineFire` ignores `uTemp`), so they stay the
   brightest emitters and *always* sit under shimmering air — the haze ratifies the A/E rule rather than
   competing with it.

5. **Source C as a *shaper* gives the one thing A can't — region authoring — without letting it lie about
   heat.** Blend it in at low weight to *bias* turbulence and strength toward the pour front
   (`amp *= 1.0 + 0.5 * frontFalloff`), never to *gate* the mask. The gate stays luminance; the shape gets
   a forge-air bias. This is how you get "more turbulent at the front, calm above cooled letters" while
   keeping the heat authority honest.

6. **Source B is the clean future, pre-wired.** When the renderer goes WebGPU (doc 30, gated post-judge),
   the haze reads `scenePass.getTextureNode('emissive')` — the identical buffer Bloom's `bloomNode` reads —
   and Source A's luminance heuristic is replaced by the true emissive with *no behavioral change* and
   *better* agreement. Author the WebGL effect so this swap is a one-line mask-source change.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `postprocessing` (pmndrs, ≥ 6.3x line that ships `MipmapBlurPass` + merged `EffectPass`) and
  `@react-three/postprocessing` — **already in the repo** (`Effects.jsx`). No new dependency.
- `three` — existing WebGL2 version; this is `onBeforeCompile`-free pure post-processing, no upgrade.
- Reuse `GLSL_NOISE` (`gw_fbm`, `gw_snoise`) from `src/scene/shaders.js`, `PAL`/`v3` from
  `src/scene/palette.js`, and the shared uniform pool `U` from `src/scene/forgeUniforms.js`.
- The `gw_forge`/`gwCool01` math lives in `src/scene/temperature.js` (phase2/01) — the haze does **not**
  re-implement it; it reads the *result* (luminance) the materials already wrote.

### 4.2 The mask function (the whole decision, in 8 lines)

```glsl
// ── HEAT MASK ─────────────────────────────────────────────────────────────────
// Source A authority: same luminance, same HDR reservation Bloom uses. Heat RISES,
// so the air at `uv` is driven by the hot pixel a touch BELOW it.
uniform float uThreshold;      // = bloomThreshold + 0.35  (only the HOTTEST air shimmers)
uniform vec2  uPourFrontUV;    // Source C shaper: pour-front in screen UV (from ForgeDriver)
uniform float uFrontHeat;      // 0..1 master heat at the front (uHeat)
uniform float uFrontRadius;    // screen-space radius of the front's turbulence skirt

float gwHotLum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

float gwHeatMask(vec2 uv){
  // sample the buffer just below (heat rises) and at the fragment, take the stronger.
  float below = gwHotLum(texture2D(inputBuffer, uv - vec2(0.0, 0.06)).rgb);
  float here  = gwHotLum(inputColor.rgb);
  float lum   = max(below, here * 0.5);
  return smoothstep(uThreshold, uThreshold + 0.6, lum);     // <-- AGREES WITH BLOOM
}
```

### 4.3 The full effect fragment (mask authority + analytic shaper + vertical convection)

```glsl
uniform float uTime;
uniform float uHeat;        // master temperature 0..1 (scroll/strike driven, from U.uHeat)
uniform float uStrength;    // max UV offset in screen units (~0.004–0.010)
uniform float uScale;       // noise frequency
uniform float uThreshold;   // luminance gate, derived from Bloom's threshold
uniform vec2  uPourFrontUV; // Source C shaper
uniform float uFrontHeat;
uniform float uFrontRadius;
${GLSL_NOISE}               // gw_fbm, gw_snoise — the SAME basis as the veins

float gwHotLum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  // ── MASK: Source A authority ──────────────────────────────────────────────
  float below = gwHotLum(texture2D(inputBuffer, uv - vec2(0.0, 0.06)).rgb);
  float here  = gwHotLum(inputColor.rgb);
  float mask  = smoothstep(uThreshold, uThreshold + 0.6, max(below, here * 0.5));

  // ── SHAPER: Source C analytic pour-front bias (shapes turbulence, never gates) ─
  float frontFalloff = uFrontHeat * smoothstep(uFrontRadius, 0.0, distance(uv, uPourFrontUV));

  // ── CONVECTION FIELD: fast vertical ripple over a slow drift (forge air, not water) ─
  vec2 p  = uv * uScale;
  float n1 = gw_fbm(p + vec2(0.0, uTime * 0.9));              // rising
  float n2 = gw_fbm(p * 2.1 + vec2(uTime * 0.15, uTime * 0.6));
  vec2 offset = vec2(
    (n1 - 0.5) * 0.6 + (n2 - 0.5) * 0.4,                      // small horizontal sway
    (n2 - 0.5) * 1.0                                          // dominant vertical
  );

  // amplitude: gated by the luminance MASK, scaled by master heat, BIASED by the front shaper.
  float amp = uStrength * mask
            * (0.35 + 0.65 * uHeat)
            * (1.0 + 0.5 * frontFalloff);                     // <-- C shapes, A gates
  vec2 warped = uv + offset * amp;

  // tiny per-channel split = the air's own micro chromatic shimmer (high tier only).
  #ifdef GW_HIGH
    float ca = amp * 0.18;
    vec3 col;
    col.r = texture2D(inputBuffer, warped + vec2(ca, 0.0)).r;
    col.g = texture2D(inputBuffer, warped).g;
    col.b = texture2D(inputBuffer, warped - vec2(ca, 0.0)).b;
  #else
    vec3 col = texture2D(inputBuffer, warped).rgb;            // 1 fetch on low
  #endif

  outputColor = vec4(col, inputColor.a);
}
```

### 4.4 The Effect class + r3f wrapper

```js
// src/scene/HeatHaze.js
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2 } from 'three'
import { GLSL_NOISE } from './shaders.js'

export class HeatHazeEffect extends Effect {
  constructor({ strength = 0.006, scale = 3.0, threshold = 0.9, high = true } = {}) {
    super('HeatHazeEffect', (high ? '#define GW_HIGH\n' : '') + frag, {
      attributes: EffectAttribute.CONVOLUTION,     // reads non-local inputBuffer samples → own pass
      uniforms: new Map([
        ['uTime', new Uniform(0)],
        ['uHeat', new Uniform(0)],
        ['uStrength', new Uniform(strength)],
        ['uScale', new Uniform(scale)],
        ['uThreshold', new Uniform(threshold)],
        ['uPourFrontUV', new Uniform(new Vector2(0.5, 0.5))],
        ['uFrontHeat', new Uniform(0)],
        ['uFrontRadius', new Uniform(0.35)],
      ]),
    })
  }
  update(_r, _i, dt) { if (!this._frozen) this.uniforms.get('uTime').value += dt }
}
```

```jsx
// inside/beside Effects.jsx
const HeatHazeImpl = wrapEffect(HeatHazeEffect)

export function HeatHaze({ quality }) {
  const ref = useRef()
  useFrame((_, dt) => {
    const e = ref.current; if (!e) return
    if (quality === 'static') { e.uniforms.get('uTime').value = 2; e._frozen = true; return }
    e._frozen = false
    // master heat — the SAME signals ObsidianSlab/ForgeDriver use. No new state, no 2nd rAF.
    const u = e.uniforms.get('uHeat')
    u.value = damp(u.value, forge.ready ? Math.min(U.uHeat.value, 1) : 0, 3, dt)
    // Source C shaper, fed from the shared pool (ForgeDriver projects pour-front → screen UV)
    e.uniforms.get('uPourFrontUV').value.copy(U.uPourFrontUV.value)
    e.uniforms.get('uFrontHeat').value = U.uHeat.value
  })
  return <HeatHazeImpl ref={ref}
    high={quality === 'high'}
    strength={quality === 'high' ? 0.007 : 0.0045}
    scale={quality === 'high' ? 3.2 : 2.4}
    threshold={BLOOM_THRESHOLD + 0.35} />   {/* derived from Bloom's 0.55 → 0.9 */}
}
```

### 4.5 Wiring into the composer (order is load-bearing)

```jsx
const BLOOM_THRESHOLD = 0.55
<EffectComposer disableNormalPass multisampling={high ? 2 : 0} frameBufferType={HalfFloatType}>
  <HeatHaze quality={quality} />                         {/* warp BEFORE bloom */}
  <Bloom mipmapBlur luminanceThreshold={BLOOM_THRESHOLD} resolutionScale={0.5} ... />
  {high ? <ChromaticAberration ... /> : <></>}
  ...
</EffectComposer>
```

`HeatHaze` declares `CONVOLUTION`, so react-postprocessing places it in its **own** `EffectPass` (a
convolution effect can't share a pass with Bloom). `frameBufferType={HalfFloatType}` is mandatory — without
it the >1 emissive the mask keys on is clamped to 1 in an 8-bit buffer and the mask collapses (the #1 silent
bug, cohesion map §6).

### 4.6 Key uniforms / params

| Uniform | Default (high / low) | Meaning |
|---|---|---|
| `uThreshold` | `0.9` (= `BLOOM_THRESHOLD + 0.35`) | luminance gate; **derived** from Bloom so they agree. Higher → only the hottest air shimmers. |
| `uStrength` | 0.007 / 0.0045 | max screen-UV offset. The seasickness dial; keep ≤ ~0.010. |
| `uScale` | 3.2 / 2.4 | noise frequency — higher = finer shimmer, less wobble. |
| `uHeat` | damped, runtime | from `U.uHeat` (scroll + strike) — same heartbeat as veins/bloom. |
| `uPourFrontUV` | runtime | Source C shaper; pour-front projected to screen UV by ForgeDriver. |
| `uFrontHeat` / `uFrontRadius` | `U.uHeat` / 0.35 | shaper weight + skirt radius. Bias only, never gate. |
| `uTime` | accumulated dt | frozen to `2` on `static`. |

### 4.7 Hooking the shared master-temperature system

The haze owns **no heat logic of its own** (cohesion rule 1). It reads:
- `U.uHeat` — the single master temperature float, written by the one `<ForgeDriver/>` from
  `forge.scrollDamped + scrollVel*0.25 + strike pulse`. Drives `uStrength` scaling and `uFrontHeat`.
- The framebuffer luminance — which is `gw_forge(gwCool01(age))` already composited by every hot material,
  so the mask tracks the cooling ramp without re-deriving it.
- `U.uPourFrontUV` — the pour-front world position (`U.uPourFront`) projected to screen UV. **Add this
  projection to `ForgeDriver`** (one `vector.project(camera)` per frame), so the haze, the DOF focus
  (`forge.focusDist` locked to the pour-front, cohesion §6), and the god-rays all read one pour-front.

The keystone wiring: `uThreshold = BLOOM_THRESHOLD + 0.35`. The Bloom threshold is the single source of
truth for "what is hot enough to glow"; the haze threshold is **derived from it**, set a notch higher so
only the *hottest* core air shimmers while the wider warm halo blooms. Change Bloom's threshold and the
haze follows — they can never disagree.

---

## 5. COHESION — shared palette / lighting / uniforms

- **One HDR convention, three consumers.** The palette reserves >1 for the hottest 10%
  (`PAL.hot`/`emberHot`/`gold`/`divine`). Bloom blooms it, the haze mask shimmers it, the lighting model
  treats it as the only light. The mask *is* the palette's >1 reservation read as a per-pixel scalar —
  exactly the cohesion-map §3.1 claim that "the palette is the bloom selector, the heat mask, and the light
  source list, all in one." No second signal, no private threshold.

- **One master temperature.** `uStrength` and `uFrontHeat` ride `U.uHeat`, the same float that flares the
  veins (`uTemp`/`uVeinGlow`), brightens the jewel edges, and pushes Bloom intensity. Scroll into the
  casting-room and the metal flares, the bloom swells, **and** the air shimmers harder — all from one float,
  one frame, one strike pulse (`exp(-since*3)`). That synchrony is the cohesion proof (cohesion rule 6).

- **One cooling ramp.** Because the mask reads composited luminance = `gw_forge(gwCool01(age))`, a cooling
  letter's haze retreats up the glyph as it cools tail-first — the hot end shimmers, the iron-black tail is
  glassy-still. The haze and the metal are visibly *the same substance on one cooling timeline* because the
  mask is downstream of the same ramp (cohesion rule 1).

- **The A/E exception, ratified.** `gw_divineFire` ignores `uTemp` and never cools, so the white-gold A and
  E stay the brightest emitters in every frame — permanently above `uThreshold`, permanently under a column
  of shimmering air. The haze *reinforces* "unearthly, eternally hot" instead of competing with it. Bounded
  `uStrength` (≤0.010) protects the Cinzel glyph silhouette from dissolving (cohesion rule 5).

- **One noise basis.** `gw_fbm` is the same field driving the obsidian veins, the molten flow, and the
  embers — so the air's wobble is literally the same grain as the metal's flow (cohesion rule 2). "More
  shimmer detail" = one more `gw_fbm` octave, never a second noise.

- **One chromatic language.** The `#ifdef GW_HIGH` per-channel split mirrors the `ChromaticAberration`
  already used on high — the air refracts color the way the obsidian edges do.

- **One pour-front.** `U.uPourFrontUV` is the same projected front the DOF focus and god-rays read, so the
  metal that is hottest is the metal in focus *and* the air that shimmers most — one moving locus of heat
  (cohesion §6, rule 8).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Cost: one extra fullscreen pass, ~2 (low) to ~4 (high) texture fetches + 2 `gw_fbm`(3-octave) evals
  per pixel.** The *mask itself adds nothing* beyond the one below-sample the warp already justifies — this
  is the whole point of choosing Source A: no second scene render (Source B-WebGL), no MRT plumbing
  (Source B-WebGPU, off-device), no extra render target. Comparable to the Bloom prefilter.
- **No depth pass.** The luminance mask needs no depth → keep `disableNormalPass`, avoid the `DEPTH`
  attribute and its buffer entirely. (Source C is analytic uniforms, also no depth.)
- **Tiering (mirror `ForgeCanvas`/`Effects`):**
  - **high:** `uStrength` 0.007, `uScale` 3.2, `GW_HIGH` 3-fetch chromatic split, Source-C shaper on.
  - **low:** `uStrength` 0.0045, `uScale` 2.4, **single-fetch** path (no `GW_HIGH`), shaper still on
    (it's free).
  - **static** (`prefers-reduced-motion` / weak GPU): the entire `<Effects>` tree is **not mounted**
    (`ForgeCanvas` gates it) → no haze, frozen `uTime`, zero cost. Reduced-motion law satisfied with no
    extra branch.
- **mediump is fine here.** The 2026 utsubo perf guide notes mobile GPUs run `mediump` ~2× faster than
  `highp` and reserve `highp` for depth/position math. The haze does neither — luminance, fbm, and small UV
  offsets are all `mediump`-safe. Don't force `highp`.
- **Half-res fallback.** If on-device profiling shows pressure, run the haze pass at half resolution via a
  downsampled `inputBuffer` read — the warp is low-frequency enough to tolerate it. Start full-res; only
  drop if measured.
- **fbm ceiling.** Reuse the 3-octave `gw_fbm`; two calls is the ceiling. Do not add octaves
  (cohesion rule 2 / shader-fx "keep loops small").
- **Verify the repo way.** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with **0 console
  errors** (SwiftShader compiles the GLSL in CI; a typo surfaces as an error) → then the **iPhone-15 OLED
  read**: the subtle convection warp + true-black void + the divine-fire white-gold shimmer column do
  **not** simulate headless.

**Static-tier note.** Because the static poster has no post and frozen `uTime`, there is no haze at all —
correct. The world still reads (warm veins on true-black void); the missing shimmer is a dignified
degradation, not a broken effect (cohesion rule 9).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each unblocks the next):**

1. **Lock composer order first.** `HeatHaze` **before** Bloom, in its own `EffectPass` (the `CONVOLUTION`
   attribute forces this). If it runs after Bloom, you warp already-bloomed pixels and the glow smears with
   the air — reads as a bug. Confirm `frameBufferType={HalfFloatType}` so >1 survives into the mask.
2. **Build and *visualize the mask* before any warp.** Output `vec4(vec3(mask),1.0)` and confirm it lights
   up **only** on white-hot cores and is black on cooled letter tails, basalt, and void. If the mask is
   wrong, no warp tuning helps. This is where you catch a threshold mismatch with Bloom.
3. **Prove the agreement, don't assume it.** Side-by-side the mask and Bloom's contribution; they must
   light the same pixels. Derive `uThreshold` from `BLOOM_THRESHOLD` (don't hardcode a second magic number)
   so the agreement can't rot.
4. **Verify the cooling retreat.** Watch one letter fill and cool: the mask must retreat up the glyph
   tail-first as the metal drops below threshold. If it doesn't, the materials aren't writing emissive
   through `gw_forge`/`gwCool01` — fix the *material*, not the haze.
5. **Heat rises — sample below.** Drive a fragment's mask from the pixel **beneath** it
   (`uv - vec2(0,0.06)`), not at it, or the shimmer sits *on* the metal instead of rising *off* it.
6. **Add the warp at low strength, then animate.** Start `uStrength` 0.004 and raise. Vertical-bias +
   high-freq-over-low-freq = convection, not water. Too strong = instant seasickness, off-brand (Brutalist
   Snap: "the air drifts, it does not slosh").
7. **Blend Source C as a *bias*, never a *gate*.** `amp *= 1.0 + 0.5*frontFalloff` (shape), not
   `mask = frontFalloff` (gate). If C ever gates, the haze will shimmer air over already-cooled,
   already-non-blooming letters — a visible disagreement with Bloom. Keep the gate on luminance.
8. **dt-correct everything.** `uTime += dt`, `uHeat` via `damp(...,dt)` from the shared store. Never a
   frame-rate step, never a second rAF. Freeze `uTime` on `static`.
9. **Don't break the A/E.** Bounded `uStrength` + the per-fragment mask means the divine-fire A/E shimmer
   their surrounding air without dissolving the glyph. Eyeball this specifically on the Cinzel A and E.
10. **Pre-wire the WebGPU swap.** Keep the mask source isolated to `gwHeatMask()` so the Phase-3 migration
    replaces *one function* (luminance → `getTextureNode('emissive')`) with no behavioral change. Don't
    scatter luminance reads through the effect.

**Pitfalls specific to mask provenance:**
- **8-bit buffer collapses the mask.** Without `HalfFloatType`, >1 clamps to 1, every hot pixel reads
  `lum≈1`, and the mask becomes a hard binary with no falloff. (Same root cause as bloom dying.)
- **A second hand-tuned threshold drifts.** If `uThreshold` is a literal, it will silently diverge from
  Bloom on the next grade tweak. Derive it.
- **Source-C-as-authority lies about heat.** The single most tempting wrong turn — using the analytic front
  as the mask because it's cheapest — produces shimmer over cooled metal. C shapes; A gates.
- **Tone-map ambiguity.** The pass reads the composer's working buffer (pre-final-tone-map if tone-map is
  on the renderer). Confirm where tone mapping happens so `uThreshold` is calibrated against the *same*
  luminance the mask sees on-device (cohesion §3.2 — one operator, on the renderer).

---

## 8. SOURCES (2025-2026)

1. **pmndrs/postprocessing — Custom Effects wiki** (maintained 2025-2026). The `mainImage(inputColor, uv,
   depth, outputColor)` signature; available uniforms (`inputBuffer`, `resolution`, `texelSize`,
   `cameraNear`/`Far`, `time`); the two `EffectAttribute`s — **`CONVOLUTION`** (required for effects that
   fetch non-local input samples, e.g. a warped re-sample) concatenated with bitwise OR, and **`DEPTH`**
   (requests a depth texture). The exact API the luminance-mask effect extends.
   https://github.com/pmndrs/postprocessing/wiki/Custom-Effects
2. **Three.js Roadmap — The Complete Guide to Three.js Post-Processing in 2026** (2026). MRT for selective
   bloom and emissive buffers (`setMRT(mrt({ output, emissive }))`, `getTextureNode`), MRT collapsing
   multiple geometry passes into one pass writing multiple attachments, luminance-threshold bloom, and the
   note that **r183 introduced `RenderPipeline`** as a modern `EffectComposer` replacement for these chains.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
3. **Codrops / Jin — WebGPU Gommage Effect: Dissolving MSDF Text … with Three.js & TSL** (2026-01-28).
   MRT-based selective bloom finishing a dissolving-text scene — the `mrt({ output, emissive })` pattern
   used as a real isolated emissive buffer (the Source-B mask in production).
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
4. **Maxime Heckel — Field Guide to TSL and WebGPU** (2025-10-14). The viewport-texture / `viewportSharedTexture`
   node that accesses already-rendered pixels for refraction without a second pass, and the special
   **screen-UV-with-depth-comparison** function that mitigates the classic refraction-bleed artifact
   (foreground pixels appearing on the refractive surface); custom post-processing in TSL; confirmation that
   WebGPU support landed in iOS Safari (uneven coverage). The Source-B-WebGPU / future-haze path.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. **Codrops / Ming Jyun Hung — False Earth: From WebGL Limits to a WebGPU-Driven World** (2026-04-21). A
   full TSL node-graph post chain — chromatic aberration via offset-UV RGB sampling, vignette, **bloom for
   emissive glow**, tone mapping last; color + depth emerge from the scene pass as nodes and each effect
   plugs in as a transform. The validated 2026 chain ordering the haze slots into.
   https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
6. **Codrops — How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur** (2025-10-08).
   Modern animated-uniform UV-offset / noise-driven distortion patterns and time-scrolled noise UV warps
   with intensity envelopes — the contemporary form of the Source-A warp the mask gates.
   https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
7. **utsubo — 100 Three.js Tips That Actually Improve Performance (2026)** (2026-03-22). Mobile GPUs run
   `mediump` ~2× faster than `highp` (reserve `highp` for depth/position); pmndrs auto-merges effects into
   fewer passes; "not everything should bloom — use layers or threshold"; disable native AA when post
   handles it; dispose render targets; dt-frame independence. The mobile-budget rules the mask choice is
   held to.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
8. **three.js examples — `webgpu_postprocessing_bloom_selective` / `_bloom_emissive`** (r17x, 2025-2026).
   Reference implementations of emissive-buffer MRT selective bloom — the canonical Source-B emissive mask.
   https://threejs.org/examples/webgpu_postprocessing_bloom_selective.html ·
   https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html
9. **three.js docs — TSL** (r17x/r18x, 2025-2026). `viewportSharedTexture` / screen-UV-with-depth for
   viewport-texture refraction; `pass`/`mrt`/`output`/`emissive` node imports. The Phase-3 mask plumbing.
   https://threejs.org/docs/pages/TSL.html
10. **react-postprocessing docs — Bloom / SelectiveBloom** (pmndrs, current 2025-2026). "Bloom is selective
    by default" via material colors lifted out of 0–1 with `toneMapped=false`; `mipmapBlur`; SelectiveBloom
    **discouraged** unless per-object masking is genuinely required (extra render, cross-browser fragility)
    — the reason Source-B-WebGL is rejected as the everyday mask.
    https://react-postprocessing.docs.pmnd.rs/effects/bloom

_(Foundational pre-2025 lineage — Lucas Bebber's 2016 Codrops heat-distortion UV-offset — is cited only as
ancestry; all implementation guidance tracks the 2025-2026 sources above.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The pour-front screen-UV projection node.** Formalize `ForgeDriver`'s `U.uPourFront →
   U.uPourFrontUV` projection (one `vector.project(camera)`/frame, behind-camera + off-screen clamping,
   per-route arc sampling) as the single shared screen-space heat locus consumed by the haze shaper, the
   DOF focus, and the god-ray cone seed — so all three lens/atmosphere effects track one moving front.

2. **WebGPU MRT-emissive mask migration.** The one-function swap from Source-A luminance to
   `scenePass.getTextureNode('emissive')` (`mrt({ output, emissive })`) so Bloom's `bloomNode` and the
   haze read the *identical* isolated emissive buffer — perfect agreement, no luminance heuristic — plus
   the r183 `RenderPipeline` rewrite of the whole `Effects` chain and the WebGL-fallback branch for the
   iOS-coverage gap.

3. **Per-region turbulence authoring from the analytic shaper.** How far Source C can shape the field
   without gating — a tight high-frequency hot core at the pour front vs. a calm wide skirt over cooled
   letters vs. a steady eternal column over the divine-fire A/E — and the exact `uFrontRadius`/`uScale`
   envelope per chamber preset (`scenes.js`) that keeps each read distinct yet sub-seasickness on the OLED.

4. **Mask-as-shared-bus.** Promote the heat mask to a first-class member of the master temperature bus:
   one luminance/emissive heat scalar feeding haze strength, spark-spawn rate near the front, god-ray
   weight, and bloom intensity together — so "the forge runs hot" is one coherent multi-effect surge driven
   off a single derived per-pixel and per-frame heat signal across every route's compose pass.
