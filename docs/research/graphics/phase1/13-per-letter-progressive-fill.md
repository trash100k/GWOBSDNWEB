# 13 — Per-Letter Progressive Fill / Reveal Control

_Phase 1 graphics research · GAELWORX forge world · target: iPhone 15 OLED_

> "Automatic Execution. Clan Protected." — the molten metal reaches the mark and **fills it, letter by letter.**

---

## 1. SCOPE

This element is the **payoff of the entire forge sequence**: living molten metal, released from the
stone altar, has wound through the Celtic-interlace channels carved in the green-black basalt and now
arrives at the **GAELWORX letterforms** (Cinzel Decorative). As the user scrolls, the pour front
crosses the wordmark **left-to-right**, and each glyph **fills** with white-hot metal that immediately
begins to **cool through its own temperature timeline** (white-hot → orange → forge-red → iron-black
with deep ember veins) — _except the `A` and the `E`_, which lock to unearthly **white-gold "divine
fire" forever** and radiate light onto adjacent stone (revealing carved Ogham; see the divine-fire and
Ogham research docs). The job of _this_ doc is the **control rig**: how each letter owns an independent
`fillProgress` and `temperature`, how thin strokes fill fast and thick strokes slow, how the whole
thing is **scroll-driven** through the shared store, and how it stays buildable inside this one-renderer,
mobile-first codebase without bolting on a second `<Canvas>` or breaking the warm-forge master system.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four credible ways to put fillable, per-letter, temperature-driven GAELWORX letters on screen
in 2026. All four are real today; they differ sharply on quality, mobile cost, and how cleanly they
plug into the existing `MeshPhysicalMaterial` + `onBeforeCompile` pattern.

### A. SDF/MSDF text with a per-glyph `fillProgress` attribute (the workhorse)

Render the wordmark as a single SDF/MSDF mesh (one draw call, glyphs as quads against a distance-field
atlas) and drive the fill **in the fragment shader** off a per-glyph value. The canonical modern
write-ups are the Codrops _"Responsive & SEO-friendly WebGL Text"_ piece (Jun 2025), which uses
`troika-three-text` + a `uProgress` uniform and a `reveal = 1.0 - vUv.y; if (reveal > uProgress)
discard;` mask, and the Codrops _Gommage_ tutorial (Jan 2026), which uses **Three MSDF Text**
(`MSDFTextNodeMaterial`) and — crucially — **a per-letter offset attribute** so each glyph dissolves at
its own time rather than uniformly. That per-letter attribute is exactly the hook we need: replace
"dissolve offset" with "fill start + fill duration + temperature seed."

- **Quality:** crisp at any scale (distance field), clean AA via `fwidth`. Excellent.
- **Perf:** one mesh, one draw call, a handful of cheap per-fragment ops. The best mobile profile.
- **Mobile:** ideal. This is the pick for the iPhone budget.
- **Complexity:** moderate — you must thread a **per-glyph attribute** (the SDF atlas only gives you
  glyph UVs, not "which letter am I"), and you must derive a stable **left-to-right axis** and a
  **stroke-thickness proxy** per fragment.

### B. `troika-three-text` + `InstancedUniformsMesh` (per-letter uniforms, no atlas wrangling)

Troika parses the `.ttf` on a worker, builds the SDF atlas on the fly, and **patches any Three.js
material** (so it composes with our PBR look). Its sibling `three-instanced-uniforms-mesh` exposes
`mesh.setUniformAt(name, glyphIndex, value)` to make _any_ float/vec uniform **per-instance** — i.e.
**per glyph** — auto-upgrading the uniform to an instanced attribute. That gives us `fillProgress`,
`fillStart`, `tempSeed` per letter in plain JS, no manual attribute packing.

- **Quality:** same SDF crispness as A; you keep Three's lighting/PBR by deriving the material.
- **Perf:** still effectively instanced; very good. Slightly more abstraction overhead than raw A.
- **Mobile:** good. Troika's worker keeps font parsing off the main thread (no LCP hit).
- **Complexity:** lowest JS-side per-letter ergonomics; but Troika is **WebGL/GLSL (not yet WebGPU/TSL)**
  as of the Gommage author's note (Jan 2026), and you customize via `createDerivedMaterial`, not our
  familiar `onBeforeCompile` string-replace. Known gotcha: `setUniformAt` and a custom `onBeforeCompile`
  fight unless you go through Troika's derive path.

