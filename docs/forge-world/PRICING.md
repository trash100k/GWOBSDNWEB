# GAELWORX — PRICING MODEL (authoritative)

> **Single source of truth for pricing.** Supersedes the anchor card in
> `docs/research/2026-pricing-journey-and-design.md` (Decision B / Part 4, "LOCKED 2026-06-29").
> Revised **2026-06-30**. Branch: `claude/website-avatar-forge-redesign-k15gh9`.
> Pricing PLACEMENT (where on the site each number appears) lives in `DESIGN-BRIEF.md` §6.

## Pricing principles (from repo research — unchanged)
- **Price is a quality signal.** Custom work is hard to judge pre-purchase → underpricing
  disqualifies you from serious buyers. (This is why software moved up.)
- **Anchor against the real alternative** (in-house hire / cost of the problem), never cheaper agencies.
- **Round numbers for flagship; charm endpoints OK for the high-volume front door (web).**
- **Deposit = commitment filter, scales with the build.**
- **Recurring > one-off.** Every line should try to throw off a monthly "Forge Care" annuity.

---

## 1. SOFTWARE — the flagship · **LOCKED $15k–$50k**
Repriced UP from $10–35k (was ~3× too low vs market; signaled "freelancer").

| Tier | Price | Role |
|---|---|---|
| Foundation | **$15,000** | accessible custom build |
| **Core Build** | **$30,000** | the "Most Forged" middle / decoy |
| Full Platform | **$50,000** | flagship ceiling |

- **Deposit: 25% of project** (e.g. $3,750 → $12,500), scales with commitment — replaces the flat $5k.
- **Anchor:** agency medium platform **$75k–$200k**; in-house dev **$180k+/yr** loaded. We sit
  deliberately below market = "premium, lean."
- Still scoped, deposit-gated, fixed scope/fixed price, "we don't bill the balance until it executes."

## 2. VOICE — the profit center · **OUTBOUND sales agents · Hybrid model**
Primary use case = **outbound sales agents** (dialing, qualifying, booking), not just inbound
reception. Outbound dials continuously, so pricing must **protect minutes**.

**Cost reality:** all-in ~**$0.09–0.15/min** (telephony + STT + LLM + TTS). An agent running ~6h/day
≈ **$900–1,650/mo raw cost per agent** — so a flat low price loses money. The model defends margin:

| Component | Amount | Purpose |
|---|---|---|
| Setup / forge fee | **$2,500** (–$3,500 complex) | build agent, scripts, objection-handling, CRM + dialer integration |
| Base per agent / mo | **$699** (incl. ~2,000–2,500 min bucket) | the **margin floor** — base covers expected minute cost |
| Overage | **$0.30/min** beyond bucket | ~2–3× cost; protects against heavy dialing |
| Performance kicker | **$50 / booked appointment** (range $25–$100 by deal value) | the upside; aligns incentives |

- **Anchor (outbound):** a human SDR/BDR is **$50k–$70k/yr base + commission** and dials ~80×/day;
  the agent dials **1,000+/day**. That comparison makes the price trivial.
- **Inbound (Maeve as receptionist)** can still be offered at simpler flat pricing (naturally
  rate-limited, margin-safe); anchor there stays the **$48k/yr receptionist**.
- On `/pricing`, Voice keeps the **★ Recommended** flag (entry rung, best close rate, highest margin).

## 3. AUTOMATIONS — fairly priced · **+ recurring** · **$2,500–$7,500 + care**
Nudged the floor up slightly for ladder coherence; added a recurring line.

| Component | Amount |
|---|---|
| Project build | **$2,500 – $7,500** (one-time) |
| **Forge Care retainer** | **$500 – $1,500/mo** (monitoring, tweaks, new flows) |

- **Anchor:** by-hand = hours/week lost; market project $5–15k, retainer $1–3.5k/mo → we're accessible.
- The easy **second transaction** after Voice/Web; the retainer is the real long-term value.

## 4. WEB — loss leader (still clears margin) · **$1,499 hook + Forge Care annuity**
Web's job: win the first transaction, prove $50k-tier capability, **upsell into Voice + Software.**
The build barely breaks even; **the care plan + the funnel are the business.**

| Tier | Price | Notes |
|---|---|---|
| Launch | **$1,499** | the hook — cinematic 3D via the **configured forge-world engine** (~8–12 hrs), 7-day |
| **Full Cinematic** | **$4,999** | the "Most Forged" middle — heavier engine config + bespoke beats |
| Custom | **$9,999+** | **bespoke avatar-level 3D world** — scales to $15–25k+ (genuine studio-tier work; this is where the 3D caliber is monetized) |
| **Forge Care plan** | **$49–$99/mo** | hosting · SSL · security/WAF · monitoring · monthly edits — **70–95% margin, recurring** |

- **Anchor:** premium cinematic studios **$50k+**; we deliver studio-grade at a charm-priced hook.

