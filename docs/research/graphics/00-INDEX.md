# 00 — INDEX: GAELWORX Forge-World Graphics Research (Phase 1)

_Annotated index of all 33 Phase-1 broad-sweep docs + the reading order._

> Start with **`00-COHESION-MAP.md`** — the master architecture that fuses these 33 docs into one
> coherent world (the shared temperature/noise/palette/lighting systems and the binding rules). This
> index is the map of the source docs underneath it. All docs live in `phase1/NN-<id>.md`. Every doc
> follows the same shape: §1 Scope · §2 Technique Landscape (2025–26) · §3 Recommended Approach · §4
> Implementation (libs + GLSL + r3f component shape) · §5 Cohesion · §6 Mobile/Perf · §7
> Get-It-Right-First-Time · §8 Sources · §9 Deep-Dive Candidates.

---

## THE FOUR SYSTEM CLUSTERS

The 33 docs group into the systems they feed. The cohesion map fuses them; here is which doc owns what.

### Cluster A — The Master Temperature / Material Core (the spine)
The shared color-science + the substance every other element derives from.

- **[01] molten-metal-surface** — the single most important material: viscous bubbling living metal
  (`gw_warp`+`gw_flow` on `MeshPhysicalMaterial`). Canonical owner of the noise/flow field and a co-owner
  of the temperature ramp. The substance the pour, channels, and letter-fills all are.
- **[02] blackbody-temperature-color** — THE master temperature→color authority. One `gw_tempColor(temp)`
  GLSL function (Planckian-locus hue ordering, brand-anchored stops) + separate `gw_tempEmissive` so one
  knob controls bloom. Owns the spatial/color half; the keystone `gw_divineFire` A/E exception.
- **[03] cooling-solidification** — the temporal spine: per-fragment `age` (seconds since poured) → cooling
  curve, crust skinning, frozen flow ripples, ember veins that never die, the permanent-hot A/E mask. Owns
  the temporal half of the temperature system.
- **[04] emissive-hdr-glow** — emissive-as-light pipeline: push >1, only >1 blooms, `HalfFloatType`
  composer buffer, ACES-does-the-cooling-color-for-free. The system that decides whether metal reads as
  *light* or as bright orange paint.

### Cluster B — Stone, Glass, and Surfaces (the world's body)
The dark mass everything molten is carved into and flows across.

- **[05] basalt-stone-pbr** — green-black Connemara basalt: procedural fbm+triplanar+domain-warp, the
  AE-light-driven serpentine green-reveal, heat-staining near channels. The 60% void, but *living*.
- **[06] forged-iron-pbr** — the terminal cooled-letter skin: anisotropic brushed fire-scale, oxidation
  bloom, ember veins glowing through cracks. The cold end of the temperature ramp made physical.
- **[07] obsidian-glass-material** — evolving the existing `ObsidianSlab` into the world-skin: keep the
  sharp-reflection-over-soft-interior signature, retune toward green-black, demote veins to a heat-gated
  capillary network, make it *receive* the AE/pour light.
- **[23] caustics-refraction-molten** — the under-surface ember caustic the churning metal throws onto
  stone (procedural `gw_caustic`, distance-attenuated, blackbody-tinted), the calm white-gold A/E caustic
  preset, and the fake screen-space refraction *through* glass.

### Cluster C — Flow, Fluid, and the Pour (the metal in motion)
How the metal travels, fills, and reads as alive.

- **[08] realtime-fluid-sim** — the fake-vs-sim decision: fake the macro flow (flow-map + SDF fill),
  simulate only micro turbulence (2D Stable-Fluids heat field) on `high`. MLS-MPM hero pour deferred.
- **[09] flowmap-advection-pour** — the directed pour: baked flow-map two-sample cross-fade advection,
  TubeGeometry falling stream, the `uFill` white-hot front, the cooling temperature it carries.
- **[10] procedural-noise-fire-lava** — the shared `gw_`-namespaced noise toolkit (simplex, fbm+rotation,
  worley, curl, two-level warp) + `GW_FBM_OCTAVES` tier gate. The well every effect drinks from.
- **[15] gpu-particles-sparks-embers** — living sparks orbiting the pour front (GPGPU ping-pong curl-noise,
  heat-attractor), drifting embers, cold ash. Each spark samples the shared temperature ramp.
- **[16] heat-haze-refraction** — air made visible: screen-space UV-warp `Effect`, masked by the same HDR
  luminance bloom keys off, vertical convection bias, `uTemp`-driven.
- **[17] volumetric-smoke-mist** — the breathing forge air: depth-fog haze (always) + fBM smoke banks +
  one bounded raymarch accent at the pour-front (`high`), ember-tinted absorption.

### Cluster D — Type, Knotwork, and the Sacred Reveal (the brand made physical)
The wordmark, the channels, and the Ogham the divine fire reveals.

