# 24 — CELTIC INTERLACE CHANNEL GEOMETRY (PROCEDURAL)

_Phase 1 graphics research · GAELWORX forge world · target r3f + three.js (WebGL) · iPhone 15 OLED primary judge · one shared renderer · warm-forge palette._

---

## 1. SCOPE

This element is the **vascular system of the forge**: the winding, branching, rejoining **Celtic-knot
channels carved into the green-black Irish basalt** through which the molten metal runs from the
stone altar to the GAELWORX letterforms. It is the literal *path* the metal takes. The sister
document [09 — The Pour](./09-flowmap-advection-pour.md) owns the **flow of metal along** the
channels (flow-map advection, the pour front, the falling stream); **this document owns the
GEOMETRY of the channels themselves** — how we *generate* the interlace: the procedural knotwork
layout, the spline/curve representation of each strand, the SDF-carved grooves cut into the stone,
and the **four-branch fork-and-rejoin** that is the signature Celtic move (one strand splits into
four, weaves over-and-under, and rejoins into one). The two documents share one contract: this one
produces the **arc-length-parameterised curve data + the carved groove SDF**; doc 09 consumes that
data to push metal along it.

The channels are the dominant read of the **`channel-hall` chamber (Automations)** — shown
**top-down** so the knotwork's over/under weave is fully legible — and they thread through every other
chamber as the connective tissue between altar and letters. Get the geometry wrong and the whole
world reads as "decorative lines with lava on them"; get it right (true plaitwork, strict over/under,
grooves that look *carved into* stone with the metal sitting *inside* them) and it reads as a sacred
forged artefact. The channels must share the master temperature / noise / lighting system so the
groove walls catch the metal's glow and nothing looks bolted-on.

A hard authenticity note carried from the project's `radial-svg` skill: **two offset sine waves are
NOT a Celtic knot.** Real plaitwork is **grid-based strict over/under** — every strand that crosses
*over* at one crossing goes *under* at the next. Our generator must enforce that, or it will read as
fake to anyone who has seen real knotwork (and the judges have).

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

The problem decomposes into three layers that can each be solved independently and then fused:
**(L1) the knot LAYOUT** (where the strands go, who crosses over whom), **(L2) the strand
GEOMETRY** (turning the layout into smooth curves / channel meshes), and **(L3) the carved GROOVE
look** (making it read as cut into stone with metal inside). Honest tradeoffs below.

### L1 — Knot layout (the topology / over-under)

**L1a — Grid-and-mirror plaitwork (the classic Mereside/Cromwell algorithm).** Lay a regular grid;
the strands run diagonally and bounce off boundary walls and inserted "breakpoints," producing the
basket-weave. Over/under is purely positional: alternate at every crossing. This is the canonical,
mathematically exact method and the basis of essentially every generator — see the 2025-current
maintained generators **dmackinnon1/celtic** (JS + static-SVG renderer with crossing classes) and
**bezborodow/celtic-knot** (SVG grid generator), and the knotwork-algorithm survey resurfaced in
2025 work which states the rule plainly: *"to ensure the knotwork is Celtic it must follow a strict
over-under pattern"* and *"there are 26 tiles that draw any of these patterns."*
**Quality:** authentic. **Perf:** layout is a build-time/CPU step, free at runtime. **Complexity:**
medium. **Fit:** this is how we author the *master layout*, offline, once.

**L1b — Planar-graph / cord algorithm.** Generalises L1a to any planar graph (knot follows the
medial construction of the graph's edges). More flexible (arbitrary branch points, the fork-rejoin
falls out naturally as a graph node of degree 4), but heavier to author and overkill for a
hand-designed hero layout. **Use the idea — model the GAELWORX channel as a small hand-built graph —
without shipping a general solver.**

**L1c — Tile-set assembly (the 26-tile / 2-blank Knotware approach).** Pre-author a set of crossing
tiles (over-NE, under-NE, turn, branch…) and snap them on a grid. Artist-friendly, deterministic,
and the over/under is baked into each tile. **Strong candidate for the GAELWORX master path** because
we want a *specific*, brand-tuned knot, not a random one — tiling lets a designer place the four-fork
exactly where the altar pours.

**L1d — AI / image-to-knot (Reelmind-style, 2025).** Generate knotwork from an image/prompt. Useful
for ideation only; output is raster, not the parametric curve + over/under data we need to drive
metal. **Reject for production geometry; fine as a moodboard.**