### C. Real 3D `TextGeometry` + GPU vertex sim (volumetric letters)

Extrude the glyphs to actual geometry (`TextGeometry`) and fill/deform per-vertex — the approach behind
Codrops _"Interactive Text Destruction"_ (Jul 2025), which stores original positions in a TSL
`storageBuffer` and runs a compute pass per vertex with spring physics. You'd reinterpret "explode" as
"rise/fill" and color per-vertex by temperature.

- **Quality:** genuinely volumetric — bevels, real depth, the metal can have thickness. Gorgeous.
- **Perf:** heavy. High vertex counts, optional compute pass; this is a desktop-WebGPU flex.
- **Mobile:** poor fit for the iPhone budget as the _hero_, viable only as a high-tier upgrade.
- **Complexity:** high. Per-letter control means segmenting `TextGeometry` per glyph and tracking ranges.

### D. Texture-space fill (render the wordmark to an offscreen target, fill in screen/UV space)

Draw the wordmark once into a mask texture, then run a full-screen/quad pass that fills by comparing a
moving threshold against the glyph's normalized X. Related in spirit to Codrops' scroll-driven
post-processing reveals (the Oct 2025 GSAP-shader piece animates a `progress` uniform with noise-based
masking + smoothstep edges).

- **Quality:** good, but the fill is 2D — no real per-letter temperature volume, harder to make the
  metal feel like it has body. Easy to look "decal-y."
- **Perf:** an extra render target + pass; mid.
- **Mobile:** mediocre — the extra RT costs fill-rate, the enemy on mobile.
- **Complexity:** medium; but it fights our single-composer pipeline (`Effects.jsx`).

**Verdict of the landscape:** A and B are the same family (SDF fill driven per glyph) and are the only
two that respect the mobile budget while giving true per-letter temperature. C is a high-tier dream, D
is a compromise. We build **B for ergonomics with A's shader math**, with **C reserved as a high-tier
visual upgrade** and a TSL/WebGPU migration path noted for later.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Build the wordmark as an SDF mesh whose fragment shader fills and cools each glyph independently,
with per-letter control supplied as instanced attributes — i.e. Technique B (troika +
`InstancedUniformsMesh`) carrying Technique A's shader math.** Justification, tied to the world and the
hard constraints:

1. **One renderer, mobile-first.** A/B is a single mesh, one draw call, cheap per-fragment work — the
   only family that fits the iPhone-15 budget while still giving every letter its own timeline. It drops
   straight into `ForgeCanvas` next to `ObsidianSlab`; no second `<Canvas>`/context (the cardinal sin in
   `forge-scene`).

2. **It matches our shader idiom.** We already patch stock materials and inject GLSL (`shader-fx`,
   `ObsidianSlab.onBeforeCompile`). The fill math lives in the same kind of HEAD/COLOR injection,
   reuses `GLSL_NOISE` (`gw_fbm` for the molten churn and the cooling vein detail), and inlines `PAL`
   colors via `v3()` — so the letters share the **exact** crimson→ember→hot ramp as the slab and embers.

3. **Per-letter is first-class, in plain JS.** `setUniformAt('uFillStart', i, x)` /
   `setUniformAt('uFillDur', i, d)` / `setUniformAt('uIsDivine', i, isAE)` lets us schedule the
   left-to-right cascade and the A/E exception declaratively, while the shader does the cooling. No
   manual buffer packing, no fragile attribute strides.

4. **Scroll-driven for free.** We already have `forge.scrollDamped` / `forge.scrollVel` in the store,
   read in dt-damped `useFrame` loops. A single global `uPour` (0→1) derived from scroll, combined with
   each glyph's `uFillStart`/`uFillDur`, produces the cascade — no new rAF, honoring `motion-feel` rule 6.

5. **A/E divine-fire is a per-letter flag, not a special pass.** The ignite rule (CLAUDE.md) is the
   brand's soul. With per-glyph uniforms, the first `A` and first `E` simply carry `uIsDivine=1`, which
   freezes their temperature at white-gold and boosts emissive above 1 so **bloom catches only them**
   (`post-fx` "only HDR blooms"). Cohesive by construction.

