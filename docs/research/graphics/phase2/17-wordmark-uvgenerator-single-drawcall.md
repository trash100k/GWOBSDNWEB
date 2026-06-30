# 17 — Custom UVGenerator + Merged-Geometry Single-Draw-Call Wordmark

_Phase 2 deep-dive · cluster **D-type-knot-reveal** · GAELWORX forge world · target: iPhone 15 OLED, one WebGL renderer (r3f 8 + three r169)_

> **Owns the draw-call ceiling and the UV substrate of the volumetric `GAELWORX` wordmark.** Phase-1 doc 11
> picked the lane (SVG → `ExtrudeGeometry`, baked once, patched via `onBeforeCompile`) and named this exact
> deep-dive as its candidate #2: _"a correct side-wall + bevel UV generator and merging the 7 letters into
> one geometry with per-vertex `aLetterIndex`/`aIsAE` attributes for one draw call — the real perf ceiling
> work."_ Phase-2 doc 02 authored the per-letter cooling curve that this geometry must carry. This doc
> resolves the two engineering problems that decide whether the hero wordmark is **one draw call with clean,
> continuous UVs** or **seven draw calls with stretched garbage side walls**. It does not re-derive the
> cooling curve (doc 02), the temperature ramp (doc 01 / cohesion §1), or the divine-fire exception (cohesion
> §1.4) — it makes the geometry that **feeds** them correctly.

---

## 1. SCOPE — this element in the GAELWORX world

The wordmark is the **climax vessel**: seven Cinzel Decorative 900 letterforms `G A E L W O R X`, extruded
into real 3D solids, that the living molten metal **physically fills left-to-right** from the stone altar.
Each glyph has a **front face**, **side walls** (the inner and outer extruded contour), and a **chamfered
bevel rim**. The metal climbs the interior; each filled region cools through the master ramp white-hot →
orange → forge-red → iron-black with ember veins, **except the first `A` and first `E`**, which hold
white-gold divine fire forever and radiate onto the basalt to reveal Ogham.

For that to work, **three numbers must reach the fill/cool shader at every fragment** — and they all come
from geometry this doc owns:

1. **A continuous left-to-right fill coordinate** that runs cleanly across the front face *and* up the side
   walls of every letter, normalized against the **whole wordmark bbox** (the pour axis `uPourFront`
   compares against this). If the side-wall UV is broken, the metal "climbing the inside edge" tears.
2. **A per-letter index** `aLetterIndex` (0..6) so the shader can offset each glyph's cooling phase (earlier
   letters are older/cooler — doc 02 §4.3) and so per-letter uniforms (`uLetterX0/X1`) can be packed into a
   small array indexed by the attribute.
3. **An A/E divine-fire flag** `aIsAE` (0 or 1) baked **per vertex** so the keystone exception is data, not
   a fragile string match in a shader (cohesion §7 rule 5).

The two hard problems:

- **ExtrudeGeometry's stock side-wall UVs are broken** for our purpose (three.js #1396, #4994, #31312). Its
  `WorldUVGenerator.generateSideWallUV` picks `x` or `y` per edge by a magnitude heuristic and pairs it with
  `1 - z` — which produces *per-letter local* coordinates with axis-flips at corners, not a continuous
  *wordmark-global* fill axis. We must either supply a correct `UVGenerator` or bypass it.
- **Seven separate `<mesh>` = seven draw calls + seven materials.** On the iPhone-15 fill-rate budget
  (cohesion §10), draw-call overhead is real CPU cost per frame, and seven materials means seven uniform
  update paths and seven shader binds. The hero should be **one merged geometry, one material, one draw
  call**, with per-letter data carried in attributes — the genuine ceiling work.

This is the single piece of geometry where "play with the letters," "metal fills forms," "the A/E are
eternal," and "hold 60fps on a phone" all collide. Get the UVs and the merge right and the wordmark is a
cohesive, cheap, correct vessel; get them wrong and it's the most visible bug in the build.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Two orthogonal axes: **(A)** how the side-wall + bevel UVs are produced, and **(B)** how the seven glyphs
collapse to one draw call. Each has its own modern options.

### 2A. The UV-generation axis

