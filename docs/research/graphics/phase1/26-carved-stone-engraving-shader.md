# 26 — Carved-Stone Engraving / Parallax-Occlusion Shader

_Phase 1 graphics research · GAELWORX forge world · target r3f + three.js (WebGL r17x) · iPhone 15 OLED primary judge · one shared renderer · warm-forge palette._

---

## 1. SCOPE

This document owns **the carved look** — how Ogham strokes, Celtic knotwork lines, and the
GAELWORX/letterform glyphs read as **physically cut into the green-black Irish basalt**, with real
groove depth, raked wall light, and self-shadow in the incision, **without paying for the geometry**.

It is the depth complement to three sibling docs and must not overlap their jobs:

- **05 — Basalt Stone PBR** owns the stone _body_ (procedural green-black, the AE green-reveal,
  heat-staining). This doc owns the _incision_ cut into that body.
- **24 — Celtic Interlace Channel Geometry** owns the _layout_ of the channels and the analytic-SDF
  groove that the molten metal flows _inside_. This doc owns the **carving relief technique itself**
  — the parallax/relief/normal-from-height math that gives any incised mark (channel, Ogham, glyph)
  apparent depth on a flat slab, and crucially the **self-shadowing inside the groove** that doc 24
  deliberately deferred (doc 24 §2 L3c flagged POM as a Phase-2 deep dive and rejected it for the
  base channel render). This is that deep dive.
- **12 — SDF/MSDF text** owns glyph distance fields. Here we treat an SDF/MSDF (or a baked height
  map) as the _height source_ that drives the carve.

The single narrative job: when the **A/E divine fire** throws its white-gold light across the altar
stone, the **carved Ogham becomes readable for the first time** — and "readable" means the eye sees
**grooves with shadowed walls and lit lips**, not flat painted lines. Carving depth is what turns the
Ogham reveal from a decal into a sacred inscription. The carve must share the master
temperature/noise/lighting uniforms so the same light that reveals the green (doc 05) rakes the
groove walls here, and nothing reads as bolted-on.

Where it appears: **altar-approach (About)** and **forge-mouth arch (Contact)** at close, oblique,
light-raking angles where depth pays off most; the **stone-ledger (Pricing)** Ogham rows; secondary
relief on the **channel-hall** walls (the top-down floor itself uses doc 24's flat analytic SDF — POM
barely reads top-down). It is a **`high`-tier finish**, with graceful normal-only and flat-SDF
fallbacks below.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable way to make a flat (or near-flat) basalt surface read as carved, ordered cheapest→
richest, with honest tradeoffs against _this_ build (one `WebGLRenderer`, `MeshPhysicalMaterial` +
`onBeforeCompile`, no runtime EXR, iPhone-15 fill-rate budget).

### A. Normal-map / derivative-bump carving (no apparent depth, just lit walls)

Perturb the surface normal from a height field — either a baked normal map or, as the slab already
does, `dFdx/dFdy` of a procedural/SDF height (`ObsidianSlab.jsx:49-54`). Light then rakes the groove
walls and the incision reads as carved _as long as you don't look along it at a grazing angle_.
**Quality:** convincing at near-perpendicular and moderate angles; the carve "flattens" at grazing
because there's no actual parallax — the wall never occludes the floor. **Perf:** nearly free (the
repo already pays for `gw_fbm` derivatives). **Mobile:** trivial. **Complexity:** lowest. **Fit:**
the **mandatory base layer and the `low`/`static` fallback** — every tier ships at least this.

### B. Parallax / steep-parallax mapping (cheap apparent depth, no self-shadow)

Offset the texture-lookup UV along the tangent-space view vector, scaled by sampled height — classic
parallax. Steep parallax marches a few fixed layers to handle bigger displacement. **Quality:** sells
shallow grooves at moderate angles; visibly _swims_ and breaks (texture stretching, "stair-stepping")
at grazing angles and on steep incisions. **Perf:** a handful of samples — very cheap. **Mobile:**
fine. **Complexity:** low. **Fit:** a viable mid-tier middle ground, but POM (C) is only marginally
more expensive and far cleaner, so this is mostly a stepping-stone.

### C. Parallax Occlusion Mapping (POM) — adaptive ray-march of a height field ⭐

