# GAELWORX — Research: Pacing, Fluidity & Snap in Motion (get it smooth)

> Addresses the recurring "pacing feels off" + the brand's **Brutalist Snap** motion
> law ("0ms delay, high-momentum easing, no bounce, only impact"). The goal: scroll
> that feels **buttery**, transitions that feel **decisive**, never janky.

## The three forces (and where each belongs)
- **Pacing** = how fast the journey moves per unit of scroll/time. Fix uneven pacing
  with even scroll weighting + momentum + no dead zones.
- **Fluidity** = smoothness *between* states — momentum scroll + frame-rate-independent
  interpolation. Belongs to **scroll + the 3D scene**.
- **Snap** = decisive arrival — short, ease-out, no-bounce transitions. Belongs to
  **elements + microinteractions** (the "impact" in Brutalist Snap), NOT to the scroll.

## 1. Fluidity — momentum scroll + dt-correct damping
- **Lenis** (~3kB, Darkroom Engineering) is the agency-standard smooth-scroll: consistent
  **60fps**, fine damping/easing/duration control, respects `prefers-reduced-motion`.
  **Scroll-jank is a top source of poor INP** (Google) — Lenis kills it. Pairs with GSAP
  ScrollTrigger (Lenis = momentum, GSAP = positional math).
- **Frame-rate-independent interpolation is mandatory.** A naive `lerp(a,b,0.1)` per frame
  is **frame-rate dependent** → jitter at variable FPS. Correct form is exponential decay
  with `dt`: `current = target + (current - target) * pow(smoothing, dt)` (or our
  `THREE.MathUtils.damp`). **We already damp the scene this way** — good; the gap is the
  *scroll* itself, which Lenis fixes.

## 2. Snap — NOT CSS scroll-snap (here's the gotcha)
> **Lenis and CSS `scroll-snap` are fundamentally incompatible** — Lenis hijacks scroll;
> `scroll-snap` expects native scroll. Mixing them breaks (mobile/touch first). **Pick one.**

For GAELWORX the home is a weighted **scroll-jack** (not native scroll-snap), and we want
Lenis fluidity — so **don't use CSS scroll-snap**. Achieve "Snap" the brand way instead:
**decisive element transitions** — `ease-out`, short, transform/opacity only, **no bounce**.
That's the "impact." (CSS scroll-snap is great for simpler full-section sites, but it's
mutually exclusive with the Lenis momentum we want.)

## 3. The numbers that make motion feel right
- **Durations:** microinteractions/taps **100–250ms**; content transitions **300–600ms**;
  the sweet spot for UI is **200–300ms** (<200ms reads near-instant; >600ms feels sluggish).
- **Easing:** **never linear** (feels dead). **ease-out makes things feel snappier** +
  more responsive *without* changing duration — perfect for Brutalist Snap. Reserve
  spring/bounce for nothing (brand: "no bounce, only impact").
- **60fps or it's jank:** budget **16.7ms/frame**; sub-60fps drops retention ~27%.
- **Compositor-only:** animate **`transform` + `opacity` only** — they run on the GPU
  layer with no reflow. Animating layout props (top/left/width/height) causes expensive
  reflows = jank. ⚠️ **`filter: blur()` is NOT compositor-cheap** — our Forge-Reveal +
  finale lean on blur; keep blur radii small/bounded and avoid animating large blurred
  areas, or it tanks FPS on mobile.
- **Purposeful motion *raises* perceived performance** — immediate, coherent feedback
  makes the site feel faster.

## 4. Reconciling the brand's two laws (fluid AND snap)
Layer them so they don't fight:
- **Scroll = fluid** (Lenis momentum + dt-damped progress). The journey glides.
- **Reveals = Forge Reveal** (blur→sharp, 300–600ms, ease-out) — fluid entrance.
- **Interactions/landings = Brutalist Snap** (ease-out, 120–220ms, transform/opacity,
  0ms delay, no bounce) — the impact.
- **Atmosphere = Drift** (slow constant velocity — embers/veins; already dt-driven).

## GAELWORX action list (the "make it smooth" pass)
- [ ] **Add Lenis** app-shell-wide; let our existing rAF read Lenis's scroll value (drop
      the dependence on raw `window.scrollY` smoothing). Disable on `prefers-reduced-motion`.
      Do **not** add CSS `scroll-snap` anywhere (Lenis conflict).
- [ ] **Audit transitions** to `transform`/`opacity` only; convert any layout-animating
      CSS. Standardize durations to the table above; ease-out everywhere; kill any linear.
- [ ] **Bound the blur:** cap Forge-Reveal/finale `blur()` radii, avoid animating blur on
      large surfaces; prefer opacity+slight-scale for reveals on mobile.
- [ ] **Even out the scroll-jack pacing:** review `WEIGHTS`/`HALF` so no act feels rushed
      or draggy; ensure no dead zones (finale fixed); tie reveal intensity to scroll velocity.
- [ ] **Hold 60fps:** keep per-frame work in the single rAF; verify in the perf harness
      alongside INP (scroll-jank = INP killer).
- [ ] Keep all motion `prefers-reduced-motion`-safe (already our pattern).

## Sources
- Lenis — [GitHub (darkroomengineering/lenis)](https://github.com/darkroomengineering/lenis) · [lenis.dev](https://www.lenis.dev/)
- Uncut — [Why Lenis Broke My Scroll-Snap (and the fix)](https://raoulcoutard.com/posts/2026-02-03-lenis-scrollsnap-conflict-en/)
- Codrops — [Seamless Infinite Scroll with GSAP & Lenis](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/)
- Rory Driscoll — [Frame-Rate Independent Damping using Lerp](https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/)
- Freya Holmér — [Frame-rate-independent lerp smoothing](https://x.com/FreyaHolmer/status/1757836988495847568)
- MDN — [CSS scroll-snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap)
- Lovable — [Scrolling Designs: 8 Patterns & When to Use Each (2026)](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use)
- PixelFreeStudio — [The Importance of Timing and Easing in Motion Design](https://blog.pixelfreestudio.com/the-importance-of-timing-and-easing-in-motion-design/)
- Motion.dev — [Animation performance guide](https://motion.dev/docs/performance)
