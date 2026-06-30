# 20 — Bloom & the Full Post-Processing Stack

_Phase-1 graphics research · GAELWORX forge world · target: iPhone 15 OLED, single WebGL renderer_

> Scope note: this document owns the **finishing chain** — bloom, chromatic aberration, vignette,
> film grain, color grade, AA, and the order they run in. It is the partner to the `post-fx` skill
> (which encodes the in-repo rules) and consumes the HDR emissive produced by `shader-fx`
> (the molten veins, the A+E divine fire, the spark points). Everything here must keep the
> obsidian void at true black on OLED and let only the forge's own light bloom.

---

## 1. SCOPE

In the GAELWORX forge, the post chain is the **glass of the cathedral** — the last lens every
photon passes through before it hits the iPhone's OLED. The world is pure-void darkness lit *only*
by molten metal: white-hot pour fronts, cooling forge-red letterforms, the unearthly white-gold
A and E that radiate "divine fire," sparks orbiting the heat, and the faint warm bounce on
green-black basalt. None of that reads as **sacred and physically hot** without bloom: bloom is the
optical signature of a light source brighter than the medium can hold, and it is the single effect
that separates "an orange shape on screen" from "a thing emitting heat." On top of bloom, a tight
grade (crushed blacks for the void, a touch of warmth and contrast), refraction-edge chromatic
aberration on the jewel/glass facets, a centering vignette, and a whisper of animated film grain
(which doubles as OLED **dither** to kill banding in the dark gradients) finish the look. The whole
chain is a **shared instrument**: a single `EffectComposer` over one renderer, driven by the same
master temperature uniform that drives the molten material, so a route that "runs hotter" blooms
hotter — the post is not a filter bolted on top, it is the world's atmosphere.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 Bloom flavors

**(a) Threshold (luminance) bloom via `pmndrs/postprocessing` `BloomEffect` — the current repo path.**
This is what `Effects.jsx` already runs: `<Bloom luminanceThreshold={0.55} mipmapBlur />`. Bloom here
is **selective by default through the material, not the pass** — only pixels whose luminance exceeds
the threshold bloom, so you control glow by lifting emissive **above 1.0** in the shader (exactly what
`PAL.hot` / `PAL.emberHot` are reserved for) and setting `toneMapped={false}` on additive
line/point materials so they aren't clamped back into 0–1. `mipmapBlur` builds the glow from a
downsampled mip pyramid (the UE4-style approach Fabrice Piquet documented, which the library's
`MipmapBlurPass` implements), giving a wide, soft, cheap bloom that scales well to mobile.
Tradeoffs: **quality** very good for emissive HDR content; **perf** excellent (mip pyramid is
half/quarter-res by construction); **mobile** the safe default; **complexity** trivial. The one
honest limitation: threshold bloom can't perfectly isolate "this object glows, that identically-bright
object does not" — if two surfaces share a luminance they share a fate.

**(b) `SelectiveBloom` (react-postprocessing).** Lets you pass explicit `lights`/`selection` so only
chosen meshes bloom regardless of brightness. The pmndrs docs themselves recommend **against** it
unless you genuinely need per-object masking: it costs an extra render of the selection and is more
fragile across browsers (documented inconsistencies in selective results). For GAELWORX it is
unnecessary — our "selection" is encoded in the palette (only the >1 values are meant to bloom), so
threshold bloom *is* our selective bloom, for free.

**(c) `UnrealBloomPass` (three core).** The classic Kawase/threshold pass. In a `pmndrs` pipeline it
is strictly worse than `BloomEffect`: it's a standalone pass (breaks the single-fragment merged-effect
optimization that makes `postprocessing` fast), and `BloomEffect` already gives you the same look with
mip blur. Reject for this build.

