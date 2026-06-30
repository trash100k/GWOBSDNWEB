# GAELWORX — KNOWLEDGE MAP

**Single consolidated map of everything we already know.** Use this as the index before any
forge-world build work. Organized by theme; each theme lists what is LOCKED (decisions / numbers /
techniques), WHERE it lives (file paths), and what is still OPEN / MISSING. Ends with
"What to leverage for the build."

> **Repo note:** All knowledge lives in **GWOBSDNWEB**. The **YardWorx repo
> (`YRDWRXWSFORGEVENTURE`) is currently EMPTY — no commits yet** (branch
> `claude/website-avatar-forge-redesign-k15gh9` exists with `.git` only, zero tracked files).
> Do not look there for source; YardWorx exists as a brand/proof concept only, not code.

Compiled 2026-06-30. Status across the redesign: **concept LOCKED, graphics research (P0) in
flight, build (P1–P7) NOT started.**

---

## 1. Brand / Identity

**LOCKED**
- Ethos: **Neo-Gaelic Brutalist** — "Automatic Execution. Clan Protected." Voice = Clan Voice:
  aggressive (no passive), clean, battle-tested; CTAs follow "Point the Sword."
- **Type system:** Cinzel Decorative = ONLY display serif (weights **700/900 only**, static —
  cannot weight-morph). Bricolage Grotesque = headlines (700–800, the variable font that does all
  weight-breathing). Hanken Grotesk = body (400/600/700). JetBrains Mono = optional labels (500,
  uppercase, 0.05em).
- **A+E IGNITE rule (mandatory, made physical in the redesign):** within each WORD of a brand
  proper-noun, ONLY the first `A` and first `E` ignite (900 Cinzel + forge gradient) — never every
  A/E. Terms: **GAELWORX · Automatic Execution · Maeve · YardWorx · RepairWorx · SalesWorx ·
  AgentWorx.** Forge gradient `linear-gradient(to bottom,#E85D04,#C1292E,#E34A27,#C0392B)`,
  animated `lavaFlow`, ember text-shadow.
- **Palette (Industrial Metallurgy):** Celtic Blood `#C1292E` (`--gw-forge`), Ember Glow `#E85D04`
  (`--gw-ember`), Forged Iron `#0B0C10` (`--gw-void`), Cold Steel `#1F2833` (`--gw-iron`), Fog
  White `#F1F2F6` (`--gw-bone`), Ash `#8D99AE` (`--gw-steel`).
- **Brutalist layout:** 0px border-radius EVERYWHERE; 1–2px solid borders; Iron Grid (12-col, 0px
  gaps); 3-level depth (L1 1px Ash border · L2 inner glow `#E34A27` @10% · L3 8px hard `#000`
  shadow); icons 1.5px monolinear.
- **Motion laws:** Brutalist Snap (0ms delay, ease-out, no bounce) · Atmospheric Drift · Forge
  Reveal (blur→sharp).

**WHERE:** `CLAUDE.md` (binding law). Implementation: tokens/CSS `src/styles.js`; fonts
`src/main.jsx`; copy `src/brand.js`; ignite system `src/ui/Ignite.jsx`, `src/ui/ForgeText.jsx`,
`src/ui/BrandText.jsx` (TERMS list). Skills: `brand-check`, `kinetic-type`.

**OPEN / MISSING:** CLAUDE.md's own TODO flags the current shipped UI is still soft/rounded/
cinematic and not yet true brutalism. How far green pushes into chrome vs receding Celtic-Blood
red is unresolved (see §7).

---

## 2. Commercial / Pricing

**LOCKED — numbers (authoritative: `docs/forge-world/PRICING.md`, revised 2026-06-30, SUPERSEDES
the 2026-06-29 anchor card):**
- **Software (flagship):** Foundation **$15,000** / Core Build **$30,000** ("Most Forged" decoy
  middle) / Full Platform **$50,000**. Deposit = **25% of project** (scales; replaces the old flat
  $5k). Repriced UP from $10–35k (which read "freelancer"). Anchor: agency $75k–$200k, in-house dev
  $180k+/yr.
