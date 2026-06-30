# 13 — Procedural-SDF vs Baked Single-SDF Atlas for Ogham Content

_Phase 2 deep-dive · GAELWORX forge world · cluster: D-type-knot-reveal · target: iPhone 15 OLED · one WebGL renderer · warm-forge palette._
_Parent: Phase-1 doc 25 §9.3 ("Authoring real Ogham content: procedural-SDF vs baked single-SDF atlas"). Sits on the master systems in `00-COHESION-MAP.md`._

---

## 1. SCOPE

The Ogham is the **sacred small print** of the GAELWORX world — the notched Irish alphabet cut into the
green-black Connemara basalt the molten channels wind through, **invisible in the pure void until the
A/E "divine fire" white-gold light spills across the stone and the inscription rises out of black for
the first time** (the keystone reveal, `00-COHESION-MAP.md` §5.2; Phase-1 docs 25, 26). Phase-1 doc 25
chose the *shape source*: **generate the Ogham as a live procedural SDF** (IQ `sdSegment` + `min()`
union) because Ogham is uniquely synthesisable — a stemline (the **droim/faobhar**) plus short score
strokes in four families (**aicme**). That pick is correct for the **hero bands**: a word, a route label,
a short verse line. It is *wrong* the moment the content gets long.

This deep-dive owns the **one question doc 25 deferred**: the procedural `min()`-chain is `O(glyphs ×
strokes)` ALU **per pixel**, so its cost climbs linearly with text length, while a baked SDF atlas is
**one (or two) texture fetches per pixel — constant cost regardless of length.** Somewhere there is a
**crossover** where the per-pixel min-chain costs more than the fetch. This doc finds that crossover on
iPhone-15-class hardware, specifies the **BabelStone Unicode-Ogham → single-channel SDF → KTX2 ETC1S**
bake pipeline exactly (LinearFilter, NoColorSpace, the right `distanceRange`), and lands a **hybrid**:
**procedural for short hero bands (where it's cheaper *and* asset-free), atlas for long verses (where the
fetch wins and authoring arbitrary content matters).** Both paths feed the *same* carve relief (doc 26)
and the *same* AE-divine-fire reveal (doc 25 §5), so the choice is a **back-end swap behind one height
field** — nothing downstream of the height value changes. That invariance is the whole point: the world
must not be able to tell which Ogham source it's looking at.

Where it lands per route: `/automations` channel-hall wall bands (medium length), `/about` altar-approach
(short hero inscription, close oblique), `/pricing` stone-ledger (a **long verse up the stone edge** — the
atlas case), `/work` plinth labels (short). The hybrid routes *by length*, gated on the same `scenes.js`
`ogham` preset the rest of the carve stack reads.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Every viable way to put **length-scalable** Ogham into the basalt fragment shader on a mobile WebGL slab,
judged against *this* build (one `WebGLRenderer`, `MeshPhysicalMaterial` + `onBeforeCompile`, no runtime
EXR, the iPhone-15 fill-rate budget, the shared `gw_`/`PAL`/`forge.*` systems).

### A. Pure procedural SDF — `min()`-chain of `sdSegment`, evaluated per pixel (the doc-25 path)

Each glyph is a `min()` over ≤5 `sdSegment` calls; a band is a `min()` over all glyphs. **Zero asset
bytes, infinitely crisp, animatable, and the SDF *is* the carve height field** — one evaluation serves
shape, normal, AO, and POM. The 2D-SDF primitives are well-covered in current write-ups: Inigo Quilez's
`sdSegment` re-derived in the Jelly Renders *2D Signed Distance Fields* primer (Dec 2025) and the GM
Shaders *Signed Distance Fields* reference (2025), both showing `min()` unions and using the field as a
height source.

**Cost model.** Per pixel: `sdSegment` is ~1 `dot`, 1 `clamp`, 1 mad, 1 `length` (~6–8 scalar ALU +
1 rsqrt). A 5-stroke glyph ≈ 5 segments + 4 `min` ≈ **~40 ALU**. A band of `G` glyphs ≈ **`G × ~40` ALU,
every fragment that touches the band's bounding region**, whether or not a stroke is near. There is no
texture cost, no bandwidth, no decode. **Mobile fragment-shader budgets** (Adreno best-practices,
Qualcomm 2025) put a healthy fragment at **30–50 ALU instructions** and **3–4 texture samples**; a
3–4-glyph procedural band already lives at the *top* of that ALU envelope, and a 20-glyph verse blows
straight through it.

**Verdict:** the right call for **short hero bands** — cheaper than a fetch, asset-free, perfectly crisp.
Degrades badly as `G` grows because cost is **unconditionally linear in glyph count per pixel**.

### B. Baked single-channel SDF atlas — one texture fetch per pixel, constant cost

