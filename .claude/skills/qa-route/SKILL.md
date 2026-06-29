---
name: qa-route
description: >-
  Verify a GAELWORX route/change the image-free way — build, then drive it with
  Playwright at the two judge viewports and assert ZERO console errors, plus DOM
  probes for the things that actually break (canvas alive, Lenis active, content
  present). Use after any UI/scene/content change, before committing, or whenever
  you need to confirm a route works without pasting screenshots into chat.
---

# qa-route — prove it works without images

The owner asked to **stop putting screenshots in chat**, and a heavy WebGL SPA can *look* fine while
the console is on fire. So QA here = **build + 0 console errors at both viewports + targeted DOM
probes**, not eyeballing PNGs.

## The two viewports (always both)
- **393×852** — iPhone 15, the primary judge (OLED, touch).
- **1440×900** — desktop.

## The harness
`scripts/shot.mjs` already does the heavy lifting — spawns `vite preview` on a **random port**
(parallel-safe), loads the route, waits for `document.fonts.ready`, screenshots full-page, and
**prints the console-error count + first errors**. The screenshot is a side effect; **the number
that matters is `console errors: 0`.**

```
npm run build                                   # MUST be green (includes prerender)
node scripts/shot.mjs /web scratchpad/w-m.png 393 852 full
node scripts/shot.mjs /web scratchpad/w-d.png 1440 900 full
# pass = "console errors: 0" on both
```
`scratchpad/` is gitignored. Don't Read the PNGs into chat — report the counts.

## DOM probes (catch the silent failures)
For anything risky, assert structure in `page.evaluate(...)` instead of trusting a screenshot:
- **3D alive:** a `<canvas>` exists, has non-zero size, and we're **not stuck on the fallback**
  (`.canvas-fallback` shouldn't be the only thing painted). GLSL typos surface as console errors
  because CI uses SwiftShader (software GL) — so 0 errors ≈ shaders compiled.
- **Scroll alive:** `document.documentElement.classList.contains('lenis')` (Lenis mounted) and the
  `.scroll-track` height is the expected `TOTAL*100vh` on `/`.
- **Content present (SEO/no-JS):** the prerendered `#root .seo` block exists with the route's real
  copy/prices before hydration; after hydration the live UI replaces it.
- **Reveal/active state:** `.is-active` / `.shown` toggles where expected.

## Pass criteria
✅ `npm run build` green ✅ `console errors: 0` @ 393×852 **and** 1440×900 ✅ relevant DOM probes
pass ✅ `/` unchanged when it shouldn't change. Only then commit.

## Gotchas
- `prefers-reduced-motion` path renders static end-states — don't assert animated transforms under it.
- `networkidle` + a short `waitForTimeout` lets fonts/3D settle; the harness already does this.
- Build is `vite build && node scripts/prerender.mjs` — a prerender failure fails the gate too.
