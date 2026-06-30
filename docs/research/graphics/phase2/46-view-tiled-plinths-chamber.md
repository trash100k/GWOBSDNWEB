# 46 — drei `<View>` Tiled Chambers for the Four-Plinths Work Gallery

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 46_
_Cluster: G-architecture-perf · Focus: anchor four independently-framed forge fragments to DOM
plinths via `gl.scissor`, sharing the master uniform pool `U`, with `frames={1}` for static
placements — and measure scissor overhead vs a single framed scene on mobile._

> Read `00-COHESION-MAP.md` §4.3 (the route-gated chamber table) and §10 (the iPhone budget), then
> deep-dive `39-master-forge-uniform-pool.md` (the shared `U` and the single `<ForgeDriver/>` writer)
> and `44-single-renderer-chamber-gate.md` (the mount/unmount disposal contract). This doc owns **one
> route**: `/work`, the four-plinths gallery — the *single* chamber in the whole world that is
> genuinely *tiled* (four independently-framed fragments anchored to four DOM cards) rather than one
> camera looking at one hero. Doc 44 explicitly reserves `<View>` for exactly this route and flags the
> open question this doc answers: **does `gl.scissor` tiling actually cost less than one framed scene
> on the iPhone, and how does it survive the world's single `EffectComposer`?** That second half is
> the trap — and the most important thing in this document.

---

## 1. SCOPE — this element in the GAELWORX world

The Work route (`/work`) is the gallery of the forge: **four cooled casts on four stone plinths**,
each a forged artifact at a *different point on the one cooling timeline* — one still hot-orange, one
forge-red, one nearly iron-black, one with the eternal divine-fire `A`/`E` glow — laid out as four DOM
cards the visitor scrolls past. The cohesion map (§4.3, §9) frames it as "four casts cooling **out of
phase**, gallery-lit, baked contact shadows," and §4.4's chamber table names the technique stack:
"`buildGem` casts + Lightformer keys + `ContactShadows frames={1}`," with `<View>` "reserved for the
genuinely tiled four-plinths route."

This is structurally different from every other chamber. The pool, jewel, altar, ledger, channel-hall,
and arch are **one bespoke hero filling the frame** — one camera, one composition, gated by
`<ChamberHero>` (doc 44). The plinths are **four small framed scenes**, each needing its own camera
angle, its own framing rectangle, and its own DOM anchor (the card it sits on top of), all on the
**one** `THREE.WebGLRenderer` GAELWORX is contractually bound to (one context, never torn down —
cohesion map §4.1). You cannot give four casts four cameras with a single full-frame render; you either
draw them into four scissor rectangles (drei `<View>`) or you fake four cameras inside one scene (layout
trickery). This doc evaluates both and picks.

The hard constraints inherited from the world:

- **One renderer, one canvas, one `EffectComposer`** (cohesion §4.1, §6). The composer runs the merged
  post chain (HeatHaze → DOF → GodRays → Bloom → grade → grain → SMAA) over the *whole frame*. Tiling
  with `gl.scissor` and a single fullscreen-pass composer **do not naturally compose** — this is the
  central engineering problem (§2.5, §6).
- **Shared master uniforms.** Every cast binds the same pool `U` (doc 39) via
  `Object.assign(shader.uniforms, U)` so the four plinths heat on the *same* float as the slab behind
  them; the per-cast cooling offset is a small *additive* bias on `U.uTemp`, never a forked clock.
- **`renderer.info.memory` flat** (doc 44). Four casts must cost **~one** geometry via instancing or
  one shared geometry across four views — never four discrete `buildGem` allocations.
- **iPhone-15 OLED, DPR-capped 1.5, fill-rate bound** (cohesion §10). The reason tiling is even
  attractive: four scissor rectangles cover *far fewer covered pixels* than four full-frame draws — the
  fill-rate win is the whole measurable thesis.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Five viable ways to put four independently-framed forge fragments on one canvas, anchored to four DOM
plinths.

### 2.1 drei `<View>` + `View.Port` (gl.scissor tiling) — RECOMMENDED

drei's `<View>` is the canonical 2025–2026 pattern for "multiple scenes, one canvas." It "uses `gl.scissor`
to cut the viewport into segments, and you tie a view to a tracking div which controls the position and
bounds of the viewport, allowing you to have multiple views with a single, performant canvas" (drei
*portals/view* docs, 2025). Reading the current `drei/src/web/View.tsx` source (master, 2025), the
mechanism is exactly what GAELWORX needs:

