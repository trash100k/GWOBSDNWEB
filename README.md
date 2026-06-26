# GAELWORX — Obsidian Hero

> A slab of living obsidian, lit from within by a forge that never went out.

A self-contained React + react-three-fiber hero experience for **GAELWORX**, an AI
implementation studio. Brand: _Neo-Gaelic Brutalist_ — the cooled aftermath of the
forge. A full-screen slab of polished black volcanic glass with warm amber caustics
drifting beneath a hard reflective skin, a faint ember core breathing in the depths,
and content that surfaces up through the glass on scroll.

## The four acts

| Act | Trigger | What happens |
| --- | --- | --- |
| **1 — The Slab** | mount | From black, the slab rises into frame; caustics ignite, the ember warms (GSAP). |
| **2 — The Depth** | idle | The obsidian breathes; warm caustics drift; reflections of the distant heat slide across the undulating skin. |
| **3 — Surfacing** | scroll | Each section emerges from beneath the glass — refraction distortion + blur that resolves to crisp legibility (GSAP ScrollTrigger + SVG displacement). |
| **4 — The Touch** | cursor | The slab parallaxes toward the cursor and bends the caustic light; a fast flick sends a slow refraction ripple. |

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle
```

## How the obsidian is made

The slab is a `MeshPhysicalMaterial` — the same PBR engine behind drei's
`MeshTransmissionMaterial` — patched with custom GLSL through `onBeforeCompile`:

- **The skin**: `clearcoat: 1`, low `clearcoatRoughness` → sharp, hard reflections.
- **The interior**: real `transmission` + warm `attenuationColor` → a soft refractive
  depth (high tier only).
- **The forge**: injected GLSL adds a domain-warped, warm **caustic field** beneath
  the skin, a slow-breathing **ember core**, and a caustic-gradient **normal bump** so
  reflections slide as the surface undulates. The clearcoat keeps its own crisp
  normal — sharp reflections over a soft refractive interior is the signature.
- **Reflections** come from a procedural `<Environment>` of warm `Lightformer`
  streaks (no HDR fetch — fully self-contained); the background stays black.

Post-processing (`@react-three/postprocessing`): **Bloom** thresholded so only the
warm caustics + ember glow, subtle **ChromaticAberration** on refraction edges,
**Vignette**, and film-grain **Noise**.

## Performance & accessibility

Quality auto-detects (`detectQuality`):

- **high** — real transmission, full post FX, DPR up to 2.
- **low** (mobile / ≤4 cores) — cheap reflective skin (no transmission), trimmed FX,
  lower DPR. Keeps the dark-glass feel.
- **static** (`prefers-reduced-motion`) — the glass freezes, content is simply present.

If WebGL throws, an error boundary swaps in a static CSS volcanic-glass fallback.

## Art direction (leva)

`<ObsidianHero debug />` shows live controls: `causticSpeed`, `refractionStrength`,
`emberIntensity`, `parallaxAmount`, plus caustic scale, reflection intensity,
exposure and bloom. Drop `debug` to hide the panel in production.

## Content

- Headline (etched into glass): **Automatic Execution**
- Sub: _Business owners don't need Artificial Intelligence._
- CTA: **POINT THE SWORD**
- Mark: **GAELWORX · ONE FORGE**
