# 11 — Clamped Parallax-Occlusion + Self-Shadow for Carved Channels & Ogham

_Phase 2 deep-dive · GAELWORX forge world · cluster **D-type-knot-reveal** · target r3f + three.js (WebGL
r17x) on one shared renderer · iPhone 15 OLED primary judge · warm-forge palette._

> This is the implementation-grade descendant of Phase-1 doc **26** (carved-stone engraving) and the
> self-shadow that doc **24** (Celtic interlace) deliberately deferred. Phase-1 picked the technique
> (clamped POM 8→24, not 24→96; 6-tap self-shadow; blue-noise jitter; high-tier + close-oblique gating).
> This doc makes it buildable: exact GLSL march, the tangent-space basis derivation, the self-shadow
> accumulation that **pools darkness in the groove**, the edge cases that break thin Ogham strokes, and
> the precise sockets into the master temperature/uniform system from the Cohesion Map.

---

## 1. SCOPE — what this element is in the GAELWORX world

The world's lore turns on one beat: when the eternal white-gold **A/E divine fire** throws its light across
the altar stone, the carved **Ogham** becomes _readable for the first time_ — not as painted lines but as
**incisions with shadowed walls and lit lips**. That sacredness is a depth illusion. A flat slab with a
lit-edge decal reads as a sticker; a slab where the cut **self-occludes** — where the near wall hides the
floor at the grazing altar angle and darkness pools in the groove — reads as something a chisel made a
thousand years ago. The self-shadow is the single feature that sells the cut. Everything else (normal
raking, lip glow) is supporting cast.

This element owns the **relief technique itself** — the per-pixel parallax/ray-march/self-shadow math that
gives apparent depth to any incision on a near-flat basalt surface, consuming a **height field** it does
not author. The height source is the shared Celtic-interlace channel SDF (`gwChannel`, doc 24) for channels
and the glyph/Ogham SDF (doc 12) for inscriptions. It is the depth complement to:

- **05 — Basalt PBR** owns the stone body, the serpentine green, the AE green-reveal. We cut into it.
- **24 — Celtic interlace** owns the channel _layout_ and the analytic SDF the metal flows _inside_. We
  give those channels apparent _depth_ and the in-cut shadow doc 24 flagged as a Phase-2 deep dive.
- **25/26 — Ogham + carved engraving** own the stroke layout and the base derivative-bump carve. We add
  the high-tier POM + self-shadow layer on top of that floor.

Where it ships (gated to angles where parallax actually reads): **altar-approach (`/about`)** at the close
oblique reveal angle — the keystone beat; **forge-mouth arch (`/contact`)** raking light on the arch
relief; **stone-ledger (`/pricing`)** Ogham rows up the edge. It is explicitly **not** used on the
top-down **channel-hall (`/automations`)** floor — POM barely reads when the camera looks straight down,
so that surface keeps doc 24's flat analytic SDF. It is a **`high`-tier finish** with a graceful
normal-only fallback on `low` and a frozen lit-incision on `static`. The cut must share the master
temperature/noise/lighting uniforms so the same `uAEFire` that lifts the green (doc 05) rakes these groove
walls — nothing reads as bolted-on.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every viable way to make a near-flat surface read as carved, ordered cheapest→richest, judged against
_this_ build: one `WebGLRenderer`, `MeshPhysicalMaterial` + `onBeforeCompile`, no runtime EXR, the
iPhone-15 fill-rate envelope.

### A. Normal-from-height (derivative bump) — lit walls, zero apparent depth

Perturb the surface normal from `dFdx/dFdy` of the SDF/height field, exactly as `ObsidianSlab.jsx` already
does for veins. Light rakes the groove walls; the incision reads as cut **until you look along it at a
grazing angle**, where it flattens because the wall never actually occludes the floor. **Quality:**
convincing perpendicular-to-moderate, flat at grazing. **Perf:** effectively free (the repo already pays
for `gw_fbm` derivatives). **Mobile:** trivial. **Fit:** the **mandatory base layer and `low`/`static`
fallback** — every tier ships at least this.

### B. Steep parallax mapping — cheap apparent depth, no self-shadow

Offset the UV lookup along the tangent-space view vector scaled by sampled height; "steep" marches a few
fixed layers. The bentoBAUX 2025 write-up walks this as the predecessor step to POM, noting the canonical
fix for "swimming texels" at grazing — **clamp the offset to at most the current height value**.
**Quality:** sells shallow grooves at moderate angles; stair-steps and swims at grazing. **Perf:** a
handful of samples. **Fit:** a stepping-stone only — POM (C) is marginally more expensive and far cleaner,
so we go straight to POM.

### C. Parallax Occlusion Mapping (POM) — adaptive tangent-space ray-march ⭐

