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
