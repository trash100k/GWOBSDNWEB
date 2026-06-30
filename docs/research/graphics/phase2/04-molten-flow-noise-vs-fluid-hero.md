# 04 — Per-Octave Flow Noise vs a One-Shot 2D Stable-Fluids Field (the Altar Pour)

_Phase 2 deep-dive · GAELWORX forge world · cluster **C-flow-pour** · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js) · the surface of the molten metal at the altar-release beat_

> **Reads on top of `00-COHESION-MAP.md` (§1 temperature, §2 noise, §10 budget), `phase1/08`
> (sim-vs-fake verdict), `phase1/09` (flow-map pour), `phase1/01` (`gw_flow` molten surface), and
> `phase2/01` (the `temperature.js` authority).** Those docs already settled the *macro* question — the pour
> is **directed**, art-authored, baked from the Celtic-interlace curve, never a free solver. This document
> drills into the one place where a real solver might still earn its keep: **the surface itself**, at the
> single dramatic instant the altar releases. The question is narrow and benchmark-able: does the ambient
> `gw_flow` per-octave advected noise already read as genuine *sloshing* molten metal at the release beat,
> or do we spend one short-lived 256² `useFBO` velocity field to get true emergent slosh — and if so, what
> exactly does that extra render target cost on an iPhone 15, how do we keep the sim from exploding, and how
> hard do we gate it to `high`?

---

## 1. SCOPE

The **altar-release beat** is the dramatic climax of the casting-room (`/software`) and altar-approach
(`/about`) chambers: the stone forge-ALTAR tips, and for ~1.5–2.5 seconds a slug of living molten metal
surges, *sloshes against the altar lip and channel mouth*, then settles into the steady directed flow that
`phase1/09` already owns. Everything *before* and *after* that beat is the ambient molten surface — the
`gw_flow` per-octave advected FBM from `phase1/01 §4.2`, domain-warped, boiling-in-place, cooled by the
`temperature.js` ramp. That ambient surface is cheap, cohesive, and *good enough* for the long steady
state. The open question is purely the **transient**: at the moment of release, does the metal need to
*physically respond* — pile up against an obstacle, rebound, ripple outward from the impact — in a way that
a noise field, however well-warped, fundamentally cannot fake, because noise has no momentum and no
boundary awareness?

This is a classic "is the fake good enough, or is this the 5% where the sim earns its frame" decision. The
cohesion map (§5.1, §8 Phase-B step 5) is explicit that the molten surface is the *first substance built*
and that its failure mode is "thin glowing water" — the cure is slowness and viscosity, not more
turbulence. A fluid solver is the opposite instinct (it adds energy and emergence), so the burden of proof
is on the solver: it must buy something the noise *structurally* cannot, at a cost the iPhone-15 budget
(§10: ~9–10 ms steady-state on `high`, fill-rate-bound) can absorb *only for the ~2 s the beat lasts*.

The scope boundaries, sharply:

- **In scope:** the *surface velocity / displacement / churn* of the molten metal at the altar pool during
  the release transient; benchmarking ambient `gw_flow` against a single short-lived 2D Stable-Fluids
  velocity field; the extra-target cost on iPhone 15; the dt-clamp against sim explosion; the `high`-only
  gate and the graceful `low`/`static` fallback.
- **Out of scope:** the macro routing of the pour down the channels (`phase1/09`, baked flow-map — *settled,
  do not re-solve*); the falling stream tube (`phase1/09 §4`); the letterform fill (`phase1/13`); the
  spark advection (those *consume* a velocity field — §5; their emitter is `phase1/15`); full 3D MLS-MPM
  (`phase1/08 §9`, a separate WebGPU deep-dive). This doc is **the 2D surface field only.**

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

Five honest options sit between "the noise we already have" and "a real solver," ordered cheapest-first.

### 2.A Ambient `gw_flow` per-octave flow noise (the incumbent, zero extra cost)

`gw_flow` (`phase1/01 §4.2`) is **per-octave advected FBM**: each octave displaces the sample point by an
analytic gradient (`gw_gradn`, a curl-ish term) and then `mix(bp, p, 0.77)`-pulls it back toward a slowly
advancing base point so the field **cannot diverge** — the `ADVECTION ≈ 0.77` constant is what keeps it
churning-in-place rather than sliding. This is the technique Inigo Quilez's domain-warp lineage and the
2025 lava-flow write-ups converge on, and `three-fluid-fx`'s own docs note it as the "noise displacement"
family distinct from a real solver. **Quality:** genuinely viscous, folding, boiling — when slowed down it
reads as thick metal, exactly the cohesion-map cure for "thin glowing water." **Perf:** *free* — it's
already in the slab/molten material, 4 octaves on `high` / 2 on `low` via `GW_FBM_OCTAVES`. **Limit:** it is
**stateless and momentum-free**. It cannot pile against the altar lip, cannot rebound, cannot ripple
*outward from an impact point*, because nothing in it knows where the metal *was* last frame or where the
boundary is. It boils; it does not slosh. For the steady state that is perfect. For the *release impact* it
is the thing that will read as "the texture animated faster" rather than "the metal lurched."

