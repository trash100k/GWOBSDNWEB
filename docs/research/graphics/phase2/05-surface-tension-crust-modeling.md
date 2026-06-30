# 05 — Tensioned-Skin & Crust Modeling for Close-Camera Molten

_Phase 2 deep-dive · GAELWORX forge world · cluster **B-stone-glass-surfaces** · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js), no runtime EXR._

> **The problem this doc solves.** Phase-1 doc `01-molten-metal-surface.md §4.4` shipped a single
> `smoothstep(0.15, 0.55, vMolten)` "plateau" and a `fract(vMolten*3.0)` rind line to fake surface tension.
> That is enough at the slab's mid distance, but the **casting-room chamber** (`/software`) puts the camera
> *close* on the live pour, and at close distance that one smoothstep reads as a soft glowing blob, not
> **heavy, skinned, tensioned molten metal**. This deep-dive goes past the plateau: real **flat-top
> tensioned cells** (cooled membrane held taut by surface tension), **tearing crust lines** (the skin
> ripping under shear as the metal moves), the **dark cooling rind that forms and re-melts** (a hysteretic
> skin coverage that advances when slow/cool and retreats when sheared/hot), and **Worley-cell nucleation**
> (crust solidifies from discrete nucleation seeds, not a uniform film). It is held to the
> `00-COHESION-MAP` contract: one temperature signal, one noise basis, one palette, Worley **high-tier
> only**, and every term hooks the shared `gw_*` master system so the skin reads as the *same metal* as the
> slab veins and the cooling letters, never a bolted-on close-up shader.

---

## 1. SCOPE

This element is the **near-field surface micro-structure of the molten metal** — specifically what the
metal's top surface does at the 0.3–1.5 m virtual camera distance of the casting-room chamber, where a
single convection cell fills a third of the frame. It is *not* a new material; it is a **detail layer that
sits on top of the existing `MoltenSurface` warp/flow field** (`01-molten-metal-surface.md`) and the
shared cooling clock (`03-cooling-solidification.md`), expressed entirely through the master temperature
module (`phase2/01-master-temperature-module.md`).

At close distance, molten metal does four readable things that distinguish it from "glowing water":

1. **Tensioned skin / flat-top cells.** A thin cooled membrane sits on the surface, held flat and taut by
   surface tension. Convection cells push it up into **plateaus with sharp shoulders and flat tops** —
   the optical signature is high-contrast brightness that *clamps* at the top (the membrane caps the
   glow), with dark, almost-creased boundaries between cells.
2. **Tearing crust lines.** Where the flow shears fastest (cell boundaries, the moving pour front), the
   skin **rips**: a thin white-hot line opens where the cool membrane tears apart and the hot substrate
   underneath shows through, then heals as the metal slows. This is the single most "alive and heavy"
   read — solid skin failing under the fluid below it.
3. **The dark cooling rind that forms and re-melts.** A matte, near-black oxide rind nucleates on the
   coolest, slowest regions, **grows** as those regions cool, then **re-melts** (retreats) if fresh hot
   metal floods in or shear breaks it up. It is *hysteretic* — it has memory — which is what makes it read
   as a physical skin and not a noise threshold flickering.
4. **Worley-cell nucleation.** Crust does not appear as a uniform film; it **solidifies from discrete
   nucleation points** outward, so the skin's cell structure is **cellular (Voronoi/Worley)**, not fBm-
   blobby. F1 distance gives the cell interiors (flat-top plateaus), F2−F1 gives the crack/rind network
   between cells. This is the term that makes the close-up read as *forged scale* rather than *painted
   lava*.

This is a **B-cluster (stone/glass surfaces)** topic because the cooled crust is the bridge material
between the molten metal (A-cluster) and the basalt (B-cluster): the dark rind is the same value-range and
grain as the green-black basalt, so when a letter fully cools its skin reads as continuous with the stone
it sits in. The keystone exception stands: **the A and E never skin and never tear** — their `uIsAE` path
clamps to `gw_divineFire` and the entire crust/rind/tear machine is multiplied to zero for those glyphs.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Every approach below is rated **quality / perf / mobile / complexity** against our hard constraint: one
WebGL renderer, `onBeforeCompile` GLSL, iPhone-15 fill-rate budget, no EXR, the surface is a near-flat
patch (not a volume), and it must share the existing `gw_*` field.

### 2.A The smoothstep plateau (the Phase-1 baseline — what we are improving)
`skin = smoothstep(lo, hi, h)` flattens the top of the heat field; a `fract()` band fakes rind lines. It
is one `smoothstep` and reads fine at distance. The 2025 Inigo-Quilez remapping-functions reference (still
the canonical catalog, re-surfaced by the 2025 TSL noise guides) frames `smoothstep`/`pcurve` as the way
to "shape forms" — but a single smoothstep gives a **soft** shoulder, not a tensioned membrane's **hard**
one, and `fract()` rind lines are evenly spaced (obviously procedural up close).
- Quality: **medium** (fine far, soft near). Perf: **excellent**. Mobile: **excellent**. Complexity: **low**.
  → **Keep as the `low`/`static` fallback; replace at close distance.**

