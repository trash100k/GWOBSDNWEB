# 01 — Living Molten-Metal Surface Shader

_Phase 1 graphics research · GAELWORX forge world · researched 2026-06-30_

> Target: the viscous, bubbling, ALIVE molten-metal surface — the substance that pours
> from the altar, runs the Celtic-interlace channels, and fills the GAELWORX letterforms.
> It must read as **thick, heavy, incandescent metal**, never thin water. Everything below
> is scoped to THIS codebase: `MeshPhysicalMaterial` + `onBeforeCompile` chunk injection,
> the shared `gw_`-namespaced noise in `src/scene/shaders.js`, the warm `PAL` in
> `src/scene/palette.js`, dt-damped store-coupled uniforms, and the iPhone-15 perf budget.

---

## 1. SCOPE

The molten-metal surface is the **single most important material in the world** — it is the
"living substance" every other element derives from. It is the bright body of the pour
released from the stone altar; it is what flows (slowly, viscously) down the carved
interlace channels in green-black Irish basalt; it is what wells up and fills each Cinzel
letterform left-to-right before that letter begins to cool. It is NOT a pool of water with
an orange tint. It is a **shear-thick, surface-tension-bound, self-illuminating fluid** whose
motion is dominated by slow convection and boil, whose surface skins over and tears, and
whose every bright pixel is the world's only light source (pure-void darkness otherwise).
Because the whole world shares ONE master temperature/material/lighting system, this surface
is also the **canonical owner of the temperature ramp** (white-hot → orange → forge-red →
iron-black) and the **canonical owner of the noise/flow field**; the cooling letterforms, the
channel metal, the basalt rim-light, and the A+E divine-fire all read the SAME `uTemp` and
the SAME domain-warped FBM so nothing looks bolted-on.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every approach below was cross-checked against 2025/2026 sources (full URLs in §8). I rate
each on **quality / perf / mobile / complexity** for our specific constraint: one renderer,
iPhone-15 OLED, no runtime EXR, a flat-ish surface (slab top / channel beds / letter fills),
not a full 3D fluid volume.

### A. Domain-warped FBM as an emissive/displacement field on a stock PBR material
The canonical Inigo Quilez recipe `f(p) = fbm(p + fbm(p + fbm(p)))` (warp.html / fbm.html),
re-surfaced in 2025 TSL noise guides and shader-dev skill repos. You build the heat field
on the CPU-free GPU with 2–3 octaves of simplex, warp the domain once or twice, and use the
result to drive **emissive color (via the temperature ramp)**, **a small vertex bulge** (the
boil), and **a perturbed normal** (the skin). This is exactly the pattern `ObsidianSlab.jsx`
already uses for veins — so it's a known-good fit.
- Quality: **high** for a surface read (not a volume). Quality / Perf: **excellent** / **excellent** (2–3 octaves).
  Mobile: **excellent**. Complexity: **low–medium** — we already have `gw_fbm`.

### B. Per-octave **flow noise** (advected FBM) — the "real lava" upgrade
Ordinary domain warping distorts the whole field once; **flow noise** gives each FBM octave
its **own** drift direction + a per-octave spatially-varying rotation of the gradient, then
mixes back toward a slowly-advancing base point so the field doesn't diverge. This is the
single technique that most reads as "molten lava churning" rather than "noise scrolling." The
2025 shader-dev reference spells it out with tunables (`FLOW_SPEED`, `ADVECTION≈0.77`,
`GRAD_SCALE`, sinusoidal ridged accumulation). It is the heaviest-looking option and the
reason metal looks like it has internal currents.
- Quality: **highest** for "alive." Perf: **good** (6 iterations in the IQ-style loop is the cost;
  we can run 4 on mobile). Mobile: **good with octave LOD**. Complexity: **medium**.

