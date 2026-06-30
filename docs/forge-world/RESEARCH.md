# GAELWORX — Forge World Redesign · RESEARCH

> Living research index for the avatar-level forge-world redesign. Pulls together (a) the
> conceptual research from the design conversation, (b) the existing commercial/pricing/persuasion
> research already in the repo, and (c) the new **graphics research** (in flight).
> Companions: `DESIGN-BRIEF.md` (the decisions), `TODO.md` (the build plan).

---

## A. CONCEPTUAL RESEARCH (from the design conversation) — key aspects

### A1. The core metaphor
The website is reimagined as a **world**: a giant, ancient, ominous **Gaelic dwarf-forge**. The
brand story is told by **molten metal being poured into something solid** — the word **GAELWORX**.
The mandatory brand rule (only the first **A** and first **E** of each brand term ignite) is
**made physical**: in this world the A and E are the metal that **never cools**. This turns a
typographic rule into a narrative law — the strongest possible justification for it.

### A2. The chosen register — "Middle-Earth meets true Gaelic"
Not industrial/sci-fi. **Huge, ominous, sacred** — a dwarf-forge with authentic **Gaelic** styling:
Celtic interlace as *structural* architecture **and** carved knotwork + **Ogham** as surface marks.
Stone is **green-black Irish basalt** (Connemara-marble depth). Emotional register: **ominous and
sacred** — the forge was here before GAELWORX; GAELWORX is simply the word it chose to make next.

### A3. The ruling tension (resolved)
**Environment = stage, message = star, delivery = the trick.** The world is epic but is *backdrop*;
the copy stays short and brass-tacks; the **mind-bending** element is *how text exists in / reacts
with* the 3D (forged from the pour, spatial depth, environment responding to brand words). Concise
content, unprecedented delivery. Awe always serves legibility.

### A4. Locked narrative + world decisions (full detail in DESIGN-BRIEF §2–§5)
- Arc: **finale = earned payoff**; the **entire scroll is one continuous pour**, camera **travels**
  (no cuts); story copy floats as "stone tablets" beside the path.
- Letter depth: **camera decides** — overhead/flat-engraved read → eye-level reveal as A+E ignite.
- Pour source: a **stone forge-altar** (sacred, not a machine).
- Atmosphere: **heat shimmer + living sparks** that orbit the pour front.
- Per-page = **different chambers** of one complex; **Voice (scrying pool) is the flagship**.
- Interaction: **mobile-first** — scroll primary, **touch-drag = spatial parallax**, no hover dep.

### A5. Per-chamber concepts (summary; full table in DESIGN-BRIEF §4)
Pour Journey (Home) · Scrying Pool (Voice ★) · Casting Room (Software) · Channel Hall (Automations)
· Jewel Chamber (Web) · Altar Approach (About) · Stone Ledger (Pricing) · Four Plinths (Work) ·
Forge Mouth (Contact). The *…Worx* casts on the Work plinths each represent **real software we've
built** (YardWorx, RepairWorx, SalesWorx, AgentWorx).

---

## B. COMMERCIAL / PERSUASION RESEARCH (existing repo docs — distilled)

### B1. The buying journey (`docs/research/2026-pricing-journey-and-design.md`)
- High-consideration B2B is **long (~6 mo), multi-touch (~60+ touchpoints), ~80% rep-free.** The
  **website IS most of the sales process.** Buyers consume ~13 content pieces before contact.
- **Price is psychological:** premium buyers pay on **identity/status/peace-of-mind**, not features;
  **price is a quality signal**; **round numbers** signal premium, **charm prices** signal "deal."
- **Transparency stance — LOCKED:** *anchored transparency* (publish anchors/ranges + a productized
  entry rung + estimator→quote; keep the bespoke final number a conversation). Transparency
  **pre-qualifies** → fewer but more qualified leads.
- **Home price placement — LOCKED (then evolved here):** original = "tease early, full reveal late."
  **This redesign goes further: REMOVE the home rates beat entirely** — the number now lives only
  on `/pricing` and the service pages. Home anchors the *problem cost* + vague tease only.
- **Anchor card — REVISED 2026-06-30 (supersedes the 2026-06-29 lock); authoritative in
  `docs/forge-world/PRICING.md`:** Software **$15k–$50k** (25% deposit; flagship, repriced UP from
  $10–35k — was ~3× too low / signaled "freelancer") · Voice **outbound sales agents, hybrid**
  ($2,500 setup + $699/mo/agent incl. minute bucket + $0.30/min overage + $50/booked appt; the
  profit center) · Automations **$2,500–$7,500 + $500–1,500/mo Forge Care** · Web **$1,499 hook /
  $4,999 / $9,999+ + $49–99/mo Forge Care** (loss-leader front door whose real margin is the
  recurring care plan + the upsell into Voice & Software).