### L2 — Strand geometry (layout → curves/meshes)

**L2a — Bézier/Catmull-Rom spline strands + parallel-transport framing.** Turn each strand of the
layout into a chain of cubic Bézier (or Catmull-Rom) segments, then sweep a cross-section along it
with a **parallel-transport frame (PTF)** so the channel doesn't twist on tight knot bends. This is
*exactly* the architecture Codrops' **"Building an Endless Procedural Snake with Three.js and WebGL"
(Feb 2026)** ships: a `CurveGenerator` emitting short cubic-Bézier segments, an `EndlessCurve` that
stitches them into one continuous memory-bounded path, **parallel transport frames for stable,
twist-free orientation**, and instanced geometry swept along the curve via data textures. A Celtic
strand is a closed/branching version of that snake. **Quality:** excellent, smooth at any zoom.
**Perf:** instanced sweep, GPU-friendly. **Complexity:** medium-high (PTF + branch handling). **Fit:
the recommended strand representation.**

**L2b — `TubeGeometry` / `ExtrudeGeometry` along a `CatmullRomCurve3`.** three.js core. `TubeGeometry`
sweeps a circular section (gives a raised cord); `ExtrudeGeometry` extrudes a 2D cross-section along a
path (gives a flat-bottomed *channel* profile). Cheap, zero deps, UVs run cleanly along the path
(`vUv.y` = arc-length) — which doc 09's flow advection needs. The catch: three.js's built-in tube
framing (Frenet) **flips on inflection points**, so on a knot it can twist; PTF (L2a) or pre-baking
the frames fixes it. **Quality:** good. **Perf:** great. **Fit: the practical Phase-1 strand mesh —
use `ExtrudeGeometry` with a U-shaped/channel cross-section to get the *groove*, not a raised cord.**

**L2c — Fat-line / ribbon strands (Line2, MeshLine, Babylon GreasedLine).** Render the strand as a
camera-facing thick line. Cheapest to author, GPU-batched, great for a *top-down* read (the
channel-hall is top-down, so screen-space width is fine). GreasedLine (the maintained 2025 MeshLine
port) and three's `Line2` both do width + per-point data. **Downside:** it's a flat ribbon, not a
carved groove with depth/walls — looks painted-on at grazing angles. **Fit: the LOW/static tier
fallback, and the top-down chamber where depth barely reads.**

**L2d — Pure-SDF channels (no geometry; carve in the fragment shader on a flat slab).** Don't build
strand meshes at all — render the whole knot as a **2D SDF evaluated in the basalt slab's fragment
shader**: each strand is a union of capsule/line-segment SDFs, the channel is `abs(sdf) - halfWidth`
(a groove = an offset/annulus of the strand SDF), the over/under is resolved by per-strand layer IDs.
This is the **GM Shaders "Signed Distance Fields" (Xor, Feb 2025)** + **IQ smin rewrite (2024→2025
updates)** toolkit: line-segment SDF, `smin` smooth-union for the fork/rejoin merges, and "add
outlines/glow/grooves once you know the distance to each shape." **Quality:** flawless edges at any
zoom, trivially animatable, and the groove + glow + Ogham-reveal all fall out of one distance value.
**Perf:** N strand-segments × per-pixel — fine if N is bounded (capsule SDF is cheap) and we don't
raymarch. **Fit: the recommended *carving* layer (L3), and on its own a viable whole-channel
solution for the top-down chamber.**

### L3 — The carved-groove look (cut-into-stone, metal inside)