We accept that troika is GLSL-only today; that's fine — the whole app is WebGL, and we keep a clean TSL
port path (Section 7).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` (repo's r17x line) — already present.
- `@react-three/fiber`, `@react-three/drei` — already present (`drei` re-exports `troika-three-text`
  as `<Text>`; we go one level lower for per-glyph control).
- `troika-three-text` (^0.52+, the version drei pins) — SDF atlas + `createDerivedMaterial`.
- `three-instanced-uniforms-mesh` (^0.52, the `setUniformAt` API) — per-glyph uniforms.
- Reuse in-repo: `GLSL_NOISE` (`src/scene/shaders.js`), `PAL`/`v3` (`src/scene/palette.js`),
  `forge`/`damp`/`range` (`src/store.js`), `sceneFor` (`src/scene/scenes.js`).

> Self-host note: Cinzel Decorative is already bundled via `@fontsource/cinzel-decorative` (CLAUDE.md).
> Point troika at the **same** local `.woff/.ttf` URL so the 3D wordmark and DOM wordmark are the
> identical typeface — no second font fetch, no FOUT mismatch.

### 4.2 The per-letter attribute rig

Each glyph carries four per-instance values:

| uniform (per glyph) | meaning | source |
|---|---|---|
| `uFillStart` | normalized pour position (0..1) at which this glyph begins filling | glyph center X, normalized over the wordmark width |
| `uFillDur`   | how long (in pour units) this glyph takes to fill | **inversely** proportional to stroke thinness — thin glyphs fast, thick slow |
| `uTempSeed`  | per-glyph noise phase so cooling veins differ letter to letter | `random()` once |
| `uIsDivine`  | 1.0 for the first `A` and first `E`, else 0.0 | brand rule |

`uFillDur` is the "thin fills fast / thick fills slow" law. We approximate per-glyph stroke mass at
sync time from troika's `textRenderInfo` glyph bounds + a coverage estimate (ratio of inked SDF area to
glyph box). A cheap, robust proxy: `mass = glyphBoxArea_normalized`; `uFillDur = lerp(0.05, 0.16, mass)`.
(`I`/`L` thin → ~0.05; `G`/`W`/`O` thick → ~0.16.) Tune in the leva panel.

```js
// PourWordmark.jsx — shape (r3f). One mesh, per-glyph uniforms, scroll-driven.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text as TroikaText } from 'troika-three-text'
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

const WORD = 'GAELWORX'

