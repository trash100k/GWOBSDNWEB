---
name: kinetic-type
description: >-
  The GAELWORX kinetic/3D typography + font-play SYSTEM — how display text animates
  (the per-char etch/blur→sharp reveal) and how the A+E forge-glow is actually applied
  (gradient, lavaFlow, ember shadow). Use when adding or editing an animated heading,
  wordmark, or finale mark, when text should "play with the letters," or when a heading
  isn't igniting / isn't revealing right. Owns the MECHANICS — `brand-check` owns the rule.
---

# kinetic-type — how GAELWORX text moves and catches fire

`brand-check` owns the **RULE** (which letters ignite, the type/palette/voice law). This skill owns
the **MECHANICS**: which component to use, how the etch reveal works, and how the forge-glow is built.
Don't re-derive the ignite rule here — reuse `igniteIndices()` (`src/ui/Ignite.jsx:9`) and defer scope
questions to `brand-check`. Grounding research: `docs/research/typography-3d-fontplay.md`
(Cinzel is static 700/900 → gets transform/glow/3D play, never weight-morph — line 53-55).

## Pick the component (this is the choice that's gotten wrong)
| Context | Component | Ignites? | Why |
|---|---|---|---|
| **Animated display heading** (section/page head) | `<ForgeText text… ignite>` (`src/ui/ForgeText.jsx:10`) | yes, with `ignite` | per-char etch reveal + A+E glow |
| Animated head, no brand term | `<ForgeText text… />` | no | same reveal, plain letters |
| **Static all-caps display** (Nav mark, Loader, finale wordmark) | `<Ignite text… />` (`src/ui/Ignite.jsx:25`) | yes | no scroll reveal needed; pure A+E glow |
| **Body / running prose** | `<BrandText text… />` (`src/ui/BrandText.jsx:24`) | **NO** | Cinzel is caps-only → igniting lowercase = ransom-note. `.brand-term` weight bump only (`BrandText.jsx:8`) |

`ForgeText`/`Ignite` split words and ignite per-word via `igniteIndices()` — first `A` + first `E` only
(`ForgeText.jsx:18`, `Ignite.jsx:31`). Never ship a display brand term without its A/E. New term → add to
`TERMS` (`BrandText.jsx:12`) per `brand-check`.

## The forge-glow mechanics (`.forge-letter`, `src/styles.js:37`)
- `font-family:var(--gw-display)` + `font-weight:900` — **Cinzel Decorative 900, the only ignited weight**
  (`styles.js:38`). `--gw-display` is the sole display serif (`styles.js:12`); 700/900 only, never <700.
- Gradient: `linear-gradient(to bottom, #E85D04, #C1292E, #E34A27, #C0392B)` over `background-size:100% 200%`,
  clipped to the glyphs (`background-clip:text` + transparent fill) (`styles.js:42-45`).
- **Flow:** `animation:lavaFlow 3s infinite alternate ease-in-out` — `lavaFlow` just pans `background-position`
  0%→100% (`styles.js:47`, keyframes `styles.js:49`), so the fire crawls through the letters. The glow
  rides the gradient size, not the glyph.
- **Ember halo:** `text-shadow:0 0 22px rgba(232,93,4,0.45)` (`styles.js:46`). Letters are
  `display:inline-block; vertical-align:baseline; line-height:1` so the gradient-clipped glyph sits flush
  with neighbors — no baseline float (`styles.js:39-41`).
- **Type-as-fire variant** (whole head filled with the live fire, not just A/E): the `.flame` class
  (`styles.js:363`) — a richer 178° gradient + a dark halo so it reads over both obsidian and bright veins
  (`styles.js:370`). Use for hero-scale "the type IS the forge," not per-term ignite.

## The kinetic reveal mechanics (the etch)
- `ForgeText` calls `useReveal()` (`hooks.js:25`) — an rAF poll on `getBoundingClientRect` that flips `shown`
  true once the element crosses ~0.9 viewport and stops (bulletproof vs IntersectionObserver under
  programmatic/Lenis scroll). It adds `.shown` to `.forge-text`.
- Each letter is a span carrying `--i` (its global char index) and `--d` (the `delay` prop) inline
  (`ForgeText.jsx:23`). Start state: `opacity:0; translateY(0.5em); filter:blur(7px)` (`styles.js:355-356`).
- Transition: `.7s var(--ease)` on opacity/transform/filter, **staggered** by
  `transition-delay:calc(var(--i)*16ms + var(--d,0ms))` (`styles.js:357-358`). `.shown` resolves to
  `opacity:1; transform:none; blur(0)` (`styles.js:359`) → letters etch in left-to-right, blur→sharp = the
  **Forge Reveal**. For the duration/easing/blur-budget numbers and why ease-out (`--ease`, `styles.js:15`),
  defer to **`motion-feel`** — don't freehand them. Words use `.word{display:inline-block;white-space:nowrap}`
  so they never break mid-word (`styles.js:354`).

## Add a new animated/ignited heading (procedure)
1. **Animated head?** Use `<ForgeText as="h2" text="…" />`. Brand term in it (caps display)? add `ignite`.
   Sequence multiple heads with the `delay` prop (feeds `--d`), not new CSS.
2. **Static caps display** (mark/nav/loader/finale)? Use `<Ignite text="…" />`. **Body prose?** `<BrandText>` —
   never ignite, never Cinzel-lowercase.
3. Keep `--gw-display` + weight 900 for ignited letters / 700–900 for display; introduce no new font/weight.
   Reuse `.forge-letter`/`.flame` — don't hand-roll the gradient or shadow.
4. Run **`brand-check`** on the diff (ignite scope, every-A/E, display-vs-body, `TERMS`).

## Done / verify
- Heading etches in on scroll (blur→sharp, per-char stagger); ignited A/E glow flows (`lavaFlow`) and sit on
  the baseline (no float).
- **Reduced motion:** `@media (prefers-reduced-motion:reduce)` kills the reveal transition and `lavaFlow`,
  leaving **static, fully legible** text (`styles.js:503-506`) — confirm the head still reads with no motion.
- Verify the route via **`qa-route`**: build green, 0 console errors @ 393×852 + 1440×900, content present.
