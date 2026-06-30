# Building color palettes — and harmonizing the GAELWORX UI with the obsidian background

Research + the concrete fix for: *"the orange color palette of the copy has to go and match
the background."* The site's CSS accent is a bright candy-orange (`--gw-ember #E85D04`, used
84×) while the live 3D background's fire is **blood-red dominant** (`#C1292E`/`#c8200a`) with
ember only at the hottest vein cores. The orange UI is the outlier. Below: how cohesive
palettes are actually built, then the exact token remap that pulls the copy onto the
background's fire.

---

## 1 · The principles (sourced)

### 60-30-10 — proportion is the palette
A cohesive scheme is **60% dominant / 30% secondary / 10% accent**. The dominant is usually a
near-neutral that sets the mood; the secondary adds the depth/contrast mass; the accent is the
one bold pop, used sparingly. The most common failure is over-using the accent so it stops
reading as an accent. *(NN/g; Wix; ElephantStock)*

GAELWORX is **already specified this way** in `src/scene/palette.js`: 60 obsidian void · 30 deep
crimson/forge-red · 10 ember/gold (HDR, so only the 10% blooms). The CSS UI broke the contract:
it promotes the 10% ember-**orange** to a de-facto 30%, painting kickers, prices, borders,
hovers, and glows in `#E85D04` everywhere. The fix is to put the proportions back: structure in
crimson (the 30), ember reserved for true sparks (the 10).

### Color harmony — pick a relationship, not random hues
- **Monochromatic** — one hue, varied lightness/saturation. Maximum cohesion, lowest contrast.
- **Analogous** — neighbors on the wheel (e.g. red → red-orange → orange). Warm, harmonious,
  low-tension. **This is the forge:** obsidian → crimson → ember are analogous warms.
- **Complementary** — opposites (red ↔ cyan). High tension; use one as 10% accent only.
- **Triadic** — three evenly spaced; vivid but harder to balance.
The obsidian fire opal is naturally **analogous-warm + a complementary opal flash** (the
play-of-color throws cyan/violet against the warm body — a tiny complementary spark). *(color-wheel theory; NN/g)*

### Dark-UI accent rules (why bright orange hurts here)
- **Desaturate/deepen accents on dark.** Saturated hues on near-black produce *optical
  vibration* and glare; drop ~20 saturation points vs light mode. A bright orange (`#E85D04`,
  green channel 0x5D=93) on `#0B0C10` is exactly the vibration case.
- **Reserve the brightest, most saturated value for the smallest area** (the 10% accent / the
  one CTA), never the running text accents.
- **Text/contrast:** body stays soft-white (`#F1F2F6`), never pure `#FFF`; keep ≥ 4.5:1 for
  normal text, ≥ 3:1 for large. Red accents on obsidian clear this for headings/large UI; never
  set long body text in the saturated accent. *(Material dark theme; Toptal; atmos.style)*

### Deriving a palette from a source (image/scene)
To make UI "match" a visual, **sample the source and build from it** rather than guessing:
1. Pull the dominant (the body), the shadow mass, and the brightest spark from the source.
2. Map them to 60/30/10 roles.
3. Tune for the surface (desaturate the accent for dark-UI), then check contrast.
The source here is `palette.js` (the canonical scene palette) — so the UI should be built from
those exact swatches, not a separate orange.

---

## 2 · The GAELWORX application — the remap

**Background swatches (the truth to match), from `palette.js`:**
`void #050507` · `crimsonDeep #3a0905` · `crimson #8c140a` · `red #c8200a` · `ember #ff5a1e`
(hot cores only) · `gold #ffb15a` · plus the opal play-of-color (cyan→violet) flashing in the veins.

**The move:** swap the UI's broad candy-orange for the background's **forge-red**, and demote
ember to a spark. One token carries 84 usages, so retuning it cascades the whole UI.

| CSS token | Was (orange) | Now (background-matched) | Role |
|---|---|---|---|
| `--gw-void` | `#0B0C10` | `#0B0C10` *(unchanged)* | 60 — obsidian base |
| `--gw-forge` | `#C1292E` | `#C1292E` *(unchanged)* | 30 — Celtic Blood, structure/borders |
| `--gw-ember` | **`#E85D04`** | **`#DA2C1C`** | 10 — the accent, now a warm **forge-red** (g 0x2C=44, not 0x5D) so it reads as the background's fire, not candy-orange |
| `--gw-ember-deep` | `#E34A27` | `#C1292E` | deep accent → crimson |
| scattered glow literals | `rgba(232,93,4,…)` `rgba(227,74,39,…)` | `rgba(218,44,28,…)` `rgba(193,41,46,…)` | the inner-glow / drop literals retuned to the same reds |
| `.forge-letter` A+E ignite | `…#E85D04, #C1292E, #E34A27, #C0392B` | `…#DA2C1C, #C1292E, #C1292E, #C0392B` | the ignite fire becomes blood-red, no orange top |

**Scope:** only the UI surfaces — `src/styles.js` + each `src/pages/*.jsx` `<style>` block. The
**scene is left untouched** (`palette.js` + the shaders ARE the background we're matching;
changing them would move the target). `#ff5a1e` in `palette.js` stays.

**Why `#DA2C1C` for the accent:** it sits on the analogous warm line between the background's
`red #c8200a` and Celtic Blood `#C1292E`, with the green channel pulled down out of "orange"
range — so it pops as the 10% on obsidian, harmonizes with the 30% `--gw-forge` crimson, and
reads as the same fire as the veins. Tunable in one place (`--gw-ember`) if you want it warmer
(toward `#D8331A`) or deeper (toward `#C1292E`).

**Optional secondary (not applied yet):** the background also throws an **opal** cyan/violet
play-of-color. A cool iridescent secondary (e.g. a `#7FD8E6`→`#B49BE0` accent on a hover/active
state) would echo that complementary flash and add the gem's "fire" to the UI without
reintroducing orange. Flagged for a follow-up if you want the iridescence in the copy too.

**Brand-doc note:** `CLAUDE.md` lists "Ember Glow `#E85D04`" as the fire accent. This change
reframes the *copy* accent to forge-red while keeping ember as the literal background fire. If
you want this locked as the new rule, `CLAUDE.md`'s palette section should be updated to match —
say the word and I'll align it.
</content>