- A `<View track={ref}>` is an **unstyled DOM element**; you place it in normal HTML flow (on top of each
  plinth card). `View.Port` goes *inside* the `<Canvas>` and outputs the portalled 3D content via
  tunnel-rat. The `<Canvas eventSource>` is the shared DOM root.
- Per frame (or per `frames` budget) drei calls `computeContainerPosition()` →
  `getBoundingClientRect()` on the tracked div, derives an offscreen flag and a pixel rect, then
  `prepareSkissor()` runs:

  ```js
  state.gl.setViewport(left, bottom, width, height)   // map this view to the card's screen rect
  state.gl.setScissor(left, bottom, width, height)    // clip all writes to that rect
  state.gl.setScissorTest(true)                       // only pixels inside the rect are touched
  // ...camera.aspect updated to the rect's aspect; ortho bounds matched...
  ```

- It stores and disables `gl.autoClear` (`autoClear = state.gl.autoClear; state.gl.autoClear = false`)
  so each view paints into its slice **without wiping** the others, then restores it. Views render in
  `index` order (default `1`) so you control draw order across tiles.
- **`frames`** is the static-placement lever: default `Infinity` recomputes the rect every frame (right
  for CSS-animated/scrolling cards); **`frames={1}`** computes the rect once "to avoid needless
  `getBoundingClientRect` overhead" (drei docs, 2025) — exactly our case when the plinths are pinned
  during a scroll-snap dwell.

Tradeoffs: native to the existing stack (zero new dep), genuinely fewer covered pixels than four
full-frame draws (the fill-rate win), DOM-anchored so the card layout *is* the 3D layout. The sharp edge
— and it is a big one — is that **drei `<View>` and a single fullscreen-pass `EffectComposer` do not
compose** (§2.5). That single fact reshapes the whole approach (§3, §6).

### 2.2 Single scene, four casts, one full-frame camera (layout, no scissor) — STRONG FALLBACK

Skip `<View>` entirely: place four casts side-by-side in *one* scene, one camera framing all four, and
let DOM cards sit under them via ordinary absolute positioning (the `r3f-scroll-rig` "track a proxy DOM
element, move the mesh to its screen rect" pattern — 14islands/r3f-scroll-rig, active 2025; and the
Codrops *3D Product Grid* layered architecture, Feb 24 2026, which maps DOM cards to per-tile meshes in
one scene). No `gl.scissor`, no per-view camera math, and — decisively — **the one `EffectComposer`
works unchanged** because it's still one full-frame scene. Cost: you pay full-frame fill-rate for the
whole canvas (you don't get the scissor pixel savings), and each cast is a sub-region of one camera's
frustum, so you can't give each its own dramatic lens. For GAELWORX, where post-cohesion (one bloom,
one grade) is *non-negotiable* and the casts want a shared gallery light rather than four bespoke
lenses, this is the pragmatic baseline that the recommendation collapses toward (§3).

### 2.3 `@react-three/scissor` — REJECTED (deprecated)

The older pmndrs `react-three-scissor` ("multiple scenes, one canvas! WebGL scissoring") is **explicitly
deprecated**, its own README now saying "use `<View />` from react-three-drei instead" (pmndrs/react-three-scissor
README, 2025). It also shipped with incomplete per-window cameras/controls. No reason to adopt a
deprecated lib over the maintained `<View>`.

### 2.4 Four separate WebGL contexts / four `<Canvas>` — REJECTED (violates the world)

Four canvases would give four trivially-independent scenes but **four contexts**, which is the exact
anti-pattern the cohesion map forbids (§4.1): the ~8–16 context cap, no shared uniforms across contexts
("WebGL resources cannot be shared across contexts" — react-three-scissor rationale, 2025), and zero
cohesion (the four casts couldn't bind the one `U`). Non-starter — it would make the four plinths four
demos, the precise failure the whole project guards against.

### 2.5 `<View>` **with** the shared `EffectComposer` — the trap, documented

The thing that looks like it should work and doesn't: tile four `<View>`s **and** run the world's single
`EffectComposer` over them. It breaks. The root cause is old and well-documented and still live in
2024–2026 threads: "when setting the renderer's viewport and scissor and calling `composer.render`
multiple times, all shader passes will get the wrong viewport/scissor for rendering their quad …
EffectComposer wasn't designed with viewport/scissor restrictions in mind, and **fullscreen passes
don't respect partial viewport settings**" (three.js Issue #5979, *Viewport/Scissor works incorrectly
with EffectComposer*; corroborated by three.js forum *EffectComposer doesn't work with View in React
Three Fiber*, 2024, and *Trying to use EffectComposer with Views in R3F*, 2024). A fullscreen post pass
samples and writes the **entire** framebuffer; it has no knowledge of the per-view scissor rect, so
bloom/grade either smear across tile borders or blow away the other tiles. The accepted resolutions in
those threads are all variants of: **either** give each view its *own* composer + render target and
composite (N× the post cost — fatal on mobile), **or** run *no* per-view post and apply **one** full-frame
post pass after all views have painted into the framebuffer. The second is the only mobile-affordable
answer, and it is the load-bearing decision in §3/§6.

