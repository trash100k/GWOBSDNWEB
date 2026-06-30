# 53 — MRT-Emissive Bloom + TSL PostProcessing Parity (the finish that survives a renderer swap)

_Phase-2 deep-dive · GAELWORX forge world · cluster **H-webgpu-tsl-future** · target: iPhone 15 OLED, one
WebGL2 renderer today (`@react-three/postprocessing` + pmndrs `postprocessing`), WebGPU `RenderPipeline`
gated post-judge · files under the lens: `src/scene/Effects.jsx`, `src/scene/palette.js`, a staged sibling
`src/scene/tsl/post/`_

> **Reads on top of:** `00-COHESION-MAP.md` (§3 the one film stock, §6 the one composer / one finish, §10
> the perf budget + WebGPU-is-gated clause), `phase1/20` (the threshold-bloom WebGL chain that *ships* and the
> exact order), `phase1/30` (renderer verdict — ship WebGL2, author TSL-portable), `phase2/41` (the MRT
> *temperature* buffer — the sibling that writes `T`/`E`/`AE` and proves MRT is affordable on the tile GPU),
> `phase2/50` (the GLSL↔TSL sibling-pair discipline and the byte-identical proof harness — this doc is the
> **post-chain** application of that same discipline), and `phase2/38` (the `forgeHeat` bus that rides bloom
> intensity / exposure / grade sat). Where `phase1/20 §9.1` *named* this migration and `phase2/41` proved the
> *temperature* MRT, **this doc owns the *emissive* MRT attachment and the full TSL post-chain parity** — the
> exact node graph, the verified-identical grade/CA/vignette/grain, and the `bloomNode` low-strength grain fix.

---

## 1. SCOPE — this element in the GAELWORX world

The finish is the glass of the cathedral (`phase1/20 §1`): the last lens every forge photon passes through
before it detonates against the iPhone OLED. Today that finish is a **luminance-threshold** bloom — pmndrs
`<Bloom mipmapBlur luminanceThreshold={0.55}>` over a half-float composer, followed by CA, a warm
`HueSaturation`, crushed-black `BrightnessContrast`, a neutral `Vignette`, `Noise`-as-OLED-dither, and SMAA.
It works *because the palette is the selector* (`00 §3.1`): only `PAL.hot` (1.9, 1.25, 0.7), `PAL.emberHot`
(1.7, 0.7, 0.22), and the additive ember points exceed 1.0, so threshold bloom blooms exactly the 10% accent
band and nothing else. The void stays pixels-off black; the divine-fire A/E and the white-hot pour front glow;
the deep-crimson mass and the green-black basalt do not.

But threshold bloom has one structural lie the brief targets: **it cannot tell "this surface is hot" from
"this surface is reflecting something hot."** The obsidian slab is `roughness 0.05` — a near-mirror. When the
procedural env's cool specular streak (`00 §5.3`) or a white-hot letter's reflection lands on the polished
slab, those reflected pixels can cross the luminance threshold and **bloom as if they were emissive**. The
divine-fire halo that should radiate *only* from the A/E letterforms instead smears off every glossy
reflection of them. On a cinematic build judged on an OLED, that reads as the bloom being "stuck to the glass,"
not emanating from the metal — the exact "bolted-on" crack `00 §7` forbids, dressed as a reflection.

**The MRT-emissive attachment fixes this at the source.** Instead of asking "is this pixel bright?", the hero
pass writes a *dedicated emissive buffer* alongside HDR color — `setMRT(mrt({ output, emissive }))` — and
bloom glows **only what the material wrote into `emissive`**. The molten body writes `gw_forge(temp)` into
`emissive`; the divine A/E write `gw_divineFire(flick)` into `emissive`; the sparks write their hot color into
`emissive`. The reflections, the env streak, the basalt's lit green — all go to `output` (color) but write
**zero** to `emissive`, so they never bloom no matter how bright the reflection. Bloom becomes *exact*,
*decoupled from reflections*, and per-material controllable. This is the same single-source-of-truth move
`phase2/41` made for *temperature* (`T`/`E`/`AE` in a second attachment) — here the second attachment is the
**emissive radiance field**, and bloom is its only consumer.

The scope has two halves, both gated post-judge but **authored now** (`phase1/30 §3`):

1. **The MRT-emissive attachment + `bloomNode`** — true per-material selective bloom, the low-strength grain
   artifact fix, decoupled from reflections, sharing the temperature MRT's plumbing (`phase2/41`).
2. **Full TSL post-chain parity** — reproduce the *exact* warm/crushed-black grade + CA + vignette +
   grain-as-dither of `Effects.jsx` as TSL nodes, **verified byte-identical** to the shipped pmndrs chain via
   the `phase2/50` difference-image harness. This is the gate: *does the finish survive the renderer swap?*

The single failure this guards against: a WebGPU port whose bloom catches reflections, whose grain pumps at
low strength, or whose grade shifts the fire hue / lifts the black point — any of which fractures the one-film-
stock cohesion (`00 §3`).

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 The bloom-selection axis (how a pixel is chosen to glow)

**(a) Luminance threshold — the shipped WebGL path (`phase1/20`, baseline).** `BloomEffect` /
`mipmapBlur` glows every pixel above `luminanceThreshold`. *Selection = the palette* (only >1 values cross).
**Quality:** very good for HDR-emissive content; the documented limit is exactly the reflection ambiguity §1
describes — two surfaces sharing a luminance share a fate. **Perf:** excellent (mip pyramid, half/quarter-res).
**Mobile:** the safe default; ships to the judge. **Complexity:** trivial. **Verdict for §1 problem:** cannot
solve it — a bright reflection *is* a bright luminance.