### 2.B Worley/cellular nucleation — F1 plateaus + F2−F1 crack network (the core upgrade)
Cellular (Worley/Voronoi) noise partitions space into cells around feature points; **F1** (distance to the
nearest point) gives a per-cell field that, inverted and remapped, is a natural **flat-topped cell**
(bright center, dark edge), and **F2−F1** (the classic "cellular border" / `cell` distance) gives a thin
network of lines exactly along the cell boundaries — the **crack/rind network**. The Dec-2025 Three.js
Roadmap *10 Noise Functions for TSL Shaders* ships Worley with TSL+GLSL parity and explicitly calls out the
3×3 neighbor search and F1/F2 use for "cracks, cells, organic structures"; the Apr-2025 Sangil Lee
*Understanding the Variations of Cellular Noise* catalogs the F1 / F2 / F2−F1 / Manhattan-vs-Euclidean
variants and which distance metric gives which look (Euclidean = rounded cells, Chebyshev/Manhattan =
angular, forged-looking cells); the Jan-2025 Balazs Farago *Procedural Materials with Shaders in Three.js*
demonstrates Voronoi crack networks as a stone/scale primitive. This is the **single technique that turns
the plateau into nucleated forged scale**.
- Quality: **highest** for skinned/cracked metal. Perf: **the most expensive primitive here** (3×3 = 9
  hash+distance evals; F2 needs the two smallest tracked). Mobile: **high-tier only** (per
  `00-COHESION-MAP §2`). Complexity: **medium**.
  → **The pick for `high`; gated off entirely on `low`/`static`.**

### 2.C `pow`/`pcurve` plateau remap for true flat-tops (cheap membrane on any field)
Independent of Worley, you can convert *any* field (fBm or Worley-F1) into a tensioned-skin plateau with a
hard-shoulder remap rather than a soft `smoothstep`: a high-exponent `pow`, IQ's `pcurve(x,a,b)`, or a
`smoothstep` followed by a second `smoothstep` (a "double-smooth" hard knee). The 2014→2025 IQ functions
page (the reference the modern guides cite) provides `pcurve` and `cubicPulse` for exactly this "flat in
the middle, sharp at the edges" shaping. This is the membrane's *shape* operator and is **free** — it runs
on every tier and is what makes even the `low`-tier fBm plateau read flatter than the Phase-1 single
smoothstep.
- Quality: **high** (the flat-top read). Perf: **free**. Mobile: **excellent**. Complexity: **low**.
  → **Ship on all tiers** as the plateau shaper; on `high` it shapes the Worley-F1 field, on `low` it
  shapes the fBm field.

### 2.D Hysteretic skin coverage — the rind that forms *and re-melts*
The Phase-1 crust is `step(crustN, T*1.3)` — a pure function of the current temperature, so it has no
memory: it cannot "form then re-melt." A physical rind has **hysteresis** — it advances when the metal is
slow and cool, and only retreats when shear/heat exceeds a *higher* threshold than the one that formed it.
On WebGL2 without a state texture we fake hysteresis **analytically** from the shared cooling age plus the
local flow-shear magnitude: `skinCoverage = smoothstep(formT, formT+w, T) * (1 - smoothstep(tearS,
tearS+w, shear))`, where `shear = length(grad(flowField))`. The 2026 Damian Van Der Merwe *Painting with
Math: Lava Lamp* piece (banded color from layered fields, click-spawned heat pools that locally re-melt)
and the 2025 Codrops *Stylized Water* article (a shared store driving surface params, `smoothstep`
banding) are the modern grammar for this kind of analytic, store-coupled coverage without a sim. A *true*
hysteretic state (forms last frame → persists) needs a ping-pong fill texture — reserved for the
high-tier-only deep-dive (`03 §2.1b`), not the ambient surface.
- Quality: **high** ("the skin is alive — it forms and tears"). Perf: **cheap** (one extra gradient eval).
  Mobile: **green** (analytic). Complexity: **medium** (tuning the form/tear thresholds).
  → **Ship the analytic version on `high`/`low`; the FBO-state version is a named candidate (§9).**

### 2.E Tearing crust lines via shear-gated F2−F1
A tearing line is a crust crack that **only opens where the flow shears**. Combine 2.B (F2−F1 gives the
crack *location*) with 2.D (`shear` gives *when* it opens): `tear = smoothstep(0.5, 0.0, F2−F1) *
smoothstep(tearLo, tearHi, shear)`, then let the tear *reveal the hot substrate* by biasing the local
temperature up inside the tear (`heat += tear * tearHeat`). The crack network is static-ish (Worley cells
drift slowly with the flow), but the *opening* is dynamic (driven by shear), so lines appear to rip open
and heal — the read we want. No 2025-2026 source does this verbatim for metal, but it is the direct
composition of the cellular-border technique (Sangil Lee 2025, Three.js Roadmap 2025) with the
shear/flow-coupling grammar (Codrops Stylized Water 2025), which is why it's buildable and on-budget.
- Quality: **highest** "heavy skinned" read. Perf: **cheap** if F2−F1 is already computed for the rind
  (reuse the same Worley eval). Mobile: **high-tier** (rides 2.B). Complexity: **medium**.
  → **The signature close-camera term; high-tier, reuses the 2.B Worley eval.**

