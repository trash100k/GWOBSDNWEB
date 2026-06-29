---
name: aeo-geo
description: >-
  Make every GAELWORX route extractable and citable by AI answer engines (ChatGPT,
  Perplexity, Claude, Google AI Overviews). Use when adding/editing page copy, wiring
  a new route, writing FAQ answers, touching the prerender's JSON-LD/robots/sitemap,
  or whenever someone asks "will AI search cite us / is our schema complete / are the
  answers in the no-JS HTML." Encodes the FAQPage + entity (NAP) + per-page-schema +
  llms.txt checklist and the dist/ verify step — and flags what's still MISSING.
---

# aeo-geo — get cited by the answer engines, and prove it

We sell web design, so our own AEO/GEO must be exemplary. The whole content layer lives in
`scripts/prerender.mjs` (pure Node, runs in Vercel's build) — it prefills `#root` with real copy
and emits the JSON-LD `@graph`, `robots.txt`, `sitemap.xml`. **AI crawlers may not run JS**, so the
literal answer + schema must be in the prerendered `dist/<route>/index.html`, not hydrated in.

## The core law
**If a buyer's answer isn't in the no-JS HTML as plain text, no answer engine can quote it.**
The React/3D experience is enhancement; the citable substance is the prerendered `.seo` block
(`prerender.mjs:160-167`) + the `<script type="application/ld+json">` (`prerender.mjs:78`).

## What ships today (grounded — don't re-derive)
- `@graph` per route (`ldjson`, `prerender.mjs:47-79`): **Organization** (`ORG`, `:34-43`) +
  **WebSite** everywhere; **Service+Offer** on `/software /voice /automations /web`; **OfferCatalog**
  on `/pricing`. Titles/descriptions come from `src/routes.js`; answer copy from `src/brand.js` (`COPY`).
- `robots.txt` (`:178-183`) is open and **explicitly welcomes** GPTBot, OAI-SearchBot, PerplexityBot,
  ClaudeBot, Claude-Web, Google-Extended, CCBot, Applebot-Extended. `sitemap.xml` (`:186-191`).
  Base = `SITE` (`prerender.mjs:30`) — bump it when the real domain attaches.

## GAPS to close (current state — flag these, fix when scoped)
- **No FAQPage anywhere.** `ldjson` never emits `@type:"FAQPage"` (BUILD_PLAN 3.3 unchecked). This is
  the single highest-leverage AEO miss — Q/A is what engines lift verbatim.
- **No `llms.txt`.** Prerender writes only robots + sitemap (BUILD_PLAN 3.4). Add a `dist/llms.txt`:
  one plaintext map of the brand, the four branches, prices, and route URLs for LLM ingestion.
- **No NAP on the entity.** `ORG` has no `address`/`telephone`/`email`/`sameAs`; `/contact` has no
  real coordinates. Entity clarity + a consistent NAP is GEO 3.4.

## Add an extractable answer (the AEO move)
1. Write the Q and a **≤320-char self-contained answer** — lead with the literal fact (price, yes/no,
   the number), brand voice second. Mirror real buyer questions ("How much is a website?", "Does
   Maeve sound human?", "How fast?"). Source the facts from `COPY` in `src/brand.js` so they never drift.
2. Render that answer as **plain text in the `.seo` body** (`body()`, `prerender.mjs:115-156`) — the
   crawler must read it without JS.
3. Emit a matching **FAQPage** into the route's `@graph`: `{ '@type':'FAQPage', mainEntity:[{ '@type':
   'Question', name:Q, acceptedAnswer:{ '@type':'Answer', text:A }}] }`. The schema text must **equal**
   the visible answer (engines penalize mismatch). Add it in `ldjson` beside the Service/OfferCatalog push.

## Per-page schema (what each route must carry)
- **every route:** Organization + WebSite (already global).
- **`/software /voice /automations /web`:** + Service + Offer (have it) + **FAQPage** (add) with 2–4 Q/A.
- **`/pricing`:** OfferCatalog (have it) + **FAQPage** covering deposit/terms (PAGE_SPEC.md:61 calls for it).
- **`/about`:** richer Organization — founding/area/NAP/`sameAs`.  **`/contact`:** NAP + (later) ContactPoint.
- **`/work`:** Service proof; later `CreativeWork`/`ItemList` per case study.

## Per-page checklist
- [ ] Unique `title` + `desc` in `src/routes.js` (canonical/OG already derive from them, `prerender.mjs:81-98`).
- [ ] The buyer answer is **plain text in the prerendered `.seo` block** (no-JS readable).
- [ ] Route carries every schema type for its kind (above); FAQ Q/A text == visible answer text.
- [ ] NAP identical wherever it appears (name **GAELWORX**, one phone, one email, area "Continental US").
- [ ] Internal links in/out present (`nav()`/`footer()`/body links — internal-linking aids extraction).
- [ ] Brand terms keep their A+E ignite in the LIVE UI (run `brand-check`); the `.seo` block is plain.

## Verify it's actually present (don't trust "it built")
```bash
npm run build                                            # runs vite + prerender
node -e "const h=require('fs').readFileSync('dist/pricing/index.html','utf8'); \
  console.log('FAQPage:', h.includes('FAQPage'), '| answer in HTML:', h.includes('YOUR ANSWER SNIPPET'))"
# inspect the graph for any route:
node -e "const h=require('fs').readFileSync('dist/index.html','utf8'); \
  console.log(JSON.parse(h.match(/<script type=\"application\/ld\+json\">(.*?)<\/script>/)[1])['@graph'].map(n=>n['@type']))"
# crawler access + machine map:
node -e "console.log(require('fs').readFileSync('dist/robots.txt','utf8'))"   # AI agents Allow: /
ls dist/llms.txt                                         # should exist once 3.4 lands
```
Validate the JSON-LD shape externally (schema.org / Rich Results) before shipping. Then **`qa-route`**
proves the live route still renders clean at both viewports.

## Cross-refs
`add-route` (wires `routes.js` + prerender for a new path — do AEO at the same time) · `qa-route`
(build + 0-error + DOM/no-JS verification) · `brand-check` (ignite/voice on the visible copy) ·
`docs/BUILD_PLAN.md` 3.3/3.4 + `docs/PAGE_SPEC.md:61`. Schema lives in `prerender.mjs`; facts live in
`src/brand.js`. Never hardcode a price/answer twice — derive from `COPY`.
