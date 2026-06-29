---
name: shader-fx
description: >-
  Write or patch a GLSL material effect in the GAELWORX forge — veins, caustics,
  glow, displacement, transmission, any custom fragment/vertex look. Use when
  adding a shader to a mesh, editing the obsidian/vein look, or building a bespoke
  material for a route. Encodes the onBeforeCompile chunk-injection pattern, the
  shared noise, store-coupled dt-damped uniforms, brand-color inlining, and how to
  verify GLSL compiles.
---

# shader-fx — custom GLSL the GAELWORX way

We don't write raw `ShaderMaterial` from scratch — we **patch a stock `MeshPhysicalMaterial` via
`onBeforeCompile`** so we keep PBR lighting, the env reflection, transmission, and tone mapping, and
just inject our look. Reference implementation: `src/scene/ObsidianSlab.jsx` (the fire-opal veins).

## The injection pattern (three hooks)
In `material.onBeforeCompile = (shader) => { … }`:
1. `Object.assign(shader.uniforms, uniforms)` — wire YOUR uniform objects (keep the same refs so you
   can mutate `.value` each frame).
2. `shader.fragmentShader.replace('#include <common>', '#include <common>\n' + HEAD)` — prepend your
   `uniform`s + GLSL helpers (HEAD block).
3. `.replace('#include <normal_fragment_maps>', '…\n' + NORMAL)` — perturb `normal` for bump/relief
   (the slab does `normal = normalize(normal - gwBmp*uBump)` via `dFdx/dFdy`).
4. `.replace('#include <tonemapping_fragment>', COLOR + '\n#include <tonemapping_fragment>')` — add your
   emissive **before** tone mapping: `gl_FragColor.rgb += fire;`. (For vertex displacement, hook
   `#include <begin_vertex>` similarly.)
Add `m.defines = { USE_UV: '' }` if the material has no map but you need `vUv`. `vNormal` /
`vViewPosition` are available in the physical fragment (use them for fresnel:
`pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 2.0)`).

## Reuse, don't reinvent
- Noise lives in `src/scene/shaders.js` — `GLSL_NOISE` exports `gw_snoise` / `gw_fbm` / `gw_caustic`,
  **`gw_`-namespaced** so they don't collide with three's built-in `permute`/`snoise`. Import and `${GLSL_NOISE}`
  into HEAD; never paste a second noise impl.
- Inline brand colors with `v3(PAL.x)` from `src/scene/palette.js` (e.g. `${v3(PAL.ember)}`). Keep the
  warm forge palette. **HDR (>1) values are intentional** — only they bloom (see `post-fx`).

## Couple it to the journey (and keep it smooth)
Drive uniforms from the shared store in `useFrame`, **dt-damped** — never frame-rate-dependent:
`uniforms.uVeinGlow.value = damp(uniforms.uVeinGlow.value, target, 3, dt)` (`store.js` `damp` =
`THREE.MathUtils.damp`). The slab couples `uPointer`/`uPointerOn` (cursor), `uSurge` (strike), `uTime`,
and reads the per-route preset via `sceneFor(forge.route)`. Freeze `uTime` when `forge.quality==='static'`.

## Perf + lifecycle (non-negotiable)
- **Quality-gate the expensive bits:** transmission/thickness only on `high` (`transmissive` flag);
  cheaper path on low; static freezes time. Honor `useQuality`.
- **Dispose:** `useEffect(() => () => material.dispose(), [material])`.
- Keep loops small (the fbm is 3 octaves); avoid per-pixel branches where you can.

## Verify
`qa-route` — CI uses **SwiftShader (software GL) which actually compiles the GLSL**, so a syntax error
surfaces as a console error. **0 console errors ≈ the shader compiled.** Then read the real look on the
iPhone 15 (transmission, bloom, true-black don't simulate). Live-tune via the `?debug` leva panel.
Cross-refs: `forge-scene` (scene wiring), `post-fx` (the bloom/grade that finishes it), `radial-svg` (2D).
