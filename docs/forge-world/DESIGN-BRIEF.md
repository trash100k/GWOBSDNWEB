# GAELWORX — Forge World Redesign · DESIGN BRIEF

> Living document. Captures the visual + narrative + commercial design as it stands.
> Status: **concept locked, graphics research in flight, build not started.**
> Branch: `claude/website-avatar-forge-redesign-k15gh9` · Date opened: 2026-06-30.
> Constraint that rules everything else: **keep all existing copy intent; reimagine the
> CONCEPT at avatar / AAA-game-level graphics.** Build a **world, not a website.**

---

## 0. One-line concept

> You begin inside a giant, ancient, ominous **Gaelic dwarf-forge**. **Living molten metal**
> bubbles alive with the intro tagline, **releases from a stone altar**, and **pours down through
> Celtic interlace channels** — and as you scroll, the story is told by the metal *being poured
> into something solid*. The channels are **filling the word GAELWORX**. At the end, GAELWORX
> stands fully cast: six letters cooled to forged iron with deep ember veins — and the **A and E
> still white-hot with divine fire, radiating** into the dark.

The brand's mandatory **A+E ignite rule is made physical**: the A and E aren't hot because of a
typographic rule — they're hot because, in this world, **they are the last to cool. They never do.**

Register: **"Middle-Earth meets true Gaelic."** Huge. Ominous. Sacred. Meticulously engineered.

---

## 1. The ruling principle (read this before any visual decision)

**The environment is the STAGE. The message is the STAR. The delivery is the trick.**

- **The forge world** is epic, ominous, ancient — but it is the backdrop, not the showpiece.
- **The copy** stays short, punchy, brass-tacks Clan Voice — easy to read, instantly digestible.
- **The mind-bending part is the *method of delivery*** — how the text physically exists in and
  reacts with the 3D world (typography forged from the pour, spatial depth, the environment
  responding to the words). Concise content, delivered in a way nobody has seen a business site do.

If a visual idea makes the *message* harder to read, it loses. Awe serves the words.

