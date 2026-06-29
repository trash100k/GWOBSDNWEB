# GAELWORX — Research: Lead Capture, Stack & Nurture (Phase 2)

> Feeds Phase 2 (wire the Contact form to a real backend + decide the lead stack —
> "Decision C" in the pricing brief). Ties to the buying-journey science: the
> purchase is a ~6-month, ~60-touchpoint, mostly-self-directed journey — so capture
> must be frictionless and nurture must carry the long middle.

## 1. The form — science (the Contact page is built; tune it to this)
- **Fewer fields win, hard.** 3 fields ≈ **25%** conversion; 5 → **20%**; 7 → **12%**.
  **Each added field ≈ −4.1%.** Abandonment hits **67.8%** above 7 fields; **81% of
  users abandon** a form once started. Cutting 7→3 fields *doubled* completion.
- **Multi-step beats single-step by ~86%** (with a progress bar) at the *same* field
  count — it cuts cognitive load and builds momentum. Splitting fields across 2–3
  steps lifts completion ~14–21%. Only ~40% of marketers use multi-step.
- **Benchmark:** B2B contact-form conversion is ~1–3% typical, **5% good, 8% excellent**.

> **GAELWORX action:** convert the Contact form to **2 short steps with a progress
> bar**, ~4–5 effective fields total:
> - **Step 1 — "What do you need":** service (Software/Voice/Automations/Web/Not sure)
>   + the bottleneck (textarea). High-intent, low-friction first.
> - **Step 2 — "Where to reach you":** name, work email, business (phone optional).
> Keeps the premium feel, qualifies the lead, and converts materially better than the
> current single 6-field form.

## 2. The stack — Supabase + Attio (Decision C)
Comparing the connectors available this session:
- **Supabase** — not a CRM; it's the **backend**: a Postgres `leads` table + an **edge
  function** as the form's POST endpoint (validate → store → fan out). Free tier ample.
- **Attio** — the **CRM/pipeline**. Flexible relational model, agency-friendly, free up
  to 3 users / $29-user Plus. "Most B2B teams start on Attio, graduate to HubSpot at
  $5–15M ARR." Right size for GAELWORX now; shipped Workflows + AI Assistant in 2026.
- **HubSpot** — all-in-one (marketing automation + CRM + email in one), 205k companies,
  best for marketing-led SMBs — but heavier/pricier than GAELWORX needs today.
- **Gmail / AgentMail** — the instant **notification + reply** channel.
- **n8n** — orchestration for the **nurture** sequence + behavior triggers.

> **Recommended architecture (buildable with these connectors):**
> 1. Contact form → **POST to a Supabase edge function**.
> 2. Edge function: validate → insert into `leads` (Supabase) → **upsert to Attio**
>    (create person + deal in a "Forge Intake" pipeline) → **email notification**
>    (Gmail/AgentMail) to the team + an instant branded auto-reply to the lead.
> 3. **n8n** watches Attio stage / Supabase row → runs the nurture (below).
> This keeps the lead in a real DB you own (Supabase) AND a workable pipeline (Attio),
> with zero dependence on a heavy all-in-one. Swap the `FORGE_EMAIL` placeholder
> (`forge@gaelworx.com`) for the real intake address.

## 3. The nurture — carry the 6-month middle
- **Length/cadence:** 8–12 emails over **60–90 days at a 5–7 day cadence**; high-ticket
  can run 10–13 but **don't pad** — >12 emails spikes unsubscribes 2–3×. Sales-stage
  (MQL→SQL) sequences tighten to 6–9 emails over 21–35 days at 3–5 day cadence.
- **Behavior-triggered > calendar.** If a lead hits `/pricing` in week 3, send
  consideration content *now* — don't wait for week 6. (n8n can fire on the signal.)
- **Multi-channel** (email **+ LinkedIn**) outperforms email-only by **40–60%** on
  meeting acceptance.
- **Mature nurture = 50% more sales-ready leads at 33% lower CPA** vs. handing leads
  straight to sales.
- **Measure reply rate, not opens.** Apple MPP inflates reported opens 12–18%; reply
  rate is the clean signal (correlates with MQL→SQL at r≈0.62). Leads still opening at
  email 7–8 convert **2–3×** earlier clickers — they self-selected; keep going.
- **Content arc** (maps to the buying jobs): educate (decades-of-first-hand-knowledge,
  the AI ethic) → prove (case studies, the forge's own platforms, ROI) → de-risk
  (fixed scope/price, ownership, the deposit) → invite (a scoped quote / the entry rung).

## 4. Phase-2 build order (when we get the go)
1. Supabase: `leads` table + edge function endpoint (capture + fan-out).
2. Contact form → 2-step + progress; POST to the endpoint; keep the success state.
3. Attio: "Forge Intake" pipeline + upsert from the edge function.
4. Gmail/AgentMail: team notification + instant branded auto-reply.
5. n8n: behavior-triggered nurture (email + LinkedIn touch), reply-rate dashboard.
6. Confirm the real intake email; add a tel: + booking link as alternates.

## Sources
- Foundry CRO — [Form Conversion Benchmarks 2026 (fields & CPL)](https://foundrycro.com/blog/form-conversion-rate-benchmarks-2026/)
- Brixon — [Lead Forms in B2B: data depth vs conversion](https://brixongroup.com/en/lead-forms-in-b2b-the-perfect-balancing-act-between-data-depth-and-conversion-rate)
- IvyForms — [Multi-Step vs Single-Step Forms](https://ivyforms.com/blog/multi-step-forms-single-step-forms/)
- Zuko — [Single-page or multi-step form](https://www.zuko.io/blog/single-page-or-multi-step-form)
- Redevolution — [Good B2B contact form conversion rate](https://www.redevolution.com/blog/whats-a-good-b2b-contact-form-conversion-rate)
- Ziellab — [Attio vs HubSpot: honest 2026 comparison](https://ziellab.com/post/hubspot-vs-attio-the-honest-2026-comparison-for-revops-growth)
- SaaStr — [Which CRM in 2026/2027](https://www.saastr.com/which-crm-should-you-use-in-2026-2027-follow-the-agents/)
- Supabase — [Integrations (Attio/HubSpot/Salesforce)](https://supabase.com/partners/integrations)
- Growthspree — [B2B email nurture benchmarks 2026](https://www.growthspreeofficial.com/blogs/b2b-saas-b2b-email-nurture-benchmarks-2026-open-ctr-reply-conversion-by-sequence)
- LeadsuiteNow — [Email automation & nurturing 2026](https://leadsuitenow.com/blog/email-automation-lead-nurturing-2026)
- Unreal Digital — [Right cadence for B2B nurture](https://www.unrealdigitalgroup.com/blog/whats-the-right-cadence-for-b2b-nurture-emails-and-sequences)
