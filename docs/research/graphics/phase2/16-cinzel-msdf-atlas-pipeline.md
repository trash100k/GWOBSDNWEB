# 16 — The Cinzel-900 MSDF Atlas + the `layout-U`/`aIgnite`/`aLocalUv` Attribute Bake

_Phase 2 deep-dive · cluster **D-type-knot-reveal** · GAELWORX forge world · target: iPhone 15 OLED, one WebGL renderer (r3f + three.js)_

> **Owns the data layer of the wordmark.** Phase-1 docs 11/12 picked the technique (pre-baked MSDF over
> tessellated geometry) and docs 13/14 picked the per-letter fill control. Phase-2 docs 01/02 own the
> temperature ramp and the cooling curve. **This doc owns the asset and the attributes those consumers eat**:
> the exact build-time bake of a single tiny MSDF atlas for the _ignited-A/E_ Cinzel-900 wordmark — with the
> real kerning and the "play-with-the-letters" overlaps — and the deterministic generation of the three
> per-vertex attributes the left-to-right pour needs: **`aLayoutU`** (0..1 across the _entire_ wordmark),
> **`aIgnite`** (the divine-fire flag baked from the brand rule, never string-matched in a shader), and
> **`aLocalUv`** (0..1 glyph-local, for cooling veins + the wet-front lip). If this data is wrong, every
> downstream consumer — the pour front, the cooling timeline, the divine-fire keystone, the spark emitter,
> the bloom gate — inherits the error. Get this layer deterministic, versioned, and tiny.

---

## 1. SCOPE

The hero of GAELWORX is the **GAELWORX wordmark in Cinzel Decorative 900 being filled, left-to-right, by
living molten metal** poured from the stone altar through the Celtic-interlace channels. Each glyph is a
vessel; the pour front sweeps across the whole word; behind the front every letter cools through the master
temperature ramp (`gw_tempColor`/`gwCool01`, docs 01/02) — **except the first `A` and first `E`**, which
lock to white-gold divine fire forever (`gw_divineFire`, cohesion-map §1.4) and radiate onto the basalt to
make Ogham legible.

For that to happen, the GPU needs the wordmark expressed not as "a string" but as **baked, versioned data**:
a distance-field texture of the exact glyphs, plus per-vertex attributes that answer four questions for every
fragment — _where am I across the whole word_ (drives the pour front), _am I divine_ (drives the keystone),
_where am I inside my own glyph_ (drives veins + lip), and _what is the crisp edge here_ (drives the mask).
This document is the **bake**: the atlas, the charset limit, the layout pass, and the attribute upload. It is
deliberately upstream of look — it ships no color. Its contract is: a `< 256²` (one 512² worst case) MSDF PNG
+ a compact JSON, and a `BufferGeometry` whose `aLayoutU`/`aIgnite`/`aLocalUv`/MSDF-UV attributes are correct
and deterministic across builds. Everything in docs 01/02/13/14 binds to these names.

The "play with the letters" brand directive (CLAUDE.md: _"Cinzel Decorative… Play with the letters"_) makes
this harder than a generic MSDF word: the wordmark is **kerned tight with deliberate serif overlaps**, so the
layout pass must respect real horizontal-advance + kerning-pair data (not a fixed monospace step), and the
attribute generation must survive glyph quads that **physically overlap in X** without the pour front
stuttering or the `aLayoutU` ramp folding back on itself.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Five viable ways to produce the atlas + the attribute data in 2026. They differ on bake-time control, runtime
cost, determinism (does the same input always yield the same atlas/attributes?), and how cleanly the result
feeds the analytic `uPourFront`-vs-UV scheme the cohesion map mandates.

### 2.1 Build-time `msdf-atlas-gen` (Chlumsky) + a custom layout pass — **recommended**

The canonical generator. `msdf-atlas-gen` is the C++/CLI tool that wraps `msdfgen`, packs many glyphs into one
atlas, and emits glyph metrics (JSON/CSV/BMFont/Arfont). Its 2026 README still leads with the parameters that
matter here: `-type msdf`, `-size <px>` (glyph cap height in the atlas), `-pxrange <N>` (the distance-field
range in output texels, default 2), `-dimensions`/`-pots` (atlas size / power-of-two), `-charset <file>` (the
limited glyph set), and `-yorigin top`. Because we author **a fixed wordmark, not arbitrary text**, we pair
the generator with our **own tiny layout pass** (JS, build-time) that reads the per-glyph advance + kerning
pairs and emits the overlapped, kerned positions — giving us total control of the "play with the letters"
overlaps that no generic shaper would produce.

- **Quality:** highest crisp-corner fidelity (true MSDF median reconstruction; serifs survive at low res).
- **Perf (runtime):** zero — it is an asset. One small texture, one draw call.
- **Determinism:** total. Same font + same charset file + pinned tool version → byte-identical atlas + metrics,
  checked into `/public/fonts/`. This is the property the keystone needs (the `aIgnite` indices must be stable).
