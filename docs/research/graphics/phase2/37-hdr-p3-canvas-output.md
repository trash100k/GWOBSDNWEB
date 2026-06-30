# 37 — HDR / P3 Canvas Output to the iPhone-15 OLED

_Phase-2 deep-dive · GAELWORX forge world · cluster E-light-finish-arch · target: iPhone 15 OLED, single WebGL renderer_
_Parents: Cohesion Map §3 (palette + OLED tone-map/grade), §6 (post-FX), §10 (perf); Phase-2 docs 33 (tone-map look-dev), 34 (OLED dither), 35 (bloom budget & banding)_

> **The question this doc closes.** Every other doc in cluster E assumes the canvas emits an **8-bit SDR
> signal** — AgX rolls highlights into `[0,1]`, the dither smooths the bottom 5%, bloom blooms the >1.0
> band *before* the tone-map clamps it back down. The divine-fire A/E and the white-hot pour front are
> radiance values well above 1.0 in the shader, but by the time they hit the panel they are **paper-white
> `#F1F2F6`** — the brightest pixel the SDR pipeline can emit. This deep-dive asks the highest-ceiling
> question in the build: **should GAELWORX emit a true HDR signal** — an extended-range float canvas with
> `display-p3` primaries and `toneMapping: "extended"` — so the divine fire and pour front *physically
> exceed SDR white* on the iPhone-15 OLED, detonating against the true-black void with brightness the SDR
> path simply cannot produce? It is the highest-risk upgrade too: it touches the renderer's output buffer,
> it splits hard across WebGL vs WebGPU and Chrome vs Safari, and a wrong default washes the whole world
> grey on the very panel it is meant to dazzle. The deliverable is **the HDR emit path, the
> capability-gated SDR fallback that is the shipping default, and the exact place HDR plugs into the shared
> master temperature/bloom system** so the fire that exceeds white is the *same* fire, one step further up
> the same ramp.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX's entire lighting thesis is "the metal is the only light, in a pure-void world, on a panel that
renders true black" (Cohesion Map §5, §3). On an SDR display that thesis is already strong: `#0B0C10` maps
to pixels-off black on the OLED, and the fire reads vivid because there is no backlight haze to lift the
void. But there is a hard ceiling the SDR path cannot cross — **the brightest the fire can ever be is
paper white.** The white-hot pour front, the gold shoulder of the cooling ramp, and above all the **eternal
white-gold divine-fire A/E** all clamp to the same `~250/255` near-white the page background's Fog White
would hit. The divine fire is *narratively* the most luminous thing in the world — sacred light that
radiates onto stone and makes Ogham legible (Cohesion Map §1.4, §5.2) — yet on SDR it is, photometrically,
no brighter than text. The bloom halo *fakes* extra brightness by spreading glow into neighboring pixels
(doc 35), but the **core** of the fire is capped at display white.

HDR removes that ceiling. With an extended-range canvas the A/E can emit `2×`–`4×` SDR white **on the
panel itself**, so the divine fire is not *painted* bright, it *is* bright — a genuine over-white highlight
the iPhone-15 OLED can drive to ~1000 nits against a 0-nit void. This is the single largest perceptual
jump available to the build: the difference between "a very nice dark web scene" and "the screen is
physically glowing in your hand." The P3 half of the upgrade is the smaller but real companion: Celtic
Blood `#C1292E` and Ember Glow `#E85D04` sit **outside sRGB**, near the P3 red boundary; emitting in
`display-p3` lets the forge reds reach a saturation and purity the sRGB gamut clips. The iPhone-15 OLED is
a P3 panel with real HDR headroom — it is *built* for exactly this content.

