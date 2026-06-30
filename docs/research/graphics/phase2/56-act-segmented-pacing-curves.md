# 56 — Act-Segmented Pacing Curves (HOLD / EASE per Act)

_Phase 2 graphics deep-dive · GAELWORX forge world · cluster **I-camera-motion**. Builds directly on
Phase-1 **27 (scroll-camera-paths)** and **28 (cinematic-camera-dof)**, and on the home-pacing knobs the
`tune-pacing` skill owns. Target: iPhone 15 (OLED), one WebGL renderer (r3f / three.js), warm-forge
palette. Topic: remap `forge.scroll` through a **per-act pacing curve** so the camera DWELLS on Ignition
and The Arsenal and ACCELERATES through the transit channels — the "tune-pacing" remit applied to the
camera path parameter, `dt`-damped, no bounce._

---

## 1. SCOPE — what this element is in the GAELWORX world

Phase-1 doc 27 established the *geometry* of the journey: a `THREE.CatmullRomCurve3` (`JOURNEY`) sampled by
arc length at `cam.t`, with a second curve (`FOCUS`) for look-ahead, fed by a single Lenis instance writing
`forge.scroll`. That gives **travel, not cuts** — but it gives travel at a **constant rate**. Scroll halfway
and you are exactly halfway down the channel. That is the wrong *rhythm* for a cinematic forge.

A forging is not paced uniformly. It has **beats**: the altar **ignites** (you want to dwell, drink in the
white-hot pour and the divine-fire A/E), the metal **draws** down the Celtic-interlace channels (this is
*transit* — you want to move *through* it with momentum, not crawl), it **fills The Arsenal** of letterforms
(dwell again — this is the payoff, the GAELWORX wordmark resolving), and finally **Point the Sword** holds
as the resting hero image. The six acts already declared in `store.js` —
`Ignition(0.0) → The Core(0.08) → The Draw(0.32) → The Clan(0.55) → The Arsenal(0.74) → Point the Sword(0.95)`
— are *narrative* beats, but the camera currently honours them only as label triggers, not as **pacing**.

This deep-dive specifies the missing layer: a **monotonic, C¹-continuous remap function** `gw_pace(scroll)`
that takes the linear damped scroll `s ∈ [0,1]` and returns a *non-linear* journey parameter
`t ∈ [0,1]` such that:

- equal scroll *distance* spent inside an **anchor act** (Ignition, The Arsenal, Point the Sword) produces
  **small** camera-`t` movement → the camera **DWELLS**;
- equal scroll distance spent inside a **transit act** (The Core→The Draw, The Clan) produces **large**
  camera-`t` movement → the camera **ACCELERATES** through the channel run.

It is the direct camera-path analogue of the home-content `WEIGHTS` / `HOLD` / `FADE` system that
`Content.jsx` already uses to make text frames *land and dwell* — `tune-pacing`'s "the scrub glides; the
content lands hard" applied to the **eye**, not the copy. The two must agree: when the wordmark frame HOLDS,
the camera must also be dwelling on the letter row, or the eye and the text disagree about "where we are in
the forging." This is a **cohesion** requirement, not a nicety (§5).

The hard constraints carry over from 27: monotonic (never scrub backwards on forward scroll), C¹-smooth (no
velocity discontinuity at act boundaries → no visible "gear-change" jerk), `dt`-damped via
`THREE.MathUtils.damp` (frame-rate-independent, **no spring, no overshoot, no bounce** — Brutalist Snap), and
zero added render cost (this is a handful of scalar ops in the existing `useFrame`).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable way to bend a linear scroll parameter into per-segment dwell/accelerate pacing, judged on
quality / perf / mobile / complexity / cohesion-fit.

### A. drei `useScroll().range()` + `curve()` per segment (the framework idiom)
drei's `useScroll` exposes `range(from, distance, margin=0)` → normalised `0→1` progress *inside one
sub-interval* of the scroll, and `curve(from, distance, margin=0)` = `sin(range·π)` → a `0→1→0` ease-bump
across that interval (confirmed against the current `ScrollControls.tsx` source: `range` is
`(offset − start)/(end − start)` clamped, `curve` is `Math.sin(range·π)`). The canonical 2025 pattern is to
slice the scroll into N segments and drive each act's local animation from its own `range(...)`, optionally
shaped by `curve(...)` for fade-in-out.
- **Quality:** Good for *per-element* fades. For a **single continuous camera-`t`** it is awkward — you'd
  have to stitch N `range()` outputs into one monotonic curve manually, which is exactly the `gw_pace`
  function below, so `range()` becomes an implementation detail rather than the mechanism.
