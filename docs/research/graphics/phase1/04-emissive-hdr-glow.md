# 04 — Emissive Materials & HDR Glow Pipeline

_Phase-1 graphics research · GAELWORX forge world · target: iPhone 15 OLED_

> The single system that decides whether the molten metal reads as **light** or as
> **bright orange paint**. Every glowing surface in the world — the pour front, the
> white-hot letter cores, the divine-fire A/E, the orbiting sparks, the ember veins
> already in `ObsidianSlab.jsx` — feeds one shared HDR→bloom pipeline. Get this layer
> right and the forge is luminous; get it wrong and the OLED blows out into a smear.

---

## 1. SCOPE

In the GAELWORX world, **emissive + HDR glow is the light itself**. The brief is a
pure-void chamber lit *only by the metal* — there is no sky, no fill, no sun. So the
molten pour, the cooling letterforms, the never-cooling divine-fire **A** and **E**, and
the orbiting sparks are not "objects that are lit"; they are **the light sources**, and
they must visibly *radiate* — spill glow onto adjacent basalt, make carved Ogham legible,
shimmer the air. The technical job of this element is to make a surface output radiance
**above the display range (HDR, linear values > 1.0)**, carry that signal through tone
mapping without it turning to flat white or shifting hue, and feed a **bloom** pass that
only catches the genuinely-hot pixels — so white-hot metal glows like a forge and cold
iron-black letters stay dark. On an OLED panel with true blacks, a controlled HDR bloom is
the difference between "AAA forge" and "a webpage with an orange gradient." This builds
directly on the rule already encoded in `post-fx`/`shader-fx`: **only HDR (>1) values bloom**,
the palette reserves `PAL.hot`/`PAL.emberHot` (`palette.js`) for exactly that, and the slab
already adds emissive `fire` *before* `#include <tonemapping_fragment>` (`ObsidianSlab.jsx`).

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 The "push color out of 0–1" emissive-bloom (current GAELWORX baseline)
The pmndrs-canonical move: set `<Bloom luminanceThreshold≈1>` so *nothing* blooms by
default, then push specific material output **above 1.0** in linear space; those pixels —
and only those — bleed. This is exactly what the slab does (`fire = (... ) * (uVeinGlow + uSurge)`
added pre-tonemap, with `PAL.hot = (1.9,1.25,0.7)`). It is restated as current best practice
in the 2026 Codrops X-ray build, which pipes a Fresnel color straight into `emissiveNode`
and runs a tiny-strength bloom over only the glowing scene
([Codrops, 2026-03-23](https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/)).
**Tradeoffs:** cheapest, single full-screen bloom, no extra render targets, works on WebGL2
on mobile. Limitation: bloom is luminance-keyed across the *whole frame*, so anything else
that goes >1 (a hot env reflection on the obsidian) blooms too — must be policed at the
material level. For GAELWORX this is a *feature* (one master temperature drives everything),
not a bug. **This is the production lane.**