**(b) `SelectiveBloom` (react-postprocessing, WebGL).** Pass explicit `selection`/`lights`; only chosen meshes
bloom. **Quality:** solves per-object masking — but at the cost of an **extra render of the selection**, and
the pmndrs docs themselves discourage it (documented cross-browser inconsistency). **Perf:** an extra scene
pass — the wrong move on a fill-rate-bound iPhone (`00 §10`). **Mobile:** rejected for the judge. **Verdict:**
the right *idea* (per-object selection) with the wrong *mechanism* (a second pass). MRT does the same selection
in one pass.

**(c) MRT-emissive buffer + `bloomNode` — the WebGPU/TSL frontier (the pick for the port).** three.js r17x+
ships `webgpu_postprocessing_bloom_emissive` and `_bloom_selective`: a Multiple-Render-Target scene pass
writes an `emissive` attachment beside `output`, and bloom runs on the emissive texture node only. The TSL
authoring is clean (threejsroadmap *Complete Guide to Three.js Post-Processing in 2026*; three.js examples):

```js
import { pass, mrt, output, emissive, bloom } from 'three/tsl'
const scenePass = pass(scene, camera)
scenePass.setMRT(mrt({ output, emissive }))            // one render, two attachments
const outputTex   = scenePass.getTextureNode('output')
const emissiveTex = scenePass.getTextureNode('emissive')
const bloomPass   = bloom(emissiveTex, /*strength*/ 0.9, /*radius*/ 0.8, /*threshold*/ 0.0)
renderPipeline.outputNode = outputTex.add(bloomPass)   // glow ONLY the emissive field
```