- **Mobile:** ideal — no wasm, no worker, no runtime font parse. A `< 256²` PNG for our 13-glyph charset.
- **Complexity:** moderate — a build step + a ~120-line layout/attribute script (authored once, §4).

### 2.2 Build-time `msdf-bmfont-xml` (soimy) + `three-msdf-text-utils` geometry

The Node-native generator (`msdf-bmfont -t msdf -f json -s 48 -r 4 -m 256,256 -i charset.txt …`). Emits an
**AngelCode BMFont** JSON, which is exactly what `three-msdf-text-utils`' `MSDFTextGeometry` consumes — so you
get the layout (line/position/index/glyph-bounds) and several per-letter attributes (`center`, `glyphUv`) for
free, plus its `layout` object (`width/height/ascender/capHeight/glyphs[]`). The cost: its layout is a
left-aligned line shaper; it does **not** natively produce our deliberate negative-tracking overlaps, so we
still post-process glyph positions. Versions through 2025–2026 (`1.3.x`) are stable; the BMFont JSON is the
lingua franca the WebGPU forks (`three-msdf-text-webgpu`) also read.

- **Quality:** identical MSDF to 2.1 (same `msdfgen` core).
- **Perf/Determinism/Mobile:** same as 2.1 (asset, pinned, tiny).
- **Complexity:** lower (geometry + attributes come from the lib) but **less control** over the overlaps; you
  override `letterSpacing` / patch positions after layout. Good "fast path."

### 2.3 Runtime atlas via `troika-three-text` (Typr worker) — fallback only

Troika parses the `.woff`/`.ttf` on a worker and builds the SDF atlas per-glyph on the fly, nailing Cinzel
kerning + ligatures with **zero bake tooling**, and patches any three material. But the cohesion map and the
mobile budget reject runtime generation as the ship target: a first-paint worker beat, larger dependency, and
(per the June-2025 three.js forum threads) **no WebGPU/TSL path** (white-square bug). Its `glyphBounds` /
`textRenderInfo` are, however, the cheapest way to _author_ the `aLayoutU`/`aIgnite` data during prototyping.

- **Verdict:** prove the look fast on Troika, then swap to the baked atlas for the perf win + deterministic
  attributes. Both expose the same conceptual hooks.

### 2.4 Runtime `msdfgen.wasm` (the `three-msdf-text-utils` wasm path)

`three-msdf-text-utils` ships a wasm worker that can generate the MSDF at runtime. Same end-quality, but adds a
wasm payload + a generation beat — a direct violation of "no heavy runtime loads." **Out** for the judge build.

### 2.5 TSL `MSDFTextNodeMaterial` + a forked geometry (WebGPU, post-judge)

three.js r185 (2026-06-25) makes TSL first-class; the Codrops _Gommage_ tutorial (28 Jan 2026) builds a full
dissolving-MSDF effect on `MSDFTextNodeMaterial` with **a per-letter offset attribute** so each glyph animates
independently — the exact attribute-driven pattern we want, expressed as nodes (`colorNode`/`opacityNode`).
The **asset is identical** (the same baked atlas + BMFont JSON feed both the WebGL `onBeforeCompile` material
and the TSL node material). So 2.1's bake is the future-proof choice: it survives a WebGPU port as a re-host,
not a re-bake. We author the WebGL2 material now (cohesion-map §10 hard constraint) and keep the attribute
names node-portable.

**Verdict of the landscape:** **2.1 is the ship target** (full control of the overlaps + deterministic
attributes), with **2.2 as the fast path** (free geometry/attributes if the overlaps can be handled by a
position patch), **2.3 as the prototype/fallback**, and **2.5 as the bake's free future-proofing**. The atlas
and the three attributes are the same bytes regardless of which renderer eventually consumes them.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A pinned, build-time `msdf-atlas-gen` bake of a charset-limited Cinzel Decorative 900 atlas, plus a small
deterministic JS layout/attribute pass that emits a versioned `BufferGeometry` (or a compact JSON the runtime
inflates) carrying `aLayoutU`, `aIgnite`, `aLocalUv`, and the MSDF-UV.** Concretely:

1. **One tiny atlas, charset-limited.** Bake only the glyphs GAELWORX actually renders. The wordmark is
   `GAELWORX` (`G A E L W O R X`, 7 unique glyphs); the broader brand set adds `M a e v Y d S l p t C R`
   (`Maeve`, `YardWorx`, `RepairWorx`, `SalesWorx`, `AgentWorx`). The full union is **~26 glyphs** — trivially
   a `128²`–`256²` MSDF atlas at `-size 48 -pxrange 4`. Limiting the charset is the single biggest lever on
   atlas size (a full ASCII set would push 512²–1024²). One charset file, pinned.