**(d) MRT / emissive bloom (WebGPU + TSL).** The modern frontier. three.js r17x ships
`webgpu_postprocessing_bloom_emissive` and `_bloom_selective` examples where a **Multiple Render
Target** writes an `emissive` buffer alongside color — `mrt({ output, emissive })` — and `bloomNode`
glows *only* what the material wrote into that buffer. This is true per-material selective bloom with
**no extra scene pass** and no luminance ambiguity. Codrops' January-2026 "Gommage" tutorial uses
exactly this (MSDF text dissolving, finished with MRT selective bloom). `BloomNode` exposes
`strength`, `radius ∈ [0,1]`, and `threshold`. Tradeoffs: **quality** best-in-class selective control;
**perf** excellent on WebGPU; **mobile** WebGPU now ships on iOS Safari (Heckel's Oct-2025 field
guide confirms iOS support), but coverage is not universal and the WebGPU `bloomNode` has a known
**grain/noise artifact** at low strength that needs care; **complexity** high — requires the WebGPU
renderer + TSL, a different node-graph post pipeline, and `@react-three/postprocessing` does not yet
wrap it the way it wraps the WebGL effects. This is a Phase-2 migration candidate, not a Phase-1 pick.

### 2.2 The rest of the chain

- **Chromatic aberration** — RGB sampled at slightly offset UVs to fake lens fringing; the
  False-Earth (Codrops, Apr-2026) chain does exactly this with a per-channel UV offset and `radialModulation`
  so the fringe grows toward the frame edge. We already run it `high`-tier-only with a tiny offset.
- **Vignette** — radial darkening to pull the eye to center; False-Earth even tints theirs (cool-blue
  "visor"). Ours stays neutral-dark.
- **Film grain / noise** — animated noise blended `SOFT_LIGHT`; on OLED it doubles as **dither**,
  breaking up the 8-bit banding that crushed-black gradients show on a true-black panel. Shader.se's
  scroll-driven WebGPU pipeline (Codrops, May-2026) lists "film grain, chromatic aberration, bloom"
  as the standard compose-pass trio.
- **Tone mapping** — ACES Filmic. In WebGL this is set on the renderer (as the repo does on the
  `Canvas`); in a `pmndrs` chain you can instead run a `ToneMapping` effect as the **last color
  operation** for tighter control. In TSL/WebGPU it's the final node before the screen.
