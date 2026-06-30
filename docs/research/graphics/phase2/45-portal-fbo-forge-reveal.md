# 45 — Portal-FBO Forge-Reveal Room Crossfade

_GAELWORX forge-world graphics research · Phase 2 · deep-dive 45_
_Cluster: **G-architecture-perf** · Focus: `createPortal` + `useFBO` to render the outgoing and incoming
chambers to render targets and blend them in a fullscreen **blur-to-sharp** pass with an **ember-glow
trail** — the brand's signature "Forge Reveal" transition, applied to one or two marquee room swaps
(altar-approach `/about` → forge-mouth `/contact`). Budget the second scene render for iPhone._

> Read `00-COHESION-MAP.md` §4.4 (route-gated chambers, "a portal-FBO crossfade is reserved for one or two
> marquee room transitions — both in the toolbox, neither the everyday swap"), §6 (post order), and §1 (the
> master temperature system) first. Read deep-dive 31 §2.4 (the technique was *named* there) and 39 (the `U`
> pool this transition reads). This document is the concrete build of the one transition that is allowed to
> render the scene **twice** in a frame — and the contract that keeps that twice from blowing the iPhone
> budget or looking like a generic JS crossfade bolted onto the forge.

---

## 1. SCOPE — this element in the GAELWORX world

Every route swap in GAELWORX is, by default, **free**: the single persistent scene re-tempers by damping a
preset (`scenes.js`) toward the active chamber (deep-dive 31, the spine). Navigation mutates floats; the
world never tears down. That is correct for the *everyday* swap and it is why eight chambers coexist on one
iPhone context.

But the brand's **Motion Laws** (CLAUDE.md) name a specific signature beat: **"Forge Reveal — content wipes
in blur-to-sharp with an ember-glow trail."** In the DOM this is a CSS filter animation. In the 3D world it
deserves a real, cinematic, full-screen embodiment — and there is exactly one place it earns the cost: the
**marquee narrative transition** between two chambers whose geometry is genuinely different and whose meaning
is a threshold being crossed. The canonical pair: **altar-approach `/about` → forge-mouth `/contact`** —
walking from the *source* of the forge (the sacred altar, Ogham, the AE green-reveal) to its *mouth* (the
white-hot arch radiating at the viewer, embers pouring through, the CTA). That is a doorway moment. The damp-
the-preset swap cannot sell a doorway because both chambers share the same slab back-wall and just rotate;
a doorway needs the *old room to dissolve into blur and ember* while the *new room resolves out of it*.

This is the one transition that is allowed to break the "render the scene once" rule. To crossfade two
*different* room geometries you must have **both rooms' pixels at once**, which means rendering each chamber
to its own offscreen buffer (`useFBO`) from its own portaled scene graph (`createPortal`), then compositing
the two textures in a fullscreen Forge-Reveal pass. For ~600–900 ms, on `high` tier only, on one or two
named routes only, the iPhone renders the scene roughly twice. The entire job of this doc is to make that
brief double-render (a) **cohesive** — the blend, the blur, and the ember trail all read the master
temperature/noise/palette, so the transition looks like *the forge itself igniting the doorway*, not a video
wipe — and (b) **affordable** — half-resolution FBOs, a hard `high`-only gate, an instant snap fallback on
`low`/`static`, and a strict teardown so peak memory is `backdrop + two half-res targets` for under a second,
never a standing cost.

The transition is **not** a new renderer, not a second `<Canvas>`, not a route-level context swap. It is one
extra component, mounted only during the transition window, inside the existing single context, reading the
existing `U` pool and `gw_*` toolkit. Everything below holds that line.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

There are five viable ways to crossfade two 3D rooms on the web in 2025–2026. They differ on geometry-
independence, fidelity of the blur-to-sharp reveal, mobile cost, and how cleanly they bind the master system.

### 2.1 Damp-the-preset swap with a post "flash" — REJECTED for the doorway (it *is* the everyday swap)

The spine (deep-dive 31). No FBO, no second render: one scene, damp `camZ/rotY/veinScale`, optionally pulse
`U.uHeat` so the post bloom flares on nav. Cheapest possible; correct for routes that share geometry. It
**cannot** crossfade two genuinely different room meshes — there is only ever one set of pixels — so the
"old room blurs into ember while the new resolves" read is impossible. Use it for six of the eight swaps;
reject it for the marquee doorway. (Wawa Sensei, *Scene Transitions with R3F*, 2025, lands single-canvas
preset swaps here as the default for narrative sites.)

### 2.2 `createPortal` + dual `useFBO` + fullscreen blend pass — RECOMMENDED

