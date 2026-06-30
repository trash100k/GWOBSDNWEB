# 05 — Dark Green-Black Irish Basalt PBR Material

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED, one WebGL renderer_

---

## 1. SCOPE

The basalt is the **stone body of the world** — the dark, sacred mass that everything molten is carved into. In the GAELWORX forge it is the **Connemara-marble / Irish-limestone green-black basalt**: a near-black volcanic stone whose true color reads as forged iron until light hits it, at which point a **deep serpentine green** surfaces from inside the rock (the Connemara depth). It is the material of the **channel-hall walls, the casting-room floor, the altar approach, the stone-ledger, and the four plinths** — the negative space the Celtic-interlace channels are cut into and the surface the molten pour flows across. Critically, the basalt is **not uniformly lit**. The world is pure void; the stone is visible only where the **molten metal** and the **A+E divine fire** throw light onto it. The single most important narrative job of this material is the payoff line from the brief: _the green depth only reveals in the AE white-gold light_, and that same light makes the **carved Ogham readable for the first time**. So the basalt must be (a) convincingly heavy igneous rock at grazing OLED viewing, (b) green-black with anisotropic-feeling micro-detail, (c) **driven by the shared master temperature/lighting system** so heat-staining near the channels and divine-fire reveal near the A/E are not decoration but consequences of the same uniforms that drive the molten metal and cooling letterforms.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable approach for getting believable green-black basalt onto a mobile WebGL slab, with honest tradeoffs against _this_ build (one renderer, `MeshPhysicalMaterial` + `onBeforeCompile`, no runtime EXR, iPhone-15 budget).

**A. Photoscanned PBR texture set (albedo / normal / roughness / AO / height), tiled.**
The classic ambientCG / Poly Haven route. Highest baseline realism for free (CC0). The hard costs: VRAM and visible tiling. Don McCurdy's texture-format guidance (updated through 2024–2026) and the 2026 three.js best-practice roundups both stress that an uncompressed 2K PNG set can balloon to **20MB+ of VRAM each**, and a basalt floor needs albedo+normal+roughness+height = 4 maps. On an iPhone 15 that is the difference between a smooth scene and a thermal-throttled one. Mandatory mitigation in 2025/26: **KTX2 / Basis Universal** (ETC1S for albedo/roughness, UASTC for normals) — ~10× GPU-memory reduction and far faster upload. Tiling repetition is solved with **triplanar projection** (no UV seams on carved geometry) plus a low-frequency macro-variation noise. Tradeoff: real bytes on the wire, a decoder (KTX2Loader/transcoder) to wire up, and the green-reveal trick still has to be authored _into_ the albedo or faked in-shader.

**B. Fully procedural in-shader (noise/fbm + domain warping), zero texture bytes.**
Generate albedo, roughness and a bump-normal entirely from `gw_fbm` + domain warp in the fragment shader — exactly the family the slab already uses. 2025/26 sources are emphatic that this is the modern sweet spot for _stone specifically_: Inigo Quilez's domain-warping (re-surfaced and extended through the tuxalin `procedural-tileable-shaders` project and 2025 shader-dev skill writeups) shows **multi-layer fbm warp produces streaked stone — marble, jade, rock strata** — which is precisely the Connemara serpentine-vein look. Zero download, no tiling ever, trivially animatable (heat-staining, the green reveal) because it's all live math. Tradeoff: it _can_ read "too clean / too CG" without grain, it costs ALU per pixel (must keep octaves low — the repo fbm is 3), and true sharp micro-pitting is hard from pure noise. This is the cheapest path that stays 100% inside the existing `onBeforeCompile` pattern.

**C. Hybrid: procedural macro + one tiny tiling detail/grain texture.**
Procedural fbm drives the large-scale green-black color, vein streaks and heat-staining; a single small (512²) KTX2 grayscale **grain/pitting detail map**, triplanar-projected and used only to perturb roughness + normal at high frequency, adds the micro-realism noise can't cheaply fake. This is the approach most 2025 production write-ups converge on for hero stone: procedural where it's cheap and tiling-free, one cheap map where the eye demands real high-frequency detail. Tradeoff: one small asset + decoder, marginally more shader complexity, but by far the best quality-per-byte.

