# 61 — Choreography Layer: Stagger Pour / Fill / Camera / Strike Into One Beat

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · target: iPhone 15
(OLED), single WebGL2 renderer (r3f / three.js r17x), warm-forge palette. Parents: doc **38** (the
temperature-coupled post bus), doc **39** (the master `U` pool + `<ForgeDriver/>` writer), doc **56**
(act-segmented camera pacing `gw_pace`), doc **57** (the journey↔chamber blend `forge.travel`), doc **02**
(per-letter cooling timeline), doc **13** (progressive fill front). All cited sources 2025–2026._

> **The question this doc closes.** Docs 38/39 give the world **one signal** and **one writer** so every
> material heats on one heartbeat. Doc 56 gives the *camera* its dwell/transit rhythm. Doc 57 gives the
> *navigation* its travel grammar. Each of those owns one **channel**. What none owns is **the conductor**:
> the layer that, on a single trigger (an act-boundary crossing, a navigation, a finale arrival), fires the
> pour-front advance, the per-letter fill, the camera dolly, *and* the `uSurge` strike with **authored
> stagger** so they don't all snap on the same frame (which reads mechanical) nor drift apart (which reads
> like a stack of unrelated animations) — but **cascade into one composed Brutalist-Snap impact**, the way
> an Active-Theory movie-trailer beat lands. This is the discipline that separates a Lusion-grade site from
> a clever demo. It owns the **timing relationships between channels**; it does not re-open the temperature
> ramp (doc 01), the camera path (doc 27/56), the travel arc (doc 57), or the post coupling (doc 38).

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX has, by the end of Phase 2, a fleet of independently-correct systems: the slab veins surge on
`uSurge`, the pour-front advances on `uPourFront`, the wordmark fills per-letter on `uFillFront`, the camera
dwells and sprints on `gw_pace`, the lens racks focus on `forge.focusDist`, the bloom pulses on the
`forgePulse` bus. Each is **right in isolation**. But a forging is not a set of simultaneous events — it is
a **sequenced** one: the hammer falls (impact), *then* a beat later the metal lurches in the channel, *then*
the pour-front jumps a letter, *then* the letter floods white-hot, *then* the camera punches in to frame it,
*then* the air shimmers from the released heat. Smash all of that onto frame 0 and the eye cannot parse it —
it reads as a flat flash, not a forging. Let each channel free-run on its own damping constant and they
arrive at random times — the world feels loose, "bolted-on," demo-grade.

The cohesion map's **rule 6** already states the *synchrony* requirement: "A strike (`forge.strikeAt`,
`exp(-since*3)`) surges the slab veins, the jewel edges, the pour band, the sparks, the god-ray weight, the
caustic, and the bloom intensity **in the same frame** — that synchrony is the cohesion proof." This doc
refines that from *simultaneity* to **choreography**: the channels still all answer to one trigger, but they
answer with **authored micro-offsets** (tens of milliseconds to a few hundred) so the beat has *internal
structure* — an attack, a body, a tail — the way a real impact does, while still resolving as **one** event.
The brand law is the constraint: **Brutalist Snap — 0ms perceived delay on the lead channel, high-momentum
easing, no bounce, only impact.** The stagger is not a softening; it is the *shape of the impact*. The lead
channel hits hard at 0ms (the snap); the trailing channels cascade behind it within ~250ms (the body and
tail) and settle with derivative→0 (no overshoot). One trigger, one beat, internal cascade.

Concretely, three trigger sources feed the same conductor:

1. **Act-boundary crossing on `/`** — when `actIndexFor(scrollDamped)` increments (Ignition→Core→Draw→
   Clan→Arsenal→Point), the forge "strikes" the new act. This is the home-journey beat.
2. **Navigation arrival** — when `forge.travel` crosses 1 (doc 57), the camera lands the new chamber and the
   forge strikes the arrival. This is the route beat.
3. **The finale** — at Point-the-Sword, the wordmark's last letter floods, the camera dolly-zooms in, and a
   terminal surge holds the resting hero. The signature beat.

All three reduce to **one function**: "fire a staggered cascade across N channels from time `t0`." The
deliverable is that function — a tiny, allocation-free, `dt`-damped, reduced-motion-safe **beat sequencer**
living in the store, read by the one `<ForgeDriver/>` and the one `CameraRig` `useFrame`, writing only
existing uniforms. No new render target, no second rAF, no timeline runtime.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable modern way to stagger N animation channels off one trigger into a single composed beat, scored
on quality / perf / mobile / complexity / cohesion-fit. The input is always: one trigger time `t0`, a set of
channels each with an authored **delay** and **shape**, and the requirement that they read as *one* event.

### A. GSAP timeline with labels + relative offsets + per-tween stagger (the studio idiom)
A `gsap.timeline()` places each channel's tween at a label or a relative offset (`"<"`, `"<0.05"`,
`"+=0.1"`); `stagger` distributes a delay across a set (e.g. per-letter fill). Codrops' *Building Seamless
3D Transitions with Webflow, GSAP, and Three.js* (18 Mar 2026) builds exactly this for a navigation beat:
`'expo.out'` for "a snappy entrance, with each property group getting a slight delay — **0.2s for titles,
0.35s for text lines and spacers** — so the content cascades in rather than appearing all at once," and
`SplitText` to stagger lines because it "feels much more organic than animating the whole block at once."
Codrops' *How to Build Cinematic 3D Scroll Experiences with GSAP* (19 Nov 2025) formalizes the same as a
*director*: named cinematic eases (`cinematicSilk`, `cinematicFlow`), one clip, "story-like sequences, not
cuts."
- **Quality:** Best-in-class authorability. Labels + offsets are the canonical way to express "this lands
  50ms after that." Designer-tunable.
