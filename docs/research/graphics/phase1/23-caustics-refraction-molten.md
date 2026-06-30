# 23 — Caustics & Refraction Through Molten Light

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer (r3f / three.js), warm-forge palette, no runtime EXR._

---

## 1. SCOPE

A caustic is the **focused signature of light that has been bent** — refracted or reflected by a curved
or moving surface — and re-concentrated on whatever it lands on. In the GAELWORX world, light has exactly
one source: **the metal itself.** There is no sun, no sky, no ambient fill — pure void darkness lit only
by the molten pour, the cooling letterforms, and the eternal divine-fire **A** and **E**. So the caustic
in this world is **not** the cool dappled pool-floor caustic everyone knows; it is the **under-surface ember
caustic** — the warm, restless, focused light that the churning, viscous skin of the molten metal throws
onto the **green-black Irish-basalt channel walls and floor** as it flows through the Celtic-interlace
channels.

Three distinct caustic/refraction roles must be served, all from one master system:

1. **The ember caustic on stone.** As the living molten surface bubbles and churns (`01-molten-metal-surface`),
   its bright, uneven skin acts like a warped lens/mirror. The basalt walls beside and beneath the channels
   should crawl with **focused ripples of orange-to-white light** — the tell-tale "there is moving liquid
   fire just out of frame" cue. This is what makes the carved **Ogham** readable and the interlace channels
   feel **lit from within the metal**, not painted.
2. **The divine-fire A/E radiance caustic.** The white-gold A and E never cool; they are the brightest
   emitters in the frame and must **radiate a stable, sacred pool of caustic light** onto adjacent stone —
   tighter, whiter, calmer than the churning pour caustic. This is the "altar light" that sanctifies the
   Ogham.
3. **Refraction through the obsidian / fire-opal glass.** Where we look *through* the volcanic glass (the
   slab body, the jewel facets, the jewel-chamber matrix), the fire behind/within should **bend** — the
   chromatic, IOR-driven displacement of the ember veins seen through the glass skin.

The caustic is the **connective light** of the whole world: it is the proof that the metal is a real light
source and the stone a real receiver. Get it right and every chamber reads as one lit volume; get it wrong
and the molten metal looks like a glowing decal stuck on dead rock.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Caustics in real-time WebGL/WebGPU split into **physically-derived** (compute the actual refracted light
transport) and **faked/procedural** (paint a convincing caustic field directly). Every family below is
alive and shipping in 2025–2026. Gauged against the three hard constraints: **iPhone-15 mobile budget**,
**one shared WebGL renderer**, **no runtime EXR**.

### A. Differential-area / refracted-ray caustics (Evan-Wallace lineage, the drei `<Caustics>` path)
The canonical real-time caustic: refract a grid of light rays through the lit surface's normals, and shade
each receiver texel by `originalArea / projectedArea` (computed with `dFdx/dFdy` on the projected positions)
— where rays converge, area shrinks, brightness spikes. pmndrs packages this as drei's **`<Caustics>`**
helper, still the reference WebGL component in 2025: it renders the refracted pattern of a *target mesh*
into a buffer from a `lightSource`, then **projects that buffer onto a ground plane** that is auto-scaled/
positioned around the mesh so the pattern isn't clipped. Props: `causticsOnly`, `backside` + `backsideIOR`
(default 1.1, accumulate front+back faces), `ior`, `worldRadius`, `intensity` (default 0.05),
`resolution` (default 2048), `lightSource`, `frames`.
- **Quality:** High and *physically motivated* — caustics track the actual surface curvature.
- **Perf:** Moderate→heavy. A 2048² caustic buffer + an extra render of the target each updated frame. The
  `frames` prop lets you bake static and stop, which is the only way it survives mobile.
- **Mobile:** Marginal for a *static* baked plane; **too heavy** for a continuously-resimulated churning
  molten surface every frame.
