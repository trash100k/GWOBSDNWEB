# 12 — SDF/MSDF Text Rendering for Crisp 3D Type

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED · one WebGL renderer · warm-forge palette_

---

## 1. SCOPE

In the GAELWORX world, type is not chrome laid over a scene — it **IS** the molten event. The hero
moment is the **GAELWORX wordmark in Cinzel Decorative being FILLED, left-to-right, by living metal
poured from the stone altar**: each letterform is a vessel that the pour front sweeps across, and as
the metal settles every letter **cools through the master temperature gradient** (white-hot → ember →
forge-red → iron-black with deep ember veins) — **except the A and E, which hold unearthly white-gold
"divine fire" forever** and radiate light onto the adjacent basalt, making carved **Ogham** legible
for the first time. This single element therefore needs two distinct text jobs from one technique:
(1) **animatable letterform MASKS** that drive the progressive fill + per-letter temperature, crisp at
any scale from a mobile hero to a full-bleed finale; and (2) **carved Ogham** etched into the
green-black Connemara basalt, readable only where the A/E divine-fire light falls. The technique that
serves both — resolution-independent, GPU-cheap, shader-addressable as a distance value — is
**SDF/MSDF text**. This document picks the library, the atlas pipeline, and the exact shader hooks so
the type shares the forge's master temperature/material/lighting system rather than sitting on top of it.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Rendering text in WebGL forces a choice between three families. The Red Blob Games 2026 guide
(updated 1 Jan 2026) lays out the tradeoff matrix cleanly: **vector** (all sizes/characters, no GPU
accel, slow preprocess), **bitmap** (GPU-fast but locked to one resolution → blurry/jagged when
scaled), and **SDF** (all sizes, GPU-accelerated, supports glow/outline/shadow special effects, but
needs a preprocess step and can't do arbitrary characters cheaply). For a forge hero that scales,
rotates in 3D, and needs shader-driven fill — SDF/MSDF is the only family that satisfies all
constraints at once.

**A. Real extruded/filled geometry (`TextGeometry` / `FontLoader.generateShapes`).**
Tessellates each glyph's bezier outline into triangles. Honest 3D depth, real lighting, true bevels.
But Tom Dove's 2025/2026 WebGPU-text writeup (madewithdove.co.uk) confirms the well-known failure mode:
"struggles at scale… relatively high vertex count and slower initial loads… scaling becomes an issue,
as the geometry is made at a fixed resolution so as you zoom into text it becomes jagged unless you
regenerate the geometry with even more sub-divisions." Cinzel Decorative is a high-contrast display
serif with delicate spurs and serifs — tessellating it densely enough to stay crisp at hero scale is a
vertex-count and CPU-parse cost we cannot pay on an iPhone 15 inside a single shared renderer. **Use
geometry only where you genuinely need extruded depth** (e.g. a single chunky finale mark), never for
the scalable, shader-filled body of the wordmark.

**B. Single-channel SDF (Valve-style).** One distance channel; antialias with `fwidth`/derivatives.
Cheap, one texture channel free for other data, and — per Red Blob Games — **actually preferable for
glow/shadow** because a round SDF gives softer, more uniform falloff. Downside: rounded corners on
sharp features unless you push atlas resolution. For a serif's crisp terminals this rounding is
visible. **Verdict: ideal for the soft divine-fire GLOW and the Ogham etch shadow, not for the crisp
fill edge.**

**C. Multi-channel SDF (MSDF, msdfgen / Chlumsky).** Encodes distance into R, G, B and reconstructs
the edge as `median(r,g,b)`, so sharp corners survive at low atlas resolution. This is the modern
default for crisp display type at any scale (Babylon's May 2025 TextRenderer announcement and the
three-msdf-text-utils README both lead with it). Two assets required: a BMFont JSON/`.fnt` (glyph
metrics) + an MSDF atlas PNG. Generated **at build time** (msdf-atlas-gen / msdf-bmfont-xml) or **at
runtime** (three-msdf-text-utils ships an `msdfgen.wasm` worker path). **Verdict: the crisp fill +
mask channel.** GAELWORX should generate atlases **at build time** — runtime wasm generation violates
the "content-first, no heavy runtime loads" budget and adds a worker + wasm payload.

**D. troika-three-text (runtime per-glyph SDF, no pre-baked atlas).** Parses `.ttf/.otf/.woff`
directly with Typr, generates an SDF atlas **on the fly per-glyph in a web worker** (GPU-accelerated
when possible), handles kerning/ligatures/bidi/Arabic, and — critically — **patches any three.js
material** (so you keep PBR lighting, env reflection, fog, tone mapping). It exposes `fillOpacity`,
`outlineWidth/outlineBlur`, `strokeWidth`, and a documented derived-material path. The cost: it's a
larger dependency, the on-the-fly worker generation adds a first-paint beat, and (per the June-2025
three.js forum threads + threejsresources) it is **not WebGPU/TSL-ready** — white-square bugs under
WebGPURenderer. **Verdict: the fastest path to correct serif kerning + a material-patched glyph quad
we can hook — strong candidate if we stay on WebGLRenderer (which this project is).**

**E. three-msdf-text-utils (Léo Mouraire) + the WebGPU forks.** Pre-baked MSDF; rich geometry
attributes (per-letter index, word index, line index, layout UVs) that are gold for progressive fill
and per-letter temperature; exposes `MSDFTextMaterial` (WebGL) **and `MSDFTextNodeMaterial` (TSL /
WebGPU)** with `threshold`, `strokeOutsetWidth`, `strokeInsetWidth`, `isSmooth`/`IS_SMALL`. Tom Dove's
fork `three-msdf-text-webgpu` and `CasulOrnstein/three-msdf-text-webgpu` add DOM-element sync and TSL
materials. The Codrops "Gommage" tutorial (28 Jan 2026) builds its entire dissolving-MSDF-text effect
on this stack with TSL. **Verdict: best pre-baked option, future-proof toward WebGPU, and its layout
UVs are exactly what the left-to-right pour needs.**

**F. countertype/three-text (new, alpha, Nov 2025).** HarfBuzz shaping + Knuth-Plass justification +
**two pipelines**: mesh (extrudable) and **vector** (resolution-independent GPU outlines via
per-fragment curve evaluation). Variable-font support, R3F adapter. Genuinely exciting for
high-fidelity serif justification, but **explicitly alpha with "API may break rapidly… until summer
2026"** — too volatile for a hero we must nail first time. **Verdict: watch for Phase 2, do not ship.**

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pre-baked MSDF atlas of Cinzel Decorative (900), rendered through a hand-patched
`MeshPhysicalMaterial` glyph plane — the same `onBeforeCompile` chunk-injection pattern the obsidian
slab already uses — driven by the shared `forge.*` store.** Concretely:

- **Wordmark fill + per-letter temperature → pre-baked MSDF** (msdf-atlas-gen at build, served from
  `/public/fonts/`), drawn on per-glyph quads carrying a **layout-U attribute** (0→1 across the whole
  wordmark) so a single `uPourFront` uniform sweeps the fill left-to-right. We render it through a
  **patched physical material** (not a raw `RawShaderMaterial`) so the metal fill participates in the
  same env reflection, tone mapping (ACES), and bloom threshold as the slab — this is the cohesion
  lever. The MSDF `median` gives us the crisp glyph edge; the `forge` master temperature ramp colors
  the inside.
- **A/E divine fire → same atlas, a per-glyph `uDivine` flag** set on the first A and first E of each
  word (mirroring the DOM `.forge-letter` rule in `BrandText.jsx`). These letters skip the cooling
  ramp, stay white-gold HDR (>1 so they bloom — see `post-fx`), and **write into a light contribution**
  that the basalt/Ogham reads.
- **Carved Ogham → a single-channel SDF** (channel B / round SDF) of the Ogham strokes, etched into the
  basalt via the **existing `shader-fx` normal-perturb + emissive pattern**, with visibility gated by
  the A/E divine-fire light term so it "appears for the first time."

**Why this pick (tied to the world + constraints):**
1. **Crisp at every scale** — MSDF is resolution-independent (Red Blob Games; Babylon 2025), so the
   wordmark holds razor serifs from a 393px hero to a full-bleed finale without re-tessellation. Cinzel
   Decorative's high-contrast serifs are exactly the case where MSDF beats single-SDF (sharp corners).
2. **The fill is just a threshold animation** — progressive fill, the literal core of the brief, is one
   uniform (`uPourFront`) compared against a per-glyph layout-U. No geometry swaps, no CPU work
   per-frame. This is "SDF threshold animation for progressive fill" done the cheap, correct way.
3. **One renderer, one material family** — patching a physical material (not a bolt-on shader material)
   keeps the type inside the slab's lighting/tone/bloom pipeline. The metal in the letters is literally
   the same material response as the metal in the veins.
4. **Mobile budget** — pre-baked atlas = zero runtime font parse, zero wasm, one texture, one draw
   call per text block, low vertex count (one quad per glyph). This is the lightest correct option.
5. **WebGL today, WebGPU-ready tomorrow** — pre-baked MSDF + layout attributes map 1:1 onto
   `MSDFTextNodeMaterial`/TSL (Codrops Gommage, Jan 2026) if/when the renderer migrates, so the asset
   pipeline survives a WebGPU move.

**The honest fallback:** for the very first build, **troika-three-text is acceptable** for the
wordmark because it nails Cinzel kerning/ligatures with zero atlas tooling and patches a physical
material out of the box (`fillOpacity` + a derived material for the threshold). Ship troika to prove
the look, then swap to the pre-baked MSDF atlas for the perf win and the layout-U attribute that makes
the pour cleaner. Both share the same conceptual hooks below.

---

## 4. IMPLEMENTATION

### Libraries / versions
- **Atlas (build-time):** `msdf-atlas-gen` (Chlumsky) **or** `msdf-bmfont-xml` (soimy) — e.g.
  `msdf-bmfont -t msdf -f json -s 48 -r 4 -m 1024,1024 -o public/fonts/cinzel-msdf public/fonts/CinzelDecorative-Black.ttf`. `-t msdf`, `-s 48` cap height, `-r 4` distance range (px), charset limited to
  `GAELWORXMaevYdSlptC` + Ogham glyphs to keep the atlas to a single 1024² (or smaller).
- **Runtime text geometry:** `three-msdf-text-utils` (Léo Mouraire) — `MSDFTextGeometry` (gives
  per-letter / per-line layout UV attributes) + `MSDFTextMaterial` as a reference, **but we patch a
  `MeshPhysicalMaterial` ourselves** for cohesion (below). On WebGL.
- **R3F:** existing `@react-three/fiber` + `drei`. No new canvas.
- **Fallback path:** `troika-three-text` (`<Text>` via drei or direct) for first-build correctness.

### The r3f component shape
Mirror `ObsidianSlab.jsx` / `FacetedJewel.jsx` exactly: `useMemo` geometry + material, `onBeforeCompile`
chunk injection, `useFrame` dt-damped uniforms from `forge`, dispose on unmount, gated by `quality`.

```jsx
// src/scene/ForgeWordmark.jsx  (sketch)
import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MSDFTextGeometry } from 'three-msdf-text-utils'
import fontData from '/public/fonts/cinzel-msdf.json'        // BMFont metrics
import { forge, range, damp } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

export default function ForgeWordmark({ quality }) {
  const atlas = useTexture('/fonts/cinzel-msdf.png')         // pre-baked; NOT EXR — fine
  atlas.minFilter = atlas.magFilter = THREE.LinearFilter     // never NEAREST on MSDF

  const geo = useMemo(() => {
    const g = new MSDFTextGeometry({ text: 'GAELWORX', font: fontData, letterSpacing: 0 })
    // tag the first A and first E (indices known from the string) as divine
    const N = g.attributes.position.count
    const divine = new Float32Array(N)
    // ...set 1.0 on verts belonging to glyph index 2 (E) and the first A...
    g.setAttribute('aDivine', new THREE.BufferAttribute(divine, 1))
    return g
  }, [])

  const uniforms = useMemo(() => ({
    uMap:        { value: null },
    uTime:       { value: 0 },
    uPourFront:  { value: 0 },   // 0..1 sweep across the wordmark
    uTemp:       { value: 0 },   // master forge temperature 0..1
    uVeinGlow:   { value: 0 },
  }), [])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      transparent: true, metalness: 0.0, roughness: 0.25,
      envMapIntensity: 1.2, color: new THREE.Color('#060305'),
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      uniforms.uMap.value = atlas
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${MASK}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [atlas, uniforms])

  useEffect(() => () => { geo.dispose(); material.dispose() }, [geo, material])

  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    // POUR FRONT tracks the journey scroll — the metal fills as you descend.
    const target = forge.quality === 'static' ? 1 : range(forge.scrollDamped, 0.05, 0.45)
    uniforms.uPourFront.value = damp(uniforms.uPourFront.value, target, 2.4, dt)
    uniforms.uTemp.value      = Math.min(forge.scrollDamped + forge.scrollVel * 0.25, 1)
    uniforms.uVeinGlow.value  = damp(uniforms.uVeinGlow.value, forge.ready ? 0.85 : 0, 3, dt)
  })

  return <mesh geometry={geo} material={material} scale={0.012} position={[-3.4, 0, 0.31]} />
}
```

### The GLSL (patched physical material — same convention as the slab)

```glsl
// HEAD — prepended after <common>
uniform sampler2D uMap;
uniform float uTime, uPourFront, uTemp, uVeinGlow;
varying float vDivine;          // pass aDivine through the patched vertex shader
${GLSL_NOISE}
float gw_median(vec3 m){ return max(min(m.r,m.g), min(max(m.r,m.g), m.b)); }
```

```glsl
// MASK — after <map_fragment>: reconstruct the crisp glyph edge from MSDF
vec3 msdf = texture2D(uMap, vMapUv).rgb;
float sd  = gw_median(msdf) - 0.5;                 // signed distance to edge
float aa  = fwidth(sd);                             // screen-space AA, scale-independent
float glyph = clamp(sd / aa + 0.5, 0.0, 1.0);      // 1 inside, soft 1px edge
if (glyph < 0.01) discard;                          // outside the letter — kill it
diffuseColor.a *= glyph;                            // crisp alpha for the whole letter
```

```glsl
// COLOR — before <tonemapping_fragment>: the FILL + COOLING + DIVINE FIRE
// progressive fill: vLayoutU is 0..1 across the wordmark (from geometry layout UVs)
float filled = step(vLayoutU, uPourFront);          // 1 where metal has arrived
float front  = smoothstep(uPourFront-0.04, uPourFront, vLayoutU); // hot leading edge

// MASTER TEMPERATURE RAMP — identical color stops to the slab's body→core
float heat = clamp((1.0 - vLayoutU + uPourFront) * uTemp + front, 0.0, 1.0);
vec3 ironBlack = ${v3(PAL.ink)};
vec3 forgeRed  = ${v3(PAL.crimson)};
vec3 ember     = ${v3(PAL.ember)};
vec3 whiteHot  = ${v3(PAL.hot)};                    // HDR > 1 -> blooms
vec3 metal = mix(ironBlack, forgeRed, smoothstep(0.0,0.4,heat));
metal = mix(metal, ember,    smoothstep(0.4,0.75,heat));
metal = mix(metal, whiteHot, smoothstep(0.75,1.0,heat));

// ember veins inside the cooled metal (shares gw_fbm with the slab)
float vein = pow(clamp(1.0 - abs(gw_fbm(vMapUv*6.0 + uTime*0.05)), 0.0, 1.0), 5.0);
metal += ember * vein * 0.4 * (1.0 - heat);         // veins read in the cool iron-black

// DIVINE FIRE — A and E never cool; eternal white-gold, HDR, always full
vec3 divine = mix(whiteHot, ${v3(PAL.gold)}, 0.4 + 0.2*sin(uTime*1.3));
metal = mix(metal, divine * 1.6, vDivine);          // > 1 so it blooms forever

gl_FragColor.rgb += metal * filled * uVeinGlow;     // additive emissive, pre-tonemap
gl_FragColor.a   *= max(filled, vDivine);           // unfilled glyph stays dark/empty
```

### Key uniforms & parameters
| Uniform | Range | Drives |
|---|---|---|
| `uPourFront` | 0→1 | left-to-right fill sweep (scroll-coupled) |
| `uTemp` | 0→1 | master temperature; same signal the slab uses (`forge.scrollDamped`+vel) |
| `aDivine` (attr) | 0/1 | per-glyph A/E flag → eternal white-gold |
| `vLayoutU` (attr) | 0→1 | glyph position across wordmark (from MSDF layout UVs) |
| `uVeinGlow` | 0→2 | emissive intensity, damped, gated by `forge.ready` |
| atlas `distanceRange` | 4px | must match the `-r` you baked; drives `fwidth` AA correctness |

**Hooking the master system:** `uTemp` and `uVeinGlow` read the **same `forge.scrollDamped` /
`forge.scrollVel` / `forge.strikeAt`** signals the obsidian slab reads in its `useFrame`. The pour
front advances with the journey scroll. A `strikeAt` pulse (headline arrival) can spike `uPourFront`
or flare `uVeinGlow` so the wordmark reacts to the same beats as the slab veins and the jewel edges —
**one nervous system, three organs.**

---

## 5. COHESION

Nothing here is a new visual vocabulary — it is the slab's vocabulary applied to letterforms:

- **Palette:** every color comes from `src/scene/palette.js` via `v3(PAL.x)` — `PAL.ink`/`PAL.crimson`
  for cooled iron, `PAL.ember` for the active heat, `PAL.hot`/`PAL.gold` (HDR >1) for the white-hot
  pour front and the eternal A/E. No new hex anywhere. This is exactly the slab's `body→core` ramp
  (`crimson → ember → hot`) reused, so the metal in the letters reads as the **same alloy** as the
  metal in the veins.
- **Noise:** the ember veins inside the cooled letters use the shared `gw_fbm` from `shaders.js` — the
  same field that veins the obsidian — so the texture grain is continuous between letterform and slab.
- **Lighting / material:** because we patch `MeshPhysicalMaterial` (not a `RawShaderMaterial`), the
  letters take the same drei `<Lightformer>` env reflection and the same `ACESFilmicToneMapping` as the
  slab. The cooled iron-black of a letter reflects the forge the way the obsidian does.
- **Bloom is the shared finish:** the white-hot pour front and the A/E divine fire are pushed **above
  1.0** (HDR) precisely so they — and only they — cross the `Bloom luminanceThreshold={0.55}` in
  `Effects.jsx` (`post-fx` rule: "only HDR blooms"). The divine A/E glow and the molten leading edge
  bloom with the same character as the vein cores; the cooled iron does not. **This is the single most
  important cohesion lever** — it ties the type's glow to the entire world's glow budget.
- **A/E rule = brand law in 3D:** the `aDivine` flag is the 3D twin of the DOM `.forge-letter` /
  `<BrandText>` rule (first A + first E per word, per `CLAUDE.md`). Same letters ignite in the canvas
  as in the prose, so the wordmark on the slab and the wordmark in the headline obey one rule.
- **Sparks / channels (sibling elements):** the pour front (`uPourFront` position in world space) is
  the natural emitter origin for the heat-drawn sparks (`forge.emit`) and the visual destination of the
  Celtic-interlace channels — the letters are where the channels deliver metal **to**. Exposing the
  front's world position lets the Embers/Atmosphere system orbit sparks around the live fill edge.
- **Ogham + basalt:** the carved Ogham uses the **same `shader-fx` normal-perturb + emissive idiom** as
  the slab's bump (`normal = normalize(normal - gwBmp*uBump)`), and its readability is driven by the
  A/E `divine` light term — so the "Ogham becomes legible" beat is literally lit by the same value that
  makes the A/E glow. The stone, the carving, and the divine light are one coupled system.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the judge; the budget is one shared renderer and content-first paint.

- **Pre-bake the atlas, do not generate at runtime.** A single ~1024² (or 512² for the limited
  charset) MSDF PNG + a small JSON is a tiny, cacheable asset; runtime wasm/worker SDF generation
  (troika, three-msdf-text-utils wasm path) costs a first-paint beat and extra payload. Limit the
  charset to the letters GAELWORX actually renders (`GAELWORXMaeveYdSlptC` + Ogham) → smaller texture,
  smaller draw.
- **One quad per glyph, one draw call per block.** This is the whole perf argument for SDF over
  geometry (Tom Dove 2025/2026): simple geometry, no per-zoom re-tessellation, the shape lives in the
  shader. Vertex count for `GAELWORX` is trivial.
- **`fwidth`-based AA is free and scale-correct.** No MSAA needed for the text edge; the derivative AA
  in the `MASK` block stays a clean ~1px regardless of distance/zoom (Red Blob Games' `u_antialias_per_em`
  reasoning). Keep `LinearFilter` on the atlas — **NEAREST destroys MSDF**.
- **Quality tiers (honor `useQuality`):**
  - `high`: full patched physical material, ember veins (`gw_fbm` 3 octaves), divine-fire shimmer,
    Ogham normal-perturb, bloom.
  - `low`: drop the in-letter `gw_fbm` veins (constant cool color), keep MSDF mask + temperature ramp +
    divine fire; Ogham emissive without normal perturb.
  - `static` (reduced-motion): **freeze `uTime=2`, set `uPourFront=1`** (fully filled end-state), no
    shimmer. `frameloop='demand'` already handles the rest. Crawlers/no-JS still get the real wordmark
    from the DOM (`BrandText`), so the 3D is pure enhancement.
- **Texture cost:** one MSDF atlas, `LinearFilter`, no mips needed (SDF is already mip-friendly but for
  a hero-scale wordmark mips are optional). `colorSpace = NoColorSpace`/`LinearSRGBColorSpace` on the
  atlas — **MSDF data is not sRGB color**, treating it as sRGB warps the distances and fuzzes edges.
- **No second canvas, no EXR.** The atlas PNG is a normal texture load (allowed); never an `.exr`/`.hdr`
  (the `forge-scene` black-canvas scar). Dispose geometry+material on unmount.
- **Fallback:** `CanvasBoundary` already posters on WebGL failure; the DOM wordmark is the LCP, the 3D
  fill is enhancement — so a perf-starved device degrades gracefully.

---

## 7. GET-IT-RIGHT-FIRST-TIME

The order of operations that avoids the classic MSDF traps:

1. **Bake the atlas first, verify it in isolation.** Generate with msdf-atlas-gen, then render a plain
   white-on-black `median(rgb)>0.5` quad before touching the forge shader. Confirm crisp serifs.
   **Record the `distanceRange` (`-r`) value — the shader's `fwidth` math must match it.**
2. **Atlas texture settings are the #1 silent bug:** `LinearFilter` (NEVER `NearestFilter`), and
   **NOT sRGB** (`texture.colorSpace = THREE.NoColorSpace`). Getting either wrong gives "blurry/fuzzy
   MSDF that looks broken for no reason." Fix this before debugging anything else.
3. **Use the median, not a single channel.** `max(min(r,g),min(max(r,g),b))`. A single-channel read
   reintroduces the rounded corners MSDF exists to fix — your Cinzel serifs will look soft.
4. **AA via `fwidth(sd)`, not a fixed smoothstep width.** A hardcoded edge width breaks the moment the
   wordmark scales or tilts in 3D (it will, with the camera rig). `clamp(sd/fwidth(sd)+0.5,0,1)` stays
   ~1px at every scale.
5. **Patch a physical material, don't roll a `RawShaderMaterial`.** Same reason as the slab: you keep
   env reflection, tone mapping, and the bloom threshold pipeline — which is the entire cohesion plan.
   Add `m.defines = { USE_UV: '' }` so `vUv`/map UVs exist (slab already does this).
6. **Get `vLayoutU` right or the pour is wrong.** The progressive fill needs a per-glyph "position
   across the whole wordmark" attribute — use `three-msdf-text-utils`' layout UVs (or compute glyph
   centroids). Don't reuse the per-glyph atlas UV (that's 0..1 *within each letter* and would fill every
   letter simultaneously).
