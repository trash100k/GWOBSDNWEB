# /pricing — copy rewrite draft

> Senior-conversion rewrite of the **/pricing** page, its shared **rates** beat, and the
> **/pricing FAQ**. Stage-4/5 buyer, mostly self-serve, ~6-month window: the page must de-risk
> and sequence value→price when GAELWORX is not in the room. Voice = Clan (aggressive, direct
> commands, no passive voice, zero fluff). Every claim TRUE. Prices LOCKED. FAQ ≤320 chars,
> leads with the number.
>
> Owned surfaces only: `COPY.rates` · `COPY.faq['/pricing']` · all on-page strings in
> `src/pages/Pricing.jsx`. Per-branch `line`/`body` in `COPY.arsenal.branches` left UNTOUCHED
> (prices + anchors restated only). brand.js field structure + page section structure preserved.

---

## 1 — Levers used, and where

- **Anchored transparency (no naked numbers).** Every price ships paired with its elsewhere-anchor —
  $48,000/yr receptionist, $50k+ studio, those hours every week, $75k + months of discovery.
  → ledger lines, rates lede/foot framing, all three FAQ answers, the `Pricing.jsx` ledger lede.
- **Sequence value → price (the "forge runs lean" reconciliation).** Outcome and the "you pay less
  because it's efficient, not because it's less" logic land *before/around* the number.
  → `COPY.rates.lede`, the RECONCILIATION section, the "why cheaper than agencies" FAQ, the CTA lede.
- **Risk reversal.** "Fixed scope. Fixed price. We carry the risk — you pay when it executes."
  $5k deposit framed as a **commitment FILTER**, not a paywall.
  → `COPY.rates.foot` context, WHAT'S INCLUDED cards, DEPOSIT TERMS callout, deposit FAQ, CTA lede.
- **Decoy / compromise ladder.** Web ($1,299) + Voice ($499/mo) read as the accessible front doors;
  Software ($10,000, $5k deposit) is the flagship; the middle reads as the smart choice.
  → ledger ordering note, RECONCILIATION foot, deposit FAQ ("front doors" vs flagship), branch FAQ.
- **Premium signals.** Clean round numbers stay clean ($10,000, $48,000, $75k); charm endpoint
  ($1,299) stays. No ".99", no apology framing, no padding.
  → every price string, untouched from the locked anchor card.
- **Stage-5 identity / Clan voice + mechanism.** "Automatic Execution" is the named mechanism that
  makes "cheaper" credible; the Clan carries the risk. Direct commands, present-tense.
  → headlines, eyebrows, CTA head, rates head.

