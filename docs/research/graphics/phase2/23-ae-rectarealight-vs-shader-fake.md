# 23 — AE Radiance: In-Shader Proximity Bleed vs 2 RectAreaLights vs Baked AO

> Phase-2 deep-dive · GAELWORX forge world · cluster **E-light-finish-arch** · primary judge device:
> iPhone 15 (OLED). Parent: Phase-1 topic **19 — Emissive Light Bleed onto Stone (A+E Divine Radiance)**.
> This document goes implementation-grade on the *tiered AE-onto-metal/stone lighting*: the shader
> proximity term (all tiers — the **only** mechanism that samples the carving relief), the capped pair
> of RectAreaLights on `high` (no shadows, manage the leak, LTC init), and the baked emissive-AO
> lightmap for the *static* stone spill once geometry is frozen — with the full
> **freeze → bake → strip-baker** workflow. Everything binds the one master temperature/uniform system
> from `00-COHESION-MAP.md`.

---

## 1. SCOPE

The first `A` and first `E` of the poured **GAELWORX** wordmark never cool. While every neighbouring
letter walks `gw_forge(temp)` down the ramp white-hot → orange → forge-red → iron-black, the A/E are
clamped to `gw_divineFire(flick)` — unearthly white-gold HDR, eternal (cohesion map §1.4, the
keystone). This deep-dive is **not** about the A/E surfaces. It is about **the light those two letters
throw back into the world**: the warm white-gold radiance that

1. **grazes the shoulders of adjacent cooled metal letters** — catching their crust relief so they
   read as solid iron lit by a nearby fire, not flat stickers;
2. **washes across the green-black Connemara basalt** — lifting its serpentine vein out of the void
   (the `basalt-green-reveal-transport` beat, phase2/10);
3. **reveals the carved Ogham** — making strokes legible *for the first time* as the divine light
   approaches (phase2/11–13, `25/26`).

Without this bleed the A/E are bright decals on a dead wall. With it they are *sources* — the proof the
sacred letters are alive. The deliverable is a **tiered lighting sub-system**: one surface-correct
shader term that runs everywhere and is the only thing that can pick out a groove; a capped pair of
physically-soft area lights for the hero device where grazing on the metal matters most; and a baked
GI term for the frozen stone spill. All three read the **shared `U` pool** (`forge.aeRadiance` /
`uAEFire` / `uAEFirePow`) so the radiance flares on the same heartbeat that surges the slab veins, the
jewel edges, and the pour front (cohesion map §4.2, §5.2). The chambers that consume it: **altar-approach
`/about`** (full strength — the keystone reveal), **stone-ledger `/pricing`** (Ogham verse up the edge),
and wherever a poured A/E sits beside stone.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Phase-1 topic 19 surveyed five families (RectAreaLight · point/spot · in-shader proximity · baked
hybrid · screen-space GI). This deep-dive narrows to the **three** that survived selection and goes to
the metal on each, plus the 2026 WebGPU/TSL forward path. The honest axes are quality / perf / mobile /
complexity, weighed against the iPhone-15 single-renderer / no-EXR / tiered envelope.

### 2.1 In-shader proximity bleed (mechanism C — the mechanism of record)

