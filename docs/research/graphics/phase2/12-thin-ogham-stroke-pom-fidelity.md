# 12 — Thin-Feature POM Correctness for Fine Ogham Strokes

_Phase 2 deep-dive · GAELWORX forge world · cluster **D-type-knot-reveal** · target iPhone 15 OLED · one
WebGLRenderer · `MeshPhysicalMaterial` + `onBeforeCompile` · warm-forge palette · reads the master
temperature / noise / lighting / uniform system (`00-COHESION-MAP.md`)._

> This doc is the focused successor to Phase-1 docs **25** (Ogham as carved stone) and **26** (carved-stone
> engraving / POM). Doc 26 §9.1 named exactly this deep dive: _"Ogham is fine parallel strokes — exactly
> the thin-feature case POM degrades on (samples skip between thin walls, strokes shimmer/disappear at
> grazing). Adopt Hoetzlein's thin-feature sampling / smoothed-displaced-normal ideas (or a
> min-height-along-step clamp) so the sacred inscription stays crisp and readable at the altar angle on
> mobile."_ This is that pass — buildable, sample-budgeted, and wired to the one-world uniform pool.

---

## 1. SCOPE — the failure this element must not have

The Ogham is the **sacred small print** of GAELWORX: the notched Irish alphabet cut into the green-black
Connemara basalt, **invisible in the pure void**, surfacing out of the black **only** where the eternal
white-gold **A/E divine fire** rakes the stone (`00-COHESION-MAP.md` §5.2; doc 25 §1). The entire beat —
the keystone of the altar-approach (`/about`), the stone-ledger (`/pricing`), and the channel-hall
(`/automations`) walls — is **"the inscription rises from black in the fire."** That payoff is killed by
exactly one class of artifact, and this document exists to defeat it.

Ogham geometry is the pathological case for height-field ray-marching. Each glyph is **1–5 parallel score
strokes**, each stroke an incision a **few texels wide**, separated by **flat stone a few texels wide**
(doc 25 §1, the four _aicme_ families). When parallax-occlusion mapping (POM) marches a view ray through a
height field built from these strokes, the discrete steps **straddle the thin walls**: a step can land in
the groove, the next step jumps clean over the next thin stroke into the flat stone beyond, and the
intersection is **missed or placed on the wrong wall**. The visible result is the textbook thin-feature
POM failure: strokes **shimmer, flicker, thin out, or vanish** — and they do it _worst at the grazing
altar angle_, which is **precisely the angle the divine fire rakes the wall at and the angle the carve has
to sell** (doc 26 §2C, §6). A shimmering inscription does not read as "ancient sacred stone revealed by
holy fire"; it reads as a broken shader. The crispness of the Ogham at the grazing angle is therefore not
a nicety — it is the make-or-break of the cluster's narrative.

The constraints are fixed by the world: **one** `WebGLRenderer`, the carve injected into the **shared**
`BasaltStone` `MeshPhysicalMaterial` via `onBeforeCompile` (no second mesh, no decal, no EXR), the height
source is the **same** procedural Ogham SDF doc 25 generates (`oghamBand` → `gw_`-namespaced), and every
new term reads the **shared** `U` uniform pool (`uTemp`, `uAEFire`, `uAEFirePow`, `uTime`) so nothing
forks its own heat, light, or clock. The POM is a **`high`-tier finish only**, gated to the close-oblique
chambers; `low`/`static` fall back to derivative-bump (doc 26 §6). This deep dive's job is to make the POM
**thin-feature-correct inside that envelope** — to import the 2025–2026 thin-feature ideas (Hoetzlein
smoothed-displaced-normals + thin-feature sampling; the corrected-cone-map artifact-free minimum step) as a
clamped GLSL loop that never shimmers and never blows the iPhone-15 frame.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026 (defeating thin-feature POM artifacts)

The base technique — clamped 8→24 adaptive POM + 6-tap self-shadow, derivative-bump fallback — is locked
by doc 26 §3. This section is **only** about the additional machinery that keeps the **thin parallel
strokes** correct. Ordered cheapest → richest, judged against the iPhone-15 fragment budget.

### A. Min-height-along-step clamp (conservative interval test) ⭐ cheapest correctness win

