# 54 — iOS-Safari WebGPU Stability Matrix + Capability-Gate Policy

_Phase-2 graphics deep-dive · GAELWORX forge world · cluster **H-webgpu-tsl-future** · target device iPhone 15 (OLED)_
_Focus: a **real-device stability matrix** (iPhone 15 across iOS/Safari 26.x point releases) for WebGPU under
sustained thermal load, plus the **boot-time `navigator.gpu`/adapter probe + `forceWebGL` fallback policy** that
decides — safely, at first paint — which renderer path each user gets. The data that unblocks (or kills) the migration._

> Parent docs: **phase1/30** (the adopt-now-vs-WebGL2 verdict + the four-stack tradeoff table), **phase2/51** (the
> `WebGPURenderer` + r3f-v9 migration spike and the WebGL2-**fallback-branch** measurement protocol), and
> **00-COHESION-MAP §10** (the hard constraint: "WebGL2 + `onBeforeCompile` GLSL ships to the judge; WebGPU/TSL is a
> gated post-judge upgrade … betting the judge device on the WebGL2-fallback branch of `WebGPURenderer` is the
> documented mistake"). This doc is the **third leg** of the H-cluster: 30 decided *what stack ships*, 51 built the
> *spike harness that measures the fallback branch*, and **54 owns the two artefacts that gate the decision at run
> time** — (1) the dated **stability matrix** that says whether the WebGPU branch is trustworthy on a given iOS point
> release, and (2) the **boot probe + gate state machine** that turns that matrix into a per-user renderer choice
> without ever handing the judge a black canvas. Sibling doc **47** owns the *WebGL-tier* probe (DPR/cores/GPU-string
> → `high`/`low`/`static`); this doc owns the *renderer-path* probe (`navigator.gpu`/adapter/version → `webgpu` /
> `webgl-fallback` / `webgl2-classic`). They compose: the renderer gate runs **first**, then the tier probe runs
> inside whichever renderer was chosen. The repo today is `three ^0.169`, `@react-three/fiber ^8.17` — nothing here
> ships to the judge; this is the policy that governs *if and when* it ever could.

---

## 1. SCOPE — this element in the GAELWORX world

GAELWORX is one molten-forge world on **one** renderer, route-swapped into eight chambers, every element bound to a
single master temperature/noise/palette/lighting system (00-COHESION-MAP §0), and it must hold 60fps on an **iPhone 15
OLED held in one hand, in a Safari tab, for a 2–3 minute scroll-through** (00-COHESION-MAP §10). This deep-dive adds no
visible element. It owns the **decision substrate** for the one substrate question the whole H-cluster orbits: *can the
forge ever run on `WebGPURenderer` in front of the iPhone-15 judge, and how does the app decide that — safely — at
boot, on every device, without a human in the loop?*

Doc 30 already answered the *ship* question: **no, not for the judged build** — ship classic WebGL2, author
TSL-portable, treat WebGPU as upside. But "no, not yet" is not a static fact; it is a **function of two things that
change over time**: (a) how stable iOS Safari's WebGPU backend actually is on the exact point release the user is
running (Safari 26.0 vs 26.2 vs 26.3 vs 27.x are *materially different* — §2), and (b) whether the device, the adapter,
and the thermal headroom can sustain a WebGPU render path for a full session without a `GPUDevice` loss mid-scroll. So
the deliverable here is **a living policy**, not a one-time verdict:

1. **The stability matrix (§2).** A dated, real-device read of WebGPU reliability on iPhone 15 across the iOS/Safari
   26.x line under *sustained* load — not "does a triangle draw" but "does a full pipeline survive 3 minutes of a
   thermally-soaking A16 without a device-lost drop." This is the table that tells a future engineer whether the gate's
   WebGPU branch should even be *eligible* on a given OS version.

2. **The capability-gate policy (§3–§4).** The boot probe — `navigator.gpu` presence → `requestAdapter()` →
   `adapter.info` / `isFallbackAdapter` → an allowlist check against the matrix → `WebGPURenderer({ forceWebGL })` —
   that resolves to one of three renderer paths **before first paint**, defaults **OFF** (the judge always lands on
   classic WebGL2), and degrades to the safe path on every uncertainty. Plus the **device-lost recovery net** that
   re-hosts onto the classic renderer at the same `forge`-store state if WebGPU dies mid-session.

The contract this doc is held to: **the gate must never be the reason the world fails to render.** Every branch of the
probe that is not *provably* better-than-classic-WebGL2 resolves to classic WebGL2. The matrix exists so that "provably
better" is a measured allowlist, not optimism.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026 — the stability matrix and the probe surface

Two halves: the **dated reliability picture** (what the matrix is built from) and the **probe primitives** (what the
gate can actually read at boot).

### 2.1 The iOS-Safari WebGPU timeline (the matrix's spine, dated)

WebGPU on Apple platforms is **recent and still settling**, and the point-release granularity matters because a single
`.x` bump fixed validation failures that would crash the forge:

- **Safari 26.0 — Sept 2025.** WebGPU shipped **enabled-by-default** on iOS 26, iPadOS 26, macOS Tahoe, and visionOS —
  Apple was the last major-browser holdout, closing the gap to ~79–82% global support
  ([WebKit "WebKit Features in Safari 26.0", Sept 2025]; [webgpu.com "WebGPU Hits Critical Mass", 2025];
  [brandlens "Untold Revolution in iOS 26", 2025]). "Supported" became true here.
- **Safari 26.0–26.1 — the device-lost window.** "Supported" did **not** mean "stable for a real pipeline." The imgui
  WebGPU backend hits a **device-lost (destroyed)** error on Safari 26.0–26.1, macOS *and* iOS: a *triangle* draws, but
  a real render pass with certain pipeline / bind-group-layout combinations trips an internal Safari assertion and
  **kills the `GPUDevice`** — while Chrome, Firefox, and native are fine (ocornut/imgui #9103, reported 2025-11-30).
  PlayCanvas's forum carries the parallel "WebGPU fails on iOS Safari" thread. three.js's own examples reproduce a
  `THREE.WebGPURenderer: WebGPU Device Lost` on certain content (mrdoob/three.js #30099, #30405). These are *exactly*
  the mid-session failures a forge scene — heavy pipelines, MRT, compute — would provoke.
- **Safari 26.2 — Dec 12, 2025.** A WGSL/limits repair release: **restored `maxStorageBuffersInFragmentStage`** and
  related limits, **fixed a WGSL binary-arithmetic validation failure**, added the `clip_distances` builtin, **fixed
  `GPUDevice.onuncapturederror`** not firing, and fixed multisampled-resolve-target rendering with direct `GPUTexture`
  objects ([Apple "Safari 26.2 Release Notes", 2025-12-12]; [WebKit "WebKit Features for Safari 26.2", Dec 2025]). That
  a *December-2025 point release* was still repairing core WGSL validation and storage-buffer limits is the loudest
  signal that the surface was unstable through late 2025.
- **Safari 26.3 and later betas — early 2026.** Continued WebGPU repair: further `GPUDevice.onuncapturederror` fixes,
  storage-buffer-limit restoration, multisampled-resolve fixes, and WGSL shader-validation fixes (Apple/WebKit release
  notes; [Releasebot "Safari Updates", June 2026]). The trajectory is *improving but still actively patched*.
- **Safari 27 (WWDC26 line) — 2026.** The forward maturity line; the gate on a future flip is "does iOS WebGPU prove
  device-lost-free on 27+?" (referenced in doc 51 §7).

**The crucial system fact:** iOS 26's "Liquid Glass" compositor itself raised system-wide GPU/thermal pressure, so a
WebGPU forge competes for thermal headroom with the OS chrome on the very device that decides the result. And Safari's
Metal backend carries a default **256 MB buffer ceiling** on lower-end devices (scaling up on iPad Pro) — a hard limit
a GPGPU-spark / fluid build can hit.

### 2.2 The thermal reality (why "draws once" ≠ "survives a session")

The matrix's second axis is **sustained load**, because the A16-class chip *sags*, it does not cliff. The iPhone 15
(A16) measured **~51% GPU stability** under a sustained GPU stress test — i.e. it loses ~half its peak GPU throughput as
the chassis soaks heat — versus ~78% on the iPhone 16 (A18) ([GSMArena iPhone 16 review stress tests, 2025];
[Notebookcheck "iPhone 15 Pro Max thermal throttling … 48 °C", 2025]; [Review Meld "iPhone 16 Gaming Performance", 2025]).
The 15 Pro / Pro Max (A17 Pro) measured ~60–70% on Wildlife/Solar-Bay stress runs. The takeaway for the matrix: a WebGPU
path that benchmarks at parity *cold* can still fall off after ~90 s, and on iOS Safari there is **no thermal API** to
read — the only signal is a rising rolling-median frame time (doc 51 §6.2). A WebGPU build that is *additionally*
fighting a possible device-lost (§2.1) under that thermal stress is strictly riskier than the classic path.

### 2.3 The probe primitives (what the gate can actually read at boot)

The gate must decide from what the platform exposes *before* committing a renderer:

- **`navigator.gpu`** — presence test. Absent → no WebGPU, full stop. Cheap, synchronous, zero cost.
- **`navigator.gpu.requestAdapter({ powerPreference })`** — returns a `GPUAdapter` **or `null`**; *can* resolve `null`
  even when `navigator.gpu` exists (no compatible adapter, or blocked). Always `await` + `.catch(()=>null)`
  ([MDN "GPU: requestAdapter()", 2025–2026]).
- **`adapter.info`** (`GPUAdapterInfo`) — `{ vendor, architecture, device, description }`. On iOS these are
  **deliberately coarse/empty** for fingerprint resistance (same masking philosophy as the WebGL `UNMASKED_RENDERER`
  → flat "Apple GPU", doc 47 §2.1), so `info` cannot distinguish iPhone generations. Useful for *desktop* allow/deny,
  near-useless as an iOS discriminator.
- **`GPUAdapterInfo.isFallbackAdapter`** — the documented boolean for "this adapter has significant performance
  limitations" (a software adapter). The property **moved from `GPUAdapter` to `GPUAdapterInfo`**; on a phone a software
  adapter means thermal death, so the gate **refuses it** ([MDN "GPUAdapterInfo.isFallbackAdapter", 2026]). Caveat:
  Chrome doesn't yet ship fallback adapters so it's `false` there — but the check is correct and free, and matters on
  the platforms that *do* expose it.
- **`device.lost`** — a `Promise<GPUDeviceLostInfo>` that **resolves** (never rejects) when the device dies, with
  `reason ∈ { "destroyed", "unknown" }` (`"destroyed"` = you/the app destroyed it; `"unknown"` = the platform/driver
  killed it — the §2.1 Safari case) ([MDN "GPUDevice.lost"; gpuweb ErrorHandling.md]). This is the **runtime** half of
  the policy: even a device that passed the boot gate can die mid-session, and the recovery net keys off `reason`.
- **`GPUDevice.uncapturederror`** — fires for errors not caught by an explicit error scope; the handler was **broken
  until Safari 26.2** (§2.1), so on 26.0–26.1 a WebGPU build is partly *blind* to its own errors. Another reason the
  matrix gates the WebGPU branch off on early point releases.
- **three.js introspection after `await renderer.init()`** — `renderer.backend.isWebGPUBackend` /
  `isWebGLBackend` tells you **which branch actually ran** (the WebGPU adapter request can silently fall back to the
  `WebGLBackend` with a console warning). The gate logs this so "we chose WebGPU" is verified against "WebGPU actually
  ran," not assumed ([three.js "WebGPURenderer" manual, r18x]; doc 51 §2.1). Note `hasFeatureAsync()` is **deprecated** —
  use `hasFeature()` after `init()`.

### 2.4 Gate-architecture options (the field, with tradeoffs)

| Approach | Safety on iOS judge | First-paint cost | Precision | Verdict |
|---|---|---|---|---|
| **Default-ON WebGPU, trust `WebGPURenderer` auto-fallback** | **Worst** — ships the unproven branch; a device-lost is a black canvas / stutter at the worst moment | low | n/a | **Reject** — hands the judge the §2.1 risk |
| **Presence-only gate** (`navigator.gpu` ⇒ WebGPU) | Poor — `navigator.gpu` exists on 26.0 where pipelines die | ~0 ms | none | Reject (ignores the matrix) |
| **Adapter-probe gate** (`requestAdapter` + `isFallbackAdapter`) | Better — refuses no-adapter + software adapters | one async adapter request (~ms) | medium | Necessary, **not sufficient** (an adapter resolves on buggy 26.0) |
| **Adapter-probe + version-allowlist gate** (probe AND matrix-gated by Safari version) | **Best** — only eligible where the matrix says stable | adapter request + UA parse | high (version-aware) | **Recommended** |
| **Live micro-benchmark gate** (render a probe frame, measure) | High but expensive | ~0.5–1 s render stall on the device we protect | high | Reject as the *primary* gate (measures cold, stalls boot); keep as optional tie-breaker behind the loader |

The recommended gate is the **adapter-probe + version-allowlist + default-OFF flag**, with a **device-lost recovery
net** as the runtime safety layer — built in §3–§4.

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Ship a boot-time, default-OFF, three-way renderer gate: `pickRenderer()` returns `webgl2-classic` (the judged
default, today's `WebGLRenderer`) unless an explicit opt-in flag is set AND `navigator.gpu` yields a non-fallback
adapter AND the running Safari/OS version is on a measured stability allowlist — in which case it returns `webgpu`
(native) or, on `forceWebGL` / any uncertainty, `webgl-fallback`. Pair it with a runtime `device.lost` recovery net
that re-hosts the world onto classic `WebGLRenderer` at the same `forge`-store state. The judged build never sets the
flag and always lands `webgl2-classic`. WebGPU becomes eligible only when the §2 matrix marks the user's exact iOS
point release stable-under-load.**

This is the run-time embodiment of doc 30 §3 and doc 51 §3, and it is argued from four points:

1. **The default must be the proven path, and every uncertainty must collapse to it.** The single failure mode that
   loses a judged demo is a black canvas or a mid-scroll device-lost stutter. So the gate is **fail-safe by
   construction**: no flag → classic; no `navigator.gpu` → classic; `null` adapter → classic/fallback;
   `isFallbackAdapter` → fallback; OS version not on the allowlist → classic; `init()` throws → classic; device lost
   mid-session → re-host to classic. WebGPU is reachable *only* down the one fully-green path.

2. **The matrix makes "is WebGPU eligible?" a measured allowlist, not a guess.** §2.1 shows the answer differs by point
   release: Safari 26.0–26.1 = device-lost risk on real pipelines → **deny**; 26.2 = WGSL/limit/uncapturederror fixes
   landed → **conditionally eligible** (measure under load); 26.3+ / 27.x = re-measure and widen. The gate reads the
   running version and consults this allowlist, so it can *open* automatically as iOS matures and *close* if a
   regression ships — without a code change to the chambers.

3. **The probe is cheap and the recovery net is the real insurance.** The boot probe is one `navigator.gpu` test + one
   `await requestAdapter()` + a UA/version parse — sub-millisecond plus one async hop, run *behind the intro loader* so
   it never blocks first paint (doc 51, doc 47's loader gate). The genuine safety comes from the **`device.lost`
   handler**: because iOS Safari WebGPU *can* die on a valid pipeline (§2.1), even a gate-approved device needs a net
   that tears down the WebGPU Canvas and re-mounts the classic one at the *same* `forge` state (heat, scroll, route) —
   a single-frame hitch, not a black screen.

4. **Only `forceWebGL` differs between the WebGPU and fallback branches, so the matrix's fallback row is directly
   testable.** The same gate that selects `webgpu` selects `webgl-fallback` by flipping `forceWebGL: true` on the *same*
   `WebGPURenderer` (doc 51 §4.3). That makes the fallback branch — which is the *realistic product* of any WebGPU
   build on flaky iOS — measurable on any machine, and lets the matrix carry a separate, honest "fallback-branch
   parity" verdict alongside the native one.

**In one line:** *The gate defaults to the proven renderer and only opens the WebGPU door when a measured, version-aware
allowlist says the door is safe — and a `device.lost` net slams it shut, mid-session, onto classic WebGL2 if iOS lies.*

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **Judged build (unchanged, never touched):** `three ^0.169`, `@react-three/fiber ^8.17`,
  `@react-three/postprocessing ^2.16` — today's `package.json`. The gate's *default* branch is exactly this. **No
  runtime deps added to the shipped bundle.**
- **Gated branch (code-split, default-OFF):** `three/webgpu` (`WebGPURenderer`), `three/tsl`,
  `@react-three/fiber` **v9** (async-`gl` + `extend(three/webgpu)`). Pinned to r181+ for hardened node PostProcessing /
  r184 for first-class TSL (doc 30 §4.1, doc 51 §4.1). These load **only** behind a dynamic `import()` inside the gate's
  `webgpu`/`webgl-fallback` paths, so `three/webgpu` never enters the judged bundle (verify with a main-entry
  bundle-size diff — doc 51 §6.4).

### 4.2 The stability matrix (the data artefact — the deliverable)

A versioned table the gate consults. Rows are real-device reads; **`native` and `fallback` are scored separately**
because the fallback branch is the realistic product. (Verdicts below encode §2's dated evidence; the `…-load` columns
are filled by the doc-51 3-config harness on a real iPhone 15.)

| Device / chip | iOS · Safari | `navigator.gpu` | Adapter (non-fallback) | `uncapturederror` ok | Device-lost on real pipeline | Native @60 cold | Native sustained 3 min | **Fallback** sustained 3 min | **Matrix verdict** |
|---|---|---|---|---|---|---|---|---|---|
| iPhone 15 (A16) | 26.0 · 26.0 | yes | yes | **no** (broken) | **yes** (imgui/three.js class) | — | — | classic-parity (measure) | **DENY native** · fallback-only-if-measured |
| iPhone 15 (A16) | 26.1 · 26.1 | yes | yes | **no** | **yes** | — | — | measure | **DENY native** |
| iPhone 15 (A16) | 26.2 · 26.2 | yes | yes | **yes** (fixed) | **reduced** | measure | measure (A16 ~51% GPU stability) | measure vs control ±10% | **CONDITIONAL** — eligible iff load-test passes |
| iPhone 15 (A16) | 26.3+ · 26.3+ | yes | yes | yes | re-measure | measure | measure | measure | **CONDITIONAL — re-measure each point release** |
| iPhone 15 (A16) | 27.x · 27.x | yes | yes | yes | target: none | target: yes | target: yes | target: parity | **TARGET FLIP GATE** (doc 51 §7) |
| iPhone 16/17 (A18+) | 26.2+ | yes | yes | yes | reduced | likely | ~78% GPU stability | measure | CONDITIONAL (more headroom) |
| any · software adapter | any | yes | **no (`isFallbackAdapter`)** | n/a | n/a | n/a | n/a | n/a | **DENY → fallback/classic** (thermal death) |
| any · no `navigator.gpu` | < 26 / disabled | **no** | — | — | — | — | — | — | **classic-WebGL2** (the trodden path) |

**The acceptance gate for marking any CONDITIONAL row eligible** (from doc 51 §6.2): fallback p95 within ~10% of the
classic control across all eight chambers at DPR 1.5; median-frame-time *rise* over 3 min within ~10% of control (no
worse throttling); byte-parity under Khronos-Neutral (brand red `#C1292E`, void true-black, divine-fire white-gold);
and **zero device-lost events** over the session. A row stays DENY until it passes.

### 4.3 The boot probe + version allowlist (the gate)

```js
// src/scene/lab/renderer-gate.js  — imported ONLY by the gated lab bundle; judged build never calls it.
// Returns: 'webgl2-classic' | 'webgpu' | 'webgl-fallback'

// The allowlist IS the §4.2 matrix, distilled: min Safari version whose NATIVE branch is matrix-eligible.
const WEBGPU_NATIVE_MIN_SAFARI = 26.2;   // 26.0/26.1 = device-lost + broken uncapturederror (§2.1) → never native

function iosSafariVersion() {
  // iOS Safari only; returns a float like 26.2, or null on non-iOS / unknown.
  const ua = navigator.userAgent;
  const iOS = /iP(hone|ad|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (!iOS) return null;
  const m = ua.match(/Version\/(\d+)\.(\d+)/);            // Safari reports its own version here
  return m ? parseFloat(`${m[1]}.${m[2]}`) : null;
}

export async function pickRenderer() {
  // 1) opt-in gate — DEFAULT OFF. The judge never sets either of these.
  const flag = new URLSearchParams(location.search).get('gpu')   // ?gpu=webgpu | ?gpu=fallback
            || localStorage.getItem('gw_webgpu');                // '1' opt-in; UNSET in the judged build
  if (!flag) return 'webgl2-classic';                            // ← the judge ALWAYS lands here
  if (flag === 'fallback' || flag === 'forcegl') return 'webgl-fallback';

  // 2) presence + adapter probe (await + catch — requestAdapter can resolve null even when gpu exists)
  if (!navigator.gpu) return 'webgl2-classic';
  const adapter = await navigator.gpu
    .requestAdapter({ powerPreference: 'high-performance' })
    .catch(() => null);
  if (!adapter) return 'webgl2-classic';

  // 3) refuse software adapters (isFallbackAdapter moved to GPUAdapterInfo; phone software-WebGPU = thermal death)
  const info = adapter.info || (adapter.requestAdapterInfo && await adapter.requestAdapterInfo());
  if (info?.isFallbackAdapter) return 'webgl-fallback';

  // 4) VERSION ALLOWLIST — the matrix gate. On iOS, only matrix-eligible Safari runs native WebGPU.
  const sv = iosSafariVersion();
  if (sv !== null && sv < WEBGPU_NATIVE_MIN_SAFARI) return 'webgl-fallback'; // 26.0/26.1 → never native

  return 'webgpu';
}
```

`iosSafariVersion()` parses the `Version/26.2` token Safari emits; the allowlist constant is the matrix's distilled
verdict, so widening eligibility (26.2 → 26.3 → 27) is a one-line data change, not a code change. The `?gpu=…` query
override is the spike instrument (doc 51); the `gw_webgpu` localStorage flag is the manual opt-in. **Neither exists in
the judged build**, so `pickRenderer()` is never even reached on the shipped path — `ForgeCanvas.jsx` mounts classic
`WebGLRenderer` directly.

### 4.4 Renderer construction + backend verification (the async-gl Canvas)

```jsx
// src/scene/lab/ForgeCanvasGated.jsx — SPIKE/GATED ONLY; dynamic-imported, never in the judged bundle.
import * as WGPU from 'three/webgpu';
import { extend, Canvas } from '@react-three/fiber';   // v9 — async gl
extend(WGPU);

export function ForgeCanvasGated({ choice /* 'webgpu' | 'webgl-fallback' */, onBackend, onLost }) {
  return (
    <Canvas
      dpr={[1, 1.5]}                                    // SAME DPR cap as the judged build (doc 29 lever #1)
      gl={async (props) => {
        const r = new WGPU.WebGPURenderer({
          ...props,
          antialias: true,
          forceWebGL: choice === 'webgl-fallback',      // ← the safety pin AND the matrix's fallback instrument
          powerPreference: 'high-performance',
        });
        await r.init();                                 // adapter + backend resolve HERE; sync return renders BLACK
        const usedWebGPU = !!r.backend?.isWebGPUBackend;
        onBackend?.(usedWebGPU ? 'webgpu' : 'webgl2');  // verify chosen == actual (auto-fallback can disagree)

        // device-lost recovery net (§4.5) — only meaningful on the native branch
        if (usedWebGPU && r.backend?.device?.lost) {
          r.backend.device.lost.then((info) => onLost?.(info)); // resolves (never rejects) on loss
        }
        return r;
      }}
    >
      {/* ObsidianSlabGated (MeshPhysicalNodeMaterial), EffectsGated (TSL post matched to Effects.jsx) */}
    </Canvas>
  );
}
```

The two load-bearing lines: `await r.init()` (omitting it renders black — the reason r3f v9's async-`gl` exists) and
`onBackend?.(r.backend?.isWebGPUBackend ? …)` which catches the case where the gate *chose* `webgpu` but
`WebGPURenderer` silently fell back to its `WebGLBackend` — so the matrix records *which branch actually ran*, not which
we asked for.

### 4.5 The device-lost recovery net (the runtime half of the policy)

Because iOS Safari WebGPU can die on a valid pipeline (§2.1), the gate is not complete without a runtime catch that
**re-hosts onto classic `WebGLRenderer` at the same world state**:

```js
// device.lost resolves with { reason: 'destroyed' | 'unknown', message }.
// 'unknown' on iOS == the platform killed us (the §2.1 Safari case) → re-host to classic, never retry WebGPU this session.
function onDeviceLost(info, forge) {
  // 1) snapshot the world: the mutable forge store already holds it (heat, scroll, route, pourFront) — no copy needed.
  // 2) blacklist WebGPU for the rest of the session so we don't loop into another loss.
  sessionStorage.setItem('gw_webgpu_blacklist', info.reason || 'unknown');
  // 3) tear down the WebGPU Canvas and mount <ForgeCanvas/> (classic WebGLRenderer) — React swap.
  forge.setRenderer('webgl2-classic');   // chambers read the SAME forge store; user sees a single-frame hitch.
}
```

On the next `pickRenderer()` within the session, a `gw_webgpu_blacklist` entry forces `webgl2-classic` regardless of
the flag — a one-way ratchet that mirrors the thermal ladder's bottom ratchet (doc 47): once iOS has proven it will
drop the device, we do not hand it the chance again this session. (Doc 51 deep-dive 9.2 owns the full re-host mechanics;
this doc owns the *policy* of when it fires and that it is mandatory whenever the WebGPU branch is live.)

### 4.6 Key params (shared with the rest of the world)

| Param | Source | Role |
|---|---|---|
| `gw_webgpu` / `?gpu=` | localStorage / query — **UNSET in judged build** | the opt-in flag; default OFF ⇒ classic |
| `WEBGPU_NATIVE_MIN_SAFARI` | the §4.2 matrix, distilled | version allowlist; widen as iOS matures |
| `forceWebGL` | `choice === 'webgl-fallback'` | the **only** ctor knob that differs between native/fallback (doc 51) |
| `isFallbackAdapter` | `adapter.info` | refuse software WebGPU (thermal death) |
| `r.backend.isWebGPUBackend` | post-`init()` | verify chosen == actual branch; feeds the matrix |
| `device.lost.reason` | `GPUDeviceLostInfo` | `unknown` ⇒ platform kill ⇒ re-host + session blacklist |
| `dpr=[1,1.5]` | doc 29 lever #1 | DPR cap is renderer-independent; identical on every branch |

The contract: **only `forceWebGL` and the chosen renderer class differ across branches.** Everything the *world* reads —
`forge.heat`, `forge.pourFront`, `forge.route`, `PAL`, `GW_FBM_OCTAVES`, the DPR cap — is identical, so any frame-time
or look delta the matrix records is attributable to the **backend**, not to drift (doc 51 §4.6).

---

## 5. COHESION — shared palette / lighting / uniforms

A renderer gate must not fork the world's identity (00-COHESION-MAP §7; doc 30 §5; doc 51 §5). The binding rules:

- **The gate is invisible to the chambers.** Every chamber reads the same mutable `forge` store (`heat`, `pourFront`,
  `route`, `scrollVel`) and the same `PAL` (`palette.js`) regardless of which renderer the gate picked. No chamber
  branches on renderer; the `<ForgeDriver/>` remains the lone author of the uniform pool on every path
  (00-COHESION-MAP §1.5, §4.2). The gate decides *which renderer draws*, never *what is drawn*.
- **One palette, one source — the bloom selector is renderer-agnostic.** `PAL.hot/emberHot/gold/divine` stay the >1 HDR
  values that *are* the bloom selector on classic-WebGL2, native-WebGPU, and the fallback branch alike. A gate-picked
  WebGPU path that shifts the fire hue or the black point has **failed cohesion**, not "looks a bit different" — and the
  matrix's byte-parity column (Khronos-Neutral red-check) is the acceptance gate that catches it.
- **One temperature signal across all three paths.** A strike (`forge.strikeAt`, `exp(-since*3)`) surges veins, sparks,
  and bloom *in the same frame* whether the frame is WGSL, transpiled-GLSL, or classic GLSL (rule 6). The recovery
  re-host (§4.5) preserves this by re-mounting at the same `forge` state — the metal does not "reset its heat" when the
  renderer changes under it.
- **One finish, matched by number.** Whichever renderer the gate selects, the post chain reads the *literal*
  `Effects.jsx` constants (bloom threshold 0.55–0.6, `resolutionScale 0.5`, warm HueSat, crushed blacks, OLED
  grain-as-dither ≥0.03), tone-map once on the renderer (00-COHESION-MAP §3.2–§3.3; doc 51 §4.5). The gate must never
  become a reason the finish drifts.
- **The static floor is renderer-independent.** Reduced-motion / weak-device `static` (frozen warm-vein slab,
  `frameloop="demand"`, no embers, DPR 1) is produced identically on every branch (00-COHESION-MAP §10). The renderer
  gate composes *above* the tier probe (doc 47): pick renderer first, then `detectTier()` inside it. **No runtime EXR on
  any branch** — env stays the procedural Lightformer PMREM rig (00-COHESION-MAP §5.3).

The gate is, in effect, a **cohesion contract enforced at boot**: it guarantees the world's identity is independent of
the substrate, so the substrate can change (now or in a future flip) without the forge fracturing.

---

## 6. MOBILE & PERFORMANCE — the iPhone-15 envelope

The gate gets no budget exemption (00-COHESION-MAP §10; doc 29); it is *measured against* the same envelope and, more
importantly, it is the mechanism that *protects* the envelope from a bad renderer choice.

- **The probe is sub-millisecond and runs behind the loader.** `navigator.gpu` test + one `await requestAdapter()` + a
  UA parse — no render, no benchmark frame. It runs while the intro loader is up (doc 47's loader gate), so it **never
  touches first paint**. Contrast the rejected live-micro-benchmark gate (§2.4), which would stall boot ~0.5–1 s on the
  device we are protecting.
- **The gate's whole job is fill-rate-neutral.** GAELWORX is fill-rate-bound, not draw-call- or compute-bound
  (00-COHESION-MAP §10; doc 30 §2.6): a near-full-screen emissive fbm slab + bloom + a few hundred additive points, <20
  draw calls. The per-pixel fbm costs ~the same in WGSL or GLSL, so the renderer the gate picks does **not** relax the
  doc-29 levers (DPR cap 1.5, bloom `resolutionScale 0.5`, `GW_FBM_OCTAVES`, particle overdraw). The biggest single
  lever stays DPR, not the API. WebGPU's wins (native compute, low draw-call overhead, MRT) land on *not-yet-built*
  features (compute sparks doc 15/26/27, fluid doc 08) — exactly the things to prototype behind the gate, not the
  bottleneck the gate's default path carries today.
- **The matrix's thermal column is the real test.** The A16's ~51% sustained-GPU-stability (§2.2) means a WebGPU path
  must be measured *under* a 3-minute soak via the rolling-median-rise thermal proxy (no iOS thermal API). A CONDITIONAL
  matrix row only becomes eligible if its sustained rise is within ~10% of the classic control (§4.2). The gate's
  default classic path already meets doc-29's ~9–10 ms steady-state target with ~5–6 ms throttle headroom — WebGPU must
  *match* that, not just beat it cold.
- **The recovery net costs one frame, not a reload.** A `device.lost` re-host (§4.5) is a React Canvas swap at the same
  `forge` state — a single-frame hitch — versus the un-netted alternative of a black canvas until the user reloads. On
  an OLED with instant pixel response, a black frame reads as a hard crash; the net is what makes a WebGPU build
  *survivable* on flaky iOS at all.
- **Bundle budget unchanged.** `three/webgpu` + `three/tsl` + r3f v9 enter only the dynamic-imported gated chunk; the
  judged main-entry bundle is byte-identical with and without the gate present (doc 51 §6.4). The gate's *default*
  branch adds zero bytes to the shipped path.

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Order of operations (each step de-risks the next):**

1. **Lock the default to classic WebGL2 and prove the judged path never reaches the gate.** `ForgeCanvas.jsx` mounts
   classic `WebGLRenderer` directly; `pickRenderer()`/`renderer-gate.js` live only in the code-split lab bundle. Confirm
   `/` is byte-identical and `three/webgpu` is absent from the main-entry bundle.
2. **Build the boot probe with fail-safe branches first, eligibility second.** Wire every uncertainty (`no flag`,
   `!navigator.gpu`, `null` adapter, `isFallbackAdapter`, version `< min`, `init()` throw) to `webgl2-classic`/
   `webgl-fallback` *before* wiring the one green path to `webgpu`. Test each branch by forcing its condition.
3. **Verify chosen == actual.** Log `r.backend.isWebGPUBackend` after `init()` for every flag value; confirm a chosen
   `webgpu` that silently auto-falls-back is recorded as `webgl2`, not mislabeled. This is the matrix's integrity check.
4. **Build the `device.lost` recovery net and the session blacklist before any real-device run.** A WebGPU branch
   without the net is not shippable even in the lab — test it by forcing a loss (destroy the device) and confirming the
   re-host preserves `forge` state and the session ratchet prevents a re-pick.
5. **Fill the matrix from the doc-51 3-config harness on a real iPhone 15**, per point release. Mark rows
   DENY/CONDITIONAL/eligible by the §4.2 acceptance gate. **This table is the deliverable** — the gate's allowlist
   constant is just its distillation.
6. **Only widen `WEBGPU_NATIVE_MIN_SAFARI` when a row passes**, and re-measure on every iOS point release (the surface
   is still patched — §2.1). The flip to ship WebGPU to the judge waits on both a passing matrix row *and* iOS WebGPU
   proving device-lost-free on Safari 27+ (doc 51 §7).

**Pitfalls (each has bitten this class of build):**

- **Default-ON WebGPU / presence-only gate.** `navigator.gpu` exists on Safari 26.0 where real pipelines device-lost
  (§2.1). Presence is necessary, never sufficient — gate on the **version allowlist**, default OFF.
- **Forgetting `await renderer.init()`.** A sync `gl` factory returning `WebGPURenderer` renders **black** — the literal
  reason r3f v9 added async-`gl`. The probe's adapter resolves *inside* `init()`.
- **Trusting "chosen" without checking "actual."** `WebGPURenderer` auto-falls-back to `WebGLBackend` with only a
  console warning; if you don't read `r.backend.isWebGPUBackend`, your matrix records a lie.
- **Treating `requestAdapter()` as never-null.** It can resolve `null` even when `navigator.gpu` exists — always
  `await … .catch(()=>null)` and branch to classic on `null`.
- **Accepting a software adapter.** `isFallbackAdapter` (now on `GPUAdapterInfo`, not `GPUAdapter`) on a phone = thermal
  death — refuse it. Don't read the old `GPUAdapter.isFallbackAdapter` location.
- **Shipping WebGPU with no `device.lost` net.** iOS Safari kills valid pipelines (§2.1); without the re-host, that's a
  black canvas mid-judge. The net + session blacklist are mandatory whenever the WebGPU branch is live.
- **Blind on early Safari.** `GPUDevice.uncapturederror` was broken until 26.2 — on 26.0/26.1 a WebGPU build can't even
  see its own errors. Another reason the allowlist starts at 26.2.
- **Measuring eligibility cold.** The A16 sustains ~51% of peak GPU (§2.2); a row that's parity cold can fail the
  3-minute soak. Eligibility requires the *sustained* thermal-rise test, not a cold benchmark.
- **Letting `three/webgpu` into the judged bundle.** Code-split behind the flag; diff the main entry to prove zero
  growth on the shipped path.
- **A version regex that catches Chrome-on-iOS / in-app webviews.** `CriOS`/`FxiOS`/`EdgiOS` report a different
  `Version/` token; exclude them so the allowlist reflects *Safari/WebKit* WebGPU, the one the judge runs.

---

## 8. SOURCES (2025–2026)

1. ocornut/imgui — Issue #9103 "WebGPU backend fails (device lost) on Safari 26 (macOS + iOS)" (reported **2025-11-30**).
   Triangle works, a real render pass with certain pipeline/bind-group layouts trips an internal Safari assertion →
   `GPUDevice` lost; Chrome/Firefox/native fine. https://github.com/ocornut/imgui/issues/9103
2. Apple Developer — "Safari 26.2 Release Notes" (**2025-12-12**). Restored `maxStorageBuffersInFragmentStage` and
   related limits, fixed WGSL binary-arithmetic validation, `clip_distances` builtin, fixed `GPUDevice.onuncapturederror`,
   multisampled-resolve fixes. https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
3. Apple Developer — "Safari 26.0 Release Notes" (**Sept 2025**) and "Safari 26.1 Release Notes" (**2025**). WebGPU
   enabled-by-default on iOS/iPadOS/macOS/visionOS; ongoing fixes.
   https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes ·
   https://developer.apple.com/documentation/safari-release-notes/safari-26_1-release-notes
4. WebKit — "WebKit Features in Safari 26.0" (**Sept 2025**) and "WebKit Features for Safari 26.2" (**Dec 2025**).
   WebGPU ship + ongoing WGSL/limit/uncapturederror fixes. https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ ·
   https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
5. Releasebot — "Safari Updates by Apple — June 2026." Running point-release timeline incl. 26.2/26.3 WebGPU fixes.
   https://releasebot.io/updates/apple/safari
6. PlayCanvas forum — "WebGPU fails on iOS Safari" (**2025–2026**). Real-device iOS Safari WebGPU failures + fallback
   discussion. https://forum.playcanvas.com/t/webgpu-fails-on-ios-safari/42070
7. mrdoob/three.js — Issue #30099 "THREE.WebGPURenderer: WebGPU Device Lost — on examples and own project" and #30405
   "Applying a texture to a mesh causes WebGPU Device Lost" (**2025**). https://github.com/mrdoob/three.js/issues/30099 ·
   https://github.com/mrdoob/three.js/issues/30405
8. MDN — "GPU: requestAdapter()" + "GPUAdapterInfo.isFallbackAdapter" (**2025–2026**). `requestAdapter` can resolve
   null; `isFallbackAdapter` moved to `GPUAdapterInfo`; refuse software adapters.
   https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter ·
   https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapterInfo/isFallbackAdapter
9. MDN — "GPUDevice.lost" + "GPUDevice: uncapturederror event" (**2025–2026**). `lost` resolves with
   `{ reason: 'destroyed' | 'unknown' }`; `uncapturederror` for un-scoped errors.
   https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost ·
   https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/uncapturederror_event
10. gpuweb — "design/ErrorHandling.md" (**2025–2026**). Device-loss semantics, error scopes, recovery framing.
    https://github.com/gpuweb/gpuweb/blob/main/design/ErrorHandling.md
11. Ayoob AI — "Engineering Resilient Compute Pipelines: Handling WebGPU Device Loss" (**2025–2026**). `device.lost`
    listener, reason discrimination, adapter/device re-acquisition + resource rebuild. https://ayoob.ai/blog/webgpu-device-loss-recovery
12. Chrome for Developers — "What's New in WebGPU (Chrome 136)" (**2025–2026**) + the Chrome 130/135 device-lost
    recovery + reason-code improvements referenced therein. https://developer.chrome.com/blog/new-in-webgpu-136
13. GSMArena — "Apple iPhone 16 review — stress tests" (**2025**) and Notebookcheck — "iPhone 15 Pro Max thermal
    throttling … 48 °C" (**2025**) and Review Meld — "iPhone 16 Gaming Performance" (**2025**). A16 ~51% sustained GPU
    stability vs A18 ~78%; the thermal column of the matrix. https://www.gsmarena.com/apple_iphone_16-review-2749p4.php ·
    https://www.notebookcheck.net/Severe-Apple-iPhone-15-Pro-Max-thermal-throttling-reported-as-A17-Pro-appears-to-push-surface-temperatures-to-48-C-during-gaming.753143.0.html
14. three.js — "WebGPURenderer" manual (r18x) (**2025–2026**). Constructor, `forceWebGL`, `await init()`, automatic
    WebGL2 fallback, `hasFeatureAsync` deprecation, backend introspection. https://threejs.org/manual/en/webgpurenderer.html
15. utsubo — "Migrate Three.js to WebGPU (2026) — The Complete Checklist" (**2026**). r171/r184, `forceWebGL`, fallback,
    async init, detection pattern. https://www.utsubo.com/blog/webgpu-threejs-migration-guide
16. brandlens — "The Untold Revolution Beneath iOS 26: WebGPU Is Coming Everywhere" (**2025**) and webgpu.com —
    "WebGPU Hits Critical Mass: All Major Browsers Now Ship It" (**2025**). Safari 26 ship + ~79–82% global support.
    https://brandlens.io/blog/the-untold-revolution-beneath-ios-26-webgpu-is-coming-everywhere-and-it-changes-everything/ ·
    https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/

---

## 9. DEEP-DIVE CANDIDATES

- **9.1 The stability-matrix CI dashboard.** Wrap the doc-51 3-config `<FrameProbe>` + the gate's backend logger into a
  Playwright + WebGL-capture routine that emits, per iPhone-15 iOS point release, a green/amber/red matrix row
  (p50/p95/p99, sustained-rise thermal proxy, Khronos-Neutral pixel diff, device-lost count) — so "is WebGPU eligible on
  26.x yet?" becomes a re-runnable dashboard updated on each iOS bump, and `WEBGPU_NATIVE_MIN_SAFARI` is data the
  dashboard sets, not a hand-edited constant.

- **9.2 The device-lost re-host as a production safety net (not just lab).** Design and harden the §4.5 re-host so it is
  shippable: catch `device.lost` (`reason: 'unknown'`), tear down the WebGPU Canvas, re-mount classic `WebGLRenderer` at
  the exact `forge` state + scroll position in a single frame, set the session blacklist, and emit a telemetry beacon —
  the net that would make a WebGPU build *survivable* on flaky iOS even before the platform is fully stable (doc 51
  deep-dive 9.2, promoted to a gating dependency of any WebGPU ship).

- **9.3 Adapter-info-based desktop allow/deny + iOS coarse-gating.** Because iOS masks `adapter.info` (like the WebGL
  GPU string, doc 47), design the *desktop* half of the gate that *can* read vendor/architecture to allow/deny known-bad
  GPU+driver combos, while the iOS half falls back to the version-allowlist + sustained-load test — a two-jurisdiction
  policy where the probe's precision tracks what each platform actually exposes.

- **9.4 OS-version drift + remote allowlist.** The matrix changes when Apple ships an iOS point release; bake a tiny
  remote-fetchable allowlist (a versioned JSON, CSP-safe, with a hard-coded conservative default) so the gate can be
  *closed* against a newly-shipped regression — or *opened* for a newly-stable release — without redeploying the app,
  with the local default always the safe `webgl2-classic` if the fetch fails.