- **Voice (profit center, OUTBOUND sales agents, hybrid):** **$2,500 setup** (–$3,500 complex) +
  **$699/mo/agent** base (incl. ~2,000–2,500 min bucket, the margin floor) + **$0.30/min** overage
  + **$50/booked appointment**. Cost reality ~$0.09–0.15/min all-in. Anchor: human SDR
  $50–70k/yr+comm; inbound receptionist $48k/yr. Keeps "Recommended" flag.
- **Automations:** **$2,500–$7,500** one-time + **Forge Care $500–$1,500/mo** retainer.
- **Web (loss leader):** Launch **$1,499** / Full Cinematic **$4,999** (decoy) / Custom **$9,999+**
  (scales $15–25k+) + **Forge Care $49–$99/mo** (70–95% margin). Anchor: studios $50k+.
- **Web cost model:** per-client marginal ~$3–30/mo; fixed overhead ~$150–250/mo spread across all
  clients. Cloudflare "connector" (one account, per-client zone, saved security template; SSL $0
  sold as a Forge Care line, not COGS).
- **The reusable forge-world 3D ENGINE is the moat + margin:** bespoke 3D = 100+ hrs/site;
  configured from the engine = ~8–12 hrs/site, so even $1,499 ships cinematic 3D profitably. 3D
  labor costed $150–200/hr internal.

**LOCKED — strategy / placement:**
- Website IS ~80% of the sale (~6-mo, ~60-touchpoint B2B journey, ~13 content pieces before
  contact, 75% prefer rep-free). Buyers given relevant info 2.8x more likely to buy with ease.
- **Anchored transparency** (not a fixed list): anchors + productized entry rung + estimator-to-
  quote; final bespoke number stays a conversation.
- **"Tease early, full reveal late"** AND the redesign goes further: **the home rates beat is
  REMOVED entirely** (broke emotional momentum / triggered System-2 at the worst moment). Price
  PLACEMENT rules (DESIGN-BRIEF §6): NEVER on any hero/above-fold, About, or Work; TEASE only
  ("from $X") on Home Arsenal cards + Nav; FULL reveal only on service pages, /pricing, Contact.
  Home anchors the PROBLEM cost ($75k+ agencies, $48k/yr receptionist) only.
- **Honest scarcity LOCKED at 2 builds per quarter.**
- Premium psychology: clean ROUND numbers ($15,000 not $14,997); charm pricing kills premium;
  deposit = commitment filter (~91% close on deposited deals); installments +30–40%; decoy/
  compromise middle tier engineered to win.

**WHERE:** `docs/forge-world/PRICING.md` (numbers, authoritative); `docs/forge-world/DESIGN-BRIEF.md`
§6 (placement); `docs/research/2026-pricing-journey-and-design.md` (journey science + competitor
teardown — superseded ONLY on the anchor-card numbers, science still authoritative);
`docs/research/lead-capture-and-nurture.md` (Phase-2 ops). Skill: `lead-capture`.

**OPEN / MISSING:** Lead-tracking stack for the nurture window still owed (recommended stack =
Supabase + Attio + Gmail/AgentMail + n8n, but not chosen/built). Voice setup dollar figure
deliberately NOT published. Estimator/calculator not built.

---

## 3. Copy & Persuasion (strategy)

**LOCKED — one persuasion architecture:**
- Market is Schwartz **Sophistication Stage 3–4** → win on **MECHANISM** (Automatic Execution =
  the system that runs the work; Maeve; the Worx line) + **IDENTITY** (the Clan). Generic AI
  claims are dead.
- **Archetype lockup:** Outlaw × Hero, Ruler polish, bound by the **CLAN (Unity = the "nuclear"
  Cialdini lever)**. StoryBrand: owner = Hero, GAELWORX = scarred Guide.
- **Villain is always a condition**, never the buyer: operational chaos (missed calls, six apps,
  busywork) + the AI-hype industry (black-box oracles, abandon-ware pilots) / bloated agencies.
  Enemy = the status quo/grind, never a named competitor.
- **Cost-of-inaction framed ~2x louder than upside** (loss aversion λ≈1.5–2.5; 40–60% of
  high-ticket deals die to indecision, not to a competitor).
- **High-ticket = a RISK problem wearing a price tag.** Risk-reversal ladder (weak→bold):
  specificity → authority → fixed-scope/fixed-price → deposit-as-filter → "we carry the risk; you
  pay when it executes" → named proof.