- **Perf/Mobile:** Adds GSAP + a **second animation authority** that fights GAELWORX's one-store /
  one-`damp()` model (the redundancy docs 27/56/57 each flagged). A played GSAP timeline also runs on its
  *own* ticker unless explicitly bound to the one rAF.
- **Cohesion-fit:** **Off-pattern as the driver.** But its *vocabulary* — labels, relative offsets,
  per-element stagger, named eases, consistent durations — is the exact model we reproduce as pure store
  math. Adopt the grammar, reject the dependency.

### B. Single **paused** timeline scrubbed by a normalized progress scalar (the scroll-trailer idiom)
Author one clip with all channels keyframed at their offsets, set it `paused`, and each frame set
`tl.progress(p)` / `tl.time(p * tl.duration())` where `p` is the trigger's normalized progress. Bandinopla's
*Scroll Driven Presentation in Three.js with GSAP* (Aug 2025) describes precisely this: "a single camera
action with keyframes per shot," the clip "paused," "synchronizing GSAP scroll progress with Three.js
animations by updating them on every frame while the clip is paused." This is the movie-trailer model — the
*whole* beat exists as one authored object and you scrub a playhead through it.
- **Quality:** Excellent for a **scroll-scrubbed** beat (the playhead = scroll), and the stagger is baked
  into the keyframe offsets so it can never drift.
- **Perf/Mobile:** Good, but still pulls GSAP for the timeline object. The scrub itself is cheap.
- **Cohesion-fit:** The *concept* (one beat = one normalized playhead through staggered keyframes) is
  exactly right and we adopt it — but we express the playhead as a plain scalar and the keyframes as a small
  data table evaluated by math, not a GSAP `Timeline`.

### C. Per-channel **delay + damp** off one trigger time (the pure-store idiom) — **the spine**
Hold one trigger wall-clock time `t0`. Each channel has an authored `delay` and a `shape`. Each frame, the
channel's local progress is `s_i = shape_i( clamp( (now − t0 − delay_i) / dur_i, 0, 1 ) )`, and its target is
driven by `s_i`; the channel then **damps** toward that target via `THREE.MathUtils.damp` / `maath`
`easing.damp` (frame-rate-independent, `1/(1+t+0.48t²+0.235t³)` family). The R3F idiom confirmed across the
2026 sources: useFrame's `delta` makes it frame-rate-independent (utsubo's *100 Three.js Tips*, 2026;
r3f basic-animations docs), and "multiple independent animation channels can be stacked additively (each
damping at its own speed), and they never conflict because they simply add together" (Codrops *3D Product
Grid with R3F*, 24 Feb 2026 — the additive-channel model). The stagger is just **per-channel `delay`**.
- **Quality:** Excellent and *fully* in our idiom. Each channel's attack is an authored offset; each
  settles with `damp` (no bounce). The composed read is the cascade.
- **Perf/Mobile:** **Free** — a handful of scalar ops per channel per frame, zero allocation, one rAF.
- **Cohesion-fit:** **Best.** It is the strike-pulse mechanism docs 38/39 already use (`exp(-since*3)`),
  *generalized* to N channels each with its own `delay`/`shape`. No new authority, no new clock.
- **Complexity:** Low. The art is authoring the `delay`/`dur`/`shape` table.

### D. CSS Scroll-Driven Animations / `@keyframes` + `animation-range` (the DOM-native idiom)
Per Josh W. Comeau (2025) and the 2026 CSS-scroll-timeline guides, `animation-timeline: scroll()` +
per-keyframe `animation-range` drives staggered DOM keyframes compositor-threaded, with native
`prefers-reduced-motion` support and ~71% mobile coverage (May 2026).
- **Quality/Perf:** Excellent for the **DOM** layer (the chamber copy / act labels cascading in). Off-main-
  thread, accessible by default.
- **Cohesion-fit for the WebGL beat:** **N/A** — it animates CSS properties, not the `uSurge`/`uFillFront`/
  `forge.focusDist` uniforms the conductor needs. Adopt for the *content-frame* cascade (the copy lands on
  the same beat), never for the metal.

### E. Spring physics per channel (react-spring / chained springs)
Codrops' *3D Product Grid* (24 Feb 2026) and the spring-damped rigs use springs with per-item delay.
- **Quality:** Lovely organic float; chained springs naturally stagger.
- **Verdict:** **Rejected on brand grounds** — springs **overshoot/bounce** by nature, against "no bounce,
  only impact." A critically-damped spring is just `damp` with extra config; use `damp`.

### F. Web Animations API / Framer-Motion orchestration (`delayChildren`, `staggerChildren`)
Framer Motion's orchestration (`staggerChildren`, `delayChildren`) is the React-idiomatic stagger.
- **Verdict:** Right for **React DOM** sub-trees (a list of CTAs cascading), wrong for the WebGL uniform
  bus. Same lane as D — DOM only.

