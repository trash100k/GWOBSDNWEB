# 38 — Temperature-Coupled Post as One World Bus

_Phase-2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · target: iPhone 15 OLED, single WebGL2 renderer, strict mobile budget._
_Author lane: senior real-time-graphics / technical art · all cited sources 2025–2026._

> **The question this doc closes.** The Cohesion Map (§1.5, §4.2, rule 6) declares that one scalar — "how
> hot is the forge right now" — must drive the whole world _on one heartbeat_: emissive color/intensity,
> bloom, exposure, grade saturation, sparks, god-rays, heat-haze. Its sibling docs each lock one _consumer_:
> doc 33 locks the **operator** (AgX + warm CDL) and sketches a `heat`-rode exposure/sat ride; doc 35 locks
> **bloom** and rides its `intensity` off the same scalar; doc 36 locks the **per-route LUT** and damps it on
> the same bus. What none of them owns is **the bus itself** — the single authority that _computes_ `heat`,
> the damping law that keeps it sub-pumping, the fan-out contract that distributes it to every post stage with
> the right curve and the right clamps, and the rule that says **which** handles ride and which are nailed.
> This doc formalizes that authority: **the `forgeHeat` bus** — one number, one writer, one set of mapping
> curves — so the entire forge "runs hot as one coherent system across every route's compose pass," and the
> exposure ride never reads as auto-exposure pumping. It owns the _coupling_; it does not re-open the operator
> (doc 33), the bloom sizing (doc 35), the LUT (doc 36), the dither (doc 34), or the post-chain order (doc 20).

---

## 1. SCOPE — this element in the GAELWORX world

Every other Phase-2 finish doc answers "what is the right setting for _this_ effect?" This doc answers the
only question that makes those settings a _world_: **what single signal makes them all move together, and how
is it shaped so each effect gets the heat it needs without any of them lying about it?**

In a pure-void forge lit only by the metal (Cohesion Map §5), the audience reads "the forge is surging" not
from any one cue but from **synchrony**: when a hammer-strike lands or the scroll pours faster, the veins
brighten, the bloom widens, the highlights punch, the red goes a hair richer, more sparks spawn, the god-rays
thicken, and the air shimmers — **in the same frame**. That synchrony _is_ the cohesion proof (Cohesion Map
rule 6). The failure mode is the opposite: each effect breathing on its own timer, its own curve, its own
clock, so the world feels like a stack of independent animations that happen to be near each other. The
single most damaging version of that failure is **the exposure pump**: a global `toneMappingExposure` that
chases scene luminance with a visible lag reads as a cheap auto-exposure camera, not a forge — the one
artifact that instantly drops the build from "cinematic" to "web demo."

So the deliverable is a **bus**, not an effect. Concretely, one scalar `forgeHeat ∈ [0,1]` (plus a transient
`forgePulse` for the strike), computed once per frame by one writer, `dt`-damped, then **fanned out through
seven named mapping functions** to seven consumers:

| # | Consumer | What `forgeHeat` drives | Owner doc | Rides? |
|---|---|---|---|---|
| 1 | **Material emissive** | `uTemp` → `gw_forge(temp)` color+intensity | CM §1, doc 01 | yes (it _is_ the heat) |
| 2 | **Bloom intensity** | `intensity` scalar pulse | doc 35 | yes (cheap scalar) |
| 3 | **Tone-map exposure** | `toneMappingExposure` gentle ride | doc 33 | yes, **sub-pumping** |
| 4 | **Grade saturation** | CDL `uSat` | doc 33 | yes |
| 5 | **Spark spawn rate** | emitter `uSpawn` / point budget | doc 26/27 | yes |
| 6 | **God-ray weight** | `uGodRayStrength` / exposure-decay | doc 18/30 | yes |
| 7 | **Heat-haze strength** | `uHazeAmp` UV-warp amplitude | doc 16 | yes |

And **two values that are deliberately _not_ on the bus**: the CDL `uOffset` **black-point lock** (doc 33 —
the void must stay pixels-off no matter how hot the forge runs) and the dither amplitude (doc 34 — banding is
a constant display problem, not a heat problem). The bus's _exclusions_ are as load-bearing as its inclusions:
**every element heats together, but the void is the one constant the whole world is read against.**

The "keep exposure ride sub-pumping" clause in the brief is the sharpest single constraint here, and it gets
its own section (§2.2, §4.4). Exposure is the one bus consumer that operates on _the whole frame at once_, so
a mis-tuned ride is globally visible; AgX is exposure-sensitive (doc 33 §2.2), which amplifies the risk.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 The shape of a coupled-post bus — three architectures