- **Complexity:** Low to drop in, medium to tune to a non-water look (it's tuned for glass/water).
- **GAELWORX fit:** Wrong substance (it models a *transmissive* object lit from outside; our metal is an
  *opaque emitter* lit from inside) and wrong cost model for an animated surface. **Reference, not ship** —
  but its *backside accumulator* idea and *plane-projection* framing inform the fake.

### B. WebGPU/TSL refraction-projected caustics via `castShadowNode` (three.js r180+ example)
The 2025-native path. The official `webgpu_caustics` example (three.js, present on `dev`/`master`, r180
era — r180 shipped 2025-09-03) computes a refraction vector with the TSL `refract()` node from
`positionViewDirection` + `normalView` at the material's IOR, samples a caustic texture along that vector
(with a tiny per-channel offset for chromatic aberration), modulates by `viewZ`, and crucially returns the
result as the object's **`castShadowNode`** — so the caustic is *projected through the shadow pipeline* onto
receivers, for free, no separate caustic pass. A sibling `webgpu_volume_caustics` example raymarches volume
caustics onto a catcher plane.
- **Quality:** Excellent, and the shadow-projection trick is elegant + cheap-per-receiver.
- **Perf:** Great on WebGPU; needs the node renderer.
- **Mobile:** WebGPU on iOS Safari is *production-ish* (three.js has called WebGPU production-ready since
  r171, Sept 2025; `import * as THREE from 'three/webgpu'`), but iOS support is uneven and this repo is
  WebGL `MeshPhysicalMaterial` + pmndrs `postprocessing`. A renderer migration is a Phase-2/3 decision (see
  the 2026 utsubo migration checklist), **not** a ship-now move.
- **GAELWORX fit:** The *direction* of travel and a superb pattern reference — but `castShadowNode` and TSL
  are WebGPU-only; **future**, not now.

### C. Procedural / "fake" caustic field — the abs-fbm domain-warp (THE ship path)
Don't simulate light transport; **paint** the caustic directly with noise. The standard recipe (Quilez
domain-warping + turbulence: `abs(noise)` carves the sharp bright "filaments" caustics are made of) is a
warped fbm whose ridges are raised to a high power to make thin, focused, branching light veins that drift
over time. **This is already in the codebase**: `gw_caustic(uv, t)` in `src/scene/shaders.js` is exactly
this — a domain-warped two-octave fbm with `pow(1 - abs(fbm), 4.5)` ridges plus a finer `pow(...,6.0)*0.4`
detail layer. 2025 write-ups (the Codrops GSAP-shader piece, 2025-10-08) reaffirm this animated-uniform,
noise-driven approach as the modern, cheap way to get living refractive light without buffers.
- **Quality:** Very good *for an emissive ember caustic* (where physical accuracy is unverifiable by eye —
  nobody knows the "correct" pattern of light off churning lava). Less convincing for clean glass/water.
- **Perf:** Excellent. A few fbm evals per pixel, **zero extra passes, zero buffers.**
- **Mobile:** Excellent — the only family that fits the iPhone-15 budget as a scene-wide, *animated* effect.
- **Complexity:** Low. Already half-built.
- **GAELWORX fit:** **Perfect.** The substance is right (warm focused light, not water), it shares the
  exact noise basis as the veins/embers/heat-haze, and it costs almost nothing.

### D. Screen-space refraction through the glass (fake-FBO / `MeshTransmissionMaterial` / TSL viewport node)
For role 3 (looking *through* obsidian/jewel), bend the framebuffer behind the glass. Three sub-paths,
all documented 2025:
- **drei `MeshTransmissionMaterial`** (`distortion`, `distortionScale`, `temporalDistortion`, chromatic
  aberration) — the Codrops "Warping 3D Text Inside a Glass Torus" (2025-03-13) shows it bending text
  behind glass. Gorgeous, **but each transmissive surface triggers an extra full-scene render**; 2025
  three.js-forum threads repeatedly flag it as a mobile/Apple-silicon killer. Already gated to `high` tier
  for the slab (`ObsidianSlab.jsx:69`).
- **Fake screen-space refraction** — sample the input/scene buffer at a UV offset by the surface normal ×
  IOR (the multiside-refraction lineage), the same screen-UV warp family as the heat-haze (doc 16). Cheap,
  no extra scene pass when done in post.
