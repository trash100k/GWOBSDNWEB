# 50 — TSL-Portable Refactor of the Master Shader (the GLSL↔TSL sibling pair)

_Phase 2 deep-dive · GAELWORX forge world · cluster **H-webgpu-tsl-future** · target: iPhone 15 OLED, one
WebGL renderer (r3f + three.js), `MeshPhysicalMaterial.onBeforeCompile` chunk injection today · files under
the knife: `src/scene/shaders.js`, `src/scene/temperature.js`, and a new staged sibling `src/scene/tsl/`_

> **Reads on top of `00-COHESION-MAP.md` (§1 master temperature, §2 the shared noise basis, §10 the perf
> budget / WebGPU-is-a-gated-upgrade clause), `phase1/30` (the renderer-stack verdict — ship WebGL2, author
> TSL-portable), `phase2/01` (the five-symbol `temperature.js` authority every hot material inlines), and
> `phase2/07` (the rotated-octave fbm toolkit grow — `gw_fbmR`/`gw_fbm3`/`gw_warp` with the `GW_FBM_OCTAVES`
> knob).** Where `phase1/30` *decided* "TSL-portability is cheap insurance and we take it now" and named this
> as deep-dive 9.1, **this document is the actual insurance policy**: the exact engineering by which
> `gw_fbm`, the vein composite, the temperature ramp, and the iridescence become pure functions with a single
> octave knob, each with a mechanical GLSL↔TSL sibling, plus the method that *proves* the look is byte-for-byte
> identical across the WebGL2-GLSL and WebGPU-WGSL backends on the judge device. It does not change what
> ships. It changes *how the shipped GLSL is written* so a future `WebGPURenderer` build is a re-host, not a
> rewrite.

---

## 1. SCOPE

GAELWORX is one molten-forge world built on **one master temperature/material/noise/lighting system** — every
element (obsidian veins, the channel pour, letterform fill, the divine-fire A+E, sparks, heat haze, the
basalt reveal) samples the *same* functions at *different* inputs so nothing looks bolted-on (`00 §0`). The
language that system is written in is, today, GLSL injected via `onBeforeCompile` (`shaders.js`,
`temperature.js`). The renderer-stack verdict (`phase1/30 §3`) is locked: **WebGL2 ships to the judge; WebGPU
+ TSL is a gated, post-judge upgrade.** That verdict has a rider — the one thing we *do* now, before the judge
— and this doc owns it: **author the master shader so the eventual WebGPU/TSL port is a re-host, not a
rewrite.**

The scope is narrow and load-bearing. It is **not** "migrate to WebGPU" (that's `phase1/30`'s gated future,
and the explicit anti-pattern is betting the judge phone on the less-tested `WebGPURenderer` WebGL2-fallback
branch — `00 §10`). It is the discipline that makes that migration *cheap if and when we choose it*:

1. **Pure-function factoring.** `gw_fbm`/`gw_fbmR`/`gw_warp` (noise), `gw_tempColor`/`gw_tempEmissive`/
   `gw_forge`/`gwCool01`/`gw_divineFire` (temperature, `phase2/01`), and the vein + **iridescence** composite
   become small pure functions of floats/vecs — no uniform reads, no varying dependencies, no chunk-name
   coupling inside the math. Purity is what makes a GLSL function mechanically twin-able to a TSL `Fn()`
   (`phase2/01 §1`, `phase2/07 §2.5`).
2. **One knob: `GW_FBM_OCTAVES`.** A single compile-time octave count drives detail on *both* stacks — a
   `#define` that unrolls in GLSL (`phase2/07 §4.4`), a JS constant that bounds a TSL `Loop()`. The cohesion
   hinge (`00 §2`) survives the port byte-for-byte.
3. **The GLSL↔TSL sibling pair.** For every shipped GLSL function, a TSL `Fn()` twin staged in `src/scene/tsl/`
   that is *not bundled at runtime today* (tree-shaken; the judge build never imports `three/tsl`), so the
   port is "swap the import, not rewrite the math."
4. **Byte-identical proof.** A repeatable A/B harness — same uniforms, same inputs, difference image — that
   demonstrates the WGSL output matches the GLSL output within tolerance on iPhone 15, so we *know* the port
   preserves the world's identity (the brand-law fire hue, the black point, the bloom-selecting palette).

The single failure this guards against is the one `phase1/30 §7` names: **a WebGPU build that shifts the fire
hue, the black point, the bloom threshold, or the grain breaks cohesion.** The brand values are shader
*constants*, not API behavior; the proof harness is how we hold the port to them.

Out of scope (own deep-dives): the compute-spark/fluid benchmark (`phase1/30` 9.2), the TSL `PostProcessing`
parity with the pmndrs `EffectPass` (`phase1/30` 9.3), the iOS-Safari WebGPU stability matrix (`phase1/30`
9.4). This doc owns the **material-shader math** port seam only.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The 2025-2026 question is settled in principle ("TSL lowers one source to GLSL on `WebGLRenderer` and WGSL on
`WebGPURenderer`" — three.js docs, every source below) and unsettled in *practice* (how do you factor *existing*
GLSL so the port is mechanical, and how do you prove the look survived?). Four patterns are viable.

### 2.1 Dual-source by hand: keep GLSL, hand-write a TSL twin (the pick)

