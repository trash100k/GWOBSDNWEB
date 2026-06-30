# 27 — Scroll-Driven Camera Path Through the Forge

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer (r3f / three.js), warm-forge palette. Topic: the continuous, scroll-linked camera **journey** that follows the metal down the channels — curve paths, Lenis, damping, look-at targets, per-route framing. **Travel, not cuts.**_

---

## 1. SCOPE

The camera is the audience's body inside the GAELWORX forge. The world is one cohesive space — a stone **altar** pours living molten metal, it runs through **Celtic-interlace channels** carved in green-black basalt, **fills the GAELWORX letterforms** left-to-right, each letter **cools** through the temperature gradient, the **A** and **E** keep divine white-gold fire and light the **Ogham** on the adjacent stone. The job of this element is to **move through that space as one unbroken travel shot**, locked to the user's scroll, so the experience reads like a single Unreal-cinematic camera move (Lusion / Unseen Studio caliber), never a slideshow of cuts.

Two layers of "camera" exist in this build and must not be confused:

1. **The home journey** — `/` scroll-jacks through the **six acts of the forging** already declared in `store.js` (`ACTS`: Ignition → The Core → The Draw → The Clan → The Arsenal → Point the Sword). This is the cinematic flythrough that *follows the pour front down the channel*.
2. **The per-route framing** — eight route "chambers" (`scenes.js`: scrying-pool, casting-room, channel-hall, jewel-chamber, altar-approach, stone-ledger, four-plinths, forge-mouth). Navigating between routes must also **travel**, orbiting/dolly-ing the single slab to face the new chamber — never a hard teleport.

The current code is a **placeholder**: `CameraRig.jsx` does a flat dolly-in (`z = cam.z - forge.scrollDamped * 0.7`) plus cursor parallax, and route framing is a damped orbit (`cam.ang`, `cam.z` toward `sceneFor(route)`). `forge.scroll` (0..1) and `forge.scrollDamped` already exist and are already consumed by the obsidian veins. There is **no curve, no path, no look-ahead, and no Lenis instance yet** (`forge.lenis` is declared `null`). This doc specifies the upgrade from "dolly + orbit" to a **true CatmullRom path camera following the metal**, while preserving every shared-uniform hook the rest of the world already reads.

The hard requirement is **continuity**: position and look-at must be C¹-smooth across the whole scroll range and across route changes, the input must be momentum-smoothed (Lenis), and the per-frame motion must obey the brand **Brutalist Snap / Forge Reveal** laws — high-momentum easing, no bounce, impact on arrival.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable modern approach to scroll-linked camera travel in r3f, with tradeoffs against quality / perf / mobile / complexity.

### A. drei `<ScrollControls>` + `useScroll` (the framework path)
drei mounts an invisible HTML scroll container in front of the canvas; `useScroll()` returns a **dampened** `offset` (0..1), `delta`, `range(from,distance,margin)`, `curve()`, and `visible()` helpers, and `<ScrollControls damping={4} pages={n} distance={1}>` controls friction and travel. You drive the camera in `useFrame` from `data.offset`. (drei `ScrollControls.tsx`, docs current 2025–2026.)
- **Quality:** Good. The `range`/`curve` helpers make act-segmentation trivial.
- **Perf:** Excellent — pure DOM scroll + a damp; no extra render.
- **Mobile:** Good, but it **owns** the scroll container and the DOM `<Scroll html>` overlay, which fights a custom React Router + prerendered static-HTML SPA like GAELWORX (the SEO/AEO skills depend on real page DOM). Adopting it would mean restructuring page layout around drei's container.
- **Complexity:** Low to start, **high to retrofit** into this app's routing/prerender model.