### 2.F Parallax-occlusion / relief crust (3D depth in the skin)
POM steps a view ray through a height field to give the crust real self-occlusion and silhouette at
grazing angles. The 2025 POM material (LearnOpenGL refresh, Epic mobile-POM thread, the Oregon-State
practical-POM paper still cited in 2025 write-ups) confirms POM is *possible* on mobile but **demands more
resources than basic parallax** and is "only really visible heavily zoomed or at steep angles." For us the
casting-room is close but not grazing, the surface is emissive (the depth read is dominated by the glow,
not by lit relief), and the fill-rate budget is tight. A clamped-step POM is reserved for the
close-oblique *stone* chambers (Ogham, `26`), not the molten skin.
- Quality: **high** at grazing. Perf: **expensive** (loop of texture/field taps). Mobile: **risky**.
  Complexity: **high**.
  → **Rejected for the molten skin; the `dFdx/dFdy` normal-perturb (free) gives enough relief for an
  emissive surface.** Named as a candidate for the stone crust only.

### 2.G TSL `MeshPhysicalNodeMaterial` + MRT-tagged crust emissive (the forward path)
On `WebGPURenderer`, the crust's hot tears would be written to a dedicated **MRT `emissive` attachment** so
bloom catches the tear lines *exactly* (no luminance-threshold false positives from bright reflections),
and Worley would be an `Fn()` node reused across materials. Maxime Heckel's Oct-2025 *Field Guide to TSL
and WebGPU* documents `Fn()` reuse and compute state textures; the Jan-2026 Codrops *WebGPU Gommage* piece
demonstrates exactly the noise-mask + MRT + selective-bloom pattern on text. **But** the judge device runs
WebGL2 + the WebGL `@react-three/postprocessing` composer, so this is the port target, not the build.
- Quality: **equal-to-better** (cleaner bloom). Perf: WebGPU win where available. Mobile: iOS WebGPU is the
  2026 risk surface. Complexity: **high migration**.
  → **Author the GLSL TSL-portable (pure functions of the field + shear); ship GLSL, gate WebGPU
  post-judge.**

**Landscape verdict.** The close-camera tensioned-skin look is **2.B (Worley nucleation) + 2.C (hard-knee
plateau) + 2.D (analytic hysteretic rind) + 2.E (shear-gated tearing)**, layered on the existing
`MoltenSurface` warp/flow field and the shared cooling age. 2.A is the `low`/`static` fallback, 2.F is
rejected for molten skin, 2.G is the port.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a single `gw_skin()` GLSL block in `src/scene/shaders.js` that takes the existing flow field +
shared cooling temperature and returns a tensioned-skin result (plateaued emissive, rind darkening, tear
highlights), injected into the `COLOR` hook of `MoltenSurface` and `ForgeLetter` after the master
temperature ramp — Worley-driven on `high`, fBm-plateau-driven on `low`, frozen on `static`.** The
justification, point by point, rooted in the cohesion contract:

1. **It is a *detail layer*, not a new material.** It reads the *same* `gw_warp`/`gw_flow` field the molten
   surface already computes and the *same* `T` from `gwCool01`/`gw_tempColor`. There is no second noise, no
   second clock, no second orange — the skin is literally "the molten field, shaped into a membrane and
   cracked along nucleation cells." That is what keeps it from looking bolted-on (`00-COHESION-MAP §7`).

2. **Worley is the *right* primitive for nucleation, and it is the one we already budgeted for.** The
   cohesion map names `gw_worley` as "F1/F2 cellular for cooling-crust crack networks and bubble
   nucleation, high-tier only" — this doc is the concrete realization of that line. Crust forming from
   discrete seeds *is* a Voronoi process; F1 gives the flat-top cells, F2−F1 gives the rind/tear network.

3. **Hard-knee plateau over soft smoothstep is the cheapest, highest-leverage change.** Swapping the
   Phase-1 `smoothstep(0.15,0.55,h)` for a `pcurve`/double-smooth hard knee costs nothing and is the single
   edit that makes the metal look *capped by a membrane* rather than *softly glowing*. It runs on every
   tier, so even the `static` poster gets flat-top cells.

4. **Analytic hysteresis gives "forms and re-melts" without a sim.** Driving rind coverage from `(cool
   temperature) × (1 − shear)` means hot, fast, sheared regions can't hold a skin and slow, cool regions
   grow one — the skin *appears* to advance and retreat as the pour front passes, with zero render targets.
   The true ping-pong state version is a high-tier candidate, not a requirement.

5. **Tearing is free once Worley runs.** The tear lines reuse the *same* F2−F1 eval as the rind, gated by
   the *same* `shear` value as the hysteresis — one Worley call feeds cells, rind, and tears. No extra
   fragment cost beyond the single high-tier Worley.

6. **The A/E exception is one multiply.** `crust *= (1.0 - uIsAE)` and `metal = mix(metal,
   gw_divineFire(flick), uIsAE)` — the divine-fire glyphs never skin, never tear, never rind. Same
   keystone, expressed identically to every other system.

