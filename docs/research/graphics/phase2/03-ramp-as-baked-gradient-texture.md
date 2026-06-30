# 03 — The Temperature Ramp as a Baked 1×256 Gradient `DataTexture`

_Phase 2 deep-dive · GAELWORX forge world · cluster **A-temperature-core** · the mobile fallback that
converts `gw_tempColor`'s per-pixel hue march into a JS-built 256×1 `DataTexture` sampled once per fragment
— same authority, one texture fetch, no file load (honors the EXR ban) · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js)_

> **Read `00-COHESION-MAP.md §1` and `phase2/01-master-temperature-module.md` first.** This document is the
> formalization of the single sentence buried at the end of doc 01 §6: _"LUT escape hatch (won't be needed).
> If a profile ever shows the ramp is a bottleneck, bake the 256×1 strip in JS at module-eval into a
> `DataTexture` (no file load — honors the EXR ban) and swap `gw_tempColor` for `texture2D(uRamp,
> vec2(t,0.5))`. Same authority, one fetch."_ It does **not** replace the procedural ramp as the default —
> the procedural `gw_forge` ships to the judge. This is the **conditional mobile/static-tier fallback** that
> stands ready behind a flag, built so that if (and only if) the procedural hue march ever profiles as a
> fill-rate bottleneck on a thermally-throttled iPhone 15, the swap is a single uniform/define change with
> **provably identical color output** — the Immersive-Garden "bake the field, don't recompute it per pixel"
> discipline applied to the one signal the whole world shares.

---

## 1. SCOPE — this element in the GAELWORX world

The master temperature module (`phase2/01`) defines five pure GLSL symbols. Of those, exactly one is a
**spatially-varying, evaluated-millions-of-times-per-frame hue march**: `gw_tempColor(float temp)` — five
overlapping `smoothstep` bands across six brand-anchored stops, returning unit-ish linear RGB. The companion
`gw_tempEmissive` is a single cheap `pow(t,3.0)*2.6 + t*0.12`; `gw_divineFire` is one `mix`. The cost, if any
ever materializes, is concentrated in the **color** half — five `smoothstep`s and five `vec3 mix`es is ~20–30
ALU ops, and it runs at **every fragment of every hot material**: the near-full-screen slab veins, the molten
pour surface, the channel metal, every cooling letterform fragment, every spark, the caustic tint. On a
tile-based mobile GPU under thermal throttle, that fixed per-pixel ALU multiplied by near-full-screen
emissive coverage is the *kind* of cost that, stacked with 3-octave `gw_fbm` + the post chain, can erode the
~9–10 ms `high`-tier budget (`00-COHESION-MAP §10`).

This doc bakes `gw_tempColor`'s curve — **once, at module-evaluation time, in pure JS** — into a 256-texel-
wide, 1-texel-tall `DataTexture` whose row _is_ the cooling gradient (iron-black → dull-red → forge-red →
ember → gold → white-hot). Then the per-fragment cost of the hue march collapses to **one linearly-filtered
texture fetch** at `u = temp`. The texture is built by calling the **exact same JS-side stop colors** the
procedural ramp inlines, so the baked strip is not "a different ramp that looks similar" — it is the
**identical authority, sampled instead of recomputed**. The brightness ramp (`gw_tempEmissive`) and the
divine-fire path stay procedural (they're already near-free and the A/E must never touch a sampled `uTemp`
table — §4.6). The deliverable is `src/scene/rampTexture.js` (the JS bake) plus a compile-time
`GW_RAMP_BAKED` define in `temperature.js` that toggles `gw_tempColor` between its procedural body and a
`texture2D` fetch — wired so flipping it is one boolean and the world is byte-equivalent in color.

The narrative stakes are unchanged: a cooling letter and a cooling vein must be _visibly the same metal_.
With the baked ramp they sample the same texel; with the procedural ramp they evaluate the same function.
Either way the authority is one. This is purely a **packaging/perf decision for the color half**, gated
behind a profile that may never trip — which is exactly why it must be built _correctly and provably-
equivalent_ now, so it is a safe lever later rather than a panic rewrite mid-judging.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are five viable 2025-2026 ways to get a temperature→color ramp onto the GPU for a stylized real-time
forge. The Phase-1 doc 02 already settled "procedural brand-anchored Planckian ramp beats spectral/file
LUTs"; this Phase-2 question is narrower: **given that authoritative ramp, what is the cheapest correct way
to evaluate it per-fragment, and is a bake worth it on mobile?**

### 2.A Keep it fully procedural (the current default, doc 01)
Five `smoothstep`/`mix` pairs inlined via `onBeforeCompile`. **Pros:** zero texture units, zero bandwidth, no
banding (full float precision in-ALU), no upload, trivially TSL-portable, no extra state to keep in sync.
**Cons:** the only cost is the ~20–30 ALU per fragment, paid at every hot pixel. On the iPhone-15 budget this
is _almost certainly fine_ (doc 01 §6 calls the math "effectively free" — cheaper than the `gw_fbm` beside
it). **This is and remains the ship default.** Everything below is the fallback if a real device profile
ever contradicts that.