export default function PourWordmark({ quality }) {
  const ref = useRef()                 // the InstancedUniformsMesh wrapper
  const troika = useMemo(() => new TroikaText(), [])

  useEffect(() => {
    troika.text = WORD
    troika.font = '/fonts/cinzel-decorative-900.woff'  // SAME file as the DOM wordmark
    troika.fontSize = 1
    troika.anchorX = 'center'; troika.anchorY = 'middle'
    troika.letterSpacing = 0.02
    troika.material = makeFillMaterial(quality)        // derived below
    troika.sync(() => wireGlyphs())                    // async (worker) — wire on completion
    return () => { troika.dispose() }
  }, [troika, quality])

  // After sync: read per-glyph bounds, schedule fill start/dur, set per-instance uniforms.
  function wireGlyphs() {
    const info = troika.textRenderInfo
    const n = WORD.length
    // glyph centers + box areas from info.glyphBounds: [x0,y0,x1,y1] * n
    const gb = info.glyphBounds
    const xs = [], areas = []
    let minX = Infinity, maxX = -Infinity
    for (let i = 0; i < n; i++) {
      const x0 = gb[i*4], y0 = gb[i*4+1], x1 = gb[i*4+2], y1 = gb[i*4+3]
      const cx = (x0 + x1) / 2
      xs.push(cx); areas.push((x1-x0) * (y1-y0))
      minX = Math.min(minX, x0); maxX = Math.max(maxX, x1)
    }
    const span = maxX - minX || 1
    const maxA = Math.max(...areas) || 1
    // first A and first E only (brand ignite rule)
    const firstA = WORD.indexOf('A'), firstE = WORD.indexOf('E')

    const mesh = new InstancedUniformsMesh(troika.geometry, troika.material, n)
    for (let i = 0; i < n; i++) {
      mesh.setUniformAt('uFillStart', i, (xs[i] - minX) / span)            // L→R order
      mesh.setUniformAt('uFillDur',   i, THREE.MathUtils.lerp(0.05, 0.16, areas[i]/maxA))
      mesh.setUniformAt('uTempSeed',  i, Math.random() * 6.283)
      mesh.setUniformAt('uIsDivine',  i, (i === firstA || i === firstE) ? 1 : 0)
    }
    ref.current = mesh
    // mesh is parented to the troika object's parent in JSX via <primitive>
  }

  useFrame((state, dt) => {
    const m = ref.current; if (!m) return
    const mat = m.material
    mat.uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    // POUR = scroll position mapped to 0..1 over the wordmark section, dt-damped.
    const target = forge.ready ? range(forge.scrollDamped, 0.18, 0.62) : 0   // section window
    mat.uniforms.uPour.value = damp(mat.uniforms.uPour.value, target, 3, dt)
    mat.uniforms.uVel.value  = damp(mat.uniforms.uVel.value, Math.min(forge.scrollVel * 1.4, 1), 4, dt)
  })

  return <primitive object={troika} />   // mesh swap handled in wireGlyphs via primitive child
}
```

> Wiring detail: in practice you either (a) let troika own the mesh and use its derived material with a
> packed `instanceMatrix`-style attribute, or (b) build the `InstancedUniformsMesh` from
> `troika.geometry`/`troika.material` as above and add **that** to the scene instead of the raw troika
> object. Use one path; the snippet shows (b) for clarity. `setUniformAt` auto-flags the attribute for
> upload — no manual `needsUpdate`.

### 4.3 The fill + cooling shader (derived material, GLSL)

We derive from a `MeshPhysicalMaterial` (keep PBR + env reflection so the metal reads as metal), then
inject. troika's `createDerivedMaterial` is the supported hook; conceptually it is our familiar
HEAD/COLOR injection.

```glsl
// HEAD — uniforms + helpers (these become per-glyph via setUniformAt)
uniform float uTime, uPour, uVel;
uniform float uFillStart, uFillDur, uTempSeed, uIsDivine;   // per-glyph
varying vec2 vUv;                                            // glyph-local UV (0..1)
${GLSL_NOISE}                                                // gw_fbm / gw_snoise

// blackbody-ish forge ramp: t in [0..1], 0 = iron-black, 1 = white-hot.
// Matches the slab: crimson -> ember -> hot (HDR core blooms).
vec3 gwForgeRamp(float t){
  vec3 black  = ${v3(PAL.ink)};
  vec3 red    = ${v3(PAL.crimson)};
  vec3 ember  = ${v3(PAL.ember)};
  vec3 hot    = ${v3(PAL.hot)};        // >1, the only part that blooms
  vec3 c = mix(black, red,  smoothstep(0.05, 0.40, t));
  c = mix(c, ember, smoothstep(0.40, 0.72, t));
  c = mix(c, hot,   smoothstep(0.72, 1.00, t));
  return c;
}
```

```glsl
// COLOR — runs before <tonemapping_fragment>, adds emissive
// 1) local fill amount for THIS glyph from the global pour + its window
float gStart = uFillStart;
float gEnd   = uFillStart * 0.0 + (uFillStart) + uFillDur;     // start..start+dur in pour-space
// remap pour through this glyph's window -> 0..1
float fillT  = clamp((uPour - gStart) / max(uFillDur, 1e-3), 0.0, 1.0);

// 2) left-to-right WITHIN the glyph: metal climbs across its own width.
//    vUv.x is glyph-local; the wet front is a soft edge that advances with fillT.
float front  = fillT * 1.08;                       // slight overshoot so the last sliver fills
float wet    = smoothstep(front + 0.06, front - 0.02, vUv.x);  // 1 behind front, 0 ahead
//    a thin MOLTEN LIP right at the front, hotter + churning
float lip    = smoothstep(0.10, 0.0, abs(vUv.x - front));

// 3) per-glyph cooling timeline: time since this fragment got filled
//    (fragments filled earlier are cooler). Approx via how far behind the front it is.
float cooled = clamp((front - vUv.x) * 2.2, 0.0, 1.0);          // 0 at front, 1 deep behind
float churn  = gw_fbm(vUv * 6.0 + vec2(uTime * 0.4, uTempSeed)); // molten body movement
float temp   = mix(1.0, 0.18, cooled);                          // white-hot -> iron-black
temp += lip * 0.6 + churn * 0.10 * wet;                          // lip hot, body alive
temp += uVel * 0.12;                                            // scroll runs it hotter (cohesion)