### 2.6 WebGPU/TSL future — shape for it, don't ship it

`<View>` is renderer-agnostic at the React layer; the gate (mount/unmount + dispose) and the shared-`U`
binding survive a `WebGPURenderer` port verbatim (doc 44 §2.6). `WebGPURenderer` even sets viewport/scissor
through the same `setViewport`/`setScissor` surface, and TSL `PostProcessing` (Heckel, *Field Guide to
TSL and WebGPU*, Oct 14 2025) gives a cleaner per-region post model long-term. But we ship WebGL2 to the
judge (the WebGL2-fallback branch of `WebGPURenderer` is the documented mistake to bet an iPhone read on),
so this is a forward shape, not a Phase-2 ship.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Use drei `<View>` with `gl.scissor` to tile four DOM-anchored forge-fragment casts on the one
renderer, each binding the shared pool `U` with a per-cast additive temperature offset, each tracked
div on `frames={1}` while pinned (recompute only on resize/scroll-settle). Render the four `<View>`s
with `autoClear` managed by drei and a shared geometry across all four (instanced or one `useMemo` geo
referenced four times) so memory ≈ one chamber. Crucially: do NOT run the world's `EffectComposer`
per-view. The post chain runs ONCE, full-frame, AFTER all four views paint — bloom/grade/grain wrap the
whole tiled frame, not each tile.** The cast geometry/materials mount and dispose under the doc-44
contract; `<View>` changes *where* each cast draws, not *whether* it disposes.

The fallback, if the device A/B (§6) shows scissor + four small cameras *isn't* meaningfully cheaper than
one full-frame camera at the plinth count (four), is §2.2: **one scene, one camera, four casts laid out
by DOM proxy**, which also dissolves the EffectComposer problem for free. The pick between them is a
measured call (§6), but the *cohesion contract is identical either way* — same `U`, same palette, same
single post.

Justification against the brief and the world:

- **The brief's literal question is "measure scissor overhead vs a single framed scene on mobile,"** and
  the honest 2025–2026 answer is two-sided: scissor tiling *saves covered pixels* (four small rects vs
  one full screen) — the win — but *costs* four `getBoundingClientRect` reads + four
  setViewport/setScissor/state-flips + four draw submissions per frame, and **forfeits the merged
  full-frame post unless post is restructured**. `frames={1}` eliminates the per-frame
  `getBoundingClientRect` cost (drei docs, 2025), and one shared geometry eliminates the memory cost, so
  the *measured* trade reduces to: scissor-pixel-savings vs four-camera-submission-overhead. At **four**
  tiles this is close; the recommendation is to ship whichever the device proves faster, with `<View>`
  as the default because the pixel savings dominate on the fill-rate-bound iPhone.
- **It honors the single-EffectComposer law (cohesion §6).** By running post once, full-frame, after the
  views, the four casts and the slab behind them get the *same* bloom threshold, the *same* grade, the
  *same* grain-dither — no per-tile composer, no per-route post tweak. The casts read as four pieces of
  one cooling metal under one film stock, which is the entire point.
- **It binds the shared `U` (cohesion §1, doc 39).** Each cast's material `Object.assign`s the pool, so a
  scroll or a `forge.strikeAt` strike surges all four casts *and* the slab in the same frame. The
  out-of-phase cooling is a four-element `uTempBias[]` (or per-instance attribute), an *offset* on the
  one `U.uTemp`, never four clocks.
- **It's already the chosen tool.** Doc 44 reserves `<View>` for this route and `<Instances>` for these
  casts; this doc executes that reservation with the post caveat made explicit.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

No new dependency. Stack: `three@^0.169` (WebGL2 + `onBeforeCompile`), `@react-three/fiber` (v9 line),
`@react-three/drei` (ships `<View>`, `<Instances>`, `<Detailed>`, `<Lightformer>`, `<ContactShadows>`),
`postprocessing@^6.36` (the one `EffectComposer`). `<View>` and `View.Port` are in the installed drei.
R3F v9/React 19 is the forward target; the `<View>` API is stable across the line.

### 4.2 The DOM layer — four plinth cards, four tracked divs