The scope of this doc is precisely the **output stage**: the canvas buffer format, color space, and
tone-mapping mode — the last thing between the composited frame and the glass. It does **not** re-open the
tone-map operator (doc 33 owns AgX-vs-ACES), the dither (doc 34), the bloom budget (doc 35), or the
palette (Cohesion Map §3). It owns the question of whether those upstream stages render into an **SDR
8-bit sRGB buffer** (today's default, what every other doc assumes) or an **HDR float P3 extended-range
buffer**, and how the A/E and pour front — which already carry >1.0 radiance through the shared
temperature bus — get to *keep* that over-white energy all the way to the panel instead of having AgX
roll it back into `[0,1]`. It is, deliberately, the **last** thing built (Cohesion Map §8, Phase D finish)
and a **capability-gated enhancement layer**, never a load-bearing dependency: the world must be complete
and beautiful in SDR first, because the overwhelming majority of judge sessions — and the headless CI
path, and reduced-headroom conditions — will run SDR.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

True HDR canvas output went from "experimental flag" to "shipping on the judge device" during exactly the
2025 window this build targets. There are four viable stances, plus the cross-cutting axes of color space,
buffer format, and SDR/HDR coexistence.

### 2.1 The core mechanic: standard vs extended tone mapping

Every HDR-canvas API in 2025 is built on one switch. A canvas declares a **tone-mapping mode** of
`"standard"` (the default, today's behavior) or `"extended"`. In **standard** mode, colors are converted
to the display's color space and then **projected into `[0, 1]`** — SDR white is the ceiling, exactly
today. In **extended** mode, colors are projected to **`[0, H]`**, where `H` is the maximum component value
the display can actually produce — its HDR headroom (WebGPU HDR explainer, ccameron-chromium, 2025; WebGL
HDR explainer, 2025). A pixel value of `1.0` is still SDR reference white in both modes; values **above
1.0** are clamped in standard mode and **emitted as brighter-than-white** in extended mode, up to `H`. This
is the entire feature: `> 1.0` stops being "clipped to white" and becomes "as bright as the panel allows."

The load-bearing consequence for GAELWORX: the build *already* produces over-1.0 radiance for exactly the
right pixels (Cohesion Map §3.1 — "only the ~10% accent band exceeds 1.0"). The same convention that drives
selective bloom for free **is** the HDR signal. Extended mode is, almost literally, "stop clamping the
bloom-eligible band." The palette is again the selector — this time the selector of *what glows brighter
than white on the panel.*

### 2.2 WebGPU HDR (extended range) — shipped, the modern path

WebGPU's `GPUCanvasContext.configure()` gained a `toneMapping` field and accepts a `format` of
`rgba16float` and a `colorSpace` of `"srgb"` or `"display-p3"`:

```javascript
context.configure({
  device,
  format: "rgba16float",          // 16-bit float backbuffer (extended range needs float)
  colorSpace: "display-p3",        // wide-gamut primaries
  toneMapping: { mode: "extended" }, // unlock [0, H], brighter-than-white
  alphaMode: "opaque",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
```

This **shipped in Chrome 128** (desktop/Android/WebView; "Intent to Ship: WebGPU extended range (HDR)
support," blink-dev, 2024→2025; Chrome Platform Status feature 6196313866895360) and — critically for the
judge device — **in Safari 26 / iOS 26**, where Apple shipped WebGPU on iOS 26 including HDR images and
extended-range in WebGPU Canvas (WebKit "Features in Safari 26.0," 2025; WWDC25 WebKit beta post, 2025).
Both Gecko and WebKit signed off on the API. So as of the 2026 build window, **the iPhone-15 judge running
iOS 26 Safari can emit a true HDR WebGPU canvas.** three.js wired this into `WebGPURenderer` in **PR #29573
(merged Aug 6 2025, r180)** via `new WebGPURenderer({ outputType: THREE.HalfFloatType })` +
`renderer.outputColorSpace = ExtendedSRGBColorSpace`, with a demo example added in PR #31893 (2025).

- **Quality:** the ceiling-removing path. True over-white divine fire, P3 reds. Best possible.
- **Perf:** an `rgba16float` backbuffer doubles output-buffer bandwidth vs `rgba8unorm`. On a fill-bound
  mobile scene (Cohesion Map §10 — "pixels are the enemy") this is a **real** cost at the final blit, on top
  of the already-half-float composer buffer. Measurable, not free.
- **Mobile/complexity:** requires WebGPU, which the Cohesion Map (§10) explicitly defers as a **post-judge**
  upgrade ("WebGPU/TSL is a gated post-judge upgrade… betting the judge device on the WebGPU-fallback branch
  is the documented mistake"). So the *highest-quality* HDR path rides on the *one renderer the build does
  not ship to the judge.* This tension is the heart of the recommendation (§3).

### 2.3 WebGL2 HDR (`drawingBufferStorage` + `drawingBufferToneMapping`) — the path the build is on, but unshipped

WebGL2 — the renderer GAELWORX actually ships to the judge (Cohesion Map §10) — has a parallel API:

```javascript
gl.drawingBufferStorage(gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
gl.drawingBufferColorSpace = "display-p3";
gl.drawingBufferToneMapping({ mode: "extended" }); // note: clears the drawing buffer
```

`drawingBufferColorSpace = "display-p3"` for **wide gamut** has shipped broadly (Chrome 104+; MDN, 2025) —
this half is real and low-risk. But the **extended-range** half (`drawingBufferStorage(RGBA16F)` +
`drawingBufferToneMapping`) is the gap: `drawingBufferToneMapping` is **Khronos WebGL PR #3668, still
open** (filed July 2024, awaiting approvals as of the 2025-2026 window), shipping in Chrome only behind the
**"Experimental Web Platform features" flag** (Chrome Platform Status 5146687245123584). The WebGL PR itself
notes "the WebGPU version has now merged and shipped" — i.e. **WebGL HDR lags WebGPU HDR.** There is **no
shipping iOS Safari support** for WebGL extended-range tone mapping. So on the actual judge stack (WebGL2 +
iOS Safari), the **brighter-than-white** half is **not available without a flag the judge will not set.**
The **P3 wide-gamut** half, however, *is* available on the WebGL2 path today — and that is the part of the
upgrade GAELWORX can actually ship to the judge.

- **Quality:** P3 gamut: yes (vivid forge reds, real win). Brighter-than-white: not on the shipping judge.
- **Perf:** P3 colorspace swap is ~free (no buffer-format change). The float-buffer extended path carries
  the same `rgba16float` cost as §2.2 *if* it were available.
- **Complexity:** P3 is a one-line renderer config. Extended range is gated behind an unshipped spec.

### 2.4 SDR-only (the current default) — the shipping baseline

8-bit sRGB backbuffer, AgX rolling everything into `[0,1]`, bloom faking over-white via spread, dither
killing the bottom-5% banding (docs 33/34/35). Zero HDR risk, universal support, what every other doc
assumes. The fire is vivid and the void is true-black; it simply cannot exceed display white. **This is the
default the build must be excellent at**, because it is what most sessions and all of CI render.

### 2.5 The cross-cutting axes

- **Color space (P3 vs sRGB):** independent of brightness. P3 is low-risk and shippable on WebGL2 *today*;
  it widens the gamut so Celtic Blood / Ember Glow hit purer reds. The catch is **authoring drift**: the
  brand hexes are sRGB; emitting them through a P3 buffer without color management *over-saturates* them
  (the "P3 makes everything neon" trap). Correct handling tags source colors as sRGB and lets the pipeline
  convert — the reds gain reach only where the art *pushes past* sRGB, not everywhere.
- **Buffer format:** extended range **requires a float backbuffer** (`rgba16float`). 8-bit cannot carry
  `>1.0`. Missing the float type is a **silent WebGPU failure** (three.js #29573 discussion). This is a
  known footgun.
- **SDR/HDR coexistence — `dynamic-range-limit`:** the CSS property (`standard` / `constrained` /
  `no-limit`; W3C CSS Color HDR L1; MDN 2025; Chrome 133, 2025; Safari 26 ships `standard`+`no-limit`)
  controls how bright HDR content is *allowed* to go when SDR UI (the Cinzel wordmark, body copy) sits
  beside it. Without a limit, a `no-limit` HDR canvas can make the surrounding SDR DOM look dim by
  comparison, or the over-bright fire can bloom uncomfortably against text. `constrained` is the
  "comfortable mix of SDR and HDR" value — the right default for a canvas-behind-DOM site like GAELWORX.
- **Headroom detection:** `window.matchMedia('(dynamic-range: high)').matches` reports whether the current
  display is HDR-capable (Safari/Chrome/Edge/Firefox as of June 2025). The platform deliberately does **not**
  expose the *numeric* headroom in real time (tracking-vector concern; W3C media-capabilities HDR explainer,
  2025) — so you get a boolean "HDR yes/no," not "how many stops." Design must treat HDR as a binary gate
  plus a conservative fixed assumption about `H`, never a measured value.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship SDR-excellent + P3 wide-gamut on WebGL2 as the judge default; make true brighter-than-white HDR a
capability-gated enhancement that activates only on the WebGPU path (post-judge or feature-detected), never
a dependency.** Concretely, three layers:

1. **Baseline (always, the shipping default): SDR 8-bit, AgX, dither, bloom.** Exactly docs 33/34/35. This
   is what the iPhone-15 judge sees on WebGL2 + iOS Safari, what CI renders, and what every reduced-headroom
   or SDR session gets. It must be the full, finished, dazzling world. **No HDR feature is allowed to make
   this worse.**

2. **P3 wide-gamut (ship now, low-risk, WebGL2): `gl.drawingBufferColorSpace = "display-p3"`** plus correct
   sRGB-source color management. This is the *one piece of the HDR upgrade that ships to the actual judge
   today.* It costs ~nothing, it is one renderer line, and it lets Celtic Blood and Ember Glow reach the P3
   reds the OLED can show. It is reversible per-session by capability probe. **This is the highest
   value-to-risk ratio in the whole topic** and should land independent of the brighter-than-white work.

3. **Extended-range brighter-than-white (gated enhancement, WebGPU): `outputType: HalfFloatType` +
   `ExtendedSRGBColorSpace` on `WebGPURenderer`,** activated only when `matchMedia('(dynamic-range: high)')`
   is true **and** the renderer resolved to WebGPU **and** a one-frame validation passed. This is the
   ceiling-removing payoff for the divine fire — but it rides the renderer the Cohesion Map defers past the
   judge, so it is **structurally an enhancement, never the baseline.** Authored now (the radiance is
   already >1.0; the shared temperature bus already carries it), shipped when the WebGPU path is the chosen
   renderer.

**Why this split and not "go full HDR on the judge":** the make-or-break constraint is that the judge runs
**WebGL2 + iOS Safari**, and on that exact stack the brighter-than-white half is **behind an unshipped
Khronos spec and a Chrome flag** (§2.3). Betting the single highest-risk output change on a renderer the
Cohesion Map already says not to ship to the judge would be doubling down on the documented mistake. P3,
by contrast, *is* shippable on WebGL2 now — so the recommendation takes the win that's available and stages
the win that isn't. The brighter-than-white fire is real and authored, and the day GAELWORX flips to
WebGPU (post-judge, per Cohesion Map §10's "re-host not a rewrite" plan), the divine fire detonates over
white on the panel with **zero shader changes** — because the >1.0 radiance was there all along.

This also honors the Cohesion thesis: HDR is **not a new system.** It is "the same temperature ramp, one
step further up, allowed to keep its energy to the panel." Extended mode is literally "stop clamping the
band that already blooms." Nothing forks; the A/E that ignite in the DOM, glow in the metal, and bloom in
post are the *same* A/E that, on an HDR panel, exceed white — one signal, four expressions.

---

## 4. IMPLEMENTATION

### 4.1 Libs / versions

- **three.js r180+** for the WebGPU HDR path (PR #29573 landed r180, Aug 2025): `WebGPURenderer`,
  `ExtendedSRGBColorSpace`/`ExtendedSRGBColorSpaceImpl` from `three/addons/math/ColorSpaces.js`,
  `ColorManagement`.
- **WebGL2 path (the judge):** stock `WebGLRenderer`, `gl.drawingBufferColorSpace` (Chrome 104+ / shipping).
- **react-three-fiber:** `<Canvas gl={...}>` with a custom renderer factory so we can choose
  WebGL2-vs-WebGPU and apply the colorspace/format at construction, before first paint.

### 4.2 The capability probe (one boot-time gate, mutable store)

Runs once at boot alongside the existing tier probe (Cohesion Map §10), writes to the mutable `forge`
store — never React state mid-scroll:

```javascript
// src/scene/hdrCapability.js
export function probeHDR() {
  const displayHDR = window.matchMedia?.('(dynamic-range: high)')?.matches ?? false;
  const p3 = window.matchMedia?.('(color-gamut: p3)')?.matches ?? false;
  // We never read numeric headroom (not exposed; tracking-vector). H is a fixed assumption.
  return {
    wantP3: p3,                    // ship on WebGL2 today
    wantExtended: displayHDR,      // only meaningful on the WebGPU path
    assumedHeadroom: 2.0,          // conservative H multiplier for authoring divine-fire intensity
  };
}
```

### 4.3 Renderer construction — the two paths

```javascript
// WebGL2 (judge default): P3 gamut, SDR brightness ceiling.
function makeWebGL2(canvas, cap) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.AgXToneMapping;       // doc 33 decision, unchanged
  renderer.outputColorSpace = THREE.SRGBColorSpace;  // source/auth space stays sRGB
  if (cap.wantP3 && 'drawingBufferColorSpace' in renderer.getContext()) {
    renderer.getContext().drawingBufferColorSpace = 'display-p3';  // <-- the shippable P3 win
  }
  return renderer; // brighter-than-white NOT available here on iOS Safari; bloom fakes it (doc 35)
}

// WebGPU (gated enhancement): true extended-range brighter-than-white.
async function makeWebGPU(canvas, cap) {
  ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
  const renderer = new THREE.WebGPURenderer({
    canvas,
    outputType: THREE.HalfFloatType,   // REQUIRED for extended range; omitting = silent crash
  });
  await renderer.init();
  renderer.toneMapping = THREE.AgXToneMapping;
  if (cap.wantExtended) {
    renderer.outputColorSpace = ExtendedSRGBColorSpace; // <-- unlock [0, H]; A/E exceed white
    // underlying context.configure({ format:'rgba16float', colorSpace:'display-p3',
    //                                toneMapping:{ mode:'extended' } })
  } else {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return renderer;
}
```

### 4.4 How HDR hooks the shared master temperature system

This is the cohesion crux and the reason the upgrade is *not* bolted-on: **the over-white signal is already
produced by `gw_forge`/`gw_divineFire`.** Nothing in the temperature functions changes. The *only* thing
that changes is whether the output stage clamps `>1.0` or emits it. The hook is a single shared uniform on
the pool (`U`) that scales the **headroom-eligible** band's authored intensity to the panel's assumed `H`:

```glsl
// shaders.js — unchanged temperature authorities (Cohesion Map §1)
vec3 gw_forge(float temp){ return gw_tempColor(temp) * gw_tempEmissive(temp); }     // already >1 in hot band
vec3 gw_divineFire(float flick){ return ${v3(PAL.divine)} * (1.0 + flick*0.18); }   // already >1, eternal

// The ONLY HDR addition: a master scalar that lifts the >1 band toward panel headroom when extended.
// uHdrHeadroom = 1.0 in SDR (no change, AgX clamps); = assumedHeadroom (~2.0) when extended is live.
uniform float uHdrHeadroom;   // member of the shared U pool, driven by <ForgeDriver/>

vec3 gw_emit(vec3 hdrLinear){
  // Split at SDR white: <=1 is untouched (the 60/30/10 mass, basalt, void — never lifts off black);
  // >1 (the 10% accent: hot, gold, emberHot, divine) scales toward H so it exceeds white on an HDR panel.
  vec3 over = max(hdrLinear - 1.0, 0.0);
  return min(hdrLinear, 1.0) + over * uHdrHeadroom;
}
// Hot materials end with:  gl_FragColor.rgb = gw_emit(metal);  // before <tonemapping_fragment>
```

In SDR, `uHdrHeadroom = 1.0` → `gw_emit` is the identity → the frame is byte-identical to today and AgX
rolls the highlights as doc 33 specifies. When extended is live, `uHdrHeadroom` damps up to `~2.0` and the
divine fire / white-hot front carry their over-white energy through AgX (which, in extended mode, must use
an **extended-range output transform** — see §7) to the panel. **The split at 1.0 is the same split the
palette already makes** (§2.1, Cohesion Map §3.1): only the accent band lifts, the void and crimson mass
stay exactly where SDR put them, so the true-black void is preserved on the OLED — HDR makes the *fire*
brighter, never the *dark* greyer.

### 4.5 The strike / heartbeat coupling

`uHdrHeadroom` is a member of `U`, so it is on the **same heartbeat** as everything else (Cohesion Map
§4.2, rule 6). A strike pulse (`forge.strikeAt`, `exp(-since*3)`) can briefly push the *effective* headroom
on the divine fire so the A/E **flare brighter than white in the same frame** the veins surge and the bloom
intensity jumps — the synchrony that is the cohesion proof, now extended into the over-white range. One
`<ForgeDriver/>` writer, `dt`-damped via `THREE.MathUtils.damp`, no second rAF.

### 4.6 The `dynamic-range-limit` companion (the DOM side)

The canvas sits behind SDR Cinzel/grotesk DOM. Set on the canvas element (or its container) so the HDR fire
mixes comfortably with SDR text rather than blowing it out:

```css
#forge-canvas { dynamic-range-limit: constrained; } /* comfortable SDR+HDR mix; falls back harmlessly on non-supporting UAs */
```

---

## 5. COHESION — shared palette / lighting / uniforms with the rest of the world

- **One temperature signal, one step further.** HDR adds **no new color authority.** `gw_tempColor`,
  `gw_tempEmissive`, `gw_forge`, `gw_divineFire` are untouched (Cohesion Map §1). The over-white emission is
  the *same* ramp the SDR path produces; extended mode simply stops clamping the top of it. A cooling letter
  and a cooling vein are still visibly the same metal because they still sample the same curve — now they can
  also be the same *brightness beyond white.*
- **The palette is still the selector.** The `≤1.0` / `>1.0` split that drives selective bloom for free
  (Cohesion Map §3.1) is the *exact same split* `gw_emit` uses to decide what exceeds panel white. One
  convention now does three jobs: bloom selection, heat-mask gating, **and** HDR headroom gating. The 10%
  accent band — `PAL.hot`, `emberHot`, `gold`, `divine` — is the only thing that blooms, the only thing the
  haze/god-ray mask catches, **and** the only thing that goes brighter-than-white. Nothing else needs touching.
- **The void stays true-black.** Because `gw_emit` leaves `≤1.0` untouched, the Forged-Iron void and the
  deep-crimson mass map exactly as in SDR. HDR is forbidden from lifting the floor (that would re-introduce
  the grey-haze failure doc 33 guards against on the OLED). HDR brightens the fire, never the dark.
- **One uniform pool.** `uHdrHeadroom` joins `U` (Cohesion Map §4.2) and is driven by the single
  `<ForgeDriver/>` writer on the shared clock — same heartbeat, same `damp`, no private animation.
- **P3 reds serve the brand.** Celtic Blood `#C1292E` and Ember Glow `#E85D04` reaching P3 saturation is the
  brand palette (Cohesion Map §3.1, CLAUDE.md) finally hitting the gamut the OLED can show — cohesive with,
  not divergent from, the Industrial-Metallurgy set. No cool/green/blue enters anywhere (brand law); the
  basalt green stays in the *material*, never the output transform.
- **The divine-fire keystone, amplified.** The A/E (Cohesion Map §1.4) are the single most narratively-loaded
  pixels; HDR is the one upgrade that makes them *physically* the brightest light in the world, not just the
  whitest. The same "first A + first E per word" data (baked, never a string match) gates the over-white
  emission — same rule, one more renderer expression.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The hard budget (Cohesion Map §10): ~9–10 ms steady-state on `high`, DPR capped 1.5, pixels are the enemy.
HDR's costs are all at the **output stage**, so they scale with full-screen pixels — exactly the expensive
axis.

- **P3 colorspace swap (the shipped win): ~free.** `drawingBufferColorSpace = 'display-p3'` changes the
  *interpretation* of the 8-bit buffer, not its size or format. No bandwidth change. Ship unconditionally
  on capable WebGL2.
- **`rgba16float` backbuffer (the gated extended path): real cost.** Doubles the **output** buffer's
  bandwidth (8-bit → 16-bit float) at the final present, on top of the already-`HalfFloatType` composer
  buffer (Cohesion Map §6). On a fill-bound mobile scene this is **not negligible** at the blit — budget
  ~0.5–1 ms additional at the present stage on a near-full-screen frame, and it raises memory pressure /
  thermal load over a 2–3 minute session (the slow-throttle window §10 worries about). **This is why extended
  range is gated, not default**, even where available.
- **Tier integration.** Extended range is **`high`-tier-only**, and only when (a) WebGPU resolved, (b)
  `matchMedia('(dynamic-range: high)')`, (c) the one-frame validation passed. `low` and `static` tiers are
  **always SDR** (and `static` is already a frozen 8-bit poster, Cohesion Map §10). The runtime adaptivity
  ladder (`PerformanceMonitor` factor) gains one rung **above** "drop SMAA": if `factor` dips under thermal
  load, **demote HDR→SDR first** (drop the float backbuffer) — it's the most expensive output change and the
  least catastrophic to lose, since bloom keeps faking over-white. This must be a clean
  buffer-format swap, not a flicker.
- **No EXR, no runtime HDR fetch.** Orthogonal but worth restating: HDR *output* is unrelated to HDR *input*.
  The Cohesion Map's "no runtime EXR/HDR loads" (§10) still holds — the env is procedural PMREM. HDR output
  emits the procedural world brighter; it loads nothing.
- **Fallback / static tier.** SDR is the universal floor. The `static` poster, the `<noscript>`/AEO path, the
  CI headless render — all SDR, all unaffected. HDR is purely additive on top of a complete SDR world.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Pitfalls, in order of how badly they bite:**

1. **Shipping HDR on the WebGL2/iOS-Safari judge path.** Brighter-than-white is **not available** there
   without a flag the judge won't set (`drawingBufferToneMapping` = open Khronos PR #3668). Do **not** wire
   the judge build's payoff to it. P3 *is* available — ship that; stage the rest for WebGPU.
2. **Missing `outputType: HalfFloatType` on WebGPURenderer → silent crash** (three.js #29573 discussion).
   Extended range *requires* a float backbuffer. Assert it at construction.
3. **P3 over-saturation from un-managed source colors.** The brand hexes are sRGB. Emitting them through a P3
   buffer *without* tagging them sRGB makes Celtic Blood neon-cartoon. Keep `outputColorSpace`/source in sRGB
   and let the pipeline convert; the reds should gain reach only where the art pushes past sRGB.
4. **Lifting the void.** HDR must brighten the *fire*, never the *dark*. If `gw_emit` (or an extended output
   transform) lifts `≤1.0` values, the true-black OLED void greys out — the single worst OLED failure (doc 33).
   The split-at-1.0 discipline is non-negotiable.
5. **AgX in extended range.** Stock AgX rolls highlights into `[0,1]` — in extended mode you need an
   **extended-range output transform** (AgX adapted to map to `[0,H]`, or apply AgX's contrast/look but skip
   the final `[0,1]` clamp on the over-white band). three.js's WebGPU HDR path notes tone-mapping for extended
   sRGB is still maturing (#29573 "no proper HDR tone mapping yet") — this is the one place real look-dev is
   needed, and it must be A/B'd on a real HDR panel.
6. **No numeric headroom.** The platform gives a boolean, not stops. Assume a **fixed conservative `H`
   (~2.0)** and validate by eye; never try to read real-time headroom (not exposed; tracking-vector).
7. **SDR/HDR coexistence.** Without `dynamic-range-limit: constrained`, a `no-limit` HDR canvas can dim the
   SDR DOM around it or over-bloom against text. Set the limit on the canvas container.
8. **One-frame validation.** HDR config can succeed at the API level but render wrong (washed, clipped). Gate
   activation behind a one-frame check on a known divine-fire pixel before committing the session to HDR.

**Order of operations:**

1. **Finish the SDR world first** (docs 33/34/35 complete, dazzling). HDR is Phase-D-last (Cohesion Map §8).
2. **Land P3 on WebGL2** — one renderer line + color-management audit. Verify Celtic Blood reads vivid, not
   neon, on the iPhone-15 OLED. This ships to the judge.
3. **Add the capability probe** (`matchMedia` HDR + P3) to the boot tier probe; write to `forge` store.
4. **Add `uHdrHeadroom` + `gw_emit`** to the shared pool/shaders with `uHdrHeadroom = 1.0` (identity) — prove
   `/` is **byte-identical** in SDR. This makes HDR structural, not retrofitted.
5. **Build the WebGPU extended path behind the gate** (`outputType: HalfFloatType` + `ExtendedSRGBColorSpace`).
   Validate on a real HDR panel: divine fire exceeds white, void stays black.
6. **A/B the extended-range output transform** (AgX-extended) on device — the one genuine look-dev step.
7. **Wire the adaptivity rung** (HDR→SDR demote first under thermal throttle) and the one-frame validation.
8. **Verify the matrix:** WebGL2-SDR (judge), WebGL2-P3 (judge), WebGPU-SDR, WebGPU-HDR — each
   `npm run build` green, `qa-route` 0-console-errors, then the device read (HDR does **not** simulate
   headless — the over-white divine fire must be judged on the panel).

---

## 8. SOURCES (2025–2026)

- **WebGPU HDR / extended-range explainer** — ccameron-chromium, `webgpu-hdr/EXPLAINER.md` (2025): the
  `configure({ format:'rgba16float', colorSpace:'display-p3', toneMapping:{mode:'extended'} })` API, standard
  vs extended `[0,H]` semantics. https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md
- **WebGL HDR explainer** — ccameron-chromium, `webgl-hdr/EXPLAINER.md` (2025): `drawingBufferStorage(RGBA16F)`,
  `drawingBufferColorSpace`, `drawingBufferToneMapping` standard/extended, "buffer is cleared on call."
  https://github.com/ccameron-chromium/webgl-hdr/blob/master/EXPLAINER.md
- **WebGL `drawingBufferToneMapping` PR #3668** — KhronosGroup/WebGL (filed Jul 2024, **still open** in
  2025-26; notes WebGPU version already shipped): proves WebGL HDR lags and is unshipped on iOS.
  https://github.com/KhronosGroup/WebGL/pull/3668
- **three.js PR #29573 — "WebGPURenderer: Add HDR Support"** (merged **Aug 6 2025, r180**):
  `outputType: HalfFloatType` + `ExtendedSRGBColorSpace`, silent-crash-without-float-type, "no proper HDR
  tone mapping yet." https://github.com/mrdoob/three.js/pull/29573
- **three.js PR #31893 — WebGPU HDR example** (2025): the extended-sRGB demo, "inspired by greggman's HDR
  demo." https://github.com/mrdoob/three.js/pull/31893
- **WebKit "Features in Safari 26.0"** (2025): HDR images on the web, **HDR in WebGPU Canvas on iOS 26**,
  `dynamic-range-limit` (`standard`/`no-limit`). https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- **WWDC25 WebKit beta post** (2025): WebGPU + HDR coming to Safari 26 across iOS/iPadOS/macOS/visionOS.
  https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- **"Intent to Ship: WebGPU extended range (HDR) support"** — blink-dev (2024→2025; Chrome **128**; Gecko +
  WebKit positive): the brighter-than-white ship.
  https://groups.google.com/a/chromium.org/g/blink-dev/c/rBQIRHUEAe8
- **Chrome Platform Status: WebGPU extended range (HDR)** (feature 6196313866895360, 2025).
  https://chromestatus.com/feature/6196313866895360
- **MDN `GPUCanvasContext.configure()`** (2025): `format`, `colorSpace`, `toneMapping` dictionary fields.
  https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure
- **MDN `drawingBufferColorSpace`** (2025): `'srgb'`/`'display-p3'`, Chrome 104+ wide-gamut WebGL.
  https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferColorSpace
- **MDN / W3C `dynamic-range-limit`** (CSS Color HDR L1; MDN 2025; Chrome 133, 2025): `standard`/`constrained`/
  `no-limit`, HDR-headroom concept. https://developer.mozilla.org/en-US/docs/Web/CSS/dynamic-range-limit
- **W3C media-capabilities HDR explainer** (2025): `matchMedia('(dynamic-range: high)')` boolean detection;
  numeric headroom deliberately **not** exposed (tracking vector); Safari/Chrome/Edge/Firefox by Jun 2025.
  https://github.com/w3c/media-capabilities/blob/main/hdr_explainer.md
- **three.js forum — "Bringing HDR from WebGPU onto the screen"** (2025): practitioner discussion of the
  WebGPURenderer HDR path and display-unknown caveats.
  https://discourse.threejs.org/t/bringing-hdr-from-webgpu-onto-the-screen/88772
- **three.js forum — "True HDR color support"** (2025): WebGL-vs-WebGPU HDR, Apple/iOS support discussion.
  https://discourse.threejs.org/t/true-hdr-color-support/78370
- **ICS MEDIA — "HDR on the web for brighter-than-white highlights"** (Oct 2025): practical
  `rgba16float`/extended setup and headroom detection. https://ics.media/en/entry/251024/

---

## 9. DEEP-DIVE CANDIDATES

1. **AgX-extended: an output transform that maps `[0,H]` instead of `[0,1]`.** The single genuine look-dev
   gap (three.js #29573: "no proper HDR tone mapping yet"). How to keep AgX's hue-stable path-to-white and
   contrast while letting the divine-fire band exceed white to the panel's `H` — the operator that makes the
   sacred fire read as light, not clipped paint, in extended range.
2. **The HDR→SDR adaptivity & validation harness.** The clean buffer-format swap (float↔8-bit) under thermal
   throttle without a flicker, the one-frame divine-fire-pixel validation gate, and the demote-HDR-first
   rung of the `PerformanceMonitor` ladder — the safety system that lets HDR be enabled aggressively because
   it can be dropped instantly.
3. **P3 color-management audit for the brand palette.** Exactly how Celtic Blood / Ember Glow / `PAL.divine`
   convert from sRGB-source to P3-emit so they gain reach without going neon — the gamut-mapping discipline
   that keeps brand fidelity while widening the gamut, including the basalt-green guardrail.
4. **`dynamic-range-limit` choreography against the SDR DOM.** Tuning `constrained` vs `no-limit` per chamber
   so the HDR fire dazzles without dimming the Cinzel wordmark / Ogham / body copy beside it — the
   canvas-behind-DOM coexistence problem specific to a content site, not a full-bleed demo.
