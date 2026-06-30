# 32 — Reference Scan: Avatar / Cinematic Web 3D (2025–2026)

_GAELWORX forge-world graphics research · Phase 1 · topic 32_
_Focus: Awwwards SOTD / Codrops / studio work (Active Theory, Lusion, Resn, Unseen, Immersive Garden
tier + Unreal-cinematic real-time) that achieves cinematic forge / lava / liquid-metal / Celtic-mythic
looks in-browser. Teardown the best; name what GAELWORX should steal. Buildable in THIS codebase
(Vite + React + r3f + three.js, one renderer, `onBeforeCompile` chunk injection, shared `gw_` noise,
warm `PAL`, iPhone-15 budget)._

---

## 1. SCOPE — this element in the GAELWORX world

This is not a single shader; it is the **bar**. Every other Phase-1 doc answers "how do I build the
molten metal / the basalt / the bloom?" This doc answers "what does world-class look like in 2025–26,
and which specific tricks separate an Awwwards Site-of-the-Day from a clever student demo?" The
GAELWORX deliverable explicitly targets Active-Theory / Lusion / Resn / Unseen caliber — _cinematic,
not "web design."_ So before we lock the master temperature/material/noise/lighting system, we scan the
state of the art and harvest the **transferable moves**: the choreography, the grade, the restraint, the
single-light-source discipline, the loading theatre, and the perf tricks that let those studios ship
60fps cinema to a phone.

The lens is deliberately narrow. We reject anything pre-2025 (techniques that predate it are cited
through a 2025–26 write-up). We reject "looks nice in a tweet" — we want what survives an iPhone 15 OLED
at 60fps with a real LCP budget. And every steal must map onto the existing spine: one `<Canvas>`
(`ForgeCanvas.jsx`), `MeshPhysicalMaterial` + `onBeforeCompile` (`ObsidianSlab.jsx`), shared `gw_fbm`
(`shaders.js`), warm `PAL` (`palette.js`), the `@react-three/postprocessing` stack (`Effects.jsx`), and
the per-route preset damping (`scenes.js`). If a steal can't live there, it's noted as a future-tier
(WebGPU/TSL) candidate, not a Phase-1 build item.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026 — teardown of the best

I group the reference field by **what they actually do that we can take**, with a quality / perf / mobile
/ complexity read on each. Every named source is dated in §8.

### 2.1 The studio tier — Active Theory · Lusion · Unseen · Immersive Garden

These four are the caliber GAELWORX is benchmarked against. The recurring, _stealable_ pattern across
their 2025–26 award winners is **not** a single hero shader — it's a stack of disciplines:

- **One pervasive material language.** Active Theory and Lusion sites read cohesive because every surface
  shares a look (one fresnel curve, one grade, one noise field) — exactly the "everything shares uniforms,
  nothing looks bolted-on" rule GAELWORX already commits to. The takeaway: our `gw_fbm` + `uTemp` + `PAL`
  must be the _only_ vocabulary; no element gets its own private noise or its own private orange.
- **Theatrical choreography over interactivity.** The 2026 animation roundups describe Active Theory's
  transitions as "feel like movie trailers" — scroll-triggered reveals that are _composed_, not reactive.
  GAELWORX already has the substrate for this (Lenis scroll → `forge.scrollDamped`/`scrollVel` →
  `uVeinGlow`/`uTemp`/`uSurge`). The steal is **timing**: stagger the pour-front, the letter-fill, and the
  camera dolly to land as one beat (Brutalist Snap), not three independent lerps.
- **Houdini/Blender-baked detail, runtime-cheap playback.** Immersive Garden's award winners (David Whyte,
  Montfort) are built in Three.js but the _heavy_ look is baked offline (flow maps, normal maps, gradient
  ramps as textures) and replayed cheaply. This is the single biggest perf lesson: **bake the expensive
  field once, sample it at runtime.** For us: bake the temperature ramp and the channel flow direction to
  a small texture rather than recomputing per-pixel.
- **Single-light-source drama.** Unseen / Lusion lean on _one_ dominant light and crushed blacks. GAELWORX
  is already there in spec ("lit ONLY by the metal") — the reference confirms it's a strength, not a
  limitation. Don't add fill light to "fix" darkness; let the metal be the only emitter and let bloom carry
  the read.