**L3a — SDF groove in the stone shader** (preferred). Given the channel SDF `d` (distance to strand
centreline), `groove = abs(d) - halfW`; shade the **groove walls** with a darkened basalt + a normal
perturbation toward the centre (so light rakes the walls), and the **groove floor** with the metal
(doc 09's `gw_temp` flow). The classic reference is Ronja's `sdf_groove` shader (the inset/bevel
trick) and Xor's "outlines from distance." This carves *visually* with zero extra vertices.

**L3b — Real geometry groove (ExtrudeGeometry U-profile + normal/AO map).** Actually model the
channel cross-section as a recessed U; bake/derive normals so the walls catch light. Honest depth,
more vertices. **Use only where the camera gets close** (altar approach, contact arch); top-down can
use L3a.

**L3c — Displacement/parallax into a flat basalt slab.** A height/SDF map drives parallax-occlusion or
vertex displacement to fake the groove depth on a flat slab. POM is fill-rate heavy on mobile; vertex
displacement needs a dense slab. **Reject POM for iPhone; light vertex displacement is acceptable on
high tier only.**

**TSL/WebGPU note.** Safari 26 (Sep 2025) ships WebGPU on iOS, and Codrops' **"Rendering a Procedural
Vortex Inside a Glass Sphere with Three.js and TSL" (Mar 2025)** and **"Liquid Raymarching with TSL"**
show production SDF/procedural pipelines in TSL. **GAELWORX Phase 1 stays on WebGL/GLSL** (the slab is
`onBeforeCompile` GLSL; CI/`qa-route` assumes WebGL/SwiftShader) but the SDF math is `mix`/`smoothstep`/
`length` — it ports to TSL 1:1 later.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A hand-authored knot layout, expressed as splines, carved by an SDF groove — fully art-directed,
no solver at runtime, no fluid sim.** Concretely:

1. **L1 (layout, build-time):** author the GAELWORX channel as a **small hand-built planar graph /
   tile placement** (not a random generator) so the four-fork lands exactly under the altar pour and
   the strands rejoin into the letter run. Enforce strict over/under as a per-crossing layer ID. Bake
   this to a tiny JSON of control points + crossing data (a few KB) — *not* a runtime generator.
2. **L2 (strand geometry):** each strand = a **`CatmullRomCurve3` / cubic-Bézier chain** with a
   **parallel-transport frame** (per the Feb-2026 procedural-snake architecture) so it never twists on
   the knot. From the curve we get **(a) arc-length-parameterised UVs** for doc 09's flow, and **(b)**
   either an `ExtrudeGeometry` U-channel (close cameras) or feed the curve's segments into the SDF
   (top-down).
3. **L3 (the carve):** a **2D-SDF groove evaluated in the basalt slab's `onBeforeCompile` shader** —
   union of capsule SDFs (one per strand segment), `smin` for the fork/rejoin merges, `abs(d)-halfW`
   for the groove, layer IDs for over/under. The groove floor renders the metal (`gw_temp`); the
   walls darken + perturb the basalt normal; the A/E divine-fire glow leaks along the SDF to reveal
   Ogham.
4. **Fork-and-rejoin:** modelled as **one source curve → four child curves → one sink curve**, with
   `smin` blending the SDFs at the split/merge so the metal looks like it *parts and rejoins* a single
   body, not four pipes butted together (see §4).

**Why this and not alternatives:** GAELWORX needs a *specific, sacred, branded* knot that branches and
rejoins on a designed path — a random generator (L1d) or a live fluid sim (rejected in doc 09) fights
that. Hand layout + splines is deterministic and tiny; the SDF carve gives flawless edges at any zoom
on the iPhone 15, shares the slab's exact idioms (`onBeforeCompile`, `gw_fbm`, `v3(PAL.x)` inlining,
dt-damped store uniforms, HDR-only blooms), and produces in one distance value everything downstream
needs: the groove, the wall shading, the flow channel for doc 09, and the Ogham-reveal mask. It is
buildable in THIS codebase with zero new heavy deps.

---

## 4. IMPLEMENTATION

