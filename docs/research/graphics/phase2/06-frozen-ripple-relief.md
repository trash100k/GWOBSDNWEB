# 06 — Frozen-Ripple Normal & Micro-Relief on Solidified Metal

_Phase 2 deep-dive · cluster **A-temperature-core** · GAELWORX forge world · target: iPhone 15 OLED,
one WebGL renderer (r3f + three.js)_

> **Owns the spatial micro-relief half of the solidification beat.** Phase-1 doc 03 (§2.4) named the trick
> — _"at the moment a fragment solidifies, freeze its warp coordinates by sampling the warp at `t = poured`
> instead of `t = now`"_ — and Phase-2 doc 02 (§4.4 step 7) wired the one `mix()` branch that swaps
> `uTime → poured` for the warp _phase_. Both stopped at perturbing the existing slab normal with a scalar
> bump. This document authors the **full frozen-relief field**: how the locked domain-warp phase becomes a
> proper tangent-space **normal + height**, how the grain **aligns to the cooling-front direction**
> (columnar-grain vocabulary, doc 02 §2.5), how an optional **clearcoat-roughness modulation** makes the
> crust read as physically forged scale under the cool key — and the single `mix()` molten-vs-frozen branch
> that ties it all to the master temperature signal. It is the answer to "why does the solid metal read as
> _forged relief_, not flat painted texture?"

---

## 1. SCOPE

When the GAELWORX pour fills a Cinzel glyph and the cooling front sweeps behind it, the metal does not just
change _colour_ — it changes _shape_. Real cast and forged metal keeps a permanent record of how it moved at
the instant it stopped being liquid: the last ripples of the churning surface freeze into low **micro-relief**,
the tension skin wrinkles, and as the crust scales over it cracks along the flow. Under the GAELWORX lighting
model — _the metal is the only light_, plus a single cool specular key from the procedural env (cohesion map
§5.3) — that relief is what separates "a glowing painted plane" from "a forged ingot." A flat normal makes the
cooled iron-black body read as a sticker; a correctly **frozen, front-aligned, clearcoat-modulated** relief
makes the cool key _rake_ across the surface and reveal the forge marks. This is the difference the studio
references (Lusion, Unseen, Active Theory) trade on: the surface answers the light.

This doc owns exactly four things, and nothing else:

1. **The frozen-relief height field** — a scalar `h(uv)` derived from the _phase-locked_ domain warp (sampled
   at `poured = uTime − age`, not `uTime`), so the relief that exists at the instant of solidification becomes
   permanent surface shape. Molten regions keep evolving on `uTime`; one `mix()` branch.
2. **The normal from that height** — converting `h` into a perturbed surface normal cheaply (screen-space
   `dFdx/dFdy` for the hero; analytic gradient where the warp is closed-form), in the slab's exact `NORMAL`
   injection slot, so the cool key lights the relief.
3. **The cooling-front-aligned anisotropy** — biasing the relief frequency/stretch _along_ the cooling-front
   direction (the gradient of `age`), so the grain looks _drawn out_ in the direction heat left, the way
   columnar grains grow. Optionally driving `MeshPhysicalMaterial.anisotropy` for a brushed-metal specular.
4. **The clearcoat-roughness modulation** — letting the crust mask roughen the clear coat (matte scale) while
   the un-cracked metal stays glossier, and the ember-vein cracks read as sharp specular seams — the
   "physically forged" finish, gated to `high`.

It does **not** own the colour ramp (`gw_tempColor`/`gw_forge`, doc 01), the cooling _curve_ (`gwCool`,
doc 02), the molten _surface flow_ (doc 04), or the divine-fire exception's colour (doc 02 §4.4). It consumes
all of them: relief strength fades to zero on the still-molten lip (no relief while liquid), is suppressed to
near-flat polished on the eternal A/E (divine metal is _wet_, never crusted), and shares `gw_warp`/`gw_fbm`
at the world's `GW_FBM_OCTAVES`. If this field forks its own noise or its own clock, the metal inside a letter
stops being the same substance as the slab vein beside it — the one failure the cohesion map guards against.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

Six credible ways to turn a phase-locked procedural field into believable solidified relief. They differ on
fidelity, ALU/fill cost, how cleanly they ride the WebGL2 `onBeforeCompile` grammar the repo standardized on,
and mobile safety.

### 2.1 Screen-space derivative bump from a procedural height (`dFdx/dFdy`) — the spine, recommended

Evaluate a scalar height `h(uv)` in the fragment, then perturb the geometric normal by its screen-space
gradient: `normal = normalize(normal − (dFdx(h), dFdy(h), 0) · strength)`. This is **exactly the slab's
existing `NORMAL` block** (`ObsidianSlab.jsx` lines 49–54 already do `vec3 gwBmp = vec3(dFdx(...), dFdy(...),
0.0); normal = normalize(normal − gwBmp · uBump)`), so it is zero new machinery. The 2025 community consensus
(Inigo Quilez's _derivatives_ article, the long-running three.js "procedural normal map" forum thread, and the
Mikkelsen-derivative lineage the three.js issue tracker references) is that this is the canonical way to get a
normal from any in-shader height with no extra texture, no second pass, and no tangent attribute.

