---
name: brand-check
description: >-
  Enforce the GAELWORX brand source-of-truth (CLAUDE.md) on any UI/content change
  — the A+E ignite rule, Cinzel/grotesk type system, Industrial-Metallurgy palette,
  0px-corner Neo-Gaelic Brutalism, and the Clan voice. Use when adding/editing copy
  or components, reviewing a UI diff, or when something looks off-brand. Catches the
  subtle, easy-to-break rules (ignite scope, display-vs-body, brand-term list).
---

# brand-check — keep it on-brand (CLAUDE.md is binding)

`CLAUDE.md` is the source of truth; this skill is its enforcement checklist with the exact
code hooks. Run it over any change that touches UI, copy, type, color, or motion.

## The A+E ignite rule — the thing most often gotten wrong
Within each WORD of a brand proper-noun, **only the first `A` and first `E` ignite** (900 Cinzel
Decorative, forge-glow gradient). "**A**utomatic **E**xecution" — never "Autom**A**tic Ex**E**cution".
One A + one E per word, max. Logic lives in **`igniteIndices()`** (`src/ui/Ignite.jsx:9`) — reuse it,
never re-implement.

**Ignite only fires in ALL-CAPS display.** Cinzel Decorative has **no lowercase glyphs**, so igniting
inside lowercase prose makes ransom-note caps ("YArdWorx", "MAEve"). Therefore:
- **Display / all-caps** (hero headline, Nav, Loader, finale mark): `<Ignite>` (`src/ui/Ignite.jsx`)
  or `<ForgeText … ignite>` (`src/ui/ForgeText.jsx`) → real A+E glow.
- **Body / running prose**: `<BrandText>` (`src/ui/BrandText.jsx`) → brand terms get a plain
  `.brand-term` weight bump, **no ignite**. This is correct, not a bug.
- **New brand term?** Append it to `TERMS` (`BrandText.jsx:12`). The ignited set is:
  GAELWORX · Automatic Execution · Maeve · YardWorx · RepairWorx · SalesWorx · AgentWorx.
  Never ship a brand term in display without its ignited A/E.

## Type
- **Cinzel Decorative** = the ONLY display/brand serif, weights **700 & 900 only** (never <700).
  Token `--gw-display`. Used for the wordmark, "Automatic Execution", brand headings.
- **Bricolage Grotesque** (`--gw-headline`, 700–800, tight) = section headings.
- **Hanken Grotesk** (`--gw-sans`, 400/600/700) = body/labels. JetBrains Mono = optional tech labels.
- Don't introduce new fonts/weights. Self-hosted via `@fontsource*` (see `package.json`).

## Palette — Industrial Metallurgy (CSS) / warm forge (3D)
CSS tokens `--gw-*` in `src/styles.js`: Celtic Blood `#C1292E` (`--gw-forge`), Ember `#E85D04`
(`--gw-ember`), Forged Iron `#0B0C10` (`--gw-void`), Cold Steel `#1F2833` (`--gw-iron`), Fog White
`#F1F2F6` (`--gw-bone`), Ash `#8D99AE` (`--gw-steel`). 3D uses `PAL` (`src/scene/palette.js`,
60/30/10 warm). **Use tokens, never raw hexes.** Icons: 1.5px monolinear stroke, monochrome unless
representing an active system (then Ember).

## Neo-Gaelic Brutalism (layout)
- **0px border-radius everywhere. Sharp corners. Never rounded** — through every state, incl. hover.
- 1–2px **solid** borders (Celtic Blood emphasis / Ash subtle). Iron Grid: strict 12-col, **0px
  gaps** between structural containers. Depth = L1 1px Ash border · L2 inner `#E34A27` glow @10% ·
  L3 **8px hard `#000` drop shadow** (no soft blur for structure).
- Motion = Brutalist Snap / Forge Reveal / Drift → defer to the **`motion-feel`** skill.

## Voice — the Clan voice
Aggressive (direct commands, **no passive voice**), clean (zero fluff, technical precision),
battle-tested. CTAs "Point the Sword": high-contrast, sharp, immediate feedback. No corporate hedge.

## Procedure
1. Scan the diff against the sections above. Flag any: every-A/E ignite, ignite in lowercase prose,
   raw hex, new font/weight, rounded corner, soft structural shadow, passive/fluffy copy, brand term
   missing from `TERMS`.
2. Fix using the existing components/tokens (don't reinvent).
3. Verify via **`qa-route`** (0 console errors @ both viewports) + eyeball the ignite/type/corners.