### Libraries / versions
- **three.js** (repo's r17x WebGL): `CatmullRomCurve3`, `CubicBezierCurve3`, `TubeGeometry`,
  `ExtrudeGeometry`, `MeshPhysicalMaterial` + `onBeforeCompile` (the repo's `shader-fx` chunk-injection
  pattern, identical to `ObsidianSlab.jsx`).
- **@react-three/fiber**, **@react-three/drei** (already in repo). No new deps.
- **Optional**: a build-time layout step (Node script, or hand-typed JSON). Knot layout reference
  implementations: dmackinnon1/celtic, bezborodow/celtic-knot. We do **not** ship a runtime generator —
  the layout is baked to `src/scene/knot.js` as control points + crossing IDs (a few KB), honoring the
  "no heavy runtime loads / no EXR" budget.
- For the top-down low/static tier: optionally `Line2`/`drei <Line>` fat lines, or stay all-SDF.

### 4.1 The knot layout data (build-time → `src/scene/knot.js`)

```js
// A strand = ordered control points (in slab UV space, 0..1) + a layer id.
// Over/under: at each crossing, the higher `layer` draws on top; the SDF uses it
// to mask the under-strand where it passes beneath. Strict alternation enforced
// when authoring (classic plaitwork rule). Authored by hand for the hero knot.
export const KNOT = {
  source: { id: 's0', pts: [[0.5,0.02],[0.5,0.12]], layer: 0 },   // altar feed
  // FOUR-BRANCH FORK: one source parts into four children, weave, then rejoin.
  branches: [
    { id: 'b0', from: 's0', pts: [[0.5,0.12],[0.30,0.22],[0.38,0.40],[0.50,0.52]], layer: 1 },
    { id: 'b1', from: 's0', pts: [[0.5,0.12],[0.43,0.24],[0.55,0.42],[0.50,0.52]], layer: 0 },
    { id: 'b2', from: 's0', pts: [[0.5,0.12],[0.57,0.24],[0.45,0.42],[0.50,0.52]], layer: 1 },
    { id: 'b3', from: 's0', pts: [[0.5,0.12],[0.70,0.22],[0.62,0.40],[0.50,0.52]], layer: 0 },
  ],
  sink: { id: 'k0', from: ['b0','b1','b2','b3'], pts: [[0.50,0.52],[0.5,0.66]], layer: 0 },
  run:  { id: 'r0', from: 'k0', pts: [[0.5,0.66],[0.2,0.8],[0.8,0.8],[0.5,0.9]], layer: 0 }, // to letters
}
// Each pts list becomes a CatmullRomCurve3; sampled to capsule segments for the SDF.
```

### 4.2 Building twist-free strand curves + arc-length (the snake-style PTF)

```js
// CatmullRomCurve3 gives smooth interpolation; getSpacedPoints() yields
// arc-length-even samples so doc 09's pour front advances at constant metal speed
// (the "arc-length, not uv.x" correctness upgrade flagged in doc 09 §7).
function buildStrand(pts, segs = 64) {
  const v = pts.map(([x, y]) => new THREE.Vector3(x, y, 0))
  const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal') // centripetal = no cusps on tight knots
  const spaced = curve.getSpacedPoints(segs)          // even arc-length samples
  // Parallel-transport frame instead of Frenet (Frenet flips on inflections → twist).
  const frames = parallelTransportFrames(spaced)      // {tangent,normal,binormal}[]
  return { curve, spaced, frames, length: curve.getLength() }
}
```
Parallel-transport framing is the exact twist-fix the Feb-2026 Codrops procedural-snake article uses;
on a knot with many inflection points it is non-negotiable (Frenet/TubeGeometry default twists).

### 4.3 The carved-groove SDF (HEAD block, injected on the basalt slab via `onBeforeCompile`)

```glsl
// --- shared, append to src/scene/shaders.js next to GLSL_NOISE / gw_temp ---
// capsule (thick line segment) SDF — Inigo Quilez / GM Shaders (Xor) line-segment SDF.
float gw_sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
// smooth-union (IQ smin) — used at the fork/rejoin so strands MERGE as one body.
float gw_smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
```

```glsl
// --- in the basalt slab's HEAD block ---
uniform vec4  uSeg[64];   // xy = a, zw = b  (capsule endpoints, baked from strands)
uniform float uSegLayer[64];
uniform int   uSegCount;
uniform float uChanW;     // channel half-width
uniform float uWallW;     // groove wall thickness
uniform float uFront;     // pour-front arc coord (from doc 09 / forge.scrollDamped)

// returns: x = signed dist to nearest channel centreline, y = that strand's layer
vec2 gwChannel(vec2 uv){
  float d = 1e3; float layer = 0.0;
  for(int i = 0; i < 64; i++){
    if(i >= uSegCount) break;
    vec4 s = uSeg[i];
    float di = gw_sdSeg(uv, s.xy, s.zw);
    // smin near the fork/rejoin makes the four branches read as one molten body;
    // away from junctions it behaves like a plain min.
    float nd = gw_smin(d, di, 0.012);
    if(di < d){ layer = uSegLayer[i]; }
    d = nd;
  }
  return vec2(d, layer);
}
```

### 4.4 The COLOR / NORMAL injection (carve + fill + over-under)

```glsl
// --- NORMAL block: rake the groove walls so light catches the carve ---
vec2  ch    = gwChannel(vUv);
float groove = abs(ch.x) - uChanW;            // <0 inside groove, ~0 on the wall lip
float wall  = smoothstep(uWallW, 0.0, abs(groove)); // bright band on the wall edge
// push the basalt normal toward the channel centre on the walls (fake bevel)
vec2  g = vec2(dFdx(groove), dFdy(groove));
normal = normalize(normal - vec3(g, 0.0) * wall * 1.2);

// --- COLOR block: floor = metal, walls = darkened basalt, A/E glow leaks out ---
float inGroove = smoothstep(0.0, -0.004, groove);  // 1 inside the channel floor
// arc coord along the strand for the pour front (use baked per-seg arc; uv.y here as stand-in)
float arc   = vUv.y;
float filled = step(arc, uFront);                  // metal present up to the front
float temp  = filled * (0.4 + 0.6 * gw_fbm(vUv*6.0 + uTime*0.1)); // body churn
temp += smoothstep(0.02, 0.0, abs(arc - uFront)) * 0.9 * filled;  // white-hot lip
vec3 metal  = gw_temp(temp);                       // SHARED master ramp (doc 09 / cooling)

// over/under: where a higher-layer strand overlaps, the under-strand floor is occluded
// (compute the top strand's groove separately and mask; simplified here as layer test).
vec3 basalt = gl_FragColor.rgb;
vec3 wallCol = basalt * 0.35;                       // darker recessed walls
gl_FragColor.rgb = mix(basalt, wallCol, wall);     // carve the walls
gl_FragColor.rgb = mix(gl_FragColor.rgb, metal, inGroove); // pour the metal in
// divine-fire A/E leak: add emissive that decays with distance from the groove,
// so the white-gold glow spills onto stone and reveals carved Ogham (doc 09 §5).
gl_FragColor.rgb += gw_temp(1.0) * exp(-abs(ch.x) * 60.0) * uAEGlow;
```

### 4.5 The r3f component shape

```jsx
function CelticChannels({ quality }) {
  const matRef = useRef()
  const segs = useMemo(() => bakeSegments(KNOT, quality === 'high' ? 64 : 32), [quality]) // {seg:Vec4[], layer:Float[]}
  const uniforms = useMemo(() => ({
    uTime:{value:0}, uFront:{value:0}, uChanW:{value:0.018}, uWallW:{value:0.01},
    uAEGlow:{value:1.0}, uSegCount:{value:segs.layer.length},
    uSeg:{value:segs.seg}, uSegLayer:{value:segs.layer},
  }), [segs])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color:new THREE.Color('#0a120e'), roughness:0.85, metalness:0.0 }) // green-black basalt
    m.defines = { USE_UV:'' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD_CHANNEL}`)         // GLSL_NOISE + gw_temp + gw_sdSeg + gw_smin + gwChannel
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL_CHANNEL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR_CHANNEL}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])
  useEffect(() => () => material.dispose(), [material])
  useFrame((s, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : s.clock.elapsedTime
    // ONE shared progress scalar — same source doc 09 uses for the pour front.
    uniforms.uFront.value = damp(uniforms.uFront.value, Math.min(forge.scrollDamped*1.1, 1), 3, dt)
  })
  // a single flat slab; the SDF does all the carving (top-down chambers).
  return <mesh material={material}><planeGeometry args={[11, 6.6, 1, 1]} /></mesh>
}
```

### Key uniforms & parameters
| Uniform | Drives | Source |
|---|---|---|
| `uSeg[]` / `uSegLayer[]` / `uSegCount` | the baked capsule segments + over/under layer | `bakeSegments(KNOT)` build-time |
| `uChanW` | channel (groove) half-width | constant, leva-tunable |
| `uWallW` | groove wall thickness / bevel | constant, leva-tunable |
| `uFront` | pour-front arc coord (metal extent) | `forge.scrollDamped`, **dt-damped** (shared with doc 09) |
| `uAEGlow` | divine-fire A/E leak onto stone (Ogham reveal) | route gate + `forge.ready` |
| `uTime` | groove-floor churn | `clock.elapsedTime`, frozen `=2` on static |

### Hooking the master temperature system
The groove floor calls the **shared `gw_temp()`** (defined once in `shaders.js`, used by the pour,
the cooling letters, AND here) so the metal in the channels is visibly the same cooling body as the
stream and the letters. The pour-front `uFront` is the **same damped scroll scalar** doc 09 uses, so
the front leaves a channel and enters a letter continuously. The basalt slab reuses `gw_fbm` /
`gw_caustic` from `shaders.js` for its stone grain — no new noise. Colors are inlined via
`v3(PAL.crimson)` / `v3(PAL.ember)`.

---

## 5. COHESION

- **Palette:** groove floor = `gw_temp` built from `PAL.crimson` (#C1292E) / `PAL.ember` (#E85D04) /
  HDR white-hot; basalt = the green-black void family (`#0a120e`, a desaturated `PAL.void` toward
  Connemara green); walls = basalt × 0.35. **No new colors.**
