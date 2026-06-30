# 07 — Obsidian / Volcanic-Glass Material (existing slab evolution)

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED · one WebGL renderer_

> **One-line brief:** evolve the existing `ObsidianSlab` `MeshPhysicalMaterial` (sharp env reflection
> over a soft fire-opal interior) from a standalone hero slab into the **GREEN-BLACK Irish-basalt
> stone body** of the forge world — the dark volcanic glass that the Celtic interlace channels are
> carved into, that the molten pour flows across, and that the A/E divine-fire radiates onto. Keep the
> signature look; retune the body, the veins, and the lighting to belong to the master temperature system.

---

## 1. SCOPE

In the current build the obsidian slab is the *whole show*: a full-frame polished black volcanic-glass
panel (`RoundedBox 11×6.6×0.6`) that reflects a neutral-cool procedural environment sharply and carries
animated fire-opal veins through its body (`src/scene/ObsidianSlab.jsx`). In the new forge world this
exact material stops being the hero and becomes the **WORLD'S SKIN** — the dark **green-black Irish
basalt / obsidian** (Connemara-marble depth) that everything else is carved into and flows over. It is
the stone of the forge-ALTAR, the walls of the channel-hall, the four plinths, the stone-ledger, the
jewel-chamber's matrix. Its job is now threefold: (1) read as a **cold, sacred, near-black stone** that
holds true black on the OLED so the molten metal is the only bright thing; (2) provide the **signature
sharp-reflection-over-soft-interior** so the void never looks like flat paint; (3) **receive light** —
take the white-gold A/E divine fire and the orange pour as real illumination on its surface, revealing
the carved OGHAM and the interlace channels. It is the 60% "void" of the 60/30/10 palette, but it must
be a *living* 60%, not dead matte. The fire-opal veins survive, but demoted: from the main event to a
**deep-ember capillary network** that only wakes where heat is near.

---

## 2. TECHNIQUE LANDSCAPE (2025-2026)

Everything below is gauged against the three hard constraints: **iPhone-15 mobile budget**, **one
shared renderer**, and **no runtime EXR/HDR loads**.

### 2.1 Keep `MeshPhysicalMaterial` + `onBeforeCompile` (the current approach, evolved)
What we have. A stock `MeshPhysicalMaterial` (clearcoat, ior, iridescence, optional transmission)
patched via `onBeforeCompile` to inject the vein/opal look before tone-mapping. This is still the
**single best fit** for this codebase in 2025: it keeps PBR env reflection, clearcoat and the ACES
pipeline for free, and the `shader-fx` skill is built entirely around this injection pattern. The 2025
three.js releases keep `WebGLRenderer` + `onBeforeCompile` fully maintained (r178, 2025-06-30, still
ships `transmission`-pass fixes for the WebGL backend). Tradeoff: per-pixel cost of physical shading is
real, and `onBeforeCompile` string-injection is brittle across three upgrades — but it is the path of
least risk and the existing code already proves it compiles under SwiftShader in CI.

### 2.2 `MeshTransmissionMaterial` (drei) for the glass interior
drei's `MeshTransmissionMaterial` layers extra shaders on `MeshPhysicalMaterial` to add **real
screen-space refraction, chromatic aberration, distortion (`distortion`, `distortionScale`,
`temporalDistortion`), and noise-roughness blur** (Codrops, "Warping 3D Text Inside a Glass Torus",
2025-03-13). It is gorgeous for a *transparent* hero object. **But obsidian is opaque**, and the honest
cost is brutal: each transmissive object triggers an **extra full-scene render pass** to compute its
refracted background — Codrops calls it "not cheap at all" and a draw-call bottleneck with multiple
transmissive meshes. For a full-frame world skin on an iPhone, a second scene pass is out of budget.
Verdict: **reference, not ship** — borrow its *parameters and feel* (chromatic edge, distortion), fake
them cheaply in our injected shader. The `transmissionSampler`/shared-buffer trick and `resolution:
128–256` downscale (Codrops) are the only ways it survives mobile, and even then only for a single small
jewel, not the slab.

