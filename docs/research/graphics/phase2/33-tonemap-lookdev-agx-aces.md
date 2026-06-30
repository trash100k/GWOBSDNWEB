# 33 — Tone-Map Look-Dev: AgX vs ACES vs Custom Forge Curve, on Device

_Phase-2 deep-dive · GAELWORX forge world · cluster E-light-finish-arch · target: iPhone 15 OLED, single WebGL renderer_

> **The question this doc closes.** Phase-1 doc 04 (Emissive HDR) concluded "keep ACES Filmic — its
> white-out *is* the white-hot, and its desaturation-toward-white *is* the cooling gradient, for free."
> Phase-1 doc 21 (Color Grading & OLED) concluded "switch to AgX — its hue-stable path-to-white serves
> the divine-fire A/E and protects Celtic Blood from clipping to flat salmon on the P3 OLED." The
> Cohesion Map (§3.2) deferred the conflict explicitly: _"the two color-science docs reach different
> default operators; the resolution is that the operator is a Phase-2 look-dev A/B on the device."_ This
> is that A/B. It builds the side-by-side **on the molten ramp specifically**, runs the per-channel
> hue-shift analysis for orange, and specifies a CDL/grade pass that locks the void to true black
> without crushing the orange shoulder. It is the operator decision of record for cluster E. It does not
> re-open the post-chain order (doc 20), the dither choice (doc 21 §2.3 / deep-dive #2), or the LUT
> system (doc 21 §4.4) — it owns **the transfer function on `gl.toneMapping`** and the grade that must
> be re-tuned to it.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX has exactly one tone-map (Cohesion Map rule 7: "one operator on the renderer, the grade
re-tuned to it, no pass"). That single operator is the last thing that touches every glowing pixel in the
world before it hits the OLED, so it is not a finishing nicety — it is **the physics that turns a linear
radiance number into the color of fire**. Three classes of content pass through it, and the operator's
behavior on each is the entire decision:

1. **The cooling molten ramp** — the `gw_tempColor`/`gw_forge` output (Cohesion Map §1.1) marching
   `temp ∈ [0,1]` from iron-black `#0B0C10` → dull red → Celtic Blood `#C1292E` → Ember Glow `#E85D04` →
   gold → white-hot. Only the top ~10% band (`PAL.hot`, `gold`, `emberHot`) exceeds 1.0. The operator
   decides whether the cooling tail reads as a clean blackbody march or as a brightness-contaminated hue
   smear, and whether the hot core whites-out believably.
2. **The divine-fire A/E** — `gw_divineFire` (Cohesion Map §1.4), a locked white-gold HDR value
   (`PAL.divine`, well above 1.0, never cools) that must read as **sacred light, not bright paint**, and
   must **radiate onto stone** through its bloom halo. This is the single most narratively-loaded pixel in
   the build, and its on-screen color is owned by the operator's path-to-white.
3. **The deep-crimson 60/30/10 mass** — Celtic Blood at sub-1.0 levels filling 30% of the frame. The
   operator must not skew this toward orange/salmon as the forge surges and lifts its brightness, or the
   brand red drifts purely from exposure.

The OLED is the amplifier on both the upside and the failure. True `(0,0,0)` pixels-off black means the
fire detonates against infinite depth (the GAELWORX thesis), but it also means any operator that lifts the
shadow floor leaves a **visible grey haze** the panel can't hide in backlight bleed, and the dark
void→crimson gradient lives in the bottom ~5% of the 8-bit range where banding and hue error are most
visible. So the operator must (a) give a graceful, hue-stable highlight roll for the divine fire, (b) keep
the cooling march driven by temperature not exposure, (c) hold Celtic Blood as red, and (d) leave a floor
that grades cleanly to absolute zero. No single stock operator does all four; the deliverable is an
operator **plus** a CDL/grade lock tuned to it.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 The core mechanic: per-channel curve vs path-to-white

Every tone-map is a sigmoid that compresses HDR to display range. The make-or-break distinction —
clarified across the 2025–2026 darktable AgX docs, Chris Brejon's display-transform writeup, and the
three.js "Tone Mapping Overview" thread — is **where the curve is applied**:

- **Per-channel operators (ACES Filmic, Reinhard, naive sigmoid)** apply the S-curve independently to R,
  G, B. As a saturated color brightens, its channels saturate toward 1.0 at different rates, so its **hue
  shifts toward the nearest primary/secondary** before it reaches white. This is the **"Notorious Six"**:
  per-channel curves pull bright colors toward the six RGB cube corners — fires and sunsets skew **yellow**,
  blue lights skew magenta, skies skew cyan, and the skew is **stronger for brighter, more saturated
  pixels** (darktable AgX/sigmoid manuals, 2025; Brejon). For a forge this is double-edged: the
  yellow-skew on a heating orange is _coincidentally_ blackbody-plausible (real metal does go orange→yellow→white),
  which is exactly why doc 04 liked ACES. But the skew is driven by **brightness, not temperature** — so a
  Celtic-Blood letter that merely gets brighter under the pour shifts orange without getting hotter,
  contaminating the deliberate `gw_tempColor` ramp.

- **Path-to-white operators (AgX, Khronos Neutral)** rotate/compress the gamut _before_ the curve and
  restore _after_, so brightening colors **desaturate toward white while holding their hue**. AgX
  (Sobotka; Blender 4 default; shipped in darktable 5.4, Dec 2025) does this with an **inset** (gamut
  compression that slides out-of-gamut and highly-saturated triplets inward before the sigmoid), a
  per-channel sigmoid applied **in that compressed space** (so the Notorious Six is tamed, not eliminated,
  and remains _controllable_), and an **outset** that partially restores saturation afterward. The result
  is the "graceful path to white": a white-hot pour bleaches to **hue-stable white-gold** instead of
  snapping to a flat yellow-orange plateau (three.js Tone Mapping Overview, 2025; darktable AgX, 2025).

### 2.2 The four operators in three.js r17x (all on `gl.toneMapping`)

three.js ships these as renderer flags and as `@react-three/postprocessing` `ToneMappingMode.*` and TSL
nodes. All are analytic per-pixel and **identical in cost** — the choice is purely look, not perf.

**(a) `ACESFilmicToneMapping` — the current repo setting.** Punchy, contrasty, cinematic highlight roll;
its toe naturally crushes the void. **The forge-positive read (doc 04):** the white-out _is_ the
white-hot, and saturated reds living in the cooler halo/cooling-tail is physically correct. **The
forge-negative read (doc 21, and 2025 consensus):** built on Rec.709 primaries with a per-channel curve,
so it has the documented **"ACES makes everything orange"** hue drift on saturated warm content, and reads
**low-contrast / washed** on saturated textures (three.js forum "ACESFilmicToneMapping leading to
low-contrast textures"). A bright Celtic-Blood pixel skews orange→yellow purely from brightness. Quality:
high. Perf: trivial. Mobile: free.

**(b) `AgXToneMapping` — the 2025 challenger.** Hue-stable path-to-white (§2.1); the divine-fire and
red-protection win. **Cost:** globally **lower contrast and lower saturation** out of the box — "a
low-contrast starting point for grading, comparable to shooting flat" (three.js #60609; e-commerce users
report it "flattens the image like an auto-LDR HDR, every color becomes a tone of grey"). Slightly
**exposure-sensitive** and can **lift deep shadows** in some implementations — on a true-black OLED that's
a grey void unless re-crushed. The flatness is _recoverable_ with contrast/saturation in the grade; the
hue stability is _not recoverable_ from ACES. This asymmetry is the crux of the decision. Quality:
best-in-class highlights. Perf: trivial. Mobile: free. Complexity: low to swap, medium to re-grade.

**(c) `NeutralToneMapping` (Khronos PBR Neutral).** 1:1 up to a threshold, compresses only highlights, a
deliberate `−0.04` saturation shift, **no hue shift** — engineered for product-color accuracy under
grayscale light. The most _accurate_ "the red is exactly `#C1292E`", the least _dramatic_ (it refuses to
blow the core to white — the opposite of what a forge core wants). Its role here is the **truth-meter**
(flip to it for one frame to verify the brand red and that AgX/grade aren't lying) and the **static-tier
floor** where accuracy-with-minimum-drama is correct for a no-post frame.

**(d) `CustomToneMapping` + GLSL (or a TSL `ToneMappingNode`).** Inject your own curve. The pragmatic
2025–2026 move (per the three.js custom-operator issues #26661/#27362) is **not** to invent a curve from
scratch but to either (i) run AgX as the renderer flag and shape with a CDL/grade, or (ii) bake an
AgX-derived curve with brand contrast/black-point pre-rolled into a `CustomToneMapping` shader. Full
from-scratch curves are easy to get wrong (black point, hue) and hard to verify on-device. We use the
custom slot only as the _packaging_ of AgX-plus-CDL once the look is locked (§4.5), never as a novel curve.

### 2.3 The CDL/grade layer on top (the under-used lever)

The operator alone cannot lock the void to absolute zero _and_ preserve the orange shoulder — those pull in
opposite directions (a global contrast push that crushes black also steepens the shoulder and dulls the
ember). The clean separation, standard in film and now in real-time engines, is **ASC CDL** (Filament
added it to its grade in PR #2635; it's natively hardware-accelerated in Resolve and every NLE, 2025
sources). CDL is `out = (slope · in + offset)^power`, then a saturation term, applied **per-channel** with
**Slope → Offset → Power (SOP) → Saturation** ordering:

- **Slope** (≈ gain) scales — the contrast/exposure of the highlights and the overall punch AgX flattened.
- **Offset** (≈ lift) shifts the whole curve — the **black-point lock**: a tiny _negative_ offset pulls the
  AgX-lifted floor to true zero **without** changing the shoulder, which a global contrast push cannot do.
- **Power** (≈ gamma) bends the mid — recovers the ember midtone richness AgX desaturates, _selectively_,
  without lifting black.
- **Saturation** (CDL 1.2, applied last) — the global +sat that restores brutalist vividness to the red.

The decisive property: CDL gives **three independent handles on three different parts of the curve**
(black via offset, mid via power, highlight via slope), where a single `BrightnessContrast` gives only two
coupled global ones. That is exactly what "lock the void true-black without crushing the orange shoulder"
requires. We do not need a full DCC round-trip — a nine-plus-one-number CDL is a handful of uniforms and
folds into the existing merged grade pass for free (§4).

### 2.4 The WebGPU/TSL direction (Phase 3, noted not adopted)

The 2026 Codrops pipelines (False-Earth, 2026-04-21; Shader.se 80s-tech, 2026-05-19) and the three.js
RenderPipeline build the whole grade — including tone mapping — as a **terminal TSL node** on
`WebGPURenderer` with automatic WebGL2 fallback. A custom AgX-plus-CDL `ToneMappingNode` would run
identically on both renderers and remove the "operator-then-re-grade" two-step. This is the natural home
for the locked look (deep-dive #1) but is a renderer migration we explicitly defer past the judge device
(Cohesion Map §10 hard constraint: WebGL2 + `onBeforeCompile` ships to the judge). The industry signal is
clear, though: AgX-over-ACES is the 2026 default direction (the game _Veil of Ashes_ replaced Unreal's ACES
with AgX in Feb 2026 to end "the constant battle against unnatural colors, washed-out highlights, and
crushed blacks"), and Blender 5.0 / ACES 2.0 is a parallel track — both vindicate moving off classic ACES
Filmic for a saturated-warm world.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Run `THREE.AgXToneMapping` on the renderer flag for the `high` and `low` tiers, lock the look with a
warm-only ASC-CDL grade tuned to AgX (slope for punch, negative offset for the true-black void, power for
the ember shoulder, saturation for the red), keep `THREE.NeutralToneMapping` as the static-tier floor and
the color truth-meter, and reserve `THREE.ACESFilmicToneMapping` (with its _original_ grade values) only
as the pinned-version fallback if AgX is unavailable.** This resolves doc-04-vs-doc-21 in favor of doc 21's
operator, but it adopts doc 04's _concern_ — that the cooling white-out and the orange shoulder must
survive — as the explicit job of the CDL pass. Justification:

1. **The conflict is asymmetric, and that breaks the tie.** AgX's flatness is fully recoverable in the
   grade (slope + saturation); ACES's brightness-driven hue drift is **not** recoverable downstream —
   once orange has skewed from a per-channel curve, no grade un-skews it cleanly. You can always add
   contrast to a hue-correct image; you cannot subtract a hue error. So the operator that preserves the
   _information_ (AgX) wins, and the grade restores the _look_.

2. **The molten ramp wants temperature-driven hue, and AgX delivers it.** `gw_tempColor` already encodes
   the white→orange→red→black march as _color_ (Cohesion Map §1.1). With AgX, brightness changes
   (scroll surge, bloom feed) desaturate toward white-gold and **hold hue** — so the only thing that moves
   hue is `temp`, which is the brief. With ACES, a brightness surge skews the ramp orange independently of
   `temp`, double-driving the hue and muddying the deliberate stops. **The ramp is authored once and read
   correctly under AgX; under ACES it is read through a brightness-dependent distortion.**

3. **AgX _is_ the divine-fire brief.** The white-gold A/E (`gw_divineFire`, well above 1.0) bleaches to
   hue-stable white-gold under AgX — sacred light. Under ACES the same value skews orange-then-clips to a
   flat hot plate. Doc 04's own §7 pitfall 8 ("divine fire doesn't radiate onto stone") is partly an ACES
   artifact: a hue-stable bright white-gold reads as a light source; an orange-clipped one reads as paint.

4. **The orange shoulder is exactly what AgX risks dulling — and exactly what CDL fixes.** The single real
   cost of AgX here is that the Ember-Glow `#E85D04` shoulder (the 10% accent, the warmth of the whole
   world) goes flat/milky. A global contrast push to fix it would crush the void. The CDL **power** handle
   bends the mid back up _without_ touching the offset-locked black point — this is precisely the
   "lock true-black without crushing the orange shoulder" requirement, and it is unachievable with a single
   global contrast.

5. **Zero perf cost; reversible.** Operator swap is one enum on the Canvas; the CDL folds into the existing
   merged `EffectPass` (doc 21 §6); Neutral fallback and ACES fallback are one-line guards. Nothing here
   touches the budget (Cohesion Map §10).

**Net deliverable:** `gl.toneMapping = THREE.AgXToneMapping`; a `ForgeGradeCDL` effect (one merged-pass
fragment) carrying SOP+sat tuned to AgX with offset locked to true-black; Neutral on `static`; ACES as the
availability fallback; all of it tuned **on the iPhone-15 OLED**, not the laptop.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (in repo) — `THREE.AgXToneMapping`, `THREE.NeutralToneMapping`, `THREE.ACESFilmicToneMapping`,
  `THREE.CustomToneMapping`. No upgrade. (If the pinned build predates the AgX flag, see 4.6.)
- `postprocessing` (pmndrs) + `@react-three/postprocessing` (in repo) — `ToneMappingMode.AGX|NEUTRAL|ACES_FILMIC`,
  and the `Effect` base class for the custom CDL effect. No new dep.
- Leva (`?debug`) for the live operator A/B and CDL knob sliders — this look-dev is a _device_ tuning loop,
  so the panel is the tool.

### 4.2 The operator swap (the core one-line change, on the Canvas)

In `src/scene/ForgeCanvas.jsx`:

```jsx
import * as THREE from 'three'
// ...
const TONEMAP = {
  high:   THREE.AgXToneMapping,
  low:    THREE.AgXToneMapping,
  static: THREE.NeutralToneMapping,   // accuracy floor, no-post tier
}
<Canvas
  gl={{
    antialias: true, alpha: false, powerPreference: 'high-performance',
    toneMapping: TONEMAP[quality] ?? THREE.AgXToneMapping,   // was ACESFilmicToneMapping
    toneMappingExposure: 1.0,         // AgX is exposure-sensitive: expose to taste, then grade
  }}
/>
```

Tone mapping stays on the **renderer flag**, never also a `<ToneMapping>` pass (double-grade washes blacks,
over-saturates fire — Cohesion Map §3.2, doc 21 pitfall). `react-postprocessing` disables three's internal
tonemapping in the composer and re-applies the renderer operator at output, so the CDL effect runs
**before** the operator in the pipeline math — which is correct: we grade the linear-ish scene, AgX rolls
the highlights last.

### 4.3 The ASC-CDL grade effect (the look-lock, AgX-tuned)

A tiny `Effect` subclass implementing SOP+sat. This replaces the role of the loosely-coupled
`BrightnessContrast`+`HueSaturation` for the _structural_ black-lock and shoulder, while the existing
`HueSaturation`/`Vignette`/`Noise`/`Bloom` stay as-is. SOP+sat ordering per ASC CDL 1.2:

```glsl
// ForgeGradeCDL.frag — ASC CDL: out = (slope*in + offset)^power, then saturation. Warm-only.
uniform vec3  uSlope;     // per-channel gain  (punch AgX flattened) e.g. (1.06,1.02,0.98)
uniform vec3  uOffset;    // per-channel lift  (BLACK-POINT LOCK)    e.g. (-0.012,-0.012,-0.014)
uniform vec3  uPower;     // per-channel gamma (ember shoulder)      e.g. (0.94,0.96,1.00)
uniform float uSat;       // global saturation (brutalist red)       e.g. 1.16

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec3 c = inputColor.rgb;
  // SOP — slope, then offset, then power (per-channel). Clamp base >=0 before pow.
  c = c * uSlope + uOffset;
  c = pow(max(c, 0.0), uPower);
  // Saturation (CDL 1.2) — luma-preserving, Rec.709 weights. Applied LAST.
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, uSat);
  // Hard true-black floor for the OLED: anything that grades below ~1 LSB snaps to absolute 0.
  c = max(c - 0.0008, 0.0);          // guarantees pixels-off void; offset already did the heavy lift
  outputColor = vec4(c, inputColor.a);
}
```

```jsx
// ForgeGradeCDL.jsx — wraps the frag as a pmndrs Effect, drei-style
import { Effect } from 'postprocessing'
import { Uniform, Vector3 } from 'three'
import { forwardRef, useMemo } from 'react'
import frag from './ForgeGradeCDL.frag?raw'

class ForgeGradeCDLEffect extends Effect {
  constructor({ slope, offset, power, sat }) {
    super('ForgeGradeCDL', frag, {
      uniforms: new Map([
        ['uSlope',  new Uniform(new Vector3(...slope))],
        ['uOffset', new Uniform(new Vector3(...offset))],
        ['uPower',  new Uniform(new Vector3(...power))],
        ['uSat',    new Uniform(sat)],
      ]),
    })
  }
}
export const ForgeGradeCDL = forwardRef(function ForgeGradeCDL(p, ref) {
  const fx = useMemo(() => new ForgeGradeCDLEffect(p),
    [p.slope, p.offset, p.power, p.sat])
  return <primitive ref={ref} object={fx} dispose={null} />
})
```

Mounted in `Effects.jsx` **after Bloom, before the grain/SMAA**, replacing the `BrightnessContrast`
structural role (keep `HueSaturation` only if you want a separate warm hue push; CDL `uSat` already covers
saturation):

```jsx
<EffectComposer disableNormalPass frameBufferType={HalfFloatType} multisampling={high ? 2 : 0}>
  <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3}
         intensity={high ? 0.9 : 0.6} radius={0.8} />
  {high && <ChromaticAberration offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />}
  {forgeLUT && <LUT lut={forgeLUT.texture3D} tetrahedralInterpolation />}{/* doc 21, optional hi-tier */}
  <ForgeGradeCDL ref={cdl}
    slope={[1.06, 1.02, 0.98]}            // warm gain: lift R/G a hair, hold B → no cool cast
    offset={[-0.012, -0.012, -0.014]}     // negative lift = AgX floor pulled to true black
    power={[0.94, 0.96, 1.00]}            // <1 on R/G brightens the ember mid (shoulder rescue)
    sat={1.16} />                          // brutalist red, restores AgX desat
  <Vignette eskil={false} offset={0.22} darkness={0.96} />
  <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.04} />
  {high && <SMAA />}
  {/* NO <ToneMapping> pass — AgX is owned by gl.toneMapping */}
</EffectComposer>
```

### 4.4 Hooking the shared master temperature system

The grade joins the world's energy bus (Cohesion Map §1.5 / §4.2: the `U` pool + `<ForgeDriver/>`,
`heat = forge.scrollDamped + forge.scrollVel*0.25 + strike`) on three cheap scalars, so the operator and
grade "run hot" on the **same heartbeat** as `uTemp`, bloom, and emissive — the proof of cohesion is that a
strike surges them all in one frame (Cohesion Map rule 6):

```jsx
useFrame((_, dt) => {
  const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3)
                        + forge.strike, 1)
  // (1) global exposure ride into AgX's rolloff — subtle, ±0.12 max or it reads as auto-exposure pump
  gl.toneMappingExposure = THREE.MathUtils.damp(gl.toneMappingExposure, 1.0 + heat * 0.12, 4, dt)
  // (2) saturation ride — fire gets a hair richer on surge, via the CDL uSat
  const u = cdl.current.uniforms
  u.get('uSat').value = THREE.MathUtils.damp(u.get('uSat').value, 1.16 + heat * 0.06, 4, dt)
  // (3) slope ride — a touch more highlight punch when the forge detonates
  const s = u.get('uSlope').value
  const tgt = 1.06 + heat * 0.04
  s.set(THREE.MathUtils.damp(s.x, tgt, 4, dt), THREE.MathUtils.damp(s.y, tgt - 0.04, 4, dt), s.z)
})
```

Critically, **the `uOffset` black-lock is never rode by heat** — the void must stay pixels-off no matter
how hot the forge runs. Only slope/sat/exposure (the highlight and mid handles) breathe; the floor is
nailed. This is the §2.3 "three independent handles" property paying off: the surge can punch the highlights
without ever lifting black.

### 4.5 Optional: fold AgX+CDL into one `CustomToneMapping` (look-lock packaging)

Once the CDL numbers are locked on-device, they can be baked into a `CustomToneMapping` GLSL block so the
operator+grade is a single stage (and trivially portable to a TSL `ToneMappingNode` for the Phase-3 WebGPU
path, deep-dive #1). The shader is: AgX inset → per-channel sigmoid → AgX outset → SOP+sat → sRGB. This
removes the "grade-runs-before-operator" mental gymnastics (4.2) and guarantees the black-lock is _inside_
the tone-map. **Do this only after the look is final** — iterating CDL numbers live is far easier as a
separate effect with leva sliders. Phase-2 ships the separate-effect form; the custom-baked form is the
hardening step.

### 4.6 AgX availability fallback

```jsx
const AGX = THREE.AgXToneMapping ?? null
const toneMapping = AGX ?? THREE.ACESFilmicToneMapping
// If we fell back to ACES, swap the CDL preset to the ACES-tuned one (less slope, no shoulder rescue,
// the ORIGINAL doc-20/21 grade values) — do NOT run AgX-tuned CDL under ACES or it double-punches.
const cdlPreset = AGX ? CDL_AGX : CDL_ACES
```

---

## 5. COHESION — shared palette / lighting / uniforms

- **Lands on `PAL`, never invents color.** AgX+CDL must resolve to the Industrial-Metallurgy hexes: void
  `#0B0C10` crushed to true black, Celtic Blood `#C1292E`, Ember Glow `#E85D04`, the divine peak toward
  Fog White `#F1F2F6`. The `PAL` HDR convention (only `PAL.hot`/`emberHot`/`gold`/`divine` exceed 1.0) is
  _why_ the operator matters at all — those >1 values are the only ones it rolls, and AgX rolls them to
  white-gold, which **is** the divine-fire color. The 60% void / 30% crimson sit sub-1 and map ~1:1 (the
  CDL offset only nudges the very bottom to absolute zero).
- **Warm-only grade — brand law (Cohesion Map §3.3).** No cool/green/blue ever enters the CDL. The `uSlope`
  holds B at ≤1.0 and the `uOffset` is symmetric-to-slightly-warmer; the basalt's Connemara green lives in
  the _material_ (doc 05/10), never in the post. The grade tints nothing toward cool.
- **One operator, every chamber.** The same AgX flag + same CDL base runs across all eight route-swapped
  chambers (scrying-pool → forge-mouth arch). Per-route mood is the LUT cross-fade `lutWarm` (doc 21 §4.4),
  not a different operator — so nothing reads bolted-on; it's one graded world breathing at different
  temperatures. The CDL is the _world_ grade; the LUT is the _route_ inflection.
- **Shares the temperature bus** (§4.4) with material emissive (`uTemp`), bloom intensity, and exposure —
  the unifying "runs hot" spine. The black-lock's deliberate _exclusion_ from that bus is itself a cohesion
  rule: every element heats together, but the void is the one constant the whole world is read against.
- **Wordmark/3D parity.** The DOM `.forge-letter` CSS ramp (`#E85D04→#C1292E→#E34A27→#C0392B`) and the 3D
  molten letterforms must read as one material on the OLED. The CDL `uSat`/`uPower` are tuned so the 3D
  forge-red **matches that CSS ramp side-by-side on the device** — the truth-meter (Neutral, §3) is how you
  confirm the 3D red is the real `#C1292E` and the CSS gradient agrees.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **The operator is free.** AgX, ACES, and Neutral are all analytic per-pixel math folded into the final
  output stage. Swapping ACES→AgX is a **zero-cost** change (Cohesion Map §10; the cost is look-dev time,
  not GPU time). There is no perf argument for staying on ACES.
- **The CDL folds into the merged pass.** `ForgeGradeCDL` is a pmndrs `Effect`, so it compiles into the
  **same** `EffectPass` fragment as `Vignette`/`Noise`/`ChromaticAberration` (pmndrs merge) — it is not a
  standalone pass and costs ~a dozen ALU ops per pixel inside an already-running shader. Re-tuning its
  uniforms is a uniform write, compositor-safe (`motion-feel`), never a recompile.
- **Three tiers (mirror `Effects.jsx`):**
  - `high` — AgX + full CDL + bloom + CA + SMAA, exposure/sat/slope rides on.
  - `low` — AgX + full CDL + bloom, no CA/SMAA, rides on (they're free uniform writes).
  - `static` — `<Effects>` unmounted, **`NeutralToneMapping`** is the floor (most accurate palette, least
    drama-debt for a no-post frame), `frameloop='demand'`, `uTime` frozen to `2`. The CDL is gone, so the
    void relies on Neutral's clean toe + the renderer not lifting black — verify pixels-off on device.
- **The OLED black-lock is a _quality_ lever, not a perf one.** AgX's lifted floor is invisible on a laptop
  LCD and a grey haze on the iPhone OLED. The `uOffset` negative-lift is the cheap fix; budget _tuning
  attention_ for it on the panel, not GPU time.
- **No HDR-display gamble here.** This doc stays in SDR sRGB output (the P3/Canvas-HDR extended-range path
  is doc 21 deep-dive #4, a separate high-risk upgrade). AgX+CDL+sRGB is the judge-device-safe lane.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (sequential — each unblocks the next; this is a _device_ loop):**

1. **Build the molten-ramp test card first.** A full-screen quad sweeping `temp` 0→1 horizontally through
   `gw_forge`, with a divine-fire `gw_divineFire` patch and a flat `#C1292E` swatch in-frame. This is the
   side-by-side surface — the brief's "build a side-by-side on the molten ramp specifically." Add a leva
   toggle to flip ACES ↔ AgX ↔ Neutral live on the same card.
2. **Swap to AgX, grade OFF, read it raw on the iPhone.** It will look soft/milky — expected. You are
   confirming the _highlights_: the A/E path-to-white is white-gold (not pink, not orange-clip), and the
   `#C1292E` swatch stays red as it brightens (no orange skew). If those are right, the operator is right;
   everything else is grade.
3. **Per-channel hue check on the orange shoulder.** Sweep the ramp brightness and watch the Ember-Glow
   band: under ACES it skews yellow as it brightens (Notorious Six); under AgX it desaturates toward
   white-gold holding hue. Confirm AgX gives you _temperature-driven_ hue (only `temp` moves it), not
   brightness-driven. This is the analytical heart of the decision — eyeball it on the card, then sample a
   few pixels.
4. **Lock the black point with CDL offset — on the OLED.** Pull `uOffset` negative until the void is
   **pixels-off black**, watching that the orange shoulder does **not** dim (it won't — offset shifts the
   whole curve down uniformly, the highlights re-clip back up). This is the step the laptop will lie to you
   about.
5. **Rescue the shoulder with CDL power, restore punch with slope+sat.** Bend `uPower` (R/G < 1) until the
   ember mid is rich again; bump `uSlope` and `uSat` until the red is brutalist-vivid — **stop the moment
   the white-gold A/E starts going pink/peach** (over-saturation pulls the divine fire off white).
6. **Bake the LUT (doc 21) only after this is locked**, and verify LUT `(0,0,0)→(0,0,0)`. Then wire the
   temperature rides (§4.4) absolutely last, gently, on a known-good static grade.

**Specific pitfalls:**

- **Riding the black point.** If `uOffset` is on the heat bus, the void grey-shifts on surge — the one
  thing the OLED can't forgive. Nail the floor; ride only slope/sat/exposure.
- **Leaving ACES's grade under AgX.** The doc-20/21 ACES values (`b −0.04 / c 0.16 / sat 0.12`) read flat
  under AgX. Use the AgX-tuned CDL; only fall back to ACES values _if_ you fall back to ACES (§4.6).
- **Double tone-mapping.** Renderer flag _and_ a `<ToneMapping>` pass = washed blacks + over-saturated
  fire. Renderer flag only.
- **CDL clamp bug.** `pow(negative, power)` is NaN — the `max(c, 0.0)` before `pow` is load-bearing; a
  negative offset _will_ drive some pixels below zero. Clamp first.
- **Over-saturating the divine fire to pink.** The white-gold A/E is the one pixel that must stay neutral-
  warm-white; pushing `uSat` for the red drags it toward peach. The A/E ceiling caps `uSat`.
- **Grading on the laptop sRGB panel.** Black point, the Notorious-Six skew, and red saturation **do not
  simulate** off the iPhone-15 OLED. `qa-route` (0 console errors) only proves the shader _compiled_
  (SwiftShader catches a typo); the operator decision is a _device read_. Tune on the phone.
- **AgX availability.** Confirm `THREE.AgXToneMapping` exists in the pinned build and `ToneMappingMode.AGX`
  in the pinned `postprocessing` before relying on it; fall back to ACES + original grade if absent.

---

## 8. SOURCES (2025–2026)

1. **three.js forum — "Tone Mapping Overview" (Shade project research thread)** — 2025 — side-by-side ACES
   vs AgX vs Neutral vs Reinhard, the ACES hue-shift/washed-saturation problem, path-to-white vs
   per-channel, when each operator is appropriate.
   <https://discourse.threejs.org/t/tone-mapping-overview/75204>
2. **three.js forum — "Is AGX tonemapping implemented correctly?"** — 2025 — AgX in three.js vs Blender;
   flatness/low-contrast ("comparable to shooting flat"), exposure sensitivity, the "add contrast back"
   guidance. <https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609>
3. **three.js forum — "ACESFilmicToneMapping leading to low-contrast textures"** — 2025 (active thread) —
   the documented ACES washed/low-contrast-on-saturated-content failure mode that motivates the swap.
   <https://discourse.threejs.org/t/acesfilmictonemapping-leading-to-low-contrast-textures/15484>
4. **darktable user manual — AgX module** — 2025 (AgX shipped in darktable 5.4, Dec 2025) — the inset
   gamut-compression / per-channel sigmoid / outset mechanism, "never combine with another display
   transform," and how it tames the Notorious Six.
   <https://docs.darktable.org/usermanual/development/en/module-reference/processing-modules/agx/>
5. **Avid Andrew — "AgX and the Evolution of Tone Mappers in darktable"** — 2025 — plain-language AgX vs
   filmic/sigmoid, the Notorious Six per-channel hue skew (yellow fires, magenta blues), path-to-white.
   <https://avidandrew.com/agx-evolution-tone-mappers.html>
6. **Chris Brejon — "OCIO, Display Transforms and Misconceptions"** — maintained through 2025 — the
   canonical explanation of the Notorious Six, per-channel curves vs path-to-white, and why bright
   saturated colors skew to primaries. <https://chrisbrejon.com/articles/ocio-display-transforms-and-misconceptions/>
7. **darktable 5.4 release — "A Simple Beginner Workflow"** — 2025-12 — confirms AgX as a shipped default-
   grade tone mapper and the 2025 timeline. <https://www.darktable.org/2025/12/darktable-5.4-beginner-workflow/>
8. **google/filament — PR #2635 "Add ASC CDL to color grading"** — the real-time SOP+saturation grade
   implementation and ordering in a production engine. <https://github.com/google/filament/pull/2635> ·
   commit <https://github.com/google/filament/commit/23b62e2d1207c734cec6e3d4f58df0bc4a3f3882>
9. **react-postprocessing docs — `ToneMapping` effect** — pmndrs, current 2025–2026 — `ToneMappingMode`
   values (`AGX`, `ACES_FILMIC`, `NEUTRAL`), terminal-pass usage, renderer-flag-vs-pass.
   <https://react-postprocessing.docs.pmnd.rs/effects/tone-mapping>
10. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** — 2026 — current
    operator selection, grade ordering, tone-map-once, WebGPU/TSL direction.
    <https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026>
11. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World" (Ming Jyun Hung)** — 2026-04-21 —
    TSL node-graph post chain with tone mapping as the terminal node; the custom-`ToneMappingNode` path for
    a future AgX+CDL bake. <https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/>
12. **Codrops — "80s Business Tech and Seamless Scene Transitions: Shader.se's Scroll-Driven WebGPU
    Pipeline"** — 2026-05-19 — RenderPipeline/TSL terminal tone-map node, automatic WebGL2 fallback — the
    Phase-3 portability target. <https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/>
13. **Khronos — "PBR Neutral Tone Mapping" (model-viewer docs)** — maintained 2024–2025 — the Neutral
    operator: 1:1-to-threshold, `−0.04` sat, hue preservation — the truth-meter and static-tier floor.
    <https://modelviewer.dev/examples/tone-mapping>
14. **Maxime Heckel — "Field Guide to TSL and WebGPU"** — 2025-10-14 — WebGPU on iOS Safari, porting
    post/tone-mapping to TSL nodes — the Phase-3 custom-operator host.
    <https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/>

_(Industry signal, 2026, corroborating the off-ACES direction: the game **Veil of Ashes** replaced
Unreal's ACES with AgX in Feb 2026 to end "the constant battle against unnatural colors, washed-out
highlights, and crushed blacks"; **Blender 5.0 / ACES 2.0** is a parallel 2026 track. Both reinforce
preferring AgX over classic ACES Filmic for a saturated-warm world.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Custom AgX-derived `ToneMappingNode` (TSL/WebGPU) with brand-baked CDL + guaranteed-zero black.**
   Fold §4.3's CDL into the AgX curve as a single `ToneMappingNode` that runs on both `WebGLRenderer`
   (fallback) and `WebGPURenderer`, removing the operator-then-grade two-step and the double-grade risk —
   the §4.5 packaging, productionized.
2. **Per-channel orange-shoulder calibration on real iOS GPUs.** A measured study (sampled pixels, not
   eyeball) of exactly where the Ember-Glow `#E85D04` band skews under each operator across the brightness
   sweep on the iPhone-15 panel, to derive the minimal CDL `uPower` that keeps the shoulder hue-locked at
   every `temp`.
3. **Divine-fire white-point stability under grade + bloom.** How far `uSat`/bloom can push before the
   white-gold A/E goes pink, and whether a per-region (A/E-masked) saturation guard in the grade lets the
   red go fully brutalist while pinning the divine fire neutral — coupling this doc to doc 22 (A/E stone
   light transport).
4. **HDR display output (P3 / Canvas extended-range) under AgX.** Whether emitting a true HDR signal to the
   iPhone-15 HDR OLED so the divine fire and pour front exceed SDR white changes the operator math (AgX's
   path-to-white in an extended container) — the highest-ceiling, highest-risk finish upgrade (shared with
   doc 21 deep-dive #4).
