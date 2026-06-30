# /contact — Copy Rewrite Draft

**Owner:** Contact-page copywriter · **Scope:** all page-specific strings in `src/pages/Contact.jsx`
**Status:** DRAFT for review. Source-of-truth voice: `CLAUDE.md` (Clan Voice) + `COPY.point` / `COPY.finale` (home agent owns those keys — mirrored, not rewritten).
**Constraint honored:** component + form-field structure unchanged. Strings only. One field-cut FLAGGED, not made (see §3).

---

## 1 · Levers used, and where

The /contact page is the conversion endpoint — Schwartz **Most-Aware** traffic (they've already toured the forge; they're here to act). So: kill friction, state the outcome at every interactive element, reverse the risk at the point of the click, and turn "name the bottleneck" into the micro-yes that starts the close. Every lever below is TRUE — no fake timers, no fabricated scarcity, no confirmshaming (research 06 §3: one dark pattern detonates a high-ticket trust sale).

| # | Lever (research source) | Where it lives on the page |
|---|---|---|
| **L1** | **"Point the Sword" — one clear action.** Single goal, single CTA, Attention Ratio ≈1:1 (06 §1d). The whole page asks for *one* thing: name the bottleneck. | Headline, rail head, button. |
| **L2** | **Button states the OUTCOME, never the mechanic.** Veeam "Request a Quote → Request Pricing" = +161% (01 §2.2). Never "Submit." Button = the result the buyer gets. | Submit button → **"Send It — Start the Build"** (see §3 for the call). |
| **L3** | **Future pace + cost of waiting.** Losses loom ~2× (05 §1). Paint the after-state (a system running the work) against another week of the leak. | Intro/lede mirror, rail head + body, success body. |
| **L4** | **Risk reversal AT the button.** "Fixed scope. Fixed price. We carry the risk — you pay when it executes." (05 §1, risk-reversal ladder rung 5) — placed exactly where the doubt spikes: under the CTA. | Fineprint under the button + `COPY.rates.foot` echo. |
| **L5** | **Microcopy IS the conversion.** Form-field microcopy kills anxiety at the friction point; errors blame the system, never the user; success celebrates (01 §2.2–2.3). | All field labels, placeholders, error strings, success state. |
| **L6** | **Minimum fields = max completion.** Hick's Law; Expedia killed one field for +$12M (06 §1d, 01 §2.2). Reduce to the essential. | §3 FLAGS cutting "Phone" (optional) — recommendation only; not executed. |
| **L7** | **Commitment / consistency — the micro-yes.** Getting them to *name the bottleneck* is the small public commitment that starts the close (04 / 05; Tesla $100-reservation logic). | Headline ("Name the Bottleneck"), the bottleneck field, the close. |
| **L8** | **Specificity + clarity beat clever.** Real, concrete promise (24h, the build, the price, the day it ships) — no fluff, read-aloud-clean (01 §1.1–1.3). | Rail promises, fineprint, success. |
| **L9** | **Clan Voice — aggressive, active, no passive.** Direct commands; brand terms exact (`CLAUDE.md`). | Everywhere. |

---

## 2 · Rewritten copy (each item: exact location → final string)

### A · Page header (`PageShell` props)

**`pages/Contact.jsx → PageShell kicker`**
> `07 · Start the Forge`
*(unchanged — already on-brand, matches NAV `07 · Contact` + `COPY.point.kicker` family.)*