### 2.3 Fake refraction via FBO / screen-space (Maxime Heckel pattern)
The classic "render the scene to an FBO, then sample it with a refracted `eyeVector`" — chromatic
dispersion + a Fresnel reflection mix (Maxime Heckel's refraction/dispersion deep-dive; the technique is
canonical and re-surfaced through his 2025 TSL field guide). Cheaper than transmission because you
control the buffer, but still an extra pass and an FBO per refractive surface. For GAELWORX the *interior
depth* we want is **emissive parallax**, not true background refraction — so we can fake the "looking
into the stone" feel with a cheap **inner-vein parallax** offset by view direction, no FBO at all.

### 2.4 TSL + WebGPURenderer (the 2026 horizon)
TSL (Three Shading Language) lets you write node-based shaders in JS that transpile to **WGSL or GLSL**,
running on `WebGPURenderer` with a WebGL fallback (three.js manual; Maxime Heckel "Field Guide to TSL and
WebGPU", 2025). All physical features — clearcoat, transmission, iridescence — exist as nodes
(`MeshPhysicalNodeMaterial`). The 2026 magma tutorials are already TSL-first (ICS Media, "Three.js magma
effect techniques", 2026-04-09 — rim-glow via `normalView.dot(positionViewDirection).oneMinus()`, UV-scroll
additive bands). **The catch for THIS repo:** `WebGPURenderer` does **NOT support `onBeforeCompile`,
`ShaderMaterial` string injection, or the `EffectComposer`/`@react-three/postprocessing` chain** (three.js
manual, "State of WebGPURenderer"). Adopting it means porting `Effects.jsx`, every shader, and the env to
nodes — a full rewrite, and the renderer is still "experimental" with possible perf regressions on mobile
Safari. Verdict: **architect the GLSL so the math ports cleanly to TSL later, but do NOT migrate in Phase
1.** WebGPU on iOS Safari is improving but not a safe primary in 2025-2026.

### 2.5 Iridescence: built-in `KHR_materials_iridescence` vs. cheap cosine-palette
Two ways to get the fire-opal play-of-color. (a) The material's **built-in `iridescence` /
`iridescenceIOR` / `iridescenceThicknessRange`** — a physically-based thin-film Belcour/Barla model now
standard in the glTF spec and three (the slab already uses it: `iridescenceThicknessRange:[120,500]`).
Accurate, view-angle correct, free with the material. (b) A **cheap cosine-gradient** —
`0.5 + 0.5*cos(2π(x + vec3(0,.33,.67)))` driven by Fresnel + noise (the slab's `gwOpal`, and the
2025-11-17 Jelly Renders "Rendering a Simple Iridescent Material" `k=6, fr/fg/fb=1.0/1.3/1.7` recipe).
Stylized, cheap, art-directable. **GAELWORX wants both, layered:** the built-in for the surface clearcoat
sheen (subtle, physical), the cosine-palette for the emissive vein fire (loud, controllable, blooms).

### 2.6 Heat-shimmer / distortion (companion, not the slab itself)
The "heat shimmer distorts the air" requirement is a **post / screen-space** job, not a material job.
Options: a velocity/flow-field UV displacement pass (three-fluid-fx `SimpleDistortionPass`,
WebGL+TSL variants — "keep intensity modest, heat-haze ≈ short-lived velocity"), or a cheap sine+noise
UV warp masked to the hot zones (Codrops heat-distortion lineage). Mentioned here for cohesion; it lives
in `post-fx` / a dedicated pass, and the slab only needs to **emit a heat mask** for it to read.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Keep the `MeshPhysicalMaterial` + `onBeforeCompile` core. Retune it into the basalt world-skin.** No
WebGPU port, no transmission pass on the slab. Specifically:

1. **Keep the signature**: sharp clearcoat env reflection (the cool-neutral Lightformer set) over a soft,
   self-lit interior. This is the look the brief explicitly says to preserve. `clearcoat:1`,
   `clearcoatRoughness:~0.03`, low base `roughness`.
2. **Retune the BODY from pure obsidian-black toward GREEN-BLACK Irish basalt.** Today the base color is
   `#030205` (near-pure black). Shift to a **deep green-black** (`~#04070A` with a faint cold-green
   cast, Connemara depth) so the stone reads as *Irish basalt*, not generic black glass — while still
   crushing to true-black on the OLED. This is a 1-line color change plus a subtle green term in the
   ambient/Fresnel rim, NOT a green wash (brand stays warm-forge; the green is a near-black undertone you
   feel more than see).
3. **Demote veins to a heat-gated capillary network.** Keep `gwVeins`/`gwOpal`, but drive their glow
   from a new **shared `uHeatField`** (proximity to molten/pour/A-E), so the obsidian is *cold and dark*
   by default and only its veins kindle where the world is hot. This is what ties it to the master
   temperature system instead of glowing everywhere on its own.
4. **Fake the interior depth** with view-parallaxed inner veins (offset vein UV by `vViewPosition.xy`),
   not an FBO/transmission pass — keeps the "soft interior" with zero extra passes.
5. **Make it RECEIVE light**: a dedicated `uDivineLight` (A/E position + color) and `uPourLight` term
   add a real diffuse/Fresnel response on the stone so the divine fire and molten pour *illuminate* the
   basalt and reveal carved ogham — the cohesion linchpin (Section 5).
6. **Architect the GLSL for a future TSL port**: keep all look-math in named helper functions with
   uniform inputs (no reliance on three's internal varyings beyond `vNormal`/`vViewPosition`/`vUv`), so a
   Phase-2 TSL/WebGPU rewrite is a transcription, not a redesign.

Justification: it is the only approach that hits *all* of {one renderer, mobile budget, no EXR, keeps the
existing CI-verified pattern, and shares the master temperature uniforms}. Transmission/WebGPU buy realism
we don't need (opaque stone) at a cost we can't pay (extra passes / renderer rewrite / iOS risk).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new deps required)
- `three` (current repo r17x line; r178+ keeps `onBeforeCompile` + WebGL transmission pass maintained).
- `@react-three/fiber`, `@react-three/drei` (`RoundedBox`, `Environment`, `Lightformer`), `leva` — all
  already present. **No `MeshTransmissionMaterial` import on the slab.** (drei stays available for a
  *single* small jewel elsewhere if ever needed, with `samples:4-6`, `resolution:128`.)
- Reuse `GLSL_NOISE` from `src/scene/shaders.js` (`gw_snoise`/`gw_fbm`/`gw_caustic`) and `PAL`/`v3` from
  `src/scene/palette.js`. Add the green-black to `palette.js`.

### 4.2 Palette addition (`src/scene/palette.js`)
```js
// green-black Irish basalt body (Connemara depth) — a near-black with a cold-green undertone.
basalt:     new THREE.Color('#04070A'),   // base color of the stone skin
basaltRim:  new THREE.Color('#0c1a16'),   // faint green-black Fresnel rim (felt, not seen)
divine:     new THREE.Color(2.4, 2.1, 1.4), // A/E white-gold divine fire (HDR → blooms), shared
```

### 4.3 Material shape (evolves `ObsidianSlab.jsx`)
```js
const material = useMemo(() => {
  const m = new THREE.MeshPhysicalMaterial({
    color: PAL.basalt,            // was '#030205' — now green-black basalt
    metalness: 0,
    roughness: 0.06,
    clearcoat: 1,                 // KEEP — the sharp reflection signature
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.4,
    ior: 1.5,
    iridescence: 0.30,            // subtle PHYSICAL sheen on the clearcoat (keep low)
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 460],
    transmission: 0,              // OPAQUE stone — never a transmission pass on the world skin
    transparent: false,
  })
  m.defines = { USE_UV: '' }
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)  // keep refs, mutate .value per-frame
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
      .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
  }
  return m
}, [uniforms])
useEffect(() => () => material.dispose(), [material])   // dispose — non-negotiable
```

### 4.4 Key uniforms (the master-system hooks)
```js
const uniforms = useMemo(() => ({
  uTime:       { value: 0 },
  uHeatField:  { value: 0 },                     // 0..1 world heat near this surface (SHARED)
  uVeinGlow:   { value: 0 },                     // capillary kindle (driven by heat, not standalone)
  uTemp:       { value: 0 },                     // master cooling phase (white→ember→iron)
  uIrid:       { value: 1 },
  uVeinScale:  { value: 1.8 },
  uBump:       { value: 0.12 },
  uPointer:    { value: new THREE.Vector2(0.5, 0.5) },
  uPointerOn:  { value: 0 },
  uSurge:      { value: 0 },                      // strike pulse (shared strikeAt)
  uDivinePos:  { value: new THREE.Vector2(0.5, 0.55) }, // A/E divine-fire emitter, UV space
  uDivine:     { value: 0 },                      // divine-fire intensity onto the stone
  uPourFront:  { value: new THREE.Vector2(-1, 0) },     // molten pour-front position (UV)
}), [])
```

### 4.5 HEAD — basalt body + heat-gated veins + divine reception (GLSL)
```glsl
uniform float uTime, uHeatField, uVeinGlow, uTemp, uIrid, uVeinScale, uBump, uSurge, uDivine;
uniform vec2  uPointer, uDivinePos, uPourFront; uniform float uPointerOn;
${GLSL_NOISE}
vec2 gwPw; float gwVein, gwFlow, gwCore, gwN;

void gwVeins(vec2 uv){
  vec2 p = uv * uVeinScale;
  // domain-warp; pointer + pour-front bias the flow toward heat sources
  vec2 toH = (uPointer - uv);
  p += toH * uPointerOn * 0.6 * exp(-length(toH) * 3.0);
  vec2 w = vec2(gw_fbm(p*0.9 + vec2(0.0,  uTime*0.05)),
                gw_fbm(p*0.9 + vec2(5.0, -uTime*0.04)));
  gwPw = p + w * 1.1;
  gwN  = gw_fbm(gwPw);
  float vein = pow(clamp(1.0 - abs(gwN), 0.0, 1.0), 6.5);
  // COVERAGE now gated by the shared heat field — cold stone shows almost no fire.
  float heat = clamp(uHeatField, 0.0, 1.0);
  float mask = smoothstep(0.05, 0.5, gw_fbm(uv*0.7 + vec2(uTime*0.02,-uTime*0.015)));
  vein = mix(vein * 0.04, vein, heat);          // capillaries kindle with heat
  gwVein = vein * mask;
  gwCore = pow(clamp(gwVein, 0.0, 1.0), 2.0);
  gwFlow = 0.5 + 0.5 * sin(gwN * 8.0 - uTime);
}
vec3 gwOpal(float x){ return 0.5 + 0.5 * cos(6.2831*(x + vec3(0.0,0.33,0.67))); }
```

### 4.6 COLOR — temperature gradient + divine light onto the stone (GLSL)
```glsl
gwVeins(vUv);
float gwFres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)),0.,1.), 2.0);

// 1) faint green-black basalt rim (Connemara depth — felt, not seen)
gl_FragColor.rgb = mix(gl_FragColor.rgb, ${v3(PAL.basaltRim)}, gwFres * 0.12);

// 2) capillary fire — MASTER cooling gradient: white-hot → ember → forge-red → iron
vec3 cool = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, clamp(gwVein*1.2,0.,1.));
cool      = mix(cool, ${v3(PAL.hot)}, gwCore * uTemp);             // uTemp = master phase
vec3 opal = gwOpal(gw_fbm(gwPw*2.2 + 5.0)*1.6 + uTime*0.08 + gwFres*0.6);
vec3 veinCol = mix(cool, opal*1.4, clamp(uIrid*(0.45+0.55*gwN),0.,0.8));
vec3 fire = (veinCol*gwVein*gwFlow*1.1 + ${v3(PAL.hot)}*gwCore*1.3) * (uVeinGlow + uSurge);

// 3) RECEIVE the A/E divine fire — radiate white-gold onto the stone, falloff from emitter UV
float dD = distance(vUv, uDivinePos);
float divine = uDivine * exp(-dD * 4.5) * (0.4 + 0.6*gwFres);       // rim-biased pickup
fire += ${v3(PAL.divine)} * divine;                                 // reveals carved ogham nearby

// 4) RECEIVE the molten pour glow — warm wash that travels with the pour-front
float dP = abs(vUv.x - uPourFront.x);
fire += ${v3(PAL.ember)} * exp(-dP * 6.0) * uHeatField * 0.6;

gl_FragColor.rgb += fire;
```
`NORMAL` stays as-is (the `dFdx/dFdy` vein bump), optionally scaled by `uHeatField` so cold stone is
flatter and hot stone ripples more.

### 4.7 Driving the uniforms (`useFrame`, dt-damped — `motion-feel`/`shader-fx` law)
```js
useFrame((state, dt) => {
  uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  const sc = sceneFor(forge.route)
  const vel = Math.min(forge.scrollVel * 1.4, 1)
  // SHARED heat field: route base + scroll energy + strike — the SAME signal the molten/sparks read
  const heatTarget = Math.min(sc.heat + vel * 0.4, 1)
  uniforms.uHeatField.value = damp(uniforms.uHeatField.value, forge.ready ? heatTarget : 0, 3, dt)
  uniforms.uVeinGlow.value  = damp(uniforms.uVeinGlow.value, sc.veinGlow + vel * 0.5, 3, dt)
  uniforms.uTemp.value      = Math.min(forge.scrollDamped + vel * 0.25, 1) // master cooling phase
  uniforms.uIrid.value      = damp(uniforms.uIrid.value, sc.irid, 2.4, dt)
  uniforms.uVeinScale.value = damp(uniforms.uVeinScale.value, sc.veinScale, 2.4, dt)
  // divine fire + pour-front handed in from the shared store (set by the letterform/pour systems)
  uniforms.uDivine.value    = damp(uniforms.uDivine.value, forge.divine ?? 0, 3, dt)
  uniforms.uDivinePos.value.copy(forge.divinePos ?? uniforms.uDivinePos.value)
  uniforms.uPourFront.value.copy(forge.pourFront ?? uniforms.uPourFront.value)
  const since = performance.now()/1000 - forge.strikeAt
  uniforms.uSurge.value = since >= 0 && since < 1.6 ? Math.exp(-since*3)*0.85 : 0
})
```

The new shared signals — `forge.heat`/`sc.heat`, `forge.divine`/`forge.divinePos`, `forge.pourFront` —
become **the master temperature bus** that the molten pour, sparks, channels and letterforms all write
to and read from (see Section 5).

---

## 5. COHESION — sharing palette, light and uniforms with the world

The whole point of the retune is that the obsidian stops being a self-contained vignette and becomes a
**surface that the rest of the world acts on**. Concretely it shares:

- **Palette.** Same `PAL` 60/30/10. The stone IS the 60 (basalt void). The cool-side counter-mass (30) is
  `crimson`/`crimsonDeep` in the capillary veins. The 10 accent (ember/gold + the new HDR `divine`) is
  the only thing above `1.0`, so **only the molten/divine blooms** — the slab itself never blooms (it's
  cold stone). This is exactly the `post-fx` "only HDR blooms" rule, now enforced by physics: cold basalt
  emits < 1, molten/divine emit > 1.
- **The master temperature system (`uTemp` + `uHeatField`).** One scalar phase (`uTemp`, white→ember→
  forge-red→iron) and one spatial field (`uHeatField`) drive the *cooling color ramp* identically across:
  the slab veins (here), the molten-metal pour material, the letterform fill, and the spark color. Every
  surface that touches metal reads the **same `gwOpal`/cooling mix**, so a vein on the stone and a
  cooling letter share a temperature and never clash. This is the literal cohesion mechanism — a shared
  uniform bus, not per-element palettes.
- **The A/E divine fire as a real light.** The letterforms own `forge.divine` / `forge.divinePos`
  (white-gold HDR, never cools). The slab's COLOR step *receives* it (`uDivine`, exponential falloff,
  Fresnel-biased) so the divine fire **radiates onto adjacent stone and reveals carved ogham** — the
  brief's signature beat. Same `PAL.divine` color the letters emit; same emitter position. Nothing is
  bolted on because the stone is literally lit by the letters.