March the view ray through the height field in tangent space, **linearly interpolate** the crossing (the
distinguishing POM step vs relief's binary search), offset the UV, and output a depth so the carve
self-occludes. This is the 2025/26 consensus "real depth without geometry." The **Three.js Blocks
`parallaxOcclusion` node** (2025) is the modern canonical reference — `scale` (depth, default ~0.05),
adaptive **min ~24 samples perpendicular → max ~96 grazing**, optional **noise/jitter** input to break
layer banding, returning displaced `uv` (xy) + depth offset (z). The Grokipedia 2025 consolidation and the
bentoBAUX 2025 post both describe the **adaptive layer count: fewer samples perpendicular, more at grazing
where the ray traces farther** — the sample cost scales _up_ exactly when the carve matters most.
**Quality:** the real thing — walls that occlude floor at grazing, room for self-shadow. **Perf:** the most
expensive per-pixel technique here; grazing-hungry. **Mobile:** affordable **only** clamped (8→24, not
24→96), early-out, restricted draw area, high-tier gated. **Fit:** **the recommended hero carve.**

### C′. POM + self-shadow ray (the feature that sells the cut)

POM alone gives depth at grazing but not the _pooled darkness_ a real groove has. The bentoBAUX 2025
"Parallax Mapping with Self-Shadowing" post (and its Unity HLSL repo) is the current readable reference for
the second march: from the parallaxed point, **step toward the light** through the height field; where the
field rises above the climbing ray, the point is occluded. It accumulates a **soft** factor by weighting
nearer occluders more (a partial-shadow term, Tatarchuk-lineage) rather than a hard 0/1 — this is what
produces the soft shadow gradient that reads as a real chiselled wall. **Quality:** the difference between
"line" and "incision" at the altar angle. **Perf:** +6 taps. **Mobile:** affordable at 6 taps. **Fit:**
**mandatory on high — it is the whole point of this deep dive.**

### D. Relief mapping — binary-search intersection

Same goal, finds the crossing via linear-step-then-binary-search. **Quality:** marginally sharper
silhouettes on steep features. **Perf:** 2025 surveys (Grokipedia) are consistent — relief costs **more
for near-identical results**, and the binary search adds branch divergence that mobile GPUs punish.
**Fit:** rejected for mobile; POM's linear interpolation is the better quality-per-ms.

### E. Analytic SDF groove (no march) — doc 24's path

Evaluate the incision as a 2D distance field, darken walls, perturb normal toward centreline. Identical to
A but with an analytic height source. **Quality:** flawless edges at any zoom, perfect top-down; flat at
grazing. **Fit:** the **height/mask _source_** that feeds A and C, and the complete solution for the
top-down channel-hall. This doc _consumes_ the doc-24 SDF as the POM height field; it never forks a second
one.

### F. Projective / prism displacement, ray-traced (frontier, not for us)

Hoetzlein 2025 ("Projective Displacement Mapping for Ray Traced Editable Surfaces," CGF / arXiv 2502.02011)
— direct height-field ray-march inside parallel offset prisms, **smoothed displaced normals**, **thin-feature
sampling**, tight prism bounds, no BVH rebuild. State-of-the-art editable carved relief and the best answer
to the thin-Ogham-stroke problem, but it assumes hardware ray tracing. **Fit:** reject for runtime; **borrow
the thin-feature and smoothed-normal ideas** for our Ogham-stroke handling (§7).

### G. Real carved geometry (extrude/CSG)

Model the incision. **Quality:** honest silhouette, no shader cost. **Perf:** vertex/overdraw, dense
tessellation for sharp strokes. **Fit:** reserved for the 1–2 closest hero altar glyphs via `<Detailed>`;
everything else fakes it.

### H. TSL / WebGPU node carve (the near future — Phase 2.5, not the judge build)

The 2025/26 zeitgeist makes this real: **Safari 26 shipped WebGPU on iOS in September 2025**, and three.js
**r171+ (Sep 2025)** lets you swap `WebGLRenderer`→`WebGPURenderer` with a one-line change and an automatic
WebGL2 fallback (utsubo "What's New in Three.js 2026"). The `parallaxOcclusion` node, `triplanarTexture`,
and TSL noise compose to **both** WGSL and GLSL; Maxime Heckel's "Field Guide to TSL and WebGPU" (Oct 2025)
documents the `normalNode`/`positionNode`/`colorNode` hooks the carve would use; Codrops' "WebGPU Scanning
Effect with Depth Maps" (Mar 2025) is depth-map-driven UV displacement = parallax in TSL; Codrops' "WebGPU
Gommage Effect" (Jan 2026) does MSDF text as a TSL material with **selective bloom via MRT** — the
glyph-SDF-as-height + HDR-lip-only reference for carved letterforms. **Fit for the judge build:** the whole
scene is one `WebGLRenderer` + hand-patched `MeshPhysicalMaterial`; CI/`qa-route`/SwiftShader assume WebGL,
and the Cohesion Map (§10) names betting the judge device on the less-tested WebGPU→WebGL2 fallback branch
as the documented mistake. **Decision: ship the hand-ported GLSL loop today; author it TSL-portable; flag
the node adoption as a named deep-dive (§9).**

**Landscape verdict:** A is the floor (all tiers); C+C′ is the high-tier hero, with E as its height source;
D/F/G/H are rejected or deferred for the reasons above. This is exactly the Phase-1 doc-26 pick, now made
concrete.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A three-tier carve, one height source, patched into `MeshPhysicalMaterial` via the existing
`onBeforeCompile` chunk injection:**

1. **Base (all tiers) — normal-from-height (A).** Derivative bump of the SDF height drives the wall
   normals so every incision reads as cut, everywhere, for free. The floor and the fallback.
2. **High tier — clamped POM (C) + 6-tap self-shadow (C′).** `8→24` adaptive samples
   (perpendicular→grazing, **clamped — not the node's 24→96 desktop defaults**), blue-noise jitter on the
   march start offset to kill layer banding, then a ~6-step shadow ray toward the dominant light (the
   molten/AE source) so darkness pools in the groove. Gated to close-oblique chambers
   (altar/contact/pricing).
3. **Height source = the SDF, not a heavy texture.** `gwHeight(uv)` is `clamp(uCarveDepth - abs(sdf), …)`
   from doc 24's `gwChannel` (channels) or the Ogham/glyph SDF (doc 12). An **optional** single 512² ETC1S
   `.ktx2` chisel-grain detail-height adds micro-relief POM can't fake. **v1 ships pure-SDF — zero new
   bytes.**

**Justification, tied to the world + constraints:**

- **The Ogham reveal demands groove _shadow_, not a lit edge.** The keystone beat (§1; Cohesion Map §5.2)
  is the AE light making Ogham legible. POM's self-shadow is precisely the cue that reads as depth at the
  oblique altar angle; option A flattens there. This is the one place the per-pixel cost is earned.
- **One height source = automatic cohesion.** Reusing `gwChannel`/glyph SDF means the incision POM marches
  is the _same_ incision the metal fills, the over/under uses, and the reveal lights. They cannot drift.
- **POM over relief on mobile.** 2025 surveys: relief costs more for identical results and its binary
  search adds branch divergence mobile GPUs punish. POM's linear interpolation is the modern node's own
  choice.
- **Stays inside the proven engine.** Same `onBeforeCompile` + `${GLSL_NOISE}` + `v3(PAL.x)` recipe as the
  slab. No second canvas, no EXR, no renderer swap; `qa-route`-verifiable today.
- **Correctly gated.** POM is the budget hog, so it is high-tier + close-chamber + carved-surface only.
  Degrades to "lit incision," never "missing incision."

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`; tangent-space basis.
- `@react-three/fiber`, `@react-three/drei` (in repo) — `<Detailed>` for close-vs-far LOD; `KTX2Loader`
  (+ local Basis transcoder) **only if** the optional detail map ships.
- `@react-three/postprocessing` (in repo) — bloom catches the AE-lit lip, not the carve walls.
- **No new heavy deps. No EXR.** Optional single 512² ETC1S `.ktx2`, bundled locally. v1 = pure SDF.

### 4.2 The shared master uniforms (reads world state from `src/store.js` / the `U` pool, never writes)

Bind the **same references** from the Master Forge Uniform pool (`forgeUniforms.js`, Cohesion Map §4.2) via
`Object.assign(shader.uniforms, U)`, plus the carve-local controls:

```js
const local = useMemo(() => ({
  uCarveDepth: { value: 0.06 },                 // POM scale (groove depth), leva-tunable
  uCarveMin:   { value: 8 },                    // POM samples, perpendicular  (mobile clamp)
  uCarveMax:   { value: 24 },                   // POM samples, grazing        (mobile clamp, NOT 96)
  uShadowStr:  { value: 0.7 },                  // groove self-shadow strength
  uReveal:     { value: 0 },                    // Ogham reveal floor (route/static)
  uJitter:     { value: null },                 // optional blue-noise tex (banding break)
  uDetail:     { value: null },                 // optional KTX2 chisel-grain height
}), [])
// SHARED from U (same refs as slab/05/24): uTime, uTemp, uHeat, uAEFire(vec3), uAEFirePow, uLightDir
```

The only carve-owned signals are geometry/cosmetic; **every thermal and light signal is a shared reference**
— that is the cohesion contract made literal.

### 4.3 Vertex hook — tangent-space view & light (after `#include <worldpos_vertex>`)

POM marches in **tangent space**; feeding it world/view vectors is the #1 failure (the carve swims the
wrong way or shears). `MeshPhysicalMaterial` exposes `objectTangent` when the geometry has tangents
(`USE_TANGENT` via `geometry.computeTangents()`); otherwise derive the TBN from `dFdx(vUv)`.

```glsl
varying vec3 vViewDirTS;   // view dir, tangent space
varying vec3 vLightTS;     // dominant light dir, tangent space
varying vec3 vWPos;

vec3 N = normalize(transformedNormal);
vec3 T = normalize(objectTangent.xyz);          // or derive from dFdx(vUv)/dFdy(vUv)
vec3 B = cross(N, T) * objectTangent.w;
mat3 TBN = transpose(mat3(T, B, N));            // world -> tangent
vWPos      = (modelMatrix * vec4(transformed, 1.0)).xyz;
vViewDirTS = TBN * normalize(cameraPosition - vWPos);
vLightTS   = TBN * normalize(uLightDir);        // uLightDir = dominant molten/AE direction (shared)
```

### 4.4 HEAD — height source + clamped POM + 6-tap self-shadow (after `#include <common>`, fragment)

```glsl
uniform float uTime, uTemp, uHeat, uCarveDepth, uShadowStr, uAEFirePow, uReveal;
uniform float uCarveMin, uCarveMax;
varying vec3  vViewDirTS, vLightTS, vWPos;
${GLSL_NOISE}                       // gw_fbm / gw_snoise — reuse, never re-impl
// gwChannel(uv) -> vec2(signedDist, layer) from doc 24's shared block in shaders.js
// (swap the Ogham/glyph SDF from doc 12 for inscriptions; the carve is height-source-agnostic)

// HEIGHT: 1.0 = stone surface, 0.0 = groove floor (the incision goes DOWN).
float gwHeight(vec2 uv){
  float d   = abs(gwChannel(uv).x);                 // distance to incision centreline
  float inc = smoothstep(0.0, uCarveDepth, d);      // 0 deep in groove, 1 on flat stone
  #ifdef HAS_DETAIL
    inc -= (1.0 - inc) * texture2D(uDetail, uv * 6.0).r * 0.25;  // chisel grain, groove-only
  #endif
  return clamp(inc, 0.0, 1.0);
}

// CLAMPED POM: march the view ray through the height field in tangent space, linear-interp the crossing.
// vTS = normalize(vViewDirTS). Returns parallaxed UV. (POM, not relief: NO binary search.)
vec2 gwPOM(vec2 uv, vec3 vTS){
  // adaptive: MORE samples at grazing (small |vTS.z|), FEWER perpendicular — clamped 8..24
  float nSteps = mix(uCarveMax, uCarveMin, abs(vTS.z));
  float dl     = 1.0 / nSteps;
  vec2  duv    = (vTS.xy / max(abs(vTS.z), 0.2)) * uCarveDepth * dl;  // per-step UV march; 0.2 anti-stretch
  float layer  = 0.0;
  #ifdef HAS_JITTER
    layer += texture2D(uJitter, gl_FragCoord.xy / 64.0).r * dl;       // blue-noise: break layer banding
  #endif
  float h = gwHeight(uv), hPrev = h;
  vec2  uvPrev = uv;
  for (int i = 0; i < 24; i++){                       // 24 = compile-time mobile clamp (loop unrolls)
    if (float(i) >= nSteps) break;                    // dynamic early-out at the adaptive count
    layer += dl; uvPrev = uv; uv -= duv; hPrev = h; h = gwHeight(uv);
    if (layer >= h) {                                 // ray dipped below the surface -> crossing found
      float after  = h     - layer;                   // POM linear interpolation of the crossing
      float before = hPrev - (layer - dl);
      float t = after / (after - before);
      return mix(uv, uvPrev, t);
    }
  }
  return uv;                                          // no hit (flat stone) — UV unchanged
}

// 6-TAP SELF-SHADOW toward the light: pools soft darkness in the groove. (bentoBAUX 2025 lineage.)
// lTS = normalize(vLightTS). Returns 1.0 = lit, ->0 = occluded. Nearer occluders weigh more (soft).
float gwGrooveShadow(vec2 uv, vec3 lTS){
  if (lTS.z <= 0.0) return 1.0;                       // light below surface -> no in-cut shadow
  float h0   = gwHeight(uv);
  vec2  step = (lTS.xy / max(lTS.z, 0.2)) * uCarveDepth * (1.0 / 6.0);
  float sh   = h0;                                    // ray height climbs toward the light
  float occ  = 0.0;
  for (int i = 1; i <= 6; i++){
    vec2  su = uv + step * float(i);
    float hs = gwHeight(su);
    sh += uCarveDepth / 6.0;
    // partial-shadow accumulation: how far the field rises above the climbing ray, weighted toward near taps
    occ = max(occ, (hs - sh) * float(7 - i));
  }
  return 1.0 - clamp(occ * uShadowStr, 0.0, 1.0);
}
```

### 4.5 NORMAL — carve the walls (after `#include <normal_fragment_maps>`)

```glsl
#ifdef POM
  vec2 uvP = gwPOM(vUv, normalize(vViewDirTS));   // parallaxed UV (high tier)
#else
  vec2 uvP = vUv;                                  // flat: derivative bump still carves
#endif
float gwH  = gwHeight(uvP);
vec3  gwBmp = vec3(dFdx(gwH), dFdy(gwH), 0.0);     // same dFdx/dFdy idiom as the slab
normal = normalize(normal - gwBmp * 2.2);          // walls rake the light; tune strength
```

### 4.6 COLOR — wall darkening, groove shadow, AE reveal (before `#include <tonemapping_fragment>`)

```glsl
float wallBand = smoothstep(0.0, 0.5, 1.0 - gwH);       // how deep in the groove this pixel sits
vec3  stone    = gl_FragColor.rgb;                       // basalt (doc 05) / lit diffuse
gl_FragColor.rgb = mix(stone, stone * 0.32, wallBand);   // recessed walls/floor darker (< 1.0, no bloom)

#ifdef POM
  gl_FragColor.rgb *= gwGrooveShadow(uvP, normalize(vLightTS));  // shadow pools in the cut
#endif

// AE divine-fire: white-gold glow on the groove LIP makes the incision catch light = readable.
float lip    = smoothstep(0.35, 0.55, gwH) * (1.0 - smoothstep(0.55, 0.85, gwH));
float reveal = clamp(uAEFirePow + uReveal, 0.0, 1.0);
gl_FragColor.rgb += ${v3(PAL.gold)}  * lip * reveal * 1.1;            // HDR lip -> bloom catches it
gl_FragColor.rgb += ${v3(PAL.ember)} * wallBand * pow(uTemp, 2.0) * 0.3; // hot grooves near molten metal
```

### 4.7 r3f component shape

```jsx
import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { U } from '../scene/forgeUniforms'     // the shared Master Forge pool
import { forge } from '../store'
const damp = THREE.MathUtils.damp

export default function CarvedStone({ quality, geometry, heightSource = 'channel' }) {
  const pom   = quality === 'high'
  const local = useMemo(() => ({ /* …uCarveDepth, uCarveMin/Max, uShadowStr, uReveal, uJitter, uDetail… */ }), [])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a120e'), metalness: 0, roughness: 0.85, envMapIntensity: 0.5,
    })
    m.defines = { USE_UV: '' }
    if (pom)               m.defines.POM = ''
    if (local.uJitter.value) m.defines.HAS_JITTER = ''
    if (local.uDetail.value) m.defines.HAS_DETAIL = ''
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, local)        // SHARED refs first, then carve-local
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>',
          `#include <common>\nvarying vec3 vViewDirTS; varying vec3 vLightTS; varying vec3 vWPos;`)
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${VERT}`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>',               `#include <common>\n${HEAD}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [pom])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    // uTime/uTemp/uHeat/uAEFire* are driven by the single <ForgeDriver/>; here only carve-local cosmetics:
    local.uReveal.value = damp(local.uReveal.value, forge.quality === 'static' ? 0.6 : 0.0, 2.0, dt)
  })

  // tangents required for the TBN; compute once on the source geometry
  useEffect(() => { if (!geometry.attributes.tangent) geometry.computeTangents() }, [geometry])

  return <mesh geometry={geometry} material={material} />
}
```

Critically, **`uTime`/`uTemp`/`uHeat`/`uAEFire`/`uAEFirePow`/`uLightDir` are not written here** — they are
the shared `U` references the one `<ForgeDriver/>` damps for the whole world. The carve only damps its own
cosmetic `uReveal`. This is what keeps the groove heating on the same heartbeat as the veins.

### 4.8 Key params

| Uniform | Drives | Source |
|---|---|---|
| `uCarveDepth` | groove depth (POM scale) | constant, leva (~0.05–0.06) |
| `uCarveMin/Max` | adaptive samples perp→grazing | **8/24 mobile** (NOT 24/96 desktop) |
| `uShadowStr` | groove self-shadow darkness | leva, ~0.7 |
| `uLightDir` | self-shadow + wall raking direction | **shared** dominant molten/AE light |
| `uAEFire` / `uAEFirePow` | groove-lip white-gold glow + Ogham reveal | **shared** A/E letterform light |
| `uTemp` / `uHeat` | hot-groove ember tint near metal | **shared** `scrollDamped` + strike |
| `uTime` | groove-floor churn / shimmer | **shared** clock; frozen `=2` static |
| `uReveal` | reveal floor (route/static legibility) | carve-local, dt-damped |

---

## 5. COHESION — shared palette / lighting / uniforms

- **One height source.** The POM marches doc 24's `gwChannel` SDF (or doc 12's glyph SDF). The incision the
  ray traces is the _same_ incision the metal fills, the over/under weaves, and the reveal lights — the
  Cohesion Map §7 rule 8 ("share the channel curve data three ways") extended to a fourth consumer (depth).
- **One master temperature.** `uTemp`/`uHeat` are the identical shared references the slab, doc 05, and doc
  24 read. Hot grooves ember-tint in lockstep with the veins glowing — one thermostat, no private orange
  (the single failure mode the Cohesion Map guards against).
- **One light, the metal.** No fill. `uLightDir`/`uAEFire`/`uAEFirePow` come from the A/E letterforms — the
  same signal docs 05/24 use. The self-shadow and lit lip are the basalt's _response_ to the world's
  brightest source, so the Ogham becoming readable is **causal**, not a per-route fake (Cohesion Map §5.2).
- **One palette, one bloom contract.** Color is only `PAL` via `v3()`: `PAL.gold` for the AE lip,
  `PAL.ember` for hot grooves, walls = basalt × 0.32. Walls/floor stay **< 1.0 (never bloom)**; only the AE
  lip pushes HDR so the shared `<Bloom luminanceThreshold≈0.55>` catches the lit inscription and nothing
  else. A glowing groove would read as lava; keeping walls dark is what reads as _recessed_ (Cohesion Map
  §3.1, the palette-is-the-bloom-selector rule).
- **One noise basis.** Any micro-grain comes from the shared `gw_fbm`/`gw_snoise`, never a second noise. The
  optional chisel KTX2 is the only exception and is gated off by default.
- **Same material idiom.** `MeshPhysicalMaterial` + `onBeforeCompile` at `<common>` /
  `<normal_fragment_maps>` / `<tonemapping_fragment>`, `defines={USE_UV:''}`, `gw_`-namespaced GLSL,
  `dispose()` on unmount, `U` bound by reference, the one `useFrame` writer — byte-for-byte the slab recipe.
- **Same env, material contrast.** Matte stone (`roughness 0.85`, `envMapIntensity 0.5`) drinks the same
  cool procedural PMREM env the glossy slab throws back — the contrast that reads as one lit space.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

POM is the single biggest throttle risk in the whole research set — its sample count scales _up_ at grazing
angles, exactly when carved marks fill the screen. The discipline:

- **Hard sample clamp: 8→24, never 24→96.** The Three.js Blocks node defaults (24/96) are desktop numbers.
  Compile-time loop bound = 24 so the loop unrolls with no runtime branch; `uCarveMin/Max` = 8/24 on mobile;
  dynamic early-out (`if (float(i) >= nSteps) break;`) the instant the count is reached _and_ when the ray
  dips below the field. The 2025/26 surveys confirm mid/low GPUs (i.e. mobile) routinely disable POM
  outright — clamping + gating is how we keep it at all.
- **Tier contract** (mirrors `useQuality` → high|low|static, `forge-scene`):
  - **high:** `#define POM`, 8→24 adaptive, 6-tap self-shadow, blue-noise jitter, optional KTX2 detail,
    `dpr [1, 1.5]`. **Gated to close oblique chambers only** (altar/contact/pricing).
  - **low:** **no POM** — derivative-bump carve only (A), no shadow march, no detail. The incision still
    reads lit-and-cut at every angle but the most grazing. `dpr [1, 1.4]`.
  - **static / reduced-motion:** freeze `uTime = 2`, derivative bump only, `uReveal` floor ~0.6 so Ogham
    stays legible without live light math, `frameloop='demand'`. The baked-feel poster.
