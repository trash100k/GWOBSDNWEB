# GAELWORX — Forge World Redesign · TO-DO & BUILD PLAN

> Living build tracker. Branch: `claude/website-avatar-forge-redesign-k15gh9`.
> Companion to `DESIGN-BRIEF.md` (what) and `RESEARCH.md` (why/how).
> Status legend: ☐ not started · ◐ in progress · ☑ done · ⏸ blocked/waiting.

---

## CADENCE — how we build it

The world is built **bottom-up: shared systems first, then the home journey, then chambers.**
Each phase de-risks the next. We **commit at the end of every phase** to `claude/website-avatar-
forge-redesign-k15gh9` with a clean, descriptive message, and verify the build before moving on.

```
P0  Research            → cohesion map + deep-dive plan        [◐ running now]
P1  Foundations         → master temperature/material/uniform systems, palette, post-FX spine
P2  Home — the Pour     → channels + pour + letterform fill + A/E divine fire + camera path
P3  Copy + sales journey→ brand.js reorder, hero reframe, trust ladder, pricing tease/removal
P4  /pricing page       → tabbed flagship-first, anchors, decoy tiers, de-risk
P5  Chambers (flagship) → Voice scrying pool, then Contact, About
P6  Chambers (rest)     → Software, Automations, Web, Work, Pricing-ledger, Stub
P7  Perf + polish + QA  → iPhone-15 budget, reduced-motion, prerender/SEO, deploy-doctor
```

Guiding rule: **never let a frame ship that makes the message harder to read.** Awe serves copy.

---

## P0 · RESEARCH  [◐ in flight]
- ☑ Read full codebase, copy deck, scene setup, pricing/high-ticket/dark-lever research.
- ☑ Lock concept, arc, world, per-page chambers, typography/interaction, pricing, sales journey.
- ☑ Write the 3 planning docs (this file, DESIGN-BRIEF, RESEARCH).
- ◐ **Graphics research workflow** — Phase 1 broad sweep (33 topics, 2025-2026 sources) + synthesis
  cohesion map + deep-dive plan. *(Background workflow `wf_ed6b6f20-e63`.)*
- ☐ Phase 2 deep dives → push to 500+ pages; narrow to the exact techniques we'll build.
- ☐ Final WebGPU/TSL vs WebGL2+ShaderMaterial decision.

## P1 · FOUNDATIONS (shared systems — build once, used everywhere)
- ☐ **Master temperature system** — one `uTemperature`/per-fragment temp driving emissive color +
  intensity via the blackbody curve. The single source the whole world shares.
- ☐ **Blackbody color LUT/function** — Kelvin→RGB, white-hot→orange→forge-red→black, HDR for bloom.
- ☐ **Shared noise basis** — FBM / curl / domain-warp module reused by molten, embers, shimmer.
- ☐ **Master uniforms bus** — `time, temperature, heat, pointer, scrollProgress` on the forge store;
  extend `src/store.js` / the existing `forge` object.
- ☐ **Basalt material** (green-black Irish, triplanar, carve-ready) — shared stone shader.
- ☐ **Forged-iron material** (cooled-letter surface, fire-scale, ember veins).
- ☐ **Molten-metal material** (viscous surface, flow, fresnel hot-rim).
- ☐ **Post-FX spine** — EffectComposer order: emissive bloom → heat-haze → chromatic ab → grade →
  vignette → grain; OLED tone-map (ACES/AgX). Evolve `src/scene/Effects.jsx`.
- ☐ **Procedural IBL** — keep the no-EXR Lightformer pattern; warm forge env.
- ☐ **Quality tiers** — high / low / static + reduced-motion, wired to every new system.

## P2 · HOME — THE POUR JOURNEY (the centerpiece)
- ☐ **Celtic interlace channel geometry** — winding/branching/rejoining grooves carved in basalt;
  the four-branch fork-and-rejoin for the Arsenal.
- ☐ **The pour** — directed flow-map advection along the channels + falling stream (ribbon/trail),
  white-hot leading edge cooling as it travels.
- ☐ **Scroll-driven camera path** — CatmullRom through the forge, Lenis-linked, damped; overhead→
  eye-level descent for the finale.
- ☐ **3D GAELWORX letterforms** — Cinzel extruded geometry (or SDF), UVs for fill.
- ☐ **Per-letter progressive fill** — G→A→E→L→W→O→R→X, each its own fillProgress + temp timeline;
  thin strokes fast, thick strokes slow.
- ☐ **Cooling per letter** — skin-over to iron + ember veins, EXCEPT the permanent-hot mask.
- ☐ **A+E divine fire** — white-gold emissive that never cools + **light bleed** onto neighbours +
  reveal of carved Ogham.
- ☐ **Heat shimmer** — localized refraction pass over hot regions.
- ☐ **Living sparks** — GPU particles orbiting the pour front (curl-noise heat attraction).
- ☐ **"Automatic Execution" crystallize-in** beneath the cast word (A matches the white-gold).
- ☐ **Typography-from-the-pour** — home copy forming in metal as the flow fills channels.
- ☐ Hook the home frames (`src/ui/Content.jsx`) to the new scene state; retire the old slab-only bg.

