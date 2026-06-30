# 07 — Rotated-Octave FBM + 3D Simplex + Two-Level Warp: The Shared-Noise Toolkit Growth

_Phase 2 deep-dive · GAELWORX forge world · cluster **F-noise-shared** · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js), `MeshPhysicalMaterial.onBeforeCompile` chunk injection · the file under the knife:
`src/scene/shaders.js`_

> **Reads on top of `00-COHESION-MAP.md` (§2 the shared noise basis, §1 temperature, §10 perf budget),
> `phase1/10` (the noise-toolkit landscape verdict), `phase2/04` (`gw_flow` molten surface, which *consumes*
> these primitives), and `phase2/01` (the `gw_tempColor`/`gw_forge` authority that the noise feeds).** Where
> `phase1/10` sketched the whole `gw_` toolkit at survey altitude, **this document is the additive growth of
> exactly three primitives and one composite** — `gw_snoise3` (3D simplex), `gw_fbm3` (3D fbm), the 2×2
> inter-octave rotation that kills axis-alignment, and `gw_warp` parameterized to two molten levels / one
> basalt level — plus the *engineering proof* that the existing obsidian slab keeps compiling **byte-identical**
> and that `GW_FBM_OCTAVES` unrolls per tier with **zero runtime branch**. This is Phase-A step 3 of the build
> sequence (`00 §8`): land the primitives, compile-green, before any look consumes them.

---

## 1. SCOPE

Noise in GAELWORX is not an effect — it is **the substrate every effect samples** (`00 §2`). The molten pour,
the cooling crust, the ember veins, the basalt grain, the heat-haze, the smoke, the spark advection, and the
caustics are all the *same handful* of `gw_`-namespaced GLSL functions, read at different scales, warps, and
time-rates. The single failure mode the whole world guards against is "a new element with its own orange, its
own noise, or its own clock" (`00 §7`). This deep-dive owns the **noise half of that contract**: there is one
well, and growing it is *additive* — never a fork.

The repo today (`src/scene/shaders.js`, 40 lines) ships the seed: `gw_permute`, `gw_snoise` (2D Ashima
simplex), `gw_fbm` (a hardcoded **3-octave 2D** loop with offset-only progression `p*2.03 + offset`), and
`gw_caustic` (single-level domain warp). The slab (`ObsidianSlab.jsx`) and the jewel are the *only* current
consumers, and they consume `gw_fbm` / `gw_caustic` at 2D. The work here is to grow that into the toolkit the
molten metal, the 3D-evolving cooling field, the curl-fed sparks, and the basalt all need — **without
touching a single byte the slab already reads**.

Three things must be true when this lands:

1. **`gw_snoise3` + `gw_fbm3` exist** so the molten surface can "boil in place" via time-as-3rd-dimension
   (`snoise3(vec3(p, t))`), so the cooling field can evolve volumetrically, and so analytic-derivative 3D
   curl (`gw_curl3`, its own deep-dive) has a gradient source. (`00 §2`, `phase1/10 §2.5`.)
2. **A 2×2 rotation runs between every fbm octave** — the near-free quality win that kills the residual
   axis-aligned streaking stacked simplex octaves still show (`phase1/10 §2.2`). The current `gw_fbm` only
   *translates* between octaves; translation alone leaves a faint grid.
3. **`gw_warp` is parameterized** — two warp levels for the molten (churning, folding, *thick*), one level for
   the basalt veins (cheaper, calmer). This is the single term that most makes metal read viscous, not
   scrolling (`00 §2`, `phase1/10 §2.4`).

And the engineering invariants, which are the *point* of the cluster name **F-noise-shared**:

- The **obsidian slab compiles unchanged** — `gw_fbm(vec2)` and `gw_caustic(vec2)` keep their exact
  signatures and exact 3-octave behavior, so `/` is byte-identical (`00 §8` step 2 demands the home route stay
  identical through the spine work).
- **`GW_FBM_OCTAVES` is a compile-time `#define`** that selects the octave count *per tier* and the loop
  **unrolls with zero runtime branch** — the §10 cohesion-hinge lever (4→3→2 by tier) that thins *all*
  procedural detail uniformly so nothing looks selectively broken.

Out of scope (own deep-dives, consume this): `gw_worley` F1/F2 crackle (`phase1/10 §2.1`, high-tier only),
`gw_curl3` advection (`phase1/10 §2.3`), `gw_flow` per-octave advected molten (`phase2/04`), the
`gw_tempColor`/`gw_forge` ramp (`phase2/01`). This doc lands the *primitives those four stand on*.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 The primitive: 2D vs 3D simplex (and why simplex, still, in 2026)