7. **It degrades uniformly.** `high` = Worley nucleation + tears; `low` = fBm hard-knee plateau + analytic
   rind, no tears; `static` = frozen plateau, no shear, no tear. A tier drop thins *all* skin detail
   together (`00-COHESION-MAP §7.9`), never recolors or removes the membrane read entirely.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (no new dependency)
- `three` (repo r17x line; **WebGL `onBeforeCompile` path** — no WebGPU features required, forward-safe).
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `maath` (`damp`), `leva`
  (`?debug`). All present.
- Reuse `GLSL_NOISE` (`gw_snoise`, `gw_fbm`, `gw_warp`, `gw_flow`) and the master temperature string
  `GW_TEMPERATURE` (`gw_tempColor`, `gw_tempEmissive`, `gw_forge`, `gwCool01`, `gw_divineFire`) from
  `src/scene/temperature.js`, plus `PAL`/`v3` from `src/scene/palette.js`. **No new files of substance** —
  one `gw_worley` + one `gw_skin` block appended to `shaders.js`.

### 4.2 The shared Worley primitive (append to `shaders.js`, high-tier only)
F1 (nearest) + F2 (second-nearest) in one 3×3 search. Cells drift slowly with the flow so the crust moves
*with* the metal, not independently. Use **Euclidean** for the cell shape but expose a Chebyshev blend for
a more angular, forged read (Sangil Lee 2025).

```glsl
// gw_worley — F1 (cell interior) + F2 (border). 3x3 neighbour search, fixed-trip loop.
// Returns vec2(F1, F2). F1 -> flat-top cells; (F2 - F1) -> rind/tear network.
// HIGH-TIER ONLY: gated behind #ifdef GW_WORLEY by the consumer's #define.
vec2 gw_worley(vec2 p){
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for(int j = -1; j <= 1; j++){
    for(int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j));
      // cheap 2D hash for the feature point inside neighbour cell (gw_-prefixed; no collision)
      vec2 o = fract(sin(vec2(
        dot(ip + g, vec2(127.1, 311.7)),
        dot(ip + g, vec2(269.5, 183.3)))) * 43758.5453);
      // jitter the seed so cells aren't grid-locked (the off-by-one cohesion-map warns about
      // is avoided by hashing ip+g, never fp): see 00-COHESION-MAP §2 worley note.
      vec2 d = g + o - fp;
      float dist = dot(d, d);                 // squared Euclidean (sqrt once at end)
      if(dist < f1){ f2 = f1; f1 = dist; }
      else if(dist < f2){ f2 = dist; }
    }
  }
  return sqrt(vec2(f1, f2));
}
```

### 4.3 The `gw_skin` block — plateau + nucleation + hysteretic rind + tearing
This is the heart of the deep-dive. It takes the flow field `flow`, the master temperature `T` (0 hot → 1
cold from `gwCool01`), the local shear, the cell UV, and the A/E flag, and returns the shaped emissive plus
a skin/rind/tear breakdown. Pure function of its inputs → TSL-portable (§4.7).

```glsl
// --- hard-knee plateau (IQ pcurve flavour): flat top, sharp shoulders = a tensioned membrane ---
float gw_plateau(float x, float knee){           // knee ~ 6..14; higher = flatter top, harder shoulder
  float s = smoothstep(0.0, 1.0, x);
  return pow(s, 1.0/ (1.0 + knee)) * (1.0 - pow(1.0 - s, knee));  // flat middle, crisp edges
}

// shear from the flow gradient (how fast the membrane is being stretched here)
float gw_shear(float flow){ return clamp(length(vec2(dFdx(flow), dFdy(flow))) * 24.0, 0.0, 1.0); }

// MASTER tensioned-skin. T: 0=hot..1=cold (gwCool01).  isAE: divine-fire glyph flag.
// returns vec3 emissive; writes rind/tear via out for normal/AO coupling.
vec3 gw_skin(float flow, float T, vec2 cellUv, float isAE, out float rind, out float tear){
  float shear = gw_shear(flow);

  // 1) FLAT-TOP CELLS via Worley F1 (high) or fBm (low). Higher field -> brighter cell core.
  #ifdef GW_WORLEY
    vec2  w   = gw_worley(cellUv);
    float f1  = w.x;                         // 0 at cell centre -> 1 at edge
    float border = clamp(w.y - w.x, 0.0, 1.0); // F2-F1: thin -> near cell edges, fat -> centres
    float cell = gw_plateau(1.0 - f1, 10.0); // bright flat-top in the cell interior
  #else
    float cell = gw_plateau(flow * 0.5 + 0.5, 8.0);   // fBm fallback plateau (low tier)
    float border = 1.0 - cell;                         // crude crack proxy on low
  #endif

  // 2) HYSTERETIC RIND that FORMS (cool+slow) and RE-MELTS (hot or sheared).
  //    formT: how cool before a skin nucleates.  retreat when shear high (the metal tears it).
  float form   = smoothstep(0.45, 0.70, T);            // colder -> more coverage
  float keep   = 1.0 - smoothstep(0.25, 0.55, shear);  // shear above ~0.4 strips the skin
  rind = clamp(form * keep * smoothstep(0.18, 0.0, border), 0.0, 1.0); // rind hugs cell borders

  // 3) TEARING CRUST LINES: cracks that OPEN where shear is high; reveal hot substrate.
  float crack  = smoothstep(0.12, 0.0, border);        // the crack network (thin = bright line)
  tear = crack * smoothstep(0.30, 0.75, shear) * (1.0 - form); // only tears while still hot+moving

  // 4) COLOUR: master ramp, capped by the membrane, darkened by rind, lit by tears.
  float heat   = clamp((1.0 - T) * (0.55 + 0.55 * cell) + tear * 0.5, 0.0, 1.2);
  vec3  body   = gw_forge(heat);                        // shared HDR emissive ramp
  vec3  oxide  = ${v3(PAL.void)} * (0.85 + 0.15 * border); // dark cooling rind ~ basalt value-range
  vec3  metal  = mix(body, oxide, rind);                // skin darkens the surface
  metal += gw_forge(clamp(heat + 0.3, 0.0, 1.2)) * tear * 0.8; // tear shows white-hot substrate

  // A/E divine-fire: NEVER skins, tears, or rinds — one multiply + one mix.
  rind *= (1.0 - isAE); tear *= (1.0 - isAE);
  metal = mix(metal, gw_divineFire(flow), isAE);
  return metal;
}
```

