# 40 — UBO / `THREE.UniformsGroup` for the Master Uniform Pool

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 40_
_Cluster: G-architecture-perf · Focus: Promote the Master Forge Uniform pool `U` to a `THREE.UniformsGroup`
(one UBO on `WebGLRenderer`) so all chamber programs read temperature/heat from a SINGLE GPU buffer instead
of per-material uniform uploads — and MEASURE whether that reduces per-frame uniform churn at 8+ materials
on iPhone 15._

> Read `00-COHESION-MAP.md` §1.5 / §4.2 and Phase-2 deep-dive **39** (the shared-`IUniform`-reference pool)
> first. Doc 39 establishes the *logical* cohesion mechanism: one module-level pool `U` of `{ value }`
> objects, bound into every material by reference via `Object.assign(shader.uniforms, U)`, authored by one
> `<ForgeDriver/>`. **This doc asks a narrower, lower-level question:** should that pool's *transport to the
> GPU* be a single Uniform Buffer Object (`UniformsGroup`) instead of N separate per-material uniform
> uploads? It is the GPU-buffer sibling of doc 39's CPU-side reference sharing. The headline finding, settled
> below against r17x source and 2025–2026 maintainer guidance, is that **for GAELWORX the UBO promotion is a
> trap on the renderer we ship** — and the doc exists to prove *why* with measurements, and to specify the
> one place a UBO is actually worth it (the WebGPU port).

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten forge on **one** `WebGLRenderer` (`src/scene/ForgeCanvas.jsx`, `three@0.169`,
`@react-three/fiber@8`), route-swapped into eight-plus chambers. Doc 39 already names the cohesion mechanism:
a single pool `U` of shared `IUniform` references — `uTemp`, `uHeat`, `uTime`, `uPourFront`, `uAEFire*`,
the per-route look uniforms — bound into every hot material and authored by one writer. As the world grows
to its full chamber set, the number of materials that bind `U` climbs: the obsidian slab, the faceted jewel,
the molten pour surface, the per-letter wordmark fill, the basalt, the forged iron, the Ogham relief, the
caustic receiver, the channel metal — **well past 8 hot programs**, each re-reading the same temperature
scalars every frame.

That growth is precisely what invites the UBO question. With the doc-39 pattern, each of those programs holds
its *own* `uTemp` / `uHeat` / `uTime` uniform *location*, and three's `WebGLRenderer` re-uploads every active
uniform of a material when that material is drawn (`refreshUniformsCommon` → `gl.uniform*`). Sharing the
*JavaScript reference* means there is one *source value*, but there are still N *GPU uploads* of that value
per frame — one `gl.uniform1f` per material per frame for `uTemp`, again for `uHeat`, again for `uTime`, and
so on. A Uniform Buffer Object collapses that: the shared temperature/heat block lives in **one GPU buffer**,
written **once per frame** with `bufferSubData`, and every program reads it through a uniform *block binding*
— zero per-material re-upload of the shared scalars. On paper, that is the literal hardware embodiment of
"all chambers read from a single GPU buffer." This deep-dive measures whether that paper win survives contact
with three's WebGL2 UBO implementation, the `onBeforeCompile` reality of GAELWORX's materials, and the
iPhone-15 budget. The answer reshapes how `U` is built — and it is **not** the obvious "yes."

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are four ways to get a shared per-frame value (temperature/heat) into N programs on the web today. They
differ on whether the share is CPU-side (one reference, N uploads) or GPU-side (one buffer, zero re-uploads),
and on which renderer/material they're even *legal* on.

### 2.1 `THREE.UniformsGroup` (a real WebGL2 UBO) — the topic, but BLOCKED for our materials