Ray-march the view ray through the height field in tangent space, binary/linear-interpolate the
intersection, offset the UV, and **also output a depth offset** so the carve self-occludes correctly.
This is the 2025/26 consensus "real depth without geometry" technique. The **Three.js Blocks
`parallaxOcclusion` node** (2025) is the canonical modern reference: a `scale` (depth, default 0.05),
**min samples at perpendicular view (~24)**, **max samples at grazing angle (~96)**, and an optional
**blue-noise jitter** texture to break the layer-banding. The classic ATI/Tatarchuk POM with
approximate soft shadows is the lineage; the **bentoBAUX 2025 "Parallax Mapping with Self-Shadowing"**
write-up gives a current, readable HLSL implementation of POM **plus the self-shadow ray** that the
groove _needs_ (a second short march toward the light to darken occluded floor). **Quality:** the
real thing — grooves you could cut your hand on, walls that occlude the floor at grazing angles,
shadow pooling in the incision. **Perf:** the single most expensive per-pixel technique here;
grazing-angle hungry (sample count scales _up_ exactly when the carve matters). On a 2006 GTX it was
0.7→1.3 ms perpendicular→grazing; on a phone fragment shader it must be clamped hard. **Mobile:**
affordable **only** with clamped samples (8–24, not 24–96), early-out, restricted draw area, and
high-tier gating. **Complexity:** medium. **Fit:** **the recommended hero carve, high-tier, gated to
close oblique chambers.**

### D. Relief mapping (binary-search ray/height intersection)

Same goal as POM but finds the intersection via linear-step-then-binary-search rather than
layer-interpolation. **Quality:** slightly more accurate silhouettes than POM, especially on steep
features. **Perf:** the 2025 surveys are consistent — relief is **more expensive than POM for
near-identical results**, and POM holds roughly even cost across angles while relief's binary search
adds branchy divergence. **Mobile:** worse than POM (branch divergence hurts mobile GPUs).
**Complexity:** medium. **Fit:** rejected for mobile; POM's linear interpolation is the better
quality-per-millisecond pick here.

### E. SDF/analytic groove in the fragment shader (no height map, no march)

The doc-24 path: evaluate the incision as a 2D distance field (`abs(d) - halfWidth`), shade walls
darker, perturb the normal toward the centreline. **No apparent parallax depth** — it's option A with
an analytic height source. **Quality:** flawless _edges_ at any zoom, perfect for top-down where
parallax doesn't read; flat at grazing. **Perf:** cheap (bounded segment loop). **Mobile:** great.
**Complexity:** low-medium. **Fit:** **the height/mask _source_** that feeds A or C, and the complete
solution for the top-down channel-hall. This doc's carve consumes the doc-24 SDF as its height field
rather than introducing a competing one.

### F. Projective / prism displacement, ray-traced (research frontier, not for us)

**Hoetzlein, "Projective Displacement Mapping for Ray Traced Editable Surfaces," Computer Graphics
Forum 2025** — direct height-field sampling via ray-march inside parallel offset prisms, smoothed
displaced normals, thin-feature sampling, no BVH rebuild. State-of-the-art _editable_ carved relief.
**Quality:** the best — true silhouettes, correct thin Ogham strokes. **Perf:** assumes hardware ray
tracing / a BVH. **Mobile WebGL:** out of reach. **Fit:** **reject for Phase 1**; cited as the
direction the technique is heading and the reason our thin-Ogham-stroke handling borrows its
_smoothed-displaced-normal_ and _thin-feature_ ideas in spirit.

### G. Real carved geometry (extrude/boolean the grooves)

Actually model the incision (ExtrudeGeometry U-profile, doc 24 L3b; or CSG boolean). **Quality:**
honest depth, correct silhouette, no shader cost. **Perf:** vertex/overdraw cost; CSG bloats the
mesh; sharp Ogham strokes need dense tessellation. **Mobile:** acceptable only for a _few_ close hero
marks, not a whole inscription. **Complexity:** medium (authoring). **Fit:** reserved for the one or
two closest hero glyphs on the altar where the camera is right on top of them and silhouette matters;
everything else fakes it.

### H. TSL / WebGPURenderer node carve (the future, Phase 2)

