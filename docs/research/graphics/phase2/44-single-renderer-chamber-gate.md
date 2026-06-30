# 44 — Route-Gated Bespoke Chamber Meshes with Disciplined Disposal

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 44_
_Cluster: G-architecture-perf · Focus: the `<ChamberHero>` gate inside `ForgeCanvas`
(mount/unmount with React so the dispose effect fires), per-chamber preset rows in `scenes.js`, and
verifying `renderer.info.memory` is **FLAT** across nav round-trips. Climbing geometries/textures =
a chamber not disposing. Peak memory = backdrop + exactly one chamber._

> Read `00-COHESION-MAP.md` §4.1–4.3 and deep-dive `39-master-forge-uniform-pool.md` first. Doc 31
> chose the architecture (one Canvas, route = preset swap) and doc 39 owns the *shared uniform pool*
> `U` and the single `<ForgeDriver/>` writer. **This doc owns the orthogonal half: how the bespoke
> per-chamber geometry comes and goes without ever leaking a byte of GPU memory.** The uniform pool is
> the cohesion spine; the chamber gate is the memory contract. They are independent: `U` persists for
> the life of the renderer; chamber meshes are born and destroyed on every navigation. Get the gate
> wrong and the iPhone 15 OOM-kills the tab after six page views — the most embarrassing possible
> failure on the judge device.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX runs on **one** `THREE.WebGLRenderer` (one `<Canvas>` in `src/scene/ForgeCanvas.jsx`),
mounted once by the persistent React-Router layout (`src/ForgeExperience.jsx`) and never torn down on
navigation. The persistent obsidian slab (`ObsidianSlab.jsx`) is the back wall of every chamber, so the
world never goes empty between routes. On top of that backdrop, **four-plus routes earn a bespoke
hero** — a chunk of geometry that exists for that route and no other (the cohesion map §4.3 table):

| Chamber | Route | Bespoke element | Heavy resources it allocates |
|---|---|---|---|
| scrying-**pool** | `/voice` | still water plane + fake-SSS ember | 1 plane geo, 1 material |
| casting-room | `/software` | the live pour + molten surface | 1 lathe/plane geo, 1 material |
| channel-hall | `/automations` | top-down Celtic interlace channels | SDF-carved plane(s), 1 material |
| **jewel**-chamber | `/web` | faceted gem (`buildGem`) + edges | 1 BufferGeometry, 1 EdgesGeometry, 2 materials |
| altar-approach | `/about` | basalt altar + Ogham reveal | extruded geo, basalt + ogham materials |
| stone-**ledger** | `/pricing` | Ogham verse up the edge | basalt slab geo, ogham material |
| four-**plinths** | `/work` | four cooled gem casts, gallery-lit | 4× `buildGem` (or 1 instanced), ContactShadows RT |
| forge-mouth **arch** | `/contact` | white-hot mouth, extruded arch | ExtrudeGeometry, additive mouth material |

The brief is blunt about the contract: **`renderer.info.memory` must be FLAT across navigation.** If
`memory.geometries` or `memory.textures` climbs every time you walk into the jewel chamber and back out,
a chamber mesh is not disposing — the classic SPA WebGL leak. Peak GPU footprint must be
`backdrop (slab + embers + env) + one chamber`, **never** `backdrop + eight chambers`. The only way to
guarantee that on the web is the React mount/unmount lifecycle: render the chamber conditionally so that
leaving the route *unmounts the component*, which *runs the cleanup effect*, which *calls `dispose()`*.

This is not the same problem as the uniform pool (doc 39). The pool `U` is a handful of `{value}`
objects that live forever and cost nothing; sharing them is about *cohesion*. The chamber gate is about
*lifetime* — bespoke geometry can be megabytes of VBO/IBO and a compiled program, and it must be
reclaimed the instant its route loses focus. The two systems meet at exactly one point: each chamber
material binds the shared `U` in `onBeforeCompile` (cohesion) **and** disposes itself on unmount
(lifetime). This doc is about getting the second half right without ever breaking the first.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are five ways to bring a route-specific mesh in and out of a single persistent Canvas. They
differ on whether GPU memory is actually reclaimed, on mobile cost, and on how much the developer must
remember to do by hand.

### 2.1 React conditional mount/unmount + cleanup-effect dispose — RECOMMENDED

