# GAELWORX — MASTER BUILD PLAN (project-level · authoritative)

> The single plan that puts **everything** together: the locked copy/sales-journey, the pricing model,
> the lead backend, the deploy path, and the avatar-level 3D engine. Companion docs: `DESIGN-BRIEF.md`
> (the what), `PRICING.md` (the numbers), `KNOWLEDGE-MAP.md` (what we already know),
> `../research/graphics/00-COHESION-MAP.md` (the 3D architecture spine), `TODO.md` (the task tracker).
> Revised 2026-06-30. Branch: `claude/website-avatar-forge-redesign-k15gh9`.

---

## 0. THE STRATEGY — value-first, not 3D-first (the recommendation)

The obvious plan is "build the giant 3D forge world, then launch." **That's the wrong order** and it
violates your own trust rung ("It ships. Then it earns."). The risks: weeks with no revenue and no leads,
a big-bang rebuild that's all-or-nothing, and — flagged by the KNOWLEDGE-MAP — **the CTAs are currently
dead** (no lead backend), so even a beautiful site converts nothing.

**Better idea: three parallel tracks, value first.**

| Track | What | Why it wins |
|---|---|---|
| **1 · Ship the Earner** | Copy (done) → `/pricing` → **wire the lead backend** → deploy → mine `copy/drafts` for inner pages. | The site goes **live and converting on the current 3D in days**, capturing leads while the engine is built. Revenue/funnel starts now. |
| **2 · Build the Engine** | The cohesion-map spine, built **isolated**, proven on **one chamber at a time**, swapped into the live site **per-route**. | The single-renderer arch means each chamber ships independently — **no big-bang, no all-or-nothing**. Each upgrade is reversible and can't break the whole site. |
| **3 · Engine as Product** | Build the engine **configurable from day one** (the reusable forge-world engine). | It's the **moat + margin** — the moment it's proven on GAELWORX it's reusable for client sites at the loss-leader web economics. |

The 3D is **progressive enhancement on a working, converting base** — not a prerequisite for launch.

---

## 1. TRACK 1 — SHIP THE EARNER (days, not weeks · zero 3D dependency)

1. **Copy / sales journey — ✅ DONE** (committed `ea90769`): hero reframe, enemy, identity-first Clan +
   enterprise credibility, Voice-first Arsenal, sharpened trust ladder, rates beat retired, finale close +
   2-builds/quarter scarcity. Build green.
2. **`/pricing` page** — tabbed flagship-first (Software · **Voice ★Recommended** · Automations · Web),
   anchor → tiers (decoy middle) → de-risk → CTA. **Reconcile the live numbers + the FAQ schema in one pass**
   to the `PRICING.md` model (Software $15–50k/25%, Voice outbound hybrid, Automations + care, Web
   $1,499/$4,999/$9,999+ + Forge Care). The Stone-Ledger 3D is a later Track-2 swap.
3. **Lead backend — the unblock** (CTAs are dead today). Wire the Contact form + every CTA to a real
   destination: **Supabase** (store) + **Attio** (CRM) + **Gmail/AgentMail** (notify) + **n8n** (route/
   nurture). This is what turns the site from a brochure into a machine. *(Owner picks the stack — all are
   connected MCP servers.)*
4. **Inner-page copy** — mine the finished drafts in `docs/research/copy/drafts/*` (home, about, software,
   voice, automations, web, work, pricing, contact) into `brand.js`; build pages on `PageShell`/`Section`
   via the `add-route` skill. Run `brand-check` + `aeo-geo` on each.
5. **`/work` proof** — only the four self-run platforms are first-hand; ship client-result slots as
   **honest marked placeholders** until real proof exists (never fabricate — FTC teeth, and it torches the
   funnel).
6. **Deploy** — **Cloudflare Pages** (repo already prepped via `public/_redirects`); Vercel Hobby drops
   prod-from-main (`deploy-doctor`). Custom-domain repoint + CF connect are **owner-side dashboard actions**.

**Exit of Track 1:** a live, fast, on-brand, lead-capturing GAELWORX site on the current 3D. The funnel runs.

---

## 2. TRACK 2 — BUILD THE ENGINE (the cohesion-map spine, swapped in per-route)

Full architecture: `../research/graphics/00-COHESION-MAP.md` (the binding contract) + the 33 phase-1 docs +
the phase-2 build-specs. **The one-sentence contract:** one renderer · one temperature signal · one noise
basis · one palette · one tone-map · one bloom contract · one lighting model (the metal is the only light) ·
one camera — every element samples those at different inputs; the **A and E are the single eternal
exception**; the perf budget gatekeeps to **60fps on iPhone 15 OLED**.

**Resolved by the research (was an open decision):** ship **WebGL2 + `onBeforeCompile` GLSL** to the judge
device — author TSL-portable so WebGPU is a post-judge re-host, not a rewrite. Betting the judge on the
`WebGPURenderer` WebGL2-fallback is the documented mistake.

Build order (each layer de-risks the next; every step: `npm run build` green → `qa-route` 0 console errors
→ **iPhone 15 OLED device read**):

