# 55 — Banked Look-At & Roll on Celtic-Interlace Bends

_Phase-2 graphics deep-dive · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer
(r3f / three.js r17x), warm-forge palette. Cluster **I-camera-motion**. Parent: doc **27** (the journey
curve + Lenis) and doc **28** (the lens). This doc owns the **one** highest-risk camera-quality detail:
how the camera **orients** as it travels the curve — banking into tight Celtic-interlace turns without
whip, gimbal flip, or seasickness, instead of a raw `lookAt()` of a curve sample on a sharp bend._

> Scope split: doc 27 owns **where the camera goes** (CatmullRom position by arc-length at
> `forge.scrollDamped`). Doc 28 owns **how the lens sees** (fov, DOF, focus). This doc owns **how the
> body is held** — the orientation quaternion (yaw/pitch toward the flow + a roll that leans into the
> turn) and the frame that produces it. It writes nothing new to the shared bus; it only changes the
> three lines at the end of `CameraRig`'s `useFrame` that currently say `camera.lookAt(0, …, 0)`.

---

## 1. SCOPE (this element in the GAELWORX world)

The GAELWORX home journey is **one unbroken travel shot down the pour**. The metal leaves the stone
altar, runs through Celtic-interlace channels carved in green-black basalt — *winding, branching,
rejoining* — fills the GAELWORX letterforms left-to-right, and the camera follows the molten front the
whole way (doc 27). Interlace knotwork is, by construction, **a sequence of tight S-bends and near-180°
returns**: that is what makes it read as knotwork and not a road. The camera path threaded through it
therefore has **high curvature spikes at the bends** — exactly the regime where the naïve "sample the
curve a little ahead and `lookAt()` it" recipe falls apart.

Three failure modes appear on those bends, and each is individually disqualifying at the Lusion / Unseen
/ Unreal-cinematic bar this build is held to:

1. **Look-at whip.** A fixed look-ahead point (`curve.getPointAt(t + Δ)`) swings through a large angle
   as `t` crosses a hairpin, so the camera *snaps* its heading in a frame or two. Reads as a jerk, not a
   journey.
2. **Gimbal / up-vector flip.** `Object3D.lookAt()` rebuilds orientation from the target plus a **fixed
   world-up** (`+Y`). When the tangent passes near vertical, or when the path doubles back, the implied
   up becomes ambiguous and the roll **flips 180°** in one frame — the classic black-frame pop.
3. **No bank.** Even with a smooth heading, a camera that stays world-level through a hard turn feels
   like a drone on rails. Cinematic and game cameras **roll into** the turn (lean toward the inside of
   the bend) so the corner has *body* and centripetal weight — the difference between "on rails" and
   "flying it."

The job of this element is to deliver heading + roll that is **C¹-smooth across the whole scroll range
and across every interlace bend**, that **never flips**, that **leans into** the turn proportional to its
sharpness, and that obeys the brand **Brutalist Snap / Forge Reveal** motion law — high-momentum
easing, **no bounce, only impact on arrival**. It must do this inside the iPhone-15 budget (a handful of
vector/quaternion ops per frame, zero render targets) and degrade to a dignified static pose under
reduced-motion. This is named in doc 27 §9 as "the single highest-risk camera quality detail," and in
doc 28's framing as the thing that decides whether the world looks *photographed* or *scripted*.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable modern way to orient a curve-following camera, scored on quality / perf / mobile /
complexity. The input in all cases is the arc-length position `p = curve.getPointAt(t)` and tangent
`T = curve.getTangentAt(t)` from doc 27's `JOURNEY` curve.

### A. Raw `Object3D.lookAt(aheadPoint)` — the naïve baseline (what NOT to do)
`camera.lookAt(curve.getPointAt(t + Δ))`. `lookAt` builds a rotation matrix from `(eye, target,
worldUp=+Y)` then extracts a quaternion.
- **Quality:** Fine on gentle curves, **broken on interlace bends** — whip (large Δ) and **up-vector
  flip** when the tangent nears vertical or the path reverses. No roll/bank at all.
