---
name: forge-scene
description: >-
  Build or tune a per-route 3D "wonderland" in the GAELWORX obsidian forge —
  add/adjust a route's scene, change veins/iridescence/camera framing, or add
  bespoke 3D elements, all within the perf budget. Use when the user wants a page
  to have its own 3D world, the scene looks wrong/dark/janky on a route, or you're
  wiring 3D for a new route. Encodes the single-renderer rule, dt-damped route
  swaps, the quality tiers, and the hard-won WebGL gotchas (no EXR, decoupled
  Suspense, dispose on unmount).
---

# forge-scene — one forge, a different world per route

**There is exactly ONE WebGL renderer** (`src/scene/ForgeCanvas.jsx`), mounted app-shell-level
and **lazy + idle-deferred** (`src/ForgeExperience.jsx:42-47`, `React.lazy` + `requestIdleCallback`)
so content paints first. Every page is a **different configuration of the same forge**, not a new
canvas. Never add a second `<Canvas>`/context — it blows the budget and the LCP.

## How a route becomes its own world
A route's look is a **preset row** in `src/scene/scenes.js` (`SCENES`):
`{ veinScale, veinGlow, irid, camZ, rotY, rotX }`. On nav, `forge.route` is set
(`ForgeExperience.jsx:53`) and the scene **damps toward the new preset** — it doesn't cut:
- `src/scene/ObsidianSlab.jsx:146-151` — `sceneFor(forge.route)` → `damp(uIrid/uVeinScale/uVeinGlow, …, λ≈2.4, dt)`.
- `src/scene/CameraRig.jsx:25-27` — `damp(cam.z→camZ, cam.ang→rotY, λ≈2.2, dt)`.

**To give a route its own world (cheap, preferred):** add/edit its `SCENES` row. Keep `/` exactly
as-is (it's the locked baseline). Bigger `veinScale` = denser veins; higher `irid` = more
play-of-color; `camZ`/`rotY` re-frame so the forge "turns to face" the page. That's the whole move
for most pages.

**For bespoke elements** (a route-specific mesh/shader): add it inside `ForgeCanvas`, gate it by
`forge.route`, reuse `PAL` (`src/scene/palette.js`, the 60/30/10 warm set) and `GLSL_NOISE`
(`src/scene/shaders.js`), and **dispose geometry/material on unmount** (pattern:
`ObsidianSlab.jsx:133` `useEffect(() => () => material.dispose(), …)`).

## Non-negotiables (perf + the WebGL scars)
- **dt-correct damping only.** Animate via `forge.*` (`src/store.js`) read in the existing
  `useFrame`/rAF, smoothed with `damp(cur,tgt,λ,dt)` = `THREE.MathUtils.damp` (`store.js:49`).
  Never frame-rate-dependent `lerp(a,b,k)`; never a competing rAF/`setInterval`.
- **Quality tiers respected.** `useQuality` (`src/hooks.js:14`) → `high|low|static`; `static` under
  `prefers-reduced-motion`. `ForgeCanvas` sets `dpr` per tier, `frameloop='demand'` when static,
  gates `Effects`; `AdaptiveDpr` is on. Freeze time on static (`uTime` pattern,
  `ObsidianSlab.jsx:144`, `Embers.jsx:67`). Honor all three tiers in anything you add.
- **NO file-loaded environments (EXR/HDR).** They suspend/throw and black-canvas'd us before. The
  env is built from drei `<Lightformer>`s (`ForgeCanvas.jsx:34-41`) in its **own `<Suspense>`**, and
  the slab renders **outside** that Suspense so it can't be gated to black. Keep that decoupling.
- **Content-first + degrade.** 3D mounts after paint; `CanvasBoundary` (`ForgeExperience.jsx:21`)
  falls back to a static poster on WebGL failure. New 3D is enhancement, never the LCP.
- **Palette discipline.** Warm forge only (`PAL`): 60 void / 30 deep crimson / 10 ember-gold. HDR
  (>1) values are reserved so only the 10% blooms. No cool/green/blue casts (brand).

## Procedure
1. Decide: **preset tweak** (90% of cases) or **bespoke element**. Default to preset.
2. Edit `SCENES[route]` (or add the gated element). Reuse `PAL`/`GLSL_NOISE`; add disposal.
3. `npm run build` green. Then **`qa-route`**: shot @ 393×852 + 1440×900, **0 console errors**
   (SwiftShader compiles GLSL in CI, so a shader typo shows up as an error here).
4. Confirm `/` is byte-unchanged and the route reads distinct. Owner reads the real look on the
   iPhone 15 OLED (transmission/bloom/true-black don't simulate).
