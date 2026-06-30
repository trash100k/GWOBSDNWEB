# 10 — The Serpentine Green-Reveal Light Model on Basalt

_Phase 2 deep-dive · GAELWORX forge world · Cluster B-stone-glass-surfaces · target: iPhone 15 OLED ·
one WebGL renderer (r3f + three.js)_

> **Reads first:** `00-COHESION-MAP.md` (§1 master temperature, §5 lighting, §3 palette/bloom), Phase-1
> `05-basalt-stone-pbr.md` (the material this doc surfaces) and `25-ogham-carved-stone-text.md` (the
> co-receiver that shares this exact falloff), and Phase-2 `01-master-temperature-module.md` (the
> `gw_*` authority this hooks). This document is the rigorous treatment of **deep-dive candidate #3**
> raised in doc 05: _how the white-gold A/E divine fire and the incoming molten light surface the
> Connemara green out of black, the desaturated low-value authoring that keeps the stone DARK, and the
> iron-oxide heat-staining that runs ahead of the pour front_ — all as one light-transport model that the
> basalt and the Ogham consume identically.

---

## 1. SCOPE — what this element is in the world

The basalt is the **stone body** of the GAELWORX forge: the green-black Connemara mass the Celtic-interlace
channels are cut into, the floor the molten pour crosses, the walls of the channel-hall, the altar, the
stone-ledger, the four plinths. In a world that is **pure void lit only by the metal itself**, the stone is
not a lit object that happens to be dark — it is **black by default and becomes visible only where light
reaches it.** That single fact is the whole brief for this doc. There are exactly three light events that
lift the stone out of the void, and they are all the *same* signal at different strengths:

1. **Ambient molten spill** — the general radiance welling off the nearby pour / channel metal. A dim,
   broad, warm wash. This is the floor of visibility: the stone reads as a faint, deep, almost-black mass.
2. **The A/E divine fire** — the keystone. The eternal white-gold light radiating from the divine letters
   rakes the basalt at grazing angles and **surfaces the serpentine Connemara green out of the black**,
   throwing a white-gold spill that simultaneously makes the **carved Ogham legible for the first time**.
   This is the narratively-loaded beat (`00-COHESION-MAP §5.2`).
3. **Iron-oxide heat-staining** — *ahead of and beside* the moving pour front, the stone scorches: a dull
   iron-oxide crimson temper-stain creeps onto the rock before the metal arrives, hottest at the very lip,
   reading as the stone itself taking the heat. This is the only place the stone approaches the HDR/bloom
   band, and it is keyed to the pour-front position so the metal and the stone share a frontier.

The **reveal model** that governs all three is one expression, stated in doc 05 and locked here:

```glsl
float reveal = clamp(uLightAmt + uAEFirePow + uReveal, 0.0, 1.0);
```

`uLightAmt` is the ambient molten light at the surface; `uAEFirePow` is the divine-fire intensity (with a
distance/grazing falloff); `uReveal` is a tiny per-route floor so the static tier and far stone still read.
The green is **authored DARK and desaturated** and *lifted only by this value* — never a bright albedo that
the light merely brightens. The Ogham legibility (`25-...md`) keys off the **identical** `uAEFirePow` and
**shares the same falloff function**, so stone-green-reveal and carving-reveal rise from black on the same
heartbeat. This doc makes that model physically motivated, numerically specific, and buildable.

The cardinal failure this guards against: a green that is *present in the dark* (reads as moss / CG / a
painted texture), or a reveal that is *decoupled* from the world's light (reads as a bolt-on per-route
gimmick). The stone must be **black until the forge's own fire shows it to you.**

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

How modern real-time WebGL/WebGPU work surfaces hidden material out of darkness via a light/reveal term,
and how each option scores on quality / perf / mobile / complexity for *this* build.

### A. In-shader proximity + grazing reveal (the analytic light-transport term)
Compute the reveal as a closed-form function of distance to the light and the grazing angle of the light
across the surface, in the fragment shader, and use it to `mix()` the hidden green up out of the black.
This is the family doc 05 already sketches (`aeFall = 1/(1+d²·k)`, `reveal = uLightAmt + uAEFirePow`). The
2025-2026 reveal-shader idiom is exactly this shape: Codrops' **Dual-Scene Fluid X-Ray Reveal** (Mar 2026)
drives a Fresnel/grazing term into the **emissive channel so dark surfaces glow on their own** and the
"hidden" content surfaces only at grazing edges; Codrops' **GSAP ripples & reveals** piece (Oct 2025)
animates a `uProgress`/mask uniform through `smoothstep` to wipe content in; **Susurrus** (Apr 2026) drives
a `uProgress` reveal on a screen quad. The common DNA: **one scalar (light/progress) × a smoothstep band ×
a `mix` from base to revealed.** _Quality:_ excellent for a stylized forge — fully art-directable. _Perf:_
near-free (a handful of ALU ops, no extra pass). _Mobile:_ ideal — runs on every tier. _Complexity:_ low,
and it lives entirely inside the existing `onBeforeCompile` grammar. **This is the spine of the pick.**