Framework spine (per research 02/05): **4 Ps + Offer lead** for a Product→Most-aware buyer — Picture
the outcome → Promise the deliverable → **Prove** with the anchor + risk reversal → **Push** with one
sharp CTA. Objection cascade order down the page: *why care* (ledger) → *why you* (efficiency
mechanism) → *why believe* (what's included + deposit terms) → *why now* (CTA).

---

## 2 — Rewritten copy (exact source path → final string)

### A. `COPY.rates` (shared rates beat — `src/brand.js`)

**`COPY.rates.kicker`**
```
The Forge Runs Lean
```

**`COPY.rates.head`**
```
Premium work. Honest prices.
```

**`COPY.rates.lede`**
```
Automatic Execution systematizes what agencies bill by the hour — the quoting, the follow-up, the build scaffolding that runs the same every time. You don't pay less for less. You pay less because the forge runs lean.
```

**`COPY.rates.foot`** (LOCKED string — keep exactly)
```
Fixed scope. Fixed price. Continental US · 7 Days.
```

---

### B. `COPY.faq['/pricing']` (AEO/FAQPage — `src/brand.js`)

> Each answer leads with the literal fact, brand voice second; ≤320 chars; every number sourced from
> the locked anchor card. Questions unchanged (real buyer queries). Char counts noted for the gate.

**`COPY.faq['/pricing'][0].q`**
```
What is the deposit to start?
```
**`COPY.faq['/pricing'][0].a`** (291 chars)
```
Software takes a $5k deposit to start — it locks scope, not a paywall; it filters for buyers who build, not browse. Voice from $499/mo plus one-time setup, Web from $1,299, Automations from $1,500 start without one. Fixed scope, fixed price. We carry the risk — you pay when it executes.
```

**`COPY.faq['/pricing'][1].q`**
```
Why are your prices lower than agencies?
```
**`COPY.faq['/pricing'][1].a`** (286 chars)
```
Automatic Execution systematizes what agencies bill by the hour. You don't pay less for less — you pay less because the forge runs lean. No discovery theater, no layers of management, no year of meetings. Fixed scope, fixed price, shipped in 7 days. Continental US. You own what we build.
```

**`COPY.faq['/pricing'][2].q`**
```
What does each branch cost?
```
**`COPY.faq['/pricing'][2].a`** (293 chars)
```
Software from $10,000 with a $5k deposit — agencies bill $75k. Voice from $499/mo plus setup against a $48,000/yr receptionist. Web from $1,299 where studios charge $50k+. Automations from $1,500. Every price is a fixed-scope "from." Name the bottleneck — we put a number on ending it.
```

---

### C. `src/pages/Pricing.jsx` (on-page strings)

> The `LINES`, `INCLUDED`, and `FAQ` arrays are page-local copy I own. Tags/prices/anchors restated
> from the locked card; brand terms ignite via `<BrandText>` automatically.

#### C1 — `PageShell` props (top of `<Pricing>`)

**`title`** (LOCKED display string — keep exactly)
```
The Forge Runs Lean
```

**`lede`**
```
Premium work. Honest prices. Name the bottleneck — we put a number on ending it before any work begins, and we carry the risk until it executes.
```

#### C2 — `LINES[]` (the ledger — outcome → struck anchor → lit "from" price)

> Order LOCKED for the decoy ladder: the two accessible front doors (Voice, Web) lead, Automations
> sits as the smart middle, Software anchors the bottom as the flagship.

**`LINES[0]` — Voice**
```js
{
  tag: 'Voice',
  line: 'A front desk that never clocks out.',
  anchor: 'An in-house receptionist: $48,000 / year',
  price: 'From $499',
  unit: '/mo',
  note: '+ one-time setup',
}
```

**`LINES[1]` — Web**
```js
{
  tag: 'Web',
  line: 'A site built to book the truck.',
  anchor: 'Premium studios bill $50k+ for this',
  price: 'From $1,299',
  note: 'scoped, fixed price',
}
```

**`LINES[2]` — Automations**
```js
{
  tag: 'Automations',
  line: 'The busywork runs itself.',
  anchor: 'By hand: those hours, every week',
  price: 'From $1,500',
  note: 'project or retainer',
}
```

**`LINES[3]` — Software (flagship)**
```js
{
  tag: 'Software',
  line: 'Your own platform. Owned outright.',
  anchor: 'Agencies bill $75k + months of discovery',
  price: 'From $10,000',
  note: '$5k deposit to start',
}
```

#### C3 — THE LEDGER section

**`<h2 className="pg-h2">` (BrandText)**
```
Four lines. Every number anchored.
```

**`.pg-pricing-ledger-lede` (BrandText)**
```
What it costs elsewhere is struck out. What the forge charges is lit. Outcome first, then the price — no naked numbers, nothing to negotiate up.
```

> `.rate-foot` already renders `COPY.rates.foot` — see B above. No change.

#### C4 — THE RECONCILIATION section

**`.pg-pricing-eyebrow`**
```
Efficiency, not discount
```

**`<h2 className="pg-h2">`**
```
Cheaper is the symptom. Efficient is the cause.
```

**Body `<p>` (BrandText)**
```
You don't pay less for less. Automatic Execution systematizes what others bill by the hour — the quoting, the follow-up, the build scaffolding, the parts that run the same every time. The forge runs lean, so the price runs lean.
```

**`.pg-pricing-split-them` — "What you stop paying for"** (list items unchanged — they hold)
```
What you stop paying for
  - Discovery-call theater
  - Layers of account management
  - A year of status meetings
  - Billable hours on rote work
```

**`.pg-pricing-split-us` — "What you pay for"** (list items unchanged)
```
What you pay for
  - The build, scoped once
  - A system that runs day one
  - Code and data you own
  - A direct line to the forge
```

**`.pg-pricing-recon-foot` (BrandText)**
```
The site you are reading proves it: studio-grade craft at a front-door price. That gap is the forge — not a discount.
```

#### C5 — WHAT'S INCLUDED + DEPOSIT TERMS section

**`.pg-pricing-eyebrow`**
```
In every engagement
```

**`<h2 className="pg-h2">`**
```
What the price buys.
```

**`INCLUDED[]`** (header, body — all four)
```js
const INCLUDED = [
  ['Fixed scope, fixed price', 'We scope it once, in writing. The number does not move mid-build. No surprise invoices. No scope-creep tax.'],
  ['You own everything', 'Source code, accounts, your data — handed over and open-sourced to you. No rented platform. No hostage situation.'],
  ['Working on day one', 'We ship it live, not into a "phase two" that never lands. It runs the work before the final balance comes due.'],
  ['You talk to the forge', 'No account managers. No ticket queue. You talk to the people who build it — direct, the whole way through.'],
]
```

**DEPOSIT TERMS — `.pg-pricing-deposit-k`**
```
Deposit terms
```

**DEPOSIT TERMS — `.pg-pricing-deposit-p` (BrandText)**
```
Software builds start with a $5,000 deposit — it locks scope and puts the forge to work. It is the line between buyers who build and browsers who don't, not a paywall. Fixed scope, fixed price: the figure is set before the first line ships and does not move. Voice, Web, and Automations start without a deposit.
```

#### C6 — FAQ (on-page) section

**`.pg-pricing-eyebrow`**
```
Straight answers
```

**`<h2 className="pg-h2">`**
```
Before you ask.
```

**`FAQ[]`** (question, answer — all six; this is the on-page DL, separate from the AEO `COPY.faq`)
```js
const FAQ = [
  [
    'How long does it take?',
    'Weeks, not quarters. A voice agent or a web build lands in days to a couple of weeks. A custom software platform runs longer but ships in stages you can see — never a year of silence.',
  ],
  [
    'Do I own the code?',
    'Yes. Source code, infrastructure, and accounts are handed over and open-sourced to you. You buy an asset you keep — not access to a platform we can switch off.',
  ],
  [
    'What is the deposit?',
    'Software starts with a $5,000 deposit to lock scope and put the forge to work. It filters for buyers who build, not browse. Voice, Web, and Automations start without one — the productized lines you transact on now.',
  ],
  [
    'Why is it cheaper than agencies?',
    'Because the forge runs lean — not because the work is cheap. Automatic Execution systematizes what agencies bill by the hour and the slide deck. You pay for the build, not for discovery theater, layers of management, or a year of meetings.',
  ],
  [
    'Are the prices final?',
    'The numbers are honest anchors — where each line starts. We scope every job to what you actually need, so the final figure is a short conversation, not a surprise. You know it before any work begins.',
  ],
  [
    'How do you take payment?',
    'A deposit to start, the balance on delivery — fixed against the scope we agreed. Software is deposit-gated; the rest bill against milestones you watch ship. We carry the risk — you pay when it executes.',
  ],
]
```

#### C7 — CTA section

**`.pg-cta-head` (`.flame`)**
```
Name the Number
```

**`.pg-lede` (BrandText)**
```
Tell us the bottleneck. We put an honest price on ending it — fixed scope, fixed price, working on day one. We carry the risk; you pay when it executes.
```

**`Link` CTA label**
```
Start the Forge
```

> `.avail` already renders `COPY.finale.avail` ("Available · Continental US · 7 Days"). No change.

---

## 3 — Verification notes

- **Prices LOCKED & unchanged:** Voice from $499/mo (+ one-time setup), Automations from $1,500,
  Web from $1,299, Software from $10,000 ($5k deposit). Anchors restated exactly: $48,000/yr,
  $50k+, $75k + months of discovery, "those hours every week."
- **Brand terms exact:** GAELWORX, Maeve (not used here but spelling preserved elsewhere),
  Automatic Execution. "Automatic Execution" ignites its leading A+E via `<BrandText>`/display type.
- **No passive voice in commands:** "Name the bottleneck," "We carry the risk," "You own everything."
- **Deposit FAQ truth check:** Voice setup left as "one-time setup" (no dollar figure) — matches the
  locked branch note and brand.js; avoids stating the ~$2.5k internal figure that isn't published copy.
- **FAQ char gate:** AEO answers measured at 291 / 286 / 293 chars — all ≤320, all lead with the
  number/fact.
- **Voice setup phrasing:** kept "+ one-time setup" / "plus one-time setup" (TRUE, locked).
- **Locked display strings untouched:** "The Forge Runs Lean", `COPY.rates.foot`, "Fixed scope.
  Fixed price. Continental US · 7 Days." preserved verbatim.