- **The pour-front.** `forge.pourFront` (UV) is written by the molten-pour system as it travels
  left→right; the slab reads it for a travelling warm wash + kindled veins ahead of the front, so the
  basalt visibly *heats as the metal arrives*. The Celtic-interlace channels are carved into THIS
  material's normal/relief, so the pour and the channel geometry share one surface.
- **Lighting / environment.** Same neutral-cool Lightformer env (`ForgeCanvas.jsx`) for the sharp
  reflection — kept, because cool reflections + warm self-emission is what sells "polished cold stone lit
  only by its own fire." No EXR. The directional key stays cool so the stone doesn't read orange-washed.
- **Motion.** All uniforms dt-damped via `store.js:damp` in the existing `useFrame`, route changes damp
  toward `SCENES` presets (now extended with `heat`) — Atmospheric Drift for the veins, Brutalist-Snap
  `uSurge` for strikes. One rAF, shared `forge.*` state (`motion-feel` law 6).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **No transmission, no extra passes on the slab.** This is the single biggest budget win. The slab is
  `transmission:0`, opaque — zero refraction render passes, unlike `MeshTransmissionMaterial` (which costs
  one full scene re-render *per* transmissive object — Codrops 2025-03-13). Any transmissive jewel
  elsewhere is a *single small mesh* with `samples:4`, `resolution:128` (Codrops downscale trick).
