# 11 — 3D Extruded Cinzel Letterform Geometry

_Phase 1 graphics research · GAELWORX forge world · primary judge target iPhone 15 (OLED)_

---

## 1. SCOPE

This element is the **GAELWORX wordmark as real, poured volume** — not flat text, not a billboarded
sprite, but seven Cinzel Decorative letterforms (`G A E L W O R X`) extruded into 3D solids that the
**living molten metal physically fills, left-to-right**, from a stone forge-altar. Each glyph is a vessel
with a front face, side walls, and a top rim; the pour climbs the interior, each filled letter **cools
through the master temperature gradient** (white-hot → orange → forge-red → iron-black with deep ember
veins) **except the `A` and the `E`**, which retain unearthly white-gold "divine fire" forever and
**radiate light onto the adjacent basalt** to make carved Ogham readable. Geometrically this is the
hardest type problem in the build: Cinzel's high thick/thin stroke contrast and ornate serifs must
survive extrusion at mobile triangle budgets, the bevel must read as a chamfered cast-iron edge (not a
plastic round-over), and the UVs must carry a clean **left-to-right fill axis** plus a per-letter
temperature index so a single shared shader can drive every letter from the world's master uniforms. It
is the one piece of geometry where the brand's "play with the letters" and the world's "metal fills
forms" rules collide, so it must be **buildable, sharp, and cohesive** with the obsidian/vein system
already in `src/scene/`.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Five viable lanes for turning a serif typeface into forge-fillable 3D volume. Honest tradeoffs:

### 2a. `TextGeometry` + `FontLoader` (typeface.json) — the runtime extruder
The canonical path, still actively used in 2025 tutorials (Codrops' July 2025 "Interactive Text
Destruction" builds its 3D text exactly this way: `FontLoader` → `.typeface.json` → `new TextGeometry(...,
{ depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments })`). `TextGeometry` extends
`ExtrudeGeometry`; it triangulates the glyph outline, extrudes by `depth`, and bevels the front/back
edges. drei wraps it as `<Text3D>` with `<Center>`.
- **Quality:** Genuine watertight volume with front face + side walls + bevel — exactly what a
  metal-filled letter needs. Bevel reads as a cast chamfer.
- **Cost / risk:** **Tessellation is costly and triangle-heavy** (the three.js docs class it as
  ExtrudeGeometry; the long-standing perf thread #1825 documents hundreds-of-letters scenes choking).
  For a 7-glyph wordmark that is a non-issue **if you bake once and never rebuild per frame**.
- **Cinzel-specific pitfall:** glyph fidelity is set entirely by `curveSegments`. Cinzel's thin serif
  brackets and the diagonal of the `X`/`W` need enough curve points or they facet visibly. The
  typeface.json must be generated from the **900-weight** Cinzel Decorative .ttf (facetype.js), or the
  thick/thin contrast that defines the brand collapses.
- **Mobile:** Fine — one-time bake, modest vertex count for 7 letters. Decode/parse of the JSON font is
  the only load cost (cache it).

### 2b. SVG outline → `SVGLoader` → `ExtrudeGeometry` — the designer-controlled extruder
Export the wordmark as an SVG (set in Cinzel 900, with the brand's "letters playing" kerning baked in
Illustrator/Figma), `SVGLoader.parse()` → `path.toShapes()` → `ExtrudeGeometry`. 2025 references
(LogRocket, Muffin Man) keep this current.
- **Quality:** Highest *artistic* control — you commit the exact ligature/overlap/letter-play layout the
  brand wants, decoupled from font metrics. Same true-volume output as 2a.
- **Cost / risk:** **Side-wall UVs are notoriously bad on ExtrudeGeometry** (three.js issues #1396,
  #4994, and a 2025 forum thread all confirm stretched/erroneous side UVs) — you must supply a custom
  `UVGenerator` (see §4). Holes (the counter of `R`, `O`, `A`) must be wound correctly or the fill
  shader leaks.
- **Mobile:** Same as 2a; one-time bake.

### 2c. Pre-baked GLB (author in Blender, ship as glTF) — the artist pipeline
Model/extrude/bevel the wordmark once in Blender (or extrude the SVG there with a real bevel profile and
proper crease), bake clean UVs, export Draco/meshopt-compressed GLB, load with `useGLTF`.
- **Quality:** **Best possible** — real chamfer profiles, hand-fixed serif geometry, deliberate UV
  unwrap, optional vertex-color temperature seed baked per letter. No runtime triangulation cost at all.
- **Cost / risk:** Adds an offline asset + a glTF loader to a build that today loads **zero external
  assets** at runtime (the `forge-scene`/`fx-resources` "no file env / content-first" ethos). It's a
  network + decode + decompress cost, and a pipeline dependency. Worth it only if 2a/2b can't hit the
  fidelity bar.
- **Mobile:** A compressed 7-glyph GLB is tiny (<100 KB with Draco); decode is one-time. Acceptable, but
  it is the *only* lane that breaks the "geometry is generated, not loaded" pattern of this repo.

### 2d. Slug / vector-curve GPU text (countertype `three-text`, manthrax `JSlug`) — the 2026 newcomer
The headline 2026 development: **Eric Lengyel's Slug algorithm was dedicated to the public domain
(March 17, 2026)** and ported to three.js (manthrax's `JSlug`, three.js forum showcase 2026-03-25;
countertype's `three-text`). It encodes glyph Bézier outlines into a GPU texture and evaluates curve
coverage **per-fragment** — pixel-perfect sharp serifs at any zoom, **no tessellation, ~one quad per
glyph**, and `JSlug` can **inject into `MeshStandardMaterial`** so it obeys lighting/shadows.
- **Quality:** Mathematically exact outlines — the *sharpest* possible serif rendering, no faceting ever.
- **The catch for GAELWORX:** Slug is fundamentally a **2D coverage on a quad** technique. It nails the
  *face* of a letter but does **not natively give you side walls / extruded volume** for metal to fill in
  depth. `three-text` *also* offers a separate **mesh (tessellated, extrudable, deformable)** pipeline for
  exactly that — but then you're back to tessellation. `three-text` is **alpha, API "may break rapidly…
  until summer 2026."** Too unstable to be the spine of a shipped wordmark today; a strong Phase-2
  candidate for the *flat* Ogham/UI type.

### 2e. troika `troika-three-text` (runtime SDF) — the high-volume flat option
On-the-fly SDF atlas from .ttf in a web worker; excellent for lots of flat label text.
- **Verdict for this element:** **Wrong tool.** SDF is flat/billboard text; it gives no volume for a
  pour to fill and softens at grazing angles. Keep it in mind for body/label type elsewhere, not the
  hero wordmark.

| Lane | True volume to fill | Serif fidelity | Side-wall UVs | Runtime cost | Asset load | Stability |
|---|---|---|---|---|---|---|
| 2a TextGeometry | ✅ | good (curveSegments) | weak (custom needed) | bake-once | none | stable |
| 2b SVG-extrude | ✅ | **best (art-directed)** | weak (custom needed) | bake-once | tiny SVG | stable |
| 2c Pre-baked GLB | ✅ | **best** | **clean (baked)** | none | GLB (breaks pattern) | stable |
| 2d Slug/three-text | ✖ (vector) / mesh-mode ✅ | **sharpest face** | n/a / mesh | per-frag / tess | font file | **alpha** |
| 2e troika SDF | ✖ | flat only | n/a | worker | font file | stable |

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: 2b — SVG outline → `SVGLoader` → `ExtrudeGeometry`, baked once, with a custom box-projection
`UVGenerator`, patched via `onBeforeCompile` exactly like `ObsidianSlab`.** With **2a (`TextGeometry`)
as the zero-art-dependency fallback** behind the same shader, and **2d (Slug `three-text` vector)
flagged for Phase 2** for the flat Ogham glyphs that need to stay razor-sharp under the divine-fire glow.

Why this fits the world and the constraints:

1. **The brand demands letter-play.** CLAUDE.md says "play with the letters" and the `A`/`E` are special.
   SVG lets the designer commit the exact 900-weight Cinzel layout, kerning, and any deliberate
   overlap/ligature **before** it ever becomes geometry — font-metric extrusion (2a) can't art-direct
   that. The SVG is also the natural place to tag which paths are the `A` and `E` (group ids) so the
   shader can flag divine-fire letters.
2. **It generates geometry, it doesn't load a scene asset.** A small inline/bundled SVG string stays
   true to the repo's content-first, no-runtime-asset ethos (`forge-scene`: "no file-loaded
   environments"; the slab and gem are both *generated*). A GLB (2c) would be the only thing in the whole
   build fetched as a 3D asset — avoid unless fidelity forces it.
3. **It produces real volume to fill.** Front face + side walls + bevel is exactly the vessel the molten
   pour needs. Slug (2d) can't do depth without falling back to tessellation, and it's alpha.
4. **It plugs straight into the existing shader spine.** We already patch `MeshPhysicalMaterial` via
   `onBeforeCompile` and drive uniforms dt-damped from `forge.*` (`ObsidianSlab.jsx`, `FacetedJewel.jsx`).
   The letterforms reuse that exact pattern, the same `GLSL_NOISE`, the same `PAL` colors, the same
   bloom-on-HDR rule — so the wordmark shares the world's material DNA instead of being bolted on.

Bake the extrusion **once** (in `useMemo`, like `buildGem`), dispose on unmount. The only real work is
the custom UV generator and the fill shader — both detailed below.

---

## 4. IMPLEMENTATION

### 4a. Libraries / versions
- `three` (repo's pinned r17x+) — `SVGLoader`, `ExtrudeGeometry`, `Box3`, `MeshPhysicalMaterial`. No new
  dependency for the recommended lane.
- Optional fallback: `three/addons` `FontLoader` + `TextGeometry`, or drei `<Text3D>`/`useFont` (already
  available via `@react-three/drei`).
- Asset prep (offline, not shipped): facetype.js to make a Cinzel-900 typeface.json **only if** using the
  2a fallback; otherwise an SVG exported from the 900-weight Cinzel Decorative .ttf.

### 4b. Geometry build (bake once)
```js
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import * as THREE from 'three'