Treat Ogham as a font: bake a **single-channel** SDF atlas of the Unicode Ogham block (U+1680–U+169F)
from a **BabelStone Ogham font** (twelve free Unicode Ogham fonts in seven families, mapping the real
Ogham codepoints, *not* Latin substitutes — maintained through 2025). Lay glyph quads (or one band quad
with per-glyph layout UVs) and reconstruct the edge from `texture(atlas, uv).r`. **Cost is one fetch +
~6 ALU regardless of length** — a 4-glyph label and a 200-glyph verse cost the same per pixel.

Why **single-channel, not MSDF** here is settled by Red Blob Games' *Guide to SDF+MSDF Fonts* (updated
into 2026, with a companion "writing the guide" post dated Feb 2026): MSDF exists to preserve **sharp
corners** at low atlas resolution via `median(r,g,b)`; **Ogham has no sharp corners** — it is straight
strokes meeting a stemline — and a **round single-channel SDF gives the softer, more uniform falloff that
glow/shadow want**, which is *exactly* the carved-groove + AE-rim case. RBG's own demos use a round
single SDF for the glow/shadow layer and reserve MSDF for crisp serif body text. So Ogham gets the
*cheaper and better* channel: 1 channel, 1 fetch, soft falloff.

**Mobile reality of texture fetch.** A texture fetch on a tiler (Adreno/Apple) is served by a **dedicated
fixed-function sampler** that fetches+filters far more power- and area-efficiently than general ALU, and
the **atlas is tiny and stays hot in the texture cache** (a 256–512² single-channel field). The one
caveat is the **dependent texture read**: the UV into the atlas is *computed* (from layout), so the
sampler can't prefetch as eagerly as a direct UV — but a single dependent read of a cache-resident tiny
texture is cheap, and Linear filtering on an SDF is mandatory anyway.

**Verdict:** the right call for **long verses and arbitrary authored content**. One more (tiny) asset +
a decode path, but constant per-pixel cost and free arbitrary text. The fallback doc 25 already named.

### C. Hybrid — procedural for short bands, atlas for long verses (the recommendation, §3)

Route by **glyph count behind one height-field interface**: short bands compile the procedural `min()`
chain; long verses sample the baked single-SDF. Both expose the identical `float gwOghamHeight(vec2 uv)`
signature, so the carve (doc 26 POM/normal-bump), the AE reveal (doc 25), and the bloom contract are
**byte-identical downstream**. The crossover threshold is a tuned constant, not a guess (§3, §6).

### D. Baked MSDF atlas (rejected for Ogham, retained for Cinzel)

The modern crisp-type default (Codrops *Gommage*, Jan 2026, builds its whole dissolving-text effect on
MSDF via `three-msdf-text-utils`' `MSDFTextNodeMaterial`). **Overkill for Ogham**: 3 channels (more bake
bytes, ETC1S compresses 3-channel data worse than 1-channel luma), `median()` reconstruction (more ALU
than a single `.r` read), and the corner-preservation it buys is **moot on straight Ogham strokes**.
Cinzel keeps MSDF (Phase-1 doc 12); Ogham does not. **Reject.**

### E. Atlas-free GPU vector text (Slug-style per-fragment curve eval)

The 2026 frontier: render glyph **outlines directly** by evaluating Bézier curves per-fragment from a
glyph-data buffer — no atlas, resolution-independent, no rounding. An active three.js issue (*GPU vector
text rendering via the Slug algorithm*, 2025/2026) tracks bringing this atlas-free path to three. For
**arbitrary** fonts this is compelling, but for **Ogham specifically it collapses to option A** — Ogham's
"curves" are straight segments, so Slug-style eval *is* the `sdSegment` min-chain with extra machinery.
**No advantage for this alphabet; watch for general type.**

### F. countertype/three-text vector pipeline (alpha)

`countertype/three-text` (created Nov 2025, active through Jun 2026) ships a **vector (resolution-
independent GPU-outline) pipeline** alongside its mesh pipeline. Genuinely interesting, but **explicitly
alpha, "API may break rapidly until summer 2026"** — too volatile for a hero we nail once. **Watch, do
not ship.**

### G. TSL / WebGPU node port (Phase-2-after-judge)

Both procedural-SDF and atlas-sample express cleanly as TSL nodes (`texture()`, `Fn`, `Loop`), dual-
targeting WGSL+GLSL (Maxime Heckel, *Field Guide to TSL and WebGPU*, 2025). The Codrops *Gommage* stack
(Jan 2026) shows the **selective-bloom mechanism** we want regardless of renderer: write a
`bloomIntensity` mask per material via **MRT**, multiply it into the color buffer before `BloomNode`, so
**only the AE-lit groove lip blooms** — the node-graph equivalent of our "only HDR > 1 blooms" rule. We
**borrow the bloom-mask discipline today** in GLSL (HDR add on the lip only) and flag the node port as the
renderer-wide migration. **Out of scope for the judge build; the asset pipeline (KTX2 single-SDF) ports
1:1.**

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Hybrid (C), routed by glyph count behind a single `gwOghamHeight(vec2)` interface: procedural
`min()`-chain (A) for bands of ≤ ~6 glyphs; a baked single-channel SDF atlas (B, KTX2 ETC1S, LinearFilter,
NoColorSpace) for bands longer than that. The carve relief (doc 26) and the AE-divine-fire reveal (doc 25)
consume the height field identically in both modes.**