- **Perf/Mobile:** Excellent (pure scalar math).
- **Cohesion-fit:** **Poor at the container level** — adopting `ScrollControls` means drei owns the scroll
  DOM and hides the prerendered SEO/AEO HTML (the same rejection 27 reached). But the **`range`/`curve`
  math is reusable** without the container: we lift the formulas into our own `gw_pace`.
- **Verdict:** Borrow the *math* (segmented `range`, `sin·π` ease), reject the *container*.

### B. Piecewise per-act easing (segment LUT + per-segment ease) — **the studio idiom**
Define act boundaries as a small table mapping **scroll fraction → journey fraction** with a per-segment
ease. Inside an anchor act, the journey-fraction span is *narrow* (dwell); inside a transit act it is *wide*
(accelerate). Each segment carries its own easing (e.g. `easeOutQuart` to *arrive* and settle at an anchor,
`easeInOutSine` to *glide* through transit). This is exactly the "spread each section's shot as a keyframe in
a single clip and find the keyframe from the section index" approach the Codrops *Cinematic 3D Scroll
Experiences with GSAP* (19 Nov 2025) article describes, and the "think in scenes, dwell then transit"
framing of the Svilenković *Scrollytelling Trends 2026* and Codrops *More Than a Portfolio* (28 Apr 2026)
pieces — done as **pure math in our store** instead of as a GSAP timeline.
- **Quality:** Excellent — full art-direction control over dwell vs. transit, per-boundary easing.
- **Perf/Mobile:** Excellent — a clamped lookup + one `smoothstep`/`pow` per frame.
- **Cohesion-fit:** **Best.** It is the camera-path twin of the `Content.jsx` `WEIGHTS`/`HOLD`/`FADE` model,
  reads the same `forge.scroll`, and stays inside the one-store/one-loop rule.
- **Complexity:** Medium — authoring the boundary table + keeping it C¹ at the seams.

### C. GSAP timeline with `scrub` + per-keyframe `duration` proportions
GSAP ScrollTrigger with `scrub: 1` maps a **timeline** to scroll, where each tween's `duration` becomes its
*proportion of the scroll distance* — so a longer-duration "dwell" shot eats more scroll than a short
"transit" shot. Codrops *How to Build Cinematic 3D Scroll Experiences with GSAP* (19 Nov 2025) builds exactly
this with custom eases (`cinematicSilk`, `cinematicFlow`) and `scrub:1` for the smoothed follow, and the GSAP
docs confirm scrub-timeline duration-as-proportion semantics. The community-standard pairing is Lenis +
`gsap.ticker` with `gsap.ticker.lagSmoothing(0)` to keep one loop.
- **Quality:** Excellent; designer-tunable named eases.
- **Perf/Mobile:** Good but adds GSAP (+ScrollTrigger) to the bundle and a **second animation authority**
  that fights GAELWORX's single mutable `forge` store + `damp()` model (the same redundancy 27 §2-E flagged).
- **Cohesion-fit:** **Off-pattern.** We already get frame-rate-independent easing from `damp()`; GSAP's value
  here is named timelines we don't need. Reserve only if a designer demands editable tween timelines.
- **Verdict:** Adopt the *concept* (duration ≈ dwell-weight), not the dependency.

