# 28 — Cinematic Camera: DOF, Framing, Lens Feel

_Phase-1 graphics research · GAELWORX forge world · target: iPhone 15 (OLED), single WebGL renderer (r3f / three.js), warm-forge palette. Topic: the **lens** — depth-of-field / bokeh, focal framing, subtle lens distortion + vignette, dolly-vs-orbit grammar, and the **descend-to-eye-level reveal** of the cast GAELWORX letters. Filmic camera language, cheaply._

> Scope split: doc **27** owns where the camera **goes** (the CatmullRom journey + Lenis + per-route framing). This doc owns how the camera **sees** — the glass in front of the sensor. Together with doc **20** (bloom + post chain) and doc **21** (OLED grade) these three are the *finishing trinity*. This doc reads from the same `forge.*` bus and slots into the same single `EffectComposer`; it never adds a second renderer or a second loop.

---

## 1. SCOPE

In the GAELWORX forge the camera is a **physical cinema lens**, not a CSS viewport. The world is built for it: pure-void darkness lit only by molten metal, a stone altar pouring living metal down Celtic-interlace channels, the metal filling GAELWORX letterforms left-to-right, each letter cooling white-hot → orange → forge-red → iron-black, and the **A and E** holding unearthly white-gold divine fire that radiates onto the carved Ogham. A scene that sacred and that dark only reads as *cinematic real-time* (Lusion / Unseen Studio / Unreal-cinematic caliber) if the **lens behaves like a lens**: shallow focus that isolates the hot pour-front from the deep void, a soft bokeh halo on out-of-focus ember points, a focal-length choice that compresses or expands the channel hall, the faintest barrel/vignette/aberration so the frame has *glass* in it, and — the signature beat — a **descend-to-eye-level reveal** where the camera drops from a high altar-approach to a low, reverent eye-line on the finished cast word.

This element's job is to make every other element look photographed. Bloom (doc 20) says "this metal is emitting"; DOF says "this metal is *here*, in space, at this distance, and the rest is atmosphere." The two are partners: bloom on a white-hot pour-front that is *also* slightly defocused gives the large, soft, sacred halo that sells heat — sharp bloom reads as UI, soft bloom-through-bokeh reads as film.

Hard constraints inherited from the world: **one WebGL renderer**, strict iPhone-15 budget, **no runtime EXR**, warm-forge palette (Celtic Blood `#C1292E`, Ember Glow `#E85D04`, Forged Iron `#0B0C10`, Cold Steel `#1F2833`, Fog White `#F1F2F6`, Ash `#8D99AE`), and Brutalist-Snap / Forge-Reveal motion (high-momentum easing, **no bounce**). DOF is the single most expensive "cheap-looking" effect to get wrong on mobile, so the brief here is explicitly **filmic language, cheaply** — the lens feel must survive on a phone.

The current code has **no lens model at all**: `Effects.jsx` runs bloom + CA + grade + vignette + grain + SMAA but **no DepthOfField**; `CameraRig.jsx` does a flat dolly + cursor parallax with a hard `fov:40`; `ForgeCanvas` sets `fov:40, near:0.1, far:50`. This doc specifies the upgrade from "a perspective camera looking at a slab" to "a cinema lens photographing the forge."

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable modern approach to filmic lens feel in r3f, scored on quality / perf / mobile / complexity.

