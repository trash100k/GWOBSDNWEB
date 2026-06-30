# 09 — Curl-Advected Spark & Smoke Transport (no GPGPU)

_Phase 2 deep-dive · GAELWORX forge world · cluster **C-flow-pour** · target: iPhone 15 OLED, one WebGL
renderer (r3f + three.js), `onBeforeCompile` / vertex-shader-animated `Points` · the files under the knife:
`src/scene/shaders.js` (the `gw_curl3` primitive) + `src/scene/Embers.jsx` / a sibling `Sparks.jsx`_

> **Reads on top of `00-COHESION-MAP.md` (§2 the shared noise basis lists `gw_curl3` as a toolkit member,
> §1 temperature, §5.1 sparks-are-cooling-metal, §10 perf budget), `phase1/15` (the spark/ember system
> landscape — which reaches for GPGPU ping-pong for the *hero* sparks and finite-difference curl), and
> `phase2/07` (which lands `gw_snoise3`/`gw_fbm3` and names `gw_curl3` as its deep-dive candidate #1).** This
> document owns the one missing piece that turns curl from a generic per-frame wobble into *coherent
> vortices that orbit the pour-front*: an **analytic-derivative 3D `gw_curl3` (3 noise evaluations, not 18)**
> read by a **4–8 substep advection integrator (`p += curl·dt`)**, with **heat-driven seeding around
> `uPourFront`**, kept entirely inside the **existing additive-`Points` budget** — *no float-texture
> ping-pong, no `GPUComputationRenderer`, no renderer migration.* It is the cheaper, mobile-correct
> counter-proposal to `phase1/15`'s GPGPU hero path: the same coherent-vortex look, on the CPU-stepped
> `Points` system the repo already ships, because the spark count GAELWORX actually needs (~256–320) does
> not justify a GPGPU pipeline and its float-RT risk on the judge device.

---

## 1. SCOPE (this element in the GAELWORX world)

The forge has two airborne particle families that must read as **fluid, not floaty**: the **LIVING SPARKS**
that orbit the white-hot leading edge of the pour (`uPourFront`) as the molten metal winds the
Celtic-interlace channels, and the **drifting SMOKE/EMBER motes** that lift off cooling letterforms and the
altar in slow Atmospheric Drift. Both are pure additive light against the `#0B0C10` void (sparks bright and
HDR, smoke dim and warm), and both must sample the **shared master temperature field** so a spark born at
the pour-front is white-gold and a far ember is deep ember-red — never a uniformly-tinted sprite cloud
(`00 §5.1`: "the sparks ... are literally cooling metal droplets").

The problem this doc solves is **motion quality**. The current `Embers.jsx` animates points in the vertex
shader by `rise-and-wrap + sin drift` — cheap, brand-correct for ambient motes, but it has no velocity
field, so the motion reads as *parallel rising streaks*, not *air being stirred by a fire*. Adding raw 3D
noise as a per-frame displacement is worse: noise has **sources and sinks** (divergence), so particles pile
into clumps and stretch into the same axis-aligned streaks the fbm rotation (`phase2/07 §2.2`) fights.
**Curl noise** — the curl of a vector potential — is *divergence-free by construction*: it has no sources or
sinks, so it produces the swirling, never-collapsing, conserved-volume motion of real turbulent air. That is
the difference between "embers drifting up" and "embers caught in the thermals of a living forge."

But curl is only half the story, and the half `phase1/15` already sketched. The **missing piece this doc
owns** is that a divergence-free *field* is not the same as coherent *vortices*: you only see the swirl if a
particle **integrates its path through the field over multiple substeps** (`p += curl(p)·dt`, repeated 4–8
times per frame), sampling the curl *at its new position each substep*. Evaluate curl once and add it as a
displacement and you get incoherent wobble — the particle never goes *around* a vortex, it just jitters. The
substep advection is what makes the spark trace an arc around the pour-front and the smoke fold back on
itself. This doc lands the analytic `gw_curl3` (so the per-substep cost is affordable) and the substep loop
(so the field becomes vortices), inside the additive-`Points` budget.

---

## 2. TECHNIQUE LANDSCAPE 2025–2026

The decision tree forks on three axes: **how curl is computed** (finite-difference vs analytic vs
cross-of-gradients), **where the simulation lives** (GPGPU texture vs CPU-stepped `Points` vs vertex-shader
field-eval), and **how the path is integrated** (single-step displacement vs multi-substep advection).

### 2.1 Computing the curl — three families

**(a) Finite-difference curl of a vector potential (the textbook / `phase1/15` form).** Build a vector
potential `ψ(p) = (fbm(p+a), fbm(p+b), fbm(p+c))`, then take `curl = ∇×ψ` by central differences: six
potential samples (`±ε` on each axis), each potential sample being three fbm evaluations → **18 noise
evaluations per curl** (worse if the potential's fbm is multi-octave). This is what the
`phase1/15` `gwCurl()` snippet does (`gwPotential` called 6×). Robust and well-understood — the canonical
Bridson "Curl-Noise for Procedural Fluid Flow" (SIGGRAPH 2007) recipe, re-covered verbatim across 2025
write-ups (emildziewanowski's _Dissecting Curl Noise_, the freder Unity Graphics Programming chapter, the
al-ro _3D Curl Noise_ page). **Cost is the killer on mobile inside a substep loop:** 18 evals × 6 substeps =
108 noise evals/particle/frame. Untenable.

**(b) Analytic-derivative curl (the GAELWORX pick — 3 evaluations).** If the noise primitive returns its own
**analytic gradient** alongside its value — `snoise3(p) → (value, ∇value)` — you skip the finite-difference
stencil entirely. The 2022 **psrdnoise** functions (Gustavson & McEwan, JCGT 11(1), the canonical
analytic-derivative tiling simplex) "compute an analytical derivative of the noise function, useful for ...
'flow noise' and 'curl noise'" — i.e. they were *built* for this. With three noise fields each yielding a
gradient in **one evaluation**, the curl of the vector potential is assembled from those three gradients
directly: **3 noise evaluations total, no `±ε` stencil.** The al-ro and emildziewanowski 2025 write-ups both
note the finite-difference path "samples three offset positions with simplex noise derivatives and computes
`curlDir = (∂Z.y−∂Y.z, ∂X.z−∂Z.x, ∂Y.x−∂X.y)`" — that *is* the analytic assembly once the derivatives come
free from the noise call. This is exactly the "3 evals not 18" the cohesion map specifies for `gw_curl3`.

**(c) Cross-of-gradients / "bitangent noise" (divergence-free in 2 evaluations).** atyuwen's **_Fast
Divergence-Free Noise Generation in Shaders_** observes that **the divergence of the cross product of two
gradient fields is identically zero** — so you can generate a divergence-free 3D vector field as
`∇φ × ∇ψ` from just **two** noise functions (two gradients), cheaper than the three-field curl. The
SIGGRAPH Asia 2025 paper **_Improving Curl Noise_** (Bærentzen, Martínez, Frisvad, Lefebvre, Dec 2025)
generalizes this to the rigorous statement: a divergence-free *n*-D vector noise is the *n*-dimensional cross
product of the gradients of *n−1* noise functions (so 3D = cross of 2 gradients), "divergence-free and hence
volume preserving for any dimension." The paper also flags the catch we must respect: in higher dimensions
the **gradient magnitudes of simplex noise dilute toward zero**, weakening the field — they propose a
magnitude correction. For GAELWORX's 3D case this is the *most* efficient divergence-free field (2 gradients),
but the classic three-gradient curl gives slightly richer, more isotropic swirl; we pick the 3-eval analytic
curl (b) as the headline and note (c) as the documented `low`-tier shave.

### 2.2 Where the simulation lives

**(a) GPGPU ping-pong / `GPUComputationRenderer` (the `phase1/15` hero recommendation).** Position/velocity
in float textures, two compute passes, ping-pong each frame. The 2025 Codrops-adjacent walkthroughs (Muhammad
Anas, _Creating Chaotic Flow Fields with GPGPU in R3F_) run 16,384 particles with curl-noise flow fields this
way. **Right for 10⁴–10⁵ particles; wrong for GAELWORX's ~300.** It carries `EXT_color_buffer_float` /
half-float-RT dependency, ping-pong bookkeeping, the "read-the-texture-you're-writing" race footgun, and
float-RT memory that must be disposed — all real risk on a judged iOS demo, for a count that fits in a CPU
loop trivially.

**(b) CPU-stepped `Points` (this doc's pick).** Positions live in a plain `Float32Array`; a single
alloc-free `useFrame` advects each of N points through `gw_curl3` over the substep loop, writes back to the
`position` attribute, flags `needsUpdate`. At N≈256–320 (the `00 §10` ember budget) this is **sub-millisecond
CPU**, no render targets, no float-RT extension, no migration, and the *exact same `Points` + additive
material* the repo already ships in `Embers.jsx`. The curl is evaluated in JS (a tiny port of `gw_snoise3`'s
gradient) so the field is shared with the shader-side noise.

**(c) Vertex-shader field-eval (current `Embers.jsx`).** Particles carry immutable seeds; motion is a pure
function of `uTime` evaluated in the vertex shader — *no integration possible* (each frame is independent of
the last), so it can fake drift but **cannot trace a vortex**. Good as the `static`-tier floor; insufficient
for heat-seeking sparks (this is `phase1/15 §2.1`'s own verdict).

**(d) WebGPU/TSL compute (`instancedArray` + `.compute()`).** Heckel's _Field Guide to TSL and WebGPU_
(Oct 2025) and the threejs-blocks WebGPU **smoke** sim (TSL compute, with explicit **substep control scaled to
frame time**) are the 2026 frontier and the *destination* for a post-judge port — but `00 §10` pins the judge
device to WebGL2 + `onBeforeCompile`. We author `gw_curl3` and the substep loop **TSL-portable** (pure
function, integer substep count) so the port is a re-host.

### 2.3 How the path is integrated (the actual "missing piece")

| Scheme | Per-particle curl evals/frame | Vortex coherence | GAELWORX fit |
|---|---|---|---|
| Single-step displacement (`p += curl(p)·dt`, 1×) | 1 | **none** — incoherent wobble, particles don't orbit | the failure mode this doc names |
| Euler, 4–8 substeps (`for: p += curl(p)·dt/n`) | 4–8 | **good** — particle goes *around* vortices | **the pick** |
| RK2 / midpoint, 2–4 substeps | 8–16 (2 evals/substep) | excellent, less drift | `high`-tier option if budget allows |
| RK4 | 16+ | overkill | rejected — analytic curl is smooth, Euler-substep suffices |

The rombo.tools _Curl Noise*_ piece (Jan 2026) and emildziewanowski's _Dissecting Curl Noise_ (2025) both
make the same point the cohesion map encodes: curl-noise advection "reveals coherent vortices by repeatedly
performing `p = p + v(p)·dt` to integrate a position through the field" — the operative word is *repeatedly*.
A single large step samples the field once and overshoots the swirl; **several small steps, re-sampling curl
at each new sub-position, trace the arc.** This is the entire thesis of cluster C-flow-pour for this element:
the curl is generic until the substep integrator turns it into motion. Euler with 4 (mobile) to 8 (desktop)
substeps is the sweet spot — analytic curl is `C¹`-smooth, so higher-order integrators buy little.

---

## 3. RECOMMENDED APPROACH FOR GAELWORX

**Analytic-derivative `gw_curl3` (3 evals) built on `phase2/07`'s `gw_snoise3`, advected over 4–8 Euler
substeps in a CPU-stepped `useFrame`, seeded by heat around `uPourFront`, rendered through the existing
additive `Points` + temperature-ramp material — no GPGPU, no renderer migration.**

Justification against the world and the constraints:

1. **The count doesn't justify GPGPU.** `00 §10` budgets ~256–320 additive points. Advecting 320 points
   through a 3-eval curl over 6 substeps is **~5,760 noise evals/frame total** — a fraction of a *single*
   full-screen molten fragment (which is ~40–55 simplex-3D evals *per pixel* × ~10⁶ pixels). The CPU loop is
   sub-millisecond; GPGPU would add render-target memory, float-RT extension dependency, and the ping-pong
   race footgun for *zero* perceptible gain at this count. This is the deliberate, justified divergence from
   `phase1/15`'s GPGPU hero recommendation: **right tool for 300, not 30,000.**
2. **Analytic curl is what makes substeps affordable.** Finite-difference curl (18 evals) × 6 substeps = 108
   evals/particle — 6× more. The analytic gradient (psrdnoise-style, 3 evals) is the *enabling* primitive: it
   makes the substep loop cheap enough that we can afford the substeps that create the coherence. "3 evals not
   18" is not a micro-opt — it's the difference between substep advection being affordable or not.
3. **Cohesion by construction.** `gw_curl3` is built from `phase2/07`'s `gw_snoise3` — the *same* simplex
   basis the molten boil and cooling field read (`00 §2`). The air's swirl shares the metal's grain. Spark
   color comes from the shared `gw_forge(temp)` ramp; intensity rides the shared `uHeat`. Nothing forks.
4. **One clock, one rAF.** The advection runs in the *existing* single `useFrame` writer, `dt`-clamped — no
   second rAF, no `setInterval` (`00 §7` rule 6).
5. **TSL-portable seam.** `gw_curl3` is a pure function; the substep loop is an integer-bounded `for`. The
   post-judge WebGPU port (Heckel / threejs-blocks smoke) is a re-host into `.compute()`, not a rewrite.

The smoke half rides the same machine at a different parameterization: **smoke = the same curl field, lower
curl amplitude, stronger buoyancy, longer lifetime, cooler ramp, larger soft sprite, lower opacity.** One
system, two presets — `00 §9`'s "per-element variation is a damped param, never a different system."

---

## 4. IMPLEMENTATION

### 4.1 Libraries / versions

- **three.js** — current repo pin (`WebGLRenderer`, `THREE.Points`, `BufferGeometry`, `AdditiveBlending`).
  **No new dependency.**
- **react-three-fiber / drei** — as installed (`<Sparkles>` retained for the `static` floor).
- Reuse `gw_snoise3` (landed in `phase2/07`, `src/scene/shaders.js`) for the *render-side* color/sprite, and a
  **tiny JS port of its analytic gradient** for the *CPU advection* (so both halves share the basis).
- Reuse `PAL` / `v3()` (`palette.js`) and the master pool `U` (`forgeUniforms.js`, `00 §4.2`).
- **Deferred (post-judge, WebGPU only):** `three/tsl` `Fn` + `instancedArray` + `.compute()` (Heckel 2025).

### 4.2 The analytic gradient (the 1-eval-with-derivative primitive)

`gw_snoise3` (phase2/07) returns only the scalar. For curl we need its **gradient**. The psrdnoise approach
returns `(value, grad)` from one evaluation; for GAELWORX's existing Ashima-port `gw_snoise3` the lowest-risk
move is a **`gw_snoise3_grad`** that returns the gradient via the same simplex corner machinery (the gradient
is `42 · Σ (4·m³·(g·x)·(−x) + m⁴·g)` — the analytic derivative of the value formula), OR — if porting the
exact derivative is risky — a **tetrahedral 4-tap gradient** that reuses the *value* function: 4 evals total
for one gradient, still far under the 6-per-axis finite-difference. For the **CPU advection** we port a
compact analytic-gradient simplex to JS once. Pseudocode of the GLSL render-side helper:

```glsl
// in shaders.js, appended after gw_snoise3 (phase2/07). Returns gradient of the value field.
// Either the true analytic derivative of gw_snoise3, or a 4-tap tetra estimate reusing gw_snoise3:
vec3 gw_snoise3_grad(vec3 p){
  const float h = 0.08;
  const vec2 k = vec2(1.0, -1.0);                 // tetrahedral offsets — 4 evals, not 6
  return ( k.xyy * gw_snoise3(p + k.xyy*h)
         + k.yyx * gw_snoise3(p + k.yyx*h)
         + k.yxy * gw_snoise3(p + k.yxy*h)
         + k.xxx * gw_snoise3(p + k.xxx*h) ) / (4.0*h);
}
```

### 4.3 `gw_curl3` — divergence-free curl in 3 (gradient) evaluations

Curl of a vector potential `ψ = (n1, n2, n3)` is `∇×ψ`. With analytic gradients `g1,g2,g3` of three decorrelated
noise fields, the curl assembles directly — **no `±ε` stencil, no 18-sample finite difference**:

```glsl
// THE primitive — cluster C-flow-pour. 3 gradient evals → divergence-free velocity. Pure function (TSL-portable).
vec3 gw_curl3(vec3 p){
  // three decorrelated potential fields (large offsets keep them uncorrelated)
  vec3 g1 = gw_snoise3_grad(p + vec3( 0.0,  0.0,  0.0));
  vec3 g2 = gw_snoise3_grad(p + vec3(31.4, 17.2,  9.1));
  vec3 g3 = gw_snoise3_grad(p + vec3(-7.7, 23.9, 41.3));
  // curl = ( ∂ψz/∂y - ∂ψy/∂z , ∂ψx/∂z - ∂ψz/∂x , ∂ψy/∂x - ∂ψx/∂y )
  return vec3( g3.y - g2.z,
               g1.z - g3.x,
               g2.x - g1.y );   // divergence-free by construction
}
// low-tier shave (atyuwen / SIGGRAPH Asia 2025): div-free from only TWO gradients via cross product:
vec3 gw_curl3_lite(vec3 p){
  vec3 a = gw_snoise3_grad(p);
  vec3 b = gw_snoise3_grad(p + vec3(19.2, 7.1, 33.6));
  return cross(a, b);            // ∇φ × ∇ψ — divergence identically zero
}
```

> **Note on "3 evals":** the *curl* is assembled from 3 gradient samples (the cohesion-map spec). If
> `gw_snoise3_grad` uses the 4-tap tetra estimate, that's 12 *value* evals per curl — still 1.5× cheaper than
> finite-difference curl (18) and we get the analytic-quality smoothness; if the true psrdnoise analytic
> derivative is ported, it's a true 3-eval curl. Ship the tetra estimate first (lowest risk), upgrade to the
> exact derivative once compile-green.

### 4.4 The substep advection (the missing piece — JS, in the existing `useFrame`)

The same `gw_curl3` is ported to JS (alloc-free) and stepped. **This loop is the whole point:**

```js
// src/scene/Sparks.jsx — CPU advection in the ONE useFrame. Alloc-free: scratch vecs hoisted.
const SUBSTEPS = quality === 'high' ? 6 : 4              // 4–8 band; never 1 (incoherent)
const _p = new THREE.Vector3(), _c = new THREE.Vector3(), _to = new THREE.Vector3()

useFrame((state, dt) => {
  if (forge.quality === 'static') return                 // frozen field on static tier
  const dtc = Math.min(dt, 1/30)                         // clamp tab-restore hitch (00 §10)
  const h   = dtc / SUBSTEPS
  const t   = state.clock.elapsedTime
  const heat = THREE.MathUtils.damp(uHeat.value, forge.heat, 3, dtc)  // SHARED master temp
  uHeat.value = heat
  const front = forge.pourFront                          // SHARED moving emitter (vec3)
  const pos = geo.attributes.position.array
  const aux = ageLifeArray                               // [age, life, seed] per particle

  for (let i = 0; i < count; i++){
    const j = i*3
    _p.set(pos[j], pos[j+1], pos[j+2])
    // --- the SUBSTEP loop: re-sample curl at each new sub-position → coherent vortices ---
    for (let s = 0; s < SUBSTEPS; s++){
      curl3(_c, _p.x*FREQ + t*EVOLVE, _p.y*FREQ, _p.z*FREQ)   // gw_curl3 in JS, time on one axis = "boil"
      // heat attraction toward the pour-front (orbit, don't crash): 1/(1+d²) falloff
      _to.copy(front).sub(_p); const d2 = _to.lengthSq()
      _to.multiplyScalar((0.6*heat) / (1.0 + d2))
      _p.x += (_c.x*CURL_AMP + _to.x) * h
      _p.y += (_c.y*CURL_AMP + _to.y + BUOYANCY*heat) * h     // hot air lifts
      _p.z += (_c.z*CURL_AMP + _to.z) * h
    }
    // --- lifecycle: age, respawn at the heat-drawn seed (§4.5) ---
    const a = aux[i*3] + dtc
    if (a > aux[i*3+1]) { seedAtPourFront(_p, front, aux[i*3+2], heat); aux[i*3] = 0 }
    else aux[i*3] = a
    pos[j]=_p.x; pos[j+1]=_p.y; pos[j+2]=_p.z
    aux[i*3+2] = a / aux[i*3+1]                              // normalized age → cooling (render reads it)
  }
  geo.attributes.position.needsUpdate = true
  geo.attributes.aAge.needsUpdate = true
})
```

`curl3(out, x,y,z)` is the JS port of `gw_curl3` (3 gradient calls, each a JS simplex-gradient). The key
discipline: **re-evaluate curl inside the substep loop at `_p`'s updated value** — sampling once outside the
loop is the single-step failure mode that kills coherence (§2.3). `CURL_AMP`, `FREQ`, `EVOLVE`, `BUOYANCY`,
`SUBSTEPS` are the tuning knobs (§4.7).

### 4.5 Heat-drawn seeding around `uPourFront`

Sparks are *drawn by heat* — born hot at the moving pour-front, weighted toward the hottest channel, denser
when the forge is hot (`heat` high). Respawn places the particle in a small jittered ball at the front:

```js
function seedAtPourFront(p, front, seed, heat){
  // jitter ball whose radius shrinks with heat (hotter forge → tighter, brighter spawn at the source)
  const r = 0.18 * (1.2 - 0.6*heat)
  p.set(front.x + (h31(seed)*2-1)*r,
        front.y + (h31(seed+1.3)*2-1)*r*0.6,   // flatter in Y (born along the channel surface)
        front.z + (h31(seed+2.7)*2-1)*r)
}
// spawn RATE is heat-gated upstream: skip respawn (let the point stay "dead"/zero-alpha) when
// heat < seedThreshold, so a cold forge emits few sparks and a hot pour throws many — drawn by heat.
```

The pour-front is **shared** (`forge.pourFront`, the same vec3 the lens DOF focus and the channel fill read —
`00 §6`, `00 §7` rule 8). Multi-branch channels feed it as the hottest sampled point along the interlace
curve (the `phase1/15` deep-dive candidate #2; here we consume it as a single moving vec3).

### 4.6 The render material (shared temperature ramp, additive HDR core)

Identical in spirit to `phase1/15 §4.5` and to the slab's emissive — the spark is *cooling metal*, colored by
the shared ramp, with an HDR core so the existing `Bloom` catches it (no per-spark bloom pass):

```glsl
// vertex: size by age (born big-and-bright, shrink as it cools); pass aAge → fragment
// fragment:
uniform float uHeat;  varying float vAge;   // vAge: 0 = just born (hot), 1 = end of life (cold)
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float spr = smoothstep(0.5, 0.0, length(d));            // soft round, NO texture fetch (mobile)
  float temp = clamp((1.0 - vAge) * (0.55 + 0.45*uHeat), 0.0, 1.0);  // hot when young + forge hot
  vec3  col  = gw_forge(temp);                            // THE shared ramp (gw_tempColor*intensity)
  col = mix(col, gw_divineFire(uHeat), uIsAEEmitter);     // A/E emitters: clamped white-gold, never cool
  gl_FragColor = vec4(col * spr, spr * (1.0 - vAge));     // >1 HDR core → blooms via the ONE composer
}
```

Material flags: `blending: THREE.AdditiveBlending`, `transparent: true`, `depthWrite: false`,
`depthTest: true` (sparks occlude behind the slab but still glow), `vertexColors` off (color from the ramp).
The smoke preset swaps `gw_forge(temp)` for a dim ember-tinted absorption color, drops the HDR core below 1
(smoke doesn't bloom), and uses a larger, softer, lower-opacity sprite.

### 4.7 Key uniforms & parameters

| Param | Tier-set / source | Role |
|---|---|---|
| `count` | 320 high / 200 low / `<Sparkles count=200>` static | additive-points budget (`00 §10`) |
| `SUBSTEPS` | 6 high / 4 low / 0 (frozen) static | **the coherence knob** — never 1 |
| `CURL_AMP` | ~0.8 spark / ~0.35 smoke | swirl strength (spark stirred, smoke gentle) |
| `FREQ` | ~0.6 | curl spatial frequency (matches vein grain — cohesion) |
| `EVOLVE` | ~0.15 | time-rate of the field "boiling in place" (not scrolling) |
| `BUOYANCY` | ~0.25 spark / ~0.5 smoke | hot-air lift; smoke rises more |
| `uHeat` | **shared** `forge.heat`, damped | attraction strength, spawn rate, color, alpha |
| `uPourFront` | **shared** `forge.pourFront` (vec3) | moving attractor / seed origin |
| `uIsAEEmitter` | per-emitter flag | clamps A/E sparks to `gw_divineFire`, never cool (`00 §1.4`) |

### 4.8 The r3f component shape

```jsx
// src/scene/Sparks.jsx — mirrors Embers.jsx conventions; mounted route-gated in ForgeCanvas
export default function Sparks({ count = 320, kind = 'spark' }) {
  const quality = forge.quality
  const { geo, mat, aux } = useMemo(() => makeSparks(count, kind), [count, kind])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])   // dispose (00 §4.3)
  useFrame((state, dt) => { /* the §4.4 substep advection */ })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}
```

Gate the mount by `forge.route` so sparks live in the **casting-room / channel-hall / forge-mouth** chambers
and stay quiet in the scrying-pool (`00 §9`). On `static`, render a frozen `<Sparkles>` instead.

---

## 5. COHESION (shared palette / lighting / uniforms with the world)

- **One noise basis.** `gw_curl3` is built on `phase2/07`'s `gw_snoise3` — the exact simplex the molten boil,
  cooling field, and basalt grain read (`00 §2`). The air's swirl is the *same grain* as the metal's flow;
  spark motion shares the veins' spatial frequency via `FREQ`. No second noise (`00 §7` rule 2).
- **One temperature authority.** Spark color is `gw_forge(temp)` — the same `gw_tempColor × gw_tempEmissive`
  ramp the slab veins use (`00 §1`). A spark and the vein it lifted off are *visibly the same metal* because
  they sample one curve. Cooling is `(1 − vAge)`, the spark analogue of `gwCool01` (`00 §7` rule 1).
- **One clock, one rAF.** The advection runs in the existing single `useFrame`, `dt`-clamped, damped via
  `THREE.MathUtils.damp` — never `lerp`, never a second rAF, frozen on `static` (`00 §7` rule 6). A strike
  surges `forge.heat` → the same frame the slab veins flare, the sparks brighten and the spawn rate jumps.
- **One palette.** Color from `PAL` via `v3()`; only the HDR core (`>1`) blooms — the same "only the 10%
  accent exceeds 1.0" convention that makes the palette the bloom selector (`00 §3.1`, `00 §7` rule 3).
- **One light model.** Sparks are *self-lit additive* — they ARE light in a void lit only by metal (`00 §5`).
  No fill, no env. The A/E divine-fire emitters (`uIsAEEmitter`) feed the *same* `uAEFire` proximity signal
  the basalt/Ogham reveal reads (`00 §5.2`) — a spark near an ignited letter helps light the carved lore.
- **One bloom contract.** No spark bloom pass; the existing merged composer `Bloom` catches the `>1` cores
  (`00 §6`). Push emissive above 1, never crank bloom (`post-fx`).
- **Shared pour-front, three ways.** `forge.pourFront` is the *same* vec3 the channel fill, the camera DOF
  focus, and these sparks consume (`00 §7` rule 8) — the metal that's hottest is where sparks spawn *and*
  where the lens is focused.

---

## 6. MOBILE & PERFORMANCE (inside the iPhone-15 budget)

The world is fill-rate bound, not triangle bound (`00 §10`). This element's costs are **(a) the CPU advection
loop** and **(b) additive overdraw** — *not* geometry.

- **CPU advection cost.** 320 points × 6 substeps × (3 gradient evals, each ~30 ALU in JS) ≈ a few thousand
  cheap ops/frame — **well under ~0.3 ms** of JS in the existing `useFrame`. This is the entire reason GPGPU
  is unjustified here: the loop is trivially cheap at this count, with zero render-target memory and zero
  float-RT extension dependency (`00 §10` hard constraint). Alloc-free: scratch vectors hoisted, no `new` in
  the loop (`00 §10` INP rule).
- **Overdraw is the watch-item.** Additive `depthWrite:false` particles cost *covered pixels*, not count.
  Keep `gl_PointSize` modest, lifetimes short (0.8–3 s), and seed-gate spawn by heat so the screen is never
  carpeted. Soft round sprite computed **in-shader, no texture fetch** — texture-bound fill is the real mobile
  cost.
- **The three tiers (uniform degrade, `00 §7` rule 9):**
  - **`high`** — 320 sparks, `SUBSTEPS 6`, full `gw_curl3` (3-gradient), `gw_snoise3_grad` 4-tap or analytic.
  - **`low`** — 200 sparks, `SUBSTEPS 4`, optionally `gw_curl3_lite` (2-gradient cross, atyuwen) to shave a
    gradient eval under thermal pressure (gate on the `PerformanceMonitor` factor, not statically).
  - **`static`** — `frameloop='demand'`, advection skipped, frozen `<Sparkles count=200 speed=0>` (or our
    points with `uTime` frozen to `2`) — a still, dignified ember field, not a broken fallback (`00 §10`).
- **dt clamp non-negotiable.** `Math.min(dt, 1/30)` — an unclamped tab-restore `dt` integrates positions to
  infinity and the field vanishes (`phase1/15 §7` trap 7). The fixed substep `h = dtc/SUBSTEPS` also keeps the
  integration stable regardless of frame rate.
- **Dispose on unmount** — `geo.dispose(); mat.dispose()` (`00 §4.3`). No float RTs to leak (the GPGPU path's
  fast-OOM risk) — another reason the CPU path is the safer mobile bet.

---

## 7. GET-IT-RIGHT-FIRST-TIME (pitfalls + order of operations)

**Order of operations (each step verified the repo way before the next):**

1. **Land `gw_snoise3_grad` + `gw_curl3` in `shaders.js`, compile-green.** Append below `gw_snoise3`
   (phase2/07). `npm run build` → `qa-route` 393×852 + 1440×900, **0 console errors** (SwiftShader compiles
   the GLSL in CI). Touch nothing the slab reads.
2. **Prove the field is divergence-free.** A debug material visualizing `gw_curl3` as a flow texture — it must
   *swirl*, with no clumping toward points (clumping = a divergence bug = you wrote a gradient, not a curl).
3. **Stand up the JS advection with curl OFF (gravity only)**, confirm points integrate and respawn cleanly,
   then **turn curl on with `SUBSTEPS = 1` first** — observe the *incoherent wobble* (the failure mode), then
   raise to 4–6 and watch the vortices appear. *Seeing the difference is the proof the substeps matter.*
4. **Add heat attraction**, tune so sparks **orbit, not crash** into `uPourFront` — if they all pile on, the
   `1/(1+d²)` falloff is too strong or `CURL_AMP` too low; the swirl must dominate near the front.
5. **Wire the shared `forge.heat` / `forge.pourFront`**, confirm a strike surges spawn + brightness in the
   same frame as the slab veins (the cohesion proof).
6. **Bloom last.** Sparks look dull until the `>1` core meets the existing `Bloom`. Push the core emissive
   above 1; **do not** crank `Bloom.intensity` (washes the scene — `post-fx`).
7. **The device read** — additive bloom, true-black, the divine-fire white-gold, and *vortex coherence* do
   **not** simulate headless (`00 §8`).

**Pitfalls, ranked by cost:**

- **Single-step curl (the headline mistake).** Evaluating curl *once* and adding it as displacement gives
  incoherent wobble, not vortices. The substep loop — re-sampling curl at the updated sub-position each
  substep — is the entire deliverable. `SUBSTEPS ≥ 4`.
- **Sampling curl outside the substep loop.** Even with a loop, if you compute `curl(_p)` once before the loop
  and reuse it, you've defeated the integration. Curl must be re-evaluated at `_p` *inside* the loop.
- **Finite-difference curl inside the substep loop.** 18 evals × substeps is the perf trap that pushes people
  to GPGPU. Use the analytic/tetra gradient (3 gradient evals) — that's *why* it's affordable on CPU.
- **Raw noise as displacement (divergence).** Adding `gw_snoise3` directly (not its curl) gives a field with
  sources/sinks → clumping + streaks. Only the *curl* is divergence-free.
- **Allocating in the loop.** `new THREE.Vector3()` per particle per frame is GC churn that spikes INP. Hoist
  every scratch vector (`00 §10`).
- **Forgetting `depthWrite:false`.** Additive sparks get black halos / sort artifacts where they overlap.
- **Unclamped `dt`.** Tab-restore integrates to infinity; the field vanishes. `Math.min(dt, 1/30)` + fixed
  substep `h`.
- **A/E sparks reaching the temperature ramp.** The `uIsAEEmitter` emitters must route to `gw_divineFire`
  and **never cool** (`00 §1.4` keystone) — keep the branch hard-separated.
- **Over-counting "for safety."** 320 is the budget; doubling it doubles overdraw (the real mobile cost) for
  no narrative gain. Density comes from heat-gated spawn near the front, not raw count.

---

## 8. SOURCES (2025–2026)

1. **J. A. Bærentzen, J. Martínez, J. R. Frisvad, S. Lefebvre — _Improving Curl Noise_**, SIGGRAPH Asia 2025
   Conference Papers, **Dec 2025** (Hong Kong). Divergence-free *n*-D vector noise as the *n*-D cross product
   of the gradients of *n−1* noise functions (3D = cross of 2 gradients); proves divergence-free / volume
   preserving; flags the simplex-gradient-magnitude dilution in higher dimensions + correction. The 2025
   authority for the cross-of-gradients div-free formulation.
   https://dl.acm.org/doi/10.1145/3757377.3763980 · open access https://hal.science/hal-05308063v1
2. **atyuwen — _Fast Divergence-Free Noise Generation in Shaders_ (bitangent noise)**, referenced/active across
   **2025** curl write-ups. The "divergence of the cross product of two gradient fields is zero" trick → a
   divergence-free 3D field from **2 gradients** instead of the 6-sample finite-difference curl. The basis for
   `gw_curl3_lite`. https://atyuwen.github.io/posts/bitangent-noise/
3. **Emil Dziewanowski — _Dissecting Curl Noise_**, **2025**. Modern walkthrough: curl from noise gradients,
   analytic vs finite-difference, the `curlDir = (∂Z.y−∂Y.z, ∂X.z−∂Z.x, ∂Y.x−∂X.y)` assembly, divergence-free
   property, and `p = p + v(p)·dt` *repeated* advection revealing coherent vortices.
   https://emildziewanowski.com/curl-noise/
4. **Rombo.tools — _Curl Noise*_**, **Jan 1, 2026**. 2026 re-coverage of curl-noise advection — the repeated
   `p = p + v(p)·dt` integration that reveals vortices, divergence-free flow fields for particles.
   https://www.rombo.tools/2026/01/01/curl-noise/
5. **S. Gustavson & I. McEwan — _psrdnoise_ (tiling simplex flow noise, analytic derivatives)**, GLSL 1.20+,
   2022 functions actively documented/ported **2025** (LYGIA, stegu/psrdnoise). The analytic-gradient simplex
   that returns `(value, ∇value)` in one eval — "useful for ... 'flow noise' and 'curl noise'" — i.e. the
   3-eval-curl enabler. https://github.com/stegu/psrdnoise · https://lygia.xyz/generative/psrdnoise ·
   JCGT 11(1) https://jcgt.org/published/0011/01/02/paper.pdf
6. **Maxime Heckel — _Field Guide to TSL and WebGPU_**, **Oct 14, 2025**. GPGPU particle systems with curl
   noise / flow fields / attractors, compute shaders (`.compute()` + `instancedArray`) replacing FBO
   ping-pong, `p += v·dt` advection — the deferred WebGPU/TSL port seam this doc authors toward.
   https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
7. **three.js-blocks — _smoke (WebGPU)_**, **2025–2026**. TSL/WebGPU compute smoke sim with explicit
   **sub-stepping control scaled relative to frame time** — confirms substep advection as the contemporary
   transport mechanism and the port target. https://www.threejs-blocks.com/docs/smoke ·
   CurlNoise module https://www.threejs-blocks.com/docs/module-CurlNoise
8. **Muhammad Anas — _Creating Chaotic Flow Fields with GPGPU in React Three Fiber_**, Medium, **Jul 4, 2025**.
   FBO ping-pong velocity+position compute, curl noise = divergence-free, 16,384 particles — the GPGPU
   reference this doc deliberately *declines* at GAELWORX's ~300-particle count.
   https://medium.com/@midnightdemise123/creating-chaotic-flow-fields-with-gpgpu-in-react-three-fiber-f9aad608c534
9. **Dan Greenheck — _10 Noise Functions for Three.js TSL Shaders_**, Three.js Roadmap, **Dec 2025**. Confirms
   simplex as the isotropic workhorse with a cheap analytic derivative (the feed for fast curl) and the layering
   composites — the basis-cohesion argument for building `gw_curl3` on the shared `gw_snoise3`.
   https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders

---

## 9. DEEP-DIVE CANDIDATES

1. **`gw_snoise3_grad` — true analytic derivative vs 4-tap tetra estimate.** Port the exact psrdnoise/Ashima
   analytic gradient (true 3-eval curl) and A/B it against the 4-tap tetra estimate (12-value-eval curl) for
   quality vs cost on the iPhone-15 — owns the gradient-extraction edge cases (corner contributions, the
   `42·Σ` derivative form) and the gradient-magnitude dilution fix from _Improving Curl Noise_ (2025).
2. **Multi-point / branching pour-front emission along the interlace curve.** Feed `uPourFront` not as one
   vec3 but as several moving positions sampled along the Celtic-knot arc-length (per-branch heat weighting),
   so sparks track the metal as it winds/branches/rejoins — the `00 §7` rule-8 shared-curve consumption
   (overlaps `phase1/15` candidate #2, here on the CPU-advection path).
3. **Curl-field ↔ heat-haze coupling.** Tie the screen-space heat-haze UV-warp (`00 §5.4`) to the same
   `gw_curl3` field the sparks ride, so the air's shimmer and the sparks' swirl are *the same motion* at two
   scales — a shared curl-domain sampled by the post-pass and the particles.
4. **Post-judge WebGPU/TSL `.compute()` re-host.** Move the substep advection into a TSL compute pass
   (`instancedArray` + `.compute()`, Heckel / threejs-blocks smoke) once the renderer migrates — quantify
   whether the higher particle ceiling buys anything at the forge's deliberately-sparse spark count, or whether
   CPU-stepped `Points` stays the right call even on WebGPU.