### B. Physically-based point/area-light attenuation (real inverse-square falloff)
Use a true physical light. three.js `RectAreaLight` (one per A/E, capped at 2) or a `PointLight` with
inverse-square `decay=2` gives correct, free falloff and real bounce onto the stone. On the WebGPU/TSL
lane, the **`webgpu_lights_custom` example** (2025) and the `lights/` TSL nodes expose
`getDistanceAttenuation` / range falloff as composable nodes. _Quality:_ physically correct, the bounce is
"real." _Perf:_ `RectAreaLight` is **per-pixel expensive** and has no shadows; two of them touching a
near-full-screen basalt floor is a real mobile cost. _Mobile:_ `high`-tier only, and even then it is the
budget hog of the lighting model. _Complexity:_ medium (LTC textures must be loaded for RectAreaLight).
**Use sparingly — `high`-tier garnish on the metal-letter materials, never the reveal mechanism of record**
(`00-COHESION-MAP §5.2`).

### C. Baked emissive-AO / light-map reveal
Bake the green-spill + groove-AO into a lightmap once the geometry is frozen. _Quality:_ great static look,
free at runtime. _Perf:_ trivial. _Mobile:_ perfect. _Complexity:_ a bake pipeline + an asset. _Fatal flaw
for the hero beat:_ it is **static** — it cannot rise as the divine light *approaches*, and the whole point
is the live reveal. **Reserved for the `static` tier and far background stone only** — the live half must
remain `f(uAEFirePow, grazing)`.

### D. Distance-field / SDF light reveal
Treat the light as an SDF and reveal where `sceneSDF < radius`. Clean for hard-edged "circle of light"
reveals (the Unity world-reveal-shader lineage). _Quality:_ crisp but reads *geometric/UI*, not *fire*.
_Perf:_ cheap. _Mobile:_ fine. _Complexity:_ low. _Tradeoff:_ a divine fire's light is soft, warm, and
falls off smoothly — an SDF radius reads as a spotlight cookie, not radiance. **Borrow the idea (the
falloff is a smooth radial band) but not the hard SDF edge.**

