# 36 — Per-Route LUT Mood System as a World Bus

_Phase-2 deep-dive · GAELWORX forge world · cluster E-light-finish-arch · target: iPhone 15 OLED, single WebGL renderer_
_Parent: Phase-1 doc 21 (Color Grading & Tone Mapping for OLED), deep-dive candidate #3 · siblings: doc 33 (AgX/ACES operator), doc 34 (OLED dither)_

> **The question this doc closes.** Doc 21 §4.4 sketched a per-route LUT cross-fade ("add `lutWarm` to each
> route preset and damp it on route change exactly like `uIrid`") and named it deep-dive #3. Doc 33 locked
> the operator (AgX on the renderer flag + a warm ASC-CDL world grade) and said explicitly: _"The CDL is the
> world grade; the LUT is the route inflection."_ Doc 34 locked the terminal dither. This document formalizes
> that **route inflection** — the third and final layer of the finish stack — into an engineered **world bus**:
> a `lutWarm` (and a defensive `lutCool` guard) scalar per route in `scenes.js`, dt-damped on navigation,
> cross-fading **authored 32³ `.cube` looks that carry hue/saturation/contrast only** (no tone curve — AgX
> already rolled the highlights), with a **forced `(0,0,0)` black point**, wired to the **same heat scalar**
> that drives emissive, bloom, and exposure. It owns the LUT layer and the cross-fade mechanism; it does not
> re-open the operator (doc 33), the dither (doc 34), the CDL world grade (doc 33 §4.3), or the post-chain
> order (doc 20).

---

## 1. SCOPE — this element in the GAELWORX world

The finish stack has three color-shaping layers stacked above the rendered scene, and they are deliberately
hierarchical, each owning a different scope of authority:

1. **The operator** (AgX, doc 33) — the *physics*. One transfer function, the same in every chamber, that
   turns linear HDR radiance into the color of fire. It is the law of the world; it never varies by route.
2. **The CDL world grade** (doc 33 §4.3) — the *brand lock*. One ASC-CDL (slope/offset/power/sat) tuned to
   AgX that crushes the void to true black, rescues the Ember shoulder, and restores brutalist red. It is the
   GAELWORX "film stock," constant across every chamber.
3. **The per-route LUT** (this doc) — the *mood*. The one layer that is *allowed* to differ between chambers,
   and the one that gives each route its own **graded temperature** without forking the operator, the grade,
   the palette, or the noise. The scrying-pool reads cooler and stiller; the forge-mouth arch reads hotter and
   denser; the jewel-chamber reads more saturated and prismatic — all from **one float** (`lutWarm`) damping a
   cross-fade between two authored looks, on top of one unchanging operator+grade.

This is the grade-side embodiment of the Cohesion Map's central thesis (§9): _"Cohesion does not mean
uniformity — each chamber is a distinct read achieved by damping the shared preset table, never by a different
system."_ A per-route mood is a real cinematographic expectation — the audience reads "cold sacred mirror"
versus "the white-hot mouth" partly through grade temperature — but the brutal constraint is that GAELWORX
must deliver that read **without** introducing a second operator, a cool/green/blue cast (brand law), a lifted
black floor (OLED death), or a per-route post pass (budget death). The LUT is the only finish element with a
*per-route* degree of freedom, so it carries the full weight of "each chamber a distinct temperature" while
the operator and grade carry "one world."

The keystone constraint that makes this safe: **the LUT is hue/saturation/contrast only, with a forced
`(0,0,0)→(0,0,0)` black point.** AgX (the operator) already did the tone curve — the path-to-white that
bleaches the divine-fire A/E and the highlight rolloff. A LUT that *also* curves tone double-rolls the
highlights to a dull, dead plate (doc 21 pitfall) and, worse, an authored-on-a-laptop `.cube` almost always
lifts the shadow floor — a grey haze the iPhone-15 OLED renders mercilessly against its pixels-off black. So
the LUT's job is narrowly scoped: shift the *hue temperature* of the mids and the *saturation* of the accents
per route, and nothing else. Every other authority stays in the operator and the world grade. This doc makes
that scoping an engineered contract, not a hope.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are four viable ways to give each route its own graded mood on top of one operator+grade, plus the
cross-fade mechanism and the LUT-authoring axis that cut across them.

### 2.1 Per-route material/uniform recolor (no LUT) — the "mood background" approach

The 2026 Codrops scroll-reactive gallery (Sklarov, 2026-03-09) carries a **per-item color palette** that
shifts the *background* and blob colors as the scroll moves between items, blending palettes by scroll
progress in the fragment shader. Translated to GAELWORX this would be a per-route `uMoodTint`/`uMoodSat`
pushed into the *materials* — re-tinting the veins, basalt, smoke per chamber. This is the cheapest in GPU
terms (a couple of mix() ops in shaders that already run) and it is genuinely what the gallery does for mood.

- **Quality:** good for a *background-color* mood, but it is the wrong scope for a *grade*. A grade acts on the
  **final composited frame** — fire, bloom halo, basalt, sparks, A/E — as one image, the way a colorist grades
  a shot. Pushing tint into each material means re-plumbing every shader, re-tuning per-material, and you can
  never grade the *bloom halo* or the *post* (they happen after the materials). It also fights the divine-fire
  law: a material tint risks tinting the white-gold A/E.
- **Perf/mobile/complexity:** cheapest GPU, but highest *system* complexity and the worst cohesion (mood logic
  scattered across N materials). **Verdict:** GAELWORX already uses the material-side knob for *structure*
  (`veinScale`/`veinGlow`/`irid`/`tempBias` in `scenes.js`); mood-as-grade belongs in *post*, on the whole
  frame, as one layer — which is exactly what a LUT is. We borrow the gallery's **damped-palette-by-progress**
  *mechanism* and apply it to a LUT blend, not to materials.

### 2.2 Per-route CDL/primary-grade re-tune (no LUT) — damp the SOP numbers

Instead of a LUT, damp the doc-33 CDL's `uSlope`/`uOffset`/`uPower`/`uSat` toward a per-route preset. This is
attractive because the CDL already exists and is already a merged-pass uniform write — a per-route mood would
be ~10 more damped floats, zero new asset, zero new texture binding.

- **Quality:** a **primary** grade (lift/gamma/gain/sat) can do "warmer/cooler/punchier" convincingly and is
  fully sufficient for a *subtle* per-route inflection. What it **cannot** do is a **secondary/non-linear**
  look — "push the oranges toward ember but leave the reds, lift saturation only in the mids, hue-rotate the
  cool basalt-green slightly without touching the fire." Those are 3D-LUT moves (independent control of every
  RGB cell), not 9-number CDL moves.