### 3.1 Where the crossover actually is

The break-even is **"per-pixel min-chain ALU ≈ one dependent single-channel fetch + reconstruction ALU,"**
adjusted for the fact that on a tiler the fetch is *not* free ALU but cheap dedicated-sampler work that
overlaps with ALU latency. Worked numbers for iPhone-15-class hardware:

- **Procedural per pixel:** `~40 ALU × G` (G = glyphs in the band's covered region). The band's bounding
  area pays the *full* chain even on blank stone between strokes — there is no per-glyph early-out that
  helps the common case (every covered fragment runs the whole `min`).
- **Atlas per pixel:** ~1 dependent fetch (tiny cache-resident single-channel field) + `median`-free
  single `.r` read + `fwidth` AA ≈ **~6–10 ALU-equivalent, constant in G.** Effective cost on a sampler-
  rich tiler is well under a 2-glyph procedural band.

So the **theoretical crossover is ~2–3 glyphs** (the atlas is cheaper almost immediately on a per-pixel
basis). But the atlas carries **fixed overheads the procedural path doesn't**: a KTX2 asset + transcode +
a sampler slot + a dependent-read stall risk + a draw/material variant. Folding those in, the **practical
crossover for GAELWORX is ~5–6 glyphs**: below it, procedural's asset-free, perfectly-crisp, animatable
nature wins decisively and its ALU still fits the fragment budget; at/above it, the constant-cost fetch
wins and unlocks arbitrary authored verse. **Set the routing threshold at 6 and tune on-device** (§6).
The `/pricing` verse and any multi-line `/automations` band cross it; `/about`, `/work`, and short route
labels do not.

### 3.2 Why this pick, tied to the world + constraints

- **One height-field interface = the choice is invisible.** Everything downstream — the doc-26 derivative
  bump, the clamped POM, the AE-rim reveal, the ember pooling, the bloom gate — reads `gwOghamHeight(uv)`.
  Swapping procedural↔atlas changes *only* the body of that function. The carved look, the reveal beat,
  and the bloom character are **identical** across the crossover, so a viewer scrolling from a short label
  to a long verse sees one continuous carving language. This is the cohesion contract (`00` §7 rule 8:
  one source, consumed many ways) applied to the Ogham source itself.
- **Single-channel SDF is cheaper *and* better here.** Red Blob Games (2026): round single-SDF gives the
  soft, uniform groove-shadow/rim falloff carving wants; Ogham has no corners MSDF would rescue. So the
  atlas path is 1 channel (best ETC1S compression — ETC1S prioritises luma, and a single-channel field
  *is* luma), 1 fetch, 1 read. Maximum effect, minimum bytes, on the channel that compresses best.
- **Procedural stays the hero default.** Short bands keep the build asset-free, tiling-free, and
  animatable (the stemline can pulse, strokes can etch-in on reveal) — the doc-25 strengths preserved
  exactly where they pay.
- **Atlas unlocks real lore.** Long authored Ogham (a genuine verse, a clan motto cut bottom-to-top up
  the `/pricing` stone) is only practical as constant-cost text. The BabelStone fonts give **authentic
  Unicode glyph forms for free** — real droim + aicme, not a hand-coded approximation.
- **Ships inside the proven engine, ports to TSL later.** Both modes are `onBeforeCompile` GLSL today; the
  KTX2 single-SDF asset and the layout data port 1:1 to `MSDFTextNodeMaterial`/TSL when the renderer
  migrates (Heckel 2025; Codrops 2026), and the `bloomIntensity`-MRT bloom-gating maps to our HDR-lip rule.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`; `KTX2Loader` + local Basis
  transcoder for the atlas mode (already needed for the doc-26 optional detail map).
- `@react-three/fiber`, `@react-three/drei` (existing) — `useKTX2` for the atlas; no new canvas.
- `@react-three/postprocessing` (existing) — the AE-lit lip crosses the bloom threshold; carve/groove
  do not.
- **Bake-time:** `msdf-atlas-gen` (Chlumsky) with `-t sdf` (single-channel SDF, *not* `msdf`), or
  `msdf-bmfont-xml -t sdf`; then `toktx`/`basisu` for the KTX2 ETC1S wrap.
- **Bake source:** a **BabelStone Unicode Ogham font** (e.g. `BabelStone Ogham Stone`) — real U+1680–
  U+169F codepoints.
- Shared in-repo: `GLSL_NOISE`, the `gw_` toolkit (`src/scene/shaders.js`), `PAL`/`v3`
  (`src/scene/palette.js`), `forge`/`damp`/`range` (`src/store.js`), the master pool `U`
  (`src/scene/forgeUniforms.js`).

### 4.2 The bake pipeline (single-channel SDF → KTX2 ETC1S)

```bash
# 1) Single-channel SDF atlas from a BabelStone Unicode Ogham font.
#    -t sdf  => one channel (round SDF), the glow/shadow-friendly field (Red Blob Games 2026).
#    -pxrange 6  => distance range in px; 4 is min for crisp body, 6 gives headroom for the
#                   soft groove-shadow / AE-rim falloff (we read distance OUTSIDE the stroke).
#    charset = the Ogham codepoints we author (U+1680 space-mark + the 20 letters + forfeda used).
msdf-atlas-gen -font BabelStoneOghamStone.ttf -type sdf -pxrange 6 -size 48 \
  -charset ogham.charset.txt -format png -imageout ogham-sdf.png -json ogham-sdf.json -dimensions 512 256

# 2) Wrap as KTX2 ETC1S (single-channel luma → ETC1S transcodes to the right mobile format at runtime).
#    --uastc would be sharper but ~4x bytes; ETC1S is correct for a soft SDF + the mobile budget.
toktx --encode etc1s --assign_oetf linear --target_type R ogham-sdf.ktx2 ogham-sdf.png
```

Why each flag: **`-type sdf`** (single channel, per RBG the glow/shadow-correct field for grooves);
**`-pxrange 6`** because the carve reads distance *outside* the stroke for the soft wall falloff and the
AE rim, not just the on-edge crisp (a 4px range is enough for a flat glyph but clips the groove-shadow
ramp); **ETC1S** because the field is single-channel luma — ETC1S's luma-priority is its best case, and
the soft SDF hides ETC1S's block artifacts (unlike a crisp MSDF, where they'd show); **`--assign_oetf
linear` / R target** so the data is **not treated as sRGB** (the cardinal SDF bug — sRGB warps the
distances).

### 4.3 The runtime texture settings (the #1 silent-bug checklist)

```js
const sdf = useKTX2('/fonts/ogham-sdf.ktx2')
sdf.minFilter = sdf.magFilter = THREE.LinearFilter   // NEVER Nearest — destroys the SDF ramp
sdf.colorSpace = THREE.NoColorSpace                   // SDF distance is NOT sRGB color
sdf.generateMipmaps = false                           // SDF is mip-fragile; hero-scale needs no mips
sdf.anisotropy = 1
```

These four lines are the analogue of the MSDF rules in doc 12 §7 and apply identically to single-SDF:
LinearFilter + NoColorSpace are mandatory; mips off for a hero-scale field.

### 4.4 The one height-field interface (the swap point)

```glsl
// ---- SHARED INTERFACE: both modes return the SAME thing ----
// 0.0 = flat stone surface, 1.0 = deep in the incised stroke. Consumed identically by the
// doc-26 carve (normal bump / POM / shadow) and the doc-25 AE reveal. The crossover is HERE only.

float gwOghamHeight(vec2 uv){
#ifdef OGHAM_ATLAS
  // --- ATLAS MODE (long verses): one dependent fetch, constant cost ---
  float sd  = texture2D(uOghamSdf, uv).r - 0.5;        // single channel; signed distance to stroke
  float aa  = fwidth(sd) + 1e-4;                       // screen-space AA, scale-correct (RBG)
  return clamp(-sd / aa + 0.5, 0.0, 1.0);              // 1 inside stroke, soft 1px edge (inverted: cut=high)
#else
  // --- PROCEDURAL MODE (short hero bands): min()-chain, asset-free ---
  float d   = oghamBand(uv);                           // doc-25 sdSegment min-chain (the droim + aicme)
  float aa  = fwidth(d) + 1e-4;
  return 1.0 - smoothstep(0.0, 0.010 + aa, d);         // 1 inside stroke
#endif
}
```

`oghamBand`/`ogChar`/`sdSeg` are exactly the doc-25 §4 functions (the IQ `sdSegment` + per-aicme stroke
placement). The **only** difference between modes is which line computes the field. Everything below this
function is unchanged from docs 25/26:

```glsl
// (doc-26) carve the walls — derivative bump from the (parallaxed) height, slab's idiom
float gwH   = gwOghamHeight(ogUV);                 // EVALUATE ONCE — reuse in normal + color
vec3  gwBmp = vec3(dFdx(gwH), dFdy(gwH), 0.0);
normal      = normalize(normal - gwBmp * uOghamDepth);

// (doc-25) the REVEAL — legibility = the SAME AE divine-fire term the basalt green-reveal uses
float aeFall  = 1.0 / (1.0 + dot(vWPos - uAEFire.xyz, vWPos - uAEFire.xyz) * 0.25);
float legible = clamp(uAEFirePow * aeFall + uOghamReveal, 0.0, 1.0);
vec3  toAE    = normalize(uAEFire.xyz - vWPos);
float rim     = pow(clamp(dot(normalize(normal), toAE), 0.0, 1.0), 2.0) * gwH;
diffuseColor.rgb *= mix(1.0, 0.35, gwH);                       // groove AO (stays < 1, no bloom)
diffuseColor.rgb += ${v3(PAL.gold)} * rim * legible * 1.3;     // AE rim > 1 → ONLY this blooms
diffuseColor.rgb += ${v3(PAL.ember)} * pow(gwH, 2.0) * uTemp * 0.12; // shared-temp ember pooling
```

### 4.5 The r3f component shape (extends `BasaltStone`, doc 05/25)

```jsx
// src/scene/OghamBand.jsx — a thin extension layer on BasaltStone's material, length-routed.
function OghamBand({ quality, text, route }) {
  // ROUTE THE MODE BY GLYPH COUNT — the crossover decision, one constant.
  const OGHAM_CROSSOVER = 6
  const useAtlas = text.length > OGHAM_CROSSOVER

  const sdf = useAtlas ? useKTX2('/fonts/ogham-sdf.ktx2') : null
  if (sdf) { sdf.minFilter = sdf.magFilter = THREE.LinearFilter
             sdf.colorSpace = THREE.NoColorSpace; sdf.generateMipmaps = false }

  const uniforms = useMemo(() => ({
    uOghamSdf:    { value: sdf },                 // atlas mode only
    uOghamOn:     { value: 0 },                   // per-route enable (scenes.js, damped)
    uOghamDepth:  { value: 1.1 },
    uOghamReveal: { value: 0.0 },
    // shared pool refs (assigned from U): uAEFire, uAEFirePow, uTemp, uTime …
  }), [sdf])

  const material = useMemo(() => {
    const m = makeBasaltMaterial()                // doc 05 base
    m.defines = { USE_UV: '' }
    if (useAtlas)            m.defines.OGHAM_ATLAS = ''        // compile-time mode select
    if (quality === 'high' && nearPerpendicular(route)) m.defines.OGHAM_POM = ''
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, uniforms)     // BIND THE SHARED POOL — true cohesion
      injectOghamChunks(sh)                        // HEAD interface + NORMAL + COLOR (above)
    }
    return m
  }, [useAtlas, quality, route])

  useEffect(() => () => material.dispose(), [material])      // dispose discipline (00 §4.3)

  useFrame((_, dt) => {
    const sc = sceneFor(route)
    uniforms.uOghamOn.value = damp(uniforms.uOghamOn.value, sc.ogham ?? 0, 2.4, dt)
    // uAEFirePow / uTemp / uTime are driven by the ONE <ForgeDriver/> via U — not here.
  })

  return <mesh geometry={wallGeo} material={material} />
}
```

### 4.6 Key uniforms & params

| Name | Range / type | Drives | Source |
|---|---|---|---|
| `OGHAM_ATLAS` (define) | on/off | **the crossover** — fetch vs min-chain | `text.length > 6` |
| `OGHAM_POM` (define) | on/off | high-tier true-parallax carve (doc 26) | `quality==='high'` + near-perp route |
| `uOghamSdf` | sampler2D | single-channel SDF atlas (atlas mode) | KTX2 ETC1S, LinearFilter, NoColorSpace |
| `uOghamOn` | 0→1 | per-route enable, damped | `scenes.js` `ogham` preset |
| `uOghamDepth` | 0→2 | carve strength (bump + POM scale) | leva, ~1.1 |
| `uAEFirePow` | 0→1 | **shared** divine-fire intensity → reveal | `U.uAEFirePow` (ForgeDriver) |
| `uAEFire` | vec3 | **shared** nearest A/E divine-fire world pos | `U.uAEFire` |
| `uTemp` | 0→1 | **shared** master temperature → ember pool | `U.uTemp` |
| `distanceRange` (bake) | 6 px | `fwidth` AA + groove-shadow/rim ramp width | matched in shader |

### 4.7 How it hooks the shared master temperature system

The Ogham binds the **same master pool `U`** every hot/cold material binds (`00` §4.2):
`Object.assign(sh.uniforms, U, …)`. It reads — never writes — `U.uTemp` (the `scrollDamped`-driven forge
heat) for the ember pooling deep in the cut, and `U.uAEFire`/`U.uAEFirePow` (the A/E letterform position
+ intensity) for the reveal. Because the **one `<ForgeDriver/>`** is the sole author of `U`, the Ogham
heats and reveals *on the same heartbeat* as the slab veins, the basalt green-reveal, and the divine A/E
bloom — a strike pulse surges all of them in the same frame. The reveal term `uAEFirePow * 1/(1+d²·0.25)`
is the **identical** falloff the basalt green-reveal (doc 05) and the letterform light (doc 12) use, so
"the green rises, the Ogham becomes legible, the A/E burns" is **one causal event**, not three timed
effects. The crossover swap (procedural↔atlas) sits *upstream* of all this and touches none of it.

---

## 5. COHESION

- **One height field, two back-ends, zero downstream drift.** The carve relief, the AE reveal, the bloom
  gate, the ember pool all consume `gwOghamHeight(uv)`. Procedural and atlas produce the *same* 0→1 field,
  so the carved look is identical across the crossover — `00` §7 rule 8 ("one source, consumed many ways")
  applied to the Ogham source itself. Nothing can read as bolted-on because nothing downstream knows which
  mode produced the height.
- **One reveal value, three surfaces.** `uAEFirePow` + the `1/(1+d²·0.25)` falloff lighting the Ogham is
  the *same* term surfacing the serpentine green (doc 05) and blooming the A/E letterforms (doc 12). The
  brand's central A+E ignite law (`CLAUDE.md`) is literally the light that reveals the lore.
- **Shared palette only, bloom contract honoured.** `PAL.gold` for the AE rim (the divine A/E's own gold),
  `PAL.ember` for the heat in the cut, basalt's serpentine/void for the groove shadow — no new hex. The
  groove AO and walls stay **< 1.0 (no bloom)**; only the AE-lit gold rim is pushed **> 1**, so it — and
  only it — crosses the shared bloom threshold (`00` §6; the "only HDR blooms" rule). This mirrors the
  Codrops *Gommage* (2026) `bloomIntensity`-mask-via-MRT discipline, done in GLSL: only the lit lip blooms.
- **Single-channel = the cheapest *and* most cohesive choice.** The atlas is one luma channel (best ETC1S
  case, smallest bytes) giving the soft falloff grooves want — the palette/bloom convention and the
  texture-format choice agree.
- **Same noise DNA, same carve idiom, same clock.** Optional groove-edge erosion reuses `gw_fbm`; the
  normal perturb is the slab's `normal = normalize(normal - gwBmp·u)`; `uTime` freezes to `2` on `static`
  exactly as the slab does. The Ogham shares the world's grain, hand, and heartbeat.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the budget master (`00` §10: fill-rate, not triangles, is the enemy). Tiers mirror
`useQuality` → `high | low | static`.

**The crossover, in budget terms.** The fragment-shader ALU ceiling for a healthy mobile pass is **30–50
ALU instructions** (Adreno best-practices, Qualcomm 2025). A procedural Ogham glyph ≈ **~40 ALU**, so:

- **1–3 glyphs:** procedural is ~40–120 ALU on the band region — fits comfortably with the basalt's own
  shading; asset-free. **Procedural wins.**
- **~4–6 glyphs:** ~160–240 ALU — at the edge of the budget once basalt + carve + reveal are added.
  Procedural still acceptable for a *brief* on-screen band, but the atlas's constant ~6–10 ALU + one
  cache-resident fetch is now competitive. **Tune the routing constant here, on-device.**
- **7+ glyphs:** procedural is ≥ 280 ALU **per fragment over the whole band's covered area** — over
  budget and scaling further. **Atlas wins decisively** (constant cost, the fetch served by the dedicated
  sampler, the tiny field hot in cache).

**Why the fetch is cheap here.** The atlas is a single-channel 512×256 (or smaller) ETC1S field — a few
KB transcoded, **~10× less VRAM than a PNG** (utsubo, *100 Three.js Tips*, 2026; KTX2 stays compressed on
the GPU). It stays resident in the texture cache, and the fixed-function sampler fetches+filters far more
power-efficiently than ALU. The one risk — a **dependent texture read** (UV computed from layout) — is
mitigated because the read is of a tiny cache-hot texture; do **not** chain a second dependent read off
its result.

**Tier contract:**
- **`high`:** procedural (short) **or** atlas (long), + derivative-bump carve + clamped POM (8→24,
  grazing-biased, doc 26) on near-perpendicular routes (channel-hall top-down, altar) + AE rim + ember
  pool. `dpr [1, 1.5]`.
- **`low`:** same height-field mode, **no POM** — derivative bump only. Drop ember pool if needed. The
  groove still self-shades convincingly from the perturbed normal. `dpr [1, 1.4]`.
- **`static` / reduced-motion:** freeze `uTime = 2`, no POM, hold a fixed `uOghamReveal` floor (~0.25) so
  the script reads without live AE math; `frameloop='demand'`. For the long-verse routes, **prefer the
  atlas in `static`** — a frozen still shouldn't pay a giant min-chain it can't amortise.

**Hard rules:**
1. **Evaluate `gwOghamHeight` ONCE per fragment**, reuse in NORMAL and COLOR. Sampling it twice doubles
   either the min-chain *or* the fetch — the classic doubling bug (doc 25 §6.2).
2. **Cap procedural glyph count by routing to atlas at the crossover.** Never ship a 20-glyph `min`-chain;
   that's exactly what the atlas exists for.
3. **`fwidth`-based edge = free scale-correct AA** in both modes — no MSAA for the carve edge (RBG).
4. **Atlas: LinearFilter + NoColorSpace + no mips + ETC1S linear OETF.** Any one wrong = "fuzzy SDF that
   looks broken for no reason" (doc 12 §7).
5. **One KTX2, ETC1S, single channel — never EXR/HDR** (the cardinal scar). Set the Basis transcoder path
   once; bundle locally. Procedural mode ships **zero** new bytes.
6. **No second mesh / no decal draw.** Both modes inject into the existing `BasaltStone` material — extra
   fragment math (procedural) or one sampler binding (atlas) on a surface already being shaded.

---

## 7. GET-IT-RIGHT-FIRST-TIME

1. **Build the `gwOghamHeight` interface FIRST, procedural mode, flat white-on-black.** Prove the droim +
   four aicme lay out correctly, read left-to-right (or bottom-to-top up the edge — **never top-down**,
   per Unicode 16.0 ch. 8), and look like real Ogham (check against the U+1680–U+169F chart) *before* any
   carve, reveal, or atlas. Get the alphabet right while it's cheapest to iterate.
2. **Bake the atlas and verify it in isolation second.** Render the KTX2 single-SDF as a plain
   `texture(...).r > 0.5` quad and confirm the *same* glyphs at the *same* layout as the procedural band.
   The two modes must be visually interchangeable — if they aren't, the crossover swap will pop. **Record
   the `-pxrange` you baked; the shader `fwidth` math and the groove-shadow ramp assume it.**
3. **Confirm the swap is invisible.** Toggle `OGHAM_ATLAS` on a mid-length band and verify the carve,
   reveal, and bloom are identical. Any visible difference means the height fields disagree — fix the field,
   not the carve.
4. **Texture settings are the #1 silent bug.** LinearFilter (never Nearest), NoColorSpace (SDF ≠ sRGB),
   mips off, linear OETF in the KTX2. Fix these before debugging "blurry" output.
5. **`-type sdf`, not `msdf`.** Single channel. An MSDF bake here wastes 3× the bytes, compresses worse in
   ETC1S, needs `median()` ALU, and buys corner-preservation Ogham can't use (RBG 2026).
6. **Tune the crossover constant on-device, not in theory.** Start at 6 glyphs; profile a real
   `/automations` band and the `/pricing` verse on the iPhone 15; move the threshold until the worst-case
   band sits inside budget. The theoretical break-even is ~2–3; the practical one (folding in asset +
   sampler + draw overheads) is ~5–6.
7. **Keep the groove DARK; lift only with AE light.** Groove AO `×0.35`, walls/floor < 1.0; legibility
   comes from the AE rim (> 1, blooms), never a baked bright fill. A pre-lit Ogham kills the "appears in
   the fire" beat (doc 25 §7.6). The crushed-black OLED grade eats anything timid — tune on the panel.
8. **Hook `#include <color_fragment>` (lit diffuse), not emissive.** The Ogham darkens albedo + adds a
   *lit* gold rim; it is not pure emissive like the slab veins. Wrong hook = grooves glow like lava.
