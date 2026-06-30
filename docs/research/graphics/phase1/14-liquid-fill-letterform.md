# 14 — Liquid-Fills-Into-Letterform Technique

_Phase 1 graphics research · GAELWORX forge world · primary judge target: iPhone 15 OLED_

---

## 1. SCOPE

This is the single most load-bearing "wow" moment of the whole GAELWORX world: the molten metal,
having travelled down the Celtic-interlace channels from the stone altar, **arrives at the GAELWORX
wordmark and FILLS each Cinzel Decorative letterform from the inside, left to right**, like pouring
white-hot iron into a mould. The fill is not a fade-in; it is a **rising liquid surface with a
bubbling, white-hot leading edge (meniscus)** that climbs the interior of each glyph, settles to a
glassy pool, then **cools through the master temperature gradient** (white-hot → orange → forge-red →
iron-black with deep ember veins) — _except the first `A` and first `E`_, which lock to unearthly
white-gold **DIVINE FIRE** and never cool, radiating real light onto the surrounding basalt so the
carved Ogham becomes readable. The hard problem is **continuity**: the channel flow and the letter
interior must read as **one body of metal** — the pour front must cross from channel into glyph with
no seam, no popping, no "two different shaders kissing." This document covers how to make the metal
*rise inside a letter* and how to *join that fill to the channel system* seamlessly.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four viable families for "liquid rising inside a glyph," plus the text-source decision that
sits underneath all of them. Honest tradeoffs below.

### 2.0 The text source (prerequisite for every approach)
Before any fill, you need the letterform as something a shader can mask against. Two modern routes:

- **MSDF (multi-channel signed distance field) text** — the dominant 2025–2026 approach. A baked
  atlas + per-glyph quads; the fragment shader reconstructs a crisp analytic edge at any scale via
  `median(r,g,b)` of the MSDF sample. Libraries: `three-msdf-text-utils` (leochocolat) and the newer
  **Three MSDF Text** (Léo Mouraire) which ships an `MSDFTextNodeMaterial` that is **WebGPU/TSL-native**
  — this is exactly what Codrops' Jan-2026 "Gommage" tutorial builds on. The MSDF distance value is
  *itself* a usable mask: you get not just inside/outside but a signed distance you can threshold,
  inflate, and bevel. **Best fit for GAELWORX** — see §3.
- **Extruded `TextGeometry` / 3D meshed letters** — real geometry (bevel, depth, true normals).
  Heavier, harder to fill volumetrically, and our wordmark is read flat-on, so the extra cost rarely
  pays. Useful only if we want chunky 3D ingots rather than flat glyphs.

### 2.1 SDF fill mask (height-thresholded distance field) — **the workhorse**
Treat the glyph interior as a 2D region (from the MSDF), and define a **fill height `h ∈ [0,1]`** that
sweeps bottom→top of each letter's bounding box. A pixel is "filled metal" if it is inside the glyph
**and** below the current surface line. The surface line itself is perturbed by noise (the bubbling
meniscus) and a thin band around it is the white-hot leading edge.

- **Quality:** very high, and *art-directable* — you control meniscus thickness, settle, glassiness.
- **Perf:** cheapest of all the "real liquid" looks; it's a handful of `texture()` + `smoothstep`
  ops per pixel on quads that already exist. Trivially mobile.
- **Mobile:** excellent.
- **Complexity:** low–medium. The only fiddly part is per-letter local coordinates and the
  left-to-right *timing* across glyphs.

### 2.2 Metaballs / Marching Cubes (drei `<MarchingCubes>`) — **for the pour blobs, not the fill**
A field of `MarchingCubes` + `MarchingCube` (drei) builds an iso-surfaced gooey mesh; `smin`-blended
metaball SDFs give the "absorb into each other" gloop. This is the canonical 2025 r3f liquid look.

- **Quality:** excellent for *droplets, the pour stream, splashes* — genuinely 3D, self-merging.
- **Perf:** the iso-surface is rebuilt on CPU each frame at a grid resolution; resolution is the cost
  knob and it gets expensive fast on mobile. A full GAELWORX wordmark of marching-cubes liquid is
  **out of budget**.