- **Material idiom:** identical to `ObsidianSlab.jsx` — `MeshPhysicalMaterial` + `onBeforeCompile`
  chunk injection at `<common>` / `<normal_fragment_maps>` / `<tonemapping_fragment>`, `m.defines =
  {USE_UV:''}`, `gw_`-namespaced shared GLSL, `dispose()` on unmount, dt-damped store uniforms in one
  `useFrame`. Nothing bespoke that fights the slab.
- **Bloom / lighting:** only the white-hot lip and the divine-fire A/E leak exceed 1.0, so the existing
  `Effects.jsx` bloom (`luminanceThreshold={0.55}`) catches exactly the hot channel cores and the
  Ogham-reveal glow and nothing else — the post-fx "only HDR blooms" rule. The groove walls are
  shaded *below* the lip so the carve reads as recessed, not glowing.
- **A+E divine fire:** `uAEGlow` leaks `gw_temp(1.0)` (white-gold) from the channel/letter SDF onto
  adjacent basalt, the same A+E law as the DOM `.forge-letter` ignite — expressed in carved stone, and
  the mechanism that makes Ogham readable (the sacred payoff). Ties to doc 09 §5 deep-dive 4.
- **Shared curve data:** the **arc-length-parameterised strand curves are the single source of truth**
  for both this geometry and doc 09's flow advection and the sparks' orbit path — one knot, one set of
  curves, consumed three ways. This is the contract that keeps the world from looking bolted-on.
