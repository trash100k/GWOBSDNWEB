---
name: post-fx
description: >-
  Tune the GAELWORX post-processing finish + lighting grade — bloom, chromatic
  aberration, color grade, vignette, grain, AA. Use when the scene looks flat,
  washed, too dark/bright, the glow is wrong, or you're adding/adjusting an effect
  in the composer. Encodes the "only HDR blooms" rule, the warm crushed-black
  grade, the ACES pipeline, and the quality gating.
---

# post-fx — the cinematic finish (EffectComposer)

The look is finished in `src/scene/Effects.jsx` (a `@react-three/postprocessing` chain) on top of the
`ACESFilmicToneMapping` set on the Canvas (`src/scene/ForgeCanvas.jsx`). Order matters; keep it:
**Bloom → ChromaticAberration → HueSaturation → BrightnessContrast → Vignette → Noise(grain) → SMAA.**

## The rule that makes it read: only HDR blooms
`<Bloom luminanceThreshold={0.55} mipmapBlur intensity={…} radius={0.8} />`. The threshold means **only
bright pixels (HDR > 1) bloom** — which is exactly why the palette (`src/scene/palette.js`) reserves
`>1` values (`PAL.hot`, `PAL.emberHot`) for the 10% accent and the vein cores. If something that should
glow doesn't: push its emissive **above 1** in the shader (`shader-fx`), don't crank bloom intensity
(that blooms everything → washed). `mipmapBlur` = cheap wide bloom.

## The grade (keep the obsidian deep)
- `BrightnessContrast brightness={-0.04} contrast={0.16}` — **crushed blacks** so the void stays true
  black on the OLED (the judge device) and the fire pops.
- `HueSaturation saturation={0.12}` — a touch richer, not garish.
- `Vignette darkness={0.96} offset={0.22}` — pulls the eye to center.
- `Noise blendFunction=SOFT_LIGHT opacity≈0.05` — the "imperfect by design" grain; keep it subtle.
- `ChromaticAberration` (tiny offset) — refraction-edge realism; **high tier only**.

## Quality gating (perf)
`multisampling={high?2:0}`, `disableNormalPass`, and aberration + `SMAA` only on `high`. The whole
`<Effects>` is **not mounted when `quality==='static'`** (ForgeCanvas gates it) and the frameloop is
`demand` there — so reduced-motion/low-power gets no post cost. Honor `useQuality`.

## Lighting it's grading
Bloom only catches what the lighting + shader emit. The env is built from **drei `<Lightformer>`s, NOT a
loaded EXR/HDR** (loading one black-canvas'd us — see `forge-scene`); warm key + ember rim. If the scene
reads flat, fix the lightformers/emissive first, then the grade.

## Verify
`qa-route` (0 console errors @ both viewports — a bad effect import/param throws) + **device read**:
bloom spread, true-black, and OLED saturation don't simulate in the headless shot. Tune from the iPhone.
Cross-refs: `shader-fx` (where the HDR emissive comes from), `forge-scene` (env + quality tiers),
`motion-feel` (don't animate heavy blur on large surfaces).