- **Phase A — the spine** (no look ships until right): master temperature functions (`gw_tempColor`,
  `gw_tempEmissive`, `gw_forge`, `gwCool01`, **`gw_divineFire`**) tuned *through the tone-mapper on device* →
  the shared uniform pool `U` + `<ForgeDriver/>` (repoint slab + jewel, confirm `/` byte-identical) → the
  `gw_` noise toolkit + `GW_FBM_OCTAVES` tier gate → the **OLED tone-map/grade** decision (AgX vs ACES A/B
  on device, half-float composer buffer, grain-as-dither).
- **Phase B — the substance:** the molten surface (slow it first, then ramp, skin, flow) → the cooling
  system + the **divine-fire A/E exception** (stamp early, verify they never cool) → basalt + forged iron
  (the AE green-reveal is the first visible milestone).
- **Phase C — the journey:** 3D Cinzel letterforms + progressive fill (`uFillFront`, per-letter `uIsAE` as
  baked data) → Celtic-interlace channels (one knot curve consumed 3 ways: geometry, pour flow, spark path)
  + the pour (channel→letter handoff on one clock) → the scroll camera journey + lens (focus locked to the
  pour-front; finale dolly-zoom).
- **Phase D — atmosphere + finish:** sparks/heat-haze/smoke/god-rays/caustics (all read `uTemp`/`uPourFront`,
  tier-gated) → Ogham + carved engraving (the AE-gated reveal, built last — it lights the lore) → the
  per-chamber bespoke heroes as `scenes.js` configs + route-gated meshes (dispose on unmount; `renderer.info.
  memory` flat across nav) → the post-FX finish + the Brutalist-Snap choreography pass.

**Progressive rollout into the live site** (this is the key to the no-big-bang plan): build & prove each
piece behind the single renderer, then ship it per-route. Suggested order of *visible* upgrades:
**Home pour journey (the centerpiece) → `/voice` scrying pool (flagship) → `/contact` forge mouth →
`/about` altar → `/pricing` stone ledger → `/software` casting room → `/web` jewel → `/automations` channel
hall → `/work` plinths.** Each is one PR, reversible, behind the perf budget.

---

## 3. TRACK 3 — THE ENGINE AS A PRODUCT (the moat)

- Build the engine **configurable, not hardcoded** to GAELWORX: the `scenes.js` preset table + `PAL` swap +
  copy/route config = a new client world by **config, not a rebuild** (~8–12 hrs/site vs 100+ from scratch).
- Pair with the **Cloudflare protection connector** (templated SSL Full-Strict + WAF + bot per zone) + CF
  Pages boilerplate (`PRICING.md` §5). Result: cinematic 3D shippable at the $1,499 web hook, profitably.
- This is why the web loss-leader works and why **no competitor can match it** — they don't have the engine.

---

## 4. OPEN DECISIONS (these gate specific steps — owner's call)

| Decision | Status | Gates |
|---|---|---|
| **Finale reconciliation** | ⚠️ conflict: DESIGN-BRIEF (letters fill, A/E never cool) vs copy revision-pass ("calm hard close, wordmark not repeated") vs retired mandala | the home 3D finale (Phase C/D). DESIGN-BRIEF is newest WHAT — confirm or override. |
| **Lead-tracking stack** | owed (Supabase/Attio/Gmail-AgentMail/n8n recommended) | Track 1 step 3 — the unblock. |
| **WebGPU vs WebGL2** | ✅ RESOLVED by research → WebGL2 for judge, TSL-portable | Track 2 (unblocked). |
| **Green-vs-Celtic-Blood** balance in chrome | open | basalt material + grade (no green in post — brand law). |
| **`/work` real proof** | none yet (only the 4 self-run platforms) | `/work` page — placeholders until real. |
| **Contact form** final button label + phone-field cut | open | Track 1 lead backend. |
| **AgX vs ACES** tone-map operator | A/B on device (Phase A) | the OLED look. |

---

## 5. SHIP GATES (definition of done, every PR)

`npm run build` green → `qa-route` at 393×852 + 1440×900 with **0 console errors** → **iPhone 15 OLED read**
(true-black void, vivid Celtic Blood, divine-fire white-gold, bloom spread — these don't simulate headless)
→ perf budget held (DPR 1.5 cap, ~9–10ms high-tier, static/reduced-motion path present) → `brand-check`
(A/E ignite, type, palette, 0px corners) → `aeo-geo` (prerender head + FAQPage + sitemap valid in `dist/`)
→ `deploy-doctor` → push. Promote a preview if prod-from-main drops.

---

## 6. STATUS SNAPSHOT (2026-06-30)

- ✅ **Copy / sales journey** — shipped, green, pushed.
- ✅ **Planning corpus** — DESIGN-BRIEF, PRICING, RESEARCH, TODO, KNOWLEDGE-MAP, this plan.
- ✅ **Graphics research** — broad sweep 33/33, cohesion map + index, ~51 deep dives (~918 pages and
  climbing); build-specs + audits + the graphics master plan still finishing in the background.
- ⏭ **Next (Track 1):** `/pricing` + lead backend + deploy — the earner. Then Track 2 Phase A (the engine
  spine) in parallel.
- 🚫 **Blockers to clear:** the finale reconciliation + the lead-stack choice (both owner calls above).

> **The plan in one line:** ship the converting site now on the current 3D, capture leads, then upgrade it
> chamber-by-chamber with the avatar-level engine — which is also the reusable product the web business runs on.
