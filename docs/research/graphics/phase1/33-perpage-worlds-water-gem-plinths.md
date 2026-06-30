# 33 — Per-Page Chamber Worlds: Water · Gem · Plinths · Arch

> Research doc · Phase 1 · GAELWORX forge world
> Topic: bespoke per-route scenes that share ONE master temperature/material/noise/lighting system.
> Focus elements: scrying-**POOL** (Voice) · jewel-chamber **GEM** dispersion (Web) · four forged casts on **PLINTHS** (Work) · forge-mouth **ARCH** (Contact).

---

## 1. SCOPE

GAELWORX is a single-renderer, route-swapped forge world. Today `src/scene/scenes.js` re-tempers ONE obsidian slab per route — different `veinScale`, `veinGlow`, `irid`, and camera framing — so every page is a re-lit view of the same hero. That is the cheap, safe spine and it must stay. This doc covers the next tier: **four routes that earn a bespoke 3D object on top of the shared slab**, each reading as a distinct *chamber* while still being unmistakably the same molten world.

The four chambers, mapped to existing routes in `SCENES`:

| Chamber | Route | Bespoke element | Signature read |
|---|---|---|---|
| **Scrying-pool** | `/voice` | Still water plane, sine-ripple surface, sub-surface ember glow | calm, listening, a dark mirror with fire under it |
| **Jewel-chamber** | `/web` | Evolving `FacetedJewel` with true *dispersion* (RGB split) | vivid, prismatic, the "vivid color read" payoff on OLED |
| **Four-plinths** | `/work` | Four forged casts on stone plinths, lit per-plinth | a gallery of cooled artifacts, gallery lighting |
| **Forge-mouth arch** | `/contact` | A stone arch framing the white-hot forge mouth | the threshold — heat pours toward the viewer |

The hard rule that makes this a *world* and not four demos: **every chamber binds to the same shared uniforms** the slab already drives — `uTime`, a heat scalar (`forge.scrollVel` + the strike pulse), the `PAL` palette, and the same `gw_fbm`/`gw_caustic` noise from `shaders.js`. A jewel that disperses light, a pool that ripples, and an arch that radiates heat all read the *same* temperature signal, so cooling, surging on a strike, and the idle breath happen everywhere at once. Nothing is bolted on; everything is the forge seen through a different aperture.

The `FacetedJewel` and `gem.js` builder already exist (currently only the hero option) — so the gem chamber is a refinement, not a green-field build. The pool, plinths and arch are new geometry + materials that reuse the existing shader-injection pattern (`onBeforeCompile` chunk replacement) verbatim.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 Scrying-pool water

