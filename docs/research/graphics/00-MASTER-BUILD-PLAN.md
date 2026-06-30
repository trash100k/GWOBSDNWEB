# 00 — THE MASTER BUILD PLAN (graphics capstone)

_GAELWORX forge-world graphics · the executable sequence. Synthesized from `00-COHESION-MAP.md` (the
architecture spine) + the 33 Phase-1 broad docs + the 65 Phase-2 deep dives. This maps **what to build, in
what order, against which research doc**, with the canonical contracts resolved._

> **Reading order:** `00-COHESION-MAP.md` first (the binding architecture), then this (the build order +
> the doc index), then the specific Phase-2 doc for the step you're on. Project-level integration with
> copy/pricing/lead/deploy lives in `../../forge-world/MASTER-BUILD-PLAN.md`.

---

## THE ONE-SENTENCE CONTRACT

GAELWORX is **one molten forge** built on **one renderer · one temperature signal · one noise basis · one
palette · one tone-map · one bloom contract · one lighting model (the metal is the only light) · one
camera** — every element samples those shared systems at different inputs, the **A and E are the single
eternal exception**, and the perf budget gatekeeps it all to **60 fps on an iPhone 15 OLED**. Build the
spine first; clamp the A/E; share everything; degrade uniformly; verify on the device.

---

## CANONICAL CONTRACTS (the cohesion lock — resolved, non-negotiable)

These are the cross-cutting decisions every element obeys (they stand in for the per-concern audits):

1. **Temperature** — one `temp ∈ [0,1]` → color via `gw_tempColor`, brightness via `gw_tempEmissive`,
   cooling via `gwCool01(age)`, divine-fire via `gw_divineFire` (the A/E exception). Lives in `shaders.js`.
   *Nothing invents its own orange.* (docs 01, 02, 03, 33, 38)
2. **Noise** — one `gw_` toolkit (`gw_snoise/3`, `gw_fbm/3`, `gw_warp`, `gw_flow`, `gw_worley`, `gw_curl3`,
   `gw_caustic`) at a shared `GW_FBM_OCTAVES` (4/3/2 by tier). *More detail = one more octave, never a
   second noise. Boil in place, never scroll.* (docs 04, 07, 08, 09, 29)
3. **Palette + HDR convention** — only `PAL`, inlined via `v3()`; 60/30/10 (void/crimson/ember-gold). Only
   the ~10% accent (`PAL.hot/emberHot/gold/divine`) exceeds 1.0 → **the palette IS the bloom selector, the
   heat mask, and the light-source list.** (cohesion-map §3)
4. **Tone-map/grade** — set **once on the renderer** (AgX recommended, ACES fallback; A/B on device), grade
   re-tuned to the operator, **half-float composer buffer**, grain-as-OLED-dither ≥0.03, no green/blue in
   post. (docs 33, 34, 35, 36, 37)
5. **Uniform pool** — one shared `U` (`forgeUniforms.js`), `Object.assign`'d into every material's
   `onBeforeCompile`; one headless `<ForgeDriver/>` is the sole author. (docs 39, 40, 41)
6. **Lighting** — the metal is the only light (no fill); A/E radiance (`uAEFire`) reveals basalt + Ogham;
   reflections from one runtime PMREM env (**no EXR ever**). (docs 22, 23, 24, 25, cohesion-map §5)
7. **Post-FX order** — one composer: `HeatHaze → DOF → GodRays → Bloom → CA → HueSat → BrightContrast →
   Vignette → Noise → SMAA` (tone-map terminal on renderer). (docs 30, 31, 35, 38, 64)
8. **Platform** — **WebGL2 + `onBeforeCompile` GLSL ships to the judge**; author TSL-portable for a
   post-judge WebGPU re-host. One renderer / one `<Canvas>` / one composer / one `Points`; `dispose()` on
   every unmount; static/reduced-motion + AEO path always present. (docs 50, 51, 54, cohesion-map §10)

