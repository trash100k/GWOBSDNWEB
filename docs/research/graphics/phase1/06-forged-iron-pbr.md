# 06 — Cooled Forged-Iron PBR with Fire-Scale

_Phase 1 graphics research · GAELWORX forge world · target device iPhone 15 (OLED)_

> The cooled letter surface: forged iron, fire-scale, oxidation bloom, anisotropic brushed-steel
> micro-scratches, deep ember veins glowing through. The L2 forge-light / L3 brutalist material
> language expressed in 3D.

---

## 1. SCOPE

In the GAELWORX world the molten pour fills the **GAELWORX** letterforms left-to-right and then each
letter **cools** through a temperature gradient — white-hot → orange → forge-red → iron-black. This
document owns the *terminal state* of that cooling: the **cold forged-iron skin** that a letter wears
once the fire has left it. It is not the molten metal (that is the pour/displacement system) and not
the divine-fire A and E (those never cool). It is the dark, dense, hammered-iron surface that the rest
of the word settles into — and critically it is **never a flat black**: it carries **fire-scale**
(the blue-grey-to-violet iridescent oxide skin that forms on hot-worked iron), **oxidation bloom**
(rust/heat-tint patches), **anisotropic brushed micro-scratches** that catch the rim light in a single
direction, and **deep ember veins still glowing up through the cracks** — the last heat trapped in the
metal, pulsing faintly. This is the brutalist material made physical: matte, raw, meticulously
engineered, lit only by the forge itself. It must read as the same metal as the molten pour, just
*colder* — sharing one master temperature uniform so a letter can be scrubbed from liquid fire to cold
iron and back on one continuous scale.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

