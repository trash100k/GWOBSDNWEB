# 21 — The Four-Branch Fork-and-Rejoin as a Graph Node

_Phase 2 deep-dive · cluster **D-type-knot-reveal** · GAELWORX forge world · target: iPhone 15 OLED, one
WebGL renderer (r3f 8 + three r169), warm-forge palette._

> **Owns the single most authentic Celtic move in the build: the place where one molten body parts into
> four strands, weaves over-and-under, and rejoins into one.** Phase-1 doc 24 (§4, §9.2) and Phase-2 doc 19
> (§2B, §9.1) both named this exact degree-4 junction as the work that decides whether the knot reads as
> _one continuous body of metal threading a sacred plait_ or as _four pipes butted together at a tee_. This
> doc resolves it on three fronts: (1) the **junction geometry** — how the source curve, four child curves,
> and sink curve are laid out and sampled into capsule segments so the SDF field is _continuous through the
> split_; (2) the **`smin` blend discipline** — the load-bearing fact that chained `smin` is non-associative
> and over-merges where many branches overlap, so the smooth-union must be applied **near the junction only,
> with overlap correction**, never globally; (3) the **front split/recombine** — how the one arc-length pour
> clock lights four children the instant the parent front arrives and fuses them back at the sink, as
> declarative window data, not a runtime graph walk. It does **not** re-derive the temperature ramp (cohesion
> §1 / doc 01), the channel SDF carve (doc 24), the arc-length axis (doc 19), or the over/under layer system
> (doc 24 §4.4) — it is the **node** where those systems meet, built on what they already own.

---

## 1. SCOPE — this element in the GAELWORX world

The forge's vascular system pours from the altar, runs the Celtic-interlace channels (doc 24), **branches
and rejoins**, then arrives at the `GAELWORX` letterforms (docs 13/17). The branch-and-rejoin is not
decoration — it is the **signature plaitwork gesture**, the move a viewer who has seen real Celtic knotwork
will judge first. The brief is precise: one molten body *parts into four strands*, those four strands *weave
with correct strict over/under* (every strand that crosses over at one crossing goes under at the next), and
they *rejoin into one*. The whole thing must read as **a single continuous substance flowing through a
divided channel**, not four independent pipes meeting at a hub.

This element is the dominant read of the **`channel-hall` chamber (Automations)**, shown **top-down** so the
weave is fully legible (doc 24 §1), and it is the structural heart of the knot that threads every other
chamber. There are two distinct geometric events the node owns:

1. **The fork (degree-4 split).** One source channel `s0` parts into four children `b0..b3`. The SDF field
   must neck smoothly from one groove into four, with **no bulge** at the crotch where the four diverge — the
   classic failure of naive smooth-union. The pour front, arriving along the source's arc-length, must
   *split* so all four children begin filling the instant it reaches the node.

2. **The rejoin (degree-4 merge).** The four children converge into one sink channel `k0`. The four grooves
   must `smin`-fuse into one — again with no over-rounded blob at the convergence — and the four sub-fronts
   must *recombine* into one continuous front that exits down the run toward the letters.

Get it wrong and the most authentic beat in the world reads as plumbing: four tubes meeting at a swollen
lump, the metal visibly discontinuous across the split, the weave's over/under flattened by the blend. Get
it right — the metal *necks* apart and *necks* back, the four strands genuinely weave, and you cannot point
to where "one body" became "four" — and the channel-hall reads as a sacred forged artefact alive with one
molten substance. That singularity is the entire cohesion contract (cohesion §7) expressed at a single node.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

The node decomposes into three sub-problems, each with a distinct modern toolkit: **(A)** the junction
geometry (how the curves are laid out and sampled so the field is continuous through the split); **(B)** the
`smin` blend that fuses the grooves without bulging at a multi-way junction; **(C)** the front split/recombine
topology. Honest tradeoffs below.

### 2A. Junction geometry — how one channel becomes four and back

