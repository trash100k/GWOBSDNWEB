---
name: new-build
description: >-
  Start a brand-new site build end-to-end the GAELWORX way — for GAELWORX itself
  or a client. Use when kicking off a new website/redesign from zero: it runs the
  intake question battery, scaffolds the five planning docs (DESIGN-BRIEF · TODO ·
  RESEARCH · PRICING + a graphics/ research dir), points the build at the reusable
  forge-world 3D engine + Cloudflare protection connector instead of rebuilding,
  applies the commercial system (anchored pricing, placement, honest dark levers),
  and ships behind the best-practices checklist. Encodes the whole forge-world
  engagement so the next build is a fast repeatable process, not a from-scratch
  derivation. Streamline, don't reinvent.
---

# new-build — one site, forged the GAELWORX way

This is the repeatable system distilled from the GAELWORX forge-world build. The full design
record lives in `docs/forge-world/` (`DESIGN-BRIEF.md`, `RESEARCH.md`, `PRICING.md`, `TODO.md`);
the binding brand law is `CLAUDE.md`. **Lock decisions before building — guessing is rework.**

## The one ruling principle
**Environment = stage · message = star · delivery = the trick.** The 3D world is epic but it's
the backdrop; the copy stays short and brass-tacks; the mind-bending part is *how the text exists
in / reacts with* the world. **If a visual makes the message harder to read, it loses.** The
quality bar is **gaming + cinematic** (Active Theory · Lusion · Resn · Unseen Studio caliber),
avatar-and-above — *not* "web design." "Looks good for a website" is a failing grade.

## Step 0 — Run the intake (don't skip, don't guess)
Work through **`intake-questions.md`** (bundled next to this file) with the owner/client. Run them as
**`AskUserQuestion` Socratic rounds** — 1–4 questions at a time, lead each option with a recommend,
lock the answer, move on. Categories: build type · who it's for · goals/conversion · brand/voice ·
3D world & quality bar · content · pricing/commercial · technical/infra · process. Capture every
locked answer straight into the scaffold docs below.

## Step 1 — Scaffold the five planning docs (per project)
Create these up front; they cross-reference and stay live through the build:
1. **`DESIGN-BRIEF.md`** — concept, ruling principle, narrative arc, world/material spec, per-page
   "chambers", typography & interaction, the commercial design (pricing *placement* + sales
   journey + levers), brand system, tech constraints, open questions.
2. **`PRICING.md`** — the authoritative pricing model + cost economics + the reusable-infra/connector
   notes. (Pricing *numbers* live here; pricing *placement on the site* lives in the brief.)
3. **`RESEARCH.md`** — conceptual + commercial + graphics research index; codebase grounding map.
4. **`graphics/` dir** — the avatar-level graphics research (see Step 3).
5. **`TODO.md`** — the phased build tracker + cadence + decisions still owed.

## Step 2 — Lock the commercial system (see `docs/forge-world/PRICING.md`)
- **Price on VALUE, not cost.** The buyer pays for the output's caliber, not your hours. Speed
  (Claude Code, a week per 3D site) is *your margin and moat* — never a discount you owe the client.
  Price is itself a quality signal; underpricing disqualifies you from serious buyers.
- **Anchor against the real alternative** (in-house hire / cost of the problem), never cheaper agencies.
- **Round numbers for flagship; charm endpoints for the volume hook.** Deposit scales as a filter.
- **Recurring > one-off** — attach a monthly care plan to everything (the annuity beats the build margin).
- **Placement rules (from the brief):** *never* show price on the hero / About / Work; *tease* on
  home (anchor the problem cost + vague "we charge less"); *full reveal* only on `/pricing` (tabbed,
  flagship-first, decoy middle, one "★ Recommended" tab) + the service pages (late, after value).

## Step 3 — Graphics research → the reusable engine (don't hand-build per client)
For an avatar-level build, run the **graphics research workflow** pattern: a **broad sweep**
(~33 topics: molten/material/cooling/blackbody-temperature, fluid/flow, 3D text & per-letter fill,
particles/heat-haze/volumetrics, bloom/post-FX/OLED grade, IBL/caustics, Celtic/Ogham/engraving,
camera/scroll/perf, WebGPU+TSL, references, per-page worlds) → a **synthesis** (cohesion map +
deep-dive plan) → **deep dives**. **2025–2026 sources only.** Output to `graphics/`.
- **The reusable forge-world 3D engine is the moat AND the margin.** Bespoke avatar 3D from scratch
  is 100+ hrs → impossible as a loss leader. Configured from the engine it's ~8–12 hrs → cinematic
  3D ships profitably even at the cheap hook. Build once; **configure per client, don't rebuild.**
- **Cohesion law:** one **master temperature uniform** drives emissive color + intensity + cooling
  everywhere via a blackbody curve; one noise basis; one palette + OLED tone-map; **one renderer**
  hosting all routes as configs. Nothing bolted-on. No runtime EXR. Mobile-first perf budget.