- **Per-route scenes:** `scenes.js` already varies `veinScale`/`camZ`/`rotY`. The channel-hall
  (Automations) preset frames **top-down** (high `rotX`) and a denser layout; other chambers show the
  channels obliquely. One renderer, route-swapped via damping (the `forge-scene` single-renderer rule).
- **Motion law:** the pour-front advance is **Forge Reveal / Drift** — constant-velocity, dt-driven,
  no bounce; scroll *flares* it via the slab's existing `forge.scrollVel`/`uSurge` coupling. The carve
  geometry itself never moves (Brutalist: the stone is immovable; only the metal flows).

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Cost of the SDF carve:** an unrolled loop of N capsule SDFs per pixel. Capsule SDF is ~8 ALU ops;
  with **N ≤ 32 segments on mobile** that's ~256 ALU + a `smin` per step — comfortably inside the
  slab's existing fragment budget (the slab already does multi-octave `gw_fbm` per pixel). Keep the
  loop bounded with a compile-time array size and an `if(i>=uSegCount) break;` guard. **No render
  targets, no raymarch, no fluid passes.**
- **Why SDF beats geometry on mobile here:** flawless edges at any zoom from one flat slab; zero
  tessellation cost for the knot; the whole carve is fill-rate, not vertex, and the channel-hall is a
  single full-screen-ish plane.