**(a) Three.js classic `Water` / drei-style normal-map flow.** The `nhtoby311/WaterSurface` R3F component (TypeScript, built on three's `Water`/`Water2`) ships `WaterSurfaceSimple` (single normal map) and `WaterSurfaceComplex` (dual normal-map flow) with bolt-on `RippleFX` / `FluidFX`. It is *planar reflection*, which its own README flags as "expensive in medium and complex scene." Great look, wrong cost model for a mobile-first OLED build that already spends its budget on the slab + bloom.

**(b) Procedural sine/Gerstner vertex displacement + custom fragment.** The canonical modern path, covered by the Codrops *"Creating Stylized Water Effects with React Three Fiber"* (Mar 2025) and Wawa Sensei's water-shader lesson: a subdivided `PlaneGeometry`, vertex shader sums a few sine (or Gerstner) waves into `position.y`, recompute analytic normals, then a fragment that mixes a deep color and a shallow color by a Fresnel term, with foam from `smoothstep` on wave height. No render targets, no second camera. Cheapest realistic option; perfect for a *still* pool with low-amplitude ripples.

**(c) Caustics / sub-surface via raymarch or FBO.** Maxime Heckel's *"Shining a light on Caustics"* (and the 2025 *Field Guide to TSL and WebGPU*) simulate refracted rays into a caustic plane — gorgeous, but it is a second-pass technique aimed at light *projected onto* a floor, not a sub-surface glow under a mirror. Overkill here.

**(d) Screen-space depth/refraction via FBO.** Render the scene to a render target, sample it offset by the surface normal for refraction, blend by depth for the deep-water gradient. This is the "real water" path (binaryage/Maxime FBO refraction). Costs a full extra scene render — out of budget on iPhone.

**Verdict for GAELWORX:** (b) procedural sine surface, *plus* a fake sub-surface ember glow done entirely in the fragment shader (no FBO) — the pool is a dark mirror with fire breathing *under* it, not refractive caustics.

### 2.2 Jewel-chamber dispersion

**(a) drei `MeshTransmissionMaterial`.** Layers a custom shader over `MeshPhysicalMaterial`; exposes `chromaticAberration` (default 0.03, "color splitting" as it approaches 1.0), `anisotropicBlur`, `samples`, `thickness`, `ior`, `distortion`. It renders the *backside* to an internal buffer so the gem "sees" what's behind it. Beautiful true transmission/dispersion (Codrops *glass torus*, Mar 2025) — but it is genuinely heavy: each transmissive object does an extra buffer render at `samples` count, and it fights with a `powerPreference:'high-performance'` mobile budget.

**(b) Manual backface-FBO dispersion (3-tap RGB).** Render the gem's backfaces to an FBO, then in the front pass refract along the normal three times with three slightly different IORs (R/G/B), sampling the FBO each time. The textbook "Pinterest cube / glass torus" technique (multiple 2025 write-ups). Full control, still two passes.

**(c) Fake dispersion in a single pass (no FBO).** Drive an iridescent/chromatic flash off Fresnel + a `cos`-palette rainbow, modulated by view angle and the heat uniform. This is exactly what `FacetedJewel.jsx` already does (`gwOpal`, `gwFres`, `gwFire`). It is *not* physically refractive but on a near-black flat-shaded gem on OLED it reads as dispersion at zero extra passes.

**(d) WebGPU + TSL dispersion.** TSL (Three Shading Language) is renderer-agnostic, compiles to WGSL/WebGPU and GLSL/WebGL, and ships a `chromaticAberration` node; Maxime Heckel's *Field Guide to TSL and WebGPU* (2025) and Loopspeed's R3F+WebGPU+TSL guide (2025) show glass/dispersion `Fn()` materials. This is the future-proof path, but WebGPU on iOS Safari is still gated/inconsistent in 2025–26, and adopting `WebGPURenderer` means re-plumbing the whole single-renderer canvas. Not for this build's first pass.

**Verdict:** keep the **single-pass fake dispersion** as the baseline (current `FacetedJewel`), and *upgrade only the `/web` high tier* to a **3-tap RGB chromatic offset on the edges** — no full FBO, just split the existing `gwOpal`/`gwFire` contribution into three view-angle-offset samples. True `MeshTransmissionMaterial` stays off mobile entirely.

### 2.3 Four-plinths

This is a *staging* problem, not a shader problem. The forged casts can be the existing `buildGem` output (or simple extruded letterforms) on stone plinths; the craft is in **lighting and shadow**. Codrops *"Building Efficient Three.js Scenes"* (Feb 2025) and the drei `Lightformer`/`AccumulativeShadows`/`SpotLight` docs are the lane: one warm key per plinth via `Lightformer` rects (already the file-free env pattern in `ForgeCanvas.jsx`), volumetric `SpotLight` cones for "gallery" pools of light, and baked-ish contact shadows. The trap is dynamic shadow maps (4 lights × shadow = budget death on mobile) — use a single cheap `ContactShadows` plane or fake AO instead.

### 2.4 Forge-mouth arch

A modeled (or `LatheGeometry`/`ExtrudeGeometry`) stone arch with the *inside* of the arch being the white-hot forge mouth: a billboarded radial gradient + heat-shimmer (UV distortion by `gw_fbm`) + bloom. Technique-wise it is the slab's emissive vein system pointed at the camera through an aperture, plus the shared `Embers` pouring through. No new technique — it is a *composition* of systems already in the repo.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

Build a thin per-route layer: each chamber is an optional component mounted by `ForgeCanvas` when `forge.route` matches, rendered *in front of* the shared slab, sharing the master uniforms. The slab never goes away — it is the back wall of every chamber.

1. **Pool (`/voice`)** — `PlaneGeometry(14, 8, 96, 56)` laid flat (`rotation.x = -Math.PI/2`), `MeshPhysicalMaterial` (`roughness ~0.04`, `metalness 0`, `envMapIntensity` from the existing cool env so it mirrors), shader-injected: vertex adds 3 summed sines for *low* amplitude ripples + analytic normal; fragment mixes `PAL.void` (deep) → faint `PAL.crimsonDeep` by a sub-surface mask, adds an **ember glow from below** = `gw_fbm` blob pulsed by the heat uniform, and a Fresnel mirror sheen. No FBO. This is technique 2.1(b)+fake-SSS.

2. **Gem (`/web`)** — keep `FacetedJewel` as-is for `low`/`static`; on `high`, swap the single `gwOpal` add for a **3-tap chromatic edge split** (R/G/B Fresnel offsets) so cut edges throw a rainbow. Tie split width to `uHeat` so a strike flares the dispersion. Technique 2.2(c)→(b-lite).

3. **Plinths (`/work`)** — four `buildGem` casts (varied `sides`) on thin `BoxGeometry` plinths in a row; one `Lightformer` warm rect per plinth + a single shared `ContactShadows`. Cooling gradient per cast keyed off `uHeat` and a per-cast phase offset (so they cool out of sync). Technique 2.3.

4. **Arch (`/contact`)** — `ExtrudeGeometry` arch (or two `LatheGeometry` legs + ring) of dark basalt material reusing the slab's vein shader at low glow; a billboarded plane *inside* the arch with the white-hot mouth (radial gradient × `gw_fbm` shimmer, `toneMapped={false}`, additive); `Embers` repositioned to pour through the mouth toward camera. Technique 2.4.

**Why this pick:** it reuses every existing system (`onBeforeCompile` injection, `GLSL_NOISE`, `PAL`, the heat signal, `Embers`, the cool `Environment`), adds zero render passes on mobile, and keeps the single renderer / single canvas rule from the `forge-scene` skill. Each chamber is "the forge through a different aperture," which is exactly the cohesion mandate.

---

## 4. IMPLEMENTATION

### 4.1 Libs / versions (already in repo — do not add heavy deps)

- `three` r17x (current), `@react-three/fiber`, `@react-three/drei` (for `Lightformer`, `ContactShadows`, optionally `MeshTransmissionMaterial` on desktop only), `@react-three/postprocessing` (existing `Effects`).
- **No new runtime asset loads** (no EXR, no normal-map JPEGs for the pool — go procedural). This avoids the `WaterSurface` planar-reflection cost *and* the EXR ban.
- WebGPU/TSL: **note as a future migration only**; do not introduce `WebGPURenderer` now.

### 4.2 Shared heat hook (the master temperature system)

Every chamber gets the same `uHeat` the jewel already computes. Extract it once so all four use identical math:

```js
// src/scene/useForgeHeat.js  (shared by every chamber)
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { forge, damp } from '../store.js'
const clamp = (x,a,b)=>Math.min(Math.max(x,a),b)
export function useForgeHeat() {
  const uHeat = useRef({ value: 0 })
  useFrame((_, dt) => {
    const since = performance.now()/1000 - forge.strikeAt
    const pulse = since >= 0 && since < 1.2 ? Math.exp(-since*3)*0.5 : 0
    const heat = clamp(Math.min(forge.scrollVel*0.6, 0.7) + pulse, 0, 1)
    uHeat.current.value = damp(uHeat.current.value, heat, 6, dt)
  })
  return uHeat   // pass uHeat.current into shader.uniforms.uHeat
}
```

This is byte-for-byte the signal in `FacetedJewel.jsx` lines 83–86 — promote it so the pool, plinths and arch surge on the *same* strike and cool on the *same* curve.

### 4.3 Pool — vertex ripples + fake sub-surface ember (GLSL)

```glsl
// VERTEX injection (replace <begin_vertex>)
uniform float uTime; uniform float uHeat;
float gwWave(vec2 p){
  float h = 0.0;
  h += sin(p.x*1.3 + uTime*0.6) * 0.045;
  h += sin(p.y*1.7 - uTime*0.5) * 0.035;
  h += sin((p.x+p.y)*2.1 + uTime*0.9) * 0.020; // ripple detail
  return h * (0.6 + 0.4*uHeat);                 // hotter = more agitated
}
vec3 transformed = position;
float e = 0.05;
float h  = gwWave(position.xz);
transformed.y += h;
// analytic normal from finite differences (no normal map, no FBO)
float hx = gwWave(position.xz + vec2(e,0.0));
float hz = gwWave(position.xz + vec2(0.0,e));
vec3 gwN = normalize(vec3(h-hx, e, h-hz));
```

```glsl
// FRAGMENT injection (before <tonemapping_fragment>), reuses GLSL_NOISE
float gwFres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)),0.0,1.0), 3.0);
// sub-surface ember: slow fbm blob, RISING glow from "below", pulsed by heat
float gwGlow = pow(clamp(gw_fbm(vUv*2.4 + vec2(0.0, uTime*0.06)), 0.0, 1.0), 1.5);
vec3 deep    = mix(${'`${v3(PAL.void)}`'}, ${'`${v3(PAL.crimsonDeep)}`'}, gwGlow);
vec3 sub     = ${'`${v3(PAL.ember)}`'} * gwGlow * (0.15 + 0.85*uHeat);  // the fire UNDER the mirror
gl_FragColor.rgb = mix(deep, gl_FragColor.rgb, gwFres);   // Fresnel mirror sheen on top
gl_FragColor.rgb += sub * (1.0 - gwFres);                  // glow strongest where we see INTO the water
```

r3f component shape:

```jsx
function ScryingPool() {
  const uHeat = useForgeHeat()
  const uniforms = useMemo(() => ({ uTime:{value:0}, uHeat:uHeat.current }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color:'#04050a', roughness:0.04,
      metalness:0, envMapIntensity:1.2, clearcoat:1, clearcoatRoughness:0.06 })
    m.defines = { USE_UV:'' }
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, uniforms)
      s.vertexShader = s.vertexShader
        .replace('#include <common>', `#include <common>\n${HEAD_V}`)
        .replace('#include <begin_vertex>', VERT)
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uHeat;uniform float uTime;\n${GLSL_NOISE}`)
        .replace('#include <tonemapping_fragment>', `${FRAG}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])
  useFrame((s)=>{ uniforms.uTime.value = forge.quality==='static' ? 2 : s.clock.elapsedTime })
  useEffect(()=>()=>material.dispose(), [material])
  return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.6,0]} material={material}
               geometry={useMemo(()=>new THREE.PlaneGeometry(14,8,96,56),[])} />
}
```

**Key uniforms:** `uTime`, `uHeat`. Wave amplitudes (0.02–0.045) keep it a *still* pool. `static` tier freezes time at 2.0 and zeroes amplitude effectively via `uHeat≈0`.

### 4.4 Gem — high-tier 3-tap chromatic edge split

Replace the single opal add in `FacetedJewel`'s `COLOR` chunk with a heat-driven RGB Fresnel split (only compiled on `high`):

```glsl
// uHeat-driven dispersion width; sample the opal cos-palette at 3 offset Fresnels
float d = 0.06 + uHeat * 0.10;                 // split widens with heat (a strike flares it)
float fR = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)),0.0,1.0), 2.4 - d);
float fB = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)),0.0,1.0), 2.4 + d);
float r = (0.5 + 0.5*cos(6.2831*(fR*1.5 + uHeat*0.3 + 0.00))).x;
float g = (0.5 + 0.5*cos(6.2831*(gwFres*1.5 + uHeat*0.3 + 0.33))).x;
float b = (0.5 + 0.5*cos(6.2831*(fB*1.5 + uHeat*0.3 + 0.67))).x;
vec3 gwDisp = vec3(r,g,b);
gl_FragColor.rgb += gwDisp * gwFres * (0.10 + uHeat*0.55);
```

This is a near-drop-in for the existing chunk (lines 22–25 of `FacetedJewel.jsx`); the low/static path keeps the cheaper single `gwOpal`. No FBO, no transmission.

### 4.5 Plinths — staging

```jsx
const CASTS = [12, 8, 16, 10]   // varied facet counts
<group position={[0,-1.2,0]}>
  {CASTS.map((sides,i)=>{
    const x = (i-1.5)*1.9
    return <group key={i} position={[x,0,0]}>
      <mesh geometry={useMemo(()=>new THREE.BoxGeometry(1.1,1.6,1.1),[])}
            position={[0,-0.8,0]} material={basaltMat /* slab vein shader, low glow */} />
      <ForgeCast sides={sides} phase={i*1.7} />   {/* buildGem + heat material, per-cast cooling phase */}
      <Lightformer form="rect" intensity={2.0} color="#e8eef8"
        position={[x*0.4, 2.2, 2.5]} scale={[1.4,2.2,1]} />
    </group>
  })}
  <ContactShadows position={[0,-2.0,0]} opacity={0.6} blur={2.5} far={4} resolution={512} frames={1} />