### C. GPGPU / true 2D fluid solver (Stable Fluids, ping-pong velocity+density textures)
`three-fluid-fx` (2025, ships **both** WebGL/GLSL and WebGPU/TSL pipelines) and the
fluid-distortion family give a real advected velocity field — genuinely correct sloshing and
swirl. Overkill and **off-budget** for us: it needs extra render targets, a ping-pong loop,
and a second pass; it fights our "one renderer, content-first, demand frameloop on static"
rule. Worth it only for a hero interactive moment, not the ambient world surface.
- Quality: **highest motion-correctness**. Perf: **expensive** (multiple FBO passes). Mobile:
  **risky**. Complexity: **high**. → **Rejected for the ambient surface; candidate for a single hero beat (deep-dive).**

### D. Metaball / SDF field (lava-lamp style)
The 2026 "Painting with Math: Lava Lamp" article builds the look from **fBM + metaballs +
banded color**. Beautiful for blobs rising through oil, but it reads as **thin and buoyant**,
the opposite of our brief (thick, surface-tension-skinned, flowing in channels). Useful as a
reference for color-banding and for click-spawned heat pools, not as the base surface.
- Quality: high for blobs. Perf: good. Mobile: good. Complexity: medium.
  → **Reference only** (banding + interactive heat pool ideas).

### E. Vertex-only wobble/tilt liquid (chai-cup style)
A spring-damped surface plane (`fillAmount + tilt + wobble + ripple`, `discard` above the
surface) — great for a contained liquid in a cup that sloshes on rotation. It nails the
"lags and overshoots like real fluid" feel but is a **thin-surface** model and doesn't give us
internal convection or boil. We borrow its **spring-damper lag idea** for the pour-front and
for letter-fill, not for the surface texture.
- Quality: medium for our look. Perf: excellent. Mobile: excellent. Complexity: low.
  → **Borrow the lag/overshoot math**, not the look.

### F. WebGPU / TSL rewrite (`MeshPhysicalNodeMaterial`)
Per Maxime Heckel's Oct-2025 _Field Guide to TSL and WebGPU_, TSL lets one shader target
**both** WebGL and WebGPU, and WebGPU is now shipping in iOS Safari. TSL also gives us
`mx_fractal_noise_*` built-ins (used in the 2025 Wawa Sensei GPGPU lesson) for free FBM. This
is where the codebase eventually goes, but **today** our entire scene is GLSL-via-
`onBeforeCompile`; a half-migrated material would be the worst of both. TSL is the **future
port**, not the Phase-1 build.
- Quality: equal. Perf: WebGPU **better** where available, **identical WebGL fallback** otherwise.
  Mobile: improving fast. Complexity: **high migration cost** right now.
  → **Phase-2 port candidate**, not Phase-1.

**Verdict:** the world surface is **A + B + Planck-law color ramp** on a stock
`MeshPhysicalMaterial` via `onBeforeCompile`. C/D/E/F are reserved for specific beats or the
later port.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Build the molten surface as a `MeshPhysicalMaterial` patched through `onBeforeCompile`,
driven by a domain-warped, per-octave-flow FBM heat field, colored by a physically-grounded
temperature ramp (Planck's-law blackbody curve, baked to a tiny constant-array or 1px-row
sampler), with a small vertex boil-bulge, an analytically/`dFdx`-perturbed surface normal for
the skin, and a Fresnel hot-rim.** Justification, point by tight point:

1. **It is the same pattern the slab already ships** (`ObsidianSlab.jsx` HEAD/NORMAL/COLOR
   blocks, `gw_fbm`, `v3(PAL.*)` inlining, `uTime`/`uTemp`/`uSurge` uniforms). Reusing the
   pattern means it inherits PBR lighting, the env reflection, ACES tone mapping, and the
   bloom contract for free — and the team already knows how to read it.
2. **Domain-warp + per-octave flow is what makes metal look THICK.** Thin water has high-
   frequency capillary ripple; thick metal has **low-frequency, slow, advected convection
   cells** with a skin. We get that by keeping `uTime` multipliers tiny (≈0.03–0.08), a high
   `ADVECTION` mix, and a low-frequency warp — explicitly the IQ/flow-noise recipe.