- **AA** — `SMAA` (post, cheap, `high`-tier) vs `multisampling` (MSAA on the composer's render target).
  The repo uses both gated: `multisampling={high?2:0}` plus `SMAA` on high.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Stay on WebGL + `@react-three/postprocessing` threshold (`BloomEffect`) bloom for Phase 1**, and
evolve the *existing* `Effects.jsx` chain rather than replace it. Rationale, tied to the world and
the hard constraints:

1. **One renderer, strict mobile budget.** The whole project is built on a single WebGL `Canvas`
   with quality tiers and `dispose()` discipline. A WebGPU/TSL/MRT rewrite is a renderer swap — it
   touches every shader (`onBeforeCompile` GLSL has no WebGPU equivalent) and risks the iOS
   coverage gap right on the primary judge device. The `pmndrs` merged-effect composer already
   collapses bloom + CA + grade + vignette + grain into **few passes**, which is the right call for
   the iPhone-15 budget.

2. **Selective-by-palette is already designed in.** `palette.js` reserves `PAL.hot` (1.9, 1.25, 0.7)
   and `PAL.emberHot` (1.7, 0.7, 0.22) as the only >1 values, and the comment is explicit: "HDR (>1)
   values are intentional so only the 10% blooms." That means **threshold bloom is our selective
   bloom** — the molten vein cores, the divine-fire A/E, and the spark points are the things pushed
   above 1.0; everything else (the deep crimson 30%, the void 60%, the basalt) stays sub-1 and never
   blooms. We get MRT-like selectivity with zero extra cost. This is the single most important
   cohesion fact in the whole chain.

3. **The grade is the brand.** Crushed blacks (`BrightnessContrast brightness=-0.04 contrast=0.16`)
   keep the obsidian true-black on OLED so the fire detonates against it — this is precisely the
   "increase contrast between light and darkness with bloom" instinct Heckel describes, executed for
   a true-black panel.

**The Phase-1 deliverable** is therefore: keep the order, add a master-temperature drive on bloom
intensity, add a `ToneMapping` effect as the explicit terminal color op (so tone mapping order is
unambiguous and tunable), keep CA/SMAA `high`-only, and make grain do double duty as OLED dither.
**Phase-2** is the documented MRT/TSL migration once WebGPU iOS coverage is safe to assume.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (already in repo; `MeshPhysicalMaterial.onBeforeCompile` GLSL injection is the
  shader path — keep it).
- `postprocessing` (pmndrs) + `@react-three/postprocessing` — already imported in `Effects.jsx`.
  Pin to the current `postprocessing` ≥ 6.3x line that ships `MipmapBlurPass` and the merged
  `EffectPass`. No new deps for Phase 1.
- Leva (already present) for `?debug` live-tuning of the new knobs.

### 4.2 The chain (order is load-bearing)

Keep the documented order from the `post-fx` skill, with one addition — an explicit terminal
`ToneMapping` so the ACES op is a controllable pass rather than only a renderer flag:

```
Bloom → ChromaticAberration → HueSaturation → BrightnessContrast → Vignette → Noise(grain) → SMAA → ToneMapping
```

Order logic (matches the pmndrs convention and the False-Earth/Shader.se chains): **scene/light
effects first (bloom), then color grade, then screen-space lens effects (CA, vignette), then
grain, then AA, tone mapping last.** Grain and tone mapping must sit at the end so they operate on
the fully-composited frame; bloom must sit first so it blooms the *raw* HDR, not the graded result.

### 4.3 r3f component shape (Phase-1 evolution of `Effects.jsx`)

```jsx
import {
  EffectComposer, Bloom, ChromaticAberration, HueSaturation,
  BrightnessContrast, Vignette, Noise, SMAA, ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge, range } from '../store.js'

export default function Effects({ quality }) {
  const high = quality === 'high'
  const bloom = useRef()

  // MASTER TEMPERATURE → bloom. The same forge.* signals that heat the veins
  // (ObsidianSlab) and the jewel edges (FacetedJewel) push the glow. dt-free here
  // because bloom intensity is a scalar the composer reads each frame; we damp the
  // *source* (uVeinGlow) already, so we can sample a smoothed temperature directly.
  useFrame(() => {
    if (!bloom.current) return
    const heat = Math.min(forge.scrollDamped + Math.min(forge.scrollVel * 0.25, 0.3), 1)
    const base = high ? 0.9 : 0.6
    bloom.current.intensity = base + heat * 0.5          // hotter route ⇒ hotter bloom
  })

  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      <Bloom
        ref={bloom}
        mipmapBlur                       // wide cheap glow (UE4 mip pyramid)
        luminanceThreshold={0.55}        // ONLY HDR>1 emissive blooms → palette-selective
        luminanceSmoothing={0.3}
        intensity={high ? 0.9 : 0.6}
        radius={0.8}
      />
      {high ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012]}      // refraction-edge fringe, tiny
          radialModulation
          modulationOffset={0.42}        // fringe grows toward frame edge
        />
      ) : <></>}
      <HueSaturation saturation={0.12} />                {/* richer fire, not garish */}
      <BrightnessContrast brightness={-0.04} contrast={0.16} /> {/* crushed void blacks */}
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={high ? 0.05 : 0.035}    // grain = OLED dither against banding
      />
      {high ? <SMAA /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /> {/* explicit terminal op */}
    </EffectComposer>
  )
}
```

> If `ToneMapping` is added as a pass, set `gl.toneMapping = NoToneMapping` on the `Canvas` to avoid
> double-grading (you tone-map **once**, in the pass). If you keep tone mapping on the renderer (the
> current setup), **omit** the `ToneMapping` effect. Pick one; never both. For Phase 1 the lowest-risk
> move is to **keep the renderer's ACES flag and not add the pass** — the pass is offered here for the
> tuning pass, with the double-grade caveat called out.

### 4.4 Key uniforms & parameters

| Param | Value | Why |
|---|---|---|
| `luminanceThreshold` | `0.55` | gate so only emissive >1 (after tone map headroom) blooms |
| `luminanceSmoothing` | `0.30` | soft knee so the bloom onset isn't a hard edge |
| `intensity` | `0.6`→`0.9` base, `+heat*0.5` | master-temperature drive; hotter routes glow more |
| `radius` | `0.8` | wide soft mip bloom (sacred halo, not a sharp ring) |
| `ChromaticAberration.offset` | `[0.0008, 0.0012]` | sub-pixel fringe on glass/jewel edges; high-tier only |
| `BrightnessContrast` | `b -0.04 / c 0.16` | crushed blacks → OLED true-black void |
| `Noise.opacity` | `0.035`–`0.05` | grain + dither; keep subtle |

### 4.5 Hooking the master temperature system

The world already exposes a temperature/energy bus in `store.js` (`forge.scrollDamped`,
`forge.scrollVel`, `forge.strikeAt`). `ObsidianSlab` reads it into `uVeinGlow`/`uTemp`/`uSurge`;
`FacetedJewel` reads it into `uHeat`. **Bloom should read the same bus** (the `useFrame` above), so
when the pour runs hot (scroll energy, a strike pulse, a hotter per-route preset) the emissive
*and* the bloom that amplifies it rise together. That single shared signal is what makes the bloom
feel like the world breathing rather than a static filter.

---

## 5. COHESION — sharing palette, lighting, uniforms

- **Palette.** Bloom obeys `PAL` by construction: the 60% void and 30% deep-crimson are sub-1 and
  never bloom; the 10% (`PAL.hot`, `PAL.emberHot`, the additive ember points/edges) are >1 and are
  the *only* things that glow. The grade's warmth (`HueSaturation +0.12`) and crushed blacks keep the
  composited frame inside the warm-forge identity. **No cool/green/blue cast** ever enters the grade
  (brand law) — even though basalt is green-black, that green lives in the *material*, not the post.

- **The A+E divine fire.** This is the chain's hero responsibility. The A and E that "stay white-gold
  forever and radiate onto stone" must be pushed to a higher emissive than the cooling letters
  (e.g. `PAL.hot` scaled >1, `toneMapped=false` on any additive halo geometry) so they sit clearly
  above the bloom threshold and bloom *more* than the forge-red body. Because bloom is wide
  (`radius 0.8`), their glow spills onto adjacent geometry in screen space — which is the optical
  cousin of "radiate light onto adjacent stone," and reinforces the divine-fire read without a
  second light. The brand's `.forge-letter` DOM gradient and this 3D bloom must share the same warm
  ramp so the wordmark and the molten letterforms read as one material.

- **Sparks & embers.** `Embers.jsx` points already use `AdditiveBlending` with an HDR-ish warm color
  (`1.0, 0.45, 0.12`). To make sparks bloom (the "living sparks orbit the pour front, drawn by heat"
  beat), push their `uColor` >1 and keep `toneMapped` effectively off (additive points bypass clamp);
  the threshold bloom then halos each spark for free, on the same pass as the veins.

- **Lighting it grades.** Bloom only catches what the lightformer env + emissive shaders emit. The
  env stays the cool-neutral `<Lightformer>` rig (no EXR) so the obsidian reads as dark glass; the
  warmth comes entirely from emissive in-material. Fix emissive first, grade second — never crank
  bloom to compensate for dark geometry (that washes the whole frame).

- **Motion.** Per `motion-feel`, don't animate heavy blur on large surfaces; the bloom intensity ride
  is a cheap scalar (the blur kernel size is constant), so the temperature-driven glow is
  compositor-safe. Reduced-motion / `static` tier mounts **no** `Effects` at all (ForgeCanvas gates
  it), so the grade degrades to the raw ACES renderer output — still on-brand, zero post cost.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Tier gating (already correct, keep it):** `multisampling={high?2:0}`, CA + `SMAA` `high`-only,
  whole `<Effects>` unmounted on `static` with `frameloop='demand'`. `disableNormalPass` (no normal
  buffer cost — we don't use SSAO/SSR). `AdaptiveDpr` on.
- **Bloom is the cheap one.** `mipmapBlur` works on a downsampled pyramid (½, ¼, ⅛ …), so its cost is
  near-resolution-independent — the recommended mobile bloom path. This is why bloom can stay on at
  every non-static tier without busting budget.
- **Merged passes.** `postprocessing`'s `EffectPass` compiles bloom-adjacent effects (HueSaturation,
  BrightnessContrast, Vignette, Noise, CA) into **one fragment shader / one fullscreen pass**; only
  bloom and SMAA are separate passes. Keeping all the grade effects as `Effect`s (not standalone
  `Pass`es) is what keeps the chain at ~3 passes on mobile. Do **not** introduce a standalone pass
  (e.g. `UnrealBloomPass`) that breaks the merge.
- **DPR discipline.** `ForgeCanvas` already caps `dpr` per tier (`[1,2]` high, `[1,1.4]` low,
  `1` static). The composer renders at that DPR; the bloom pyramid is relative to it, so a capped DPR
  caps bloom cost automatically.
- **Fallback / reduced tier.** Static = no post, no animated grain, no bloom — the obsidian + ACES
  renderer tone map is the floor, and `CanvasBoundary` falls back to a static poster on WebGL
  failure. The grade must look acceptable *without* post (it does: crushed-black + warm emissive is
  baked into the material/renderer, not the chain).
- **OLED banding.** The one mobile-specific *quality* risk is 8-bit banding in the dark
  void-to-crimson gradients on a true-black panel. The animated `Noise` grain at `opacity≈0.04`
  dithers this away — so on mobile, **do not drop grain below ~0.03 even on the low tier**; it earns
  its cost as a dither, not just texture.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do these in sequence — each unblocks the next):**