- **Quality tiers honored** (`useQuality` → `high|low|static`, `forge-scene` law):
  - `high`: full fbm (3 octaves), iridescence, `dpr [1,2]`, SMAA + bloom + aberration.
  - `low`: drop the physical `iridescence` to 0 (cosine-opal in-shader still gives play-of-color far
    cheaper), `uBump` lower, `dpr [1,1.4]`, no aberration. Consider a `gw_fbm` 2-octave `#define` swap.
  - `static` (reduced-motion): freeze `uTime` (`=2`), `frameloop='demand'`, no `Effects`, veins lit but
    not animated — content + the lit-stone read survive with no per-frame cost.
- **Keep the loop small.** fbm stays ≤3 octaves; the divine/pour terms are two `exp()` falloffs, cheap.
  Avoid per-pixel branches — the heat gate is a `mix()`, not an `if`.
- **`AdaptiveDpr pixelated`** stays on (already in `ForgeCanvas`) so a frame-rate dip drops resolution
  before it drops frames. `multisampling` 2 only on `high`.
- **Texture/resolution discipline** (Codrops "Building Efficient Three.js Scenes", 2025-02-11): env
  resolution 128 on low / 256 on high; no big textures — the look is procedural, which is the cheapest
  memory profile and ideal for the slab. r3f-perf + spector.js to verify draw-call count stays flat
  (target: the slab adds **zero** extra passes).