The 2025/26 zeitgeist (Maxime Heckel's _Field Guide to TSL and WebGPU_, the Codrops TSL run incl. the
Mar-2025 _WebGPU Scanning Effect with Depth Maps_ which does depth-driven UV displacement = parallax
in TSL) makes `parallaxOcclusion`, `triplanarTexture`, and noise composable nodes that compile to
**both** WGSL and GLSL. With **Safari 26 (Sep 2025) shipping WebGPU on iOS**, this is genuinely where
GAELWORX should go. **Fit for now:** the whole scene is a single `WebGLRenderer` + hand-patched
`MeshPhysicalMaterial`; a `WebGPURenderer` swap is renderer-wide and CI/`qa-route`/SwiftShader assume
WebGL. **Borrow the math (clamped POM loop, blue-noise jitter), ship GLSL today, flag the node
adoption as a Phase-2 deep dive.**

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A three-tier carve, all driven by ONE height source (the doc-24 channel/Ogham SDF + an optional
baked KTX2 height detail), patched into `MeshPhysicalMaterial` via the existing `onBeforeCompile`
chunk-injection:**

1. **Base (all tiers): normal-from-height carving (A).** Derivative bump of the SDF/height drives the
   wall normals so every incision reads as cut, everywhere, for free. This is the floor.
2. **High tier: clamped Parallax Occlusion Mapping (C) + a short self-shadow march.** 8→24 adaptive
   samples (perpendicular→grazing, clamped — _not_ the node's 24→96 desktop defaults), blue-noise
   jitter to kill banding, plus a ~6-step shadow ray toward the dominant light (the molten/AE source)
   so shadow pools in the groove. Gated to the close oblique chambers (altar/contact/pricing) where
   the camera rakes the surface and depth actually reads.
3. **The height source is the SDF, not a heavy texture.** The incision height is `clamp(uChanW -
   abs(sdf), 0, ·)` from doc 24's `gwChannel` (channels) or the Ogham/glyph SDF (doc 12). Optionally
   a single tiny **KTX2 grayscale detail-height map** (chisel-grain inside the groove) adds
   micro-relief POM can't fake — ETC1S, 512², a few KB. **Zero new heavy assets required for v1.**

Why this and not the others, tied to the world + constraints:

- **The Ogham reveal demands real groove shadow, not a lit edge.** The sacred payoff (05 §1, 24 §5)
  is that AE light makes Ogham _readable_. POM's self-shadow is precisely what makes an incision read
  as _depth_ at the oblique altar angle; option A alone flattens there. This is the one place the
  extra per-pixel cost is justified.
- **One height source = automatic cohesion.** Reusing doc 24's `gwChannel` SDF (and doc 12's glyph
  SDF) as the POM height field means the carve, the metal-fill, the over/under, and the Ogham reveal
  all derive from a single distance value — they cannot drift apart. No competing height authoring.
- **POM over relief (D) on mobile.** 2025 surveys: relief mapping costs more for near-identical
  results and its binary search adds branch divergence that mobile GPUs punish. POM's
  layer-interpolation is the better quality-per-ms and is the technique the modern three.js node
  itself implements.
- **Stays inside the proven engine.** Same `onBeforeCompile` + `${GLSL_NOISE}` + `v3(PAL.x)` recipe
  as `ObsidianSlab.jsx`; no second canvas, no EXR, no renderer swap. Buildable and `qa-route`-
  verifiable today (`shader-fx`).
- **Correctly gated.** POM is the budget hog, so it is high-tier + close-chamber only; everything
  else gets the free normal carve. The carve degrades to "lit incision" not "missing incision."

---

## 4. IMPLEMENTATION

### Libraries / versions