Render the **outgoing** chamber into render-target A and the **incoming** chamber into render-target B, each
via R3F `createPortal` into its own offscreen `THREE.Scene`, then draw a single fullscreen triangle whose
fragment shader mixes `texture(A)` and `texture(B)` under a progress-driven, noise-warped, blur-to-sharp
curve with an ember-glow trail. This is the modern canonical pattern: drei's `useFBO` "provides a concise way
to create a `WebGLRenderTarget` with better interface, smart defaults, and memoization," and
`createPortal` "renders 3D objects into another scene … portalled scenes are rendered offscreen … with
applications like rendering HUDs or different view angles" (pmndrs/react-three-fiber + drei docs, 2025).
Maxime Heckel's render-targets piece is the reference for the `useFrame` mechanics —
`gl.setRenderTarget(target) → gl.render(scene, camera) → gl.setRenderTarget(null)`, then the target's
`.texture` feeds a material uniform (*Beautiful and mind-bending effects with WebGL Render Targets*, Maxime
Heckel; the technique write-up the cohesion map already cites). The blend pass is where the brand lives: the
mix curve, the blur, and the ember trail are *our* shader, reading `U.uTemp`/`gw_fbm`/`PAL`. Tradeoffs:
maximal control over the reveal look, geometry-independent (the two rooms can be totally different), binds the
master system perfectly; cost is two scene renders + one blur pass during the window — the budget problem §6
solves. **This is the pick.**

### 2.3 `RenderTransitionPass` (three.js stock transition) — STRONG REFERENCE, wrong harness

three.js ships a stock scene-transition: the `webgl_postprocessing_transition` example uses
`RenderTransitionPass` to blend two scenes through a transition texture (threejs.org examples, live in 2025–
2026; "Three.js includes a `RenderTransitionPass` among its post-processing tools, specifically designed for
blend transitions" — *The Complete Guide to Three.js Post-Processing in 2026*, threejsroadmap.com). It is the
exact shape of what we want — two scenes, a mix driven by a threshold texture — and a perfect *reference* for
the threshold-noise blend math. But it lives in the **stock `EffectComposer`** harness, while GAELWORX runs
the **pmndrs `@react-three/postprocessing`** composer (one merged `EffectPass`, half-float buffer, the locked
post order of cohesion-map §6). Bolting a stock `Pass` beside the pmndrs composer means two composers or a
fragile insertion into the pmndrs chain — both fight the "one composer, one finish" rule. Verdict: **steal its
blend/threshold math, not its harness.** Implement the blend as our own R3F component (2.2) so it stays inside
the one-composer contract and reads `U`.

### 2.4 drei `<RenderTexture>` / `MeshPortalMaterial` portal-mesh — SITUATIONAL, not the doorway

drei's `<RenderTexture>` and `MeshPortalMaterial` render a portaled scene onto a *mesh's surface* (a window,
a gem facet, a literal doorway plane) — `drei/src/core/RenderTexture.tsx` (pmndrs, 2025). Beautiful when the
"other room" lives *inside an object in this room* (a scrying-pool that shows another chamber, a jewel facet
that reflects the forge-mouth). That is a **diegetic portal**, not a **full-screen transition**: it occupies a
mesh, not the whole frame, and it does not crossfade *the camera's whole view* from one room to another.
Keep it in the toolbox for the scrying-pool `/voice` "window into the forge" idea (a future deep-dive), but it
is the wrong primitive for the altar→mouth doorway, which must take over the entire screen. (It is also a
good fallback shape if we ever want the transition to read as "the doorway opens" — render the incoming room
into a `MeshPortalMaterial` on an expanding arch plane — see §9.)

### 2.5 TSL `RenderPipeline` node-graph transition (WebGPU) — FUTURE, NOT THE JUDGE

three r183 introduced `RenderPipeline`, "a node-based replacement … the newer system uses TSL … instead of
writing raw GLSL," letting passes *share scene data between them* (threejsroadmap, *Complete Guide to Three.js
Post-Processing in 2026*). On `WebGPURenderer`, a transition is a node graph: two scene-color nodes feed one
`mix()` node driven by a shared `uniform()` — the native form of "one bus, every effect," and the exact TSL
analogue of our blend pass (Heckel, *Field Guide to TSL and WebGPU*, Oct 14 2025). This is where the
transition *ports* (deep-dive candidate), authored so the GLSL blend maps 1:1 to a TSL node. But it is a
`WebGPURenderer` migration, and the cohesion map (§10) is explicit: WebGL2 + `onBeforeCompile` ships to the
iPhone-15 judge; the WebGL2-fallback branch of `WebGPURenderer` is the documented mistake to bet the judge on.
**Author TSL-portable, ship GLSL.**

---

## 3. RECOMMENDED APPROACH for GAELWORX

**Build a single route-gated, `high`-tier-only `<ForgeReveal>` component that, during the transition window,
renders the outgoing and incoming chambers via `createPortal` into two offscreen scenes, captures each into a
half-resolution `useFBO` target, and composites them in one fullscreen blur-to-sharp Forge-Reveal pass whose
mix curve, blur, and ember trail are driven by `gw_fbm` + `U.uTemp`/`U.uHeat` + `PAL`. Steal the
threshold-blend math from three's `RenderTransitionPass` but keep it as our own R3F component inside the one
pmndrs composer contract. Gate it to one or two marquee routes (altar→mouth); on `low`/`static`, and on any
unlisted swap, fall back to the instant damp-the-preset snap. Author the blend shader so it maps 1:1 to a TSL
`mix()` node for the future WebGPU port.**