The chamber is a React component rendered behind a route condition: `{chamber === 'jewel' &&
<FacetedJewel/>}`. When `forge.route` leaves `/web`, the condition flips false, React **unmounts**
`<FacetedJewel/>`, and its `useEffect(() => () => { geo.dispose(); mat.dispose() }, [])` cleanup fires
— freeing the VBO, IBO, and compiled program. This is the pattern the repo already uses in two places
(`ObsidianSlab.jsx:133`, `FacetedJewel.jsx:73-77`) and the one the cohesion map specifies.

R3F gives you a strong baseline here for free. Its automatic-disposal layer "manages objects and makes
them auto-dispose when components unmount" — "let r3f handle object disposition; you can just unmount
the React component and everything will be disposed" (R3F *Objects, properties and constructor
arguments*, 2025). The catch, also documented: this only covers objects R3F itself *created* as JSX
elements (a `<mesh>` with a `<boxGeometry/>` child). Anything you build imperatively in `useMemo`
(`buildGem()`, `new THREE.EdgesGeometry`, a hand-rolled `MeshPhysicalMaterial`) is **yours to
dispose** — R3F attaches it but does not own its lifetime when it's passed as a prop
(`geometry={geo}`), and `primitive` objects "will not dispose of the object they carry on unmount, you
are responsible for disposing of it" (same doc). So the rule for GAELWORX, where every chamber builds
geometry imperatively for shader control: **explicit cleanup effect, every time, no exceptions.**
Tradeoffs: real memory reclamation, true `renderer.info.memory` flatness, trivially mobile-safe, zero
new dependency. Cost: a recompile/re-upload when you re-enter the route (mitigated in §6) and the
discipline of never forgetting the cleanup return.

### 2.2 Keep-mounted + toggle `visible` — REJECTED for heroes, OK for the slab

The common counsel "in Three.js it is very common to not re-mount at all because buffers and materials
get re-initialized/compiled, which can be expensive … keep stages mounted but toggle `visible`" (R3F
mount/unmount best-practices roundup, 2025) is the *opposite* trade: it keeps every chamber's geometry
resident to avoid recompile cost, paying with permanently-allocated memory. For two or three cheap
chambers this is fine. For GAELWORX's eight, it is exactly the `backdrop + eight chambers` peak the
brief forbids — on an iPhone 15 with near-screen fbm materials, holding all eight bespoke materials
resident risks the program cache and VBO budget the moment the heavier chambers (channels, plinths,
arch) land. **The persistent slab uses this pattern (always mounted, never toggled); the bespoke heroes
must not.** Verdict: reserve `visible` toggling only for the always-on backdrop, never for the gated
heroes.

### 2.3 R3F automatic disposal alone (no explicit cleanup) — INSUFFICIENT HERE

Relying purely on R3F's auto-dispose without writing the cleanup effect works *only* if every resource
is a JSX child R3F constructed. The moment a chamber passes an imperatively-built `geometry`/`material`
as a prop — which all of GAELWORX's shader-driven chambers do — auto-dispose does not reach it, and
`memory.geometries` climbs. The forum's recurring "R3F dispose not working (memory is not reduced)"
thread (three.js forum, 2024→2025-active) traces almost every report to this gap plus loader-cache
retention (`useLoader`/`useGLTF` hold a `suspend-react` cache that survives unmount unless you call
`useGLTF.clear(url)` / `useLoader.clear(...)`). For GAELWORX this means: imperative geometry → explicit
dispose; any future textured chamber → also clear its loader cache on unmount. Auto-dispose is a
backstop, not the mechanism.

### 2.4 drei `<View>` scissoring for tiled chambers — SITUATIONAL

drei's `<View>` cuts the one canvas into `gl.scissor` rectangles tied to DOM elements, so several
independent sub-scenes share one context (drei *portals/view*, 2025; `<Detailed>`/`<Instances>` for LOD
and draw-call reduction in the same family). This is the right tool for **one** GAELWORX route — the
four-plinths Work gallery, where four forge fragments anchor to four DOM cards. But each `<View>`'s
contents are still React-mounted subtrees, so the disposal contract of §2.1 applies *inside* each view;
`<View>` changes *where* the chamber renders, not *whether* its geometry disposes. Keep it for the tiled
route, and prefer instancing (`<Instances>`) over four discrete `buildGem` calls so the plinths cost one
geometry, not four. Not the everyday swap.

