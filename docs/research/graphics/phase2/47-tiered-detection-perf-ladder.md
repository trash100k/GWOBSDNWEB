# 47 — Boot Capability Probe + PerformanceMonitor Thermal-Hysteresis Ladder

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 47_
_Cluster: G-architecture-perf · Focus: the `TIERS` table + `detectTier()` boot probe
(DPR / cores / memory / GPU-string / reduced-motion → iPhone 15 = `high` at DPR 1.5), the
`WEBGL_debug_renderer_info` masking workaround, and the `flipflops`/`factor`/`step` ladder that rides
the SLOW 2–3 minute thermal decline without visible quality thrash. The hard part of "holds-60-sustained."_

> Read `00-COHESION-MAP.md` §1.5, §4.2, and §10, and phase1 `29-mobile-3d-performance-budget.md` first.
> This document is the concrete build of that doc's deep-dive candidates **9.1** (capability-probe accuracy
> on locked-down Safari) and **9.2** (`PerformanceMonitor` tuning + hysteresis for thermal throttle). Topic
> 29 set the *budget* and the *shape* of the tier system; this owns the two pieces that decide whether the
> world actually holds 60 on the judge device: **which tier we boot into**, and **how we ride the slow
> thermal decline without the world visibly thrashing**. Every knob this document moves is a cap on the one
> master system (the shared `U` pool, the shared `GW_FBM_OCTAVES`, the one composer) — degradation is
> *uniform*, never a recolor or a restructure.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten forge on **one** WebGL renderer, route-swapped into eight chambers, sold at
Active-Theory / Lusion caliber, and it has to hold 60fps on an **iPhone 15 OLED held in one hand, in a
Safari tab, for 2–3 minutes of scroll-through.** The cohesion map's §10 names the device as "the whole
game" and names the single failure this document guards against: a scene that *holds 60 for ten seconds
then drops at 90s is not done.* The A16/A17 class does not fall off a cliff — it **sags slowly** as the
aluminium chassis soaks heat, throttling to roughly 78–85% of peak over a 2–3 minute session
(Notebookcheck measured the 15 Pro Max at 78% sustained CPU, 60–70% GPU stability, surface 48 °C). The
naïve adaptive loop reacts to that sag the wrong way: it sees FPS dip, drops a quality knob, the dip
recovers, it restores the knob, the heat keeps climbing, it drops again — a **visible pulse of the whole
world's fidelity every few seconds**, which on an OLED panel (instant pixel response, no LCD smear to hide
it) reads as a bug, not a graceful degrade.

This deep-dive owns the two ends of that problem:

1. **The boot probe (`detectTier()`).** Decide *once* on mount which of `high` / `low` / `static` the
   device boots into, from `devicePixelRatio`, `navigator.hardwareConcurrency`, `navigator.deviceMemory`, a
   `WEBGL_debug_renderer_info` GPU-string sniff, and `prefers-reduced-motion`. The iPhone 15 must land
   `high` at a **mobile-capped DPR of 1.5** — and it must land there *reliably*, despite Safari **masking
   the GPU string to a useless "Apple GPU"** (the workaround is the heart of candidate 9.1).

2. **The runtime ladder.** One `PerformanceMonitor` `factor` (0–1) feeds a small ordered ladder
   (`forge.perf` 2→1→0, then `onFallback` → demote tier) read from the **mutable `forge` store, never React
   state**. The `flipflops` / `bounds` / `step` parameters are tuned not for "hold 60 cold" but for **riding
   the slow thermal slope without thrash** — wide hysteresis, asymmetric recovery, and a one-way ratchet at
   the bottom so the world settles into a sustainable steady-state instead of oscillating.

The contract from §10 is the acceptance test: **design to ~9–10 ms steady-state on `high`** so there is
~5–6 ms of throttle headroom, and verify the world is *still visually stable* after a sustained run, not
just cold. Nothing here invents a new look — it only thins the *shared* detail (octaves, DPR, post passes,
ember count) uniformly, so a tier drop reads as "the forge banked its coals," not "the renderer broke."

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are two sub-problems — **boot classification** and **runtime adaptation** — each with a small field
of viable 2025–2026 approaches.

### 2.1 Boot classification

**(a) Heuristic probe (cores / memory / DPR / pointer / reduced-motion).** The approach topic 29 §4.3
sketches: read `navigator.hardwareConcurrency`, `navigator.deviceMemory`, `devicePixelRatio`,
`matchMedia('(pointer: coarse)')`, `prefers-reduced-motion`, and bucket. **Pros:** instant (zero render),
no dependency, no network, no benchmark frame stall. **Cons:** coarse — `deviceMemory` is absent on Safari
entirely (it is a Chrome-only API), `hardwareConcurrency` on iPhone reports a fixed 4 regardless of the
real 6-core A16 GPU, and DPR is 3 on every modern iPhone from the 11 up, so it cannot distinguish a 15 from
a 12. The heuristic alone **cannot tell an iPhone 15 from an iPhone SE** on the fields Safari exposes. It is
necessary (for the reduced-motion and obviously-weak cases) but **not sufficient** for the `high`-vs-`low`
call on iOS.