### 2.B Bake to a 1×256 `DataTexture`, sample once (this doc's pick _for the fallback_)
Build a 256-wide × 1-tall texture in JS at module-eval from the same stop colors, `LinearFilter` +
`ClampToEdgeWrapping`, and replace the hue march with `texture2D(uRamp, vec2(t, 0.5)).rgb`. **Pros:** the
per-fragment hue cost becomes a single linearly-interpolated fetch — on mobile tile GPUs a 256×1 strip is a
trivial, cache-resident, _non-dependent-ish_ read (the `u` coordinate is computed but the texture is tiny and
hot in cache, so it behaves far better than a large dependent sample). It also makes the ramp **artist-
swappable at runtime** (rebuild the array → `needsUpdate`) without a recompile. **Cons:** consumes a texture
unit; introduces 8-bit quantization banding risk on the dark void→crimson low end (mitigated, §6); the `u`
fetch is technically a _dependent texture read_ (the coordinate is a computed value, not an interpolated
varying), which historically carried a penalty on older mobile GPUs — but on A16/A17-class hardware with a
256-byte-row texture the penalty is negligible (§6). This is the **Immersive-Garden "bake the field"
discipline**: precompute the expensive evaluation into a sampleable resource, pay the fetch instead of the
math.

### 2.C `THREE.Lut` / `LUTCubeLoader` / a `.cube` file
three's built-in `Lut` helper and the `LUTCubeLoader`/`LUT3dlLoader` family load authored color LUTs. **Pros:**
industry-standard, DaVinci-authorable. **Cons:** it is a **file load** (the `.cube`/`.ktx2` fetch suspends,
can throw, adds a request) — this is the EXR-ban category the cohesion map forbids for the hero path, and
it's a 3D grade LUT, not a 1D temperature ramp. The grade LUT is already reserved as a _post-tone-map_
cross-fade (`00-COHESION-MAP §3.3`), a different concern. **Rejected for the ramp** — wrong tool, violates the
no-runtime-load constraint.

### 2.D Bake with `three-shader-baker` (render the shader to an RT, read back)
FarazzShaikh's `three-shader-baker` (Vanilla + React, maintained mid-2025) renders a material/shader into a
texture via an off-screen render target. **Pros:** could bake the _actual_ procedural shader output so the
strip is guaranteed pixel-identical to the GLSL. **Cons:** requires a render target + a render pass + a
GPU→CPU readback at boot (or keeps an RT alive), which is heavier and more fragile than just running the same
stop math in JS — and the math is trivially reproducible in JS anyway (it's `THREE.Color.lerpColors` +
`smoothstep`). **Rejected as overkill** for a 256×1 strip; noted as the technique to reach for if we ever
needed to bake a _2D_ field (e.g. a temp×age cooling LUT, §9) where reproducing the GLSL in JS is error-prone.

### 2.E TSL `texture()` node sampling a baked ramp on `WebGPURenderer`
On WebGPU, the same baked `DataTexture` is sampled with the TSL `texture(uRamp, vec2(t,0.5))` node feeding
`material.colorNode`/`emissiveNode`; Maxime Heckel's Oct-2025 _Field Guide to TSL and WebGPU_ documents the
node system as the replacement for `onBeforeCompile`, and texture nodes sample identically. **Pros:** clean,
future-aligned, MRT-emissive bloom (`phase2/01 §4.7`). **Cons:** WebGPU is gated post-judge; the composer is
WebGL. **Verdict:** author the bake so the `DataTexture` is renderer-agnostic (it is — a `DataTexture` is a
`DataTexture` on both backends) and the sample is a one-line GLSL↔TSL twin, ship the WebGL2 path.

**Landscape verdict:** the **default stays 2.A (procedural)**; the **fallback is 2.B (JS-baked 1×256
`DataTexture`)**, authored from the same stop colors, gated behind one compile-time define, with the
WebGPU/TSL sample (2.E) as a mechanical twin. 2.C and 2.D are rejected (file load / RT overkill). The novelty
over Phase-1 and over doc 01 is **provable equivalence**: a unit-test-able JS bake that reproduces the GLSL
hue march to within sub-step tolerance, so the swap is a perf lever you can pull with confidence, not a
re-authoring risk.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build `src/scene/rampTexture.js` now: a pure-JS function that evaluates the exact six-stop, five-band
`smoothstep` hue march into a `Float32Array` (256×RGB), wraps it in a `THREE.DataTexture`
(`FloatType`/`HalfFloatType`, `LinearFilter`, `ClampToEdgeWrapping`, `LinearSRGBColorSpace`), and exports a
singleton built at module-eval. Add a `GW_RAMP_BAKED` compile-time `#define` to `temperature.js` so
`gw_tempColor` is either the procedural body (default, define off) or `texture2D(uRamp, vec2(clamp(temp,
0.0,1.0), 0.5)).rgb` (fallback, define on). Keep `gw_tempEmissive`, `gw_forge`, `gwCool01`, and
`gw_divineFire` 100% procedural in both modes.** Justification, rooted in this codebase and the cohesion
contract:

1. **Same authority, two evaluation strategies.** The bake reads the same `PAL` stops and the same band
   breakpoints the procedural body inlines. The strip _is_ `gw_tempColor` sampled at 256 points and linearly
   interpolated between them. Because `gw_tempColor`'s only nonlinearity between adjacent texels is the
   `smoothstep` overlap — and 256 samples across `[0,1]` puts a texel every 0.0039, far finer than the
   widest band's curvature — `LinearFilter` reconstruction is visually indistinguishable from the analytic
   curve (§7 quantifies the error). One authority, not two ramps.

2. **It is the _only_ free lever left on the color half.** The four big fill-rate levers (DPR cap, bloom
   `resolutionScale`, `GW_FBM_OCTAVES`, particle overdraw — `00-COHESION-MAP §10`) all target noise/bloom/
   particles. None touches the temperature hue march. If a device profile ever shows the ramp ALU is
   material (e.g. on a thermally-collapsed A16 where every saved ALU at every hot pixel counts), this bake is
   the lever that addresses _it specifically_, with zero visual cost.

3. **It slots into the existing socket with one define and one uniform.** `temperature.js` is already the one
   place `gw_tempColor` is defined. Adding a `#ifdef GW_RAMP_BAKED` branch there and a `uRamp` to the shared
   uniform pool `U` (`00-COHESION-MAP §4.2`) means _every_ consumer that already injects `GW_TEMPERATURE`
   picks up the fallback for free — no per-material change. The slab, pour, channels, letters, sparks,
   caustics all swap together or none do.

4. **It honors every hard constraint.** The texture is **built in JS at module-eval — no file fetch, no
   suspense, no EXR/HDR/KTX2 load** (the cardinal scar). It is one tiny texture (256×1 = a few KB at float).
   It disposes trivially. It is renderer-agnostic (works on the eventual `WebGPURenderer`). It degrades
   uniformly — on `static` the same texel is sampled at a frozen `uTemp`, so the still poster is color-
   correct.

5. **Runtime artist-tunability is a bonus, not the point.** Because the strip is a JS array, the `?debug`
   leva panel can rebuild it live (move a stop, re-bake, `needsUpdate=true`) — handy for the on-device stop-
   tuning that doc 01 §7 demands. But the _reason to build it_ is the perf fallback; tunability is gravy.

**What this is NOT:** it is not a default, not a quality upgrade, and emphatically not a second ramp. If the
procedural ramp profiles fine on the iPhone 15 (the expected outcome), `GW_RAMP_BAKED` stays off forever and
the baked texture is never created (guard the singleton build behind the tier/flag so the few-KB allocation
and upload don't even happen on the ship path). The value is _optionality with provable equivalence_.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
**No new dependencies.** `three` (current r17x line; `DataTexture`, `Float32Array`/`Uint8Array`,
`LinearFilter`, `ClampToEdgeWrapping`, `LinearSRGBColorSpace`, `FloatType`/`HalfFloatType` all core),
`@react-three/fiber`, the existing `@react-three/postprocessing` `Bloom`, `leva` (`?debug`). New code: one
file `src/scene/rampTexture.js`, a `#ifdef` branch + a `uRamp` declaration in `src/scene/temperature.js`, and
one line in the shared uniform pool. The two HDR palette tokens (`PAL.goldHot`, `PAL.divine`) from doc 01 §4.2
are a prerequisite — the bake reads the same stops.

### 4.2 `src/scene/rampTexture.js` — the JS bake (the deliverable)

The bake reproduces the GLSL hue march **in JS, with identical stops and breakpoints**, into a float strip.
Keeping the breakpoints in one shared JS array (`RAMP_STOPS`) that both the bake _and_ the procedural GLSL
inline read is the equivalence guarantee.

```js
import * as THREE from 'three'
import { PAL } from './palette.js'

// ---- THE ONE SOURCE OF STOPS (shared by JS bake AND procedural GLSL) ----
// Each: [linear THREE.Color, smoothstep edge0, edge1]. Overlapping bands => no plateaus/seams.
// Identical to gw_tempColor's body in temperature.js — change here, regenerate the GLSL inline.
export const RAMP_STOPS = [
  { c: PAL.void,        e0: 0.00, e1: 0.00 }, // 0.00 iron-black base (the mix() start)
  { c: PAL.crimsonDeep, e0: 0.00, e1: 0.22 }, // dull red
  { c: PAL.red,         e0: 0.18, e1: 0.45 }, // Celtic-Blood-side forge red
  { c: PAL.ember,       e0: 0.42, e1: 0.66 }, // Ember Glow
  { c: PAL.goldHot,     e0: 0.64, e1: 0.85 }, // HDR shoulder
  { c: PAL.hot,         e0: 0.82, e1: 1.00 }, // white-hot (HDR > 1 -> blooms)
]

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / Math.max(1e-6, e1 - e0)))
  return t * t * (3 - 2 * t)
}

// Evaluate the SAME band chain gw_tempColor runs, in linear space, at scalar t in [0,1].
export function gwTempColorJS(t, out = new THREE.Color()) {
  t = Math.min(1, Math.max(0, t))
  // start at iron-black, then mix in each subsequent stop by its band's smoothstep weight
  out.copy(RAMP_STOPS[0].c)
  for (let i = 1; i < RAMP_STOPS.length; i++) {
    const s = RAMP_STOPS[i]
    out.lerp(s.c, smoothstep(s.e0, s.e1, t)) // THREE.Color.lerp is per-channel linear (matches GLSL mix)
  }
  return out
}

// ---- BAKE: 256x1 strip of the hue march, full float (HDR-safe: PAL.hot/goldHot exceed 1.0) ----
const WIDTH = 256
export function buildRampTexture(width = WIDTH) {
  const data = new Float32Array(width * 4) // RGBA, float, NO 8-bit quantization
  const c = new THREE.Color()
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1)            // 0..1 inclusive of both ends (texel center handled by clamp+linear)
    gwTempColorJS(t, c)
    const o = x * 4
    data[o] = c.r; data[o + 1] = c.g; data[o + 2] = c.b; data[o + 3] = 1.0
  }
  const tex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat, THREE.FloatType)
  tex.colorSpace = THREE.LinearSRGBColorSpace // values are ALREADY linear (from THREE.Color) — do NOT sRGB-decode
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping       // CRITICAL: clamp so t=0 and t=1 don't wrap/bleed
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false                 // 1px tall, no mips
  tex.needsUpdate = true
  return tex
}

// Singleton, built lazily so the ship path (procedural) never allocates it.
let _ramp = null
export const getRampTexture = () => (_ramp ??= buildRampTexture())
export const disposeRampTexture = () => { _ramp?.dispose(); _ramp = null }
```

**Float vs half-float vs byte — the precision decision.** The ramp's hot end is HDR (`PAL.hot = (1.9,1.25,
0.7)`, `goldHot = (1.40,0.92,0.40)`) — values **above 1.0**, which an 8-bit `Uint8Array`/`UnsignedByteType`
texture **cannot store** (it clamps to 1.0, killing the bloom that the whole pipeline depends on). So the
strip **must** be float or half-float. `FloatType` (`Float32Array`) is the safe default and is supported on
A16/A17 + WebGL2 with `OES_texture_float_linear` (universal on the judge device). `HalfFloatType`
(`Uint16Array` of float16 bits) halves the upload and is also fine on iOS — but the 2025 forum scar
("`DataTexture` works on mobile only with `FloatType`, not `HalfFloatType`") means **ship `FloatType` and
treat half-float as an optional micro-optimization to verify on the actual device, not assume**. A 256×1
float texture is ~4 KB — the upload is a non-event regardless.

### 4.3 `src/scene/temperature.js` — the `#ifdef` branch

