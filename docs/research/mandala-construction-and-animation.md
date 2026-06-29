# GAELWORX — Research: making & animating the finale mandala (it reads as a mess)

> The finale "eye of the whirlpool" mandala (`src/ui/Mandala.jsx` + `.mandala-*` in
> `src/styles.js`) reads as muddy noise, not a mandala. This diagnoses why **in the
> actual code**, then gives the construction + animation craft to rebuild it right.

---

## Why the current one is a mess (grounded)

1. **The rings physically overlap — band height > radial gap.** Word-rings sit at radii
   478/430/376/316/258/202/150/104 (gaps ≈ 48–60px) but render at font sizes 34/52/**72**/52/64/44/34/26
   (`Mandala.jsx:50-57`). A 72px glyph band extends ±36px from its baseline; a 52px band ±26px. So the
   r376(fs72) and r430(fs52) bands span ±62px across a 54px gap → **they collide.** Several rings overlap.
   That alone turns concentric order into mush.
2. **12 layers each counter-rotate at different speeds** (`.mw--a…h` + `.mk--k1…4`, 48–150s,
   `styles.js:442-447`). A mandala's entire power is **radial symmetry = order**; spinning every band
   independently *destroys* the symmetry read frame-to-frame. It looks like rotating static, not a wheel.
   (And the finale scroll-jack ALSO spins the whole layer, `spin = fp*680` in `Content.jsx`, stacked on top.)
3. **Curved running text is illegible as structure.** `PHRASES[p].repeat(20)` on a circular `textPath`
   with negative tracking (`Mandala.jsx:123-126`) packs glyphs into a band, but on a full circle the
   bottom half is **upside-down**, and at tight tracking it's texture, not words. Eight such bands ≈ visual hash.
4. **The "knots" aren't knots.** `strand()` (`Mandala.jsx:31-42`) draws two offset sine waves — concentric
   wavy lines, **no over/under interlace**, so it reads as wobble, not Celtic plaitwork.
5. **One hard drop-shadow over the whole group.** `filter:url(#mInk)` wraps the entire 8-ring `<g>`
   (`Mandala.jsx:120`) — a single offset shadow under overlapping rotating text = a muddy smear.
6. **Over-packed, no breathing room.** 8 word-rings + 4 knot bands + 72 ticks + boss in one disc. Mandalas
   need **clear separation between bands**; this has none.

---

## The craft (how mandalas are actually built)