1. **Emissive before bloom.** Confirm the things that should glow are actually >1 in the shader
   (`PAL.hot`/`emberHot`, `toneMapped=false` on additive line/point materials). If a vein/A-E/spark
   doesn't bloom, **raise its emissive — never raise bloom intensity.** (The #1 documented pitfall.)
2. **Lock the threshold once.** `luminanceThreshold=0.55` is tuned for ACES headroom. If you change
   tone mapping, the effective threshold shifts — re-verify, don't guess.
3. **Pick tone-mapping ownership.** Either the renderer's ACES flag **or** a terminal `ToneMapping`
   pass — never both (double-grade washes blacks and over-saturates fire). Phase-1 default: keep the
   renderer flag, skip the pass.
4. **Master-temperature drive last.** Wire bloom intensity to `forge.*` only after the static look is
   right, so you're modulating a known-good baseline, not chasing a moving target.
5. **CA is a whisper.** Offsets in the `0.0008–0.0012` range. Anything larger reads as "broken glass /
   3D-TV," not "refraction edge." High-tier only.
6. **Grain is dither, kept subtle.** `SOFT_LIGHT`, `opacity≈0.04`. Too much = cheap; too little =
   OLED banding returns. Tune on the device, not the laptop.

**Specific pitfalls:**
- `toneMapped` left `true` on additive halo/spark/edge materials → colors clamped to 1 → they never
  cross the bloom threshold → no glow. (FacetedJewel's edge line already sets `toneMapped={false}` —
  copy that everywhere a thing must bloom.)
