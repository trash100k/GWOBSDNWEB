# 29 — Mobile-First 3D Performance Budget

_Phase-1 graphics research · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer_

> Scope note: this document owns the **hard performance envelope** — the per-frame millisecond
> budget on iPhone 15, and how every other element in the forge world (molten veins, divine-fire
> A+E, sparks, heat haze, bloom, the channel-hall pour, the jewel chamber) must fit inside it. It is
> the partner to the `forge-scene` and `post-fx` skills, and it is the *gatekeeper* for docs 01–28:
> any technique those docs recommend is only valid if it survives this budget. Every number here is
> a contract the rest of the build is held to.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is sold as a *gaming/cinematic* WebGL experience (Active Theory / Lusion / Resn caliber),
but it must run on an **iPhone 15 held in one hand, in a browser tab, with Safari's compositor, a
4K-ish OLED, and a thermal ceiling that throttles the GPU after ~90 seconds of sustained load.** That
is the entire game. The single most expensive mistake this project can make is to build a gorgeous
desktop forge that drops to 30fps and overheats the judge's phone in the first chamber. On OLED a
dropped frame is *more* visible than on LCD because the panel's instant pixel response shows the
stutter cleanly.

The forge world is unusually well-suited to a tight budget *if* it is engineered correctly: it is a
**pure-void scene lit only by the metal itself**, so there are almost no lit surfaces, few shadow
casters, and a tiny material count. The cost is **not** geometry — it is **fill-rate** (full-screen
emissive fragment shaders + post) and **overdraw** (additive particles + transparent glass). That
inversion drives every decision below: on this scene, *pixels are the enemy, not triangles.*

The budget's job is to define the hard envelope, then assign each effect a slice of it, and to wire
the **three quality tiers** (`high` / `low` / `static`) and a **reduced-motion** path that already
exist as stubs in `ForgeCanvas.jsx` and `store.js` into a real, measured, adaptive system. The
current repo sets `forge.quality = 'high'` once on mount and never adapts; this doc replaces that with
a measured tier + runtime `AdaptiveDpr`/`PerformanceMonitor` regression loop.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 The frame budget itself

60fps = **16.67 ms/frame**, but that is the *whole device*, not your scene. On iPhone 15 Safari,
realistically reserve ~3–4 ms for the browser compositor, Lenis/scroll, React reconciliation, and OS
overhead, leaving a **GPU+JS scene budget of ~11–12 ms**. To survive thermal throttle (the A16/A17
class throttles to roughly 80–85% of peak after sustained load — the iPhone 15 Pro Max has been
measured hitting 48°C and dropping frames under sustained game load per Notebookcheck/BGR 2025), the
*design* target should be **~9–10 ms at the steady state on the `high` tier**, so there is headroom to
absorb throttle without falling below 16.67. The `low` tier exists precisely to land under budget
*after* throttle on weaker/older devices.

### 2.2 Draw-call & geometry budget

