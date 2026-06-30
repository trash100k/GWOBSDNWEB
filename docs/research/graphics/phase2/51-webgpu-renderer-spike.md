# 51 — WebGPURenderer + r3f v9 Migration Spike (gated, off critical path)

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **H-webgpu-tsl-future** · target device iPhone 15 (OLED)_
_Focus: prototype `three/webgpu` + `extend` + async-gl init + `forceWebGL` safety pin behind a capability flag
(default **OFF** for the judge), then **measure the WebGL2-fallback branch of `WebGPURenderer`** for 60fps parity
and thermal behavior on a real iPhone 15 — because that fallback branch would be the product if iOS WebGPU is flaky._

> Parent docs: **phase1/30** (the adopt-now-vs-WebGL2 verdict and the tradeoff table) and **00-COHESION-MAP §10**
> (the hard constraint: "WebGL2 + `onBeforeCompile` GLSL ships to the judge; WebGPU/TSL is a gated post-judge upgrade,
> authored TSL-portable so the port is a re-host not a rewrite — the WebGL2-fallback branch of `WebGPURenderer` is
> *less* tested than classic `WebGLRenderer`, so betting the judge device on it is the documented mistake"). This doc
> is **deep-dive 9.4** of doc 30 made buildable: the exact spike harness, the capability gate, the `forceWebGL` pin,
> and — the load-bearing measurement — a real-device protocol for the **WebGL2 fallback branch**, which is the branch
> that decides whether WebGPU is ever shippable here. It is gated, off the critical path, and **must not block the
> judged build**. The repo today is `three ^0.169`, `@react-three/fiber ^8.17`, `@react-three/postprocessing ^2.16`
> (`package.json`) — i.e. nothing here exists yet; this is a sandboxed branch, not a refactor of `ForgeCanvas.jsx`.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten-forge world on **one renderer**, route-swapped into eight chambers, every element bound to a
single master temperature/noise/palette/lighting system (00-COHESION-MAP §0). This spike does not add a visible
element. It answers a **substrate question with a hard deadline**: *can the world ever move off classic
`WebGLRenderer` onto `WebGPURenderer` — and if so, is the path safe enough to put in front of the iPhone-15 judge?*

The answer from doc 30 is already **no, not for the judged build** — ship WebGL2, author TSL-portable, treat WebGPU
as upside. This doc is the *evidence-gathering* that backs that verdict and de-risks the eventual flip. It has one
sharp focus the broad sweep deferred: **the WebGL2-fallback branch of `WebGPURenderer`.** That branch matters because
of a brutal asymmetry on iOS:

- If we ship WebGPU and the iPhone-15's Safari **supports** it → we run the WebGPU backend (untested under our
  thermal load).
- If we ship WebGPU and the iPhone-15's Safari **silently falls back** (no `navigator.gpu`, adapter request fails,
  a device-lost mid-session) → we run `WebGPURenderer`'s **WebGLBackend**, which is *not the same code* as the
  classic `WebGLRenderer` we ship today and is materially less battle-tested.

So either branch of a WebGPU build hands the judge a *less-proven* path than the status quo. The spike's job is to
**quantify that fallback branch** — 60fps parity vs classic WebGLRenderer, thermal behavior over a 2–3 minute
session, visual byte-parity of the forge look — so the "stay on classic WebGL2" decision is measured, not assumed,
and so that *when* iOS WebGPU matures (Safari 27+), the flip is a known quantity rather than a leap.

The spike's secondary scope is the **plumbing dry-run**: `three/webgpu` import, `extend(THREE)`, the r3f v9 async-`gl`
factory with `await renderer.init()`, the `forceWebGL` safety pin, and a boot capability probe — all behind a
`localStorage` flag that is **never set in the judged build**. Building this once, off to the side, means the future
adoption is a re-host, not a research project under deadline.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

### 2.1 The two backends inside one renderer

`WebGPURenderer` (shipped no-preview since **r171, Sept 2025**, imported from `three/webgpu`) is not "a WebGPU
renderer." It is a renderer with **two interchangeable backends** selected at construction:

1. `WebGPUBackend` — the native path (WGSL, compute, MRT).
2. `WebGLBackend` — a WebGL2 path that runs the *same TSL node graph* transpiled to GLSL.

The constructor's selection logic (confirmed from the r18x source and the manual): if `parameters.forceWebGL === true`
→ `WebGLBackend`; else if `navigator.gpu` yields a working adapter → `WebGPUBackend`; else → `WebGLBackend` **with a
console warning**. Crucially, `await renderer.init()` is where adapter acquisition and that fallback decision actually
resolve — a synchronous `gl` factory that returns the renderer **before** `init()` renders **black** (this is the
entire reason r3f v9 added an async `gl` prop). After init, the active backend is introspectable
(`renderer.backend`; the backend object exposes `isWebGPUBackend` / `isWebGLBackend`), which is how the spike logs
*which branch actually ran* on the test device.