- **TSL `viewportSharedTexture` + depth-aware screen-UV** — Maxime Heckel's **Field Guide to TSL and
  WebGPU** (Oct 2025) documents the viewport-texture node and the depth-comparison trick that fixes the
  classic "sampling pixels in front of the surface" refraction artifact. WebGPU-native; WebGL fallback
  equals the fake path.
- **GAELWORX fit:** The cheap fake screen-space refraction for the *interior* of the glass (already partly
  faked by the Fresnel/opal injection), `MeshTransmissionMaterial` only as a `high`-only luxury on a single
  hero jewel. The TSL viewport node is the future.

**Verdict on the landscape:** the **ember caustic on stone (roles 1+2) ships as family C** — the procedural
`gw_caustic` field projected onto basalt as additive emissive, masked and tinted by the master temperature
system. **Refraction through glass (role 3)** stays the cheap fake screen-space/Fresnel path, with
`MeshTransmissionMaterial` reserved `high`-only. Families A/B/D-WebGPU are the physical references and the
Phase-2/3 upgrade lane.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship one shared caustic primitive — a `ForgeCaustics` receiver material built by `onBeforeCompile` on
the basalt's `MeshStandardMaterial`/`MeshPhysicalMaterial`, additively injecting the existing `gw_caustic`
field as emissive light, driven by the master temperature uniforms, distance-attenuated from the molten
emitters, and tinted along the blackbody ramp.** Two presets of the same shader serve roles 1 and 2: a
**churning pour caustic** (fast, broad, orange→white) and a **divine-fire A/E caustic** (slow, tight,
white-gold, calmer). Refraction through glass (role 3) stays the cheap injected Fresnel/opal +
`high`-only transmission already in `ObsidianSlab`/`FacetedJewel`.

Justification, point by point against the world + constraints:

- **It is the only caustic family that fits an iPhone-15 as an *animated* effect.** Family A (drei
  `<Caustics>`) needs a 2048² buffer + per-frame re-render of an animated target — out of budget. Family C
  is a handful of fbm evals, no buffer, no extra pass. The budget reality is the same one that already gates
  transmission to `high` (`ObsidianSlab.jsx:69`) and keeps `disableNormalPass` on (`Effects.jsx:21`).
- **The substance is correct.** drei `<Caustics>` and the WebGPU example both model a *transmissive object
  lit from outside* (water/glass). Our metal is an **opaque emitter lit from inside** — there is no external
  light to refract. A *painted* warm caustic is not just cheaper, it's the **more physically honest model**
  for "light thrown by a self-luminous churning surface," and its correctness is unverifiable by eye, so the
  fake reads as real.
- **It reuses what's already here.** `gw_caustic(uv, t)` exists in `shaders.js` and is *already documented in
  that file's header as "a warm caustic field … reused by the obsidian slab."* This doc finally *uses* it for
  its named purpose. Same `gw_fbm` basis as the veins (`ObsidianSlab` HEAD), embers, and the heat-haze (doc
  16) — so the caustic's ripple is literally the same noise grain as the metal's flow.
- **It hooks the master temperature system.** A single `uHeat`/`uVeinGlow`-style uniform damped off
  `forge.scrollDamped` + `scrollVel` + the `forge.strikeAt` surge (the exact signals `ObsidianSlab` reads,
  `:149–168`) scales caustic brightness globally — the stone glows brighter where/when the forge runs hotter.
- **The blackbody ramp ties it to the cooling gradient.** The caustic color is sampled from the same
  `crimson→ember→hot` ramp the veins use (`COLOR` block, `ObsidianSlab.jsx:58–59`), so a caustic cast by a
  white-hot region is white-gold and one cast by cooling iron is deep red — the caustic *inherits the
  temperature of whatever cast it*.