### 2.B `gw_flow` + a scripted impulse warp (the cheap fake-slosh)

Stay stateless, but at the release beat add an **analytic radial impulse** to the domain warp: a expanding
ring `exp(-((r - c*age)²)/w²)` centered on the impact point, its amplitude `exp(-age*k)`-decayed, fed into
the warp offset and the boil-bulge vertex displacement. This is a *kinematic* slosh — a hand-authored
ripple, not a simulated one — but it is **directed, deterministic, and Brutalist-Snap-able** (it fires on
`forge.strikeAt` exactly like the existing surge). 2025 stylized-water shaders (Codrops, Mar 2025) use this
exact "smoothstep band advancing on a coordinate" idea for shorelines; here it's a radial band advancing on
distance. **Quality:** reads as a *single clean shockwave* — sacred, inevitable, on-brand. **Perf:** ~free
(a few extra ALU ops in the existing material). **Limit:** one ring, no secondary sloshing, no
metal-against-wall pile-up; it's a *gesture* of slosh, not a body of fluid responding.

### 2.C One short-lived 2D Stable-Fluids velocity field (the candidate under test)

The Jos Stam (SIGGRAPH 1999) pipeline as fragment-shader passes on ping-pong `useFBO` targets:
**advect → add buoyancy/impulse → divergence → Jacobi pressure solve (×N) → subtract gradient**. A 256²
`HalfFloatType` velocity field, *spun up only at the release beat and torn down ~2 s later*, injected with
an upward-and-outward impulse at the impact point. The 2025-2026 lane is mature and explicitly mobile-aware:
**`three-fluid-fx`** (artcodev, active 2025-2026) is a drop-in 2D Stable-Fluids solver for three.js with
*both* a WebGL/GLSL and a WebGPU/TSL pipeline, shipping **profile presets** — `performance` = 128² sim /
256² display (its named "mobile / weak GPU" preset), `balanced` = 256²/512², `quality` = 384²/1024² — with
`fluid.step(deltaSeconds)` taking an *explicit* dt and per-second dissipation. mofu-dev's "Stable Fluids
with three.js" and Olha Stefanishyna's 2025 tech-note series ("The Advection Step," "Pressure Solving")
document the same ping-pong pipeline step-by-step. Codrops' **Mar 2026** dual-scene fluid X-ray reveal ships
a production ping-pong fluid feeding a material in three.js (WebGPU). **Quality:** *real* slosh — momentum,
boundary response, secondary ripples, emergent. This is the thing noise structurally cannot do. **Perf:**
the pressure solve (`iterations × grid²`) is the cost; at 256² it is tractable on `high` but it is *the
single most expensive thing in the world* while it runs. **Complexity:** moderate-high, very well-trodden,
the explosion failure mode is real (§6). **The honest read: it earns its cost only if it runs *briefly* and
gates *hard*.**

### 2.D Pre-baked fluid → flow-map "canned slosh" (the offline-sim middle path)

Run the 2D solver **offline**, bake ~24–48 frames of the slosh velocity (or displacement) into a small
texture array / sprite-sheet flowmap, and *play it back* at the release beat — the slosh is real (it was
simulated) but the runtime cost is texture sampling, not solving. This is the `phase1/09` flow-map
philosophy extended to *time*: the channel routing is already a baked field; the slosh becomes a baked
*animated* field. **Quality:** real slosh, perfectly art-directable (you pick the take you like). **Perf:**
near-free at runtime; cost is texture memory (a 64²×48-frame RG sheet ≈ trivial). **Limit:** identical every
release (fine — the beat is scripted, not interactive), and it's *playback*, not *response* (it can't react
to a different impact point — also fine, the altar tips the same way every time). **This is the strongest
dark-horse**: it gets the solver's quality without the solver's runtime risk.

### 2.E WebGPU/TSL compute fluid or MLS-MPM (the forward path, post-judge)

