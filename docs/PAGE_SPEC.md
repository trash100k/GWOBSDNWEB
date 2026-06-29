# GAELWORX — PAGE SPEC (binding brief for page specialists)

You are a **page specialist** in a parallel sprint. You own **ONE page**. Make it
world-class — content, hierarchy, placement, motion — within the shared system.

## SOURCES OF TRUTH (read first)
- `CLAUDE.md` — brand law (Cinzel display; A+E ignite; Industrial Metallurgy palette;
  **0px corners**; Brutalist Snap motion; Clan Voice).
- `docs/research/2026-pricing-journey-and-design.md` — strategy + locked pricing.
- `src/brand.js` — copy/data. `src/ui/PageShell.jsx` + `src/ui/Section.jsx` — the
  shared placement primitives you MUST build on.

## HARD RULES (do not break — this is how parallel agents avoid collisions)
1. **Edit ONLY your assigned page file** (`src/pages/<YourPage>.jsx`). You may add a
   **namespaced `<style>` block inside that file** (every selector prefixed
   `.pg-<page>-…`) for bespoke styling. Nothing else.
2. **DO NOT touch any shared file**: `App.jsx`, `routes.js`, `styles.js`,
   `ForgeExperience.jsx`, `store.js`, `scene/*`, `brand.js`, `PageShell.jsx`,
   `Section.jsx`, `prerender.mjs`, other pages. If you genuinely need a shared
   change, **state it in your final message** for the orchestrator — do not make it.
3. **DO NOT run `npm run build`, `vite`, `vite preview`, or any dev server** (parallel
   builds clobber each other). The orchestrator runs the integrated build + the
   dual-viewport screenshot QA and fixes seams.
4. **Build on `PageShell` + `Section`** for all base layout/rhythm/measure. Bespoke
   "wonderland" elements (Celtic-knot SVGs, kinetic CSS, layered brutalist panels,
   scroll-reveal, the A+E ignite via `<Ignite>`/`<BrandText>`) go INSIDE sections.
   **No new WebGL/`<Canvas>`** — the per-route obsidian scene already plays behind
   every page (it's distinct per route); your job is content + DOM/CSS/SVG craft.
5. **Brand voice**: aggressive, clean, battle-tested, zero fluff. Real, specific,
   conversion-focused copy. Ignite brand nouns only (GAELWORX, Maeve, YardWorx,
   RepairWorx, SalesWorx, AgentWorx, Automatic Execution) — never arbitrary words.
6. **Placement is the priority** (the site's current sin is bad spacing/placement).
   Generous rhythm, clear hierarchy, aligned, never cramped. Use `.pg-measure`,
   `.pg-grid`, `.pg-panel`. Mobile-first: it must read beautifully at 393px AND 1440px.

## DEFINITION OF DONE (your page)
✅ Valid JSX, correct imports. ✅ Built on PageShell/Section. ✅ Rich, on-brand,
conversion-focused content + a working CTA to `/contact`. ✅ Distinct, crafted feel
(bespoke SVG/CSS within the system). ✅ Reads great at 393px and 1440px (reason about
it; the orchestrator screenshot-verifies). ✅ Ends your turn with a 3–5 line summary of
what you built + any shared change you need.

## PAGE OUTLINES (your assignment is in your launch prompt)
- **/software** — Custom software / proprietary platforms. Problem (outgrown SaaS,
  spreadsheets, rented tools) → what we build → how (discovery → build → open-source
  handover) → what you get (ownership, docs, your data) → proof (YardWorx) → price
  ($10,000, $5k deposit) → CTA.
- **/voice** — Maeve. Cost of missed calls → how she works (answers/qualifies/books/
  follows up) → sounds human → integrations → ROI vs a $48k/yr receptionist → price
  ($499/mo + one-time setup) → CTA.
- **/automations** — The busywork tax → what we automate (quote/follow-up/invoice/
  reviews) → your data unified, owned → how it works → price ($1,500–$5,000) → CTA.
- **/web** — FLAGSHIP (highest bar). The page is the pitch → why most contractor sites
  fail → what you get (cinematic 3D, built-to-convert, found by search+AI, speed) →
  the GAELWORX standard → price ($1,299–$8,999) → CTA.
- **/work** — Proof. We build what we know → the forge's own platforms (YardWorx,
  RepairWorx, SalesWorx, AgentWorx) as proof cards → how we work (discovery, de-risk,
  weeks-not-decks). Structure it so real case studies + results drop in later.
- **/pricing** — The forge runs lean → the ledger (4 lines, anchored, ember prices) →
  efficiency-not-discount reconciliation → what's included / deposit terms → a short
  FAQ (for AEO) → CTA.
- **/about** — One forge, four branches → the clan ethos → we build what we know → the
  AI philosophy (curiosity not reliance; grounded teaching) → the 5 trust pillars → CTA.
- **/contact** — Conversion endpoint. Build a strong **lead-capture form UI** (name,
  business, the bottleneck, email/phone) with on-brand sharp-cornered inputs + a
  validated submit that shows a "we'll be in touch" success state (the real backend
  wiring is Phase 2 — note it). Availability line. Make it feel premium + effortless.
