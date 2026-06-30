# 22 — Procedural IBL / Environment Lighting (No Runtime EXR)

> Phase-1 graphics research · GAELWORX forge world · primary judge device: iPhone 15 (OLED)
> Topic owner concern: build the **reflection/IBL environment entirely procedurally** — from
> `<Lightformer>` rects/rings and runtime-generated env maps — so the obsidian slab, the cut
> jewel, and any glass/metal in the forge get *correct, cohesive* reflections **without loading
> any EXR/HDR file at runtime**. Warm forge fill, a cool key streak over it, and tight control of
> what actually shows up on the mirror-finish surfaces.

---

## 1. SCOPE

Everything reflective in GAELWORX reads off an **environment map**, not direct lights. The obsidian
slab (`ObsidianSlab.jsx`) is `MeshPhysicalMaterial` with `roughness 0.05`, `clearcoat 1`,
`envMapIntensity 1.4`; the cut jewel (`FacetedJewel.jsx`) is `flatShading`, `envMapIntensity 2.2`,
`iridescence 1.0`. On a near-mirror surface, **the look IS the environment** — the veins and the
divine fire are emissive overlays *on top of* whatever the env map paints across the glass. Get the
IBL wrong and the whole world reads as a flat black rectangle (too little) or an orange-washed
plastic blob (too much / wrong color).

The hard constraint from `CLAUDE.md` and the `forge-scene` skill is absolute: **no runtime EXR
loads.** EXR/HDR fetches suspend, can throw, blow the bundle, and stall first paint on mobile — the
opposite of the "true-black instant" the iPhone-15 judge target needs. So the entire reflection
environment must be **synthesized at runtime**: lightformer geometry baked into a small cubemap via
PMREM, or a procedural gradient, or a live CubeCamera. The current code already does the right thing
in spirit — `ForgeCanvas.jsx` builds a `<Environment>` from four `<Lightformer>`s with **zero file
loads**. This document hardens that into the master system: a **shared, temperature-coupled,
two-tone (warm forge fill + cool key) procedural IBL** that every chamber reuses, so the slab in
casting-room and the jewel in jewel-chamber are lit by *the same forge*, never bolted-on per-page
rigs.

The design tension to resolve: the comment in `ForgeCanvas.jsx` notes the team already fought the
"orange band across the glass" problem and retreated to a **neutral-cool** environment to keep the
obsidian reading as dark glass. That is correct for a near-mirror slab — but the *world* is a molten
forge lit only by metal. The reconciliation (Section 3) is a **two-tier IBL**: a cool, low-intensity
*key* that defines the specular streak and silhouette, plus a *warm forge fill* that is deliberately
kept **dim and low on the horizon** so it warms the blacks without smearing orange across the face.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable way to give reflective forge materials an environment **without an EXR**, weighed
against the one-renderer / iPhone-15 budget.

### A. Lightformer-built `<Environment>` (PMREM-baked, static) — *what the repo uses*