2. **A custom layout pass for the overlaps.** Read the BMFont metrics (advance, kerning pairs, glyph bounds)
   and lay out the word with **negative tracking + per-pair nudges** to author the "play with the letters"
   serif overlaps deliberately — not a generic shaper. This pass is the single source of truth for glyph X
   positions and therefore for `aLayoutU`.

3. **Bake the three attributes deterministically, from data, never a shader string-match.** `aLayoutU` from
   the **arc-length-normalized glyph X span** (overlap-robust, §4.3); `aIgnite` from the **brand rule computed
   in JS** (first `A` + first `E` per word → glyph indices, mirroring `BrandText.jsx` `TERMS`); `aLocalUv` from
   the per-glyph quad's local 0..1. Upload as `BufferAttribute`s on the geometry.

4. **Patch a `MeshPhysicalMaterial` (WebGL2), bind the master `U` pool.** Same `onBeforeCompile` idiom as the
   slab; the attributes flow vertex→fragment as varyings; the fragment reads the shared `gw_tempColor` /
   `gwCool01` / `gw_divineFire` and the shared `U.uPourFront`/`U.uTemp`. The bake ships no color; it ships the
   data those functions consume.

**Why this pick (tied to the world + constraints):**

- **Crisp at every scale, tiny on the wire.** MSDF median reconstruction holds Cinzel's high-contrast serifs
  from a 393-px hero to a full-bleed finale with no re-tessellation (Red Blob Games 2026; Babylon May-2025
  TextRenderer). The charset limit makes it a `< 256²` asset — smaller than a single hero photo.
- **The pour is one uniform vs one attribute.** Progressive fill — the literal core of the brief — is
  `step(aLayoutU, uPourFront)` with a soft front. No geometry swaps, no per-frame CPU. This is why the attribute
  bake _is_ the feature.
- **The keystone is data, not a fragile match.** Baking `aIgnite` in JS from the brand rule (first A + first E)
  guarantees the same letters ignite in the canvas as in the DOM `<BrandText>` — the cohesion-map rule-5
  contract — and removes the classic "every A/E lit" bug.
- **One renderer, WebGPU-ready.** The baked atlas + BMFont JSON + named attributes map 1:1 onto
  `MSDFTextNodeMaterial`/TSL (Codrops Gommage, Jan 2026) if the renderer migrates — the asset survives.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

| Piece | Choice | Version (2025–2026) |
|---|---|---|
| Atlas generator (ship) | `msdf-atlas-gen` (Chlumsky) | latest release, **pinned** in a build script + `package.json` note |
| Atlas generator (fast path) | `msdf-bmfont-xml` (soimy) | `^1.3.x` (Node, no native build) |
| Runtime geometry helper | `three-msdf-text-utils` | `^1.3.4` (BMFont JSON → `MSDFTextGeometry`, layout attrs) |
| Renderer | `three` r17x+ (WebGL2), TSL port deferred to r185+ | repo line |
| R3F | `@react-three/fiber`, `drei` | repo line — **no new canvas** |
| Prototype/fallback | `troika-three-text` | drei-pinned `^0.52+` |
| Font source | `@fontsource/cinzel-decorative` **900** `.ttf`/`.woff` | already bundled (CLAUDE.md) — same file the DOM wordmark uses |

### 4.2 The bake command (build-time, checked-in output)

```bash
# charset.txt — exactly the glyphs the brand renders, nothing else.
#   GAELWORX + Maeve + YardWorx/RepairWorx/SalesWorx/AgentWorx union:
#   G A E L W O R X M a e v Y d S l p t C R
# (case-sensitive; ~26 glyphs → 128²–256² atlas)

# Chlumsky msdf-atlas-gen (ship):
msdf-atlas-gen \
  -font public/fonts/CinzelDecorative-Black.ttf \
  -charset charset.txt \
  -type msdf \
  -size 48 \                # cap-height px in the atlas (serif detail headroom)
  -pxrange 4 \              # distance range in TEXELS — shader fwidth math MUST match this
  -pots -dimensions 256 256 \
  -yorigin top \
  -format png \
  -imageout public/fonts/cinzel-msdf.png \
  -json    public/fonts/cinzel-msdf.json

# soimy msdf-bmfont-xml (fast path, identical msdfgen core):
# msdf-bmfont -t msdf -f json -s 48 -r 4 -m 256,256 -p 2 \
#   -i charset.txt -o public/fonts/cinzel-msdf \
#   public/fonts/CinzelDecorative-Black.ttf
```

`-pxrange 4` (the soimy `-r 4`) is the load-bearing number: it is the distance-field range in **texels**, and
the shader's `fwidth`/screen-px-range math must use the same value or the AA fuzzes or hard-edges (§4.5, §7).
`-size 48` gives serif headroom; for `< 256²` with ~26 glyphs there's slack, so 48 is safe.

