# 21 — Color Grading & Tone Mapping for OLED

_Phase-1 graphics research · GAELWORX forge world · target: iPhone 15 OLED, single WebGL renderer_

> Scope note: this document owns the **transfer function and the grade** — the math that maps the
> scene's unbounded HDR (white-hot pour fronts, divine-fire A/E, emissive vein cores well above 1.0)
> down to the 8-bit panel, plus the final color shaping (grade + LUT + dither) that gives GAELWORX
> its warm-forge identity on a true-black OLED. It is the partner to **doc 20 (Bloom & the post
> stack)** — doc 20 owns *which pixels glow*; this doc owns *what every pixel looks like after the
> render*. It is the explicit answer to doc 20's deep-dive #3 ("OLED-accurate grade & dither: ACES
> vs AgX vs custom"). It consumes the HDR emissive from `shader-fx` and feeds the order documented in
> the `post-fx` skill. Everything here must keep the obsidian void at **true black (0,0,0)** on the
> iPhone-15 OLED while making the reds **vivid without clipping to flat orange**.

---

## 1. SCOPE

In a pure-void world lit only by molten metal, the tone-mapping operator is not a finishing nicety —
it is the **physics of how the forge's brightness becomes color on the panel**. The pour front is
genuinely > 4.0 in linear light; the divine-fire A/E sit near white-gold; the cooling letterforms
ride a temperature ramp from white-hot through Ember Glow `#E85D04` to Celtic Blood `#C1292E` down to
iron-black. None of that can be sent to the screen raw: above 1.0, every channel clips, and clipped
warm content collapses to the same flat, posterized orange-white "blob" that screams *web demo*, not
*Unreal-cinematic*. The tone curve is what turns "an orange shape" into "a thing radiating heat" by
giving the highlights a graceful, hue-stable path to white.