- **Quality tiers (honor `useQuality` → high|low|static):**
  - **high:** N=64 segments, `smin` junctions, wall bevel via `dFdx/dFdy`, full `gw_temp` churn, A/E
    Ogham glow on. Optional `ExtrudeGeometry` U-channel for close chambers (altar/contact).
  - **low:** N=32 segments, plain `min` (drop `smin` cost), no `dFdx` bevel (flat groove), halve churn
    octaves (reuse `gw_fbm` — don't add). Or switch to `Line2` fat-line strands for the top-down read.
  - **static** (`prefers-reduced-motion`): freeze `uTime = 2`, fixed `uFront` at a mid-pour pose, no
    advection — a frozen "mid-pour" poster; `frameloop='demand'`.
- **Segment budget:** the knot's curves are sampled to ≤64 (high)/32 (low) capsules total across all
  strands; bake offline into the uniform array. Uniform-array of 64 `vec4` = 256 floats — trivial.
- **Texture budget:** **zero** new textures in the SDF path (no flow-map needed here — that's doc 09;
  the carve is pure analytic SDF). Optional baked AO/normal for the close-camera ExtrudeGeometry tier
  only, shipped as a small PNG (never EXR — the env-black-canvas scar).
- **Fill-rate:** the carve is one slab; the glow leak is `exp()`-decayed so its HDR area stays small →
  cheap mipmap bloom.
- **WebGPU upside (future, not Phase 1):** the per-pixel SDF loop is the kind of thing TSL + WebGPU
  (Safari 26 iOS) accelerates; moving the segment loop to a structured buffer is a clean Phase-2 lever,
  but ship WebGL first (CI/`qa-route`/SwiftShader assume WebGL/GLSL).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this technique class):**
1. **"Two sine waves" fake-knot.** The single biggest authenticity failure (flagged in `radial-svg`).
   Enforce **strict over/under via per-strand layer IDs** and verify every crossing alternates. If a
   strand goes over twice in a row, the layout is wrong, not the shader.
2. **Frenet/TubeGeometry twist on knot bends.** Built-in tube framing flips at inflection points and
   twists the channel. Use **parallel-transport frames** (the procedural-snake fix) or pre-bake frames
   from day one.
3. **Catmull-Rom cusps on tight turns.** Use **`'centripetal'`** Catmull-Rom (not uniform) or cubic
   Bézier; uniform CR overshoots and self-intersects on sharp knot corners.
4. **Front coordinate ≠ arc-length** (shared with doc 09). Bake **arc-length-even samples**
   (`getSpacedPoints`) so the pour front advances at constant metal speed through every knot; raw
   `uv.y`/`uv.x` makes it lurch around bends. This is the correctness upgrade — do it now, not later.
5. **SDF loop unbounded / dynamic-length array.** GLSL needs a compile-time array size; loop to a fixed
   `64` with an `if(i>=uSegCount) break;`. A dynamic loop or oversized array tanks mobile.
6. **`smin` everywhere.** `smin` is for the fork/rejoin *junctions* only; using it globally fattens and
   smears all crossings into mush. Keep `k` small (~0.012) and ideally only blend near junctions.
7. **Bloom washing the walls.** Keep groove walls and basalt ≤1.0; only the white-hot lip + A/E leak go
   HDR. Otherwise the carve glows and stops reading as *recessed*. (post-fx rule.)
8. **Over/under occlusion forgotten.** Drawing strands by nearest-distance alone ignores who's on top;
   the under-strand must be *masked* where a higher-layer strand passes over it, or the weave reads
   flat. Resolve with the layer ID, not just `min(distance)`.
9. **Forgetting `static`/no-JS.** Reduced-motion must show a believable frozen knot; crawlers/no-JS
   must not depend on the canvas (the channel-hall page still needs real HTML copy — `aeo-geo` rule).

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**
1. Hand-author `KNOT` layout in `src/scene/knot.js`; enforce strict over/under; eyeball as plain
   `<Line>` strands first (no SDF) to confirm the weave + the four-fork land right.
2. Add `gw_sdSeg` + `gw_smin` to `shaders.js` (next to `gw_temp` from doc 09). Tint a quad with the
   raw SDF to confirm the capsule field reads.
3. Bake `KNOT` → capsule segments (`bakeSegments`) with **arc-length sampling + centripetal CR +
   PTF**; feed `uSeg[]`. Render `gwChannel` distance as grayscale — confirm the knot shape.
4. Add the **groove carve** (NORMAL bevel + COLOR wall/floor split) on the basalt slab. Confirm it
   reads as *cut into stone*, walls catching light.
5. Resolve **over/under occlusion** via layer IDs; confirm the weave is correct top-down.
6. Add **`smin` at the fork/rejoin** only; confirm four branches part and rejoin as one molten body.
7. Pour metal into the floor with **shared `gw_temp` + `uFront`** (hand off the flow detail to doc 09);
   confirm the front advances and the white-hot lip reads.
8. Add the **A/E divine-fire leak + Ogham reveal** (`uAEGlow`, `exp`-decay onto basalt).
9. Wire **quality tiers** + the `static` frozen-knot poster; frame the channel-hall **top-down** in
   `scenes.js`.
