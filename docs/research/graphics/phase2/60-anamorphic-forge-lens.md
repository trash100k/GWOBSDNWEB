# 60 — Anamorphic Forge-Lens Grade (warm-only)

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **I-camera-motion**. Builds on Phase-1 **28
(cinematic-camera-dof)** and **20 (bloom + post stack)**, and on Phase-2 **35 (bloom budget & OLED banding)**,
**38 (temperature-coupled post bus)**, **39 (master forge uniform pool `U`)**, and **58 (pour-front-locked
rack-focus)** — which named this exact build as its deep-dive candidate #3. Target: iPhone 15 (OLED), one
WebGL2 renderer (r3f / three.js r17x), warm-forge palette. Topic: a **subtle horizontal bokeh stretch + oval
iris + a warm flare streak on the white-hot pour-front** — true anamorphic cinema cues, **warm only, no
rainbow** — measured against the iPhone-15 budget and bound to the one master temperature/uniform system. The
whisper-of-glass finish that pushes the cinematic read from "very good 3D" to "photographed on a 2x squeeze."_

> **Reads on top of:** `00-COHESION-MAP.md` (§3 the palette-as-bloom-selector + the OLED grade; §5.1
> emissive-as-the-only-light; §6 the load-bearing post order — lens physics → light → grade → grain → AA, with
> the streak as a CONVOLUTION pass that must sit beside bloom; §7 rule 3 "only the 10% accent exceeds 1.0",
> rule 6 "one clock, dt-damped", rule 7 "one bloom contract, one grade"; §10 the fill-rate budget); Phase-1
> **28** (the lens — fov, dolly-zoom, CA/vignette "glass", particle-CoF embers, `worldFocusDistance` DOF);
> Phase-2 **35** (the bloom mip pyramid, the half-float floor, the dither — the streak shares that pyramid and
> that dither); Phase-2 **38** (the `forgeHeat` bus — the streak intensity is one more fanned-out consumer);
> Phase-2 **58** (the rack-focus — the streak rides the SAME `forge.focusDist`/CoF the embers and DOF read, so
> a defocused front gets a bigger oval). This doc owns the **anamorphic grade**: the oval-ization of the
> defocus, the warm horizontal streak on the hottest cluster, and the `2x`-squeeze cues — nothing else.

---

## 1. SCOPE — this element in the GAELWORX world

The single most-watched object in GAELWORX is the **white-hot leading edge of the pour** — the >1 HDR front of
living metal running the Celtic channels and flooding the letters, plus the eternal white-gold **A** and **E**.
Doc 28 gave it a lens (DOF, fov, CA, vignette); doc 58 locked focus to it; doc 35 made it bloom on true black.
This doc adds the one finishing cue those leave on the table: the **anamorphic signature** — the optical
fingerprint that says "this was shot on a cinema anamorphic, not a phone." It is the difference between a
bright halo and a bright halo that **streaks horizontally, ovals its bokeh, and stretches its frame** the way
a 2x-squeeze lens does. In a film-graded, pure-void forge that is reaching for Lusion / Unseen / Unreal-
cinematic caliber, the anamorphic cue is the highest-leverage *whisper* left: it costs little, it is unmistakably
"cinema," and it is exactly the kind of detail the judge feels without being able to name.

The brief is precise and constraining: **(a)** a subtle **horizontal bokeh stretch** — the out-of-focus pour
edge and the defocused embers ovalize rather than staying circular; **(b)** an **oval iris** — the defocus
kernel itself is an ellipse (wider than tall), so even the in-focus-adjacent CoC reads anamorphic; **(c)** a
**warm flare streak** — a single horizontal lance of light off the white-hot front and the A/E, the anamorphic
"blue streak" made **warm** (ember-gold, never the stock cyan/blue/rainbow); and the hard rule running through
all three: **WARM ONLY, NO RAINBOW.** Real anamorphic flares are famously *blue* and real lens-flare ghost
chains are *chromatic* (rainbow caustic rings). Both are **forbidden** here — they would violate the brand law
(no cool/green/blue ever enters the grade; cohesion-map §3.3) and shatter the pure-warm forge world. We take
the anamorphic *geometry* (horizontal stretch, oval bokeh, streak) and strip its *chromaticity*, tinting every
photon to the `PAL` warm ramp. This is the unusual, on-brand constraint that makes the build interesting:
**anamorphic shape, forge color.**

Why it is legitimately anamorphic and not a gimmick: a real anamorphic system behaves as **two lenses, one for
the horizontal FOV and one for the vertical**, with different magnification per axis — so out-of-focus
highlights spread *more vertically than horizontally* (which is why bokeh balls are vertical ovals optically),
while flares and the overall squeeze read as horizontal streaks (No Film School / Filmmaker IQ / DIYPhotography,
2025–2026). GAELWORX adopts the *cinematic read* of that physics — the horizontally-stretched streak and the
ovalized highlight that the audience associates with "anamorphic / widescreen / cinema" — without simulating a
literal squeeze-and-desqueeze pipeline (which would distort the whole frame and fight the Iron-Grid layout).