`UniformsGroup` is three's first-class UBO abstraction: `const g = new THREE.UniformsGroup();
g.setName('ForgeData'); g.add(new THREE.Uniform(0.0)); material.uniformsGroups = [g];`. The renderer packs
the group into a `WebGLUniformsGroup`, allocates one GL buffer, binds it to a binding point with
`bindBufferBase`, links each program's matching `uniform ForgeData { ... }` block, and updates the buffer
with `bufferSubData` when values change (`setUsage(THREE.DynamicDrawUsage)` for per-frame writes; default is
`StaticDrawUsage`). The official `webgl_ubo` example shares **one** `cameraUniformsGroup` and one
`lightingUniformsGroup` across many meshes' `material.uniformsGroups = [cameraUniformsGroup,
lightingUniformsGroup]` — exactly the "store once, read everywhere" pattern the docs advertise for camera and
lighting, and that we'd want for temperature ([three.js `webgl_ubo` example source, r169](https://github.com/mrdoob/three.js/blob/r169/examples/webgl_ubo.html); [UniformsGroup docs](https://threejs.org/docs/pages/UniformsGroup.html), current 2025–26).

**The disqualifying constraint, confirmed by the maintainer in 2025:** `UniformsGroup` works *only* with
`ShaderMaterial` / `RawShaderMaterial` on `WebGLRenderer`, and **not** with `onBeforeCompile`-patched
built-in materials. In three.js issue **#31086 (May 12 2025)**, a developer tried exactly our pattern —
`material.onBeforeCompile = (shader) => { shader.uniformsGroups = [globalUniforms]; ... }` — and it threw.
Mugen87's reply is unambiguous: _"UBO support only exists for `ShaderMaterial` and `RawShaderMaterial` in
`WebGLRenderer`. We have fully integrated UBOs into `WebGPURenderer` but encountered a performance issue when
updating uniform values, see #30560. We would hit the same problem in `WebGLRenderer` so we must find a
solution first before thinking about deeper integration"_ — and, critically: _"there are currently no plans to
further enhance the feature set of `onBeforeCompile()` … If you are planning to extend built-in materials,
think about switching to `WebGPURenderer` and TSL"_ ([three.js #31086, May 2025](https://github.com/mrdoob/three.js/issues/31086)). GAELWORX's slab, jewel,
basalt, and pour are **`MeshPhysicalMaterial` derivatives with chunk injection** — the one material class
`UniformsGroup` explicitly does not serve. So the topic's literal ask (promote `U` to a `UniformsGroup`)
**cannot be done for the materials we actually ship** without rewriting every hot material as a hand-assembled
`ShaderMaterial` (forfeiting three's PBR lighting, env maps, transmission, and tone-mapping chunks). That is
the central finding.

### 2.2 Shared `IUniform` references (doc 39's `Object.assign(U)`) — RECOMMENDED, already in flight

The pattern doc 39 specifies and the cohesion map mandates: one pool of `{ value }` objects, bound by
reference into every material's `shader.uniforms`. One JS source of truth; N GPU uploads per frame, but each
upload is a single `gl.uniform1f`/`gl.uniform3f` of a scalar/vec3 — among the *cheapest* GL calls there are.
It is `MeshPhysicalMaterial`-compatible (it's literally how built-in materials take any uniform), WebGL2-
native, ships to the judge, and is the documented workaround in the very issue that blocks UBOs: the same
developer in #31086 concludes _"i can always do a workaround binding single uniforms on the material but using
the same object from the UBO i've created, like `shader.uniforms.uTime = globalUniforms.time`"_ — i.e. fall
back to shared references ([#31086, May 2025](https://github.com/mrdoob/three.js/issues/31086)). This is the
mechanism doc 39 builds; this doc's job is to confirm it is also the *performance* answer, not just the
compatibility answer (§6).

### 2.3 A hand-rolled raw UBO via `WebGLRenderingContext` (bypass three) — REJECTED, fragile

One *could* allocate a UBO directly: `gl.createBuffer()`, `gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buf)`,
`gl.bufferSubData(...)` each frame, and inject `layout(std140) uniform ForgeData { ... };` into each material
via `onBeforeCompile`, then `gl.uniformBlockBinding(program, blockIndex, 0)` per program. This *can* be made
to work alongside built-in materials (you own the buffer; three never sees it). But it means: reaching into
`renderer.getContext()`, hooking every program's link to call `uniformBlockBinding`, hand-authoring `std140`
offsets (the alignment minefield of §6.2), and re-binding on every context/program rebuild three triggers
(tier switch, material recompile). It re-implements, badly, the thing three deliberately gates to
`ShaderMaterial`. The 2025 maintainer guidance — "onBeforeCompile is fragile; no plans to extend it" —
applies double here. **Rejected**: enormous surface area, judge-device risk, zero cohesion gain over §2.2.

### 2.4 TSL `uniform()` shared node on `WebGPURenderer` (automatic UBO) — the PORTABLE target

On the WebGPU path, UBOs stop being opt-in: **every** uniform is packed into a buffer automatically, and a
shared TSL `uniform()` node is the native "one buffer, many materials" mechanism — `const uTemp =
uniform(0); materialA.emissiveNode = gw_forge(uTemp); materialB.colorNode = ...` updates all consumers from
one `uTemp.value = x`, written once per frame in a single `.onFrameUpdate(fn)` ([three.js TSL docs / Shading
Language wiki, 2025–26](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language); [Maxime Heckel,
*Field Guide to TSL and WebGPU*, Oct 14 2025](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)).
This is where the "single GPU buffer for temperature" idea is *real, free, and idiomatic* — but it is the
post-judge renderer (doc 30: WebGL2 ships; WebGPU is gated). **Crucially, three's WebGPU UBO system has a
documented per-frame *update* cost** (§2.5) — so even on the portable target the win is not unconditional.

### 2.5 The decisive 2025 data point: UBO *updates* can be SLOWER (issue #30560)

The topic asks to *measure* whether a single UBO reduces per-frame uniform churn. three's own maintainers
measured the analogous thing on `WebGPURenderer` (which is all-UBO) and found a **4× regression** versus
`WebGLRenderer`'s classic per-uniform uploads on a churn-heavy scene: _"20,000 non-instanced basic cube
meshes: WebGLRenderer ~60 FPS on M1 Pro; WebGPURenderer ~15 FPS (4× slower)"_, because _"every object has its
own UBO … each frame all UBOs must be bound and updated … The WebGL backend spends most time for the
`bindBufferBase()`, `bindBuffer()` and `bufferData()` calls"_ ([three.js #30560, Feb 19 2025, open](https://github.com/mrdoob/three.js/issues/30560)).
The lesson is exact and transferable: **a UBO is cheap to *bind-and-read* but not free to *update*** —
`bindBufferBase` + `bufferData`/`bufferSubData` per frame is a real cost that, for *frequently-mutated*
uniforms, can exceed the cost of a few `gl.uniform1f` calls it replaces. Our temperature block mutates *every
frame* (it's scroll-driven). The same thread surfaces the std140 sizing ceiling we must respect:
_"a typical 16KB max block size and each mat4 taking 64 bytes in std140 limits us to about 256 meshes"_
([RenaudRohlinger, #30560, Feb 20 2025](https://github.com/mrdoob/three.js/issues/30560)) — irrelevant to a
single tiny ForgeData block, but the alignment math behind it (§6.2) is exactly what bites a hand-rolled UBO.

### 2.6 Tradeoff table

| Approach | Works with our `MeshPhysical`+`onBeforeCompile` materials? | Per-frame cost of the *shared* signal | Mobile/iOS safety | Cohesion | Verdict |
|---|---|---|---|---|---|
| **`UniformsGroup` UBO (§2.1)** | **No** — `ShaderMaterial`/`Raw` only ([#31086](https://github.com/mrdoob/three.js/issues/31086)) | 1 `bufferSubData` + 1 `bindBufferBase`/program | n/a (blocked) | high *if it worked* | **Blocked** |
| **Shared `IUniform` refs (§2.2, doc 39)** | **Yes** | N× `gl.uniform1f` (cheap scalar uploads) | **Highest** — trodden path | maximal | **Ship this** |
| **Hand-rolled raw UBO (§2.3)** | Yes, fragilely | 1 `bufferSubData` + manual block binding | Low (judge risk) | high | Rejected |
| **TSL `uniform()` shared node (§2.4)** | n/a (WebGPU, post-judge) | 1 buffer write/frame, but see #30560 update cost | Medium (gated) | maximal | **Author toward, don't ship** |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Do NOT promote `U` to a `THREE.UniformsGroup` on the shipped WebGL2 build. Keep the doc-39 shared-`IUniform`
pool (`Object.assign(shader.uniforms, U)`), because (a) `UniformsGroup` is structurally incompatible with the
`MeshPhysicalMaterial`+`onBeforeCompile` materials GAELWORX ships, and (b) even where a UBO *is* legal, the
per-frame *update* cost of a UBO can equal or exceed the trivial scalar uploads it replaces for our tiny,
every-frame-mutated temperature block. Instead, treat "the master signal lives in one GPU buffer" as the
WebGPU/TSL `uniform()`-node design target (doc 30), and shape `U` so each member maps 1:1 to a future
`uniform()` node — where the UBO is automatic and idiomatic. On the WebGL2 build, win the *real* churn fight
with the levers that actually move it on a fill-rate-bound mobile scene: program reuse, minimizing the count
of distinct hot programs, and keeping per-frame uniform writes to scalars on a single shared reference.**

Justification:

- **The topic's literal ask is blocked by three's own design.** `UniformsGroup` + built-in material +
  `onBeforeCompile` throws ([#31086, May 2025](https://github.com/mrdoob/three.js/issues/31086)). To use it we
  would rewrite the slab/jewel/basalt/pour as raw `ShaderMaterial`s, forfeiting PBR/env/transmission/tone-map
  chunks and *adding* enormous surface area — a net cohesion and perf *loss*.
- **The measured evidence says UBO updates aren't a free win.** three's maintainers found UBO-everything
  (WebGPU) can be **4× slower** than per-uniform uploads on churn-heavy scenes because of `bindBufferBase`/
  `bufferData` overhead ([#30560, Feb 2025](https://github.com/mrdoob/three.js/issues/30560)). Our temperature
  block is *small and mutated every frame* — the exact profile where the buffer-update path has no advantage
  and the binding path has overhead.
- **Our bottleneck isn't uniform churn anyway.** The §10 budget (cohesion map) is blunt: GAELWORX is
  *fill-rate-bound* — near-full-screen emissive fbm + bloom — with a *tiny* draw/material count and **<20 draw
  calls**. Uniform uploads are a rounding error next to per-pixel fbm. UBOs optimize a cost we don't have
  while risking the path we do (the slab fbm fragment).
- **Where it's real (WebGPU), it's already what doc 30/39 author toward.** A shared `uniform()` node *is* a
  shared UBO entry, for free, on the renderer we port to. We get the "single GPU buffer" architecture by
  shaping `U` for TSL — not by fighting `WebGLRenderer`.
- **`/` stays byte-identical and the spine ships on the trusted path.** Keeping shared references means the
  doc-39 refactor is the whole job; no material rewrite, no raw-GL buffer plumbing on the judge device.

The one-line contract: **the master temperature pool is one *reference* on WebGL2 and one *UBO entry* on
WebGPU — never a hand-fought `UniformsGroup` shoehorned into built-in materials.**

---

## 4. IMPLEMENTATION

This section covers three things: the WebGL2 ship path (shared refs, with a *measured comparison hook* so the
UBO question is answered empirically, not just asserted), the exact `UniformsGroup` API for the controlled
A/B harness, and the TSL UBO target the pool is shaped toward.

### 4.1 Libs / versions

- **Ship (judged):** `three@0.169`, `@react-three/fiber@8.17`, `@react-three/drei@9`,
  `@react-three/postprocessing@2`. No new dependency. The pool is the doc-39 `forgeUniforms.js`.
- **A/B harness only (dev, not shipped):** vanilla three `UniformsGroup` + a pair of `RawShaderMaterial`
  test quads — to *measure* the claim. Lives under `?debug`, never on the render path of a real chamber.
- **Port target (post-judge, gated):** `three/webgpu` + `three/tsl` `uniform()` — automatic UBO.

### 4.2 The shipped pool: shared references, shaped for a 1:1 UBO/node map

`U` is exactly the doc-39 pool, with member *order and types chosen so a future UBO/TSL block can pack them in
std140 order without re-grouping* (vectors before scalars, scalars batched — §6.2). This is the only UBO
concession on the WebGL2 build: **lay the pool out as if it were a buffer, even though it ships as references.**

```js
// src/scene/forgeUniforms.js — shipped as shared IUniform refs; ordered for std140/TSL packing.
import * as THREE from 'three'

