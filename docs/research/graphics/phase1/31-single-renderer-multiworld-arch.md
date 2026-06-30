# 31 — Single-Renderer Multi-Chamber Scene Architecture

_GAELWORX forge-world graphics research · Phase 1 · topic 31_
_Focus: one Canvas/renderer hosting 8+ route "chambers" swapped by damping, a shared master uniform
system (temperature, heat, time, pointer, scrollProgress), asset reuse, mount/dispose discipline,
decoupled Suspense._

---

## 1. SCOPE — this element in the GAELWORX world

Everything the judge sees is lit **only by the metal itself** inside one pure-void space. The product
brief demands eight-plus distinct "chambers" — scrying-pool (Voice), casting-room (Software),
channel-hall top-down (Automations), jewel-chamber (Web), altar-approach (About), stone-ledger
(Pricing), four-plinths (Work), forge-mouth arch (Contact), plus the home altar — yet the experience
must read as **ONE cohesive forge**, never a gallery of bolted-on demos. The architectural element
that makes that possible is the **single-renderer multi-chamber host**: exactly one
`THREE.WebGLRenderer` (one `<Canvas>`), mounted at the app shell, that never tears down on
navigation. Routes do not mount new WebGL contexts; they **re-temper a shared scene** by damping a
small set of preset values toward the active chamber's configuration.

This is already the spine of the codebase. `src/scene/ForgeCanvas.jsx` is the only `<Canvas>`, mounted
once by `src/ForgeExperience.jsx` (the persistent React-Router layout — every route renders into its
`<Outlet>` while the canvas, atmosphere, nav and cursor persist). `src/scene/scenes.js` already holds
the per-route preset table (`SCENES`), and `ObsidianSlab.jsx` + `CameraRig.jsx` already damp toward
`sceneFor(forge.route)` each frame. The `forge` store (`src/store.js`) is the **frame-shared state
bus** mutated outside React so `useFrame` reads it every frame with zero re-renders.

The job of this document is to (a) validate that existing pattern against modern 2025-2026 practice,
(b) formalize the **master uniform system** so every chamber's material shares one source of truth for
temperature / heat / time / pointer / scrollProgress, and (c) define the mount/dispose discipline,
decoupled Suspense, and mobile budget that let eight-plus chambers coexist in one context on an
iPhone 15. The forge must feel like a single living organism whose temperature you can feel change as
you walk from room to room — not a slideshow.

---

## 2. TECHNIQUE LANDSCAPE 2025-2026

There are four viable ways to host many 3D "pages" on the web. They differ sharply on cohesion,
perf and mobile safety.

### 2.1 One Canvas per route (mount/unmount on navigation) — REJECTED