**(b) GPU-string sniff via `WEBGL_debug_renderer_info`.** Read `UNMASKED_RENDERER_WEBGL` and pattern-match
("Apple A17", "Adreno 7xx", "Mali-G", "Apple M"). **This is the canonical desktop approach and it is dead
on iOS.** MDN and BrowserLeaks confirm: since iOS 12.2 / Safari Feb 2020, Safari **masks the string to a
flat `"Apple GPU"`** for fingerprinting resistance — every iPhone from the 8 to the 16 returns the same two
words. The extension is also "only available to privileged contexts or not work at all" depending on
privacy settings, and returns a usable value in ~90% of cases on *desktop* but ~0% specificity on iOS
(MDN, *WEBGL_debug_renderer_info*, 2025). So the sniff is excellent on Android/desktop (where Adreno/Mali/
NVIDIA strings are rich) and **useless as a discriminator on the judge device** — it only tells us "this is
an Apple GPU," which we already knew from `(pointer: coarse)` + the platform.

**(c) `detect-gpu` (pmndrs) — benchmark lookup.** `getGPUTier()` reads the renderer string, and where the
string is recognized, looks it up in a **bundled FPS benchmark table** (sourced from gfxbench) to assign
tier 0–3, falling back to a live micro-benchmark render where the string is unknown. **Pros:** turns the
masked iOS string into a tier via the benchmark table (it special-cases Apple devices by screen
resolution + the generic string), returns `{ tier, isMobile, fps, gpu, type }`, mature and r3f-adjacent.
**Cons (2025–2026, load-bearing):** the README now states **"our benchmark data source (gfxbench.com)
stopped updating in December 2025"** — so the newest devices (iPhone 16/17, 2025–26 Androids) are *not in
the table* and fall to `FALLBACK`/micro-benchmark, and self-hosting the JSON is required for CSP-strict /
offline. The benchmark JSON is also ~250 KB+ of data to fetch or bundle, and the live fallback **renders a
throwaway frame at boot** (a measurable first-paint cost on the very device we are protecting). It is the
right tool *if* the table is self-hosted and the cost is accepted; for GAELWORX's 8-mesh void scene where
the `high`/`low` split on iOS is binary (modern iPhone = `high`, everything older/weaker = `low`), the full
benchmark machinery is heavier than the decision needs.

**(d) GPU-hashing (51Degrees Renderer).** For iOS ≥ 12.2, render a known scene and **hash GPU-specific
floating-point/rasterization quirks** to recover the actual chip class despite the masked string (51Degrees
*Renderer*, MOZ-2.0, 2025). **Pros:** can distinguish iPhone generations Safari tries to hide. **Cons:**
renders a probe frame (first-paint cost), it is a fingerprinting technique (privacy-adjacent, and Safari
actively works to defeat exactly this), and it is brittle across iOS point releases. **Reject for
GAELWORX** — the privacy posture is wrong for a brand site, and we do not need generation-level precision.