**2A.1 — Custom `UVGenerator` object passed to `ExtrudeGeometry` (the in-engine path).**
`ExtrudeGeometry` accepts a `UVGenerator` with two callbacks. In **r169** (this repo's pin) the signatures
are:

```js
generateTopUV( geometry, vertices, indexA, indexB, indexC )            // 3 verts (a tri of a cap face)
generateSideWallUV( geometry, vertices, indexA, indexB, indexC, indexD ) // 4 verts (a quad of the wall)
```

`vertices` is the **flat extrusion vertex buffer** (`vertices[i*3 + 0/1/2]` = x/y/z); the function returns
an array of `THREE.Vector2`. The default `WorldUVGenerator.generateSideWallUV` does:

```js
const a_x = vertices[indexA*3], a_z = vertices[indexA*3+2]; // …b,c,d
if ( Math.abs(a_y - b_y) < Math.abs(a_x - b_x) )
  return [ new Vector2(a_x, 1-a_z), new Vector2(b_x, 1-b_z), new Vector2(c_x, 1-c_z), new Vector2(d_x, 1-d_z) ];
else
  return [ new Vector2(a_y, 1-a_z), … ];
```

That `1 - z` and the x/y axis-pick are exactly why the side walls are unusable as a global fill axis: `z` is
**extrusion depth**, not "height up the letter," and the x/y choice flips at corners. The 2025 issue
**#31312 (opened 2025-06-25)** requested adding a `side` argument (`'top'`/`'bottom'`/`'side'`) to make
custom generators easier — a signal the API is actively being improved, **but that arg is NOT in r169**, so
we write the generator against the current 5/6-arg signatures and key on `z` to detect cap-vs-wall.
- **Quality:** can be made exactly right (we control the mapping).
- **Cost/mobile:** zero runtime — runs once at bake.
- **Complexity:** medium; the gotcha is that the generator runs *during* extrusion before the final buffer
  exists, so global normalization (against the wordmark bbox, which spans all 7 letters) **cannot** happen
  here — you only know one shape's local extents. Hence 2A.3.

**2A.2 — Community `ShapeBasedUVGenerator` (box-projection factory).**
The well-circulated CodePen pattern (novogrammer's `ShapeBasedUVGeneratorFactory`) computes a shape bbox and
box-projects top + side UVs into `[0,1]` per shape. Good for tiling a texture onto one extruded shape;
**still per-shape-local**, so it does not by itself give a wordmark-global fill axis. Useful as a template,
not a drop-in.
- **Quality:** clean per-letter UVs; **wrong frame of reference** for our continuous pour.
- **Verdict:** borrow the box-projection math, re-base it globally in the shader (2A.3).

**2A.3 — Emit raw object-space position into `uv`, normalize in the shader (the bypass — recommended core).**
Phase-1 doc 11 §4c already prescribes this: have the generator (or a post-bake pass) write **raw
object-space coordinates** into the `uv` attribute for every vertex — `uv = (localX, localY)` for caps and a
contour-arclength + depth pair for walls — then do **all** normalization in GLSL against `uFillMin/uFillMax`
(wordmark bbox) and per-letter `uLetterX0/X1`. This sidesteps the broken generator entirely and is the only
way to get a **wordmark-global** axis (the generator can't see the union bbox). It also lets the *front face*
and the *outer side wall* share one `gx` fill coordinate, so metal reads as contiguous across face→wall.
- **Quality:** highest for our exact need (continuous global fill).
- **Cost/mobile:** zero runtime; the normalization is two `mad` ops per fragment.
- **Complexity:** low-medium; needs a correct side-wall contour-distance (so the wall's vertical maps to
  "up the letter," not extrusion depth).

**2A.4 — Bake UVs offline in Blender, ship GLB.**
The cleanest *artistic* unwrap, but it's the only lane that fetches a runtime 3D asset (breaks the repo's
"geometry is generated, not loaded" ethos; cohesion §10 hard constraint). Reserve for a v2 if fidelity
forces it.

**2A.5 — TSL / node-driven attributes (r184+, 2026).**
With TSL first-class (r184–r185, 2026), the fill coordinate can be an `attribute()`/`varying()` node and the
ramp an `emissiveNode` `Fn()`. **Identical math**, node-expressed, auto-compiling to WGSL+GLSL. But the
`@react-three/postprocessing` chain and r169 here are WebGL2; the WebGPU fallback is less battle-tested
(cohesion §10). **Author the generator + shader as pure functions so the TSL port is mechanical; ship GLSL
now** (Phase-2 candidate §9.3).

### 2B. The single-draw-call axis

**2B.1 — `BufferGeometryUtils.mergeGeometries([...7 letters])` with custom attributes (recommended).**
Merge the seven extruded letter geometries into **one** `BufferGeometry`, after stamping each with its own
`aLetterIndex` and `aIsAE` per-vertex attributes (and the raw-position `uv`). One geometry + one material =
**one draw call**. The 2025–2026 perf literature is unanimous that this is the canonical "turn N draw calls
into 1" move for static, never-independently-moving geometry, and that it beats `InstancedMesh` here because
there's no per-instance overhead and the seven glyphs are *different* shapes, not repeats. `mergeGeometries`
requires **consistent attributes across all inputs** (every letter must have `position`, `normal`, `uv`,
`aLetterIndex`, `aIsAE`, same itemSize, same typed-array type) or it throws — so stamp attributes *before*
merging.
- **Quality/perf:** ideal — 1 call, 1 material, ~a few thousand tris total.
- **Mobile:** best. Confirm with `renderer.info.render.calls`.
- **Caveat:** a merge is one-time; you can't move a single letter afterward (we don't need to — letters are
  static, the *metal* animates in-shader).

**2B.2 — `mergeGeometries(geoms, true)` with material groups (NOT what we want).**
Passing `useGroups=true` keeps one sub-group per source geometry so you can assign an **array of materials** —
which **re-introduces one draw call per group**. That's the opposite of the goal. We pass `useGroups=false`
(default) and carry per-letter difference in **attributes**, driving everything from **one** material. (Groups
are the right tool only if a letter needed a genuinely different *material*, which it doesn't — divine-fire is
a flag, not a material.)

**2B.3 — `BatchedMesh` (r156+).**
Combines multiple geometries sharing a material into one draw call, with per-instance frustum culling and the
ability to add/remove geometries at runtime. Overkill for a **fixed, always-visible 7-glyph** wordmark — its
runtime-mutable machinery buys us nothing and costs complexity. Keep in the toolbox for a future dynamic
type system, not the hero mark.

**2B.4 — `InstancedMesh`.**
Wrong tool: instancing renders **the same geometry** many times. Our seven glyphs are seven different shapes.
(Instancing would only apply if we drew, say, identical ember particles — which is `Embers.jsx`'s job.)

| Approach | Draw calls | Per-letter data | Different shapes | Runtime mutable | Fit |
|---|---|---|---|---|---|
| **mergeGeometries (no groups) + attributes** | **1** | attributes | ✅ | ✖ (fine) | **pick** |
| mergeGeometries + useGroups | 7 | material array | ✅ | ✖ | ✖ (defeats goal) |
| BatchedMesh | 1 | per-instance | ✅ | ✅ | overkill |
| InstancedMesh | 1 | per-instance | ✖ | ✅ | wrong (same shape only) |
| 7 separate meshes | 7 | per-material | ✅ | ✅ | baseline to beat |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: 2A.3 (emit raw object-space into `uv`, normalize globally in the shader) × 2B.1
(`mergeGeometries` with no groups, carrying `aLetterIndex` + `aIsAE` per-vertex attributes) = one merged
geometry, one patched `MeshPhysicalMaterial`, one draw call.**

Justification:

1. **It is the only combination that gives a continuous wordmark-global fill axis AND one draw call.** The
   generator can't normalize globally (it never sees the union bbox); the shader can. Merging without groups
   collapses to one draw; attributes carry the per-letter difference the cooling curve (doc 02) and the
   divine-fire keystone (cohesion §1.4) need.
2. **It bypasses the documented broken side-wall UVs** (#1396/#4994/#31312) instead of fighting them — we
   write *position* into `uv` and own the mapping in GLSL, where we already patch every hot material via
   `onBeforeCompile`.
3. **It costs nothing at runtime.** Bake once in `useMemo` (the `buildGem` pattern), dispose on unmount. The
   whole per-frame cost is uniform writes on **one** material + two `mad` ops per fragment.
4. **It plugs straight into the shared spine.** One material binds the master `U` pool (cohesion §4.2); the
   ramp is `gw_forge`/`gw_divineFire` from `shaders.js`; the cooling is `gwCool01` from doc 02. The wordmark
   becomes "the same metal at a different point on the cooling timeline," not a separate widget.
5. **Attributes, not uniforms-per-letter, is the scalable shape.** `aLetterIndex` lets us index small
   `uniform float uLetterX0[7]` arrays (or a packed data texture) — one update path, not seven materials.

Fallback ladder: if a future need arises for a genuinely per-letter *material* (it shouldn't), 2B.2 groups;
if the wordmark ever goes WebGPU, 2A.5 TSL (authored portable now). Bevel-rim UVs get the same raw-position
treatment as the walls (§4.4), so the chamfer reads as continuous cast metal, not a UV seam.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three@^0.169` (repo pin): `SVGLoader` (`three/addons/loaders/SVGLoader.js`), `ExtrudeGeometry`, `Box3`,
  `Float32BufferAttribute`, `MeshPhysicalMaterial`, and **`mergeGeometries`** from
  `three/addons/utils/BufferGeometryUtils.js`. **No new dependency.**
- r3f `^8.17` + drei `^9.114` (already present). `<Center>` optional.
- **Version caveats locked now:** (a) r169 `generateSideWallUV` is **6-arg, no `side` param** — the `side`
  arg from issue #31312 is dev/future, do not rely on it. (b) `ExtrudeGeometry` default `depth`/`bevelThickness`
  moved at **r133** (depth→1, bevelThickness→0.2); we pass explicit values so defaults never bite. (c)
  `TextGeometry`/`FontLoader` live in `examples/jsm` since r133 (the fallback lane imports from `three/addons`).
  (d) `WorldUVGenerator` is **private** since r93 — don't reference it; ship our own object.

### 4.2 Per-letter geometry build + attribute stamping (bake once)

```js
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import * as THREE from 'three'

// WORDMARK_SVG: GAELWORX in Cinzel Decorative 900, <path> outlines, letter-play kerning baked.
// Group/path ids 'L0'..'L6' (left→right); the A path and the E path additionally tagged 'AE'.
const EXTRUDE = {
  depth: 0.32,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.035,      // < thickness — a chamfer, not a round-over (brand: sharp 0px)
  bevelOffset: 0,
  bevelSegments: 2,      // hard cast edge, low tris
  curveSegments: 8,      // raise locally only if Cinzel serifs facet on device
  UVGenerator: ForgeUV,  // §4.3 — writes RAW object-space into uv
}

function buildLetters(svgText) {
  const { paths } = new SVGLoader().parse(svgText)
  const geos = []
  paths.forEach((p, li) => {
    const isAE = (p.userData?.node?.id || '').includes('AE') ? 1 : 0
    SVGLoader.createShapes(p).forEach((shape) => {       // holes via winding (counters of G O R A)
      const g = new THREE.ExtrudeGeometry(shape, EXTRUDE)
      g.scale(1, -1, 1)                                   // SVG is Y-down — flip so cooling runs rim→base
      g.computeVertexNormals()
      const n = g.attributes.position.count
      // PER-VERTEX attributes — stamped BEFORE merge so all inputs share the same attribute set
      g.setAttribute('aLetterIndex', new THREE.Float32BufferAttribute(new Float32Array(n).fill(li), 1))
      g.setAttribute('aIsAE',        new THREE.Float32BufferAttribute(new Float32Array(n).fill(isAE), 1))
      geos.push(g)
    })
  })
  return geos
}
```

### 4.3 The `ForgeUV` generator — raw object-space, cap vs wall

The generator's job is **not** to normalize (it can't see the union bbox) — it's to write coordinates the
shader can normalize, and to make the **side wall's vertical axis = letter height**, not extrusion depth.
Cap faces get `(localX, localY)`; side walls get `(contourArcLength, depthFraction)` — but we want the wall's
fill to track *height up the letter*, so we emit the wall vertex's **object-space Y in uv.x** (so it shares
the cap's horizontal-then-global-normalized axis is handled in-shader) and keep a second channel for the
height. The robust, minimal version: **emit object-space XY for caps, and object-space (X, Y) for walls too**
— i.e. write `position.xy` into `uv` for every vertex, regardless of cap/wall. Because both faces and the
outer wall share the glyph's XY footprint, the shader's global `gx` is continuous across them automatically.

```js
const ForgeUV = {
  // Caps (front/back): raw object-space XY → shader normalizes against wordmark bbox.
  generateTopUV(geometry, vertices, ia, ib, ic) {
    const ax = vertices[ia*3], ay = vertices[ia*3+1]
    const bx = vertices[ib*3], by = vertices[ib*3+1]
    const cx = vertices[ic*3], cy = vertices[ic*3+1]
    return [ new THREE.Vector2(ax, ay), new THREE.Vector2(bx, by), new THREE.Vector2(cx, cy) ]
  },
  // Side walls + bevel: raw object-space XY of each wall vertex (NOT 1-z, NOT the x/y heuristic).
  // Sharing the cap's XY makes the fill front read continuously from face onto the climbing edge.
  generateSideWallUV(geometry, vertices, ia, ib, ic, id) {
    const v = (i) => new THREE.Vector2(vertices[i*3], vertices[i*3+1])
    return [ v(ia), v(ib), v(ic), v(id) ]
  },
}
```

Note `ExtrudeGeometry` calls `generateSideWallUV` for **both** the straight wall quads **and** the bevel
quads (the bevel is just more extruded rings), so this one function covers the chamfer too — the bevel rim
inherits the same continuous XY, no seam. The only thing this loses vs a "true" contour-arclength is precise
texture tiling *around* the contour — which we don't need, because our shader keys off the **global X**
(pour axis) and **object-space Y** (cool-from-rim), not a tiled texture.

### 4.4 Measure the union bbox + merge to ONE geometry

```js
function buildWordmark(svgText) {
  const letters = buildLetters(svgText)
  // Union bbox = the pour axis (X) and the height extent (Y) for shader normalization.
  const union = new THREE.Box3()
  letters.forEach((g) => { g.computeBoundingBox(); union.union(g.boundingBox) })
  // ONE draw call: no groups, attributes carry per-letter difference.
  const merged = mergeGeometries(letters, /* useGroups = */ false)
  letters.forEach((g) => g.dispose())   // sources no longer needed
  merged.userData.union = union          // → uFillMin/uFillMax, uHeightMin/Max
  return merged
}
```

If `mergeGeometries` returns `null`, an attribute set differs across letters (the #1 merge failure) — every
input must have `position, normal, uv, aLetterIndex, aIsAE`, all same itemSize/type. Stamp before merge.

### 4.5 The single material — patch `MeshPhysicalMaterial` the GAELWORX way

One material, binding the master `U` pool (cohesion §4.2), the shared `gw_*` functions (cohesion §1–2), and
declaring the two custom attributes so the GLSL `attribute` lines resolve.

```js
function makeForgeWordmarkMaterial(union, U) {
  const m = new THREE.MeshPhysicalMaterial({ roughness: 0.42, metalness: 0.9, color: 0x000000 })
  m.defines = { USE_UV: '' }                 // ensure vUv plumbing exists
  m.customProgramCacheKey = () => 'gw-wordmark'
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U, {       // bind the SAME references as slab/jewel/channels
      uFillMin:    { value: union.min.x }, uFillMax: { value: union.max.x },   // pour axis
      uHeightMin:  { value: union.min.y }, uHeightMax:{ value: union.max.y },  // cool-from-rim axis
    })
    // ---- VERTEX: declare attributes, pass them + raw uv as varyings ----
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */`
        #include <common>
        attribute float aLetterIndex;
        attribute float aIsAE;
        varying float vLetterIndex;
        varying float vIsAE;
      `)
      .replace('#include <uv_vertex>', /* glsl */`
        #include <uv_vertex>
        vLetterIndex = aLetterIndex;
        vIsAE        = aIsAE;
      `)
    // ---- FRAGMENT: the fill + cool + divine-fire, all from shared functions ----
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */`
        #include <common>
        uniform float uTime, uTemp, uHeat;          // master pool
        uniform float uPourFront;                   // 0..1 left→right fill front (journey-driven)
        uniform float uFillMin, uFillMax, uHeightMin, uHeightMax;
        uniform float uCoolRate;                    // doc 02 cooling-rate constant
        varying float vLetterIndex, vIsAE;
        ${/* gw_fbm, gw_forge, gw_divineFire, gwCool01 come from the shared header inlined elsewhere */''}
      `)
      .replace('#include <emissivemap_fragment>', /* glsl */`
        #include <emissivemap_fragment>
        // 1) GLOBAL fill coordinate across the WHOLE wordmark (uv.x = raw object X)
        float gx = clamp((vUv.x - uFillMin) / max(uFillMax - uFillMin, 1e-4), 0.0, 1.0);
        // 2) per-letter cooling phase: earlier letters are older → cooler (doc 02 §4.3)
        float letterPhase = vLetterIndex / 6.0;                  // 0..1 across G..X
        float filled = smoothstep(gx - 0.015, gx + 0.015, uPourFront); // soft meniscus at the front
        // 3) age behind the front → cooling curve (doc 02). Ahead of front = void vessel.
        float age = max(uPourFront - gx, 0.0) + letterPhase * 0.12;     // older to the left
        float cool01 = gwCool01(age, uCoolRate);                 // 0 hot → 1 iron-black
        float temp = (1.0 - cool01) * (0.78 + 0.22 * uHeat);     // strike/scroll surge
        // 4) vertical: rim stays a touch hotter than the base (cools rim→down)
        float vy = clamp((vUv.y - uHeightMin) / max(uHeightMax - uHeightMin, 1e-4), 0.0, 1.0);
        temp *= mix(0.92, 1.0, vy);
        // 5) the metal — shared ramp; A/E branch HARD to divine fire (never reach uTemp/cooling)
        float flick = gw_fbm(vUv * 5.0 + uTime * 0.4) * 0.5 + 0.5;
        vec3 molten = gw_forge(temp);                            // gw_tempColor * gw_tempEmissive
        vec3 divine = gw_divineFire(flick);                      // white-gold, eternal, blooms
        vec3 metal  = mix(molten, divine, vIsAE);                // the keystone exception
        // 6) ember veins crack the cooled iron (floored so they never die — "metal is alive")
        float ember = pow(gw_fbm(vUv * 9.0 + uTime * 0.06), 1.0);
        metal += gw_forge(0.45) * ember * 0.18 * (1.0 - vIsAE) * cool01;
        vec3 vessel = ${'/* PAL.void */ vec3(0.043,0.047,0.063)'} * 0.4;  // hollow before the pour
        totalEmissiveRadiance += mix(vessel, metal, filled);
      `)
    m.userData.shader = shader
  }
  return m
}
```

Adding emissive **before** `#include <tonemapping_fragment>` (via `totalEmissiveRadiance`) means AgX/ACES
processes it and only the `>1` band (A/E, fresh pour front) blooms — the palette **is** the bloom selector
(cohesion §3.1, §5.1). `m.toneMapped` stays true.