Justification against the brief's constraints:

- **It is the only approach that makes the blur-to-sharp + ember-trail *cohesive*.** Because the blend is our
  shader reading `U.uTemp` and `gw_fbm`, the doorway literally ignites with the same temperature signal and the
  same noise grain as the metal — "the forge igniting the threshold," not a generic dissolve. 2.3's stock pass
  cannot read `U`; 2.1 cannot crossfade geometry at all.
- **It honors every hard rule.** One renderer, one `<Canvas>`, one pmndrs composer (the blend is a *mesh in
  the scene*, drawn before post, not a second composer). No EXR. `dispose()` on the two targets at window end.
  The double-render is bounded to <1 s, `high` only, two routes only — a spike, never a standing cost.
- **It is the cohesion map's named technique** (§4.4, deep-dive 31 §2.4), finally built, with the budget
  discipline those sections demanded ("budget the second scene render carefully for iPhone").
- **It degrades to the spine.** The fallback *is* the everyday swap (2.1), already shipped — so `low`/`static`
  and reduced-motion users get a clean Brutalist-Snap cut, never a broken effect.
- **It is forward-portable** (2.5): the blend math is a `mix()` + `smoothstep` + `gw_fbm`, all of which exist
  as TSL nodes, so the WebGPU port is a re-host.

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions (already in the repo — no new dependency)

- `three` (r17x, WebGL2 + `onBeforeCompile`) · `@react-three/fiber` (v8/v9 line — `createPortal` is core) ·
  `@react-three/drei` (`useFBO`) · `@react-three/postprocessing` (the one composer). The cohesion map (31 §4.1)
  confirms "A portal-FBO crossfade uses `useFBO` (drei) — also already available." **Zero new deps.**
- TSL port (post-judge, gated): `three/webgpu` + `three/tsl` `mix()`/`texture()` nodes. Authored-for, not
  shipped.

### 4.2 The transition state machine (in the `forge` store, one writer)

The transition is driven by **one scalar** `forge.reveal ∈ [0,1]` (0 = outgoing fully shown, 1 = incoming
fully shown) plus `forge.revealFrom`/`forge.revealTo` route strings and a `forge.revealing` flag. Navigation
to a *marquee pair* sets these; the existing `<ForgeDriver/>` (deep-dive 39) damps `forge.reveal` 0→1 over the
window with a Brutalist-Snap-flavored curve (high-momentum, no bounce). One writer, `dt`-damped, no second
rAF — exactly the cohesion-map rule 6 discipline.

```js
// store.js additions — the transition is just more shared, mutable state.
forge.revealing  = false
forge.reveal     = 0          // 0..1 progress, damped by ForgeDriver
forge.revealFrom = '/about'
forge.revealTo   = '/contact'

// MARQUEE_PAIRS: the ONLY swaps that earn the FBO crossfade. Everything else snaps.
export const MARQUEE_PAIRS = new Set(['/about>/contact', '/contact>/about'])

export function startReveal(from, to, quality) {
  if (quality !== 'high' || !MARQUEE_PAIRS.has(`${from}>${to}`)) return false // → caller does instant swap
  forge.revealFrom = from; forge.revealTo = to
  forge.reveal = 0; forge.revealing = true
  return true
}
```

In `<ForgeDriver/>` (the sole writer), advance and auto-finish:

```js
if (forge.revealing) {
  // Brutalist-Snap: fast, high-momentum, no overshoot. ~0.7 s window.
  forge.reveal = damp(forge.reveal, 1, 5.5, dt)
  if (forge.reveal > 0.992) { forge.reveal = 1; forge.revealing = false } // triggers teardown (§4.6)
}
U.uReveal.value = forge.reveal               // expose to the blend material via the shared pool
```

`uReveal` is added to the `U` pool (deep-dive 39) so the blend shader reads it the same way every material
reads `uTemp` — one pool, one writer.

### 4.3 The two portaled chambers → two FBOs

`<ForgeReveal>` mounts **only while `forge.revealing`** (gated in `ForgeCanvas`). It builds two offscreen
scenes and two half-res targets, renders each chamber into its target each frame of the window, then composites.