### 4.4 Injection (mirror `ObsidianSlab.jsx`; add to `MoltenSurface` / `ForgeLetter` COLOR hook)

**HEAD (fragment), after `#include <common>`:**
```glsl
uniform float uTime, uTemp, uPourFront, uIsAE;
varying float vFlow;        // flow field carried from vertex (computed once, §6)
varying vec2  vCellUv;      // slowly flow-advected cell coordinate
${GLSL_NOISE}               // gw_snoise/gw_fbm/gw_warp/gw_flow/gw_worley
${GW_TEMPERATURE}           // gw_tempColor/gw_forge/gwCool01/gw_divineFire
${GW_SKIN}                  // gw_plateau/gw_shear/gw_skin (4.3)
```

**COLOR, before `#include <tonemapping_fragment>`:**
```glsl
// shared cooling age -> temperature (fill front behind the pour; 03-cooling)
float age = max(uPourFront - vUv.x, 0.0) * 6.0;
float T   = gwCool01(age, 0.18);                  // 0 hot .. 1 cold
float fill = smoothstep(vUv.x - 0.04, vUv.x, uPourFront); // unfilled = void

float rind, tear;
vec3 metal = gw_skin(vFlow, T, vCellUv, uIsAE, rind, tear);
gl_FragColor.rgb += metal * fill;
```

**NORMAL, after `#include <normal_fragment_maps>`** — couple rind/tear into relief so the skin reads
physically forged under the env key (the rind creases inward, the tear opens):
```glsl
float relief = (rind * 0.6) - (tear * 0.4);
vec3  bmp    = vec3(dFdx(relief), dFdy(relief), 0.0);
normal = normalize(normal - bmp * 1.4);
// rind is matte (rough), tear is wet-hot (slightly less rough)
roughnessFactor = clamp(roughnessFactor + rind * 0.35 - tear * 0.15, 0.04, 1.0);
```

### 4.5 The r3f component shape (`MoltenSurface.jsx`, extended)
```jsx
export default function MoltenSurface({ quality, isAE = 0 }) {
  const u = useMemo(() => ({
    uTime:{value:0}, uTemp:{value:0.6}, uPourFront:{value:1}, uIsAE:{value:isAE},
  }), [isAE])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color:new THREE.Color('#120402'), metalness:0.85, roughness:0.32, envMapIntensity:0.6,
    })
    m.defines = { USE_UV:'' }
    if (quality === 'high') m.defines.GW_WORLEY = ''     // gate Worley into the HIGH shader only
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U)                       // bind the SHARED master pool (forgeUniforms.js)
      Object.assign(sh.uniforms, u)
      sh.vertexShader   = patchVertex(sh.vertexShader)     // computes vFlow + vCellUv once
      sh.fragmentShader = patchFragment(sh.fragmentShader) // HEAD + COLOR + NORMAL above
    }
    return m
  }, [quality, u])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    u.uTime.value      = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    u.uPourFront.value = damp(u.uPourFront.value, forge.pourFront ?? 1, 2.0, dt)
    const target = Math.min(forge.scrollDamped + Math.min(forge.scrollVel,1)*0.25, 1)
    u.uTemp.value      = damp(u.uTemp.value, forge.ready ? target : 0.2, 3, dt)
  })

  return <mesh material={material}>
    <planeGeometry args={[3, 3, quality==='high'?160:64, quality==='high'?96:40]} />
  </mesh>
}
```

