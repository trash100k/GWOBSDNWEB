# 26 — The Pour-Front Spark Emitter as a Moving Parametric Position Along the Interlace Path

_Phase 2 deep-dive · cluster **C-flow-pour** · GAELWORX forge world · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js r17x, `onBeforeCompile` / CPU-stepped `Points`), warm-forge palette._

> **Parents & contract.** This doc is the named deep-dive candidate **#2 of phase1/15** ("Pour-front emitter
> geometry along the Celtic-interlace channels — feed the spark `uPourFront` not as a single point but as a
> moving parametric position along the interlace path, and at multiple branches, so sparks track the metal as
> it winds/branches/rejoins") and candidate **#2 of phase2/09** ("Multi-point / branching pour-front emission
> along the interlace curve, per-branch heat weighting, on the CPU-advection path"). It sits exactly **on top
> of** three already-decided systems and **does not re-derive them**: the arc-length knot bake
> ([phase2/20](20-arclength-knot-bake.md)) that owns the `arcLUT` and `getKnotPoint(arc)`; the four-fork
> graph ([phase2/21](21-four-fork-rejoin-graph.md)) that owns the overlapping arc-windows and per-child
> `uSegFlux`; and the curl-advected spark transport ([phase2/09](09-curl-advected-spark-smoke.md)) that owns
> `gw_curl3`, the substep integrator, and the additive `Points` render material. Cohesion authority:
> [00-COHESION-MAP.md](../00-COHESION-MAP.md) §1 (master temperature), §2 (shared noise), §5.1 (sparks are
> cooling metal), **§7 rule #8** ("shares the channel curve data three ways"), §10 (perf). **What this doc
> uniquely owns:** the *emitter geometry* — turning `forge.pourFront` from a single damped vec3 into a
> **multi-head emitter** sampled at the live arc-length front off the shared baked curve, splitting across the
> four branches with per-branch heat weights, and recombining at the sink — so the spawn ring tracks the metal
> through every bend, fork and rejoin, and the sparks confirm *one body divided* rather than *four pipes*.

---

## 1. SCOPE — this element in the GAELWORX world

