# GAELWORX — Conversion Copy Revision Pass (DRAFT)

**Editor pass · 2026-06-30 · DRAFT ONLY — no source edits.** Exact `source-path → old → new`
mappings for the orchestrator to integrate. Every price/claim is unchanged. All replacement
strings use curly apostrophes (’) and curly quotes (“ ”) so they drop into the single-quoted
JS strings in `brand.js` without breaking. Brand terms (GAELWORX, Maeve, YardWorx, RepairWorx,
SalesWorx, AgentWorx, Automatic Execution) are spelled exactly so `<BrandText>`/`<Ignite>` keep
igniting them.

The throughline of every cut below: the rewrite was over-forged. The metaphor ("forge,"
"anvil," "steel," "fire," "smith") is doing the work that nouns and numbers should be doing.
The Clan Voice is *clean* and *technical* — not a fantasy novel. Where two sentences say the
same thing, one goes. Where an image is decorative, it's cut. The spine (hero → clan →
arsenal → trust → rates) is treated as highest priority because it's what the owner reads first.

---

## TOP 5 HIGHEST-IMPACT CHANGES

1. **Hero sub (`COPY.hero.sub`)** — the first sentence the visitor reads. Trim "Built to
   execute, not to babysit" cleverness into a harder, plainer benefit line. This sets the
   whole tone; if it's tight, the rest is forgiven.
2. **Clan body (`COPY.clan.body`)** — currently the most overloaded paragraph on the site
   (forge/agency/enemy/clan all crammed into six sentences). Split the load: state what we
   are, name the enemy once, land the differentiator. Cut "on the hook."
3. **Rates lede (`COPY.rates.lede`)** — "the build scaffolding that runs the same every time"
   is jargon the buyer doesn't have. Replace with the plain mechanism. This is the line that
   has to make a low price feel like strength, not discount.
4. **NEW FINISH (replaces the removed `finale` melodrama)** — a single hard close on the
   living obsidian: one line + one CTA pointed at /contact. Two directions below.
