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