- `three` r17x (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`, tangent-space basis.
- `@react-three/fiber`, `@react-three/drei` (in repo) — `<Detailed>` for close-vs-far LOD; `useKTX2`
  / `KTX2Loader` (+ local Basis transcoder) **only if** the optional detail-height map ships.
- `@react-three/postprocessing` (in repo) — bloom catches the AE-lit groove lips, not the carve.
- **No new heavy deps. No EXR.** Optional single 512² ETC1S `.ktx2` detail map, bundled locally
  (`@pmndrs/assets`-style), per the 2026 best-practice "KTX2 stays compressed on the GPU, ~10× VRAM
  vs PNG" rule. Default v1 ships pure-SDF height (zero new bytes).

### The shared master uniforms (the contract — reads, never writes, world state from `src/store.js`)

```js
const uniforms = useMemo(() => ({
  uTime:       { value: 0 },                    // groove churn / shimmer; frozen =2 on static
  uTemp:       { value: 0 },                    // 0..1 global forge heat (SHARED with slab/05/24)
  uCarveDepth: { value: 0.06 },                 // POM scale (groove depth), leva-tunable
  uCarveMin:   { value: 8 },                    // POM samples, perpendicular (mobile-clamped)
  uCarveMax:   { value: 24 },                   // POM samples, grazing  (mobile-clamped, NOT 96)
  uShadowStr:  { value: 0.7 },                  // groove self-shadow strength
  uLightDir:   { value: new THREE.Vector3() },  // dominant light (molten/AE), for the shadow ray
  uAEFirePow:  { value: 0 },                    // divine-fire intensity → groove-lip glow + reveal
  uReveal:     { value: 0 },                    // Ogham reveal floor (route/debug)
  uJitter:     { value: null },                 // optional blue-noise tex (banding break)
  uDetail:     { value: null },                 // optional KTX2 chisel-grain height
}), [])
```

### HEAD — height source + clamped POM + self-shadow (injected after `#include <common>`)

```glsl
uniform float uTime, uTemp, uCarveDepth, uShadowStr, uAEFirePow, uReveal;
uniform float uCarveMin, uCarveMax;
uniform vec3  uLightDir;
${GLSL_NOISE}                       // gw_fbm / gw_snoise — reuse, never re-impl
// gwChannel(uv) -> vec2(signedDist, layer)  comes from doc 24's shared block (shaders.js)
// (or swap in the Ogham/glyph SDF from doc 12; the carve is height-source-agnostic)

// --- HEIGHT: 1.0 = stone surface, 0.0 = groove floor (incision goes DOWN) ---
float gwHeight(vec2 uv){
  float d = gwChannel(uv).x;                 // distance to incision centreline
  float inc = smoothstep(0.0, uCarveDepth, d - 0.0); // 0 deep in groove, 1 on flat stone
  // optional micro chisel-grain inside the groove (KTX2 detail, gated by #ifdef)
  #ifdef HAS_DETAIL
    inc -= (1.0 - inc) * texture2D(uDetail, uv * 6.0).r * 0.25;
  #endif
  return clamp(inc, 0.0, 1.0);               // height field, 0..1
}

// --- clamped POM: march the view ray through the height field in tangent space ---
// vViewDirTS = view dir in TANGENT space (set in vertex hook). Returns parallaxed UV.
vec2 gwPOM(vec2 uv, vec3 vTS){
  float nSteps = mix(uCarveMax, uCarveMin, abs(vTS.z)); // MORE samples at grazing (small vTS.z)
  float dl = 1.0 / nSteps;
  vec2  duv = (vTS.xy / max(abs(vTS.z), 0.2)) * uCarveDepth * dl; // per-step UV march
  float layer = 0.0, h = gwHeight(uv), hPrev = h;
  vec2  uvPrev = uv;
  #ifdef HAS_JITTER
    layer += texture2D(uJitter, gl_FragCoord.xy / 64.0).r * dl;   // blue-noise: break banding
  #endif
  // bounded loop (compile-time max); break when ray dips below the height field
  for(int i = 0; i < 24; i++){                 // 24 = compile-time mobile clamp
    if(float(i) >= nSteps) break;
    layer += dl; uvPrev = uv; uv -= duv; hPrev = h; h = gwHeight(uv);
    if(layer >= h) {
      // linear interpolate the crossing (POM, not relief's binary search)
      float a = h - layer, b = (hPrev - (layer - dl));
      float t = a / (a - b);
      return mix(uv, uvPrev, t);
    }
  }
  return uv;
}

// --- short self-shadow march toward the light: pools shadow in the groove ---
float gwGrooveShadow(vec2 uv, vec3 lTS){
  if(lTS.z <= 0.0) return 1.0;
  float h0 = gwHeight(uv);
  vec2  step = (lTS.xy / max(lTS.z, 0.2)) * uCarveDepth * (1.0/6.0);
  float occ = 0.0, sh = h0;
  for(int i = 1; i <= 6; i++){                  // 6 taps — cheap soft shadow (Tatarchuk-style)
    vec2 su = uv + step * float(i);
    float hs = gwHeight(su);
    sh += uCarveDepth/6.0;                       // ray climbs toward light
    occ = max(occ, (hs - sh) * float(7 - i));    // nearer occluders weigh more (soft)
  }
  return 1.0 - clamp(occ * uShadowStr, 0.0, 1.0);
}
```

### Vertex hook — tangent-space view & light (after `#include <begin_vertex>` / worldpos)

```glsl
// MeshPhysicalMaterial gives tangent/bitangent when the geometry has tangents (USE_TANGENT)
// or compute a TBN from world normal + dFdx(uv). Output view & light in tangent space:
vec3 N = normalize(transformedNormal);
vec3 T = normalize(objectTangent.xyz);          // or derive from dFdx(vUv)
vec3 B = cross(N, T) * objectTangent.w;
mat3 TBN = transpose(mat3(T, B, N));            // world->tangent
vViewDirTS = TBN * normalize(cameraPosition - vWPos);
vLightTS   = TBN * normalize(uLightDir);
```

### NORMAL — carve the walls (after `#include <normal_fragment_maps>`)

```glsl
#ifdef POM
  vec2 uvP = gwPOM(vUv, normalize(vViewDirTS));  // parallaxed UV (high tier)
#else
  vec2 uvP = vUv;                                 // flat: derivative bump still carves
#endif
float gwH = gwHeight(uvP);
// derivative bump from the (parallaxed) height — same dFdx/dFdy idiom as the slab
vec3 gwBmp = vec3(dFdx(gwH), dFdy(gwH), 0.0);
normal = normalize(normal - gwBmp * 2.2);        // walls rake the light; tune strength
```

### COLOR — wall darkening, groove shadow, AE reveal (before `#include <tonemapping_fragment>`)

```glsl
float wallBand = smoothstep(0.0, 0.5, 1.0 - gwH);      // how deep in the groove this pixel is
vec3  stone    = gl_FragColor.rgb;                      // basalt from doc 05 / lit diffuse
vec3  wallCol  = stone * 0.32;                          // recessed walls/floor darker
gl_FragColor.rgb = mix(stone, wallCol, wallBand);

#ifdef POM
  gl_FragColor.rgb *= gwGrooveShadow(uvP, normalize(vLightTS)); // shadow pools in the cut
#endif

// AE divine-fire: white-gold glow on the groove LIP makes the incision catch light = readable.
float lip = smoothstep(0.35, 0.55, gwH) * (1.0 - smoothstep(0.55, 0.85, gwH));
float reveal = clamp(uAEFirePow + uReveal, 0.0, 1.0);
gl_FragColor.rgb += ${v3(PAL.gold)} * lip * reveal * 1.1;   // HDR lip → bloom catches it
gl_FragColor.rgb += ${v3(PAL.ember)} * wallBand * pow(uTemp, 2.0) * 0.3; // hot grooves near metal
```

### r3f component shape

```jsx
export default function CarvedStone({ quality, geometry, heightSource }) {
  const pom = quality === 'high'
  const uniforms = useMemo(() => ({ /* …as above… */ }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a120e'), metalness: 0, roughness: 0.85, envMapIntensity: 0.5,
    })
    m.defines = { USE_UV: '' }
    if (pom) m.defines.POM = ''
    // if (uniforms.uJitter.value) m.defines.HAS_JITTER = ''
    // if (uniforms.uDetail.value) m.defines.HAS_DETAIL = ''
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vViewDirTS; varying vec3 vLightTS; varying vec3 vWPos;`)
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${VERT}`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [pom])
  useEffect(() => () => material.dispose(), [material])
  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    uniforms.uTemp.value = damp(uniforms.uTemp.value, forge.scrollDamped, 3, dt)   // SAME master temp
    uniforms.uAEFirePow.value = damp(uniforms.uAEFirePow.value, forge.aeFire ?? 1.0, 2.4, dt)
    uniforms.uLightDir.value.copy(forge.keyLightDir ?? DEFAULT_KEY) // dominant molten/AE direction
  })
  return <mesh geometry={geometry} material={material} />
}
```