- Cranking `Bloom.intensity` to force a dim object to glow → blooms the *whole frame* → washed,
  milky void, dead OLED blacks. Fix emissive instead.
- Adding `SelectiveBloom` or `UnrealBloomPass` "for control" → breaks the merged-pass perf and adds
  a scene render. Threshold + palette already *is* the selection.
- Double tone mapping (renderer flag + pass).
- Animating the bloom **radius/kernel** (heavy) instead of **intensity** (cheap) to fake a pulse.
- Forgetting `static`-tier has no post: verify the no-post frame still reads on-brand.
- Verify the build the repo way: `qa-route` → SwiftShader compiles GLSL, **0 console errors ≈ it
  compiled**; then read bloom spread / true-black / saturation on the **iPhone 15 OLED** — none of
  those simulate in the headless shot.

---

## 8. SOURCES (2025–2026)

1. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Ming Jyun Hung,
   2026-04-21). WebGPU/TSL post chain: chromatic aberration via offset-UV RGB sampling, cool-tinted
   vignette, bloom for emissive glow, tone mapping last, wired as a node graph.
   https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
2. **Codrops — "80s Business Tech … Shader.se's Scroll-Driven WebGPU Pipeline"** (Filip Kantedal,
   2026-05-19). Compose-pass post stack (film grain, chromatic aberration, bloom); R3F + TSL
   targeting WebGPU with WebGL fallback; per-section render-pass skipping for perf.
   https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