- **[11] 3d-text-geometry-cinzel** — the GAELWORX wordmark as real poured volume: SVG→SVGLoader→
  ExtrudeGeometry (art-directed letter-play), custom box-projection UVs, the chamfered cast-iron bevel.
- **[12] sdf-msdf-text** — crisp resolution-independent type: pre-baked MSDF for the fillable wordmark
  (layout-U attribute drives the L→R fill), single-SDF for the carved Ogham, `median(rgb)`+`fwidth` AA.
- **[13] per-letter-progressive-fill** — the control rig: per-glyph `fillStart`/`fillDur`/`tempSeed`/`isAE`
  instanced uniforms, thin-fills-fast/thick-slow, scroll-driven cascade, the A/E flag.
- **[14] liquid-fill-letterform** — the hero "wow": rising liquid surface + bubbling meniscus climbing each
  glyph, the seamless channel→letter handoff (shared clock + `smin` bridge droplet).
- **[24] celtic-knotwork-interlace-geometry** — the vascular channels: hand-authored knot → arc-length
  spline strands (parallel-transport framed) → carved SDF groove, strict over/under, four-fork-and-rejoin
  `smin`. Produces the curve data the pour and sparks consume.
- **[25] ogham-carved-stone-text** — the sacred small print: procedural SDF Ogham strokes (stemline + the
  four aicme) cut into basalt, legible only where the AE divine fire rakes the stone.
- **[26] carved-stone-engraving-shader** — the carve *depth*: derivative-bump everywhere + clamped POM +
  self-shadow on `high` close-oblique chambers, so the Ogham reveal reads as a real incision, not a decal.

### Cluster E — Light, Lens, Finish, and Architecture (the cinematic system)
The atmosphere, the camera, the grade, and the renderer the world runs on.

- **[18] volumetric-lighting-godrays** — shafts of light the metal throws into the air: cheap radial-blur
  god-rays from the hot cores + the brighter A/E pair (`high` raymarch), blue-noise dithered.
- **[19] emissive-light-bleed-arealights** — the A/E divine radiance onto stone: in-shader proximity bleed
  (all tiers) + 2 capped RectAreaLights (`high`) + baked emissive-AO. The signature lighting beat.
- **[20] bloom-postprocessing-stack** — the finishing chain: threshold mipmap bloom (palette = selection),
  the load-bearing pass order, half-float buffer, grain-as-OLED-dither.
- **[21] color-grading-tonemapping-oled** — the transfer function + grade: AgX (path-to-white serves the
  divine fire) vs ACES, crushed-black point, the forge-look LUT, triangular dither for void→crimson banding.
- **[22] ibl-procedural-env-noexr** — reflections without EXR: PMREM-baked Lightformer cool-key over a dim
  warm fill (solves the "orange band" scar), `frames={1}`, heat-coupled `envMapIntensity`.
- **[27] scroll-camera-paths-r3f** — travel-not-cuts: CatmullRomCurve3 journey sampled by arc-length at
  `scrollDamped`, Lenis input (one rAF), look-ahead down the flow, journey↔chamber blend.
- **[28] cinematic-camera-dof** — the lens: DOF via `worldFocusDistance` locked to the pour-front,
  per-route fov + finale dolly-zoom, particle-CoF ember bokeh, the descend-to-eye-level reveal.
- **[29] mobile-3d-performance-budget** — the hard envelope: ~9–10 ms iPhone-15 design target, the four
  fill-rate levers (DPR/bloom-res/octaves/overdraw), the `TIERS` table + `PerformanceMonitor` ladder. The
  gatekeeper for docs 01–28.
- **[30] webgpu-tsl-modern-threejs** — the renderer/authoring decision: ship WebGL2+GLSL for the judge,
  author TSL-portable, gate WebGPU/TSL/compute as a post-judge upgrade. Binds the substrate for all docs.
- **[31] single-renderer-multiworld-arch** — one Canvas hosting 8+ chambers via damped preset swaps + the
  Master Forge Uniform pool (`U`) + mount/dispose discipline + decoupled Suspense. The scene-graph spine.
- **[32] reference-awwwards-avatar-web3d** — the *bar*: teardown of Active Theory / Lusion / Unseen /
  Immersive Garden, the seven transferable "steals" (cohesion lock, HDR-keyed bloom, fresnel rim, glowing
  sweep band, blue-noise god-ray, choreography, grain-as-film-stock).
- **[33] perpage-worlds-water-gem-plinths** — the bespoke chambers as configs: scrying-pool water, jewel
  dispersion, four-plinths staging, forge-mouth arch — each "the forge through a different aperture,"
  binding the shared `uHeat`.

---

## READING ORDER

**If you read nothing else:** `00-COHESION-MAP.md`, then [02], [01], [03], [31]. Those five are the spine —
the master temperature system, the substance, the cooling clock, and the single-renderer architecture that
ties it together.

