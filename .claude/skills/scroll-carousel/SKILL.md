---
name: scroll-carousel
description: >-
  Build or fix the scroll-driven 3D services carousel (the vertical wheel /
  coverflow). Use when carousel items read weird, are illegible at the top/bottom,
  the anchoring feels off, items never settle, or you're adding a new scroll-scrubbed
  selector. Encodes discrete anchor dwells, crisp-front + faded-peek falloff, the
  edge-on trap, the spacing knobs, and the QA-sampling gotcha.
---

# scroll-carousel — anchor each item face-on, kill the edge-on mush

Grounded in the arsenal wheel fix (`src/ui/Content.jsx` carousel block ~:183-205;
`.carousel`/`.car-item` styles). The wheel maps scroll → `branchF`, and each item renders at
`rotateX(-off·STEP) translateZ(RADIUS) scale(...)`, `off = j - branchF`.

## The two failure modes (both were live)
1. **Edge-on illegibility.** Items >1 step from front tilt toward 90° → unreadable slivers at the
   top/bottom. Fix: **hide them** (sharp opacity falloff), don't render edge-on.
2. **Forever mid-rotation.** Linear `branchF` means nothing ever sits face-on — the wheel is always
   between items. Fix: **anchor points**.

## Anchor points (the core fix)
Snap the fractional part of `branchF` so each item **dwells face-on** for the bulk of its segment, then
snaps quickly across the gap:
```js
const raw = clamp((dA + SPAN) / (2*SPAN), 0, 1) * (BR - 1)
const fl = Math.floor(raw), fr = raw - fl
const snapped = fr < 0.34 ? 0 : fr > 0.66 ? 1 : smooth((fr - 0.34) / 0.32)
const branchF = Math.min(fl + snapped, BR - 1)
```
At a dwell, the front item is exactly `rotateX(0)` at full opacity — DOM-verified `op=1 rotX=0`.

## Crisp front, subordinate peeks
- opacity `clamp(1.16 - aoff·0.92, 0, 1)` → front 1, ±1 ~0.24, ±2 hidden.
- `scale = max(0.7, 1 - aoff·0.16)` (neighbours recede, smaller).
- blur **only on peeks**: `aoff < 0.45 ? 0 : min((aoff-0.45)·4, 6)` — the front stays crisp.
- `is-front = aoff < 0.5` (lights the ember styling + enables pointer events when the frame is active).

## Spacing knobs
`RADIUS` (≈232), `STEP` (≈46°), carousel height (`clamp(348px,56vh,476px)` / mobile `366-486`),
and `perspective-origin:50% 50%` so the front anchors dead-center. Bigger radius/height + scale-down =
breathing room.

## QA-sampling gotcha (don't false-FAIL)
The arsenal **frame-center** often maps to a transition, not a dwell — e.g. `BR=4` →
`branchF=1.5` (between services) at `p=CENTER`. Probe the anchoring **at dwell positions**
(p≈0.205/0.234/0.261), not the center, or you'll read a mid-rotation state and think it's broken. The
invariant to assert: exactly **1** `is-front`, `rotX≈0`, `op≈1`, max-neighbour-opacity `<0.5`.

## Verify
`qa-route` (0 console errors @ both viewports) + the dwell-position DOM probe above + device read. The
overall scroll rhythm is `tune-pacing`'s job; this is just the wheel.