## Step 4 — The reusable infrastructure ("the connector")
- **Cloudflare = the protection connector.** One account → each client domain = a zone → apply a
  saved security template (SSL **Full Strict**, WAF, Bot Fight, rate-limit, page rules). Free tier
  covers SSL+CDN+DDoS at **$0/client**; SSL is sold as value, costs nothing. Hosting on **CF Pages**
  (free, unlimited static sites). Stamp across many clients; marginal cost ~$3–30/mo per site.
- **A templated boilerplate** (the engine + the brand system) stands a new client site up in minutes.

## Step 5 — Build cadence
`foundations → home → copy → pricing → chambers → perf/QA → ship.` **Copy can run parallel to 3D**
(no dependency) — an early win. Foundations = the shared temperature/material/noise/palette/post-FX
systems + master uniforms bus; everything else configures them. Commit + verify at each phase end.

## Step 6 — Best-practices checklist (ship gate)
- **Brand** — run `brand-check`. A+E ignite only in all-caps display (`<Ignite>`/`<ForgeText ignite>`);
  body prose uses `<BrandText>` (no ignite). Cinzel display 700/900, grotesk for legibility,
  Industrial-Metallurgy palette, 0px corners, Clan voice.
- **Routes** — new pages via `add-route` (ROUTES table is the single source: router + Nav + prerender
  + sitemap + SEO head all fan out from it).
- **3D** — `forge-scene` / `shader-fx` / `post-fx` for scenes; single renderer, dispose on unmount,
  decoupled Suspense, no EXR.
- **Perf** — `iPhone-15 OLED` target, 60fps/INP, AdaptiveDpr, quality tiers (high/low/static),
  reduced-motion path for every chamber.
- **SEO/AEO** — `aeo-geo`: per-route prerendered head + FAQPage schema + entity NAP + llms.txt +
  sitemap; verify in `dist/`.
- **Ship** — `ship` + `deploy-doctor`; push to `main` only when green; verify on a real device.

---

## KNACKS INDEX — every trick we use (quick reference)
**Process**
- Lock the creative vision through structured `AskUserQuestion` rounds *before* any build.
- Five-doc scaffold (brief · pricing · research · graphics · todo) kept live and cross-referenced.
- Graphics research as a background **Workflow**: broad sweep → synthesis → deep dives, 2025–2026 only.
- Honest **scarcity** only if real (e.g. "we take 2 builds a quarter").

**Creative / 3D**
- Ruling principle: environment=stage, message=star, delivery=the trick; awe serves legibility.
- Quality bar = gaming/cinematic (Active Theory/Lusion/Resn/Unseen), avatar-and-above.
- **Reusable 3D engine = moat + margin** (config per client, never rebuild).
- One master **temperature** system + shared noise/palette/tone-map + **single renderer** = cohesion.
- Per-page **"chambers"** — each route a distinct world sharing one engine.
- Make the **brand law physical** (GAELWORX: the A+E are the metal that never cools).
- Mobile-first: scroll primary, touch-drag parallax, no hover dependency; no-EXR; perf budget; reduced-motion.

**Brand**
- A+E ignite (first A + first E per word of brand terms); ignite only in all-caps display.
- Cinzel display 700/900 · Bricolage headlines · Hanken body · JetBrains mono; Industrial-Metallurgy
  palette; Neo-Gaelic Brutalism (0px corners, hard borders, Iron Grid, 8px shadow, Brutalist Snap).

**Copy / persuasion (honest levers only)**
- Sales-journey sequence: **Pain/COI → Enemy → Identity → Proof → De-risk → Future-state → CTA.**
- Levers: loss-aversion/COI, Enemy=the-old-way (never a named competitor), Unity (the clan),
  anchoring, status/identity, future-pacing, risk-reversal (deposit-as-filter, "we carry the risk"),
  specificity-as-proof, curiosity-gap, Von Restorff (the one Recommended tag), authority (first-hand).
- Reframe AI-hype → execution ("doesn't need artificial intelligence — needs Automatic Execution").
- "Not your average agency" (we *use* Claude/Gemini/enterprise rails — credibility, named).

**Commercial**
- Value-based pricing; price = quality signal; round flagship / charm hook; scaling deposit.
- Placement: never hero/About/Work · tease on home · full reveal on tabbed flagship-first `/pricing`.
- **Recurring "Forge Care" annuity** ($49–99/mo web, $500–1,500/mo automations) — 70–95% margin.
- **Cloudflare protection connector** + CF Pages boilerplate = ~$0 marginal infra, stamped per client.
- Loss-leader web hook feeds the funnel → upsell into Voice (profit center) + Software (flagship).

> Full detail for any line above: `docs/forge-world/` (brief/pricing/research/todo) and `CLAUDE.md`.
