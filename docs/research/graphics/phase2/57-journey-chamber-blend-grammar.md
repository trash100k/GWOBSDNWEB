# 57 — Journey ↔ Chamber Blend Grammar (Travel, Not Cuts)

_Phase-2 graphics deep-dive · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer
(r3f / three.js r17x), warm-forge palette. Cluster **I-camera-motion**. Parents: doc **27** (the journey
curve + Lenis), doc **55** (banked look-at / RMF orientation), doc **28** (the lens). This doc owns the
**grammar** of moving between the home journey and the eight route chambers — the principled cross-fade,
the shared anchor pose per route, and the blend-weight that makes every navigation read as a deliberate
**travel move** with consistent direction and duration, instead of the ad-hoc `pos.lerp(route, w)` doc 27
left as a placeholder._

> Scope split. Doc 27 owns **where the camera goes on `/`** (CatmullRom position by arc-length at
> `forge.scrollDamped`). Doc 55 owns **how the body is held** (RMF up + curvature bank → quaternion
> slerp-damp). Doc 28 owns **how the lens sees** (fov / DOF / focus). **This doc owns the seam between two
> camera authorities** — the home *journey* and a route *chamber* — and the law that governs every
> crossing of that seam: one anchor pose per route, one blend signal, one direction, one duration, one
> easing, for all eight routes. It writes one new scalar to the shared bus (`forge.travel`) and one
> small data table (`ANCHORS`); it changes the five lines at the end of `CameraRig` that currently blend
> position/look-at by an unprincipled weight.

---

## 1. SCOPE (this element in the GAELWORX world)

GAELWORX is **one** molten forge on **one** renderer, route-swapped into eight chambers — scrying-pool
(`/voice`), casting-room (`/software`), channel-hall (`/automations`), jewel-chamber (`/web`),
altar-approach (`/about`), stone-ledger (`/pricing`), four-plinths (`/work`), forge-mouth arch
(`/contact`) — plus the scroll-jacked home **journey** down the pour. The cohesion map's §4.1 rule is
absolute: **the WebGL context never tears down on navigation; routes re-temper a shared scene by damping
a preset table toward the active chamber.** The persistent obsidian slab is the back wall of every
chamber, so the world never goes empty between routes.

That architecture creates exactly one unsolved problem, and this doc is it: **what does the camera *do*
in the moment a user clicks from one chamber to another?** The slab can damp its veins from one preset to
the next (already wired). But the *camera* has two competing authorities — on `/` it is married to the
journey curve (`JOURNEY.getPointAt(cam.t)`), and on a route it wants the chamber's framing
(`sceneFor(route).{camZ,rotY,rotX}`). Doc 27's placeholder resolves this with a single damped weight
`cam.blendW` that lerps the journey position toward an orbit position and lerps the look-at toward the
slab centre. That **works** but it is *ungoverned*: every route gets the same generic orbit radius, the
blend has no consistent **direction** (does the camera always pull back and swing, or sometimes push in?),
no consistent **duration** (a damp-to-target settles in wildly different times depending on how far the
two presets sit apart), and no **per-route intent** (the jewel chamber and the stone-ledger deserve to be
*arrived at* differently — one is a wide vivid reveal, one is a slow reverent rise up the stone edge).

The brief names the failure precisely: navigation must be **"a deliberate travel move with consistent
direction/duration — the orbit+dolly blend weight that makes navigation travel rather than an ad-hoc
lerp."** The studios this build is held to (Active Theory, Lusion, Resn, Unseen) never *cut* between
sections and never let two sections arrive *differently for no reason*; a section entry is a **shot** with
a grammar — a known anchor, a known move, a known beat. The job of this element is to give GAELWORX that
grammar: a **shared anchor pose per route** (the "establishing frame" the chamber is composed around), a
**single blend signal** (`forge.travel`, 0 = fully in journey/origin, 1 = fully arrived at the chamber
anchor) with one **direction profile** (pull-back-then-settle, the orbit+dolly arc) and one **duration**
(the same travel time for every route, the Brutalist-Snap beat), and the rule that the **home journey is
just route `/`'s anchor expressed as a curve** — so there is *one* blend system, not "a journey thing and
a route thing."

The hard requirements: position **and** orientation **and** lens must travel together (no element snaps
while another eases); the move must be C¹-smooth and obey Brutalist Snap (high-momentum, **no bounce**,
impact on arrival); it must share the one clock, the one store, the one `useFrame`; it must survive a
mid-travel route change (click `/web` then `/about` before the first move finishes — it must re-aim, not
fight); and it must collapse to a dignified cut-free static pose under reduced motion. It writes nothing
the temperature/material system doesn't already read, and it leaves the prerender/SEO DOM intact (no drei
`ScrollControls`, no canvas remount).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable modern way to move a single persistent camera between section/chamber framings in an r3f SPA,
scored on quality / perf / mobile / complexity. The input is always: a *current* camera pose and a
*target anchor pose* (position + orientation + fov + focus), plus a scalar that says "how far through the
move are we."

### A. Ad-hoc per-property `damp()` toward `sceneFor(route)` — the placeholder (what doc 27 left)
Damp `cam.z`, `cam.ang`, `cam.rotX` toward the route preset; build an orbit position from them; lerp the
journey position toward it by a damped `blendW`.
- **Quality:** Acceptable, **ungoverned.** Direction and duration are emergent from how far apart the
  presets sit, not authored. Two routes arrive at different speeds; none arrives with intent. No shared
  anchor concept — the "pose" is implicit in three loosely-damped scalars.