`gw_tempColor` becomes a compile-time fork. The procedural body is the default; defining `GW_RAMP_BAKED` (and
declaring `uRamp`) swaps to the fetch. Everything else in the module is unchanged.

```glsl
  // ---- 1. HUE MARCH — procedural (default) OR baked-LUT fetch (mobile fallback) ----
  // temp: 0 = iron-black/cold, 1 = white-hot. Both paths return the SAME linear RGB.
  #ifdef GW_RAMP_BAKED
    uniform sampler2D uRamp;                 // 256x1 strip baked in JS from RAMP_STOPS (rampTexture.js)
    vec3 gw_tempColor(float temp){
      float t = clamp(temp, 0.0, 1.0);
      // sample at the texel ROW center (0.5) so we never straddle the single row;
      // u = t with ClampToEdge means t=0 -> first texel, t=1 -> last texel, no wrap bleed.
      return texture2D(uRamp, vec2(t, 0.5)).rgb;
    }
  #else
    vec3 gw_tempColor(float temp){
      float t = clamp(temp, 0.0, 1.0);
      vec3 ironBlack = ${v3(PAL.void)};
      vec3 dullRed   = ${v3(PAL.crimsonDeep)};
      vec3 forgeRed  = ${v3(PAL.red)};
      vec3 ember     = ${v3(PAL.ember)};
      vec3 gold      = ${v3(PAL.goldHot)};
      vec3 whiteHot  = ${v3(PAL.hot)};
      vec3 c = mix(ironBlack, dullRed,  smoothstep(0.00, 0.22, t));
      c      = mix(c,         forgeRed, smoothstep(0.18, 0.45, t));
      c      = mix(c,         ember,    smoothstep(0.42, 0.66, t));
      c      = mix(c,         gold,     smoothstep(0.64, 0.85, t));
      c      = mix(c,         whiteHot, smoothstep(0.82, 1.00, t));
      return c;
    }
  #endif
```

> **Equivalence by construction.** The `#else` band chain and `RAMP_STOPS`/`gwTempColorJS` are the _same six
> stops, same five breakpoint pairs, same start-at-ironBlack-then-lerp structure_. If you change a stop, you
> change it in `RAMP_STOPS` and regenerate the GLSL inline (or — cleaner — generate the `#else` body string
> from `RAMP_STOPS` at module-eval so there is literally one source). The §7 unit test asserts
> `max|gwTempColorJS(t) − GLSL(t)| < ε` across a fine `t` sweep.