The single root cause of the thin-feature miss is that POM tests **only the height at the two step
endpoints** and linearly interpolates between them. A thin wall whose crest lives _between_ two samples is
invisible to that test — the ray walks over it. The fix, borrowed in spirit from **cone-step mapping's
artifact-free minimum-step rule** (Robust Cone Step Mapping, EG 2024–2025 line; see §8) and from
Hoetzlein's **thin-feature sampling** (CGF Oct 2025): instead of sampling the height field at one point per
step, **sample the conservative extreme of the height field across the step's UV footprint** and test the
ray against _that_. Concretely, sample 2–3 extra height taps along the per-step UV segment (or a tiny
pre-filtered "max-of-neighborhood" height) and take the **maximum** stone height seen on that segment; if
the ray's height drops below that conservative max anywhere in the step, **refine inside the step** rather
than skipping it. A thin crest between endpoints now raises the segment max and **forces a hit**. Cost: 2–3
extra `gwHeight` taps on the steps near a crossing only (gated by a cheap "did the endpoint heights
bracket a feature" pre-test), not on every step. **Quality:** kills the skip-over for strokes ≥ ~1.5 texels.
**Mobile:** affordable — the extra taps fire on a minority of steps. **Complexity:** low. **Fit: the
mandatory thin-feature core of the GAELWORX loop.** This is the doc-26 §9.1 "min-height-along-step clamp"
made concrete and it is the highest leverage change.

### B. Smoothed displaced normal (analytic, not finite-difference) ⭐ kills the shimmer at grazing

Even with correct intersection, the _normal_ used to shade the groove wall is usually `dFdx/dFdy` of the
height at the (parallaxed) hit UV. On thin strokes at grazing angles those screen-space derivatives span
**more than one stroke per pixel**, so the normal flickers between "wall" and "flat" frame to frame — the
shimmer. Hoetzlein's **smoothed displaced normals** (CGF Oct 2025) compute the normal **analytically from
the height function's gradient at the hit point, band-limited to the pixel footprint**, rather than from
noisy screen derivatives. For our analytic SDF Ogham this is a gift: the groove normal is the **analytic
gradient of the SDF** (`∇sdSeg`, exact and cheap), scaled by the carve depth and **softened by the SDF
edge width (`fwidth`) so it never sharpens past one pixel**. The normal becomes a smooth, footprint-aware
ramp across the groove wall — no per-frame derivative noise, no flicker. **Quality:** removes the residual
shimmer the §A clamp leaves on the wall shading. **Mobile:** ~free (the SDF gradient is two `sdSeg`
evaluations we can fold into one). **Complexity:** low. **Fit: mandatory, pairs with §A.** Together §A
(correct hit) + §B (correct, band-limited normal) are the two halves of "Ogham stays crisp at the altar
angle."

### C. Mip / pre-filtered conservative height ("max-mip" for the clamp)

The §A conservative max can be made constant-cost by precomputing a **max-mip** of the height field (each
mip texel = the _maximum_ of its children, not the average) and sampling the appropriate mip level per step
based on the step's UV footprint — the cone-step / quadtree-displacement lineage, and the 2025 surveys'
"4.04 ms → 0.65 ms with calculated mips" speedup (see §8). The clamp then reads one max-mip tap instead of
2–3 raw taps. **Tradeoff for GAELWORX:** our Ogham height is **analytic SDF, not a texture** — there is no
mip pyramid to read, and baking one re-introduces an asset we deliberately don't ship (doc 25 §2 path A).
**Fit:** **reserve** for the option-B baked single-SDF Ogham-atlas fallback (long verses), where a max-mip
of the atlas is the right constant-cost clamp. For the procedural hero bands, §A's analytic conservative
max is cheaper than maintaining a texture.

### D. Footprint-widened SDF (anti-aliase the stroke into the height, not the shade)

Instead of correcting the march, **widen the thin stroke in the height field itself by the pixel
footprint** so it can never be thinner than a pixel can resolve: `grooveWidth = max(authoredWidth,
k·fwidth(sdf))`. A stroke that would be sub-pixel-thin (and therefore shimmer) is **fattened to exactly
one pixel and fades its depth** as it approaches sub-pixel — the SDF-text analog of MSDF/`fwidth` AA (doc
12; Red Blob Games, Jan 2026). **Quality:** prevents the stroke from ever being a sub-texel sliver the
march can skip; gracefully dissolves distant strokes to flat instead of sparkling. **Mobile:** free (one
`fwidth`). **Complexity:** trivial. **Fit: mandatory companion to §A** — §A handles strokes that are thin
but present; §D handles strokes going sub-pixel with distance/tilt so they never become a shimmer source in
the first place. (Reuses the exact `fwidth`-edge idiom doc 25 §4 already ships.)

### E. Grazing-biased adaptive sampling with a hard mobile clamp

The doc-26 baseline already scales samples by view angle (`mix(uCarveMax, uCarveMin, abs(vTS.z))`, 8→24
mobile, _not_ the TSL node's 24→96 desktop). Thin features _need_ the grazing samples most, but the
iPhone-15 frame can't pay 96. The 2025–2026 refinement: **spend the grazing budget on the §A refinement
inside straddling steps, not on globally raising the step count.** I.e. keep the coarse march at 24 steps
but make each step that brackets a feature do a 3–4 iteration **binary/secant refine** to pin the thin
crossing — far cheaper than 96 uniform steps and exactly where the strokes are. **Quality:** thin-feature
correctness at ~`24 steps + a few refines` instead of `96 steps`. **Mobile:** the only affordable way to
get grazing correctness on the A17. **Complexity:** low-medium. **Fit: mandatory** — the loop structure of
the recommended approach.

### F. Blue-noise jitter of the march start (banding, not skipping)

Carried over from doc 26 §6 and the Three.js Blocks node: a tiny blue-noise (or `gl_FragCoord` hash) offset
of the first step kills **layer-banding** (the stair-step in the groove). **Important distinction:** jitter
fixes _banding_, **not** the thin-feature _skip_ — it must sit on top of §A/§E, never replace them. Jitter
alone makes the shimmer _noisier_, not gone. **Fit: keep, but subordinate** to the conservative clamp.

### G. Prism / projective-displacement true silhouettes (Hoetzlein full method) — reject for runtime

Hoetzlein's full **Projective Displacement Mapping** (CGF Oct 2025) and the **Prism POM** lineage
(Dachsbacher/Tatarchuk) get **correct silhouettes** by intersecting the view ray with offset prisms / bilinear
patches and a hardware BVH. This is the state of the art and the source of our §A/§B ideas, but it assumes
**hardware ray tracing / a BVH** and per-triangle prism extrusion — out of reach for a mobile WebGL
fragment shader (doc 26 §2F). **Fit: reject for the runtime path; cite as the origin of thin-feature
sampling + smoothed normals we port _in spirit_.** GAELWORX needs the _ideas_ (conservative thin-feature
test, band-limited analytic normal), not the BVH machinery.

### H. TSL / WebGPU `parallaxOcclusion` node — Phase-3, author-portable

Three.js shipped a first-class `parallaxOcclusion` node (adaptive 24→96 samples, blue-noise jitter, depth
output) in the TSL/WebGPU lane (Three.js Blocks, 2025; Heckel field guide, Oct 2025; Safari 26 iOS WebGPU,
Sep 2025). The clean future is to express the whole carve as nodes. **But** the §A thin-feature clamp and
§B analytic SDF normal are **not** in the stock node — we'd patch them in either lane. **Fit: out of scope
for the judge (WebGL ships); author the GLSL so the math ports 1:1 to a TSL `Fn` later** (Phase-3 deep
dive, shared with docs 25/26).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: the doc-26 clamped 24-step adaptive POM, upgraded with three thin-feature correctness layers —
(A) a conservative min-height-along-step clamp that refines straddling steps with a 3–4 iteration secant
(E), (B) a smoothed analytic-SDF displaced normal band-limited by `fwidth`, and (D) a footprint-widened
SDF so strokes never go sub-pixel — all injected into the shared `BasaltStone` material, gated
`#ifdef OGHAM_POM` to `high`-tier close-oblique chambers, blue-noise-jittered (F) only for banding.**

Why this exact stack, tied to the world and the budget:

- **It attacks the real root cause, cheaply.** The shimmer is a _skip_ (the march steps over a thin crest)
  plus a _normal-flicker_ (screen derivatives span multiple strokes). §A+§E fix the skip with a
  conservative test and a localized refine (a handful of taps where features are, not 96 steps
  everywhere); §B fixes the flicker with the **analytic SDF gradient** we get for free because Ogham is
  generated, not textured (doc 25 §3 — "the one script you should generate"). The two halves of the
  artifact, fixed by the two halves of the upgrade.
- **The analytic SDF makes Hoetzlein's expensive ideas cheap here.** His smoothed-displaced-normal and
  thin-feature sampling assume a sampled height map and a BVH; our height is `oghamBand(uv)`, a closed-form
  SDF with an **exact, cheap gradient**. The "smoothed displaced normal" is just `∇sdSeg` softened by
  `fwidth` — a luxury technique reduced to two segment evaluations. We get the frontier's correctness
  without its cost _because_ doc 25 chose procedural generation over a font atlas.
- **It stays one material, one height source, one light.** No new mesh/decal/EXR. The POM marches the
  **same** `oghamBand` SDF doc 25's reveal reads, lit by the **same** `uAEFire`/`uAEFirePow` the basalt
  green-reveal and the letterform bloom read (`00-COHESION-MAP.md` §5.2). Depth, reveal, and light cannot
  drift because they are one evaluation.
- **It is correctly tiered and gated.** POM (and therefore the thin-feature machinery) is `high`-only,
  close-oblique-only; `low` gets derivative-bump + footprint-widened SDF (still crisp, just no parallax);
  `static` freezes with a reveal floor. The thin-feature cost is paid **only** on the altar/ledger walls
  where the grazing inscription actually has to sell, never blanket.
- **Footprint-widening (D) is the unsung hero.** Most "vanishing stroke" reports are strokes going
  **sub-pixel** with distance/tilt; §D fattens them to a pixel and fades depth so they dissolve to flat
  cleanly instead of sparkling — handled before the march ever runs, for one `fwidth`.

**Fallbacks:** `low`/`static` → derivative-bump carve + §D widening (no march, no thin-feature problem
because no march). Long authored verses → option-B baked single-SDF atlas + §C max-mip clamp.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` **r17x** (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`, tangent-space basis. No new
  renderer, no node graph.
- `@react-three/fiber`, `@react-three/drei` (in repo) — `<Detailed>` for close-vs-far LOD on hero bands.
- `@react-three/postprocessing` (in repo) — the AE-lit groove **lip** is the only HDR add; bloom catches it.
- Shared in-repo: `${GLSL_NOISE}` / `gw_*` (`src/scene/shaders.js`), `oghamBand`/`sdSeg`/`ogChar`
  (doc 25, in `shaders.js`), `PAL`/`v3` (`src/scene/palette.js`), the master pool `U`
  (`src/scene/forgeUniforms.js`), `forge`/`damp` (`src/store.js`).
- **No new assets** for the recommended path (SDF generated). Optional 64² blue-noise tile for §F (or a
  `gl_FragCoord` hash — zero bytes). No EXR, ever.

### 4.2 The shared uniforms (reads `U`, adds only thin-feature controls)

```js
// appended to the BasaltStone uniform set; the SHARED ones are references INTO the pool U.
const uniforms = useMemo(() => ({
  // --- shared master pool (assigned by reference, NOT cloned) ---
  ...pick(U, ['uTime', 'uTemp', 'uAEFire', 'uAEFirePow']),
  // --- carve / POM (doc 26) ---
  uCarveDepth: { value: 0.055 },   // groove depth = POM scale (leva-tunable)
  uCarveMin:   { value: 8 },       // coarse samples, perpendicular
  uCarveMax:   { value: 24 },      // coarse samples, grazing (mobile clamp, NOT 96)
  uShadowStr:  { value: 0.7 },
  // --- thin-feature additions (this doc) ---
  uThinRefine: { value: 4 },       // secant iterations inside a straddling step (§E)
  uThinClamp:  { value: 1.0 },     // strength of the conservative min-height test (§A)
  uFootK:      { value: 1.6 },     // footprint widening factor in texels (§D)
  uNormalSoft: { value: 1.0 },     // band-limit factor for the analytic normal (§B)
  uReveal:     { value: 0.0 },     // legibility floor (static tier)
  uJitter:     { value: null },    // optional blue-noise (§F)
}), [])
```

| Uniform | Range | Drives | Source |
|---|---|---|---|
| `uCarveDepth` | 0→0.12 | POM scale / groove depth | constant, leva |
| `uCarveMin/Max` | 8 / 24 | coarse adaptive step count | **mobile clamp** |
| `uThinRefine` | 0→6 | secant refines per straddling step (§A/§E) | constant |
| `uThinClamp` | 0→1 | conservative min-height test strength (§A) | constant |
| `uFootK` | 1→2.5 | sub-pixel stroke widening (§D) | constant |
| `uNormalSoft` | 0→2 | analytic-normal band-limit (§B) | constant |
| `uAEFire` / `uAEFirePow` | world vec3 / 0→1 | **shared** divine-fire pos + intensity → reveal + lip | `U` pool |
| `uTemp` | 0→1 | **shared** master temperature → ember pooling in cut | `U` pool |
| `uTime` | s | groove churn; frozen `=2` on static | `U` pool |
| `OGHAM_POM` (define) | on/off | `high`-tier parallax + thin-feature march | tier gate |

### 4.3 The height field + footprint widening (§D) — HEAD, after `#include <common>`

```glsl
${GLSL_NOISE}            // gw_fbm / gw_snoise (reuse)
// sdSeg / ogChar / oghamBand come from the shared shaders.js block (doc 25). Do NOT re-impl.

uniform float uCarveDepth, uThinClamp, uFootK, uNormalSoft, uThinRefine, uShadowStr;
uniform float uCarveMin, uCarveMax;

// HEIGHT: 1.0 = stone surface, 0.0 = groove floor. Footprint-widen the stroke (§D) so a
// sub-pixel thin score never becomes a shimmer source — it fattens to ~1px and fades depth.
float gwOgHeight(vec2 uv){
  float d   = oghamBand(uv);                 // SDF: small in the cut, large on flat stone
  float aa  = fwidth(d) * uFootK + 1e-4;     // pixel footprint of the SDF (§D)
  // groove = 1 inside the incision, 0 on flat stone, edge ramp = footprint-wide (AA, never sub-px)
  float groove = 1.0 - smoothstep(0.0, aa, d);
  return 1.0 - groove;                       // height: 1 flat, ->0 deep in the cut
}

// CONSERVATIVE max stone-height across a step's UV segment (§A). Samples the SDF at the two
// endpoints AND the midpoint; the midpoint catches a thin crest the endpoints straddle.
float gwOgHeightMax(vec2 a, vec2 b){
  float ha = gwOgHeight(a);
  float hb = gwOgHeight(b);
  float hm = gwOgHeight((a + b) * 0.5);      // the tap that defeats the thin-wall skip
  return max(max(ha, hb), hm);
}
```

### 4.4 Thin-feature-correct POM march (§A + §E) — replaces doc 26's `gwPOM`

```glsl
// vTS = view dir in TANGENT space (from the vertex hook). Returns the parallaxed UV.
// Coarse adaptive march + conservative thin-feature test + secant refine of the crossing.
vec2 gwPOM_thin(vec2 uv, vec3 vTS){
  float nSteps = mix(uCarveMax, uCarveMin, abs(vTS.z));      // more steps at grazing
  float dl     = 1.0 / nSteps;
  vec2  duv    = (vTS.xy / max(abs(vTS.z), 0.2)) * uCarveDepth * dl; // per-step UV march

  float rayH   = 1.0;                          // ray starts at the stone surface (height 1)
  vec2  uvPrev = uv;   float rayPrev = 1.0;
  float h      = gwOgHeight(uv);

  #ifdef HAS_JITTER
    // §F: jitter the START only (banding, NOT the skip)
    float j = texture2D(uJitter, gl_FragCoord.xy / 64.0).r * dl;
    uv -= duv * j; rayH -= dl * j;
  #endif

  for (int i = 0; i < 24; i++){                // compile-time mobile clamp
    if (float(i) >= nSteps) break;
    uvPrev = uv;  rayPrev = rayH;
    uv  -= duv;   rayH -= dl;
    float hPrev = h;
    h = gwOgHeight(uv);

    // --- §A conservative test: is there a thin crest hidden INSIDE this step? ---
    // If the endpoint heights both sit below the ray but the segment MAX pokes above it,
    // a thin stroke was straddled — force entry into the refine even without an endpoint hit.
    float segMax = gwOgHeightMax(uvPrev, uv);
    bool  thinHit = (rayH < mix(h, segMax, uThinClamp));      // ray dipped below conservative max
    bool  endHit  = (rayH < h);                               // ordinary POM endpoint hit

    if (endHit || thinHit){
      // --- §E secant refine of the crossing inside [uvPrev, uv] ---
      vec2 lo = uvPrev, hi = uv; float rLo = rayPrev, rHi = rayH;
      for (int k = 0; k < 6; k++){             // compile-time max; uThinRefine actual
        if (float(k) >= uThinRefine) break;
        vec2  mid  = mix(lo, hi, 0.5);
        float rMid = (rLo + rHi) * 0.5;
        float hMid = gwOgHeight(mid);
        if (rMid < hMid){ hi = mid; rHi = rMid; }   // crossing is in [lo, mid]
        else            { lo = mid; rLo = rMid; }
      }
      return mix(lo, hi, 0.5);
    }
  }
  return uv;
}
```

### 4.5 Smoothed analytic displaced normal (§B) — NORMAL, after `#include <normal_fragment_maps>`

```glsl
#ifdef OGHAM_POM
  vec2 uvP = gwPOM_thin(vUv, normalize(vViewDirTS));   // parallaxed UV (high tier)
#else
  vec2 uvP = vUv;                                       // flat: still carved by the normal below
#endif

// Analytic SDF gradient = the "smoothed displaced normal" (Hoetzlein, in spirit). Band-limited
// by fwidth so it NEVER sharpens past one pixel -> no per-frame derivative flicker on thin strokes.
float e   = fwidth(oghamBand(uvP)) * uNormalSoft + 1e-4;
float dX  = oghamBand(uvP + vec2(e, 0.0)) - oghamBand(uvP - vec2(e, 0.0));
float dY  = oghamBand(uvP + vec2(0.0, e)) - oghamBand(uvP - vec2(0.0, e));
float gMag = gwOgHeight(uvP);                            // 0 deep, 1 flat -> ramp strength
// tilt the wall toward/away from light; strength fades to 0 on flat stone and as strokes go sub-px
vec3  gN  = vec3(dX, dY, 0.0) / (2.0 * e);
normal = normalize(normal - gN * uCarveDepth * (1.0 - gMag) * 6.0);
```

### 4.6 Self-shadow + AE reveal + ember (COLOR, before `#include <tonemapping_fragment>`)

```glsl
float gwH = gwOgHeight(uvP);
float wallBand = smoothstep(0.0, 0.5, 1.0 - gwH);        // how deep in the cut
gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.32, wallBand); // recessed = darker

#ifdef OGHAM_POM
  gl_FragColor.rgb *= gwGrooveShadow(uvP, normalize(vLightTS)); // doc 26 6-tap, shares uShadowStr
#endif

// THE REVEAL — identical AE term as the basalt green-reveal (doc 05) & letterform bloom (doc 12).
float aeFall  = 1.0 / (1.0 + dot(vWPos - uAEFire, vWPos - uAEFire) * 0.25);
float reveal  = clamp(uAEFirePow * aeFall + uReveal, 0.0, 1.0);
// white-gold rim on the groove LIP -> the script lights up. >1 so ONLY this blooms (post-fx rule).
float lip = smoothstep(0.35, 0.55, gwH) * (1.0 - smoothstep(0.55, 0.85, gwH));
gl_FragColor.rgb += ${v3(PAL.gold)} * lip * reveal * 1.2;
// faint ember pooling deep in the cut when the world runs hot — shares uTemp.
gl_FragColor.rgb += ${v3(PAL.ember)} * wallBand * pow(uTemp, 2.0) * 0.18;
```

### 4.7 The r3f component shape (extends `BasaltStone`)

```jsx
export default function OghamCarve({ quality, route }) {
  const pom = quality === 'high' && CLOSE_OBLIQUE.has(route)   // gate: tier AND chamber
  const uniforms = useMemo(() => makeOghamUniforms(), [])
  const material = useMemo(() => {
    const m = makeBasaltMaterial()                  // doc 05 base
    m.defines = { USE_UV: '' }
    if (pom)                  m.defines.OGHAM_POM = ''
    if (uniforms.uJitter.value) m.defines.HAS_JITTER = ''
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)          // SHARED U references flow in here
      sh.vertexShader = injectTBN(sh.vertexShader)   // vViewDirTS / vLightTS / vWPos (doc 26)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [pom])
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    // POM thin-feature uniforms are constants; only the SHARED pool is driven (by ForgeDriver).
    // Per-route enable damps like every other scenes.js preset:
    uniforms.uReveal.value = damp(uniforms.uReveal.value, sceneFor(route).oghamFloor ?? 0, 2.4, dt)
  })
  return <mesh geometry={wallGeo} material={material} />
}
```

### 4.8 How it hooks the master temperature / uniform system

Every animated value comes from the shared pool `U`, authored solely by `<ForgeDriver/>`
(`00-COHESION-MAP.md` §4.2), **not** from this component:

- **`uAEFire` / `uAEFirePow`** — the nearest A/E divine-fire position + intensity. The reveal (`reveal`)
  and the gold lip are pure functions of these, with the **identical `1/(1+d²·0.25)` falloff** the basalt
  green-reveal uses (doc 05) and the same letterform-bloom signal (doc 12). The Ogham surfacing, the green
  rising, and the A/E burning are **one causal event**, not three timed effects.
- **`uTemp`** — the master scroll-driven forge heat. The ember pooling in the cut intensifies in lockstep
  with the slab veins glowing; a strike pulse (`00-COHESION-MAP.md` §7.6) surges the lip and the pool in
  the same frame as everything else.
- **`uTime`** — the one clock; frozen to `2` on `static`. No second rAF, no `setInterval`.
- The thin-feature controls (`uThinRefine`, `uThinClamp`, `uFootK`, `uNormalSoft`) are **constants**, not
  per-frame state — they tune the _correctness_ of the carve, not its animation, so they never touch the
  driver and never allocate per frame.

---

## 5. COHESION (shared with the rest of the world)

- **One height source, three consumers.** The POM marches `oghamBand`, the **same** SDF doc 25's flat
  reveal reads and doc 26's carve consumes. Depth (this doc), legibility (doc 25), and self-shadow (doc 26)
  are one distance evaluation — they cannot drift. "More detail" is one more `ogChar`, never a second field
  (`00-COHESION-MAP.md` §7.2/§7.8 — one knot, consumed many ways).
- **One reveal value, three surfaces.** `uAEFirePow · aeFall` is byte-identical to the basalt green-reveal
  (doc 05) and the letterform divine-fire (doc 12). The thin-feature work makes the **carving** crisp; the
  reveal logic is untouched and shared. The fire reveals all three the same way (`00-COHESION-MAP.md` §5.2).
- **One palette, one bloom contract.** Walls/floor = basalt `× 0.32` (**< 1.0, never bloom**); only the
  AE-lit `PAL.gold` lip is pushed `> 1` so the existing `Bloom luminanceThreshold ≈ 0.55` catches the
  _inscription_, never the groove (`00-COHESION-MAP.md` §3.1/§6 — the palette _is_ the bloom selector). No
  raw hex; `PAL.gold`/`PAL.ember` only.
- **One material idiom.** `onBeforeCompile` at `<common>` / `<normal_fragment_maps>` /
  `<tonemapping_fragment>`, `m.defines = { USE_UV: '' }`, `gw_`-namespaced shared GLSL, `dispose()` on
  unmount — byte-for-byte the slab's recipe (`shader-fx`).
- **One noise DNA (optional weathering).** Any groove-edge erosion reuses `gw_fbm` from `shaders.js`, so the
  carving's grain shares spatial frequency with the slab veins and the basalt body (`00-COHESION-MAP.md`
  §2).
- **The brand keystone.** The reveal keys to the **first A + first E** divine fire — the canvas expression
  of the `CLAUDE.md` A+E ignite law. The same letters that ignite in prose (`<BrandText>`) light the ancient
  Ogham. The thin-feature correctness is what lets that sacred small print actually be _read_ in the fire.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The whole-world budget (`00-COHESION-MAP.md` §10): ~9–10 ms steady-state on `high` at DPR 1.5; pixels (not
triangles) are the enemy; POM is _the_ throttle risk because its cost scales **up** at grazing, exactly when
the inscription is on screen. The thin-feature additions are deliberately near-free:

| Cost lever | Budget impact | How it's held |
|---|---|---|
| Coarse march | 24 steps max (compile-time), `8→24` adaptive | the doc-26 mobile clamp, **not** 24→96 |
| §A conservative tap | +1 `oghamBand` at step midpoint | only on the analytic SDF (cheap), reused as segMax |
| §E secant refine | ≤4 iterations × 1 tap, **only on a straddling step** | most pixels never enter the refine |
| §B analytic normal | 2 `oghamBand` taps (replaces `dFdx/dFdy`) | no extra vs the bump it replaces |
| §D footprint widen | 1 `fwidth` | free |
| §F jitter | 1 texture tap or `gl_FragCoord` hash | banding only, optional |

Tier contract (mirrors `useQuality → high | low | static`, `forge-scene`):

- **`high`:** `#define OGHAM_POM`, `8→24` adaptive march + §A clamp + §E refine + §B analytic normal + §D
  widen + 6-tap self-shadow + §F jitter. **Gated to close-oblique chambers** (altar `/about`, ledger
  `/pricing`; channel-hall walls only, not the top-down floor — POM barely reads top-down, doc 26 §6).
  `dpr [1, 1.5]`.
- **`low`:** **no POM** → derivative-bump carve + §D footprint widening only. No march ⇒ **no thin-feature
  problem to solve** (the artifact only exists when you ray-march). The incision still reads as cut at every
  angle but extreme grazing. Drop the ember-pool term if needed. `dpr [1, 1.4]`.
- **`static` / `prefers-reduced-motion`:** freeze `uTime = 2`, derivative bump only, hold `uReveal ≈ 0.25`
  so the script reads without live AE math; `frameloop = 'demand'`. The dignified baked-feel poster.

Hard rules:

1. **Restrict POM draw area to the carry-marks surfaces.** Only the wall meshes that actually hold Ogham
   get the `OGHAM_POM` material; never blanket the chamber.
2. **One height eval per stage, reused.** Compute `uvP` once in NORMAL; reuse `gwH`/`uvP` in COLOR and the
   shadow march. Re-evaluating `oghamBand` in COLOR doubles the segment cost (doc 25 §6.2).
3. **Cap glyphs per band (~8, ≤40 segments).** Each `ogChar` is up to 5 `sdSeg`; the band is a `min` chain.
   Long verses ⇒ switch to the option-B baked single-SDF atlas + §C max-mip clamp, not a giant `min`.
4. **Compile-time loop bounds.** Both the 24-step march and the 6-iteration refine are compile-time
   constants with `break` guards (`if (float(i) >= n) break;`) so the loop unrolls and compiles on mobile
   drivers; a dynamic-length march tanks the A17 and may fail to compile.
5. **`renderer.compileAsync` before first interaction** so the carve's longer shader doesn't block the
   first scroll (`00-COHESION-MAP.md` §10 INP insurance); `dispose()` on unmount; `renderer.info.memory`
   flat across navigation.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

Each step `qa-route`-verifiable: `npm run build` green + 0 console errors @ 393×852 and 1440×900 (≈ GLSL
compiled under SwiftShader). Then the **iPhone 15 OLED read is mandatory** — the shimmer, the grazing
crispness, the true-black groove, and the bloom on the gold lip **do not simulate headless** (`shader-fx`,
`post-fx`).

1. **Reproduce the shimmer FIRST, on the real altar camera.** Before any fix, ship the plain doc-26 POM and
   _watch the strokes flicker_ at the grazing angle in a back-and-forth pan. If you can't see the artifact,
   you can't prove you fixed it. Tune everything at the grazing camera, never head-on — a carve that looks
   deep perpendicular flattens at the raking angle the AE light hits (doc 26 §7.6).
2. **Tangent space before anything.** POM marches in **tangent space**; feeding it world/view vectors makes
   the carve swim the wrong way. Verify by tinting `vViewDirTS` and confirming it tracks the camera
   (doc 26 §7.2). Geometry needs tangents or a `dFdx(vUv)` TBN.
3. **Add §D footprint widening before the march.** Half the "vanishing stroke" reports are strokes going
   sub-pixel — fix that with one `fwidth` _first_, then judge whether the march still skips. You may need
   far less §A/§E than you think.
4. **Add §A conservative midpoint tap, then §E refine — in that order.** The midpoint `segMax` tap is what
   _detects_ the straddled crest; the secant refine is what _places_ the hit. Adding the refine without the
   conservative detector does nothing (you never enter the refine). Verify the strokes stop disappearing
   before tuning depth.
5. **Replace `dFdx/dFdy` normals with the analytic SDF gradient (§B).** This is the single biggest
   _shimmer_ win (vs the _skip_ win of §A). Screen-derivative normals on thin strokes flicker frame-to-frame;
   the band-limited analytic gradient is steady. Do this even on `low` (it's free and the bump it replaces).
6. **Jitter is for banding, not skipping — add it LAST.** If you reach for §F jitter to fix shimmer, you've
   mis-diagnosed: jitter on an unfixed skip just makes the sparkle noisier. Confirm §A+§B killed the skip,
   then add jitter only if you see layer-banding stair-steps in the groove.
7. **Keep the groove DARK; lift it ONLY with the AE light.** Walls `× 0.32`, lip is the only HDR add. A
   pre-lit Ogham kills the "appears in the fire" beat and reads as a printed decal. The crushed-black grade
   (`BrightnessContrast brightness ≈ -0.04`) will eat anything timid — tune on-device (doc 25 §7.6).
8. **Gate by tier AND chamber from day one.** `OGHAM_POM` only on `high` + close-oblique; the top-down
   channel-hall floor uses the flat SDF (POM doesn't read top-down). Retrofitting the gate later is where
   budgets blow (doc 26 §7.8).
9. **Hook the right chunk.** Walls/shadow modulate **lit diffuse** (`<color_fragment>` / before
   `<tonemapping_fragment>`); only the lip is emissive. Wrong hook ⇒ the stone glows like the molten metal
   (doc 25 §7.3).
10. **Dispose on unmount; freeze `uTime = 2` on static; `compileAsync` the longer shader.** Non-negotiable
    (`00-COHESION-MAP.md` §10).

---

## 8. SOURCES (2025–2026)

1. **R. Hoetzlein — "Projective Displacement Mapping for Ray Traced Editable Surfaces,"** _Computer
   Graphics Forum_ 44(7), **published Oct 2025** (preprint arXiv:2502.02011, Feb 2025). The origin of this
   doc's two borrowed ideas: **thin-feature sampling** (correct hits on fine parallel features the march
   straddles) and **smoothed displaced normals** (band-limited normals that don't shimmer), plus tight
   prism bounds and ray–bilinear-patch intersection. The runtime BVH method is out of reach on mobile WebGL;
   we port the _ideas_ to a clamped GLSL loop.
   https://onlinelibrary.wiley.com/doi/10.1111/cgf.70235 · https://arxiv.org/abs/2502.02011 (Oct 2025 / Feb 2025)
2. **bentoBAUX (Bennett Poh) — "Parallax Mapping with Self-Shadowing,"** writeup + Unity HLSL repo
   (**posted 17 Mar 2025, updated 4 May 2026**). Current readable steep-parallax → POM → self-shadow with
   tangent-space setup and adaptive layer-count-by-angle — the self-shadow ray and angle-adaptive sampling
   this doc's groove shadow and §E follow.
   https://bentobaux.github.io/posts/parallax-mapping-with-self-shadowing/ ·
   https://github.com/bentoBAUX/Parallax-Mapping-with-Self-Shadowing (Mar 2025 / May 2026)
3. **"Robust Cone Step Mapping"** (Eurographics line; ResearchGate / diglib.eg.org, **2024–2025**) — defines
   an **artifact-free minimum step size** for cone-map tracing and corrects the cone-map generation so
   bilinearly-interpolated **single-texel thin features** are not skipped. The precedent for our §A
   conservative min-height-along-step clamp (the "min-height-along-step" doc-26 §9.1 named).
   https://diglib.eg.org/items/72110813-71ae-4cb3-b438-c9b0f7fc5b7f ·
   https://github.com/Bundas102/robust-cone-map (2024–2025)
4. **Grokipedia — "Parallax occlusion mapping"** (2025 revision) — consolidated 2025 treatment:
   tangent-space march, **grazing-angle artifacts ("swimming texels") and the offset-clamp ≤ current
   height** mitigation, layer-banding/aliasing, relief-vs-POM perf (relief costs more for near-identical
   results, branch divergence mobile punishes), sample-count ranges (16–32, up to ~50 at oblique angles).
   https://grokipedia.com/page/Parallax_occlusion_mapping (2025)
5. **Three.js Blocks — `parallaxOcclusion` (WebGPU, WebGL) node docs** (**2025**) — the canonical modern
   POM node: `scale` (depth, default 0.05), **adaptive min 24 / max 96 samples** (perpendicular→grazing),
   optional **blue-noise jitter**, displaced-UV + depth output. Our mobile clamp (8→24) and §F jitter derive
   directly from it; the node does **not** include thin-feature sampling, which is why we patch §A/§B.
   https://www.threejs-blocks.com/docs/parallaxOcclusion (2025)
6. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (**Oct 2025**) — TSL `NodeMaterial` hooks
   (`colorNode`/`normalNode`/`positionNode`), displacement/normal recipes, the WebGL+WebGPU dual-target
   rationale. The Phase-3 node-port target for this carve (§2H); confirms `normalNode` is where the §B
   analytic normal would live in TSL.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (Oct 2025)
7. **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL"**
   (**28 Jan 2026**) — SDF-text-as-material with selective bloom via MRT; the glyph-SDF-as-height + HDR-lip-
   only bloom-gating reference for carved letterforms in the TSL lane.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/ (Jan 2026)
8. **Codrops — "WebGPU Scanning Effect with Depth Maps"** (**31 Mar 2025**) — depth-map-driven UV
   displacement (= parallax) in TSL; the modular depth-as-height pattern for the eventual WebGPU/TSL port of
   the carve.
   https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/ (Mar 2025)
9. **Red Blob Games — "Guide to SDF + MSDF Fonts"** (**updated 1 Jan 2026**) — single-channel round SDF vs
   MSDF for glow/shadow, `fwidth` AA, `distanceRange`. The basis for §D footprint widening and for choosing
   single-SDF over MSDF for the soft groove falloff (doc 25 §3).
   https://www.redblobgames.com/articles/sdf-fonts/ (Jan 2026)
10. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (**2026**) — KTX2/Basis VRAM,
    `<Detailed>` LOD, `onBeforeCompile` variant cost, draw-call budget (<100 for 60fps), POM-class sample
    tradeoffs — the mobile-budget rules §6 obeys.
    https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Analytic-SDF cone/interval acceleration for the Ogham march.** Replace the uniform coarse march with a
   per-step _safe interval_ derived analytically from the Ogham SDF (the segment distance _is_ a lower bound
   on free-space): step by `oghamBand(uv)` like sphere-tracing so the ray leaps flat stone and densely
   samples only near strokes — fewer taps AND thin-feature-correct by construction. Quantify vs the §A/§E
   loop on the A17.
2. **The AE divine-fire → carved-stone light-transport model.** A rigorous, physically-motivated treatment
   (shared with docs 05/12/25/26) of how white-gold A/E light rakes the groove walls, casts the in-cut
   shadow, and lights the lip — so the reveal across green-reveal, Ogham, and letterforms is one light model,
   not three per-route fakes.
3. **Real-geometry vs thin-feature-POM crossover for the 1–2 closest hero glyphs.** Where (camera distance /
   silhouette demand at the altar) it becomes cheaper to extrude/CSG the nearest glyphs than to pay
   grazing-angle thin-feature POM, and how to `<Detailed>`-LOD-blend geometry carve into shader carve without
   a visible pop.
4. **TSL/WebGPU port of the thin-feature carve.** Express the §A clamp + §B analytic normal + §E refine as a
   TSL `Fn` over the stock `parallaxOcclusion` node (which lacks them), measure the mobile-Safari-26 WebGPU
   headroom vs the hand-ported GLSL, and define the WebGL fallback branch (the renderer-wide question shared
   with docs 25/26/30).