The 2025/2026 consensus (Three.js Roadmap "Draw Calls: The Silent Killer", Utsubo "100 Three.js Tips
2026", Velasquez 100k-spheres write-up) is blunt: **target < 50 draw calls on mobile, < 100 on
desktop**; reducing draw calls via merging + `InstancedMesh` + texture atlasing has more impact than
any other single optimization. For GAELWORX this is almost free — the void scene is a handful of
meshes (slab, letterforms, channel geometry, jewel) — but the rule binds two places: (a) the GAELWORX
**letterforms** must be one merged/instanced geometry or a single SDF quad, not 8 separate meshes; (b)
**Celtic interlace channels** (doc 24) must be instanced segments or baked into one mesh, never one
draw call per knot.

### 2.3 Device-pixel-ratio: the biggest single lever

DPR is the dominant fill-rate multiplier. iPhone 15 reports `devicePixelRatio` of **3**; rendering a
full-screen emissive shader at native 3× is suicidal. The 2025 mobile guidance (Codrops "Building
Efficient Three.js Scenes" Feb 2025; MoldStud mobile guides) is to **clamp DPR to 1–1.5 on handsets**
to avoid GPU throttling and battery drain. The repo already does this conservatively
(`high → [1,2]`, `low → [1,1.4]`, `static → 1`) — good, but `[1,2]` is still aggressive for a
full-screen post chain on mobile; the recommendation below tightens the *mobile* high tier to a `1.5`
cap while keeping `2` for desktop.

Two mechanisms ride on top of static DPR:
- **`AdaptiveDpr` (drei)** — already in `ForgeCanvas.jsx`. On a performance *regress* event it cuts
  the pixel ratio to the canvas's `performance.min` and restores it after. `pixelated` keeps the
  downscale crisp-snapped (brutalist-friendly).
- **`PerformanceMonitor` (drei)** — the newer, finer tool (covered in the r3f "Scaling performance"
  docs and the 2026 Krapton deep-dive). It samples a rolling FPS *factor* (0–1) and lets you respond
  continuously: lower DPR, drop post passes, cut particle counts, demote tier — all from one signal.
  This is the right driver for GAELWORX because our quality has many independent knobs, not just DPR.

### 2.4 Render-target resolution for post

EffectComposer allocates two full-screen RTs (rtA/rtB) at the composer size; every pass is fill-rate
on those. The 2025 posts (Sangil Lee "Post-processing" Jan 2025; Three.js Roadmap "Complete Guide to
Post-Processing 2026") confirm the standard win: **render bloom at half/quarter resolution and
upscale — this can roughly double frame rate.** pmndrs `Bloom mipmapBlur` already builds the glow from
a downsampled mip pyramid (half/quarter by construction), which is why it is the correct mobile bloom.
The `EffectPass` in pmndrs/postprocessing **merges all compatible effects into one fragment shader**,
so the entire grade (bloom + CA + hue/sat + brightness/contrast + vignette + noise) is *one* extra
full-screen pass, not six — this is the load-bearing reason the current `Effects.jsx` stack is
affordable.

### 2.5 Particle / spark budget

GAELWORX's `Embers.jsx` is already the right architecture: **one `THREE.Points`, one draw call, all
motion in the vertex shader, additive, `depthWrite:false`.** 2025 guidance (Utsubo 2026, Three.js
Roadmap galaxy/WebGPU pieces) says points/instancing for sparks is correct, but the hidden cost on
mobile is **overdraw**: additive points with large `gl_PointSize` blow up fill-rate even at low
counts. So the spark budget is governed by *covered pixels*, not particle count. Practical envelope:
**≤ 320 embers on high, ≤ 160 on low, 0 on static**, with point sizes kept modest and the soft-disc
falloff (already present) cheap. The orbiting pour-front sparks (doc 15) must share this same Points
system and budget — never a second particle system.

### 2.6 Shader cost — the real bottleneck

In a void scene the **full-screen-ish emissive fragment shaders are the budget**: the obsidian slab's
injected vein shader runs `gw_fbm` (multi-octave noise) per pixel, plus pointer-warp, plus opal
`cos()` iridescence. fbm is the single most expensive thing in the scene. 2025 best-practice: **cap
fbm octaves on mobile** (4→3, or 3→2), precompute what you can, and avoid `pow()` chains in hot paths.
The repo's `gw_fbm` is called multiple times per fragment (veins, undulation normal, iridescence) — on
mobile these should collapse to fewer evaluations. Branching is cheap on A-series GPUs but *texture-
dependent reads* and high-octave noise are not.

### 2.7 WebGPU + TSL — the 2025/2026 frontier (and why we defer it)

three.js r17x+ ships `WebGPURenderer` from `three/webgpu` with automatic WebGL2 fallback (since r171),
and r183 introduced `RenderPipeline` as a modern EffectComposer replacement (Utsubo migration guide
2026; Maxime Heckel "Field Guide to TSL and WebGPU" 2025). WebGPU compute particles are
transformative — 100k particles in <2ms vs ~30ms on CPU. **But:** as of early 2026 **Safari's WebGPU
support is still incomplete/unstable**, and the iPhone 15 judge target will fall back to WebGL2
anyway. Building on WebGPU now means shipping the *fallback* path as the real path for the judge. So
GAELWORX stays **WebGL2 + pmndrs/postprocessing** for this build, while writing the master shader
system in a way that can be ported to TSL later (deep-dive 9.3).

### 2.8 Off-main-thread (OffscreenCanvas) — INP insurance

The 2025/2026 Core-Web-Vitals reality (web.dev INP; Utsubo "WebGL & Three.js Site SEO 2026"): the
render loop, **shader compilation**, and large asset parsing all run on the main thread by default and
tank **INP** (target < 200ms; 43% of sites still fail it in 2026). The documented fix is
`OffscreenCanvas` + a Web Worker to move the renderer and parsing off-main. For GAELWORX the highest-
ROI move is **not** full OffscreenCanvas (it complicates the r3f/Lenis/scroll plumbing) but **async
shader compilation** (`renderer.compileAsync`) at load so the first interaction isn't blocked by a
multi-hundred-ms shader compile, plus keeping per-frame JS allocation-free.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**A measured 3-tier system, driven once at boot by a capability probe, then continuously trimmed at
runtime by a single `PerformanceMonitor` signal, with `AdaptiveDpr` as the fast safety valve and a
guaranteed `static` floor.** Concretely:

1. **Boot probe → initial tier.** Read `devicePixelRatio`, `navigator.hardwareConcurrency`,
   `navigator.deviceMemory` (where available), a coarse GPU-renderer-string sniff
   (`WEBGL_debug_renderer_info`), and `matchMedia('(prefers-reduced-motion)')`. Map to `high` / `low`
   / `static`. iPhone 15 → `high` but with a **mobile-capped DPR of 1.5**, not 2.

2. **Per-tier static config** (DPR cap, post passes, particle count, fbm octaves, transmission
   on/off, env resolution) — most of this already exists, just needs to be centralized into one
   `TIERS` table and driven off it.

3. **Runtime regression via `PerformanceMonitor`.** One `factor` (0–1) feeds a small ladder: factor
   drops → cut DPR → drop CA + SMAA → halve embers → demote `high`→`low`. Recovers when the factor
   climbs back. This is the difference between "designed for 60" and "holds 60 under thermal throttle."

4. **`static` tier = the floor.** `frameloop="demand"`, no post, no embers, frozen uTime, DPR 1. This
   is what reduced-motion users and the weakest devices get, and it is what `<noscript>`/AEO crawlers
   effectively see. It must still look *intentional* (a dark obsidian slab with frozen warm veins),
   not broken.

**Justification:** this scene's cost is fill-rate, and the four levers that move fill-rate the most —
DPR, post resolution, particle overdraw, fbm octaves — are all already in the codebase as scattered
ternaries. Centralizing them behind one tier table + one runtime signal turns "looks fine on my
laptop" into a contract that *measurably* holds 60fps on the actual judge device, and degrades
gracefully instead of cliff-diving. It is also the minimum-surface-area change: it builds on the
`AdaptiveDpr`, `quality`, and `frameloop` machinery that already ship in this repo.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (already in this build)

- `three` r17x (WebGL2 path), `@react-three/fiber` v8/v9, `@react-three/drei`
  (`AdaptiveDpr`, `PerformanceMonitor`, `Environment`, `Lightformer`),
  `@react-three/postprocessing` + `postprocessing` (pmndrs, the merged-`EffectPass` engine).
- No new runtime deps. WebGPU/TSL intentionally **not** added (see 2.7).

### 4.2 One tier table (new: `src/scene/tiers.js`)

```js
// Single source of truth for every fill-rate knob. forge.quality indexes this.
export const TIERS = {
  high:   { dprCap: 1.5, dprDesktop: 2, post: 'full',  ca: true,  smaa: true,
            embers: 320, fbmOctaves: 4, transmission: true,  envRes: 256, bloomRes: 0.5 },
  low:    { dprCap: 1.4, dprDesktop: 1.6, post: 'lite', ca: false, smaa: false,
            embers: 160, fbmOctaves: 3, transmission: false, envRes: 128, bloomRes: 0.5 },
  static: { dprCap: 1.0, dprDesktop: 1, post: 'none',  ca: false, smaa: false,
            embers: 0,   fbmOctaves: 2, transmission: false, envRes: 64,  bloomRes: 1 },
}
export const tier = () => TIERS[forge.quality] || TIERS.high
```

### 4.3 Boot probe → initial tier (new: `src/scene/detectTier.js`)

```js
export function detectTier() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  const cores = navigator.hardwareConcurrency || 4
  const mem   = navigator.deviceMemory || 4          // GB, coarse
  const dpr   = window.devicePixelRatio || 1
  const mobile = matchMedia('(pointer: coarse)').matches
  // GPU string sniff (best-effort; absent on locked-down Safari → fall through)
  let gpu = ''
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''
  } catch {}
  const weak = cores <= 4 && mem <= 4
  if (mobile && weak) return 'low'          // older / budget handset
  if (mobile) return 'high'                 // iPhone 15 lands here (DPR capped to 1.5)
  return dpr <= 1.5 && weak ? 'low' : 'high'
}
```

Set `forge.quality = detectTier()` once on mount (replaces the hardcoded `'high'`), then pass it into
`ForgeCanvas`.

### 4.4 DPR wiring (edit `ForgeCanvas.jsx`)

```jsx
const t = TIERS[quality]
const mobile = matchMedia('(pointer: coarse)').matches
const cap = mobile ? t.dprCap : t.dprDesktop
const dpr = quality === 'static' ? 1 : [1, cap]   // [min, max] lets AdaptiveDpr ride between
```

### 4.5 Runtime regression (edit `ForgeCanvas.jsx`)

```jsx
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'

<PerformanceMonitor
  // hysteresis: don't thrash on a single hitch
  onDecline={() => { forge.perf = Math.max(0, forge.perf - 1) }}
  onIncline={() => { forge.perf = Math.min(2, forge.perf + 1) }}
  flipflops={3}
  onFallback={() => { forge.quality = 'low' }}   // gave up → demote tier
/>
<AdaptiveDpr pixelated />
```

`forge.perf` (0/1/2) is a *frame-shared* trim level read by the effects + embers, e.g. embers count =
`tier().embers * [0.4, 0.7, 1][forge.perf]`, and `Effects` drops CA/SMAA when `forge.perf === 0`. The
key is that **everything that reads perf reads it from the mutable `forge` store, never via React
state** (matching the existing pattern in `store.js`/`useFrame`), so a regression never triggers a
React re-render mid-scroll.

### 4.6 Tier-aware post (edit `Effects.jsx`)

```jsx
export default function Effects({ quality }) {
  const t = TIERS[quality]
  const lean = quality !== 'high' || forge.perf === 0
  return (
    <EffectComposer disableNormalPass multisampling={t.smaa && !lean ? 2 : 0}>
      <Bloom mipmapBlur resolutionScale={t.bloomRes}
             luminanceThreshold={0.55} luminanceSmoothing={0.3}
             intensity={quality === 'high' ? 0.9 : 0.6} radius={0.8} />
      {t.ca && !lean
        ? <ChromaticAberration offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />
        : <></>}
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={-0.04} contrast={0.16} />
      <Vignette offset={0.22} darkness={0.96} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={quality === 'high' ? 0.05 : 0.035} />
      {t.smaa && !lean ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
```

Note `resolutionScale={0.5}` on Bloom — the half-res mip pyramid, the single biggest post win on
mobile. The film grain stays *on at all tiers* because on OLED it doubles as **dither** to kill
banding in the dark gradients (it is nearly free).

### 4.7 fbm octave cap hooked into the master shader (edit `shaders.js` / `ObsidianSlab.jsx`)

The fbm octave count is the master shader knob. Pass the tier's octave count as a `#define` at compile
time so the loop unrolls and there is *zero* runtime branch:

```js
m.defines = { USE_UV: '', GW_FBM_OCTAVES: String(tier().fbmOctaves) }
```
```glsl
float gw_fbm(vec2 p){
  float a = 0.5, v = 0.0;
  for (int i = 0; i < GW_FBM_OCTAVES; i++){ v += a * gw_noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
```

This is the cohesion hinge: **the same `GW_FBM_OCTAVES` define drives noise everywhere** — veins,
heat haze (doc 16), pour flow (doc 09), smoke (doc 17) — so dropping a tier thins *all* procedural
detail uniformly, and nothing looks selectively broken.

### 4.8 Async shader compile (edit the loader / `ForgeCanvas`)

Before dismissing the intro loader, call `await gl.compileAsync(scene, camera)` so the first scroll
interaction isn't blocked by a synchronous shader compile — directly protects INP at the critical
first-interaction moment.

---

## 5. COHESION — shared palette / lighting / uniforms

The budget is not a separate system; it is a set of **caps on the one master system**:

- **One renderer, one composer, one Points system.** Everything routes through `ForgeCanvas`'s single
  `<Canvas>` and `Effects`'s single merged `EffectPass`. Sparks (embers + pour-front orbit) share the
  one `Points` budget. This is non-negotiable and already the repo's architecture.
- **Palette is the bloom selector.** Per `palette.js`, only `PAL.hot`/`PAL.emberHot` (>1) values
  bloom; the budget never adds a SelectiveBloom pass because the palette *is* the selection (doc 20).
  The divine-fire A+E radiance is just shader values pushed >1 — free within the existing bloom.
- **`forge.quality` + `forge.perf` are global frame-shared uniformsources.** Every component reads
  them from the mutable store the same way `ObsidianSlab` already reads `forge.scrollVel` /
  `forge.route` — no prop-drilling, no re-renders.
- **`GW_FBM_OCTAVES` and the master temperature uniform are shared.** Trimming detail under load
  cools *every* element together, preserving the "one world" feel the brief demands.
- **`static` tier obeys the brand.** A frozen warm-vein obsidian slab on true-black void is exactly
  the Neo-Gaelic Brutalist still the brand wants — the degraded path is on-brand, not a fallback that
  betrays the look.

---

## 6. MOBILE & PERFORMANCE — the iPhone-15 envelope

**Per-frame budget (high tier, iPhone 15, DPR 1.5, ~9–10 ms design target):**

| Cost center | Budget | How it's held |
|---|---|---|
| Obsidian slab vein shader (full-ish screen) | ~3.5–4.5 ms | 4-octave fbm, DPR-capped, half-res-friendly |
| Post chain (1 merged pass + half-res bloom) | ~2.5–3 ms | `mipmapBlur` `resolutionScale 0.5`, merged `EffectPass` |
| Embers / sparks (1 draw, additive) | ~0.8–1.2 ms | ≤320 pts, modest point size, overdraw-bounded |
| Env (procedural Lightformers, 256) | ~0.5 ms | static cubemap, no runtime EXR |
| Camera/scroll JS + React + Lenis | ~2–3 ms | alloc-free `useFrame`, mutable store |
| **Headroom for throttle** | **~5–6 ms** | the gap to 16.67 that absorbs the A-series throttle |

**Draw calls:** must stay **< 50**. Slab (1) + letterforms (1 merged/SDF) + channels (1 instanced) +
jewel (1) + embers (1) + env + post ≈ well under 20. Budget intact.

**LOD / fallback ladder (driven by `PerformanceMonitor` `factor`):**
1. factor dips → `AdaptiveDpr` drops pixel ratio (instant, invisible-ish, `pixelated`).
2. still low → `forge.perf` 2→1: halve embers, drop SMAA.
3. still low → `forge.perf` 1→0: drop ChromaticAberration, embers to 40%.
4. `onFallback` → demote `high`→`low`: fbm 4→3 (recompile define), transmission off, env 128.
5. floor → `static`: `frameloop="demand"`, post off, embers off, uTime frozen, DPR 1.

**Reduced-motion:** `prefers-reduced-motion` → `static` tier directly at boot (no Lenis — `forge.lenis`
already nulls in this case), so motion-sensitive users get the frozen, dignified slab.

**INP / CWV:** `compileAsync` before first interaction; alloc-free per-frame loop (no `new` in
`useFrame` — the repo mostly honors this; audit `Embers`/`CameraRig` `tmp` reuse, which is already
correct). Target INP < 200ms, LCP unaffected (canvas paints after the prerendered HTML LCP element).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**
1. Build the `TIERS` table + `detectTier()` first, wire `forge.quality` off the probe. *Then* tune
   looks — never tune on an untiered scene.
2. Profile on a **real iPhone 15**, Safari, via remote Web Inspector + an on-screen `r3f-perf`/`Stats`
   in `?debug`. Simulators and desktop throttling lie about fill-rate and thermal behavior.
3. Tune the **DPR cap first** (biggest lever), then **bloom `resolutionScale`**, then **fbm octaves**,
   then particle count. In that order — each later knob matters less.
4. Add `PerformanceMonitor` regression last, once the static tiers already hold 60 cold.

**Pitfalls (each has bitten this class of build):**
- **Native DPR on a full-screen shader.** iPhone reports DPR 3; rendering the void shader at 3× is the
  classic instant-death. Cap to 1.5.
- **Forgetting that cost = pixels, not triangles.** Don't waste budget on geometry LOD for a 6-mesh
  scene; spend it on fill-rate (DPR, post-res, overdraw).
- **Additive particle overdraw.** Low *count* but huge *point size* still murders fill-rate. Bound by
  covered pixels, not particle number.
- **Per-frame allocations / React state in the hot loop.** Any `new THREE.Vector3()` in `useFrame` or
  any `setState` from `PerformanceMonitor` causes GC stutter / re-renders mid-scroll. Use the mutable
  `forge` store (the repo's established pattern).
- **Synchronous shader compile on first paint** → INP spike at the worst moment. `compileAsync`.
- **Thermal cliff.** A scene that holds 60 for 10 seconds then drops at 90s isn't done — design to
  ~10ms so there's throttle headroom, and verify *after* a sustained run, not cold.
- **Building on WebGPU now.** Safari falls back to WebGL2 on the judge device; you'd be shipping the
  fallback as the product. Stay WebGL2, port to TSL later.
- **A tier that changes the *look*, not just the cost.** Degradation must thin detail uniformly
  (shared `GW_FBM_OCTAVES`, shared palette/bloom), never recolor or restructure — or the world stops
  reading as one place.

---

## 8. SOURCES (2025–2026)

1. Krapton — "Boosting React Three Fiber Mobile Performance in 2026: A Deep Dive" (2026).
   https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c
2. Codrops (Tympanus) — "Building Efficient Three.js Scenes: Optimize Performance While Maintaining
   Quality" (11 Feb 2025).
   https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
3. Utsubo — "100 Three.js Tips That Actually Improve Performance (2026)."
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
4. Three.js Roadmap — "Draw Calls: The Silent Killer" (2025/2026).
   https://threejsroadmap.com/blog/draw-calls-the-silent-killer
5. Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026."
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
6. Sangil Lee — "Post-processing" (15 Jan 2025). https://sangillee.com/2025-01-15-post-processing/
7. Maxime Heckel — "Field Guide to TSL and WebGPU" (2025).
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
8. Utsubo — "WebGL & Three.js Site SEO: Make 3D Sites Rankable (2026)" (INP/CWV + OffscreenCanvas).
   https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide
9. Utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist" (r171/r183, RenderPipeline).
   https://www.utsubo.com/blog/webgpu-threejs-migration-guide
10. R3F docs — "Scaling performance" (AdaptiveDpr / PerformanceMonitor / frameloop demand / regress).
    https://r3f.docs.pmnd.rs/advanced/scaling-performance
11. drei docs — "AdaptiveDpr." http://drei.docs.pmnd.rs/performances/adaptive-dpr
12. Three.js Roadmap — "Interactive Galaxy with WebGPU Compute Shaders" (compute-particle perf, 2025).
    https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders
13. web.dev — "Optimize Interaction to Next Paint (INP)" (2025/2026 thresholds).
    https://web.dev/articles/optimize-inp
14. Notebookcheck — "iPhone 15 Pro Max thermal throttling … 48°C during gaming" (2025).
    https://www.notebookcheck.net/Severe-Apple-iPhone-15-Pro-Max-thermal-throttling-reported-as-A17-Pro-appears-to-push-surface-temperatures-to-48-C-during-gaming.753143.0.html

---

## 9. DEEP-DIVE CANDIDATES

- **9.1 Capability probe accuracy on locked-down Safari.** `WEBGL_debug_renderer_info` is often masked
  on iOS; design a probe that degrades gracefully (cores/memory/DPR + a 1-second micro-benchmark
  render) and validate the iPhone-15 → `high` classification on real hardware.
- **9.2 `PerformanceMonitor` tuning + hysteresis for thermal throttle.** Find the `flipflops`,
  `factor` bounds, and step ladder that ride the *slow* thermal decline without visible quality
  thrash over a 2–3 minute session — the hard part of "holds 60 sustained."
- **9.3 TSL/WebGPU port path for the master shader.** Author `gw_fbm`/vein/temperature in TSL with the
  same `GW_FBM_OCTAVES` knob so a future `WebGPURenderer` + `RenderPipeline` build is a swap, not a
  rewrite — and benchmark compute-particle sparks for when Safari WebGPU stabilizes.
- **9.4 OffscreenCanvas + worker for r3f/Lenis.** Scope the cost/benefit of moving the renderer to a
  worker (INP win) against the scroll/pointer plumbing complexity, and whether `compileAsync` alone
  captures most of the INP gain at a fraction of the risk.