9. **Long verses prefer the atlas even in `static`.** A frozen poster paying a 200-glyph min-chain is pure
   waste; route to the constant-cost fetch.
10. **Verify the project way.** `npm run build` green + `qa-route` 0 console errors @ 393×852 + 1440×900
    (SwiftShader compiles the GLSL in CI — a shader typo or a `#ifdef` mismatch surfaces here), **then the
    iPhone 15 OLED read** — the reveal rising, the gold rim bloom, and the true-black void do not simulate
    headless. Dispose on unmount; gate `OGHAM_ATLAS`/`OGHAM_POM` from day one (retrofitting tiers blows
    budgets).

---

## 8. SOURCES (2025–2026)

1. **Red Blob Games — _Guide to SDF+MSDF Fonts_** (updated into 2026) — single-SDF vs MSDF tradeoff;
   round single-channel SDF preferable for **glow/shadow** (the carved-groove + AE-rim case); `distanceRange`/
   `pxrange`, `fwidth` screen-space AA, LinearFilter requirement.
   https://www.redblobgames.com/articles/sdf-fonts/
2. **Red Blob Games — _Writing a guide to SDF fonts_** (26 Feb 2026) — current commentary on the SDF/MSDF
   guide, when single SDF beats MSDF, antialiasing via screen-space derivatives.
   https://www.redblobgames.com/blog/2026-02-26-writing-a-guide-to-sdf-fonts/