7. **HDR the things that must bloom, nothing else.** White-hot front + A/E divine fire go `>1`; cooled
   iron stays `<1`. Don't crank bloom intensity to make letters glow (washes the scene — `post-fx`
   rule). Push emissive instead.
8. **Tie `aDivine` to the brand rule, exactly.** First A + first E per word only (`CLAUDE.md`). Hardcode
   the glyph indices for `GAELWORX` (A at index 2 is the divine A; E at index 1 is the divine E — verify
   against the actual string) so it matches the DOM `<BrandText>`.
9. **Verify the way the project verifies:** `npm run build` green, then `qa-route` at 393×852 + 1440×900
   with **0 console errors** (SwiftShader compiles the GLSL in CI, so a shader typo surfaces here). Then
   read the real bloom + true-black on the iPhone 15 — the fill's heat ramp and the divine-fire bloom do
   not simulate in the headless shot.
10. **Ship troika first if time is short, swap to baked MSDF for the win.** Both expose the same hooks;
    proving the look on troika de-risks the atlas pipeline work.

---

## 8. SOURCES

1. **Red Blob Games — _Guide to SDF+MSDF Fonts_** (1 Jan 2026) — vector/bitmap/SDF tradeoff matrix,
   distance-to-color mapping, `aemrange`/`distanceRange`, `fwidth` antialiasing, when single-SDF beats
   MSDF (glow/shadow). https://www.redblobgames.com/articles/sdf-fonts/
2. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_**,
   Thibault Introvigne (28 Jan 2026) — modern MSDF-in-three.js + TSL workflow, noise-driven dissolve,
   selective bloom via MRT; three.js `0.181.0`, WebGPURenderer.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
3. **countertype/three-text** (created 2 Nov 2025, last push 5 Jun 2026) — HarfBuzz shaping +
   Knuth-Plass, mesh vs vector GPU-outline pipelines, R3F adapter, variable fonts; alpha API warning
   "until summer 2026." https://github.com/countertype/three-text
4. **leochocolat/three-msdf-text-utils** (README state surfaced 2025–2026) — `MSDFTextGeometry` layout
   attributes (letter/word/line index, layout UVs), `MSDFTextMaterial` (WebGL) +
   `MSDFTextNodeMaterial` (TSL/WebGPU), runtime wasm atlas option, `IS_SMALL`/`threshold`/stroke params.
   https://github.com/leochocolat/three-msdf-text-utils
5. **Tom Dove — _Rendering text in Three.js using WebGPU_** (madewithdove.co.uk, 2025/2026) —
   FontLoader-geometry scaling/vertex-count failure mode, why Troika SDF (one quad + shader) wins,
   move to three-msdf-text-utils + TSL, DOM-sync fork. https://www.madewithdove.co.uk/blog/webgpu-text