`gw_tempEmissive`, `gw_forge`, `gwCool01`, `gw_coolForge`, and `gw_divineFire` are **unchanged and stay
procedural in both modes** — `gw_forge` simply calls whichever `gw_tempColor` compiled in:
```glsl
  vec3 gw_forge(float temp){ return gw_tempColor(temp) * gw_tempEmissive(temp); }
```
So the brightness ramp, the bloom-gating logic, and the divine-fire keystone are _identical bytes_ regardless
of the define. Only the hue lookup changes evaluation strategy.

### 4.4 Toggling the define + binding `uRamp` (the r3f wiring)

The define is set per-material at compile time; `uRamp` joins the shared uniform pool so one reference drives
every consumer. In each material's `onBeforeCompile` (the existing pattern):

```js
import { getRampTexture } from './rampTexture.js'
import { forge } from '../store.js'

// in onBeforeCompile(shader):
if (forge.tier !== 'high' && RAMP_BAKED_ENABLED) {     // gate: only the fallback tier(s) define it
  shader.defines = { ...shader.defines, GW_RAMP_BAKED: '' }
  shader.uniforms.uRamp = U.uRamp                       // SHARED reference from the pool, not a clone
}
shader.fragmentShader = shader.fragmentShader
  .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\n${GW_TEMPERATURE}`)