`emissive` here is three's built-in node that resolves a material's `emissiveNode`/emissive output — so a
`MeshStandardNodeMaterial` with `emissiveNode = gw_forge(temp)` writes the molten radiance to the buffer for
free, and any material that writes **zero** emissive (the basalt, the slab's reflective body) is excluded from
bloom *by construction* — reflections cannot leak in. Codrops' *Gommage* (Jan 28 2026) uses the per-material
variant: `material.mrtNode = mrt({ bloomIntensity })` writes a chosen scalar per fragment, so dissolving MSDF
text controls its own glow budget. **Quality:** best-in-class — exact, reflection-decoupled, per-material.
**Perf:** excellent on native WebGPU (one pass; the attachment can stay in tile memory across merged nodes —
the discount WebGL2 forfeits, `phase2/41 §6`). **Mobile:** WebGPU is GA on iOS 26 / Safari 26 (WWDC 2025), but
the `WebGPURenderer` WebGL2-*fallback* branch is the documented risk (`00 §10`). **Complexity:** high — it is
the `RenderPipeline` node grammar, not pmndrs `EffectPass`. **The known wart:** the `bloomNode` **grain/granu-
lation artifact at low strength** (§2.3) — the brief's named fix.

**(d) Threshold *on* the emissive buffer (the belt-and-braces hybrid).** Run `bloom(emissiveTex, …,
threshold)` with a small threshold so even within the emissive field, only the genuinely-hot band glows. This
combines MRT selection (no reflections) *and* palette selection (only >1 emissive), and is how the GAELWORX
divine-fire tiering survives the port — the A/E write the highest emissive and bloom most. **Verdict:** the
recommended port configuration — MRT decides *what can* bloom, threshold decides *how hot it must be*.

### 2.2 The post-chain-parity axis (reproducing the grade as nodes)

The pmndrs WebGL chain is a *merged `EffectPass`* (one fragment shader for CA+grade+vignette+grain). The WebGPU
equivalent is a **node graph** assigned to `renderPipeline.outputNode` (the r183 rename of `PostProcessing` —
threejsroadmap 2026; the same class, WebGPU-first with WebGL2 fallback). Every pmndrs effect has a 2025-2026
TSL node twin, with documented signatures (three.js docs; goodtsl.com; threejs-blocks.com):

| pmndrs WebGL (today) | TSL node (the twin) | Signature (2026) |
|---|---|---|
| `<Bloom mipmapBlur threshold>` | `bloom(node, strength, radius, threshold)` | `BloomNode`; `radius ∈ [0,1]` |
| `<ChromaticAberration offset>` | `chromaticAberration(node, strength=1, center=null, scale=1.1)` | `ChromaticAberrationNode` |
| `<HueSaturation saturation>` | `node.hue(h)` / `saturation(node, s)` color ops | TSL color operators |
| `<BrightnessContrast b,c>` | arithmetic nodes (`add`/`mul`) or a CDL `Fn()` | hand-authored |
| `<Vignette offset,darkness>` | `vignette(...)` | `VignetteNode` |
| `<Noise SOFT_LIGHT opacity>` | `film(input, intensity, uv)` | `FilmNode`; custom blend |
| renderer ACES flag | `agxToneMapping(color, exposure)` / `acesFilmicToneMapping` | TSL tone-map nodes |

The order is the same load-bearing chain as `phase1/20 §4.2` / `00 §6`, just wired as nodes:
`scenePass → bloom(emissive) → CA → hue/sat → brightness/contrast → vignette → film(grain) → toneMap →
outputNode`. The Codrops 2026 chains validate the idiom: *False Earth* (Apr 21 2026) wires CA (offset-UV RGB)
+ tinted vignette + bloom + tone-map-last as a node graph on `outputNode`; *Shader.se* (May 19 2026) lists
"film grain, chromatic aberration, bloom" as the standard compose trio with WebGL2 fallback. **The parity
question is not "can it be wired?" (it can) but "is it *identical*?"** — which is the §4.5 harness's job.

### 2.3 The `bloomNode` low-strength grain artifact (the named fix)

The documented WebGPU `bloomNode` defect (three.js forum *"How to remove WebGpu bloomNode grain?"*, thread
72711): at **low bloom strength**, the mip-pyramid bloom shows visible **granulation/noise**, *most evident
when objects move horizontally* — the under-sampled low mips read as crawling grain rather than smooth halo.
For GAELWORX this is lethal: our bloom strength is *deliberately restrained* (`intensity 0.6–0.9`, a "sacred
halo, not a blowout" — `phase1/20 §4.4`), which is exactly the low-strength regime where the artifact bites,
and the divine-fire A/E that must read as *serene eternal* glow would instead shimmer with noise.

The fix, from the same thread (Mugen87, three.js maintainer): **wrap the bloom in an extra blur pass** —

```js
import { gaussianBlur } from 'three/tsl'
// instead of:  outputNode = outputPass.add( bloomPass )
renderPipeline.outputNode = outputPass.add( gaussianBlur( bloomPass ) )
```

The `gaussianBlur` smooths the under-sampled low-mip grain into a continuous halo before it is added back to
the frame — at a small extra fullscreen blur cost. Three secondary levers stack with it: (1) raise `radius`
toward 1.0 (wider kernel = more inter-mip smoothing); (2) keep the emissive content genuinely HDR (>1) so the
bloom has real energy to spread rather than amplifying near-threshold noise — *the same "fix emissive, not
intensity" law* as the WebGL chain (`phase1/20 §7.1`); (3) **let the grade's own `film()` grain double as the
hiding layer** — GAELWORX already runs grain-as-OLED-dither at the *end* of the chain (`00 §3.3`), and a whisper
of authored grain over the whole frame masks residual bloom crawl while doing its dither job. The order matters:
the `gaussianBlur` cleans the bloom *before* the add; the `film` grain dithers the *composited* frame after.

### 2.4 The transparent/additive edge case (a 2026 regression to budget for)

three.js issue **#32570** (Dec 16 2025): emissive-MRT selective bloom that worked in r181 broke in r182 for an
emissive object *behind* a transparent `AdditiveBlending` surface (a bulb behind headlight glass). GAELWORX
has the structurally identical case — the white-hot pour front and divine-fire letters seen *through* the
near-mirror obsidian, and the additive ember points (`Embers.jsx`, `AdditiveBlending`). The lesson: **the
emissive MRT attachment interacts with blending mode**, and the behavior has churned across r181→r182. This is
a *pin-and-verify* item, not a blocker — pin a known-good r17x/r18x, and the §4.5 harness must include an
additive-spark-through-glossy-slab test case, verified on the device, before the gate flips.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Keep the shipped WebGL threshold chain exactly as-is for the judge (`Effects.jsx`, `phase1/20`). Author the
TSL post-chain twin now as cold storage, built on the *emissive* MRT attachment (sharing `phase2/41`'s second-
attachment plumbing), configured as the §2.1(d) hybrid (MRT selection + small threshold), with the §2.3
`gaussianBlur(bloom)` grain fix baked in from the start, and prove byte-identity against the pmndrs chain with
the `phase2/50` difference-image harness. Flip the renderer only when the parity passes on a real iPhone 15.**

Justification, rooted in the world and the constraints:

1. **The selection problem is real and MRT is the *only* clean fix.** The slab is `roughness 0.05`; reflections
   *will* cross a luminance threshold (§1). On WebGL we live with it (the reflected hot content is at least the
   *right color*, and the env streak is cool/dim by design — `00 §5.3`). But the *moment* we have WebGPU, the
   emissive buffer makes the divine-fire halo emanate from the letterforms exactly, not from their glossy
   echoes — a measurable cinematic upgrade for the keystone beat (`00 §1.4`). MRT, not `SelectiveBloom`,
   because MRT adds **no second scene pass** — non-negotiable on the fill-rate-bound iPhone (`00 §10`).

2. **It re-uses `phase2/41`'s buffer, not a new one.** `phase2/41` already gates a second HalfFloat attachment
   on `high` carrying `T`/`E`/`AE`. The emissive radiance is *literally* `gw_forge(T)` — the same `E` field, in
   HDR color rather than scalar. So the emissive attachment is **the temperature buffer's color sibling**, not a
   third target: one MRT pass writes `{ output: color, heat: T/E/AE, emissive: gw_forge·divineFire }`. The bloom
   reads `emissive`; the haze/god-rays read `heat`. Same pass, same tile-memory budget envelope (`phase2/41 §6`).

3. **The grade *is* the brand and must survive the swap byte-for-byte.** Crushed blacks (`brightness -0.04,
   contrast 0.16`), warm `+0.12` sat, grain-as-dither — these are `PAL`-and-OLED-tuned constants (`00 §3.3`),
   not API behavior. A TSL re-host that drifts the black point or warms differently fractures the one film stock
   (`00 §3`). So parity is **verified**, not assumed — the `phase2/50` harness diffs the pmndrs frame against
   the TSL frame *through the tone-mapper* on the OLED, max channel delta ≤ 2/255.

4. **The grain fix is designed in, not retrofitted.** GAELWORX's restrained `intensity 0.6–0.9` lands squarely
   in the §2.3 artifact regime. The port wires `gaussianBlur(bloom)` from line one, keeps emissive genuinely
   HDR, and leans on the existing end-of-chain `film()` dither — so the divine-fire reads serene, never crawly.

5. **It ships nothing to the judge.** Per `phase1/30 §3` and `00 §10`, the judged build is WebGL2 + pmndrs.
   The TSL post nodes live in `src/scene/tsl/post/`, tree-shaken (no `three/webgpu` import on the WebGL path).
   Zero bundle cost, zero runtime risk on the primary device.

**In one line:** *the emissive MRT attachment makes the divine-fire bloom exact and reflection-free, the TSL
post-chain re-hosts the warm crushed-black grade verified-identical, the `gaussianBlur(bloom)` fix kills the
low-strength grain — and none of it ships until the parity harness passes on the iPhone 15 OLED.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Now (judged build):** `three` r17x/r18x classic `WebGLRenderer`, `@react-three/fiber` v8,
  `@react-three/postprocessing` + pmndrs `postprocessing` (the merged `EffectPass`). **No new runtime dep.**
  `Effects.jsx` is unchanged.
- **Staged (post-judge, behind the `gw_webgpu` capability gate — `phase1/30 §4.3`):** `three/webgpu`
  (`WebGPURenderer`, `MeshStandardNodeMaterial`/`MeshPhysicalNodeMaterial`), `three/tsl`
  (`pass`, `mrt`, `output`, `emissive`, `bloom`, `gaussianBlur`, `chromaticAberration`, `vignette`, `film`,
  `agxToneMapping`/`acesFilmicToneMapping`, color ops), `@react-three/fiber` **v9** (async `gl` + `extend`).
  Pin **r183+** for the `RenderPipeline` class (the renamed `PostProcessing`), and **pin past r182** while
  verifying the #32570 additive-blend regression (§2.4).
- **Reference only (never bundled):** three.js examples `webgpu_postprocessing_bloom_emissive` /
  `_bloom_selective`, Codrops *Gommage* (the per-material `mrtNode`), forum thread 72711 (the grain fix).

### 4.2 The hero material writes the emissive attachment (the selection, made structural)

On the WebGPU branch, the molten/letterform `MeshStandardNodeMaterial` already computes `temp` and the final
metal radiance (`phase2/50 §4.5`). The emissive buffer is just that radiance routed to `emissiveNode`:

```js
// ObsidianSlabGPU / WordmarkGPU — emissive node = the radiance bloom reads (SAME math as GLSL, phase2/50)
const temp  = uTemp.add(gwFbm3(warpField).mul(0.18)).clamp(0, 1)
const metal = mix(gwForge(temp), gwDivineFire(flick), uIsAE)   // §1.4 keystone branch, renderer-agnostic
mat.colorNode    = gwIridescence(iridDrive, temp.oneMinus(), uIrid).add(metal)  // visible color
mat.emissiveNode = metal                                       // → emissive MRT → bloom (selective, exact)
```

The basalt, the reflective slab body, and the lit stone set **`emissiveNode = vec3(0)`** (or simply leave it
default-zero) — so their reflections, however bright, write nothing to `emissive` and **cannot bloom**. That is
the whole decoupling: bloom selection is now a *material authoring decision*, not a luminance accident.

### 4.3 The scene pass + MRT (one render, three attachments, shared with `phase2/41`)

```js
import { pass, mrt, output, emissive } from 'three/tsl'

const scenePass = pass(scene, camera)
scenePass.setMRT(mrt({
  output,                          // HDR color (attachment 0)
  emissive,                        // gw_forge·divineFire radiance (attachment for bloom)  ← THIS DOC
  heat: heatNode,                  // T / E / AE field (attachment for haze/god-rays)      ← phase2/41
}))
const outputTex   = scenePass.getTextureNode('output')
const emissiveTex = scenePass.getTextureNode('emissive')
const heatTex     = scenePass.getTextureNode('heat')   // phase2/41 consumers bind this from U
```

> **Edge cases (each a §2.4 / `phase2/41 §7` pitfall):** all attachments **must** be `HalfFloatType` — iOS has
> no FP32 color render target. **Do not** declare `depth` in `mrt()` — it is auto-available (`PassNode` docs;
> three.js #30844). Verify the additive-spark-through-glossy-slab case against the #32570 regression on the
> device before trusting the buffer with transparent content.

### 4.4 The bloom node with the grain fix + threshold hybrid

```js
import { bloom, gaussianBlur } from 'three/tsl'

// §2.1(d) hybrid: MRT decides WHAT can bloom (only emissive writers); threshold decides HOW hot it must be.
const bloomPass = bloom(
  emissiveTex,
  uBloomStrength,        // 0.6 (low) → 0.9 (high), RIDDEN by forgeHeat (phase2/38) — same bus as WebGL
  0.85,                  // radius: wide soft halo (sacred), high end of [0,1] also smooths low-mip grain
  0.0                    // threshold: 0 here because emissive IS already palette-selected (>1 = hot)
)
// §2.3 FIX: gaussianBlur the bloom BEFORE adding it back — kills the low-strength horizontal-motion grain.
const bloomClean = gaussianBlur(bloomPass)
```

`uBloomStrength` is a `uniform()` node written by the **same** `<ForgeDriver>` that rides the pmndrs
`bloom.intensity` (`phase2/38` `forgeHeat` bus) — so on either renderer, a strike surges the glow on one
heartbeat. One bus, two backends.

### 4.5 The full TSL post-chain (parity twin of `Effects.jsx`)

```js
import {
  chromaticAberration, vignette, film, agxToneMapping, acesFilmicToneMapping,
} from 'three/tsl'
import { uniform, vec2, vec3 } from 'three/tsl'
import { PAL } from '../../palette.js'   // ONE palette, both stacks (00 §3.1)

// 1. composite scene + selective, de-grained bloom
let c = outputTex.add(bloomClean)

// 2. chromatic aberration — high tier only; tiny, refraction-edge (matches Effects.jsx offset [0.0008,0.0012])
if (high) c = chromaticAberration(c, /*strength*/ 0.0012, /*center*/ vec2(0.5), /*scale*/ 1.05)

// 3. warm grade — the SAME constants as Effects.jsx, re-hosted as nodes (verified §4.6)
c = saturationNode(c, 0.12)                       // HueSaturation saturation = +0.12
c = c.mul(1.0 + 0.16).add(-0.04)                  // BrightnessContrast: contrast 0.16, brightness -0.04
                                                  //   (CDL form — exact node math pinned by the harness)
// 4. neutral vignette (offset 0.22, darkness 0.96) — NO cool tint (brand law, 00 §3.3)
c = vignette(c, /*offset*/ 0.22, /*darkness*/ 0.96)

// 5. grain-as-OLED-dither — SOFT_LIGHT blend, opacity 0.035–0.05; NEVER below ~0.03 (00 §3.3)
//    doubles as the residual-bloom-crawl mask (§2.3). Animated uv so it dithers, not statics.
c = filmSoftLight(c, high ? 0.05 : 0.035, animatedUv)

// 6. tone-map LAST, once (00 §3.2). AgX is the hero/low operator; ACES the fallback. Look-dev A/B on device.
c = useAgX ? agxToneMapping(c, uExposure) : acesFilmicToneMapping(c, uExposure)

renderPipeline.outputNode = c                     // terminal — one finish, one composite
```

> Two node-math notes the harness pins exactly: (a) the `BrightnessContrast` CDL form must match pmndrs'
> `BrightnessContrastEffect` math (contrast pivots around 0.5, not 0), so it is `(c-0.5)*(1+contrast)+0.5+
> brightness` — author it as a small `Fn()`, don't eyeball `.mul/.add`. (b) `film()`'s default blend is
> *additive*; pmndrs `Noise` uses `SOFT_LIGHT` — wrap `film` in a soft-light blend `Fn()` so grain reads
> identically (a hard-additive grain lifts the void, breaking the OLED black point).

### 4.6 The r3f component shape (today vs gated) + the parity gate

```jsx
// Effects.jsx — TODAY (WebGL2, SHIPPED, unchanged): the pmndrs merged EffectPass (phase1/20 §4.3)
//   <EffectComposer> <Bloom .../> <ChromaticAberration/> <HueSaturation/> <BrightnessContrast/>
//                    <Vignette/> <Noise/> <SMAA/> </EffectComposer>

// EffectsGPU.jsx — GATED (WebGPU, post-judge): builds the renderPipeline.outputNode graph above.
function EffectsGPU({ quality }) {
  const { gl, scene, camera } = useThree()           // gl is WebGPURenderer on this branch
  const pipeline = useMemo(() => buildForgePost(scene, camera, quality), [quality])
  useEffect(() => () => pipeline.dispose(), [pipeline])   // dispose-on-unmount law (00 §4)
  useFrame(() => { pipeline.renderAsync() }, 1)
  return null
}
```

The **parity gate** (the deliverable's spine, `phase2/50 §4.4` applied to post): render a fixed test frame
(the slab + a divine-fire A + a white-hot pour band + an additive spark + a glossy reflection of the A) through
**both** finishes — pmndrs `EffectPass` and the TSL `outputNode` — `readRenderTargetPixels` each, diff. Three
asserts:

1. **Grade identity:** max channel delta ≤ 2/255, mean ≤ 0.5/255, *through the tone-mapper* — proves the
   warm/crushed-black/CA/vignette/grain re-host is byte-near-identical.
2. **Selection improvement (the *intended* difference):** the reflection-of-the-A pixels bloom in the pmndrs
   frame but **not** in the TSL frame — the emissive MRT working. This delta is *expected and correct*; the
   harness asserts it is *localized to reflections*, not a global grade shift.
3. **Grain stability:** sample the divine-fire halo across N animated frames with horizontal camera motion;
   assert temporal variance below threshold — proves `gaussianBlur(bloom)` killed the §2.3 crawl.

Only when all three pass on a real iPhone 15 OLED (the divine-fire white-gold, the true-black void, no bloom
crawl — none simulate headless, `00 §8`) does the `gw_webgpu` gate flip.

### 4.7 Key uniforms / params (identical names + meanings on BOTH stacks)

| Param | Source (`forge` store via `<ForgeDriver>`) | WebGL form | TSL form | Drives |
|---|---|---|---|---|
| `uBloomStrength` | `forgeHeat` ride (`phase2/38`) | `bloom.intensity` ref | `uniform()` | bloom glow energy |
| bloom `radius` | constant `0.85` | `<Bloom radius>` | `bloom(…, radius, …)` | halo width + grain smoothing |
| bloom `threshold` | constant | `luminanceThreshold 0.55` | `bloom(…, threshold 0.0)` | hot-band gate (MRT pre-selects) |
| CA `offset`/`strength` | constant, high-only | `[0.0008,0.0012]` | `chromaticAberration(…,0.0012,…)` | refraction fringe |
| grade `sat/bri/con` | constants | `+0.12 / -0.04 / 0.16` | color-op nodes | warm crushed-black grade |
| `film` opacity | `0.035–0.05`, ≥0.03 floor | `Noise.opacity` | `film(…, intensity, …)` | OLED dither + bloom-crawl mask |
| `uExposure` | `forgeHeat` sub-pump (`phase2/38`) | renderer flag | `toneMap(…, exposure)` | gentle heat-rode exposure |

The table's contract: **a port changes syntax, not the finish.** Names, meanings, and the `forgeHeat` bus are
renderer-agnostic (`00 §6`, `phase2/38`).

---

## 5. COHESION — shared palette / lighting / uniforms

- **One bloom contract (`00 §7` rule 7).** WebGL: palette selects (>1 blooms). WebGPU: MRT selects (emissive
  writers bloom) *and* the small threshold keeps the palette's hot-band gate. Either way, **only the 10% accent
  band glows** — the cooling letters less than the divine A/E, the basalt and void never. The emissive buffer
  is the *exact* mechanization of "the palette is the bloom selector" the WebGL path achieves by convention.
- **The emissive attachment IS the light field (`00 §5.1`).** The metal is the only light; the emissive buffer
  is that radiance, sampled. Bloom reads it; `phase2/41`'s god-ray source-finder reads its `E` sibling. One
  MRT pass feeds the whole "metal-is-the-light" model — bloom, god-rays, haze — from one render, no guessing.
- **The keystone survives the swap (`00 §1.4`).** `uIsAE` routes the A/E to `gwDivineFire` → `emissiveNode` →
  the emissive buffer → the highest bloom, identically on both stacks. The same two letters ignite in the DOM,
  bloom in the GLSL metal, and bloom in the WGSL metal — one rule, three renderers — and now their halo is
  *reflection-free*, emanating from the letterform only.
- **One palette, one grade (`00 §3`).** `PAL` inlines via `v3()` (GLSL) and `vec3(...PAL.x)` (TSL) — the same
  hex. The grade constants (`+0.12 / -0.04 / 0.16`, vignette `0.22/0.96`, grain `0.035–0.05`) are the same
  numbers, harness-verified. **No cool/green/blue ever enters the grade** on either renderer — the basalt green
  lives in the material (`mat.colorNode`), never the post.
- **One bus, dt-damped (`00 §7` rule 6, `phase2/38`).** `uBloomStrength`/`uExposure` are written by the **one**
  `<ForgeDriver>` off `forgeHeat`. A strike surges emissive *and* bloom *and* exposure on one frame, GLSL or
  WGSL. No second clock, no per-effect rAF.
- **Degrades uniformly (`00 §7` rule 9).** Dropping MRT-emissive → threshold bloom (the WebGL fallback) thins
  the *selection precision* uniformly; it never recolors. `static` mounts no post at all (both renderers) — the
  raw tone-mapped metal on true-black void, dignified.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The judge is fill-rate-bound (`00 §10`): pixels, not triangles. The post chain budget is ~2.5–3 ms (`00 §10`
table). This work's cost story:

- **Zero per-frame cost on the judged build.** The TSL post nodes are tree-shaken dead code on WebGL2 (no
  `three/webgpu` import). The shipped `Effects.jsx` is unchanged. **Verify tree-shaking on every build** —
  `three/webgpu` must not appear in the production bundle (`phase2/50 §7`).
- **The emissive attachment shares the temperature MRT's bandwidth (`phase2/41 §6`).** It is *not* a new full-
  screen target — it is one more channel of the same `high`-gated MRT pass (`{ output, heat, emissive }`). On
  the WebGL2-fallback branch each attachment resolves to main memory (no tile-memory discount), so the
  emissive attachment is budgeted as a *real* extra HalfFloat write — gated to `high`, dropped the instant
  `PerformanceMonitor.factor` dips (the adaptivity ladder). On **native** iOS-26 WebGPU the attachments stay in
  tile memory across the merged node post stack (the ARM-style deferred discount) — the single strongest reason
  to port (`phase2/41 §6`).
- **`gaussianBlur(bloom)` adds one small blur pass.** Budget it like a half-res blur (the bloom is already
  mip-downsampled, so the extra gaussian is on a small target). Worth it: without it the divine-fire crawls
  (§2.3). On `low`/fallback, drop the gaussian and instead lean entirely on raising `radius` + the `film`
  grain — cheaper, slightly softer.
- **HalfFloat mandatory (`phase2/41 §6`, the #1 iOS killer).** Every MRT attachment `HalfFloatType`, never
  `FloatType` — iOS exposes no FP32 color render. `T ∈ [0,1]` and HDR emissive both fit half precision.
- **DPR cap is still the #1 lever (`00 §10`).** The post chain renders at the DPR-1.5 cap; the bloom pyramid
  and the emissive attachment scale with it. Native DPR-3 post is instant death — same as the void shader.
- **Static / fallback tier.** `static` mounts **no** post (both renderers) — raw tone-mapped metal, the
  dignified frozen poster. `low`/WebGL-fallback: threshold bloom on the emissive buffer if MRT is affordable,
  else fall back to luminance-threshold bloom on color (the shipped behavior) — the world still reads, the
  reflection-decoupling is simply the high-tier reward.
- **The fallback-quality trap (`00 §10`, `phase1/30 §6`).** If WebGPU is enabled and iOS Safari silently falls
  back to the `WebGPURenderer` WebGL2 backend, the post runs through the *less-tested* path. The §4.6 parity
  harness's "pmndrs vs TSL-on-fallback" comparison is exactly the de-risk — run it on a real iPhone 15 before
  flipping the gate; if the fallback diverges, keep pmndrs on that device.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls, ranked by cost:**

1. **`FloatType` on any MRT attachment.** Renders on desktop, **black/incomplete framebuffer on iOS** — no
   FP32 color render. Always `HalfFloatType`; verify `checkFramebufferStatus` on the device, not Chrome.
2. **Forgetting `gaussianBlur(bloom)` at the restrained strength we use.** Our `0.6–0.9` intensity is the exact
   low-strength regime where `bloomNode` grains (thread 72711) — the divine-fire crawls on horizontal motion.
   Wire the gaussian from line one, not as a later "polish."
3. **Cranking bloom strength to force a dim object to glow.** Blooms the whole frame *and* amplifies the
   near-threshold grain. Same law as WebGL: **fix `emissiveNode` (push >1), never the bloom strength**
   (`phase1/20 §7.1`).
4. **`film()` default additive blend lifting the black point.** pmndrs `Noise` is `SOFT_LIGHT`; a naive
   additive `film` greys the void and breaks the OLED true-black (`00 §3.3`). Wrap `film` in a soft-light `Fn()`
   and verify the void is pixels-off on the panel.
5. **Eyeballing the `BrightnessContrast`/`HueSaturation` node math.** Contrast pivots around 0.5; a wrong pivot
   shifts the whole grade and fails parity. Author the CDL/sat as small `Fn()`s matching pmndrs' exact math,
   and let the §4.6 harness catch drift — don't guess `.mul/.add`.
6. **A cool-tinted vignette (copying *False Earth*'s blue visor).** Brand law: **no cool/green/blue in the
   grade** (`00 §3.3`). The vignette is neutral-dark only.
7. **Declaring `depth` in `mrt()`, or wrong `setMRT`/`getTextureNode` ordering.** `depth` is auto-available;
   `setMRT` must precede `getTextureNode`/precompile (`PassNode` docs; #30844).
8. **Trusting the emissive buffer with additive/transparent content un-verified (#32570).** The r181→r182
   regression broke exactly the bulb-behind-glass case = our spark-through-glossy-slab. Pin a known-good
   version and add the additive case to the harness before the gate flips.
9. **Shipping `three/webgpu` to the judge by accident.** A stray import pulls the WebGPU stack into the
   production bundle. Verify tree-shaking every build; the judge path imports zero TSL/WebGPU post.
10. **Double tone-mapping.** Tone-map once, terminal, in the `outputNode` (or on the renderer — never both),
    same as the WebGL rule (`phase1/20 §7.3`).

**Order of operations (de-risking sequence, each verified the repo way — `npm run build` green → `qa-route`
393×852 + 1440×900, 0 console errors → iPhone 15 OLED read):**

1. **Ship and freeze the WebGL threshold chain** (`Effects.jsx`, `phase1/20`). This is the judged finish and
   the parity *reference*. Do not touch it.
2. **Stand up the `RenderPipeline` post graph on desktop WebGPU** with threshold bloom on the *color* texture
   first (no MRT yet) — get the chain wired and the grade re-hosted. Run the §4.6 grade-identity diff until
   ≤ 2/255 against pmndrs. *This is where node-math transcription bugs surface.*
3. **Add the MRT-emissive attachment** (`setMRT(mrt({ output, emissive }))`), route hero `emissiveNode`, switch
   bloom to read `emissiveTex`. Confirm the reflection-of-the-A *stops* blooming (the intended §4.6 delta #2).
4. **Add `gaussianBlur(bloom)`** and the animated `film` dither; run the §4.6 grain-stability test with
   horizontal camera motion — assert the divine-fire halo no longer crawls.
5. **Merge with `phase2/41`'s `heat` attachment** so one MRT pass feeds bloom (emissive) + haze/god-rays (heat).
   Re-verify cost on the device against the `00 §10` budget; gate the whole MRT to `high`.
6. **Verify the #32570 additive case and the WebGL2-fallback parity** on a real iPhone 15. Only then flip the
   `gw_webgpu` gate. Until it passes on-device, the judge keeps pmndrs.

---

## 8. SOURCES (2025–2026)

1. **three.js forum — _"How to remove WebGpu bloomNode grain?"_** (thread 72711, Mugen87 reply), **2025**. The
   named low-strength `bloomNode` granulation artifact (worst on horizontal motion) and the canonical fix —
   `outputNode = outputPass.add( gaussianBlur( bloomPass ) )`.
   https://discourse.threejs.org/t/how-to-remove-webgpu-bloomnode-grain/72711
2. **Three.js Roadmap — _The Complete Guide to Three.js Post-Processing in 2026_**, **2026**. r183
   `RenderPipeline` (the renamed `PostProcessing`, WebGPU-first + WebGL2 fallback), `setMRT(mrt({…}))` writing
   named attachments in one pass, emissive-property selective bloom, EffectComposer as legacy/no-path-forward.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
3. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text… with Three.js & TSL_** (2026-01-28). Per-material
   `material.mrtNode = mrt({ bloomIntensity })` driving selective bloom on dissolving MSDF text — the per-
   material emissive/bloom-budget pattern.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
4. **Codrops — _False Earth: From WebGL Limits to a WebGPU-Driven World_** (Ming Jyun Hung, 2026-04-21). The
   full TSL node post chain wired to `outputNode`: chromatic aberration (offset-UV RGB), vignette, bloom for
   emissive glow, tone-map last — the parity-target chain shape.
   https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
5. **Codrops — _80s Business Tech… Shader.se's Scroll-Driven WebGPU Pipeline_** (Filip Kantedal, 2026-05-19).
   The compose-pass trio (film grain, chromatic aberration, bloom) as TSL nodes; R3F + WebGPU with WebGL2
   fallback and per-section pass skipping for perf.
   https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
6. **Maxime Heckel — _Field Guide to TSL and WebGPU_** (2025-10-14). `mrt()`/`setMRT`/`getTextureNode`,
   selective bloom via MRT, the hand-transpile pattern for look-preserving ports, iOS WebGPU support landing.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. **mrdoob/three.js — Issue #32570, _WebGPU Selective Bloom with transparent object_** (2025-12-16). The
   r181→r182 regression where emissive-MRT selective bloom broke for an emissive object behind an
   `AdditiveBlending` transparent surface — the pin-and-verify edge case for our spark-through-glossy-slab.
   https://github.com/mrdoob/three.js/issues/32570
8. **three.js examples — _webgpu_postprocessing_bloom_emissive_ / _bloom_selective_** (r17x/r18x, 2025–2026).
   Reference implementations: emissive-material selective bloom, and MRT deciding whether an object blooms.
   https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html ·
   https://threejs.org/examples/webgpu_postprocessing_bloom_selective.html
9. **three.js docs — _ChromaticAberrationNode_ / _FilmNode_ / _BloomNode_ / _TSL_** (r18x, 2025–2026).
   Signatures: `chromaticAberration(node, strength=1, center=null, scale=1.1)`, `film(input, intensity, uv)`,
   `bloom(node, strength, radius∈[0,1], threshold)`, `vignette`, `agxToneMapping`/`acesFilmicToneMapping`.
   https://threejs.org/docs/pages/ChromaticAberrationNode.html · https://threejs.org/docs/pages/FilmNode.html ·
   https://threejs.org/docs/pages/BloomNode.html · https://threejs.org/docs/pages/TSL.html
10. **Good TSL — _agxToneMapping_ / TSL color-operation reference** (2025–2026). AgX vs ACES TSL tone-map nodes
    (hue-preserving photographic path-to-white) and the color-op node catalogue for the grade re-host.
    https://www.goodtsl.com/en/docs/ColorOperations~ToneMapping~agxToneMapping
11. **utsubo — _Migrate Three.js to WebGPU (2026) — The Complete Checklist_** & _100 Three.js Tips (2026)_,
    **2026**. `three/webgpu` zero-config + automatic WebGL2 fallback, `forceWebGL`, post-migration surface, the
    fallback-quality caveat. https://www.utsubo.com/blog/webgpu-threejs-migration-guide ·
    https://www.utsubo.com/blog/threejs-best-practices-100-tips

_Pre-2025 canonical references covered only through the above: the UE4 mip-pyramid bloom (Fabrice Piquet,
behind `mipmapBlur`/`BloomNode`); the iOS FP32-render-target limitation (WebKit 216010 / WebGL #3093, surfaced
in 2025 Safari perf discussion); ACES/AgX operator math (re-summarized in the 2025-2026 TSL tone-map nodes)._

---

## 9. DEEP-DIVE CANDIDATES

1. **The unified forge MRT layout spec (`{ output, heat, emissive }` in one pass).** The exact attachment
   budget merging this doc's emissive buffer with `phase2/41`'s `T`/`E`/`AE` field: channel packing, HalfFloat
   precision per channel, the tile-memory residency test on iOS-26 WebGPU vs the WebGL2-fallback resolve cost,
   and the `high`-gate threshold — the bandwidth ledger that decides how many attachments the iPhone affords.

2. **The grade-parity `Fn()` library + tolerance budget.** The hand-authored TSL twins of pmndrs'
   `BrightnessContrastEffect` (0.5-pivot CDL), `HueSaturationEffect`, `VignetteEffect`, and `NoiseEffect`
   (SOFT_LIGHT blend), each diffed against the pmndrs fragment output through the tone-mapper — the per-node
   max-2/255 / mean-0.5/255 harness that *proves* the finish survives the swap, and where it runs (desktop CI
   vs the manual iPhone read).

3. **The `gaussianBlur(bloom)` vs `radius`-only vs `film`-mask grain-fix A/B.** Quantify the three §2.3 levers
   on the divine-fire halo under horizontal camera motion on iPhone 15: temporal variance, the perf cost of the
   extra gaussian pass, and the minimum `radius`/`film` opacity that hides the crawl without the blur — so the
   `low`/fallback tier can drop the gaussian safely.

4. **The reflection-decoupling visual A/B on the polished slab.** Render the divine-fire A reflected in the
   `roughness 0.05` slab with threshold bloom (reflections bloom) vs emissive-MRT bloom (reflections don't),
   measured on the OLED — the data that justifies the whole port for the keystone beat, and the rule for which
   materials write `emissiveNode = 0` to stay out of the bloom.