### E. Screen-space reveal pass (post-process mask)
Do the reveal as a fullscreen post pass keyed to a luminance/emissive buffer (the Susurrus screen-quad
`uProgress`, or an MRT emissive attachment per Maxime Heckel's Field Guide, Oct 2025). _Quality:_ good for
*global* wipes. _Perf:_ an extra pass / MRT. _Mobile:_ adds to the post budget. _Complexity:_ medium.
_Tradeoff:_ the green-reveal is **per-surface and view-dependent** (grazing angle, distance to *this*
fragment), which a screen-space pass can't see — it would reveal screen regions, not stone facets.
**Wrong layer for this effect; the reveal belongs in the material.** (MRT is still the right answer for the
*bloom selection* of the hottest stained edges — §6.)

### F. Temper-color staining via a heat-driven oxide ramp (the heat-stain half)
The iron-oxide scorch ahead of the pour front is its own sub-problem with a real physical reference: when
steel/iron is heated in air it grows an oxide film whose **interference color marches pale-straw → brown →
purple → blue with temperature** (the bladesmith temper chart; BSSA heat-tint data, 2025). For GAELWORX we
do **not** want the full straw→blue march (that introduces cool blue — a brand violation; no cool/green/blue
in the warm grade per `00-COHESION-MAP §3.3`). We want only the **warm low end**: a dull iron-oxide
crimson/ember stain that intensifies toward the pour-front lip. Implemented as a `smoothstep`-banded
crimson→ember ramp driven by `uChannelHeat` × proximity, sharing `gw_tempColor` stops so the stain is
*literally the same ramp* the metal cools through, just sampled at the cool end. _Quality:_ grounds the
stone in real metallurgy. _Perf:_ free (it reuses the master ramp). _Mobile:_ every tier. _Complexity:_
low. **Adopt — this is the heat-stain mechanism.**

### G. TSL / WebGPU node rewrite of the whole material
Express reveal + falloff + triplanar + oxide ramp as composable TSL `Fn()` nodes on `WebGPURenderer`
(Maxime Heckel Field Guide Oct 2025; threejsroadmap "TSL: A Better Way" 2025; Codrops Shader.se WebGPU
pipeline May 2026). _Quality:_ identical look, far cleaner authoring, and MRT gives exact bloom selection.
_Perf:_ comparable or better. _Mobile:_ the WebGL2-fallback branch of `WebGPURenderer` is **less battle-
tested on mobile Safari** — betting the judge device on it is the documented mistake
(`00-COHESION-MAP §10`). _Complexity:_ renderer-wide migration. **Out of scope for the judge build; author
the GLSL TSL-portable so the eventual port is a re-host, not a rewrite.**

**Verdict:** the reveal is **A** (analytic in-shader proximity+grazing) with **F** (heat-stain via the
shared ramp), **B** as a `high`-tier garnish only, **C** as the `static` fallback, and **G** as the
post-judge forward path. The reveal model of record is one cheap fragment-shader term — the only approach
that runs on `static`, that can sample the carving's relief to reveal the Ogham, and that costs nothing.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Pick: a single shared `gw_reveal()` light-transport function in `src/scene/shaders.js` that both the
basalt and the Ogham call, computing `reveal = ambient + AEfire·falloff` with a grazing-angle boost; the
green is authored DARK/desaturated and lifted only by `reveal`; the iron-oxide heat-stain is a
`uChannelHeat`-driven sample of the master `gw_tempColor` ramp at its cool end. Injected into the existing
`BasaltStone` `MeshPhysicalMaterial` via `onBeforeCompile`, binding the master uniform pool `U`.**

Why this, against the world and the constraints:

- **The reveal is the falloff, and the falloff is shared.** Making `gw_reveal()` *one function* that the
  basalt-green AND the Ogham-legibility AND the caustic-divine preset all call is the cohesion guarantee:
  the green surfacing and the carving surfacing are mathematically the same event. The brief's own line —
  "shares the falloff with the Ogham reveal" — becomes a literal shared symbol, not a coincidence of two
  similar-looking `1/(1+d²)` expressions that drift apart in tuning (the `02`/`03` sign-mismatch lesson:
  one authority, never two parallel copies).
- **Keep it DARK; lift only by light.** Authoring `serpentine` at a deep desaturated low value (`~0.045,
  0.115, 0.085` linear — near the PBR charcoal floor of ~0.04, the darkest physically-plausible albedo per
  the Substance PBR-safe-color rule) and revealing it through a `mix()` gated by `reveal` is the only way
  the stone reads as black-until-lit. A bright green that the light merely brightens reads as moss and
  looks instantly CG (doc 05 pitfall §5). This is also why the X-ray-reveal idiom (emissive only at grazing
  edges, dark elsewhere) is the right reference: **darkness is the default, light is the exception.**
- **One ramp for stone and metal.** Sampling `gw_tempColor` at its cool stops for the heat-stain means the
  scorched stone is *visibly the same substance temperature curve* as the cooling letters and veins — a
  cooling vein and a heat-stained stone edge are the same metal at the same temperature because they read
  the same function (`00-COHESION-MAP §7.1`).
- **Stays in the proven engine.** No new canvas, no EXR, no renderer swap — the same `onBeforeCompile` +
  `${GLSL_NOISE}` + `v3(PAL.x)` recipe the slab ships, verifiable today via `shader-fx` + `qa-route`.
- **RectAreaLight is a garnish, not the mechanism.** Real area-light bounce is gorgeous on the metal
  letters at `high`, but it cannot sample the groove relief to reveal Ogham and it is too expensive on a
  full-screen basalt floor on mobile — so it touches only the letter materials, and the stone reveal stays
  analytic (`00-COHESION-MAP §5.2`).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions
- `three` r17x (in repo) — `MeshPhysicalMaterial` + `onBeforeCompile`. No renderer change.
- `@react-three/fiber`, `@react-three/drei` (existing) — `<Detailed>` LOD for far plinths; `RectAreaLight`
  + `RectAreaLightUniformsLib` only on the `high`-tier letter materials.
- `@react-three/postprocessing` (existing) — `mipmapBlur` bloom catches the hottest oxide-stain edges.
- Shared in-repo: `GLSL_NOISE` (`src/scene/shaders.js`), `PAL`/`v3` (`src/scene/palette.js`), the master
  temperature GLSL (`gw_tempColor`/`gw_forge`, Phase-2 doc 01), the master uniform pool `U`
  (`src/scene/forgeUniforms.js`, `00-COHESION-MAP §4.2`), `forge`/`damp` (`src/store.js`).
- **No new runtime asset** for the reveal path. (Optional 512² KTX2 grain map from doc 05 is orthogonal.)

### 4.2 The shared reveal function (the deliverable — add to `shaders.js`, beside `gw_caustic`)

This is the symbol the basalt and the Ogham both call. It is **pure** (no uniform reads) so it inlines into
any material and ports 1:1 to a TSL `Fn()` later.

```glsl
// ── GAELWORX shared light-transport reveal ───────────────────────────────────
// ONE falloff authority. Consumed identically by basalt green-reveal AND Ogham
// legibility AND the caustic divine preset. Pure function of geometry + scalars.
//
//   wp       : world position of the fragment
//   wn       : world normal (normalized)
//   aePos    : world position of the nearest A/E divine fire
//   aePow    : divine-fire intensity (0..~1.5), the keystone driver
//   ambient  : broad molten spill reaching this surface (0..1)
//   k        : inverse-square tightness (route-tuned, ~0.18..0.35)
// Returns reveal in 0..~1.6 (clamp at the call site as the look requires).
float gw_reveal(vec3 wp, vec3 wn, vec3 aePos, float aePow, float ambient, float k){
  vec3  toAE   = aePos - wp;
  float d2     = dot(toAE, toAE);
  float fall   = 1.0 / (1.0 + d2 * k);              // smooth inverse-square-ish, no hard edge (rejects D)
  vec3  L       = toAE * inversesqrt(max(d2, 1e-4)); // unit dir to the fire
  // grazing boost: light raking ACROSS the surface (low N·L) reveals carved relief hardest — this is the
  // term the Ogham needs, and it is what makes the stone read as RAKED by fire, not flatly front-lit.
  float ndl     = max(dot(wn, L), 0.0);
  float graze   = mix(1.0, 1.0 - ndl, 0.65);         // weight grazing higher, keep some front fill
  float ae      = aePow * fall * graze;
  return ambient + ae;                               // == doc-05 `uLightAmt + uAEFirePow`, now principled
}
```

Notes that matter:
- `inversesqrt`/`dot` only — no `length`/`normalize` pair, no `pow`. Cheapest possible.
- The **grazing boost** is the new rigor over doc 05's sketch: a divine fire standing *beside* an inscribed
  wall rakes it at a low angle, and grazing light is precisely what surfaces incised relief (the Ogham
  notches throw their hardest self-shadow when `N·L` is small). The same `graze` term feeds the Ogham
  groove-rim in `25-...md` — **shared falloff, shared grazing**, one function.
- It is monotonic and seam-free; clamp per call (`reveal` in basalt clamps to `[0,1]` for the `mix`; the
  oxide-glow and the white-gold spill read the unclamped tail to push into HDR).

### 4.3 HEAD — basalt + the reveal (fragment, after `#include <common>`)

```glsl
uniform float uTime, uTemp, uAEFirePow, uChannelHeat, uTriScale, uReveal, uRevealK, uAmbient;
uniform vec3  uAEFire;
${GLSL_NOISE}                 // gw_snoise / gw_fbm / gw_caustic + gw_reveal (above)
${GW_TEMPERATURE}             // gw_tempColor / gw_forge — the ONE ramp (Phase-2 doc 01)

varying vec3 vWPos;
varying vec3 vWNrm;

// triplanar procedural field (doc 05) — compute ONCE, reuse for normal + color
float gwTriField(vec3 p, vec3 n){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x+w.y+w.z+1e-5);
  return gw_fbm(p.xy*uTriScale)*w.z + gw_fbm(p.yz*uTriScale)*w.x + gw_fbm(p.xz*uTriScale)*w.y;
}
float gwBasalt(vec3 p, vec3 n, out float veinMask){
  float q = gwTriField(p, n);
  vec3  wp = p + q*0.6;                                   // one warp level (cheaper than molten's two)
  float strata = gwTriField(wp*1.7, n);
  veinMask = pow(clamp(1.0 - abs(strata), 0.0, 1.0), 3.0); // serpentine vein streaks
  return q*0.6 + strata*0.4;
}
```

### 4.4 COLOR — the green-reveal + white-gold spill + iron-oxide stain (after `#include <color_fragment>`)

```glsl
float gwVein;
float gwH = gwBasalt(vWPos, normalize(vWNrm), gwVein);     // field computed once here; reuse in NORMAL

// ── base body: forged-iron black, serpentine green held DARK + desaturated ──
vec3 ironBlack  = ${v3(PAL.void)};                         // ~0.02,0.02,0.03 — near void
vec3 serpentine = vec3(0.045, 0.115, 0.085);               // deep Connemara green, low-value (NOT bright)

// ── the ONE reveal term (shared with Ogham) ──
float rev = gw_reveal(vWPos, normalize(vWNrm), uAEFire, uAEFirePow, uAmbient, uRevealK);
rev = clamp(rev + uReveal, 0.0, 1.6);                      // uReveal = per-route/static floor

// the green is HIDDEN until light reveals it: lift out of black through the vein mask + a smoothstep band
float greenLift = gwVein * smoothstep(0.06, 0.62, rev);    // band keeps faint-lit stone still near-black
vec3  stone = mix(ironBlack, serpentine, greenLift);

// ── A/E divine-fire white-gold spill onto the stone (the > clamp tail) ──
float aeTail = max(rev - 1.0, 0.0);                        // only the close, strong divine light spills
stone += serpentine * aeTail * 1.6;                        // green BLOOMS toward the fire
stone += ${v3(PAL.gold)} * aeTail * 0.18;                  // white-gold wash → makes Ogham readable

// ── iron-oxide heat-staining AHEAD of the pour front (the cool end of the MASTER ramp) ──
// uChannelHeat rides high just ahead of/beside the moving metal; the stain follows the veins.
float stain = clamp(uChannelHeat * (0.4 + 0.6*gwVein), 0.0, 1.0);
vec3  oxide = gw_tempColor(0.18 + 0.18*stain);             // SAME ramp the metal cools through (cool end)
stone = mix(stone, oxide, smoothstep(0.05, 0.9, stain)*0.7);
stone += ${v3(PAL.ember)} * pow(stain, 3.0) * uTemp * 0.45; // only the hottest lip crosses into HDR/bloom

diffuseColor.rgb = stone;     // replace ALBEDO at <color_fragment> (lit diffuse) — NOT <tonemapping> (emissive)
```

### 4.5 NORMAL — micro-relief, reusing the field (after `#include <normal_fragment_maps>`)

```glsl
// gwH/gwVein already computed in COLOR scope when chunks are concatenated; if hook order forces it,
// declare gwH once in NORMAL and reuse in COLOR — NEVER sample gwBasalt twice (6 fbm vs 3).
vec3 gwBmp = vec3(dFdx(gwH), dFdy(gwH), 0.0);
normal = normalize(normal - gwBmp * 1.1);
```

### 4.6 Vertex hook (after `#include <worldpos_vertex>`)

```glsl
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNrm = normalize(mat3(modelMatrix) * normal);
```

### 4.7 The r3f component + master-uniform binding

```jsx
import { U } from './forgeUniforms'           // the shared pool — references, not clones
import { sceneFor, forge, damp } from '../store'

export default function BasaltStone({ quality, geometry }) {
  const detailed = quality === 'high'
  // local uniforms unique to this material; shared ones come from U
  const local = useMemo(() => ({
    uTriScale: { value: 1.4 },
    uRevealK:  { value: 0.26 },                // inverse-square tightness (route-tuned)
    uReveal:   { value: 0.0 },                 // per-route / static floor
    uAmbient:  { value: 0.22 },                // broad molten spill floor
  }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x050507), metalness: 0, roughness: 0.82, envMapIntensity: 0.5,
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U, local)   // U FIRST: uTime/uTemp/uAEFire/uAEFirePow/uChannelHeat shared
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm;`)
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${VERT}`)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${COLOR}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
    }
    return m
  }, [])
  useEffect(() => () => material.dispose(), [material])
  useFrame((state, dt) => {
    const sc = sceneFor(forge.route)
    local.uReveal.value  = damp(local.uReveal.value,  sc.reveal ?? 0.0, 2.4, dt)
    local.uRevealK.value = damp(local.uRevealK.value, sc.revealK ?? 0.26, 2.2, dt)
    local.uAmbient.value = damp(local.uAmbient.value, sc.veinGlow ?? 0.22, 2.4, dt)
    // uTemp / uAEFire / uAEFirePow / uChannelHeat / uTime are driven ONCE by <ForgeDriver/> into U.
  })
  return <mesh geometry={geometry} material={material} />
}
```