The four candidate stacks (doc 30 §2.7), re-cast for **this spike's** quality/perf/mobile/complexity lens:

| Stack | Quality ceiling | iOS-safety (mid-2026) | Compute | Complexity / migration | Verdict for the spike |
|---|---|---|---|---|---|
| **Classic `WebGLRenderer` + GLSL** (today) | High, proven | **Highest** — trodden path, our shipped code | FBO ping-pong (doc 27) | Zero | **The control / baseline** |
| `WebGPURenderer` + WebGPU active | Highest (compute, MRT) | **Medium-low** — Safari 26 ships it but device-lost bugs in 26.0–26.1 (§2.4) | Native `instancedArray`/`.compute()` | High: v9, extend, async-gl, **post rewrite** | Prototype only, desktop-first |
| `WebGPURenderer` + **WebGL2 fallback** | High | **Medium** — less-tested than classic WGLR; THIS is the branch we measure | Emulated | High (same migration) | **The thing this doc measures** |
| TSL authored, run on classic WGLRenderer | High | High | Emulated | Medium (TSL adoption, no renderer swap) | The cheap insurance (doc 30 §9.1) |

### 2.2 r3f v9 async-gl + extend (the plumbing reality)

r3f **v9** is mandatory for WebGPU — v8 (our `^8.17`) cannot `await` the `gl` factory. The canonical 2025/2026 pattern
(Loopspeed/Pragmattic, March 2025; Wawa Sensei; Heckel field guide, 2025-10-14) is three coupled changes:

```jsx
import * as THREE from 'three/webgpu'          // NOT 'three' — the WebGPU namespace
import { extend, Canvas } from '@react-three/fiber'  // v9
extend(THREE)                                  // register three/webgpu classes as JSX (NodeMaterials etc.)

<Canvas
  gl={async (props) => {
    const renderer = new THREE.WebGPURenderer({
      ...props, antialias: true, forceWebGL: false, powerPreference: 'high-performance',
    })
    await renderer.init()                       // adapter + backend resolve HERE
    return renderer
  }}
/>
```

Three non-obvious costs the 2025 guides flag: (a) `extend(THREE)` from `three/webgpu` **replaces** the implicit
`three` namespace — node materials (`MeshPhysicalNodeMaterial`, `SpriteNodeMaterial`) only exist there; (b) the
v8→v9 jump has its own breaking changes (the `r3f.docs.pmnd.rs/tutorials/v9-migration-guide` list) independent of
WebGPU; (c) **tree-shaking / bundle size** — `three/webgpu` pulls the node system; the three.js forum thread on
"R3F WebGPU, WebGL2 Fallback, Tree Shaking" (2025) is the open question of how much the WebGPU namespace adds to the
bundle that ships to the judge. For a gated, default-off path the bundle hit is the strongest argument for keeping
WebGPU code-split behind a dynamic `import()` so it never enters the judged bundle at all (§4).

### 2.3 TSL authoring + the post-processing rewrite (not a free swap)

TSL replaces `onBeforeCompile` chunk-injection with typed node graphs (`colorNode`, `emissiveNode`, `normalNode`) and
is **renderer-agnostic** — one graph compiles to WGSL on WebGPU and GLSL on the WebGL2 backend (doc 30 §2.2). That
portability is exactly why the fallback branch is *viable at all*: the same TSL forge shader runs on both backends.
But the renderer swap drags the **post-processing finish** with it. `@react-three/postprocessing` (our `Effects.jsx`,
the merged `EffectPass`) is a `WebGLRenderer`-era library; on `WebGPURenderer` it does **not** drop in — the WebGPU
path uses TSL `PostProcessing` nodes (`scenePass`, `bloom()`, MRT, toggle via reassigning `outputNode`). So migrating
the renderer = migrating the finish, and the finish is brand law (the warm/crushed-black OLED grade, the bloom
threshold, grain-as-dither). The spike must therefore reproduce the grade as TSL nodes to even measure the fallback
fairly — measuring a WebGPU build *without* its post chain understates its cost.

### 2.4 iOS-Safari WebGPU stability — the dated reality (the core risk)

This is the evidence that the WebGPU **active** branch is not judge-safe in mid-2026, and that the **fallback** branch
is therefore the realistic product:

- **Safari 26 shipped WebGPU enabled-by-default on iOS/iPadOS/macOS, Sept 2025** (WebKit Safari 26.0 notes; the last
  major-browser holdout closed). "Supported," yes.