### 4.6 The r3f component — one mesh, one material, dt-damped

```jsx
function Wordmark() {
  const geo = useMemo(() => buildWordmark(WORDMARK_SVG), [])
  const mat = useMemo(() => makeForgeWordmarkMaterial(geo.userData.union, U), [geo])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])  // disposal (cohesion §4.3)

  useFrame((state, dt) => {
    const u = mat.userData.shader?.uniforms; if (!u) return
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    // POUR: front sweeps left→right, driven by the SAME journey signal as veins/channels.
    const target = forge.ready ? THREE.MathUtils.clamp(forge.scrollDamped / 0.6, 0, 1) : 0
    const since  = performance.now() / 1000 - forge.strikeAt
    const surge  = since >= 0 && since < 1.6 ? Math.exp(-since * 3) * 0.85 : 0
    u.uPourFront.value = THREE.MathUtils.damp(u.uPourFront.value, target, 2.5, dt)
    u.uHeat.value      = THREE.MathUtils.damp(u.uHeat.value, Math.min(forge.scrollVel, 1) + surge, 4, dt)
    u.uTime.value      = t
    // uTemp / uCoolRate ride the shared pool — written once by <ForgeDriver/>, not here.
  })

  return <mesh geometry={geo} material={mat} />   // ← ONE draw call
}
```

