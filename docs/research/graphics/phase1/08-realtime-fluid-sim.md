# 08 — Real-Time Fluid Simulation vs Faked Fluid (the GAELWORX Pour)

*Phase 1 graphics research · target build: Vite + React + react-three-fiber + three.js · primary judge device: iPhone 15 OLED*

---

## 1. SCOPE

In the GAELWORX world the **pour** is the single most important moving element: living molten metal
released from the stone forge-ALTAR, running down **Celtic interlace channels** carved into
green-black Irish basalt, branching and rejoining, and finally **filling the GAELWORX letterforms
left-to-right**. The metal must read as *alive* — bubbling, viscous, churning, hot at the leading
edge and cooling behind it through the master temperature gradient (white-hot → ember → forge-red →
iron-black with deep veins), with **living sparks** orbiting the heat of the pour front and **heat
shimmer** distorting the void above it. This document answers one question only: **do we run an
actual fluid solver, or do we fake directed flow** — and exactly where the line is, given a strict
mobile perf budget, true-black OLED rendering, and the existing single-renderer obsidian forge this
must slot into without looking bolted-on. The pour is *the* hero motion of the casting-room and
channel-hall chambers; everywhere else (veins, embers) is already faked and must stay that way.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

The honest spectrum runs from "full Navier–Stokes solver on the GPU" down to "a scrolling texture
with a flow map." 2025 is a genuine inflection year because **WebGPU shipped in Safari 26 / iOS 26
(Sept 2025)** and **three.js r171 made `WebGPURenderer` production-ready with automatic WebGL2
fallback** ([utsubo, 2026‑01‑10](https://www.utsubo.com/blog/threejs-2026-what-changed);
[Heckel, 2025‑10‑14](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)). That
moves real compute-based fluid from "desktop-only stunt" to "plausible on a current iPhone" — but
only barely, and only if you respect the budget.

### A. MLS-MPM (Moving Least Squares Material Point Method) — WebGPU compute
The current state of the art for *real-time* fluid on the web. Matsuoka's WebGPU-Ocean / WaterBall
hit **~100k particles on integrated graphics and ~300k on a mid GPU**, using a Particle-to-Grid
(P2G) stage with `atomicAdd` and only ~2 sim steps/frame, rendered with **screen-space fluid
rendering** ([Codrops, 2025‑02‑26](https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/);
[80.lv, 2025‑01‑13](https://80.lv/articles/check-out-this-real-time-3d-fluid-simulation-implemented-in-webgpu)).
holtsetio's `flow` ([github, created 2025‑04‑01](https://github.com/holtsetio/flow)) ports this to
the **three.js `WebGPURenderer`** directly — proof it composes with our stack.
*Quality:* superb, genuinely viscous/jello-like. *Perf:* the matsuoka demo runs on a 6-year-old
iPad Air 3 only with particles set to "small." *Mobile:* viable on iOS 26 but eats the whole frame
budget; nothing else heavy can share it. *Complexity:* high (compute kernels, atomics, grid
allocation).

### B. PIC/FLIP — hybrid particle/grid
The classic hybrid (David Li's *Fluid Particles*). Cheaper than full SPH neighborhood search,
splashier than MPM, but FLIP is **noisy/energetic** — great for splashing water, *wrong* for the
heavy, slow, viscous lava we want. 2025 coverage treats it as the predecessor MLS-MPM improved on
([Codrops, 2025‑02‑26](https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/)).
*Verdict:* wrong material feel for molten metal.

### C. SPH (Smoothed Particle Hydrodynamics)
Pure particle method. The 2025 consensus is that **neighborhood search is the bottleneck** and
MLS-MPM is "significantly faster" for the same particle count
([Codrops, 2025‑02‑26](https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/)).
If you want particles, MPM dominates SPH in 2025. *Verdict:* superseded.

### D. 2D Stable Fluids / GPU Navier–Stokes (Stam, on ping-pong textures)
The Jos Stam "Stable Fluids" pipeline: **semi-Lagrangian advection → divergence → Jacobi pressure
solve → gradient subtraction**, all as fragment shaders ping-ponging between double-buffered
framebuffers. Pavel Dobryakov's WebGL-Fluid-Simulation is the canonical implementation, and 2025
write-ups break the steps down cleanly ([Stefanishyna, *Fluid Simulation in WebGL: The Advection
Step*](https://ostefani.dev/tech-notes/webgl-fluid-advection); [marvyn.com, *Understanding Fluid
Simulation*](https://marvyn.com/blog/fluid-simulation.html)). This is **2D**, runs in plain WebGL2
(no WebGPU needed), and is *cheap* if the grid stays small (e.g. 256² with 20–30 Jacobi iterations).
*Quality:* gorgeous as a 2D velocity/dye field — exactly the look of smoke, heat-haze, and a
*top-down* molten flow. *Perf:* tunable; the pressure solve is the cost (iteration count × grid²).
*Mobile:* fine at modest resolution. *Complexity:* moderate, very well-trodden.

### E. Flow-map / characteristic-map fakery (directed texture advection)
A **flow map** is a texture whose RG channels encode a 2D direction field; you scroll a noise/lava
texture *along* that field, blending two phase-offset samples to hide the reset seam, and modulate
with fbm for turbulence — the standard "lava that flows down a specific channel" trick. 2025 sources
confirm the modern recipe is *two or more textures scrolling at different speeds/directions, blended
by a noise mask* for non-repeating turbulent motion ([Silphium Design, *Free Lava Flow Animation
Assets*, 2025](https://silphiumdesign.com/free-lava-flow-animation-assets-game-dev-vfx/)). The
academic backbone — characteristic/flow-map advection — is still active research in 2025
([arXiv 2505.21946, *Fluid Simulation on Vortex Particle Flow Maps*,
2025‑05](https://arxiv.org/abs/2505.21946)). *Quality:* directed, art-directable, reads as flowing
lava — but it doesn't *simulate*, so no emergent splashing/pooling. *Perf:* nearly free (a few
texture samples). *Mobile:* trivial. *Complexity:* low. **This is what our existing veins already
do** (`gw_fbm` domain-warp in `ObsidianSlab.jsx`).

### F. SDF / metaball "fake viscosity" + procedural shading
Pour front as a signed-distance blob whose isosurface advances along a spline (the channel path),
shaded with the temperature gradient and a thresholded fbm for bubbling. No solver — just a moving
threshold. Reads as viscous filling. Cheap; fully art-directable; the natural fit for the
**letterform fill** (a left-to-right fill mask is literally an animated SDF/threshold).

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Fake the macro flow; simulate only the micro turbulence — and only on the high tier, in 2D.**

Concretely, a **three-layer hybrid**, ordered cheapest-first:

1. **Directed flow-map advection (E) is the spine of the pour.** The channels are *authored* Celtic
   interlace — the metal must follow them exactly, branch and rejoin on cue, and fill letters
   left-to-right on a timeline. That is a **directed, art-directed** motion; a real solver would
   fight you for control and cost 10× more. A flow map baked from the channel geometry gives us
   pixel-perfect routing for free. This is also **continuous with the existing veins** — same
   `gw_fbm` domain-warp, same palette, so the pour and the obsidian read as one material system.

2. **A small 2D Stable-Fluids field (D) drives heat-haze + spark advection + surface churn**, *high
   tier only*. A 128²–256² velocity field, injected with upward buoyancy at the (faked) pour front,
   gives genuinely emergent shimmer and makes sparks orbit heat *for real* rather than on canned
   sine paths. This is the one place a real solver earns its cost: **turbulent air and spark
   transport are exactly what fakery looks worst at**, and 2D Stam is cheap.

3. **SDF/threshold fill (F) for the letterforms and the leading bubble front.** The white-hot edge
   is a moving threshold on the flow-map dye; the cooling trail behind it is the master temperature
   `t` falling off with distance-behind-front. The A/E "divine fire" letters simply never let their
   threshold cool — `uTemp = 1.0` forever for those glyphs.

**Why not full MLS-MPM (A)?** It is the most impressive but the wrong trade *here*: (a) it wants the
whole frame budget, leaving nothing for bloom + the obsidian slab + sparks on an iPhone 15; (b) it
requires `WebGPURenderer`, which means a second render path and a WebGL2 fallback we'd have to build
*anyway* — and the fallback would have to look identical, so we'd be building the faked version
regardless; (c) emergent splashing is *off-brand* — GAELWORX is **directed, sacred, inevitable**
("Automatic Execution"), not chaotic. We keep MLS-MPM as a **Phase-2 deep-dive** for a possible
hero moment (the altar pour) on capable devices, behind a tier gate — never as the baseline.

This keeps us inside the existing **WebGL2 single-renderer** architecture (`ForgeCanvas.jsx`), the
`onBeforeCompile` chunk-injection pattern (`shader-fx`), and the quality tiers — buildable today,
not blocked on a renderer rewrite.

---

## 4. IMPLEMENTATION

**Libraries / versions.** Stay on the current stack: `three` (r17x), `@react-three/fiber`,
`@react-three/drei`, `@react-three/postprocessing`. No new sim library needed for the recommended
path — the flow map and SDF fill are GLSL injected via `onBeforeCompile` exactly like the veins; the
optional 2D fluid uses **drei's `useFBO`** for ping-pong targets. (Reserve `three/webgpu` +
`WebGPURenderer` + TSL strictly for the Phase-2 MLS-MPM experiment; per
[Heckel 2025‑10‑14](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/), TSL can
target WebGL2 too, so a future port is non-destructive.)

### 4a. The pour material (flow-map advection + temperature) — GLSL, injected
Reuse `GLSL_NOISE` and `PAL` exactly as `ObsidianSlab.jsx` does. The flow map `uFlow` is a baked
texture (RG = channel direction, B = arc-length 0→1 along the channel, A = channel mask).

```glsl
// HEAD additions
uniform sampler2D uFlow;   // RG=dir, B=arcLength, A=channelMask
uniform float uFront;      // 0..1 leading edge of the pour along arc-length (the timeline)
uniform float uTime;
uniform float uTempGrad;   // master cooling rate behind the front
${GLSL_NOISE}

// flow-map advection: scroll two phase-offset noise samples ALONG the field
float gwPour(vec2 uv, out float temp, out float filled){
  vec4 fl = texture2D(uFlow, uv);
  vec2 dir = fl.rg * 2.0 - 1.0;
  float arc = fl.b;                       // position along the channel
  float mask = fl.a;
  // two scrolling phases blended to hide the reset seam (Silphium 2025 recipe)
  float ph   = fract(uTime * 0.18);
  vec2  off  = dir * 0.35;
  float a = gw_fbm(uv*3.0 - off*ph          + arc*4.0);
  float b = gw_fbm(uv*3.0 - off*fract(ph+0.5) + arc*4.0);
  float churn = mix(a, b, abs(ph - 0.5)*2.0);
  // has the front passed this point? (left-to-right / down-channel fill)
  filled = smoothstep(uFront, uFront - 0.04, arc) * mask;
  // temperature: white-hot AT the front, cooling with distance behind it
  float behind = clamp(uFront - arc, 0.0, 1.0);
  temp = clamp(1.0 - behind * uTempGrad, 0.0, 1.0) * filled;
  temp += churn * 0.15 * filled;          // bubbling jitters the temp
  return filled;
}
```

```glsl
// COLOR additions — the MASTER temperature gradient (shared by every chamber)
vec3 gwTempColor(float t){            // t: 0 iron-black -> 1 white-hot
  vec3 c = mix(${v3(PAL.void)},   ${v3(PAL.crimsonDeep)}, smoothstep(0.05,0.30,t));
  c = mix(c, ${v3(PAL.red)},   smoothstep(0.30,0.55,t));
  c = mix(c, ${v3(PAL.ember)}, smoothstep(0.55,0.80,t));
  c = mix(c, ${v3(PAL.hot)},   smoothstep(0.80,1.00,t)); // HDR core -> blooms
  return c;
}
// in main:
float temp, filled;
gwPour(vUv, temp, filled);
vec3 metal = gwTempColor(temp);
gl_FragColor.rgb += metal * filled;   // emissive, BEFORE tonemapping (post-fx bloom rule)
```

### 4b. The A/E divine-fire override
The letterform geometry carries a per-glyph `uDivine` flag (1.0 for the first A and first E of the
word, per the brand A+E ignite rule). When set, **clamp temp to white-gold and never cool**, and
add a rim that radiates onto adjacent stone (drives the Ogham-reveal light):

```glsl
if (uDivine > 0.5){
  temp = 1.0;                                   // eternal white-hot
  vec3 divine = mix(${v3(PAL.hot)}, vec3(1.9,1.7,1.2), 0.5); // white-GOLD, HDR
  gl_FragColor.rgb += divine * (0.8 + 0.2*sin(uTime*1.3));    // breathing glow
}
```

### 4c. Optional 2D Stable-Fluids field (high tier only) — r3f component shape
```jsx
function HeatField({ enabled }) {
  const a = useFBO(256, 256, { type: THREE.HalfFloatType })
  const b = useFBO(256, 256, { type: THREE.HalfFloatType })
  const ping = useRef([a, b])
  // passes: advect -> addBuoyancyAtFront -> divergence -> jacobi(x20) -> subtractGradient
  useFrame((_, dt) => {
    if (!enabled) return
    const t = Math.min(dt, 1/30)               // clamp dt — sim must not explode on a stall
    runFluidPasses(ping.current, { dt: t, front: forge.pourFront, iters: 20 })
    forge.heatVelTex = ping.current[0].texture  // sparks + haze sample this
  })
  return null
}
```
The velocity texture feeds two consumers: **(1)** the `Embers`/spark shader replaces its canned
`sin/cos` drift with `texture2D(uHeatVel, …)` so sparks are *advected by the heat*; **(2)** a
heat-shimmer post pass offsets UVs by the velocity field above the pour.

### Key uniforms / parameters (all dt-damped via `store.js:damp`, never frame-rate `lerp`)
| Uniform | Source | Meaning |
|---|---|---|
| `uFront` | `forge.pourFront` (scroll/timeline) | leading edge along the channel, 0→1 |
| `uTempGrad` | `sceneFor(route)` | how fast metal cools behind the front |
| `uDivine` | per-glyph attribute | A/E eternal white-gold |
| `uHeatVel` | `forge.heatVelTex` | 2D fluid velocity (high tier) → sparks + shimmer |
| `uTime`/`uSurge` | shared store | churn animation + strike pulses (reuse existing) |

`forge.pourFront` is set in the existing `useFrame`/scroll handler and **damped** — navigation
re-tempers the pour smoothly, matching how `uVeinGlow`/`uIrid` already damp toward `sceneFor(route)`.

---

## 5. COHESION

Nothing here is a new visual system — it is the **same material engine** the obsidian slab already
runs, extended:

- **Palette.** Every color comes from `PAL` (`palette.js`) inlined via `v3()`. The pour's gradient is
  literally `PAL.void → crimsonDeep → red → ember → hot`; the obsidian veins already span
  `crimson → ember → hot`. Same 60/30/10 warm forge set, so the pour and the slab are one metal.
- **The HDR/bloom contract.** Only `PAL.hot`/`emberHot` (>1) values are emissive-above-1, so **only
  the white-hot front and the A/E divine fire bloom** through `Effects.jsx`
  (`luminanceThreshold 0.55`). The cooling iron-black tail correctly does *not* bloom — exactly the
  `post-fx` "only HDR blooms" rule. We never touch bloom intensity.
- **Shared temperature `t`.** `gwTempColor(t)` is the **master function** every chamber imports: the
  veins, the pour, the letterform fill, and the ember color all map a single 0→1 temperature to the
  same ramp. That's what makes it a world and not eight effects — one dial drives all heat.
- **Sparks.** `Embers.jsx` already emits warm additive points; we only swap its drift term to sample
  `uHeatVel` so they orbit the *actual* pour front. Same geometry, same additive blend, same color.
- **Basalt + Ogham.** The channels are carved into the slab's normal/relief (the existing `NORMAL`
  `dFdx/dFdy` bump path); the A/E divine rim writes extra light into the fragment, brightening
  adjacent stone so carved Ogham crosses the legibility threshold — the radiance is the *same*
  HDR emissive that blooms, so the reveal and the glow are physically one thing.
- **Motion law.** Pour advance is **Atmospheric Drift** (slow constant velocity, dt-driven); a new
  headline/strike fires the existing `uSurge` pulse (**Brutalist Snap** — `Math.exp(-since*3)`),
  reusing `forge.strikeAt`. No bounce, ever.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 OLED budget)

The three tiers from `useQuality` map directly onto the three layers:

- **`high`:** flow-map pour + SDF fill + **2D fluid heat field (256²)** + advected sparks + heat
  shimmer + full `Effects`. dpr `[1,2]`. This is where the real-sim earns its place.
- **`low`:** flow-map pour + SDF fill + sparks on canned drift, **no fluid field, no shimmer pass**.
  dpr `[1,1.4]`. Visually 90% there — the macro flow is identical; only the emergent micro-turbulence
  is gone.
- **`static` (prefers-reduced-motion / low-power):** `uTime` frozen (`= 2` like the slab), pour
  rendered at a *fixed* `uFront` (a finished cast), `frameloop='demand'`, `Effects` not mounted. The
  letters read as a solid cooled cast with A/E still glowing — a perfectly good poster.

**Budget tactics:**
- The 2D fluid grid is the only real cost; keep it **≤256², HalfFloat, ~20 Jacobi iters**, and run
  it `high`-only. **Clamp `dt`** (`Math.min(dt, 1/30)`) so a scroll-stall or tab-blur can't blow the
  solver up — the #1 fluid-sim crash.
- The flow map is a **baked texture** — zero runtime sim cost, just samples. Bake it offline from the
  channel spline (no runtime EXR — honor the no-file-env rule; ship it as a small PNG/KTX2).
- Reuse the **single renderer / single rAF**. No second `<Canvas>`, no second `requestAnimationFrame`
  — the fluid passes run inside the existing `useFrame`.
- **WebGPU is the future, not the floor.** iOS 26 has WebGPU, but iPhone 15s on iOS < 26 and the ~5%
  WebGL-only tail still exist; three.js auto-falls-back ([utsubo 2026‑01‑10](https://www.utsubo.com/blog/threejs-2026-what-changed)).
  We build on WebGL2 so *every* device gets the pour; WebGPU MLS-MPM is an additive Phase-2 bonus.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations (each step verified via `qa-route`: build green + 0 console errors at 393×852 &
1440×900 — SwiftShader compiles the GLSL, so a shader typo throws):

1. **Master temperature function first.** Implement and unit-read `gwTempColor(t)` as a standalone
   ramp on the slab before any motion. If the ramp is wrong, *everything* downstream is wrong. Verify
   on the **OLED device** — the iron-black tail and white-hot front depend on true-black, which
   doesn't simulate headless (`forge-scene` law).
2. **Bake + wire the flow map** and prove the pour follows the channels at a *static* `uFront`. Get
   routing pixel-perfect before animating.
3. **Animate `uFront`, dt-damped**, through the existing store. Confirm left-to-right letter fill and
   smooth re-temper on nav (mirror `uVeinGlow` damping).
4. **A/E divine override** — verify *only* the first A and first E per word stay white-gold (brand
   `brand-check`), and that their rim brightens adjacent stone (Ogham reveal).
5. **Only now** add the 2D fluid field, `high`-only, with **clamped dt**. Validate it degrades
   cleanly to `low`/`static`.

**Pitfalls that bite on the first build:**
- **Bloom washout.** If the whole pour blooms, you pushed the *cooling tail* above 1. Only `PAL.hot`
  may exceed 1 — keep the tail ≤1 (`post-fx` rule). Never fix it with bloom intensity.
- **Flow-map seam.** A single scrolling sample shows a hard reset line; the two-phase blend
  (4a, [Silphium 2025](https://silphiumdesign.com/free-lava-flow-animation-assets-game-dev-vfx/)) is
  mandatory, not optional.
- **Sim explosion on stall.** Unclamped `dt` after a tab-blur NaNs the velocity texture → black or
  full-white screen. Clamp `dt`; consider freezing the sim when `document.hidden`.
- **Material feel.** FLIP/splashy water is the wrong instinct — molten metal is **heavy, slow,
  viscous**. Bias every parameter (low advection speed, high churn-but-low-velocity) toward sluggish.
- **Don't reach for WebGPU to "do it properly."** It forces a second render path + a fallback you'd
  build anyway; ship the WebGL2 fake first, treat MLS-MPM as Phase-2 dessert.

---

## 8. SOURCES (2025–2026)

1. matsuoka-601, *WebGPU Fluid Simulations: High Performance & Real-Time Rendering* — Codrops,
   **2025‑02‑26**. https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/
   (MLS-MPM vs SPH vs FLIP vs grid; ~100k iGPU / ~300k mid-GPU particles; screen-space rendering;
   runs on iPad Air 3 at "small").
2. *This MLS-MPM 3D Fluid Simulation Runs In Your Browser* — 80.lv, **2025‑01‑13**.
   https://80.lv/articles/check-out-this-real-time-3d-fluid-simulation-implemented-in-webgpu
   (P2G `atomicAdd`, 2 sim steps/frame, NVIDIA neighborhood search + screen-space rendering).
3. holtsetio, *flow — realtime MLS-MPM in the three.js WebGPURenderer* — GitHub, created
   **2025‑04‑01**. https://github.com/holtsetio/flow (proof MLS-MPM composes with three.js
   `WebGPURenderer`).
4. Maxime Heckel, *Field Guide to TSL and WebGPU* — **2025‑10‑14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (WebGPU in iOS 26/Safari 26;
   TSL compute shaders for particles; TSL targets WebGL2 *and* WebGPU from one source).
5. Utsubo, *What's New in Three.js (2026): WebGPU, New Workflows & Beyond* — **2026‑01‑10**.
   https://www.utsubo.com/blog/threejs-2026-what-changed (WebGPU baseline across all browsers incl.
   iOS Sept 2025; r171 `three/webgpu` zero-config + automatic WebGL2 fallback).
6. Olha Stefanishyna, *Fluid Simulation in WebGL: The Advection Step* — ostefani.dev (2025 tech-note)
   . https://ostefani.dev/tech-notes/webgl-fluid-advection (semi-Lagrangian advection + ping-pong
   buffers, the 2D Stable-Fluids pipeline).
7. Silphium Design, *The Ultimate Guide to Free Lava Flow Animation Assets* — **2025**.
   https://silphiumdesign.com/free-lava-flow-animation-assets-game-dev-vfx/ (modern flow-map lava
   recipe: 2+ textures, differing speeds/dirs, noise-blended for turbulence).
8. *Fluid Simulation on Vortex Particle Flow Maps* — arXiv 2505.21946, **2025‑05**.
   https://arxiv.org/abs/2505.21946 (characteristic/flow-map advection as current research backing
   the fakery's accuracy).

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **MLS-MPM hero pour on WebGPU (tier-gated).** A capable-device-only "altar pour" using
   holtsetio/`flow` + three.js `WebGPURenderer`, with a byte-identical WebGL2 faked fallback. Scope
   the perf on a real iPhone 15 (iOS 26) and the renderer-coexistence problem with our single-canvas
   architecture.
2. **Screen-space fluid rendering of the pour front.** The depth/thickness/normal-reconstruction
   technique matsuoka uses — could give the bubbling front genuine specular + refraction without a
   full solver. How cheaply can it run for just the *leading edge*?
3. **2D Stable-Fluids heat field as a shared world service.** One small velocity field driving
   sparks, heat-haze post, *and* vein flicker across every chamber — sizing, the Jacobi-iteration vs
   quality curve, and the exact `useFBO` ping-pong wiring inside one `useFrame`.
4. **Baking the Celtic-interlace flow map.** Pipeline to generate the RG-direction / B-arclength /
   A-mask texture from the channel spline geometry (branch/rejoin handling, KTX2 compression, no
   runtime EXR), and how the letterform fill order is encoded.