**Full first-pass order (systems before consumers):**

1. **`00-COHESION-MAP.md`** — the synthesis. Read first, always.
2. **The spine:** [02] blackbody → [01] molten → [03] cooling → [04] emissive-HDR. The temperature system
   and the material it drives. Everything downstream samples these.
3. **The architecture:** [31] single-renderer → [29] perf-budget → [30] webgpu/tsl → [10] noise-toolkit.
   The renderer, the envelope it must fit, and the shared noise well. (Read [29] *before* any technique doc
   — it's the gatekeeper.)
4. **The surfaces:** [07] obsidian → [05] basalt → [06] forged-iron → [23] caustics. The world's body.
5. **The flow:** [08] fluid-decision → [09] pour → [15] sparks → [16] heat-haze → [17] smoke. The metal in
   motion and the air it moves through.
6. **The type + sacred reveal:** [11] cinzel-geometry → [12] sdf-msdf → [13] progressive-fill → [14]
   liquid-fill → [24] knotwork → [25] ogham → [26] carved-engraving. The wordmark, the channels, the lore.
7. **The cinema:** [22] ibl-env → [19] AE-radiance → [18] god-rays → [20] bloom → [21] grade → [27]
   camera-path → [28] dof. The lighting, the lens, the finish.
8. **The bar + the chambers:** [32] reference-scan → [33] per-page-worlds. What world-class looks like and
   the eight apertures.

**By role:**
- *Shader/material engineer:* [02][01][03][04][10] → [05][06][07][23] → [12][13][14][24][25][26].
- *Pipeline/architecture:* [31][29][30] → [27][33] → [22].
- *Lighting/post/finish:* [04][20][21][22][19][18][16][17][28].
- *Motion/camera:* [27][28] → [03][13] → [32] (choreography steal).
- *The single beat that defines the brand* (the A/E divine fire revealing the Ogham): [02 §1.4][19][25][26]
  [05 §green-reveal][09 §A/E][12][13][14] — all express the *same* keystone, read them together.

---

## CONVENTIONS SHARED ACROSS ALL 33 DOCS

- **One renderer, one `<Canvas>`, one composer, one `useFrame` writer, one `Points` system.** Never a
  second context. (`forge-scene` skill.)
- **`onBeforeCompile` chunk injection** on `MeshPhysicalMaterial` at `#include <common>` (HEAD) /
  `<normal_fragment_maps>` (NORMAL) / `<tonemapping_fragment>` (COLOR, emissive add) — or `<color_fragment>`
  for *lit* (not emissive) surfaces like basalt/Ogham. (`shader-fx` skill.)
- **`gw_`-namespaced** shared GLSL; **`PAL` via `v3()`** inlining (no raw hex); **`dt`-damped** uniforms via
  `THREE.MathUtils.damp` (never `lerp(a,b,k)`, never a second rAF); **`dispose()`** on unmount.
- **Only HDR (>1) blooms** — the palette reserves the 10% accent for it. (`post-fx` skill.)
- **No runtime EXR/HDR loads** — procedural env only. (`forge-scene` / `fx-resources`.)
- **Three tiers** `high|low|static`, gated from the mutable `forge.quality`; `static` freezes `uTime`,
  unmounts `Effects`, `frameloop='demand'`, and must read on-brand.
- **Verify path:** `npm run build` → `qa-route` (0 console errors = GLSL compiled under SwiftShader) → the
  iPhone 15 OLED read (bloom/true-black/saturation/divine-fire don't simulate headless).
- **Sources are 2025–2026.** Pre-2025 canon (IQ domain-warping, Bridson curl, Ashima simplex, ATI POM,
  Mitchell god-rays) is cited only through the 2025–26 work that re-derives it.

---

## WHAT PHASE 1 DELIBERATELY DEFERRED (→ Phase 2)

Every doc's §9 logs deep-dive candidates; the deduplicated, prioritized Phase-2 plan is the separate
deliverable. The recurring deferrals across all 33: the **WebGPU/TSL migration** (renderer + post rewrite,
gated on iOS-Safari stability), **GPGPU/compute** for sparks and fluid (the real reason to *want* WebGPU),
**MRT-emissive bloom** (cleaner than threshold bloom), the **live GPGPU fill field** + **MRT temperature
buffer** (data-driven branching pour vs the UV-x ramp), **arc-length-baked knot** correctness, **POM /
thin-feature** fidelity for the carve, the **tone-map look-dev A/B** (AgX vs ACES vs custom on device),
**HDR/P3 canvas output**, and the **baked-field discipline** (ramp + flow-map as textures). Plus the
world-defining beat that nearly every doc points at: the **unified AE-divine-fire → stone light-transport
model** that makes the green-reveal, the Ogham legibility, and the A/E bloom *one* causal lighting event.