- **Mobile:** poor at high res; acceptable only for a small, low-res blob count.
- **Complexity:** medium. Best used **sparingly** — for the leading droplet that enters each letter
  and the orbiting spark-drawn splash, *not* the bulk fill.

### 2.3 Raymarched SDF liquid (TSL/GLSL fullscreen) — **highest fidelity, highest risk**
Define the letters + the rising fluid as 3D SDFs and raymarch them, `smin`-blending the fluid into the
glyph walls so the metal looks like it physically wells up inside a 3D cavity (Codrops' TSL liquid
raymarching; Maxime Heckel's raymarching study; iq's smin rewrite are the reference canon).

- **Quality:** the most "real molten cavity" look — true internal volume, refraction, self-shadow.
- **Perf:** a per-pixel march with `smin` over N letter SDFs is brutal on a mobile fragment unit;
  step count × glyph count kills it. Reserve for desktop/high tier only, if at all.
- **Mobile:** bad unless the march is tiny and the SDF count is low.
- **Complexity:** high. Letter SDFs (analytic or texture-baked) + march + lighting is a lot to debug.

### 2.4 Real fluid sim (SPH / GPU particles into a mould) — **overkill, rejected**
Position-based or SPH fluid poured into glyph colliders. Photoreal, physically continuous channel→
glyph flow. But it's a research project, non-deterministic (bad for a scripted reveal), and far beyond
the iPhone-15 budget. **Rejected** for the headline fill; a *cheap fake* (§2.1 + a few §2.2 blobs)
buys 95% of the look at 5% of the cost.

### 2.5 The 2025–2026 backend question (WebGPU/TSL vs WebGL/GLSL)
Three.js r171 (Sep 2025) made `WebGPURenderer` production-ready, and as of Jan 2026 WebGPU is Baseline
in every major browser **including Safari 26 on iOS** — so iPhone 15 can run WebGPU. TSL compiles to
**WGSL on WebGPU and GLSL on the WebGL2 fallback automatically**. That said: **this codebase is WebGL +
`onBeforeCompile` GLSL today** (`ObsidianSlab.jsx`), with a tuned `MeshPhysicalMaterial` patch
pipeline, a leva debug panel, and a `qa-route` CI that compiles GLSL under SwiftShader. Migrating the
whole renderer to WebGPU just for this one effect is a large, risky bet that breaks the shared
material/post pipeline. The SDF-fill (§2.1) works **identically in our current GLSL onBeforeCompile
pattern**, so we get the look now without the backend gamble. WebGPU/TSL is logged as a Phase-2
deep-dive, not a Phase-1 dependency.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: MSDF glyph mask + height-thresholded SDF fill (§2.1), patched onto a `MeshPhysicalMaterial`
via the existing `onBeforeCompile` chunk-injection pattern, with a small number of drei
`<MarchingCubes>` blobs (§2.2) used ONLY for the pour-front droplet and channel→letter hand-off.**

Why this is the right call for *this* world and *these* constraints:

- **It's buildable in the existing pipeline, today.** It reuses `GLSL_NOISE` (`gw_fbm`/`gw_snoise`),
  `PAL` + `v3()` inlined brand colours, the HEAD/NORMAL/COLOR injection hooks, the dt-damped store
  uniforms, and the bloom-only-blooms rule (HDR `>1` cores). No new renderer, no EXR, no second
  Canvas — every non-negotiable in `forge-scene`, `shader-fx`, and `post-fx` is satisfied.
- **It is the cheapest path to the exact art-direction.** The brief wants a *controllable* meniscus,
  a *cool-through-gradient*, and a *left-to-right* sweep. Height-thresholded SDF gives all three as
  shader parameters; raymarching and fluid sim do not give that level of cheap control.
- **It shares the master temperature system natively.** The fill height drives a `uTemp`-style
  gradient identical to the slab's `body = mix(crimson, ember, …); mix(…, hot, core)` lerp — so a
  filled letter and the obsidian veins are literally the same colour math.
- **The A/E divine-fire exception is a one-line branch** on a per-glyph `uIgnite` flag — it bypasses
  the cooling ramp and clamps to white-gold, then writes an HDR value so it (and only it) blooms and
  can drive a real light for the Ogham.