### D. CSS Scroll-Driven Animations (`animation-timeline: scroll()` + `animation-range`)
The Scroll-Driven Animations Module L1 (drafts ongoing through 2025–2026; Josh W. Comeau's 2025 guide and
Codrops' practical intro cover it) drives `@keyframes` off scroll position with per-keyframe `animation-range`
— the browser-native version of segmented pacing, compositor-threaded.
- **Quality/Perf:** Excellent for **DOM** (the content frames). It can shape *CSS* opacity/transform per act
  cheaply and off-main-thread.
- **Cohesion-fit for the camera:** **N/A** — it animates CSS properties, not a three.js camera uniform. It
  cannot output the scalar `forge.t` the rig needs. Useful as a *parallel* mechanism for the content-frame
  pacing on capable browsers, never for the WebGL camera.
- **Verdict:** Out of scope for the camera; a possible progressive-enhancement for the DOM layer only.

### E. Arc-length re-weighting of the curve itself (bake the pacing into geometry)
Instead of remapping `t`, **redistribute the control points** so the curve is *physically* denser near
anchors and sparser through transit; then uniform-`t` sampling auto-dwells. This is the "non-uniform
keyframe spacing" idea.
- **Quality:** Good, but **brittle** — pacing and path are now entangled; you cannot retune dwell without
  re-authoring geometry and re-running `updateArcLengths()`, and arc-length sampling (`getPointAt`) actively
  *fights* you by re-uniformising velocity. Tuning becomes whack-a-mole, the exact failure `tune-pacing`
  warns against.
- **Verdict:** Reject. Keep **path** (geometry, doc 27) and **pacing** (the `t` remap, this doc) orthogonal so
  each can be tuned in `?debug` independently.

### F. `maath/easing.damp*` as the smoothing stage (orthogonal, additive)
pmndrs `maath` `damp`/`damp3` is the 2025-current frame-rate-independent exponential smoother
(`easing(t)=1/(1+t+0.48t²+0.235t³)`, `smoothTime`/`maxSpeed` API). It is not a *pacing* technique but the
**settle stage** after the remap, with an optional `maxSpeed` clamp to cap how fast the camera can lunge out
of a dwell.
- **Verdict:** Adopt as the final damp (or keep `THREE.MathUtils.damp`, which is the same family). The
  `maxSpeed` clamp is a nice-to-have for guaranteeing "no whip leaving an anchor."

**Landscape verdict:** the pick is **B (piecewise per-act pacing LUT, in our store) borrowing A's segmented
`range`/`sin·π` math and C's duration-as-dwell-weight concept, smoothed by F**, with D reserved for the DOM
layer and E rejected. This keeps path and pacing orthogonal, stays inside one store / one loop / native DOM
scroll, and is the direct camera twin of the proven `Content.jsx` pacing model.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Insert one pure function, `gw_pace(scroll) → t`, between `forge.scrollDamped` and the curve sampler in
`CameraRig`. It is a monotonic, C¹ piecewise remap built from a per-act `PACE` table of `weight` (dwell ↔
transit) and an `ease` per segment, authored to make the camera-`t` *crawl* across Ignition / The Arsenal /
Point the Sword and *sprint* across the transit runs (The Core→The Draw, The Clan). The remapped `t` is the
input to `JOURNEY.getPointAt(t)` (doc 27); the existing final `damp()` (or `maath` damp with a `maxSpeed`
clamp) provides Brutalist-Snap settle with no bounce.**

Why this is the right pick for the world and the existing code:

- **It is the literal deep-dive remit.** "Dwell on Ignition/The Arsenal, accelerate through transit" *is* a
  non-linear `scroll→t` remap. Nothing else is.
- **It reuses the store contract verbatim.** The `ACTS` table and `actIndexFor()` already exist in
  `store.js`; `PACE` is the same six acts annotated with a `weight` and `ease`. `forge.scroll`/`scrollDamped`
  are unchanged inputs. The veins, sparks, and content frames keep reading `scrollDamped`; **only the camera
  reads the remapped `t`** — so pacing the eye never desyncs the rest of the world from the user's actual
  scroll position (critical: see the trap in §7).
- **It is the camera twin of `Content.jsx`.** That file already proves the model: `WEIGHTS` allot screen-
  space per frame, `HOLD`/`FADE` make frames dwell then hand off. `gw_pace` allots *journey-space* per act and
  makes the camera dwell then transit. One mental model, two consumers — that is cohesion, not a new system.
- **Orthogonal to the path.** Path geometry (doc 27 `JOURNEY`/`FOCUS`) and pacing (`gw_pace`) are tuned
  separately in `?debug`. You can re-time the dwell without touching a control point, and vice-versa — the
  anti-whack-a-mole discipline `tune-pacing` mandates.
- **Brand-compliant motion.** Final `damp()` → high-momentum, frame-rate-independent, **no overshoot**. The
  remap shapes *where time is spent*; the damp shapes *how it settles*. Glide (remap) + land (damp) layer,
  exactly as the brand law states; never a spring.
- **Mobile-free.** ~6 scalar ops/frame. No render targets, no second rAF, no bundle growth.

---

## 4. IMPLEMENTATION

### Libraries / versions
- `three` r17x (already in repo) — `THREE.MathUtils.damp`, `clamp`, `smoothstep`.
- `lenis` 1.3.x (already specified by doc 27) — input only; unchanged.
- **Optional:** `maath` (pmndrs, current) — `easing.damp` with `maxSpeed` for the lunge clamp. Not required;
  `THREE.MathUtils.damp` is the same exponential family.
- **No new heavy deps.** Everything here is store math + the existing `CameraRig` `useFrame`.

### 4a. The PACE table — acts annotated with dwell-weight + ease

Extend the existing `ACTS` with a pacing weight (journey-fraction the act consumes) and a per-segment ease.
Anchors get **low** weight (dwell — little journey-`t` per unit scroll); transits get **high** weight
(accelerate). Keep it data, in `store.js`, beside `ACTS`.

```js
// src/store.js — beside ACTS. weight = how much JOURNEY-t this act consumes
// (low = dwell/crawl, high = transit/sprint). ease = the segment's shaping fn.
// 'at' (scroll fraction) stays the SAME as ACTS so content frames & camera agree.
export const PACE = [
  { id: 'ignition', at: 0.00, weight: 0.6, ease: 'outQuart' }, // DWELL — drink the pour + A/E
  { id: 'core',     at: 0.08, weight: 1.7, ease: 'inOutSine' }, // transit — drop to the channel
  { id: 'draw',     at: 0.32, weight: 1.9, ease: 'inOutSine' }, // SPRINT — bank the interlace
  { id: 'clan',     at: 0.55, weight: 1.6, ease: 'inOutSine' }, // transit — channels rejoin
  { id: 'arsenal',  at: 0.74, weight: 0.55, ease: 'outQuart' }, // DWELL — the wordmark fills
  { id: 'point',    at: 0.95, weight: 0.5,  ease: 'outQuart' }, // HOLD  — finale, resting hero
]

// Easing zoo (mirror Content.jsx so eye & copy ease identically).
const EASES = {
  linear:    (x) => x,
  outQuart:  (x) => 1 - Math.pow(1 - x, 4),          // snap-in & settle  (arrivals)
  inOutSine: (x) => 0.5 - 0.5 * Math.cos(Math.PI*x), // glide through      (transit)
}

// Precompute cumulative journey-t boundaries from the weights (once).
const _W = PACE.reduce((a, p) => a + p.weight, 0)
const T_BOUND = (() => {
  const out = [0]; let acc = 0
  for (const p of PACE) { acc += p.weight; out.push(acc / _W) }
  return out   // length PACE.length+1; T_BOUND[i]..T_BOUND[i+1] is act i's t-span
})()
const S_BOUND = (() => {
  const out = PACE.map((p) => p.at); out.push(1); return out  // scroll boundaries
})()
```

### 4b. `gw_pace` — the monotonic, C¹ piecewise remap

For a scroll `s`, find the act it falls in, compute the *local* progress through that act's **scroll** span,
ease it, then map onto that act's **journey-t** span. Because anchors own a tiny t-span but a normal scroll
span, the camera-`t` barely advances while scrolling through them → **dwell**. Transit acts own a large
t-span → **sprint**.

```js
// src/store.js — pure, allocation-free, monotonic, clamped.
export function gw_pace(s) {
  const x = THREE.MathUtils.clamp(s, 0, 1)
  // locate the segment (small fixed loop — 6 acts)
  let i = 0
  for (let k = 0; k < PACE.length; k++) if (x >= S_BOUND[k]) i = k
  const s0 = S_BOUND[i], s1 = S_BOUND[i + 1]
  const t0 = T_BOUND[i], t1 = T_BOUND[i + 1]
  const local = s1 > s0 ? (x - s0) / (s1 - s0) : 0     // 0..1 inside this act's scroll
  const eased = EASES[PACE[i].ease](THREE.MathUtils.clamp(local, 0, 1))
  return t0 + (t1 - t0) * eased                         // back into journey-t
}
```

**C¹ at the seams — the load-bearing subtlety.** A naive segment-LUT is only C⁰: velocity (`dt/ds`) jumps at
each boundary, reading as a tiny "gear change" jerk every act. Two cures, in priority order:

1. **Use `inOutSine` on transit segments and `outQuart` on anchors** as above. `inOutSine` has *zero slope*
   at both ends (`d/dx[0.5−0.5cos πx] = 0` at `x=0,1`), so a transit segment *eases into and out of* its
   neighbours — velocity goes to zero at the boundary and the anchor's `outQuart` also starts from a tame
   slope. The boundaries become **smooth velocity valleys**, not steps. This alone removes the visible jerk.
2. **Belt-and-braces:** feed the remapped target through the existing `damp()` (below). Damping a C⁰ signal
   already hides a small slope discontinuity; combined with #1 it is invisible. (Do **not** rely on damping
   alone — a large C⁰ break leaks through as a momentary lurch.)

