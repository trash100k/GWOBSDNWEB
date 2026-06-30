# 58 — Pour-Front-Locked Rack-Focus Grammar

_Phase 2 graphics deep-dive · GAELWORX forge world · cluster **I-camera-motion**. Builds on Phase-1 **28
(cinematic-camera-dof)** and **27 (scroll-camera-paths)**, and on Phase-2 **42 (live GPGPU fill field)**,
**39 (master forge uniform pool `U`)**, and **56 (act-segmented pacing curves)**. Target: iPhone 15 (OLED),
one WebGL renderer (r3f / three.js r17x), warm-forge palette. Topic: bind the DOF focal plane to the **actual
metal pour-front shared uniform** — `forge.focusDist` driven by `U.uPourFront`, not the flaky `target` prop
nor a hand-tuned curve offset — so focus literally chases the molten front as it fills the GAELWORX letters,
with a **per-act rack-easing curve** (dwell-sharp on the cast word, soft transit through the channels), and
with the particle-CoF embers reading the **same `forge.focusDist`** so the sparks and the post DOF defocus on
one focal plane. The "it's-photographed" detail._

> **Reads on top of:** `00-COHESION-MAP.md` (§4.2 the master `U` pool — `uPourFront` is a first-class member;
> §6 the post-FX order — DOF before bloom, `worldFocusDistance` "locked to the pour-front, *not* the flaky
> `target` prop"; §7 rule 8 "shares the channel curve data three ways" — fill, **camera focus**, spark orbit);
> Phase-1 **28** (the lens model + the `worldFocusDistance`-not-`target` ruling + the particle-CoF embers);
> Phase-2 **42** (the live fill field that *owns* the pour-front world position the focus chases — analytic
> on `low`/`static`, GPGPU-flooded on `high`); Phase-2 **56** (the `gw_pace` act remap whose dwell windows
> this rack-curve must align to). Phase-1 doc 28 §9 named this as deep-dive candidate #1 — "the highest-
> leverage *it's-photographed* detail." This is that build.

---

## 1. SCOPE — this element in the GAELWORX world

In the GAELWORX forge the single most-watched motion is the **white-hot leading edge of the pour** — the
front of living metal as it runs the Celtic-interlace channels, branches over/under, rejoins, and floods the
`GAELWORX` letterforms left-to-right. The cohesion map calls that front a *shared signal*: `U.uPourFront`
(a `vec3` world position + a scalar arc-coordinate) that the channel fill reads (`phase2/42`), the spark
orbiters chase (`phase2/26`), and — the subject of this doc — the **camera focuses on**.

Phase-1 doc 28 built the lens: a damped `camera.fov`, a finale dolly-zoom, CA/vignette/barrel "glass," the
particle-CoF embers, and a real `<DepthOfField>` pass focused via `worldFocusDistance`. But doc 28 fed that
focus from a *placeholder* — `forge.pourFront ?? ORIGIN`, a fall-back to the slab centre, with the explicit
note "the pour-front already has a world position (doc 27's `FOCUS` curve / pour-front uniform) — feed
`camera.position.distanceTo(pourFront)`." It deferred the actual binding. **This doc owns that binding** and
upgrades it from "distance to a point on a hand-authored curve" to "distance to the *live front of the
simulated metal*, with a cinematographer's rack-pull grammar layered on top."

The difference is the whole game between "a 3D scene with DOF on" and "a photographed forging." When the metal
crosses from the channel into the throat of the **G**, a real focus puller would have already racked focus to
the **G**'s front face — anticipating, not chasing. When the front pools at the four-fork crotch
(`phase2/21`) and hesitates, focus should *dwell* there, sharp, while the out-of-focus void behind blooms.
When the pour sprints down a straight transit channel, focus should *soften through the transit* — the
subject is "in motion," the eye is carried, the channel walls smear into warm bokeh — and then **snap-settle**
crisp the instant the front arrives at the next letter. That asymmetry — **soft, momentum-carrying transit;
hard, dwelling arrival** — is the rack-focus *grammar*, and it is the exact camera-lens twin of the
`gw_pace` dwell/transit pacing (`phase2/56`) and the `Content.jsx` `HOLD`/`FADE` copy rhythm. The eye, the
copy, and now the *focal plane* all dwell-then-transit on the same act boundaries.

Hard constraints inherited from the world: **one WebGL renderer / one composer / one `useFrame` writer**;
strict iPhone-15 budget (DOF is the one genuinely expensive post pass — tier-gated, `resolution:480`,
`TiltShift2` on `low`, nothing on `static`); **no runtime EXR**; warm-forge palette; Brutalist-Snap motion
(damped, **no overshoot, no bounce** — a rack-pull *arrives*, it does not spring). And the binding must use
`worldFocusDistance`, **never `target`** (the documented-flaky path for a moving local-space subject —
r3f Discussion #3113).

The files under the knife: `src/store.js` (add `forge.focusDist`/`focusRange` + the `RACK` table +
`gw_rack()`), `src/scene/forgeUniforms.js` (`U.uPourFront` is the source of truth — already specified in
`phase2/39`), `src/scene/CameraRig.jsx` (read `U.uPourFront`, run the rack curve, write `forge.focusDist`),
`src/scene/Effects.jsx` (the `<DepthOfField>` reading `forge.focusDist` per frame), `src/scene/Embers.jsx`
(point-CoF reading the *same* `forge.focusDist`).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The element decomposes into four decisions: **(A)** how the focus *target* is obtained from the world (the
binding — distance-to-uniform vs depth-buffer autofocus vs raycast vs `target` prop); **(B)** what *easing
grammar* shapes the rack pull (raw damp vs per-act rack curve vs velocity-aware aperture); **(C)** how the
defocus is *rendered* (post `DepthOfField` vs `TiltShift2` vs particle-CoF vs TSL depth-node DOF); **(D)** how
the focal plane is *shared* so post DOF and particle embers never disagree. Each judged against the
iPhone-15 fill-rate envelope and the one-renderer / no-WebGPU-on-the-judge constraint.

### 2A. Obtaining the focus target

**2A.1 — `worldFocusDistance` = `camera.position.distanceTo(U.uPourFront)` (RECOMMENDED).** The pour-front
already lives as a shared `vec3` world position in the master pool `U` (`phase2/39`/`42`). Compute the
camera→front world distance each frame, damp it, and feed it to `DepthOfField.worldFocusDistance`. This is the
pattern the 2025 r3f community converged on: r3f Discussion #3113 ("Depth Of Field: Target vs
WorldFocusDistance") and the worked snippet — `dofTarget.getWorldPosition(worldTarget);
dofCam.getWorldPosition(worldCam); worldFocusDistance = worldCam.z − worldTarget.z` (or `.distanceTo` for a
true Euclidean rack). The discussion's verdict, still the live reference in 2025–2026: **`worldFocusDistance`
"consistently works" for a moving subject; the `target` prop is flaky for moving local-space objects.**
- **Quality:** Exact — focus is locked to the literal metal front, sub-pixel accurate, no guesswork.
- **Perf:** One `distanceTo` + one `damp` per frame. Free.
- **Mobile:** Free at every tier (the *distance* is free; the DOF *blur* is the cost, gated separately).
- **Cohesion-fit:** **Maximal.** The focus reads the *same* `U.uPourFront` the channel fill and spark orbit
  read — the literal embodiment of cohesion-map §7 rule 8. **The pick.**

**2A.2 — `Autofocus` depth-buffer hit-test (react-postprocessing) — borrow the easing, reject the autofocus.**
`Autofocus` (and ektogamat's `AutoFocusDOF`, which it derives from) reads the depth buffer at a screen point
and eases focus to whatever is under it (`smoothTime`, `focusRange`, `bokehScale`, `mouse`, `manual`). It is
the canonical *rack-focus easing* tool — `api.update(delta)` per frame with built-in `smoothTime` damping.
But its native mode focuses on the **cursor**, which a mobile-first scroll experience has none of, and its
depth-read picks the *nearest surface under a point*, not "the hot front of the pour" specifically. We want
focus **driven by the journey/pour**, not by where a finger happens to be.
- **Verdict:** Adopt the *easing model* (we damp `focusDist` ourselves with a per-act λ — §4), use `manual`
  mode if we adopt the component at all, and **never** the mouse-autofocus path. In practice `DepthOfField`
  + our own damp is fewer moving parts than `Autofocus manual` + driving its target. **Borrow, don't adopt.**

**2A.3 — Raycast against the channel/letter geometry.** Cast a ray down the look-ahead direction, focus on
the first hit. Robust for arbitrary subjects, but it is *redundant* here — we already **know** the front's
world position analytically/from the field; raycasting to rediscover it is wasted work and adds a CPU BVH
query per frame. **Reject** — the front is a known uniform, not an unknown surface.

**2A.4 — The `target` prop (a `Vector3` the effect focuses on).** The "obvious" API. **Rejected by the world**
— cohesion-map §6 and doc-28 both name it as the flaky path for moving local-space subjects (r3f #3113). It
recomputes focus internally from a world matrix that lags for parented/animated objects. **Never use for the
moving pour-front.**

### 2B. The rack-easing grammar

**2B.1 — Single global damp (the doc-28 floor).** `forge.focusDist = damp(focusDist, targetDist, 4, dt)`.
One exponential smoother, frame-rate-independent, no bounce. This *is* a cinematic rack at a constant rate —
better than a snap — and it is the correct **floor**. But it is rate-*uniform*: the rack pulls at the same
speed whether the front is dwelling in a letter or sprinting a transit channel. A real focus puller does not
rack at constant speed; they **anticipate the arrival and ease hard into it, and let the transit drift**.
- **Verdict:** Keep as the fallback / `low`-tier behaviour; **upgrade it per-act** (2B.2) on `high`.

**2B.2 — Per-act rack curve `gw_rack(act, local)` (RECOMMENDED).** A small table mapping each of the six acts
(`Ignition → The Core → The Draw → The Clan → The Arsenal → Point the Sword`, already in `store.js`) to a
**rack λ** (how aggressively focus chases the front in that act) and a **range bias** (how wide the in-focus
band is). Anchor acts (Ignition, The Arsenal, Point the Sword) get **high λ + narrow range** = focus
snap-settles crisp and *dwells sharp* on the cast word. Transit acts (The Core, The Draw, The Clan) get **low
λ + wide range** = focus drifts softly, carrying momentum, the channel walls smearing into warm bokeh. This is
the direct lens-twin of `gw_pace` (`phase2/56`): same six acts, same boundaries (`RACK.at === ACTS.at ===
PACE.at`), same `outQuart`-arrive / `inOutSine`-glide easing vocabulary — so the **focal plane, the camera
pacing, and the copy frames all dwell-then-transit on the same beats**. This is exactly the "spread each
section as a keyframe, find the keyframe from the section index, settle with a custom ease" model Codrops'
*How to Build Cinematic 3D Scroll Experiences with GSAP* (19 Nov 2025) builds with its `cinematicSilk` /
`cinematicFlow` eases and `scrub:1` follow — done here as pure store math + `damp`, not a GSAP timeline.
- **Quality:** Excellent — the asymmetric soft-transit/hard-arrival is *the* rack-focus tell.
- **Perf/Mobile:** ~6 scalar ops/frame. Free.
- **Cohesion-fit:** **Best** — one easing vocabulary across eye, pace, and copy. **The pick.**

**2B.3 — Velocity-aware aperture (additive).** `forge.focusRange = baseRange + scrollVel * k` — a flick
"opens the aperture," widening the in-focus band so a fast scroll doesn't strobe focus. Doc-28 already
specifies the seed (`2 + scrollVel*1.5`); here it is folded into the per-act range bias so a transit flick
opens *wider* than an anchor flick. **Adopt as a modifier on 2B.2.**

### 2C. Rendering the defocus

**2C.1 — Post `DepthOfField` (`worldFocusDistance`), high-tier, `resolution:480`.** The real CoC + bokeh-blur
pass from pmndrs `postprocessing` via react-postprocessing v3.0.4 (2025-02-20), already in the repo. Renders a
CoC pass + a downsampled bokeh blur, composites. **The hero defocus on `high`.** Cost is the one real post
expense — tamed by `resolution:480`, modest `bokehScale ≤ 3`, high-tier gate (cohesion-map §6, doc-28 §6).

**2C.2 — `TiltShift2` (low tier).** A directional gradient blur (no CoC pass) that blurs top/bottom bands —
the cheap shallow-focus fake. The GAELWORX hero is a low, along-the-letter-row shot, so the horizontal band
matches the composition. **The `low`-tier substitute** — but note: tilt-shift blurs by *screen-Y*, not depth,
so it **cannot rack** to the pour-front. On `low` the rack-focus *grammar* degrades to "fixed band + the
particle-CoF embers carry the focal read" (§6). Honest, on-brand, cheap.

**2C.3 — Particle-CoF embers (every tier).** Each spark's screen size + alpha is a function of
`|viewDist − focusDist| / focusRange`, computed in the vertex shader, so out-of-focus embers become soft
discs **even when post DOF is off**. This is the cheapest bokeh in the build (a uniform + a size attribute on
points already drawn) and the *only* defocus the `static`/`low` tier gets that **actually reads the
pour-front focal plane** (tilt-shift can't). The 2025 point-sprite-CoC technique — "in a vertex shader, fetch
depth, calculate circle of confusion, scale the sprite" — applied to embers that are *already* additive
points orbiting the front. **Mandatory at every tier; it is the focal-plane read on mobile.**

**2C.4 — TSL / WebGPU depth-node DOF (the deferred future).** three r17x ships a `DepthOfFieldNode` (new API,
`webgpu_postprocessing_dof` example) and TSL tilt-shift built from the depth buffer with "a simple auto-focus
approximation" updating per frame; Heckel's *Field Guide to TSL and WebGPU* (Oct 2025) and the
`webgpu_postprocessing_dof` example show a node-graph DOF sampling the depth buffer directly — no wrapper
friction, per-pixel CoC, and the focus distance is just another `uniform()` node the `<ForgeDriver/>`-twin
`.onFrameUpdate()` writes. **Best-in-class quality/perf, deferred:** iOS Safari WebGPU has landed but coverage
is uneven (Heckel, 2025), and betting the judge device on the less-tested `WebGPURenderer` WebGL-fallback is
the documented mistake (cohesion-map §10). **Author the focus binding so the port is a re-host** — `forge.
focusDist` maps 1:1 to a `uniform()` focus node feeding `DepthOfFieldNode.focusDistance`.

### 2D. Sharing the focal plane

**2D.1 — One scalar, two consumers (RECOMMENDED).** `forge.focusDist` (+`focusRange`) is the **single focal
plane**: the post `DepthOfField` reads it per frame in `Effects.jsx`, and the ember vertex shader reads it via
`U.uFocusDist`/`U.uFocusRange` (added to the master pool `U`). One write, two reads, never out of sync — so a
spark drifting into the void blooms into the *same* soft disc the post DOF would give it, and a spark riding
the front stays the *same* crisp pinpoint the subject is. **The pick** — and it promotes `focusDist`/
`focusRange` into the master pool so they are cohesion-locked like `uTemp`.

**Landscape verdict:** **2A.1 + 2B.2(+2B.3) + 2C.1/2C.3 + 2D.1.** Bind `worldFocusDistance` to
`camera.position.distanceTo(U.uPourFront)`, shaped by a per-act `gw_rack` curve (soft transit, hard arrival)
with a velocity-opened aperture, rendered as post `DepthOfField` on `high` / `TiltShift2`+particle-CoF on
`low` / particle-CoF only on `static`, with `forge.focusDist`/`focusRange` promoted to the master pool `U` so
post DOF and the embers defocus on one shared plane. `Autofocus`'s easing is borrowed (we damp ourselves),
`target` is rejected, raycast is redundant, TSL DOF is the authored-portable future.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Promote `focusDist`/`focusRange` into the master pool `U`. Each frame, the `CameraRig` reads the shared
pour-front world position `U.uPourFront`, computes `camera.position.distanceTo(front)`, and damps
`forge.focusDist` toward it with a *per-act rack λ* from a `RACK` table (high λ = hard arrival on anchor acts;
low λ = soft drift on transit acts) plus a velocity-opened `focusRange`. The post `<DepthOfField>`
(`worldFocusDistance`, high-tier, `resolution:480`) and the particle-CoF embers (every tier) both read that
one shared focal plane. The rack boundaries are the act boundaries (`RACK.at === ACTS.at === PACE.at`), so the
focal plane dwells-then-transits in lockstep with the camera pacing (`phase2/56`) and the copy frames. When
the pour exists, focus chases the *live* front (analytic `uPourFront` on `low`/`static`, GPGPU-flooded front
on `high` — `phase2/42`); before it exists, focus falls back to the slab centre.**

Justification against the world + the existing docs:

- **It is the literal deep-dive remit, and it closes doc-28's deferral.** Doc 28 fed focus from
  `forge.pourFront ?? ORIGIN` and said "feed `distanceTo(pourFront)`" without owning the binding. This owns it:
  the focal plane is now locked to the *actual* shared pour-front uniform, with a principled rack grammar, not
  a curve offset. Doc 28 §9 named this exactly as candidate #1, "the highest-leverage *it's-photographed*
  detail."
- **It reads the same `U` the metal reads.** `U.uPourFront` is driven by the fill field (`phase2/42`) and the
  one `<ForgeDriver/>` (`phase2/39`). The focus, the channel fill, the spark orbit, and (via `uTemp`) the
  bloom all derive from the *same* shared signal on the *same* heartbeat. The lens cannot disagree with the
  metal about where the hot front is — **the metal that is hottest is the metal in focus.** That is the
  cohesion lock.
- **The rack grammar is the camera twin of `gw_pace`.** Same six acts, same boundaries, same ease vocabulary
  (`phase2/56`). When the wordmark frame HOLDS (`Content.jsx`), the camera DWELLS (`gw_pace`), **and** focus
  snap-settles sharp on the letter row (`gw_rack`). Three systems, one rhythm, one set of boundaries — that
  synchrony is what reads as *directed*, not coincidental.
- **`worldFocusDistance`, never `target`.** The proven path for a moving subject (r3f #3113, 2025); the
  pour-front is the canonical moving subject.
- **One focal plane, two consumers.** Promoting `focusDist`/`focusRange` to `U` means the post DOF and the
  ember-CoF can never drift apart; on mobile (DOF off) the embers still defocus on the *real* pour-front plane,
  so the focal read survives the tier drop.
- **Brand motion.** Every focus value is `damp()`'d → high-momentum, no overshoot = Brutalist Snap. The rack
  *arrives* with impact on an anchor; it does not spring. The asymmetric soft-transit/hard-arrival *is* the
  brand's "glide then land."

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `@react-three/postprocessing` **v3.0.4** (2025-02-20) + `postprocessing` ≥ 6.3x — **already in the repo**
  (`Effects.jsx`). `DepthOfField` (`worldFocusDistance`, `worldFocusRange`, `bokehScale`, `resolution`),
  `TiltShift2`. **No new dep.**
- `three` r17x — `THREE.MathUtils.damp`, `clamp`, `Vector3.distanceTo`. Already present.
- `leva` — already present, for `?debug` live-tuning of the rack table + bokeh.
- **No new heavy deps.** All store math + the existing `CameraRig`/`Effects`/`Embers` loops, reading the
  master `U` pool (`phase2/39`).

### 4.2 The master pool gains the focal plane (`forgeUniforms.js`)

`focusDist`/`focusRange` become first-class pool members so both consumers bind the *same references*
(`phase2/39` §2.1, `Object.assign(shader.uniforms, U)`):

```js
// src/scene/forgeUniforms.js — extend the pool U (phase2/39)
export const U = {
  // ...existing: uTime, uTemp, uHeat, uScroll, uPointer, uPointerOn ...
  uPourFront:  { value: new THREE.Vector3(0, 0, 0) }, // shared pour-front WORLD pos (phase2/42)
  uPourArc:    { value: 0 },                          // shared arc-coord 0..1 (phase2/20)
  uFocusDist:  { value: 6.4 },                        // world units camera→front (this doc)
  uFocusRange: { value: 2.0 },                        // in-focus band half-width
}
```

`forge.focusDist`/`focusRange` (the JS mirror the post DOF reads) and `U.uFocusDist`/`uFocusRange` (the GLSL
mirror the embers read) are written from **one** place — the rig — so they never diverge.

### 4.3 The `RACK` table + `gw_rack` (`store.js`)

Beside `ACTS`/`PACE`, a per-act rack table. **Low λ = soft, lagging focus (transit); high λ = hard,
snap-settling focus (anchor).** `rangeBias` widens the in-focus band on transit so a fast front doesn't
strobe focus; `velOpen` is how much a flick opens the aperture in that act.

```js
// src/store.js — beside ACTS / PACE. at === ACTS.at so eye, pace, focus break together.
export const RACK = [
  { id: 'ignition', at: 0.00, lambda: 5.5, rangeBias: 1.0, velOpen: 0.6 }, // ANCHOR — crisp on the pour + A/E
  { id: 'core',     at: 0.08, lambda: 2.2, rangeBias: 2.2, velOpen: 1.6 }, // transit — soft drift into channel
  { id: 'draw',     at: 0.32, lambda: 2.0, rangeBias: 2.6, velOpen: 1.8 }, // SPRINT — softest, momentum carry
  { id: 'clan',     at: 0.55, lambda: 2.4, rangeBias: 2.2, velOpen: 1.6 }, // transit — channels rejoin
  { id: 'arsenal',  at: 0.74, lambda: 6.0, rangeBias: 0.9, velOpen: 0.5 }, // ANCHOR — snap-sharp, wordmark fills
  { id: 'point',    at: 0.95, lambda: 6.5, rangeBias: 0.85, velOpen: 0.4 },// HOLD   — crisp resting hero
]

const S_BOUND_RACK = (() => { const o = RACK.map(r => r.at); o.push(1); return o })()

// Returns the BLENDED rack params for a scroll s, smoothstep-blended across the act
// boundary so lambda/range never STEP (a step in lambda = a visible focus-speed jerk).
export function gw_rack(s) {
  const x = THREE.MathUtils.clamp(s, 0, 1)
  let i = 0
  for (let k = 0; k < RACK.length; k++) if (x >= S_BOUND_RACK[k]) i = k
  const j = Math.min(i + 1, RACK.length - 1)
  // blend window: last 18% of the current act eases params toward the next act's
  const s0 = S_BOUND_RACK[i], s1 = S_BOUND_RACK[i + 1]
  const local = s1 > s0 ? (x - s0) / (s1 - s0) : 0
  const w = THREE.MathUtils.smoothstep(local, 0.82, 1.0)   // 0 inside act, →1 at the seam
  const a = RACK[i], b = RACK[j]
  return {
    lambda:    THREE.MathUtils.lerp(a.lambda,    b.lambda,    w),
    rangeBias: THREE.MathUtils.lerp(a.rangeBias, b.rangeBias, w),
    velOpen:   THREE.MathUtils.lerp(a.velOpen,   b.velOpen,   w),
  }
}
```

The seam-blend is the load-bearing subtlety: a raw per-act `lambda` lookup is C⁰ — `lambda` *steps* at each
boundary, and a step in the rack *speed* reads as a visible "the focus puller suddenly yanked" jerk. The
`smoothstep(local, 0.82, 1.0)` blends the params across the last 18% of each act (the same window doc-28's
finale dolly-zoom uses), so the rack speed *eases* from transit-soft to anchor-hard as the front approaches
the letter — exactly the anticipatory pull a real focus puller does. (Mirror of the C¹ seam discipline in
`phase2/56` §4b.)

### 4.4 The rig writes the focal plane (`CameraRig.jsx`)

The rig is the **sole author** of `forge.focusDist`/`focusRange` and their `U` mirrors — one write, every
consumer reads. Inside the existing `useFrame` (after the doc-27 path sample + doc-28 fov, replacing doc-28's
placeholder focus block):

```jsx
// src/scene/CameraRig.jsx — inside useFrame
import { forge, damp, gw_rack } from '../store.js'
import { U } from './forgeUniforms.js'

const ORIGIN = /*module-scope*/ new THREE.Vector3(0, 0, 0)

// ... existing: Lenis pump, scrollVel/scrollDamped, gw_pace cam.t, JOURNEY/FOCUS sample, fov ...

// 1) THE SUBJECT — the LIVE pour-front world pos from the shared pool (phase2/42).
//    Before the pour exists (uPourArc ≈ 0 on early scroll), fall back to the slab centre.
const front = (U.uPourArc.value > 0.001) ? U.uPourFront.value : ORIGIN
const targetDist = camera.position.distanceTo(front)        // Euclidean rack distance

// 2) THE RACK GRAMMAR — per-act lambda/range, seam-blended (NO target prop — #3113).
const rk = gw_rack(forge.scrollDamped)                       // {lambda, rangeBias, velOpen}
forge.focusDist = damp(forge.focusDist ?? targetDist, targetDist, rk.lambda, dt) // soft transit / hard arrival

// 3) APERTURE — base band widened by act bias + a flick "opening the aperture".
const targetRange = rk.rangeBias * (1.0 + Math.min(forge.scrollVel, 1.0) * rk.velOpen)
forge.focusRange = damp(forge.focusRange ?? targetRange, targetRange, 3.0, dt)

// 4) PUBLISH to the shared pool so post DOF *and* the embers read ONE focal plane.
U.uFocusDist.value  = forge.focusDist
U.uFocusRange.value = forge.focusRange
```

Note `damp(..., rk.lambda, dt)` — the **rack λ is itself a function of the act**, so the *same* `damp` call
chases the front fast on an anchor (λ≈6, snap-settle) and slow on a transit (λ≈2, soft drift). That single
substitution — a per-act λ instead of doc-28's constant `4` — is the entire rack-focus grammar. Everything
else is the doc-28 lens, unchanged.

### 4.5 The post DOF reads the shared plane (`Effects.jsx`)

`worldFocusDistance`/`worldFocusRange` are imperatively written each frame from `forge.focusDist`/`focusRange`
(react-postprocessing does not re-render the composer on a prop change, so we mutate the effect directly —
r3f #3113 pattern). `target` is forced off.

```jsx
// src/scene/Effects.jsx
const dof = useRef()
useFrame(() => {
  const e = dof.current
  if (!e) return
  e.target = undefined                              // ensure the flaky target route is OFF (#3113)
  if ('worldFocusDistance' in e) e.worldFocusDistance = forge.focusDist  ?? 6.4
  if ('worldFocusRange'    in e) e.worldFocusRange    = forge.focusRange ?? 2.0
})

return (
  <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
    {high ? (
      <DepthOfField ref={dof}
        worldFocusDistance={6.4}   // overwritten per-frame from forge.focusDist
        worldFocusRange={2.0}      // overwritten per-frame from forge.focusRange
        bokehScale={3.0}           // modest CoC — sacred, not novelty
        resolution={480} />        // DOWNSAMPLED — the perf knob
    ) : quality === 'low' ? (
      <TiltShift2 blur={0.18} taper={0.55} />   // cheap fake; CANNOT rack — embers carry the read
    ) : null}
    {/* DOF sits BEFORE bloom (cohesion-map §6): hot front blooms THROUGH its defocus = sacred halo */}
    <Bloom mipmapBlur luminanceThreshold={0.58} intensity={high ? 0.9 : 0.6} radius={0.8} />
    {/* ...CA / HueSaturation / BrightnessContrast / Vignette / Noise(dither ≥0.03) / SMAA... */}
  </EffectComposer>
)
```

### 4.6 The embers read the SAME plane (`Embers.jsx` GLSL)

The ember points bind `U.uFocusDist`/`U.uFocusRange` (the *same* references the rig writes), so the particle
bokeh and the post DOF share one focal plane — even on `static`/`low` where post DOF is off. (Doc-28 §4.2c,
now reading the pooled uniforms.)

```glsl
// Embers vertex — point CoC from the SHARED focal plane
uniform float uFocusDist;    // = U.uFocusDist  (world units to the pour-front)
uniform float uFocusRange;   // = U.uFocusRange
// ...
float camDist = -mvPosition.z;                                  // view-space distance
float coc = clamp(abs(camDist - uFocusDist) / max(uFocusRange, 0.001), 0.0, 1.0);
gl_PointSize = uSize * (1.0 + coc * 2.2) / -mvPosition.z;       // defocused → bigger disc
vCoc = coc;
```
```glsl
// Embers fragment — softer, dimmer disc when defocused (rough energy preservation)
float edge = mix(0.5, 0.05, vCoc);                              // sharp dot → soft halo
float a = smoothstep(0.5, edge, length(gl_PointCoord - 0.5));
gl_FragColor = vec4(uColor, a * (1.0 - vCoc * 0.55));           // dimmer when spread
```

Sparks riding the pour-front (`camDist ≈ uFocusDist`) stay crisp pinpoints; sparks drifting into the void
bloom into soft warm orbs — on **every** tier, because it reads the pooled focal plane, not the post pass.

### 4.7 Key params

| Param | Value | Why |
|---|---|---|
| focus subject | `U.uPourFront.value` (fallback `ORIGIN`) | the LIVE shared pour-front, not a curve offset |
| `worldFocusDistance` | `= forge.focusDist` (damped per-act λ) | rack to the pour-front; proven over `target` (#3113) |
| rack λ (anchor) | 5.5–6.5 | hard, snap-settling focus — dwell-sharp on the cast word |
| rack λ (transit) | 2.0–2.4 | soft, lagging focus — momentum carry through channels |
| seam blend | `smoothstep(local, 0.82, 1.0)` | anticipatory pull; no focus-speed step at act seams |
| `rangeBias` | 0.85 (anchor) → 2.6 (transit) | tight band on the word; wide band so transit doesn't strobe |
| `velOpen` | 0.4 (anchor) → 1.8 (transit) | a flick "opens the aperture" most during a sprint |
| `bokehScale` | 3.0 | modest CoC — sacred, not novelty toy (and cheaper) |
| DOF `resolution` | 480 (high only) | the perf knob — DOF blur is low-frequency, downsample is invisible |
| ember coc size mult | ×2.2 | defocused spark → soft orb; the only focal read on mobile |

### 4.8 Hooking the shared master temperature system
The focal plane is a **consumer and co-author** of the master pool `U` (`phase2/39`):
- It **reads** `U.uPourFront`/`U.uPourArc` (the live front from the fill field, `phase2/42`) and
  `forge.scrollDamped`/`scrollVel` (the act + the flick).
- It **writes** `forge.focusDist`/`focusRange` *and* `U.uFocusDist`/`uFocusRange` from one place, so the post
  DOF and the embers defocus on one plane.
- Because the front is the *same* uniform the channel fill floods (`phase2/42`) and the sparks orbit
  (`phase2/26`), and because `uTemp`/bloom ride the same `scrollDamped`, **the hottest metal is the in-focus
  metal**, and the spark that is sharp is the spark riding the front. Scroll into The Arsenal: the camera
  dwells (`gw_pace`), the wordmark fills (`uTemp` high), focus snap-settles crisp on the letter row
  (`gw_rack` λ≈6), the void behind blooms, and the front-riding embers are pinpoints while the drifting ones
  are orbs. One signal, one heartbeat, photographed.

Expose `RACK[i].lambda`/`rangeBias`/`velOpen`, `bokehScale`, `worldFocusRange`, and `TiltShift2 blur` to the
`?debug` leva panel so the rack is authored on the iPhone, not guessed.

---

## 5. COHESION — shared palette / lighting / uniforms / clock

- **One focal plane, in the master pool.** `focusDist`/`focusRange` are promoted into `U` (`phase2/39`) — the
  same pool as `uTemp`/`uHeat`/`uPourFront`. The post DOF and the ember-CoF bind the *same references*; the rig
  is the sole writer. There is no second focus authority, no private focus value anywhere.
- **One subject for fill, focus, and sparks.** `U.uPourFront` is read by the channel fill (`phase2/42`), the
  camera focus (this doc), and the spark orbit (`phase2/26`) — the literal cohesion-map §7 rule 8 ("shares the
  channel curve data three ways"). The focus cannot drift from the metal because it reads the metal's own
  uniform.
- **One rhythm across eye, pace, and copy.** `RACK.at === PACE.at === ACTS.at`. Focus dwells-then-transits on
  the same boundaries the camera paces (`phase2/56`) and the copy frames hold (`Content.jsx`), with the same
  `outQuart`-arrive / soft-transit ease vocabulary. The dwell-sharp arrival, the camera dwell, and the
  wordmark HOLD are *one* designed beat.
- **Palette/lighting untouched.** Focus defocuses and frames the *same* lit world; it adds no color. The warm
  palette, the HDR `>1` hot band that blooms, the metal-is-the-only-light model, the no-EXR procedural env are
  unchanged. The rack *serves* the signature beats — dwelling sharp on the divine-fire A/E and the Ogham
  reveal gives them screen-time in crisp focus while the void blooms.
- **Bloom partnership (cohesion-map §6).** DOF runs *before* bloom, so the white-hot pour-front blooms
  *through* its own defocus — soft disc + soft halo = the sacred heat read. The A/E, pushed highest in
  emissive, bloom most; if slightly off the focal plane, they get the largest bokeh — reinforcing "radiate
  onto adjacent stone" optically.
- **OLED grade (cohesion-map §3).** DOF blur softens the dark void gradients (a banding risk on true-black
  OLED); the existing grain-as-dither (≥0.03) covers it. The rack never lightens the void — crushed blacks
  survive.
- **One clock, one rAF, `dt`-damped.** `gw_rack` is pure; the only state is the existing `damp()` in the one
  `useFrame`. No `setInterval`, no spring, no second loop. Brutalist Snap, no bounce.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **The binding is free; the blur is the cost.** `distanceTo` + `gw_rack` + two `damp`s + two pool writes =
  a handful of scalar ops/frame, sub-microsecond, far below the obsidian shader's ~4 ms. Zero allocation
  (`ORIGIN` and the front vector are module-scope / pooled). It does **not** move the cohesion-map §10 budget
  needle. The DOF *blur pass* is the only real cost and is tier-gated.
- **Tiers (mirror `forge.quality`):**
  - **`high`:** post `<DepthOfField>` `resolution:480` + the per-act `gw_rack` grammar + particle-CoF embers.
    The full rack-focus to the live (GPGPU-flooded, `phase2/42`) pour-front.
  - **`low`:** **no post DOF** → `<TiltShift2>` (no CoC pass). Tilt-shift **cannot rack** (it blurs by
    screen-Y), so the rack *grammar* degrades to a fixed band; the **particle-CoF embers** (which *do* read
    `U.uFocusDist`) carry the focal-plane read, and `forge.focusDist` is still computed (it's free) for them.
    The pour-front is the *analytic* front (`phase2/42` floor), not the flooded one.
  - **`static` / reduced-motion:** **no defocus pass**; only the particle-CoF embers defocus (or render sharp
    with a baked CoF). `forge.focusDist` is computed once on the still poster so the embers land on a
    coherent focal plane. The frame still reads cinematic — fov choice + vignette + crushed blacks + the
    ember bokeh carry it. Required floor.
- **The free read survives the tier drop.** Because `focusDist` is computed regardless of whether the post DOF
  exists, the **embers always defocus on the real pour-front plane** — the focal read is the *cheapest* thing
  in the build and the *last* to be cut. A throttled device still looks photographed.
- **iOS rubber-band:** clamp `forge.scrollDamped` before `gw_rack` (done — `gw_rack` clamps internally) so
  over-scroll can't push the rack params out of the table.
- **`AdaptiveDpr` (already on)** keeps the whole composer at the capped tier DPR (1.5 on the phone) — the DOF
  blur pass scales down with it for free.
- **No extra render targets** beyond DOF's own. `disableNormalPass` stays (DOF uses the depth the composer
  already provides).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Using DOF `target` for the pour-front.** Documented flaky for moving local-space subjects (r3f #3113,
   2025). Use `worldFocusDistance = camera.position.distanceTo(U.uPourFront)`; force `e.target = undefined`.
2. **Focus before the pour exists.** Early in the journey there is no front; `distanceTo` an uninitialised
   `uPourFront` focuses on origin-distance correctly, but gate on `U.uPourArc > 0.001` so a stale front from a
   previous route doesn't yank focus on nav. Fall back to `ORIGIN` (slab centre).
3. **C⁰ rack-speed step at act seams.** A raw per-act `lambda` lookup *steps* the rack speed at each boundary
   = a visible "the puller yanked" jerk. Seam-blend the params (`smoothstep(local, 0.82, 1.0)`, §4.3) so the
   rack *eases* from soft-transit to hard-arrival as the front nears the letter — the anticipatory pull.
4. **Rack-focus whip.** Snapping `focusDist` to a new subject reads as a jerk. **Always damp** — and the
   *anchor* λ (≈6) is still a damp, not a snap: it settles fast but smooth. Never feed a raw distance.
5. **Post DOF and embers on different planes.** If the embers read a private `uFocusDist` and the post DOF
   reads `forge.focusDist`, they drift and the sparks defocus against a different plane than the scene. Bind
   **both** to the pooled `U.uFocusDist`/`uFocusRange`, written once by the rig.
6. **Full-res DOF on mobile.** Instant budget blowout. `resolution:480`, high-tier only, `TiltShift2` on low.
7. **Expecting tilt-shift to rack.** `TiltShift2` blurs by screen-Y, not depth — it **cannot** follow the
   pour-front. On `low`, the embers (which read the focal plane) carry the rack read; don't try to drive
   tilt-shift's band from `focusDist` (it's the wrong axis).
8. **Bokeh too big.** Large `bokehScale` reads as a software smear and costs the most. Keep ≤3; the
   *softness*, not the size, sells the lens.
9. **DOF after bloom.** Blooms a sharp frame then blurs it = sharp bloom rings inside soft areas (broken). DOF
   **before** bloom so the hot front blooms through its defocus (cohesion-map §6).
10. **Banding from blur on OLED.** DOF softening + true black re-introduces banding; keep grain ≥0.03 as
    dither (cohesion-map §3, already mandated).
11. **Tuning on desktop and declaring victory.** The rack *feel* — soft transit vs hard arrival, no whip, no
    seam jerk, the bokeh softness, the OLED banding — does **not** simulate headless. Read it on the iPhone 15.

**Order of operations**
1. **Promote `focusDist`/`focusRange` into `U`** (`forgeUniforms.js`); add `RACK` + `gw_rack` to `store.js`.
   Unit-check `gw_rack(s)` for `s=0..1`: assert `lambda`/`range` are continuous (no step) across seams.
2. **Bind the subject.** In `CameraRig`, read `U.uPourFront`, compute `distanceTo`, damp `forge.focusDist`
   with `gw_rack(...).lambda`, write the pool mirrors. Log `focusDist` and verify it tracks the front as the
   journey moves and falls back to origin before the pour.
3. **Particle-CoF embers first (every tier).** Bind `U.uFocusDist`/`uFocusRange` in `Embers.jsx`; verify
   sparks riding the front are sharp and drifting ones are orbs — on a throttled device too. This is the read
   that must survive the tier drop, so prove it before the post pass.
4. **Post DOF (high).** Wire `<DepthOfField>` reading `forge.focusDist`/`focusRange`; confirm it sits
   **before** bloom; tune `bokehScale`/range in `?debug` until the void behind the front is soft and the front
   crisp.
5. **The rack grammar.** Tune `RACK[i].lambda`/`rangeBias` in `?debug` until transit drifts soft and arrival
   snap-settles crisp, with no seam jerk and no whip leaving a dwell. Confirm `RACK.at === PACE.at === ACTS.at`
   so the focus dwell coincides with the camera dwell and the wordmark fill.
6. **Low-tier `TiltShift2`** substitute; confirm the band reads and the embers carry the focal plane.
7. **QA** (`qa-route`/`tune-pacing`): `npm run build` green (SwiftShader compiles the GLSL → 0 console errors),
   Playwright at 393×852 + 1440×900, monotonic non-reversing focus, no NaN at scroll extremes — **then the
   iPhone 15 OLED read**: soft transit / hard arrival, no whip, no seam jerk, bokeh softness, no banding, the
   focus dwell landing on the filling wordmark. None of those simulate headless.

---

## 8. SOURCES (2025–2026)

1. **r3f Discussion #3113 — "Depth Of Field: Target vs WorldFocusDistance"** (pmndrs, 2025; live reference
   2025–2026). The worked pattern for a moving subject: `getWorldPosition(worldTarget)` /
   `getWorldPosition(worldCam)` → `worldFocusDistance = worldCam.z − worldTarget.z` (or `.distanceTo`);
   `worldFocusDistance` "consistently works," `target` is flaky for moving local-space objects.
   https://github.com/pmndrs/react-three-fiber/discussions/3113
2. **react-postprocessing — `DepthOfField` effect docs (v3.0.4, released 2025-02-20; docs current
   2025–2026).** `worldFocusDistance`, `worldFocusRange`, `bokehScale`, `resolution`, `target`; CoC pass +
   downsampled bokeh blur, merges into the `EffectPass`. https://docs.pmnd.rs/react-postprocessing/effects/depth-of-field
3. **react-postprocessing — `Autofocus` effect docs + `ektogamat/AutoFocusDOF`** (pmndrs / Anderson Mancini,
   current 2025–2026). Depth-buffer hit-test autofocus with `smoothTime`/`focusRange`/`manual`,
   `api.update(delta)` — the rack-focus *easing* model we borrow (and the `manual`-not-mouse mode for a
   scroll-driven journey). https://react-postprocessing.docs.pmnd.rs/effects/autofocus ·
   https://github.com/ektogamat/AutoFocusDOF
4. **Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP"** (Joseph A. S. Gil, 2025-11-19).
   Camera "shots" as keyframes in one clip, finding the keyframe from section index, custom cinematic eases
   (`cinematicSilk`/`cinematicFlow`), `scrub:1` smoothed follow — the per-act keyframe/ease model this rack
   curve mirrors as store math. https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
5. **Codrops — "Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds"**
   (2026-03-09). Scroll-velocity-driven motion + depth-layered focus and mood — the `scrollVel`-opens-the-
   aperture pattern (§2B.3). https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
6. **three.js — `webgpu_postprocessing_dof` example + `DepthOfFieldNode` (new API)** (mrdoob/three.js, r17x,
   current 2025–2026). Node-graph DOF sampling the depth buffer with a per-frame focus distance; the
   authored-portable TSL target where `forge.focusDist` becomes a `uniform()` focus node. https://threejs.org/examples/?q=dof#webgpu_postprocessing_dof ·
   https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_postprocessing_dof.html
7. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). TSL post-processing node pipeline, the
   shared-`uniform()`/`.onFrameUpdate()` single-writer model, and the candid status that iOS Safari WebGPU has
   landed but coverage is uneven — why the TSL depth-node DOF is the deferred future, not the judge build.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
8. **utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist"** (2026). WebGPU production-ready
   across major browsers, the node post-processing pipeline (incl. DOF) and the mobile/iOS caveats — the
   migration map for the §2C.4 re-host. https://www.utsubo.com/blog/webgpu-threejs-migration-guide
9. **MasterClass — "Rack Focus Technique: 3 Ways to Use Rack Focus Film Shots" (updated 2026)** and
   **StudioBinder — "The Rack Focus Shot"** (current). The cinematography grammar this doc encodes in math:
   focus pulled *from one subject to another within a shot*, anticipated and eased — soft transit, settled
   arrival. https://www.masterclass.com/articles/rack-focus-guide · https://www.studiobinder.com/blog/rack-focus-shot-camera-movement-angles/
10. **Codrops — "Simulating Depth of Field with Particles"** (referenced in 2025 point-sprite-CoC roundups;
    technique current). Per-point CoC from `|depth − focusDepth|` sizing additive sprites into bokeh discs —
    the every-tier particle-CoF embers that carry the focal read when post DOF is off. https://tympanus.net/codrops/2019/10/01/simulating-depth-of-field-with-particles-using-the-blurry-library/

---

## 9. DEEP-DIVE CANDIDATES

1. **Anticipatory rack via the arc-coordinate (focus-ahead, not focus-on).** Instead of focusing on the
   front's *current* world position, focus on `U.uPourArc + lookAheadArc` along the baked channel curve
   (`phase2/20`) — so focus *arrives at the letter before the metal does*, the way a real focus puller
   pre-racks. Couples the focus look-ahead to the same `FOCUS` curve the camera look-ahead uses (`phase2/56`
   §4), tunable per act.
2. **TSL / WebGPU depth-node DOF migration.** Re-host the rack onto `DepthOfFieldNode` (the
   `webgpu_postprocessing_dof` API) with `forge.focusDist` as a `uniform()` focus node written by the
   `<ForgeDriver/>`-twin `.onFrameUpdate()`, keeping the WebGL `DepthOfField` fallback so the iOS coverage gap
   can't break the judge device. Per-pixel CoC straight off the depth buffer, no wrapper friction.
3. **Anamorphic forge-lens bokeh on the front.** A subtle horizontal bokeh stretch + oval iris + a warm flare
   streak on the white-hot pour-front (anamorphic cues, no rainbow — warm only), so the in-focus front reads
   as a true cinema lens. Measured against the iPhone-15 budget; folds into the same CoF the embers already
   compute.
4. **Focus-rack-coupled bloom and aperture.** Tie `bokehScale` and the bloom radius to the rack λ so an anchor
   *arrival* tightens the bokeh and crisps the bloom while a transit *sprint* opens both — the lens "stopping
   down" on the held subject and "opening up" on the move, one more shared-`U` coupling on the same heartbeat.
