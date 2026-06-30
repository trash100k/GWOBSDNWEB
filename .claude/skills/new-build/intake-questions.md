# new-build — INTAKE QUESTION BATTERY

> Run these at the start of any new build. Use as `AskUserQuestion` Socratic rounds (1–4 at a time,
> lead each option with a recommendation, lock the answer, move on). Capture every locked answer into
> `DESIGN-BRIEF.md` / `PRICING.md`. You won't ask all of these every time — pick the live ones, but
> never start building with A, B, C, or G unanswered.

---

## A. BUILD TYPE & SCOPE
- New build, redesign, or a single landing page?
- Marketing site, app/product, store, portfolio, or hybrid?
- How many routes/pages, and which are "hero" pages vs utility?
- Avatar-level 3D world, selective 3D moments, or flat/2D with motion? *(Sets the whole budget.)*
- One continuous scrolled journey (like the forge pour) or discrete pages?
- Timeline / hard deadline? (A full 3D site is ~a week of engine-config per the playbook.)
- Reusing the forge-world engine (config) or genuinely bespoke from scratch?

## B. WHO IT'S FOR (audience / buyer)
- Primary buyer persona — owner-operator, ops/growth hire, exec, consumer? (Split traffic?)
- What wound is already open when they land — the thing they felt *this week*?
- Cold traffic or warm/referred? (Changes how much trust the page must build.)
- B2B high-consideration (long, multi-touch, rep-free) or B2C impulse? *(Sets sequence + pacing.)*
- What's the one action that = success for this visitor?
- What objections/ fears must the page kill before they'll act?
- Device reality — mobile-first %? (Default: assume mobile-first, iPhone-OLED target.)

## C. GOALS & CONVERSION
- Primary conversion (call booked, form, purchase, signup, deposit)?
- Secondary/soft on-ramp for the not-ready (e.g. "see how it works → /about")?
- One CTA or tiered CTAs? (Default: one sword, one point — unless a real soft on-ramp is needed.)
- What's the post-conversion path / who follows up, over what window (nurture)?
- Lead-tracking stack (Supabase / Attio / Gmail-AgentMail / n8n / CRM)?
- Any honest scarcity to deploy (real cohort cap)? Never manufacture it.

## D. BRAND & VOICE
- Existing brand law/source-of-truth (like `CLAUDE.md`) or building it now?
- Display + body type system; any signature type "trick" (the A+E ignite equivalent)?
- Palette + the "active system" accent color.
- Geometry language (e.g. 0px brutalist corners) + motion law (e.g. Brutalist Snap).
- Voice — tone, person, CTA logic ("Point the Sword").
- Brand terms that get special treatment, and the rule for them.

## E. 3D WORLD & QUALITY BAR
- The core metaphor — what *is* this world? (forge/pour, water, terrain, abstract…?)
- Reference tier to beat (name 2–3 sites; default Active Theory / Lusion / Resn / Unseen).
- Per-page "chambers" — does each route get its own world (sharing one engine) or one space, reframed?
- The master driver uniform (temperature? depth? sound?) every effect shares.
- Atmosphere (sparks/haze/smoke/particles) and the lighting model (what's the only light source?).
- Camera language — scroll-travel vs cuts; DOF/cinematic framing; the "reveal" moment.
- Hard constraints — no-EXR? perf budget? reduced-motion path? WebGPU/TSL or WebGL2 fallback?
- Where does copy live per page (carved/embedded · forms-from-the-world · floats-and-reacts · reveal-on-interaction)?

## F. CONTENT & COPY
- Is final copy provided, or do we write it (keep/extend an existing deck)?
- The villain/enemy (a condition, never a named competitor).
- The identity the buyer becomes (future-pace target).
- Proof assets available now (case studies w/ numbers? self-run platforms? brand story only?).
- Any compliance/claims that must stay defensible (every lever must survive scrutiny).

## G. PRICING & COMMERCIAL (their offer)
- The service lines and the role of each (flagship · profit center · loss-leader · easy-second-sale).
- For each: value to the buyer, the real-alternative anchor, true cost to deliver.
- Transparency stance (anchored ranges vs "contact us")? (Default: anchored transparency.)
- Where does price appear (default: never hero/About/Work · tease home · full on tabbed `/pricing`)?
- Deposit / commitment filter? Recurring care plan attached to each line?
- Tier shape per line (entry hook · decoy middle · premium) + the one "Recommended" flag.

## H. TECHNICAL & INFRA
- Stack (default: Vite + React + r3f/three; single renderer, route-swapped scenes).
- Hosting + domain (default: Cloudflare Pages + the Cloudflare protection-connector zone template).
- SSL/WAF/bot/rate-limit (the connector handles it; SSL = $0, sold as value).
- Forms/email (Resend / CF email routing / AgentMail) · analytics (Plausible/CF) · uptime monitoring.
- SEO/AEO needs — prerender, FAQPage schema, sitemap, llms.txt (run `aeo-geo`).
- Integrations (CRM, payments/Stripe, calendar, voice/dialer for outbound agents).

## I. PROCESS & BEST PRACTICES (logistics)
- Who owns the code/data at handoff (default: client owns; no lock-in)?
- Revision rounds included; what triggers scope/price change?
- Track hours per fixed-scope build — if a tier exceeds its hour budget, it's an *engine config gap*,
  not a pricing miss.
- Definition of done / ship gate (run the playbook §6 checklist; verify on a real device).
- Maintenance/care-plan handoff and what it covers monthly.

---
**After intake:** write the answers into `DESIGN-BRIEF.md` (concept/world/journey/placement),
`PRICING.md` (numbers/economics), and `TODO.md` (phased plan), then start the graphics research +
the build cadence (playbook Steps 3–6).
