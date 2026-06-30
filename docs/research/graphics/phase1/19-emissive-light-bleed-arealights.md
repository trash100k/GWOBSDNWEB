# 19 — Emissive Light Bleed onto Stone (A+E Divine Radiance)

> Phase-1 graphics research · GAELWORX forge world · primary judge device: iPhone 15 (OLED)
> Topic owner concern: the white-gold **A** and **E** keep eternal "divine fire" and must *spill
> light* onto adjacent cooling letters and onto the carved **Ogham** in the green-black basalt —
> making the carving readable *for the first time*. This is the single most narratively loaded
> lighting moment in the world: it is the proof that the A+E are sacred, not just brighter.

---

## 1. SCOPE

In the GAELWORX world every letter of the poured wordmark cools through the master temperature
ramp (white-hot → orange → forge-red → iron-black) **except the first A and first E**, which the
brand canon (`CLAUDE.md`, "A+E IGNITED") fixes as permanently white-gold "divine fire." This
research element is *not* the A/E surfaces themselves — it is the **light those two letters cast
back into the world**: a warm white-gold radiance that grazes the shoulders of the neighbouring
cooled letters (catching their relief), washes across the **green-black Connemara basalt**, and —
critically — reveals the **carved Ogham strokes** cut into that stone. Without this bleed the A/E
read as flat stickers; with it they read as *sources*. The deliverable is a lighting sub-system
that makes an emissive letterform behave like a real, localized, warm light onto opaque stone and
adjacent metal, inside a strict mobile budget, sharing the one master temperature/material system
that drives the molten pour, the cooling letters, the sparks, and the obsidian slab.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are five viable families for "an emissive object lights the stone next to it." Honest
tradeoffs below, all weighed against the iPhone-15 single-renderer budget this repo enforces
(`forge-scene` skill: one `<Canvas>`, `high|low|static` tiers, no runtime EXR).

### A. RectAreaLight (physically-based soft area light)
`THREE.RectAreaLight` is the closest match to "a glowing letter slab emitting from its face." It
works **only on `MeshStandardMaterial`/`MeshPhysicalMaterial`** (which is exactly what the slab and
any letter/stone mesh already use here) and produces genuinely soft, directional area falloff via
the LTC (linearly-transformed cosines) approximation. Requires `RectAreaLightUniformsLib.init()`.
- **Quality:** highest of the realtime options — true soft area falloff, correct grazing on relief.
- **Perf:** the historically expensive one. The three.js forum/issue record (still the canonical
  caution, re-surfaced in 2025 lighting references) shows RectAreaLight dragging scenes to 20–30fps
  where Point/Spot held 60. Cost is **per-light, per-lit-pixel** and grows with how many materials
  it touches. **No shadow support** — it cannot be occluded by the letter geometry, so light leaks
  through unless you fake occlusion.
- **Mobile:** usable at **1–2 instances max**, and only on the `high` tier. Two (one per A, one per
  E) is the ceiling I'd ship.
- **Complexity:** low to wire, but you must manage the leak (no shadows) and the LTC uniform init.

### B. Dynamic PointLight / SpotLight with tuned distance+decay
A warm `PointLight` parked just in front of each A/E, `distance` clamped so its influence dies
before it reaches letters it shouldn't touch, `decay: 2` (physical). Cheaper than RectArea, and
`SpotLight` *can* cast a (perspective) shadow map if you want occlusion.
- **Quality:** point falloff is radially symmetric — wrong shape for a *letter* (a tall E should
  light a vertical strip, not a circle). Reads more "bulb" than "glowing glyph."
- **Perf:** cheap-ish; still per-light-per-pixel, and a shadow-casting SpotLight adds a depth pass.
- **Mobile:** 2–3 unshadowed point lights are affordable; shadow maps are the expensive part —
  avoid on mobile.
- **Complexity:** trivial. Good **fallback tier** but not the hero look.

