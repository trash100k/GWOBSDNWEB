# 59 — The Descend-to-Eye-Level Reveal as a Named Cinematic Beat

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **I-camera-motion**. Parents: Phase-1
**27 (scroll-camera-paths)** and **28 (cinematic-camera-dof)**; siblings **55 (banked look-at)**,
**56 (act-segmented pacing)**, **57 (journey↔chamber blend)**. Target: iPhone 15 (OLED), one WebGL
renderer (r3f / three.js r17x), warm-forge palette. Topic: a **reusable monumental-reveal primitive**
that coordinates **path-drop + fov dolly-zoom + focus-rack** on ONE shared `range` window — the camera
settles to a low eye-line looking slightly *up* at the cast word so it reads monumental — exposed in
`?debug`, so the home finale and every route finale fire the **same** Brutalist-Snap beat. No spring,
only impact._

> Scope split: doc **27** owns where the camera **goes** (the `JOURNEY` curve by arc-length). Doc **55**
> owns how the body is **held** (banked heading + roll). Doc **56** owns the **rhythm** (dwell/transit
> remap of the path parameter). Doc **28** owns how the lens **sees** (fov, DOF, focus). **This doc owns
> the FINALE**: the single named beat that fires when a journey *arrives* — it does not invent a fourth
> camera authority, it **composes the four existing ones into one tunable primitive** and writes the
> shared focal scalars (`forge.focusDist`/`focusRange`) and the finale fov delta that 28's lens already
> reads. It is the camera-path twin of `Content.jsx`'s headline-arrival HOLD: the scrub glides, the
> finale *lands hard*.

---

## 1. SCOPE — what this element is in the GAELWORX world

Every GAELWORX journey ends on the same image: the **cast GAELWORX wordmark**, metal-filled, the body
letters cooled white-hot → orange → forge-red → iron-black, the **A and E** holding eternal white-gold
divine fire that radiates onto the carved Ogham. That is the payoff the whole forging builds toward —
"Point the Sword," act 6 in `store.js` (`at: 0.95`). The job of *this* element is the **camera move that
delivers that image**: a coordinated descent from the high altar-approach down to a **low, near-horizontal
eye-line looking slightly UP at the letters**, so the cast word towers over the viewer and reads
**monumental** — a forged monument, not a logo on a page.

