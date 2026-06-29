# GAELWORX — BUILD PLAN (autonomous loop state)

> **This file is the loop's memory.** The container is ephemeral and context gets
> compacted, so state lives HERE, in the repo — not in my head. Every iteration:
> read this file, do the top unchecked unit, QA it, commit, check it off. A cold
> restart resumes from the first unchecked box.
>
> **Sources of truth:** `CLAUDE.md` (brand — binding), `docs/research/2026-pricing-journey-and-design.md` (strategy + locked pricing).

## STATE
- **LAST DONE:** 0.4 — per-route SEO head in the prerender: canonical + OG + Twitter + JSON-LD (Organization, WebSite, Service+Offer w/ price, OfferCatalog on /pricing); `robots.txt` welcoming GPTBot/PerplexityBot/ClaudeBot/Google-Extended + Sitemap; `sitemap.xml` (9 urls); branded `public/og.png`; client-side title/description sync on SPA nav. Verified in dist HTML + 0 errors. **Foundation (Phase 0) COMPLETE.**
- **NEXT UP:** Phase 1 · 1.1 (Home — ensure prerendered content + scene; then service pages). Consider a prod deploy of the foundation milestone (owner OK).
- **BRANCH:** `claude/gaelworx-obsidian-hero-rrr9xo`
- **PROD DEPLOYS:** only on explicit owner OK, only at phase milestones.

## ARCHITECTURE (decided 2026-06-29)
- **Routed + prerendered.** Real per-page URLs, each prerendered to static HTML so
  content + prices + JSON-LD ship WITHOUT JS (SEO/AEO/GEO correct at the root).
- **Lazy, content-first 3D.** Every page gets its own distinct 3D scene, but it
  mounts AFTER content paints and stays within the perf budget. Wonderland per
  page, never at the cost of LCP or findability.
- **Single disciplined loop.** Self-paced, foundation-first, QA gate every iteration.

## PER-ITERATION PROTOCOL (non-negotiable)
1. **Pick** the top unchecked unit below.
2. **Build** it (obey CLAUDE.md + perf budget; content-first, 3D lazy).
3. **Compile** — `npm run build` green.
4. **QA** — Playwright screenshot at **393×852 AND 1440×900**, *Read the PNGs*,
   fix until it reads right and console errors == 0.
5. **Commit** to the branch (never leave work uncommitted — container can die).
6. **Update** this file: check the box + one-line note; move STATE pointer.
7. **Stop** (loop re-fires on the next unit). Prod deploy only at a milestone, with OK.

## GUARDRAILS
- **Perf budget / route:** LCP < 2.5s mid-mobile · initial JS < ~200KB gz (3D in a
  lazy chunk loaded post-paint) · one shared WebGL renderer, route-swapped scenes,
  disposed on unmount · `prefers-reduced-motion` honored.
- **Content-first:** every page's copy + JSON-LD live in the prerendered HTML; 3D is
  pure enhancement and must degrade to a static poster on no-WebGL / no-JS.
- **Brand SoT:** 0px corners, Cinzel display, A+E ignite, Industrial Metallurgy
  palette, Brutalist Snap motion — per CLAUDE.md, every iteration.
- **SEO/AEO/GEO on every page:** unique title + description + canonical + OG/Twitter
  + JSON-LD (Organization/Service/Offer/FAQPage as fits) + internal links.
- **Commit cadence:** one commit per unit, pushed to branch. **Prod = owner OK only.**

---

## PHASE 0 — FOUNDATION  *(must finish before any page)*
- [x] **0.1** Add routing (`react-router-dom`) + page shell; carve current home into a `/` route. Keep the obsidian canvas mounted app-shell-level. _(routes.js + Outlet layout + stub pages; home identical, 0 errors @ both viewports)_
- [x] **0.2** Prerender pipeline → static HTML per route. _(Pure-Node `scripts/prerender.mjs` — no browser, Vercel-safe — prefills `#root` with brand/route-data content + prices + internal links. Verified real text + all prices in `dist/<route>/index.html`; live app + 0 errors. Canonical/OG/JSON-LD/sitemap/robots deferred to 0.4.)_
- [x] **0.3** Shared 3D system — one renderer; per-route presets (`scenes.js`) re-temper veins + re-frame camera, damped on nav (`forge.route`); poster fallback via CanvasBoundary. _(Pragmatic single-renderer "wonderland per page" — performant, home identical. Future: bespoke per-route elements as needed.)_
- [x] **0.4** SEO infra: per-route canonical + OG + Twitter + JSON-LD (Organization/WebSite/Service/Offer/OfferCatalog) + `robots.txt` (welcomes AI engines) + `sitemap.xml` + branded `public/og.png` + client head sync. _(All in the prerender; verified in dist.)_
- [ ] **0.5** Perf harness: measure LCP/JS budget in the QA script; fail the gate if over budget.

## PHASE 1 — PAGES  *(each = one or more iterations; meet the DoD)*
- [ ] **1.1** `/` Home — keep the scroll-jack hero journey; ensure prerendered content + JSON-LD beneath it.
- [ ] **1.2** `/software` (GW–01) — its own 3D scene + content + Offer schema ($10k–$35k, $5k deposit).
- [ ] **1.3** `/voice` (GW–02, Maeve) — scene + content + Offer ($499/mo) + the receptionist anchor.
- [ ] **1.4** `/automations` (GW–03) — scene + content + Offer ($1,500–$5,000).
- [ ] **1.5** `/web` (GW–04) — scene + content + Offer ($1,299–$8,999); this page is the flagship proof.
- [ ] **1.6** `/work` — portfolio / case studies (logos, results, screenshots). **Biggest conversion lever.**
- [ ] **1.7** `/pricing` — the rates ladder as a full page + FAQPage schema.
- [ ] **1.8** `/about` — the clan / first-hand-knowledge story + Organization detail.
- [ ] **1.9** `/contact` — real conversion endpoint (form + tel + email + booking).

### PER-PAGE DEFINITION OF DONE
✅ `npm run build` green ✅ QA'd clean @ 393×852 + 1440×900, 0 console errors
✅ own lazy 3D scene within perf budget ✅ real content + A+E ignite + brand voice
✅ unique title/desc/canonical/OG + JSON-LD ✅ internal links in/out ✅ working CTA
✅ committed + box checked here.

## PHASE 2 — CONVERSION
- [ ] **2.1** Lead capture form → store (Supabase/Attio) + confirmation.
- [ ] **2.2** Wire every CTA to a real action (form / booking / tel) — kill the dead `strike()` CTAs.
- [ ] **2.3** The estimator (service → rough range → scoped quote), per the research brief.
- [ ] **2.4** Analytics + conversion events.

## PHASE 3 — OPTIMIZATION
- [ ] **3.1** Core Web Vitals pass (LCP/CLS/INP) across all routes on the perf harness.
- [ ] **3.2** Accessibility pass (contrast on flame headings, focus states, reduced-motion, standard-scroll escape).
- [ ] **3.3** AEO: FAQPage + concise extractable answers on each service page.
- [ ] **3.4** GEO: entity clarity, consistent NAP, schema completeness, llms.txt.
- [ ] **3.5** Per-page OG images + favicon set + web manifest.

## PHASE 4 — SHIP
- [ ] **4.1** Full-site QA sweep (every route, both viewports, crawl the prerendered HTML for content+schema).
- [ ] **4.2** Lighthouse/CWV report in `docs/`.
- [ ] **4.3** Request owner OK → deploy to prod → verify live.

---
_Loop ends when every box above is checked and 4.1 passes._