**(e) The 1-second micro-benchmark (the cohesion map's recommendation in 9.1).** Render the *actual slab
shader* off-screen at a known size for ~30–60 frames at boot, measure the achieved frame time, and bucket.
**Pros:** measures *this scene's real cost on this exact GPU+thermal state*, which is the only number that
truly matters, and it works regardless of the masked string. **Cons:** costs ~0.5–1 s of boot time on the
device we are trying not to stall, and a *cold* device benchmarks faster than it will sustain (it measures
peak, not throttled). It is the most honest signal but the most expensive, and it must run *behind the
intro loader* so it never blocks first paint.

### 2.2 Runtime adaptation

**(a) `drei` `PerformanceMonitor` — RECOMMENDED.** The 2025–2026 standard (r3f *Scaling performance* docs;
drei docs). It samples FPS over rolling windows and emits a single `factor ∈ [0,1]`, with explicit
hysteresis controls. From the drei source (verbatim defaults): `ms = 250` (window length), `iterations =
10` (windows averaged), `threshold = 0.75` (fraction of windows that must agree to fire), `factor = 0.5`
(start), `step = 0.1` (per-event factor delta), `flipflops = Infinity`, and `bounds = (refreshrate) =>
refreshrate > 100 ? [60, 100] : [40, 60]`. Mechanics: it tracks `refreshrate = max(observed fps)`; an
**incline** fires when more than `iterations * threshold` of the recent windows sit *above* the upper
bound (`factor = min(1, factor + step)`); a **decline** fires when that many sit *below* the lower bound
(`factor = max(0, factor - step)`); within the bounds **nothing fires** (the dead-band that prevents
thrash); and every incline/decline increments `flipped`, with `flipped > flipflops` latching `onFallback`
(the give-up baseline). This is precisely the hysteresis machinery the thermal problem needs — *if tuned
for the slope, not the cold hold.*

**(b) `AdaptiveDpr` (drei) — the fast valve.** On a perf regress it cuts pixel ratio to the canvas's
`performance.min` and restores after, `pixelated` keeping the downscale crisp-snapped (brutalist-friendly).
**Pros:** DPR is the single biggest fill-rate lever (§10), and dropping it is the *least visible* change on
a void scene. **Cons:** it is a binary regress/restore, not a graded ride; it is the right *first rung* of
the ladder but not the whole ladder.

**(c) Hand-rolled EMA FPS controller.** Roll your own exponential-moving-average of `dt` and threshold it.
**Pros:** total control, no dep. **Cons:** you re-implement `PerformanceMonitor`'s bounds + flipflop logic
badly; the 2026 guidance (Codrops *Building Efficient Three.js Scenes*, Feb 2025; the Three.js Conf site
write-up, Codrops Feb 2026, which shipped exactly "an adaptive performance system that gives each device
the best visual quality it can handle") is to use the battle-tested component. **Reject** unless you need
sub-window response.

**(d) `EXT_disjoint_timer_query_webgl2` — GPU-time truth.** Safari 17.1+ exposes it; it measures real GPU
nanoseconds per pass, so you could attribute cost to *specific* passes (slab vs bloom). **Pros:** the only
way to know *which* knob to drop. **Cons (2025):** results are flagged **disjoint precisely when the GPU is
throttled** (the spec's `GPU_DISJOINT_EXT` fires under thermal throttle — the exact condition we care
about), it is "inconsistent across hardware," and it adds query-object plumbing. **Use it only in `?debug`
profiling**, never as the production driver — the disjoint-under-throttle behavior makes it unreliable for
the live ladder. Frame-time (wall clock) via `PerformanceMonitor` is the robust production signal; the
timer query is a dev instrument.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**A hybrid boot probe (heuristic gate + GPU-string sniff, with the masked-iOS case resolved by a
deferred micro-benchmark *promotion*, not a blocking benchmark), feeding a 3-tier `TIERS` table; then one
`PerformanceMonitor` retuned for the thermal slope, driving an ordered `forge.perf` ladder with wide
hysteresis, asymmetric (slow) recovery, and a one-way ratchet at the bottom.** Concretely:

### 3.1 Boot: heuristic-first, benchmark-as-promotion

1. **Reduced-motion → `static` immediately.** No render, no question.
2. **Obvious-weak → `low`.** `cores <= 4 && mem <= 4` on a non-Apple coarse pointer, or a recognized
   low-end Adreno/Mali string. (On Android/desktop the string sniff *works* and short-circuits here.)
3. **Coarse pointer + Apple (string masked) → boot `high` *optimistically* at DPR 1.5.** This is the key
   decision: rather than pay a blocking benchmark to *prove* the iPhone 15 deserves `high`, we **assume
   modern-iPhone = `high`** (true for every iPhone from the 13 up, which is the realistic judge fleet) and
   let the *runtime ladder catch the exception* — an older/throttled iPhone that can't hold it simply
   demotes within the first few seconds. The boot probe is biased toward the *correct common case* and the
   `PerformanceMonitor` is the safety net, so we never block first paint on a benchmark frame.
4. **(Optional, gated) deferred micro-benchmark confirmation.** *Behind the intro loader*, after
   `compileAsync`, render the real slab shader for ~30 frames off the critical path. If it can't hold the
   target, pre-demote to `low` *before* the curtain lifts — so the user never sees the demotion happen.
   This converts the "cold device benchmarks too optimistically" risk into a one-time, invisible check.

### 3.2 Runtime: retune `PerformanceMonitor` for the slope

The default `bounds [40,60]` + `step 0.1` + `flipflops Infinity` is tuned to *find* a stable quality cold.
For a **2–3 minute thermal decline** we want the opposite emphasis: **slow to react, slower to recover,
and a hard floor.** The retune (justified in §4):

- **Wider, lower-anchored bounds** so normal scroll-jitter and the slow sag don't trip the ladder until the
  device is genuinely losing the frame: `bounds = (rr) => [Math.min(45, rr - 12), rr - 2]` — decline only
  when sustained below ~45–48, incline only when comfortably at refresh.
- **Longer windows** (`ms 350`, `iterations 12`) so a single GC hitch or route-swap spike can't fire a
  decline — the ladder responds to *trends*, which is what thermal throttle is.
- **Small `step` (0.05)** so each rung is a gentle nudge, not a lurch.
- **Asymmetric recovery:** declines act immediately through the ladder; *inclines are gated behind a
  cooldown* (don't restore a knob for N seconds after a drop) so we don't restore-then-redrop as the heat
  keeps climbing. This is the single most important anti-thrash rule.
- **A one-way ratchet at the floor:** once `onFallback` demotes `high → low` (the device proved it can't
  sustain `high`), **do not auto-promote back to `high` in the same session** — the thermal state only gets
  worse, so promoting back guarantees a re-drop. Re-promotion waits for a fresh page load (cold device).

**Justification:** thermal throttle is a *monotonic slow decline over minutes*, not a random walk. The
right controller for a monotonic decline is one that **moves down readily, up reluctantly, and latches at
the bottom** — exactly inverted from the cold-start "hunt for the best quality" defaults. Every knob the
ladder touches is shared (DPR, `GW_FBM_OCTAVES`, ember count, post passes), so the world dims *uniformly*;
combined with the slow `step` and gated recovery, the user perceives "the forge settling," not "quality
flickering." This is the difference between `holds-60-cold` and `holds-60-sustained`.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `@react-three/drei` (`PerformanceMonitor`, `AdaptiveDpr`) — already in the build.
- No `detect-gpu` dependency in the shipping path (we use the heuristic + optional self-rendered
  micro-benchmark, avoiding the 250 KB benchmark JSON and the gfxbench-stale-since-Dec-2025 problem). If a
  future build wants generational precision on Android, add `detect-gpu` with a **self-hosted** benchmark
  JSON only.
- No `EXT_disjoint_timer_query_webgl2` in production; it lives behind `?debug` for per-pass profiling.
- All state lives in the existing mutable `forge` store (`src/store.js`), never React state.

### 4.2 The `TIERS` table (`src/scene/tiers.js`) — extended from topic 29 §4.2

```js
// Single source of truth for every fill-rate knob. forge.quality indexes this.
// forge.perf (2|1|0) is the runtime trim *within* a tier, applied on top.
export const TIERS = {
  high:   { dprCap: 1.5, dprDesktop: 2,   post: 'full', ca: true,  smaa: true,
            embers: 320, fbmOctaves: 4, transmission: true,  envRes: 256, bloomRes: 0.5 },
  low:    { dprCap: 1.4, dprDesktop: 1.6, post: 'lite', ca: false, smaa: false,
            embers: 160, fbmOctaves: 3, transmission: false, envRes: 128, bloomRes: 0.5 },
  static: { dprCap: 1.0, dprDesktop: 1,   post: 'none', ca: false, smaa: false,
            embers: 0,   fbmOctaves: 2, transmission: false, envRes: 64,  bloomRes: 1 },
}
export const tier = () => TIERS[forge.quality] || TIERS.high

// The runtime trim curve, read every frame from the mutable store.
// forge.perf: 2 = full, 1 = halved post/particles, 0 = lean (no CA/SMAA, embers 40%).
export const EMBER_SCALE = [0.4, 0.7, 1.0]   // index by forge.perf
export const emberCount = () => Math.round(tier().embers * EMBER_SCALE[forge.perf])
export const isLean    = () => forge.quality !== 'high' || forge.perf === 0
```

### 4.3 The boot probe (`src/scene/detectTier.js`)

```js
// Returns 'high' | 'low' | 'static'. Heuristic-first, biased to the correct common case.
// The runtime PerformanceMonitor is the safety net for the optimistic 'high' on iOS.
export function detectTier() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'

  const cores  = navigator.hardwareConcurrency || 4
  const mem    = navigator.deviceMemory || 4           // GB; undefined on Safari -> 4
  const dpr    = window.devicePixelRatio || 1
  const coarse = matchMedia('(pointer: coarse)').matches

  // GPU-string sniff. Rich on Android/desktop; MASKED to "Apple GPU" on iOS (Feb-2020+),
  // so it is a discriminator OFF Apple, and a no-op ON Apple (we fall through to the
  // coarse-pointer branch, which boots iOS optimistically high).
  const gpu = readRendererString()                     // '' if masked/blocked
  const g   = gpu.toLowerCase()
  const weakGPU =
    /adreno\s?[1-5]\d{2}\b/.test(g) ||                  // Adreno 1xx-5xx = budget
    /mali-g5\d|mali-g3\d|mali-t/.test(g) ||             // low Mali
    /(intel).*(hd|uhd)\s?[46]\d{2}/.test(g)             // weak Intel iGPU
  const strongGPU =
    /apple\s?(a1[4-9]|a2\d|m[1-9])/.test(g) ||          // works only when NOT masked
    /adreno\s?[7-9]\d{2}/.test(g) ||
    /rtx|radeon\s?rx|apple gpu/.test(g)                 // "apple gpu" = masked iOS -> treat as capable

  if (weakGPU) return 'low'
  if (coarse) {
    // Mobile. cores<=4 && mem<=4 with no strong signal => budget handset.
    if (cores <= 4 && mem <= 4 && !strongGPU) return 'low'
    return 'high'                                       // iPhone 13+ lands here (DPR capped 1.5)
  }
  // Desktop.
  if (strongGPU) return 'high'
  return dpr <= 1.5 && cores <= 4 ? 'low' : 'high'
}

// The masking workaround, isolated. Try WebGL2 then WebGL1; many privacy modes drop the ext.
function readRendererString() {
  try {
    const c  = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const s   = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()   // free the probe context immediately
    return s || ''
  } catch { return '' }
}
```

The masking workaround in one line: **we do not fight the mask.** On iOS the string is `"Apple GPU"`; we
deliberately treat that exact token as *capable* (`strongGPU` includes `apple gpu`) and let the runtime
ladder demote any device that can't actually sustain it. The probe never blocks, never renders, never
fingerprints — it disposes its throwaway context with `WEBGL_lose_context` so we don't burn one of Safari's
~8–16 context slots.

### 4.4 Optional deferred micro-benchmark (behind the loader, off the critical path)

```js
// Called AFTER compileAsync, BEFORE the intro curtain lifts. Renders the real slab
// shader ~30 frames into a small offscreen RT and times it. Pre-demotes invisibly.
export async function confirmTier(gl, scene, camera) {
  if (forge.quality !== 'high') return
  const N = 30, t0 = performance.now()
  for (let i = 0; i < N; i++) gl.render(scene, camera)   // already compiled (compileAsync)
  const msPerFrame = (performance.now() - t0) / N
  // Cold device measures PEAK; demand a comfortable margin so the sustained state still fits.
  if (msPerFrame > 8.0) forge.quality = 'low'            // can't even hit ~8ms cold -> won't sustain
}
```

### 4.5 The runtime ladder (edit `ForgeCanvas.jsx`)

```jsx
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'

// Thermal-slope tuning: wide/low bounds, long windows, small step, gated recovery, floor ratchet.
const PERF_BOUNDS = (rr) => [Math.min(45, rr - 12), rr - 2]   // [decline-below, incline-above]
let lastDropAt = -Infinity
const RECOVER_COOLDOWN = 8000   // ms: do not restore a rung for 8s after a drop

function rideThermal() {
  // factor-driven ordered ladder. forge.perf is the trim; demotion is the ratchet.
  return (
    <>
      <PerformanceMonitor
        ms={350} iterations={12} threshold={0.75}
        factor={1} step={0.05} bounds={PERF_BOUNDS} flipflops={3}
        onDecline={() => {
          forge.perf = Math.max(0, forge.perf - 1)       // 2->1->0: drop a rung immediately
          lastDropAt = performance.now()
        }}
        onIncline={() => {
          // Asymmetric recovery: only climb back after the cooldown, and never above a tier we
          // already fell out of (the floor ratchet handles the tier; this handles forge.perf).
          if (performance.now() - lastDropAt > RECOVER_COOLDOWN)
            forge.perf = Math.min(2, forge.perf + 1)
        }}
        onFallback={() => {                              // proved unstable at this tier
          if (forge.quality === 'high') {
            forge.quality = 'low'                        // ONE-WAY: no auto-promote this session
            forge.perf = 2                               // reset the trim at the new, lower ceiling
          }
        }}
      />
      <AdaptiveDpr pixelated />                          {/* the fast first valve */}
    </>
  )
}
```

### 4.6 Consumers read `forge.perf` from the store, not from props

```jsx
// Effects.jsx — drop the expensive passes when lean, every frame, no re-render.
const lean = isLean()                                   // forge.quality !== 'high' || forge.perf === 0
<EffectComposer disableNormalPass multisampling={tier().smaa && !lean ? 2 : 0}>
  <Bloom mipmapBlur resolutionScale={tier().bloomRes} luminanceThreshold={0.55} />
  {tier().ca && !lean ? <ChromaticAberration offset={[0.0008, 0.0012]} /> : <></>}
  {/* HueSaturation / BrightnessContrast / Vignette / Noise(grain) always on */}
  {tier().smaa && !lean ? <SMAA /> : <></>}
</EffectComposer>

// Embers.jsx — count from the trim curve.
const count = emberCount()                              // tier().embers * [0.4,0.7,1][forge.perf]
```

### 4.7 How it hooks the shared master temperature system

The ladder never touches *temperature* — that is the cohesion guarantee. It only thins the **shared
substrate** the temperature system draws on, so when a rung drops, every consumer of the master system
thins *together*:

- **`GW_FBM_OCTAVES` is the cohesion hinge.** On `onFallback` (high→low), the fbm octave `#define` goes
  4→3, which recompiles the slab, the molten pour, the heat-haze, the smoke, and the basalt veins in one
  step (they all `#include` the same `gw_fbm`). The metal at temperature `t` still looks like the same
  metal — just slightly less filigreed — because every element lost the same octave. Because the octave
  count is a `#define`, it must be reflected in `material.customProgramCacheKey()` so the two tiers don't
  collide on one cached program (the onBeforeCompile cache-key caveat from doc 39 §2.1).
- **The `U` pool is untouched.** `U.uTemp`, `U.uHeat`, `U.uTime` keep their references and their one
  `<ForgeDriver/>` writer (doc 39). The ladder changes *resolution and octave count*, never the heat
  signal, so the divine-fire A/E stay clamped to `gw_divineFire` and never cool regardless of tier — the
  keystone is invariant under performance adaptation.
- **`forge.perf` and `forge.quality` are frame-shared `uniformsources`** (topic 29 §5), read the same way
  `ObsidianSlab` already reads `forge.scrollVel` — so a regression never triggers a React re-render
  mid-scroll, and the strike-pulse synchrony (every element surges on one frame) is preserved across tier
  changes.

---

## 5. COHESION — shared palette / lighting / uniforms

This element is, by construction, *all caps and no looks* — it cannot break cohesion because it owns no
color, no noise, and no clock of its own. Its cohesion contract:

- **Degrades uniformly, never selectively** (cohesion-map rule §7.9). Every rung thins a *shared* knob:
  DPR (the whole frame), `GW_FBM_OCTAVES` (all procedural detail), `bloomRes`/post passes (the one
  composer), ember count (the one `Points`). A tier drop never recolors, never restructures, never silences
  one element while sparing another. The slab, jewel, channels, letters, Ogham, sparks, and caustics all
  dim on the same step because they all read the same shared substrate.
- **The `static` tier is on-brand, not a fallback.** Per §10, `static` is a "dignified, on-brand frozen
  still" — a warm-veined obsidian slab on true-black void, `uTime` frozen to `2`, post off, embers off,
  DPR 1. It is the Neo-Gaelic Brutalist poster, and it is also what `<noscript>`/AEO crawlers and
  reduced-motion users get. The degraded path *honors* the brand.
- **Palette-as-bloom-selector survives every rung.** Because only the >1 accent band blooms (§3.1), dropping
  `bloomRes` or even bloom entirely on `low` doesn't recolor — the hot metal stays hot, it just glows
  softer. No tier introduces a cool/green/blue cast or a private orange.
- **One renderer, one composer, one `Points`, one store.** The ladder operates entirely within the single
  `ForgeCanvas` context and the mutable `forge` store; it spawns nothing, mounts nothing per-frame, and
  allocates nothing in `useFrame`.

---

## 6. MOBILE & PERFORMANCE — the iPhone-15 envelope

**The probe's own cost must be near-zero.** `detectTier()` runs once, synchronously, on mount: a few
`matchMedia` reads, `navigator.*` reads, and one throwaway WebGL context for the string sniff that is
**immediately freed with `WEBGL_lose_context`** so it doesn't consume one of Safari's scarce contexts or
leak GPU memory. No benchmark frame on the critical path. The optional `confirmTier` micro-benchmark runs
**behind the intro loader, after `compileAsync`**, so its ~30-frame cost (~0.25–0.5 s) is hidden by the
curtain and never delays first paint or first scroll (INP-safe).

**The ladder rides the §10 budget, it does not add to it.** `PerformanceMonitor` samples wall-clock frame
time from the existing rAF — zero extra GPU work. `AdaptiveDpr` is a render-target resize, the cheapest
possible regress. The whole adaptive system is JS bookkeeping in the ~2–3 ms "Camera/scroll JS + React +
Lenis" line of the §10 table.

**The thermal ladder, concretely, on iPhone 15 (high, DPR 1.5, ~9–10 ms cold target → ~5–6 ms headroom):**

| Rung | Trigger | Action | Visible? |
|---|---|---|---|
| 0 | `factor` first dip | `AdaptiveDpr` cuts pixel ratio to `performance.min` | barely (pixelated, crisp) |
| 1 | `onDecline` perf 2→1 | embers 320→224, drop SMAA | nearly invisible on void |
| 2 | `onDecline` perf 1→0 | drop ChromaticAberration, embers →128 | subtle, soft edges |
| 3 | `flipflops > 3` → `onFallback` | demote high→low: fbm 4→3 (recompile), transmission off, env 256→128, perf reset to 2 | one gentle detail thin |
| floor | sustained failure at `low` | (low has no further auto-demote; `static` only via reduced-motion/boot) | — |

The asymmetric recovery (`RECOVER_COOLDOWN` 8 s, gated incline) and the **one-way tier ratchet** are what
make this *sustained-safe*: over a 2–3 minute session the device only gets hotter, so the controller walks
*down* the ladder in slow, invisible steps and **settles** — it never climbs back up only to immediately
fall, which is the thrash that reads as a bug. The default `flipflops = Infinity` would let it oscillate
forever; pinning `flipflops = 3` forces a decisive tier demotion after three indecisive flips, ending the
hunt.

**LOD / fallback / static tier:** the full ladder above terminates at `static` only via boot
(reduced-motion or detected-weak); at runtime the floor is `low` with `perf 0`. `static` at runtime would
mean freezing the whole world mid-session, which is *more* jarring than a soft `low` — so `static` is a
boot decision, not a runtime rung. This is deliberate: the runtime ladder's job is to keep the world
*alive and moving* at a sustainable fidelity, not to kill it.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**
1. Build `TIERS` + `detectTier()` + the `forge.perf` trim curve **first**, wire `forge.quality` off the
   probe (replacing the hardcoded `'high'`). *Then* tune looks — never tune on an untiered scene (§10).
2. Verify the boot classification on **real hardware**: an iPhone 15 → `high`, an older iPhone/SE → still
   `high` at boot but watch it demote within seconds, an obviously-weak Android → `low`, a reduced-motion
   toggle → `static`. The string sniff returning `"Apple GPU"` on iOS is *expected* — confirm the
   coarse-pointer branch catches it.
3. Tune the *static* tiers until each holds 60 **cold** on the device. Only then add `PerformanceMonitor`.
4. Tune the ladder **after a sustained run**, not cold. Scroll the full journey for 3 minutes on a real,
   warm iPhone (remote Web Inspector + on-screen `r3f-perf` in `?debug`) and watch whether the rungs drop
   smoothly and *settle*, or whether they pulse. Widen `bounds` / lengthen `ms` / raise `RECOVER_COOLDOWN`
   until the pulse is gone.

**Pitfalls (each has bitten this class of build):**
- **Trusting the GPU string on iOS.** It is masked to `"Apple GPU"` for *every* iPhone since 2020. A probe
  that branches on the renderer string to tell a 15 from an SE will silently misclassify on the judge
  device. Treat the masked token as "capable + let the ladder catch it."
- **`deviceMemory` on Safari.** It is `undefined` (Chrome-only API). Defaulting to a *low* number would
  wrongly demote every iPhone. Default to a neutral `4` and let the coarse-pointer branch decide.
- **A blocking boot benchmark.** Rendering a benchmark frame *before* first paint stalls the very device
  you are protecting and inflates INP. If you benchmark, do it **behind the loader, after `compileAsync`.**
- **Default `PerformanceMonitor` for thermal.** The `[40,60]` bounds + `step 0.1` + `flipflops Infinity`
  defaults are tuned for cold-start hunting; on the slow thermal slope they thrash. Widen the bounds, slow
  the step, gate the recovery, and pin `flipflops` so it latches.
- **Symmetric recovery.** Restoring a rung the instant FPS recovers, while the heat keeps climbing,
  guarantees a restore-then-redrop pulse. Recovery must be cooldown-gated and the tier demotion must be a
  one-way ratchet for the session.
- **React state in the ladder.** A `setState` from `onDecline` re-renders the tree mid-scroll → jank at the
  worst moment. Everything reads/writes the **mutable `forge` store**; only a true tier *recompile*
  (`#define` change) may touch React, and that is rare and gated by `customProgramCacheKey`.
- **Forgetting the cache key on the octave `#define`.** Dropping `GW_FBM_OCTAVES` 4→3 without reflecting it
  in `customProgramCacheKey()` makes three.js reuse the *cached 4-octave program*, so the demotion silently
  does nothing. The define must be in the cache key.
- **Leaking the probe context.** The string-sniff canvas burns a WebGL context; not freeing it with
  `WEBGL_lose_context` can exhaust Safari's ~8–16 slot cap before the real renderer even mounts.
- **Auto-promoting after `onFallback`.** Climbing back to `high` after demoting guarantees a re-drop,
  because the device is only getting hotter. Ratchet the tier down for the session; re-promote on reload.

---

## 8. SOURCES (2025–2026)

1. drei docs — "PerformanceMonitor" (props: `ms`, `iterations`, `threshold`, `factor`, `step`, `flipflops`,
   `bounds`, `onIncline`/`onDecline`/`onFallback`; hysteresis behavior). 2025–2026.
   http://drei.docs.pmnd.rs/performances/performance-monitor
2. pmndrs/drei — `src/core/PerformanceMonitor.tsx` (source of record for the verbatim defaults: `ms 250`,
   `iterations 10`, `threshold 0.75`, `factor 0.5`, `step 0.1`, `flipflops Infinity`,
   `bounds (rr)=> rr>100?[60,100]:[40,60]`; factor/flipped/refreshrate mechanics). 2025–2026.
   https://github.com/pmndrs/drei/blob/master/src/core/PerformanceMonitor.tsx
3. react-three-fiber docs — "Scaling performance" (AdaptiveDpr / PerformanceMonitor / `frameloop="demand"`
   / regress). 2025–2026. https://r3f.docs.pmnd.rs/advanced/scaling-performance
4. MDN — "WEBGL_debug_renderer_info extension" (privileged-context gating; ~90% availability; iOS masking
   context). 2025. https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
5. BrowserLeaks — "WebGL Browser Report / Fingerprinting" (Safari returns `Apple GPU` / `Apple Inc.` since
   iOS 12.2 / Feb 2020; all iOS devices return the same string). 2025–2026.
   https://browserleaks.com/webgl
6. pmndrs/detect-gpu — npm/README (`getGPUTier` API, tiers 0–3, `BENCHMARK`/`FALLBACK` result types, and
   the 2025 note "benchmark data source gfxbench.com stopped updating December 2025"). 2025–2026.
   https://www.npmjs.com/package/detect-gpu
7. 51Degrees — "Renderer" / "Website Optimisation for Apple devices" (GPU-hashing to recover the chip class
   despite the masked iOS string; the privacy-adjacent alternative we reject). 2025.
   https://github.com/51Degrees/Renderer ·
   https://51degrees.com/blog/website-optimisation-for-apple-devices-ipad-and-iphone
8. Codrops (Tympanus) — "Building Efficient Three.js Scenes: Optimize Performance While Maintaining
   Quality" (DPR clamping on handsets, half-res post, adaptive quality). 11 Feb 2025.
   https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
9. Codrops (Tympanus) — "When Community Becomes UI: Building the Website for the First Three.js Conference"
   (shipped "an adaptive performance system that gives each device the best visual quality it can handle").
   28 Feb 2026.
   https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/
10. Notebookcheck — "Severe iPhone 15 Pro Max thermal throttling … A17 Pro … 48 °C during gaming" (the
    sustained-decline / 78% throttle data that drives the slope-tuned ladder). 2025.
    https://www.notebookcheck.net/Severe-Apple-iPhone-15-Pro-Max-thermal-throttling-reported-as-A17-Pro-appears-to-push-surface-temperatures-to-48-C-during-gaming.753143.0.html
11. GSMArena — "Apple iPhone 15 Pro Max review: stress tests" (sustained CPU 78%, GPU Wildlife 70% / Solar
    Bay 60% stability — the throttle envelope). 2025. https://www.gsmarena.com/apple_iphone_15_pro_max-review-2618p5.php
12. mdn/browser-compat-data Issue #21351 + MDN — "EXT_disjoint_timer_query_webgl2 … enabled on Safari 17.1"
    (GPU-time queries available but `GPU_DISJOINT_EXT` fires under throttle → dev-only, not production
    driver). 2025. https://github.com/mdn/browser-compat-data/issues/21351 ·
    https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query
13. Utsubo — "100 Three.js Tips That Actually Improve Performance (2026)" (program reuse / cache-key
    discipline; `<100` draw calls holds 60). 2026. https://www.utsubo.com/blog/threejs-best-practices-100-tips
14. Krapton — "Boosting React Three Fiber Mobile Performance in 2026: A Deep Dive" (PerformanceMonitor +
    AdaptiveDpr ladder pattern on mobile). 2026.
    https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c

---

## 9. DEEP-DIVE CANDIDATES

- **9.1 The invisible deferred micro-benchmark loop.** Build and validate the `confirmTier` off-critical-
  path benchmark: how many frames, what offscreen size, what ms threshold maps to a reliable
  "won't-sustain" pre-demotion, and how to fold a *re-benchmark on `visibilitychange`* (tab refocus after
  the device cooled) into a safe single re-promotion — the only sanctioned escape from the floor ratchet.
- **9.2 Page Visibility + thermal-budget pacing.** Couple the ladder to `document.visibilitychange` and
  `requestIdleCallback`: pause the render loop (`frameloop="demand"`) when the tab is hidden so the device
  *cools* off-screen, and resume warm-aware. Quantify how much sustained headroom a disciplined
  visibility-pause buys over a 3-minute session.
- **9.3 EXT_disjoint_timer_query per-pass attribution in `?debug`.** A dev-only HUD that times the slab
  shader vs bloom vs the merged grade pass via the timer query (handling the disjoint-under-throttle flag),
  so the ladder's *order* (which knob to drop first) is tuned from real per-pass GPU nanoseconds on the
  device rather than guessed.
- **9.4 TSL/WebGPU portability of the trim system.** Author the `GW_FBM_OCTAVES` octave-LOD as a TSL
  node-graph parameter so the same uniform-thinning ladder drives a future `WebGPURenderer` build, and
  benchmark whether WebGPU's lower draw-call overhead changes where the thermal knee sits (topic 30, 39).
