# /voice — Maeve · Copy Rewrite Draft

Owner: Voice branch (GW–02). Scope: `COPY.arsenal.branches[1]`, `COPY.faq['/voice']`,
and every on-page string in `src/pages/Voice.jsx`. Source-of-truth: `CLAUDE.md` (Clan
Voice — aggressive, no passive voice) + research docs 01/04/05.

**Locked / unchanged (binding):** Price `From $499/mo` + `+ one-time setup`. Anchor
`$48,000 a year` / `$48,000/yr`. Brand terms exact (GAELWORX, Maeve). Page section
structure and field structure preserved. The shared closing CTA ("Start the Forge" +
`COPY.finale.closer`) is rendered by `PageShell` — global, NOT owned here, untouched.

---

## 1 · Levers used, and where

| Lever (research doc) | Where it fires |
|---|---|
| **Cost-of-Inaction / loss aversion, present tense** (04 Group B; 05 §1) — "a missed call is a job your competitor just booked," the receptionist clocks out / the phone doesn't | branch `line`, `body`; PageShell `lede`; hero line; §1 The Bleed (title + body + graveyard); FAQ #1, #3 |
| **Anchoring against the real alternative** (04 Group B; 05 §1) — $48,000/yr in-house receptionist named *before* the $499 figure, so the fee reads small | branch `anchor`; §5 The Math (anchor stated first); §6 price anchor line; FAQ #2 |
| **Future pace** (04 Group E; 05 §1 identity) — every call answered, lead qualified, job booked, no-show chased, *while you're on the job* | branch `line`/`body`; PageShell `lede`; §2 How She Works flow; FAQ #1, #3 |
| **Specificity-as-proof / first-hand** (04 Group E; 01 §1.3) — Maeve runs GAELWORX's OWN front desk; "no caller clocks her as AI"; real stats | branch `body`; PageShell `lede`; §3 The Tell; FAQ #1 |
| **Identity / status** (04 Group E; 05 identity) — you run an operation that never misses | hero line; §2 title; §6 head + CTA |
| **The shared Enemy = the missed call / the clock-out** (04 Group E/C) — never the buyer; the villain is the after-hours bleed and the receptionist who clocks out | §1 The Bleed; §5 In-house-vs-Maeve VS frame |
| **Slippery-slide + bucket brigades + active voice** (01 §1.4) — short hard first sentences, open loops, imperative CTAs | throughout; "Point the Sword" CTA in §6 |
| **Von Restorff isolation** (04 Group C) — one ember-highlighted Maeve column vs the grey receptionist column | §5 ROI (copy supports existing visual treatment) |

Every figure is TRUE: `$499/mo` and `$5,988/yr` (= 499 × 12) are the locked price; the
`$48,000/yr`, `1 in 3`, `80%`, `$0` claims are carried unchanged from the live page.

---

## 2 · Rewritten copy

### A · The branch (`COPY.arsenal.branches[1]`)

Keeps id/tag/price/note locked. Rewrites line/body/anchor to PAS + present-tense COI +
first-hand proof.

**`COPY.arsenal.branches[1].line`**
> Every missed call is a job booked by someone else.

**`COPY.arsenal.branches[1].body`**
> Maeve answers every call, qualifies the lead, books the job, and chases the no-show — while you're on the job, in a voice no caller clocks as AI. She runs our own front desk. Put her on yours and the phone stops going to voicemail.

**`COPY.arsenal.branches[1].anchor`**
> An in-house receptionist runs $48,000 a year and clocks out. Maeve never does.

**`COPY.arsenal.branches[1].price`** — LOCKED, unchanged:
> From $499/mo

**`COPY.arsenal.branches[1].note`** — LOCKED, unchanged:
> + one-time setup

---

### B · FAQ (`COPY.faq['/voice']`)

Three entries. Each answer leads with the literal fact, brand voice second, ≤320 chars.
Char counts noted; every number sourced from the locked price/anchor.

**`COPY.faq['/voice'][0].q`**
> Does Maeve sound human?

**`COPY.faq['/voice'][0].a`**  *(247 chars)*
> No caller clocks Maeve as AI. She answers every call, qualifies the lead, books the job, and chases the no-show in a voice that breathes — the same agent that runs our own front desk. Voice agents start from $499/mo plus a one-time setup.