### 4.6 Key uniforms / params (leva-tunable behind `?debug`)
| Param | Role | Default | Close-camera sweet spot |
|---|---|---|---|
| `gw_plateau` knee | flat-top hardness | 10 | **8–14** (higher = harder membrane) |
| `form` edges `0.45,0.70` | rind nucleation temperature | — | tune so rind appears mid-cool, not instantly |
| `keep`/shear `0.25,0.55` | how easily shear strips the skin | — | **0.3–0.5** (lower = skin tears more readily) |
| `tear` shear `0.30,0.75` | when crust lines rip open | — | gate above the hysteresis threshold |
| `gw_worley` cell scale | nucleation density | `cellUv` ≈ uv×6 | 5–9 (denser = finer scale) |
| `uIsAE` | divine-fire glyph flag | 0 / 1 | baked per-letter data, never a string match |
| Worley drift | cells move with flow | `vCellUv += flow·0.04` | keep SLOW (thick metal) |

### 4.7 Hooking the shared master temperature system
`gw_skin` **never invents heat**. Its `T` comes from `gwCool01(age, rate)` where `age` derives from the
shared `uPourFront` (`forge.pourFront`), and every color comes from `gw_forge`/`gw_divineFire` — the master
temperature module's functions, byte-identical to the slab, the cooling letters, and the sparks. The skin
is purely a *shaping and masking* layer over that shared signal: it decides *flat-top vs crack vs rind*,
but **what color any of those are** is always the one ramp. The A/E clamp is the same `uIsAE`→`gw_divineFire`
path used everywhere. Because the functions are pure (`flow`, `T`, `shear`, `cellUv`, `isAE` → `vec3`),
they port to TSL `Fn()` 1:1 for the post-judge WebGPU path (§2.G), with `tear` written to an MRT `emissive`
attachment instead of relying on luminance threshold.

---

## 5. COHESION

- **One temperature, one ramp.** Every emissive value in `gw_skin` is `gw_forge(heat)` / `gw_divineFire`
  from `temperature.js`. The cooling letter's skin and the slab's veins are *visibly the same metal*
  because the bytes are identical (`00-COHESION-MAP §1, §7.1`). The skin adds *shape*, never *color*.
- **One noise basis.** Worley (`gw_worley`) and the plateau both consume the *same* `gw_warp`/`gw_flow`
  field that `MoltenSurface` already computes; the cells drift along that flow, so the crust moves *with*
  the metal. "More detail" = the one high-tier Worley, never a second noise (`§7.2`).
- **One palette, the bloom selector.** Body emissive uses the HDR top of `gw_forge` (only it blooms); the
  dark cooling rind is `PAL.void` value-range (≤1, never blooms), placing it in the *same* dark band as the
  green-black basalt — so a fully-cooled letter's skin reads continuous with the stone it sits in
  (`§3.1`, the B-cluster bridge). The tear lines push white-hot substrate >1, so the *tears* bloom while
  the rind does not — the membrane glows along its rips, exactly the heavy-skinned read.
- **The crust is the basalt's cousin.** This is the cohesion payoff of placing the topic in cluster
  B-stone-glass: the oxide rind's matte, fractured, near-void character is intentionally the *same* grain
  and value as the basalt scale (`05-basalt-stone-pbr`), so cooled metal and stone are one continuous
  surface, not two materials meeting at a seam.
- **Lit only by the metal.** No new light. The rind is *lit* (PBR, reflects the cool procedural env key),
  the hot body and tears are *emissive light sources* — cooling/skinning **is** the transition from light
  source to lit object (`§5.1`). The rind/tear relief in the NORMAL hook is what lets the cool env key
  catch the skin so the membrane reads as forged relief, not painted texture.
- **One clock, one strike.** A `forge.strikeAt` pulse surges `uTemp`, which lowers `T`, which makes the
  rind momentarily *re-melt* (heat strips the skin) and the tears flare — the skin reacts to the strike in
  the same frame as the slab veins and sparks (`§7.6`), the cohesion proof.
- **The A/E keystone, identical everywhere.** `uIsAE` zeroes rind+tear and mixes in `gw_divineFire`. The
  same two glyphs that ignite in the DOM wordmark refuse to skin in the metal — the divine fire has no
  crust because it never cools (`§1.4`, `§7.5`).

---

## 6. MOBILE & PERFORMANCE (iPhone-15 budget)

The casting-room is a close, near-full-frame emissive surface — **fill-rate is the enemy**
(`00-COHESION-MAP §10`). The skin layer's cost discipline:

- **Worley is the single most expensive primitive and is `high`-tier ONLY.** Gated behind
  `#define GW_WORLEY` so the `low`/`static` shaders are *materially smaller* (the 9-iteration 3×3 search
  never compiles into them). On `low`, the `#else` fBm plateau is a single `gw_plateau` on the already-
  computed flow field — essentially free.
- **Compute the field ONCE.** `vFlow` and `vCellUv` are computed in the **vertex** shader and carried via
  varyings; the fragment only does the cheap Worley/plateau/ramp. Recomputing `gw_flow` per pixel would
  blow the budget *and* desync the normal from the bulge (`01 §7.4`).
- **One Worley eval feeds three terms.** F1→cells, F2−F1→rind *and* tears all come from the *single*
  `gw_worley(cellUv)` call. Never call it twice.