`<Environment>` from `@react-three/drei` renders its children (a set of `<Lightformer>` emissive
rects/circles/rings) into an off-screen cube render target **once**, runs it through `PMREMGenerator`
to produce the prefiltered, mip-chained radiance map, and assigns it to `scene.environment`. No file,
no network, no EXR. Lightformers are just flat emissive planes "mimicking the look of a light-former
… acts like a real light without the expense, you can have as many as you want"
([drei docs, staging 2025](http://drei.docs.pmnd.rs/staging/lightformer)).

- **Quality:** very high *for controlled reflections*. You sculpt exactly which bright shapes streak
  across the glass — a long horizontal rect becomes a clean specular bar; a ring becomes a halo on
  the jewel facets. This is precisely the "art-directed reflection" Active Theory / Lusion-tier work
  relies on.
- **Perf:** the PMREM bake is a **one-time** cost at mount; after that it's a free static cubemap
  sampled by the materials. This is the cheapest high-quality option at runtime.
- **Mobile:** excellent — bake at `resolution={128}` (or 256 on `high`), which the repo already
  gates. PMREM internally uses **half-float** render targets now, so the bake is cheap and the map
  is small ([three.js PMREMGenerator docs](https://threejs.org/docs/pages/PMREMGenerator.html)).
- **Complexity:** low. Already wired. Main gotcha: it bakes once, so **animated** lightformers do
  *not* update the reflection unless you set `frames={Infinity}` (expensive) or re-bake.

### B. Procedural gradient / sky-shader baked to env (no lightformers)

Write a tiny fragment shader (vertical warm-to-void gradient + a soft cool top band), render it to a
cube target, PMREM it. PMREM "can be generated from a supplied Scene, which can be faster than using
an image if networking bandwidth is low"
([PMREMGenerator docs](https://threejs.org/docs/pages/PMREMGenerator.html)); the same path works from
a shader-painted scene. Codrops' 2025 efficiency guide explicitly favors procedural/synthesized
environments over loaded HDRIs for exactly this reason
([Codrops, Feb 2025](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)).

- **Quality:** smooth, no banding, perfect for the *fill* tone — but no crisp shapes, so the glass
  loses its "something is over there" specular interest. Best **combined** with A (lightformers for
  shapes, gradient for the base wash).
- **Perf / Mobile:** trivial; a 64–128px cube is plenty for a pure gradient.
- **Complexity:** low–medium (one shader + one PMREM call).

### C. Live `CubeCamera` (dynamic real-time IBL)

A `CubeCamera` renders the actual scene into a cube target every frame, feeding true reflections of
the moving pour, sparks, and letterforms back onto the glass
([sbcode CubeCamera, 2025](https://sbcode.net/threejs/cubecamera/);
[CubeCamera docs](https://threejs.org/docs/pages/CubeCamera.html)).

- **Quality:** the only option that reflects the *living* world (moving molten front in the glass).
  Gorgeous, but on a near-mirror it can look noisy/busy and fight the curated streak.
- **Perf:** **6 extra scene renders per update** — brutal. Even at `frames={2}` for a near-static
  setup it doubles draw cost.
- **Mobile:** **no** as a per-frame system. Viable only as a *one-shot* bake (`frames={1}`) or
  throttled to every Nth frame at tiny (64px) resolution.
- **Complexity:** medium; easy to wreck the budget.

### D. WebGPU / TSL procedural environment node (forward-looking)

three.js WebGPU shipped in the standard build and reached production across major browsers in late
2025 ([utsubo WebGPU migration, 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)).
TSL exposes node-based environment/PBR graphs and the r171 (Nov 2024) line added `fromSceneAsync()`
and an optional `renderTarget` on `fromScene()`, plus `three.tsl.js`
([three.js r171 release, Nov 2024](https://github.com/mrdoob/three.js/releases/tag/r171)). A
`pmremTexture()`/environment node lets you drive procedural IBL on the GPU and even screen-space
reflections via a single MRT pass
([utsubo, 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)).

- **Quality / future:** highest ceiling; SSR-on-glass without cubemaps.
- **Perf / Mobile:** WebGPU on iOS Safari is still uneven in 2025–2026; the WebGL2 fallback path
  must exist anyway.
- **Complexity / fit:** **high** — this repo is WebGL2 r3f today. Park as a Phase-2 migration, not
  the Phase-1 pick.

### E. Loaded `preset`/RoomEnvironment

drei `<Environment preset="...">` fetches a bundled HDR; `RoomEnvironment` synthesizes a neutral
studio at runtime (no file). RoomEnvironment is the no-EXR escape hatch but its **cool neutral
studio** tone fights the forge palette and gives that generic "product render" look. Useful only as
an emergency static fallback. Presets violate the no-EXR rule.

**Verdict:** A + B combined (lightformers for art-directed cool key shapes, a procedural warm
gradient for the forge fill), baked once via PMREM. C as a throttled one-shot only where a chamber
truly needs the living pour in the glass. D parked for WebGPU phase.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A unified `<ForgeEnvironment>` component: lightformer cool-key shapes over a procedural warm-fill
gradient, PMREM-baked once, with a shared `forgeEnv` uniform tier so the same env serves every
chamber and re-tempers with the master temperature.**

Why this wins:

1. **No EXR, can't suspend/throw.** Pure runtime synthesis — exactly the constraint, and it keeps
   first paint instant on the OLED target.
2. **It already half-exists.** `ForgeCanvas.jsx` builds a 4-lightformer `<Environment>`. We promote
   it from an inline block to a reusable component, add the warm-fill base, and couple it to the
   master temperature so it isn't a static rig.
3. **It solves the "orange band" scar correctly.** The cool rect/ring lightformers stay as the
   **key** (the clean specular streak the team already validated). The forge warmth re-enters as a
   **dim gradient on the lower hemisphere only** — it warms the obsidian's blacks and the jewel's
   underside without painting an orange bar across the face. This is the canonical
   **cool-key-over-warm-fill** lighting recipe, done in IBL.
4. **Cohesion by construction.** One env, one PMREM, shared by slab + jewel + any future glass. The
   per-route `SCENES` presets (`scenes.js`) already retune veins/camera; we add a single
   `envTone` knob per route so the *reflection* re-tempers with the chamber (cooler scrying-pool,
   warmer forge-mouth) — same pattern, same store, nothing bolted-on.
5. **Bake-once perf.** After mount it's a free static cubemap. The only animated reflection (the
   pulsing molten edge) is faked by modulating **`material.envMapIntensity`** per frame from the
   shared heat signal — no re-bake, no CubeCamera.

The two-tone target, in palette terms (`palette.js` / `CLAUDE.md`):

| Role | Source | Color | Intensity | Placement |
|---|---|---|---|---|
| **Key** (specular streak, silhouette) | rect Lightformer | Fog-White-cool `#e8eef8` | 2.0–2.4 | high, front, wide |
| **Rim** (facet halo on jewel) | ring Lightformer | cool white `#eef2f8` | 1.6–1.8 | side, mid |
| **Forge fill** (warm the blacks) | gradient base + 1 dim rect | Celtic-Blood→Ember `#3a0905`→`#E85D04` | 0.25–0.5 | **lower hemisphere only** |
| **Void floor** (keep blacks true) | dark rect | near-void `#0a0d12` | 0.4 | below |

The fill is *deliberately* below the key by ~5–8×. The glass reads as dark cool glass with a hot
forge glow welling up from underneath — which is the world.

---

## 4. IMPLEMENTATION

### Libraries / versions

- `three` r17x (repo current; r171+ gives half-float PMREM + `fromSceneAsync`).
- `@react-three/fiber` v8/v9, `@react-three/drei` (current) — `Environment`, `Lightformer`.
- No new deps. No `@pmndrs/assets`, no EXR loader.

### Component shape (`src/scene/ForgeEnvironment.jsx`)

```jsx
import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { forge } from '../store.js'
import { sceneFor } from './scenes.js'

/**
 * The ONE procedural forge IBL. No EXR — built from a warm-fill gradient base
 * plus cool-key lightformer shapes, PMREM-baked once. Shared by slab + jewel.
 * Cool key defines the specular streak; warm fill (lower hemisphere) warms the
 * blacks without an orange band. `tone` re-tempers per chamber.
 */
export default function ForgeEnvironment({ quality = 'high' }) {
  const res = quality === 'high' ? 256 : 128
  // per-route reflection temper (see scenes.js envTone, Section 5)
  const tone = sceneFor(forge.route).envTone ?? 0.0  // 0 cool .. 1 warm

  // warm-fill color welling up from below, lerped by chamber tone
  const fill = useMemo(
    () => new THREE.Color('#3a0905').lerp(new THREE.Color('#E85D04'), 0.4 + tone * 0.4),
    [tone],
  )

  return (
    <Environment resolution={res} frames={1}>
      {/* COOL KEY — the clean specular bar across the glass (validated look) */}
      <Lightformer form="rect" intensity={2.2 - tone * 0.5} color="#e8eef8"
        position={[0, 3, 4]} scale={[14, 2.4, 1]} />
      <Lightformer form="rect" intensity={1.3} color="#aebccf"
        position={[-6, 0, 3]} scale={[3, 5, 1]} rotation={[0, 0.4, 0]} />
      {/* COOL RIM — halo on the jewel facets */}
      <Lightformer form="ring" intensity={1.8} color="#eef2f8"
        position={[5, 1.6, 3]} scale={2.4} />

      {/* WARM FORGE FILL — lower hemisphere only, dim. Welling heat, no band. */}
      <Lightformer form="rect" intensity={0.25 + tone * 0.35} color={fill}
        position={[0, -2.4, 3]} scale={[16, 3, 1]} rotation={[Math.PI / 2.6, 0, 0]} />
      {/* VOID FLOOR — keep the blacks true on OLED */}
      <Lightformer form="rect" intensity={0.5} color="#0a0d12"
        position={[0, -3.4, 4]} scale={[14, 4, 1]} />
    </Environment>
  )
}
```

Drop-in: replace the inline `<Suspense><Environment>…</Environment></Suspense>` block in
`ForgeCanvas.jsx` (lines 35–42) with `<ForgeEnvironment quality={quality} />`. (You can keep the
`<Suspense fallback={null}>` wrapper; lightformer envs don't suspend, but it's harmless insurance and
matches the `forge-scene` skill's "decoupled Suspense" rule.)

### Optional: procedural warm-gradient base (Technique B, if lightformers alone read too "spotty")

If the four-rect fill banding shows, paint a true gradient cube instead of the warm rects. Build a
tiny inline scene with a back-side sphere whose shader is the forge gradient, PMREM it once:

```js
// onMount, once. `gl` from useThree().
const env = new THREE.Scene()
const geo = new THREE.SphereGeometry(50, 32, 16)
const mat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  fragmentShader: /* glsl */`
    varying vec3 vDir;
    void main(){
      float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);          // 0 below .. 1 above
      vec3 voidC = vec3(0.020,0.020,0.027);                    // PAL.void
      vec3 warm  = vec3(0.227,0.035,0.020);                    // deep crimson fill
      vec3 cool  = vec3(0.910,0.933,0.972);                    // cool key tint
      vec3 c = mix(warm * 0.6, voidC, smoothstep(0.0,0.45,h)); // warm wells from below
      c = mix(c, cool * 0.25, smoothstep(0.7,1.0,h));          // faint cool cap
      gl_FragColor = vec4(c, 1.0);
    }`,
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main(){ vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
})
env.add(new THREE.Mesh(geo, mat))
const pmrem = new THREE.PMREMGenerator(gl)
const target = pmrem.fromScene(env, 0.04)   // small sigma blur
scene.environment = target.texture
pmrem.dispose(); geo.dispose(); mat.dispose()  // env texture stays; clean the rest
```

Then layer the **cool lightformer key/rim on top** by still rendering the drei `<Environment>` — or,
cleaner, add the cool rects as emissive meshes into the same `env` scene before baking so it's **one
PMREM, one map**. One map = one cohesive reflection.

### Key uniforms / params (hook to the master temperature system)

The env is baked static, so the *animated* coupling lives on the **materials**, driven by the same
signals already in `ObsidianSlab.jsx` / `FacetedJewel.jsx`:

```js
// in useFrame, both reflective materials — reuse the existing heat/scroll signals
const heat = uniforms.uTemp.value           // slab already computes this (line 159)
// reflection brightens with the forge running hotter — fakes "more light" w/o re-bake
material.envMapIntensity = damp(material.envMapIntensity,
  baseReflect * (0.85 + heat * 0.5 + surge * 0.4), 4, dt)
// jewel: scene.environmentIntensity can pulse the whole IBL at once
// scene.environmentIntensity = 0.9 + heat * 0.3   (r171+ attenuates env globally)
```

`scene.environmentIntensity` (r171+) attenuates the env map globally
([three.js r171, Nov 2024](https://github.com/mrdoob/three.js/releases/tag/r171)) — a single line to
make the *whole world's* reflections breathe with the master heat, instead of touching each material.
That is the cohesion lever.

---

## 5. COHESION (shared palette / lighting / uniforms)

- **One env, every chamber.** `ForgeEnvironment` is mounted once in `ForgeCanvas`; the slab and jewel
  both read `scene.environment`. No per-mesh env maps, no second context — honors the single-renderer
  rule.
- **Palette piped from `palette.js`.** The fill uses `PAL.crimsonDeep`→`PAL.ember`; the void floor
  uses `PAL.void`. Add a `v3`-style export so the gradient shader inlines the *same* hex the veins
  use — the reflection and the emissive fire are literally the same colors.
- **Per-route temper via `scenes.js`.** Add one field to each preset:

  ```js
  '/voice':   { …, envTone: 0.05 },   // scrying-pool — cool, mirror-still
  '/software':{ …, envTone: 0.35 },
  '/web':     { …, envTone: 0.6  },   // jewel-chamber — warmer, vivid
  '/contact': { …, envTone: 0.85 },   // forge-mouth — hottest reflections
  ```

  `ForgeEnvironment` reads `sceneFor(forge.route).envTone`; re-mount/re-bake only on route change
  (cheap, one PMREM). The veins (`uIrid`, `uVeinScale`) already damp on route swap — the reflection
  now re-tempers in lockstep, so a chamber's glass and its fire agree.
- **Heat coupling is shared.** `envMapIntensity` / `environmentIntensity` ride `uTemp` + the strike
  `uSurge` — the *exact* signals (`forge.scrollDamped`, `forge.strikeAt`) that flare the veins and
  the jewel edges. The reflection brightens on the same heartbeat as the fire. Nothing animates on a
  private clock.
- **Tone mapping agrees.** Renderer is `ACESFilmicToneMapping` (`ForgeCanvas` line 18); env values
  go through the same ACES grade as the emissive bloom (`post-fx` skill), so reflections and fire sit
  on one curve — no double-exposed hotspots.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Bake cost is one-time.** PMREM at 128px (low/mid) / 256px (high) is a single off-screen pass at
  mount + on route change. Half-float internal targets keep it light
  ([PMREMGenerator docs](https://threejs.org/docs/pages/PMREMGenerator.html)). Re-bake only fires on
  navigation, never per frame.
- **`frames={1}` is mandatory.** drei `<Environment>` `frames` controls whether it renders once or
  every frame; `frames={1}` (the default-static behavior) bakes once
  ([drei Environment docs, 2025](http://drei.docs.pmnd.rs/staging/environment)). **Never**
  `frames={Infinity}` on mobile — that re-renders the env scene every frame and torches the budget.
- **Resolution gating mirrors the repo's tiers.** `high → 256`, `low → 128`, `static → 128` (baked,
  then frameloop demand). This matches the existing `dpr`/quality gating in `ForgeCanvas`.
- **Static tier.** On `quality === 'static'`, bake once at 128 and stop. The frameloop is already
  `'demand'`; the env never updates and that's correct — a still forge.
- **No CubeCamera on mobile by default.** If a single chamber (e.g. jewel-chamber) wants the living
  pour in the facets, gate it to `high` only, `frames={1}` or every-8th-frame at **64px**, and
  budget the 6 face renders explicitly.
- **iPhone OLED specifics.** Keep the **void floor** lightformer (`#0a0d12`, dim) so the lower
  hemisphere doesn't lift the blacks — true blacks are the judge's whole reason. Keep total env
  energy low; the *bloom* (`Effects.jsx`, `luminanceThreshold 0.55`) should fire on the emissive
  veins, **not** on env reflections, or the glass smears. Test that the cool key streak stays a crisp
  bar and doesn't blow into bloom.
- **Memory.** One env texture (~a few hundred KB at 256). Dispose the PMREM generator immediately
  after bake; keep the texture. On unmount, dispose `scene.environment` (the `forge-scene` skill's
  dispose-on-unmount rule).

Performance posture matches the 2025 efficiency guidance: synthesize the environment rather than
load it, gate effects by tier, and degrade parameters before dropping features
([Codrops, Feb 2025](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations**

1. **Lift the existing inline env into `ForgeEnvironment.jsx` unchanged first.** Confirm the slab
   still looks identical (parity gate) before adding anything.
2. **Add the warm-fill rect (lower hemisphere only).** Tune intensity from `0.25` up until the
   blacks warm but **no orange bar** appears across the face. This is the scar the team already hit —
   verify on the iPhone target, not desktop.
3. **Wire `envTone` into `scenes.js`** (one field per route). Verify a cool chamber (voice) vs a warm
   one (contact) actually differ in the glass.
4. **Couple `envMapIntensity` / `environmentIntensity` to `uTemp` + `uSurge`.** Verify the
   reflection brightens on scroll/strike *in time with* the veins.
5. **Only if banding shows:** switch the warm rects for the procedural gradient bake (Section 4).
6. **Only if a chamber demands living reflections:** add a throttled 64px CubeCamera, `high` tier
   only.

**Pitfalls**

- **The orange band.** A bright *warm rect high/front* smears an orange bar across a near-mirror.
  Keep warm energy **low and below the horizon**; keep the front/high shapes **cool**. This is the #1
  failure mode here and it's already documented in `ForgeCanvas.jsx`.
- **Animated lightformers don't reflect.** With `frames={1}` the bake is frozen; animating a
  lightformer's color/position changes nothing on the glass. Animate **`envMapIntensity`** instead.
- **`frames={Infinity}` budget bomb.** Easy to set "to make it live"; it re-renders the env every
  frame. Don't.
- **PMREM leaks.** Always `pmrem.dispose()` after a manual bake; on route re-bake, dispose the old
  `scene.environment` texture or you leak a cubemap per navigation.
- **Background vs reflection.** `<Environment background>` would paint the env as the skybox —
  **do not**; the world is pure void (`<color attach="background" args={['#040406']} />` stays). The
  env is reflection-only.
- **Bloom eating reflections.** If the cool key is too hot it blows into bloom and the glass smears.
  Keep the key just under bloom threshold; let the emissive veins own the glow.
- **Tone-map mismatch.** Author env intensities *after* confirming ACES is on; values that look right
  in linear look blown after the grade.

---

## 8. SOURCES (2025–2026)

1. drei — **Lightformer** docs (staging), 2025 — props (form/intensity/color/scale/target), "acts
   like a real light without the expense." http://drei.docs.pmnd.rs/staging/lightformer
2. drei — **Environment** docs (staging), 2025 — `frames`, `preset`, `backgroundBlurriness`,
   `environmentIntensity`, ground/blur control. http://drei.docs.pmnd.rs/staging/environment
3. Codrops — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality*,
   **Feb 11 2025** — synthesize environments over loaded HDRIs, tier-gate effects, degrade params.
   https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
4. utsubo — *Migrate Three.js to WebGPU (2026) — The Complete Checklist*, **2026** — TSL
   environment/PBR node graphs, `pmremTexture`, SSR via single MRT, WebGPU production status late
   2025. https://www.utsubo.com/blog/webgpu-threejs-migration-guide
5. three.js — **r171 Release notes**, **Nov 29 2024** — `PMREMGenerator.fromSceneAsync()`, optional
   `renderTarget` in `fromScene()`, `three.tsl.js`, lighting nodes (cited as the canonical baseline
   the 2025–2026 guides build on). https://github.com/mrdoob/three.js/releases/tag/r171
6. three.js — **PMREMGenerator** docs (current, 2025) — `fromScene(scene, sigma)`, half-float
   targets, "faster than an image if bandwidth is low."
   https://threejs.org/docs/pages/PMREMGenerator.html
7. sbcode — **CubeCamera Reflections** (Three.js tutorials, 2025) — runtime cube target reflection
   setup + per-frame update cost. https://sbcode.net/threejs/cubecamera/
8. Codrops — *Interactive Text Destruction with Three.js, WebGPU, and TSL*, **Jul 22 2025** —
   contemporary TSL/WebGPU production pattern reference.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/

---

## 9. DEEP-DIVE CANDIDATES

1. **One-PMREM unified bake (lightformers + warm gradient in a single env scene).** Merge cool
   emissive shapes and the warm-gradient sphere into one off-screen scene, bake once → one cohesive
   reflection map instead of layering two systems. Cheapest + most coherent; worth prototyping.
2. **Per-chamber env re-temper without a full re-bake.** Can `scene.environmentIntensity` +
   `environmentRotation` (r171+) carry most of the per-route tonal difference so we re-bake only when
   `envTone` crosses a threshold, not on every navigation?
3. **Throttled 64px CubeCamera for the jewel-chamber only.** Spec the exact frame budget for getting
   the *living molten pour* reflected in the facets on `high` tier, and the visual payoff vs cost.
4. **WebGPU/TSL `pmremTexture` + SSR migration path.** When iOS Safari WebGPU is dependable, replace
   cubemap IBL on the glass with screen-space reflections of the actual pour — the Phase-2 ceiling
   ([utsubo, 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)).
