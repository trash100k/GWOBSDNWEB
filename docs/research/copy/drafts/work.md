# /work — THE PROOF PAGE · copy draft

> Owner: `src/pages/Work.jsx` (page-specific copy only). Status: rewrite/build.
> Brief: the #1 missing conversion lever — **social proof + specificity + authority, fired at once.**
> Guardrail: zero fabricated clients, names, logos, or metrics. The only first-hand proof
> GAELWORX has is its OWN platforms (YardWorx, RepairWorx, SalesWorx, AgentWorx) — "we built and
> RUN these." Any client-result slot ships as a **clearly-marked placeholder** so a real number
> drops in later. The honesty is the flex.

---

## 1 · LEVERS USED, AND WHERE

| Lever (from research) | Where it fires on /work |
|---|---|
| **Authority — demonstrate, don't claim** (04 Cialdini #4) | Own-platform mini case studies. We don't cite a study; we ship and run four. Proof of competence the buyer can't argue with. |
| **Social proof + similarity** (04 Cialdini #3) | The platforms are built for the trades the buyer is in — "the trades we came up in." Proof from *people like the reader* multiplies. |
| **Specificity-as-proof** (04 amplifier; Hopkins) | Every platform card lands a concrete Problem → Mechanism → Result. Real internal numbers (sourced + labelled), never platitudes. Honest placeholders where a client metric belongs. |
| **The shared Enemy / contrast** (04 amplifier; 03 challenger) | "Pilots that rot in phase two" vs. shipped systems that run the work. The enemy is AI theater + the half-built pilot — never a competitor. |
| **Future pacing** (04/05 amplifier) | "This is what we'll build for you." Each platform = a same-shaped story; the visitor lives in the after. |
| **Loss aversion / cost-of-inaction** (04/05) | The enemy frame quantifies the bleed of doing nothing (the rotting pilot, the manual grind still running). |
| **Risk reversal / de-risk** (05 ladder) | "How we work" section: structured discovery → fixed scope, fixed price → live in weeks. Carries project risk, not just dollars. |
| **Unity / the Clan** (04 Cialdini #7) | "Same forge. Same caliber." First-person plural; the buyer is enlisted, not pitched. |
| **Honesty as authority** (04 Part 4; 06 §3) | The placeholder line is stated openly: "Placeholders today. Live, client-verified metrics drop into these exact slots." A studio confident enough to show the empty slot. |
| **Attention Ratio → 1:1 "Point the Sword"** (06 §1d) | One terminal CTA ("Start the Forge" → /contact). Internal service links are low-weight, in-body, not competing buttons. |
| **Aesthetic congruence** (06 §1b) | Copy assumes the brutalist slab/8px-shadow card system already in Work.jsx — the craft IS the proof. Copy stays tight, no fluff, no passive voice. |

**Truth guardrail honored:** No invented client names, logos, or testimonials. Platform metrics are
labelled **"Internal benchmarks from the forge's own operations."** Client case-study results are
**explicit placeholders** (`__%`, `__ days`, `[client result — to confirm]`) with a stated honesty line.

---

## 2 · PROPOSED STRUCTURE + REWRITTEN COPY (mapped to `pages/Work.jsx`)

The existing file already has the right skeleton (`PageShell` hero → PLATFORMS → PROCESS → STUDIES →
`PageShell` CTA). This draft keeps that structure and rewrites the strings to sharpen the proof,
fix the platform cards into true **Problem → Mechanism → Result** mini case studies, harden the
enemy/contrast and future-pace lines, and keep every client metric an honest placeholder.

---

### A · HERO — `PageShell` props (Work.jsx lines 88–92)

**kicker:**
> The Proof

**title** (plain flame, not ignited — H1 rule):
> We Build What We Sell

**lede** (BrandText auto-emphasizes brand terms):
> We didn't read the case study — we built the company in it. YardWorx, RepairWorx, SalesWorx, and AgentWorx are ours: shipped, in production, running real work every day. That's the proof. Not a logo wall we rented — four platforms we forged and still run. This is the caliber we build for you.

*(Lever: authority by demonstration + unity. The hero states the whole thesis in two breaths:
the proof is owned, not borrowed. "Build what we sell" beats the soft "build what we know" — it's a
direct claim the cards then back.)*

---

### B · SECTION 1 — THE FORGE'S OWN PLATFORMS (first-hand proof)
`Section` eyebrow/title + intro + PLATFORMS cards (Work.jsx lines 96–124)

**eyebrow:**
> The Forge's Own

**title:**
> Four platforms. Already in production.

**intro `<p className="pg-work-intro">`** (BrandText):
> Most studios show you someone else's results and ask you to trust the screenshot. We hand you ours. YardWorx, RepairWorx, SalesWorx, and AgentWorx run live, in the trades we came up in — built, owned, and operated by GAELWORX. Same forge. Same fire. Same caliber we build for you.

**Each platform card now reads as a Problem → Mechanism → Result mini case study.** The current
`PLATFORMS` array has `{name, what, metric, metricLabel}`. Proposed: extend each to
`{name, link, problem, mechanism, metric, metricLabel}` so the card carries the full shape, and link
the name to its branch's service page. The `tag` stays "Built & Run by GAELWORX."

> **Card tag (all four):** Built & Run by GAELWORX

**PLATFORMS array — rewritten:**

```
const PLATFORMS = [
  {
    name: 'YardWorx',
    link: '/software',                 // custom software branch
    problem: 'Landscape & outdoor crews ran the day on whiteboards and group texts — dispatch guessed, paperwork piled, jobs slipped.',
    mechanism: 'One operations platform: scheduling, crews, and job costing on a single rail. Built on the GAELWORX stack, owned outright.',
    metric: '40%',
    metricLabel: 'less time lost to dispatch & paperwork',
  },
  {
    name: 'RepairWorx',
    link: '/software',                 // custom software branch
    problem: 'Service shops drowned in voicemail and sticky notes — intake, work orders, parts, and customer history scattered across six tools.',
    mechanism: 'Intake, work orders, parts, and full customer history on one system — every job accountable from call to close.',
    metric: '2.3×',
    metricLabel: 'more jobs closed per tech, per week',
  },
  {
    name: 'SalesWorx',
    link: '/automations',              // automated quoting/follow-up branch
    problem: 'Leads came in and died waiting — quotes sat for days, follow-up depended on whoever remembered.',
    mechanism: 'A pipeline-and-quoting engine: leads in, quotes out, follow-up that never drops a thread — automated end to end.',
    metric: '31%',
    metricLabel: 'lift in quote-to-close rate',
  },
  {
    name: 'AgentWorx',
    link: '/voice',                    // voice agents / Maeve branch
    problem: 'Every missed call after hours was a missed job — and a receptionist who clocks out costs $48k a year.',
    mechanism: 'The control layer for Maeve and the voice + automation agents — every call answered, every task and handoff accountable.',
    metric: '24/7',
    metricLabel: 'coverage, zero added headcount',
  },
]
```

**Suggested card render** (Problem → Mechanism → Result visible per card):
- `__tag`: "Built & Run by GAELWORX"
- `__name`: `<Ignite text={p.name} />` wrapped in `<Link to={p.link}>` (low-weight in-body link — keeps Attention Ratio 1:1; the only loud CTA stays the terminal sword)
- Problem row (dt "Problem") → `p.problem`
- Mechanism row (dt "What we built") → `p.mechanism` via `<BrandText>` (ignites "Maeve" / brand terms)
- Result row → `p.metric` + `p.metricLabel`

**Section foot `<p className="pg-work-foot">`:**
> Internal benchmarks from the forge's own operations — our shops, our numbers, measured live. Yours get measured the same way, and they go on this page.

*(Levers: specificity-as-proof, similarity, future pace. The foot keeps the numbers HONEST — labelled
internal, not implied-client — which is itself an authority signal. Each name links to the branch that
builds the same thing → "this is what we'll build for you," wired.)*

---

### C · SECTION 2 — HOW WE WORK (de-risk the buy + the enemy)
`Section` eyebrow/title + lead + PROCESS steps (Work.jsx lines 127–151)

**eyebrow:**
> How We Work

**title:**
> Shipped in weeks. Not pilots that rot.

**lead `<p className="pg-work-lead">`** (the enemy/contrast, stated cold):
> The industry's dirty secret is the pilot that never ships — the proof-of-concept that wins the meeting, then rots in "phase two" while you keep paying and nothing runs. We don't sell pilots. We scope it cold, name the number, build it, and put it live. The platforms above are the receipt.

**PROCESS array — rewritten:**

```
const PROCESS = [
  {
    n: '01',
    head: 'Structured discovery',
    body: 'We map the real bottleneck in a working session — not a sales call. You name the problem; we trace exactly where the hours and the money leak. No discovery-call theater.',
  },
  {
    n: '02',
    head: 'Fixed scope. Fixed price.',
    body: 'You know what ships, what it costs, and what it does before a single line is forged. The number doesn’t move. We carry the project risk — that’s the point.',
  },
  {
    n: '03',
    head: 'Live in weeks — then it earns',
    body: 'No phase two to rot in. We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, and hours handed back to you.',
  },
]
```

*(Levers: enemy/contrast as the spine; risk reversal — fixed scope, fixed price, "we carry the
project risk" (05 ladder rung 5); cost-of-inaction in the "keep paying and nothing runs" line.
Clean future pace in step 03: the after-state is concrete and sensory — jobs booked, calls answered.)*

---

### D · SECTION 3 — CLIENT RESULTS (honest placeholder slots)
`Section` eyebrow/title + lead + STUDIES cards (Work.jsx lines 154–200)

**eyebrow:**
> Client Results

**title:**
> Your numbers go here. Earned, not invented.

**lead `<p className="pg-work-lead">`** — make the honesty the flex:
> We won't show you a metric we didn't earn. These slots are built and waiting — same Problem → Build → Result shape as the platforms above — and they fill with real, client-verified numbers as the work ships. No stock photos. No borrowed logos. No "results may vary." When yours land, they land here, with your name on them.

**STUDIES array — rewritten (placeholders kept explicit):**

```
const STUDIES = [
  {
    sector: 'Field Service',
    problem: 'Missed calls bled into missed jobs; the front desk drowned in voicemail.',
    build: 'A managed Maeve voice agent on the GAELWORX stack, wired straight to the booking calendar.',
    result: '[__%]',
    resultLabel: 'of after-hours calls captured & booked — to confirm',
  },
  {
    sector: 'Trades & Repair',
    problem: 'Quotes sat for days; follow-up depended on whoever remembered.',
    build: 'An automated quote-and-chase workflow on unified, owned job data.',
    result: '[__ days]',
    resultLabel: 'cut from quote-to-decision time — to confirm',
  },
  {
    sector: 'Multi-location',
    problem: 'Six disconnected apps, no single source of truth, no command view.',
    build: 'A custom platform consolidating ops onto one rail — your data, owned outright.',
    result: '[__ hrs]',
    resultLabel: 'handed back to the owner each week — to confirm',
  },
]
```

> **Card badge `__soon` (all three):** In the forge

**Section foot `<p className="pg-work-foot">`:**
> Placeholders today — and we're telling you so. The moment a build ships and the client signs off on the number, it drops into these exact slots. That's the difference between proof and a screenshot you can't verify.

*(Levers: honesty-as-authority — openly flagging the placeholder is the trust flex on a high-ticket
sale where one caught fake torches the deal (04 Part 4). Zeigarnik/open-loop — the empty slots
create a "watch this fill" tension. Specificity even in the placeholder: the LABELS are concrete and
same-trade, so the buyer can picture their own number landing. Truth guardrail: every result string is
bracketed `[__ … — to confirm]` so no number can ship by accident.)*

---

### E · CTA — `PageShell` built-in finale (Work.jsx, `cta` default true)

The shell already renders the terminal CTA: H2 "Start the Forge", the `COPY.finale.closer` line,
the `<Link to="/contact">Start the Forge</Link>` button, and the availability tag. **Keep it as-is** —
single sword, Attention Ratio 1:1. The page's own sections deliberately use low-weight in-body links
(platform names → service pages) so nothing competes with this button.

**Confirm the terminal CTA reads (from shell):**
> **Start the Forge**
> We keep up so you don't have to. We take care of the battlefield.
> [ Start the Forge ] → /contact
> Available · Continental US · 7 Days

*(Lever: "Point the Sword" — one goal, one click, terminal position. Future pace closes the loop:
the proof page ends by pointing the buyer at the build.)*

---

## 3 · INTERNAL LINKS (wired, low-weight)

- **YardWorx** card → `/software`
- **RepairWorx** card → `/software`
- **SalesWorx** card → `/automations`
- **AgentWorx** card → `/voice`
- Terminal CTA → `/contact` (already wired in `PageShell`)

These are in-body text links, not buttons, so Attention Ratio stays 1:1 toward the sword.

---

## 4 · GUARDRAIL CHECKLIST (every line passes)

- [x] **No fabricated client names / logos / testimonials.** Only GAELWORX's own platforms as proof.
- [x] **Platform metrics labelled internal** ("the forge's own operations") — true, sourced, not implied-client.
- [x] **Every client result is a bracketed placeholder** (`[__% … — to confirm]`) — impossible to ship a fake number by accident.
- [x] **Honesty stated openly** — the placeholder line is a flex, not an apology.
- [x] **Brand terms exact + ignited correctly** — YardWorx, RepairWorx, SalesWorx, AgentWorx via `<Ignite>` (display A+E) on card names; Maeve / brand terms via `<BrandText>` in body (no lowercase ransom-note). GAELWORX exact.
- [x] **Clan voice** — aggressive, direct commands, zero passive voice, zero fluff.
- [x] **Enemy = the rotting pilot / borrowed proof**, never a named competitor.
- [x] **Future pace** — "this is what we'll build for you," wired via per-platform service links.
- [x] **Ends with the sword** — "Start the Forge" → /contact, Attention Ratio 1:1.
```