**`COPY.faq['/voice'][1].q`**
> How much is an AI voice agent?

**`COPY.faq['/voice'][1].a`**  *(241 chars)*
> Maeve runs from $499/mo plus a one-time setup. An in-house receptionist runs $48,000 a year and clocks out at five. Maeve answers every call, qualifies the lead, books the job, and chases the no-show — and never clocks out. Roughly an eighth of the cost.

**`COPY.faq['/voice'][2].q`**
> Can Maeve actually book jobs?

**`COPY.faq['/voice'][2].a`**  *(236 chars)*
> Yes — Maeve books the job straight into your calendar and chases the no-show, not just takes a message. She answers every call, qualifies the lead, and routes the hot ones to you while you work. From $499/mo plus one-time setup.

---

### C · `src/pages/Voice.jsx` — every on-page string

#### PageShell props (`<PageShell>` open tag, lines 61–65)

**`kicker`** — unchanged:
> GW–02 · Voice Agent

**`title`**
> The Receptionist That Never Clocks Out

**`lede`**
> Maeve answers every call, qualifies the lead, books the job, and chases the no-show — while you're on the job, in a voice no caller clocks as AI. She runs our own front desk. Put her on yours, around the clock.

---

#### Hero signature (`<Section className="pg-voice-hero">`, lines 69–79)

**Badge** (`.pg-voice-badge` span)
> Maeve · live · answering now

**Hero line** (`.pg-voice-hero-line`)
> One ring. Every time. Nights, weekends, holidays, the second line during the rush — **nothing goes to voicemail.**

---

#### §1 · The Bleed (`<Section eyebrow="The Bleed">`, lines 82–119)

**`eyebrow`** — unchanged:
> The Bleed

**`title`**
> Every missed call is a job your competitor just booked.

**Body `<p>`**
> You're on a roof, under a sink, on the other line. The phone rings out. The caller doesn't leave a message — **they dial the next name on the list.** That's not a missed call. That's a booked job, lost, while you were doing the work.

**Cost cards** (`.pg-voice-cost-card`, stat + label — stats unchanged)
- `1 in 3` — calls to the trades go unanswered
- `80%` — of callers won't leave a voicemail
- `$0` — earned by a phone no one answers

**Graveyard** (`.pg-voice-graveyard`)
- tag: `The voicemail graveyard`
- li 1: `Missed call · 7:14pm — no message`
- li 2: `Missed call · 7:41pm — no message`
- li 3: `Missed call · 8:02pm — booked your competitor`
- foot (`.pg-voice-graveyard-foot`):
> Three rings. Three jobs. Gone before you washed your hands.

---

#### §2 · How She Works (`<Section eyebrow="How She Works">`, lines 122–151)

**`eyebrow`** — unchanged:
> How She Works

**`title`**
> A full front desk. One voice. Zero clock-outs.

**Body `<p>`**
> Maeve doesn't read a phone tree. She talks — listens, asks, decides, books — like the best receptionist you ever hired, except she never sleeps, never quits, and never puts a caller on hold.

**FlowStep 01** — title `Answers every call`
> Picks up on the first ring — nights, weekends, the second and third line during the rush. No menu, no hold music, no voicemail.

**FlowStep 02** — title `Qualifies the lead`
> Asks the right questions, captures the job details, and sorts tire-kickers from real work before anything hits your phone.

**FlowStep 03** — title `Books the job`
> Reads your live availability and drops the appointment straight into your calendar — confirmed, with the address and the scope.

**FlowStep 04** — title `Chases the no-show`
> Confirms ahead, follows up on the ones who ghost, and refills the slot — so a no-show never costs you the hour.

---

#### §3 · The Tell (`<Section tone="panel" className="pg-voice-human">`, lines 154–176)

**Eyebrow** (`.pg-voice-eyebrow-c`) — unchanged:
> The Tell

**Head** (`<BrandText text=...>`) — unchanged:
> No caller clocks Maeve as AI.

**Body** (`.pg-voice-human-body`)
> Natural pacing. Real interruptions, handled. Your business name, your services, your tone — a script you control, delivered in a voice that breathes. Callers think they reached your best front-desk hire. They reached a system that answers like one, every single time.