// ORDER MATTERS for the eventual UBO/TSL port: 16-byte-aligned vectors first (each on a 16B
// boundary), then scalars packed 4-per-16B. This costs nothing as references, and makes the
// std140 ForgeData block (or the TSL uniform() group) a 1:1 transcription — no reshuffle later.
export const U = {
  // --- vec3 lane (each std140-aligned to 16 bytes) -------------------------
  uPourFront: { value: new THREE.Vector3() }, // moving pour-front world pos
  uAEFire:    { value: new THREE.Vector3() }, // nearest divine-fire world pos
  // --- vec2 lane (NOTE the std140 vec2 footgun, §6.2) ----------------------
  uPointer:   { value: new THREE.Vector2(0.5, 0.5) },
  // --- scalar lane (pack 4 floats per 16B in a real UBO) -------------------
  uTime:      { value: 0 },   // clock seconds (frozen to 2 on 'static')
  uTemp:      { value: 0 },   // 0..1 master TEMPERATURE (scroll forge heat)
  uHeat:      { value: 0 },   // 0..1 transient HEAT pulse (strike + vel)
  uScroll:    { value: 0 },   // 0..1 damped scroll progress
  uPourArc:   { value: 0 },   // pour-front arc coord 0..1
  uAEFirePow: { value: 0 },   // divine-fire intensity
  uPointerOn: { value: 0 },
  uVeinScale: { value: 1.8 },
  uVeinGlow:  { value: 0.6 },
  uIrid:      { value: 1.35 },
}
export const U_KEYS = Object.keys(U) // a TSL/UBO port iterates this to build matching entries
```

Binding is the doc-39 two-liner in every hot material's `onBeforeCompile`:

```js
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, U)          // shared references — the cheap, compatible share
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FORGE_UNIFORM_DECLS}\n${GW_FORGE}`)
    .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
}
m.customProgramCacheKey = () => `forge:${GW_FBM_OCTAVES}:${transmissive ? 1 : 0}`
```