The 2025 consensus has not moved the ranking — it has only added copy-paste TSL parity. Dan Greenheck's
**_10 Noise Functions for Three.js TSL Shaders_** (Three.js Roadmap, Dec 2025) walks white → value → Perlin →
**simplex** → Worley, then the layering composites (fBm, ridged, turbulence), and lands on the same verdict
that has held for fifteen years: **simplex is the workhorse** because it is *isotropic* (no axis-aligned
streaks — the property fire and flowing metal live or die on), has a **cheap analytic derivative** (the feed
for fast curl), and **scales better to higher dimensions** than classic Perlin (the simplex grid needs `n+1`
corners, not `2ⁿ`). The Ashima/Gustavson `webgl-noise` port (Ian McEwan / stegu, the canonical
`Efficient computational noise in GLSL`, arXiv 1204.1461) is *textureless and dependency-free* — pure ALU,
GLSL 1.20, WebGL-safe — which is exactly why the repo's `gw_snoise` is already an Ashima port and why the 3D
sibling `snoise(vec3)` is a drop-in additive grow (it needs only `permute(vec4)` + `taylorInvSqrt(vec4)`,
both self-contained).

The honest tradeoff between 2D and 3D simplex:

| | 2D simplex (`gw_snoise`) | 3D simplex (`gw_snoise3`) |
|---|---|---|
| Cost (relative) | 1.0× (baseline) | **~1.8–2.2×** (more corners, more dot products) |
| Animates by | warp-offset advection (slides) | **time as 3rd axis** (boils in place) |
| Curl | needs finite-diff (2 extra) | **analytic 3D gradient** (3 evals total) |
| Axis-streak risk | medium (rotation fixes) | medium (rotation fixes) |
| Use in GAELWORX | basalt grain, coverage masks, caustic | molten boil, cooling field, curl source |

The 2026 read: **keep 2D as the cheap default for flat/static fields, add 3D only where the field must evolve
volumetrically or feed curl.** Do not blanket-upgrade everything to 3D — that is ~2× fill-rate for no visible
gain on a coverage mask. The slab's veins stay 2D forever; the molten surface gets 3D.

### 2.2 The inter-octave rotation (the near-free quality win)

Stacking simplex octaves with only a *translation* between them (`p = p*2.03 + offset`, what `gw_fbm` does
today) leaves a faint **axis-aligned grid** — the lattice of each octave lands on roughly the same diagonals,
and the eye reads a subtle plaid in large flat regions. The fix, canonical since Inigo Quilez's
**_fBm_** article (`iquilezles.org/articles/fbm`, the reference every 2025 source re-derives) and re-covered
verbatim across 2025 write-ups, is to **rotate the domain a few degrees between octaves** so successive
lattices are decorrelated:

```
fbm(p) = Σ aᵢ · noise(p · 2ⁱ · Rⁱ),   R = mat2(0.80, 0.60, -0.60, 0.80)   // ≈ 36.87°
```

The MiniMax-AI `shader-dev/domain-warping` skill (a 2025 agent-skill knowledge base, actively used by coding
agents in 2025-2026) states the same constant flatly: `mat2(0.80, 0.60, -0.60, 0.80)` is **"the most widely
used decorrelation transform,"** and pairs it with the second standard trick — **non-integer lacunarity**
(2.01–2.04 rather than exactly 2.0) to further break lattice repetition. The repo's `2.03` already does the
second half; the rotation is the missing first half. **Cost is one `mat2 * vec2` per octave** — two
multiplies and an add, effectively free against a full simplex evaluation (~30+ ops). This is the highest
quality-per-cost edit in the entire toolkit.

A subtlety worth pinning: the IQ formula composes `Rⁱ` (the rotation compounds each octave). In a loop you
get that for free by re-applying the *same* `R` to the running `p` each iteration — you never build `Rⁱ`
explicitly, you just rotate the accumulator. Combining rotate + scale into a single `mat2(1.6, 1.2, -1.2,
1.6)` (R scaled by lacunarity 2.0) is a documented micro-optimization, but it **welds lacunarity to the
rotation** and makes the non-integer-lacunarity trick awkward; for GAELWORX, keep them separate (`p =
rot * p * LACUNARITY + offset`) — clearer, and the extra multiply is in the noise.

### 2.3 Domain warping: one level vs two (viscous vs scrolling)

Domain warping feeds noise into the *coordinates* of more noise — `fbm(p + fbm(p + fbm(p)))` — and it is the
single technique that separates "orange noise" from **molten, marbled, viscous metal** (IQ
`iquilezles.org/articles/warp`, re-covered by AltPsyche's _FBM and Domain Warping_ 2025, the MiniMax skill,
and the RobbyLawrence `web-lava-demo` which explicitly stacks fBm + Worley + domain-warp for lava). The
MiniMax skill quantifies the cost ladder precisely: **three warp layers × six octaves = 18 noise samples per
pixel**; dropping to 4 octaves is ~33% off, dropping from 3 warp layers to 2 is another ~33%. Warp depth is
*linear* in cost — each level is another full fbm evaluation — so it is the first knob to drop on mobile, and
the right place to parameterize.

