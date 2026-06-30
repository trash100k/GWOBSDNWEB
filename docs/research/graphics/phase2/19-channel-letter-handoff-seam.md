# 19 — Channel→Letter Continuity & the smin-Bridged Pour Front

_Phase 2 deep-dive · cluster **D-type-knot-reveal** · GAELWORX forge world · target: iPhone 15 OLED, one
WebGL renderer (r3f 8 + three r169), warm-forge palette._

> **Owns the single most fragile seam in the build: the place where the molten stream leaves a carved
> basalt channel and enters a Cinzel glyph.** Phase-1 doc 09 (§9 candidate 3) and doc 24 (§9 candidate 2)
> both named this exact handoff as the work that decides whether the world reads as _one continuous body of
> metal_ or as _two shaders kissing_. This doc resolves it on three fronts: (1) the **shared arc-length
> clock** that a channel segment and a glyph's fill axis both read so the front never lurches at the
> boundary; (2) the **per-letter `aGlyphIndex` offset** and the rule by which the front _splits_ — part
> continues down-channel, part climbs into the letter mouth; (3) the **1–3 low-res `MarchingCubes`
> droplets** that `smin`-merge the stream into the letter's mouth so the junction is a single molten
> surface, not a butt-join of the channel material (doc 24) against the wordmark material (doc 17). It does
> **not** re-derive the temperature ramp (cohesion §1 / doc 01), the cooling curve (doc 02), the channel
> geometry (doc 24), the pour advection (doc 09), or the wordmark merge (doc 17) — it is the _connective
> tissue_ between them, built on the systems they already own.

---

## 1. SCOPE — this element in the GAELWORX world

The forge sequence is a single river of metal: it pours from the altar, runs the Celtic-interlace channels
(doc 24), branches and rejoins, then **arrives at the `GAELWORX` letterforms and fills them left-to-right**
(docs 13/17), each glyph cooling on its own timeline except the eternal `A`/`E`. The illusion holds only if
the metal reads as **one substance crossing one boundary**. There are two distinct boundaries this doc owns:

1. **The fork split (channel → channel + channel).** Inside the knot, one molten body parts into four
   strands and rejoins (doc 24 §4). The front that advances along arc-length must _divide_ at a degree-4
   junction so that all four children begin advancing the instant the parent front reaches the node — and
   recombine into one front at the sink. This is the channel-internal handoff.

