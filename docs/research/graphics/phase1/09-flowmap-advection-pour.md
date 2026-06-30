# 09 — THE POUR: Flow-Maps & Directed-Liquid Advection

_Phase 1 graphics research · GAELWORX forge world · target r3f + three.js (WebGL), iPhone 15 OLED primary judge._

---

## 1. SCOPE

The POUR is the single most important kinetic event in the GAELWORX world: living molten metal is
released from the stone forge-ALTAR, falls as a white-hot stream, lands, and then **runs along
winding Celtic-interlace channels** carved into green-black Irish basalt — branching, rejoining,
and finally filling the GAELWORX letterforms left-to-right. This research covers the **directed,
art-controlled liquid motion** of that flow: making metal appear to travel ALONG a hand-authored
path (not a free physics sim), the **falling pour stream** (a mesh ribbon / trail with a white-hot
leading edge that cools as it falls), and the **flow-map advection** that scrolls and distorts the
molten surface texture so it churns and crawls in the channel direction. It is the connective tissue
between the altar (source), the channels (`channel-hall` chamber), and the letterforms (cooling
gradient) — it must read as ONE continuous body of metal sharing the master temperature/material
system, never a particle gimmick bolted onto static geometry.

---

## 2. TECHNIQUE LANDSCAPE (2025–2026)

There are four distinct sub-problems — **(a) surface flow in the channels**, **(b) the falling
stream**, **(c) the leading "pour front"**, **(d) the cooling temperature it carries** — and the
modern toolkit attacks each differently. Honest tradeoffs below.

### A. Surface flow along the channels