### 4c. Hooking the rig (doc 27 §4c, one line changed)

The only change to `CameraRig` is **what feeds `cam.t`**: the remap, not the raw scroll.

```jsx
// src/scene/CameraRig.jsx — inside useFrame, replacing the doc-27 cam.t line
import { forge, damp, gw_pace } from '../store.js'

// ... existing: pump Lenis, compute scrollVel, scrollDamped, pointerDamped ...

// 2) THE JOURNEY — pace the scroll, THEN sample the curve.
const paced   = gw_pace(forge.scrollDamped)               // <-- the new layer
cam.t = damp(cam.t, paced, 4, dt)                          // settle (no bounce)
// optional lunge-clamp leaving a dwell: cap |dt| of cam.t
// (maath: easing.damp(cam, 't', paced, 0.18, dt, /*maxSpeed*/ 1.6))
JOURNEY.getPointAt(THREE.MathUtils.clamp(cam.t, 0, 1), pos)

const lookAhead = THREE.MathUtils.clamp(cam.t + 0.06, 0, 1)
FOCUS.getPointAt(lookAhead, look)
// ... existing: chamber blend, parallax, camera.position.lerp, camera.lookAt ...
```

Everything else in 27 (Lenis pump, `scrollVel`/`scrollDamped` writes, chamber blend `w`, parallax, the
`lerp(1 − 0.0001^dt)` snap term) is **untouched**. `gw_pace` is a single insertion.