- **Competitor anchors to cite:** software agencies $75k–$200k & in-house dev $180k+/yr; outbound
  SDR $50–70k/yr+commission (and inbound receptionist $48k/yr); premium web studios $50k+. We sit
  deliberately below — "the forge runs lean."
- **Web cost economics (see PRICING.md §5):** marginal cost ~$3–30/mo per client via a reusable
  **Cloudflare "protection connector"** (SSL Full Strict + WAF + bot + rate-limit templated per
  zone; CF Pages hosting at $0). SSL is $0 — sold as value, not a cost. 2D/art-direction time costed
  at $100–150/hr; the templated boilerplate is what keeps the fixed-price hourly profitable.

### B2. High-ticket psychology (`docs/research/copy/05-high-ticket.md`)
- High-ticket is a **risk problem wearing a price tag.** Losses loom **~2× larger** than gains →
  **de-risk before you up-sell.** The buyer's nightmare is *six months + their name on the failure*,
  not the dollars → answer with **fixed scope + fixed price + "we don't bill the balance until it
  executes"** (transfers *project* risk, not just dollar risk).
- **Round numbers** for the flagship; **anchor against the real alternative** (in-house cost /
  cost-of-inaction), not against cheaper agencies.
- **The $5k deposit is a commitment device, not a paywall** (~91% close on deposited deals in one
  funnel) — "100% of the signal, not 20% of the money." Pairs with honest qualification/scarcity.
- **Future-pace the after-self** ("picture Monday — the queue triaged itself overnight…"), then back
  it with a same-shaped story. Sell **who they become**, not the codebase.

### B3. Dark/persuasion levers (`docs/research/copy/04-dark-levers.md`)
- Cialdini ×7 (esp. **Unity** — the Clan — the strongest), valuation biases (**loss aversion,
  anchoring, framing**), choice architecture (**decoy/compromise, Von Restorff**), attention
  (**Zeigarnik/curiosity-gap**, IKEA), and the 4 amplifiers (**shared Enemy, future pacing,
  status/identity, specificity-as-proof**).
- **Cost-of-Inaction > ROI** here (40–60% of high-ticket deals die to indecision, not competitors).
  The **enemy is the status quo / manual grind**, never a named competitor.
- **The honest line:** every lever must be **true** — at a $1,299–$35k considered purchase the buyer
  is in System-2 during diligence; one caught fake torches the funnel. Durable levers compound
  trust; deceptive ones borrow against it.

