# /about — Copy Rewrite Draft (the Clan story)

> Owner: about-page agent. Scope = page-specific copy in `src/pages/About.jsx` ONLY.
> NOT rewritten (other agents own them, used here as tone context): `COPY.clan`, `COPY.trust.rungs`
> (the five pillars render from `trust.rungs`), and the PageShell CTA block (`COPY.finale.closer` /
> `.cta` / `.avail`). Brand terms kept exact; A+E ignite handled by `<Ignite>` / `<BrandText>`.
> No source files edited. This is a copy spec, not a patch.

---

## 1 · Levers used, and where

The lockup for /about is **Outlaw × Hero + Ruler polish, bound by Clan/Unity** (per `03-archetypes`
§4). On the About page specifically, **Clan/Unity leads the frame** (it's the "who we are" page) and
**Authority/first-hand is the trust core** — with the **Founding Enemy** (Outlaw) as the page's spine
and the **Hero's service** as the line that keeps the Outlaw edge from tipping into nihilism. Map:

| # | Lever (source) | Where it lands on /about |
|---|---|---|
| **Clan / Unity** (`04` Group A.7 — strongest lever; `03` §4 "Clan sets the pronoun") | PageShell lede + Section 01 (ethos). "We / our hands," not "you the consumer." You talk to the people who build it. |
| **Authority / first-hand, demonstrated not claimed** (`04` Group A.4; `05` §1 risk-as-the-gate) | Section 02 ("We build what we know") — decades operating the businesses we now automate. The trust core for the high-ticket sale. |
| **The Founding Enemy / villain narrative** (`03` §4.2; `04` Group E + Sub-subject C) | NEW Section ("Why GAELWORX exists") — names **AI theater** + **bloated agencies** as the personified villain; positions GAELWORX as the honest insurgent who ships. |
| **Burn-then-build / Hero service** (`03` §4.3 editorial rule — "never an Outlaw line that only tears down") | Every enemy line is immediately followed by a build line. The Founding-Enemy section closes on "burn the theater, build the system." |
| **Ruler polish (justifies the price)** (`03` §4.4; `05` §2A) | Lineage section ("forged on the same anvil… the steel does not"), Section 02 ("we forge for how you actually run it"), the precision register throughout. |
| **Identity / status — "my people"** (`04` Group E; `05` "selling the identity shift") | Lede + close: built for operators who refuse to lose to the status quo; the clan you join. |
| **Specificity-as-proof** (`04` Group E; `04` Group A.4 "demonstrate, don't claim") | First-hand claims stated as operator-truth (run the operation, worked the bottlenecks). NOTE: any *number* or named bio fact is marked `[founder detail — to confirm]` — keep every claim TRUE. |
| **Curiosity/StoryBrand guide** (`03` §3.3; `04` Group D) | The customer is the Hero of their business; GAELWORX is the scarred Guide. Section 03 ethic ("judgment stays yours") + the CTA hand-off. |
| **CTA → /contact** (binding) | Satisfied by the existing PageShell CTA block (already links to `/contact`). Optional About-specific lead-in line provided in §2.9 if the home agent wants to localize it; default is to leave PageShell's CTA as-is. |

**Guardrail check:** Clan Voice — aggressive, **no passive voice**, zero fluff, battle-tested. Enemy is
the *system* (AI theater + bloated agencies), **never the buyer**. Every "break" line is paired with a
"build" line. No invented bio facts — operator-truth only; bracketed placeholders where a real fact
would land harder.

---

## 2 · Rewritten copy — section by section, mapped to `pages/About.jsx`

Every string below maps to an existing JSX location. Where a string is unchanged-but-approved I say so;
where it's new I give the final text. Placeholders for real facts are in `[brackets]`.

---

### 2.0 · PageShell header — `<PageShell kicker / title / lede>` (lines 49–53)

**`kicker`** (unchanged — approved):
> `The Clan`

**`title`** (the H1; plain flame, NOT auto-ignited per PageShell rule):
> `One Forge. Four Branches.`

**`lede`** — tighten to lead with the Clan identity + the Outlaw distinction in one breath. BrandText
auto-ignites the brand terms.
> **FINAL:** `GAELWORX is an engineering forge — not an agency. We ship our own platforms and forge the same caliber of system for you. We move like a clan: small, fast, fully accountable. You talk to the people who build it — never an account manager standing between you and the work.`

*(Outlaw distinction "not an agency" + Clan identity + the kill-shot at agency layers. Active voice, no
fluff.)*

---

### 2.1 · Section 01 — The Clan ethos (lines 57–74)

**`eyebrow`** (unchanged — approved): `01 · The Clan`
**`title`** (unchanged — approved): `An engineering forge. Not an agency.`

**Paragraph 1** (`<BrandText>`, line 61):
> **FINAL:** `No account managers. No layers between you and the work. GAELWORX moves like a clan — small enough to move fast, accountable for every line we ship. The hand that writes the code is the hand you shake.`

**Paragraph 2** (line 63–67) — keep the proof-of-ownership beat; sharpen:
> **FINAL:** `You talk to the people who build it. The same hands that forged YardWorx, RepairWorx, SalesWorx, and AgentWorx sit across from you and answer for the system that runs your business. We eat our own forge before we sell you a bite of it.`

**`figcaption`** (line 71, unchanged — approved): `One weave. Four strands.`

---

### 2.2 · The Lineage — the four branches (lines 77–94)

**`eyebrow`** (unchanged — approved): `The Lineage`
**`title`** (unchanged — approved): `One forge. Four branches.`

**Intro paragraph** (`<BrandText>`, line 79) — Ruler-polish proof line, kept:
> **FINAL (unchanged — approved):** `Four proprietary platforms, all forged on the same anvil. The branches differ; the steel does not.`

**Trunk mark** (line 83, `<Ignite text="GAELWORX" />`) — unchanged: `GAELWORX`

**The four `BRANCHES` domain lines** (lines 16–21) — these are the terse "what it runs" labels under
each branch name. Kept sharp and literal (Ruler register; one fragment each):
| `name` (ignited, unchanged) | `domain` — FINAL |
|---|---|
| `YardWorx` | `The yards.` *(unchanged — approved)* |
| `RepairWorx` | `The shops.` *(unchanged — approved)* |
| `SalesWorx` | `The pipeline.` *(unchanged — approved)* |
| `AgentWorx` | `The front desk.` *(unchanged — approved)* |

*(These are already tight, on-brand fragments. No change recommended — they read as a forged ledger.)*

---

### 2.3 · Section 02 — We build what we know (THE AUTHORITY CORE) (lines 97–107)

This is the trust core of the high-ticket sale (`05` §1). Sharpen the first-hand authority; keep it
operator-true (no invented numbers).

**`eyebrow`** (unchanged — approved): `02 · The Ground`
**`title`** (unchanged — approved): `We build what we know.`

**Paragraph 1** (lines 98–102):
> **FINAL:** `Every build starts from years on the floor of the businesses we now automate. We have run the operation, not read the case study — worked the bottlenecks we kill and lived the problems we solve. We have signed the front of the paycheck, not just the back of it.`

> `[founder detail — to confirm]` If a concrete, TRUE figure exists (e.g. *"two decades running
> [trade] operations"* or *"[N] years on the tools"*), swap it into the opening clause — specificity is
> proof (`04` Group E). Until confirmed, "years on the floor" stays the safe operator-truth. Do **not**
> ship "decades" unless decades is literally true.

**Paragraph 2** (lines 103–106):
> **FINAL:** `So you never pay us to learn your business on your dime. We walk in knowing the work, and we forge for how you actually run it — not for how a slide deck says you should.`

*(Authority demonstrated, not claimed; Ruler "forge for how you actually run it" justifies the price;
Outlaw jab at the slide deck. Active voice throughout.)*

---

### 2.4 · NEW SECTION — Why GAELWORX exists (THE FOUNDING ENEMY) — insert after Section 02 (before "03 · The Ethic")

This is the **Founding Enemy** beat the brief calls for, and it's currently absent from the page. It
slots cleanly as a new `<Section>` between line 107 (close of "02 · The Ground") and line 110 (open of
"03 · The Ethic"). Recommend `tone=""` (default) or `tone="panel"` — a panel reads as a manifesto card.
Suggested JSX shape:

```jsx
{/* ── THE FOUNDING ENEMY — why GAELWORX exists ─────────────────────── */}
<Section eyebrow="The Enemy" title="We were built against the theater." align="start">
  <p>{/* lead — names the villain */}</p>
  <div className="pg-about-enemy">
    {/* two struck rows: AI theater · bloated agencies — same .pg-about-ethic style */}
  </div>
  <p>{/* the burn-then-build turn */}</p>
</Section>
```

**`eyebrow`:** `The Enemy`
**`title`:** `We were built against the theater.`

**Lead paragraph** (names the villain — Outlaw requires a named enemy, `03` §4.2):
> **FINAL:** `GAELWORX exists because the AI market got loud and stopped shipping. Two rackets sell motion as progress. We were forged to end both.`

**The two enemy rows** (mirror the `.pg-about-ethic` ledger styling — label struck left, the charge
right). Each is a burn line; the page builds in the turn that follows:

| Label (ember) | Charge — FINAL |
|---|---|
| `AI theater` | `Black-box oracles. Confident nonsense. Last quarter's frontier model wrapped in a crossed-fingers prompt — demoed once, never shipped, never accountable.` |
| `The bloated agency` | `Months of discovery. A pilot that rots in phase two. Six layers of account manager between you and anyone who can actually write the code.` |

> Sourcing note: "last quarter's frontier model and a crossed-fingers prompt" and "pilots that rot in
> phase two" are pulled straight from `COPY.trust.rungs` (02 + 04) and `COPY.faq['/web']` — already in
> the deck, so the enemy framing is consistent site-wide, not invented here.

**The turn — burn, then build** (the Hero-service line that neutralizes the Outlaw shadow, `03` §4.3):
> **FINAL:** `We do not sell the theater. We burn it down and build the system that should have been there — owned by you, documented to you, running the work on day one. The fire is for the fakes. The forge is for you.`

*(Outlaw burn → Hero build in the same breath. Closes the enemy section on service, not nihilism. "The
fire is for the fakes. The forge is for you." is the page's thesis line.)*

---

### 2.5 · Section 03 — The AI ethic (lines 110–129)

**`eyebrow`** (unchanged — approved): `03 · The Ethic`
**`title`** (unchanged — approved): `Curiosity, not reliance.`

**Intro paragraph** (lines 111–114) — restates the philosophical villain (a machine pretending to be
the human), now reinforcing the Founding-Enemy section above:
> **FINAL:** `We point AI at the rote work — never to make you need us. No black-box oracle. No confident nonsense. No machine pretending to be the human in the room. You stay the operator; the machine stays the tool.`

**The three ethic rows** (lines 116–128 — `label` / `val` pairs). Keep the forged-ledger structure;
tighten to imperatives:

| `pg-about-ethic-label` | `pg-about-ethic-val` — FINAL |
|---|---|
| `The machine` | `does the rote — and shows its reasoning, every step.` |
| `The judgment` | `stays where it belongs. Yours.` |
| `The result` | `grounded teaching that makes you sharper, never hooked.` |

*(StoryBrand guide role: the buyer stays the Hero/operator; GAELWORX is the Guide that hands judgment
back. Curiosity over dependence — the anti-"AI theater" ethic.)*

---

### 2.6 · The Trust Pillars (lines 132–148)

**`eyebrow`** (unchanged — approved): `Why GAELWORX`
**`title`** (unchanged — approved): `Five pillars hold the forge.`

**The five pillar bodies** render from `COPY.trust.rungs` (`brand.js` lines 185–214) — **NOT this
agent's copy to rewrite** (the home/trust agent owns `COPY.trust`). No change requested here. They are
on-brand and reinforce the same Authority + Enemy + de-risk levers. Left as-is by design.

> If the trust agent ever localizes a pillar for /about, keep rung 01 ("We build what we know") in lock-
> step with Section 02 above so the authority claim doesn't drift between the two surfaces.

---

### 2.7 · The CTA close — PageShell built-in (PageShell.jsx lines 35–46)

The binding "End with a CTA → /contact" is **already satisfied**: PageShell renders a `Start the Forge`
CTA linking to `/contact`, with `COPY.finale.closer` and `COPY.finale.avail`. That copy is owned by the
home/finale agent — **not rewritten here.**

**Recommendation:** leave the shared CTA as-is (consistency across routes is the point of PageShell).

**OPTIONAL** — if the team wants an About-specific hand-off line *inside the page* (above the shared
CTA), drop this single sentence as a final `<p>` after the pillars. It closes the Clan loop (you are the
Hero; we are the Guide; pick a side) without touching shared copy:
> **OPTIONAL FINAL:** `You run the business. We forge the systems that run it. Bring us the bottleneck — we build the system that ends it.`

*(Customer-is-Hero + Guide hand-off + "Point the Sword" CTA logic. Only add if a page-local close is
wanted; otherwise the PageShell CTA stands alone.)*

---

## 3 · Implementation notes (for whoever wires this)

- All brand terms (GAELWORX, YardWorx, RepairWorx, SalesWorx, AgentWorx, Maeve, Automatic Execution)
  are kept exact and will ignite via `<BrandText>` / `<Ignite>` — no manual A+E markup needed in body
  copy. The new "Why GAELWORX exists" section uses `<BrandText>` for any paragraph containing a brand
  term so the ignite fires.
- The one **new section (2.4)** is the only structural add; everything else is a string swap in place.
- **`[founder detail — to confirm]`** in §2.3 is the single place a real fact would sharpen the page.
  Until confirmed, the safe operator-truth ("years on the floor," not "decades") ships. Confirm before
  upgrading the claim — keep every line TRUE.
- No git/npm/build run; no source edited. This draft is the deliverable.