The Work route's `PageShell` lays out four cards in the Iron Grid. Each card holds a `ref`'d div that the
matching `<View>` tracks. The `<Canvas>` is the persistent `ForgeCanvas`; its `eventSource` is the page
root so DOM events still route. Because the cards are pinned during a scroll-snap dwell, the views run
`frames={1}` and only re-measure on resize / scroll-settle.

```jsx
// WorkGallery.jsx (DOM side) — four plinth cards, each with a tracked div.
const refs = [useRef(), useRef(), useRef(), useRef()]
return (
  <Section className="iron-grid">
    {CASTS.map((cast, i) => (
      <article className="plinth-card" key={cast.id}>           {/* 0px corners, 1px Ash border */}
        <div ref={refs[i]} className="plinth-viewport" />        {/* the View anchors HERE */}
        <h3 className="plinth-label"><BrandText>{cast.title}</BrandText></h3>
      </article>
    ))}
    {/* refs handed to the canvas-side gallery via context/store */}
  </Section>
)
```

### 4.3 The canvas layer — four `<View>`s, one shared geometry, shared `U`

```jsx
// PlinthGallery.jsx (canvas side) — mounted by <ChamberHero> on /work (doc 44 gate + disposal).
import { View, Instances, Instance, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import { U } from '../forgeUniforms.js'
import { buildGem } from '../gem.js'
import { HEAD, COLOR, FORGE_UNIFORM_DECLS, GW_FORGE } from '../shaders.js'

// ONE geometry shared by all four casts → memory ≈ one chamber (doc 44 §6).
function usePlinthCast() {
  const geo = useMemo(() => buildGem({ sides: 7 }), [])
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ roughness: 0.34, metalness: 0.9, envMapIntensity: 1.4 })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U)                          // doc 39: bind the SHARED pool
      shader.uniforms.uTempBias = { value: 0 }                   // per-cast cooling OFFSET (set per draw)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FORGE_UNIFORM_DECLS}\nuniform float uTempBias;\n${GW_FORGE}\n${HEAD}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    m.customProgramCacheKey = () => `plinth:${GW_FBM_OCTAVES}`   // tier define in the key (doc 39 §2.1)
    return m
  }, [])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])  // doc 44 disposal contract
  return { geo, mat }
}

export default function PlinthGallery({ quality, trackRefs }) {
  const { geo, mat } = usePlinthCast()
  // Four cooling phases: hot → forge-red → near-iron → divine-AE. An OFFSET on U.uTemp, not a clock.
  const BIAS = [ +0.30, +0.05, -0.22, 0.0 ]      // index 3 is the AE cast (uIsAE=1, ignores bias)
  const AE   = [ 0, 0, 0, 1 ]

  return (
    <>
      {trackRefs.map((ref, i) => (
        <View key={i} index={i + 1} track={ref} frames={1}>
          {/* Each view = its own camera + light slice, drawn into the card's scissor rect */}
          <PerspectiveCamera makeDefault position={castCam(i)} fov={34} />
          <ForgeKey envTone={0.5} />                       {/* shared gallery Lightformer key */}
          <mesh geometry={geo} material={mat}
                onBeforeRender={() => {                     // push this cast's offset just before its draw
                  mat.uniforms && (mat.uniforms.uTempBias.value = BIAS[i])
                  mat.uniforms && (mat.uniforms.uIsAE && (mat.uniforms.uIsAE.value = AE[i]))
                }} />
          <ContactShadows frames={1} resolution={256} opacity={0.7} scale={4} blur={2.4} far={3} />
        </View>
      ))}
    </>
  )
}
```

Two load-bearing details: (1) `frames={1}` per view — the rects are static during a dwell, so drei
skips the per-frame `getBoundingClientRect` (drei docs, 2025); re-call a remeasure on `resize` / Lenis
`settle`. (2) `onBeforeRender` pushes the per-cast `uTempBias`/`uIsAE` *just before* that cast's draw —
because all four share one material instance, the uniform must be set per-view, per-draw (the standard
"one material, per-mesh uniform" pattern; three.js forum *Chainable onBeforeCompile + Uniforms per
Mesh*, canonical 2025). If `onBeforeRender` write-ordering proves fragile across four views, switch to
**`<Instances>`** with a per-instance `aTempBias` attribute (one geometry, four instances, the bias read
in the vertex shader and passed to fragment) — Codrops' *3D Product Grid* (Feb 24 2026) and the utsubo
2026 instancing tip ("InstancedMesh for repeated objects … 9,000 → 300 draw calls") both endorse this as
the draw-call-minimal shape.

### 4.4 The shared-`U` temperature hook (the cooling-offset GLSL)