### Key params / uniforms
- `PACE[i].weight` — the dwell↔transit knob. **Lower = more dwell** (anchors 0.5–0.6), **higher = faster
  transit** (channels 1.6–1.9). This is the camera analogue of `Content.jsx`'s `WEIGHTS`.
- `PACE[i].ease` — `outQuart` to arrive/settle at an anchor, `inOutSine` to glide a transit (and to keep C¹).
- `cam.t` damp `4` — path-follow settle weight (from 27). The remap shapes *where*; this shapes *how it
  lands*.
- `lookAhead +0.06` — anticipatory framing (27). **Note:** because `t` now moves *fast* through transit, a
  fixed `+0.06` look-ahead translates to a *larger world distance* during transit (good — more anticipation
  into the bend) and a *smaller* one during dwell (good — tighter on the held subject). The pacing curve
  improves the look-ahead **for free**; do not "fix" it.
- Optional `maxSpeed ≈ 1.4–1.8` (maath) — caps the camera's `t`-velocity so leaving a dwell never *whips*.

### How it hooks the shared master temperature system
This is camera-only by design, but it must **stay aligned** with the temperature spine:

- The slab veins, pour-front fill, sparks, and content frames keep reading **`forge.scrollDamped`** (the
  *linear* signal) — **not** the paced `t`. So the *metal's* heat advances with the user's literal scroll,
  while the *camera* dwells/sprints. This is intentional and is the cohesion lock: at The Arsenal the user
  has scrolled to `scrollDamped ≈ 0.74–0.95`, so `uTemp` is high and the wordmark is filling/hottest — **and**
  the paced camera is dwelling on that exact letter row. Heat and eye arrive together *because both are
  functions of the same `scrollDamped`*, just shaped differently.