```jsx
// src/scene/ForgeReveal.jsx — mounted only during a marquee transition, high tier only.
import { useFBO, createPortal } from '@react-three/drei' // createPortal also re-exported from fiber
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef, useEffect } from 'react'
import { forge } from '../store.js'
import { U } from './forgeUniforms.js'
import { ChamberFor } from './ChamberFor.jsx'   // returns the bespoke mesh for a route (slab + hero)
import { revealMaterial } from './revealMaterial.js'

export default function ForgeReveal({ quality }) {
  const { gl, camera, size } = useThree()
  // HALF-RES targets: the single biggest mobile lever (see §6). No depth texture needed (color-only blend).
  const res = useMemo(() => ({ w: Math.ceil(size.width * 0.5), h: Math.ceil(size.height * 0.5) }), [size])
  const fboA = useFBO(res.w, res.h, { samples: 0, depthBuffer: true, type: THREE.HalfFloatType }) // outgoing
  const fboB = useFBO(res.w, res.h, { samples: 0, depthBuffer: true, type: THREE.HalfFloatType }) // incoming

  // Two offscreen scenes; the SAME camera renders both (the doorway is a camera-aligned crossfade).
  const sceneA = useMemo(() => new THREE.Scene(), [])
  const sceneB = useMemo(() => new THREE.Scene(), [])
  const blend = useRef()

  useFrame(() => {
    const prevTarget = gl.getRenderTarget()
    const prevAuto = gl.autoClear
    gl.autoClear = true

    gl.setRenderTarget(fboA); gl.render(sceneA, camera)   // outgoing chamber → A
    gl.setRenderTarget(fboB); gl.render(sceneB, camera)   // incoming chamber → B
    gl.setRenderTarget(prevTarget); gl.autoClear = prevAuto

    // hand the two textures + shared signals to the fullscreen blend
    const m = blend.current
    m.uOut.value = fboA.texture
    m.uIn.value  = fboB.texture
    m.uReveal.value = U.uReveal.value
    m.uTemp.value   = U.uTemp.value
    m.uHeat.value   = U.uHeat.value
    m.uTime.value   = U.uTime.value
    m.uTexel.value.set(1 / res.w, 1 / res.h)
  })

  // HARD teardown so the two targets never become a standing cost (§4.6).
  useEffect(() => () => { fboA.dispose(); fboB.dispose() }, [])

  return (
    <>
      {createPortal(<ChamberFor route={forge.revealFrom} quality={quality} />, sceneA)}
      {createPortal(<ChamberFor route={forge.revealTo}   quality={quality} />, sceneB)}
      {/* fullscreen triangle drawn in the MAIN scene, BEFORE post — it is what the composer then bloom/grades */}
      <mesh frustumCulled={false} renderOrder={999}>
        <planeGeometry args={[2, 2]} />
        <primitive ref={blend} object={revealMaterial()} attach="material" />
      </mesh>
    </>
  )
}
```

Two design decisions worth stating:

1. **Same camera for both rooms.** The Forge-Reveal is a *camera-aligned* crossfade (the viewer stands still
   and the room changes around them), not a fly-through. Both portaled scenes are rendered from the live
   `camera`, so the camera journey (deep-dive 27/28) keeps running underneath and the two rooms share lens,
   fov, and DOF target. If a future variant wants a *dolly through the doorway*, give `sceneB` a slightly
   advanced camera (§9).
2. **The blend mesh lives in the MAIN scene, not in a composer pass.** Drawing a fullscreen plane with the
   two FBO textures *before* the pmndrs composer means the composite is then bloomed and graded by the **one**
   post chain (cohesion-map §6) — so the ember trail blooms with the same kernel as the metal, for free. This
   is the trick that keeps "one composer, one finish" intact while still doing a two-source blend.

### 4.4 The Forge-Reveal blend shader (the brand beat)

The fragment shader is where blur-to-sharp + ember-trail + master-system cohesion happen. It reads the two
half-res textures, a noise-warped sweep front (left-to-right, matching the pour direction and the wordmark
fill), a separable-ish cheap blur on the *incoming* texture that resolves to sharp as it arrives, and an
**ember trail** painted on the moving front from `gw_fbm` × `gw_tempColor(uTemp)`.

