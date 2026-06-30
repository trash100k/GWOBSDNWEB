# 42 — The Live GPGPU Fill Field for Branching Channel Pours

_Phase 2 deep-dive · GAELWORX forge world · cluster **C-flow-pour** · target: iPhone 15 OLED, one WebGL
renderer (r3f 8 + three r169), warm-forge palette · the files under the knife: `src/scene/FillField.js`
(new — the GPGPU rig), `src/scene/shaders.js` (the flood compute + the slab's `gwFill()` read),
`src/scene/forgeUniforms.js` (the shared pool `U`, +`uFillTex`/`uUseFillField`), `src/store.js`
(`forge.pourFront`/`forge.heat`)._

> **Reads on top of `00-COHESION-MAP.md`** (§1 the master temperature system — §1.3 names the analytic age
> derivation this doc *upgrades*; §2 the shared noise basis; §4.2 the master `U` pool; §7 rule 8 "shares the
> channel curve data three ways"; §10 the iPhone-15 budget), **`phase2/20`** (the arc-length knot bake — the
> baked capsules + windows this floods through), **`phase2/21`** (the four-fork rejoin graph — the topology
> this floods *across*), and **`phase2/27`** (the GPGPU ping-pong spark build — the *same* `HalfFloatType`/
> `NearestFilter`/`getCurrentRenderTarget` discipline, applied here to a *field* instead of *particles*).
> Where the cohesion map (§1.3) deliberately derives the fill **analytically** — "`age` is derived
> *analytically* from a left-to-right fill front (`uFillFront` vs a UV/arc-length coordinate) so the hero
> needs **no GPGPU ping-pong** on mobile" — and `phase2/21 §2C.1` lights four branches by declaring their
> arc-windows all start at `forkStartArc`, this document owns the **data-driven upgrade over analytic age**:
> a ping-pong FBO that *floods* the channel UV/world space so the front is **state**, not a formula —
> branches, merges, back-pressure, pooling, and uneven-speed wetting emerge from the field rather than being
> hand-declared. It is the **strict `high`-tier-only** enhancement the analytic ramp is the floor beneath.

---

## 1. SCOPE — this element in the GAELWORX world

The forge pours from the altar, runs the Celtic-interlace channels, **branches into four strands, weaves
over/under, and rejoins**, then fills the `GAELWORX` letterforms (`00 §0`; `phase2/20`/`21`). The *front of
that pour* — the white-hot leading edge of metal advancing through the carved knot — is the single most
watched motion in the **channel-hall chamber (`/automations`, top-down)**, the chamber whose entire reason to
exist is that the weave and the wetting are *fully legible* from above.

The cohesion map ships that front **analytically**: a scalar `uPourFront ∈ [0,1]` walks the one cumulative
arc-length axis (`phase2/20`), and each baked capsule segment carries a window `[startArc, endArc]`; a
fragment is "filled" when `uPourFront · uTotalLen > segStartArc` (`phase2/21 §4.5`). This is correct,
declarative, free, and **the right floor** — it is what ships on `low`/`static` and what the no-JS poster
freezes. But it has a ceiling baked into its honesty: the front is a *formula*, so it only knows what the
author declared. It cannot:

- **Pool.** Metal arriving at the degree-4 fork crotch (`phase2/21`) should *hesitate and well up* before it
  commits down all four children — back-pressure at a narrowing. An arc-window front simply teleports the
  fill value across the node.
- **Wet unevenly.** Real molten metal advances faster on a straight, slower into a tight bend, and *clings*
  to the groove walls (a meniscus that lags the centreline — `phase2/18`). The analytic front is a clean
  arc-length isocontour; it has no notion of the groove cross-section it is wetting.
- **Merge with mass conservation.** At the sink, four sub-fronts recombine; the analytic model just unions
  their windows. It cannot show the *fuller, slower, brighter* front that "four bodies became one" implies.
- **Respond to the strike with a travelling surge.** A `forge.strikeAt` pulse should send a *visible bright
  wave* down the already-wet channel — a ripple that propagates through the field, not a uniform flash.

The data-driven upgrade replaces "is the formula past my arc value?" with "**read my wetness from a texture
that a flood simulation wrote last frame.**" A small render-target field (`fillTex`) holds, per channel
texel, a scalar **fill amount** (0 = dry basalt, 1 = fully wet) and a **freshness** (seconds since wetting,
the cooling clock's `age`). Each frame a compute pass **floods** that field forward along the baked channel
graph — wetness spreads from wet neighbours into dry ones, gated by the channel mask, sourced at the altar,
sinking nowhere — so the front emerges as the *boundary of the flooded region*, and it branches, pools, and
rejoins because the *topology of the channel mask* makes it, not because the author declared four windows.

This is the **C-flow-pour** cluster's apex: the same pour-front the cohesion map (§7 rule 8) shares three
ways — channel fill, camera DOF focus, spark orbit (`phase2/27`) — now *driven by a field* the whole world
can sample. The hard scope boundary, repeated from the cohesion map's own §1.3 hedge: **this is `high`-tier
only.** The analytic ramp (`phase2/20`/`21`) is the floor on `low`/`static`; this floods *above* it,
binding the *same* `U.uPourFront`/`U.uHeat`/`gw_forge`, so a fragment reads identical color whether its
wetness came from a formula or a flood — only the *motion* of the front gets richer.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The field decomposes into four decisions: **(A)** what *is* the simulation substrate (texture ping-pong vs
compute buffer vs analytic); **(B)** how the flood *propagates* through the channel topology (neighbour
diffusion vs jump-flood vs full fluid); **(C)** what *space* the field lives in (channel-UV atlas vs world
slab vs arc-length 1D); **(D)** how the slab *reads* it back into the shared temperature system. Honest
tradeoffs below — every approach is judged against the iPhone-15 fill-rate envelope (`00 §10`) and the
one-renderer / no-WebGPU-on-the-judge-device constraint.

### 2A. The simulation substrate

**2A.1 — WebGL2 ping-pong FBO state texture (recommended).** The field is two `WebGLRenderTarget`s of
`HalfFloatType`/`NearestFilter` that ping-pong: frame N's output is frame N+1's input. A fullscreen "compute"
fragment shader reads the previous fill texture and writes the next — exactly the pattern the July-2025
Codrops/Medium GPGPU-in-R3F walkthroughs and Three.js Journey's *GPGPU Flow Field Particles* lesson run, and
exactly the pattern `phase2/27` already builds for sparks ("one texture holds the current state to be read,
another stores the result; swap after each iteration"). The difference from `phase2/27`: there each *texel is
a particle*; here each *texel is a place* in the channel (a UV/world cell), and the value is **wetness +
freshness**, not position + velocity. This is the **compute-state-texture** pattern Heckel's *Field Guide to
TSL and WebGPU* (Oct 2025) names as the FBO-ping-pong ancestor of the WebGPU `.compute()` pass — "a storage
buffer that continuously updates based on previous values," with the WebGL2 incarnation being two render
targets you swap. **Quality:** a genuinely living front — pooling, branching, surging — at trivial texel
count. **Perf:** one tiny extra pass (a 256² field is a postage stamp next to the near-full-screen molten
shader). **Mobile:** `HalfFloatType` is *mandatory*, not optional — iOS exposes `EXT_color_buffer_half_float`
but **not** `EXT_color_buffer_float`, so a `FloatType` field is silently non-renderable and the flood breaks
on the judge device (`phase2/27 §3.3`, the WebKit/Khronos threads). **Fit: the spine of this doc** — it
re-uses the spark rig's entire correctness discipline on the renderer we already ship.

**2A.2 — `GPUComputationRenderer` variable (the formal version of 2A.1).** three's bundled
`GPUComputationRenderer` (`three/examples/jsm/misc/GPUComputationRenderer.js`) formalizes the ping-pong:
`addVariable('textureFill', floodFrag, fill0)`, `setVariableDependencies`, `compute()`,
`getCurrentRenderTarget(var)`. `phase2/27 §4.2` already wires it for sparks. For a *single* state variable
(fill) with no second coupled variable, the helper is mild overkill versus a hand-rolled two-target swap
(`drei useFBO` ×2), but the win is **one rig pattern for the whole forge** — sparks and the fill field both go
through `GPUComputationRenderer`, same `setDataType(HalfFloatType)`, same `getCurrentRenderTarget` every
frame. **Fit: the recommended *implementation* of 2A.1** — reuse the spark rig's helper, don't hand-roll a
second FBO swapper.

**2A.3 — Analytic arc-window front (the floor this upgrades, reject as the `high` hero).** `uPourFront` vs a
baked window (`phase2/20`/`21`). Free, declarative, stateless, perfect for `low`/`static`. But it is a
*formula*, so it cannot pool, wet unevenly, or carry a travelling surge — the four limitations §1 lists.
**Keep it as the floor and the fallback; this doc is the field that floods *above* it.**

**2A.4 — WebGPU/TSL `.compute()` storage buffer (the 2026 destination, deferred).** With Safari 26 shipping
WebGPU (Sept 2025) and three r171+ making WebGPU production-ready, the field becomes a `storage` texture (or
`instancedArray`) updated by a `.compute()` pass — Heckel's *Field Guide* (Oct 2025) and Wawa Sensei's *GPGPU
particles with TSL & WebGPU* (2025) show the recipe, and "for a *stateful* sim you still read from buffer A,
write to buffer B, swap pointers next pass" (three.js forum, 2025) — **the ping-pong does not disappear**, so
the WebGL2 field this doc builds re-hosts 1:1. **Cons for the judge build:** the `WebGLRenderer →
WebGPURenderer` swap forces the postprocessing chain onto the node pipeline and the WebGL2-fallback branch is
less-tested (`00 §10`). **Authored-portable, not adopted in Phase 2** — same verdict as `phase2/27 §2.3`.

### 2B. How the flood propagates through the channel topology

**2B.1 — Gated neighbour-max diffusion (recommended).** The cheapest correct flood: each texel's next
wetness is the **max of its neighbours' wetness minus a step**, gated by the channel mask, so wetness can
only spread *into* channel cells and only *forward* from already-wet ones. A directional bias along the baked
channel **flow direction** (`uFlowTex`, the tangent of the nearest capsule — `phase2/20`'s parallel-transport
frame, baked to a texture) makes it flood *downstream*, not isotropically. This is a 1-tap-per-direction
fragment shader (4–8 neighbour samples), divergence is irrelevant (it's a scalar flood, not a vector field),
and it **branches and rejoins for free** because the channel mask's topology *is* the branch graph: where the
mask forks, the flood forks; where it rejoins, two flood fronts meet and the max merges them. **Quality:** a
genuinely topological front. **Perf:** ~6 taps over a 256² target. **Fit: the propagation rule** — it is the
flood-fill / wetting analogue of the reaction-diffusion ping-pong (Codrops *Reaction-Diffusion Compute
Shader*, 2024, actively cited 2025–26) without the second chemical.

**2B.2 — Jump-Flooding Algorithm (JFA) for the *distance-to-front*, not the front itself (a useful adjunct).**
JFA (Rong & Tan; Xor's *Mini: JFA* and demofox's distance-field write-ups, refreshed 2025–26) floods a
nearest-seed/distance field in `O(log n)` passes by sampling neighbours at *halving* jump distances. It is
the canonical GPU flood, and it is the *right tool* if what you want is "distance from every basalt texel to
the nearest wet metal" (which `phase2/25`'s spark-stone light and the Ogham reveal could consume) — but it is
**not** the right tool for the *advancing wetness front itself*, because JFA gives you a static distance
transform of a fixed seed set, not a front that *advances over time* with pooling and surge. **Fit: an
optional `high`-tier adjunct** — run JFA *once* off the flooded region each frame to get a cheap
"distance-to-wet-metal" field for the stone-light falloff, but the *pour front* is the time-stepped diffusion
of 2B.1, not JFA. (Listed because the brief names flood-fill, and JFA is the flood-fill literature's
headline — the honest answer is it solves a *different* flood than the pour front needs.)

**2B.3 — Full Stable-Fluids advection (`three-fluid-fx`, reject as the channel-fill hero).** `three-fluid-fx`
(MIT, `three >= 0.183`, WebGL/GLSL + WebGPU/TSL pipelines, 2025–26) packages Jos Stam's Stable Fluids (advect
→ diffuse → project velocity, Jacobi pressure solve, vorticity confinement, optional BFECC) and outputs
`velocityTexture`/`densityTexture`/`dyeTexture`. Sachin Sharma's *Fluid Physics in Three.js* (2026) walks the
same advect/diffuse/project loop on ping-pong targets. This is *gorgeous* and is the right call for an
**unconstrained** dye field (the casting-room's free molten surface, the cursor-splat overlays). But for the
**channel** pour it is the wrong abstraction: the metal must flow *exactly* down the hand-authored sacred knot
(`phase2/20`/`21`), not wherever a pressure solve pushes it. A full fluid sim fights the designed path, costs
~6–25× the diffusion flood (the library's own `balanced`/`quality` profiles are 256²/384² with 12–20 pressure
iterations), and owns its own look — colliding with the single-`uTemp` cohesion rule. **Reject for the
channel; it is the casting-room free-surface tool, not the channel-flood tool.** (The diffusion flood of 2B.1
is the *channel-constrained* special case that gets the branching/pooling read for ~1/20th the cost.)

**2B.4 — Per-branch 1D arc-length flood (the cheapest data-driven middle ground).** Instead of a 2D field,
flood a *1D* texture indexed by arc-length: one row per branch, wetness advancing along the column. This is
the *minimal* data-driven upgrade — it pools and surges (it's stateful) but loses the cross-channel meniscus
and the world-space pooling at the crotch. **Fit: a `low`-tier-curious middle rung** between the analytic
front and the full 2D field — but since `low` already has the analytic floor, the 2D field of 2B.1 is the
*only* data-driven tier worth building, and 1D adds a third codepath for little gain. **Note as the fallback
flood if 2D proves too costly on a thermally-throttled A16, otherwise skip.**

### 2C. What space the field lives in

**2C.1 — World-space slab UV (recommended).** The field is a texture over the **same UV the basalt slab plane
uses** (`phase2/21 §4.6`'s `planeGeometry`), so a slab fragment reads its wetness with a single
`texture2D(uFillTex, vUv)` — no atlas indirection, no unwrap. The channel mask, the flow-direction texture,
and the fill field all share the slab's UV; the flood happens in the same space the carve (`phase2/21`'s
`gwChannel`) already evaluates. **Quality:** exact registration between carve and fill (no seam between "where
the groove is" and "where the metal is"). **Perf:** the field resolution (256²) is *independent* of screen
resolution — it floods in its own little target and the slab samples it. **Fit: the field space** — it is the
one space the carve, the flood, and the read all already share.

**2C.2 — Channel arc-length atlas (reject — premature indirection).** Pack each branch's groove into atlas
rows and flood there, then scatter back via a UV→atlas map. This *could* give higher effective resolution
along thin grooves, but it needs a baked UV→atlas indirection texture, it complicates the four-fork rejoin
(two atlas rows must merge), and it buys resolution the top-down channel-hall doesn't need (the grooves are
fat on screen from above). **Reject — the world-UV field (2C.1) is simpler and registers exactly.**

### 2D. How the slab reads the field back into the temperature system

**2D.1 — `wetness` drives `filled`, `freshness` drives `age` (recommended).** The flooded field's two
channels map *directly* onto the cohesion map's two existing scalars: `fill.r = wetness` replaces the
analytic `step(arc0, front)` ("am I metal yet?"), and `fill.g = freshness` (seconds since wetting) *is* the
`age` that §1.3's `gwCool01(age)` already consumes ("how cooled am I?"). So the field doesn't add a new
look-path — it **feeds the existing temperature pipeline** at the two points the analytic front fed. The
moving white-hot lip is `smoothstep` of the wetness gradient (`fwidth(wetness)` — bright where wetness is
*changing*, i.e. the advancing front). **Fit: the read** — the field is a *driver* of `gw_forge`, never a
second color.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A WebGL2 GPGPU ping-pong fill field via three's bundled `GPUComputationRenderer` (2A.2), `HalfFloatType` +
`NearestFilter`, a single `textureFill` variable carrying `(wetness, freshness)` per slab-UV texel, flooded
each frame by gated neighbour-max diffusion biased along a baked flow-direction texture (2B.1) and masked to
the baked channel SDF (2C.1), sourced at the altar and surged by `U.uHeat`; the slab reads `wetness → filled`
and `freshness → age` into the *shared* `gw_forge`/`gwCool01` pipeline (2D.1); strictly `high`-tier, with the
analytic arc-window front (`phase2/20`/`21`, 2A.3) as the floor on `low`/`static` and the fallback if
`gpu.init()` fails or the `PerformanceMonitor` factor dips.** An optional JFA pass (2B.2) off the flooded
region feeds a cheap "distance-to-wet-metal" field to the stone-light falloff on `high` only.

**Why this and not the alternatives.** The brief is precise: make the front *data-driven* (branches, merges)
"rather than a UV-x ramp." The diffusion-flood field does exactly that — the front branches and rejoins
because the *channel mask topology* makes it, and it pools/surges because it is *state*, not a formula. We
reject the full fluid sim (2B.3) because the metal must flow down the *designed* sacred knot, not a pressure
solve, and because it costs ~20× and owns its own look. We reject JFA-as-the-front (2B.2) because it is a
static distance transform, not an advancing front — but we keep it as a cheap adjunct for the stone-light
distance falloff. We live in world-UV (2C.1) so the carve, the flood, and the read share one space with no
atlas indirection. And critically, we bind the **same `U` pool and the same `gw_forge`/`gwCool01`** as the
analytic floor (2D.1), so the field is a *richer driver of the existing pipeline*, never a parallel
look — a fragment reads identical color whether its wetness came from the formula or the flood. Everything
reuses the codebase's idioms and the spark rig's correctness discipline (`phase2/27`): `GPUComputationRenderer`,
`HalfFloatType`, `NearestFilter`, `getCurrentRenderTarget` every frame, dt-clamp, `dispose()` on unmount,
`v3(PAL.*)`, the shared `U` references. **Zero new npm dependency** — `GPUComputationRenderer` is bundled with
`three`. This is the *data-driven upgrade over analytic age* the brief asks for, gated behind the strict
high-tier the cohesion map's §1.3 hedge demands.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js** — repo pin (`^0.169`). Use the **bundled `GPUComputationRenderer`**
  (`three/examples/jsm/misc/GPUComputationRenderer.js`) — **no new dependency** (same helper as `phase2/27`).
- **`@react-three/fiber` ^8.17 / `@react-three/drei` ^9.114** — installed; nothing added.
- **Bake-time (build, not runtime):** `CatmullRomCurve3` arc-length sampling (`phase2/20`) to rasterize two
  static textures into the slab UV — `uChannelMaskTex` (1 inside the groove, 0 outside) and `uFlowTex`
  (RG = the unit downstream tangent at each channel texel, from the parallel-transport frame). These bake
  once at module load (or ship as tiny PNGs) — **no per-frame curve work**.
- **Reuse in-repo:** `gw_forge`/`gw_divineFire`/`gw_tempColor`/`gw_tempEmissive`/`gwCool01` (`shaders.js`,
  `phase2/01`/`02`, `00 §1`), `gw_fbm`/`gw_snoise` (the shared noise, `00 §2`), `PAL`/`v3` (`palette.js`), the
  master pool `U` (`forgeUniforms.js`, `00 §4.2`), `forge`/`damp` (`store.js`), the baked `KNOT`/arc-windows
  (`phase2/20`/`21`) — the analytic floor stays as the fallback and seeds the flood's source point.
- **Deferred (post-judge, WebGPU only):** `three/webgpu` + `three/tsl` `storageTexture` + `.compute()` (Heckel
  *Field Guide*, Oct 2025; Wawa Sensei TSL GPGPU, 2025).

### 4.2 The GPGPU fill-field rig (`src/scene/FillField.js`)

`HalfFloatType` + `NearestFilter` are the make-or-break setup, identical to `phase2/27 §4.2`. The field
resolution is a knob, **not** tied to screen res — 256² floods a fat top-down channel handsomely; 128² on a
throttled device.

```js
// src/scene/FillField.js
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import * as THREE from 'three'
import { floodFrag } from './fillCompute.js'     // GLSL string (§4.3)

export function makeFillField(gl, U, { size = 256, maskTex, flowTex } = {}) {
  const gpu = new GPUComputationRenderer(size, size, gl)
  gpu.setDataType(THREE.HalfFloatType)            // iOS has no FP32 RT — FloatType silently fails (phase2/27)

  const fill0 = gpu.createTexture()               // r = wetness 0..1, g = freshness (age, secs), b/a spare
  // start fully DRY: HalfFloat-safe zero-fill (createTexture already zeros the Uint16 buffer)

  const fillVar = gpu.addVariable('textureFill', floodFrag, fill0)
  gpu.setVariableDependencies(fillVar, [fillVar]) // single state variable: floods from its own last frame
  fillVar.minFilter = THREE.NearestFilter         // linear interp corrupts packed state (the GPGPU footgun)
  fillVar.magFilter = THREE.NearestFilter
  fillVar.wrapS = fillVar.wrapT = THREE.ClampToEdgeWrapping

  const u = fillVar.material.uniforms
  u.uDt        = { value: 0 }                      // clamped on CPU each frame
  u.uHeat      = U.uHeat                           // SHARED ref — strike surges the flood (cohesion §4.2)
  u.uPourFront = U.uPourFront                      // SHARED ref — analytic front seeds the source extent
  u.uMask      = { value: maskTex }                // baked: 1 inside groove, 0 outside (gates the flood)
  u.uFlow      = { value: flowTex }                // baked: RG = downstream tangent (biases the flood)
  u.uTexel     = { value: new THREE.Vector2(1 / size, 1 / size) }
  u.uSpread    = { value: 1.35 }                   // flood speed (cells/sec scale) — leva-tunable
  u.uSource    = { value: new THREE.Vector2(0.50, 0.02) }  // the altar feed point (KNOT.source start, UV)

  const err = gpu.init()
  if (err !== null) { console.warn('[FillField] GPGPU init failed → analytic fallback', err); return null }
  return { gpu, fillVar, dispose: () => gpu.dispose?.() }
}
```

`gpu.init()` non-null is the **fallback gate**: if HalfFloat RTs aren't renderable (shouldn't happen on A16),
return null and the consumer (§4.6) drops to the analytic arc-window front (`phase2/21`) — never a dry channel.

### 4.3 The flood compute pass (`src/scene/fillCompute.js`) — gated neighbour-max + flow bias + source + surge

The whole data-driven story is this one shader. Wetness can only enter **channel** cells (mask-gated), spreads
**downstream** (flow-biased neighbour-max), is **sourced** at the altar (clamped to 1 where the pour begins),
and **ages** wherever wet. The strike rides `uHeat` into the spread rate, sending a travelling surge.

```glsl
// fillCompute.js — floodFrag. textureFill provided by GPUComputationRenderer.
uniform float uDt, uHeat, uSpread;
uniform vec2  uTexel, uSource;
uniform sampler2D uMask, uFlow;
// gw_fbm inlined from shaders.js (the shared basis) — a whisper of noise so the front edge isn't a clean arc.

void main(){
  vec2 uv   = gl_FragCoord.xy / resolution.xy;        // resolution injected by GPUComputationRenderer
  float mask = texture2D(uMask, uv).r;                // 1 = inside groove, 0 = basalt
  vec4 self  = texture2D(textureFill, uv);            // r = wetness, g = freshness(age)
  float wet  = self.r;

  if (mask < 0.5){ gl_FragColor = vec4(0.0); return; } // dry basalt stays dry — the flood is channel-bound

  // ---- FLOW-BIASED NEIGHBOUR-MAX: wetness spreads downstream from wet neighbours ----
  vec2 flow = texture2D(uFlow, uv).rg * 2.0 - 1.0;     // baked downstream tangent (parallel-transport, ph20)
  float inflow = wet;
  // sample the 4 axis neighbours; weight by how "downstream-of-them" we are (dot with their flow → us)
  vec2 dirs[4]; dirs[0]=vec2(1,0); dirs[1]=vec2(-1,0); dirs[2]=vec2(0,1); dirs[3]=vec2(0,-1);
  for(int i=0;i<4;i++){
    vec2 nuv = uv + dirs[i]*uTexel;
    if (texture2D(uMask, nuv).r < 0.5) continue;       // never pull wetness from outside the channel
    vec4 nb  = texture2D(textureFill, nuv);
    vec2 nfl = texture2D(uFlow, nuv).rg * 2.0 - 1.0;
    float downstream = max(dot(nfl, dirs[i]), 0.0);    // 1 if this neighbour flows TOWARD us → it feeds us
    inflow = max(inflow, nb.r * (0.55 + 0.45*downstream)); // max-merge: branches/rejoins emerge from the mask
  }

  // ---- SPREAD: advance wetness toward inflow at a heat-surged rate (the strike = a travelling wave) ----
  float rate = uSpread * (0.8 + 1.6*uHeat) * uDt;      // uHeat surges the front → a bright wave down the run
  rate *= 0.9 + 0.2*gw_fbm(uv*40.0);                   // shared-noise jitter → meniscus wobble, not a clean arc
  wet = clamp(max(wet, inflow - (1.0 - rate)), 0.0, 1.0);

  // ---- SOURCE: the altar feed is always fully wet (clamped to 1) so the flood has an origin ----
  float srcD = distance(uv, uSource);
  wet = max(wet, smoothstep(0.04, 0.0, srcD));         // a small always-wet disc at the pour origin

  // ---- FRESHNESS (age): tick up wherever wet; the cooling clock reads THIS (cohesion §1.3) ----
  float fresh = (wet > 0.01) ? self.g + uDt : 0.0;     // seconds since this cell first wetted

  gl_FragColor = vec4(wet, fresh, 0.0, 1.0);
}
```

The two ideas that make this **data-driven and not a ramp**: **(1)** the front is the *boundary of the
flooded region*, so it **branches where the mask forks and rejoins where two flood fronts meet** — the
`max(inflow, …)` merge at the sink is "the fuller of the two arriving bodies wins," which is mass-conserving
enough to read as "four became one." **(2)** wetness is *state* — last frame's value is this frame's input —
so a strike (`uHeat` surge) doesn't teleport the front; it *accelerates the spread*, sending a visible bright
wave down the already-wet channel (the `freshness` resets low at the wave, so `gwCool01` re-heats it). Pooling
at the crotch falls out for free: the four children's mask cells are narrow, so the flood *accumulates* at the
wide fork before committing — back-pressure the analytic front cannot show.

### 4.4 The slab reads the field (`shaders.js` — `gwFill()` replaces the analytic `filled`/`age`)

The slab's channel COLOR block (`phase2/21 §4.5`) currently computes `filled = step(arc0, front)` and an
analytic `age`. The field swaps *both* for one texture fetch — and falls back to analytic when the field is
off (`uUseFillField = 0` on `low`/`static`):

```glsl
uniform sampler2D uFillTex;     // r = wetness, g = freshness(age) — the flooded field (GPGPU)
uniform float     uUseFillField; // 1 on high (field on), 0 on low/static (analytic floor)

// returns vec2(filled 0..1, age seconds) — from the FIELD on high, the ANALYTIC FRONT on low.
vec2 gwFill(vec2 uv, float arc0, float segArcLocal){
  // --- analytic floor (phase2/20/21): the formula front ---
  float front     = uPourFront * uTotalLen;
  float aFilled   = step(arc0, front);
  float aAge      = max(front - (arc0 + segArcLocal), 0.0) * uCoolRate;  // §1.3 analytic age
  // --- data-driven field (high): wetness + freshness flooded last frame ---
  vec4  f         = texture2D(uFillTex, uv);
  float fFilled   = smoothstep(0.05, 0.35, f.r);    // wet → filled (soft so the meniscus reads)
  float fAge      = f.g;                             // freshness IS age (cohesion §1.3)
  return mix(vec2(aFilled, aAge), vec2(fFilled, fAge), uUseFillField);
}

// the moving WHITE-HOT lip = where wetness is CHANGING (the advancing front), from the field gradient:
float gwFrontLip(vec2 uv){
  float w = texture2D(uFillTex, uv).r;
  return smoothstep(0.0, 0.18, fwidth(w) * 6.0) * step(0.05, w);  // bright at the wetness boundary only
}
```

Then the existing color path is unchanged — it just reads `gwFill` instead of the inline analytic test:

```glsl
vec2  fa    = gwFill(vUv, arc0, segArcLocal);        // (filled, age)
float temp  = fa.x * (0.40 + 0.60 * gw_fbm(vUv*6.0 + uTime*0.1)); // SAME molten churn (shared noise)
temp        = mix(temp, 1.0, gwFrontLip(vUv) * fa.x);  // white-hot moving lip from the field gradient
float cool  = gwCool01(fa.y, uCoolRate);             // SAME cooling curve — freshness drives it (§1.3)
temp       *= (1.0 - cool * 0.85);                   // cool the metal behind the front
vec3  metal = gw_forge(temp);                        // THE shared master ramp (cohesion §1)
metal       = mix(metal, gw_divineFire(uHeat), uIsAEStrand); // A/E carried through, never cools (§1.4)
```

The cohesion payoff is exact: `filled` and `age` are the *same two scalars* the analytic floor produced, so
`gw_forge`/`gwCool01`/`gw_divineFire` are **untouched** — the field enriches the *motion* of those scalars,
never their *meaning*. Toggle `uUseFillField` and the look is identical at steady state; only the front's
*behaviour* (pooling, branching, surging) changes.

### 4.5 The r3f component shape (mounts the rig, drives it, feeds the slab)

```jsx
// src/scene/FillField.jsx — headless: owns the GPGPU rig, writes U.uFillTex for the slab to sample.
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import React from 'react'
import { forge } from '../store.js'
import { U } from './forgeUniforms.js'
import { makeFillField } from './FillField.js'
import { bakeChannelTextures } from './knotBake.js'   // phase2/20: mask + flow textures from KNOT

export default function FillFieldDriver({ size = 256 }) {
  const { gl } = useThree()
  const on = forge.quality === 'high'                 // STRICT high-tier only (cohesion §1.3 hedge)

  const baked = React.useMemo(() => bakeChannelTextures(size), [size]) // {maskTex, flowTex} — build-time
  const rig = React.useMemo(
    () => (on ? makeFillField(gl, U, { size, ...baked }) : null), [gl, on, size, baked])

  // tell every slab material whether to flood or fall back (shared uniform, cohesion §4.2)
  React.useEffect(() => { U.uUseFillField.value = (on && rig) ? 1 : 0 }, [on, rig])
  React.useEffect(() => () => { rig?.dispose() }, [rig])  // DISPOSE float RTs (leak → fast OOM, 00 §4.3)

  useFrame((_, dt) => {
    if (!on || !rig) return
    const dtc = Math.min(dt, 1 / 30)                   // (1) dt-CLAMP — tab-restore dt floods to 1 instantly
    rig.fillVar.material.uniforms.uDt.value = dtc      // (2) feed clamped dt
    // U.uHeat / U.uPourFront already driven by <ForgeDriver/> (the one writer) — shared refs, no second rAF
    rig.gpu.compute()                                  // (3) ping-pong: flood one step
    // (4) getCurrentRenderTarget EVERY frame — the target swaps each compute; a cached ref freezes the field
    U.uFillTex.value = rig.gpu.getCurrentRenderTarget(rig.fillVar).texture
  })
  return null
}
```

The **four GPGPU disciplines** (numbered) are the entire correctness story, identical to `phase2/27 §4.6`:
**(1)** clamp dt (an unclamped tab-restore `dt` floods the whole channel to 1 in one frame — the front
vanishes); **(2)** feed it to the pass; **(3)** `compute()` ping-pongs the flood one step; **(4)**
`getCurrentRenderTarget` *every frame* (the targets swap on each `compute()`; a cached texture reference points
at last frame's buffer and the field freezes — the #2 GPGPU bug after the read-write race). Mount this once in
`ForgeCanvas`, gated by `forge.route === '/automations'` (and the casting-room) so it floods where the channel
is the hero and stays unmounted in the scrying-pool.

### 4.6 The slab's binding + the fallback wiring

The slab material (`CelticChannels`, `phase2/21 §4.6`) binds `uFillTex`/`uUseFillField` from `U` in
`onBeforeCompile` — the *same references* `FillFieldDriver` writes:

```jsx
// inside CelticChannels onBeforeCompile (phase2/21):
Object.assign(sh.uniforms, U)   // brings uFillTex, uUseFillField, uHeat, uPourFront, uTotalLen, uCoolRate…
// add to forgeUniforms.js pool U:  uFillTex:{value:null}, uUseFillField:{value:0}
```

When `FillFieldDriver` is unmounted or `gpu.init()` failed, `U.uUseFillField.value` stays `0` and `gwFill`
returns the analytic arc-window front (`phase2/20`/`21`) — **the channel is never dry**, the field is a pure
enhancement layered over a complete floor.

### 4.7 Key uniforms & parameters

| Uniform / param | Tier-set / source | Role |
|---|---|---|
| field `size` | 256 high / 128 throttled | flood-target resolution (independent of screen res) |
| RT type | **`HalfFloatType`** (forced) | iOS has no FP32 RT — `FloatType` silently fails (`phase2/27`) |
| filter | **`NearestFilter`** (forced) | linear interp corrupts packed wetness/freshness |
| `uMask` | baked `bakeChannelTextures` | 1 inside groove → gates the flood to the channel topology |
| `uFlow` | baked parallel-transport tangent (`phase2/20`) | biases the flood **downstream**, not isotropic |
| `uDt` | `Math.min(dt, 1/30)` | dt-correct, hitch-proof flood step |
| `uHeat` | **shared** `U.uHeat` (damped `forge.heat`) | surges the spread rate → a travelling bright wave |
| `uPourFront` | **shared** `U.uPourFront` | analytic floor's front + the field's source extent |
| `uSpread` | ~1.35, leva-tunable | base flood speed (cells/sec scale) |
| `uSource` | `KNOT.source` start UV | the always-wet altar origin of the flood |
| `uFillTex` | written by `FillFieldDriver` | the flooded `(wetness, freshness)` the slab samples |
| `uUseFillField` | `1` high / `0` low/static | flood vs analytic floor — the tier + fallback gate |

### 4.8 How it hooks the shared master temperature system

The field **never invents heat, color, or a clock.** It produces exactly two scalars — `wetness` and
`freshness` — and those are the *same two* (`filled`, `age`) the analytic floor produced (`00 §1.3`). The slab
feeds them into the *unchanged* `gw_forge(temp)` ramp and `gwCool01(age)` cooling curve from `shaders.js`
(`00 §1`), so the metal the field wets is *visibly the same cooling body* as the slab veins, the sparks
(`phase2/27`), and the wordmark fill. The flood's spread rate rides the **shared `U.uHeat`** reference
`<ForgeDriver/>` drives (the one writer, `00 §4.2`), so a `forge.strikeAt` pulse surges the flood, the slab
veins, the jewel edges, and the spark cores **in the same frame** (`00 §7` rule 6) — the surge travelling down
the channel *is* that one heartbeat made visible in the pour. The flood's source is `KNOT.source` and its
topology is the baked channel mask (`phase2/20`/`21`) — the *same one knot consumed three ways* (`00 §7`
rule 8): the field, the carve, the camera focus, and the spark orbit all read one curve. The A/E exception is
carried, not stamped: a strand feeding the first `A`/`E` routes its metal to `gw_divineFire` (`00 §1.4`)
*after* the field decides it's wet — the flood wets it, the keystone rule colors it white-gold and eternal.

---

## 5. COHESION — shared palette / lighting / uniforms with the world

- **One temperature authority.** The field outputs `(wetness, freshness)`; the slab maps them to the *same*
  `filled`/`age` the analytic floor used and colors via `gw_forge` + cools via `gwCool01` (`00 §1`,
  unchanged). A flooded fragment and a slab vein are *visibly the same metal* because they sample one ramp and
  one cooling curve. No private orange, no second cooling formula (`00 §7` rule 1).
- **One noise basis.** The flood's meniscus jitter and the molten churn behind the front both use shared
  `gw_fbm`/`gw_snoise` at the shared `GW_FBM_OCTAVES` (`00 §2`) — the field's wobble is the *same grain* as the
  metal's flow and the basalt's stone; the data-driven front never introduces a new texture frequency
  (`00 §7` rule 2).
- **One uniform pool, one clock.** The rig binds the **same `U.uHeat`/`U.uPourFront`/`U.uTime` references**
  (`00 §4.2`) and runs in the existing single `useFrame`, dt-clamped — never a second rAF or `setInterval`,
  frozen on `static` (`00 §7` rule 6). A strike surges the flood in lockstep with the whole world; that
  synchrony *is* the cohesion proof — and here it is *visible as a travelling wave*, the richest possible
  expression of the one heartbeat.
- **One palette, one bloom contract.** Color is `PAL` via `v3()` inside `gw_forge`; only the white-hot moving
  lip (the wetness gradient, `fwidth`) and the A/E exceed 1.0, so the existing `mipmapBlur` bloom
  (`luminanceThreshold ≈ 0.55`) catches exactly the advancing front and nothing else — the palette *is* the
  bloom selector (`00 §3.1`, §5.1). The cooled metal behind the front and the dry basalt stay ≤1 and true-black
  on OLED. No fill-field bloom pass.
- **One light model, shared with the stone reveal.** The optional JFA adjunct (2B.2) turns the flooded region
  into a "distance-to-wet-metal" field the basalt/Ogham reveal (`phase2/22`/`24`/`25`) can read — so the
  *carved lore lights up as the metal floods past it*, on the same `uAEFire`/proximity signal the rest of the
  world uses (`00 §5.2`). The metal is still the only light (`00 §5`).
- **Shared pour-front, three ways → now four.** `U.uPourFront` (analytic) + `uFillTex` (flooded) are read by
  the channel fill, the camera DOF focus, the sparks (`phase2/27`), *and* this field — one knot, one clock,
  the flood is the data-driven *body* the formula front was the skeleton of (`00 §7` rule 8).
- **The keystone, carried not stamped.** A strand feeding the first `A`/`E` floods wet like any other, then
  routes to `gw_divineFire` (white-gold, eternal) — the same first-A/first-E rule as the DOM `.forge-letter`,
  the 3D wordmark, the basalt reveal, the Ogham, and the sparks (`00 §1.4`, §7 rule 5). The field wets it; the
  rule ignites it.
- **One degrade ladder.** The field is the `high` rung *above* the analytic floor (`low`/`static`) — a tier
  drop swaps the *driver* of `filled`/`age`, never the *look* (`00 §7` rule 9). The world reads the same; only
  the front's behaviour simplifies.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The world is **fill-rate bound, not triangle bound** (`00 §10`). This element's cost is **one tiny extra
compute pass per frame** plus **one texture fetch per slab fragment** — both trivial next to the
near-full-screen molten shader.

- **The flood pass is a postage stamp.** A 256² field is one fragment pass over **65,536 texels** with ~6
  neighbour taps each — a few hundred microseconds on A16, *orders of magnitude* cheaper than the
  near-full-screen (≈1M-pixel at DPR 1.5) molten/vein shader it feeds. 128² (16k texels) on a throttled device
  is nothing. This is the entire reason the data-driven upgrade fits: the *flood* is small; only the *read* is
  full-screen, and the read is one extra `texture2D`.
- **`HalfFloatType` is correctness *and* speed.** Required on iOS (no FP32 RT, `EXT_color_buffer_float` absent
  — `phase2/27 §3.3`) **and** faster than `FloatType` on tile-based mobile GPUs. The `(wetness, freshness)`
  range (0..1 and 0..~10s) sits comfortably in half-float precision. Non-negotiable, not a tuning choice.
- **The slab read is one fetch.** `gwFill` adds one `texture2D(uFillTex, vUv)` (+ `fwidth` for the lip) to a
  shader that already does multi-octave `gw_fbm` — sub-1% of the slab's existing fill-rate. It *replaces* the
  analytic `step`/`age` math, so the net add is ~one fetch.
- **No extra full-screen passes.** Unlike the full fluid sim (2B.3, multiple Jacobi pressure iterations) or a
  per-frame JFA front (`O(log n)` passes), the diffusion flood is **one pass**. The optional JFA *adjunct* (for
  stone-light distance) is `high`-only and runs `log2(256) ≈ 8` passes over the *tiny* 256² field once — still
  a postage stamp, gated off the moment the `PerformanceMonitor` factor dips.
- **The three tiers (uniform degrade, `00 §7` rule 9):**
  - **`high`** — 256² GPGPU flood field, flow-biased + sourced + heat-surged, slab reads `uFillTex`; optional
    JFA distance adjunct for the stone reveal. The living, pooling, branching front.
  - **`low`** — **drop the field entirely** → `U.uUseFillField = 0`, the slab reads the analytic arc-window
    front (`phase2/20`/`21`). No render targets, no float-RT dependency, no ping-pong — the safer, cheaper
    rung. Still branches and rejoins (the windows share `forkStartArc`); it just can't pool or surge.
  - **`static`** (reduced-motion / weak GPU / no-WebGL) — `frameloop='demand'`, field skipped, `uPourFront`
    frozen at a **mid-pour pose** (the front just split across the fork — the most legible frame), the analytic
    floor renders it. A dignified frozen "the pour divides" still; the DOM Cinzel wordmark is the no-JS/AEO
    truth.
- **The fallback gate.** `gpu.init()` non-null (HalfFloat RT not renderable) → `U.uUseFillField` stays `0`,
  analytic floor renders — **never a dry channel**. Also degrade field→analytic under sustained thermal
  pressure via the `PerformanceMonitor` factor read from the mutable `forge` store (never React state
  mid-scroll, `phase2/27 §6`).
- **Alloc-free, dispose-everything.** No `new` in `useFrame` (INP); `rig.dispose()` (the two ping-pong RTs) on
  unmount — **leaked float RTs are a fast mobile OOM** (`00 §4.3`). `renderer.info.memory` must be flat across
  navigation (the field is `backdrop + one chamber`, never accumulated).
- **Bake-time only.** The mask + flow textures rasterize once at module load (or ship as tiny PNGs); no
  per-frame curve work, no per-frame texture upload (the field updates itself on the GPU via ping-pong).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls, ranked by cost (the first four are shared with `phase2/27`'s GPGPU rig — same disease, same cure):**

1. **`FloatType` render targets on iOS (the silent killer).** iOS exposes only
   `EXT_color_buffer_half_float`, not `EXT_color_buffer_float` — a `FloatType` field is **not
   color-renderable**, the flood writes nothing, the channel is dry on the device while it works in desktop
   Chrome. **Force `HalfFloatType`.** (`phase2/27`, WebKit/Khronos threads.)
2. **Caching the field texture (the freeze bug).** The ping-pong swaps targets on every `compute()`. Read
   `getCurrentRenderTarget(fillVar).texture` **inside `useFrame` every frame**; a memoized reference points at
   a stale buffer and the front stops advancing (or flickers between two frames).
3. **Linear filtering on the field (corrupted wetness).** `NearestFilter` on the field variable — linear
   interpolation across texels smears the packed `(wetness, freshness)` and the front dissolves into mush.
4. **Unclamped `dt` (instant flood).** A tab-restore `dt` advances the spread to 1 across the whole channel in
   one frame — the front vanishes and the channel is uniformly wet. `Math.min(dt, 1/30)`.
5. **Isotropic flood (no flow bias) reads as a stain, not a pour.** Without the `uFlow` downstream bias, the
   neighbour-max spreads wetness *backward* up the channel too, and the front looks like ink soaking outward
   rather than metal pouring forward. The `dot(neighbourFlow, dirToUs)` gate is what makes it *pour*. Bake the
   flow texture from the parallel-transport tangent (`phase2/20`), not a guess.
6. **The flood leaks out of the channel.** If the mask gate (`if(mask<0.5) return 0`) is missing or the mask is
   soft-edged, wetness bleeds into the basalt and the carved knot dissolves. Mask must be **hard-edged** (1
   inside the groove, 0 outside) and gate *both* the self-cell and every neighbour sample.
7. **The crotch over-pools into a permanent blob.** At the fork, wetness *should* well up briefly — but if the
   source keeps clamping cells to 1 faster than they drain downstream, the crotch saturates and never necks.
   Tune `uSpread` so the downstream rate exceeds the source inflow once the front has passed; the pool is a
   *transient*, not a steady state. (Verify by watching a strike pulse travel *through* the fork, not stall.)
8. **The white-hot lip is everywhere or nowhere.** The lip is `fwidth(wetness)` — bright where wetness is
   *changing*. If `fwidth` is scaled wrong, either the whole wet region glows (lip too fat → permanent flare,
   blooms the channel) or nothing does (lip too thin → no front read). Tune `gwFrontLip`'s `smoothstep`
   against the bloom threshold on the device.
9. **Field and analytic disagree at the tier boundary.** Toggling `uUseFillField` must not *jump* the look —
   the field's steady-state `filled`/`age` must match the analytic floor's, or a thermal demotion mid-scroll
   pops. Calibrate `gwFill`'s `smoothstep(0.05, 0.35, wetness)` so a fully-flooded channel reads the same as a
   fully-arc-filled one.
10. **A/E reaching the temperature ramp.** A strand feeding the first `A`/`E` must route to `gw_divineFire`
    *after* the field wets it and **never cool** (`00 §1.4` keystone) — keep the branch hard-separated, exactly
    as the analytic path does.
11. **Leaking float RTs / forgetting `static`.** Not disposing the rig is a fast mobile OOM. And reduced-motion
    must show a believable frozen *split* pose via the analytic floor; the channel-hall page still needs real
    HTML copy independent of the canvas (`aeo-geo` rule).

**Order of operations (each step verified the repo way: `npm run build` green → `qa-route` at 393×852 +
1440×900 with 0 console errors → then the iPhone 15 OLED read):**

1. **Land the analytic floor first.** Confirm `phase2/20`/`21`'s arc-window front renders the channel-hall
   correctly with `uUseFillField = 0`. The field is an *enhancement*; the floor must be right before it.
2. **Bake the mask + flow textures** (`bakeChannelTextures`) from `KNOT` and *render them as debug overlays* —
   confirm the mask hugs the groove and the flow arrows point downstream through the fork and rejoin.
3. **Stand up the GPGPU rig with a trivial flood** (source disc only, no flow bias) and confirm the **ping-pong
   actually swaps** — read `getCurrentRenderTarget` every frame, `HalfFloatType`, `NearestFilter`. A wet disc
   that *grows* = the rig works; a frozen/garbage disc = a setup bug (RT type/filter/cached texture), not a
   logic bug.
4. **Add the mask gate** — confirm wetness stays *inside* the channel and the carved knot survives.
5. **Add the flow-biased neighbour-max** — confirm the flood *pours downstream*, branches at the fork, and
   rejoins at the sink (the data-driven payoff). If it spreads backward, the flow bias is wrong.
6. **Wire the slab read** (`gwFill`/`gwFrontLip`) and confirm `filled`/`age` feed the *unchanged* `gw_forge`/
   `gwCool01` — toggle `uUseFillField` and confirm steady-state parity with the analytic floor (no jump).
7. **Add the white-hot lip** from `fwidth(wetness)` and tune it against the bloom threshold on the device.
8. **Wire the shared `forge.heat`** and confirm a strike sends a *visible travelling surge* down the channel in
   the same frame the slab veins flare (the cohesion proof, now *seen* as a wave).
9. **Stamp the A/E** on any strand feeding the first `A`/`E`; verify divine fire is carried through the flood
   white-gold and eternal while siblings cool.
10. **Gate tiers** (`high` field / `low` analytic / `static` frozen-split), the `gpu.init()` fallback, and the
    `PerformanceMonitor` demotion. **Optional:** the JFA distance adjunct for the stone reveal, `high` only.
11. **Device read on the iPhone 15 OLED** — the pooling crotch, the branching/rejoining front, the travelling
    strike surge, the white-hot lip, the white-gold A/E carried through, and the true-black void do **not**
    simulate headless.

---

## 8. SOURCES (2025–2026)

1. **Maxime Heckel — _Field Guide to TSL and WebGPU_** — blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — **Oct 14 2025**. The **compute-state-texture** pattern this doc names: a storage buffer/texture that "continuously updates based on previous values," the FBO-ping-pong ancestor of the WebGPU `.compute()` pass, with the read-A/write-B/swap discipline for stateful sims — the exact pattern the WebGL2 fill field implements and the WebGPU port re-hosts.
2. **three.js docs — _GPUComputationRenderer_** — threejs.org/docs/#examples/en/misc/GPUComputationRenderer (and `three/examples/jsm/misc/GPUComputationRenderer.js`) — **current (r17x, 2025–26)**. The bundled ping-pong helper: `addVariable`/`setVariableDependencies`/`compute()`/`getCurrentRenderTarget(var)`, two render targets per variable, the convention this doc's single `textureFill` variable uses (no new dependency).
3. **Muhammad Anas — _Creating Chaotic Flow Fields with GPGPU in React Three Fiber_** — medium.com/@midnightdemise123/creating-chaotic-flow-fields-with-gpgpu-in-react-three-fiber-f9aad608c534 — **Jul 4 2025**. The contemporary R3F ping-pong-FBO walkthrough: a fill/flow state texture, "ping-pong prevents reading and writing the same texture," `getCurrentRenderTarget` in `useFrame` — the live reference for the WebGL2 field rig.
4. **Three.js Journey — _GPGPU Flow Field Particles Shaders_** — threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders — **2025**. "Each pixel of a texture represents one [cell]; the FBO is updated by the GPGPU; the offscreen scene renders to an FBO and the previous result is fed back next frame; ping-pong prevents race conditions." The canonical teaching of the state-texture-fed-back pattern the fill field generalizes from particles to a *field*.
5. **Codrops — _Reaction-Diffusion Compute Shader in WebGPU_** — tympanus.net/codrops/2024/05/01/reaction-diffusion-compute-shader-in-webgpu/ — **May 1 2024 (the canonical texture-ping-pong-state reference, actively cited through 2025–26)**. "One texture holds the current state to be read, another stores the result of the current iteration; swap after each iteration" — the neighbour-update state-flood the gated diffusion of §4.3 is a single-channel wetting special case of (no second chemical).
6. **artcodev — _three-fluid-fx_ (GitHub)** — github.com/artcodev/three-fluid-fx — **2025–26 (`three >= 0.183`, MIT)**. A drop-in 2D Stable-Fluids solver with **both WebGL/GLSL and WebGPU/TSL pipelines**, outputting `velocityTexture`/`densityTexture`/`dyeTexture`, with `performance/balanced/quality` profiles (128²–384², 6–20 pressure iterations, ~1×–25× cost). The 2025–26 evidence that full Stable-Fluids is the *casting-room free-surface* tool (and ~20× the cost) — why the *channel* uses the constrained diffusion flood, not a pressure solve.
7. **Sachin Sharma — _Fluid Physics in Three.js: Real-time Water Simulation for Web_** — sachinsharma.dev/blogs/fluid-physics-threejs-2026 — **2026**. The advect→diffuse→project ping-pong loop on render targets, dye injection, and mobile texture-resolution tradeoffs — the contemporary reference for what a *full* fluid field costs and how its ping-pong substrate matches the fill field's (the upgrade path beyond a scalar flood).
8. **Wikipedia / Xor (GM Shaders) / demofox — _Jump Flooding Algorithm_** — en.wikipedia.org/wiki/Jump_flooding_algorithm · mini.gmshaders.com/p/gm-shaders-mini-jfa · blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/ — **Xor's _Mini: JFA_ and the JFA literature refreshed/cited through 2025–26**. The `O(log n)` neighbour-jump flood for a distance/Voronoi transform — the *adjunct* (§2B.2) that turns the flooded region into a "distance-to-wet-metal" field for the stone-light falloff, and the honest counter-note that JFA solves a *static distance transform*, not the *advancing* pour front (which the time-stepped diffusion of §4.3 owns).
9. **Wawa Sensei — _GPGPU particles with TSL & WebGPU_** — wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu — **2025**. GPGPU as "storing and updating data in textures instead of CPU-bound calculations," the WebGPU/TSL state-buffer recipe — corroborates the compute-state-texture substrate and the deferred WebGPU re-host target.
10. **three.js forum — _Struggling to recreate WebGL ping-pong buffers with WebGPU and TSL_** — discourse.threejs.org/t/struggling-to-recreate-webgl-ping-pong-buffers-with-webgpu-and-tsl/87462 — **2025**. "Read from buffer A, write to buffer B, swap pointers next pass" — confirms the WebGL2 ping-pong fill field re-hosts 1:1 to WebGPU (the portability argument; the field is authored-portable now).
11. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_ & _Migrate Three.js to WebGPU (2026)_** — utsubo.com/blog/threejs-best-practices-100-tips · utsubo.com/blog/webgpu-threejs-migration-guide — **Jan 2026**. Move stateful work to GPU textures/compute, dispose render targets, mutate-in-`useFrame` (no `setState`), the WebGL2-fallback-branch caveat — the mobile-budget + migration grounding for gating the field to `high` and re-hosting later.

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The JFA "distance-to-wet-metal" field as a shared stone-light bus.** Formalize the §2B.2 adjunct: run an
   `O(log n)` jump-flood off the flooded region each `high` frame to produce a distance field, and feed it to
   the basalt green-reveal (`phase2/10`), the Ogham grazing reveal (`phase2/24`), and the spark-stone radiation
   (`phase2/25`) — so the carved lore *lights up as the metal floods past it* on one shared field, the data-
   driven generalization of the `uAEFire` proximity signal (`00 §5.2`).
2. **Mass-conserving merge at the four-fork rejoin.** Upgrade the §4.3 `max`-merge to a flux-summing merge
   (`phase2/21 §2C.3`): track per-cell *volume*, so four arriving sub-fronts *sum* at the sink into a fuller,
   slower, brighter recombined front — quantify whether half-float precision holds the conservation and whether
   the "four became one" read is worth the extra channel.
3. **Field-density → heat-haze + spark-seed coupling.** Sample the flooded field's *front gradient*
   (`fwidth(wetness)`) into both the screen-space heat-haze UV-warp (`00 §5.4`) and the GPGPU spark seeder
   (`phase2/27`'s `uPourFront`), so shimmer and sparks concentrate at the *actual flooded front* (branches and
   all), not a single analytic point — one field driving haze, sparks, and fill (overlaps `phase2/27`
   candidate #2/#4).
4. **The TSL/WebGPU `.compute()` re-host of the fill field.** Port the gated-diffusion flood to a TSL `Fn()`
   `.compute()` pass over a `storageTexture` (Heckel *Field Guide*; Wawa Sensei TSL GPGPU) once `ForgeCanvas`
   migrates, sharing the flood math 1:1 with the WebGL2 version and the spark rig's re-host (`phase2/27`
   candidate #3) — quantify whether a compute shader's scatter (write to arbitrary cells) lets the source
   inject at *multiple* moving branch points more cheaply than the fragment gather, and the WebGL2-fallback
   story for the judge device.