- **Restrict POM draw area.** Only surfaces carrying close carved marks get the `POM`-defined material. The
  top-down channel-hall floor uses doc 24's flat analytic SDF (POM doesn't read straight-down). **Never
  blanket the scene in POM** — retrofitting the gate is where budgets blow.
- **Blue-noise jitter, not more samples.** Layer banding is a banding artifact, not a resolution one; a 64²
  blue-noise (or `gl_FragCoord` hash) offset on the march start is far cheaper than raising the count. The
  Three.js Blocks node exposes a noise input for exactly this; the DTAA/POM practice notes even extreme POM
  looks clean at 8–10 max samples with dither.
- **One height eval, reused.** `gwHeight` is the SDF (cheap) + optional one tap. Compute `uvP`/`gwH` once in
  NORMAL; reuse in COLOR and the shadow march — never re-march.
- **KTX2 only, if at all.** Optional chisel detail ships ETC1S 512² `.ktx2` (~10× VRAM saving vs PNG, 2026
  best-practice); set the transcoder path once, bundle locally, **never EXR/HDR** (the build's cardinal
  scar). v1 ships pure-SDF (zero new bytes).
- **`<Detailed>` LOD.** Real-geometry carve (G) only on the 1–2 closest hero glyphs; POM at mid distance;
  derivative bump far. Don't pay POM for marks smaller than a few pixels.