### 2.2 `MeshStandardMaterial.emissive` + `emissiveIntensity` beyond 1
The "physical" path: a real `emissive` color and `emissiveIntensity` pushed past 1 (the
demo galleries animate `emissiveIntensity` to pulse glow,
[Three.js Demos bloom, 2025](https://threejsdemos.com/demos/postfx/bloom)). Cleaner to reason
about (intensity = temperature), respects lighting/PBR. **Catch:** `emissiveIntensity` is
multiplied *then tone-mapped* — with ACES, an `emissive*intensity` of 3–4 desaturates toward
white fast (see §2.5). For a custom injected look (our `onBeforeCompile` pattern) we add
emissive manually pre-tonemap anyway, so this matters mostly for any drei/standard-material
sparks or letter meshes we don't hand-shader.

### 2.3 Selective bloom via layers / dual-composer (legacy)
Render bloomable objects to a separate composer, black out the rest, merge with an additive
shader ([Sangil Lee, 2025-01-28](https://sangillee.com/2025-01-28-selective-bloom-effect/)).
Gives per-object control with **no HDR requirement**. **Tradeoffs:** two scene renders + a
merge pass = ~2× draw cost, material-swap bookkeeping, and it fights tone mapping. The
2024–2026 community consensus (and the threejs forum maintainers) is that this is
**over-engineered** for most cases — "just push colors out of 0–1 range and that is literally
it." Reject for mobile.

### 2.4 WebGPU MRT emissive bloom (the 2026 frontier)
The new `WebGPURenderer` path: a multi-render-target (MRT) pass writes an **`emissive`
attachment** alongside color, and `bloom(emissivePass, strength, radius)` blooms *only that
buffer* — true selective bloom with no material swaps and per-object intensity
([three.js `webgpu_postprocessing_bloom_emissive`](https://github.com/mrdoob/three.js/blob/37a0863c/examples/webgpu_postprocessing_bloom_emissive.html);
PR [#28913](https://github.com/mrdoob/three.js/pull/28913)). It got **per-attachment MRT
blending** and HDR-output plumbing in late 2025 ([PR #32636, 2025-12-30](https://github.com/mrdoob/three.js/pull/32636))
with the explicit goal of "increasing the glow while preserving color nuance." Maxime
Heckel's field guide confirms TSL/WebGPU is now viable on iOS Safari and is the direction of
travel ([blog.maximeheckel.com, 2025-10-14](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)).
**Tradeoffs:** best-in-class control and the cleanest "emissive = bloom source" model, but
requires migrating the renderer to `WebGPURenderer` and the look to TSL/`emissiveNode`. That
is a *whole-world* change, out of scope for Phase-1 — but it is the natural Phase-2/3 target
and we should keep our emissive contract MRT-portable. (See Deep-Dive §9.)

### 2.5 Tone-mapping operator choice (the make-or-break decision)
This is where hot metal lives or dies. The operator sits at the very end (`OutputPass` /
`<ToneMapping>`), maps linear HDR → display, and **decides the color of every glowing pixel**.

- **ACES Filmic** (current GAELWORX setting, `ForgeCanvas.jsx`): filmic contrast, beautiful
  highlight roll-off, *desaturates and hue-shifts* bright values toward white. A red pushed
  >1 "turns into a light red/orange," and lightsabers "desaturate to white" — this is
  *intended*: hot core → white, cooler halo → saturated ([donmccurdy, threejs forum](https://discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374/2)).
  For a **forge that literally cools white→orange→red→black, this hue/desat behaviour is
  exactly the temperature gradient we want**, for free.
- **AgX / AgX Punchy**: Blender-4 default, gentler, more neutral, *less saturated by design*
  — "a low-contrast starting point for color grading… comparable to shooting flat"
  ([three.js #60609, gkjohnson](https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609);
  [PR #27618, donmccurdy](https://github.com/mrdoob/three.js/pull/27618)). Better for
  wide-gamut/HDRI scenes; for our deliberately-warm narrow-gamut forge it just mutes the fire
  unless we grade it back. AgX Punchy is the usable variant if we ever want a less-white core.
- **Khronos PBR Neutral**: built for e-commerce color-accuracy — preserves base-color sRGB,
  *avoids* the white-out and hue-skew, larger reachable gamut, but it's **the opposite of what
  a forge wants** (it refuses to blow the core to white)
  ([Khronos, 2024-05-16](https://www.khronos.org/news/press/khronos-pbr-neutral-tone-mapper-released-for-true-to-life-color-rendering-of-3d-products);
  [SIGGRAPH Talks '24, Lalish](https://doi.org/10.1145/3641233.3664313)). Wrong tool here.
- **None / Linear-clamped**: clamps each channel at 1 independently → **hue skews** (orange
  clamps to yellow as G saturates) and blown highlights. Avoid.

**Verdict for a forge: keep ACES Filmic.** Its white-out *is* the white-hot. The one thing to
respect: the desaturation means **the saturated red/orange must live in the cooler halo and
the cooling tail of each letter**, not in the hottest core — which is physically correct.

### 2.6 HDR render-target format (the substrate bloom samples)
Bloom quality depends on the buffer it reads. `@react-three/postprocessing`'s
`EffectComposer` exposes `frameBufferType` — set it to `THREE.HalfFloatType` so HDR values
>1 survive into the bloom input instead of being clamped at 1 in an 8-bit buffer (the prop is
in `EffectComposerProps`, [react-postprocessing source](https://github.com/pmndrs/react-postprocessing/blob/master/src/EffectComposer.tsx);
v3.0.x shipped Feb 2025). Core three.js is moving the same way: `WebGLRenderer` gained
`outputBufferType: HalfFloatType` / internal HDR rendering and a simplified `setEffects()`
in 2025 ([PR #32461](https://github.com/mrdoob/three.js/pull/32461)). **GAELWORX must set
`frameBufferType={HalfFloatType}`** or the >1 emissive we worked to create is silently
crushed before bloom ever sees it. (Half-float is the mobile-safe choice; full Float is
overkill and a perf/bandwidth hit.)

### 2.7 mipmapBlur vs UnrealBloom kernel
`mipmapBlur` (the pmndrs `Bloom` default we already use) is a cheap wide multi-mip blur —
ideal for mobile, one downsample pyramid. The classic `UnrealBloomPass` Gaussian chain is
heavier. **Known gotcha:** `mipmapBlur` on **transparent backgrounds** bands on macOS / lower
mip levels ([pmndrs/postprocessing #475](https://github.com/pmndrs/postprocessing/issues/475)) —
irrelevant for us because `ForgeCanvas` runs `alpha:false` with an opaque void background.
Keep `mipmapBlur`.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Stay on the WebGL2 / `@react-three/postprocessing` "HDR-emissive + single mipmap bloom +
ACES" lane (§2.1 + §2.5 + §2.6), and make it a *shared master-temperature system* rather than
per-object glow.** Concretely:

1. **One master temperature field** drives every emissive surface. A single normalized
   `temp ∈ [0,1]` (white-hot→black) maps through one shared GLSL ramp to a radiance value,
   and that radiance is what every surface adds pre-tonemap. The pour, the letters, the
   sparks, and the existing slab veins all read the *same* ramp function and the *same*
   `PAL.hot`/`PAL.ember`/`PAL.crimson` anchors — so nothing can drift out of family.
2. **HDR is reserved, not sprayed.** Only the hottest band of the ramp (and the eternal A/E)
   exceeds 1.0. Everything else sits ≤1 and never blooms. This is the rule the slab already
   obeys and the reason bloom threshold can stay high (~0.55–0.7) without washing.
3. **ACES does the cooling color science for us.** Because ACES whites-out the brightest
   values and keeps saturation in the mid-band, a single rising radiance value *automatically*
   reads white-core → orange-shoulder → red-tail. We don't fight tone mapping; we exploit it.
4. **Half-float buffer + high-threshold mipmap bloom.** `frameBufferType={HalfFloatType}`,
   `luminanceThreshold≈0.6`, `mipmapBlur`, modest `intensity`. Quality-gated exactly like the
   existing `Effects.jsx`.
5. **The A/E "divine fire" is the one permanent HDR source** — pinned above 1 forever, slightly
   cooler-whiter (gold) than the molten orange, with a wider bloom contribution so it visibly
   *radiates onto stone*. It is the only thing that never returns to ≤1.

**Why this and not WebGPU MRT (§2.4)?** MRT emissive bloom is the better long-term model, but
it forces a renderer + TSL migration that touches the whole world; Phase-1's job is a single
cohesive WebGL2 pipeline that ships on the iPhone 15 today. We keep the **emissive contract**
(every hot surface exposes a `temp`→radiance and writes pre-tonemap) deliberately MRT-shaped
so a Phase-2 WebGPU port is a re-wire, not a redesign.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` r17x (current repo), `@react-three/fiber`, `@react-three/postprocessing` **3.0.x**
  (Feb 2025) + `postprocessing` (peer). All already in the build.
- No new deps. The only new renderer config is one prop on `EffectComposer`.

### 4.2 The shared temperature ramp (drop into `shaders.js`, beside `GLSL_NOISE`)
This is the **single source of truth** for forge color. Every emissive surface calls it.

```glsl
// gw_forgeRamp(temp): temp 1.0 = white-hot core ... 0.0 = iron-black.
// Returns LINEAR radiance; the >1 band is what blooms. Anchored to PAL.
// (PAL.hot ~ (1.9,1.25,0.7), PAL.ember ~ #ff5a1e, PAL.crimson ~ #8c140a)
vec3 gw_forgeRamp(float temp){
  temp = clamp(temp, 0.0, 1.0);
  vec3 black  = vec3(0.015, 0.006, 0.004);      // iron-black, deep ember
  vec3 red    = vec3(0.55,  0.075, 0.039);      // forge-red  (PAL.crimson-ish)
  vec3 ember  = vec3(1.0,   0.353, 0.118);      // ember glow (PAL.ember)
  vec3 hot    = vec3(1.9,   1.25,  0.70);       // white-hot core (HDR > 1, blooms)
  vec3 c = mix(black, red,   smoothstep(0.05, 0.35, temp));
  c      = mix(c,     ember, smoothstep(0.35, 0.70, temp));
  c      = mix(c,     hot,   smoothstep(0.70, 1.00, temp));
  return c;
}
// Divine fire: never cools. Slightly gold-white, always HDR, wider glow.
vec3 gw_divineFire(float pulse){            // pulse: subtle living flicker 0..1
  vec3 goldWhite = vec3(2.4, 1.95, 1.15);   // brighter + whiter than molten hot
  return goldWhite * (0.9 + 0.1 * pulse);
}
```

Inline the `PAL` values via `${v3(PAL.hot)}` etc. so they can never drift from `palette.js`.

### 4.3 Pre-tonemap injection (the existing `onBeforeCompile` pattern)
Any hot surface uses the **same hook the slab already uses** — add emissive **before**
`#include <tonemapping_fragment>` so ACES processes it:

```glsl
// in the COLOR chunk, after computing this fragment's `temp` and `glow`:
float temp = /* sampled from the master temperature system (see 4.4) */;
vec3 forge = gw_forgeRamp(temp);
// A/E letters: overlay divine fire where uIsDivine == 1
forge = mix(forge, gw_divineFire(uPulse), uIsDivine);
gl_FragColor.rgb += forge * uGlow;          // uGlow couples to scroll/strike, dt-damped
// ... then #include <tonemapping_fragment> (ACES) runs and does the white-out
```

This matches `ObsidianSlab.jsx` exactly (`COLOR` replacing `#include <tonemapping_fragment>`
with `COLOR + '\n#include <tonemapping_fragment>'`). No new shader architecture.

### 4.4 The r3f component shape (how a "hot" mesh hooks the master system)
A reusable hook keeps every emissive surface on the same clock, palette, and quality tier:

```jsx
// useForgeEmissive.js — shared uniforms for ANY hot surface (letters, pour, sparks)
export function useForgeEmissive({ divine = 0 } = {}) {
  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uGlow:     { value: 0 },          // master intensity (scroll/strike/route)
    uTemp:     { value: 0 },          // master temperature 0..1
    uPulse:    { value: 0 },          // living flicker for divine fire / sparks
    uIsDivine: { value: divine },     // 1.0 = A/E, never cools
  }), [divine])

  useFrame((state, dt) => {
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    uniforms.uTime.value  = t
    // SAME store coupling the slab uses — one world temperature, dt-damped:
    const sc  = sceneFor(forge.route)
    const vel = Math.min(forge.scrollVel * 1.4, 1)
    const tgt = forge.ready ? (sc.veinGlow + vel * 0.5) : 0
    uniforms.uGlow.value  = damp(uniforms.uGlow.value, tgt, 3, dt)
    uniforms.uTemp.value  = Math.min(forge.scrollDamped + vel * 0.25, 1)
    uniforms.uPulse.value = forge.quality === 'static' ? 0 : 0.5 + 0.5 * Math.sin(t * 6.0)
  })
  return uniforms
}
```

The molten pour-front advances by feeding `uTemp` from a per-letter fill mask; cooling is
just that mask's `temp` decaying behind the front. The A/E meshes are identical surfaces with
`divine: 1` — **same material, same hook, one flag**.

### 4.5 The composer change (`Effects.jsx`)
```jsx
import { HalfFloatType } from 'three'
// ...
<EffectComposer
  disableNormalPass
  multisampling={high ? 2 : 0}
  frameBufferType={HalfFloatType}        // <-- HDR survives to bloom (was clamped)
>
  <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.3}
         intensity={high ? 0.9 : 0.6} radius={0.85} />
  {/* ...rest of the existing chain unchanged: aberration, grade, vignette, grain, SMAA */}
</EffectComposer>
```
Threshold nudged 0.55→0.6 because once HDR is preserved in the buffer, slightly more of the
ramp clears 1.0; tune on-device. **ACES stays on the `Canvas`** (`ForgeCanvas.jsx`), which is
correct: react-postprocessing disables three's internal tonemapping and the existing grade
runs after bloom.

### 4.6 Key uniforms & parameters (the tuning surface)
| Uniform / prop | Role | Typical |
|---|---|---|
| `uTemp` | master temperature 0..1 (white-hot→black) | scroll/fill-driven, dt-damped |
| `uGlow` | master emissive intensity | `sceneFor(route).veinGlow` + scroll/strike |
| `uIsDivine` | A/E never-cool flag | 0 or 1 |
| `uPulse` | living flicker (sparks, divine fire) | `0.5+0.5*sin(t*6)` |
| `frameBufferType` | composer HDR substrate | `HalfFloatType` |
| `luminanceThreshold` | bloom gate (only >this blooms) | ~0.6 |
| `intensity` / `radius` | bloom strength / spread | 0.6–0.9 / 0.8–0.9 |

---

## 5. COHESION

Everything in §2/§4 is engineered so this layer is *the connective tissue*, not a bolt-on:

- **Palette:** `gw_forgeRamp` is anchored to the exact `PAL` constants (`palette.js`) the slab
  already inlines — `PAL.crimson`, `PAL.ember`, `PAL.hot`. There is no second set of fire
  colors anywhere; the molten pour, the cooling letters, the veins, and the sparks all read
  the same ramp. The 60/30/10 discipline holds: void dominates, crimson is the deep mass, and
  only the ~10% hot band + the A/E exceed 1.0 and bloom.
- **Lighting:** the world is lit *only by the metal*, which is precisely what an emissive-as-
  lightsource pipeline gives. The drei `<Lightformer>` env in `ForgeCanvas.jsx` stays neutral-
  cool and low (sharp specular on the obsidian, no orange wash) — the *warmth comes entirely
  from emissive*, so the env can't fight the fire. The A/E divine fire "radiating onto stone"
  is just its wide bloom halo spilling over adjacent basalt UVs (and, if needed, a cheap
  faked point contribution sampled in the basalt shader from the same `uTemp`).
- **Shared uniforms / clock:** `useForgeEmissive` reads the *same* `forge.*` store
  (`scrollDamped`, `scrollVel`, `strikeAt`, `route`, `quality`) and the *same* `damp()` the
  slab and embers use — one rAF, dt-correct, no competing loops (`motion-feel` rule 6). A
  strike or a carousel turn flares the pour front and the veins **together** because they read
  one `uGlow`.
- **Sparks & embers:** `Embers.jsx` already additive-blends warm points; reskin its `uColor`
  to `PAL.ember`/`gw_forgeRamp(0.8)` and let the brightest spark cores tip >1 so they bloom
  like the metal — same threshold, same halo. The pour-front sparks are the same material,
  spawned at the moving fill edge and tinted by local `uTemp`.
- **Cooling = the tone-mapper:** because ACES is shared globally, the white-hot→orange→red
  cooling on the letters is the *same* color science applied to the slab veins and the sparks.
  Nothing is hand-tuned per surface; one operator unifies the entire temperature story.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the budget target — true blacks make a clean bloom *more* important and an
over-blown one *more* obvious.

- **Single full-screen mipmap bloom** (no dual-composer, no MRT on WebGL2): one downsample
  pyramid, the cheapest convincing bloom. `mipmapBlur` is the mobile-correct kernel.
- **Half-float, not Float:** `frameBufferType={HalfFloatType}` is the iOS-safe HDR substrate;
  full `FloatType` doubles bandwidth for no visible gain here. (16bpc working buffer matches
  where core three.js is heading, PR #32461.)
- **Quality tiers (honor `useQuality`, mirror `Effects.jsx`):**
  - `high`: bloom + half-float + aberration + SMAA, `dpr [1,2]`, multisampling 2.
  - `low`: bloom + half-float, no aberration/SMAA, lower bloom `intensity`, `dpr [1,1.4]`.
  - `static` (reduced-motion / low-power): **`Effects` not mounted, `frameloop='demand'`**,
    `uTime` frozen (the existing `=== 'static' ? 2 : elapsed` pattern). The forge is a *still*
    luminous frame — emissive ramp still renders (so it's not black), but nothing animates and
    there is **zero post cost**. This is the fallback tier and it must still read as fire.
- **No extra render targets, no material swaps, no second scene render.** The whole reason to
  reject §2.3/§2.4 for Phase-1 is the mobile budget.
- **Mobile-aware bloom params** (the 2026 r3f skill pattern): `radius` and `intensity` step
  down on the low tier; this is already the shape of `Effects.jsx`.
- **Watch GPU bandwidth, not just shader cost:** half-float full-screen buffers + bloom mips
  are fill-rate bound on mobile. Keep `dpr` capped (already done) and the bloom resolution at
  the mipmap default; don't add a second blur.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations (do them in this sequence — most "glow looks wrong" bugs are a swapped step):

1. **Set the HDR substrate first.** Add `frameBufferType={HalfFloatType}` *before* tuning
   anything. If you tune bloom on an 8-bit buffer, your >1 values are already clamped and
   you'll over-crank intensity to compensate → everything washes. This is the #1 silent bug.
2. **Confirm ACES is on the Canvas and tonemapping is OFF in the materials you hand-shader.**
   react-postprocessing disables three's tonemapping inside the composer and re-applies it;
   for any `toneMapped={false}` drei material you must push final color yourself. The slab adds
   emissive *pre*-`tonemapping_fragment`, which is correct — do the same for letters/sparks.
3. **Build the ramp once, in `shaders.js`, anchored to `PAL`.** Don't author per-surface fire
   colors. Every surface imports `gw_forgeRamp`. This is what keeps the world cohesive.
4. **Reserve >1 for the hot band + A/E only.** Verify cold iron-black letters sit ≤1 and do
   **not** bloom. If the whole letter glows, your ramp's black/red anchors are >1 — clamp them.
5. **Set `luminanceThreshold` from the ramp, not by feel.** Pick it just below where the ramp
   crosses 1.0 so the hot core and divine fire bloom and nothing else does. Then nudge on
   device.
6. **Tune intensity/radius LAST, on the iPhone 15.** Bloom spread, OLED true-black, and ACES
   saturation **do not simulate** in the headless/SwiftShader CI shot (`post-fx`/`shader-fx`).
   CI proves it *compiled* (0 console errors); the owner reads the real glow on the panel.
7. **Pitfall — hue shift to yellow:** if orange metal reads yellow, you're clamping per-channel
   (no/None tone mapping) or your ramp's green is too high in the hot band. Trust ACES; keep
   `hot`'s blue/green from the existing `PAL.hot=(1.9,1.25,0.7)` ratio.
8. **Pitfall — divine fire doesn't "radiate onto stone":** bloom radius too tight, or the A/E
   value isn't enough above the molten core. Make divine fire *brighter and whiter* than the
   hottest molten (it is, in `gw_divineFire`) and give bloom a slightly wider `radius`.
9. **Pitfall — static tier goes black:** freeze `uTime` to a nonzero constant (the slab uses
   `2`) so the ramp still evaluates; don't gate the emissive add behind animation.
10. **Verify:** `npm run build` green → `qa-route` @ 393×852 + 1440×900, **0 console errors**
    (SwiftShader compiles the GLSL, so a ramp typo surfaces) → owner device read for bloom/black.

---

## 8. SOURCES (2025–2026)

- **three.js PR #32636 — WebGPURenderer per-attachment MRT blending / emissive-bloom HDR
  output** — 2025-12-30 — <https://github.com/mrdoob/three.js/pull/32636>
- **three.js PR #32461 — WebGLRenderer `outputBufferType` (HalfFloatType internal HDR) +
  `setEffects()`** — 2025 — <https://github.com/mrdoob/three.js/pull/32461>
- **three.js `webgpu_postprocessing_bloom_emissive` example + PR #28913 (MRT emissive selective
  bloom)** — 2025 — <https://github.com/mrdoob/three.js/pull/28913>
- **Maxime Heckel — "Field Guide to TSL and WebGPU" (WebGPU now on iOS Safari; emissive/
  post-processing recipes)** — 2025-10-14 — <https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/>
- **Codrops — "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js" (TSL
  `emissiveNode` → `bloom()`, selective glow on one scene only)** — 2026-03-23 —
  <https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/>
- **Codrops — "Implementing a Dissolve Effect with Shaders and Particles in Three.js"
  (selective Unreal bloom + glowing edges; HDRI-vs-CubeMap to control over-bloom)** —
  2025-02-17 — <https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/>
- **Sangil Lee — "Make the Sun Shine: Selective Bloom Effect" (dual-composer/layers, why it's
  heavyweight)** — 2025-01-28 — <https://sangillee.com/2025-01-28-selective-bloom-effect/>
- **@react-three/postprocessing 3.0.x (`frameBufferType`, EffectComposer) — npm release** —
  Feb 2025 — <https://registry.npmjs.org/@react-three/postprocessing>
- **enzed/r3f-skills — "r3f-postprocessing" skill (mobile bloom gating patterns)** —
  2026-01-25 — <https://playbooks.com/skills/enzed/r3f-skills/r3f-postprocessing>
- **Three.js Demos — "Bloom Glow" (emissiveIntensity animation, tone-mapping ↔ bloom)** —
  2025 — <https://threejsdemos.com/demos/postfx/bloom>
- _(Tone-mapping science, dated 2024 but cited per-brief as canonical pre-2025 technique
  referenced by the above 2025–2026 work):_ Khronos PBR Neutral release
  (<https://www.khronos.org/news/press/khronos-pbr-neutral-tone-mapper-released-for-true-to-life-color-rendering-of-3d-products>),
  SIGGRAPH Talks '24 "Neutral Tone Mapping for PBR Color Accuracy" (<https://doi.org/10.1145/3641233.3664313>),
  three.js AgX discussions (#60609, PR #27618).

---

## 9. DEEP-DIVE CANDIDATES (Phase-2)

1. **WebGPU MRT emissive-bloom migration.** Port the emissive contract (§4) to
   `WebGPURenderer` + TSL `emissiveNode` + `bloom(emissivePass)` so glow is per-object,
   material-swap-free, and color-preserving (PR #32636's stated goal), now that iOS Safari
   supports WebGPU. Quantify the perf delta vs. the WebGL2 single-bloom on the iPhone 15.
2. **A/E "divine-fire radiance onto stone."** A dedicated study of making the eternal A/E
   actually *light the adjacent basalt* and reveal carved Ogham — bloom halo vs. a cheap
   screen-space/analytic area-light contribution sampled from the same `uTemp`, on the mobile
   budget. This is the world's signature beat.
3. **Tone-mapping look development: ACES vs. AgX-Punchy vs. a custom forge curve.** Build a
   side-by-side on the molten ramp specifically; decide whether ACES's white-out is perfect or
   whether a custom CDL/curve gives a more "sacred metal" core without losing the cooling
   gradient. Includes the per-channel hue-shift analysis for orange.
4. **Bloom-budget & banding on OLED.** mipmapBlur mip-count, half-float banding in dark
   gradients on real iOS GPUs, dithering the bloom output, and the exact threshold/radius that
   reads as "forge light" vs. "haze" on a true-black panel — measured on device, not in CI.