- **Perf/Mobile:** Free.
- **Verdict:** The baseline this doc replaces. It is *travel-ish* but not a *grammar*.

### B. A single normalized **travel scalar** `s∈[0,1]` driving an authored move (the recommended spine)
Introduce one signal `forge.travel`: on a route change it animates **0→1 over a fixed duration** with one
easing; the camera pose is a function of `s` that interpolates *from the pose at the moment of click*
(captured once) *to the target anchor pose*, along an **authored arc** (pull-back-then-settle), not a
straight line. Because `s` is normalized and time-driven (not distance-driven), **every route takes the
same time and the same shape** — that is the "consistent direction/duration" the brief demands. This is
the spline-camera / cinematic-director pattern Codrops' 2025 GSAP-as-director piece formalizes (timeline
with named easing curves like `cinematicSilk`/`cinematicSmooth`, consistent durations) — here driven by a
damped scalar instead of a GSAP timeline to stay dependency-light and on the existing `damp()` idiom.
- **Quality:** **Excellent and *governed*.** One easing, one duration, one arc shape for all eight routes;
  per-route variation lives only in the *anchor pose*, not the *move*. This is what makes it a grammar.
- **Perf/Mobile:** Free — one extra scalar, a handful of lerp/slerp.
- **Complexity:** Low-medium. The art is the anchor table and the arc shape.
- **Verdict:** **The blend spine.** Everything below either feeds it or is rejected against it.

### C. Quaternion **slerp** of orientation + position **lerp/bezier**, between captured pose and anchor
For the orientation half of B, never lerp Euler or two `lookAt`s — **slerp** between the captured
quaternion and the anchor quaternion (great-circle, whip-free, gimbal-free). For position, lerp the
endpoints but **bend the path** by adding a perpendicular pull-back offset that peaks at `s=0.5`
(`sin(πs)`), so the move *arcs out and dollies in* (orbit+dolly) rather than sliding through the slab.
- **Quality:** This is the difference between "two framings cross-faded" and "the camera flew there."
  Slerp is the 2025–2026 forum consensus for camera reorientation (never Euler/lookAt-tween across an
  angle). The `sin(πs)` pull-back is the "orbit+dolly blend" the brief literally names.
- **Perf/Mobile:** Free.
- **Verdict:** **The motion primitive inside B.** Position = arced lerp; orientation = slerp; fov/focus =
  scalar lerp — all on the *same* `s`.

### D. FBO / render-target cross-fade between two rendered chambers (the dissolve lane)
Render the outgoing chamber to an FBO, the incoming to another, and `mix()` them in a fullscreen shader
over the transition (the Wawa Sensei "scene transitions" / pmndrs crossfade pattern; dissolve/wipe/fade
via a custom mix shader). True image-space cross-fade, independent of camera math.
- **Quality:** Cinematic for *hard* scene swaps (different geometry, different lighting) — a dissolve, a
  wipe, a forge-reveal. **But it is a cut dressed as a fade**, not travel: the camera doesn't *move*, two
  pictures blend. For GAELWORX, where the chambers are *the same slab re-tempered*, a cross-fade throws
  away the one thing the single-renderer architecture buys — the ability to actually *fly* between
  framings of one continuous world.
- **Perf/Mobile:** **Expensive** — two scene renders + a composite for the transition's duration, on a
  fill-rate-bound phone. The cohesion map (§4.3) explicitly reserves portal-FBO crossfade for "one or two
  marquee room transitions," *not* the everyday swap.