The naive React approach: each route renders its own `<Canvas>`. Every navigation **destroys and
re-creates a WebGL context**. The pmndrs guidance and the 2026 best-practices roundup are blunt about
why this fails: "Constantly recreating `WebGLRenderer` can lead to memory exhaustion. Reuse the
renderer or dispose it properly" (utsubo, *100 Three.js Tips*, 2026). Browsers cap live WebGL contexts
(~8-16); context creation is a multi-hundred-millisecond stall on mobile; and you lose all warmed GPU
state (compiled programs, uploaded geometry, the env map) on every nav. It also makes cohesion
impossible — two contexts cannot share a uniform, a render target, or a tone-mapping pass. **This is
the anti-pattern the GAELWORX skill explicitly forbids** (`forge-scene`: "Never add a second
`<Canvas>`/context — it blows the budget and the LCP").

### 2.2 One Canvas, one Scene, route = preset swap (CURRENT GAELWORX PATTERN) — STRONG

A single persistent `<Canvas>` renders a single `THREE.Scene`. The "chamber" is just a **configuration
of shared meshes**: vein density, iridescence, camera framing, plus optionally a route-gated bespoke
mesh. On nav you set `forge.route` and **damp toward the new preset** (never cut). This is what
`scenes.js` + `ObsidianSlab.jsx:146-161` + `CameraRig.jsx:31-42` already do. Tradeoffs: maximal
cohesion (literally one material system, one light rig, one composer), cheapest possible nav (no
context churn, no re-suspend), trivially mobile-safe. Cost: chambers that need genuinely different
geometry must mount/dispose that geometry inside the persistent scene — which is fine if disposal is
disciplined. The Wawa Sensei 2025 scene-transition tutorial and the three.js-forum "rendering multiple
scenes on same canvas" thread both land here as the recommended default for narrative sites.

### 2.3 One Canvas, drei `<View>` / WebGL scissoring — SITUATIONAL

drei's `<View>` (and `pmndrs/react-three-scissor`) use `gl.scissor` to cut the single canvas into
rectangles, each tied to a tracked DOM element, so multiple independent sub-scenes share one context
and one render loop (drei docs, *portals/view*, 2025). This is the right tool when several 3D viewports
must be **visible simultaneously** and aligned to laid-out DOM cards (a product grid, a four-up
comparison). The 2025 docs note the perf hooks: views take over the render loop with a render index,
and `frames={1}` avoids per-frame `getBoundingClientRect` overhead for static placements. For GAELWORX
this is **not** the primary swap mechanism — chambers are full-screen and sequential, not tiled — but
`<View>` is the correct answer if a single route (e.g. four-plinths Work) wants four independently
framed forge fragments anchored to four DOM plinths. Keep it in the toolbox, not the spine.

### 2.4 One Canvas, `createPortal` to multiple THREE.Scenes — ADVANCED

drei/R3F `createPortal` renders into a separate `THREE.Scene` while preserving React context; the
"Portal transitions with R3F" showcase (three.js forum, 2025) uses two portaled scenes plus a
render-target crossfade for cinematic between-room wipes. Powerful for a literal "blur-to-sharp Forge
Reveal" transition between two fully different room geometries, because you can render the outgoing and
incoming scene to FBOs and blend them in a fullscreen pass. Cost: you maintain two scene graphs and an
extra render target (memory + a second scene render during the transition) — acceptable on desktop,
budget-sensitive on iPhone. Use **selectively** for marquee transitions, not as the everyday swap.

### 2.5 WebGPU / TSL renderer — FUTURE, NOT NOW

Since three r171 (Sept 2025) WebGPU is production-ready with automatic WebGL2 fallback via
`import * as THREE from 'three/webgpu'`, and TSL (Three Shading Language) compiles one shader to both
WGSL and GLSL (Heckel, *Field Guide to TSL and WebGPU*, 2025). TSL's `uniform()` nodes and shared
`NodeMaterial` hooks (`colorNode`, `positionNode`) would make a master-uniform system extremely clean.
**But** the GAELWORX stack is three r0.169 + R3F v8 + `@react-three/postprocessing` v2, and Safari/iOS
WebGPU is still uneven in 2026. Migrating the renderer mid-build risks the primary judge device.
Verdict: stay on WebGLRenderer; design the uniform system so a future TSL port is mechanical (see §9).

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Keep and harden 2.2 (single Scene, damped preset swap) as the spine, with 2.3 `<View>` reserved for
genuinely tiled routes and 2.4 portal-FBO crossfade reserved for one or two marquee room transitions.**
Layer onto it a formalized **Master Forge Uniform** object so every chamber material — obsidian slab,
faceted jewel, channel metal, letterform fill, ogham glow — literally shares the same uniform
references for `uTime`, `uTemp`, `uHeat`, `uPointer`, `uScroll`, plus the shared palette and noise.

Justification, against the brief's constraints:

- **Cohesion is the headline requirement.** "Every element shares uniforms so nothing looks
  bolted-on." A single scene with one shared uniform pool is the *only* architecture where that is
  literally true rather than aspirational. Two contexts cannot share a uniform; even two materials
  with separately-cloned uniform objects drift. We make the uniform objects *the same object
  reference*, assigned into every material in `onBeforeCompile` (the pattern `ObsidianSlab.jsx:124`
  already uses: `Object.assign(shader.uniforms, uniforms)`).
- **Mobile-first / iPhone 15 OLED.** One context = one GPU program cache, one env map, one composer.
  Nav is free (damp a float), so INP and LCP stay clean. The existing tiered `dpr`/`frameloop`/
  `Effects` gating (`ForgeCanvas.jsx:10,21,47`) already lives in the right place.
- **It is already 80% built.** This is the lowest-risk path to "AAA cohesive world": extend
  `scenes.js`, promote the slab's local `uniforms` to a shared module, and gate bespoke chamber meshes
  on `forge.route` with strict disposal. No architectural rewrite.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (current, keep)

- `three@^0.169` · `@react-three/fiber@^8.17` · `@react-three/drei@^9.114` ·
  `@react-three/postprocessing@^2.16` · `leva@^0.9` · `lenis` · `react-router-dom@^6.30`.
- No new dependency required for the spine. If a tiled route adopts `<View>`, it ships in the existing
  drei. A portal-FBO crossfade uses `useFBO` (drei) — also already available.

### 4.2 The Master Forge Uniform — one shared pool

Today the slab owns its uniforms locally (`ObsidianSlab.jsx:89-102`). Promote the *cross-chamber*
uniforms to a module so every material assigns **the same references**. Create
`src/scene/forgeUniforms.js`:

```js
import * as THREE from 'three'

// ONE shared uniform pool. Every chamber material assigns THESE references in
// onBeforeCompile, so a single useFrame writer drives the whole world. Mutating
// .value here updates every material at once — true cohesion, zero drift.
export const U = {
  uTime:      { value: 0 },   // clock seconds (frozen to a constant under `static`)
  uTemp:      { value: 0 },   // 0..1 master TEMPERATURE (scroll-driven forge heat)
  uHeat:      { value: 0 },   // 0..1 transient HEAT pulse (strike / scroll velocity)
  uScroll:    { value: 0 },   // 0..1 damped scrollProgress across the journey
  uPointer:   { value: new THREE.Vector2(0.5, 0.5) }, // uv-space pointer
  uPointerOn: { value: 0 },   // 0..1 pointer-present
  // per-route LOOK, damped toward sceneFor(route) — shared so meshes agree:
  uVeinScale: { value: 1.8 },
  uVeinGlow:  { value: 0.0 },
  uIrid:      { value: 1.0 },
}
```

### 4.3 The single per-frame writer

One `useFrame` becomes the **sole author** of the shared pool (move the relevant lines out of
`ObsidianSlab` into a headless `<ForgeDriver/>` mounted once in `ForgeCanvas`, so the pool is driven
even on routes whose hero is the jewel, not the slab). All damping stays `dt`-correct via
`THREE.MathUtils.damp` (`store.js:52`) — never frame-rate-dependent `lerp`.

```jsx
// src/scene/ForgeDriver.jsx — headless; the ONE writer of the shared uniform pool.
import { useFrame } from '@react-three/fiber'
import { forge, damp, range } from '../store.js'
import { sceneFor } from './scenes.js'
import { U } from './forgeUniforms.js'

export default function ForgeDriver() {
  useFrame((state, dt) => {
    const sc = sceneFor(forge.route)
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    U.uTime.value = t

    const vel = Math.min(forge.scrollVel * 1.4, 1)          // scroll energy 0..1
    // master TEMPERATURE: scroll depth runs the forge hotter
    U.uTemp.value = Math.min(forge.scrollDamped + vel * 0.25, 1)
    // transient HEAT: strike pulse + scroll surge (same signal type+jewel already use)
    const since = performance.now() / 1000 - forge.strikeAt
    const pulse = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) * 0.85 : 0
    U.uHeat.value = damp(U.uHeat.value, Math.min(vel * 0.6, 0.7) + pulse, 6, dt)

    U.uScroll.value   = forge.scrollDamped
    U.uPointer.value.lerp(forge.pointerUv ?? U.uPointer.value, 1 - Math.pow(0.002, dt))

    // per-route LOOK damps toward the chamber preset (no cut)
    U.uVeinScale.value = damp(U.uVeinScale.value, sc.veinScale, 2.4, dt)
    U.uIrid.value      = damp(U.uIrid.value,      sc.irid,      2.4, dt)
    const ramp = sc.veinGlow + range(forge.scrollDamped, 0, 0.5) * 0.5 + vel * 0.7
    U.uVeinGlow.value  = damp(U.uVeinGlow.value, forge.ready ? ramp : 0, 3, dt)
  })
  return null
}
```

### 4.4 Every chamber material binds the SAME pool

The slab's material (`ObsidianSlab.jsx:123-129`) changes one line — instead of `Object.assign(shader.
uniforms, uniforms)` with a *local* object, it assigns the **shared** `U`:

```js
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, U)            // <-- shared pool, not a local clone
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${HEAD}`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
    .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
}
```