2. **The mouth seam (channel → glyph).** The terminal channel run (`KNOT.run` in doc 24, ending at the
   wordmark's left edge) feeds the first glyph's _mouth_ — a designated entry point on the glyph contour.
   The front leaves the channel's arc-length domain and enters the glyph's fill domain (`gx`, the global
   pour axis of doc 17). At precisely that crossover, two _different meshes_ with two _different shaders_
   (the flat basalt slab carving the channel SDF vs. the extruded wordmark `MeshPhysicalMaterial`) meet.
   Without a bridge, the eye sees a hard edge where the channel's groove metal stops and the glyph's filled
   metal starts — "two shaders kissing." The bridge is **a tiny `MarchingCubes` isosurface** of 1–3 balls
   sitting _over_ the seam, sharing the master temperature uniforms, whose `smin`-blended surface fuses the
   channel lip and the glyph mouth into one continuous lobe of liquid that necks down and pours in.

The payoff: as the user scrolls, a white-hot front winds the knot, _arrives_ at the `G`, a molten droplet
swells at the mouth, necks, and the letter fills — and you cannot point to the frame where "channel" became
"letter." That seamlessness is the whole brief of this cluster (D-type-knot-reveal). Get it wrong and the
most cinematic beat in the build reads as a UI transition. Get it right and the metal is _alive and
singular_, exactly the cohesion contract (cohesion §7).

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

The seam decomposes into three sub-problems, each with its own modern toolkit: **(A)** the shared clock
that keeps the front's _position_ continuous across the boundary; **(B)** the split/merge _topology_ of the
front at forks and at the mouth; **(C)** the _surface bridge_ that makes the junction one liquid body. Honest
tradeoffs below.

### 2A. The shared arc-length clock (positional continuity)

**2A.1 — One global `uPourFront ∈ [0,1]` + per-domain remap (recommended).** A single damped scalar (the
journey/scroll progress, already in the `U` pool — cohesion §4.2) is the _master clock_. Each consumer maps
it into its own local domain: a channel segment maps it against its **baked arc-length start/end**; a glyph
maps it against its **`uFillStart`/`uFillStart+uFillDur`** window (doc 13). Because all windows are laid out
on **one continuous arc-length axis measured from the altar**, the front leaves segment N at exactly the arc
value where glyph 0's window begins — no discontinuity. This is the doctrine both doc 09 (§3) and doc 24
(§9.1) flagged as the correctness upgrade over faking it with `uv.x`. **Quality:** seamless. **Perf:** two
`mad` ops per fragment. **Complexity:** the work is _offline_ (bake the cumulative arc-length of the whole
path: altar→channels→each glyph mouth→glyph fill). **Fit: the spine of this doc.**

**2A.2 — `getSpacedPoints` / `arcLengthDivisions` even resampling.** three.js `Curve.getSpacedPoints(n)`
returns arc-length-even samples; raising `arcLengthDivisions` improves the LUT accuracy (the 2025 forum
threads on `getSpacedPoints` accuracy and the `CatmullRomCurve3` uneven-spacing issue #10432 are explicit
that the default LUT can drift on long/curvy paths — _raise the divisions_). We use this at bake to convert
each hand-authored `CatmullRomCurve3` strand into an arc-length table, then concatenate tables into one
cumulative axis. **Quality:** good with enough divisions. **Perf:** build-time only. **Fit: the baking
primitive.**

**2A.3 — Per-pixel arc-length in the shader (reject).** Computing arc-length analytically per fragment
(integrating the curve) is wildly over-budget and unnecessary when the path is fixed and bakeable. **Reject
on mobile.**

### 2B. The front split/merge topology (where the front divides)

**2B.1 — `aGlyphIndex` / `aSegIndex` window scheduling (recommended).** Every fillable thing — each channel
segment, each glyph — carries an index and a `[startArc, endArc]` window on the global axis (doc 17 already
bakes `aLetterIndex` per vertex; this generalizes it). The "split" is **not** a branching data structure at
runtime: it's simply that two windows (the continuing channel run and the entering glyph) **overlap** at the
junction arc value. When `uPourFront` is in the overlap, both advance their local front; the metal visibly
parts. At a fork node, the four children's windows all start at the parent's end arc, so they all light at
once. **Quality:** correct, declarative, zero runtime branching. **Perf:** free. **Fit: the scheduling
model.** Matches the 2025 per-letter-offset-attribute pattern (Codrops _Gommage_, doc 13 §2A) — replace
"dissolve offset" with "fill-window start."

**2B.2 — Flow-field/graph traversal at runtime (reject for the hero).** A real graph walk (front as a token
that splits at degree-≥3 nodes) is the "physically honest" model and what a fluid sim would do, but it's
stateful, order-dependent, and over-engineered for a _fixed, hand-authored_ knot. The window-overlap model
(2B.1) produces the identical visual with no state. Keep graph traversal only as a mental model for
authoring the windows. (Doc 24 §2 L1b reaches the same verdict for the layout.)

**2B.3 — Two fronts, hard-min'd (the naive seam — what we must avoid).** Drive the channel front and the
glyph front from two independent scalars and just draw both. This is _exactly_ the failure: at the boundary
the two fronts are not phase-locked, the channel metal and glyph metal differ in temperature/age by a frame,
and the junction reads as two materials. **This is the anti-pattern the whole doc exists to prevent.**

### 2C. The surface bridge (one liquid body across two meshes)

**2C.1 — Low-res `MarchingCubes` droplets with `smin` field merge (recommended bridge).** three.js ships
`MarchingCubes` (`three/addons/objects/MarchingCubes.js`; drei wraps it as `<MarchingCubes>` +
`<MarchingCube>`). It evaluates a scalar field of summed metaball kernels on a voxel grid and polygonizes the
isosurface — so 2–3 balls placed at _the channel lip_, _the necking droplet_, and _the glyph mouth_ produce
**one continuous skinned surface** that physically bridges the gap. The merge is intrinsic to the field
(summed reciprocal kernels = an implicit smooth union; the drei API exposes `strength` and `subtract` per
ball — the 2025 drei metaball examples use `resolution`, `strength≈0.5`, `subtract≈12`). Because it's a real
mesh, it takes the **same patched material** binding the master `U` pool, so the bridge is the same metal,
same temperature, same bloom contract. **Quality:** seamless, genuinely volumetric, catches light/env.
**Perf:** the one cost center — voxel grid is O(res³); must be kept _tiny_ (res 16–24) and **only mounted at
an active mouth**, not globally. **Mobile:** affordable at low res, gated to `high`/`low`. **Fit: the
recommended seam bridge** — small, local, shares everything.

**2C.2 — Analytic SDF `smin` bridge in the slab fragment shader (recommended fallback / low tier).** Instead
of a marched mesh, extend doc 24's channel SDF: add the glyph-mouth region as another capsule/disc SDF and
`smin`-union it with the terminal channel segment _in the basalt slab's fragment shader_. The IQ polynomial
`smin` (rewritten 2024-2025 with normalization + kernels; the 4rknova Sept-2025 blob raymarch and the
Vinicius-Santos smin writeup both use the same quadratic form) produces a smooth neck in the distance field;
shade its floor with `gw_forge`. This is **2D/flat** (no real droplet bulge) and lives entirely on the
already-present slab — _zero new mesh, zero MarchingCubes cost_. **Quality:** very good for top-down/oblique;
no true 3D meniscus bulge. **Perf:** ~one extra capsule SDF + one `smin` per pixel — negligible. **Fit: the
`low`/`static` bridge, and the everyday bridge for the top-down channel-hall** where the seam is seen flat.

**2C.3 — Raymarched SDF droplet (TSL/WebGPU, future).** Raymarch a handful of `smin`-unioned spheres in a
fragment pass (the 2024→2025 Codrops _Liquid Raymarching_ TSL scene, the June-2025 droplet-metaball GLSL
piece, and the three.js-forum soft-min raymarch showcase all ship this exact `smin(sphere,sphere,k)` loop).
Gorgeous, true 3D, but it's a full raymarch pass — over the iPhone fill-rate budget as a _per-seam_ effect,
and TSL/WebGPU is the gated post-judge path (cohesion §10). **Author the `smin` math portable; ship 2C.1/2C.2
on WebGL now.**

**2C.4 — Texture-space alpha cross-fade (reject).** Just cross-fading the two materials' opacity across the
seam. Cheap, but it's a _dissolve_, not a _merge_ — the metal doesn't bulge, neck, or share a surface
normal; reads decal-y exactly like doc 13's rejected Technique D. **Reject.**

| Bridge | One surface? | True 3D bulge | Mobile cost | Shares `U` | Fit |
|---|---|---|---|---|---|
| **2C.1 low-res MarchingCubes + smin field** | ✅ | ✅ | low @ res≤24, gated | ✅ | **hero bridge (high/low)** |
| **2C.2 analytic smin in slab shader** | ✅ (flat) | ✖ | ~free | ✅ | **fallback + top-down + static** |
| 2C.3 raymarched smin droplet (TSL) | ✅ | ✅ | over budget now | ✅ | future / WebGPU |
| 2C.4 alpha cross-fade | ✖ | ✖ | free | n/a | reject (decal-y) |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**One global arc-length clock (2A.1) feeding window-scheduled fronts (2B.1), bridged at each active mouth by
a 1–3 ball low-res `MarchingCubes` isosurface that `smin`-merges the channel lip into the glyph mouth
(2C.1), with the analytic in-slab `smin` bridge (2C.2) as the `low`/`static`/top-down substitute.**

Concretely, the metal's journey is **one cumulative arc-length axis** baked offline:

```
altar(0.0) ─ channels[seg arc-lengths] ─ fork(windows overlap) ─ sink ─ run ─ mouth_G ─ glyph_G fill … glyph_X fill (1.0)
```

- **Clock:** `uPourFront` (the damped journey scalar, _already in `U`_) is remapped per consumer against its
  baked `[startArc,endArc]`. The channel run's end arc == glyph `G`'s mouth arc == glyph `G`'s
  `uFillStart` — _the same number_, so the front is continuous by construction.
- **Split:** each channel segment and each glyph carries `aSegIndex`/`aGlyphIndex` + its window; forks are
  overlapping windows (4 children share the parent's end arc); the mouth is an overlap of the run's tail and
  the glyph's head.
- **Bridge:** when `uPourFront` is within ±ε of a glyph's mouth arc, a small `<MarchingCubes res={20}>` is
  mounted at that mouth with 2 balls (channel-lip ball + mouth ball) and, at peak neck, a 3rd mid droplet;
  its material is the **same patched `MeshPhysicalMaterial` binding `U`**, so it is the same cooling metal.
  The field's summed kernels _are_ the smooth union; we additionally tune `smin` blend by ball
  `strength`/`subtract`. On `low`/`static`/top-down, skip the mesh and use the analytic slab `smin` bridge
  (2C.2) — visually flat but seamless.

**Why this and not alternatives:** GAELWORX needs a _designed, sacred, branded_ pour on a fixed knot — a sim
(doc 09 A3) or runtime graph walk (2B.2) fights that. The arc-length clock is the literal data encoding of
"how far has the metal travelled," deterministic and tiny. The window model makes the split _declarative
data_, not runtime state. The `MarchingCubes` bridge is the _only_ technique that yields a genuine single
liquid surface across two meshes while still binding the shared `U` pool — and kept at res ≤24, mounted only
at the one active seam, it's inside budget. Everything reuses the codebase's idioms (`onBeforeCompile`,
`gw_*` shared GLSL, `v3(PAL.*)`, dt-damped store uniforms, `dispose()` on unmount) with **one** new
addon import (`MarchingCubes`) gated to high/low.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three@^0.169` (repo pin): `CatmullRomCurve3` (+ `arcLengthDivisions`/`getSpacedPoints`), `Box3`,
  `Float32BufferAttribute`, `MeshPhysicalMaterial` + `onBeforeCompile`, and **`MarchingCubes`** from
  `three/addons/objects/MarchingCubes.js`. (drei wraps it as `<MarchingCubes>`/`<MarchingCube>` if preferred;
  we use the raw addon for tight control of res + material binding.)
- `@react-three/fiber ^8.17`, `@react-three/drei ^9.114` — already present. **One new addon import; no new
  npm dependency.**
- Reuse in-repo: `gw_*` shared GLSL (`shaders.js`: `gw_tempColor`, `gw_tempEmissive`, `gw_forge`,
  `gwCool01`, `gw_divineFire`, `gw_fbm`, `gw_sdSeg`, `gw_smin` — docs 01/02/24), `PAL`/`v3`
  (`palette.js`), the master `U` pool (`forgeUniforms.js`), `forge`/`damp` (`store.js`).

### 4.2 The offline arc-length bake (the shared clock — `src/scene/pourAxis.js`)

Concatenate every curve (channels from doc 24's `KNOT`, then the run, then a synthetic "into-mouth" stub per
glyph) into **one cumulative arc-length axis**, and record each consumer's `[startArc,endArc]` window.

```js
import * as THREE from 'three'

// Build one continuous arc-length axis: altar → ... → each glyph mouth.
// Returns { totalLen, segWindows:{id:[s,e]}, glyphMouthArc:[7], sample(arc)->Vec3 }
export function bakePourAxis(KNOT, glyphMouthsLocal) {
  const order = ['s0', 'b0', 'b1', 'b2', 'b3', 'k0', 'r0']   // authored traversal (forks share arc)
  const tables = {}; let cum = 0; const segWindows = {}
  // 1) arc-length each strand via even resampling (raise divisions for accuracy — issue #10432).
  for (const id of order) {
    const pts = curvePtsFor(KNOT, id)
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    curve.arcLengthDivisions = 400                     // accurate LUT (forum: default drifts)
    const len = curve.getLength()
    const isFork = ['b0', 'b1', 'b2', 'b3'].includes(id)
    const start = isFork ? forkStartArc : cum          // the 4 children SHARE the parent end arc
    segWindows[id] = [start, start + len]
    tables[id] = { curve, start, len }
    if (id === 's0') forkStartArc = cum + len          // fork node arc value
    if (!isFork) cum = start + len                     // non-forks advance the cumulative head
  }
  // 2) append a tiny "into-mouth" arc per glyph so the run END == glyph0 mouth == glyph0 fillStart.
  const runEnd = segWindows['r0'][1]
  const glyphMouthArc = glyphMouthsLocal.map((_, i) => runEnd + i * 1e-4) // mouths chained at the run tail
  const totalLen = cum
  return { totalLen, segWindows, glyphMouthArc,
    sample: (arc) => sampleAlong(tables, order, arc) }  // world pos at a given arc (for ball placement)
}
```

The single load-bearing fact: **the run's `endArc`, glyph `G`'s `mouthArc`, and glyph `G`'s `uFillStart`
are the same value.** That equality _is_ the seam's continuity. Normalize everything by `totalLen` so
`uPourFront ∈ [0,1]` walks the whole journey.

### 4.3 The smin field bridge — `<MouthBridge>` (low-res MarchingCubes, binds `U`)

A tiny isosurface mounted **only at the currently-pouring mouth**. Two balls (channel lip + glyph mouth)
plus a transient mid droplet at peak neck. Its material is the shared forge material so it is the same metal.

```jsx
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'

function MouthBridge({ mouthArc, lipPos, mouthPos, U, quality }) {
  const res = quality === 'high' ? 24 : 16
  const mc = useMemo(() => {
    const m = new MarchingCubes(res, makeForgeBridgeMaterial(U), true, false, 20000) // enableUvs=false
    m.isolation = 80                       // iso threshold (drei-style: pairs with strength/subtract)
    m.scale.setScalar(BRIDGE_SCALE)        // local box straddling lip→mouth
    return m
  }, [res])
  useEffect(() => () => { mc.material.dispose() }, [mc])

  useFrame((state, dt) => {
    mc.reset()
    // local 0..1 progress of the front crossing THIS mouth (drives neck/droplet)
    const cross = THREE.MathUtils.clamp((forge.pourFront * U.uTotalLen.value - mouthArc) / NECK_ARC, 0, 1)
    const t = forge.quality === 'static' ? 0.5 : cross
    // ball A: the channel lip (recedes as the letter takes over)
    addBallLocal(mc, lipPos,   0.55, 0.6 * (1.0 - 0.5 * t))
    // ball B: the glyph mouth (swells as the metal pours in)
    addBallLocal(mc, mouthPos, 0.55, 0.45 + 0.45 * t)
    // ball C: a transient mid droplet at peak neck — the 3rd ball that SELLS the merge
    if (t > 0.15 && t < 0.85) {
      const mid = lipPos.clone().lerp(mouthPos, 0.5 + 0.12 * Math.sin(state.clock.elapsedTime * 6.0))
      addBallLocal(mc, mid, 0.40, 0.30 * Math.sin(t * Math.PI))   // fades in/out across the cross
    }
    mc.update()
    // drive the bridge material's heat to the FRONT temperature (hottest, white→white-gold)
    const u = mc.material.userData.shader?.uniforms
    if (u) { u.uTime.value = state.clock.elapsedTime; u.uBridgeTemp.value = 0.96 } // near-white-hot lip
  })
  return <primitive object={mc} position={mouthPos} />
}
// addBallLocal: MarchingCubes wants normalized [0,1] field coords; map world→local box first.
```

`MarchingCubes.addBall(x,y,z, strength, subtract)` sums a reciprocal kernel into the field; the summed field
is an implicit smooth union, so **two overlapping balls automatically neck and merge** — that _is_ the
`smin` at the surface level. `strength`/`subtract` are the blend controls (drei's 2025 metaball examples:
`strength≈0.5`, `subtract≈12`). We animate strengths off `cross` so the lip recedes and the mouth swells as
the front passes — the metal visibly _pours through_ the neck.

### 4.4 The bridge material (same ramp, front-hot, A/E aware)

Same `onBeforeCompile` idiom as the wordmark (doc 17 §4.5), binding the same `U`. The bridge is _always_ at
the hot front, so it leans on `gw_forge` near the top of the ramp; if the mouth belongs to the `A`/`E`, it
clamps to `gw_divineFire`.

```glsl
// FRAGMENT (injected before <tonemapping_fragment> via totalEmissiveRadiance)
uniform float uTime, uBridgeTemp, uIsAEmouth;     // uIsAEmouth: this seam feeds an A or E
float flick = gw_fbm(vWorld.xy * 5.0 + uTime * 0.4) * 0.5 + 0.5;
float temp  = uBridgeTemp + 0.04 * sin(uTime * 3.0 + flick); // churning white-hot lip
vec3 molten = gw_forge(temp);                     // shared ramp, top band (blooms)
vec3 divine = gw_divineFire(flick);               // white-gold, if this mouth is an A/E
vec3 metal  = mix(molten, divine, uIsAEmouth);
totalEmissiveRadiance += metal;                   // HDR > 1 → the seam blooms exactly like the front
```

### 4.5 The analytic slab `smin` bridge (2C.2 — low/static/top-down)

When the bridge mesh is skipped, extend doc 24's `gwChannel()` so the terminal segment `smin`-unions a
**mouth disc SDF** placed at the glyph mouth — the groove necks smoothly into the letter with no mesh:

```glsl
// inside the basalt slab COLOR block, after gwChannel(vUv):
float dMouth = length(vUv - uMouthUV) - uMouthR;          // the glyph-mouth disc
float dJoin  = gw_smin(ch.x, dMouth, 0.018);              // IQ polynomial smin (k = neck width)
float floorM = smoothstep(0.0, -0.004, dJoin - uChanW);   // 1 inside the joined channel+mouth floor
float arc    = mix(segArc(vUv), uMouthArc, smoothstep(0.0, 1.0, mouthBlend)); // arc continuous across join
float filled = step(arc, forgePourFront);                 // shared front
vec3  metal  = gw_forge(filled * (0.96 + 0.04 * gw_fbm(vUv*6.0 + uTime*0.1)));
gl_FragColor.rgb = mix(gl_FragColor.rgb, metal, floorM * filled);
```

`gw_smin(a,b,k)` is the shared IQ polynomial (`gw_smin` in `shaders.js`, doc 24 §4.3); `k=0.018` sets the
neck width. This is the everyday bridge for the **top-down channel-hall**, where the seam is seen flat and a
marched 3D bulge would be invisible anyway.

### 4.6 Key uniforms & parameters

| Uniform | Drives | Source |
|---|---|---|
| `uPourFront` (0..1) | the master arc-length clock for the WHOLE journey | `forge.scrollDamped` (in `U`), dt-damped |
| `uTotalLen` | total baked arc-length (denormalizes `uPourFront` → arc) | `bakePourAxis` (in `U`) |
| `aSegIndex` / `aGlyphIndex` | which segment/glyph a fragment belongs to | baked per-vertex (doc 17 pattern) |
| seg/glyph `[startArc,endArc]` | window scheduling (the split via overlap) | `bakePourAxis.segWindows` / `glyphMouthArc` |
| `uMouthUV` / `uMouthR` / `uMouthArc` | analytic slab bridge: mouth disc + its arc value | per-glyph, baked |
| `strength` / `subtract` per ball | MarchingCubes smin blend (neck softness) | `~0.5` / `~12`, leva-tunable |
| `uBridgeTemp` / `uIsAEmouth` | bridge metal temp (front-hot) + A/E exception | front clock + brand data |
| `NECK_ARC` / `BRIDGE_SCALE` | arc span of the neck / bridge box size | constants, leva-tunable |

### 4.7 How it hooks the shared master temperature system

The bridge **never invents heat**: it calls `gw_forge`/`gw_divineFire` from `shaders.js` (cohesion §1), so
the necking droplet is the same metal as the channel floor and the glyph fill. The clock `uPourFront` is the
**same `U` reference** the slab veins, channel pour, and wordmark fill bind — so a strike (`forge.strikeAt`)
that surges `uHeat` flares the channel, the bridge, and the letter **in the same frame** (cohesion §7 rule
6). The arc-length axis is the **single source of truth** doc 09's pour, doc 24's channel front, and doc
17's wordmark fill all consume — one knot, one clock, three consumers (cohesion §7 rule 8). Nothing here has
its own orange, its own noise, or its own clock — the definition of "not bolted-on."

---

## 5. COHESION — shared palette / lighting / uniforms

- **One temperature authority.** The bridge, the channel floor, and the glyph fill all color via
  `gw_forge(temp)` (= `gw_tempColor × gw_tempEmissive`) and clamp the A/E to `gw_divineFire` (cohesion §1.4).
  Because the seam is _always at the hottest front_, the bridge sits in the top ramp band — it _should_ be
  the brightest white-hot in frame, which is correct (the leading lip is the hottest sample, doc 09 §D).
- **One uniform pool.** `MouthBridge` and the slab bridge bind the **same `U` references** (cohesion §4.2) —
  `uTime`, `uHeat`, `uPourFront`, `uTotalLen`. Mutating `U.uHeat.value` in `<ForgeDriver/>` flares the seam
  in lockstep with everything else; the synchrony _is_ the cohesion proof (cohesion §7 rule 6).
- **One noise basis.** The bridge's churn/flicker uses shared `gw_fbm` at the shared `GW_FBM_OCTAVES` — the
  droplet's surface life is the same grain as the channel metal's flow (cohesion §2, §7 rule 2).
- **One palette, HDR convention intact.** Only the bridge's white-hot front and the A/E exceed 1.0, so the
  existing `mipmapBlur` bloom (`luminanceThreshold ≈ 0.55`) catches the necking droplet exactly as it
  catches the channel front and the fresh fill — the palette _is_ the bloom selector (cohesion §3.1, §5.1).
  Cooled iron behind the front and the basalt walls stay ≤1 and true-black on OLED.
- **The keystone, expressed identically.** If a mouth feeds the first `A` or first `E`, `uIsAEmouth=1` routes
  the bridge to `gw_divineFire` — the same first-A/first-E rule as the DOM `.forge-letter` ignite, the 3D
  wordmark `aIsAE`, the basalt reveal, and the Ogham legibility (cohesion §1.4, §7 rule 5). The white-gold
  droplet pouring into the `A`/`E` is _the same divine fire_, established at the seam.
- **Lit only by the metal.** The bridge mesh is `MeshPhysicalMaterial` catching the same procedural PMREM env
  (cohesion §5.3, no EXR); its emissive >1 contributes to the shared `uAEFire` signal the basalt/Ogham read
  when the mouth is an A/E — the seam becomes a light source for the reveal (cohesion §5.2).
- **One clock, dt-damped.** Every value animates via `THREE.MathUtils.damp(cur,tgt,λ,dt)` from `forge` —
  never `lerp`, never a second rAF (cohesion §7 rule 6). The front advance is **Forge Reveal / Drift**:
  constant-velocity, no bounce; scroll _flares_ it via `uHeat`, never springs it.
- **Shared curve data, three ways.** The arc-length axis baked here is the same data doc 09's advection and
  the spark-orbit path (doc 09/15) consume — the contract that keeps fill, weave, and depth from drifting
  (cohesion §7 rule 8).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The seam must be **nearly free except for the one active bridge mesh**, and that mesh must be _small and
local_.

- **The clock + window scheduling cost nothing.** `uPourFront` is one damped scalar already in `U`; the
  per-fragment remap is two `mad` ops; `aSegIndex`/`aGlyphIndex` are 1 float/vertex (kilobytes). No render
  targets, no extra passes. This is all positional-continuity for free.
- **MarchingCubes is the _only_ cost center — bound it hard.** Voxel polygonization is O(res³) on the CPU
  (three's `MarchingCubes.update()` rebuilds the buffer each frame). At **res 24 (high) / 16 (low)** with
  **2–3 balls**, that's a tiny grid (24³ = ~13.8k cells, but only the active iso band meshes) rebuilt once
  per frame — sub-millisecond. The non-negotiable rules: **(a) mount exactly one bridge, at the currently
  pouring mouth only** (gate on `uPourFront` proximity ±ε); unmount it the instant the front clears the mouth
  (`useEffect` cleanup → `material.dispose()`, geometry is owned by MarchingCubes). **(b) never run a global
  metaball field for all 7 glyphs** — that's res³ × always-on = death. **(c) `maxPolyCount` capped** (~20k)
  so a pathological iso can't explode the buffer.
- **`renderer.info` discipline.** `render.calls` rises by exactly **+1** while a bridge is mounted (and
  returns to baseline when it unmounts); `memory.geometries`/`textures` stay **flat** across the journey
  (the MarchingCubes buffer is reused, the material disposes). If memory climbs per glyph, a bridge isn't
  disposing.
- **Quality tiers (`high|low|static`):**
  - **high:** `MouthBridge` res 24, up to 3 balls (lip + mouth + transient droplet), full `gw_fbm` flicker,
    A/E feeds `uAEFire`. The cinematic neck.
  - **low:** **skip the MarchingCubes mesh entirely** — use the **analytic slab `smin` bridge** (2C.2),
    which is ~free (one capsule + one `smin` per pixel on the slab that already runs). Flat but seamless.
    Drop `GW_FBM_OCTAVES` one (thins detail uniformly — cohesion §7 rule 9).
  - **static** (reduced-motion / weak GPU): no mesh; freeze the analytic slab bridge at a **mid-pour neck
    pose** (`uPourFront` fixed so one mouth shows a frozen droplet bridging into a half-filled `G`), `uTime`
    frozen to `2`, `frameloop='demand'`. A dignified frozen "mid-pour" still — the DOM Cinzel + `.forge-letter`
    wordmark remains the no-JS/AEO truth.
- **Top-down channel-hall always uses the analytic bridge**, not the mesh — a 3D droplet bulge is invisible
  flat, so the mesh would be pure cost. The mesh bridge is for the **oblique/close chambers** (altar
  approach, casting room, contact arch) where the neck reads in 3D.
- **INP/compile insurance.** `renderer.compileAsync` the bridge material at boot (or first mount) so the
  voxel mesh's first appearance doesn't stall the scroll (cohesion §10). Alloc-free `useFrame`: pre-allocate
  the ball-position vectors, mutate in place (`mc.reset()` then `addBall`), never `new Vector3()` per frame.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls (each specific to this seam):**

1. **The seam value must be ONE number.** The run's `endArc`, the glyph mouth arc, and the glyph
   `uFillStart` must be _literally equal_ (§4.2). If they're computed independently, the front will jump or
   stall at the boundary by a sub-pixel that reads as a flicker. Bake them from one axis.
2. **Two fronts kill it (2B.3).** Never drive the channel and the glyph from independent scalars. One
   `uPourFront`, remapped per domain. If you find yourself writing `channelFront` and `letterFront`
   separately, stop — that's the anti-pattern this doc exists to prevent.
3. **`getSpacedPoints`/arc-length LUT drift.** `CatmullRomCurve3` arc-length defaults can be uneven on long,
   curvy strands (issue #10432; forum 2025). Set `arcLengthDivisions` high (≥400) before `getLength()`/bake,
   or the front advances at uneven speed around the knot and the seam timing skews.
4. **MarchingCubes uses normalized [0,1] field coords, not world.** `addBall(x,y,z,...)` expects field-box
   coordinates; map the world lip/mouth positions into the bridge's local box first, or the balls land
   off-grid and nothing meshes. Verify by rendering the raw iso before shading.
5. **Global metaball field = mobile death.** Do **not** make one big MarchingCubes for the whole wordmark.
   Mount **one tiny bridge at the active mouth only**, dispose on clear. O(res³) is unforgiving — keep res
   ≤24 and the count of mounted bridges ≤1.
6. **`smin` k too large smears; too small re-seams.** The neck width (`k≈0.018` analytic; ball
   strength/subtract for the mesh) must be tuned: too soft and the metal blobs into a ball that doesn't read
   as a channel-into-letter pour; too hard and the seam reappears. Tune on device via leva — the right `k`
   makes a _neck_, a waist that necks down then pours in.
7. **Forgetting to dispose the bridge.** The mesh mounts/unmounts as the front sweeps glyph to glyph;
   `useEffect` cleanup must `material.dispose()` and the `<primitive>` unmount frees the MarchingCubes
   buffer. Watch `renderer.info.memory` stay flat across the full pour (cohesion §4.3).
8. **The bridge must be HOT, and only the bridge.** The seam is the leading front = hottest sample. Keep its
   `uBridgeTemp` near the top of the ramp so it blooms, but keep the cooled metal behind it ≤1 — don't let
   the whole channel glow (post-fx rule; doc 09 pitfall 4).
9. **A/E mouth = divine fire, the same first-A/first-E rule.** If the seam feeds the first `A`/`E`, the
   droplet is white-gold (`uIsAEmouth=1` → `gw_divineFire`), never the cooling ramp — stamped from baked
   data, never string-matched in-shader (cohesion §1.4, §7 rule 5).
10. **Top-down doesn't need the mesh.** Don't pay for a 3D droplet the camera can't see. Gate the mesh bridge
    to oblique/close chambers; analytic slab bridge everywhere flat.

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**

1. **Bake the arc-length axis** (`bakePourAxis`) and prove continuity: log the run `endArc`, glyph-`G`
   mouth arc, glyph-`G` `uFillStart` — assert all three are equal. The seam can't be seamless until they are.
2. **Wire `uPourFront` to drive both** the channel front (doc 24) and the glyph fill (doc 17) from the one
   remapped clock. Scroll and confirm the front leaves the channel and enters the `G` _without a jump_,
   even with no bridge yet (the analytic continuity must hold first).
3. **Add the analytic slab `smin` bridge** (2C.2). Confirm the groove necks smoothly into the letter mouth
   on a flat top-down view — seamless in 2D before any mesh.
4. **Add `<MouthBridge>` with 2 balls** (lip + mouth), res 24, binding `U`. Confirm the iso meshes and reads
   as one liquid lobe across the gap (render raw iso first, then shade).
5. **Add the transient 3rd droplet** at peak neck and animate ball strengths off `cross` — confirm the metal
   visibly _pours through_ the neck as the front passes.
6. **Stamp the A/E mouth flag**; verify the droplet into the first `A`/`E` is white-gold and eternal while
   the front continues cooling elsewhere.
7. **Gate tiers:** mesh on high/oblique; analytic on low/static/top-down; freeze the static mid-pour neck.
   Confirm one bridge mounts/disposes cleanly (`renderer.info` flat; `calls` +1 only while active).
8. **Strike test:** fire `forge.strikeAt`; confirm the seam, channel, and letter flare in the **same frame**
   (cohesion proof).
9. **Device read on the iPhone 15 OLED** — the neck bulge, the white-hot bloom on the droplet, the white-gold
   A/E pour, and the true-black void do **not** simulate headless.

---

## 8. SOURCES (2025–2026)

- **Codrops — _How to Create Interactive, Droplet-like Metaballs with Three.js and GLSL_, 2025-06-09.**
  The modern reference for `smin`-blended droplet merging — applying smooth-min to fuse spheres into a single
  seamless metaball that necks and responds to motion; the exact "stream merges into a body, no hard seam"
  read this doc's bridge needs.
  https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/
- **Inigo Quilez — _smooth minimum_ (full rewrite: Normalization, Kernels, circular smin, blend-function
  analysis)**, announced 2024-03 and refreshed through **2025** (via @iquilezles). The canonical `gw_smin`
  used at the fork/rejoin and the mouth neck; the kernel analysis that tells us how `k` shapes the neck.
  https://iquilezles.org/articles/smin/ · https://x.com/iquilezles/status/1765935148091261277
- **Nikos Papadopoulos (4rknova) — _Ray marching a blob_, 2025-09-21.** A 2025 walk-through of `smin`
  smooth-union of spheres into one continuous blob surface with the quadratic polynomial `smin` and normal
  estimation — the surface-level proof that summed/min'd fields read as one liquid body (the principle behind
  2C.1 and the future 2C.3 path). https://www.4rknova.com/blog/2025/09/21/blob-3d
- **Vinicius Santos — _Smooth Minimum_ (smin explainer: polynomial vs exponential, the `k` parameter, why it
  produces a continuous merge), 2025.** Reinforces the `smin` kernel choice and `k`-tuning for the neck.
  https://vgracianos.github.io/blog/smin/
- **Xor (@XorDev) — _Signed Distance Fields_, GM Shaders (mini.gmshaders.com), 2025-02 (tweet
  2025-02-19).** Line-segment/capsule SDFs, smooth unions, and "outlines/glow/grooves for next to no cost
  from the distance value" — the toolkit for the analytic slab `smin` bridge (2C.2) and the channel SDF it
  extends. https://mini.gmshaders.com/p/sdf · https://x.com/XorDev/status/1892057309070659914
- **Codrops — _How to Create a Liquid Raymarching Scene Using Three.js Shading Language (TSL)_** (2024-07-15,
  re-surfaced/maintained through 2025 via the Shadercraft and three.js-forum 2025 write-ups). Ships the TSL
  `smin = Fn(([a,b,k]) => …)` quadratic and the `sdSphere` union loop — the WebGPU/TSL port path (2C.3),
  authored portable now. https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/
- **three.js forum — _Raymarching SDF Shapes — Soft-Min Color Blends_ (showcase), 2025.** A 2025 production
  showcase of `smin`-unioned SDF shapes with soft-min color blending — current evidence the soft-union droplet
  technique is shipping in three.js today. https://discourse.threejs.org/t/raymarching-sdf-shapes-soft-min-color-blends/89570
- **drei docs — _MarchingCubes / MarchingCube_** (`<MarchingCubes resolution maxPolyCount enableUvs>`,
  `<MarchingCube strength subtract>`), maintained 2025; pairs with the three.js `MarchingCubes` addon
  (`addBall(x,y,z,strength,subtract)`, reciprocal kernel, isolation threshold). The implicit smooth-union the
  bridge relies on, with the `strength≈0.5`/`subtract≈12` defaults the 2025 metaball examples use.
  http://drei.docs.pmnd.rs/abstractions/marching-cubes · https://threejs.org/docs/pages/MarchingCubes.html
- **three.js forum — _Accuracy of getSpacedPoints_ (2025-active) & issue #10432 _CatmullRomCurve3
  getSpacedPoints uneven spacing_.** The arc-length LUT drift and the `arcLengthDivisions` fix — why the
  shared clock must bake high-division arc-length so the front advances at constant metal speed.
  https://discourse.threejs.org/t/accuracy-of-getspacedpoints/47626 · https://github.com/mrdoob/three.js/issues/10432
- **Reinder Nijhoff — _WebGPU SDF Editor: Real-Time Signed Distance Field Modeling_, 2026-01.** A 2026
  WebGPU SDF tool confirming `smin` smooth-union as the live modeling primitive for fused implicit surfaces —
  the forward-looking validation of the 2C.3 raymarched-bridge path on the now-shipping iOS WebGPU.
  https://reindernijhoff.net/2026/01/webgpu-sdf-editor-real-time-signed-distance-field-modeling/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The four-fork front split as overlapping arc-windows.** Formalize the degree-4 junction: the exact
   `[startArc,endArc]` overlap encoding by which one parent front lights four children simultaneously and
   they recombine at the sink, with the `smin` field strengths tuned so the metal _parts_ and _rejoins_ as
   one body across the weave's over/under (ties doc 24 §9.2). The data-only model that replaces a runtime
   graph walk.
2. **MarchingCubes vs. analytic-slab `smin` bridge — device A/B + a single-mesh pooled bridge.** Quantify the
   real iPhone-15 cost of res-24 MarchingCubes per mouth vs. the free analytic bridge, and design a **single
   reused, repositioned bridge mesh** that travels glyph-to-glyph (mount once, move it) to keep
   `render.calls` and allocation perfectly flat across the whole pour.
3. **TSL/WebGPU raymarched droplet bridge (2C.3).** Port the `smin`-unioned sphere neck to a TSL `Fn()`
   raymarch (per the 2024→2025 Liquid Raymarching scene + the Jan-2026 WebGPU SDF editor) on iOS WebGPU;
   quantify the quality gain (true volumetric meniscus + refraction) against the WebGL fallback story.
4. **The meniscus/wet-front shaping at the mouth (shared with doc 13 candidate 1).** The close-up hero: how
   the necking droplet bulges, surface-tension-skins, and sheds tiny sparks into the shared ember system
   (doc 15) as it pours through the mouth — front normal perturbation, the bright meniscus rim, and the
   spark hand-off at the exact seam.