**Landscape verdict:** the conductor is **C (per-channel delay + damp off one `t0`)**, borrowing **A's
vocabulary** (labels/offsets/stagger/named eases/consistent durations as a *data table*) and **B's concept**
(one beat = one normalized playhead through staggered keyframes), with **D/F** reserved for the parallel DOM
cascade and **E** rejected. One trigger time, one small `BEAT` table, per-channel `delay`/`dur`/`shape`,
settled by the existing `damp` — no GSAP, no second rAF, no render target, fully inside the one-store/
one-loop/one-clock contract.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Add one tiny beat sequencer to the store: a `BEAT` table that names the channels (strike, pour, fill,
camera, focus, haze) each with an authored `delay`, `dur`, and `shape`, and a `fireBeat(t0, kind)` function
that stamps a single wall-clock trigger time. The one `<ForgeDriver/>` reads the table each frame and writes
each channel's eased target into the existing `U` uniforms / `forge` scalars; each consumer damps toward it
as it already does. The three trigger sources — act-boundary crossing on `/`, `forge.travel` crossing 1 on
navigation, and the finale — all call the *same* `fireBeat`. The lead channel (strike) has `delay 0` so the
impact is instantaneous (Brutalist Snap); the trailing channels (pour +40ms, fill +90ms, camera +120ms,
focus +140ms, haze +180ms) cascade behind it inside ~250ms and settle with derivative→0 (no bounce). The
DOM act-label / chamber-copy cascade runs in parallel off the same trigger via CSS scroll-driven keyframes /
View Transitions, time-aligned but on its own (accessible, compositor) layer.**

Why this is the right pick for the world and the existing code:

- **It is the literal deep-dive remit.** "Stagger pour-front, per-letter fill, camera dolly, and the
  `uSurge` strike into one composed beat" *is* a per-channel-delay sequencer off one trigger. Nothing else
  expresses authored stagger without forking a clock.
- **It generalizes the mechanism docs 38/39 already shipped.** The strike pulse is *already*
  `exp(-(now − strikeAt)·3)` — a single channel with `delay 0` and an exponential shape. `BEAT` is that,
  N times, each with its own `delay`/`shape`. We are not adding a system; we are **parameterizing the one we
  have** so it can cascade. That is cohesion, not a bolt-on.
- **It keeps every channel's *steady-state* untouched.** Off-beat, every uniform reads exactly what docs
  01/13/56/57/38 say it reads (scroll-driven temperature, fill front, paced camera, travel blend). The beat
  is a **transient additive surge** layered on top, decaying to zero — so the conductor can never desync the
  world's resting state from the user's scroll. It only shapes the *moment of impact*.
- **One trigger, one beat, three sources.** Act crossing, navigation arrival, and finale all call
  `fireBeat` — so the home journey, the route changes, and the climax all *strike the same way*. That single
  shared impact signature is what makes the world feel authored by one hand (the cohesion the studio
  references are held to).
- **Brutalist-Snap-exact.** Lead channel `delay 0` = 0ms perceived delay (the snap). Cascade ≤250ms = the
  impact's body/tail, not a soft fade. All shapes monotonic with derivative→0 at 1 (`easeOutQuint` /
  `1−exp` envelope) = no bounce, only impact. The stagger *is* the shape of the hammer-fall.
- **Mobile-free & reduced-motion-safe.** ~6 channels × a few scalar ops = sub-microsecond, far under the
  slab shader's ~4ms. Under `prefers-reduced-motion`/`static`, collapse all `delay`s to 0 and all `dur`s to
  an instant settle (or skip the surge entirely) — a dignified, cut-free arrival, the required floor.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` **r17x** (already) — `MathUtils.damp`, `clamp`, `lerp`, `smoothstep`.
- `@react-three/fiber` (already) — the single `useFrame` in `<ForgeDriver/>` + `CameraRig`.
- *(Optional)* `maath` (pmndrs, current 2025–2026) — `easing.damp` with `maxSpeed` if a channel needs a
  velocity clamp leaving a surge; `THREE.MathUtils.damp` is the same exponential family and the default.
- **No GSAP, no Theatre, no second rAF, no new WebGL dep.** Everything is store math evaluated in the
  existing loops, writing the existing `U` pool (doc 39).

### 4.2 The `BEAT` table — channels, delays, shapes (the choreography as data)

The single source of truth for "how the forge strikes." Authored once, tuned in `?debug`. Mirrors the GSAP
label/offset/stagger idiom (Codrops, Mar 2026: `0.2s`/`0.35s` cascading delays, `expo.out`) as a pure table.

```js
// src/store.js — beside ACTS / PACE / ANCHORS. The conductor's score.
// delay/dur in SECONDS. amp = peak transient surge added on top of steady-state.
// shape = the per-channel envelope (attack + decay), all monotonic, derivative→0 (no bounce).
export const BEAT = {
  //  channel    delay   dur    amp    shape          what it drives (existing uniform/scalar)
  strike:   { delay: 0.00, dur: 0.40, amp: 1.00, shape: 'expDecay' }, // U.uSurge / U.uHeat — the impact, 0ms
  pour:     { delay: 0.04, dur: 0.55, amp: 0.85, shape: 'snapDecay' },// uPourFront advance kick (doc 26)
  fill:     { delay: 0.09, dur: 0.60, amp: 0.90, shape: 'snapDecay' },// uFillFront letter-flood lurch (doc 13)
  camera:   { delay: 0.12, dur: 0.70, amp: 1.00, shape: 'outQuint' }, // dolly punch-in (forge.beatDolly)
  focus:    { delay: 0.14, dur: 0.65, amp: 1.00, shape: 'outQuint' }, // rack-focus to the new subject (doc 28)
  haze:     { delay: 0.18, dur: 0.80, amp: 0.70, shape: 'expDecay' }, // released-heat shimmer (doc 16, uHazeAmp)
}