On `WebGPURenderer` the same solver expresses as TSL `Fn()` compute kernels; Maxime Heckel's 2025 *Field
Guide to TSL and WebGPU* shows a single compute shader replacing the entire FBO ping-pong for GPGPU state,
and `three-fluid-fx/tsl` ships exactly this. WWDC 2025 confirmed WebGPU on Safari 26 / iOS 26. **But** the
cohesion map (§10) is non-negotiable: the *judge device* ships WebGL2 + `onBeforeCompile`; the
WebGL2-fallback branch of `WebGPURenderer` is *less* tested, so betting the beat on it is the documented
mistake. **Verdict: author TSL-portable, ship WebGL2.** MLS-MPM 3D is its own deep-dive (`phase1/08 §9`),
not this surface question.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Tiered, in this exact priority order:**

1. **Ambient surface = `gw_flow` (2.A), always, every tier.** It is the steady-state molten surface and it
   is already cohesive, free, and correct. Nothing replaces it. Slow it down first, ramp second, skin
   third, flow last (cohesion-map Phase-B step 5).

2. **Release-beat slosh on `low` and as the universal floor = the scripted impulse warp (2.B).** A single
   clean expanding shockwave fired on `forge.strikeAt`. It is Brutalist-Snap, sacred, deterministic, and
   *free*. This is what 95% of devices and 100% of the steady-state see, and it is genuinely good — a
   directed lurch, not chaos. **If we only ever shipped 2.B, the world would still read as alive.**

3. **Release-beat slosh on `high` = a single short-lived 256² 2D Stable-Fluids field (2.C), strictly
   gated.** Spun up the frame the altar tips, run for the ~2 s transient with a **hard dt-clamp**, then
   torn down (FBOs disposed, frameloop returns to steady cost). It writes a velocity texture that (a)
   displaces the molten surface for *real* momentum-driven slosh, and (b) is *also* the field the sparks and
   heat-haze advect along (§5) — so its cost is amortized across three consumers during the one beat it
   exists. This is the one place in the whole world a real solver runs, and it runs for two seconds.

4. **Fallback / de-risk insurance = baked canned-slosh flowmap (2.D)** kept in the back pocket. If on-device
   profiling shows the live solver blows the 2 s transient past 16.67 ms even at 128², **swap to playback of
   a pre-baked slosh** — identical look, zero solve cost. The decision is a Phase-2 on-device A/B, but 2.D
   is the safety net that guarantees the beat ships on `high` even if the live solver doesn't fit.

**Why not "live solver everywhere":** it is over budget on `low`/`static`, off-brand if it runs continuously
(GAELWORX is *directed, inevitable* — a perpetually churning chaotic pool reads as a screensaver, not a
sacred forge), and a continuous solver is a continuous explosion risk. The beat is a *punctuation mark*; the
solver should be too.

**Why the live solver at all, over just 2.B/2.D:** because the casting-room is the *hero* chamber and the
`high`-tier iPhone-15 is the *judge device*. A real momentum-driven slosh — metal piling against the lip,
rebounding, throwing a secondary ripple — is the difference between "nice shader" and "Active-Theory /
Lusion caliber." It is worth two seconds of the frame budget on the device that can see it. And because the
*same* field feeds sparks + haze, it's not a single-purpose extravagance.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

Current stack only: `three` (r17x WebGL path), `@react-three/fiber`, `@react-three/drei` (`useFBO`),
`@react-three/postprocessing`, `maath` (`damp`). **No new runtime dependency.** `three-fluid-fx` (2.C) is
*reference* for the pass structure and the profile-preset sizing — we inline our own minimal solver so it
binds the shared `U` pool and disposes on the React lifecycle, rather than pulling a black-box that owns its
own renderer. (`three-fluid-fx/tsl` is the named port target for the eventual WebGPU upgrade — author the
passes 1:1 so the port is a re-host.)

### 4.2 The minimal 2D Stable-Fluids solver (`high`-only, short-lived) — r3f component