- **It respects bloom & brutalism.** Caustic cores use HDR (`>1`) values so only the brightest filaments
  bloom (the "only HDR blooms" rule, `Effects.jsx` `luminanceThreshold={0.55}`). Pure shader injection: no
  DOM, no rounding, no cool casts — inside the warm-forge + 0px-brutalism constraints.

It is buildable in this codebase as one new injected material (or an `onBeforeCompile` block on the basalt
stone material from doc 05) plus a few damped uniforms wired to the existing store — **no renderer change,
no new dependency, no extra render pass.**

---

## 4. IMPLEMENTATION

### Libraries / versions
- `three` — existing version (WebGL `MeshPhysicalMaterial` + `onBeforeCompile`). No upgrade, no TSL.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` — already in the project.
- Reuse `GLSL_NOISE` (incl. `gw_caustic`) from `src/scene/shaders.js`, `PAL`/`v3` from
  `src/scene/palette.js`, and `forge`/`damp`/`range` from `src/store.js`.
- **No** drei `<Caustics>` import (family A — kept as reference only).

### The injection pattern (the GAELWORX `shader-fx` way)
This is the same three-hook `onBeforeCompile` pattern the slab uses (`shader-fx` skill): assign uniforms,
prepend a HEAD block of helpers, and add emissive **before** tone mapping. The receiver is the **basalt
stone** material (doc 05), so the caustic lands on stone, not on the metal.

```js
// src/scene/ForgeCaustics.js  — caustic light projected onto basalt
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

export const CAUSTIC_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;        // master temperature 0..1 (scroll/strike driven)
  uniform float uCausGlow;    // base intensity of the cast light
  uniform float uCausScale;   // pattern frequency (broad pour vs tight A/E)
  uniform float uCausSpeed;   // drift speed (fast pour vs calm divine fire)
  uniform vec2  uEmitter;     // UV of the nearest molten emitter (pour front / A or E)
  uniform float uReach;       // 1/falloff radius — how far the light throws
  uniform float uChroma;      // per-channel split amount (refractive shimmer)
  ${GLSL_NOISE}

  // blackbody-ish ramp shared with the veins: cool red -> ember -> white-hot.
  vec3 gwCausRamp(float t){
    vec3 c = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, clamp(t * 1.3, 0.0, 1.0));
    return mix(c, ${v3(PAL.hot)}, clamp(t - 0.45, 0.0, 1.0) * 1.8);
  }
`

// injected just before <tonemapping_fragment>; vUv is the stone's surface UV.
export const CAUSTIC_COLOR = /* glsl */ `
  // 1) distance attenuation from the molten emitter -> caustics only near the metal
  float gwDist  = distance(vUv, uEmitter);
  float gwReach = exp(-gwDist * uReach);            // 1 at the source, ->0 with distance

  // 2) the caustic field itself: the SAME gw_caustic used by the world's noise.
  //    two slightly offset samples = the focused, crawling double-filament look.
  float t = uTime * uCausSpeed;
  float cR = gw_caustic((vUv + vec2( uChroma, 0.0)) * uCausScale, t);
  float cG = gw_caustic( vUv                         * uCausScale, t);
  float cB = gw_caustic((vUv + vec2(-uChroma, 0.0)) * uCausScale, t + 0.3);

  // 3) temperature: hotter forge -> whiter, brighter caustic (master system)
  float temp = clamp(uHeat * (0.55 + 0.45 * cG), 0.0, 1.0);
  vec3  tint = gwCausRamp(temp);

  // 4) compose: per-channel for refractive chromatic shimmer, HDR cores bloom.
  vec3 caus = vec3(cR, cG, cB) * tint;
  caus *= gwReach * uCausGlow * (0.4 + 0.6 * uHeat);

  // additive: the stone is LIT, never tinted-flat. Cores >1 so only they bloom.
  gl_FragColor.rgb += caus;
`
```

Wired into the basalt material exactly like the slab (`ObsidianSlab.jsx:122–131`):