The reveal/heat-stain uniforms (`uAEFire`, `uAEFirePow`, `uChannelHeat`, `uTemp`, `uTime`) are **not driven
here** — they live in the shared pool `U` and are written by the single headless `<ForgeDriver/>`
(`00-COHESION-MAP §4.2`). Mutating `U.uAEFirePow.value` once updates the stone reveal, the Ogham legibility,
the caustic preset, and the metal-letter glow **in the same frame** — that synchrony is the cohesion proof.
Only the *per-route look* knobs (`uReveal`, `uRevealK`, `uAmbient`, `uTriScale`) are local and damped toward
`scenes.js`.

### 4.8 Key uniforms / params (tuning table)

| Uniform | Source | Range | Meaning |
|---|---|---|---|
| `uAEFire` (vec3) | `U` / ForgeDriver | world | nearest A/E divine-fire position |
| `uAEFirePow` | `U` / ForgeDriver | 0..~1.5 | divine-fire intensity — **the green-reveal driver** |
| `uAmbient` | local ← `scene.veinGlow` | 0.15..0.3 | broad molten spill floor (the faint baseline visibility) |
| `uRevealK` | local ← `scene.revealK` | 0.18..0.35 | inverse-square tightness; higher = tighter, more dramatic pool |
| `uReveal` | local ← `scene.reveal` | 0..0.3 | per-route / static floor so far stone reads |
| `uChannelHeat` | `U` / pour-front | 0..1 | proximity to moving metal → iron-oxide stain strength |
| `uTemp` | `U` / scroll | 0..1 | master forge heat — modulates the hottest stain lip |
| `uTriScale` | local | 1.2..1.8 | triplanar grain frequency |