3. **Jelly Renders — _2D Signed Distance Fields_** (1 Dec 2025) — modern 2D-SDF primer: line-segment SDF,
   `min()` unions, building shapes from segments, field-as-height — the procedural-Ogham math.
   https://jellyrenders.com/2025/12/01/signed-distance-fields/
4. **GM Shaders (Xor) — _Signed Distance Fields_** (mini.gmshaders.com, 2025) — compact `sdSegment`
   reference, combining/insetting, SDF as a height field.
   https://mini.gmshaders.com/p/sdf
5. **Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text … with Three.js & TSL_** (28 Jan 2026) —
   MSDF-text-in-TSL via `three-msdf-text-utils`; **selective bloom via a `bloomIntensity` mask + MRT**
   (multiply before `BloomNode`) — the bloom-gating discipline we mirror in GLSL (HDR lip only).
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
6. **utsubo — _100 Three.js Tips That Actually Improve Performance (2026)_** (2026) — KTX2/Basis ETC1S
   (~10× less VRAM than PNG, stays compressed on GPU), `onBeforeCompile` variant cost, mobile VRAM/draw
   budgeting, sample-count tradeoffs — the atlas-mode budget rules.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
7. **Qualcomm — _Adreno GPU on Mobile: Best Practices (Game Developer Guide)_** (2025) — fragment-shader
   ALU budget (30–50 instr), texture-sample budget (3–4), dependent-texture-read cost, fixed-function
   sampler efficiency vs ALU, loop/branch caution — the crossover cost model.
   https://docs.qualcomm.com/doc/80-78185-2/topic/mobile_best_practices.html