3. **Surface tension reads as a skin, not a mesh.** We fake it with a **rounded, high-contrast
   remap of the heat field** (a `smoothstep` "plateau") so bright cells have flat tops and
   sharp shoulders — the optical signature of a tensioned molten skin — plus a thin darker
   "cooling rind" line where cells meet (the classic lava-crust crack).
4. **One temperature ramp to rule the world.** Owning the Planck ramp here (§4) means the
   letterforms, channel metal, and basalt rim-light sample the identical function with a
   different `uTemp` input — guaranteed cohesion (§5).
5. **It stays inside the budget.** 3 warp octaves + 4 flow iterations on high, dropping to
   2/0 on low and a frozen frame on static. No extra render targets, no second pass, no EXR.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (already in this repo)
- `three` (current r17x in repo; this plan targets the stable WebGL `onBeforeCompile`
  path — no r170 WebGPU features required, so it is forward-safe).
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `leva` (debug),
  `maath` (`damp`). All already present. **No new dependency.**
- Reuse `GLSL_NOISE` from `src/scene/shaders.js` (`gw_snoise` / `gw_fbm`) and `PAL` / `v3`
  from `src/scene/palette.js`.

### 4.2 The shared GLSL — add a flow + ramp block to `shaders.js`
Append these `gw_`-namespaced helpers next to `gw_fbm` so the molten surface, the channels,
and the letterforms all import ONE implementation:

```glsl
// --- domain-warped heat field (IQ warp.html, p = p + 4q + ...) ---
float gw_heat(vec2 p, float t){
  vec2 q = vec2(gw_fbm(p + vec2(0.0, t*0.05)),
                gw_fbm(p + vec2(5.2, 1.3) - t*0.04));
  vec2 r = vec2(gw_fbm(p + 3.0*q + vec2(1.7, 9.2)),
                gw_fbm(p + 3.0*q + vec2(8.3, 2.8)));
  return gw_fbm(p + 3.5*r);            // 0-ish centered; remap below
}

// --- per-octave FLOW NOISE: advected, mixes back to a base point so it can't diverge.
// This is THE term that makes it read as thick churning metal, not scrolling noise. ---
vec2 gw_gradn(vec2 p){
  const float e = 0.09;
  return vec2(gw_snoise(p+vec2(e,0.)) - gw_snoise(p-vec2(e,0.)),
              gw_snoise(p+vec2(0.,e)) - gw_snoise(p-vec2(0.,e)));
}
float gw_flow(vec2 p, float t, int iters){
  float z = 1.4, rz = 0.0; vec2 bp = p;
  for(int i = 1; i < 7; i++){
    if(i > iters) break;                       // octave LOD (4 hi / 2 lo)
    p  += t * 0.06;                            // SLOW main flow (thick)
    bp += t * 0.19;                            // base drift
    vec2 g = gw_gradn(float(i)*p*0.34 + t*0.1);
    p  += g * 0.5;                             // gradient (curl-ish) displacement
    rz += (sin(gw_snoise(p)*7.0)*0.5 + 0.5) / z;
    p   = mix(bp, p, 0.77);                    // ADVECTION — pull back to base
    z  *= 1.4; p *= 2.0; bp *= 1.9;
  }
  return rz;
}
```

### 4.3 The temperature ramp — Planck's-law blackbody, baked
Per the 2025 `plancks-law-colors` project (Planck + CIE→sRGB) and the Unity Blackbody node's
closed-form curve, real heated iron does **not** go through pink — it climbs
iron-black → deep-red → forge-red → orange → yellow-white. We do NOT load an EXR LUT (world
rule). Two cheap options:

- **Constant color array** (recommended for Phase-1 simplicity): inline 5 stops keyed off our
  palette and lerp. This keeps the ramp on-brand AND physically plausible:

```glsl
// temperature 0..1  ->  iron-black ... white-gold. Brand-tied, blackbody-shaped.
vec3 gw_temp(float h){
  vec3 c0 = ${v3(PAL.void)};        // 0.00  cold iron (near void)
  vec3 c1 = ${v3(PAL.crimsonDeep)}; // 0.30  first dull red
  vec3 c2 = ${v3(PAL.red)};         // 0.55  forge red
  vec3 c3 = ${v3(PAL.ember)};       // 0.78  ember orange
  vec3 c4 = ${v3(PAL.hot)};         // 1.00  white-hot (HDR > 1 -> blooms)
  vec3 c = mix(c0, c1, smoothstep(0.00, 0.30, h));
  c = mix(c, c2, smoothstep(0.30, 0.55, h));
  c = mix(c, c3, smoothstep(0.55, 0.78, h));
  c = mix(c, c4, smoothstep(0.78, 1.00, h));
  return c;
}
```

`PAL.hot` is already `(1.9, 1.25, 0.7)` — **above 1**, so only the white-hot zones bloom
(honors the `post-fx` "only HDR blooms" rule). The A+E divine-fire later clamps its input
`uTemp→1` permanently so it never leaves white-gold (§5).

### 4.4 The three injection blocks (mirror `ObsidianSlab.jsx`)

**HEAD** (prepend after `#include <common>`):
```glsl
uniform float uTime, uTemp, uBoil, uViscosity, uSurge;
uniform int   uOctaves;
${GLSL_NOISE}     // gw_snoise, gw_fbm + the gw_heat/gw_flow/gw_temp/gw_gradn added in 4.2/4.3
varying float vMolten;   // skin/heat carried to color
```

**Vertex** (hook `#include <begin_vertex>`) — the BOIL bulge:
```glsl
float h = gw_heat(uv * 2.2, uTime) + gw_flow(uv * 2.2, uTime, uOctaves) * 0.4;
vMolten = h;
// thick metal heaves slowly; viscosity damps amplitude. small bulge only.
transformed.z += h * uBoil * (0.18 - uViscosity * 0.10);
```

**NORMAL** (after `#include <normal_fragment_maps>`) — the SKIN:
```glsl
float hC = vMolten;
vec3 bmp = vec3(dFdx(hC), dFdy(hC), 0.0);
normal = normalize(normal - bmp * (0.6 + uViscosity * 0.5));  // viscous -> sharper skin
```

**COLOR** (before `#include <tonemapping_fragment>`) — TEMPERATURE + tension skin + hot-rim:
```glsl
// surface-tension plateau: flat-topped cells with sharp shoulders = a tensioned skin
float skin = smoothstep(0.15, 0.55, vMolten);
float crust = smoothstep(0.02, 0.0, abs(fract(vMolten*3.0) - 0.5)); // thin cooling rind lines
float heat  = clamp(uTemp * (0.55 + 0.65*skin) - crust*0.25, 0.0, 1.2);
vec3  body  = gw_temp(heat);
// Fresnel HOT-RIM: grazing angles glow hotter (thick incandescent edge)
float fres  = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)),0.0,1.0), 2.5);
vec3  rim   = gw_temp(clamp(heat + 0.25, 0.0, 1.2)) * fres;
gl_FragColor.rgb += (body + rim * 0.6) * (1.0 + uSurge);
```

