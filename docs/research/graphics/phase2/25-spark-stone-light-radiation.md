# 25 — Spark/Ember → Stone Light Radiation (cheap dynamic emit-onto-surface)

_Phase 2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · primary judge device:
iPhone 15 (OLED) · one WebGL renderer (r3f + three.js), `onBeforeCompile` GLSL injection_

> **Reads on top of:** `00-COHESION-MAP.md` (§1 master temperature, §2 shared noise, §4.2 the master
> uniform pool `U`, §5 the lighting model — "the metal is the only light", §5.1 sparks-are-cooling-metal,
> §5.2 the A/E divine radiance, §10 perf budget). Phase-2 **22 — A/E divine-fire → stone light-transport**
> (the `gw_aeLight()` falloff/grazing authority this doc *extends* to a moving emitter list), **23 — AE
> radiance: shader vs RectAreaLight vs baked** (the tier strategy this mirrors), **09 — curl-advected
> spark/smoke transport** (the emitter whose positions/temperatures this doc consumes), **10 — basalt
> green-reveal** (the receiver that already calls `gw_aeLight`). This document owns the **moving, dynamic
> half of the stone-lighting problem**: where doc 22 lights the stone from the two *static, eternal* A/E
> letterforms, this doc lights the stone from the *swarm of moving sparks* orbiting the pour — and ties the
> divine sparks born in the A/E zones into the *same* Ogham-reveal signal, so a spark thrown off the
> divine fire briefly re-illuminates the carved lore as it flies past.

---

## 1. SCOPE — this element in the GAELWORX world

In a world that is **pure void lit only by the metal itself** (`00 §5`), every bright thing is a light
source. The pour is a light. The cooling letters are lights until they go iron-black. The A and E are
*eternal* lights (doc 22). And the **living sparks** — the ~256–320 additive points that orbit the
white-hot pour front and lift off the cooling casts (`09`/`15`) — are, by the world's own logic, hundreds
of *tiny moving lights*. The brief is blunt about this: the sparks "are literally cooling metal droplets"
(`00 §5.1`), each white-gold near the front and ember-red as it drifts. If a white-hot spark sails a
hand's-width over green-black basalt and the stone does **not** brighten under it, the illusion breaks —
the spark reads as a decal floating in front of a dead wall, not as a mote of molten metal radiating heat
onto rock.

So the deliverable is the **emit-onto-surface** half of the spark system: as bright sparks pass near the
basalt, the Ogham, and the channel lips, those surfaces should pick up a small, moving, warm pool of
light *from the particles themselves* — a travelling glow that rakes the stone, catches a groove, and
fades as the spark cools or moves on. And the keystone tie-in: a spark **born in the A/E divine zones**
carries divine white-gold (not ember-orange), and as it flies it briefly **reinforces the Ogham reveal** —
divine embers re-light the lore in passing, so the sacred carving flickers legible even between the
camera's close approaches to the static A/E.

The hard constraint is what makes this a *technique* and not just "add 300 point lights." Three.js
`WebGLRenderer` caps real punctual lights at a handful (the Uniform Buffer limit is "usually within 10",
per the 2025 clustered-rendering discussion), each is per-pixel expensive, and 300 of them over a
near-full-screen basalt floor is instant death on an iPhone (`00 §10`: pixels are the enemy, fill-rate is
the budget). We need the *look* of hundreds of moving emitters with the *cost* of a handful of ALU ops —
a **cheap real-time accumulation term** that gathers only the few brightest, nearest sparks into the
receiver shader and adds their pooled radiance, reusing the exact `gw_aeLight()` falloff and grazing math
doc 22 already established for the A/E. One light model; the A/E feed it two eternal entries, the sparks
feed it a short, refreshed list of the brightest movers.

What this doc owns: (1) the **selection** — how 300 CPU-stepped sparks are reduced each frame to a tiny
fixed-length "brightest-N nearby" light list packed into the shared pool `U`; (2) the **accumulation
term** — the unrolled fixed loop in the receiver fragment shader that sums each spark's `gw_aeLight`
contribution; (3) the **divine-spark tie-in** — how a spark born at the A/E carries `isDivine` and routes
its color through `gw_divineFire`, reinforcing the Ogham; (4) the **tiers** — the `high`/`low`/`static`
fallbacks. What it does *not* own: the spark *motion* (`09`, curl advection), the spark *sprite* look
(`15`), the A/E *static* light (`22`), the basalt/Ogham *material body* (`05`/`10`/`25`/`26`). It owns
**the light the moving sparks cast onto the stone**.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The problem — "many small moving emissive points light an opaque surface near them, cheaply, on mobile" —
is the classic *many-lights* problem. The 2025-2026 landscape, scored on quality / perf / mobile /
complexity against the iPhone-15 single-renderer / WebGL2 / no-EXR envelope:

### A. Real punctual lights, one per spark (the naive baseline) — **rejected**
Spawn a `THREE.PointLight` per bright spark. _Quality:_ physically correct falloff and bounce. _Perf:_
fatal — three.js `WebGLRenderer` bakes the light count into the shader program, the Uniform Buffer caps
real lights "usually within 10" (the limit the 2025 *Clustered Rendering on WebGPU* thread cites as the
whole reason WebGPU storage buffers exist), each light is per-fragment, and changing the count recompiles.
300 moving lights is not even expressible, let alone affordable. _Mobile:_ unusable. **Rejected outright —
this is the constraint the rest of the landscape exists to dodge.**