### 2.5 Portal-FBO crossfade (`createPortal` + `useFBO`) for marquee transitions — ADVANCED

Render the outgoing and incoming chamber to render targets and blend them in a fullscreen blur-to-sharp
pass — the brand's "Forge Reveal" between two marquee rooms (Heckel, *WebGL Render Targets*, 2025; doc
31 §2.4). Powerful, but during the transition **both** chambers are resident plus a render target, which
momentarily violates `backdrop + one chamber`. Acceptable for one or two scripted transitions on
desktop; budget-sensitive on iPhone, and the FBO itself must be disposed on transition-end. Reserve it;
do not make it the default gate.

### 2.6 The WebGPU/TSL future — shape for it, don't ship it

R3F v9 (paired with React 19, 2025) makes WebGPU/TSL first-class with a new standalone scheduler so
`useFrame` "can be used outside of `<Canvas>`," plus `useUniforms`/`useNodes` built-ins (R3F v9 release
notes / migration guide, 2025). A future `three/webgpu` port would express each chamber as a
`NodeMaterial` and the gate logic is unchanged — React still mounts/unmounts, and `NodeMaterial`/
`BufferGeometry` still expose `.dispose()`. So the gate code written today survives the port verbatim;
only the material internals change. We ship WebGL2 to the judge (the `WebGPURenderer` WebGL2-fallback
branch is less battle-tested — the documented mistake is betting the iPhone read on it), and keep the
gate renderer-agnostic.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**A single `<ChamberHero>` component inside `ForgeCanvas` that React-conditionally mounts exactly one
bespoke hero based on the active route's `scenes.js` row, where every hero owns an explicit
`useEffect` cleanup that disposes all imperatively-created geometry, edge-geometry, and materials — with
a `renderer.info.memory` flatness assertion baked into QA.** `<View>` is reserved for the four-plinths
Work route; portal-FBO is reserved for one or two marquee transitions. The slab stays always-mounted
(the back wall); the heroes are the only things that come and go.

Justification against the brief:

- **`renderer.info.memory` flatness is the literal acceptance test**, and React conditional unmount is
  the *only* mechanism that actually frees GPU memory on the web (visibility-toggle keeps it resident,
  auto-dispose misses imperative resources). The brief names this metric explicitly; this approach is
  the one that satisfies it by construction.
- **Peak = backdrop + one chamber.** Because the gate renders `chamber === X && <HeroX/>` with mutually
  exclusive conditions, at most one bespoke hero is ever mounted. The heavy geometry of seven other
  chambers simply does not exist in GPU memory while you're in the eighth.
- **It's already the established repo pattern.** The slab and jewel already do
  `useEffect(() => () => { ...dispose() }, [...])`. This doc generalizes that one pattern into a gate,
  rather than inventing anything — lowest-risk path, and it composes cleanly with the doc-39 uniform
  pool (the cleanup disposes the *material*; it never touches the shared `U` references, which persist).
- **Mobile-first.** One context, no nav churn (doc 31), and now a hard memory ceiling: the iPhone never
  holds more than one chamber's worth of bespoke VBOs/programs at a time, so a long browsing session
  cannot accrete toward an OOM kill.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

No new dependency for the gate. Current stack (`three@^0.169` · `@react-three/fiber` · `@react-three/
drei` · `@react-three/postprocessing` · `leva` · `react-router-dom`). `<View>` and `useFBO` ship in the
existing drei if the Work route or a marquee transition adopts them. (R3F v9/React 19 noted as the
forward target; the gate API is identical across v8→v9.)

### 4.2 Per-chamber preset rows in `scenes.js` (the `chamber` field)

Extend each existing row (`{ veinScale, veinGlow, irid, camZ, rotY, rotX }`) with a `chamber` string —
the single source of truth the gate reads. Home stays byte-identical (no `chamber` → no hero, just the
slab). Example:

```js
export const SCENES = {
  '/':            { veinScale: 1.8, veinGlow: 0.6,  irid: 1.35, camZ: 6.4, rotY: 0.0,  rotX: -0.08 },
  '/voice':       { veinScale: 1.2, veinGlow: 1.0,  irid: 1.65, camZ: 6.0, rotY:-0.24, rotX: -0.11, chamber: 'pool'     },
  '/software':    { veinScale: 2.7, veinGlow: 0.8,  irid: 1.0,  camZ: 5.7, rotY: 0.26, rotX: -0.05, chamber: 'casting'  },
  '/automations': { veinScale: 3.2, veinGlow: 0.7,  irid: 0.95, camZ: 5.3, rotY: 0.34, rotX: 0.0,   chamber: 'channels' },
  '/web':         { veinScale: 1.6, veinGlow: 1.25, irid: 1.95, camZ: 6.6, rotY: 0.12, rotX: -0.13, chamber: 'jewel'    },
  '/about':       { veinScale: 1.85,veinGlow: 0.6,  irid: 1.2,  camZ: 6.4, rotY:-0.16, rotX: -0.08, chamber: 'altar'    },
  '/pricing':     { veinScale: 1.45,veinGlow: 0.7,  irid: 1.1,  camZ: 6.2, rotY: 0.16, rotX: -0.07, chamber: 'ledger'   },
  '/work':        { veinScale: 2.1, veinGlow: 0.9,  irid: 1.3,  camZ: 6.0, rotY:-0.3,  rotX: -0.06, chamber: 'plinths'  },
  '/contact':     { veinScale: 1.5, veinGlow: 1.1,  irid: 1.55, camZ: 5.8, rotY: 0.22, rotX: -0.05, chamber: 'arch'     },
}
export const sceneFor = (path) => SCENES[path] || SCENES['/']
```

`chamber` is intentionally a **string key, not a component reference** — `scenes.js` stays a pure data
module with no import of the hero components (which would defeat code-splitting and create a require
cycle through `ForgeCanvas`). The gate maps key→component.

### 4.3 The `<ChamberHero>` gate (mount/unmount with React)

The gate reads `forge.route` (the mutable store, not React state — no re-render on every scroll frame)
and lifts it into React state **only when it actually changes**, so the conditional re-renders exactly
on navigation. Lazy-import the heavier heroes so their code (and the gem builder) only loads when a
route needs it.

```jsx
// src/scene/ChamberHero.jsx — the route gate. Mounts AT MOST ONE bespoke hero.
import { Suspense, lazy, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge } from '../store.js'
import { sceneFor } from './scenes.js'

// Lazy so each chamber's geometry/material code is a separate chunk, loaded on demand.
const FacetedJewel = lazy(() => import('./FacetedJewel.jsx'))
const ChannelHall  = lazy(() => import('./chambers/ChannelHall.jsx'))
const ScryingPool  = lazy(() => import('./chambers/ScryingPool.jsx'))
const CastingPour  = lazy(() => import('./chambers/CastingPour.jsx'))
const AltarSource  = lazy(() => import('./chambers/AltarSource.jsx'))
const StoneLedger  = lazy(() => import('./chambers/StoneLedger.jsx'))
const PlinthGallery= lazy(() => import('./chambers/PlinthGallery.jsx'))
const ForgeArch    = lazy(() => import('./chambers/ForgeArch.jsx'))

const HERO = {
  jewel: FacetedJewel, channels: ChannelHall, pool: ScryingPool,
  casting: CastingPour, altar: AltarSource, ledger: StoneLedger,
  plinths: PlinthGallery, arch: ForgeArch,
}

export default function ChamberHero({ quality }) {
  // Cheap per-frame gate: only call setState when the route key actually changes,
  // so the subtree re-mounts on navigation and stays still during scroll.
  const [route, setRoute] = useState(forge.route)
  useFrame(() => { if (forge.route !== route) setRoute(forge.route) })

  const key = sceneFor(route).chamber           // undefined on '/', so NO hero — just the slab
  const Hero = key && HERO[key]
  if (!Hero) return null

  // `key={key}` forces a clean unmount→mount when switching DIRECTLY between two
  // chambers (e.g. /web → /work) so the outgoing hero's cleanup effect always fires.
  return (
    <Suspense fallback={null}>
      <Hero key={key} quality={quality} />
    </Suspense>
  )
}
```

Two load-bearing details:

1. **`key={key}`.** When you navigate chamber→chamber without passing through home, React may *reconcile*
   `<Hero/>` into the new component type and, depending on tree shape, not run the old cleanup before the
   new mount. Giving the element a `key` equal to the chamber name guarantees React treats a different
   chamber as a different element → **unmount old (cleanup → dispose) → mount new**. This is the single
   most important line for `renderer.info.memory` flatness on direct chamber-to-chamber nav.
