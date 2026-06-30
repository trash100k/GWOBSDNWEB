# GW–04 WEB — copy rewrite draft

Owner scope: `COPY.arsenal.branches[3]` (line/body/anchor/price) · `COPY.faq['/web']` · all on-page copy in `src/pages/Web.jsx`.
Voice: Clan Voice (aggressive, no passive voice). Every lever below is TRUE.
LOCKED: price **From $1,299** (charm endpoint kept) · anchor **$50k+** · brand terms exact · FAQ answers ≤320 chars, fact-first.
Field/section structure unchanged — strings only.

---

## 1. Levers used, and where

- **PAS / BAB (a site that books nothing → books the truck).** The branch `line`, the `/web` FAQ
  "generate leads" answer, and `Web.jsx → "The problem"` section all run problem→agitate→solve, and
  resolve on the exact finale promise *book the truck*. The agitation is the **leak**: a visitor
  who bounces to call a competitor who picks up. *(research 04 §loss-aversion / cost-of-inaction; 01 §PAS)*
- **Mechanism over claim (route every lead straight to your phone).** Stage-3/4 market — "looks good"
  is dead. Every block names the loop: visitor → booked job → your phone. Outcome is **booked work**,
  not aesthetics. *(01 §1.3 mechanism+outcome; README cross-cut #1)*
- **Aesthetic-congruence META-PROOF (built to the standard of the page you're on).** The hardest
  lever, leaned on hardest: the live obsidian scene behind the copy IS the demo. Carried in the
  branch `body`, `PageShell` lede, the `"This page is the proof"` section, the manifesto lede, and
  the "generate leads" FAQ. *(06 §1b aesthetic congruence; 06 §4 "craft IS the pitch")*
- **Anchoring ($50k+).** Premium studios charge $50k+ — first number the buyer reads, so From $1,299
  lands small against it. Branch `anchor`, the "how much" FAQ, the Investment lede strike-price.
  *(04 §anchoring; 06 §4 transparent pricing)*
- **Speed / risk reversal (fixed scope, fixed price, 7 days, no pilots that rot).** Branch + FAQ +
  Investment foot. De-risks the high-ticket decision. *(05 risk-reversal ladder; 04 §scarcity-TRUE)*
- **Enemy = the dead business card, never a competitor.** The "business card" villain carries the
  PAS agitation without smearing anyone. *(04 §enemy-narrative; 06 §4)*
- **Specificity-as-proof + slippery-slide cadence.** Short hard first sentences, concrete numbers
  (0.05s, 75%, 7 days), active voice throughout. *(01 §1.4; 04 §specificity)*

Honest line held: real anchor, real fixed price, no fake scarcity, transparent number up front. *(04 PART 4; 06 §3)*

---

## 2. Rewritten copy

### A. `COPY.arsenal.branches[3]` — the Web branch (shared card across the site)

**`COPY.arsenal.branches[3].line`**
> Cinematic web that books the truck.

**`COPY.arsenal.branches[3].body`**
> Studio-grade, cinematic lead-gen that routes every lead straight to your phone — and books the truck instead of just looking good. Built to the standard of the page you're on.

**`COPY.arsenal.branches[3].anchor`** *(LOCKED $50k+ — unchanged)*
> Premium studios charge $50k+ for this.

**`COPY.arsenal.branches[3].price`** *(LOCKED — unchanged)*
> From $1,299

---

### B. `COPY.faq['/web']` — extractable Q/A (each ≤320 chars, fact first, brand voice second)

**`COPY.faq['/web'][0].q`**
> How much does a website cost?

**`COPY.faq['/web'][0].a`** *(258 chars)*
> A GAELWORX site starts from $1,299. You get studio-grade cinematic lead-gen that routes every lead straight to your phone and books the truck — not just looks good. Premium studios charge $50k+ for this. Fixed scope, fixed price, shipped in 7 days.

**`COPY.faq['/web'][1].q`**
> How fast can you ship a site?

**`COPY.faq['/web'][1].a`** *(243 chars)*
> Seven days. Fixed scope, fixed price, Continental US — no pilots that rot in phase two. We put it live, it routes leads straight to your phone, and it books the truck. Web from $1,299, against the $50k+ premium studios charge.

**`COPY.faq['/web'][2].q`**
> Will the site actually generate leads?

**`COPY.faq['/web'][2].a`** *(259 chars)*
> Yes. Every site routes every lead straight to your phone and is built to book the truck, not just look good — the outcome is work on your calendar. Studio-grade and cinematic, built to the standard of the page you are reading. From $1,299.

---

### C. `src/pages/Web.jsx` — all on-page strings

#### PageShell header

**`pages/Web.jsx → <PageShell title>`**
> Cinematic Web That Books the Truck

**`pages/Web.jsx → <PageShell lede>`**
> The page you're reading is the pitch. Real obsidian, real fire, real speed — we forge every site to this bar and aim it at one outcome: every lead routed straight to your phone, the truck booked.

---

#### Section: "The standard" — `<Section title="This page is the proof.">`

**`pages/Web.jsx → Section[The standard] title`** *(unchanged — already lands the meta-proof)*
> This page is the proof.

**`pages/Web.jsx → Section[The standard] <p>`**
> No slideshow. No before-and-after. You're standing inside the work — the obsidian behind this copy is a live 3D scene, not an image, running smooth on the phone in your hand. If a site stops you here, it stops your customers before they leave to call someone who picks up. That's the whole pitch.

Proof stat strip (numerals + labels):

**`pages/Web.jsx → proof-stat[0]`** — n `0.05s` · l → *(unchanged)*
> to judge your site

**`pages/Web.jsx → proof-stat[1]`** — n `75%` · l → *(unchanged)*
> judge the business by it

**`pages/Web.jsx → proof-stat[2]`** — n `1 shot` · l → *(unchanged)*
> at the first impression

---

#### Section: "The problem" — `<Section title="Most contractor sites book nothing.">`

**`pages/Web.jsx → Section[The problem] title`**
> Most contractor sites book nothing.

**`pages/Web.jsx → Section[The problem] <p>`**
> They're digital business cards — a logo, a phone number, a stock handshake. Slow to load, invisible to Google, identical to every competitor. Here's the leak: the visitor lands, waits, gives up, and calls the next shop who picks up. A site that just sits there isn't marketing. It's a brochure that quietly hands your jobs to someone else.

Versus cards — dead vs forge:

**`pages/Web.jsx → card--dead tag`**
> The business card

**`pages/Web.jsx → card--dead list`** (5 items)
> - Loads slow, bounces fast
> - Buried on page 4 of Google
> - Looks like every other shop
> - No path to the call
> - Sits there. Books nothing.

**`pages/Web.jsx → card--forge tag`** *(unchanged)*
> The GAELWORX build

**`pages/Web.jsx → card--forge list`** (5 items)
> - Snaps open in under a second
> - Ranked, structured, AI-quotable
> - Unmistakably, only yours
> - Routes every lead to your phone
> - Books the truck while you sleep

---

#### Section: "What you get" — `<Section title="A site engineered to book the truck.">`

**`pages/Web.jsx → Section[What you get] title`**
> A site engineered to book the truck.

**`pages/Web.jsx → Section[What you get] <p>`**
> Four things, non-negotiable. We've already proven each one on the page you're on — bolted together into a site that doesn't just look the part, it routes the lead and books the work.

Pillars (`PILLARS` array — head + body):

**`pages/Web.jsx → PILLARS[0]`** — head `Cinematic 3D`
> A living scene — real obsidian, real fire, real depth — rendered in the browser. Not a stock hero. The first three seconds make a visitor stop, lean in, and trust you before they read a word.

**`pages/Web.jsx → PILLARS[1]`** — head `Built to book`
> Every section points the sword. One straight path from cold visitor to booked job — call, quote, form — routed to your phone and aimed at the only number that counts: work on your calendar.

**`pages/Web.jsx → PILLARS[2]`** — head `Found by search + AI` *(body unchanged)*
> Prerendered, structured, and machine-readable so Google ranks you and the AI answer engines — ChatGPT, Gemini, Perplexity — quote you by name when buyers ask who to hire.

**`pages/Web.jsx → PILLARS[3]`** — head `Blistering speed`
> Sub-second loads on a phone over cell service. Speed is conversion: every wasted second leaks a visitor to the competitor who picks up. We forge sites that snap — no spinners, no bloat, no excuses.

> Note: `PILLARS[1].head` changes `Built to convert` → `Built to book` to land the outcome verb. Icon key `convert` unchanged.

---

#### Section: "The GAELWORX standard" — manifesto

**`pages/Web.jsx → ForgeText manifesto text`** *(unchanged — kinetic ignite line)*
> We forge the web like iron.

**`pages/Web.jsx → std-lede (BrandText)`**
> Anyone can ship a template. GAELWORX ships craft — Automatic Execution, in the browser. Real motion. Sharp brutalist build. Built to the standard of the page you're on, and aimed at the only number that matters: the truck booked.

Tenets (`Standard()` — k + v):

**`pages/Web.jsx → tenet[0]`** — k `Real motion` *(unchanged)*
> Every transition is engineered, not stock. Brutalist Snap — zero delay, high momentum, only impact. Motion that feels forged, never decorative.

**`pages/Web.jsx → tenet[1]`** — k `Sharp craft` *(unchanged)*
> Zero rounded corners. Hard 1px borders, the 8px drop shadow, an iron grid in absolute alignment. Brutalist discipline on every pixel.

**`pages/Web.jsx → tenet[2]`** — k `No template`
> Bespoke on-brand SVG and CSS, hand-built for your business. The same forge that built this page builds yours — to this exact bar, and shipped in 7 days.

---

#### Section: "Investment" — `<Section title="Premium craft. Front-door price.">`

**`pages/Web.jsx → Section[Investment] title`** *(unchanged)*
> Premium craft. Front-door price.

**`pages/Web.jsx → invest-lede <p>`** (keep `<s>$15,000–$50,000+</s>` strike anchor)
> Premium studios bill <s>$15,000–$50,000+</s> for cinematic web. We forged the process, so you skip the discovery theater and pay for the build, not the meetings. Fixed scope, fixed price before we strike — pick your scope.

Tier 1 — The Front Door:

**`pages/Web.jsx → tier[0] tag`** *(unchanged)*
> The Front Door

**`pages/Web.jsx → tier[0] price / sub`** *(LOCKED — unchanged)*
> $1,299 · starting at

**`pages/Web.jsx → tier[0] body`**
> A fast, ranked, single-page site engineered to book. Cinematic where it counts, every lead routed to your phone, shipped in 7 days — built to this standard.

Tier 2 — The Full Forge (flagship):

**`pages/Web.jsx → tier[1] flag / tag`** *(unchanged)*
> Flagship · The Full Forge

**`pages/Web.jsx → tier[1] price / sub`** *(unchanged)*
> $8,999 · up to

**`pages/Web.jsx → tier[1] body`**
> A full multi-page cinematic build — 3D scene, custom motion, lead capture wired straight to your phone, AI-quotable and search-dominant. The page you're on, made yours, booking the truck.

**`pages/Web.jsx → ledger-foot`**
> Scoped to the job. Fixed price before we strike. No pilots that rot in phase two. Continental US · 7 days.

---

### Brand-term / ignite checklist
- `GAELWORX` and `Automatic Execution` appear verbatim → auto-ignited by `<BrandText>` / `ForgeText`.
- No new brand proper-nouns introduced — `TERMS` in `BrandText.jsx` needs no edit.
- Price `From $1,299` and anchor `$50k+` carried byte-for-byte everywhere.
- All FAQ answers verified ≤320 chars (longest: 259). Each leads with the fact (price / "Seven days" / "Yes").