`FacetedJewel.jsx:65` already reads `uHeat`; it should bind `U.uHeat` (the same ref the driver writes)
instead of its private `uHeat.current`. The channel-metal, letterform-fill and ogham-glow materials
(topics 09/13/25/26) bind the same pool. Result: scroll into the casting-room, the temperature rises,
and the slab, jewel, channels, letters and ogham **all heat together from one float** — the definition
of "shares uniforms so nothing looks bolted-on."

### 4.5 Chamber preset table (extend `scenes.js`)

Keep the existing `{ veinScale, veinGlow, irid, camZ, rotY, rotX }` rows and add the chamber's bespoke
element flag + any chamber-specific knob. Example extension (home row stays byte-identical):

```js
'/automations': { veinScale: 3.2, veinGlow: 0.7, irid: 0.95, camZ: 5.3, rotY: 0.34, rotX: 0.0,
                  chamber: 'channels', tempBias: 0.05 },  // top-down channel-hall
'/web':         { veinScale: 1.6, veinGlow: 1.25, irid: 1.95, camZ: 6.6, rotY: 0.12, rotX: -0.13,
                  chamber: 'jewel' },                     // jewel-chamber
```

### 4.6 Route-gated bespoke chamber meshes (with disposal)

Inside `ForgeCanvas`, mount the per-chamber hero gated on `forge.route` (or the `chamber` field).
Crucial: **mount/unmount with React so the disposal effect fires**, and dispose geometry + material +
any FBO on unmount (pattern `ObsidianSlab.jsx:133`, `FacetedJewel.jsx:73-77`).