### 4.3 The measurement harness (answer the topic empirically)

The topic demands a *measurement* of UBO vs per-material uploads at 8+ materials. Because `UniformsGroup` is
illegal on our real materials, the honest A/B is on a **controlled pair of `RawShaderMaterial` quads** that
do nothing but read the shared block — isolating *uniform transport cost* from fill-rate. Run under `?debug`,
off the chamber render path:

```js
// dev harness: 8+ full-screen-ish RawShaderMaterial quads, identical except transport.
// Arm A: shared IUniform refs (Object.assign) — N× gl.uniform1f per frame.
// Arm B: one UniformsGroup bound to all N — 1× bufferSubData + N× bindBufferBase per frame.
import * as THREE from 'three'

// Arm B — the real UBO, exactly as the official webgl_ubo example builds it:
const forgeUBO = new THREE.UniformsGroup()
forgeUBO.setName('ForgeData')                              // matches `uniform ForgeData { ... }`
forgeUBO.add(new THREE.Uniform(0.0))                       // uTemp   (order = std140 layout!)
forgeUBO.add(new THREE.Uniform(0.0))                       // uHeat
forgeUBO.add(new THREE.Uniform(0.0))                       // uTime
forgeUBO.setUsage(THREE.DynamicDrawUsage)                  // per-frame writes (default is Static)
for (const mat of armB_materials) mat.uniformsGroups = [forgeUBO]   // ONE buffer, all programs

// GLSL block in each Arm-B RawShaderMaterial (std140, names match the group):
// layout(std140) uniform ForgeData { float uTemp; float uHeat; float uTime; };

// per frame:
//   Arm A:  U.uTemp.value = t  (renderer uploads it N times, once per material draw)
//   Arm B:  forgeUBO.uniforms[0].value = t  (renderer writes the buffer once, all read it)
```