- **Marching-cubes is contained.** We pay its cost only for ~1–3 small blobs at the live pour front,
  at low grid resolution, gated to `high`/`low` (the static tier shows the settled result). The bulk
  fill — the expensive-if-done-wrong part — stays as cheap shader masking.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` (current r17x in repo) — keep WebGL `WebGLRenderer`; **no backend change**.
- `@react-three/fiber`, `@react-three/drei` — already present. Use drei `<MarchingCubes>` /
  `<MarchingCube>` for the pour-front blobs only.
- **MSDF text:** `three-msdf-text-utils` (leochocolat) for the WebGL/GLSL path — gives us a glyph
  quad mesh + an MSDF atlas we sample for the analytic mask. (If/when we move to WebGPU in Phase 2,
  swap to Léo Mouraire's **Three MSDF Text** `MSDFTextNodeMaterial` + TSL.)
- Bake the **GAELWORX** atlas offline (msdf-bmfont / the threejsresources MSDF generator) — **no
  runtime font/atlas pipeline beyond a static PNG+JSON**, consistent with "no runtime EXR / static
  assets only."

### 4.2 The fill shader (GLSL, injected the GAELWORX way)
We patch a `MeshPhysicalMaterial` on the wordmark mesh exactly like `ObsidianSlab.jsx`. The glyph
quads carry: `vUv` (atlas UV for the MSDF sample) and a second attribute `aLocalUv` (0..1 within each
letter's own bounding box, so `aLocalUv.y` is the fill axis) plus `aGlyphIndex` (for per-letter timing
and the A/E ignite flag).

**HEAD block** (prepend after `#include <common>`):
```glsl
uniform float uTime;
uniform float uFillFront;   // global pour progress 0..N across the wordmark
uniform float uTemp;        // master temperature coupling (shared with slab)
uniform sampler2D uMSDF;    // the glyph atlas
uniform float uIgniteMask;  // per-draw: which glyphs are A/E (or via attribute)
${GLSL_NOISE}               // gw_fbm / gw_snoise — DO NOT paste a second noise

float gwMsdf(vec2 uv){
  vec3 s = texture2D(uMSDF, uv).rgb;
  return max(min(s.r, s.g), min(max(s.r, s.g), s.b)); // median = signed dist
}
// master temperature gradient — IDENTICAL math to the slab body lerp
vec3 gwTempColor(float tNorm){            // 1 = white-hot, 0 = iron-black
  vec3 c = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, smoothstep(0.15, 0.6, tNorm));
  c = mix(${v3(PAL.crimsonDeep)}, c, smoothstep(0.0, 0.2, tNorm)); // iron-black floor
  c = mix(c, ${v3(PAL.hot)}, smoothstep(0.7, 1.0, tNorm));          // white-hot cap (HDR)
  return c;
}
```

**COLOR block** (before `#include <tonemapping_fragment>`, so it adds emissive pre-tonemap):
```glsl
// 1) glyph coverage from MSDF (analytic, crisp at any scale)
float d  = gwMsdf(vUv);
float px = fwidth(d);
float inGlyph = smoothstep(0.5 - px, 0.5 + px, d);   // 1 inside the letter

// 2) per-letter fill progress: each glyph's window of the global front, L->R
float litWindow = clamp(uFillFront - aGlyphIndex, 0.0, 1.0); // 0..1 for THIS letter
// 3) rising surface line in the letter's local space, with a bubbling meniscus
float bubble = gw_fbm(vec2(aLocalUv.x * 6.0, uTime * 1.4)) * 0.05;
float surface = litWindow + bubble;                  // current metal height (local y)
float fill    = smoothstep(surface + 0.012, surface - 0.012, aLocalUv.y); // below = filled

// 4) the white-hot leading edge (meniscus band) hugging the surface
float edge = exp(-pow((aLocalUv.y - surface) / 0.045, 2.0)); // gaussian band

// 5) cooling: freshly-filled metal is hot, settles & cools over time-in-fill
//    coolAge grows from the bottom up and is gated by the GLOBAL master uTemp
float coolAge = clamp((litWindow - aLocalUv.y) * 1.6, 0.0, 1.0);
float tNorm   = mix(1.0, 0.18, coolAge) * (0.6 + 0.4 * uTemp);

// 6) A/E DIVINE FIRE — never cools; clamp white-gold, HDR so it blooms + lights stone
float ignite  = aIgnite;                              // 0 normal, 1 = first A / first E
tNorm = mix(tNorm, 1.15, ignite);                     // >1 => HDR => bloom

vec3 metal = gwTempColor(tNorm);
metal += ${v3(PAL.hot)} * edge * (1.0 - 0.0 * ignite); // hot meniscus glow (HDR)
// glassy settle: a faint fresnel sheen once cooled
float sheen = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)),0.,1.), 3.0);
metal += metal * sheen * 0.25 * (1.0 - edge);

float coverage = inGlyph * fill;
gl_FragColor.rgb += metal * coverage;
gl_FragColor.a    = max(gl_FragColor.a, coverage);   // for the divine-fire glyphs' light cutout
```