### 4.9 TSL-portable mirror (the forward path, authored now, hosted later)

So the eventual `WebGPURenderer` port is a re-host not a rewrite, the reveal expresses cleanly as a `Fn()`:

```js
// three/tsl — gw_reveal as a node Fn (Maxime Heckel Field Guide, Oct 2025; threejsroadmap "TSL: A Better Way")
const gwReveal = Fn(([wp, wn, aePos, aePow, ambient, k]) => {
  const toAE = aePos.sub(wp)
  const d2   = toAE.dot(toAE)
  const fall = float(1).div(d2.mul(k).add(1))
  const L    = toAE.mul(d2.max(1e-4).inverseSqrt())
  const ndl  = wn.dot(L).max(0)
  const graze = mix(float(1), float(1).sub(ndl), 0.65)
  return ambient.add(aePow.mul(fall).mul(graze))
})
// material.outputNode = ... mix(ironBlack, serpentine, gwVein.mul(smoothstep(0.06,0.62, rev)))
// bloom reads a dedicated MRT emissive attachment → EXACT selection of the hot oxide lip (no luminance guess).
```

---

## 5. COHESION — how this binds to the one world

- **One reveal falloff for stone and carving.** `gw_reveal()` is the *single* function the basalt-green AND
  the Ogham-legibility (`25-...md`) AND the caustic divine preset (`23-...md`) call. The brief's "shares the
  falloff with the Ogham reveal" is satisfied by a literal shared symbol, including the grazing term — the
  green and the notches surface from black on the identical event.