Measure on iPhone 15 Safari with the WebGL profiler counters that #30560 itself used: time in
`bindBufferBase` / `bufferData` (Arm B) vs `uniform1f` (Arm A), plus wall-clock `useFrame` ms and steady
fps. **Expected result, per #30560's transferable finding:** at the tiny block size and every-frame mutation
GAELWORX has, Arm B shows *no fps win* and likely a small *loss* from binding overhead; the value of the
harness is to *prove* that for the judge device rather than assume it, and to document the crossover (if any
material count ever made Arm B win, it would be far beyond our ~12 hot programs). This harness is deep-dive
candidate 9.1 made concrete.

### 4.4 The TSL UBO target (post-judge, where the buffer is real and free)

When the gated WebGPU port lands, the *same* `U` becomes a `uniform()`-node group — the single GPU buffer the
topic envisions, with no `UniformsGroup`/`onBeforeCompile` conflict because TSL has no chunk strings:

```js
// src/scene/forgeUniformsTSL.js (staged for the WebGPU port — NOT shipped to the judge)
import { uniform } from 'three/tsl'
export const Utsl = {
  uPourFront: uniform(new THREE.Vector3()), uAEFire: uniform(new THREE.Vector3()),
  uPointer: uniform(new THREE.Vector2(0.5, 0.5)),
  uTime: uniform(0), uTemp: uniform(0), uHeat: uniform(0), uScroll: uniform(0),
  uPourArc: uniform(0), uAEFirePow: uniform(0), uPointerOn: uniform(0),
  uVeinScale: uniform(1.8), uVeinGlow: uniform(0.6), uIrid: uniform(1.35),
}
// material.emissiveNode = gw_forge(Utsl.uTemp);  // every material reads the SAME buffer entry
// renderer-native single writer:
//   Utsl.uTemp.onFrameUpdate(() => Math.min(forge.scrollDamped + vel*0.25, 1))
```

Here the renderer packs `Utsl` into a UBO automatically; updating `Utsl.uTemp.value` once propagates to all
materials through one buffer — the architecture this topic describes, delivered by the renderer instead of
fought into one. (Mind #30560: keep the group small and the writer single so the WebGPU update path stays
cheap.)

### 4.5 Key params

| Knob | Value | Why |
|---|---|---|
| Transport (ship) | shared `IUniform` refs | `MeshPhysical`-compatible; cheapest legal share |
| Transport (port) | TSL `uniform()` node group | automatic UBO; one buffer, all materials |
| `UniformsGroup` usage | `DynamicDrawUsage` | per-frame mutation (default `StaticDrawUsage` is wrong for `uTemp`) |
| Block name | `ForgeData` | must match the GLSL `uniform ForgeData {}` block exactly |
| Pool member order | vec3 → vec2 → scalars | std140-friendly, zero cost as refs, 1:1 to UBO/TSL |
| `customProgramCacheKey` | `forge:${OCTAVES}:${transmissive}` | look-affecting `#define`s, not uniforms, gate program reuse |

---

## 5. COHESION — how it binds the rest of the world

This deep-dive does not change *what* the world shares — it confirms *how* the share crosses to the GPU
without breaking the cohesion contract of `00-COHESION-MAP.md` §7.

- **One temperature, never invented (§7.1).** Whether transported as a shared reference (ship) or a UBO entry
  (port), there is exactly one `uTemp`/`uHeat` source feeding `gw_forge(uTemp)` in the slab veins, jewel fire,
  channel metal, cooling letters, basalt heat-stain, caustic tint, god-ray color, and heat-haze mask. The UBO
  question is about *plumbing*, and the verdict (keep references) preserves the doc-39 guarantee that
  `U.uTemp.value = x` is the whole-world write.
- **One clock, one writer, dt-damped (§7.6).** `<ForgeDriver/>` remains the sole author. A UBO would not add
  a second writer — but it *would* add a per-frame `bufferSubData` the reference path doesn't need, with no
  cohesion benefit. Rejecting it keeps the single-writer model lean.