The OLED makes this both easier and harder. **Easier:** the iPhone-15 panel renders true `0,0,0`
(pixels off), so a correctly crushed void is *infinitely* deep — the fire detonates against real
black, which is the entire GAELWORX visual thesis. **Harder:** (a) any operator that lifts black to a
near-zero grey produces a visible grey haze on a true-black panel where an LCD would have hidden it
in backlight bleed; (b) the dark void-to-crimson and crimson-to-ember gradients live in the bottom
~5% of the 8-bit range, where banding is most visible and the OLED's own low-luminance switching
exaggerates it; (c) wide-gamut warm reds near the panel's primary clip *hard* and lose all internal
detail unless the operator desaturates the path to white. So the grade has three jobs: **(1)** a tone
curve that preserves red saturation and hue while gracefully rolling highlights to white-gold;
**(2)** a warm grade + optional LUT that locks the Industrial-Metallurgy palette; **(3)** a dither
that kills banding in the deep gradients. All three must work *without post* on the static tier (the
renderer's tone map is the floor) and stay inside the iPhone-15 budget.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 Tone-mapping operators available in three.js r17x

three.js ships five built-in operators selectable as `gl.toneMapping`, each also exposed as a
`@react-three/postprocessing` `ToneMapping` effect (`ToneMappingMode.*`) and as a TSL node
(`acesFilmicToneMapping`, `agxToneMapping`, `neutralToneMapping`, …) for the WebGPU path.

**(a) ACES Filmic — the current repo setting (`THREE.ACESFilmicToneMapping`).**
The de-facto film/game standard: an S-curve fit of the Academy Color Encoding System RRT+ODT. It
gives the punchy, cinematic, slightly-contrasty highlight rolloff people read as "AAA." Strengths for
GAELWORX: it makes the fire feel *hot* and saturated in the midtones, and its toe naturally crushes
the void toward black. **Documented weaknesses (2025 three.js forum consensus):** ACES is built on
sRGB/Rec.709 primaries and applies a **per-channel** curve, so it introduces a notable **hue shift in
saturated warm content** — bright reds skew orange, then orange-yellow, then white as they brighten
(the infamous "ACES makes everything orange" complaint), and saturated textures can read "washed
out / low contrast." For a world whose hero color *is* saturated warm-red, that hue drift is a real
risk: a Celtic-Blood letter cooling under the pour can shift hue purely from brightness, not
temperature, muddying the deliberate blackbody ramp. Quality: high. Perf: trivial (analytic).
Mobile: free. Complexity: zero (it's the default).

**(b) AgX (`THREE.AgXToneMapping`) — the 2025 challenger.**
Troy Sobotka's operator, now Blender's default, added to three.js core. It transforms into a wider
working gamut, applies the curve there, then maps back — yielding a **far more graceful "path to
white"**: as colors brighten they desaturate and *hold their hue* instead of clipping to a primary,
so a white-hot pour front bleaches to white-gold believably rather than snapping to flat orange. This
is exactly the divine-fire behavior we want. **Cost:** AgX is *globally* lower-contrast and lower
in saturation than ACES — out of the box it can read flat/milky, and on a forge that wants
*aggressive* (the Clan voice) you must add contrast and saturation back via the grade or a "punchy"
look LUT. It also slightly lifts deep shadows in some implementations, which on a true-black OLED can
mean a faint grey void unless re-crushed. Quality: best-in-class highlight behavior. Perf: trivial
(analytic, marginally heavier than ACES). Mobile: free. Complexity: low (swap a flag), medium if you
must re-grade to restore the brutalist punch.

**(c) Khronos PBR Neutral (`THREE.NeutralToneMapping`) — accuracy operator.**
The 3D-Commerce standard (SIGGRAPH 2024 talk; widely adopted across model-viewer, Babylon, Blender,
three.js through 2025). It is **1:1 up to a threshold** then compresses only the highlights, with a
deliberate `−0.04` saturation shift to *preserve* dark-color saturation and **avoid hue shift
entirely**. Superb for "the red is exactly `#C1292E`" fidelity, but it is engineered for *product*
fidelity under grayscale lighting, not for *drama* — it leaves less highlight character than ACES/AgX
and is the least cinematic of the three. Useful as a **reference** to check whether ACES/AgX are
lying about our brand red, and a candidate for the static-tier floor where we want the palette dead-on
with minimal compute. Quality: highest *color accuracy*, lowest *drama*. Perf: trivial. Mobile: free.

**(d) Reinhard / Cineon — legacy.** Reinhard desaturates and milks highlights badly; Cineon is a
film-print emulation superseded by ACES. Reject both for a hero scene; Reinhard only survives as an
ultra-cheap fallback and even then AgX/Neutral are the same cost and look better.

**(e) Custom operator (`THREE.CustomToneMapping` + GLSL, or a TSL `ToneMappingNode`).**
Inject your own curve. The pragmatic 2025-2026 GAELWORX move is **not** to invent a curve from
scratch but to take AgX (best path-to-white) and bake brand contrast/exposure into a custom variant,
or run AgX-as-renderer-flag and shape with the grade + LUT. Full custom curves are a Phase-2 luxury;
the risk/reward at Phase 1 favors a stock operator + grade. Quality: unbounded. Perf: trivial.
Complexity: high (easy to get black point / hue wrong, hard to verify on-device).

### 2.2 Color grading on top of the operator

- **Effect-based grade (current path).** `HueSaturation` + `BrightnessContrast` as merged
  `postprocessing` effects — what `Effects.jsx` runs. Cheap (folds into one fullscreen pass), live,
  enough for warmth + crushed blacks. The limit: it's a global linear-ish grade, so it can't do a
  *targeted* look (e.g. "lift only the ember midtones, cool only the deep shadows").
- **3D LUT grading (`LUTPass` / `LUT3DEffect`).** A `.cube` 32³ or 64³ lookup applied after render,
  before/after bloom depending on intent. This is how you bottle a **single authored "forge look"**:
  grade one reference frame in Resolve/Photoshop, export a `.cube`, and the whole world snaps to that
  mood for one texture-fetch per pixel. 2025 guidance: normalize to linear before the LUT, prefer
  KTX2/compressed LUT textures, and you can **cross-fade two LUTs by a uniform** for per-route mood
  (the channel-hall runs cooler-iron, the forge-mouth runs hotter). The cost is one 3D texture sample;
  the risk is baking the *wrong* black point into the LUT and crushing/raising the void.
- **TSL node grade (WebGPU).** The False-Earth and Shader.se 2026 Codrops pipelines build the entire
  grade (CA → vignette → bloom → tone map) as a node graph on the WebGPU renderer, with tone mapping
  as the terminal node. Renderer-agnostic in principle, but it's a renderer swap for us — Phase 2.

### 2.3 OLED-specific concerns (the part most demos miss)

- **Banding & dither.** 8-bit output across a dark void→crimson gradient on a true-black panel shows
  stair-stepping the eye locks onto. The fix (frost.kiwi 2025; Codrops Bayer-dithering Jul-2025;
  Heckel's dithering write-up 2025) is to add **sub-LSB noise (~±0.5/255) before quantization** so the
  hardware rounds stochastically and the band edges dissolve. **Triangular-PDF / blue-noise** dither
  is perceptually cleaner than flat white noise; an animated film-grain pass doubles as this dither
  for free. This is *the* OLED quality lever for GAELWORX's dark gradients.
- **Black point discipline.** Whatever operator you pick, the void must map to **exactly 0** after
  grade so the OLED pixels switch fully off. ACES toe gets close; AgX/Neutral can leave a lifted
  floor that must be crushed with `BrightnessContrast.brightness < 0`.
- **Gamut / clipping.** The P3-capable OLED will happily show a more saturated red than sRGB, but
  three.js outputs sRGB and the warm primaries still clip if pushed past 1.0 post-tonemap; AgX's
  desaturating rolloff is the cheapest insurance against red clipping to a flat plateau.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Switch the hero/high+low tiers from ACES Filmic to AgX, keep tone mapping on the renderer flag
(not a pass), restore brutalist punch with the existing effect grade, add a forge-look 3D LUT as an
optional high-tier layer, and make the film grain do double duty as OLED triangular dither. Keep
Khronos Neutral as the static-tier floor and as the color-accuracy reference.** Justification, tied
to the world and the hard constraints:

1. **AgX's path-to-white *is* the divine-fire brief.** The single most important visual in the world
   is the white-gold A/E that "stay unearthly forever and radiate onto stone." AgX bleaches hot warm
   content to a hue-stable white-gold; ACES skews it orange-then-clip. AgX makes the divine fire read
   as *sacred light*, not *bright paint*. It also stops the cooling-letter blackbody ramp from being
   contaminated by ACES's brightness-driven hue drift — temperature, not exposure, should move the
   hue. This directly serves docs 02 (blackbody) and 04 (emissive HDR).

2. **It protects the brand red from clipping.** Celtic Blood and Ember Glow are the whole palette.
   ACES can flatten a bright red into an orange plateau; AgX desaturates the *path* so the red stays
   red until it genuinely goes white. On the P3 OLED this is the difference between "vivid red" and
   "clipped salmon."

3. **The flatness cost is already solvable with what we have.** AgX reads soft by default; the
   `post-fx` chain already crushes blacks (`BrightnessContrast b −0.04, c 0.16`) and warms
   (`HueSaturation +0.12`). We simply *re-tune* those for AgX (more contrast, slightly more
   saturation) instead of for ACES — no new pass, no new cost. This is the lowest-risk way to get
   AgX's highlights *and* brutalist punch.

4. **Renderer-flag tone mapping, not a pass.** doc 20 already established: tone-map **once**. Keep
   `gl.toneMapping = AgXToneMapping` on the `Canvas`; do **not** also add a `ToneMapping` effect (that
   double-grades, washes blacks, over-saturates fire). The LUT and effect-grade run *before* the
   renderer's final tone map is misleading — so the cleanest mental model is: render linear HDR → LUT
   (linear-in/linear-out look) → effect grade → renderer applies AgX + sRGB at output. If we later
   want LUT to act on tone-mapped color, move tone mapping into a terminal pass and set
   `gl.toneMapping = NoToneMapping`. Phase-1 default: renderer flag, no pass, LUT before grade.

5. **Khronos Neutral as the static floor + truth meter.** On the static/reduced tier there is no
   post; the renderer tone map is all there is. Neutral gives the *most accurate* palette with zero
   drama-debt and is a great no-post floor. It's also the operator to flip to for one frame to verify
   our brand red is actually `#C1292E` and AgX/grade aren't lying.

**Net Phase-1 deliverable:** `gl.toneMapping = THREE.AgXToneMapping` (renderer), re-tuned
`BrightnessContrast`/`HueSaturation` for AgX, an optional high-tier `LUT` effect carrying the authored
forge look with per-route cross-fade, and grain re-cast as triangular OLED dither that never drops
below the banding-kill threshold even on low tier. WebGPU/TSL custom-node tone mapping is Phase 2.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (already in repo) — provides `THREE.AgXToneMapping`, `THREE.NeutralToneMapping`,
  `THREE.ACESFilmicToneMapping`, `THREE.CustomToneMapping`. No upgrade needed.
- `postprocessing` (pmndrs) + `@react-three/postprocessing` — already imported. Provides
  `ToneMapping` (with `ToneMappingMode.AGX | ACES_FILMIC | NEUTRAL`) and `LUT` (`LUT3DEffect`,
  `LUTCubeLoader`). No new dep for tone mapping; the LUT path uses `LUTCubeLoader` already shipped in
  the lib.
- Leva (present) for `?debug` live A/B of operators and grade knobs.

### 4.2 Operator swap on the Canvas (the core change)

In `src/scene/ForgeCanvas.jsx`, change one line:

```jsx
import * as THREE from 'three'
// ...
<Canvas
  gl={{
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    toneMapping: THREE.AgXToneMapping,   // was ACESFilmicToneMapping
    toneMappingExposure: 1.0,            // AgX is exposure-sensitive — expose, then grade
  }}
  // ...
>
```

> `toneMappingExposure` is the cleanest global "hotter/cooler whole world" knob and is honored by
> every built-in operator. Drive it (gently) from the master temperature bus for a unified
> "the forge runs hot" beat — see 4.5.

### 4.3 Re-tuned grade + optional forge LUT (evolution of `Effects.jsx`)

AgX needs contrast/saturation added back; the LUT is the authored look; grain becomes dither.

```jsx
import {
  EffectComposer, Bloom, ChromaticAberration, HueSaturation,
  BrightnessContrast, Vignette, Noise, SMAA, LUT,
} from '@react-three/postprocessing'
import { BlendFunction, LUTCubeLoader } from 'postprocessing'
import { useLoader, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { forge } from '../store.js'

export default function Effects({ quality }) {
  const high = quality === 'high'
  // Authored "forge look" .cube — graded once in Resolve, exported 32³, served from /public.
  // Optional: only loaded on the high tier (one 3D texture in VRAM).
  const forgeLUT = high ? useLoader(LUTCubeLoader, '/luts/forge-look.cube') : null
  const bloom = useRef()

  useFrame(() => {
    if (bloom.current) {
      const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3), 1)
      bloom.current.intensity = (high ? 0.9 : 0.6) + heat * 0.5
    }
  })

  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3}
             intensity={high ? 0.9 : 0.6} radius={0.8} />
      {high && (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />
      )}
      {/* AUTHORED FORGE LOOK — bottle the warm grade once. High-tier only. */}
      {forgeLUT && <LUT lut={forgeLUT.texture3D} tetrahedralInterpolation />}
      {/* Re-tuned for AgX: AgX is softer/flatter than ACES, so add contrast + a touch more
          saturation, and crush the floor so the OLED void stays true-black. */}
      <HueSaturation saturation={0.18} />                       {/* was 0.12 (AgX desat) */}
      <BrightnessContrast brightness={-0.05} contrast={0.22} /> {/* was -0.04 / 0.16     */}
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      {/* GRAIN = OLED TRIANGULAR DITHER. Never below ~0.03 even on low — it kills banding
          in the deep void→crimson gradient on the true-black panel. */}
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT}
             opacity={high ? 0.05 : 0.04} />
      {high && <SMAA />}
      {/* NO <ToneMapping> pass — tone mapping is owned by gl.toneMapping (AgX). */}
    </EffectComposer>
  )
}
```

### 4.4 Per-route LUT cross-fade (optional, high tier)

A second LUT + a blend uniform gives each chamber a mood without rebuilding the look:

```jsx
// pseudocode — drive a blend between a "base forge" and a "hot/cool" route LUT
const t = sceneFor(forge.route).lutWarm        // 0 = base, 1 = hotter (forge-mouth)
// LUT3DEffect supports a blend amount; cross-fade by lerping the effect's `blendFunction`
// opacity or by stacking two LUT effects and damping their opacities with `damp(...)`.
```

This is the grade-side analogue of the per-route `veinGlow`/`irid` presets `ObsidianSlab` already
reads from `scenes.js` — add `lutWarm` to each route preset and damp it on route change exactly like
`uIrid` (dt-damped, so navigation re-tempers the grade smoothly, honoring Brutalist-Snap-not-bounce).

### 4.5 Hooking the master temperature system

The world's energy bus (`store.js`: `forge.scrollDamped`, `forge.scrollVel`, `forge.strikeAt`) already
drives `ObsidianSlab` (`uVeinGlow`/`uTemp`/`uSurge`) and bloom (doc 20). The **grade** joins the same
bus on two cheap scalars:

```jsx
useFrame(() => {
  const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3), 1)
  // (1) global exposure ride — the whole frame runs hotter into AgX's rolloff
  gl.toneMappingExposure = 1.0 + heat * 0.12        // subtle; AgX is exposure-sensitive
  // (2) saturation ride — fire gets a hair richer when the forge surges
  hueSat.current.saturation = 0.18 + heat * 0.06
})
```

Now `uTemp` (material emissive), bloom `intensity`, `toneMappingExposure`, and grade saturation all
rise from the **same `heat` scalar** — the forge "runs hot" as one coherent system, which is doc 20's
deep-dive #4 ("temperature-coupled post as a world bus") realized on the grade side. Keep the rides
*subtle* (exposure ±0.12 max) so it never reads as auto-exposure pumping.

### 4.6 Authoring the `.cube` (so it's reproducible)

1. Capture a reference frame of the forge at "hot" (high vein glow) in the running app (high tier,
   AgX on, no LUT).
2. Grade in Resolve/Photoshop **toward the palette**: deepen the void to pure black, push the reds
   toward `#C1292E`, warm the ember midtones toward `#E85D04`, keep the white-gold A/E from going
   pink. Do **no** highlight rolloff in the LUT (AgX already did it) — the LUT is *hue/sat/contrast*,
   not tone curve.
3. Export 32³ `.cube`, drop in `/public/luts/forge-look.cube`. Verify the black point: sample the LUT
   at `(0,0,0)` → must return `(0,0,0)`.

---

## 5. COHESION — shared palette, lighting, uniforms

- **Palette is preserved, not overridden.** AgX + grade + LUT must *land on* the Industrial-Metallurgy
  hexes, never invent new ones: void `#0B0C10`→ crushed to true black, Celtic Blood `#C1292E`,
  Ember Glow `#E85D04`, Fog White `#F1F2F6` for the divine-fire peak. The `PAL` HDR convention from
  `palette.js` (only `PAL.hot`/`PAL.emberHot` exceed 1.0) is *why* tone mapping matters: those >1
  values are the only ones the operator has to roll off, and AgX rolls them to white-gold — exactly
  the divine-fire color. The 60% void / 30% deep-crimson stay sub-1 and are mapped ~1:1.
- **No cool/green/blue ever enters the grade.** Brand law. The basalt's green-black lives in the
  *material* (doc 05), never in the post grade; the LUT must not tint shadows cool. The grade stays
  warm-only.
- **One operator, every chamber.** The same AgX flag + same base LUT runs across all route-swapped
  chambers (scrying-pool, casting-room, channel-hall, jewel-chamber, altar, ledger, plinths,
  forge-mouth). Per-route mood is the *cross-fade amount* on the LUT (4.4), not a different operator —
  so nothing looks bolted-on; it's one graded world breathing at different temperatures.
- **Shares the temperature bus** with material emissive and bloom (4.5) — the unifying spine of the
  whole world's "runs hot" behavior.
- **Wordmark/3D parity.** The DOM `.forge-letter` gradient
  (`#E85D04→#C1292E→#E34A27→#C0392B`) and the 3D molten letterforms must read as one material. The
  LUT should be authored so the 3D forge-red *matches* that CSS ramp on the OLED — sample both
  side-by-side on the device.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Tone mapping is free.** AgX, ACES, and Neutral are all analytic per-pixel math folded into the
  final output stage; swapping ACES→AgX is a **zero-cost change**. No reason not to take the better
  operator.
- **The grade is already merged.** `HueSaturation` + `BrightnessContrast` + `Vignette` + `Noise` +
  `ChromaticAberration` compile into **one** `EffectPass` fragment shader (pmndrs merge). Re-tuning
  their *values* costs nothing extra. Keep them as `Effect`s, never standalone passes.
- **LUT cost = one 3D texture sample/pixel** + the VRAM for a 32³ texture (~98 KB). Gate it
  **high-tier only** (as the snippet does). A 32³ LUT is plenty for a warm grade; reserve 64³ for if
  you see banding in the LUT itself (you won't, with grain on). Ship it KTX2-compressed if load time
  matters. `tetrahedralInterpolation` removes LUT-grid artifacts for ~free.
- **Grain pulls double weight.** It's already in the budget; re-casting it as the OLED dither means it
  *earns* its cost. Hold it at `≥0.03` on **all** non-static tiers — dropping it reintroduces banding
  on the panel that matters. This is the one param that must not be tuned away for perf.
- **Static / reduced tier.** `<Effects>` is unmounted (ForgeCanvas gates it) → no LUT, no grade, no
  grain, `frameloop='demand'`. The **renderer tone map is the floor** — and here flipping to
  **`THREE.NeutralToneMapping`** for the static tier gives the most accurate palette with the least
  drama-debt for a no-post frame (optional refinement; AgX is also fine). Verify the no-post frame
  still reads on-brand and true-black.
- **Exposure ride is a uniform write**, not a shader recompile — compositor-safe, per `motion-feel`.
- **OLED banding is the real mobile *quality* risk, not framerate.** The deep gradients band; grain
  fixes it. Budget for grain accordingly.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (sequential — each unblocks the next):**

1. **Swap the operator first, look at it raw.** Set `gl.toneMapping = AgXToneMapping`, *temporarily
   remove the grade*, and read the bare AgX frame on the iPhone. It will look soft and slightly milky
   — that's expected; you're confirming the *highlights* (A/E path-to-white, red-not-clipping) are
   right before adding punch.
2. **Re-crush the black point.** AgX/Neutral can leave a lifted floor. Pull `BrightnessContrast.brightness`
   negative until the void is **pixels-off black** on the OLED (it won't look right on the laptop).
   This is the OLED-specific step the laptop will mislead you on.
3. **Add contrast + saturation back.** Bump `contrast`→~0.22 and `saturation`→~0.18 to restore the
   brutalist punch AgX flattens. Stop when the red is vivid but the white-gold A/E hasn't gone pink.
4. **Bake the LUT last.** Only after the live grade looks right, capture+grade a reference frame into a
   `.cube` so the look is reproducible and per-route cross-fadeable. Verify LUT `(0,0,0)→(0,0,0)`.
5. **Tune grain on the device.** Raise `Noise.opacity` until the void→crimson banding disappears on
   the panel, then back off to the lowest value that still hides it (~0.03–0.05). Never zero.
6. **Wire the temperature ride absolutely last**, gently, on a known-good static grade.

**Specific pitfalls:**
- **Double tone mapping.** Renderer flag *and* a `ToneMapping` pass = washed blacks + over-saturated
  fire. Pick one; Phase-1 = renderer flag only, **no** `ToneMapping` effect.
- **Grading on the laptop sRGB panel.** Black point, banding, and red saturation **do not simulate**
  off the iPhone-15 OLED. `qa-route` (0 console errors) only proves it *compiled*; the grade is a
  *device read*. Tune on the phone.
- **Leaving ACES's grade values under AgX.** The current `b −0.04 / c 0.16 / sat 0.12` are tuned for
  ACES; under AgX they read flat. Re-tune (step 3) — don't just swap the operator and ship.
- **Baking a tone curve into the LUT.** AgX already rolled the highlights; a LUT that *also* curves
  them double-rolls → dull, dead highlights. LUT = hue/sat/contrast only.
- **LUT raising the black floor.** A grade authored on a laptop often lifts shadows; on OLED that's a
  grey haze. Force the LUT black point to zero.
- **Killing grain for perf.** Reintroduces OLED banding on the hero gradients. Hold `≥0.03`.
- **Over-driving the exposure ride.** ±0.12 max, or it reads as cheap auto-exposure pumping, breaking
  Brutalist-Snap.
- **AgX availability.** It's in three.js core (r17x) and pmndrs `ToneMappingMode.AGX`; confirm the
  pinned versions expose it before relying on it (an older `postprocessing` may lack `AGX`). If a tier
  lacks AgX, fall back to ACES with the *original* grade values, not the AgX-tuned ones.

---

## 8. SOURCES (2025–2026)

1. **three.js forum — "Tone Mapping Overview" (Shade project research thread)** (2025). Side-by-side
   ACES vs AgX vs Neutral vs Reinhard behavior, the ACES hue-shift / washed-saturation problem, and
   when each operator is appropriate. https://discourse.threejs.org/t/tone-mapping-overview/75204
2. **three.js forum — "Is AGX tonemapping implemented correctly?"** (2025). AgX in three.js vs
   Blender; flatness/contrast caveats and exposure sensitivity; the practical "add contrast back"
   guidance. https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609
3. **three.js forum — "Pmndrs Post Processing: Tone Mapping guidance" (incl. donmccurdy reply)**
   (2025). Where the `ToneMapping` effect belongs in the pmndrs chain, ordering with bloom, and the
   "tone map once" / luminanceThreshold interaction.
   https://discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374
4. **react-postprocessing docs — `ToneMapping` effect** (pmndrs, current 2025–2026). `ToneMappingMode`
   values (incl. `AGX`, `ACES_FILMIC`, `NEUTRAL`), props, terminal-pass usage.
   https://react-postprocessing.docs.pmnd.rs/effects/tone-mapping
5. **Codrops — "Interactive WebGL Backgrounds: A Quick Guide to Bayer Dithering"** (2025-07-30).
   Ordered/Bayer dither in GLSL to remove banding in dark gradients/backgrounds; the sub-LSB noise
   principle that fixes OLED gradient banding.
   https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/
6. **Maxime Heckel — "The Art of Dithering and Retro Shading for the Web"** (2025). Blue-noise vs
   Bayer vs white-noise dither in WebGL, perceptual quality, and shader implementation — the basis for
   grain-as-dither against banding. https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/
7. **frost.kiwi — "How to (and how not to) fix color banding"** (2025). Why 8-bit gradients band, the
   correct noise amplitude (~1/255) and triangular-PDF dither, and the GLSL pattern — directly
   applicable to the void→crimson OLED gradient. https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/
8. **Khronos — "PBR Neutral Tone Mapping" (model-viewer docs)** (2024–2025, maintained). The Neutral
   operator: 1:1 up to a threshold, `−0.04` saturation correction, hue preservation, e-commerce
   accuracy use-case. https://modelviewer.dev/examples/tone-mapping
9. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** (2026). Current
   post-processing pipeline guidance incl. tone-mapping operator selection, grade ordering, and the
   WebGPU/TSL direction. https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
10. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Ming Jyun Hung,
    2026-04-21). TSL node-graph post chain with tone mapping as the terminal node; the WebGPU grading
    direction for a future migration.
    https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
11. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026-01-12). Mobile
    post-processing perf rules (prefer pmndrs, merged passes, mediump on mobile, frameloop=demand for
    static, dispose render targets). https://www.utsubo.com/blog/threejs-best-practices-100-tips
12. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). WebGPU/iOS Safari coverage,
    porting post-processing to TSL nodes (incl. tone-mapping nodes) — the Phase-2 custom-operator path.
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Custom AgX-derived tone-mapping node (TSL/WebGPU).** Author a GAELWORX operator: AgX's
   path-to-white with brand-baked contrast and a guaranteed-zero black point, as a `ToneMappingNode`
   so it works on both renderers — removing the "AgX-then-re-grade" two-step and the double-grade
   risk entirely.
2. **OLED dither pipeline: blue-noise vs triangular grain vs Bayer.** A measured comparison on the
   iPhone-15 panel of which dither most cleanly removes void→crimson banding at the lowest opacity,
   including animated-blue-noise texture vs procedural grain cost, and whether to dither in linear or
   display space.
3. **Per-route LUT mood system as a world bus.** Formalize a `lutWarm` (and maybe `lutCool` guard)
   per-route preset in `scenes.js`, dt-damped on navigation, cross-fading authored `.cube` looks so
   each chamber has a graded temperature — wired to the same `heat` scalar as emissive/bloom/exposure.
4. **HDR display output (P3 / Canvas HDR).** Whether to emit a true HDR signal to the iPhone-15's
   HDR-capable OLED (extended-range canvas, `drawingBufferColorSpace`/P3) so the divine fire and pour
   front actually exceed SDR white on-panel — the highest-ceiling, highest-risk upgrade for "real heat."