</group>
```

Per-cast cooling: in the cast's material, `uTemp = clamp(uHeat - i*0.12 + 0.5*sin(uTime*0.3 + phase), 0, 1)` → casts glow and cool out of phase, like a row of pieces pulled from the fire at different times. `frames={1}` bakes the contact shadow once (no per-frame shadow cost).

### 4.6 Arch — forge-mouth

```jsx
<group position={[0,-0.4,-1]}>
  <mesh geometry={archGeo /* ExtrudeGeometry: outer arch minus inner arch */}
        material={basaltMat} />
  {/* white-hot mouth: billboarded radial gradient × fbm shimmer, additive, unbloomed-safe */}
  <mesh position={[0,0.2,-0.4]}>
    <planeGeometry args={[3.2, 4.0]} />
    <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending}
      uniforms={mouthUniforms} vertexShader={MOUTH_V} fragmentShader={MOUTH_F} toneMapped={false}/>
  </mesh>
  <Embers count={quality==='high'?260:140} />  {/* re-aimed to pour through the mouth */}
</group>
```

```glsl
// MOUTH_F — heat shimmer + radial white-gold core, reuses gw_fbm
float r = length(vUv - 0.5);
float shimmer = gw_fbm(vUv*6.0 + vec2(0.0, -uTime*0.4)) * 0.15;   // air distortion / rising heat
float core = smoothstep(0.6, 0.0, r + shimmer);
vec3 hot = mix(${'`${v3(PAL.ember)}`'}, vec3(1.9,1.5,0.9), core);   // ember -> white-gold center (HDR -> blooms)
gl_FragColor = vec4(hot * core * (0.6 + 0.4*uHeat), core);
```

The HDR center (`>1`) is what the existing `Bloom` (`luminanceThreshold 0.55`) latches onto — so the arch mouth blooms with the same finish as the veins. No new post FX.

---

## 5. COHESION

- **Palette:** every chamber inlines `PAL` via `v3()` — `void`/`crimsonDeep` for mass, `ember`/`hot` for fire. No chamber introduces a color outside `palette.js`. The gem's rainbow is a *cos-palette* riding the existing opal, not arbitrary hues.
- **Noise:** all four reuse `GLSL_NOISE` (`gw_fbm`, `gw_caustic`) from `shaders.js` — same grain across pool ripples, mouth shimmer, sub-surface blob, so textures rhyme.
- **Heat:** all four bind the *same* `uHeat` (§4.2), which is the same `scrollVel + strike pulse` the slab and jewel already use. A headline strike (`forge.strikeAt`) surges the slab veins, flares the gem dispersion, agitates the pool, and brightens the arch mouth *in the same frame*. That synchrony is the cohesion proof.
- **Lighting/env:** chambers reuse the file-free cool `Environment` lightformers from `ForgeCanvas.jsx` for reflections (pool mirror, gem facets), so reflections read consistent. Plinth keys are warm `Lightformer` rects matching the forge tone.
- **Camera:** `scenes.js` already orbits/dollies per route (`camZ`,`rotY`,`rotX`); tune those per chamber (pool wants a low grazing angle for the mirror; plinths want a slight high three-quarter; arch wants a head-on approach). The chamber object sits where the slab is, so `CameraRig` framing carries over with no new rig.
- **Post:** the single `EffectComposer` (bloom + grade + vignette + grain) finishes every chamber identically. Chambers must emit HDR (>1) only where they want bloom (mouth core, gem hot edges, vein cores) — the `post-fx` "only HDR blooms" rule.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The budget is already spent on: one slab (transmission only on `high`), `Effects` (bloom + CA on `high`, SMAA on `high`), `Embers`. Each chamber must add **≤1 mesh + 0 extra passes** on mobile.

| Chamber | high tier | low tier | static tier |
|---|---|---|---|
| Pool | 96×56 plane, 3-sine vertex, fake SSS | 64×40 plane, 2-sine | frozen surface (`uTime=2`, flat normals) |
| Gem | 3-tap chromatic split + edges | single `gwOpal` (current) | single opal, no auto-spin |
| Plinths | 4 casts + 4 lightformers + 1 ContactShadows(`frames=1`) | 4 casts, 2 lightformers, no shadow | static casts, baked shadow image-free |
| Arch | extruded arch + additive mouth + 260 embers | simpler arch + mouth + 140 embers | mouth still, embers off |

Rules:
- **No FBO / no second scene render on any tier.** That kills the planar-reflection `WaterSurface` path and full `MeshTransmissionMaterial` on mobile. `MeshTransmissionMaterial` may be gated to `quality==='high' && !isMobile` for `/web` desktop only — otherwise the single-pass fake dispersion.
- **No dynamic shadow maps.** `ContactShadows frames={1}` bakes once; plinth keys are unshadowed lightformers.
- **DPR** stays governed by `ForgeCanvas` (`[1,2]` high, `1` static) + `AdaptiveDpr`. Vertex-heavy plane uses a coarser segment count on low.
- **Dispose on unmount** (existing `useEffect(()=>()=>...dispose(),[])` pattern) — chambers mount/unmount on route change, so geometry + materials MUST dispose or the single context leaks (the `forge-scene` gotcha).
- **`static`/reduced-motion:** freeze `uTime`, zero `uHeat`-driven motion, drop embers — same contract the slab honors (`forge.quality === 'static'`).

Target: each chamber should cost <0.8ms GPU on iPhone 15 on top of the slab. The pool's analytic-normal trick (no normal-map fetch, no FBO) and the gem's no-extra-pass dispersion are what keep it there.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations:**
1. Promote `useForgeHeat()` (§4.2) FIRST and refactor `FacetedJewel` to use it — proves the shared signal before any new chamber exists.
2. Build the **pool** next — it's the highest-value, lowest-risk (one plane, no FBO) and validates the vertex+fragment dual-injection pattern.
3. Then **arch** (composition of existing systems), then **plinths** (staging/lighting), then the gem **dispersion upgrade** (smallest diff, highest fragility).
4. Wire each into `ForgeCanvas` behind a `route ===` guard + `Suspense`-decoupled mount; tune `scenes.js` framing last.

**Pitfalls (hard-won in this codebase):**
- **`vNormal` vs `normal` under flatShading.** The gem is `flatShading:true` → `vNormal` is NOT declared; use in-scope `normal` (the existing `COLOR` chunk comment in `FacetedJewel.jsx` calls this out). The pool is smooth-shaded → use `vNormal`. Mixing these = a compile error or a black mesh.
- **Inject points differ vertex vs fragment.** Vertex displacement goes in `<begin_vertex>`; the fragment color goes before `<tonemapping_fragment>`; uniforms must be declared in BOTH stages if used in both. Forgetting `USE_UV` define = `vUv` undefined.
- **HDR discipline.** Only the mouth core / gem hot edge / vein core should exceed 1.0. If the *whole* pool or arch body is >1, bloom smears the entire frame and the OLED blacks die. Keep base surfaces ≤1; push only the accents.
- **Dispose.** Route-swapped mounts that don't dispose geometry/material/FBO leak the one shared context until it crashes on mobile.
- **Don't double-count `uTime` base.** The strike pulse uses `performance.now()/1000` to match `forge.strikeAt`; the surface animation uses `clock.elapsedTime`. Keep them separate exactly as `ObsidianSlab`/`FacetedJewel` do, or the surge won't line up.
- **Pool amplitude creep.** It is a *scrying* pool — still, listening. Amplitudes >0.06 turn it into an ocean and break the "dark mirror" read. Cap them and let `uHeat` add only subtle agitation.
- **Lightformer count.** Four plinth keys + the env's four lightformers = 8 area lights. Watch the lightformer cost on low tier; drop plinth keys to 2 there.
- **`MeshTransmissionMaterial` mobile.** If anyone reaches for true transmission, it MUST be desktop-gated — it does an internal buffer render per object and will tank iPhone.

---

## 8. SOURCES (2025–2026)

1. Codrops — *Creating Stylized Water Effects with React Three Fiber* (2025-03-04). https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/ — procedural sine/Perlin water surface, vertex displacement + Fresnel depth color, perf optimization.
2. Codrops — *Playing with Light and Refraction in Three.js: Warping 3D Text Inside a Glass Torus* (2025-03-13). https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/ — backface-buffer dispersion, per-channel IOR, `MeshTransmissionMaterial` chromatic aberration in practice.
3. drei docs — *MeshTransmissionMaterial* (accessed 2025–26; library current). http://drei.docs.pmnd.rs/shaders/mesh-transmission-material — `chromaticAberration` (def 0.03), `anisotropicBlur`, `samples`, `thickness`, `ior`, backside buffer behavior.
4. pmndrs/drei — `MeshTransmissionMaterial.tsx` source (master, 2025). https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx — confirms it layers over `MeshPhysicalMaterial` + extra buffer render = the mobile cost rationale.
5. Maxime Heckel — *Field Guide to TSL and WebGPU* (2025). https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — TSL `Fn()` glass/dispersion, `chromaticAberration` node, WebGL/WebGPU dual output (future-migration lane).
6. Maxime Heckel — *Shining a light on Caustics with Shaders and React Three Fiber* (2025 update). https://blog.maximeheckel.com/posts/caustics-in-webgl/ — physically-based refracted-ray caustics + chromatic aberration; why it's overkill for a sub-surface mirror.
7. Maxime Heckel — *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching* (2025-06). https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/ — post-pass light shaping reference for the arch mouth glow.
8. Codrops — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality* (2025-02-11). https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ — LOD, shadow/light budgeting for the plinth staging and mobile tiers.
9. nhtoby311/WaterSurface — R3F interactive water component (active 2025). https://github.com/nhtoby311/WaterSurface — `WaterSurfaceSimple/Complex`, explicit "planar reflection is expensive" warning that motivates the no-FBO pick.
10. Loopspeed — *React Three Fiber with WebGPU and Three Shading Language (TSL) Node Material* (2025). https://blog.loopspeed.co.uk/react-three-fiber-webgpu-typescript — R3F + WebGPU renderer setup, TSL node material, WebGL fallback (future-migration note).

---

## 9. DEEP-DIVE CANDIDATES

1. **Pool sub-surface model — fake SSS vs cheap depth fade.** Compare the §4.3 fbm-glow-from-below against a thickness/depth-based deep→shallow gradient (no FBO, using camera distance), and against a 1-tap refraction. Goal: maximum "fire under a dark mirror" read at zero extra passes on iPhone 15.
2. **Gem dispersion ladder — single-pass cos-split vs 3-tap FBO vs TSL.** Benchmark the §4.4 single-pass chromatic edge split against a true backface-FBO 3-tap and a TSL/WebGPU `chromaticAberration` node, on iPhone 15 vs desktop, to set the exact `high`/`desktop-only` gate.
3. **Plinth lighting without shadow maps.** Lightformer keys + `ContactShadows frames={1}` + fake AO vs a single baked GI image — establish the cheapest convincing gallery look for four casts under the mobile budget.
4. **Arch heat-shimmer as post vs in-material.** Compare in-material UV-distortion shimmer (§4.6) against a localized screen-space heat-haze post effect in the existing composer, for cost and how cleanly it reads on OLED without smearing the crushed blacks.