```jsx
// SloshField.jsx — mounted ONLY while forge.altarReleasing && tier === 'high'.
// React mount/unmount = automatic FBO dispose (the cohesion-map disposal law).
function SloshField() {
  const { gl } = useThree()
  // Two ping-pong velocity targets + one pressure pair. 256² is the sim grid (display reads it scaled).
  const vel  = [useFBO(256, 256, FBO_OPTS), useFBO(256, 256, FBO_OPTS)]
  const div  =  useFBO(256, 256, FBO_OPTS)               // divergence (single)
  const pres = [useFBO(256, 256, FBO_OPTS), useFBO(256, 256, FBO_OPTS)]
  const a = useRef(0)                                    // ping index
  const born = useRef(performance.now())

  // Quad + materials authored once (advect / impulse / divergence / jacobi / gradient-subtract).
  const passes = useMemo(() => buildSloshPasses(gl), [gl])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)                   // *** THE dt-CLAMP — see §6. Never raw dt. ***
    if (document.hidden) return                          // freeze on tab-blur (NaN insurance)
    const age = (performance.now() - born.current) / 1000

    // 1) ADVECT velocity by itself (semi-Lagrangian backward trace), with per-second dissipation.
    runPass(gl, passes.advect, vel[a.current], vel[1 - a.current],
            { uDt: dt, uDissipation: Math.pow(0.92, dt * 60) /* viscous metal: heavy decay */ })
    a.current = 1 - a.current

    // 2) IMPULSE — the altar slug: an upward+outward Gaussian splat at the impact point, decaying with age.
    const force = Math.exp(-age * 1.6) * U.uHeat.value    // rides the shared strike heat
    runPass(gl, passes.impulse, vel[a.current], vel[1 - a.current],
            { uPoint: forge.altarImpact, uForce: force, uRadius: 0.12, uDt: dt })
    a.current = 1 - a.current

    // 3) DIVERGENCE of the velocity field.
    runPass(gl, passes.divergence, vel[a.current], div)

    // 4) JACOBI pressure solve — N iterations. THE cost knob (iterations × grid²). 20 on high; can drop to 12.
    clearTarget(gl, pres[0])
    for (let i = 0; i < SLOSH_ITERS; i++) {               // SLOSH_ITERS = 20 (high), 12 (throttled)
      runPass(gl, passes.jacobi, pres[i % 2], pres[(i + 1) % 2], { uDiv: div.texture })
    }
    // 5) SUBTRACT pressure gradient → divergence-free velocity.
    runPass(gl, passes.gradient, vel[a.current], vel[1 - a.current],
            { uPressure: pres[SLOSH_ITERS % 2].texture })
    a.current = 1 - a.current

    // Publish for the surface, sparks, and haze to sample this frame.
    U.uSloshVel.value = vel[a.current].texture
    U.uSloshAmt.value = THREE.MathUtils.damp(U.uSloshAmt.value, force, 6, dt)
  })
  return null   // headless: writes into the shared U pool, draws nothing itself
}
const FBO_OPTS = { type: THREE.HalfFloatType, format: THREE.RGBAFormat,
                   minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
                   depthBuffer: false, stencilBuffer: false }
```

`runPass` is the standard "set material on a shared fullscreen quad, `gl.setRenderTarget(dst)`,
`gl.render(quadScene, quadCam)`" helper — *no second `<Canvas>`, no second rAF*; it runs inside the existing
`useFrame`, honoring the single-renderer law. `clearTarget`/`runPass` allocate nothing per frame.

### 4.3 The advection + jacobi GLSL (the two load-bearing passes)

```glsl
// --- ADVECT (semi-Lagrangian backward trace; clamp the lookup = MacCormack-style stability) ---
uniform sampler2D uSrc; uniform float uDt, uDissipation; uniform vec2 uTexel;
void main(){
  vec2 vUv = gl_FragCoord.xy * uTexel;
  vec2 v = texture2D(uSrc, vUv).xy;
  vec2 prev = vUv - v * uDt;                       // trace backward along velocity
  prev = clamp(prev, uTexel, 1.0 - uTexel);        // *** clamp inside bounds: no off-grid NaN sampling ***
  gl_FragColor = vec4(texture2D(uSrc, prev).xy * uDissipation, 0.0, 1.0);
}
// --- JACOBI pressure iteration (the Poisson solve; run N times ping-ponged) ---
uniform sampler2D uPrev, uDiv; uniform vec2 uTexel;
void main(){
  vec2 vUv = gl_FragCoord.xy * uTexel;
  float L = texture2D(uPrev, vUv - vec2(uTexel.x,0.)).x;
  float R = texture2D(uPrev, vUv + vec2(uTexel.x,0.)).x;
  float B = texture2D(uPrev, vUv - vec2(0.,uTexel.y)).x;
  float T = texture2D(uPrev, vUv + vec2(0.,uTexel.y)).x;
  float d = texture2D(uDiv, vUv).x;
  gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}
```

### 4.4 How the surface *consumes* the field (the cohesion-critical part)

The molten surface material **does not change technique** — it stays `gw_warp` + `gw_flow` + the
`temperature.js` ramp. The slosh field is added as a **velocity-driven displacement of the warp domain and
the boil bulge**, faded by `uSloshAmt` so the surface is byte-identical to the steady-state material when
the beat isn't running:

```glsl
// In the molten material's domain-warp / vertex-bulge, AFTER the ambient gw_flow term:
vec2 slosh = texture2D(uSloshVel, vUv).xy;         // 0 when no field bound / amt 0
vec2 warpUv = vUv + slosh * uSloshAmt * 0.06;      // push the warp domain by real velocity
float boil  = gw_heat(warpUv * 2.2, uTime)
            + gw_flow(warpUv * 2.2, uTime, uOctaves) * 0.4;   // unchanged ambient term, sloshed domain
boil += length(slosh) * uSloshAmt * 0.25;          // velocity magnitude lifts the surface (the slug piling)
// temperature still from the SHARED ramp — slosh moves the metal, never recolors it:
float temp = gwCool01(vAge, uCoolRate);            // (temperature.js — unchanged)
vec3 metal = mix(gw_forge(1.0 - temp), gw_divineFire(uFlick), uIsAE);   // A/E exception intact
```

`uSloshVel` defaults to a **1×1 black texture** in the `U` pool, so every material compiles and runs
identically whether or not the field is mounted — the `low`/`static` tiers literally sample black and get
`slosh = 0`, no branch, no second code path.

### 4.5 Key uniforms / params (all in the shared `U` pool, `dt`-damped)

| Uniform | Meaning | Source | Tier |
|---|---|---|---|
| `uSloshVel` (sampler2D) | the live velocity field | `SloshField` writes; **1×1 black default** | high only |
| `uSloshAmt` (float 0..1) | release-beat blend (0 = pure ambient) | `damp(_, force, 6, dt)` from `forge.strikeAt`/`uHeat` | all (0 off-beat) |
| `forge.altarImpact` (vec2) | impact point in field UV | journey/scene timeline | high (impulse) |
| `SLOSH_ITERS` | Jacobi count (cost knob) | `20` high / `12` throttled | high |
| `uDissipation` | per-second velocity decay (viscous) | `pow(0.92, dt*60)` — heavy (metal, not water) | high |
| `uCoolRate`, `uIsAE`, `uFlick` | the temperature.js spine | shared `U` (unchanged) | all |

Note the discipline: **the slosh moves the metal; it never touches `uTemp`, color, or the A/E branch.**
Momentum and temperature are orthogonal signals (cohesion-map §1 keeps hue and brightness separate; here we
keep *motion* separate from both). The A/E still read `gw_divineFire` regardless of how violently the field
sloshes the domain around them.

---

## 5. COHESION

The slosh field is *cohesive precisely because it is a shared service, not a bespoke effect*:

- **One temperature, untouched.** The field displaces the warp domain and lifts the bulge; the color still
  comes from `gw_forge(gwCool01(...))` in `temperature.js`. A sloshing wave of metal is *visibly the same
  metal* as the steady pool because it samples the same ramp — only its *geometry* moved. Off-brand chaos is
  prevented structurally: there is no path for the solver to invent an orange.

- **One noise basis.** The ambient term is still `gw_flow`/`gw_warp`/`gw_heat` from `shaders.js`; the field
  *advects the same noise's domain*, it doesn't add a second noise. "More motion" = a velocity push on the
  existing warp, never a forked turbulence layer (cohesion-map §2, §7 rule 2).

- **One field, three consumers (the amortization).** The 256² velocity texture is *the* heat-velocity field
  `phase1/08 §4c` and `phase1/09` already specified for **(1)** the surface slosh (here), **(2)** the
  sparks — `Embers`/GPGPU orbiters swap their canned `sin/cos` drift for `texture2D(uSloshVel, …)` so they
  ride the *actual* lurch, and **(3)** the heat-haze post pass UV-warp. During the one beat the field
  exists, all three read it — so its cost is shared, and the slosh, sparks, and shimmer all surge *on the
  same frame from the same physics* (cohesion-map §7 rule 6 — synchrony is the proof).

- **One clock, one driver, dt-damped.** `uSloshAmt` damps from `forge.strikeAt`/`U.uHeat` via the single
  `<ForgeDriver/>` writer; the impulse force is `exp(-age*1.6) * uHeat`. The beat *is* a Brutalist-Snap
  strike pulse (`exp(-since*3)`) — the same pulse that surges the slab veins, the jewel edges, the bloom.
  The slosh joins that synchrony, it doesn't run its own rAF.

- **One bloom contract.** The field carries velocity, not radiance — it never pushes a pixel above 1.0. Only
  the temperature ramp's white-hot band (and the A/E divine fire) bloom; a violent slosh of *cooled* metal
  correctly stays dark. The palette is still the bloom selector (cohesion-map §3.1).

- **One palette, the A/E keystone intact.** No new colors; `uSloshVel` is the only addition and it's a
  velocity, not a color. The A/E divine-fire branch (`uIsAE` → `gw_divineFire`) is untouched — the metal can
  slosh around the divine letters all it wants; they stay eternal white-gold (cohesion-map §7 rule 5).

---