- **OLED true-black is free quality.** The crushed-black grade (`BrightnessContrast -0.04`, vignette
  `0.96`) plus the basalt base < 1.0 means the void costs nothing and reads as deep, vivid stone on the
  judge device. The green-black undertone must stay dark enough to crush to black — verify on device, not
  in the headless shot.
- **Fallback:** `CanvasBoundary` static poster on WebGL failure (existing). The reduced tier is the
  graceful degrade; no new failure modes introduced (no FBO, no EXR, no second context).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do them in this sequence — each step is independently verifiable):**

1. **Add palette tokens** (`basalt`, `basaltRim`, `divine`) to `palette.js`. Build green. Trivial, but it
   unblocks every later `v3()` inline.
2. **Swap the base color only** (`#030205` → `PAL.basalt`) and re-tune the cool env so the green-black
   reads as stone, not muddy charcoal. Verify on the **iPhone 15** — green-black vs. true-black is an
   OLED-only judgement; the headless shot will lie. Stop and confirm the "sharp reflection over soft
   interior" signature still reads before touching veins.
3. **Introduce `uHeatField` and gate the veins** with it. Default heat low so the stone is *cold and
   dark*. This is the moment the slab stops being a glowing hero and becomes world-skin — eyeball that it
   looks like dark stone at rest, kindling only on scroll/heat.