2. **`<Suspense fallback={null}>` is nested and local.** A lazily-loaded chamber chunk that is still
   fetching suspends only *this* subtree — the persistent slab (mounted as a sibling, outside this
   Suspense) keeps rendering, so the world never black-canvases (doc 31 §6, the decoupled-Suspense law).

### 4.4 Wiring the gate into `ForgeCanvas` (slab always on, hero gated)

```jsx
// ForgeCanvas.jsx (excerpt) — slab is the persistent back wall; ChamberHero gates the bespoke mesh.
<ForgeDriver />                       {/* doc 39: the ONE writer of U; persists for the renderer's life */}
<ObsidianSlab quality={quality} />    {/* always mounted — never toggled, the back wall of every room */}
<ChamberHero quality={quality} />     {/* mounts AT MOST ONE bespoke hero, disposes it on route exit */}
{quality !== 'static' && <Effects quality={quality} />}
```

The slab is **outside** any chamber Suspense and is never conditional — peak memory is therefore
`slab + embers + env + (≤1 chamber)`.

### 4.5 The disposal contract every hero must honor

Every bespoke hero builds its geometry/materials imperatively (for shader control) and therefore **must**
dispose them. The canonical shape (the jewel, generalized):

```jsx
// Inside any chamber hero:
const geo   = useMemo(() => buildGem({ sides: c.sides }), [c.sides])
const edges = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo])
const material = useMemo(() => {
  const m = new THREE.MeshPhysicalMaterial({ /* ...brand params... */ })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U)          // doc 39: bind the SHARED pool (cohesion)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
  }
  return m
}, [])

// THE CONTRACT: free every imperatively-created GPU resource on unmount.
useEffect(() => () => {
  geo.dispose()
  edges.dispose()
  material.dispose()
  // If this chamber loaded a texture/RT: tex.dispose(); rt.dispose();
  //   and any loader cache: useGLTF.clear(url) / useLoader.clear(Loader, url)
}, [geo, edges, material])
```

Critically, `material.dispose()` frees the material **but never touches `U`** — `U`'s `{value}` objects
are module-level and shared by every material via reference; disposing one consumer's material does not
invalidate the pool. The cohesion spine (doc 39) and the memory contract (this doc) are fully
orthogonal: `U` lives forever, materials live per-route.

### 4.6 How the gate hooks the shared master temperature system

The gate is *lifetime* plumbing; cohesion comes entirely from the bound `U`. The moment a hero mounts,
its material's `onBeforeCompile` assigns the same `U.uTime`/`U.uTemp`/`U.uHeat`/`U.uPointer`/`U.uVeinScale`
/`U.uVeinGlow`/`U.uIrid` references the slab and the `<ForgeDriver/>` already use (doc 39 §4.4). So a
freshly-mounted jewel reads the *current* forge temperature on its very first frame — it heats with the
slab behind it, on one float, with no warm-up. When the route exits and the jewel unmounts, the driver
keeps writing `U` for the slab; nothing about the pool changes. The divine-fire A/E exception
(`gw_divineFire`, `uIsAE`) and the master ramp (`gw_forge`, `gwCool01`) are inlined from `shaders.js`
into each chamber's injected GLSL exactly as the slab does — the gate does not special-case them; it
just mounts a material that already speaks the shared language.

```glsl
// Every chamber's injected COLOR chunk ends the same way — one ramp, one exception:
vec3 metal = mix( gw_forge(localTemp), gw_divineFire(flick), uIsAE );  // doc-39 / cohesion §1.4
gl_FragColor.rgb += metal;     // added pre-tonemap so AgX/ACES + bloom process the >1 emissive
```

---

## 5. COHESION

- **One palette, inlined.** Every chamber material inlines `PAL` via `v3()` (no raw hex); only the 10%
  accent (`PAL.hot`/`emberHot`/`gold`/`divine`) exceeds 1.0, so only it blooms. The gate mounts/unmounts
  the *carrier* of that palette; the palette itself is shared, immutable, and never per-chamber.
- **One temperature signal, one heartbeat.** Because each mounted hero binds `U` (doc 39), a scroll or a
  `forge.strikeAt` strike surges the slab and the live chamber **in the same frame** — the synchrony that
  proves nothing is bolted on. The gate guarantees the carrier exists; `U` guarantees they agree.