GAELWORX wants **two levels for the molten** (the churning, folding, thick read — `00 §2` calls two-level
warp "the term that most makes metal read as viscous, not scrolling") and **one level for the basalt veins**
(calmer, cheaper, the green-black Connemara depth doesn't churn). One parameterized `gw_warp(p, levels)`
serves both — never two functions.

The Codrops **_Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL_** (Mar 10, 2025) is
the cleanest modern reference for the *exact* composition we want: an fBm field, domain-warped, driving the
emissive interior of a physical glass material — structurally identical to the slab's veins inside obsidian
and the molten inside the channels. It uses TSL's `Loop()` for the octaves and a 3D noise for the volumetric
swirl; the GLSL we ship is the same recipe one renderer earlier.

### 2.4 Animating without scrolling (the "boil in place" law)

`00 §2` is explicit: the noise must **boil in place**, never **scroll** (time added to a coordinate slides the
texture and reads thin/fake). Three 2025-relevant ways, in increasing fidelity:

- **Domain-warp advection** (what the slab does: `uTime*0.05` *inside the warp offset*) — cheap, reads as
  flow, already shipped. Fine for the slab veins.
- **Time as the 3rd noise dimension** — `gw_snoise3(vec3(p, uTime*rate))`; the field morphs in place,
  isotropically. **This is why `gw_snoise3` is the headline grow** — it's the recommended default for the
  molten surface (`phase1/10 §2.5`).
- **Perlin–Neyret rotating-gradient flow noise** — highest fidelity, more math, reserved for `gw_flow`
  (`phase2/04`), out of scope here.

### 2.5 The TSL question (deferred, not ignored)

The defining 2025-2026 shift is **TSL maturing to first-class**: r184 (March 2026 release line per
LearnWithHasan's r184 shaders guide and the threejsroadmap TSL article) ships TSL as the stable node-graph API
that lowers to **GLSL on WebGLRenderer and WGSL on WebGPURenderer from one source**, with built-in
`mx_noise_float` / `mx_noise_vec3` / `mx_cell_noise_float` (MaterialX noise) and `Loop()` for octave layering.
Maxime Heckel's **_Field Guide to TSL and WebGPU_** (Oct 14, 2025) shows compute shaders replacing FBO
ping-pong and a transpiled Perlin noise driving a `positionNode`. The cohesion story is beautiful: one noise
graph, every chamber, both backends.

**But** `00 §10` is non-negotiable: the *judge device* ships WebGL2 + `onBeforeCompile`; the WebGL2-fallback
branch of `WebGPURenderer` is *less* tested, and R3F's WebGPU async init is still flagged experimental in 2025
examples. The pragmatic 2026 read is unchanged: **stay on the GLSL `onBeforeCompile` path, but author the
toolkit TSL-portable** — matching names (`gw_fbm`/`gw_warp`), same octave/warp structure, the rotation as a
`mat2` that maps 1:1 to a TSL `mat2()` node — so the eventual port is a re-host, not a rewrite.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Grow `src/scene/shaders.js` additively: append `gw_snoise3` (Ashima 3D), `gw_fbm` upgraded with an
inter-octave 2×2 rotation behind a compile-time `GW_FBM_OCTAVES` define, a parallel `gw_fbm3`, and one
parameterized `gw_warp(levels)`. Leave the existing `gw_snoise`/`gw_caustic`/slab-facing `gw_fbm` semantics
byte-identical. Defer TSL.**

The pick, justified against the world and the constraints:

- **Additive, slab-safe.** The slab reads `gw_fbm(vec2)` and `gw_caustic(vec2)`. We keep those signatures and
  their *exact 3-octave output* by setting the home/`high` default `GW_FBM_OCTAVES 3` — so `/` is
  byte-identical (`00 §8` step-2 contract). New consumers opt into 3D and into warp explicitly.
- **One well, every effect drinks.** `gw_fbm` / `gw_fbm3` / `gw_warp` become *the* detail source; "more
  detail" is always one more octave, never a second noise (`00 §7` rule 2).
- **The rotation is the cheapest cohesion upgrade available** — it kills the plaid uniformly across every
  consumer at ~2 ALU ops/octave (§2.2).
- **`gw_warp(levels)` parameterization** lets molten=2 / basalt=1 from one function — viscosity where it
  matters, cost saved where it doesn't (§2.3).
- **`GW_FBM_OCTAVES` as a `#define` + `#pragma unroll_loop`** delivers the §10 lever with *zero runtime
  branch* (§4.4) — the cohesion hinge that degrades all detail uniformly.
- **TSL-deferred** sidesteps the WebGPU/Safari/R3F-async reliability risk on the judge device while leaving a
  clean port seam (§2.5).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js** — current repo pin (WebGLRenderer + `MeshPhysicalMaterial.onBeforeCompile`). **No new dep.**
- **react-three-fiber / drei / @react-three/postprocessing** — as installed. **No new dep.**
- **Reference only (never bundled at runtime):** Ashima `webgl-noise` `noise3D.glsl` (the `snoise(vec3)`
  source we port), `lygia` (rotation-between-octaves reference), IQ `articles/fbm` + `articles/warp`.
- **Deferred (WebGPU only, post-judge):** `three/tsl` `Fn` + `mx_noise_vec3`.

### 4.2 The additive grow (append to `src/scene/shaders.js`, below `gw_caustic`)

The existing header (`gw_permute(vec3)`, `gw_snoise(vec2)`, `gw_fbm(vec2)`, `gw_caustic(vec2)`) stays
**exactly as-is**. We append a new block. Note the 3D simplex needs `vec4` helpers, which we add `gw_`-prefixed
so they never collide with three's built-in `permute`/`taylorInvSqrt` chunks (the documented collision footgun
— `00 §2`: "a bare `permute`/`snoise` collides with three's built-in chunks").

```glsl
  // ============================================================
  // ADDITIVE TOOLKIT GROWTH — gw_ namespaced, slab untouched.
  // ============================================================

  // --- octave count: compile-time, per-tier; default 3 = byte-identical to the
  //     legacy slab fbm. The material injects "#define GW_FBM_OCTAVES n" ABOVE
  //     GLSL_NOISE so this branch resolves at compile time (see §4.4).
  #ifndef GW_FBM_OCTAVES
    #define GW_FBM_OCTAVES 3
  #endif

  // --- the inter-octave decorrelation rotation (IQ ~36.87°). One mat2, reused. ---
  const mat2 GW_ROT = mat2(0.80, 0.60, -0.60, 0.80);

  // --- 3D simplex (Ashima/Gustavson port; gw_-prefixed vec4 helpers) ----------
  vec4 gw_mod289_4(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 gw_permute4(vec4 x){ return gw_mod289_4(((x*34.0)+1.0)*x); }
  vec4 gw_taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float gw_snoise3(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = gw_permute4(gw_permute4(gw_permute4(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);
    vec4 norm = gw_taylorInvSqrt(vec4(dot(g0,g0), dot(g1,g1), dot(g2,g2), dot(g3,g3)));
    g0 *= norm.x; g1 *= norm.y; g2 *= norm.z; g3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0 * dot(m*m, vec4(dot(g0,x0), dot(g1,x1), dot(g2,x2), dot(g3,x3)));
  }

  // --- rotated-octave fbm, 2D. NEW name so the slab's gw_fbm is untouched. -----
  //     Translation (the legacy offset) is KEPT and the rotation is ADDED, so at
  //     GW_FBM_OCTAVES 3 the output is the legacy field minus the plaid.
  float gw_fbmR(vec2 p){
    float s = 0.0, a = 0.5;
    #pragma unroll_loop_start
    for(int i = 0; i < GW_FBM_OCTAVES; i++){
      s += a * gw_snoise(p);
      p  = GW_ROT * p * 2.03 + vec2(11.3, 7.7);   // rotate + scale + decorrelate
      a *= 0.5;
    }
    #pragma unroll_loop_end
    return s;
  }

  // --- rotated-octave fbm, 3D (boils in place via the z = time axis). ----------
  float gw_fbm3(vec3 p){
    float s = 0.0, a = 0.5;
    #pragma unroll_loop_start
    for(int i = 0; i < GW_FBM_OCTAVES; i++){
      s += a * gw_snoise3(p);
      p.xy = GW_ROT * p.xy * 2.03 + vec2(11.3, 7.7);
      p.z  = p.z * 2.03 + 5.1;
      a *= 0.5;
    }
    #pragma unroll_loop_end
    return s;
  }

  // --- parameterized domain warp. levels=1 (basalt) or 2 (molten). -------------
  //     One level: fbm(p + fbm(p)). Two levels: fbm(p + fbm(p + fbm(p))).
  float gw_warp(vec2 p, float t, int levels){
    vec2 q = vec2(gw_fbmR(p + vec2(0.0, t*0.10)),
                  gw_fbmR(p + vec2(5.2, -t*0.08)));
    if(levels >= 2){
      vec2 r = vec2(gw_fbmR(p + 2.0*q + vec2(1.7, 9.2) + t*0.06),
                    gw_fbmR(p + 2.0*q + vec2(8.3, 2.8) - t*0.05));
      return gw_fbmR(p + 2.0*r);
    }
    return gw_fbmR(p + 2.0*q);
  }
  vec3 gw_warp3(vec3 p, int levels){          // 3D sibling for the molten surface
    vec3 q = vec3(gw_fbm3(p), gw_fbm3(p + 3.1), gw_fbm3(p + 7.4));
    if(levels >= 2){
      vec3 r = vec3(gw_fbm3(p + 2.0*q), gw_fbm3(p + 2.0*q + 5.7), gw_fbm3(p + 2.0*q + 1.3));
      return p + 2.0*r;
    }
    return p + 2.0*q;
  }
```

> **Why a new `gw_fbmR` rather than editing `gw_fbm`?** The slab's `gw_fbm` is *load-bearing for the
> byte-identical-home contract* (`00 §8` step 2). Editing it (adding rotation) changes its output and the home
> route visibly shifts — failing the contract. So `gw_fbm` stays frozen; `gw_fbmR` is the rotated successor all
> *new* consumers (molten, basalt, cooling) use. Once the molten/basalt look is signed off on the device, a
> follow-up PR can migrate the slab to `gw_fbmR` *deliberately* (a reviewed look change), not as a silent
> side-effect of this structural grow. This is the disciplined way to honor "compiles unchanged."

### 4.3 The `levels` argument is a compile-time constant in practice

`gw_warp(p, t, levels)` takes `int levels`, and the `if(levels >= 2)` reads like a runtime branch — but every
call site passes a **literal** (`gw_warp(p, uTime, 2)` for molten, `gw_warp(p, uTime, 1)` for basalt). Modern
shader compilers (and three's preprocessor pipeline) constant-fold a literal argument and **dead-code-eliminate
the dead branch** — the molten material compiles with the two-level body only, the basalt with the one-level
body only. There is no warp on `levels` that varies per-fragment, so there is no divergence. (If a target
compiler is paranoid, the bullet-proof form is a `#define GW_WARP_LEVELS` per material mirroring the octave
define — but the literal-arg form is cleaner and the constant-fold is reliable on the iPhone-15 GPU.)

### 4.4 The octave define: zero-runtime-branch unrolling (the load-bearing proof)

The requirement is that `GW_FBM_OCTAVES` **unrolls per tier with zero runtime branch**. The mechanism is
three.js's own preprocessor directive, **`#pragma unroll_loop_start` / `#pragma unroll_loop_end`** (introduced
in three.js PR #13140, documented in the `ShaderMaterial` / `WebGLProgram` docs). The rules, exactly:

1. The pragma must sit **immediately above** the loop.
2. The loop must be **normalized**: `for ( int i = 0; i < N; i ++ )` — the variable **must be `i`**, start at
   a constant, and compare `<` an integer bound.
3. The bound must be **resolvable to an integer constant at preprocess time** — a `#define` value qualifies.
4. three's preprocessor **textually expands** the body N times with `i` replaced by each literal, then the GPU
   compiler sees straight-line code: **no loop, no counter, no comparison, no branch.**

So the tier mechanism is: the material injects the define **above** `GLSL_NOISE` in `onBeforeCompile`:

```js
// in ObsidianSlab / molten / basalt material onBeforeCompile, BEFORE the GLSL_NOISE include:
const OCT = quality === 'high' ? 3 : quality === 'low' ? 3 : 2   // high/low 3, static 2
shader.fragmentShader = shader.fragmentShader.replace(
  '#include <common>',
  `#include <common>\n#define GW_FBM_OCTAVES ${OCT}\n${HEAD}`   // HEAD includes GLSL_NOISE
)
```

Because `GW_FBM_OCTAVES` is a `#define` literal, the `#pragma unroll_loop_start ... for(i<GW_FBM_OCTAVES)`
expands to exactly that many straight-line octaves. **Drop the tier → drop an octave → the loop is shorter
straight-line code → all procedural detail thins uniformly, with no per-frame cost and no branch.** This is
precisely the `00 §10` lever #3 ("a compile-time define so the loop unrolls with zero runtime branch") and the
§2 cohesion hinge.

> **Gotcha:** the `#define` must be injected **once, above the include** — if two chunks both define
> `GW_FBM_OCTAVES` you get a redefinition warning; the `#ifndef` guard in §4.2 makes the in-file default
> harmless, and the material's injected define wins because it appears first. Also: a tier *re-render* with a
> different octave count requires a **material recompile** (`material.needsUpdate = true` / new material) — you
> cannot change `GW_FBM_OCTAVES` per-frame, which is correct: tier changes are rare (boot probe + the slow
> thermal demote, `00 §10`), never per-frame, so recompiling on a tier transition is acceptable and the
> `compileAsync` INP-insurance pass already covers the cost.

### 4.5 The r3f component shape (how a consumer wires it)

No new component — the toolkit is *shader source*, consumed by existing materials through the proven
`onBeforeCompile` chunk-injection pattern (the `shader-fx` skill). The molten material is the archetype:

```jsx
// inside a useMemo(() => new THREE.MeshPhysicalMaterial({...}), [...]) — the shader-fx pattern
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, U)              // the MASTER pool (00 §4.2) — refs, not clones
  const OCT = quality === 'static' ? 2 : 3
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>',
      `#include <common>\n#define GW_FBM_OCTAVES ${OCT}\n${GLSL_NOISE}\n${MOLTEN_HEAD}`)
    .replace('#include <tonemapping_fragment>',
      `${MOLTEN_COLOR}\n#include <tonemapping_fragment>`)   // emissive BEFORE tone-map (00 §5.1)
}
```

Where `MOLTEN_HEAD` calls the new primitives at 3D + two-level warp:

```glsl
  // molten surface look (two-level warp, boils via z=time):
  vec3 wp = gw_warp3(vec3(vUv * uVeinScale, uTime * 0.18), 2);   // levels=2 → thick churn
  float boil = gw_fbm3(wp * 1.3);                                // the viscous field
  float temp = clamp(uTemp + boil * 0.18, 0.0, 1.0);             // feeds the SHARED ramp...
  vec3 metal = gw_forge(temp);                                   // gw_tempColor*intensity (phase2/01)
  metal = mix(metal, gw_divineFire(boil), uIsAE);                // the A/E keystone (00 §1.4)