**The quality bar is GAMING + CINEMATIC, not "web design."** Benchmark every surface against
real-time graphics studios and game/cinematic intros — **Active Theory · Lusion · Resn · Unseen
Studio** caliber WebGL, and Unreal-cinematic real-time looks — *avatar-and-above*. "Looks good for a
website" is a failing grade. This is also a **business asset, not just an aesthetic**: the reusable
**forge-world 3D engine** built here is what lets us ship this caliber across client sites by
*config* (see `PRICING.md` — it's the moat that makes cinematic 3D viable even at the $1,499 hook).

---

## 2. The narrative arc (home journey) — LOCKED

The **entire scroll is one continuous POUR.** The camera does not cut — it **travels**, following
a single stream of metal as it winds down through the sacred channel architecture toward GAELWORX.
Story copy floats at the side of the path like stone tablets; **you read while the metal moves.**

| Act | What the metal/camera does | Copy role |
|---|---|---|
| **Hero** | Camera near the altar; metal pools at the brim, heat-shimmering, about to release. | The reframe tagline. |
| **Release / interstitial** | The altar tilts; the pour begins; camera begins its descent. | Name the enemy. |
| **The Clan** | Metal travels the first stretch of interlace channel. | Identity → guide → enterprise credibility. |
| **The Arsenal** | The channel **forks into four branches**, each with its own carved character. | Four services, pain-first, `from $X` tease. |
| **Trust ladder ×5** | The branches rejoin; flow accelerates toward the word; camera tightens. | Five objections killed in sequence. |
| **Finale** | Metal arrives at the GAELWORX letterforms and **fills them G→A→E→L→W→O→R→X.** Camera descends from overhead (flat/engraved read) to **eye level**, revealing the letters have depth as the **A+E ignite and radiate.** | Identity close + CTA. |

**Finale detail (the payoff):** G fills white-hot then cools fast → forge-red → iron-black with
ember veins. A fills and **does not cool.** E fills and **does not cool.** W, O, R, X fill and
cool. Final image: six iron letters, two white-gold divine-fire letters, their light spilling onto
the adjacent stone and making the carved **Ogham** in the word's border readable for the first
time. Beneath, **"Automatic Execution"** crystallizes out of heat-haze in Cinzel — its **A** the
same white-gold as the wordmark's A. *Same fire, same source.*

Decisions baked in: **finale = earned payoff** (not the hero); **story sections = hybrid** (some
float, key beats told through the metal); **letter depth = "camera decides"** (overhead-flat →
eye-level reveal); **pour source = a stone forge-altar**; **tone = ominous and sacred.**

---

## 3. The world — physical + material spec

| Element | Spec |
|---|---|
| **Space** | "Pour source only" framing. We see the altar above, the channels, the letters below, and the stone immediately around them. Everything else falls to **pure void** — the only light is the metal itself. Vastness is *implied by the darkness the light can't reach.* |
| **Stone** | **Dark green-black Irish basalt** (Connemara-marble / Irish-limestone depth). Reads near-black; the green only reveals under the A+E white-gold light. |
| **Gaelic styling** | **Both marked AND structural.** The channel architecture *is* Celtic interlace (winding, splitting, rejoining); surfaces are *also* carved with knotwork + **Ogham**. This forge was built by people with a specific visual language. |
| **The altar** | A raised stone **forge-altar**, every face carved with knotwork, Ogham along its stepped edges. Metal pools on it and releases through channels carved into its face. Ritualistic, sacred — more altar than machine. |
| **The metal** | True temperature gradient — white-hot leading edge (slightly blue-shifted like real steel) → ember orange `#E85D04` → forge red `#C1292E` → dark iron-black with deep ember veins. **Thick, viscous, heavy** — molten metal, not water. |
| **The A + E** | **Divine fire — unearthly white-gold.** A color no cooling metal should make. Steady, *not* pulsing — a coal that's burned since the mountain was young. Light spills onto neighbouring letters + stone + carving. |
| **Atmosphere** | **Heat shimmer** (air distortion above the hot metal) + **living sparks** that *orbit the pour front*, drawn by heat — not random drift. Where metal has passed, channels glow cooling and settle. |

---

## 4. Per-page chambers — DIFFERENT chambers of one forge complex

Each route is a **distinct location** in the same forge world (shared basalt, Ogham, palette, heat,
single renderer). **Voice is the flagship inner page.** Each environment must be incredible *on its
own terms*; the copy floating over it stays direct and brass-tacks.

| Route | Chamber | Concept |
|---|---|---|
| `/` Home | **The Pour Journey** | The full continuous pour → GAELWORX cast (Section 2). |
| `/voice` | **The Scrying Pool** ★flagship | A circular pool set in basalt, **Ogham carved around the rim**, a single forge-light reflection on the surface, an **ember glow beneath the water**. Still between interactions; **sine-wave ripples** emanate from center when Maeve is "active." The quiet chamber — almost no sparks. Branding dialed down: **the water and the voice-waveform ripples ARE the scene.** |
| `/software` | **The Casting Room** | A finished forged cast on a stone plinth, still warm, being examined; camera orbits. Knotwork surface that, up close, forms logic-gate / circuit paths. The argument for *ownership* is the object you can see and touch. |
| `/automations` | **The Channel Hall** | Top-down view of the interlace channel network, lit from below by **parallel streams** of metal flowing in concert — none colliding. You see the *system*, not the output. |
| `/web` | **The Jewel Chamber** | The existing `FacetedJewel` recontextualized: held in a basalt niche under a single ember-light, **dispersion** throwing the A+E white-gold / forge-red / green-black across its facets. The most visually alive inner room. |
| `/about` | **The Altar Approach** | Standing at floor level before the altar; channels descend from it; the GAELWORX letters sit dark (already cast). The altar glows. The clan's home. You are small. |
| `/pricing` | **The Stone Ledger** | Pricing **cut in deep relief** into a basalt tablet, ember-light raking from below through the carved letters. *Fixed scope, fixed price — literally cut in stone.* |
| `/work` | **The Four Plinths** | YardWorx · RepairWorx · SalesWorx · AgentWorx as four finished casts on plinths in the dark — **each a synopsis of a piece of software we've actually built** (the *…Worx* names are our own platforms). Different form/surface/temperature each; camera moves between them. |
| `/contact` | **The Forge Mouth** | A stone arch cut from living rock, Ogham up both sides, **"Name the bottleneck." carved into the keystone**, the warm forge interior glowing beyond. You step through to become the next thing made here. |

---

## 5. Typography & interaction — the "mind-bending" layer

**Copy placement differs per page** (no single formula):

- **Home** — text **forms from the pour itself**: sentences written in molten metal as the flow
  fills the channels, then cool and set. Scroll is the pen.
- **Contact** — copy **revealed by interaction**: the forge mouth surfaces its message as you
  approach / scroll through the arch.
- **Pricing** — copy **embedded in the 3D**: carved into the stone ledger. You read the forge wall.
- **About** — copy **reacts to the scene**: floats, but the altar's glow illuminates it; the
  environment acknowledges the words.

**Three typographic moments, used across the journey:**
1. **The pour writes the words** (Home channel journey).
2. **Depth — text at multiple Z layers** with touch/scroll **spatial parallax** → the space feels
   infinite; hierarchy is spatial, not just size.
3. **The environment responds to brand words** — when GAELWORX / Automatic Execution / Maeve
   surface, the scene reacts (altar flares, pool ripples). The forge acknowledges its own name.

**Interaction model = MOBILE-FIRST.** Scroll is primary and sufficient (no hover dependency
anywhere). **Touch-drag drives the spatial parallax** (replaces the desktop cursor). The existing
`forge.pointer` rig handles touch natively. Every reveal is scroll- or touch-triggered.

---

## 6. Commercial design — pricing placement & the sales journey

> Grounded in `docs/research/2026-pricing-journey-and-design.md`, `copy/05-high-ticket.md`,
> `copy/04-dark-levers.md`. Stance: **anchored transparency** — show ranges/anchors, keep the
> bespoke final number a conversation; **sequence value before any number.**

> **Full pricing model + the web cost economics live in `PRICING.md` (authoritative, 2026-06-30).**
> Headline ladder: Software **$15k–$50k** (25% deposit) · Voice **outbound, hybrid** ($2,500 setup
> + $699/mo/agent + $0.30/min overage + $50/booked appt) · Automations **$2,500–$7,500 + care** ·
> Web **$1,499 hook + $49–99/mo Forge Care**.

### 6.1 Where pricing appears
- **NEVER show price:** hero / above-the-fold (any page), **About**, **Work**.
- **TEASE only (`from $X`, no context):** Home **Arsenal** cards; the Nav "Pricing" link (clicking
  pre-qualifies via curiosity).
- **FULL reveal (anchor + tiers + de-risk):** individual **service pages** (late, after
  outcome→proof→de-risk), the **`/pricing`** page, and **Contact** (entry rung only).

### 6.2 Home page pricing — the blatant "rates beat" frame is REMOVED
It broke the emotional momentum right before the close (triggered System-2 analysis at the worst
moment). The home journey now flows trust-ladder → finale with **no price table.** Pricing work on
home = the Arsenal `from $X` tease + a quiet **"Full pricing →" / "See the math →"** link under the
finale CTA. The home page **never answers the pricing question — it makes people want to.**
Home anchors the *problem* cost ("agencies bill $75k+", "a receptionist is $48k/yr") and teases
vaguely ("we charge considerably less"); **no specific GAELWORX number on the home page.**

### 6.3 The `/pricing` page — tabbed, flagship-first
One killer tease on home drives here; the page is **tabbed by service** with room to explain.
**Numbers are authoritative in `PRICING.md` (revised 2026-06-30) — keep this table in sync.**

| Tab | Label | Anchor shown | Tiers (decoy middle highlighted) |
|---|---|---|---|
| **Software** (1st) | *The Flagship Build* | agency $75k–$200k; in-house dev $180k+/yr | Foundation **$15k** · **Core Build $30k** · Full Platform **$50k** · **25% deposit** = filter |
| **Voice** (2nd) | **★ Recommended** | outbound SDR $50–70k/yr +commission (dials ~80/day vs 1,000+) | **Outbound, hybrid:** $2,500 setup · **$699/mo/agent** (incl. minute bucket) · $0.30/min overage · **$50/booked appt** |
| **Automations** | *Kill the Busywork* | by hand = hours/week | Project **$2,500–$7,500** · **Forge Care $500–$1,500/mo** |
| **Web** | *Book the Build* | premium studios $50k+ | Launch **$1,499** · **Full Cinematic $4,999** · Custom **$9,999+** · **Forge Care $49–99/mo** |

Tab order does the anchoring (Software's $15–50k makes Voice's entry read as the easy yes);
**"Recommended" on Voice** = Von Restorff + social proof + middle-option pull, routing to the
productized entry rung with the best close rate. Each tab: **anchor → tiers (room to explain) →
de-risk → CTA.**

### 6.4 The home sales journey — sequence & levers (LOCKED)
**Sequence:** Pain/COI → Enemy → Identity → Proof → De-risk → Future-state → CTA. *(No price beat.)*

- **Hero (the reframe):** *"Your business doesn't need artificial intelligence. It needs Automatic
  Execution."* — AI **hype** is the villain; **execution** is the product.
- **Enemy:** *"Most agencies bill for motion. We bill for execution. The difference is whether it
  ships."* — GAELWORX **is** an agency (runs Claude, Gemini, enterprise AI) → **"not your average
  agency."** The real villain is the **grind / the old way**, never a named competitor.
- **The Clan:** identity first (*"For operators who refuse to lose to the status quo"*) → GAELWORX
  as guide (we run it on our own shops) → **enterprise credibility, named explicitly** (Claude,
  Gemini, enterprise-grade AI; the same rails that run banks & logistics fleets).
- **Arsenal:** **Voice first** (sharpest pain, entry rung). Each card opens on the **pain**, then
  the fix, then `from $X` tease.
- **Trust ladder — all 5 rungs (enterprise ground STAYS — it is the credibility pillar):**
  1. **We build what we run** (first-hand authority).
  2. **Built on enterprise ground** (Claude/Gemini/bank-grade rails — *important, permanent*).
  3. **No black box** (control / risk objection).
  4. **It ships, then it earns** (+ the Monday-morning future-pace).
  5. **We carry the risk** (fixed scope/price, deposit-as-filter — the close before the close).
- **Finale (identity close):** *"Point the sword. We take care of the rest."* → **START THE FORGE**
  → honest scarcity (*"We take 2 builds a quarter. That's not a line — it's how we hold the
  standard."*) → secondary CTA **"See how it works →"** (`/about`) → quiet **"Full pricing →"**
  (`/pricing`).

**Buyer:** both owner-operator **and** ops/growth hire (split traffic). **Wound:** all four (missed
calls, busywork hours, messy disconnected tech, a site that books nothing). **Proof today:** the
four self-run platforms (no external case studies yet). **Entry rung:** Voice / Maeve.

**Honest levers in play:** Loss-aversion / Cost-of-Inaction, Enemy/Villain (the old way), Unity
(the Clan), Anchoring, Status/Identity, Future-pacing, Risk-reversal ($5k deposit as commitment
filter; "we carry the risk"), Specificity-as-proof, Curiosity-gap (the price tease), Von Restorff
("Recommended" tab / molten-edge focus), Authority (enterprise ground + first-hand). Every lever
must survive scrutiny — at this price point one caught fake torches the whole funnel.

---

## 7. Brand system — non-negotiable (carries unchanged from CLAUDE.md)

- **Type:** Cinzel Decorative (display, 700/900 only) · Bricolage Grotesque (headlines) · Hanken
  Grotesk (body) · JetBrains Mono (labels). **A+E ignite** = first `A` + first `E` per word of each
  brand term, 900 + forge-glow gradient.
- **Palette (Industrial Metallurgy):** Celtic Blood `#C1292E` · Ember Glow `#E85D04` · Forged Iron
  `#0B0C10` · Cold Steel `#1F2833` · Fog White `#F1F2F6` · Ash `#8D99AE`.
- **Neo-Gaelic Brutalism (DOM layer):** 0px corners, hard 1–2px borders, Iron Grid (12-col, 0px
  gaps), 8px hard `#000` shadow, Brutalist-Snap motion (0ms delay, impact not bounce), Forge-Reveal
  (blur→sharp).
- **Voice:** aggressive, clean, battle-tested; CTAs = "Point the Sword."

---

## 8. Tech stack & constraints

Vite + React + react-three-fiber + three.js. **Single WebGL renderer**, route-swapped "chambers"
(evolves the existing `src/scene/scenes.js` preset pattern). Lenis momentum scroll. Prerendered
static HTML for SEO/AEO (per-route head + FAQPage schema). Deploys to Vercel on push to `main`.
**Hard constraints:** no runtime EXR loads · strict mobile perf budget · **primary judge target
iPhone 15 OLED** (true blacks, vivid color). Live tuning via `?debug` (leva).

---

## 9. Open questions / not yet decided
- ☑ **Scarcity number — LOCKED: 2 builds per quarter.** ("We take 2 builds a quarter. That's not a
  line — it's how we hold the standard.") Real cap → honest scarcity; must stay true.
- Whether the trust ladder stays 5 rungs now that the rates beat is gone (leaning **keep 5**).
- Lead-tracking stack for the ~6-month nurture window (Supabase / Attio / Gmail-AgentMail / n8n).
- The Ogham inscription line on the altar (the one ancient mark older than the word).
- Final WebGPU/TSL-vs-WebGL2 call (pending graphics research Phase 2).