Two files per function: the shipped GLSL string (`shaders.js`/`temperature.js`) and a hand-written TSL `Fn()`
sibling (`tsl/`) with the *same name, same parameters, same constants, same octave knob*. The TSL twin is
**not imported by the judge build** — Vite tree-shakes it because nothing on the WebGL2 path references
`three/tsl`. When WebGPU is flipped on (`phase1/30 §4.3` capability gate), the GPU materials import the twins
instead of injecting the strings.

The TSL authoring model maps the GLSL almost mechanically. The 2026 first-class API (`three/tsl`, stable as of
r184 — LearnWithHasan r184 shaders guide, 2026; three.js TSL docs) gives you `Fn(([args]) => …)` for reusable
functions, `float()/vec2()/vec3()` constructors, `.toVar()` for mutable locals, `Loop({start,end}, () => …)`
for octave loops, `.addAssign()/.mulAssign()/.assign()` for in-place mutation, and `mix/smoothstep/pow/dot/
normalize/clamp` as method-chain or free functions. Critically, **MaterialX noise ships built in** —
`mx_noise_float(vec3)` is a drop-in for our Ashima `gw_snoise`, and `mx_fractal_noise_float(p, octaves,
lacunarity, gain)` is a built-in fBm (Three.js Roadmap "10 Noise Functions for Three.js TSL Shaders", Dec
2025; three.js TSL docs). So the noise twin can either (a) re-host our exact Ashima simplex as a `Fn()` for
*byte-identical* output, or (b) call the built-in MaterialX noise for *fewer lines but a different field*. The
choice matters for the proof (§2.4) and is the central tradeoff of this doc (§3).

**Tradeoffs:** zero runtime cost today (twin tree-shaken), zero new dep on the judge build, the GLSL stays the
known-good shipped path. The cost is *maintenance*: two sources to keep in sync until the port. That cost is
bounded because the functions are small and pure, and a CI snapshot test (§4) flags drift.

### 2.2 TSL-only, lowered to GLSL on `WebGLRenderer` today (rejected for the judge)

Write the master system *only* in TSL and run it on the classic `WebGLRenderer` now, letting TSL lower to GLSL.
This is the "author once, run anywhere" dream and is genuinely viable in 2026 (TSL lowers to GLSL on
`WebGLRenderer` — three.js docs; threejsroadmap "TSL: A Better Way to Write Shaders"). **But** it forces the
node material grammar (`MeshPhysicalNodeMaterial`, `colorNode`/`emissiveNode`) onto the *current* build, which
means abandoning the proven `onBeforeCompile` injection the whole repo standardizes on, retiring the pmndrs
`EffectPass` finish wiring, and shipping the TSL→GLSL transpiler in the critical path to the judge. `00 §10`'s
clause is explicit: the judged build is classic WebGL2 + `onBeforeCompile`; introducing the TSL transpiler as
the *production* path on the judge device trades known-good for novel with no fill-rate payoff (`phase1/30
§2.6`). Rejected: too much surface area, no upside before the judge.

### 2.3 `CustomShaderMaterial` (FarazzShaikh) as a halfway house (noted, not picked)

`THREE-CustomShaderMaterial` lets you extend `MeshPhysicalMaterial` with `csm_*` outputs instead of `.replace()`
surgery (`phase2/01 §2.C`). It is *closer* to the node grammar than raw `onBeforeCompile` and would make a
later TSL port marginally more mechanical. But it is a new dependency, changes the construction grammar the
repo already standardized, and does nothing for the GLSL↔WGSL portability that is the actual prize here. Noted
as a future ergonomics cleanup, not part of this insurance policy.

### 2.4 The proof problem: built-in MaterialX noise vs re-hosted Ashima (the 2025-2026 crux)

This is the part the survey docs under-specified and this deep-dive must nail. "Byte-identical across backends"
has **two** meanings, and they pull apart:

- **Backend-identical:** the *same TSL graph* compiled to WGSL vs GLSL produces the same image. This is
  TSL's promise and is largely true — but **not unconditionally**. The community has logged concrete
  divergences: WGSL is stricter about types and layout, and some constructs compile on GLSL but error or
  differ on WGSL (e.g. three.js issue #31452, "WGSL compiler error when layout is used, GLSL is OK", 2025;
  the threejsroadmap "Getting AI to Write TSL That Works" 2026 piece catalogues the `toVar`/swizzle/assign
  footguns that bite when a node is treated as mutable without `.toVar()`). So backend-identity must be
  *verified per function*, not assumed.
- **Cross-language-identical:** our *current GLSL* (Ashima simplex) vs the *future TSL* twin produces the same
  image. This is only true if the TSL twin re-hosts the *same Ashima math*. If the twin instead calls the
  built-in `mx_noise_float` (MaterialX gradient noise) or `mx_fractal_noise_float`, the *field is different* —
  different lattice, different spectral content — so the veins, the molten churn, and the basalt would all
  *shift* on the port. That is exactly the cohesion break `phase1/30 §7` forbids.