- The **act-boundary strike pulse** (doc 27 §4, `forge.strikeAt` when `actIndexFor(scrollDamped)`
  increments) fires on the **scroll** boundary, which — by construction of `PACE.at == ACTS.at` — is the same
  instant the camera *arrives* at and begins dwelling on the anchor. The slab veins surge, the sparks flare,
  the bloom lifts (the shared §5/§6 systems of the cohesion map) on the **same frame the camera lands** —
  Brutalist-Snap impact, world-wide, on arrival. The pacing curve is what makes that arrival a *dwell* the
  surge can breathe inside, instead of a moment the camera blows past.
- If/when the camera couples to the live `uPourFront` (deep-dive candidate, §9 / 27 §9-4), `gw_pace` still
  owns the *rhythm* and the pour-front owns the *micro-target* — orthogonal layers, both reading the one
  temperature spine.

---

## 5. COHESION — shared palette / lighting / uniforms / clock

- **One scroll signal, two shapings.** Everything reads `forge.scroll`/`scrollDamped`; the camera additionally
  applies `gw_pace`. Nothing invents a private scroll clock. The remap is *additive and local to the rig* — it
  cannot desync the world because the world never reads `t`.
- **`PACE.at === ACTS.at`.** The pacing boundaries **are** the act boundaries already in `store.js`. Content
  frames (`Content.jsx`, keyed off the same act `at`s and `CENTERS`), the act-label HUD, the strike pulse, and
  the camera dwell all break at the *same* scroll fractions. The eye, the copy, and the heat agree on "which
  act we are in" by construction.
- **One easing vocabulary.** `EASES` mirrors `Content.jsx` (`easeOutQuart`, etc.). The camera arrives at an
  anchor with the *same* `outQuart` settle the wordmark frame uses to land — the eye and the copy share a
  motion signature, which is what makes the dwell read as *one* designed beat rather than two systems
  coincidentally pausing.
- **One clock, one rAF, `dt`-damped.** `gw_pace` is pure; the only stateful step is the existing `cam.t`
  `damp()` in the single `useFrame`. No `setInterval`, no spring, no second loop. Freeze cleanly on `static`
  (below).
- **Palette/lighting untouched.** Pacing moves *when* the eye is where; the warm-forge palette, the HDR `>1`
  hot band that blooms, the metal-is-the-only-light model, and the procedural env are all unchanged. Dwelling
  longer on Ignition simply gives the divine-fire A/E radiance and the Ogham reveal **more screen-time** —
  the pacing *serves* the signature lighting beats rather than altering them.
- **Brand motion law.** Glide (the `inOutSine` transit remap) + land (the `outQuart` anchor + `damp` settle) =
  the brand's "fluidity and snap layer, they don't replace each other." No bounce anywhere.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Cost:** `gw_pace` is a clamp, a 6-iteration locate loop, one ease call, and a lerp — **sub-microsecond**,
  far below the obsidian shader's ~4 ms. Zero allocation, zero render targets, zero passes. It is effectively
  free; it does **not** move the §10 cohesion-map budget needle.
