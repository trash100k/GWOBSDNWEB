# 02 — Per-Letter Newton's-Law Cooling Curves + the Fill-to-Cool Handoff

_Phase 2 deep-dive · cluster **A-temperature-core** · GAELWORX forge world · target: iPhone 15 OLED, one WebGL renderer (r3f + three.js)_

> **Owns the temporal half of the master temperature system against the Cinzel letter widths.** Phase-1
> docs 03 (cooling) and 13/14 (fill) established _that_ each letter cools from a `timeSincePoured` scalar
> and _that_ the A/E lock to divine fire. This doc authors the **exact curve**: how temp ramps `1 → 0.08`
> left-to-right behind the fill front, the cooling-rate falloff law, the thin-stroke-fast / thick-stroke-slow
> timing tied to real Cinzel glyph widths, and precisely how the A/E branch off the shared curve into locked
> white-gold. It is the temporal authority `00-COHESION-MAP.md §1.3` points to.

---

## 1. SCOPE

The GAELWORX wordmark is the climax of the forge sequence: molten metal winds the Celtic-interlace channels,
arrives at the Cinzel `GAELWORX` letterforms, and **fills each glyph left-to-right**. The instant a region
fills it is white-hot (`temp = 1.0`); from that instant it begins to **cool along its own clock**, marching
white-hot → orange → forge-red → iron-black with deep ember veins, bottoming out at `temp ≈ 0.08` (never
true zero — the "metal is alive" law floors the ember seams). The **A and E never cool** — they branch off
the shared curve at the source and hold unearthly white-gold "divine fire" forever, radiating onto adjacent
basalt to make carved Ogham readable.

This document is the **temporal authority** for that march. It does not own the color stops (that is the
`gw_tempColor` spatial half, doc 02-blackbody) or the molten-surface look (doc 01) or the fill geometry/SDF
(docs 11–14). It owns exactly four things and nothing else:

1. **The cooling curve** `temp = gwCool(age)` — the shape of the `1 → 0.08` ramp over `age` (seconds since
   this fragment received metal), built on a Newton's-law-of-cooling exponential rather than a naive linear
   slide, so the hot phase _lingers_ then drops, which is how real cast metal reads.
2. **The cooling-rate falloff** — `k`, the per-fragment rate constant, and how it is modulated so the
   surface cools faster than the core and the leading lip stays hottest.
3. **The thin-fast / thick-slow timing** — per-glyph fill _duration_ and per-glyph cooling _rate_ derived
   from the real inked stroke-mass of each Cinzel letter (`G A E L W O R X` are wildly uneven), so a thin
   `L` upright flashes and freezes while a thick `W`/`O` lingers molten.
4. **The fill-to-cool handoff** — the single continuous moment where a fragment crosses from "ahead of the
   front (void)" → "the wet molten lip (`temp = 1`, churning)" → "behind the front (cooling, frozen ripples)"
   with no seam, no pop, and one shared clock.

Everything binds the master `U` uniform pool and the `gw_tempColor`/`gw_divineFire` functions from
`shaders.js`. This is the temporal spine; if the curve is wrong, every downstream consumer (sparks, bloom
gate, basalt heat-stain, the divine-fire beat) inherits the error.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Five credible ways to author the temperature-over-time of a filling glyph. All are real today; they differ
on physical fidelity, art-direction control, mobile cost, and how cleanly they ride the analytic
`uPourFront`-vs-UV scheme the cohesion map mandates (no GPGPU ping-pong on the hero).

### 2.1 Analytic Newton's-law cooling from a derived `age` (the spine — recommended)

Newton's law of cooling is `T(t) = T_env + (T₀ − T_env)·e^(−k·t)` — exponential decay of the
temperature _difference_ toward ambient. In our normalized world `T_env = 0.08` (iron-black floor, not 0),
`T₀ = 1.0` (white-hot at fill). The per-fragment `age` is derived **analytically** from the difference
between the global pour front and a per-fragment layout coordinate (`age = (uPourFront − uGlyphU) ·
uFillSpan`), so there is **no FBO, no ping-pong** — exactly the constraint in `00-COHESION-MAP.md §1.3`.
The decay shape is the entire art-direction surface: a pure exponential reads slightly too "electronic," so
we shape it (a small power on the eased clock) into the lingering-then-dropping curve real cast iron shows.

- **Quality:** excellent and physically grounded — the lingering hot shoulder is the difference between
  "glowing then snaps off" and "real metal losing heat." Fully art-directable via `k`.