The LIVING SPARKS are the forge's most legible tell that the metal is *moving and alive*. They orbit the
white-hot leading edge of the pour as it winds the Celtic-interlace channels (cohesion §5.1: "the sparks …
are literally cooling metal droplets"). phase2/09 built the *transport* — divergence-free `gw_curl3` swirl,
4–8 Euler substeps, heat attraction toward a vec3 `forge.pourFront`, the shared `gw_forge` color ramp. But
phase2/09 consumed the pour-front as **one moving point**, explicitly deferring the harder geometry: a single
vec3 cannot track a front that is, at the same instant, at *four different places* on four weaving branches,
nor advance at constant speed through a tight bend, nor weight its emission toward the hottest strand. That
geometry is this doc.

The brief is precise. The pour leaves the altar, runs the source channel, **forks into four strands** that
weave with strict over/under, and **rejoins** into one run that feeds the `GAELWORX` letterforms. The spark
emitter must:

1. **Track the live front** as a parametric position **along the baked arc-length curve** — not a hand-keyed
   vec3, but `getKnotPoint(uPourFront · totalArc)` so the spawn origin *is* the metal's leading edge, riding
   the same `arcLUT` the channel fill and the camera DOF focus read (rule #8).
2. **Constant physical speed.** Because the origin is sampled by **arc length** (not raw `t`/`uv`), the
   emitter moves at constant metres-per-second through straights, tight bends, and the fork — it never
   lurches. This is Demand A of phase2/20 expressed in the emitter, not just the fill.
3. **Split into four heads at the fork.** When the front crosses `forkStartArc`, the emitter becomes **four
   emitter heads**, one riding each branch's local front, each carrying a **per-branch heat weight** so the
   hotter branches throw more, brighter sparks. The heads recombine into one at the sink.
4. **Carry the tangent.** Each head exposes its **tangent** (direction of metal travel) so sparks are born
   with a forward bias along the flow and shed *backward* off the lip, reading as a wake, not a fountain.
5. **Carry the divine-fire flag.** A head feeding the first `A`/`E` run is clamped to `gw_divineFire`
   (white-gold, eternal) — the keystone exception (cohesion §1.4), carried *through the fork*, never stamped
   on after.

This is the dominant spark read of the **channel-hall chamber (`/automations`, top-down)** where the weave —
and therefore the four spark heads winding it — is fully legible, and the connective beat in the
**casting-room** and **forge-mouth arch**. Get it wrong and the sparks float off a single ghost-point in the
middle of the slab while the metal visibly flows elsewhere — the instant "bolted-on" tell. Get it right and
**the sparks are where the metal is**, splitting and rejoining with it, and the channel-hall reads as one
living molten body threading a sacred plait.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The emitter decomposes into four independently-solvable sub-problems: **(A) curve sampling** (how the live
arc position becomes a world position + tangent), **(B) the branch split topology** (one head → four heads →
one), **(C) per-branch heat weighting** (how much each head emits and how hot), and **(D) where the sampling
runs** (CPU vs baked LUT vs GPU compute). Honest tradeoffs below.

### 2A — Sampling the live front: position + tangent from an arc coordinate

**2A.1 — three.js `getPointAt(u)` / `getTangentAt(u)` on the baked `CatmullRomCurve3` (the canonical move).**
three's curve API exposes `getPointAt(u)` and `getTangentAt(u)` where **`u ∈ [0,1]` is a position *by arc
length*** (the docs: "returns a vector for a given position on the curve according to the arc length"). This
is exactly the constant-speed sampling the emitter needs — feed it `u = uPourFront` and the returned point
advances at constant physical speed. **Caveat, verified 2025 (three.js issue #10432 + the forum thread
"Accuracy of getSpacedPoints"):** on `CatmullRomCurve3`, arc-length methods can return mildly *uneven*
spacing unless `arcLengthDivisions` is raised well above the default 200. **Quality:** correct and idiomatic.
**Perf:** each `getPointAt` re-integrates against the internal LUT — fine for *one* call/frame (the single
front), wasteful if called per-particle. **Fit: the reference, but we bake it (2D.2) so the per-frame cost is
a table lookup, not a curve re-integration.**

**2A.2 — Baked 256-sample arc→(pos,tangent) LUT (recommended).** phase2/20 already bakes the `arcLUT`; this
doc formalizes a **flat 256-entry table** of `(pos.xyz, tangent.xyz)` evenly sampled by arc length, per
strand. Sampling the front is then `lut[floor(u·255)]` + a lerp — **a few ALU, zero curve math at runtime**.
This is the exact pattern the 2025–2026 literature converged on: the Codrops procedural-snake article (Feb
2026) "the CPU samples the curve and uploads the result as textures, and the GPU does the rest," and the
WebSearch-surfaced TSL particle pattern "curves are baked into 256-sample lookup arrays for fast GPU
evaluation." **Quality:** identical to 2A.1 once baked dense. **Perf:** O(1) lookup. **Fit: the master
sampler — one baked table, shared by the JS emitter and (post-judge) a GPU read.**

**2A.3 — `getPointAtLocal(u)` windowed sub-curve sampling (the snake pattern).** The procedural-snake article
samples a *moving window* of a longer curve via `getPointAtLocal(u) = getPointAt(uStart + uLength·u)` — the
window slides as the snake travels. For GAELWORX the analogue is per-branch: each branch's head samples its
**own** local `[0,1]` window mapped from the global arc front. **Fit: the per-branch remap (§2B), borrowed
directly from the snake's windowing.**

**2A.4 — Texture-lookup Bézier evaluation (the bilinear-hardware trick).** The 2026 arXiv paper *A Texture
Lookup Approach to Bézier Curve Evaluation on the GPU* stores each cubic curve in a small texture and
"evaluates the curve with a single bilinear read," leaning on fixed-function linear-interpolation hardware.
Elegant for *evaluating* a curve cheaply on the GPU; **overkill for a single front per branch** (we have ≤5
heads, not thousands of curve evals/frame). **Fit: the technique to reach for only if the emitter ever moves
to a per-particle GPU curve eval; for ≤5 heads the flat LUT (2A.2) is simpler and cache-trivial.**

### 2B — The branch split topology: one head → four → one

**2B.1 — Declarative arc-window heads on one clock (recommended).** phase2/21 §2C.1 already established that
the four children carry `[startArc, endArc]` windows that **all start at `forkStartArc`**, so when
`uPourFront` crosses that value all four light *at once*. The emitter mirrors this **without any runtime graph
state**: maintain a small fixed array of *potential* heads (source, b0..b3, sink), and for each, the head is
**active** iff `uPourFront·totalArc ∈ [headStartArc, headEndArc]`, its local position is
`branchLUT.sample((front − headStartArc) / headLen)`. The split is *data* — a `step()`/in-window test per
head, evaluated every frame, no token traversal. **Quality:** correct split + recombine, frame-independent.
**Perf:** ≤6 in-window tests/frame. **Fit: the emitter's split model — the spark mirror of phase2/21's fill
windows, so spawn and fill cannot drift.**

**2B.2 — Runtime graph-token emitter (reject).** A front token that *splits* into four emitter tokens at the
degree-4 node and *merges* at the sink is stateful, order-dependent, and frame-coupled — what a fluid sim
would do. The window model produces the identical visual with zero state (phase2/21 §2C.2, phase2/20 reach
the same verdict for the fill). **Keep graph traversal as the authoring mental model only.**

**2B.3 — Single blurred multi-emitter ring (the cheap floor).** On `low`/`static`, collapse the four heads
into **one fat emitter** at the *mean* of the active heads' positions with a wider spawn jitter that visually
covers the four branches. Loses per-branch precision but keeps a believable spark cloud over the weave at a
fraction of the cost. **Fit: the `low`-tier degrade — fewer heads, wider jitter, uniform thinning (cohesion
§7 rule 9).**

### 2C — Per-branch heat weighting (the "hottest branch throws more")

**2C.1 — Baked per-branch `flux` × live front proximity (recommended).** phase2/21 §2C.3 bakes a per-child
`uSegFlux ≈ 0.25..1.0` (conservation-of-flux: one body into four → each child ~¼ the visual flux). The
emitter reuses it directly as the **per-head spawn weight and brightness**: head `h`'s spawn rate ∝
`flux[h] · uHeat`, and its seed temperature ∝ `flux[h]`. Recombining to full at the sink falls out because
the sink head's flux is 1.0. **This is the cohesive choice** — the same flux number drives the fill
brightness (phase2/21) and the spark emission, so they cannot disagree. **Fit: the weight source.**

**2C.2 — Live sampled temperature at the head (the realism upgrade).** Instead of a static baked flux, sample
the **actual cooling temperature** at each head's arc position via the shared `gwCool01(age)` — a head whose
local front just received metal is white-hot (heavy emission), a head trailing slightly cooler emits less.
Because all four heads are at the *moving front*, their `age ≈ 0`, so in practice this is near-uniform at the
front and the baked flux dominates; the live sample matters most **just after the fork**, where one branch's
front may briefly lead. **Fit: a `high`-tier polish layered on 2C.1.**

**2C.3 — Inverse-CDF weighted head selection (the principled spawn distribution).** When a single particle
budget (e.g. 320) must be *distributed* across the active heads proportional to weight, the textbook move is
**inverse-CDF sampling**: build a cumulative weight table over the active heads, draw a uniform random, map it
through the inverse CDF to pick a head. This guarantees the spark *population* matches the flux weights
exactly (the hottest branch gets proportionally more of the fixed budget), rather than each head emitting
independently and the total drifting. **Fit: the budget-allocation method (§4.5) — one fixed pool, weighted
across heads, so density tracks heat without inflating count (cohesion §10).**

### 2D — Where the sampling runs

**2D.1 — CPU, in the existing `useFrame` (recommended, judge-tier).** The emitter sampling is **≤6 LUT
lookups + an inverse-CDF draw per spawned particle**, run in the *same* alloc-free `useFrame` that phase2/09's
substep advection already runs. No render targets, no second rAF, WebGL2-safe, disposable. At the forge's
~320-spark budget this is sub-0.1 ms. **Fit: ship this to the judge — it bolts straight onto phase2/09's CPU
`Points`.**

**2D.2 — Baked LUT in a `DataTexture`, read by a GPU compute spawn (the post-judge port).** Heckel's *Field
Guide to TSL and WebGPU* (Oct 2025) and the threejsroadmap WebGPU-compute galaxy/particle tutorials show the
modern pattern: an `instancedArray` of spawn positions initialized/updated by a `.compute()` pass that reads a
baked curve LUT. The Matrix Sentinels TSL trails article (Codrops, May 2025) is the direct reference for
**emitter-follows-a-moving-target with TSL** (attractor positions drive a trail of instanced segments). The
emitter LUT becomes a `texture()` read inside the compute kernel; the per-branch window test and flux weight
are `Fn()` nodes. **Fit: the TSL-portable destination (cohesion §10, doc 30) — author the sampler as a pure
function now so the port is a re-host, but ship 2D.1 to the WebGL2 judge.**

**2D.3 — Pure vertex-shader field eval (reject for the heads).** Current `Embers.jsx` evaluates motion as a
function of `uTime` with no integration — it *cannot* track a moving emitter (phase2/09 §2.2c). The emitter
origin must be CPU-sampled (or compute-sampled) and handed to the spawn; a stateless vertex shader can't
follow the front. **Fit: the `static` floor only (frozen pose).**

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A multi-head CPU emitter: the live `uPourFront` arc scalar samples a baked 256-entry per-branch
arc→(pos,tangent) LUT (2A.2), splits into up to four active heads via declarative arc-windows on the one clock
(2B.1), weights each head by its baked per-branch flux (2C.1) using an inverse-CDF draw over a fixed spark
budget (2C.3), and seeds phase2/09's curl-advected `Points` at the chosen head's position + tangent — all in
the existing single `useFrame`, no GPGPU, no second rAF, TSL-portable for the post-judge port.**

Concretely, the emitter is a tiny stateless function of three inputs every frame: `uPourFront` (the shared
arc scalar from `<ForgeDriver/>`), the baked `KNOT_LUT` (per-branch position/tangent tables + arc windows +
flux), and `uHeat` (the shared master pulse). It produces, per spawn, a `(position, tangent, temp, isAE)`
record that phase2/09's `seedAtPourFront` consumes. **This is the minimal change that satisfies the brief** —
it does not introduce a new particle system, a new clock, or a new color path; it replaces phase2/09's single
`forge.pourFront` vec3 with a *function that returns the right head's position*.

**Why this and not alternatives.** GAELWORX needs the sparks to track a *specific, sacred, branded* knot that
forks and rejoins on a designed path (cohesion §0); a runtime graph emitter (2B.2) or a per-particle GPU
curve eval (2A.4) is more machinery than ≤5 heads justify. The baked LUT makes the constant-speed sampling
free (Demand A solved as data, phase2/20). The arc-window split makes the four-way emission *declarative* —
the spark split is the **same windows** the fill uses (phase2/21), so they are byte-locked: the instant the
fill lights all four branches, the sparks split across all four, because they read the same `forkStartArc`.
The flux weight is the **same number** that dims each child's fill (phase2/21 §2C.3), so the brightest fill is
the densest spark stream — *one body divided*, confirmed twice. Everything reuses repo idioms (`gw_*` GLSL,
`PAL`/`v3`, the `U` pool, `dt`-damped store, dispose-on-unmount) with **zero new dependencies**.

The smoke half (phase2/09) is unchanged: smoke does **not** split per-branch — it lifts off the whole channel
field in slow Atmospheric Drift, so it keeps the single-attractor model. Only the **sparks** get the
multi-head emitter, because only the sparks read as *born at the front*.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js r17x** (repo pin, WebGL2): `CatmullRomCurve3` (`'centripetal'`, `arcLengthDivisions = 1000`),
  `getPointAt` / `getTangentAt` — **build-time only**, to bake the LUT. Runtime is `THREE.Points` +
  `Float32Array` + the existing additive material (phase2/09). **No new runtime dependency.**
- **@react-three/fiber / @react-three/drei** — as installed.
- **Build-time:** the emitter LUT is baked alongside the knot in `scripts/bakeKnot.mjs` (phase2/20) — it is
  *the same bake*, extended to also emit `branchLUT[]` (pos+tangent) and the per-branch `{startArc, len,
  flux, isAE}` metadata. Output committed to `src/scene/knotBake.js`.
- Reuse: `gw_curl3` + the substep integrator + `seedAtPourFront` + the render material (phase2/09); `gw_forge`
  / `gw_divineFire` / `gwCool01` (`shaders.js`); `PAL` / `v3` (`palette.js`); the master `U` pool
  (`forgeUniforms.js`); `forge` + `THREE.MathUtils.damp` (`store.js`).
- **Deferred (post-judge, WebGPU only):** `three/tsl` `Fn` + `instancedArray` + `.compute()` + `texture()`
  LUT read (Heckel 2025; Matrix Sentinels 2025; galaxy-compute tutorials).

### 4.2 The emitter LUT bake (extends phase2/20's `bakeKnot.mjs`)

```js
// scripts/bakeKnot.mjs — emit, per branch, a 256-entry arc-length-even (pos, tangent) LUT + metadata.
// Reuses the SAME centripetal CatmullRomCurve3 + own-the-arc-length-LUT machinery from phase2/20 §4.2.
const LUT_N = 256;
function bakeBranchLUT(curve) {           // curve already arc-length-aware (arcLengthDivisions = 1000)
  const pos = new Float32Array(LUT_N * 3);
  const tan = new Float32Array(LUT_N * 3);
  for (let i = 0; i < LUT_N; i++) {
    const u = i / (LUT_N - 1);            // u is BY ARC LENGTH (getPointAt/​getTangentAt, three docs)
    const p = curve.getPointAt(u);        // constant-speed sample — Demand A
    const t = curve.getTangentAt(u);      // direction of metal travel at this point
    pos.set([p.x, p.y, p.z], i * 3);
    tan.set([t.x, t.y, t.z], i * 3);
  }
  return { pos, tan };
}
// Per-branch metadata, sharing the ONE cumulative arc axis (phase2/21 windows + flux):
// branches: [{ id, lut:{pos,tan}, startArc, len, flux, isAE }]  — startArc of all four children = forkStartArc.
export const KNOT_LUT = { totalArc, branches, forkStartArc, sinkStartArc };
```

The LUT is **arc-length-even** by construction (`getPointAt`/`getTangentAt` sample by arc length), so a head
that advances its `u` at constant rate advances at constant *physical* speed — no per-bend lurch. We bake
`getPointAt`, not raw `getPoint`, precisely to dodge the issue-#10432 uneven-spacing footgun (§7 pitfall 2).

### 4.3 The multi-head sampler (JS, alloc-free, the heart of this doc)

```js
// src/scene/PourEmitter.js — pure function: given the live arc front, return the ACTIVE emitter heads.
// Called once/frame in the existing useFrame (phase2/09). Scratch hoisted; no allocation.
const _heads = Array.from({ length: 6 }, () => ({
  pos: new THREE.Vector3(), tan: new THREE.Vector3(), weight: 0, temp: 1, isAE: 0,
}));

function sampleBranchLUT(lut, u, outPos, outTan) {   // O(1) table lookup + lerp (no curve math at runtime)
  const f = THREE.MathUtils.clamp(u, 0, 1) * (256 - 1);
  const i = f | 0, frac = f - i, j = Math.min(i + 1, 255);
  for (let k = 0; k < 3; k++) {
    outPos.setComponent(k, lut.pos[i*3+k] + (lut.pos[j*3+k] - lut.pos[i*3+k]) * frac);
    outTan.setComponent(k, lut.tan[i*3+k] + (lut.tan[j*3+k] - lut.tan[i*3+k]) * frac);
  }
}

// Returns the count of active heads; fills _heads[0..n-1]. uPourFront ∈ [0,1] (shared, from U pool).
export function activeHeads(KNOT_LUT, uPourFront, uHeat) {
  const front = uPourFront * KNOT_LUT.totalArc;   // arc-length the metal has travelled (constant speed)
  let n = 0;
  for (const b of KNOT_LUT.branches) {
    const local = (front - b.startArc) / b.len;   // declarative arc-WINDOW test (phase2/21 §2C.1)
    if (local < 0 || local > 1) continue;         // head inactive — front hasn't reached / has passed it
    const h = _heads[n++];
    // sample the head's position + tangent at its LOCAL leading edge (clamped to the window front)
    sampleBranchLUT(b.lut, Math.min(local, 1), h.pos, h.tan);
    h.weight = b.flux * uHeat;                     // per-branch heat weight (phase2/21 flux × master heat)
    h.temp   = b.isAE ? 1 : (0.85 + 0.15 * b.flux);// hot at the front; flux modulates (2C.1)
    h.isAE   = b.isAE;                             // keystone flag carried THROUGH the fork (cohesion §1.4)
  }
  return n;                                        // 1 before fork → 4 between fork/sink → 1 after sink
}
```

The two ideas that make this *correct*: **(1)** the window test (`local ∈ [0,1]`) is the spark mirror of the
fill's `step(arc0, front)` — the same `startArc` values, so the spark split and the fill split are the same
event. **(2)** sampling at `min(local, 1)` clamps each head to its *moving leading edge*, so the head sits on
the front of its branch, not the middle — sparks are shed at the lip.

### 4.4 Wiring into phase2/09's substep advection (the spawn hand-off)

The only change to phase2/09's `useFrame` is **how a respawning particle gets its origin**: instead of
`seedAtPourFront(_p, forge.pourFront, …)` (one fixed vec3), it picks a head by **inverse-CDF over the active
heads' weights** and seeds at that head's position + tangent:

```js
// inside the per-particle respawn branch of phase2/09 §4.4 useFrame:
const nHeads = activeHeads(KNOT_LUT, U.uPourFront.value, heat);     // 1..4 active heads this frame
if (nHeads > 0 && heat > SEED_THRESHOLD) {
  const h = pickHeadByWeight(_heads, nHeads, hash01(aux[i*3+2]));   // inverse-CDF draw (§4.5)
  seedAtHead(_p, h, aux[i*3+2]);                                     // born at the head's lip, biased along tangent
  aux[i*3]   = 0;                                                    // age = 0
  aux[i*3+3] = h.temp;                                              // baked seed temp (flux/divine)
  aux[i*3+4] = h.isAE;                                             // per-spark A/E flag → render clamps to divineFire
}
```

```js
// seed at a head: jitter ball at the lip, with a BACKWARD bias along -tangent (wake, not fountain)
const _t = new THREE.Vector3();
function seedAtHead(p, h, seed) {
  const r = 0.16 * (1.2 - 0.6 * h.weight);            // tighter, brighter spawn when the branch is hot
  _t.copy(h.tan).multiplyScalar(-0.05);               // shed slightly BEHIND the moving front
  p.set(h.pos.x + _t.x + (h31(seed)*2-1)*r,
        h.pos.y + _t.y + (h31(seed+1.3)*2-1)*r*0.6,   // flatter in Y (along the channel surface)
        h.pos.z + _t.z + (h31(seed+2.7)*2-1)*r);
}
```

phase2/09's curl substep loop and render material are **unchanged** — they already read `aux` age and the
shared `gw_forge`/`gw_divineFire` ramp. We only enriched the *spawn origin* from a point to a weighted
multi-head sample. The `aIsAE` per-spark attribute flows into the existing `uIsAEEmitter` render branch.

### 4.5 Inverse-CDF head selection (the fixed-budget weighting)

```js
// distribute the ONE fixed spark budget across active heads proportional to weight (2C.3).
// Cumulative weights are rebuilt only when nHeads or weights change (cheap; ≤4 entries).
function pickHeadByWeight(heads, n, u01) {            // u01 ∈ [0,1) per-spark stable hash
  let total = 0; for (let i = 0; i < n; i++) total += heads[i].weight;
  let acc = 0; const target = u01 * total;
  for (let i = 0; i < n; i++) { acc += heads[i].weight; if (target <= acc) return heads[i]; }
  return heads[n - 1];
}
```

This guarantees the spark *population* matches the flux weights: the hottest branch (highest `flux · uHeat`)
gets proportionally more of the fixed 320-spark pool — density tracks heat **without inflating count**
(cohesion §10: density from heat-gated weighting, never raw count). At the fork, four heads of equal flux
≈ ¼ each; if one branch leads (live temp, 2C.2) it transiently wins more.

### 4.6 The r3f component shape (extends phase2/09's `Sparks.jsx`)

```jsx
import { U } from './forgeUniforms'          // the Master Forge Uniform pool (cohesion §4.2)
import { KNOT_LUT } from './knotBake'        // baked per-branch arc→(pos,tangent) LUT + flux + windows

export default function Sparks({ count = 320 }) {
  const quality = forge.quality
  const heads   = quality === 'high' ? 4 : quality === 'low' ? 2 : 1   // §2B.3 degrade: fewer heads on low
  const { geo, mat, aux } = useMemo(() => makeSparks(count), [count])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])  // dispose (cohesion §4.3)

  const _p = useMemo(() => new THREE.Vector3(), [])   // hoisted scratch (alloc-free §4.4)
  useFrame((state, dt) => {
    if (forge.quality === 'static') return            // frozen mid-pour pose
    const dtc = Math.min(dt, 1/30)                    // clamp tab-restore hitch (cohesion §10)
    const heat = U.uHeat.value                        // SHARED master pulse (driven by ONE ForgeDriver)
    // --- the §4.4 substep advection, with the multi-head emitter spawn ---
    // (positions advected by gw_curl3 over SUBSTEPS; respawn picks a weighted head via activeHeads + pickHeadByWeight)
    geo.attributes.position.needsUpdate = true
    geo.attributes.aAge.needsUpdate = true
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}
```

Gate the mount by `forge.route` so the multi-head sparks live in **casting-room / channel-hall / forge-mouth**
and stay quiet in the scrying-pool (cohesion §9). The emitter **reads** `U.uPourFront`/`U.uHeat`; it never
authors them — the single `<ForgeDriver/>` does (cohesion §4.2).

### 4.7 Key uniforms & parameters

| Param / uniform | Tier-set / source | Role |
|---|---|---|
| `U.uPourFront` (float, **shared**) | `forge.scrollDamped` → `<ForgeDriver/>`, dt-damped | the ONE arc-length front (0..1); samples the LUT |
| `U.uHeat` (float, **shared**) | strike `exp(-since*3)` + `vel` | per-head spawn rate, weight, color |
| `KNOT_LUT` | build-time bake (phase2/20 §4.2 extended) | per-branch (pos,tan) LUT + `{startArc,len,flux,isAE}` |
| `heads` | 4 high / 2 low / 1 static | active emitter-head cap (§2B.3 degrade) |
| `count` | 320 high / 200 low / `<Sparkles>` static | additive-points budget (cohesion §10) |
| `SUBSTEPS` | 6 / 4 / 0 | phase2/09 curl coherence knob (never 1) |
| `SEED_THRESHOLD` | ~0.15 | cold forge → few sparks (drawn by heat) |
| `flux` (per branch) | baked, phase2/21 §2C.3 | the ONE number shared by fill brightness + spark weight |
| `isAE` (per branch + per spark) | baked layout data (first A/E rule) | clamps to `gw_divineFire`, never cools (cohesion §1.4) |

### 4.8 How it hooks the shared master temperature system

The emitter **never invents heat or position**. Its origin is `U.uPourFront` — the *same* arc scalar the
channel fill (phase2/20), the four-fork split (phase2/21), and the camera DOF focus (cohesion §6) read, so the
sparks spawn exactly where the metal fills and the lens focuses (rule #8). Its color is the spawned `temp` fed
into phase2/09's `gw_forge(temp)` — the *same* ramp the slab veins and the channel floor use, so a spark and
the vein it lifted off are visibly one metal (cohesion §1.1). Its per-branch weight is the *same* baked `flux`
that dims each child's fill (phase2/21), so the brightest fill is the densest spark stream. A head feeding the
first A/E run clamps to `gw_divineFire` (cohesion §1.4), carried *through the fork*. And a strike
(`forge.strikeAt`) that surges `U.uHeat` brightens every head's emission in the **same frame** the slab veins
flare and the fill front jumps (cohesion §7 rule 6) — the synchrony proof.

---

## 5. COHESION (shared palette / lighting / uniforms with the world)

- **One curve, consumed three ways made literal (rule #8).** The baked knot is the single source of truth: the
  channel SDF carve reads its segments (phase2/20), the fill reads its arc windows (phase2/21), and **this
  emitter reads its arc→(pos,tangent) LUT**. The spark heads cannot drift from the fill because they sample
  the *same* `startArc`/`flux`/`totalArc` numbers. The fork is "a place where four windows share an arc
  value" — for the fill *and* for the sparks.
- **One temperature authority (§1).** Spark color is `gw_forge(temp)` (phase2/09's material) with the seed
  `temp` from the head; A/E heads clamp to `gw_divineFire`. No private orange anywhere in the emitter — the
  cooled spark behind the front stays ≤1 and true-black on OLED.
- **One noise basis (§2).** The emitter adds *no* noise; the swirl is phase2/09's `gw_curl3` on the shared
  `gw_snoise3` at the shared `GW_FBM_OCTAVES`. The air's swirl is the same grain as the metal's flow.
- **One palette, HDR convention intact (§3).** Only the white-hot spark core (>1) blooms; the existing
  `mipmapBlur` bloom catches exactly the hot heads and nothing else — the palette *is* the bloom selector. The
  four-head split does not introduce a new accent color.
- **One light model (§5).** Sparks are self-lit additive — they ARE light in a void lit only by metal. The A/E
  heads feed the *same* `uAEFire` proximity signal the basalt/Ogham reveal reads (cohesion §5.2): a spark
  shed from an ignited letter's run helps light the carved lore.
- **One clock, one rAF, dt-damped (§7 rule 6).** The emitter runs in the *existing* single `useFrame`; the
  front advances at **constant velocity** (now literally true — arc-length sampling), scroll *flares* it via
  `U.uHeat`, the stone never moves (Neo-Gaelic Brutalist: only the metal flows).
- **The keystone, carried through the fork (§1.4).** If a child feeds the first `A`/`E`, its head's `isAE`
  routes every spark it sheds to `gw_divineFire` — white-gold, eternal — *carried through* the split, never
  stamped on after. Same first-A/first-E rule as the DOM `.forge-letter`, the 3D wordmark, the fill, the
  basalt reveal, the Ogham.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The world is fill-rate bound, not triangle bound (cohesion §10). The emitter's cost is **(a) the per-frame
multi-head sample** and **(b) the per-spawn inverse-CDF draw** — both trivial — on top of phase2/09's already-
budgeted CPU advection + additive overdraw. The emitter adds **no** draw calls, **no** render targets, **no**
geometry, **no** new particles.

- **Per-frame sampling cost.** `activeHeads` is ≤6 window tests + ≤4 LUT lerps (each ~12 ALU) = **~100 cheap
  ops/frame total**, not per-particle — negligible. The per-spawn `pickHeadByWeight` is a ≤4-entry cumulative
  walk, run only on the handful of particles respawning each frame. Total emitter overhead **well under 0.05
  ms** of JS. This is *why* it ships to the judge on the CPU `Points` path: the multi-head geometry is free at
  ≤4 heads; GPGPU/compute would add float-RT memory and the ping-pong race for zero gain at this scale
  (phase2/09 §3, phase1/15 §3 reach the same verdict).
- **Bake cost.** The 256-entry per-branch (pos,tangent) LUTs are baked once in `scripts/bakeKnot.mjs` — a few
  KB of `Float32Array`, committed. Zero runtime curve math.
- **Overdraw is the watch-item (inherited from phase2/09).** Additive `depthWrite:false` sparks cost *covered
  pixels*, not count. The inverse-CDF weighting keeps the **fixed** 320 budget — splitting across four heads
  does **not** multiply the count, it *distributes* it, so the fork never carpets the screen.
- **The three tiers (uniform degrade, cohesion §7 rule 9):**
  - **`high`** — 320 sparks, **4 heads**, baked-flux + live-temp weight (2C.1+2C.2), tangent wake, A/E divine
    heads, `SUBSTEPS 6`. The cinematic split.
  - **`low`** — 200 sparks, **2 heads** (the two hottest active branches by flux) or **1 fat head** at the
    mean position with wider jitter (§2B.3), baked-flux only, `SUBSTEPS 4`. Still reads as "sparks track the
    pour," softer on the split.
  - **`static`** (reduced-motion / weak GPU) — `frameloop='demand'`, advection skipped, **1 head** fixed at a
    **mid-pour pose where the front has just split across the fork** (the most legible frame — four hot
    children diverging from one source), frozen `<Sparkles>` over it. A dignified "the pour divides" still.
- **dt clamp non-negotiable.** `Math.min(dt, 1/30)` (phase2/09) — unclamped tab-restore `dt` overshoots the
  front and the heads jump. The arc front itself is dt-damped in `<ForgeDriver/>`, so the heads slew smoothly.
- **INP / first paint.** Alloc-free emitter (all scratch hoisted, the `_heads` pool pre-built); no `new` in
  the loop. `renderer.compileAsync` the spark material before first interaction (phase2/09).
- **WebGPU upside (future, not Phase 2).** The baked LUT becomes a `texture()` read inside a `.compute()`
  spawn kernel (Heckel 2025; Matrix Sentinels TSL trails 2025; galaxy-compute tutorials); `activeHeads` and
  `pickHeadByWeight` become `Fn()` nodes; the per-branch window test is a node comparison. Authored
  TSL-portable, but ship WebGL2/GLSL+JS to the judge (CI/`qa-route`/SwiftShader assume WebGL).

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls (each specific to the moving multi-head emitter):**

1. **Sampling by raw `t`/`getPoint`, not arc length (the headline trap).** `getPoint(t)` walks the *parameter*,
   not the *arc* — the head accelerates on straights and crawls on bends, the exact "reads as fake" tell. Bake
   with **`getPointAt`/`getTangentAt`** (by arc length) and advance `u` linearly. This is Demand A; it is the
   whole reason the emitter samples a baked arc-even LUT, not the curve directly.
2. **`getSpacedPoints`/arc-length precision on `CatmullRomCurve3` (issue #10432).** Raise
   `arcLengthDivisions ≥ 1000` *before* baking, or own the cumulative-length LUT (phase2/20 §4.2). Uneven LUT
   spacing skews where the heads sit and when they split.
3. **The four heads light at different times (split-timing skew).** If the children's `startArc` aren't
   *exactly* `forkStartArc` (a bake rounding drift), the four heads activate at different frames and the split
   stutters. Snap all four to the one shared `forkStartArc` (phase2/21 §4.2) — the same constant the fill uses.
4. **Heads sampling the branch *middle* instead of the *front*.** Sample at `min(local, 1)` (the moving
   leading edge), not at a fixed `u` — otherwise sparks shed from the middle of each branch, behind the metal.
5. **Per-head emission inflating the count (overdraw blowup).** Four independent emitters each throwing 320
   = 1280 sparks = 4× overdraw on the fork. Use the **inverse-CDF draw over a fixed budget** (§4.5): one pool,
   distributed by weight. The fork gets *denser per branch*, not *more total*.
6. **Flux as a speed change (wrong, inherited from phase2/21 §7).** Per-branch flux must reduce
   *brightness/spawn-weight*, never *front speed* — speed stays arc-length-locked so the split/recombine
   timing never skews. The four heads advance together; they just each throw proportionally fewer/dimmer.
7. **Tangent not carried → fountain, not wake.** Without the tangent, sparks spray isotropically and lose the
   sense of *flow direction*. Bake the tangent into the LUT and bias the seed *backward* along `-tangent`.
8. **A/E flag stamped after the fork (keystone break).** The `isAE` must be **carried through** — baked on the
   branch and copied to every spark it sheds, routing to `gw_divineFire` and never cooling. A post-hoc string
   match in a shader is the fragile anti-pattern (cohesion §1.4, §7 rule 5).
9. **Allocating in the spawn (INP spike).** `new THREE.Vector3()` per spawn is GC churn. Hoist `_heads`, `_p`,
   `_t` (cohesion §10).
10. **Forgetting the single-head degrade on `low`/`static`.** Four heads on a thermally-throttled device is
    wasted precision; collapse to 1–2 fat heads (§2B.3) — uniform degrade, not a broken fallback.

**Order of operations (each step verifiable via `qa-route`; 0 console errors = GLSL compiled under
SwiftShader; the *device read* is the final truth):**

1. **Extend the bake.** Add the 256-entry per-branch (pos,tangent) LUT + `{startArc,len,flux,isAE}` to
   `bakeKnot.mjs` (it already owns the centripetal CR + arc-LUT). Dump to JSON; plot the LUT points as a
   `<Line>` and confirm even spacing on straights **and** bends (Demand A proof).
2. **Stand up `activeHeads` with a debug overlay.** Render a small sphere at each active head; scrub
   `uPourFront` 0→1 and confirm: 1 head on the source, **4 heads the instant it crosses `forkStartArc`**, 1
   head after the sink. Toggle to confirm the heads ride the *front* of each branch, not the middle.
3. **Confirm the tangent.** Draw a short line along each head's tangent; confirm it points down-flow.
4. **Wire the spawn hand-off** (§4.4): respawn picks a head and seeds at its lip with the backward tangent
   bias. Confirm sparks are born *at* the front of each branch, shedding behind it (wake).
5. **Add inverse-CDF weighting** (§4.5): confirm the hotter branches (higher flux) get proportionally more of
   the **fixed** budget — toggle a branch's flux and watch its spark density change while the *total* holds.
6. **Stamp the A/E head.** On any child feeding the first A/E run, set `isAE`; confirm its sparks are
   white-gold and eternal (carried through the fork) while siblings cool.
7. **Wire the shared `U.uHeat`/`U.uPourFront`.** Fire `forge.strikeAt`; confirm every head's emission and the
   slab veins flare in the **same frame** (cohesion proof).
8. **Gate tiers** (4 → 2 → 1 head; the `static` mid-fork frozen pose) + dispose on unmount.
9. **Bloom last** (phase2/09): push the spark core >1, do not crank `Bloom.intensity`.
10. **Device read on the iPhone 15 OLED** — the four heads tracking the weave, the constant front speed
    through the fork, the per-branch density matching the fill brightness, the white-gold A/E carried through,
    and the true-black void do **not** simulate headless.

---

## 8. SOURCES (2025–2026)

1. **Jorge Toloza & contributors — _Building an Endless Procedural Snake with Three.js and WebGL_**, Codrops,
   **2026-02-10**. The direct reference for an emitter/geometry that *follows a moving parametric position
   along a curve*: `getPointAtLocal(u) = getPointAt(uStart + uLength·u)` (windowed arc-length sampling),
   **parallel-transport framing** for the tangent/normal, and "the CPU samples the curve and uploads the
   result as textures, and the GPU does the rest" — the bake-the-curve-to-a-table pattern this doc's LUT
   adopts. https://tympanus.net/codrops/2026/02/10/building-an-endless-procedural-snake-with-three-js-and-webgl/
2. **Codrops — _Matrix Sentinels: Building Dynamic Particle Trails with TSL_**, **2025-05-05**. The
   contemporary reference for **emitter-follows-a-moving-target with TSL**: instanced trail segments steered
   by attractor positions, `instancedArray` state, additive blending — the TSL/WebGPU port seam for the
   multi-head emitter (§2D.2). https://tympanus.net/codrops/2025/05/05/matrix-sentinels-building-dynamic-particle-trails-with-tsl/
3. **Maxime Heckel — _Field Guide to TSL and WebGPU_**, blog.maximeheckel.com, **2025-10-14**. GPGPU particle
   systems with attractors/curl/flow fields, `instancedArray` + `.compute()` replacing FBO ping-pong, and
   baked data read by compute — the post-judge port architecture for the emitter LUT read on-GPU.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
4. **Ming Jyun Hung — _False Earth: From WebGL Limits to a WebGPU-Driven World_**, Codrops, **2026-04-21**.
   WebGPU + TSL **storage buffers** to write structured/derived geometry data on the GPU and read it from any
   shader — the architecture to port the per-branch LUT + window test into a compute spawn pass.
   https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
5. **J. A. Bærentzen, J. Martínez, J. R. Frisvad, S. Lefebvre — _Improving Curl Noise_**, SIGGRAPH Asia 2025
   Conference Papers, **Dec 2025**. The 2025 authority for the divergence-free curl field the sparks ride once
   spawned (phase2/09's `gw_curl3`) — divergence-free *n*-D vector noise + the simplex-gradient dilution
   correction. The transport these emitter heads feed. https://dl.acm.org/doi/10.1145/3757377.3763980 ·
   open access https://hal.science/hal-05308063v1
6. **Rombo.tools — _Curl Noise*_**, **2026-01-01**. 2026 re-coverage of curl-noise advection: the repeated
   `p = p + v(p)·dt` integration that turns the field the spawned sparks inhabit into coherent vortices — the
   motion the multi-head emitter feeds into. https://www.rombo.tools/2026/01/01/curl-noise/
7. **arXiv — _A Texture Lookup Approach to Bézier Curve Evaluation on the GPU_**, **2026 (arXiv:2603.15447)**.
   Stores each cubic curve in a small texture and "evaluates the curve with a single bilinear read," using
   fixed-function linear-interpolation hardware — the GPU-curve-eval technique behind 2A.4 / the post-judge
   per-head LUT texture read. https://arxiv.org/abs/2603.15447
8. **Three.js Roadmap — _Interactive Galaxy with WebGPU Compute Shaders_ & _Introduction to WebGPU Compute
   Shaders_**, threejsroadmap.com, **2025–2026**. WebGPU/TSL compute spawn of particles at parametric
   (radial/curve) positions via `instancedArray` + `.compute()`, gravity/velocity/force-field modifiers — the
   compute-spawn reference for the post-judge emitter port. https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders ·
   https://threejsroadmap.com/blog/introduction-to-webgpu-compute-shaders
9. **mrdoob/three.js — issue #10432 (`getSpacedPoints` uneven spacing) + `CatmullRomCurve3` / `Curve` docs
   (`getPointAt`, `getTangentAt`, `arcLengthDivisions`)**, referenced **2025** (forum thread "Accuracy of
   getSpacedPoints," 2025). The arc-length-sampling API the bake uses and the precision caveat that forces
   `arcLengthDivisions ≥ 1000` / owning the LUT (§7 pitfall 2).
   https://github.com/mrdoob/three.js/issues/10432 ·
   https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3 · https://discourse.threejs.org/t/accuracy-of-getspacedpoints/47626
10. **Evan Voodoo — _Creating a GPU-based Particle System_**, evanvoodoo.github.io, **2025-01-24**. A 2025
    compute-shader emitter walkthrough — `spawnInterval`/`timer`/`maxParticles` emitter struct, GPU spawn
    buffers — the per-emitter spawn-rate model echoed in the heat-gated `SEED_THRESHOLD` + per-head weighting.
    https://evanvoodoo.github.io/2025-01-24-gpu-particles/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Flux-conserving spark hand-off across the fork as one shared budget.** Formalize the inverse-CDF head
   weighting (§4.5) as a *conserved* particle flux: the parent lip's spark stream literally *divides* across
   the four children proportional to flux and *recombines* at the sink — one budget split and rejoined with
   the metal, so the spark count visibly conserves "one body divided" (overlaps phase2/21 candidate #2).
2. **Tangent-aligned anisotropic spark sprites + motion-stretch.** Use the baked head tangent to stretch each
   spark sprite along the flow direction (velocity-stretched billboards), so the wake reads as streaks down
   the channel, not round dots — and couple the stretch to `gw_curl3` velocity for coherent trails.
3. **TSL/WebGPU compute port of the multi-head emitter.** Move `activeHeads` + `pickHeadByWeight` + the LUT
   sample into a `.compute()` spawn kernel reading the baked LUT as a `texture()` (per Heckel / Matrix
   Sentinels / galaxy-compute), quantify iPhone-15 Safari-26 headroom, and prove the WebGL2 CPU fallback is
   visually identical — sharing the math 1:1 with phase2/20/21's bake ports.
4. **Emitter ↔ heat-haze ↔ A/E radiance coupling at the front.** Tie the active heads' positions to *both* the
   screen-space heat-haze concentration (cohesion §5.4) and the `uAEFire` divine-radiance signal (cohesion
   §5.2), so the air shimmers densest, the Ogham lights brightest, and the sparks throng — all at the *same*
   moving front, three effects sharing one emitter geometry (extends phase2/09 candidate #3).