```glsl
// revealMaterial.js fragment — composites two FBOs into the Forge-Reveal.
// Shares gw_fbm / gw_tempColor / PAL with the whole world (inlined from shaders.js).
uniform sampler2D uOut;     // outgoing chamber (half-res)
uniform sampler2D uIn;      // incoming chamber (half-res)
uniform float uReveal;      // 0..1 transition progress (damped by ForgeDriver)
uniform float uTemp;        // master temperature → ember color
uniform float uHeat;        // strike/scroll pulse → trail intensity
uniform float uTime;
uniform vec2  uTexel;       // 1/targetSize for the blur taps
varying vec2 vUv;

${GW_FBM}            // the ONE shared fbm — no second noise (cohesion rule 2)
${GW_TEMPCOLOR}      // gw_tempColor + PAL — no private orange (cohesion rule 3)

void main(){
  vec2 uv = vUv;

  // 1) NOISE-WARPED SWEEP FRONT: left-to-right, warped by the shared fbm so the doorway
  //    edge is a molten tear, not a straight wipe. front position rides uReveal.
  float warp  = gw_fbm(vec2(uv.y * 3.0, uTime * 0.15)) * 0.18;       // vertical ripple of the edge
  float front = uv.x - (uReveal * 1.36 - 0.18) - warp;              // <0 = revealed (incoming), >0 = outgoing
  float edge  = smoothstep(0.12, -0.04, front);                     // 0..1 incoming weight across a soft band
  float band  = smoothstep(0.16, 0.0, abs(front)) ;                 // 1 near the moving front (the trail mask)

  // 2) BLUR-TO-SHARP: the INCOMING room arrives blurred and resolves to sharp as the front passes.
  //    blurAmt is high at the front, 0 once fully revealed → "Forge Reveal blur-to-sharp".
  float blurAmt = band * (3.5 * uTexel.x) ;                          // a few texels, cheap 5-tap cross
  vec3  inSharp = texture2D(uIn, uv).rgb;
  vec3  inBlur  = inSharp;
  inBlur += texture2D(uIn, uv + vec2( blurAmt, 0.0)).rgb;
  inBlur += texture2D(uIn, uv + vec2(-blurAmt, 0.0)).rgb;
  inBlur += texture2D(uIn, uv + vec2(0.0,  blurAmt)).rgb;
  inBlur += texture2D(uIn, uv + vec2(0.0, -blurAmt)).rgb;
  inBlur *= 0.2;
  vec3 incoming = mix(inSharp, inBlur, band);                        // sharp away from front, blurred at it

  // 3) COMPOSITE the two rooms under the noise-warped edge.
  vec3 outgoing = texture2D(uOut, uv).rgb;
  vec3 col = mix(outgoing, incoming, edge);

  // 4) EMBER-GLOW TRAIL on the moving front — the brand's signature. Painted with the SHARED
  //    temperature color so it is the same fire as the metal, ramped by uHeat (strike couples it).
  float emberN = gw_fbm(vec2(uv.x * 7.0 - uTime * 0.6, uv.y * 7.0)); // boiling ember texture along the front
  float ember  = band * (0.55 + 0.45 * emberN) * (0.8 + uHeat * 0.9);
  vec3  emberC = gw_tempColor(clamp(uTemp + 0.35, 0.0, 1.0));        // hotter than ambient → it BLOOMS (>1)
  col += emberC * ember * 1.7;                                       // HDR add → caught by the one bloom pass

  gl_FragColor = vec4(col, 1.0);
  // NOTE: NO tonemapping here — the main composer tone-maps once, terminally (cohesion §3.2/§6).
}
```

Key shader facts:

- **The ember trail is `gw_tempColor(uTemp + 0.35)`**, i.e. the *same* temperature ramp the metal uses,
  pushed hotter so it exceeds 1.0 and therefore blooms through the **one** post chain. No new orange, no
  per-effect bloom — the palette *is* the bloom selector (cohesion §3.1), and the trail inherits it.
- **Blur-to-sharp is `band`-masked**, so only the moving front is soft; the already-revealed incoming room is
  pixel-sharp. That is the literal "blur-to-sharp" Motion Law, not a global gaussian.
- **The sweep is left-to-right, warped by `gw_fbm`** — the same direction as the pour and the wordmark fill,
  and the same noise basis as the metal, so the doorway tears open like cooling metal, not like a slideshow.
- **No tone-map in this shader.** The composite is consumed by the one terminal composer; double tone-mapping
  is the cohesion-map §3.2 sin.

### 4.5 Wiring the swap (caller side)

Navigation decides snap-vs-reveal. In the router/layout nav handler:

```js
function onNavigate(to) {
  const from = forge.route
  const did = startReveal(from, to, forge.quality)   // true only for marquee pairs on high
  forge.route = to                                   // route changes immediately either way
  // if !did: the spine's damp-the-preset swap runs (the everyday, free path). Nothing else to do.
}
```