- **`shear` via `dFdx/dFdy` is one ALU triple**, not a second field sample — it reads the *already-varying*
  `vFlow`, so tearing costs almost nothing once the flow varying exists.
- **Tier ladder (uniform degrade, `§7.9`):**
  - **`high`** — Worley nucleation, F2−F1 rind + tears, hard-knee plateau, rind/tear relief, DPR capped 1.5.
  - **`low`** — fBm hard-knee plateau, analytic rind (no Worley, no tears), no relief-roughness, fbm 2-oct.
  - **`static`** — frozen `uTime=2`, no shear (no `dFdx`), plateau only, `frameloop='demand'`. The poster
    still shows flat-top tensioned cells and a dark cooling rind — a *dignified frozen forged surface*,
    not a broken fallback.
- **No render targets.** The hysteretic rind is **analytic** (`form × keep`), so there is no ping-pong FBO
  on the hero — zero extra passes, stays single-pass under the shared bloom (`§6`). The true-state FBO is a
  high-tier-only candidate (§9), never the mobile baseline.
- **Bloom stays surgical.** Only the hot body top-band and the tear substrate exceed 1.0; the rind sits in
  the void value-range. Bloom catches the tears and white-hot cores, ignores the skin — no washout, no
  bloom-intensity compensation (`post-fx` rule).
- **Verify path.** `npm run build` green → `qa-route` 393×852 + 1440×900, **0 console errors** (SwiftShader
  compiles the GLSL; a Worley typo or an `#ifdef` mismatch surfaces as an error) → **then the iPhone 15
  OLED read** (the flat-top membrane, the tear-line bloom, the rind's true-black do *not* simulate
  headless).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**The failure mode is "soft glowing blob" (no membrane) or "noise crust flickers/scrolls" (no physical
skin).** Avoid both in this exact order:

1. **Hard-knee plateau FIRST, on the existing fBm field.** Before touching Worley, replace the Phase-1
   `smoothstep(0.15,0.55,h)` with `gw_plateau(h, 10)` and confirm the cells get *flat bright tops with
   sharp dark shoulders*. This is the single biggest visual delta and it costs nothing — get the membrane
   read on the known-good field before adding cost.
2. **Get the master ramp through the skin before any crust.** The skin only *shapes* `gw_forge`; verify the
   iron-black→white-gold climb still reads correctly through the plateau on the OLED. Color cohesion is
   harder to retrofit than crust.
3. **Add Worley nucleation (high-tier) and verify cells look *nucleated*, not gridded.** Hash `ip+g`
   (never `fp`) and jitter the seed; a gridded result means the off-by-one neighbor bug
   (`00-COHESION-MAP §2` warns of this). Confirm F1 cells and the F2−F1 border network render before
   wiring them to color.
4. **Add the analytic hysteretic rind and watch it FORM as the pour front passes.** Drive `T` from the
   shared `uPourFront`; the rind must *grow* behind the cooling front and *not appear* on freshly-poured
   hot metal. If it appears everywhere at once, your `form` smoothstep is reading the wrong sign of `T`.
5. **Add shear-gated tearing LAST.** Tearing reuses the Worley border + shear; verify lines *open where the
   metal moves fastest* and *heal where it slows*. If they're static, your `shear` (`dFdx(vFlow)`) is zero
   — the flow varying isn't actually varying (you computed it per-fragment as a constant, or forgot to
   advect `vCellUv`).
6. **Stamp the A/E and confirm NO skin.** `uIsAE=1` must zero rind+tear and hold `gw_divineFire`. Catch
   this before the skin hides the bug — a divine letter with a cooling rind is a brand violation.

**Specific pitfalls (each has bitten this class of effect):**
- **Worley seam artifacts** — the 3×3 search must wrap the cell hash consistently; an off-by-one in the
  neighbor loop gives visible cell edges (`00-COHESION-MAP §2`, repeated in `phase2/01 §7`).
- **Plateau banding on OLED** — a too-hard knee bands on the true-black panel; keep `knee ≤ 14` and lean on
  the grain-as-dither (`§3.3`). Verify on the device, not headless.
- **Rind flicker** — without hysteresis (`keep` term), a pure `step(noise, T)` rind boils/flickers
  per-frame. The `(1 − shear)` keep term is what gives it stability and the "forms then re-melts" memory.
- **Tears that don't bloom** — if the tear's substrate heat stays ≤1, the rip reads as a dark line, not a
  white-hot rip. Push tear `heat + 0.3` so the substrate exceeds 1.0 and blooms along the rip.
- **Per-pixel branches** — keep the molten/skin/rind blends as `mix()`/`smoothstep`, not `if`; gate Worley
  with a compile-time `#define`, not a runtime `if` (the loop must unroll fixed-trip).
- **Namespace collisions** — everything stays `gw_`-prefixed (`gw_worley`, `gw_skin`, `gw_plateau`,
  `gw_shear`); a bare `worley`/`cellular` could collide with a future three chunk.
- **Recomputing the field in fragment** — compute `vFlow`/`vCellUv` in vertex, carry as varyings; fragment
  Worley reads `vCellUv` only.