### Key params

| Uniform | Drives | Source |
|---|---|---|
| `uCarveDepth` | groove depth (POM scale) | constant, leva-tunable (~0.05) |
| `uCarveMin/Max` | adaptive sample count perpendicular→grazing | **8/24 mobile** (not 24/96 desktop) |
| `uShadowStr` | groove self-shadow darkness | leva, ~0.7 |
| `uLightDir` | self-shadow + wall raking direction | dominant molten/AE light |
| `uAEFirePow` | groove-lip white-gold glow / Ogham reveal | `forge.aeFire`, dt-damped |
| `uTemp` | hot-groove ember tint near metal | `forge.scrollDamped` (SHARED) |
| `uTime` | groove-floor churn | `clock.elapsedTime`, frozen `=2` static |

---

## 5. COHESION

- **One height source.** The carve consumes doc 24's `gwChannel` SDF (and doc 12's glyph SDF) as its
  height field — it does **not** author a competing one. So the incision the POM marches is the _same_
  incision the metal fills and the over/under uses. This is the contract that keeps depth, fill, and
  weave from drifting.
- **One master temperature.** `uTemp` is the identical `forge.scrollDamped` value the slab reads
  (`ObsidianSlab.jsx:159`) and docs 05/24 read. Hot grooves ember-tint in lockstep with the veins
  glowing — one thermostat.