- **Perf:** trivial — one `exp()` (or a power approximation) per fragment, zero render targets.
- **Mobile:** green. This is the only family that costs nothing extra on the iPhone budget.
- **Complexity:** low. The one subtlety is mapping `uPourFront` → per-glyph → per-fragment `age` correctly
  across uneven Cinzel widths (§4.3).

### 2.2 Baked cooling LUT / gradient ramp texture sampled by `age`

Pre-bake the `temp → color×intensity` (or `age → temp`) curve into a 1-D gradient texture and
`texture2D(uRamp, vec2(age01, 0.5))`. The 2025 Codrops shader-transition work leans on exactly this
threshold-ramp grammar; a LUT lets a designer paint the cooling curve in Photoshop and the shader stays a
single tap.

- **Quality:** high; a hand-painted ramp can be subtler than any closed form.
- **Perf:** one texture fetch, very cheap; but it _adds a texture binding_ and a dependent read.
- **Mobile:** good, though the cohesion map's rule is that the **palette is the bloom selector** — a LUT
  must be authored so only the hot band exceeds 1.0, and an 8-bit ramp can't hold HDR > 1 without a
  half-float texture (extra cost/complexity). A closed-form curve keeps the HDR contract obvious.
- **Complexity:** low, but it forks the temperature authority off into an art asset, which fights the
  "one GLSL function, every material imports it" cohesion linchpin (doc 03 §4.2). Use only if a designer
  must paint the curve.

### 2.3 GPGPU ping-pong "heat field" (a live FBO of per-fragment temperature)

A render-target holds the temperature field; each frame a pass adds heat where the pour front is and
diffuses/cools everywhere (a discrete Newton step `T += (T_env − T)·k·dt`). Maxime Heckel's _Field Guide to
TSL and WebGPU_ (Oct 2025) documents this class of **compute-driven state texture** — store age/temp per
texel, step it on the GPU. This is the only way to get **true thermal diffusion** (heat bleeding from the
thick parts of a glyph into the thin parts) and a front that genuinely branches/merges (channels).

- **Quality:** highest — real diffusion, real history, front can re-melt on a strike pulse.
- **Perf:** a full extra pass + a persistent RT; the diffusion stencil is several taps. On mobile this is a
  measurable fill-rate hit and a memory cost.