- **Budget line item.** Within the Cohesion Map §10 envelope, the carved surfaces are few meshes; the POM
  pass is bounded to the small altar/arch/ledger draw area, not the full-screen slab cost — keep it inside
  the ~3.5–4.5 ms slab-shader slice's headroom, well under the 100-draw-call 60fps guideline.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

Each step is `qa-route`-verifiable (0 console errors @ 393×852 + 1440×900; SwiftShader compiles the GLSL in
CI so a typo surfaces as an error). Then the **iPhone 15 OLED read is mandatory** — groove depth,
self-shadow, and the AE lip do **not** simulate headless.

1. **Ship the derivative-bump carve FIRST (A), all tiers.** Prove an incision reads as cut from the shared
   SDF height before a single POM sample. If A isn't convincing, POM won't save it. It is also the
   fallback.
2. **Get tangent space right before POM.** POM marches in **tangent space**; feeding world/view vectors is
   the #1 failure (the carve swims the wrong way or shears). Verify by tinting `vViewDirTS` and confirming
   it tracks the camera. Geometry needs `computeTangents()` (or derive TBN from `dFdx(vUv)`).
3. **Bound the loop at compile time (24) + early-out.** A dynamic-length/unbounded march tanks mobile and
   may not compile on some drivers. `for (int i=0; i<24; i++){ if (float(i) >= nSteps) break; … }`.