### 4.3 The layout + attribute pass (build-time JS, the heart of this doc)

This runs **once at build** (or memoized at runtime-init from the JSON) and emits the geometry. It is where the
overlaps and the three attributes are authored. Pseudocode, deterministic:

```js
// bake-wordmark.js  — emits a versioned geometry (positions + aLayoutU/aIgnite/aLocalUv + msdfUv)
import font from '../public/fonts/cinzel-msdf.json'  // BMFont: chars[], kernings[], common.lineHeight…
const WORD = 'GAELWORX'

// --- 1) AUTHORED OVERLAP LAYOUT (the "play with the letters" tracking) -------------------
// Per-pair nudge table: negative = overlap. Authored by eye, then frozen. Units = em fractions.
const TRACK = -0.06                       // global tight tracking
const PAIR  = { 'WO': -0.05, 'RX': -0.03, 'AE': -0.02 }  // bespoke serif overlaps
let penX = 0
const glyphs = []
for (let i = 0; i < WORD.length; i++) {
  const ch = WORD[i]
  const g  = font.chars.find(c => c.char === ch)          // {x,y,width,height,xoffset,yoffset,xadvance}
  const kern = i > 0 ? (font.kernings.find(k => k.first === WORD.charCodeAt(i-1)
                                            && k.second === WORD.charCodeAt(i))?.amount || 0) : 0
  const pairNudge = i > 0 ? (PAIR[WORD[i-1] + ch] || 0) : 0
  penX += (kern / font.common.base) + (i ? TRACK + pairNudge : 0)   // apply kern + authored overlap

  const x0 = penX + g.xoffset / font.common.base                    // quad left in em space
  const x1 = x0   + g.width   / font.common.base                    // quad right
  glyphs.push({ ch, i, x0, x1, g })
  penX += g.xadvance / font.common.base
}

// --- 2) aLayoutU: 0..1 across the WHOLE wordmark, OVERLAP-ROBUST -------------------------
// Use the union extent (min x0 .. max x1), NOT cumulative advance — overlaps must not fold U back.
const minX = Math.min(...glyphs.map(q => q.x0))
const maxX = Math.max(...glyphs.map(q => q.x1))
const span = (maxX - minX) || 1
// Each VERTEX's layoutU = its own world-X normalized into [0,1]. The pour front is a vertical
// plane in layout space; overlapping quads still get monotonic U by their true X, so the front
// crosses the overlap region exactly once (no double-fill, no stutter).
const layoutU = (worldX) => (worldX - minX) / span

// --- 3) aIgnite: BRAND RULE, baked from data (NOT a shader string-match) ------------------
// first A + first E per WORD only (CLAUDE.md / BrandText TERMS). For 'GAELWORX': A=idx2, E=idx3? -> verify!
const firstA = WORD.indexOf('A')   // 2
const firstE = WORD.indexOf('E')   // 3
const isIgnited = (i) => (i === firstA || i === firstE) ? 1 : 0

// --- 4) BUILD GEOMETRY: 4 verts per glyph quad, write attributes per vertex ---------------
const pos = [], muv = [], lu = [], ign = [], luv = []   // position, msdfUv, layoutU, ignite, localUv
for (const q of glyphs) {
  const { x0, x1, g, i } = q
  const y0 = -(g.yoffset) / font.common.base, y1 = y0 - g.height / font.common.base
  const u0 = g.x / font.common.scaleW, u1 = (g.x + g.width)  / font.common.scaleW
  const v0 = g.y / font.common.scaleH, v1 = (g.y + g.height) / font.common.scaleH
  const ig = isIgnited(i)
  // 4 corners: (x0,y0)(x1,y0)(x1,y1)(x0,y1)
  const C = [[x0,y0, u0,v0, 0,0],[x1,y0, u1,v0, 1,0],[x1,y1, u1,v1, 1,1],[x0,y1, u0,v1, 0,1]]
  for (const [X,Y, U,V, LX,LY] of C) {
    pos.push(X, Y, 0); muv.push(U, V); luv.push(LX, LY)
    lu.push(layoutU(X))           // <-- per-vertex true-X normalize -> overlap-robust pour coord
    ign.push(ig)
  }
  // …push two triangles into index buffer (0,1,2, 0,2,3)…
}
// new THREE.BufferAttribute(Float32Array(lu),  1) -> 'aLayoutU'
// new THREE.BufferAttribute(Float32Array(ign), 1) -> 'aIgnite'
// new THREE.BufferAttribute(Float32Array(luv), 2) -> 'aLocalUv'
// new THREE.BufferAttribute(Float32Array(muv), 2) -> 'uv'  (the MSDF atlas UV)
```