### 4.5 The r3f component shape (`MoltenSurface.jsx`)
```jsx
export default function MoltenSurface({ quality }) {
  const octaves = quality === 'high' ? 4 : quality === 'low' ? 2 : 1
  const uniforms = useMemo(() => ({
    uTime:{value:0}, uTemp:{value:0.6}, uBoil:{value:1}, uViscosity:{value:0.6},
    uSurge:{value:0}, uOctaves:{value:octaves},
  }), [octaves])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color:new THREE.Color('#1a0602'), metalness:0.85, roughness:0.32,
      // metal: high metalness + mid roughness reads as molten, NOT glassy water
      emissiveIntensity:1, envMapIntensity:0.6,
    })
    m.defines = { USE_UV:'' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${HEAD_V}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT}`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD_F}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    // SHARED master temperature (see cohesion §5): scroll runs the forge hotter
    const target = Math.min(forge.scrollDamped + Math.min(forge.scrollVel,1)*0.25, 1)
    uniforms.uTemp.value = damp(uniforms.uTemp.value, forge.ready ? target : 0.2, 3, dt)
    const since = performance.now()/1000 - forge.strikeAt
    uniforms.uSurge.value = since>=0 && since<1.6 ? Math.exp(-since*3)*0.6 : 0
  })
  // geometry: a subdivided plane (segments gated by quality) for the vertex boil
  return <mesh material={material}>
    <planeGeometry args={[/*w*/, /*h*/, quality==='high'?160:64, quality==='high'?96:40]} />
  </mesh>
}
```

### 4.6 Key uniforms & parameters (leva-tunable behind `?debug`)
| uniform | role | default | thick-metal sweet spot |
|---|---|---|---|
| `uTime` | drift clock | live | frozen=2 on static |
| `uTemp` | **shared master temperature** 0..1 | 0.6 | driven by `forge.scrollDamped` |
| `uBoil` | vertex bulge amplitude | 1.0 | 0.6–1.2 |
| `uViscosity` | thickness; damps bulge, sharpens skin | 0.6 | **0.55–0.8** (high = thick) |
| `uOctaves` | flow-noise LOD | 4/2/1 | 4 hi |
| `uSurge` | strike pulse | 0 | `exp(-3t)` |
| flow `0.06` | main flow speed | — | **keep LOW** (≤0.08) or it reads thin |
| `ADVECTION 0.77` | convection coherence | — | 0.7–0.85 |

### 4.7 Hooking the shared master temperature
There is exactly ONE source of "how hot is the forge right now": `forge.scrollDamped` +
`forge.scrollVel` + the strike pulse in `src/store.js` (the same signals the slab and jewel
already read). `MoltenSurface` damps `uTemp` toward that target with `THREE.MathUtils.damp`
(never frame-rate `lerp`). Every other molten element reads the **same** number, so when the
journey deepens, the whole world heats together.

---

## 5. COHESION — one world, not a bolted-on shader

- **Palette:** every color is `v3(PAL.*)` (void, crimsonDeep, red, ember, hot). No new hex.
  HDR (>1) is reserved for `PAL.hot` so only white-hot zones bloom — same contract as the
  slab and `post-fx`.
- **One noise field:** `gw_heat`/`gw_flow` live in `shaders.js` and are imported by the
  surface, the channel metal, and the letter fills. The pour, the channels, and the letters
  are literally the **same fluid sampled in different UV regions** — they cannot drift apart.
- **One temperature ramp:** `gw_temp(h)` is the world's color authority. The molten surface
  passes a live `uTemp`; the **cooling letterforms** pass a per-letter `uTemp` that ramps
  down left-to-right (a fill-time → cool curve); the **basalt** samples `gw_temp` at low `h`
  and multiplies its rim by the nearest molten cell's brightness so the stone is genuinely lit
  by the metal (the readable-Ogham effect); the **A+E divine-fire** clamps its `gw_temp` input
  to **1.0 forever** (white-gold), so the same function produces "this one never cools."
- **Sparks (`Embers.jsx`)** already use `(1.0,0.45,0.12)` ≈ `PAL.ember`; bias their spawn
  toward the highest-`uTemp` cell of the pour front so they read as "drawn by heat" — same
  field, same color.
- **Lighting/post:** the surface emits into the existing ACES + Bloom chain unchanged; it
  needs no new lights. Its envMapIntensity is low (0.6) on purpose so it reads as **opaque
  incandescent metal**, not a reflective glass pool (the slab keeps the high-reflectivity glass
  look; the molten surface deliberately does not).

The thing that prevents "bolted-on": **shared `shaders.js` functions + shared `PAL` + shared
`uTemp` source**. If any element invents its own noise, color, or heat clock, it will look
foreign — so it must not.

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

- **Octave LOD via `uOctaves`:** flow-noise loop runs 4 iterations on `high`, 2 on `low`, 1
  on `static`. The `if(i>iters) break;` keeps the loop bound constant (`< 7`) so the GLSL
  compiles to a fixed-trip loop on all drivers.
- **Geometry LOD:** plane subdivision 160×96 (high) → 64×40 (low). Vertex boil is the only
  reason for subdivision; if a route shows the surface near-flat/top-down, drop to 32×24.
- **Static tier:** `forge.quality==='static'` freezes `uTime=2` and the canvas runs
  `frameloop='demand'` (already wired in `ForgeCanvas.jsx`) — zero per-frame cost under
  `prefers-reduced-motion` / low power. The frozen frame still shows a fully-lit molten
  surface (a still pour), so no content is lost.
- **No extra passes / targets:** we explicitly reject the GPGPU fluid solver for the ambient
  surface precisely to stay single-pass. Bloom is the only post cost and it's shared.
- **Fragment cost discipline:** `gw_heat` is the expensive call (nested fbm). Compute it
  **once** in the vertex shader, carry via `varying vMolten`, and reuse in fragment — don't
  recompute per-pixel. The fragment then only does the cheap ramp + Fresnel.
- **Fallback:** `CanvasBoundary` already posters a static frame on WebGL failure; the molten
  surface adds nothing new to that path.
- **Verify** with `qa-route`: SwiftShader compiles the GLSL in CI, so 0 console errors ≈ it
  compiled; then the **real read is the iPhone 15 OLED** (bloom spread, true-black void,
  white-hot saturation don't simulate headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**The failure mode is "it looks like thin glowing water / scrolling noise."** Avoid it in this
order:

1. **Slow everything down first.** Before tuning color, set all `uTime` multipliers to
   ≤0.08 and `ADVECTION≈0.77`. Thick metal is defined by SLOW convection. If it looks fast,
   it looks thin — this is the #1 mistake.
2. **Get the temperature ramp on screen before the motion is pretty.** Wire `gw_temp` + a
   static `uTemp` slider and confirm the iron-black→white-gold climb reads right on OLED.
   Color cohesion is harder to retrofit than motion.
3. **Add the surface-tension plateau (`smoothstep` flat-tops) early.** It is what separates
   "metal skin" from "noise." Tune `skin`'s `smoothstep` edges until cells have flat bright
   tops and dark shoulders.
4. **Compute the heat field ONCE (vertex) and share it.** If you recompute `gw_heat` in the
   fragment you'll both blow the budget AND get a normal that doesn't match the bulge.
5. **Keep `metalness` high (≈0.85) and `roughness` mid (≈0.32), `envMapIntensity` LOW.** A
   shiny low-roughness surface reads as glass/water; molten metal is rough-bright-emissive.
   Resist copy-pasting the slab's glassy 0.05 roughness.
6. **Drive `uTemp` from the shared store from day one**, not a local clock — otherwise the
   surface will desync from the letters and basalt and you'll have re-wiring debt.
7. **Only push white-hot zones above 1.0** (`PAL.hot`) so bloom stays surgical; never raise
   bloom intensity to compensate (that washes the whole scene — `post-fx` rule).
8. **Then** layer the per-octave flow noise. Add it last, on top of a working domain-warp
   base, so you can A/B the "alive" delta and keep it tunable per quality tier.

Order of operations summary: **slow base warp → ramp → tension skin → shared-`uTemp` wiring →
normal/boil → flow-noise → HDR/bloom polish.**

---

## 8. SOURCES (2025–2026)

1. Dan Greenheck — _10 Noise Functions for Three.js TSL Shaders_, Three.js Roadmap,
   **2025-12-08**. https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
   (TSL simplex/value/perlin/fbm, octaves=6/lacunarity=2.0/gain=0.5, domain-warp for lava/marble.)
2. Maxime Heckel — _Field Guide to TSL and WebGPU_, **2025-10-14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
   (TSL targets WebGL+WebGPU from one source; WebGPU now in iOS Safari; `glslFn`/`wgslFn`; node system.)
3. Damian Van Der Merwe — _Painting with Math: Building an Interactive Lava Lamp Shader from
   Scratch_, **2026-04-03**. https://damianvandermerwe.com/blog/painting-with-math-lava-lamp-shader
   (fBM amplitude 0.55→×0.42, freq ×1.8, quintic interpolation, metaballs, banded color, click heat pools.)
4. MMqd — _plancks-law-colors_ (Planck's Law → CIE→sRGB temperature gradient, Newton cooling),
   **2025-03-16**. https://github.com/MMqd/plancks-law-colors
   (Physically-based temp→color ramp; exponential temp mapping; emission multiplier guidance.)
5. MiniMax-AI — _skills/shader-dev: procedural-noise & domain-warping references_, repo current
   **2025**. https://github.com/MiniMax-AI/skills/blob/main/skills/shader-dev/reference/procedural-noise.md
   and .../techniques/domain-warping.md
   (Per-octave **flow noise**: `FLOW_SPEED 0.6`, `ADVECTION 0.77`, `GRAD_SCALE 0.5`, ridged accumulation — the thick-lava term.)
6. Thalles Lopes — _Creating Stylized Water Effects with React Three Fiber_, Codrops,
   **2025-03-04**. https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/
   (CustomShaderMaterial vs `onBeforeCompile`; `uTime`-driven Perlin + `smoothstep` banding; shared global store for surface params — the cohesion pattern.)
7. artcodev — _three-fluid-fx_ (drop-in 2D Stable-Fluids; **WebGL/GLSL + WebGPU/TSL** pipelines),
   repo **2025**. https://github.com/artcodev/three-fluid-fx/
   (Velocity/density textures, heat-haze/liquid-lens distortion, GPGPU particle advection — the "real solver" option we benchmark against and reject for the ambient surface.)
8. Wawa Sensei — _GPGPU particles with TSL & WebGPU_ (uses `mx_fractal_noise_vec3` for flow),
   **2025**. https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu
   (TSL built-in fractal noise + compute flow movement — the eventual TSL port path.)
9. Poimandres — _Creating an Interactive Sci-Fi Shield with React Three Fiber_, **2026-04-08**.
   https://pmnd.rs/blog/creating-flow-shield/
   (Layered single-mesh shader: Fresnel rim + flowing noise + hit ring-buffer — the strike/surge-pulse pattern, brand-aligned.)
10. Inigo Quilez — _Domain Warping_ & _fBM_ (canonical `f(p)=fbm(p+fbm(p+...))`; G=0.5, detuned
    octaves), as re-surfaced/cited by the 2025 TSL & shader-dev sources above.
    https://iquilezles.org/articles/warp/ · https://iquilezles.org/articles/fbm/

---

## 9. DEEP-DIVE CANDIDATES (Phase-2)

1. **Per-octave flow noise vs GPGPU Stable-Fluids for the ONE hero pour moment.** The ambient
   surface uses cheap flow noise, but the altar-release "pour" beat may justify a single
   short-lived `three-fluid-fx` velocity field for genuine sloshing. Scope: cost of one extra
   target on iPhone-15, and whether the WebGPU/TSL pipeline can be gated to `high` only.
2. **TSL / `MeshPhysicalNodeMaterial` port of the whole molten/temperature system.** Heckel's
   field guide + the TSL noise library make a single-source WebGL+WebGPU material viable; a
   focused pass should prototype `gw_temp`/`gw_flow` as TSL `Fn` nodes and measure the WebGPU
   win on iOS 18+ Safari vs the GLSL fallback.
3. **The shared temperature/cooling model as a first-class system.** Formalize `gw_temp` +
   Newton's-law-of-cooling (per the Planck repo) into a `temperature.js` module that the
   surface, letterforms, channels, basalt rim-light, and A+E divine-fire all consume — the
   true "master temperature system" the world brief demands.
4. **Surface-tension & crust modeling.** Go beyond the `smoothstep` plateau: a deeper look at
   tensioned-skin shading (flat-top cells, tearing crust lines, the dark cooling rind that
   forms and re-melts) so the metal reads as heavy and skinned at close camera distances in
   the casting-room chamber.
