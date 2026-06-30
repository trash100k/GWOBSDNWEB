# 18 — Volumetric Lighting & God-Rays from the Metal

_Phase-1 graphics research · GAELWORX forge world · primary judge target iPhone 15 OLED_
_Author lane: senior real-time-graphics / technical art · all sources 2025–2026_

---

## 1. SCOPE

In the GAELWORX world this element is **the light the metal throws into the air**. Pure-void
darkness, lit only by the pour itself: the white-hot molten front, the cooling forge-red letterforms,
and — above all — the **A and E divine fire** that never cools. When that light meets the smoke,
ember-dust and heat-haze rising off the channels, it should resolve into **visible shafts** — soft,
warm god-rays fanning out from the bright cores, raking across the dark green-black Connemara basalt,
and a brighter, holier pair of beams from the A+E that read as sacred. This is the single biggest lever
for selling the lie that **the metal is the only light source in the room**: without volumetrics the
glow stops at the surface of the geometry; with them, the light has _body_, the void has _depth_, and
the chamber feels like a cathedral full of forge-smoke. It must stay subtle (atmosphere, not lens-flare
kitsch), share the master temperature/palette system, and never cost us the mobile frame budget.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four honest families for "shafts of light from a bright source through participating media"
on the web today. Ranked roughly cheap→expensive.

### 2a. Screen-space radial-blur god-rays (Mitchell / GPU-Gems-3 lineage)
The classic: render an **occlusion buffer** (light source bright, everything else black), then
**radial-blur it toward the light's screen position** along `samples` steps with `density`, `decay`,
`weight`, `exposure`, and additively composite over the lit scene. This is exactly what
`@react-three/postprocessing`'s `<GodRays>` does (params confirmed 2025: `samples 60`, `density 0.96`,
`decay 0.9`, `weight 0.4`, `exposure 0.6`, `clampMax`, `blur`, `kernelSize`). Andrew Berg's writeup and
the threejs-resources catalog both still document this as the default web approach.
- **Quality:** very good for _on-screen_ sources; the streaky "crepuscular" look is exactly the forge
  vibe. Looks volumetric without any 3D marching.
- **Perf:** cheap — one extra low-res pass; scales with `samples`. Downsample to ½-res and it's nearly
  free. **The canonical mobile-friendly pick.**
- **Mobile:** excellent.
- **Complexity:** low with the pmndrs effect; medium if you hand-roll the layers/occlusion split.
- **Hard limitation (verified, pmndrs maintainer):** _"if the source isn't on screen, there's nothing
  to blur."_ The `<GodRays>` effect blurs a rendered light mesh, so when the pour front scrolls off
  frame the rays vanish. For an always-present atmosphere you either keep a proxy light-mesh on screen,
  use a wide **cone** geometry as the source (the documented workaround — a cone never fully exits the
  frame), or move to the depth-blur variant.

### 2b. Layers + radial blur + selective bloom (hand-rolled occlusion)
A 2025-relevant variant (Sangil Lee, _Make the Sun Shine_, Jan 2025; thefrontdev layers tutorial): put
the emitters on a dedicated `THREE.Layers` channel, render that layer to an **occlusion target** (with
non-emitters swapped to a black material via `scene.traverse`), radial-blur it, and additively merge
with the main composer. This is the same math as 2a but gives **per-object control** over what emits
shafts — so we can make _only_ the molten front + A/E divine fire throw rays, and exclude the cooled
iron-black letters. Pairs naturally with the **selective-bloom** pattern we may already want for the
A/E (darken-non-bloom → bloom-pass → restore).
- **Quality:** high, art-directable. **Best match for "only the hot bits glow."**
- **Perf:** good (½-res occlusion target); the material-swap traverse is the only CPU cost.
- **Mobile:** good.
- **Complexity:** medium — manual composer wiring, two render targets, material bookkeeping.

### 2c. Raymarched screen-space volumetrics (the Maxime Heckel 2025 approach)
Maxime Heckel, _On Shaping Light_ (Jun 10 2025), is the definitive modern web reference: a
**post-processing pass that reconstructs world-space rays from the depth buffer** and **raymarches**
through a (cone/spot) light volume, accumulating in-scattering with **shadow-map occlusion**, **blue-noise
dithered step offsets** to kill banding at low step counts, and **downsampled (½-res) rendering** for
perf. Ameobea's `three-volumetric-pass` (pmndrs-`postprocessing`-compatible, `halfRes: true`) is a
drop-in cousin built on the same depth-buffer + n8programs godray code.
- **Quality:** highest — true depth-aware shafts that respect occluders, fade with distance, and exist
  even when the source is off-screen. This is the "AAA" tier.