### B. **Lenis** (manual instance) + custom rig reading `forge.scroll` (the studio path)
Lenis 1.3.x is the de-facto 2025–2026 smooth-scroll layer (darkroomengineering, v1.3.25). You keep the **native page scroll and real DOM** (so prerender/SEO survive), and Lenis only *smooths* it. The `scroll` event payload exposes `{ scroll, limit, velocity, progress (0..1), direction }`. You write `progress` into `forge.scroll` and let `CameraRig` damp + sample a curve in `useFrame`. Drive Lenis from the r3f loop (`lenis.raf(time*1000)` inside `useFrame`, `autoRaf:false`) so there is **one** rAF, not two competing ones.
- **Quality:** Excellent — Lenis momentum + a second damping stage in the rig gives buttery, weighty travel.
- **Perf:** Excellent. One library, one rAF, no extra render targets.
- **Mobile:** Strong with `syncTouch:true` (the 1.x replacement for `smoothTouch`); native DOM means iOS scroll physics are respected and the prerendered HTML stays intact.
- **Complexity:** Medium. **This is the cohesive fit** — it matches the existing `forge.scroll`/`scrollDamped`/`scrollVel` design exactly; `forge.lenis` is already reserved for it.

### C. CatmullRomCurve3 sampled path (`getPointAt`/`getTangentAt`) — the *travel* itself
Independent of the input layer: define the forge journey as a `THREE.CatmullRomCurve3` of control points (the altar, each channel bend, the letter row, the finale). Per frame, `curve.getPointAt(t)` gives the arc-length-parameterised position and a second sample `getPointAt(t + lookAhead)` (or `getTangentAt(t)`) gives the look-at target so the camera always faces *down the flow*. Arc-length param (`getPointAt`, not `getPoint`) keeps **velocity uniform** so the metal and camera stay in lock-step regardless of uneven control-point spacing. The 2025 **Atmos / Wawa Sensei** rebuild and multiple three.js-forum 2025 threads use exactly this — `getPointAt(t)` for position, an offset sample for `lookAt`, smoothed around bends. (Wawa Sensei "Recreating Atmos", 2025.)
- **Quality:** Excellent — this is what makes it "travel, not cuts." Tangent-following look-at sells the journey.
- **Perf:** Excellent — curve sampling is a handful of vector ops; precompute arc lengths once (`curve.getLengths()` / `updateArcLengths()`).
- **Mobile:** Excellent.
- **Complexity:** Medium — the art is authoring control points + a banked look-at that doesn't whip on tight Celtic-interlace bends.

### D. Theatre.js keyframed camera scrubbed by scroll
Theatre.js stores a keyframed camera animation; scroll scrubs the playhead. (Codrops Theatre.js flythrough — canonical, predates 2025; covered in 2025–2026 roundups.)
- **Quality:** High, with a visual editor for timing.
- **Perf:** Good, but adds a studio/runtime dependency and a second animation authority that would fight the `forge` store + damping model already in place.
- **Mobile/Complexity:** Editor is desktop-only; runtime is fine. Overkill here and **off-pattern** — GAELWORX drives motion from one shared mutable store, not a timeline runtime.

### E. GSAP ScrollTrigger driving camera props
GSAP ScrollTrigger + Lenis is a heavily-documented 2026 combo (DevDreaming "Smooth Scrolling in Next.js with Lenis & GSAP", 2026 guide; Wawa Sensei GSAP scroll). Tweens camera `position`/quaternion on scroll progress.
- **Quality:** High, excellent easing control.
- **Perf:** Good; another lib in the bundle.
- **Mobile:** Good with Lenis. **Redundant** for us — our damping/`damp()` model already provides frame-rate-independent easing without GSAP's footprint. Worth it only if we need named, designer-tunable tween timelines.

### F. TSL / WebGPU camera path (the future lane)
In r182+ WebGPU/TSL you can compute path/uniform work in node graphs; Maxime Heckel's 2025 TSL/WebGPU field-guide era documents the node pipeline. The camera math is unchanged (it's CPU-side three.js), so TSL buys nothing for *camera path* specifically — its win is shaders. iOS WebGPU is still uneven in 2025–2026.
- **Verdict:** Not for the camera. Right lane for materials later, wrong tool for this element now.

