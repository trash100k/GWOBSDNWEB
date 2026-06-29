---
name: tune-pacing
description: >-
  Diagnose and tune the GAELWORX home scroll-jack pacing & movement — the
  recurring "feels off / draggy / slow / mushy / janky" problem. Use whenever the
  user says the scroll, pacing, movement, or transitions feel wrong, or asks to
  retune the journey rhythm. Encodes the measurement-first loop, the exact knobs
  (Lenis · WEIGHTS · HOLD/FADE · easing · blur · parallax), and the Brutalist-Snap
  brand constraint, so tuning stops being whack-a-mole.
---

# tune-pacing — make the home journey feel right

The home (`/`) is a **fixed-pin scrub**: `.stage` is `position:fixed`, a `.scroll-track`
of `TOTAL*100vh` supplies scroll length, and one rAF in **`src/ui/Content.jsx`** reads
`window.scrollY → p∈[0,1]` and drives every frame's opacity/transform/blur. Read
`docs/research/pacing-motion-deep-dive.md` first — it has the full map and the diagnosis.

## Rule 0 — the judge device is the iPhone 15, and it does NOT use Lenis
`src/ForgeExperience.jsx` creates `new Lenis({ lerp, smoothWheel })` with `syncTouch` at its
**`false`** default → **touch scroll is native, not Lenis.** So **Lenis tuning only changes
desktop.** If the complaint is about a phone, fix the *choreography*, not Lenis. Never claim
"pacing fixed" from a desktop sim — only an on-device read counts.

## The knobs (and what each one actually does)
| Symptom | Knob | File | Direction |
|---|---|---|---|
| Mushy, "nothing lands", half-faded | `HOLD` / `FADE` | `Content.jsx:47-48` | **HOLD↑, FADE↓** → frames dwell crisp, hand off fast |
| Smeary, laggy, blurry transitions | entry `blur` | `Content.jsx:106,111` (+ `:176`) | **↓ to 6–12px**, resolve in first third of transit |
| Arrivals feel soft / undecided | incoming easing | `Content.jsx:15,165` | ease-out **quart/expo**, asymmetric (snap in, drift out) |
| An act feels rushed or draggy | `WEIGHTS` | `Content.jsx:34` | rebalance weight×100vh; keep total ≈ 9–11 screens |
| Desktop wheel floats/drifts | Lenis `lerp` | `ForgeExperience.jsx:78` | **0.1→~0.14** (or `duration:0.9`+`easeOutExpo`) |
| Parallax lags a beat behind | pointer lerp | `Content.jsx:141-142` | **0.06→~0.11** |
| Programmatic scroll jumps/fights | `window.scrollTo` | `Content.jsx:117-126` | route through `forge.lenis.scrollTo`; drop `scroll-behavior:smooth` (`styles.js:21`) |

## The one number that predicts the feel
`transit:rest = (FADE − HOLD) / (2 · HOLD)`. Current `(1.4−0.5)/1.0 = 1.8` → **mostly
mid-dissolve**. **Target < 1.0** (rest-dominant). Compute it before and after any HOLD/FADE edit.

## Procedure
1. **Reproduce + locate.** Get the exact gripe (which act? draggy vs mushy vs janky vs jumpy?
   wheel or touch?). Map it to a row above. Don't touch unrelated knobs.
2. **Measure, don't feel** (desktop is fine for *numbers*): `npm run build`, then a Playwright
   scrub at 393×852 that drives scroll top→bottom, samples `p`/dt, and logs max frame time.
   **Fail > 20ms/frame.** Print the transit:rest ratio.
3. **Change one variable**, with the starting values from the deep-dive's fix list (P1→P6 in
   priority). Keep `transform`/`opacity`/`filter`-only; keep `prefers-reduced-motion` paths intact
   (`reduced` branch in `Content.jsx`).
4. **Verify:** build green · 0 console errors @ both viewports · ratio < 1.0 · frame time ok.
5. **Ship for the real verdict:** commit, push to **`main`** (production builds from main — branch
   pushes only preview, and previews aren't reliably building), and have the owner read it on the
   **iPhone 15**. Record the value that felt right back into `pacing-motion-deep-dive.md`.
6. **Iterate one knob at a time.** Resist changing five numbers at once — that's how it became
   whack-a-mole.

## Brand guardrail (non-negotiable, `CLAUDE.md`)
Brutalist Snap: arrivals are **decisive — 0ms delay, ease-out, no bounce, only impact.** Fluidity
(the glide) and Snap (the landing) **layer**; they don't replace each other. If a change makes
everything softer/floatier, it's wrong even if "smoother". The scrub glides; the content lands hard.