Gate inside `ForgeCanvas` by `forge.route`; reuse `CameraRig`. Confirm the win:
`console.log(gl.info.render.calls)` should show **one** call for the whole wordmark (was 7).

---

## 5. COHESION — shared palette / lighting / uniforms

This element binds the **same master systems** as the slab, jewel, channels, and embers — by construction,
not by coincidence:

- **One temperature authority.** Color is `gw_forge(temp)` = `gw_tempColor × gw_tempEmissive` from
  `shaders.js`; cooling is `gwCool01(age, uCoolRate)` from doc 02; divine fire is `gw_divineFire(flick)`. The
  wordmark **never invents an orange** (cohesion §7 rule 1). A cooling letter and a cooling slab vein are
  visibly the same metal because they sample the same curve.
- **One uniform pool.** The material `Object.assign`s the shared `U` references (cohesion §4.2) — `uTime`,
  `uTemp`, `uHeat`, `uPourFront`, `uCoolRate`. Mutating `U.uHeat.value` in `<ForgeDriver/>` flares the
  wordmark, slab veins, jewel edges, and channel pour **in the same frame** on a strike — that synchrony is
  the cohesion proof (cohesion §7 rule 6).
- **One noise basis.** Ember veins and the divine-fire flicker use the shared `gw_fbm` at the shared
  `GW_FBM_OCTAVES` — the metal in the letters and the metal in the slab share grain (cohesion §2, §7 rule 2).