The decisive choices: **`aLayoutU` is per-vertex, normalized from the glyph quad's true X into the union
extent** — _not_ from cumulative advance — so two overlapping serifs still produce a monotonic 0..1 ramp and the
pour plane crosses the overlap exactly once. And **`aIgnite` is computed in JS from the brand rule**, frozen
into the buffer; the shader never inspects characters. (For `GAELWORX`: `G·A·E·L·W·O·R·X` → first `A` = index 2,
first `E` = index 3 — **verify against the actual string at bake time** and assert it in a unit test, because
this single fact is the keystone.)

### 4.4 The r3f component shape (mirrors `ObsidianSlab.jsx`)

```jsx
// src/scene/ForgeWordmark.jsx (sketch)
import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { buildWordmarkGeometry } from './bakeWordmark.js'   // §4.3, memoized
import { U } from './forgeUniforms.js'                       // the master pool (cohesion-map §4.2)
import { GW_SHADERS } from './shaders.js'                    // gw_tempColor/gwCool01/gw_divineFire/gw_median
import { PAL, v3 } from './palette.js'

export default function ForgeWordmark({ quality }) {
  const atlas = useTexture('/fonts/cinzel-msdf.png')
  atlas.minFilter = atlas.magFilter = THREE.LinearFilter   // NEVER Nearest on MSDF
  atlas.colorSpace = THREE.NoColorSpace                     // MSDF is DATA, not sRGB color
  atlas.generateMipmaps = false

  const geo = useMemo(() => buildWordmarkGeometry('GAELWORX'), [])   // carries the 4 attributes

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      transparent: true, metalness: 0.0, roughness: 0.28,
      envMapIntensity: 1.2, color: new THREE.Color(PAL.void),
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uMap = { value: atlas }
      sh.uniforms.uPxRange = { value: 4.0 }                 // MUST match the bake -pxrange
      Object.assign(sh.uniforms, U)                         // bind master pool BY REFERENCE
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${VTX_HEAD}`)
        .replace('#include <uv_vertex>', `#include <uv_vertex>\n${VTX_BODY}`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GW_SHADERS}\n${FRG_HEAD}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${MASK}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FILL}`)
    }
    return m
  }, [atlas])

  useEffect(() => () => { geo.dispose(); material.dispose() }, [geo, material])
  // NOTE: no per-frame uniform writes here — <ForgeDriver/> is the sole author of U (cohesion §4.2).
  // ForgeWordmark only owns the local fill-window mapping if it needs one; otherwise it is pure.

  return <mesh geometry={geo} material={material} scale={0.012} position={[-3.4, 0, 0.31]} />
}
```

### 4.5 The GLSL (the consumer of the bake)

```glsl
// VTX_HEAD
attribute float aLayoutU; attribute float aIgnite; attribute vec2 aLocalUv;
varying float vLayoutU; varying float vIgnite; varying vec2 vLocalUv;
```
```glsl
// VTX_BODY
vLayoutU = aLayoutU; vIgnite = aIgnite; vLocalUv = aLocalUv;
```
```glsl
// FRG_HEAD
uniform sampler2D uMap; uniform float uPxRange;
varying float vLayoutU; varying float vIgnite; varying vec2 vLocalUv;
// crisp MSDF edge — median of the 3 channels (gw_median lives in GW_SHADERS)
```
```glsl
// MASK — reconstruct the glyph edge; screen-px-range AA tied to the BAKED pxrange
vec3 s   = texture2D(uMap, vUv).rgb;
float sd = gw_median(s) - 0.5;                        // signed distance to edge (atlas units)
// screen-pixel range: pxrange scaled by how big the glyph is on screen (scale-correct AA)
float spr = max(uPxRange * (1.0 / fwidth(vUv.x)) / float(textureSize(uMap,0).x), 1.0);
float glyph = clamp(sd * spr + 0.5, 0.0, 1.0);        // 1 inside, ~1px soft edge at any scale
if (glyph < 0.01) discard;
diffuseColor.a *= glyph;
```
```glsl
// FILL — the pour + cooling + DIVINE FIRE, all from the SHARED master functions
float filled = step(vLayoutU, U_uPourFront);                       // 1 where metal has arrived
float front  = smoothstep(U_uPourFront - 0.05, U_uPourFront, vLayoutU);  // hot leading lip

// age behind the front -> cooling (analytic, no FBO — cohesion §1.3 / doc 02)
float age    = max(U_uPourFront - vLayoutU, 0.0) * U_uFillSpan;
float T      = 1.0 - gwCool01(age, U_uCoolRate);                   // 1=hot at front, ->0.08 behind

// SHARED ramp (gw_forge = gw_tempColor * gw_tempEmissive) — same alloy as the slab veins
vec3 metal = gw_forge(clamp(T + front * 0.4, 0.0, 1.0));
// ember veins inside cooled iron — SHARED gw_fbm at the SHARED octave count
float vein = pow(clamp(1.0 - abs(gw_fbm(vLocalUv * 6.0 + U_uTime * 0.05)), 0.0, 1.0), 5.0);
metal += gw_tempColor(0.6) * vein * 0.35 * (1.0 - T);              // veins read in the cool band

// DIVINE FIRE — the keystone. A/E NEVER reach uTemp; locked white-gold, eternal, always blooms.
float flick = sin(U_uTime * 1.3 + vLocalUv.x * 4.0);
metal = mix(metal, gw_divineFire(flick), vIgnite);                 // vIgnite==1 -> hard branch

// emissive add PRE-tonemap (so AgX/ACES processes it; >1 blooms — cohesion §3/§6)
totalEmissiveRadiance += metal * max(filled, vIgnite);
diffuseColor.a *= max(filled, vIgnite);                            // unfilled non-divine glyph stays empty
```