// Envelope zoo — attack-decay pulses (rise then fall to 0) and arrivals (rise to 1, settle).
const ENV = {
  // exp-decay impulse: instantaneous attack, exp tail — the canonical strike (docs 38/39).
  expDecay:  (x) => Math.exp(-x * 5.0),                 // x = local time since this channel started / dur*… (see note)
  // snap-decay: fast smooth attack to 1 then decay — a lurch that overshoots time, not value.
  snapDecay: (x) => { const a = Math.min(x*6.0,1); const d = Math.exp(-Math.max(x-0.16,0)*4.0);
                      return a*d; },                     // 0→~1 in ~0.16, then exp tail. Peaks once, no bounce.
  // outQuint arrival: rise to 1, derivative→0 at 1 (impact, no overshoot) — for camera/focus targets.
  outQuint:  (x) => 1 - Math.pow(1 - Math.min(x,1), 5),
}
```

> **Note on `x`.** For *impulse* channels (`expDecay`/`snapDecay`) `x = (now − t0 − delay)/dur` is the
> normalized lifetime, and the env returns the **transient amount** (1→0); the channel's uniform =
> `steadyState + amp·env(x)`. For *arrival* channels (`outQuint`) the env returns **progress** (0→1) and the
> channel lerps `from→to` by it. Both clamp `x` so a finished channel contributes exactly 0 (impulse) or 1
> (arrival) — no residue, no NaN.

### 4.3 The trigger: one `fireBeat`, three callers

```js
// src/store.js — additions (mutated outside React, read in useFrame; alloc-free)
export const forge = {
  // ...existing: scrollDamped, scrollVel, strikeAt, travel, focusDist, route...
  beatT0:   -10,     // wall-clock seconds the current beat started (-10 = long past, fully decayed)
  beatKind: 'act',   // 'act' | 'nav' | 'finale' — lets channels weight per source (e.g. finale dollies harder)
  beatGain: 1,       // 0 under reduced-motion (kills the transient surge), 1 normally
  beatDolly: 0,      // camera punch-in amount this frame (read by CameraRig), 0 = none
}

// THE conductor entry point. One stamp; the ForgeDriver does the rest. No allocation.
export function fireBeat(t0, kind = 'act') {
  forge.beatT0 = t0
  forge.beatKind = kind
  forge.strikeAt = t0            // keep the legacy strike scalar in lockstep (docs 38/39 read it)
}

// Per-channel sampler — pure, allocation-free. Returns the transient amount (impulse) or progress (arrival).
export function beatChan(name, now) {
  const c = BEAT[name]
  const x = (now - forge.beatT0 - c.delay) / c.dur
  if (x < 0) return 0                                   // delay not yet elapsed → channel silent
  if (x > 1.5 && c.shape !== 'outQuint') return 0       // impulse fully decayed → exactly 0
  return ENV[c.shape](THREE.MathUtils.clamp(x, 0, 4)) * c.amp * forge.beatGain
}
```

The three callers (each already has the trigger condition; they just route it through `fireBeat`):

```js
// 1) ACT-BOUNDARY (home /) — in ForgeDriver useFrame, replacing the bare strikeAt write of doc 38/56.
const ai = actIndexFor(forge.scrollDamped)
if (ai !== forge._prevAct) { fireBeat(state.clock.elapsedTime, 'act'); forge._prevAct = ai }

// 2) NAVIGATION ARRIVAL — in CameraRig, where doc 57 detects travel crossing 1.
if (prevTravel < 1 && forge.travel >= 1) fireBeat(performance.now()/1000, 'nav')

// 3) FINALE — when the last letter's fill completes at Point-the-Sword (doc 13 uFillFront ≥ last glyph).
if (!forge._finaleFired && forge.scrollDamped > 0.97) { fireBeat(state.clock.elapsedTime, 'finale'); forge._finaleFired = true }
```

### 4.4 The `<ForgeDriver/>` fan-out — one writer, staggered channels

The sole author (doc 39) reads the table and writes each channel's transient onto the existing uniforms.
Each consumer **already damps** its uniform; the beat only raises the *target* for a moment.

```jsx
// src/scene/ForgeDriver.jsx — inside the one useFrame((state, dt) => { ... })
import { forge, beatChan, U, damp } from '../store.js'

const now = state.clock.elapsedTime

// --- steady-state (docs 01/13/38/39), unchanged ---
const baseTemp = Math.min(forge.scrollDamped + forge.scrollVel * 0.25, 1)
U.uTemp.value = damp(U.uTemp.value, baseTemp, 3, dt)