## P3 · COPY + SALES JOURNEY (brand.js + Content.jsx)
- ☐ **Hero reframe** — "Your business doesn't need artificial intelligence. It needs Automatic
  Execution." (keep ignite on Automatic/Execution).
- ☐ **Enemy interstitial** — "Most agencies bill for motion. We bill for execution…"
- ☐ **Clan** — identity-first reorder + explicit enterprise credibility (Claude/Gemini/enterprise).
- ☐ **Arsenal** — reorder **Voice first**; each card pain-first; keep `from $X` tease ONLY.
- ☐ **Trust ladder** — sharpen all 5 rungs (enterprise ground rung 2 stays); add Monday future-pace.
- ☐ **REMOVE the home rates beat** frame entirely (`frame--rates` in Content.jsx + RATES logic).
- ☐ **Finale** — "Point the sword. We take care of the rest." + scarcity line ("We take 2 builds a
  quarter. That's not a line — it's how we hold the standard.") + secondary CTAs
  (See how it works → /about; Full pricing → /pricing).
- ☐ Re-balance scroll WEIGHTS after removing the rates frame (Content.jsx pacing).

## P4 · /PRICING PAGE (full reveal lives here)
- ☐ **Tabbed layout** — Software (1st, anchor) · **Voice (★Recommended)** · Automations · Web.
- ☐ Per-tab **anchor → tiers (decoy middle highlighted via molten-edge) → de-risk → CTA**.
- ☐ Wire the REVISED anchor numbers (authoritative in `PRICING.md`, 2026-06-30): Software
  **$15k/$30k/$50k, 25% deposit**; Voice **outbound hybrid** ($2,500 setup + $699/mo/agent +
  $0.30/min overage + $50/booked appt); Automations **$2,500–$7,500 + $500–1,500/mo care**; Web
  **$1,499/$4,999/$9,999+ + $49–99/mo Forge Care**.
- ☐ Build the **Forge Care** recurring plans into `/pricing` (web + automations) — the annuity line.
- ☐ Set up the reusable **Cloudflare protection connector** (templated zone: SSL Full Strict, WAF,
  bot, rate-limit) + CF Pages hosting boilerplate so web margin holds at scale.
- ☐ The **Stone Ledger** 3D chamber behind it (prices feel cut in stone).
- ☐ Keep FAQPage schema / prerender intact for `/pricing`.

## P5 · CHAMBERS — FLAGSHIP FIRST
- ☐ **Voice — Scrying Pool** ★ — pool water shader, Ogham rim, sub-surface ember glow, sine-wave
  voice ripples, quiet atmosphere. (The flagship inner page — get it perfect.)
- ☐ **Contact — Forge Mouth** — stone arch, "Name the bottleneck." carved keystone, interior glow,
  copy revealed by approach; lead-capture form (existing) restyled into the arch.
- ☐ **About — Altar Approach** — stand before the altar; copy reacts to altar glow; dark cast word.

## P6 · CHAMBERS — REMAINDER
- ☐ **Software — Casting Room** (orbiting cast, knotwork-circuit surface).
- ☐ **Automations — Channel Hall** (top-down parallel streams).
- ☐ **Web — Jewel Chamber** (evolve FacetedJewel; dispersion under ember-light).
- ☐ **Work — Four Plinths** (YardWorx/RepairWorx/SalesWorx/AgentWorx casts; each a software synopsis).
- ☐ **Pricing — Stone Ledger** (shared with P4).
- ☐ **StubPage / 404** — minimal forge-void treatment.

## P7 · PERFORMANCE, POLISH, QA, SHIP
- ☐ iPhone-15 OLED perf pass — draw calls, particle counts, RT resolution, AdaptiveDpr, 60fps/INP.
- ☐ Reduced-motion + static-quality path for every chamber.
- ☐ Prerender / sitemap / per-route head + JSON-LD still valid (run aeo-geo checks).
- ☐ Brand-check pass (ignite rule, type, palette, 0px corners) on all new UI.
- ☐ `deploy-doctor` + verify on real device; push to `main` only when green.

---

## KNOWN DEPENDENCIES / ORDER NOTES
- P2 depends on P1 (temperature + materials + camera + post-FX must exist first).
- P3 copy can proceed in **parallel** with P1/P2 (no 3D dependency) — good early win.
- `/pricing` (P4) and the home pricing **removal** (P3) must land together so pricing only lives
  where it should.
- All chambers (P5/P6) reuse the P1 shared systems — do **not** fork per-chamber shaders; configure.

## DECISIONS STILL OWED BY THE USER
- ☑ **Scarcity number — LOCKED: 2 builds per quarter.**
- ☐ Lead-tracking stack choice (nurture window).
- ☐ The altar **Ogham inscription** line.
- ☐ Go/no-go on WebGPU+TSL vs WebGL2 (will recommend after P0 Phase 2).