6. **Babylon.js Forum — _MSDF Text renderer_** (13 May 2025) — MSDF rationale (3-channel sharp corners
   at any scale), GPU-accelerated text renderer, `thicknessControl`, stroke inset/outset width, billboard.
   https://forum.babylonjs.com/t/msdf-text-renderer/58406
7. **troika-three-text docs + npm** (current 2025/2026) — runtime per-glyph SDF, material patching,
   `fillOpacity`/`outlineWidth`/`outlineBlur`, worker + GPU-accelerated SDF generation, derived-material
   path. https://protectwise.github.io/troika/troika-three-text/ ·
   https://www.npmjs.com/package/troika-three-text
8. **Chlumsky/msdf-atlas-gen** (build-time atlas generator) + **soimy/msdf-bmfont-xml** — TTF/OTF →
   packed MSDF atlas + BMFont JSON/`.fnt`, charset/size/distance-range flags.
   https://github.com/Chlumsky/msdf-atlas-gen · https://github.com/soimy/msdf-bmfont-xml
9. **three.js forum / threejsresources — _Troika three text and WebGPU_** (June 2025) — Troika's WebGPU
   incompatibility (white-square bug), three-msdf-text-utils as the WebGPU/TSL replacement.
   https://discourse.threejs.org/t/troika-three-text-and-webgpu/55737 ·
   https://threejsresources.com/tool/three-msdf-text-webgpu

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Progressive-fill addressing: per-glyph layout-U vs world-space pour-plane.** The brief's
   left-to-right fill can be driven by a 1D layout attribute (simple) or by a **world-space pour plane**
   that follows the actual Celtic-interlace channel path and fills letters in channel order (cohesive
   with the channels, but harder). Worth a dedicated pass on which reads as "metal arriving" vs "a wipe."
2. **Carved Ogham as SDF relief on basalt — single-SDF glow + parallax-occlusion etch.** How to bake
   the Ogham SDF, drive its legibility purely from the A/E divine-light term, and add believable carved
   depth (normal perturb vs POM) within the mobile budget. Ties directly to the basalt material research.
3. **WebGPU/TSL migration path for the type layer.** `MSDFTextNodeMaterial` + TSL (Codrops Gommage,
   Jan 2026) and the `three-msdf-text-webgpu` forks — what the wordmark shader looks like in TSL, the
   2–10× draw-call win, and whether the whole forge moves to `WebGPURenderer` (and what breaks: Troika,
   `onBeforeCompile`).
4. **High-fidelity serif justification + variable-weight play with countertype/three-text.** Once it
   stabilizes (post summer-2026), its HarfBuzz + Knuth-Plass + variable-font pipeline could drive the
   "play with the letters" brand directive and a vector (non-atlas) crisp finale mark — evaluate against
   the MSDF baseline.
