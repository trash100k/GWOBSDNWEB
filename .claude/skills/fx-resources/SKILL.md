---
name: fx-resources
description: >-
  A curated library of repositories and sites for 3D assets, shaders, and visual
  effects — for react-three-fiber / three.js work. Use when you need a helper,
  an effect reference, a model/HDRI/texture, GLSL to learn from or reuse, or
  inspiration. Includes the GAELWORX-specific caveats (no runtime EXR, bundle via
  @pmndrs/assets, the perf budget, the warm-forge palette) so picks fit this build.
---

# fx-resources — where to get 3D assets, shaders & effects

Curated, stable resources for R3F/three.js effect work. **Check each asset's license before shipping**
(prefer CC0 / MIT). Then fit it to this project via the caveats at the bottom.

## react-three-fiber / three.js ecosystem (libraries)
- **R3F** — github.com/pmndrs/react-three-fiber · docs: docs.pmnd.rs
- **drei** (helpers: `Environment`, `Lightformer`, `MeshTransmissionMaterial`, `Float`, `Caustics`, etc.)
  — github.com/pmndrs/drei
- **postprocessing** + **react-postprocessing** (Bloom, etc., used in `Effects.jsx`)
  — github.com/pmndrs/postprocessing · github.com/pmndrs/react-postprocessing
- **maath** (easing, `damp`, random/buffer helpers) — github.com/pmndrs/maath
- **@pmndrs/assets** (bundled HDRI/texture presets — **the right way to ship an env here**)
  — github.com/pmndrs/assets
- **gltfjsx** (GLTF → JSX components) — github.com/pmndrs/gltfjsx
- **react-three-rapier** (physics) — github.com/pmndrs/react-three-rapier
- **three.js** core + examples — threejs.org · threejs.org/examples · github.com/mrdoob/three.js
- **Poimandres market** (drei-ready assets/components) — market.pmnd.rs

## Shaders — learn + reuse
- **The Book of Shaders** (learn GLSL from zero) — thebookofshaders.com
- **Inigo Quilez** (noise, SDFs, raymarching, the canonical reference) — iquilezles.org/articles
- **Shadertoy** (huge gallery; study/adapt, mind licenses) — shadertoy.com
- **lygia** (reusable, includable GLSL: noise/sdf/color/filters) — lygia.xyz · github.com/patriciogonzalezvivo/lygia
- **Maxime Heckel's blog** (excellent R3F + shader deep-dives) — blog.maximeheckel.com
- *(In-repo: `src/scene/shaders.js` already has `gw_`-namespaced simplex + fbm + caustic — reuse it, see `shader-fx`.)*

## 3D models
- **Khronos glTF Sample Assets** (clean reference models) — github.com/KhronosGroup/glTF-Sample-Assets
- **Quaternius** (CC0 low-poly packs) — quaternius.com
- **Kenney** (CC0 game assets) — kenney.nl
- **Sketchfab** (massive; filter by Downloadable + license) — sketchfab.com
- Inspect/optimize: **gltf.report** · three-gltf-viewer — github.com/donmccurdy/three-gltf-viewer

## HDRIs, textures, materials
- **Poly Haven** (CC0 HDRIs, textures, models — the gold standard) — polyhaven.com
- **ambientCG** (CC0 PBR textures + HDRIs) — ambientcg.com

## Effects, demos & inspiration
- **Codrops** (creative WebGL/R3F tutorials + demos) — tympanus.net/codrops
- **R3F examples** — docs.pmnd.rs (Examples) · github.com/pmndrs/react-three-fiber (examples)
- **Three.js Journey** (Bruno Simon — the definitive course; paid) — threejs-journey.com
- **Awwwards** (immersive site inspiration) — awwwards.com

## GAELWORX caveats (make a pick fit THIS build)
- **No runtime EXR/HDR loads.** A file-loaded environment black-canvas'd us — the env is built from drei
  `<Lightformer>`s in their own Suspense, slab decoupled. Use Poly Haven HDRIs as *reference* or bundle
  via `@pmndrs/assets`, not a remote `.exr`/`.hdr` at runtime. (See `forge-scene`.)
- **One renderer, perf budget.** No second `<Canvas>`; 3D is lazy + content-first; quality tiers
  (`high|low|static`) and `dispose()` on unmount. Heavy models → decimate (gltfjsx/gltf.report) + draco.
- **Warm-forge palette only** (`PAL`, 60/30/10); reserve HDR (>1) for the 10% so bloom stays controlled
  (see `post-fx`). 0px-corner brutalism for any UI chrome (see `brand-check`).
- **Verify** every effect via `qa-route` (SwiftShader compiles GLSL → 0 console errors ≈ it compiled) +
  the iPhone 15 read. Cross-refs: `shader-fx`, `post-fx`, `forge-scene`.