**(a) The "many `useFrame` writers" anti-pattern (what GAELWORX must _not_ do).** Each effect component
subscribes its own `useFrame`, reads `forge.scrollDamped`/`forge.scrollVel` independently, and computes its
own `heat`. This is the path of least resistance in `@react-three/postprocessing` (each `<Bloom>`/`<Effect>`
gets a ref and a frame loop), and docs 33 and 35 _sketch_ it that way for locality. The 2026 R3F performance
guidance (utsubo, 2026-01-12) is blunt about why it rots: **N frame callbacks each doing the same scroll math
is N times the per-frame allocation/branch churn, and — fatally for cohesion — they damp at different λ and
read `forge` at subtly different points in the frame, so they drift out of phase.** A strike that should hit
every effect in one frame instead ripples across three frames because three writers sampled three slightly
different `heat` values. The synchrony that _is_ the cohesion proof is exactly what this architecture loses.

**(b) The single-writer shared-pool bus (the GAELWORX pick).** Exactly one headless `<ForgeDriver/>`
(Cohesion Map §4.2, already the sole author of the `U` uniform pool) computes `forgeHeat`/`forgePulse` **once**
and writes the seven fanned-out targets — directly into the post-effect uniform refs and into `gl.toneMappingExposure`. Every consumer reads the _same_ number from the _same_ frame, damped by the _same_
clock. This is the post-side extension of the pool pattern the world already uses for materials: the slab,
jewel, channels, and letters all bind the same `U.uTemp`; this doc adds the post effects to that same
single-author discipline. Cost: the post-effect refs must be reachable from the driver (a small ref registry,
§4.3). Benefit: one source of truth, perfect phase, alloc-free.

**(c) The TSL `uniform()`-node bus (the WebGPU/Phase-3 form).** The 2026 Codrops pipelines (Shader.se,
2026-05-19; False-Earth, 2026-04-21) and Maxime Heckel's TSL field guide (2025-10-14) build the entire post
chain as a node graph on `WebGPURenderer`, where a single `uniform(value)` node is _referenced by name_ inside
the bloom node, the tone-map node, and custom grade nodes simultaneously — so writing `heatUniform.value = h`
once updates every effect that references it, with no per-effect plumbing. This is the _native_ form of "one
bus, every effect," and it is where GAELWORX is headed (deep-dive #1). But it is a `WebGPURenderer` migration,
explicitly deferred past the judge device (Cohesion Map §10: WebGL2 + `onBeforeCompile` ships to the judge).
The architecture (b) is authored to be **TSL-portable** — `forgeHeat` is one scalar, its mapping curves are
pure functions — so the Phase-3 port is a re-host of the same bus, not a redesign.

### 2.2 The exposure-ride / pumping problem — the sharpest sub-topic

A global exposure that follows scene brightness is **auto-exposure / eye-adaptation**, and the literature on
making it _not pump_ is mature and directly applicable. Narkowicz's auto-exposure note (the canonical 2016
reference, still the cited basis in 2025 mpv/real-time threads) establishes the mechanism: eye adaptation
blends exposure across frames via an **exponential-decay smoothing** toward a target, and the _pump_ is what
happens when that smoothing is too fast (it visibly chases) or too slow (it lags and overshoots). The 2025
refinements (the mpv upward-auto-exposure SDR-stable thread, 2025; the patent-literature "adaptive temporal
smoothing" line) converge on the **asymmetric, scene-change-modulated speed**: smooth _slowly_ when the change
is small (kills flicker), converge _faster_ when the change is large (avoids lag) — but always through a
single-pole exponential, never a linear lerp.

For GAELWORX the situation is _easier_ than general auto-exposure in one decisive way and _harder_ in another:

- **Easier:** we are not measuring scene luminance and reacting to it (the classic feedback loop that pumps).
  We are driving exposure from a **known control signal** — `forgeHeat`, which we _author_ from scroll/strike.
  There is no luminance-histogram feedback loop, so the pathological "bright scene → lower exposure → darker
  scene → raise exposure" oscillation literally cannot occur. The exposure ride is **feed-forward**, not
  feedback. This is the single most important architectural decision for sub-pumping: **never key exposure off
  measured frame luminance; key it off the same authored `forgeHeat` the emissive uses.**
- **Harder:** AgX is exposure-sensitive (doc 33 §2.2: "expose to taste, then grade"), and the divine-fire A/E
  and white-hot pour sit on AgX's path-to-white shoulder, where a small exposure change moves a _lot_ of
  perceived brightness. So the ride amplitude must be **small** (doc 33 caps it at ±0.12) and the damping must
  be **gentle and critically-shaped** so the highlight doesn't visibly breathe.

The settled sub-pumping recipe, then: **feed-forward from `forgeHeat` (no luminance feedback), single-pole
`damp()` at a low λ, a hard amplitude clamp (±0.12), and a dead-zone** so micro-jitter in scroll velocity
doesn't translate into micro-flicker in exposure. §4.4 specifies all four.

### 2.3 The mapping-curve question — one scalar, seven different responses

A single `forgeHeat` cannot drive seven consumers _linearly_ — each wants a different response curve, and
getting these curves right is what makes the coupling read as "one physical system" rather than "seven knobs
on one slider." The 2025–2026 pattern (consistent across the post-2026 guide work and the material-ramp
literature) is **pure mapping functions per consumer**, all reading the one scalar:

- **Emissive** wants the full authored `gw_tempColor`/`gw_tempEmissive` ramp (CM §1.1–1.2) — already a curve.
- **Bloom intensity** wants a **roughly linear** ride with a small base (doc 35: `base + heat*0.5`) — bloom is
  the amplifier, it should track heat closely.
- **Exposure** wants a **gentle, clamped, near-linear** ride (±0.12) — the smallest response of all (§2.2).
- **Grade saturation** wants a **shallow** ride (doc 33: `+heat*0.06`) — the red gets _a hair_ richer, not
  neon, on surge.
- **Spark spawn** wants a **threshold-then-ramp** (`smoothstep`) — sparks should _surge_ above a heat
  threshold (the pour intensifying), not trickle linearly from cold.
- **God-ray weight** wants a **mid-biased** ride — rays are most legible at mid-high heat (enough emissive to
  seed them, not so blown that they wash); a `smoothstep(0.2, 0.9)` keeps them from appearing at cold.
- **Heat-haze** wants a **gated** ride — haze only above a heat floor (cold metal doesn't shimmer the air),
  `max(0, heat - 0.35)` scaled up, so the air is dead-calm when the forge is cool and roils when it's hot.

The mistake the curves prevent: a single linear fan-out makes _everything_ fade in together from zero, which
reads as a master-fader, not a forge. Different onset thresholds per consumer (haze gated high, bloom from the
floor, sparks thresholded) are what make the surge feel _physical_ — the bloom is already rising while the air
hasn't started to shimmer yet, exactly as real heat builds.

### 2.4 The transient channel — strike pulse vs steady heat

The bus carries **two** signals, not one, and conflating them is a known pitfall. `forgeHeat` is the _steady_
temperature (scroll-driven, slow); `forgePulse` is a _transient_ (the hammer-strike, `exp(-since*k)` decay,
fast). They fan out differently: the strike should **spike bloom and god-rays and sparks** hard and briefly
(impact), but should **barely touch exposure** (a global exposure spike on every strike is a strobe — the
worst pumping). Doc 33 and doc 35 both already add `+ strike` into their `heat` scalar; this doc's refinement
is to keep them **separate channels with separate fan-out weights**, so the strike's high-frequency content
goes to the effects that can take a snap (bloom, sparks — Brutalist-Snap brand motion) and is heavily
attenuated into the one effect that can't (exposure). This is the bus-level expression of the brand's
"impact, no bounce" motion law applied to light.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build one `forgeHeat`/`forgePulse` bus, authored feed-forward from the `forge` store, computed once per
frame by the existing `<ForgeDriver/>`, `dt`-damped with a single-pole `damp()`, and fanned out to the seven
post/material consumers through seven pure mapping curves — with exposure ridden gently (±0.12, dead-zoned,
feed-forward, never luminance-keyed) and the black-point + dither held off the bus entirely.** Specifically:

1. **One writer, one number.** `<ForgeDriver/>` (already the sole author of the `U` pool) computes
   `forgeHeat` and `forgePulse` and writes all seven targets in one `useFrame`. No per-effect heat math. This
   is architecture (b) §2.1 — the only one that preserves frame-perfect synchrony, which _is_ the cohesion
   proof (CM rule 6). Justification: docs 33/35 each sketched a local `useFrame` heat write; left
   un-unified, those drift out of phase and the strike ripples across frames. Centralizing is the difference
   between "the forge surged" and "some effects surged, then others."

2. **Feed-forward exposure, never feedback.** The exposure ride keys off the _authored_ `forgeHeat`, not off
   measured frame luminance. This structurally eliminates the auto-exposure oscillation (§2.2) — there is no
   feedback loop to pump. Combined with a ±0.12 clamp, a low damping λ, and a velocity dead-zone, the
   exposure "breathes" with the forge without ever reading as a chasing camera. This is the direct answer to
   the brief's "keep exposure ride sub-pumping."

3. **Seven curves, not one fader.** Each consumer gets its own onset/shape (§2.3): bloom from the floor,
   exposure gentle, sat shallow, sparks thresholded, god-rays mid-biased, haze gated-high. Different onsets
   are what make the surge feel like building heat, not a master volume.

4. **Two channels, weighted.** Steady `forgeHeat` and transient `forgePulse` fan out with separate weights;
   the strike snaps bloom/sparks/god-rays (Brutalist-Snap) and is heavily attenuated into exposure (no
   strobe). Brand motion law, expressed in light.

5. **The void is off the bus.** CDL `uOffset` (black-point) and dither amplitude never ride heat. The whole
   world heats; the void is the constant it's read against. Excluding them is a cohesion rule, not an
   omission.

6. **TSL-portable.** `forgeHeat` is one scalar and its mapping curves are pure functions, so the Phase-3
   WebGPU port (§2.1c, deep-dive #1) is a re-host into a shared `uniform()` node, not a rewrite.

**Net deliverable:** a `forgeHeat.js` bus module (the scalar + the seven mapping curves + the damping law), a
small post-effect **ref registry** so `<ForgeDriver/>` can write the effect uniforms, and the gentle clamped
exposure ride — all inside the existing single-writer/single-composer architecture, zero new passes, tuned on
the iPhone-15 OLED.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (in repo) — `gl.toneMappingExposure`, `THREE.MathUtils.damp`, `THREE.AgXToneMapping`. No upgrade.
- `@react-three/fiber` (in repo) — the single `useFrame` in `<ForgeDriver/>` (`dt`-aware).
- `@react-three/postprocessing` + `postprocessing` (in repo) — `<Bloom>` (`intensity`), the custom
  `ForgeGradeCDL` `Effect` (doc 33, `uSat`), and the god-ray / heat-haze effects (docs 18/16). The bus writes
  their uniform refs; no new dep.
- `src/store.js` `forge` store — the mutable signal source (`scrollDamped`, `scrollVel`, `strikeAt`). No new
  state; the bus is _derived_, never stored as React state mid-scroll (utsubo 2026).

### 4.2 The bus module — one scalar, the damping law, the seven curves

`src/scene/forgeHeat.js` — pure functions, no allocation, TSL-portable:

```js
import * as THREE from 'three'

// --- the one authored scalar (feed-forward; NO luminance feedback => structurally non-pumping) ---
// steady forge temperature 0..1 from the scroll/journey signal
export function computeForgeHeat(forge) {
  // scrollDamped is the slow base; a clamped slice of velocity adds "the pour is accelerating"
  const v = Math.min(forge.scrollVel * 0.25, 0.30)   // velocity contribution capped (no spikes)
  return Math.min(forge.scrollDamped + v + (forge.tempBias ?? 0), 1.0)
}
// transient strike pulse 0..1 (fast exp decay) — the Brutalist-Snap impact channel
export function computeForgePulse(forge, tNow) {
  if (!forge.strikeAt) return 0
  return Math.exp(-(tNow - forge.strikeAt) * 3.0)    // ~0.33s to 1/e
}

// --- the seven fan-out curves (each consumer's response to the ONE scalar) ---
const sstep = THREE.MathUtils.smoothstep
export const HeatMap = {
  bloom:    (h, p) => 0.9 + h * 0.5  + p * 0.6,                 // near-linear from a base + snap on strike
  exposure: (h, p) => 1.0 + h * 0.12 + p * 0.02,               // GENTLE, clamped; strike barely contributes
  sat:      (h, p) => 1.16 + h * 0.06 + p * 0.03,              // shallow; red a hair richer on surge
  spark:    (h, p) => sstep(0.30, 1.0, h) + p * 0.5,           // thresholded surge + strike burst
  godray:   (h, p) => sstep(0.20, 0.90, h) * (0.85) + p * 0.4, // mid-biased; rays legible at mid-high heat
  haze:     (h, p) => Math.max(0.0, h - 0.35) * 1.4 + p * 0.15,// GATED high: cold air is dead-calm
}
// low-tier variants drop the strike snap on the expensive consumers (godray/haze), keep the cheap ones
export const HeatMapLow = {
  ...HeatMap,
  godray: (h) => sstep(0.20, 0.90, h) * 0.85,                  // no strike snap on low (no godray pass anyway)
  haze:   (h) => Math.max(0.0, h - 0.35) * 1.4,
}
```

The curves are the art-direction surface — every onset threshold (`0.30` spark, `0.35` haze, `0.20` god-ray)
is a device-tuned number, not a magic constant. They live in **one file** so the whole world's heat response
is auditable in one place: the binding rule that no effect invents its own heat curve.

### 4.3 The single writer — `<ForgeDriver/>` fans out the bus

A small **ref registry** lets the headless driver reach the post-effect uniforms (the post effects register
their refs on mount; the driver reads them). This keeps the single-writer discipline without prop-drilling:

```jsx
// src/scene/forgeFx.js — the post-effect ref registry (mutable, alloc-free)
export const fx = { bloom: null, cdl: null, godray: null, haze: null, sparks: null }
```

```jsx
// src/scene/ForgeDriver.jsx — THE SOLE AUTHOR of the heat bus (one useFrame, dt-damped)
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'
import { U } from './forgeUniforms.js'
import { fx } from './forgeFx.js'
import { computeForgeHeat, computeForgePulse, HeatMap } from './forgeHeat.js'

export function ForgeDriver({ tier }) {
  const gl = useThree((s) => s.gl)
  const Map = HeatMap  // (swap HeatMapLow on 'low')

  // damped, persisted across frames (module-scope or refs — never React state)
  const s = { heat: 0, pulse: 0, exposure: 1, lastVel: 0 }

  useFrame((state, dt) => {
    const tNow = state.clock.elapsedTime
    // (1) compute the ONE scalar (+ transient), then dt-damp the steady channel
    const heatTarget = computeForgeHeat(forge)
    s.heat  = THREE.MathUtils.damp(s.heat, heatTarget, 3.0, dt)   // slow, smooth
    s.pulse = computeForgePulse(forge, tNow)                       // transient, not damped (it IS the decay)
    const h = s.heat, p = s.pulse

    // (2) MATERIAL bus — the same uTemp every hot material binds (CM §1.5)
    U.uTemp.value = h
    U.uHeat.value = Math.min(h * 0.5 + p, 1.0)

    // (3) EXPOSURE ride — sub-pumping: feed-forward, clamped, dead-zoned, gently damped
    const velJitter = Math.abs(forge.scrollVel - s.lastVel); s.lastVel = forge.scrollVel
    const expoTarget = velJitter < 0.004                        // dead-zone: ignore micro-jitter
      ? s.exposure
      : THREE.MathUtils.clamp(Map.exposure(h, p), 0.92, 1.14)   // hard clamp ±~0.12 around 1.0
    s.exposure = THREE.MathUtils.damp(s.exposure, expoTarget, 4.0, dt)  // gentle single-pole
    gl.toneMappingExposure = s.exposure

    // (4) BLOOM intensity (cheap scalar — never animate radius/levels)
    if (fx.bloom) fx.bloom.intensity = Map.bloom(h, p)

    // (5) GRADE saturation (CDL uSat) — black-point uOffset is NOT touched (void off the bus)
    if (fx.cdl)   fx.cdl.uniforms.get('uSat').value = Map.sat(h, p)

    // (6) SPARK spawn rate
    if (fx.sparks) fx.sparks.uniforms.get('uSpawn').value = Map.spark(h, p)

    // (7) GOD-RAY weight
    if (fx.godray) fx.godray.uniforms.get('uStrength').value = Map.godray(h, p)

    // (8) HEAT-HAZE amplitude (gated high)
    if (fx.haze)   fx.haze.uniforms.get('uAmp').value = Map.haze(h, p)
  })

  return null
}
```

Every consumer reads the **same `h` and `p` from the same frame**, damped by the same clock — frame-perfect
synchrony. The post effects bind their refs on mount:

```jsx
// in Effects.jsx — register refs so the single writer can drive them
<Bloom ref={(r)=>{ fx.bloom = r }} mipmapBlur luminanceThreshold={0.58} radius={0.82} intensity={0.9} />
<ForgeGradeCDL ref={(r)=>{ fx.cdl = r }} slope={[1.06,1.02,0.98]} offset={[-0.012,-0.012,-0.014]}
               power={[0.94,0.96,1.0]} sat={1.16} />
{high && <GodRays ref={(r)=>{ fx.godray = r }} … />}
{high && <HeatHaze ref={(r)=>{ fx.haze = r }} … />}
```

### 4.4 The sub-pumping exposure ride — the four guards, spelled out

This is the brief's sharpest constraint. Four independent guards, each defeating one pumping mode:

1. **Feed-forward, not feedback (the structural guard).** `Map.exposure(h, p)` reads the _authored_ heat, not
   measured luminance. There is **no luminance histogram, no readback, no feedback loop** — so the classic
   auto-exposure oscillation (bright→darken→brighten) is _impossible_, not merely tuned away. This is the one
   that matters most.
2. **Hard amplitude clamp (the magnitude guard).** `clamp(…, 0.92, 1.14)` — the exposure can never move more
   than ~±0.12 from neutral. AgX's path-to-white moves a lot of perceived brightness per exposure stop (doc
   33 §2.2), so a small window is a large _visible_ ride; ±0.12 is the doc-33-locked ceiling.
3. **Gentle single-pole damp (the velocity guard).** `damp(…, 4.0, dt)` — a low λ means exposure _eases_ to
   its target over ~quarter-second, never snaps. `damp` is frame-rate-independent (the `dt` form, never
   `lerp(a,b,k)`), so the ride is identical at 60 and 120 Hz (CM rule 6).
4. **Velocity dead-zone (the jitter guard).** Micro-jitter in `scrollVel` (Lenis settling, finger
   micro-moves) must not translate into micro-flicker in a _global_ effect. The dead-zone holds exposure
   steady until velocity change exceeds a floor (`0.004`), so a still or gently-settling scroll yields a
   _still_ exposure. Without this, a "stopped" scroll still shimmers the whole frame — the subtlest pump.

The strike's contribution to exposure (`+ p * 0.02`) is deliberately the smallest fan-out weight in the whole
bus: a hammer-strike must _not_ strobe the global exposure. Its energy goes to bloom (`+ p*0.6`) and sparks
(`+ p*0.5`) — the effects that can take a Brutalist-Snap impact — and is all but withheld from the one effect
that operates on every pixel at once.

### 4.5 Why the merged pass makes the fan-out free

The CDL `uSat`, god-ray `uStrength`, and heat-haze `uAmp` are **uniform writes into already-running shaders**
— the CDL/vignette/dither fold into one merged `EffectPass` (CM §6; doc 33 §6), bloom and god-rays/haze are
their own passes but already mounted. Riding the bus is therefore **N uniform writes per frame, zero recompiles,
zero new passes** (utsubo 2026: uniform writes are compositor-safe; never trigger a recompile, never realloc).
The exposure write is a single renderer property. The whole bus costs **a handful of float writes** on top of
a frame that was already running every one of these effects — the cohesion is _free_ because the effects
already exist; the bus just makes them move together.

### 4.6 TSL-portable form (Phase-3 note)

In the WebGPU/TSL port (§2.1c), `forgeHeat` becomes a single `uniform(0)` node; the seven curves become TSL
node expressions (`smoothstep`, `mul`, `add`) referenced inside the `bloomNode`, the `ToneMappingNode`, and
the grade nodes. Writing `heatNode.value = h` once updates every effect that references it — the native
"one bus, every effect" the Codrops 2026 pipelines demonstrate. Because §4.2 is already one scalar + pure
curves, the port is a transcription, not a redesign (deep-dive #1).

---

## 5. COHESION — shared palette / lighting / uniforms

- **One scalar, one authority.** `forgeHeat` is the post-side twin of `uTemp`: the material bus (CM §1.5) and
  the post bus are driven by the **same** `<ForgeDriver/>` from the **same** `forge`-store math in the **same**
  `useFrame`. A cooling vein and a dimming bloom halo are the same metal one optical step apart because they
  read the same number. This is the literal mechanism of "shares uniforms so nothing looks bolted-on."
- **Palette is still the selector.** The bus changes _intensity_, never _hue identity_. Bloom still only
  catches the >1 accent band (`PAL.hot`/`emberHot`/`gold`/`divine`, CM §3.1); the sat ride enriches the red
  toward `#C1292E`/`#E85D04` but never introduces a new color; exposure scales radiance uniformly. No bus
  consumer invents color — they amplify the palette the materials already authored.
- **Warm-only, void-constant (brand law).** No cool/green/blue enters any ride. And the **black-point is off
  the bus** — the CDL `uOffset` (doc 33) and the dither (doc 34) never see `forgeHeat`, so the void stays
  pixels-off black at every heat level. The world heats; the void is the constant.
- **One clock, one rAF, dt-damped.** Every ride animates via `THREE.MathUtils.damp(cur, tgt, λ, dt)` in the
  one writer — no `setInterval`, no `lerp(a,b,k)`, no competing rAF (CM rule 6). Frozen to a constant on
  `static`.
- **The strike is the cohesion proof.** `forge.strikeAt` → `forgePulse` → bloom + sparks + god-rays + veins +
  jewel + caustic surge **in the same frame** (CM rule 6). That single-frame synchrony — provable by firing a
  strike and watching everything snap together — is the visible evidence the bus works. If any effect lags the
  strike by a frame, it isn't on the bus.
- **Per-route via presets, not per-route post.** The bus is the same in every chamber; per-route mood is the
  LUT cross-fade (doc 36) and the `tempBias`/`heat` preset fields in `scenes.js` (CM §9), which feed
  `computeForgeHeat` (the `tempBias` term in §4.2). The scrying-pool runs the bus _cool_ (low `tempBias`); the
  forge-mouth arch runs it _hot_ — same bus, different base, never a different system.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **The bus is nearly free.** It is one `useFrame` doing ~a dozen float writes and one `damp` per consumer —
  well under 0.1 ms, inside the ~2–3 ms JS/React/Lenis budget line (CM §10). It adds **zero passes** and
  **zero recompiles**: every write targets a uniform on an already-mounted effect or the renderer's exposure
  property (utsubo 2026: uniform writes are compositor-safe). Unifying the heat math into one writer is in fact
  a perf _win_ over the per-effect-`useFrame` anti-pattern (§2.1a) — one frame callback instead of five.
- **Alloc-free loop (INP insurance).** No `new` in the `useFrame`; the damped state lives in a persisted
  object/refs (§4.3), the curves are pure and allocation-free (CM §10, utsubo 2026). A `forge` store read is a
  plain property access, not React state — never trigger a re-render mid-scroll.
- **Tier ladder** (mirrors `Effects.jsx`):
  - **`high`** — all seven consumers ride; `HeatMap` with the strike snap on bloom/sparks/god-rays/haze.
  - **`low`** — bloom/exposure/sat/spark ride (cheap scalar writes); **god-rays and heat-haze are unmounted**
    (CM §10), so their curves simply have no target — `if (fx.godray)` guards make the fan-out degrade by
    _absence_, not by a branch. `HeatMapLow` drops the strike snap on the expensive (absent) consumers.
  - **`static`** — `<ForgeDriver/>` writes once with `forgeHeat` frozen (`uTime` frozen to `2`, CM §10), then
    `frameloop='demand'`; the post effects are unmounted, exposure is a constant. The bus produces one
    coherent still, not a frozen-mid-pump frame — verify on the panel that the frozen `forgeHeat` lands the
    poster on-brand (a warm, on-temperature still, not a cold or blown one).
- **Adaptive ladder.** Under `PerformanceMonitor` factor dips, the consumers drop in the doc-locked order
  (AdaptiveDpr → SMAA → CA → god-rays → haze → demote `high`→`low`); as each consumer unmounts, its `fx.*`
  ref goes null and the `if (fx.x)` guard skips it — the bus self-prunes with no special-casing. **Exposure,
  bloom, sat, and the black-point lock are never dropped** — they are the coherence floor, not polish.
- **Exposure ride is a quality lever, not a perf one.** The sub-pumping tuning (clamp, λ, dead-zone) costs
  _tuning attention on the OLED_, not GPU time. The pump does not simulate on a laptop LCD — a slow exposure
  breath is far more visible against true black. Tune it on the phone.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (sequential — each unblocks the next; this is a _device_ loop):**

1. **Land the scalar first, wired only to `uTemp`.** Build `computeForgeHeat`/`computeForgePulse` and drive
   _only_ the material `U.uTemp` from it (the slab veins). Confirm scroll heats the veins and a strike pulses
   them. This is the spine; verify it before any post consumer hangs off it. (CM §8 Phase A: the temperature
   scalar is load-bearing everywhere — get it right before any consumer.)
2. **Add bloom intensity next (the easy, forgiving consumer).** Wire `Map.bloom`. Bloom tracking heat is the
   most legible coupling and the least likely to misbehave — it confirms the fan-out plumbing (the ref
   registry, the single writer) works before you touch the dangerous consumer.
3. **Add exposure with all four guards from the start — on the OLED.** Do _not_ ship a naive
   `gl.toneMappingExposure = 1 + heat*k` and "tune later." Build the clamp, the gentle damp, the dead-zone,
   and the feed-forward source in one go (§4.4), then tune the amplitude on the phone by scrolling fast and
   stopping abruptly: the exposure must _ease_ and _settle dead-still_, never chase or shimmer. This is the
   step the laptop lies about.
4. **Add sat, then the gated consumers (sparks, god-rays, haze).** Tune each onset threshold on-device so the
   surge feels staged: bloom rising while the air is still calm, haze only kicking in when the metal is
   genuinely hot. The thresholds are the art direction.
5. **Wire the strike pulse last, with its asymmetric weights.** Confirm a strike snaps bloom/sparks/god-rays
   in one frame (Brutalist-Snap) while exposure barely twitches. Fire repeated strikes and watch for an
   exposure strobe — if the global frame brightness flickers per strike, the `p` weight on exposure is too
   high; it should be the smallest weight in the bus.

**Specific pitfalls:**

- **Keying exposure off measured luminance.** The instant you sample frame brightness and react to it, you
  have a feedback loop that _will_ pump. Key exposure off the authored `forgeHeat`, always. (§4.4 guard 1.)
- **Per-effect `useFrame` heat math.** N writers reading `forge` at N points in the frame drift out of phase;
  the strike ripples across frames; cohesion is lost. One writer, one number. (§2.1a.)
- **`lerp(a, b, k)` instead of `damp(a, b, λ, dt)`.** Frame-rate-dependent damping makes the ride faster on a
  120 Hz iPad than a 60 Hz phone — the exposure breath changes speed with refresh rate. Always `dt`-damp.
- **Riding the black point or the dither off heat.** The void grey-shifts on surge — the one thing the OLED
  can't forgive. The black-point and dither are off the bus, period. (§5, doc 33 §4.4.)
- **Strike strobing exposure.** A hammer-strike that spikes global exposure reads as a camera flash, not a
  forge. The strike's exposure weight is the smallest in the bus; its energy goes to bloom/sparks.
- **One linear fan-out for all seven.** Everything fading in together from zero reads as a master fader, not a
  physical system. Different onsets per consumer (haze gated, bloom from the floor) are the whole point.
- **Animating `radius`/`levels`/kernel for a pulse.** Reallocates the bloom pyramid (doc 35). The bus only
  ever rides _scalars_ (intensity, exposure, sat, amplitude) — never anything that recompiles or reallocs.
- **Tuning the exposure ride on a laptop.** The pump, the dead-zone settle, and the void-constancy under
  surge are _device reads_. `qa-route` (0 console errors) proves it compiled; the iPhone-15 OLED proves it
  doesn't pump. Tune on the phone.

---

## 8. SOURCES (2025–2026)

1. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** — 2026 — the 2026
   post-chain: tone-map as the terminal stage, exposure/bloom as runtime uniforms, merged passes, half-res
   bloom, the RenderPipeline (WebGPU + auto WebGL2 fallback) direction for a unified node bus.
   <https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026>
2. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** — 2026-01-12 — uniform writes vs
   recompiles, alloc-free `useFrame`, `dt`-frame-independence, half-res bloom ≈ 2× frame-rate, `mediump` ≈ 2×
   `highp` on mobile, prefer pmndrs merged passes — the perf basis for "the bus is free."
   <https://www.utsubo.com/blog/threejs-best-practices-100-tips>
3. **three.js forum — "Is AGX tonemapping implemented correctly?"** — 2025 — AgX exposure-sensitivity, the
   "expose to taste then grade" workflow, flatness/low-contrast — why the exposure ride must be small and
   gentle on AgX. <https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609>
4. **three.js forum — "Tone Mapping Overview"** — 2025 — operator comparison, exposure as the pre-curve
   control, path-to-white vs per-channel — the operator context the exposure ride feeds.
   <https://discourse.threejs.org/t/tone-mapping-overview/75204>
5. **GitHub — mpv-player/mpv Discussion #18119, "upward auto-exposure / eye-adaptation GLSL shader SDR
   (temporal stable)"** — 2025 — temporally-stable exposure via exponential smoothing, the asymmetric
   slow/fast convergence that prevents pumping/flicker — the sub-pumping basis applied feed-forward here.
   <https://github.com/mpv-player/mpv/discussions/18119>
6. **Krzysztof Narkowicz — "Automatic Exposure"** — canonical reference, cited through 2025 in the mpv/real-time
   threads — eye-adaptation as exponential-decay blending toward a target, and why too-fast/too-slow smoothing
   pumps; the mechanism GAELWORX replaces with a feed-forward authored scalar.
   <https://knarkowicz.wordpress.com/2016/01/09/automatic-exposure/>
7. **Codrops — "80s Business Tech and Seamless Scene Transitions: Inside Shader.se's Scroll-Driven WebGPU
   Pipeline"** — 2026-05-19 — a single scroll/progress uniform driving the whole TSL post pipeline; shared
   `uniform()` nodes referenced across effects — the native "one bus, every effect" form (Phase-3 target).
   <https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/>
8. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World" (Ming Jyun Hung)** — 2026-04-21 —
   TSL node-graph post chain (CA, vignette, bloom, tone-map terminal) with shared GPU-resident state read by
   any node — the WebGPU bus the §4.6 port targets.
   <https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/>
9. **Maxime Heckel — "Field Guide to TSL and WebGPU"** — 2025-10-14 — `uniform()` nodes shared across a node
   graph, porting post/tone-map to TSL, WebGPU on iOS Safari — the Phase-3 host for a single shared `forgeHeat`
   node. <https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/>
10. **Maxime Heckel — "On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching
    for the Web"** — 2025-06-10 — god-ray/volumetric strength as a post uniform, blue-noise dithered step
    count, intensity coupled to the light source — the god-ray consumer's basis on the bus.
    <https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/>
11. **react-postprocessing docs — `Bloom` / `ToneMapping` effects** — pmndrs, current 2025–2026 — `intensity`
    as a runtime uniform, `ToneMappingMode` (incl. `AGX`), renderer-flag-vs-pass, `mipmapBlur` — the consumers
    the bus writes. <https://react-postprocessing.docs.pmnd.rs/effects/bloom> ·
    <https://react-postprocessing.docs.pmnd.rs/effects/tone-mapping>
12. **GitHub — pmndrs/postprocessing** — current 2025–2026 — the `EffectPass` merge model (compatible effects
    compile into one fragment shader), uniform-update-without-recompile — why riding the bus costs zero passes.
    <https://github.com/pmndrs/postprocessing>

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The shared `forgeHeat` TSL `uniform()` node on `WebGPURenderer`.** Productionize §4.6: one `uniform(0)`
   node referenced by the bloom node, the AgX `ToneMappingNode` (doc 33 deep-dive #1), the grade nodes, and the
   god-ray/haze nodes, so a single `heatNode.value = h` write fans out natively — removing the ref registry and
   the per-effect writes, with a WebGL2-fallback bus so the judge device is unaffected.
2. **Feed-forward vs measured-luminance hybrid exposure.** Whether a _tiny_ measured-luminance correction
   (a downsampled average, heavily damped) layered _under_ the dominant feed-forward `forgeHeat` exposure ride
   adds realism (the divine-fire A/E genuinely raising scene brightness) without reintroducing the pump — the
   controlled reopening of the feedback loop, measured on the iPhone-15 panel.
3. **Per-consumer onset-curve calibration on the surge.** A measured study (not eyeball) of the seven onset
   thresholds (`spark 0.30`, `haze 0.35`, `god-ray 0.20`, etc.) across a full cold→hot scroll surge on the
   OLED, to derive the curve set that reads most convincingly as "building heat" rather than "master fader" —
   coupling this bus to the choreography/pacing pass (CM §8 step 14).
4. **The strike-channel frequency split.** Formalize `forgePulse` as a two-term transient (a fast snap + a
   slower after-glow) and tune its asymmetric fan-out weights so a hammer-strike reads as Brutalist-Snap impact
   on bloom/sparks while leaving exposure and the void untouched — the bus-level expression of the brand motion
   law, A/B-tested against a single-decay pulse.