4. **POM (linear interpolation), not relief (binary search).** Binary search adds branch divergence mobile
   GPUs punish for near-identical quality (2025 surveys). Interpolate the crossing.
5. **Clamp the per-step offset to anti-stretch.** Divide the UV march by `max(abs(vTS.z), 0.2)`; without the
   floor, near-grazing rays stretch the lookup and "swim" (the canonical bentoBAUX/Grokipedia grazing fix).
6. **Blue-noise jitter before raising samples.** Stair-step banding in the groove is a banding artifact —
   jitter the march start offset; only then consider more samples. Far cheaper than +samples.
7. **Self-shadow is what sells the cut at the altar angle.** Lit-wall-only flattens at grazing; the 6-tap
   soft shadow pooling darkness in the groove is the difference between "line" and "incision." Add it
   **before** any cosmetic tuning, and weight nearer taps more (`* float(7-i)`) for the soft falloff.
8. **Thin Ogham strokes are the edge case (the sacred payoff most at risk).** Ogham is fine parallel
   strokes — the classic "thin feature" POM skips between, so strokes shimmer/vanish at grazing. Mitigate:
   (a) keep `uCarveDepth` modest so the march can't overstep a thin wall; (b) take a **min-height along the
   step** (sample mid-step, keep the lower height) so a thin wall isn't tunnelled; (c) borrow Hoetzlein
   2025's smoothed-displaced-normal idea so the thin wall's normal stays coherent. Verify on the actual
   Ogham verse at the altar angle on-device, not on a fat test groove.