The four casts are four points on the one cooling timeline. In the injected `COLOR` chunk, the local
temperature is the master `U.uTemp` plus the per-cast `uTempBias`, clamped — then the *same*
`gw_forge` ramp and the *same* divine-fire exception the whole world uses:

```glsl
// Injected COLOR chunk — identical ramp + exception as every chamber (cohesion §1, doc 44 §4.6).
float localTemp = clamp(uTemp + uTempBias, 0.0, 1.0);     // ONE master temp + a per-cast OFFSET
vec3  metal     = mix( gw_forge(localTemp), gw_divineFire(flick), uIsAE );  // AE cast clamps to divine
// + cooling crust / ember veins from gwCool01(age, uCoolRate) keyed off (1.0 - localTemp) for the
//   cooled casts, so the near-iron-black plinth shows the crust skin + glowing ember veins (cohesion §1.3)
gl_FragColor.rgb += metal;        // added PRE-tonemap so AgX/ACES + the single bloom process the >1 emissive
```

`uTempBias` is the *only* per-cast number; everything else — the ramp stops, the noise basis, the
divine-fire path, the palette — is shared. The hottest cast and the coldest cast are *visibly the same
metal* because they sample the same curve at offset inputs. The AE cast (`uIsAE=1`) never reads
`localTemp`; it routes through `gw_divineFire` and radiates `U.uAEFire`/`uAEFirePow` onto its plinth's
basalt and any Ogham (cohesion §5.2) — the keystone, present even in the gallery.

### 4.5 The post-processing resolution (THE critical wiring)

Because fullscreen passes ignore scissor (§2.5), the four `<View>`s paint into the framebuffer with
**no per-view post**, and the world's **one** `EffectComposer` runs **once, full-frame, after** all
views. In R3F the order is enforced by render `index`: views render at `index 1..4`; the composer's
`render` (the `<EffectComposer>` from `@react-three/postprocessing`, already in `ForgeCanvas`) runs
after, sampling the whole framebuffer the four scissor rects painted into. The composer never sees the
scissor — it bloom/grades the *composited* tiled frame:

```jsx
// ForgeCanvas.jsx (excerpt) — ONE composer, AFTER the views (cohesion §6).
<ForgeDriver />                                  {/* doc 39: sole writer of U */}
<ObsidianSlab quality={quality} />               {/* the back wall, full-frame */}
<ChamberHero quality={quality} />                {/* on /work → <PlinthGallery>, four <View>s */}
{quality !== 'static' && <Effects quality={quality} />}   {/* the ONE EffectComposer, full-frame, last */}
```

This is the only mobile-affordable answer the 2024–2026 threads converge on (Issue #5979; forum
*EffectComposer doesn't work with View in R3F*, 2024): one full-frame post, never N per-view composers.
The slab behind the cards and the four casts thus share one bloom contract and one grade — the casts
cannot fork their own glow.

### 4.6 Gallery lighting (shared key, no four shadow maps)

Four dynamic shadow-mapped lights = budget death on mobile (doc 33 §2.3). Instead: a **shared warm
`Lightformer` key** (the same file-free env pattern as `ForgeCanvas`) plus **`ContactShadows frames={1}`**
per view (bake the contact shadow once, since the cast is static on its plinth — cohesion §4.3 names
exactly this). The casts are lit by the metal (their own emissive) + the cool procedural env (doc 22),
never a fill light (cohesion §5). The divine-AE cast additionally throws `uAEFirePow` spill onto its
plinth — the gallery's one warm pool of holy light.

---

## 5. COHESION — how it binds the rest of the world

- **One temperature, four offsets (§1, doc 39).** Every cast `Object.assign`s `U` and reads
  `clamp(uTemp + uTempBias, 0,1)`. The four plinths are four points on *one* cooling curve; a strike
  surges all four (and the slab) in the same frame. No cast invents heat; `uTempBias` is a bias, not a
  clock.
- **One palette, one bloom contract (§3, §6).** Casts inline `PAL` via `v3()`; only the 10% accent
  (`PAL.hot`/`emberHot`/`gold`/`divine`) exceeds 1.0, so only the hot cast and the AE cast bloom — for
  free, under the **single full-frame** composer. The near-iron-black cast sits ≤1.0 and stays true-black
  on OLED.
- **One noise basis (§2).** Casts inline `gw_fbm`/`gw_warp`/`gw_caustic` from `shaders.js` at the shared
  `GW_FBM_OCTAVES` define — the cooled casts' crust + ember veins use the *same* grain as the slab veins.
- **The divine-fire keystone, present in the gallery (§1.4, §5.2).** The fourth cast holds the eternal
  white-gold A/E (`uIsAE=1`), ignores `localTemp`, and radiates `U.uAEFire`/`uAEFirePow` onto its basalt
  plinth — the same exception expressed everywhere, now as the gallery's centerpiece.
- **One camera language, DOM-anchored.** Each view's small camera frames its cast; the *layout* is the
  DOM card grid (Iron Grid, 0px gaps, 0px corners — brand law). The 3D follows the DOM, not vice-versa
  (`r3f-scroll-rig` / Codrops *3D Product Grid* 2026 pattern).
- **Disposal honored (doc 44).** One shared geometry + one material, disposed on unmount; `<View>`
  changes *where* it draws, never *whether* it frees. `renderer.info.memory` stays flat across `/work`
  round-trips.

The binding rule this route must never break: **the four tiles share one post pass, one palette, one
`U`, one geometry.** Four scissor rects are four windows onto one forge — not four forges.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 OLED budget) — measuring scissor overhead