### 4.6 Key params / uniforms

| Name | Source | Drives |
|---|---|---|
| atlas `-pxrange` = 4 | **bake** | `uPxRange` → screen-px-range AA correctness |
| `aLayoutU` (attr) | **bake**, union-extent normalize | pour-front fill order (overlap-robust) |
| `aIgnite` (attr) | **bake**, brand rule in JS | divine-fire keystone (first A + first E) |
| `aLocalUv` (attr) | **bake**, per-glyph 0..1 | veins + wet-front lip texture |
| `U.uPourFront` | `<ForgeDriver/>` (journey scroll) | the L→R sweep |
| `U.uTemp` / `U.uHeat` | `<ForgeDriver/>` (scroll+strike) | master heat (shared with slab/jewel/channels) |
| `U.uFillSpan` / `U.uCoolRate` | scene preset / doc 02 | age scale + Newton-cooling rate |

---

## 5. COHESION

This element invents **no** color, noise, clock, or light — it ships **data** that the shared systems consume:

- **Master temperature.** The fill reads `gw_forge` (`= gw_tempColor × gw_tempEmissive`) and `gwCool01` from
  `shaders.js` — the _same_ functions the slab veins, channel metal, and basalt heat-stain read (cohesion-map
  §1, §7-rule-1). A cooling letter and a cooling vein are visibly the same alloy because they sample one curve.
- **The keystone, expressed identically.** `aIgnite` is the 3D twin of the DOM `.forge-letter`/`<BrandText>`
  rule — same "first A + first E per word," computed as build-time data, never a fragile shader match
  (cohesion-map §1.4, §7-rule-5). The A/E route to `gw_divineFire`, which **never reaches `uTemp`** — the
  single most important code path, kept hard-branched by `vIgnite`.
- **Shared noise.** The in-letter ember veins use `gw_fbm` at the shared `GW_FBM_OCTAVES` — the same field that
  veins the obsidian — so the grain is continuous from slab to letterform (§7-rule-2).
- **Shared palette + bloom contract.** Every color is `v3(PAL.*)`; only the hot band + divine fire exceed 1.0,
  so the merged-pass threshold bloom catches only the molten lip and the eternal A/E (cohesion-map §3, §6;
  `post-fx` "only HDR blooms"). The emissive add is **pre-tonemap** so AgX/ACES rolls it.
- **One driver, one clock.** The component writes **no** per-frame uniforms; `<ForgeDriver/>` is the sole author
  of `U` (cohesion-map §4.2). A strike pulse surges `U.uHeat` and the wordmark's lip flares **in the same
  frame** as the slab veins — the synchrony that proves cohesion (§7-rule-6).
- **Hand-off to siblings.** The pour-front world position (`U.uPourFront` mapped through the wordmark transform)
  is the natural emitter origin for the orbiting sparks (doc 09) and the visual destination of the
  Celtic-interlace channels (doc 24) — the letters are where the channels deliver metal _to_, sharing the one
  knot-curve data three ways (cohesion-map §7-rule-8). The A/E `gw_divineFire` value is the same signal the
  basalt reveal and Ogham legibility read (docs 10/11/12, cohesion-map §5.2).

---

## 6. MOBILE & PERFORMANCE

The iPhone 15 OLED is the budget; in this pure-void world pixels are the enemy, not triangles (cohesion-map
§10). The bake is the cheapest possible text:

- **Atlas size.** Charset-limited to ~26 glyphs → a `128²`–`256²` MSDF PNG (`< 50 KB`), `LinearFilter`,
  `NoColorSpace`, **no mipmaps** (a hero-scale wordmark never minifies hard). Smaller than a thumbnail. The
  charset limit is the single biggest size lever — full ASCII would be 512²–1024².
- **Draw + geometry.** One quad per glyph (`GAELWORX` = 8 quads = 16 triangles), one draw call, one texture
  bind. Vertex count is trivial; cost is the ~near-text fragment shader, which is small (one median, one
  `gwCool01`, one `gw_fbm` on `high`).
- **`fwidth`-based AA is free and scale-correct.** No MSAA for the edge; the screen-px-range math (§4.5) keeps
  a clean ~1 px edge regardless of zoom/tilt as the camera rig moves (Red Blob Games 2026 reasoning). **Keep
  `LinearFilter` — `NearestFilter` destroys MSDF.**