**A1 — Flow-map advection (UV distortion by a baked direction field).** A flow-map is a texture
whose R/G channels encode a 2D flow vector per texel; the fragment shader samples it and offsets the
molten texture's UVs along that direction over time. The classic fix for the "stretch artifact" is
**two phase-offset samples cross-faded on a sawtooth** (`fract(time)` and `fract(time+0.5)`,
blended by `abs(0.5 - phase)*2`) so the texture resets before it smears. This is the canonical
water/lava technique and remains the 2025 baseline; the three.js forum's 2025 flow-map threads and
John Sietsma's write-up describe exactly this two-sample cross-fade ([three.js forum, Flow Map
generator, 2025](https://discourse.threejs.org/t/flow-map-generator-for-water-effect-in-three-js/68941)).
**Quality:** excellent, fully art-directed. **Perf:** ~2 extra texture fetches — cheap, mobile-fine.
**Complexity:** low-medium (need to author/bake the flow-map). **Best fit for GAELWORX** because the
Celtic channels are a FIXED, hand-designed path — a baked flow-map is the literal encoding of "metal
goes this way."

**A2 — Domain-warped scrolling noise (no texture).** What the existing slab already does: `gw_fbm`
domain-warp + a directional time term (`uTime*0.05`). Pure procedural, zero texture memory, but the
flow direction is **global/uniform**, not per-pixel steerable around bends. Good for the *churn*
inside a channel, wrong for *which way* a winding channel runs. **Use as a layer, not the steering.**

**A3 — Full GPU fluid (semi-Lagrangian advection / Navier–Stokes).** Ping-pong FBOs, a velocity
field advected by sampling *backward* along itself (`p_prev = uv - velocity*dt`), pressure solve,
GPUComputationRenderer. 2025 has multiple ready implementations: mofu-dev's "Stable Fluids with
three.js" ([2025](https://mofu-dev.com/en/blog/stable-fluids/)) and bandinopla's MIT WebGL+TSL fluid
port ([three.js forum, Jul 2025](https://discourse.threejs.org/t/fluid-simulation-using-shaders-tutorial/85109)).
**Quality:** stunning, emergent. **Perf:** several full-screen passes per frame — **over budget on
mobile** and, worse, **uncontrollable** — real fluid won't politely follow an interlace knot. Reject
as the primary technique; keep semi-Lagrangian advection in mind only for a tiny localized splash at
the altar mouth if budget allows.

**A4 — GPGPU flow-field particles.** A spatialized direction field pushes thousands of GPU particles
(Three.js Journey's GPGPU Flow Field lesson, [2025 refresh](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders);
WebGPU compute makes this 10–100× cheaper per the [Utsubo WebGPU migration guide, Jan
2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)). Perfect for the **sparks** that
orbit the pour front (topic 11), and a great *secondary* read on the molten surface, but particles
alone don't make a continuous liquid sheet. **Complementary, not the surface.**

### B. The falling pour stream

**B1 — TubeGeometry along a CatmullRom curve + scrolling emissive UV.** Build a `THREE.TubeGeometry`
from a `CatmullRomCurve3` (the pour arc from altar lip to channel), then scroll the V coordinate of
an emissive molten texture along the tube length so the metal appears to *fall through* the tube.
TubeGeometry's UVs run cleanly along the path, so a `vUv.y - uTime*speed` offset = directed downward
flow ([TubeGeometry docs](https://threejs.org/docs/#api/en/geometries/TubeGeometry); Codrops
"Infinite Tubes" pattern, revived in 2025/2026 tube tutorials). **Quality:** great, stable,
art-locked. **Perf:** one mesh, cheap. **This is the recommended stream.**

**B2 — Ribbon / mesh-trail (history-buffer geometry).** A flat ribbon whose vertices are a rolling
history of a moving emitter point, à la Codrops "High-speed Light Trails." Good when the pour
*moves* (e.g., the altar tips). For a fixed pour the static tube (B1) is simpler and cheaper; keep
the trail technique for the **moving pour-front along the channels**, where the leading edge travels.

**B3 — Billboard particle column.** A vertical strip of additive particles. Cheapest, but reads as
sparks/smoke, not a coherent metal rope. Use only as the low/static-tier fallback for the stream.

### C. The leading "pour front" (the white-hot edge)

A scalar `uFill` (0→1) drives a **moving boundary** along the channel/letter UV: `smoothstep` of
`uFill ± edgeWidth` against the path coordinate gives a sharp white-gold leading band that advances.
Codrops' 2025 stylized-water shader uses exactly this smoothstep-on-a-coordinate band pattern for
shorelines ([Codrops, Mar 2025](https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/));
the same math draws the advancing molten front. The leading edge is the hottest sample of the
temperature curve; everything behind it cools.

### D. The cooling temperature the flow carries

The flow front maps a **path coordinate → temperature** (white-hot → orange → forge-red →
iron-black). This is the **master temperature system** — the SAME `tempToColor()` ramp the cooling
letterforms use — sampled at `front - travelled` so metal cools the longer it's been still. The
A and E letters clamp temperature to ∞ (divine fire). See §5.

**TSL/WebGPU note.** Since Safari 26 (Sep 2025) WebGPU ships on iOS, and three.js r171+ makes the
renderer swap near one line ([Utsubo, Jan 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide);
[Maxime Heckel, "Field Guide to TSL and WebGPU," Oct 2025](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)).
Codrops' Shader.se case study ([May 2026](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/))
ships a production TSL pipeline. **For GAELWORX Phase 1 we stay on WebGL/GLSL** (the slab is
`onBeforeCompile` GLSL and the whole codebase is WebGL) but author the flow logic so it ports to TSL
later — it's all texture fetches + `mix`/`smoothstep`, which TSL expresses 1:1.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**A hybrid, fully art-directed stack — no live fluid sim:**

1. **Channels (surface):** a **baked flow-map** (A1) driving two-sample cross-faded UV advection of
   a procedural molten texture, *layered over* the existing `gw_fbm` domain-warp churn (A2) for
   detail. The flow-map is the steering; the noise is the life.
2. **Falling stream:** a **TubeGeometry along a CatmullRomCurve3** (B1) with scrolling emissive V
   and a white-hot top that cools downward.
3. **Pour front:** a **`uFill` smoothstep band** (C) advancing along channel & letter UVs, gated by
   the journey/scroll so the pour progresses as the user moves through the page.
4. **Temperature:** every one of the above samples the **shared `tempToColor` ramp** (D, §5), so the
   stream, the channel flow, the front, and the letters are visibly the same cooling metal.
5. **Sparks** (topic 11) ride the front via GPGPU/flow-field as a separate additive layer.

**Why this and not a sim:** GAELWORX needs a Celtic knot of metal that branches and *rejoins* on a
designed path — emergent fluid fights that. A baked flow-map is the *literal data encoding* of the
hand-drawn interlace; it's deterministic, cheap, mobile-safe, and it shares the slab's exact shader
idioms (`onBeforeCompile`, `gw_fbm`, dt-damped store uniforms, HDR-only-blooms). It is buildable in
THIS codebase with the existing patterns and zero new heavy dependencies.

---

## 4. IMPLEMENTATION

### Libraries / versions
- **three.js** (current repo r17x WebGL) — `TubeGeometry`, `CatmullRomCurve3`, `MeshPhysicalMaterial` + `onBeforeCompile` (the repo's shader-fx pattern).
- **@react-three/fiber**, **@react-three/drei** (already in repo). No new deps required.
- Flow-map: a small **128×128 RG texture** authored once (Blender/Substance/Photoshop or a one-off baking script), shipped as a static asset (NOT runtime-generated, NOT EXR — honors the "no runtime EXR" rule). Channels: R = flow.x*0.5+0.5, G = flow.y*0.5+0.5.

### The shared temperature ramp (put in `src/scene/shaders.js`, reused everywhere)

```glsl
// gw_temp: 0 = iron-black/cold  → 1 = white-hot. The MASTER cooling curve.
// Used by the pour, the channel flow, the front, AND the letterforms.
vec3 gw_temp(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 black  = vec3(0.04, 0.02, 0.02);          // iron-black w/ ember hint
  vec3 red    = vec3(0.76, 0.16, 0.06);          // Celtic Blood #C1292E-ish
  vec3 ember  = vec3(1.0,  0.36, 0.12);          // Ember Glow #E85D04 (HDR-ready)
  vec3 white  = vec3(1.9,  1.45, 0.95);          // white-hot core (HDR > 1 → blooms)
  vec3 c = mix(black, red,   smoothstep(0.0, 0.45, t));
  c      = mix(c,     ember, smoothstep(0.4,  0.8,  t));
  c      = mix(c,     white, smoothstep(0.78, 1.0,  t));
  return c;
}
```

### Channel surface — flow-map advection (HEAD block, `onBeforeCompile` on the basalt/channel mesh)

```glsl
uniform sampler2D uFlowMap;     // RG direction field, baked along the interlace
uniform sampler2D uMolten;      // (optional) molten detail; or reuse gw_fbm
uniform float uTime, uFlowSpeed, uFill, uFront; // uFront = pour-front coord 0..1
${GLSL_NOISE}                   // gw_fbm etc., already in shaders.js

// two-sample cross-fade advection: kills the UV-stretch smear
vec3 gwAdvect(vec2 uv, vec2 flow){
  float t   = uTime * uFlowSpeed;
  float p0  = fract(t);
  float p1  = fract(t + 0.5);
  float w   = abs(0.5 - p0) * 2.0;                 // triangle blend weight
  float n0  = gw_fbm((uv - flow * p0) * 3.0);      // detail scrolled along flow
  float n1  = gw_fbm((uv - flow * p1) * 3.0);
  float molten = mix(n0, n1, w) * 0.5 + 0.5;
  // moving pour-front: hot band advances along the path coordinate (here uv.x
  // mapped to channel arc-length; use a baked arc-length channel for true winding)
  float front = smoothstep(uFront + 0.04, uFront, uv.x);   // 1 behind front, 0 ahead
  float temp  = front * (0.35 + 0.65 * molten);            // body temp + churn
  temp        = max(temp, smoothstep(uFront, uFront+0.02, uv.x) * 0.0); // ahead = cold
  // white-hot leading lip
  temp += smoothstep(0.03, 0.0, abs(uv.x - uFront)) * 0.9 * step(uv.x, uFront);
  return gw_temp(temp);
}
```

In COLOR block: `vec2 flow = texture2D(uFlowMap, vUv).rg * 2.0 - 1.0; gl_FragColor.rgb += gwAdvect(vUv, flow) * uFill;` — added **before** `#include <tonemapping_fragment>` exactly like the slab, so HDR whites bloom via the existing `Bloom luminanceThreshold={0.55}`.

### Falling stream — r3f component shape

```jsx
function PourStream({ quality }) {
  const matRef = useRef()
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.2, 0),    // altar lip
    new THREE.Vector3(0.15, 1.6, 0.1),
    new THREE.Vector3(0, 0.2, 0),    // channel entry
  ]), [])
  const geo = useMemo(
    () => new THREE.TubeGeometry(curve, quality === 'high' ? 64 : 24, 0.06, 8, false),
    [curve, quality])
  useEffect(() => () => geo.dispose(), [geo])

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false })
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uTime:{value:0}, uFlowSpeed:{value:1.2} })
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${TEMP_HEAD}`)
        .replace('#include <map_fragment>', `
          float v = fract(vUv.y - uTime * uFlowSpeed);      // scroll DOWN the tube
          float coreTemp = mix(1.0, 0.55, vUv.y);           // white-hot top → cooler base
          float ridges = 0.7 + 0.3 * sin(vUv.y*40.0 - uTime*6.0); // molten ripples
          diffuseColor.rgb = gw_temp(coreTemp) * ridges;
          diffuseColor.a   = smoothstep(0.0, 0.15, v) * (0.85);`)
    }
    return m
  }, [])
  useFrame((s, dt) => { if (matRef.current)
    matRef.current.uniforms.uTime.value =
      forge.quality === 'static' ? 2 : s.clock.elapsedTime })
  return <mesh geometry={geo} material={material} ref={matRef} />
}
```

### Key uniforms & parameters
| Uniform | Drives | Source |
|---|---|---|
| `uFront` (0..1) | pour-front position along the channel/letter arc | `forge.scrollDamped` / journey progress, **dt-damped** |
| `uFill` (0..1) | overall pour opacity/ignition (ramp-in) | `forge.ready` + route gate |
| `uFlowSpeed` | scroll velocity of the molten texture | constant (~1.0–1.5), leva-tunable |
| `uTime` | churn + tube scroll | `state.clock.elapsedTime`, frozen on `static` |
| `uFlowMap` | per-pixel channel direction | baked static RG texture |

### Hooking the master temperature system
`gw_temp()` lives once in `shaders.js` and is `${imported}` into the pour shader, the channel shader,
AND the letterform shader. A single `range()`/damped scroll value sets `uFront` for all of them in
the **existing `useFrame`** loops (one rAF, store-driven, `THREE.MathUtils.damp` — never
frame-rate `lerp`). That's what makes stream, channel, front, and letters read as one cooling body.

---

## 5. COHESION

- **Palette:** `gw_temp` is built from `PAL.crimson`/`PAL.ember`/`PAL.hot` (Celtic Blood #C1292E,
  Ember Glow #E85D04, white-hot HDR). No new colors. Basalt stays the green-black void family.
- **Lighting / bloom:** the white-hot lip and divine-fire A/E exceed 1.0 → they're the **only**
  pixels above `luminanceThreshold={0.55}`, so the existing `Effects.jsx` bloom catches exactly the
  flow's hot cores and nothing else — same discipline as the slab veins (post-fx rule: "only HDR
  blooms"; push emissive, never bloom intensity).
- **Material idiom:** identical to `ObsidianSlab.jsx` — `onBeforeCompile` chunk injection, `gw_`-
  namespaced shared noise, brand colors inlined via `v3(PAL.x)`, `m.defines={USE_UV:''}` for `vUv`,
  `dispose()` on unmount. Nothing bespoke that fights the slab.
- **A+E divine fire:** the cooling ramp is **clamped to 1.0 (white-gold) for the A and E letter
  meshes** (`uTemp = max(uTemp, isAE ? 1.0 : flowTemp)`), tying the 3D fire to the DOM `.forge-letter`
  ignite rule — the same A+E law, expressed in metal. Their glow is what RADIATES onto the basalt to
  reveal the Ogham (an emissive light contribution sampled by the stone shader).
- **Channels → letters → sparks:** all share `uFront`. The flow front leaves a channel, enters a
  letter, and the front coordinate carries continuously; sparks (topic 11) read the same `uFront`
  position to orbit the leading edge. One progress scalar, one world.
- **Motion law:** the front advance is **Forge Reveal / Drift** — constant-velocity dt-driven, no
  bounce. Scroll *flares* it (reuse the slab's `forge.scrollVel`/`uSurge` coupling) but never
  springs it.

---

## 6. MOBILE & PERFORMANCE (iPhone 15 budget)

- **Cost:** flow-map advection = 1 RG fetch + 2 `gw_fbm` (the repo's fbm is already 3 octaves —
  reuse, don't add octaves). Tube stream = 1 cheap additive mesh. Total well under the slab's own
  cost. No extra render targets, **no fluid passes** — that's the whole reason a sim was rejected.
- **Quality tiers (honor `useQuality` → high|low|static):**
  - **high:** tube 64 segments, two-sample advection, full `gw_fbm` detail, sparks on.
  - **low:** tube 24 segments, single-sample advection (drop the cross-fade — accept mild smear),
    halve `uFlowSpeed`, fewer/no sparks.
  - **static** (`prefers-reduced-motion`): freeze `uTime` (`= 2` constant, the slab's pattern),
    render the pour as a **still hot stream + a fixed mid-fill** — a frozen "mid-pour" poster. No
    advection animation, `frameloop='demand'`.
- **Texture budget:** one 128×128 RG flow-map (≈ negligible). Bake offline; ship as a static PNG.
  Never generate it at runtime, never load an `.exr`/`.hdr` (the env-black-canvas scar).
- **Fill-rate:** the additive tube can overdraw — keep its radius thin (0.06) and `depthWrite:false`;
  on `low`, drop tube radial segments to 6.
- **Overdraw of bloom:** because only the hot lip is HDR, bloom area stays small → cheap mipmap bloom.
- **WebGPU upside (future, not Phase 1):** moving sparks to compute is 10–100× cheaper and Safari 26
  now supports it on iOS — a clean Phase-2 lever, but ship WebGL first (the codebase, the fallback
  poster, and `qa-route` SwiftShader CI all assume WebGL/GLSL).

---

## 7. GET-IT-RIGHT-FIRST-TIME

**Pitfalls (each has bitten this technique class):**
1. **UV-stretch smear** — single-sample flow-map advection smears as `fract(t)` grows. Use the
   two-sample cross-fade from day one on `high`; only degrade to single-sample on `low`.
2. **Flow direction in the wrong space** — flow-map RG must be decoded `*2.0 - 1.0` and must match
   the channel UV winding. If metal flows "uphill," your bake or your UV unwrap is mirrored; verify
   with a debug `gl_FragColor = vec4(flow*0.5+0.5, 0, 1)`.
3. **Front coordinate ≠ arc-length** — using raw `uv.x` makes the front advance at uneven speed
   around a knot. For true winding speed, bake an **arc-length channel** (a 3rd texture channel or B
   channel) so `uFront` walks the path at constant velocity. Phase-1 can fake it with `uv.x`; flag
   arc-length as the correctness upgrade.
4. **Bloom washing everything** — if the whole stream glows, you pushed body temp HDR. Keep only the
   *lip* and *A/E* above 1.0; body stays ≤1.0. (post-fx rule.)
5. **Tube UV seam / twist** — `CatmullRomCurve3` + `TubeGeometry` can twist the V seam on sharp
   bends; keep the pour arc gentle, or use `closed:false` + enough tubular segments.
6. **Competing rAF / frame-rate lerp** — drive `uFront` only through the existing store + `damp(...,dt)`.
   Never `setInterval`, never `lerp(a,b,0.1)`.
7. **Forgetting `static`** — reduced-motion must still show a believable frozen pour, and crawlers/
   no-JS must not depend on it.

**Order of operations (build in this sequence — each step verifiable via `qa-route`, 0 console
errors = GLSL compiled under SwiftShader):**
1. Add `gw_temp()` to `shaders.js`; unit-test it by tinting a quad — confirm the ramp reads
   black→red→ember→white. (Shared spine first.)
2. Build `PourStream` (tube + scrolling V + `gw_temp`). White-hot top, cooling base. No flow-map yet.
3. Add the **channel surface shader** with a **constant** flow direction (no map) + `uFront`
   smoothstep band; confirm the front advances and the white lip reads.
4. Bake + wire the **flow-map**; replace the constant flow with the sampled RG. Verify direction with
   the debug viz.
5. Couple `uFront`/`uFill` to `forge.scrollDamped` (dt-damped) so the pour progresses with the
   journey; reuse `forge.scrollVel` for the flare.
6. Clamp A/E meshes to divine-fire temp; add the emissive-onto-basalt Ogham reveal.
7. Wire quality tiers + the `static` frozen-pour poster.
8. Layer sparks (hand off to topic 11) reading the same `uFront`.
9. Device read on the iPhone 15 OLED (true black, bloom spread, white-gold A/E don't simulate
   headless).

---

## 8. SOURCES (2025–2026)

- Thalles Lopes, **"Creating Stylized Water Effects with React Three Fiber,"** Codrops — **2025-03-04**.
  Smoothstep shoreline band, time-driven UV motion, Leva-driven uniforms, mobile perf framing.
  https://tympanus.net/codrops/2025/03/04/creating-stylized-water-effects-with-react-three-fiber/
- Misaki Nakano (mofu), **"Stable Fluids with three.js,"** mofu-dev — **2025**. Semi-Lagrangian
  backward advection, ping-pong FBOs, GPUComputationRenderer (the sim path we deliberately reject for
  control/perf). https://mofu-dev.com/en/blog/stable-fluids/
- bandinopla, **"Fluid Simulation using Shaders (Tutorial),"** three.js forum — **2025-07-11**.
  MIT WebGL + WebGPU/TSL fluid port (advection reference). https://discourse.threejs.org/t/fluid-simulation-using-shaders-tutorial/85109
- Maxime Heckel, **"Field Guide to TSL and WebGPU,"** maximeheckel.com — **2025-10-14**. TSL/WGSL
  node system, compute shaders, glslFn/wgslFn — the port path for the flow logic.
  https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Utsubo, **"Migrate Three.js to WebGPU (2026) — The Complete Checklist,"** utsubo.com — **2026-01-21**.
  Safari 26/iOS WebGPU status, r171+ renderer swap, compute 10–100× particle gains, fallback patterns.
  https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- Filip Kantedal, **"80s Business Tech and Seamless Scene Transitions: Inside Shader.se's
  Scroll-Driven WebGPU Pipeline,"** Codrops — **2026-05-19**. Production TSL pipeline, Lenis-driven
  scroll progress feeding scenes, selective render passes (mobile budget discipline).
  https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/
- Montek, **"Real-Time Fluid Shaders in React Three Fiber: A Deep Dive into Chai Cup Liquid,"**
  montek.dev — **2025-05-23**. Shader-faked liquid (tilt/wobble/ripple via math), uniform-driven from
  `useFrame`, refraction tint — the "illusion over sim" doctrine. https://www.montek.dev/post/real-time-fluid-shaders-in-react-three-fiber-a-deep-dive-into-chai-cup-liquid
- three.js forum, **"Flow Map generator for water effect in three.js"** (active 2025 thread) —
  flow-map authoring + two-sample cross-fade advection. https://discourse.threejs.org/t/flow-map-generator-for-water-effect-in-three-js/68941
- Bruno Simon, **"GPGPU Flow Field Particles Shaders,"** Three.js Journey (2025 refresh) — spatialized
  flow-field theory for the spark layer. https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders

---

## 9. DEEP-DIVE CANDIDATES (Phase 2)

1. **Arc-length-parameterized channel baking.** Bake a flow-map + arc-length channel directly from
   the Celtic-interlace SVG/curve so `uFront` advances at *constant metal speed* through every knot,
   and branches/rejoins read correctly. The single biggest correctness upgrade over UV-x faking.
2. **TSL/WebGPU port of the pour + compute sparks.** With Safari 26 iOS WebGPU live, port `gw_temp` +
   advection to TSL and move the orbiting sparks to a compute shader (10–100× headroom). Quantify the
   mobile win and the fallback story.
3. **The "pour front → letter fill" handoff.** The exact mechanism by which a moving front leaves a
   channel and fills a Cinzel letterform left-to-right (shared arc-length, SDF letter masks, where the
   front "splits" into the letter vs continues down-channel) — owns the connection to the letterform
   cooling system.
4. **A/E divine-fire light bleed onto basalt + Ogham reveal.** How the white-gold A/E emissive
   actually illuminates adjacent stone (baked emissive light map vs real-time additive contribution)
   to make carved Ogham readable — the sacred payoff moment, shared with the cooling-gradient topic.