- **Quality:** very good for low-frequency relief (ripples, wrinkles, crust swell). The known weakness —
  `dFdx/dFdy` are _per-2×2-quad_ finite differences, so very high-frequency `h` aliases into blocky
  derivatives — is exactly why the relief must stay **low-frequency** (the forge marks are broad, not a sharp
  micro-texture) and why a Toksvig-style roughness lift (§2.6) pairs with it.
- **Perf:** trivial. A few extra `gw_fbm` taps + two derivatives. No render target, no tangents.
- **Mobile:** green. `OES_standard_derivatives` is core in WebGL2 (the repo's renderer).
- **Complexity:** low — it _is_ the existing grammar.

### 2.2 Analytic-gradient normal from the warp (closed-form derivative)

Where the height is `h = fbm(warp(uv))` and the warp is built from the same simplex `gw_snoise` (which has
cheap analytic gradients), compute the true 2-D gradient `∂h/∂uv` analytically rather than via screen-space
differences. IQ's 2025 _derivative_ write-up and the arXiv 2025 _Vertex Shader Domain Warping with Automatic
Differentiation_ paper both formalize carrying the gradient through a domain warp (chain rule:
`∇h = J_warpᵀ · ∇fbm`). The payoff is a normal that is _resolution-independent_ and does not block up under
the OLED at grazing angles or when the camera dollies in.

- **Quality:** the best — crisp, stable, no quad-aliasing. The right call for the close-oblique altar/contact
  chambers where the camera rakes the surface.
- **Perf:** moderate — you evaluate the noise gradient (3 extra snoise-ish taps for a 3-octave fbm) and the
  warp Jacobian. ~1.5–2× the cost of the bump field alone.
- **Mobile:** acceptable on `high`, borderline on `low`. Gate it.
- **Complexity:** medium — must carry the analytic gradient through `gw_warp`'s two levels; easy to get the
  chain rule subtly wrong (a deep-dive candidate, §9.1).

### 2.3 Baked relief into a normal/height texture, sampled by `age`

Pre-bake a tiling forge-relief normal map (or a height + derived normal) and blend its strength by `age`. The
2025 PBR-texture workflows (sbcode, the Codrops "displaced sphere" custom-material lineage) all lean on this.

- **Quality:** high _if_ the bake matches the live warp — but it almost never does, because the live frozen
  ripple is a function of _this fragment's_ poured-time phase. A static tile reads as repeating wallpaper on a
  surface whose flow was unique. **Fights cohesion**: the relief would no longer be "the same noise the slab
  uses, frozen."
- **Perf:** one texture fetch (cheap) but a texture binding + memory + a UV-tiling decision.
- **Mobile:** good, but the tiling seams and the loss of the per-fragment freeze are disqualifying for the
  hero. Reserve as a `static`-tier fallback only.
- **Complexity:** low to author, high to make _not look tiled_.

### 2.4 TSL `bumpMap`/`normalMap` node fed by a procedural height (r184/r185, WebGPU path)

three.js r184 (2025) / r185 (2026-06-25) make TSL first-class; a node graph can feed `material.normalNode` or
a procedural bump. **Caveat (load-bearing for this doc):** as of the open three.js issue #31804
(_"bumpMap node for procedural textures in TSL"_, 2025) there is **no first-class `bumpNode` that takes a
procedural height** — you still hand-roll the derivative in nodes (`dFdx`/`dFdy` exist as TSL `dFdx()`), or
feed `normalMap()` a computed node. So the TSL path is _the same math_, expressed as nodes, on a renderer
(`WebGPURenderer`) whose iOS/Safari WebGL2-fallback branch is the documented 2026 risk surface (cohesion map
§10) and whose post-chain the repo does not yet run.

- **Quality:** identical to 2.1/2.2; auto-ports to WGSL.
- **Perf:** equal on WebGL2, faster on WebGPU where available.
- **Mobile:** the WebGPU bet on the judge device is the documented mistake. **Verdict: author the GLSL so the
  derivative-bump ports to a TSL `Fn()` 1:1, ship GLSL today.**
- **Complexity:** high (pipeline), low (the function).

### 2.5 Real vertex displacement (geometry relief)

Displace the letterform mesh along its normal by `h` in the vertex shader, recompute the normal from
neighbouring displaced positions. True silhouette relief.

- **Quality:** the most physical (the edge of the glyph actually deforms) — but the GAELWORX relief is
  _micro_-relief (sub-millimetre forge marks), invisible at the silhouette and far below the Cinzel mesh
  tessellation. Displacing would demand a dense subdivision the mobile budget cannot pay, and recomputing
  vertex normals needs neighbour samples or a derivative trick anyway.
- **Perf:** expensive (tessellation + per-vertex noise). **Out** for the hero; the bump fakes it for free.
- **Complexity:** high.

### 2.6 Roughness/clearcoat modulation as relief's lighting partner (Toksvig / NDF-variance)

Not a normal technique but the _finishing_ one: the relief reads only if the **specular response** changes
across it. Two moves, both 2025-relevant: (a) **clearcoat-roughness modulation** — the crust mask roughens the
clear coat so cracked scale is matte and un-cracked metal is glossy (three.js shipped `clearcoatNormalMap`/
`clearcoatRoughnessMap`/`clearcoatNormalScale`, PR #17079 / #18798, now standard in `MeshPhysicalMaterial`);
(b) **Toksvig-style roughness lift** — where the bump's high-frequency variance would alias the specular, _add_
that variance to roughness so the highlight broadens instead of sparkling. The SIGGRAPH 2025 _Position-Normal
Manifold for Efficient Glint Rendering on High-Resolution Normal Maps_ paper and the long NDF-filtering
lineage (Toksvig; NVIDIA NDF-filtering) confirm: convert sub-pixel normal variance into roughness, don't fight
it. On a mobile fragment we approximate this with a cheap `roughness += k · |∇h|`.

- **Quality:** this is what makes it "forged," not "embossed." The crust goes matte, the seams stay sharp.
- **Perf:** near-free (a couple of multiplies on `roughnessFactor`/`clearcoatRoughness`).
- **Mobile:** green; the clearcoat path is already on the slab material.
- **Complexity:** low.

**Landscape verdict:** the hero is **2.1 (screen-space derivative bump from the phase-locked height)** — it is
the slab's existing grammar, costs almost nothing, and is the same noise the world already shares — **paired
with 2.6 (clearcoat-roughness modulation + Toksvig lift)** so the relief actually answers the light. **2.2
(analytic gradient)** is a `high`-tier upgrade for the close-raking altar/contact chambers. 2.3 is a
`static`-tier fallback, 2.4 the post-judge TSL port, 2.5 out. This matches the cohesion-map mandate: one noise
basis, one clock, no FBO on the hero.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Ship a single fragment block that builds a phase-locked height `gwFrozenH(uv)` from `gw_warp` sampled at
`poured`, perturbs the normal via `dFdx/dFdy` in the slab's `NORMAL` slot, fades relief strength by a
`frozen` mask (`1 − molten`, so liquid is glassy and solid is forged), aligns the relief anisotropy to the
cooling-front gradient, and modulates clearcoat-roughness by the crust crack mask — all gated to `high`, with
a uniform-roughness `low` and a flat `static`.** Concretely:

1. **One `mix()` molten-vs-frozen branch for the phase.** This is the keystone the whole effect rests on, and
   it is _already half-built_ in doc 02 §4.4 step 7. The warp phase is `phase = mix(poured, uTime, molten)`
   where `molten = smoothstep(0.55, 0.92, temp)`. Hot metal churns (phase tracks `uTime`); solid metal locks
   (phase frozen at `poured = uTime − age`). The **relief amount** rides the inverse: `frozen = 1 − molten`,
   so there is _no_ bump while liquid (a liquid surface is smooth/specular) and full relief once solid. One
   branch, one material, continuous — no seam, no `if`.

2. **The height is the same warp the slab/molten use, read for relief instead of colour.** `gwFrozenH =
   gw_fbm(warp · reliefScale)` where `warp` is the phase-locked `gw_warp` output. Because it is the world's
   shared noise at `GW_FBM_OCTAVES`, the forge marks in a letter share spatial frequency with the slab veins
   and the channel flow — they are visibly the same metal, frozen.

3. **Normal via `dFdx/dFdy`, in the existing `NORMAL` slot.** Reuse the slab's exact line. The relief is
   deliberately **low-frequency** (broad ripples, `reliefScale ≈ 2.5–4`) so the quad-derivative does not
   alias, and the cool key rakes across it.

4. **Cooling-front-aligned anisotropy.** The cooling front moves along `−∇age` (heat leaves toward the un-poured
   side). Stretch the relief UV _along_ that direction before sampling (`uv' = uv + dir · (uv·dir) · stretch`),
   so ripples elongate the way columnar grains grow — the doc 02 §2.5 vocabulary made visible. On `high`,
   optionally drive `material.anisotropy` + `anisotropyRotation` from the same `dir` for a brushed-metal
   specular streak.

5. **Clearcoat-roughness modulation + Toksvig lift.** The crust crack mask (the same ridged fbm doc 02 §4.4
   step 8 uses for ember veins) roughens the clear coat where scale has formed; un-cracked metal stays glossy;
   `roughness += kTok · |∇h|` so the broad relief broadens the highlight instead of sparkling. Gated `high`.

6. **A/E stay wet, never crusted.** The eternal divine letters suppress relief and crust to ~0 (`frozen`
   forced low via `uIsAE`): divine metal is perpetually molten white-gold, glassy and bright, never a forged
   matte scale. Same keystone branch as everywhere — the A/E never enter the cooling path.

This is the right pick because it is **buildable in this codebase tonight** (it is literally the slab's
`NORMAL` block + the doc-02 phase mix + the slab's clearcoat), **mobile-free on the hero** (no FBO, no
tangents, no extra pass — derivatives are core WebGL2), **shares the master noise/temperature/clock** so the
relief is the same substance frozen, and keeps a clean TSL port (the height is a pure function of `uv`,
`poured`, and `dir`).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- `three` r17x line (repo's pinned `WebGLRenderer`; **do not** switch to `WebGPURenderer` for this — the
  derivative bump is core WebGL2 and the post chain is WebGL). The clearcoat-roughness path uses
  `MeshPhysicalMaterial.clearcoatRoughness` / `clearcoatRoughnessMap` / `clearcoatNormalScale`, standard since
  the clearcoat-map PRs (#17079, #18798) and present on the slab material today.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` — unchanged.
- Reuse `GLSL_NOISE` (`gw_fbm`, `gw_snoise`) from `src/scene/shaders.js`; the planned `gw_warp` (cohesion map
  §2); `gwCool`/`gw_forge`/`gw_divineFire` (docs 01/02); `PAL`/`v3`; `forge`/`damp` (`src/store.js`).
  **No new deps.**
- `leva` for `?debug` live tuning (existing).

### 4.2 The frozen-relief GLSL (new, beside `gw_warp` in `shaders.js` so every solid material imports it)

```glsl
// ───────────────────────────────────────────────────────────────────────────
// FROZEN-RIPPLE RELIEF — the spatial micro-relief authority for SOLID metal.
// Requires GLSL_NOISE (gw_fbm) and gw_warp injected first. Pure functions of
// (uv, phase, dir) — no uniform reads inside, so it inlines anywhere (cohesion).
// ───────────────────────────────────────────────────────────────────────────

// Anisotropic UV stretch ALONG the cooling-front direction `dir` (unit vec2).
// Elongates relief the way columnar grain grows (doc 02 §2.5). stretch 0 = isotropic.
vec2 gwGrainUV(vec2 uv, vec2 dir, float stretch){
  float a = dot(uv, dir);                 // projection onto the grain axis
  return uv + dir * a * stretch;          // pull samples out along the front
}

// The frozen height: domain-warped fbm at a LOCKED phase. molten regions pass
// uTime in `phase`; solid regions pass `poured` (= uTime - age) so the ripple
// that existed at solidification is permanent. reliefScale stays LOW so the
// dFdx/dFdy derivative does not alias (broad forge marks, not micro-grain).
float gwFrozenH(vec2 uv, float phase, vec2 dir, float reliefScale, float grain){
  vec2 guv  = gwGrainUV(uv, dir, grain);
  vec2 warp = gw_warp(guv * reliefScale + phase * 0.25);   // shared 2-level warp
  float h   = gw_fbm(guv * reliefScale + warp);            // primary swell
  h += 0.45 * gw_fbm(guv * (reliefScale * 2.3) + warp * 1.4 + 17.0); // fine wrinkle
  return h;
}
```

### 4.3 The relief block (injected like the slab's `NORMAL`, after `<normal_fragment_maps>`)

```glsl
// ── HEAD additions (per-glyph instanced where noted) ──
uniform float uTime, uVeinFloor, uReliefStrength, uReliefScale, uGrain, uTokLift;
uniform float uIsAE;                 // per-glyph divine flag (0/1)
// inputs assumed already computed in the COLOR/age pass (doc 02 §4.4):
//   float age;        // seconds since the front passed this fragment
//   float temp;       // gwCool(age,k) → 0.08..1.0
//   float molten;     // smoothstep(0.55, 0.92, temp)  ~1 hot, ~0 cold
//   float crack;      // ridged fbm vein/crack mask (doc 02 step 8)

// 1) PHASE LOCK — the one mix() branch. Hot → live churn; cold → frozen relief.
float poured = uTime - age;
float phase  = mix(poured, uTime, molten);     // doc 02 §4.4 step 7, reused

// 2) COOLING-FRONT DIRECTION — heat leaves toward the un-poured side.
//    age grows left→right behind the front, so the front normal ≈ -∇age.
//    Cheap proxy from the fill coordinate's screen-space gradient:
vec2 ageGrad = vec2(dFdx(age), dFdy(age));
vec2 dir     = (length(ageGrad) > 1e-5) ? normalize(ageGrad) : vec2(1.0, 0.0);

// 3) HEIGHT + NORMAL. Relief only where SOLID (frozen = 1 - molten) and NOT A/E.
float frozen = (1.0 - molten) * (1.0 - uIsAE);   // wet liquid & divine A/E stay glassy
float h = gwFrozenH(vUv, phase, dir, uReliefScale, uGrain);
vec3  gradH = vec3(dFdx(h), dFdy(h), 0.0);
normal = normalize(normal - gradH * (uReliefStrength * frozen));

// 4) TOKSVIG ROUGHNESS LIFT — broaden the highlight where relief is steep so the
//    cool key does not sparkle/alias on the OLED (SIGGRAPH-2025 NDF-variance idea).
float slope = length(gradH);
roughnessFactor += uTokLift * slope * frozen;     // built-in std-material symbol

// 5) CLEARCOAT-ROUGHNESS MODULATION (high tier; symbol present on physical mat).
//    Cracked scale → matte coat; un-cracked metal → glossy; seams stay sharp.
float scale = smoothstep(0.35, 0.75, 1.0 - temp);          // crust coverage by cooling
float coatR = mix(0.06, 0.55, scale * frozen) * (1.0 - crack * 0.7);
material.clearcoatRoughness = coatR;   // (TSL/GLSL: assign the clearcoat rough symbol)
```

> **Injection-point note.** `roughnessFactor` and the clearcoat roughness live _after_
> `<roughnessmap_fragment>` / `<clearcoat_normal_fragment_begin>` in the standard fragment. Inject the relief
> block right after `<normal_fragment_maps>` for the normal perturb, and the roughness lines just before
> `<lights_fragment_begin>` so they land on the symbols the lighting reads. In practice the cleanest split is
> two small injections (normal in the `NORMAL` slot, roughness in a new `ROUGH` slot) mirroring the slab's
> `HEAD`/`NORMAL`/`COLOR` triplet. Verify the chunk names against the pinned three version (they are stable on
> r17x but confirm in CI).

### 4.4 The r3f component shape (extends doc 02's `PourWordmark.jsx`; same pattern for channel metal)

```jsx
const uniforms = useMemo(() => ({
  uTime:           { value: 0 },
  uReliefStrength: { value: 0.35 },   // normal-perturb amount (0 = flat)
  uReliefScale:    { value: 3.0 },    // LOW freq → broad forge marks, no alias
  uGrain:          { value: 0.6 },    // front-aligned anisotropic stretch
  uTokLift:        { value: 0.18 },   // roughness broadening from relief slope
  // per-glyph uIsAE set via setUniformAt (doc 02 §4.3)
}), [])

// material = MeshPhysicalMaterial (clearcoat:1, clearcoatRoughness:0.06 base) +
// onBeforeCompile injecting GLSL_NOISE + gw_warp + GW_TEMPERATURE + frozen-relief.
useFrame((state, dt) => {
  const u = ref.current.material.uniforms
  u.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  // relief & lift are tier-gated, damped (never lerp(a,b,k)):
  const tier = forge.quality
  const tgtStrength = tier === 'high' ? 0.35 : tier === 'low' ? 0.22 : 0.0
  u.uReliefStrength.value = damp(u.uReliefStrength.value, tgtStrength, 3, dt)
  // anisotropy specular streak (high only) — same `dir` family the shader uses
  if (tier === 'high') ref.current.material.anisotropy = 0.4
})
useEffect(() => () => material.dispose(), [material])  // non-negotiable disposal
```

### 4.5 Key uniforms & parameters

| Uniform | Meaning | Default | Range | Scope |
|---|---|---|---|---|
| `uReliefStrength` | normal-perturb amount (high 0.35 / low 0.22 / static 0) | 0.35 | 0–0.8 | global, tier-damped |
| `uReliefScale` | relief frequency — keep LOW to avoid quad-aliasing | 3.0 | 1.5–5 | global |
| `uGrain` | front-aligned anisotropic UV stretch (columnar grain) | 0.6 | 0–1.5 | global |
| `uTokLift` | roughness broadening per unit relief slope (Toksvig) | 0.18 | 0–0.4 | global |
| `material.clearcoatRoughness` | crust matte vs glossy metal (high tier) | 0.06 base | 0.06–0.55 | per-fragment |
| `material.anisotropy` | brushed-metal specular streak (high tier) | 0.4 | 0–0.7 | material |
| `uIsAE` | divine flag — forces `frozen=0` (A/E stay wet/glassy) | 0 / 1 | 0 or 1 | per-glyph |

**The three knobs that matter most:** `uReliefScale` (too high → the `dFdx/dFdy` derivative blocks up into
visible quads on the OLED; keep it low and let `uReliefStrength` carry the read), `uTokLift` (the antidote to
the residual sparkle — tune it _through the bloom_ on-device, because a sparkling specular under threshold
bloom strobes), and the `frozen` gate's `molten` thresholds (too narrow → a hard seam where liquid becomes
solid; the doc-02 `smoothstep(0.55, 0.92, temp)` band keeps the molten→frozen transition a glowing band, not a
line, and the relief fades in across the _same_ band).

### 4.6 Hook into the master temperature system

- **One clock.** `phase` is derived from `poured = uTime − age`; `uTime` is the world clock (frozen to `2` on
  `static`), `age` comes from the shared `uPourFront` minus per-glyph layout-U (doc 02 §4.3). No second rAF, no
  private clock. The relief freezes on the _same_ heartbeat the colour cools.
- **One noise.** `gwFrozenH` calls `gw_warp` + `gw_fbm` at the world's `GW_FBM_OCTAVES`. A strike pulse that
  surges `uHeat` re-melts a band (lifts `temp` → `molten`), and the relief in that band momentarily _unfreezes_
  and re-evaluates on `uTime` — the surface remembers, then re-flows, then re-freezes. Cohesion proof: the
  relief, the colour, and the bloom move in the same frame.
- **One temperature.** `frozen = (1 − molten)` reads `temp = gwCool(age,k)` from the temporal authority. The
  relief is literally a function of how cool the metal is. The crust coverage (`scale`) and the clearcoat
  roughness both key off `temp`, so the matte-ness of the surface and its colour are one signal.
- **The single `temp`/`dir` scalars** should be the same ones written to the planned varying/MRT (doc 02 §9.2)
  so sparks, heat-haze, and basalt heat-stain read the identical field rather than recomputing.

---

## 5. COHESION

- **Temperature.** Relief amount = `1 − molten`, where `molten = smoothstep(0.55, 0.92, gwCool(age,k))` — the
  exact temporal authority every other consumer reads. A cooling letter's forge marks appear at the same
  `temp` a cooling slab vein crusts. Nothing invents its own "is it solid yet."
- **Noise.** `gwFrozenH` is `gw_warp` + `gw_fbm` at the shared `GW_FBM_OCTAVES` — the relief in a glyph has the
  same grain as the slab and the channels. "More detail" = one more octave on `gw_fbm`, never a second noise
  (cohesion rule §2). The animation _boils in place_ via the phase, never scrolls.
- **Palette / bloom.** The relief block touches **only the normal and roughness** — never colour. It cannot
  leak HDR or break the "only the hot band blooms" contract (the colour is still `gw_forge(temp)`). It changes
  how the _existing_ cool key and emissive read off the surface, which is precisely the point: the relief is
  visible because the metal _is_ the only light plus one cool specular key (cohesion §5).
- **Lighting.** The cool procedural-env key (PMREM, no EXR, §5.3) rakes the relief; the clearcoat-roughness
  modulation decides where that key is a sharp streak (glossy un-cracked metal) vs a broad sheen (matte scale).
  Cooling _is_ the transition from a wet specular liquid to a matte forged solid — expressed as relief +
  roughness, not just colour.
- **The A/E keystone.** `frozen = (1 − molten) · (1 − uIsAE)` — the divine letters force relief and crust to
  zero, so they stay perpetually wet glassy white-gold, never a forged matte scale. Same first-A + first-E
  build-time data as the DOM `.forge-letter`, never a shader string match. The divine metal is the one surface
  that never freezes — visually _and_ in shape.
- **Frozen vs live, one branch.** `phase = mix(poured, uTime, molten)` is the identical `mix()` doc 02 §4.4
  step 7 already authored — this doc just _consumes_ its output for relief too. One branch, one material,
  continuous, no `if`.
- **Motion law.** The freezing relief is **Forge Reveal** (the surface sharpens from glassy to forged as the
  cooling band passes — a blur-to-sharp in _shape_) honouring **Brutalist Snap** (dt-damped strength, no
  bounce). The frozen relief then holds dead-still (Atmospheric Drift's "constant velocity" → here, zero).

---

## 6. MOBILE & PERFORMANCE

iPhone 15 OLED, one renderer, `high | low | static` tiers (`useQuality`). The wordmark/channel metal covers a
fraction of screen; the relief is per _solid_ filled pixel only (the `frozen` gate zeroes the work on liquid
and on the A/E), so the marginal cost is bounded.

- **Cost on `high`:** `gwFrozenH` ≈ 2 `gw_warp` + ~5 `gw_fbm` taps (the height + fine wrinkle), 4 `dFdx/dFdy`
  (one pair for `h`, one for `age`→`dir`), plus 2–3 multiplies for roughness/clearcoat. Comfortably inside the
  ~3.5–4.5 ms slab envelope (cohesion §10) because it runs on a small fraction of screen, not the full void
  slab. Bloom catches only the still-hot lip + A/E → relief adds zero bloom cost.
- **`low`:** drop `gwFrozenH`'s fine-wrinkle octave (height = single warped fbm), drop the front-aligned
  `gwGrainUV` stretch (isotropic relief, `uGrain = 0`), keep the `dFdx/dFdy` normal at lower
  `uReliefStrength = 0.22`, **drop the clearcoat-roughness modulation** (uniform `clearcoatRoughness`), keep
  the Toksvig lift (it is near-free and prevents sparkle). `GW_FBM_OCTAVES` 3 → world-uniform thinning.
- **`static` (reduced-motion / weak GPU / no-WebGL):** `uReliefStrength = 0`, `uTime = 2`, `uPourFront = 1` —
  every glyph fully cooled, _flat-normal_ iron-black with lit A/E. The relief is enhancement; the colour ramp
  and divine A/E carry the brand with zero animation and zero relief cost. (Optional: a single baked, faint
  relief normal map, technique 2.3, if a static frame needs a hint of forge texture — black-point forced, no
  tiling visible at poster scale.)
- **Aliasing is the perf-coupled risk.** A too-high `uReliefScale` does not just look bad — the `dFdx/dFdy`
  quad-derivative under threshold bloom _strobes_ on scroll, which reads as a frame-rate bug. Keep relief
  low-frequency + Toksvig-lift the roughness; this is a budget decision, not just an art one.
- **No FBO, no tangents.** Derivatives are core WebGL2; anisotropy uses the material symbol, not a tangent
  attribute we must compute. Zero render targets — the hero constraint holds.
- **Dispose.** `useEffect(() => () => material.dispose(), [material])` — non-negotiable.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (do not reorder):**

1. **Height in isolation, visualised as greyscale.** Output `gwFrozenH(vUv, uTime, vec2(1,0), scale, 0)` to
   `gl_FragColor.rgb` directly and tune `uReliefScale` until the forge marks read as broad ripples, _not_
   high-frequency grain. **This is the alias gate** — if you can see the marks here, the derivative will be
   clean. Do this on the device, through the tone-mapper, not headless.
2. **Then the normal perturb.** Wire the `dFdx/dFdy` block into the `NORMAL` slot with a flat lit material and
   the cool key only (no emissive yet). Confirm the cool key _rakes_ the relief — tilt the camera and watch
   the highlight travel. If the surface still looks flat, raise `uReliefStrength`; if it blocks into quads,
   _lower `uReliefScale`_ (not strength).
3. **Then the phase lock + frozen gate.** Wire `molten`/`frozen` and scroll the pour across: the liquid lip
   must be glassy/specular (no relief), the metal behind the front must crust into relief _across the same
   smoothstep band_ the colour cools through. Verify there is **no seam** — relief and colour share the band.
4. **Then the A/E gate — early.** Force `uIsAE = 1` on the first A + first E and confirm they stay wet/glassy
   white-gold while neighbours forge into matte scale. Catch the gate bug before roughness hides it.
5. **Then the cooling-front anisotropy**, then **clearcoat-roughness + Toksvig**, each behind a leva toggle.

**Pitfalls (each has bitten this class of effect):**

- **High-frequency relief → quad-aliasing.** `dFdx/dFdy` are 2×2-quad finite differences; a fine `h` produces
  blocky, crawling derivatives. Keep `uReliefScale` low and lean on `uReliefStrength`. (IQ's derivative
  article; the three.js "smooth derivative normals" issue lineage.)
- **Relief that still moves when solid.** Forgetting the `uTime → poured` phase swap (or gating relief by the
  wrong sign) makes "frozen" metal shimmer — instantly fake. The `mix(poured, uTime, molten)` branch is the
  fix; verify by freezing and watching: solid relief must be _dead still_.
- **Relief on the liquid lip.** If `frozen` doesn't fade to 0 on the molten band, the wet metal looks
  pre-textured. Gate by `1 − molten` and confirm the lip is glassy.
- **Crusted A/E.** If `uIsAE` doesn't zero `frozen`, the divine letters develop forge scale and read as cooled
  — a brand violation. Gate at the source (`frozen *= (1 − uIsAE)`), not just the colour.
- **Specular sparkle/strobe under bloom.** Steep relief without the Toksvig roughness lift sparkles, and
  threshold bloom turns sparkle into strobing. Always pair the bump with `roughnessFactor += uTokLift·slope`.
- **Clearcoat fighting the base normal.** three.js historically applied the base normal map to the clearcoat
  (issues #12867); if the coat looks wrong, set/clear `clearcoatNormalScale` deliberately and confirm the coat
  reads the relief you intend (or a flat coat) — don't leave it implicit.
- **Frame-rate-dependent strength.** Damp `uReliefStrength` with `damp(...,λ,dt)`, never `lerp(a,b,k)`, so a
  tier change tempers smoothly and is device-independent.
- **GLSL namespace collisions.** Prefix every helper `gw_`/`gw…` so they don't clash with three's
  `permute`/`snoise`/`normal`.
- **Verify path:** `npm run build` green → `qa-route` @ 393×852 + 1440×900 with 0 console errors (CI
  SwiftShader compiles GLSL → a typo or bad chunk name surfaces as an error) → **then** the iPhone 15 read
  (the raking key, the no-strobe specular, the wet A/E vs matte forged body do **not** simulate headless).
  Live-tune via `?debug`.

---

## 8. SOURCES (2025–2026)

1. Inigo Quilez — **Derivatives, bumpmapping and a touch of analytic** (the canonical method for normals from
   a procedural height: `dFdx/dFdy` screen-space gradient vs analytic warp gradient; the chain rule through a
   domain warp; the quad-aliasing caveat). Reference kept current through 2025 (cited in 2025 three.js forum/
   issue threads as the procedural-normal authority). https://iquilezles.org/articles/derivative/
2. mrdoob/three.js — **Issue #31804, "bumpMap node for procedural textures in TSL"** (2025 — confirms TSL has
   no first-class procedural `bumpNode` yet, so the derivative-bump is hand-rolled even on the WebGPU path;
   justifies shipping GLSL and porting later). https://github.com/mrdoob/three.js/issues/31804
3. mrdoob/three.js — **PR #17079 "Added clear coat normal maps"** + **PR #18798 "Document new clearcoat
   textures"** (the `clearcoatNormalMap` / `clearcoatRoughnessMap` / `clearcoatNormalScale` API the
   relief uses to make crust matte and metal glossy; now standard in `MeshPhysicalMaterial`). Referenced in the
   current (2025) three.js MeshPhysicalMaterial docs. https://github.com/mrdoob/three.js/pull/17079 ·
   https://github.com/mrdoob/three.js/pull/18798 · https://threejs.org/docs/pages/MeshPhysicalMaterial.html
4. SIGGRAPH 2025 — **Position-Normal Manifold for Efficient Glint Rendering on High-Resolution Normal Maps**
   (Conference Papers; arXiv 2505.08985, May 2025). Converting sub-pixel normal variance to a roughness/NDF
   term — the Toksvig-lineage justification for the `roughness += k·|∇h|` anti-sparkle lift.
   https://dl.acm.org/doi/10.1145/3721238.3730633 · https://arxiv.org/pdf/2505.08985
5. arXiv — **Vertex Shader Domain Warping with Automatic Differentiation** (2405.07124; carrying analytic
   gradients through a domain warp — the basis for the §2.2 analytic-normal upgrade, chain rule
   `∇h = J_warpᵀ·∇fbm`). https://arxiv.org/pdf/2405.07124
6. Maxime Heckel — **Field Guide to TSL and WebGPU** (Oct 14, 2025). Domain-warp fbm, derivative-as-distortion,
   compute-driven state textures, and `Fn()` as the reuse/port primitive — the TSL-portability target for
   `gwFrozenH`. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. Codrops — **Interactive Text Destruction with Three.js, WebGPU, and TSL** (Jul 22, 2025). Per-glyph,
   noise-driven per-letter surface effects in TSL — the per-letter authoring grammar the frozen relief rides
   (per-glyph `uIsAE`, per-glyph phase). https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/
8. Three.js Roadmap — **10 Noise Functions for Three.js TSL Shaders** (2025). fbm / ridged-noise recipes for
   the crust crack mask and the frozen-ripple height; confirms the shared-noise-basis approach.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
9. mrdoob/three.js — **Release r185** (2026-06-25) + **r184** (2025) — TSL `Fn`/`normalNode`/`emissiveNode`
   maturity; the port target. https://github.com/mrdoob/three.js/releases/tag/r185 ·
   https://github.com/mrdoob/three.js/releases/tag/r184
10. LearnWithHasan — **Three.js Shaders Guide — GLSL, ShaderMaterial & TSL (r184)** (2025–2026). Confirms the
    `onBeforeCompile` GLSL-injection vs node-material tradeoff for current WebGL2 builds — the grammar this doc
    ships in. https://learnwithhasan.com/threejs-guide/shaders/

---

## 9. DEEP-DIVE CANDIDATES (Phase 3)

1. **Analytic-gradient normal through `gw_warp` (the §2.2 upgrade).** Carry the closed-form noise gradient
   through the two-level domain warp (chain rule `∇h = J_warpᵀ·∇fbm`, the arXiv 2024–2025 auto-diff approach)
   for a resolution-independent, alias-free normal in the close-raking altar/contact chambers — and quantify
   its added ALU cost vs the `dFdx/dFdy` bump on the iPhone 15. Gate to `high`.
2. **True cooling-front anisotropy as a tangent-space normal + `material.anisotropy` coupling.** Replace the
   cheap `gwGrainUV` stretch with a real anisotropic relief whose tangent frame aligns to `−∇age`, driving
   both the normal and `anisotropyRotation` so the brushed-metal specular streak _is_ the grain direction —
   the columnar-grain vocabulary (doc 02 §2.5) fully realised. Needs `computeTangents()` and a cost study.
3. **Toksvig/NDF-variance roughness filtering tuned to the bloom threshold.** Derive the exact
   `roughness += f(|∇h|)` curve (SIGGRAPH-2025 position-normal-manifold / NDF-filtering math) that keeps the
   relief specular from strobing under the `mipmapBlur` threshold bloom on the OLED — the anti-aliasing layer
   the whole effect's mobile-safety depends on.
4. **Crust crack network as shared SDF with the basalt and channel carve.** Unify the frozen-relief crack mask
   (ridged fbm) with the basalt's serpentine veining and the carved-channel SDF so a crack leaving a cooled
   letter and a vein in the adjacent basalt are one continuous network — the "same fracture, two materials"
   cohesion payoff, and a `gw_worley`-based crack upgrade on `high`.