When `startReveal` returns `true`, `<ForgeReveal>` mounts (it's gated on `forge.revealing`), takes over the
visible frame for ~0.7 s, then unmounts. When it returns `false`, the world just damps to the new preset as
always. The `forge.route` itself flips immediately so all the *non-visual* route state (SEO, nav active link,
the underlying chamber heroes) is correct from frame one; only the *pixels* crossfade.

### 4.6 Mount / teardown discipline (the standing-cost killer)

`<ForgeReveal>` is mounted by React **only** when `forge.revealing` is true:

```jsx
// ForgeCanvas.jsx
{quality === 'high' && <RevealGate />}   // RevealGate mounts <ForgeReveal/> iff forge.revealing
```

`RevealGate` is a tiny `useFrame` poll that flips a `useState` when `forge.revealing` changes — so the
component **unmounts** at window end, firing the `useEffect` cleanup that calls `fboA.dispose()` /
`fboB.dispose()` and lets the two offscreen scenes be GC'd. Per the cohesion map's hard rule,
`renderer.info.memory` must be **flat** after a transition round-trip: if `textures`/`renderTargets` climb,
the targets aren't disposing. Peak memory during the window is `backdrop + two half-res HalfFloat targets`
(~`2 × (w/2 × h/2 × 8 bytes)` ≈ a few MB at iPhone resolution) for <1 s — a spike, never a tax.

---

## 5. COHESION — shared palette / lighting / uniforms with the rest of the world

The transition is built to *disappear into* the world, never sit on top of it. Every cohesion-map rule (§7)
is honored:

- **One temperature, never invented (rule 1).** The ember trail is `gw_tempColor(uTemp + bias)` — the master
  ramp, the same one the slab veins, the pour, and the cooling letters use. The doorway is *the same fire*.
- **One noise, never forked (rule 2).** The edge warp and the ember texture are both `gw_fbm` at the shared
  `GW_FBM_OCTAVES`. The doorway tears with the same grain the metal flows in. No `revealNoise()`.
- **Only `PAL`, 60/30/10, only the accent blooms (rule 3).** The trail color is the ember-gold accent band
  (>1.0), so it — and only it — blooms through the one composer. The two room textures are already-graded HDR
  the chambers produced; the blend doesn't recolor them.
- **Lit only by the metal (rule 4).** No light is added for the transition; the trail *is* emissive metal
  light. The two FBO renders use the same one procedural env and the same emissive-as-light model the live
  scene uses — they are literally the same chambers, just rendered offscreen.
- **The A/E keystone survives the crossfade (rule 5).** Because `<ChamberFor>` renders the *real* chambers
  into the FBOs, the divine-fire A/E in altar-approach (the Ogham reveal) and the white-hot arch in forge-mouth
  are present in both source textures with their `uIsAE`/`uAEFire` paths intact. The doorway never clamps or
  recolors them — it just sweeps from one to the other.
- **One clock, one writer, dt-damped (rule 6).** `forge.reveal` and `U.uReveal` are advanced by the **single**
  `<ForgeDriver/>` via `damp()`. No second rAF, no `lerp(a,b,k)`. A strike mid-transition surges `U.uHeat`,
  which the trail reads (`+ uHeat*0.9`), so the doorway flares on the same heartbeat as everything else.
- **One composer, one finish (rule 7).** The blend is a *mesh drawn before post*, not a second composer or a
  stock `Pass`. The composite goes through the same half-float buffer, the same bloom threshold, the same AgX/
  ACES grade. The transition cannot look graded differently because it is graded by the same chain.

The acceptance image: the altar dissolves into a molten, ember-veined tear that sweeps left-to-right and
resolves into the white-hot forge-mouth — and a viewer cannot point to where "the transition effect" starts
and "the forge" ends, because they are one shader system.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The whole risk of this technique is the **second (and third) render in one frame**: two chamber renders + one
blur composite, during the window, on a device whose enemy is fill-rate (cohesion §10). The budget is held by
five levers, in priority order:

1. **Half-resolution FBOs (the dominant lever).** Render both rooms at `0.5×` linear (`0.25×` the pixels).
   On a pure-void emissive-fbm world, fill-rate *is* the cost (cohesion §10), so half-res roughly quarters the
   per-room fragment cost. The crossfade is in motion and ember-glowing, so the half-res softness is invisible
   — and the moving front is *deliberately blurred* anyway. The 2025 mobile guidance is explicit that dynamic
   resolution between DPR 1–1.5 avoids GPU throttling on handsets (Codrops, *Building Efficient Three.js
   Scenes*, Feb 2025; the responsive-mobile guides reiterate the 1–1.5 ceiling). We render the *transition* at
   half of an already-1.5-capped backbuffer.
2. **`high`-tier-only hard gate + two routes only.** `startReveal` returns `false` on `low`/`static` and on
   any non-marquee pair, so the FBO path **never even mounts** outside its envelope. The iPhone-15 boots
   `high` (cohesion §10) and so *gets* the doorway, but the spike is bounded to one or two swaps, each <1 s.
   The thermal model (throttle after ~90 s) is safe because the double-render is a sub-second event, not a
   steady-state load.
3. **Short, snappy window (Brutalist Snap).** ~0.7 s (`damp λ≈5.5`), high-momentum, no bounce — so the
   double-render lasts ~40 frames, not seconds. A shorter window is *both* more on-brand (impact, not float)
   *and* cheaper. The brand and the budget agree here.
4. **5-tap blur, not separable gaussian.** The blur-to-sharp is a 5-tap cross on the *incoming* texture only,
   masked to the front band — a handful of taps on a half-res texture, not a multi-pass blur pyramid. The ember
   bloom is delegated to the **existing** half-res `mipmapBlur` bloom (cohesion §6) — we don't add a blur pass.
5. **Color-only targets, no MRT, no depth-texture read.** The blend needs only `.texture` (RGB). Targets are
   `HalfFloatType` (to preserve the >1 emissive into the one bloom, cohesion §6) with a depth *buffer* for
   correct intra-room sorting but **no depth-texture sampling** and **no multisample** (`samples: 0`) — the
   moving blur hides aliasing. This keeps each target to one color attachment.

**Tiered behavior:**

- **`high` (iPhone 15, DPR≤1.5)** — full FBO crossfade at half-res on the two marquee pairs; everything else
  snaps. Steady-state is unaffected (the component is unmounted except during the window).
- **`low`** — `startReveal` returns `false` everywhere → **instant damp-the-preset swap** (the spine, §2.1).
  No FBO, no second render. The user still gets a clean Brutalist-Snap room change; they just don't get the
  cinematic blur tear. This is a *dignified* fallback, not a broken one (cohesion §10 / rule 9).
- **`static` / reduced-motion** — same as `low`: instant swap, `frameloop='demand'`. No motion, no double
  render, fully on-brand.

**INP / first-interaction insurance.** The blend program and `<ForgeReveal>`'s shaders should be warmed with
`renderer.compileAsync` at boot on `high` (cohesion §10) so the *first* marquee transition doesn't stall on a
shader compile mid-nav. The two FBOs are allocated on mount (in the window), which is a small, one-time GPU
alloc; pre-allocating them at boot is an option if the first transition shows a hitch, but it trades standing
memory for latency — measure before paying it.

**The flat-memory proof.** After A→B→A→B round-trips, `renderer.info.memory.textures` and `.renderTargets`
must return to baseline. If they climb, the `dispose()` in §4.6 isn't firing (the component isn't unmounting)
— the single most likely perf bug here.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Order of operations** (each step builds + `qa-route` at 393×852 + 1440×900, 0 console errors, before the
next):