```

### 4.6 Key uniforms / params, and the hook into the master temperature system

The toolkit itself owns **no uniforms** — it is pure functions. Animation comes from the **shared Master Forge
Uniform pool** `U` (`00 §4.2`, `src/scene/forgeUniforms.js`), bound by-reference into every consumer:

| Param | Source | Role in the noise |
|---|---|---|
| `uTime` | the one `<ForgeDriver/>` writer (frozen to `2` on `static`) | the **z axis** of `gw_fbm3`/`gw_warp3` — the field boils in place |
| `uTemp` | `scrollDamped + vel*0.25` | biases the field into `gw_forge` so hotter = brighter veins |
| `uVeinScale` | per-route `scenes.js`, damped | the spatial frequency of the warp domain |
| `GW_FBM_OCTAVES` | **compile-time define**, tier-set | octave count → uniform detail tier (not a uniform!) |
| `uIsAE` | per-letter baked flag | routes the field's output to `gw_divineFire`, the keystone exception |

The binding rule the toolkit *enforces by design*: the noise produces a scalar field; **that field is only
ever turned into color through `gw_forge`/`gw_tempColor` and only ever cooled through `gwCool01`** (`phase2/01`,
`00 §7` rule 1). The noise never carries its own orange. A vein leaving the slab, a churn in the molten, and a
crack in the cooling crust are *visibly one substance* because they sample one `gw_fbm3` basis at one
`GW_FBM_OCTAVES` and pass through one ramp.

---

## 5. COHESION

This element *is* the §2 cohesion pillar of the world. The binding ties:

- **One noise basis, one octave count.** Every consumer (molten, basalt, cooling crust, ember veins, smoke,
  caustic, spark advection source) calls `gw_fbmR`/`gw_fbm3`/`gw_warp` at the *same* `GW_FBM_OCTAVES`. The slab
  rhymes with the channels because they read the same well (`00 §7` rule 2).
- **The rotation is shared decorrelation.** `GW_ROT` is one constant; every fbm in the world breaks its plaid
  the same way, so no element reads "noisier" or "grid-ier" than another.
- **Warp levels encode material identity, not a new system.** molten=2 / basalt=1 from one `gw_warp(levels)` —
  the difference between viscous metal and calm stone is *one int literal*, not a forked shader (`00 §9`: per-
  chamber variation is a damped param, never a different system).
- **Feeds the one temperature authority.** The noise's only output path is into `gw_forge`/`gwCool01`/
  `gw_divineFire` (`phase2/01`, `00 §1`). It never invents heat or color (`00 §7` rule 1, the central law).
- **Only `PAL` via `v3()`.** The toolkit emits *scalars*; color is applied downstream from `PAL` constants, so
  the 60/30/10 and the "only the 10% >1.0 blooms" convention hold automatically (`00 §3.1`).
- **One clock.** `uTime` is the shared driver's seconds, frozen to `2` on `static`. The field boils on the same
  heartbeat a strike surges the veins (`00 §7` rule 6).
- **Degrades uniformly.** `GW_FBM_OCTAVES` thins *all* detail at once — the §10 / `00 §7` rule-9 contract that
  a tier drop never selectively breaks one element.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The world is **fill-rate bound**, not triangle bound (`00 §10`): near-full-screen fbm shaders + post are the
cost. Noise is the single largest ALU consumer in those fragment shaders, so the toolkit's perf discipline is
the world's perf discipline.

**The cost model (relative simplex evals per pixel):**

| Field | Octaves (`high`) | Warp levels | snoise evals/px | Notes |
|---|---|---|---|---|
| Slab veins (legacy, 2D) | 3 | 1 (in `gwVeins`) | ~6 | unchanged, the home baseline |
| Basalt veins (2D) | 3 | 1 | ~9 (3 fbm calls × 3 oct) | calm stone, cheap |
| Molten surface (3D) | 3 | **2** | ~3D-fbm × (warp calls) ≈ **~40–55 simplex-3D evals** | the hero cost; 3D is ~2× per eval |

The molten two-level 3D warp is genuinely the most expensive shader in the world per-pixel. The levers, in
priority order (`00 §10`):

1. **DPR cap 1.5** (iPhone reports 3 — rendering the molten warp at 3× is instant death). This is the single
   biggest fill-rate lever and is non-negotiable.
2. **`GW_FBM_OCTAVES` 3→3→2** (high/low/static). On `low` keep 3 (the look matters), on `static` drop to 2 and
   freeze `uTime` — the field stops evolving and only 2 octaves resolve. Each dropped octave is a measurable
   fill-rate win because it's straight-line code removed at compile time.
3. **`gw_warp(levels)` 2→1 on `low`** for the molten if the device is hot — drops the molten from ~55 to ~37
   evals/px, a ~33% shader cost cut (the MiniMax cost ladder, §2.3), at the cost of some churn fidelity. Gate
   this on the `PerformanceMonitor` factor ladder, not statically.
4. **Restrict 3D to where it earns it.** The slab and basalt stay 2D forever — never blanket-upgrade.

**The tier table for this toolkit:**

- **`high`** — `gw_fbm3` 3 octaves, molten warp levels 2, full rotation. ~9–10 ms steady-state budget holds
  with DPR 1.5 (`00 §10`).
- **`low`** — octaves 3, molten warp **1** (demoted under thermal pressure), basalt unchanged. No 3D on
  secondary fields.
- **`static`** — `uTime` frozen to `2`, octaves **2**, warp 1. The field resolves to a *still* — a dignified,
  fully-lit frozen forge (warm veins on true-black void, `00 §10`), not a broken fallback. The 2-octave field
  is visibly simpler but reads as "calm," not "broken," because it degraded uniformly.

**INP / compile insurance:** the 3D simplex + two-level warp is a *large* shader; `renderer.compileAsync` it
before first interaction (`00 §10`) so the multi-hundred-ms compile doesn't block the first scroll. A tier
demote recompiles the material once — covered by the same pass; never recompile per-frame.

**The `static`-tier 2-octave path is the one to verify first**, because it's the floor everyone falls to.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Order of operations (each step verified the repo way before the next):**

1. **Append the block, compile-green, slab byte-identical.** Add `gw_snoise3`/`gw_fbmR`/`gw_fbm3`/`gw_warp` to
   `shaders.js`. **Touch nothing the slab reads.** `npm run build` → `qa-route` at 393×852 + 1440×900, **0
   console errors** (SwiftShader compiles the GLSL in CI, so a typo surfaces as a console error). Confirm `/`
   is *visually identical* (the slab still calls `gw_fbm`/`gw_caustic`, untouched). **No look ships yet.**
2. **Prove the unroll.** Inject `#define GW_FBM_OCTAVES 3` in a throwaway test material, log
   `shader.fragmentShader` in `onBeforeCompile`, and confirm the loop body appears expanded 3× with no
   `for`/counter. Flip to `2`, confirm 2×. This proves the zero-branch claim *before* any consumer depends on it.