```js
m.defines = { USE_UV: '' }            // need vUv even if the stone has no map
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, uniforms)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${CAUSTIC_HEAD}`)
    .replace('#include <tonemapping_fragment>', `${CAUSTIC_COLOR}\n#include <tonemapping_fragment>`)
}
```

### The r3f wrapper + the master-temperature hook
Drive every uniform from the shared store in one `useFrame`, **dt-damped**, reading the *same* signals the
slab reads so caustic and veins move in lockstep. Two presets (pour vs divine-fire) are just different
default uniforms on the same material.

```jsx
const uniforms = useMemo(() => ({
  uTime:      { value: 0 },
  uHeat:      { value: 0 },
  uCausGlow:  { value: preset === 'divine' ? 1.1 : 0.85 },
  uCausScale: { value: preset === 'divine' ? 4.6 : 2.4 },   // tight vs broad
  uCausSpeed: { value: preset === 'divine' ? 0.25 : 1.0 },  // calm vs churning
  uEmitter:   { value: new THREE.Vector2(0.5, 0.5) },
  uReach:     { value: preset === 'divine' ? 4.5 : 2.6 },   // tight pool vs broad wash
  uChroma:    { value: 0.012 },
}), [preset])

useFrame((state, dt) => {
  uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  const vel   = Math.min(forge.scrollVel * 1.4, 1)
  const since = performance.now() / 1000 - forge.strikeAt
  const surge = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) * 0.85 : 0
  const sc    = sceneFor(forge.route)
  // SAME ramp the slab builds for uVeinGlow — caustic & veins flare together.
  const target = (preset === 'divine')
    ? 1.0                                   // divine fire is eternal: always lit
    : Math.min(sc.veinGlow + vel * 0.5 + surge, 1)
  uniforms.uHeat.value = damp(uniforms.uHeat.value, forge.ready ? target : 0, 3, dt)
})
```

### Key uniforms & parameters (leva-tunable via `?debug`)
| Uniform | Pour / Divine default | Meaning |
|---|---|---|
| `uCausGlow` | 0.85 / 1.1 | base brightness of the cast light. |
| `uCausScale` | 2.4 / 4.6 | pattern frequency — broad churning rivers vs tight altar dapple. |
| `uCausSpeed` | 1.0 / 0.25 | drift speed — restless pour vs calm, sacred divine fire. |
| `uReach` | 2.6 / 4.5 | inverse falloff radius — how far the caustic throws onto stone. |
| `uEmitter` | tracked | UV of the nearest molten source (pour front, or the A/E centroid). |
| `uChroma` | 0.012 | per-channel split = the refractive color shimmer in the light. |
| `uHeat` | damped runtime | master temperature; from `forge.scrollDamped`+`scrollVel`+strike surge. Divine = pinned 1.0. |
| `uTime` | accumulated | frozen to a constant when `forge.quality==='static'`. |

### Role 3 (refraction through glass) — no new code, reuse the existing path
The obsidian slab already fakes interior refraction via the Fresnel + opal injection
(`ObsidianSlab.jsx:56–66`) and optional `high`-only transmission (`:116–120`). The jewel does the same with
its facet-edge Fresnel fire-opal (`FacetedJewel.jsx:21–26`). **Keep that.** If a hero jewel needs *true*
background-bending refraction, add a single low-`samples` drei `MeshTransmissionMaterial` (`distortion` /
`temporalDistortion`) **`high`-tier only** — never scene-wide.

---

## 5. COHESION

The caustic must feel *thrown by* the metal onto the stone — one lit volume, not a glow decal.

- **One temperature, three manifestations.** `uHeat` reads the **exact same signals** the obsidian slab
  reads (`ObsidianSlab.jsx:149–168`): `forge.scrollDamped`, `forge.scrollVel`, and the `forge.strikeAt`
  surge with the identical `Math.exp(-since*3.0)` decay. When the user scrolls and the veins flare
  (`uVeinGlow`, `uTemp`) and the air shimmers harder (heat-haze `uHeat`, doc 16), the **stone caustics
  brighten in the same beat.** No new state, no second rAF (honors the one-rAF/shared-store law).
- **Shared noise basis.** `gw_caustic` is domain-warped `gw_fbm` — the *same field* driving the veins, the
  embers, and the heat-haze. The light crawling on the stone is the same grain as the metal flowing in the
  channel. This is the single biggest "nothing is bolted on" win.
- **Shared blackbody ramp.** `gwCausRamp` is the same `crimson→ember→hot` ladder the veins use
  (`ObsidianSlab.jsx:58–59`) and the same ramp the cooling-color doc (02) defines. A caustic *inherits the
  temperature of whatever cast it*: white-hot pour throws white-gold light, cooling iron throws deep red —
  the caustic visibly obeys the cooling gradient.
- **Divine-fire A/E ratified, not contradicted.** The A/E caustic preset is pinned `uHeat = 1.0` (eternal),
  tight (`uCausScale 4.6`), calm (`uCausSpeed 0.25`), white-gold — a *stable sacred pool* distinct from the
  restless pour wash. This is precisely the "radiate light onto adjacent stone, making carved Ogham
  readable" mandate, and it reinforces the A+E ignite rule (`CLAUDE.md`) in 3D light.
- **Shared bloom contract.** Caustic filament cores are HDR (`>1`, via `PAL.hot`), so only they bloom —
  same `luminanceThreshold` convention as everything else (`Effects.jsx`). Caustic, vein, ember, and divine
  fire all bloom by the same rule.
- **Shared chromatic language.** The `uChroma` per-channel split mirrors the `ChromaticAberration` used on
  `high` (`Effects.jsx:24`) and the heat-haze's micro-split — the light refracts color the way the glass
  edges do.
- **Embers tie-in.** `Embers.jsx` rises in `(1.0,0.45,0.12)` warm additive; ember trails passing over a
  caustic-lit wall feel part of the same atmosphere — same palette, same additive blending, same noise grain.
- **Palette/brutalism untouched.** Pure additive emissive injection; no geometry rounding, no cool cast —
  fully inside the warm-forge + Neo-Gaelic-Brutalist constraints.

---

## 6. MOBILE & PERFORMANCE

The iPhone-15 OLED is the judge. Budget discipline:

- **Zero extra passes, zero buffers.** Unlike family A (drei `<Caustics>` 2048² buffer + per-frame target
  re-render) and family D (`MeshTransmissionMaterial`'s extra full-scene pass), the procedural caustic is
  **just emissive math inside the basalt's existing fragment shader.** Marginal cost over the stone material
  it's already drawing.
- **fbm cost is the ceiling.** Each pixel does up to **3× `gw_caustic`** (chromatic split), and each
  `gw_caustic` is 2× `gw_fbm` (3 octaves). That's the budget item. Tier it:
  - `high`: 3-fetch chromatic caustic, full `uCausScale`.
  - `low`: **collapse to 1× `gw_caustic`** (sample once, skip the per-channel split — set `uChroma=0` and a
    `#define` 1-call path), lower `uCausScale`. Halves+ the fbm count.
  - `static` (`prefers-reduced-motion`): `uTime` frozen to a constant — the caustic is a still, lit pattern.
    Zero animation cost, and the `<Effects>` bloom tree is already not mounted (`ForgeCanvas.jsx:47`).
