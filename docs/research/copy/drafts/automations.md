# /automations — copy rewrite draft

> Owner: senior conversion copywriter. Scope: `COPY.arsenal.branches[2]` (the Automations
> branch), `COPY.faq['/automations']`, and every on-page string in
> `src/pages/Automations.jsx`. Price LOCKED at **From $1,500**. Clan Voice (aggressive,
> no passive voice). Brand terms exact. Every lever TRUE. **DRAFT ONLY — no source edited.**

---

## 1 · Levers used, and where

| Lever (from research) | Where it fires |
|---|---|
| **PAS + Cost-of-Inaction** — loss looms ~2× gain; quantify the status quo first, make doing nothing feel expensive *(04 §B/§5, 05 §1)* | Branch `body`; PageShell `lede`; §1 Busywork Tax (intro, total, "six apps"); §4 Before column; FAQ #2 |
| **Mechanism + Ownership (anti-black-box)** — Schwartz stage 3–4: claims dead, mechanism converts; the rote work runs itself AND hands your data back to own *(01 §2.1, 04 enemy)* | Branch `body`; §2 intro/flows; §3 Your-Data-Unified (the whole section); §4 After column; PROCESS 04; FAQ #1 |
| **ROI — "it runs the work, it pays for itself"** — hours handed back, counted *(05 future-pace; trust rung 04)* | §6 Investment (note); branch `body` close; §3 "Leverage no one else has" |
| **Specificity-as-proof** — "the same automations that run our own shops"; real hour counts (6/5/4/3 → 18) *(04 §E, 01 §1.3)* | Branch `body`; PageShell `lede`; §1 hour rows + total; FAQ #1 |
| **Anchor (loss-frame)** — "by hand, it costs you those hours every week"; struck against the build *(04 anchoring, 05 §2A)* | Branch `anchor` (locked wording); §6 price anchor line; FAQ #2 |
| **Shared Enemy = the manual grind / the black-box tool, never the buyer** *(04 §C/§E)* | §2 "another dashboard to babysit"; §3 "locked inside someone else's tool"; §4 Before/After |
| **Active voice + Brutalist-Snap slippery-slide** — short hard first sentences, direct commands *(01 §1.4)* | Every headline + opening line below |

**Held TRUE / locked:** price `From $1,500` and range `$1,500–$5,000` unchanged · anchor wording
unchanged · proof claim ("run our own shops") unchanged · the 18 hrs/wk math (6+5+4+3) unchanged ·
brand terms exact (none of GAELWORX/Maeve/Worx appear in this page's body, so no ignite needed —
`<BrandText>` renders them plain anyway). FAQ answers re-checked ≤320 chars, fact first.

---

## 2 · Rewritten copy

### A · The branch — `COPY.arsenal.branches[2]`

**`COPY.arsenal.branches[2].line`**
> Workflows that kill the headaches.

*(Keep. Already a clean active-voice outcome line, on-mechanism. No change.)*

**`COPY.arsenal.branches[2].body`**
> Quoting, follow-up, invoicing, reviews — running on their own, and handing your data back to you to own and leverage like no one else can. No black box, no hostage tool. The same automations that run our own shops.

**`COPY.arsenal.branches[2].anchor`** *(LOCKED wording — unchanged)*
> By hand, it costs you those hours every week.

**`COPY.arsenal.branches[2].price`** *(LOCKED — unchanged)*
> From $1,500

*(No `note` field present on this branch — none added.)*

---

### B · FAQ — `COPY.faq['/automations']`

> Each answer leads with the literal fact, brand voice second, ≤320 chars. Numbers sourced from
> the branch price/anchor and the page's hour math so nothing drifts.

**`COPY.faq['/automations'][0].q`**
> How much do workflow automations cost?

**`COPY.faq['/automations'][0].a`**  *(296 chars)*
> Workflow automation starts from $1,500. We put quoting, follow-up, invoicing, and reviews on autopilot — then hand you your data to own and leverage like no one else can. No black box. The same automations that run our own shops. One build pays for itself inside a month.

**`COPY.faq['/automations'][1].q`**
> What can you automate for my business?