**D. Parallax Occlusion Mapping (POM) for the carved channels / Ogham relief.**
For the _depth_ of the interlace channels and the incised Ogham, real or faux geometry depth matters. 2025/26 three.js shipped a first-class **`parallaxOcclusion` TSL node** (threejs-blocks docs) — adaptive ray-march, min samples at perpendicular view (~24), max at grazing (~96), outputs displaced UV + depth offset. This sells carved stone hard without subdividing geometry. Tradeoff: POM is the single most expensive per-pixel technique here and is grazing-angle hungry; on a phone it must be **high-tier-only**, sample-clamped, and ideally restricted to the channel-hall route where the camera looks straight down. The TSL node currently lives in the WebGPU/TSL lane — in our WebGL `onBeforeCompile` world we'd hand-port a clamped POM loop, not adopt the node directly.

**E. TSL / WebGPURenderer rewrite.**
The whole 2025/26 zeitgeist (Maxime Heckel's TSL field guide, the Codrops WebGPU/TSL run from Mar-2025 through Apr-2026) is moving material authoring to **TSL** — node-based, runs on both WebGPU and WebGL, with parallax/triplanar/noise as composable nodes. Genuinely the future and the cleanest way to express all of the above. Tradeoff for GAELWORX _right now_: the entire scene is a single `WebGLRenderer` + hand-patched `MeshPhysicalMaterial`; swapping to `WebGPURenderer` is a renderer-wide migration with its own mobile-Safari support caveats. **Out of scope for Phase 1; flagged as a Phase-2 deep dive.** We borrow the _ideas_ (POM math, triplanar weighting, domain warp) into GLSL today.

**F. Baked vertex-color / lightmap stone.**
Cheapest of all — bake the green-black and a fake AO into vertex colors or a tiny lightmap. Fine for far background plinths. Useless for the hero green-reveal (it's static; it can't respond to the live AE light). Reserved as the **`static`/reduced tier fallback**.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: C — procedural macro (fbm + domain warp) for color/green-reveal/heat-staining, plus one tiny KTX2 grain map for micro-detail, projected triplanar, with a clamped hand-ported POM pass for carved relief gated to `high` tier.** Authored as a `MeshPhysicalMaterial` patched through the existing `onBeforeCompile` chunk-injection pattern, sharing `GLSL_NOISE`, `PAL`, and the master temperature uniforms.

Why this and not the others, tied to the world + constraints:

- **The green-reveal is a lighting-driven, live effect — it cannot be baked.** The whole point is that the serpentine green only surfaces _where the AE divine fire and molten light fall_. That demands the green to be a function of incoming light intensity in-shader (option B/C territory), not a fixed albedo (A) or a baked color (F). Procedural is the only path that lets the green literally rise out of black as the light term climbs.
- **Tiling-free on carved geometry.** Channels wind, branch and rejoin across non-trivial UVs; triplanar projection (the 2025 consensus for terrain/stone) kills seams with no UV authoring, and procedural macro means the stone _never_ visibly repeats — important on the big channel-hall floor.
- **Stays inside the proven engine.** No second canvas, no EXR, no renderer swap. It's the same `onBeforeCompile` + `${GLSL_NOISE}` + `v3(PAL.x)` recipe the obsidian slab already ships, so it's buildable and verifiable in this codebase today (`shader-fx`).
- **One cheap map buys the realism noise can't.** A single 512² ETC1S grain map (a few KB on the wire) is the honest amount of texture for a hero material; it adds the pitting/specular-break-up that keeps the stone from reading CG, at negligible VRAM.
- **POM is the cherry, correctly gated.** Carved depth is the difference between "texture of stone" and "stone you could cut your hand on," but it's the per-pixel budget hog — so it's `high`-tier and channel-hall-biased only, with a hard sample clamp.

---

## 4. IMPLEMENTATION

### Libraries / versions

- `three` r17x (already in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`.
- `@react-three/fiber`, `@react-three/drei` (existing) — `<Detailed>` for LOD if a plinth needs it.
- `@react-three/postprocessing` (existing) — bloom catches the AE-lit green highlights.
- **New, optional:** the grain map shipped as **`.ktx2`** via drei's `useKTX2` / `KTX2Loader` with the Basis transcoder hosted locally (per three.js KTX2 docs + 2026 best-practice tips). One 512² ETC1S file. If we want **zero new assets for Phase 1**, ship option B (pure procedural) first and add the grain map in a follow-up — the component is written so the map is an optional uniform.

### The shared master uniforms (the contract)

The basalt reads — never writes — the world's master state. These come from `src/store.js` (`forge.*`) exactly like the slab:

```js
const uniforms = useMemo(() => ({
  uTime:      { value: 0 },
  uTemp:      { value: 0 },                       // 0..1 global forge heat (shared)
  uLightAmt:  { value: 0 },                       // 0..1 incoming molten/divine light at this surface
  uAEFire:    { value: new THREE.Vector3() },     // nearest A/E divine-fire pos (world)
  uAEFirePow: { value: 0 },                       // divine-fire intensity (the green-reveal driver)
  uChannelHeat:{ value: 0 },                       // pour-front proximity → heat-staining
  uTriScale:  { value: 1.4 },                     // triplanar tiling frequency
  uGrain:     { value: null },                    // optional KTX2 detail map
  uReveal:    { value: 0 },                        // green-reveal floor (debug/route)
}), [])
```

### HEAD — procedural basalt + triplanar + domain warp (GLSL, injected after `#include <common>`)

```glsl
uniform float uTime, uTemp, uLightAmt, uAEFirePow, uChannelHeat, uTriScale, uReveal;
uniform vec3  uAEFire;
${GLSL_NOISE}                       // gw_snoise / gw_fbm / gw_caustic — reuse, never re-impl

varying vec3 vWPos;                 // world position (set in vertex hook)
varying vec3 vWNrm;                 // world normal

// --- triplanar sample of a procedural scalar field (no textures needed) ---
float gwTriField(vec3 p, vec3 n){
  vec3 w = pow(abs(n), vec3(4.0));            // sharpness 4 → crisp axis blend
  w /= (w.x + w.y + w.z + 1e-5);
  float xy = gw_fbm(p.xy * uTriScale);
  float yz = gw_fbm(p.yz * uTriScale);
  float xz = gw_fbm(p.xz * uTriScale);
  return xy * w.z + yz * w.x + xz * w.y;
}

// --- domain-warped stone: streaked serpentine veins (IQ warp, low octave) ---
float gwBasalt(vec3 p, vec3 n, out float veinMask){
  float q = gwTriField(p, n);                  // base grain
  vec3 wp = p + q * 0.6;                        // warp once (cheap)
  float strata = gwTriField(wp * 1.7, n);       // streaked strata
  veinMask = pow(clamp(1.0 - abs(strata), 0.0, 1.0), 3.0); // serpentine vein streaks
  return q * 0.6 + strata * 0.4;
}
```

### NORMAL — micro-relief from the field + optional grain map (after `#include <normal_fragment_maps>`)

```glsl
float gwH = gwBasalt(vWPos, normalize(vWNrm), gwVein);   // gwVein declared here
// derivative bump — same dFdx/dFdy trick the slab uses, no normal-map texture required
vec3 gwBmp = vec3(dFdx(gwH), dFdy(gwH), 0.0);
#ifdef HAS_GRAIN
  float g = texture2D(uGrain, vWPos.xz * uTriScale * 3.0).r;   // hi-freq pitting
  gwBmp += vec3(dFdx(g), dFdy(g), 0.0) * 0.5;
#endif
normal = normalize(normal - gwBmp * 1.1);
```

### COLOR — green-black body + the AE green-reveal + heat-staining (before `#include <tonemapping_fragment>`)

```glsl
// --- base green-black basalt: forged-iron dark, serpentine green inside ---
vec3 ironBlack = ${v3(PAL.void)};                      // #050507
vec3 serpentine = vec3(0.05, 0.13, 0.09);              // deep Connemara green (kept DARK)
// the green is HIDDEN until light reveals it. uLightAmt = molten+AE light reaching here.
float reveal = clamp(uLightAmt + uAEFirePow + uReveal, 0.0, 1.0);
vec3 stone = mix(ironBlack, serpentine, gwVein * smoothstep(0.05, 0.6, reveal));

// --- AE DIVINE-FIRE white-gold reveal: the green BLOOMS where the A/E light lands ---
float aeFall = 1.0 / (1.0 + dot(vWPos - uAEFire, vWPos - uAEFire) * 0.25);
float ae = uAEFirePow * aeFall;
stone += serpentine * ae * 2.2;                         // green lifts out of black
stone += ${v3(PAL.gold)} * ae * 0.15;                  // white-gold spill onto stone (makes Ogham readable)

// --- heat-staining near the molten channels (shares uTemp + uChannelHeat) ---
float stain = clamp(uChannelHeat * gwVein, 0.0, 1.0);
stone = mix(stone, ${v3(PAL.crimson)} * 0.5, stain * 0.6);          // iron-oxide scorch
stone += ${v3(PAL.ember)} * pow(stain, 3.0) * uTemp * 0.4;          // hottest edges glow

// roughness break-up: veins are slightly polished, stained zones rougher
float rough = mix(0.85, 0.55, gwVein) + stain * 0.2;
// (write into the PBR roughness earlier via roughnessFactor, or modulate here for the look)

diffuseColor.rgb = stone;            // replace albedo; PBR lighting still runs over it
```

### Vertex hook (after `#include <begin_vertex>` / `<worldpos_vertex>`)

```glsl
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNrm = normalize(mat3(modelMatrix) * normal);
```

### Optional POM (high tier only — clamped, hand-ported from the TSL node math)

```glsl
// ~ raymarch the procedural height for carved-channel depth. min 8 / max 24 samples
// on mobile (the TSL node uses 24/96 on desktop — we clamp hard). View-dir in tangent space.
// Bias samples by grazing angle; bail early. Restrict via a #ifdef POM gated by quality==='high'.
```

### r3f component shape

```jsx
export default function BasaltStone({ quality, geometry }) {
  const detailed = quality === 'high'
  const uniforms = useMemo(() => ({ /* …as above… */ }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x050507), metalness: 0, roughness: 0.8,
      envMapIntensity: 0.5,             // stone barely reflects the cool env (vs the glassy slab)
    })
    m.defines = { USE_UV: '' }
    if (detailed) m.defines.POM = ''
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm;`)
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${VERT}`)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${COLOR}`)
    }
    return m
  }, [detailed])
  useEffect(() => () => material.dispose(), [material])
  useFrame((state, dt) => {
    const sc = sceneFor(forge.route)
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    uniforms.uTemp.value = damp(uniforms.uTemp.value, forge.scrollDamped, 3, dt)   // SAME master temp
    uniforms.uLightAmt.value = damp(uniforms.uLightAmt.value, sc.veinGlow ?? 0.3, 2.4, dt)
    uniforms.uAEFirePow.value = damp(uniforms.uAEFirePow.value, forge.aeFire ?? 1.0, 2.4, dt)
    uniforms.uChannelHeat.value = damp(uniforms.uChannelHeat.value, forge.pourFront ?? 0, 3, dt)
  })
  return <mesh geometry={geometry} material={material} />
}
```

Note `#include <color_fragment>` is the correct hook to **replace albedo** (vs the slab's `<tonemapping_fragment>` hook which _adds emissive_) — because basalt is a lit diffuse surface, not a self-emissive one. The green-reveal still works because `uLightAmt`/`uAEFirePow` are fed from the same light sources that the molten/AE emissive uses.