- **Verdict:** **Reserved, not the grammar.** Keep it in the toolbox for a single signature transition
  (e.g. `/` → `/contact` forge-mouth reveal, doc 45's portal-FBO), gated to `high`. The everyday move is
  B+C (real travel), never a dissolve.

### E. Browser/React **View Transitions API** cross-fade on navigation
React 19's `<ViewTransition>` / `startViewTransition` (react.dev, Apr 2025) and React Router's
`viewTransition` prop give a default DOM cross-fade; broadly supported (Chrome/Edge 111+, Firefox 133+,
Safari 18+ for same-document, per Chrome's 2025 update).
- **Quality:** Great for the **DOM** (the page copy, the nav, the chamber heading wiping in) — it is the
  right tool for the *HTML* layer of a chamber change, and it cross-fades the prerendered content cleanly.
  **But it does nothing for the persistent `<canvas>`** — the canvas is one element that does not unmount,
  so there is no before/after snapshot to cross-fade; the WebGL travel must be done in `useFrame`
  regardless. `ViewTransition.waitUntil` can even *hold* the DOM transition until the WebGL move settles.
- **Perf/Mobile:** Cheap for the DOM layer; the canvas snapshot is a non-issue because we exclude it.
- **Verdict:** **Adopt for the DOM half, not the WebGL half.** The chamber *copy* wipes in via View
  Transitions (or the existing Forge-Reveal blur-to-sharp); the *camera* travels via B+C. They share the
  one trigger (the route change) and can be time-aligned, but they are different layers.

### F. GSAP timeline / Theatre.js keyframed transition per route
Author each route entry as a GSAP/Theatre timeline scrubbed or played on navigation (Codrops' Nov 2025
cinematic-GSAP director; the seamless-3D-transitions Webflow+GSAP+three piece, Mar 2026).
- **Quality:** Highest authorability — named easing curves, per-beat control, designer-tunable.
- **Perf/Mobile:** Adds a timeline runtime and a *second* animation authority that fights the one-store /
  one-`damp()` model the rest of GAELWORX runs on. The cohesion map's whole thesis is *one* motion
  authority.
- **Verdict:** **Off-pattern as the driver**, but its *lessons* are adopted wholesale into B: consistent
  durations, named easing, "travel not cut." We get the grammar without the second runtime.

### G. `camera-controls` (yomotsu) `setLookAt` SmoothDamp transitions
`camera-controls` v2 offers SmoothDamp `setLookAt`/`dollyTo` with a `smoothTime` that *is* the
arrive-duration — exactly the "consistent duration" knob. But it is a **controller that owns the camera**
and fights a scroll-scrubbed path rig (same reason docs 27/55 rejected it as the driver).
- **Verdict:** **Not adopted** (owns the camera, adds a dep), but its `smoothTime`-as-duration model is
  the reference for B's fixed-duration scalar.

### H. Spring physics (react-spring / its damping) between poses
Spring the camera pose toward the anchor (Codrops' Feb 2026 spring-damped product-grid rig).
- **Quality:** Lovely *float*, but springs **overshoot/bounce** by nature — directly against the brand's
  **"no bounce, only impact"** Brutalist-Snap law. A critically-damped spring (no overshoot) is just
  `damp()` with extra config.
- **Verdict:** **Rejected on brand grounds.** Use the monotonic `1 - exp(-λ·dt)` / eased-scalar settle,
  never a bouncy spring.

### I. TSL / WebGPU
Camera blend math is CPU-side three.js; TSL/WebGPU buys nothing here, iOS WebGPU still uneven 2025–2026
(consistent with docs 27/28/55). The math below ports unchanged. **Not for this element now.**

**Landscape verdict:** the grammar is **B + C**, with **E** for the DOM layer and **D** reserved for one
marquee transition. One normalized, fixed-duration, single-easing travel scalar `forge.travel`; an
**anchor pose per route** (`ANCHORS`, with `/`'s anchor being the journey-curve entry); position via an
**arced lerp** (orbit+dolly pull-back), orientation via **slerp**, fov/focus via scalar lerp — all on the
same `s`. The home journey remains scroll-scrubbed *within* route `/`; the **blend grammar governs only
the crossings between routes** and the journey↔chamber handoff. Springs, controllers, second timelines,
and everyday FBO cross-fades each break brand or fight the one-authority architecture.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Define one `ANCHORS` table — a single establishing pose per route (`pos`, `quat`, `fov`, `focus`, plus
the chamber's `look` target) — where route `/`'s anchor is the journey-curve's entry pose so the home
journey and the chambers are one system. On every route change, capture the camera's current pose once,
set a target = the new route's anchor, and animate one shared scalar `forge.travel: 0→1` over a fixed
`TRAVEL_DUR` with one eased profile. Each frame, derive the camera pose by interpolating captured→anchor
on that scalar: position via a lerp **bent by a `sin(π·s)` orbit+dolly pull-back** along a consistent
direction (out and around, never through the slab), orientation via **quaternion slerp**, and fov/focus
via scalar lerp — then hand back to the scroll-scrubbed journey only when on `/` and `travel` has settled
to its journey-bound state. A mid-travel route change re-captures and re-aims (re-arms `s`), never
fighting. The same `forge.travel` and the same route trigger drive the DOM chamber-copy cross-fade (View
Transitions / Forge-Reveal) and the `scenes.js` vein re-temper, so copy, veins, camera, lens, and bloom
all arrive on one beat.**

Justification against the world + the existing code:

- **It is the literal brief.** A normalized fixed-duration scalar with one easing = "consistent
  direction/duration." The `sin(π·s)` pull-back = "the orbit+dolly blend weight that makes navigation
  travel rather than an ad-hoc lerp." The anchor table = "a shared anchor pose per route." Slerp +
  monotonic settle = Brutalist Snap, no bounce.
- **It unifies the two camera authorities instead of seaming them.** By making `/`'s anchor *be* the
  journey entry pose, there is no "journey system vs route system" — there is **one** blend toward an
  anchor, and on `/` that anchor's *position* is further driven by the scroll curve. The handoff doc 27
  worried about (journey↔chamber) becomes a single `slerp/lerp` on `travel`, not a special case.
- **It reuses the store contract.** `forge.route` already exists and drives `scenes.js`. We add exactly
  one scalar (`forge.travel`) and one captured-pose scratch; everything else (`scrollDamped`, `scrollVel`,
  pointer) is untouched, so the temperature/material system reads the same signals byte-for-byte.
- **It composes with docs 27/55/28 without rewriting them.** Doc 27 sets the journey *position*; doc 55
  sets the journey *orientation* (RMF + bank → quaternion); doc 28 sets the journey *lens*. This doc wraps
  all three in a blend: when `travel<1` (mid-navigation, or off-`/`), the *anchor* pose wins by weight `s`;
  when on `/` and `travel` is at its journey value, docs 27/55/28 own the frame. One `mix`, three
  consumers.
- **Mobile-safe.** No FBO on the everyday move (D reserved), no second runtime (F/G/H rejected), no second
  rAF. Per-frame cost is a few lerp/slerp. The DOM cross-fade (E) is a cheap browser primitive that
  *excludes* the persistent canvas.
- **Reduced-motion safe.** `travel` snaps 0→1 (no arc, no dynamics); the camera assigns the anchor pose
  directly; the DOM cross-fade respects `prefers-reduced-motion` (View Transitions honor it). A dignified
  cut-free settle, the required floor.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` **r17x** (already) — `Vector3`, `Quaternion.slerp`, `Matrix4.lookAt/makeBasis`, `MathUtils`.
- `@react-three/fiber` (already) — the single `useFrame`.
- `lenis` **1.3.x** (already specified by doc 27) — for the journey scroll *and* programmatic
  `lenis.scrollTo()` on `/` re-entry (below).
- *(Optional, DOM layer only)* React 19 `<ViewTransition>` / React Router `viewTransition` for the chamber
  **copy** cross-fade. **No new WebGL dep.** The build stays on the existing `damp()` idiom.

### 4.2 The anchor table — one establishing pose per route

The single source of truth for "what frame is this chamber composed around." `/`'s anchor is the journey
curve's entry (so home is just route `/` whose position is then scroll-driven). Author `quat` by aiming a
scratch camera at the chamber's compositional centre once, or store a `look` point and build the
quaternion at load. Extends `scenes.js` rather than duplicating it.

```js
// src/scene/anchors.js — one establishing pose per route. Authored in ?debug, frozen here.
import * as THREE from 'three'
import { JOURNEY, FOCUS } from './journey.js'   // doc 27 curves
import { SCENES } from './scenes.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)

// Build a quaternion that looks from `pos` at `look` with world-up (chambers are level;
// the JOURNEY uses RMF up from doc 55, the chambers don't need a bank).
const _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0)
function quatLookAt(pos, look) {
  _m.lookAt(pos, look, _up)
  return new THREE.Quaternion().setFromRotationMatrix(_m)
}

// pos/look in world units; fov + focus feed doc 28's lens; `journey:true` means
// position is scroll-driven from JOURNEY (home), anchor pos is only the t=0 frame.
function anchor(pos, look, fov, focus, journey = false) {
  return { pos, look, quat: quatLookAt(pos, look), fov, focus, journey }
}

export const ANCHORS = {
  // HOME — the journey's t=0 establishing frame; position then driven by scroll curve.
  '/':            anchor(JOURNEY.getPointAt(0, V()), FOCUS.getPointAt(0.05, V()), 38, 7.0, true),
  // CHAMBERS — each a deliberate establishing shot, composed on the re-tempered slab.
  '/voice':       anchor(V(-2.0, 0.4, 6.0), V(0, -0.2, 0),  40, 6.0),  // low grazing, mirror-still
  '/software':    anchor(V( 1.8, 0.6, 5.7), V(0,  0.1, 0),  42, 5.7),  // tight on the pour
  '/automations': anchor(V( 0.2, 4.4, 5.3), V(0, -0.6, 0),  30, 6.2),  // top-down, long lens
  '/web':         anchor(V( 1.2, 0.5, 6.6), V(0,  0.0, 0),  50, 6.6),  // wide vivid reveal
  '/about':       anchor(V(-1.0, 0.2, 6.4), V(0,  0.0, 0),  40, 6.4),  // close oblique, the altar
  '/pricing':     anchor(V( 0.9, 0.7, 6.2), V(0,  0.3, 0),  36, 6.2),  // rise up the stone edge
  '/work':        anchor(V(-1.6, 1.0, 6.0), V(0, -0.1, 0),  44, 6.0),  // gallery three-quarter
  '/contact':     anchor(V( 0.0, 0.2, 5.8), V(0,  0.0, 0),  38, 5.8),  // head-on the forge-mouth
}
export const anchorFor = (p) => ANCHORS[p] || ANCHORS['/']
```

> Direction convention (the *grammar*): every chamber anchor sits at a positive `z` *facing the slab
> centre*, and the travel arc always **pulls back along the outgoing view direction, swings around the
> shared up, and dollies into the new anchor** (the `sin(π·s)` offset below). That one convention is why
> all eight entries read as the same *kind* of move — an establishing orbit-dolly — regardless of which
> two anchors are involved.

### 4.3 The store: one travel scalar + captured pose

```js
// src/store.js — additions (mutated outside React, read in useFrame)
export const forge = {
  // ...existing...
  travel: 1,                 // 0 = at captured pose, 1 = arrived at anchor. Re-armed on route change.
  travelDur: 1.1,            // seconds; the ONE duration for every route move (Brutalist beat)
  _travelT0: -10,            // wall-clock seconds at which the current move started
  _from: {                   // captured pose at the instant of the route change (scratch, no alloc/frame)
    pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fov: 38, focus: 7,
  },
  prevRoute: '/',
}

// one shared easing for ALL travel — high-momentum in, hard settle (no bounce). Brutalist Snap.
export function travelEase(s) {                 // s in [0,1]
  // easeOutQuint-ish: fast departure, decisive arrival, derivative→0 at 1 (impact, no overshoot)
  const u = THREE.MathUtils.clamp(s, 0, 1)
  return 1 - Math.pow(1 - u, 5)
}
```

### 4.4 The router hook: arm the travel on every route change (capture once)

Mounted once (e.g. in the persistent layout). On `forge.route` change, snapshot the live camera pose into
`forge._from` and re-arm `travel`. This is the **only** place a navigation kicks the camera; everything
else just reads `travel`.

```jsx
// src/scene/useTravelArm.jsx — called once; subscribes to route changes.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useThree } from '@react-three/fiber'
import { forge } from '../store.js'

export function useTravelArm() {
  const { camera } = useThree()
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname === forge.prevRoute) return
    // capture the pose we're leaving FROM (so the move starts exactly where the eye is now)
    forge._from.pos.copy(camera.position)
    forge._from.quat.copy(camera.quaternion)
    forge._from.fov = camera.fov
    forge._from.focus = forge.focusDist ?? 6.4
    forge.prevRoute = forge.route
    forge.route = pathname
    forge._travelT0 = performance.now() / 1000
    forge.travel = 0                              // re-arm: mid-travel clicks re-aim cleanly
    // returning to home: snap Lenis to top so the journey scroll starts at t=0 (one rAF; doc 27)
    if (pathname === '/' && forge.lenis) forge.lenis.scrollTo(0, { immediate: true })
  }, [pathname, camera])
}
```

### 4.5 The rig: the blend grammar (replaces doc 27's `cam.blendW` placeholder)

This slots **after** doc 27 sets the journey position and **wraps** doc 55's orientation. All scratch is
module-level (alloc-free loop, the §10 rule).

```js
// CameraRig.jsx — module scope
import * as THREE from 'three'
import { forge, damp, travelEase } from '../store.js'
import { anchorFor } from './anchors.js'
import { JOURNEY, FOCUS } from './journey.js'

const _jPos  = new THREE.Vector3()   // journey position (doc 27)   — used only on '/'
const _jQuat = new THREE.Quaternion()// journey orientation (doc 55) — used only on '/'
const _aPos  = new THREE.Vector3()   // anchor (target) position
const _pos   = new THREE.Vector3()   // composed final position
const _quat  = new THREE.Quaternion()// composed final orientation
const _mid   = new THREE.Vector3()   // arc pull-back offset
const _side  = new THREE.Vector3()   // perpendicular (orbit) direction
const WORLD_UP = new THREE.Vector3(0, 1, 0)

const PULLBACK = 1.35   // world units the arc bulges OUTWARD at s=0.5 (the orbit+dolly depth)

// --- inside useFrame((state, dt) => { ... after doc 27 sets journey pos/quat ... ---

const a = anchorFor(forge.route)

// 1) advance the ONE travel scalar over the ONE duration with the ONE easing.
const elapsed = performance.now() / 1000 - forge._travelT0
const sRaw = forge.travelDur > 0 ? elapsed / forge.travelDur : 1
forge.travel = THREE.MathUtils.clamp(sRaw, 0, 1)
const s = travelEase(forge.travel)              // eased 0..1 — same shape for every route

// 2) resolve the TARGET (anchor) pose. On '/', the anchor position is the live journey
//    sample (scroll-driven); off '/', it's the static chamber anchor.
if (a.journey) {                                // route '/': anchor pos is the journey curve
  _aPos.copy(_jPos)                             // _jPos already set by doc 27 this frame
} else {
  _aPos.copy(a.pos)
}

// 3) POSITION: arc-bent lerp from captured pose -> anchor (orbit+dolly, never through the slab).
_pos.copy(forge._from.pos).lerp(_aPos, s)
// perpendicular pull-back: bulge outward (away from slab centre) peaking at s=0.5 -> sin(pi*s)
_side.subVectors(_aPos, forge._from.pos)        // travel chord
_mid.crossVectors(_side, WORLD_UP).normalize()  // sideways (orbit) axis
// push OUT along the average view-from-centre direction so we swing around, not through:
_mid.copy(_pos).normalize().multiplyScalar(PULLBACK * Math.sin(Math.PI * forge.travel))
_pos.add(_mid)

// 4) ORIENTATION: slerp captured quat -> anchor quat (whip-free). On '/', target IS the
//    journey orientation (doc 55) so the blend dissolves into the scrubbed bank seamlessly.
_quat.copy(a.journey ? _jQuat : a.quat)
camera.quaternion.copy(forge._from.quat).slerp(_quat, s)

// 5) LENS: scalar-lerp fov + focus on the SAME s (doc 28 reads forge.focusDist).
camera.fov   = THREE.MathUtils.lerp(forge._from.fov,  a.fov,   s)
forge.focusDist = THREE.MathUtils.lerp(forge._from.focus, a.focus, s)
camera.updateProjectionMatrix()

// 6) HAND-OFF: once travel has arrived AND we're on '/', let docs 27/55 own the frame directly
//    (position from the curve, orientation from RMF+bank) so scroll-scrub is pixel-exact.
if (forge.travel >= 1 && a.journey) {
  camera.position.copy(_jPos)                   // doc 27
  camera.quaternion.copy(_jQuat)                // doc 55
} else {
  camera.position.copy(_pos)
}

// 7) pointer parallax stays a tiny ADD after, gated by `par` (doc 55) — never part of the blend.
camera.rotateY(forge.pointerDamped.x * 0.04 * par)
camera.rotateX(forge.pointerDamped.y * 0.03 * par)
```

### 4.6 Key params (expose to `?debug` leva)

| Param | Default | Meaning | Tune toward |
|---|---|---|---|
| `forge.travelDur` | 1.1 s | the **one** duration of every route move | shorter = snappier/Brutalist; longer = grander |
| `travelEase` | easeOutQuint | the **one** easing for every move | derivative→0 at 1 (impact, no bounce) |
| `PULLBACK` | 1.35 u | orbit+dolly arc bulge at `s=0.5` | the "it flew there" depth; the single most felt knob |
| `ANCHORS[r].fov` | per route | establishing lens per chamber | wide (50) for jewel, long (30) for channel-hall |
| `ANCHORS[r].focus` | per route | DOF focus on arrival (doc 28) | lock to the chamber's hero element |
| handoff threshold | `travel≥1` | when docs 27/55 reclaim the `/` frame | keep at 1 (exact scrub) |

### 4.7 How it hooks the shared master temperature / uniform system

It is a **near-pure consumer** of the shared bus — it adds exactly one scalar and changes no existing
signal, which is why it drops in safely:

- **One trigger, five arrivals.** The route change that arms `forge.travel` is the *same* event that (a)
  damps `scenes.js` veins toward the new chamber (§4.1), (b) cross-fades the chamber **copy** (View
  Transitions / Forge-Reveal), (c) re-aims the camera (this doc), (d) shifts the lens (doc 28 reads
  `forge.fov`/`focusDist` which we lerp on the same `s`), and (e) lets `uVeinScale`/`uVeinGlow`/`uIrid`
  in the master `U` pool damp to `sceneFor(route)`. Copy, veins, camera, lens, and bloom **arrive on one
  beat** — the cohesion proof for navigation.
- **`forge.travel` can pulse the forge on arrival.** Feed a strike on arrival
  (`if (prevTravel<1 && forge.travel>=1) forge.strikeAt = state.clock.elapsedTime`) so the obsidian veins,
  the sparks, the god-ray weight, and the bloom **surge as the camera lands the chamber** — the
  Brutalist-Snap *impact* the easing already shapes, echoed in the metal. One float, the whole world
  reacts (cohesion §7.6).
- **It never reaches `uTemp` or the A/E path.** The blend moves the eye and the lens only; the master
  temperature signal (`scrollDamped + vel·0.25`), the divine-fire clamp, and the noise basis are
  untouched. Travel *reveals* the same lit, same-temperature world from the new establishing frame.
- **No new uniform in `U`, no new clock, no second rAF.** `forge.travel` is a plain store scalar advanced
  by `performance.now()` inside the one `useFrame`; the master `U` pool (`forgeUniforms.js`) is unchanged.

---

## 5. COHESION (shared palette / lighting / uniforms)

- **One blend system, not two.** By making `/`'s anchor the journey entry (`journey:true`), the home
  flythrough and the eight chambers are governed by the *same* `forge.travel` blend toward an anchor. There
  is no separate "journey camera" and "route camera" with a fragile seam between them — there is one anchor
  table and one scalar, and on `/` the anchor's *position/orientation* are further driven by docs 27/55.
  The handoff is a `slerp`/`copy` on one threshold, not a special-cased system.
- **One curve, consumed four ways (binding contract §7.8).** The interlace `JOURNEY` curve already feeds
  channel geometry, pour flow, camera position (doc 27), and curvature/bank (doc 55). This doc adds no new
  geometry — `/`'s anchor *is* a sample of that same curve, so home travel can never disagree with the
  channel the metal is in.
- **One clock, dt/duration-driven, no bounce (§7.6).** `travel` advances on `performance.now()` over a
  fixed `travelDur`; orientation `slerp`s; position lerps along a `sin`-arc; lens lerps — every term is
  frame-rate-independent and **monotonic** (easeOutQuint, derivative→0 at 1). No spring, no overshoot, no
  `setInterval`, no second loop. Brutalist Snap, impact on arrival.
- **Palette / lighting untouched (§3, §5).** The grammar moves the eye and the lens; it adds no color, no
  light, no pass. The warm-forge palette (HDR `>1` accents that bloom), the metal-is-the-only-light model,
  the divine-fire A/E spill, the basalt green-reveal, and the procedural cool-key env (no EXR) are
  unchanged — the new establishing frame simply *reveals* the same lit world.
- **Per-route chambers stay authoritative (§9).** `scenes.js` remains the source of truth for the
  chamber's *look*; `ANCHORS` adds the chamber's *establishing pose*. They share the route key and damp on
  the same navigation, so the chamber's veins, framing, copy, and bloom move as one.
- **Degrades uniformly (§7.9).** A tier drop doesn't restructure the grammar; static snaps `travel` to 1
  (anchor pose assigned directly, no arc, no slerp dynamics) — never a recolor or re-rig.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

- **Per-frame cost is negligible.** One scalar advance, one eased remap, one position lerp + a cross +
  `sin`, one quaternion slerp, two scalar lerps, one `updateProjectionMatrix` (only while
  `travel<1`). A few µs; **zero render targets, zero new passes, zero per-frame allocation** (all scratch
  module-level). Sits comfortably inside the ~2–3 ms "Camera/scroll JS + React + Lenis" line of the
  high-tier budget (cohesion §10); it does **not** compete with the slab fbm shader or the post chain for
  fill-rate.
- **The everyday move never touches an FBO.** The expensive image-space cross-fade (technique D / doc 45
  portal-FBO) is **reserved** for at most one or two marquee transitions, gated to `high`. Eight-routes-
  daily navigation is pure camera math — the only affordable choice on a fill-rate-bound phone.
- **`updateProjectionMatrix` only during travel.** Calling it every frame is cheap but pointless once
  `travel≥1`; the handoff branch (§4.5 step 6) leaves it alone on a settled `/` scroll, so steady-state
  scroll pays nothing for the lens lerp.
- **The DOM cross-fade is a browser primitive.** View Transitions (technique E) cross-fade the chamber
  **copy** with no JS animation loop and **explicitly exclude** the persistent `<canvas>` (one element,
  never unmounted, no snapshot) — so the prerendered SEO/AEO DOM stays intact and the canvas cost is zero.
- **Tier behaviour (mirror `forge.quality`):**
  - **`high`** — full arc (`PULLBACK 1.35`), slerp, fov+focus lerp, arrival strike, optional one
    portal-FBO marquee transition (`/`→`/contact`).
  - **`low`** — same blend, **halve `PULLBACK`** (cheaper, calmer arc), keep slerp + lerp, **no** FBO
    marquee (everyday move only), shorten `travelDur` slightly for a snappier settle.
  - **`static` / reduced-motion** — **`travel` snaps to 1**: assign the anchor pose directly (no arc, no
    slerp dynamics, no fov animation — set fov once), pointer off (`par=0`). The DOM cross-fade falls back
    to View Transitions' reduced-motion behavior (instant). A dignified, cut-free settle — the required
    floor.
- **iOS edge cases.** `performance.now()`-based `travel` is immune to Lenis rubber-band (it's wall-clock,
  not scroll-derived). Clamp `travel∈[0,1]`. A mid-travel route change re-captures `_from` from the *live*
  interpolated pose and re-arms `s=0`, so rapid clicks re-aim smoothly instead of fighting (no stacked
  tweens — there is only ever one scalar).

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls (each a real, shippable-looking bug):**
1. **Distance-driven duration.** Damping a pose toward a target makes far routes take longer than near
   routes — the brief's exact "ad-hoc lerp" failure. **Normalize:** one `travelDur`, one easing, one arc
   shape; per-route variation lives *only* in the anchor, never in the move.
2. **Straight-line lerp through the slab.** A naïve `pos.lerp(anchor, s)` flies the camera *through* the
   obsidian. Bend the path with the `sin(π·s)` outward pull-back so it **orbits+dollies** around — the
   "travel not cut" read.
3. **Euler / `lookAt`-tween on orientation.** Lerping two `lookAt`s or Euler angles across the chamber
   reframe whips and can flip. **Always slerp the quaternion** (2025–2026 forum consensus).
4. **Spring / overshoot.** A bouncy spring violates Brutalist Snap. Use the monotonic easeOutQuint scalar
   (derivative→0 at 1) — impact, no bounce.
5. **Two animation authorities.** Adding GSAP/Theatre/`camera-controls` for the transition forks the one
   `damp()` motion authority and will fight the scroll scrub on `/`. Keep it one store scalar in one
   `useFrame`.
6. **FBO cross-fade as the everyday swap.** Two scene renders + composite every navigation blows the
   fill-rate budget *and* throws away the single-renderer "real travel" win. Reserve FBO/portal for one
   marquee transition; everyday is camera math.
7. **Cross-fading the canvas with View Transitions.** The persistent `<canvas>` has no before/after
   snapshot; View Transitions are for the **DOM copy** only. Exclude the canvas; do the WebGL travel in
   `useFrame`.
8. **Mid-travel click stacks tweens.** Without re-capture, a second navigation mid-move fights the first.
   Re-capture `_from` from the *live* pose and reset `s=0` — there is only ever one scalar, so it re-aims.
9. **Forgetting the home handoff.** If `travel` stays <1 on `/`, the scroll scrub is muddied by the blend.
   Hand off (assign curve pose) once `travel≥1` so scroll is pixel-exact.
10. **Lens snapping while position eases.** If fov/focus jump on navigation while position lerps, the move
    reads broken. Lerp fov+focus on the **same** `s`; only `updateProjectionMatrix` while travelling.
11. **Allocating in `useFrame`.** New `Vector3`/`Quaternion` per frame → GC stutter on the throttling
    phone. All scratch module-level.
12. **Reduced-motion not snapping.** Leaving the arc/slerp on under `prefers-reduced-motion` is seasick.
    Snap `travel=1`, assign the anchor.

**Order of operations** (each step verified the repo way — `npm run build` green → `qa-route` at 393×852
+ 1440×900 with **0 console errors** → then the iPhone-15 OLED read; travel feel/seasickness do **not**
simulate headless):
1. **Land docs 27 + 55 first** (journey position + RMF orientation + Lenis, one rAF). The blend wraps
   them; it is meaningless without the journey under it.
2. **Author `ANCHORS`** in `?debug` — fly to each chamber's establishing frame and freeze `pos`/`look`/
   `fov`/`focus`. Make `/`'s anchor the journey `t=0` frame. This is the make-or-break art step.
3. **Add `forge.travel` + `travelEase` + `useTravelArm`** (capture-on-route-change). Confirm one scalar
   animates 0→1 over `travelDur` on every navigation, and a mid-travel click re-arms cleanly.
4. **Wire the blend (§4.5) with `PULLBACK=0` first** (straight lerp + slerp). Confirm position/orientation/
   lens all arrive together, no whip, no flip, monotonic settle.
5. **Dial in `PULLBACK`** on desktop until each navigation *orbits+dollies* — flies there, doesn't slide
   through the slab. Verify the move *direction* is consistent across all eight routes.
6. **Wire the `/` handoff** (`travel≥1` → assign curve pose) and confirm scroll-scrub on `/` is
   pixel-exact after arrival.
7. **Time-align the DOM layer** — chamber copy cross-fades (View Transitions / Forge-Reveal) on the same
   route trigger; confirm copy + camera + veins land on one beat.
8. **Arrival strike** — pulse `forge.strikeAt` on `travel` crossing 1 so the metal surges as the camera
   lands (shared system).
9. **Tier-gate** (low: halve `PULLBACK`, no FBO marquee; static: snap `travel=1`, fixed pose, pointer
   off). Verify reduced-motion is cut-free and accessible.
10. **iPhone-15 OLED read** with `qa-route`/`tune-pacing`: every route entry travels with the same
    direction/duration, no seasickness, no flip, mid-travel re-click re-aims, 60fps, `renderer.info.memory`
    flat across navigation (no FBO leak on the everyday move).

---

## 8. SOURCES (2025–2026)

1. **darkroomengineering/lenis — README / API (v1.3.x)**, GitHub, current 2025–2026 — `lenis.scrollTo()`
   (px / selector / element, `immediate`/`duration`), manual `raf(time)` single-loop, `autoRaf:false`,
   `scroll` event payload — the input + programmatic re-entry layer for the blend's `/` snap.
   https://github.com/darkroomengineering/lenis
2. **darkroomengineering/lenis — Discussion #296 "Managing lenis.scrollTo using Three.js object
   positions"**, GitHub, 2025 — driving programmatic scroll from 3D object/camera targets, the pattern for
   snapping the journey to `t=0` on home re-entry while keeping one rAF.
   https://github.com/darkroomengineering/lenis/discussions/296
3. **Wawa Sensei — "How to Create Scene Transitions with React Three Fiber"**, 2025 — render-target/FBO
   transitions, `mix()` dissolve/wipe/fade shaders, coordinating a camera move with the swap — the
   evaluated FBO lane (technique D), reserved for marquee transitions.
   https://wawasensei.dev/tuto/how-to-create-scene-transitions-with-react-three-fiber
4. **Wawa Sensei — "Render Target" (R3F course lesson)**, current 2025–2026 — `useFBO`, rendering a scene
   to a texture, passing it as a uniform; the mechanics behind the reserved portal-FBO cross-fade.
   https://wawasensei.dev/courses/react-three-fiber/lessons/render-target
5. **Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP"**, 19 Nov 2025 — GSAP as a
   cinematic *director*: connecting scroll to camera paths with named easing curves (`cinematicSilk`,
   `cinematicSmooth`) and **consistent durations** for "story-like sequences, not cuts" — the grammar
   lessons adopted into the fixed-duration single-easing travel scalar.
   https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
6. **Codrops — "Building Seamless 3D Transitions with Webflow, GSAP, and Three.js"**, 18 Mar 2026 —
   seamless (cut-free) section-to-section 3D transitions on one persistent scene; the modern bar for
   "travel between sections" that this blend grammar targets without a second runtime.
   https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/
7. **Codrops — "Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based
   Backgrounds"**, 9 Mar 2026 — scroll velocity + a unified motion system driving camera *and* mood/look
   from one authority, with per-section "mood" anchors — the one-motion-authority + per-route-anchor model.
   https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
8. **Codrops — "Reactive Depth: Building a Scroll-Driven 3D Image Tube with React Three Fiber"**, 17 Feb
   2026 — shaders + inertia + a **unified motion system** (one damped scroll authority feeding camera and
   shader) — the cohesion-aligned "one driver" pattern behind `forge.travel`.
   https://tympanus.net/codrops/2026/02/17/reactive-depth-building-a-scroll-driven-3d-image-tube-with-react-three-fiber/
9. **React (react.dev) — "React Labs: View Transitions, Activity, and more"**, 23 Apr 2025 —
   `<ViewTransition>` / `startViewTransition` default **cross-fade**, orchestration with React's render
   cycle — the adopted DOM-layer cross-fade for chamber copy (not the canvas).
   https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more
10. **Chrome for Developers — "What's new in view transitions (2025 update)"**, 2025 — same-document
    transition support matrix (Chrome/Edge 111+, Firefox 133+, Safari 18+), `ViewTransition.waitUntil`
    to hold the transition until async work settles — time-aligning the DOM cross-fade with the WebGL move.
    https://developer.chrome.com/blog/view-transitions-in-2025
11. **React Router — "View Transitions" how-to**, current 2025–2026 — the `viewTransition` prop on
    `Link`/`NavLink` to opt navigations into a cross-fade in an SPA without unmounting persistent
    elements — the router wiring for the DOM layer beside a persistent `<canvas>`.
    https://reactrouter.com/how-to/view-transitions
12. **Dipankar Paul — "Mastering Camera Movement in Three.js"**, Jan 2026 — quaternion **slerp** +
    damped settle for smooth, whip-free camera reorientation, and the practical lerp/damp guidance the
    blend's orientation half follows. https://blog.iamdipankarpaul.com/mastering-camera-movement-in-threejs
13. **three.js forum — "Camera animation with quaternion travels undesired path"** (Questions, active
    2025) — why tweening orientations whips and that **slerp** (great-circle) is the fix; the
    "never Euler/lookAt-tween across an angle" consensus this doc's orientation blend obeys.
    https://discourse.threejs.org/t/camera-animation-with-quaternion-travels-undesired-path/41147
14. **yomotsu/camera-controls** — npm/GitHub, maintained 2025 — SmoothDamp `setLookAt`/`dollyTo` with
    `smoothTime` *as the arrive-duration*; evaluated as the controller alternative (rejected: owns the
    camera, second authority), and the reference for fixed-duration arrival.
    https://www.npmjs.com/package/camera-controls

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Anchor-pose authoring tool in `?debug`.** A leva-driven "set this chamber's establishing frame from
   the current camera, write the quaternion" capture button + a live overlay drawing all eight anchors and
   the travel arc between the current and target — so the grammar is *authored visually*, never guessed,
   and re-tunes per device aspect.
2. **Aspect-aware anchors (portrait vs landscape).** The iPhone-15 portrait frame and the desktop
   landscape frame want different establishing distances/fov per chamber; derive each anchor's `pos.z`/`fov`
   from the viewport aspect at arm-time so the *same grammar* composes correctly on both judge viewports.
3. **The one marquee portal-FBO transition (`/`→`/contact`).** Spec the single high-tier image-space
   forge-reveal that *is* allowed (doc 45): outgoing slab rendered to FBO, dissolved through a heat-warped
   `gw_caustic` mask into the forge-mouth chamber, time-boxed and gated — the one place a cross-fade earns
   its fill-rate, distinct from the everyday camera travel.
4. **Travel-coupled lens + atmosphere bus.** Bind a whisper of the doc 28 dolly-zoom and a transient
   heat-haze/bloom lift to the `forge.travel` arc (peak at `s≈0.5`, settle at 1) so the *move itself* has
   optical weight — the camera "breathes" through the orbit-dolly — measured against the iPhone-15 budget,
   warm-only, on-brand.