---

## BUILD SEQUENCE (each layer de-risks the next · doc-indexed)

**Verify every step the repo way:** `npm run build` green → `qa-route` at 393×852 + 1440×900, **0 console
errors** → **iPhone 15 OLED device read** (true-black void, vivid Celtic Blood, divine-fire white-gold,
bloom spread — these do not simulate headless) → perf budget held.

### Phase A — THE SPINE (no look ships until this is right)
| Step | Build | Docs |
|---|---|---|
| A1 | Master temperature functions in `shaders.js`; wire **only** the slab veins to `gw_forge`; tune the 6 stops *through the tone-mapper on device* | 01, 03, 33 |
| A2 | The shared uniform pool `U` + `<ForgeDriver/>`; repoint slab + jewel to bind `U`; confirm `/` byte-identical | 39, 40, 41, 38 |
| A3 | Grow the `gw_` noise toolkit + `GW_FBM_OCTAVES` define + tier gate | 07, 29, 47 |
| A4 | OLED tone-map/grade decision (operator on renderer, grade re-tuned, grain-dither, half-float buffer); INP: `compileAsync` | 33, 34, 35, 36, 37, 48 |

### Phase B — THE SUBSTANCE
| Step | Build | Docs |
|---|---|---|
| B1 | Molten surface (`gw_warp`+`gw_flow`, tension-skin, boil bulge, hot-rim Fresnel) — **slow it first** | 04, 05, 18, 62 |
| B2 | Cooling system (per-letter `age`, crust skin, ember veins, frozen ripples) | 02, 06, 08, 63 |
| B3 | **Divine-fire A/E exception** — stamp early, verify they never cool (catch masking bugs) | 22, 23 |
| B4 | Basalt + forged iron (green-black, the **AE green-reveal** = first visible milestone, fire-scale) | 10, 14, 15 |

### Phase C — THE JOURNEY OF THE METAL
| Step | Build | Docs |
|---|---|---|
| C1 | 3D Cinzel letterforms (MSDF/extrude) + progressive fill (`uFillFront`, per-glyph U, meniscus) + `uIsAE` baked | 16, 17, 42, 18 |
| C2 | Celtic-interlace channels (one knot curve → geometry + flow + spark path) + the pour + channel→letter handoff | 19, 20, 21, 43 |
| C3 | Scroll camera journey (CatmullRom by arc-length, Lenis input, look-ahead) + lens (focus locked to pour-front, finale dolly-zoom) | 55, 56, 57, 58, 59, 60 |

### Phase D — ATMOSPHERE + FINISH + CHAMBERS
| Step | Build | Docs |
|---|---|---|
| D1 | Sparks/embers (GPGPU orbiters `high` / CPU `low` / Sparkles `static`) + heat-haze + smoke + god-rays + caustics | 09, 25, 26, 27, 28, 29, 30, 31, 32, 64 |
| D2 | Ogham + carved engraving (procedural SDF, derivative-bump, clamped POM `high`, AE-gated reveal) — the sacred payoff, last | 11, 12, 13, 24 |
| D3 | Per-chamber bespoke heroes as `scenes.js` configs + route-gated meshes (dispose; `renderer.info.memory` flat) | 44, 45, 46, 65 |
| D4 | Post-FX finish + the **Brutalist-Snap choreography pass** (pour/fill/camera/strike into one beat); verify static tier still cinematic | 36, 38, 61 |

### Track F — POST-JUDGE (WebGPU/TSL upgrade, do NOT block the judge on it)
TSL-portable master shader, WebGPU spike, compute spark/fluid benchmark, MRT emissive bloom port, iOS
stability matrix, OffscreenCanvas worker. → docs 50, 51, 52, 53, 54, 49, 41

---

## PER-CHAMBER CONFIGS (one world, eight apertures — `scenes.js` rows)