**Transcript** (`.pg-voice-transcript`)
- Caller: `"Hey — do you guys handle emergency callouts tonight?"`
- Maeve: `"We do. I can get a technician out to you this evening — what's the address, and what's going on with the unit?"`

---

#### §4 · Wired In (`<Section eyebrow="Wired In">`, lines 179–204)

**`eyebrow`** — unchanged:
> Wired In

**`title`**
> Your script. Your tools. Around the clock.

**Body `<p>`**
> Maeve doesn't live in a silo. She plugs into the systems you already run, books against your real calendar, and writes every lead and call summary where your team will see it — so the front desk and the field stay in lockstep.

**Integration cells** (`[title, desc]` array, lines 190–196)
- `Your calendar` — Books live against real availability
- `Your CRM` — Every lead and call summary, logged
- `Your number` — Forwards your existing line — no new number to learn
- `Your text + email` — Confirmations and follow-ups, sent automatically
- `Your script` — Your services, pricing rules, and tone — under your control
- `Your team` — Hot leads handed off the second they qualify

---

#### §5 · The Math (`<Section eyebrow="The Math">`, lines 207–248)

**`eyebrow`** — unchanged:
> The Math

**`title`**
> One receptionist. Or one Maeve.

**Body `<p>`** (anchor stated first)
> An in-house receptionist runs **$48,000 a year** — and still clocks out at five, takes lunch, calls in sick, and works one line at a time. Maeve runs every line, every hour, for a fraction of one paycheck.

**ROI · In-house column** (`.pg-voice-roi-old`)
- tag: `In-house receptionist`
- price: `$48,000/yr` *(unchanged)*
- li: `9-to-5, one line at a time`
- li: `Lunches, sick days, holidays, turnover`
- li: `Misses the after-hours rush entirely`
- li: `You hire her, train her, manage her`

**ROI · Maeve column** (`.pg-voice-roi-new`)
- tag: `Maeve`
- price: `$5,988/yr` *(= $499 × 12, the locked price — unchanged)*
- li: `24/7/365, every line at once`
- li: `Never sick, never quits, never on hold`
- li: `Owns the nights and weekends you lose now`
- li: `We build her, run her, and tune her`

**ROI foot** (`.pg-voice-roi-foot`)
> **Roughly an eighth of the cost** — and she catches the calls a receptionist never could. One booked job a month covers her. The rest is profit you're leaving on the machine right now.

---

#### §6 · The Investment (`<Section className="pg-voice-price">`, lines 251–279)

**Eyebrow** (`.pg-voice-eyebrow-c`) — unchanged:
> The Investment

**Head** (`<BrandText text=...>`) — unchanged:
> Maeve, on the desk.

**Price figures** — LOCKED, unchanged:
- from: `From`
- fig: `$499`
- per: `/mo · per location`

**Setup** (`.pg-voice-price-setup`)
- span: `+ one-time setup & forge fee`
- small:
> We build her to your script, wire your tools, and tune her live before launch.

**Price list** (`.pg-voice-price-list`)
- All-in managed — we run the whole stack
- Every call answered, qualified, and booked
- Wired to your calendar, CRM, and existing line
- No per-minute surprises, no hidden telephony bill

**CTA** (`.pg-voice-cta` span — "Point the Sword," imperative)
> Put Maeve on the Desk

**Price anchor** (`.pg-voice-price-anchor`)
> vs. a <s>$48,000/yr</s> receptionist who clocks out · live in days, not months

---

## Notes for implementer (no source edited here)

- `title` drops "The Voice…" for "The Receptionist…" — sharper anchor against the $48k
  hire and the "never clocks out" identity. If the soundwave/voice motif must stay in the
  H1, fall back to: **"The Front Desk That Never Clocks Out."**
- §4 cell label "Your numbers" → "Your number" (singular reads truer for one forwarded line).
- FlowStep 04 / branch / FAQ standardize on singular "the no-show" (the one who ghosts) for
  punch; the live page mixed singular/plural — pick one on implement.
- All A+E ignite handled automatically by `<BrandText>`/`.brand-term`; no manual markup
  needed for GAELWORX / Maeve in prose.