- **Objection Cascade (page order):** Why care? → Why you? → Why believe? → Why now?
- **Framework-to-awareness map:** Home = StoryBrand hybrid; Service pages = PAS/PASTOR/QUEST
  mechanism-led; /work = social proof; /pricing = anchored + late + value-stack; Contact =
  future-pace + risk-reversal, single CTA.
- **FTC line ("persuade the entrance, never trap the exit"):** every lever must be TRUE — no fake
  timers, drip pricing, confirmshaming, roach-motel cancel. Enforcement teeth cited (Amazon $2.5B,
  Epic $245M).
- **Design IS the argument** (aesthetic congruence): the brutalist forge aesthetic itself reads as
  the "meticulously engineered" claim. Attention Ratio target 1:1.
- **Biggest unbuilt lever named: a real-proof `/work` case-study page.**

**WHERE:** `docs/research/copy/` (README + 01–06), `docs/research/copy-architecture-and-dark-
persuasion.md` (synthesis), `docs/research/copy-deep-dive-advanced.md` (advanced),
`docs/research/RESEARCH.md` (393KB master, embeds both verbatim).

**OPEN / MISSING:** No real client proof exists — only GAELWORX's own four platforms are
first-hand; all client-result slots ship as clearly-marked placeholders. Voice-of-customer
verbatim mining not done (must mine, not invent).

---

## 4. Per-page Copy Drafts (ready-to-paste specs)

**LOCKED — nine route-level rewrite specs + an editorial revision pass**, each mapping an exact
`brand.js` COPY key or `src/pages/*.jsx` string location → final string, with a "levers used"
table.
- **home** — full scroll-jack rewrite (Mark/Hero/Draw/Clan/Arsenal/Rates/Point/Trust×5/Finale/
  Footer). Hero = mechanism-as-headline "Automatic Execution." 5-rung trust ladder.
- **about** — adds ONE new section "Why GAELWORX exists" (The Enemy). Founder figure flagged
  `[to confirm]` — never ship "decades" unless literally true.
- **software / voice / automations / web** — branch object + FAQ + page strings; prices LOCKED;
  FAQ answers ≤320 chars, fact-first (for FAQPage/AEO schema).
- **work** — THE proof page; four own-platform mini case studies; client slots are honest
  bracketed placeholders `[__%] — to confirm`.
- **pricing** — decoy-ordered ledger, anchored-transparency reconciliation, dual FAQ surfaces.
- **contact** — 2-step form copy, outcome-stated buttons, risk reversal at the click.
- **revision-pass (2026-06-30, owner edits):** the rewrite was "over-forged"; 28 tightening edits.
  **Biggest structural call: KILL the scroll-jacked finale** (drain problems → mandala → wordmark)
  → replace with one calm hard close on the living obsidian (one etch-in line + one sword,
  Attention Ratio 1:1, wordmark NOT repeated).

**WHERE:** `docs/research/copy/drafts/{home,about,software,voice,automations,web,work,pricing,
contact,revision-pass}.md`. Also embedded in `RESEARCH.md` Part VIII.

**CONFLICT to resolve:** the DESIGN-BRIEF finale (metal fills GAELWORX letters G→A→E→L→W→O→R→X;
A/E never cool) vs the copy revision-pass "calm hard close, wordmark not repeated" vs BUILD_PLAN's
"mandala REMOVED entirely." The redesign DESIGN-BRIEF is the newest WHAT and supersedes; reconcile
copy to it.

**OPEN / MISSING:** Contact button label + phone-field cut still flagged decisions. Automations
draft has a stray malformed `</content></invoke>` trailing artifact (body complete).

---

## 5. Motion / Typography (craft)

**LOCKED — dual motion law:** scroll is **FLUID** (Lenis momentum + dt-correct exponential
damping: `current = target + (current-target)*pow(smoothing,dt)`), elements **LAND with Brutalist
Snap** (short ease-out, transform/opacity ONLY, no bounce).
- **Numbers:** micro 100–250ms, content 300–600ms, UI sweet-spot 200–300ms; <200ms = instant,
  >600ms = sluggish; never linear; 16.7ms/frame / 60fps budget.