// --- the BEAT cascade: each channel adds its transient surge on top, then the consumer damps ---
const sStrike = beatChan('strike', now)            // impulse 1→0, delay 0  (the snap)
const sPour   = beatChan('pour',   now)            // impulse, delay 0.04
const sFill   = beatChan('fill',   now)            // impulse, delay 0.09
const sCam    = beatChan('camera', now)            // arrival 0→1, delay 0.12
const sFocus  = beatChan('focus',  now)            // arrival 0→1, delay 0.14
const sHaze   = beatChan('haze',   now)            // impulse, delay 0.18

// uSurge / uHeat — the world-wide strike (veins, jewel, god-rays, bloom all read U.uSurge: docs 30/35/38)
U.uSurge.value = damp(U.uSurge.value, sStrike, 9, dt)      // λ=9 → ~0ms-feel attack, fast settle
U.uHeat.value  = damp(U.uHeat.value,  Math.max(sStrike, forge.scrollVel), 7, dt)

// pour-front KICK — nudge the front a hair ahead of its scroll position on the beat (doc 26)
U.uPourBeat.value = damp(U.uPourBeat.value, sPour * 0.06, 8, dt)   // +6% arc-length lurch, decays out

// per-letter FILL lurch — the active letter floods a beat faster on impact (doc 13)
U.uFillBeat.value = damp(U.uFillBeat.value, sFill * 0.05, 8, dt)

// camera dolly punch-in + rack focus (read by CameraRig / doc 28)
forge.beatDolly  = damp(forge.beatDolly,  sCam  * (forge.beatKind === 'finale' ? 0.9 : 0.4), 6, dt)
// (focus target handed to doc 28's worldFocusDistance; sFocus eases the rack 0→1 to the new subject)

