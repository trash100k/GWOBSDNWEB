# GAELWORX — Research, Consolidated

**The single home for every research doc in this project.** Auto-assembled 2026-06-30 from the files under `docs/research/`. Each source file is embedded verbatim below under its own heading; the original files are kept in place as the editable sources. Re-run `python3 scripts/build-research.py` to refresh this consolidation after editing any source.

---

## Table of Contents

- **Part I · Copy & Persuasion — the system**
  - `docs/research/copy/README.md`
  - `docs/research/copy/01-modern-web-copy.md`
  - `docs/research/copy/02-copy-frameworks.md`
  - `docs/research/copy/03-brand-archetypes.md`
  - `docs/research/copy/04-dark-levers.md`
  - `docs/research/copy/05-high-ticket.md`
  - `docs/research/copy/06-copy-and-design.md`
  - `docs/research/copy-architecture-and-dark-persuasion.md`
  - `docs/research/copy-deep-dive-advanced.md`
- **Part II · Pricing & the Sales Journey**
  - `docs/research/2026-pricing-journey-and-design.md`
- **Part III · Scene · 3D · Visual craft**
  - `docs/research/faceted-obsidian-jewel.md`
  - `docs/research/mandala-construction-and-animation.md`
  - `docs/research/typography-3d-fontplay.md`
  - `docs/research/color-palette-systems.md`
- **Part IV · Motion & Pacing**
  - `docs/research/pacing-fluidity-snap.md`
  - `docs/research/pacing-motion-deep-dive.md`
- **Part V · Performance & Core Web Vitals**
  - `docs/research/webgl-performance-cwv.md`
- **Part VI · Lead Capture & Nurture**
  - `docs/research/lead-capture-and-nurture.md`
- **Part VII · Deploy & Ops**
  - `docs/research/vercel-hobby-deploy-limits.md`
  - `docs/research/cloudflare-pages-migration.md`
- **Part VIII · Appendix — Copy application drafts (per-page lever maps + final strings)**
  - `docs/research/copy/drafts/home.md`
  - `docs/research/copy/drafts/software.md`
  - `docs/research/copy/drafts/voice.md`
  - `docs/research/copy/drafts/automations.md`
  - `docs/research/copy/drafts/web.md`
  - `docs/research/copy/drafts/work.md`
  - `docs/research/copy/drafts/about.md`
  - `docs/research/copy/drafts/contact.md`
  - `docs/research/copy/drafts/pricing.md`
  - `docs/research/copy/drafts/revision-pass.md`


---

# Part I · Copy & Persuasion — the system

<!-- ============================================================ -->
## Source: `docs/research/copy/README.md`

# Copy & Persuasion research set (parallel agent fan-out)

Six deep-research docs, one per subject — each agent also surfaced and researched **3
related sub-subjects**. Companion to `../copy-architecture-and-dark-persuasion.md`
(synthesis) and `../copy-deep-dive-advanced.md` (extrapolation).

| # | Doc | Subject | + 3 sub-subjects researched |
|---|---|---|---|
| 01 | [modern-web-copy](01-modern-web-copy.md) | the craft (clarity, specificity, mechanics, AI-era voice moat) | microcopy/UX writing · conversion copy · voice-and-tone systems |
| 02 | [copy-frameworks](02-copy-frameworks.md) | AIDA/PAS/BAB/SB7/PASTOR/QUEST + Schwartz two dials + Objection Cascade | awareness/sophistication · VSL/sales-letter leads · funnel/email sequences |
| 03 | [brand-archetypes](03-brand-archetypes.md) | the 12 + families + the SHADOW; archetype→copy | NN/g tone systems · challenger-brand (Eating the Big Fish) · StoryBrand storytelling |
| 04 | [dark-levers](04-dark-levers.md) | Cialdini 7 + the cognitive-bias arsenal + 4 amplifiers | behavioral-econ/nudges · neuromarketing · the enemy-narrative |
| 05 | [high-ticket](05-high-ticket.md) | high-ticket as a RISK problem; risk-reversal ladder | prestige pricing · guarantee design · the ~6-month B2B journey |
| 06 | [copy-and-design](06-copy-and-design.md) | copy×design as one system + the dark-UX/FTC line | dark-pattern law · conversion-centered design · visual hierarchy/attention |