This is the brief's explicit ask: **scissor tiling vs a single framed scene, measured on mobile.** The
honest 2025–2026 accounting:

**Where `<View>` scissor tiling WINS (fill-rate):** the iPhone is fill-rate bound, not triangle bound
(cohesion §10). Four casts in four scissor rects that together cover, say, ~45% of the screen draw their
(cheap MeshPhysical + injected fbm) fragments over **far fewer covered pixels** than one full-frame
camera that rasterizes the casts across the whole viewport. Scissor clips writes to the rect, so
overdraw outside the cards is zero. On a fill-bound device this is the dominant term and the reason to
prefer `<View>`.

**Where `<View>` scissor tiling COSTS:**
- **Per-view CPU:** four `getBoundingClientRect` reads + four `setViewport`/`setScissor`/`setScissorTest`
  flips + four draw submissions per frame. `frames={1}` removes the `getBoundingClientRect` cost while
  the cards are pinned (drei docs, 2025) — re-measure only on resize/scroll-settle — so this collapses to
  four cheap state-flips + four draws. At **four** tiles that's negligible; it only bites at dozens of
  tiles.
- **The post forfeit (the real cost):** you **lose the merged per-view post** entirely; post must run
  once full-frame after the views (§4.5). This isn't a perf cost so much as an architecture constraint —
  but getting it wrong (a per-view composer) is N× the post bill and *is* fatal on mobile.

**The single-framed-scene alternative (§2.2)** pays full-frame fill-rate (no scissor savings) but has
**zero** per-view overhead and **zero** post complexity. At four tiles the two are close; the call is a
device A/B.