- **Tiers (honor `useQuality`):**
  - **`high`** — full material: `gw_fbm` veins (shared octaves), divine-fire flicker, the wet-front lip.
  - **`low`** — drop the in-letter `gw_fbm` veins (flat cool band), keep MSDF mask + ramp + divine fire. Same
    atlas, same attributes — only the fragment thins (uniform degrade, §7-rule-9).
  - **`static`** — freeze `U.uTime=2`, `U.uPourFront=1` (fully-filled end-state), no flicker. The DOM wordmark
    (`<BrandText>`/`<Ignite>`) is the true accessible text; the 3D is pure enhancement, so a no-WebGL/crawler
    device still gets the real, ignited wordmark.
- **No second canvas, no EXR.** The atlas PNG is a normal texture load (allowed); never `.exr`/`.hdr`. Dispose
  geometry + material on unmount; `renderer.info.memory` stays flat across navigation (cohesion-map §4.3).
- **INP insurance.** The atlas + geometry are tiny and synchronous-cheap; `compileAsync` the material before
  first interaction so the shader compile doesn't block the first scroll (cohesion-map §10).

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations, and the specific traps the bake hits:

1. **Bake the atlas first; verify it in isolation.** Generate, then render a plain white-on-black
   `median(rgb) > 0.5` quad **before** touching the forge shader. Confirm Cinzel's serifs are crisp. **Record
   the `-pxrange` value (4)** — every fragment shader's AA math depends on it matching exactly.
2. **The two silent atlas bugs, fixed before debugging anything else.** `LinearFilter` (NEVER `Nearest`) and
   `colorSpace = NoColorSpace` (MSDF is **data, not sRGB**). Either one wrong gives "fuzzy MSDF that looks
   broken for no reason." This is the #1 first-build mistake.
3. **Use the median, not a single channel.** `max(min(r,g), min(max(r,g), b))`. A single-channel read
   reintroduces the rounded corners MSDF exists to fix — Cinzel's sharp terminals will look soft.
4. **Get `aLayoutU` from the union extent, not cumulative advance.** With deliberate overlaps, cumulative
   advance can make a later glyph's left edge sit _behind_ an earlier glyph's right edge — normalizing by
   advance folds `U` and the pour front double-fills or stutters across the overlap. Normalize each vertex's
   **true X** into `[minX0 .. maxX1]` so `U` stays monotonic and the front crosses each overlap once (§4.3).
5. **Author the overlaps in the layout pass, freeze them, assert them.** The "play with the letters" tracking
   is a `PAIR` nudge table + global `TRACK`, authored by eye then frozen. Snapshot-test the resulting glyph X
   positions so a font-version bump can't silently shift the overlaps (or the kerning that drives `aLayoutU`).
6. **Bake `aIgnite` from the brand rule and unit-test the indices.** First `A` + first `E` per word **only**
   (CLAUDE.md). Compute via `indexOf`, assert `firstA===2 && firstE===3` for `GAELWORX`, and assert the same
   letters the DOM `<BrandText>` ignites. The A/E must **never** reach `uTemp` — keep `vIgnite` a hard branch;
   verify by scrolling past and back that the A/E stay white-gold while neighbors cool.
7. **Match the AA to the bake, not a fixed smoothstep.** `clamp(sd * screenPxRange + 0.5, 0, 1)` where
   `screenPxRange` derives from `uPxRange` + glyph on-screen size — a hardcoded width breaks the instant the
   wordmark scales/tilts in 3D (it will, with the camera rig).
8. **HDR only the few.** Molten lip + A/E divine fire go `>1`; the cooled iron body stays `<1`. Don't crank
   bloom to fake the glow — push emissive (`gw_forge`/`gw_divineFire` already exceed 1 in their hot band).
9. **Don't write `U` from this component.** `<ForgeDriver/>` is the sole author (cohesion-map §4.2). Binding `U`
   by reference in `onBeforeCompile` and mutating it elsewhere is the bug that forks the clock.
10. **Verify the GAELWORX way.** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with **0 console
    errors** (CI SwiftShader compiles the GLSL → a shader typo surfaces here) → then the iPhone 15 OLED read
    (the divine-fire white-gold bloom + true-black do not simulate headless). Prototype on Troika first if time
    is short; swap to the baked atlas + attributes for the perf win and the deterministic keystone.

---

## 8. SOURCES

1. **Chlumsky/msdf-atlas-gen — README** (master, surfaced 2025–2026) — `-type msdf`, `-size`, `-pxrange`
   (default 2, texel range), `-charset` file include/combine, `-pots`/`-dimensions`, `-yorigin`, JSON/BMFont
   output; the canonical build-time atlas + metrics generator. https://github.com/Chlumsky/msdf-atlas-gen