- **One palette, HDR convention intact.** Only `PAL.hot`/`gold`/`divine` (the A/E, the fresh front) exceed
  1.0 and therefore are the only things that bloom; cooled iron and the hollow vessel sit ≤1 and stay true
  black on the OLED (cohesion §3.1, §5.1). No raw hex except where `PAL` would be inlined by the build's
  `v3()` helper in the real header.
- **The keystone, expressed identically.** `aIsAE` is the **3D twin of the DOM `.forge-letter` ignite rule**
  — the first `A` and first `E` per the brand law (CLAUDE.md), baked as per-vertex data, branching hard to
  divine fire that **never reaches `uTemp` or `gwCool01`** (cohesion §1.4, §7 rule 5). The same two letters
  glow in prose and in metal.
- **Lit only by the metal.** The material is `MeshPhysicalMaterial`, so it catches the same procedural PMREM
  env (cohesion §5.3) — no EXR. The A/E emissive >1 feeds the shared `uAEFire`/`uAEFirePow` signal that the
  **basalt and Ogham receivers read** to reveal the lore (cohesion §5.2) — the wordmark is literally the
  light source for the altar's reveal beat.
- **One clock, dt-damped.** Every uniform animates via `THREE.MathUtils.damp(cur, tgt, λ, dt)` from the
  `forge` store — never `lerp`, never a second rAF (cohesion §7 rule 6; `motion-feel`).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