- **Perf/Mobile:** Free.
- **Verdict:** The documented anti-pattern (doc 27 pitfall 4; the three.js-forum "camera banking on a
  curved path" thread, 2025). The baseline this doc replaces.

### B. Frenet frame (`Curve.computeFrenetFrames` / `getTangentAt` + curve normal)
three.js's own `computeFrenetFrames(segments, closed)` returns `{tangents, normals, binormals}` — the
same frames `TubeGeometry`/`ExtrudeGeometry` ride. The frame's normal points toward the **center of
curvature**, so `binormal` is a *physically correct bank axis*: the camera leans exactly into the turn.
- **Quality:** Bank is "free" and correct in direction. **But the Frenet normal is undefined at
  inflection points** (zero curvature — straight segments between bends, which interlace has many of) and
  **flips sign through an inflection**, producing a sudden 180° roll snap precisely at the transition
  between an over-strand and an under-strand. This is the well-known Frenet instability.
- **Perf/Mobile:** `computeFrenetFrames` is precomputed once over N segments (cheap); per-frame is an
  interpolated lookup.
- **Verdict:** The *bank direction* is right; the *raw Frenet roll magnitude* is unusable on knotwork
  without taming. Useful as a **bank-direction hint**, not as the orientation authority.

### C. Rotation-Minimizing Frame (RMF) via the **double-reflection** method (Wang et al.)
The canonical fix for Frenet's flip: a frame that **transports** the previous up-vector along the curve
with the *minimum* rotation needed to stay perpendicular to the new tangent — so it never spins about the
tangent, never flips at inflections, and is stable on straights. The **double-reflection** algorithm
(Wang, Jüttler, Zheng, Liu, *ACM TOG* 2008) computes each frame from the previous with two reflections,
4th-order accurate, ~same per-frame cost as the cruder projection/rotation methods; it's the method
Houdini's `slideframe()` and most production sweeps use. Re-surfaced in 2025 write-ups (Entagma "TD
Essentials: Parallel Transport"; "Lockdown Geometry: Rotation Minimizing Frames", Medium).
- **Quality:** **Best-in-class stability** — no flip, no whip, smooth up-vector everywhere. It gives a
  *neutral, level* frame (the camera doesn't bank on its own — it just never rolls *wrong*). You then
  **add** an art-directed bank on top (technique F).
- **Perf/Mobile:** Precompute the RMF up-vector at every curve sample **once** (build time), store as an
  array; per-frame is an arc-length lookup + one slerp. Effectively free at runtime.
- **Complexity:** Medium — ~25 lines of build-time code, run once.
- **Verdict:** **The orientation backbone.** Parallel-transport / RMF is the parent deep-dive's own
  suggested fix ("a Frenet/parallel-transport frame so the camera leans into turns without whip or
  gimbal").

### D. Per-frame parallel-transport (incremental, no precompute)
Instead of precomputing, rotate *last frame's* up by the delta rotation between last tangent and this
tangent (`quaternion.setFromUnitVectors(prevT, T)` applied to `prevUp`). Equivalent to RMF integrated at
frame rate.
- **Quality:** Same stability as C **if** the frame step is small and monotonic. But scroll can **jump,
  reverse, and stutter** (Lenis momentum, rubber-band, route blends) — integrating a path-dependent
  frame against a non-monotonic parameter **accumulates drift / hysteresis** (scrub back and the up-vector
  doesn't return to where it was). Disqualifying for a *scrubbable* scroll camera.
- **Verdict:** Right math, wrong parameterization for a scroll scrubber. **Precompute (C), don't
  integrate live (D).** This is the single most important architectural call in this doc.

### E. Quaternion-slerp keyframes (author the orientation, scrub the playhead)
Author a small set of orientation quaternions at hand-picked `t` (altar, each bend apex, the letter row,
finale), then `slerp` between the bracketing pair by local `t`. (Theatre.js does this with an editor;
you can do it with a plain array.)
- **Quality:** Total art-director control of bank/heading at each beat; slerp is whip-free and
  gimbal-free by definition (great-circle interpolation). The 2025 forum consensus ("Camera animation
  with quaternion travels undesired path") is: **never tween Euler/lookAt across bends — slerp
  quaternions.**
- **Perf/Mobile:** Trivial — one slerp per frame.
- **Complexity:** Medium-low, but it's **manual** — you must place and tune every key, and a key in the
  wrong spot reads as a missed bank. No automatic coupling to curvature.
- **Verdict:** Excellent **as the final smoothing/override layer** and for the finale beat, but as the
  *sole* system it's hand-authoring what RMF+curvature gives for free. **Use it to override, not to
  drive.**

### F. Velocity-aligned bank (lean ∝ lateral acceleration) — the "fly it" layer
Compute the turn rate from the curve: `roll = -k · (dHeading/dt) · sign(turn)`, i.e. bank **into** the
turn proportional to how hard it's turning (lateral/centripetal acceleration), exactly like an aircraft
coordinating a turn. The turn direction is `sign((T_prev × T_next)·up)`; the magnitude is the angle
between successive tangents. (Flight/racing-sim camera convention; surfaced in the 2025 "spline camera
roll / banking" and "camera banking on a curved path" discussions.)
- **Quality:** This is the part that makes a bend *feel* like a bend. Clamped and damped, it's the
  cinematic lean. Layered on an RMF base (C), it's stable.
- **Perf/Mobile:** Free (two tangent samples + an atan/cross).
- **Verdict:** **The bank layer.** Drive its *amount* from precomputed curvature, apply it as a roll
  about the (RMF-stable) forward axis.

### G. drei `CameraControls` / `camera-controls` (yomotsu) smoothDamp transitions
yomotsu/camera-controls offers smooth damped `setLookAt`/`dollyTo` transitions (SmoothDamp, Game
Programming Gems easing). Great for *interactive orbit*, but it's a **controller** that owns the camera —
it fights a scroll-scrubbed path camera and adds a dependency. (Evaluated, not adopted; same reasoning
doc 27 rejected `ScrollControls`.)

### H. `maath/easing` `dampE` / `dampQ` — the smoothing primitive (pmndrs)
Not an orientation *system* but the **damping primitive** to smooth the final quaternion:
`maath.easing.dampQ(camera.quaternion, targetQuat, smoothTime, dt)` is refresh-rate-independent,
interruptible, shortest-path (the Unity-SmoothDamp family). The pmndrs-native, dependency-light way to
get Brutalist-Snap settling on a quaternion without GSAP.
- **Verdict:** **Adopt as the final settle stage** (or hand-roll one `Quaternion.slerp` per frame with a
  `1 - exp(-λ·dt)` factor — same result, zero deps). Either is fine; `slerp`-with-exponential keeps the
  build dependency-free and matches the existing `damp()` idiom in `store.js`.

### I. TSL / WebGPU node camera (the future lane)
Camera orientation is CPU-side three.js math; TSL/WebGPU buys nothing here (it's a shader pipeline). iOS
WebGPU coverage is still uneven in 2025–2026. **Not for this element** (consistent with doc 27 §F /
doc 28 §G). The math below is renderer-agnostic and ports unchanged.

**Landscape verdict:** the orientation is **C (RMF, precomputed) + F (curvature-driven bank) +
slerp-damp settle (H), with E as a per-beat override.** Build the stable, flip-free up-vector once via
RMF; add an art-directed roll whose magnitude is the precomputed curvature and whose sign leans into the
turn; compose heading-from-tangent with that roll into a target quaternion; **slerp-damp** the camera
toward it every frame. A/B/D/G each break on knotwork or impose a model that fights the scroll-scrubbed,
single-store architecture.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Precompute a rotation-minimizing up-vector field along the `JOURNEY` curve once at build time
(double-reflection RMF). Per frame: sample arc-length position + tangent at the damped scroll `cam.t`;
build a heading-from-tangent basis using the precomputed RMF up (never world-`+Y`); add a roll about the
forward axis whose magnitude is a damped, clamped function of the precomputed local curvature and whose
sign leans into the bend; compose the target orientation as a quaternion; and `slerp` the camera's
quaternion toward it with a frame-rate-independent damping factor. Optionally slerp toward a small set of
authored override quaternions on named beats (the finale). The roll, the bank sign, and the curvature all
derive from the *same* `JOURNEY` curve and the *same* `forge.scrollDamped` the metal temperature and the
lens read — so the camera leans into the same bend the pour-front is rounding, on the same heartbeat.**

Justification against the world + the existing code:

- **It directly answers the brief.** RMF = "parallel-transport frame so the camera leans into tight
  channel turns without whip or gimbal." Curvature-driven roll = the lean. Slerp-damp = "no whip,"
  "no bounce, only impact." Precompute = "scrubbable without drift."
- **It replaces exactly the lines doc 27 left.** `CameraRig.jsx` currently ends with
  `camera.position.lerp(...)` + `camera.lookAt(0, …, 0)`. Doc 27 already swaps position to
  `JOURNEY.getPointAt(cam.t)`. This doc swaps the *orientation* line: instead of `lookAt`, compose the
  RMF+bank quaternion and `slerp`. Nothing else in the rig changes; the scroll/vel/pointer writes the
  rest of the world reads stay byte-identical.
- **It reuses one curve three ways.** Per the cohesion contract §7 rule 8, the hand-authored interlace
  curve is the single source of truth for channel geometry, pour flow, *and* the camera path. The
  camera's **curvature** comes from that same curve, so the bank is guaranteed to agree with the channel
  the metal is actually in. No private camera geometry.
- **It's free on mobile.** All the expensive math (RMF, curvature) is **precomputed once**; per-frame is
  ~4 vector samples, a cross/atan, one quaternion compose, one slerp. Zero render targets, zero new
  per-frame allocation (preallocated scratch objects, the alloc-free `useFrame` rule).
- **Brand motion compliance.** Slerp with `1 - exp(-λ·dt)` is high-momentum, monotonic, **no
  overshoot** — Brutalist Snap, not a spring. The bank *arrives* into the turn.
- **Reduced-motion safe.** Static tier skips the bank, skips the slerp dynamics, and resolves to a fixed
  reverent pose (heading down the flow, level) — a dignified still, the required floor.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` **r17x** (already in repo) — `CatmullRomCurve3`, `Quaternion`, `Matrix4.lookAt`,
  `Vector3.applyAxisAngle`, `Quaternion.slerp`. **No new dep required.**
- `@react-three/fiber` (already) — the single `useFrame` loop.
- *(Optional)* `maath` (pmndrs) for `easing.dampQ` if you prefer it over the hand-rolled slerp-damp.
  The build below stays **dependency-free** (hand-rolled), matching the existing `damp()` idiom.

### 4.2 Build-time: the RMF up-vector field (run once, in `journey.js`)

Precompute a flip-free up-vector at `SAMPLES+1` evenly-arc-length points along `JOURNEY`, plus the local
**curvature magnitude** (for the bank amount) and **turn sign** (for the bank direction). This is the
double-reflection idea expressed with three.js's own `setFromUnitVectors` rotation between consecutive
tangents (parallel transport); it is stable because it's evaluated on the *monotonic build-time
parameter*, not the live scroll.

```js
// src/scene/journeyFrames.js — precomputed once, imported by CameraRig
import * as THREE from 'three'
import { JOURNEY } from './journey.js'   // the CatmullRomCurve3 from doc 27

const SAMPLES = 240                       // arc-length resolution of the frame field
const WORLD_UP = new THREE.Vector3(0, 1, 0)

// outputs, indexed 0..SAMPLES (u = i / SAMPLES)
export const UP   = []   // rotation-minimizing up-vector at each sample (Vector3)
export const TAN  = []   // unit tangent at each sample (Vector3)
export const CURV = []   // signed curvature proxy: + = turning right, - = left, magnitude = sharpness

;(function buildFrames () {
  // 1) tangents at every sample (arc-length parameterised)
  for (let i = 0; i <= SAMPLES; i++) {
    TAN[i] = JOURNEY.getTangentAt(i / SAMPLES, new THREE.Vector3()).normalize()
  }

  // 2) seed the up: pick a world axis least aligned with the first tangent, project out
  let up = new THREE.Vector3(0, 1, 0)
  if (Math.abs(TAN[0].y) > 0.9) up.set(1, 0, 0)          // avoid degenerate when looking up
  up.sub(TAN[0].clone().multiplyScalar(TAN[0].dot(up))).normalize()
  UP[0] = up.clone()

  // 3) PARALLEL TRANSPORT (RMF): rotate the up by the minimal rotation T[i-1] -> T[i].
  //    No world-up reference after the seed => no flip at inflections, stable on straights.
  const q = new THREE.Quaternion()
  for (let i = 1; i <= SAMPLES; i++) {
    q.setFromUnitVectors(TAN[i - 1], TAN[i])            // minimal rotation between tangents
    up = up.clone().applyQuaternion(q)
    // re-orthogonalise against numerical drift (Gram–Schmidt vs the new tangent)
    up.sub(TAN[i].clone().multiplyScalar(TAN[i].dot(up))).normalize()
    UP[i] = up.clone()
  }

  // 4) signed curvature proxy for the BANK: angle between successive tangents,
  //    signed by which way the path turns about the local up.
  const cross = new THREE.Vector3()
  for (let i = 0; i <= SAMPLES; i++) {
    const a = TAN[Math.max(i - 1, 0)]
    const b = TAN[Math.min(i + 1, SAMPLES)]
    const ang = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1))   // unsigned turn rate
    cross.crossVectors(a, b)
    const sign = Math.sign(cross.dot(UP[i]) || 1)                   // + right / - left
    CURV[i] = ang * sign
  }
})()

// arc-length lookup with linear interp between samples (called per frame)
const _a = new THREE.Vector3(), _b = new THREE.Vector3()
export function sampleUp (t, out) {
  const f = THREE.MathUtils.clamp(t, 0, 1) * SAMPLES
  const i = Math.floor(f), k = f - i, j = Math.min(i + 1, SAMPLES)
  _a.copy(UP[i]); _b.copy(UP[j])
  return out.copy(_a).lerp(_b, k).normalize()
}
export function sampleCurv (t) {
  const f = THREE.MathUtils.clamp(t, 0, 1) * SAMPLES
  const i = Math.floor(f), k = f - i, j = Math.min(i + 1, SAMPLES)
  return THREE.MathUtils.lerp(CURV[i], CURV[j], k)
}
```

Why `setFromUnitVectors(T[i-1], T[i])` and not `computeFrenetFrames`: it is the **double-reflection /
parallel-transport** result (minimal incremental rotation, no curvature-center reference), so it does
**not** flip at inflection points where Frenet's normal vanishes — the exact stability property knotwork
demands. Built once on the monotonic index `i`, it is drift-free regardless of how the live scroll later
scrubs it.

### 4.3 Per-frame: heading basis + bank → target quaternion → slerp-damp

Replace the `camera.lookAt(...)` line at the end of `CameraRig.jsx`'s `useFrame` with this. All scratch
objects are module-level (alloc-free loop).

```js
// CameraRig.jsx — module scope (reused every frame, zero per-frame allocation)
import * as THREE from 'three'
import { JOURNEY } from './journey.js'
import { sampleUp, sampleCurv } from './journeyFrames.js'

const _pos   = new THREE.Vector3()
const _tan   = new THREE.Vector3()
const _up    = new THREE.Vector3()
const _fwd   = new THREE.Vector3()   // look direction (heading toward the flow)
const _right = new THREE.Vector3()
const _m     = new THREE.Matrix4()
const _qTarget = new THREE.Quaternion()
const _qRoll   = new THREE.Quaternion()
let   bank = 0                        // damped roll angle (radians), persisted across frames

// --- inside useFrame((state, dt) => { ... after position is set ... ---

// 1) POSITION + HEADING from the curve (doc 27 already sets position from getPointAt).
JOURNEY.getTangentAt(THREE.MathUtils.clamp(cam.t, 0, 1), _tan).normalize()
// small, damped LOOK-AHEAD heading: face slightly down the flow, not the exact tangent,
// so the eye anticipates the bend. Δ stays small (≈0.04–0.06) to avoid whip (doc 27 pitfall 4).
JOURNEY.getPointAt(THREE.MathUtils.clamp(cam.t + 0.05, 0, 1), _fwd)
_fwd.sub(camera.position).normalize()        // heading = toward the look-ahead point

// 2) STABLE UP from the precomputed RMF field (NEVER world +Y → no gimbal flip).
sampleUp(cam.t, _up)

// 3) BANK: lean into the turn, magnitude ∝ precomputed curvature, sign = turn direction.
//    Damp + clamp so a hairpin doesn't slam the roll; Brutalist-Snap (no overshoot).
const targetBank = THREE.MathUtils.clamp(
  sampleCurv(cam.t) * BANK_GAIN +              // curvature-driven lean
  forge.scrollVel * 0.0,                        // (optional) extra lean on a fast flick — keep 0 first
  -BANK_MAX, BANK_MAX,
)
bank = damp(bank, targetBank, 3.0, dt)          // λ≈3 → settles in ~0.3s, no bounce
_qRoll.setFromAxisAngle(_fwd, bank)             // roll ABOUT the heading axis = a true bank
_up.applyQuaternion(_qRoll)                     // tilt the up-vector by the bank

// 4) COMPOSE target orientation from (eye, heading, banked-up). Matrix4.lookAt builds the
//    basis; flip is impossible because _up is RMF-stable + only banked, never world-locked.
_right.crossVectors(_fwd, _up).normalize()
_up.crossVectors(_right, _fwd).normalize()      // re-orthonormalise
_m.makeBasis(_right, _up, _fwd.clone().multiplyScalar(-1))  // -fwd: camera looks down -Z
_qTarget.setFromRotationMatrix(_m)

// 5) (optional) per-beat OVERRIDE: slerp toward an authored finale quaternion on the last act.
//    const w = range(forge.scrollDamped, 0.9, 0.1)
//    _qTarget.slerp(FINALE_QUAT, w * w)

// 6) SLERP-DAMP the camera toward the target — frame-rate independent, whip-free, no bounce.
const k = 1 - Math.exp(-ORIENT_LAMBDA * dt)     // λ≈5 → snappy but smooth (Brutalist Snap)
camera.quaternion.slerp(_qTarget, k)

// pointer parallax stays a tiny ADD on top (yaw/pitch nudge), gated by `par`, AFTER the slerp:
camera.rotateY(forge.pointerDamped.x * 0.04 * par)
camera.rotateX(forge.pointerDamped.y * 0.03 * par)
```

### 4.4 Key uniforms / params (expose all to the `?debug` leva panel)

| Param | Default | Meaning | Tune toward |
|---|---|---|---|
| `SAMPLES` | 240 | RMF/curvature field resolution | ↑ if banks read steppy on long curves |
| look-ahead `Δ` | 0.05 | how far down the flow the heading faces | smaller = tighter on the bend, less whip |
| `BANK_GAIN` | ~2.2 | radians of roll per unit curvature | the lean depth; the single most felt knob |
| `BANK_MAX` | ~0.35 rad (≈20°) | hard clamp on roll | keep ≤ ~25° or it reads as a barrel-roll toy |
| bank damp `λ` | 3.0 | how fast the lean settles | ↑ snappier, ↓ floatier |
| `ORIENT_LAMBDA` | 5.0 | quaternion slerp-damp rate | the master "weight" of the head; Brutalist Snap |
| pointer add | 0.04 / 0.03 | parallax yaw/pitch on top | a *whisper*; never competes with the bank |

### 4.5 How it hooks the shared master temperature / uniform system

The orientation is a **pure consumer** of the shared bus — it writes nothing new, so nothing downstream
changes, which is exactly why it's safe to drop into the existing rig:

- **One scroll signal drives everything.** `cam.t` is the damped `forge.scrollDamped` (doc 27); the
  bank's curvature is sampled at that same `cam.t`. So the frame the camera banks for is the frame whose
  pour-front the master temperature system (`uTemp`, `gw_forge`) is heating and whose channel SDF
  (cohesion §7 rule 8) is carved. **The camera leans into the very bend the molten front is rounding.**
- **`forge.scrollVel` couples lean to energy (optional, off by default).** A hard flick can add a touch
  of extra roll, the same `scrollVel` that surges the living veins and the bloom — motion and heat as one
  system. Start at gain 0; add only if the device read wants it.
- **The finale override shares the `range()` window.** If you slerp toward `FINALE_QUAT`, drive its
  weight from `range(forge.scrollDamped, 0.9, 0.1)` — the **same** window doc 28's dolly-zoom + focus
  rack use, so the descend-to-eye-level reveal's path-drop, fov-narrow, focus-rack, **and** the camera
  settling level on the cast word all land together (the Brutalist-Snap impact beat).
- **No new uniform, no new clock, no second rAF.** It runs inside the one `useFrame` after the existing
  position write; it touches only `camera.quaternion`. The master `U` pool (`forgeUniforms.js`) is
  untouched.

---

## 5. COHESION (shared palette / lighting / uniforms with the rest of the world)

- **One curve, consumed three ways (the binding contract §7.8).** The interlace curve is already the
  source of truth for channel geometry, pour flow, and camera position. This doc adds a fourth read of
  the **same** curve — its curvature — for the bank, guaranteeing the camera can never disagree with the
  channel about where the bend is or which way it turns.
- **One scroll clock, dt-damped (§7.6).** `cam.t = damp(scrollDamped)`; bank `= damp(...)`; orientation
  `= slerp(... , 1 - exp(-λ·dt))`. Every term is frame-rate-independent damping from the one store in the
  one `useFrame` — no `setInterval`, no `lerp(a,b,k)`, no spring, no second loop. Brutalist Snap, no
  bounce.
- **Palette / lighting untouched.** Orientation moves the eye; it adds no color, no light, no pass. The
  warm-forge palette (`palette.js`, HDR `>1` hot values that bloom), the metal-is-the-only-light model
  (§5), and the procedural cool-key env (no EXR, §5.3) are unchanged. The bank simply *reveals* the same
  lit world leaning into the turn — the divine-fire A/E spill, the basalt green-reveal, and the Ogham
  read exactly as authored, now from a banked vantage.
- **Per-route chambers stay authoritative.** This is the **home journey** orientation. On a route, the
  journey↔chamber blend (doc 27 §4c, `cam.blendW`) damps the *position* toward the chamber framing; the
  orientation slerps toward the chamber's look-at-the-slab-centre quaternion the same way — one slerp,
  one settle, travel not cut.
- **Degrades uniformly (§7.9).** A tier drop doesn't restructure the camera; it lowers the bank gain /
  freezes it, never recolors or re-rigs.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

- **Per-frame cost is negligible.** 2 curve samples (`getTangentAt`, `getPointAt`) + 1 array lookup for
  the RMF up + 1 for curvature + a cross/normalise + one quaternion compose + one slerp ≈ a few µs.
  **Zero render targets, zero new passes, zero per-frame allocation** (all scratch is module-level). This
  sits inside the ~2–3 ms "Camera/scroll JS + React + Lenis" line of the high-tier budget (cohesion §10)
  with room to spare — it does **not** compete with the slab fbm shader or the post chain for fill-rate.
- **The heavy math is build-time.** RMF + curvature precompute runs **once** at module load over 240
  samples (~sub-millisecond, off the hot path). The field is ~240 × 3 small arrays — trivial memory.
- **Tier behaviour (mirror `forge.quality`):**
  - **`high`** — full RMF up + curvature bank (`BANK_GAIN ≈ 2.2`, `BANK_MAX ≈ 20°`) + look-ahead +
    pointer parallax + finale override slerp.
  - **`low`** — same RMF up + bank, but **halve `BANK_GAIN`** and **drop pointer parallax** (`par`
    already gates it); raise `ORIENT_LAMBDA` slightly for a cheaper settle. Stable, just calmer.
  - **`static` / reduced-motion** — **no dynamics**: set `cam.t` once, sample the RMF up and the tangent,
    compose the quaternion **without** bank and **without** slerp (assign directly), pointer off
    (`par = 0`). A fixed, level, reverent pose down the flow — the dignified still floor.
- **iOS edge cases.** Clamp `cam.t ∈ [0,1]` before every sample (rubber-band can push scroll out of
  range → NaN basis). The slerp-damp naturally absorbs the stutter/jump of Lenis momentum and the
  scroll-reverse of a scrub — because the up-vector field is **precomputed** (not integrated live), a
  scrub backward returns to the *same* orientation (no hysteresis), which a live parallel-transport
  (technique D) would not.
- **No second scroll layer / no controller.** Native DOM scroll + Lenis-as-smoother is preserved (doc
  27); this doc adds no `CameraControls`, so the prerender/SEO DOM and the one-renderer rule stand.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls (each one is a real, shippable-looking bug):**
1. **`lookAt` with world-`+Y` up.** The flip generator. **Never** pass world-up on a path that nears
   vertical or doubles back; build the basis from the RMF up. (Technique A.)
2. **Frenet roll used raw.** `computeFrenetFrames` normal **flips sign at inflection points** → instant
   180° roll snap exactly between over- and under-strands of the knot. Use Frenet only as a *direction
   hint*, drive roll from the **signed-tangent-angle curvature** (4.2 step 4) instead. (Technique B.)
3. **Integrating the frame live against scroll.** Per-frame parallel-transport (technique D) **drifts**
   when scroll stutters/reverses (Lenis, rubber-band, scrub) — the up-vector won't return on scrub-back.
   **Precompute on the monotonic build index; sample by `t` live.** The most important call here.
4. **Look-ahead too large.** Big `Δ` → the heading whips through a hairpin. Keep `Δ ≈ 0.04–0.06` *and*
   slerp-damp the result; never `lookAt` a raw far-ahead sample on a bend. (Doc 27 pitfall 4.)
5. **Unclamped / undamped bank.** A raw curvature spike slams the roll to the clamp in one frame (reads
   as a flick/jerk). **Damp** the bank (λ≈3) and **clamp** it (≤ ~25°); the lean must *settle into* the
   turn, Brutalist-Snap.
6. **Euler/`lerp` on rotation.** Lerping Euler angles or two `lookAt` rotations across a bend takes the
   wrong (non-great-circle) path and can flip. **Always slerp the quaternion.** (2025 forum consensus.)
7. **Slerp-damp not frame-rate-independent.** `slerp(target, 0.1)` is FPS-dependent (faster phones swim).
   Use `1 - exp(-λ·dt)` (or `maath.dampQ`). Matches the `damp()` idiom already in `store.js`.
8. **Pointer parallax fighting the bank.** Apply pointer yaw/pitch as a tiny **add after** the slerp,
   gated by `par`; if it's part of the target quaternion it modulates the bank and reads mushy.
9. **Allocating in `useFrame`.** New `Vector3`/`Quaternion` per frame → GC stutter on the throttling
   phone. All scratch is module-level (4.3).
10. **Forgetting reduced-motion.** No static-tier branch = inaccessible + seasick. The level fixed pose
    is mandatory.

**Order of operations (each step verified the repo way — `npm run build` green → `qa-route` at 393×852 +
1440×900, 0 console errors → then the iPhone-15 OLED read; whip/flip/seasickness do **not** simulate
headless):**
1. **Land doc 27 first** (position from `JOURNEY.getPointAt(cam.t)`, Lenis, one rAF). The bank is
   meaningless without the curve travel under it.
2. **Build the RMF field** (`journeyFrames.js`) and *visualise it* in `?debug` (draw the up-vectors as
   little lines along the curve, or temporarily color-map curvature). Confirm the up-vector is **smooth
   and never flips** through every interlace bend before touching the camera. This is the make-or-break
   verification.
3. **Swap `lookAt` → RMF basis + slerp-damp, bank gain = 0.** Confirm heading follows the flow, *no
   flip*, *no whip*, settles with no bounce. This alone should already beat the baseline.
4. **Dial in the bank** (`BANK_GAIN`, `BANK_MAX`, bank λ) on desktop in `?debug` until the camera leans
   into each bend with weight and *out* of it cleanly — no barrel-roll, no late lean.
5. **Add the look-ahead `Δ`** and tune small; verify the eye anticipates the bend without whipping.
6. **Wire the finale override slerp** on the shared `range(scrollDamped, 0.9, 0.1)` window so the
   descend-reveal (doc 28) and the level-on-the-word settle land together.
7. **Tier-gate** (low: halve bank, drop pointer; static: no dynamics, fixed pose). Verify reduced-motion.
8. **iPhone-15 OLED read** with `qa-route`/`tune-pacing`: bank reads cinematic not nauseating, no flip at
   any scroll position, scrub-back returns to the same pose, clamp holds at scroll extremes, 60fps.

---

## 8. SOURCES (2025–2026)

1. **three.js forum — "Camera banking on a curved path"** (Questions thread, current/active 2025).
   The canonical statement of the problem (camera following track angle / banking in corners) and the
   community fixes — tangent + bank axis, slerp, damping. https://discourse.threejs.org/t/camera-banking-on-a-curved-path/48410
2. **three.js forum — "Camera animation with quaternion travels undesired path"** (Questions, 2025).
   Why tweening between orientations whips, and that **slerp** (great-circle interpolation) is the fix;
   the "never Euler/lookAt-tween across bends" consensus. https://discourse.threejs.org/t/camera-animation-with-quaternion-travels-undesired-path/41147
3. **pmndrs/maath — README + `easing` module** (GitHub, maintained 2025). Refresh-rate-independent,
   interruptible, shortest-path damping primitives incl. **`dampQ` (Quaternion)** and **`dampE` (Euler,
   shortest path)**, based on Unity SmoothDamp (Game Programming Gems 4 §1.10) — the slerp-damp settle
   stage. https://github.com/pmndrs/maath · https://github.com/pmndrs/maath/blob/main/README.md
4. **Dipankar Paul — "Mastering Camera Movement in Three.js"** (blog, Jan 2026). Smooth camera movement
   with quaternions/slerp + damping; the practical "`lerp` ≈ 0.1, higher feels jittery" guidance and
   damped-settle-for-natural-feel rules this rig follows. https://blog.iamdipankarpaul.com/mastering-camera-movement-in-threejs
5. **Entagma — "TD Essentials: Parallel Transport"** (referenced in 2025 RMF roundups). Parallel-transport
   / rotation-minimizing frame as the flip-free alternative to Frenet for orienting along a curve — the
   conceptual basis of §4.2. https://entagma.com/td-fundamentals-parallel-transport/
6. **Guido Maciocci — "Lockdown Geometry: Rotation Minimizing Frames"** (Medium / *Intuition*, 2025
   re-surface). Plain-language RMF + the **double-reflection** method (Wang et al.), why Frenet flips at
   inflections, and that double-reflection is the production standard (Houdini `slideframe()`). https://medium.com/intuition/lockdown-geometry-rotation-minimizing-frames-ff373d2f355b
7. **Digital Strategy Force — "What Are Camera Spline Paths and How Do They Work in 3D Web Design"**
   (2025). Modern web-3D framing of spline cameras: face the direction of travel, **look-ahead delta**,
   smoothing that prevents jitter on tight curves, **quaternion rotations for smooth orientation**, and
   cross-device perf profiling. https://digitalstrategyforce.com/journal/what-are-camera-spline-paths-and-how-do-they-work-in-3d-web-design/
8. **three.js docs — `Curve.computeFrenetFrames` / `getTangentAt` / `Quaternion.slerp` / `setFromUnitVectors`**
   (r17x, current 2025–2026). Frenet frame API (tangent/normal/binormal, initial-normal-from-smallest-
   tangent-component, closed-seam correction), arc-length tangent, great-circle slerp, and minimal
   rotation between unit vectors — the exact primitives used in §4. https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3 · https://threejs.org/docs/#api/en/math/Quaternion.slerp
9. **yomotsu/camera-controls** (GitHub, maintained 2025). Production camera controller with **SmoothDamp**
   damped transitions — evaluated as the controller alternative (rejected: it owns the camera and fights a
   scroll-scrubbed path rig), and the reference for the damped-settle feel. https://github.com/yomotsu/camera-controls
10. **Sudeepto Bose — "Basic 3D camera movement with React Three Fiber and the maath library"** (Medium,
    2025). `easing.damp3` for position and **`dampE` targeting camera rotation** for smooth rotational
    transitions in the r3f `useFrame` loop — the r3f-idiomatic damped-orientation pattern. https://sudeeptobose.medium.com/basic-3d-camera-movement-with-react-three-fiber-and-maath-library-4b060bfe7c5c

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Curvature-from-the-pour-front, not the static curve.** Bind the bank's curvature/look-ahead to the
   *actual* molten pour-front shared uniform (`uPourFront`) as it advances through the letters, so the
   camera banks for where the metal *is* this instant, not a fixed curve offset — the strongest "it's
   alive" coupling (parallels doc 27 §9.4 / doc 28 §9.1).
2. **Bank-amount as an act-pacing function.** Modulate `BANK_GAIN` per act (lean hard through transit
   channels, level and reverent on Ignition / the cast-word finale) via the `tune-pacing` HOLD/EASE
   curves — the bank as a narrative dial, not a constant.
3. **Authored-quaternion override grammar (Theatre-free).** A small per-beat `{t, quat, weight}` table
   slerped over the RMF base, with a principled blend window per beat, so any route finale can fire a
   consistent "monumental settle" — the orientation twin of doc 28's descend-reveal primitive.
4. **Roll-coupled motion-blur / lens cues.** Tie a whisper of directional blur or the anamorphic
   horizontal-bokeh stretch (doc 28 §9.4) to the live bank angle so a hard lean reads with optical weight
   — measured against the iPhone-15 budget, warm-only, on-brand.