### G. `r3f-scroll-rig` (14islands)
A production scroll-rig syncing DOM and 3D (14islands, maintained through 2025).
- **Quality/Perf:** High; battle-tested on agency sites.
- **Fit:** It's a *DOM-tracking* rig (sticky 3D elements behind DOM blocks). GAELWORX is a **fullscreen single-slab world**, not DOM-tracked 3D tiles, so the rig's core value (per-element viewport tracking) is unused. Over-tooled.

**Landscape verdict:** the journey is **B + C** — Lenis for input smoothing into `forge.scroll`, a CatmullRomCurve3 sampled in `CameraRig` for the travel + look-ahead, with the existing `damp()` as the final smoothing stage. A/D/E/F/G each solve a problem we don't have or impose a model that fights this app's prerender + single-store architecture.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Drive the camera along a `THREE.CatmullRomCurve3` "forge journey" sampled by arc length in `CameraRig.jsx`, where the path parameter `t` is `forge.scrollDamped`; feed `forge.scroll` from a single manually-rAF'd Lenis instance (stored on `forge.lenis`); look-at a second curve sample (look-ahead along the flow) blended into a per-act focus target; and on route change, blend the journey camera toward the chamber's `sceneFor(route)` framing instead of teleporting.**

Justification against the world + the existing code:

- **It is the literal brief — "travel not cuts."** Position from `getPointAt(t)` + look-at from `getPointAt(t+Δ)` is the canonical way to make a camera *follow the pour down the channel* and bank into the Celtic-interlace bends. Arc-length sampling keeps the camera in lock-step with the metal's left-to-right letter fill.
- **It reuses the store contract verbatim.** `forge.scroll` (0..1), `forge.scrollDamped`, `forge.scrollVel`, and the `ACTS` table already exist and are already what the obsidian veins read. The rig already computes `scrollVel`/`scrollDamped` per frame (`CameraRig.jsx:23–26`); we keep that and only change what consumes `scrollDamped` (a curve instead of a flat dolly).
- **Lenis was pre-reserved.** `forge.lenis = null` in `store.js` is a placeholder for exactly this. Manual `raf` inside `useFrame` keeps the **one-renderer / one-loop** rule the `forge-scene` skill enforces.
- **Per-route framing already has a home.** `scenes.js` `camZ`/`rotY`/`rotX` per route is the chamber framing; the rig already damps `cam.z`/`cam.ang` toward it. We keep that as the **route blend target** and cross-fade it with the journey position so navigation *travels* (orbit + dolly) rather than cuts.
- **Brand motion compliance.** The final `damp()` stage (frame-rate-independent, `THREE.MathUtils.damp`) gives high-momentum easing with **no overshoot/bounce** — exactly Brutalist Snap. No spring, no elastic.
- **Mobile-safe.** No extra render targets, no transmission, no second rAF; curve sampling is trivial; Lenis `syncTouch` + a reduced-motion fallback (below) keep the iPhone-15 budget.

---

## 4. IMPLEMENTATION

### Libraries / versions
- `lenis` **1.3.x** (current 1.3.25) — `npm i lenis`. Use the raw class, not `@studio-freight/lenis` (renamed) and **not** `ReactLenis` autoRaf (we drive raf from r3f).
- `three` r17x (already in repo), `@react-three/fiber`, `@react-three/drei` (already in repo for `Environment`/`AdaptiveDpr`). **No new heavy deps.**

### 4a. Lenis input layer — one instance, one rAF

