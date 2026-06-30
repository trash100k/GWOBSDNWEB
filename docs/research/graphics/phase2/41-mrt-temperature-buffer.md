# 41 — SHARED TEMPERATURE BUFFER / MRT EXPORT

_GAELWORX forge-world graphics · Phase-2 deep-dive · cluster **G-architecture-perf**_

> **The single-source-of-truth heat field, made literal.** Topic 41 takes the master temperature
> system defined in `00-COHESION-MAP.md §1` and asks: instead of every downstream element
> *recomputing* `gw_forge(temp)` from `gw_warp`/`gw_fbm` independently, what if the hero pass wrote
> the per-fragment temperature `T` (and its derived emissive) **once** into a small Multiple-Render-
> Target (MRT) buffer, and the sparks, basalt glow, heat-haze, caustics, and god-rays *sampled* that
> exact field? That is the difference between "everyone agrees on the formula" (cohesion by
> convention) and "everyone reads the same pixel" (cohesion by construction). This doc studies whether
> that buffer is worth its bandwidth on an iPhone-15 OLED tile GPU, how to express it on WebGL2 today,
> and how it ports to the WebGPU/TSL path that lands natively in Safari 26.

---

## 1. SCOPE — this element in the GAELWORX world

The cohesion map (`§1`, `§7.1`) establishes one rule above all others: *every element reads the master
temperature, never invents heat.* Today that rule is enforced **by formula** — `gw_tempColor`,
`gw_tempEmissive`, `gw_forge`, `gwCool01`, `gw_divineFire` live in `src/scene/shaders.js`, and each hot
material inlines them via `onBeforeCompile`. A vein and a cooling letter look like the same metal
because they call the same function at the same `uTemp`.

But several **secondary** consumers don't actually have the molten material's inputs. The heat-haze
post pass needs to know "how hot is the air in front of *this* screen pixel" to decide warp strength.
The basalt needs "how much divine-fire and ember light is spilling onto *this* stone." The sparks need
"what's the temperature at the pour front I'm orbiting." The caustics need a heat mask. The god-rays
need the brightest-emissive cluster. Right now each of those **re-derives** a heat estimate from a
cheaper proxy (screen luminance, a uniform, a distance-to-front term) — and every time it re-derives,
it risks drifting from the metal's *actual* `T`. The haze warps where the metal *looks* bright in the
8-bit composite, not where it is *actually* hot in HDR. That drift is exactly the "private orange"
crack `§7` warns against, just dressed as a post-process.

**The MRT temperature buffer collapses that drift to zero.** The hero scene pass — the molten pour,
the cooling letterforms, the channel metal, the slab veins — writes, alongside its normal HDR color
to attachment 0, a second small attachment carrying the scalar field the whole world keys off:

- **`T`** — the canonical temperature `[0,1]` (post-cooling, post-`gwCool01`, post-skin), the *exact*
  value `§1` defines, not a luminance guess.
- **`E`** — `gw_tempEmissive(T)` (or just the HDR luminance), so bloom/god-rays/haze masks read the
  identical "does this bloom?" signal the palette convention (`§3.1`) encodes.
- **`AE`** — the divine-fire flag/intensity (`uIsAE` routed to a channel), so the basalt reveal and
  Ogham legibility (`§5.2`) sample the keystone exception directly instead of re-projecting letter
  positions.

This is the `G-architecture-perf` cluster's job: make the heat field a **buffer**, not a re-computation,
so single-source-of-truth is structural. The constraint is brutal — it must cost **under ~1 ms and
under one extra HalfFloat screen's worth of bandwidth** on the iPhone-15 tile GPU, or it loses to the
cheaper "everyone recomputes the formula" status quo. This doc determines exactly when the buffer wins.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 No buffer — shared formula, recomputed everywhere (the current baseline)

Every consumer inlines `gw_forge(temp)` and recomputes from `gw_warp`/`gw_fbm`. **Quality:** perfect
agreement *where the consumer has the same inputs*; drift where it doesn't (post passes work off the
composited 8-bit-ish luminance). **Perf:** zero extra targets, but every post pass that needs heat
re-evaluates fbm or guesses from luminance — wasted ALU. **Mobile:** the safe default; nothing extra to
allocate. **Complexity:** trivial. This is what ships for the judge unless §3 justifies more.