10. Device read on the iPhone 15 OLED (true black, groove depth, white-gold A/E, weave legibility — the
    over/under and the carve depth don't simulate headless).

---

## 8. SOURCES (2025–2026)

- Jorge Toloza & contributors, **"Building an Endless Procedural Snake with Three.js and WebGL,"**
  Codrops — **2026-02-10**. `CurveGenerator` (short cubic-Bézier segments) + `EndlessCurve` stitching
  into a continuous memory-bounded path, **parallel-transport frames for twist-free orientation**,
  instanced geometry swept along the curve via data textures — the exact strand/PTF architecture this
  doc adopts. https://tympanus.net/codrops/2026/02/10/building-an-endless-procedural-snake-with-three-js-and-webgl/
- Xor (@XorDev), **"Signed Distance Fields,"** GM Shaders (mini.gmshaders.com) — **2025-02-19**.
  Line-segment/capsule SDFs, outlines/grooves/glow from the distance value, smooth unions — the SDF
  carve toolkit. https://mini.gmshaders.com/p/sdf
- Inigo Quilez, **"smooth minimum"** (full rewrite — normalization, kernels, circular smin, blend
  analysis) — rewrite **2024-2025** (announced via @iquilezles, refreshed through 2025). The `smin`
  used for the fork/rejoin merges. https://iquilezles.org/articles/smin/
- Codrops, **"Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL,"** —
  **2025-03-10**. Production 2D-SDF → procedural look pipeline in TSL (the WebGPU/TSL port path for
  this SDF math). https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/
- ReelMind, **"Generate Custom Celtic Knotwork Designs"** — **2025**. Survey of 2025 procedural
  knotwork methods (grid/tile, planar-graph, the 26-tile set, strict over-under rule, gaming/AR
  usage). https://reelmind.ai/blog/generate-custom-celtic-knotwork-designs
- D. MacKinnon, **dmackinnon1/celtic** — Celtic-knot pattern generator (JS + static-SVG renderer with
  crossing classes); actively referenced 2025. Live demo + source for the grid/plaitwork layout +
  over/under reference. https://github.com/dmackinnon1/celtic
- Damien Bezborodov, **bezborodow/celtic-knot** — SVG grid Celtic-knot generator; the
  grid-and-breakpoint plaitwork layout reference. https://github.com/bezborodow/celtic-knot
- three.js docs, **`CatmullRomCurve3` / `ExtrudeGeometry` / `TubeGeometry`** (r17x, current 2025-2026)
  — `centripetal` Catmull-Rom (cusp-free tight turns), arc-length `getSpacedPoints`, extruding a
  cross-section along a path for the channel profile.
  https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3 ·
  https://threejs.org/docs/pages/ExtrudeGeometry.html
- Babylon.js docs, **GreasedLine** (maintained MeshLine port, 2025) — GPU fat-line strands with
  per-point width/offset; the top-down low-tier fallback technique.
  https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Arc-length-baked knot SDF + over/under layer atlas.** Bake the hand-authored knot to (a)
   arc-length-even capsule segments and (b) a per-crossing layer/occlusion encoding, so `uFront`
   advances at constant metal speed *and* the weave's over/under is correct everywhere — the single
   biggest correctness upgrade, and the shared data contract with doc 09's pour and the spark orbit.
2. **The four-branch fork-and-rejoin as a graph node.** The exact geometry + `smin` blend by which one
   molten body parts into four strands, weaves with correct over/under, and rejoins into one — how the
   pour front *splits* across branches and *recombines*, and how to keep the metal reading as a single
   continuous body rather than four pipes.
3. **TSL/WebGPU port of the channel SDF.** With Safari 26 iOS WebGPU live, move the per-pixel capsule
   loop to a TSL structured-buffer SDF (per the Mar-2025 vortex + liquid-raymarching TSL pipelines);
   quantify the mobile headroom and the WebGL fallback story.
4. **A/E divine-fire light bleed onto basalt + Ogham reveal.** How the white-gold A/E groove glow
   actually illuminates adjacent stone (analytic `exp`-decay additive vs a baked emissive light map) to
   make carved Ogham readable — the sacred payoff, shared with doc 09 §5 and the cooling-gradient topic.
```