Add `m.defines = { USE_UV: '' }` (matches the slab). Mutate `.value`s in `useFrame`, dt-damped.

### 4.3 r3f component shape
```jsx
function MoltenWordmark({ quality }) {
  const { geometry } = useMSDFText('GAELWORX', atlas) // three-msdf-text-utils -> quads
  // inject aLocalUv, aGlyphIndex, aIgnite (A,E -> 1) as buffer attributes at build time
  const uniforms = useMemo(() => ({
    uTime:{value:0}, uFillFront:{value:0}, uTemp:{value:0}, uMSDF:{value:atlasTex},
  }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color:'#030205', metalness:0, roughness:0.12, clearcoat:1, clearcoatRoughness:0.04,
      envMapIntensity:1.4, transparent:true,
    })
    m.defines = { USE_UV:'' }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    const sc = sceneFor(forge.route)
    // pour progress driven by scroll/route; SETTLED instantly on static
    const target = forge.quality === 'static' ? GLYPH_COUNT : range(forge.scrollDamped, 0, 1) * GLYPH_COUNT
    uniforms.uFillFront.value = damp(uniforms.uFillFront.value, target, 2.5, dt)
    uniforms.uTemp.value = damp(uniforms.uTemp.value, Math.min(forge.scrollDamped + forge.scrollVel*0.25, 1), 3, dt)
  })
  return <mesh geometry={geometry} material={material} />
}
```

### 4.4 Channel → letter hand-off (the seam fix)
The channel flow (research topic elsewhere) and this fill must share **one master clock and one
colour function**. Two mechanisms keep it seamless:

1. **Shared progress driver.** The channel's pour-front position and `uFillFront` here are derived
   from the *same* `forge.scrollDamped`/route timeline, offset by per-letter `aGlyphIndex`. When the
   channel front reaches glyph `i`, `uFillFront` crosses `i` — so the metal "arrives" exactly as the
   letter begins to fill. No independent timers (forbidden per `forge-scene`).
2. **A bridging marching-cubes droplet.** At the live junction, place 1–3 low-res `<MarchingCube>`
   blobs that visually `smin`-merge the channel stream into the letter mouth (iq smin). They use
   `gwTempColor` too, so the blob, the channel, and the fill are the same metal. Gate to non-static.

### 4.5 Key uniforms / parameters
| uniform | meaning | source |
|---|---|---|
| `uFillFront` | global pour progress (0..N glyphs) | `forge.scrollDamped` × glyph count, damped |
| `uTemp` | master temperature coupling | shared with slab (`scrollDamped + vel`) |
| `uTime` | bubbling/meniscus animation | frozen to `2` on static |
| `aGlyphIndex` | per-letter L→R timing offset | baked attribute |
| `aIgnite` | 1 for first A & first E | baked attribute (brand rule) |
| meniscus width `0.045` | leading-edge band thickness | art constant |
| `coolAge` rate `1.6` | how fast filled metal cools | art constant |

---

## 5. COHESION

This effect is engineered to be the *same world*, not a bolted-on widget:

- **Palette / colour math.** `gwTempColor()` reuses `PAL.crimsonDeep → PAL.crimson → PAL.ember →
  PAL.hot` — the **identical lerp** the slab uses for `body`/`core` (`ObsidianSlab.jsx` COLOR block).
  A filled letter at temperature `t` is the same hex as a vein at temperature `t`. Brand colours are
  inlined via `${v3(PAL.x)}`; nothing hardcoded.
