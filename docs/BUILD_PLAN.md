# GAELWORX — BUILD PLAN (autonomous loop state)

> **This file is the loop's memory.** The container is ephemeral and context gets
> compacted, so state lives HERE, in the repo — not in my head. Every iteration:
> read this file, do the top unchecked unit, QA it, commit, check it off. A cold
> restart resumes from the first unchecked box.
>
> **Sources of truth:** `CLAUDE.md` (brand — binding), `docs/research/2026-pricing-journey-and-design.md` (strategy + locked pricing).

## STATE  _(session compaction — 2026-06-29)_
- **DONE this session (all on the branch, build-green, 0 console errors @ 393×852 + 1440×900):**
  - **Pricing** wired into the home journey (outcome→proof→struck anchor→ember price + the RATES ledger); second story / mandala finished.
  - **8 routed pages** + Lenis smooth scroll + code-split + lazy/idle canvas + per-route SEO/prerender (earlier).
  - **Pacing pass 1** (`tune-pacing`): `HOLD 0.66 / FADE 1.04` (transit:rest **1.8→0.29**), entry blur 6–12px, `easeOutQuart` snap-in, programmatic scrolls via `forge.lenis.scrollTo`, pointer lerp 0.11, Lenis lerp 0.14; dropped base `html{scroll-behavior:smooth}`.
  - **Both dead home CTAs wired** to `/contact` (hero + finale), keeping the `strike()` forge-flash.
  - **AEO/GEO** (`aeo-geo`): `FAQPage` from `COPY.faq` (/software /voice /automations /web /pricing) in BOTH the no-JS `.seo` HTML and the route `@graph`; `ORG` gained email + sales `ContactPoint`; prerender emits **`dist/llms.txt`**. ⚠ Placeholders for owner: `forge@gaelworx.com`, phone, address, social `sameAs`.
  - **Mandala REMOVED entirely** (owner call 2026‑06‑30 — it fought us repeatedly: rebuilt twice, the viewBox-corner split bug, framing). `Mandala.jsx` + all `.m-*`/`.fin-mandala` CSS + `scripts/mandala-qa.mjs` deleted; dead finale CSS (seed/forges/solutions/closer) swept too. (Pivot/split lesson preserved in the `radial-svg` skill for the next radial build.)
  - **Finale resolves on the LIVING OBSIDIAN:** journey now = problems drain away → **GAELWORX wordmark + `Start the Forge` CTA rise to centre and HOLD** (no mandala; the forge background carries it). DOM-verified: centred, in frame, CTA live, both viewports. CTA → `/contact` preserved.
  - **Carousel pricing = TEASE** (owner + research, decision D in the pricing brief): cards show only the "from $X" entry anchor; the full anchored reveal (elsewhere-comparison + deposit) is held for the late rates ledger, so the number lands last after proof. Dropped `.branch-anchor` + the deposit note from the card.
  - **Text↔background cohesion — "Liquid Obsidian" jewel type (v1):** display heads are cut from the SAME jewel as the slab. `.jewel` (hero H1; lighter coupling on the GAELWORX mark): fire-opal flows through the glyphs + a specular GLIMMER rakes across them (one diagonal `jewelSweep`: tall fire layer in Y, wide glint in X, faint cool opal edge), the head brightens/blooms with a live **`--heat`** var (set per frame in `Content.jsx` from `forge.scrollVel` + the strike pulse — type + slab on ONE clock), and glyphs SURFACE from the glass on reveal (heavy blur→sharp). DOM (legible + indexable). DOM-verified: jewel fill applied, `--heat` wired, 0 errors. **+ Opal play-of-color** (a cool cyan→violet streak counter-rakes the warm glint → iridescent flash) **+ submerge-and-emberize EXIT** (heads sink BACK into the molten glass on scroll-away: recede + harder blur + brightness heat-up + more embers shed — the counterpart to surface-from-glass). Next: roll the jewel to other display heads, maybe the in-canvas refracted GAELWORX showpiece.
  - **ALL ambient orange REMOVED** (owner: "no more orange light or glows at all"): deleted the `.forge-light` pool + `.haze` (Atmosphere now = grain only), the `.stage::before` warm radial, and the shader cursor ember-pool add; **cooled the 3D env** — the wide `#ff8a3a` Lightformer (the literal orange BAND on the glass) + warm key/rim/ring → neutral-cool whites, directional `#ffcaa0`→`#eaf0fb`. Stripped the orange GLOW halos off the text (`.jewel`/`.flame`/`.mark-btn--seal`/`.forge-letter` → dark halos only). Fire now lives ONLY in the obsidian veins + the jewel-type FILL — precise, never an ambient wash. (Heat coupling kept as a FILL brighten, not a glow.)
  - **Jewel effect made VISIBLE** (owner couldn't see it): brighter/wider white glint + brighter cyan→violet opal streak, faster sweep (7.5s→5s). Verified: 3 gradient layers, 5s anim, overlays gone.
  - **Text shifted: forge-orange → OBSIDIAN FIRE-OPAL DAMASCUS** (owner: "more obsidian fire opal Damascus feel … contrast and effect is the main focus"). New shared fill on `.flame` + `.jewel`: a dark **watered Damascus-steel base** (legible cool steel + folded bands + one crimson accent, flows in Y) under **full-spectrum fire-OPAL play-of-color** (cyan→blue→violet→gold) + the **white glint** — contrast + movement lead, minimal orange. **Rolled onto ALL display headers** (every `.flame` head sitewide, plus the hero/finale `.jewel` which keep the live `--heat` surge + surface-from-glass reveal). A+E ignite stays the warm forge accent (brand). DOM-verified the page heads picked it up; QA green.
  - **Background interaction — "Living Veins"** (owner chose the ambient option over tap-ripple/gyro): the obsidian now reacts to scroll ENERGY. New `forge.scrollVel` (smoothed page-fraction/sec, computed in `CameraRig`) flares the veins + runs the forge hotter while scrolling, and a slow idle BREATH keeps the glass alive when still (gated off on `quality:'static'`). Works on mobile + desktop, no hover/permission needed. Live knobs on `?debug`: `scroll flare`, `idle breath`. (Cursor forge-light/parallax stay desktop-only by design; tap-strike + gyro deferred.)
  - **Pricing now lands LATE** (per `2026-pricing-journey-and-design.md` — Yarmosh "sequence the number last; never a naked number"): moved the anchored rates ledger from mid-journey (idx 4) to the **penultimate beat** (idx 9, `RATES=FRAMES-2`, `TRUST_BASE=4`). Order: hero·draw·clan·arsenal·**trust×5·rates**·finale. Full ledger (price + elsewhere-anchor) right before the close; CTA stays a clean ask (no naked number). Index logic constant-driven; QA green.
  - **Finale QA loop** (`scripts/finale-qa.mjs`, `npm run qa:finale` — replaced the retired mandala-qa): deterministic (reduced-motion → Lenis off → exact scroll). Scrolls to the bottom and asserts the mandala DOM is GONE, GAELWORX held + centred, CTA live/clickable + centred, both in frame (no clip), wordmark above the sword, 0 console errors @ 393×852 + 1440×900. Exits non-zero. GREEN.
  - **Services carousel** anchored: discrete dwells (face-on `rotX 0, op 1`) + crisp front + faded peeks (~0.24); `RADIUS 232 / STEP 46`, taller carousel, centred perspective-origin. DOM-verified.
  - **18 skills** in `.claude/skills/` (+ README index): brand-check, motion-feel, tune-pacing, forge-scene, qa-route, ship, add-route, kinetic-type, aeo-geo, lead-capture, **deploy-doctor, radial-svg, scroll-carousel, git-hygiene, parallel-agents, shader-fx, post-fx, fx-resources**.
  - **Research:** `docs/research/` — pacing-motion-deep-dive, mandala-construction-and-animation, vercel-hobby-deploy-limits (+ earlier briefs).
- **🚧 BLOCKER — production deploy stuck (Vercel HOBBY limits):** 100 deploys/day + **1 concurrent build** → this session's volume coalesced/dropped `main`/production builds while branch previews trickle. **Prod (`gwobsdnweb.vercel.app`) still serves the OLD `efc623c` build** (no `/llms.txt`, old bundle `index-BnJhKFIs.js`; 200 not 503 = stale, not paused). The sandbox **cannot** deploy (no token, network 403s `api.vercel.com`/`*.vercel.app`, Vercel MCP read-only — `deploy_to_vercel` only returns CLI text). **Owner-side fix:** Dashboard → Deployments → latest READY preview → ⋯ **Promote to Production** (no rebuild, no limit), or `vercel --prod`, or Settings → Git reconnect. See `deploy-doctor` + `docs/research/vercel-hobby-deploy-limits.md`.
- **GIT:** branch **`claude/gaelworx-obsidian-hero-rrr9xo` = `c3d569a`** (latest, clean, verified — all of the above incl. mandala QA loop, split-pivot fix, finale-settles-on-mandala). `main = 1321e1a` (behind, and not deployed anyway). Sync `main` = branch once deploy is unblocked.
- **REVIEW PREVIEW (owner, logged into Vercel):** `https://gwobsdnweb-git-claude-gaelworx-obsid-77d130-zach-1373s-projects.vercel.app` (branch alias auto-updates to the latest branch build).
- **NEXT:** (1) **owner promotes** the preview → production so the public URL is current; (2) owner reads mandala/carousel/pacing on the **iPhone 15** → tune from that verdict; (3) confirm intake email + NAP (AEO placeholders); (4) Phase 2 lead endpoint (`lead-capture`); (5) footer w/ internal links; (6) perf-budget asserts in QA.
- **PROD DEPLOYS:** owner OK only; on Hobby treat deploys as scarce — push `main`/promote at milestones, not per commit (`git-hygiene`, `deploy-doctor`).

## CHROMEBOOK / WEBGL ROBUSTNESS (fixed 2026-06-30)
- **Symptom:** the 3D background worked on the iPhone but rendered BLACK on a Chromebook.
- **Root cause:** the iPhone gets tier **`low`** (mobile UA) which has **transmission OFF**; the
  Chromebook landed on **`high`** → **transmission ON**, and `MeshPhysicalMaterial` transmission
  renders BLACK on weak/software GPUs (the Chromebook), while working on the phone.
- **Fix (`hooks.js` `detectQuality` + `ForgeExperience`):** probe the real GPU via
  `WEBGL_debug_renderer_info` — **software renderer (SwiftShader/llvmpipe/…) or no WebGL → `static`**,
  which now renders the **CSS obsidian poster** (no fragile canvas). **ChromeOS (`CrOS` UA) + mobile +
  ≤4-core → `low`** (no transmission — the proven phone path). Only real desktop GPUs get
  `high`/transmission. De-oranged the `.canvas-fallback` poster. Verified: SwiftShader → poster, no
  black canvas. **Owner to confirm on the actual Chromebook.**

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