**1 — Build on a grid of concentric circles × radial divisions.** Pick an **N-fold** symmetry (divide the
circle every 360/N°: 30°→12, 45°→8). Draw evenly spaced concentric rings. The **intersections are the
skeleton** — every motif sits on a grid point, repeated around all N axes. Even spacing + a fixed grid is
what makes it read as *order*. ([mandala grid construction](https://zensangam.com/en-usa/blogs/zen-blogs/methods-for-mandala-grid-construction), [sacred geometry guide](https://mysticryst.com/blogs/the-mystic-journal/how-to-create-mandala-sacred-geometry-drawing-guide), [Kennedy Center — polygons & symmetry](https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/lessons/6-8/mandalas-polygons-and-symmetry/))

**2 — Radial symmetry is the whole point.** The design must look identical when rotated by 360/N. Work
**center → outward**, one band at a time, with hierarchy (anchored core, mid bands, outer rim) and
**breathing space between bands**. ([math of mandalas](https://www.madhubani-art.in/how-mandala-art-is-related-to-maths/), [advanced composition/layering](https://oboe.com/learn/advanced-mandala-composition-and-geometry-10pbl9x/intricate-pattern-layering-156h9ni))

**3 — In SVG: define ONE motif, `<use>` it rotated N times.** Don't hand-place or rely on running text.
Define a single wedge/petal/glyph in `<defs>`, then `<use href="#motif" transform="rotate(a)">` for
`a = k·360/N`. You get **true rotational symmetry, perfect alignment, and tiny code**, and you can rotate
the parent group to animate the whole thing coherently. Group transforms rotate a whole `<g>` about its
origin. ([SVG transform/rotate — MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform), [Sara Soueidan — SVG transforms](https://www.sarasoueidan.com/blog/svg-transformations/), [CSS-Tricks — transforms on SVG](https://css-tricks.com/transforms-on-svg-elements/))

**4 — Real Celtic interlace is grid-based strict over/under.** On a square/diagonal grid, mark crossings
and **alternate over/under every crossing** ("what crosses over must go under the next"). Two sine waves
can't do this — you need crossing order (a thick "ink" strand drawn over, broken where it goes under, with
the ember strand beneath). Or repeat ONE proper knot tile `<use>`-style around the ring. ([Digital Magpie — constructing interlace](https://digitalmagpie.wordpress.com/2014/07/09/how-to-constructing-celtic-interlace-knotwork/), [calligraphy-skills — knotwork](https://www.calligraphy-skills.com/how-to-draw-celtic-knotwork.html), [isotropic.org — celtic knot explained](https://isotropic.org/celticknot/explanation/))

---

## Redesign direction for GAELWORX (brand-aligned)

- **Pick N = 8 or 12** (ties to the 4 branches × 2/3). Rebuild every band as a motif `<use>`-repeated on
  that grid, not as repeated running text.
- **Cap band height ≤ 70% of the radial gap.** Even spacing; **fewer bands** (≈4–5) with real gaps so the
  obsidian veins breathe through (on-brand "fire bleeds through the ink").
- **At most ONE curved word-ring**, upright-corrected (split top/bottom arcs so text never inverts), as the
  outer "incantation" band — the rest geometric. Curved running text is decoration, not the structure.
- **Real interlace** for the knot band: ink strand drawn *over* with masked breaks where it dives *under*
  the ember strand — or a single clean knot tile repeated N times.
- **Hierarchy preserved:** forge-glow core (boss) → 2–3 mid bands → outer rim ticks. Per-band shadows
  (or none), not one smear over everything. Keep ink + ember rim + the fire-opal bleed.

---

## Animation — coherence over chaos

- **The fix is fewer moving parts.** Replace 12 independent spins with **one coherent rotation of the whole
  mandala**, plus **at most two counter-rotating groups** (inner vs outer) for subtle depth/parallax. N-fold
  symmetry means any rotation looks "right," so it can be slow and still feel alive. Don't fidget-spin each ring.
- **Slow.** It's a contemplative anchor: ~1 rotation / **90–180s**. The finale scroll-jack already drives a
  scroll-coupled rotation (`spin` in `Content.jsx`) — make THAT the primary motion and drop the competing
  per-ring CSS spins (or keep one gentle counter-rotation under it).
- **Breathing, not spinning, for life:** a subtle scale pulse (±2–3%) and/or an opacity shimmer on the ember
  layer reads as "alive" without breaking symmetry.
- **Compositor-only** (`transform`/`opacity` — `will-change:transform` is already set, `styles.js:441`).
  Keep the `prefers-reduced-motion → animation:none` rule (already `styles.js:507`) so it sits static & legible.
- **Mobile:** `.fin-mandala{min(112vw,92vh)}` is huge on a phone — with fewer/cleaner bands that's fine, but
  verify the outer band isn't clipped and detail still reads on the iPhone 15.

## Verify
Rebuild → `npm run build` → `qa-route` (0 console errors @ 393×852 + 1440×900) → scrub the finale and
**read it on the iPhone 15**: it should resolve as a clearly-banded, symmetric wheel that turns as one,
not rotating hash. Tune band count / N / speed from that read.

## Sources
- [Zen Sangam — mandala grid construction](https://zensangam.com/en-usa/blogs/zen-blogs/methods-for-mandala-grid-construction) · [Mystic — sacred geometry guide](https://mysticryst.com/blogs/the-mystic-journal/how-to-create-mandala-sacred-geometry-drawing-guide) · [Kennedy Center — mandalas, polygons & symmetry](https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/lessons/6-8/mandalas-polygons-and-symmetry/) · [Madhubani — mandala & maths](https://www.madhubani-art.in/how-mandala-art-is-related-to-maths/) · [Oboe — advanced composition & layering](https://oboe.com/learn/advanced-mandala-composition-and-geometry-10pbl9x/intricate-pattern-layering-156h9ni)
- SVG: [MDN transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) · [Sara Soueidan — SVG transformations](https://www.sarasoueidan.com/blog/svg-transformations/) · [CSS-Tricks — transforms on SVG elements](https://css-tricks.com/transforms-on-svg-elements/)
- Knotwork: [Digital Magpie — constructing interlace](https://digitalmagpie.wordpress.com/2014/07/09/how-to-constructing-celtic-interlace-knotwork/) · [calligraphy-skills — how to draw knotwork](https://www.calligraphy-skills.com/how-to-draw-celtic-knotwork.html) · [isotropic.org — celtic knot explanation](https://isotropic.org/celticknot/explanation/)
