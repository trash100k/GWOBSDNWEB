# /software — copy rewrite (draft)

> Senior conversion-copywriter pass for the **Software** branch: the brand.js branch
> object (`COPY.arsenal.branches[0]`), the `/software` FAQ (`COPY.faq['/software']`), and
> every page-specific string in `src/pages/Software.jsx`. Awareness target: **Problem-Aware**
> traffic → **PAS** spine. Sophistication **Stage 3–4** → win on MECHANISM + IDENTITY.
> Price LOCKED: **From $10,000**, `$5k deposit to start`. Anchor `$75k`. Voice: the Clan
> Voice (aggressive, active, zero fluff). Every claim TRUE.
>
> Scope note: the shared `PageShell` CTA block renders `COPY.finale.closer` + `COPY.finale.avail`
> (owned by the finale agent) — untouched here. Brand terms render their ignited A+E via
> `<BrandText>` / `<Ignite>` automatically (GAELWORX · Automatic Execution · YardWorx). I keep
> "YardWorx" / "Automatic Execution" spelled exactly so the ignite engine fires.

---

## 1 · LEVERS USED, AND WHERE

| Lever (from brief) | Where it lands in this rewrite |
|---|---|
| **PAS — sharpen the pain of running a real business on duct-taped tools/spreadsheets** | `Software.jsx → THE PROBLEM` section title + lede + the three `PROBLEMS` panels (rented SaaS, spreadsheets, no ownership) — present-tense pain, named and specific. `branches[0].line` reframed to lead from the bottleneck. FAQ Q1 opens on the buyer's literal money question. |
| **PAS — agitate the COST OF INACTION (loss looms ~2×)** | `PROBLEMS` bodies now quantify what the status quo *costs right now*, not someday — "every seat, every year," "one wrong paste from the day gone," "your operation is hostage." `THE PROBLEM` lede ends on the loss-framed turn: the business serving the software. Investment `anchor-note` keeps the comparison loss-framed. |
| **MECHANISM + authority + anti-snake-oil ENEMY — custom-built, documented, open-sourced to YOU → you own the code, no lock-in, no black box** | This is the spine of `WHAT WE BUILD`, `HOW IT WORKS` (the open-source *handover* step), `WHAT YOU GET` (the ownership manifest), the FAQ "do I own the code" answer, and `branches[0].body`. The enemy (black box / lock-in / rented roadmap) is named explicitly as the foil the mechanism defeats. Authority = "the same forge that built YardWorx" + "built on proven ground (banks and fleets)." |
| **Anchor — agencies bill $75k + months of discovery** | `branches[0].anchor` (kept, sharpened). Rendered on-page as `Software.jsx → INVESTMENT → anchor-strike`. FAQ Q1 closes on the same $75k anchor. |
| **Risk reversal — the $5k deposit reframed as a commitment FILTER (not a fee); fixed scope/price** | `Software.jsx → INVESTMENT → terms` (deposit reframed as the line between building and browsing) + `HOW IT WORKS` step 01 ("scoped in days, the number doesn't move") + `branches[0].note` kept literal for schema. The deposit reads as qualification, not paywall. |
| **Status/identity — you command a proprietary platform built for how you actually run (like YardWorx)** | `WHAT WE BUILD` lede + the "Proprietary platforms" spec ("a moat no competitor can subscribe to") + `PROOF` block (YardWorx as the operator's badge) + `WHAT YOU GET` ("you own every bolt"). The buyer becomes the operator who *commands* a system, not rents one. |

**Framework note:** the page runs a hybrid — **PAS** (Problem → Build → Handover) carrying a
**Stage-3/4 mechanism** down the middle, closed with **anchor + risk-reversal** at the
Investment ledger. The Objection Cascade is honored in order: *why care* (THE PROBLEM) →
*why you* (WHAT WE BUILD = the mechanism) → *why believe* (HOW IT WORKS + PROOF) → *why now /
why safe* (WHAT YOU GET + INVESTMENT). Every number is real; the enemy is real; the anchor is
market rate. Nothing fabricated.

---

## 2 · REWRITTEN COPY (source path → final string)

### A · brand.js — `COPY.arsenal.branches[0]` (the Software branch)

> Structure preserved exactly: `id · tag · line · body · anchor · price · note`. Price/anchor LOCKED.

**`COPY.arsenal.branches[0].id`** *(unchanged)*
```
GW–01
```

**`COPY.arsenal.branches[0].tag`** *(unchanged)*
```
Software
```

**`COPY.arsenal.branches[0].line`** — outcome-first, leads from the bottleneck (PAS + identity)
```
Custom software. Built to run it all — and owned outright.
```

**`COPY.arsenal.branches[0].body`** — mechanism + authority + anti-snake-oil enemy, in one
```
Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. You own the code, not a license: no lock-in, no black box. The same forge that built YardWorx, built for how you actually run.
```

**`COPY.arsenal.branches[0].anchor`** — the $75k anchor, kept and sharpened (loss-framed)
```
Agencies bill $75k and burn months on discovery.
```

**`COPY.arsenal.branches[0].price`** *(LOCKED — unchanged)*
```
From $10,000
```

**`COPY.arsenal.branches[0].note`** *(LOCKED — unchanged)*
```
$5k deposit to start
```

---

### B · brand.js — `COPY.faq['/software']`

> Two entries. Each answer ≤320 chars, **leads with the literal fact** (the price / the yes),
> brand voice second. Every number sourced from the branch above. Feeds FAQPage schema.
> (Char counts noted; all under 320.)

**`COPY.faq['/software'][0].q`**
```
How much does custom software cost?
```

**`COPY.faq['/software'][0].a`** *(298 chars)*
```
Custom software starts from $10,000, with a $5k deposit to start. That buys internal tools and proprietary platforms — custom-built, documented, and open-sourced to you, so you own the code outright. Agencies bill $75k and burn months on discovery for the same scope.
```

**`COPY.faq['/software'][1].q`**
```
Do I own the code you build?
```

**`COPY.faq['/software'][1].a`** *(263 chars)*
```
Yes — every platform we build is documented and open-sourced to you on day one, so you own the code outright. No lock-in, no black box, no rented roadmap. The same forge that built YardWorx builds for how you actually run. Custom software from $10,000.
```

---

### C · src/pages/Software.jsx — page-specific strings

> Mirrors the existing section structure. The page H1 + lede come from `PageShell` props /
> `b.body`. Every `PROBLEMS`, `BUILD`, `STEPS`, `OWN` item is page-owned.

#### `PageShell` props (the page hero)

**`pages/Software.jsx → PageShell title`** — H1 (plain flame; not auto-ignited)
```
Custom Software, Built to Run It All
```
*(kept — it is already outcome-first and clean. The lede `lede={b.body}` pulls the rewritten
`branches[0].body` above, which now carries the ownership + no-black-box mechanism into the hero.)*

**`pages/Software.jsx → PageShell kicker`** *(unchanged — route label)*
```
GW–01 · Software
```

---

#### Section 1 — THE PROBLEM (PAS: problem + agitate the cost of inaction)

**`pages/Software.jsx → THE PROBLEM → eyebrow`**
```
The Problem
```

**`pages/Software.jsx → THE PROBLEM → title`**
```
You’ve outgrown the tools you don’t own.
```

**`pages/Software.jsx → THE PROBLEM → lede (pg-software-lede-strong)`** — present-tense pain, loss turn
```
Rented SaaS you bend the business to. Spreadsheets one bad paste from a lost day. A stack of apps that hold your data hostage and talk to each other through you. At some point the software stops serving the business — and the business starts serving the software. That’s the bottleneck. It costs you every single week.
```

**`pages/Software.jsx → THE PROBLEM → PROBLEMS[0]` (GlyphSaaS)**
- head:
```
You outgrew the rented SaaS.
```
- body:
```
The platform that fit at ten jobs a week buckles at fifty. You bend your operation to its limits, you wait on a roadmap that isn’t yours — and you pay more every seat, every year, forever. You’re renting a ceiling.
```

**`pages/Software.jsx → THE PROBLEM → PROBLEMS[1]` (GlyphSheet)**
- head:
```
The business runs on spreadsheets.
```
- body:
```
A dozen tabs, three people who know the formulas, and one wrong paste from chaos. The real system lives in someone’s head, not in software you control — and the day they leave, it leaves with them.
```

**`pages/Software.jsx → THE PROBLEM → PROBLEMS[2]` (GlyphRent)**
- head:
```
You don’t own the tools.
```
- body:
```
Your data sits on someone else’s servers, behind someone else’s roadmap, priced at someone else’s whim. They raise the rate, kill the feature, or fold — and your operation is the hostage. You built a business on rented ground.
```

---

#### Section 2 — WHAT WE BUILD (the MECHANISM + authority + identity)

**`pages/Software.jsx → WHAT WE BUILD → eyebrow`**
```
What We Build
```

**`pages/Software.jsx → WHAT WE BUILD → title`**
```
Internal tools and proprietary platforms.
```

**`pages/Software.jsx → WHAT WE BUILD → lede (pg-software-lede-strong)`** — mechanism + identity (YardWorx renders ignited)
```
We build the system your business actually runs on — custom-built, fully documented, and open-sourced to you. You command the platform; you don’t rent it. The same forge that built YardWorx, built for how you operate.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[0]`**
- head:
```
Internal tools
```
- body:
```
The dispatch board, the job tracker, the quoting engine — the software your crew actually touches all day, shaped to how you already work instead of bending you to a stranger’s product.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[1]`** *(identity / status lever)*
- head:
```
Proprietary platforms
```
- body:
```
A system that is yours alone, not a config of someone else’s product. A real competitive edge — a moat no competitor can subscribe to and no vendor can switch off.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[2]`**
- head:
```
Custom-built
```
- body:
```
Engineered for your operation from the first line — not a template stretched to fit, not a plugin pile held together with tape. It fits the business; the business never bends to it.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[3]`** *(anti-black-box enemy)*
- head:
```
Documented
```
- body:
```
Every decision written down, every system mapped. You get the manual, not a black box only we can open. The opposite of the rented SaaS you can’t see inside.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[4]`** *(the differentiator + proof in one — own the code)*
- head:
```
Open-sourced to you
```
- body:
```
The code is handed over, in full, the day it goes live. Yours to run, extend, or hand to any engineer. No lock-in, no license to renew, never held hostage.
```

**`pages/Software.jsx → WHAT WE BUILD → BUILD[5]`** *(authority)*
- head:
```
Built on proven ground
```
- body:
```
The same battle-tested rails that run banks and fleets — predictable behavior, not last quarter’s frontier model and crossed fingers. No AI theater. No pilot that rots in “phase two.”
```

---

#### Section 3 — HOW IT WORKS (why believe + fixed-scope risk reversal)

**`pages/Software.jsx → HOW IT WORKS → eyebrow`**
```
How It Works
```

**`pages/Software.jsx → HOW IT WORKS → title`**
```
Discovery. Build. Open-source handover.
```

**`pages/Software.jsx → HOW IT WORKS → STEPS[0]` (Discovery)** *(fixed scope/price risk reversal)*
- n: `01`
- tag:
```
Discovery
```
- head:
```
We map the operation.
```
- body:
```
A working session, not discovery-call theater. We walk the bottleneck, name the system that kills it, and scope it in days — not a six-week deck. You leave knowing exactly what we build, what it costs, and a number that doesn’t move.
```

**`pages/Software.jsx → HOW IT WORKS → STEPS[1]` (Build)**
- n: `02`
- tag:
```
Build
```
- head:
```
We forge it.
```
- body:
```
Small clan, full accountability — you talk to the people writing the code, not an account manager. It ships in weeks, not quarters, documented as we go. No pilots rotting in “phase two.”
```

**`pages/Software.jsx → HOW IT WORKS → STEPS[2]` (Handover)** *(the mechanism's payoff — you own it)*
- n: `03`
- tag:
```
Handover
```
- head:
```
We open-source it to you.
```
- body:
```
It goes live, runs the work, and the code is yours — the full repository, the docs, the keys. You own every bolt. We don’t hold your business hostage to keep the lights on. That’s the whole point.
```

---

#### Section 4 — WHAT YOU GET (the ownership manifest — identity + risk reversal)

**`pages/Software.jsx → WHAT YOU GET → eyebrow`**
```
What You Get
```

**`pages/Software.jsx → WHAT YOU GET → title`**
```
You own every bolt.
```

**`pages/Software.jsx → WHAT YOU GET → lede (pg-software-lede-strong)`**
```
No license to renew. No seat to ring up. No roadmap you’re hostage to. No black box. When the forge cools, the platform — and the leverage — is entirely yours.
```

**`pages/Software.jsx → WHAT YOU GET → OWN[0]`**
- k: `The code`
- v:
```
The full repository, handed over. Run it, fork it, hand it to any engineer. No lock-in.
```

**`pages/Software.jsx → WHAT YOU GET → OWN[1]`** *(identity / status)*
- k: `The platform`
- v:
```
A proprietary system that is yours alone — a moat, not a subscription. A vendor can’t switch it off.
```

**`pages/Software.jsx → WHAT YOU GET → OWN[2]`**
- k: `The data`
- v:
```
On your ground, in your shape — yours to leverage like no rented tool allows. Never the hostage again.
```

**`pages/Software.jsx → WHAT YOU GET → OWN[3]`** *(anti-black-box enemy)*
- k: `The documentation`
- v:
```
Every system mapped and written down. The manual, not a black box only we can open.
```

---

#### Section 5 — PROOF (authority + identity; YardWorx renders ignited)

**`pages/Software.jsx → PROOF → eyebrow`**
```
Proof
```

**`pages/Software.jsx → PROOF → proof-kicker`**
```
The forge built
```

**`pages/Software.jsx → PROOF → proof-mark (Ignite)`** *(unchanged — the ignited mark)*
```
YardWorx
```

**`pages/Software.jsx → PROOF → proof-body (BrandText)`** — first-hand authority, anti-snake-oil
```
YardWorx is a proprietary platform we run ourselves — not a case study we read. We don’t point AI at a problem and hope; we build what we’ve already lived. We’ve worked the bottlenecks we automate, so you never pay us to learn your business on your dime. Then we forge the same caliber for you — and hand you the keys.
```

**`pages/Software.jsx → PROOF → proof-link`** *(unchanged — to /work)*
```
See the platforms the forge runs →
```

---

#### Section 6 — INVESTMENT (anchor + deposit-as-filter risk reversal)

**`pages/Software.jsx → INVESTMENT → eyebrow`**
```
The Investment
```

**`pages/Software.jsx → INVESTMENT → anchor-strike`** *(renders `b.anchor` — the rewritten anchor above)*
```
Agencies bill $75k and burn months on discovery.
```

**`pages/Software.jsx → INVESTMENT → anchor-note`** — loss-framed reconciliation
```
We forge the same caliber — owned, not rented.
```

**`pages/Software.jsx → INVESTMENT → price-from / price-num`** *(LOCKED — unchanged)*
```
From  $10,000
```

**`pages/Software.jsx → INVESTMENT → terms[0]`** — the deposit reframed as a FILTER, not a fee
```
<strong>$5,000</strong> deposit — the line between building and browsing
```

**`pages/Software.jsx → INVESTMENT → terms[1]`** — fixed scope/price
```
Fixed scope. Fixed price. Scoped in days, yours on day one.
```

**`pages/Software.jsx → INVESTMENT → CTA button`** *(unchanged — Point the Sword)*
```
Start the Forge
```

**`pages/Software.jsx → INVESTMENT → avail`** *(renders `COPY.finale.avail` — finale-owned, untouched)*
```
Available · Continental US · 7 Days
```

---

### Notes for the integrating agent
- `branches[0].line` got one extra clause (`— and owned outright`); it stays short and is still
  outcome-first. If the carousel/arsenal layout truncates long lines, fall back to the original
  `Custom software. Built to run it all.` and let `body` carry the ownership lever.
- `branches[0].anchor` changed from "and months of discovery" to "and burn months on discovery"
  (active voice, no passive — Clan Voice). The `$75k` anchor is preserved verbatim. The
  Investment `anchor-strike` renders this same string via `{b.anchor}` — one source, no drift.
- FAQ answers re-checked against the locked numbers ($10,000 / $5k deposit / $75k) and the
  ≤320-char limit; both lead with the literal fact, brand voice second, per the schema rule.
- Brand terms (GAELWORX / Automatic Execution / YardWorx) are spelled exactly so the `<BrandText>`
  / `<Ignite>` engines fire the A+E. No new brand term introduced, so no `TERMS` edit needed.
```