3. **Prove the rotation.** A debug material outputting `gw_fbmR(vUv*4.0)` vs `gw_fbm(vUv*4.0)` side-by-side —
   the rotated one must show *no axis-aligned plaid* in flat regions. This is the quality justification; verify
   it visually, on the device (the plaid is most visible on the OLED's true black).
4. **Wire the molten.** Only now does a consumer use `gw_warp3(...,2)` + `gw_fbm3` → `gw_forge`. Slow it down
   *first* (the `phase2/04` "thin glowing water" failure mode — small `uTime*0.18`), warp levels second.
5. **The device read.** Bloom spread, true-black, the divine-fire white-gold, and the *absence of plaid* do
   **not** simulate headless (`00 §8`).

**Pitfalls, ranked by how much they'll cost you:**

- **Editing `gw_fbm` in place (breaks the byte-identical home contract).** The whole point of `gw_fbmR` being a
  new name. If you "improve" `gw_fbm` with the rotation, `/` shifts and you've violated `00 §8` step 2. Add the
  successor; migrate the slab later, deliberately.
- **Naming collisions with three's chunks.** `permute`, `snoise`, `taylorInvSqrt`, `mod289` are names three's
  built-in chunks may define. **Everything stays `gw_`-prefixed** (`gw_permute4`, `gw_taylorInvSqrt`). A bare
  `permute(vec4)` will silently shadow or redefine and produce a cryptic compile error (`00 §2`).
- **Defining `GW_FBM_OCTAVES` *after* the include.** The `#define` must precede `GLSL_NOISE` in the injected
  string, or the `#ifndef` default (3) wins and your tier never drops. Inject it on the `#include <common>`
  replacement line, ahead of the noise.
- **Malformed unroll loop.** The pragma demands the loop variable be **`i`**, the bound a compile-time integer
  constant, and the pragma directly above. `for(int o=0; o<GW_FBM_OCTAVES; o++)` (variable `o`) **silently
  won't unroll** — it stays a runtime loop, costing the branch you were avoiding. Use `i`.
- **Per-frame octave change.** `GW_FBM_OCTAVES` is compile-time; changing it needs a material recompile. Don't
  try to animate detail with it — that's what `uVeinScale`/amplitude uniforms are for. Tier transitions
  recompile once.
- **3D where 2D would do.** Blanket-upgrading masks/basalt to `gw_fbm3` doubles their cost for zero visible
  gain. 3D only where the field must *evolve volumetrically* or feed curl.
- **`levels` as a real varying.** Never pass a *uniform* or per-fragment value as `gw_warp`'s `levels` — that
  creates a real runtime branch and divergence. Always a literal at the call site (§4.3).
- **Tone-map order.** The molten's emissive add must land **before** `#include <tonemapping_fragment>` (`00
  §5.1`) or the >1 HDR never blooms. This is a consumer concern, but it's where the noise's output dies if
  misplaced.

---

## 8. SOURCES (2025–2026)

1. **Dan Greenheck — _10 Noise Functions for Three.js TSL Shaders_**, Three.js Roadmap, **Dec 2025**.
   The 2025 canonical ranking (white→value→Perlin→simplex→Worley) + layering (fBm, ridged, turbulence) with
   GLSL/TSL parity; confirms simplex as the isotropic workhorse and the rotation/ridged recipes.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
2. **MiniMax-AI `skills` — `shader-dev/techniques/domain-warping.md`**, GitHub, **2025** (active agent-skills
   knowledge base). States `mat2(0.80,0.60,-0.60,0.80)` as "the most widely used decorrelation transform,"
   the `fbm(p+fbm(p+fbm(p)))` recipe, non-integer lacunarity 2.01–2.04, and the precise cost ladder (3 warp ×
   6 oct = 18 samples; −33% per warp-level / octave-tier drop).
   https://github.com/MiniMax-AI/skills/blob/main/skills/shader-dev/techniques/domain-warping.md
3. **Codrops — _Rendering a Procedural Vortex Inside a Glass Sphere with Three.js and TSL_**, **Mar 10, 2025**.
   Modern reference for fBm + domain warp + 3D noise driving the emissive interior of a physical glass material
   via TSL `Loop()` — structurally the slab veins / molten-in-channel composition, one renderer earlier.
   https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/
4. **Maxime Heckel — _Field Guide to TSL and WebGPU_**, **Oct 14, 2025**. Transpiled Perlin noise driving a
   `positionNode`, compute-shader GPGPU replacing FBO ping-pong, one-source GLSL/WGSL lowering — the deferred
   TSL-port seam this doc authors toward.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. **LearnWithHasan — _Three.js Shaders Guide — GLSL, ShaderMaterial & TSL (r184)_**, **2026** (r184 line).
   Confirms r184 ships TSL as the stable first-class node API lowering to GLSL/WGSL, and the GLSL
   `ShaderMaterial`/`onBeforeCompile` path remains the production WebGL route — justifies staying GLSL for the
   judge device.
   https://learnwithhasan.com/threejs-guide/shaders/
6. **Three.js Roadmap — _TSL: A Better Way to Write Shaders in Three.js_**, **2025–2026**. TSL as the
   renderer-agnostic node graph (GLSL on WebGL, WGSL on WebGPU); the portability argument for authoring the
   toolkit TSL-portable.
   https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
7. **mrdoob/three.js — `#pragma unroll_loop_start` (PR #13140) + `ShaderMaterial` docs**, three.js r17x,
   referenced **2025–2026**. The exact loop-unroll directive, normalized-loop rules (variable `i`,
   compile-time integer bound, pragma directly above) that make `GW_FBM_OCTAVES` unroll with zero runtime
   branch.
   https://github.com/mrdoob/three.js/pull/13140/files · https://threejs.org/docs/pages/ShaderMaterial.html
8. **Inigo Quilez — _fBm_ and _Domain Warping_** (re-derived across all 2025 sources above; the canonical
   `Σ aᵢ·noise(p·2ⁱ·Rⁱ)` rotation form and `fbm(p+fbm(p+fbm(p)))`). Cited as the technique origin per the
   prompt's "canonical-technique → 2025-26 coverage" rule (covered by #1, #2, #3).
   https://iquilezles.org/articles/fbm/ · https://iquilezles.org/articles/warp/
9. **Ashima / Gustavson `webgl-noise` — `noise3D.glsl`** (the `snoise(vec3)` port; arXiv 1204.1461
   _Efficient computational noise in GLSL_), referenced **2025–2026** as the dependency-free, textureless 3D
   simplex source `gw_snoise3` ports. https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl

---

## 9. DEEP-DIVE CANDIDATES

1. **`gw_curl3` — analytic-derivative divergence-free curl from `gw_snoise3`** (cluster F-noise-shared
   sibling). The 3-evaluation analytic curl (atyuwen cross-product-of-gradients trick) that this doc's
   `gw_snoise3` makes possible — the velocity field for spark orbits and smoke, advected over 4–8 substeps,
   never raw displacement. Owns the gradient-extraction edge cases.
2. **`gw_worley` F1/F2 — cellular crackle for cooling crust + bubble nucleation** (high-tier-only). The 3×3
   cell search, F2−F1 crack networks, and how it composes *on top of* `gw_fbm3` (not instead of) to break the
   cooled-iron skin — the most expensive primitive, gated hardest.
3. **The deliberate slab migration `gw_fbm → gw_fbmR`** — the reviewed, intentional look change that retires
   the legacy plaid from the home route once molten/basalt are signed off; the A/B and the regression bar for
   "is the home route allowed to change."
4. **TSL port of the whole `gw_` toolkit** (post-judge, WebGPU). The `Fn()` re-host: `gw_fbmR` → TSL `Loop()`,
   `GW_ROT` → `mat2()` node, `gw_warp(levels)` → a JS-parameterized graph, validated against the GLSL output
   byte-for-byte in look — proving "re-host, not rewrite."