**The measurement protocol (do this, don't guess):**
1. Build both: `<View>`-tiled `frames={1}` shared-geo, and single-scene four-cast. Same casts, same `U`,
   same one composer.
2. On the iPhone 15 (Safari, DPR 1.5), capture steady-state ms/frame on `/work` for each, *and* the
   thermal curve over ~90 s (cohesion §10 — the throttle ceiling is the real judge).
3. Read `renderer.info.render.calls` (expect ~4 extra draw calls for tiles) and `renderer.info.memory`
   (must be identical/flat for both — one geometry).
4. **Ship whichever holds 60fps with more thermal headroom.** Expectation from the fill-rate model:
   `<View>` wins on a busy/full-screen plinth layout; single-scene wins if the casts are tiny and the
   four-camera submission dominates. Either way the cohesion contract is unchanged.

**Other budget rules:**
- **One geometry, four casts** — instanced or shared `useMemo` geo; never four `buildGem` (doc 44 §6;
  utsubo 2026 instancing tip). Memory ≈ one chamber.
- **`ContactShadows frames={1}`** — bake the contact shadow once; no dynamic shadow maps (doc 33 §2.3).
- **Tier gating** — `transmission` and extra chromatic taps to `high` only; `low` uses the flat
  emissive cast; **`static`** mounts the four casts frozen (`U.uTime=2`), `frames={1}` views, no post —
  a dignified still gallery, not a black canvas (cohesion §10).
- **`compileAsync`** the plinth material before the route transition completes so the four-view first
  paint doesn't stall the first scroll (doc 44 §6 INP insurance).
- **No runtime EXR** — the one procedural Lightformer env serves all four casts (cohesion §5.3).

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls, ranked by how badly they break the world:**

1. **Running the `EffectComposer` per-view (or expecting it to respect scissor).** The #1 trap. Fullscreen
   passes ignore the per-view scissor; bloom/grade smears across tile borders or wipes other tiles (Issue
   #5979; forum 2024). **Fix: one full-frame post pass after all views** (§4.5). Never N composers on
   mobile.
2. **Four discrete `buildGem` geometries.** Quadruples geometry memory and breaks doc-44 flatness. Use one
   shared geometry (instanced or referenced four times). Verify `renderer.info.memory` flat across `/work`
   round-trips.
3. **`frames={Infinity}` on pinned cards.** Burns a `getBoundingClientRect` per view per frame for rects
   that aren't moving. Use `frames={1}` while pinned; re-measure on `resize`/scroll-settle only (drei docs,
   2025).
4. **Per-cast uniform set in the wrong place.** Four casts share one material; `uTempBias`/`uIsAE` must be
   pushed per-view, per-draw (`onBeforeRender`) — or moved to a **per-instance attribute** via `<Instances>`
   if the write-ordering across views is fragile. A single material with one `uTempBias.value` set once
   makes all four casts the same temperature (the bug that erases the out-of-phase cooling).
5. **Forgetting the disposal contract inside the view.** `<View>` changes *where* the cast draws, not
   whether it disposes; the geometry/material still need the doc-44 `useEffect` cleanup. Auto-dispose
   misses imperatively-built resources passed as props (R3F *Automatic disposal*, 2025).
6. **A cast forking its own orange/clock.** The cooling phases are an *offset* on `U.uTemp`, not four
   private heat formulas. Grep for stray `uTemp.value =` or a per-cast `useFrame` writing heat — the
   driver (doc 39) is the sole author of the global signal; the cast only adds a static bias.
7. **`autoClear` confusion across views.** drei manages `autoClear=false` during the view loop and restores
   it; don't toggle `gl.autoClear` yourself inside a view's `useFrame` or you'll wipe sibling tiles
   (View.tsx, 2025).
8. **DOM/3D layout drift.** The cards are the Iron Grid (0px gaps, 0px corners, 1px Ash border — brand
   law); the tracked div must be the exact rect you want the cast in. A mismatched padding makes the cast
   float off its plinth.

**Order of operations:**

1. **Land doc 39 (`U` + `<ForgeDriver/>`) and doc 44 (`<ChamberHero>` gate + disposal) first** — this
   route depends on both. Confirm `/` byte-identical and `renderer.info.memory` flat across nav.
2. Add the `/work` row's `chamber: 'plinths'` (already in `scenes.js`, doc 44 §4.2) and the four DOM plinth
   cards in `WorkGallery.jsx` with `ref`'d tracked divs.
3. **Build the SINGLE-SCENE four-cast version first** (§2.2) — simplest, the one composer just works.
   Wire `uTempBias[]` for the four cooling phases + the AE cast. QA: build green, `qa-route` 0 console
   errors, memory flat. This is the working baseline and the perf control.
4. **Build the `<View>`-tiled version** (§4.3) with `frames={1}`, shared geometry, and the **one
   full-frame post after the views** (§4.5). QA the same gates *plus* the four-view memory round-trip.
5. **A/B on the iPhone 15** (§6 protocol): steady-state ms, thermal curve over 90 s, draw calls, memory.
   Ship the winner. Document the numbers — this is the deliverable the brief asks for.
6. Add the divine-AE cast's `uAEFire`/`uAEFirePow` spill onto its plinth basalt/Ogham last (the keystone
   beat), verify it survives both the single-scene and tiled paths identically.