4. **Wire the master `uTemp` cooling ramp** through the vein color (white→ember→red→iron). Confirm it
   matches whatever the molten/letterform research lands on — agree the ramp constants **once**, shared.
5. **Add divine + pour reception** (`uDivine`/`uDivinePos`/`uPourFront`). These depend on the
   letterform/pour systems existing; stub `forge.divine`/`forge.pourFront` in the store first so the slab
   compiles and reads sane defaults, then connect for real.
6. **Per-route `SCENES.heat`** rows; damp toward them on nav.

**Pitfalls (the specific ones that bite):**
- **`onBeforeCompile` chunk drift across three versions.** The `#include <normal_fragment_maps>` /
  `<tonemapping_fragment>` anchors can move between releases. Pin three; if you bump it, re-verify the
  three `.replace()` anchors still exist (CI SwiftShader compile catches a *broken* inject as a console
  error — `qa-route`, 0 errors ≈ compiled).
- **`vNormal`/`vViewPosition` availability.** They exist in the *physical* fragment but **not** under
  `FLAT_SHADED** (see `FacetedJewel.jsx`, which uses in-scope `normal`). The slab is smooth-shaded so
  `vNormal` is fine — don't copy the flat-shaded fresnel form here.
- **Green creep.** The brand is warm-forge; the green-black is an undertone, not a hue. If the rim/ambient
  green is visible as *green*, you've overshot — it must read as "cold dark stone," felt not seen. Keep
  `basaltRim` mix ≤ ~0.12 and desaturated.
- **Everything-blooms washout.** If the slab itself glows, you've let the basalt or veins exceed 1.0 at
  rest. Cold stone emits < 1; only molten/divine cross the `luminanceThreshold:0.55`. Fix emissive, never
  crank bloom (`post-fx` rule).
- **Heat field with no source.** If `uHeatField` is driven only by scroll, the stone looks arbitrary.
  Tie it to *actual world heat* (pour-front proximity, A/E presence) so the kindling is motivated.
- **Frame-rate-dependent lerp.** Use `damp(cur,tgt,λ,dt)` everywhere; never `lerp(a,b,k)` — drift will
  desync the slab from the molten/sparks that share the bus.
- **Disposal.** Keep `useEffect(() => () => material.dispose(), [material])`. A route-swapped world skin
  that leaks materials will OOM mobile.

---

## 8. SOURCES (2025-2026)

1. **three.js r178 release notes** — `mrdoob/three.js`, 2025-06-30. WebGL transmission-pass fix; confirms
   `WebGLRenderer` + node/material maintenance continues.
   https://github.com/mrdoob/three.js/releases/tag/r178
2. **three.js r179 release notes** — `mrdoob/three.js`, 2025 (post-r178). WebGPU/post-processing
   trajectory, MaterialX/reflection examples. https://github.com/mrdoob/three.js/releases/tag/r179
3. **three.js r175 release notes** — `mrdoob/three.js`, 2025-03-28. NodeMaterial `compute()`,
   double-side transmission lineage. https://github.com/mrdoob/three.js/releases/tag/r175
4. **"Playing with Light and Refraction in Three.js: Warping 3D Text Inside a Glass Torus"** — Matt Park,
   Codrops, 2025-03-13. `MeshTransmissionMaterial` params (samples, resolution 128–256, ior,
   chromaticAberration, distortion/distortionScale/temporalDistortion) and the per-object extra-pass cost.
   https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
5. **"Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality"** — Niccolò
   Fanton, Codrops, 2025-02-11. r3f-perf/spector.js, texture-size discipline, draw-call budgeting,
   gltfjsx. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
6. **"Three.js magma effect techniques for game visuals"** — ICS Media, 2026-04-09. TSL rim-glow
   (`normalView.dot(positionViewDirection).oneMinus()`), UV-scroll additive glow bands, NodeMaterial
   magma. https://ics.media/en/entry/13973/
7. **"Rendering a Simple Iridescent Material"** — Jaiden Ortiz, Jelly Renders, 2025-11-17. Cosine-palette
   iridescence recipe (`k=6`, `fr/fg/fb = 1.0/1.3/1.7`, base-blend strength) — the cheap play-of-color.
   https://jellyrenders.com/graphics/ray%20tracing/2025/11/17/simple-iridescent-material/
8. **drei `MeshTransmissionMaterial` source** — pmndrs/drei, master (2025). Full prop surface
   (`transmissionSampler`, `backside`, `resolution`/`backsideResolution`, `samples` default 6) for the
   mobile-cost reasoning. https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx
9. **three.js `WebGPURenderer` manual** — threejs.org (2025). States `onBeforeCompile`/`ShaderMaterial`/
   `EffectComposer` are unsupported on WebGPU and "experimental" status — the reason Phase 1 stays WebGL.
   https://threejs.org/manual/en/webgpurenderer
10. **three-fluid-fx — Distortion (WebGL/GLSL and WebGPU/TSL walkthroughs)** — artcreativecode (2025).
    Velocity-field UV displacement for heat-haze; "keep intensity modest, heat-haze = short-lived
    velocity." https://three-fluid-fx.artcreativecode.com/tutorials/glsl/full/distortion/
11. **KHR_materials_iridescence spec** — KhronosGroup/glTF. Belcour/Barla thin-film model behind the
    material's built-in `iridescence`/`iridescenceIOR`/`iridescenceThicknessRange`.
    https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **The shared master-temperature uniform bus.** Spec the exact contract — `uTemp` (scalar cooling
   phase), `uHeatField` (spatial), `forge.divine/divinePos`, `forge.pourFront` — and the canonical
   cooling color ramp (white-hot→orange→forge-red→iron-black) as ONE GLSL function reused by slab,
   molten, letterforms and sparks. This is the cohesion backbone; everything else hangs off it.
2. **Carved-ogham relief + divine-fire reveal.** How the A/E divine light writes legibility onto the
   stone: parallax-mapped/normal-mapped ogham channels in the basalt that are pure-black until the divine
   falloff illuminates them. Bump-vs-parallax-vs-baked-relief tradeoff on mobile.
3. **Celtic-interlace channel geometry on the obsidian surface.** Whether the winding/branching/rejoining
   channels are SDF-carved in the shader normal, baked into geometry, or a flow-map — and how the molten
   pour-front travels them. Tightly coupled to this material's `NORMAL` hook.
4. **TSL/WebGPU port path for the slab.** A spike: re-express the §4.5–4.6 GLSL as
   `MeshPhysicalNodeMaterial` + TSL nodes, measure iOS-Safari WebGPU perf vs. the WebGL build, and decide
   if/when the whole renderer migrates (gated on `EffectComposer`→node-postprocessing port and Effects.jsx
   rewrite).