- **One noise basis.** Chambers inline `gw_fbm`/`gw_warp`/`gw_caustic` from `shaders.js` at the shared
  `GW_FBM_OCTAVES` define, so a vein leaving the slab and entering a channel uses one grain. The gate's
  lazy-loaded chunk still imports the *same* `shaders.js` module — one noise authority, code-split or not.
- **One light rig, one composer.** The cool-neutral key + lightformer env and the single `EffectComposer`
  wrap the whole world; a mounted chamber inherits the same ACES/AgX tone-map, HDR-only bloom, and grade.
  No chamber introduces a private pass or a cool/green/blue cast.
- **One camera language.** `CameraRig` damps `camZ/rotY/rotX` toward `sceneFor(route)` — the same row the
  gate reads for `chamber`. The hero appears *as the camera turns to face it*, so mount and framing are
  one motion, not a pop.

The binding rule the gate must never break: **disposal frees the material, never the shared pool.** A
chamber is a temporary mouth onto the one forge; closing it must not cool the forge.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 OLED budget)

- **The structural win: peak = backdrop + one chamber.** The whole point of the gate. On the iPhone the
  cost driver is fill-rate and resident GPU memory, not draw calls; by never holding more than one
  bespoke hero's VBOs/IBOs/program resident, a long session cannot accrete toward the tab's memory
  ceiling. utsubo's 2026 tips are explicit: "Monitor `renderer.info.memory` — if geometries and textures
  keep growing, you have a leak"; WebGL resources "are not automatically garbage-collected and must be
  manually disposed," especially "when navigating between pages in a SPA" (utsubo, *100 Three.js Tips
  That Actually Improve Performance*, 2026). The gate is the SPA-nav disposal discipline made structural.
- **Recompile cost on re-entry, and how to hide it.** The one real cost of mount/unmount (vs. keep-mounted
  visibility-toggle) is that re-entering a route rebuilds geometry and **recompiles the program**. three
  caches programs by a key that includes `onBeforeCompile.toString()`, so *identical* injected source
  reuses the cached program — re-entering `/web` after leaving it reuses the jewel's compiled shader as
  long as the injection string is byte-stable (build the material once in `useMemo`, keep markers
  constant; doc 39 §2.1). The geometry re-upload is small for GAELWORX's low-poly heroes. For the
  heaviest chamber, prefer `renderer.compileAsync(scene, camera)` on the incoming hero before first
  interaction so a multi-hundred-ms compile never blocks the first scroll (doc 31 §6 INP insurance).