- **The master temperature system.** Both the slab and the wordmark read a shared `uTemp` fed from
  `forge.scrollDamped` + `forge.scrollVel`. Scroll/strike heats the whole world at once — the veins
  flare and the letters run hotter in the same frame, dt-damped with the same `damp(…, λ, dt)`.
- **A/E divine fire = the brand's A+E ignite rule, in 3D.** The DOM enforces ignited A/E via
  `.forge-letter`; the 3D wordmark mirrors it with `aIgnite` → white-gold HDR. The forge gradient
  `#E85D04→#C1292E→#E34A27` (CLAUDE.md) is the warm half of `gwTempColor`, so the 3D divine fire and
  the CSS ignite read as the same fire.
- **Bloom-only-blooms.** Meniscus, white-hot caps, and the A/E glyphs write HDR (`PAL.hot`, `>1`) so
  the existing `Bloom luminanceThreshold={0.55}` catches exactly them — no bloom-intensity hacking.
- **Sparks & lighting.** The A/E HDR fill can drive a small `pointLight` (Ember Glow) positioned at
  each ignited glyph so it **physically lights the basalt and makes the Ogham readable** — same
  Lightformer-built, no-EXR lighting world. Embers/sparks (`Embers.jsx`) orbit the pour front using
  the same `uFillFront` position.
- **Brutalist DOM untouched.** This lives entirely in the single WebGL canvas; the 0px-corner DOM
  layer is unaffected.

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED is the judge; the budget is strict. This approach is mobile-first by construction:

- **The bulk fill is nearly free.** A few `texture2D` + `smoothstep` + `fwidth` ops per pixel on
  glyph quads that already exist. No iso-surface rebuild, no march. This is the cheapest of the four
  families and the whole reason it's the pick.
- **Quality tiers (honor `useQuality`):**
  - `high`: full meniscus noise, the bridging marching-cubes droplet (low grid res, ≤3 blobs),
    glassy fresnel sheen, fill animates with scroll.
  - `low`: drop the marching-cubes blobs (fill front just crosses the seam), reduce `gw_fbm` bubble
    to a 2-octave call, keep the gradient + meniscus.
  - `static` (prefers-reduced-motion): **render the fully settled, cooled wordmark** — `uFillFront =
    GLYPH_COUNT`, `uTime` frozen to `2`, no blobs, A/E still ignited. `frameloop='demand'`.
- **DPR** already tiered in `ForgeCanvas` (`[1,2]/[1,1.4]/1`) — inherit it.
- **MSDF resolution:** one modest atlas (e.g. 512²) for the 8 glyphs; analytic edge means it stays
  crisp without a huge texture.
- **Fallback:** `CanvasBoundary` already posters a static frame on WebGL failure; the prerendered
  static HTML carries the wordmark for no-JS/AEO. The 3D fill is enhancement, never the LCP.
- **Cost knobs, in order:** marching-cubes grid res → blob count → fbm octaves in `bubble` → meniscus
  gaussian → fresnel sheen. Tune from the device via `?debug` leva.

---

## 7. GET-IT-RIGHT-FIRST-TIME

The pitfalls that waste days, and the order to avoid them:

1. **Per-letter local coordinates first.** The #1 trap is filling against the whole-mesh UV instead
   of each glyph's own bounding box — the surface line then tilts/skews across the wordmark. **Bake
   `aLocalUv` (0..1 per glyph) before writing a line of fill math** and verify with a debug
   `gl_FragColor.rgb = vec3(aLocalUv, 0.)`.
2. **MSDF median, not a single channel.** Use `median(r,g,b)` and `fwidth` for the edge or letters
   alias/shimmer at distance. This is the whole point of MSDF over plain SDF.
3. **Don't animate the channel and the fill on separate clocks.** Both must derive from
   `forge.scrollDamped` + `aGlyphIndex`. A separate `setInterval`/rAF for the fill (forbidden by
   `forge-scene`) guarantees a visible seam where the metal "teleports" between channel and letter.
4. **Get HDR right or nothing blooms.** The meniscus and A/E must exceed `1.0` (`PAL.hot`) — otherwise
   `luminanceThreshold={0.55}` skips them and the divine fire looks dull. Don't compensate by raising
   bloom intensity (washes everything).
