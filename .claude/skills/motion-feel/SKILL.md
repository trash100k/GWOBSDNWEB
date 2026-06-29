---
name: motion-feel
description: >-
  Apply GAELWORX's motion laws to ANY animation or transition — element reveals,
  hovers, button/CTA feedback, nav, page entrances, micro-interactions. Use when
  adding new motion, reviewing a diff that animates, or fixing something that
  feels cheap/janky/off-brand. Enforces Brutalist Snap + Forge Reveal + Drift,
  the duration/easing numbers, the blur budget, compositor-only discipline, and
  reduced-motion safety. For the home scroll-jack specifically, use `tune-pacing`.
---

# motion-feel — the GAELWORX motion laws, applied

Source of truth: `CLAUDE.md` → **Motion Laws**, backed by `docs/research/pacing-fluidity-snap.md`
and `pacing-motion-deep-dive.md`. Three laws, each with a home:

- **Brutalist Snap** → interactions & landings. *Decisive — 0ms delay, ease-out, no bounce, only impact.*
- **Forge Reveal** → content entrances. *Blur→sharp + slight rise, ease-out.*
- **Atmospheric Drift** → ambient (embers/veins/haze). *Slow constant velocity, dt-driven.*

## The numbers (don't freehand these)
| Use | Duration | Easing |
|---|---|---|
| Tap / hover / CTA feedback | **120–220ms** | ease-out (`var(--ease)`), **never linear, never bounce** |
| Content transition / reveal | **300–600ms** | ease-out, optional `transition-delay` for stagger |
| Forge Reveal blur | resolve fast; blur radius **≤ ~10px** | steeper than the position curve |
| Ambient drift | seconds, looping | linear/sine, constant velocity |

`<200ms` reads near-instant; `>600ms` feels sluggish. **Ease-out makes things feel snappier without
changing duration** — it's the cheapest "impact" you can buy.

## Hard rules
1. **Compositor-only:** animate **`transform` + `opacity`** (and *sparingly* `filter`). Never animate
   `top/left/width/height/margin` — they reflow = jank.
2. **`filter: blur()` is NOT cheap.** Bound radii (≤ ~10px), don't animate blur over large surfaces,
   prefer opacity + slight `scale`/`translate` on mobile. The OLED iPhone 15 is the budget target.
3. **No bounce, ever.** Brand law. Springy overshoot is off-brand — "only impact."
4. **0px corners stay 0px** through every state (no radius animation). Borders/shadows are the
   brutalist depth (1px Ash / 8px hard `#000`), not soft glows.
5. **`prefers-reduced-motion` is mandatory.** Provide a static end-state (the code's `reduced`
   branches + `@media (prefers-reduced-motion: reduce)` in `styles.js`). Crawlers/no-JS must still
   see content.
6. **One rAF, shared state.** Per-frame JS motion reads `src/store.js` (`forge.*`) in the existing
   loops — don't spawn competing rAFs or `setInterval`. Use dt-correct damping
   (`THREE.MathUtils.damp` / `store.js:damp`), not frame-rate-dependent `lerp(a,b,k)`.
7. **Lenis ≠ CSS `scroll-snap`** — they're incompatible (Lenis hijacks scroll). Don't add
   `scroll-snap`. Achieve "snap" via decisive element transitions instead.

## A+E + type still apply in motion
Ignited brand terms (`<Ignite>`/`<BrandText>`, the forge gradient) keep their glow through
transitions — don't strip `.forge-letter` styling mid-animation. Cinzel Decorative ≥700 only.

## Procedure
1. Classify the motion: **interaction → Snap**, **entrance → Reveal**, **ambient → Drift**. Pick the
   row in the numbers table.
2. Implement with `transform`/`opacity` + `var(--ease)`; add the reduced-motion end-state.
3. **Verify:** `npm run build` green · Playwright @ 393×852 + 1440×900, **0 console errors** · no
   layout-prop animation in the diff · blur radii bounded · reduced-motion path present.
4. If it touches the home scroll rhythm, hand off to **`tune-pacing`** and verify on the iPhone 15.