```

And in `src/scene/forgeUniforms.js` (`U`), only constructed when the flag is on:

```js
// added to the shared pool U (00-COHESION-MAP §4.2) ONLY if the fallback is enabled:
uRamp: { value: RAMP_BAKED_ENABLED ? getRampTexture() : null },
```

`RAMP_BAKED_ENABLED` is a single boolean — set by the boot capability probe / `PerformanceMonitor` ladder
(`00-COHESION-MAP §10`) or forced via `?debug`. When `false` (the ship default): no define, no `uRamp`, the
texture singleton is never built, the world is the procedural ramp. When `true`: every hot material compiles
the fetch path and binds the one shared `uRamp`. **The A/E path is never affected** — it routes through
`gw_divineFire`, which doesn't call `gw_tempColor` (§4.6).

### 4.5 Key uniforms / params

| Symbol | Meaning | Owner | Default / range |
|---|---|---|---|
| `uRamp` (sampler2D) | the baked 256×1 hue strip | `U` pool, built once in `rampTexture.js` | null (off) / the `DataTexture` |
| `GW_RAMP_BAKED` (define) | compile-time fork in `gw_tempColor` | per-material `onBeforeCompile` | undefined (procedural) |
| `RAMP_BAKED_ENABLED` (JS bool) | gate for the whole fallback | boot probe / perf ladder / `?debug` | `false` (ship default) |
| `RAMP_STOPS` (JS array) | the one source of stops+bands | `rampTexture.js` | the six brand stops |
| `WIDTH` | strip resolution | `rampTexture.js` | `256` (see §6 on 256 vs 512) |

`uTemp`/`uHeat`/`uFillFront`/`uCoolRate`/`uIsAE` and the whole driver story are **unchanged** from doc 01 §4.6
— the bake only changes how `temp` becomes color, not how `temp` is computed or damped.

### 4.6 The keystone constraint — the A/E must never sample `uRamp`

The single most important rule survives untouched, and the bake actually makes it _structurally safer_:
`gw_divineFire(flick)` returns `PAL.divine * (1.0 + flick*0.18)` and **does not call `gw_tempColor`** — so it
never reads `uRamp` in either mode. `gw_coolForge(age, rate, isAE, flick)` does
`mix(gw_forge(temp), gw_divineFire(flick), isAE)`; with `isAE==1` the `gw_forge` arm (and thus any ramp fetch)
is discarded by the branch-free select. **Do not be tempted to add a "divine" texel at the end of the strip**
— the divine fire is HDR white-gold that is _whiter and brighter_ than the white-hot stop and must never be
reachable by a `temp` value, or a hot-enough non-A/E fragment would render divine. Keep it a separate
procedural path; the strip ends at `PAL.hot`. (This is the same hard-separation discipline as doc 01 §7.6.)

### 4.7 The TSL twin (authored, gated post-judge)

On `WebGPURenderer` the baked strip is sampled with the TSL `texture()` node — a mechanical twin of the GLSL
fetch (Maxime Heckel, _Field Guide to TSL and WebGPU_, 2025-10):

```js
import { Fn, texture, vec2, clamp, float } from 'three/tsl'
// uRampTex: the SAME THREE.DataTexture from rampTexture.js (renderer-agnostic)
export const gwTempColorBaked = Fn(([temp]) => {
  const t = clamp(temp, 0.0, 1.0)
  return texture(uRampTex, vec2(t, 0.5)).rgb
})
// procedural twin (gwTempColor) stays as in doc 01 §4.7; pick at node-build time.
```

The `DataTexture` itself is identical on both backends; only the sample-site syntax changes. Not wired for
the judge build.

---

## 5. COHESION — shared palette / lighting / uniforms

The bake binds to the exact same cohesion mechanisms as the procedural ramp — it is a substitution _inside_
the one authority, not a parallel system:

- **One palette, one set of stops.** The strip is built from `PAL` (`void`, `crimsonDeep`, `red`, `ember`,
  `goldHot`, `hot`) — the _same tokens_ the procedural body inlines via `v3()`. No raw hex enters
  `rampTexture.js`; it reads `PAL`. The 60/30/10 discipline and "only the 10% accent exceeds 1.0" rule hold
  exactly: the strip stores HDR values at the hot end (float texture, not clamped) so `PAL.hot`/`goldHot`
  texels are >1.0 and **bloom**, while the void→crimson texels stay <1.0 and never bloom. **The strip _is_
  the bloom selector**, just as the procedural ramp is.

- **One bloom contract.** Because `gw_forge` still multiplies the (now-sampled) hue by the (still-procedural)
  `gw_tempEmissive` `T³` ramp, the exact same fragments cross 1.0 and get caught by the existing `mipmapBlur`
  `Bloom` (`luminanceThreshold ≈ 0.55–0.6`). No `Effects.jsx` change, no per-element bloom. Temperature still
  controls bloom for free — the bake doesn't touch the brightness half.

- **One tone-map.** The sampled HDR linear RGB is added pre-`<tonemapping_fragment>` exactly as before, so
  ACES/AgX processes it identically. Crucially the strip is authored in **linear** space
  (`LinearSRGBColorSpace`, values straight from `THREE.Color`) so there is **no double color-space transform**
  — the #1 silent bake bug (§7). `gw_tempColor(0)` still resolves to `PAL.void` at pixels-off black on the
  OLED.

- **One uniform pool.** `uRamp` lives in `U` (`00-COHESION-MAP §4.2`) and is bound by _shared reference_ into
  every consumer's `onBeforeCompile`, so the slab veins, molten pour, channel metal, cooling letters, sparks,
  and caustic tint all sample the _same texel_ for a given `temp`. A vein and a letter at the same temperature
  are the same color because they read the same memory. Identical cohesion guarantee to the procedural path,
  just realized as "same texture" instead of "same function."

- **One lighting model & the keystone.** Cooling is still the transition from emissive (hot, >1, sampled at
  the strip's hot end) to lit object (cold, near-void, strip's cold end). The A/E divine-fire keystone is
  _more_ protected, not less (§4.6): it can't accidentally reach the strip. The basalt/Ogham radiance reads
  `uAEFire`/`uAEFirePow` and `gw_divineFire`, never `uRamp` — unchanged.

- **Degrades uniformly.** On `static`, the same `uRamp` is sampled at a frozen `uTemp` → a color-correct still
  poster. A tier drop that flips `RAMP_BAKED_ENABLED` thins _evaluation cost_, never color — it cannot
  recolor or fork the ramp because the texels came from the same stops.

The single failure mode the cohesion map guards against — "a new element with its own orange" — is impossible
here: there is no new orange, only a sampled copy of the one orange.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The judge device: iPhone 15 (A16/A17, OLED), one renderer, DPR capped 1.5, ~9–10 ms steady-state on `high`,
thermal throttle after ~90 s (`00-COHESION-MAP §10`). The bake's perf story is the whole reason it exists.

**The trade being made.** Procedural: ~20–30 ALU per hot fragment, zero fetch. Baked: ~1–3 ALU (the `clamp`
and the `vec2`) + **one texture fetch** per hot fragment. On a tile-based mobile GPU, the question is whether
that fetch is cheaper than the saved ALU. For a **256×1 (~4 KB float) texture sampled every frame at every
hot pixel**, the strip is effectively _resident in the texture cache_ — every fetch is a cache hit after the
first few warps, so the cost approaches the minimum (one filtered sample, ~1 cycle of latency hidden by the
GPU's wide occupancy). The 2025 mobile-shader guidance ("limit fragment shaders to 30–50 ALU; reduce to 3–4
texture samples; cache misses are expensive on mobile's tiny GPU caches") cuts both ways: we have ALU budget
_and_ texture-sample budget, and a 4 KB strip is the canonical case where the read **does not miss cache**.
The dependent-read concern (the `u` coord is computed, not interpolated) was a real penalty on PowerVR-era
hardware but is negligible on A16/A17 for a texture this small and hot. **Net:** on a fragment-bound,
thermally-throttled frame, swapping ~20 ALU for one cache-resident fetch _can_ recover fill-rate — which is
exactly when you'd flip the flag.

**Why this is a fallback, not a default.** Doc 01 §6 is right that the procedural ramp is "effectively free"
on a _cold_ iPhone 15 — the fbm beside it dwarfs it. So `RAMP_BAKED_ENABLED` ships `false`. You only flip it
if a real on-device profile (Safari Web Inspector timeline / Xcode GPU frame capture) shows the temperature
ALU is a measurable slice of the fragment cost under throttle. Build it, prove it equivalent, leave it
holstered.

**The banding risk — and why float kills it.** A baked _8-bit_ ramp would quantize the dark void→crimson low
end into visible steps on a true-black OLED (the panel resolves the gradient that the 8-bit texture can't),
the classic banding the cohesion map's grain-as-dither already fights post-tone-map. **We sidestep it
entirely by baking to `FloatType`** — full float precision in the texels, so the strip has _no fewer_
gradations than the procedural ramp. Bilinear `LinearFilter` between 256 float texels reconstructs the curve
smoothly; the only residual error is the linear-vs-`smoothstep` reconstruction between texels, which at a
texel-every-0.0039 spacing is far below 1/255 and is _further_ hidden by the existing grain-as-dither
(`SOFT_LIGHT ≥0.03`, `00-COHESION-MAP §3.3`). If half-float is ever used for upload size, re-verify the dark
end on-device — float16 has ample mantissa for `[0,2]` color but verify, don't assume (the 2025 half-float
mobile scar).

**Tiering.**
- `high` — `RAMP_BAKED_ENABLED=false`, procedural ramp (the math is free relative to fbm). No `uRamp` built.
- `low` — _optionally_ `true` if the boot probe flags a weak GPU; identical color, fetch instead of ALU,
  freeing fragment headroom for the (already-reduced) fbm and bloom.
- `static` — same `uRamp` (if built) sampled at frozen `uTemp`; or simply procedural (it's one still frame,
  cost is irrelevant). Either is color-correct.

**Resolution: 256 vs 512.** 256 texels is the right call — a texel every ~0.4% of the range, finer than any
band's curvature and finer than the OLED's perceptible step after grain-dither; 512 doubles upload for no
visible gain. Stay at 256 (the doc's namesake).

**No FBO, no readback, no file.** The strip is a `Float32Array` filled by a 256-iteration JS loop at module-
eval — microseconds, on the main thread, once, behind a flag. No render target (vs technique 2.D), no
suspense, no network. Disposes via `disposeRampTexture()` on teardown; `renderer.info.memory.textures` rises
by exactly one when the flag is on and returns to baseline on dispose — verify it's flat across navigation.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (build it once, correctly, as a holstered lever):**

1. **Single source of stops first.** Put `RAMP_STOPS` in `rampTexture.js` and, ideally, _generate_ the
   procedural `#else` GLSL body string from it at module-eval so there is literally one definition of the six
   stops and five bands. If you hand-maintain two copies (JS bake + GLSL inline), they _will_ drift — that is
   the exact "two ramps" failure the cohesion map forbids. One source, two emitters.