5. **Trust rung 03 (`COPY.trust.rungs[2].body`)** — the "No black box" rung is the most
   try-hard paragraph in the trust ladder ("confident nonsense," "machine pretending to be
   the human in the room," "Built to make you sharper, not hooked"). Tighten to one clean
   claim about what AI does and where judgment stays.

---

# FILE: `src/brand.js` (COPY) — the home-journey spine (HIGHEST PRIORITY)

### 1. `COPY.hero.sub`
**Why:** "Built to execute, not to babysit" is a clever-clever tag that softens a strong list.
The em-dash pile-up reads breathless. End on the benefit, not the wordplay.

OLD:
```
'The system that runs your business while you sleep — booking the jobs, killing the busywork, answering every call. Built to execute, not to babysit.'
```
NEW:
```
'One system that books the jobs, answers every call, and kills the busywork — running while you sleep. You command it. It never needs managing.'
```

---

### 2. `COPY.clan.body`
**Why:** Six jobs in one paragraph. "on the hook" is slang filler; "AI theater that demos and
never ships, agencies that bill for motion" is two enemies stacked into one breath. Cut to
three clean beats: what we are → who we run it for ourselves → the enemy → the payoff.

OLD:
```
'GAELWORX is an engineering forge, not an agency. We run our own platforms on this exact system — YardWorx, RepairWorx, SalesWorx, AgentWorx — and forge the same caliber for you. The enemy is the black box: AI theater that demos and never ships, agencies that bill for motion. We move like a clan — small, fast, on the hook. You talk to the people who build it.'
```
NEW:
```
'GAELWORX is an engineering forge, not an agency. We run our own platforms on this exact system — YardWorx, RepairWorx, SalesWorx, AgentWorx — and build the same caliber for you. The enemy is the black box: AI that demos and never ships, agencies that bill for motion. We move like a clan: small, fast, accountable. You talk to the people who write the code.'
```

---

### 3. `COPY.arsenal.intro`
**Why:** "We forge the system that ends it" — the verb "forge" is fine once, but paired with
"ends it" it goes mythic. The line below is sharper and keeps the command-voice.

OLD:
```
'Name the thing eating your week. We forge the system that ends it.'
```
NEW:
```
'Name the thing eating your week. We build the system that ends it.'
```

---

### 4. `COPY.arsenal.branches[0].body` (Software)
**Why:** "The same forge that built YardWorx, built for how you actually run." is a fragment
that repeats "built" twice and trails off. Tighten.

OLD:
```
'Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. You own the code, not a license: no lock-in, no black box. The same forge that built YardWorx, built for how you actually run.'
```
NEW:
```
'Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. You own the code, not a license: no lock-in, no black box. The same system that runs YardWorx, built for how you actually work.'
```

---

### 5. `COPY.arsenal.branches[1].anchor` (Voice)
**Why:** "Maeve never does" is a fine button, but "clocks out … never does" is slightly fussy.
Keep it — minor tighten for parallelism and punch.

OLD:
```
'An in-house receptionist runs $48,000 a year and clocks out. Maeve never does.'
```
NEW:
```
'An in-house receptionist costs $48,000 a year and still clocks out at five. Maeve doesn’t clock out.'
```

---

### 6. `COPY.arsenal.branches[2].body` (Automations)
**Why:** "handing your data back to you to own and leverage like no one else can" is a clause
that overpromises and over-clauses. "hostage tool" is good; keep it. Trim the leverage brag.

OLD:
```
'Quoting, follow-up, invoicing, reviews — running on their own, and handing your data back to you to own and leverage like no one else can. No black box, no hostage tool. The same automations that run our own shops.'
```
NEW:
```
'Quoting, follow-up, invoicing, reviews — running on their own, and handing your data back to you to own. No black box. No hostage tool. The same automations that run our own shops.'
```

---

### 7. `COPY.arsenal.branches[3].body` (Web)
**Why:** "books the truck instead of just looking good" and "Built to the standard of the page
you’re on" are both good, but "Studio-grade, cinematic lead-gen" is two adjectives doing one
job, and the sentence is a run-on. Split.

OLD:
```
'Studio-grade, cinematic lead-gen that routes every lead straight to your phone — and books the truck instead of just looking good. Built to the standard of the page you’re on.'
```
NEW:
```
'A cinematic site that routes every lead straight to your phone and books the truck — not one that just looks good. Built to the standard of the page you’re reading.'
```

---

### 8. `COPY.rates.lede`
**Why:** "the build scaffolding that runs the same every time" is internal jargon — the buyer
has no idea what build scaffolding is. The reconciliation ("you pay less because the forge runs
lean") is the whole point; lead the buyer to it in their language.

OLD:
```
'Automatic Execution systematizes what agencies bill by the hour — the quoting, the follow-up, the build scaffolding that runs the same every time. You don’t pay less for less. You pay less because the forge runs lean.'
```
NEW:
```
'Automatic Execution systematizes what agencies bill by the hour — the quoting, the follow-up, the setup that runs the same on every job. You don’t pay less for less. You pay less because the forge runs lean.'
```

---

### 9. `COPY.trust.rungs[0].body` (We build what we run)
**Why:** "Every build starts from decades on the floor" then "We worked the bottlenecks we
automate and lived the problems we solve" says the same thing twice in two registers. Pick one
and make it concrete.

OLD:
```
'Every build starts from decades on the floor — we’ve run the operation, not read the case study. We worked the bottlenecks we automate and lived the problems we solve, so you never pay us to learn your business on your dime.'
```
NEW:
```
'Every build starts from years on the floor — we’ve run the operation, not read the case study. We worked the bottlenecks we automate, so you never pay us to learn your business on your dime.'
```

---

### 10. `COPY.trust.rungs[1].body` (Built on enterprise ground)
**Why:** "Proven ground. Behavior you can predict. Nothing held together with hope." — three
sentence fragments in a row is a tic that recurs all over the site. Two beats land harder than
three.

OLD:
```
'We build on the same battle-tested rails that run banks and logistics fleets — not last quarter’s frontier model and a crossed-fingers prompt. Proven ground. Behavior you can predict. Nothing held together with hope.'
```
NEW:
```
'We build on the same battle-tested rails that run banks and logistics fleets — not last quarter’s frontier model and a crossed-fingers prompt. Proven ground, predictable behavior, nothing held together with hope.'
```

---

### 11. `COPY.trust.rungs[2].body` (No black box) — TOP 5
**Why:** The most overwritten paragraph in the ladder. "no confident nonsense, no machine
pretending to be the human in the room" + "Built to make you sharper, not hooked" is a stack of
hot takes. State the actual claim: AI does the rote, shows its work, you keep the judgment.

OLD:
```
'We point AI at the rote work — never to breed dependence. No black-box oracle, no confident nonsense, no machine pretending to be the human in the room. It does the grunt work, shows its reasoning, and hands judgment back where it belongs — yours. Built to make you sharper, not hooked.'
```
NEW:
```
'We point AI at the rote work, never at your judgment. No black-box oracle, no machine pretending to be the person in the room. It does the grunt work, shows its reasoning, and hands the call back to you. Built to make you sharper, not dependent.'
```

---

### 12. `COPY.trust.rungs[3].body` (It ships. Then it earns.)
**Why:** Strong rung — minimal touch. "counted in jobs booked, calls answered, hours handed
back" is good and earned; keep it. The last sentence "keeps billing you for all three" is
slightly tortured grammar.

OLD:
```
'No pilots that rot in “phase two.” We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, hours handed back. Every week you wait, the manual way keeps billing you for all three.'
```
NEW:
```
'No pilots that rot in “phase two.” We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, hours handed back. Every week you wait, the manual way keeps taking all three.'
```

---

### 13. `COPY.footer.tag`
**Why:** Clean already, but "the systems that run it" slightly muddles "business/run/it."
Optional polish.

OLD:
```
'You run the business. We forge the systems that run it.'
```
NEW:
```
'You run the business. We build the systems that run it for you.'
```
*(Lower priority — keep original if the orchestrator prefers the tighter cadence.)*

---

# FILE: `src/pages/Software.jsx`

### 14. PROOF body (`pg-software-proof-body`, line ~256)
**Why:** "We don’t point AI at a problem and hope; we build what we’ve already lived." mixes two
metaphors and the "hope" beat is borrowed from the trust ladder. The paragraph also runs four
clauses past its point.

OLD:
```
YardWorx is a proprietary platform we run ourselves — not a case study we read. We don’t point AI at a problem and hope; we build what we’ve already lived. We’ve worked the bottlenecks we automate, so you never pay us to learn your business on your dime. Then we forge the same caliber for you — and hand you the keys.
```
NEW:
```
YardWorx is a proprietary platform we run ourselves — not a case study we read. We’ve worked the bottlenecks we automate, so you never pay us to learn your business on your dime. We build the same caliber for you, and we hand you the keys.
```

---

### 15. PROBLEMS[0].body — "outgrew the rented SaaS" (line ~67)
**Why:** "You’re renting a ceiling." is a nice button but the body before it already says it
three ways ("bend your operation," "wait on a roadmap," "pay more every seat, every year,
forever"). Trim one.

OLD:
```
'The platform that fit at ten jobs a week buckles at fifty. You bend your operation to its limits, you wait on a roadmap that isn’t yours — and you pay more every seat, every year, forever. You’re renting a ceiling.'
```
NEW:
```
'The platform that fit at ten jobs a week buckles at fifty. You bend the operation to its limits and wait on a roadmap that isn’t yours — and the bill climbs every seat, every year. You’re renting a ceiling.'
```

---

### 16. THE PROBLEM lede (`pg-software-lede-strong`, line ~151)
**Why:** "the software stops serving the business — and the business starts serving the
software" is a clean chiasmus and earns its place. But "It costs you every single week" tacked
on the end is the third "costs you" on the page. Cut the redundant tag.

OLD:
```
Rented SaaS you bend the business to. Spreadsheets one bad paste from a lost day. A stack of apps that hold your data hostage and talk to each other through you. At some point the software stops serving the business — and the business starts serving the software. That’s the bottleneck. It costs you every single week.
```
NEW:
```
Rented SaaS you bend the business to. Spreadsheets one bad paste from a lost day. A stack of apps that hold your data hostage and talk to each other only through you. At some point the software stops serving the business — and the business starts serving the software. That’s the bottleneck.
```

---

# FILE: `src/pages/Voice.jsx`

### 17. SOUNDS HUMAN body (`pg-voice-human-body`, line ~160)
**Why:** "a voice that breathes" appears here AND in `brand.js` FAQ — it's becoming a tic.
"They reached a system that answers like one, every single time." is the payoff; keep it. Swap
"breathes" for something concrete.

OLD:
```
Natural pacing. Real interruptions, handled. Your business name, your services, your tone — a script you control, delivered in a voice that breathes. Callers think they reached your best front-desk hire. They reached a system that answers like one, every single time.
```
NEW:
```
Natural pacing. Real interruptions, handled. Your business name, your services, your tone — a script you control, delivered in a voice that sounds hired, not coded. Callers think they reached your best front-desk hire. They reached a system that answers like one, every single time.
```

---

### 18. ROI foot (`pg-voice-roi-foot`, line ~244)
**Why:** "The rest is profit you’re leaving on the machine right now." — "leaving on the
machine" is a strained twist on "leaving on the table." It muddles the metaphor.

OLD:
```
<strong>Roughly an eighth of the cost</strong> — and she catches the calls a receptionist never could. One booked job a month covers her. The rest is profit you’re leaving on the machine right now.
```
NEW:
```
<strong>Roughly an eighth of the cost</strong> — and she catches the calls a receptionist never could. One booked job a month covers her. Everything after that is profit you’re leaving on the table right now.
```

---

# FILE: `src/pages/Automations.jsx`

### 19. INVESTMENT note (`pg-auto-price-note`, line ~240)
**Why:** "It runs the work, it pays for itself." repeats almost verbatim from the lede AND the
sentence right before it ("the build pays for itself inside a month"). Three "pays for itself"
in one card. Cut the middle one and the jargon tail.

OLD:
```
Win back two days a week and the build pays for itself inside a month. It runs the work, it pays for itself. Fixed scope, fixed price — the forge runs lean, so you don’t pay agency rates to systematize what we already systematized.
```
NEW:
```
Win back two days a week and the build pays for itself inside a month. Fixed scope, fixed price — the forge runs lean, so you don’t pay agency rates for work we’ve already systematized.
```

---

### 20. THE BUSYWORK TAX total note (`pg-auto-tax-total-note`, line ~88)
**Why:** "Every single week. By hand, that’s the bill." — "that's the bill" after "the tab"
label and "≈ 18 hrs / week" number is the third money-metaphor in one block. Trim.

OLD:
```
Two full days, gone to admin. Every single week. By hand, that’s the bill.
```
NEW:
```
Two full days, gone to admin — every single week, by hand.
```

---

# FILE: `src/pages/Web.jsx`

### 21. WHY MOST SITES FAIL body (line ~134)
**Why:** "A site that just sits there isn’t marketing. It’s a brochure that quietly hands your
jobs to someone else." is good — keep it. But the sentence before already says "calls the next
shop who picks up," which is the same idea as the Voice page's core line, repeated. The
paragraph is one beat too long.

OLD:
```
They’re digital business cards — a logo, a phone number, a stock handshake. Slow to load, invisible to Google, identical to every competitor. Here’s the leak: the visitor lands, waits, gives up, and calls the next shop who picks up. A site that just sits there isn’t marketing. It’s a brochure that quietly hands your jobs to someone else.
```
NEW:
```
They’re digital business cards — a logo, a phone number, a stock handshake. Slow to load, invisible to Google, identical to every competitor. The visitor lands, waits, gives up, and calls the next shop. A site that just sits there isn’t marketing — it’s a brochure that quietly hands your jobs to someone else.
```

---

### 22. THE GAELWORX STANDARD lede (`pg-web-std-lede`, line ~195)
**Why:** "Anyone can ship a template. GAELWORX ships craft" is a strong open. But the line then
piles "Automatic Execution, in the browser. Real motion. Sharp brutalist build. Built to the
standard of the page you’re on, and aimed at the only number that matters: the truck booked." —
that's five fragments and two restatements of "the standard of the page" (already in the page
hero). Cut to the parallel and the payoff.

OLD:
```
Anyone can ship a template. GAELWORX ships craft — Automatic Execution, in the browser. Real motion. Sharp brutalist build. Built to the standard of the page you’re on, and aimed at the only number that matters: the truck booked.
```
NEW:
```
Anyone can ship a template. GAELWORX ships craft — Automatic Execution, in the browser. Real motion, a sharp brutalist build, aimed at the only number that matters: the truck booked.
```

---

# FILE: `src/pages/Work.jsx`

### 23. Lede (`PageShell lede`, line ~100)
**Why:** "Not a logo wall we rented — four platforms we forged and still run." is good, but the
lede opens with "We didn’t read the case study — we built the company in it." which is nearly
identical to the About/Software "run the operation, not read the case study" line. On the proof
page it should lead with the proof, not the slogan. Reorder so the four names hit first.

OLD:
```
We didn’t read the case study — we built the company in it. YardWorx, RepairWorx, SalesWorx, and AgentWorx are ours: shipped, in production, running real work every day. That’s the proof. Not a logo wall we rented — four platforms we forged and still run. This is the caliber we build for you.
```
NEW:
```
YardWorx, RepairWorx, SalesWorx, and AgentWorx are ours — shipped, in production, running real work every day. Not a logo wall we rented: four platforms we built and still run ourselves. That’s the proof, and that’s the caliber we build for you.
```

---

### 24. THE FORGE'S OWN intro (`pg-work-intro`, line ~111)
**Why:** "Same forge. Same fire. Same caliber we build for you." — three "Same X" fragments is
the recurring tic at its most concentrated. One "same" lands; three is a chant.

OLD:
```
Most studios show you someone else’s results and ask you to trust the screenshot. We hand you ours. YardWorx, RepairWorx, SalesWorx, and AgentWorx run live, in the trades we came up in — built, owned, and operated by GAELWORX. Same forge. Same fire. Same caliber we build for you.
```
NEW:
```
Most studios show you someone else’s results and ask you to trust the screenshot. We hand you ours. YardWorx, RepairWorx, SalesWorx, and AgentWorx run live, in the trades we came up in — built, owned, and operated by GAELWORX. The same caliber we build for you.
```

---

# FILE: `src/pages/About.jsx`

### 25. THE CLAN ETHOS first para (line ~61)
**Why:** "The hand that writes the code is the hand you shake." is a strong closer — keep it.
But it's immediately followed in the next paragraph by "The same hands that forged … sit across
from you" — "hand(s)" three times in two paragraphs. Vary the second.

OLD (second para, line ~63):
```
You talk to the people who build it. The same hands that forged YardWorx, RepairWorx, SalesWorx, and AgentWorx sit across from you and answer for the system that runs your business. We eat our own forge before we sell you a bite of it.
```
NEW:
```
You talk to the people who build it. The same team that built YardWorx, RepairWorx, SalesWorx, and AgentWorx sits across from you and answers for the system that runs your business. We run our own platforms before we sell you one.
```
*(Cuts "eat our own forge … bite of it" — the metaphor breaks down literally; "run our own
platforms before we sell you one" is the cleaner, more credible version of "eat your own
dogfood.")*

---

### 26. THE FOUNDING ENEMY turn (`pg-about-enemy-turn`, line ~127)
**Why:** "The fire is for the fakes. The forge is for you." is a clean two-beat button — keep
that. But the sentence before stacks "burn it down and build the system that should have been
there — owned by you, documented to you, running the work on day one" — fine, but "should have
been there" is vague. Minor tighten.

OLD:
```
We do not sell the theater. We burn it down and build the system that should have been there — owned by you, documented to you, running the work on day one. The fire is for the fakes. The forge is for you.
```
NEW:
```
We do not sell the theater. We burn it down and build the system you should have had all along — owned by you, documented to you, running the work on day one. The fire is for the fakes. The forge is for you.
```

---

# FILE: `src/pages/Contact.jsx`

### 27. Success body (line ~261)
**Why:** "The leak’s been bleeding long enough — we go to work now." mixes "leak" and
"bleeding" (a leak doesn't bleed) and "we go to work now" is abrupt. Clean the metaphor.

OLD:
```
We have it{business ? <> — and we know <strong>{business}</strong></> : null}. A real answer lands inside 24 hours: the build, the price, and the day it ships. The leak’s been bleeding long enough — we go to work now.
```
NEW:
```
We have it{business ? <> — and we know <strong>{business}</strong></> : null}. A real answer lands inside 24 hours: the build, the price, and the day it ships. The bottleneck’s cost you long enough. We start now.
```

---

# FILE: `src/pages/Pricing.jsx`

### 28. CTA lede (`pg-cta` / `pg-lede`, line ~211)
**Why:** Clean, but "working on day one" + "We carry the risk; you pay when it executes" repeats
the exact risk-reversal line from the form fineprint and the trust ladder verbatim. On the
pricing CTA, lead with the number-promise (the page's job), keep the risk line once.

OLD:
```
Tell us the bottleneck. We put an honest price on ending it — fixed scope, fixed price, working on day one. We carry the risk; you pay when it executes.
```
NEW:
```
Tell us the bottleneck. We put an honest price on ending it — fixed scope, fixed price, before you owe a thing. We carry the risk; you pay when it executes.
```

---

# THE NEW FINISH — replacing the removed finale

**Context for the orchestrator.** The owner is killing the scroll-jacked "finale" act (problems
drain in big Cinzel → mandala → GAELWORX wordmark + "Start the Forge" rise). He called it "that
ugly ending story." `COPY.finale` and the scene work are owned by the orchestrator — this draft
only supplies the *replacement closing copy* and the structural note. The home spine after this
change ends: `hero → draw → clan → arsenal → trust(×5) → rates → [NEW CLOSE]`.

**The principle.** The rates ledger is now the penultimate beat — the buyer has just seen the
whole anchored price ladder. The close should NOT re-narrate the problems (that's the melodrama
the owner hates). It should do exactly one thing: convert. One headline line, one CTA, one
availability stamp, resolving on the living obsidian background. Attention Ratio 1:1 — "Point
the Sword." No second link, no nav distraction, no mandala, no draining type. It lands as a
calm, hard full-stop after the loud journey: the slab settles, one line etches in (the standard
blur-to-sharp Forge Reveal, not a spiral), the sword appears under it, and it HOLDS to the
bottom of the scroll. The CTA goes to `/contact`. This is the same `magnetic` solid CTA used in
the hero, closing the loop the hero opened ("Start the Forge" → "Start the Forge").

Two directions below — pick one. Both are simple, both resolve on the obsidian, both are a
single CTA to /contact.

---

## DIRECTION A — "Name the bottleneck." (the command close — RECOMMENDED)

The whole site has trained one verb: *name it, we end it.* The close pays that off. It echoes
`COPY.point.head` ("Name the bottleneck.") and the Contact page title, so the journey resolves
into the exact action the form asks for. Cleanest possible loop; most on-voice (direct command,
zero fluff).

**Closing copy:**
- **Line (Cinzel display, etches in blur-to-sharp):** `One system runs the work. You run the day.`
- **Sub-line (grotesk, one beat under it):** `Name the bottleneck. We put a number on ending it — before you owe a thing.`
- **CTA (solid, magnetic):** `Start the Forge`
- **Availability stamp (mono, beneath CTA):** `Available · Continental US · 7 Days`

Proposed `COPY` shape (orchestrator owns the key name — `finale` is theirs; suggest renaming to
`close`):
```js
close: {
  line: 'One system runs the work. You run the day.',
  sub: 'Name the bottleneck. We put a number on ending it — before you owe a thing.',
  cta: 'Start the Forge',
  avail: 'Available · Continental US · 7 Days',
},
```

**How it lands structurally:** No problems layer, no mandala, no spin. The obsidian slab is the
whole stage. As the close frame settles, `line` reveals via the standard per-char etch
(blur→sharp, ember trail) — the same `ForgeText`/`flame` treatment used on every heading, NOT a
bespoke drain. The `sub` fades in a half-beat later, the CTA rises just under it (the existing
`fin-cta` rise is fine), and all three HOLD to the bottom of the track (opacity envelopes end at
c,d > 1, exactly as the current mark/CTA already do). Single CTA → `/contact`. The GAELWORX
wordmark is NOT repeated here (it already lives in the nav/footer and opened the journey in the
hero) — repeating it was part of what made the old ending feel like a curtain call. One line,
one sword. That's the close.

---

## DIRECTION B — "The forge is lit." (the resolution close)

If the owner wants a hair more warmth/finality than a pure command, this lands the journey on
the forge metaphor *once*, cleanly — the fire that's been the throughline resolves to a steady
burn rather than a melodramatic drain. Pairs the brand's core image with the hard CTA without
the four-line problem dirge.

**Closing copy:**
- **Line (Cinzel display, etches in):** `The forge is lit. Bring the work.`
- **Sub-line (grotesk):** `Fixed scope. Fixed price. Working on day one. We carry the risk — you pay when it executes.`
- **CTA (solid, magnetic):** `Start the Forge`
- **Availability stamp (mono):** `Available · Continental US · 7 Days`

Proposed `COPY` shape:
```js
close: {
  line: 'The forge is lit. Bring the work.',
  sub: 'Fixed scope. Fixed price. Working on day one. We carry the risk — you pay when it executes.',
  cta: 'Start the Forge',
  avail: 'Available · Continental US · 7 Days',
},
```

**How it lands structurally:** Identical staging to Direction A — obsidian background, single
etch-in line, sub a half-beat later, CTA under it, all holding to the end, one link to
`/contact`. The only difference is the copy register: B re-banks the risk-reversal ("we carry
the risk — you pay when it executes") as the final word, which is the strongest single
high-ticket lever to leave a buyer on. Note: "The forge is lit." also appears as the Contact
success state (`pg-contact-success-head`) — if the orchestrator wants the close and the
post-submit confirmation to rhyme, B does that intentionally (the close *promises* the forge is
lit; the form submit *confirms* it). If that echo feels repetitive, choose A.

**Editor's pick:** **Direction A.** It's the most on-voice (a command, not a mood), it loops the
trained verb ("Name the bottleneck") straight into the Contact page, and it doesn't lean on the
forge metaphor that's already heavily worked across the site. B is the safe second choice and is
stronger if the owner wants the risk-reversal as the literal last line.

---

## NOTES FOR INTEGRATION
- All `brand.js` replacements are single-line JS string values — drop-in safe with the curly
  punctuation as written.
- The `.jsx` replacements (#14–#28) are JSX text nodes; the curly-quote characters are already
  literal in those files, so matching/replacing in-place is safe.
- Nothing here touches `COPY.faq` (the AEO answer strings) — those are factual extracts keyed to
  prices and were left exact on purpose. If the orchestrator wants the FAQ "a voice that
  breathes" / "leverage like no one else can" lines aligned with the body edits above (#17, #6),
  flag it and I'll supply matching FAQ rewrites that preserve the ≤320-char + literal-fact-first
  rule.
- No price, anchor, deposit, or timeframe was changed anywhere in this pass.