---

## 5. COHESION

The basalt must feel _cut from the same world_ as the molten metal, the cooling letters, and the divine fire. The mechanisms:

- **One master temperature.** `uTemp` here is the **identical** `forge.scrollDamped`-driven value the obsidian slab reads (`ObsidianSlab.jsx:159`). When the world runs hotter, the basalt's heat-staining intensifies in lockstep with the veins glowing — they share a single thermostat, not two parallel ones.
- **Shared palette, shared bloom contract.** Color comes only from `PAL` via `v3()` — `PAL.void` for the iron-black, `PAL.crimson`/`PAL.ember` for scorch, `PAL.gold` for the white-gold spill. The stone deliberately keeps almost all values **< 1 (no bloom)**; only the hottest channel edges and the AE spill push toward the HDR range, so the post `<Bloom luminanceThreshold={0.55}>` (`Effects.jsx:22`) catches _exactly_ the right pixels — the same "only HDR blooms" rule the rest of the world obeys (`post-fx`).
- **The AE divine fire is the keystone shared uniform.** `uAEFire`/`uAEFirePow` are fed by the same A/E letterform light that the typography system emits. So the green-reveal on stone and the Ogham legibility are not a separate effect — they are the basalt's _response_ to the world's brightest light source, guaranteeing the payoff reads as causal, not bolted-on.
- **Channels and pour-front continuity.** `uChannelHeat` is driven by the pour-front position so the stone scorches _just ahead of and beside_ the flowing metal — the molten and the stone share a frontier. The serpentine `gwVein` field can be aligned to the interlace channel direction so the stone's grain and the channels feel carved by the same hand.
- **Material contrast that reinforces the slab.** The basalt is `roughness ~0.8`, `envMapIntensity ~0.5` — matte, barely reflective — the deliberate opposite of the obsidian slab's polished `roughness 0.05` glass. Same cool `<Lightformer>` env (`ForgeCanvas.jsx:35-42`), but the stone _drinks_ that light while the glass throws it back. That contrast is what makes both read as belonging to one lit space.
- **Same noise DNA.** Reusing `gw_fbm`/`gw_snoise` means the stone's grain shares the spatial frequency character of the slab's veins and the embers' motion — a subtle but real cohesion the eye reads as "one world."

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the budget master. The tiering mirrors the existing `useQuality` → `high | low | static` contract (`forge-scene`):