**2A.1 — Shared-endpoint Catmull-Rom strands with parallel-transport framing (recommended).** The source,
each child, and the sink are `CatmullRomCurve3` strands whose endpoints are **literally shared**: every child
`b0..b3` starts at the *exact* world point where `s0` ends (`forkNode`), and ends at the *exact* point where
`k0` begins (`sinkNode`). Curves are `'centripetal'` (cusp-free on tight knot turns, doc 24 §7 pitfall 3) and
oriented with **parallel-transport frames** — the twist-free framing the Feb-2026 Codrops procedural-snake
article ships (Frenet/`TubeGeometry` framing flips at inflection points and twists the channel; PTF
propagates the normal forward by the minimal rotation aligning successive tangents, "a stable frame with
minimal twist"). Because the endpoints coincide, the capsule SDFs of the source and each child already
*touch* at the node — the field is C0-continuous before any blend, and `smin` only has to round the C1
corner. **Quality:** authentic, smooth at any zoom. **Perf:** build-time curve work, runtime is a bounded
capsule loop. **Fit: the spine of this doc.**

**2A.2 — Tube/Extrude mesh tee with a modeled crotch (reject for the hero).** Actually model the branching
as `TubeGeometry`/`ExtrudeGeometry` and let the meshes interpenetrate at the node, hiding the seam with the
metal fill. Honest 3D depth, but the interpenetration reads as exactly what it is (two tubes clipping), the
crotch normals are wrong, and you pay tessellation for geometry the SDF carve renders for free. Doc 24 §2
already reached this verdict (`ExtrudeGeometry` U-channel only for close cameras, never the knot topology).
**Reject for the junction; the carve is SDF.**

**2A.3 — Planar-graph / medial-axis junction solver (mental model only).** Treat the fork as a degree-4 node
in a planar graph and derive the strands from the graph's medial construction (doc 24 §2 L1b). This is the
"physically honest" topology and is how a general knot generator would place the crossings, but it is
over-engineered for a *fixed, hand-authored, branded* knot. **Use the graph as the authoring mental model —
the node has in-degree 1 / out-degree 4 at the fork, in-degree 4 / out-degree 1 at the sink — but ship the
hand-baked curves, not a runtime solver.** (Doc 19 §2B.2 reaches the same verdict for the front.)

### 2B. The `smin` blend — fusing four grooves without a bulge

This is the technical crux, and where the 2025-2026 SDF literature is most pointed.

**2B.1 — IQ polynomial `smin` applied near the junction only (recommended base).** The quadratic polynomial
`smin` (Inigo Quilez, full rewrite introducing Normalization, Kernels, and a circular smooth-min, refreshed
through 2025) is the cheap, stable smooth-union: `h = clamp(0.5 + 0.5*(b-a)/k, 0, 1); return mix(b,a,h) -
k*h*(1-h);`. The `k` parameter is the neck width. Doc 24's `gw_smin` is exactly this. The non-negotiable
discipline — flagged in doc 24 §7 pitfall 6 — is **`smin` at the junction only**: a small `k` (~0.012) and a
**junction-proximity falloff** so crossings *away* from the fork/sink behave like a plain `min` (strict
over/under, sharp grooves) and only the fork/sink crotch rounds. Blending globally fattens every crossing
into mush and destroys the weave. **Fit: the base merge, gated by proximity.**

**2B.2 — Chained `smin` is non-associative and over-merges — the four-way bulge problem (the trap to
avoid).** This is the load-bearing 2025 insight (smish.dev, *smin_overlap_correction*; reinforced by the IQ
article's blend analysis). **`smin(a, smin(b, c)) ≠ smin(smin(a, b), c)`** — the CD/DD family is *not
associative*. When you fold four overlapping child capsules together with a naive chained `smin`, the
overlapping regions are **counted multiple times**, and the field *bulges outward at the crotch* — the metal
swells into a blob exactly where it should neck. The published fix is **overlap correction**: subtract
spherical (negative-weight) SDF contributions at the overlapping endpoints to restore correct multiplicity,
i.e. *un-count* the double/triple-counted overlaps. For GAELWORX the practical form of this is simpler than
the general algorithm because the topology is *fixed and known*: at the fork, the four children share **one**
endpoint, so we (a) blend each child against the **source only** (a sequence of independent 1-vs-1 `smin`s,
not children-against-each-other), and (b) place a single small **negative corrective ball** at the node to
cancel the residual bulge. **Fit: the correctness layer — without it the fork is a lump.**

**2B.3 — Chamfer / "tight" blend modes as an alternative crotch profile (2026 corroboration).** The 2026 SDF
modeling tools (SDF.R for Blender — Round/Sharp/Soft/Tight/Chamfer blend profiles; ConjureSDF — None/Smooth/
Chamfered/Inverted-Round, alpha through end-2025; reindernijhoff.net WebGPU SDF editor — per-node blend
operation + blend radius) all expose blend *profiles* beyond the round `smin`. A **chamfer** blend
(`min(a, b, (a+b-k)*0.707)`) gives a *beveled* crotch instead of a rounded one — which reads as more *carved*
(stone-cut) and less *liquid* (blobby). For the **groove walls** (the carved basalt) a chamfer/tight profile
is more on-brand (Neo-Gaelic Brutalist, sharp); for the **metal floor** the round `smin` is correct (molten,
liquid). **Fit: chamfer the carved wall, round the molten floor — two profiles, one node.** This is a
GAELWORX-specific synthesis the generic tools don't prescribe.

**2B.4 — Per-pixel exponential `smin` (reject on mobile).** The exponential family (`-log(exp(-k*a) +
exp(-k*b))/k`) blends *all* nearby fields smoothly and is naturally N-ary (no chaining order), which is
tempting for a four-way junction. But it is associative-but-expensive (an `exp` per branch per pixel) and
*still* over-merges without correction. The polynomial `smin` with proximity gating (2B.1) + the fixed-
topology correction (2B.2) is cheaper and gives more control. **Reject the per-pixel exp form on iPhone.**

### 2C. The front split / recombine topology

**2C.1 — Overlapping arc-windows on one clock (recommended).** Doc 19 §2B.1 already established the model:
every fillable thing carries `[startArc, endArc]` on the **one cumulative arc-length axis** measured from the
altar, and `uPourFront ∈ [0,1]` (the damped journey scalar in the `U` pool) walks it. The split is **not a
runtime branching data structure** — it is simply that the four children's windows **all start at the
parent's end arc** (`forkStartArc`), so the instant `uPourFront` crosses that value, all four light *at
once*. The recombine is the mirror: the sink's window starts at the children's shared end arc, so the four
sub-fronts converge into the sink's single front by construction. **Quality:** correct, declarative, zero
runtime state or branching. **Perf:** free (two `mad` ops per fragment). **Fit: the front model.**

**2C.2 — Runtime graph-token traversal (reject for the hero).** A real graph walk — a front token that
*splits* into four tokens at the degree-4 node and *merges* at the sink — is what a fluid sim would do and is
stateful, order-dependent, and frame-coupled. The window-overlap model produces the identical visual with no
state. **Keep graph traversal as the authoring mental model only** (doc 19 §2B.2, doc 24 §2 L1b agree).

**2C.3 — Conservation-of-flux speed split (the quality upgrade).** A subtle realism beat: when one body
splits into four, each child should carry ~¼ the *visual flux*, so the four sub-fronts advance at the parent
speed (the metal doesn't speed up or stall at the split) but each child's **brightness/volume** is modestly
reduced, recombining to full at the sink. This is a per-child `uFluxScale ≈ 0.25..1.0` on the emissive, not a
speed change (speed stays arc-length-locked so timing never skews). **Fit: an optional `high`-tier polish on
2C.1** — cheap, and it sells "one body divided" over "four equal copies."

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Shared-endpoint centripetal Catmull-Rom strands (2A.1), carved by a capsule-SDF field whose `smin` is
applied *near the fork/sink node only* with a single corrective ball to kill the four-way bulge (2B.1 +
2B.2), chamfered on the carved wall and rounded on the molten floor (2B.3), fed by one arc-length clock whose
overlapping windows split the front into four and recombine it at the sink (2C.1), with optional flux-scaling
(2C.3) on `high`.**

Concretely, the node is **one source curve → four child curves → one sink curve**, all sharing the two node
points, baked offline to capsule segments + per-segment layer (over/under) IDs + per-segment arc windows. At
runtime the basalt slab's fragment shader evaluates the channel field exactly as doc 24's `gwChannel()` —
**plain `min` everywhere, `smin` only inside a small radius of `forkNode`/`sinkNode`** — and the front is the
one `uPourFront` remapped per segment window.

**Why this and not alternatives.** GAELWORX needs a *specific, sacred, branded* fork that branches and
rejoins on a designed path (cohesion §0); a runtime graph solver (2A.3) or sim fights that. Shared endpoints
make the field continuous *before* any blend, so `smin` only rounds a corner instead of inventing geometry.
The junction-only `smin` + correction is the difference between a *neck* and a *lump* — and it is the one
thing the generic 2025-2026 SDF tools (which blend globally with a single blend-radius) get *wrong* for a
plaitwork weave, because global blending smears the over/under. The chamfer-wall/round-floor split is the
Neo-Gaelic Brutalist read (sharp carved stone, liquid metal) that no off-the-shelf tool prescribes. The
window-overlap front is declarative data, not state — the split is *free*. Everything reuses the codebase's
idioms (`onBeforeCompile`, `gw_*` shared GLSL, `v3(PAL.*)`, dt-damped store uniforms, `dispose()` on unmount)
with **zero new dependencies** — the node is pure analytic SDF on the slab that already runs.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three@^0.169` (repo pin): `CatmullRomCurve3` (+ `arcLengthDivisions`/`getSpacedPoints`),
  `MeshPhysicalMaterial` + `onBeforeCompile`. **No mesh tube, no MarchingCubes here** — the fork/sink are
  carved analytically in the slab fragment shader (doc 24's path). The 3D mouth-bridge mesh (doc 19 §4.3) is
  a *separate* element at the channel→letter seam; the fork/rejoin is flat-slab SDF.
- `@react-three/fiber ^8.17`, `@react-three/drei ^9.114` — already present. **No new npm dependency.**
- Reuse in-repo: `gw_*` shared GLSL (`shaders.js`: `gw_sdSeg`, `gw_smin`, `gw_forge`, `gw_divineFire`,
  `gwCool01`, `gw_fbm` — docs 01/02/24), `PAL`/`v3` (`palette.js`), the master `U` pool (`forgeUniforms.js`),
  `forge`/`damp` (`store.js`), and the baked `KNOT` + `bakePourAxis` (doc 24 §4.1, doc 19 §4.2).

### 4.2 The junction data — shared endpoints (`src/scene/knot.js`, extends doc 24's `KNOT`)

The single load-bearing authoring rule: **the four children share one fork point and one sink point.**

```js
const FORK = [0.50, 0.12]   // the degree-4 split node (slab UV)
const SINK = [0.50, 0.52]   // the degree-4 merge node
export const KNOT = {
  source: { id:'s0', pts:[[0.50,0.02], FORK], layer:0 },                          // altar feed → fork
  branches: [ // EVERY child starts at FORK and ends at SINK — identical endpoints = C0-continuous field.
    { id:'b0', from:'s0', to:'k0', pts:[FORK,[0.30,0.22],[0.38,0.40],SINK], layer:1 },
    { id:'b1', from:'s0', to:'k0', pts:[FORK,[0.43,0.24],[0.55,0.42],SINK], layer:0 },
    { id:'b2', from:'s0', to:'k0', pts:[FORK,[0.57,0.24],[0.45,0.42],SINK], layer:1 },
    { id:'b3', from:'s0', to:'k0', pts:[FORK,[0.70,0.22],[0.62,0.40],SINK], layer:0 },
  ],
  sink: { id:'k0', from:['b0','b1','b2','b3'], pts:[SINK,[0.50,0.66]], layer:0 },  // merge → run
  // node anchors the shader needs for proximity-gated smin + the corrective ball:
  nodes: { fork: FORK, sink: SINK, nodeR: 0.06, corrK: 0.012 },
}
```

`layer` alternates `1,0,1,0` across the four children so the weave is **strict over/under** (doc 24 §4.4):
where a higher-`layer` strand passes over a lower one, the under-strand's groove floor is masked. The fork
and sink themselves are layer-neutral (all four meet, so over/under is resolved on the *crossings between
the nodes*, not at the nodes).

### 4.3 The junction-gated `smin` field (HEAD block, on the basalt slab via `onBeforeCompile`)

The `gw_sdSeg` (capsule) and `gw_smin` (IQ polynomial) already live in `shaders.js` (doc 24 §4.3). The new
piece is **proximity-gated blending + the corrective ball**, so `smin` acts only near the two nodes.

```glsl
// --- new uniforms on the slab HEAD block ---
uniform vec4  uSeg[64];     // xy=a, zw=b  baked capsule endpoints (shared endpoints at fork/sink)
uniform float uSegLayer[64];
uniform int   uSegCount;
uniform vec2  uFork, uSink; // the two degree-4 node positions (slab UV)
uniform float uNodeR;       // node influence radius (smin only inside this)
uniform float uCorrK;       // smin neck width k at the junction (~0.012)
uniform float uChanW;       // channel half-width

// junction proximity: 1 inside a node's blend zone, 0 well away from any node.
float gwNodeAmt(vec2 p){
  float df = length(p - uFork);
  float ds = length(p - uSink);
  return smoothstep(uNodeR, uNodeR*0.4, min(df, ds));   // smooth in→out of the crotch
}

// returns x = signed dist to nearest channel centreline, y = that strand's layer.
// Plain min EVERYWHERE; smin blended IN only where gwNodeAmt > 0 (fork/sink crotch).
vec2 gwChannel(vec2 uv){
  float dMin = 1e3, dSmooth = 1e3, layer = 0.0;
  float nodeAmt = gwNodeAmt(uv);
  for(int i = 0; i < 64; i++){
    if(i >= uSegCount) break;
    vec4 s = uSeg[i];
    float di = gw_sdSeg(uv, s.xy, s.zw);
    if(di < dMin){ dMin = di; layer = uSegLayer[i]; }   // hard min keeps the weave crisp
    dSmooth = gw_smin(dSmooth, di, uCorrK);             // smooth field for the crotch
  }
  // OVERLAP CORRECTION (smish.dev 2025): the chained smin over-merges where the four
  // children share the fork/sink endpoint → a bulge. A single negative "corrective ball"
  // at the nearer node un-counts the multiplicity, restoring a clean neck instead of a lump.
  vec2  node = (length(uv-uFork) < length(uv-uSink)) ? uFork : uSink;
  float dBall = length(uv - node) - uChanW*0.9;         // small sphere at the node
  dSmooth = max(dSmooth, -gw_smin(-dSmooth, -dBall, uCorrK*0.5)); // subtract the over-count
  // away from nodes → hard min (crisp over/under); at the crotch → corrected smooth field.
  float d = mix(dMin, dSmooth, nodeAmt);
  return vec2(d, layer);
}
```

The two ideas that make this *correct* and not a lump: **(1)** `nodeAmt` mixes the hard-`min` field
(everywhere) toward the smooth field (only at the fork/sink), so the four weaving crossings between the nodes
stay sharp over/under and only the *split itself* rounds. **(2)** the negative corrective term cancels the
multiplicity the chained `smin` double-counts where four capsules share an endpoint — the published overlap
correction, specialized to our one known shared node. Without (2) the crotch bulges outward (the four-way
bulge); with it, the metal *necks* from one groove into four.

### 4.4 Chamfer the carved wall, round the molten floor (2B.3)

The crotch reads two ways at once — the *stone* should chamfer (sharp, Brutalist), the *metal* should round
(liquid). Two profiles off the one field:

```glsl
// gw_smin = round (IQ polynomial). Add a chamfer union for the carved wall:
float gw_cmin(float a, float b, float k){ return min(min(a,b), (a + b - k) * 0.70710678); }

// floor (molten) uses the ROUND field from gwChannel; wall (stone) re-derives a CHAMFER field:
float dWall = 1e3;
for(int i=0;i<64;i++){ if(i>=uSegCount) break; dWall = gw_cmin(dWall, gw_sdSeg(uv, uSeg[i].xy, uSeg[i].zw), uCorrK); }
dWall = mix( min(dWall, dWall), dWall, gwNodeAmt(uv) ); // chamfer only blends at the node, like the floor
float groove = abs(dWall) - uChanW;   // the carved lip uses the chamfered (sharper) field
```

### 4.5 The front split / recombine (one clock, overlapping windows — extends doc 19 §4.2)

```js
// In bakePourAxis (doc 19): the four children SHARE the parent's end arc as their start.
// forkStartArc = s0.start + s0.len.  Each child window = [forkStartArc, forkStartArc + childLen].
// The sink window starts at the children's shared end arc → the four sub-fronts recombine into one.
for (const id of ['b0','b1','b2','b3']) segWindows[id] = [forkStartArc, forkStartArc + len(id)];
const childEnd = forkStartArc + maxChildLen;            // sink begins here (recombine point)
segWindows['k0'] = [childEnd, childEnd + len('k0')];
```

In the shader, the per-fragment `filled` test reads the **one** front against the segment's baked window —
so a fragment in any of the four children turns hot the instant `uPourFront` crosses `forkStartArc`:

```glsl
// per-fragment: which segment am I nearest (from gwChannel), and is the front past my window start?
float arc0   = uSegStart[nearestSeg];                   // baked window start of the nearest capsule
float front  = uPourFront * uTotalLen;                  // arc-length the metal has travelled
float filled = step(arc0, front);                       // 1 if the front has reached this strand
// optional flux split (2C.3, high tier): each child carries ~1/4 brightness, recombining to 1 at sink.
float flux   = mix(1.0, uSegFlux[nearestSeg], uHighTier); // 0.25..1.0 baked per child, 1.0 on s0/k0/run
float temp   = filled * (0.40 + 0.60 * gw_fbm(uv*6.0 + uTime*0.1));
temp += smoothstep(0.02, 0.0, abs(arc0 + segArcLocal - front)) * 0.9 * filled; // white-hot moving lip
vec3 metal   = gw_forge(temp) * flux;                   // SHARED master ramp (cohesion §1)
```

### 4.6 The r3f component shape (extends doc 24 §4.5 — same `CelticChannels`)

The fork/rejoin is **not a new component** — it is the junction handling inside the existing
`CelticChannels` slab material. The only additions are the node uniforms and the corrective-ball / proximity
gate in the injected GLSL.

```jsx
function CelticChannels({ quality }) {
  const segs = useMemo(() => bakeSegments(KNOT, quality==='high' ? 64 : 32), [quality]) // {seg, layer, start, flux}
  const uniforms = useMemo(() => ({
    ...U,                                   // bind the SHARED master pool (uTime, uPourFront, uTotalLen, uHeat…)
    uSeg:{value:segs.seg}, uSegLayer:{value:segs.layer}, uSegCount:{value:segs.layer.length},
    uSegStart:{value:segs.start}, uSegFlux:{value:segs.flux},
    uFork:{value:new THREE.Vector2(...KNOT.nodes.fork)},
    uSink:{value:new THREE.Vector2(...KNOT.nodes.sink)},
    uNodeR:{value:KNOT.nodes.nodeR}, uCorrK:{value:KNOT.nodes.corrK}, uChanW:{value:0.018},
    uHighTier:{value: quality==='high' ? 1 : 0},
  }), [segs, quality])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color:new THREE.Color('#0a120e'), roughness:0.85 })
    m.defines = { USE_UV:'' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)  // SAME references → ForgeDriver drives the whole world at once
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD_CHANNEL}`)   // gw_sdSeg/gw_smin/gw_cmin/gwChannel
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL_CHANNEL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR_CHANNEL}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])
  useEffect(() => () => material.dispose(), [material])
  return <mesh material={material}><planeGeometry args={[11,6.6,1,1]} /></mesh>
}
```

### 4.7 Key uniforms & parameters

| Uniform | Drives | Source |
|---|---|---|
| `uSeg[]`/`uSegLayer[]`/`uSegCount` | baked capsules + over/under layer | `bakeSegments(KNOT)` build-time |
| `uSegStart[]`/`uSegFlux[]` | per-segment arc-window start + flux split | `bakePourAxis` (doc 19) |
| `uFork`/`uSink` | the two degree-4 node positions | `KNOT.nodes` |
| `uNodeR` | node blend radius (smin only inside) | `~0.06`, leva-tunable |
| `uCorrK` | junction `smin` neck width `k` | `~0.012`, leva-tunable |
| `uPourFront`/`uTotalLen` | the ONE arc-length pour clock (split+recombine) | `forge.scrollDamped` (in `U`), dt-damped |
| `uHeat` | strike pulse — flares the whole node | `forge.strikeAt` (in `U`) |
| `uHighTier` | gate flux-split + corrective ball | `useQuality` |

### 4.8 How it hooks the shared master temperature system

The node **never invents heat**: the groove floor calls `gw_forge(temp)` and the A/E exception
`gw_divineFire` from `shaders.js` (cohesion §1), so the metal in all four children is *visibly the same
cooling body* as the source and the sink — same ramp, same noise, same cooling curve. The split/recombine is
driven by the **same `uPourFront` reference** the slab veins, the pour, the bridge (doc 19), and the wordmark
fill all bind — so a strike (`forge.strikeAt`) that surges `uHeat` flares the source, all four children, the
sink, and the run **in the same frame** (cohesion §7 rule 6). The arc-length axis is the single source of
truth doc 09's advection, doc 24's channel front, doc 19's bridge, and the spark orbit (doc 15) all consume:
**one knot, one clock, the fork is just a place where four windows share an arc value** (cohesion §7 rule 8).

---

## 5. COHESION — shared palette / lighting / uniforms

- **One temperature authority.** All four children, the source, and the sink color via `gw_forge(temp)` (=
  `gw_tempColor × gw_tempEmissive`) and clamp any A/E-feeding strand to `gw_divineFire` (cohesion §1.4). The
  moving white-hot lip is the hottest sample on each child; the cooled metal behind stays ≤1 and true-black
  on OLED. No private orange anywhere in the node.
- **One uniform pool.** The junction binds the **same `U` references** (cohesion §4.2) — `uTime`, `uHeat`,
  `uPourFront`, `uTotalLen`. Mutating `U.uHeat.value` in `<ForgeDriver/>` flares the fork in lockstep with
  the slab, the letters, and the sparks; that synchrony *is* the cohesion proof (cohesion §7 rule 6).
- **One noise basis.** The four children's molten churn uses shared `gw_fbm` at the shared `GW_FBM_OCTAVES`
  — the metal's surface life in each branch is the *same grain* as the source's flow and the basalt's stone,
  so the split never introduces a new texture frequency (cohesion §2, §7 rule 2).
- **One palette, HDR convention intact.** Only the white-hot moving lip and the A/E exceed 1.0, so the
  existing `mipmapBlur` bloom (`luminanceThreshold ≈ 0.55`) catches exactly the four hot front-lips and
  nothing else — the palette *is* the bloom selector (cohesion §3.1, §5.1). The chamfered groove walls and
  basalt stay ≤1 and read as *recessed*, not glowing.
- **Strict over/under preserved through the blend.** The junction-only `smin` (`nodeAmt` gate) means the
  weaving crossings *between* the nodes keep their hard-`min` over/under (`layer` IDs) — the blend rounds the
  *split*, never the *weave*. This is the one thing generic global-blend SDF tools get wrong; preserving it is
  what keeps the plaitwork authentic (doc 24 §7 pitfall 1/8).
- **The keystone, expressed identically.** If a child feeds the first `A`/`E` run, its terminal strand routes
  to `gw_divineFire` (white-gold, eternal) — the same first-A/first-E rule as the DOM `.forge-letter`, the 3D
  wordmark `aIsAE`, the basalt reveal, and the Ogham legibility (cohesion §1.4, §7 rule 5). The divine fire is
  *carried through the fork*, not stamped on after.
- **One clock, dt-damped.** Every value animates via `THREE.MathUtils.damp(cur,tgt,λ,dt)` from `forge` —
  never `lerp`, never a second rAF (cohesion §7 rule 6). The front advance is **Forge Reveal / Drift**:
  constant-velocity, no bounce; scroll *flares* it via `uHeat`, never springs it. The stone never moves —
  Neo-Gaelic Brutalist law (doc 24 §5): only the metal flows through the immovable carved knot.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The node adds **almost nothing** over doc 24's channel carve — the fork/rejoin is the *same capsule loop*
with a proximity-gated second blend, not a new pass.

- **The split costs nothing.** Overlapping arc-windows (2C.1) are baked floats; the per-fragment front test
  is one `step`. No render targets, no extra passes, no runtime graph state. The "split" is data.
- **The blend is a few extra ALU.** The hard-`min` field is computed anyway; the smooth field is one extra
  `gw_smin` per capsule (`dSmooth = gw_smin(dSmooth, di, k)` inside the existing loop) plus *one* corrective
  ball + *one* `mix`. With **N ≤ 32 capsules on mobile** (doc 24 §6), that is ~32 extra `smin`s (each ~6 ALU)
  + a handful of node ops — well inside the slab's existing multi-octave `gw_fbm` budget. The corrective ball
  and chamfer wall are **gated to `high`** (`uHighTier`); on `low` the crotch uses the plain proximity-gated
  round `smin` (still a clean neck, slightly softer).
- **Why SDF beats a tube tee on mobile.** Flawless edges at any zoom from one flat slab; zero tessellation
  for the branching; the whole node is fill-rate on a single full-screen-ish plane, not vertex cost. The
  channel-hall is top-down — exactly where a flat SDF carve reads best and a 3D tube crotch would be invisible
  cost.
- **Quality tiers (`high|low|static`):**
  - **high:** N=64 capsules, junction `smin` + corrective ball + chamfer wall + flux-split, full `gw_fbm`
    churn, A/E divine fire carried through the fork. The cinematic neck.
  - **low:** N=32, junction `smin` only (drop the corrective ball — at N=32 the residual bulge is sub-pixel),
    no chamfer (round floor doubles as wall), `GW_FBM_OCTAVES` −1 (thins detail *uniformly* — cohesion §7
    rule 9). Still a clean four-way neck.
  - **static** (reduced-motion / weak GPU): freeze `uTime=2`, fix `uPourFront` at a **mid-pour pose** where
    the front has just *split* across the fork (the most legible frame — four hot children diverging from one
    source), `frameloop='demand'`. A dignified frozen "the pour divides" still; the DOM Cinzel + `.forge-letter`
    wordmark is the no-JS/AEO truth.
- **`renderer.info` discipline.** The node adds **zero** draw calls (it is the slab's own fragment shader)
  and **zero** geometry/textures — `render.calls` and `memory` are *identical* to doc 24's channel carve.
  Nothing to dispose beyond the slab material itself.
- **Bake-time only.** Curve sampling, arc-windows, layer IDs, and flux scales are computed once at module
  load (or pre-baked to JSON) — no per-frame curve work. Alloc-free `useFrame` (the node anchors are
  pre-built `Vector2`s in `uniforms`).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls (each specific to the four-way junction):**

1. **The four-way bulge (the headline trap).** Naive chained `smin` over the four children **double/triple-
   counts the shared-endpoint overlap and bulges the crotch outward** — the metal swells into a blob exactly
   where it should neck (smish.dev 2025; `smin` is non-associative). Fix: blend each child against the
   *field*, gate the blend to the node radius, and add the **single negative corrective ball** at the node to
   un-count the multiplicity. Verify by rendering the raw distance field as grayscale — the fork should
   *neck*, not *bulge*.
2. **`smin` everywhere smears the weave.** If the smooth-union is applied globally (no `nodeAmt` gate), every
   over/under crossing between the nodes fattens into mush and the plaitwork dies (doc 24 §7 pitfall 6). Keep
   `smin` strictly inside `uNodeR` of the fork/sink; everything else is hard `min` with `layer` over/under.
3. **Endpoints not actually shared.** If a child's start point isn't *byte-identical* to the source's end
   point (a rounding drift in authoring), the capsule fields don't touch and the `smin` has to bridge a gap —
   reading as a stretched membrane, not a neck. Snap all four children to the *exact* `FORK`/`SINK` constants
   (§4.2).
4. **Catmull-Rom cusps at the node.** Four curves leaving one point at sharp angles will self-intersect with
   uniform CR. Use `'centripetal'` (doc 24 §7 pitfall 3); on the *tightest* fork angle, add one extra control
   point a short way down each child so the tangent leaves the node cleanly.
5. **Front speeds up or stalls at the split.** If the children's arc-windows don't start at *exactly*
   `forkStartArc` (the parent's end arc), the four fronts light at different times or lurch. Bake the windows
   from the *one* cumulative axis with `arcLengthDivisions ≥ 400` (doc 19 §7 pitfall 3) — uneven LUT spacing
   skews the split timing.
6. **Over/under lost at the node.** The four children's `layer` IDs (`1,0,1,0`) resolve the *crossings*, not
   the node itself. Don't try to layer the fork point (all four meet there); resolve over/under on the
   capsule crossings *between* fork and sink, and mask the under-strand's floor where a higher layer passes
   over (doc 24 §4.4).
7. **Chamfer on the floor / round on the wall (inverted).** The *metal* rounds (liquid `gw_smin`); the
   *carved stone wall* chamfers (sharp `gw_cmin`, Brutalist). Swapping them makes the stone look melted and
   the metal look faceted — exactly wrong.
8. **The node must be HOT only at the front, not always.** Don't let the whole crotch glow because four hot
   lips converge there; only the moving white-hot lip exceeds 1.0. Keep the cooled metal behind each
   front ≤1 (post-fx rule; doc 09 pitfall 4) or the fork blooms into a permanent flare.
9. **Flux-split as a *speed* change (wrong).** Reducing a child to ¼ flux must be a *brightness/volume*
   reduction (`uSegFlux` on emissive), never a speed change — speed stays arc-length-locked so the split/
   recombine timing never skews (2C.3). The four children advance together; they just each carry less light.
10. **Forgetting `static`/no-JS.** Reduced-motion must show a believable frozen *split* pose; the
    channel-hall page still needs real HTML copy independent of the canvas (`aeo-geo` rule).

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader):**

1. **Author the junction data** (§4.2): four children sharing the exact `FORK`/`SINK` points, `layer`
   alternating `1,0,1,0`. Eyeball as plain `<Line>` strands first (no SDF) — confirm the four-fork and rejoin
   *land* and the weave alternates.
2. **Render the raw `gwChannel` distance** as grayscale with **plain `min` only** (no `smin`). Confirm the
   four grooves read and the over/under crossings are crisp.
3. **Add junction-gated `smin`** (`gwNodeAmt` + `gw_smin`) — confirm the crotch *rounds* but, critically, the
   weaving crossings stay sharp. If the whole knot softens, the gate is wrong.
4. **Add the corrective ball** (§4.3) — confirm the fork/sink *neck* instead of *bulge*. Toggle it on/off to
   see the bulge it removes (this is the single most important verification in the doc).
5. **Carve the groove** (NORMAL bevel + COLOR wall/floor split) with the **chamfer wall / round floor** (§4.4)
   — confirm the stone reads sharp-carved and the metal reads liquid.
6. **Wire the front split** (§4.5): one `uPourFront`, four children sharing `forkStartArc`. Scroll and
   confirm all four light *at once* when the front reaches the node, and recombine into one at the sink — *no
   jump*, *no lurch*.
7. **Add flux-split** (`high` only) — confirm each child carries ~¼ brightness and recombines to full at the
   sink, selling "one body divided."
8. **Stamp the A/E** on any child feeding the first `A`/`E`; verify the divine fire is *carried through the
   fork* white-gold and eternal while siblings cool.
9. **Gate tiers** + the `static` frozen-split poster; frame the channel-hall **top-down** in `scenes.js`.
10. **Strike test:** fire `forge.strikeAt`; confirm source, all four children, sink, and run flare in the
    **same frame** (cohesion proof).
11. **Device read on the iPhone 15 OLED** — the neck (not bulge), the four crisp weaving crossings, the
    white-hot lips, the white-gold A/E carried through, and the true-black void do **not** simulate headless.

---

## 8. SOURCES (2025–2026)

- **smish.dev — _smin overlap correction_ (2025).** The load-bearing 2025 insight for this doc: chained
  `smin` is **non-associative** (`smin(a,smin(b,c)) ≠ smin(smin(a,b),c)`), and smooth-unioning many
  overlapping shapes **double/triple-counts the overlap and bulges the result**; the correction subtracts
  negative-weight spherical SDF contributions at the overlapping endpoints to restore correct multiplicity —
  exactly the four-way fork bulge and its fix. https://www.smish.dev/math/smin_overlap_correction/
- **Inigo Quilez — _Smooth Minimum_ (full rewrite: Normalization, Kernels, circular smin, blend-function
  analysis), refreshed through 2025 (announce tweet 2024-03, maintained 2025).** The canonical `gw_smin`
  polynomial used at the fork/sink, the `k`-as-neck-width parameter, and the blend analysis that explains why
  the crotch over-rounds without correction. https://iquilezles.org/articles/smin/ ·
  https://x.com/iquilezles/status/1765935148091261277
- **Codrops — _Building an Endless Procedural Snake with Three.js and WebGL_, 2026-02-10.** The
  `CurveGenerator` (short cubic-Bézier segments) + **parallel-transport frames** ("normal propagated forward
  by the minimal rotation aligning successive tangents — a stable frame with minimal twist") — the exact
  twist-free strand framing the fork's four children require where they leave the node at sharp angles.
  https://tympanus.net/codrops/2026/02/10/building-an-endless-procedural-snake-with-three-js-and-webgl/
- **Codrops — _How to Create Interactive, Droplet-like Metaballs with Three.js and GLSL_, 2025-06-09.** The
  modern reference for `smin`-blended merging: applying `smoothMin` with a `k` smoothness parameter to fuse
  spheres into one seamless body that necks and responds to motion — the "one body splits/rejoins, no hard
  seam" read the fork needs, plus the surface-noise organic upgrade.
  https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/
- **Xor (@XorDev) — _Signed Distance Fields_, GM Shaders, 2025-02-19.** Line-segment/capsule SDFs, smooth
  unions, and "outlines/glow/grooves for next to no cost from the distance value" — the toolkit for the
  capsule field the four children are built from and the groove carve. https://mini.gmshaders.com/p/sdf ·
  https://x.com/XorDev/status/1892057309070659914
- **sbcode.net — _Signed Distance Fields_ (Three.js Shading Language tutorials), 2025.** The TSL `smin`
  form (`const smin = Fn(([a,b,k]) => { const h = max(k.sub(abs(a.sub(b))),0).div(k); return
  min(a,b).sub(h.mul(h).mul(k).mul(0.25)) })`) and union/subtract/intersect operators — the WebGPU/TSL port
  path for the junction blend, authored portable now. https://sbcode.net/tsl/2d-sdf/
- **reindernijhoff.net — _WebGPU SDF Editor: Real-Time Signed Distance Field Modeling_, 2026-01.** A 2026
  WebGPU SDF tool confirming `smin` smooth-union + **per-node blend operation and blend radius** as the live
  primitive for fused implicit surfaces — corroborates the proximity-gated (per-node-radius) blend the fork
  uses, and the forward-looking TSL/WebGPU validation.
  https://reindernijhoff.net/2026/01/webgpu-sdf-editor-real-time-signed-distance-field-modeling/
- **SDF.R (GPU SDF Blender add-on) & ConjureSDF, 2025-2026.** Production SDF tools exposing **Round / Sharp /
  Soft / Tight / Chamfer** blend profiles (SDF.R) and None/Smooth/Chamfered/Inverted-Round (ConjureSDF, alpha
  through end-2025) — the 2025-2026 corroboration for the GAELWORX **chamfer-wall / round-floor** two-profile
  crotch (Brutalist stone vs. liquid metal). https://superhivemarket.com/products/sdfr ·
  https://sascha-rode.itch.io/sdf-modeler/devlog
- **Ronja — _2D SDF Combination_ (referenced/maintained 2025).** The `sdf_groove` inset/bevel trick and the
  union/intersection/subtraction primitives for 2D SDFs — the carved-groove + chamfer reference for the
  junction wall. https://www.ronja-tutorials.com/post/035-2d-sdf-combination/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Generalized overlap correction for arbitrary-degree knot nodes.** Formalize the smish.dev multiplicity
   correction for *any* degree-N junction in the GAELWORX knot (not just the hero degree-4 fork) — a baked
   per-node corrective-ball table so a future denser knot with degree-3 and degree-5 crossings necks cleanly
   without per-node hand tuning. The data-driven generalization of §4.3.
2. **Flux-conserving brightness split with shared spark hand-off.** Tie the per-child `uSegFlux` (2C.3) to the
   shared ember system (doc 15): as the front splits, sparks shed from the parent lip *divide* across the four
   children proportional to flux, and recombine at the sink — one particle budget, split and rejoined with the
   metal, so the sparks confirm "one body divided."
3. **Chamfer-vs-round crotch as a per-route `scenes.js` knob.** A/B the Brutalist chamfer wall against a fully
   liquid round crotch on the iPhone 15 OLED, and expose it as a per-chamber preset (sharper carved stone in
   the channel-hall, softer molten read in the casting-room) — the look-dev decision that ties the node's
   stone/metal balance to the per-route mood.
4. **TSL/WebGPU port of the junction-gated `smin` field.** Move the proximity-gated four-way blend + corrective
   ball to a TSL `Fn()` (per the sbcode TSL SDF tutorial + the Jan-2026 WebGPU SDF editor's per-node blend
   radius) on iOS WebGPU; quantify the headroom from a structured-buffer capsule loop and the WebGL fallback
   story, sharing the math 1:1 with doc 19's bridge port.