The 2026 references make both halves concrete. Maxime Heckel's *Field Guide to TSL and WebGPU* (Oct 14, 2025)
demonstrates a hand-transpiled Perlin noise driving a `positionNode` precisely because the author wanted the
*specific* field, not the built-in — the canonical pattern for cross-language identity. Codrops's *Interactive
Text Destruction with Three.js, WebGPU, and TSL* (Jul 22, 2025) and *Rendering a Procedural Vortex … with
Three.js and TSL* (Mar 10, 2025) both use TSL `Loop()` + 3D noise for fBm/warp fields structurally identical
to our molten-in-channel composition — confirming the `Fn()`+`Loop()` factoring is the modern idiom. The
verdict this forces (§3): **re-host the Ashima math in the TSL twin for the hero fields** (so the port is a
look-preserving re-host), and *reserve* the built-in MaterialX noise for new, never-shipped-on-GLSL effects
where a field shift is harmless.

### 2.5 The summary tradeoff table

| Approach | Look preservation on port | Judge-device cost today | Maintenance | Verdict |
|---|---|---|---|---|
| **Dual-source, re-hosted Ashima twin** | **Byte-near-identical** (same math) | **Zero** (twin tree-shaken) | Two small pure sources in sync | **Pick** |
| Dual-source, built-in `mx_noise` twin | Field *shifts* (different lattice) | Zero | Less code, but breaks cohesion | Only for new effects |
| TSL-only on `WebGLRenderer` now | N/A (one source) | High (transpiler + grammar swap on judge) | One source | Rejected (no upside pre-judge) |
| `CustomShaderMaterial` halfway | Marginal | New dep, grammar churn | Medium | Future ergonomics, not now |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Refactor the shipped GLSL into small pure functions parameterized by the single `GW_FBM_OCTAVES` knob, and
stage a hand-written TSL `Fn()` sibling for each that re-hosts the *same Ashima math and same brand constants*
in `src/scene/tsl/` — tree-shaken out of the judge build. Prove cross-backend look-identity with a
difference-image harness on iPhone 15. Re-host (don't built-in-replace) the hero noise; reserve
`mx_noise_float` for new WebGPU-only effects.** Justification, rooted in the world and the constraints:

1. **It changes nothing that ships.** The judge build stays exactly `phase1/30 §3`: WebGL2 + classic
   `WebGLRenderer` + `onBeforeCompile` GLSL. The TSL twins are dead code on that path (no `three/tsl` import →
   Vite tree-shakes). Zero bundle cost, zero runtime risk, zero new dep on the judge device.

2. **Purity is the port seam.** Because the functions read no uniforms and no varyings (`phase2/01 §1`,
   `phase2/07 §4.6` — the toolkit owns no uniforms, consumers own them), each has a *mechanical* TSL twin:
   GLSL `for` → TSL `Loop()`, GLSL `mat2` constant → TSL `mat2()` node, GLSL float locals → `.toVar()`. The
   math is identical; only the syntax changes. This is the "re-host not rewrite" promise made literal.

3. **One knob holds on both stacks.** `GW_FBM_OCTAVES` is the cohesion hinge (`00 §2`): a `#define` that
   unrolls with zero runtime branch in GLSL (`phase2/07 §4.4`), and a JS constant bounding `Loop({end: OCT})`
   in TSL. A tier drop thins *all* detail uniformly on either backend — the degrade-uniformly law (`00 §7`
   rule 9) survives the port.

4. **Re-hosting the Ashima math preserves the world's identity.** The built-in `mx_noise_float` is tempting
   (fewer lines) but produces a *different field* (§2.4) — porting to it would shift every vein, churn, and
   basalt grain, breaking cohesion. We re-host the exact simplex so the molten metal *is the same metal* after
   the port. The built-in MaterialX noise is reserved for *new* WebGPU-only effects (compute-spark turbulence,
   fluid) where there's no GLSL original to match.

5. **The proof is the deliverable, not a nicety.** "TSL-portable" is worthless if the port silently shifts the
   fire hue or the black point. The difference-image harness (§4.4) turns "should be identical" into "is
   identical within tolerance, verified on the device" — the only standard the brand law accepts.

**In one line:** *every shipped GLSL function gets a pure-function shape, a single octave knob, and a
look-matched TSL twin in cold storage — so flipping to WebGPU is a verified re-host, and the world's fire,
black, and bloom survive it untouched.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Now (judged build):** `three` r17x/r18x (classic `WebGLRenderer` via `@react-three/fiber` v8),
  `@react-three/drei`, `@react-three/postprocessing` + `postprocessing` (pmndrs). **No new runtime dep.** The
  TSL twins live in the repo but are never imported on this path.
- **Staged (post-judge, behind the `gw_webgpu` flag — `phase1/30 §4.3`):** `three/tsl` (`Fn`, `uniform`,
  `float`/`vec2`/`vec3`, `Loop`, `mix`, `smoothstep`, `pow`, `dot`, `normalize`, `mx_noise_float`,
  `mx_fractal_noise_float`), `three/webgpu` (`MeshPhysicalNodeMaterial`), `@react-three/fiber` **v9** (async
  `gl` + `extend(three/webgpu)`). Pin r184+ for stable first-class TSL.
- **Reference only (never bundled):** Ashima `webgl-noise` (the simplex source both stacks re-host), IQ
  `articles/fbm` + `articles/warp` (the rotation/warp recipe), Heckel field guide (the hand-transpile pattern).

### 4.2 The file layout (the port seam, made physical)

```
src/scene/
  shaders.js            # GLSL strings — SHIPPED today (gw_snoise, gw_fbm, gw_fbmR, gw_fbm3, gw_warp, gw_caustic)
  temperature.js        # GLSL string  — SHIPPED today (gw_tempColor … gw_divineFire, phase2/01)
  tsl/                  # TSL twins — STAGED, tree-shaken out of the judge build
    noise.tsl.js        #   gwSnoise, gwFbm, gwFbmR, gwFbm3, gwWarp, gwCaustic (re-hosted Ashima)
    temperature.tsl.js  #   gwTempColor, gwTempEmissive, gwForge, gwCool01, gwDivineFire, gwIridescence
    octaves.js          #   export const GW_FBM_OCTAVES = { high:3, low:3, static:2 }  (shared by BOTH)
  parity/               # the proof harness (dev-only, never shipped)
    parity.test.js      #   headless render GLSL vs TSL→GLSL, diff image
```

`octaves.js` is the one file *both* stacks import — the GLSL `#define` is generated from it at injection time,
the TSL `Loop()` bound reads it directly. One knob, one source, two backends.

### 4.3 The sibling pair — exact code

**Noise (the hero field — re-hosted, look-matched). GLSL today (`shaders.js`, from `phase2/07 §4.2`):**

```glsl
#ifndef GW_FBM_OCTAVES
  #define GW_FBM_OCTAVES 3
#endif
const mat2 GW_ROT = mat2(0.80, 0.60, -0.60, 0.80);   // IQ inter-octave decorrelation

float gw_fbmR(vec2 p){                 // rotated-octave fBm — the new-consumer successor (phase2/07)
  float s = 0.0, a = 0.5;
  #pragma unroll_loop_start
  for (int i = 0; i < GW_FBM_OCTAVES; i++){
    s += a * gw_snoise(p);
    p  = GW_ROT * p * 2.03 + vec2(11.3, 7.7);
    a *= 0.5;
  }
  #pragma unroll_loop_end
  return s;
}
```

**TSL twin (`tsl/noise.tsl.js`) — same constants, same lacunarity, same offset, same octave knob:**

```js
import { Fn, float, vec2, mat2, Loop } from 'three/tsl'
import { gwSnoise } from './snoise.tsl.js'          // re-hosted Ashima simplex (look-matched)
import { GW_FBM_OCTAVES } from './octaves.js'

const GW_ROT = mat2(0.80, 0.60, -0.60, 0.80)        // identical constant → identical lattice march

export const gwFbmR = /*#__PURE__*/ Fn(([p, tier]) => {
  const s = float(0).toVar()
  const a = float(0.5).toVar()
  const q = p.toVar()                                // MUST .toVar() — p is immutable otherwise (§7)
  Loop({ start: 0, end: GW_FBM_OCTAVES[tier ?? 'high'] }, () => {
    s.addAssign(a.mul(gwSnoise(q)))
    q.assign(GW_ROT.mul(q).mul(2.03).add(vec2(11.3, 7.7)))
    a.mulAssign(0.5)
  })
  return s
})
```

Line-for-line the same math: `0.5` start amplitude, `2.03` lacunarity, `vec2(11.3,7.7)` offset, the same
`GW_ROT`. The only differences are syntax (`.addAssign` vs `+=`, `Loop` vs `for`) and the octave bound source
(`#define` vs the shared `octaves.js`). **This is what "re-host" means.**

**Temperature ramp (the brand-law authority — `phase2/01`). GLSL today (`temperature.js`):**

```glsl
vec3 gw_tempColor(float temp){
  float t = clamp(temp, 0.0, 1.0);
  vec3 c = mix(IRON_BLACK, DULL_RED, smoothstep(0.00, 0.22, t));
  c = mix(c, FORGE_RED, smoothstep(0.18, 0.45, t));
  c = mix(c, EMBER,     smoothstep(0.42, 0.66, t));
  c = mix(c, GOLD,      smoothstep(0.64, 0.85, t));
  c = mix(c, WHITE_HOT, smoothstep(0.82, 1.00, t));
  return c;
}
float gw_tempEmissive(float temp){ float t = clamp(temp,0.,1.); return pow(t,3.0)*2.6 + t*0.12; }
vec3  gw_forge(float temp){ return gw_tempColor(temp) * gw_tempEmissive(temp); }
vec3  gw_divineFire(float flick){ return PAL_DIVINE * (1.0 + flick*0.18); }   // ignores temp, never cools
```

**TSL twin (`tsl/temperature.tsl.js`) — the *same six stops*, the same `T³` ramp, the same divine constant:**

```js
import { Fn, float, vec3, mix, smoothstep, pow, clamp, uniform } from 'three/tsl'
import { PAL } from '../palette.js'                  // ONE palette, both stacks (§5)

const IRON_BLACK = vec3(...PAL.void), DULL_RED = vec3(...PAL.crimsonDeep)
const FORGE_RED  = vec3(...PAL.crimson), EMBER  = vec3(...PAL.ember)
const GOLD = vec3(...PAL.gold), WHITE_HOT = vec3(...PAL.hot), PAL_DIVINE = vec3(...PAL.divine)

export const gwTempColor = /*#__PURE__*/ Fn(([temp]) => {
  const t = clamp(temp, 0, 1)
  const c = IRON_BLACK.toVar()
  c.assign(mix(c, DULL_RED,  smoothstep(0.00, 0.22, t)))
  c.assign(mix(c, FORGE_RED, smoothstep(0.18, 0.45, t)))
  c.assign(mix(c, EMBER,     smoothstep(0.42, 0.66, t)))
  c.assign(mix(c, GOLD,      smoothstep(0.64, 0.85, t)))
  c.assign(mix(c, WHITE_HOT, smoothstep(0.82, 1.00, t)))
  return c
})
export const gwTempEmissive = /*#__PURE__*/ Fn(([temp]) => {
  const t = clamp(temp, 0, 1); return pow(t, 3.0).mul(2.6).add(t.mul(0.12))
})
export const gwForge      = /*#__PURE__*/ Fn(([temp]) => gwTempColor(temp).mul(gwTempEmissive(temp)))
export const gwDivineFire = /*#__PURE__*/ Fn(([flick]) => PAL_DIVINE.mul(float(1).add(flick.mul(0.18))))
```

The six brand stops are *identical bytes* (both inline `PAL`), the `T³·2.6 + t·0.12` brightness is identical,
and `gwDivineFire` ignores temperature on both — the keystone exception (`00 §1.4`) survives the port. A
WebGPU build that reproduces these is, by construction, hue-identical and black-point-identical.

**Iridescence (the fire-opal play-of-color on the obsidian veins — `CLAUDE.md` "iridescent play-of-color").**
The vein iridescence is a thin-film-style cosine palette keyed on a fresnel/`view·normal` term plus the noise
field, so the warm body gets a faint shifting peacock sheen *only on the cool band* (it must not fight the hot
emissive). As a pure function:

```glsl
// GLSL today — IQ cosine palette, gated to the cool band so it never competes with gw_forge
vec3 gw_iridescence(float drive, float cool){          // drive ∈ [0,1] phase, cool = 1-temp (cold only)
  vec3 a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d = vec3(0.00, 0.33, 0.67);
  vec3 sheen = a + b * cos(6.28318 * (c * drive + d));  // play-of-color
  return sheen * cool * uIrid;                          // uIrid = per-route preset (scenes.js)
}
```
```js
// TSL twin — same cosine-palette coefficients, same cool-band gate
export const gwIridescence = /*#__PURE__*/ Fn(([drive, cool, uIrid]) => {
  const a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d = vec3(0.00, 0.33, 0.67)
  const sheen = a.add(b.mul(cos(float(6.28318).mul(c.mul(drive).add(d)))))
  return sheen.mul(cool).mul(uIrid)
})
```

The iridescence is the one composite where the *gate* matters most: it is multiplied by `cool = 1-temp`, so it
**vanishes in the hot band** and lives only on cooled iron — preserving the "only the 10% accent blooms" law
(`00 §3.1`). Both twins share the gate, so the port can't accidentally light up iridescence on white-hot metal.

### 4.4 The byte-identical proof harness (the deliverable's spine)

Cross-backend identity is *claimed* by TSL and *verified* here. The harness renders the same function on both
paths and diffs:

```js
// parity/parity.test.js  (dev-only; run in CI on desktop + manually on iPhone 15)
// 1. GLSL path: a 256×256 plane, ShaderMaterial injecting gw_fbmR / gw_forge over a UV ramp, classic renderer.
// 2. TSL path:  the same plane, MeshBasicNodeMaterial with colorNode = gwFbmR(uv) / gwForge(t), on:
//      a) WebGPURenderer (WGSL)  b) WebGPURenderer forceWebGL:true (TSL→GLSL)
// 3. readRenderTargetPixels() each → pixel-diff. Assert max channel delta ≤ 2/255 (8-bit tolerance),
//    mean delta ≤ 0.5/255. Dump a heat-mapped diff PNG on failure.
```

Three comparisons, three distinct truths:
- **GLSL(classic) vs TSL→GLSL(WebGPURenderer fallback):** proves the *re-host* (our Ashima math == the twin's
  Ashima math) — catches a transcription bug in the twin.
- **TSL→GLSL vs TSL→WGSL:** proves *backend identity* (TSL's own promise) — catches the WGSL-strictness
  divergences (#31452 class).
- **GLSL(classic) vs TSL→WGSL:** the end-to-end claim — what the judge would see today vs what WebGPU would
  show after the port. **This is the number that proves the world's identity survives.**

The brand-critical sub-tests, run *through the tone-mapper* (AgX/ACES on the renderer, `00 §3.2`), not on raw
values (the #1 first-build mistake — `00 §8`): the six ramp stops, `PAL.divine` white-gold, and the black
point `(0,0,0)`. **These do not simulate headless** (`00 §8`) — the final stop-gate is the iPhone 15 OLED read:
the divine-fire white-gold, the true-black void, and the absence of any vein/churn shift between the two builds
viewed side-by-side on the panel.

### 4.5 The r3f component shape (today vs gated)

No new component ships today — the GLSL toolkit is consumed by existing materials through `onBeforeCompile`
(the `shader-fx` skill, `phase2/07 §4.5`). The gated WebGPU material is the *twin* of that:

```jsx
// ObsidianSlab.jsx — TODAY (WebGL2): onBeforeCompile injects the GLSL strings + the octave #define
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, U)                                   // the master pool (00 §4.2)
  const OCT = GW_FBM_OCTAVES[quality]                                 // from octaves.js — ONE source
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>',
      `#include <common>\n#define GW_FBM_OCTAVES ${OCT}\n${GLSL_NOISE}\n${GW_TEMPERATURE}\n${HEAD}`)
    .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
}

// ObsidianSlabGPU.jsx — GATED (WebGPU, post-judge): the SAME math as node graph, no strings
const mat = new MeshPhysicalNodeMaterial({ roughness: 0.05 })
const temp = uTemp.add(gwFbm3(warpField).mul(0.18)).clamp(0, 1)       // SAME bias as GLSL
const metal = mix(gwForge(temp), gwDivineFire(flick), uIsAE)          // SAME keystone branch
mat.emissiveNode = metal                                              // emissive → bloom (MRT, phase2/01 §2.D)
mat.colorNode    = gwIridescence(iridDrive, temp.oneMinus(), uIrid)   // cool-band sheen
```

Both bind the *same* `forge`-store uniforms (`uTemp`, `uHeat`, `uIsAE`, `uIrid`, `uVeinScale` — `00 §4.2`), so
the chamber doesn't know which renderer drew it (`phase1/30 §5`). The capability gate (`phase1/30 §4.3`,
default-off) picks the Canvas; the math is the same on either side because it came from the same sibling pair.

### 4.6 Key uniforms / params (identical names + meanings on BOTH stacks)

| Param | Source (mutable `forge` store) | GLSL form | TSL form | Drives |
|---|---|---|---|---|
| `uTime` | the one `<ForgeDriver/>` (frozen `2` on static) | `uniform float` | `uniform(0)` | the boil z-axis of `gwFbm3` |
| `uTemp` | `scrollDamped + vel*0.25` | `uniform float` | `uniform(0)` | bias into `gwForge`/`gwTempColor` |
| `uHeat` | strike `exp(-since*3)` + vel | `uniform float` | `uniform(0)` | vein flare, spark color |
| `uIrid` / `uVeinScale` | `sceneFor(route)`, damped | `uniform float` | `uniform(...)` | iridescence gate, warp freq |
| `uIsAE` | per-letter baked flag | `uniform float`/attr | `uniform`/attribute | routes to `gwDivineFire` (keystone) |
| `GW_FBM_OCTAVES` | tier table (`octaves.js`) | **`#define`** (unrolls) | **`Loop` bound** (JS const) | uniform detail tier |

The table's point: **a port changes syntax, not the contract.** The names, the meanings, and the single octave
knob are renderer-agnostic (`phase1/30 §4.6`).

---

## 5. COHESION

This element is pure cohesion infrastructure — its only job is to guarantee the *substrate swap doesn't change
the world's identity* (`phase1/30 §5`). The binding ties:

- **One temperature authority, two syntaxes.** `gwForge`/`gwTempColor`/`gwCool01`/`gwDivineFire` are the same
  five symbols (`phase2/01`) on both stacks, with the same six brand stops and the same `T³` ramp. A cooling
  letter and a cooling vein are the same metal *because the math is the same bytes*, GLSL or WGSL.
- **One noise well, one octave knob.** `gwFbmR`/`gwFbm3`/`gwWarp` re-host the same Ashima simplex, the same
  `GW_ROT`, the same lacunarity — and `GW_FBM_OCTAVES` (from `octaves.js`) drives detail identically on both
  (`00 §2`, `phase2/07`). "More detail" is one more octave, never a second noise, on either backend.
- **One palette.** `PAL` (`palette.js`) inlines via `v3()` in GLSL and `vec3(...PAL.x)` in TSL — *the same
  hex*. `PAL.hot`/`PAL.divine` stay the >1 HDR values that *select* what blooms; the palette is the bloom
  selector and the light-source list on either renderer (`00 §3.1`).
- **The keystone is renderer-agnostic.** `uIsAE` routes the A/E to `gwDivineFire` (>1 white-gold, never
  cooling) identically (`00 §1.4`). The same two letters ignite in the DOM, in the GLSL metal, and in the WGSL
  metal — one rule, three renderers.
- **One clock, dt-damped.** Both stacks read `uTime`/`uTemp`/`uHeat` from the same `forge` store via the one
  `<ForgeDriver/>` (`00 §7` rule 6). No second clock, no second rAF.
- **Degrades uniformly.** The octave knob thins all detail at once on both backends (`00 §7` rule 9); the
  static tier resolves to the same dignified frozen warm-vein still.

The failure this *prevents*: a WebGPU build with its own orange, its own noise lattice, or its own black point.
The sibling pair makes that structurally impossible — the port can only re-host, never re-invent.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

This work has **zero per-frame cost on the judged build** — the TSL twins are tree-shaken dead code on the
WebGL2 path. The performance story is about the *gated future* and the *proof*, held to `00 §10`'s ~9–10 ms
steady-state design target (iPhone 15, DPR capped 1.5):

- **Fill-rate is unchanged by the language.** The slab's per-pixel fbm + bloom cost roughly the same in WGSL or
  GLSL (`phase1/30 §2.6`). The re-hosted Ashima twin runs the *same op count* as the GLSL — porting does not
  relax (nor worsen) the doc-29 levers (DPR cap, bloom `resolutionScale 0.5`, the `GW_FBM_OCTAVES` cap,
  particle overdraw). The biggest fill-rate lever stays **DPR**, not the API.
- **Built-in `mx_noise_float` is a perf *and* look variable.** MaterialX gradient noise is not free and not
  identical to Ashima simplex (§2.4); using it would change both the field *and* the cost. We re-host (same
  cost, same look) for hero fields and reserve the built-in for new WebGPU-only compute work where there is no
  GLSL baseline to match.
- **The octave knob is the shared mobile lever.** On the gated path `GW_FBM_OCTAVES` (3/3/2 high/low/static,
  `phase2/07 §6`) bounds the TSL `Loop()` exactly as it bounds the GLSL unroll — so the tier system, the
  `PerformanceMonitor`+`AdaptiveDpr` ladder, and the frozen `static` poster are renderer-independent
  (`phase1/30 §6`).
- **The proof harness has a mobile cost — bounded.** The parity test renders two extra 256×256 passes; it runs
  in CI on desktop and is a *manual* one-shot on the iPhone 15 (the device read that doesn't simulate
  headless), never in the shipped frame loop. It must never regress INP — gate it behind a dev flag, run it
  before first interaction is irrelevant because it never runs in production.
- **The fallback-quality trap still applies.** If WebGPU is ever enabled and iOS Safari falls back to WebGL2,
  the math is our re-hosted twin lowered to GLSL through `WebGPURenderer`'s *less-tested* WebGL2 backend
  (`00 §10`, `phase1/30 §6`). The parity harness's "TSL→GLSL vs classic-GLSL" comparison is exactly the test
  that de-risks that branch — run it on a real iPhone 15 before flipping the gate.
- **No runtime EXR, both stacks** — unchanged. The env stays the procedural Lightformer PMREM rig (`00 §5.3`).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each verified the repo way — `npm run build` green → `qa-route` 393×852 + 1440×900, 0
console errors → device read — before the next):**

1. **Factor the GLSL into pure functions *first*, ship that.** Land `gw_fbmR`/`gw_warp`/`gwForge` etc. as
   uniform-free, varying-free pure functions on the WebGL2 path (this is `phase2/01` + `phase2/07`). The slab
   stays byte-identical (the legacy `gw_fbm`/`gw_caustic` untouched — `phase2/07 §4.2`). **No TSL yet.**
2. **Extract the one octave source.** Create `octaves.js`; generate the GLSL `#define` from it at injection.
   Confirm the unroll still expands (log `shader.fragmentShader`, `phase2/07 §7`). This is the shared knob both
   stacks will read.
3. **Write the TSL twins as cold storage.** Author `tsl/*.tsl.js` re-hosting the *exact* math/constants.
   Confirm Vite tree-shakes them (inspect the production bundle — `three/tsl` must **not** appear). The judge
   build is unchanged.
4. **Stand up the parity harness on desktop.** Run the three comparisons (§4.4) in CI (desktop Chrome WebGPU).
   Tune the twins until max channel delta ≤ 2/255 against the classic GLSL. *This is where transcription bugs
   surface.*
5. **The device read.** Run the harness once on a real iPhone 15: the ramp stops, divine-fire white-gold, the
   black point, the absence of vein/churn shift — through the tone-mapper, on the OLED (`00 §8`). Only now is
   "TSL-portable, proven" true.

**Pitfalls, ranked by cost:**

- **Calling built-in `mx_noise_float` in the twin "to save lines."** It is a *different field* (§2.4) — every
  vein and churn shifts on the port, breaking cohesion (`phase1/30 §7`). Re-host the Ashima math for any field
  that ships on GLSL. Built-in noise is *only* for new WebGPU-only effects with no GLSL original.
- **Forgetting `.toVar()` on mutated nodes.** TSL nodes are immutable by default; `q = p` then mutating `q`
  silently does the wrong thing (or errors) — you must `const q = p.toVar()` (threejsroadmap "Getting AI to
  Write TSL That Works", 2026; the §4.3 twins all `.toVar()` their accumulators). This is the #1 TSL
  transcription bug.
- **Assuming TSL→WGSL == TSL→GLSL unconditionally.** WGSL is stricter (types, layout — three.js issue #31452,
  2025). Backend identity is *verified per function* by the harness, not assumed. A function that compiles on
  GLSL can error on WGSL.
- **Authoring the ramp for raw values, not the tone-mapped output.** The six stops must be tuned through
  AgX/ACES on the device (`00 §8`, `phase2/01`). A twin that matches raw RGB but is checked pre-tone-map can
  still drift after the operator — diff *after* tone-mapping.
- **Editing the slab's legacy `gw_fbm` while "refactoring."** Breaks the byte-identical-home contract (`00 §8`
  step 2, `phase2/07 §7`). The successor is `gw_fbmR`; migrate the slab deliberately later, never as a
  side-effect of the TSL work.
- **Letting the twins rot.** Two sources drift. The CI snapshot diff (step 4) is the *only* thing that keeps
  them in sync — wire it before you write the second twin, not after.
- **Shipping `three/tsl` to the judge by accident.** A stray import pulls the transpiler into the production
  bundle. Verify tree-shaking (step 3) on every build; the judge path imports *zero* TSL.
- **Treating `GW_FBM_OCTAVES` as a runtime uniform.** It is compile-time on both stacks (`#define` / `Loop`
  bound). Changing it needs a material recompile, not a uniform write — tier transitions recompile once
  (`phase2/07 §7`), never per-frame.

---

## 8. SOURCES (2025–2026)

1. **Maxime Heckel — _Field Guide to TSL and WebGPU_**, **Oct 14, 2025**. The canonical 2025 reference for
   `Fn()` as the splitting/reuse primitive, hand-transpiling a *specific* Perlin noise (the cross-language
   re-host pattern this doc builds on), compute replacing FBO ping-pong, and one-source GLSL/WGSL lowering.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
2. **Three.js Roadmap — _10 Noise Functions for Three.js TSL Shaders_** (Dan Greenheck), **Dec 2025**. Built-in
   `mx_noise_float` / `mx_fractal_noise_float(p, octaves, lacunarity, gain)` / cell noise signatures, fBm and
   domain-warp in TSL via `Loop()`; confirms simplex as the isotropic workhorse — the basis for the "re-host vs
   built-in" tradeoff (§2.4). https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
3. **Three.js Roadmap — _Getting AI to Write TSL That Works_**, **2026**. Catalogues the TSL authoring footguns
   this doc's §7 ranks — `.toVar()` on mutated nodes, swizzle/assign rules, immutable-by-default nodes,
   differences from GLSL. The source for the #1 transcription pitfall.
   https://threejsroadmap.com/blog/getting-ai-to-write-tsl-that-works
4. **Three.js Roadmap — _TSL: A Better Way to Write Shaders in Three.js_**, **2025–2026**. TSL as the
   renderer-agnostic node graph lowering to GLSL on `WebGLRenderer` and WGSL on `WebGPURenderer`; node reuse as
   the explicit replacement for fragile `.replace()` injection.
   https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
5. **LearnWithHasan — _Three.js Shaders Guide — GLSL, ShaderMaterial & TSL (r184)_**, **2026**. Confirms r184
   ships TSL as the stable first-class node API (`Fn`, `colorNode`/`emissiveNode`, `Loop`, `.toVar`) lowering
   to GLSL/WGSL, while the GLSL `onBeforeCompile` path remains the production WebGL route — the justification
   for shipping GLSL to the judge and staging TSL. https://learnwithhasan.com/threejs-guide/shaders/
6. **three.js — _TSL docs / Three.js Shading Language wiki_** (r18x), referenced **2025–2026**. `Fn`, `uniform`,
   `Loop`, `.toVar`, `uniformArray`, the MaterialX `mx_*` noise catalogue, and the explicit "compiles to GLSL
   for WebGLRenderer and WGSL for WebGPURenderer" portability contract.
   https://threejs.org/docs/pages/TSL.html · https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
7. **mrdoob/three.js — Issue #31452, _TSL: WGSL compiler error when layout is used, GLSL is OK_**, **2025**.
   Concrete evidence that TSL→WGSL and TSL→GLSL are *not unconditionally identical* — the WGSL-strictness class
   of divergence the parity harness (§4.4) must verify per function.
   https://github.com/mrdoob/three.js/issues/31452
8. **Codrops — _Interactive Text Destruction with Three.js, WebGPU, and TSL_**, **Jul 22, 2025**. Modern
   production reference for `Fn()` + `Loop()` + 3D noise driving a WebGPU/TSL material end-to-end — the idiom
   the molten/vein twins follow. https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
9. **Codrops — _Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL_**, **Mar 10, 2025**.
   fBm + domain-warp + 3D noise driving the emissive interior of a physical glass material via TSL `Loop()` —
   structurally the slab veins / molten-in-channel composition, one renderer earlier.
   https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/
10. **utsubo — _Migrate Three.js to WebGPU (2026) — The Complete Checklist_**, **2026**, and _100 Three.js Tips
    (2026)_. r171 zero-config `three/webgpu` + automatic WebGL2 fallback, `forceWebGL`, post-migration surface
    — the gated-path setup the twins land into. https://www.utsubo.com/blog/webgpu-threejs-migration-guide ·
    https://www.utsubo.com/blog/threejs-best-practices-100-tips

---

## 9. DEEP-DIVE CANDIDATES

1. **The parity-harness CI rig + per-function tolerance budget.** The concrete dev-only test: the 256×256
   triple comparison (classic-GLSL ↔ TSL→GLSL ↔ TSL→WGSL), the `readRenderTargetPixels` diff, the
   post-tone-map brand sub-tests (six stops, `PAL.divine`, black point), and the max-2/255 / mean-0.5/255
   tolerance — plus where it runs (desktop CI vs the manual iPhone 15 read) and how it gates the gate.

2. **Re-hosted Ashima simplex vs built-in `mx_noise_float` — the field-shift quantification.** Render both as
   the slab veins and the molten churn on iPhone 15, measure the visible field difference (spectral content,
   the plaid, the warp read), and the op-count/fill-rate delta — the data that justifies re-hosting the hero
   noise and reserving the built-in for new compute-only effects.

3. **The TSL `Fn()` cooling/crust/worley twins.** Extend the sibling pair past the noise+temperature core to
   `gwCool01` (the eased age→temperature curve, `phase2/01`/`02`), the Worley crust (`phase2/08`), and
   `gw_curl3` spark advection — the functions that feed the gated WebGPU *compute* path, where the built-in
   `mx_*` noise *is* the right call (no GLSL original to match).

4. **`MeshPhysicalNodeMaterial` injection-point mapping.** The one-to-one map from today's `onBeforeCompile`
   injection points (`HEAD`/`NORMAL`/`COLOR` over `#include <common>` / `<normal_fragment_maps>` /
   `<tonemapping_fragment>`) to node slots (`colorNode`/`normalNode`/`emissiveNode`/`outputNode`), so the slab
   port is a checklist, not a re-derivation — the material-grammar half of the re-host (the math half is this
   doc).