```jsx
function ChamberHero() {
  const [route, setRoute] = useState(forge.route)
  useFrame(() => { if (forge.route !== route) setRoute(forge.route) }) // cheap gate
  const chamber = sceneFor(route).chamber
  return (
    <>
      <ObsidianSlab quality={q} />                 {/* the persistent backdrop */}
      {chamber === 'jewel'    && <FacetedJewel quality={q} />}
      {chamber === 'channels' && <ChannelHall  quality={q} />}
      {/* ...one per chamber; each disposes on unmount */}
    </>
  )
}
```

Because the slab is *always* present, the world never goes empty between chambers; the bespoke hero
fades/snaps in over it. Keep the slab outside any `<Suspense>` (see §6) so a chamber asset that
suspends can never black-canvas the whole scene.

---

## 5. COHESION

- **One palette.** Every chamber material inlines `PAL` (`src/scene/palette.js`, the 60/30/10 warm
  set) via the `v3()` helper, and every emissive HDR (>1) value is reserved so only the 10% ember-gold
  blooms — exactly as the slab and jewel already do. No chamber introduces a cool/green/blue cast.
- **One noise field.** `GLSL_NOISE` (`src/scene/shaders.js`) is the shared `gw_fbm`. Channels,
  letterform fill and heat-haze all sample the *same* fbm so the grain of the metal is continuous from
  room to room — a vein leaving the slab and entering a channel uses one noise basis.
- **One temperature/heat signal.** `U.uTemp`/`U.uHeat` from §4.3 drive the white-hot→iron-black
  blackbody ramp (topic 02) everywhere, *except* the A/E divine-fire which clamp to white-gold
  regardless of `uTemp` (the ignite rule, in shader: `mix(blackbody(uTemp), DIVINE_GOLD, uIsAE)`).
  That single exception is the brand A+E ignite expressed in the master system rather than bolted on.
- **One light rig + one composer.** The cool-neutral key + lightformer env (`ForgeCanvas.jsx:27-42`)
  and the single `EffectComposer` (`Effects.jsx`) wrap the whole world. Every chamber inherits the
  same ACES tone-map, warm bloom (HDR-only), crushed-black grade and vignette — so no room can look
  graded differently. Bloom threshold (0.55) is tuned to the shared HDR convention.
- **One camera language.** `CameraRig` damps `camZ/rotY/rotX` toward the chamber preset (λ≈2.2), so
  every transition is the same "forge turns to face the page" motion — Brutalist-Snap-flavored impact,
  no bounce, consistent across all eight routes.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 OLED budget)