- **One temperature ramp for stone-stain and metal-cool.** The iron-oxide stain is `gw_tempColor` sampled
  at its cool stops — *the same ramp* the cooling letters and veins traverse (Phase-2 doc 01). A scorched
  stone edge and a cooling vein are the same metal at the same temperature because they read the same
  function (`00-COHESION-MAP §7.1`).
- **One palette, one bloom contract.** Every color is `PAL` via `v3()` — `PAL.void` iron-black, the
  low-value serpentine green, `PAL.gold` divine spill, `PAL.ember`/`gw_tempColor` for stain. The stone is
  deliberately held **< 1.0 (no bloom)** everywhere except the hottest oxide lip and the close divine spill,
  so the shared `mipmapBlur` (`luminanceThreshold ≈ 0.55`) catches *exactly* those pixels — the palette IS
  the bloom selector (`00-COHESION-MAP §3.1, §7.3`).
- **One light source: the metal.** No fill light reveals this stone. `uAmbient` is molten spill,
  `uAEFirePow` is divine fire, `uChannelHeat` is pour-front proximity — all metal-sourced. Cooling *is* the
  transition from "light source" (the hot stain lip) to "lit object" (the cooled green stone)
  (`00-COHESION-MAP §5, §7.4`).
- **One driver, one heartbeat.** `uAEFire`/`uAEFirePow`/`uChannelHeat`/`uTemp` come from the shared pool `U`
  written by one `<ForgeDriver/>`, `dt`-damped. A strike pulse surges the divine spill, the stain lip, and
  the metal glow in the same frame (`00-COHESION-MAP §4.2, §7.6`).
- **One noise basis.** The serpentine `gwVein` field is `gw_fbm`/`gw_warp` at the shared `GW_FBM_OCTAVES` —
  the stone's grain shares the slab's veins' and the embers' spatial frequency. The vein field can be
  aligned to the interlace channel direction so stone-grain and channels feel cut by one hand
  (`00-COHESION-MAP §2, §7.2, §7.8`).
- **Material contrast that proves shared light.** Basalt is `roughness 0.82`, `envMapIntensity 0.5` —
  matte, drinking the cool procedural env — the deliberate opposite of the slab's polished `roughness 0.05`
  glass that throws it back. Same env, opposite response = one lit space.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The reveal model is cheap *by design* — it is the part of the basalt that costs almost nothing, so the
budget pressure is the triplanar fbm field (doc 05), not the reveal. Tiering mirrors `useQuality`
(`high | low | static`, `forge-scene`):

- **`high`:** full `gw_reveal` (proximity + grazing) + triplanar 3-octave fbm + heat-stain + optional 512²
  KTX2 grain + clamped POM (channel-hall only). `dpr` capped 1.5. **`RectAreaLight` ×2** (one per A/E)
  touching the *metal-letter* materials only — never the basalt floor. MRT-emissive bloom selection if/when
  WebGPU.