The Phase-1 docs already named the pieces of this move (28 §4.3 sketched "path-drop + fov dolly-zoom +
focus rack on `range(scrollDamped, 0.82, 0.18)`"). What was missing — and what 28 §9 candidate 3 and the
cluster brief now demand — is to **promote that ad-hoc sketch into a first-class, reusable, named
primitive**: `gw_reveal` / `<MonumentalReveal>`. The reasons it must be a primitive, not a one-off:

1. **Consistency across finales.** The home finale, the `/contact` forge-mouth arch, the `/about`
   altar-approach keystone, and the `/work` plinth gallery all want "the camera settles, reverent, looking
   up at the hero, focus racks onto it, the void rushes behind." If each route hand-rolls that, they drift
   — different drop heights, different dolly amounts, different timing — and the world stops feeling like
   one camera. One primitive with per-route **params** (not per-route **code**) keeps them identical in
   *grammar* and distinct in *value*, exactly the `scenes.js` "one world, eight apertures" contract.
2. **Tunability.** This is the single most-watched two seconds of the experience; it must be authored on
   the iPhone-15 OLED in `?debug`, not guessed. A primitive with a flat param block is leva-tunable; a move
   smeared across `CameraRig` + `Effects` + the journey curve is not.
3. **Brand-law compliance.** The reveal *is* Brutalist Snap — "high-momentum easing, no bounce, only
   impact on arrival." A spring/elastic finale is off-brand. Centralising the easing in one primitive means
   the no-overshoot guarantee is enforced once, not re-litigated per route.

The reveal is **not** a new render path. It writes only: a finale-window scalar `r ∈ [0,1]`, a fov delta
(consumed by 28's lens), the damped `forge.focusDist`/`focusRange` (consumed by 28's DOF + the ember CoF),
and a small Y/pitch bias blended onto the `JOURNEY`/`FOCUS` samples (the same three lines 55 owns). Zero
extra passes, zero extra render targets, zero second rAF.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable way to build a reusable "arrive on the hero" camera beat, scored on quality / perf / mobile /
complexity / cohesion-fit. The input in all cases is `forge.scrollDamped` (home) or a route-entry progress
(chamber), and the shared `forge.*` bus.

### A. GSAP timeline of named "shots" scrubbed by scroll (the 2025–2026 studio idiom)
The dominant 2025–2026 pattern (Codrops *How to Build Cinematic 3D Scroll Experiences with GSAP*,
2025-11-19; *More Than a Portfolio*, 2026-04-28) is to author the camera as a **GSAP timeline of labelled
shots** — `tl.addLabel('approach')`, `tl.addLabel('descend')`, `tl.to(cam, {...}, 'descend')` — driven by
`ScrollTrigger { scrub: 1 }`, with **named CustomEases** (`cinematicSilk`, `cinematicFlow`,
`cinematicSmooth`, `cinematicLinear`) shaping each shot's feel. Timeline *labels* are GSAP's standout
feature for non-linear sequencing — they are literally "named shots."
- **Quality:** Excellent, designer-tunable, the canonical 2026 cinematic-scroll look.
- **Perf/Mobile:** Good, but adds GSAP + ScrollTrigger + CustomEase to the bundle and introduces a **second
  animation authority** that competes with the `forge` store's `damp()` model and the single `useFrame`
  writer. Two authorities tweening `camera.fov` is the recipe for the exact desync 27 warns about.
- **Cohesion-fit:** **Poor for GAELWORX specifically.** The whole architecture is "one mutable store, one
  loop, `damp()` everywhere." We *borrow the vocabulary* — named shots, per-shot easing — and implement it
  as pure math in the store, the same resolution 56 reached for `range`/`curve`.
- **Verdict:** Borrow the **concept** (named beat, per-beat ease), reject the **runtime**.

### B. Theatre.js keyframed finale clip scrubbed by scroll
Theatre.js (Codrops fly-through, canonical) stores the descend as a keyframed clip; scroll scrubs the
playhead. Visual editor, precise timing.
- **Quality:** High; editor-authored timing.
- **Cohesion-fit:** **Poor** — desktop-only editor, a runtime dependency, and a second animation authority
  fighting the store. 27 already rejected it for the journey; the finale inherits that rejection.
- **Verdict:** No.

### C. Piecewise primitive: one `range` window + per-channel eased blend (**the studio idiom, our way**)
Define the reveal as a **pure function of a single normalised finale progress** `r = ease(range(s, start,
len))`, where `r` simultaneously drives (a) a Y-drop + pitch-up bias on the camera, (b) a fov narrowing
(dolly-zoom), and (c) a focus-rack toward the word's front face. One window, one `r`, three coordinated
channels, each with its own ease curve and clamp. This is the GSAP-timeline grammar (A) expressed as the
`gw_pace`-style math 56 already established, living in the same store, read by the same loop.
- **Quality:** Excellent — full control over each channel's curve, and because they share one `r` they
  **land together** (the cohesion requirement). The `dwell` at the end is free: `range` clamps `r` to 1 and
  holds.
- **Perf/Mobile:** Excellent — a clamped `range`, three `pow`/`smoothstep` eases, a `damp()`. Pennies.
- **Cohesion-fit:** **Best.** It is the camera-path twin of `Content.jsx`'s HOLD/FADE and 56's
  `gw_pace`; reads `forge.scrollDamped`; writes the shared focal scalars 28 reads; obeys the one-loop rule.
- **Complexity:** Medium — authoring the three channel curves + keeping the start of the window C¹ with
  56's pacing remap so the finale doesn't "gear-change" as it begins.

### D. Pure dolly-zoom (Vertigo) math, subject-size-locked
The textbook dolly-zoom holds the subject's *screen size* constant while fov changes, by moving the camera
so `distance · tan(fov/2)` stays fixed: `RATIO = initialDist · tan(fov₀/2)`, then per frame
`newDist = RATIO / tan(fovNew/2)` (Lomarco, Medium 2025; threejsdemos dolly-zoom; three.js issue #1239 for
the half-angle framing math). This is the *physically correct* vertigo — the word stays the same size while
the void behind it expands/compresses.
- **Quality:** The most cinematic single lever; "the void rushes behind the held word" is literally this.
- **Perf/Mobile:** Free (camera math).
- **Cohesion-fit:** **High as a sub-component of C, not as the whole beat.** Pure subject-locked dolly-zoom
  fights the `JOURNEY` curve (which is *also* moving the camera). The resolution: drive the *fov* from `r`
  (the dolly-zoom's "zoom" half) and let the **curve's own Y-drop** be the "dolly" half, rather than
  computing a strict subject-locked distance. We get the vertigo *read* (fov narrows as we descend) without
  two systems fighting over `camera.position`. Doc 28 already chose `−8°` fov over last 18% for exactly
  this reason.
- **Verdict:** Fold the **fov-narrow** half into C; do **not** run a standalone subject-locked distance
  solver against the curve.

### E. `maath/easing.damp*` as the settle stage (the frame-rate-independent finisher)
pmndrs `maath` (`easing.damp`, `damp3`, `dampE`, `dampC` — Game Programming Gems 4 §1.10, refresh-rate
independent, interruptible) is the 2025–2026-standard way to make a target-chasing value settle smoothly
regardless of frame rate. The project already uses the equivalent `THREE.MathUtils.damp` wrapper
(`store.js` `damp`).
- **Quality:** Excellent for the **settle** — when `r` hits 1, the camera/fov/focus *arrive* and damp to
  rest with no overshoot. This is the Brutalist-Snap "impact, no bounce."
- **Cohesion-fit:** **Mandatory finisher.** The reveal's three channels each end in a `damp()` toward their
  `r=1` target, so a fast flick to the bottom doesn't teleport — it *snaps in with weight*. Use the repo's
  `damp` (same curve), or `maath` if we want `dampE` for the pitch quaternion.
- **Verdict:** The settle stage of C.

### F. react-spring / drei spring camera
Spring physics on the camera.
- **Quality:** Smooth, but **springs overshoot** — that is their charm and their disqualification here.
  Brand law is "no bounce, only impact." A spring finale is the exact wrong feel.
- **Verdict:** No. (Damp, not spring — the recurring GAELWORX motion ruling.)

**Landscape verdict:** the primitive is **C** (one `range` window → one `r` → three eased channels),
with **D**'s fov-narrow folded in as the dolly-zoom channel, **E**'s `damp()` as the settle, and **A**'s
*vocabulary* (named beat, per-channel ease) adopted but implemented in-store. B/F are rejected for
introducing a second authority / overshoot. The focus-rack channel uses 28's proven
`worldFocusDistance` (not `target` — r3f #3113).

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Build `<MonumentalReveal>` (logic in `src/scene/reveal.js`, a few lines added to `CameraRig`'s existing
`useFrame`), a pure-math primitive that, given a single finale progress `r = revealEase(range(progress,
start, len))`, coordinates three channels onto the shared bus: (1) PATH-DROP + PITCH-UP — bias the
`JOURNEY`/`FOCUS` samples so the camera lowers `dy` and looks slightly UP at the word (`pitchUp`), making
it monumental; (2) DOLLY-ZOOM — narrow `camera.fov` by `fovPull` so the void rushes behind the held word
(28's lens reads this); (3) FOCUS-RACK — damp `forge.focusDist` from journey depth to the word's front
face and slightly widen then re-tighten `forge.focusRange`, so focus racks onto the cast word (28's DOF +
the ember CoF read these). All three share ONE `r`, each ends in `damp()` (no overshoot), and the whole
block is a flat param record per finale, leva-exposed. The home finale and each route finale call the SAME
primitive with different params — identical grammar, distinct values.**

Justification against the world + the existing code:

- **It composes, it doesn't compete.** The reveal writes the exact signals 27/28/55 already read
  (`JOURNEY`/`FOCUS` Y bias, `camera.fov`, `forge.focusDist`/`focusRange`). It adds **no** camera authority,
  **no** second loop, **no** new pass. It is the finale *conductor*, not a fourth instrument — the same
  discipline that keeps the whole build cohesive.
- **One `r`, three channels = they land together.** The deepest failure of a hand-rolled finale is the
  drop, the zoom, and the rack arriving on slightly different frames (reads as three separate animations).
  Binding all three to one `range`-derived `r` makes them a single gesture — the cohesion lock for the beat,
  the same lock 28 §4.3 demanded.
- **Reusable param record, not reusable code path.** Per-route finales differ in `dy`, `pitchUp`,
  `fovPull`, `start`, `len`, and the rack target — values, in `scenes.js`/a `REVEALS` table — never logic.
  This is "one world, eight apertures" applied to the finale, and it is what makes the home and `/contact`
  finales feel like the *same* camera arriving in different rooms.
- **Brutalist Snap by construction.** Every channel ends in `damp()` toward its `r=1` target with no spring
  term; `revealEase` is a monotone ease-*out* (arrive-and-settle), never an ease-with-overshoot. The reveal
  *arrives*; it does not spring.
- **Looks UP — the monument rule.** The single art-direction non-negotiable: at `r=1` the look-at target
  sits **above** the camera eye-line (`FOCUS` Y biased up + `pitchUp`), so the letters are read from below
  and tower. This is the difference between "reverent monument" and "product shot," and it is a one-line
  bias on the `FOCUS` sample.
- **C¹ into the pacing.** The window `start` is chosen to begin where 56's `gw_pace` has *already* slowed
  the path to a dwell (anchor act), so the reveal's onset doesn't fight a fast transit — no gear-change at
  the seam.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- **No new dependency.** `three` r17x, `@react-three/fiber`, `@react-three/postprocessing` v3.0.4
  (2025-02-20), `leva` — all already in the repo. The DOF/fov/focus consumers are doc 28's existing wiring.
- Optional: `maath` (already a transitive pmndrs dep) for `easing.dampE` on the pitch quaternion if we want
  it framerate-independent without hand-rolling; otherwise the repo `damp` suffices.

### 4.2 The reveal math — `src/scene/reveal.js`

A pure, allocation-free module. `revealAt(progress, p)` returns the three channel values for a given finale
progress and a param record `p`. No `THREE` objects allocated per frame (callers pass scratch vectors).

```js
// src/scene/reveal.js — the monumental-reveal primitive (pure math, no allocations)
import * as THREE from 'three'

// range(): normalised 0..1 progress inside [start, start+len], clamped & held (drei-style)
export const range = (x, start, len) =>
  THREE.MathUtils.clamp((x - start) / Math.max(len, 1e-4), 0, 1)

// revealEase: monotone ease-OUT — ARRIVE and settle. NO overshoot (Brutalist Snap, not spring).
// easeOutQuart-ish; r=0 → start of descent, r=1 → seated on the monument.
export const revealEase = (r) => 1 - Math.pow(1 - r, 4)

// Per-finale param record. One world, eight apertures: same fields, different values.
// (lives in scenes.js / a REVEALS table; defaults here)
export const REVEAL_DEFAULT = {
  start: 0.82,      // scrollDamped (or route-entry progress) where the descent begins
  len:   0.18,      // window width — the descent occupies the last 18%
  dy:   -0.9,       // camera Y drop to eye-level (world units, ADDED to the curve sample)
  pitchUp: 0.55,    // how far the look-at rises ABOVE eye-line → we look UP (the monument rule)
  fovPull: 8.0,     // degrees of dolly-zoom narrowing (void rushes behind the word)
  rackDist: 4.2,    // worldFocusDistance the rack settles to (word front face)
  rackRange: 1.4,   // worldFocusRange at rest (tight on the word)
  rackOpen: 1.6,    // transient range WIDEN mid-rack (the "aperture opens" then closes)
}

// Compute the three channel outputs for finale progress `s` and params `p`.
// Returns scalars; the caller applies them to the curve sample, fov, and forge.*.
export function revealAt(s, p = REVEAL_DEFAULT) {
  const rRaw = range(s, p.start, p.len)
  const r = revealEase(rRaw)                 // 0..1, arrive-and-settle
  return {
    r,
    dy: p.dy * r,                            // additive Y drop on the JOURNEY sample
    pitchUp: p.pitchUp * r,                  // additive Y rise on the FOCUS sample → look UP
    fovPull: p.fovPull * r,                  // degrees to SUBTRACT from camera.fov (dolly-zoom)
    // focus rack: distance eases to the word; range widens at mid-rack (sin bump) then re-tightens
    rackDist: p.rackDist,                    // target the caller damps forge.focusDist toward, gated by r
    rackRange: p.rackRange + p.rackOpen * Math.sin(rRaw * Math.PI), // 0→open→0 across the window
  }
}
```

`Math.sin(rRaw·π)` is drei's `curve()` bump — the in-focus band **opens** at mid-descent (focus is in
transit, a soft pull) and **re-tightens** to `rackRange` as we seat (the word snaps sharp). That is the
optical signature of a real rack-focus.

### 4.3 Wiring into `CameraRig` (the one loop)

The reveal slots into the **existing** `CameraRig` `useFrame`, *after* the `JOURNEY`/`FOCUS` samples (27)
and *before* the banked-orientation block (55). Scratch vectors are module-level (no per-frame `new`).

```jsx
// CameraRig.jsx — additions inside the existing useFrame, after pos/look are sampled
import { revealAt, REVEAL_DEFAULT } from './reveal.js'
import { sceneFor } from './scenes.js'
import { damp } from '../store.js'

// ... 27's code has already produced: pos = JOURNEY.getPointAt(cam.t), look = FOCUS.getPointAt(...)

// 1) which finale progress drives the reveal?
//    home  → forge.scrollDamped (the act-6 window);
//    route → a damped route-entry progress in [0,1] (1 = fully arrived in chamber).
const sc = sceneFor(forge.route)
const onHome = forge.route === '/'
const finaleProgress = onHome
  ? forge.scrollDamped
  : (forge.routeArrive ?? 0)              // 0→1 as the chamber blend completes (doc 57)

const p = sc.reveal ?? REVEAL_DEFAULT     // per-route param record; falls back to default
const R = revealAt(finaleProgress, p)

// 2) PATH-DROP + PITCH-UP — bias the curve samples (the monument). Additive, gated by R.
pos.y += R.dy                              // lower the eye to a reverent eye-line
look.y += R.pitchUp                        // raise the look-at ABOVE the eye → we look UP at the word

// 3) DOLLY-ZOOM — narrow fov. 28's lens owns cam.fov damping; we just subtract the pull.
//    cam.fovTarget is 28's per-route damped fov; we apply the finale delta on top.
cam.fovTarget = sc.fov ?? 40
const fovGoal = cam.fovTarget - R.fovPull
cam.fov = damp(cam.fov, fovGoal, 2.4, dt)  // damp → no bounce
if (Math.abs(camera.fov - cam.fov) > 0.001) {
  camera.fov = cam.fov
  camera.updateProjectionMatrix()          // REQUIRED after every fov change (#1 dolly-zoom bug)
}

// 4) FOCUS-RACK — damp the SHARED focal scalars toward the word. 28's DOF + ember CoF read these.
//    Blend journey-depth → word-rack by R.r so focus racks onto the monument as we seat.
const journeyDist = camera.position.distanceTo(forge.pourFront ?? ORIGIN)
const focusGoal   = THREE.MathUtils.lerp(journeyDist, R.rackDist, R.r)
forge.focusDist  = damp(forge.focusDist  ?? focusGoal,  focusGoal,  4, dt)  // rack easing (λ4)
forge.focusRange = damp(forge.focusRange ?? R.rackRange, R.rackRange, 4, dt)

// ... 55's banked-orientation block consumes pos+look exactly as before
```

The reveal touches **four lines of shared state** — `camera.fov`, `forge.focusDist`, `forge.focusRange`,
and the `pos.y`/`look.y` bias on the existing samples. Everything else (the DOF pass, the ember CoF point
size, the bloom that blooms the held word, the basalt/Ogham AE radiance) is **unchanged** and simply reads
the scalars the reveal now writes. That is the cohesion proof: the finale conducts; the world responds.

### 4.4 Reduced-motion / static tier (mandatory floor)
On `static`/reduced-motion the reveal must not animate fov/position per frame (motion-sickness + the
`'demand'` frameloop). Instead it **snaps once** to its `r=1` pose: the camera at the seated eye-line, fov
at `fovTarget - fovPull`, focus at `rackDist`/`rackRange`. The monument still reads — low angle, looking
up, word sharp, void compressed — as a **dignified still**, not a broken fallback. One branch:

```jsx
if (forge.quality === 'static') {
  // freeze at the arrived pose; no dolly animation, no DOF, sharp embers
  const R1 = revealAt(p.start + p.len, p)        // r = 1
  pos.y += R1.dy; look.y += R1.pitchUp
  camera.fov = (sc.fov ?? 40) - R1.fovPull; camera.updateProjectionMatrix()
  forge.focusDist = R1.rackDist; forge.focusRange = R1.rackRange
}
```

### 4.5 `?debug` leva panel
Expose the param record so the beat is authored on-device (the project convention):
`start`, `len`, `dy`, `pitchUp`, `fovPull`, `rackDist`, `rackRange`, `rackOpen`, plus a **"scrub finale"**
slider (0..1) that overrides `finaleProgress` so the descent can be inspected at any `r` without scrolling.
Tune `dy`/`pitchUp` until the word **towers**, `fovPull` until the void *rushes* without seasickness, and
`rackRange`/`rackOpen` until the word snaps sharp as the camera seats. The single most-watched two seconds —
never guessed.

### 4.6 Key params
| Param | Value | Why |
|---|---|---|
| `start` | 0.82 (home) | last act ("Point the Sword"); begins where 56's pace is a dwell |
| `len` | 0.18 | the descent occupies the final 18% of the window |
| `dy` | −0.9 wu | drop to a reverent eye-line |
| `pitchUp` | 0.55 | look-at rises above eye → **we look UP** (monument rule) |
| `fovPull` | −8° | dolly-zoom; void rushes behind the held word |
| `rackDist` | ≈ word front face (wu) | focus racks onto the cast monument |
| `rackRange` | 1.4 (rest) | tight on the word at seat |
| `rackOpen` | 1.6 | mid-rack aperture-open `sin(r·π)` bump → optical rack signature |
| ease | `1−(1−r)⁴` | ease-OUT, arrive-and-settle, **no overshoot** |
| settle damp λ | fov 2.4 · focus 4 | high-momentum, no bounce (Brutalist Snap) |

### 4.7 How it hooks the master temperature system
The reveal is a **pure consumer/co-author of the shared bus** — it invents no heat, no color, no noise:
- It **reads** `forge.scrollDamped` (home) / `forge.routeArrive` (route, doc 57), `forge.pourFront` (the
  journey-depth focus anchor), and the per-route `scenes.js.fov`/`reveal` record.
- It **writes** `forge.focusDist`/`forge.focusRange` — the *same scalars* 28's DOF pass **and** the
  particle-CoF embers read — so the focal plane that the reveal racks onto is the focal plane the post and
  the sparks share. One focal plane, three consumers, never out of sync.
- Because the finale window is `scrollDamped ≥ start`, the cast word is **hottest and most-filled exactly
  when the reveal seats on it** (the metal temperature `uTemp` and the fill front advance with the same
  `scrollDamped`). The A/E divine fire — pushed highest in emissive (cohesion-map §1.4) — blooms most as
  the camera arrives, and if slightly off the seated focal plane gets the largest bokeh, optically
  *radiating onto adjacent stone* (cohesion-map §5.2). The reveal does not light the word; it **frames the
  light the temperature system already made**, on the same heartbeat. That is the lock.

---

## 5. COHESION

- **One renderer, one composer, one loop, one store.** The reveal is a few lines in the *existing*
  `CameraRig` `useFrame`; it adds no pass, no rAF, no camera authority. It writes the *same* `forge.*`
  scalars 28 reads. (`forge-scene` single-renderer rule; `post-fx` one-composer rule; 27/28 one-loop rule.)
- **Shared bus, one `r`.** Drop, dolly-zoom, and focus-rack are all functions of one `range`-derived `r`,
  which is itself a function of the shared `scrollDamped`/`routeArrive`. Nothing reads a private finale
  value, so the three channels — and the metal temperature, the bloom, the AE radiance — cannot disagree
  about "we have arrived." The metal that is hottest is the metal we seat on, in focus, in frame.
- **Palette/lighting untouched.** The reveal moves and focuses the eye; it adds **no** color and **no**
  light. The warm-forge palette, the HDR `>1` hot band that blooms, the AE divine fire, and the
  neutral-cool procedural env are all unchanged. It frames the same lit world.
- **Composes 27/28/55/56, conducts none of them.** 27's curve still positions; 55's quaternion still
  orients (it consumes the biased `pos`/`look`); 56's pace still warps the path parameter (the reveal's
  `start` sits inside 56's final dwell); 28's lens still damps fov/DOF (the reveal just supplies the finale
  delta + focal target). The primitive is the **conductor of the finale**, not a fifth section.
- **Brand motion.** Every channel ends in `damp()` toward its `r=1` target; `revealEase` is ease-out with
  no overshoot term. The descent *arrives* (Brutalist Snap), it does not spring. The blur-to-sharp
  focus-rack is a literal **Forge Reveal** beat, timed off the same `scrollDamped` window as the
  finale-copy reveal in `Content.jsx`, so the eye and the headline land together (the 56 cohesion rule
  applied at the finale).
- **One world, eight apertures.** Per-route finales differ only in the `reveal` param record in `scenes.js`
  — never in logic — so `/`, `/contact`, `/about`, `/work` all fire the *same* monumental beat with their
  own drop/zoom/rack values. The finale is route-tempered, not route-rebuilt.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **The primitive itself is free.** `revealAt` is a `range` clamp, three `pow`/`sin` eases, and a couple of
  `damp()`s — a handful of scalar ops in the loop that already runs. **Zero render targets, zero passes,
  zero allocations** (scratch vectors are module-level; `revealAt` returns a small reused-shape object — or
  inline the four scalars if even that GC is a concern on `low`). No measurable cost.
- **The cost it *gates* is doc 28's DOF**, which it merely *aims*. Tier story is unchanged from 28:
  - `high`: full `<DepthOfField resolution:480>` racks via `forge.focusDist`; fov dolly-zoom on; ember CoF on.
  - `low`: `TiltShift2` instead of DOF; the reveal still drops/zooms and writes `focusDist` for the ember
    CoF; the focus-rack reads as the tilt-shift band tightening on the letter row.
  - `static`/reduced-motion: **snap to the `r=1` pose** (§4.4), no per-frame fov animation, no DOF, sharp
    embers. The monument still reads. Required floor.
- **`updateProjectionMatrix` discipline.** Call it only on frames where fov actually changed (the `>0.001`
  guard) — every-frame matrix rebuilds are wasteful, and during the *settle* the guard naturally stops the
  calls once `cam.fov` reaches `fovGoal`.
- **Motion-sickness / vestibular safety.** Animating fov **and** path drop **and** parallax at once can
  swim. Mitigations baked into the primitive: (1) the dolly-zoom is reserved for the **finale only** (not
  per-route fov changes), (2) `fovPull` is modest (≤8°) and `damp`'d, (3) cursor parallax is already gated
  to 0 on `static`, (4) reduced-motion snaps instead of animating, (5) the `range` window is **clamped**
  so iOS rubber-band can't push the dolly-zoom past its target (the #10 pitfall in 28).
- **OLED banding.** The DOF the reveal aims softens the dark void gradients behind the seated word — a
  banding risk on a true-black panel. The existing grain (≥0.03, doubling as dither, cohesion-map §3.3)
  covers it. The reveal never lightens the void; crushed blacks survive.
- **INP.** No new shader compile, so no `compileAsync` concern. The fov change can `invalidate()` on a
  `'demand'` frameloop if ever needed, but the home/route finales run `'always'`, so it just damps.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Three channels that don't share one `r`.** Hand-rolling drop, zoom, and rack on separate windows/eases
   makes them arrive on different frames → reads as three animations, not one gesture. **Bind all three to
   one `range`-derived `r`.** This is the whole point of the primitive.
2. **Forgetting `updateProjectionMatrix()` after the fov pull.** The dolly-zoom silently no-ops. Guard +
   call only on change (the #1 dolly-zoom bug, also flagged in 28).
3. **Looking *level* or *down* at the word.** Kills the monument. The look-at MUST sit above the eye
   (`look.y += pitchUp`) so we read the letters from below. If it doesn't tower in `?debug`, raise
   `pitchUp`/lower `dy`.
4. **A spring/overshoot finale.** Off-brand. `revealEase` is ease-OUT (`1−(1−r)⁴`), no overshoot term;
   every settle is `damp()`, never a spring. The reveal *arrives*; it never bounces back.
5. **Running a strict subject-locked dolly-zoom against the `JOURNEY` curve.** Two systems fighting over
   `camera.position` → jitter. Drive **fov** from `r` and let the **curve's Y-drop** be the dolly; do not
   solve a `RATIO/tan(fov/2)` distance against a curve that is also moving the camera (landscape §D).
6. **Window onset inside a transit dwell-mismatch.** If `start` lands where 56's `gw_pace` is still
   *accelerating*, the descent fights the transit and gear-changes. Put `start` inside the final **dwell**
   (anchor act) so the path is already slow when the reveal begins — C¹ at the seam.
7. **Rack-focus whip.** Snapping `focusDist` to the word reads as a pull-jerk. **Damp it (λ4)** — that *is*
   the cinematic rack. Never feed a raw distance to the DOF.
8. **Bokeh too big during the rack.** A large `bokehScale`/`rackOpen` reads as a software smear, not a lens.
   Keep `rackOpen` modest; the *softness*, not the size, sells the rack (28 pitfall 4).
9. **No reduced-motion floor.** Animating the descent under `prefers-reduced-motion` is a vestibular hazard
   and breaks the `'demand'` frameloop. **Snap to `r=1`** (§4.4) — non-negotiable.
10. **Per-route finales drifting.** If a route hand-rolls its finale instead of supplying a `reveal` param
    record, the grammar drifts and the world stops feeling like one camera. **Param record, never code.**

**Order of operations**
1. **Build `reveal.js` pure math** (`range`, `revealEase`, `revealAt`, `REVEAL_DEFAULT`); unit-eyeball the
   curves (`r` monotone 0→1, `rackRange` bumps then re-tightens). Zero GPU.
2. **Wire the path-drop + pitch-up** into `CameraRig` after the curve samples. Verify in `?debug` (scrub-
   finale slider) that the camera **descends to eye-level and looks UP** at the word. Get the *monument*
   right before any lens.
3. **Add the fov dolly-zoom** (`fovPull`, `updateProjectionMatrix` guard). Verify the void compresses/
   rushes behind the held word with no seasickness.
4. **Add the focus-rack** writing `forge.focusDist`/`focusRange`; confirm 28's DOF (high) and the ember CoF
   (all tiers) read them and the word snaps sharp as the camera seats.
5. **Promote to a param record** in `scenes.js` (`reveal:`); wire `/contact`, `/about`, `/work` finales to
   the **same primitive** with their own values. Confirm grammar is identical, values distinct.
6. **Reduced-motion / static snap** (§4.4); verify the still reads monumental.
7. **C¹ seam check** with 56 — `start` inside the final dwell; no gear-change as the descent begins.
8. **QA on the iPhone-15 OLED** (`qa-route`/`tune-pacing`): build (SwiftShader compiles GLSL → 0 console
   errors), then *watch the finale* — towering word, void rush, sharp rack, no bounce, no swim, crushed
   blacks intact. None of bokeh/rack/monumentality/seasickness simulate headless; this is a device read.

---

## 8. SOURCES (2025–2026)

1. **Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP"** (2025-11-19). The canonical
   2025 pattern: scroll as cinematic director, camera as a timeline of **named/labelled shots** with custom
   eases (`cinematicSilk`, `cinematicFlow`, `cinematicSmooth`, `cinematicLinear`), `ScrollTrigger
   {scrub:1}`; the "spread each section's shot as a keyframe in one clip" framing this primitive adopts as
   pure math. https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
2. **Codrops — "More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say"** (Joseph
   Santamaria, 2026-04-28). Scenes composed "with the care a film sets a frame," the visitor should "feel
   like they arrived somewhere" — the dwell-on-arrival, frame-the-hero grammar this beat formalises.
   https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
3. **Gianluca Lomarco — "From Perspective to Orthographic Camera in Three.js with Dolly Zoom — Vertigo
   Effect"** (Medium, 2025). The subject-size-locked dolly-zoom math: `RATIO = initialDist · tan(fov₀/2)`,
   `newDist = RATIO / tan(fovNew/2)`, `updateProjectionMatrix()` after every fov change — the dolly-zoom
   channel's reference (folded as fov-narrow, not run as a standalone distance solver).
   https://medium.com/@gianluca.lomarco/from-perspective-to-orthographic-camera-in-three-js-with-dolly-zoom-vertigo-effect-96de89c3a07b
4. **threejsdemos.com — "Dolly Zoom (Vertigo Effect)"** (current 2025–2026). Live three.js dolly-zoom: move
   + counter-fov so the subject holds size while the background compresses/expands; `updateProjectionMatrix`
   discipline. The "void rushes behind the held word" read. https://threejsdemos.com/demos/camera/dolly-zoom
5. **pmndrs/react-three-fiber — Discussion #3113, "Depth Of Field: Target vs WorldFocusDistance"** (2025).
   `worldFocusDistance` (camera→target world distance) is the reliable focus-tracking path for a moving
   subject; `target` is flaky — the rack-focus channel uses `worldFocusDistance`, written via the shared
   `forge.focusDist`. https://github.com/pmndrs/react-three-fiber/discussions/3113
6. **react-postprocessing — `DepthOfField` docs (v3.0.4, 2025-02-20)**. `worldFocusDistance`,
   `worldFocusRange`, `bokehScale`, `resolution`/`height`; merges into the `EffectPass` — the high-tier
   consumer the reveal aims. https://docs.pmnd.rs/react-postprocessing/effects/depth-of-field
7. **pmndrs/maath — README / `easing` module** (current 2025–2026). `easing.damp/damp3/dampE/dampC`
   (Game Programming Gems 4 §1.10): fast, refresh-rate-independent, interruptible target-chasing — the
   settle stage that makes the finale arrive with weight and no overshoot regardless of frame rate.
   https://github.com/pmndrs/maath/blob/main/README.md
8. **Codrops — "Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based
   Backgrounds"** (2026-03-09). Scroll velocity → camera/material energy, damped target-chasing on a 3D
   scene — the modern "scroll energy as one bus, damp everything" pattern the reveal's settle obeys.
   https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
9. **artofstyleframe.com — "Web Animation in 2026: CSS vs GSAP, When to Use Each"** (2026). Why a
   single-authority, timeline-or-store choice matters and the cost of two competing animation runtimes — the
   reasoning behind borrowing GSAP's named-shot *vocabulary* but implementing it in the `forge` store.
   https://artofstyleframe.com/blog/web-animation-css-vs-gsap-2026/
10. **mrdoob/three.js — Issue #1239, "Calculating the FOV for the Perspective camera"** (referenced in 2025
    fitting write-ups; Wejn.org "Cracking the three.js object fitting nut"). The half-angle framing math
    (`size/2 / tan(fov/2)`) underlying both the dolly-zoom and the "how big does the word read at this fov/
    distance" sizing the reveal's `dy`/`fovPull` are tuned against.
    https://github.com/mrdoob/three.js/issues/1239 · https://wejn.org/2020/12/cracking-the-threejs-object-fitting-nut/

---

## 9. DEEP-DIVE CANDIDATES

1. **Pour-front-locked finale rack curve.** Bind `rackDist` to the *actual* metal pour-front shared uniform
   as it crosses the last letter, so focus literally chases the molten front onto the word's final glyph
   before seating — a principled per-act rack-easing (soft transit → snap-sharp seat) rather than a fixed
   target. The highest-leverage "it's photographed" upgrade to this beat.
2. **Route-entry `routeArrive` progress as a finale driver.** Formalise the `forge.routeArrive` 0→1 signal
   (doc 57's journey↔chamber blend completion) so non-home routes fire `<MonumentalReveal>` on *navigation
   arrival*, not scroll — defining how a chamber entry becomes a monument-reveal with consistent
   direction/duration across all eight routes.
3. **Strike-synced finale impact.** Couple the moment `r` crosses ~0.9 (the seat) to a `forge.strikeAt`
   pulse so the obsidian veins, the AE bloom, the sparks, and a god-ray weight **surge in the same frame**
   the camera lands — the Brutalist-Snap "impact on arrival" expressed across the whole shared system, not
   just the lens.
4. **Anamorphic monument framing.** A subtle horizontal bokeh stretch + warm flare streak on the white-hot
   AE as the camera seats (anamorphic cues, warm-only — no rainbow), measured against the iPhone-15 budget,
   to push the "forged monument" read further on the single most-watched frame.
```