- **`high`:** full procedural color + warp + grain map + clamped POM (8–24 samples, grazing-biased). `dpr [1,2]`. Triplanar at full sharpness.
- **`low`:** procedural color + warp + bump from derivatives, **no POM, no grain map** (or a smaller mip). Drop one fbm octave if needed. `dpr [1,1.4]`.
- **`static` / `prefers-reduced-motion`:** freeze `uTime` (`= 2`, the slab's frozen value), no POM, **green-reveal held at a fixed `uReveal` floor** so the stone still reads green-black without the live light math; `frameloop='demand'`. This is also the option-F baked-feel fallback.

Hard rules:

1. **KTX2 only for the grain map** (ETC1S, 512²). Per three.js KTX2 docs + the 2026 best-practice roundup, this is ~10× the VRAM saving vs PNG and avoids the "200KB PNG → 20MB VRAM" trap. Set the transcoder path once. Ship it via `@pmndrs/assets`-style local bundling, **never a runtime EXR/HDR** (the build's cardinal rule — `fx-resources`).
2. **Keep octaves at 3 max** (the repo `gw_fbm` is already 3). Triplanar means **3× the fbm cost per field** — so compute the field _once_ and reuse `gwH`/`gwVein` across normal and color (the snippets above do this; never sample the field twice).
3. **POM is the throttle risk.** Clamp max samples to ~24 on mobile (desktop TSL node default is 96), early-out, and only enable it on the channel-hall top-down route where the camera angle is near-perpendicular (cheapest POM case). `#ifdef POM` gated by `quality==='high'`.
4. **`<Detailed>` LOD** for the four-plinths and far stone: full shader near, vertex-color/baked far.
5. **No `transmission`/`thickness`** on the stone — it's opaque; those are the slab's expensive features, not the basalt's.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations, and the specific pitfalls:

1. **World-space first, always.** Triplanar and the green-reveal both need **world position + world normal**, not UVs. Set `vWPos`/`vWNrm` in the vertex hook _before_ touching color. Pitfall: using `vUv` will tile and break on carved geometry; using view-space normals breaks the AE falloff. Get the varyings right before anything else.
2. **Hook the right chunk.** Replace albedo at `#include <color_fragment>` (lit diffuse), **not** `<tonemapping_fragment>` (that's emissive — the slab's hook). Wrong hook = the stone glows like lava instead of being lit like rock. This is the most likely copy-paste error given the slab is the reference.
3. **Build the green-reveal as the FIRST visible milestone.** It's the narrative payoff and the hardest thing to retrofit. Wire `uLightAmt`/`uAEFirePow` and prove the green literally rises from black as you ramp them in the `?debug` leva panel _before_ adding grain/POM. If the reveal isn't convincing, nothing else matters.
4. **Compute the field once.** The single most common perf mistake here is sampling `gwBasalt`/`gwTriField` separately in NORMAL and COLOR — that's 6 fbm calls/pixel instead of 3. Declare `gwH`/`gwVein` in NORMAL, reuse in COLOR.
5. **Keep the green DARK.** Connemara green is deep and desaturated; a bright green reads as moss, not basalt, and instantly looks CG. Author `serpentine` low-value (`~0.05,0.13,0.09`) and let it brighten _only_ through the light term. Crushed-black grade (`BrightnessContrast brightness=-0.04`) will eat anything too timid, so tune on-device.
6. **Triplanar sharpness = `pow(abs(n), 4)`.** Too low → mushy blended seams at edges; too high → hard banding. 4 is the 2025 consensus starting point; tune per route.
7. **Verify the SwiftShader way.** `qa-route`: build green + 0 console errors @ 393×852 and 1440×900 ≈ the GLSL compiled. Then the **iPhone 15 OLED read is mandatory** — true-black, the green-reveal, and bloom on the AE spill do not simulate headless (`shader-fx`, `post-fx`).
8. **Dispose on unmount** (`useEffect(() => () => material.dispose())`) and gate POM/grain strictly by tier from day one — retrofitting tiers later is where budgets blow.

---

## 8. SOURCES (2025–2026)

1. **Codrops — "WebGPU Scanning Effect with Depth Maps"** (Mar 31, 2025) — TSL depth-driven UV displacement (parallax) + procedural cell-noise; modular TSL-over-GLSL approach. https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
2. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025) — TSL node materials, noise, surface detail, WebGPU/WebGL dual-target rationale. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
3. **Three.js Blocks — `parallaxOcclusion` (WebGPU/WebGL) node docs** (2025) — adaptive ray-march POM, min 24 / max 96 samples, displaced-UV+depth output. https://www.threejs-blocks.com/docs/parallaxOcclusion
4. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026) — KTX2/Basis, WebGPU adoption, `<Detailed>` LOD, onBeforeCompile variant cost, VRAM budgeting. https://www.utsubo.com/blog/threejs-best-practices-100-tips
5. **Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World"** (Apr 21, 2026) — procedural landscape, compute-driven terrain, the WebGL→WebGPU material story. https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
6. **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text… with Three.js & TSL"** (Jan 28, 2026) — noise-driven TSL material + selective bloom via MRT (cohesion/bloom-gating reference). https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
7. **tuxalin — `procedural-tileable-shaders` (noise + domain warp)** (maintained 2025) — fbmWarp / multi-layer domain warping producing streaked stone, marble, jade, rock-strata; tileable fbm/voronoi/perlin. https://github.com/tuxalin/procedural-tileable-shaders
8. **three.js docs — `KTX2Loader`** (r17x, 2025/26) — Basis Universal transcode, ETC1S vs UASTC, transcoder setup. https://threejs.org/docs/pages/KTX2Loader.html
9. **three.js docs — TSL** (r17x, 2025/26) — `triplanarTexture`, `parallaxOcclusion`, node materials for WebGPU+WebGL. https://threejs.org/docs/pages/TSL.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Clamped POM for carved channels + incised Ogham on mobile.** A focused pass on a hand-ported, sample-budgeted parallax-occlusion loop (vs the TSL node), grazing-angle behavior on the channel-hall top-down camera, and exactly how much depth sells the Ogham reveal without blowing the iPhone-15 frame.
2. **The TSL / WebGPURenderer migration question.** Whether (and when) to move the whole forge to `WebGPURenderer` + TSL so triplanar/POM/noise become composable nodes — including mobile-Safari WebGPU support reality and the dual-target fallback path.
3. **The AE divine-fire → stone light-transport model.** A rigorous treatment of how the white-gold A/E light propagates onto adjacent basalt (falloff, colored bounce, making Ogham legible) so it's physically motivated and shared with the letterform lighting, not faked per-route.
4. **KTX2 detail-atlas + macro-variation strategy.** Authoring the single grain/pitting map (UASTC vs ETC1S), triplanar detail tiling, and a macro low-frequency variation layer that guarantees the big channel-hall floor never reads as repeating.