### B. Clustered / Forward+ light culling (the "proper" many-lights answer) — **WebGPU forward path only**
Bin lights into screen tiles or 3D froxels, cull per cluster, and each fragment loops only the few lights
touching its cluster. This is *the* canonical way to scale to thousands of lights, and it had a live
2025 three.js moment: the **Clustered Rendering on WebGPU** showcase (three.js forum, **April 2025**) and
Toji's **WebGPU Clustered Forward Shading** both implement exactly this — but both stress it is a
**WebGPU** technique, "an interesting use case for WebGPU that wasn't practical with WebGL," precisely
because WebGL's Uniform Buffer can't hold the light/cluster storage that WebGPU's Storage Buffers can. The
earlier WebGL **Dr. Strangelight** cluster experiment exists but is a heroic outlier, not a mobile-safe
path. _Quality:_ excellent, scales to thousands. _Perf:_ great *at scale* — but it has fixed setup
overhead (the cull pass) that is pure loss at GAELWORX's ~300 sparks of which only a handful are near any
given fragment. _Mobile:_ WebGPU-only in practice, and the judge device ships WebGL2 (`00 §10`). _Verdict:_
**the post-judge forward path** — when the forge moves to `WebGPURenderer`, the spark light list becomes a
storage buffer and this becomes the clean way to lift the brightest-N cap. Author the WebGL term so the
port is a re-host.