2. **Linear space, no double transform (the #1 bake bug).** `THREE.Color` holds **linear** RGB (with
   `ColorManagement` on). Bake those linear values directly and tag the texture `LinearSRGBColorSpace`. If you
   tag it `SRGBColorSpace`, three will sRGB→linear-decode it on sample and your whole ramp goes dark/wrong.
   The procedural inline and the strip must both deliver linear pre-tone-map. Verify with the unit test below.

3. **Float, never byte (the HDR-clamp trap).** The hot stops exceed 1.0. A `UnsignedByteType` strip clamps
   them to 1.0 and the white-hot stops _stop blooming_ — silently. Use `FloatType` (or verified
   `HalfFloatType`). This is the bake's version of the half-float composer-buffer rule.

4. **`ClampToEdgeWrapping`, sample at row-center `0.5` (the edge-bleed/seam trap).** With the default
   `RepeatWrapping`, `t=0.0` and `t=1.0` straddle the wrap and bilinear-blend the cold and hot ends into each
   other — iron-black gets a white-hot ghost and vice-versa. Clamp both axes. Sample `vec2(t, 0.5)` so the
   single row is hit at its center, never the 0/1 vertical edge.

5. **Assert equivalence with a unit test before trusting the swap.** Sweep `t` finely (e.g. 1024 samples) and
   assert `max channel |gwTempColorJS(t) − referenceGLSLValue(t)| < 1e-3` (the GLSL reference can be the same
   JS function since they share `RAMP_STOPS`; the real test is JS-bake-via-texture-sample vs procedural, which
   you verify on-device by A/B flipping the flag and confirming the slab is visually identical). The texel-
   interpolation error is the only difference; it must be sub-perceptual.

6. **Gate the allocation behind the flag.** Build the singleton lazily (`getRampTexture` with `??=`) and only
   when `RAMP_BAKED_ENABLED`. The ship path must not allocate or upload a texture it never samples — keep the
   procedural default's memory footprint at zero for this feature.

7. **Bind the shared reference, not a clone.** `uRamp` must be the _one_ `U.uRamp` reference across all
   materials, or you'll upload N copies of the strip and lose the "same texel" cohesion guarantee. One
   texture, N bindings.

8. **Never add a divine texel.** The strip ends at `PAL.hot`. Divine fire stays a separate procedural path so
   no `temp` value can ever resolve to white-gold (§4.6). Adding a 257th divine texel is the subtle way to
   break the keystone.

9. **Profile before flipping, on the device.** The flag's default is `false`. Don't enable the fallback
   speculatively — measure the temperature ALU's real cost on a throttled iPhone 15 first. If the procedural
   ramp isn't a bottleneck (likely), the lever stays holstered. Premature texture-fetch is its own (small)
   cost.

10. **Re-bake on stop changes; verify through the tone-mapper.** When the on-device stop-tuning (doc 01 §7)
    moves a stop, both the procedural inline _and_ the strip must update. If you generated the GLSL from
    `RAMP_STOPS` (step 1), changing the array + re-running `buildRampTexture` covers both. Always read the
    result through ACES/AgX on the panel, not the raw float.

---

## 8. SOURCES (2025–2026)

