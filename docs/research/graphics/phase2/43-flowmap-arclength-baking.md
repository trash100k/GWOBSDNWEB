# 43 — Baking the Celtic-Interlace Flow-Map + Arc-Length Channel Texture

_Phase 2 deep-dive · cluster **C-flow-pour** · GAELWORX forge world · r3f + three.js (WebGL2 /
`onBeforeCompile`, r17x) · iPhone 15 OLED primary judge · one shared renderer · warm-forge palette._

> **Parents / siblings.** This doc owns the *texture-asset pipeline* that turns the hand-authored Celtic
> knot into the small RGBA image the runtime channel shader fetches. It sits between the arc-length
> *geometry* bake — [phase2/20 — Arc-Length-Baked Knot](./20-arclength-knot-bake.md) (which owns the
> centripetal Catmull-Rom → arc-LUT → PTF → crossing/occlusion atlas) — and the *runtime advection* —
> [phase1/09 — The Pour](../phase1/09-flowmap-advection-pour.md) (two-sample cross-fade flow advection) plus
> the fork/rejoin front-split ([phase2/21](./21-four-fork-rejoin-graph.md)) and the channel→letter handoff
> ([phase2/19](./19-channel-letter-handoff-seam.md)). Where doc 20 emits a *segment/curve atlas* for the
> SDF carve, **this doc emits the per-pixel raster image** — `R,G` = flow direction, `B` = arc-length,
> `A` = channel mask — that the molten advection and the constant-speed `uFront` read. Cohesion authority:
> [00-COHESION-MAP.md](../00-COHESION-MAP.md) §1 (master temperature), §2 (shared noise), §7 rule **#8**
> ("shares the channel curve data three ways"), §10 (perf budget, "no runtime EXR").

---

## 1. SCOPE — this element in the GAELWORX world

The pour is the spine kinetic event: molten metal leaves the altar, runs the winding Celtic-interlace
channels carved into green-black basalt, branches into four strands, rejoins, and feeds the `GAELWORX`
letterforms left-to-right. Two distinct runtime effects need a **per-pixel field** sampled across the
channel surface:

1. **Directed molten advection.** The molten texture in the channel floor must *crawl in the channel's
   direction* — winding, not scrolling globally. A flow-map (`R,G` = a normalized 2D flow vector per texel)
   is the literal per-pixel encoding of "metal goes this way." Domain-warped noise (the slab's `gw_warp`)
   supplies the *churn*; the flow-map supplies the *steering*.
2. **Constant-speed pour front.** A single scalar `uFront` must advance the white-hot leading edge along the
   path at **constant physical (metal) speed** through every bend, fork, and rejoin — never lurching fast on
   straights and crawling on curves. That requires a per-texel **arc-length** value (`B` channel): "how many
   metres of path is *this* pixel from the altar." A mask channel (`A`) says "is this pixel inside a
   channel," so the molten only fills the groove and nothing leaks onto the stone.

Doc 20 already bakes the *segment/curve data* that drives the analytic SDF carve and the JS spark emitter.
**This doc bakes the complementary asset: a small raster image** (the "flow-map") that the *surface
fragment shader* fetches directly — one `texture2D` to get flow + arc + mask in a single tap, instead of an
N-segment capsule loop on every pixel for the *appearance* layer. The two assets are baked from the **same**
arc-length LUT and crossing atlas (cohesion rule #8), so they cannot drift. The hard constraints are the
brief's: **no runtime EXR**, a strict mobile fill-rate budget, ship as a **small PNG** (or KTX2 where it is
genuinely lossless), and encode the **letterform fill order** so `uFront` walks altar→channels→each glyph at
constant speed.

This element is the dominant read of the **channel-hall chamber (`/automations`, top-down)** where the weave
is fully legible, and the connective tissue between altar and letters in every other chamber.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The bake decomposes into five independently-solvable problems: **(T1)** rasterising the spline into a
direction field; **(T2)** baking arc-length per texel; **(T3)** branch/rejoin handling; **(T4)** the channel
mask + anti-alias; **(T5)** packing + compression + precision (PNG vs KTX2 vs DataTexture). Below, every
viable modern approach with honest quality/perf/mobile/complexity tradeoffs.

### T1 — Rasterising the spline → RG direction field

- **T1a — CPU canvas/offscreen raster from the baked curve (recommended).** At build time, take the
  arc-length-even sample list from doc 20's LUT, and for each texel of an N×N grid compute the nearest point
  on the polyline; the flow vector is that segment's **tangent**, encoded `rg = tangent*0.5+0.5`. This is the
  same "nearest point on a polyline" math the runtime SDF uses, run **once offline** in Node. The classic
  flow-map authoring path — John Sietsma's flow-map write-up and the still-active three.js *Flow Map
  generator* forum thread (referenced through 2025) describe exactly this RG-tangent encoding plus the
  two-sample cross-fade it feeds ([three.js forum, Flow Map generator, 2025](https://discourse.threejs.org/t/flow-map-generator-for-water-effect-in-three-js/68941)).
  **Quality:** exact, fully art-directed. **Perf:** build-time only; runtime is one fetch. **Fit: the master
  rasteriser.**
- **T1b — Tangent of a baked SDF / jump-flood distance field.** Bake a signed-distance field of the channel
  centreline (jump-flooding, JFA), then the flow direction is the **perpendicular to the SDF gradient**
  (flow runs *along* the channel, i.e. orthogonal to the distance gradient), and the SDF magnitude doubles as
  the channel mask. JFA is the canonical GPU distance-field bake — constant-time in seed count, "approximate
  but errors are few and small," 256² in milliseconds ([Demofox, *Fast Voronoi & Distance Field Textures with
  JFA*, referenced 2025-26](https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/);
  [miaumiau.cat, *Voxelization & Distance Fields in WebGL*](https://www.miaumiau.cat/?p=1457)). **Quality:**
  excellent, gives mask + direction + smooth falloff from one pass. **Complexity:** higher (JFA passes +
  gradient + perpendicular). **Mobile note:** we bake offline, so JFA cost is irrelevant; only the *output
  image* ships. **Fit: optional, when we want the SDF and the flow-map to share one source-of-truth raster.**
- **T1c — Render the curve as a thick textured line with vertex-encoded tangents.** Draw the polyline into an
  offscreen render target with each vertex's color = its tangent; the rasteriser interpolates between
  vertices. Cheap, but tangent interpolation across a bend is linear (chord, not arc) and the mask edge is
  hard. Use only as a quick prototype. **Reject for final bake** (T1a is more precise).
- **T1d — Runtime fluid sim writing a velocity texture.** Stable Fluids / semi-Lagrangian advection writes a
  live velocity field (mofu-dev *Stable Fluids*; Sachin Sharma's *Fluid Physics in Three.js* 2026). This is
  *the* way to get an emergent velocity field — but it is over budget on mobile, **uncontrollable** (real
  fluid won't follow a sacred plait), and pointless when the path is fixed and bakeable. **Reject as the
  source; the field is baked, not simulated.**

### T2 — Arc-length per texel (Demand A: constant front speed)

- **T2a — Nearest-segment arc projection (recommended).** For each texel, after finding the nearest polyline
  segment (T1a), recover the local parameter `h = clamp(dot(p-a, b-a)/dot(b-a,b-a), 0, 1)` and write
  `arc = segArcStart + h*segArcLen`, normalized to `[0,1]` by the **total path length** (which already
  includes the channel run *plus* the glyph-fill axis — §3.3). Because the segment arc-starts come from doc
  20's **owned arc-length LUT** (dense cumulative chord length → inverse `arc→t` table, the canonical
  reparameterise-by-arc-length recipe), the per-texel arc is provably constant-speed. The three.js
  `getSpacedPoints`/`arcLengthDivisions` path is the lazy alternative but drifts on long/curvy
  `CatmullRomCurve3` unless `arcLengthDivisions ≥ 1000` (issue #10432); **own the LUT.** **Fit: the master
  arc bake.**
- **T2b — Encode arc as the SDF "stripe phase."** If using JFA (T1b), arc-length can be carried as a second
  flood attribute (propagate each seed's arc value alongside its distance). One pass, but JFA propagation of a
  *scalar field* along the path is fiddlier than the direct projection. **Fit: only if already on the JFA
  path.**
- **T2c — Per-pixel arc in the shader (reject).** Integrating the curve per fragment at runtime is wildly
  over budget for a fixed path. **Reject on mobile** (cohesion §10).

### T3 — Branch / rejoin handling

- **T3a — Per-branch arc offsets baked into one continuous axis (recommended).** The four fork children and
  the sink each get an arc window on **one global axis measured from the altar**: every child's
  `segArcStart` = the parent fork's end-arc, so when `uFront` reaches the node all four children's texels
  "light" at once; the sink's start = the children's common end. This is the declarative window-overlap model
  (doc 19 §2B.1, doc 21 §2C) expressed *in the texture*: no runtime graph walk, the front split is just that
  multiple texels share the same arc value at the junction. **Quality:** correct fork/rejoin. **Fit: the
  pick.**
- **T3b — Branch-ID channel.** If branches must be tinted or weighted independently (per-branch spark heat),
  pack a low-precision branch index into the high bits of one channel or a 5th value. Optional; doc 21 owns
  the branch-weighted heat split — here we only need the *arc continuity*, so T3a alone suffices for the
  flow-map. **Fit: optional refinement.**
- **T3c — Over/under occlusion in the raster.** At a crossing, two channels overlap one texel. The flow-map
  must write the **over-strand's** direction/arc there (the under-strand is hidden), matching the SDF carve's
  layer-priority resolve (doc 20 §B4). Bake by drawing strands in layer order (under first, over last) so the
  over-strand wins the texel — the painter's-algorithm equivalent of the runtime layer test. **Fit: required
  at crossings.**

### T4 — Channel mask + anti-alias (A channel)

- **T4a — Signed-distance mask with `fwidth` AA at runtime (recommended).** Store the *signed distance* to
  the channel edge in `A` (remapped to `[0,1]`, 0.5 = the edge), not a hard 0/1 mask. At runtime,
  `mask = smoothstep(0.5 - fwidth, 0.5 + fwidth, A)` gives a crisp, resolution-independent groove edge from a
  *low-res* texture — the MSDF-style trick: a distance field upsamples cleanly where a bitmap mask pixelates.
  This is why the flow-map can be **128–256²** and still produce razor groove lips on an OLED. **Fit: the
  pick** (lets the texture be tiny).
- **T4b — Hard binary mask.** `A = inside ? 1 : 0`. Pixelates on edges unless the texture is large. **Reject**
  except on the `static` tier where it's never animated.

### T5 — Packing, compression, precision (the make-or-break)

This is where naïve "ship a PNG" goes wrong, and where the brief's KTX2 mention needs the honest answer.

- **T5a — 8-bit RGBA PNG, two-channel direction (baseline, with caveats).** `R,G` = direction (8-bit),
  `B` = arc-length (8-bit), `A` = signed-distance mask (8-bit). **Problem:** 8-bit has only 256 steps; a long
  arc-length ramp across the `B` channel **bands** visibly (the 16-bit-normal-map banding result — 256 vs
  65 536 steps, "banding artifacts as steps in shading significantly reduced with 16-bit"
  ([3DCoat, *Types of normal maps*, 2025](https://3dcoat.com/documentation/2025/01/13/types-of-normal-maps/))).
  A banded arc ramp = a front that advances in visible stair-steps. **Mitigation: dither the arc ramp at bake
  (blue-noise) and/or split arc across two channels** (§4.4). **Fit: acceptable for direction; risky for arc
  without a fix.**
- **T5b — 16-bit PNG (recommended for the data, the practical pick).** PNG supports 16-bit-per-channel.
  Encode `R,G` direction at 16-bit (smooth flow), `B` arc at 16-bit (no front stair-stepping). three's
  `TextureLoader`→`UnsignedShort`/`HalfFloat` path reads it; or load via a tiny custom step into a
  `DataTexture`. A 256² 16-bit RGBA PNG is ~50–120 KB after PNG's lossless DEFLATE — **well inside budget**,
  and it is **lossless** (unlike KTX2/Basis). **Fit: the recommended ship format for the data texture.**
- **T5c — KTX2 / Basis Universal — REJECT for the data channels.** KTX2 + Basis (ETC1S/UASTC) is **lossy
  block compression** designed for *albedo/normal* where small per-texel error is invisible. The
  KhronosGroup artist guide is explicit that UASTC suits "packed" textures (ORM, normal) — but those tolerate
  block error; **a direction/arc/mask data texture does not.** Block artifacts on the `B` arc ramp =
  front-position jitter; block error on `R,G` = flow direction wobble at block boundaries; the `A` distance
  mask gets the worst of it. KTX2's win (stays compressed in GPU memory, faster upload — gltf-transform /
  toktx, [gltf-transform CLI](https://gltf-transform.dev/cli)) is real for *photographic* textures but
  **irrelevant for a 128–256² image that is already tiny**, and the lossiness is disqualifying.
  **Verdict: ship PNG (lossless); do NOT KTX2 the flow-map.** (KTX2 stays the right call for any future
  *photographic* basalt/Ogham albedo — just not for control data.)
- **T5d — Build-time `DataTexture` (no image file at all).** Bake the typed `Float32Array`/`Uint16Array` into
  a JS module (`src/scene/flowBake.js`) and `new THREE.DataTexture(...)` at boot — no fetch, no decode, no
  EXR. Honors "no runtime EXR" trivially and gives exact float precision. Cost: the array is inlined in JS
  (a 256² RGBA16 = 512 KB of base64 in the bundle — heavier than a 16-bit PNG). **Fit: best for *small*
  fields (≤128²) or the `low`/`static` tier where a tiny field suffices; PNG (T5b) for the hero 256².**

### Cross-cutting: WebGPU / TSL port lane (future, not Phase-2 ship)

The *False Earth* WebGPU project writes derived geometry into **storage buffers** in compute and reads it
from any shader ([Codrops, *False Earth*, 2026-04-21](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/)),
and Maxime Heckel's TSL field guide covers storage buffers + `texture()` sampling nodes that replace the
`onBeforeCompile` hack ([Maxime Heckel, *Field Guide to TSL and WebGPU*, 2025](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)).
On WebGPU the *bake itself* could move to a compute pass and the field to a storage texture — but we **bake
offline and ship a PNG** to the WebGL2 judge device; the TSL port is a re-host (the `texture2D` fetch becomes
a TSL `texture()` node), not a rewrite.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A pure offline bake → one small lossless 16-bit RGBA PNG (`flowmap.png`), plus a JS metadata module,
consumed at runtime by a single `texture2D` tap in the channel surface shader. RG = flow direction
(two-sample cross-fade advection), B = global arc-length (constant-speed `uFront`), A = signed-distance
channel mask (`fwidth` AA). No runtime EXR, no KTX2 on the data, no fluid sim.**

The pipeline (`scripts/bakeFlowMap.mjs` → `public/flowmap.png` + `src/scene/flowMeta.js`):

1. **Read the same baked knot** doc 20 emits — the arc-length-even capsule segments with `segArcStart`,
   `segArcLen`, `layer`, and the crossing/occlusion records. **One source of truth** (rule #8).
2. **Append the glyph-fill axis** to the global arc axis (§3.3): after the terminal channel run's arc,
   concatenate each glyph's fill window so the *single* `uFront` walks altar → channels → `G` → `A` → `E` …
   at constant speed. This is what encodes **letterform fill order** into the texture.
3. **Rasterise (T1a)** an N×N grid: per texel, nearest polyline segment → `RG = tangent*0.5+0.5`,
   `B = (segArcStart + h*segArcLen)/totalArc`, `A = sdEdge*0.5+0.5`. Draw strands **under-first / over-last**
   (T3c) so crossings encode the over-strand.
4. **Dither + precision (T5b):** 16-bit channels; blue-noise dither the low bits of `B` as belt-and-braces
   against any residual banding.
5. **Emit** `public/flowmap.png` (lossless 16-bit RGBA) + `src/scene/flowMeta.js` (`{ totalArc, channelArc,
   glyphWindows:[{glyph,startArc,endArc}], texSize }`). Total ship weight: ~60–120 KB.

**Why this and not the alternatives.** GAELWORX needs a *specific, sacred, branded* knot whose four-fork
lands under the altar pour — a fluid sim (T1d) or runtime generator fights that and is uncontrollable on
mobile. The baked PNG is deterministic, tiny, mobile-safe, lossless (KTX2 rejected for the *data* — §T5c),
and shares the slab's exact idioms (`onBeforeCompile`, `gw_fbm`/`gw_warp`, `v3(PAL.x)` inlining, dt-damped
store uniforms, HDR-only blooms). Critically it makes rule #8 *structural*: the SDF carve (doc 20), the
appearance/advection (this doc), the front split (doc 21), and the spark orbit (phase1/15) all derive from
**one** arc-length LUT, so fill, weave, and depth cannot drift.

### 3.3 Encoding the letterform fill order (the core of the brief)

The `B` channel is **one continuous arc axis** spanning the whole journey of the metal:

```
arc = 0 ───────────► channelArc ──────────────────────────► totalArc
      altar mouth     end of last channel run    end of fill of last glyph (X)
      |── channels (winding, fork, rejoin) ──|── G | A | E | L | W | O | R | X ──|
```

The glyph fill windows are laid **head-to-tail in reading order** (left-to-right), each window's arc length
proportional to that glyph's fill *volume* (so a fat `W` takes longer to fill than a thin `L` — constant
*metal* speed, not constant *time*). The channel surface shader writes glyph texels' `B` from their window;
the wordmark fill shader (doc 13/17) reads the **same** `uFront` against its own `[startArc,endArc]`. Result:
`uFront` is one scalar, driven by `forge.scrollDamped`, and the front leaves the last channel segment at
*exactly* the arc where `G`'s window begins — the seamless channel→letter handoff (doc 19) is now baked into
the data, not faked at runtime. The A/E glyph windows are flagged `isAE` in `flowMeta` so the cooling path
clamps them to `gw_divineFire` (cohesion §1.4).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js r17x** (repo WebGL): `CatmullRomCurve3` (`'centripetal'`), `Vector2/3`, `DataTexture`,
  `TextureLoader`, `MeshPhysicalMaterial` + `onBeforeCompile` (the repo's `shader-fx` chunk-injection
  pattern, identical to `ObsidianSlab.jsx`). **No new runtime deps.**
- **@react-three/fiber**, **@react-three/drei** (already in repo).
- **Build-time only:** Node ESM `scripts/bakeFlowMap.mjs` importing `three` (for the curve) + `pngjs` (or
  `sharp`) to write a **16-bit RGBA PNG**. Reuses doc 20's `bakeKnot.mjs` output (do not re-derive the
  curve — import the same LUT).

### 4.2 The bake (build-time) — rasterise direction + arc + mask

```js
// scripts/bakeFlowMap.mjs  (build-time) — emits public/flowmap.png (16-bit RGBA) + src/scene/flowMeta.js
import * as THREE from 'three'
import { PNG } from 'pngjs'
import { buildKnot } from './bakeKnot.mjs'   // doc 20: arc-even segments + crossings + glyph windows

const N = 256                                 // hero tier; 128 on low
const knot = buildKnot()                      // { segs:[{a,b,arcStart,arcLen,layer}], totalArc, glyphWindows }
const CHAN_HALF = 0.018                        // channel half-width in UV space

// nearest point on a segment + local t (the SAME math the runtime SDF uses)
function nearestOnSeg(p, a, b) {
  const bax = b.x - a.x, bay = b.y - a.y
  const h = Math.min(1, Math.max(0, ((p.x-a.x)*bax + (p.y-a.y)*bay) / (bax*bax + bay*bay)))
  const cx = a.x + bax*h, cy = a.y + bay*h
  return { d: Math.hypot(p.x-cx, p.y-cy), h, tx: bax, ty: bay }   // tx,ty = tangent (un-normalized)
}

const png = new PNG({ width: N, height: N, colorType: 6, bitDepth: 16 }) // RGBA16, lossless
const buf = new Uint16Array(N * N * 4)        // we fill our own 16-bit buffer

for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const p = { x: (x + 0.5) / N, y: (y + 0.5) / N }
  // T3c: iterate segments in layer order (under-first) so the OVER strand wins the texel at crossings.
  let best = null, bestArc = 0, bestTan = { x: 1, y: 0 }, bestLayer = -1
  for (const s of knot.segs) {                // already sorted ascending by layer
    const r = nearestOnSeg(p, s.a, s.b)
    const inChan = r.d < CHAN_HALF * 1.6      // a little slop so the mask AA band has data
    if (inChan && (best === null || s.layer >= bestLayer)) {
      best = r; bestLayer = s.layer
      bestArc = (s.arcStart + r.h * s.arcLen) / knot.totalArc          // T2a: normalized ARC (0..1)
      const tl = Math.hypot(r.tx, r.ty) || 1
      bestTan = { x: r.tx / tl, y: r.ty / tl }                         // normalized tangent
    }
  }
  // A: signed distance to channel edge, remapped so 0.5 == edge (T4a, fwidth AA at runtime)
  const sd = best ? (CHAN_HALF - best.d) : -CHAN_HALF                  // >0 inside, <0 outside
  const mask = THREE.MathUtils.clamp(sd / (CHAN_HALF * 2) + 0.5, 0, 1)
  // 16-bit encode. Direction *0.5+0.5; blue-noise dither B's low bits as banding insurance (T5b).
  const dither = (blueNoise(x, y) - 0.5) / 65535
  const i = (y * N + x) * 4
  buf[i+0] = Math.round(THREE.MathUtils.clamp(bestTan.x*0.5+0.5, 0, 1) * 65535)
  buf[i+1] = Math.round(THREE.MathUtils.clamp(bestTan.y*0.5+0.5, 0, 1) * 65535)
  buf[i+2] = Math.round(THREE.MathUtils.clamp(bestArc + dither,   0, 1) * 65535)
  buf[i+3] = Math.round(mask * 65535)
}
// pack Uint16 -> PNG big-endian bytes, write public/flowmap.png ; write flowMeta.js (totalArc, windows...)
```

`buildKnot()` is doc 20's existing bake extended to **append the glyph fill windows to the arc axis**
(§3.3): after the channel run, push one window per glyph in reading order, each `arcLen` ∝ glyph fill volume,
and stamp the glyph footprints into the raster the same way (so a glyph's interior texels carry their window
arc, and the channel→letter front is continuous).

### 4.3 The runtime fetch + advection (channel surface `onBeforeCompile`)

Shared GLSL appended to `src/scene/shaders.js` (beside `GLSL_NOISE`, `gw_forge`, `gwCool01`):

```glsl
uniform sampler2D uFlowMap;     // RGBA16 PNG: RG=dir, B=arc(0..1), A=sd-mask(0.5=edge)
uniform float uFront;           // ARC-LENGTH pour-front 0..1 (SHARED: pour + sparks + letters)
uniform float uFlowSpeed, uTime, uHeat;
// ... gw_fbm / gw_warp / gw_forge / gwCool01 / gw_divineFire already present ...

// two-sample cross-fade advection — kills the UV-stretch smear (phase1/09 A1)
float gw_advect(vec2 uv, vec2 flow){
  float t  = uTime * uFlowSpeed;
  float p0 = fract(t), p1 = fract(t + 0.5);
  float w  = abs(0.5 - p0) * 2.0;                       // triangle blend weight
  float n0 = gw_warp((uv - flow * p0) * 3.0);           // SHARED noise, scrolled ALONG the channel
  float n1 = gw_warp((uv - flow * p1) * 3.0);
  return mix(n0, n1, w) * 0.5 + 0.5;
}
```

```glsl
// --- COLOR block (added before #include <tonemapping_fragment>, exactly like the slab) ---
vec4  fm    = texture2D(uFlowMap, vUv);
vec2  flow  = fm.rg * 2.0 - 1.0;                         // decode direction
float arc   = fm.b;                                      // 0..1 constant-speed arc coord
float aa    = fwidth(fm.a);                              // T4a: resolution-independent groove edge
float mask  = smoothstep(0.5 - aa, 0.5 + aa, fm.a);      // 1 inside groove, 0 on stone

float filled = step(arc, uFront);                        // metal present up to the arc-length front
float age    = max(0.0, uFront - arc) * uTotalArcScale;  // "seconds" since this point received metal
float temp   = gwCool01(age, uCoolRate);                 // SHARED cooling clock (cohesion §1.3)
float churn  = gw_advect(vUv, flow);                     // directed molten detail
temp        *= 0.55 + 0.45 * churn;                      // body temp modulated by the live churn
temp        += smoothstep(0.02, 0.0, abs(arc - uFront)) * 0.9 * filled;  // white-hot meniscus lip
vec3 metal   = mix(gw_forge(temp), gw_divineFire(uHeat), uIsAE);         // SHARED temp / divine path

gl_FragColor.rgb = mix(gl_FragColor.rgb, metal, mask * filled);          // pour metal into the groove only
```

One `texture2D` fetch yields direction, arc, and mask. The advection uses `gw_warp` (the shared noise) — no
forked noise. The front, cooling, and divine-fire all go through the **shared** functions, so a cooling point
in a channel is *visibly the same metal* as a cooling letter (cohesion §7 rule #1).

### 4.4 Precision: splitting arc across two channels (banding insurance)

If a target device still bands the 8-bit fallback (`low` tier ships an 8-bit PNG to halve weight), split arc
into hi/lo bytes across two channels and reconstruct — the standard 16-bits-in-two-8-bit-channels trick:

```glsl
// low-tier 8-bit fallback: B = arc hi byte, A repurposed = arc lo byte (mask moves to a separate small tex)
float arc = texture2D(uFlowMap, vUv).b + texture2D(uFlowMap, vUv).a / 255.0;
```

On `high` we ship one 16-bit PNG and skip this; the split is only the 8-bit safety valve.

### 4.5 The r3f component shape

```jsx
import { U } from './forgeUniforms'            // Master Forge Uniform pool (cohesion §4.2)
import { FLOW_META } from './flowMeta'         // baked: totalArc, glyphWindows, texSize

function ChannelSurface() {
  const q = forge.quality
  const flowMap = useTexture(q === 'high' ? '/flowmap.png' : '/flowmap-lo.png')
  useMemo(() => {                              // data-texture hygiene: NO sRGB, NO mips, linear sample
    flowMap.colorSpace = THREE.NoColorSpace    // it's DATA, not color — never sRGB-decode it
    flowMap.generateMipmaps = false
    flowMap.minFilter = flowMap.magFilter = THREE.LinearFilter
    flowMap.wrapS = flowMap.wrapT = THREE.ClampToEdgeWrapping
    flowMap.needsUpdate = true
  }, [flowMap])

  const local = useMemo(() => ({
    uFlowMap:       { value: flowMap },
    uFlowSpeed:     { value: q === 'high' ? 1.2 : 0.6 },
    uTotalArcScale: { value: FLOW_META.totalArc * 0.18 },  // arc→"seconds" cooling scale
    uCoolRate:      { value: 0.45 },
    uIsAE:          { value: 0.0 },
  }), [flowMap, q])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a120e'), roughness: 0.85, metalness: 0.0 })  // green-black basalt
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, local)     // SAME references as the whole world (cohesion §4.2)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD_FLOW}`)
        .replace('#include <tonemapping_fragment>', `${COLOR_FLOW}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [local])

  useEffect(() => () => { material.dispose(); flowMap.dispose() }, [material, flowMap])
  // uFront / uTime / uHeat are driven by the ONE <ForgeDriver/> writing the shared U pool.
  return <mesh material={material}><planeGeometry args={[11, 6.6, 1, 1]} /></mesh>
}
```

### 4.6 Hooking the shared master temperature system

`uFront` is an arc-length scalar in `[0,1]` over the **whole journey** (altar→channels→glyphs). The single
`<ForgeDriver/>` advances it from `forge.scrollDamped` (dt-damped, `THREE.MathUtils.damp`, never frame-rate
`lerp`). Three consumers read the *same* `uFront` and the *same* baked arc axis (rule #8):

| Consumer | Reads | Result |
|---|---|---|
| **Channel surface (this doc)** | `uFlowMap.b` (arc) vs `uFront`; `RG` advection | molten fills + crawls at constant speed |
| **Letter fill** (doc 13/17) | `uFront` vs baked `[startArc,endArc]` window | letters fill left-to-right, handoff seamless |
| **Sparks** (phase1/15) | `getKnotPoint(uFront*totalArc)` off the LUT | sparks orbit the moving front, per-branch |

The temperature/cooling/divine-fire all flow through `gw_forge` / `gwCool01` / `gw_divineFire` — never a
private orange or clock.

---

## 5. COHESION (shares the world's spine)

- **Master temperature (§1):** the groove floor calls **`gw_forge(temp)`** and cools via
  **`gwCool01(age, uCoolRate)`** — the *same* functions the slab veins, the pour, and the cooling letters
  use. A/E glyph windows (flagged in `flowMeta`) route through **`gw_divineFire`** via `uIsAE`, never
  reaching `uTemp` — the keystone exception (§1.4) expressed in carved channels.
- **Shared noise (§2):** advection scrolls **`gw_warp`** (the shared two-level domain warp) along the baked
  direction — *no second noise*, just the shared noise *steered* per-texel. "More detail" = one more octave
  on `gw_fbm`, never a forked field.
- **Palette (§3):** floor metal = `gw_forge` from `PAL.crimson`/`PAL.ember`/`PAL.hot`; basalt = green-black
  void family; all via `v3()`. Only the white-hot meniscus and the A/E glyphs exceed 1.0 → the **palette is
  the bloom selector**; the existing `mipmapBlur` bloom catches exactly the hot channel cores.
- **Single uniform pool (§4.2):** `Object.assign(sh.uniforms, U, local)` binds the *same references* as
  every chamber material; the one `<ForgeDriver/>` mutates `U.uFront`/`U.uTemp`/`U.uHeat` and the whole world
  heats on one heartbeat. A strike surges the channel meniscus, the slab veins, and the sparks **in the same
  frame** — the cohesion proof.
- **Rule #8 (the contract):** the flow-map PNG is baked from doc 20's arc-length LUT and crossing atlas, so
  channel appearance (this doc), channel geometry (doc 20), front split (doc 21), letter handoff (doc 19),
  and spark orbit (phase1/15) cannot drift — one knot, baked two ways (curve atlas + raster image), consumed
  five ways.
- **Motion law:** the front advances at **constant velocity** (Forge Reveal / Drift) — *literally* true
  because `B` is arc-length. Scroll *flares* it via `forge.scrollVel`/`uHeat`; the carved stone never moves
  (Brutalist: the stone is immovable, only the metal flows).

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

The judge device is fill-rate-bound (cohesion §10): pixels are the enemy, not triangles.

- **Runtime cost:** **one** `texture2D` fetch + the two-sample `gw_warp` advection (two `gw_fbm`/`warp`
  evals, already in budget) + a handful of `smoothstep`/`mix`. This is *cheaper* than doc 20's per-pixel
  N-segment SDF loop, so the **appearance** layer can use the raster while the **geometry/carve** layer uses
  the SDF — or, on `low`, the raster mask *replaces* the SDF entirely (one fetch instead of 32 capsules).
  **No render targets, no raymarch, no fluid passes, no per-frame CPU.**
- **Bake cost:** zero at runtime — rasterise, arc-project, dither all run in `scripts/bakeFlowMap.mjs` at
  build time. Output: one ~60–120 KB PNG.
- **Texture budget:** 256² RGBA16 PNG (~60–120 KB on disk; 512 KB in GPU memory uncompressed — trivial for
  one texture). 128² on `low`. **No EXR ever** (the env-black-canvas scar). **No KTX2 on this data** (lossy —
  §T5c); PNG is lossless and already tiny.
- **The four levers (cohesion §10):** DPR cap 1.5; bloom `resolutionScale 0.5`; `GW_FBM_OCTAVES` 4→3→2 by
  tier (the *advection churn*, not the fetch); texture size 256→128 by tier.
- **Quality tiers:**
  - **high:** 256² 16-bit PNG, two-sample cross-fade advection, full `gw_warp` churn, `fwidth` AA mask,
    constant-speed front, A/E divine windows.
  - **low:** 128² 8-bit PNG (arc split hi/lo across two channels, §4.4), **single-sample** advection (accept
    mild smear), halved `uFlowSpeed`, fewer churn octaves.
  - **static** (`prefers-reduced-motion` / weak GPU): freeze `uTime = 2`, fix `uFront` at a mid-pour arc,
    no advection — a dignified frozen "mid-pour" poster; `frameloop='demand'`. The hard binary mask (T4b) is
    fine here since nothing animates.
- **INP / first paint:** `renderer.compileAsync` the channel material before first interaction so the shader
  compile doesn't block the first scroll; preload `/flowmap.png` (`<link rel=preload as=image>`) so the fetch
  overlaps boot; alloc-free `useFrame`.
- **WebGPU upside (future, not Phase-2):** the bake → compute pass, the PNG → storage texture, the
  `texture2D` → TSL `texture()` node (*False Earth* storage buffers; Heckel TSL guide). Authored
  TSL-portable, but ship WebGL2/GLSL + PNG to the judge.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this technique class):**

1. **sRGB-decoding a data texture.** A flow-map is **data, not color**. If the texture is loaded as sRGB,
   three gamma-decodes `RG`/`B` and your flow direction + arc are silently wrong (curved, banded). Set
   `colorSpace = THREE.NoColorSpace`, `generateMipmaps = false`, **always.** This is the #1 silent flow-map
   bug.
2. **Banded arc ramp → stair-stepping front.** 8-bit `B` has 256 steps; a long arc ramp visibly stairs the
   front. Ship **16-bit PNG** (T5b) on `high`, or split arc hi/lo across two channels + blue-noise dither
   (§4.4) on the 8-bit `low` fallback.
3. **KTX2 on the data.** Basis/UASTC is lossy block compression — it jitters direction at block boundaries
   and stairs the arc ramp. **Never KTX2 the flow-map.** PNG (lossless) is already tiny; KTX2 is for
   photographic albedo only (§T5c).
4. **Flow direction in the wrong space / mirrored UV.** `RG` must be decoded `*2-1` and match the channel UV
   winding. If metal flows "uphill," the bake or the plane's UV is mirrored — verify with a debug
   `gl_FragColor = vec4(flow*0.5+0.5, 0, 1)` and confirm direction follows the visible channel.
5. **Front coordinate ≠ arc-length.** Using raw `vUv.x` makes the front accelerate around bends — the #1
   "reads as fake" tell. The `B` channel **must** be the doc-20 arc-length, normalized by the *whole*
   journey (channels + glyph windows), or the constant-speed promise is broken.
6. **Mips on a distance/data texture.** Mip generation averages unrelated texels (a flow vector and the
   stone outside it) → smeared direction + a soft mask. `generateMipmaps = false`, `LinearFilter`,
   `ClampToEdgeWrapping`.
7. **Over/under lost in the raster.** At a crossing, draw strands **under-first / over-last** so the
   over-strand wins the texel (T3c) — matching the SDF layer-priority resolve. Otherwise the weave reads
   wrong where channels overlap.
8. **Bloom washing the walls.** Keep basalt + groove walls ≤1.0; only the white-hot meniscus and A/E go HDR,
   or the channel glows and stops reading as recessed.
9. **Two assets drifting.** The flow-map PNG (this doc) and the curve atlas (doc 20) **must** be baked from
   the *same* `buildKnot()` call in one script run — never two scripts with two curve definitions, or the
   appearance and the carve diverge.

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**

1. **Reuse doc 20's `buildKnot()`** (arc-LUT + segments + crossings). Extend it to **append glyph fill
   windows** to the arc axis (§3.3). Dump `flowMeta.js`; eyeball windows sum to `totalArc`.
2. **Write `bakeFlowMap.mjs`** (T1a rasterise). Output a *debug* 8-bit PNG first; view `RG` as direction,
   `B` as a grayscale ramp — confirm the ramp climbs **uniformly** along the path (Demand A proof) and `A`
   masks the groove.
3. **Wire the runtime fetch** with `colorSpace = NoColorSpace`, no mips. Debug-viz `flow*0.5+0.5` — confirm
   direction follows the channel (pitfall 4).
4. **Add two-sample advection** (`gw_advect`); confirm the molten *crawls along* the channel, not scrolls
   globally, with no smear at high `uFlowSpeed`.
5. **Drive `uFront`** from `forge.scrollDamped` (dt-damped via `<ForgeDriver/>`); confirm the meniscus lip
   advances at **constant speed** through every bend, fork, and rejoin.
6. **Switch to 16-bit PNG**; confirm the front banding/stair-step is gone on a real gradient.
7. **Channel→letter handoff:** confirm the front leaves the last channel and enters `G` with no discontinuity
   (shared `uFront`, doc 19).
8. **A/E divine windows** (`uIsAE` from `flowMeta`) clamp to `gw_divineFire`; verify A/E stay white-gold
   while neighbours cool.
9. **Quality tiers + `static` frozen poster;** frame the channel-hall **top-down** in `scenes.js`.
10. **Device read** on iPhone 15 OLED (true black, groove depth, constant front speed, white-gold A/E,
    no arc banding — none simulate headless).

---

## 8. SOURCES (2025–2026)

- three.js forum, **"Flow Map generator for water effect in three.js"** (active 2025 thread) — RG-tangent
  direction encoding (`(rg-0.5)*2`) and the two-sample cross-fade advection that the baked map feeds; flow +
  bump/foam channel packing. **2025.** https://discourse.threejs.org/t/flow-map-generator-for-water-effect-in-three-js/68941
- Sachin Sharma, **"Fluid Physics in Three.js: Real-time Water Simulation for Web,"** sachinsharma.dev —
  **2026.** Velocity-field advection and why a controllable directed-flow path (vs an emergent sim) is the
  right call for art-directed channels. https://sachinsharma.dev/blogs/fluid-physics-threejs-2026
- Misaki Nakano (mofu), **"Stable Fluids with three.js,"** mofu-dev — **2025.** Semi-Lagrangian backward
  advection / velocity textures — the sim path deliberately rejected here for control + mobile budget.
  https://mofu-dev.com/en/blog/stable-fluids/
- Jorge Toloza & contributors, **"Building an Endless Procedural Snake with Three.js and WebGL,"** Codrops —
  **2026-02-10.** Baking curve data into **DataTextures** (position XYZ + normal RGB per spine sample, read
  in the vertex shader) and **parallel-transport frames** — the data-texture-as-curve-carrier pattern this
  bake mirrors for the raster. https://tympanus.net/codrops/2026/02/10/building-an-endless-procedural-snake-with-three-js-and-webgl/
- Ming Jyun Hung, **"False Earth: From WebGL Limits to a WebGPU-Driven World,"** Codrops — **2026-04-21.**
  WebGPU + TSL **storage buffers / storage textures** to write derived geometry data on-GPU and read it from
  any shader — the future on-GPU-bake + storage-texture port lane.
  https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
- Maxime Heckel, **"The Field Guide to TSL and WebGPU,"** maximeheckel.com — **2025.** TSL node materials,
  `texture()` sampling nodes replacing `onBeforeCompile`, storage buffers as GPU-persistent arrays — the
  TSL-portable authoring + WebGPU upgrade reference. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- 3DCoat documentation, **"Types of normal maps,"** 3dcoat.com — **2025-01-13.** 8-bit (256 steps) vs 16-bit
  (65 536 steps) banding: the precision argument for shipping the arc/direction data at 16-bit and the
  two-channel reconstruction trick. https://3dcoat.com/documentation/2025/01/13/types-of-normal-maps/
- Don McCurdy, **glTF-Transform CLI** (`uastc`/`etc1s`, `--slots`, RDO/zstd), gltf-transform.dev — current
  docs referenced **2025-2026.** The KTX2/Basis workflow — cited to justify **rejecting** lossy block
  compression for the *data* texture while keeping it for photographic albedo. https://gltf-transform.dev/cli
- KhronosGroup, **3D-Formats-Guidelines — KTX Artist/Developer Guide,** github.com — referenced **2025.**
  UASTC suits "packed" textures (ORM/normal) that *tolerate* block error; the data flow-map does not — the
  authoritative basis for the KTX2-reject verdict.
  https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md
- Alan Wolfe (Demofox), **"Fast Voronoi Diagrams and Distance Field Textures on the GPU with the Jump
  Flooding Algorithm,"** + miaumiau.cat *Voxelization & Distance Fields in WebGL* — referenced **2025-2026.**
  JFA distance-field bake (constant-time, small error) as the alternative T1b source for mask + perpendicular
  flow direction from one field. https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/
  · https://www.miaumiau.cat/?p=1457
- mrdoob/three.js, **`CatmullRomCurve3` docs (`arcLengthDivisions`/`getSpacedPoints`/`getLengths`) +
  issue #10432**, current r17x docs referenced **2025.** The arc-length precision caveat that justifies
  owning the LUT (T2a) and `'centripetal'`. https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3
  · https://github.com/mrdoob/three.js/issues/10432

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The unified knot atlas: one packed asset for SDF + raster + emitter.** Formalise rule #8 as a single
   build artefact — emit the curve atlas (doc 20) and this flow-map raster from one `buildKnot()` pass into
   one versioned bundle, with a byte-budget table per tier and a hash check that fails CI if appearance and
   carve drift. Quantify whether the raster can *fully replace* the per-pixel SDF loop on mobile.
2. **JFA-baked flow-map (T1b) as the one source.** Bake mask + perpendicular-gradient direction + arc as a
   propagated flood attribute in one jump-flood pipeline, so the SDF carve and the flow-map share *literally
   one* raster. Quantify error vs the nearest-segment bake and whether the JFA arc-propagation holds constant
   speed through forks.
3. **Glyph-fill-volume-weighted arc windows.** The exact algorithm that sets each glyph's arc window length
   ∝ its fillable area (so `W` fills slower than `I`), measured from the MSDF/Extrude footprint, and how a
   strike/scroll-velocity flare interacts with per-glyph windows without breaking constant *metal* speed.
4. **TSL/WebGPU on-GPU bake + storage-texture port.** Move `bakeFlowMap.mjs` into a compute pass writing a
   storage texture (*False Earth* / Heckel), quantifying iPhone-15 Safari-26 headroom and the WebGL2 PNG
   fallback story — and whether an on-GPU rebake enables *runtime-editable* knots in the `?debug` leva panel.