// heat-haze released-shimmer (doc 16) — air wobbles AFTER the strike, the tail of the beat
U.uHazeBeat.value = damp(U.uHazeBeat.value, sHaze * 0.5, 6, dt)
```

### 4.5 Camera consumes the dolly (CameraRig, one add)

The dolly is a tiny **additive** push along the view axis on top of the doc-56 paced position and doc-57
travel pose — never part of the path, so it can't desync the scrub.

```js
// CameraRig.jsx — after doc 56/57 set camera.position, before pointer parallax (doc 57 step 7)
_fwd.set(0,0,-1).applyQuaternion(camera.quaternion)        // module-level scratch
camera.position.addScaledVector(_fwd, forge.beatDolly)     // punch in on the beat, eases back to 0
```

### 4.6 Key params (expose to `?debug` leva)

| Param | Default | Meaning | Tune toward |
|---|---|---|---|
| `BEAT.strike.delay` | 0.00 s | lead channel — the impact instant | **keep 0** (Brutalist Snap, 0ms) |
| cascade spread | 0.04→0.18 s | trailing channel delays | total ≤ ~0.25 s → reads as *one* beat, not a sequence |
| `BEAT[c].dur` | 0.40–0.80 s | each channel's transient lifetime | shorter = snappier; keep tails < ~0.8 s |
| `BEAT[c].amp` | 0.7–1.0 | peak surge per channel | the felt punch; finale `camera.amp` highest |
| damp λ (uSurge) | 9 | strike settle weight | high → instant attack, fast clean decay (no smear) |
| `beatDolly` finale gain | 0.9 | climax punch-in depth | the "it landed" feel; everyday nav 0.4 |
| `forge.beatGain` | 1 (0 reduced-motion) | global beat enable | 0 = no transient surge, accessible floor |

### 4.7 How it hooks the shared master temperature / uniform system

It is a **near-pure conductor** over the doc-39 pool — it writes only existing uniforms, adds no new clock,
and its entire output decays to zero so steady-state is byte-identical off-beat:

- **One trigger, the whole world reacts — staggered.** `fireBeat` stamps `forge.beatT0`/`strikeAt`; the
  `<ForgeDriver/>` fans it across `U.uSurge` (→ veins, jewel, god-rays, bloom — docs 30/35/38), `U.uPourBeat`
  (→ pour-front, doc 26), `U.uFillBeat` (→ wordmark, doc 13), `forge.beatDolly`/focus (→ camera/lens, docs
  28/56/57), and `U.uHazeBeat` (→ heat-haze, doc 16). Because each reads its channel's `delay`, the slab
  flares *first*, the pour lurches, the letter floods, the camera punches, the air shimmers last — **one
  beat, internal cascade**, exactly the cohesion-map rule-6 synchrony *with structure*.
- **It never reaches `uTemp` directly or the A/E path.** The conductor adds *transient surges* on top of the
  scroll-driven `uTemp`; it does not author the base temperature (doc 39 still owns that) and never touches
  the divine-fire clamp (the A/E ignore `uTemp`, doc 01 §1.4) — the eternal white-gold A/E simply *flare a
  touch brighter* on the strike via the same `uSurge` every divine-fire receiver already reads (docs 22/23),
  never cool, never sequence.
- **`beatKind` lets one signature scale per source without forking it.** The same cascade, weighted: `nav`
  uses a modest dolly (0.4), `finale` punches hard (0.9), `act` sits between — one table, three intensities,
  no second system.
- **No new uniform clock, no second rAF.** `beatT0` is a plain store scalar advanced by `state.clock` /
  `performance.now()` inside the existing loops; `U` (doc 39) gains only the three transient socket uniforms
  (`uPourBeat`, `uFillBeat`, `uHazeBeat`), each a `{value:0}` that lives and dies on the beat.

---

## 5. COHESION (shared palette / lighting / uniforms / clock)

- **One conductor, three triggers, one signature.** Act crossing, navigation arrival, and finale all call
  `fireBeat`, so the home journey, every route change, and the climax **strike identically** (same channels,
  same stagger, scaled by `beatKind`). The world has *one* impact signature — the single most felt proof
  that one hand authored it, the Active-Theory / Lusion bar.
- **The strike stays the cohesion proof (rule 6), upgraded.** Docs 38/39 require the strike to surge veins,
  sparks, god-rays, and bloom *in the same frame*. This doc keeps that — the **lead** `strike` channel has
  `delay 0`, so the frame-0 synchrony is intact — and *adds* the trailing cascade so the beat has body. We
  strengthen the contract, we don't break it.
- **One scroll signal, one clock, `dt`-damped.** Channels read `state.clock`/`performance.now()` in the
  existing loops and settle via the existing `damp`. No `setInterval`, no spring, no GSAP ticker, no second
  rAF. Every envelope is monotonic with derivative→0 (no bounce) — Brutalist Snap.
- **Palette / lighting untouched.** The beat moves *timing*, not color or light. The warm-forge palette, the
  HDR `>1` accents that bloom, the metal-is-the-only-light model, the divine-fire A/E, and the procedural
  cool-key env (no EXR) are unchanged — the cascade simply *reveals* the same lit world striking on a beat.
- **Steady-state is byte-identical off-beat.** Every channel decays to exactly 0 (impulse) or settles to the
  doc-56/57 pose (arrival), so between beats the world reads exactly what docs 01/13/56/57/38 specify. The
  conductor is purely transient — it cannot drift the resting state from the user's scroll.
- **The DOM cascade rides the same trigger.** The act-label / chamber-copy cascade (CSS scroll-driven
  keyframes / View Transitions, doc 57) fires on the same route/act event, time-aligned to the WebGL beat —
  copy, veins, camera, lens, and bloom **arrive on one beat**, across both layers.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

- **Cost is negligible.** Six channels × (one subtract, one divide, one clamp, one `Math.exp`/`pow`, one
  `damp`) ≈ a few dozen scalar ops per frame — **sub-microsecond**, orders below the slab fbm shader's
  ~3.5–4.5 ms. Zero render targets, zero new passes, zero per-frame allocation (all scratch module-level).
  It does **not** move the cohesion-map §10 budget needle; it sits inside the existing ~2–3 ms
  "Camera/scroll JS + React" line.
- **No second loop, no GSAP runtime.** Rejecting techniques A/B/E/F as *drivers* is also a perf decision:
  no timeline ticker, no spring solver, no bundle growth. The conductor is the strike mechanism docs 38/39
  already ship, parameterized.
- **`Math.exp`/`pow` per channel is fine** on A16/A17, but to be safe under thermal throttle the impulse
  envelopes can be a 256-entry LUT (`Float32Array`) sampled by `x` — optional, not needed at 6 channels.
- **iOS edge cases.** `beatT0` is wall-clock (`state.clock` / `performance.now()`), immune to Lenis
  rubber-band; a channel whose `x>1.5` returns exactly 0 (no float drift, no NaN into a uniform). Rapid
  re-triggers (flick-scrolling across act boundaries) simply **re-stamp `beatT0`** — there is only ever one
  beat in flight, so beats can't stack or fight (same single-scalar discipline as doc 57's `travel`).
- **Tiers (mirror `forge.quality`):**
  - **`high`** — full cascade (all 6 channels, full stagger, finale dolly 0.9, haze tail on).
  - **`low`** — drop the `haze` channel and the camera dolly's depth (halve `beatDolly`); keep
    `strike`/`pour`/`fill`/`focus` (the load-bearing cascade). Identical math, fewer channels.
  - **`static` / reduced-motion** — **`forge.beatGain = 0`**: the transient surge is suppressed entirely;
    channels assign their *arrival* targets instantly (camera/focus snap to the new pose, no dolly, no
    shimmer). The world still *changes state* on navigation/act (it's not frozen), but with **no impulse
    motion** — a dignified, cut-free, accessible beat. (Per the 2026 reduced-motion guidance: gate JS motion
    on `matchMedia('(prefers-reduced-motion: reduce)').matches`; shorter/skipped animations also improve INP.)
- **The DOM cascade is compositor-threaded** (CSS scroll-driven / View Transitions) and respects
  `prefers-reduced-motion` natively, so the copy layer adds nothing to the main thread and is accessible by
  default — and it **excludes the persistent `<canvas>`**, so the prerendered SEO/AEO DOM stays intact.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls (each a real, shippable-looking failure):**
1. **Everything on frame 0 (no stagger).** Firing all channels with `delay 0` is the *current* doc-38/39
   behavior — correct synchrony, but it reads as a flat flash, not a forging. The cascade (≤250ms spread)
   *is* the upgrade. Author the `delay`s; don't leave them all 0.
2. **Stagger too wide (reads as a sequence, not a beat).** If the spread exceeds ~0.3 s the eye parses
   *separate events* and the impact dissolves. Keep total cascade ≤ ~0.25 s; the lead at 0, the tail by
   ~0.18. One beat, not a list.
3. **Lead channel not at 0ms.** If the *strike* (the snap) has any delay, the impact feels mushy — the
   brand's 0ms law is violated. The lead channel is always `delay 0`; everything cascades *behind* it.
4. **Bounce.** Any spring or an envelope with a derivative ≠ 0 at the peak reads as overshoot — against "no
   bounce, only impact." All envelopes monotonic to their peak, decaying cleanly; arrivals `outQuint`
   (derivative→0 at 1). Verify by plotting each `ENV` — no wiggle past the peak.
5. **Pacing the world's steady-state with the beat.** The cardinal error: writing the beat's transient
   *into* `uTemp`/`uFillFront`'s base instead of *on top* of it. Then the metal's resting heat lurches and
   the world lies about the scroll position. The beat is **additive and decays to 0**; base signals are
   untouched (docs 01/13/39 still own them).
6. **Stacked beats / second clock.** Re-triggering without re-stamping `beatT0` (or worse, spawning a GSAP
   tween per trigger) stacks animations that fight. One `beatT0`; re-stamp on re-trigger; one beat in
   flight. No second rAF, no timeline runtime.
7. **Dolly baked into the path.** Adding the camera punch-in to the doc-56 paced `cam.t` or the doc-57
   travel pose corrupts the scrub. The dolly is a tiny **additive** push along the view axis *after* the
   path is set, easing back to 0 — never part of the curve.
8. **Allocating in the loop.** A `new Vector3` for the dolly forward axis per frame → GC stutter on the
   throttling phone. All scratch (`_fwd`) module-level.
9. **Reduced-motion left running.** Leaving the impulse cascade on under `prefers-reduced-motion` is the
   accessibility miss. `beatGain = 0` suppresses the transient; arrivals snap. Cut-free, accessible.
10. **Finale fires every frame.** A `scrollDamped > 0.97` trigger without a `_finaleFired` latch re-stamps
    the beat every frame at the bottom → a stuck strobe. Latch it (reset the latch when scroll leaves the
    finale band).

**Order of operations** (each step verified the repo way — `npm run build` green → `qa-route` at 393×852 +
1440×900 with **0 console errors** → then the iPhone-15 OLED read; impact *feel* does **not** simulate
headless):
1. **Land docs 38/39 first** (the `U` pool, `<ForgeDriver/>`, the bare `strikeAt` strike). The conductor
   parameterizes that mechanism; it is meaningless without it.
2. **Add `BEAT`, `ENV`, `fireBeat`, `beatChan`** to `store.js`. Unit-check in `?debug`: plot each channel's
   output vs time from one `fireBeat` — assert each is **monotonic to its peak**, decays to **exactly 0**
   (impulse) / settles to **1** (arrival), and the cascade order is strike→pour→fill→camera→focus→haze.
3. **Route the existing act-boundary strike through `fireBeat`** (replace the bare `strikeAt` write). Confirm
   `/` still strikes on every act crossing, now with the cascade. Desktop first, for the timing.
4. **Wire the trailing channels one at a time** (`uPourBeat`, `uFillBeat`, `beatDolly`, focus, `uHazeBeat`),
   verifying each visually before adding the next — so a mistuned channel is obvious, not hidden in the pile.
5. **Tune `delay`/`dur`/`amp`** in `?debug` leva until the beat reads as *one impact with body* — not a
   flash (too tight) and not a sequence (too wide). The cascade-spread and `uSurge` λ are the felt knobs.
6. **Wire the navigation (`travel≥1`) and finale triggers** through the same `fireBeat`; confirm all three
   sources strike with the same signature, scaled by `beatKind`.
7. **Reduced-motion / static pass:** `beatGain = 0`, arrivals snap, dolly off, haze off. Confirm cut-free
   and that the world still *changes state* (not frozen).
8. **Time-align the DOM cascade** (act-label / chamber-copy CSS scroll-driven keyframes / View Transitions)
   to the same trigger; confirm copy + metal + camera land on one beat across both layers.
9. **iPhone-15 OLED read** with `qa-route`/`tune-pacing`: each act crossing and navigation strikes as one
   composed Brutalist-Snap beat, no flat flash, no sequence-feel, no bounce, no stuck finale strobe, 60fps,
   `renderer.info.memory` flat (no leak — the conductor allocates nothing).

---

## 8. SOURCES (2025–2026)

1. **Codrops — "Building Seamless 3D Transitions with Webflow, GSAP, and Three.js"**, 18 Mar 2026 — a
   *persistent* Three.js scene with section-to-section beats; the concrete cascading-delay grammar adopted
   here as a data table: `'expo.out'` snappy entrance, **per-property-group delays (0.2 s titles, 0.35 s text
   lines/spacers)** so content "cascades in rather than appearing all at once," `SplitText` line stagger as
   "much more organic than animating the whole block at once."
   https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/
2. **Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP"**, 19 Nov 2025 — GSAP as a cinematic
   *director*: one clip, named cinematic eases (`cinematicSilk`/`cinematicFlow`), "story-like sequences, not
   cuts," `scrub:1` smoothed follow, Lenis + `gsap.ticker` one-loop — the label/offset/named-ease vocabulary
   reproduced as pure store math.
   https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
3. **Bandinopla — "Scroll Driven Presentation in Three.js with GSAP"**, Medium, Aug 2025 — the single
   **paused** timeline as "keyframes per shot," scrubbed by scroll progress, "updating them on every frame
   while the clip is paused," synchronizing camera/lighting/morph in one clip — the "one beat = one
   normalized playhead through staggered keyframes" concept behind `beatChan`.
   https://medium.com/@pablobandinopla/scroll-driven-presentation-in-threejs-with-gsap-a2be523e430a
4. **Codrops — "From Flat to Spatial: Creating a 3D Product Grid with React Three Fiber"**, 24 Feb 2026 —
   per-item **random stagger delay** to "prevent the mechanical feel of synchronized motion," and the
   **additive independent-channel** model: "multiple independent animation channels can be stacked additively
   (each damping at its own speed), and they never conflict because they simply add together" — the exact
   per-channel-damp pattern of technique C.
   https://tympanus.net/codrops/2026/02/24/from-flat-to-spatial-creating-a-3d-product-grid-with-react-three-fiber/
5. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"**, 2026 — `useFrame((state,
   delta) => …)` delta for **frame-rate-independent** updates (`delta*speed`, never `+= 0.1`); object-pool /
   no-runtime-allocation discipline; shared-program / shared-uniform cheapness — the perf contract the
   conductor obeys (alloc-free, dt-damped). https://www.utsubo.com/blog/threejs-best-practices-100-tips
6. **pmndrs/maath — README / `easing.damp*`** (`damp`, `damp3`, `smoothTime`, `maxSpeed`, default easing
   `1/(1+t+0.48t²+0.235t³)`), current 2025–2026 — the frame-rate-independent exponential settle each channel
   uses after its eased target, with optional `maxSpeed` to clamp a channel's lunge leaving a surge.
   https://github.com/pmndrs/maath/blob/main/README.md
7. **React Three Fiber — "Basic Animations" (docs) & "Performance pitfalls"**, current 2025–2026 — the
   canonical `useFrame` delta-driven, mutation-in-frame (not React state), alloc-free animation idiom the
   conductor runs inside. https://r3f.docs.pmnd.rs/tutorials/basic-animations ·
   https://r3f.docs.pmnd.rs/advanced/pitfalls
8. **Dacey Nolan — "Designing Accessible Animations: A Practical Guide to prefers-reduced-motion"**, Medium,
   May 2026 — gate JS motion on `window.matchMedia('(prefers-reduced-motion: reduce)').matches`; skip/shorten
   non-essential motion — the `beatGain = 0` reduced-motion floor.
   https://medium.com/@daceynolan/designing-accessible-animations-a-practical-guide-to-prefers-reduced-motion-0d3b89c3b1cb
9. **Josh W. Comeau — "Scroll-Driven Animations"**, 2025 & **"Mastering CSS Scroll Timeline (2026)"**
   (dev.to) — `animation-timeline: scroll()` + per-keyframe `animation-range` for compositor-threaded,
   reduced-motion-native **DOM** staggered cascades (~87% desktop / ~71% mobile support, May 2026) — the
   parallel DOM-layer cascade (technique D), time-aligned to the WebGL beat.
   https://www.joshwcomeau.com/animation/scroll-driven-animations/ ·
   https://dev.to/softheartengineer/mastering-css-scroll-timeline-a-complete-guide-to-animation-on-scroll-in-2025-3g7p
10. **artofstyleframe — "Web Animation in 2026: CSS vs GSAP, When to Use Each"**, May 2026 — GSAP's strength
    is "timeline sequencing with labels and relative offsets, ScrollTrigger choreography" — the explicit
    confirmation that label/offset/stagger is the right *grammar* (adopted as data, not as the GSAP
    dependency). https://artofstyleframe.com/blog/web-animation-css-vs-gsap-2026/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The finale super-beat (Point-the-Sword climax choreography).** A bespoke, longer cascade for the
   climax only: the last letter floods, a held dolly-zoom (doc 28) compresses the frame, a terminal `uSurge`
   plateau (not a decay) holds the resting hero white-gold, the A/E peak, god-rays thicken — authored as a
   distinct `BEAT_FINALE` table with its own stagger/durations, the one beat in the build that is allowed to
   *linger* instead of snap-decay.
2. **Pour-front-locked beat phase.** Bind each channel's `delay` to the live `uPourFront` arc-coordinate so
   the fill/camera cascade fires *exactly when the molten front reaches the next letter*, not on a fixed
   offset — the conductor chasing the actual metal (couples to docs 26/56 candidate 2).
3. **Per-route beat presets (`scenes.js` × `BEAT`).** A per-chamber beat temper — the forge-mouth `/contact`
   strikes harder and hotter (bigger `amp`, more haze), the scrying-pool `/voice` strikes soft and slow
   (calm cascade, no dolly) — damped on navigation, one conductor, eight rhythm signatures.
4. **Velocity-scaled beat intensity.** Scale `beatGain` (and the dolly depth) by `forge.scrollVel` at the
   trigger instant so a *hard flick* into an act strikes harder than a *slow drift* across it — the impact
   responding to the user's gesture, the Active-Theory "the site hits back" feel, measured against the
   iPhone-15 budget and clamped so a fast scroll never overdrives the cascade past Brutalist-Snap.