9. **Keep walls DARK, only the lip HDR.** Walls/floor < 1.0 (recessed); only the AE lip exceeds 1.0 so
   bloom catches the inscription, not the whole groove. A glowing groove reads as lava (post-fx rule). The
   crushed-black grade eats anything too timid — tune the lip on-device.
10. **Hook the right chunk.** Walls/shadow modulate **lit diffuse** (replace at `<color_fragment>` or add
    before `<tonemapping_fragment>` per the slab); the AE lip is the only emissive add. Wrong hook = stone
    glows like molten metal.
11. **Don't blanket POM; gate by tier AND surface AND chamber from day one.** Top-down channel-hall = flat
    SDF; close oblique altar/contact/pricing = POM.
12. **Dispose on unmount; freeze `uTime=2` on static; bind `U` by reference, never clone.** The slab's
    discipline, non-negotiable — a clone breaks cohesion silently.

---

## 8. SOURCES (2025–2026)

1. **bentoBAUX — "Parallax Mapping with Self-Shadowing"** (2025). Current readable steep-parallax → POM →
   **self-shadow** walkthrough: tangent-space march, adaptive layer count by angle, the grazing
   offset-clamp anti-swim fix, and the soft self-shadow ray with near-occluder weighting that this doc's
   `gwGrooveShadow` follows. Repo: Unity HLSL implementation.
   https://bentobaux.github.io/posts/parallax-mapping-with-self-shadowing/ ·
   https://github.com/bentoBAUX/Parallax-Mapping-with-Self-Shadowing