### A. `@react-three/postprocessing` `DepthOfField` (the framework path — current repo lib)
`react-postprocessing` **v3.0.4** (released 2025-02-20, already the lib `Effects.jsx` imports) wraps pmndrs `postprocessing`'s `DepthOfFieldEffect`. Props: `focusDistance` (normalized 0..1 between near/far), `worldFocusDistance` (focus in world units — the reliable one for a moving subject), `worldFocusRange`, `focalLength`, `bokehScale` (CoC / blur kernel size), `target` (a Vector3 the effect focuses on), `resolution`/`height` (the DOF render target size). The effect renders a Circle-of-Confusion pass + a bokeh blur at a **downsampled** resolution, then composites — so it is a real scatter-ish bokeh, not a box blur.
- **Quality:** Very good. Real CoC + hexagonal-ish bokeh; the out-of-focus ember points become soft discs (the look we want orbiting the pour).
- **Perf:** Moderate — it adds a CoC pass + a blur pass at `resolution`. The single biggest mobile cost in the chain after transmission. Tameable by dropping `resolution` (e.g. `height: 480`) and gating by tier.
- **Mobile:** Acceptable **only** tier-gated and at reduced resolution. Full-res DOF on an iPhone is the classic budget-buster.
- **Complexity:** Low — it's one JSX element in the existing composer, and it **merges into the same `EffectPass`** family the chain already uses.
- **Focus tracking:** Use `worldFocusDistance` (a damped scalar = distance camera→pour-front), updated in `useFrame`. The pmndrs `target` prop is documented as flaky for moving local-space objects (r3f Discussion #3113, 2025); `worldFocusDistance` "consistently works" — compute camera→target world distance and feed it. **Use `worldFocusDistance`, not `target`.**

### B. `Autofocus` (react-postprocessing) — depth-buffer hit-test autofocus
A higher-level effect that reads the depth buffer at a screen point (mouse or a tracked `target`) and **smoothly eases** the DOF focus to whatever is under that point (`smoothTime`, `focusRange`, `bokehScale`, `mouse`, `manual`, `debug`). Internally it owns a `DepthOfFieldEffect` and calls `api.update(delta)` per frame.
- **Quality:** Excellent for "always focus on what's under the cursor / pour-front." This is the cinematic *rack-focus* tool.
- **Perf:** DOF cost **plus** a depth read; slightly more than raw DOF.
- **Mobile:** Same gating story; the depth read is cheap, the DOF blur is the cost.
- **Complexity:** Low-medium. The smoothing is built in (so a rack-focus from altar to letters is a `smoothTime` away), but on mobile we usually **don't want autofocus-on-mouse** (no cursor); we want focus **driven by the journey**. So we take Autofocus's *easing model* but feed it our own world-distance target rather than the mouse. In practice: either use `Autofocus manual` + drive its target, or just use `DepthOfField worldFocusDistance` with our own damp — the latter is fewer moving parts.

### C. `TiltShift2` / tilt-shift blur (drei / postprocessing) — the cheap fake
A directional/gradient blur that darkens-and-blurs top & bottom bands, faking shallow focus on a horizontal subject band **without a CoC pass**. Much cheaper than true DOF (no depth-driven per-pixel kernel; it's a screen-space gradient blur).
- **Quality:** Good *for the right composition* — a horizontal letter row read from a low angle is exactly the tilt-shift sweet spot. Not a true rack-focus; the blur is by screen-Y, not by depth.
- **Perf:** Cheaper than DOF. A separable blur driven by a vertical mask.
- **Mobile:** The honest mobile-tier DOF substitute. This is the "filmic, cheaply" answer for the low tier.
- **Complexity:** Low.
- **Fit:** The GAELWORX letter row is horizontal and the hero shot is low-and-along it → tilt-shift's gradient axis lines up with the composition. **Strong low-tier fallback.**

### D. Manual `focalLength` / FOV animation — lens *choice*, not blur
Independent of any blur: animating the perspective camera's `fov` (or doing a true **dolly-zoom / Vertigo**: move the camera in while widening fov, or out while narrowing, to hold the subject size while the background compresses/expands). three.js dolly-zoom is well-documented for 2025 (threejsdemos.com dolly-zoom demo; Lomarco's Medium "Dolly Zoom / Vertigo" walkthrough).
- **Quality:** This is the most *cinematic* lever and it costs **nothing** — it's just camera math. A long lens (low fov ~28–32) compresses the channel hall into a dense, oppressive, dwarf-forge depth; a wide lens (~50) on the altar approach feels vast. A subtle dolly-zoom on the finale ("Point the Sword") makes the void *rush* behind the cast word.
- **Perf:** Free.
- **Mobile:** Free, runs at every tier.
- **Complexity:** Low; just damp `camera.fov` + `updateProjectionMatrix()`.
- **Fit:** Mandatory. This is half of "lens feel" and it's the cheap half. **Always on.**

### E. Lens distortion / barrel + vignette + chromatic aberration — the *glass*
Subtle barrel/pincushion distortion, a darkening vignette, and per-channel UV-offset chromatic aberration that grows toward the frame edge are the screen-space cues that say "shot through a real lens." Codrops' **False Earth** (2026-04-21) and **Efecto** (2026-01-04) both build exactly this trio: RGB sampled at slightly offset UVs for fringing, vignette darkening edges to draw the eye center, optional cool/warm tint. GAELWORX already runs CA + vignette + grain in `Effects.jsx`.
- **Quality:** High *in whispers*. Tiny barrel + edge-growing CA + a firm vignette = "anamorphic forge lens." Overdone = "broken 3D-TV."
- **Perf:** CA/vignette merge into the existing single grade `EffectPass` — near-free. A dedicated barrel-distortion pass is one extra fullscreen sample (cheap) or can be folded into the CA effect's radial modulation.
- **Mobile:** CA/vignette are high-tier (CA already gated); vignette is on at all tiers; barrel is high-tier-only.
- **Complexity:** Low — extend the existing chain.

### F. Particle/sprite "fake bokeh" for embers — the free shallow-focus on points
Instead of (or in addition to) post DOF, render the orbiting sparks (`Embers.jsx`) as soft additive sprites whose **size + softness scale with their distance from the focal plane** — a per-point CoC computed cheaply in the vertex/fragment shader. Codrops' "Simulating Depth of Field with Particles" is the canonical pattern (older, but the technique is referenced in 2025 roundups). This gives gorgeous defocused-ember discs **without** a post DOF pass touching them.
- **Quality:** Excellent for points; this is how you get those big soft out-of-focus ember orbs cheaply.
- **Perf:** Essentially free — it's a uniform + a size attribute on points already being drawn.
- **Mobile:** Runs at every tier; the cheapest "bokeh" we can buy.
- **Fit:** **High** — the sparks are already additive points; making their size/alpha a function of `|depth − focusDepth|` is a few shader lines and gives the bokeh read even when post DOF is off on mobile.

### G. TSL / WebGPU depth-of-field (the future lane)
three.js r17x ships TSL DOF / tilt-shift built from the depth buffer; Codrops' "WebGPU Scanning Effect with Depth Maps" (2025-03-31) shows depth-map-driven focus/blur in TSL, and the WebGPU post examples include a tilt-shift DOF with an auto-focus approximation in "a few lines of TSL." Maxime Heckel's TSL/WebGPU field guide (2025-10-14) confirms iOS Safari WebGPU has landed but coverage is uneven.
- **Quality:** Best-in-class — node-graph DOF can sample the depth buffer directly and do per-pixel CoC with no wrapper friction.
- **Perf:** Excellent on WebGPU.
- **Mobile:** WebGPU on iOS is real but **not universal in 2025–2026**; betting the primary judge device on it is risky.
- **Verdict:** Phase-2. Our shaders are GLSL `onBeforeCompile`; a DOF rewrite is a renderer swap. **Not now.**

**Landscape verdict:** lens feel = **D + E + F always, A gated on top.** Free levers first (fov / dolly-zoom framing, vignette, CA, particle-CoF embers), then real post `DepthOfField` (`worldFocusDistance`) **high-tier only**, with **TiltShift2** as the low-tier substitute and **no DOF** on static. Autofocus's easing model is borrowed (we damp `worldFocusDistance` ourselves) but the mouse-autofocus mode is not used. TSL DOF is the documented Phase-2 upgrade.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Model the camera as one shared cinema lens driven by the `forge.*` bus: (1) a damped `camera.fov` per route + a scripted dolly-zoom on the finale (free, every tier); (2) the existing CA + vignette extended with a *whisper* of barrel distortion (high-tier, merged pass); (3) distance-to-focal-plane sizing on the ember points so sparks bokeh for free (every tier); and (4) a real `DepthOfField` effect focused via a damped `worldFocusDistance` locked to the pour-front, high-tier only, with `TiltShift2` as the low tier and nothing on static. The focal plane and fov are functions of `forge.scrollDamped` / act / route, so the lens, the temperature, and the journey move as one system. The descend-to-eye-level reveal is a coordinated move of camera path (doc 27), fov, and a focus rack — not a separate animation.**

Justification against the world + existing code:

- **It reuses the chain and the bus.** DOF/TiltShift slot into the *same* `EffectComposer` in `Effects.jsx`; CA/vignette are already there; the focus distance, fov, and bokeh scale all read `forge.scrollDamped`/`scrollVel`/route — the same signals the obsidian veins (`uVeinGlow`/`uTemp`), bloom intensity (doc 20), and the journey (doc 27) read. The lens cannot disagree with the metal about how hot/how-far-through the forging we are. **That shared-uniform lock is the cohesion requirement.**
- **Free levers carry the look.** fov/dolly-zoom and the particle-CoF embers give 70% of the "filmic" read at ~0 cost and run on every device, so even the `static`/low tier reads cinematic. Post DOF is the *garnish on top* for capable devices, not the foundation — which is exactly the iPhone-15 budget discipline.
- **`worldFocusDistance`, not `target`.** Per r3f Discussion #3113 (2025), `target` is unreliable for moving subjects; world-distance is the proven path. The pour-front already has a world position (doc 27's `FOCUS` curve / pour-front uniform) — feed `camera.position.distanceTo(pourFront)` (damped) straight in.
- **Tilt-shift fits the composition.** The hero is a low, along-the-letter-row shot; a horizontal-band blur axis matches it, so the cheap fallback doesn't look like a cheat.
- **Brand motion.** fov, focus distance, and bokeh scale are all `damp()`'d → high-momentum, **no overshoot** = Brutalist Snap. The descend-reveal lands with impact, not a spring.
- **OLED-safe.** DOF blur softens the dark void gradients, which can *reintroduce* banding; the existing grain (doc 20) doubles as dither and covers it — another reason the lens lives in the same chain.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `@react-three/postprocessing` **v3.0.4** (2025-02-20) + `postprocessing` ≥ 6.3x — **already in the repo** (`Effects.jsx` imports). Adds `DepthOfField`, `Autofocus`, `TiltShift2`. **No new dep.**
- `three` r17x, `@react-three/fiber`, `drei` — already present.
- `leva` — already present, for `?debug` live-tuning of focus/fov/bokeh.

### 4.2 The lens lives in two files
The lens splits across the **rig** (fov + the focal-plane scalar, because the rig owns the camera and the journey) and the **composer** (the DOF/TiltShift pass + CA/vignette/barrel). They share state through `forge.*`.

#### (a) `CameraRig.jsx` — fov + focal distance + dolly-zoom (free levers)

Extend the existing rig (doc 27 adds the curve; this adds the lens). Add a per-route `fov` to `scenes.js` and a damped `camera.fov`, a damped `forge.focusDist` (world units to the pour-front), and the finale dolly-zoom.

```jsx
// scenes.js — add fov per chamber (lens choice per world)
//  '/'           fov 40  (the original tuning — never change /)
//  '/automations' fov 30  (long lens: compress the channel hall, oppressive)
//  '/web'         fov 50  (wide: the jewel chamber feels vast)
//  '/contact'     fov 34  (the forge-mouth arch)         ... etc

// CameraRig.jsx (lens additions, inside the existing useFrame)
const sc = sceneFor(forge.route)

// 1) FOCAL LENGTH (free, every tier). Damped → Brutalist-Snap, no bounce.
cam.fov = damp(cam.fov, sc.fov ?? 40, 2.4, dt)

// 2) DOLLY-ZOOM on the finale act ("Point the Sword"): as scroll → 1, narrow
//    the fov while the path pulls back, so the void RUSHES behind the cast word.
const finale = range(forge.scrollDamped, 0.82, 0.18)        // 0..1 over last act
cam.fov -= finale * 8                                        // long-lens compress
if (Math.abs(camera.fov - cam.fov) > 0.001) {
  camera.fov = cam.fov
  camera.updateProjectionMatrix()                            // REQUIRED after fov change
}

// 3) FOCAL PLANE — world distance camera → pour-front (the subject in focus).
//    forge.pourFront is the shared pour-front world pos (doc 27 / master system);
//    fall back to the slab centre (origin) before the pour exists.
const subject = forge.pourFront ?? ORIGIN                    // THREE.Vector3
const targetDist = camera.position.distanceTo(subject)
forge.focusDist = damp(forge.focusDist ?? targetDist, targetDist, 4, dt) // rack-focus easing
// scroll energy widens the in-focus band slightly (a flick "opens the aperture")
forge.focusRange = damp(forge.focusRange ?? 2, 2 + forge.scrollVel * 1.5, 4, dt)
```

`updateProjectionMatrix()` after every fov write is non-negotiable — forget it and the fov change silently no-ops (the #1 dolly-zoom bug).

#### (b) `Effects.jsx` — the DOF pass, tier-gated, reading the shared focal plane

```jsx
import {
  EffectComposer, DepthOfField, TiltShift2, Bloom,
  ChromaticAberration, HueSaturation, BrightnessContrast, Vignette, Noise, SMAA,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge } from '../store.js'

export default function Effects({ quality }) {
  const high = quality === 'high'
  const dof = useRef()

  // MASTER FOCAL PLANE → DOF. Same forge.* bus the veins + bloom read, so the
  // lens focuses on exactly the pour-front the temperature system is heating.
  useFrame(() => {
    if (!dof.current) return
    // worldFocusDistance is the proven path for a moving subject (r3f #3113).
    dof.current.target = undefined                       // ensure target route is off
    if ('worldFocusDistance' in dof.current)
      dof.current.worldFocusDistance = forge.focusDist ?? 6.4
    if ('worldFocusRange' in dof.current)
      dof.current.worldFocusRange = forge.focusRange ?? 2.0
  })

  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      {/* DEPTH OF FIELD — high tier only, downsampled. Subject = pour-front. */}
      {high ? (
        <DepthOfField
          ref={dof}
          worldFocusDistance={6.4}     // overwritten per-frame from forge.focusDist
          worldFocusRange={2.0}        // in-focus band width (world units)
          bokehScale={3.0}             // CoC / blur disc size — keep modest
          resolution={480}             // DOWNSAMPLED render target — the perf knob
        />
      ) : quality === 'low' ? (
        /* LOW TIER — cheap tilt-shift fake; horizontal band matches the letter row */
        <TiltShift2 blur={0.18} taper={0.55} />
      ) : (
        <></>                          /* static: no defocus at all */
      )}

      <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3}
             intensity={high ? 0.9 : 0.6} radius={0.8} />
      {high ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />
      ) : <></>}
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={-0.04} contrast={0.16} />
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT}
             opacity={high ? 0.05 : 0.035} />
      {high ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
```

**Order note:** DOF must sit **before** bloom-and-grade so the defocus operates on the raw depth-sorted scene; bloom then blooms the *already-defocused* hot pixels (soft halo over soft disc = the filmic look). CA/vignette/grain stay terminal. This matches the False-Earth / Efecto chain ordering (lens-physics → light → grade).

#### (c) Particle-CoF embers (`Embers.jsx`) — free bokeh on points, every tier

Make each spark's screen size + alpha a function of its distance from the focal plane, so out-of-focus embers become soft discs even when post DOF is off (mobile):

```glsl
// Embers point vertex shader (additions)
uniform float uFocusDist;   // = forge.focusDist (world units)
uniform float uFocusRange;  // = forge.focusRange
// ...
float camDist = -mvPosition.z;                       // view-space distance
float coc = clamp(abs(camDist - uFocusDist) / uFocusRange, 0.0, 1.0);
gl_PointSize = uSize * (1.0 + coc * 2.2) / -mvPosition.z;  // defocused = bigger
vCoc = coc;                                          // pass to frag for softness
```
```glsl
// Embers point fragment — softer, dimmer disc when defocused (energy-preserving-ish)
float edge = mix(0.5, 0.05, vCoc);                   // sharp dot vs soft halo
float a = smoothstep(0.5, edge, length(gl_PointCoord - 0.5));
gl_FragColor = vec4(uColor, a * (1.0 - vCoc * 0.55)); // dimmer when spread
```
Feed `uFocusDist`/`uFocusRange` from `forge.focusDist`/`focusRange` in the Embers `useFrame` — the **same scalars** the post DOF reads. Sparks near the pour-front stay sharp pinpoints; sparks drifting into the void bloom into soft orbs. This is the cheapest bokeh in the build and the only one the static/low tier gets.

### 4.3 The descend-to-eye-level reveal (the signature)
This is a **coordinated** move across three systems on the finale act, all driven by `range(forge.scrollDamped, 0.82, 0.18)`:
1. **Path (doc 27):** the `JOURNEY` curve's last control points drop the camera Y from the high altar-approach down to a low, near-horizontal eye-line on the cast word (`y: 0.6 → -0.2`, looking slightly *up* at the letters so they feel monumental).
2. **Lens (this doc):** fov narrows 8° (dolly-zoom) so the void compresses and rushes behind the word; the long lens flattens the letter row into a heroic frieze.
3. **Focus rack:** `forge.focusDist` damps from "altar depth" to "the front face of the cast letters," so focus *racks* onto the finished word as the camera settles — bokeh blooms behind it.
The three land together (shared `range` window) and **damp with no bounce** → the reveal *arrives* (Brutalist Snap), it doesn't ease-spring into place.

### 4.4 Key params
| Param | Value | Why |
|---|---|---|
| `camera.fov` | 30–50 per route, damp λ 2.4 | lens choice per chamber; free cinematic lever |
| finale dolly-zoom | `−8°` over last 18% of scroll | void rushes behind the cast word |
| `worldFocusDistance` | = `forge.focusDist` (damped λ 4) | rack-focus to pour-front; proven over `target` |
| `worldFocusRange` | 2.0 + `scrollVel*1.5` | in-focus band; a flick "opens the aperture" |
| `bokehScale` | 3.0 | modest CoC — sacred, not novelty |
| DOF `resolution` | 480 (high tier) | the perf knob — downsample the blur pass |
| `TiltShift2 blur` | 0.18 (low tier) | cheap shallow-focus fake on the letter band |
| ember `coc` size mult | ×2.2 | defocused spark → soft orb, free, every tier |

### 4.5 Hooking the master temperature system
The lens is a **consumer and a co-author** of the shared bus:
- It **reads** `forge.scrollDamped` (fov per act, finale dolly-zoom, focus depth) and `forge.scrollVel` (aperture/focus-range widen on a flick) and `forge.pourFront` (the focal subject).
- It **writes** `forge.focusDist` / `forge.focusRange` so the **same scalars** drive both the post DOF pass *and* the particle-CoF embers — one focal plane, two consumers, never out of sync.
- Because focus is locked to the pour-front and fov is locked to the act, **the metal that is hottest is the metal in focus**: scroll to the letter-fill act and the camera is at eye level, the word is sharp, the pour-front is hot, and the void behind is bokeh + bloom. That is the cohesion lock for the lens.

Expose `fov`, `worldFocusDistance`, `worldFocusRange`, `bokehScale`, and `TiltShift2 blur` to the `?debug` leva panel (the project's live-tuning convention) so the lens is authored on-device, not guessed.

---

## 5. COHESION

- **One renderer, one composer, one loop.** DOF/TiltShift are elements in the *existing* `EffectComposer`; fov/focus live in the *existing* `CameraRig` `useFrame`. No second pass authority, no second rAF, no second renderer — matches the `forge-scene` single-renderer rule and the `post-fx` "only HDR blooms / merged passes" rule.
- **Shared bus.** fov, focus distance, focus range, bokeh, vein glow, bloom intensity, ember CoF, and act state are all functions of `forge.scrollDamped`/`scrollVel`/`pourFront`/route. Nothing reads a private camera value, so the lens, the metal temperature, the bloom, and the journey are one system. The post DOF and the ember bokeh literally share `forge.focusDist`.
- **Palette/lighting untouched.** The lens defocuses and frames the *same* lit world; it adds no color. The warm-forge palette (`palette.js` HDR `>1` hot values that bloom) and the neutral-cool `<Lightformer>` env (no EXR) are unchanged. Vignette stays neutral-dark (no cool/green cast — brand law), CA stays a sub-pixel whisper.
- **Bloom partnership (doc 20).** DOF runs *before* bloom so the white-hot pour-front blooms *through* its own defocus — soft disc + soft halo = the sacred heat read. The A+E divine fire, pushed highest in emissive, blooms most and, if slightly off the focal plane, gets the largest bokeh — reinforcing "radiate onto adjacent stone" optically.
- **OLED grade (doc 21).** DOF blur can re-introduce banding in the dark void gradients; the existing `Noise` grain (kept ≥0.03) dithers it. The lens never lightens the void — crushed blacks survive.
- **Brand motion.** Every lens param is `damp()`'d → high-momentum, no overshoot = Brutalist Snap. The descend-reveal is a Forge-Reveal beat (blur-to-sharp rack-focus on the word), timed off the same `scrollDamped` window as the copy reveal.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Tier gating (the whole strategy):**
  - `high`: full post `DepthOfField` at `resolution:480` + CA + barrel + SMAA + fov/dolly-zoom + particle-CoF embers.
  - `low`: **`TiltShift2`** instead of DOF (no CoC pass), no CA, fov/dolly-zoom + particle-CoF embers still on.
  - `static`/reduced-motion: **no defocus pass at all**; only fov is fixed and particle embers render sharp (or with a *baked* CoF). The frame still reads cinematic because fov choice + vignette + crushed blacks carry it. This is the required floor.
- **The free levers do the heavy lifting.** fov/dolly-zoom = camera math (0 GPU); particle-CoF = a uniform + a size attribute on points already drawn (≈0); vignette/CA merge into the existing single grade `EffectPass`. So even with post DOF *off*, the lens reads filmic on the cheapest device.
- **DOF is the one real cost.** A CoC pass + a bokeh blur. Tame it: `resolution:480` (not full-res — DOF blur is low-frequency, downsampling is invisible), modest `bokehScale` (big kernels = big cost), high-tier-only. `AdaptiveDpr` (already on) keeps the whole composer at the capped tier DPR.
- **No extra render targets beyond DOF's own.** `disableNormalPass` stays (DOF uses depth, which the composer already provides; no normal buffer). No SSAO/SSR.
- **`updateProjectionMatrix` discipline.** Only call it on frames where fov actually changed (the `> 0.001` guard above) — calling it every frame is a needless matrix rebuild.
- **Frameloop:** `'always'` except `static` (`'demand'`), unchanged from `ForgeCanvas`.
- **Banding watch.** DOF softening + true-black OLED is a banding risk; keep grain ≥0.03 on every non-static tier (doc 20 already mandates this).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls**
1. **Forgetting `updateProjectionMatrix()` after fov changes** — the dolly-zoom silently does nothing. Guard + call only on change.
2. **Using DOF `target` for a moving subject** — documented flaky (r3f #3113, 2025). Use `worldFocusDistance` = damped `camera.position.distanceTo(pourFront)`.
3. **Full-res DOF on mobile** — instant budget blowout. `resolution:480`, high-tier only, `TiltShift2` for low.
4. **Bokeh too big** — large `bokehScale` reads as a software smear / novelty toy, not a lens, and costs the most. Keep ≤ ~3 and modest; the *softness*, not the size, sells it.
5. **DOF after bloom** — blooms a sharp frame then blurs it = bloom rings stay sharp inside soft areas (broken). DOF **before** bloom so hot pixels bloom through their defocus.
6. **Rack-focus whip** — snapping `focusDist` to a new subject reads as a focus-pull jerk. **Damp it** (λ≈4) — that *is* the cinematic rack; never feed a raw distance.
7. **Lens distortion / CA overdone** — barrel + fringe must be a whisper (CA offset `0.0008–0.0012`, barrel a few %). More = "broken 3D-TV," off-brand.
8. **Banding from blur** — DOF softens void gradients on OLED → keep grain on as dither.
9. **fov-induced motion sickness** — animating fov *and* dolly *and* parallax at once can swim. Reserve the dolly-zoom for the finale only; keep per-route fov changes gentle (damp λ 2.4) and respect reduced-motion (fixed fov).
10. **Out-of-range scroll on iOS** — clamp the `range()` finale window so rubber-band can't push the dolly-zoom past its target.

**Order of operations**
1. **Free levers first.** Add per-route `fov` to `scenes.js` + damped `camera.fov` + `updateProjectionMatrix` guard in `CameraRig`. Verify the channel hall compresses on `/automations`, the jewel chamber widens on `/web`, and `/` is unchanged. Zero GPU cost — get the *framing* right before any blur.
2. **Particle-CoF embers.** Wire `forge.focusDist`/`focusRange` and the point-size CoF in `Embers.jsx`. Now sparks bokeh on every tier.
3. **Focal plane scalar.** Compute + damp `forge.focusDist` to the pour-front in `CameraRig`. Verify it tracks as the journey moves.
4. **Post DOF (high tier).** Add `<DepthOfField worldFocusDistance resolution:480>` reading `forge.focusDist`; tune `bokehScale`/`worldFocusRange` in `?debug` until the void behind the pour-front is soft and the subject crisp. Confirm DOF sits **before** bloom.
5. **Low-tier `TiltShift2`** substitute; verify the letter-row band blur reads on a throttled device.
6. **Lens glass.** Nudge CA + add a whisper of barrel + confirm vignette; high-tier only.
7. **The descend-to-eye-level reveal.** Coordinate path-drop (doc 27) + fov dolly-zoom + focus rack on the shared finale `range` window; tune until it *arrives* with impact, no bounce.
8. **QA** with `qa-route`/`tune-pacing`: build (SwiftShader compiles GLSL → 0 console errors ≈ it compiled), then read DOF softness / bokeh / banding / no-seasickness on the **iPhone 15 OLED** — none of those simulate in a headless shot. Verify static tier (no DOF) still reads cinematic.

---

## 8. SOURCES (2025–2026)

1. **react-postprocessing — `DepthOfField` effect docs & v3.0.4 release** (pmndrs, v3.0.4 released 2025-02-20; docs current 2025–2026). `focusDistance`, `worldFocusDistance`, `worldFocusRange`, `focalLength`, `bokehScale`, `target`, `resolution`/`height`; merges into the `EffectPass`. https://react-postprocessing.docs.pmnd.rs/effects/depth-of-field · https://github.com/pmndrs/react-postprocessing
2. **react-postprocessing — `Autofocus` effect docs** (pmndrs, current 2025–2026). Depth-buffer hit-test autofocus with `smoothTime`/`focusRange`/`bokehScale`/`mouse`/`manual`/`debug`, `api.update(delta)` per frame; the rack-focus easing model. https://react-postprocessing.docs.pmnd.rs/effects/autofocus
3. **r3f Discussion #3113 — "Depth Of Field: Target vs WorldFocusDistance"** (pmndrs, 2025). `worldFocusDistance` (camera→target world distance) is the reliable focus-tracking path; `target` prop is flaky for moving local-space objects. https://github.com/pmndrs/react-three-fiber/discussions/3113
4. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Ming Jyun Hung, 2026-04-21). Cinematic lens chain: chromatic aberration via offset-UV RGB sampling, edge-darkening (tinted) vignette, bloom, tone-map last; lens-physics → light → grade order. https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
5. **Codrops — "Efecto: Building Real-Time ASCII and Dithering Effects with WebGL Shaders"** (2026-01-04). Chromatic aberration as cheap-optics RGB separation + vignette darkening edges to draw the eye center — the "glass in the frame" cues. https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/
6. **Codrops — "WebGPU Scanning Effect with Depth Maps"** (Maxime Heckel-adjacent / 2025-03-31). Depth-map-driven focus/blur in TSL/WebGPU — the node-graph DOF path and tilt-shift-from-depth approach for the Phase-2 lane. https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
7. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025-10-14). TSL post-processing node pipeline; iOS Safari WebGPU has landed but coverage is uneven — why TSL DOF is Phase-2, not now. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
8. **threejsdemos.com — "Dolly Zoom (Vertigo Effect)"** + **Gianluca Lomarco, "From Perspective to Orthographic Camera in Three.js with Dolly Zoom — Vertigo Effect"** (Medium, 2025). Dolly-zoom math (move + counter-fov), `updateProjectionMatrix`, the cinematic compress/expand behind a held subject. https://threejsdemos.com/demos/camera/dolly-zoom · https://medium.com/@gianluca.lomarco/from-perspective-to-orthographic-camera-in-three-js-with-dolly-zoom-vertigo-effect-96de89c3a07b
9. **Codrops — "Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality"** (2025-02-11). Tier-gating expensive post (DOF among them), downsampled render targets, mobile budget discipline. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
10. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026-01-12). Prefer pmndrs/postprocessing, disable multisampling where unused, downsample heavy passes, `frameloop=demand` for static, dt-frame-independence — the gating rules this lens obeys. https://www.utsubo.com/blog/threejs-best-practices-100-tips

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Pour-front-locked rack-focus grammar.** Bind `worldFocusDistance` to the *actual* metal pour-front shared uniform (not a curve offset) so focus literally chases the molten front as it fills the letters, with a principled rack-easing curve per act (dwell-sharp on the cast word, soft transit through channels) — the highest-leverage "it's photographed" detail.
2. **TSL / WebGPU depth-buffer DOF migration.** Move DOF to a node-graph tilt-shift/CoC from the depth buffer (per the WebGPU scanning-effect + r17x tilt-shift examples), with a WebGL `DepthOfField` fallback so the iOS coverage gap can't break the judge device. The documented future of this element.
3. **The descend-to-eye-level reveal as a named cinematic beat.** A reusable "monumental reveal" primitive coordinating path-drop + dolly-zoom + focus-rack on one `range` window, tunable in `?debug`, so any route finale (and the home finale) can fire it consistently — the `tune-pacing` skill's remit applied to the lens.
4. **Anamorphic forge-lens grade.** A subtle horizontal bokeh stretch + oval iris + warm flare streak on the white-hot pour-front (anamorphic cues) to push the cinematic read further, measured for cost against the iPhone-15 budget and kept on-brand (no rainbow flares — warm only).