// 4) DIVINE EXCEPTION: A and E never cool. Lock white-gold, HDR, eternal.
float divine = uIsDivine;
temp = mix(temp, 1.15 + 0.15 * sin(uTime * 1.3 + uTempSeed), divine);  // >1 so it blooms forever

// 5) compose
vec3 metal = gwForgeRamp(clamp(temp, 0.0, 1.3));
//    deep ember veins in the cooled iron (reuse the slab's vein feel)
float vein = pow(clamp(1.0 - abs(gw_fbm(vUv * 5.0 + uTempSeed)), 0.0, 1.0), 6.0);
metal += ${v3(PAL.ember)} * vein * (1.0 - cooled) * 0.5 * (1.0 - divine);
//    white-gold tint for divine letters
metal = mix(metal, metal * vec3(1.0, 0.92, 0.72) + vec3(0.15, 0.10, 0.04), divine);

// emissive: only filled (wet) area lights; unfilled glyph is dark stone-cold metal
vec3 emissive = metal * (wet * 0.9 + divine);
gl_FragColor.rgb += emissive;
// SDF alpha is handled by troika's derived material; unfilled = dark, not transparent.
```

### 4.4 Key uniforms & parameters (leva-tunable via `?debug`)

- **Global:** `uPour` (scroll 0..1), `uVel` (scroll energy, shares the slab's `scrollVel`), `uTime`.
- **Per glyph:** `uFillStart`, `uFillDur`, `uTempSeed`, `uIsDivine`.
- **Tuning knobs:** front softness (`0.06`/`0.02`), lip width (`0.10`), cooling rate (`2.2`),
  churn amount, `fillDur` min/max (`0.05`–`0.16`), divine pulse rate.

### 4.5 Hooking the shared master temperature system

The single most important cohesion move: **`uVel` and the ramp colors come from the same source as the
slab and embers.** `uVel` reads `forge.scrollVel` (the slab uses `Math.min(forge.scrollVel*1.4,1)` for
`uTemp`); the ramp uses `PAL.ink/crimson/ember/hot` exactly as `ObsidianSlab.COLOR`. So when the user
scrolls hard, the whole world — slab veins, embers, and the filling letters — runs hotter **together**.

---

## 5. COHESION

Nothing here is a new visual language; it is the **same forge, re-skinned as glyphs**:

- **Palette & temperature ramp.** `gwForgeRamp` is built from `PAL.ink → crimson → ember → hot`, the
  identical 60/30/10 warm set the slab uses (`ObsidianSlab.COLOR` mixes `crimson→ember→hot`). The
  letters can't drift off-palette because they literally inline the same `v3(PAL.*)`.

- **Master heat coupling.** `uVel` = `forge.scrollVel` (same scalar the slab feeds `uTemp`/`uVeinGlow`).
  One scroll, one temperature, applied everywhere. The pour also reuses `forge.scrollDamped` like the
  slab's `uVeinGlow` ramp — so the letters and the veins breathe on the same signal.

- **Molten body & cooling veins.** Reuses `gw_fbm` from `GLSL_NOISE` (the slab's churn + the ember
  veins use the same noise), so the metal inside a letter and the metal in the channels/slab share a
  grain — they read as **one substance**.

- **Bloom discipline / A+E divine fire.** Only `PAL.hot` (>1) and the divine letters exceed 1.0, so
  `Effects.jsx`'s `Bloom luminanceThreshold={0.55}` catches **only** the molten lip, the white-hot core,
  and the eternal A/E — exactly `post-fx`'s "only HDR blooms." The A/E radiate (their bloom spill _is_
  the light that makes Ogham readable — handing the baseline to the divine-fire/Ogham docs).

- **Lighting.** The letters are lit by the **same env** (the cool-white `<Lightformer>` rig in
  `ForgeCanvas`) plus their own emissive — so reflections on the not-yet-filled (cold) metal match the
  slab's obsidian reflections; the heat is all additive emissive, never a separate light.

- **Motion law.** Fill is **Forge Reveal** (the metal _wipes in_, front = a blur-to-sharp wet edge) and
  the scroll coupling is **Atmospheric Drift / Snap** — dt-damped, no bounce (`motion-feel`).

- **Geometry.** SDF letters are mathematically sharp; the molten front is the only soft edge, which is
  on-brand (0px brutalist DOM chrome stays elsewhere; this is the 3D layer's allowed warmth).

---

## 6. MOBILE & PERFORMANCE

The iPhone 15 OLED is the budget target; the whole point of picking SDF (Section 2/3) is fill-rate
economy. Tier behavior, mirroring `useQuality` (`high|low|static`) and `ForgeCanvas`/`forge-scene`:

- **One draw call.** The wordmark is a single SDF mesh; per-glyph variation is instanced attributes, not
  extra geometry or passes. No render target (we rejected Technique D for this reason).

- **`high`** — full shader (lip churn, ember veins, per-glyph cooling), `dpr [1,2]`, bloom catches the
  hot lip + A/E. Optionally allow Technique C extruded letters as a desktop-only upgrade.

- **`low`** — drop the per-fragment `gw_fbm` churn/vein octaves (or precompute a cheap 1-octave proxy),
  keep the fill mask + ramp + divine A/E. `dpr [1,1.4]`. The fill still reads; only the molten texture
  simplifies.

- **`static`** (reduced-motion / low-power) — **freeze `uTime` = 2** (the established pattern,
  `ObsidianSlab.jsx:144`, `Embers.jsx:67`) and **render at full pour** (`uPour = 1`): every letter shown
  filled and cooled, A/E lit. No animation, content fully present (crawler/no-JS safe per `motion-feel`
  rule 5). The DOM wordmark (already ignited via `<Ignite>`/`BrandText`) is the true accessible text;
  the 3D is enhancement.

- **Worker-parsed font.** troika does SDF generation on a web worker → no main-thread jank, no LCP hit;
  the 3D mounts after paint (`ForgeExperience` lazy + idle, per `forge-scene`).

- **Dispose.** `troika.dispose()` (and the derived material) on unmount — same lifecycle rule as
  `ObsidianSlab.jsx:133`.

- **Avoid the traps:** keep the fragment loop tiny (the repo's `gw_fbm` is already 3 octaves — use ≤2
  inside letters); no per-pixel branches beyond the single `divine` mix; no second composer.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations and the specific pitfalls, learned from the sources:

1. **Solve the per-glyph identity FIRST, before any pretty shading.** The #1 SDF-text trap: the atlas
   gives you glyph UVs but **not "which letter am I."** Wire `setUniformAt('uIsDivine', firstA/firstE)`
   and tint glyphs flat-color per index to **prove** each glyph receives its own uniform. Only then add
   fill, then cooling, then divine fire. (Gommage's whole trick is that per-letter offset attribute.)

2. **Async sync gotcha.** troika builds geometry on a worker — `textRenderInfo`/`glyphBounds` are
   **undefined until `sync()` fires its callback.** Schedule all `setUniformAt` calls **inside** the
   sync callback, never synchronously after construction, or every letter gets default uniforms.

3. **Don't fight `onBeforeCompile`.** With troika, customize via `createDerivedMaterial`; a raw
   `onBeforeCompile` on a troika material can get clobbered by `setUniformAt`'s shader upgrade (known
   issue #154). Pick the derive path and stay on it.

4. **Normalize the L→R axis from real bounds, not assumed advances.** Cinzel Decorative's kerning is
   uneven; compute `uFillStart` from actual `glyphBounds` centers (the snippet does), not `index/n`, or
   the pour front will visibly skip and stutter across wide vs narrow glyphs.

5. **Smooth the scroll velocity.** Raw Lenis velocity is spiky (Codrops Jun 2025 explicitly adds a
   `lerpedVelocity`); feed `uVel` through `damp` (we do) or the heat will strobe.

6. **Reserve HDR for the few.** Only the molten lip, white-hot core, and A/E exceed 1.0. If you push the
   whole filled body >1, bloom washes everything (`post-fx`). Keep the cooled iron body sub-1.

7. **The A/E must never cool — verify by scrolling past and back.** It's the brand's soul (CLAUDE.md
   ignite rule). The `divine` mix locks temp ≥1.15; confirm the first A and first E only (use
   `WORD.indexOf`), not every A/E.

8. **Verify the GAELWORX way.** `npm run build` green, then `qa-route` @ 393×852 + 1440×900 with **0
   console errors** (CI SwiftShader compiles GLSL → a shader typo surfaces as an error). Then the owner
   reads the real fill/bloom/true-black on the iPhone 15 (bloom spread + OLED don't simulate headless).
   Live-tune the knobs via `?debug` leva.

9. **TSL/WebGPU is the future, not now.** troika is GLSL-only as of Jan 2026 (Gommage author's note);
   build in GLSL today, but keep the fill math as small pure functions so a later port to a
   `MSDFTextNodeMaterial` + TSL `colorNode` (Maxime Heckel's Field Guide, Oct 2025) is mechanical.

---

## 8. SOURCES

1. Codrops — _How to Create Responsive and SEO-friendly WebGL Text_ (troika + `uProgress` mask reveal,
   `reveal = 1.0 - vUv.y; if (reveal > uProgress) discard;`, vertex `uHeight` push, Lenis
   `lerpedVelocity` smoothing). Published **2025-06-05**.
   https://tympanus.net/codrops/2025/06/05/how-to-create-responsive-and-seo-friendly-webgl-text/
2. Codrops — _WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL_
   (Three MSDF Text / `MSDFTextNodeMaterial`, **per-letter offset attribute** so glyphs animate
   independently; troika "not WebGPU/TSL compatible at time of writing"). Published **2026-01-28**.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
3. Codrops — _Interactive Text Destruction with Three.js, WebGPU, and TSL_ (`TextGeometry` +
   TSL `storage` buffers + compute pass per vertex; the volumetric Technique C). Published
   **2025-07-22**.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
4. Codrops — _How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects_
   (driving a `progress` uniform with noise-based distortion + smoothstep circular mask). Published
   **2025-10-08**.
   https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
5. Maxime Heckel — _Field Guide to TSL and WebGPU_ (node materials replace `onBeforeCompile`;
   `colorNode`/`positionNode` hooks; uniforms in TSL — the port path for Section 7). Published
   **2025-10-14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
6. Codrops — _Building an On-Scroll 3D Circle Text Animation with Three.js and Shaders_
   (`three-msdf-text-utils` + a `uSpeed` uniform from scroll velocity driving the SDF text vertex
   shader). Published **2025-02-03**.
   https://tympanus.net/codrops/2025/02/03/building-an-on-scroll-3d-circle-text-animation-with-three-js-and-shaders/
7. Troika docs — _InstancedUniformsMesh_ (`setUniformAt(name, index, value)` per-glyph uniforms,
   auto-upgrade to instanced attribute, auto-flag for upload). Accessed 2026; library maintained through
   2025 (`three r175` compat fixes in CHANGELOG).
   https://protectwise.github.io/troika/three-instanced-uniforms-mesh/
8. Troika docs — _createDerivedMaterial_ (extend a built-in material's shaders declaratively; the
   supported customization path vs. raw `onBeforeCompile`). Maintained 2025.
   https://protectwise.github.io/troika/troika-three-utils/createDerivedMaterial/

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **The molten "wet front" lip & surface tension.** The advancing fill edge is the hero close-up —
   how to make it bulge, drip, and catch light (meniscus highlight, normal perturbation at the front,
   tiny sparks shed from the lip into the shared ember system). Worth its own pass on front shaping +
   spark hand-off.
2. **A/E divine-fire light radiation onto stone (Ogham reveal).** This doc locks the A/E to eternal
   white-gold; the _light spill_ that makes carved Ogham readable is a separate lighting/decal problem
   (faked area light, screen-space glow, or baked light map on the basalt) — a full Phase-2 topic shared
   with the Ogham and divine-fire docs.
3. **TSL/WebGPU port of the per-glyph fill (`MSDFTextNodeMaterial` + node uniforms).** When troika or
   Three MSDF Text ships stable WebGPU per-instance node uniforms, migrate the fill math to a
   `colorNode`; quantify the perf/quality delta on the iPhone 15 vs. the GLSL build.
4. **Stroke-mass estimation for `uFillDur`.** "Thin fast / thick slow" currently uses glyph-box area as
   a proxy; a deeper pass could sample the SDF atlas at sync time for true inked-area / average
   stroke-width per glyph, giving physically convincing fill timing per Cinzel letterform.