- **Perf:** the heavy one — cost is `steps × pixels`; mitigated hard by ½-res + blue noise + early-out +
  low step count. Heckel/Ameobea both stress this.
- **Mobile:** _possible_ at ½-res / low steps, but this is where we burn the budget. Reserve for the
  `high` tier; never the baseline.
- **Complexity:** high — coordinate-space transforms (`getWorldPosition(uv, depth)` via
  `projectionMatrixInverse` + `viewMatrixInverse`), shadow sampling, dithering.

### 2d. WebGPU / TSL node volumetrics (forward-looking)
The 2025–2026 WebGPU stack (three.js `WebGPURenderer` post-processing with built-in MRT, node-composed
effect chains; Heckel's _Field Guide to TSL and WebGPU_; the active "Volumetric lighting in WebGPU"
three.js forum thread; Wawa Sensei's _How to Fake Godrays in Three.js (WebGPU + React)_ TSL tutorial)
lets you express the same radial-blur or raymarch as TSL nodes that compile to WGSL **and** WebGL.
- **Quality:** equal-or-better, with MRT making the occlusion/emissive split essentially free.
- **Perf:** promising but **device-gated** — WebGPU on iOS Safari is still uneven in 2026; not a safe
  primary path for the iPhone-15 judge read.
- **Verdict:** **do not ship as the base path.** Note it as the migration target; keep our effect
  authored so the GLSL maps cleanly to TSL later.

**Adjacent technique we'll fold in (not a god-ray, but sells the same lie): heat-haze.** Screen-space
UV-refraction distortion (three-fluid-fx's `SimpleDistortionPass` / Codrops glass-torus
`temporalDistortion`, both 2025–2026) bends the scene where hot air rises. It makes the shafts _shimmer_
and reads as heat. Cheap, and it's the difference between "glow" and "the air is on fire."

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship a hybrid built on 2a+2b, with the 2c raymarch reserved as the `high`-tier upgrade, plus a thin
heat-haze refraction on top.** Concretely:

1. **Base (all tiers): screen-space radial-blur god-rays from an occlusion buffer**, where the occluder
   set is **only the molten pour front + the A/E divine-fire cores** (technique 2b — layers/selective
   occlusion). This is the buildable, mobile-safe, art-directable core, and it dovetails with the
   `<Bloom>` already in `Effects.jsx`. The shafts are warm (ember→gold), the A/E pair brighter and
   whiter ("divine"). Use a **wide cone proxy** behind the bright cores so the rays survive the source
   drifting near frame edges (the documented off-screen fix).
2. **High tier only: swap the radial blur for the depth-buffer raymarch** (technique 2c, ½-res, low
   steps, blue-noise) so the shafts correctly occlude behind the basalt channel walls and the standing
   letterforms — the detail that makes it feel like a real volume of smoke, not a 2D overlay.
3. **All non-static tiers: a subtle heat-haze refraction pass** sampling an fbm/`gw_caustic` field
   driven by `uTemp`, so the shafts ripple where the air is hottest.
4. **`static`/reduced-motion tier: none of the above** — bake the look into the bloom + a faint static
   ramp gradient (consistent with `Effects` being unmounted when `quality==='static'`).

**Why this pick, tied to the world + constraints:**
- The brand law is "the metal is the only light." God-rays are the single strongest cue for a
  _single, embedded_ light source. Radial-blur god-rays specifically streak _from_ the bright pixels —
  perfectly literal here.
- We already reserve **HDR (>1) values for the 10% accent** (`PAL.hot`, `PAL.emberHot`) and already
  bloom only `luminanceThreshold 0.55`. God-rays consume the _same_ HDR cores as their source — zero
  new "what glows" decisions, total cohesion with `post-fx`.
- The **A/E-keeps-divine-fire-forever** rule maps 1:1 onto a brighter, whiter, slightly higher-density
  god-ray pair — the volumetrics _are_ how the A/E "radiate light onto adjacent stone" and make the
  Ogham readable. This element literally implements that piece of the brief.
- It honors the **single-renderer / no-second-Canvas / quality-tier / no-EXR** non-negotiables: it's a
  post pass inside the existing composer, gated by `useQuality`, needing no environment load.

---

## 4. IMPLEMENTATION

### 4a. Libraries / versions
- `@react-three/postprocessing` + `postprocessing` (already in `Effects.jsx`) — provides `<GodRays>`,
  `EffectComposer`, blend functions. Use the installed versions; `<GodRays>` API as documented 2025
  (`samples/density/decay/weight/exposure/clampMax/blur/kernelSize`).
- `three` (installed r17x). For the high-tier raymarch, either hand-roll a custom `Effect` subclass or
  vendor **`three-volumetric-pass`** (`halfRes: true`) — but prefer hand-rolled to keep palette/uniform
  control and avoid a dep that pulls its own depth logic.
- No new heavy deps. No EXR/HDR. Heat-haze is a tiny custom `Effect` (no fluid-sim dep needed — we drive
  it from `gw_fbm`).

### 4b. The emitter + occlusion split (base tier)
Put the hot cores on a bloom/godray layer and give the divine A/E their own brighter proxy.

```jsx
// scene/ForgeGodrays.jsx  (gated, mounted inside ForgeCanvas)
import { GodRays } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

// A wide, low-poly CONE proxy sits behind each bright core. Cone (not sphere) so the
// source never fully leaves frame => rays don't pop out (documented pmndrs workaround).
// Mesh must be transparent + not write depth (GodRays requirement).
function RayProxy({ refOut, color, position, scale }) {
  return (
    <mesh ref={refOut} position={position} scale={scale} frustumCulled={false}>
      <coneGeometry args={[1, 2.2, 24, 1, true]} />
      <meshBasicMaterial color={color} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}
```

Then two `<GodRays>` effects in the composer chain (Screen blend), tuned warm vs divine:

```jsx
// inside <EffectComposer> in Effects.jsx, AFTER <Bloom>, BEFORE the grade:
{rays && (
  <GodRays sun={pourRef}  // the molten-front proxy
    blendFunction={BlendFunction.SCREEN}
    samples={high ? 60 : 30} density={0.92} decay={0.92}
    weight={high ? 0.5 : 0.38} exposure={0.42}
    clampMax={0.92} blur kernelSize={KernelSize.SMALL} />
)}
{rays && (
  <GodRays sun={divineRef}  // the A/E divine-fire proxy — brighter, whiter, tighter
    blendFunction={BlendFunction.SCREEN}
    samples={high ? 60 : 30} density={0.96} decay={0.9}
    weight={high ? 0.62 : 0.46} exposure={0.55}
    clampMax={1.0} blur kernelSize={KernelSize.SMALL} />
)}
```

> Two `<GodRays>` passes are acceptable on `high`; on `low`, **merge to one** proxy that contains both
> cores to save a pass. `static`: render neither (composer not mounted there anyway).

### 4c. High-tier raymarch core (GLSL pseudocode)
A custom `Effect` whose fragment shader reconstructs the ray and marches. Reuses `gw_fbm` from
`shaders.js` for the in-scatter texture and a blue-noise offset to dither.

```glsl
// reconstruct world ray from depth (Heckel 2025)
vec3 worldPos(vec2 uv, float depth){
  vec4 clip = vec4(uv*2.0-1.0, depth*2.0-1.0, 1.0);
  vec4 view = uProjInv * clip;
  vec4 wp   = uViewInv * view;
  return wp.xyz / wp.w;
}
void mainImage(const in vec4 c, const in vec2 uv, out vec4 outColor){
  float depth = texture2D(depthBuffer, uv).x;
  vec3  endP  = worldPos(uv, depth);
  vec3  ro    = uCamPos;
  vec3  rd    = normalize(endP - ro);
  float tMax  = min(distance(ro, endP), uMaxDist);
  float dither = blueNoise(uv * uNoiseScale + uTime); // breaks banding
  float t = dither * uStepSize;
  float scatter = 0.0;
  for(int i=0;i<STEPS;i++){          // STEPS: 24 high / 12 low
    vec3 p = ro + rd * t;
    // distance to each hot core => spot in-scattering, * shadow term
    float toCore = length(p - uCorePos);
    float fall   = exp(-toCore * uDensity);
    float shad   = shadowSample(p);  // letterforms/basalt occlude the smoke
    float smoke  = 0.5 + 0.5 * gw_fbm(p.xy * uHazeScale + uTime * 0.05);
    scatter += fall * shad * smoke * uStepSize;
    t += uStepSize;
    if(t > tMax) break;              // early-out
  }
  vec3 rayCol = mix(${"${v3(PAL.ember)}"}, ${"${v3(PAL.hot)}"}, uDivine); // warm vs divine
  outColor = vec4(c.rgb + rayCol * scatter * uIntensity, c.a);
}
```

### 4d. Heat-haze refraction (all non-static tiers)
A trivial custom `Effect` that warps the input UV by an fbm field gated to the hot lower band:

```glsl
uniform float uTemp; uniform float uTime; uniform sampler2D inputBuffer;
void mainImage(const in vec4 c, const in vec2 uv, out vec4 o){
  float heat = uTemp * smoothstep(0.55, 0.0, uv.y);     // rises from the pour line
  vec2 warp = vec2(
    gw_fbm(uv*14.0 + vec2(0.0, uTime*0.6)),
    gw_fbm(uv*14.0 + vec2(7.0, uTime*0.5))) - 0.5;
  o = texture2D(inputBuffer, uv + warp * 0.006 * heat); // <= keep tiny; text stays legible
}
```

### 4e. Key uniforms & the master-temperature hook
Drive everything from the shared store in the existing `useFrame`, **dt-damped** (never raw `lerp`):

| Uniform | Source | Meaning |
|---|---|---|
| `uIntensity` / `weight` | `damp` of `sceneFor(forge.route)` + `forge.scrollDamped` | overall shaft strength per route/scroll |
| `uTemp` | the slab's existing `uTemp` (`scrollDamped + vel*0.25`) | hotter scroll → brighter rays + more haze |
| `uDivine` (A/E pass) | constant `1.0`, never cools | the divine-fire pair stays white-gold forever |
| `uSurge` | the slab's `uSurge` (strike, `exp(-since*3)`) | rays flare on a headline/strike, same pulse |
| proxy `position` | follows the pour-front X (left→right fill) | shafts track the moving molten front |
| `uTime` | frozen to constant when `quality==='static'` | matches the slab/Embers freeze pattern |

The single most important cohesion move: **the god-ray source color and intensity are read from the
exact same `uTemp` / `PAL.hot` / `uSurge` that already drive the slab veins.** One temperature, many
surfaces.

### 4f. r3f component shape
- `scene/ForgeGodrays.jsx` — the proxy meshes (pour-front cone + A/E cone), gated by `forge.route`,
  position damped to the pour-front, `dispose()` on unmount.
- Extend `scene/Effects.jsx` — add the two `<GodRays>` (base) / swap-in raymarch `Effect` (high) and
  the heat-haze `Effect`, all behind a `const rays = quality !== 'static'` (and the raymarch behind
  `high`). Keep chain order: **Bloom → GodRays → HeatHaze → ChromaticAberration → HueSaturation →
  BrightnessContrast → Vignette → Noise → SMAA.** (God-rays before the grade so crushed-blacks/vignette
  still bite the shafts.)

---

## 5. COHESION

- **Palette:** shafts are authored only in `PAL.ember` → `PAL.hot` (warm pour) and a whiter biased
  `PAL.hot`/`PAL.gold` for the A/E. No cool/green/blue cast (brand). The green-black basalt is the
  _surface the rays rake across_, never a ray color.
- **Bloom symbiosis:** god-rays feed off the same HDR (>1) cores `<Bloom luminanceThreshold=0.55>`
  already isolates. We push the molten/A-E emissive above 1 in the slab shader (per `shader-fx`) and
  **both** bloom and god-rays consume it — they can't disagree about "what's hot."
- **Master temperature:** `uTemp`/`uSurge`/`scrollDamped` are shared verbatim with `ObsidianSlab`, so a
  scroll that runs the veins hotter _also_ brightens the shafts and the haze. Cooling letterforms emit
  weaker rays as they darken toward iron-black; the A/E **never** cool because `uDivine` is pinned to 1.
- **Sparks/embers:** `Embers.jsx` rises in the same warm additive color (`1.0, 0.45, 0.12`) the shafts
  use — embers become the literal "dust" the light scatters through, so the two effects look causally
  linked (sparks _in_ the beams).
- **Channels/letterforms:** the high-tier raymarch's shadow term uses the same geometry that forms the
  channels and Cinzel letterforms, so shafts are correctly occluded by the world — they belong _in_ the
  room, not painted over it.
- **Motion law:** shaft intensity follows **Atmospheric Drift** (slow `uTime` constant velocity) +
  **Brutalist Snap** flare on `uSurge` (0ms, `exp` decay, no bounce) — exactly the existing motion
  vocabulary.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Tier gating (mandatory, mirrors `Effects`/`ForgeCanvas`):**
  - `static` (reduced-motion / low-power): **no god-ray pass at all.** Look is carried by bloom + a
    baked faint ramp. Frameloop already `demand`.
  - `low`: **single** merged `<GodRays>` proxy, `samples 30`, `blur` on, `kernelSize.SMALL`, heat-haze
    at half strength. No raymarch.
  - `high`: two `<GodRays>` (or the ½-res raymarch), `samples 60`, full heat-haze, SMAA.
- **Resolution:** god-rays/raymarch render targets at **½-res** (Mitchell's own recommendation; Heckel
  & Ameobea `halfRes:true`). The radial blur hides the upscale. This is the biggest single win.
- **Step budget (raymarch):** 24 steps `high` / 12 `low`, **blue-noise dithered** so low step counts
  don't band, **early-out** when `t > tMax` or scatter saturates. Cost is `steps × halfRes pixels`.
- **Pass count:** prefer **one** god-ray pass on mobile (merge pour + A/E into one proxy); two only on
  `high`. Each `<GodRays>` is its own render target — passes are the cost, not pixels.
- **Heat-haze:** single full-screen UV warp, ~no cost; keep displacement `<= 0.006` so text stays
  legible (three-fluid-fx's own warning: "keep distortion below the threshold where text becomes
  unreadable").
- **Fallbacks:** `CanvasBoundary` static poster on WebGL failure already covers the worst case. If FPS
  sags, the first lever is `samples`, then drop the second pass, then drop to `low` tier.
- **AdaptiveDpr** is already on — it'll shed god-ray cost under load along with everything else.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder):**
1. **Slab emissive first.** Confirm the molten front + A/E cores actually exceed HDR 1.0 (they must, or
   neither bloom nor god-rays have anything to seed). Verify via the existing `<Bloom>` catching them.
2. **One `<GodRays>`, one proxy, default params, on screen.** Get a single warm shaft fan working before
   anything fancy. Confirm it composites _after_ Bloom and _before_ the grade.
3. **Cone proxy + edge behavior.** Scroll/drift the source toward the frame edge and confirm rays don't
   pop (this is where the sphere-vs-cone choice pays off).
4. **A/E divine pass** with `uDivine`-biased whiter color, brighter/tighter. Only now is the "sacred"
   read achievable.
5. **Heat-haze last of the cheap layer** — tiny displacement, gated to the lower hot band, legibility-checked.
6. **High-tier raymarch only after 1–5 read right** at base tier, and only if the device has headroom.

**Specific pitfalls (each cost someone a day):**
- **Off-screen source = no rays.** The `<GodRays>` effect blurs an _on-screen_ mesh; if the pour drifts
  off frame the effect dies. Use the cone proxy / keep a core on screen. (Confirmed by pmndrs
  maintainer, 2022 → still true in the 2025 effect.)
- **Source mesh must be `transparent` + `depthWrite:false`** or the god-ray pass misreads it. Documented
  requirement.
- **Banding** in the raymarch from low steps → **blue-noise dither the start offset** (Heckel). Don't
  fix it by raising steps (kills mobile).
- **Washed-out frame** from stacking god-rays on top of an already-bright bloom. God-rays are
  _additive/Screen_ — keep `exposure`/`weight` low and lean on the **crushed-black grade**
  (`BrightnessContrast brightness -0.04 contrast 0.16`) to keep the void true-black on OLED. Don't crank
  god-rays to compensate for weak emissive — fix the emissive (same rule as bloom in `post-fx`).
- **Heat-haze eating text legibility** — clamp displacement `<= ~0.006`, gate to the hot band, never
  over UI chrome.
- **Frame-rate-dependent animation** — drive all uniforms via `THREE.MathUtils.damp(cur,tgt,λ,dt)`, never
  `lerp(a,b,k)`; freeze `uTime` on `static` (match `ObsidianSlab.jsx:144`, `Embers.jsx:67`).
- **Forgetting disposal** — `useEffect(() => () => { geo.dispose(); mat.dispose() }, [])` on the proxies.
- **Verify the cheap way:** `npm run build` green, then `qa-route` @ 393×852 + 1440×900, **0 console
  errors** (SwiftShader compiles the GLSL → a shader typo throws here). Then the real read on the
  iPhone 15 — shaft spread, true-black, and OLED saturation **do not** simulate headless.

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — _On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
   Raymarching for the Web_ — **2025-06-10**.
   https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
2. Sangil Lee — _Make the Sun Shine_ (selective bloom + layers occlusion in Three.js) — **2025-01-28**.
   https://sangillee.com/2025-01-28-selective-bloom-effect/
3. Wawa Sensei — _How to Fake Godrays in Three.js (WebGPU + React + TSL)_ — 2025 (referenced in 2025
   WebGPU/TSL search lane). https://wawasensei.dev/tuto/how-to-build-godrays
4. Codrops / Matt Park — _Playing with Light and Refraction in Three.js: Warping 3D Text Inside a Glass
   Torus_ (heat-distortion via `distortion`/`temporalDistortion`) — **2025-03-13**.
   https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
5. Oxign — _three-fluid-fx_ (screen distortion / heat-haze passes, GLSL + TSL) — repo updated
   **2026-05-26**. https://github.com/Oxign/three-fluid-fx · tutorials:
   https://three-fluid-fx.artcreativecode.com/tutorials/glsl/full/distortion/
6. three.js docs — _WebGPU Post-Processing_ (MRT, node-composed effect chain; the TSL migration target)
   — current 2025/2026 manual. https://github.com/mrdoob/three.js/blob/740dd76c/manual/en/webgpu-postprocessing.html
7. pmndrs — _React Postprocessing: GodRays_ effect reference (params confirmed current) — accessed 2026.
   https://react-postprocessing.docs.pmnd.rs/effects/god-rays
8. Ameobea — _three-volumetric-pass_ (raymarched screen-space volumetrics, pmndrs-compatible, `halfRes`)
   — maintained, referenced across 2025 volumetric lanes. https://github.com/Ameobea/three-volumetric-pass
9. three.js forum — _Volumetric lighting in WebGPU_ (active 2025 showcase thread on WebGPU
   atmospheric-scattering + noise-dithered sampling).
   https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959
10. _Three good godrays_ catalog entry (screen-space godrays for three.js) — Three.js Resources, 2025.
    https://threejsresources.com/tool/three-good-godrays

_(Foundational math — Mitchell, GPU Gems 3 "Volumetric Light Scattering as a Post-Process," and Iqual
Quilez clouds/SDF references — predate 2025 and are cited here only via the 2025–2026 articles above
that re-derive them, per the recency requirement.)_

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Depth-aware raymarched shafts with correct occlusion by letterforms & channel walls** — full build
   of the technique-2c pass (world-ray reconstruction, shadow sampling against the Cinzel letter
   geometry + basalt channels, blue-noise dithering, ½-res upscale). The piece that turns "glow" into "a
   room full of lit smoke."
2. **The A/E divine-fire light rig** — how the never-cooling A/E shafts physically illuminate adjacent
   basalt and make the carved Ogham readable: a small projected light + a brighter dedicated god-ray
   pass + an Ogham reveal mask keyed to ray intensity. This is a brand-critical, world-defining beat.
3. **Spark/ember ↔ god-ray coupling (dust-in-the-beam)** — making `Embers` particles brighten when
   inside a shaft (sampling shaft intensity per-particle) so the volumetrics and the orbiting sparks
   read as one causal system, not two stacked effects.
4. **WebGPU/TSL migration of the volumetric chain** — porting the radial-blur + raymarch to TSL nodes
   with MRT-driven emissive/occlusion split, behind a renderer-capability gate, so the high tier can use
   WebGPU where available while WebGL stays the iPhone-safe baseline.