**`COPY.faq['/automations'][1].a`**  *(297 chars)*
> Quoting, follow-up, invoicing, and review collection — the rote work that costs you hours every week by hand. It runs on its own, never drops the ball, and hands your data back to you to own. Not locked in someone else's tool. From $1,500. It runs the work, it pays for itself.

*(Two existing Q/A retained — structure unchanged. Q wording kept; A rewritten to lead with the
fact, sharpen the ownership mechanism, and add the ROI close.)*

---

### C · On-page strings — `src/pages/Automations.jsx`

#### PageShell (top of page)

**`kicker`** — unchanged
> GW–03 · Automations

**`title`**
> The Busywork Runs Itself

*(Keep. Mechanism-as-promise, active, brand-aligned with the finale "The busywork runs itself." No change.)*

**`lede`**
> Quoting, follow-up, invoicing, reviews — wired into one flow that never forgets and never drops the ball. It runs the work, and it hands your data back to you to own — not locked in someone else's tool. The same automations that run our own shops, built for yours.

---

#### Section 1 — The Busywork Tax (`eyebrow="The Busywork Tax"`)

**`title`**
> You're paying it every week.

*(Keep — present-tense cost-of-inaction, second person, hard. No change.)*

**intro `<p>`**
> Nobody quoted you for it, but it's the most expensive line on your books: the hours your team burns moving the same numbers between six apps that don't talk. By hand, every week. Add it up.

**`TAX` rows** *(hour counts LOCKED — 6/5/4/3 = 18; copy sharpened, active voice)*

- `TAX[0]` — hrs `6`
  - `label`: Quoting by hand
  - `note`: You retype the same numbers into a doc, then chase the signature.
- `TAX[1]` — hrs `5`
  - `label`: Follow-up that slips
  - `note`: Hot leads go cold because nobody had time to chase them.
- `TAX[2]` — hrs `4`
  - `label`: Invoicing & chasing pay
  - `note`: You build the invoice twice, then hunt down the overdue ones.
- `TAX[3]` — hrs `3`
  - `label`: Begging for reviews
  - `note`: You forget to ask — so the 5-star jobs stay invisible.

**The tab (total block)** — JSX literals
- `pg-auto-tax-total-label`: The tab
- `pg-auto-tax-total-num`: ≈ 18 hrs / week *(unchanged — true math)*
- `pg-auto-tax-total-note`: Two full days, gone to admin. Every single week. By hand, that's the bill.

**Six apps, one mess block**
- `pg-auto-mess-kick`: Six apps. One mess.
- `APPS` chips: Inbox · Spreadsheet · Quote PDF · Calendar · Invoicing · Notes app *(unchanged)*
- `pg-auto-mess-note`:
  > Each one holds a piece of the job. None of them holds the whole thing. You're the glue — and you cost more than all six combined.

---

#### Section 2 — What We Automate (`eyebrow="What We Automate"`)

**`title`**
> Three flows that end the grind.

*(Keep — active, enemy-framed ("the grind"). No change.)*

**intro `<p>`**
> We don't hand you another dashboard to babysit. We wire the work itself so it moves on its own — start to finish, no one re-typing a thing, no one watching it.

**`FLOWS` array**

- `FLOWS[0]` — id `A`
  - `name`: Quote → Invoice
  - `line`: One trail from first touch to paid.
  - `body`: The lead lands, the quote builds itself from your numbers, and the second it's approved it becomes an invoice. Nobody keys the same paperwork in twice. Nobody forgets the follow-through.
  - `steps`: Lead in · Quote out · Approved · Invoiced · Paid *(unchanged)*

- `FLOWS[1]` — id `B`
  - `name`: Follow-up That Fires
  - `line`: No lead goes cold. Ever.
  - `body`: Every quiet estimate gets chased on a schedule. No-shows get a nudge. The deal you'd have forgotten books itself while you're on the truck.
  - `steps`: Sent · Silent · Nudge · Re-engaged · Booked *(unchanged)*

- `FLOWS[2]` — id `C`
  - `name`: Reviews on Autopilot
  - `line`: Every 5-star job, asked for.
  - `body`: The moment a job closes, the request fires to your happiest customers — timed right, worded right — so your reputation compounds and you never lift a finger.
  - `steps`: Job done · Timed ask · Reviewed · Ranked · Found *(unchanged)*