3. **Codrops — "WebGPU Gommage Effect … with Three.js & TSL"** (2026-01-28). MRT-based selective
   bloom (`mrt({ output, emissive })`) finishing a dissolving-text scene.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
4. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). Confirms WebGPU support landed
   in recent iOS/Safari; porting WebGL post-processing to TSL/compute; the WebGL→WebGPU tradeoffs
   relevant to a future migration.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. **Maxime Heckel — "Post-Processing Shaders as a Creative Medium"** (2025). Bloom used to increase
   contrast between light and darkness; chromatic dispersion / lens effects as a creative grade.
   https://blog.maximeheckel.com/posts/post-processing-as-a-creative-medium/
6. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026-01-12).
   Post-processing perf rules: prefer pmndrs/postprocessing over three's default, disable
   multisampling where unused, mediump on mobile, frameloop=demand for static, dispose render
   targets, dt-frame independence.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
7. **three.js docs — `BloomNode`** (r17x, 2025–2026). WebGPU bloom node params: `strength`,
   `radius ∈ [0,1]`, luminance `threshold`; the MRT selective-bloom path.
   https://threejs.org/docs/pages/BloomNode.html
8. **three.js examples — `webgpu_postprocessing_bloom_emissive` / `_bloom_selective`** (r17x).
   Reference implementations of emissive-buffer MRT selective bloom.
   https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html
9. **react-postprocessing docs — `Bloom` / `SelectiveBloom` / `EffectComposer`** (pmndrs, current).
   "Bloom is selective by default" via material colors lifted out of 0–1 with `toneMapped=false`;
   `mipmapBlur`; SelectiveBloom discouraged unless masking is required.
   https://react-postprocessing.docs.pmnd.rs/effects/bloom
10. **pmndrs/postprocessing docs — `MipmapBlurPass`** (current). UE4-style mip-pyramid bloom blur
    (after Fabrice Piquet); the cheap wide-glow mechanism behind `mipmapBlur`.
    https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/MipmapBlurPass.js~MipmapBlurPass.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **MRT / TSL emissive-bloom migration.** A full plan to move the chain to the WebGPU renderer with
   `mrt({ output, emissive })` selective bloom — true per-material glow control, the documented
   `bloomNode` grain artifact and its fix, and a WebGL-fallback strategy so iOS coverage gaps don't
   black-canvas the judge device. Highest-leverage future upgrade.
2. **The A+E divine-fire glow as a dedicated bloom budget.** How to make the white-gold A/E bloom
   *measurably more* than the cooling letters and "radiate onto adjacent stone" — separate threshold
   tier, a screen-space radiance falloff that lights the Ogham, and keeping it stable as the
   letterforms fill and cool left-to-right.
3. **OLED-accurate grade & dither.** Crushed-black tone-mapping math (ACES vs AgX vs custom) for a
   true-black panel, blue-noise vs white-noise dither to kill void-to-crimson banding, and measuring
   the result on-device rather than on an sRGB laptop.
4. **Temperature-coupled post as a world bus.** Formalize one master `uTemp`/energy signal feeding
   material emissive, bloom intensity, spark spawn rate, and heat-shimmer strength together — so the
   whole forge "runs hot" as one coherent system across every route's compose pass.