### C. Emissive-driven illumination faked **in the surface shader** (proximity term)
Skip scene lights entirely for the bleed: in the **basalt material's** fragment shader, compute a
warm contribution as a function of distance from each A/E centre (passed as uniforms) and a
hand-authored normal/relief term, then add it before tone mapping. This is the same
`onBeforeCompile` chunk-injection pattern the repo already lives on (`shader-fx` skill,
`ObsidianSlab.jsx`: HEAD/NORMAL/COLOR injected into `MeshPhysicalMaterial`).
- **Quality:** *art-directable* — you decide exactly how the Ogham grooves catch the light
  (sample the carving's normal/AO map, brighten where the groove wall faces the source). Can look
  better than a real light because it's tuned for *this* shot, not physically general.
- **Perf:** near-free — a couple of `length()`/`smoothstep()` per pixel, no extra draw, no extra
  light loop. Scales to *any number* of glyph sources as uniforms.
- **Mobile:** the **only approach that's genuinely cheap on every tier.** Runs on `low` and even a
  reduced `static` bake.
- **Complexity:** medium — it's a fake, so getting the falloff/occlusion to read as "real light"
  is craft, and it only lights the *one material* you inject it into (the stone). Adjacent metal
  letters need the same term injected, or a separate light.

### D. Baked + dynamic hybrid (lightmap/AO bake for the static bleed, tiny dynamic top-up)
Bake the A/E → stone radiance into a **lightmap / emissive-AO texture** once (offline or via
`@react-three/lightmap`, the pmndrs in-browser GI baker — which notably bakes *emissive area
lights "for free"*), apply it as `lightMap`/`aoMap`, and add only a faint animated flicker
dynamically. The Ogham reveal is mostly *painted in* by the bake.
- **Quality:** GI-accurate soft bounce, zero runtime cost for the static part — the gold standard
  for "stone lit by a fixed glowing letter."
- **Perf:** the runtime is just an extra texture fetch. Excellent.
- **Mobile:** ideal — this is effectively the `static`/`low` tier's dream.
- **Complexity:** highest *pipeline* cost — needs a second UV set, a bake step, and the bake is
  **static**: if the camera or letters move relative to the stone the bake is wrong. GAELWORX
  camera only gently dollies/orbits per route (`CameraRig.jsx`), and the letters are fixed once
  poured — so a bake is viable. **Constraint:** the bake is a texture asset, not a runtime EXR, so
  it doesn't violate the no-EXR rule.

### E. Screen-space GI / volumetric fakes (post-process bleed)
2025–2026 has matured screen-space approaches that "paint light onto a scene in screen space, cost
decoupled from scene complexity" — Maxime Heckel's June-2025 volumetric-lighting-via-post-
processing+raymarching piece is the reference. A screen-space radial bleed/bloom seeded from the
A/E emissive can fake glow *spreading* across the stone. The repo already has selective bloom by
construction (`post-fx`: only HDR>1 pixels bloom, palette reserves `>1`).
- **Quality:** great for the *air* (haze, beams, the heat-shimmer halo) and for a soft "glow
  creep," but **screen-space ≠ surface-correct** — it won't make a specific Ogham groove read; it
  bleeds over everything at that screen location, including occluders.
- **Perf:** decoupled from scene complexity (a fixed per-pixel pass), but it *is* a full extra pass
  + raymarch loop — the heaviest post option on mobile.
- **Mobile:** the raymarched version is `high`-tier only; the cheap version is just the existing
  bloom, which is already mobile-safe.
- **Complexity:** medium-high; best as a *finishing* layer over C/D, not the mechanism that reveals
  the carving.

### F. (WebGPU/TSL note) MRT selective bloom + node emissive
The 2026 Codrops "Gommage" and "X-Ray Reveal" tutorials show the modern WebGPU path: emissive via
TSL nodes plus **MRT (multi-render-target) selective bloom** so only the glyph channel blooms. This
is the *future-correct* way to do the glow spread, and TSL compiles to GLSL **and** WGSL from one
source. But it requires `WebGPURenderer`; this repo is WebGL/R3F today, and iOS WebGPU only became
broadly real in late-2025 (Heckel's Oct-2025 field guide). Treat as **Phase-2 migration**, not
Phase-1.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship a layered hybrid, gated by tier — not one technique.** The carving reveal must be *surface-
correct and cheap*, the area softness must be *believable on the hero device*, and the glow spread
must be *the existing bloom*. Concretely:

- **Mechanism of record (all tiers): C — in-shader emissive proximity bleed in the basalt
  material.** This is what actually reveals the Ogham, because only a fake that *samples the
  carving's relief* can brighten the groove walls that face the A/E. It's the only option that runs
  on `low`/`static`, it costs nothing extra in draw calls, it injects via the exact
  `onBeforeCompile` HEAD/NORMAL/COLOR pattern the repo already uses, and it reads the **master
  temperature uniforms** so the bleed warms/cools with the rest of the world.
- **`high`-tier realism top-up: A — two RectAreaLights**, one centred on the A, one on the E, color
  = the divine white-gold, lighting the *adjacent metal letters* (where physically-correct grazing
  matters most and the shader fake is least controllable across many glyph meshes). Capped at two,
  `high` only.
- **Where geometry is fixed: D — a baked emissive-AO term** layered into the same basalt material
  as a `lightMap`/`aoMap`, so the static portion of the stone bleed is GI-accurate and free, and
  the shader fake (C) becomes just the *animated* delta (flicker, heat breath) on top.
- **Finish: E (cheap form) — the existing selective Bloom** (`Effects.jsx`) catches the A/E
  emissive cores (push them HDR>1, `toneMapped=false`) so the glow *spreads into the air* and the
  ember halo reads. No new pass.

**Why this fits the world + constraints:** it honours the single-renderer / no-EXR / tiered rules
(`forge-scene`); the carving-reveal is the *narrative point*, and only the shader-fake guarantees
it on the judge device at 60fps; RectAreaLight gives the A/E genuine *area* softness exactly where
two lights is affordable; and everything keys off the shared temperature uniforms so nothing looks
bolted on. Degrade order: `high` = C+A+D+Bloom · `low` = C+D+Bloom (drop the area lights to point,
or drop entirely) · `static` = C(frozen)+D+no post.

---

## 4. IMPLEMENTATION

### Libraries / versions
- `three` (repo's r17x line) — `RectAreaLight` + `RectAreaLightUniformsLib`.
- `@react-three/fiber`, `@react-three/drei` — drei's `<RectAreaLight>` helper auto-inits the LTC
  uniforms (no manual `RectAreaLightUniformsLib.init()` footgun).
- `@react-three/postprocessing` — already in `Effects.jsx`; reuse its `Bloom`.
- `@react-three/lightmap` (pmndrs) — *optional*, only for the baked term (D); bake to PNG, ship the
  texture, then **remove the baker from the runtime bundle**.
- Reuse in-repo: `GLSL_NOISE` (`shaders.js`), `PAL`/`v3` (`palette.js`), `damp` (`store.js`),
  `sceneFor` (`scenes.js`).

### Master temperature coupling (the shared spine)
Add a divine-fire signal to the shared store so the A/E radiance reads the same clock as the veins,
sparks, and cooling ramp. The repo already threads `uTime`, `uSurge`, `uTemp`, `forge.strikeAt`,
`forge.scrollVel` — extend that, don't fork it.

```js
// store.js — add to the forge object
aeRadiance: 1.0,      // 0..>1 master divine-fire intensity (HDR-capable)
aePulse:    0.0,      // breath/flicker delta, dt-damped
```

### Palette: the divine white-gold (new, but warm-family)
The A/E are *whiter and hotter* than the ember accent — still inside the warm forge family, just at
the top of the temperature ramp. Add to `palette.js` (HDR so it blooms):

```js
// palette.js
divine:    new THREE.Color(1.9, 1.55, 1.05), // white-gold A/E core (HDR > 1 → blooms)
divineLit: new THREE.Color('#ffdca0'),       // the colour it CASTS onto stone (LDR, warm)
```

### The basalt material — in-shader proximity bleed (mechanism C)
Inject into the **green-black basalt** `MeshPhysicalMaterial` exactly like `ObsidianSlab.jsx`
(HEAD adds uniforms + helpers, NORMAL perturbs for the Ogham relief, COLOR adds emissive pre-tone-
mapping). Glyph sources are passed as an array of world-space centres (max 4).

```glsl
// HEAD — appended after #include <common>
uniform float uTime;
uniform float uAErad;          // forge.aeRadiance (master)
uniform float uAEpulse;        // flicker delta
uniform vec3  uAEpos[4];       // world-space A/E source centres
uniform float uAEon[4];        // 1 = active source
uniform vec3  uDivineLit;      // PAL.divineLit (cast colour)
${GLSL_NOISE}

// Reveal weight for the carved Ogham: brighten where a groove wall FACES the source.
// vCarveNormal = the carving's perturbed normal (from the Ogham normal/relief map).
float gwAEbleed(vec3 worldPos, vec3 carveN){
  float lit = 0.0;
  for (int i = 0; i < 4; i++){
    if (uAEon[i] < 0.5) continue;
    vec3  toSrc = uAEpos[i] - worldPos;
    float d     = length(toSrc);
    // inverse-square-ish falloff, clamped so it dies before unrelated stone
    float fall  = 1.0 / (1.0 + d*d*1.6);
    // grazing term: groove walls facing the source catch the light → reveals carving
    float graze = clamp(dot(normalize(carveN), normalize(toSrc)), 0.0, 1.0);
    lit += fall * mix(0.35, 1.0, graze);   // 0.35 floor = ambient fill on the flat stone
  }
  // living flicker — same noise family as the veins, dt-driven from uAEpulse
  float flick = 1.0 + 0.12 * uAEpulse * gw_snoise(vec2(uTime*0.9, worldPos.x*0.7));
  return lit * flick;
}
```

```glsl
// COLOR — appended BEFORE #include <tonemapping_fragment>
float aeBleed = gwAEbleed(vWorldPosition, normalize(vCarveNormal)) * uAErad;
// divine-lit warm wash; stays in 0..~1.2 so it lights the stone WITHOUT itself blooming
gl_FragColor.rgb += uDivineLit * aeBleed;
```

> Note: the *stone* bleed is intentionally **LDR** (it must not bloom — it's reflected light). Only
> the **A/E emissive cores** are HDR>1 + `toneMapped=false` so bloom catches *them*, per `post-fx`.

### The A/E letterforms — emissive core + RectAreaLight (mechanisms A + Bloom)
```jsx
// DivineLetterLight.jsx — one per A/E source, high tier only
import { RectAreaLight } from '@react-three/drei'   // auto-inits LTC uniforms
import { useFrame } from '@react-three/fiber'
import { forge, damp } from '../store.js'
import { PAL } from './palette.js'

export default function DivineLetterLight({ position, size = [0.7, 1.3], quality }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    const target = forge.aeRadiance * (quality === 'high' ? 4.5 : 0) // off below high
    ref.current.intensity = damp(ref.current.intensity, target, 4, dt)
  })
  if (quality !== 'high') return null
  return (
    <RectAreaLight
      ref={ref}
      width={size[0]} height={size[1]}
      position={position}
      color={PAL.divineLit}
      intensity={0}      // damps up
      lookAt={[position[0], position[1], position[2] + 1]} // face the stone behind/beside
    />
  )
}
```

### Driving the master signal (one rAF, dt-damped — repo law)
```js
// inside an existing useFrame (e.g. the letters component), NOT a new rAF
const sinceStrike = performance.now()/1000 - forge.strikeAt
const surge = sinceStrike >= 0 && sinceStrike < 1.6 ? Math.exp(-sinceStrike*3.0)*0.4 : 0
// divine fire NEVER cools: a steady base + a slow sacred breath + strike surge
const breath = forge.quality === 'static' ? 0 : 0.5 + 0.5*Math.sin(t*0.6)
forge.aeRadiance = damp(forge.aeRadiance, 1.0 + surge, 3, dt)
forge.aePulse    = damp(forge.aePulse, breath, 2, dt)
// push to the basalt material uniforms (refs kept, .value mutated)
uniforms.uAErad.value   = forge.aeRadiance
uniforms.uAEpulse.value = forge.aePulse
```

### Key uniforms / params summary
| Uniform | Source | Role |
|---|---|---|
| `uAErad` | `forge.aeRadiance` | master divine-fire intensity (couples to strike/scroll) |
| `uAEpulse` | `forge.aePulse` | slow sacred breath / flicker delta |
| `uAEpos[]` | letter world centres | where the bleed originates (max 4) |
| `uDivineLit` | `PAL.divineLit` | the warm white-gold the stone receives |
| RectArea `intensity` | `forge.aeRadiance` | physical area top-up, high tier, capped at 2 lights |
| Bloom `luminanceThreshold` | `Effects.jsx` (0.55) | only the HDR A/E cores spread into air |

---

## 5. COHESION

- **Palette:** `divineLit` is the *top of the same warm ramp* the molten/cooling system already
  walks (`PAL.crimson → ember → hot`). It's whiter, not a new hue — so the A/E read as "the hottest
  point of the one fire," not a different light. The stone bleed uses `divineLit` (LDR warm), the
  glyph core uses `divine` (HDR) — same family, two stops apart.
- **One temperature clock:** `uAErad`/`uAEpulse` damp off `forge.strikeAt`, `forge.scrollVel`, and
  `uTime` — the *exact* signals that flare the obsidian veins (`ObsidianSlab.jsx` `uSurge`) and heat
  the jewel (`FacetedJewel.jsx` `uHeat`). A strike pulses the veins, the jewel edges, *and* the
  divine radiance together. The carving "breathes" on the same sine the slab idle-breath uses.
- **Cooling vs. eternal:** every other letter's emissive is driven *down* the ramp toward
  `iron-black`; the A/E uniforms are the *only* ones held at the top. The contrast is the whole
  point and it's expressed as "same system, A/E exempted," which is literally the brand rule
  (`CLAUDE.md` A+E IGNITED) made physical.
- **Sparks & embers:** `Embers.jsx` already uses additive warm points; the A/E radiance is the
  natural attractor — feed `forge.aeRadiance` into ember brightness near the glyphs so the orbiting
  sparks read as *drawn to the divine heat*, reusing the same uniform.
- **Channels & basalt:** the bleed material *is* the basalt material — the same green-black stone
  that the Celtic-interlace molten channels are carved into. The Ogham reveal and the channel glow
  share one surface shader, one normal-map relief convention, one noise (`gw_*`).
- **Bloom discipline:** the stone bleed is LDR on purpose so it never blooms (reflected light
  shouldn't); only the A/E cores cross HDR>1 and bloom — preserving the `post-fx` "only HDR blooms"
  contract so the finish stays controlled, not washed.

---

## 6. MOBILE & PERFORMANCE

iPhone-15 OLED is the judge; budget is one renderer, tiered.

- **`high`:** C (shader bleed) + **2** RectAreaLights + baked D term + existing Bloom. Two
  RectAreaLights touching only the *metal letter* materials (a handful of meshes, not the whole
  frame) is the affordable ceiling — RectArea cost scales with lit pixels/materials, so keep their
  influence tight and *don't* let them hit the full basalt slab (the shader fake already lights
  that).
- **`low`:** drop RectAreaLights entirely (or swap to **one** cheap unshadowed `PointLight` per
  source with clamped `distance`); keep C + D + Bloom at `intensity 0.6` (matches `Effects.jsx`).
  The carving still reveals because C is doing the real work.
- **`static` (reduced-motion / weak GPU):** freeze `uTime`/`uAEpulse` (the repo's `=== 'static' ?
  frozen` pattern, `ObsidianSlab.jsx:144`), `frameloop='demand'`, **no post**. The baked D term
  carries the Ogham reveal with *zero* per-frame cost — this is exactly why D is worth the pipeline
  effort. Provide a static poster fallback (`CanvasBoundary`) for WebGL failure.
- **LOD on sources:** `uAEpos[]` is capped at 4 and the loop is unrolled with `uAEon[]` gating —
  no dynamic-length loop (mobile GLSL hates those). On `low`, drop to the 2 nearest sources.
- **Texture budget:** the Ogham normal/AO and the baked lightmap should be a single shared atlas,
  power-of-two, KTX2/basis compressed; no runtime EXR (repo law).
- **No shadow maps on mobile** — RectArea has none anyway; the SpotLight-shadow fallback is
  desktop-only. Fake occlusion in C with the grazing term instead.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Pitfalls, in the order they'll bite, and the build order that dodges them:

1. **Build the surface fake FIRST, lights last.** The temptation is to drop a RectAreaLight and
   call it done — but RectArea has *no shadows*, so it leaks light *through* the letter and *can't*
   pick out a groove. The carving reveal is a *surface* phenomenon; it must be the shader term (C).
   Get C reading the Ogham on `static` before you add any real light.
2. **Author the Ogham as relief, not paint.** The reveal only works if the groove walls have real
   normals to catch the grazing term. Carry a proper normal/height map (or geometry) for the Ogham;
   a flat albedo line will never "light up." Pipe its perturbed normal as `vCarveNormal` into the
   bleed.
3. **Keep the stone bleed LDR; keep the glyph core HDR.** If the *stone* crosses 1.0 it blooms and
   the whole carving turns into a glowing smear (the "everything blooms → washed" failure in
   `post-fx`). Cast colour ≤ ~1.2; only the A/E core goes HDR>1 with `toneMapped=false`.
4. **`RectAreaLightUniformsLib.init()` or use drei's helper** — raw `RectAreaLight` without the LTC
   uniforms renders black/garbage and silently. Use drei's `<RectAreaLight>` which inits for you.
5. **Cap the falloff distance.** Without a clamp the proximity term bleeds onto stone clear across
   the frame and the A/E stop reading as *localized* sources. Tune `fall` so it's near-zero a
   letter-width away.
6. **One rAF, dt-damped.** Drive `uAErad`/`uAEpulse` from the *existing* `useFrame` via
   `THREE.MathUtils.damp`, never a fresh `setInterval`/`lerp(a,b,k)` — frame-rate-dependent flicker
   will read as jank and fight the other loops (`motion-feel`, `shader-fx`).
7. **Don't let divine fire cool.** Every cooling uniform ramps *down*; the A/E base must be pinned
   at the top of the ramp with only a *breath* modulation. If you accidentally feed it the cooling
   curve, the sacred letters dim — the one thing the brand forbids.
8. **Verify the way CI can:** `qa-route` — SwiftShader compiles the GLSL so a typo in the bleed
   shader surfaces as a console error (0 errors ≈ compiled). Then read the real bloom/true-black/
   white-gold on the iPhone 15 — area-light softness and OLED saturation don't simulate headless.
9. **Bake last, and only when geometry is frozen.** Don't bake D until the letter/stone layout is
   final — a re-pour invalidates the lightmap. The bake is the *optimization*, not the prototype.

---

## 8. SOURCES (2025–2026)

- Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
  Raymarching for the Web* (2025-06-10) —
  https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
  (screen-space light painting, cost decoupled from scene complexity; the E-tier reference.)
- Maxime Heckel — *Field Guide to TSL and WebGPU* (2025-10-14) —
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
  (iOS/Safari WebGPU now real; TSL node emissive; why WebGPU bleed is Phase-2.)
- Codrops / Thibault Introvigne — *WebGPU Gommage Effect: Dissolving MSDF Text into Dust and
  Petals with Three.js & TSL* (2026-01-28) —
  https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
  (emissive glyph that "always looks bright once bloom is applied"; **MRT selective bloom** — the
  future-correct glow-spread for ignited letters.)
- Codrops / Cullen Webber — *Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js*
  (2026-03-23) —
  https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
  ("use the emissive channel so figures glow on their own without strong scene lighting"; TSL+MRT
  bloom pipeline; WebGL bloom-differs caveat.)
- React Postprocessing docs — *SelectiveBloom / Bloom* (maintained 2025) —
  https://react-postprocessing.docs.pmnd.rs/effects/selective-bloom ·
  https://react-postprocessing.docs.pmnd.rs/effects/bloom
  (bloom is selective by lifting material colour out of 0–1 with `toneMapped=false` — the repo's
  HDR-only-blooms contract.)
- three.js docs — *RectAreaLight* (r17x, current 2025) —
  https://threejs.org/docs/pages/RectAreaLight.html
  (Standard/Physical only; LTC area light; **no shadow support** — the leak to design around.)
- three.js forum / issue #15232 — *Low fps using RectAreaLight: alternatives?* (canonical perf
  caution, re-cited across 2025 lighting references) —
  https://discourse.threejs.org/t/low-fps-using-rectarealight-alternatives/4888 ·
  https://github.com/mrdoob/three.js/issues/15232
  (20–30fps under RectArea vs 60 with Point/Spot — the 2-light mobile ceiling rationale.)
- pmndrs — *@react-three/lightmap (in-browser lightmap/AO baker)* (maintained 2025) —
  https://github.com/pmndrs/react-three-lightmap
  (bakes **emissive area lights "for free"** — the mechanism-D baked stone bleed.)
- DEV / Peter Riding — *Understanding Three.js Lighting — A Concise Reference* (2025) —
  https://dev.to/peter3riding/understanding-threejs-lighting-a-concise-reference-3e8b
  (start cheap (Ambient/Directional), add expensive (Spot/RectArea) only where needed — the tiering
  doctrine applied here.)

---

## 9. DEEP-DIVE CANDIDATES (Phase-2)

1. **Ogham-reveal relief authoring & the grazing model.** A dedicated pass on how to cut/normal-map
   the Ogham strokes so the grazing term reads as legible carving — geometry vs. parallax-occlusion
   mapping vs. baked normal+AO — and the exact `dot(carveN, toSrc)` curve that makes strokes appear
   "for the first time" without looking painted. This is where the narrative lands or dies.
2. **MRT selective bloom on the WebGPU/TSL migration.** Port the A/E glow-spread to a multi-render-
   target node pipeline (per the 2026 Gommage/X-Ray Codrops articles) so only the divine channel
   blooms, independent of the obsidian veins — cleaner than luminance-threshold bloom and the
   forward path once iOS WebGPU is the baseline.
3. **Baked emissive-GI workflow inside the GAELWORX pipeline.** Operationalize `@react-three/
   lightmap` (or an offline bake): second UV set, atlas budget, KTX2 compression, and the "freeze
   geometry → bake → strip baker from bundle" workflow, with a runtime cross-fade between baked and
   dynamic when a re-pour invalidates the bake.
4. **Heat-shimmer × radiance coupling.** How the A/E divine radiance drives the heat-shimmer
   distortion field above the letters (screen-space refraction seeded by `uAErad`) so the air over
   the sacred letters wavers more — tying topic 19 to the heat-shimmer element as one system.