- **Shared palette, shared bloom contract.** Color is only `PAL` via `v3()` — `PAL.gold` for the AE
  lip, `PAL.ember` for hot grooves, walls = basalt × 0.32. The carve keeps walls/floor **< 1.0 (no
  bloom)**; only the AE groove-lip pushes HDR so the existing `<Bloom luminanceThreshold={0.55}>`
  (`Effects.jsx`) catches the lit lip and nothing else — the "only HDR blooms" rule (`post-fx`). A
  glowing groove would read as lava, not stone; keeping walls dark is what reads as _recessed_.
- **The AE divine fire is the keystone.** `uAEFirePow`/`uLightDir` come from the same A/E letterform
  light docs 05/24 use. The carve's self-shadow and lit lip are the basalt's _response_ to the
  world's brightest source — so the Ogham becoming readable is causal, the shared payoff across docs
  05 §1, 24 §5, and this one.
- **Same material idiom.** `MeshPhysicalMaterial` + `onBeforeCompile` at `<common>` /
  `<normal_fragment_maps>` / `<tonemapping_fragment>`, `m.defines={USE_UV:''}`, `gw_`-namespaced
  shared GLSL, `dispose()` on unmount, dt-damped store uniforms in one `useFrame` — byte-for-byte the
  slab's recipe.
- **Material contrast.** Matte stone (`roughness 0.85`, `envMapIntensity 0.5`) drinks the same cool
  `<Lightformer>` env (`ForgeCanvas.jsx:35-42`) the glossy slab throws back — the contrast that makes
  both read as one lit space.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

POM is the throttle risk in this entire research set — its sample count scales _up_ at grazing
angles, exactly when carved marks are on screen. Discipline:

- **Hard sample clamp: 8→24, never 24→96.** The Three.js Blocks node defaults (24/96) are desktop
  numbers. Compile-time loop bound = 24; `uCarveMin/uCarveMax` = 8/24 on mobile. Early-out the
  instant the ray dips below the height field.
- **Tier contract (mirrors `useQuality` → high|low|static, `forge-scene`):**
  - **high:** `#define POM`, 8→24 adaptive, 6-tap self-shadow, blue-noise jitter, optional KTX2
    detail. `dpr [1,2]`. Gated to close oblique chambers (altar/contact/pricing).
  - **low:** **no POM** — derivative-bump carve only (option A), no shadow march, no detail map. The
    incision still reads as lit-and-cut at every angle but near-perpendicular. `dpr [1,1.4]`.
  - **static / `prefers-reduced-motion`:** freeze `uTime = 2`, derivative bump only, fixed `uReveal`
    floor so Ogham stays legible without live light math; `frameloop='demand'`. The baked-feel poster.