**The whole point of this doc is a fill-rate/CPU win.** On the iPhone 15 (DPR capped 1.5, ~9–10 ms steady
budget, cohesion §10), the wordmark must be nearly free outside its fragment cost.

- **Draw calls: 7 → 1.** `mergeGeometries` (no groups) collapses the wordmark to a single draw + single
  material bind + single uniform-update path. Verify `gl.info.render.calls`. This is the headline saving and
  the reason this work exists.
- **Triangles are not the constraint; fill-rate is.** 7 glyphs at `curveSegments 8` / `bevelSegments 2` is a
  few thousand tris — negligible. The cost is the fragment shader over the letters' screen coverage. Keep the
  fragment cheap: 2 `gw_fbm` taps (ember + flicker), no worley, no extra texture fetch (raw-uv bypass means
  **zero ramp texture binding** — the closed-form ramp keeps the HDR contract obvious and saves a dependent
  read; doc 02 §2.2).
- **Attributes are tiny.** `aLetterIndex` + `aIsAE` are 2 floats/vertex on a few-thousand-vertex mesh —
  kilobytes. No per-instance buffers, no data texture needed at this scale (a `uLetterX0[7]` uniform array is
  enough if per-letter X extents are ever required).
- **Bake once, dispose on unmount.** Geometry built in `useMemo`, freed in `useEffect` cleanup
  (`renderer.info.memory` must stay flat across navigation — cohesion §4.3).