A tiny hook mounted once (e.g. in `App.jsx` or `ForgeCanvas`'s parent). It does **not** call its own `requestAnimationFrame`; `CameraRig` pumps it from `useFrame` so there is a single loop.

```js
// src/scroll/useLenis.js
import { useEffect } from 'react'
import Lenis from 'lenis'
import { forge } from '../store.js'

export function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { forge.lenis = null; return }      // native scroll, no smoothing
    const lenis = new Lenis({
      lerp: 0.1,            // momentum weight (lower = heavier/slower)
      smoothWheel: true,
      syncTouch: true,      // 1.x replacement for smoothTouch — required on touch
      autoRaf: false,       // we drive raf from useFrame (single loop)
    })
    lenis.on('scroll', ({ progress }) => { forge.scroll = progress }) // 0..1
    forge.lenis = lenis
    return () => { lenis.destroy(); forge.lenis = null }
  }, [])
}
```

### 4b. The forge journey curve

Control points trace the world: altar → channel bends (Celtic interlace) → the letter row (left→right) → finale arch. Author them so the **act `at` values in `store.js` land on the visually-right control points**. Build once, memoised, arc-length-parameterised.

```js
// src/scene/journey.js
import * as THREE from 'three'
const V = (x, y, z) => new THREE.Vector3(x, y, z)

// camera path through the forge (world units; tune in ?debug)
export const JOURNEY = new THREE.CatmullRomCurve3([
  V( 0.0,  2.4,  7.0),  // 0.00 Ignition — wide on the altar
  V(-1.2,  1.1,  5.2),  // ~0.08 The Core — drop toward the pour
  V( 1.6,  0.2,  3.4),  // ~0.32 The Draw — bank into the first interlace bend
  V(-1.8, -0.4,  2.0),  // ~0.55 The Clan — second bend, channels rejoin
  V( 0.6, -0.2,  1.2),  // ~0.74 The Arsenal — skim the filling letter row
  V( 0.0,  0.6,  4.4),  // ~0.95 Point the Sword — pull back, finale arch
], false, 'catmullrom', 0.5 /* centripetal tension — no cusps on tight bends */)
JOURNEY.updateArcLengths()

// look-at path: slightly ahead + lower, so we always face DOWN the flow
export const FOCUS = new THREE.CatmullRomCurve3([
  V( 0.0,  1.4,  3.0), V(-0.6,  0.4,  2.4), V( 0.8, -0.3,  1.0),
  V(-0.7, -0.6,  0.2), V( 0.3, -0.4, -0.6), V( 0.0,  0.0, -1.0),
], false, 'catmullrom', 0.5)
FOCUS.updateArcLengths()
```

`'catmullrom'` type with **centripetal** tension (0.5) is the documented cure for cusps/loops on closely-spaced control points (tight interlace bends) — it prevents the camera whipping or self-intersecting the path.

### 4c. The rig — replace the flat dolly with curve sampling + route blend

```jsx
// src/scene/CameraRig.jsx (revised core)
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, damp } from '../store.js'
import { sceneFor } from './scenes.js'
import { JOURNEY, FOCUS } from './journey.js'

const pos = new THREE.Vector3()
const look = new THREE.Vector3()
const route = new THREE.Vector3()
const cam = { z: 6.4, ang: 0, t: 0 }
let prevScroll = 0

export default function CameraRig() {
  const { camera } = useThree()

  useFrame((state, dt) => {
    // 0) pump Lenis from the single loop (ms timestamp)
    if (forge.lenis) forge.lenis.raf(state.clock.elapsedTime * 1000)

    // 1) scroll energy + damped scroll (unchanged contract the veins read)
    const inst = dt > 0 ? Math.min(Math.abs(forge.scroll - prevScroll) / dt, 2.0) : 0
    prevScroll = forge.scroll
    forge.scrollVel = damp(forge.scrollVel, inst, 8, dt)
    forge.scrollDamped = damp(forge.scrollDamped, forge.scroll, 6, dt)
    forge.pointerDamped.x = damp(forge.pointerDamped.x, forge.pointer.x, 5, dt)
    forge.pointerDamped.y = damp(forge.pointerDamped.y, forge.pointer.y, 5, dt)

    const par = forge.quality === 'static' ? 0 : 1
    const onHome = forge.route === '/'

    // 2) THE JOURNEY (home): sample the curve by arc-length at damped scroll
    cam.t = damp(cam.t, THREE.MathUtils.clamp(forge.scrollDamped, 0, 1), 4, dt)
    JOURNEY.getPointAt(cam.t, pos)
    const lookAhead = THREE.MathUtils.clamp(cam.t + 0.06, 0, 1)
    FOCUS.getPointAt(lookAhead, look)

    // 3) THE CHAMBER (route): orbit+dolly framing from scenes.js
    const sc = sceneFor(forge.route)
    cam.z = damp(cam.z, sc.camZ, 2.2, dt)
    cam.ang = damp(cam.ang, sc.rotY, 2.2, dt)
    route.set(Math.sin(cam.ang) * cam.z, 0, Math.cos(cam.ang) * cam.z)

    // 4) BLEND journey <-> chamber so navigation TRAVELS, not cuts.
    //    On home, mostly journey; off home, mostly chamber framing.
    const w = damp(cam.blendW ?? (onHome ? 0 : 1), onHome ? 0 : 1, 2.0, dt)
    cam.blendW = w
    pos.lerp(route, w)
    // chamber look-at is the slab centre; blend toward it off-home
    look.lerp(new THREE.Vector3(0, 0, 0), w)

    // 5) cursor parallax (kept), then snap-damp the camera (no bounce)
    pos.x += forge.pointerDamped.x * 0.5 * par
    pos.y += forge.pointerDamped.y * 0.34 * par
    camera.position.lerp(pos, 1 - Math.pow(0.0001, dt))
    look.y += forge.pointerDamped.y * 0.12 * par
    camera.lookAt(look)
  })

  return null
}
```

### Key params / uniforms
- `lerp:0.1` (Lenis momentum), `cam.t` damp `4` (path follow weight), `scrollDamped` damp `6` (unchanged), route blend damp `2.0`, position `lerp(1 - 0.0001^dt)` (the existing Brutalist-snap term).
- `lookAhead = +0.06` — how far down the flow the camera faces; bigger = more anticipatory/cinematic, smaller = tighter on the current letter.
- Centripetal tension `0.5` on both curves.

### How it hooks the shared master temperature system
The rig is already the **author** of the signals the temperature/material system reads — it must keep writing them so nothing downstream changes:
- `forge.scrollDamped` → obsidian `uTemp`/`uVeinGlow` ramp (`ObsidianSlab.jsx:155,159`) and any letter-fill / pour-front progress. The journey *reads* the same value it writes, so **camera position and metal temperature advance together** — scroll to act 5 and the camera is at the letter row *and* the metal is hottest. That is the cohesion lock.
- `forge.scrollVel` → the living-veins flare + heat-shimmer strength. Flicking the scroll surges the forge *and* accelerates the travel, so motion and heat are one system.
- `forge.strikeAt` (act/headline arrival) can also pulse on **act boundaries** (when `actIndexFor(scrollDamped)` increments) so the obsidian surges as the camera "arrives" at each act — Brutalist-Snap impact, shared across slab + sparks + bloom.

Expose `cam.t`, `lookAhead`, and the six control points to the `?debug` leva panel (the project's live-tuning convention) so the path is authored visually, not guessed.

---

## 5. COHESION

- **One store, one loop.** Lenis is pumped *inside* `useFrame`; the rig stays the single per-frame driver. No second rAF, no competing animation authority. Matches the `forge-scene` single-renderer rule.
- **Shared scroll contract.** Position, look-at, vein glow, temperature, shimmer, sparks, and act state are all functions of `forge.scrollDamped`/`scrollVel`. Nothing reads a private scroll value — so the camera can never disagree with the metal about "how far through the forging we are."
- **Palette/lighting untouched by the camera.** The rig moves the eye; the warm-forge palette (`palette.js`, the HDR `>1` hot values that bloom) and the neutral-cool environment reflections (`ForgeCanvas`) are unchanged. Travel reveals the *same* lit world from new angles.
- **Per-route chambers stay authoritative.** `scenes.js` remains the source of truth for chamber framing; the journey blend just means *moving between chambers is a travel shot*, consistent with "route-swapped per-page chambers, travel not cuts."
- **Brand motion.** `damp()` everywhere → high-momentum, no bounce (Brutalist Snap); the blur-to-sharp Forge Reveal of incoming copy is timed off the same `scrollDamped`/act signals.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Cost:** curve sampling is ~4 `getPointAt`/`getTangentAt` + a few `lerp`/`damp` per frame — negligible vs. the obsidian shader. **No render targets, no extra passes.** Lenis is one lib pumped by the existing loop.
- **Touch:** `syncTouch:true` is mandatory on touch (1.x replacement for `smoothTouch`); keep `gestureOrientation:'vertical'`. Test that iOS rubber-band at scroll extremes doesn't push `forge.scroll` past [0,1] — clamp `cam.t` (done above).
- **Quality tiers (mirror `forge.quality`):**
  - `high`: full journey curve + look-ahead + cursor parallax.
  - `low`: same path, **disable cursor parallax** (`par` already gates it) and raise damp lambdas slightly for cheaper settle; consider `lerp:0.12`.
  - `static` / **reduced-motion**: **`forge.lenis = null`** (native scroll), camera reads `forge.scrollDamped` mapped to the curve with *no* parallax (`par=0`, already handled). The page still tells the story on scroll, just without momentum smoothing — accessible and cheap. This is the required fallback.
- **No second scroll layer.** Because we keep native DOM scroll (Lenis only smooths it), the prerendered static HTML + SEO/AEO DOM survives — unlike drei `ScrollControls`, which would hide content behind its own container.
- **Frameloop:** stays `'always'` except `static` (`'demand'`), unchanged from `ForgeCanvas`.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Two rAF loops.** If Lenis runs `autoRaf:true` *and* r3f runs its loop, scroll and render desync and jitter. Fix: `autoRaf:false`, pump `lenis.raf()` from `useFrame` (done above).
2. **`getPoint` vs `getPointAt`.** `getPoint(t)` is *not* arc-length — uneven control spacing makes the camera speed up/slow down between points and break lock-step with the metal. Always `getPointAt` + `updateArcLengths()`.
3. **Cusps/whip on tight interlace bends.** Closely-spaced control points with uniform Catmull-Rom loop or kink. Use **centripetal** (`'catmullrom'`, tension 0.5).
4. **Look-at whip / gimbal at bends.** Sampling look-at *too far* ahead snaps direction at corners. Keep `lookAhead` small (~0.05–0.08) and **damp the look-at target**, not just the position; never `lookAt` a raw curve sample on a sharp bend without smoothing.
5. **Route cut instead of travel.** Snapping `camera.position` to `sceneFor(route)` on navigation reads as a hard cut. Always **blend** journey↔chamber with a damped weight (the `cam.blendW` term).
6. **Reduced-motion / SEO regressions.** Forgetting the `prefers-reduced-motion` branch (no Lenis) breaks accessibility; adopting drei `ScrollControls` would hide the prerendered DOM and break AEO. Keep native DOM + Lenis-as-smoother.
7. **Scroll out of range on iOS.** Rubber-band can push `progress` slightly outside [0,1]; clamp before `getPointAt` (throws/NaNs otherwise).
8. **Pumping Lenis with seconds.** `lenis.raf()` wants **milliseconds**; pass `elapsedTime * 1000`.

**Order of operations**
1. Add `lenis` dep; mount `useLenis()` once; confirm `forge.scroll` (0..1) moves on scroll and `prefers-reduced-motion` leaves it native. Verify **one** rAF.
2. Author `JOURNEY` + `FOCUS` curves; expose control points + `lookAhead` + `cam.t` damp to `?debug` leva.
3. Replace the flat dolly in `CameraRig` with `getPointAt(cam.t)` position + `FOCUS.getPointAt(t+Δ)` look-at. Tune on desktop until the travel follows the pour and banks the bends without whip.
4. Land the six `ACTS.at` values on the right control points so headline/act reveals fire at the right camera beats (`actIndexFor`).
5. Add the journey↔chamber **blend** for route changes; verify nav *travels* (orbit+dolly), never cuts.
6. Wire act-boundary `strikeAt` pulse so the obsidian surges on arrival (shared system).
7. QA at the two judge viewports (iPhone-15 + desktop) with the `qa-route`/`tune-pacing` skills: zero console errors, canvas alive, Lenis active, no seasickness, scroll [0,1] clamped, reduced-motion path works.

---

## 8. SOURCES (2025–2026)

- **darkroomengineering/lenis — README / API (v1.3.25)**, GitHub, current 2025–2026 — constructor options (`lerp`, `duration`, `smoothWheel`, `syncTouch`, `autoRaf`), manual `raf(time)` loop, `scroll` event payload (`scroll/limit/velocity/progress/direction`). https://github.com/darkroomengineering/lenis/blob/main/README.md
- **Wawa Sensei — "Recreating Atmos 3D Website with React Three Fiber, Part 1: Curved Path"**, 2025 — CatmullRomCurve3 path, `getPointAt(t)` scroll mapping, look-at via offset sample, camera-follows-curve. https://wawasensei.dev/tuto/recreating-atmos-3d-website-with-react-three-fiber-part-1-curved-path
- **Codrops — "Creating Wavy Infinite Carousels in React Three Fiber with GLSL Shaders"**, 26 Nov 2025 — Lenis wheel-velocity driving scroll-linked motion in r3f, modern integration pattern. https://tympanus.net/codrops/2025/11/26/creating-wavy-infinite-carousels-in-react-three-fiber-with-glsl-shaders/
- **DevDreaming (CodeBucks) — "Smooth Scrolling in Next.js with Lenis & GSAP (2026 Guide)"**, 2026 — Lenis 1.3.x + React integration, lerp guidance, reduced-motion, driving scroll-linked animation. https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap
- **pmndrs/drei — `ScrollControls` source + docs (`useScroll`: `offset/delta/range/curve/visible`, `damping`)**, current 2025–2026 — the framework alternative + its damping/range model. https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx · http://drei.docs.pmnd.rs/controls/scroll-controls
- **three.js docs — `CatmullRomCurve3` (`getPointAt`, `getTangentAt`, arc-length, centripetal type)**, r17x, current 2025–2026 — arc-length parameterisation + tangent look-at + cusp-free centripetal curves. https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3
- **CreativeDevJobs — "Best Three.js Websites & Portfolio Examples (2026)"**, 2026 — survey of scroll-driven r3f journeys (Monolith 13-scene scroll story, FWA/Awwwards winners) confirming "travel not cuts" as the 2026 bar. https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025
- **14islands/r3f-scroll-rig**, maintained through 2025 — production scroll-rig reference (evaluated, not adopted). https://github.com/14islands/r3f-scroll-rig

---

## 9. DEEP-DIVE CANDIDATES

1. **Banked look-at & roll on Celtic-interlace bends** — quaternion-slerp framing (or a Frenet/parallel-transport frame) so the camera *leans into* tight channel turns without whip or gimbal, instead of raw `lookAt`. The single highest-risk quality detail.
2. **Act-segmented pacing curves (HOLD/EASE per act)** — mapping `forge.scroll` through per-act easing (`drei useScroll.range`-style) so the camera *dwells* on Ignition/The Arsenal and accelerates through transit channels — the `tune-pacing` skill's exact remit, applied to the path parameter.
3. **Journey ↔ chamber blend grammar** — a principled cross-fade (and possibly a shared anchor pose per route) so every route entry is a deliberate travel move with consistent direction/duration, not an ad-hoc lerp weight.
4. **Pour-front-locked camera coupling** — binding `lookAhead`/focus to the *actual* metal pour-front position (shared uniform) rather than a fixed curve offset, so the camera literally chases the molten front as it fills the letters.