- **Restrict POM draw area.** Only the surfaces that actually carry close carved marks get the
  `POM`-defined material; the big channel-hall floor uses doc 24's flat analytic SDF (top-down, POM
  doesn't read). Never blanket the whole scene in POM.
- **Blue-noise jitter, not more samples.** Banding from few layers is killed by a tiny blue-noise
  offset (the node's own approach) far cheaper than raising sample count — a 64² jitter tex (or a hash
  of `gl_FragCoord`) instead of pushing to 48 samples.
- **One height eval, reused.** `gwHeight` is the SDF (cheap) + optional one texture tap. Compute the
  parallaxed UV once in NORMAL, reuse `uvP`/`gwH` in COLOR and the shadow march — never re-march.
- **KTX2 only, if at all.** The optional chisel-grain detail ships ETC1S 512² `.ktx2` (~10× VRAM vs
  PNG, 2026 best-practice). Set the transcoder path once; bundle locally; **never EXR/HDR** (the
  build's cardinal scar — `fx-resources`). v1 ships pure-SDF (zero new bytes).
- **`<Detailed>` LOD.** Real-geometry carve (option G) only on the 1–2 closest hero glyphs; POM at
  mid distance; derivative-bump far. Don't pay POM for marks smaller than a few pixels.
- **Draw-call budget.** Carved surfaces are few meshes; stay well under the 100-draw-call 60fps
  guideline (2026 best-practice). No transmission/thickness on stone (slab-only features).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations (each step `qa-route`-verifiable; 0 console errors @ 393×852 + 1440×900 ≈ GLSL
compiled under SwiftShader). Then the **iPhone 15 OLED read is mandatory** — groove depth, self-shadow,
and the AE lip do not simulate headless (`shader-fx`, `post-fx`).

1. **Ship the derivative-bump carve FIRST (option A), all tiers.** Prove an incision reads as cut
   from the shared SDF height before adding a single POM sample. This is the floor and the fallback;
   if it isn't convincing, POM won't save it.
2. **Get tangent space right before POM.** POM marches in **tangent space**; the #1 failure is feeding
   it world- or view-space vectors → the carve "swims" the wrong way or shears. Verify the TBN by
   tinting `vViewDirTS` and confirming it tracks the camera. Geometry needs tangents (or derive TBN
   from `dFdx(vUv)`).
3. **Add POM with the loop bounded at compile time (24) and early-out.** A dynamic-length or
   unbounded march tanks mobile and may not compile on some drivers. `if (float(i) >= nSteps) break;`.
4. **Use POM (linear interpolation), not relief (binary search).** Binary search adds branch
   divergence mobile GPUs punish for near-identical quality (2025 surveys). Interpolate the crossing.
5. **Blue-noise jitter before raising samples.** Layer-banding ("stair-step" in the groove) is a
   banding artifact, not a resolution one — jitter the start offset; only then consider more samples.
6. **Self-shadow is what sells the cut at the altar angle.** The lit-wall-only look flattens at
   grazing; the 6-tap shadow ray pooling darkness in the groove is the difference between "line" and
   "incision." Add it before tuning anything cosmetic.
7. **Keep walls DARK, only the lip HDR.** Walls/floor < 1.0 (recessed); only the AE lip exceeds 1.0
   so bloom catches the inscription, not the whole groove. A glowing groove reads as lava (post-fx
   rule). Crushed-black grade will eat anything too timid — tune on-device.
8. **Don't blanket POM.** Gate by tier AND surface AND chamber from day one. Top-down channel-hall =
   flat SDF; close oblique altar/contact/pricing = POM. Retrofitting the gate later is where budgets
   blow.
9. **Hook the right chunk.** Walls/shadow modulate **lit diffuse** — replace at `<color_fragment>` or
   add before `<tonemapping_fragment>` per the slab. The AE lip is the only emissive add. Wrong hook =
   stone glows like the molten metal.
10. **Dispose on unmount; freeze `uTime=2` on static.** The slab's discipline, non-negotiable.

---

## 8. SOURCES (2025–2026)

1. **Three.js Blocks — `parallaxOcclusion` (WebGPU, WebGL) node docs** (2025).
   The canonical modern POM node: `scale` (depth, default 0.05), min 24 / max 96 adaptive samples
   (perpendicular→grazing), optional blue-noise jitter, displaced-UV + depth output, dual WebGPU/WebGL
   target. Our mobile clamp (8→24) and jitter approach derive directly from this.
   https://www.threejs-blocks.com/docs/parallaxOcclusion
2. **bentoBAUX — "Parallax Mapping with Self-Shadowing"** (2025). Current readable implementation of
   steep parallax → POM → **self-shadowing**, normal mapping, roughness/metallic; the self-shadow ray
   and adaptive layer-count-by-angle this doc's groove shadow follows.
   https://bentobaux.github.io/posts/parallax-mapping-with-self-shadowing/
   (repo: https://github.com/bentoBAUX/Parallax-Mapping-with-Self-Shadowing)
3. **R. Hoetzlein — "Projective Displacement Mapping for Ray Traced Editable Surfaces,"** Computer
   Graphics Forum / arXiv 2502.02011 (Feb 2025). State-of-the-art editable carved relief: height-field
   ray-march in offset prisms, smoothed displaced normals, **thin-feature sampling** (the Ogham-stroke
   problem), tight prism bounds. The research frontier we borrow ideas from, not the runtime path.
   https://arxiv.org/abs/2502.02011
4. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025). TSL node materials, surface-detail /
   normal handling, the WebGL+WebGPU dual-target rationale — the Phase-2 node-adoption case.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. **Codrops — "WebGPU Scanning Effect with Depth Maps"** (Mar 31, 2025). Depth-map-driven UV
   displacement (= parallax) in TSL; the modular depth-as-height pattern for the WebGPU/TSL port.
   https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
6. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026). KTX2/Basis (~10×
   VRAM, ETC1S diffuse / UASTC normals), draw-call budget (<100 for 60fps), onBeforeCompile cost,
   `<Detailed>` LOD — the mobile-budget rules this carve obeys.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