Compute the AE contribution **inside the receiver's fragment shader** as a function of distance from
each glyph centre (passed as uniforms) and a **carving-relief term** (the groove's perturbed normal),
added before tone-mapping. Injected via the repo's `onBeforeCompile` HEAD/NORMAL/COLOR pattern
(`shader-fx` skill, `ObsidianSlab.jsx`).

- **Quality:** the only approach that is *surface-correct and art-directable*. Because it samples the
  carving's normal/relief, it can brighten exactly the groove wall that faces the source — which is
  *literally how an Ogham stroke becomes legible*. A real light cannot do this without a shadow map
  (RectArea has none), and a screen-space pass bleeds over occluders. It can look *better* than a
  physical light because it's tuned for this shot.
- **Perf:** near-free — a 4-iteration unrolled loop of `length()` + `smoothstep()` + one `dot()` per
  pixel, no extra draw call, no extra light loop, scales to N glyph sources as uniforms. The 2026
  three.js-tips reference is blunt: fill-rate and draw-calls are the budget; a handful of extra ALU ops
  in an existing pass is invisible next to a second render pass.
- **Mobile:** the **only** family that runs on *every* tier including `static`. This is decisive.
- **Complexity:** medium — it's a fake, so the falloff/occlusion craft is on you, and it lights only the
  *one material you inject it into*. Adjacent metal letters need the same term (or a real light), and
  the carving must carry **real relief** (geometry or normal/height map) or there is nothing to graze.

### 2.2 Two RectAreaLights with LTC (mechanism A — the `high`-tier top-up)

`THREE.RectAreaLight` is the closest physical match to "a glowing letter slab emitting from its face."
It works **only on `MeshStandardMaterial`/`MeshPhysicalMaterial`** (exactly what the letter/stone meshes
already are) and produces genuinely soft, directional area falloff via **LTC — linearly-transformed
cosines**. It requires the BRDF lookup data: on `WebGLRenderer` you call `RectAreaLightUniformsLib.init()`
(drei's `<RectAreaLight>` does this for you); on `WebGPURenderer` the equivalent is
`RectAreaLightTexturesLib` (data textures), which the 2025 three.js docs/forum confirm is the
node-pipeline init path.

- **Quality:** highest of the realtime options — true soft area falloff, correct grazing on relief, the
  right *shape* (a tall E lights a vertical strip, not a circle). This is exactly where it earns its
  keep: the **adjacent metal letters**, where physically-correct grazing across many glyph meshes is
  harder to hand-author per-glyph in the shader fake.
- **Perf:** the historically expensive one. The canonical caution (three.js issue #15232, forum #4888,
  re-cited across 2025 lighting references) is 20–30fps under RectArea where Point/Spot held 60. Cost is
  **per-light, per-lit-pixel**, and grows with how many materials it touches. **No shadow support** — it
  cannot be occluded by the letter geometry, so light leaks *through* the letter unless you fake
  occlusion. Textured RectAreaLights (a glyph-shaped emitter) remain unsupported/experimental in
  WebGL as of the late-2025 forum thread — so the emitter stays a rectangle, and the *shape* of the
  glyph is sold by the shader fake, not the light.
- **Mobile:** usable at **1–2 instances, `high` only**. Two (one per A, one per E) is the ceiling, and
  only if their influence is kept *tight* (touching the few metal-letter meshes, never the full basalt
  slab — the shader fake owns the stone).
- **Complexity:** low to wire (drei helper), but you **must** manage the leak (no shadows) and not let
  it hit the wrong materials.

### 2.3 Baked emissive-AO lightmap (mechanism D — the static stone spill)

Bake the A/E → stone radiance into a **lightmap / emissive-AO texture** once, apply it as
`lightMap` (+ `aoMap`), and add only a faint animated delta at runtime. `@react-three/lightmap` (pmndrs)
is the in-browser baker — it renders GI on a *separate hidden canvas/WebGL context*, and notably bakes
**emissive area lights "for free"** (an emissive glyph mesh *is* the bake's light source — no separate
light rig needed). Offline alternatives: Blender bake → `gltf-transform` → KTX2 (the 2025/2026
recommended pipeline).

- **Quality:** GI-accurate soft bounce, the gold standard for "stone lit by a *fixed* glowing letter."
  Captures inter-reflection the shader fake never will.
- **Perf:** runtime is one extra texture fetch — excellent. KTX2/Basis stays compressed on the GPU
  (~10× memory reduction per the 2026 tips), which matters because mobile is fill/bandwidth bound.
- **Mobile:** ideal — this *is* the `static`/`low` tier's dream: the Ogham reveal carried with **zero**
  per-frame cost.
- **Complexity:** highest *pipeline* cost. Needs a **second UV set**, a bake step, and the bake is
  **static** — if the camera or letters move relative to the stone it's wrong. GAELWORX wins here: the
  camera only gently dollies/orbits per route (`CameraRig.jsx`) and letters are fixed once poured. Two
  modern gotchas: (1) `aoMap`/`lightMap` **no longer use `uv2`** — you set
  `material.lightMap.channel = 1` (and `aoMap.channel = 1`) to bind UV-set-1 (three.js r152+,
  re-confirmed in a Dec-2025 forum thread where a lightmap silently fell back to UV0 because the channel
  wasn't set); (2) the bake is a **texture asset, not a runtime EXR** — it does *not* violate the
  no-EXR rule.

### 2.4 The 2026 WebGPU/TSL forward path (MRT selective bloom + LTC textures)

The future-correct way to do the *glow-spread* half (not the surface reveal): emissive via **TSL nodes**
plus **MRT (multi-render-target) selective bloom**, so only the divine glyph channel blooms,
independent of the obsidian veins. The 2026 Codrops "Gommage" (MSDF text → dust) and the WebGPU bloom-
emissive example both drive bloom off the **`emissive` MRT target** via `pass.setMRT({ emissive: ... })`
— the scene renders **once**, MRT captures the emissive channel, bloom reads that target. Cleaner than
luminance-threshold bloom because it doesn't depend on pushing color > 1.0; the A/E bloom because they
are *flagged emissive*, not because they're bright. WebGPU is now real on iOS (Safari 26, Sept 2025 —
Heckel's field guide), and TSL compiles to **GLSL and WGSL from one source**. **Verdict for the judge
build:** Phase-2 *migration*, not Phase-1. The shipping renderer is WebGL2 + `onBeforeCompile` (cohesion
map §10 hard constraint: the `WebGPURenderer` WebGL2-fallback branch is less-tested than classic
`WebGLRenderer`; betting the judge device on it is the documented mistake). Author the proximity term
TSL-portable so the eventual port is a re-host, not a rewrite.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a layered hybrid, gated by tier — not one technique.** Each mechanism does the one job it is
uniquely good at; the tiers compose them:

| Tier | Composition | Rationale |
|---|---|---|
| **`high`** | **C** (shader proximity, all surfaces) **+ A** (2 RectAreaLights on metal letters only) **+ D** (baked stone spill, once frozen) **+ Bloom** | full read — surface-correct reveal, true area softness on metal, GI-accurate static stone, glow into air |
| **`low`** | **C + D + Bloom** (drop area lights, or 1 clamped unshadowed PointLight per source) | the carving still reveals because **C does the real work**; the area lights were polish |
| **`static`** | **C (frozen `uTime`/`uAEpulse`) + D + no post** | the **baked D term carries the reveal at zero per-frame cost** — the whole reason D is worth the pipeline effort |

**The non-negotiable: C is the mechanism of record on every tier.** It is the only one that *samples the
carving's relief*, so it is the only one that can make a specific Ogham groove rise from black. A and D
are *additive realism/optimization*, never the thing that reveals the lore. If you must cut, you cut A
first, then D, never C.

**Why this fits the world + constraints:** it honours single-renderer / no-EXR / tiered (`forge-scene`);
the carving reveal — the narrative point — is guaranteed on the judge device at 60fps because C is
near-free; RectAreaLight delivers genuine *area* softness exactly where two lights is affordable and
where the shader fake is least controllable (many metal glyph meshes); the bake removes the static stone
spill from the frame budget entirely; and **everything keys off `forge.aeRadiance` / `uAEFire`** so
nothing looks bolted on (cohesion map §5.2, rule 5).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (repo line) — `RectAreaLight` + `RectAreaLightUniformsLib` (WebGL; `RectAreaLightTexturesLib`
  is the WebGPU-node equivalent, for the Phase-2 port only).
- `@react-three/fiber`, `@react-three/drei` — drei `<RectAreaLight>` auto-inits the LTC uniforms (avoids
  the silent-black footgun of forgetting `RectAreaLightUniformsLib.init()`).
- `@react-three/postprocessing` — reuse `Effects.jsx` `Bloom` (`mipmapBlur`, `luminanceThreshold ≈ 0.55`,
  `resolutionScale 0.5`).
- `@react-three/lightmap` (pmndrs) — **build-time only** for mechanism D; bake to PNG/KTX2, ship the
  texture, **remove the baker from the runtime bundle** (§4.6).
- Reuse in-repo: `GLSL_NOISE`/`gw_*` (`shaders.js`), `PAL`/`v3` (`palette.js`), `damp` (`store.js`),
  `U` (`forgeUniforms.js`), `sceneFor` (`scenes.js`).

### 4.2 Master coupling — extend the shared `U` pool, never fork it

The cohesion map already specifies `uAEFire` (vec3 nearest divine-fire position) and `uAEFirePow`
(intensity) in the master pool (§4.2). This deep-dive consumes them and adds the breath delta. The
**sole writer** is `<ForgeDriver/>` (§4.2) — no new rAF.

```js
// forgeUniforms.js — already-present + the two this element reads/adds
U.uAEFire    = { value: [/* up to 4 */ new THREE.Vector3(), ... ] } // glyph world centres
U.uAEOn      = { value: [1,1,0,0] }     // unrolled gate, 1 = active source
U.uAEFirePow = { value: 1.0 }           // master divine intensity (forge.aeRadiance)
U.uAEPulse   = { value: 0.0 }           // slow sacred breath / flicker delta
U.uDivineLit = { value: PAL.divineLit } // the LDR warm-gold the stone RECEIVES
```

```js
// store.js — add to the forge object (the cohesion-map keystone signal)
aeRadiance: 1.0,   // 0..>1 master divine-fire intensity (HDR-capable; NEVER cools)
aePulse:    0.0,   // breath/flicker delta, dt-damped
```

### 4.3 Palette — the divine white-gold (warm-family, two stops above ember)

The A/E are *whiter and hotter* than the ember accent — still the top of the **same** ramp, never a new
hue (cohesion map §3.1; rule 5). Two stops: the HDR **core** (blooms) and the LDR **cast** (must not
bloom — it's reflected light).

```js
// palette.js
divine:    new THREE.Color(1.9, 1.55, 1.05), // A/E emissive CORE, HDR > 1 → blooms, toneMapped=false
divineLit: new THREE.Color('#ffdca0'),       // colour CAST onto stone, LDR warm (≤ ~1.2, never blooms)
```

### 4.4 Mechanism C — in-shader proximity bleed (the heart)

Injected into the **green-black basalt** `MeshPhysicalMaterial` exactly like `ObsidianSlab.jsx`: HEAD
adds uniforms + helper, the existing NORMAL block already perturbs `vCarveNormal` for the Ogham relief
(phase2/11–13), and COLOR adds the warm wash **before** `#include <tonemapping_fragment>`. The same term
is injected into the **adjacent metal-letter** material on tiers below `high` (where there's no
RectAreaLight to do it physically).

```glsl
// ---- HEAD (after #include <common>) ----
uniform float uTime;
uniform float uAEFirePow;      // forge.aeRadiance (master, never cools)
uniform float uAEPulse;        // slow sacred breath
uniform vec3  uAEFire[4];      // world-space A/E source centres
uniform float uAEOn[4];        // 1 = active source (unrolled gate)
uniform vec3  uDivineLit;      // PAL.divineLit (LDR cast colour)
${GLSL_NOISE}                  // gw_snoise etc — SHARED noise, never a second one

// Reveal weight: brighten where a groove wall FACES the source.
// carveN = perturbed carving normal (Ogham relief); worldPos = vWorldPosition.
float gwAEbleed(vec3 worldPos, vec3 carveN){
  float lit = 0.0;
  // unrolled fixed loop — mobile GLSL hates dynamic-length loops
  for (int i = 0; i < 4; i++){
    if (uAEOn[i] < 0.5) continue;
    vec3  toSrc = uAEFire[i] - worldPos;
    float d     = length(toSrc);
    // inverse-square-ish, CLAMPED so it dies before unrelated stone (keeps A/E LOCAL)
    float fall  = 1.0 / (1.0 + d*d*1.6);
    // grazing term: groove walls facing the source catch the light → reveals the carving
    float graze = clamp(dot(normalize(carveN), normalize(toSrc)), 0.0, 1.0);
    lit += fall * mix(0.35, 1.0, graze);   // 0.35 floor = soft ambient fill on flat stone
  }
  // living flicker — SAME noise family as the veins, dt-driven from the master breath
  float flick = 1.0 + 0.12 * uAEPulse * gw_snoise(vec2(uTime*0.9, worldPos.x*0.7));
  return lit * flick;
}

// ---- COLOR (BEFORE #include <tonemapping_fragment>) ----
float aeBleed = gwAEbleed(vWorldPosition, normalize(vCarveNormal)) * uAEFirePow;
// LDR warm wash — lights the stone WITHOUT itself blooming (clamp keeps cast ≤ ~1.2)
gl_FragColor.rgb += uDivineLit * min(aeBleed, 1.2);
```

> **Edge case — the grazing curve is the whole reveal.** A linear `dot()` makes strokes "fade up"
> mushy. For the "appears *for the first time*" snap, shape it: `graze = pow(clamp(dot(...),0.,1.), 1.6)`
> and gate the *threshold* on `uAEFirePow` so the groove crosses legibility as the divine light
> *arrives*, not as a constant. This is the `dot(carveN, toSrc)` curve called out in topic 19's
> deep-dive candidate #1; it lands or kills the narrative.

### 4.5 Mechanism A — the 2 RectAreaLights (high tier only)

One per A/E, color = `divineLit`, **facing the metal letters**, capped at 2, damped up from 0 so the
LTC cost only exists on `high`. Influence kept tight; never aimed at the full basalt (C owns the stone).

```jsx
// DivineLetterLight.jsx — high tier only, one per A/E
import { RectAreaLight } from '@react-three/drei'   // auto-inits LTC (RectAreaLightUniformsLib)
import { useFrame } from '@react-three/fiber'
import { forge, damp } from '../store.js'
import { PAL } from './palette.js'

export default function DivineLetterLight({ position, size = [0.7, 1.3], faceTarget }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    // off below high; rides the SAME master signal the veins/jewel/sparks ride
    const target = forge.quality === 'high' ? forge.aeRadiance * 4.5 : 0
    ref.current.intensity = damp(ref.current.intensity, target, 4, dt)
  })
  if (forge.quality !== 'high') return null
  return (
    <RectAreaLight
      ref={ref}
      width={size[0]} height={size[1]}
      position={position}
      color={PAL.divineLit}
      intensity={0}            // damps up — Brutalist-Snap synchrony with the strike
      lookAt={faceTarget}      // face the metal letters, NOT the full stone slab
    />
  )
}
```

**Leak management (no shadows):** the rectangle has no occlusion, so light passes through the letter to
whatever's behind. Three defences: (1) keep `intensity` modest and `size` close to the glyph footprint;
(2) aim `lookAt` so the back face of the leak points into void, not into a lit receiver; (3) let C's
clamped `fall` dominate on the stone so any RectArea leak onto basalt is washed out by the (correct)
shader term. The textured-emitter route that would mask the leak to the glyph silhouette is still
experimental in WebGL (2025 forum), so we do **not** rely on it.

### 4.6 Mechanism D — the baked emissive-AO lightmap (freeze → bake → strip)

The static stone spill, baked once, applied as `lightMap` + `aoMap` on UV-set-1. C becomes only the
*animated delta* (flicker + the live-reveal threshold) on top of the baked base.

**The freeze → bake → strip-baker workflow (the operational core of this doc):**

1. **FREEZE.** Bake only when geometry is final — letter layout poured, channels carved, camera framing
   per route locked. A re-pour invalidates the bake (`renderer.info.memory` must stay flat; a re-bake is
   a content change, not a runtime event). Author a second UV set (UV1) for the stone — a unique,
   non-overlapping atlas unwrap (overlapping UVs = bleeding light across unrelated strokes).
2. **BAKE.** Two paths:
   - *In-browser* — wrap the stone + emissive A/E glyph meshes in `@react-three/lightmap`'s
     `<Lightmap>`; it renders GI on a hidden canvas/context and bakes the **emissive glyphs as area
     lights for free**. Use `onComplete(texture)` to capture the result, then save it. Bridge any R3F
     context the wrapped content consumes (documented baker gotcha).
   - *Offline* — Blender bake (emissive plane = the glyph) → `gltf-transform` → KTX2.
3. **COMPRESS + WIRE.** KTX2/Basis (UASTC for any normal map, ETC1S for the diffuse lightmap), power-of-
   two, single shared atlas with the Ogham normal/AO. Wire with the **modern channel API** — `uv2` is
   gone:
   ```js
   mat.lightMap = bakedTex;       mat.lightMap.channel = 1;  // bind UV-set-1
   mat.aoMap    = bakedAOTex;     mat.aoMap.channel    = 1;
   mat.lightMap.colorSpace = THREE.SRGBColorSpace; // lightMap needs a colorSpace assigned
   ```
4. **STRIP.** Remove `@react-three/lightmap` from the **runtime** import graph — it pulls a second WebGL
   context and a renderer's worth of code that must never ship to the judge device. Keep it behind a
   build-time script / dev-only route (e.g. `npm run bake:ae`) so the production bundle imports only the
   baked KTX2. This is the single most important line in the D workflow: **the baker is a tool, not a
   dependency.**
5. **RUNTIME COMPOSITE.** `final = bakedSpill (lightMap) + C_delta (animated flicker/reveal)`. On a
   re-pour (rare — content edit), cross-fade baked↔dynamic via a `uBakedMix` uniform so the world never
   pops while the new bake is produced.

### 4.7 Driving the master signal (one rAF, dt-damped — repo law)

Inside the existing letters `useFrame` (never a new rAF), `<ForgeDriver/>` owns the pool; this is the
divine-fire driver shape:

```js
// divine fire NEVER cools: steady base + slow sacred breath + strike surge
const sinceStrike = state.clock.elapsedTime - forge.strikeAt
const surge  = (sinceStrike >= 0 && sinceStrike < 1.6) ? Math.exp(-sinceStrike*3.0)*0.4 : 0
const breath = forge.quality === 'static' ? 0 : 0.5 + 0.5*Math.sin(state.clock.elapsedTime*0.6)
forge.aeRadiance = damp(forge.aeRadiance, 1.0 + surge, 3, dt)   // pinned at top, +strike
forge.aePulse    = damp(forge.aePulse,    breath,      2, dt)
U.uAEFirePow.value = forge.aeRadiance
U.uAEPulse.value   = forge.aePulse
```

### 4.8 Key params summary

| Param | Source | Role |
|---|---|---|
| `uAEFirePow` | `forge.aeRadiance` | master divine intensity (couples strike/scroll; never cools) |
| `uAEPulse` | `forge.aePulse` | slow sacred breath / flicker delta |
| `uAEFire[4]` / `uAEOn[4]` | glyph world centres + unrolled gate | bleed origins (max 4; nearest 2 on `low`) |
| `uDivineLit` | `PAL.divineLit` | LDR warm-gold the stone receives (≤ ~1.2, no bloom) |
| `fall` clamp `*1.6` | tuning | kills bleed ~one letter-width out → A/E read as *localized* |
| `graze` `pow ^1.6` | tuning | the "appears first time" snap on the Ogham |
| RectArea `intensity` | `forge.aeRadiance*4.5` | physical area top-up, `high`, ≤2 lights, metal only |
| `lightMap.channel = 1` | baked UV1 | bind the bake to the second UV set (NOT `uv2`) |
| Bloom `luminanceThreshold ≈0.55` | `Effects.jsx` | only the HDR A/E *cores* spread into air |

---

## 5. COHESION

- **Palette:** `divineLit` is the *top of the same warm ramp* the molten/cooling system already walks
  (`PAL.crimson → ember → hot → divine`) — whiter, not a new hue. The stone receives `divineLit` (LDR),
  the glyph core emits `divine` (HDR): same family, two stops apart. No cool/green/blue ever enters
  (rule 3); the basalt green lives in the *material*, lifted *by* this warm light, never tinted by it.
- **One temperature clock:** `uAEFirePow`/`uAEPulse` damp off `forge.strikeAt`, `forge.scrollVel`, and
  `uTime` — the *exact* signals that flare the obsidian veins (`uSurge`) and heat the jewel (`uHeat`). A
  strike pulses the veins, the jewel edges, the pour band, the sparks, *and* the divine radiance **in
  the same frame** — that synchrony is the cohesion proof (rule 6).
- **Cooling vs eternal — the keystone made physical:** every other emissive ramps *down* toward
  iron-black via `gwCool01`; the A/E uniforms are the *only* ones pinned at the top. This is the brand's
  "A+E IGNITED" rule (CLAUDE.md) expressed as "same system, A/E exempted" (cohesion map §1.4, rule 5).
  The first A + first E are computed at **build time as data** (`uIsAE`), never a fragile in-shader
  string match.
- **Shared noise:** the flicker is `gw_snoise` from `shaders.js` at the same family/frequency as the
  veins — the carving "breathes" on the same grain the metal flows on (rule 2). No second noise.
- **Sparks & basalt:** `Embers.jsx` reads `forge.aeRadiance` so orbiting sparks brighten near the
  glyphs — drawn to the divine heat, reusing one uniform. The bleed material *is* the basalt material
  the Celtic-interlace channels are carved into: Ogham reveal and channel glow share one surface shader,
  one relief convention, one noise.
- **Bloom discipline (rule 7):** stone bleed is LDR on purpose so it never blooms (reflected light
  shouldn't); only the A/E cores cross HDR>1 + `toneMapped=false` and bloom — preserving the "only HDR
  blooms" contract so the finish stays controlled, not washed.

---

## 6. MOBILE & PERFORMANCE

iPhone-15 OLED, one renderer, DPR-capped 1.5, ~9–10 ms steady-state budget on `high` (cohesion map §10).
This element is **fill-rate cheap by design** — its cost is a few ALU ops in an already-running pass,
not a new pass.

- **`high`:** C (≈ negligible — 4-iter unrolled ALU in the basalt pass already on screen) + **2**
  RectAreaLights (the only real cost; bounded because they touch a *handful of metal-letter meshes*, not
  the full frame — RectArea cost scales with lit pixels/materials) + baked D (one extra texture fetch) +
  existing Bloom. Keep the area-light influence tight; **never** let them hit the full basalt slab.
- **`low`:** drop RectAreaLights entirely (or one clamped unshadowed `PointLight` per source); keep C +
  D + Bloom (`intensity 0.6`, matching `Effects.jsx`). The carving still reveals — C does the real work.
  Drop `uAEFire` to the **2 nearest** sources.
- **`static`** (reduced-motion / weak GPU): freeze `uTime`/`uAEPulse` (`=== 'static' ? frozen` pattern,
  `ObsidianSlab.jsx`), `frameloop='demand'`, **no post**. The **baked D term carries the Ogham reveal at
  zero per-frame cost** — exactly why D earns its pipeline effort. CSS/`<noscript>` poster on WebGL fail.
- **Texture budget:** Ogham normal/AO + the baked lightmap share **one** power-of-two atlas, KTX2/Basis
  (~10× GPU-memory saving), no runtime EXR (repo law).
- **No shadow maps on mobile** — RectArea has none anyway; the SpotLight-shadow fallback is desktop-only.
  Fake occlusion lives entirely in C's grazing term.
- **Degrade uniformly (rule 9):** a tier drop removes *passes/lights*, never recolors or restructures.
  `static` is a dignified frozen still (warm-gold Ogham legible on true-black void), not a broken
  fallback.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Pitfalls in the order they bite, and the build order that dodges them:

1. **Build C FIRST, lights last.** The temptation is to drop a RectAreaLight and call it done — but it
   has *no shadows* (leaks through the letter) and *can't pick out a groove*. The carving reveal is a
   **surface** phenomenon. Get C revealing the Ogham on `static` before adding any real light.
2. **Author the Ogham as RELIEF, not paint.** The grazing term needs real groove normals to catch.
   Carry geometry or a normal/height map; a flat albedo line will never "light up." Pipe its perturbed
   normal in as `vCarveNormal` (phase2/11–13).
3. **Shape the grazing curve and gate its threshold on `uAEFirePow`.** A linear `dot()` fades up mushy;
   `pow(...,1.6)` + a `uAEFirePow`-gated legibility threshold gives the "appears *for the first time*"
   snap as the light *arrives*. This is the make-or-break of the narrative beat.
4. **Keep stone bleed LDR; keep the glyph core HDR.** If the *stone* crosses 1.0 it blooms and the whole
   carving turns into a glowing smear (`post-fx` "everything blooms → washed"). Cast ≤ ~1.2; only the A/E
   core is HDR>1 + `toneMapped=false`.
5. **`RectAreaLightUniformsLib.init()` or drei's helper** — raw `RectAreaLight` without LTC data renders
   **black/garbage silently**. Use drei's `<RectAreaLight>`. (WebGPU port: `RectAreaLightTexturesLib`.)
6. **Cap the falloff distance.** Without the `fall` clamp, bleed crosses the whole frame and the A/E
   stop reading as *localized* sources. Tune so it's near-zero a letter-width away.
7. **One rAF, dt-damped.** Drive `uAEFirePow`/`uAEPulse` from the existing `useFrame` via
   `THREE.MathUtils.damp`, never `setInterval`/`lerp(a,b,k)` — frame-rate flicker reads as jank and
   fights the other loops.
8. **Don't let divine fire cool.** Every cooling uniform ramps *down*; the A/E base is pinned at the top
   with only breath. Feed it the cooling curve by accident and the sacred letters dim — the one thing
   the brand forbids.
9. **Bake LAST, only when geometry is frozen — and STRIP the baker.** A re-pour invalidates the
   lightmap; D is the *optimization*, not the prototype. After baking, remove `@react-three/lightmap`
   (and its second WebGL context) from the **runtime** bundle — it's a build tool, not a shipped
   dependency. Set `lightMap.channel = 1` / `aoMap.channel = 1` (UV-set-1) — `uv2` is gone; forgetting
   the channel silently falls back to UV0 and the bake looks wrong (Dec-2025 forum case).
10. **Verify the way CI can.** `qa-route` — SwiftShader compiles the GLSL so a bleed-shader typo surfaces
    as a console error (0 errors ≈ compiled). Then the **iPhone-15 read**: area-light softness, OLED
    true-black, and the white-gold do **not** simulate headless.

---

## 8. SOURCES (2025–2026)

- three.js forum — *Low fps using RectAreaLight: alternatives?* (canonical perf caution, re-cited across
  2025 lighting refs) — https://discourse.threejs.org/t/low-fps-using-rectarealight-alternatives/4888 ·
  GitHub issue #15232 https://github.com/mrdoob/three.js/issues/15232 (20–30fps under RectArea vs 60
  Point/Spot — the 2-light mobile-ceiling rationale).
- three.js docs — *RectAreaLight* (r17x/r180, current 2025–2026) —
  https://threejs.org/docs/pages/RectAreaLight.html — Standard/Physical only, LTC area light, **no
  shadow support** (the leak to design around).
- three.js docs / forum — *RectAreaLightTexturesLib* + *Textured RectAreaLights, what is the state of
  things?* (Sept 2023 → **Dec 2025**) — https://threejs.org/docs/pages/RectAreaLightTexturesLib.html ·
  https://discourse.threejs.org/t/textured-rectarealights-what-is-the-state-of-things/56227 — WebGPU LTC
  init via data textures; textured/glyph-shaped emitters still experimental (so the shader fake sells the
  glyph shape).
- pmndrs — *@react-three/lightmap (in-browser lightmap/AO baker)* (maintained 2025) —
  https://github.com/pmndrs/react-three-lightmap · README
  https://github.com/pmndrs/react-three-lightmap/blob/main/README.md — bakes **emissive area lights "for
  free"** on a hidden canvas/context; `onComplete(texture)`; context-bridge gotcha — mechanism D.
- unframework — *Simple global illumination lightmap baker with WebGL* (the baker's author write-up,
  referenced 2025) — https://unframework.com/portfolio/simple-global-illumination-lightmap-baker-for-threejs/
  — how the in-browser GI bake works; the freeze→bake premise.
- utsubo — *100 Three.js Tips That Actually Improve Performance (2026)* —
  https://www.utsubo.com/blog/threejs-best-practices-100-tips — "bake what you can (lightmaps, shadows,
  AO)"; **KTX2/Basis stays compressed on GPU (~10× memory)**, UASTC normals / ETC1S diffuse; gltf-
  transform pipeline; fill-rate/draw-call budget — the D compression + budget doctrine.
- three.js docs + forum — *MeshStandardMaterial.lightMap / aoMap channel* (r152+, re-confirmed **Dec
  2025**) — https://threejs.org/docs/pages/MeshStandardMaterial.html ·
  https://discourse.threejs.org/t/lightmap-not-using-uv1-uv2-in-meshstandardmaterial-but-works-perfectly-in-shadermaterial/88564
  — `aoMap`/`lightMap` **no longer use `uv2`**; set `.channel = 1` for UV-set-1 (the silent-fallback
  gotcha).
- Codrops / Thibault Introvigne — *WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with
  Three.js & TSL* (**2026-01-28**) —
  https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
  — emissive glyph "always looks bright once bloom is applied"; **MRT selective bloom** via the emissive
  target — the future-correct glow-spread for ignited letters (Phase-2 WebGPU path).
- three.js examples — *WebGPU bloom-emissive / bloom-selective (MRT)* (current 2025–2026) —
  https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html ·
  https://threejs.org/examples/webgpu_postprocessing_bloom_selective.html — `pass.setMRT({emissive})`;
  scene renders once, bloom reads the emissive MRT target.
- Maxime Heckel — *Field Guide to TSL and WebGPU* (**2025-10-14**) —
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — iOS/Safari WebGPU real (Safari 26,
  Sept 2025); TSL node emissive; one source → GLSL + WGSL — why the WebGPU MRT path is Phase-2, not the
  judge build.
- Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching*
  (**2025-06-10**) —
  https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
  — screen-space light painting, cost decoupled from scene complexity; the (rejected-for-reveal) E-tier
  glow-creep reference, and why screen-space ≠ surface-correct.

---

## 9. DEEP-DIVE CANDIDATES

1. **The grazing-reveal curve & Ogham relief authoring.** Geometry vs normal-map vs clamped-POM for the
   strokes, and the exact `pow(dot(carveN,toSrc))` + `uAEFirePow`-gated threshold that makes a stroke
   appear "for the first time" without looking painted — the make-or-break of the keystone beat
   (extends phase2/11–13).
2. **The freeze → bake → strip pipeline operationalized.** `@react-three/lightmap` vs offline Blender,
   the second-UV atlas budget shared with the Ogham normal/AO, KTX2 (UASTC/ETC1S) settings, the
   `npm run bake:ae` dev-only script, and the `uBakedMix` baked↔dynamic cross-fade for the rare re-pour.
3. **RectAreaLight leak-management on a no-shadow budget.** Quantifying the 2-light cost on iPhone 15,
   the `lookAt`/`size`/`intensity` envelope that keeps leak invisible, and whether a stencil/clip or the
   experimental textured emitter ever becomes worth it.
4. **The WebGPU/TSL MRT port.** Re-hosting C as a TSL node and the A/E glow-spread as
   `pass.setMRT({emissive})` selective bloom (per the 2026 Gommage example) so the divine channel blooms
   independent of the obsidian veins — the forward path once iOS WebGPU is the baseline.