### 2.2 WebGL2 MRT — one extra HalfFloat attachment on the hero pass

The classic technique, fully supported on iOS Safari since WebGL2 shipped in Safari 15 (2021) and
confirmed pervasive across all major browsers ([Khronos, WebGL-2 pervasive-support blog]). The scene
renders to a `RenderTarget` with `count: 2` (or 3): attachment 0 = HDR color (`HalfFloatType`),
attachment 1 = the temperature/emissive field. The fragment shader writes
`layout(location=0) out vec4 color; layout(location=1) out vec4 heat;`. In three.js this is exposed
through the unified `RenderTarget`/`WebGLRenderTarget` `count` option (the modern replacement for the
deprecated `WebGLMultipleRenderTargets`), whose `.textures[]` array yields one sampler per attachment
([three.js RenderTarget docs, MRT support PR #16390]).

**The hard iOS constraint:** Apple devices expose `EXT_color_buffer_half_float` but **not**
`EXT_color_buffer_float` — iOS cannot render to FP32 color targets at all
([WebKit bug 216010; KhronosGroup/WebGL issue #3093]). So the temperature attachment **must** be
`HalfFloatType` (RG16F or RGBA16F), never `FloatType`. That is fine — `T ∈ [0,1]` and a flag fit
trivially in half precision — but a build that defaults the extra target to `FloatType` (as many
desktop tutorials do) will fail to render on the judge device. This is the #1 silent killer here.

**Quality:** exact field, no drift, full HDR `E`. **Perf:** one extra `RG16F` write per hero fragment
plus the bandwidth of resolving and later sampling that attachment. **Mobile:** viable but bandwidth-
sensitive on a tile-based deferred renderer (see §6). **Complexity:** moderate — `RawShaderMaterial`
or careful `onBeforeCompile` to add the second output; the slab's existing chunk-injection pattern
extends to it.

### 2.3 WebGL2 packed single-attachment (temperature into color's alpha or a spare channel)

Avoid a *second* attachment entirely by smuggling `T` into an unused channel of the existing HDR color
target — e.g. write emissive RGB to `.rgb`, temperature to `.a`. On a HalfFloat RGBA target the alpha
is already paid for. **Perf:** *zero* extra attachment, *zero* extra bandwidth beyond what color already
costs — the cheapest possible "buffer." **Quality:** you get one scalar (`T`); no room for both `E` and
`AE` unless you bit-pack two `[0,1]` values into one 16-bit channel (lossy, ~8 bits each). **Mobile:**
the winner on raw cost. **Complexity:** low, but couples temperature to the color target's lifetime and
forbids premultiplied-alpha blending on that target. This is the "free tier" of the buffer.

### 2.4 WebGL2 MRT + render-bundle / single-pass reuse (the G-buffer lite)

Extend §2.2 to a small **forge G-buffer**: attachment 0 color, attachment 1 packed `T`+`E`+`AE`,
attachment 2 (high-tier only) a velocity/normal for motion-driven haze and curl-coupled sparks. This is
the deferred-style approach studio post stacks use; three.js WebGPU post examples write exactly this
shape (`output`, `normal`, `velocity`) via `setMRT` ([three.js webgpu MRT example; PassNode docs]).
**Quality:** richest — sparks can advect along the same velocity the metal flows; haze can shear with
motion. **Perf:** 3 attachments of bandwidth, the most expensive option on a tile GPU. **Mobile:**
`high` tier only; the iPhone budget (`§10`) likely can't afford 3 full-screen HalfFloat writes plus the
fbm hero plus post. **Complexity:** high. Reserved as a high-tier upgrade, not the baseline.

### 2.5 WebGPU / TSL native MRT — the post-judge path

WebGPU is generally available on iOS 26 / Safari 26 as of WWDC 2025, mapping straight to Metal with
higher frame rates and lower CPU than the WebGL2→Metal path ([Apple WWDC 2025 WebGPU session; iOS-26
WebGPU coverage]). three.js `WebGPURenderer` ships a node-based post stack with **built-in MRT** and
automatic pass-merging via the node material ([three.js WebGPURenderer manual; Heckel field guide,
Oct 2025]). The author-side API is clean:

```js
const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
  output: outputNode,                 // HDR color
  temperature: temperatureNode,       // our T field
  emissive: emissiveNode,             // gw_tempEmissive(T)
}));
const tNode = scenePass.getTextureNode('temperature'); // sample in any later node
```

Per-material MRT is also supported: `material.mrtNode = mrt({ temperature: tNode })`, which is exactly
how the Codrops *Gommage* effect (Jan 2026) writes a per-fragment `bloomIntensity` channel for
selective bloom ([Codrops Gommage, Jan 2026; Heckel field guide]). **Quality:** identical field,
cleaner authoring, and on true WebGPU the driver can keep attachments in tile memory across merged
passes (the TBDR bandwidth win §6 describes, which WebGL2 *cannot* express). **Perf:** best when the
device has WebGPU; the WebGL2 *fallback* backend of `WebGPURenderer` is the documented risk
(`00-COHESION-MAP §10` — less-tested than classic `WebGLRenderer`). **Mobile:** the future default;
**not** the judge bet today. **Complexity:** a rewrite to TSL nodes, mitigated by authoring TSL-portable
now so the port is a re-host not a rewrite.

### 2.6 Analytic field as a function of world position (no screen buffer at all)

Because GAELWORX derives `age`/`T` **analytically** from the fill-front vs an arc-length coordinate
(`§1.3` — *no GPGPU ping-pong*), a consumer can in principle reconstruct `T` from its own world/UV
position by calling the same `gwCool01(age, rate)` — no buffer, no screen-space sample. **Quality:**
exact *for surface consumers* (basalt, channel metal) that know their world position; useless for
*screen-space* consumers (haze, god-rays) that only have a fragment coordinate. **Perf:** zero buffer.
**Mobile:** great where applicable. **Complexity:** low. **Verdict:** this is *already* the cohesion
strategy for on-surface elements; the MRT buffer's real value is the **screen-space** consumers that
have no other way to know the metal's true `T` behind their pixel.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Tiered, with the packed single-attachment (§2.3) as the default-on mechanism, the §2.2 two-attachment
MRT gated to `high`, and the analytic reconstruction (§2.6) kept for all on-surface consumers — all of
it authored TSL-portable for the §2.5 WebGPU future.**

The justification follows the budget. The iPhone-15 is fill-rate-bound, not triangle-bound
(`§10`): "pixels are the enemy." A second full-screen HalfFloat attachment is *pure fill-rate and
bandwidth* — exactly the wrong thing to add unconditionally. So:

1. **On-surface consumers keep recomputing analytically (§2.6).** The basalt, channel metal, slab
   veins, and letterform fill all know their world/arc position and already call `gwCool01`/`gw_forge`.
   They gain nothing from a screen buffer and would pay a dependent texture read. **No buffer for them.**

2. **Screen-space consumers read a packed `T` from the hero color target's alpha (§2.3) on every tier.**
   This is *free* bandwidth — the HalfFloat RGBA color target already allocates alpha. The molten/pour
   hero writes `gl_FragColor.a = T` (and bit-packs the `AE` flag into the top bits, or uses a dedicated
   `RG` if a second cheap channel is free). Heat-haze, god-rays, and the caustic mask then sample the
   color target's `.a` to get the **exact** `T` behind each pixel — killing the luminance-guess drift of
   the baseline. This is the load-bearing win and it costs essentially nothing.

3. **`high` tier promotes to a true second attachment (§2.2)** carrying `T` (full), `E`
   (`gw_tempEmissive`, full HDR), and `AE` — `RGBA16F` location 1 — when the device probe says there's
   headroom. This buys un-packed precision and a real emissive field for the god-ray source-finder and
   the basalt AE-spill, with one extra `RG16F`/`RGBA16F` write. Gated, never default.

4. **`static` tier writes nothing extra** — frozen `uTime=2`, no haze/god-rays, the analytic field
   alone carries the still (`§10`).

5. **Everything is authored as TSL-portable nodes** so the WebGPU path (§2.5) — where the *same* field
   becomes a clean `setMRT({ temperature, emissive })` and the driver can keep it in tile memory — is a
   re-host. We do **not** ship `WebGPURenderer` to the judge; we ship classic WebGL2 with the packed
   field, and flip the renderer post-judge once iOS-26 WebGPU penetration is real.

The net: **single-source-of-truth heat for the screen-space consumers at ~zero cost on the baseline,
with a precision upgrade gated to capable devices, and a clean WebGPU port already shaped.** It honors
`§7` (no element invents heat — they now literally *sample* it) without violating `§10` (no
unconditional second full-screen target on mobile).

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js r17x+** (`RenderTarget` with `count` option; the unified MRT API that supersedes
  `WebGLMultipleRenderTargets`). Pin a known-good r17x in `package.json`.
- **@react-three/fiber 8.x / 9.x** — the existing single `<Canvas>` in `ForgeCanvas.jsx`.
- **@react-three/postprocessing / pmndrs postprocessing** — the merged `EffectPass` already in the
  composer (`§6` of the cohesion map). The heat-haze and god-ray effects gain a `heatTexture` uniform.
- **No new dependency.** MRT is core three.js. TSL (`three/tsl`) is only imported on the gated WebGPU
  branch.

### 4.2 The hero pass writes the packed field (WebGL2, default tier)

The molten/cooling material's existing `onBeforeCompile` already computes `temp` and the final metal
color. We pack `T` into alpha. With a single color attachment there is nothing else to declare — we just
set `.a`:

```glsl
// --- inside the hero molten/letterform fragment, after the master temperature block ---
// temp        : final 0..1 temperature for THIS fragment (post gwCool01, post skin)  (§1.3)
// isAE        : 1.0 on divine-fire letters, else 0.0                                  (§1.4)
float T = clamp(temp, 0.0, 1.0);

// Pack T (12 bits) + AE flag (1 bit) into the HalfFloat alpha. Half-float gives ~11 bits
// mantissa in [0,1]; reserve the top of the range as the AE marker so consumers can branch.
float packed = isAE > 0.5 ? (1.0 + T * 0.0) : T;   // AE -> exactly 1.0 sentinel; metal -> T<1.0
gl_FragColor.a = packed;                            // color.rgb already = gw_forge / divineFire
```

> Edge case: the hero color target **must** be `RGBA16F` (`HalfFloatType`) and the composer buffer is
> already `HalfFloatType` per `§6`. Confirm `alpha` is not consumed by premultiplied blending on this
> target — the slab is opaque, so set `material.transparent = false` and read `.a` purely as data.
> If any consumer needs additive blend on the *color*, move the field to §4.4's second attachment.

### 4.3 Screen-space consumers sample the field

Heat-haze (the screen-space UV-warp masked by HDR luminance, `§5.4`) now masks by the **exact** `T`:

```glsl
// heat-haze fragment — uHeroColor is the hero color target (HalfFloat RGBA)
vec4 hero = texture2D(uHeroColor, vUv);
float packed = hero.a;
bool  isAE   = packed >= 0.999;               // divine-fire sentinel
float T      = isAE ? 1.0 : packed;           // true temperature behind this pixel

// warp strength keys off ACTUAL temperature, not composite luminance (kills drift §1, §7.1)
float hazeAmt = smoothstep(0.45, 1.0, T) * uHazeGain;     // only hot air shimmers
vec2  warp    = gw_warp(vUv * uHazeScale + uTime * 0.03).xy * hazeAmt; // shared noise §2 cohesion-map
gl_FragColor  = texture2D(uHeroColor, vUv + warp);
```

The god-ray source-finder reads `T` (or `E` on high tier) to locate the brightest-emissive cluster, and
the caustic-on-stone mask multiplies its filaments by `smoothstep(0.3,0.9,T)` so caustics only dance
where metal is genuinely hot. All three now read **one pixel**, not three guesses.

### 4.4 The gated `high`-tier second attachment (un-packed `T`+`E`+`AE`)

```js
// ForgeCanvas — build the hero target with a second HalfFloat attachment on `high`
import { RenderTarget, HalfFloatType, NearestFilter } from 'three';

const heroTarget = new RenderTarget(w, h, {
  count: tier === 'high' ? 2 : 1,        // attachment 1 only when there is headroom
  type: HalfFloatType,                   // MANDATORY on iOS — no FP32 color targets
  depthBuffer: true,
  minFilter: NearestFilter,              // heat field: no mip/linear blur of the scalar
  magFilter: NearestFilter,
});
// heroTarget.textures[0] -> HDR color   ;  heroTarget.textures[1] -> heat field (high only)
```

```glsl
// hero fragment, high tier — explicit MRT outputs (GLSL ES 3.0 / WebGL2)
layout(location = 0) out vec4 oColor;   // HDR forge color
layout(location = 1) out vec4 oHeat;    // R=T, G=gw_tempEmissive(T), B=AE flag, A=free

oColor = vec4(metalColor, 1.0);
oHeat  = vec4(T, gw_tempEmissive(T), isAE, 1.0);   // §1.2 emissive — same authority everywhere
```

Consumers branch on tier: read `heroTarget.textures[1]` when present, else the packed `.a` of
`textures[0]`. One `#define GW_HEAT_MRT` keeps a single shader source.

### 4.5 The r3f component shape

A headless `<ForgeHeatBuffer>` owns the target's lifecycle and binds it where consumers need it. It does
**not** add a render pass — the hero already renders; we only change *what target* it renders into and
expose the textures. It rides the **one** `<ForgeDriver>` writer (`§1.5`), never its own rAF.

```jsx
function ForgeHeatBuffer({ tier }) {
  const { gl, size, scene, camera } = useThree();
  const target = useMemo(() => new RenderTarget(
    size.width, size.height,
    { count: tier === 'high' ? 2 : 1, type: HalfFloatType,
      minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true }
  ), [tier]);                                   // rebuilt on tier change

  useEffect(() => () => target.dispose(), [target]);          // §4 dispose-on-unmount law
  useEffect(() => target.setSize(size.width * gl.getPixelRatio(),
                                 size.height * gl.getPixelRatio()),
            [size, gl]);                                       // DPR-capped to 1.5 on mobile (§10)

  // expose textures into the shared uniform pool U so haze/god-ray/caustic bind the SAME reference
  U.uHeroColor.value = target.textures[0];
  if (target.textures[1]) U.uHeatField.value = target.textures[1];

  useFrame(() => {
    gl.setRenderTarget(target);
    gl.render(scene, camera);        // the hero render — same scene, MRT-enabled material
    gl.setRenderTarget(null);
  }, /* priority just after ForgeDriver, before composer */ 1);
  return null;
}
```

> The composer's heat-haze/god-ray/caustic effects pull `U.uHeroColor` / `U.uHeatField` from the same
> shared pool (`forgeUniforms.js`, `§4.2`) — *references, not clones* — so there is exactly one buffer
> and one writer. This is the cohesion mechanism made physical.

### 4.6 Key uniforms / params

| Uniform | Meaning | Source |
|---|---|---|
| `U.uHeroColor` (sampler) | HDR color + packed `T` in `.a` | hero target `textures[0]` |
| `U.uHeatField` (sampler, high) | un-packed `T`/`E`/`AE` | hero target `textures[1]` |
| `uHazeGain` / `uHazeScale` | haze strength + frequency | scenes.js per-route |
| `GW_HEAT_MRT` (#define) | compile-time tier gate | capability probe |
| `uTemp` / `uHeat` (existing) | master scroll/strike heat | `<ForgeDriver>` (`§1.5`) |

The buffer **does not introduce a new authority** — `T` written into it is *produced by* the existing
`gw_forge`/`gwCool01`/`gw_divineFire` chain at the molten fragment. It is a *cache of the master signal*,
not a second source. That is the whole point: it can never drift from `§1`, because it *is* `§1`'s
output, frozen at the hero fragment and re-read downstream.

---

## 5. COHESION — shared palette / lighting / uniforms

- **Temperature authority (`§1`):** the buffer stores the *output* of `gw_forge`/`gwCool01`, so every
  consumer that samples it is, by definition, reading the master temperature. The drift the baseline
  risked (haze keying off composite luminance) is eliminated — haze now warps where `T` is hot, full
  stop. The divine-fire keystone (`§1.4`) survives as the `AE` sentinel/channel, so the basalt reveal
  and Ogham legibility (`§5.2`) read the exception from the *same* pixel, never a re-projected position.
- **Palette / bloom contract (`§3.1`):** because only the ≥10% accent band exceeds 1.0, and `E` in the
  buffer is `gw_tempEmissive(T)`, the buffer's emissive channel **is** the bloom selector — god-rays and
  the haze mask key off the identical "does this bloom" value the palette convention defines. No second
  threshold, no recoloring.
- **Shared noise (`§2`, cohesion map):** the haze warp still calls `gw_warp` from `shaders.js` at the
  shared `GW_FBM_OCTAVES` — the buffer supplies *strength* (`T`), the shared noise supplies *shape*. The
  air's wobble is the metal's grain, now gated by the metal's actual heat.
- **One driver, one pool (`§4.2`, `§1.5`):** the textures live in `U`, written by the single
  `<ForgeDriver>`/hero render, bound by reference into every consumer. Mutating the target updates every
  consumer at once — the same guarantee `Object.assign(shader.uniforms, U)` gives scalars, extended to
  samplers.
- **Lighting (`§5`):** the metal is the only light; the buffer is literally *the light field sampled*.
  The god-ray source-finder reads the brightest `E` cluster from one texture instead of guessing — the
  rays seed from the true hottest metal, surviving it drifting off-frame (`§5.4`).
- **Degrades uniformly (`§7.9`):** dropping from MRT to packed-alpha to analytic-only thins the *whole*
  field's precision uniformly; it never recolors or restructures. `static` shows the analytic still.

---

## 6. MOBILE & PERFORMANCE — inside the iPhone-15 budget

The judge is an iPhone-15 (A16/A17, OLED), Safari tab, ~90 s thermal ceiling, **fill-rate-bound**
(`§10`). The whole question is bandwidth.

**The TBDR reality.** Apple GPUs are tile-based deferred renderers: the framebuffer lives in fast
on-chip **tile memory** during a render pass and is written out to main memory only at *resolve*
([Apple "Tailor your apps for Apple GPUs and TBDR"; hyeondg.org TBR write-up]). ARM's deferred-shading
data shows keeping G-buffer attachments *in tile memory* across a merged subpass cuts memory reads ~45%
and writes ~56% versus separate passes ([ARM merged-subpass deferred-shading docs]). **The catch:
WebGL2 cannot express subpasses or `LAZILY_ALLOCATED`/memoryless attachments.** Every MRT attachment in
WebGL2 is resolved to main memory and re-read as a normal texture — so the §2.2 second attachment pays a
**full extra screen of HalfFloat write + a dependent read**, with none of the tile-memory discount that
makes deferred shading cheap in native Metal/Vulkan. That asymmetry is the entire reason for the tiered
recommendation:

- **Packed-alpha (§2.3, default tier):** the alpha channel of the already-allocated `RGBA16F` color
  target is **free bandwidth** — it is written and resolved whether or not we use it. Sampling
  `hero.a` in the post pass is one texture read the haze pass already does (it samples the color to warp
  it). **Net added cost: ~0 ms.** This is why packed-alpha is the baseline, not full MRT.
- **Second HalfFloat attachment (§2.2, high only):** one extra `RGBA16F` (8 bytes/px) full-screen write
  + resolve + sample. At DPR-capped 1.5 on an iPhone-15 that is on the order of a few hundred KB to ~1 MB
  per frame of extra bandwidth. Budget it at **~0.5–1.0 ms** and only spend it where the `high` tier
  already has headroom (`§10`: ~5–6 ms throttle gap). Drop it the instant `PerformanceMonitor.factor`
  dips (the adaptivity ladder, `§10`).
- **iOS precision constraint (mandatory):** the field target is `HalfFloatType` (`EXT_color_buffer_
  half_float`), **never** `FloatType` — iOS exposes no FP32 color render ([WebKit 216010; WebGL #3093]).
  `T ∈ [0,1]` and a flag fit in half precision with ~11 mantissa bits; bit-packing two `[0,1]` values
  into one half channel costs precision but stays well within visual tolerance for a mask.
- **DPR cap (the #1 lever, `§10`):** the field target is sized at the *same* DPR-1.5 cap as the scene —
  rendering the heat field at native DPR-3 would be instant death, same as the void shader. Use
  `NearestFilter` (the scalar must not be linearly blurred across the AE sentinel boundary, which would
  produce phantom mid-divine values).
- **No mip, no MSAA on the field:** MRT + MSAA is supported in WebGL2 but flaky in practice
  ([three.js issue #23300]); the heat field needs neither — it is sampled 1:1 by post passes.
- **WebGPU path (post-judge):** on iOS-26 Safari-26 WebGPU, the `setMRT` field *can* be kept memoryless
  in tile memory across the merged post stack (`§2.5`), recovering the ARM-style discount that WebGL2
  forfeits — the single strongest reason to port. But the WebGL2-fallback backend of `WebGPURenderer`
  is the documented mobile risk (`§10`), so the judge ships classic WebGL2.

**Fallback/static tier:** `count: 1`, packed-alpha only (or analytic-only on the very weakest probe).
Heat-haze/god-rays unmount on `static`; the analytic `T` carries the frozen still. Nothing breaks; the
world is still lit by the metal.

---

## 7. GET-IT-RIGHT-FIRST-TIME — pitfalls + order of operations

**Pitfalls (each has bitten a real build):**

1. **`FloatType` on the field target.** Renders fine on desktop, **black/incomplete framebuffer on iOS**
   — Apple has no FP32 color. Always `HalfFloatType`. Verify with
   `gl.checkFramebufferStatus() === FRAMEBUFFER_COMPLETE` on a real device, not just Chrome.
2. **Linear filtering across the AE sentinel.** `LinearFilter` blends the `1.0` divine-fire marker with
   neighboring metal `T`, producing phantom "half-divine" pixels at letter edges — the keystone rule
   (`§1.4`) leaks. Use `NearestFilter`, or carry `AE` in its own un-blended channel on high tier.
3. **Premultiplied alpha eating the packed `T`.** If the hero material blends, the alpha is consumed as
   coverage and your temperature is destroyed. Keep the hero opaque; if a consumer needs additive color,
   move `T` to the §4.4 second attachment, don't fight the blend.
4. **A second render pass instead of a second attachment.** Re-rendering the scene to capture `T`
   doubles draw cost. MRT writes both in *one* pass — the whole point. Never render the molten twice.
5. **Cloning the texture into each consumer's uniforms.** Breaks single-source-of-truth and leaks GPU
   memory. Bind the *reference* from `U` (`§4.2`); `renderer.info.memory.textures` must stay flat across
   navigation (`§4.3`).
6. **Sizing the field at native DPR.** Death by fill-rate. Cap to the scene's DPR-1.5; `setSize` on
   resize, dispose the old target.
7. **`mrtNode`/`setMRT` ordering on the WebGPU branch.** `setMRT` and `getTextureNode` must precede
   precompilation, and `depth` is auto-available without declaring it ([PassNode docs; three.js #30844]).
   Don't declare `depth` in `mrt()`.
8. **Assuming the tile-memory discount on WebGL2.** It does not apply — WebGL2 resolves every attachment
   to main memory. Budget the second attachment as a *full* extra screen, not a free subpass.

**Order of operations (de-risking sequence, mirrors `§8`):**

1. Ship the analytic + recomputed baseline (§2.1/§2.6) — current cohesion, zero buffer. Verify the
   world reads as one. *Only then* add a buffer, and only for the screen-space consumers that need it.
2. Add **packed-alpha** (§2.3) to the hero color target. Wire **one** consumer (heat-haze) to read
   `hero.a`. Confirm on the iPhone-15 that haze now shimmers exactly over hot metal and the frame cost
   is unchanged. This is the high-value, near-zero-cost win — bank it first.
3. Point god-rays and the caustic mask at the same `hero.a`. Re-verify cohesion and cost.
4. Add the gated **second attachment** (§4.4) behind `GW_HEAT_MRT` for `high`. A/B the un-packed `E`
   field against packed-alpha on the device — keep it only if the precision visibly helps the god-ray
   source-find or AE-spill, and only within the throttle gap.
5. Author every node TSL-portable; stand up the WebGPU `setMRT` branch (§2.5) behind the renderer flag,
   verify on iOS-26, keep it dark until WebGPU penetration justifies the flip.
6. Every step: `npm run build` green → `qa-route` 393×852 + 1440×900, **0 console errors** (SwiftShader
   compiles the GLSL so a `layout(location=1)` typo surfaces in CI) → the iPhone-15 OLED read.

---

## 8. SOURCES (2025–2026)

- Apple — **WWDC 2025: WebGPU on Apple Platforms** (Safari 26 / iOS 26 WebGPU GA, Metal mapping):
  https://dev.to/arshtechpro/wwdc-2025-webgpu-on-apple-platforms-16pa (2025)
- BrandLens — **"The Untold Revolution in iOS 26: WebGPU Is Coming"** (iOS-26 WebGPU rollout):
  https://brandlens.io/blog/the-untold-revolution-beneath-ios-26-webgpu-is-coming-everywhere-and-it-changes-everything/ (2025)
- Maxime Heckel — **"Field Guide to TSL and WebGPU"** (`mrt()`, `setMRT`, `material.mrtNode`,
  `getTextureNode`, selective bloom via MRT): https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (Oct 2025)
- Codrops — **"WebGPU Gommage Effect: Dissolving MSDF Text… with Three.js & TSL"** (per-material
  `mrtNode` writing a `bloomIntensity` channel for selective bloom):
  https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/ (Jan 2026)
- Three.js Roadmap — **"The Complete Guide to Three.js Post-Processing in 2026"** (`setMRT`/
  `getTextureNode` ordering, `depth` auto-availability, node post stack):
  https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026 (2026)
- Utsubo — **"Migrate Three.js to WebGPU (2026) — The Complete Checklist"** (WebGPURenderer post stack,
  MRT, fallback caveats): https://www.utsubo.com/blog/webgpu-threejs-migration-guide (2026)
- ICS Media — **"Getting started with Three.js on WebGPU"** (WebGPURenderer backend selection, WebGL2
  fallback): https://ics.media/en/entry/250501/ (May 2025)
- Wonderland Engine — **"WebGL Performance on Safari and Apple Vision Pro"** (Safari/Metal WebGL2
  performance surprises, getParameter cost, render-target practices):
  https://wonderlandengine.com/news/webgl-performance-safari-apple-vision-pro/ (2025)
- three.js docs — **RenderTarget** (unified `count`-option MRT API, `.textures[]`):
  https://threejs.org/docs/pages/RenderTarget.html (r17x, 2025)
- three.js docs — **PassNode** (`setMRT`, `getTextureNode`, auto-depth):
  https://threejs.org/docs/pages/PassNode.html (r17x, 2025)
- Khronos — **"WebGL 2.0 Achieves Pervasive Support from all Major Web Browsers"** (MRT in the WebGL2
  baseline across iOS Safari): https://www.khronos.org/blog/webgl-2-achieves-pervasive-support-from-all-major-web-browsers (2025 re-share)

_Pre-2025 canonical references that the above 2025–2026 sources cover, cited only through them: the iOS
FP32-render-target limitation (WebKit bug 216010; KhronosGroup/WebGL #3093 — surfaced in the 2025
Wonderland/Safari perf discussion); ARM merged-subpass deferred-shading bandwidth figures and Apple's
"Tailor your apps for Apple GPUs and TBDR" (the TBDR tile-memory model, re-summarized in 2025 mobile-GPU
write-ups); three.js MRT support PR #16390 (the API the r17x `count` option descends from)._

---

## 9. DEEP-DIVE CANDIDATES

1. **The packed-channel layout spec** — exact bit budget for cramming `T` + `E` + `AE` (and possibly a
   crust/skin flag) into one or two HalfFloat channels: how many mantissa bits each field gets, the
   sentinel scheme for `AE`, and the visual tolerance test on the OLED. Owns the §4.2/§4.4 packing.

2. **TSL MRT port + memoryless tile-memory validation on iOS-26** — stand up the `setMRT({ temperature,
   emissive })` WebGPU branch, confirm the field stays in tile memory across the merged post stack
   (the ARM-style discount WebGL2 forfeits), and measure the real bandwidth delta vs the WebGL2 path on
   a Safari-26 device. Decides when the renderer flip is worth it.

3. **God-ray source-find from the emissive field** — replacing the screen-luminance brightest-cluster
   heuristic with a sampled `E` field: downsample the heat attachment to find the hottest metal cluster
   for the radial-blur seed, so god-rays survive the source drifting off-frame (`§5.4`) deterministically.

4. **Velocity attachment for motion-coupled haze + curl sparks** — the §2.4 third attachment: writing the
   pour's flow velocity so heat-haze shears with motion and the GPGPU spark curl advection (`§2`
   cohesion-map) reads the metal's *actual* flow direction. High-tier / WebGPU-only; the richest
   single-source-of-truth, the heaviest bandwidth.