- **Only on surfaces that receive it.** Inject the caustic **only into the basalt walls/floor near a
  channel**, not every stone in the scene. Distant stone uses the plain basalt material. The `uReach`
  attenuation also makes far texels cost the same but contribute nothing — so prefer geometry-level scoping
  for true savings.
- **No depth pass.** `disableNormalPass` stays; the caustic is surface-UV based, needs no depth/normal
  buffer.
- **Avoid per-pixel branches.** Use the `uReach` `exp()` falloff and `#define`-selected tier paths rather
  than runtime `if`s (`shader-fx`: "avoid per-pixel branches where you can").
- **Dispose** the material on unmount (`useEffect(() => () => material.dispose(), [material])`).
- **Verify** the `qa-route` way: 0 console errors @ 393×852 + 1440×900 under SwiftShader proves the GLSL
  compiled; then read the real caustic crawl + bloom on the iPhone 15 (warm focused light + OLED true-black
  don't simulate headless). Live-tune via the `?debug` leva panel.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Pitfalls, and the order of operations that avoids them:

1. **Caustic lands on STONE, not metal.** Inject into the **basalt** material, never the molten/letter
   material. A caustic on the emitter itself is a category error — the light source doesn't get lit by its
   own caustic. Wire the receiver first.
2. **Additive, before tone-mapping.** `gl_FragColor.rgb += caus` injected at `#include <tonemapping_fragment>`
   (the slab's hook). Add it *after* tonemapping and the HDR cores won't bloom and the grade will be wrong.
3. **Attenuate from the emitter, or it's wallpaper.** Without `uReach` distance falloff the caustic tiles
   the whole wall uniformly and reads as a texture, not cast light. The brightness **must** decay with
   distance from `uEmitter` so it clearly emanates from the metal. Track `uEmitter` to the pour front / A/E
   centroid (project their world position to the receiver's UV, or pass a precomputed UV per chamber).
4. **`abs`-fbm ridges = focused filaments.** The caustic look lives in `pow(1 - abs(fbm), 4.5)` — the high
   power is what makes thin bright veins instead of soft blobs. `gw_caustic` already does this; don't lower
   the exponent or it turns to mush. (Quilez turbulence/domain-warp lineage.)
5. **Divine fire is calm AND eternal.** The A/E preset must read *differently* from the pour: slower
   (`uCausSpeed` low), tighter (`uCausScale` high), whiter, and pinned `uHeat=1.0`. If it churns like the
   pour, it loses its "sacred, eternal" character. Eyeball this beside the Cinzel A and E specifically.
6. **Keep the chromatic split tiny.** `uChroma ~0.012`; bigger and the caustic reads as a rainbow fringe
   after the ACES grade, not as refractive shimmer. It must whisper, like the `high` `ChromaticAberration`.
7. **Don't blow the bloom budget.** Only the *cores* should exceed 1.0 (via `PAL.hot`). If the whole caustic
   is HDR, the bloom smears into a flat orange haze and the OLED true-black is lost. Tune so the filament
   cores bloom and the field between them stays controlled.
8. **dt-correct everything.** `uTime += dt`/`elapsedTime` and `uHeat` via `damp(...,dt)` — never a
   frame-rate-dependent step (forge-scene / motion-feel non-negotiable). Freeze `uTime` on `static`.
9. **Reuse `gw_caustic`, don't paste a new noise.** It already exists in `shaders.js` and is namespaced
   `gw_`; importing `${GLSL_NOISE}` gives it to you. A second noise impl breaks the shared-grain cohesion
   (and bloats the shader). (`shader-fx`: "never paste a second noise impl.")

**Order of operations:** (1) pick + wire the basalt receiver material → (2) inject `gw_caustic` as flat
additive emissive, *visualize it raw* → (3) add the `uReach` distance falloff from `uEmitter` (confirm it
emanates from the metal) → (4) add the blackbody `gwCausRamp` tint → (5) wire `uHeat` to the shared store +
strike surge → (6) build the divine-fire preset (calm/tight/white/eternal) → (7) add the `uChroma`
chromatic split + tier down on `low`, freeze on `static` → (8) `qa-route` 0-errors → (9) iPhone-15 device
read + leva tune. Refraction-through-glass (role 3) needs no new work — it's the existing Fresnel/opal +
`high`-only transmission.

---

## 8. SOURCES (2025–2026)

- three.js — **`webgpu_caustics` example** (on `dev`/`master`, r180 era; r180 released **2025-09-03**):
  TSL `refract()` from `positionViewDirection`/`normalView` at IOR, caustic-texture sampling with per-channel
  chromatic offset, `viewZ` modulation, projected via **`castShadowNode`** through the shadow pipeline.
  https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_caustics.html ·
  https://threejs.org/examples/webgpu_caustics.html
- three.js — **`webgpu_volume_caustics` example** (2025): raymarched volumetric caustics projected onto a
  catcher plane. https://threejs.org/examples/webgpu_volume_caustics.html
- Maxime Heckel — **Field Guide to TSL and WebGPU** (**Oct 2025**): the node system replacing
  `onBeforeCompile`, glass/refraction recipes, the `viewportSharedTexture` + depth-aware screen-UV node that
  fixes the refraction "front-pixel" artifact, custom post-processing in TSL.
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Maxime Heckel — **Shining a Light on Caustics with Shaders and React Three Fiber** (caustics technique:
  refracted-ray / differential-area, environment caustic sampling, fake caustic approaches; reaffirmed in
  the 2025 TSL field guide's caustics recipe). https://blog.maximeheckel.com/posts/caustics-in-webgl/
- pmndrs drei — **`<Caustics>` component docs** (current, 2025): refracted-ray plane-projection technique;
  `causticsOnly`, `backside`/`backsideIOR` (1.1) front+back accumulator, `ior`, `worldRadius`, `intensity`
  (0.05), `resolution` (2048), `lightSource`, `frames` — the family-A reference + perf model.
  https://drei.docs.pmnd.rs/staging/caustics · https://github.com/pmndrs/drei
- Codrops / Matt Park — **Playing with Light and Refraction in Three.js: Warping 3D Text Inside a Glass
  Torus** (**2025-03-13**): `MeshTransmissionMaterial` `distortion`/`distortionScale`/`temporalDistortion`
  for refraction, and the extra-scene-pass perf tradeoff that bars it from scene-wide mobile use.
  https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Codrops — **How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects**
  (**2025-10-08**): modern animated-uniform, noise-driven UV/light distortion patterns — the live reference
  for the procedural-field (family C) approach. https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
- utsubo — **Migrate Three.js to WebGPU (2026) — The Complete Checklist** (**2026**): WebGPU
  production-readiness, iOS Safari support status, TSL replacing `onBeforeCompile`, post-processing nodes —
  the basis for deferring families B/D-WebGPU to a future phase.
  https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- three.js forum — **WebGPU r181 / stats-gl** and **r179 compute** threads (2025, r181 dated 2025-10-31):
  current renderer/WebGPU state for the fallback/migration decision.
  https://discourse.threejs.org/t/webgpu-r181-fyi-stats-gl-no-longer-compatible-with-webgpu/87944

_(Foundational pre-2025 lineage — Evan Wallace's "Rendering Realtime Caustics in WebGL" differential-area
method and Inigo Quilez's domain-warping/turbulence `abs(noise)` — is cited only as ancestry; the
implementation guidance tracks the 2025–2026 sources above.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Emitter tracking & UV projection of the pour front / A·E onto receiver stone.** How to feed `uEmitter`
   accurately per chamber — projecting the moving pour-front world position and the divine-fire A/E centroids
   into each basalt surface's UV space, multi-emitter blending (several channels lit at once), and how the
   caustic should sharpen/spread with distance like a real out-of-focus light.
2. **WebGPU/TSL caustic migration via `castShadowNode`.** Porting the procedural field to the three.js
   `webgpu_caustics` shadow-projection pattern (caustic cast *through* the shadow pipeline onto arbitrary
   receivers) with a clean WebGL fallback — what the full `Effects`/material migration costs and whether iOS
   Safari WebGPU is ready (per the 2026 utsubo checklist).
3. **True screen-space refraction for the jewel-chamber matrix.** A `high`-only single-surface
   `MeshTransmissionMaterial` or a TSL `viewportSharedTexture` depth-aware refraction (Heckel field guide)
   on one hero obsidian jewel — bending the ember veins seen *through* the glass — and its exact per-device
   cost vs. the current fake Fresnel/opal.
4. **Caustic ↔ heat-haze ↔ vein co-modulation.** Designing the shared `uHeat` envelope so the stone
   caustic, the rising heat shimmer (doc 16), and the slab veins read as **one** synchronized temperature
   event on a strike/scroll — including per-chamber caustic presets in `scenes.js` (broad pour in the
   channel-hall, tight altar dapple on the altar-approach).