8. **PicLab — _Game Texture Formats Compared: DDS, KTX2, ASTC, BC7_** (2025/2026) — KTX2 vs ASTC vs ETC1S,
   single-channel/grayscale format choices, iOS A8+ ASTC support, ETC1S transcode-to-mobile, VRAM savings.
   https://piclab.click/en/articles/image-format-for-games/
9. **Chlumsky — _msdf-atlas-gen_** (maintained 2025/2026) — `-type sdf` (single channel) / `-pxrange` /
   `-size` / `-charset` flags; JSON layout (atlas size, `distanceRange`, per-glyph metrics) — the bake tool.
   https://github.com/Chlumsky/msdf-atlas-gen
10. **BabelStone — _Unicode Ogham Fonts_** (maintained through 2025) — twelve free Unicode Ogham fonts in
    seven families mapping the real U+1680–U+169F codepoints (not Latin substitutes); the atlas bake source.
    https://www.babelstone.co.uk/Fonts/Ogham.html
11. **Unicode 16.0.0 Core Spec, Ch. 8 (Ogham) + chart U+1680–U+169F** (in force 2025) — droim stemline,
    the four aicme, render LTR or bottom-to-top (never top-down), the SPACE-MARK-as-stemline mechanic.
    https://unicode.org/versions/Unicode16.0.0/core-spec/chapter-8/ ·
    https://www.unicode.org/charts/nameslist/n_1680.html
