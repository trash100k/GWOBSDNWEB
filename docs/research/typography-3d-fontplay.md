# GAELWORX — Research: Typography Effects, 3D Text & Font Play (2026)

> For the type-elevation pass. The site already has the bones (Cinzel Decorative
> display, the A+E forge-ignite, ForgeText per-letter kinetic reveal, the obsidian
> forge-light that follows the cursor). This is how to push type from "nice" to
> "award-gallery," on-brand, without breaking performance.

## 1. The 2026 landscape (what's actually winning)
- **Kinetic typography is back — but disciplined.** "Purposeful motion" that guides
  attention, not chaos. Headlines that take **half the screen**, letters that animate
  on scroll, type used like **movie-title screens**. (Awwwards galleries, Creative Bloq.)
- **Type AS interface.** The strongest 2026 work (Codrops/Exat) treats typography as
  the *primary interactive element*, not decoration over content.
- **Variable fonts** drive the motion: one file morphs **weight/width/slant**
  continuously — "letters begin to breathe." Saves up to ~400KB / 12 files too.
- **Restraint + performance as design.** Expressive moments are *punctuation*, used
  sparingly; motion pauses off-screen; touch devices get simplified fallbacks.

## 2. Concrete techniques (with the how)
1. **Proximity weight/colour field** (Exat's hero). A grid of glyphs; on `mousemove`
   compute Euclidean distance from cursor to each letter's center, map distance →
   concentric "rings" → variable-weight + colour via CSS custom props in a rAF loop.
   Touch = static fallback. *(Real code in the Codrops case study.)*
2. **Variable-weight morph on hover/scroll** — interpolate `font-variation-settings`
   `wght`/`wdth` smoothly between extremes (no hard jumps). One axis at a time = clarity.
3. **3D text in WebGL** — two routes:
   - **troika-three-text**: SDF glyphs, crisp at any scale, parses `.woff/.ttf`
     directly, runs font work in a web worker (no frame drops), and **patches any
     three.js material** → gets PBR lighting, shadows, fog. Best for live 3D text.
   - **TextGeometry** (three.js): extrudes 2D outlines to real geometry — heavier,
     but true extruded/forged-metal letters.
4. **CSS 3D reveals** — big lines do a full **X-axis rotation** as they enter the
   viewport, then settle. Cheap (`transform: rotateX`), high drama, used sparingly.
5. **SplitText per-letter/word reveals** tied to scroll (GSAP ScrollTrigger) — the
   blur-to-sharp, stagger-in pattern (we already do a version in `ForgeText`).
6. **Scroll-driven, JS-free** — the **CSS Scroll-Driven Animations API**
   (`animation-timeline: scroll()/view()`) ties type reveals/morphs to scroll with
   zero JS. Pair with **Lenis** for buttery momentum scrolling.
7. **Ambient scroll-reactive numerals** — giant ghosted numbers drift on a slow
   **sine wave whose speed tracks scroll velocity**; settles when scrolling stops.
   (We already have the spinning trust numerals — this adds life cheaply.)
8. **Pinned scroll panels** — stacked panels replace each other vertically in a pinned
   section; each panel's internal type animates **only when visible**. Scroll = state
   (fully reversible), not a one-shot trigger.

## 3. The stack the best 2026 type sites use
GSAP + **ScrollTrigger** + **SplitText** (animation), **Lenis** (smooth scroll),
variable fonts (real-time morph), troika-three-text (WebGL text), the native
**CSS Scroll-Driven Animations API** (JS-free reveals). Performance is a design
constraint: pause loops off-screen, simplify on mobile.

## 4. Mapped to GAELWORX (on-brand, ranked by impact ÷ effort)
> Constraint: **Cinzel Decorative is static (700/900)** — it can't weight-morph. But
> **Bricolage Grotesque is already loaded as a VARIABLE font** — use it for the
> weight-breathing play. Cinzel gets *transform/glow/3D* play, not weight morph.

**A. Forge-proximity ignite (high impact, low effort).** A wordmark/glyph field where
letters **ignite (forge-glow gradient + heavier weight) by distance to the cursor** —
the Exat technique, re-skinned as the forge lighting the letters. This *extends* the
brand's existing "forge-light follows the finger." Bricolage glyphs morph `wght`
200→900; Cinzel glyphs swap to the `.forge-letter` gradient by ring. Hero or a
section centerpiece. Touch → static ignited state.

**B. 3D forged wordmark (high impact, med effort).** Render **GAELWORX as real
extruded/SDF 3D** (troika-three-text or TextGeometry) inside the obsidian scene — a
**forged-metal wordmark** catching the fire-opal light, slow rotate + pointer parallax,
the A+E faces emissive (the ignite, in 3D). The literal "wordmark forged from the slab."
Lazy-load; desktop-only or reduced on mobile.

**C. X-axis rotation reveals on section heads (med/low).** Page `pg-h2`/`pg-title`
do a `rotateX(-90deg)→0` Forge-Reveal as they scroll in (blur-to-sharp we already use).
Pure CSS via the Scroll-Driven Animations API → no JS, no perf cost. Applies site-wide
through the shared `Section`/`PageShell` — instant consistency.

**D. Lenis smooth scroll (med, big feel upgrade).** Wrap the scroll in Lenis so the
home scroll-jack + the new pages glide. Directly addresses "pacing feels off." Honor
`prefers-reduced-motion` (disable).

**E. Scroll-velocity numerals (low).** Make the giant ghosted trust numerals + the
finale spin **react to scroll speed** (faster scroll → faster drift, settle on stop).

**F. Variable-weight breathing on Bricolage headlines (low).** Subtle `wght` breathing
or hover-morph on `pg-h2`s for "letters that breathe."

## 5. Guardrails (non-negotiable, per brand + perf)
- **Restraint**: expressive type is *punctuation* — 1–2 hero moments per page, not every
  element. Brutalist Snap = impact, not bounce.
- **`prefers-reduced-motion`**: every effect has a static fallback (already our pattern).
- **Mobile**: simplify, don't replicate (proximity → static ignite; 3D text → 2D).
- **Off-screen pause**; lazy-load WebGL text; keep within the LCP/JS budget.
- **Legibility first** (CLAUDE.md): the ignite/forge play never costs readability.

## Sources
- Codrops — [The Exat Microsite (variable-font showcase, with code)](https://tympanus.net/codrops/2026/04/10/the-exat-microsite-pushing-a-typography-showcase-to-new-creative-extremes/)
- Codrops — [3D Typing Effects with Three.js](https://tympanus.net/codrops/2022/11/08/3d-typing-effects-with-three-js/)
- Troika — [troika-three-text (SDF WebGL text)](https://protectwise.github.io/troika/troika-three-text/)
- Codrops — [Responsive & Accessible WebGL Text with Three.js + Troika](https://tympanus.net/Tutorials/AccessibleWebGLText/)
- CSS-Tricks — [Techniques for Rendering Text with WebGL](https://css-tricks.com/techniques-for-rendering-text-with-webgl/)
- Creative Bloq / Awwwards — [Typography in Web Design](https://www.awwwards.com/websites/typography/)
- Medium (Bootcamp) — [Typography Trends 2026–2027: When Letters Begin to Breathe](https://medium.com/design-bootcamp/typography-trends-2026-2027-when-letters-begin-to-breathe-8499fb6c5ef1)
- The Inkorporated — [Typography Trends 2026: Variable Fonts, Kinetic Text](https://www.theinkorporated.com/insights/future-of-typography/)
- veebilehed24 — [30 Modern CSS Text Effects (2026)](https://veebilehed24.ee/en/blog/modern-css-text-effects-2026/)
