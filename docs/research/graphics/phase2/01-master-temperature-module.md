# 01 — The `temperature.js` Master Module

_Phase 2 deep-dive · GAELWORX forge world · the single importable temperature / cooling / divine-fire
authority every hot material consumes verbatim · target: iPhone 15 OLED, one WebGL renderer (r3f + three.js)_

> **Cluster A-temperature-core.** This document formalizes the spine declared in `00-COHESION-MAP.md §1`
> and synthesized from Phase-1 docs `02` (blackbody→color) and `03` (cooling→solidification). Where those
> two docs *propose* `gw_tempColor`, `gw_tempEmissive`, `gw_forge`, `gwCool01`, and `gw_divineFire` as
> separate sketches in separate files (`shaders.js`, a hypothetical `cooling.js`), this doc **fuses them
> into one file — `src/scene/temperature.js` — exporting one GLSL string** that the molten surface, the
> cooling letterforms, the cold forged-iron skin, the channels, the sparks, the caustics, the basalt
> radiance, and the A/E exception all `import` and inline **byte-for-byte identical**. It locks the six
> brand-anchored stops and the `T³` brightness ramp as the world's single color authority, and it
> reconciles the cohesion-map's idealized `PAL` against the **actual** `src/scene/palette.js` (which today
> has no `PAL.divine` and a non-HDR `PAL.gold`). This is the first thing built in Phase A; nothing else
> ships until it is right.

---

## 1. SCOPE

Temperature is the one scalar that drives **emissive color, emissive intensity, cooling over time, bloom
gating, heat-haze strength, spark color, caustic tint, god-ray brightness, and the divine-fire exception**
— everywhere, from one authority. In the GAELWORX world the metal is the only light; "how hot is this
fragment" is therefore simultaneously "what color is it," "how bright is it," "does it bloom," and "is it a
light source or a lit object." If the molten pour invents its own orange, the cooling letters their own
red, and the sparks their own gold, the world fractures into a collage of effects. If every one of them
asks the *same five functions* "what does metal at temperature `t` look like, scaled how bright, cooled how
far, and is it the eternal A/E?" — they read as **one substance at different points on one cooling timeline,
lit by one fire.**

This module owns exactly five public GLSL symbols, and nothing downstream is allowed to recompute any of
them locally:

| Symbol | Signature | Owns |
|---|---|---|
| `gw_tempColor` | `vec3 (float temp)` | the **hue march** — iron-black → dull-red → forge-red → ember → gold → white-hot, brand-anchored, monotonic, seam-free. Unit-ish brightness. |
| `gw_tempEmissive` | `float (float temp)` | the **brightness ramp** — tamed Stefan–Boltzmann `T³`, cold≈0 (no bloom), hot >1 (blooms). Hue-independent. |
| `gw_forge` | `vec3 (float temp)` | the convenience product `gw_tempColor(temp) * gw_tempEmissive(temp)` — the HDR emissive every molten/cooling consumer adds pre-tone-map. |
| `gwCool01` | `float (float age, float rate)` | the **temporal half** — seconds-since-poured → normalized temperature `0 (hot) … 1 (cold)`, eased so the hot phase lingers then drops fast. (Note: returns the *inverse* convention from `gw_tempColor`'s input; §4.4 resolves the sign.) |
| `gw_divineFire` | `vec3 (float flick)` | the **keystone exception** — unearthly white-gold HDR that ignores `uTemp` and never cools. The 3D embodiment of the DOM `.forge-letter` A/E ignite. |

It is deliberately **pure functions of floats** — no `uniform` reads inside the module, no texture fetches,
no `varying` dependencies. That purity is what makes it (a) inline-able into any material's
`onBeforeCompile` without import-order hazard, (b) trivially testable in isolation, and (c) portable 1:1 to
a TSL `Fn()` for the eventual WebGPU port (§4.7). The *consumers* own the uniforms; the module owns the math.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The question this doc answers is not "how do I color a hot object" (Phase-1 doc 02 settled that — a
procedural brand-anchored Planckian-locus ramp beats spectral LUTs and curve-fits for a stylized mobile
forge). The Phase-2 question is **"what is the right packaging and authority structure for one shared
temperature system across a dozen materials,"** and on that there are four viable 2025-2026 patterns.

### 2.A One exported GLSL string, inlined via `onBeforeCompile` (the repo's current grammar)
A single `export const GW_TEMPERATURE = /* glsl */ \`…\`` consumed by every material via
`shader.fragmentShader.replace('#include <common>', '#include <common>\n' + GW_TEMPERATURE)`. This is
exactly how `GLSL_NOISE` already ships and how `ObsidianSlab.jsx` injects `HEAD`/`NORMAL`/`COLOR`. The
2025-2026 community consensus (the Dusan Bosnjak "Extending three.js materials with GLSL" lineage, Luke
Arcamo's 2025 "Making sense of Three.js shaders," and the `ShaderChunk` import pattern) confirms this is
the canonical WebGL2 reuse mechanism: store GLSL as importable JS strings, map them into the shader at
compile time, manage uniforms manually. **Tradeoffs:** zero new deps, zero bundle cost, compiles in
SwiftShader (so a typo surfaces as a CI console error), ships to the judge device today. The known fragility
— "hunting for the right injection point, hoping three doesn't change its chunks" — is *mitigated here*
because the module reads no chunks; it only defines functions in `<common>` scope. **This is the pick.**

### 2.B `THREE.ShaderChunk` registration (global dictionary)
Register the string as `THREE.ShaderChunk['gw_temperature'] = …` and `#include <gw_temperature>` from
materials. Slightly cleaner call sites, but it **mutates a global**, collides across hot-reload in Vite dev,
and offers no advantage over a plain import for a single app. Rejected: globals are a cohesion *risk* (any
stray code can redefine the authority).

### 2.C `CustomShaderMaterial` (FarazzShaikh) wrapper
`THREE-CustomShaderMaterial` (actively maintained through 2025) lets you extend `MeshPhysicalMaterial` with
clean `vec3 csm_Emissive` outputs instead of `.replace()` surgery. Genuinely nicer ergonomics. **But** it
adds a dependency, changes the material-construction grammar the whole repo already standardized on
(`onBeforeCompile`), and the forge's emissive-add-before-tonemap discipline is already solved by the
existing `COLOR`-before-`<tonemapping_fragment>` injection. Not worth the migration churn for Phase 2;
noted as a future cleanup, not a blocker.

### 2.D TSL `Fn()` node module on `WebGPURenderer` (the forward path)
On `WebGPURenderer`, the same five functions express as reusable TSL `Fn()` nodes feeding
`material.emissiveNode`, with bloom reading a dedicated **MRT `emissive` attachment** (`import { mrt, output,
emissive } from 'three/tsl'`) instead of thresholding luminance — strictly better bloom (you bloom exactly
the channels you mark, no false positives from bright reflections). Maxime Heckel's Oct 2025 *Field Guide to
TSL and WebGPU* documents `Fn()` as the splitting/reuse primitive ("split TSL into multiple functions by
declaring them with `Fn`"), and the Three.js Roadmap "TSL: A Better Way to Write Shaders" (2025) frames node
reuse as the explicit replacement for fragile `.replace()` injection. **Tradeoffs:** materially better, but
iOS/Safari WebGPU is still the 2026 risk surface, the entire `@react-three/postprocessing` composer is
WebGL-based, and betting the judge device on the less-tested `WebGPURenderer` WebGL2-fallback branch is the
documented mistake (`00-COHESION-MAP §10`). **Verdict: author the GLSL so the math ports to TSL `Fn()` 1:1
(§4.7), ship GLSL today, gate WebGPU post-judge.**

**Landscape verdict:** package as **2.A — one GLSL string, `src/scene/temperature.js`** — with every symbol
written to have a mechanical TSL `Fn()` twin. The novelty over Phase-1 is *consolidation and authority
locking*: one file, five symbols, six locked stops, one `T³` ramp, reconciled against the real palette.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship `src/scene/temperature.js` exporting a single `GW_TEMPERATURE` GLSL string containing all five
symbols, plus a tiny JS-side `PAL` reconciliation so the stops are inlined from real palette tokens — and
make it the *only* place any of the five functions is defined.** The justification, rooted in this codebase:

1. **Authority cannot drift if there is one definition.** Today doc 02 sketches `gw_tempColor` in
   `shaders.js` and doc 03 sketches `gwTempRamp` in a separate `cooling.js`; those are *two ramps* and would
   inevitably diverge (different stop counts, different easing). Fusing them into one file with one ramp is
   the entire cohesion lever. The slab's veins, a cooling letter, and a spark are "the same metal" **only
   because the bytes are identical**.

2. **Pure-float functions inline anywhere with no order hazard.** Because the module reads no uniforms and
   no varyings, a consumer can inject it right after `GLSL_NOISE` in `<common>` and call it from `NORMAL`,
   `COLOR`, or a vertex stage without worrying about declaration order. (The one cross-dependency —
   `gwCool01`'s eased crust/vein code in doc 03 calls `gw_fbm` — is satisfied because every consumer already
   injects `GLSL_NOISE` first; the temperature module itself stays noise-free and depends on nothing.)

3. **The single knob controls bloom for free.** Keeping hue (`gw_tempColor`) and brightness
   (`gw_tempEmissive`) *separate* and only multiplying them in `gw_forge` means the `T³` ramp is the sole
   thing that decides what exceeds 1.0 and therefore blooms. No per-effect bloom tuning, no `SelectiveBloom`
   pass — the palette + the ramp *are* the bloom selector (`00-COHESION-MAP §6`).

4. **It slots into an existing socket.** `uTemp` is already a uniform in `ObsidianSlab.jsx`, already driven
   by `forge.scrollDamped + vel*0.25`. The module's first wiring is a two-line swap of the slab's hand-mixed
   `body` for `gw_forge(veinTemp)` — no new plumbing, instantly verifiable that `/` still reads on-brand.

**Critical reconciliation (do this first, it is load-bearing):** the cohesion map's idealized `PAL` references
`PAL.crimsonDeep`, `PAL.crimson`, `PAL.ember`, `PAL.gold`, `PAL.hot`, **and `PAL.divine`** — but the *real*
`src/scene/palette.js` has `void/ink/crimsonDeep/crimson/red/ember/emberHot/gold/hot` and **no `divine`**, and
its `gold` (`#ffb15a`) is **not** HDR (`<1.0`). The module must not invent colors inline (brand law: "no raw
hex anywhere"). So Step 0 is: **add two HDR tokens to `palette.js`** — `goldHot` (the HDR shoulder the ramp
needs, e.g. `new THREE.Color(1.40, 0.92, 0.40)`) and `divine` (the white-gold keystone, e.g.
`new THREE.Color(2.05, 1.62, 1.02)`) — then inline the six stops + divine from `PAL` via the existing `v3()`
helper. This keeps the palette the single color source and the temperature module a pure consumer of it.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
**No new dependencies.** Stack stays: `three` (current r17x line, WebGL `MeshPhysicalMaterial` +
`onBeforeCompile`), `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (the existing
`Bloom`), `leva` (`?debug`). New code: one file `src/scene/temperature.js` (a GLSL string + the `PAL`
inline), and two new `PAL` tokens in `palette.js`. The WebGPU/TSL twin (§4.7) is authored but **not** wired
for the judge build.

### 4.2 `src/scene/palette.js` — add the two HDR tokens (Step 0)

```js
// append to PAL in src/scene/palette.js
goldHot: new THREE.Color(1.40, 0.92, 0.40), // HDR shoulder for the temp ramp (blooms)
divine:  new THREE.Color(2.05, 1.62, 1.02), // A/E divine fire — whiter+brighter than molten hot
```

These are the **only** two new colors; everything else reuses existing tokens. Both are HDR (>1) on purpose
— they sit in the 10% accent band that is the only thing allowed to bloom.

### 4.3 `src/scene/temperature.js` — the one module (the deliverable)

```js
import { PAL, v3 } from './palette.js'

// GAELWORX MASTER TEMPERATURE / COOLING / DIVINE-FIRE module.
// ONE authority for the whole forge. Inlined into every hot material via onBeforeCompile,
// right after GLSL_NOISE (this module itself needs no noise — pure functions of floats).
// Six brand-anchored stops (from PAL, never raw hex), a tamed Stefan–Boltzmann T^3 ramp,
// and a locked divine-fire path that never reads uTemp.
export const GW_TEMPERATURE = /* glsl */ `
  // ---- 1. HUE MARCH (unit-ish brightness; monotonic red->white; brand-anchored) ----
  // temp: 0 = iron-black/cold, 1 = white-hot. Overlapping smoothstep bands => no plateaus,
  // no seams. Cold band stays < 1.0 (true black on OLED); hot band > 1.0 (blooms).
  vec3 gw_tempColor(float temp){
    float t = clamp(temp, 0.0, 1.0);
    vec3 ironBlack = ${v3(PAL.void)};        // 0.00  cold iron, near-void
    vec3 dullRed   = ${v3(PAL.crimsonDeep)}; // 0.22  first dull red
    vec3 forgeRed  = ${v3(PAL.red)};         // 0.45  Celtic-Blood-side red
    vec3 ember     = ${v3(PAL.ember)};       // 0.66  Ember Glow #ff5a1e
    vec3 gold      = ${v3(PAL.goldHot)};     // 0.85  HDR shoulder
    vec3 whiteHot  = ${v3(PAL.hot)};         // 1.00  PAL.hot (HDR > 1 -> blooms)
    vec3 c = mix(ironBlack, dullRed,  smoothstep(0.00, 0.22, t));
    c      = mix(c,         forgeRed, smoothstep(0.18, 0.45, t));
    c      = mix(c,         ember,    smoothstep(0.42, 0.66, t));
    c      = mix(c,         gold,     smoothstep(0.64, 0.85, t));
    c      = mix(c,         whiteHot, smoothstep(0.82, 1.00, t));
    return c;
  }

  // ---- 2. BRIGHTNESS RAMP (hue-independent; tamed T^4 -> ~T^3) ----
  float gw_tempEmissive(float temp){
    float t = clamp(temp, 0.0, 1.0);
    return pow(t, 3.0) * 2.6 + t * 0.12;     // small linear floor so warm iron still reads
  }

  // ---- 3. CONVENIENCE PRODUCT (the HDR emissive every consumer adds pre-tonemap) ----
  vec3 gw_forge(float temp){ return gw_tempColor(temp) * gw_tempEmissive(temp); }

  // ---- 4. TEMPORAL HALF: seconds-since-poured -> cooling 0(hot)..1(cold) ----
  // Eased so the hot phase lingers, then drops fast (perceptual cooling of metal).
  float gwCool01(float age, float rate){
    return pow(clamp(age * rate, 0.0, 1.0), 0.7);
  }

  // ---- 5. THE KEYSTONE EXCEPTION: A/E divine fire (never reads uTemp, never cools) ----
  vec3 gw_divineFire(float flick){
    return ${v3(PAL.divine)} * (1.0 + flick * 0.18);
  }
`
```

> **The load-bearing structure** (not the exact triplets, which are tuned live on-device through the
> tone-mapper): six monotonic stops with overlapping bands, hue separated from brightness, a `T³` ramp that
> keeps cold <1 and hot >1, a temporal `gwCool01` that returns *cooling progress* (0 hot → 1 cold), and a
> hard-separated divine-fire path. Author all triplets in the `?debug` leva panel **through ACES/AgX**, not
> raw (§7.2).

### 4.4 The sign convention — resolving the two inputs (an edge case that bites)

There are **two scalars** in play and they have **opposite polarity**, which is the single subtlest bug
risk in the whole module:

- `gw_tempColor` / `gw_tempEmissive` / `gw_forge` take **`temp`: 0 = cold, 1 = hot.** (Higher = hotter.)
- `gwCool01` returns **`cool`: 0 = hot, 1 = cold.** (Higher = colder — it is *cooling progress*, matching
  doc 03's `T: 0=white-hot … 1=iron-black`.)

A cooling consumer must therefore **invert**: `float temp = 1.0 - gwCool01(age, uCoolRate);` before calling
`gw_forge(temp)`. To make this impossible to get wrong, the module exposes one composed helper that every
*cooling* material uses (added to the string above):

```glsl
  // For cooling surfaces: age (sec since poured) + AE flag -> HDR emissive in ONE call.
  vec3 gw_coolForge(float age, float rate, float isAE, float flick){
    float temp = 1.0 - gwCool01(age, rate);         // invert: cooling-progress -> hotness
    return mix(gw_forge(temp), gw_divineFire(flick), isAE);  // A/E branch hard-separated
  }
```

`gw_coolForge` is the canonical call for the letterforms, the channel metal, and the molten surface; raw
`gw_forge(temp)` is for surfaces that already have a hotness value (slab veins, sparks). The `mix(..., isAE)`
with `isAE ∈ {0,1}` is a branch-free select — no per-pixel `if`, mobile-safe — and **guarantees the A/E
never reach `uTemp`** (the brand's central rule) because when `isAE==1` the `gw_forge` arm is discarded.

### 4.5 Consumer wiring — the seven materials, one socket each

Every hot material follows the identical recipe: inject `GLSL_NOISE` then `GW_TEMPERATURE` into `<common>`,
bind the shared uniform pool `U` (`00-COHESION-MAP §4.2`), and add the emissive **before**
`#include <tonemapping_fragment>`.

**Slab veins** (`ObsidianSlab.jsx`, the first wiring — a two-line swap of the hand-mixed `body`):
```glsl
// HEAD: ...${GLSL_NOISE}\n${GW_TEMPERATURE}
// COLOR (replacing the ad-hoc mix(crimson,ember)->mix(...,hot)):
float veinTemp = clamp(gwVein * 0.55 + gwCore * 0.45 * (0.6 + 0.4 * uTemp), 0.0, 1.0);
vec3  body     = gw_forge(veinTemp);                 // master authority, HDR, blooms at cores
vec3  fire     = (mix(body, opal * 1.5, iridMix) * gwFlow) * (uVeinGlow + uSurge);
gl_FragColor.rgb += fire;
```

**Cooling letterforms** (`ForgeLetter.jsx`): per-fragment `age` derived analytically from `uFillFront` vs a
per-glyph layout-U (no GPGPU ping-pong on the hero), then `gl_FragColor.rgb += gw_coolForge(age, uCoolRate,
uIsAE, flick) * gwFillEdge;`. The crust skin / ember-vein / frozen-ripple composite from doc 03 layers on
top using `gwCool01(age,rate)` directly as its skin/vein driver.

**Cold forged-iron skin** (plinths, ledger): `age` is effectively `∞` (fully cooled), so `gw_forge(temp≈0)`
returns near-`PAL.void` — it is *lit*, not emissive, and the ember-vein floor (`uVeinFloor`, doc 03) keeps
deep seams alive so it never reads dead.

**Channel metal** (`/automations`): the pour-front arc coordinate drives `age = (frontArc - thisArc) *
uFillSpan`; same `gw_coolForge` call.

**Sparks/embers** (`Embers.jsx`): each particle carries `sparkTemp` (rides ~1.0 at spawn near the pour
front, decays over lifetime); fragment does `gl_FragColor.rgb = gw_forge(sparkTemp);` — sparks are literally
cooling metal droplets, same curve.

**Caustics on stone** (`gw_caustic` already in `shaders.js`): the caustic intensity tints by
`gw_tempColor(localTemp)` so the focused filaments are the *same* orange as the metal casting them; the A/E
caustic preset swaps to `gw_divineFire(flick)` for the tight white-gold pool.

**The A/E exception** (basalt radiance + Ogham reveal): the divine-fire materials pass `isAE=1` to
`gw_coolForge`, and receiver materials (basalt, Ogham) read `uAEFire`/`uAEFirePow` (the nearest divine-fire
position + intensity) and lift their reveal by `gw_divineFire(flick) * uAEFirePow * grazing` — so the same
white-gold that the A/E *emit* is the light that *reveals* the carved lore.

### 4.6 Key uniforms / params (owned by consumers, not the module)

| Uniform | Meaning | Driven by | Default / range |
|---|---|---|---|
| `uTemp` | 0..1 master forge heat | `forge.scrollDamped + vel*0.25` | 0 / damped |
| `uHeat` | 0..1 transient strike+velocity pulse | `exp(-since*3)` + `vel` | 0 |
| `uFillFront` | pour position 0..1 (drives `age`) | journey/fill timeline, damped | 0 / 0–1 |
| `uFillSpan` | seconds the full fill represents | preset | 6.0 / 2–12 |
| `uCoolRate` | cooling speed (1/sec) into `gwCool01` | preset | 0.18 / 0.05–0.5 |
| `uIsAE` | per-letter A/E flag (build-time data) | glyph layout | 0 or 1 |
| `uVeinFloor` | min ember-vein glow (never dies) | preset | 0.12 / 0–0.3 |
| `uTime` | clock seconds (frozen to 2 on static) | `state.clock`, the one writer | — |

All animate via `THREE.MathUtils.damp(cur, tgt, λ, dt)` from the `forge` store in the single `<ForgeDriver/>`
`useFrame` writer — never frame-rate `lerp`, never a second rAF (`00-COHESION-MAP §7.6`).

### 4.7 The TSL `Fn()` twin (authored, gated post-judge)

Each symbol has a mechanical TSL twin so the WebGPU port is a re-host, not a rewrite, and so bloom can read
an MRT `emissive` attachment instead of luminance-thresholding (Codrops 2025/2026 + the three.js
`webgpu_postprocessing_bloom` emissive example):

```js
import { Fn, float, vec3, clamp, smoothstep, mix, pow } from 'three/tsl'

export const gwTempColor = Fn(([temp]) => {
  const t = clamp(temp, 0.0, 1.0)
  let c = mix(IRON_BLACK, DULL_RED, smoothstep(0.0, 0.22, t))
  c = mix(c, FORGE_RED, smoothstep(0.18, 0.45, t))
  c = mix(c, EMBER,     smoothstep(0.42, 0.66, t))
  c = mix(c, GOLD,      smoothstep(0.64, 0.85, t))
  c = mix(c, WHITE_HOT, smoothstep(0.82, 1.0,  t))
  return c
})
export const gwTempEmissive = Fn(([t]) => pow(clamp(t,0,1), 3.0).mul(2.6).add(clamp(t,0,1).mul(0.12)))
export const gwForge = Fn(([t]) => gwTempColor(t).mul(gwTempEmissive(t)))
```

The function bodies are *identical math*; only the syntax host changes. On WebGPU, `material.emissiveNode =
gwForge(tempNode)` and `mrt({ output, emissive })` → `bloom(emissivePass)` gives exact, reflection-immune
bloom. **Not wired for the iPhone-15 judge build.**

---

## 5. COHESION — how this binds the whole world

This module *is* the cohesion layer for color/heat; every downstream element samples it (`00-COHESION-MAP
§1, §7`):

- **One ramp, every metal.** Slab veins, the molten pour, channel metal, cooling letters, cold iron, sparks
  — all call `gw_forge`/`gw_coolForge`. A cooling letter and a cooling vein are *visibly the same metal*
  because the bytes that compute them are the same. "More heat detail" is never a second ramp.
- **One palette, inlined.** All six stops + divine come from `PAL` via `v3()` — no raw hex. The 60/30/10
  discipline holds: only the 10% accent band (`PAL.goldHot`, `PAL.hot`, `PAL.divine`, plus existing
  `emberHot`) exceeds 1.0, so the ramp **is** the bloom selector, the heat-haze mask, and the light-source
  list, all in one convention.
- **One bloom contract.** Because `gw_tempEmissive` keeps cold <1 and only the hottest band >1, the existing
  `mipmapBlur` `Bloom` (`luminanceThreshold ≈ 0.55–0.6`) catches exactly the hot metal and the A/E — no
  `Effects.jsx` change, no per-element bloom, no washout. Temperature controls bloom for free.
- **One tone-map.** The emissive is added pre-`<tonemapping_fragment>` so ACES (current) / AgX (Phase-2
  look-dev A/B) processes it; the stops are authored *through* that operator on-device. The crushed-black
  grade keeps `gw_tempColor(0)` = `PAL.void` at pixels-off black on the OLED.
- **One lighting model.** Cooling *is* the transition from "light source" (hot, emissive >1) to "lit object"
  (cold, near-void, reflecting the cool procedural env). The A/E radiance onto basalt/Ogham is the *same*
  `gw_divineFire` value the A/E emit — `uAEFire`/`uAEFirePow` carry it to receivers (`00-COHESION-MAP §5.2`).
- **The keystone, expressed identically everywhere.** The DOM `.forge-letter`, the 3D `uIsAE` letters, the
  basalt reveal, the Ogham legibility, the caustic preset, and the spark/god-ray pairs all key off the same
  "first A + first E per word" rule (build-time data, never a fragile in-shader string match), routed through
  the *one* `gw_divineFire`. Same letters ignite in prose and in metal, forever.

The single failure mode this module exists to prevent: **a new element with its own orange.** There is no
other place to define one.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The judge device is iPhone 15 (A16/A17, OLED), one renderer, DPR capped 1.5, ~9–10 ms steady-state on
`high` (`00-COHESION-MAP §10`). The temperature module's cost profile:

- **The math is effectively free.** `gw_forge` is five `mix`/`smoothstep` pairs + one `pow` — single-digit
  ALU, **no texture fetch, no branch, no loop.** It is cheaper than the `gw_fbm` (3-octave) it sits beside.
  This is the whole reason to go procedural over a sampled 256×1 LUT on mobile: no extra texture unit, no
  bandwidth, no banding. The cost in the hero frame is the *noise* the consumers call, not the temperature
  ramp.
- **Bloom is the budget, and the ramp keeps it bounded.** Because cold/mid bands stay <1.0, the bloom-pass
  workload does **not** grow as more cold metal fills the screen — only the small hot fraction blooms. No
  raising `Bloom intensity`; let the `T³` ramp decide what blooms.
- **Branch-free A/E select.** `gw_coolForge`'s `mix(..., isAE)` avoids a per-pixel `if`, so the divine-fire
  exception costs nothing on the warp's divergence — critical on mobile tile GPUs.
- **Tiering (uniform degradation).** `high`: full ramp + crust/vein/frozen-ripple composite + transmission.
  `low`: **identical `gw_forge`/`gw_coolForge` math** (it's free) but the doc-03 crust/vein fbm drops to 2
  octaves via `GW_FBM_OCTAVES` and the frozen-ripple normal-perturb is skipped. `static`: **freeze `uTime`
  to `2`** (divine-fire flicker and churn stop) and present the fully-solidified end-state — everything cold
  except the eternal A/E — driven by `uFillFront`'s final value, `Effects` unmounted. The color is still
  *correct* on every tier; only animation/detail thins. A tier drop never recolors and never forks the ramp.
- **OLED-safe authoring.** Author the `ironBlack` stop so it tone-maps to an *actual* pixels-off value;
  per the 2026 TFTCentral black-crush analysis the panel crushes <~RGB 3/255 anyway, which is *desirable* —
  cold iron disappears into the void. Keep the crushed-black grade; do **not** add a near-black gamma lift
  (it would gray the void). The grain-as-dither (`SOFT_LIGHT` ≥0.03 even on low) kills the dark
  void→crimson banding the ramp's low end would otherwise show on a true-black panel.
- **No FBO on the hero.** `age` is analytic from `uFillFront` + UV — zero render targets, so the cooling
  half costs no ping-pong on mobile. The live GPGPU fill field is `high`-tier-only and optional (a Phase-2
  candidate, §9).
- **LUT escape hatch (won't be needed).** If a profile ever shows the ramp is a bottleneck, bake the 256×1
  strip in JS at module-eval into a `DataTexture` (no file load — honors the EXR ban) and swap
  `gw_tempColor` for `texture2D(uRamp, vec2(t,0.5))`. Same authority, one fetch.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder — this is the first thing built in Phase A):**

1. **Palette Step 0 first.** Add `PAL.goldHot` and `PAL.divine`. If you skip this and inline raw HDR
   triplets, you violate "no raw hex" and the stops can't be tuned in one place. Get the tokens in, then
   build the module.
2. **Author the module in isolation, wire only the slab.** Create `temperature.js`, swap the slab's `body`
   for `gw_forge(veinTemp)`, leave every other consumer alone. `npm run build` green → `qa-route` at
   393×852 + 1440×900 with **0 console errors** (SwiftShader compiles the GLSL; a typo is a console error)
   → **then the iPhone 15 OLED read.** The ramp is load-bearing everywhere; lock its six stops before any
   second consumer touches it.
3. **Author for the ACES/AgX output, not the raw value (the #1 first-build mistake).** The renderer runs a
   tone-mapper; HDR `(1.9,1.25,0.7)` does *not* display as those numbers. Tune the six triplets *through*
   the operator in the `?debug` leva panel on the device. Flip to Khronos Neutral for one frame to verify the
   brand red is actually `#C1292E`-adjacent (`00-COHESION-MAP §3.2`).
4. **Keep hue and brightness separate.** Never bake brightness into the color stops. If you do, you lose the
   single knob that controls bloom and you'll fight `Bloom` intensity forever (the washed-out failure mode).
5. **Mind the sign convention (§4.4).** `gw_tempColor` wants *hotness* (1=hot); `gwCool01` returns *cooling
   progress* (1=cold). Always go through `gw_coolForge` for cooling surfaces so the `1.0 -` inversion is in
   one place. Mixing these up makes letters cool *into* white-hot — instantly wrong.
6. **The A/E must never reach `uTemp`.** Route them through `gw_divineFire` via `gw_coolForge(..., isAE=1)`
   only. Hard-separate the branch. If `uTemp` ever reaches an A/E, it cools with everything else and you
   break the single most important brand rule in the build.
7. **Monotonic stops, overlapping bands.** Never let a hotter stop be redder than a cooler one (classic
   gradient slip). Keep the deliberate `smoothstep` overlaps so there are no plateaus or hard seams as `t`
   sweeps 0→1.
8. **Linear vs sRGB.** `PAL` colors come from sRGB hex through `THREE.Color` with `ColorManagement`; the
   shader math is linear and emissive is added pre-tone-map. Don't paste sRGB triplets raw into the inline;
   let `v3(PAL.x)` carry the converted value, and verify on device — mismatch here makes the whole ramp look
   washed or too dark.
9. **Drive every `temp` dt-damped from the one writer.** No competing rAF, no `lerp(a,b,k)`. Freeze `uTime`
   on `static`.
10. **Verify on the device, not the headless shot.** Bloom spread, true-black, and the divine-fire
    white-gold do **not** simulate in SwiftShader. 0 console errors proves it *compiled*; only the iPhone
    proves it *reads*.

---

## 8. SOURCES (2025–2026)

1. **Maxime Heckel — _Field Guide to TSL and WebGPU_** — `Fn()` as the reuse/splitting primitive, compute-
   driven state textures, node-material emissive workflow; the TSL-portability target for this module.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — **2025-10-14**.
2. **Three.js Roadmap — _TSL: A Better Way to Write Shaders in Three.js_** — frames node `Fn()` reuse as the
   explicit replacement for fragile `.replace()`/`onBeforeCompile` injection; reusability/maintainability of
   shared shader functions. https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs —
   **2025**.
3. **Codrops — _Interactive Text Destruction with Three.js, WebGPU and TSL_** (Lolo Armdz) — TSL
   `emissiveNode`, MRT `emissive` bloom, "bloom everything emissive" workflow on text — the exact pattern for
   the divine-fire / pour-front bloom port. https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/ — **2025-07-22**.
4. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_** —
   noise-driven TSL mask + MRT + selective bloom on text; maps to the cooling-front (`gwCool01`) crust band
   and the letterform A/E bloom. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/ — **2026-01-28**.
5. **Codrops — _Implementing a Dissolve Effect with Shaders and Particles in Three.js_** — noise + moving
   threshold + thin emissive edge band; the crust/cooling-front primitive `gwCool01` drives.
   https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/ — **2025-02-17**.
6. **MMqd/plancks-law-colors** — Planck's-law temperature→color (Python + CIE XYZ) with Newton's-law-of-
   cooling shader integration and exponential `t∈[0,1]→Kelvin` mapping; the physics provenance the brand
   ramp honors in *ordering/curvature*. https://github.com/MMqd/plancks-law-colors — **2025-03-16**.
7. **AcademySoftwareFoundation/MaterialX — `mx_blackbody.glsl`** (`main`) — Kang et al. (2002) Planckian-
   locus cubic-spline approximation, `xy→XYZ→Rec.709`, with 2024–2025 commentary refining the lower bound to
   the Draper point; the locus-ordering reference. https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/libraries/pbrlib/genglsl/mx_blackbody.glsl — accessed **2026**.
8. **three.js forum — _Tone Mapping Overview_** (showcase) + **Issue #27362 _Support AgX tone mapping_** —
   ACES vs AgX saturation/path-to-white tradeoffs and AgX-as-TSL availability; informs authoring the six
   stops through the operator. https://discourse.threejs.org/t/tone-mapping-overview/75204 · https://github.com/mrdoob/three.js/issues/27362 — **2025**.
9. **TFTCentral — _Does OLED Have a Black Crush Problem?_** (Simon Baker) — near-black gamma cliff, RGB<3
   crushes to black on OLED; informs the `ironBlack` stop landing at true-void and the no-gamma-lift rule.
   https://tftcentral.co.uk/articles/does-oled-have-a-black-crush-problem-understanding-and-testing-oled-shadow-detail — **2026-02-10**.
10. **Luke Arcamo — _Making sense of Three.js shaders_** + Dusan Bosnjak — _Extending three.js materials with
    GLSL_ — the canonical `onBeforeCompile` / `ShaderChunk` import pattern for shared GLSL function libraries
    (the 2.A packaging this module ships). https://lukearcamo.github.io/articles/coding/making-sense-of-threejs-shaders — **2025**.

---

## 9. DEEP-DIVE CANDIDATES (Phase 2 sub-topics)

1. **The `gwCool01` Newton's-cooling timeline & per-letter `age` field.** Formalize the analytic `age =
   f(uFillFront, layoutU)` derivation, the eased cooling curve shape (`pow(.,0.7)` vs a tuned multi-segment
   ease), the crust-skin/ember-vein/frozen-ripple composite that layers on `gwCool01`, and the channel→letter
   handoff sharing one clock. Owns the temporal half end-to-end.
2. **MRT-emissive bloom & the WebGPU/TSL port of the five symbols.** Migrate from luminance-threshold bloom
   to a dedicated `emissive` MRT attachment so divine-fire/pour-front bloom is exact and reflection-immune,
   and land the `Fn()` twins with a WebGL2 fallback — plus the Safari/iOS WebGPU readiness audit that gates
   wiring it for the judge.
3. **OLED look-dev A/B: ACES vs AgX vs Khronos through the six stops.** Quantify where each temperature band
   lands post-tone-map on the iPhone-15 panel, whether AgX's hue-stable path-to-white serves the divine-fire
   white-gold and protects Celtic Blood better than ACES, and the grade re-tune per operator. (Locks the
   operator decision the cohesion map defers.)
4. **Divine-fire radiance model (`uAEFire`/`uAEFirePow`) into basalt & Ogham.** The light-spill term that
   turns `gw_divineFire` from self-emission into the *lighting* that reveals carved Ogham — the cheap
   in-shader grazing/proximity term, the capped RectAreaLight on `high`, and the baked emissive-AO lightmap
   for the static stone spill. Bridges this color authority into the world's lighting model.