// WORDMARK_SVG = the GAELWORX wordmark set in Cinzel Decorative 900, exported as <path> outlines.
// Group ids 'L0'..'L6' per letter; ids 'AE' on the A and E paths so we can flag divine-fire.
function buildWordmark(svgText, { depth = 0.32, bevel = 0.05 } = {}) {
  const { paths } = new SVGLoader().parse(svgText)
  const letterGeos = []
  paths.forEach((p, li) => {
    const shapes = SVGLoader.createShapes(p)            // holes handled by winding
    const isAE = p.userData?.node?.id?.includes('AE') ? 1 : 0
    shapes.forEach((shape) => {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel * 0.7,        // small — a chamfer, not a round-over (brand: sharp)
        bevelOffset: 0,
        bevelSegments: 2,              // 2 is enough for a hard cast edge; keeps tris low
        curveSegments: 8,              // raise locally only if serifs facet on device
        UVGenerator: forgeUV,          // §4c — clean box-projected UVs
      })
      g.userData.letterIndex = li      // 0..6, left→right
      g.userData.isAE = isAE
      letterGeos.push(g)
    })
  })
  return letterGeos                    // keep per-letter so each can carry its own fill/temperature
}
```
SVG Y is down — flip with `geo.scale(1, -1, 1)` (or a -1 Y in the parent group) and recompute. Center via
`Box3` like Codrops' 2025 example (`computeBoundingBox` → translate by half-extent), or wrap in
drei `<Center>`.

### 4c. The UVs that make the fill work (the crux)
ExtrudeGeometry's stock side-wall UVs are broken (three.js #1396/#4994). We supply a custom generator that
gives us **two things the fill shader needs**: (1) a global **left-to-right fill axis** in `uv.x`
normalized across the *whole wordmark* bounding box, and (2) a vertical `uv.y` for the cooling/temperature
gradient up each letter. We compute world-space extents first, then box-project:
```js
// After building, measure the union bbox of all letters → uFillMin.x / uFillMax.x (the pour axis).
// forgeUV emits planar XY for front/back faces and a wall-distance for side walls, so the fill reads
// continuously across face AND wall (metal climbing the inside edge looks contiguous).
const forgeUV = {
  generateTopUV(g, v, a, b, c) { /* planar XY → normalized later in shader via uFillMin/Max */ },
  generateSideWallUV(g, v, ia, ib, ic, id) { /* u = along-contour arclength, v = depth (0..1) */ },
}
```
In practice the cheapest robust route: emit **raw object-space XY into `uv`** for every vertex (top + side)
and do all normalization in the shader against `uFillMin/uFillMax` (the wordmark bbox) and per-letter
`uLetterX0/uLetterX1`. That sidesteps ExtrudeGeometry's UV bug entirely — the shader owns the mapping.

### 4d. Material + shader (patch MeshPhysicalMaterial, GAELWORX way)
Reuse the repo's `onBeforeCompile` three-hook pattern (`shader-fx` skill), `GLSL_NOISE`, `PAL`, `v3()`.
```glsl
// HEAD (prepended after #include <common>)
uniform float uTime, uFillLevel;      // 0..1 master pour front (left→right across the wordmark)
uniform float uLetterX0, uLetterX1;   // this letter's x-extent within the wordmark (object space)
uniform float uIsAE;                  // 1.0 = divine-fire letter (never cools)
uniform vec2  uFillMin, uFillMax;     // wordmark bbox x-range = the pour axis
uniform float uHeat;                  // shared master temperature surge (scroll/strike)
${GLSL_NOISE}
vec3 gwTempRamp(float t){              // white-hot → orange → forge-red → iron-black
  vec3 white = ${v3(PAL.hot)};        // HDR >1 → blooms (post-fx rule)
  vec3 oran  = ${v3(PAL.ember)};
  vec3 red   = ${v3(PAL.crimson)};
  vec3 iron  = ${v3(PAL.void)};
  vec3 c = mix(iron, red, smoothstep(0.0, 0.33, t));
  c = mix(c, oran, smoothstep(0.33, 0.66, t));
  c = mix(c, white, smoothstep(0.66, 1.0, t));
  return c;
}
```
```glsl
// COLOR (before #include <tonemapping_fragment>, like ObsidianSlab)
float gx = (vUv.x - uFillMin.x) / max(uFillMax.x - uFillMin.x, 1e-4); // 0..1 across wordmark
float filled = step(gx, uFillLevel);                                  // has the pour reached here?
float cool   = clamp(vUv.y, 0.0, 1.0);                                // cools from the rim down
float ember  = gw_fbm(vUv * 6.0 + uTime * 0.1) * 0.5 + 0.5;           // deep ember veins in iron
// per-letter cooling phase: earlier letters (smaller index) are cooler/older
float temp = mix(0.05, 1.0, 1.0 - cool) * (0.6 + 0.4*uHeat);
temp = mix(temp, 1.0, uIsAE);                                         // A & E stay white-gold forever
vec3 metal = gwTempRamp(temp);
metal = mix(metal, metal + ${v3(PAL.crimson)}*ember*0.25, 1.0 - uIsAE); // ember veins in cooled iron
vec3 unfilled = ${v3(PAL.void)} * 0.4;                                // hollow vessel before the pour
gl_FragColor.rgb += mix(unfilled, metal, filled) * (0.8 + uHeat*0.6 + uIsAE*0.7);
```
`m.defines = { USE_UV: '' }`; `m.toneMapped` stays on so ACES + bloom finish it.

### 4e. r3f component shape
```jsx
function Wordmark({ quality }) {
  const letters = useMemo(() => buildWordmark(WORDMARK_SVG), [])
  const bbox = useMemo(() => unionBBox(letters), [letters])
  const mats = useMemo(() => letters.map(makeForgeLetterMat), [letters]) // shared uniforms object
  useEffect(() => () => { letters.forEach(g=>g.dispose()); mats.forEach(m=>m.dispose()) }, [])
  useFrame((state, dt) => {
    const t = forge.quality === 'static' ? 1 : state.clock.elapsedTime
    // POUR: drive uFillLevel from the journey — fills as you arrive / scroll.
    const target = forge.ready ? range(forge.scrollDamped, 0.0, 0.6) : 0
    const since = performance.now()/1000 - forge.strikeAt
    const surge = since>=0 && since<1.6 ? Math.exp(-since*3)*0.85 : 0
    mats.forEach((m) => {
      m.userData.u.uFillLevel.value = damp(m.userData.u.uFillLevel.value, Math.max(target, 1), 2.5, dt)
      m.userData.u.uHeat.value      = damp(m.userData.u.uHeat.value, Math.min(forge.scrollVel,1)+surge, 4, dt)
      m.userData.u.uTime.value      = t
    })
  })
  return letters.map((g, i) => <mesh key={i} geometry={g} material={mats[i]} />)
}
```
Gate it inside `ForgeCanvas` by `forge.route` (`forge-scene` rule), reuse `CameraRig` framing. The A/E
letters additionally drop a small `pointLight` (or emissive bloom) to **radiate onto the basalt** —
covered in §5.

---

## 5. COHESION — sharing the one world

This wordmark is wired to the **same master systems** as the slab, gem, and embers so nothing reads as a
separate widget:

- **Palette:** every color comes from `src/scene/palette.js` `PAL` via `v3()` — `PAL.hot` (HDR white-gold
  divine fire), `PAL.ember`, `PAL.crimson`, `PAL.void`. No new hexes. The 60/30/10 discipline holds: void
  iron dominates cooled letters, crimson is the mass, only `PAL.hot`/`PAL.emberHot` (>1) on the A/E and the
  fresh pour front blooms (`post-fx`'s "only HDR blooms" rule).
- **Master temperature:** `uHeat` is fed by **the same signals the slab and jewel already read** —
  `forge.scrollVel` + the `forge.strikeAt` strike pulse (identical decay `exp(-since*3)`). When a strike
  fires, the wordmark, the veins (`uSurge`), and the jewel (`uHeat`) flare **together** — one forge, one
  temperature.
- **Noise:** the ember-vein detail in cooled iron uses the shared `gw_fbm` from `src/scene/shaders.js`
  (the same field the obsidian veins use), so the metal in the letters and the metal in the slab look
  like the **same material**.
- **The pour axis** (`uFillLevel`) is driven by `forge.scrollDamped`/`forge.ready` — the same journey
  state that ramps the veins (`ObsidianSlab.jsx:158`). The metal "arrives" as you do.
- **A+E divine fire = the brand's ignite rule in 3D.** The 2D system ignites the first A and E with the
  forge gradient (`.forge-letter`, CLAUDE.md). Here the *same two letters* keep `uIsAE=1` → white-gold,
  never cooling — the literal 3D embodiment of the brand law. Their emissive >1 blooms via the existing
  `<Bloom luminanceThreshold>`, and a small light per AE letter spills `PAL.hot` onto nearby basalt so the
  carved Ogham reads — the "radiate onto stone" beat, done with the lighting the scene already has, no new
  env (`forge-scene`: no EXR).
- **Lighting/reflection:** letters are `MeshPhysicalMaterial`, so they catch the same neutral-cool
  `<Lightformer>` environment (`ForgeCanvas.jsx`) as the slab — consistent speculars, consistent ACES
  grade, consistent `ChromaticAberration` refraction edge on high tier.
- **Motion:** all uniform changes are `damp(cur, tgt, λ, dt)` (`store.js`), never frame-rate `lerp` —
  matching `motion-feel`'s dt-correct, Brutalist-Snap-on-strike, drift-when-idle laws.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Bake once, never per frame.** Geometry is built in `useMemo` and disposed on unmount (the `buildGem`
  pattern). The whole per-frame cost is uniform writes on 7 small materials.
- **Triangle budget:** keep `curveSegments` at ~8 and `bevelSegments` at 2. 7 glyphs at those settings is
  a few thousand triangles total — negligible next to the slab. Only raise `curveSegments` **locally on
  device** if Cinzel's serifs facet on the iPhone read.
- **Material instancing:** share **one uniforms object** across all 7 letter materials where possible
  (only `uLetterX0/X1`/`uIsAE` differ) so there's a single update path; consider one merged geometry +
  per-vertex `aLetterIndex`/`aIsAE` attributes to collapse to a **single draw call** if profiling shows
  draw-call pressure.
- **Quality tiers (`useQuality` → high|low|static):**
  - `high`: full bevel, transmission already off here (opaque metal), AE point-lights on, bloom catches HDR.
  - `low`: `bevelSegments: 1`, `curveSegments: 6`, AE glow via emissive only (no extra lights), `dpr` capped.
  - `static` (reduced-motion): freeze `uTime` (set to a fixed value like the slab's `uTime=2`), **render
    the wordmark fully filled and cooled** (`uFillLevel=1`) as a still — no pour animation, A/E still lit.
    `frameloop='demand'`. Crawlers/no-JS see the DOM wordmark (Cinzel + `.forge-letter`) regardless.
- **No new runtime asset** in the recommended lane — the SVG string is bundled, parsed once. If the GLB
  fallback (2c) is ever taken, Draco-compress and lazy-load it after paint (content-first), never block LCP.
- **Bloom discipline:** only the A/E and the live pour front exceed 1.0, so bloom stays tight (`post-fx`).
  Do **not** push every cooled letter's emissive >1 or the whole wordmark washes.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations and the specific traps:

1. **Generate the SVG from the 900-weight Cinzel Decorative .ttf**, not 700 and not a fallback serif. The
   thick/thin contrast and serif brackets are the brand — get the source outline right before any code.
   Tag the A and E paths with ids so divine-fire flagging is automatic.
2. **Fix winding/holes first.** Counters of `G O R A` (and the bowl of `R`) are holes; `SVGLoader.createShapes`
   handles them via winding, but verify each letter renders solid with correct counters **before** adding
   the shader — a leaked hole means the fill shader bleeds into the counter.
3. **Flip Y immediately.** SVG is Y-down; forget this and the wordmark is upside-down and the cooling
   gradient runs the wrong way. Flip, then `computeBoundingBox`.
4. **Own the UVs in the shader, not in ExtrudeGeometry.** ExtrudeGeometry's side-wall UVs are broken
   (#1396/#4994) — emit raw object-space XY and normalize against `uFillMin/Max` in GLSL. Don't fight the
   generator; bypass it.
5. **Establish the pour axis from the union bbox**, not per-letter, or the fill jumps between letters
   instead of sweeping continuously left→right.
6. **Wire `uHeat`/strike to the existing `forge.*` signals on day one** so the wordmark flares in sync
   with the slab from the first frame — never invent a parallel clock (`motion-feel` rule #6).
7. **Keep the bevel a chamfer, not a round-over.** Small `bevelSize`, `bevelSegments: 2`. Brand is sharp
   0px brutalism; a fat soft bevel reads as plastic and off-brand.
8. **Verify via `qa-route`** at 393×852 + 1440×900, **0 console errors** (SwiftShader compiles the GLSL in
   CI — a shader typo surfaces here). Then **read it on the iPhone 15**: bloom on the A/E, true-black
   cooled iron, and the pour gradient don't simulate headless.
9. **Test the static/reduced tier** path (fully-filled still, frozen time) — it's the easiest to forget and
   the one a judge with reduced-motion will see.

---

## 8. SOURCES (2025–2026)

1. Codrops — _Interactive Text Destruction with Three.js, WebGPU, and TSL_, **2025-07-22**. 3D text via
   `FontLoader`→`.typeface.json`→`TextGeometry` (depth + bevel), bbox-centering, TSL compute displacement.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
2. three.js forum — _THREE.SlugText GPU Text Renderer_ (manthrax), **2026-03-25**. Slug ported to JS/three;
   curve-data-in-texture, sharp at magnification, injects into `MeshStandardMaterial` (lighting/shadows),
   ~quad per glyph. https://discourse.threejs.org/t/three-slugtext-gpu-text-renderer/90599
3. GitHub — `countertype/three-text` (High-fidelity 3D font rendering & layout), **2025–2026, alpha**.
   Dual pipeline: mesh (extrudable/deformable, HarfBuzz + libtess) and vector (Slug per-fragment); WebGL2 +
   WebGPU/TSL. API "may break rapidly… until summer 2026." https://github.com/countertype/three-text
4. GitHub issue — _GPU vector text rendering via the Slug algorithm — atlas-free alternative to SDF/MSDF_
   (#33215, mrdoob/three.js), **2025–2026**. Context for Slug-in-three; Lengyel patent dedicated to public
   domain 2026-03-17, reference shaders MIT. https://github.com/mrdoob/three.js/issues/33215
5. Maxime Heckel — _Field Guide to TSL and WebGPU_, **2025-10-14**. WebGPU now in iOS/Safari; TSL node
   materials compile to GLSL+WGSL; `colorNode`/`emissiveNode`/`positionNode`, compute shaders — the path if
   the wordmark later moves to TSL. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
6. three.js docs — _TextGeometry_ (extends ExtrudeGeometry; `depth/bevel*/curveSegments/steps/UVGenerator`)
   and _FontLoader_ (typeface.json via facetype.js), **r17x/r18x current**.
   https://threejs.org/docs/pages/TextGeometry.html · https://threejs.org/docs/pages/FontLoader.html
7. three.js issues — _UV Mapping Options for ExtrudeGeometry_ (#1396) and _UV map of extruded geometry_
   (#4994); 2025 forum _How to fix UV problem on ExtrudeGeometry_ — confirms broken side-wall UVs, the
   reason §4c moves normalization into the shader.
   https://github.com/mrdoob/three.js/issues/1396 · https://discourse.threejs.org/t/how-to-fix-uv-problem-on-extrudegeometry/72691
8. drei docs — `<Text3D>` / `useFont` (TextGeometry wrapper + `<Center>`), current 2025–2026.
   https://drei.docs.pmnd.rs/abstractions/text3d

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Slug `three-text` for the flat divine-fire Ogham + razor UI type.** Once `three-text` stabilizes
   (summer 2026) its vector pipeline is the sharpest way to render the carved Ogham the A/E illuminate —
   pixel-perfect at any zoom with no atlas. Evaluate the mesh-mode extrude for a possible wordmark v2.
2. **The custom `UVGenerator` / merged-geometry single-draw-call wordmark.** Deep pass on a correct
   side-wall + bevel UV generator and merging the 7 letters into one geometry with per-vertex
   `aLetterIndex`/`aIsAE` attributes for one draw call — the real perf ceiling work.
3. **TSL/WebGPU port of the forge-letter material.** With WebGPU now on iOS/Safari (Heckel, Oct 2025), a
   TSL `colorNode`/`emissiveNode` version that compiles to both WebGL and WebGPU, plus compute-shader
   pour-front simulation (vertex-level metal climb) instead of a uniform `uFillLevel`.
4. **The molten-fill micro-simulation.** Surface tension/meniscus at the pour front, sparks born at the
   advancing edge (tie into `Embers.jsx`), and heat-shimmer distortion of the air over the hottest letters
   — making the fill read as *liquid* metal, not a wipe.