### B4. How this maps to the home journey (LOCKED — see DESIGN-BRIEF §6.4)
Sequence **Pain/COI → Enemy → Identity → Proof → De-risk → Future-state → CTA** with the
hero reframe (*"…doesn't need artificial intelligence. It needs Automatic Execution."*), the
"not your average agency" framing (we run Claude/Gemini/enterprise AI), the **enterprise-ground**
trust rung (permanent), and the **"Point the sword. We take care of the rest."** identity close +
honest scarcity — **2 builds per quarter** ("We take 2 builds a quarter. That's not a line — it's
how we hold the standard.").

### B5. Other existing research docs worth mining during build
`copy/01-modern-web-copy.md` · `copy/02-copy-frameworks.md` · `copy/03-brand-archetypes.md` ·
`copy/06-copy-and-design.md` · `copy-architecture-and-dark-persuasion.md` ·
`copy-deep-dive-advanced.md` · `lead-capture-and-nurture.md` (the ~6-mo nurture window) ·
plus per-page copy drafts in `copy/drafts/*`.

---

## C. GRAPHICS RESEARCH (new — IN FLIGHT)

> Workflow `wf_ed6b6f20-e63`. **Strictly 2025–2026 sources.** Output lands under
> `docs/research/graphics/`. Goal: plan **every texture/effect at avatar level, cohesively, right
> the first time** — a world, not a pile of effects. Target **100–200 pages → 500+**.

### C1. Phase 1 — broad sweep (33 specialist docs, `graphics/phase1/`) [◐ running]
Grouped by domain:
- **Materials/shading:** molten-metal surface · blackbody temperature→color (master system) ·
  cooling/solidification · emissive+HDR glow · basalt PBR · forged-iron PBR · obsidian/glass.
- **Fluid/sim:** real-time fluid vs faked · flow-map/advection (the pour) · procedural-noise toolkit.
- **Text in 3D:** Cinzel extruded geometry · SDF/MSDF · per-letter progressive fill · liquid-fill.
- **Particles/atmos:** GPU sparks/embers · heat-haze refraction · volumetric smoke · god-rays.
- **Lighting/render:** emissive light-bleed (AE radiance) · bloom/post-FX stack · OLED color-grade ·
  procedural IBL (no-EXR) · caustics/refraction.
- **Celtic/stylistic:** interlace channel geometry · Ogham carved-stone · engraving/parallax-occ.
- **Camera/motion/perf:** scroll camera paths · cinematic DOF · mobile perf budget.
- **Architecture/modern:** WebGPU+TSL (2025-26) · single-renderer multi-chamber · Awwwards 2025-26
  reference scan · per-page chamber worlds (water/gem/plinths/arch).

### C2. Phase 1 — synthesis [◐ pending sweep]
- `graphics/00-COHESION-MAP.md` — the master world architecture: shared temperature system, shared
  noise basis, shared palette/tone-map, single-renderer scene graph + master uniforms, lighting
  model, post-FX order, cross-element cohesion rules, build sequence, perf envelope.
- `graphics/00-INDEX.md` — annotated index + reading order.
- **Deep-dive plan** — 50–80 narrowed Phase-2 topics + gap list.

### C3. Phase 2 — deep dives [☐ next]
Fan out the narrowed topics into implementation-grade docs (actual shader strategy, library/version
picks, the exact build approach) → pushes total to **500+ pages**. Ends in a final cohesion master
plan that the build (TODO P1–P7) executes against.

### C3.5 The quality bar — gaming & cinematic, not "web"
Benchmark everything against **real-time graphics studios + game/cinematic intros** — Active Theory,
Lusion, Resn, Unseen Studio caliber WebGL and Unreal-cinematic real-time looks (*avatar-and-above*).
The Phase-1 `reference-awwwards-avatar-web3d` topic + Phase-2 deep dives must teardown work at THIS
tier (not generic "nice website" 3D). Strategic payoff: the reusable **forge-world 3D engine** is a
**business asset/moat** — it lets GAELWORX ship this caliber across client sites by config, which is
what makes cinematic 3D economically viable even at the web loss-leader price (see `PRICING.md`).

### C4. Cohesion principle for ALL graphics research
One **master temperature uniform** drives emissive color + intensity + cooling **everywhere** via
the blackbody curve; one **noise basis**; one **palette + OLED tone-map**; one **renderer** hosting
all chambers as configs. Nothing is a bolted-on effect — every element shares the same systems so
the whole reads as a single, living world. **No-EXR**, strict **iPhone-15 perf budget**, reduced-
motion path for everything.

---

## D. CODEBASE GROUNDING (what we build on)
- **Copy / tokens / nav:** `src/brand.js` · **all CSS tokens:** `src/styles.js` · **fonts:**
  `src/main.jsx` · **routes/SEO/sitemap:** `src/routes.js`.
- **Scene:** `src/scene/` — `ForgeCanvas.jsx` (Canvas), `ObsidianSlab.jsx` (hero material + GLSL),
  `Effects.jsx` (post-FX), `CameraRig.jsx`, `Embers.jsx`, `scenes.js` (per-route presets),
  `palette.js`, `shaders.js`, `FacetedJewel.jsx` + `gem.js`.
- **Shell/UI:** `ForgeExperience.jsx` (persistent canvas/nav/cursor/Lenis), `ui/Content.jsx` (the
  home scroll-jack), `ui/PageShell.jsx`, `ui/Section.jsx`, `ui/Ignite.jsx` / `ForgeText.jsx` /
  `BrandText.jsx` (the A+E ignite system — **reuse, never reinvent**).
- **State:** `src/store.js` (`forge` object: pointer, scroll, quality, lenis, emit, strikeAt) —
  extend this for the master uniforms bus.
- **Project skills to consult during build:** `fx-resources`, `forge-scene`, `shader-fx`,
  `post-fx`, `motion-feel`, `kinetic-type`, `qa-route`, `deploy-doctor`, `brand-check`, `ship`.

---

## E. SOURCES POLICY
Graphics sources: **2025–2026 only**, cited with URLs + dates (three.js r17x+, r3f/drei/postprocessing
docs, pmndrs, Maxime Heckel, Three.js Journey, IQ/Shadertoy via 2025-26 write-ups, Codrops/Awwwards
2025-26, SIGGRAPH/GDC 2025, WebGPU/TSL). Commercial sources: as cited in the existing repo research
docs (Gartner, Yarmosh, Kahneman/Tversky, Cialdini, Abraham, etc.).