5. **Build the cooling gradient against `uTemp` from day one.** If you hardcode the cool colours and
   bolt on `uTemp` later, the letters won't heat in sync with the slab on scroll/strike and the world
   fractures. Wire the shared uniform first.
6. **Enforce the A/E ignite as a baked attribute, not a string match in the shader.** Compute "first A
   / first E per word" at geometry-build time (mirroring `BrandText.jsx` `TERMS` logic) so the brand
   rule is data, not a fragile GLSL conditional.
7. **Verify under SwiftShader, then read on device.** `qa-route` at 393×852 + 1440×900, **0 console
   errors** = GLSL compiled. Then read the real look on the iPhone — bloom spread, true-black,
   meniscus glow, and A/E radiance do **not** simulate headless.
8. **Transparency/draw-order:** `transparent:true` glyph quads can z-fight or sort oddly against the
   slab; keep the wordmark on its own depth-tested layer and test the cooled-settled state for halos.

**Order of operations:** atlas + `aLocalUv`/`aGlyphIndex`/`aIgnite` attributes → static settled
render (no animation) → coverage mask correct → fill height + meniscus → cooling gradient on `uTemp`
→ A/E divine fire + light → channel hand-off (shared driver, then optional blobs) → mobile tiers →
device read.

---

## 8. SOURCES (2025–2026)

- **Codrops — "WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL"**
  (Jan 28, 2026). MSDF text + TSL masking, `MSDFTextNodeMaterial`, noise-thresholded glyph SDF,
  selective bloom via MRT. https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
- **Codrops — "Interactive Text Destruction with Three.js, WebGPU, and TSL"** (Jul 22, 2025).
  Per-glyph attributes + shader-driven glyph transforms; the modern text-as-shader-source pattern.
  https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
- **Maxime Heckel — "On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and
  Raymarching for the Web"** (2025). SDF shaping + raymarching for web budgets; the fidelity/cost
  reasoning behind §2.3. https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
- **Maxime Heckel — "Field Guide to TSL and WebGPU"** (2025/2026). TSL authoring, WGSL/GLSL
  cross-compile, when WebGPU pays off — basis for the §2.5 backend decision.
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- **utsubo — "What's New in Three.js (2026): WebGPU, New Workflows & Beyond"** (2026). r171 WebGPU
  production-ready, automatic WebGL2 fallback, Safari 26/iOS Baseline status.
  https://www.utsubo.com/blog/threejs-2026-what-changed
- **utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist"** (2026). Backend-swap cost
  and `three/webgpu` automatic fallback specifics; supports keeping WebGL for now.
  https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- **Inigo Quilez — "Smooth Minimum" (full rewrite)** — cited via 2025 coverage (Jelly Renders, "2D
  Signed Distance Fields", Dec 1, 2025): smin variants for the metaball/channel-merge blends.
  https://jellyrenders.com/2025/12/01/signed-distance-fields/ · canonical: https://iquilezles.org/articles/smin/
- **threejsroadmap — "TSL: A Better Way to Write Shaders in Three.js"** (2025). TSL node model and
  the GLSL→TSL migration framing for Phase-2 planning. https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **MSDF wordmark pipeline for Cinzel Decorative** — baking a high-quality MSDF atlas for our exact
   ignited-A/E wordmark (kerning, the "play with the letters" overlaps), and the `aLocalUv`/`aIgnite`
   attribute-generation step, including a WebGPU `MSDFTextNodeMaterial`/TSL variant.
2. **Channel→letter continuity & the smin-bridged pour front** — the shared master clock contract,
   marching-cubes droplet hand-off at low res, and how the interlace channel geometry meets each
   glyph mouth without a seam across all routes.
3. **Meniscus & glassy-settle physics fake** — surface-tension curl at glyph walls, bubble lifecycle,
   the cooled "glassy" specular/clearcoat transition, and ember-vein cracking in the iron-black stage.
4. **WebGPU/TSL migration of the forge material stack** — cost/benefit of moving the whole
   `onBeforeCompile` pipeline to TSL nodes (cross-compile, leva debug parity, `qa-route` under a
   WebGPU-capable CI), so the fill, slab, and post share one node graph.