**`pages/Contact.jsx → PageShell title` (headline)**
> `Name the Bottleneck`
*(KEEP. This IS lever L7 — the micro-yes as the headline. Aggressive imperative, no passive. Don't dilute it.)*

**`pages/Contact.jsx → PageShell lede`** — currently `lede={COPY.point.body}` (home agent owns `COPY.point.body` = *"One call. No discovery-call theater. You name the bottleneck — we build the system that kills it."*).
> **KEEP wiring as-is** (`lede={COPY.point.body}`). It already carries L1 + L3 + L7 in the Clan Voice. Mirroring, not overwriting — per brief, that key belongs to the home agent.

---

### B · Left rail — the promise + the terms (de-risk before they look at the form)

**`pages/Contact.jsx → rail eyebrow` (`.pg-eyebrow`)**
> `The Intake`

**`pages/Contact.jsx → rail head` (`.pg-contact-rail-head`, in `<BrandText>`)**
> `One message. We bring the system that ends the leak.`
*(L1 single action + L3 cost-of-waiting — "the leak" = the bottleneck still bleeding. Active voice.)*

**`pages/Contact.jsx → rail body` (`.pg-contact-rail-body`)**
> `No discovery-call theater. No form that drops into a void. Name the bottleneck — we name the build, the price, and the day it ships back fixed.`
*(L1 + L5 reassurance + L8 specificity. "we name… the day it ships" is the concrete promise, not a vague "we'll be in touch.")*

**`pages/Contact.jsx → rail promises` (`.pg-contact-promises` — three `<li>`)** — each is a TRUE de-risk signal (L4/L8):
1. > `Read by the smiths who build it — never a queue, never a bot.`
2. > `A real answer in 24 hours: fixed scope, fixed price.`
3. > `No obligation. No pressure. No sales theater.`
*(L8 clarity + L4 fixed-scope/price. "smiths who build it" mirrors `COPY.clan` "You talk to the people who build it." Keep the existing `ForgeTick` ember icons.)*

**`pages/Contact.jsx → rail availability` (`.pg-contact-avail` span)** — currently `{COPY.point.avail}`.
> **KEEP** `{COPY.point.avail}` = `Available · Continental US · 7 Days`. Home agent owns it; it's the true scarcity/availability signal (L4). Don't fork the string.

---

### C · The form — labels, placeholders, microcopy (L5 + L6)

> **Voice rule for labels:** short, uppercase, no fluff (matches `.pg-contact-label` styling). Placeholders carry the personality + the example, so labels stay scannable.

**`pages/Contact.jsx → Field "name" label`**
> `Your Name`

**`pages/Contact.jsx → Field "name" placeholder`**
> `Who's at the anvil?`
*(KEEP — on-brand, warm, low-friction.)*

**`pages/Contact.jsx → Field "business" label`**
> `Business`

**`pages/Contact.jsx → Field "business" placeholder`**
> `The operation we're arming`
*(Slight lift from "The operation's name" — adds the "we fight for you" frame.)*

**`pages/Contact.jsx → Field "email" label`**
> `Email`

**`pages/Contact.jsx → Field "email" placeholder`**
> `you@business.com`
*(KEEP — a real example beats instruction.)*

**`pages/Contact.jsx → Field "phone" label`**
> `Phone`  ·  (keeps the `optional` tag → renders `optional`)
*(See §3: recommend CUTTING this field. If kept, label stays "Phone / optional".)*

**`pages/Contact.jsx → Field "phone" placeholder`**
> `(555) 000-0000`
*(KEEP.)*

**`pages/Contact.jsx → service select label` (`.pg-contact-label`)**
> `What You Need`
*(Tighter + more direct than "Service of interest". Keeps the `*` required mark.)*

**`pages/Contact.jsx → SERVICES options` (the `<select>` list)** — outcome-first, mirrors `COPY.arsenal` branch lines:
- `['', 'Point me at the right branch…']`  *(default/placeholder option — was "Select a service…")*
- `['software', 'Software — a platform that runs it all']`
- `['voice', 'Voice — Maeve, the front desk that never clocks out']`
- `['automations', 'Automations — kill the busywork']`
- `['web', 'Web — a site that books the job']`
- `['unsure', 'Not sure yet — point me']`
*(Brand term **Maeve** exact. Each option states the outcome, not the category — L2 at the menu level.)*

**`pages/Contact.jsx → bottleneck textarea label` (`.pg-contact-label`)**
> `The Bottleneck`
*(KEEP — this is the micro-yes field, L7. Keep the `*`.)*

**`pages/Contact.jsx → bottleneck textarea placeholder`**
> `Missed calls? Drowning in busywork? Six apps and one mess? Tell us what it's costing you — that's the whole job.`
*(L7 + L3. "that's the whole job" lowers the bar to commit — naming the problem IS the ask. Echoes `COPY.finale.problems` so a returning visitor recognizes their own pain.)*

---

### D · The button (L2 — the single most-tested string on the page)

**`pages/Contact.jsx → submit button label` (`<span>` inside `.pg-contact-submit`)**

> ## `Send It — Start the Build`

**Rationale / the call:** The brief offers "Start the Forge" or "Send It." I'm recommending **`Send It — Start the Build`** as the primary:
- **"Send It"** = the action verb the buyer's hand is already on (form submit) — zero decode, Clan-blunt, matches `01 §2.2` "answer *what do I get / what happens*."
- **"Start the Build"** = the OUTCOME (L2): not "submit a form," but *the build begins*. It's the after-state in three words, and it's distinct from the hero/nav CTA "Start the Forge" so the conversion endpoint reads as the real commitment, not a repeat of the top-of-funnel button.
- **Fallback if a single short label is preferred:** `Start the Build` (drop "Send It —"). Do NOT revert to "Light the Forge" — it states the *mechanic* (lighting), not the buyer's outcome.
- Never "Submit." (Binding.)

---

### E · Microcopy under the button (L4 — risk reversal at the exact point of doubt)

**`pages/Contact.jsx → fineprint` (`.pg-contact-fineprint`)** — currently one privacy line. Upgrade it to carry the risk reversal, because the doubt spike is *here*, under the CTA:

> `Fixed scope. Fixed price. We carry the risk — you pay when it executes. · Continental US · 7 Days`
> `We answer in 24 hours. Your details stay in the clan — never sold, never spammed.`

*(Two lines: first = L4 risk reversal verbatim from the brief, echoing `COPY.rates.foot` + `COPY.point.avail` so the numbers never drift; second = the privacy reassurance, kept. If the component renders one `<p>`, join with a line break / `<br/>` — strings only, structure intact.)*

---

### F · Success state (L3 + L5 — celebrate, confirm, future-pace; tone flexes UP)

**`pages/Contact.jsx → Success head` (`.pg-contact-success-head`, `.flame`)**
> `The Forge Is Lit.`
*(KEEP. Display Cinzel, celebratory — correct tone for a success screen per `01 §2.3` Mailchimp rule. Forge term, on-brand.)*

**`pages/Contact.jsx → Success body` (`.pg-contact-success-body`)**
> `We have it{business ? — and we know <strong>{business}</strong> : ""}. A real answer lands inside 24 hours: the build, the price, and the day it ships. The leak's been bleeding long enough — we go to work now.`
*(L3 future-pace + cost-of-waiting close. Keeps the dynamic `{business}` insertion. "we go to work now" = the after-state has already begun — consistency/commitment payoff for the micro-yes they just gave.)*

**`pages/Contact.jsx → Success availability` (`.pg-contact-avail--center` span)** — currently `{COPY.point.avail}`.
> **KEEP** `{COPY.point.avail}`. Home agent's string; reused.

---

### G · Validation / error strings (L5 — calm under frustration, blame the system/never the user, stay in voice)

> Errors fire when the buyer is *closest* to converting — tone must not scold (`01 §2.3`). These say what's needed, in voice, without blame.

**`pages/Contact.jsx → validate() e.name`**
> `Name the smith we're talking to.`  *(KEEP — in-voice, no blame.)*

**`pages/Contact.jsx → validate() e.business`**
> `What do we call the operation?`  *(KEEP.)*

**`pages/Contact.jsx → validate() e.email` (empty)**
> `We need a line back to you.`  *(KEEP.)*

**`pages/Contact.jsx → validate() e.email` (malformed)**
> `That email won't deliver — check it.`
*(Was "That email won't deliver." Added the next-step "check it" per `01 §2.2`: say what happened + the next step. Still blames the address, not the person.)*

**`pages/Contact.jsx → validate() e.service`**
> `Pick the branch you need.`  *(KEEP.)*

**`pages/Contact.jsx → validate() e.bottleneck`**
> `Name the bottleneck — that's the whole job.`  *(KEEP — reinforces L7; the field IS the ask.)*

---

## 3 · Flags / open decisions for review

1. **FIELD CUT (recommend, not executed) — drop "Phone".** L6 / Hick's Law: every field leaks completion, and Expedia's single-field cut was worth $12M (`01 §2.2`). Email already gives a reliable line back; phone is redundant at the *intake* stage and can be asked on the reply. **Recommendation: remove the Phone field** (and its row partner becomes a single full-width Email). Kept in this draft because the brief says don't change structure without a flag — this is the flag. If retained, copy above stands.

2. **Button label — confirm the call.** Primary recommendation `Send It — Start the Build`; safe fallback `Start the Build`. Either is an outcome label, never "Submit," never the mechanic "Light the Forge." Owner's pick.

3. **Fineprint now two lines** (risk-reversal + privacy). If the design only wants one line, lead with the risk-reversal line (L4 does more conversion work than the privacy line) and move privacy to a hover/tooltip — but two short lines under a CTA is well within the brutalist fineprint block.

4. **Brand terms verified exact** against `BrandText.jsx` `TERMS`: **Maeve** (in the Voice option) and **GAELWORX / Automatic Execution** spelled per source. No new brand term introduced, so no `TERMS` append needed.

5. **Home-owned keys left untouched:** `COPY.point.body` (lede), `COPY.point.avail` (rail + success). Mirrored the voice; did not rewrite — per brief and to keep `brand.js` the single source for those.