---

## 5. WEB COST MODEL & THE REUSABLE INFRASTRUCTURE ("the connector")

### The protection connector — build ONCE, stamp across every client
- **Cloudflare = the connector.** One account → each client domain = a "zone" → apply a saved
  **security template**: SSL **Full (Strict)**, WAF managed rules, Bot Fight Mode, rate limiting,
  page rules. **Free tier already covers SSL + CDN + basic DDoS at $0/client**; **Pro ($25/mo/zone)**
  adds real WAF + bot protection — reserve it for high-value clients.
- **Hosting:** **Cloudflare Pages free tier** hosts unlimited static client sites at **$0**, ideal
  for stamping. (Vercel Pro is **$20/mo for the whole org**, one seat / many projects — a *fixed*
  cost, not per-client.)
- **The reusable forge-world 3D ENGINE** (the avatar/cinematic real-time graphics we're building) →
  new client site stood up by **configuring the engine, not rebuilding it**. This is the moat *and*
  the margin: bespoke avatar-level 3D from scratch is 100+ hrs/site — impossible as a loss leader.
  Reused via config it's ~8–12 hrs/site, so even the $1,499 hook ships cinematic 3D profitably.

### SSL is $0 — charge for it as value, not cost
SSL auto-provisions (Let's Encrypt / Cloudflare / Vercel). It costs nothing per client; it's a
**selling point on the Forge Care plan**, not a COGS line.

### Per-client MONTHLY marginal cost (smart stack)
| Item | Marginal cost |
|---|---|
| Hosting (CF Pages) | $0 |
| SSL | $0 |
| DDoS / CDN / protection (CF free) | $0 (or $25 if Pro/WAF) |
| Domain (amortized) | ~$1.50/mo |
| Email / forms (Resend / CF, shared) | ~$1–2/mo |
| Analytics + uptime (shared) | ~$1/mo |
| **Total per client** | **~$3–30/mo** → Forge Care at $49–99 = 70–95% margin |

### Fixed overhead (yours, spread across all clients — NOT per-client)
- Claude Code subscription **~$100–200/mo** (build tooling)
- Vercel Pro **$20/mo** (if used)
- Resend / Plausible base **~$30/mo**
- → **~$150–250/mo total fixed**; the more clients on care plans, the more it disappears.

### Your 3D / real-time-graphics time (NOT 2D — this is technical-artist work)
The deliverable is **next-level real-time 3D** — avatar-and-above, benchmarked against **gaming &
cinematic graphics sites** (Active Theory · Lusion · Resn · Unseen Studio caliber; Unreal-cinematic
real-time), not "web design." That labor is worth far more than 2D mockup work.
- 2025–2026 rates for this discipline: 3D generalist/motion **$75–150/hr** · senior 3D / technical
  artist **$150–250/hr** · specialist real-time WebGL / shader / creative-tech (award-studio
  caliber) **$200–400/hr**. Studios shipping this bill *sites* at **$50k–$300k+**.
- **Cost yourself internally at $150–200/hr**; the market for this caliber bills **$200–400/hr**
  equivalent. (This is also why **Software $15–50k and Web Custom $9,999+ are still under-market** —
  you're delivering studio-tier 3D.)
- **Margin protection = the reusable 3D engine, not cheaper labor.** Bespoke avatar-level 3D from
  scratch = 100+ hrs → a $1,499 loss leader is impossible. Configured from the forge-world engine =
  ~8–12 hrs → $1,499 nets a healthy effective rate. **The engine is the moat:** competitors can't
  match cinematic 3D at $1,499 because they don't have it. Track hours against every fixed-scope
  build; if a tier creeps past its hour budget, it's a config gap in the engine, not a pricing miss.

---

## 6. THE LADDER AT A GLANCE
| Line | Entry | Range / model | Recurring | Role |
|---|---|---|---|---|
| **Software** | $15,000 | $15k–$50k, 25% deposit | — | flagship |
| **Voice (outbound)** | $699/mo/agent +$2,500 setup | base + $0.30/min overage + $50/appt | ✅ base | ★ profit center |
| **Automations** | $2,500 | $2,500–$7,500 + $500–1,500/mo | ✅ care | fair, easy 2nd sale |
| **Web** | $1,499 | $1,499 / $4,999 / $9,999+ | ✅ $49–99/mo care | loss-leader front door |

**Where each number appears on the site:** see `DESIGN-BRIEF.md` §6 (home = anchor-the-problem +
vague tease only; full reveal on `/pricing` (tabbed, Software-first, Voice ★Recommended) + service
pages; never on Home hero / About / Work).

## 7. STILL OPEN
- Voice **base/bucket exact tuning** once real per-minute cost is measured in production.
- Performance-kicker $/appointment by **industry/deal-size** band.
- Whether to publish the **Forge Care** plans openly or quote them at handoff.