---

#### Section 3 — Your Data, Unified & Owned (`eyebrow="Your Data, Unified"`, `tone="panel"`)

> *The anti-black-box / ownership section — the mechanism that separates us. Lean hardest here.*

**`title`**
> One source of truth — and it's yours.

*(Keep — the ownership promise stated flat. No change.)*

**intro `<p>`**
> Most automations lock your business inside someone else's tool. We do the opposite. Every flow we build feeds one clean ledger of your customers, jobs, and money — and hands it back to you to own outright. Documented. Exportable. Never held hostage.

**SVG label** — `pg-auto-u-tag`
> OWNED *(unchanged)*

**`pg-auto-own` list**
- `<li>`: **One source of truth.** Not scattered across six logins — assembled for you, every time, automatically.
- `<li>`: **You hold the keys.** Full export, full access. Walk away with everything the day you choose to.
- `<li>`: **Leverage no one else can give you.** Your own history, ready to mine — quote faster, follow up smarter, and see exactly what pays.

---

#### Section 4 — Before vs After (`eyebrow="The Shift"`)

**`title`**
> From scramble to system.

*(Keep — clean transformation framing. No change.)*

**Before column** (`pg-auto-vs-before`) — the cost of inaction, present tense
- You retype the quote into three places
- You chase leads when you remember
- You build invoices twice, you get paid late
- Reviews? When you get around to it
- The truth lives only in your head

**After column** (`pg-auto-vs-after`) — the after-self, mechanism + ownership
- The quote builds itself, once
- Every lead gets chased on schedule
- The invoice fires on approval — paid on time
- Reviews ask themselves at the right moment
- The truth lives in a ledger you own

*(Tags "Before" / "After" unchanged.)*

---

#### Section 5 — How It Works (`eyebrow="How It Works"`)

**`title`**
> Wired in days, not a quarter.

*(Keep — speed-as-proof, anti-"phase two." No change.)*

**`PROCESS` array**

- `PROCESS[0]` — n `01`
  - `head`: Map the grind
  - `body`: We trace one job end-to-end and mark every place a human re-types, copies, or chases. The leaks are obvious the second they hit paper.
- `PROCESS[1]` — n `02`
  - `head`: Wire the flow
  - `body`: We connect the tools you already pay for into one trail — no rip-and-replace. It runs in days, not a quarter.
- `PROCESS[2]` — n `03`
  - `head`: Prove it live
  - `body`: It goes live on your real work, runs the busywork, and we watch it for a week. No pilot that rots in "phase two."
- `PROCESS[3]` — n `04`
  - `head`: Hand you the keys
  - `body`: You own the system and the data underneath it — documented, exportable, yours. We don't hold it hostage. Ever.

---

#### Section 6 — Investment (`eyebrow="Investment"`)

**`title`**
> One build pays for itself.

*(Keep — the ROI thesis as the section title. No change.)*

**Anchor line** — rendered from `b.anchor` (`pg-auto-price-x`, struck-through)
> By hand, it costs you those hours every week.  *(LOCKED — unchanged)*

**Price** (`pg-auto-price-from` + `pg-auto-price-num`)
> From **$1,500**  *(LOCKED — unchanged)*

**`pg-auto-price-range`**
> Project or retainer · $1,500–$5,000  *(unchanged — true)*

**`pg-auto-price-note`**
> Win back two days a week and the build pays for itself inside a month. It runs the work, it pays for itself. Fixed scope, fixed price — the forge runs lean, so you don't pay agency rates to systematize what we already systematized.

---

## Notes for the implementer
- Nothing above changes a price, an hour count, or the locked anchor wording — only sharpening,
  active-voice, and the ownership/ROI levers were added.
- No brand proper-noun (GAELWORX, Maeve, *Worx) appears in this page's body or FAQ, so no `<Ignite>`
  / A+E work is required; `<BrandText>` already renders any that exist as plain `.brand-term`.
- FAQ answers verified ≤320 chars (about 296 and 297). Keep them fact-first if edited further.
</content>
</invoke>
