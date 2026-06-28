# GAELWORX — Design Source of Truth

**Read this before touching any UI.** This is the binding brand/design logic for GAELWORX.
Ethos: **Neo-Gaelic Brutalist** — unapologetic, raw, meticulously engineered. Tagline:
_"Automatic Execution. Clan Protected."_

---

## Typography (non-negotiable)

**Cinzel Decorative is the ONLY display/brand serif.**
- Weights **700 and 900 only** — never below 700. 900 ("black") is allowed and encouraged.
- Used for: the **GAELWORX** wordmark, **"Automatic Execution"**, and brand headings. "Play with the letters."
- Self-hosted via `@fontsource/cinzel-decorative` (700, 900). Token: `--gw-display`.

**A+E IGNITED — mandatory.** Every `A` and every `E` in a brand proper-noun renders in
**900 Cinzel Decorative with the forge-glow gradient** (the continuous fire of the forge).
The ignited terms — wherever they appear, including inside body copy:
**GAELWORX · Automatic Execution · Maeve · YardWorx · RepairWorx · SalesWorx · AgentWorx.**
Implemented as `.forge-letter` (see `src/styles.js`), applied via `<Ignite>` (`src/ui/Ignite.jsx`),
`ForgeText ignite` (`src/ui/ForgeText.jsx`), and auto-detected in prose by `<BrandText>`
(`src/ui/BrandText.jsx`, term list `TERMS`). The forge gradient:
`linear-gradient(to bottom, #E85D04, #C1292E, #E34A27, #C0392B)`, animated (`lavaFlow`), with an
ember text-shadow glow. Never ship a brand term without its ignited A/E. To add a new brand term,
append it to `TERMS` in `BrandText.jsx`.

**Everything else is grotesk, for legibility:**
- **Bricolage Grotesque** (`--gw-headline`, `@fontsource-variable/bricolage-grotesque`) — headlines /
  section headings, weight 700–800, tight tracking.
- **Hanken Grotesk** (`--gw-sans`, `@fontsource/hanken-grotesk` 400/600/700) — body, subheads, labels.
- **JetBrains Mono** — technical/mono labels (500), uppercase, 0.05em tracking. (optional)

---

## Palette — Industrial Metallurgy

| Name | Hex | Token | Use |
|---|---|---|---|
| Celtic Blood | `#C1292E` | `--gw-forge` | primary red, borders, emphasis |
| Ember Glow | `#E85D04` | `--gw-ember` | the fire / active-system accent |
| Forged Iron | `#0B0C10` | `--gw-void` | primary black background |
| Cold Steel | `#1F2833` | `--gw-iron` | secondary surface |
| Fog White | `#F1F2F6` | `--gw-bone` | text |
| Ash | `#8D99AE` | `--gw-steel` | muted text / subtle borders |

Iconography: single-weight **1.5px** stroke, monolinear, strictly monochrome unless representing
an active system (then Ember Glow).

---

## Neo-Gaelic Brutalism (layout)

- **0px border-radius. SHARP corners everywhere. Never rounded.**
- 1–2px **solid** borders (Celtic Blood for emphasis, Ash for subtle).
- **Iron Grid:** strict 12-column, **0px gaps** between structural containers, absolute alignment.
- **Interface depth (3 levels):** L1 Frame = 1px Ash border · L2 Forge-Light = inner glow `#E34A27`
  at 10% · L3 Brutalist Snap = **8px hard `#000` drop shadow**.
- Textures: Forged Iron (fine-grain matte black), Cold Steel (brushed micro-scratches), Molten Edge
  (pulsing 1px border cycling `#C1292E`↔`#E85D04` to indicate active focus).

## Motion Laws

- **Brutalist Snap** — 0ms delay, high-momentum easing, **no bounce, only impact.**
- **Atmospheric Drift** — embers/mist at slow constant velocity; parallax depth for scale.
- **Forge Reveal** — content wipes in **blur-to-sharp** with an ember-glow trail.

## Voice — The Clan Voice

Aggressive (direct commands, **no passive voice**), Clean (zero fluff, technical precision),
Battle-tested. CTAs follow **"Point the Sword"** logic: high-contrast, sharp corners, immediate feedback.

---

## This project

Vite + React + react-three-fiber. A full-screen **obsidian** slab (black volcanic glass) with
**fire-opal veins** (warm body + iridescent play-of-color). Primary judge target: **iPhone 15 (OLED)** —
true blacks + vivid color read; subtle glass reflections do not.

- Design tokens + all CSS: `src/styles.js` (`--gw-*`). Fonts: `src/main.jsx`. Copy: `src/brand.js`.
- Scene: `src/scene/*` (ObsidianSlab, Effects, CameraRig, Embers; palette in `palette.js`).
- Live tuning: append `?debug` to the URL for a leva panel.
- Commands: `npm run dev`, `npm run build`. Deploys to Vercel on push to `main`.

**Outstanding brand alignment (TODO):** the current UI is still soft/rounded/cinematic; it should be
migrated to true Neo-Gaelic Brutalism (0px corners, hard borders, Iron Grid, Brutalist Snap motion)
and the 3D fire palette tied to Celtic Blood + Ember Glow.