- Quality: **reference-grade.** Perf/mobile: these studios ship to mobile by aggressive baking + DPR caps.
  Complexity: **high** as whole productions, **low** as principles — and the principles are free.

> **Steal #1 — Choreography + baked-field discipline.** Compose the pour/fill/camera as one timed beat;
> bake the temperature ramp + channel flow to textures; keep one material vocabulary.

### 2.2 Stylized liquid in r3f — Codrops "Creating Stylized Water Effects" (Mar 2025)

The most directly transferable tutorial of the year for our molten metal. It builds an animated liquid in
react-three-fiber using a custom shader attached to a standard material, driving the surface with scrolling
noise for the body, a **fresnel term** for the rim, and an **edge/foam band** where the liquid meets
geometry. The cinematic read comes from three cheap things stacked: (a) domain-distorted normals so the
highlight crawls, (b) a fresnel-weighted rim that brightens grazing angles, (c) a depth/intersection foam
line. Swap "foam/water-blue" for "skin-tear/white-hot" and this is _exactly_ the molten-metal surface and
the channel-meets-letter edge we need.

- Quality: **high** for a surface read. Perf/mobile: **excellent** (2–3 noise octaves + fresnel).
  Complexity: **low** — it's the pattern `ObsidianSlab.jsx` already uses.

> **Steal #2 — Fresnel rim + intersection edge band.** Add a fresnel-weighted rim brighten and a
> depth-intersection "skin tear" band to the molten surface and to the channel→letter contact.

### 2.3 WebGPU / TSL cinematic chains — Codrops "False Earth" (Apr 2026) & "Field Guide to TSL" (Heckel)

The clearest 2026 signal: the frontier is moving to **WebGPU + TSL** (Three Shading Language, a
renderer-agnostic node graph that compiles to both WebGL and WebGPU). False Earth wires its _entire_
post chain as a TSL node graph — chromatic aberration (RGB sampled at offset UVs), a tinted vignette
(visor feel), **bloom for emissive glow**, then tone mapping, each effect a node that transforms the
color/depth output of the scene pass. WebGPU also unlocks **indirect draw** (the GPU decides instance
counts), used there to push millions of grass blades.

For GAELWORX the _grade structure_ is the steal — our `Effects.jsx` already runs the same ordered chain
(Bloom → ChromaticAberration → grade → Vignette → Noise → SMAA). The TSL/WebGPU move itself is a **future
tier**: r3f WebGPU is shipping but mobile Safari support and the r182-vs-r170 perf/shadow regressions noted
on the three.js forum make it risky for a June-2026 judge build on iPhone. Hold WebGPU for a Phase-2
upgrade; keep the WebGL/`onBeforeCompile` path as the shipping target.

- Quality: **highest ceiling.** Perf/mobile: **uneven on Safari today** (the blocker). Complexity: **high**
  (a TSL rewrite of the whole pipeline).

> **Steal #3 — Confirm the post-chain ORDER** (bloom on emissive → aberration → vignette → grade → grain
> → AA). **Defer** the TSL/WebGPU rewrite to a post-judge phase.

### 2.4 Selective bloom on emissive — the glow that reads as heat

The 2025–26 three.js docs/forum consensus (BloomNode docs; multiple SOTD-tier sites) is unambiguous:
cinematic glow = **bloom keyed off the emissive/HDR channel**, not a blanket blur. The reliable recipe is
a luminance-thresholded mipmap bloom where only values > ~1.0 (HDR) bloom, so the void stays black and only
the white-gold A+E and vein cores flare. Known iOS gotcha called out repeatedly: full-scene bloom on a
separate render pass is expensive/buggy on Safari — prefer **single-pass mipmap bloom with a luminance
threshold** (what `@react-three/postprocessing` `Bloom mipmapBlur` already does) over MRT selective-bloom
layer juggling on mobile. This is precisely how `Effects.jsx` is configured
(`luminanceThreshold={0.55}`, `mipmapBlur`) — the reference validates it; we just push the A+E and pour
core into HDR (>1.0) in the shader so they're the only things that bloom.

- Quality: **the** cinematic differentiator. Perf/mobile: **good** with mipmap+threshold; **bad** with
  per-object MRT layers on iOS. Complexity: **low** (already wired).