Hard constraints inherited from the world: **one WebGL renderer / one composer / one `useFrame` writer**;
strict iPhone-15 fill-rate budget (the streak is a downsampled separable pass — affordable, but tier-gated);
**no runtime EXR**; warm-forge palette; the streak must **share the bloom pyramid and the OLED dither** (doc
35), **ride the `forgeHeat` bus** (doc 38), and **read the shared focal plane** `forge.focusDist`/CoF (doc 58)
so it cannot disagree with the rest of the world about where the hot, in-focus metal is. Files under the knife:
`src/scene/Effects.jsx` (the new `<AnamorphicStreak>` effect + the oval-iris DOF tweak), `src/scene/forgeUniforms.js`
(the streak's `U` reads), `src/scene/Embers.jsx` (the ember point-sprite oval stretch), and `src/store.js`
(the `forgeHeat`→streak-intensity mapping).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The element decomposes into three independent sub-effects, each with its own technique tree: **(A)** the warm
horizontal **streak** (the flare lance); **(B)** the **oval bokeh / oval iris** (the defocus shape); **(C)** the
per-point **ember oval stretch** (the cheap, every-tier carrier). Plus a cross-cutting **(D)** warm-only color
discipline that all three obey.

### 2A. The warm horizontal streak

**2A.1 — Separable horizontal-stretch bloom (the KinoStreak / Wronski lineage) — RECOMMENDED.** The canonical
real-time anamorphic streak is *not* a sprite — it is a **threshold + horizontally-stretched blur** of the HDR
scene. Keijiro's `KinoStreak` (the reference Unity implementation, still the cited basis in 2025–2026 round-ups)
is a three-stage pyramid: **(1) Prefilter** — shrink the buffer *horizontally* and apply a luminance threshold
so only the brightest, >1 pixels survive; **(2) Downsample** — descend a mip chain blurring *along X only*;
**(3) Upsample** — climb back, accumulating each stretched mip with a `_Stretch` weight, tinted by `_Color` and
scaled by `_Intensity`. The horizontal-only blur is what turns a bright point into a *lance*. Bart Wronski's
foundational write-up frames the whole effect as "lens effects happening in 2x-squeezed texture space — squeeze
the smaller blur buffers by 2 horizontally, blur normally, unsqueeze" — i.e. the stretch is free if you blur in
an anisotropically-scaled buffer. MJP's lens-flare retrospective (therealmjp.github.io) confirms the lineage:
find bright sources in HDR, add the chain "all done in HDR with bloom and anamorphic stretching."
- **Quality:** Excellent — a true light *lance* off the hot front, not a pasted sprite; it bends/tracks with the
  source because it *is* the source's own threshold blur.
- **Perf:** Cheap — it is the **same downsample-blur-upsample machinery as `mipmapBlur` bloom**, run X-only at
  low resolution. On a half-res buffer, a 6-level X-only chain is a handful of tiny fullscreen passes.
- **Mobile:** Affordable tier-gated; folds conceptually into the bloom pyramid GAELWORX already pays for (§6).
- **Cohesion-fit:** **Maximal** — it thresholds the *same* >1 accent band the palette-as-bloom-selector contract
  already defines (doc 35 §2.4, cohesion-map §3.1). The streak blooms exactly the metal that already blooms.
  **The pick.**

**2A.2 — three.js TSL `anamorphic()` node (the WebGPU/Phase-3 native form).** three r17x ships
`AnamorphicNode` (`three/addons/tsl/display/AnamorphicNode.js`), exposed as
`anamorphic(node, threshold = 0.9, scale = 3, samples = 32)` — a TSL post node that thresholds luminance and
smears horizontally over `samples` taps, with `scale` setting the streak length and `samples` trading runtime
for flare size. It is the *native, node-graph* embodiment of 2A.1 (Three.js Roadmap, "Complete Guide to
Post-Processing in 2026"; three.js docs `AnamorphicNode`). It is **exactly the effect we want**, and it is the
authored-portable target — but it runs on `WebGPURenderer`, and betting the judge device on the less-tested
WebGL2-fallback path is the documented mistake (cohesion-map §10; Heckel's TSL field guide, Oct 2025, on uneven
iOS Safari WebGPU coverage). **Deferred future; author the WebGL streak so the port is a re-host** — our
`threshold`/`scale`/`samples`/`tint` map 1:1 onto the node's params.
- **Verdict:** The Phase-3 form of 2A.1. Same params, same look, node-graph plumbing. Not the judge build.

**2A.3 — Ultimate Lens Flare / sprite-chain flare (ektogamat, andersonmancini) — REJECTED for the hero.** The
popular r3f `R3F-Ultimate-Lens-Flare` Effect *has* an `anamorphic` toggle (horizontal streak) and is gorgeous,
but it is **light-position-driven** (it raycasts a 3D `position` / `followMouse`, projects to screen, and lays a
*ghost chain* — `secondaryGhosts`, `starPoints`, `starBurst`, `haloScale`, a required 16:9 **dirt texture**).
That model is wrong for GAELWORX three ways: **(1)** the hot subject is a *moving emissive surface* (the pour
front + A/E), not a point light — we have no single `position`; **(2)** the **ghost chain is inherently
chromatic** (rainbow caustic rings) — the exact rainbow the brief forbids; **(3)** it needs a **bundled dirt
texture** and adds a sprite pass. We want the *streak only*, warm, sourced from the scene's own HDR threshold —
not a flare-ghost system bolted over it. **Reject the system; the `anamorphic`-streak *concept* is delivered by
2A.1 instead.** (We may borrow its single `colorGain` idea — one warm tint — and nothing else.)

**2A.4 — three.js `Lensflare` / `LensflareNode` (the engine built-ins).** `Lensflare` is the classic
sprite-mesh flare anchored to a light; `LensflareNode` is a bloom-based node flare ("requires extracting the
bloom of the scene via a bloom pass first"). Both are **light-anchored and ghost-oriented** — same mismatch as
2A.3, plus `Lensflare` is a scene object not a post effect. **Reject** for the same reasons; note `LensflareNode`
being "bloom-derived" confirms our 2A.1 instinct (the streak should be derived from the bloom threshold, not a
separate light projection).

### 2B. The oval bokeh / oval iris (the defocus shape)

**2B.1 — Anisotropic CoC scale on the existing DOF (RECOMMENDED, cheap).** GAELWORX already runs
`<DepthOfField>` on `high` (doc 28/58). The simplest, on-budget anamorphic-bokeh cue is to make its **circle of
confusion an ellipse** — scale the bokeh kernel's *vertical* extent up (or horizontal down) so out-of-focus
highlights render as **vertical ovals** (the optically-correct anamorphic bokeh shape; DIYPhotography/Filmmaker
IQ 2025–2026: anamorphic balls spread *more vertically*). In pmndrs `DepthOfField` this is a sample-offset
aspect bias in the bokeh blur. The Angénieux "Oval Iris" reference (2025–2026) confirms the *cinematic* intent:
an oval aperture creates "elongated highlights and a distinctive defocus signature" — we fake the aperture by
biasing the CoC sample distribution.
- **Quality:** Good — the defocused front and any bright defocused ember become a soft vertical oval, the
  unmistakable anamorphic bokeh tell, on the pass we already pay for.
- **Perf:** **Free** — it is a sample-offset bias inside the existing DOF kernel, not a new pass.
- **Mobile:** `high` only (DOF is `high`-gated; on `low`/`static` the oval read comes from 2C). 
- **Cohesion-fit:** High — it shapes the *same* defocus the rack-focus drives (doc 58). **The pick for `high`.**

**2B.2 — Full squeeze/desqueeze pipeline (REJECTED).** The *physically faithful* anamorphic: render to a
horizontally-squeezed buffer (e.g. 1.33x or 2x narrower), do all bokeh/bloom in that space, then desqueeze on
output. This is Wronski's "2x-squeeze" taken to the whole frame. **Rejected for GAELWORX:** it distorts the
*entire* composition (every letterform, the Iron-Grid HUD, the Ogham) — fighting the Neo-Gaelic-Brutalist
0px-grid layout — and adds a resample pass. We want the anamorphic *cues* on the *hot subject*, not a globally
squeezed world. (The streak buffer in 2A.1 *is* squeezed locally — the right scope for the squeeze.)

**2B.3 — Barrel-warp + edge ovalization (the doc-28 "glass").** Doc 28 §E already specifies a faint barrel +
vignette + edge-growing CA as the "shot-through-real-glass" cue. An anamorphic lens adds a characteristic
**mild horizontal barrel / mustache distortion** and the frame "breathing." A *very* subtle non-uniform barrel
(more horizontal than vertical curvature) reinforces the squeeze read at near-zero cost (it folds into the
existing CA/distortion grade pass). **Adopt as a whisper** — a few percent, never visible as warp, only felt.

### 2C. The ember oval stretch (the every-tier carrier)

**2C.1 — Anisotropic point-sprite CoC (RECOMMENDED, every tier).** Doc 58 §2C.3 already makes each ember a
**circle-of-confusion disc** sized by `|viewDist − focusDist| / focusRange` in the vertex shader. The anamorphic
upgrade is one line: make that disc an **ellipse** in the fragment — stretch `gl_PointCoord` horizontally (or
compress vertically) so a defocused spark is a **horizontal warm oval**, not a round dot. This is the *cheapest*
anamorphic bokeh in the build (a coordinate scale on points already drawn) and the **only** anamorphic cue that
survives to `low`/`static` where post DOF is off — so it is the carrier of the look on mobile. (Aximmetry /
DIYPhotography 2025–2026 confirm the param model: a width-to-height ratio >1 stretches the bokeh horizontally.)
- **Quality:** Excellent for points — big soft warm ovals orbiting the front = instant anamorphic read.
- **Perf:** **Free** — a `vec2` scale on `gl_PointCoord` in the ember fragment.
- **Mobile:** **Every tier.** This is the focal/anamorphic read that does not get cut.
- **Cohesion-fit:** Maximal — it reads the *same* `U.uFocusDist`/`uFocusRange` (doc 58) the DOF and streak read,
  so the ovals defocus on the one shared plane. **The pick, mandatory.**

### 2D. Warm-only color discipline (the cross-cutting brand law)

Every sub-effect above must obey: **no rainbow, no blue, warm only.** Real anamorphic streaks are blue and real
flare ghosts are chromatic; both are *banned*. The streak's `_Color`/tint is locked to the `PAL` warm ramp
(`PAL.ember`/`PAL.emberHot`/`PAL.gold` — the same accents that bloom), the oval bokeh inherits the source's warm
HDR color (no per-channel dispersion), and the faint anamorphic CA (doc 28) is kept **warm-axis only** — a
red↔orange split, *never* a red↔cyan split (which is what produces the rainbow fringe). This is the single
discipline that makes the effect on-brand instead of a generic "cinematic lens flare." (Cohesion-map §3.3: no
cool/green/blue ever enters the grade.)

**Landscape verdict:** **2A.1 (separable warm horizontal-stretch streak, sharing the bloom pyramid) + 2B.1
(oval-iris CoC bias on the `high` DOF) + 2B.3 (whisper barrel) + 2C.1 (anisotropic ember sprite, every tier),
all under 2D (warm-only).** The TSL `anamorphic()` node (2A.2) is the authored-portable Phase-3 re-host; the
lens-flare *systems* (2A.3/2A.4) are rejected (light-anchored + inherently chromatic + texture-heavy); the full
squeeze (2B.2) is rejected (distorts the brutalist grid).

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Add one new post effect — `<AnamorphicStreak>` — that thresholds the scene's >1 accent band (the same band
bloom selects), blurs it horizontally-only through a short downsampled pyramid, tints it to the warm `PAL`
accent, and adds it just beside bloom; bias the existing `high`-tier `<DepthOfField>` CoC into a vertical oval
(oval iris); stretch the ember point-sprites into horizontal warm ovals on every tier (reading the shared
`U.uFocusDist`/CoF); and keep a whisper of horizontal barrel + warm-axis-only CA in the existing grade pass.
The streak intensity is one more consumer of the `forgeHeat` bus (doc 38) — it surges with the strike and the
hot scroll, on the same heartbeat as bloom and emissive. Everything is warm-only; nothing is chromatic.**

Justification against the world and the existing docs:

- **It is the literal deep-dive remit, and it closes doc-58's candidate #3.** Doc 58 §9 named "anamorphic
  forge-lens bokeh on the front — subtle horizontal stretch + oval iris + warm flare streak, no rainbow, warm
  only, measured against the iPhone-15 budget, folds into the same CoF the embers already compute." This is that
  build, scoped exactly.
- **The streak is the same metal, one optical step further out.** It thresholds the *same* >1 accent band
  (`PAL.hot`/`emberHot`/`gold`/`divine`) that the palette already declares as "what blooms" (doc 35 §2.4,
  cohesion-map §3.1). The streak does not invent its own "what flares" — the palette is the selector for the
  streak exactly as it is for bloom. The white-hot front and the A/E lance because they are the hottest; the
  deep-crimson mass and the void do not, by construction. **No private flare logic.**
- **It rides the one `forgeHeat` bus.** Streak `intensity` is the eighth fan-out of doc 38's bus (after
  emissive, bloom, exposure, sat, sparks, god-rays, haze) — a cheap scalar, damped, surged by the strike. When
  the forge runs hot the veins brighten, the bloom widens, **and the streak lances** in the same frame. That
  synchrony is the cohesion proof (cohesion-map rule 6).
- **It reads the one focal plane.** The oval bokeh (DOF) and the ember ovals both read `forge.focusDist`/
  `U.uFocusDist`/`uFocusRange` (doc 58) — the same plane the rack-focus chases the pour-front on. A defocused
  front gets a *bigger* oval; the in-focus front stays a tight lance. The lens cannot disagree with the metal.
- **It honors the bloom contract and the OLED grade.** The streak is a `CONVOLUTION` pass placed beside bloom,
  *before* the grade and the dither, on the half-float buffer — so its >1 warm light survives, blooms through
  its own defocus, and is dithered into the void with the same blue-noise TPDF that guards the gradient (doc 35).
  No second composer, no per-route flare pass.
- **It is warm-only — on brand.** The whole point of choosing the *separable threshold streak* over a
  *lens-flare ghost system* is that the threshold streak has **no inherent chromaticity** — it is whatever color
  we tint it, and we tint it forge-warm. The brand law (no blue/green/cool) is satisfied by construction, not by
  fighting a rainbow the effect wants to produce.
- **It survives the tier drop.** The ember oval (2C.1) is free and every-tier; the look does not vanish on
  `low`/`static`. The expensive streak/oval-iris are `high`-gated; the cheap carrier holds the read.
- **Brand motion.** Streak intensity and CoF are `damp()`'d — no overshoot, no bounce. The streak *arrives* with
  the strike (Brutalist Snap), it does not spring.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `@react-three/postprocessing` **v3.0.4** (2025-02-20) + `postprocessing` ≥ 6.3x — **already in the repo**.
  The streak is a **custom `Effect`** subclass (the documented pmndrs extension path — "extend `Effect`, write a
  `mainImage`"); it folds into the merged `EffectPass` discipline (cohesion-map §6) or runs as its own
  `CONVOLUTION` pass beside bloom. **No new heavy dep.**
- `three` r17x — `THREE.HalfFloatType` (already on the composer, doc 35), `THREE.MathUtils.damp`, `Vector2`.
- One **no-texture** path: the streak is pure ALU + scene-texture taps (no dirt texture, no EXR — hard
  constraint). The oval bokeh is a sample-offset bias (no asset). The ember oval is a `gl_PointCoord` scale.
- `leva` — already present, for `?debug` tuning of `streakLen`, `streakIntensity`, `ovalAspect`, `streakTint`.
- **Phase-3 portability:** the WebGL streak's `{threshold, scale, samples, tint}` map 1:1 onto TSL
  `anamorphic(node, threshold, scale, samples)` + a warm tint multiply — the re-host is a node swap.

### 4.2 The warm horizontal-streak effect (`AnamorphicStreak`)

The streak is the KinoStreak pyramid (2A.1) reduced to a GLSL fragment that runs the prefilter+blur in one pass
on the **half-res HDR buffer** (the same resolution bloom uses, doc 35). It thresholds the >1 accent, smears
**X-only** over `samples` taps with a falloff, tints warm, and adds:

```glsl
// AnamorphicStreak — warm horizontal flare lance off the hot/A-E pixels.
// Runs on the HALF-RES HDR buffer, beside bloom (CONVOLUTION pass), warm-only, NO rainbow.
uniform sampler2D uScene;      // HDR scene (half-float) — same buffer bloom reads
uniform vec2  uTexel;          // 1/resolution of the half-res buffer
uniform float uThreshold;      // ~0.9 — only the >1 accent band streaks (palette = selector)
uniform float uStreakLen;      // horizontal reach in texels (scale)
uniform float uIntensity;      // rides forgeHeat (doc 38) — strike surges it
uniform vec3  uTint;           // PAL.emberHot/gold — WARM. The "no rainbow" lock.
const int SAMPLES = 16;        // tier: 16 high / 8 low (compile-time #define)

vec3 prefilter(vec3 c){
  // soft-knee threshold: keep only what exceeds the accent floor (matches bloom's knee, doc35)
  float l = max(max(c.r, c.g), c.b);
  float k = clamp((l - uThreshold) / max(1e-3, uThreshold), 0.0, 1.0);
  return c * k;                // >1 accent survives; void + deep-crimson mass → 0 (no haze, no rainbow)
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec3 streak = vec3(0.0);
  float wsum = 0.0;
  // X-ONLY smear: this is the entire anamorphic geometry — a lance, not a disc.
  for (int i = -SAMPLES; i <= SAMPLES; i++){
    float t = float(i) / float(SAMPLES);
    float w = exp(-t * t * 3.0);                 // gaussian-ish falloff → soft lance tips
    vec2  o = vec2(t * uStreakLen, 0.0) * uTexel; // HORIZONTAL only (y stays 0)
    streak += prefilter(texture2D(uScene, uv + o).rgb) * w;
    wsum   += w;
  }
  streak = (streak / wsum) * uTint * uIntensity; // warm tint = the no-rainbow guarantee
  // ADD (this is light, like bloom) — additive so it blooms through and survives tone-map
  outputColor = vec4(inputColor.rgb + streak, inputColor.a);
}
```

Notes that make it correct and cheap:
- **X-only is the whole trick.** The `vec2(t*uStreakLen, 0.0)` offset (`y == 0`) is what turns a hot point into a
  horizontal lance. There is no vertical term anywhere in the streak — that asymmetry *is* anamorphic.
- **Half-res + 16 taps.** On the half-res buffer bloom already runs (doc 35), a 33-tap (`±16`) X-only blur is
  one cheap fullscreen pass. For a *longer* reach without more taps, run it as a 2-level mini-pyramid (downsample
  X by 2, blur, upsample) — the KinoStreak structure — but the single-pass 16-tap is the mobile default.
- **Prefilter knee matches bloom.** `uThreshold ≈ 0.9` (the TSL `anamorphic()` default) is *above* the bloom
  threshold (`0.58`, doc 35) so the streak is *more* selective than the bloom — only the **white-hot front and
  the A/E** lance, the cooling forge-red letters merely bloom. That keeps the streak a rare, sacred accent, not a
  smear on every warm pixel.
- **Warm tint = the brand lock.** `uTint = PAL.emberHot` (or a hot→gold ramp by `forgeHeat`) is multiplied in, so
  the lance is *always* forge-colored regardless of the source pixel — the "no rainbow, warm only" guarantee is
  one `* uTint`, not a fight against chromatic dispersion.

The r3f wrapper (a thin custom-Effect component, sitting beside `<Bloom>`):

```jsx
// src/scene/Effects.jsx — beside <Bloom>, BEFORE the grade pass, on the half-float buffer
{high && (
  <AnamorphicStreak
    ref={streakRef}
    threshold={0.9}          // more selective than bloom — only the hottest lances
    streakLen={64}           // horizontal reach (texels) — modest; a lance, not a laser
    tint={PAL.emberHot}      // WARM — the no-rainbow lock
    intensity={0.0}          // base 0; rides forgeHeat in useFrame (doc 38)
  />
)}
```

### 4.3 The oval iris (CoC bias on the `high` DOF) — `Effects.jsx`

Bias the existing `<DepthOfField>` bokeh into a **vertical oval** so out-of-focus highlights ovalize. In pmndrs
`DepthOfField` the bokeh is a radial sample set; an anamorphic iris scales the sample offsets per-axis. If the
pinned version doesn't expose an aspect prop, set it on the underlying effect's bokeh material via `ref`
(`uniforms.get('scale')`-style), or apply the bias in a tiny patched bokeh kernel:

```glsl
// inside the DOF bokeh sample offset — ovalize the CoC (anamorphic iris)
// uOvalAspect > 1 → bokeh taller than wide = the optically-correct anamorphic ball
vec2 sampleOffset = bokehDir * coc * vec2(1.0 / uOvalAspect, 1.0); // squeeze X, keep Y → vertical oval
```

```jsx
// keep it a WHISPER — overdone reads as a render bug
const OVAL_ASPECT = 1.35;  // 1.0 = round (off), ~1.3–1.5 = felt-not-seen anamorphic ball
```

This is **free** (a per-axis scale inside the kernel we already run) and `high`-only (DOF is `high`-gated).

### 4.4 The ember oval stretch (every tier) — `Embers.jsx` GLSL

The ember sprite already computes a CoC-driven disc from the shared focal plane (doc 58 §4.6). Ovalize it:

```glsl
// Embers fragment — anamorphic oval bokeh on the defocused sparks (EVERY tier).
// vCoc, uFocusDist/Range come from the shared U pool (doc 58). uEmberOval ~1.6 horizontal.
vec2 pc = gl_PointCoord - 0.5;
pc.x /= uEmberOval;                                  // stretch HORIZONTALLY → warm oval (anamorphic)
float r = length(pc);
float edge = mix(0.5, 0.05, vCoc);                   // sharp dot in focus → soft oval defocused
float a = smoothstep(0.5, edge, r);
gl_FragColor = vec4(uColor, a * (1.0 - vCoc * 0.55));// uColor = warm PAL — never chromatic
```

A spark riding the in-focus front stays a near-round tight pinpoint (`vCoc≈0`, oval barely visible); a spark
drifting out of focus blooms into a **soft warm horizontal oval** — the anamorphic read, on a point already
drawn, on **every tier including `static`**. This is the carrier of the look when the post streak/oval-iris are
cut.

### 4.5 The streak rides the `forgeHeat` bus — `store.js` / the driver

Streak `intensity` is the eighth consumer of doc 38's bus — feed-forward from the authored `forgeHeat`
(`scrollDamped + vel*0.25` + strike), never from measured luminance (no pumping). Damped, clamped, with a small
floor so the lance never fully dies on the hot routes:

```js
// in the ONE <ForgeDriver/> writer (doc 38), beside bloom.intensity:
const heat   = clamp(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3), 0, 1)
const strike = forge.strikeAt ? Math.exp(-(now - forge.strikeAt) * 3) : 0
const target = 0.18 + heat * 0.45 + strike * 0.8     // strike LANCES the streak (Brutalist Snap)
streakRef.current.uniforms.get('uIntensity').value =
  damp(streakRef.current.uniforms.get('uIntensity').value, target, 5.0, dt)
// warm tint ramps hot→gold with heat (still warm-only — never crosses to cool)
streakRef.current.uniforms.get('uTint').value.lerpColors(PAL.emberHot, PAL.gold, heat)
```

### 4.6 Post-chain placement (cohesion-map §6)

The streak is a `CONVOLUTION`-class pass and must sit **beside bloom**, *after* the lens physics (heat-haze,
DOF) and *before* the grade/dither/AA — so it lances the **already-defocused** hot front (the lance inherits the
oval bokeh), its >1 warm light survives into the grade, and the dither (doc 35) covers any banding the streak's
soft tips add on the void:

```
HeatHaze → DepthOfField(oval iris) → GodRays → Bloom → AnamorphicStreak
  → CA(warm-axis only) → HueSaturation → BrightnessContrast → Vignette(+whisper barrel)
  → Dither(blue-noise TPDF) → SMAA            [AgX tone-map on renderer, terminal]
```

Streak *after* bloom (not before) is deliberate: bloom gives the soft sacred halo; the streak adds the *directed*
horizontal lance *on top* — two distinct cues (round glow + horizontal lance) that together read as "anamorphic,"
where streak-before-bloom would just blur the lance back into a round smear.

### 4.7 Key params

| Param | Value (high / low / static) | Why |
|---|---|---|
| streak `threshold` | 0.9 / 0.9 / — | more selective than bloom (0.58) — only white-hot front + A/E lance |
| streak `streakLen` | 64 / 40 / — texels | modest reach — a lance, not a laser; longer = mini-pyramid not more taps |
| streak `SAMPLES` | 16 / 8 / — | compile-time `#define`; X-only blur taps |
| streak `intensity` | `0.18 + heat*0.45 + strike*0.8` | rides `forgeHeat` (doc 38); strike lances it |
| streak `tint` | `lerp(PAL.emberHot, PAL.gold, heat)` | **WARM — the no-rainbow lock** |
| DOF `ovalAspect` | 1.35 / — / — | vertical oval bokeh (anamorphic iris); whisper, not warp |
| ember `uEmberOval` | 1.6 / 1.6 / 1.6 | horizontal warm oval sprite — **every tier, the carrier** |
| barrel | ~2–3% horizontal-biased / — / — | felt squeeze; folds into CA/vignette grade pass |
| CA axis | warm only (red↔orange) | **never red↔cyan** — that is the rainbow fringe, banned |

### 4.8 Hooking the shared master temperature system

The anamorphic grade is a **pure consumer** of the world's shared systems — it adds no new authority:
- It **reads** the >1 accent band the **palette** defines (cohesion-map §3.1) via its threshold — same selector
  as bloom (doc 35). The hottest metal lances because it is the hottest, by the palette convention.
- It **reads** `forgeHeat` (doc 38) for streak intensity/tint — same bus as bloom, exposure, sparks. One
  heartbeat: strike → veins brighten + bloom widens + **streak lances** in one frame.
- It **reads** the focal plane `U.uFocusDist`/`uFocusRange` (doc 58) for the oval bokeh (DOF) and the ember
  ovals — same plane the rack-focus chases the pour-front on. The defocused front gets the biggest oval.
- It **writes nothing to the world state** — it is terminal grade. Its only outputs are pixels.
Expose `streakLen`/`intensity`/`threshold`/`ovalAspect`/`emberOval`/`tint` to `?debug` leva so the anamorphic
grade is authored on the iPhone (the squeeze read does not simulate headless).

---

## 5. COHESION — shared palette / lighting / uniforms / clock

- **Palette is the streak selector.** The streak thresholds the same >1 accent band (`PAL.hot`/`emberHot`/`gold`/
  `divine`) the palette declares as "what blooms" (cohesion-map §3.1, doc 35 §2.4). It invents no "what flares."
  The void and the 30% deep-crimson mass are below threshold → they never lance → the OLED black is preserved.
- **One bus, one heartbeat.** Streak intensity is the eighth `forgeHeat` consumer (doc 38). The strike surges
  the veins, the jewel edges, the bloom, the god-rays, **and the streak** in the same frame — that synchrony is
  the cohesion proof (cohesion-map rule 6). No second clock, no per-effect timer.
- **One focal plane.** The oval bokeh (DOF) and the ember ovals read `U.uFocusDist`/`uFocusRange` (doc 58) — the
  same plane post DOF and the embers already share. The anamorphic ovalization is *of* the world's one defocus,
  not a private blur.
- **One bloom contract, one grade.** The streak runs on the half-float buffer (doc 35) beside bloom, before the
  merged grade + the blue-noise TPDF dither, under the single AgX operator (cohesion-map §3.2). Its >1 warm light
  survives, blooms through its defocus, and is dithered into the void with the same noise that guards the
  gradient. No per-route flare pass, no second composer.
- **Warm-only, brand-locked.** The streak tint, the oval-bokeh color, and the CA axis are all warm `PAL` — no
  cool/green/blue/rainbow ever enters (cohesion-map §3.3, the brand law). This is *why* the separable threshold
  streak was chosen over a lens-flare ghost system: it has no inherent chromaticity to fight.
- **A/E keystone, no exception path.** The A/E lance *more* than cooling letters purely because their emissive is
  `gw_divineFire` (>1, never cools) which sits furthest above the streak threshold — the brand rule lives in the
  material; the streak just obeys luminance, exactly as the bloom does (cohesion-map §1.4). The white-gold A/E
  throwing a warm horizontal lance is the optical cousin of "radiate light onto adjacent stone."
- **Brand motion.** Streak intensity and the CoF are `damp()`'d — no overshoot, no bounce. The strike *lances*
  the streak (impact), it does not spring (cohesion-map rule 6).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The anamorphic grade is designed to add the cinematic cue while moving the §10 fill-rate needle almost not at
all on `high`, and **zero** on `low`/`static` (where only the free ember oval runs).

- **The ember oval is free and every-tier.** A `vec2` scale on `gl_PointCoord` in a fragment already executing
  on points already drawn — sub-microsecond, zero new pass, zero allocation. It is the *cheapest* anamorphic cue
  in the build and the **last to be cut** — a throttled phone still reads anamorphic.
- **The oval iris is free on `high`.** A per-axis scale inside the DOF bokeh kernel we already pay for — no new
  pass. Off on `low`/`static` (DOF is `high`-gated), where the ember oval carries the read.
- **The streak is the only real new cost, and it is small.** One X-only fullscreen pass on the **half-res** HDR
  buffer bloom already uses (doc 35). A 33-tap (`±16`) X-only blur at half-res ≈295×639 is cheap — comparable to
  one extra bloom level, well inside the ~2.5–3 ms post budget (cohesion-map §10). It is a `CONVOLUTION` pass
  (can't merge into the grade `EffectPass`), so it is the chain's one extra separate pass beyond bloom/DOF/SMAA
  — budgeted accordingly and `high`-gated.
- **Half-res is invisible.** The streak is low-frequency light (a soft lance) — the half-res loss does not read,
  the same logic that makes half-res bloom free (doc 35; Three.js Roadmap 2026, "half-res ~2× frame rate").
- **`#define SAMPLES` is the LOD knob.** `16` on `high`, `8` on `low` (if the streak runs at all on `low` — by
  default it does **not**; `low` gets the ember oval only). A compile-time `#define` so the loop unrolls with no
  runtime branch (cohesion-map §10 lever 3, mirroring `GW_FBM_OCTAVES`).
- **Tiers:**
  - **`high`** — `<AnamorphicStreak>` (16 taps, half-res) + oval-iris DOF + ember ovals + whisper barrel/warm-CA.
    The full anamorphic grade.
  - **`low`** — **no streak pass, no oval iris** (DOF is off → `TiltShift2`, doc 58). **Ember ovals only** + the
    vignette. The anamorphic read survives via the free carrier; the expensive cues are cut.
  - **`static` / reduced-motion** — `<Effects>` unmounted (cohesion-map §10). The ember oval (if embers render at
    all on the still poster) or a baked oval-bokeh look carries it. No live streak. The frame still reads
    cinematic via fov + vignette + crushed blacks + the warm oval read. Required floor.
- **Banding guard.** The streak's soft lance tips add a low-amplitude gradient on the true-black void — a banding
  risk. It runs *before* the blue-noise TPDF dither (doc 35), which covers it; no extra dither needed.
- **No new texture, no EXR.** Pure ALU + scene taps (streak), sample-offset bias (iris), `gl_PointCoord` scale
  (ember). The rejected lens-flare systems needed a dirt texture; this needs none (hard constraint honored).
- **Adaptive ladder.** Under `PerformanceMonitor` factor dips: drop the streak pass first (it is the one
  separate pass), then the oval iris falls out with DOF — the ember oval is **never** dropped (it is free).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Any rainbow / blue.** The #1 brand failure. Do **not** use a lens-flare ghost system (2A.3/2A.4 — inherently
   chromatic), do **not** split CA on the red↔cyan axis, do **not** leave the streak untinted (a white streak on
   a warm world reads cool). Tint the streak `PAL.emberHot→gold`, keep CA warm-axis only. Warm tint is one
   `* uTint`; it is the entire no-rainbow guarantee.
2. **Streak threshold too low → smear, not lance.** If `uThreshold` drops near the bloom threshold (0.58), the
   whole warm world streaks and the void hazes (the doc-35 haze failure, now horizontal). Keep streak threshold
   *above* bloom (~0.9) so only the white-hot front + A/E lance. The streak is a *rare sacred accent*, not a
   filter on every warm pixel.
3. **Streak too long / too bright → laser, not lens.** A long, intense lance reads as a sci-fi laser or a render
   bug, not a cinema lens. Keep `streakLen` modest (~64 texels) and `intensity` whispered (peaks <1 except on a
   strike). The *softness and the directedness*, not the length, sells anamorphic.
4. **Streak before bloom.** Blurs the lance back into a round smear — you lose the directed horizontal cue that
   *is* anamorphic. Streak **after** bloom (round halo first, directed lance on top). (§4.6.)
5. **Oval iris too strong → broken-render look.** `ovalAspect > ~1.6` reads as a stretched/squashed bug. Keep it
   1.3–1.5 — felt, not seen. Same for the barrel (2–3%, never a visible warp).
6. **Wrong oval axis.** Optically, anamorphic *bokeh balls* are **vertical** ovals (more vertical spread) while
   *streaks/flares* are **horizontal** (DIYPhotography/Filmmaker IQ 2025–2026). Get them backwards (horizontal
   bokeh + vertical streak) and it reads wrong to anyone who knows the look. **DOF oval = vertical; streak =
   horizontal; ember sprite = horizontal** (the ember is a flare-like point, not a precise bokeh disc, so
   horizontal reads correctly and matches the streak axis).
7. **Full-frame squeeze (2B.2).** Distorts the Iron-Grid layout and every letterform. Squeeze the *streak buffer*
   locally (it's already low-res), never the world.
8. **Driving streak intensity off measured luminance.** That is the auto-exposure pump (doc 38 §2.2) applied to
   the flare — it will throb. Feed-forward from the authored `forgeHeat`, never from a frame-luminance read.
9. **Full-res streak on mobile.** Budget blowout for no visible gain (the lance is low-frequency). Half-res,
   `high`-gated, ember-oval-only on `low`.
10. **Tuning on desktop and declaring victory.** The squeeze read — oval softness, lance subtlety, warm-vs-cool,
    the banding on the void — does **not** simulate headless. SwiftShader (`qa-route`) proves it compiles (0
    console errors); the iPhone-15 OLED proves it reads as a lens and not a bug.

**Order of operations**
1. **Ember oval first (every tier, free).** Add the `gl_PointCoord` X-scale in `Embers.jsx`, reading the shared
   `U.uFocusDist`/`uFocusRange` (doc 58). Verify a defocused spark is a soft warm horizontal oval and an in-focus
   spark is a tight pinpoint — on a throttled device too. This is the carrier; prove it before any post pass.
2. **The streak pass (`high`).** Add `<AnamorphicStreak>` beside bloom, on the half-float buffer, *after* bloom,
   *before* the grade. Confirm it thresholds *above* bloom (only the white-hot front + A/E lance), is X-only
   (a horizontal lance), and is tinted warm. Tune `streakLen`/`threshold` in `?debug` until it's a whisper.
3. **The oval iris (`high`).** Bias the DOF CoC into a vertical oval (`ovalAspect ~1.35`). Verify defocused
   highlights ovalize vertically; keep it felt-not-seen.
4. **Wire `forgeHeat`.** Make streak intensity/tint a `forgeHeat` consumer in the one `<ForgeDriver/>` (doc 38),
   damped, strike-surged, clamped, warm-only. Verify a strike lances the streak in the *same frame* the veins
   brighten and bloom widens.
5. **The whisper barrel + warm CA** in the existing grade pass — a few percent, warm-axis only.
6. **Banding check.** Confirm the streak's soft tips don't band the void (the blue-noise TPDF dither, doc 35,
   should cover it; raise dither floor only if needed).
7. **QA** (`qa-route`/`post-fx`): `npm run build` green (SwiftShader compiles the GLSL → 0 console errors),
   Playwright at 393×852 + 1440×900, no NaN at scroll extremes, `renderer.info` flat across nav — **then the
   iPhone 15 OLED read**: the warm lance off the white-hot front, the vertical oval bokeh, the horizontal ember
   ovals, no rainbow, no laser, no broken-render warp. None of those simulate headless.

---

## 8. SOURCES (2025–2026)

1. **three.js docs — `AnamorphicNode` (TSL `anamorphic()`)** (mrdoob/three.js, r17x, current 2025–2026). The
   native node-graph anamorphic flare: `anamorphic(node, threshold = 0.9, scale = 3, samples = 32)` — thresholds
   luminance, smears horizontally over `samples` taps, `scale` sets streak length; returns a texture node;
   imported from `three/addons/tsl/display/AnamorphicNode.js`. The authored-portable Phase-3 target whose params
   map 1:1 onto our WebGL streak. https://threejs.org/docs/pages/AnamorphicNode.html
2. **Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026"** (2026). The r183 RenderPipeline
   / TSL node post chain (`bloom()`, `anamorphic()` as TSL functions), WebGPU-native with auto WebGL2 fallback,
   and the half-res-bloom ~2× frame-rate guidance the streak's half-res buffer relies on.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
3. **keijiro/KinoStreak — "Anamorphic lens flare effect for Unity"** (GitHub; reference implementation, cited in
   2025–2026 round-ups). The canonical real-time anamorphic streak: Prefilter (shrink horizontally + threshold) →
   Downsample (blur along X) → Upsample (accumulate stretched mips with `_Stretch`, tint `_Color`, scale
   `_Intensity`) — "horizontally stretched bloom that roughly resembles anamorphic lens flares." The structure
   our `AnamorphicStreak` reduces to one half-res pass. https://github.com/keijiro/KinoStreak
4. **Bart Wronski — "Anamorphic lens flares and visual effects"** (bartwronski.com; foundational, re-surfaced in
   2025–2026 anamorphic round-ups). The "2x-squeezed texture space" framing — squeeze the smaller blur buffers by
   2 horizontally, blur normally, unsqueeze — and the threshold-drives-flaring mechanic; why the stretch is
   essentially free in an anisotropically-scaled buffer. https://bartwronski.com/2015/03/09/anamorphic-lens-flares-and-visual-effects/
5. **MJP (Matt Pettineo) — "Anamorphic lens flares: the lens flare of the 2010s?"** (therealmjp.github.io;
   surfaced in 2025–2026 searches). Find bright sources in HDR, add the chain "all done in HDR with bloom and
   anamorphic stretching" — confirms the streak should be derived from the scene's own HDR threshold, not a
   projected light. https://therealmjp.github.io/posts/lens-flares/
6. **ektogamat/R3F-Ultimate-Lens-Flare** (GitHub + Three.js Resources, current 2025–2026). The popular r3f
   lens-flare `Effect` with an `anamorphic` (horizontal streak) toggle, `colorGain` tint, `starPoints`,
   `secondaryGhosts`, `starBurst`, required 16:9 dirt texture, and light-`position`/`followMouse` projection — the
   *rejected* system (light-anchored, inherently chromatic ghost chain, texture-heavy); its single warm
   `colorGain` idea is the only thing borrowed. https://github.com/ektogamat/R3F-Ultimate-Lens-Flare ·
   https://threejsresources.com/tool/ultimate-lens-flare-for-react-three-fiber
7. **No Film School — "Why Do Anamorphic Bokeh Balls Look Like That?"** and **Filmmaker IQ — "Why are Anamorphic
   Bokeh Oval"** (current 2025–2026). The optical mechanism: an anamorphic system behaves as two lenses (one per
   axis) with differential magnification, so out-of-focus highlights ovalize and flares streak horizontally — the
   cinematography the doc encodes (vertical bokeh oval, horizontal streak). https://nofilmschool.com/anamorphic-bokeh-balls ·
   https://filmmakeriq.com/why-are-anamorphic-bokeh-oval/
8. **DIYPhotography — "This is why anamorphic lenses have oval bokeh… it's nothing to do with the aperture"** and
   **Aximmetry — "Stretch Factor / Anamorphic Bokeh"** (current 2025–2026). The two-axis spread that produces
   ovals, and the real-time param model: a width-to-height ratio >1 stretches bokeh horizontally — the
   `uEmberOval` / `ovalAspect` knobs. https://www.diyphotography.net/this-is-why-anamorphic-lenses-have-oval-bokeh-its-nothing-to-do-with-the-aperture/ ·
   https://my.aximmetry.com/post/3248-stretch-factor-anamorphic-bokeh
9. **Angénieux — "The Angénieux Oval Iris: Shaping Anamorphic-Style Bokeh from Within"** (angenieux.com,
   2025–2026). An oval aperture creates "elongated highlights and a distinctive defocus signature directly within
   the lens" — the cinematic justification for the oval-iris CoC bias (§4.3). https://www.angenieux.com/the-angenieux-oval-iris-shaping-anamorphic-style-bokeh-from-within/
10. **react-postprocessing docs — `Bloom` + custom `Effect` extension** (pmndrs, current 2025–2026). The
    `mipmapBlur` threshold-bloom the streak shares its half-res HDR buffer and selector-threshold with, and the
    "extend `Effect` / write `mainImage`" custom-effect path the `AnamorphicStreak` uses. https://react-postprocessing.docs.pmnd.rs/effects/bloom
11. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). The TSL node post pipeline and the candid
    status that iOS Safari WebGPU has landed but coverage is uneven — why the native `anamorphic()` node is the
    deferred Phase-3 re-host, not the WebGL2 judge build. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
12. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Ming Jyun Hung, 2026-04-21). The TSL
    node-graph post chain (CA, vignette, bloom, tone-map terminal) — the WebGPU direction for the post-judge
    migration and the lens-"glass" (CA/vignette/barrel) reference doc 28 also cites. https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **TSL `anamorphic()` node migration (the native re-host).** Move `<AnamorphicStreak>` onto the three.js
   `AnamorphicNode` (`anamorphic(scenePass, threshold, scale, samples)`) inside the r183 RenderPipeline, with a
   warm-tint node multiply and `forgeHeat` as a `uniform()` node — keeping the WebGL streak as the WebGL2-fallback
   so the iOS WebGPU coverage gap can't break the judge device. Per-axis the streak length becomes the node's
   `scale`; the warm-only lock becomes one tint node. A re-host, not a redesign.
2. **Strike-coupled streak length (the lens "stretching on impact").** Tie `streakLen` (not just intensity) to
   the strike pulse so a hammer-strike *lengthens* the lance for a few frames before it settles — the lens
   "blooming its anamorphic streak" on impact, one more `forgeHeat`-coupled cue on the same heartbeat (extends
   doc 58 candidate #4, focus-rack-coupled bloom/aperture).
3. **Per-route anamorphic character (the chamber lens table).** A `scenes.js` field per chamber tuning
   `streakLen`/`ovalAspect`/`intensity` — the jewel-chamber's vivid prismatic payoff gets the longest warm lance,
   the scrying-pool gets near-zero (calm, listening), the forge-mouth arch gets the hottest oval — so each
   chamber is a *distinct lens read* damped from one table (cohesion-map §9), never a different system.
4. **Multi-streak / cross cues (the 2-point flare) — measured against the "no laser" line.** A second, fainter,
   *vertical* warm streak (a subtle cross) on only the very hottest cluster (the A/E divine fire), to read as a
   true cinema flare-star without the rainbow ghost chain — a device A/B on whether the vertical add reads as
   "sacred flare" or tips into "broken render," and at what intensity floor it stays a whisper.