1. **State machine first, no FBO.** Add `forge.reveal*` + `U.uReveal` + `startReveal` + the `<ForgeDriver/>`
   advance. Wire the nav so a marquee pair sets `revealing` and the rest snaps. Verify `forge.reveal` ramps
   0→1 and auto-finishes — with **no visual yet**. This isolates the control flow from the rendering.
2. **One FBO, one room.** Render only the *outgoing* chamber into `fboA` and blit it full-screen (mix = the
   raw texture). Confirm it looks identical to the live scene (proves the portal+FBO+camera path is correct
   before blending). Watch `renderer.info.memory` is flat on unmount.
3. **Two FBOs, hard wipe.** Add `fboB`, composite with a *straight* `step(uReveal, uv.x)` edge (no noise, no
   blur, no ember). Confirm the two rooms crossfade and the window tears down cleanly.
4. **The brand look.** Add the `gw_fbm` edge warp, the band-masked blur-to-sharp, then the ember trail last
   (it's the most tunable). Tune *through the tone-mapper on the device* — the ember must read white-gold-hot
   and bloom, not flat orange (cohesion §3.2; author for AgX/ACES output, not raw value).
5. **The gate + fallback.** Confirm `low`/`static` and non-marquee pairs snap (never mount the FBO path).
   Confirm reduced-motion snaps. iPhone 15 OLED read: bloom spread on the trail, true-black void between
   rooms, the white-gold divine-fire surviving the crossfade.

**Pitfalls, ranked:**

1. **Targets that never dispose (#1 perf bug).** If `<ForgeReveal>` is conditionally *rendered* but its parent
   never unmounts, the cleanup effect doesn't fire and the two half-res targets leak every transition. Gate the
   **component's mount** with React conditional rendering (the `RevealGate` pattern, §4.6), not visibility, and
   verify `renderer.info.memory` returns to baseline.
2. **Tone-mapping twice.** The chambers' FBO renders are pre-tone-map HDR (or post — pick one and be
   consistent), and the blend must **not** tone-map; the one terminal composer does. Tone-map in the blend and
   the doorway washes out vs. the live frame (cohesion §3.2). Render the chambers to *linear HDR* targets
   (`HalfFloatType`), blend in linear, let the composer grade the composite once.
3. **`autoClear` / render-target state bleed.** Always save and restore `gl.getRenderTarget()` and
   `gl.autoClear` around the offscreen renders (§4.3). Forgetting to restore the target leaves the *main* pass
   drawing into `fboB` → black canvas. This is the classic `useFBO`-in-`useFrame` footgun (Maxime Heckel,
   render-targets write-up; the pmndrs crossfade discussion #421 is the canonical "FBO issues" thread).
4. **Two cameras drift.** Rendering the two rooms from two *separate* cameras that aren't kept in sync makes
   the crossfade swim. Use the **one live `camera`** for both (§4.3) unless you deliberately want a dolly-
   through (then offset `sceneB`'s camera by a tracked delta, §9).
5. **Forking noise/orange (the cohesion crack).** The temptation is to write a quick `mix` with a hand-picked
   orange and a fresh `noise()`. That is exactly the bolt-on the cohesion map guards against. The trail color
   **must** be `gw_tempColor(uTemp+bias)` and the edge **must** be `gw_fbm` at the shared octaves.
6. **Rendering the transition every nav.** If the gate is wrong and the FBO path mounts on every route swap,
   the steady-state cost doubles. The gate is `high` AND marquee-pair AND `revealing` — all three.
7. **Half-res depth mismatch.** The two FBOs need their *own* depth buffer at half-res for correct intra-room
   sorting; don't share the main depth buffer (different resolution). `useFBO(w/2,h/2,{depthBuffer:true})`
   gives each its own.
8. **Blocking the first transition on a cold compile.** The blend shader is new GLSL; without
   `compileAsync` warm-up the first marquee nav can stall a few hundred ms mid-scroll. Warm it at boot on
   `high`.
9. **Camera/Lenis jank during the window.** The camera journey keeps running under the crossfade; make sure the
   nav doesn't *also* hard-cut `camZ` (that would be visible in both source textures). Let the camera damp
   normally; the crossfade hides the rest.

---

## 8. SOURCES (2025–2026)

1. pmndrs/react-three-fiber + drei — *`createPortal` / `useFBO` (Fbo) docs* — `createPortal` renders into a
   separate offscreen `THREE.Scene`; `useFBO` returns a memoized `WebGLRenderTarget` with smart defaults; the
   `gl.setRenderTarget → gl.render → gl.setRenderTarget(null)` loop. https://drei.docs.pmnd.rs/misc/fbo-use-fbo
   · https://r3f.docs.pmnd.rs (2025)
2. Maxime Heckel — *Beautiful and mind-bending effects with WebGL Render Targets* — the canonical
   render-to-target `useFrame` mechanics, portal/render-target texture-as-uniform blending, the FBO technique
   underpinning crossfades. https://blog.maximeheckel.com/posts/beautiful-and-mind-bending-effects-with-webgl-render-targets/
   (cited live in 2025–2026 R3F write-ups)
3. Three.js Roadmap — *The Complete Guide to Three.js Post-Processing in 2026* — `RenderTransitionPass` as the
   stock blend-transition; r183 `RenderPipeline`/TSL node post-processing as the WebGPU successor that shares
   scene data between passes; `OutputPass`/tone-map terminality.
   https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026 (2026)
4. three.js examples — *webgl_postprocessing_transition (scenes transition)* — the stock two-scene blend driven
   by a transition/threshold texture; reference for the mix/threshold math.
   https://threejs.org/examples/webgl_postprocessing_transition.html (live, r17x, 2025–2026)
5. Wawa Sensei — *Render Target* lesson + *How to Create Scene Transitions with React Three Fiber* —
   single-canvas scene-swap/transition patterns, `useFBO` render-target usage in R3F, the recommended default
   for narrative sites. https://wawasensei.dev/courses/react-three-fiber/lessons/render-target ·
   https://wawasensei.dev/tuto/how-to-create-scene-transitions-with-react-three-fiber (2025)
6. Codrops — *Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality* — DPR 1–1.5
   ceiling on handsets, dynamic-resolution and render-target budgeting, the fill-rate-not-triangles framing for
   mobile. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
   (Feb 11 2025)
7. Maxime Heckel — *Field Guide to TSL and WebGPU* — TSL `uniform()` shared nodes, node-graph post-processing,
   the `mix()`/`texture()` node forms the GLSL blend maps to for the WebGPU port; `.onFrameUpdate` single-writer
   pattern. https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ (Oct 14 2025)
8. pmndrs/react-three-fiber — *Releases* (v10 line) — renderer-independent render targets (the `useFBO`
   successor) "without needing to branch on the active renderer," standalone `useFrame` scheduler blessing the
   single-writer pattern. https://github.com/pmndrs/react-three-fiber/releases (2025)
9. Codrops — *Letting the Creative Process Shape a WebGL Portfolio* — 2025 production WebGL transition/portfolio
   patterns (render-target driven reveals) on the modern R3F stack.
   https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/ (Nov 27 2025)
10. pmndrs/react-three-fiber — *Discussion #421: Crossfade example with R3F / FBO issues* — the canonical
    render-target-state / `setRenderTarget` restore footguns for FBO crossfades in R3F.
    https://github.com/pmndrs/react-three-fiber/discussions/421 (live ref, re-surfaced in 2025 searches)

---

## 9. DEEP-DIVE CANDIDATES

1. **`MeshPortalMaterial` "the doorway opens" variant.** Instead of a fullscreen sweep, render the incoming
   forge-mouth into a `MeshPortalMaterial` on an *expanding arch plane* that grows from the altar's center to
   fill the frame — a diegetic doorway rather than a screen-space wipe. Measure whether one portal-mesh render
   is cheaper than two full-FBO renders, and how it reads against the brand's "threshold crossed" intent.
2. **Dolly-through-the-doorway camera split.** Give `sceneB` a camera offset slightly *ahead* of the live
   camera so the crossfade also pushes the viewer forward through the mouth — the parallax that turns a
   crossfade into a *walk*. Define the offset-tracking + look-ahead so it reuses the deep-dive 27/28 camera
   journey rather than forking a second camera rig.
3. **The single-FBO progressive-pour transition.** For a cheaper mobile variant, render only the *incoming*
   room to one FBO and dissolve the *outgoing* room by re-using the wordmark/pour fill front (deep-dive
   13/19) as the transition mask — one render instead of two, the doorway as "the new room is poured in." A/B
   its cost and look against the dual-FBO crossfade on the iPhone-15.
4. **TSL `RenderPipeline` port of the blend (`revealNode.ts`).** Re-express the §4.4 fragment as a TSL node
   graph (`texture(A)`, `texture(B)`, `mix`, `gw_fbm` node, `gw_tempColor` node) on `WebGPURenderer` r183+,
   prove a 1:1 visual match to the GLSL path for the same `/about→/contact` frame, and document the WebGL2-
   fallback risk that keeps GLSL the judge-device build.