**The QA probe (extends doc 44's flatness assertion):**

```js
// On /work, assert: memory flat across round-trip, AND post is ONE full-frame pass (not per-view).
const mem = () => { const m = window.__forgeGL.info.memory; return { g: m.geometries, t: m.textures } }
const base = mem()                         // on '/'
// navigate('/work'); settle; navigate('/'); settle; ×N
expect(mem().g).toBeLessThanOrEqual(base.g + 1)   // four casts = one shared geometry
// draw-call delta on /work ≈ slab + 4 view draws + 1 composer (not 4 composers)
expect(window.__forgeGL.info.render.calls).toBeLessThan(SINGLE_COMPOSER_CEILING)
```

---

## 8. SOURCES (2025–2026)

1. pmndrs/drei — *View* (portals/view docs, 2025). `gl.scissor` viewport tiling; `track`/`index`/`frames`
   props; `frames={1}` "to avoid needless getBoundingClientRect overhead"; `View.Port`; `<Detailed>` LOD
   and `<Instances>` in the same family. https://drei.docs.pmnd.rs/portals/view (2025)
2. pmndrs/drei — *View.tsx* source (master, 2025). `prepareSkissor()` →
   `setViewport`/`setScissor`/`setScissorTest(true)`; `autoClear` saved/disabled/restored;
   `computeContainerPosition()` via `getBoundingClientRect`; render `index` order; tunnel-rat portal.
   https://github.com/pmndrs/drei/blob/master/src/web/View.tsx (2025)
3. three.js — *Viewport / Scissor works incorrectly with EffectComposer* (Issue #5979, live 2024–2026
   discussion). "Fullscreen passes don't respect partial viewport settings"; composer + per-view
   scissor incompatibility and the custom-render-pass / one-full-frame-post resolutions.
   https://github.com/mrdoob/three.js/issues/5979 (referenced 2025–26)
4. three.js forum — *EffectComposer doesn't work with View in React Three Fiber* (Questions, 2024) and
   *Trying to use EffectComposer with Views in React Three Fiber* (2024). The R3F-specific manifestation:
   post works without Views, breaks with Views; one full-frame composer after the views as the fix.
   https://discourse.threejs.org/t/effectcomposer-doesnt-work-with-view-in-react-three-fiber/72359 ·
   https://discourse.threejs.org/t/trying-to-use-effectcomposer-with-views-in-react-three-fiber/72321
5. Codrops — *One Canvas to Rule Them All: How INK Games' New Site Handles Complex 3D* (Nov 21 2025).
   Single shared WebGL canvas serving multiple DOM-anchored 3D regions; resource sharing across the one
   context; the single-canvas-over-many-contexts rationale.
   https://tympanus.net/codrops/2025/11/21/one-canvas-to-rule-them-all-how-ink-games-new-site-handles-complex-3d/ (2025)
6. Codrops — *From Flat to Spatial: Creating a 3D Product Grid with React Three Fiber* (Feb 24 2026).
   Layered DOM-layer / scene-layer / per-tile useFrame / shader-layer architecture; DOM cards mapped to
   per-tile meshes in one scene; per-instance/per-tile data — the §4.3 instanced-cast pattern.
   https://tympanus.net/codrops/2026/02/24/from-flat-to-spatial-creating-a-3d-product-grid-with-react-three-fiber/ (2026)
7. utsubo — *100 Three.js Tips That Actually Improve Performance (2026)*. InstancedMesh for repeated
   objects (9,000 → 300 draw calls); `renderer.info.memory` leak watch; reuse one renderer; program reuse
   for identical shaders. https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)
8. 14islands — *r3f-scroll-rig* (active 2025). One persistent GlobalCanvas; track proxy DOM elements and
   move WebGL objects to their screen rects — the DOM-anchored single-scene alternative (§2.2).
   https://github.com/14islands/r3f-scroll-rig (2025)
9. pmndrs/react-three-scissor — README (2025). Deprecated in favour of drei `<View>`; the
   "one big canvas, draw on specific parts via scissor" rationale and the "WebGL resources cannot be
   shared across contexts" constraint. https://github.com/pmndrs/react-three-scissor (2025)
10. Maxime Heckel — *Field Guide to TSL and WebGPU* (Oct 14 2025). TSL `PostProcessing` model and shared
    uniform-node updates — the WebGPU-portable shape for per-region post and the shared-`U` analogue.
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (2025)

---

## 9. DEEP-DIVE CANDIDATES

1. **The one-full-frame-post-after-N-views render-order contract.** Nail the exact R3F mechanism that
   guarantees the four `<View>`s paint into the framebuffer *before* the single `EffectComposer` samples
   it (render `index` ordering, `autoClear` interplay, where the composer's `render()` sits relative to
   the view loop) — and a regression test that fails if a per-view composer ever sneaks in. The single
   most breakable thing in this route.

2. **`<View>` scissor vs single-scene: the measured iPhone-15 A/B.** Promote §6's protocol into a
   standing benchmark: steady-state ms, 90-second thermal curve, draw calls, and covered-pixel estimate
   for both paths at the four-plinth layout — and define the covered-pixel threshold above which scissor
   tiling wins, so the choice generalizes if the gallery ever grows past four.

3. **Instanced four-cast cooling field (`aTempBias` attribute).** The `<Instances>` variant: one
   geometry, four instances, per-instance `aTempBias`/`aIsAE` attributes read in the vertex shader and
   forwarded to the fragment, so the four cooling phases (and the AE exception) cost one draw call and
   zero per-view `onBeforeRender` writes — vs the four-`<View>` four-draw shape. Measure draw-call and
   ms delta.

4. **DOM-anchored framing math + Lenis-settle remeasure.** The `frames={1}` static-placement edge cases:
   exactly when to trigger a `<View>` rect re-measure (resize, orientation change, Lenis scroll-settle,
   font-load reflow) without reintroducing per-frame `getBoundingClientRect`, and how the Iron-Grid card
   rect maps to the cast's camera framing so the cast sits dead-center on its plinth at every breakpoint.