- **One context, no nav churn.** The biggest perf win is structural: navigation mutates a float, it
  does not create/destroy WebGL state. utsubo's 2026 tips and the pmndrs scaling docs both stress
  reusing the renderer; we never recreate it. `renderer.info.memory` should be flat across navigation
  (verify in QA — if `geometries`/`textures` climb on each nav, a chamber mesh isn't disposing).
- **Tiered quality, already wired.** `useQuality` → `high|low|static` (`hooks.js`). `low` (the
  iPhone path: no transmission — transmission black-canvased weak GPUs) and `static` (poster, no
  canvas, under reduced-motion or software GL). `ForgeCanvas` sets `dpr` per tier
  (`high:[1,2] / low:[1,1.4] / static:1`), `frameloop='demand'` when static, gates `Effects`, and
  `AdaptiveDpr pixelated` drops resolution under load. Freeze `U.uTime` to a constant under `static`
  (driver already does `t = 2`).
- **Decoupled Suspense (non-negotiable).** Only the file-free lightformer `<Environment>` sits inside
  a `<Suspense>`; the slab + chamber heroes render **outside** it, so an env or asset that suspends
  can never gate the world to black (`ForgeCanvas.jsx:35-45`, `forge-scene` skill). NO runtime EXR/HDR
  loads — env is built from drei `<Lightformer>`s. Any chamber that needs a texture must lazy-load it
  in its *own* nested `<Suspense fallback={null}>` so the rest of the forge keeps rendering.
- **Shared-asset reuse.** One env map, one noise function, one composer, one geometry per reused mesh.
  Where a chamber tiles fragments (Work plinths), prefer instancing or `<View>` over N meshes.
- **Static tier = no Canvas at all.** Reduced-motion / no-WebGL devices get the CSS poster
  (`canvas-fallback`) via `CanvasBoundary` — the 3D is enhancement, never the LCP (the prerendered
  text is). The scene only mounts after `requestIdleCallback` post-first-paint
  (`ForgeExperience.jsx:42-47`).
- **Budget rule of thumb.** Keep the persistent draw-call count low (slab + embers + at most one
  chamber hero). A chamber that needs heavy geometry mounts it only while its route is active and
  disposes on exit — so peak memory is `backdrop + one chamber`, never `backdrop + eight chambers`.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls:**

1. **Cloned vs shared uniforms.** If two materials each get their *own* uniform object, the driver
   updates only one. Assign the **same `U` reference** into every material's `shader.uniforms` in
   `onBeforeCompile`. This is the single most common cohesion bug.
2. **`onBeforeCompile` cache key.** three caches programs; if you change `m.defines` or the injected
   GLSL after first compile you must set `m.needsUpdate = true`. Build the material once in `useMemo`
   and keep the injected source stable.
3. **Disposal that never fires.** If a chamber mesh is conditionally rendered but its parent never
   unmounts, the cleanup effect doesn't run. Gate the mesh itself with React conditional rendering
   (not just visibility) so unmount → `dispose()` → GPU memory freed. Verify with
   `renderer.info.memory`.
4. **Suspense gating the world.** Putting the slab inside the env's `<Suspense>` re-introduces the
   black-canvas bug. Keep heroes outside; give each asset its own nested Suspense.
5. **Cutting instead of damping.** Hard-swapping `veinScale`/`camZ` on nav looks cheap and breaks the
   "one living forge" illusion. Always damp toward `sceneFor(route)` (λ≈2.2-2.4).
6. **Competing animation loops.** Never add a second `rAF`/`setInterval` to drive uniforms — one
   `useFrame` writer only, reading `forge.*`. Multiple writers cause judder and double-damping.
7. **Transmission on weak GPUs.** `MeshPhysicalMaterial.transmission` blacked out Chromebooks; it's
   gated to `high` only. Any new chamber material must honor the same tiering.
8. **`uTime` precision drift.** On long sessions `elapsedTime` grows; trig of a huge float loses
   precision. Acceptable for a session-length site, but if a chamber shimmer looks coarse after
   minutes, `mod` the time in-shader.

**Order of operations:**

1. Promote shared uniforms into `src/scene/forgeUniforms.js` (`U`). Add `<ForgeDriver/>` to
   `ForgeCanvas`; move the cross-chamber damping out of `ObsidianSlab`'s `useFrame` into it.
2. Repoint `ObsidianSlab` and `FacetedJewel` to bind `U` (the shared refs). Confirm `/` is
   byte-identical in look (home preset unchanged).
3. Extend `scenes.js` rows with a `chamber` field; add the `ChamberHero` gate in `ForgeCanvas`.
4. Build the first bespoke chamber (jewel already exists) and wire its material to `U.uTemp/uHeat`.
   Add the disposal effect; verify `renderer.info.memory` is flat after nav round-trips.
5. `npm run build` green (SwiftShader compiles GLSL in CI — a shader typo surfaces as a console
   error). Then `qa-route`: 393×852 + 1440×900, **0 console errors**, canvas alive, Lenis active.
6. Add chambers one at a time, each: preset row → gated mesh → bind `U` → dispose → QA. Owner reads
   the real look on the iPhone 15 OLED (true-black, bloom, transmission don't simulate).

---

## 8. SOURCES (2025-2026)

1. utsubo — *100 Three.js Tips That Actually Improve Performance (2026)* — dispose discipline, reuse
   renderer, `renderer.info.memory` monitoring, DPR clamping. https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)
2. pmndrs/react-three-fiber — *Scaling performance* (advanced docs, 2025) — on-demand frameloop,
   `PerformanceMonitor`, shared canvas guidance. https://r3f.docs.pmnd.rs/advanced/scaling-performance (2025)
3. pmndrs/drei — *View* (portals/view docs, 2025) — `gl.scissor` multi-viewport on one canvas, render
   index, `frames={1}` getBoundingClientRect optimization. https://drei.docs.pmnd.rs/portals/view (2025)
4. Wawa Sensei — *How to Create Scene Transitions with React Three Fiber* (2025) — single-canvas scene
   swap / transition patterns. https://wawasensei.dev/tuto/how-to-create-scene-transitions-with-react-three-fiber (2025)
5. three.js forum — *Portal transitions with R3F* (Showcase, 2025) — `createPortal` + render-target
   crossfade between scenes in one context. https://discourse.threejs.org/t/portal-transitions-with-r3f/84340 (2025)
6. Maxime Heckel — *Field Guide to TSL and WebGPU* (2025) — `uniform()` nodes, shared `NodeMaterial`
   hooks, one-shader-two-targets; future-port rationale. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (2025)
7. mrdoob/three.js — *Release r171* (Sept 2025) — WebGPU production-ready, `three.tsl.js`, codesplit
   entrypoints. https://github.com/mrdoob/three.js/releases/tag/r171 (2025)
8. Maxime Heckel — *Beautiful and mind-bending effects with WebGL Render Targets* (2025) — FBO/render-
   target technique underpinning portal crossfades. https://blog.maximeheckel.com/posts/beautiful-and-mind-bending-effects-with-webgl-render-targets/ (2025)
9. utsubo — *Migrate Three.js to WebGPU (2026) — The Complete Checklist* — `three/webgpu` import,
   WebGL2 fallback, migration risk for production. https://www.utsubo.com/blog/webgpu-threejs-migration-guide (2026)
10. pmndrs/react-three-scissor — multiple scenes, one canvas via scissoring (2025-active repo).
    https://github.com/pmndrs/react-three-scissor (2025)

---

## 9. DEEP-DIVE CANDIDATES

1. **Portal-FBO "Forge Reveal" room crossfade.** Use `createPortal` + `useFBO` to render outgoing and
   incoming chambers to render targets and blend them in a fullscreen blur-to-sharp pass with an
   ember-glow trail — the brand's signature transition, applied to two marquee room swaps (e.g.
   altar-approach → forge-mouth). Budget the second scene render carefully for iPhone.
2. **UBO / UniformsGroup for the master pool.** Promote `U` to a `THREE.UniformsGroup` (one UBO,
   WebGLRenderer-only) so all chamber programs read temperature/heat from a single GPU buffer instead
   of per-material uniform uploads — measure whether it reduces per-frame uniform churn at 8 materials.
3. **`<View>`-based tiled chambers for Work (four-plinths) and the casting-room.** Anchor independent
   forge fragments to DOM cards via scissoring, sharing the master uniforms, with `frames={1}` for
   static plinths — and measure scissor overhead vs. a single framed scene on mobile.
4. **TSL/WebGPU port path.** Re-express the shared-uniform + chamber-preset system as `uniform()`
   nodes + `NodeMaterial` `colorNode`s so a future `three/webgpu` swap (r171+) is mechanical, keeping
   the WebGL2 build as the iOS fallback — define the abstraction boundary now so the GLSL injection
   sites map 1:1 to node hooks.
