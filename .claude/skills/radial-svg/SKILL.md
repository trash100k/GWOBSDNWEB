---
name: radial-svg
description: >-
  Build or fix a radial/rotationally-symmetric SVG ornament — a mandala, seal,
  ring, knotwork band, badge. Use when making one, or when an existing one reads
  as "scattered / wonky / doesn't form rings / muddy." Encodes the primitives that
  actually work (real circles + N-fold rotated motifs, NOT curved running text),
  the band-height rule, coherent animation, and real Celtic interlace.
---

# radial-svg — make it read as a clean symmetric wheel

Grounded in the finale mandala rebuild (`src/ui/Mandala.jsx`,
`docs/research/mandala-construction-and-animation.md`). The old one used curved running text on
circle `textPath`s and read as scattered hash; the rebuild uses geometry and reads as crisp rings.

## The primitives (use these, not running text)
- **Skeleton = real `<circle>` keylines.** Concentric circles ALWAYS read as rings. Curved running
  text on a closed `textPath` does **not** — `repeat(n)` overflows and truncates, tight tracking packs
  it into illegible texture, and the bottom arc is upside-down. At most ONE subtle word rim; geometry
  carries the read. (Rebuild: `circles=[472,408,344,280,216,152]`, even ~64px spacing.)
- **Motifs via true N-fold rotation.** Define ONE motif, place it at `rotate(k·360/N)` around center:
  `const ring=(n)=>Array.from({length:n},(_,i)=>i*360/n)`, then
  `{ring(16).map(a=> <path d={petal(...)} transform={`rotate(${a})`}/>)}`. Tiny code, perfect symmetry,
  guaranteed alignment. Helper: `petal(ri,ro,w)` = a leaf between two radii.
- **Band-height ≤ the radial gap.** The #1 "mush" cause: a motif/glyph band taller than the space
  between rings → adjacent bands collide (old bug: `fs72 @ r376` over a 54px gap). Even spacing +
  breathing room between bands.

## Animate coherently (not chaos)
- **≤2 counter-rotating groups**, slow (`.m-spin--out` 120s / `.m-spin--in` 88s); keep the circle
  skeleton + center **still**. NOT one spin per ring — 12 independent spins destroy the symmetry read
  (it looks like rotating static). N-fold symmetry means a slow turn always stays symmetric.
- Reconcile with any container rotation (the finale scroll-jack already spins the whole layer — let
  that be primary; the internal groups add subtle depth). Compositor-only (`transform`); reduced-motion
  → static.
- **PIVOT GOTCHA (cost us a "split mandala"):** to spin a `<g>` around the centre, use
  `transform-box:fill-box; transform-origin:center` — pivot on the group's OWN bbox centre. Do NOT use
  `transform-box:view-box; transform-origin:50% 50%` on a **centred viewBox** (e.g. `-500 -500 1000
  1000`): Chrome resolved `50% 50%` to the viewBox **corner** (user `(500,500)`), not the centre, so the
  whole rotating band got flung a full box-width into the bottom-right while the still skeleton stayed
  centred — a mandala torn in two. `fill-box`+`center` sidesteps the viewBox-origin ambiguity (the
  motifs are authored symmetric, so their bbox centre IS the true centre). The skeleton circles aren't
  in a spin group, so they CAN'T reveal this — you must test the spin groups (see Verify).

## Celtic interlace (if used)
Real plaitwork is **grid-based strict over/under** — what crosses over goes under at the next crossing.
Two offset sine waves are NOT a knot (the old `strand()` mistake); use a proper interlace tile or
crossing-order masks.

## Brand
Ink body + ember rim (`paint-order:stroke fill`) + forge-glow core; let the obsidian veins bleed
through the gaps. Palette tokens only.

## Verify — the geometric QA loop (don't eyeball; MEASURE)
"Rings all over the place / not lined up / not in frame" are **measurable**, so prove them with a
harness, not a screenshot — `scripts/mandala-qa.mjs` (`npm run qa:mandala`), green and required:
- **Deterministic mode:** emulate `prefers-reduced-motion` → Lenis is off (it's only built in
  full-motion), so `window.scrollTo` drives `scrollY` directly. The mandala's placement/scale/opacity
  don't depend on the reduced flag, and circles are rotation-invariant, so killing `.m-spin` perturbs
  nothing measured. Scan the scroll track for the `.fin-mandala` opacity peak, then measure there.
- **Geometry in user units via `getBBox()`** (ignores CSS transforms/filters → clean): every `.m-ring`
  centre on the origin (CONCENTRIC, the "all over the place" check), each radius on its designed mark,
  strictly nested. **Caveat:** `getBBox()` ignores an element's OWN `transform="rotate()"` attribute, so
  it's right for the centred skeleton circles but NOT for placed motifs — for those use `getCTM()` or
  `getBoundingClientRect()`.
- **Layout in CSS px via `getBoundingClientRect()`:** whole box inside the viewport (IN-FRAME), centre
  == viewport centre (CENTERED). Both viewports (393×852 + 1440×900). Exits non-zero on any failure.

Then `qa-route` (0 console errors — SVG/filters compile) + owner reads it on the iPhone 15 (it should
resolve as a banded symmetric wheel that turns as one). The harness guards structure; the eye judges
the aesthetic.