- **Tiered quality, honored per chamber.** Each hero reads `quality` and gates `transmission`/extra taps
  to `high` only (transmission black-canvased weak GPUs — `FacetedJewel`/`ObsidianSlab` already tier it).
  On `static`, the gate still mounts the hero (so the room isn't empty) but with `uTime` frozen and no
  per-frame work — a dignified still, not a black canvas.
- **Plinths = instancing, not four meshes.** The one tiled chamber (`/work`) should build **one** gem
  geometry and render four casts via `<Instances>`/`InstancedMesh` (or four `<View>` scissor tiles
  sharing one geometry) so its memory cost is ~one chamber, not four. `<Detailed>` LOD is available if a
  cast needs a near/far swap (drei, 2025).
- **No runtime EXR/HDR.** The gate never loads an environment; the one procedural lightformer env
  (`ForgeCanvas`) serves every chamber's reflections. Any chamber that *does* need a texture lazy-loads
  it in its own nested `<Suspense fallback={null}>` and clears its loader cache on unmount (§2.3).
- **Adaptive backstop.** The existing `PerformanceMonitor` → `AdaptiveDpr` ladder rides the slow thermal
  decline; the gate is orthogonal to it (it controls *what's mounted*, not *how it's rendered*), and the
  two compose — a heavy chamber under thermal pressure still benefits from DPR drop.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls (each one a way `renderer.info.memory` climbs or the world black-canvases):**

1. **Conditional render without a real unmount.** If the hero is wrapped in something that keeps it
   mounted (a parent that never unmounts, or `visible={false}` instead of conditional render), the
   cleanup effect never runs and `memory.geometries` climbs. Gate the *element itself* with `&&`, not a
   visibility prop.
2. **Missing the cleanup return.** Building `geo`/`edges`/`material` in `useMemo` but forgetting
   `useEffect(() => () => {...dispose()}, [...])` leaks every one of them. R3F auto-dispose does **not**
   cover imperatively-built resources passed as props (R3F *Objects/Automatic disposal*, 2025).
3. **Direct chamber→chamber nav skipping cleanup.** `/web → /work` reconciling `<Hero/>` in place can
   mount the new hero before the old disposes. The `key={chamber}` on the rendered hero (§4.3) forces
   unmount→mount and is the fix. Verify by round-tripping `/web → /work → /web` and watching memory.
4. **Disposing a geometry/material still referenced.** If two chambers share a geometry, disposing on one
   unmount breaks the other. GAELWORX chambers own their geometry; if a future shared cast is introduced,
   refcount it or move it to a module-level singleton that is *never* disposed (and excluded from the
   flatness assertion's baseline).
5. **Loader-cache retention.** Any future textured chamber using `useGLTF`/`useLoader` retains a
   `suspend-react` cache after unmount; `memory.textures` won't fall until you `useGLTF.clear(url)` /
   `useLoader.clear(Loader, url)` (three.js forum, *R3F dispose not working*, 2025).
6. **Post-processing render targets.** If a chamber adds its own effect/FBO, its render target must be
   disposed on unmount (R3F discussion *How to dispose textures created by post-processing passes?*,
   2025). GAELWORX keeps one shared composer, so chambers should not add passes — route mood is a
   `scenes.js` preset or a LUT cross-fade (cohesion §3.3), not a new pass.
7. **Suspense placement.** Putting the chamber Suspense around the slab re-introduces the black-canvas
   bug. Each hero gets its *own* nested `<Suspense fallback={null}>`; the slab renders outside all of them.
8. **`onBeforeCompile` cache-key churn.** Changing injected source or `defines` after first compile
   forces a recompile and can defeat program reuse on re-entry. Keep the injected GLSL byte-stable across
   mounts; reflect any tier `#define` in `customProgramCacheKey()` so two tiers don't collide on one
   cached program (doc 39 §2.1).

**Order of operations:**

1. Land the doc-39 pool `U` + `<ForgeDriver/>` first (this doc depends on it). Confirm `/` byte-identical.
2. Add the `chamber` string field to every `scenes.js` row (home stays without one).
3. Build `ChamberHero.jsx` with the `key={chamber}` + lazy + nested-Suspense shape (§4.3); wire it into
   `ForgeCanvas` beside the always-mounted slab. With only `jewel` mapped, `/web` shows the existing jewel
   and every other route shows just the slab.
4. **Establish the flatness baseline.** In QA, read `gl.info.memory` (`{ geometries, textures }`) on `/`,
   then drive `/ → /web → / → /web → /` and assert the numbers return to baseline each cycle. Bake this
   into `qa-route` as a probe (see below). This is the regression gate every subsequent chamber must pass.
5. Add chambers one at a time: preset row already exists → write `chambers/<Name>.jsx` (build geometry in
   `useMemo`, bind `U` in `onBeforeCompile`, **explicit cleanup effect**) → map it in `HERO` → QA the
   memory round-trip for *that* route, plus direct nav between it and the previous chamber (the
   `key`-forces-unmount path).
6. `npm run build` green (SwiftShader compiles the GLSL in CI — a shader typo surfaces as a console
   error) → `qa-route` at 393×852 + 1440×900 with **0 console errors**, canvas alive, Lenis active, and
   the memory-flatness probe passing → then the iPhone 15 OLED read.

**The QA flatness probe (the brief's literal acceptance test):**

```js
// In the Playwright/qa-route harness, expose the renderer and assert flatness across a nav round-trip.
// window.__forgeGL is the renderer, set once in ForgeCanvas: onCreated={({gl}) => (window.__forgeGL = gl)}
const mem = () => { const m = window.__forgeGL.info.memory; return { g: m.geometries, t: m.textures } }
const base = mem()                                   // on '/'
// drive: navigate('/web'); settle; navigate('/'); settle;  ×N  (the harness does the routing)
const after = mem()
// PASS iff geometries/textures returned to baseline (allow tiny env/RT jitter, e.g. ±1)
expect(after.g).toBeLessThanOrEqual(base.g + 1)
expect(after.t).toBeLessThanOrEqual(base.t + 1)
```

A climbing `g`/`t` across cycles localizes the offending chamber immediately: the last route you entered
before the climb is the one missing a `dispose()`.

---

## 8. SOURCES (2025–2026)

1. utsubo — *100 Three.js Tips That Actually Improve Performance (2026)* — manual disposal of geometry/
   material/texture, "not automatically garbage-collected … especially when navigating between pages in a
   SPA," monitor `renderer.info.memory` for climbing geometries/textures, reuse the renderer, program
   reuse for identical shaders. https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)
2. pmndrs/react-three-fiber — *Objects, properties and constructor arguments* (API docs, 2025) — automatic
   disposal on unmount, `dispose={null}`, `attach` removes object from parent on unmount, primitives do
   not dispose what they carry. https://r3f.docs.pmnd.rs/api/objects (2025)
3. pmndrs/react-three-fiber — *Automatic disposal* (API docs, 2025) — what R3F frees on unmount vs. what
   the developer must dispose. https://gracious-keller-98ef35.netlify.app/docs/api/automatic-disposal/ (2025)
4. three.js forum — *R3F dispose not working (memory is not reduced)* (Questions, 2024→2025-active,
   drcmda reply) — imperative resources + `suspend-react` loader cache retention; `useLoader.clear` /
   `useGLTF.clear(url)` to free cached textures after unmount.
   https://discourse.threejs.org/t/r3f-dispose-not-working-memory-is-not-reduced/47924 (2025)
5. pmndrs/react-three-fiber — *Performance pitfalls* (advanced docs, 2025) — keep-mounted + `visible`
   toggle vs. remount trade, recompile cost of remounting, on-demand frameloop.
   https://r3f.docs.pmnd.rs/advanced/pitfalls (2025)
6. Codrops — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality*
   (Feb 11 2025) — disposal discipline, split scene structure by route and load only required models,
   `PerformanceMonitor`, instancing/LOD. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ (2025)
7. pmndrs/react-three-fiber — *v9 Migration Guide* / v9 release notes (2025) — React 19 pairing, the new
   standalone scheduler letting `useFrame` run outside `<Canvas>`, first-class WebGPU/TSL built-ins
   (`useUniforms`/`useNodes`). https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide (2025)
8. pmndrs/drei — *View* (portals/view docs, 2025) — `gl.scissor` multi-viewport on one canvas, render
   index, `frames={1}`; `<Detailed>` LOD and `<Instances>` for the tiled plinths route.
   https://drei.docs.pmnd.rs/portals/view (2025)
9. Maxime Heckel — *Beautiful and mind-bending effects with WebGL Render Targets* (2025) — `useFBO` /
   render-target technique underpinning the reserved portal-FBO chamber crossfade, and disposing the RT.
   https://blog.maximeheckel.com/posts/beautiful-and-mind-bending-effects-with-webgl-render-targets/ (2025)
10. pmndrs/react-three-fiber — *How to dispose textures created by post-processing passes?* (Discussion
    #2379, 2025) — disposing render targets/textures created by passes on unmount.
    https://github.com/pmndrs/react-three-fiber/discussions/2379 (2025)

---

## 9. DEEP-DIVE CANDIDATES

1. **The `renderer.info.memory` flatness regression harness.** Promote the §7 probe into a standing
   `qa-route` assertion that round-trips every route through home and chamber→chamber, captures
   `{ geometries, textures, programs }` per cycle, and fails CI on any climb — plus a dev-only HUD
   (leva readout) that shows live memory so a leak surfaces the moment a chamber is authored, not in QA.

2. **Lazy-chunk + `compileAsync` warm-up choreography.** Each chamber as a code-split lazy chunk
   (`React.lazy`) prefetched on nav-intent (link hover / in-view), with `renderer.compileAsync` on the
   incoming hero before the route transition completes — so the heaviest chambers (channels, arch) never
   stall the first scroll, and the recompile-on-re-entry cost is hidden behind the camera turn.

3. **Instanced/`<View>` four-plinths memory model.** The one tiled route: prove four casts cost
   ~one chamber via `<Instances>` (shared geometry, per-instance temperature offset for out-of-phase
   cooling) vs. four `<View>` scissor tiles sharing one geometry — and measure scissor overhead vs.
   single-framed scene on the iPhone, with the disposal contract verified per tile.

4. **Portal-FBO "Forge Reveal" transition budget.** The reserved marquee crossfade (`createPortal` +
   `useFBO`): quantify the transient `backdrop + two chambers + RT` peak on iPhone, define the
   transition-end RT disposal, and decide which one or two room swaps (e.g. altar-approach →
   forge-mouth) earn it without breaching the memory ceiling mid-transition.