### 2.1 Native `MeshPhysicalMaterial` anisotropy (`anisotropy` + `anisotropyMap`)
Since three.js shipped first-class anisotropy on `MeshPhysicalMaterial`, brushed-metal directional
highlights are a built-in: `anisotropy` (strength 0–1), `anisotropyRotation` (radians from tangent),
and `anisotropyMap` (R/G = direction in tangent/bitangent space, B = strength). The three.js docs are
explicit that this is *the* feature "observable with brushed metals." **The single biggest gotcha** —
confirmed in the r17x-era issue thread #28341 — is that **anisotropy requires tangents**: without
`geometry.computeTangents()` you get garbage reflections (the WestLangley fix). Tradeoffs: highest
fidelity directional specular, IBL-correct, integrates with clearcoat + iridescence for free; but the
per-pixel cost is real (the docs warn `MeshPhysicalMaterial` "has a higher performance cost, per pixel,
than other three.js materials"), and it needs an env map to look like anything.

### 2.2 `onBeforeCompile` chunk injection on a physical material (the repo's house style)
This is exactly how `ObsidianSlab.jsx` and `FacetedJewel.jsx` already work: take a stock
`MeshPhysicalMaterial`, keep all its PBR/IBL/tonemapping, and inject GLSL at `#include <common>`,
`#include <normal_fragment_maps>`, and `#include <tonemapping_fragment>`. For forged iron this lets us
*procedurally* drive `roughness`, perturb `normal` for scratches + scale, and add the ember-vein
emissive — all in one material, no texture downloads. The `repalash/gltf_materials_anisotropy` repo
documents the deeper patch (injecting `BRDF_GGX_Anisotropy` into `lights_physical_pars_fragment` and a
bent-normal into `lights_fragment_maps`) if we ever want anisotropy *and* a custom direction field, but
with native `anisotropy` now in core we mostly don't need that. Tradeoffs: maximum control, zero asset
weight, matches the existing codebase 1:1, SwiftShader-verifiable; but it's WebGL-only (string GLSL) and
brittle against three.js chunk renames.

### 2.3 Textured PBR (baked ARM + normal + anisotropy maps)
The classic AAA route: author/buy seamless 4K PBR sets (base-color, metallic, roughness, normal, plus a
calibrated anisotropy map) — e.g. the brushed-steel sets that ship a dedicated anisotropy channel. The
2025 `aiira-co/three-layered-material` library generalises this into a **Substance-Painter-style layered
material** (base metal + rust overlay + paint chips, each with its own maps, blend modes, and procedural
noise masks for `edgeWear`), which is the cleanest off-the-shelf way to get oxidation bloom + exposed-metal
wear. Tradeoffs: photographic fidelity and art-directable; but it's **the wrong call here** — texture
weight blows the mobile budget (the 2026 Krapton deep-dive flags large uncompressed textures as the #1
mobile-Safari crasher), it can't be continuously driven by a temperature uniform, and it fights the "no
file loads, procedural-only" cohesion of the existing scene.

### 2.4 TSL / `MeshPhysicalNodeMaterial` (WebGPU-first, WebGL-fallback)
The 2025–2026 direction of travel. Maxime Heckel's *Field Guide to TSL and WebGPU* (Oct 2025) notes
WebGPU is "finally gaining widespread support" including recent iOS Safari, and that **TSL compiles to
both WebGPU *and* WebGL from one source**. Dan Greenheck's Three.js-Roadmap material (Dec 2025) lays out
the node slots we'd use: `roughnessNode`, `metalnessNode`, `emissiveNode`, `normalNode`,
`anisotropyNode`, `iridescenceNode`, `clearcoatNode` — each *extends* the lighting model rather than
replacing it. Built-in MaterialX noise nodes (`mx_worley_noise_vec3`, `mx_fractal_noise_vec3`,
`mx_cell_noise_float`) give us fire-scale cells and scratch fbm with no hand-rolled noise. Tradeoffs:
future-proof, cleaner than string GLSL, MRT-emissive bloom is first-class (the `webgpu_postprocessing_bloom_emissive`
example routes emissive through a separate MRT target for a tighter glow); but it would mean a **second
renderer/material path** alongside the existing WebGL `onBeforeCompile` slab — a cohesion and risk cost
this phase shouldn't pay. Park it as the migration target.

### 2.5 Procedural-noise material driven by fbm + Worley (the look engine, renderer-agnostic)
Independent of the above transport choices, *the look itself* is built from layered procedural noise:
**fbm** for the broad heat-tint/oxidation mass, **Worley/Voronoi** for the cellular fire-scale flakes
and crack network, and a **stretched-fbm / marble** function for the directional scratch grain
(Greenheck's "10 Noise Functions" piece, Dec 2025, gives the exact recipes — Worley for "scales/cracked
surfaces," sine-warped fbm for "vein-like patterns"). This is the same family already living in
`src/scene/shaders.js` (`gw_fbm`, `gw_caustic`). Tradeoffs: zero asset weight, fully temperature-driveable,
tileless; needs care to stay cheap (octave count) and to not look "noisy" rather than "forged."

**Verdict:** §2.2 (chunk-injected physical material) as the transport, §2.1 (native anisotropy) for the
brushed highlight, and §2.5 (procedural fbm+Worley) for the look — with §2.4 TSL documented as the Phase-2
migration. §2.3 textured PBR is rejected on mobile/cohesion grounds.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A single chunk-injected `MeshPhysicalMaterial` with native anisotropy, procedural fire-scale, and
emissive ember veins, driven by the shared master-temperature uniform.**

Justification, point by point against the world + constraints:

1. **It is the same material the world already speaks.** `ObsidianSlab.jsx` and `FacetedJewel.jsx` both
   build a `MeshPhysicalMaterial` and inject GLSL at the three canonical hooks. The cooled letter must
   look like *the same forge*, so it shares the material class, the `gw_`-namespaced noise, the `PAL`
   palette inlined via `v3()`, and the dt-damped uniform discipline. Anything textured or TSL-based
   would read as bolted-on.
2. **It is continuously temperature-driveable.** The whole point of the cooling system is one scalar per
   letter (or per-fragment along the fill front) that runs liquid→cold. A procedural material reads that
   uniform every frame; a baked texture cannot. The cooled-iron look is literally `uTemp → 0` of the same
   shader that, at `uTemp → 1`, is white-hot.
3. **It is asset-free.** No EXR, no 4K PBR set, no KTX2 — honouring the hard "no runtime file loads" rule
   and the mobile budget. The fire-scale, oxidation, scratches and veins are all noise.
4. **It bloom-cooperates correctly.** Only the ember-vein cores are pushed into HDR (`> 1`) so the
   existing `Bloom luminanceThreshold={0.55}` catches *only* them — the cold iron body stays matte and
   dark, exactly the brutalist L2/L3 language (1px Ash frame · inner forge-light · hard shadow).
5. **Anisotropy is now native and cheap-enough on the letter geo.** Letterforms are extruded text — flat
   faces and bevels, low tri-count — so `computeTangents()` is trivial and the per-pixel anisotropy cost
   is bounded to the letters, not a full-screen slab.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- **three** r17x+ (whatever the repo pins) — `MeshPhysicalMaterial` with native `anisotropy` /
  `anisotropyMap` / `anisotropyRotation`.
- **@react-three/fiber**, **@react-three/drei** (`Text3D` or a `TextGeometry` for the letterforms;
  `Center` for framing), **@react-three/postprocessing** (existing `Effects.jsx` chain — no change).
- **leva** for `?debug` tuning, matching the existing `useControls` panels.
- Reuse `GLSL_NOISE` from `src/scene/shaders.js`, `PAL`/`v3` from `src/scene/palette.js`, `damp` from
  `src/store.js`. **Add no new dependency.**

### 4.2 The material (chunk-injection, house style)

```js
// ForgedLetter material — cooled iron skin, fire-scale, ember veins.
// Mirrors ObsidianSlab.jsx exactly: physical material + 3-hook injection.

const HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uTemp;       // MASTER: 0 = cold iron, 1 = white-hot (shared scale)
  uniform float uScale;      // surface frequency
  uniform float uScratch;    // brushed-scratch depth
  uniform float uScaleAmt;   // fire-scale oxide amount
  uniform float uOxide;      // oxidation/rust bloom amount
  uniform float uVein;       // ember-vein glow gain
  ${GLSL_NOISE}

  // cheap Worley (cellular) for fire-scale flakes + crack cells
  float gw_worley(vec2 p){
    vec2 n = floor(p), f = fract(p);
    float md = 1.0;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
      vec2 g = vec2(float(i), float(j));
      vec2 o = fract(sin(vec2(dot(n+g, vec2(127.1,311.7)),
                              dot(n+g, vec2(269.5,183.3)))) * 43758.5453);
      md = min(md, length(g + o - f));
    }
    return md; // 0 at cell centre → 1 at edges
  }

  vec3 gwIron;     // base albedo
  float gwRough;   // per-fragment roughness
  float gwVeinM;   // ember-vein mask (0..1)
  float gwScaleM;  // fire-scale mask
  vec3 gwScratchN; // tangent-space scratch perturbation seed

  void gwForge(vec2 uv){
    // anisotropic brushed scratches: noise stretched HARD along U (the brush axis)
    float scr = gw_fbm(vec2(uv.x * 220.0, uv.y * 6.0));        // long thin grain
    scr += 0.5 * gw_fbm(vec2(uv.x * 520.0, uv.y * 9.0));        // finer pass
    gwScratchN = vec3(0.0, scr, 0.0);

    // fire-scale: Worley cells, edges = oxide flake boundaries
    float cells = gw_worley(uv * (8.0 * uScale));
    gwScaleM = smoothstep(0.45, 0.05, cells);                  // flake interiors

    // oxidation bloom: low-freq fbm patches
    float ox = smoothstep(0.2, 0.7, gw_fbm(uv * (1.4 * uScale) + 3.1));

    // deep ember veins: ridged fbm crack network (1 - |fbm|)
    float crk = pow(clamp(1.0 - abs(gw_fbm(uv * (3.0 * uScale)
                          + vec2(0.0, uTime * 0.03))), 0.0, 1.0), 7.0);
    gwVeinM = crk;

    // ---- colour by temperature (shared blackbody-ish ramp) ----
    vec3 ironBlack = ${v3(PAL.ink)};                            // cold body
    vec3 scaleTint = mix(vec3(0.10,0.11,0.14), vec3(0.18,0.10,0.16), ox); // blue-violet oxide
    vec3 rust      = mix(${v3(PAL.crimsonDeep)}, ${v3(PAL.crimson)}, ox);

    gwIron = ironBlack;
    gwIron = mix(gwIron, scaleTint, gwScaleM * uScaleAmt);       // fire-scale skin
    gwIron = mix(gwIron, rust,      ox * uOxide);                // oxidation bloom

    // roughness: scale flakes are duller, scratches glint (lower roughness along grain)
    gwRough = mix(0.62, 0.85, ox);
    gwRough = mix(gwRough, 0.30, smoothstep(0.4,0.9,scr) * uScratch); // bright brushed lines
    gwRough = mix(gwRough, 0.95, gwScaleM * 0.5 * uScaleAmt);
  }
`;

const NORMAL = /* glsl */ `
  gwForge(vUv);
  // perturb the normal for scratch relief + scale edges (dFdx/dFdy like the slab)
  vec3 gwB = vec3(dFdx(gwScratchN.y * 0.5 + gwScaleM * 0.4),
                  dFdy(gwScratchN.y * 0.5 + gwScaleM * 0.4), 0.0);
  normal = normalize(normal - gwB * uScratch);
`;

const COLOR = /* glsl */ `
  // ember veins glow UP through the cracks — HDR so ONLY they bloom.
  // they fade as the letter cools (uTemp low) but never fully die.
  float emberLife = 0.18 + 0.82 * uTemp;            // last heat trapped in iron
  float pulse = 0.6 + 0.4 * sin(gwVeinM * 9.0 - uTime * 1.4);
  vec3 ember = mix(${v3(PAL.red)}, ${v3(PAL.hot)}, uTemp);
  vec3 vein  = ember * gwVeinM * pulse * uVein * emberLife;
  gl_FragColor.rgb += vein;
`;
```

Material construction (note `metalness ≈ 1`, mid roughness, and **native anisotropy** for the brushed
highlight — replacing the obsidian's `clearcoat` glass look):

```js
const m = new THREE.MeshPhysicalMaterial({
  color: PAL.ink.clone(),
  metalness: 0.95,
  roughness: 0.7,
  anisotropy: 0.85,                 // brushed-steel directional spec  (needs tangents!)
  anisotropyRotation: Math.PI * 0.5, // brush runs across the letter
  envMapIntensity: 1.1,
  emissive: new THREE.Color('#1a0703'),
  emissiveIntensity: 1.0,
});
m.defines = { USE_UV: '' };
m.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, uniforms);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${HEAD}`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
    .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`);
};
```

**Critical:** call `letterGeometry.computeTangents()` once after building the `TextGeometry`, or the
native anisotropy renders as artefacts (the #28341 / WestLangley fix). `Text3D`/`TextGeometry` carry UVs,
so `vUv` is available without the `USE_UV` define — but keep the define for safety on the bevel faces.

### 4.3 Key uniforms & parameters

| Uniform | Range | Drives | Source |
|---|---|---|---|
| `uTemp` | 0–1 | **master temperature** — body colour, ember-vein life, scratch glint | shared cooling system, per-letter |
| `uScale` | 0.6–4 | surface frequency (scale/oxide/vein density) | leva, per-route preset |
| `uScratch` | 0–1 | brushed-scratch depth + normal perturb | leva |
| `uScaleAmt` | 0–1 | fire-scale oxide skin amount | leva |
| `uOxide` | 0–1 | oxidation/rust bloom | leva |
| `uVein` | 0–2 | ember-vein glow gain (HDR core → bloom) | leva + `uSurge`-style strike pulse |
| `uTime` | sec | vein pulse + slow oxide drift; **frozen on `static`** | `state.clock` / `2.0` |

### 4.4 The r3f component shape (matches the repo)

```jsx
export default function ForgedLetter({ char, quality, temp }) {
  const uniforms = useMemo(() => ({
    uTime:{value:0}, uTemp:{value:0}, uScale:{value:1.4},
    uScratch:{value:0.7}, uScaleAmt:{value:0.6}, uOxide:{value:0.5}, uVein:{value:1.0},
  }), []);

  const geo = useMemo(() => {
    const g = new TextGeometry(char, { font, /* … */ });
    g.computeBoundingBox(); g.computeVertexNormals();
    g.computeTangents();                 // <-- REQUIRED for anisotropy
    return g;
  }, [char, font]);

  const material = useMemo(() => /* …build as §4.2… */, [uniforms]);
  useEffect(() => () => { geo.dispose(); material.dispose(); }, [geo, material]);

  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime;
    // MASTER temperature: damped toward the per-letter cooling target
    uniforms.uTemp.value = damp(uniforms.uTemp.value, temp, 2.0, dt);
    // strike re-heats the veins briefly (same signal the slab uses)
    const since = performance.now()/1000 - forge.strikeAt;
    const surge = since>=0 && since<1.6 ? Math.exp(-since*3)*0.6 : 0;
    uniforms.uVein.value = damp(uniforms.uVein.value, 1.0 + surge, 4, dt);
  });

  return <mesh geometry={geo} material={material} />;
}
```

### 4.5 Hooking the shared master temperature system
The cooling gradient is **one authority** — a per-letter `temp ∈ [0,1]` derived from the pour-fill
front (the letter that just filled is `1`, older letters decay toward `0`, the A and E are pinned to a
separate divine-fire path and never enter this material). `ForgedLetter` only *consumes* `temp`; it does
not own timing. This is the same pattern as `ObsidianSlab`'s `uTemp`/`uVeinGlow` reading `forge.*`
through `damp`. The body colour ramp in `COLOR`/`HEAD` and `ObsidianSlab`'s
`mix(crimson, ember, …); mix(…, hot, …)` should be **literally the same three stops** (`PAL.crimson →
PAL.ember → PAL.hot`) so molten letters and the slab share one fire curve.

---

## 5. COHESION

- **Palette:** body from `PAL.ink`/`PAL.crimsonDeep`, veins from `PAL.red → PAL.hot`, oxide tints kept
  inside the warm-forge family (a whisper of blue-violet for fire-scale is allowed *only* in the oxide
  skin, low-saturation, never a cool cast on the body). Inlined via `v3()` exactly like the slab. The
  60/30/10 holds: 60 cold iron void, 30 deep crimson oxide mass, 10 ember-vein HDR accent.
- **Lighting:** lit by the **same** `ForgeCanvas` env — the neutral-cool `Lightformer` rig gives the
  brushed anisotropy its directional streak (anisotropy needs an env map; it's already there). No new
  lights. The cold body reflects the cool key as a dark steel; only the veins self-illuminate.
- **Shared uniforms:** `uTemp` is the bridge to molten metal, cooling, and the A+E divine fire (which is
  the same scale clamped high forever). `uTime`, the `forge.strikeAt` surge, and `damp()` are identical
  to the slab/jewel so the whole world pulses on one heartbeat.
- **Channels & basalt:** the ember-vein crack network uses the same ridged-fbm `pow(1-|fbm|, k)` idiom as
  the Connemara basalt channels and the slab veins — so a vein that exits a letter and runs into the
  carved stone channel is *the same primitive*, not a seam.
- **Bloom contract:** veins are the only `> 1` pixels, so `Effects.jsx` blooms them and nothing else —
  the cold iron stays matte, satisfying both the post-fx "only HDR blooms" rule and the brutalist
  "matte body, hard accents" look. No change to the composer.
- **Brutalist L2/L3 in 3D:** L2 forge-light = the inner ember-vein glow bleeding onto the letter's own
  bevels; L3 brutalist snap = the hard, high-contrast cold body with the 8px-shadow equivalent being the
  crushed-black grade already in `BrightnessContrast`. The material *is* the brutalist depth model.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the judge. The 2025 Codrops "Building Efficient Three.js Scenes" piece and the 2026
Krapton mobile deep-dive converge on the same levers — draw calls, texture memory, and per-pixel cost —
and this material is designed to win all three:

- **Zero textures.** Everything procedural → no GPU texture memory, no KTX2/Draco, no white-screen
  resource-exhaustion failure mode Krapton documents on mid-range Safari.
- **Draw calls.** Render the cooled letters as **one `InstancedMesh`/merged geometry** where possible
  (Codrops 2025 instancing + the 2025 drei `Instances` write-up: a thousand letters → ~1 call). At
  worst, one mesh per letter is still ~6 calls for GAELWORX — well under the ~2000 "soft ceiling" the
  r3f forum cites. Share the *one* material across all cold letters; only the per-letter `uTemp` differs,
  so feed temp via an instance attribute, not separate materials.
- **Quality tiers (honour `useQuality`):**
  - `high`: native anisotropy on, 3-octave fbm + 3×3 Worley, normal-perturb scratches, `dpr [1,2]`.
  - `low`: **drop native anisotropy** (the most expensive lobe) → fake the brushed streak with a cheap
    view-dependent term in `COLOR`; 2-octave fbm; skip the finer scratch pass; `dpr [1,1.4]`.
  - `static` (reduced-motion / weak GPU): freeze `uTime` (`= 2.0`), veins become a fixed glow, no surge,
    `frameloop='demand'`. The material still reads correctly as a still.
- **Per-pixel discipline (shader-fx rule):** keep the Worley to a single 3×3, the fbm to 3 octaves, avoid
  per-pixel branches. The `MeshPhysicalMaterial` docs explicitly warn anisotropy/clearcoat stack cost —
  so **don't also enable clearcoat** on the iron (we don't need glass on cold metal; that was the
  obsidian's job).
- **Tangents are one-time:** `computeTangents()` runs at geometry build, not per frame — no runtime cost.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations, and the specific traps:

1. **Build the geometry with tangents first.** `geo.computeVertexNormals(); geo.computeTangents();`
   *before* the material ever touches it. If you skip this, native anisotropy produces the exact
   "broken reflection" artefacts of issue #28341 and you'll waste an hour blaming the shader. Verify with
   `anisotropy = 1` on a plain physical material *before* injecting any GLSL.
2. **Get the env map in before judging the metal.** Anisotropy and the brushed streak are *invisible*
   without the `Lightformer` env. The slab's env is already there — make sure the letters are inside it,
   not gated by a separate Suspense.
3. **Build the look at `uTemp = 0` (cold) first, then verify the ramp to 1.** The cooled state is the
   deliverable; the hot state must fall out of the *same* code so molten↔cold is continuous. Don't author
   two looks.
4. **Push only the vein cores above 1.0.** If the whole letter blooms, you pushed the body emissive too
   high — pull the body to matte and let `PAL.hot` (already HDR) carry the veins. This is the
   single most common "why is it washed out" failure (per the pmndrs bloom thread: bloom only responds to
   `> 1` in a HalfFloat target — the repo's composer already satisfies this).
5. **Keep the oxide cool-tint tiny.** Fire-scale's blue-violet is real metallurgy but a hair too much
   reads as off-brand cool. Cap `uScaleAmt` low and keep the tint desaturated; the body must stay warm-
   neutral iron.
6. **Don't add a second renderer for TSL now.** Tempting after reading the 2025 TSL material — but a
   WebGPU path alongside the WebGL slab is a Phase-2 migration, not a Phase-1 feature. One renderer.
7. **Dispose.** `geo.dispose(); material.dispose()` on unmount (and `EdgesGeometry` if you add glowing
   cut-edges like the jewel). Verify via `qa-route`: SwiftShader compiles the GLSL in CI, so 0 console
   errors ≈ the shader compiled; then read the real metal on the iPhone 15 (anisotropy + bloom + true
   black don't simulate headless).

---

## 8. SOURCES (2025–2026)

1. Maxime Heckel — *Field Guide to TSL and WebGPU* — https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — **2025-10-14**. (TSL/WebGPU one-source-two-targets; iOS Safari WebGPU support; `glslFn`/`wgslFn`.)
2. Dan Greenheck / Three.js Roadmap — *Getting AI to Write TSL That Works* — https://threejsroadmap.com/blog/getting-ai-to-write-tsl-that-works — **2025-12-08**. (`MeshPhysicalNodeMaterial` slot list: `anisotropyNode`, `iridescenceNode`, `emissiveNode`, `roughnessNode`, `metalnessNode`.)
3. Dan Greenheck / Three.js Roadmap — *TSL: A Better Way to Write Shaders in Three.js* — https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs — **2025-12-08**. (Node slots extend the lighting model; emissive glows through transparency; bloom via emissive.)
4. Dan Greenheck / Three.js Roadmap — *10 Noise Functions for Three.js TSL Shaders* — https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders — **2025-12-08**. (Worley for scales/cracks; fbm octaves/lacunarity/gain; sine-warped fbm for veins/grain.)
5. Niccolò Fanton / Codrops — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality* — https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ — **2025-02-11**. (PerformanceMonitor, draw-call reduction, antialias/dpr tradeoffs, instancing.)
6. Matias Gonzalez Fernandez / Codrops — *Three.js Instances: Rendering Multiple Objects Simultaneously* — https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/ — **2025-07-10**. (drei `Instances`, batched meshes, draw-call collapse.)
7. KRAPTON IT Consultancy — *Boosting React Three Fiber Mobile Performance: A Deep Dive (2026)* — https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c — **2026-04-29**. (Mobile-Safari texture-memory crash mode; Draco/KTX2; instancing; OffscreenCanvas.)
8. mrdoob/three.js issue #28341 — *Weird artifacts with MeshPhysicalMaterial when ANISOTROPY > 0* — https://github.com/mrdoob/three.js/issues/28341 — thread incl. **2025** activity. (Anisotropy requires `geometry.computeTangents()`; the WestLangley fix; `anisotropyRotation`/direction.)
9. aiira-co/three-layered-material — https://github.com/aiira-co/three-layered-material — **2025-12-10**. (Layered metal+rust+paint material; procedural noise masks `perlin|voronoi|fbm`; `edgeWear` exposed-metal.)
10. ICS MEDIA — *Three.js magma effect techniques for game visuals* — https://ics.media/en/entry/13973/ — **2026-04-09**. (TSL emissive/rim glow with `normalView.dot(positionViewDirection).oneMinus()`; additive billboards; UV-scroll heat bands.)
11. Faraz Shaikh — *demo-2025-car-paint* (MeshPhysicalMaterial extension: flakes/fresnel/orange-peel) — https://github.com/Faraz-Portfolio/demo-2025-car-paint — **2025-06-11**. (3D-Voronoi flakes driving roughness/metalness; note that micro-**scratches** "proved too expensive… perhaps with WebGPU" — directly informs our cheap-scratch tier.)
12. pmndrs/postprocessing issue #439 — bloom + HDR emissive in HalfFloat targets — https://github.com/pmndrs/postprocessing/issues/439 — referenced for the "only `>1` blooms / `mipmapBlur`" contract the repo already uses.

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **TSL / `MeshPhysicalNodeMaterial` port of the whole forge material system.** A unified node graph
   (`anisotropyNode` + `iridescenceNode` + `emissiveNode` via MRT bloom) that compiles to WebGPU on
   iOS 18 Safari and WebGL elsewhere — replacing the three `onBeforeCompile` materials with one
   renderer-agnostic source. Owns the migration risk: dual-path, device-loss handling, the second
   renderer question.
2. **The master temperature & blackbody curve as a shared module.** A single physically-motivated
   white-hot→iron-black ramp (Wien's-law-flavoured) plus the per-letter cooling-front timing, exported
   as one function consumed by molten, cooling, cold-iron, *and* divine-fire A/E. Defines the literal
   colour stops so nothing in the world drifts off the curve.
3. **Anisotropic brushed steel: native lobe vs. cheap fake, measured on-device.** A/B the native
   `anisotropy` GGX lobe against a hand-rolled view-dependent streak on the iPhone 15 — frame-time,
   visual delta, and the `low`-tier fallback threshold. Resolves the car-paint repo's "scratches too
   expensive" warning with real numbers.
4. **Procedural fire-scale & oxidation authoring.** Worley-cell flake morphology, heat-tint colour
   physics (the blue→straw→violet temper-colour sequence), and crack-network topology that *continues*
   into the basalt channels and divine-fire radiance — so a vein leaving a letter is unbroken across the
   whole world.