- **The divine-fire keystone stays separated (§1.4/§7.5).** `uAEFire`/`uAEFirePow` ride the same pool as
  spatial members; the A/E never read `uTemp`. Laying them in the vec3 lane of the pool (std140 order) keeps
  that separation structural and port-ready — the A/E radiance is a different buffer entry, never the
  temperature one.
- **Per-route variation is damping the same pool (§9).** `uVeinScale`/`uVeinGlow`/`uIrid` damp toward
  `sceneFor(route)` in the scalar lane. No chamber forks a private buffer, a private orange, or a private
  clock — the UBO temptation ("give the jewel its own group") is exactly the bolt-on the map forbids.
- **Palette + noise stay shared (§7.2/§7.3).** The pool carries *signals*; colors come from `PAL` via `v3()`,
  noise from the `gw_*` toolkit. UBO-or-not changes none of that.

The cohesion image is unchanged from doc 39: scroll into a chamber and slab, jewel, channels, letters, and
Ogham heat together from one float. This doc's contribution is the proof that the *cheapest correct transport*
of that float on the judge device is a shared reference, and the *idiomatic* transport on the port is a UBO
entry — same float, two correct deliveries, never a fought one.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

### 6.1 Why the UBO promotion does not pay rent on this scene

The §10 budget is explicit: iPhone 15, OLED, DPR-capped 1.5, ~9–10 ms steady-state target, and **"pixels are
the enemy, not triangles … the cost is fill-rate (near-full-screen emissive fbm shaders + post) and overdraw
… not geometry."** Uniform *transport* is nowhere on that list. Concretely, at our full chamber set (~12 hot
programs) the shared-reference path uploads on the order of *a few dozen* `gl.uniform1f`/`uniform3f` calls per
frame for the whole pool — sub-microsecond work, deep in the noise next to a single full-screen 3-octave fbm
fragment that costs **3.5–4.5 ms** alone (cohesion map §10 table). A UBO would shave the uniform-upload
rounding error *and add* a `bufferSubData` + per-program `bindBufferBase` — and, per **#30560**, that
bind/update overhead is itself measurable and can dominate when the buffer mutates every frame. **Net on
iPhone 15: the UBO promotion optimizes a non-bottleneck and risks adding cost.** The four levers that actually
move our frame (cohesion map §10) — DPR cap, bloom `resolutionScale 0.5`, `GW_FBM_OCTAVES`, particle overdraw
— are all *fill-rate*, untouched by UBOs.

### 6.2 The std140 alignment minefield (why a hand-rolled UBO is a footgun on mobile)

If anyone is tempted to hand-roll a raw UBO (§2.3), the std140 layout rules are a documented source of silent
corruption, doubly so on mobile drivers:

- **vec3 has 16-byte base alignment** — it occupies 12 bytes of data but the *next* member must start on a
  16-byte boundary, so a `float` after a `vec3` cannot tuck into the trailing 4 bytes; it jumps to the next
  16B slot ([std140 rules, LearnOpenGL / Vulkan memory layout, referenced 2025](https://learnopengl.com/Advanced-OpenGL/Advanced-GLSL); [Khronos Vulkan shader memory layout, 2025](https://docs.vulkan.org/guide/latest/shader_memory_layout.html)). Get the JS-side offset wrong and you read garbage.
- **vec2 has a real three.js binding bug history.** Issue **#28818 (2024, the canonical UBO-in-three vec2
  report)** showed a `UniformsGroup` `Vector2(11, 33)` binding as `(33, 0)` — a packing/offset mismatch —
  while `Vector3` bound correctly ([#28818](https://github.com/mrdoob/three.js/issues/28818)). Our `uPointer`
  is a vec2; on a UBO it sits in exactly the class of member that has bitten this API. The shared-reference
  path has no such hazard (three uploads vec2s correctly through `gl.uniform2f`).
- **Arrays pad every element to 16 bytes**, so a tightly packed UBO of scalars must be authored as `vec4`
  lanes — a legacy constraint that "particularly affects mobile platforms" ([std140 array padding,
  2025](https://learnopengl.com/Advanced-OpenGL/Advanced-GLSL)). Our scalar lane (`uTemp`, `uHeat`, `uTime`,
  …) would need manual 4-per-`vec4` packing in a raw UBO; `UniformsGroup` handles this, but only for
  `ShaderMaterial`, which we don't use.
- **16 KB guaranteed max block size** and **256-byte `UNIFORM_BUFFER_OFFSET_ALIGNMENT`** mean even simple
  blocks reserve a lot of empty space ([#30560 sizing note, Feb 2025](https://github.com/mrdoob/three.js/issues/30560); WebGL2 fundamentals UBO lesson). Trivial for one small ForgeData block — but the point stands: a UBO
  is *more* fragile per byte than a scalar upload, for zero fill-rate benefit here.

The pool's vec3→vec2→scalar ordering (§4.2) is the cheap insurance: if a UBO ever *is* built (the TSL port),
the layout already respects these rules, and the vec2 sits in its own lane away from the packing seam.

### 6.3 The real per-frame win that *does* fit the budget

The 2026 best-practices guidance points at the lever that matters and that the shared pool already pulls:
**program reuse.** _"Three.js reuses programs for identical shaders. If you define uniforms the same way,
programs are shared. Unnecessary variations create program proliferation"_ ([utsubo, *100 Three.js Tips That
Actually Improve Performance*, 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)). Because
every hot material injects the *same* `FORGE_UNIFORM_DECLS` + `gw_forge` helper text and binds the same `U`,
their programs are maximally similar — fewer distinct compiled programs, fewer state changes between draws.
That reduces *real* per-frame churn (program/state switches, the thing #30560 shows actually costs) far more
than collapsing a dozen cheap scalar uploads into one buffer ever could. **Keep the helper strings
byte-identical across materials; that is the churn win, not the UBO.**

### 6.4 Static / low tier

Tier behavior is unchanged: `<ForgeDriver/>` writes `U.uTime = 2`, zeroes velocity heat, damps look toward
the route preset, and the `frameloop='demand'` canvas renders one frame. No UBO, no `bufferSubData`, nothing
to bind — the still is lit and on-brand at zero per-frame transport cost. A UBO would *add* a buffer to manage
in a tier whose whole point is to manage nothing.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**

1. **Build the doc-39 shared-reference pool first** (`forgeUniforms.js`, `<ForgeDriver/>`, repoint slab +
   jewel). That is the spine; it is `MeshPhysical`-compatible and ships. Do **not** start with a UBO.
2. **Lay the pool out in std140 order anyway** (vec3 → vec2 → scalars). Zero cost now; makes the eventual TSL
   UBO a transcription, not a reshuffle.
3. **Only then, under `?debug`, run the A/B harness (§4.3)** on a pair of `RawShaderMaterial` quads to *measure*
   UBO vs per-uniform on iPhone 15. Record the numbers in this doc. Expect no win; ship the reference path.
4. **Defer the real UBO to the WebGPU/TSL port** (doc 30), where `uniform()` nodes give it for free — and even
   there, keep the group small and single-writer to dodge the #30560 update cost.

**Pitfalls, ranked:**

1. **Trying `shader.uniformsGroups = [g]` inside `onBeforeCompile`.** It throws — UBOs are `ShaderMaterial`/
   `RawShaderMaterial` only ([#31086, May 2025](https://github.com/mrdoob/three.js/issues/31086)). This is the
   #1 mistake the topic invites. The workaround *is* doc 39: share the `IUniform` reference instead.
2. **Rewriting built-in materials as raw `ShaderMaterial` to "unlock" UBOs.** You forfeit PBR lighting, env
   maps, transmission, and tone-map chunks, and inherit the std140 minefield — a massive net loss for a
   non-bottleneck. Don't.
3. **Forgetting `setUsage(DynamicDrawUsage)` on a UBO that mutates per frame.** The default is
   `StaticDrawUsage`; a per-frame `uTemp` on a static-usage buffer is a driver-stall hazard. (Harness only —
   but if you ever build one, this is the trap.)
4. **std140 vec2/vec3 offset errors.** `uPointer` (vec2) is the member with a real three bug history
   ([#28818](https://github.com/mrdoob/three.js/issues/28818)); a `float` after a `vec3` mis-offset reads
   garbage. The shared-reference path sidesteps all of this.
5. **Assuming a single UBO reduces churn without measuring.** #30560 proves UBO *updates* can be 4× *slower*
   on churn-heavy scenes; "one buffer" is not automatically faster. Measure on the device (§4.3).
6. **Mistaking the bottleneck.** Optimizing uniform transport on a fill-rate-bound void scene is effort spent
   where there is no frame to save. Spend it on DPR, bloom resolution, and octave count instead.
7. **Letting the UBO idea fork a per-chamber group.** "Give the jewel its own UBO" reintroduces the two-clock
   bolt-on doc 39 deletes. One pool, one transport, every chamber.

**The proof:** `npm run build` green → `qa-route` at 393×852 + 1440×900, **0 console errors** (SwiftShader
compiles the GLSL in CI, so an undeclared-uniform or block-name typo surfaces). Then the iPhone-15 OLED read
*and* the §4.3 harness numbers logged here, so the UBO question is closed with data, not opinion.

---

## 8. SOURCES (2025–2026)

1. three.js Issue **#31086** — *WEBGL // UBO (Uniform Buffer Object) with `onBeforeCompile` is not working*
   (opened **May 12 2025**, closed). Maintainer Mugen87: _"UBO support only exists for `ShaderMaterial` and
   `RawShaderMaterial` in `WebGLRenderer`… we encountered a performance issue when updating uniform values,
   see #30560… no plans to further enhance `onBeforeCompile()`… switch to `WebGPURenderer` and TSL."_
   Workaround = shared `IUniform` reference. https://github.com/mrdoob/three.js/issues/31086 (May 2025)
2. three.js Issue **#30560** — *WebGPURenderer: Current UBO system has severe performance issues with many
   render items* (opened **Feb 19 2025**, open). 20k cubes: WebGL ~60fps vs WebGPU(all-UBO) ~15fps; _"each
   frame all UBOs must be bound and updated… most time for `bindBufferBase()`, `bindBuffer()` and
   `bufferData()`"_; 16KB block / 64-byte-mat4 / ~256-mesh sizing note. The decisive "UBO updates aren't free"
   evidence. https://github.com/mrdoob/three.js/issues/30560 (Feb 2025)
3. three.js Issue **#28818** — *WebGLRenderer: UBO — Vec2 is not binded correctly* (2024, the canonical
   `UniformsGroup` vec2 std140 bug; cited here for the vec2 hazard our `uPointer` would hit on a UBO).
   https://github.com/mrdoob/three.js/issues/28818
4. three.js docs — *UniformsGroup* + `webgl_ubo` / `webgl_ubo_arrays` examples (r169, current 2025–26):
   `new UniformsGroup()`, `setName`, `add(new Uniform(...))`, `setUsage(DynamicDrawUsage)`,
   `material.uniformsGroups = [group]` shared across meshes; "only `ShaderMaterial`, only `WebGLRenderer`;
   ideal for camera/lighting; helps mobile uniform limits." https://threejs.org/docs/pages/UniformsGroup.html ·
   https://github.com/mrdoob/three.js/blob/r169/examples/webgl_ubo.html (2025–26)
5. Maxime Heckel — *Field Guide to TSL and WebGPU* (**Oct 14 2025**). TSL shared `uniform()` node updated once
   per frame, WebGPU's automatic uniform-buffer model, `.onFrameUpdate` single-authority — the renderer-native
   "one buffer, many materials." https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (Oct 2025)
6. utsubo — *100 Three.js Tips That Actually Improve Performance* (**2026**). Program reuse: _"Three.js reuses
   programs for identical shaders. If you define uniforms the same way, programs are shared. Unnecessary
   variations create program proliferation."_ The real per-frame churn lever for this scene.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)
7. three.js Wiki — *Three.js Shading Language (TSL)* uniform sharing (`const shared = uniform(...)` across
   materials; `.onFrameUpdate`/`.onRenderUpdate`), the TSL UBO target. https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language (current 2025–26)
8. Khronos — *Vulkan Shader Memory Layout* (std140/std430 alignment, vec3 16-byte base alignment; 2025
   reference) + LearnOpenGL *Advanced GLSL* std140 rules. The alignment minefield behind a hand-rolled UBO.
   https://docs.vulkan.org/guide/latest/shader_memory_layout.html · https://learnopengl.com/Advanced-OpenGL/Advanced-GLSL (2025)
9. three.js PR **#27388** — *CommonUniformBuffer* interface (referenced in #30560, Feb 2025) — the pooled-UBO
   direction three is exploring to fix the update-cost problem; context for why per-object UBOs don't yet pay
   off. https://github.com/mrdoob/three.js/pull/27388 (cited 2025)

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The UBO-vs-reference A/B harness on iPhone 15 (§4.3), with logged numbers.** Build the controlled pair of
   `RawShaderMaterial` quads (one shared-reference, one `UniformsGroup`), instrument `bindBufferBase`/
   `bufferData` vs `uniform1f` time and steady fps at 8 / 12 / 24 materials, find the crossover (if any), and
   close the topic with device data — confirming or refuting the #30560-transferred prediction for our scene.
2. **The TSL `uniform()`-node port of `U` as a real UBO (`forgeUniformsTSL.js`).** Build the parallel
   node-group pool + single `.onFrameUpdate` writer on `WebGPURenderer`, verify the slab/jewel read one buffer
   entry, and A/B the WebGPU UBO update path against the WebGL2 reference path for the same `/` frame —
   measuring whether #30560's update cost bites a *small* single-group pool (it shouldn't) and proving the
   re-host claim.
3. **Program-reuse audit as the real churn lever.** Instrument `renderer.info.programs` across the full chamber
   set; verify every hot material injecting identical `FORGE_UNIFORM_DECLS`+`gw_forge` collapses to the minimum
   distinct program count, and quantify the state-change reduction (the churn that #30560 shows actually
   costs) — the win the UBO was wrongly credited with.
4. **std140-ordered pool layout as forward insurance.** Formalize the vec3→vec2→scalar ordering rule for `U`
   (and every future pool member) with a tiny dev-time assertion that the JS member order matches the staged
   `ForgeData` std140 block, so a hand-rolled or TSL UBO can never silently mis-offset the vec2 `uPointer`
   (the #28818 class of bug).
