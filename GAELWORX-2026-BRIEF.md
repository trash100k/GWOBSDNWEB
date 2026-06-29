# GAELWORX — 2026 Research Brief & Build Handoff
*Written to be cloned into a fresh chat. Read this + `CLAUDE.md` before touching the site.*

---

## 0. Why this exists / the pivot
The obsidian + fire-opal hero is **very close** but two things are wrong:
1. The vein shader leans on **flowing/caustic "water" noise** — it reads as water with no water. The
   call: **stop chasing movement/noise; dial in light + texture/facets** (a real cut stone, not a flow).
2. The look should become an **EMERALD**, leaning into the Gaelic **"it takes many forges to make an
   Emerald Isle"** story (GAEL = Gaelic/Ireland; Emerald Isle = Ireland).

**Locked direction — the arc:** *Forges make the isle.* Keep the **forge-fire as the "making"** early
in the journey; **fog rolls in and clears** as the visitor goes deeper; it **resolves into a polished
emerald jewel** as the destination — green takes over as you descend. Fire = the *making*, emerald =
the *made*.

**Also locked:**
- Kill the orange horizon band **entirely** (better lighting + the green pivot should let us).
- **Embers → fog** that clears as you progress, eventually **surrounded by the jewel**.
- **Workflow:** this brief = deep research → *new chat* builds the intricate, trust-on-sight site.
- **Deferred to the new chat:** real lead capture/tracking, and the pricing-transparency decision
  (after a products/solutions + competitor deep-dive — notes seeded in §7–8 below).

---

## 1. 2026 design-trend research (what to build into the site)
Flat design is over; 2026 is **dimensional, tactile, material**. Key movements:

- **Neo-skeuomorphism / texture revival.** Real-world materials — **stone, metal, glass, gem** — are
  back, used *selectively* (hero, key moments), not everywhere. This is exactly our lane: a believable
  cut emerald as the hero is *on-trend and on-brand*.
  ([Userology](https://www.userology.co/blogs/neo-skeuomorphism-ui-trends-2026-spatial),
  [Figma](https://www.figma.com/resource-library/web-design-trends/),
  [Superdesign](https://www.superdesign.dev/styles/skeuomorphism))
- **"New Neumorphism" / Soft UI.** Not the old low-contrast mush — a **single sheet of material** where
  button and background are one surface, differentiated by gradients that mimic real physics; stronger
  highlights, accessible contrast, tactile on high-refresh displays. Use for **controls** (the nav,
  the CTA, carousel chips) so the *chrome* feels carved from the same stone as the hero.
  ([IxDF](https://ixdf.org/literature/topics/neumorphism),
  [bighuman](https://www.bighuman.com/blog/neumorphism),
  [index.dev](https://www.index.dev/blog/ui-ux-design-trends))
- **Glassy layers + 3D + spatial.** Glass-like depth layers projecting content; immersive scroll-driven
  3D is the premium signal. We already have the scroll-jacked stage — push the *material* quality.
  ([coloura](https://coloura.co.uk/inside-2026-design-hyperpersonalized-ui-replaces-flat-with-texture-and-glassy-motion/))
- **Claymorphism** (soft, puffy, inflated) is adjacent — probably *too soft* for our forged/Gaelic
  brutalism; note but mostly skip.

**Takeaway for GAELWORX:** lean into **neo-skeuomorphic stone/gem texture** for the hero + a **Soft-UI
"carved from the same emerald"** treatment for the interface chrome (still sharp 0px corners per brand —
the depth comes from *light + material*, not rounded blobs).

## 2. Typography 2026 (maps onto our existing system)
- **Expressive, high-contrast, "opinionated" serifs are the mark of confidence** — exactly why
  **Cinzel Decorative** (our display) is right; lean *harder* into it for the mandala/finale.
- **Variable fonts** are now universal — use weight/optical-size axes for responsive display type.
- Type is doing **brand storytelling + dimensional/material treatment** (carved, lit, gem-filled
  letters), not just labels — supports our "type forged from the material" idea (now *emerald-filled*
  letters instead of fire-filled).
  ([Creative Boom 50 fonts](https://www.creativeboom.com/resources/top-50-fonts-in-2026/),
  [Fontfabric](https://www.fontfabric.com/blog/10-design-trends-shaping-the-visual-typographic-landscape-in-2026/),
  [Medium: letters begin to breathe](https://medium.com/design-bootcamp/typography-trends-2026-2027-when-letters-begin-to-breathe-8499fb6c5ef1))

**Keep:** Cinzel Decorative (display, A+E ignite), Hanken Grotesk (body), Bricolage Grotesque (heads).
**Change:** the A+E "ignite" gradient shifts from fire → an **emerald play-of-color** at the
destination (warm fire early, cool emerald late — the arc applies to the type too).

## 3. THE EMERALD — material truth (this is the big correction)
A believable emerald is **NOT** flowing caustic noise. Its identity:
- **Color:** green beryl colored by **chromium/vanadium** — deep, *saturated* bluish-green. Hero greens:
  **Emerald Isle `#006837`**, a brighter **Irish Green `#019529`**, with **gold** accents and cool
  neutrals (**Misty Pearl `#E0E0E0`**, **Peat Grey `#5A5A5A`**).
  ([GIA emerald](https://www.gia.edu/emerald), [Emerald Isle hex](https://kidspattern.com/color/name/emerald-isle-009677/),
  [Irish Green](https://colorlabs.net/colors/irish-green))
- **The cut = step / "emerald cut":** rows of long parallel facets in steps, cropped corners. Its optic
  is **NOT brilliant sparkle** — it's a **slow, architectural "hall of mirrors":** broad flashes of
  reflected light alternating with **deep dark planes (extinction)** that look *into* the stone. This is
  the texture to chase — **planar facets + light/shadow zones**, not animated ripples.
  ([Gem-A](https://gem-a.com/gem-hub/emerald-gemstone-emerald-cut-diamond/),
  [Robinsons](https://robinsonsjewelers.com/blogs/news/why-step-cut-stones-have-a-quiet-kind-of-sparkle-and-why-that-quiet-is-the-loudest-statement-you-can-make))
- **Jardin ("garden"):** real emeralds have an **internal garden** of inclusions (fractures, three-phase
  gas/liquid/crystal). A *flawless* emerald reads as fake. So the inside should hold a faint **living
  green garden** — this is where our procedural detail belongs (subtle, deep, *inside* the stone), not
  as surface water. ([NEC jardin](https://emeralds.com/education/the-role-of-inclusions/),
  [Navratan](https://www.navratan.com/blog/a-study-about-inclusions-in-emeralds))

**Design translation:** trade the rippling vein flow for **(a) crisp step-facets that catch hard,
directional light (extinction/brightness zones), (b) deep saturated green body, (c) a slow internal
jardin of green inclusions, (d) gold/white specular glints.** Quiet, architectural, expensive.

## 4. 3D technique for the web (how to portray it)
- **Material:** drei **`MeshTransmissionMaterial`** (extends `MeshPhysicalMaterial`) is the right base.
  Starting params to tune for emerald:
  - `ior` ≈ **1.57–1.58** (real beryl/emerald IOR; current obsidian uses 1.5).
  - `color`/`attenuationColor` deep emerald; `attenuationDistance` tuned so thicker paths read darker
    green (Beer–Lambert = the saturated core).
  - `chromaticAberration` ≈ **0.02–0.05** (subtle dispersion; emeralds disperse *less* than diamond —
    don't overdo rainbow), `thickness` ~0.2–1.0, `roughness` low (~0–0.08), `anisotropicBlur` low,
    `distortion`/`distortionScale` low (we want *clean* facets, not warped glass), `samples` high for
    quality. ([drei docs](http://drei.docs.pmnd.rs/shaders/mesh-transmission-material),
    [Codrops refraction](https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/))
- **Geometry:** a real **step-cut/emerald-cut solid** (faceted, beveled, cropped corners) — flat planar
  facets are what create the hall-of-mirrors. Not a rounded box. Consider a low-poly faceted gem mesh.
- **Lighting is everything** (the user's #1 note: *"get the light better"*). A good **HDRI** + a couple
  of hard directional keys give the extinction/brightness zones. Studios pre-render normal / AO /
  thickness passes for translucent realism (Lusion's approach) — consider baking a thickness map.
  ([Lusion](https://lusion.co/), [Codrops: Lusion](https://tympanus.net/codrops/2026/04/13/lusion-where-digital-craft-meets-ambitious-experimentation/))
- **Performance/iPhone:** transmission is expensive — keep `samples`/`resolution` adaptive per tier,
  consider a baked thickness map + a single-pass dispersion shader extension instead of multi-sample.
- **Reference studios to study:** **Lusion**, **Active Theory**, **Codrops** gem/refraction tutorials,
  **Awwwards → 3D**. ([Awwwards 3D](https://www.awwwards.com/websites/3d/))

## 5. Atmosphere: fog, not embers
- **Remove the rising embers** as the primary atmosphere. Bring in **fog/mist** that is **thick early
  (mystery) and CLEARS as the visitor scrolls deeper** — literally lifting the veil as trust builds —
  until they're **surrounded by the emerald jewel** at the destination.
- Implement as volumetric-ish layered fog (depth-fading gradient planes / a fog shader / screen-space
  haze) whose density is driven by scroll progress (inverse: density ↓ as progress ↑). Keep the
  *dissolve embers* idea only as a small accent at transitions if at all.

## 6. The journey / choreography (keep & evolve)
We already built a scroll-jacked stage (pinned frames, weighted segments, vertical 3D carousel,
shared forge-light, vein-surge reactions). **Keep that spine.** Re-skin to the emerald arc and add the
**finale act** (designed but not yet shipped). Save the finale copy below — it's good.

**Finale = one scroll act:** problems → **Cinzel mandala whirlpool** → solutions rise → **four forges**
→ spin into **GAELWORX** → CTA. As the arc demands: this is where **fog clears and the emerald forms**.

**Finale copy (ready to reuse):**
- Problems (drain into the whirlpool): *"Missed calls. Lost jobs." · "Buried in busywork." · "Six apps.
  One mess." · "A site that books nothing."*
- Whirlpool seed: *"AI everywhere. Execution nowhere."*
- Solutions (rise out): *"Every call answered." · "The busywork runs itself." · "One system. Total
  command." · "A site that books the truck."*
- Four forges: **YardWorx · RepairWorx · SalesWorx · AgentWorx** → spin into **GAELWORX**.
- Closer + CTA: *"Stop running it all yourself."* + **Start the Forge**.

(Technical note: the half-built finale lived in `Content.jsx` as a `FINALE` frame with phase
sub-progress `fp` driving problem-drain → mandala spin → solution-rise → forge-ring → GAELWORX → CTA.
Rebuild it cleanly against the emerald scene; the phase math + copy are the keepers.)

## 7. Products / solutions (for the pricing-transparency call)
GAELWORX has **no public web footprint yet** (newer/private). What we know from the brand deck:
- **Software / platforms** — custom operational systems + internal tools (the forge that built the
  `-Worx` platforms: **YardWorx, RepairWorx, SalesWorx, AgentWorx**).
- **Voice agents — "Maeve"** — inbound/outbound that qualify, book, recover (front desk that never
  clocks out).
- **Automations** — quote / follow-up / invoice / reviews pipelines.
- **Web** — studio-grade lead-gen sites.
- Positioning: **"a clan, not an agency"** — you talk to the people who build it.

**Competitive landscape (for benchmarking pricing later):** voice-agent space is crowded + mostly
self-serve SaaS — **Vapi, Synthflow, Voiceflow, Retell, Bland, GoHighLevel AI** (usage ≈ $0.05–0.15/min
or monthly tiers). GAELWORX's edge is **custom builds + done-for-you**, which is *premium / project +
retainer*, not per-minute SaaS — so pricing should likely be **"from $X" anchors + custom quote**, not
a public per-seat table. **Decision deferred** until the new chat does the real products/numbers dive.

## 8. Open questions to resolve in the new chat
1. **Infra:** does GAELWORX own `gaelworx.com` + an inbox/CRM/booking tool to route leads into, or
   start clean? (Lead capture stack: form→email vs Supabase DB+dashboard vs Cal.com/Calendly — TBD.)
2. **Pricing reality:** real project ranges / retainer numbers (or benchmark comparable studios) to
   ground the transparency recommendation.
3. **Emerald cut vs raw:** polished **emerald-cut gemstone** (step facets, hall-of-mirrors) vs **raw
   emerald-in-rock** (green veins in dark stone). The brief assumes *cut gemstone* as the destination,
   with raw/dark stone acceptable early in the arc (the "before forging").
4. **How far green goes** in the chrome/palette vs keeping Celtic-Blood red as the receding "forge" accent.

## 9. What's intentionally NOT changed yet
Live site stays on the last stable build (obsidian + fire + coupling/surge/fog-less). The finale and the
emerald rework are **deferred to the new chat** so we start clean with this brief in hand.

---
### Sources
Design trends: Userology, Figma, Superdesign, coloura, IxDF, bighuman, index.dev · Typography: Creative
Boom, Fontfabric, Design Bootcamp · Emerald: GIA, Gem-A, Robinsons Jewelers, Natural Emerald Co.,
Navratan · 3D: drei docs, Codrops, Lusion, Awwwards. (Full URLs linked inline above.)