- **Perf/mobile:** best-in-class (no texture, no fetch, folds into the merged pass). **Complexity:** low.
- **Verdict:** this is the **`low`-tier and fallback** path (§3, §6) — a per-route CDL delta is the cheap mood
  when the LUT texture is gated off. On `high`, the LUT gives a richer, art-directed look the CDL can't reach.
  The two are not redundant: CDL is the *primary world grade* (constant), the per-route CDL delta is the
  *cheap mood fallback*, and the LUT is the *rich mood* on `high`. Doc 33's CDL stays the world grade; this doc
  may add a tiny per-route CDL **delta** as the `low`-tier substitute for the LUT.

### 2.3 3D `.cube` LUT cross-fade — the recommended hero (this doc's pick)

A 32³ `.cube` is a cube of authored output colors; each pixel's RGB indexes a position and the interpolated
cell value replaces it (threejsfundamentals 3DLUT; pmndrs `LUT3DEffect`). pmndrs `postprocessing` ships
`LUT3DEffect` + `LUTCubeLoader` (`.cube`/`.3dl`/PNG/JPG), with **tetrahedral interpolation** (ported from
OpenColorIO, the industry-standard, removes grid artifacts) and a **blend mode with an `opacity`** like any
other `Effect`. The 2025 `LUT1DEffect` addition (donmccurdy, pmndrs #371) confirms the LUT family is actively
maintained. The **per-route mood** is then a **cross-fade between two LUTs by a damped opacity**:

- **Two stacked `LUT3DEffect`s, opacities damped** — a base `forge-look.cube` at full strength, a route LUT
  (`forge-hot.cube` / `forge-cool.cube`) faded in by `lutWarm`. Two 3D texture fetches on the cross-fade frames,
  one when settled (the second at opacity 0 can be skipped). Simplest to author (each LUT is a standalone look),
  exact, and the cross-fade is a single damped float — the Codrops damped-palette mechanism (§2.1) applied to
  grade.
- **One LUT effect, `setLUT` swap + identity-blend opacity** — cheaper VRAM (one bound 3D texture), but you
  cannot cross-fade *between two non-identity looks* with a single effect; `opacity` only fades the one LUT
  toward identity (the ungraded image). That gives "more graded ↔ less graded," not "cool look ↔ hot look."
  Insufficient for a true mood swap; useful only as the global "LUT strength" master.
- **Quality:** best-in-class. A `.cube` can encode any secondary hue/sat move (the §2.2 limitation gone),
  authored once in Resolve/Photoshop and reproduced exactly. **Perf:** one 3D-texture sample per pixel per
  active LUT (~98 KB VRAM per 32³); tetrahedral adds a few ALU ops. **Mobile:** affordable on `high` (the
  dual-fetch only on cross-fade frames); gated off on `low`/`static`. **Complexity:** medium (own the `.cube`
  assets + the loader + the black-point verification).

### 2.4 WebGPU/TSL `lutNode` cross-fade — Phase-3 portability target

three.js ships a TSL `lut`/`lut3D` node for WebGPU color grading (`webgpu_postprocessing_3dlut` example; TSL
docs), production-ready since r171 (Sept 2025) with automatic WebGL2 fallback. The 2026 RenderPipeline /
node-graph post (Codrops False-Earth 2026-04-21; Shader.se 2026-05-19) builds the whole grade — operator, CDL,
LUT, dither — as terminal TSL nodes, so a `mix(lutA(c), lutB(c), lutWarm)` node would run identically on both
renderers and remove the operator-then-grade two-step.

- **Verdict:** the natural home for the locked look (deep-dive #1, shared with doc 33 §9.1 and doc 34 §4.4),
  but a renderer migration explicitly deferred past the judge device (Cohesion Map §10: WebGL2 +
  `onBeforeCompile` ships to the judge). We **author the cross-fade TSL-portable now** (the blend math is a
  one-line `mix`), so the port is a re-host not a rewrite.

### 2.5 The cross-fade mechanism (cuts across §2.3/§2.4) — damp the blend, never cut

The mood transition on navigation must obey the Cohesion Map's motion law (§9, rule 6): _"On navigation, damp
toward the new preset (λ ≈ 2.2–2.4) — never cut."_ The mechanism is the Codrops gallery's damped-palette-by-
progress (§2.1) restated for a LUT: a single `lutWarm ∈ [-1, 1]` scalar, dt-damped per frame via
`THREE.MathUtils.damp(cur, target, λ, dt)` toward `sceneFor(route).lutWarm`, driving the cross-fade opacity.
Brutalist Snap (`CLAUDE.md`) wants *impact, no bounce* — `damp` is monotonic (no overshoot), so a fast λ reads
as a snap-in mood shift, not a spring. This is the **same damp function and the same `forge` store** the whole
preset table already uses (`veinGlow`/`irid`/`camZ`), so the grade re-tempers on the **exact heartbeat** as
the camera and the veins — the proof it is one bus and not a bolted-on transition.

### 2.6 The LUT-authoring axis — hue/sat/contrast only, identity-blended, black-locked

How the `.cube` is generated is as load-bearing as how it's applied. The 2025–2026 consensus across the LUT
tooling (Image-to-LUT "Mix" with an identity LUT; LUT-Maker; 3D-LUT-Creator hue/sat-without-brightness):

- **No tone curve in the LUT.** AgX already rolled the highlights. A LUT that also curves them double-rolls →
  dead highlights (doc 21 pitfall). The `.cube` must be authored with **the contrast/curve at neutral**, moving
  only hue, saturation, and a mild *linear* contrast.
- **Identity-blend the strength.** The cleanest way to keep a route LUT *subtle* (so it inflects, never
  overrides) is to author it as `mix(identity, gradedLook, strength)` at bake time (Rocket Rooster's "Mix"
  default 0.15 = 15% identity). A GAELWORX route LUT at ~40–60% strength toward the look keeps the brand red
  the brand red while shifting temperature.
- **Force the black point to `(0,0,0)`.** The single most important authoring step for the OLED. Sample the
  baked `.cube` at `(0,0,0)`; if it doesn't return exactly `(0,0,0)`, the void will grey-haze on the panel.
  Either author the LUT to map black→black, or clamp the corner cell post-bake. (Doc 34's terminal dither runs
  *after* the LUT, so a black-correct LUT + the near-black dither rolloff together guarantee pixels-off void.)
- **Warm-only.** Brand law (Cohesion Map §3.3): no cool/green/blue ever enters the grade. The "cool" route LUT
  (`forge-cool.cube`, §3) is *cool by desaturation and a slight ember-pullback*, never by a blue tint — it
  cools by removing fire, not by adding ice. This is why `lutCool` is a **guard**, not a free axis.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a two-LUT cross-fade as the `high`-tier mood bus: a constant base `forge-look.cube` plus one route
LUT whose opacity is damped by a single `lutWarm ∈ [-1, 1]` scalar from `scenes.js`. Author exactly two route
LUTs — `forge-hot.cube` (the `+1` pole) and `forge-cool.cube` (the `-1` pole, the `lutCool` guard) — both
hue/sat/contrast-only, identity-blended to ~50% strength, black-point forced to `(0,0,0)`. On `low`, drop the
LUT textures and substitute a per-route CDL delta (§2.2) driven by the same `lutWarm`. On `static`, no LUT, no
delta — the Neutral-operator floor. Damp `lutWarm` on navigation with the shared `forge`-store `damp` (λ ≈
2.3), and ride only its *saturation/warmth* component (never its black point) on the master heat scalar.**

The structure: `lutWarm` is a signed scalar. At `0` the world is the pure base look. As it goes **positive**
toward the forge-mouth pole, the `forge-hot.cube` fades in (`opacity = max(lutWarm, 0)`), pushing the mids
toward Ember Glow and lifting accent saturation — *hotter, denser, more fire*. As it goes **negative** toward
the scrying-pool pole, the `forge-cool.cube` fades in (`opacity = max(-lutWarm, 0)`), desaturating the fire
and pulling the ember back toward deep crimson — *cooler, stiller, more sacred-dark*. Two LUTs, one signed
float, each chamber a point on the temperature axis.

Justification:

1. **It is the correct *scope*.** A grade acts on the final composited frame — fire + bloom halo + basalt + A/E
   as one image. The LUT is the only mood mechanism that grades the *whole frame including the bloom and post*,
   the way a colorist grades a shot. Material-side tint (§2.1) can't reach the halo or the post and risks
   tinting the divine fire; the LUT, sitting after bloom and the CDL, grades everything coherently.

2. **A 3D LUT reaches secondary moves the CDL can't.** "Push only the oranges toward ember, lift saturation
   only in the mids, leave Celtic Blood exactly `#C1292E`" is a per-cell 3D-LUT move, not a 9-number primary.
   That is precisely the *art-directed temperature* each chamber wants, and it is authored once in a colorist
   tool and reproduced exactly — the CDL (§2.2) is the fallback, not the ceiling.

3. **The signed two-LUT axis matches the world's temperature spine.** GAELWORX's whole architecture is one
   temperature signal (Cohesion Map §1). A *signed* `lutWarm` makes the grade a literal point on that spine:
   cool pole = scrying-pool (the world at its coldest), hot pole = forge-mouth (the world at its hottest), and
   the route presets place each chamber along it. The grade temperature and the material temperature
   (`tempBias`) move together — cohesion you can read.

4. **The cross-fade is the world bus, not a transition effect.** Because `lutWarm` is a `scenes.js` field damped
   by the *same* `forge`-store `damp` as `veinGlow`/`irid`/`camZ`, navigating into the forge-mouth ramps the
   grade-warmth on the **same frame** the camera dollies and the veins surge. That synchrony is the cohesion
   proof (Cohesion Map rule 6) — the mood is part of the one re-tempering, not a separate fade.

5. **It degrades uniformly and cheaply.** `high` = two-LUT cross-fade; `low` = CDL-delta mood (same `lutWarm`
   float, no texture); `static` = no mood, the accurate Neutral floor. A tier drop thins the *mechanism*
   uniformly (Cohesion Map rule 9), never recolors — the cool chamber stays cooler on every tier, just via a
   cheaper grade. Net cost on `high`: one extra 3D-texture fetch on cross-fade frames; zero on `low`.

**Net deliverable:** `scenes.js` gains `lutWarm` (signed) per route; a `ForgeLUT` component stacks a base +
two route `LUT3DEffect`s with damped opacities (or, equivalently, two LUTs with one always-base and one
route-selected); a `<ForgeDriver>`-side damp of `forge.lutWarm`; a `low`-tier CDL-delta substitute; three
authored, black-locked, tone-curve-free `.cube` files; all tuned **on the iPhone-15 OLED**.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (repo) — `THREE.MathUtils.damp` (the shared damper), `Data3DTexture` (the LUT carrier),
  `LinearFilter`/`ClampToEdgeWrapping`/`NoColorSpace` for the LUT texture state. For the Phase-3 WebGPU port,
  the TSL `lut3D` node (`webgpu_postprocessing_3dlut` example).
- `postprocessing` (pmndrs) + `@react-three/postprocessing` (repo) — `LUT3DEffect` (tetrahedral interpolation,
  `opacity`/`blendMode`), `LUTCubeLoader` (`.cube` loader), `LUT` drei wrapper. The `ForgeGradeCDL` effect
  (doc 33) is already in the chain; the `low`-tier delta reuses its uniforms. **No new dependency.**
- Leva (`?debug`) — live `lutWarm` slider + per-route LUT preview for the device tuning loop.

### 4.2 `scenes.js` — the per-route preset field (the bus authority)

`lutWarm` is the signed mood scalar; `lutCool` is not a separate field but the **negative half** of
`lutWarm` (one axis, two poles — see §2.6, keeping it one float honors "one signal"). Representative values,
placing each chamber on the temperature spine (Cohesion Map §9):

```js
// scenes.js — extend each preset. lutWarm ∈ [-1, 1]: -1 = coolest (scrying-pool), +1 = hottest (forge-mouth).
export const SCENES = {
  '/':            { /* …existing… */ lutWarm:  0.00 },  // base forge — the reference look
  '/voice':       { /* …existing… */ lutWarm: -0.85 },  // scrying-pool: coolest, desaturated, sacred-still
  '/pricing':     { /* …existing… */ lutWarm: -0.45 },  // stone-ledger: cool, still, deep
  '/about':       { /* …existing… */ lutWarm: -0.15 },  // altar-approach: near-base, the source
  '/work':        { /* …existing… */ lutWarm:  0.10 },  // four-plinths: gallery-neutral, a touch warm
  '/software':    { /* …existing… */ lutWarm:  0.35 },  // casting-room: the live pour, warmer
  '/web':         { /* …existing… */ lutWarm:  0.30 },  // jewel-chamber: warm + (sat handled by irid/CDL)
  '/automations': { /* …existing… */ lutWarm:  0.45 },  // channel-hall: dense, hot machinery
  '/contact':     { /* …existing… */ lutWarm:  0.90 },  // forge-mouth arch: hottest, the white-hot mouth
}
```

`sceneFor(path)` already returns the row; the damper reads `sceneFor(forge.route).lutWarm` as the target.

### 4.3 The `forge` store + driver hook (one damp, one bus)

`store.js` gains a damped `lutWarm` (mirrors `scrollDamped`), and the single `<ForgeDriver>` (Cohesion Map
§1.5 / §4.2 — the sole author of the master pool) damps it on the shared heartbeat:

```js
// store.js — add to the mutable forge store (NOT React state; mutated in useFrame)
export const forge = {
  /* …scrollDamped, scrollVel, strikeAt, route… */
  lutWarm: 0,            // damped signed mood scalar; written by ForgeDriver, read by ForgeLUT
}
```

```jsx
// ForgeDriver.jsx (the one per-frame writer) — damp lutWarm toward the route preset, λ ≈ 2.3
import * as THREE from 'three'
import { sceneFor } from './scenes'
useFrame((_, dt) => {
  // … existing master-pool damping (uTemp, uHeat, veinGlow, irid, camZ) …
  const target = sceneFor(forge.route).lutWarm ?? 0
  forge.lutWarm = THREE.MathUtils.damp(forge.lutWarm, target, 2.3, dt)   // λ matches preset-table re-temper
})
```

One float, one damp, in the one writer — the grade re-tempers in lockstep with the veins and the camera. No
second rAF, no `lerp(a,b,k)`, no `setInterval` (Cohesion Map rule 6).

### 4.4 `ForgeLUT.jsx` — the two-LUT cross-fade effect

The base look is always on at full strength; the hot and cool route LUTs each fade in by the sign of
`lutWarm`. `LUT3DEffect.blendMode.opacity` is a `Uniform` we write per frame (a uniform write — no recompile,
compositor-safe per `motion-feel`). The base LUT is mounted only on `high`; the route LUTs share its gate.

```jsx
// ForgeLUT.jsx — high-tier per-route mood bus. Base look + hot/cool route LUTs, opacities damped by lutWarm.
import { useLoader, useFrame } from '@react-three/fiber'
import { LUT } from '@react-three/postprocessing'
import { LUTCubeLoader } from 'postprocessing'
import { forge } from '../store'
import { useRef } from 'react'

export function ForgeLUT() {
  // Three authored 32³ looks, served from /public/luts. hue/sat/contrast only, black-locked, identity-blended.
  const base = useLoader(LUTCubeLoader, '/luts/forge-look.cube')   // constant world look
  const hot  = useLoader(LUTCubeLoader, '/luts/forge-hot.cube')    // +lutWarm pole (forge-mouth)
  const cool = useLoader(LUTCubeLoader, '/luts/forge-cool.cube')   // -lutWarm pole (scrying-pool), the guard

  const hotRef = useRef(), coolRef = useRef()

  useFrame(() => {
    const w = forge.lutWarm                 // already dt-damped in ForgeDriver — read, don't re-damp
    // Opacity = signed split. Only one route LUT is ever > 0; at lutWarm=0 both are off → pure base look.
    if (hotRef.current)  hotRef.current.blendMode.opacity.value  = Math.max(w, 0)
    if (coolRef.current) coolRef.current.blendMode.opacity.value = Math.max(-w, 0)
  })

  return (
    <>
      {/* Base look — full strength, the constant film stock. Tetrahedral kills grid artifacts (~free). */}
      <LUT lut={base.texture3D} tetrahedralInterpolation />
      {/* Route LUTs — stacked after base; opacity damped. The cross-fade IS the mood bus. */}
      <LUT ref={hotRef}  lut={hot.texture3D}  tetrahedralInterpolation />
      <LUT ref={coolRef} lut={cool.texture3D} tetrahedralInterpolation />
    </>
  )
}
```

Mounted in `Effects.jsx` **after Bloom + CDL, before Vignette/dither** — the LUT grades the
already-bloomed, already-CDL'd frame, and the terminal dither (doc 34) dithers the LUT's output (so the LUT
can't reintroduce banding the dither must then catch):

```jsx
<EffectComposer disableNormalPass frameBufferType={HalfFloatType} multisampling={high ? 2 : 0}>
  {/* HeatHaze → DOF → GodRays */}
  <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3} intensity={high ? 0.9 : 0.6} radius={0.8} />
  {high && <ChromaticAberration offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />}
  <ForgeGradeCDL ref={cdl} slope={[1.06,1.02,0.98]} offset={[-0.012,-0.012,-0.014]} power={[0.94,0.96,1.0]} sat={1.16} />
  {high
    ? <ForgeLUT />                                  {/* high: rich two-LUT mood cross-fade */}
    : <ForgeGradeMoodDelta />}                      {/* low: cheap CDL-delta mood, same lutWarm float */}
  <Vignette eskil={false} offset={0.22} darkness={0.96} />
  {tier !== 'static' ? <ForgeDither amp={sceneFor(forge.route).ditherAmp ?? 1.0} /> : <Noise .../>}
  {high && <SMAA />}
  {/* AgX terminal on gl.toneMapping — no <ToneMapping> pass */}
</EffectComposer>
```

### 4.5 LUT texture state (the make-or-break sampler config)

The loaded `.cube`'s `texture3D` **must** be sampled correctly or it bands or shifts color:

```js
import { LinearFilter, ClampToEdgeWrapping, NoColorSpace } from 'three'
const t = base.texture3D
t.minFilter = t.magFilter = LinearFilter   // smooth LUT cell interpolation (tetrahedral on top)
t.wrapS = t.wrapT = t.wrapR = ClampToEdgeWrapping  // NEVER repeat a LUT — clamp the cube edges
t.generateMipmaps = false                  // mips on a LUT are meaningless and band
t.colorSpace = NoColorSpace                 // a LUT is data, not color — no sRGB decode on the lookup
```

`LUTCubeLoader` sets most of this, but verify `colorSpace`/`generateMipmaps` after load — a mip-filtered or
sRGB-decoded LUT is the classic "my grade looks wrong" bug (mirrors doc 34's blue-noise sampler rule).

### 4.6 The `low`-tier CDL-delta substitute (§2.2)

When the LUT textures are gated off (`low`), the *same* `lutWarm` drives a primary-grade delta on the doc-33
CDL — warmer/cooler + sat, no new asset. It rides the CDL's existing `uSlope`/`uSat`/`uPower` uniforms:

```jsx
// ForgeGradeMoodDelta — low-tier mood: bias the CDL world grade by the same signed lutWarm. No texture.
useFrame(() => {
  const w = forge.lutWarm, u = cdl.current.uniforms
  // Warm pole: lift R slope + sat (more ember). Cool pole: drop sat, pull R slope back (less fire). NEVER B-cool.
  const s = u.get('uSlope').value
  s.x = 1.06 + Math.max(w,0)*0.05 - Math.max(-w,0)*0.02   // warm adds red gain; cool gently removes it
  u.get('uSat').value = 1.16 + Math.max(w,0)*0.10 - Math.max(-w,0)*0.14  // hot richer, cool desaturated
  // uOffset (black point) is NEVER touched — true-black is invariant across routes and tiers.
})
```

This guarantees the cool chamber reads cooler on `low` too — degrade the *mechanism*, never the *direction*.

### 4.7 Hooking the master temperature/heat bus (the §4.4 cohesion wire)

Beyond the per-route *navigation* damp, the LUT mood **breathes on the master heat scalar** (Cohesion Map
§1.5: `heat = scrollDamped + scrollVel*0.25 + strike`) so a strike/scroll-surge warms the grade in the *same
frame* as emissive, bloom, and exposure (doc 33 §4.4). The wire is a tiny additive nudge to the route's
`lutWarm` target — the forge running hot pushes the *whole world* a hair toward the hot pole transiently:

```jsx
// In ForgeDriver, fold transient heat into the damp target (subtle — ±0.12 max, or it reads as a pump):
const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel*0.25, 0.3) + forge.strike, 1)
const target = (sceneFor(forge.route).lutWarm ?? 0) + heat * 0.12   // surge warms the grade transiently
forge.lutWarm = THREE.MathUtils.damp(forge.lutWarm, target, 2.3, dt)
```

So a strike on the scrying-pool route momentarily warms even the cool chamber (the forge flaring), then it
damps back to its cool resting point — the grade is on the heartbeat. **The black point is never on this
bus** (doc 33 §4.4): only the warm/sat poles breathe; the void is the one constant every route is read
against.

### 4.8 The WebGPU/TSL port (authored now, deferred to Phase 3)

The cross-fade is a one-line `mix` in TSL — the port is a re-host, not a rewrite (Cohesion Map §10):

```js
import { Fn, mix, max, float } from 'three/tsl'
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js'   // or the example's lutNode
// outputNode = mix( lut3D(graded, baseTex, 32),  ... )  — but cleaner as the signed split:
const forgeLUT = Fn(([c, warm]) => {
  const base = lut3D(c, baseTex, 32, 1.0)
  const hot  = lut3D(base, hotTex, 32, max(warm, 0))
  return lut3D(hot, coolTex, 32, max(warm.negate(), 0))   // each lut3D blends by its strength arg
})
// outputNode = forgeLUT(tonemappedGraded, uniform(forge.lutWarm))
```

---

## 5. COHESION — shared palette / lighting / uniforms

- **Lands on `PAL`, never invents color.** Every `.cube` is authored *toward* the Industrial-Metallurgy hexes
  (`palette.js` `PAL`): void `#050507`→ crushed to true black, Celtic Blood toward `#C1292E`, Ember Glow toward
  `#E85D04`, the divine-fire peak toward Fog White `#F1F2F6`. The LUT shifts *temperature within* the palette;
  it never adds a hue outside it. The truth-meter (Neutral operator, doc 33 §3) is how you confirm the LUT
  didn't drift the brand red off `#C1292E`.
- **Warm-only — brand law (Cohesion Map §3.3).** No cool/green/blue ever enters any `.cube`. The cool pole
  (`forge-cool.cube`) cools by **desaturating the fire and pulling ember back toward deep crimson**, never by a
  blue/green tint. `lutCool` is a *guard* (the negative half of one signed axis), not a free cool channel — it
  cannot tint cool because there is no cool LUT, only a *less-hot* one. The basalt's Connemara green lives in
  the *material* (doc 05/10), never in the post.
- **One operator + one world grade, every chamber; the LUT is the only per-route inflection.** AgX (doc 33) and
  the CDL world grade are constant across all eight chambers; the LUT cross-fade is the single allowed
  per-route variation (doc 33 §5: _"The CDL is the world grade; the LUT is the route inflection"_). Nothing
  reads bolted-on — it's one graded world breathing at different temperatures.
- **Shares the bus three ways.** (1) `lutWarm` is a `scenes.js` field damped by the *same* `forge`-store `damp`
  as `veinGlow`/`irid`/`camZ` — navigation re-tempers grade and camera together. (2) It rides the *same* master
  heat scalar as emissive/bloom/exposure (§4.7) — a strike warms the grade on the same frame. (3) Its black
  point is *excluded* from both buses — the deliberate constant (doc 33 §4.4). Three couplings, all through the
  one driver, zero private clocks.
- **Wordmark/3D parity.** The DOM `.forge-letter` CSS ramp (`#E85D04→#C1292E→#E34A27→#C0392B`) and the 3D molten
  forge-red must read as one material on the OLED. Author the base `.cube` so the 3D red matches the CSS ramp
  side-by-side on the device; the route LUTs shift temperature *around* that anchor, never off it.
- **Above the world, not of it.** Like the dither (doc 34 §4.5), the LUT is a *finishing* layer — it does not
  sample `gw_fbm`, does not read `uTemp` in a material. Its cohesion contract is "**one base look + one signed
  route inflection, damped on the shared heartbeat, warm-only, black-locked**," not "samples the noise basis."

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Cost on `high`:** the base LUT is one 3D-texture fetch/pixel; the route LUTs add a *second* fetch **only on
  cross-fade frames** (when `lutWarm` is mid-transition). When a route is settled, exactly one route LUT has
  opacity > 0 and the other can early-out (opacity 0 → skip the sample, or just leave the at-rest pole's LUT
  unmounted). Steady state on a chamber = **two** fetches (base + active pole); during a ~0.5 s navigation
  cross-fade = up to three momentarily. Each 32³ LUT is ~98 KB VRAM. Tetrahedral interpolation is a few extra
  ALU ops (the OpenColorIO method) — negligible. Folds into the merged `EffectPass` (pmndrs merge) alongside
  the CDL, vignette, and dither; **not** a standalone pass.
- **The fetch is the only real cost, and it's small.** In the fill-rate-bound budget (doc 29: pixels are the
  enemy), 2–3 dependent 3D-texture fetches at DPR 1.5 is well inside the post chain's ~2.5–3 ms allocation. To
  cut it further: collapse base+route into a **single pre-blended LUT** on navigation (CPU-blend the two
  `.cube` data arrays into one `Data3DTexture` once per route change — one fetch always, at the cost of a brief
  per-nav CPU blend). Reserve this only if profiling shows the dual fetch hurts.
- **Tiers (degrade the mechanism uniformly — Cohesion Map rule 9):**
  - **`high`** — full two-LUT cross-fade, tetrahedral, the rich art-directed mood, heat-ride on.
  - **`low`** — **no LUT texture** (skip the fetch + VRAM); the §4.6 CDL-delta mood driven by the *same*
    `lutWarm`. The cool chamber still reads cooler; the cost is zero (uniform writes only). This is the
    "degrade the mechanism, not the direction" rule.
  - **`static`** — no LUT, no delta; the Neutral-operator floor (doc 33 §6). A frozen poster grades accurately,
    not moodily — correct for a no-post still.
- **VRAM discipline:** three 32³ LUTs = ~294 KB total, loaded once on `high`, never per-route. Serve as
  KTX2/compressed if first-paint load matters (doc 21 §6). `renderer.info.memory.textures` must be **flat**
  across navigation — the LUTs load once and stay; if it climbs on nav, a LUT is re-loading (decouple the
  loader from the route).
- **No HDR-display gamble, no EXR.** The LUT is an SDR sRGB `.cube` (the P3/extended-range path is a separate
  high-risk upgrade, doc 21 deep-dive #4). And a `.cube` is not an EXR — it's a tiny data texture, no runtime
  EXR load (hard constraint, Cohesion Map §10).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each unblocks the next; this is a *device* loop — the OLED, not the laptop):**

1. **Lock the base look first, mood OFF.** Get `forge-look.cube` (the constant world look) right on the iPhone
   with AgX + CDL already locked (docs 33), `lutWarm = 0`, route LUTs unmounted. The base must read as the
   GAELWORX film stock *before* any per-route inflection exists — you cannot tune a mood delta against a moving
   base.
2. **Verify the black point of every `.cube` on the panel.** Sample each LUT at `(0,0,0)` → must be `(0,0,0)`.
   Render the void full-screen with each LUT at full strength; confirm **pixels-off true black** (hold a
   pure-black reference beside it). This is the step the laptop LCD lies about and the OLED exposes — and it is
   the single most common LUT failure (a laptop-authored `.cube` lifts the floor → grey haze).
3. **Author the two route LUTs as identity-blends, hue/sat/contrast only.** `forge-hot.cube` = base look pushed
   toward ember + accent saturation; `forge-cool.cube` = base look desaturated + ember pulled back toward deep
   crimson. **No tone curve** in either (AgX did it). Bake at ~50% identity blend so the pole is an inflection,
   not an override. Re-verify the black point after baking.
4. **Wire the static cross-fade and slam `lutWarm` between -1, 0, +1 by hand (leva).** With the damp
   *disabled*, confirm the three poles read as cool / base / hot and that **Celtic Blood stays `#C1292E`** at
   every pole (truth-meter on Neutral for one frame). If the red drifts, the LUT is over-strong — pull the
   identity blend up.
5. **Enable the navigation damp (λ ≈ 2.3).** Navigate scrying-pool ↔ forge-mouth; confirm the mood ramps with
   the camera and veins (same heartbeat), **no bounce** (damp is monotonic — Brutalist Snap), and no visible
   pop at route boundaries. If it pops, the damp isn't reading the damped `forge.lutWarm` (it's reading the raw
   target).
6. **Add the heat-ride (§4.7) last, gently.** ±0.12 max. Strike on a cool route → the grade flares warm a hair
   then settles back. Stop the moment it reads as auto-exposure pumping. **Never** put the black point on this
   ride.
7. **Build the `low`-tier CDL-delta and A/B it against the LUT.** On `low`, confirm the cool chamber still
   reads cooler than the hot chamber via the delta alone — the *direction* survives the tier drop even though
   the *richness* doesn't.

**Specific pitfalls:**

- **Baking a tone curve into the LUT.** AgX already rolled the highlights; a LUT that *also* curves them
  double-rolls → dull, dead highlights. **LUT = hue/sat/contrast only.** The #1 LUT error here.
- **LUT lifting the black floor.** A laptop-authored `.cube` almost always raises shadows; on OLED that's a
  grey haze over the 60% void. Force `(0,0,0)→(0,0,0)`; verify on the panel.
- **A cool/blue/green tint in the cool LUT.** Brand law violation. The cool pole cools by *desaturation +
  ember-pullback*, never by adding cool hue. There is no cool LUT, only a less-hot one.
- **Tinting the divine-fire A/E.** The white-gold A/E is the one region that must stay neutral-warm-white. A
  too-saturated hot LUT drags it toward peach/pink (same failure as doc 33's `uSat` ceiling). Cap the hot LUT's
  saturation so the A/E holds white-gold — A/E ceiling beats route mood.
- **Cutting instead of damping on navigation.** A hard LUT swap on route change reads as a jarring color pop —
  the opposite of one coherent world. Always damp `lutWarm` through the shared store (no `lerp(a,b,k)`, no
  cut).
- **Riding the black point on heat.** If any heat scalar touches the LUT's shadow mapping, the void grey-shifts
  on surge — the one thing the OLED can't forgive. Ride only warm/sat; nail the floor.
- **Repeat-wrapped or mip-filtered LUT texture.** `ClampToEdgeWrapping`, `LinearFilter`, no mips, `NoColorSpace`
  — a repeated or mipped LUT bands and shifts hue (the §4.5 sampler rule).
- **Double-grading via a `<ToneMapping>` pass.** Tone-map stays on `gl.toneMapping` (AgX). A LUT carrying a
  curve *plus* the renderer operator double-rolls. LUT is data-space color shaping, terminal-ish, not a
  second operator.
- **Loading LUTs per-route.** Load the three `.cube`s **once** on `high`, keep them mounted, drive only the
  opacity. Re-loading on nav climbs `renderer.info.memory.textures` and stutters — the disposal/flat-memory
  rule (Cohesion Map §4.3).
- **Judging on the laptop.** Black point, the warm/cool read, and red saturation **do not simulate** off the
  OLED. `qa-route` (0 console errors) proves the shader compiled and the `.cube` loaded; the mood is a *device
  read*. Tune on the phone (doc 33 §7, doc 34 §7 — the same law).

---

## 8. SOURCES (2025–2026)

1. **pmndrs `postprocessing` — `LUT3DEffect`** (current docs, maintained 2025–2026). The 3D-LUT effect API:
   tetrahedral interpolation (ported from OpenColorIO), `.cube`/`.3dl`/image LUT support, the blend mode +
   `opacity` used for the cross-fade, `texture3D`.
   <https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/LUT3DEffect.js~LUT3DEffect.html>
2. **pmndrs `postprocessing` — `LUTCubeLoader`** (current docs, 2025–2026). `.cube`/`.3dl`/PNG/JPG LUT loading
   into a `Data3DTexture` for `LUT3DEffect`.
   <https://pmndrs.github.io/postprocessing/public/docs/class/src/loaders/LUTCubeLoader.js~LUTCubeLoader.html>
3. **pmndrs/postprocessing — `LUT1DEffect` addition (#371, donmccurdy)** (2025). Confirms the LUT family is
   actively maintained in 2025 and the shaper-LUT-plus-3D-LUT stacking workflow.
   <https://github.com/pmndrs/postprocessing/issues/368> · repo <https://github.com/pmndrs/postprocessing>
4. **Codrops — "Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds"**
   (2026-03-09). Per-item color palette that shifts the background/mood as the scroll moves between items,
   blended by progress in the fragment shader — the damped-palette-by-progress mechanism this doc adapts to a
   per-route LUT cross-fade.
   <https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/>
5. **Codrops — "More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say"** (2026-04-28).
   Custom transition curves for every crossfade between states, timed to scroll beats — the damped, never-cut
   per-route transition discipline.
   <https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/>
6. **Codrops — "80s Business Tech and Seamless Scene Transitions: Inside Shader.se's Scroll-Driven WebGPU
   Pipeline"** (2026-05-19). RenderPipeline/TSL terminal grade nodes, seamless per-scene transitions, automatic
   WebGL2 fallback — the Phase-3 TSL `lut3D`-node cross-fade port target.
   <https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/>
7. **three.js — `webgpu_postprocessing_3dlut` example** (current, r171+, WebGPU production-ready Sept 2025). The
   TSL `lut3D`/`lutNode` for color grading on `WebGPURenderer` with WebGL2 fallback — the Phase-3 port.
   <https://threejs.org/examples/webgpu_postprocessing_3dlut.html>
8. **three.js — TSL docs (`lut3D`/color-grading nodes)** (current, 2025–2026). The node-based LUT grade in the
   renderer-agnostic shading language, for the WebGPU port.
   <https://threejs.org/docs/pages/TSL.html>
9. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** (2026). Current grade
   ordering, tone-map-terminal placement, LUT position in the merged pass, and the node-graph 2026 direction.
   <https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026>
10. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). WebGPU on iOS Safari, porting post/grade
    to renderer-agnostic TSL nodes — the Phase-3 host for the LUT cross-fade.
    <https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/>
11. **Rocket Rooster — "Image to LUT"** (maintained 2025). The "Mix" identity-blend technique (a 0.15 default =
    15% identity / 85% graded) — the authoring move for keeping a route LUT a subtle inflection, not an
    override. <https://www.rocketrooster.ninja/i2l.html>
12. **3D LUT Creator — hue/saturation grid** (official, 2025). Changing hue/saturation independent of brightness
    — the "secondary, non-tone-curve" LUT moves the CDL can't reach, the justification for a 3D LUT over a
    primary grade. <https://3dlutcreator.com/>
13. **threejsfundamentals — "Three.js Post Processing 3DLUT"** (the canonical 3D-LUT-in-three.js explainer,
    referenced across the 2025–2026 LUT write-ups). How a 3D LUT cube is indexed by source RGB; identity-LUT
    construction and the `.cube`/image LUT formats.
    <https://threejsfundamentals.org/threejs/lessons/threejs-post-processing-3dlut.html>
14. **MoldStud — "An In-Depth Look at Color Grading Techniques in Three.js Post-Processing"** (2025). 3D `.cube`
    LUTs for cinematic web grading, 32³/64³ resolution choice, normalize-to-linear-before-LUT, and per-mood
    LUT selection. <https://moldstud.com/articles/p-an-in-depth-look-at-color-grading-techniques-in-threejs-post-processing>

_(Sibling docs of record, this build: doc 21 (parent — the LUT system and §4.4 cross-fade sketch), doc 33 (the
AgX operator + CDL world grade this LUT inflects), doc 34 (the terminal dither that runs after the LUT). The
Cohesion Map §3.3 / §9 binds the warm-only, black-locked, damped-per-route contract.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Single pre-blended `Data3DTexture` per route (CPU-blend on navigation) vs the two-LUT GPU cross-fade.** A
   measured A/B on the iPhone-15: collapse base+route into one CPU-blended `Data3DTexture` per route change (one
   fetch always, a brief per-nav CPU blend) versus the two/three live GPU fetches — which wins under thermal
   throttle, and whether the per-nav blend stutters the navigation.
2. **The TSL `lut3D`-node cross-fade as a terminal grade node on `WebGPURenderer`.** Fold the base + signed
   route cross-fade into one `Fn` node that runs on both renderers (WebGL2 fallback), unifying with the doc-33
   AgX+CDL `ToneMappingNode` and the doc-34 dither node into a single terminal grade graph — the §4.8 port,
   productionized.
3. **A/E-masked saturation guard inside the route LUT path.** Whether a per-region (A/E-masked) saturation
   clamp lets the hot route LUT push the red fully brutalist while pinning the divine-fire white-gold neutral —
   coupling this doc to doc 22 (A/E stone light transport) and doc 33 deep-dive #3, so route mood never drags
   the sacred fire toward pink.
4. **Procedural route LUTs baked at build time from the `PAL` ramp + per-route warm/sat parameters.** Generate
   the three `.cube`s programmatically from `palette.js` `PAL` + a small `{warm, sat, contrast}` per-route
   spec (no Resolve round-trip), so the LUTs are reproducible from source, guaranteed palette-anchored and
   black-locked by construction, and trivially re-tunable when `PAL` changes — removing the hand-authored
   `.cube` as an opaque binary in the repo.