- **But "supported" ≠ "stable on a sustained scene":** the imgui WebGPU backend hits a **device-lost (destroyed)**
  error on **Safari 26.0–26.1, macOS and iOS**, where a render pass with certain pipeline/bind-group layouts trips an
  internal Safari assertion and kills the `GPUDevice` (ocornut/imgui #9103, reported 2025-11-30; a triangle works,
  a real pipeline doesn't; Chrome/Firefox/native fine). PlayCanvas's forum likewise carries "WebGPU fails on iOS
  Safari." These are *exactly* the mid-session failures that, in a `WebGPURenderer` app, would drop the user onto the
  WebGL2 backend — silently, mid-scroll, mid-judge.
- **The fixes are arriving but recently:** Safari **26.2 (2025-12-12)** restored `maxStorageBuffersInFragmentStage`
  and related limits, fixed a WGSL binary-arithmetic validation failure, added the `clip_distances` builtin, and
  fixed `GPUDevice.onuncapturederror`. That a *December 2025* point release was still repairing WGSL validation and
  storage-buffer limits tells you the surface was unstable through late 2025.
- **The device imposes hard limits:** Safari's Metal backend carries a default **256 MB buffer limit** on lower
  devices (scaling up on iPad Pro), and iOS 26's "Liquid Glass" UI itself increased GPU/thermal pressure
  system-wide — i.e. our app already competes for thermal headroom with the OS compositor on the judge device.

**Conclusion the spike will test, not assume:** through at least Safari 26.2 (mid-2026), shipping the WebGPU branch to
an iPhone-15 judge risks a device-lost drop to the WebGL2 backend at the worst moment. So the WebGL2-fallback branch
*is* the realistic product of a WebGPU build — which is precisely why this spike measures **that branch**, against the
classic-WebGLRenderer control, for parity.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Build a sandboxed, code-split, capability-gated `WebGPURenderer` spike (default OFF), prove the plumbing on desktop
Chrome, then run a real-iPhone-15 measurement of the WebGL2-fallback branch (`forceWebGL: true`) against the classic-
`WebGLRenderer` control for 60fps parity, visual byte-parity, and 3-minute thermal behavior. Ship none of it to the
judge. The judged build stays on classic WebGL2 + GLSL (doc 30 §3). Promote WebGPU only when (a) the fallback branch
measures at parity, and (b) iOS WebGPU itself proves device-lost-free on Safari 27+.**

Why this exact shape:

1. **The fallback branch is the real product of a WebGPU build, so it is the thing worth measuring.** Both WebGPU
   sub-branches are less-proven than today's classic renderer on the one device that decides the outcome (§2.4). The
   only number that could *change* the ship decision is "does the WebGL2 fallback hold 60fps + look identical?" If
   yes, a future flip is low-risk. If no, WebGPU is off the table here until iOS WebGPU itself is rock-solid. Either
   way the measurement is decisive — so it is the spike's center.

2. **`forceWebGL: true` makes the fallback branch directly measurable on any machine.** We do not need a device where
   WebGPU is broken to test the fallback — we pin `forceWebGL: true` and the same `WebGPURenderer` runs its
   `WebGLBackend` deterministically, on desktop Chrome *and* on the iPhone 15. That is the spike's primary instrument.

3. **Code-split + default-off = zero judged-build risk.** The WebGPU Canvas, node materials, and TSL post live behind
   a dynamic `import()` gated on a `localStorage` flag. The judged bundle never imports `three/webgpu`, so there is no
   bundle-size hit, no v9 requirement on the shipped path, and no chance of accidentally serving the unproven path.

4. **The plumbing is built once, calmly, off-deadline.** When iOS WebGPU matures, adoption is flipping a flag and
   pointing the route at the already-working GPU Canvas — a re-host, not a rewrite — *provided* the master shader was
   authored TSL-portable (doc 30 §9.1) and the TSL post nodes already match the grade.

**In one line:** *Measure the fallback because the fallback is the product; pin it with `forceWebGL`; gate it OFF; ship
classic WebGL2 to the judge.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Judged build (unchanged, do not touch):** `three ^0.169`, `@react-three/fiber ^8.17`,
  `@react-three/postprocessing ^2.16`, `postprocessing ^6.36` — exactly today's `package.json`. The spike adds **no
  runtime deps to the shipped bundle**.
- **Spike branch (code-split, default-off):** bump to `three` r181+ (TSL `PostProcessing` hardened; r184 for
  first-class TSL) using the `three/webgpu` + `three/tsl` entrypoints; `@react-three/fiber` **v9** (async-gl +
  `extend(three/webgpu)`). Pin the exact `three` to whatever your TSL post nodes require — r181/r182 hardened node
  PostProcessing, r184 made TSL first-class. Keep these in a separate `package.json` workspace or a dynamically
  imported chunk so v9 never forces the judged path off v8.

> Reality check: r3f v9 cannot be half-installed alongside v8 in one app. The clean spike is a **separate route bundle**
> (`/lab/webgpu`, excluded from the sitemap and prerender) or a separate throwaway Vite app that imports the same
> `palette.js` / `shaders.js` source — *not* an in-place edit of `ForgeCanvas.jsx`. This keeps the judged app on v8.

### 4.2 The capability gate (default OFF, code-split)

One boot probe; WebGPU is opt-in by *flag AND capability*, never assumed. Returns `'webgpu' | 'webgl-fallback' | 'webgl2'`:

```js
// src/scene/lab/gpu.js  (only imported by the /lab route bundle)
export async function pickBackend() {
  const flag = new URLSearchParams(location.search).get('gpu')      // ?gpu=webgpu | ?gpu=fallback
            || localStorage.getItem('gw_webgpu')                    // '1' opt-in; UNSET in judged build
  if (!flag) return 'webgl2'                                        // the judge always lands here
  if (flag === 'fallback' || flag === 'forcegl') return 'webgl-fallback'  // forceWebGL spike
  // genuine WebGPU only if the adapter actually resolves AND is not a slow software fallback adapter
  if (!navigator.gpu) return 'webgl-fallback'
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
                                     .catch(() => null)
  if (!adapter) return 'webgl-fallback'
  if (adapter.info?.isFallbackAdapter) return 'webgl-fallback'     // avoid software WebGPU (MDN isFallbackAdapter)
  return 'webgpu'
}
```

`isFallbackAdapter` (MDN, GPUAdapterInfo) is the documented way to refuse a software WebGPU adapter that "has
significant performance caveats" — on a phone that means thermal death, so we treat it as a WebGL fallback.

### 4.3 The async-gl Canvas with the `forceWebGL` pin (the instrument)

```jsx
// src/scene/lab/ForgeCanvasGPU.jsx — SPIKE ONLY, code-split, never in the judged bundle
import * as WGPU from 'three/webgpu'
import { extend, Canvas } from '@react-three/fiber'   // v9
extend(WGPU)

export function ForgeCanvasGPU({ backend /* 'webgpu' | 'webgl-fallback' */, onBackend }) {
  return (
    <Canvas
      dpr={[1, 1.5]}                                   // SAME DPR cap as judged build (doc 29 lever #1)
      gl={async (props) => {
        const r = new WGPU.WebGPURenderer({
          ...props,
          antialias: true,
          forceWebGL: backend === 'webgl-fallback',    // ← the safety pin AND the measurement instrument
          powerPreference: 'high-performance',
        })
        await r.init()                                 // MUST await — sync return renders black
        const b = r.backend
        onBackend?.(b?.isWebGPUBackend ? 'webgpu' : 'webgl2')   // log which branch ACTUALLY ran
        return r
      }}
    >
      <ObsidianSlabGPU />        {/* MeshPhysicalNodeMaterial, colorNode/emissiveNode/normalNode */}
      <EffectsGPU />            {/* TSL PostProcessing: scenePass → bloom → grade, matched to Effects.jsx numbers */}
      <FrameProbe onFrame={...} />  {/* the measurement harness, §6.2 */}
    </Canvas>
  )
}
```

The single most important line for this doc is `forceWebGL: backend === 'webgl-fallback'`. With it set `true`, the
*exact same component tree* runs the WebGL2 backend, so we measure the fallback branch deterministically against the
WebGPU branch (flag flipped) and against the classic-renderer control (the shipped app), with the look held constant.

### 4.4 The TSL-portable master shader (so the look is byte-identical across branches)

The fallback branch is only a fair test if it draws the **same forge**. The master noise/temperature/vein functions
must exist as a TSL sibling of the GLSL in `shaders.js`, same octave knob, same warp constants, same `PAL` stops
(doc 30 §4.2; 00-COHESION-MAP §1–2). Skeleton of the slab's emissive vein in TSL:

```js
import { Fn, uniform, vec3, float, mix, smoothstep, pow, Loop, mx_noise_float, positionLocal } from 'three/tsl'
import { color } from 'three/tsl'
import { PAL } from '../palette.js'   // SAME palette source as the GLSL path — no second orange

const uTime = uniform(0), uTemp = uniform(0), uVeinGlow = uniform(0.85)

// gw_fbm — same shape/octaves as shaders.js, mx_noise_float in place of gw_snoise
const gwFbm = Fn(([p]) => {
  const v = float(0).toVar(), a = float(0.5).toVar(), q = p.toVar()
  Loop({ start: 0, end: 3 }, () => {                 // GW_FBM_OCTAVES = 3 on high (doc 29)
    v.addAssign(a.mul(mx_noise_float(q)))
    q.assign(q.mul(2.03).add(vec3(11.3, 7.7, 4.1)))
    a.mulAssign(0.5)
  })
  return v
})

// gw_tempColor — the SAME six brand stops as 00-COHESION-MAP §1.1, as nodes
const gwTempColor = Fn(([t]) => {
  let c = mix(color(PAL.void), color(PAL.crimsonDeep), smoothstep(0.00, 0.22, t))
  c = mix(c, color(PAL.crimson), smoothstep(0.18, 0.45, t))
  c = mix(c, color(PAL.ember),   smoothstep(0.42, 0.66, t))
  c = mix(c, color(PAL.gold),    smoothstep(0.64, 0.85, t))
  c = mix(c, color(PAL.hot),     smoothstep(0.82, 1.00, t))
  return c
})
const gwTempEmissive = Fn(([t]) => pow(t, float(3)).mul(2.6).add(t.mul(0.12)))

// emissive vein, identical contract to the GLSL slab
const veinTemp = gwFbm(positionLocal.mul(uVeinScale).add(uTime.mul(0.06))).mul(0.5).add(uTemp)
material.emissiveNode = gwTempColor(veinTemp).mul(gwTempEmissive(veinTemp)).mul(uVeinGlow)
```

The divine-fire A/E exception (00-COHESION-MAP §1.4) ports identically: a `uIsAE` uniform routes a `mix(gwForge(t),
gwDivineFire(flick), uIsAE)`, the A/E never reaching `uTemp`. **Byte-parity is the spike's acceptance gate** — flip
to Khronos-Neutral tone-map on both branches and the brand red must read `#C1292E` on each.

### 4.5 TSL post nodes matched to `Effects.jsx`

```js
import { pass, mrt, output, emissive } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
// scenePass → threshold bloom (luminanceThreshold 0.55–0.6, resolutionScale 0.5 — SAME numbers as pmndrs Effects.jsx)
const scenePass = pass(scene, camera)
const bloomPass = bloom(scenePass.getTextureNode(), 0.6 /*threshold*/, 0.0 /*smoothing*/, 0.55 /*intensity*/)
postProcessing.outputNode = scenePass.add(bloomPass) /* → warm HueSat → crushed BrightnessContrast → vignette → grain */
```

Tone-map stays on the renderer (`AgX` or `ACES`, one operator, never a pass — 00-COHESION-MAP §3.2), grain-as-OLED-
dither never below ~0.03 (§3.3). If these numbers drift from `Effects.jsx`, the fallback measurement is comparing two
different looks and is worthless — so node-vs-pmndrs parity is itself a sub-result (deep-dive 9.3 of doc 30).

### 4.6 Key uniforms / params (shared with the rest of the world)

| Uniform | Source (mutable `forge` store) | Identical across classic / WebGPU / fallback |
|---|---|---|
| `uTime` | `state.clock.elapsedTime` (frozen on `static`) | yes |
| `uTemp` / `uHeat` | `forge.scrollDamped + vel*0.25` + strike `exp(-since*3)` | yes |
| `uPourFront` (vec3) | `forge.pourFront` | yes (compute attractor on WebGPU; FBO on fallback) |
| `uVeinGlow / uIrid / uVeinScale` | `sceneFor(forge.route)`, dt-damped | yes |
| `GW_FBM_OCTAVES` | tier table (doc 29): `#define` (GLSL) / `Loop` bound (TSL) | yes |
| `forceWebGL` | `pickBackend()` result | **the one knob that differs — selects the branch** |

The contract: **only `forceWebGL` differs between branches.** Everything the world reads is identical, so any frame-time
or look delta the spike finds is attributable to the *backend*, not to drift.

---

## 5. COHESION — shared palette / lighting / uniforms

A renderer spike must not fork the world's identity (00-COHESION-MAP §7, doc 30 §5). The binding rules this spike obeys:

- **One palette, one source.** The TSL nodes import the same `PAL` from `palette.js` as the GLSL path. No raw hex,
  no second orange. `PAL.hot/emberHot/gold/divine` stay the >1 HDR values that *are* the bloom selector on every
  backend — the palette selects what blooms whether the fragment is WGSL or transpiled GLSL.
- **One temperature signal.** Both branches read the same `forge` store (`scrollDamped`, `vel`, strike pulse,
  `pourFront`). A strike surges veins/sparks/bloom in the same frame on every backend (rule 6). The spike's
  `<ForgeDriver/>` is the lone author of the uniform pool, exactly as the shipped world.
- **One noise grammar.** `gwFbm`/`mx_noise_float` (TSL) is the sibling of `gw_fbm`/`gw_snoise` (GLSL) at the same
  octave count and warp constants — veins, haze, pour, sparks share visual DNA on both stacks (rule 2).
- **One finish, matched by number.** TSL `bloom`/grade/grain nodes are tuned to the *literal* `Effects.jsx` constants
  (threshold 0.55–0.6, resolutionScale 0.5, warm HueSat, crushed blacks, grain ≥0.03 as dither). Tone-map once on the
  renderer (rule 7).
- **Brand law is renderer-agnostic.** Divine-fire A/E (>1 white-gold, never cooling, radiating onto Ogham), warm-
  forge palette, pure-void black are shader *values* (rule 5). A WebGPU build that shifts fire hue or black point has
  **failed the spike**, not "looks a bit different." Byte-parity (flip to Khronos-Neutral, sample the red) is the gate.

The spike is, in effect, a **cohesion stress test**: if the world survives a renderer swap with byte-identical output,
the master-system discipline is proven; if it doesn't, the spike has found a cohesion leak to fix *before* any flip.

---

## 6. MOBILE & PERFORMANCE — the iPhone-15 envelope

WebGPU gets no budget exemption (00-COHESION-MAP §10; doc 29). The spike is *measured against* the same envelope:
~9–10 ms steady-state on `high`, DPR capped **1.5**, 60fps = 16.67 ms with ~5–6 ms thermal headroom.

### 6.1 Why the renderer barely moves the dominant cost

GAELWORX is **fill-rate-bound, not draw-call- or compute-bound** (00-COHESION-MAP §10; doc 30 §2.6): a near-full-
screen emissive fbm slab + a bloom pass + a few hundred additive points, < 20 draw calls. The per-pixel fragment cost
of that fbm is roughly the same whether it is WGSL or GLSL. So:

- The **WebGPU active** branch's headline 2–10× win (native compute, low draw-call overhead) lands on features we
  *haven't built* (compute sparks doc 15/27, fluid doc 08) — not on today's bottleneck. It does **not** relax the
  doc-29 levers (DPR cap, bloom `resolutionScale 0.5`, `GW_FBM_OCTAVES`, particle overdraw).
- The **WebGL2 fallback** branch should, in theory, land *near* the classic-renderer baseline (same GLSL-class
  fragment work) — **but it routes through a different driver path (`WebGLBackend`) than classic `WebGLRenderer`.**
  Whether that path adds per-frame overhead (extra binding churn, less-optimized uniform updates, different RT
  management) is *unknown and unmeasured on iOS* — which is the entire reason this spike exists.

### 6.2 The measurement harness (the actual deliverable)

A `<FrameProbe>` mounted in all three configs, logging an alloc-free rolling profile to a `localStorage` ring buffer
(no React state mid-scroll). Capture, per config, over a scripted 3-minute scroll-through of all eight chambers:

```js
// metrics per frame: dt, p50/p95/p99 frame time, dropped-frame count, and a thermal proxy
// thermal proxy on iOS (no thermal API in Safari): rolling median frame-time RISE over the session.
// A cold A16/A17 that holds 16.67ms then drifts to 20–24ms after ~90s is throttling (doc 10's 90s ceiling).
```

The three configs:

1. **Control** — the shipped classic `WebGLRenderer` build (today's `ForgeCanvas.jsx`).
2. **Fallback** — `WebGPURenderer` with `forceWebGL: true` (the branch under test).
3. **WebGPU** — `WebGPURenderer` native (only where Safari actually grants it; log `r.backend.isWebGPUBackend`).

**Pass criteria for the fallback branch** (the gate on a future flip):
- **Parity:** fallback p95 frame-time within **~10%** of control p95 across all eight chambers, at DPR 1.5.
- **Thermal:** fallback's median-frame-time rise over 3 min within ~10% of control's rise (no *worse* throttling).
- **Visual:** byte-parity vs control under Khronos-Neutral (brand red `#C1292E`, void true-black, divine-fire white-gold).
- **Stability:** **zero device-lost events** over the session (and if WebGPU active is tested, log every device-lost
  drop — these are the §2.4 risk made concrete).

### 6.3 Tiering and the static floor are renderer-independent

The three tiers (`high/low/static`), the `PerformanceMonitor`+`AdaptiveDpr` regression ladder, and the
`frameloop="demand"` frozen-warm-vein static poster (doc 29 §4.5; 00-COHESION-MAP §10) all apply unchanged on the
spike. On the fallback branch, `static`/reduced-motion must still produce the dignified frozen slab at zero per-frame
cost. **No runtime EXR on any branch** — env stays the procedural Lightformer PMREM rig (00-COHESION-MAP §5.3).

### 6.4 Bundle budget

The judged bundle must **not** grow. `three/webgpu` + `three/tsl` + r3f v9 are heavier than the v8 path; they enter
only the code-split `/lab/webgpu` chunk behind the flag (§4.1). Verify with a build-size diff that the default route's
bundle is byte-identical with and without the lab branch present (the lab chunk should be lazy and tree-shaken out of
the main entry).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each step de-risks the next):**

1. **Lock the judged build on classic WebGL2 first.** Nothing in this spike touches `ForgeCanvas.jsx`,
   `Effects.jsx`, or `package.json`'s shipped deps. The spike is a *separate* route/app importing shared
   `palette.js`/`shaders.js` source. Confirm `/` is byte-identical before and after the spike branch exists.
2. **Author the TSL-portable master shader** (doc 30 §9.1): `gwFbm`/`gwTempColor`/`gwDivineFire` as a TSL sibling at
   the same octave knob and `PAL` stops. Prove byte-parity on **desktop Chrome** first (control GLSL vs TSL-on-WebGPU
   vs TSL-on-`forceWebGL`) — three configs, one look.
3. **Build the capability gate + `forceWebGL` pin + backend logger** (§4.2–4.3). Verify `r.backend.isWebGPUBackend`
   reports correctly for each flag value. Verify a *synchronous* `gl` return renders black (so you internalize why
   `await init()` is mandatory).
4. **Match the TSL post nodes to `Effects.jsx` numbers** (§4.5) — without this the fallback measurement compares two
   different looks. This is deep-dive 9.3 of doc 30 and is a prerequisite, not a nicety.
5. **Run the 3-config harness on a real iPhone 15** (§6.2). Measure the **WebGL2-fallback branch** against the classic
   control for parity + thermal + visual + zero device-lost. *This is the result the whole spike exists to produce.*
6. **Only then** weigh a flip — and only if the fallback measures at parity AND iOS WebGPU (Safari 27+, WWDC26 line)
   proves device-lost-free. Until both hold, the verdict stays: **ship classic WebGL2.**

**Pitfalls (each has bitten this class of build):**

- **Treating the renderer swap as a one-liner.** It is r3f **v8→v9** + `extend(three/webgpu)` + **async-gl** + a
  **post-processing rewrite** (pmndrs → TSL nodes). `@react-three/postprocessing` does not drop onto `WebGPURenderer`.
- **Forgetting `await renderer.init()`.** A sync `gl` factory returning `WebGPURenderer` renders **black** — the
  literal reason r3f v9's async-gl exists.
- **Measuring the fallback without the post chain.** A bloom-less WebGPU build flatters itself; match `Effects.jsx`
  numbers or the comparison is invalid.
- **Assuming "Safari ships WebGPU" = "ship WebGPU to the judge."** Safari 26.0–26.1 device-lost (imgui #9103, Nov
  2025); storage-buffer/WGSL fixes only landed in 26.2 (Dec 2025). The fallback becomes your product mid-session.
- **Accepting a software WebGPU adapter.** Check `adapter.info.isFallbackAdapter` and refuse it — a software adapter
  on a phone is thermal death; treat it as the WebGL2 fallback.
- **Letting `three/webgpu` into the judged bundle.** Code-split behind the flag; diff the main-entry bundle size to
  prove zero growth on the shipped path.
- **Letting the swap change the look.** Fire hue, black point, bloom threshold, grain — all shader *constants*, not
  API behavior. Byte-parity (Khronos-Neutral check) is the acceptance gate; "looks close" is a fail.
- **Default-on WebGPU.** The gate defaults **OFF**; opt in by flag *and* measured capability. Default-on is how you
  hand the judge a black canvas or a device-lost stutter.

---

## 8. SOURCES (2025–2026)

1. three.js — "WebGPURenderer" manual (r18x). Constructor, `forceWebGL`, `init()`, automatic WebGL2 fallback,
   backend selection + warning. https://threejs.org/manual/en/webgpurenderer.html (2025–2026)
2. three.js — `WebGPURenderer.js` source (mrdoob/three.js, 2025–2026). `forceWebGL` → `WebGLBackend`; else
   `WebGPUBackend`; else `WebGLBackend` with warning.
   https://github.com/mrdoob/three.js/blob/ffef51075d125234079aaa494f9da1066f3d3e77/src/renderers/webgpu/WebGPURenderer.js
3. utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist." r171/r184, `forceWebGL`, fallback, post
   migration, async init. https://www.utsubo.com/blog/webgpu-threejs-migration-guide (2026)
4. utsubo — "What's New in Three.js (2026): WebGPU, New Workflows & Beyond."
   https://www.utsubo.com/blog/threejs-2026-what-changed (2026)
5. utsubo — "100 Three.js Tips That Actually Improve Performance (2026)." compute particles, dispose RTs,
   mutate-in-useFrame. https://www.utsubo.com/blog/threejs-best-practices-100-tips (2026)
6. Maxime Heckel — "Field Guide to TSL and WebGPU" (2025-10-14). TSL replacing onBeforeCompile, r3f WebGPU setup,
   `instancedArray` compute, WebGL2 cross-target. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. Loopspeed / Pragmattic — "React Three Fiber with WebGPU and TSL Node Material" (March 2025). r3f v9 async `gl`,
   `extend(three/webgpu)`, `MeshStandardNodeMaterial`, `forceWebGL: true` fallback.
   https://blog.loopspeed.co.uk/react-three-fiber-webgpu-typescript · https://blog.pragmattic.dev/react-three-fiber-webgpu-typescript
8. React Three Fiber — "v9 Migration Guide." async `gl` factory (returns a promise for `WebGPURenderer`), breaking
   changes. https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide (2025–2026)
9. three.js forum — "R3F WebGPU, WebGL2 Fallback, Tree Shaking" (2025). bundle-size of `three/webgpu`, fallback,
   tree-shaking the WebGPU namespace. https://discourse.threejs.org/t/r3f-webgpu-webgl2-fallback-tree-shaking/87188
10. ocornut/imgui — Issue #9103 "WebGPU backend fails (device lost) on Safari 26 (macOS + iOS)" (reported 2025-11-30).
    Render-pass pipeline trips an internal Safari assertion → `GPUDevice` lost; Chrome/Firefox/native fine.
    https://github.com/ocornut/imgui/issues/9103
11. PlayCanvas forum — "WebGPU fails on iOS Safari" (2025–2026). Real-device iOS Safari WebGPU failures + fallback
    discussion. https://forum.playcanvas.com/t/webgpu-fails-on-ios-safari/42070
12. Apple Developer — "Safari 26.2 Release Notes" (2025-12-12). Restored `maxStorageBuffersInFragmentStage`/limits,
    fixed WGSL binary-arithmetic validation, `clip_distances` builtin, `GPUDevice.onuncapturederror`.
    https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
13. WebKit — "WebKit Features for Safari 26.2" (Dec 2025) and "WebKit Features in Safari 26.0" (Sept 2025). WebGPU
    ship + ongoing WGSL/limit fixes. https://webkit.org/blog/17640/webkit-features-for-safari-26-2/ ·
    https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
14. WebKit — "News from WWDC26: WebKit in Safari 27 beta" (2026). The forward line on iOS WebGPU maturity (the gate
    on a future flip). https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/
15. MDN — GPUAdapterInfo / GPUAdapter "isFallbackAdapter" + `GPU.requestAdapter()`. Refuse software WebGPU adapters;
    feature-detect `navigator.gpu` + ship a WebGL2 fallback. https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapterInfo/isFallbackAdapter ·
    https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter (2025–2026)
16. Threlte docs — "WebGPU and TSL" (2025–2026). `WebGPURenderer` + `forceWebGL`, TSL cross-target, fallback framing
    in a sibling r3f-class framework. https://threlte.xyz/docs/learn/advanced/webgpu/
17. Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026" (TSL bloom via `outputNode`, MRT,
    node PostProcessing). https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026 (2026)