### C. CPU-selected "brightest-N" dynamic light list + in-shader accumulation (**the mechanism of record**)
Keep the full ~300 sparks on the CPU (they already live there — `09` advects them in a `Float32Array`).
Each frame, in the same alloc-free loop that steps them, **select the few brightest sparks near the
receiver** (cheap partial-selection, not a full sort), pack their world position + temperature + a
divine flag into a **small fixed-length uniform array** in the shared pool `U` (e.g. 8 entries), and in
the receiver's fragment shader run an **unrolled fixed loop** that sums each entry's contribution through
the *same* `gw_aeLight()` windowed-inverse-square + grazing function doc 22 uses for the A/E. This is the
direct generalization of doc 22/23's in-shader proximity bleed from 2 static sources to N moving ones —
and the 2025-2026 references converge on it as the cheap answer below the clustered threshold: the **utsubo
2026 "100 Three.js Tips"** budget framing (fill-rate and draw-calls are the cost; "a handful of extra ALU
ops in an existing pass is invisible next to a second render pass"), the **Khronos punctual-lights**
`intensity·color·attenuation·N·L` composition over a small `LIGHT_COUNT` loop, and the **Filament**
windowed inverse-square `(1-(d/range)⁴)²/d²` for the per-spark falloff that forces a *local* pool. _Quality:_
very good — surface-correct (it can rake a groove, because it has the receiver's normal), art-directable,
and it shares the exact A/E light model so nothing drifts. _Perf:_ near-free — one extra `dot`+`mix` per
entry × 8 entries in an already-running pass, no extra draw, no light recompile (the array length is a
compile-time `#define`). _Mobile:_ runs on every tier; the only family besides screen-space that does.
_Complexity:_ medium — the per-frame selection is the craft (keep it alloc-free and partial). **This is the
pick.**

### D. Screen-space light injection / additive light buffer (the "splat then read" route)
Render the sparks (as soft additive blobs) into a **low-resolution off-screen light buffer**, blur it, and
sample it in the receiver shader as an incoming-light texture — the lineage of the **point-splatting**
screen-space idiom the 2025 Codrops WebGPU-fluids piece describes ("renders the particles ... separable
blur ... screen-space surface") and the classic real-time-glow off-screen-additive-target pattern. _Quality:_
soft, naturally accumulates *all* 300 sparks (no brightest-N cap), great for the *broad* ground-glow. _Perf:_
one extra render target + a blur pass + a fetch — the exact "second pass" the utsubo budget warns is the
expensive thing, and it scales with screen pixels, not spark count. _Mobile:_ affordable only at low
resolution and only on `high`; the extra FBO + blur eats the headroom (`00 §10`). _Critical flaw for the
keystone:_ a screen-space buffer is **view-space and 2D** — it cannot tell that *this* Ogham groove wall
faces the spark, so it can paint a screen *region* bright but **cannot rake a carved facet** (the same
limitation doc 22 §2E flags for the reveal). It would light the floor but not *reveal the carving*. _Verdict:_
**a `high`-tier garnish for the broad, soft ground-bloom from the full swarm**, layered *under* C — never
the reveal mechanism. In practice the shared `mipmapBlur` Bloom (`20`) already gives most of this for free
(the additive spark sprites bloom into a soft glow that reads as ground-light), so a dedicated buffer is
rarely worth its pass.

### E. Baked emissive-AO from a representative spark distribution — **static tier only**
Bake an average "spark-lit" warm AO/lightmap into the stone once (doc 23 mechanism D), apply as
`lightMap.channel=1`. _Quality:_ great *static* warmth. _Fatal flaw:_ sparks **move**; a bake is a frozen
average and cannot track a specific spark past a specific groove. _Verdict:_ the **`static`-tier** warm
floor only, identical to doc 23's discipline — and it must be *stripped from the runtime bundle* after
baking (`@react-three/lightmap` is a build tool, not a dependency).

### F. WebGPU/TSL compute light list (`instancedArray` + storage buffer) — **forward path**
On `WebGPURenderer`, the spark light list lives in a `StorageInstancedBufferAttribute`/`instancedArray`
the compute pass writes (Wawa Sensei's 2025 TSL-GPGPU course; the three.js storage-buffer docs), and the
receiver reads it as a node — combined with MRT selective bloom (Heckel's **Field Guide to TSL and WebGPU**,
Oct 2025) so the divine-spark spill blooms *exactly*. _Quality:_ identical look, no brightest-N cap, exact
bloom. _Mobile:_ the WebGL2-fallback branch of `WebGPURenderer` is less-tested on mobile Safari — betting
the judge device on it is the documented mistake (`00 §10`). _Verdict:_ **author C TSL-portable; this is
the re-host, not a rewrite.**

**Verdict.** The model of record is **C** — CPU-selected brightest-N moving sparks packed into the shared
`U` pool, accumulated in the receiver shader through the **same `gw_aeLight()`** the A/E use, with the
divine-spark color routed through `gw_divineFire`. **D** is an optional `high`-tier broad ground-bloom (and
largely subsumed by the existing Bloom). **E** is the `static` warm floor. **B/F** are the WebGPU forward
path. One light model, two emitter sources (eternal A/E + moving sparks), one falloff, one grazing term —
the cohesion guarantee made literal.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: a fixed-length "brightest-N spark light list" in the shared uniform pool `U`, refreshed each frame
by the single CPU spark loop via a cheap partial selection, and accumulated in the basalt / Ogham / channel
receiver shaders through an unrolled loop over the *same* `gw_aeLight()` function the A/E already drive —
with each spark's color chosen by its `isDivine` flag (`gw_divineFire` for divine sparks born at the A/E,
`gw_forge(sparkTemp)` for ordinary cooling sparks). The A/E remain entries in the *conceptually same* light
set; the sparks are the moving entries. Divine sparks add their `lit` into the Ogham-reveal accumulator so
they reinforce the carving as they pass.**

Why this, against the world and the constraints:

- **One light model, two emitter sources = the cohesion guarantee, not a coincidence.** Doc 22 established
  `gw_aeLight()` (windowed inverse-square falloff + one-bounce colored bounce + grazing) as the single
  authority for "an eternal letter lights the stone." This doc adds *moving* emitters by calling the **same
  function** in a loop. The stone lit by a passing spark and the stone lit by the A/E are *visibly the same
  light physics* because they are literally the same code — the `02`/`03` "one authority, never a parallel
  copy" lesson, applied to dynamic lights. A spark's pool and the A/E pool share falloff shape, grazing
  curve, and palette; they cannot drift.

- **Brightest-N dodges the only constraint that matters.** Real lights cap at ~10 and recompile; a *uniform
  array* of 8 `vec4`s has no such cap and never recompiles (the length is a `#define`). The CPU already
  holds all 300 sparks (`09`); reducing them to the 8 brightest-near-the-receiver is a partial selection in
  the loop that's already running — sub-millisecond, alloc-free. We get the *read* of a swarm of moving
  lights at the *cost* of 8 extra `gw_aeLight` evals per fragment, which (utsubo 2026) is invisible next to
  a single extra pass.

- **The divine-spark tie-in is the keystone, not a bolt-on.** The brief's hook — "tied to the never-cooling
  A/E zones so divine sparks reinforce the Ogham reveal" — falls out for free: a spark spawned inside the
  A/E divine zone gets `isDivine=1` and its base temp pinned at the divine top; in the shader its color is
  `gw_divineFire(flick)` (never `uTemp`, the keystone branch `00 §1.4`), and its `lit` is added into the
  **same Ogham-reveal accumulator** the static A/E feed (doc 22 §4.4). So as a divine ember sails past a
  carved verse, the groove walls it rakes briefly surface — the lore flickers legible in the wake of a
  flying spark. That is a *cinematic*, world-defining beat, and it costs nothing extra because it routes
  through the same accumulator.

- **Physically motivated, then art-directed.** The per-spark falloff is the real Filament/Khronos windowed
  inverse-square (so a spark's pool is bounded, local, and dies at a hard range — it can't dimly lift the
  whole floor), but the range and grazing weight are art knobs so the moving pools read *warm and radiant*,
  not like 8 tiny flashlights. The selection is brightness-weighted so cold drifting embers (which radiate
  almost nothing) don't waste array slots on a distant fragment.

- **Stays in the proven engine.** No new canvas, no EXR, no second render target on the mandatory path,
  no renderer swap — `onBeforeCompile` + `${GLSL_NOISE}` + `gw_aeLight` + `v3(PAL.x)`, verifiable today via
  `shader-fx` + `qa-route`. The TSL mirror (§4.8) is authored now so the WebGPU storage-buffer port is a
  re-host.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` r17x (repo line) — `MeshPhysicalMaterial`/`MeshStandardMaterial` + `onBeforeCompile` on the
  receivers (basalt/Ogham/channel). No renderer change. No new lights.
- `@react-three/fiber` ^8 / `@react-three/drei` (existing) — the `Points` system from `Embers.jsx`/`09`
  is the emitter; this doc adds a tiny selection step to its `useFrame`.
- `@react-three/postprocessing` (existing) — the shared `mipmapBlur` Bloom (`luminanceThreshold ≈ 0.55`)
  already gives the broad soft ground-glow from the additive spark sprites; no dedicated buffer on the
  mandatory path.
- Shared in-repo: `gw_aeLight`/`gw_aeFalloff`/`GLSL_NOISE` (`shaders.js`, doc 22), the temperature GLSL
  `gw_forge`/`gw_divineFire`/`gw_tempColor` (doc 01), `PAL`/`v3` (`palette.js`), the master pool `U`
  (`forgeUniforms.js`), `forge`/`damp`/`sceneFor` (`store.js`).
- **No new runtime asset.** A uniform array + a CPU selection + a shader loop.

### 4.2 The shared signal — extend the pool `U` with a fixed-length spark light list

The light list lives in the shared pool `U` so every receiver binds the *same references* and one writer
fills it. `N_SPARKLIGHTS` is a compile-time constant (8 on `high`, 4 on `low`) so the shader loop unrolls
and never branches on a dynamic length (mobile GLSL hates dynamic loops — `09`/`23`).

```js
// forgeUniforms.js — the moving-emitter half of the lighting model (refs, not clones)
// Packed as vec4 for tight upload: xyz = world pos, w = effective intensity (temp×brightness).
U.uSparkLitPos  = { value: Array.from({length: 8}, () => new THREE.Vector4()) } // brightest-N near receiver
U.uSparkLitTemp = { value: new Float32Array(8) }   // 0..1 spark temperature (→ gw_forge / gw_divineFire)
U.uSparkLitDiv  = { value: new Float32Array(8) }   // 1 = divine spark (born in A/E zone) → reinforces Ogham
U.uSparkCount   = { value: 0 }                      // how many slots are live this frame (≤ N)
```

```glsl
#define N_SPARKLIGHTS 8   // high; 4 on low (compile-time, loop unrolls — no dynamic length)
```

### 4.3 The selection — the CPU step that fills the list (the craft)

The sparks already live in a `Float32Array` and are advected every frame by the `09` curl loop. We append a
**single-pass, alloc-free, brightness-weighted partial selection**: walk all sparks, score each by
`effective = sparkTemp³ * windowedFalloff(distToReceiverFocus)`, and keep a running **top-N** by insertion
into a tiny fixed array (N=8 → an 8-slot insertion is cheaper than a full sort and allocates nothing).
"Receiver focus" is the chamber's stone-of-interest point (the altar centre, the ledger edge) from
`sceneFor(route)` — we light *the stone the camera is looking at*, not every fragment's true nearest (a
per-fragment nearest-light search would be the expensive thing we're avoiding; a per-frame top-N near the
focus is the cheap approximation that reads identically because the camera frames one region).

```js
// SparkLights.jsx (or folded into the Embers/Sparks useFrame — ONE rAF, no new loop)
// pos, temp, divine: the live spark arrays from the `09` curl system. focus: sceneFor(route).stoneFocus.
const N = forge.quality === 'high' ? 8 : 4
const bestPos = U.uSparkLitPos.value, bestT = U.uSparkLitTemp.value, bestD = U.uSparkLitDiv.value
const score = scratchScores // preallocated Float32Array(N), reused
for (let s = 0; s < N; s++) score[s] = 0
let live = 0
for (let i = 0; i < sparkCount; i++) {
  const ti = temp[i]
  if (ti < 0.18) continue                         // cold embers radiate ~nothing — skip, don't waste a slot
  const dx = pos[i*3] - focus.x, dy = pos[i*3+1] - focus.y, dz = pos[i*3+2] - focus.z
  const d2 = dx*dx + dy*dy + dz*dz
  const w  = Math.max(0, 1 - d2 / (RANGE2))       // windowed: out-of-range scores 0
  if (w <= 0) continue
  const eff = ti*ti*ti * w                        // brightness (≈T³) × range window
  // insertion into the fixed top-N (smallest-slot replace) — alloc-free, N≤8
  let minIdx = 0
  for (let s = 1; s < N; s++) if (score[s] < score[minIdx]) minIdx = s
  if (eff > score[minIdx]) {
    score[minIdx] = eff
    bestPos[minIdx].set(pos[i*3], pos[i*3+1], pos[i*3+2], eff)
    bestT[minIdx] = ti
    bestD[minIdx] = divine[i]                       // 1 if born in an A/E zone
  }
}
for (let s = 0; s < N; s++) if (score[s] > 0) live = Math.max(live, s + 1)
U.uSparkCount.value = live
```

Two cheapnesses that matter: (1) the `ti < 0.18` early-out skips the cold drifting majority every frame
(most sparks are cooling embers radiating nothing); (2) the top-N insertion is `O(spark×N)` with N=8, but
with the early-out it's effectively `O(hot sparks × 8)` — sub-millisecond at 300 sparks of which maybe
30–60 are hot near the front. **No allocation, no sort, one rAF.** `bestPos[i].w` already carries the
effective intensity, so the shader doesn't recompute the score.

### 4.4 The accumulation — the receiver fragment shader (basalt / Ogham / channel)

Injected after `#include <color_fragment>` in the *same* receiver materials that already call
`gw_aeLight()` for the A/E (doc 22 §4.3/4.4). One unrolled loop, one `gw_aeLight` per live entry, summed.
The **A/E and the sparks share the function**; only the color source differs per entry.

```glsl
// ---- HEAD (after #include <common>, fragment) ----
uniform vec4  uSparkLitPos[N_SPARKLIGHTS];   // xyz world pos, w effective intensity (from U)
uniform float uSparkLitTemp[N_SPARKLIGHTS];  // 0..1 temperature
uniform float uSparkLitDiv[N_SPARKLIGHTS];   // 1 = divine spark
uniform int   uSparkCount;                   // live slots this frame
uniform float uSparkRange, uSparkK, uSparkGain;
varying vec3  vWPos; varying vec3 vWNrm;     // world pos/normal (set in vertex hook, doc 22 §4.6)
${GLSL_NOISE}        // gw_snoise/gw_fbm/gw_caustic + gw_aeFalloff + gw_aeLight (doc 22)
${GW_TEMPERATURE}    // gw_forge / gw_divineFire / gw_tempColor (doc 01)

// Accumulate the brightest-N moving sparks as light onto this fragment.
// Returns: x = diffuse-lit accumulator (colored bounce), packed via out params for spill + ogham reveal.
struct GwSpark { vec3 diffuse; vec3 spill; float oghamLit; };
GwSpark gw_sparkLight(vec3 wp, vec3 wn, vec3 albedo, float grazeAmt, float flick){
  GwSpark acc; acc.diffuse = vec3(0.0); acc.spill = vec3(0.0); acc.oghamLit = 0.0;
  for (int i = 0; i < N_SPARKLIGHTS; i++){
    if (i >= uSparkCount) break;                 // bounded by live count (unrolled, single compare)
    vec4  sp   = uSparkLitPos[i];
    // each spark's OWN color: divine sparks white-gold (never uTemp), ordinary sparks ride the ramp.
    vec3  col  = mix(gw_forge(uSparkLitTemp[i]), gw_divineFire(flick), uSparkLitDiv[i]);
    // SAME light model as the A/E — windowed inverse-square falloff + grazing — just a moving emitter.
    GwAE ae = gw_aeLight(wp, wn, sp.xyz, sp.w, col, albedo, uSparkK, uSparkRange, grazeAmt);
    acc.diffuse  += ae.diffuse;                  // colored one-bounce (green lift, tinted by spark color)
    acc.spill    += ae.spill;                    // warm wash (legibility)
    acc.oghamLit += ae.lit * uSparkLitDiv[i];    // ONLY divine sparks reinforce the Ogham reveal
  }
  acc.diffuse *= uSparkGain; acc.spill *= uSparkGain;
  return acc;
}

// ---- COLOR (after #include <color_fragment>, basalt) ----
GwSpark sl = gw_sparkLight(vWPos, normalize(vWNrm),
                           vec3(0.045,0.115,0.085) /*serpentine albedo*/, 0.55, uFlick);
diffuseColor.rgb += sl.diffuse * 1.4;            // moving green pools track the sparks
diffuseColor.rgb += sl.spill;                    // moving warm wash
// the static A/E reveal (doc 22) PLUS the divine-spark reinforcement share one accumulator:
float oghamReveal = aeStatic.lit + sl.oghamLit;  // aeStatic from the doc-22 A/E call
```

Notes that matter:
- **`gw_aeLight` is reused verbatim.** A spark is just an A/E that moves and (usually) is ember-coloured
  and cools. The falloff, the grazing `mix(ndl, 1-ndl, grazeAmt)`, the one-bounce `aeColor*albedo`, the
  `spill` — all identical. The *only* difference per entry is the color source (`mix` on `isDivine`).
- **Divine sparks alone feed `oghamReveal`.** Ordinary cooling sparks light the stone warmly but do **not**
  re-reveal the carving (only the divine fire reveals the lore — the brand law). `acc.oghamLit += ae.lit *
  uSparkLitDiv[i]` gates that for free. The static A/E reveal and the passing-divine-spark reveal sum into
  one `oghamReveal`, so the Ogham legibility math downstream (doc 22 §4.4 / `25`/`26`) is unchanged — it
  just receives a slightly higher, *moving* value when a divine ember flies past.
- **`grazeAmt` per receiver** matches doc 22: 0.55 basalt, 0.8 Ogham, 0.2 channel-lip pool. One slider,
  three weights — same as the A/E.
- **`flick`** is the shared living-flicker term (`gw_snoise` at the veins' frequency, `00 §2`) so the spark
  pools breathe on the same grain as everything else.
- **`uSparkCount` bounds the loop** with a single `>= … break`. On a frame with few hot sparks the loop
  exits early; the array length is still the compile-time `N_SPARKLIGHTS` so it unrolls.

### 4.5 The divine-spark birth flag (the emitter side, in the `09` spawn)

A spark is `divine` if it spawns inside an A/E zone. The A/E world positions already live in `U.uAEFire`
(and the layout knows all divine-letter centres); at spawn the `09` emitter checks proximity:

```js
// in the spark spawn (09 curl system): tag sparks born in the divine zones
const bornAtAE = nearestAEDist(spawnPos) < AE_ZONE_R          // build-time A/E centres
divine[i] = bornAtAE ? 1 : 0
temp[i]   = bornAtAE ? 1.0 : frontTemp                        // divine sparks start at the divine top
// divine sparks DO NOT cool toward iron-black — they ride a slow flicker, never the cooling curve (keystone)
```

Divine sparks keep their temperature pinned (they never reach `gw_forge`'s cold end); ordinary sparks cool
via the `09`/`03` curve as they drift. This is the keystone `00 §1.4` rule expressed on the particles: the
A/E and everything *born of* them never cool.

### 4.6 The r3f binding + the ONE writer

The list is written once per frame by the same headless driver that owns the pool — never per-material,
never a second rAF. The receivers bind `U` and damp only local look knobs.

```jsx
// ForgeDriver.jsx / SparkLights — the SOLE writer of the spark light list (folded into the spark useFrame)
useFrame((state, dt) => {
  // 1) advect sparks (doc 09 curl substep loop) — already here
  // 2) select brightest-N near sceneFor(route).stoneFocus → write U.uSparkLitPos/Temp/Div/Count (§4.3)
  // uSparkLitPos[i].w already = effective intensity; nothing else to damp (positions are exact, not damped —
  // the pools MUST track the moving sparks 1:1 or they smear).
})

// BasaltStone / Ogham / Channel materials: bind U + local knobs, damp per-route gain only
const local = useMemo(() => ({
  uSparkRange: { value: 3.5 },   // hard cutoff per spark (world units) — small: a spark lights a small pool
  uSparkK:     { value: 0.9 },   // inverse-square tightness (tighter than the A/E — sparks are point-like)
  uSparkGain:  { value: 0.0 },   // per-route master enable (damped to scene.sparkLit)
}), [])
m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U, local); /* inject HEAD/COLOR */ }
useFrame((_, dt) => {
  const sc = sceneFor(forge.route)
  local.uSparkGain.value = damp(local.uSparkGain.value, sc.sparkLit ?? 0.0, 2.4, dt)
})
```

> **Do not damp the spark positions.** The A/E position is damped (it's near-static); the *spark* positions
> must be written exactly each frame or the light pool lags behind the sprite and the spark visibly outruns
> its own glow. Damp the per-route *gain*, never the per-spark *position*.

### 4.7 Key uniforms / params (tuning table)

| Uniform | Source | Range | Meaning |
|---|---|---|---|
| `uSparkLitPos[N]` (vec4) | `U` / spark selection | world + w | brightest-N spark world pos (xyz) + effective intensity (w) |
| `uSparkLitTemp[N]` | `U` / spark selection | 0..1 | per-spark temperature → `gw_forge` / `gw_divineFire` color |
| `uSparkLitDiv[N]` | `U` / spark selection | 0/1 | divine flag — gates `gw_divineFire` color **and** Ogham reinforcement |
| `uSparkCount` | `U` / selection | 0..N | live slots this frame (loop bound) |
| `N_SPARKLIGHTS` | `#define` | 8 / 4 | high / low list length (compile-time, unrolls) |
| `uSparkRange` | local ← scene | 2..5 | per-spark hard falloff cutoff — **small**, so each spark lights a *local* pool |
| `uSparkK` | local ← scene | 0.6..1.2 | inverse-square tightness (sparks tighter than the A/E) |
| `uSparkGain` | local ← `scene.sparkLit` | 0..1 | per-route master enable for the moving stone-light |
| `grazeAmt` (arg) | call site | 0.2 / 0.55 / 0.8 | channel / basalt / Ogham raking weight (matches A/E) |

### 4.8 TSL-portable mirror (the WebGPU forward path, authored now)

```js
// three/tsl — the spark list becomes a storage buffer; the loop becomes a node Fn over instancedArray.
// (Wawa Sensei TSL-GPGPU 2025; Heckel Field Guide Oct 2025; clustered-on-WebGPU 2025 for the >N lift.)
const gwSparkLight = Fn(([wp, wn, albedo, grazeAmt, flick, count]) => {
  const acc = vec3(0).toVar(), spill = vec3(0).toVar(), oghamLit = float(0).toVar()
  Loop({ start: 0, end: count, type: 'int' }, ({ i }) => {
    const sp  = sparkPos.element(i)            // storage buffer (no brightest-N cap on WebGPU)
    const col = mix(gwForge(sparkTemp.element(i)), gwDivineFire(flick), sparkDiv.element(i))
    const ae  = gwAeLight(wp, wn, sp.xyz, sp.w, col, albedo, uSparkK, uSparkRange, grazeAmt)
    acc.addAssign(ae.diffuse); spill.addAssign(ae.spill)
    oghamLit.addAssign(ae.lit.mul(sparkDiv.element(i)))
  })
  return { diffuse: acc, spill, oghamLit }
})
// MRT emissive attachment (setMRT) → the divine-spark spill blooms EXACTLY, no luminance guess.
```

On WebGPU the brightest-N cap *disappears* (the full swarm lives in a storage buffer and a clustered cull
(landscape B) bins them), but the **shader math is byte-identical** — the port is a re-host of the same
`gw_aeLight` loop, not a rewrite. That is the whole reason to author C this way now.

---

## 5. COHESION — how this binds the one world

- **One light model, two emitter sources.** The moving sparks call the **same `gw_aeLight()`** the eternal
  A/E call (doc 22). Falloff shape, grazing curve, one-bounce colored bounce, spill — all shared. The stone
  lit by a passing spark and the stone lit by the A/E are the same light physics because they are the same
  function. The brief's "particles emit light onto nearby stone without true dynamic lights" is satisfied
  by *reusing the A/E light authority for a moving list*, not inventing a second one.
- **One temperature system drives the spark color.** Each spark's color is `gw_forge(uSparkLitTemp)` —
  the *same* ramp the veins, the pour, and the cooling letters walk (`00 §1`). A spark white-gold at the
  front and ember-red as it drifts is *visibly the same metal at two points on one cooling timeline* as the
  letter it flew off. Divine sparks branch to `gw_divineFire`, never `uTemp` — the keystone `§1.4` rule,
  expressed on particles.
- **One signal, one driver, one heartbeat.** The spark light list is written once by the spark `useFrame`
  into the shared pool `U`, `dt`-stepped (positions exact, gain damped). A strike that surges the pour and
  spawns a burst of hot sparks lifts the moving stone-pools, the veins, the jewel, and the A/E radiance
  **in the same frame** — the synchrony is the cohesion proof (`00 §7.6`).
- **One palette, one bloom contract.** Spark colors are `PAL` via `gw_forge`/`gw_divineFire`; only the
  hottest near-pass spill crosses 1.0, so the shared `mipmapBlur` (`luminanceThreshold ≈ 0.55`) catches
  *exactly* the bright moving pools — the palette IS the bloom selector (`00 §3.1, §7.3`). The broad soft
  ground-glow from the additive spark *sprites* (landscape D) is given by that same Bloom for free, so no
  dedicated light buffer is needed on the mandatory path.
- **The Ogham reveal stays one accumulator.** Static A/E reveal + passing-divine-spark reveal sum into one
  `oghamReveal` value the carving math reads (`25`/`26`, doc 22 §4.4). Only divine sparks contribute
  (`* uSparkLitDiv[i]`) — ordinary embers warm the stone but never re-light the lore. The carving rises on
  one curve whether the light is the eternal letter or a divine ember flying past.
- **One noise basis.** The spark pools' living flicker is `gw_snoise` at the veins' frequency (`00 §2`);
  the spark motion is `gw_curl3` (doc 09). The pool's grain is the veins' grain is the embers' grain.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

iPhone-15 OLED, one renderer, DPR-capped 1.5, ~9–10 ms steady-state on `high` (`00 §10`). This element is
**fill-rate cheap by design** — its shader cost is N extra `gw_aeLight` evals in an already-running
receiver pass, and its CPU cost is one early-out partial-selection in the spark loop already running.

**Cost accounting:**
- _CPU (selection):_ a brightness-gated walk of ≤300 sparks with an 8-slot insertion — sub-millisecond,
  alloc-free, folded into the `09` advection `useFrame`. The `ti<0.18` early-out skips the cold majority.
- _GPU (accumulation):_ `N_SPARKLIGHTS × gw_aeLight` per receiver fragment. `gw_aeLight` is ≈10 ALU ops
  (doc 22 §6); 8 entries ≈ 80 ALU on the basalt fragments — invisible next to the basalt's own triplanar
  fbm (utsubo 2026: extra ALU in an existing pass ≪ a second pass). The loop is unrolled (compile-time N)
  with a single `>= count` early break, so cold frames are even cheaper.

**Tiers** (`high | low | static`, mirroring `useQuality`):
- **`high`:** `N_SPARKLIGHTS = 8`, full `gw_sparkLight` on basalt + Ogham + channel lips. Divine-spark
  Ogham reinforcement on. Optional landscape-D broad ground-buffer **off by default** (Bloom subsumes it);
  enable only if a chamber needs an extra-soft floor and the frame has headroom. `dpr` 1.5.
- **`low`:** `N_SPARKLIGHTS = 4` (the 4 brightest near the focus), basalt + Ogham only (drop channel-lip
  pools), no chromatic anything. The moving pools still read because the brightest few sparks carry the
  effect. `dpr` 1.4.
- **`static` / `prefers-reduced-motion`:** **no live spark list** — sparks are frozen or absent. The warm
  stone floor is the baked emissive-AO (landscape E, doc 23 mechanism D) so the stone still reads warm and
  the Ogham still legible at zero per-frame cost; `uSparkGain = 0`, `frameloop='demand'`. Dignified frozen
  still, not a broken fallback.

**Hard rules:**
1. **Select per-frame near the focus, never per-fragment nearest.** A per-fragment search over 300 sparks
   is the expensive thing this whole approach avoids. One top-N selection near `sceneFor(route).stoneFocus`
   per frame is the cheap approximation that reads identically (the camera frames one stone region).
2. **`uSparkRange` is small.** Each spark lights a *local* pool (a few world units), unlike the A/E's wider
   range. Without a tight windowed cutoff, 8 sparks' inverse-square tails dimly lift the whole floor and
   waste bloom mip work on a near-black mass (the doc 22 §6 leak, multiplied by N).
3. **Positions exact, gain damped.** Write spark positions 1:1 each frame; damp only the per-route gain.
   A damped position makes the light pool lag the sprite — the spark outruns its own glow.
4. **Brightness-gate the selection.** Cold drifting embers radiate ≈nothing; the `ti<0.18` early-out keeps
   them out of the list so the 8 slots hold the 8 that actually light the stone.
5. **Only divine sparks reveal the Ogham.** Gate the Ogham accumulator with `uSparkLitDiv[i]`. Ordinary
   embers warming the carving into legibility would break the brand law (only divine fire reveals the lore).
6. **No second render target on the mandatory path.** The additive spark sprites + shared Bloom already
   give the broad soft ground-glow; a dedicated light buffer (landscape D) is a `high`-only opt-in, not a
   default — it's the "second pass" the budget warns against.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

1. **Reuse `gw_aeLight`; never write a second falloff.** The temptation is to drop a quick `1/(1+d²)` per
   spark. That silently drifts from the A/E light model the day someone retunes either — the `02`/`03`
   "one authority" lesson. Inline the *same* `gw_aeLight` from `shaders.js` (doc 22). Build the spark loop
   *after* doc 22's A/E reveal is in, so you're extending a working function, not forking one.
2. **World-space pos + normal.** `gw_aeLight`'s falloff and grazing need **world** position and **world**
   normal (the `vWPos`/`vWNrm` vertex hook, doc 22 §4.6). View-space makes the moving pools swim with the
   camera — the single most likely silent bug, and worse here because the emitter also moves.
3. **Hook `<color_fragment>`, not `<tonemapping_fragment>`.** The stone is *lit* (additive to lit albedo),
   not *emissive*. Copy-pasting the slab's emissive hook makes the stone glow like lava under every spark
   instead of being raked by it (doc 10 §7.3).
4. **Positions exact, gain damped (the moving-emitter trap).** See §6 rule 3 — the one pitfall unique to a
   *moving* light list. Verify by sending a single fast spark across a flat stone in `?debug` and confirming
   the pool sits *under* the sprite, not trailing it.
5. **Tight `uSparkRange` + windowed falloff, or the floor lifts.** N sparks each with an un-windowed
   inverse-square tail lift the whole basalt off black and bloom everywhere. The windowed cutoff (already in
   `gw_aeFalloff`) is non-optional; keep `uSparkRange` small so a spark lights a *pool*, not the room.
6. **Divine sparks must not cool and must gate the Ogham.** At spawn, pin divine-spark temp at the top and
   route their color through `gw_divineFire`, never `uTemp` (keystone). Gate the Ogham accumulator with the
   divine flag. If an ordinary ember reveals the carving, or a divine ember cools to orange, the keystone
   beat is broken.
7. **Keep the selection alloc-free and gated.** No `new`, no `.sort()`, no array spread in the `useFrame`
   (`00 §10` alloc-free law). Preallocate the score scratch; insertion-replace the top-N; early-out on cold
   sparks. A per-frame sort of 300 sparks would itself blow the JS budget.
8. **One writer, one rAF.** The spark list is written by the spark `useFrame` only — never a second loop,
   never `setInterval`. It rides the same heartbeat as the veins/A/E so a strike surges them together.
9. **Verify the SwiftShader way, then the device.** `qa-route` build-green + 0 console errors @ 393×852
   and 1440×900 (the GLSL compiled). Then the **iPhone-15 OLED read is mandatory** — the moving warm pools
   tracking the sparks, the divine ember flickering the Ogham legible as it flies past, and the bloom on the
   near-pass spill do **not** simulate headless (`shader-fx`, `post-fx`).

---

## 8. SOURCES (2025–2026)

1. **three.js forum — "Clustered Rendering on WebGPU"** (Showcase thread, **April 2025**) — a 2025
   implementation of tile/cluster light culling; states plainly that WebGL's Uniform Buffer caps real
   lights "usually within 10" and that WebGPU storage buffers are what lift it — the constraint that forces
   the brightest-N approach on the WebGL2 judge build and the forward path for the WebGPU port.
   https://discourse.threejs.org/t/clustered-rendering-on-webgpu/81042
2. **Brandon Jones (toji) — "WebGPU Clustered Forward Shading"** (project + write-up, maintained through
   2025) — the canonical clustered/Forward+ many-lights reference: froxel binning, per-cluster light lists,
   "interesting use case for WebGPU that wasn't practical with WebGL" — the §2B landscape and the post-judge
   forward path. https://toji.github.io/webgpu-clustered-shading/ · https://github.com/toji/webgpu-clustered-shading
3. **Khronos glTF-Sample-Renderer — "Punctual Lights"** (DeepWiki reference, 2025) — the per-fragment
   `intensity·color·attenuation·N·L` composition over a small `LIGHT_COUNT` loop and the
   `max(1-(d/range)⁴,0)²/d²` range attenuation that the brightest-N accumulation mirrors and that
   `gw_aeLight` already implements.
   https://deepwiki.com/KhronosGroup/glTF-Sample-Renderer/12.3-punctual-lights
4. **Google — "Physically Based Rendering in Filament"** (maintained reference, 2025–2026 revisions) — the
   point-light **windowed inverse-square** `getSquareFalloff` used per-spark so each spark's pool is bounded
   and local; the physical basis for `uSparkRange`/`uSparkK`.
   https://google.github.io/filament/Filament.md.html
5. **Codrops — "Particles, Progress, and Perseverance: A Journey into WebGPU Fluids"** (**Jan 29, 2025**) —
   describes **point splatting**: rendering particles into a screen-space buffer + separable blur to build a
   surface — the §2D screen-space light-injection lineage (and why it's view-space, not surface-correct, so
   it lights the floor but can't rake a carved groove).
   https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/
6. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (**2026**) — the fill-rate /
   draw-call budget framing ("extra ALU in an existing pass ≪ a second render pass"), bake-what-you-can
   (lightmaps), uniform-array vs program-proliferation, `<Detailed>` LOD — the perf doctrine the
   brightest-N-in-an-existing-pass pick is justified against. https://www.utsubo.com/blog/threejs-best-practices-100-tips
7. **Bærentzen, Martínez, Frisvad & Lefebvre — "Improving Curl Noise"** (**SIGGRAPH Asia 2025**, Dec 15–18
   2025) — the divergence-free volume-preserving vector noise (cross of `n−1` gradients) behind the spark
   *motion* this doc consumes (`09`); the emitter whose positions/temperatures the selection reads.
   https://dl.acm.org/doi/10.1145/3757377.3763980 · https://people.compute.dtu.dk/jerf/papers/dfvn_lowres.pdf
8. **Wawa Sensei — "GPGPU particles with TSL & WebGPU"** (R3F course lesson, 2025) — `instancedArray` /
   `StorageInstancedBufferAttribute` persistent GPU buffers for particles; the storage-buffer the spark
   light list becomes on the WebGPU forward path (§4.8). https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu
9. **three.js docs — "StorageBufferAttribute" / "StorageBufferNode"** (r17x, 2025–2026) — the WebGPU-only
   storage-buffer API that lifts the brightest-N cap in the forward port; confirms it "can only be used with
   WebGPURenderer," reinforcing WebGL2-as-judge-build.
   https://threejs.org/docs/pages/StorageBufferAttribute.html · https://threejs.org/docs/pages/StorageBufferNode.html
10. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (**Oct 14, 2025**) — `Fn()` function reuse and
    `setMRT` emissive attachment for **exact** selective bloom of the divine-spark spill (vs luminance
    threshold); the TSL-portable target for the spark accumulation loop and the bloom-selection forward path.
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
11. **Maxime Heckel — "The magical world of Particles with React Three Fiber and Shaders"** (re-surfaced /
    maintained 2025) — the CPU-`Float32Array` → `position` attribute particle loop and the FBO→compute
    migration; the emitter substrate the brightest-N selection folds into. https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/
12. **Codrops — "Susurrus: Crafting a Cozy Watercolor World with Three.js and Shaders"** (**Apr 24, 2026**)
    — the `uProgress`/one-scalar × smoothstep reveal-and-NPR-low-value discipline; the reveal grammar the
    `oghamReveal` accumulator (static A/E + divine-spark) follows.
    https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The brightest-N selection metric & temporal stability.** The exact scoring (`temp³ × windowed-range`
   vs a perceptual luminance weight), and — the real risk — *popping*: when the 8th-brightest spark swaps
   out, its pool vanishes abruptly. Whether a small per-slot fade-out (damp `w` to 0 over ~3 frames when a
   slot is evicted) or a hysteresis band on the selection threshold removes the flicker without lagging the
   pools — the term that makes a swarm of moving lights read *continuous*, not strobing.
2. **Divine-spark Ogham reinforcement choreography.** The timing/density of divine-spark emission past the
   Ogham verses so the carving *flickers legible in the wake* without becoming a constant strobe — how many
   divine embers per second, on what path (the `08`/`09` orbit), gated to which chambers (altar `/about`,
   ledger `/pricing`), so the "lore re-lit by passing fire" beat lands as sacred, not noisy.
3. **The landscape-D broad ground-buffer vs Bloom-subsumption.** Whether a dedicated low-res additive
   light buffer (point-splat + blur) ever earns its pass on `high` for the *broad* swarm glow that the
   brightest-N (8 discrete pools) can't give, or whether the shared `mipmapBlur` on the additive sprites
   fully covers it — the exact threshold where the second pass is worth the budget.
4. **The WebGPU storage-buffer port (lifting the N cap).** Re-hosting the accumulation as a TSL `Fn()` over
   an `instancedArray` spark buffer with a clustered/froxel cull (landscape B/F) so the *full* swarm lights
   the stone (no brightest-N), plus `setMRT({emissive})` so the divine-spark spill blooms exactly — the
   forward path once iOS WebGPU is the baseline (`30`).