- **CRITICAL diagnosis:** the iPhone 15 judge device **never touches Lenis** (`syncTouch` defaults
  false; configured `new Lenis({lerp:0.1,smoothWheel:true})` at `ForgeExperience.jsx:78`) — so on
  mobile the feel IS the choreography. Past Lenis tunes only changed desktop.
- **Pacing fixes (prioritized, file:line):** P1 flip rest:transit — HOLD 0.5→0.66, FADE 1.4→1.04
  (`Content.jsx:47-48`; ratio formula `(FADE-HOLD)/(2*HOLD)`, target <1.0). P2 cut entry blur
  18–32px → 6–12px resolved in first third (`Content.jsx:106`). P3 asymmetric easing. P4 route
  programmatic scrolls through `forge.lenis.scrollTo` + delete `html{scroll-behavior:smooth}`
  (`styles.js:21`; current double-smooth at `Content.jsx:120,124,126`). P5 pointer lerp 0.06→0.11.
- **Compositor discipline:** animate transform+opacity only; `filter:blur()` is NOT cheap — keep
  blur radii small/bounded. Lenis and CSS scroll-snap are incompatible — never add scroll-snap.
- **Typography elevation:** Cinzel = static (transform/glow/3D play only); Bricolage = variable
  (weight-breathing). Ranked opportunities: (A) forge-proximity ignite, (B) 3D forged wordmark
  (troika-three-text SDF or TextGeometry), (C) X-axis rotation reveals via CSS Scroll-Driven
  Animations API, (D) Lenis, (E) scroll-velocity numerals, (F) Bricolage breathing. Every effect
  needs a prefers-reduced-motion static fallback; mobile simplifies not replicates.
- **Mandala:** rebuild via N-fold symmetry (N=8/12 ties to 4 branches), ONE motif `<use>`-rotated
  (NOT 12 independent spins), band height ≤70% of radial gap, real over/under interlace, ONE
  coherent rotation (1 rev/90–180s). (NOTE: redesign may retire the mandala entirely — see §4
  conflict.)

**WHERE:** `docs/research/pacing-fluidity-snap.md`, `pacing-motion-deep-dive.md`,
`mandala-construction-and-animation.md`, `typography-3d-fontplay.md`. Skills: `motion-feel`,
`tune-pacing`, `kinetic-type`, `radial-svg`, `scroll-carousel`.