---

## 9. DEEP-DIVE CANDIDATES

- **9.1 The `forceWebGL`-branch parity harness as a reusable CI gate.** Wrap the 3-config `<FrameProbe>` (§6.2) into a
  Playwright + WebGL-capture routine that emits a parity report (p50/p95/p99, dropped frames, Khronos-Neutral pixel
  diff vs control) per chamber — so any future `three`/`@react-three/fiber` bump re-runs the fallback-vs-control
  parity check automatically and the "is WebGPU shippable yet?" question becomes a green/red dashboard, not a manual
  re-spike.

- **9.2 iOS device-lost recovery + graceful re-host.** Design the runtime handler for a mid-session `GPUDevice` loss
  (the imgui #9103 class of failure): catch the device-lost event, tear down the WebGPU Canvas, and re-mount the
  classic-`WebGLRenderer` Canvas at the *same* `forge` store state and scroll position so the user sees a single-frame
  hitch, not a black canvas — the safety net that would make a WebGPU build survivable on flaky iOS even before the
  platform is fully stable.

- **9.3 TSL `PostProcessing` byte-parity with the pmndrs `EffectPass`.** Reproduce the exact warm/crushed-black grade,
  bloom threshold, CA, vignette, and OLED grain-as-dither as TSL nodes and prove pixel-identity to `Effects.jsx` —
  the prerequisite that makes the fallback measurement valid and the eventual finish-swap safe (this is doc 30 §9.3,
  promoted to a blocking dependency of this spike).

- **9.4 Compute-spark fallback parity.** When the doc-15/27 pour-front sparks move to a WebGPU `instancedArray`
  compute kernel, measure how that kernel degrades on the `forceWebGL` branch (which has *no* compute stage and must
  emulate via FBO ping-pong) — quantifying whether the sparks survive a fallback at all, or whether the fallback
  branch needs a separate CPU/FBO spark path so a WebGPU-authored world doesn't lose its living sparks on iOS.
