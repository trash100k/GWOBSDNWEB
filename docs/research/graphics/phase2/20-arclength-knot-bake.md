# 20 — ARC-LENGTH-BAKED CELTIC-INTERLACE KNOT + OVER/UNDER LAYER ATLAS

_Phase 2 deep-dive · GAELWORX forge world · r3f + three.js (WebGL2/`onBeforeCompile`) · iPhone 15 OLED
primary judge · one shared renderer · warm-forge palette._

> Parent: [phase1/24 — Celtic Interlace Channel Geometry](../phase1/24-celtic-knotwork-interlace-geometry.md)
> (deep-dive candidate #1) and the shared-curve contract in [phase1/09 — The Pour](../phase1/09-flowmap-advection-pour.md)
> and [phase1/15 — Sparks/Embers](../phase1/15-gpu-particles-sparks-embers.md). Cohesion authority:
> [00-COHESION-MAP.md](../00-COHESION-MAP.md) §1 (master temperature), §2 (shared noise), §7 rule **#8**
> ("shares the channel curve data three ways").

---

## 1. SCOPE — the one knot, baked once, consumed three ways

This document owns the **single most load-bearing piece of pre-computed data in the GAELWORX world**: the
offline bake that turns the hand-authored Celtic-interlace knot into (a) **arc-length-even capsule
segments** with **parallel-transport frames** (no twist, no cusp), and (b) a **per-crossing over/under
layer + occlusion encoding**. That bake is the *single source of truth* that the cohesion map's rule #8
names — one knot consumed three ways:

1. **The channel geometry** — the carved SDF groove in the basalt (phase1/24): the floor that holds metal,
   the walls that catch light, the correct over/under weave at every crossing.
2. **The pour** (phase1/09) — `uFront` is an **arc-length coordinate**, so the white-hot leading edge of
   the metal advances at **constant physical speed** through every bend, fork and rejoin, never lurching
   fast on straights and crawling on curves.
3. **The spark orbit** (phase1/15) — the GPGPU sparks read the pour-front *position and tangent* off the
   same baked path, so they orbit the moving emitter as it winds the knot and splits across four branches.

The brief's two hard correctness demands are exactly the two halves of this bake. **Demand A: constant
metal speed.** Raw `uv.x`/`uv.y` parameterisation makes a UV unit cover more arc-length on a straight than
on a tight bend, so a front driven by `uv` visibly accelerates and decelerates around the knot — the #1
"reads as fake" tell after the over/under itself. The fix is to bake an **arc-length table** so the front
walks the path at constant velocity. **Demand B: strict over/under everywhere.** Real plaitwork alternates
over/under at *every* crossing (phase1/24 §1, the `radial-svg` authenticity law); nearest-distance SDF
union alone has no notion of "who is on top," so the under-strand must be *occluded* where a higher-layer
strand passes over it. That requires a **per-crossing layer/occlusion encoding** baked alongside the
segments.

Both demands are *data problems solved offline*, not runtime cost. The whole point of this doc is that the
expensive, fiddly, correctness-critical work (centripetal Catmull-Rom resampling, parallel-transport
framing, crossing detection, layer assignment, arc-length integration) happens **once at build time** and
ships as a few kilobytes of typed arrays / a tiny `DataTexture`. Runtime stays a cheap per-pixel capsule
loop plus two texture fetches — comfortably inside the iPhone-15 fill-rate envelope.

This element is the dominant read of the **channel-hall chamber (`/automations`, top-down)** where the
weave is fully legible, and the connective tissue between altar and letters in every other chamber. It must
share the master temperature/noise/lighting system (cohesion map §1, §2, §7) so nothing looks bolted-on.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The bake decomposes into four independently-solvable sub-problems: **(B1) cusp-free resampling**, **(B2)
arc-length parameterisation**, **(B3) twist-free framing**, **(B4) the over/under layer/occlusion atlas**.
Below, every viable modern approach with honest quality/perf/mobile/complexity tradeoffs.

### B1 — Cusp-free strand resampling

- **B1a — Centripetal Catmull-Rom (recommended).** `new THREE.CatmullRomCurve3(pts, false, 'centripetal')`.
  Centripetal (α=0.5) provably never self-intersects or forms cusps between control points, unlike the
  `'uniform'` (α=0) default which overshoots and loops on tight knot corners. The three.js core supports it
  directly; it is the documented cure for the exact failure phase1/24 §7 pitfall #3 names. **Quality:**
  excellent. **Perf:** build-time only. **Fit: the master resampler.**
- **B1b — Cubic Bézier chain (`CurveGenerator`/`EndlessCurve` pattern).** The Feb-2026 Codrops procedural-
  snake article authors strands as short cubic-Bézier segments stitched into one continuous path. More
  control over individual crossings (you place the handles), heavier to author. **Fit: optional for hand-
  tuning a problem crossing; Catmull-Rom is the default because our knot is authored as control points.**
- **B1c — B-spline / NURBS.** Overkill; no benefit here over centripetal CR for a hand-placed hero knot.

### B2 — Arc-length parameterisation (Demand A)

- **B2a — `getSpacedPoints(n)` / `getLengths()` (three.js core).** three's curve API integrates a
  cumulative arc-length table (`arcLengthDivisions`, default 200) and `getSpacedPoints` returns
  near-evenly-spaced samples. **Known caveat (verified 2025):** on `CatmullRomCurve3`, `getSpacedPoints`
  can still return points with mildly *uneven* spacing for large/curvy curves unless `arcLengthDivisions`
  is raised well above 200 (the documented github issue #10432 + the docs note). **Mitigation: set
  `curve.arcLengthDivisions = 1000` before sampling**, then resample. **Fit: the practical baker.**
- **B2b — Hand-rolled cumulative LUT + binary search (recommended, belt-and-braces).** Sample the curve
  densely (e.g. 2000 points), compute cumulative chord length, then build an inverse table `arc→t` and
  binary-search it to place perfectly even samples. This is the canonical "reparameterise by arc length"
  recipe and removes all dependence on three's internal precision. ~30 lines, build-time. **Fit: the doc's
  pick — own the arc-length table so the front is provably constant-speed.**
- **B2c — GPU arc-length in a compute/TSL pass (False-Earth-style storage buffers).** The Apr-2026 *False
  Earth* WebGPU project writes structured per-instance data into storage buffers in compute and reads it
  from any shader — the modern way to bake derived geometry data on-GPU. Overkill for a static hero knot
  (we bake once at build, not per-frame), but **the architecture to port to** when GAELWORX moves to
  WebGPU/TSL post-judge. **Fit: future, not Phase 2.**

### B3 — Twist-free framing (no twist/cusp on the channel cross-section)

- **B3a — Parallel-transport frames (PTF) — recommended.** Propagate the cross-section orientation forward
  along the curve by applying, at each step, the **minimal rotation that carries the previous tangent onto
  the new tangent** (rotation axis = `cross(T_prev, T_new)`, angle = `acos(dot(T_prev, T_new))`), then
  rotating the carried normal by that same rotation. This yields the minimum-twist (rotation-minimizing)
  frame. It is **exactly** the architecture the Feb-2026 Codrops procedural-snake article ships — "instead
  of computing frames independently, the normal is propagated forward along the curve by applying the same
  rotation that aligns the previous tangent with the new one, producing a stable frame with minimal twist"
  — and the classic giordi91 / Hanson-Ma RMF write-up. **Quality:** flawless, no flips. **Perf:** build-
  time. **Fit: the master framer.**
- **B3b — Frenet frames (`TubeGeometry` / `Curve.computeFrenetFrames`) — reject for the knot.** three's
  built-in tube framing uses Frenet, which **flips 180° at inflection points** (every S-bend in a knot),
  twisting the channel. phase1/24 §7 pitfall #2 names this. Acceptable only on a deliberately gentle arc
  (the falling pour stream, phase1/09), never on the interlace.
- **B3c — Fixed up-vector framing.** Cheap, but degenerates where the tangent aligns with the up-vector
  (top-down channel-hall has many such points). **Reject.**
- **B3d — Bake frames into a DataTexture, read in the vertex shader (recommended for the geometry tier).**
  The snake article stores per-spine-point position + frame in **data textures** and sweeps **instanced**
  cross-section geometry along the curve in the vertex shader. For the close-camera ExtrudeGeometry/swept
  tiers this is the GPU-friendly way to carry the PTF result. **Fit: the geometry-tier transport; the
  top-down SDF tier needs only the baked segment endpoints + layers, not full frames.**

### B4 — Over/under layer + occlusion atlas (Demand B)

- **B4a — Per-segment integer layer ID + nearest-with-priority (recommended baseline).** Each strand
  segment carries a `layer` (the plaitwork alternation, baked from the classic grid-and-mirror /
  tile-set rule — dmackinnon1/celtic, bezborodow/celtic-knot, the 26-tile survey). In the SDF, instead of a
  plain `min(distance)`, track **the nearest segment whose layer is highest among overlapping segments**;
  the under-strand is *masked* where a higher-layer segment is also within channel width. **Quality:**
  correct weave. **Perf:** one extra compare per segment in the existing loop. **Fit: the runtime resolver.**
- **B4b — Baked per-crossing occlusion atlas (recommended refinement).** Detect every crossing offline
  (segment-segment intersection in 2D), and for each crossing bake a small **occlusion record**: crossing
  centre, the two strand IDs, which is over, and a blend radius. At runtime the under-strand's groove is
  suppressed inside the over-strand's footprint near that crossing only — a clean, *local* occlusion rather
  than a global layer test that can mis-fire where non-crossing strands merely pass near each other. Encode
  the records in the same `DataTexture` as the segments. **Quality:** flawless local over/under. **Fit: the
  pick — pairs with B4a as a correctness backstop at junctions.**
- **B4c — Depth/height-channel encoding.** Give each strand a baked "height" so over-strands sit higher; in
  the SDF, shade by height and let the higher one win + cast a thin contact-shadow band onto the lower.
  This is what sells the *carved* over/under read (the over-strand's groove wall shadows the under-strand).
  **Fit: the visual finish layer on top of B4a/B4b.**
- **B4d — Render-order / stencil geometry (the mesh tier).** If strands are real swept meshes, draw over-
  strands after under-strands with depth test — trivial correct occlusion, but only for the geometry tier,
  not the flat-slab SDF. **Fit: close-camera ExtrudeGeometry chambers.**

### Cross-cutting: where to store the bake

- **Typed-array uniforms (`uniform vec4 uSeg[64]`)** — simplest, what phase1/24 prototypes. Fine for
  ≤64 segments. GLSL needs a compile-time array size + `if(i>=uSegCount) break;`.
- **`DataTexture` (FloatType/HalfFloatType, RGBA)** — recommended once segment count or per-crossing
  records grow past ~64 vec4s, or when the geometry tier needs per-point PTF frames in the vertex shader.
  Sample with `texelFetch`/`texture2D` at a computed UV. (The 2025 three.js guidance: use **RGBAFormat**
  not RGBFormat for mobile-chip compatibility; FloatType returns the raw value with no normalization.)
  **Fit: the master store — one small float texture carries segments, layers, arc-table and crossings.**

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A pure offline bake — centripetal Catmull-Rom → hand-rolled arc-length LUT → parallel-transport frames →
crossing detection with layer/occlusion atlas — emitted to one small `DataTexture` (+ a tiny JSON of
metadata), consumed at runtime by the SDF carve (top-down), the pour-front `uFront` arc coordinate, and
the spark orbit. No runtime solver, no generator, no fluid, no EXR.**

Concretely, the pipeline (build-time `scripts/bakeKnot.mjs` → `src/scene/knotBake.js` + `knot.png`/typed
array):

1. **B1a** centripetal Catmull-Rom per authored strand (cusp-free tight turns).
2. **B2b** own the arc-length LUT: dense-sample → cumulative chord length → inverse `arc→t` table → emit
   **arc-length-even** capsule endpoints. `uFront` is now a true metre-along-the-path coordinate shared by
   pour and sparks.
3. **B3a/B3d** parallel-transport frames per sample; emit the frame (tangent + normal) into the
   `DataTexture` for the geometry tier, and the bare endpoints for the SDF tier.
4. **B4a + B4b + B4c** detect crossings, bake the alternating layer IDs (strict plaitwork), bake a
   per-crossing occlusion record, and a per-strand height for the carved contact-shadow.
5. Emit one `knot` payload: `segments[]` (vec4 a.xy/b.xy), `layer[]`, `height[]`, `crossings[]`
   (centre.xy, overId, underId, radius), `arcLUT` (cumulative length per segment so the front maps to a
   segment + local t). Total: a few KB. Ship as a `DataTexture` (high tier / large knots) or uniform arrays
   (low tier / ≤64 segs).

**Why this and not alternatives.** GAELWORX needs a *specific, sacred, branded* knot whose four-fork lands
exactly under the altar pour — a runtime generator (phase1/24 L1d) or fluid sim (phase1/09 A3, rejected)
fights that and is uncontrollable on mobile. The bake is deterministic and tiny; it solves both correctness
demands *as data* so runtime is pure fill-rate (a bounded capsule loop the slab already affords). It shares
the slab's exact idioms (`onBeforeCompile`, `gw_fbm`/`gw_warp`, `v3(PAL.x)` inlining, dt-damped store
uniforms, HDR-only blooms) and produces in one distance value everything downstream needs. Critically, it
makes rule #8 *structural*: pour, weave, and spark orbit cannot drift because they all read the same baked
table.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- **three.js r17x** (repo WebGL): `CatmullRomCurve3` (with `'centripetal'`), `Vector3`, `Quaternion`,
  `DataTexture`, `MeshPhysicalMaterial` + `onBeforeCompile` (the repo's `shader-fx` chunk-injection
  pattern, identical to `ObsidianSlab.jsx`).
- **@react-three/fiber**, **@react-three/drei** (already in repo). **No new runtime deps.**
- **Build-time only:** a Node ESM script (`scripts/bakeKnot.mjs`) importing three for `CatmullRomCurve3`.
  Output committed to `src/scene/knotBake.js` (typed arrays) and/or a tiny `knot.png` RGBA-float texture.
  Layout reference: dmackinnon1/celtic, bezborodow/celtic-knot (over/under plaitwork rule).

### 4.2 The arc-length LUT bake (B2b — own it, do not trust raw uv)

```js
// scripts/bakeKnot.mjs  (build-time)  — emits arc-length-even samples + segment arc table.
import * as THREE from 'three'

function buildStrand(pts, segCount) {
  const v = pts.map(([x, y]) => new THREE.Vector3(x, y, 0))
  const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal') // B1a: no cusps on tight knots
  curve.arcLengthDivisions = 1000                                   // B2a caveat: raise precision

  // B2b: dense cumulative-length LUT, then invert arc -> t for perfectly even samples.
  const DENSE = 2000
  const lut = new Float32Array(DENSE + 1)        // cumulative arc length at each dense t
  let prev = curve.getPoint(0), acc = 0
  for (let i = 1; i <= DENSE; i++) {
    const p = curve.getPoint(i / DENSE)
    acc += p.distanceTo(prev); lut[i] = acc; prev = p
  }
  const total = acc                              // true arc length of this strand
  const sampleAtArc = (s) => {                   // binary search the inverse table
    let lo = 0, hi = DENSE
    while (lo < hi) { const m = (lo + hi) >> 1; (lut[m] < s ? lo = m + 1 : hi = m) }
    const i = Math.max(1, lo), t0 = (i - 1) / DENSE, t1 = i / DENSE
    const f = (s - lut[i - 1]) / Math.max(1e-6, lut[i] - lut[i - 1])
    return curve.getPoint(t0 + (t1 - t0) * f)
  }
  // even arc-length samples — THIS is what makes uFront constant-speed everywhere.
  const samples = []
  for (let k = 0; k <= segCount; k++) samples.push(sampleAtArc((k / segCount) * total))
  return { curve, samples, total }
}
```

### 4.3 Parallel-transport frames (B3a) — the twist/cusp killer

```js
// Minimal-rotation frame: carry the normal forward by the rotation that maps T_prev -> T_next.
function parallelTransportFrames(samples) {
  const N = samples.length
  const tangents = samples.map((p, i) =>
    samples[Math.min(i + 1, N - 1)].clone().sub(samples[Math.max(i - 1, 0)]).normalize())
  // seed an arbitrary normal orthogonal to the first tangent
  let normal = new THREE.Vector3(0, 0, 1)
  if (Math.abs(tangents[0].dot(normal)) > 0.9) normal.set(0, 1, 0)
  normal.sub(tangents[0].clone().multiplyScalar(tangents[0].dot(normal))).normalize()
  const frames = []
  const q = new THREE.Quaternion()
  for (let i = 0; i < N; i++) {
    if (i > 0) {
      const t0 = tangents[i - 1], t1 = tangents[i]
      const axis = t0.clone().cross(t1)
      const len = axis.length()
      if (len > 1e-6) {                         // rotate normal by the same T0->T1 rotation
        axis.multiplyScalar(1 / len)
        const ang = Math.acos(THREE.MathUtils.clamp(t0.dot(t1), -1, 1))
        q.setFromAxisAngle(axis, ang)
        normal.applyQuaternion(q).normalize()
      }
    }
    const binormal = tangents[i].clone().cross(normal).normalize()
    frames.push({ T: tangents[i].clone(), N: normal.clone(), B: binormal })
  }
  return frames                                  // rotation-minimizing — no flip at inflections (B3b cured)
}
```

### 4.4 Crossing detection + over/under layer/occlusion atlas (B4)

```js
// Detect 2D segment crossings across ALL strands; assign strict-alternating layers + occlusion records.
function bakeCrossings(segs /* [{a,b,strandId,segIdx,layer}] */) {
  const crossings = []
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++) {
      if (segs[i].strandId === segs[j].strandId) continue
      const x = segSegIntersect(segs[i].a, segs[i].b, segs[j].a, segs[j].b)
      if (!x) continue
      // strict plaitwork alternation is enforced when AUTHORING layer parity; here we just record
      // who is over (higher layer wins; ties broken by baked strand height).
      const over = (segs[i].layer !== segs[j].layer)
        ? (segs[i].layer > segs[j].layer ? i : j)
        : (segs[i].height > segs[j].height ? i : j)
      const under = over === i ? j : i
      crossings.push({ c: x, overSeg: over, underSeg: under, r: 0.020 }) // r = occlusion blend radius
    }
  return crossings
}
```

The runtime resolver then uses **B4a (layer priority)** for the broad weave and **B4b (the baked crossing
records)** for clean local occlusion at junctions.

### 4.5 The runtime carve — SDF + arc-length front + over/under (basalt slab `onBeforeCompile`)

Shared GLSL appended to `src/scene/shaders.js` (next to `GLSL_NOISE`, `gw_forge`, `gwCool01`):

```glsl
// capsule (thick line segment) SDF  — IQ / GM-Shaders Xor line-segment SDF.
float gw_sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float gw_smin(float a, float b, float k){               // IQ smooth-union — fork/rejoin merges ONLY
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
```

```glsl
// --- basalt slab HEAD block ---
uniform sampler2D uKnotTex;   // baked atlas: row0 = seg a.xy/b.xy, row1 = layer/height/arcStart/arcLen ...
uniform int   uSegCount;
uniform float uChanW;         // channel half-width
uniform float uWallW;         // groove wall thickness / bevel band
uniform float uFront;         // ARC-LENGTH pour-front (0..totalArc), SHARED with pour + sparks
uniform float uTotalArc;      // baked total path length (for normalization)

// returns: x = signed dist to nearest channel centreline
//          y = winning layer   z = local arc coord at the nearest point (for the pour front)
vec3 gwChannel(vec2 uv){
  float d = 1e3, layer = 0.0, arcAtNearest = 0.0;
  float occlude = 0.0;                                   // B4: under-strand suppression near crossings
  for (int i = 0; i < 64; i++){
    if (i >= uSegCount) break;
    vec4 ab  = texelFetch(uKnotTex, ivec2(i, 0), 0);     // a.xy, b.xy
    vec4 meta= texelFetch(uKnotTex, ivec2(i, 1), 0);     // layer, height, arcStart, arcLen
    float di = gw_sdSeg(uv, ab.xy, ab.zw);
    // smin ONLY tightens the fork/rejoin junctions (small k) so 4 branches read as one body.
    float nd = gw_smin(d, di, 0.012);
    if (di < d){                                         // track nearest + its arc coord
      // project uv onto this segment to recover local arc, add baked arcStart
      vec2 pa = uv - ab.xy, ba = ab.zw - ab.xy;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      arcAtNearest = meta.z + h * meta.w;
      // B4a: if a HIGHER-layer segment is also within channel width here, this one is UNDER -> occlude.
      layer = meta.x;
    }
    d = nd;
  }
  return vec3(d, layer, arcAtNearest);
}
```

```glsl
// --- NORMAL block: rake the groove walls so light catches the carve (fake bevel) ---
vec3  ch     = gwChannel(vUv);
float groove = abs(ch.x) - uChanW;                  // <0 inside groove, ~0 on the wall lip
float wall   = smoothstep(uWallW, 0.0, abs(groove));
vec2  g      = vec2(dFdx(groove), dFdy(groove));
normal = normalize(normal - vec3(g, 0.0) * wall * 1.2);

// --- COLOR block: floor = metal (SHARED ramp), walls = darkened basalt, A/E glow leaks out ---
float inGroove = smoothstep(0.0, -0.004, groove);
float arc      = ch.z / uTotalArc;                  // 0..1 normalized ARC coordinate (constant speed!)
float front    = uFront / uTotalArc;
float filled   = step(arc, front);                  // metal present up to the arc-length front
float age      = (front - arc) * uTotalArc * uAgeScale;     // seconds since this point received metal
float temp     = gwCool01(age, uCoolRate);          // SHARED cooling clock (cohesion map §1.3)
temp += smoothstep(0.02, 0.0, abs(arc - front)) * 0.9 * filled;   // white-hot meniscus lip
vec3  metal    = mix(gw_forge(temp), gw_divineFire(uFlick), uIsAEChannel);  // SHARED temp/divine path

vec3 basalt  = gl_FragColor.rgb;
gl_FragColor.rgb = mix(basalt, basalt * 0.35, wall);            // carve walls (recessed, darker)
gl_FragColor.rgb = mix(gl_FragColor.rgb, metal, inGroove * filled); // pour metal into the floor
// divine-fire A/E leak: white-gold spill decays with distance from groove -> reveals Ogham (cohesion §5.2)
gl_FragColor.rgb += gw_divineFire(uFlick) * exp(-abs(ch.x) * 60.0) * uAEFirePow;
```

The **over/under occlusion** (B4b) is applied by, for each fragment, also testing the *nearest higher-layer*
segment: if a higher-layer capsule is within `uChanW` of the fragment AND a baked crossing record places a
crossing nearby, the under-strand's `inGroove` is suppressed inside the over-strand's footprint, and a thin
contact-shadow band (B4c, from the height delta) darkens the under-strand's floor at the lip — that shadow
is what *sells* "this strand passes beneath that one."

### 4.6 The r3f component shape

```jsx
import { U } from './forgeUniforms'            // the Master Forge Uniform pool (cohesion map §4.2)

function CelticChannels() {
  const q = forge.quality
  const knot = useMemo(() => loadKnotBake(q === 'high' ? 64 : 32), [q]) // baked DataTexture + meta
  const local = useMemo(() => ({
    uKnotTex:  { value: knot.tex },
    uSegCount: { value: knot.segCount },
    uTotalArc: { value: knot.totalArc },
    uChanW:    { value: 0.018 }, uWallW: { value: 0.010 },
    uAgeScale: { value: 1.0 },   uCoolRate: { value: 0.45 },
    uIsAEChannel: { value: 0.0 }, uFlick: { value: 0.0 },
  }), [knot])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a120e'), roughness: 0.85, metalness: 0.0 }) // green-black basalt
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, local)       // SAME references as the whole world (cohesion §4.2)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD_CHANNEL}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL_CHANNEL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR_CHANNEL}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [local])
  useEffect(() => () => { material.dispose(); knot.tex.dispose() }, [material, knot])
  // uFront / uTemp / uFlick are driven by the ONE <ForgeDriver/> writing the shared U pool. This
  // component reads U; it does not author the heat. uFront is the ARC-LENGTH front (constant speed).
  return <mesh material={material}><planeGeometry args={[11, 6.6, 1, 1]} /></mesh>
}
```

### 4.7 The shared data contract (rule #8, made concrete)

The single `uFront` is an **arc-length** scalar in `[0, uTotalArc]`. The `<ForgeDriver/>` advances it from
`forge.scrollDamped` (dt-damped). Three consumers read it:

| Consumer | Reads | Result |
|---|---|---|
| **Channel SDF (this doc)** | `uFront` vs baked `arcStart+h*arcLen` | metal fills to a constant-speed front |
| **Pour** (phase1/09) | same `uFront`; advection scrolls the molten texture | front leaves channel, enters letter continuously |
| **Sparks** (phase1/15) | `getKnotPoint(uFront)` + tangent off the baked LUT | sparks orbit the moving emitter along the path, per-branch |

The baked `arcLUT` also exposes a JS `getKnotPoint(arc) -> {pos, tangent, branchWeights}` for the spark
emitter, so the sparks track the front *and* split heat across the four fork branches.

---

## 5. COHESION (shares the world's spine)

- **Master temperature (§1):** the groove floor calls **`gw_forge(temp)`** and cools via **`gwCool01(age,
  uCoolRate)`** — the *same* functions the slab veins, the pour, and the cooling letters use. A cooling
  point in a channel is *visibly the same metal* as a cooling letter because it samples the same ramp on
  the same clock. The A/E channel segments route through **`gw_divineFire`** via `uIsAEChannel`, never
  reaching `uTemp` — the keystone exception (§1.4) expressed in carved stone.
- **Shared noise (§2):** the basalt grain and floor churn reuse `gw_fbm`/`gw_warp` at the shared
  `GW_FBM_OCTAVES` — no second noise. The SDF adds *zero* noise; it is pure analytic capsule distance.
- **Palette (§3):** floor = `gw_forge` from `PAL.crimson`/`PAL.ember`/`PAL.hot`; basalt = green-black void
  family (`#0a120e`, desaturated `PAL.void` toward Connemara green); walls = basalt × 0.35. All via `v3()`.
  Only the white-hot meniscus and the A/E leak exceed 1.0, so the **palette is the bloom selector** — the
  existing `mipmapBlur` bloom catches exactly the hot channel cores and the Ogham-reveal glow.
- **Lighting (§5):** the channels are lit *only* by their own metal plus the `uAEFirePow`/`uAEFire` divine
  spill — the same `U`-pool signal the basalt and Ogham read, so the carved Ogham along the channel walls
  rises from black exactly as the A/E light approaches (cohesion §5.2). No fill light.
- **Single uniform pool (§4.2):** `Object.assign(sh.uniforms, U, local)` binds the *same references* as
  every chamber material; the one `<ForgeDriver/>` mutates `U.uFront`/`U.uTemp`/`U.uHeat` and the whole
  world heats on one heartbeat. A strike surges the channel meniscus, the slab veins, and the sparks **in
  the same frame** — the cohesion proof.
- **Rule #8 (the contract):** the baked knot is the *single source of truth* for channel geometry, pour
  flow, and spark orbit — one knot, three consumers, all reading the arc-length table, so fill, weave, and
  depth cannot drift.
- **Motion law:** the front advances at **constant velocity** (Forge Reveal / Drift) — now *literally*
  true because `uFront` is arc-length. Scroll *flares* it via `forge.scrollVel`/`uHeat`; the carved stone
  itself never moves (Brutalist: the stone is immovable, only the metal flows).

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

The judge device is fill-rate-bound (cohesion §10): pixels are the enemy, not triangles. This technique is
deliberately **all bake, minimal runtime**.

- **Runtime cost:** an unrolled loop of `N` capsule SDFs + one `texelFetch` pair per segment per pixel.
  Capsule SDF ≈ 8 ALU; `N ≤ 32` on mobile → ~256 ALU + a `gw_smin` per step — comfortably inside the slab's
  existing multi-octave `gw_fbm` budget. Two `DataTexture` fetches per segment are cache-friendly (the atlas
  is tiny). **No render targets, no raymarch, no fluid passes, no per-frame CPU.**
- **Bake cost:** zero at runtime — centripetal CR, arc-LUT, PTF, crossing detection all run in
  `scripts/bakeKnot.mjs` at build time. Output is a few KB.
- **Storage:** ≤64 segments → either `uniform vec4 uSeg[64]` (256 floats, trivial) or a 64×4 RGBA-float
  `DataTexture`. Use the texture once per-crossing records + arc-table are included; **RGBAFormat,
  FloatType** (or HalfFloat on the half-float-only tier). **No EXR, ever** (the env-black-canvas scar).
- **The four levers (cohesion §10):** DPR cap 1.5; bloom `resolutionScale 0.5`; `GW_FBM_OCTAVES` 4→3→2 by
  tier (the basalt grain, not the SDF); the SDF loop bound itself is the fourth knob — `uSegCount` 64→32.
- **Quality tiers:**
  - **high:** N=64, `smin` junctions, `dFdx/dFdy` wall bevel, full `gw_forge` churn, per-crossing occlusion
    atlas (B4b) + contact-shadow (B4c), A/E Ogham leak on. Optional ExtrudeGeometry U-channel + render-order
    occlusion (B4d) for close chambers (altar/contact).
  - **low:** N=32, plain `min` (drop `smin`), no `dFdx` bevel (flat groove), layer-priority occlusion only
    (B4a, drop the per-crossing atlas), halve churn octaves (reuse `gw_fbm`).
  - **static** (`prefers-reduced-motion` / weak GPU): freeze `uTime=2`, fix `uFront` at a mid-pour arc
    pose, no advection — a dignified frozen "mid-pour" poster; `frameloop='demand'`.
- **INP / first paint:** `renderer.compileAsync` the channel material before first interaction so the
  capsule-loop shader compile doesn't block the first scroll; alloc-free `useFrame` (no `new` per frame).
- **WebGPU upside (future, not Phase 2):** the per-pixel capsule loop and the bake are exactly what
  TSL + WebGPU storage buffers accelerate — *False Earth* (Apr-2026) writes derived geometry into storage
  buffers in compute and reads it from any shader; the segment loop becomes a structured-buffer iterate.
  Authored TSL-portable, but ship WebGL2/GLSL to the judge (CI/`qa-route`/SwiftShader assume WebGL).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this technique class):**

1. **Trusting raw `uv` for the front (Demand A failure).** A `uv`-driven front lurches around bends. Bake
   the **arc-length LUT** and make `uFront` a metres-along-path coordinate **from day one** — this is the
   whole reason the doc exists, not a later upgrade.
2. **`getSpacedPoints` precision.** On `CatmullRomCurve3` it can return uneven spacing unless
   `arcLengthDivisions` is raised (≥1000); better, own the LUT (B2b) and don't depend on three's internal
   table at all.
3. **Frenet/`TubeGeometry` twist on inflections (Demand-adjacent).** Built-in tube framing flips at every
   S-bend. Use **parallel-transport frames**; verify by sweeping a flat ribbon and checking it never rolls.
4. **Uniform Catmull-Rom cusps.** Use **`'centripetal'`** — uniform CR overshoots and self-intersects on
   sharp knot corners.
5. **Nearest-distance union ignores over/under (Demand B failure).** Plain `min(distance)` has no notion of
   "on top." Resolve with **layer priority (B4a) + the baked per-crossing occlusion atlas (B4b)**; the
   under-strand must be *masked* in the over-strand's footprint, with a contact-shadow band (B4c).
6. **`smin` everywhere.** `smin` is for the fork/rejoin *junctions* only (`k≈0.012`); global `smin` fattens
   and smears every crossing into mush. Ideally blend near junctions only.
7. **Two-sine fake knot.** Enforce **strict over/under alternation when authoring layer parity** (classic
   plaitwork rule, dmackinnon1/celtic). If a strand goes over twice in a row, the *layout* is wrong, not
   the shader.
8. **Bloom washing the walls.** Keep groove walls and basalt ≤1.0; only the white-hot meniscus and the A/E
   leak go HDR, or the carve glows and stops reading as recessed.
9. **GLSL dynamic array length.** Loop to a fixed `64` with `if(i>=uSegCount) break;`. A dynamic loop or
   oversized array tanks mobile.
10. **DataTexture format.** Use **RGBAFormat + FloatType** (not RGBFormat — mobile-chip incompat); set
    `texture.needsUpdate = true`; disable mip generation; `NearestFilter` so `texelFetch` reads exact
    baked values, no interpolation across unrelated segments.

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**

1. **Bake first.** Write `scripts/bakeKnot.mjs`: centripetal CR → arc-LUT (B2b) → arc-even capsule
   endpoints. Dump to JSON; eyeball as plain `<Line>` strands (no SDF) — confirm the weave + four-fork land
   right and segment spacing is visibly even on straights *and* bends.
2. **Add PTF (B3a)** to the bake; sweep a debug ribbon and confirm zero twist at inflections.
3. **Crossing + layer/occlusion atlas (B4)** in the bake; render crossings as dots coloured by over/under;
   confirm strict alternation.
4. **Add `gw_sdSeg` + `gw_smin`** to `shaders.js`; tint a quad with the raw SDF to confirm the capsule field.
5. **Bake → `DataTexture`/uniforms;** render `gwChannel.x` as grayscale — confirm the knot shape; render
   `gwChannel.z` (arc coord) as a ramp — confirm it climbs **uniformly** along the path (Demand A proof).
6. **Groove carve** (NORMAL bevel + COLOR wall/floor split); confirm it reads as cut into stone.
7. **Over/under occlusion** via layer + crossing atlas + contact-shadow; confirm the weave is correct
   top-down (Demand B proof).
8. **`smin` at fork/rejoin only;** confirm four branches part and rejoin as one molten body.
9. **Pour metal** with **shared `gw_forge` + `gwCool01` + arc-length `uFront`**; confirm the meniscus lip
   advances at constant speed through every bend (the payoff of steps 1+5).
10. **A/E divine-fire leak + Ogham reveal** (`uAEFirePow`, `exp`-decay); wire **quality tiers** + the
    `static` frozen poster; frame the channel-hall **top-down** in `scenes.js`.
11. **Device read** on the iPhone 15 OLED (true black, groove depth, white-gold A/E, weave legibility,
    *constant front speed* — none of these simulate headless).

---

## 8. SOURCES (2025–2026)

- Jorge Toloza & contributors, **"Building an Endless Procedural Snake with Three.js and WebGL,"** Codrops —
  **2026-02-10**. The exact strand architecture this bake adopts: cubic-Bézier segment generation stitched
  into a continuous path, **parallel-transport frames** ("the normal is propagated forward along the curve
  by applying the same rotation that aligns the previous tangent with the new one, producing a stable frame
  with minimal twist"), and **per-point frame data baked into data textures** with instanced cross-section
  geometry swept in the vertex shader.
  https://tympanus.net/codrops/2026/02/10/building-an-endless-procedural-snake-with-three-js-and-webgl/
- Ming Jyun Hung, **"False Earth: From WebGL Limits to a WebGPU-Driven World,"** Codrops — **2026-04-21**.
  WebGPU + TSL **storage buffers** to write structured/derived geometry data on the GPU and read it from any
  shader; indirect draw + compute-baked per-instance data — the future-port architecture for moving this
  bake on-GPU. https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
- Maxime Heckel, **"The Field Guide to TSL and WebGPU,"** maximeheckel.com — **2025**. TSL node materials,
  compute shaders, **storage buffers as GPU-persistent arrays read by compute and render shaders**, and the
  SDF-collision particle example — the reference for the TSL-portable authoring + the WebGPU upgrade lane.
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Xor (@XorDev), **"Signed Distance Fields,"** GM Shaders (mini.gmshaders.com) — **2025-02-19**. The
  line-segment/capsule SDF, building grooves/outlines/glow from the distance value, smooth unions, and
  onion/layer tricks — the carve + over/under toolkit. https://mini.gmshaders.com/p/sdf
- Inigo Quilez, **"smooth minimum"** (full rewrite: normalization, kernels, blend analysis), iquilezles.org
  — rewrite **2024–2025** (refreshed through 2025 via @iquilezles). The `gw_smin` used for the fork/rejoin
  merges. https://iquilezles.org/articles/smin/
- mrdoob/three.js, **issue #10432 + `CatmullRomCurve3` docs (`arcLengthDivisions`, `getSpacedPoints`,
  `getLengths`)**, current r17x docs referenced **2025**. The documented arc-length precision caveat that
  justifies owning the LUT (B2b) and the `'centripetal'` parameter (cusp-free tight turns).
  https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3 ·
  https://github.com/mrdoob/three.js/issues/10432
- Codrops, **"How to Create a Liquid Raymarching Scene Using Three.js Shading Language (TSL),"** maintained
  through **2025** (TSL tag / `phobon/raymarching-tsl` 2025 repo). Production SDF-in-TSL pipeline (capsule/
  smooth-union SDFs, lighting) — the WebGPU/TSL port path for this SDF math; TSL compiles to WGSL on WebGPU,
  falls back to GLSL on WebGL. https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/
  · https://github.com/phobon/raymarching-tsl
- D. MacKinnon, **dmackinnon1/celtic** + Damien Bezborodov, **bezborodow/celtic-knot** — Celtic-knot
  plaitwork generators (grid-and-mirror, crossing classes, strict over/under), actively referenced **2025**;
  the over/under-layer authoring reference for B4. https://github.com/dmackinnon1/celtic ·
  https://github.com/bezborodow/celtic-knot
- ReelMind, **"Generate Custom Celtic Knotwork Designs,"** reelmind.ai — **2025**. Survey of 2025 procedural
  knotwork methods (grid/tile, planar-graph, the 26-tile set) and the strict over-under rule. (Moodboard /
  layout-method reference only; output is raster.) https://reelmind.ai/blog/generate-custom-celtic-knotwork-designs

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The four-branch fork-and-rejoin as a graph node + branch-weighted front split.** How the arc-length
   front *splits* across four child curves at the fork and *recombines* at the sink — per-branch arc tables,
   `smin` blend radii at the degree-4 nodes, and keeping the metal reading as one continuous body (not four
   pipes) while the pour front and per-branch spark heat-weights stay consistent.
2. **The DataTexture knot atlas as the universal curve carrier.** A single packed float texture (segments +
   PTF frames + arc LUT + crossing/occlusion records + branch weights) read by the SDF carve, the swept
   geometry vertex shader, the pour advection, AND the JS spark emitter — formalising rule #8 as one asset
   and quantifying the byte budget across tiers.
3. **TSL/WebGPU port of the channel SDF + on-GPU bake.** Move the per-pixel capsule loop to a TSL
   structured-buffer SDF and the bake (arc-LUT, PTF, crossings) into a compute pass (per *False Earth* /
   Heckel storage buffers), quantifying iPhone-15 Safari-26 headroom and the WebGL2 fallback story.
4. **Per-crossing occlusion + carved contact-shadow fidelity.** The exact encoding and shading that makes
   over/under read as *carved depth* — the over-strand groove wall casting a thin analytic contact shadow
   onto the under-strand floor at each junction, height-channel driven, vs a baked AO band for close cameras.