Each route = a damped preset, never a different system. Extend `{veinScale, veinGlow, irid, camZ, rotY,
rotX}` with `chamber, fov, envTone, ogham, lutWarm, heat/tempBias, caustic, smoke`. Damp toward the preset
on nav (λ ≈ 2.2–2.4), never cut.

| Route | Chamber | Signature |
|---|---|---|
| `/voice` | scrying pool | cool, mirror-still, sub-surface ember, ogham 0 — *a dark mirror with fire under it* (doc 65) |
| `/software` | casting room | live molten pour, mid heat, sparks on |
| `/automations` | channel hall | top-down, long lens (fov 30), dense interlace, ogham on walls |
| `/web` | jewel chamber | wide (fov 50), warm reflections (envTone 0.6), 3-tap chromatic dispersion |
| `/about` | altar approach | close oblique, ogham 1 + carved engraving + **AE green-reveal full** (keystone) |
| `/pricing` | stone ledger | Ogham verse up the edge, cool, still |
| `/work` | four plinths | high three-quarter, gallery Lightformer keys, four casts cooling out of phase |
| `/contact` | forge-mouth arch | head-on, hottest reflections (envTone 0.85), thickest smoke, white-hot mouth |

---

## PERF BUDGET (the gate every step passes)

iPhone 15 OLED, Safari tab, thermal throttle ~90s. **Pixels are the enemy, not triangles** (fill-rate +
overdraw). 60fps = 16.67ms; reserve ~3–4ms for compositor/Lenis/React; design to **~9–10ms steady on
`high`** for throttle headroom. The four levers in priority: **(1) DPR cap 1.5 mobile / 2 desktop**, (2)
**bloom `resolutionScale 0.5`**, (3) **`GW_FBM_OCTAVES` 4→3→2**, (4) **particle overdraw** (modest point
size, short life). Three tiers `high|low|static` from a boot probe; runtime `PerformanceMonitor` ladder via
the mutable `forge` store. (doc 47, cohesion-map §10)

---

## OPEN LOOK-DEV DECISIONS (settle on-device during the build)
- **AgX vs ACES** tone-map operator — A/B on the iPhone (Phase A4). AgX recommended for the divine-fire
  path-to-white + Celtic-Blood protection; ACES fallback with original grade values.
- **GPGPU sparks vs CPU points** at the `high` threshold — benchmark on device (docs 26, 27, 52).
- **Ogham procedural-SDF vs atlas** — doc 13 leans procedural; confirm fidelity at the close altar framing.
- **Finale staging** — gated by the project-level finale reconciliation (DESIGN-BRIEF vs copy revision-pass).

---

## DOC INDEX — all 65 Phase-2 deep dives by cluster

- **Temperature/cooling/material:** 01, 02, 03, 04, 05, 06, 07, 08, 14, 15, 18, 62, 63
- **Letterforms/channels/pour:** 16, 17, 19, 20, 21, 42, 43
- **Divine-fire/lighting/stone:** 22, 23, 24, 25, 10, 11, 12, 13
- **Particles/atmosphere:** 09, 26, 27, 28, 29, 30, 31, 32, 64, 65
- **Post/OLED/uniforms/arch:** 33, 34, 35, 36, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48
- **Camera/journey:** 55, 56, 57, 58, 59, 60, 61
- **WebGPU/TSL/future:** 49, 50, 51, 52, 53, 54

---

## FINAL TALLY
- **Phase-1 broad sweep:** 33/33 docs.
- **Phase-2 deep dives:** 65 docs (implementation-grade — each carries concrete GLSL/TSL + how it binds the
  master systems, so the separate "build-spec" layer is folded in, not a gap).
- **Synthesis:** `00-COHESION-MAP.md` (architecture) + `00-INDEX.md` + this master plan.
- **Total: ~1,100 pages**, 2025–2026 sources, all committed.
- **Status: RESEARCH COMPLETE.** Build executes against this plan + the cohesion map, Phase A first.