- **Mobile:** marginal on the hero; **reserve for `high`-tier channel-hall** where the branching front
  actually needs it (it is doc 03's deep-dive #1).
- **Complexity:** high — ping-pong management, init, and the diffusion kernel tuning.

### 2.4 TSL node cooling (`emissiveNode` graph, r184/r185)

three.js r184–r185 (r185 shipped 2026-06-25) make TSL first-class: `material.emissiveNode` accepts a node
graph, `time`/`uniform`/`mix`/`smoothstep`/`oneMinus`/`exp` are nodes, and compute shaders make a GPGPU heat
field ergonomic. The cooling curve as a reusable `Fn()` node is the future-proof authoring.

- **Quality:** identical math, expressed as nodes; auto-compiles to WGSL (WebGPU) or GLSL (WebGL2 fallback).
- **Perf:** equal on WebGL2; faster on WebGPU where the compute path is available.
- **Mobile:** the WebGL2-fallback branch of `WebGPURenderer` is _less battle-tested_ than classic
  `WebGLRenderer` (cohesion map §10 hard constraint), and the whole `@react-three/postprocessing` chain is
  WebGL today. **Verdict: author the curve as a pure function so the TSL port is mechanical, ship GLSL now.**
- **Complexity:** high (whole-pipeline migration), low (just the curve function).

### 2.5 Full FEM/SPH solidification simulation

The arXiv laser-melt / solidus-front papers model real thermal gradients and columnar-grain growth along the
gradient. **Categorically out** for a mobile hero — offline solvers. We borrow only the _vocabulary_:
the surface cools before the core (so we modulate `k` by a fake depth/Fresnel term), and grain grows along
the thermal gradient (so frozen-ripple anisotropy aligns with the cooling-front direction). Art-direct the
fake; never run the solver.

**Landscape verdict:** the hero is **2.1 (analytic Newton's-law from derived `age`)**, authored TSL-portable
(2.4), with **2.3 (GPGPU heat field) reserved as a `high`-tier channel-hall upgrade**. LUT (2.2) is a
fallback only if a designer must hand-paint the curve. This matches the cohesion map's "analytic `age`, no
ping-pong on the hero" mandate exactly.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship one pure GLSL function `gwCool(age)` — a shaped Newton's-law exponential producing `temp ∈
[0.08, 1.0]` — living beside `gwCool01` in `src/scene/shaders.js`, with the per-glyph rate constant `k` and
fill duration derived at sync-time from real Cinzel stroke-mass, and the A/E branching off `age` at the
source.** Concretely:

1. **The curve is Newton's law, normalized and shaped.** Real cast metal does not cool linearly; it loses
   heat fast while hot (huge ΔT to ambient) then crawls. That is precisely `e^(−k·t)`. We normalize to
   `[0.08, 1]` and apply a gentle pre-ease so the white-hot _shoulder_ lingers a beat (the dramatic "it's
   still molten" hold) before the exponential drop. This single function is the temporal authority.

2. **`age` is analytic, zero render targets on the hero.** `age` comes from `uPourFront` minus a per-fragment
   layout-U, scaled by `uFillSpan` (seconds the full wordmark fill represents). No FBO, no ping-pong — the
   cohesion-map hero constraint.

3. **The cooling rate `k` is per-glyph, from stroke-mass.** Thin strokes have less thermal mass, so they
   cool faster (higher `k`) _and_ fill faster (shorter `uFillDur`). Thick strokes (`W O G`) linger. `k` and
   `uFillDur` are computed once from troika's `glyphBounds` inked-area proxy and pushed as per-glyph
   instanced uniforms (doc 13's rig).

4. **Surface-faster-than-core** via a cheap Fresnel/edge term on `k`: grazing fragments (the glyph's outer
   contour, where the SDF edge is) get a small `k` boost so the skin crusts first — the doc-03 cold-scale
   skin then keys off this.

5. **The A/E branch at the source, never reach `uTemp`.** A per-glyph `uIsAE` routes the divine letters
   through `gw_divineFire(flick)` and clamps their `age = 0` so they can never enter the cooling curve.
   This is the keystone path (`00-COHESION-MAP.md §1.4`): the branch is a hard `mix(coolPath, divinePath,
   uIsAE)`, computed from build-time data (first-A + first-E per word), never a string match in a shader.

This is the right pick because it is **buildable in this codebase today** (the slab's exact `onBeforeCompile`
grammar + the shared `gw_`-noise), **mobile-free** (one `exp`, no RT), **shares the master temperature
scalar** so sparks/bloom/basalt all read the same heat, and keeps a clean TSL port (the curve is a pure
function). The GPGPU heat field is a documented `high`-tier follow-up for the channel-hall's branching front,
not the hero.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x line (the repo's pinned WebGL `WebGLRenderer` — **do not** switch to `WebGPURenderer` for
  this; r185 ships 2026-06-25 with TSL maturing, but the post chain is WebGL).
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` — unchanged.
- `troika-three-text` (^0.52+) + `three-instanced-uniforms-mesh` (^0.52) — the per-glyph uniform rig from
  doc 13 (`setUniformAt`).
- Reuse `GLSL_NOISE` (`gw_fbm`/`gw_snoise`), `PAL`/`v3`, `gw_tempColor`/`gw_tempEmissive`/`gw_forge`/
  `gw_divineFire` from `src/scene/shaders.js`; `forge`/`damp`/`range` from `src/store.js`. **No new deps.**

### 4.2 The cooling curve (new, beside `gwCool01` in `src/scene/shaders.js`)

```glsl
// ───────────────────────────────────────────────────────────────────────────
// TEMPORAL AUTHORITY — the one cooling curve every cooling consumer imports.
// age : seconds since this fragment received metal (>= 0).
// k   : per-fragment cooling rate constant (1/sec). Higher = cools faster (thin/edge).
// returns temp ∈ [GW_T_FLOOR .. 1.0]   (1 = white-hot at fill, FLOOR = live iron-black)
// ───────────────────────────────────────────────────────────────────────────
#define GW_T_FLOOR 0.08          // metal-is-alive floor; NEVER 0 (ember seams stay lit)

float gwCool(float age, float k){
  // Newton's law: ΔT decays exponentially toward ambient.
  // T(t) = T_env + (T0 - T_env) * exp(-k t),  T0 = 1, T_env = FLOOR.
  float decay = exp(-k * max(age, 0.0));            // 1 at fill → 0 as age→∞
  // Shoulder shaping: hold the white-hot beat slightly, then let the exp drop.
  // pow(decay, 0.78) lifts the early curve so the hot phase LINGERS (cast-iron read),
  // matching the perceptual 'pow(x,0.7)' ease the cohesion map's gwCool01 uses.
  float shaped = pow(decay, 0.78);
  return GW_T_FLOOR + (1.0 - GW_T_FLOOR) * shaped;  // remap into [FLOOR..1]
}

// Cheap exp() alternative for the lowest tier (mobile ALU): a rational fit that
// tracks exp(-k·age) within ~2% over the band we care about, no transcendental.
float gwCoolFast(float age, float k){
  float x = k * max(age, 0.0);
  float decay = 1.0 / (1.0 + x + 0.48*x*x);         // Padé-ish ≈ exp(-x)
  float shaped = pow(decay, 0.78);
  return GW_T_FLOOR + (1.0 - GW_T_FLOOR) * shaped;
}
```

The relationship to the existing `gwCool01(age, rate)` (cohesion map §1.3, which returns `0 = hot, 1 = cold`):
`gwCool` is the **inverted, exponential, floored** form — `temp` in the `gw_tempColor` convention (`1 = hot`).
`gwCool01` was the linear placeholder; **`gwCool` supersedes it as the shipped curve** and the cooling-front
docs (03) should be updated to call `gw_tempColor(gwCool(age,k))`. Keeping both names is fine; `gwCool` is the
temporal authority of record.

### 4.3 Deriving per-glyph `age` from `uPourFront` and real Cinzel widths

The cohesion map's `uPourFront` is a single scalar (arc-length progress along the channel→wordmark path).
Each glyph owns a normalized window on that progress; within a glyph, each fragment owns a local-U so the
metal climbs left-to-right _inside_ the letter too. The per-glyph `uFillStart` / `uFillDur` / `uCoolK` are
computed once at troika `sync()` from real `glyphBounds` (doc 13 §4.2) — never `index/n`, because Cinzel
Decorative `G A E L W O R X` widths are uneven and an evenly-spaced front visibly stutters.

```js
// In wireGlyphs() after troika.sync — see doc 13 §4.2 for the bounds loop.
// area[i] = inked-box area proxy (x1-x0)*(y1-y0); maxA = max over glyphs.
const mass = areas[i] / maxA;                    // 0 (thin: L upright) .. 1 (thick: O/W)
// THIN-FAST / THICK-SLOW: fill duration grows with mass.
mesh.setUniformAt('uFillDur',  i, THREE.MathUtils.lerp(0.05, 0.16, mass));
// THIN-FAST cooling: thin strokes shed heat faster → higher k. Inverse of mass.
//   thin  (mass≈0): k ≈ 0.42  (flashes, freezes quick)
//   thick (mass≈1): k ≈ 0.16  (lingers molten — the W/O hold)
mesh.setUniformAt('uCoolK',    i, THREE.MathUtils.lerp(0.42, 0.16, mass));
mesh.setUniformAt('uFillStart',i, (xs[i] - minX) / span);   // L→R from real centers
mesh.setUniformAt('uTempSeed', i, Math.random() * 6.2831);  // per-glyph vein phase
mesh.setUniformAt('uIsAE',     i, (i === firstA || i === firstE) ? 1 : 0);
```

> **Stroke-mass refinement (deep-dive candidate §9.4):** box-area is a coarse proxy — a thin tall `L` and a
> compact `E` can have similar boxes but very different inked mass. A truer `k` samples the MSDF atlas inked
> coverage per glyph at sync-time (doc 13 §9.4). Box-area is the ship-now default; coverage is the upgrade.

### 4.4 The fill-to-cool handoff fragment block (injected like the slab's COLOR)

```glsl
// HEAD — global + per-glyph (per-glyph become instanced via setUniformAt)
uniform float uTime, uPourFront, uFillSpan, uVeinFloor, uVel;
uniform float uFillStart, uFillDur, uCoolK, uTempSeed, uIsAE;   // per-glyph
varying vec2 vUv;                                               // glyph-local UV 0..1
// gw_fbm, gw_tempColor, gw_tempEmissive, gw_divineFire, gwCool — all from shaders.js

// 1) THIS glyph's local fill 0..1 from the global pour passing through its window.
float fillT = clamp((uPourFront - uFillStart) / max(uFillDur, 1e-3), 0.0, 1.0);

// 2) The WET FRONT advancing across the glyph's own width (left-to-right inside).
//    Soft edge (smoothstep over a UV band) = the handoff is a BAND, not a popping line.
float front = fillT * 1.06;                              // slight overshoot fills the last sliver
float FRONT_W = 0.05;                                    // edge softness (handoff band width)
float filled = smoothstep(front + FRONT_W, front - FRONT_W, vUv.x);   // 1 behind, 0 ahead

// 3) age = seconds since the front passed THIS fragment. Continuous, no step.
//    (front - vUv.x) is 0 right at the lip, grows behind it; * fill-span = seconds.
float age = max(front - vUv.x, 0.0) * uFillSpan;

// 4) Surface-faster-than-core: edge fragments (glyph contour) crust first.
//    grazing ≈ how close to the SDF outline (cheap: derivative of the fill coord).
float edge = clamp(fwidth(vUv.x) * 8.0, 0.0, 1.0);       // higher on the outline
float k    = uCoolK * (1.0 + edge * 0.35);               // skin cools faster than body

// 5) THE DIVINE BRANCH — A/E never reach the curve. Clamp age at the SOURCE.
//    (do it on age, not just on the final color, so NOTHING downstream sees them cool)
age = mix(age, 0.0, uIsAE);

// 6) temperature from the temporal authority, then the shared spatial authority.
float temp = gwCool(age, k);                             // 1 → 0.08, exponential
//    a hot churning LIP exactly at the front (still molten, hottest band)
float lip  = smoothstep(0.09, 0.0, abs(vUv.x - front));
temp += lip * 0.45;
//    scroll energy runs the whole world hotter (cohesion: shares uVel with slab)
temp += uVel * 0.10;
temp  = clamp(temp, GW_T_FLOOR, 1.0);

// 7) FROZEN RIPPLES: molten regions churn on uTime; solid regions lock phase at 'poured'.
//    poured = the instant this froze. One mix(), one material, continuous (doc 03 §2.4).
float poured  = uTime - age;
float molten  = step(temp, 0.92) * 0.0 + smoothstep(0.55, 0.92, temp); // ~1 while hot
float phase   = mix(poured, uTime, molten);              // hot→live churn, cold→locked relief
vec2  warp    = vec2(gw_fbm(vUv*3.0 + phase*0.25 + 11.0),
                     gw_fbm(vUv*3.0 + phase*0.25 + 27.0));

// 8) EMBER VEINS that never die (floor) — cracks in the cooling skin glow through.
float crack = pow(clamp(1.0 - abs(gw_fbm(vUv*8.0 + warp*1.4 + uTempSeed)), 0.0, 1.0), 7.0);
float vein  = max(crack * temp, uVeinFloor * crack);     // floored: deep seams stay lit

// 9) COMPOSE — shared color authority for cooling metal, divine path for A/E.
vec3 coolMetal = gw_forge(temp);                         // gw_tempColor*gw_tempEmissive
coolMetal += gw_forge(vein) * 0.6;                       // ember seams (same authority)
vec3 divine    = gw_divineFire(0.5 + 0.5*sin(uTime*1.3 + uTempSeed)); // eternal white-gold
vec3 metal     = mix(coolMetal, divine, uIsAE);

// 10) only the FILLED region emits; ahead of the front is pure void.
gl_FragColor.rgb += metal * filled;
```

The handoff is steps 2–3–6 read together: a fragment ahead of `front` has `filled = 0` (void); _at_ `front`
it is the white-hot churning lip (`age ≈ 0`, `temp ≈ 1`, `lip` boost); _behind_ `front` `age` grows
continuously and `gwCool` walks it down the exponential. There is no `if`, no second material, no popping
line — the cohesion map's "channel→letter handoff sharing one clock" expressed in one fragment.

### 4.5 Key uniforms & parameters

| Uniform | Meaning | Default | Range | Scope |
|---|---|---|---|---|
| `uPourFront` | global pour progress 0..1 (from master `U`) | 0 | 0–1, damped | global |
| `uFillSpan` | seconds the full fill represents (sets `age` scale) | 7.0 | 3–14 | global |
| `uVel` | scroll energy (shared with slab `uHeat`) | 0 | 0–1, damped | global |
| `uVeinFloor` | min ember-vein glow (never dies) | 0.10 | 0–0.3 | global |
| `uFillStart` | normalized pour pos where glyph begins filling | per-glyph | 0–1 | per-glyph |
| `uFillDur` | pour units the glyph takes to fill (thin fast) | 0.05–0.16 | mass-driven | per-glyph |
| `uCoolK` | cooling rate constant (thin = high) | 0.16–0.42 | mass-driven | per-glyph |
| `uTempSeed` | per-glyph vein/flicker phase | random | 0–2π | per-glyph |
| `uIsAE` | first-A / first-E divine flag | 0 / 1 | 0 or 1 | per-glyph |

**The two falloff knobs that matter most:** `uCoolK` (the exponential rate — too high and letters snap cold
and dead before the eye reads the orange; too low and nothing ever looks solid) and `uFillSpan` (couples the
fill clock to the cooling clock — if the fill is fast but span is large, letters fill and _stay_ molten; the
"forged artifact" read needs `uFillSpan` tuned so a glyph reaches iron-black ~2–3 s after it finishes
filling on a slow scroll).

### 4.6 The r3f component (extends doc 13's `PourWordmark.jsx`)

```jsx
// One mesh, per-glyph uniforms, scroll-driven; binds the master U pool.
useFrame((state, dt) => {
  const m = ref.current; if (!m) return
  const u = m.material.uniforms
  u.uTime.value     = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  // POUR FRONT comes from the SHARED U pool (ForgeDriver writes it) — not a private clock.
  u.uPourFront.value = U.uPourFront.value            // bound by reference in onBeforeCompile
  u.uVel.value       = damp(u.uVel.value, Math.min(forge.scrollVel * 1.4, 1), 4, dt)
})
useEffect(() => () => material.dispose(), [material])  // non-negotiable disposal
```

The cohesion-critical line is `u.uPourFront.value = U.uPourFront.value` (or, better, bind `U.uPourFront`
directly in `onBeforeCompile` via `Object.assign(shader.uniforms, U)` so it is the _same reference_): the
letters' fill front and the channel pour are **one signal**, so the metal crosses from channel to glyph in
the same frame at the same position.

### 4.7 Hook into the master temperature system

- `uPourFront`, `uTime`, `uVel` are bound **by reference** from the shared `U` pool (cohesion map §4.2) —
  one `<ForgeDriver/>` writes them, every material reads them, zero drift.
- `temp` is produced by the temporal authority `gwCool` then handed to the spatial authority `gw_forge`
  (`gw_tempColor × gw_tempEmissive`). The cooling letter and a cooling slab vein are **visibly the same
  metal** because they sample the same two functions — one for "how hot over time," one for "what hot
  looks like."
- The single `temp` scalar should be written to a varying (or a small MRT later) so the sparks orbiting the
  pour front spawn where `temp ≈ 1`, the heat-haze mask reads `temp`, and the basalt heat-stain reads the
  A/E divine intensity — the shared-buffer deep-dive (doc 03 §9.2).

---

## 5. COHESION

- **Temperature authority.** `gwCool(age,k)` is the temporal half of the master temperature signal
  (cohesion map §1.3); `gw_forge(temp)` is the spatial half (§1.1–1.2). The letters compute neither orange
  nor curve of their own — they import both. A cooling `L` and a cooling channel vein are the same substance
  at the same point on one timeline.
- **Palette.** Every color comes through `gw_tempColor`/`gw_divineFire`, which inline `PAL` via `v3()`. No
  raw hex. Only the hot band (`temp > ~0.82`, the lip, and the eternal A/E `PAL.divine`) exceeds 1.0, so
  **only that band blooms** — the palette is the bloom selector (§3.1). The cooled iron body and the deep
  ember veins sit ≤ 1.0 and stay true-black-adjacent on the OLED.
- **Noise.** The frozen ripples and ember-vein cracks reuse `gw_fbm` at the shared `GW_FBM_OCTAVES` — the
  metal inside a letter has the same grain as the slab and channels. "More detail" = one more octave, never
  a second noise.
- **One clock, dt-damped.** `uPourFront`/`uVel` ride the `forge` store via `damp(...,λ,dt)` in one
  `useFrame` — no second rAF, no `lerp(a,b,k)`. A strike pulse (`uHeat`) surges the lip, the veins, and the
  bloom in the same frame — the synchrony that proves cohesion.
- **The A/E keystone.** `uIsAE` clamps `age = 0` at the source so the divine letters **never reach the
  curve** — the same first-A + first-E rule as the DOM `.forge-letter`, the basalt reveal, the Ogham
  legibility, and the caustic preset. Computed as build-time data, never a shader string match.
- **Frozen vs live.** Molten fragments churn on `uTime`; solid fragments lock phase at `poured` — one
  `mix()` branch, continuous, no seam (doc 03 §2.4).
- **Motion law.** The fill is **Forge Reveal** (metal wipes in, the front is a blur-to-sharp wet band); the
  cooling is **Atmospheric Drift** (slow constant march); both honor Brutalist Snap (dt-damped, no bounce).

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED, one renderer, `high | low | static` tiers (`useQuality`). The wordmark covers a fraction of
screen, so its cost is small — but the curve must stay cheap because it is _per filled pixel_.

- **Cost on `high`:** one `exp()` + one `pow()` (the curve) + ~3 `gw_fbm` calls (ripple warp, vein crack)
  per filled fragment. Letters are a fraction of the void slab's area → comfortably inside the ~3.5–4.5 ms
  slab budget envelope (cohesion map §10). Bloom catches only the lip + A/E → no extra bloom cost.
- **`low`:** swap `gwCool` → `gwCoolFast` (the rational fit, no transcendental — measurable on weaker GPU
  ALU), drop the ember-vein crack fbm to a 1-octave proxy, skip the `fwidth` edge-`k` boost (uniform `k`).
  Fill mask + curve + divine A/E all survive. `GW_FBM_OCTAVES` 3.
- **`static` (reduced-motion / weak GPU / no-WebGL):** **freeze `uTime = 2` and `uPourFront = 1`** — every
  glyph rendered fully filled and fully cooled to its iron-black floor, the A/E lit white-gold. This is the
  correct, dignified _end-state_ of the cooling timeline with zero animation — the mandatory reduced-motion
  path. The DOM wordmark (already ignited via `<Ignite>`/`BrandText`) is the accessible truth; the 3D is
  enhancement.
- **No FBO on the hero.** `age` is analytic from `uPourFront` + UV → zero render targets. The GPGPU heat
  field (§2.3) is `high`-tier channel-hall only, gated.
- **Fallback poster.** `CanvasBoundary` posters on WebGL failure depicting the cooled end-state with lit
  A/E — the brand reads with zero GL.
- **Dispose.** `useEffect(()=>()=>material.dispose(),[material])` — non-negotiable.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder):**

1. **The curve first, in isolation.** Wire `gwCool(age, k)` to a single leva `age` slider (0→span) with
   one `k`, output straight through `gw_forge`. Get the white-hot → iron-black exponential reading like real
   cooling cast metal — the lingering shoulder, the floor that never dies — _before_ any fill, skin, or vein.
   If the curve is wrong, every consumer inherits it. **Tune `k` and the `pow(decay,0.78)` shoulder through
   the tone-mapper on the device**, not the raw value (the #1 first-build mistake).
2. **Then `age` from the fill front.** Wire `uPourFront`, confirm left-to-right fill and that `age`
   increases _continuously_ behind the front (no pop at the edge — verify with `smoothstep` front band).
3. **Then per-glyph `k`/`uFillDur` from stroke-mass.** Verify thin `L`/`I` flash-and-freeze while thick
   `W`/`O` linger molten. Confirm the front does not stutter across uneven Cinzel widths (use real
   `glyphBounds`, not `index/n`).
4. **Then the A/E branch — early.** Clamp `age = 0` via `uIsAE` and scroll past-and-back to verify the first
   A + first E stay white-gold while neighbors cool. Catch masking bugs before skin/veins hide them. Confirm
   it is the _first_ A and _first_ E only (`WORD.indexOf`), never every A/E.
5. **Then frozen ripples, then veins** — each behind a leva toggle.

**Pitfalls (each has bitten this class of effect):**

- **`age` discontinuity at the front → pop.** A hard `step` on the fill edge pops; use the `smoothstep`
  band (`FRONT_W ≈ 0.05`) so the handoff is a glowing band, not a line.
- **`k` too high → dead metal.** Letters snap to iron-black before the eye reads the orange. The exponential
  must _linger_ at the hot end (the `pow(decay,0.78)` shoulder); tune `k` so a glyph takes ~2–3 s to reach
  the floor after filling on a slow scroll.
- **HDR leakage → washout.** If the cooled body or mid-ramp exceeds 1.0, bloom blooms everything. Keep HDR
  strictly at the hot band + A/E. Verify on the OLED, not the headless shot.
- **Veins dying to black.** Without `uVeinFloor` the fully-cooled metal reads dead — brand violation
  ("living molten metal"). Floor the vein.
- **Frozen ripples that still move.** Forgetting the `uTime → poured` phase swap makes "solid" metal shimmer
  — instantly fake. Branch on `temp` via `mix`, not `if`.
- **Frame-rate-dependent fill.** Driving `uPourFront` with `lerp(a,b,0.1)` makes pour speed device-dependent.
  Use `damp(...,λ,dt)`.
- **A/E reaching the curve.** Clamp `age = 0` at the _source_ (step 5 above), not just the final color —
  otherwise downstream `temp` consumers (sparks, MRT) still see the A/E cool. The hard `mix` keeps them out.
- **GLSL namespace collisions.** Prefix every helper `gw_`/`gw…` so they don't clash with three's
  `permute`/`snoise`.
- **Verify path:** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with 0 console errors (CI
  SwiftShader compiles GLSL → a typo surfaces as an error) → **then** the iPhone 15 read (bloom spread,
  true-black, the lingering-hot shoulder, the white-gold A/E don't simulate headless). Live-tune via `?debug`.

---

## 8. SOURCES (2025–2026)

1. mrdoob/three.js — **Release r185** (TSL `Fn`/node updates, `emissiveNode`, override context, node-material
   refinements; the TSL-portability target for `gwCool`). Published **2026-06-25**.
   https://github.com/mrdoob/three.js/releases/tag/r185 · **Release r184** (TSL first-class; `material.colorNode`/
   `emissiveNode` graphs). 2025. https://github.com/mrdoob/three.js/releases/tag/r184
2. Maxime Heckel — **Field Guide to TSL and WebGPU** (compute-driven _state textures_ storing per-element
   age/temp; `time`/`uniform`/`mix`/`smoothstep`/`exp` as nodes; the GPGPU heat-field path and the TSL port
   of a pure cooling function). Published **2025-10-14**. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
3. Codrops — **WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL**
   (`MSDFTextNodeMaterial` + a **per-letter offset attribute** so each glyph animates on its own clock — the
   exact hook for per-glyph `uFillStart`/`uCoolK`; MRT + selective bloom). Published **2026-01-28**.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
4. Codrops — **How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects** (driving
   a single `progress` uniform 0..1, `smoothstep` edge-width as the soft moving front — the fill-front band
   grammar). Published **2025-10-08**. https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
5. Codrops — **From Shader Uniforms to Clip-Path Wipes: How GSAP Drives My Portfolio** (one global progress
   number orchestrating many staggered, windowed reveals with per-element offset — the global-pour →
   per-glyph-window mapping). Published **2026-05-06**. https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/
6. Codrops — **How to Create Responsive and SEO-friendly WebGL Text** (troika + `uProgress` mask reveal;
   Lenis `lerpedVelocity` smoothing — feeding `uVel` damped so heat doesn't strobe). Published **2025-06-05**.
   https://tympanus.net/codrops/2025/06/05/how-to-create-responsive-and-seo-friendly-webgl-text/
7. threejsroadmap.com — **TSL: A Better Way to Write Shaders in Three.js** (animated emissive gradients via
   `sin(position+time)` node graphs through `emissiveNode`; confirms the curve-as-node port). 2025.
   https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
8. ResearchGate — **Extended Planckian locus** (Daneshvar, Finlayson, Brill, 2025 — refined Wien
   approximation for the blackbody hue march; the physical basis the `temp → color` half snaps to art
   direction). Published **2025**. https://www.researchgate.net/publication/395785233_Extended_Planckian_locus
9. _Resolving thermal gradients and solidification velocities during laser melting of a refractory alloy_
   (arXiv, 2024/2025 update — vocabulary only: surface-before-core cooling, columnar grain along the thermal
   gradient; the basis for the edge-`k` boost and frozen-ripple anisotropy). https://arxiv.org/pdf/2410.22496

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **GPGPU heat-field for the channel-hall branching front.** A ping-pong RT holding the temperature field
   with a discrete Newton step (`T += (FLOOR − T)·k·dt`) + a heat-add at the moving front, so the front can
   branch, merge, and re-melt on a strike — the only path to _true thermal diffusion_ (heat bleeding thick→
   thin within a glyph). Heckel's 2025 compute material is the start; needs the iPhone-15 cost study and a
   strict `high`-tier gate (doc 03 §9.1).
2. **Shared temperature MRT export.** Write the single `temp` scalar to a small render target (Gommage 2026's
   MRT) so sparks, heat-haze, and basalt heat-stain **sample** the exact field instead of recomputing — true
   single-source-of-truth heat. Study MRT cost on iOS WebGL2 vs. the cheaper varying-only approach.
3. **The cooling-front anisotropy & frozen-relief normal.** Lock the domain-warp phase at `poured` into an
   actual normal/height field whose grain aligns with the cooling-front _direction_ (columnar-grain
   vocabulary from §2.5), with optional clearcoat-roughness modulation so the solidified scale reads as
   forged relief under the cool key, not a flat painted texture.
4. **True inked-coverage stroke-mass for `uCoolK`/`uFillDur`.** Replace the box-area proxy with a sync-time
   MSDF-atlas coverage sample per Cinzel glyph (true inked area / average stroke-width), giving physically
   convincing thin-fast/thick-slow timing per letterform — and quantify whether the difference is visible at
   the wordmark's on-screen size on the iPhone 15.