7. **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text… with Three.js & TSL"** (Jan 28, 2026).
   MSDF text as a TSL material with selective bloom via MRT — the glyph-SDF-as-height + HDR-lip-only
   bloom-gating reference for carved letterforms.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
8. **Grokipedia — "Parallax occlusion mapping"** (2025 revision). Consolidated 2025 treatment:
   tangent-space ray-march, linear interpolation between depth layers, **relief vs POM perf** (relief
   more expensive, near-identical results), grazing-angle cost scaling, GLSL fragment-shader pipeline.
   https://grokipedia.com/page/Parallax_occlusion_mapping
9. **three.js docs — `KTX2Loader` & TSL** (r17x, 2025/26). Basis Universal transcode (ETC1S vs
   UASTC), transcoder setup; `triplanarTexture` / `parallaxOcclusion` nodes for the future node path.
   https://threejs.org/docs/pages/KTX2Loader.html · https://threejs.org/docs/pages/TSL.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Thin-Ogham-stroke POM correctness.** Ogham is fine parallel strokes — exactly the "thin feature"
   case POM degrades on (samples skip between thin walls, strokes shimmer/disappear at grazing).
   Adopt Hoetzlein's thin-feature sampling / smoothed displaced-normal ideas (or a min-height-along-
   step clamp) so the sacred inscription stays crisp and readable at the altar angle on mobile.
2. **TSL/WebGPU port of the carve.** With Safari 26 iOS WebGPU live, move the clamped POM + self-shadow
   to the composable `parallaxOcclusion` node + a TSL height function sharing the channel SDF; quantify
   the mobile headroom vs the hand-ported GLSL loop and define the WebGL fallback.
3. **The AE divine-fire → groove light-transport model.** A rigorous treatment of how white-gold A/E
   light rakes the groove walls, casts the in-cut shadow, and lights the lip — shared with the
   letterform lighting and docs 05 §1 / 24 §5 — so the Ogham reveal is physically motivated, not faked
   per-route.
4. **Real-geometry vs POM crossover for hero glyphs.** Where (camera distance / silhouette demand) it's
   cheaper to extrude/CSG the 1–2 closest altar glyphs (option G) than to pay grazing-angle POM, and how
   to LOD-blend the geometry carve into the shader carve without a visible pop.
```