- **`low`:** `gw_reveal` unchanged (it's free) + triplanar + heat-stain + derivative-bump normal. **No
  RectAreaLight, no POM, no grain map.** Drop one fbm octave if the floor is near-full-screen. `dpr` 1.4.
- **`static` / `prefers-reduced-motion`:** freeze `uTime = 2`; hold the reveal at a **fixed `uReveal`
  floor** (~0.22) so the green-black stone and a dim Ogham still read without the live light math; no POM,
  no area lights; `frameloop='demand'`. This is the option-C baked-feel still — dignified, on-brand, not
  broken.

Hard rules:
1. **The reveal must stay analytic on every tier.** It is the one lighting term that runs on `static`. Never
   promote it to a RectAreaLight-only mechanism — the static tier and the Ogham-relief sampling both depend
   on the cheap in-shader path (`00-COHESION-MAP §5.2`).
2. **Compute the fbm field ONCE.** The #1 perf mistake here is sampling `gwBasalt`/`gwTriField` separately
   in NORMAL and COLOR — 6 fbm calls/pixel instead of 3. Triplanar already triples the cost per field; one
   field, reused (doc 05 §6/§7).
3. **The reveal adds ~6 ALU ops.** `gw_reveal` is one `dot`, one `inversesqrt`, one `dot`, two `mix`,
   negligible against the fbm. No `length`, no `pow`, no branch.
4. **Bloom catches only the oxide lip + close divine spill.** Keep *everything else* in the stone < 1.0 so
   the half-float buffer + `mipmapBlur resolutionScale 0.5` don't waste mip work on the dark mass
   (`00-COHESION-MAP §6, §10`).
5. **`RectAreaLight` is `high`-only and metal-only.** Two LTC-textured area lights over a full-screen matte
   basalt floor is a fill-rate trap; they exist for the letter bounce, not the stone reveal.
6. **`<Detailed>` LOD + dispose.** Far plinths swap to vertex-color/baked far; `material.dispose()` on
   unmount; `renderer.info.memory` flat across navigation.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

1. **Build the green-reveal as the FIRST visible milestone** (`00-COHESION-MAP §8 Phase-B/7`). Wire
   `uAEFirePow`/`uAmbient` and prove in the `?debug` leva panel that the green *literally rises from black*
   as you ramp them — before grain, before POM, before stain. If the reveal isn't convincing, nothing else
   matters.
2. **World-space, always.** `gw_reveal`, triplanar, and the falloff all need **world position + world
   normal**. Set `vWPos`/`vWNrm` in the vertex hook first. Using `vUv` tiles and breaks on carved geometry;
   using *view-space* normals breaks the grazing term and the AE falloff (the falloff would swim with the
   camera). This is the single most likely silent bug.
3. **Hook `<color_fragment>`, not `<tonemapping_fragment>`.** Basalt replaces *albedo* (lit diffuse). The
   slab's emissive-add hook is `<tonemapping_fragment>` — copy-pasting from the slab is the likeliest error
   and makes the stone glow like lava instead of being *lit* like rock (doc 05 §7.2).
4. **Author the green DARK and tune through the tone-mapper on-device.** Set `serpentine` near the PBR
   charcoal floor (~0.04–0.12 linear, desaturated). The crushed-black grade
   (`BrightnessContrast brightness ≈ -0.04`, `00-COHESION-MAP §3.3`) eats anything timid, and AgX/ACES move
   the apparent value — so tune the stops *through the operator on the iPhone OLED*, never against the raw
   value (the #1 first-build mistake, `00-COHESION-MAP §8 step 1`).
5. **Keep grazing weighted but not total.** `graze = mix(1, 1-N·L, 0.65)` — pure grazing (`mix(...,1.0)`)
   makes front-facing stone vanish entirely and the reveal reads as a thin edge-glow only; too little and
   the carved relief stops surfacing. 0.65 is the starting balance; tune per chamber camera.
6. **No cool/blue in the heat-stain.** The real temper march goes straw→brown→**purple→blue**; sampling the
   *full* march introduces cool hues that violate the warm grade. Sample only `gw_tempColor` at its **cool
   warm end** (~0.15–0.36) — dull iron-oxide crimson→ember, never blue (`00-COHESION-MAP §3.3` brand law).
7. **Share the falloff symbol, don't copy it.** The Ogham doc must `import`/inline the *same* `gw_reveal`
   from `shaders.js`, not a hand-copied `1/(1+d²)`. Two copies drift in tuning and the cohesion silently
   breaks (the `02`/`03` "one authority" lesson, Phase-2 doc 01 §1).
8. **Clamp the reveal tail deliberately.** The `mix` lift wants `[0,1]`; the white-gold spill and oxide glow
   read the **unclamped `>1` tail** (`aeTail = max(rev-1,0)`) so only the close, strong divine light pushes
   the stone into the HDR/bloom band. Clamping everything to 1 kills the spill; clamping nothing lets faint
   light bloom the whole floor.
9. **Verify the SwiftShader way then the device.** `qa-route` build-green + 0 console errors @ 393×852 and
   1440×900 (the GLSL compiled). Then the **iPhone-15 OLED read is mandatory** — the green rising from true
   black, the white-gold spill, and bloom on the oxide lip do not simulate headless (`shader-fx`,
   `post-fx`).

---

## 8. SOURCES (2025–2026)

1. **Codrops — "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js"** (Mar 23, 2026) — Fresnel/
   grazing term piped into the **emissive channel so dark surfaces glow on their own**; the reveal idiom of
   "dark by default, light at grazing edges" — the direct reference for keeping the stone black until raked.
   https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
2. **Codrops — "Susurrus: Crafting a Cozy Watercolor World with Three.js and Shaders"** (Apr 24, 2026) — a
   `uProgress` reveal shader on a screen quad + NPR low-value stylization as both aesthetic and perf
   discipline; the reveal-as-one-scalar × smoothstep pattern.
   https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/
3. **Codrops — "How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects"** (Oct
   8, 2025) — animating a reveal/mask uniform through `smoothstep` and noise to wipe content out of a base
   state; the scalar-driven reveal grammar this doc adopts.
   https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
4. **Maxime Heckel — "Field Guide to TSL and WebGPU"** (Oct 2025) — `Fn()` as the function-reuse primitive,
   emissive nodes, and **MRT emissive attachment for exact selective bloom** (vs luminance thresholding) —
   the TSL-portable target for `gw_reveal` and the bloom-selection forward path.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
5. **Three.js Roadmap — "TSL: A Better Way to Write Shaders in Three.js"** (2025) — node reuse as the
   explicit replacement for fragile `.replace()`/`onBeforeCompile` injection; rationale for authoring the
   reveal TSL-portable now.
   https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
6. **Codrops — "80s Business Tech and Seamless Scene Transitions: Inside Shader.se's Scroll-Driven WebGPU
   Pipeline"** (May 19, 2026) — scroll-driven, single-renderer, multi-scene WebGPU/TSL pipeline; validates
   the one-renderer scroll-coupled-uniform architecture this reveal binds into.
   https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
7. **Codrops — "Interactive Text Destruction with Three.js, WebGPU, and TSL"** (Jul 22, 2025) — TSL node
   material with a scalar-driven progressive surface change; reference for parameterized reveal/transition
   in the TSL lane.
   https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
8. **utsubo — "100 Three.js Tips That Actually Improve Performance (2026)"** (2026) — KTX2/Basis VRAM
   budgeting, `<Detailed>` LOD, `onBeforeCompile` variant cost, the fill-rate-not-triangles framing the
   mobile budget here is held to.
   https://www.utsubo.com/blog/threejs-best-practices-100-tips
9. **Inigo Quilez — "Domain Warping"** (re-surfaced via the 2025 `FradSer/30-days-of-shaders` study set and
   the maintained `tuxalin/procedural-tileable-shaders`, 2025) — `f(p + g(p))` warp producing marble/jade/
   stone strata and the **color-ramp-from-pattern** idiom the serpentine vein authoring uses.
   https://iquilezles.org/articles/warp/ · https://github.com/tuxalin/procedural-tileable-shaders
10. **British Stainless Steel Association — "Heat Tint (Temper) Colours on Stainless Steel"** (BSSA, 2025
    reference) + **Service Steel — "Steel Temper Colors: Explanation & Chart"** (2025) — the iron-oxide
    interference-color march (straw→brown→purple→blue) the heat-stain ramp references, and the rationale for
    sampling only the warm low end to honor the brand's no-cool-hue grade.
    https://bssa.org.uk/bssa_articles/heat-tint-temper-colours-on-stainless-steel/ ·
    https://www.servicesteel.org/resources/steel-tempering-colors
11. **Adobe Substance 3D Designer — "PBR Albedo Safe Color"** (helpx/experienceleague, 2025) — the
    physically-plausible albedo floor (~sRGB 50 / linear ~0.04, charcoal) that justifies authoring the
    serpentine green near-black so it can only be lifted by light.
    https://helpx.adobe.com/substance-3d-designer/substance-compositing-graphs/nodes-reference-for-substance-compositing-graphs/node-library/material-filters/pbr-utilities/pbr-albedo-safe-color.html
12. **Three.js — `webgpu_lights_custom` / `webgpu_postprocessing_bloom_emissive` examples** (r17x, 2025) —
    custom lighting-model nodes incl. distance attenuation, and emissive-driven bloom; reference for the
    `high`-tier RectAreaLight garnish and the MRT bloom-selection forward path.
    https://threejs.org/examples/webgpu_lights_custom.html ·
    https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The grazing-angle reveal vs. carved relief — coupling `gw_reveal`'s graze term to the Ogham POM
   height.** Exactly how much the grazing boost should scale with the POM-sampled groove depth so the
   notches surface *harder* than the flat stone in the same divine light — the precise math that makes the
   carving "pop" out of the green at the moment of reveal, on a clamped mobile POM budget.
2. **The iron-oxide temper-stain as an animated frontier.** A focused treatment of the pour-front-leading
   `uChannelHeat` field — how it is derived from the channel arc-length, how far ahead the stain should lead
   the metal, the diffusion/creep model, and how to keep it sampling only the warm end of `gw_tempColor`
   under the AgX vs ACES operator decision.
3. **Macro-variation against the big channel-hall floor.** Guaranteeing the revealed green never reads as a
   repeating tile on the largest basalt surface — a low-frequency macro `gw_fbm` variation layer + triplanar
   detail strategy, tuned so the reveal pool and the macro variation reinforce rather than fight.
4. **MRT emissive bloom selection for the stained lip (the WebGPU port).** When the forge moves to
   `WebGPURenderer`, replacing the luminance-threshold bloom with a dedicated MRT emissive attachment so the
   hottest oxide lip and the divine spill bloom exactly — and how `gw_reveal` as a `Fn()` plugs into
   `material.outputNode`/`emissiveNode` (Maxime Heckel Field Guide pattern).