## 6. MOBILE & PERFORMANCE (iPhone 15 OLED budget)

The frame budget (cohesion-map §10): ~11–12 ms scene budget, design to ~9–10 ms steady-state on `high`. The
slosh field is **the most expensive thing in the world while it runs**, so it is fenced to the ~2 s beat and
hard-gated.

### 6.1 The extra-target cost, sized

The cost is **`passes × grid²` fragment invocations**, fill-rate not geometry (cohesion-map §10: "pixels are
the enemy"). At 256² the field is 65,536 texels; per frame the pipeline is roughly: advect (1) + impulse (1)
+ divergence (1) + jacobi (`SLOSH_ITERS`) + gradient (1) ≈ **`24` full-grid passes at 20 iters**. That is
~1.57 M texel-shader executions per frame — each pass is a *tiny* shader (a handful of texture fetches + ALU),
so on the A16/A17 GPU this lands in the **~2.5–4 ms** range at 256² / 20 iters, *on top of* the steady-state
9–10 ms. **That overruns the budget** — which is exactly why it is short-lived and gated, and why the levers
below exist. Reference anchor: a *full-screen* fragment shader costs ~0.8 ms on an A14 (iPhone 12 mini, 2025
measurement); the slosh is ~24 *quarter-or-less-screen* passes, so the multiplier is the iteration count,
which is the knob.

### 6.2 The five levers, in priority order

1. **Drop the sim grid to 128²** (the `three-fluid-fx` "performance / mobile" preset). 128² is *one quarter*
   the texels of 256² → roughly *one quarter* the cost (~0.7–1.1 ms). The slosh reads identically at the
   distance the altar pool occupies on a phone — **128² is the recommended iPhone-15 grid**, 256² is a
   desktop-`high` luxury.
2. **Cut Jacobi iterations 20 → 12 → 8.** The pressure solve is the bulk of the passes; fewer iters = softer
   incompressibility = *more* viscous-looking (acceptable, even desirable, for heavy metal). 12 is the
   recommended mobile floor; the iteration-vs-quality curve (Stefanishyna 2025) is forgiving for a
   stylized, brief, distant slosh.
3. **Render the field at half the canvas DPR already in effect.** The field is fixed-grid (256²/128²),
   *independent* of canvas DPR — capping canvas DPR to 1.5 (cohesion-map §10 lever 1) already protects the
   *consumers*; the field grid is its own budget.
4. **Run only during the beat, then dispose.** `SloshField` mounts on `forge.altarReleasing`, runs ~2 s,
   unmounts → React fires the FBO `dispose()`. `renderer.info.memory.textures` must return to baseline after
   the beat (the disposal check, cohesion-map §4.3). Peak memory is steady-state + 5 small HalfFloat 128²
   targets, for two seconds.
5. **`PerformanceMonitor` throttle.** If `factor` dips during the beat, drop `SLOSH_ITERS` 20→12→8 live
   (read from the mutable `forge` store, never React state mid-beat); if it's still over, **bail to the 2.D
   baked-slosh playback or the 2.B scripted-impulse warp** for the rest of that beat. The beat *never* drops
   a frame — it degrades the slosh, not the framerate.

### 6.3 The tier map

- **`high`** — live 128² (mobile) / 256² (desktop) solver, 12–20 iters, ~2 s, feeds surface + sparks + haze.
  Disposes after the beat.
- **`low`** — **no solver.** The scripted-impulse warp (2.B): one analytic shockwave on the strike pulse.
  Visually 90% of the read (a clean directed lurch); zero extra target. Sparks/haze use their canned drift.
- **`static`** (reduced-motion / weak GPU) — **no beat at all.** `uTime` frozen to `2`, the altar pool a
  fixed mid-slosh frozen still, A/E glowing. A dignified poster, not a broken fallback (cohesion-map §10).

### 6.4 The dt-clamp against sim explosion (the non-negotiable)

This is the single most important line in the doc. A semi-Lagrangian solver advects by `uv - v*dt`; a large
`dt` (after a tab-blur, a GC pause, a scroll-stall, a thermal hitch) traces *way* off-grid, the velocity
grows unbounded, the HalfFloat texture goes `NaN`, and the screen flashes black or full-white — the #1
fluid-sim crash, confirmed across the 2025 sources (large timesteps blow up; the fix is **clamp the timestep
to a 16 ms max**). Three layers of insurance, all present in §4.2:

1. **`const dt = Math.min(dtRaw, 1/30)`** — never feed raw `dt` to the solver. A 2 s stall must advance the
   sim by 33 ms, not 2000 ms.
2. **`if (document.hidden) return`** — freeze the solver on tab-blur entirely; resume cleanly (the `born`
   ref means age keeps its meaning, but no step accumulates).
3. **`prev = clamp(prev, uTexel, 1.0 - uTexel)`** in the advect shader — the MacCormack-style lookup clamp:
   even if a velocity spikes, the backward trace can't sample off-grid, bounding the feedback.

A fourth, belt-and-suspenders: because the field is **born and dies in ~2 s**, even a partial blow-up
self-heals on the next beat (fresh FBOs), and the `uSloshAmt` damp means a single bad frame is smeared, not
flashed. The brevity *is* a stability feature.

---

## 7. GET-IT-RIGHT-FIRST-TIME

Order of operations — each step verified the repo way (`npm run build` green → `qa-route` 393×852 +
1440×900, **0 console errors** = GLSL compiled under SwiftShader → **then iPhone 15 OLED device read**, since
slosh momentum and true-black bloom do not simulate headless):

1. **Ship the ambient `gw_flow` surface first, slow and viscous.** Tune it (cohesion-map Phase-B step 5)
   until the *steady* pool reads as thick metal. If the steady state is "thin glowing water," **stop** — no
   slosh fixes a bad base. The slosh is a delta on a correct surface.
2. **Add the scripted-impulse warp (2.B) next** and wire it to `forge.strikeAt`. Confirm the release beat
   reads as a clean directed lurch with *zero* extra targets. **This is the floor; it must be good on its
   own.** Many builds should ship here and call it done.
3. **Only then build `SloshField` (2.C), `high`-only, at 128².** Implement the dt-clamp, `document.hidden`
   freeze, and advect-clamp from the *first* line of code — not as a later hardening pass. Verify with a
   forced 2 s `setTimeout` stall that the field does *not* NaN.
4. **Bind `uSloshVel` as a 1×1 black default in `U`** before the field exists, so every material already
   compiles with the consume-path live. The field mounting is then purely additive — no recompile, no second
   shader variant.
5. **Wire the surface consume-path** (§4.4), faded by `uSloshAmt`. Verify the surface is *byte-identical* to
   steady-state when `uSloshAmt = 0` (the `/` home route must not change).
6. **Hand the same `uSloshVel` to sparks and heat-haze** (§5) — confirm all three surge on the same frame.
7. **Bake the 2.D canned-slosh safety net** from the working 2.C solver (capture 32–48 frames of the field
   to a sprite-sheet), so the on-device A/B can swap live-vs-baked with one flag.
8. **Profile the beat on the iPhone 15.** If 128²/12-iter holds 16.67 ms during the transient → ship live.
   If not → ship baked (2.D). Either way the look is the same; only the runtime cost differs.

**Pitfalls that bite this technique class:**

- **Unclamped `dt` = guaranteed crash.** Not "might" — *will*, the first time a judge backgrounds the tab.
  §6.4 is mandatory, day one.
- **Continuous solver = off-brand + perpetual explosion risk.** GAELWORX is *directed*. The solver is a
  punctuation mark, not the prose. Mount it for the beat; tear it down.
- **Float vs HalfFloat precision.** HalfFloat is fine for a brief, distant, stylized slosh and is the mobile
  default; do *not* reach for Float32 targets (slower, and iOS render-to-float support is the flakier path).
- **Forgetting the disposal check.** If `renderer.info.memory.textures` doesn't return to baseline after the
  beat, the FBOs aren't disposing — mount/unmount with React, never imperatively cache them.
- **Letting slosh touch temperature.** The field moves metal; it must *never* write `uTemp` or color. Keep
  motion orthogonal to the temperature.js spine (§4.4) or you'll get hot-spots that track velocity — a
  cohesion break.
- **Sim grid coupled to canvas DPR.** The field is fixed-grid; don't multiply it by `devicePixelRatio` or a
  retina phone quietly runs a 768² solver. Hard-code 128²/256².
- **No-field default not black.** If `uSloshVel`'s default isn't a 1×1 black texture, `low`/`static`
  materials sample garbage → surface jitters with no field. Default-black is load-bearing.

---

## 8. SOURCES (2025–2026)

1. artcodev, **`three-fluid-fx`** — drop-in 2D Stable-Fluids solver for three.js, WebGL/GLSL **and**
   WebGPU/TSL pipelines, profile presets (`performance` 128²/256² "mobile / weak GPU"; `balanced` 256²/512²;
   `quality` 384²/1024²), explicit `fluid.step(deltaSeconds)` + per-second dissipation. GitHub, active
   **2025–2026**. https://github.com/artcodev/three-fluid-fx — tutorials:
   https://three-fluid-fx.artcreativecode.com/tutorials/tsl/minimal/particles-3d/
2. Filip Kantedal / Codrops, **"Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js"** —
   **2026-03-23**. Production **ping-pong fluid simulation** feeding instanced scenes + Fresnel materials in
   three.js (WebGPU), canvas mouse-path → diffused fluid → composited reveal. The 2026 reference for a
   ping-pong field driving a material. https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/
3. Olha Stefanishyna, **"Fluid Simulation in WebGL: The Advection Step"** and **"WebGL Fluid Simulation:
   Pressure Solving"** — ostefani.dev tech-notes, **2025**. Semi-Lagrangian backward advection, ping-pong
   buffers, the Jacobi pressure solve as its own ping-pong, iteration-vs-quality framing.
   https://ostefani.dev/tech-notes/webgl-fluid-advection ·
   https://ostefani.dev/tech-notes/webgl-fluid-divergence-pressure
4. Misaki Nakano (mofu), **"Stable Fluids with three.js"** — mofu-dev, **2025**. The full Stam pipeline
   (advect → divergence → Jacobi → gradient-subtract) on FBO ping-pong / GPUComputationRenderer in three.js.
   https://mofu-dev.com/en/blog/stable-fluids/
5. Thalles Lopes / Codrops, **"Creating Stylized Water Effects with React Three Fiber"** — **2025-03-04**.
   The smoothstep-band-on-a-coordinate pattern (the scripted-impulse-warp / advancing-front basis),
   Leva-driven uniforms, mobile perf framing. https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/
6. Maxime Heckel, **"Field Guide to TSL and WebGPU"** — blog.maximeheckel.com, **2025-10-14**. A single TSL
   compute shader replacing the whole FBO ping-pong for GPGPU state (the WebGPU port path for the field +
   sparks); TSL targets WebGL2 *and* WebGPU from one source. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. matsuoka-601 / Codrops, **"WebGPU Fluid Simulations: High Performance & Real-Time Rendering"** —
   **2025-02-26**. The state-of-the-art real-time fluid landscape (MLS-MPM vs SPH vs FLIP vs grid), why a
   grid/2D solver is the cheap mobile-correct path and full particle sims are the desktop stunt.
   https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/
8. arshtechpro, **"WWDC 2025 — WebGPU on Apple Platforms"** — dev.to, **2025**. WebGPU shipping on Safari 26
   / iOS 26, compute-shader support, the WebGL-still-the-floor-on-iPhone reality that gates the live solver
   to a WebGL2 path. https://dev.to/arshtechpro/wwdc-2025-webgpu-on-apple-platforms-16pa
9. Utsubo, **"What's New in Three.js (2026)"** / **"Migrate Three.js to WebGPU (2026)"** — **2026-01**. r171+
   `WebGPURenderer` zero-config + automatic WebGL2 fallback (the documented less-tested branch), compute
   10–100× particle gains — the forward path, not the judge floor. https://www.utsubo.com/blog/threejs-2026-what-changed
10. Pavel Dobryakov, **WebGL-Fluid-Simulation** (canonical Stam ping-pong reference, re-surfaced across 2025
    write-ups incl. runcell.dev / marvyn.com / joshualown.org 2025-08): the **clamp-timestep-to-16ms** and
    HalfFloat-target stability practices the dt-clamp section codifies. https://paveldogreat.github.io/WebGL-Fluid-Simulation/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **The baked canned-slosh flowmap pipeline (2.D).** Capture 32–48 frames of the offline 2D solver to a
   compact RG sprite-sheet/texture-array, the playback shader (frame-blend + loop-out fade), KTX2 sizing, and
   the live-vs-baked A/B harness — the safety net that *guarantees* the beat ships on `high`.
2. **The shared 2D heat-velocity field as a persistent world service** (vs the short-lived beat-only field).
   Sizing, Jacobi-vs-quality curve, and the exact `useFBO` wiring for a *continuous* low-amplitude field that
   feeds sparks + haze + vein flicker across *every* chamber at a fraction of the beat's amplitude — does a
   tiny always-on 64² field beat the per-beat spin-up?
3. **TSL/WebGPU compute port of the solver + spark advection.** Port the five passes to `three-fluid-fx/tsl`
   / Heckel `Fn()` compute, quantify the iPhone-15 (iOS 26) win, and resolve the single-canvas
   renderer-coexistence question — keeping a byte-identical WebGL2 fallback for the judge.
4. **The impulse-shape language of the slosh.** Art-direction of the altar impulse (single splat vs
   ring-vortex vs directional jet), how it reads as *sacred and inevitable* rather than chaotic, and the
   exact `forge.altarImpact` timeline keyframing against the camera/pour choreography (cohesion-map §8 step
   14).