12. **mrdoob/three.js issue #33215 — _GPU vector text rendering via the Slug algorithm_** (2025/2026) —
    atlas-free per-fragment curve-eval text as an emerging alternative to SDF/MSDF; for straight-stroke
    Ogham it collapses to the procedural `min()`-chain (no advantage for this alphabet).
    https://github.com/mrdoob/three.js/issues/33215
13. **Maxime Heckel — _Field Guide to TSL and WebGPU_** (2025) — TSL node materials dual-targeting
    WGSL+GLSL; the Phase-2 port target for both Ogham modes and the bloom-mask discipline.
    https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Per-pixel crossover micro-benchmark on the iPhone 15.** An actual on-device A/B: render identical
   bands at 2/4/6/8/12/20 glyphs in both modes, capture ms via the `PerformanceMonitor` factor and a GPU
   timer where available, and pin the crossover empirically (it varies with band screen coverage and POM
   gating). Output: the final routing constant + a coverage-aware variant.
2. **Layout-data packing for the atlas mode.** How to carry per-glyph layout (the BMFont JSON metrics →
   per-quad or per-band UV attributes) so a long verse reads bottom-to-top up the `/pricing` edge with
   correct aicme spacing, and whether to instance glyph quads vs one band quad with computed UVs — the
   dependent-read vs draw-count tradeoff.
3. **TSL / WebGPU port of the dual-mode height field.** Express `gwOghamHeight` as a TSL `Fn` selecting
   `texture()` vs a `Loop`-based segment min-chain, dual-targeting WGSL+GLSL (Heckel 2025), with the
   `bloomIntensity`-MRT bloom gate (Codrops 2026) — quantify the draw-call/headroom win and the mobile-
   Safari WebGPU reality. Shared with the doc-26 and doc-12 TSL ports.
4. **Thin-stroke fidelity across the crossover.** Ogham strokes are thin parallel features — the case both
   POM (samples skip between walls) and a low-res SDF atlas (a 48px field under-resolves thin strokes) can
   degrade. Min-height-along-step clamps for POM, `-pxrange`/`-size` tuning for the atlas, and a smoothed-
   displaced-normal borrow (Hoetzlein 2025) so the sacred inscription stays crisp at the altar rake angle.