- **Quality tiers (`high|low|static`):**
  - **high:** full bevel (`bevelSegments 2`, `curveSegments 8`), A/E feed `uAEFire` RectAreaLight pair (≤2,
    cohesion §5.2), bloom catches the HDR.
  - **low:** `bevelSegments 1`, `curveSegments 6`, A/E glow via emissive only (no RectAreaLights), `GW_FBM_OCTAVES`
    dropped one (thins ember detail uniformly — cohesion §7 rule 9).
  - **static** (reduced-motion / weak GPU): freeze `uTime=2`, set `uPourFront=1` (fully filled, cooled still,
    A/E still lit), `frameloop='demand'`. The DOM Cinzel + `.forge-letter` wordmark is the no-JS/AEO fallback
    regardless.
- **Bloom discipline:** only A/E and the fresh pour front exceed 1.0 — do **not** push every cooled letter
  >1 or the whole wordmark washes (cohesion §3.1, `post-fx`).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

1. **Stamp attributes BEFORE merging.** `mergeGeometries` throws/returns `null` if any input lacks an
   attribute the others have. Every letter gets `position, normal, uv, aLetterIndex, aIsAE` (same itemSize/
   type) first; merge second. This is the #1 merge failure.
2. **Pass `useGroups=false`.** `mergeGeometries(geoms, true)` keeps per-source groups → one draw call **per
   group** → defeats the entire purpose. Carry per-letter difference in **attributes**, not material groups.