> **Steal #4 — Push only A+E divine-fire and pour cores to HDR (>1.0)** so the existing threshold bloom
> isolates them; never raise blanket bloom intensity to "find" the glow.

### 2.5 Volumetric light / heat atmosphere — Maxime Heckel, "On Shaping Light" (Jun 2025)

Heckel's 2025 piece implements volumetric lighting as a **post-process raymarch**: a fragment pass marches
from camera through the scene, accumulating in-scatter and attenuating with distance, with **blue-noise
dithering** to kill banding at low step counts, then composites the accumulated light over the input color.
This is the textbook recipe for god-rays from the forge mouth and for the heat-glow halo around the
white-gold letters. For GAELWORX we don't need a full march on mobile — the steal is the **structure**
(accumulate + attenuate + blue-noise dither) and we approximate it cheaply: a screen-space radial
god-ray sampling toward the brightest emissive cluster, dithered to hide steps. The blue-noise-dither
lesson is the real gold — it lets us drop step count hard without banding.

- Quality: **high** (atmosphere is what sells "sacred"). Perf/mobile: **good** as a cheap radial approx,
  **expensive** as a true march. Complexity: **medium**.

> **Steal #5 — Blue-noise dithering to kill banding** on any low-step volumetric/heat-shimmer/god-ray
> pass; ship a cheap radial god-ray, not a full march, on mobile.

### 2.6 Dissolve / transition theatre — Codrops "Text Destruction" (Jul 2025), "Gommage" (Jan 2026), "X-Ray Fluid Reveal" (Mar 2026)

A 2025–26 cluster of award-tier transition tutorials: MSDF text dissolving to dust/petals (Gommage),
interactive text destruction, and a dual-scene fluid x-ray reveal. The shared mechanic — **a noise-driven
threshold sweeping a mask across UVs** — is exactly the GAELWORX letter-fill (metal wells L→R) and the
cooling sweep (white-hot→iron-black trailing the fill). These confirm the per-letter progressive-fill
approach (doc 13) is squarely on-trend, and the Gommage/x-ray pieces show the _cinematic finish_: the
sweep edge isn't a hard line, it's a **glowing, particle-shedding band**. Steal the band, not the
particles (particles are a mobile cost).

- Quality: **high** (the reveal is the hero moment). Perf/mobile: **good** (mask sweep is free; particle
  shedding is the cost to gate). Complexity: **low–medium**.

> **Steal #6 — The fill/cool sweep gets a glowing transition BAND** (a few px of white-gold at the
> moving threshold), matching the 2025–26 dissolve aesthetic, with particle shedding gated to high tier.

### 2.7 Stylized post grain / ASCII / dither — Codrops "Efecto" (Jan 2026)

A 2026 piece on real-time dithering/ASCII as a finishing layer. Not a forge look directly, but it
reinforces a 2026 trend: **a textural post layer that unifies disparate elements into one filmic image.**
Our equivalent is the SOFT_LIGHT grain already in `Effects.jsx`. The steal is _restraint_: a hair of
ordered/blue-noise grain unifies the metal + basalt + void into one stock; too much reads as a filter.

> **Steal #7 — Keep a whisper of grain (≈0.035–0.05) as the unifying film stock**; never as an effect.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Do not chase the frontier (WebGPU/TSL) for the judge build. Chase the _discipline_ of the studio tier
on the WebGL path we already have.** The reference scan says clearly: the gap between a student demo and a
Lusion-grade site is rarely a fancier shader — it's (a) one cohesive material vocabulary, (b) composed
choreography, (c) single-light + crushed-black drama, (d) HDR-keyed bloom, (e) atmosphere (god-ray/heat
glow) with blue-noise dithering, and (f) a unifying film grade. Every one of those is buildable _today_
in this codebase with `onBeforeCompile` + `@react-three/postprocessing`.

Concretely, the pick is a **"steal stack"** layered onto the existing spine, in priority order:

1. **Cohesion lock** — route everything through `gw_fbm` + `uTemp` + `PAL` (no private noise/orange).
2. **HDR-keyed bloom** — push A+E + pour cores to >1.0; leave the existing threshold bloom alone.
3. **Fresnel rim + intersection edge band** on the molten surface and channel→letter contact (Steal #2).
4. **Glowing fill/cool sweep band** for the letter fill + cooling (Steal #6).
5. **Cheap radial god-ray + blue-noise dither** for forge-mouth atmosphere and the A+E halo (Steal #5).
6. **Choreography pass** — stagger pour/fill/camera into one Brutalist-Snap beat (Steal #1).

WebGPU/TSL is **explicitly deferred** to a post-judge phase; the renderer-agnostic nature of TSL means the
WebGL look we ship now will port cleanly later.

---

## 4. IMPLEMENTATION — libs, snippets, component shape

**Versions (already in this build):** `three` r17x, `@react-three/fiber` v8/v9, `@react-three/drei`,
`@react-three/postprocessing` (`postprocessing` `pmndrs`), `leva` (debug). No new runtime deps required;
every steal is shader + composer config. (TSL/WebGPU would need `three/webgpu` + r3f WebGPU canvas —
**not** for this phase.)

### 4.1 Fresnel rim + intersection edge band (Steal #2) — injected into the molten material

Same `onBeforeCompile` chunk pattern as `ObsidianSlab.jsx`. The fresnel term already exists there
(`gwFres`); we add a rim brighten and a depth-intersection band:

```glsl
// in the COLOR chunk, after veinCol is built:
// rim: brighten grazing angles toward white-gold (reads as molten skin tension)
float rim = pow(gwFres, 3.0);
vec3  rimCol = mix(${'${v3(PAL.ember)}'}, ${'${v3(PAL.hot)}'}, gwCore);
fire += rimCol * rim * uVeinGlow * 0.6;

// intersection "skin tear" band where the pour meets cooler geometry.
// uSceneDepth = depth texture sampled at this fragment; vDepth = this frag depth.
float edge = 1.0 - smoothstep(0.0, uEdgeWidth, abs(uSceneDepth - vDepth));
fire += ${'${v3(PAL.hot)}'} * edge * uTearGlow;   // white-hot tear line
```

Uniforms to add: `uEdgeWidth` (~0.04), `uTearGlow` (~0.8, HDR so it blooms). The depth read needs the
composer's depth pass (or a manual depth render target); on the low tier, drop the edge band and keep only
the rim (rim needs no depth texture).

### 4.2 Glowing fill / cooling sweep band (Steal #6)

The letter fill is a left-to-right threshold on UV.x; the cooling sweep trails it. The _band_ is the new
cinematic part — a thin white-gold ridge at the moving edge:

```glsl
// uFill in [0,1] advances per letter (driven from the store, dt-damped).
float filled = step(vUv.x, uFill);                 // metal present
float band   = smoothstep(uFill - uBandW, uFill, vUv.x)
             * smoothstep(uFill + uBandW, uFill, vUv.x); // ridge AT the edge
// temperature trails the fill: hottest at the edge, cooling behind it.
float heat   = filled * smoothstep(uFill - uCoolLen, uFill, vUv.x);
vec3  bodyCol = tempRamp(heat);                    // shared ramp (white->orange->red->iron)
gl_FragColor.rgb = bodyCol + ${'${v3(PAL.hot)}'} * band * uBandGlow; // HDR band -> blooms
```

`tempRamp()` MUST be the shared master ramp from doc 02 (one function, every element calls it). Uniforms:
`uFill`, `uBandW` (~0.02), `uCoolLen` (~0.35), `uBandGlow` (~1.4 HDR). The **A and E never cool** — gate
them: `if (uIsAE > 0.5) heat = 1.0;` so they sit at white-gold forever and stay above the bloom threshold.

### 4.3 Cheap radial god-ray + blue-noise dither (Steal #5) — a small post effect

A full Heckel-style march is too heavy for mobile; use a radial blur toward the brightest emissive cluster
(the forge mouth / the A+E), dithered. As a `postprocessing` `Effect`:

```glsl
// fragment of a custom Effect (postprocessing wrapEffect)
uniform vec2  uLightScreen;   // screen-space pos of the brightest emitter
uniform float uDensity, uDecay, uWeight;
uniform sampler2D uBlueNoise; // tiny 64x64 tiled blue-noise (NOT an EXR)
void mainImage(const in vec4 c, const in vec2 uv, out vec4 outputColor){
  vec2 dir = (uv - uLightScreen) / float(SAMPLES) * uDensity;
  float dither = texture2D(uBlueNoise, uv * uResolution.xy / 64.0).r; // jitter start
  vec2 coord = uv - dir * dither;
  float illum = 1.0; vec3 acc = vec3(0.0);
  for (int i = 0; i < SAMPLES; i++){       // SAMPLES = 24 high / 12 low
    coord -= dir;
    acc += texture2D(inputBuffer, coord).rgb * illum * uWeight;
    illum *= uDecay;
  }
  outputColor = vec4(c.rgb + acc, c.a);     // additive -> only bright (HDR) sources streak
}
```

`uLightScreen` comes from projecting the A+E / forge-mouth world position to NDC each frame in `useFrame`
(`vec3.project(camera)`). Blue-noise is a ~6KB PNG bundled with the app — **never a runtime EXR** (hard
constraint). Place this effect in `Effects.jsx` _before_ Bloom so the streaks also bloom. Gate it off on
the `static` tier.

### 4.4 r3f component shape (no new architecture)

Everything hangs off the existing single canvas. No new `<Canvas>`. Pattern:

```jsx
// Effects.jsx — add the god-ray as a wrapped effect, high/low SAMPLES via define
import { GodRay } from './GodRay.jsx' // wrapEffect(GodRayEffect)
<EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
  {quality !== 'low' && <GodRay lightScreen={lightScreenRef} samples={high ? 24 : 12} />}
  <Bloom mipmapBlur luminanceThreshold={0.55} ... />
  {high && <ChromaticAberration ... />}
  <HueSaturation .../> <BrightnessContrast .../> <Vignette .../> <Noise .../>
  {high && <SMAA />}
</EffectComposer>
```

The molten material steals (4.1, 4.2) are chunk injections in the existing `onBeforeCompile`, sharing the
`uniforms` object so they damp from the store exactly like `uVeinGlow`/`uTemp` already do.

### 4.5 Hooking the shared master temperature system

Non-negotiable: all new code reads the SAME inputs as the obsidian slab.

- `uTime` ← `state.clock.elapsedTime` (or frozen at 2 on `static`), as today.
- `uTemp` ← `forge.scrollDamped + scrollVel*0.25` — the global heat, already computed.
- `tempRamp()` ← the single shared GLSL function (doc 02) — fill body, rim, band, god-ray tint all call it.
- `gw_fbm` ← the one noise in `shaders.js` — fill mask warp, band wobble, heat-shimmer all use it.
- `PAL` ← inlined via `v3()` — `PAL.hot` (HDR) for divine-fire/cores, `PAL.ember`/`PAL.crimson` for body.
- `forge.strikeAt` → `uSurge` — the existing strike pulse also kicks the fill band + god-ray weight.

---

## 5. COHESION — shared palette / lighting / uniforms

The whole point of the reference scan is the studios' cohesion. To match it we enforce:

- **One palette, no exceptions.** `PAL` only. The 60/30/10 (void / crimson mass / ember-gold accent) is the
  same ratio the references use for crushed-black drama. A+E = `PAL.hot` (HDR, the only persistent white).
- **One noise field.** `gw_fbm` drives the veins, the molten body, the fill-mask warp, the band wobble, and
  the heat-shimmer. If a new element needs "more detail," add an octave to `gw_fbm`, don't fork it.
- **One temperature ramp.** Every emissive surface (slab veins, pour, channels, letter fill, A+E) calls the
  same `tempRamp(t)`; the divine-fire is just `t` clamped high. This guarantees the world cools as one body.
- **One light source.** No fill lights. The metal's HDR emission is the only emitter; the cool Lightformer
  env (`ForgeCanvas.jsx`) exists only for glass reflection, not illumination. The god-ray and bloom carry
  the lit-by-fire read.
- **One grade.** The `Effects.jsx` chain is the single film stock over the whole world; per-route changes
  happen via `scenes.js` preset damping (veinGlow/irid/camera), never via per-route post tweaks.

This is exactly the "every element shares uniforms so nothing looks bolted-on" mandate, validated against
how Active Theory / Lusion / Immersive Garden actually ship.

---

## 6. MOBILE & PERFORMANCE — inside the iPhone-15 budget

The studios hit mobile by **baking + capping + gating**. Our tiers (`quality`: high / low / static):

- **DPR cap** stays as is (`[1,2]` high, `[1,1.4]` low, `1` static) — `AdaptiveDpr pixelated` already
  scales down under load. This is the single biggest mobile lever.
- **God-ray** (4.3): high = 24 samples, low = 12, **off** on static. Additive single pass; cost is the
  sample loop only. Blue-noise dither lets us run 12 samples without banding (the Heckel lesson).
- **Edge/depth band** (4.1): high tier only (needs the depth texture). Low tier keeps the fresnel rim
  (free) and drops the tear band.
- **Fill band + cooling** (4.2): all tiers — it's a couple of `smoothstep`s, essentially free.
- **Bloom**: keep `mipmapBlur` + threshold (the iOS-safe path); do **not** add MRT selective-bloom layers
  (the documented Safari cost). Intensity stays 0.6 low / 0.9 high.
- **Bake, don't compute**: the temperature ramp can be a 1×256 gradient texture (`tempRamp` becomes a
  texture read); the channel flow direction can be a baked flow map. Both turn per-pixel math into one
  cheap sample — the Immersive Garden lesson.
- **Static tier** (prerender / reduced-motion / dead-battery fallback): `uTime` frozen, no Effects pass,
  `frameloop='demand'` — already implemented in `ForgeCanvas.jsx`. The slab + veins still render a rich
  still frame; god-ray/band/grain all gate off cleanly.
- **No runtime EXR** (hard constraint): the only new texture (blue-noise) is a ~6KB bundled PNG. The env is
  Lightformer-built, not a file.

Budget sanity: every steal is either a few extra ALU ops in an already-running fragment shader, or one
additive screen-space pass with a bounded loop. No new geometry, no second context, no new render targets
beyond the optional depth pass (high tier only).

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Order of operations (do them in this sequence):**

1. **Lock the shared ramp first.** Build `tempRamp()` in `shaders.js` and route the existing slab veins
   through it _before_ adding anything new. If the ramp is wrong, every steal inherits the wrong color.
2. **HDR audit.** Confirm A+E and pour cores exceed the bloom threshold (>~1.0 linear) and the void sits at
   true black. Do this with bloom temporarily _off_ — the values must be right pre-bloom.
3. **Fresnel rim** (free, no depth) — get the molten skin reading before touching depth.
4. **Fill + cooling band** — the hero reveal; tune `uBandW`/`uCoolLen` against the Cinzel letter widths.
5. **Depth edge band** (high tier) — only after the depth pass is confirmed present.
6. **God-ray + blue-noise** last — it's atmosphere over a scene that must already read correctly.
7. **Choreography pass** — only once each element is right, stagger them into one beat.

**Pitfalls (each cost a studio a redo):**

- **Bloom-fishing.** Raising blanket bloom to "find" the glow washes the void grey and kills the OLED black.
  Fix the HDR values instead (Steal #4). The threshold bloom is correct; the inputs were too dim.
- **Orange wash.** Adding ambient/fill light or a warm env reflects as an orange band across the glass (the
  comment in `ForgeCanvas.jsx` records this exact bug). Keep env cool; let only the metal be warm.
- **Banding on low steps.** A radial god-ray at 12 samples bands hard without dithering. Always tile
  blue-noise to jitter the start coord (the Heckel lesson) — never raise step count to hide banding on
  mobile.
- **Forking the noise/palette.** The instant a new element gets its own `fbm` or its own hardcoded orange,
  cohesion breaks and it reads bolted-on. Everything goes through `gw_fbm` + `PAL`.
- **Reaching for WebGPU/TSL now.** It's the 2026 frontier but Safari/iOS support and the r182 regressions
  make it a judge-day risk. Ship WebGL; the TSL look ports later because TSL is renderer-agnostic.
- **Depth band on low tier.** Sampling a depth texture that isn't being produced = black/garbage. Gate the
  edge band to high tier where the depth pass exists.
- **Per-letter particle shedding everywhere.** The dissolve references look great because the particles are
  the _hero_ moment, not on every letter. Gate particle shedding to the finale + high tier; the glowing
  band carries the rest.

---

## 8. SOURCES (2025–2026, dated)

1. Codrops — _Creating Stylized Water Effects with React Three Fiber_ (4 Mar 2025).
   https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/
2. Maxime Heckel — _On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching_
   (Jun 2025). https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
3. Codrops — _Interactive Text Destruction with Three.js, WebGPU, and TSL_ (22 Jul 2025).
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
4. Codrops — _Creating an Immersive 3D Weather Visualization with React Three Fiber_ (18 Sep 2025;
   R3F-Ultimate-Lens-Flare for cinematic flare).
   https://tympanus.net/codrops/2025/09/18/creating-an-immersive-3d-weather-visualization-with-react-three-fiber/
5. Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_
   (28 Jan 2026). https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
6. Codrops — _Efecto: Building Real-Time ASCII and Dithering Effects with WebGL Shaders_ (4 Jan 2026).
   https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/
7. Codrops — _Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js_ (23 Mar 2026).
   https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
8. Codrops — _False Earth: From WebGL Limits to a WebGPU-Driven World_ (21 Apr 2026; TSL node-graph post
   chain, bloom-on-emissive, indirect draw).
   https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
9. Codrops — _From Flat to Spatial: Creating a 3D Product Grid with React Three Fiber_ (24 Feb 2026).
   https://tympanus.net/codrops/2026/02/24/from-flat-to-spatial-creating-a-3d-product-grid-with-react-three-fiber/
10. Maxime Heckel — _Field Guide to TSL and WebGPU_ (2025).
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
11. three.js docs — _BloomNode_ (selective bloom via emissive; r17x/r18x, 2025–26).
    https://threejs.org/docs/pages/BloomNode.html ; example: https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html
12. three.js forum — _WebGPU significant performance drop and shadow regression in r182 vs WebGL r170_
    (2025–26; rationale for deferring WebGPU on mobile).
    https://discourse.threejs.org/t/webgpu-significant-performance-drop-and-shadow-quality-regression-in-r182-vs-webgl-r170/89322
13. utsubo — _Migrate Three.js to WebGPU (2026): The Complete Checklist_ (2026).
    https://www.utsubo.com/blog/webgpu-threejs-migration-guide ; _100 Three.js Tips_ (2026) renderer-reuse.
14. School of Motion — _10 Websites with Great Animation in 2026_ (Active Theory "movie-trailer"
    choreography). https://www.schoolofmotion.com/blog/10-websites-with-great-animation-in-2026
15. Awwwards — _Case Study: Immersive Garden's New Website_ & _David Whyte Experience_ (2025; Houdini/Blender
    bake → Three.js runtime, custom shaders, GSAP+Lenis). https://www.awwwards.com/case-study-immersive-gardens-new-website.html
16. Lusion (https://lusion.co/) & Active Theory (https://activetheory.net/) — studio reference, cohesive
    material language + single-light drama; Awwwards/FWA 2025–26 winners (EverSwap, Hubtown/Unseen).
17. CreativeDevJobs — _Best Three.js Websites & Portfolio Examples (2025/2026)_ (Jordan Breton FWA SOTD
    2 Oct 2025; fire/wind/water island). https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025

---

## 9. DEEP-DIVE CANDIDATES

1. **Cheap radial god-ray as a `postprocessing` Effect (blue-noise dithered).** Full build of `GodRay.jsx`
   via `wrapEffect`, world→screen projection of the brightest emitter each frame, sample-count tiers, and
   placement before Bloom so streaks bloom. (Steal #5; Heckel structure, mobile-cheap approximation.)

2. **The glowing fill/cool sweep band + shared `tempRamp()` as a gradient texture.** Convert the master
   temperature ramp from per-pixel math to a 1×256 baked gradient, wire the L→R fill band and trailing
   cooling, and gate A/E to permanent white-gold. (Steals #2/#6; doc 02 + doc 13 integration.)

3. **Choreography layer: one Brutalist-Snap beat.** A timeline that staggers pour-front, per-letter fill,
   camera dolly, and `uSurge` so navigation/scroll lands as a single composed impact (Active-Theory-grade
   theatre) — driven from the existing store, dt-damped, reduced-motion safe. (Steal #1.)

4. **WebGPU/TSL port path (Phase 2).** Spike of the `Effects.jsx` post-chain as a TSL node graph
   (bloom-on-emissive → aberration → vignette → grade), with a WebGL fallback, to confirm the shipped look
   survives the renderer-agnostic migration when iOS WebGPU stabilizes. (Steal #3, deferred.)