- **Touch reality (the `tune-pacing` Rule 0).** On the iPhone 15, touch scroll may be **native, not Lenis**
  (`syncTouch` default). `gw_pace` still works perfectly — it remaps `forge.scrollDamped` regardless of where
  scroll came from. **But:** the *feel* of dwell-on-anchor must be verified on-device, because native iOS
  scroll inertia changes how long a user lingers in an act's scroll span. Tune `weight`s on the phone, not the
  desktop sim (the skill's hard rule).
- **iOS rubber-band:** clamp `s` in `gw_pace` (done) and `cam.t` before `getPointAt` (done) so over-scroll at
  the extremes never pushes `t` out of `[0,1]` and NaN-throws the curve sampler.
- **Tiers (mirror `forge.quality`):**
  - **`high` / `low`:** full `gw_pace` (it is too cheap to gate). `low` may raise the `cam.t` damp λ slightly
    for a cheaper settle; pacing math identical.
  - **`static` / reduced-motion:** `forge.lenis = null` (native scroll, doc 27). `gw_pace` **still applies** —
    it is deterministic and motion-safe (no momentum, no spring), so a reduced-motion user still gets the
    *dwell-then-transit composition* on scroll, just without smoothing. If `frameloop='demand'` and `uTime`
    is frozen, the camera still reads `gw_pace(scrollDamped)` on each scroll event; the **still poster** lands
    on an anchor pose. Optionally set all `PACE.ease` to `linear` under reduced-motion for the most literal,
    predictable scroll-to-position mapping. This is the required accessible fallback.
- **No second scroll layer.** Native DOM scroll is preserved (Lenis only smooths), so prerendered SEO/AEO HTML
  survives — `gw_pace` adds nothing to the DOM.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Pacing the world, not just the camera.** The cardinal error: feeding the paced `t` into the *veins /
   fill / sparks / content*. Then the metal heats non-linearly versus the user's scroll and the act labels
   desync — the world lies about "how far we are." **Only the camera reads `gw_pace`.** Everything else reads
   linear `scrollDamped`.
2. **C⁰ seam jerk.** A raw segment-LUT has velocity steps at boundaries → a visible per-act "gear change."
   Cure with `inOutSine` (zero end-slope) on transit segments **and** keep the final `damp()`. Verify by
   plotting `t` vs `s` — the slope must be continuous, no kinks (§4b).
3. **Non-monotonic remap.** If any segment's eased output can exceed the next segment's start, the camera
   scrubs *backwards* on forward scroll (nausea). Keep `T_BOUND` strictly increasing (weights > 0) and eases
   monotonic on `[0,1]` (all three in `EASES` are).
4. **Look-ahead whip from fast transit.** `t` moves fast through bends; a *large* `lookAhead` then snaps the
   look-at at corners. Keep `lookAhead` small (~0.05–0.08) and **damp the look-at target** (27 §7-4). The
   pacing makes anticipation better *only if* the look-at is smoothed.
5. **Tuning on desktop and declaring victory.** Native iOS inertia changes dwell feel. Measure numbers on
   desktop (build + Playwright scrub, fail >20 ms/frame), but read the **feel on the iPhone 15** before
   accepting `weight`s (`tune-pacing` Rule 0).
6. **Entangling path and pacing.** Resist baking dwell into control-point spacing (landscape E). Keep
   `JOURNEY` geometry and `PACE` rhythm in separate files/panels so each tunes independently.
7. **Anchor weight too low → frozen camera.** If an anchor `weight` is so small the camera is visually static
   across a long scroll span, it reads as "stuck/broken," not "dwelling." Dwell means *slow drift*, not *zero
   motion* — keep a floor (~0.45–0.6) and let the tiny residual `getPointAt` motion + parallax keep it alive.
8. **Forgetting `scrollVel` is still linear.** The living-veins flare reads `scrollVel` off *linear* scroll, so
   it still surges correctly when the user flicks — independent of pacing. Don't try to "pace" velocity too.

**Order of operations**
1. Land doc 27 first (Lenis + `JOURNEY`/`FOCUS` + constant-rate `cam.t`). Confirm travel-not-cuts works
   linearly before bending the rhythm.
2. Add `PACE`, `EASES`, `T_BOUND`/`S_BOUND`, and `gw_pace` to `store.js`. Unit-check in `?debug`: log/plot
   `gw_pace(s)` for `s = 0..1`, assert **monotonic** and **C¹** (no slope kinks).
3. Swap the one `cam.t` source line in `CameraRig` to `gw_pace(forge.scrollDamped)`. Verify the camera now
   crawls Ignition/Arsenal and sprints the channels — desktop first, for the geometry.
4. Tune `weight`s + eases in `?debug` leva (expose `PACE[i].weight`, `PACE[i].ease`) until dwell/transit reads
   right; keep total weight so the journey still spans the full scroll.
5. Confirm `PACE.at` still equals `ACTS.at` so content frames, labels, strike, and camera break together.
   Verify the act-boundary strike fires on the *arrival* of each dwell.
6. Reduced-motion pass: `gw_pace` still applies, optionally `linear` eases; static poster lands on an anchor.
7. QA at both judge viewports (`qa-route`/`tune-pacing`): 0 console errors, monotonic non-reversing scrub,
   no seam jerk, no seasickness, `t` clamped — **then the iPhone 15 feel read** (dwell must *feel* like a
   held cinematic beat, transit like momentum, the wordmark dwell must coincide with the wordmark filling).

---

## 8. SOURCES (2025–2026)

- **Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP"**, 19 Nov 2025 — segmenting a scroll
  journey into camera "shots" as keyframes in one clip, finding the keyframe from section index, custom
  cinematic eases (`cinematicSilk`/`cinematicFlow`), `scrub:1` smoothed follow, Lenis+`gsap.ticker`
  one-loop. https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
- **Codrops — "More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say"**, 28 Apr 2026
  — multi-scene scroll journey, thinking in scenes/acts, dwell-then-transit pacing as the 2026 bar.
  https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
- **pmndrs/drei — `ScrollControls.tsx` source + docs (`useScroll`: `range(from,distance,margin)`,
  `curve()=sin(range·π)`, `visible()`, `offset`, `delta`, `damping`)**, current 2025–2026 — the exact
  segmented `range`/`curve` math reused (without the container) for per-act remap.
  https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx ·
  http://drei.docs.pmnd.rs/controls/scroll-controls
- **Wawa Sensei — "Recreating Atmos 3D Website with React Three Fiber, Part 1: Curved Path"**, 2025 —
  `CatmullRomCurve3` + `getPointAt(t)` scroll→position, offset-sample look-at, lerp/damp of the curve
  parameter (the path layer this pacing curve feeds).
  https://wawasensei.dev/tuto/recreating-atmos-3d-website-with-react-three-fiber-part-1-curved-path
- **pmndrs/maath — README / `easing.damp*` (`damp`, `damp3`, `smoothTime`, `maxSpeed`,
  default easing `1/(1+t+0.48t²+0.235t³)`)**, current 2025–2026 — the frame-rate-independent settle stage +
  `maxSpeed` lunge clamp after the remap. https://github.com/pmndrs/maath/blob/main/README.md
- **GSAP — ScrollTrigger docs (scrub-timeline duration-as-proportion, `snap`, `scrub:n` smoothing,
  `ticker.lagSmoothing(0)`)**, current 2025–2026 — the duration≈dwell-weight concept and one-loop
  Lenis+ticker pairing (adopted as concept, not dependency). https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **Svilenković — "Scrollytelling Trends 2026"**, 2026 — scroll-as-pace-control, scenes-not-sections, dwell
  time as the engagement lever; confirms non-uniform act pacing as the 2026 expectation.
  https://svilenkovic.com/3d/scrollytelling-trends-2026
- **Josh W. Comeau — "Scroll-Driven Animations"**, 2025 — `animation-timeline: scroll()` + `animation-range`
  per-segment ranges; the browser-native segmented-pacing model (reserved for the DOM layer only).
  https://www.joshwcomeau.com/animation/scroll-driven-animations/
- **Three.js Journey — "Scroll based animation"** (Bruno Simon), current 2025–2026 — per-section objects and
  scroll→progress mapping, the canonical r3f/three.js scroll-section teaching reference.
  https://threejs-journey.com/lessons/scroll-based-animation

---

## 9. DEEP-DIVE CANDIDATES

1. **Velocity-matched seam smoothing (C¹/C² boundary blending).** Replace the per-segment ease with a global
   monotone Hermite / Catmull-Rom *through the `(s,t)` boundary points* (a 1-D pacing spline), or a small
   blend window that matches `dt/ds` across each act seam — guaranteeing C² (continuous acceleration), the
   highest-polish removal of any residual gear-change feel.
2. **Pour-front-locked dwell coupling.** Bind the *dwell anchors* to the live `uPourFront` arc-coordinate
   (shared uniform) rather than fixed scroll fractions, so the camera dwells *exactly when and where* the
   molten front is filling a letter — pacing that chases the actual metal, not a pre-baked timeline.
3. **Adaptive pacing under thermal throttle.** When the §10 `PerformanceMonitor` demotes the tier, widen
   transit `weight`s / shorten dwell so the *total* journey costs fewer high-detail frames during the slow
   thermal decline — pacing as a perf lever, not just an art one.
4. **Per-route pacing presets (`scenes.js` × `PACE`).** A per-chamber pacing temper (e.g. the channel-hall
   `/automations` route emphasises long transit sprints; the altar `/about` route emphasises dwell on the
   AE/Ogham reveal) damped on navigation, so each chamber has its own rhythm signature inside one shared
   pacing system.