**Order of operations summary:** *hard-knee plateau on existing field → ramp-through-skin verify → Worley
nucleation (high) → analytic hysteretic rind → shear-gated tearing → A/E zero-out → relief/roughness
coupling → tier gate + OLED read.*

---

## 8. SOURCES (2025–2026)

1. Dan Greenheck — **10 Noise Functions for Three.js TSL Shaders**, Three.js Roadmap, **2025-12-08**.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders — Worley/cellular with
   TSL+GLSL parity, the 3×3 neighbor search, F1 cells vs F2−F1 cracks, FBM-Worley lacunarity/gain, domain
   warp for lava/marble. (The canonical 2025 Worley reference for our `gw_worley`.)
2. Sangil Lee — **Understanding the Variations of Cellular Noise**, **2025-04-18**.
   https://sangillee.com/2025-04-18-cellular-noises/ — F1 / F2 / F2−F1 catalog, Euclidean vs
   Manhattan/Chebyshev distance metrics and which gives rounded vs angular/forged cells, the cellular-
   border crack technique. (The distance-metric choice for the rind shape.)
3. Balazs Farago — **Procedural Materials with Shaders in Three.js**, **2025-01-30**.
   https://www.balazsfarago.dev/blog/procedural-materials — Voronoi/cellular as a stone/scale crack
   primitive in three.js, `onBeforeCompile`-style material extension. (Worley as a stone-crust primitive.)
4. Damian Van Der Merwe — **Painting with Math: Building an Interactive Lava Lamp Shader from Scratch**,
   **2026-04-03**. https://damianvandermerwe.com/blog/painting-with-math-lava-lamp-shader — layered fBm at
   different scales/drift, banded color, click-spawned heat pools that locally re-melt, params baked as
   GLSL constants. (The grammar for store-coupled analytic coverage and local re-melt without a sim.)
5. Thalles Lopes — **Creating Stylized Water Effects with React Three Fiber**, Codrops, **2025-03-04**.
   https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/ —
   `uTime`-driven noise + `smoothstep` banding, a shared global store driving surface params, perf-aware
   `onBeforeCompile`. (The shear/flow-coupling + shared-store cohesion pattern for the hysteretic rind.)
6. Codrops — **WebGPU Gommage Effect: Dissolving MSDF Text into Dust and Petals with Three.js & TSL**,
   **2026-01-28**.
   https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/
   — noise-driven TSL mask + MRT + selective bloom on text; the model for writing the tear emissive to an
   MRT attachment in the post-judge WebGPU port (§2.G).
7. Maxime Heckel — **Field Guide to TSL and WebGPU**, **2025-10-14**.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ — TSL `Fn()` reuse, compute state
   textures (the true-hysteresis FBO path), WGSL/GLSL dual-lowering, iOS18 WebGPU caveats. (The
   TSL-portability + state-texture path for §4.7 and §9.)
8. Inigo Quilez — **useful little functions** (`pcurve`, `cubicPulse`, `smoothstep` shaping; remapping
   the [0,1] interval), the canonical reference as re-surfaced and cited by the 2025 TSL/shader guides
   above. https://iquilezles.org/articles/functions/ — the hard-knee plateau / flat-top membrane shaping
   math (`gw_plateau`).

---

## 9. DEEP-DIVE CANDIDATES (Phase-3)

1. **True ping-pong hysteretic-skin state texture (high-tier only).** Replace the analytic
   `form × keep` rind with a real GPGPU fill/skin texture that *remembers* coverage frame-to-frame: the
   skin advances where slow/cool, persists once formed, and only retreats when shear/heat exceeds a higher
   release threshold — genuine hysteresis with memory. Scope: one extra render target on iPhone-15, the
   ping-pong loop cost, and whether it can be gated to `high` and to the casting-room route only. Heckel's
   2025 compute-state-texture work is the starting point.
2. **Worley-cell *bubble* nucleation + boil-burst (the third use of the same primitive).** Use `gw_worley`
   F1 not just for crust cells but for **bubbles** rising and bursting on the molten surface — a bubble is
   a cell whose center periodically inflates (vertex bulge) then ruptures (a transient white-hot tear
   ring). Reuses the existing Worley eval; adds the "bubbling, churning, alive" beat the world brief
   demands at close distance.
3. **Stone-crust parallax-occlusion relief for the *cooled* casts (four-plinths / Ogham bridge).** Once a
   letter fully cools and its skin reads as basalt-adjacent scale, a clamped-step POM (rejected for the
   *molten* skin in §2.F) may be justified on the *static cooled* casts in the four-plinths gallery, where
   the camera is oblique and the surface is no longer emissive. Scope: clamped POM step-count on mobile,
   shared with the Ogham carve (`26`).
4. **TSL `Fn()` + MRT-tagged tear emissive port.** Reimplement `gw_worley`/`gw_skin`/`gw_plateau` as
   reusable TSL `Fn()` nodes feeding `material.emissiveNode`, with the tear lines written to a dedicated
   MRT `emissive` attachment so bloom catches exactly the rips (no luminance false-positives). The Gommage
   2026 + Heckel 2025 pattern; gated behind the iOS/Safari WebGPU readiness audit.