2. **Red Blob Games — _msdfgen parameters_** (`/x/2437-msdfgen-parameters/`, 2025) — `pxrange` semantics
   (range in output texels; on-screen scaling example `72/32*2 = 4.5`), `-aemrange`/`-apxrange` asymmetric
   range, corner/error-correction notes for sharp features. https://www.redblobgames.com/x/2437-msdfgen-parameters/
3. **Red Blob Games — _Guide to SDF+MSDF Fonts_** (1 Jan 2026) — vector/bitmap/SDF tradeoff matrix,
   `distanceRange`/`fwidth` screen-px-range AA, `median(r,g,b)` reconstruction, when single-SDF beats MSDF for
   glow/shadow. https://www.redblobgames.com/articles/sdf-fonts/
4. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_**,
   Thibault Introvigne (28 Jan 2026) — `MSDFTextNodeMaterial` (TSL), **per-letter offset attribute** for
   independent glyph animation, `median` edge in nodes, `three.js 0.181`, the asset (atlas + BMFont JSON) the
   WebGL bake also feeds. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
5. **leochocolat/three-msdf-text-utils** (`1.3.4`, npm + README, 2025–2026) — `MSDFTextGeometry` layout
   (`width/height/ascender/capHeight/glyphs[]` with `{line,position,index,data}`), per-letter `center` +
   `glyphUv` attributes, BMFont JSON input, `MSDFTextMaterial` (WebGL) + `MSDFTextNodeMaterial` (TSL).
   https://github.com/leochocolat/three-msdf-text-utils · https://www.npmjs.com/package/three-msdf-text-utils
6. **soimy/msdf-bmfont-xml — docs + npm** (`1.3.x`, 2025) — CLI `-t msdf`, `-f json`, `-s` font-size, `-r`
   distance-range (default 4), `-m` texture-size, `-i` charset-file, `-p` padding; TTF → packed MSDF atlas +
   AngelCode BMFont JSON. https://soimy.github.io/msdf-bmfont-xml/ · https://github.com/soimy/msdf-bmfont-xml
7. **Babylon.js Forum — _MSDF Text renderer_** (announced May 2025) — native `TextRenderer`, MSDF rationale
   (3 channels reproduce sharp corners almost perfectly at any scale), stroke inset/outset; `babylon-msdf-text`
   deprecated 13 May 2025 in favor of the native renderer. https://forum.babylonjs.com/t/msdf-text-renderer/58406
8. **CasulOrnstein/three-msdf-text-webgpu — `MSDFTextGeometry/layout.ts`** (2025–2026) — the layout +
   per-letter attribute generation (glyph index, layout UV, center) as a WebGPU/TSL fork, confirming the
   baked-attribute approach ports to nodes. https://github.com/CasulOrnstein/three-msdf-text-webgpu
9. **three.js — Release r185** (25 Jun 2026) + **TSL docs** — TSL first-class, `colorNode`/`emissiveNode`/
   `opacityNode` node graphs on node materials; the future-proof port target for the WebGL bake.
   https://github.com/mrdoob/three.js/releases/tag/r185 · https://threejs.org/docs/pages/TSL.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 2+)

1. **World-space pour-plane addressing vs the 1-D `aLayoutU`.** The brief's L→R fill can ride the simple
   layout-U (this doc) or a **world-space pour plane that follows the actual Celtic-interlace channel path**,
   filling letters in channel-delivery order (more cohesive with the channels, but it must reconcile with the
   overlap-robust normalization here). A dedicated pass on "metal arriving" vs "a wipe," and on sharing the one
   knot-curve data with doc 24.
2. **True inked-area stroke-mass per glyph for `uFillDur`.** "Thin fills fast / thick fills slow" currently
   uses glyph-box area; sample the **baked MSDF atlas** at bake time for real inked-area / average stroke-width
   per Cinzel letter (the `G/W/O` thick vs `L/X` thin spread), giving physically convincing per-letter fill
   timing — a bake-time computation that ships as a fourth attribute (`aFillDur`).
3. **Variable-weight "play with the letters" via countertype/three-text (post summer-2026).** Once
   `three-text` (HarfBuzz + Knuth-Plass + variable fonts, alpha Nov 2025) stabilizes, evaluate its vector
   (non-atlas) GPU-outline pipeline for a crisp **finale mark** and richer authored overlaps, against the MSDF
   baseline locked here.
4. **The TSL/WebGPU re-host of this exact bake.** Port the WebGL `onBeforeCompile` material to
   `MSDFTextNodeMaterial` + `colorNode`/`emissiveNode` (Codrops Gommage, r185), feeding the **same** atlas +
   `aLayoutU`/`aIgnite`/`aLocalUv` attributes; quantify the draw-call/perf delta on the iPhone 15 and confirm
   the attribute bake survives unchanged (the asset-portability claim of §2.5).