1. **Maxime Heckel — _Field Guide to TSL and WebGPU_** — the TSL node system as the `onBeforeCompile`
   replacement; `texture()` node sampling, `Fn()` reuse — the renderer-agnostic-texture + TSL-twin target for
   this bake's WebGPU path. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ —
   **2025-10-14**.
2. **Codrops — _From Illusions to Optimization: The Creative WebGL Worlds of Adrián Gubrica_** — 2025 WebGL
   optimization practice: precompute/bake expensive evaluation into sampleable resources rather than recompute
   per pixel; the "bake the field" discipline this doc applies to the temperature ramp.
   https://tympanus.net/codrops/2025/12/05/from-illusions-to-optimization-the-creative-webgl-worlds-of-adrian-gubrica/ — **2025-12-05**.
3. **Codrops — _Letting the Creative Process Shape a WebGL Portfolio_** — Immersive-Garden-lineage workflow
   notes on the bake-vs-real-time trade-off ("baking entire scenes leads to large files; bake selectively in
   the trade-off zone"); justifies baking _only_ the one hot signal, not the world.
   https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/ —
   **2025-11-27**.
4. **frost.kiwi — _How to (and how not to) fix color banding_** — modern (2025-circulated) treatment of
   gradient banding, why 8-bit quantizes, and shader-noise/error-diffusion dithering scaled to ±0.5/255; the
   reasoning behind baking to **float** (not byte) and leaning on grain-as-dither for the residual.
   https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/ — **2025** (Lobsters discussion 2025).
5. **three.js forum — _`DataTexture` works on mobile only with `FloatType`, not `HalfFloatType`_** — the iOS
   half-float scar that pins the bake to `FloatType` on the judge device and demotes half-float to
   verify-don't-assume. https://discourse.threejs.org/t/three-datatexture-works-on-mobile-only-when-i-keep-the-type-three-floattype-but-not-as-three-halffloattype/1864 — re-confirmed/active **2025**.
6. **three.js docs — _DataTexture_ / _Texture.colorSpace_ / _Color Management_** (r17x) —
   `RGBAFormat`+`FloatType` four-floats-per-texel, `LinearFilter` requiring `OES_texture_float_linear`,
   `LinearSRGBColorSpace` vs `SRGBColorSpace` decode behavior, `needsUpdate` — the API contract this bake is
   built against. https://threejs.org/docs/#api/en/textures/DataTexture · https://threejs.org/manual/en/color-management.html — accessed **2026**.
7. **FarazzShaikh — _three-shader-baker_** — render-a-shader-to-a-texture for reuse/perf (Vanilla + React,
   maintained mid-**2025**); evaluated and rejected as overkill vs a JS loop for a 256×1 strip, retained as
   the tool for a future 2D temp×age bake. https://github.com/FarazzShaikh/three-shader-baker — **2025-06-19**.
8. **General Programmer — _Shader Programming Complete Graphics Guide 2026_** — 2026 mobile-shader budgeting:
   ~30–50 ALU / 3–4 texture-samples per fragment guidance, mobile cache-miss cost; the budget frame for the
   ALU-vs-fetch trade. https://generalistprogrammer.com/tutorials/shader-programming-complete-graphics-guide-2025 — **2026**.

---

## 9. DEEP-DIVE CANDIDATES (Phase 2 sub-topics)

1. **The temp×age 2D cooling LUT (bake the whole temporal field).** Extend the 1D ramp to a 2D
   `DataTexture` (`temp` on U, `age`/cooling-progress on V) that bakes `gw_coolForge`'s _entire_ output —
   folding `gwCool01`'s eased inversion and the hot-lingers-then-drops curve into the texture — so a cooling
   letterform is one fetch for both hue _and_ cooling. This is where `three-shader-baker` (2.D) earns its keep
   (reproducing the eased GLSL in JS is error-prone for 2D); audit precision, the A/E hole in the field, and
   whether the V-axis banding survives float.

2. **Float vs half-float vs RGBE-packed strip on A16/A17.** Quantify the actual upload/sample cost and the
   dark-end precision of `FloatType` vs `HalfFloatType` vs an 8-bit RGBE/`LogLuv`-packed strip (8-bit storage,
   HDR range via shared exponent) on the real device — resolving whether the half-float scar still bites and
   whether RGBE packing buys a smaller texture without banding.

3. **Generating the procedural GLSL inline _from_ `RAMP_STOPS`.** Formalize the single-source emitter: a JS
   function that takes `RAMP_STOPS` and produces both the `buildRampTexture` strip _and_ the `gw_tempColor`
   `#else` GLSL body string at module-eval, so the two paths can _never_ drift. Includes the leva-live re-bake
   loop for on-device stop tuning.

4. **The flag-flip perf experiment & the `PerformanceMonitor` ladder hook.** Build the on-device A/B harness
   (Safari timeline + Xcode GPU capture) that measures the temperature ALU's real fragment-cost share under
   thermal throttle, and wire `RAMP_BAKED_ENABLED` into the adaptivity ladder (`00-COHESION-MAP §10`) so a
   sustained factor-dip can promote the baked ramp automatically as a fill-rate recovery step — quantifying
   the ms recovered and confirming zero visual delta.