3. **Own the UVs in the shader; bypass the broken generator.** Don't try to make `generateSideWallUV` emit a
   global axis — it can't (it only sees one shape, before the union bbox exists, and before merge). Emit
   **raw object-space XY** for caps *and* walls, normalize against `uFillMin/uFillMax` in GLSL (#1396/#4994/
   #31312). The `side` arg from #31312 is **not in r169** — don't write code that expects it.
4. **Flip Y immediately, then bbox.** SVG is Y-down; `g.scale(1,-1,1)` per letter *before* the union bbox, or
   the wordmark is upside-down and the rim→base cooling runs backwards.
5. **Establish the pour axis from the UNION bbox, not per-letter.** `gx` must normalize against the whole
   wordmark's X range or the fill jumps between letters instead of sweeping continuously (doc 11 §7.5).
6. **Recompute normals after scale-flip.** `g.scale(1,-1,1)` inverts winding/normals; call
   `computeVertexNormals()` (or `g.toNonIndexed()` considerations) so the bevel lights correctly and faces
   aren't inside-out.
7. **Fix winding/holes before the shader.** Counters of `G O R A` (and the bowl of `R`) are holes;
   `SVGLoader.createShapes` handles them by winding — verify each letter renders **solid with correct
   counters** before adding fill, or the metal bleeds into the counter.
8. **Keep the A/E branch HARD-separated.** `mix(molten, divine, vIsAE)` is fine, but ensure the A/E path
   **never evaluates `uTemp`/`gwCool01` as its result** — the keystone breaks the instant the A/E read the
   cooling signal (cohesion §1.4). Stamp `aIsAE` from the SVG `'AE'` id at bake; never string-match in-shader.
9. **Bind the SAME `U` references, not clones.** `Object.assign(shader.uniforms, U)` — if you clone the
   uniform objects, the wordmark drifts off the world's heartbeat and the strike no longer flares it in sync.
10. **Chamfer, not round-over.** `bevelSize < bevelThickness`, `bevelSegments 2`. Brand is sharp 0px
    brutalism; a fat soft bevel reads plastic and off-brand.
11. **Verify the win, then the look.** `gl.info.render.calls === 1` for the wordmark; `npm run build` green;
    `qa-route` 393×852 + 1440×900 **0 console errors** (SwiftShader compiles the GLSL — a typo surfaces here);
    **then the iPhone 15 OLED read** (bloom on A/E, true-black cooled iron, continuous fill front across
    face→wall — none of which simulate headless).
12. **Test the static tier** (fully-filled cooled still, frozen time, A/E lit) — the reduced-motion judge sees
    it and it's the easiest path to forget.

**Order:** SVG outline correct (900-weight, AE tagged) → per-letter extrude + Y-flip + normals → stamp
`aLetterIndex`/`aIsAE` → union bbox → `ForgeUV` raw-position UVs → `mergeGeometries(false)` → patch one
material binding `U` → wire `uPourFront`/`uHeat` to `forge.*` day one → verify 1 draw call → device read →
static tier.

---

## 8. SOURCES (2025–2026)

1. three.js issue **#31312 — _ExtrudeGeometry: Custom `uv` coordinates examples_**, opened **2025-06-25**.
   Confirms the side-wall UV pain, the current `generateTopUV(geometry, vertices, indexA, indexB, indexC)` /
   `generateSideWallUV(…, indexD)` signatures, and the proposal to add a `side` arg (`'top'/'bottom'/'side'`)
   — the live evidence the API is mid-evolution and the `side` arg is NOT yet shipped.
   https://github.com/mrdoob/three.js/issues/31312
2. three.js source — **`src/geometries/ExtrudeGeometry.js` (dev / r169)**: the exact `WorldUVGenerator`
   (`generateSideWallUV` picking `x`/`y` by edge magnitude and pairing with `1 - z`), `Float32BufferAttribute`
   uv plumbing — the basis for why we bypass it. Current 2025–2026.
   https://github.com/mrdoob/three.js/blob/dev/src/geometries/ExtrudeGeometry.js
3. **Codrops — _Three.js Instances: Rendering Multiple Objects Simultaneously_, 2025-07-10.** Modern
   reference on draw-call reduction, instancing vs merged geometry vs `BatchedMesh`, per-instance/attribute
   data, and `renderer.info.render.calls` as the metric.
   https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/
4. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_.** "Merge static geometry with
   `BufferGeometryUtils.mergeGeometries()` … turns N draw calls into 1"; merged geometry beats `InstancedMesh`
   for static non-repeating shapes; check `renderer.info.render.calls`; DPR cap on mobile.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
5. **Three.js Roadmap — _Draw Calls: The Silent Killer_, 2025–2026.** When draw calls dominate mobile CPU
   cost and the merge/instance/batch decision tree. https://threejsroadmap.com/blog/draw-calls-the-silent-killer
6. three.js docs — **`BufferGeometryUtils.mergeGeometries`** (consistent-attribute requirement, `useGroups`
   semantics) and **`BatchedMesh`** (r156+, one draw call for different geometries sharing a material),
   current r169/r17x. https://threejs.org/docs/pages/module-BufferGeometryUtils.html ·
   https://threejs.org/docs/pages/BatchedMesh.html
7. **three.js Migration Guide** (r133 entries): `ExtrudeGeometry` default `depth→1`/`bevelThickness→0.2`,
   `TextGeometry` + `FontLoader` moved to `examples/jsm`, `WorldUVGenerator` private (r93) — the version
   caveats that pin our explicit params and imports. Maintained 2025–2026.
   https://github.com/mrdoob/three.js/wiki/Migration-Guide
8. **Maxime Heckel — _Field Guide to TSL and WebGPU_, 2025-10-14.** Attributes-as-nodes, `emissiveNode`
   `Fn()`, WebGPU on iOS/Safari — the portable-authoring path for the eventual TSL port of this material.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
9. **CodePen — novogrammer, _Shape Based UVGenerator for ExtrudeGeometry_** (box-projection factory template;
   referenced in the 2025 #31312 thread and forum). The per-shape box-projection math we re-base globally.
   https://codepen.io/novogrammer/pen/mOrBLe
10. three.js forum — **_How to fix UV problem on ExtrudeGeometry_** and **_UV for Extrude Geometry_**
    (#44253), 2025-active threads confirming the broken side-wall UVs and the shader-side normalization fix.
    https://discourse.threejs.org/t/uv-for-extrude-geometry/44253

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Contour-arclength side-wall UVs for true "metal climbing the inner edge."** The raw-XY bypass (§4.3) is
   correct for the global pour axis but flattens the *inner* contour (counters of `G/O/R/A`). A deeper
   generator that emits real per-contour arclength in a second uv channel (`uv2`) would let the molten lip
   wrap *around* the inside of the bowl as it fills — a richer "vessel filling" read. Cost: a second attribute
   + arclength precompute per contour ring.
2. **Per-letter data texture vs uniform array vs attribute-only.** At 7 glyphs, attributes + a `uLetterX0[7]`
   uniform array are plenty; if the wordmark ever animates per-glyph properties (stagger, individual strike),
   benchmark a small `DataTexture` indexed by `aLetterIndex` against the uniform array for the cleanest single
   update path.
3. **TSL/WebGPU port of the merged wordmark material.** With WebGPU on iOS (Heckel, Oct 2025) and TSL
   first-class (r184–r185, 2026), re-express the fill/cool/divine-fire as `attribute()` + `emissiveNode`
   `Fn()` nodes compiling to WGSL+GLSL — authored portable now (§2A.5), shipped GLSL on r169 today.
4. **`BatchedMesh` dynamic-type system for the per-route headings.** The hero wordmark doesn't need it, but
   the eight chambers' Bricolage/Cinzel headings could share one `BatchedMesh` (add/remove per route, one
   draw call, per-instance frustum cull) — a single-draw-call type system beyond the hero.