2. **Three.js Blocks — `parallaxOcclusion` (WebGPU, WebGL) node docs** (2025). The canonical modern POM
   node: `scale` (depth, default ~0.05), adaptive min ~24 / max ~96 samples (perpendicular→grazing),
   optional **noise/jitter** input, returns displaced uv (xy) + depth offset (z), dual WebGPU/WebGL target.
   Our mobile clamp (8→24) and jitter approach derive directly from it.
   https://www.threejs-blocks.com/docs/parallaxOcclusion ·
   https://www.threejs-blocks.com/examples/webgpu_parallax_occlusion
3. **Grokipedia — "Parallax occlusion mapping"** (2025 revision). Consolidated 2025 treatment:
   tangent-space ray-march, **linear interpolation** between depth layers, **relief-vs-POM perf** (relief
   more expensive, near-identical results), grazing-angle sample-count scaling and "swimming texels"
   mitigation, the GLSL fragment-shader pipeline.
   https://grokipedia.com/page/Parallax_occlusion_mapping
4. **R. Hoetzlein — "Projective Displacement Mapping for Ray Traced Editable Surfaces"** (Computer Graphics
   Forum / arXiv 2502.02011, Feb 2025). State-of-the-art editable carved relief: height-field ray-march in
   offset prisms, **smoothed displaced normals**, **thin-feature sampling** (the Ogham-stroke problem),
   tight prism bounds. The frontier we borrow ideas from for thin strokes (§7.8), not the runtime path.
   https://arxiv.org/abs/2502.02011 · https://arxiv.org/pdf/2502.02011
5. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (Oct 2025). TSL `normalNode`/`positionNode`/
   `colorNode` material hooks, displacement/normal recipes, the WebGL+WebGPU dual-target rationale — the
   Phase-2 node-adoption case for porting the carve.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
6. **Codrops — "WebGPU Scanning Effect with Depth Maps"** (Mar 31, 2025). Depth-map-driven UV displacement
   (= parallax) in TSL; the modular depth-as-height pattern for the WebGPU/TSL port.
   https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
7. **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text… with Three.js & TSL"** (Jan 28, 2026). MSDF
   text as a TSL material with **selective bloom via MRT** — the glyph-SDF-as-height + HDR-lip-only
   bloom-gating reference for carved letterforms.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
8. **utsubo — "What's New in Three.js (2026): WebGPU, New Workflows & Beyond"** (2026). r171+ one-line
   `WebGPURenderer` swap with automatic WebGL2 fallback; the migration context that makes node-based POM a
   real Phase-2 path (with the documented caution about the fallback branch on the judge device).
   https://www.utsubo.com/blog/threejs-2026-what-changed
9. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026). KTX2/Basis (~10× VRAM,
   ETC1S diffuse / UASTC normals), draw-call budget (<100 for 60fps), `onBeforeCompile` cost, `<Detailed>`
   LOD — the mobile-budget rules this carve obeys.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
10. **WebKit — "News from WWDC25: Web technology coming this fall in Safari 26 beta"** (2025). Safari 26
    ships **WebGPU on iOS/iPadOS/macOS** — the platform shift that makes the TSL/WebGPU carve port a real
    (post-judge) target.
    https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Thin-Ogham-stroke POM correctness.** The most at-risk payoff: fine parallel strokes are exactly the
   thin-feature case POM degrades on (samples skip between thin walls; strokes shimmer/vanish at grazing).
   Adopt Hoetzlein 2025's thin-feature sampling + smoothed-displaced-normal ideas, a min-height-along-step
   clamp, and a depth-aware sample-count bump only on inscription surfaces, so the sacred verse stays crisp
   at the altar angle on mobile.
2. **TSL/WebGPU node port of the clamped carve.** With Safari 26 iOS WebGPU live and r171+ shipping, move
   the clamped POM + 6-tap self-shadow to the composable `parallaxOcclusion` node + a TSL height function
   sharing the channel SDF; quantify the mobile headroom vs the hand-ported GLSL loop and define the
   WebGL2-fallback branch behaviour the judge device would actually hit.
3. **The AE divine-fire → groove light-transport model.** A rigorous shared treatment of how white-gold A/E
   light rakes the groove walls, casts the in-cut self-shadow, and lights the lip — unified with the
   letterform lighting and docs 05 §1 / 24 §5 — so the reveal is physically motivated, one light-transport
   model, not a per-route hand-fake.
4. **Real-geometry vs POM crossover for hero glyphs.** Where (camera distance / silhouette demand) it is
   cheaper to extrude/CSG the 1–2 closest altar glyphs (option G) than to pay grazing-angle POM, and how to
   `<Detailed>`-blend the geometry carve into the shader carve without a visible pop at the LOD seam.