## The cross-cutting strategy (what all six converge on)
1. **Win on MECHANISM + IDENTITY, not louder claims.** The "AI for your business" market is at
   Schwartz **Sophistication Stage 3–4** — generic benefit claims are dead. Lead with the unique
   mechanism ("Automatic Execution" / the Forge / Maeve / the Worx system, documented + owned) and
   the identity (the Clan ethos / who it's for). *(01, 02, 03)*
2. **Aim the Outlaw×Hero×Ruler×Clan voice at a shared ENEMY** — manual drudgery + "AI theater" +
   bloated agencies — **never the customer.** The Hero's *service* + the StoryBrand guide role +
   the challenger "build, don't just burn" credo keep the Outlaw edge from tipping into its
   nihilist shadow. *(03, 04)*
3. **Frame the COST OF INACTION louder than the upside** (loss looms ~2×). Present-tense pain,
   future-pace the after-self. *(04, 05)*
4. **De-risk relentlessly — high-ticket is a RISK problem, not a value problem.** Risk-reversal
   ladder: specificity → authority → fixed-scope/price → deposit-as-filter → "we carry the risk."
   It's a ~6-month, multi-stakeholder sequence, not a page. *(02, 05)*
5. **Design IS the argument** (aesthetic congruence) and **Attention Ratio 1:1** ("Point the
   Sword"). *(06)*
6. **Keep every lever TRUE.** On a $1,299–$35k trust sale, durable levers compound trust; deceptive
   dark patterns (fake timers, drip pricing, roach-motel cancel, confirmshaming) borrow against it —
   and the FTC is enforcing hard ($2.5B Amazon, Epic $245M). Persuade the entrance, never trap the
   exit. *(04, 06)*

## Biggest unbuilt lever
**Real proof — the `/work` case-study page** (named, same-trade, specific results). It fires social
proof + specificity + authority at once and is the single highest-ROI copy build remaining.

<!-- ============================================================ -->
## Source: `docs/research/copy/01-modern-web-copy.md`

# Modern Web Copywriting Craft (2026)

> **Scope:** The mechanisms, named models, and data behind copy that reads itself, converts, and stays defensibly human in an AI-flattened web — plus how GAELWORX should weaponize all of it in the Clan Voice.

---

## 1. Main subject — Modern web copywriting craft

Modern web copy is not "good writing." It is **engineering applied to attention**: every line exists to earn the next line, every word is load-bearing, and the whole page is tuned to move a specific reader from where they are to a single decision. Four mechanisms drive the craft. Below each is the *real* mechanism, not the platitude.

### 1.1 Clarity beats cleverness — and it's measurable

The single most-repeated finding in 2025–26 copywriting research: **clear copy out-converts clever copy in head-to-head A/B tests.** Clarity is the #1 desired trait in marketing communication across every age demographic, and pun/wordplay-driven headlines lose to plain, specific ones in conversion tests ([WRIXON](https://wrixon.com/clarity-cleverness-copywriting/), [The Creative Brand](https://www.thecreativebrand.io/newsletter/022-clear-or-clever-copywriting)). The mechanism: a clever line forces a micro-pause to "decode" — and any cognitive friction at the point of decision leaks conversions. Cleverness is allowed *only after* the meaning is instantly clear (clarity is the floor; wit is a finish, never a substitute).

**The operational test:** would a smart 12-year-old understand it on first read? If not, cut. Cleverness that survives the clarity bar is a bonus; cleverness that replaces clarity is a tax.

### 1.2 Conversational voice + the read-aloud test

The dominant register of modern web copy is **spoken, not written.** Supporting data: ~78% of professionals rank conversational tone as vital in email/social copy; ~74% say conversational, community-first messaging beats polished corporate tone; and copy that "sounded human" was rated ~3x more trustworthy than copy that felt scripted ([SolidGigs](https://solidgigs.com/blog/the-best-copywriting-techniques-2025-from-beginner-to-advanced-strategies/), [Magnet](https://magnet.co/articles/an-idiots-guide-to-writing-killer-web-copy)).

**The read-aloud test** is the enforcement mechanism: read the copy out loud. If you stumble, if it sounds like something a human would never say to another human across a table, rewrite it until it flows. Stumbles expose: over-long sentences, abstract nouns, passive constructions, and "corporate throat-clearing." (Conversational ≠ sloppy — it means contractions, short sentences, direct address, and the cadence of speech.)

### 1.3 Specificity and outcome-first messaging

Vague copy is invisible; specific copy is sticky. Specificity ("$1M in sales," "sold a $250K truck," "121K followers," "complete X 10× faster") builds instant trust and credibility because real numbers can't be faked by a fluff machine ([Alphap](https://alphap.tech/how-to-use-persuasive-copywriting-and-marketing-strategies-to-close-high-ticket-b2b-sales/)). The core move is **outcome-first** — lead with the changed life, not the spec sheet — driven by two named tools:

- **The "So What?" test (features → benefits → outcome).** List a feature, then ask "so what?" repeatedly until you hit a meaningful emotional outcome. Feature: "automated reconciliation." So what? "You don't touch the spreadsheet." So what? "You close the books in a day, not a week." So what? "You stop dreading month-end." That last layer is the copy ([UserEvidence](https://userevidence.com/podcast/the-proof-point/where-to-focus-your-messaging-features-vs-benefits-vs-outcomes/), [LogRocket](https://blog.logrocket.com/product-management/benefits-features-value-proposition-design/)).
- **The nuance the experts add:** outcomes *alone* become generic "me-too" copy ("grow your business," "save time" — true of everyone). The high-conversion pattern is **outcome anchored to a specific mechanism/number**: not "increase efficiency" but "complete X task 10× faster so you free up Y." Sophisticated buyers want the *what* and *how* under the outcome, because that's what makes it believable and memorable ([Forget the Funnel](https://forgetthefunnel.com/resources/ep-18-features-vs-benefits)).

### 1.4 Line-level mechanics — the engine room

This is the craft most "AI advice" skips, and it's exactly what separates engineered copy from generated copy.

- **The Slippery Slide (Joe Sugarman).** From *The Adweek Copywriting Handbook*: "Your readers should be so compelled to read your copy that they cannot stop reading until they read all of it." **The sole purpose of the first sentence is to get them to read the second sentence; the second sentence's only job is the third.** Sugarman deliberately makes the first sentence almost absurdly short and easy ("Losing weight is not easy." / "This is a warning.") so there's zero resistance to entering the slide. This is the man who sold 10,000,000 BluBlocker sunglasses on the strength of copy ([AWAI](https://www.awai.com/2021/10/the-slippery-slide-technique-for-writing-web-copy/), [Upgrow](https://www.upgrow.io/blog/joe-sugarman-slippery-slide-landing-page-style)).
- **Seeds of curiosity (greasing the chute).** Sugarman ends paragraphs with open loops that *pull* the eye downward: "But there's more." / "So read on." / "Let me explain." / "But that's not all." Each one is a tiny cliffhanger that makes stopping feel like leaving a sentence unfinished ([This Is Copy](https://thisiscopy.com/joseph-sugarmans-copywriting-approach/)).
- **Bucket brigades.** Named for the firefighting human-chain, these are short transition phrases — usually ending in a colon or starting a paragraph — that "pass attention" from one block to the next so it never drops: *Here's the thing: · But it gets better: · Now, watch this: · Truth is, · Here's why: · This means: · As a result, · But that's not all.* They tap raw curiosity and keep the reader on the slide ([Copyhackers](https://copyhackers.com/engage-bucket-brigade-technique/), [writeonline.io](https://writeonline.io/blog/bucket-brigade-copywriting/)).
- **Active voice + second person + strong verbs.** Active voice is "how you talk to your friends" — direct, urgent, confident; it names the actor and the action, which reads as accountability. Second person ("you/your") makes the reader the protagonist. Strong, concrete verbs replace weak verb+noun constructions ("we provide assistance" → "we help"; "make a decision" → "decide") ([Purdue Global Writing](https://purdueglobalwriting.center/2025/08/29/wake-up-your-writing-the-case-for-active-vs-passive-voice/), [UW-Madison Writing Center](https://writing.wisc.edu/handbook/ccs_activevoice/)).
- **Rhythm via sentence variation.** Vary length deliberately: a string of short punches, then one longer line, then a fragment. Sameness of length lulls; variation creates cadence and lets a short sentence *land*. "This is the move. The one that closes." Read-aloud is how you tune it.
- **Sell on emotion, justify with logic (Sugarman).** People decide emotionally and rationalize logically, so copy supplies the feeling *and* the proof to defend the decision after the fact — the specificity and proof points exist to let an already-convinced buyer feel safe.

---

## 2. Three related sub-subjects

### 2.1 Conversion copywriting & message-to-market match

**Why it pertains:** GAELWORX sells a high-ticket decision. "Pretty" copy is worthless if it doesn't match the *right message to the reader's current mental state*. This is the discipline that decides *what* to say, before craft decides *how*.

**Deep findings:**

- **Eugene Schwartz — 5 Stages of Awareness** (from *Breakthrough Advertising*). A prospect sits at one of five rungs, and the headline must meet them on *their* rung: **Unaware** → **Problem-Aware** → **Solution-Aware** → **Product-Aware** → **Most Aware.** Most-Aware buyers want the offer/price/CTA up front; Problem-Aware buyers will bounce on a price-first headline because they haven't accepted they have the problem yet. Schwartz's core law: **you cannot create desire — you channel existing desire** already in the prospect's mind ([Copyposse](https://copyposse.com/blog/5-levels-of-market-awareness-how-to-speak-to-your-target-audience-part-1/), [LeadGen Economy](https://www.leadgen-economy.com/blog/five-stages-awareness-lead-generation/)).
- **Schwartz — 5 Stages of Market Sophistication.** As a market hears the same claim repeated, claims stop working in sequence: (1) be first to state the claim → (2) out-claim with a bigger number → (3) introduce a *mechanism* ("how it works") → (4) elaborate/make the mechanism easier → (5) identify with the prospect's identity. The AI-implementation market is at stage 3–4: bald claims ("we use AI") are dead; **the differentiator is a believable, specific mechanism** ([Motive in Motion](https://www.motiveinmotion.com/market-sophistication/), [NordicCopy](https://nordiccopy.com/market-sophistication/)).
- **Joanna Wiebe / Copyhackers — Voice-of-Customer (VoC).** The foundational move of conversion copywriting: **don't write copy — mine it.** Pull headlines, objections, and phrasing verbatim from customer language (reviews, sales calls, support tickets, surveys), because the customer's own words convert better than anything a copywriter invents. "Copywriting starts with message-finding, and message-finding starts with VoC." Process: define → find → research the voice of the customer, then assemble copy from real swipe-able quotes ([Copyhackers VoC](https://copyhackers.com/voice-of-customer-in-your-brand/), [Copyflight](https://www.copyflight.com/voice-of-customer-research-better-copywriting/)).

### 2.2 UX microcopy / content-design systems

**Why it pertains:** On a high-ticket site the conversion doesn't happen in the hero — it happens at the button, the form field, the error, the confirmation. Microcopy is where trust is won or lost at the moment of action, and tiny words move real money.

**Deep findings:**

- **The two reference works.** Kinneret Yifrah's *Microcopy: The Complete Guide* (frameworks for buttons, error messages, empty states, success states, form labels, "voice & tone" in micro-context) and Torrey Podmajersky's *Strategic Writing for UX* (align every word to a measurable business + user goal; integrate writing into the design process and *measure* it) ([Amazon/Yifrah](https://www.amazon.com/Microcopy-Complete-Guide-Kinneret-Yifrah/dp/B07N1RD7W6), [CourseUX](https://courseux.com/ux-writing-guide/)).
- **Microcopy moves measurable money (the proof):**
  - **Veeam** changed one button from "Request a Quote" → "**Request Pricing**" and saw a **+161.66% lift in click-through** (0.54% → 1.40%, 99.9% confidence). Reason: visitors actually wanted *price*, and the old label implied a sales gauntlet ([CXL](https://cxl.com/blog/microcopy/), [FormKeep](https://blog.formkeep.com/how-tweaking-your-microcopy-can-instantly-double-your-conversion-rates/)).
  - **Expedia** removed a single optional "Company" field that confused users → **+$12M in annual profit** ([Econsultancy](https://econsultancy.com/conversion-rate-optimisation-eight-case-studies-that-show-the-benefit-of-ux-testing/)).
- **Rules that recur across the literature:**
  - **Button labels state the outcome, not the mechanic.** "Get Instant Access" / "Start Your Free Trial" beats "Submit" / "Click Here," because the label should answer "what do I get?" ([SolidGigs](https://solidgigs.com/blog/the-best-copywriting-techniques-2025-from-beginner-to-advanced-strategies/)).
  - **Error messages: say what happened, why, and the next step — never blame the user.** Tone *softens* exactly when the user is frustrated (see 2.3).
  - **Empty states are a sales opportunity**, not dead space — tell the user what goes here and how to fill it.
  - **Form microcopy kills anxiety** at the exact friction point ("We'll never share this," "Takes 30 seconds," "No card required").

### 2.3 Voice-and-tone systems (style guides that scale a brand)

**Why it pertains:** A *voice* is fixed (the brand's personality); *tone* flexes by context. Without a documented system, a brand as distinctive as GAELWORX dissolves the moment more than one person — or one AI — writes a line. This is how the Clan Voice stays the Clan Voice at scale.

**Deep findings:**

- **NN/g — The Four Dimensions of Tone of Voice.** Any piece of digital content can be plotted on four spectrums: **Formal ↔ Casual · Serious ↔ Funny · Respectful ↔ Irreverent · Matter-of-fact ↔ Enthusiastic.** Combine them and you get one of **16 tone profiles**. NN/g's research finding: tone measurably shifts perceived *friendliness, trustworthiness, and desirability* — and the *right* tone for the context raises both satisfaction and the brand's perceived competence ([NN/g](https://www.nngroup.com/articles/tone-of-voice-dimensions/)).
- **Voice is constant; tone moves with the user's emotional state.** Mailchimp is the canonical example: voice = clear, genuine, dryly witty expert; **tone flexes by situation** — celebratory on a success screen, calm and plain on an error, never joking when the user is stuck. Their governing rule: **"it's more important to be clear than to be entertaining,"** and **"don't go out of your way to make a joke — forced humor is worse than none."** Humor is a seasoning, deployed only when it comes naturally and the moment allows ([Mailchimp Style Guide](https://styleguide.mailchimp.com/voice-and-tone/), [Big Star](https://www.bigstarcopywriting.com/blog/brand-strategy/how-to-create-tone-of-voice-guidelines/)).
- **A usable style guide is built from contrasts and examples, not adjectives.** "We are X, not Y" pairs ("Confident, not arrogant"; "Direct, not rude") plus **side-by-side ✅/❌ rewrites** are what make a guide enforceable — by humans and by AI prompts.

### 2.4 (Cross-cutting) The AI-era homogenization problem & defensible voice

This underpins all three sub-subjects and is the strategic reason craft matters more than ever.

- **The mechanism of sameness.** Out-of-the-box LLM output is engineered to be "acceptable for everyone, distinctive for no one." It defaults to the **statistical center of its training data** — consensus, balance, the safe middle — which is the *opposite* of the asymmetric, opinionated position that makes a brand defensible. Symptoms: the universal hook→problem→solution→CTA template, tidy tricolons, "it's not just X, it's Y," em-dash overuse, and zero point of view ([CXL](https://cxl.com/blog/ai-content-and-the-silent-erosion-of-brand-voice/), [Advertising Week](https://advertisingweek.com/when-it-comes-to-content-the-choice-isnt-human-vs-ai-its-generic-vs-genuine/)).
- **The data.** Italy's April-2023 ChatGPT ban is a natural experiment: when Milan businesses lost AI access, their social content became measurably **more lexically diverse and syntactically varied** — and average engagement (likes) rose ~3.5%. AI access also drove *more, longer* posts for *less* engagement. Translation: AI scaled volume and scaled sameness ([SSRN — Kreitmeir & Raschky](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4422548), [Frontiers in Education corpus study](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1616935/full)).
- **The defense.** In a sea of synthetic sameness, recognizably human, specific language is a "**cryptographic signature of authenticity**" — it signals (a) someone actually knows this, (b) the POV is shaped by lived experience not scraped corpus, and (c) "this brand talks *to* me, not *at* me." Tactics: a strong documented voice, real first-person specifics/numbers, an opinionated stance, and proprietary VoC language no competitor's prompt can reproduce ([Advertising Week](https://advertisingweek.com/when-it-comes-to-content-the-choice-isnt-human-vs-ai-its-generic-vs-genuine/), [Contentstack](https://www.contentstack.com/blog/ai/how-do-we-maintain-our-unique-brand-voice-when-using-ai)).

---

## 3. GAELWORX application — copy on a high-ticket Clan-Voice site

GAELWORX is selling a $1,299–$35,000 decision into a stage-3/4-sophistication market where "we use AI" is noise. Every principle above maps directly:

**Strategy (what to say):**
- **Lead with mechanism + specific outcome, never "AI."** Schwartz says claims are dead; mechanisms convert. Show the *how* (Maeve, AgentWorx, the exact loop) and tie it to a number/outcome.
- **Awareness-match your routes.** A cold visitor is Problem/Solution-Aware (sell the *changed life*: "stop drowning in manual ops"); a pricing/booking page visitor is Most-Aware (lead with the offer and "Point the Sword"). Don't price-first a stranger.
- **Mine VoC, don't invent.** Pull exact phrases from sales calls/clients ("I'm tired of hiring for this," "it just runs now"). Verbatim customer language is the one thing no competitor's ChatGPT prompt can scrape — your defensible voice.

**Craft (how to say it):**
- **Brutalist Snap copy = the slippery slide with short, hard first sentences.** "You're losing hours. Every day." Then grease the chute downward with Clan-flavored bucket brigades: "Here's the cost: · Now watch: · This is the part they don't tell you:".
- **Active voice + direct command only.** The Clan Voice forbids passive voice; this *is* the active-voice/"Point the Sword" CTA rule. Every CTA is an imperative verb.
- **Document the Clan Voice on the NN/g grid + ✅/❌ pairs** so it survives scale and AI assistance. Position: **Casual-leaning-direct · Serious · Irreverent · Matter-of-fact** (confidence reads as understatement, not exclamation). Pair rules: "Aggressive, not hype." / "Specific, not vague." / "Battle-tested, not boastful."
- **Microcopy in the Clan Voice.** Buttons state the outcome ("Claim Your Build," not "Submit"). Errors stay calm and blame the system, never the user. Form fields kill anxiety ("Takes 2 minutes. No card.").

### Before → After (Clan Voice)

**Hero headline**
- ❌ Before: *"We leverage cutting-edge AI solutions to help businesses optimize their operational efficiency and unlock growth."*
- ✅ After: **"Your ops run on people who'd rather be doing real work. We automate the grind so they don't. Automatic Execution. Clan Protected."** *(specific outcome, active voice, mechanism implied, brand terms ready to ignite)*

**Primary CTA (button + microcopy)**
- ❌ Before: *"Submit Request" — "Fill out the form and a representative will be in touch."*
- ✅ After: Button: **"Claim Your Build"** · Sub: **"Two-minute brief. We tell you straight if we can't help. No card."** *(outcome-label button, anxiety-killing microcopy, blunt honesty as proof)*

**Service block (features → outcome)**
- ❌ Before: *"RepairWorx offers automated ticket routing, AI triage, and 24/7 response capabilities to improve your support workflow."*
- ✅ After: **"RepairWorx catches the ticket, reads it, routes it, and answers it — at 3 a.m., without you. Your team stops triaging. They start fixing."** *(So-What-tested to the real outcome, concrete verbs, second person, slippery-slide rhythm)*

**Error microcopy (tone flexes, voice holds)**
- ❌ Before: *"Error: Invalid input. Please try again."*
- ✅ After: **"That didn't go through — our side, not yours. Give it another swing."** *(calm under frustration, blames the system, stays in-voice)*

---

## 4. Sources

**Line-level mechanics & craft**
- [AWAI — The Slippery Slide Technique for Web Copy](https://www.awai.com/2021/10/the-slippery-slide-technique-for-writing-web-copy/)
- [Upgrow — Joe Sugarman's Slippery Slide for Landing Pages](https://www.upgrow.io/blog/joe-sugarman-slippery-slide-landing-page-style)
- [This Is Copy — Joseph Sugarman's Copywriting Approach](https://thisiscopy.com/joseph-sugarmans-copywriting-approach/)
- [JeremyMac — 5 Timeless Secrets from The Adweek Copywriting Handbook](https://www.jeremymac.com/blogs/news/5-timeless-copywriting-secrets-from-the-adweek-copywriting-handbook-that-will-transform-your-copywriting-skills)
- [Copyhackers — Engage with the Bucket Brigade Technique](https://copyhackers.com/engage-bucket-brigade-technique/)
- [writeonline.io — Bucket Brigade Phrases Cheat Sheet](https://writeonline.io/blog/bucket-brigade-copywriting/)
- [Purdue Global Writing Center — Active vs. Passive Voice (2025)](https://purdueglobalwriting.center/2025/08/29/wake-up-your-writing-the-case-for-active-vs-passive-voice/)
- [UW-Madison Writing Center — Use the Active Voice](https://writing.wisc.edu/handbook/ccs_activevoice/)

**Clarity, conversational voice, specificity, outcomes**
- [WRIXON — Clarity vs Cleverness in Copywriting](https://wrixon.com/clarity-cleverness-copywriting/)
- [The Creative Brand — Clear or Clever Copywriting?](https://www.thecreativebrand.io/newsletter/022-clear-or-clever-copywriting)
- [SolidGigs — Best Copywriting Techniques 2025](https://solidgigs.com/blog/the-best-copywriting-techniques-2025-from-beginner-to-advanced-strategies/)
- [Magnet — Ultimate Web Copywriting Guide 2025](https://magnet.co/articles/an-idiots-guide-to-writing-killer-web-copy)
- [UserEvidence — Features vs Benefits vs Outcomes](https://userevidence.com/podcast/the-proof-point/where-to-focus-your-messaging-features-vs-benefits-vs-outcomes/)
- [LogRocket — Benefits vs Features for Value Proposition Design](https://blog.logrocket.com/product-management/benefits-features-value-proposition-design/)
- [Forget the Funnel — Features vs. Benefits (Ep. 18)](https://forgetthefunnel.com/resources/ep-18-features-vs-benefits)
- [Alphap — Persuasive Copy for High-Ticket B2B](https://alphap.tech/how-to-use-persuasive-copywriting-and-marketing-strategies-to-close-high-ticket-b2b-sales/)

**Conversion copywriting & message-to-market match**
- [Copyposse — 5 Levels of Market Awareness](https://copyposse.com/blog/5-levels-of-market-awareness-how-to-speak-to-your-target-audience-part-1/)
- [LeadGen Economy — Schwartz's 5 Stages of Awareness](https://www.leadgen-economy.com/blog/five-stages-awareness-lead-generation/)
- [Motive in Motion — Market Sophistication: The 5 Levels](https://www.motiveinmotion.com/market-sophistication/)
- [NordicCopy — What is Market Sophistication?](https://nordiccopy.com/market-sophistication/)
- [Copyhackers — Voice of Customer in Your Brand (Joanna Wiebe)](https://copyhackers.com/voice-of-customer-in-your-brand/)
- [Copyflight — Voice of Customer Research](https://www.copyflight.com/voice-of-customer-research-better-copywriting/)

**UX microcopy / content-design systems**
- [Kinneret Yifrah — Microcopy: The Complete Guide](https://www.amazon.com/Microcopy-Complete-Guide-Kinneret-Yifrah/dp/B07N1RD7W6)
- [CourseUX — UX Writing Guide 2026 (Yifrah & Podmajersky)](https://courseux.com/ux-writing-guide/)
- [CXL — Microcopy: Tiny Words, Huge Impact (Veeam)](https://cxl.com/blog/microcopy/)
- [FormKeep — How Tweaking Microcopy Can Double Conversion](https://blog.formkeep.com/how-tweaking-your-microcopy-can-instantly-double-your-conversion-rates/)
- [Econsultancy — CRO Case Studies (Expedia $12M)](https://econsultancy.com/conversion-rate-optimisation-eight-case-studies-that-show-the-benefit-of-ux-testing/)

**Voice-and-tone systems**
- [NN/g — The Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/)
- [Mailchimp — Voice and Tone Style Guide](https://styleguide.mailchimp.com/voice-and-tone/)
- [Big Star — How to Create Tone of Voice Guidelines](https://www.bigstarcopywriting.com/blog/brand-strategy/how-to-create-tone-of-voice-guidelines/)

**AI-era homogenization & defensible voice**
- [CXL — How Mindless AI Content Erodes Brand Voice](https://cxl.com/blog/ai-content-and-the-silent-erosion-of-brand-voice/)
- [Advertising Week — Generic vs. Genuine, Not Human vs. AI](https://advertisingweek.com/when-it-comes-to-content-the-choice-isnt-human-vs-ai-its-generic-vs-genuine/)
- [Contentstack — Maintaining Brand Voice with AI](https://www.contentstack.com/blog/ai/how-do-we-maintain-our-unique-brand-voice-when-using-ai)
- [SSRN — Kreitmeir & Raschky, Italy's ChatGPT Ban](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4422548)
- [Frontiers in Education — Lexical Diversity & Syntactic Complexity of ChatGPT vs Student Writing](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1616935/full)

<!-- ============================================================ -->
## Source: `docs/research/copy/02-copy-frameworks.md`

# 02 — Copywriting Frameworks & Message Architecture

> Scope: the working copywriting frameworks (AIDA, PAS, BAB, SB7, PASTOR, QUEST, 4 Ps, FAB+"so that", Rule of One), Eugene Schwartz's two diagnostic dials (Awareness × Sophistication), the long-form sales-letter / VSL anatomy and its "leads," and the buyer's Objection Cascade — then how each maps to GAELWORX's surfaces and the Stage-4/5 reality of the "AI for your business" market.

---

## 1. The core idea: frameworks are downstream of diagnosis

A copywriting framework is a **slot-fill order of operations** — it tells you what to say next. But none of them tell you *what register to open in*. That decision is made by two upstream dials from Eugene Schwartz's *Breakthrough Advertising* (1966):

1. **Awareness** — how much *the individual prospect* already knows about their problem, the solutions, and you. Dictates **where the copy starts** (the lead).
2. **Sophistication** — how many competing claims *the market as a whole* has already heard. Dictates **how the central claim must be framed** (direct benefit → bigger claim → new mechanism → amplified mechanism → identity).

Pick the framework second. The blunder flagged repeatedly in the literature: using AIDA (an awareness/curiosity engine built for cold, unaware traffic) when the prospect is solution-aware and just needs differentiation and proof — or vice versa, opening with a hard offer to a market that doesn't yet believe the problem is theirs ([Hive Digital](https://www.hivedigital.com/blog/writing-frameworks-for-marketing-content/)).

---

## 2. The framework toolbox — with when-to-use

Each framework is an ordered template. They are not rivals; elite writers **hybridize** (PAS hook → FAB body → AIDA close) ([Hive Digital](https://www.hivedigital.com/blog/writing-frameworks-for-marketing-content/)).

| Framework | Sequence | Best for | Awareness fit |
|---|---|---|---|
| **AIDA** | Attention → Interest → Desire → Action | Top-of-funnel, cold ads, social, new audiences | Unaware / Problem-aware |
| **PAS** | Problem → Agitate → Solution | Short ads, emails, hooks; the workhorse | Problem-aware |
| **BAB** | Before → After → Bridge | Landing pages, transformation offers | Solution-aware |
| **4 Ps** | Picture → Promise → Prove → Push | Mid-funnel landing pages, bottom-of-funnel conversion | Solution / Product-aware |
| **FAB (+"so that")** | Feature → Advantage → Benefit | Body copy, feature lists, spec → value translation | Product-aware |
| **PASTOR** | Problem → Amplify → Solution → Transformation → Offer → Response | Long-form sales pages, VSLs, webinars | Problem → Product-aware |
| **QUEST** | Qualify → Understand → Educate → Stimulate → Transition | Full sales-letter structure; diagnosing funnel leaks | Any (self-segments at top) |
| **SB7 (StoryBrand)** | Character → Problem → Guide → Plan → CTA → Failure → Success | Brand homepages, pitch decks, overall narrative | Problem / Solution-aware |
| **Rule of One** | (constraint, not sequence) one reader, one idea, one promise, one emotion, one CTA | Everything — the discipline layer over any framework | Any |

### The detail that matters

- **PAS** — Problem, Agitate (twist the knife: make them *feel* the cost), Solution. The most reused formula in direct response; the agitation step is where amateurs underperform — they name the problem but don't make it *hurt* enough to motivate action ([Swonkie](https://blog.swonkie.com/en/the-6-most-used-copywriting-frameworks-with-examples/)).
- **BAB** — paint the current "before" state, the desired "after" state, then position the product as the **bridge** between them. Naturally suits solution-aware buyers who already accept that a fix exists ([Hive Digital](https://www.hivedigital.com/blog/writing-frameworks-for-marketing-content/)).
- **4 Ps** — Picture (vivid scene of the outcome), Promise (what you'll deliver), Prove (evidence), Push (urgent CTA). Strong closer because it front-loads desire then resolves skepticism before the ask ([Editorialge](https://editorialge.com/copywriting-frameworks-for-marketers/)).
- **FAB + "so that"** — the translation engine. A feature is what it *is*; the advantage is what it *enables*; the benefit is what that's *worth* to the buyer. The "advantage" is the **explanatory bridge** that makes the benefit believable — skip it and the benefit reads as fluff: *"108MP sensor → captures more detail → **so that** your vacation shots stay sharp when you crop or print large."* Benefit-led copy lifts conversions ~5–20% in A/B tests ([Userpilot](https://userpilot.com/blog/features-advantages-benefits/)).
- **PASTOR** (Ray Edwards) — the "shepherd." Note the discipline: **the Offer should be ~20% of the copy; the other 80% is Transformation** (the felt result, backed by proof/testimonials). Amplify creates urgency by dramatizing the cost of *not* solving the problem ([Think Insights](https://thinkinsights.net/consulting/pastor-framework), [Cooler Insights](https://coolerinsights.com/2017/03/copywriting-tips-pastor/)).
- **QUEST** (Michel Fortin) — the full sales-letter spine. **Qualify** ruthlessly at the top to repel tire-kickers and pull in the one ideal buyer; Understand (mirror their situation), Educate (the mechanism), Stimulate (desire), Transition (browser → buyer). Doubles as a **diagnostic**: if the funnel leaks, find which of the five stages the reader fell out of ([Michel Fortin](https://michelfortin.com/quest-formula/)).
- **SB7** (Donald Miller) — *"Your business is not the hero of your brand story. Your customer is."* Your brand is the **Guide** (empathy + authority), never the hero. Critically pairs **Failure** (stakes of inaction) with **Success** (the promised land). Best fit for a homepage's overall arc, where you need clarity over persuasion intensity ([Innate Marketing Genius](https://www.innatemarketinggenius.com/storybrand-framework/), [Shortform](https://www.shortform.com/blog/donald-miller-building-a-storybrand/)).
- **Rule of One** — not a sequence but a constraint laid over whichever framework you choose: **one reader, one big idea, one core emotion, one promise, one CTA.** Anything extra dilutes. "One idea that plays on one emotion and has one key benefit." The most-violated rule on cluttered B2B homepages ([Ben Robertson](https://ben.robertson.is/notes/what-is-the-copywriting-rule-of-one/), [Eternity](https://eternitymarketing.com/blog/the-single-most-important-rule-in-copywriting)).

---

## 3. Dial #1 — Schwartz's Five Stages of Awareness (where to start)

Awareness is about the **individual prospect's head**. It sets the *lead* — your opening move — because you must "meet the prospect where they are." ([B-PlanNow](https://b-plannow.com/en/the-schwartz-pyramid-guide-to-the-5-levels-of-customer-awareness/), [LeadGen Economy](https://www.leadgen-economy.com/blog/five-stages-awareness-lead-generation/))

| Stage | What the prospect knows | How copy must open |
|---|---|---|
| **1. Unaware** | Doesn't know they have the problem | Don't sell. Start with a **story, a startling fact, or a shared identity** — get them to recognize the problem exists. Indirect. |
| **2. Problem-aware** | Feels the pain, doesn't know solutions exist | **Lead with the problem** (PAS). Show empathy, name the pain precisely, hint a path out. |
| **3. Solution-aware** | Knows solution *categories* exist, hasn't picked | **Lead with the mechanism / differentiation.** Why your *approach* beats the category. BAB shines here. |
| **4. Product-aware** | Knows *you*, not yet convinced | **Lead with proof, specifics, offer detail, risk reversal.** Stack credibility; handle objections. |
| **5. Most-aware** | Wants it, waiting on a reason to act now | **Lead with the offer + urgency.** Price, bonus, deadline, guarantee. Don't re-sell. |

The colder the prospect, the **more indirect** the opening; the hotter, the more **direct** you can be. The headline/lead is doing ~80% of the work of matching this register ([GrowthMarketer](https://growthmarketer.co/stages-of-awareness/)).

---

## 4. Dial #2 — Schwartz's Five Stages of Market Sophistication (how to frame the claim)

Sophistication is about **the market's history**: *"How many similar products have they been told about before?"* The same claim that prints money in a virgin market is invisible noise in a jaded one. This is the dial most B2B/AI marketers ignore ([Motive in Motion](https://www.motiveinmotion.com/market-sophistication/), [Dan Lok](https://www.danlok.com/5-stages-of-market-sophistication/), [NordicCopy](https://nordiccopy.com/market-sophistication/)).

| Stage | Market state | The required copy move |
|---|---|---|
| **1. Virgin / first-to-market** | No competing claims | **State the benefit plainly.** "Lose weight." Naming the result is enough. |
| **2. A few competitors** | They've heard the claim | **Enlarge / out-claim it.** Drive the same promise to its limit: bigger, faster, more. |
| **3. Many competitors, claims maxed out** | Jaded by exaggeration; promises stop working | **Introduce a NEW MECHANISM.** Stop shouting the promise; explain a *new way* it's achieved. The mechanism makes the tired promise credible again. |
| **4. Mechanism-saturated** | They've heard the mechanisms too | **Amplify / out-mechanism it.** A bigger, better, more elegant version of the mechanism; make the *how* itself the wow. |
| **5. Fully saturated / cynical** | Not listening to claims or mechanisms at all | **Identification.** Stop selling the product; sell *who this is for* and *why you do it*. Brand, ethos, belonging, exclusivity. "It's no longer what you sell, but why." |

**The pivot at Stage 3 is the single most important move in modern copy:** when everyone makes the same promise, the **unique mechanism** is what restores believability. A mechanism — the specific *system/process/ingredient* that produces the result — does two jobs at once: it **differentiates** ("a totally new way") and it **proves** ("here's *why* it works"). Prospects "don't just need benefits — they need a reason why those benefits are real and reachable" ([Stefan Georgi](https://www.stefanpaulgeorgi.com/blog/my-3-criteria-for-writing-a-great-unique-mechanism/), [Maku](https://makucopywriter.com/boost-sales-unique-mechanism/)).

---

## 5. The Objection Cascade — the order the buyer's brain asks

Persuasion fails when copy answers the right objections in the wrong order. The buyer interrogates you in a fixed sequence; copy must pre-empt each question *just before* they ask it. The canonical four-beat cascade:

1. **Why care?** — Is this even relevant to me? (relevance / pain) → answered by the **lead + headline**, tuned to awareness stage.
2. **Why you?** — Why your approach over all the others? (differentiation) → answered by the **unique mechanism / positioning**.
3. **Why believe?** — Prove it. Why is it safe to trust you? (proof / risk) → answered by **evidence**: results, testimonials, demos, credentials, guarantees.
4. **Why now?** — Why not later / never? (urgency) → answered by **cost-of-inaction + deadline/scarcity + CTA**.

Joanna Wiebe's Copyhackers **messaging hierarchy** is the same cascade expressed as the prospect's literal internal monologue, written one answer at a time so every line earns the next: *"Why should I care?" → "Am I alone in caring, or do others like me care?" → "Show me how you do what you say." → "How will my life improve?" → "Why is it safe to believe you?"* This is the operating system behind every long-form page ([Copyhackers](https://copyhackers.com/2016/06/copywriting-principles-sweatblock/)). Reframe every FAQ as one of these objections flipped into an argument for the offer ([ConversionSurge](https://www.conversionsurge.com/copywriting-objections/)).

---

## Related sub-subjects

### A. The "Lead" is 80% of the sale — Great Leads × the awareness dial

**Why it pertains:** the frameworks above all assume the reader is still reading. The **lead** (the first ~10% of any sales message) decides that — and *Great Leads* by Michael Masterson (Mark Ford) & John Forde proves the lead type must be chosen by **awareness stage**, fusing Schwartz with a concrete menu.

The **six leads**, ranked from most direct to most indirect ([Samuel Woods](https://samueljwoods.com/great-leads-the-six-easiest-ways-to-start-any-sales-message-by-michael-masterson-john-forde/), [Mark Ford](https://www.markford.net/great-leads/)):

1. **Offer** — lead with product/price/discount/guarantee, sometimes in the headline. *Most direct.*
2. **Promise** — lead with the headline benefit ("Earn 20% more revenue").
3. **Problem–Solution** — name the most pressing pain, then promise the resolution.
4. **Secret** — reveal a hidden formula/system behind the result (curiosity engine).
5. **Proclamation** — shock with a bold fact, prediction, or statement.
6. **Story** — testimonial, origin, historical proof. *Most indirect.*

**The mapping (the load-bearing insight):**
- **Most-aware / Product-aware →** direct leads: **Offer, Promise.** They already believe; give them the deal.
- **Solution-aware →** **Secret / Promise** (mechanism-flavored) — differentiate.
- **Problem-aware →** **Problem–Solution.**
- **Unaware →** indirect leads: **Story, Proclamation, Secret** — earn attention before you sell.

The deeper principle: as **sophistication rises**, even hot prospects need a *less* direct, *more* mechanism-/story-driven lead, because the direct claim has been burned out by competitors. The lead is where Awareness and Sophistication get reconciled into one opening sentence.

### B. Long-form sales-letter & VSL anatomy

**Why it pertains:** PASTOR and QUEST are *skeletons*; the classic long-form structure is the *full body* with the organs (bullets, proof, guarantee, P.S.) that actually convert high-ticket buyers — exactly GAELWORX's price band.

The canonical long-form spine ([Gary Halbert](https://jimbouman.com/gary-halbert-how-to-write-copy/), [Bencivenga](https://gameofconversions.com/gary-bencivenga-shoestring-business-ad-the-bencivenga-persuasion-equation/), [Breakthrough Marketing Secrets](https://www.breakthroughmarketingsecrets.com/write-long-copy-that-sells-hvc/)):

1. **Headline** — the biggest promise or the most intriguing hook; carries the awareness/sophistication register.
2. **Lead** — one of the six leads; opens a *curiosity loop* and makes it personally relevant ("I"/"you").
3. **Body / argument** — Problem → Agitate → **Mechanism** (the "why it works") → Solution.
4. **Proof** — testimonials, case studies, data, demos, credentials. Bencivenga's equation: *urgent problem → unique solution → unquestionable proof → easy action.*
5. **Bullets ("fascinations")** — benefit-loaded curiosity bullets; for many A-list writers these *are* the sale.
6. **Offer + value stack + price justification.**
7. **Risk reversal / guarantee.**
8. **CTA** — clear, single, repeated.
9. **P.S.** — often the second-most-read element; restate the core promise + urgency.

**VSL variant** — same logic, compressed and front-loaded for attention: **Hook / pattern-interrupt (first 5–8 sec) → Problem → Agitate → Mechanism/Solution → Proof → Offer → Close.** Drop the **first CTA early** (right after introducing the offer), not just at the end, because most viewers won't reach the end. Modern lengths: 60–120s top-of-funnel; 2–5 min high-intent ([Sendspark](https://blog.sendspark.com/video-sales-letter-examples), [Thrive Themes](https://thrivethemes.com/video-sales-letter-script/)). Map this to the Objection Cascade: Hook = *why care*, Mechanism = *why you*, Proof = *why believe*, Offer/Close = *why now*.

### C. Email & funnel sequence architecture

**Why it pertains:** a $1,299–$35,000 sale is rarely closed in one page-view. The framework has to *unroll over time* — the sequence is the long-form sales letter broken across days, each email a single beat of the cascade.

The reference architecture (Russell Brunson's **Soap Opera Sequence**, originally Andre Chaperon) — a 5-email welcome/nurture arc ([ClickFunnels](https://www.clickfunnels.com/blog/soap-opera-sequence/), [Sir Links A Lot](https://sirlinksalot.co/soap-opera-sequence/)):

1. **Set the stage** — introduce yourself, set expectations, open a loop.
2. **High drama / backstory** — the conflict and stakes that earn attention.
3. **Epiphany** — the realization that reframes the problem → your mechanism.
4. **Hidden benefit** — surface the non-obvious upside of the solution.
5. **Call to action** — the most urgent, direct ask.

It runs on the **Zeigarnik effect** (open loops nag to be closed) and the **Ovsiankina effect** (the drive to finish interrupted tasks): each email closes one loop and opens the next. After the SOS converts (or doesn't), leads ascend the **Value Ladder** via ongoing "Seinfeld" daily emails (story-led, soft-sell). The whole stack is one long PASTOR/QUEST argument metered out over time — each send mapped to Awareness (early emails warm Unaware/Problem-aware; later emails close Product/Most-aware) and to one rung of the Objection Cascade.

---

## 6. GAELWORX application

**Diagnosis first.** The "AI for your business / AI-implementation" market in 2026 is **Sophistication Stage 4–5**: every competitor homepage "reads like every other AI-powered platform, with identical hero claims, proof points, and screenshots of chat interfaces"; buyers are "actively filtering out copy that fails to demonstrate genuine expertise" ([PitchKitchen](https://www.pitchkitchen.com/best-b2b-marketing-ai-enabled-solutions)). Plain benefit claims ("save time with AI") are dead on arrival. **The mandate is therefore Stage-4/5 play: lead with MECHANISM + IDENTITY**, never with the generic promise.

- **Mechanism** restores believability in a jaded market — for GAELWORX that's the *named, proprietary "how"* (the Forge / Automatic Execution system, Maeve, the Worx product line as a productized delivery mechanism). Don't promise "automation" — show the *engine* that produces it.
- **Identity** is the Stage-5 move — the **Clan** ethos, Neo-Gaelic Brutalist code, "Clan Protected." This sells *who it's for and why we do it*, which is exactly what works when no one believes claims anymore. The brand voice **is** a sophistication-stage weapon, not decoration.

**Surface-by-surface mapping:**

| Surface | Visitor awareness | Lead type / framework | Primary cascade beat |
|---|---|---|---|
| **Home** | Mixed, skews Problem→Solution-aware | **SB7 arc** (customer = hero, GAELWORX = Guide) + **Proclamation/Story lead** + Rule of One on the hero | *Why care* + *Why you* (mechanism + identity) |
| **Service pages** (YardWorx, RepairWorx, SalesWorx, AgentWorx) | Solution→Product-aware | **PASTOR or QUEST**, mechanism-led; **BAB** for the transformation; **FAB+"so that"** on features | *Why you* + *Why believe* |
| **Pricing** | Product→Most-aware | **4 Ps** (Picture the outcome → Promise → Prove with results → Push) + **Offer lead**; value-stack + risk reversal | *Why believe* + *Why now* |
| **Contact / CTA** | Most-aware | **Offer lead**, direct, single CTA, "Point the Sword" | *Why now* |

**Concrete examples (illustrative, in Clan voice):**

1. **Home hero (Stage-5 identity + mechanism, not a benefit claim).** Reject: *"We help businesses automate with AI."* Use: *"Automatic Execution. Clan Protected."* as the identity hook, immediately backed by the mechanism — *"We don't sell you a chatbot. We forge an autonomous operator — Maeve — and stand behind it like clan."* (Identity opens *why care/why you*; the named mechanism makes it believable.)

2. **Service page lead (PASTOR + mechanism, Problem→Product-aware).** **Problem:** "Your repair desk drowns in tickets the moment you sleep." **Amplify:** "Every missed after-hours job is revenue that walked to a competitor who answered." **Solution (mechanism):** "RepairWorx runs the desk on Automatic Execution — intake, triage, dispatch, follow-up — a system, not a plugin." **Transformation:** before/after of a 24/7 desk that never drops a job. **Offer + Response:** scoped engagement, single CTA. (FAB+"so that" on the feature list: "Routes by skill *so that* the right tech gets the job, not the nearest.")

3. **Pricing page (4 Ps + Offer lead, Most-aware).** **Picture:** "Your operation running itself at 3 a.m." **Promise:** the specific deliverable per tier. **Prove:** named results / guarantee / "Clan Protected" risk reversal. **Push:** one sharp CTA, deadline or onboarding-slot scarcity — answering *why now*. (At $1,299–$35,000 the price needs *justification framing*, not apology: tie the number to the cost-of-inaction the Amplify step already established.)

**Throughline:** Diagnose Awareness to set the **lead** per surface; respect Sophistication Stage 4–5 to make every lead **mechanism-** and **identity-**driven; sequence the **Objection Cascade** (why care → why you → why believe → why now) down each page and across the email funnel; hold the **Rule of One** on every hero so the Brutalist clarity matches the brand.

---

## 7. Sources

- [Hive Digital — Writing Frameworks for Marketing Content (AIDA, PAS, BAB…)](https://www.hivedigital.com/blog/writing-frameworks-for-marketing-content/)
- [Swonkie — The 6 Most-Used Copywriting Frameworks (with examples)](https://blog.swonkie.com/en/the-6-most-used-copywriting-frameworks-with-examples/)
- [Editorialge — Top Copywriting Frameworks Every Marketer Should Know](https://editorialge.com/copywriting-frameworks-for-marketers/)
- [B-PlanNow — Schwartz's Pyramid: 5 Levels of Customer Awareness](https://b-plannow.com/en/the-schwartz-pyramid-guide-to-the-5-levels-of-customer-awareness/)
- [GrowthMarketer — What Are the 5 Stages of Awareness?](https://growthmarketer.co/stages-of-awareness/)
- [LeadGen Economy — Schwartz's 5 Stages of Awareness](https://www.leadgen-economy.com/blog/five-stages-awareness-lead-generation/)
- [Motive in Motion — Market Sophistication: The 5 Levels (Direct-Response Examples)](https://www.motiveinmotion.com/market-sophistication/)
- [Dan Lok — 5 Stages of Market Sophistication](https://www.danlok.com/5-stages-of-market-sophistication/)
- [NordicCopy — What is Market Sophistication?](https://nordiccopy.com/market-sophistication/)
- [Innate Marketing Genius — The StoryBrand (SB7) Framework](https://www.innatemarketinggenius.com/storybrand-framework/)
- [Shortform — Building a StoryBrand (Donald Miller) Guide](https://www.shortform.com/blog/donald-miller-building-a-storybrand/)
- [Think Insights — The PASTOR Framework](https://thinkinsights.net/consulting/pastor-framework)
- [Cooler Insights — Craft Effective Copy Using PASTOR](https://coolerinsights.com/2017/03/copywriting-tips-pastor/)
- [Michel Fortin — QUEST: The 5-Stage Formula](https://michelfortin.com/quest-formula/)
- [Userpilot — Features, Advantages, Benefits (FAB) Model](https://userpilot.com/blog/features-advantages-benefits/)
- [Ben Robertson — What is the Copywriting Rule of One?](https://ben.robertson.is/notes/what-is-the-copywriting-rule-of-one/)
- [Eternity Marketing — The Single Most Important Rule in Copywriting](https://eternitymarketing.com/blog/the-single-most-important-rule-in-copywriting)
- [Copyhackers — 3 Copywriting Principles (messaging hierarchy)](https://copyhackers.com/2016/06/copywriting-principles-sweatblock/)
- [ConversionSurge — How to Address Customer Objections With Copywriting](https://www.conversionsurge.com/copywriting-objections/)
- [Samuel Woods — Great Leads (Masterson & Forde) summary](https://samueljwoods.com/great-leads-the-six-easiest-ways-to-start-any-sales-message-by-michael-masterson-john-forde/)
- [Mark Ford — Great Leads](https://www.markford.net/great-leads/)
- [Stefan Georgi — 3 Criteria for a Great Unique Mechanism](https://www.stefanpaulgeorgi.com/blog/my-3-criteria-for-writing-a-great-unique-mechanism/)
- [Maku — Unique Mechanism in Copywriting](https://makucopywriter.com/boost-sales-unique-mechanism/)
- [Gary Halbert — How To Write Copy That Sells](https://jimbouman.com/gary-halbert-how-to-write-copy/)
- [Game of Conversions — The Bencivenga Persuasion Equation](https://gameofconversions.com/gary-bencivenga-shoestring-business-ad-the-bencivenga-persuasion-equation/)
- [Breakthrough Marketing Secrets — Write Long Copy That Sells](https://www.breakthroughmarketingsecrets.com/write-long-copy-that-sells-hvc/)
- [Sendspark — Video Sales Letter Guide & Examples](https://blog.sendspark.com/video-sales-letter-examples)
- [Thrive Themes — How to Script a VSL](https://thrivethemes.com/video-sales-letter-script/)
- [ClickFunnels — Creating a Soap Opera Sequence That Sells](https://www.clickfunnels.com/blog/soap-opera-sequence/)
- [Sir Links A Lot — Soap Opera Sequence (Russell Brunson)](https://sirlinksalot.co/soap-opera-sequence/)
- [PitchKitchen — Best B2B Marketing for AI-Enabled Solutions (2026)](https://www.pitchkitchen.com/best-b2b-marketing-ai-enabled-solutions)

<!-- ============================================================ -->
## Source: `docs/research/copy/03-brand-archetypes.md`

# 03 — Brand Archetypes & Verbal Identity

> Scope: Carl Jung's 12 archetypes (their 4 families, core desire/fear/voice, **and the shadow side of each**), how primary+secondary blending works, how an archetype drives concrete copy — plus three load-bearing sub-subjects (tone-of-voice systems, challenger-brand/Outlaw strategy, brand storytelling) — sharpened into GAELWORX's **Outlaw × Hero + Ruler polish, bound by Clan** lockup.

---

## 1. Why this matters for GAELWORX

An archetype is not a logo or a color — it is the **deep behavioral pattern** a brand consistently embodies, so that its meaning lines up precisely with a pattern already living in the customer's mind (Mark & Pearson's central claim in *The Hero and the Outlaw*). For a high-ticket ($1,299–$35,000) AI-implementation studio, the archetype is the thing that makes the price feel *inevitable* rather than expensive. It governs vocabulary, metaphor systems, sentence rhythm, what we attack, and what we promise. Get it wrong and the Clan Voice reads as cosplay; get it right and every line of copy compounds the same myth.

The discipline below is deliberately two-sided: every archetype has a **light** (the promise that sells) and a **shadow** (the failure mode that, unmanaged, makes the brand repulsive or absurd). GAELWORX leads with archetypes — Outlaw and Hero — whose shadows are the most dangerous of all twelve (nihilism; ruthless bullying). Naming those shadows is how we avoid them.

---

## 2. Main subject — the 12 archetypes

### 2.1 The four families

Mark & Pearson organize the twelve by four **master motivations**. The popular branding shorthand (Iconic Fox / Scott Jeffrey) relabels the same four axes as **Ego, Order, Social, Freedom**:

| Family (Pearson) | Branding label | Drive | The three archetypes |
|---|---|---|---|
| **Risk & Mastery** | **Ego** | Leave a mark, achieve, prove worth | **Hero · Outlaw · Magician** |
| **Stability & Control** | **Order** | Provide structure, exert order over chaos | **Ruler · Creator · Caregiver** |
| **Belonging & Enjoyment** | **Social** | Connect with others, enjoy the moment | **Everyman · Lover · Jester** |
| **Independence & Fulfillment** | **Freedom** | Self-discovery, truth, knowledge | **Explorer · Sage · Innocent** |

GAELWORX lives almost entirely in the **Ego / Risk & Mastery** family (Hero + Outlaw + the third member, Magician, lurking in "Automatic Execution") with a deliberate raid into **Order** for the **Ruler** polish that justifies a five-figure price. The **Clan/Unity** binding borrows the *belonging* energy of the Social family without adopting its soft voice.

### 2.2 The twelve — desire · fear · voice · shadow

For each: **core desire**, **core fear**, **voice/copy signature**, **real brands**, and **the shadow** (the dark, repressed, or over-extended form — the failure mode).

---

#### EGO / RISK & MASTERY

**HERO** (a.k.a. Warrior)
- **Desire:** prove worth through courageous, difficult achievement; improve the world by mastering challenge.
- **Fear:** weakness, incompetence, cowardice, injustice — being a "loser."
- **Voice:** confident, motivating, **urgent, no hesitation**; direct commands; challenge-and-triumph arc. Bold sans, primary contrast, action imagery. *"Just Do It."*
- **Brands:** Nike, Under Armour, Duracell, the U.S. Army, FedEx.
- **Shadow — the Bully / the Coward.** The Hero becomes empowered *through the disempowerment of others*; arrogance, ruthlessness, "win at all costs," manufacturing enemies to look strong. The Bully's power is "stuck — brittle," not transformative. The passive pole is the Coward who postures. Hero brands also collapse fast when **promises fail to meet the high expectations** they set.

**OUTLAW** (a.k.a. Rebel, Revolutionary, Destroyer)
- **Desire:** **overturn what isn't working**; revolution, freedom from a broken status quo; disruption.
- **Fear:** powerlessness, **conformity**, being trivial / ineffectual.
- **Voice:** **bold, contrarian, anti-establishment**; refuses corporate-speak; names an enemy; high-contrast, black, raw textures, broken-grid layouts. *"United by Independents," "Try living off the straight and narrow."*
- **Brands:** Harley-Davidson, Diesel, Virgin, BrewDog, Red Bull (the "Irreverent Maverick" challenger).
- **Shadow — the Criminal / Nihilist.** **Reflexive contrarianism** (challenging things *because they exist*, not because they're wrong), **destruction without construction**, nihilism that enjoys the tearing-down without caring about consequences, and using "disruption" to dodge accountability. The shadow Outlaw breaks for the thrill, leaving nothing built. **This is GAELWORX's single most important shadow to neutralize** (see §5).

**MAGICIAN**
- **Desire:** make dreams real; transformation; unlock hidden potential; understand the laws of the universe and bend them.
- **Fear:** unintended negative consequences; manipulation backfiring.
- **Voice:** visionary, mystical-but-precise, transformative ("turn X into Y"), wonder + inevitability.
- **Brands:** Apple, Disney, Tesla, Dyson, Mastercard.
- **Shadow — the Sorcerer / Manipulator.** Power-for-its-own-sake; **using knowledge to control others**, manipulation by **withholding** (half-truths, hidden vital information), "evil sorcerer" deception, snake-oil. Where Hero's shadow bullies openly, Magician's shadow deceives quietly.

---

#### ORDER / STABILITY & CONTROL

**RULER**
- **Desire:** **a prosperous, orderly world through control**; leadership, exclusivity, the best of everything.
- **Fear:** chaos, being overthrown / undermined, losing power.
- **Voice:** commanding, **authoritative**, refined; declarative; vocabulary of standards, mastery, legacy, "the standard." Premium, exclusive, polished cues.
- **Brands:** Rolex, Mercedes-Benz, American Express (Centurion), Microsoft, Louis Vuitton.
- **Shadow — the Tyrant.** Domination and control as ends in themselves; intimidation, elitism, **cold and uncaring**, manipulating to defend position; "won't admit they can't do something." Reads as authoritarian.

**CREATOR**
- **Desire:** create something of **enduring value and beauty**; craft, self-expression, vision realized.
- **Fear:** mediocrity, **poor execution**, a "just okay" outcome.
- **Voice:** imaginative, craft-obsessed, evocative; talks about making, building, designing, the artifact.
- **Brands:** Lego, Adobe, Crayola, Apple (Creator pole).
- **Shadow — the Obsessive Perfectionist.** **Perfectionism that prevents finishing**, narcissism around the work, hostility to criticism, losing sight of what's been achieved.

**CAREGIVER**
- **Desire:** **protect and care for others**; nurture, compassion, service.
- **Fear:** selfishness, ingratitude; others coming to harm.
- **Voice:** warm, reassuring, nurturing, "we've got you."
- **Brands:** Johnson & Johnson, Volvo, Dove, UNICEF.
- **Shadow — the Martyr.** Self-sacrifice to the point of **codependency and resentment**, people-pleasing, neglecting one's own needs, "victim/slave" energy, guilt as a tool.

---

#### SOCIAL / BELONGING & ENJOYMENT

**EVERYMAN** (Regular Guy/Gal)
- **Desire:** **belong**, connect, be one of the group; equality, fellowship.
- **Fear:** standing out (negatively), elitism, being left out.
- **Voice:** down-to-earth, friendly, plain-spoken, dependable, inclusive; no jargon, no showing off.
- **Brands:** IKEA, Target, Budweiser, Levi's.
- **Shadow — the Nobody / Conformist.** Invisibility, **lack of ambition, fear of standing out**, blandness, feelings of inadequacy, conformity for its own sake.

**LOVER**
- **Desire:** **intimacy, closeness, sensual pleasure**; to be desired; beauty and connection.
- **Fear:** being unwanted, unnoticed, unloved.
- **Voice:** sensual, warm, evocative, indulgent; rich adjectives, sensory language.
- **Brands:** Chanel, Victoria's Secret, Häagen-Dazs, Godiva.
- **Shadow — the Possessive / Seducer.** Jealousy, possessiveness, codependency, **charm weaponized to manipulate and exploit**, losing self in the other.

**JESTER**
- **Desire:** **have fun, live in the moment**, lighten the world.
- **Fear:** boredom, being boring, seriousness, being a bore to others.
- **Voice:** playful, witty, irreverent, surprising; puns, wink, breaks the fourth wall.
- **Brands:** M&M's, Old Spice, Skittles, Dollar Shave Club.
- **Shadow — the Clown / Saboteur.** Humor to **mask pain or hurt others**, cruelty disguised as joking, deflecting all real emotion, frivolity that undermines trust; exhaustion behind the cheer.

---

#### FREEDOM / INDEPENDENCE & FULFILLMENT

**EXPLORER**
- **Desire:** **freedom to discover** the self through experiencing the world; the frontier.
- **Fear:** entrapment, conformity, inner emptiness, "being stuck."
- **Voice:** rugged, individualist, open-road, invitational; verbs of motion and discovery.
- **Brands:** Jeep, The North Face, Patagonia, Red Bull (explorer pole), NASA.
- **Shadow — the Vagabond / Addict.** **Aimless wandering**, fleeing every commitment, addiction to novelty/escape, mistaking restlessness for purpose.

**SAGE**
- **Desire:** **truth and understanding**; use knowledge to make the world better; be a trusted source.
- **Fear:** being deceived, ignorance, misleading others.
- **Voice:** measured, authoritative-by-evidence, clarifying; teaches, cites, explains.
- **Brands:** Google, BBC, The Economist, Harvard, McKinsey.
- **Shadow — the Skeptic / Dogmatist.** **Analysis paralysis**, condescension toward the "less informed," dogmatism, retreating into the **ivory tower**, study as avoidance of action.

**INNOCENT**
- **Desire:** **happiness, paradise**, simplicity, goodness; to do things right.
- **Fear:** punishment for doing wrong; corruption; complexity.
- **Voice:** optimistic, wholesome, simple, reassuring; clean and bright.
- **Brands:** Dove, Coca-Cola, Aveeno, Innocent Drinks.
- **Shadow — the Victim / Denial.** **Naivety, denial, escapism**, refusing to see hard truths, blaming others, willful blindness.

---

### 2.3 Blending — primary + secondary

Real brands rarely sit cleanly in one box; the strongest **lead with one primary (≈60–80% of the personality) and use a secondary for distinctive nuance** ("the secondary isn't dilution — it's dimension," but only works when the primary is dominant and clear).

- **Nike = Hero (primary) × Outlaw (edge):** the Hero proves worth through hard achievement; the Outlaw edge supplies the defiance ("Just Do It" is a dare, not a tagline).
- **Apple = Magician × Creator (analysts split on which leads):** transformation ("think different") plus craft — the disagreement itself proves a rich brand exceeds one box.
- **Harley-Davidson = Outlaw, near-pure:** freedom, rebellion, non-conformity, with a Hero undertone of brotherhood.

**Rule of thumb for copy:** the **primary** sets the verbs, the metaphor system, and what you attack; the **secondary** sets the texture and the proof. GAELWORX runs a 3-part stack — **Outlaw × Hero**, **Ruler polish**, **Clan binding** — which is unusually rich and therefore demands discipline (a clear primary so it doesn't read as four brands).

### 2.4 Archetype → copy mechanics (how the myth becomes words)

An archetype drives copy along five concrete levers:

1. **Vocabulary** — the words you reach for *and the words you refuse*. Hero: *win, prove, conquer, do.* Outlaw: *break, refuse, burn, status quo, rigged.* Ruler: *standard, command, mastery, legacy.* (NN/g: build an explicit **Do list + Don't list**.)
2. **Metaphor system** — Hero = battle/athletics; Outlaw = revolution/fire/breaking chains; Ruler = throne/forge/empire; Magician = transformation/alchemy. Pick *one* dominant metaphor field and stay inside it. (GAELWORX already does this: **forge, fire, iron, clan, blade**.)
3. **Sentence structure** — Hero/Outlaw/Ruler all favor **short, declarative, imperative** sentences ("Point the Sword"); active voice, no hedging, no passive. The *length and rhythm* carry the archetype as much as the words.
4. **What it attacks** — every Ego-family archetype defines itself against an enemy. Outlaw attacks the establishment/the rigged system; Hero attacks weakness/the obstacle; Ruler attacks chaos/mediocrity. Naming the enemy is a copy *requirement*, not a flourish.
5. **What it promises** — Hero: victory/transformation of *you.* Outlaw: liberation from the broken thing. Ruler: order, status, the best. Magician: it just *works*, like magic ("Automatic Execution").

---

## 3. Three related sub-subjects

### 3.1 Tone-of-voice systems — making the archetype operational (NN/g)

An archetype is the personality; **tone of voice is how that personality is dialed per context.** The Nielsen Norman Group's research is the canonical operational model: any piece of content can be placed on **four bipolar dimensions** —

1. **Funny ↔ Serious** (humor)
2. **Formal ↔ Casual** (formality)
3. **Respectful ↔ Irreverent** (respectfulness)
4. **Enthusiastic ↔ Matter-of-fact** (enthusiasm)

Each is a 3-point scale with a neutral midpoint; a brand's tone is a *point in this 4-D space*. NN/g's method: **start with the four high-level dimensions, then refine into a handful of specific tone words** (e.g., "blunt," "battle-tested," "engineered") — *never more than a handful* or the guideline is unusable. Build an explicit **Do / Don't list** of vocabulary, give **context and rationale** so writers know *when* to hit which tone, and **test that new copy conforms**.

**Why it pertains:** archetype tells GAELWORX *who it is*; the four dimensions tell us exactly *how raw* to be in a confirmation email vs. a hero headline vs. a legal footer. The Clan Voice maps cleanly: **Serious** (not funny), **Casual-tending-blunt** (not corporate-formal), **Irreverent** toward the establishment but **respectful toward the clan**, **Matter-of-fact about mechanics but enthusiastic about the fight**. That is a precise, defensible point in NN/g's space — and it prevents the common failure of "aggressive" sliding into "rude to the customer."

### 3.2 Challenger-brand / Outlaw strategy — Adam Morgan & eatbigfish

The Outlaw archetype's *business* counterpart is **challenger-brand strategy**, coined by Adam Morgan in *Eating the Big Fish* (1999) and extended in **Overthrow II** (eatbigfish × PHD). A challenger is a deliberate posture that **refuses incumbent rules, names a defensible enemy, and uses sharper positioning to take share from larger players.** Morgan's **eight credos**:

1. **Break with the immediate past** — don't be a smaller version of the leader.
2. **Build a "Lighthouse Identity"** — a brand so clear and intense (identity, emotion, intensity, salience) that customers navigate *to* it.
3. **Assume thought leadership of the category** — act bigger than you are.
4. **Create symbols of re-evaluation** — dramatic acts/icons that make people question their default choice *emotionally, not logically.*
5. **Sacrifice** — *"the greatest danger is not rejection but indifference."* Drop markets, messages, and audiences to bind a core group with **strong** (not weak/parity) preference.
6. **Overcommit** — go further than is comfortable.
7. **Use publicity & symbolic acts as high-leverage assets.**
8. **Be ideas-centered, not consumer-centered.**

Overthrow II names **10 challenger narratives**; the most Outlaw-adjacent is the **"Irreverent Maverick"** ("counterculture attitude in a box" — Red Bull, BrewDog).

**Why it pertains:** this is the *strategic spine* under GAELWORX's Outlaw voice. It converts attitude into a plan: **name the enemy** (bloated agencies, "AI theater," manual drudgery), **sacrifice** the customers who want cheap/passive (the price *is* the sacrifice — it binds the serious and repels the casual), and **build the lighthouse** (the forge, the obsidian slab, "Automatic Execution. Clan Protected."). Crucially, Morgan's "ideas-centered" and "symbols of re-evaluation" give the Outlaw something to *build*, which is the antidote to its nihilist shadow.

### 3.3 Brand storytelling / narrative identity — StoryBrand vs. brand-as-hero

Donald Miller's **StoryBrand (SB7)** framework codifies the most important narrative inversion in copy: **the customer is the Hero — the brand is the Guide.** A brand that casts *itself* as the hero "is destined to lose." The 7 beats: a **Character** (customer) **has a Problem**, **meets a Guide** (brand) who shows **Empathy + Authority**, **gives a Plan**, **calls them to Action**, helping them avoid **Failure** and reach **Success**. The **villain** is usually *a problem personified*, not a person, and problems come in three layers — **External** (tangible), **Internal** (how it feels), **Philosophical** (why it's *wrong*). Great marketing wins on the internal and philosophical levels.

This creates a productive **tension with the Hero archetype**: the *brand's* archetype can be Hero/Outlaw (its character, courage, defiance), while in the *customer's story* the brand still plays **Guide**. Miller's resolution: a Guide is more powerful than a Hero — think Yoda, Gandalf — a battle-tested veteran who has *already* won the fight the customer is facing.

**Why it pertains:** this is how GAELWORX keeps an aggressive Outlaw×Hero identity *without insulting the buyer.* The clan member (customer) is the hero of their business; GAELWORX is the **scarred, battle-tested Guide** who hands them a sword (the automation) and a plan. The three problem layers map directly: **External** = manual ops eating hours; **Internal** = feeling outpaced, "behind," not in command; **Philosophical** = *it's wrong that good operators are forced to do robot work by hand.* That philosophical villain is the enemy the Outlaw attacks — and giving the buyer the hero role is what makes "Clan Protected" a promise rather than a boast.

---

## 4. GAELWORX application — sharpening Outlaw × Hero + Ruler + Clan

**The lockup:** **Outlaw** (primary attitude — what we attack, the defiance, the fire) **× Hero** (the service/mission — we win the customer's fight, we improve their world) **+ Ruler polish** (the engineering precision, exclusivity, and standard that justify $1,299–$35,000) **bound by Clan/Unity** (belonging — the customer joins something protected). Mapped to families: **Ego (Hero+Outlaw) raiding Order (Ruler)**, with Social *belonging* borrowed for the Clan binding but **never its soft voice.**

**Primary discipline:** Outlaw sets the verbs and the enemy; Hero sets the promise; Ruler sets the proof and the price; Clan sets the pronoun (**we / our clan**, never "you the consumer"). When in doubt, the **Outlaw leads the headline, the Hero leads the offer, the Ruler leads the spec sheet, the Clan leads the close.**

### 4.1 The lexicon

- **Outlaw words (attack / refuse):** *rigged, status quo, broken, theater, drudgery, by hand, manual, bloat, refuse, break, burn down, no permission.*
- **Hero words (fight / win):** *execute, win, conquer, prove, ship, dominate, take the field, no excuses.*
- **Ruler words (standard / justify price):** *engineered, precision, mastery, standard, command, sovereign, the only, built to last, legacy.*
- **Magician words (the "magic" of automation):** *automatic, while you sleep, transforms, just works, set it and it runs.*
- **Clan words (belong / protect):** *clan, protected, ours, the forge, brothers, no one left behind, stand with.*
- **Forge metaphor field (already in the brand):** *forge, fire, ember, iron, obsidian, blade, anvil, heat, tempered.* — Stay inside it.
- **Don't list (NN/g):** corporate-speak, hedges, passive voice, "solutions," "leverage synergies," "we're excited to," "best-in-class," cutesy jokes, anything apologetic.

### 4.2 The enemy to attack

Name it explicitly and repeatedly — the Outlaw *requires* an enemy and StoryBrand requires a personified villain:

- **The drudgery / manual work** — robots-work done by hand (the External villain).
- **"AI theater"** — vendors who demo and never ship; dashboards that do nothing (the Philosophical villain: *it's wrong to sell motion as progress*).
- **Bloated agencies & the status quo** — slow, expensive, permission-seeking (the Outlaw's institutional enemy).

We do **not** attack the customer, their team, or their past choices. We attack the *system* that trapped them.

### 4.3 How the Hero's service prevents the Outlaw's nihilist shadow

The Outlaw's shadow is **destruction without construction** — breaking for the thrill, nihilism, no accountability. GAELWORX neutralizes it three ways:

1. **The Hero pairing supplies a mission and a build** — we don't just burn the status quo, we **ship the thing that replaces it.** Every "break" line is followed by a "build" line.
2. **StoryBrand's "guide" role supplies accountability** — we are responsible *for the customer's win*, not for our own swagger. The clan is protected; that is a promise we are on the hook for.
3. **Morgan's "ideas-centered / symbols of re-evaluation"** keep the rebellion *constructive* — the obsidian forge, "Automatic Execution," the engineered spec are positive symbols, not just middle fingers.

> **Editorial rule:** never ship an Outlaw line that only tears down. **Burn, then build — in the same breath.**

### 4.4 The Ruler polish that justifies the price

Outlaw + Hero get attention; **Ruler converts a $35,000 quote from outrageous to obvious.** The Ruler register = precision, exclusivity, standard, mastery, no fluff. It shows up as: exact specs and numbers, "the standard / the only," refined typographic restraint, zero hype-words, and a tone that assumes the reader is already serious. Ruler's *shadow* (the cold Tyrant) is held off by the **Clan** binding — sovereignty *in service of the clan*, not over it. Outlaw keeps Ruler from being elitist-cold; Ruler keeps Outlaw from being a cheap stunt. That tension is the price's justification.

### 4.5 Three concrete voice examples

**Example A — Hero headline / Outlaw edge (top of a service page)**
> **Stop doing robot work by hand.**
> The status quo wants you grinding through tasks a machine should already own. We forge the machine. You take the field.
*(Outlaw attacks the "by hand" status quo; Hero promise "take the field"; burn-then-build in two lines; active, imperative, no hedging.)*

**Example B — Ruler polish + Magician (pricing / offer block)**
> **Engineered, not improvised. $1,299–$35,000.**
> One standard: it runs while you sleep, or it doesn't ship. Precision automation, tempered to your operation, owned by you — not rented from a dashboard that does nothing.
*(Ruler "engineered / one standard / precision," Magician "runs while you sleep," Outlaw villain "dashboard that does nothing"; the spec/standard justifies the price.)*

**Example C — Clan binding + StoryBrand guide (CTA / close)**
> **You run the business. We arm it.**
> Join the clan and the drudgery stops being your problem. Automatic Execution. Clan Protected.
*(Customer is the Hero — "you run the business"; GAELWORX is the Guide who arms them; Clan belonging + the tagline as the promise; "Point the Sword" CTA — direct, high-contrast, immediate.)*

---

## 5. Sources

- [The Hero and the Outlaw — Margaret Mark & Carol S. Pearson (Google Books)](https://books.google.com/books/about/The_Hero_and_the_Outlaw_Building_Extraor.html?id=l6qXGiTld1sC)
- [The Pearson 12-Archetype System: Human Development and Evolution — Carol S. Pearson](https://carolspearson.com/about/the-pearson-12-archetype-system-human-development-and-evolution)
- [The Hero Within: Six Archetypes We Live By — Carol S. Pearson](https://carolspearson.com/books-page/the-hero-within-six-archetypes-we-live-by)
- [The Warrior / Revolutionary (Outlaw) Archetype — Carol Pearson](https://carolspearson.com/archetype-pages/outlaw-archetype)
- [Brand Archetypes: The Definitive Guide [36 Examples] — Iconic Fox](https://iconicfox.com.au/brand-archetypes/)
- [Can You Mix Brand Archetypes? The Complete Guide — Iconic Fox](https://iconicfox.com.au/can-you-mix-brand-archetypes/)
- [Brand Tone of Voice Examples: 12 Companies That Nail It — Iconic Fox](https://iconicfox.com.au/brand-tone-of-voice-examples/)
- [12 Brand Archetype Wheel: Psychology of Meaningful Branding — Scott Jeffrey](https://scottjeffrey.com/12-brand-archetype-wheel/)
- [The Magician Archetype — Scott Jeffrey](https://scottjeffrey.com/magician-archetype/)
- [Brand Archetypes: A Behavioral Designer's Guide — Yu-kai Chou](https://yukaichou.com/gamification-analysis/brand-archetypes-jung-mark-pearson-twelve-personas/)
- [The 12 Branding Archetypes: Carl Jung's Framework Explained — Inkbot Design](https://inkbotdesign.com/branding-archetypes/)
- [Psychology 101: The 12 Major Archetypes And Their Shadows — Master Mind Content](https://mastermindcontent.co.uk/psychology-101-the-12-major-archetypes-and-their-shadows/)
- [Shadow Work: How the 12 Jungian Archetypes and Their Shadows Impact Us — Notebook and Penguin](https://www.notebookandpenguin.com/12-archetypes-and-their-shadows/)
- [Shadows In Each Archetype — Individualogist](https://individualogist.com/shadows-in-each-archetype)
- [The Rebel / Outlaw Archetype: Disruption, Revolution, and Breaking Rules — JobCannon](https://jobcannon.io/blog/rebel-outlaw-archetype-explained)
- [The Hero's Shadow Archetypes: The Coward and the Bully — Helping Writers Become Authors](https://www.helpingwritersbecomeauthors.com/archetypal-character-arcs-pt-10-the-heros-negative-counter-archetypes-the-coward-and-the-bully/)
- [The Mage's Shadow Archetypes: The Miser and the Sorcerer — Helping Writers Become Authors](https://www.helpingwritersbecomeauthors.com/archetypal-character-arcs-pt-14-the-mages-negative-counter-archetypes-the-miser-and-the-sorcerer/)
- [The Four Dimensions of Tone of Voice — Nielsen Norman Group](https://www.nngroup.com/articles/tone-of-voice-dimensions/)
- [The Impact of Tone of Voice on Users' Brand Perception — Nielsen Norman Group](https://www.nngroup.com/articles/tone-voice-users/)
- [Tone-of-Voice Words — Nielsen Norman Group](https://www.nngroup.com/articles/tone-voice-words/)
- [Eating the Big Fish — Adam Morgan (Amazon)](https://www.amazon.com/Eating-Big-Fish-Challenger-Compete/dp/0470238275)
- [Eating the Big Fish — book summary (Kim Hartman, PDF)](http://www.kimhartman.se/wp-content/uploads/2013/09/Eating-the-Big-Fish-summary.pdf)
- [The Challenger Credos — eatbigfish (PDF)](http://i2p.com.au/wp-content/uploads/2015/08/Challenger-Credos-2015-Eating-the-Big-Fish-Summary.pdf)
- [Overthrow II — PHD & eatbigfish](https://www.overthrow2.com/)
- [How to use Overthrow II to tell your challenger story — The Challenger Project](https://thechallengerproject.com/blog/2019/how-to-use-overthrow-2-to-tell-your-challenger-brand-story)
- [Challenger Archetypes (Adam Morgan / PHD) — The Framework Bank (Medium)](https://jenbonhomme.medium.com/challenger-archetypes-809ff9bcd4ab)
- [Summary: Building a StoryBrand by Donald Miller — Toby Sinclair](https://www.tobysinclair.com/post/summary-building-a-storybrand-by-donald-miller)
- [The StoryBrand 7-Part Framework: Complete Guide — Gravity Global](https://www.gravityglobal.com/blog/complete-guide-storybrand-framework)
- [Building a StoryBrand — notes & review — Nat Eliason](https://www.nateliason.com/notes/building-a-story-brand-donald-miller)
- [Branding Psychology: Archetypes for Strong Voice & Copy — Phoebe Lown](https://www.phoebelown.com/blog/using-archetypes-to-build-tone-of-voice)
- [Jungian archetypes (the Shadow) — Wikipedia](https://en.wikipedia.org/wiki/Jungian_archetypes)

<!-- ============================================================ -->
## Source: `docs/research/copy/04-dark-levers.md`

# Research: The "Dark" Persuasion Levers in Marketing Copy

> Compiled 2026-06-30. The persuasion-psychology arsenal for GAELWORX — a high-ticket
> ($1,299 → $35k) AI-implementation studio with a Neo-Gaelic Brutalist "Clan Voice."
> Scope: Cialdini's 7 principles + the cognitive-bias arsenal (loss aversion, anchoring,
> framing, decoy, compromise, Zeigarnik/curiosity, IKEA, Von Restorff, Life-Force 8) +
> the 4 amplifiers, three related sub-subjects, the honest-vs-deceptive line, and the
> GAELWORX playbook. These are levers for the company's OWN ethical copy — used to make
> a TRUE case land harder, never to manufacture a false one. Sources at the bottom.

---

## PART 1 — The main subject: the dark levers, grouped

### Group A — Cialdini's 7 principles of influence

Cialdini's six "weapons of influence" (1984's *Influence*) plus a seventh, **Unity**,
added in *Pre-Suasion* (2016). Each fires an automatic, evolved heuristic that runs *below*
conscious deliberation — which is exactly why they work and why they're "dark."

1. **Reciprocity** — *mechanism:* the universal felt obligation to repay gifts, favors and
   concessions in kind. Give first, and the prospect carries a small debt.
   *Copy:* a genuinely useful free audit / teardown / mini-strategy *before* the ask
   ("Here's the 3 leaks in your funnel — fix them with or without us").
2. **Commitment & Consistency** — *mechanism:* a small initial "yes" builds a self-image the
   prospect then acts to stay consistent with. *Copy:* micro-commitments — a 2-question
   qualifier, "Yes, I run ops at a $1M+ shop" — before the real ask. The foot-in-the-door.
3. **Social Proof** — *mechanism:* under uncertainty we copy similar others; it lowers
   perceived risk. *Copy:* "47 studios automated this quarter," named logos, star ratings,
   case studies, "most popular" tags. Strongest when the proof is from people *like the
   reader* (similarity multiplies it).
4. **Authority** — *mechanism:* we defer to credible experts; it reduces decision anxiety.
   *Copy:* credentials, named methodology, published results, "as featured in," a
   diagnostic that demonstrates expertise rather than asserting it. **Demonstrate, don't claim.**
5. **Liking** — *mechanism:* we say yes to people we like — driven by similarity,
   compliments, and shared cooperation. *Copy:* a distinct voice and worldview the buyer
   recognizes as "my people"; talking *like* the reader, not at them.
6. **Scarcity** — *mechanism:* the route runs through **loss aversion** — scarce things feel
   more valuable because we fear missing out. *Copy:* "onboarding 3 clients this quarter,"
   real wait-lists, real deadlines, genuinely closing cohorts. **Only durable when the
   limit is real** (see Part 4).
7. **Unity** — *mechanism:* the strongest lever — not just *liking* someone but sharing a
   *shared identity* ("we," kinship, tribe, "one of us"). *Copy:* the Clan/in-group frame:
   "operators who refuse to lose to the status quo." Unity > liking because it makes the
   brand part of the reader's self-concept.

### Group B — The valuation biases (how the brain prices things)

- **Loss Aversion** (Kahneman & Tversky, *Prospect Theory*, 1979) — *mechanism:* losses
  feel ~2x as painful as equivalent gains, judged against a **reference point** (what you
  already have / expect). *Copy:* frame the offer as preventing a loss, not just adding a
  gain — "stop bleeding 14 hours a week" beats "save 14 hours a week," same math, more pull.
  This is the engine under scarcity, urgency, FOMO, free trials (you now "own" it and dread
  losing it), and Cost-of-Inaction selling.
- **Anchoring** (Tversky & Kahneman, 1974, *Judgment Under Uncertainty*) — *mechanism:* the
  first number seen becomes the reference point; later judgments adjust *insufficiently* from
  it. Anchors work even when irrelevant/random (the "wheel of fortune" and `1×2×…×8` vs
  `8×7×…×1` experiments: median guesses 512 vs 2,250 for the same answer). Studies show
  anchors can shift perceived value 20–40%. *Copy:* show the high/struck-through price or the
  enterprise tier *first*; quote the cost of the problem ($X/mo bleeding) before your fee, so
  the fee reads as small relative to the anchor.
- **Framing** (Tversky & Kahneman) — *mechanism:* identical facts land differently by phrasing,
  because the reference point shifts. "90% success" vs "10% failure," "$3/day" vs "$1,095/yr,"
  loss-frame vs gain-frame. *Copy:* choose the frame that puts the truth in its strongest,
  still-honest light.

### Group C — The choice-architecture effects (how the menu decides for them)

- **Decoy / Asymmetric-Dominance Effect** (Huber, Payne & Puto, 1982) — *mechanism:* adding a
  third option that is clearly *worse than one target but not the other* drags choice toward
  the dominating target (typical 10–20% preference shift). *Classic case:* *The Economist's*
  $59 web / $125 print / $125 web+print — the "useless" print-only option exists to make
  web+print look free-upgraded. *Copy/pricing:* design a tier whose only job is to make your
  target tier obviously the smart buy.
- **Compromise / Middle-Option Effect** — *mechanism:* people avoid extremes and pick the
  middle to feel "safe / reasonable." *Copy/pricing:* place the tier you want bought in the
  middle of three; the cheap one anchors low, the premium one makes the middle feel prudent.
- **Von Restorff / Isolation Effect** (1933) — *mechanism:* the item that visually breaks from
  its peers gets remembered and chosen. *Copy/design:* one highlighted tier ("MOST CHOSEN"),
  one ember-colored CTA among iron-grey siblings, one isolated stat. Pairs directly with the
  GAELWORX Molten-Edge active-focus border.

### Group D — Attention, effort & desire

- **Zeigarnik Effect** (Bluma Zeigarnik) + **Information-Gap / Curiosity-Gap** (George
  Loewenstein, 1994) — *mechanism:* unfinished tasks and open information loops create a mild
  tension the brain wants to *close*; curiosity spikes when we sense a gap between what we
  know and want to know. *Copy:* "open loops" / "we found one change that cut errors 40% — the
  surprising part is *why*," teased-then-delivered reveals, progress bars ("profile 60%
  complete"), multi-part sequences. Also feeds the dopamine "anticipation" effect (Part 3B).
- **IKEA Effect** (Norton, Mochon & Ariely, 2011/2012) — *mechanism:* we over-value what we
  partly built ourselves (subjects paid 63% more for self-assembled furniture). Drivers: need
  for competence, effort justification, endowment. *Copy/UX:* let the buyer configure, co-spec,
  or build part of the solution (a scoping worksheet, a "design your build" step) — their labor
  buys their commitment.
- **Life-Force 8 / LF8** (Drew Eric Whitman, *Cashvertising*) — *mechanism:* eight biologically
  pre-wired desires that "drive more sales than all other wants combined": **(1)** survival /
  life-extension, **(2)** enjoyment of food & drink, **(3)** freedom from fear, pain & danger,
  **(4)** sexual companionship, **(5)** comfortable living conditions, **(6)** to be superior /
  winning / keeping up with the Joneses, **(7)** care & protection of loved ones, **(8)** social
  approval. (Plus 9 weaker *learned* secondary wants — info, convenience, value, etc.) *Copy:*
  the strongest copy ties the offer to ≥1 LF8 and installs a **"mental movie"** with specific,
  visual language so the reader *sees themselves* getting the want satisfied. For B2B/high-ticket
  the live forces are #6 (superiority/winning) and #3 (freedom from fear — of falling behind).

### Group E — The 4 amplifiers (force-multipliers over the above)

- **The shared Enemy / Villain** — *mechanism:* a common antagonist (the bloated incumbent,
  the manual grind, the status quo) gives the reader a hero role and a tribe, fusing Unity +
  loss aversion. *Canonical case:* Apple's "1984" — the lone innovator vs the monolithic
  Big-Brother empire (IBM). A villain = "an industry problem, an outdated way of thinking, or a
  status quo worth fighting."
- **Future Pacing** (from NLP) — *mechanism:* the nervous system barely distinguishes a vividly
  imagined experience from a real one; paint the after-state with enough sensory detail and the
  brain treats it as a place it has already been (and now wants to keep). *Copy:* "Next quarter,
  the busywork is gone, the dashboard runs itself, and you're shipping while competitors are
  still in meetings." Works in reverse too (pace the painful future of *inaction*).
- **Status / Identity selling** — *mechanism:* people buy who it makes them *become* and how it
  signals rank (LF8 #6 + #8). *Copy:* sell the identity, not the spec — "for operators who run
  ahead, not behind." The product becomes a badge.
- **Specificity-as-proof** — *mechanism:* concrete figures are harder to fake, so they read as
  true; "platitudes roll off… actual figures are not discounted" (Claude Hopkins, 1923).
  *Copy:* "Voted #1 by the Austin Chronicle 10 years running" >> "we're the best"; "cut errors
  40% in 60 days" >> "dramatically improve quality." Specificity *manufactures credibility*.

---

## PART 2 — The mechanism beneath it all

Nearly every lever above is one heuristic in disguise: the brain runs on **System 1** (fast,
emotional, automatic) far more than **System 2** (slow, analytic). System 1 processes ~200,000×
faster; emotional stimuli are processed by the limbic system *before* the neocortex engages —
the choice is often pre-made, then rationalized. The "dark" levers are dark precisely because
they speak to System 1, side-stepping deliberation. The honest application is to use them so a
**true** message reaches System 1 with the force it deserves — not to smuggle a false one past
System 2. (This is the thread that ties the three sub-subjects below together.)

---

## PART 3 — Three related sub-subjects

### Sub-subject A — Behavioral economics & cognitive biases applied to UX ("nudge")

*Why it pertains:* copy never acts alone — it sits inside an interface, and the same biases
get encoded into layout, defaults, and flow. A **nudge** (Thaler/Sunstein lineage) is a design
element that steers a choice *without removing freedom to choose*.

*Deep findings:*
- The high-leverage UX biases: **anchoring** (struck-through prices, decoy tiers — 20–40%
  perceived-value swing), **loss aversion** (frame what the user loses by not acting),
  **default bias** (people keep the preset — so the recommended plan should be the default /
  pre-selected), **social proof** (ratings, "most popular," activity feeds), and **Von Restorff**
  (one isolated, highlighted option/CTA).
- The ethics gate that separates a *nudge* from a *dark pattern*: a nudge is **transparent**
  (a limited-time offer is clearly and truthfully labeled) and **preserves control** (easy
  opt-out, the cheaper path is still findable). The moment the design hides, traps, or coerces,
  it crosses into a dark pattern (Part 4).
- Practical GAELWORX read: encode anchoring + Von Restorff + default-bias into the pricing
  table; keep every claim true and every exit easy.

### Sub-subject B — Neuromarketing & emotional triggers

*Why it pertains:* the levers work because of brain wiring; neuromarketing is the evidence
base for *why* emotion out-pulls logic and *how* to trigger it without crossing lines.

*Deep findings:*
- ~95% of purchase cognition is subconscious/emotional; the brain processes emotional stimuli
  far faster than rational thought (the limbic system fires before the neocortex). This is the
  neural basis of **System 1** selling and of the LF8.
- **Dopamine = anticipation, not reward.** The mesolimbic dopamine system spikes on the
  *expectation* of reward (the "buyer's high" peaks *just before* purchase). Intrigue,
  incompleteness, and suspense in copy keep dopamine elevated — this is the neurochemistry
  under the **Zeigarnik / curiosity-gap** lever. Open loops literally feel good to hold open.
- Sensory and identity cues (color, type, imagery, a worldview the buyer recognizes) do real
  persuasive work pre-rationally — which is why the GAELWORX forge palette, Cinzel ignite, and
  brutalist type aren't decoration; they are emotional triggers.

### Sub-subject C — The Enemy/Villain-narrative technique in copy

*Why it pertains:* it's the single strongest *amplifier* and the spine of the Clan Voice — it
converts a feature list into a story with stakes, and a buyer into an ally.

*Deep findings:*
- Story structure needs an antagonist: the **customer is the hero**, the **brand is the
  guide/sidekick**, and the **villain** is the obstacle — usually *not* a competitor but a
  condition: the status quo, manual drudgery, the bloated incumbent, "the old way." The villain
  creates the conflict that makes the hero (and the purchase) necessary.
- It fuses three levers: **Unity** (us vs. them → tribe), **loss aversion** (the villain is
  costing you *now*), and **identity/status** (joining the fight says who you are).
- Apple's "1984" is the textbook case — the lone innovator vs. the conformist empire — and the
  template still works because a good villain is durable and *true* (a real, nameable enemy the
  buyer already resents). The trap to avoid: a *fabricated* villain or a smeared competitor
  reads as manipulation and ages badly.

---

## PART 4 — The honest / illegal line (matters MORE on a high-ticket trust sale)

The dividing test is **intent + consumer autonomy + truth**: legitimate persuasion makes a
*true* case more vivid and lets the buyer choose freely; a **dark pattern** is "a user interface
crafted to trick users into things not in their interest, at their expense." Dark patterns are
**illegal** under FTC Act §5 ("unfair or deceptive acts or practices"), and 2022–2026 FTC
enforcement (Amazon, Publishers Clearing House) is escalating. Consent obtained by trickery
"does not constitute valid consent."

| Lever | TRUE & durable (use it) | Shades into manipulation (don't) |
|---|---|---|
| Scarcity / Urgency | Real cohort caps, real deadlines ("3 client slots this quarter") | Fake countdown timers that reset, phantom "only 2 left" |
| Social Proof | Real named clients, verified results | Invented testimonials, bought reviews, fake activity pop-ups |
| Anchoring | Real higher tier / real cost-of-problem figure | A "was" price that was never charged |
| Authority | Demonstrated expertise, real credentials | Fake badges, borrowed/implied endorsements |
| Loss aversion / COI | Quantify *real* losses of the status quo | Inventing catastrophic, unfounded consequences |
| Decoy / Compromise | Genuinely-priced tiers, real trade-offs | Tiers engineered to mislead, hidden fees, drip pricing |
| Commitment | Honest micro-yeses | Roach-motel sign-ups, hard-to-cancel traps |
| Curiosity / Open loops | A tease you actually pay off | Clickbait that never delivers (erodes trust fast) |

**Why this matters more here:** on a $1,299–$35k considered purchase, the buyer is in System 2
during diligence. One caught fake — a phantom timer, an unsubstantiated stat — torches the
authority and unity you spent the whole funnel building, and the deal (and the referral) dies.
**Durable levers compound trust; deceptive ones borrow against it.** At GAELWORX's price point,
the *only* sustainable edge is levers that survive scrutiny: truth, told with force.

---

## PART 5 — GAELWORX application (Clan-Voice playbook)

Lean on the levers that are honest *and* high-ticket-appropriate: **Cost-of-Inaction (loss
aversion), the shared Enemy, the Clan (Unity), Anchoring, and Status/Identity** — all carried by
**specificity-as-proof** and the brutalist visual triggers (Von Restorff via the Molten-Edge
focus border, the ember CTA, the ignited A+E).

- **Cost-of-Inaction is more powerful than ROI here.** Humans avoid loss harder than they chase
  gain, and 40–60% of high-ticket deals die to *indecision / the status quo*, not competitors.
  Quantify the status quo first, then present the cure — make doing nothing feel expensive.
- **The Enemy is the status quo / the manual grind,** never a named competitor (fabricated
  villains age badly and read as manipulation).

**Concrete Clan-Voice examples:**

1. **Cost-of-Inaction + future-pacing (loss frame):**
   > "Every week you run it by hand, the work wins. 14 hours gone, $4,000 bled, and a competitor
   > already shipped what you're still scheduling a meeting about. That's not a price for
   > later — you're paying it right now. Automatic Execution stops the bleed."

2. **Enemy + Unity (the Clan) + status/identity:**
   > "The old way is the enemy: bloated tools, manual drudgery, software that watches you work.
   > GAELWORX is built for the operators who refuse to lose to it. Automatic Execution. Clan
   > Protected. Pick a side."

3. **Anchoring + decoy/compromise + specificity + Von Restorff (pricing):**
   > Lead with the cost of the problem ("$48k/yr lost to manual ops") to anchor *high*, then
   > three sharp-cornered tiers — a low anchor, the ember-highlighted **MOST FORGED** middle
   > (the one to buy), and a $35k enterprise tier that makes the middle feel like the prudent,
   > battle-tested choice. Every number real; every claim defensible.

---

## Sources

**Cialdini & the 7 principles**
- [CXL — Cialdini's principles of persuasion for conversions](https://cxl.com/blog/cialdinis-principles-persuasion/)
- [SUE Behavioural Design — Cialdini's 7 principles explained](https://www.suebehaviouraldesign.com/en/blog/cialdini-principles-of-persuasion/)
- [W. P. Carey News — The gentle science of persuasion, part seven: Unity](https://news.wpcarey.asu.edu/20250422-gentle-science-persuasion-part-seven-unity)
- [Cognitigence — Cialdini's 7 principles: research & practice](https://www.cognitigence.com/blog/cialdini-7-principles-of-persuasion)

**Loss aversion, anchoring, framing (Kahneman & Tversky)**
- [NN/g — Prospect Theory and Loss Aversion: how users make decisions](https://www.nngroup.com/articles/prospect-theory/)
- [Loss aversion — Wikipedia](https://en.wikipedia.org/wiki/Loss_aversion)
- [BehavioralEconomics.com — Loss aversion](https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/loss-aversion/)
- [St. Louis Fed — The Anchoring Effect](https://www.stlouisfed.org/publications/page-one-economics/2021/04/01/the-anchoring-effect)
- [Lead Alchemists — The Anchoring Effect in marketing](https://www.leadalchemists.com/marketing-psychology/anchoring-effect/)

**Decoy, compromise, Von Restorff**
- [Decoy effect — Wikipedia](https://en.wikipedia.org/wiki/Decoy_effect)
- [BehavioralEconomics.com — Decoy effect](https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/decoy-effect/)
- [WallStreetMojo — Decoy effect vs compromise effect](https://www.wallstreetmojo.com/decoy-effect/)
- [The Conversation — The decoy effect](https://theconversation.com/the-decoy-effect-how-you-are-influenced-to-choose-without-really-knowing-it-111259)

**Zeigarnik / curiosity gap (Loewenstein)**
- [Skill Arbitrage — The Zeigarnik effect in copywriting: open loops](https://skillarbitra.ge/blog/the-zeigarnik-effect-in-copywriting/)
- [NeuroMarket — The power of open loops: the Zeigarnik effect](https://blog.neuromarket.co/the-power-of-open-loops-using-the-zeigarnik-effect-to-create-irresistible-content)

**IKEA effect (Norton, Mochon & Ariely)**
- [IKEA effect — Wikipedia](https://en.wikipedia.org/wiki/IKEA_effect)
- [HBS working paper — The IKEA Effect: When Labor Leads to Love (PDF)](https://www.hbs.edu/ris/Publication%20Files/11-091.pdf)
- [The Decision Lab — IKEA effect](https://thedecisionlab.com/biases/ikea-effect)

**Life-Force 8 (Cashvertising)**
- [Enchanting Marketing — The 8 Life Forces](https://www.enchantingmarketing.com/8-life-forces/)
- [Blinkist — Cashvertising summary](https://www.blinkist.com/en/books/cashvertising-en)

**The 4 amplifiers (enemy, future pacing, status/identity, specificity)**
- [1984 (advertisement) — Wikipedia](https://en.wikipedia.org/wiki/1984_(advertisement))
- [Dan Salva — How to find the villain of your brand story](https://www.dansalva.com/blog/2019/9/11/how-to-find-the-villain-of-your-brand-story)
- [Jim Edwards — Future pacing and why you want to use it](https://medium.com/sales-copywriting-content-marketing-with-jim/future-pacing-and-why-you-want-to-use-it-a5fc1078513)
- [Growth Method — Specificity sells: conversion copywriting](https://growthmethod.com/conversion-copywriting/)
- [Copywrite Matters — Get specific or get out (credibility)](https://www.copywritematters.com/be-specific-boost-credibile-copywriting/)

**Sub-subject A — behavioral economics in UX / nudge**
- [WalkMe — 4 behavioral economics principles that boost UX](https://www.walkme.com/blog/behavioral-economics-principles-ux/)
- [Medium (A. Serag) — Nudge or manipulation? UX guide to cognitive biases](https://medium.com/@ahmmedsirag/nudge-or-manipulation-the-ux-designers-guide-to-cognitive-biases-and-ethical-influence-6c4b9554b13c)
- [NN/g — Decision frames: how cognitive biases affect UX pros](https://www.nngroup.com/articles/decision-framing-cognitive-bias-ux-pros/)

**Sub-subject B — neuromarketing / emotional triggers**
- [The Marketing Society — System 1 and System 2 thinking](https://www.marketingsociety.com/think-piece/system-1-and-system-2-thinking)
- [Pathmonk — From dopamine to dollars: neurological roots of consumer behavior](https://pathmonk.com/exploring-the-neurological-roots-of-consumer-behavior/)
- [Research & Metric — 95% of buying decisions are emotional](https://www.researchandmetric.com/blog/consumer-psychology-buying-decisions-emotional-factors/)

**Sub-subject C — enemy/villain narrative**
- [Branding Strategy Insider — How villains bring power to your brand story](https://brandingstrategyinsider.com/how-villains-bring-power-to-your-brand-story/)
- [Business of Story — Villains, fog and crevasses in your brand story](https://businessofstory.com/villains-fog-crevasses-professional-services-firms-brand-story/)

**The honest/illegal line, scarcity ethics, cost-of-inaction**
- [FTC — Report shows rise in sophisticated dark patterns](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers)
- [WilmerHale — FTC targets dark patterns (Amazon, Publishers Clearing House)](https://www.wilmerhale.com/en/insights/client-alerts/20230814-ftc-targets-dark-patterns-in-actions-against-amazon-and-publishers-clearing-house)
- [Pandectes — Dark patterns in 2026: what the FTC's new rules mean](https://pandectes.io/blog/dark-patterns-in-2026-what-the-ftcs-new-rules-mean/)
- [Hyperbound — The cost of inaction: creating urgency in sales](https://www.hyperbound.ai/blog/cost-of-inaction-sales)
- [Ecosystems.io — The true cost of doing nothing in B2B sales](https://www.ecosystems.io/blog/the-true-cost-of-doing-nothing-how-to-combat-status-quo-in-b2b-sales)
- [OptinMonster — 34 scarcity examples (with the authenticity caveat)](https://optinmonster.com/scarcity-examples-to-boost-your-conversions/)

<!-- ============================================================ -->
## Source: `docs/research/copy/05-high-ticket.md`

# 05 · High-Ticket — the Psychology of Selling Premium

> Why a $10k–$35k build is bought on **trust + identity**, not features — and how to write
> copy that carries the risk for the buyer, prices like a flagship, qualifies like a clan, and
> future-paces the "after." Research-driven; sources at the bottom. 2026-06-30.

---

## 1 · MAIN SUBJECT — High-ticket is a risk problem wearing a price tag

The mistake every founder makes: treating a high price as a **value** problem ("justify the
number with more features"). It is a **risk** problem. The number isn't what scares a buyer
spending $10k–$35k of someone else's budget on a custom build — the *fear of being wrong in
public* is. High-ticket selling is the engineering of trust and the systematic removal of risk
from the buyer's side of the table.

### Risk-as-the-gate (the load-bearing insight)

- **Losses loom ~2× larger than gains.** Kahneman & Tversky's prospect theory (1979) — the most
  cited paper in economics — shows the pain of a loss is psychologically ~twice the pleasure of
  an equivalent gain (loss-aversion coefficient λ clusters between **1.5 and 2.5**, textbook 2.0).
  At $35k, the buyer isn't weighing "good outcome vs. great outcome." They're weighing "great
  outcome vs. *I championed this, it failed, and now it's my name on the post-mortem*." Your copy
  is competing against that imagined loss. **De-risk before you up-sell.**
- **B2B buying is built to be hard.** Gartner: **77%** of B2B buyers call their last purchase
  "very complex or difficult." A complex purchase pulls in **6–10 decision-makers**, each arriving
  with **4–5 pieces of independent research**, looping (not marching) through six "buying jobs":
  Problem identification → Solution exploration → Requirements building → Supplier selection →
  Validation → Consensus creation. Buyers spend only **~17%** of the journey with *all* potential
  suppliers combined, and **5–6%** with any one vendor. The implication is brutal: **you are mostly
  absent.** The page, the proof, and the de-risking must sell when you're not in the room. Gartner
  calls this **buyer enablement** — giving the buyer the artifacts to do their own job, including
  the internal-selling job of getting consensus.
- **Self-serve raises regret.** Buyers want a rep-free experience (Gartner: **67%** prefer it),
  yet fully self-serve digital purchases produce **more purchase regret**. The reps still matter
  for *validation and confidence at key moments* — **69%** of buyers now turn to a human to
  validate AI-generated insights. So: be self-serve enough to get found and shortlisted, human
  enough to validate the leap. The deposit call / kickoff is your "validation" moment.

### The risk-reversal ladder (weak → bold)

Jay Abraham's core doctrine: most businesses treat the guarantee as an afterthought; it should be
the **core of the offer**. A bold, specific guarantee "does more to lift conversion than almost any
change you can make to the offer itself," because it **moves the risk from the buyer's shoulders to
yours.** Climb the ladder as far as your delivery can honestly back:

1. **Generic** — "satisfaction guaranteed / 30-day refund." Weak: it says nothing, so it persuades
   nothing.
2. **Specific outcome guarantee** — name the result and the timeframe. Abraham's *"make the
   intangible tangible"*: spelling out the concrete promise (the outcome, the date) makes the
   guarantee do the selling.
3. **Better-than-money-back / penalty** — refund *plus* you keep something, or we fix it on our
   dime. Asymmetry signals confidence.
4. **No-money-down / deposit-only entry** — bill after delivery, or take only a small deposit.
   Highest conversion, but invites freebie-seekers — which is why it's paired with **qualification**
   (below) so the filter is the gate, not the price.
5. **"We carry the risk" framing** — explicitly state that the *vendor* eats the downside. This is
   the high-ticket version: at $10k–$35k a refund is cold comfort (the buyer also lost months); what
   reassures is **fixed scope + fixed price + we-finish-or-we-don't-bill** so the *project* risk,
   not just the dollars, sits with you.

Cialdini's persuasion principles say *why* this lands: **Authority** and **Social Proof** are the
two principles most strongly tied to **trust and risk-taking** in the research. A guarantee is an
authority signal (only the competent dare promise specifics) and, with named/photographed proof,
a social-proof signal. Stack them.

### Premium / prestige pricing signals

- **Round numbers feel right; charm prices feel cheap.** Wadhwa & Zhang (*Journal of Consumer
  Research*, 2015, "This Number Just Feels Right") show **rounded prices ($100.00) are processed
  more *fluently*, which makes buyers lean on *feelings***; non-rounded prices ($101.53) trigger
  *cognition / scrutiny*. High-ticket is an emotional, identity-driven purchase → **price in clean,
  round numbers** ($15,000, not $14,997). The effect is mediated by a literal sense of "feeling
  right." (Charm pricing's .99 lifts demand ~24% in *commodity/value* contexts — the wrong frame
  for a flagship; .99 on a $35k build screams discount-bin.)
- **Anchor against the real alternative, not against yourself.** The buyer's reference price isn't
  "cheaper agency." It's **the loaded cost of building in-house** (a senior hire is $180k+/yr fully
  loaded, plus 6+ months to first ship, plus the risk it never ships) or **the cost of the problem
  continuing**. Set that anchor *before* you name your number; against a $200k+/yr internal bet, a
  fixed $25k build reads as the *de-risked, cheap* option.
- **Tiered/decoy pricing.** Present a premium tier alongside the target so the intended package
  becomes the "sensible" middle. Three named tiers > one number, because it gives the buying group
  something to *choose between* instead of *whether to buy at all*.
- **Price as a quality signal.** When buyers can't fully judge quality up front (true of custom
  software), price *is* a proxy for it. A too-low number doesn't win the deal — it disqualifies you
  from the consideration set of a serious buyer.

### Qualification-as-status / exclusivity (deposit as the filter)

- **Premium price is itself a filter.** Buyers who invest $5k–$10k+ are "more committed, more
  respectful of your time, and easier to work with than bargain-seekers." Selling *up* improves the
  client base, not just the margin.
- **The deposit is a commitment device, not a paywall.** A refundable design deposit raised close
  rates on deposited deals to **~91%** in one funnel — it "filters tire-kickers instantly." Tesla's
  **$100 reservation** is the canonical example: a small sunk commitment converts a browser into a
  buyer (consistency principle — people act consistently with prior commitments). The GAELWORX **$5k
  deposit** is exactly this: it's not 20% of the money, it's **100% of the signal**. *Good friction
  raises close rate; bad friction kills intent — the difference is whether the step filters for
  commitment.*
- **Status reversal via exclusivity.** Application-only / "we may not be a fit" language inverts the
  power dynamic: the buyer auditions for *you*. Scarcity is a judgment shortcut — perceived-scarce
  offers are valued **up to 26% higher**, and buyers infer that a hard-to-get thing was *curated*.
  Make the bar visible (who you take, who you don't); higher tiers should *demand* more commitment
  from both sides. Slack's invite-only beta drew 8,000+ waitlist signups in two weeks on exactly
  this dynamic.

### Selling the identity shift (future-pacing the "after" self)

High-ticket clients aren't buying information or even features — they're buying **who they become**
when the thing is done. When an offer conflicts with how a buyer sees *themselves*, they disengage
and often can't say why. The flip: lead with the **future self** — "the man, the myth, the legend
they want to be." **Future pacing** (an NLP technique in copy) makes the reader *live in* the after
for a beat: not "our platform automates intake," but "*picture Monday — the queue's already
triaged, your phone didn't buzz once overnight, and you're the operator who runs a machine, not a
fire drill.*" Then back it with a same-shaped customer story (before → after). The transformation,
not the feature list, is the product.

---

## 2 · RELATED SUB-SUBJECTS

### 2A · Premium / prestige pricing strategy

**Why it pertains.** The number on a high-ticket page is the single most-scrutinized object on it.
Price isn't a tag — it's a *message* about category, confidence, and who the offer is for.

**Deep findings.**
- **Left-digit / fluency split.** Brains anchor on the leftmost digit ("$99 = nine-something"),
  which is why charm pricing works for value goods. But fluency cuts both ways: **round prices are
  *easier to process*, which routes the decision through emotion** (Wadhwa & Zhang). Premium/luxury
  goods test *better* at clean round numbers; consumers associate round prices with prestige and
  emotional purchases, charm prices with deals and scrutiny.
- **Anchoring is contextual, not absolute.** A price only means something next to a reference. Put
  the expensive option (or the in-house cost, or the cost-of-inaction figure) *first*; every later
  number is judged relative to it. Decoy/tiering exploits the same wiring.
- **Price-quality inference under uncertainty.** The harder a buyer finds it to verify quality
  pre-purchase, the more they read price *as* quality. Custom software is maximally hard to verify
  up front → underpricing actively signals "amateur."
- **Endpoints still matter — pick them on purpose.** Round = prestige/emotional; non-round/charm =
  value/rational. Choose the endpoint that matches the frame you want the buyer in. For a flagship,
  that's round.

### 2B · Risk-reversal & guarantee design

**Why it pertains.** Loss aversion makes the *fear of a bad outcome* — not the price — the real
objection at $35k. The guarantee is the instrument that neutralizes it.

**Deep findings.**
- **Specificity is the multiplier.** Abraham: a vague "satisfaction guaranteed" persuades no one; a
  guarantee that *names the outcome and the timeframe* does the selling itself ("make the intangible
  tangible"). Specific guarantees out-convert generic ones.
- **Asymmetry signals confidence.** Better-than-money-back (refund + you keep a bonus / we redo it
  free) telegraphs that the seller genuinely expects to win. The bolder the (honest) guarantee, the
  louder the authority signal.
- **Match the guarantee to the *actual* risk.** For a build, the buyer's nightmare isn't "I lost
  money" — it's "I lost *six months and my credibility* and still have no software." A money-back
  refund doesn't cover that loss; **fixed scope + fixed price + milestone delivery + a deposit-gated
  start** does, because it transfers *project* risk, not just dollar risk.
- **Risk reversal beats persuasion.** The Gartner reality (you're absent ~83% of the journey) means
  the page can't argue the buyer into trust — it has to *remove the reason to hesitate* so the
  buying group can reach consensus without you in the room.

### 2C · The long, looping B2B buying journey (nurture across ~6 months)

**Why it pertains.** A $10k–$35k decision is multi-month, multi-stakeholder, mostly self-serve, and
non-linear. You don't "close" it in one touch — you stay credible across a window and arm an
internal champion to sell *for* you.

**Deep findings.**
- **The journey loops, it doesn't march.** Buyers revisit each of the six buying jobs at least once;
  Gartner says optimize for the **jobs** (the tasks the group must complete), not a tidy linear
  funnel. Practically: your content has to serve *whatever job they're in right now* — exploration,
  requirements, validation, consensus — not just "top/middle/bottom."
- **Consensus is the hardest job.** With 6–10 stakeholders and ~5 research artifacts each, the deal
  dies in **internal disagreement** far more often than in vendor comparison. Your job is to make the
  champion's internal sell *easy*: a one-page business case, the ROI/cost-of-inaction math, the
  fixed-price-fixed-scope reassurance the CFO needs, the proof the skeptic needs.
- **Validation is where humans re-enter.** 67% want rep-free *until* the moment they need to be sure;
  then 69% seek a human to validate. Design the late-stage touch (the deposit call) as a
  **confidence checkpoint**, not a pitch.
- **Nurture = staying warm without nagging.** Across the months, lead with *useful* (authority
  content, teardowns, the ROI calculator) over *urgent*. Reserve genuine scarcity ("we take N builds
  a quarter") for real constraints — manufactured urgency on a serious purchase reads as
  manipulation and breaks trust.

---

## 3 · GAELWORX APPLICATION

### De-risk the $10k–$35k build in copy

Carry the risk explicitly. The buyer's downside isn't the dollars — it's the months and the name on
the failure. Put GAELWORX on the hook for the *project*, not just the refund:

- **Fixed scope, fixed price, no surprises.** "We scope it cold, we name the number, the number
  doesn't move." (Kills the buyer's #1 custom-software nightmare: open-ended cost creep.)
- **Deposit-as-filter, framed honestly.** The **$5k deposit** isn't a paywall — it's the line
  between people who are building and people who are browsing. Say so. It commits *both* sides and
  qualifies the buying group's seriousness in one move.
- **"We carry the risk" guarantee, made specific.** Name the outcome and the milestone cadence, not
  a vague promise. Climb Abraham's ladder only as far as delivery can honestly back.

### Sequence across the ~6-month window

- **Found & shortlisted (self-serve, job: exploration).** Authority content + a hard, fixed-price
  promise so a rep-free buyer can add GAELWORX to the consideration set without a call.
- **Build the business case (job: requirements + consensus).** Ship the *champion's ammunition* — a
  one-page ROI / cost-of-inaction sheet anchored against in-house cost ($180k+/yr loaded hire vs. a
  fixed build), so the internal sell to 6–10 stakeholders runs without you.
- **Validate the leap (job: validation).** The **deposit call** is the human confidence-checkpoint
  the 69% come back for — not a pitch, a *go/no-go* with the risk-reversal restated.
- **Stay warm, lead with useful.** Genuine scarcity only ("limited builds per quarter" if true);
  never manufactured urgency.

### Identity future-pace

Sell the operator they become, not the codebase they receive. Future-pace the "after," then prove
it with one same-shaped clan story.

### Clan-Voice examples (brand terms ignite the first A and first E per word)

> **De-risk / "we carry the risk":**
> *"Fixed scope. Fixed price. We finish, or you don't pay the balance. The risk is ours — that's
> the point. **A**utomatic **E**xecution. Clan Protected."*

> **Deposit-as-filter (qualification / status):**
> *"$5k holds your build. It's not the cost — it's the commitment. We take a handful of builds a
> quarter and we don't chase browsers. Put the deposit down and we go to war for you. We don't fit
> everyone. Good."*

> **Identity future-pace (the after self):**
> *"Picture the next Monday. The queue triaged itself overnight. Your phone never buzzed. You run a
> machine now — not a fire drill. That's the operator **Ma**ev**e** builds. Point the sword."*

---

## 4 · SOURCES

- [Gartner — The B2B Buying Journey (six buying jobs, looping, buyer enablement)](https://www.gartner.com/en/sales/insights/b2b-buying-journey)
- [Gartner — 67% of B2B Buyers Prefer a Rep-Free Experience (2026)](https://www.gartner.com/en/newsroom/press-releases/2026-03-09-gartner-sales-survey-finds-67-percent-of-b2b-buyers-prefer-a-rep-free-experience)
- [Gartner — 69% of B2B Buyers Turn to Sales Reps to Validate AI-Generated Insights (2026)](https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-survey-finds-sixty-nine-percent-of-b-two-b-buyers-turn-to-sales-reps-to-validate-ai-generated-insights)
- [Growth Method — Gartner's B2B Buying Journey Framework Explained (6–10 stakeholders, 4–5 research pieces, 77% complex)](https://growthmethod.com/gartner-b2b-buying-journey/)
- [Wadhwa & Zhang (2015), "This Number Just Feels Right" — Journal of Consumer Research (rounded-price fluency/feelings effect)](https://academic.oup.com/jcr/article-abstract/41/5/1172/2962090)
- [Wadhwa & Zhang — full PDF, Journal of Consumer Research](https://www.smallprojectsbureau.com/wp-content/uploads/2020/01/wadhwa-zhang-2015.pdf)
- [Psychology Today — "The Price Feels Right" (rounded prices and emotion)](https://www.psychologytoday.com/us/blog/consumed/201410/the-price-feels-right)
- [Kahneman & Tversky — Prospect Theory & Loss Aversion (losses loom ~2× larger)](https://www.simplypsychology.org/prospect-theory.html)
- [BehavioralEconomics.com — Loss Aversion (λ ≈ 1.5–2.5)](https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/loss-aversion/)
- [Jay Abraham — Risk Reversal (guarantee as core of the offer; "make the intangible tangible")](https://www.abraham.com/topic/risk-reversal/)
- [ASBN / Jay Abraham — How a More Specific Guarantee Can Guarantee More Sales](https://www.asbn.com/small-business-shows/strategic-edge-jay-abraham/how-a-guarantee-can-guarantee-more-sales/)
- [Marketing For Hippies — Three Core Strategies to Reduce the Perception of Risk](https://marketingforhippies.com/risk/)
- [Cognitigence — Cialdini's 7 Principles of Persuasion (authority, social proof, scarcity, commitment)](https://www.cognitigence.com/blog/cialdini-7-principles-of-persuasion)
- [Springer — Do Cialdini's Principles Still Influence Trust and Risk-Taking? (authority & social proof most tied to trust/risk)](https://link.springer.com/chapter/10.1007/978-3-031-59465-6_17)
- [Newzenler — High-Ticket Sales Funnel Qualification (deposit close-rate ~91%, good vs. bad friction)](https://www.newzenler.com/blog/high-ticket-sales-funnel-qualification)
- [Growbo — High-Ticket Sales Funnel Examples (Tesla $100 reservation / commitment device)](https://www.growbo.com/6-examples-of-high-ticket-sales-funnels-coaching-info-products-cars-10k-bikes-fortune-500-services/)
- [The Bold Business Expert — Exclusivity & Artificial Scarcity (scarce offers valued up to 26% higher; Slack invite-only)](https://theboldbusinessexpert.com/2025/08/05/exclusivity-sells-how-luxury-brands-create-demand-through-artificial-scarcity/)
- [MindReader — High-Ticket Sales: Pricing Psychology and Trust](https://themindreader.ai/blog-insights/high-ticket-sales-pricing-psychology)
- [Prospeo — Objection Handling in B2B Sales (cost-of-inaction, "compared to what")](https://prospeo.io/s/objection-handling-b2b-sales)
- [Studiocart — How to Sell High-Ticket Coaching Offers $3K+ (identity transformation, future self)](https://www.studiocart.co/guide/how-to-sell-high-ticket-coaching-offers-3k/)
- [Marketing Words — Future Pacing: How to Write Copy That Earns More](https://blog.marketingwords.com/write-copy-future-pacing/)

<!-- ============================================================ -->
## Source: `docs/research/copy/06-copy-and-design.md`

# Copy × Design as One Persuasion System

> Scope: How words and visual design operate as a single conversion engine — visual hierarchy as reading order, aesthetic congruence, message match, the single CTA / friction reduction, and motion as conviction — plus the hard ethical/legal line between potent emphasis and FTC-actionable dark patterns ("persuade the entrance, never trap the exit").

---

## 1. The Main Subject — Copy and Design Are Not Two Disciplines

A landing page does not have "the copy" and "the design." It has **one argument**, delivered simultaneously through type, layout, motion, and words. The reader never separates them: the look lands in ~50ms, before a single word is read, and it pre-frames whether the words will be believed. Treat copy and design as one system and you get compounding persuasion; treat them as separate hand-offs and they fight each other.

Five mechanisms make them one system.

### 1a. Visual hierarchy IS reading order

You do not get to choose what the visitor reads first — the page's contrast, size, weight, and position choose for them. Eye-tracking work pioneered by Nielsen Norman Group established the **F-pattern** (users scan the top horizontally, then a shorter second horizontal sweep, then drop down the left edge) for text-dense pages, and the **Z-pattern** for sparse, visual landing pages. The practical law: **the most important claim must be placed where the eye already goes**, not where the layout was convenient. Headings, bold keywords, and front-loaded lines exist to give the scanner anchor points — design decisions that are simultaneously copy decisions, because they determine which *words* get seen.

The corollary is brutal: if your strongest line is buried below a decorative hero, it is — functionally — not on the page.

### 1b. Aesthetic congruence — the look makes the claim believable

This is the **aesthetic-usability effect**: users perceive attractive interfaces as more usable, more credible, and more trustworthy, and they tolerate minor flaws when the interface is beautiful. Kurosu and Kashimura's ATM study (and later Tractinsky's replication) found the correlation between *perceived* beauty and *perceived* ease-of-use was stronger than the correlation between beauty and *actual* ease-of-use — i.e., the aesthetic shapes belief more than function does.

Stanford's Web Credibility Project sharpens the stakes for a sales site: **46.1%** of users assessed a site's credibility based in part on visual design (layout, typography, color), and ~75% of users judge a company's credibility by its website. The aesthetic is therefore an *argument* — a high-craft, internally consistent design is itself evidence that the company behind it is competent. **Congruence** is the requirement that the look and the words make the *same* promise: a page that claims "meticulously engineered" in a sloppy, default template is non-congruent and self-refuting. The aesthetic-usability effect is strongest "when the aesthetics support and enhance the content and functionality" — beauty disconnected from the message is wasted.

### 1c. Message match — the ad→landing handshake

**Message match** (a.k.a. "ad scent" / congruence) is how well the landing page's headline and visuals match the ad, email, or link the visitor just clicked. In the first ~3 seconds the visitor makes a binary judgment — *"Am I in the right place?"* — and strong message match answers *yes* before they read the body. Break the scent (ad promises X, page leads with Y) and you pay for the click but lose the conversion; Unbounce frames poor message match as the reason "98% of your paid ads are a colossal waste of money." Message match is the clearest proof that copy and design are one system: it must hold across **headline wording, imagery, and color** simultaneously, from creative → page → confirmation.

### 1d. The single clear CTA & friction reduction

Conversion-Centered Design (Oli Gardner, Unbounce) supplies the discipline. The governing metric is **Attention Ratio** — the ratio of clickable things on the page to the number of campaign goals. The ideal is **1:1**: one goal, one place to click. The data is concrete: Unbounce's database shows conversion falling from ~13.8% at one link to ~5.86% at ten links, and removing distractions to take a webinar page from 6:1 down to 1:1 lifted conversions **over 40%**. Single-CTA emails have been reported to lift clicks dramatically vs. multi-CTA versions, and a single CTA per landing page is cited as converting ~32% better than offering multiple options.

Friction reduction is the same principle applied to effort. **Hick's Law**: decision time rises logarithmically with the number of choices. Every form field adds cognitive load (interpret the question, retrieve the answer, format it) — cutting registration options from four to three has been measured to lift conversion ~16.9%. Tactics: fewer fields, progressive disclosure, removing competing links, one unambiguous action. **Friction reduction is ethical persuasion**: you are removing obstacles to a choice the user already wants, not engineering a choice they don't.

### 1e. Motion as conviction

Motion is the system's *connective tissue and emphasis*, not decoration. Purposeful animation reduces cognitive load by explaining what changed, maintains orientation across state changes, and directs attention to the CTA. The persuasion value is in **confidence**: a snap-precise, immediate response to interaction reads as "this machine is solid"; a janky or laggy one reads as "this product is fragile" — congruence again, expressed in time. Motion that has no informational job (it doesn't guide, orient, or confirm) is noise and should be cut. The rule: **every animation reinforces a function** — leading the eye, indicating cause/effect, or confirming an action.

---

## 2. Three Related Sub-Subjects

### Sub-subject A — Conversion-Centered Design (CCD) principles

**Why it pertains:** CCD is the operational grammar that turns "copy × design" from a vibe into a checklist. It is where persuasion becomes measurable and where the *legitimate* version of every dark pattern lives.

**Deep findings — the 7 CCD principles (Gardner / Unbounce):** the seven moves are to **create focus, build structure, stay consistent, show benefits, draw attention, design for trust, and reduce friction**. The load-bearing techniques:

- **Attention Ratio → 1:1.** One goal per page, one CTA. (Conversion 13.8% at 1 link vs 5.86% at 10; +40% from 6:1→1:1.)
- **Encapsulation.** Frame the offer — a window, container, arrow, or device that "wraps" the conversion area so the eye is led straight to it.
- **Contrast & color.** The CTA must be the loudest element on the page. On a cool/dark palette, a warm button "dominates attention."
- **Directional cues.** Arrows, gaze-direction in imagery, lines that point at the form.
- **White space.** Isolation = emphasis; space around the CTA raises its perceived importance.
- **Urgency & scarcity.** Powerful *when true* — and a legal landmine when fabricated (see §4).
- **Trust / design-for-trust.** Testimonials, guarantees, security signals, real identity — directly echoing Stanford's credibility findings.

The throughline: every CCD lever is a *focusing* lever. CCD's entire ethic is **reducing the friction toward a choice the user wants** — which is exactly the boundary that separates it from manipulation.

### Sub-subject B — Visual hierarchy, attention & eye-tracking

**Why it pertains:** Hierarchy is the mechanism by which copy is *sequenced*. You can't write a persuasive page if you don't control the order it's read in — and you don't control order with word choice, you control it with visual weight.

**Deep findings:**

- **F-pattern** (NN/g, validated across thousands of users): horizontal sweep at top, shorter second sweep, then a vertical scan down the left edge — typical of text-heavy content (articles, search results, body copy). Mitigation: front-load the value in the first two lines, surface keywords in bold, chunk with headings and lists so the *scan path* still hits the argument.
- **Z-pattern**: for sparse, image-led landing pages the eye traces top-left → top-right → diagonal → bottom-right; place logo/value top-left, secondary message top-right, and **CTA at the terminal bottom-right** where the Z ends.
- **Gestalt + scanning:** size, weight, color, and spacing establish which element is "first." The first impression forms in ~50ms (≈10× faster than reading), so **layout pre-decides the verdict** before copy is processed.
- **Practical law:** highlight keywords; use headings, bullets, numbered lists, bold; one dominant element per viewport. Hierarchy is the bridge that makes the reading order *equal* the persuasion order.

### Sub-subject C — Aesthetic-usability effect, credibility & trust

**Why it pertains:** On a **high-ticket** sale ($1,299–$35,000), the conversion is *trust*, not impulse. The buyer cannot inspect the product before paying, so the *interface itself* is the primary evidence of competence. This is where aesthetics stop being taste and become a revenue lever.

**Deep findings:**

- **Aesthetic-usability effect (NN/g):** attractive design is *perceived* as more usable and earns tolerance for minor friction; the effect is "at its strongest when the aesthetics support and enhance the content and functionality." Misused, it's a "beauty trap" (pretty but broken) — so beauty must ride on top of real substance.
- **Stanford Web Credibility:** ~75% judge credibility by design; **46.1%** cite overall visual design (layout, typography, color) in their credibility assessment. Concrete trust elements: clean modern layout, fast load, real physical address, third-party citations, consistent typographic system.
- **Implication for premium sales:** craft *is* the pitch. A design that is internally rigorous (consistent type scale, deliberate spacing, zero default-template tells) is read as proof of engineering discipline — congruent with a studio that sells "meticulously engineered" automation.

---

## 3. The Dark-UX Line — Potent Emphasis vs. Actionable Manipulation

The persuasion toolkit and the deception toolkit *use the same primitives* — contrast, scarcity, defaults, framing. The line is not the technique; it's **whether the user, fully informed and free to verify, would still make the choice**. The FTC's working definition: dark patterns are "**design practices that trick or manipulate users into making choices they would not otherwise have made and that may cause harm.**" They are pursued as **unfair or deceptive acts or practices under Section 5 of the FTC Act**.

### The taxonomies (know both)

- **Brignull's original 12** (coined 2010, darkpatterns.org → now deceptive.design): friend spam, forced continuity, disguised ads, **confirmshaming**, bait & switch, hidden costs, **roach motel**, privacy zuckering, misdirection, price-comparison prevention, trick questions, **sneak into basket**.
- **Gray et al.'s 5 higher-order categories** (the version regulators cite): **Sneaking, Obstruction, Interface Interference, Forced Action, Nagging.**
- **FTC's 4 problem clusters** (*Bringing Dark Patterns to Light*, Sept 2022): (1) misleading consumers / disguising ads ("masquer-ads"); (2) making subscriptions/charges **hard to cancel**; (3) **burying key terms & junk fees** (drip pricing); (4) **tricking users into sharing data** via steered defaults.

### Persuade-the-entrance vs. trap-the-exit

| Legitimate emphasis (potent + legal) | Dark pattern (FTC-actionable) | The distinguishing test |
|---|---|---|
| **Real scarcity** — "only 3 seats this cohort," and it's true | **Fake urgency** — countdown timers that reset on refresh; "only 2 left" with 200 in stock | Would a shopper who pauses to verify find you telling the truth? Fake scarcity also raises returns/regret. |
| **Transparent pricing** — total cost shown up front | **Hidden fees / drip pricing** — mandatory charges revealed late in checkout (FTC cluster #3) | Is the *real* price known *before* the user commits effort/billing info? |
| **Clear single CTA** with an obvious, equal-weight "no" | **Confirmshaming** — decline labeled "No, I don't want to save money" | Is the opt-out stated neutrally, or is the user shamed/guilted? |
| **Easy entrance AND easy exit** — one-click signup, one-click cancel | **Roach motel / obstruction** — one-click in, a "maze of screens" out | Symmetry: cancellation should be ~as easy as signup. Roach motel is the **single most-enforced** dark pattern in US law. |
| **Honest defaults** that serve the user | **Sneaking / pre-checked boxes** — add-ons slipped into the cart; data-sharing pre-selected | Was an item/consent added without an explicit, affirmative user action? |
| **Highlighting the recommended option** | **Misdirection / interface interference** — visual tricks burying the cheaper or decline path | Is the preferred path *emphasized*, or is the alternative *hidden/disabled*? |

### 2022–2025 enforcement (the line has teeth)

- **Amazon Prime — $2.5B settlement (Sept 25, 2025; one of the largest in FTC history): $1B civil penalty + $1.5B consumer redress.** FTC alleged Amazon used dark patterns to enroll ~35M consumers and trapped them in a deliberately convoluted cancellation flow (internally nicknamed "Iliad"). Statutes: ROSCA + FTC Act §5. Eligible consumers can receive up to ~$51.
- **Epic Games / Fortnite — $245M** (refunds) within a **$520M** total (2022–2023): "counterintuitive, inconsistent, and confusing button configuration" caused unwanted charges; also COPPA violations.
- **Vonage — $100M** (Nov 2022): junk fees + a deliberately hard-to-cancel flow (roach motel) + charges without informed consent.
- **Regulatory note:** the FTC's **"Click-to-Cancel" / amended Negative Option Rule** (cancellation must be ~as easy as signup) was **vacated by the Eighth Circuit on procedural grounds (July 8, 2025)** — but the FTC **still polices the same conduct under FTC Act §5 and ROSCA**, and a patchwork of **state auto-renewal laws** remains in force. So the *rule* lapsed; the *liability* did not.

**Bottom line:** *Persuade the entrance, never trap the exit.* Emphasis is moving a true thing into view. Manipulation is hiding a true thing (the price, the exit, the real choice) so the user acts against their own interest.

---

## 4. GAELWORX Application

GAELWORX sells high-trust, high-ticket AI implementation. The conversion *is* trust, so the design must function as proof — and must stay on the legal/ethical side of the line *visibly*, because the buyer is sophisticated.

### The brutalist aesthetic IS the argument (aesthetic congruence)

Neo-Gaelic Brutalism is not a style choice here; it's a *claim made in form*. The aesthetic-usability and credibility research says the look is read as evidence of competence in ~50ms — so the brutalist system *is* the first sentence of the pitch:

1. **0px corners, 1–2px hard borders, the Iron Grid (0px gaps, absolute alignment), 8px hard drop shadow.** Rigor in the layout reads as rigor in the engineering. "Meticulously engineered" must be *shown* by a pixel-disciplined grid, or the words are non-congruent and self-refuting. The Cinzel display + forge-glow ignite is the high-craft signal that separates a $35k studio from a template.
2. **The forge palette as functional emphasis.** Ember Glow / Celtic Blood are reserved for *the active system and the CTA* — exactly CCD's "contrast/color" principle: on the Forged-Iron black field, the warm CTA "dominates attention" honestly (it's loud because it's important, not because it's tricking anyone).
3. **Brutalist Snap motion = conviction.** 0ms delay, impact-not-bounce. The motion law literally encodes "this machine is solid." Forge Reveal (blur→sharp) guides the eye to the new content. This is motion doing an informational job, not decoration.

### "Point the Sword" — single-CTA discipline (Attention Ratio 1:1)

The Clan Voice CTA logic maps cleanly onto CCD:

- **Every page = one goal = one sword.** Drive Attention Ratio toward 1:1. A page selling the flagship engagement should not also offer a newsletter, three nav detours, and a social wall competing for the click. Cut links; encapsulate the offer; let white space isolate the CTA.
- **Direct-command copy + sharp high-contrast button.** "Point the Sword" already prescribes the contrast and immediate feedback CCD calls for — keep the decline/secondary path present but lower-weight, never shamed.
- **Message match across the funnel.** A "Automatic Execution. Clan Protected." ad must land on a page that *opens* with that exact promise and the same forge visuals — the scent has to hold from creative → page → confirmation, or paid clicks bleed out.

### What to NEVER do on a high-ticket trust sale (concrete)

A buyer evaluating a $35,000 commitment is *looking* for reasons to distrust. One dark pattern detonates the entire credibility argument the brutalist aesthetic worked to build. Hard rules:

1. **No fake timers / fabricated scarcity.** If a cohort genuinely has limited slots, say the true number and let it be verifiable. A countdown that resets on refresh on a premium offer is instant credibility death (and §5 exposure). Real scarcity only.
2. **No hidden fees / drip pricing.** State the price band ($1,299–$35,000) and what's included *before* the buyer invests effort. Burying the real number until late is FTC cluster #3 — and on a trust sale it reads as exactly the kind of slipperiness an automation buyer fears.
3. **No roach motel on cancellation/offboarding, and no confirmshaming on declines.** If there's a retainer or subscription, cancellation must be as easy as the entrance ("persuade the entrance, never trap the exit"). Decline links stay neutral — never "No, I'll keep doing it manually like a fool." Confirmshaming a sophisticated B2B buyer signals desperation, not strength. The Clan Voice is *aggressive about the value*, never coercive about the exit.

**Net:** GAELWORX wins by making the *honest* version of every persuasion lever maximally potent — brutalist craft as believability, 1:1 focus as clarity, true scarcity and transparent pricing as confidence — and by treating the dark-pattern line as a brand asset, not a constraint. A studio that "Clan Protects" its clients does not trap them.

---

## 5. Sources

**Copy × design system / CCD / message match / friction**
- [The 7 Principles of Conversion-Centered Design — Unbounce](https://unbounce.com/conversion-centered-design/)
- [The Seven Simple Principles of Conversion Centred Design (CCD) — Interaction Design Foundation](https://ixdf.org/literature/article/the-seven-simple-principles-of-conversion-centred-design-ccd-and-how-to-use-them)
- [What is Attention Ratio? — Unbounce Glossary](https://unbounce.com/conversion-glossary/definition/attention-ratio/)
- [What is Attention Ratio? Landing Pages 101 — Carnegie](https://www.carnegiehighered.com/blog/what-is-attention-ratio-landing-pages-101/)
- [Message Match — Unbounce Glossary](https://unbounce.com/conversion-glossary/definition/message-match/)
- [98% Of Your Paid Ads Are A Colossal Waste of Money (message match) — Unbounce](https://unbounce.com/ppc/poor-message-match/)
- [15 Call-to-Action Statistics — HubSpot](https://blog.hubspot.com/marketing/personalized-calls-to-action-convert-better-data)
- [Few Guesses, More Success: 4 Principles to Reduce Cognitive Load in Forms — NN/g](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [Hick's Law and UX Design — Dovetail](https://dovetail.com/ux/hicks-law/)

**Visual hierarchy / eye-tracking**
- [Using F and Z patterns to create visual hierarchy — 99designs](https://99designs.com/blog/tips/visual-hierarchy-landing-page-designs/)
- [From F to Z: How Users Read Your Content — Acquia](https://www.acquia.com/blog/content-reading-patterns)
- [Visual Hierarchy: 8 Principles and Fundamentals](https://uxpilot.ai/blogs/visual-hierarchy)

**Aesthetics / credibility / trust**
- [The Aesthetic-Usability Effect — NN/g](https://www.nngroup.com/articles/aesthetic-usability-effect/)
- [Aesthetic-Usability Effect — Laws of UX](https://lawsofux.com/aesthetic-usability-effect/)
- [The Web Credibility Project: Guidelines — Stanford University](https://credibility.stanford.edu/guidelines/index.html)
- [Stanford Web Credibility Project — Wikipedia](https://en.wikipedia.org/wiki/Stanford_Web_Credibility_Project)

**Motion**
- [Motion Matters: How Animation Elevates UX — Bootcamp/Medium](https://medium.com/design-bootcamp/motion-matters-how-animation-elevates-ux-in-2025-b181adca68a9)
- [What Is UI Animation? — Interaction Design Foundation](https://ixdf.org/literature/topics/ui-animation)

**Dark patterns: taxonomy + FTC law + enforcement**
- [Bringing Dark Patterns to Light (FTC Staff Report, Sept 2022) — FTC](https://www.ftc.gov/reports/bringing-dark-patterns-light)
- [Bringing Dark Patterns to Light (full PDF) — FTC](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800+Dark+Patterns+Report+9.14.2022+-+FINAL.pdf)
- [FTC Report Shows Rise in Sophisticated Dark Patterns — FTC press release](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers)
- [Deceptive Patterns in UX: How to Recognize and Avoid Them — NN/g](https://www.nngroup.com/articles/deceptive-patterns/)
- [Dark Patterns: Brignull's Manipulative UX Tricks — Yu-kai Chou](https://yukaichou.com/gamification-analysis/dark-patterns-brignull-manipulative-design-ux/)
- [Dark pattern — Wikipedia (Brignull 12 + Gray 5 categories)](https://en.wikipedia.org/wiki/Dark_pattern)
- [What Hides in the Shadows: Deceptive Design of Dark Patterns — Congress.gov / CRS](https://www.congress.gov/crs-product/IF12246)
- [Scarcity Marketing: Real vs Fake Urgency Guide — Growth Suite](https://www.growthsuite.net/resources/shopify-discount/scarcity-marketing-time-limited-discounts)

**Enforcement cases**
- [Amazon to Pay Record $2.5B to Settle FTC Prime Claims — Keller and Heckman](https://www.khlaw.com/insights/amazon-pay-record-25-billion-settle-ftc-claims-deceptive-prime-membership-signup-and)
- [FTC Reaches Record $2.5B Settlement with Amazon over Prime — Alston & Bird](https://www.alston.com/en/insights/publications/2025/10/ftc-settlement-prime-subscription-practices)
- [Amazon $2.5B settlement / dark patterns — Fortune](https://fortune.com/2025/09/25/amazon-ftc-settlement-prime-automatic-renewal-lina-khan-dark-patterns/)
- [FTC Finalizes Order Requiring Epic Games (Fortnite) to Pay $245M — FTC](https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-finalizes-order-requiring-fortnite-maker-epic-games-pay-245-million-tricking-users-making)
- [FTC Dark Pattern Fines: $245M+ Enforcement Cases — Page Auditors](https://www.pageauditors.com/blog/dark-patterns-ftc-enforcement-guide)
- [Eighth Circuit Vacates FTC's Click-to-Cancel Rule — Latham & Watkins](https://www.lw.com/en/insights/eighth-circuit-vacates-ftc-click-to-cancel-rule-days-before-compliance-deadline)
- [Click to Cancel Just Got Cancelled — Cooley](https://www.cooley.com/news/insight/2025/2025-07-11-click-to-cancel-just-got-cancelled-eighth-circuit-vacates-entirety-of-ftcs-negative-option-rule)

<!-- ============================================================ -->
## Source: `docs/research/copy-architecture-and-dark-persuasion.md`

# Research: Copy Architecture, Archetypes & the Dark Levers (for high-ticket)

> Compiled 2026-06-30. The persuasion + copy system for GAELWORX — a high-ticket
> ($1,299 → $35k) AI-implementation studio with a "Neo-Gaelic Brutalist / Clan Voice."
> Covers: modern web-copy craft · copy frameworks · brand archetypes · the "dark"
> persuasion levers · the white-hat/black-hat line (what's potent vs. what's illegal &
> trust-torching) · and the GAELWORX playbook. Sources at the bottom.

---

## PART 1 — Modern web copy (the craft, 2026)
- **Clarity beats cleverness.** Write like you're explaining to a smart colleague, not a
  confused stranger. The **read-it-aloud test**: if it doesn't sound like something a
  person would say, cut it. Casual/confident/plain tones out-convert corporate ones.
- **Specificity is persuasion.** Concrete > abstract: *"Triple your bookings in 90 days"*
  beats *"Reimagining growth."* Numbers, names, timeframes, mechanisms. Vague = unbelievable.
- **Outcome-first, not feature-first.** Lead with the result the buyer gets; the feature is
  the proof, not the pitch.
- **Respect skepticism (B2B).** Name the hesitation out loud and disarm it
  (*"We get it — a custom build feels like a leap; that's why fixed scope, fixed price,
  7 days, and we carry the risk."*). Earned trust > hype.
- **Microcopy carries weight.** Buttons, labels, empty states, the line under the CTA — tiny
  text that removes friction and reassures at the moment of action. Never "Submit."

## PART 2 — Copy architectures (the frameworks)
**Diagnose AWARENESS first (Eugene Schwartz's 5 stages — the master key):**
Unaware → Problem-Aware → Solution-Aware → Product-Aware → Most-Aware. The #1 blunder is
using an awareness-building formula on a solution-aware buyer (or vice-versa). Match the
frame to the stage:

| Stage | They know… | Lead with | Best framework |
|---|---|---|---|
| Unaware | nothing | a story / a striking claim | **AIDA**, story hook |
| Problem-Aware | the pain | the pain, sharpened | **PAS** (Problem-Agitate-Solve) |
| Solution-Aware | solutions exist | the transformation | **BAB** (Before-After-Bridge) |
| Product-Aware | you | proof + differentiation | proof stack, **StoryBrand** |
| Most-Aware | & want it | the offer + urgency | the deal, the CTA |

**The core formulas:**
- **AIDA** — Attention · Interest · Desire · Action. The grandfather; top-of-funnel.
- **PAS** — Problem · Agitate · Solution. Twist the knife on a known pain, then relieve it.
  The workhorse for service/ad pages.
- **BAB** — Before · After · Bridge. Paint today's mess, the better future, then *you* as the
  bridge. Great for solution-aware homepages.
- **StoryBrand (SB7)** — the **customer is the HERO, you are the GUIDE.** Hero has a problem,
  meets a guide (you) with a plan, who calls them to action, ending in success and stakes
  (avoiding failure). The default for brand homepages.
- **4 Ps** — Promise · Picture · Proof · Push. Long-form sales-page spine.
- **Market sophistication** (Schwartz, the second key): the more competitors have made the
  same claim, the more you must escalate — bigger claim → new mechanism → new identity. In a
  market drowning in "AI for your business," **you win on MECHANISM + IDENTITY**, not louder claims.
- **Elite move:** don't run one formula — **hybridize** (PAS → BAB → proof → offer) so it
  reads as a conversation, not a template. And honor the **"slippery slide"** (Sugarman):
  every line's only job is to get the next line read.

## PART 3 — Brand archetypes → voice
The 12 (Jung): Outlaw · Hero · Magician · Ruler · Sage · Explorer · Creator · Lover · Jester ·
Everyman · Caregiver · Innocent. Each encodes a **core desire, fear, and voice**.
- **Hero** — mastery, courage, "we conquer hard problems for you." Voice: bold, direct.
- **Outlaw** — disruption, rebellion against a broken status quo. Voice: aggressive, honest,
  defiant. (This is GAELWORX's spine: *against* busywork and AI snake-oil.)
- **Ruler** — order, control, premium command. Voice: precise, authoritative. (The polish that
  justifies the price.)
- **Magician** — transformation, "it runs itself." Voice: confident, visionary.
> **GAELWORX = Outlaw × Hero, with Ruler polish, bound by the CLAN (Unity).** Rebel against
> the hype + the chaos (Outlaw), conquer it for the owner (Hero), deliver with forged
> precision (Ruler), and pull the buyer into the tribe (Unity = the strongest loyalty lever).

## PART 4 — The DARK LEVERS (persuasion psychology)
Cialdini's **7 principles** + the high-ticket amplifiers. These are the engine of conviction:
1. **Reciprocity** — give first (a real teardown, a free audit) → obligation to reciprocate.
2. **Commitment/Consistency** — small yes → big yes; get them to state the problem in their
   own words (the estimator does this).
3. **Social proof** — *specific* proof from people like them (same trade/size). Vague logos < a
   named result. (GAELWORX gap: the `/work` case studies are the biggest missing lever.)
4. **Authority** — credentials, mechanism, "built on the rails that run banks." De-risks the
   high ticket. For B2B, **Authority + risk-reversal** is the premium-sale combo.
5. **Liking** — shared identity, shared enemy, the owner-operator voice ("we've run the shop").
6. **Scarcity** — restricted availability raises perceived value (*real* scarcity only — see Part 5).
7. **Unity** — the deepest: shared identity / "one of us." The **Clan.** This is GAELWORX's
   nuclear lever and it's 100% white-hat.

**The amplifiers (where "dark" copy actually lives):**
- **Loss aversion** — losing hurts ~2× more than gaining feels good (Kahneman/Tversky). **Frame
  the COST OF INACTION louder than the upside.** *"Every missed call is a job your competitor
  booked,"* not just *"book more jobs."*
- **The ENEMY / villain** — name a shared enemy and you stop being a salesperson and become an
  ally; *the enemy* pushes them to the solution, not you. GAELWORX's **dual villain:**
  (a) the operational chaos (missed calls, six apps, busywork) and (b) the **AI-hype industry**
  (black-box oracles, confident nonsense, pilots that rot in "phase two"). Position GAELWORX as
  the honest insurgent against both.
- **Future pacing** — make them *live* the after-state ("Monday: every call answered, the truck
  booked, you on the job") — and the negative version (the cost-of-inaction movie).
- **Status / identity selling** — premium buyers buy who they *become*. Sell the identity of
  the operator who commands a system, not a tool. ("People don't pay premium because you're
  worth it — because they *believe* they're worth it." — see pricing brief, Yarmosh.)
- **Anchoring** — the high number first reframes everything ("$48k/yr receptionist → Maeve from
  $499/mo"). Already in the brand copy; keep every price anchored.
- **Specificity as proof** — concrete detail *is* a dark lever: it manufactures believability.

## PART 5 — The LINE: potent vs. illegal (white-hat / black-hat)
"Dark marketing" splits into **persuasion** (ethical, potent, durable) and **manipulation /
dark patterns** (deceptive, FTC-actionable, trust-torching). For a **high-ticket** sale the
*entire* asset is trust — so the deceptive levers don't just risk fines, they kill the deal.

**USE (white-hat, potent):** loss aversion / cost-of-inaction · the shared enemy · future
pacing · status & identity · anchoring · authority + risk-reversal · the Clan/Unity · **true**
scarcity (real capacity limits: "we take N builds a quarter," "Continental US, 7 days") ·
specificity & named proof.

**AVOID (black-hat / FTC dark patterns — illegal &/or trust-killing):** fake countdown timers &
invented "only 2 left" · hidden fees / drip pricing · **confirmshaming** ("No, I don't want more
revenue") · forced continuity & hard-to-cancel · bait-and-switch · fabricated testimonials /
fake urgency. The FTC's 2025 enforcement is aggressive — **$2.5B Amazon settlement** over
Prime sign-up/cancel dark patterns; **$8M Care.com**. The line: **transparency, simplicity,
accountability.** A $35k buyer who catches one fake scarcity badge is gone forever.
> Rule for GAELWORX: every potent lever must be **TRUE.** The scarcity is real (capacity), the
> enemy is real (it is), the proof is real (ship the case studies), the anchor is real (market
> rates). Brutalist honesty *is* the brand — and it's the most durable persuasion there is.

## PART 6 — The GAELWORX PLAYBOOK
- **Archetype lockup:** Outlaw × Hero, Ruler polish, Clan/Unity binding. Voice stays the Clan
  Voice (aggressive, clean, battle-tested, "Point the Sword").
- **Villain, made explicit:** dual enemy — the **chaos** (missed calls/busywork/six-apps-one-mess)
  and the **AI snake-oil industry** (black-box, hype, abandon-ware pilots). GAELWORX = the
  owner-operator insurgent who actually ships.
- **Framework per surface:**
  - **Home** — StoryBrand-hybrid: owner = hero, GAELWORX = the guide with the forge; problems
    drain → the system → the CTA. (Largely already there.)
  - **Service pages** — **PAS** (problem-aware traffic): sharpen the specific pain, agitate the
    cost of inaction, then the mechanism + anchored price + risk reversal.
  - **/work** — the missing **social-proof** engine: specific, named, same-trade results. The
    single highest-ROI copy build remaining.
  - **Pricing** — anchored ("$48k/yr vs $499/mo"), sequenced late (per the pricing brief), with
    risk-reversal ("we carry the risk; you pay when it executes").
  - **Contact/CTA** — future-pace the after-state + the cost of waiting; one-line risk-reversal
    under every sword.
- **Levers to lean on:** cost-of-inaction, the shared enemy, the Clan, authority+risk-reversal,
  true scarcity (capacity/7-days), specificity. **Levers to refuse:** fake timers, hidden fees,
  confirmshaming — they'd torch a high-ticket sale.
- **Sharpen these existing lines** (examples): turn passive benefits into loss-framed enemy
  lines — *"Six apps. One mess." → "Six apps, none of them talking. The job falls through the
  crack between them."*; *"Built to execute, not to babysit." → keep (it's already enemy-framed).*

## Sources
**Frameworks / craft**
- [Thrive Themes — Copywriting Formulas 2026](https://thrivethemes.com/copywriting-formulas/) ·
  [SwiftCopy — AIDA vs PAS vs BAB 2026](https://swiftcopy.io/blog/aida-pas-bab-copywriting-frameworks) ·
  [Medium — 2025 frameworks outperforming AIDA](https://medium.com/@drishtisethi8/2025-copywriting-frameworks-that-are-outperforming-aida-and-how-to-use-them-bf161f6c45a4) ·
  [Magnet — killer web copy](https://magnet.co/articles/an-idiots-guide-to-writing-killer-web-copy) ·
  [NN/g — tone of voice](https://www.nngroup.com/topic/tone-voice/) ·
  [Shopify — microcopy 2026](https://www.shopify.com/enterprise/blog/how-to-write-microcopy-that-influences-customers-even-if-they-don-t-read-it) ·
  [Intuitia — B2B web design that converts 2026](https://www.intuitia.tech/blog/b2b-website-design)
**Archetypes**
- [Iconic Fox — Brand Archetypes definitive guide](https://iconicfox.com.au/brand-archetypes/) ·
  [Justin Blackman — archetypes vs brand voice](https://justinblackman.com/archetypes/) ·
  [Our Own Brand — 12 archetypes 2026](https://ourownbrand.co/the-ultimate-guide-to-brand-archetypes-harnessing-carl-jungs-insights-for-branding-success)
**Persuasion / dark levers**
- [Cognitigence — Cialdini's 7 principles](https://www.cognitigence.com/blog/cialdini-7-principles-of-persuasion) ·
  [Advergize — scarcity principle](https://www.advergize.com/scarcity-principle-marketing/) ·
  [NN/g — scarcity in UI](https://www.nngroup.com/articles/scarcity-principle-ux/) ·
  [Copyblogger — find an enemy](https://copyblogger.com/do-you-have-an-enemy-heres-why-you-need-to-find-one/) ·
  [Jim Edwards — make enemies / future pacing](https://medium.com/sales-copywriting-content-marketing-with-jim/if-you-want-to-make-sales-youve-got-to-make-enemies-3fc9bbc92621) ·
  [Carmine Mastropierro — future pacing](https://carminemastropierro.com/future-pacing-copywriting-2/) ·
  [Simon-Kucher — prestige pricing](https://www.simon-kucher.com/en/insights/prestige-pricing-strategies-superior-brand-positioning)
**The ethical/legal line**
- [Berkeley Tech Law Journal — Trapped by Design (dark patterns)](https://btlj.org/2025/11/trapped-by-design-how-dark-patterns-manipulate-your-choices-and-the-regulators-fighting-back/) ·
  [Reed Smith — dark patterns enforcement](https://www.reedsmith.com/articles/dark-patterns-lead-to-enforcement-spotlight-key-compliance-steps-for-businesses/) ·
  [Pandectes — FTC dark patterns 2026](https://pandectes.io/blog/dark-patterns-in-2026-what-the-ftcs-new-rules-mean/) ·
  [FTC — dark patterns review](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-icpen-gpen-announce-results-review-use-dark-patterns-affecting-subscription-services-privacy)

<!-- ============================================================ -->
## Source: `docs/research/copy-deep-dive-advanced.md`

# Copy & Persuasion — the Deep Dive (advanced companion)

> Extrapolation of `copy-architecture-and-dark-persuasion.md`. Each subject taken to the
> next layer: the canonical models, the full bias stack, the high-ticket objection engine,
> and **concrete GAELWORX before→after copy**. 2026-06-30.

---

## 1 · MODERN WEB COPY — the mechanics under the craft
**The page is a chain, not a pile.** Hook → Promise → Mechanism → Proof → Offer →
Risk-reversal → CTA. Each link exists only to earn the next (Sugarman's **Slippery Slide**:
"the sole purpose of the first sentence is to get the second read"). **Bucket brigades** —
short connective lines (*"Here's the problem:" · "And it gets worse." · "But watch this."*) —
keep the eye sliding.

**The lead does 80% of the work.** First ~50 words decide if they stay. Six classic **leads**
(Masterson): Offer · Promise · Problem-Solution · Big-Secret · Proclamation · Story. Match the
lead to **awareness** (Part 2). GAELWORX home = a **Proclamation/Promise** lead ("Automatic
Execution"); service pages = **Problem-Solution** leads.

**Headline formulas** (steal these):
- The 4 U's — Useful · Urgent · Unique · **Ultra-specific** (a headline failing all four dies).
- *"How to [outcome] without [pain]"* · *"[Outcome] in [time], or [risk reversal]"* ·
  *"The [adjective] way to [outcome] — even if [objection]."*

**Voice mechanics (the line-level moat):** verbs > adjectives · concrete nouns > abstractions ·
second person ("you") · active voice · cut hedging ("just/really/very/we believe") · vary
sentence length (a 3-word fragment after a long line *lands*). The **read-aloud test** is the
final gate.

**The three brutal edits** — run every sentence through: **"So what?"** (benefit?) · **"Prove
it."** (evidence?) · **"Who cares?"** (relevance to *this* reader?). If a line can't answer, cut it.

**The AI-era moat.** Everyone now drafts with the same model → homogenized, voiceless copy.
The defensible edges: **a point of view, ultra-specificity, and a real voice.** GAELWORX's
Clan Voice + owner-operator specifics ("we've run the shop, not read the case study") is exactly
the un-clonable layer. Lean into it harder, not softer.

## 2 · COPY ARCHITECTURES — the full operating system
**Schwartz's two master dials (Breakthrough Advertising):**
- **5 Stages of Awareness** (covered) — match the frame to what they already know.
- **5 Stages of Market Sophistication** — how many times the market has heard the claim:
  1) be first → state the claim plainly. 2) others copied → make the claim *bigger*. 3) claims
  maxed → **lead with the MECHANISM** ("not AI — *Automatic Execution*: systematized rails, not
  a prompt"). 4) mechanisms maxed → make the *mechanism* bigger/more elegant. 5) all maxed →
  sell **identity/experience** ("for operators who command a system"). **The "AI for your
  business" market is at Stage 3–4 → GAELWORX must win on MECHANISM + IDENTITY, never louder claims.**

**The framework rack (beyond AIDA/PAS/BAB/SB7):**
- **PASTOR** — Problem · Amplify · Story+Solution · Transformation+Testimony · Offer · Response.
  The best long-form spine (PAS with proof + offer built in).
- **4 Ps** — Picture · Promise · Proof · Push.
- **QUEST** — Qualify · Understand · Educate · Stimulate · Transition (consult-style/high-ticket).
- **FAB + the "so that" chain** — Feature → Advantage → Benefit → *"so that"* → the emotional
  end-state. (*"Open-sourced to you (F) → no lock-in (A) → you own the system (B) → so that you're
  never hostage to a vendor again (end-state)."*)
- **The Rule of One** (Brunson/Halbert): one reader · one big idea · one promise · one offer.
  Dilution kills; a page that says three things says nothing.

**The Objection Cascade — the real architecture.** Every buyer silently asks four questions,
in order; the page must answer them in order or they bounce:
**1) Why should I care? (relevance/pain) → 2) Why you, not them? (mechanism/differentiation) →
3) Why should I believe you? (proof/authority) → 4) Why now, not later? (cost of inaction/scarcity).**
Audit any page against these four; the weakest answer is your conversion leak.

## 3 · ARCHETYPES — the full system + the shadow
**The 12, in their 4 families** (each: core desire / fear / voice):
- *Leave a mark* — **Hero** (mastery/weakness; bold), **Outlaw** (revolution/powerlessness;
  defiant), **Magician** (transformation/unintended consequences; visionary).
- *Provide structure* — **Ruler** (control/chaos; authoritative), **Creator** (create/mediocrity;
  imaginative), **Caregiver** (service/selfishness; warm).
- *Connection* — **Lover** (intimacy), **Everyman** (belonging), **Jester** (joy).
- *Yearn for paradise* — **Innocent** (safety), **Sage** (truth), **Explorer** (freedom).

**Blend a primary + secondary; mind the SHADOW.** Every archetype has a dark side that, unchecked,
repels: Hero → **bully/arrogant**; Outlaw → **nihilist/edge-lord destroying for its own sake**;
Ruler → **tyrant/cold**; Magician → **manipulator/snake-oil**. The shadow is exactly what a
bad version of GAELWORX would become.

**GAELWORX lockup — Outlaw × Hero, Ruler polish, Clan/Unity binding:**
- *Outlaw* gives the **enemy + the defiance** (against AI hype + busywork).
- *Hero* keeps it **FOR the owner** (conquer the chaos for them) — this is the antidote to the
  Outlaw's nihilist shadow. Always the owner's champion, never just a wrecker.
- *Ruler* gives the **precision + premium** that justifies $10–35k (forged, fixed, documented).
- *Unity/Clan* is the **loyalty multiplier** — "Clan Protected," one of us.
- The metaphor lexicon (forge / clan / sword / battlefield / "automatic execution") IS this blend
  rendered as vocabulary. Keep the Hero's *service* visible so the Outlaw edge never tips into bully.

## 4 · THE DARK LEVERS — the full bias stack
**Cialdini's 7, web-mapped:** Reciprocity (free teardown/audit) · Commitment & Consistency
(micro-yes → the estimator → the call) · **Social Proof** (specific, same-trade — the #1 gap) ·
Authority (mechanism + "rails that run banks") · Liking (owner-operator voice, shared enemy) ·
**Scarcity** (real capacity only) · **Unity** (the Clan — deepest, white-hat).

**The cognitive-bias arsenal (the "dark" engine):**
- **Loss aversion** (~2× — Kahneman/Tversky): frame the **cost of inaction** louder than the gain.
- **Anchoring**: the first number reframes all others ($48k/yr → $499/mo). Anchor *every* price.
- **The Decoy / Asymmetric Dominance**: a 3rd option exists to make your target look obviously
  best (classic 3-tier pricing — the "Core" plan wins because Premium makes it the smart middle).
- **Compromise effect**: people pick the **middle**; engineer the ladder so the middle is your goal.
- **Framing**: "90% retain" vs "10% churn"; "$5k deposit *to start*" (commitment) vs "you owe $5k."
- **Zeigarnik / open loops**: a curiosity gap held open pulls the read forward ("There's one reason
  these builds pay for themselves in 90 days. It's not the AI.").
- **IKEA effect**: people value what they helped build → the **estimator/configurator** makes the
  quote *theirs*, raising commitment before a human ever talks.
- **Von Restorff (isolation)**: the one thing made visually/verbally distinct is remembered — the
  ignited A+E, the single ember CTA on a black field.
- **The Life-Force 8** (Cashvertising): survival, freedom from fear/pain, comfort, superiority/
  **status**, social approval, care for loved ones, winning, sexual. High-ticket B2B pulls
  **status, fear-of-loss, comfort (peace of mind), and winning**. Aim the copy at those.

**The four amplifiers that make copy feel "dark":** the **Enemy** (a shared villain makes you the
ally) · **Future Pacing** (live the after-state in present tense — and the negative version) ·
**Status/Identity** (sell who they *become*) · **Specificity** (concrete detail manufactures belief).

## 5 · HIGH-TICKET — the psychology of the big sale
A $10–35k decision is **trust-dominated and identity-driven**, not feature-driven. The buyer's
two real questions: *"Is this safe?"* and *"Am I the kind of operator who does this?"*
- **Risk is the gate, not price.** Climb the **risk-reversal ladder**: specificity → authority →
  fixed-scope/fixed-price → deposit-gated (a *filter*, not a fee) → "we carry the risk; you pay
  when it executes" → named proof. Each rung lowers perceived risk; the sale opens when risk < desire.
- **Premium pricing IS positioning** (Yarmosh, pricing brief): clean round numbers signal premium
  ($10,000, not $9,997); charm endpoints ($1,299) signal accessible/high-volume — a coherent split,
  not a contradiction. Underpricing reads as desperate.
- **Qualification raises desire.** Making them *qualify* (the deposit, "we take N builds a quarter,"
  an application) flips the status: scarce + selective = wanted. Exclusivity is a lever.
- **It's a sequence, not a page.** B2B high-ticket = ~6-month, multi-touch, mostly self-serve
  (Gartner, pricing brief). Copy must nurture across touches: the site teaches + de-risks; the
  follow-up keeps the open loop alive. One page can't close $35k — the *system* does.
- **The transformation is an identity shift.** Future-pace from "the drowning operator buried in
  six apps" → "the commander who runs one system and sleeps." Sell the *promotion of the self*.

## 6 · COPY × DESIGN — one persuasion system
- **Design is the archetype made visible.** 0px brutalist corners + hard shadows + Cinzel +
  forge palette = the Outlaw/Ruler rendered without a word. **Aesthetic congruence** (the look
  *matches* the "battle-tested, no-BS" claim) is itself persuasion — it makes the copy believable.
- **Visual hierarchy = reading order.** The eye-path (ignited wordmark → headline → one ember CTA)
  enforces the slippery slide; isolation (Von Restorff) makes the CTA inevitable.
- **Message match.** Ad/referrer promise must equal the landing headline or trust breaks instantly.
- **Friction governs the CTA.** "Point the Sword": one unmistakable action, microcopy that removes
  the last doubt ("Fixed scope. Fixed price. 7 days." under the button), no competing asks.
- **Motion = conviction** (Brutalist Snap): instant, decisive, no bounce — the motion language
  *says* "we execute." Cheap/bouncy motion would undercut a premium claim.
- **The dark-UX line (FTC):** emphasis/contrast on the CTA = fine; **hiding the exit, fake timers,
  confirmshaming, drip pricing = illegal & trust-fatal on a high ticket.** Persuade the *entrance*,
  never trap the *exit*.

---

## GAELWORX — concrete before→after (apply the levers)
- **Enemy, sharpened (loss + villain):** *"Six apps. One mess." →* keep, then add the cost:
  *"Six apps, none of them talking — and the job falls through the crack between them."*
- **Cost of inaction (present-tense pain):** *"A site that books nothing." →* *"Right now, a
  visitor is leaving your site to call someone who picks up."*
- **Mechanism over claim (sophistication St.3):** *"We build AI systems" →* *"Not another AI
  bolt-on. Automatic Execution: the rote work runs on rails you own — documented, not a black box."*
- **Status/identity future-pace:** CTA support line → *"Monday morning: every call answered, the
  truck booked, you on the job — not in the office chasing it."*
- **Authority + risk-reversal (the high-ticket gate):** under price → *"Fixed scope. Fixed price.
  Shipped in 7 days. We carry the risk — you pay when it executes."* (already strong — repeat it at
  every price + the final CTA).
- **The #1 missing lever — PROOF.** `/work` with **named, same-trade, specific** results
  ("YardWorx: 31% more jobs booked in 60 days, calls answered 24/7") is the single highest-ROI copy
  build left. Social proof + specificity + authority, all at once. **Build it next.**
- **Refuse (would torch a $35k sale):** fake countdown timers, "only 2 slots left" if untrue,
  hidden setup fees, confirmshaming opt-outs. Every lever stays **TRUE** — brutalist honesty is the
  brand *and* the most durable persuasion.

## Net
The strategy is one sentence: **win on MECHANISM + IDENTITY (not louder claims), aim the
Outlaw-Hero-Ruler-Clan voice at a shared enemy, frame the cost of inaction louder than the upside,
de-risk relentlessly for the high ticket, and keep every lever TRUE.** The biggest unbuilt lever is
real proof (`/work`).


---

# Part II · Pricing & the Sales Journey

<!-- ============================================================ -->
## Source: `docs/research/2026-pricing-journey-and-design.md`

# GAELWORX — Research Brief: The Pricing Journey + 2026 Design Direction

> Compiled 2026‑06‑29. Source material for the "awe + insane trust" rebuild and the
> pricing/transparency decision. This brief is the prerequisite the new chat builds on:
> (1) the **science of the buying journey** — how long it takes and what makes someone
> buy at the prices we need; (2) the **2026 design/texture/typography** landscape and how
> GAELWORX should ride it.

---

## PART 1 — THE PRICING JOURNEY (the science)

### 1A. How long it scientifically takes

High-consideration B2B / custom-software purchases are **long, mostly self-directed, and
multi-touch**. The numbers converge across sources:

- **~6+ months** end-to-end for a complex B2B purchase, across **~60 touchpoints on average,
  up to ~100** for high-value deals in complex categories. [Pathmonk, Geisheker]
- Buyers consume **~13 pieces of content before they ever contact you.** [Geisheker]
- **80% of the journey happens with no salesperson involved.** Buyers spend only **17% of
  their total time meeting suppliers**, and when comparing vendors, just **5–6% with any one
  rep**. **27%** of time is **independent online research.** [Gartner]
- **75%** of B2B buyers **prefer a rep-free experience**; **77%** call their last purchase
  "very complex or difficult." [Gartner]
- Custom-software specifics: proposal + demo stages run **3–6 weeks**; negotiation **2–8 weeks**
  for mid-market, **several months** for enterprise. **New** prospects (vs. existing clients)
  need extra time to "build confidence, verify your claims, and establish the relationship."
  [Aexus / Focus Digital]

**Implication:** the website is not a brochure — it *is* most of the sales process. It has to
do the trust-building work across dozens of self-serve touchpoints, long before a human talks.

### 1B. What makes someone buy at premium prices

Price is **psychological, not rational** — the strongest, most consistent finding.

- *"People don't pay premium rates because you actually are worth it. They pay because they
  believe you're worth it."* Clients buy **identity, status, peace of mind** — not features.
  [Yarmosh — a founder who scaled a $5M software agency]
- **Price is a quality signal.** When buyers can't evaluate quality before purchase (true for
  custom software), **price becomes the proxy for competence.** Underpricing reads as
  inexperienced/desperate. [ServiceLabs, Yarmosh]
- **Premium uses clean, rounded numbers** ($15,000, not $14,997). Charm pricing *undermines*
  premium perception — it signals "deal," and premium buyers aren't shopping deals. [Quikly,
  Yarmosh]
- **Information quality drives the sale.** Buyers who got *relevant, valuable* info through the
  journey were **2.8× more likely** to buy with ease and **3× more likely** to place a larger
  order with less regret. [Gartner]
- **Proof must be specific to the buyer's situation** — case studies from similar size/use-case,
  testimonials from identical jobs. Specificity = risk reduction = trust. [Right Tail]
- Credible custom-software vendors **"earn trust in weeks, not slide decks"** via structured
  **discovery workshops**, and visibly **de-risk scope** (how they communicate when things go
  wrong, how they document decisions). [Right Tail / Studio Graphene]

**The premium pricing toolkit** (Yarmosh, field-tested on six/seven-figure deals):

| Tactic | What it does | Premium-safe? |
|---|---|---|
| **Anchoring** | Show the high option first; "in-house hire = $150k/yr, we do it in 90 days for $30k." The first number reframes everything after. | **Essential** |
| **Tiered + decoy** | 3 tiers (Intro / Core / Premium). Premium makes Core "the smart middle." Brain avoids extremes. | **Yes** |
| **Bundling** | "Strategy + Build + Support: $X" — integrated, harder to negotiate, higher perceived value. | **Yes** |
| **Partitioning** | Break the total down ("Strategy $4k + Build $8k + Support $3k") to justify it + reduce price shock. | **Neutral** |
| **Installments** | "$1,000/mo" feels lighter than "$12,000." Lifts conversion **30–40%** by removing friction, not discounting. | **Yes** |
| **Context comparison** | Never let them compare you to commodity alts; compare to in-house hire / cost of inaction. | **Essential** |
| **Sequencing** | Present scope + transformation **first**, the number **last** — by then they've imagined the outcome; price becomes a bridge, not a barrier. | **Yes** |
| Charm pricing ($X,997) | Lifts entry/digital conversions 3–8% | **No — kills premium** |

### 1C. Transparency: publish prices, or "contact us"? (your specific question)

The data favors **transparency**, with one important nuance:

- Transparent pricing → **23–40% higher conversion** and **shorter sales cycles** vs. price-
  discovery calls. [Tom Wardman / SitePoint]
- A simple **pricing calculator** lifted agency lead conversion from **<2% to >11%.** WebFX
  published service packages + ranges and grew **qualified leads +67% in 6 months.** [SitePoint]
- **The nuance:** opaque "contact us" pages get **more raw form submissions**, but transparent
  pages generate **more *qualified* pipeline.** Transparency **pre-qualifies** — the people who
  reach out have already accepted the price range, so you "start the conversation with trust,
  not negotiation." [HockeyStack, Monetizely]

**Recommended stance for GAELWORX** (main goal = software + custom builds, where every job is
scoped differently): **anchored transparency, not a fixed price list.**

1. **Publish anchors, not quotes.** "Builds start at $X." "Most engagements land between $A–$B."
   This anchors high, pre-qualifies, and filters tire-kickers — without committing to a number
   on work you haven't scoped.
2. **Productize an entry rung.** One or two fixed-scope, fixed-price offers (e.g. a paid
   "Forge Audit"/discovery sprint, or a voice-agent pilot) so a buyer can transact *now* and
   experience the trust before the big custom build. This is the tiered/decoy ladder.
3. **Estimator → custom quote.** A configurator ("what do you need: software / voice / automation
   / web → rough range") that ends in a scoped conversation. Gets the calculator's 2%→11% lift
   while keeping true custom scope human.
4. **Sequence the page:** outcome + proof + process/de-risk **before** the number, per Yarmosh.

> Net: be **transparent about ranges, process, and what drives cost** (radical honesty =
> trust), while keeping the **final number a conversation**. Transparency builds the trust;
> the gate stays only on bespoke scope.

---

## PART 2 — 2026 DESIGN DIRECTION (awe + trust)

### 2A. The macro shift — "Imperfect by Design" / Tactile Realism

The defining 2026 movement is a **backlash against the polished AI aesthetic.** As AI visuals
flood every feed, designers are pivoting to **grit, grain, and physical imperfection** to signal
**human craft.** [Creative Bloq, ArtCoast]

> **This validates Neo-Gaelic Brutalism wholesale.** GAELWORX already sits on the *right* side of
> 2026: raw, forged, hand-made, textured, asymmetric. The move is to **lean in**, not chase soft
> trends.

### 2B. Neumorphism / skeuomorphism / textures — what's actually winning

- **Neumorphism is "a tactic, not a trend."** Use it as a **strategic accent on micro-
  interactions** — never as the whole UI (soft extruded shadows fail accessibility and read
  generic). [DesignRush, BigHuman]
- **Claymorphism** — the refined evolution: tactile, unified "single sheet of material," reads
  great on high-refresh OLED. [Zignuts]
- **Glassmorphism, evolved:** translucency + **noise texture** + gradient borders + soft shadows
  for *real depth without visual noise*. [SetProduct]
- **Mixed media + tactile maximalism:** 3D blended with **scanned paper / raw textures**;
  surfaces that look like you could **reach through the screen and touch them** — fabric, metal,
  polymer, weight, depth. [Ellis Velandia, ArtCoast]

> **For GAELWORX:** keep the **0px brutalist corners and hard borders** (skeuo/neumorph softness
> conflicts with the brand). Borrow the *material* idea only: **forged-iron grain, brushed-steel
> micro-scratches, molten edges, the obsidian's real refraction** = our tactile realism. Depth
> comes from the **3-level interface model** already in CLAUDE.md (L1 frame / L2 forge-light /
> L3 8px hard shadow), not from soft neumorphic bevels.

### 2C. Typography — 2026 is built for this brand

- **Serifs are back "out of necessity."** The hyper-uniform AI aesthetic causes visual fatigue;
  designers want type that feels **grounded, textured, imperfect.** [DesignMonks, IKA]
  → **Direct validation of Cinzel Decorative** as the display face.
- **Maximalist display serifs** — exaggerated strokes, dramatic contrast, ornate detail — own the
  hero. [Fontfabric] → exactly the **A+E ignite** play ("play with the letters").
- **Kinetic / motion typography** — text that transforms on scroll/beat, now precise via CSS +
  WebGL (Spotify Wrapped is the poster child). [Creative Bloq] → validates the **scroll-jacked
  kinetic finale** and the mandala.
- **Variable fonts** for one-file weight range; **"imperfect by design"** as the through-line.

---

## PART 3 — IMPLICATIONS FOR THE REBUILD

1. **Trust ladder = the buying journey.** Map sections to Gartner's four buying jobs — problem
   identification → solution exploration → requirements building → supplier selection — and put
   the decisive content at each: buyer-specific proof, ROI/context framing, visible de-risking,
   anchored pricing. The site must carry **dozens of self-serve touchpoints** of value because
   **80% of the decision happens before contact.**
2. **Lean into 2026, don't chase it.** Tactile realism + serif revival + kinetic type = our lane.
   Add *material texture and dimensional depth*; reject soft neumorphism. Keep brutalist sharpness.
3. **Pricing = anchored transparency** + a productized entry rung + estimator→quote, sequenced
   outcome-first.
4. **Make it real:** lead capture at multiple touchpoints feeding a CRM/store, nurtured over a
   ~6-month window (not a single "contact us").

### Decisions

- **A. Transparency stance — LOCKED: anchored ranges + tiers.** (Decided 2026‑06‑29.) Publish
  "starts at / typical range" anchors + a productized entry rung + an estimator → custom quote;
  keep the final bespoke number a conversation. Sequence the page outcome/proof/process **before**
  the number.
- **B. Service pricing — LOCKED (2026‑06‑29).** Full anchor card in Part 4. The **Voice Agent**
  (from $499/mo + ~$2.5k setup) is the productized entry rung; **Web from $1,299**; **Automations
  $1,500–$5,000**; **Software $10,000–$35,000 with a $5,000 minimum deposit** to start.
- **C. Lead-tracking stack** *(open)* — where do leads land and how are they nurtured over the
  ~6-month window? Connectors available: **Supabase, Attio, Gmail/AgentMail, n8n, Lovable.**
- **D. Price placement on the home journey — LOCKED (2026‑06‑30): tease early, full reveal late.**
  The home scroll-jack hit the price twice (full anchored ledger on the services carousel mid-journey
  AND the late rates beat), which spends the number before value/proof is built. Resolution, grounded
  in the placement evidence:
  - Price is a **high-stakes, late-funnel** lever — "changes that move 2–3% on a landing page move
    8–15% on a pricing page" ([mida.so](https://www.mida.so/blog/ab-testing-pricing-pages)); spend it
    where intent peaks, not during exploration.
  - **Transparency still required** — showing cost (vs hiding it) cuts abandonment ~19%
    ([involve.me](https://www.involve.me/blog/ab-testing-landing-pages)); so the price stays ON the
    site, just not front-loaded.
  - Yarmosh **Sequencing** (Part 1B) + Gartner solution-exploration → the **carousel's job is
    exploration, not pricing**.
  Net: **carousel = TEASE** (the "from $X" entry anchor only — pre-qualifies + signals
  accessibility); the **full anchored reveal** (the elsewhere-comparison + deposit) is **held for the
  late rates ledger** (penultimate beat), so the number lands last, after proof. Full removal
  over-corrects (loses pre-qualification); full price early fights sequencing — the tease threads both.

---

## PART 4 — COMPETITOR PRICING LANDSCAPE (what the market charges)

Published 2026 pricing, mapped to our four service lines. Two layers matter: **DIY
platforms/tools** (what a client would pay to do it themselves) and **done-for-you /
agency** (our actual lane — what studios charge to build + run it). We anchor against the
done-for-you layer and use the DIY layer as the "build it yourself" comparison (per Yarmosh:
control the comparison).

### GW‑02 — Voice agents (Maeve) — *most directly comparable, best entry rung*

| Tier | Examples | Published price |
|---|---|---|
| DIY platforms (BYOK / usage) | Vapi, Bland, Retell | **$0.05–$0.11/min base**, ~**$0.12–$0.25/min** all-in after the hidden TTS+LLM+STT+telephony stack |
| DIY platforms (subscription) | Synthflow, Goodcall, My AI Front Desk, Autocalls, CallFluent | **$29–$1,400/mo** (e.g. Synthflow $450/$900/$1,400; Goodcall $59–79; MyAIFrontDesk $65–99; CallFluent $97–297) |
| **Done-for-you / managed** (our model) | **Smith.ai** | **$292.50–$500/mo** managed AI receptionist, **+$2,000** custom-AI build add-on, **$3/call** live-agent handoff, **48‑hr setup**, month-to-month |
| **Agency benchmark — what to CHARGE clients** | (industry guidance) | **$199–$599/mo per client**, ~**85–90% gross margin** at ~$0.09–0.15/min real cost |
| The anchor (cost of NOT using us) | in-house receptionist | **$4,000/mo · $48,000/yr** (Smith.ai's own anchor) |

> **LOCKED:** the **Voice Agent** is the **productized entry rung** — **from $499/mo per location,
> all-in managed**, plus a one-time **~$2.5k setup/forge fee** for the custom build (range
> $499–$1,500/mo). Against a $48k/yr receptionist it's trivial; against $0.05/min DIY it's "we run
> the whole stack so you don't." (Maeve is the product; "Voice Agent" is the pricing line label.)

### GW‑01 — Custom software / proprietary platforms — *the flagship*

- **US senior dev rate:** **$125–$250+/hr.**
- **MVP / small build:** **$20,000–$75,000.**
- **Medium (custom CRM, portals, business tools, integrations):** **$75,000–$200,000.**
- **Large/enterprise platform (ERP, AI platform):** **$250,000+** (8–10 devs at $30k–$50k/mo, 12+ mo).
- **Maintenance:** budget **15–25%/yr** of build cost.

> **LOCKED:** **$10,000–$35,000**, **$5,000 minimum deposit** to start. Deliberately below the
> market's $75k–$200k platform band — positioned as accessible custom builds, with the $5k deposit
> filtering for committed buyers. The market data above is the "build-it-elsewhere" comparison to
> anchor against.

### GW‑03 — Workflows / automations

- **Project build:** single workflow **$5,000–$15,000** (simple SaaS-to-SaaS $5k–8k; legacy/
  custom-API $15k–25k). Lead-qual $2k–6k; support-ticket $3.5k–10k.
- **Monthly retainer:** small **$1,000–$3,500**, mid-market **$4,000–$10,000**, enterprise
  **$8,000–$25,000** (median **$2,800–$7,000/mo**).
- **Consultant hourly:** US $80–$150/hr; boutique agency $125–$250/hr.

> **LOCKED:** **$1,500–$5,000** (project or retainer). Sits at the accessible end of the market's
> $5k–$15k build / $1k–$3.5k retainer bands — an easy second transaction after Voice/Web.

### GW‑04 — Cinematic web

- **Custom site (SMB):** **$5,000–$15,000.**
- **Complex / advanced UX + animation + interactive (our lane):** **$15,000–$50,000+.**
- **Premium / large agency:** **$50,000–$300,000+.** Hourly: small $100–200/hr, large premium
  **$200–400/hr.**

> **LOCKED:** **$1,299–$8,999.** Positioned as the accessible front door (well below the market's
> $15k–$50k+ premium-cinematic band) to win volume + first transactions — while the GAELWORX site
> itself proves we deliver far above the price. Charm endpoints ($1,299/$8,999) suit this
> high-volume front-door role.

### GAELWORX anchor card — LOCKED (decided 2026‑06‑29)

| Line | Entry anchor | Range | Model |
|---|---|---|---|
| **Voice Agent** | from **$499/mo** + ~$2.5k setup | $499–$1,500/mo per location | productized — the entry rung |
| **Automations** | from **$1,500** | **$1,500–$5,000** | project / retainer |
| **Web Design** | from **$1,299** | **$1,299–$8,999** | scoped |
| **Software** | from **$10,000** · **$5,000 min deposit** to start | **$10,000–$35,000** | scoped, deposit-gated |

Positioning note: the ladder is deliberately tiered by commitment — **Web ($1,299) and the
Voice Agent ($499/mo) are the accessible front doors** that win the first transaction and build
trust; **Software ($10k–$35k, $5k deposit) is the flagship.** Web uses charm-style endpoints
($1,299 / $8,999) to read accessible/high-volume, while Software/Voice stay clean and premium —
a coherent split, not a contradiction. Present every number outcome-first with the DIY / "do
nothing" comparison beside it (Part 1).

---

## Sources

**Pricing journey / psychology**
- Gartner — [The B2B Buying Journey](https://www.gartner.com/en/sales/insights/b2b-buying-journey)
- Geisheker — [The 13-Touchpoint Rule (2026)](https://www.geisheker.com/b2b-buyer-journey-13-touchpoint-rule/)
- Pathmonk — [B2B Customer Journey Touchpoints](https://pathmonk.com/b2b-customer-journey-touchpoints/)
- Aexus — [Average B2B software sales cycle](https://aexus.com/how-long-is-the-average-b2b-software-sales-cycle/)
- Focus Digital — [Average Sales Cycle Length by Industry (2025)](https://focus-digital.co/average-sales-cycle-length-by-industry/)
- Right Tail — [How to Choose a Custom Software Development Company (2025)](https://www.righttail.co/blog/how-to-choose-custom-software-development-company-2025-evaluation-guide)
- Ken Yarmosh — [The Psychology Behind Why Clients Pay Premium Prices](https://kenyarmosh.com/blog/pricing-psychology/)
- ServiceLabs — [The Psychology of Premium Service Pricing](https://servicelabsgroup.com/marketing/psychology-of-premium-service-pricing/)
- Quikly — [10 Psychological Pricing Strategies (2025)](https://hq.quikly.com/blog/psychological-pricing-strategies)

**Transparency**
- Tom Wardman — [Why You Should Publish Your Pricing Online](https://tomwardman.com/blog/publish-pricing-transparency-online)
- SitePoint — [Why Transparent Pricing Calculators Are the Future of Web Agencies](https://www.sitepoint.com/stop-guessing-why-transparent-pricing-calculators-are-the-future-of-web-agencies/)
- HockeyStack — [The State of Pricing, Demo, and Case Study Pages](https://www.hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages)
- Monetizely — [Pricing Transparency vs. Opacity](https://www.getmonetizely.com/articles/pricing-transparency-vs-opacity-strategic-approaches-for-saas-executives)

**2026 design / texture / typography**
- Figma — [Top Web Design Trends for 2026](https://www.figma.com/resource-library/web-design-trends/)
- DesignRush — [Is Neumorphism Still Relevant in 2026?](https://www.designrush.com/best-designs/websites/trends/neumorphism-website)
- Zignuts — [Neumorphism vs Glassmorphism: 2026](https://www.zignuts.com/blog/neumorphism-vs-glassmorphism)
- SetProduct — [Glassmorphism vs neumorphism vs liquid glass (2026)](https://www.setproduct.com/blog/liquid-glass-vs-glassmorphism)
- ArtCoast — [Premium Graphic Design Textures: 2026](https://artcoastdesign.com/blog/best-graphic-design-textures-2026)
- Ellis Velandia — [Tactile Maximalism 2026](https://ellisvelandia.com/blog/tactile-maximalism-trends-2026)
- Creative Bloq — [Top typography trends for 2026](https://www.creativebloq.com/design/fonts-typography/breaking-rules-and-bringing-joy-top-typography-trends-for-2026)
- DesignMonks — [Typography Trends 2026](https://www.designmonks.co/blog/typography-trends-2026)
- Fontfabric — [Top 10 Design & Typography Trends for 2026](https://www.fontfabric.com/blog/10-design-trends-shaping-the-visual-typographic-landscape-in-2026/)

**Competitor pricing**
- Autocalls — [AI Voice Agent Pricing in 2026: What 10 Platforms Really Cost](https://autocalls.ai/article/ai-voice-agent-pricing)
- Smith.ai — [AI Receptionist Plans & Pricing](https://smith.ai/pricing/ai-receptionist)
- Retell AI — [AI Voice Agent Pricing: Full Cost Breakdown](https://www.retellai.com/blog/ai-voice-agent-pricing-full-cost-breakdown-platform-comparison-roi-analysis)
- Keyhole Software — [Custom Software Development Cost: 2026 Benchmarks](https://keyholesoftware.com/cost-custom-software-development/)
- Andersen — [Custom Software Development Costs in 2026](https://andersenlab.com/blueprint/custom-software-development-costs-in-2026)
- WebFX — [Web Design Pricing 2026](https://www.webfx.com/web-design/pricing/)
- Digital Agency Network — [AI Agency Pricing Guide 2026](https://digitalagencynetwork.com/ai-agency-pricing/)
- TaskIP — [AI Automation Agency Pricing: 6 Models for 2026](https://taskip.net/ai-automation-agency-pricing/)
- Ciela AI — [AI Agency Pricing Guide: Retainers, Projects, Productized](https://ciela.ai/blogs/ai-agency-pricing-guide-retainers-projects)


---

# Part III · Scene · 3D · Visual craft

<!-- ============================================================ -->
## Source: `docs/research/faceted-obsidian-jewel.md`

# Research: the faceted obsidian jewel (replacing the fluid vein slab)

> Goal: turn the hero from a full-frame slab with a fluid fire-opal vein shader ("a random
> spurt of background") into an **actual cut obsidian jewel** — a centered, faceted gem with
> sharp polished facets, glowing faceted edges, and the fire-opal play-of-color reading across
> the cut. Researched 2026-06-30.

## What actually makes a "cut gem" read (the findings)
- **Faceted geometry + flat shading is the core trick.** "The sharp facets of an Icosahedron
  show a nice cut-gem style of refraction"; `flatShading:true` gives each triangle its own face
  normal so every facet reads as a discrete plane catching light.
  [[three.js forum](https://discourse.threejs.org/t/gemstone-refraction-and-reflection/206)]
- **Obsidian is OPAQUE black glass — render it REFLECTIVE, not transmissive.** Cut diamonds use
  transmission + ior + `dispersion` (r164+) + BVH internal reflection, but that's for clear
  stones. Obsidian = near-black body + crisp environment reflections off the flat facets.
  `MeshPhysicalMaterial` reflective path: high `envMapIntensity`, low `roughness`, `clearcoat`,
  and built-in **`iridescence`** for the fire-opal play-of-color (no custom shader needed).
  [[MeshPhysicalMaterial docs](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)]
  - **Bonus / constraint fit:** transmission is exactly what rendered BLACK on the Chromebook
    (see `deploy-doctor`/WEBGL section). A reflective faceted gem is **lighter and safer** than
    the old slab shader AND the transmission path — wins on perf + compatibility.
- **The colour flash lives at facet EDGES.** "On actual crystals you see sharp flashes of colour
  at the edges of facets due to chromatic aberration." So the fire-opal belongs on/near the
  **cut edges** — implemented as `EdgesGeometry` → glowing `LineSegments` in the forge palette
  (the fire-opal in the cuts), plus a Fresnel grazing-angle iridescent flash on the faces.
- **Sparkle = the env reflected off many flat facets as the gem turns.** Our cool `Lightformer`
  rig reflects crisply off flat facets → moving glints when the jewel rotates / on pointer
  parallax. Slow auto-rotate + scroll-coupled spin makes it "turn to catch the light."

## The build (v1)
1. **Geometry — `src/scene/gem.js`** (`buildGem`): a procedural cut gem — a flat **table**, a
   ring of **crown** facets down to the **girdle** (widest ring), and **pavilion** facets to a
   **culet** point. Non-indexed (each tri = fresh verts) → `computeVertexNormals` gives true flat
   facets; winding auto-corrected outward (flip any tri whose normal·centroid < 0). `sides` knob
   controls facet count (octagonal step-cut ≈ 8, rounder brilliant ≈ 14–16).
2. **Material — flat-shaded reflective obsidian** (`MeshPhysicalMaterial`): near-black color,
   `flatShading:true`, low roughness + clearcoat (polished), high `envMapIntensity`,
   `iridescence` (fire-opal), a faint warm `emissive`. **`transmission:0`** (opaque + safe).
3. **Faceted edges** — `EdgesGeometry(gem, angle)` → `<lineSegments>` with an additive
   fire-opal line material; edge glow rides `--`/store heat (scroll energy + strikes) so the cut
   lines flare with the journey (keeps the living-veins coupling, now on the cuts).
4. **Motion** — the gem is **centered** and slowly **auto-rotates** + scroll-coupled spin +
   pointer parallax (it turns to catch the light). Camera reframed to hold the centered jewel.
5. **Perf/tiers** — low-poly (~tens of tris) + lines = cheap; no transmission. Renders on `low`
   (Chromebook/phone) and `high`; `static` still shows the poster. `dispose()` geo+mat on unmount.

## Verify
`qa-route`/finale-qa (SwiftShader compiles → 0 console errors) + DOM probe (canvas alive, gem
mesh present) + the **iPhone 15 read** (the facets/edges/sparkle only truly judge on the OLED).
Tune facet count, edge glow, iridescence, rotation speed from that read.

## Sources
- [three.js forum — Gemstone refraction & reflection](https://discourse.threejs.org/t/gemstone-refraction-and-reflection/206)
- [MeshPhysicalMaterial — three.js docs](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) (iridescence, clearcoat, transmission, dispersion)
- [Codrops — transparent glass & plastic in three.js](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/) (icosahedron facets, thickness/refraction)
- [Auriga IT — custom diamond shaders in three.js](https://aurigait.com/blog/how-to-create-custom-shaders-for-a-diamond-in-three-js/) (internal reflection / chromatic aberration — the clear-stone path we deliberately avoid)
- [Three.js Journey — Geometries](https://threejs-journey.com/lessons/geometries) (polyhedra / detail)

<!-- ============================================================ -->
## Source: `docs/research/mandala-construction-and-animation.md`

# GAELWORX — Research: making & animating the finale mandala (it reads as a mess)

> The finale "eye of the whirlpool" mandala (`src/ui/Mandala.jsx` + `.mandala-*` in
> `src/styles.js`) reads as muddy noise, not a mandala. This diagnoses why **in the
> actual code**, then gives the construction + animation craft to rebuild it right.

---

## Why the current one is a mess (grounded)

1. **The rings physically overlap — band height > radial gap.** Word-rings sit at radii
   478/430/376/316/258/202/150/104 (gaps ≈ 48–60px) but render at font sizes 34/52/**72**/52/64/44/34/26
   (`Mandala.jsx:50-57`). A 72px glyph band extends ±36px from its baseline; a 52px band ±26px. So the
   r376(fs72) and r430(fs52) bands span ±62px across a 54px gap → **they collide.** Several rings overlap.
   That alone turns concentric order into mush.
2. **12 layers each counter-rotate at different speeds** (`.mw--a…h` + `.mk--k1…4`, 48–150s,
   `styles.js:442-447`). A mandala's entire power is **radial symmetry = order**; spinning every band
   independently *destroys* the symmetry read frame-to-frame. It looks like rotating static, not a wheel.
   (And the finale scroll-jack ALSO spins the whole layer, `spin = fp*680` in `Content.jsx`, stacked on top.)
3. **Curved running text is illegible as structure.** `PHRASES[p].repeat(20)` on a circular `textPath`
   with negative tracking (`Mandala.jsx:123-126`) packs glyphs into a band, but on a full circle the
   bottom half is **upside-down**, and at tight tracking it's texture, not words. Eight such bands ≈ visual hash.
4. **The "knots" aren't knots.** `strand()` (`Mandala.jsx:31-42`) draws two offset sine waves — concentric
   wavy lines, **no over/under interlace**, so it reads as wobble, not Celtic plaitwork.
5. **One hard drop-shadow over the whole group.** `filter:url(#mInk)` wraps the entire 8-ring `<g>`
   (`Mandala.jsx:120`) — a single offset shadow under overlapping rotating text = a muddy smear.
6. **Over-packed, no breathing room.** 8 word-rings + 4 knot bands + 72 ticks + boss in one disc. Mandalas
   need **clear separation between bands**; this has none.

---

## The craft (how mandalas are actually built)

**1 — Build on a grid of concentric circles × radial divisions.** Pick an **N-fold** symmetry (divide the
circle every 360/N°: 30°→12, 45°→8). Draw evenly spaced concentric rings. The **intersections are the
skeleton** — every motif sits on a grid point, repeated around all N axes. Even spacing + a fixed grid is
what makes it read as *order*. ([mandala grid construction](https://zensangam.com/en-usa/blogs/zen-blogs/methods-for-mandala-grid-construction), [sacred geometry guide](https://mysticryst.com/blogs/the-mystic-journal/how-to-create-mandala-sacred-geometry-drawing-guide), [Kennedy Center — polygons & symmetry](https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/lessons/6-8/mandalas-polygons-and-symmetry/))

**2 — Radial symmetry is the whole point.** The design must look identical when rotated by 360/N. Work
**center → outward**, one band at a time, with hierarchy (anchored core, mid bands, outer rim) and
**breathing space between bands**. ([math of mandalas](https://www.madhubani-art.in/how-mandala-art-is-related-to-maths/), [advanced composition/layering](https://oboe.com/learn/advanced-mandala-composition-and-geometry-10pbl9x/intricate-pattern-layering-156h9ni))

**3 — In SVG: define ONE motif, `<use>` it rotated N times.** Don't hand-place or rely on running text.
Define a single wedge/petal/glyph in `<defs>`, then `<use href="#motif" transform="rotate(a)">` for
`a = k·360/N`. You get **true rotational symmetry, perfect alignment, and tiny code**, and you can rotate
the parent group to animate the whole thing coherently. Group transforms rotate a whole `<g>` about its
origin. ([SVG transform/rotate — MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform), [Sara Soueidan — SVG transforms](https://www.sarasoueidan.com/blog/svg-transformations/), [CSS-Tricks — transforms on SVG](https://css-tricks.com/transforms-on-svg-elements/))

**4 — Real Celtic interlace is grid-based strict over/under.** On a square/diagonal grid, mark crossings
and **alternate over/under every crossing** ("what crosses over must go under the next"). Two sine waves
can't do this — you need crossing order (a thick "ink" strand drawn over, broken where it goes under, with
the ember strand beneath). Or repeat ONE proper knot tile `<use>`-style around the ring. ([Digital Magpie — constructing interlace](https://digitalmagpie.wordpress.com/2014/07/09/how-to-constructing-celtic-interlace-knotwork/), [calligraphy-skills — knotwork](https://www.calligraphy-skills.com/how-to-draw-celtic-knotwork.html), [isotropic.org — celtic knot explained](https://isotropic.org/celticknot/explanation/))

---

## Redesign direction for GAELWORX (brand-aligned)

- **Pick N = 8 or 12** (ties to the 4 branches × 2/3). Rebuild every band as a motif `<use>`-repeated on
  that grid, not as repeated running text.
- **Cap band height ≤ 70% of the radial gap.** Even spacing; **fewer bands** (≈4–5) with real gaps so the
  obsidian veins breathe through (on-brand "fire bleeds through the ink").
- **At most ONE curved word-ring**, upright-corrected (split top/bottom arcs so text never inverts), as the
  outer "incantation" band — the rest geometric. Curved running text is decoration, not the structure.
- **Real interlace** for the knot band: ink strand drawn *over* with masked breaks where it dives *under*
  the ember strand — or a single clean knot tile repeated N times.
- **Hierarchy preserved:** forge-glow core (boss) → 2–3 mid bands → outer rim ticks. Per-band shadows
  (or none), not one smear over everything. Keep ink + ember rim + the fire-opal bleed.

---

## Animation — coherence over chaos

- **The fix is fewer moving parts.** Replace 12 independent spins with **one coherent rotation of the whole
  mandala**, plus **at most two counter-rotating groups** (inner vs outer) for subtle depth/parallax. N-fold
  symmetry means any rotation looks "right," so it can be slow and still feel alive. Don't fidget-spin each ring.
- **Slow.** It's a contemplative anchor: ~1 rotation / **90–180s**. The finale scroll-jack already drives a
  scroll-coupled rotation (`spin` in `Content.jsx`) — make THAT the primary motion and drop the competing
  per-ring CSS spins (or keep one gentle counter-rotation under it).
- **Breathing, not spinning, for life:** a subtle scale pulse (±2–3%) and/or an opacity shimmer on the ember
  layer reads as "alive" without breaking symmetry.
- **Compositor-only** (`transform`/`opacity` — `will-change:transform` is already set, `styles.js:441`).
  Keep the `prefers-reduced-motion → animation:none` rule (already `styles.js:507`) so it sits static & legible.
- **Mobile:** `.fin-mandala{min(112vw,92vh)}` is huge on a phone — with fewer/cleaner bands that's fine, but
  verify the outer band isn't clipped and detail still reads on the iPhone 15.

## Verify
Rebuild → `npm run build` → `qa-route` (0 console errors @ 393×852 + 1440×900) → scrub the finale and
**read it on the iPhone 15**: it should resolve as a clearly-banded, symmetric wheel that turns as one,
not rotating hash. Tune band count / N / speed from that read.

## Sources
- [Zen Sangam — mandala grid construction](https://zensangam.com/en-usa/blogs/zen-blogs/methods-for-mandala-grid-construction) · [Mystic — sacred geometry guide](https://mysticryst.com/blogs/the-mystic-journal/how-to-create-mandala-sacred-geometry-drawing-guide) · [Kennedy Center — mandalas, polygons & symmetry](https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/lessons/6-8/mandalas-polygons-and-symmetry/) · [Madhubani — mandala & maths](https://www.madhubani-art.in/how-mandala-art-is-related-to-maths/) · [Oboe — advanced composition & layering](https://oboe.com/learn/advanced-mandala-composition-and-geometry-10pbl9x/intricate-pattern-layering-156h9ni)
- SVG: [MDN transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) · [Sara Soueidan — SVG transformations](https://www.sarasoueidan.com/blog/svg-transformations/) · [CSS-Tricks — transforms on SVG elements](https://css-tricks.com/transforms-on-svg-elements/)
- Knotwork: [Digital Magpie — constructing interlace](https://digitalmagpie.wordpress.com/2014/07/09/how-to-constructing-celtic-interlace-knotwork/) · [calligraphy-skills — how to draw knotwork](https://www.calligraphy-skills.com/how-to-draw-celtic-knotwork.html) · [isotropic.org — celtic knot explanation](https://isotropic.org/celticknot/explanation/)

<!-- ============================================================ -->
## Source: `docs/research/typography-3d-fontplay.md`

# GAELWORX — Research: Typography Effects, 3D Text & Font Play (2026)

> For the type-elevation pass. The site already has the bones (Cinzel Decorative
> display, the A+E forge-ignite, ForgeText per-letter kinetic reveal, the obsidian
> forge-light that follows the cursor). This is how to push type from "nice" to
> "award-gallery," on-brand, without breaking performance.

## 1. The 2026 landscape (what's actually winning)
- **Kinetic typography is back — but disciplined.** "Purposeful motion" that guides
  attention, not chaos. Headlines that take **half the screen**, letters that animate
  on scroll, type used like **movie-title screens**. (Awwwards galleries, Creative Bloq.)
- **Type AS interface.** The strongest 2026 work (Codrops/Exat) treats typography as
  the *primary interactive element*, not decoration over content.
- **Variable fonts** drive the motion: one file morphs **weight/width/slant**
  continuously — "letters begin to breathe." Saves up to ~400KB / 12 files too.
- **Restraint + performance as design.** Expressive moments are *punctuation*, used
  sparingly; motion pauses off-screen; touch devices get simplified fallbacks.

## 2. Concrete techniques (with the how)
1. **Proximity weight/colour field** (Exat's hero). A grid of glyphs; on `mousemove`
   compute Euclidean distance from cursor to each letter's center, map distance →
   concentric "rings" → variable-weight + colour via CSS custom props in a rAF loop.
   Touch = static fallback. *(Real code in the Codrops case study.)*
2. **Variable-weight morph on hover/scroll** — interpolate `font-variation-settings`
   `wght`/`wdth` smoothly between extremes (no hard jumps). One axis at a time = clarity.
3. **3D text in WebGL** — two routes:
   - **troika-three-text**: SDF glyphs, crisp at any scale, parses `.woff/.ttf`
     directly, runs font work in a web worker (no frame drops), and **patches any
     three.js material** → gets PBR lighting, shadows, fog. Best for live 3D text.
   - **TextGeometry** (three.js): extrudes 2D outlines to real geometry — heavier,
     but true extruded/forged-metal letters.
4. **CSS 3D reveals** — big lines do a full **X-axis rotation** as they enter the
   viewport, then settle. Cheap (`transform: rotateX`), high drama, used sparingly.
5. **SplitText per-letter/word reveals** tied to scroll (GSAP ScrollTrigger) — the
   blur-to-sharp, stagger-in pattern (we already do a version in `ForgeText`).
6. **Scroll-driven, JS-free** — the **CSS Scroll-Driven Animations API**
   (`animation-timeline: scroll()/view()`) ties type reveals/morphs to scroll with
   zero JS. Pair with **Lenis** for buttery momentum scrolling.
7. **Ambient scroll-reactive numerals** — giant ghosted numbers drift on a slow
   **sine wave whose speed tracks scroll velocity**; settles when scrolling stops.
   (We already have the spinning trust numerals — this adds life cheaply.)
8. **Pinned scroll panels** — stacked panels replace each other vertically in a pinned
   section; each panel's internal type animates **only when visible**. Scroll = state
   (fully reversible), not a one-shot trigger.

## 3. The stack the best 2026 type sites use
GSAP + **ScrollTrigger** + **SplitText** (animation), **Lenis** (smooth scroll),
variable fonts (real-time morph), troika-three-text (WebGL text), the native
**CSS Scroll-Driven Animations API** (JS-free reveals). Performance is a design
constraint: pause loops off-screen, simplify on mobile.

## 4. Mapped to GAELWORX (on-brand, ranked by impact ÷ effort)
> Constraint: **Cinzel Decorative is static (700/900)** — it can't weight-morph. But
> **Bricolage Grotesque is already loaded as a VARIABLE font** — use it for the
> weight-breathing play. Cinzel gets *transform/glow/3D* play, not weight morph.

**A. Forge-proximity ignite (high impact, low effort).** A wordmark/glyph field where
letters **ignite (forge-glow gradient + heavier weight) by distance to the cursor** —
the Exat technique, re-skinned as the forge lighting the letters. This *extends* the
brand's existing "forge-light follows the finger." Bricolage glyphs morph `wght`
200→900; Cinzel glyphs swap to the `.forge-letter` gradient by ring. Hero or a
section centerpiece. Touch → static ignited state.

**B. 3D forged wordmark (high impact, med effort).** Render **GAELWORX as real
extruded/SDF 3D** (troika-three-text or TextGeometry) inside the obsidian scene — a
**forged-metal wordmark** catching the fire-opal light, slow rotate + pointer parallax,
the A+E faces emissive (the ignite, in 3D). The literal "wordmark forged from the slab."
Lazy-load; desktop-only or reduced on mobile.

**C. X-axis rotation reveals on section heads (med/low).** Page `pg-h2`/`pg-title`
do a `rotateX(-90deg)→0` Forge-Reveal as they scroll in (blur-to-sharp we already use).
Pure CSS via the Scroll-Driven Animations API → no JS, no perf cost. Applies site-wide
through the shared `Section`/`PageShell` — instant consistency.

**D. Lenis smooth scroll (med, big feel upgrade).** Wrap the scroll in Lenis so the
home scroll-jack + the new pages glide. Directly addresses "pacing feels off." Honor
`prefers-reduced-motion` (disable).

**E. Scroll-velocity numerals (low).** Make the giant ghosted trust numerals + the
finale spin **react to scroll speed** (faster scroll → faster drift, settle on stop).

**F. Variable-weight breathing on Bricolage headlines (low).** Subtle `wght` breathing
or hover-morph on `pg-h2`s for "letters that breathe."

## 5. Guardrails (non-negotiable, per brand + perf)
- **Restraint**: expressive type is *punctuation* — 1–2 hero moments per page, not every
  element. Brutalist Snap = impact, not bounce.
- **`prefers-reduced-motion`**: every effect has a static fallback (already our pattern).
- **Mobile**: simplify, don't replicate (proximity → static ignite; 3D text → 2D).
- **Off-screen pause**; lazy-load WebGL text; keep within the LCP/JS budget.
- **Legibility first** (CLAUDE.md): the ignite/forge play never costs readability.

## Sources
- Codrops — [The Exat Microsite (variable-font showcase, with code)](https://tympanus.net/codrops/2026/04/10/the-exat-microsite-pushing-a-typography-showcase-to-new-creative-extremes/)
- Codrops — [3D Typing Effects with Three.js](https://tympanus.net/codrops/2022/11/08/3d-typing-effects-with-three-js/)
- Troika — [troika-three-text (SDF WebGL text)](https://protectwise.github.io/troika/troika-three-text/)
- Codrops — [Responsive & Accessible WebGL Text with Three.js + Troika](https://tympanus.net/Tutorials/AccessibleWebGLText/)
- CSS-Tricks — [Techniques for Rendering Text with WebGL](https://css-tricks.com/techniques-for-rendering-text-with-webgl/)
- Creative Bloq / Awwwards — [Typography in Web Design](https://www.awwwards.com/websites/typography/)
- Medium (Bootcamp) — [Typography Trends 2026–2027: When Letters Begin to Breathe](https://medium.com/design-bootcamp/typography-trends-2026-2027-when-letters-begin-to-breathe-8499fb6c5ef1)
- The Inkorporated — [Typography Trends 2026: Variable Fonts, Kinetic Text](https://www.theinkorporated.com/insights/future-of-typography/)
- veebilehed24 — [30 Modern CSS Text Effects (2026)](https://veebilehed24.ee/en/blog/modern-css-text-effects-2026/)

<!-- ============================================================ -->
## Source: `docs/research/color-palette-systems.md`

# Building color palettes — and harmonizing the GAELWORX UI with the obsidian background

Research + the concrete fix for: *"the orange color palette of the copy has to go and match
the background."* The site's CSS accent is a bright candy-orange (`--gw-ember #E85D04`, used
84×) while the live 3D background's fire is **blood-red dominant** (`#C1292E`/`#c8200a`) with
ember only at the hottest vein cores. The orange UI is the outlier. Below: how cohesive
palettes are actually built, then the exact token remap that pulls the copy onto the
background's fire.

---

## 1 · The principles (sourced)

### 60-30-10 — proportion is the palette
A cohesive scheme is **60% dominant / 30% secondary / 10% accent**. The dominant is usually a
near-neutral that sets the mood; the secondary adds the depth/contrast mass; the accent is the
one bold pop, used sparingly. The most common failure is over-using the accent so it stops
reading as an accent. *(NN/g; Wix; ElephantStock)*

GAELWORX is **already specified this way** in `src/scene/palette.js`: 60 obsidian void · 30 deep
crimson/forge-red · 10 ember/gold (HDR, so only the 10% blooms). The CSS UI broke the contract:
it promotes the 10% ember-**orange** to a de-facto 30%, painting kickers, prices, borders,
hovers, and glows in `#E85D04` everywhere. The fix is to put the proportions back: structure in
crimson (the 30), ember reserved for true sparks (the 10).

### Color harmony — pick a relationship, not random hues
- **Monochromatic** — one hue, varied lightness/saturation. Maximum cohesion, lowest contrast.
- **Analogous** — neighbors on the wheel (e.g. red → red-orange → orange). Warm, harmonious,
  low-tension. **This is the forge:** obsidian → crimson → ember are analogous warms.
- **Complementary** — opposites (red ↔ cyan). High tension; use one as 10% accent only.
- **Triadic** — three evenly spaced; vivid but harder to balance.
The obsidian fire opal is naturally **analogous-warm + a complementary opal flash** (the
play-of-color throws cyan/violet against the warm body — a tiny complementary spark). *(color-wheel theory; NN/g)*

### Dark-UI accent rules (why bright orange hurts here)
- **Desaturate/deepen accents on dark.** Saturated hues on near-black produce *optical
  vibration* and glare; drop ~20 saturation points vs light mode. A bright orange (`#E85D04`,
  green channel 0x5D=93) on `#0B0C10` is exactly the vibration case.
- **Reserve the brightest, most saturated value for the smallest area** (the 10% accent / the
  one CTA), never the running text accents.
- **Text/contrast:** body stays soft-white (`#F1F2F6`), never pure `#FFF`; keep ≥ 4.5:1 for
  normal text, ≥ 3:1 for large. Red accents on obsidian clear this for headings/large UI; never
  set long body text in the saturated accent. *(Material dark theme; Toptal; atmos.style)*

### Deriving a palette from a source (image/scene)
To make UI "match" a visual, **sample the source and build from it** rather than guessing:
1. Pull the dominant (the body), the shadow mass, and the brightest spark from the source.
2. Map them to 60/30/10 roles.
3. Tune for the surface (desaturate the accent for dark-UI), then check contrast.
The source here is `palette.js` (the canonical scene palette) — so the UI should be built from
those exact swatches, not a separate orange.

---

## 2 · The GAELWORX application — the remap

**Background swatches (the truth to match), from `palette.js`:**
`void #050507` · `crimsonDeep #3a0905` · `crimson #8c140a` · `red #c8200a` · `ember #ff5a1e`
(hot cores only) · `gold #ffb15a` · plus the opal play-of-color (cyan→violet) flashing in the veins.

**The move:** swap the UI's broad candy-orange for the background's **forge-red**, and demote
ember to a spark. One token carries 84 usages, so retuning it cascades the whole UI.

| CSS token | Was (orange) | Now (background-matched) | Role |
|---|---|---|---|
| `--gw-void` | `#0B0C10` | `#0B0C10` *(unchanged)* | 60 — obsidian base |
| `--gw-forge` | `#C1292E` | `#C1292E` *(unchanged)* | 30 — Celtic Blood, structure/borders |
| `--gw-ember` | **`#E85D04`** | **`#DA2C1C`** | 10 — the accent, now a warm **forge-red** (g 0x2C=44, not 0x5D) so it reads as the background's fire, not candy-orange |
| `--gw-ember-deep` | `#E34A27` | `#C1292E` | deep accent → crimson |
| scattered glow literals | `rgba(232,93,4,…)` `rgba(227,74,39,…)` | `rgba(218,44,28,…)` `rgba(193,41,46,…)` | the inner-glow / drop literals retuned to the same reds |
| `.forge-letter` A+E ignite | `…#E85D04, #C1292E, #E34A27, #C0392B` | `…#DA2C1C, #C1292E, #C1292E, #C0392B` | the ignite fire becomes blood-red, no orange top |

**Scope:** only the UI surfaces — `src/styles.js` + each `src/pages/*.jsx` `<style>` block. The
**scene is left untouched** (`palette.js` + the shaders ARE the background we're matching;
changing them would move the target). `#ff5a1e` in `palette.js` stays.

**Why `#DA2C1C` for the accent:** it sits on the analogous warm line between the background's
`red #c8200a` and Celtic Blood `#C1292E`, with the green channel pulled down out of "orange"
range — so it pops as the 10% on obsidian, harmonizes with the 30% `--gw-forge` crimson, and
reads as the same fire as the veins. Tunable in one place (`--gw-ember`) if you want it warmer
(toward `#D8331A`) or deeper (toward `#C1292E`).

**Optional secondary (not applied yet):** the background also throws an **opal** cyan/violet
play-of-color. A cool iridescent secondary (e.g. a `#7FD8E6`→`#B49BE0` accent on a hover/active
state) would echo that complementary flash and add the gem's "fire" to the UI without
reintroducing orange. Flagged for a follow-up if you want the iridescence in the copy too.

**Brand-doc note:** `CLAUDE.md` lists "Ember Glow `#E85D04`" as the fire accent. This change
reframes the *copy* accent to forge-red while keeping ember as the literal background fire. If
you want this locked as the new rule, `CLAUDE.md`'s palette section should be updated to match —
say the word and I'll align it.
</content>


---

# Part IV · Motion & Pacing

<!-- ============================================================ -->
## Source: `docs/research/pacing-fluidity-snap.md`

# GAELWORX — Research: Pacing, Fluidity & Snap in Motion (get it smooth)

> Addresses the recurring "pacing feels off" + the brand's **Brutalist Snap** motion
> law ("0ms delay, high-momentum easing, no bounce, only impact"). The goal: scroll
> that feels **buttery**, transitions that feel **decisive**, never janky.

## The three forces (and where each belongs)
- **Pacing** = how fast the journey moves per unit of scroll/time. Fix uneven pacing
  with even scroll weighting + momentum + no dead zones.
- **Fluidity** = smoothness *between* states — momentum scroll + frame-rate-independent
  interpolation. Belongs to **scroll + the 3D scene**.
- **Snap** = decisive arrival — short, ease-out, no-bounce transitions. Belongs to
  **elements + microinteractions** (the "impact" in Brutalist Snap), NOT to the scroll.

## 1. Fluidity — momentum scroll + dt-correct damping
- **Lenis** (~3kB, Darkroom Engineering) is the agency-standard smooth-scroll: consistent
  **60fps**, fine damping/easing/duration control, respects `prefers-reduced-motion`.
  **Scroll-jank is a top source of poor INP** (Google) — Lenis kills it. Pairs with GSAP
  ScrollTrigger (Lenis = momentum, GSAP = positional math).
- **Frame-rate-independent interpolation is mandatory.** A naive `lerp(a,b,0.1)` per frame
  is **frame-rate dependent** → jitter at variable FPS. Correct form is exponential decay
  with `dt`: `current = target + (current - target) * pow(smoothing, dt)` (or our
  `THREE.MathUtils.damp`). **We already damp the scene this way** — good; the gap is the
  *scroll* itself, which Lenis fixes.

## 2. Snap — NOT CSS scroll-snap (here's the gotcha)
> **Lenis and CSS `scroll-snap` are fundamentally incompatible** — Lenis hijacks scroll;
> `scroll-snap` expects native scroll. Mixing them breaks (mobile/touch first). **Pick one.**

For GAELWORX the home is a weighted **scroll-jack** (not native scroll-snap), and we want
Lenis fluidity — so **don't use CSS scroll-snap**. Achieve "Snap" the brand way instead:
**decisive element transitions** — `ease-out`, short, transform/opacity only, **no bounce**.
That's the "impact." (CSS scroll-snap is great for simpler full-section sites, but it's
mutually exclusive with the Lenis momentum we want.)

## 3. The numbers that make motion feel right
- **Durations:** microinteractions/taps **100–250ms**; content transitions **300–600ms**;
  the sweet spot for UI is **200–300ms** (<200ms reads near-instant; >600ms feels sluggish).
- **Easing:** **never linear** (feels dead). **ease-out makes things feel snappier** +
  more responsive *without* changing duration — perfect for Brutalist Snap. Reserve
  spring/bounce for nothing (brand: "no bounce, only impact").
- **60fps or it's jank:** budget **16.7ms/frame**; sub-60fps drops retention ~27%.
- **Compositor-only:** animate **`transform` + `opacity` only** — they run on the GPU
  layer with no reflow. Animating layout props (top/left/width/height) causes expensive
  reflows = jank. ⚠️ **`filter: blur()` is NOT compositor-cheap** — our Forge-Reveal +
  finale lean on blur; keep blur radii small/bounded and avoid animating large blurred
  areas, or it tanks FPS on mobile.
- **Purposeful motion *raises* perceived performance** — immediate, coherent feedback
  makes the site feel faster.

## 4. Reconciling the brand's two laws (fluid AND snap)
Layer them so they don't fight:
- **Scroll = fluid** (Lenis momentum + dt-damped progress). The journey glides.
- **Reveals = Forge Reveal** (blur→sharp, 300–600ms, ease-out) — fluid entrance.
- **Interactions/landings = Brutalist Snap** (ease-out, 120–220ms, transform/opacity,
  0ms delay, no bounce) — the impact.
- **Atmosphere = Drift** (slow constant velocity — embers/veins; already dt-driven).

## GAELWORX action list (the "make it smooth" pass)
- [ ] **Add Lenis** app-shell-wide; let our existing rAF read Lenis's scroll value (drop
      the dependence on raw `window.scrollY` smoothing). Disable on `prefers-reduced-motion`.
      Do **not** add CSS `scroll-snap` anywhere (Lenis conflict).
- [ ] **Audit transitions** to `transform`/`opacity` only; convert any layout-animating
      CSS. Standardize durations to the table above; ease-out everywhere; kill any linear.
- [ ] **Bound the blur:** cap Forge-Reveal/finale `blur()` radii, avoid animating blur on
      large surfaces; prefer opacity+slight-scale for reveals on mobile.
- [ ] **Even out the scroll-jack pacing:** review `WEIGHTS`/`HALF` so no act feels rushed
      or draggy; ensure no dead zones (finale fixed); tie reveal intensity to scroll velocity.
- [ ] **Hold 60fps:** keep per-frame work in the single rAF; verify in the perf harness
      alongside INP (scroll-jank = INP killer).
- [ ] Keep all motion `prefers-reduced-motion`-safe (already our pattern).

## Sources
- Lenis — [GitHub (darkroomengineering/lenis)](https://github.com/darkroomengineering/lenis) · [lenis.dev](https://www.lenis.dev/)
- Uncut — [Why Lenis Broke My Scroll-Snap (and the fix)](https://raoulcoutard.com/posts/2026-02-03-lenis-scrollsnap-conflict-en/)
- Codrops — [Seamless Infinite Scroll with GSAP & Lenis](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/)
- Rory Driscoll — [Frame-Rate Independent Damping using Lerp](https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/)
- Freya Holmér — [Frame-rate-independent lerp smoothing](https://x.com/FreyaHolmer/status/1757836988495847568)
- MDN — [CSS scroll-snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap)
- Lovable — [Scrolling Designs: 8 Patterns & When to Use Each (2026)](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use)
- PixelFreeStudio — [The Importance of Timing and Easing in Motion Design](https://blog.pixelfreestudio.com/the-importance-of-timing-and-easing-in-motion-design/)
- Motion.dev — [Animation performance guide](https://motion.dev/docs/performance)

<!-- ============================================================ -->
## Source: `docs/research/pacing-motion-deep-dive.md`

# GAELWORX — Deep Dive: why the home pacing *still* feels off (and the fix)

> Companion to `pacing-fluidity-snap.md` (the theory). This one is **grounded in the
> actual code** — every claim cites `file:line` — and ends with a prioritized fix and a
> measurement loop so we stop tuning blind. Operationalized as two skills:
> `.claude/skills/tune-pacing` (the scroll-jack) and `.claude/skills/motion-feel` (all motion).

---

## TL;DR — the five reasons it feels off

1. **The judge device never touches Lenis.** `new Lenis({ lerp: 0.1, smoothWheel: true })`
   (`src/ForgeExperience.jsx:78`) leaves Lenis 1.3's `syncTouch` at its **`false`** default,
   so **touch scrolling on the iPhone 15 is native momentum, not Lenis.** Every past
   "smoothness" fix that tuned *Lenis* changed **desktop only** — which is why it's *still*
   off on the phone. **The mobile feel = the choreography, full stop.**
2. **The choreography is all long blurred cross-dissolves — the opposite of Brutalist Snap.**
   `HOLD 0.5 / FADE 1.4` (`src/ui/Content.jsx:47-48`) gives every frame a **rest band of 0.5**
   and a **transit band of 0.9** of its allocation → you spend **~1.8× more scroll mid-dissolve
   than at rest.** Nothing ever *lands*; it's perpetually half-faded.
3. **Entry blur is huge and slow.** Incoming frames blur **18–32px** (`Content.jsx:106`) eased
   over the whole 0.9 transit window (`Content.jsx:162-176`). Big `blur()` is not
   compositor-cheap (see sibling research) → on mobile it reads as *mush + lag*, not motion.
4. **Programmatic scrolls fight the smooth layer.** "Descend", branch taps, and return-to-top
   call `window.scrollTo({behavior:'smooth'})` (`Content.jsx:120,124,126`) — native smooth —
   while Lenis owns the wheel, and `html{scroll-behavior:smooth}` (`src/styles.js:21`) is a
   second redundant smooth. These stack/fight → jumpy programmatic moves.
5. **We've been tuning blind.** WEIGHTS/HOLD/FADE/blur are hand-set magic numbers with **no
   measurement and no on-device A/B**, so each pass is whack-a-mole. The skill fixes the *process*.

---

## How the system actually works (the map)

| Concern | Where | Notes |
|---|---|---|
| Pin + scroll length | `.stage{position:fixed}` `styles.js:146`; `.scroll-track{height:TOTAL*100vh}` `Content.jsx:425` | Classic fixed-pin scrub. Frames are absolute, overlapping (`styles.js:176`). |
| The loop | single rAF `Content.jsx:136-291` | Reads **raw** `window.scrollY` → `p∈[0,1]` (`:137-138`). No extra damping on `p`. |
| Smooth layer | Lenis `ForgeExperience.jsx:75-91`, window mode | `window.scrollY` *is* the smoothed value **on wheel**; **touch is native** (syncTouch off). |
| Frame envelope | `Content.jsx:152-178` | `d=(p−CENTERS[i])/HALF[i]`; opacity `1` for `|d|≤HOLD`, →0 by `FADE`; incoming `easeOut`, outgoing `easeIn`; blur `v.blur·f`. |
| Allocation | `WEIGHTS` `Content.jsx:34`, `CENTERS/HALF` `:36-45` | weight×100vh per act; total ≈ 9.9 screens. |
| Carousel | `Content.jsx:181-203` | `branchF` rotates the wheel; pointer parallax `--px/--py` lerp **0.06** (`:141-142`). |
| Finale | `Content.jsx:226-287` | `fp` drives per-layer **trapezoid envelopes** (`env()`), strictly sequenced. |

### The numbers, measured
- **Lenis `lerp:0.1`** = per-frame alpha 0.1 → ~63% catch-up in ~9 frames (**~150ms**), with a
  long settle tail (**~300ms**) = the "drift/draggy" after you stop the wheel. *(Desktop only.)*
- **`HOLD 0.5 / FADE 1.4`** → **transit:rest ≈ 1.8:1.** Perceptually: mostly in-between states.
- **Entry blur 18–32px** over a 0.9 window → slow, heavy, GPU-pricey blur on the OLED target.
- **Pointer lerp 0.06** (`Content.jsx:141`) → ~250ms parallax lag = everything feels a beat behind.

### Brand check (`CLAUDE.md` → Motion Laws)
> **Brutalist Snap** — "0ms delay, high-momentum easing, **no bounce, only impact.**"

Right now arrivals are slow eased blur-dissolves: **all fluidity, zero snap.** The two laws are
meant to *layer* — scroll glides (fluid), elements **land hard** (snap). We shipped the glide and
skipped the impact.

---

## The fix — prioritized, with starting numbers (tune on device)

**P1 — Flip the rest:transit ratio (biggest mobile win).** Make frames *dwell crisp* and *hand
off fast*. Start `HOLD 0.5→0.66`, `FADE 1.4→1.04` (`Content.jsx:47-48`) → transit:rest ≈ **0.58:1**
(rest-dominant). Frames now sit still and sharp, then snap to the next.

**P2 — Cut + sharpen the blur.** Entry blur 18–32 → **6–12px** (`vecs`, `Content.jsx:106,111`),
and resolve it in the *first third* of the transit (blur on a steeper curve than position) so it's
"blur→sharp **impact**", not a long smear. Keep the finale drain blur ≤ 8px.

**P3 — Asymmetric easing = snap in, drift out.** Arrivals should decelerate hard (`easeOutQuart`/
`expo`), exits can stay soft. Replace incoming `easeOut` (cubic) with a quart/quint ease-out
(`Content.jsx:165`) for a more decisive landing without changing duration.

**P4 — Stop the smooth-scroll fight.** Route all programmatic scrolls through Lenis:
`forge.lenis?.scrollTo(target, { duration: 0.9, easing })` with a `window.scrollTo` fallback
(`Content.jsx:117-126`); **delete `html{scroll-behavior:smooth}`** (`styles.js:21`, keep the
`reduced` override). Removes the jump/fight on Descend / branch tap / return-to-top.

**P5 — De-lag the secondary motion.** Pointer parallax lerp **0.06→0.11** (`Content.jsx:141-142`);
optionally `syncTouch:true` on Lenis **only if** device testing shows native iOS scrub is the
problem (default: leave native — it's usually better than Lenis-on-touch).

**P6 — Couple velocity to the forge (optional, the "impact").** Feed scroll velocity (Δp/dt) into
`forge.emit.amt` / the vein surge so fast scrubs *kick* the embers/veins — turns raw speed into
on-brand feedback (raises perceived performance).

**Desktop-only knob:** Lenis `lerp 0.1→0.14` *(or* `duration:0.9` + `easeOutExpo)*` for a tighter
wheel. Won't touch mobile — keep expectations honest.

---

## Measurement loop (so the next pass isn't a guess)

1. **Compute the ratio, don't feel it:** `transit:rest = (FADE−HOLD)/(2·HOLD)`. Target **< 1.0**.
2. **Probe velocity + FPS** during a scripted scrub (Playwright: drive scroll, sample `p`, dt,
   and `performance.now()` deltas) — log max frame time; **fail > 20ms** (sub-50fps) on the
   mobile profile.
3. **On-device A/B:** ship behind nothing fancy — just commit, deploy to `main`, and read it on
   the **iPhone 15** (the only verdict that counts; transmission/OLED/touch don't simulate).
4. **One variable at a time**, re-read on device, record the value that felt right *here* in this doc.

---

## Verify (every pass)
`npm run build` green · Playwright scrub @ 393×852 + 1440×900, **0 console errors**, frame time
logged · **owner reads it on the iPhone 15** and signs off the feel. Never declare pacing "fixed"
from a desktop simulator.

## Sources
Carries `pacing-fluidity-snap.md`'s sources (Lenis, Rory Driscoll dt-damping, Motion.dev perf,
easing/timing). New emphasis: **Lenis `syncTouch` default is `false`** — verify in
[lenis options](https://github.com/darkroomengineering/lenis#instance-settings) before blaming Lenis for a mobile feel.


---

# Part V · Performance & Core Web Vitals

<!-- ============================================================ -->
## Source: `docs/research/webgl-performance-cwv.md`

# GAELWORX — Research: WebGL Performance & Core Web Vitals (Phase 3)

> The site is WebGL-heavy (obsidian forge on every route) and about to add 3D text.
> "Optimized" is a hard requirement, and Google's **March 2026** update **strengthened
> the performance weight** — only **47%** of sites hit "good" CWV; the other 53% lose
> **8–35%** of conversions/traffic. This is how we stay rich *and* fast.

## The core truth
"Add WebGL → CWV explodes" is a **false dilemma.** Sophisticated 3D + excellent scores
coexist **if the 3D loads after critical content and off the main thread.**

## The three metrics (2026 thresholds)
- **LCP < 2.5s** — largest content paint. Our LCP element is **prerendered text** (good),
  *as long as the WebGL bundle doesn't block it*.
- **INP < 200ms** — replaced FID (Mar 2024). **Most-failed CWV — 43% of sites fail.**
  Event handlers must do almost nothing synchronously; defer/offload the rest.
- **CLS < 0.1** — no layout shift. Reserve space; fonts `display:swap` (we do).

## High-impact techniques (ranked)
1. **Progressive load the 3D.** The canvas loads **after** critical content paints, never
   blocking LCP. `React.lazy` + `Suspense` the `ForgeCanvas`; mount on idle/after first
   paint. This is the single biggest win for our setup.
2. **Code-split the three stack.** three.js **doesn't tree-shake well**; use Vite
   `build.rollupOptions.output.manualChunks` to isolate `three` / `@react-three/*` /
   `postprocessing` into a vendor chunk (better caching + a smaller initial bundle).
   Analyze with `rollup-plugin-visualizer`. (Our bundle is ~1.43MB / 446KB gz today —
   the warning we keep seeing.)
3. **Off the main thread.** `OffscreenCanvas` → render WebGL in a **Web Worker**, freeing
   the main thread for UI/INP. Offload any heavy compute (particles/physics) to workers.
4. **LOD + compression.** Drei `<Detailed/>` LOD (+30–40% FPS in big scenes); Draco for
   any loaded geometry (−40% load on mobile, 20–30→45–55 FPS in one rollout). *(We're
   procedural/shader-based, so this matters mainly if we add 3D-text geometry.)*
5. **Mutate in `useFrame`, not React state** — direct mutation (we already do this) saves
   battery + avoids re-render jank on mobile.
6. **LCP basics:** critical CSS inlined (our prerender does), fonts preloaded `swap`,
   `fetchpriority="high"` on the hero's real LCP asset, modern image formats (AVIF/WebP)
   for any raster (our OG is the only PNG; the scene is shader-based).
7. **INP hygiene:** our scroll/pointer handlers just set store values + drive one rAF —
   keep them that light; never do layout/measure work in the handler.

## GAELWORX action list (Phase 3 / perf harness 0.5)
- [ ] `React.lazy(ForgeCanvas)` + Suspense; defer mount to post-paint (`requestIdleCallback`
      / after first content frame) so LCP is the prerendered text, not WebGL init.
- [ ] Vite `manualChunks`: split `three`, `@react-three/fiber|drei|postprocessing`,
      `postprocessing`, `gsap`, `leva` into vendor chunks; add `rollup-plugin-visualizer`.
- [ ] Add LCP/INP/CLS + total-JS measurement to the `scripts/shot.mjs` QA harness; **fail
      the gate over budget** (LCP < 2.5s mid-mobile, INP < 200ms, initial JS < ~200KB gz).
- [ ] Any 3D text (troika) = **lazy + desktop-first**, 2D fallback on mobile/reduced-motion.
- [ ] Keep `quality` tiers (already present) driving DPR + effects down on low-end devices;
      consider `OffscreenCanvas` if INP shows main-thread pressure.
- [ ] Verify `prefers-reduced-motion` disables the heaviest loops (already our pattern).

## Sources
- Utsubo — [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- Krapton — [Boosting React Three Fiber Mobile Performance in 2026](https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c)
- R3F docs — [Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- DigitalApplied — [Core Web Vitals 2026: INP, LCP, CLS](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
- DEV — [Core Web Vitals 2026: practical fixes that work](https://dev.to/benriemer/core-web-vitals-in-2026-the-practical-fixes-for-inp-lcp-and-cls-that-actually-work-4ef0)
- pmndrs — [Reduce bundle size for three.js (discussion)](https://github.com/pmndrs/react-three-fiber/discussions/812)
- NitroPack — [10+ New Optimizations for 2026 CWV Strategy](https://nitropack.io/blog/core-web-vitals-strategy/)


---

# Part VI · Lead Capture & Nurture

<!-- ============================================================ -->
## Source: `docs/research/lead-capture-and-nurture.md`

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


---

# Part VII · Deploy & Ops

<!-- ============================================================ -->
## Source: `docs/research/vercel-hobby-deploy-limits.md`

# Research: the Vercel Hobby deploy issue (production drops, previews build)

> Why `gwobsdnweb` production stopped updating from `main` while branch previews kept
> building. Root cause is the **Hobby plan's deploy limits** colliding with this session's
> deploy volume. Pairs with the `deploy-doctor` skill.

## Symptom (what we saw)
- GitHub `main` is current; the build is green; QA passes.
- **Zero production deployments** created for 5+ `main` pushes (incl. an isolated empty commit and a
  force-push) — not even queued records.
- **Branch previews DO build**, but **delayed ~10–19 min** and **coalesced** (Vercel built `fb2f5ce`
  then `16a0bea`, silently skipping the commits in between).
- Production serves **200 with stale content** (old bundle `index-BnJhKFIs.js`, no `/llms.txt`) — NOT
  a 503, so it's not "paused."

## Root cause — Hobby plan limits
Documented Hobby limits ([vercel.com/docs/limits](https://vercel.com/docs/limits),
[plans/hobby](https://vercel.com/docs/plans/hobby)):
- **100 deployments per 86,400s (1 day).** Hit it → no new deploys until the window rolls.
- **1 concurrent build** (Pro = 12). Builds run **serially through a queue**.
- Preview deployment for every Git push is included.

Build-queue mechanics ([builds/managing-builds](https://vercel.com/docs/builds/managing-builds)): the
queue is **per-branch ("namespace")**. With **one** build slot, Vercel **coalesces** a branch to its
**latest** commit (skips superseded ones) and serializes everything. Under a burst, interleaved `main`
builds get starved/dropped while the active branch keeps claiming the single slot — and once near the
**100/day** cap, new deployment *creation* is rate-limited.

**This session blew past Hobby's sizing**: the autonomous loop + parallel-agent fan-outs + dozens of
manual commits/pushes generated *far* more than 100 deploys in the day, with constant pushes to the
feature branch holding the one build slot. Production (`main`) was the casualty. Nothing is broken —
the plan is simply out of headroom.

## Fixes (researched, best first)
1. **Promote an already-built preview to production — no rebuild, no limit hit.** The latest branch
   preview is READY with all the work; point production at it:
   - Dashboard: project → Deployments → the READY preview → **⋯ → Promote to Production**.
   - CLI: `vercel promote <preview-deployment-url>`.
   - API/SDK: `requestPromote({ projectId, deploymentId, teamId })`
     ([docs](https://vercel.com/docs/deployments/rollback-production-deployment)).
   Promote **re-points production traffic to an existing deployment** — it doesn't build, so it sidesteps
   both the stalled webhook AND the rate limit. **This is the unblock.**
2. **Force a fresh prod deploy from CLI** (bypasses the webhook): `vercel deploy --force --prod`. Note:
   this DOES count as a deployment, so it can still hit the 100/day cap.
3. **Wait out the rolling reset.** The 100/day window is rolling — once volume drops, `main` deploys
   resume on their own.
4. **Cut deploy volume (prevention).** Each push = a deployment. Batch commits; push to `main` only at
   milestones. Optionally disable feature-branch previews so they stop eating the single slot + budget:
   `vercel.json` → `{"git":{"deploymentEnabled":{"claude/<branch>":false}}}`
   ([git-configuration](https://vercel.com/docs/project-configuration/git-configuration)). **Trade-off:**
   that kills the preview URL we currently use to review work — only do it once production is reliable.
5. **Upgrade to Pro** — 12 concurrent builds + far higher limits — if this build cadence continues.

## Lesson for our workflow
The autonomous-loop / per-commit-push / parallel-agent cadence is **too deploy-heavy for Hobby**. Treat
deploys as scarce: commit freely on the branch, but **promote a preview** or push `main` only at
milestones. (Captured in `deploy-doctor` + `git-hygiene`.)

## Sources
- [Vercel — Limits](https://vercel.com/docs/limits) · [Hobby plan](https://vercel.com/docs/plans/hobby) ·
  [Managing builds / queue](https://vercel.com/docs/builds/managing-builds) ·
  [Rollback / promote](https://vercel.com/docs/deployments/rollback-production-deployment) ·
  [Git configuration](https://vercel.com/docs/project-configuration/git-configuration) ·
  [Hobby limits explainer (deploywise, 2026)](https://deploywise.dev/blog/vercel-free-tier-limits-2026)

<!-- ============================================================ -->
## Source: `docs/research/cloudflare-pages-migration.md`

# Migrating GAELWORX off Vercel → Cloudflare Pages

**Why.** Vercel's Hobby plan has been the recurring deploy bottleneck (1 concurrent
build, 100 deploys/day → builds coalesce and stall; see
`vercel-hobby-deploy-limits.md`). Cloudflare Pages gives unlimited static requests, no
per-day deploy cap that bites at this volume, fast global edge, and the same
git-connected auto-deploy + PR preview flow we had on Vercel.

The site is a **static Vite SPA with build-time prerendered routes** (`npm run build` →
`dist/`, with per-route `index.html` + FAQ JSON-LD emitted by `scripts/prerender.mjs`).
That maps onto Cloudflare Pages 1:1 — no serverless functions, no runtime, nothing
Vercel-specific to port.

---

## What is already done in the repo (this branch)

- **`public/_redirects`** — Cloudflare Pages SPA fallback (`/*  /index.html  200`).
  Prerendered files like `dist/software/index.html` are static assets and are served
  FIRST; the catch-all only handles deep links with no matching file, so SEO-friendly
  per-route HTML is preserved and client-side routing still works for everything else.
  Vite copies `public/_redirects` into `dist/` on build; Vercel ignores it, so it is
  safe to land before the cutover.
- Build is host-agnostic: **build command `npm run build`**, **output directory `dist`**.
- `vercel.json` is left in place for now so the current Vercel preview keeps working
  during the transition. It can be deleted the moment Cloudflare is serving (it has no
  effect on Cloudflare — CF uses `_redirects`, not `vercel.json`).

---

## Owner steps — connect Cloudflare Pages (≈3 min, dashboard)

These require the Cloudflare account + GitHub auth, so they can't be scripted from here.
Source: Cloudflare Pages "Deploy a site" framework guide.

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** tab.
2. **Import an existing Git repository** → authorize GitHub → pick **`trash100k/GWOBSDNWEB`**
   → **Begin setup**.
3. **Set up builds and deployments:**
   | Option | Value |
   | --- | --- |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variables | none required |
4. **Save and Deploy.** Pages installs deps, runs the build, and publishes to
   `https://<project>.pages.dev`. Every push to `main` auto-deploys; PRs get preview URLs
   (same model as Vercel).

> Node version: Pages defaults to a current LTS, which builds this project fine. If a
> build ever needs pinning, add a `NODE_VERSION` environment variable (e.g. `20`) or a
> `.node-version` file.

### Custom domain (gaelworx.com)
Pages project → **Custom domains** → **Set up a domain** → add `gaelworx.com` (and
`www`). If the domain's DNS is already on Cloudflare, it's a one-click CNAME; if not,
move the nameservers to Cloudflare first (or add the CNAME Pages shows you at the current
registrar). Cloudflare provisions the TLS cert automatically.

---

## Owner steps — disconnect Vercel

Do this AFTER Cloudflare Pages is confirmed serving, so there's no gap:

1. Vercel dashboard → the `gwobsdnweb` project → **Settings → Git** → **Disconnect**
   (stops auto-deploys), **or** **Settings → Advanced → Delete Project** to remove it
   entirely.
2. If the custom domain was pointed at Vercel, move it to the Cloudflare Pages project
   (above) — don't leave `gaelworx.com` pointed at a disconnected Vercel deploy.
3. Optional repo cleanup once CF is live: delete `vercel.json` (say the word and I'll
   remove it in the branch).

---

## Notes / gotchas
- **No functions to port.** The app is 100% static after build; there were no Vercel
  serverless/edge functions, so nothing moves to Pages Functions / Workers.
- **`_redirects` vs prerender.** Verified order: static asset wins, catch-all is fallback
  only — so `/software`, `/pricing`, etc. keep serving their prerendered HTML + JSON-LD.
- **Alternative (not recommended here):** Cloudflare is steering new static sites toward
  **Workers static assets** instead of Pages. Pages is the closer 1:1 to the Vercel
  git-flow and needs zero new config, so it's the right call for this cutover. Revisit
  Workers only if we later need edge logic in front of the site.
</content>
</invoke>


---

# Part VIII · Appendix — Copy application drafts (per-page lever maps + final strings)

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/home.md`

# HOME — scroll-jack journey rewrite

> Owner: senior conversion copywriter. Surface: the home scroll-jack (`src/ui/Content.jsx`,
> copy in `src/brand.js` → `COPY.*`). Market diagnosis: AI-implementation is Schwartz
> **Sophistication Stage 3–4** + visitor skews **Problem→Solution-aware** → every lead runs on
> **MECHANISM ("Automatic Execution") + IDENTITY (the Clan)**, never a generic AI claim.
> StoryBrand spine: the owner is the hero, GAELWORX is the scarred battle-tested Guide; the
> villain is a condition (manual drudgery + AI-theater/black-box + bloated agencies), never the
> customer. Cost-of-inaction is framed louder than upside (loss looms ~2×). Every claim TRUE;
> prices LOCKED; brand terms spelled exactly so the A+E ignite fires.

---

## 1 · Levers used, and where

- **Hero** — *Proclamation/Promise lead + MECHANISM + IDENTITY* (frameworks 02 §4 Stage-3/4;
  Great Leads). Headline = the mechanism ("Automatic Execution", ignites). Sub names the
  mechanism as a *system that runs the work* and seats the identity ("built to execute, not
  babysit"). **One** Von-Restorff CTA — the single ember sword on the frame ("Point the Sword").
- **Clan** — *Unity/archetype + authority + the shared ENEMY* (03 §4.2; 04 Part 5; dark-levers
  Unity). "We move like a clan" (Unity), "we ship + run our own platforms — YardWorx, RepairWorx,
  SalesWorx, AgentWorx" (first-hand authority), and the enemy named outright (the AI-theater
  black box, the bloated agency). Burn-then-build held in one breath.
- **Arsenal head/intro** — *BAB* (02 §2; name the bottleneck → the system that ends it). Intro is
  the Before→Bridge in two strokes: name the thing eating your week, we forge the system that kills it.
- **Rates** — *anchored + "forge runs lean" reconciliation* (05 §1 prestige/price-as-quality;
  premium craft / honest price). Lede reconciles low price with premium craft via the mechanism
  (we systematized what others bill by the hour); foot carries the fixed-scope risk-frame.
- **Trust (5 rungs) — the Objection Cascade as proof** (02 §5):
  1. authority / first-hand ("we've run the operation, not read the case study"),
  2. enterprise ground (built on rails that run banks — predictable, not last quarter's model),
  3. the **anti-AI-theater enemy** (no black box, curiosity not reliance — it shows its work),
  4. ROI / **cost of inaction** ("it ships, then it earns" — counted in jobs/calls/hours; doing nothing has a price),
  5. **risk reversal** ("we carry the risk" — fixed scope, fixed price, paid when it executes).
- **Finale** — *problems[] = present-tense, loss-framed cost-of-inaction* (04 loss aversion);
  *solutions[] = future pace* (05 identity future-self); resolve into GAELWORX + a clean single CTA.
  Seed = the enemy in one line ("AI everywhere. Execution nowhere."). Closer future-paces the
  after-self (you command a machine, not a fire drill).

Voice throughout: Clan Voice — aggressive, direct commands, **no passive voice**, zero fluff,
battle-tested. Aimed at the enemy, never the customer. Every number/claim is true and sourced
from the locked branch prices/anchors.

---

## 2 · Rewritten copy (final strings — ready to paste)

> Keep the `COPY` key structure exactly; replace only the string values below.

### Mark / Loader

- **`COPY.mark`** →
  `GAELWORX · ONE FORGE`

- **`COPY.loader`** →
  `One Forge`

*(Kept — they're already the pure identity/mechanism stamp; nothing to sharpen without diluting
the wordmark. The ignite fires on GAELWORX in `mark`, and on "One Forge" type elsewhere.)*

### Hero — Proclamation/Promise + MECHANISM + IDENTITY

- **`COPY.hero.eyebrow`** →
  `Four Branches · One Forge`

- **`COPY.hero.headline`** →
  `Automatic Execution`

  *(The mechanism, not a claim. Ignites the leading A + leading E via `ForgeText ignite`.)*

- **`COPY.hero.sub`** →
  `The system that runs your business while you sleep — booking the jobs, killing the busywork, answering every call. Built to execute, not to babysit.`

- **`COPY.hero.cta`** →
  `Start the Forge`

  *(The one Von-Restorff sword on the frame. Point the Sword.)*

### Draw (interstitial)

- **`COPY.draw`** →
  `From black, the light.`

  *(Kept — it's the obsidian→forge-light beat the scene literally performs; pure Forge metaphor,
  no claim to sharpen.)*

### Clan — Unity + authority + the ENEMY

- **`COPY.clan.kicker`** →
  `01 · The Clan`

- **`COPY.clan.head`** →
  `One forge. Four branches.`

- **`COPY.clan.body`** →
  `GAELWORX is an engineering forge, not an agency. We run our own platforms on this exact system — YardWorx, RepairWorx, SalesWorx, AgentWorx — and forge the same caliber for you. The enemy is the black box: AI theater that demos and never ships, agencies that bill for motion. We move like a clan — small, fast, on the hook. You talk to the people who build it.`

  *(Unity "we move like a clan"; authority "we run our own platforms on this exact system";
  enemy named — AI theater / billing for motion; burn-then-build, no passive voice. Brand terms
  auto-ignite in prose via `BrandText`.)*

### Arsenal — BAB (name the bottleneck → the system that ends it)

- **`COPY.arsenal.kicker`** →
  `02 · The Arsenal`

- **`COPY.arsenal.head`** →
  `Four branches. One forge.`

- **`COPY.arsenal.intro`** →
  `Name the thing eating your week. We forge the system that ends it.`

  *(BAB compressed: Before = the bottleneck, Bridge = the forged system. Direct command, no fluff.
  The 4 branch bodies are owned by the service agents — untouched.)*

### Rates — anchored + "the forge runs lean" reconciliation

- **`COPY.rates.kicker`** →
  `The Forge Runs Lean`

- **`COPY.rates.head`** →
  `Premium work. Honest prices.`

- **`COPY.rates.lede`** →
  `Automatic Execution means we systematized what other shops still bill by the hour. You're not paying less for less — you're paying less because the forge is efficient. The number doesn't move once we name it.`

  *(Reconciliation lever: premium craft beside an accessible price, justified by the mechanism.
  "The number doesn't move" pre-loads the fixed-price risk-reversal. Automatic Execution ignites
  in prose.)*

- **`COPY.rates.foot`** →
  `Fixed scope. Fixed price. Continental US · 7 Days.`

  *(LOCKED line — unchanged.)*

### Point — Start the Forge (commitment step)

- **`COPY.point.kicker`** →
  `03 · Start the Forge`

- **`COPY.point.head`** →
  `Name the bottleneck.`

- **`COPY.point.body`** →
  `One call. No discovery-call theater. You name the bottleneck — we forge the system that kills it. Fixed scope, fixed price, before you owe a thing.`

  *(Micro-commitment / "state the problem in your own words"; enemy "discovery-call theater";
  risk-frame seeded "before you owe a thing".)*

- **`COPY.point.cta`** →
  `Start the Forge`

- **`COPY.point.avail`** →
  `Available · Continental US · 7 Days`

  *(True capacity/availability scarcity — kept as-is.)*

### Trust — the Objection Cascade as proof (5 rungs)

- **`COPY.trust.kicker`** →
  `Why GAELWORX`

**Rung 01 — authority / first-hand (Why believe you):**

- **`COPY.trust.rungs[0].n`** → `01`
- **`COPY.trust.rungs[0].head`** →
  `We build what we run.`
- **`COPY.trust.rungs[0].body`** →
  `Every build starts from decades on the floor — we've run the operation, not read the case study. We worked the bottlenecks we automate and lived the problems we solve, so you never pay us to learn your business on your dime.`

**Rung 02 — enterprise ground (Why it's safe):**

- **`COPY.trust.rungs[1].n`** → `02`
- **`COPY.trust.rungs[1].head`** →
  `Built on enterprise ground.`
- **`COPY.trust.rungs[1].body`** →
  `We build on the same battle-tested rails that run banks and logistics fleets — not last quarter's frontier model and a crossed-fingers prompt. Proven ground. Behavior you can predict. Nothing held together with hope.`

**Rung 03 — the anti-AI-theater enemy (Why not the hype):**

- **`COPY.trust.rungs[2].n`** → `03`
- **`COPY.trust.rungs[2].head`** →
  `No black box.`
- **`COPY.trust.rungs[2].body`** →
  `We point AI at the rote work — never to breed dependence. No black-box oracle, no confident nonsense, no machine pretending to be the human in the room. It does the grunt work, shows its reasoning, and hands judgment back where it belongs — yours. Built to make you sharper, not hooked.`

**Rung 04 — ROI / cost of inaction (Why it pays — and what doing nothing costs):**

- **`COPY.trust.rungs[3].n`** → `04`
- **`COPY.trust.rungs[3].head`** →
  `It ships. Then it earns.`
- **`COPY.trust.rungs[3].body`** →
  `No pilots that rot in "phase two." We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, hours handed back. Every week you wait, the manual way keeps billing you for all three.`

**Rung 05 — risk reversal (Why now / why it's safe to act):**

- **`COPY.trust.rungs[4].n`** → `05`
- **`COPY.trust.rungs[4].head`** →
  `We carry the risk.`
- **`COPY.trust.rungs[4].body`** →
  `Fixed scope. Fixed price. Working on day one. We don't get paid to experiment on your business — we get paid when it executes. The risk is ours. That's the point.`

### Finale — cost-of-inaction (present) → future pace → GAELWORX → CTA

**`COPY.finale.problems` (present-tense, loss-framed — the bleed happening NOW):**

- `[0]` → `Every missed call. A booked job, gone.`
- `[1]` → `Hours a week, lost to busywork.`
- `[2]` → `Six apps. None of them talking.`
- `[3]` → `A site that books nothing.`

  *(Loss-frame: each line is a cost being paid right now, not a neutral feature. Matches the 4-line
  shape and the carousel/finale rhythm — punchy, present tense, no passive voice.)*

**`COPY.finale.seed` (the enemy in one line):**

- → `AI everywhere. Execution nowhere.`

  *(Kept — it's the sharpest one-line villain in the whole deck: the AI-theater enemy named flat.)*

**`COPY.finale.solutions` (future pace — the after-self, command not chaos):**

- `[0]` → `Every call answered.`
- `[1]` → `The busywork runs itself.`
- `[2]` → `One system. Total command.`
- `[3]` → `A site that books the truck.`

  *(Future-paced after-state, mirroring each problem 1:1. "Total command" / "books the truck" =
  the operator who runs a machine, not a fire drill.)*

**`COPY.finale.forges`** (owned by the journey, not rewritten — listed for completeness):
`['YardWorx', 'RepairWorx', 'SalesWorx', 'AgentWorx']`

- **`COPY.finale.mark`** →
  `GAELWORX`

  *(Ignites via `Ignite`.)*

- **`COPY.finale.closer`** →
  `We keep up so you don't have to. You command the machine — we hold the line.`

  *(Future-paces the identity: the owner commands a system; GAELWORX (Guide) holds the line.
  Replaces the vaguer "take care of the battlefield" with the command/identity frame.)*

- **`COPY.finale.avail`** →
  `Available · Continental US · 7 Days`

- **`COPY.finale.cta`** →
  `Start the Forge`

  *(The single closing sword. Point the Sword.)*

### Footer

- **`COPY.footer.mark`** →
  `GAELWORX · One Forge`

- **`COPY.footer.tag`** →
  `You run the business. We forge the systems that run it.`

  *(Kept — it's already the clean StoryBrand lockup: customer = hero who runs the business,
  GAELWORX = the Guide who forges the system. Nothing to sharpen without weakening it.)*

---

## Notes / guardrail check

- **Prices LOCKED** — no number touched; the rates lede/foot and trust rung 04/05 reference only the
  fixed-scope/fixed-price frame, never a changed figure. Branch bodies + FAQ untouched (service agents own those).
- **Brand spelling** — GAELWORX, Maeve, YardWorx, RepairWorx, SalesWorx, AgentWorx, Automatic Execution
  spelled exactly so A+E ignite fires (display via `Ignite`/`ForgeText ignite`; prose via `BrandText`).
- **No passive voice; every claim TRUE** — authority claims ("we run our own platforms on this exact
  system", "we've run the operation") restate existing brand claims; enemy is real (AI theater / black
  box / bloated agencies); scarcity is real capacity ("Continental US · 7 Days"). No fabricated proof,
  no fake timers, no invented stats.
- **Length/shape preserved** — headlines stay short, lines stay punchy; `problems`/`solutions` stay 4
  lines each and mirror 1:1; bodies match current sentence counts to keep the scroll-jack tight.
- **Kept-as-is, by design** (already optimal / structural): `mark`, `loader`, `draw`, `finale.seed`,
  `footer.tag` — sharpening these would dilute the wordmark/metaphor or weaken a line that already
  nails its lever.

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/software.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/voice.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/automations.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/web.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/work.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/about.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/contact.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/pricing.md`

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

<!-- ============================================================ -->
## Source: `docs/research/copy/drafts/revision-pass.md`

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