**OPEN / MISSING:** None of the prioritized pacing fixes shipped yet. On-device iPhone-15 A/B
read is the only real verdict (sandbox can't fully simulate touch).

---

## 6. 3D / Performance / Deploy

**LOCKED — current shipped scene + jewel pivot:**
- Shipped artifact (README): obsidian-slab hero, four-act scroll, MeshPhysicalMaterial patched via
  `onBeforeCompile`, procedural warm-Lightformer `<Environment>` (no HDR fetch), post-FX
  (thresholded Bloom / ChromaticAberration / Vignette / Noise), 3 quality tiers from
  `detectQuality` (high/low/static) + WebGL→CSS fallback.
- **Faceted-obsidian-jewel pivot (2026-06-30, started):** centered cut gem (`src/scene/gem.js`
  `buildGem`: table→crown→girdle→pavilion→culet, non-indexed flat facets, `flatShading:true`) +
  `src/scene/FacetedJewel.jsx` — rendered **OPAQUE REFLECTIVE black glass, transmission:0** (because
  **transmission rendered BLACK on the Chromebook**; reflective is the perf+compat win). Fire-opal
  lives at facet EDGES (EdgesGeometry → additive LineSegments riding `--heat`) + Fresnel iridescent
  flash. `ObsidianSlab.jsx` now orphaned.
- **Chromebook/WebGL fix:** `detectQuality` probes GPU via `WEBGL_debug_renderer_info`; software
  renderer (SwiftShader/llvmpipe) → static CSS poster; ChromeOS/mobile/≤4-core → low (no
  transmission); only real desktop GPUs get high/transmission.

**LOCKED — CWV / perf budget:** LCP <2.5s (LCP element is prerendered text — must not be blocked),
INP <200ms (most-failed metric), CLS <0.1; initial JS **<~200KB gz**. Current bundle ~1.43MB /
446KB gz (the persistent warning). Wins: React.lazy+Suspense the ForgeCanvas (mount after first
paint), Vite `manualChunks` to split three/@react-three/postprocessing/gsap/leva, OffscreenCanvas/
worker, Drei LOD, mutate in `useFrame` not React state. Gate fails over budget in QA.

**LOCKED — deploy reality:** Vercel **Hobby** (100 deploys/day + 1 concurrent build) caused
production-from-`main` to drop while branch previews coalesced; prod served stale. **Unblock =
promote a ready preview to production** (Dashboard ⋯ → Promote, or `vercel promote`). **Long-term:
migrate to Cloudflare Pages** — repo already prepped (`public/_redirects` SPA fallback), build
`npm run build` → `dist`, no functions to port, owner-side dashboard steps remain. Sandbox CANNOT
deploy (no token / 403s / MCP read-only).

**WHERE:** `README.md`, `docs/BUILD_PLAN.md`, `docs/research/faceted-obsidian-jewel.md`,
`webgl-performance-cwv.md`, `vercel-hobby-deploy-limits.md`, `cloudflare-pages-migration.md`,
`RESEARCH.md` Parts III/V/VII. Scene files `src/scene/*` (ForgeCanvas, Effects, scenes.js,
shaders.js, gem.js, FacetedJewel, palette.js). Skills: `forge-scene`, `shader-fx`, `post-fx`,
`qa-route`, `deploy-doctor`, `ship`, `fx-resources`.

**OPEN / MISSING:** Perf harness (BUILD_PLAN 0.5) still open — LCP/INP/CLS+JS gate not added to
`scripts/shot.mjs`. Cloudflare connect + domain repoint are owner-side, not done. WebGPU+TSL vs
WebGL2 go/no-go deferred to after P0 Phase 2.

---

## 7. The Forge-World Redesign Plan

**LOCKED — concept (DESIGN-BRIEF, branch `claude/website-avatar-forge-redesign-k15gh9`):**
- **Concept:** the site is a giant ancient Gaelic dwarf-forge; molten metal pours down Celtic
  interlace channels and casts the word GAELWORX. Register: "Middle-Earth meets true Gaelic."
  Environment = stage, message = star, delivery = trick.
- **A+E ignite made physical:** A and E are the metal that never cools (white-gold divine fire);
  a typographic rule becomes a narrative law.
- **Home arc = ONE continuous pour, no camera cuts:** Hero (altar, pooling) → Release → The Clan →
  The Arsenal (channel forks into FOUR branches) → Trust ladder ×5 (branches rejoin) → **Finale:
  metal fills GAELWORX letters in order G→A→E→L→W→O→R→X; G,L,W,O,R,X cool to iron-black with ember
  veins while A and E never cool; light reveals carved Ogham; "Automatic Execution" crystallizes
  beneath in Cinzel.** Closer "Point the sword. We take care of the rest." → START THE FORGE.
- **World material:** pour-source-only framing into pure void; dark green-black Irish basalt that
  shows green only under A+E white-gold light; metal = true temperature gradient (blue-white-hot →
  ember #E85D04 → forge red #C1292E → iron-black veins); heat shimmer + sparks that ORBIT the pour
  front.
- **Nine per-page chambers of one complex:** / Pour Journey · /voice Scrying Pool (flagship,
  branding dialed down) · /software Casting Room · /automations Channel Hall · /web Jewel Chamber
  (recontextualized FacetedJewel) · /about Altar Approach · /pricing Stone Ledger (prices cut in
  relief) · /work Four Plinths (the four Worx platforms) · /contact Forge Mouth ("Name the
  bottleneck." carved in keystone).

**LOCKED — technical thesis (the reusable engine):** ONE master temperature/blackbody uniform
(`uTemperature` drives emissive color+intensity+cooling via blackbody Kelvin→RGB) + ONE noise basis
(shared FBM/curl/domain-warp) + ONE palette + OLED tone-map (ACES/AgX) + a SINGLE route-swapped
WebGL renderer hosting all chambers as **configs, not forked shaders.** Master uniforms bus on
`src/store.js` forge object (time/temperature/heat/pointer/scrollProgress). NO runtime EXR. This
engine doubles as the commercial moat (§2).

**LOCKED — build cadence (TODO P0–P7):** P0 Research (in flight) → P1 Foundations (shared systems:
temperature, blackbody LUT, noise basis, uniforms bus, basalt/iron/molten materials, post-FX spine,
procedural IBL, quality tiers) → P2 Home Pour journey → P3 Copy + sales journey (can run PARALLEL
with P1/P2) → P4 /pricing → P5 flagship chambers (Voice, Contact, About) → P6 remaining chambers →
P7 perf+polish+QA+ship. Rule: "never let a frame ship that makes the message harder to read."
Dependencies: P2 needs P1; P4 /pricing build + P3 home rates REMOVAL must land together; all
chambers reuse P1 (do NOT fork per-chamber shaders).

**WHERE:** `docs/forge-world/DESIGN-BRIEF.md` (WHAT), `docs/forge-world/RESEARCH.md` (WHY/HOW),
`docs/forge-world/PRICING.md` (numbers), `docs/forge-world/TODO.md` (build plan). Graphics research
in flight: workflow `wf_ed6b6f20-e63`, P0 Phase 1 = 33 specialist docs in `graphics/phase1/`
producing `00-COHESION-MAP.md` + `00-INDEX.md`; Phase 2 fans 50–80 topics to 500+ pages. Skills:
`new-build`, `add-route`, `parallel-agents`.

**OPEN / MISSING:** Graphics deep-dive (P0 Phase 2) not complete. **Build P1–P7 not started.**
Open user decisions still owed: lead-tracking stack, the altar Ogham inscription line, WebGPU+TSL
vs WebGL2 go/no-go. Finale reconciliation across DESIGN-BRIEF vs copy revision-pass vs retired
mandala (§4 conflict). How far green goes in chrome vs receding Celtic-Blood red.

---

## What to Leverage for the Build

1. **Build the engine, not the page.** P1 shared systems (one temperature uniform → blackbody →
   emissive/cooling everywhere; one noise basis; one renderer hosting chambers as configs) is the
   single highest-leverage move — it is both the cohesion mechanism AND the margin moat that makes
   $1,499 cinematic 3D profitable. Configure chambers; never fork per-chamber shaders.
2. **Reuse, don't reinvent.** The A+E ignite system (`Ignite`/`ForgeText`/`BrandText`), the
   FacetedJewel (recontextualize for /web Jewel Chamber), the single-renderer route-swap, the
   quality-tier/`detectQuality` gating, and the prerender + FAQPage schema all already exist.
3. **Render reflective + lazy + tier-gated.** Transmission renders BLACK on weak GPUs — obsidian
   and any 3D text must be opaque/reflective, lazy-loaded after critical paint, with a static
   poster fallback, to honor the iPhone-15 OLED judge target and the <200KB-gz / LCP<2.5s budget.
4. **Fix the mobile feel = fix the choreography.** iPhone never uses Lenis, so ship the pacing
   fixes (HOLD/FADE ratio <1.0, blur 6–12px, route programmatic scroll through Lenis) — these are
   diagnosed to file:line and are an early, high-ROI win.
5. **Copy can run in parallel (P3) with zero 3D dependency.** Drafts are ready-to-paste mapped to
   exact `brand.js`/`*.jsx` locations. Honor the locked invariants: prices LOCKED, brand terms
   spelled exactly for ignite, no passive voice, every claim TRUE, FAQ ≤320 chars fact-first.
6. **Respect placement + honest levers.** Remove the home rates beat; tease "from $X" only; full
   reveal late; scarcity = 2 builds/quarter; never a fake timer or trapped exit (FTC teeth are
   real and a $1,299–$50k System-2 sale dies if one lever is caught fake).
7. **Treat deploys as scarce.** Commit freely on branch; promote a Vercel preview to prod or push
   `main` only at milestones; move to Cloudflare Pages to escape the Hobby bottleneck. Verify via
   `qa-route` at 393×852 + 1440×900 with 0 console errors, then the iPhone-15 OLED read.
8. **All source lives in GWOBSDNWEB — YardWorx (`YRDWRXWSFORGEVENTURE`) is empty.** Treat YardWorx
   as a brand/proof concept, not a code dependency.
