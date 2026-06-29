---
name: add-route
description: >-
  Add a new page/route to GAELWORX end-to-end so it's fully wired — in the ROUTES
  table, built on PageShell/Section with copy from brand.js, routed in App.jsx (and
  retired from the catch-all), given its own 3D world in scenes.js, and confirmed to
  emit prerendered static HTML (title/desc/canonical/OG/JSON-LD) plus a sitemap.xml
  entry and a Nav link. Use whenever the user wants a brand-new page/section/URL,
  not a tweak to an existing one. Encodes the single-source-of-truth wiring so the
  route can't ship half-connected (indexable but unrouted, or routed but invisible).
---

# add-route — one route, fully forged and reachable

**`src/routes.js` `ROUTES` is the single source** the router, Nav, prerender, sitemap, and per-route
SEO `<head>` all read. Add a route there and most wiring fans out for free — but the page component
and its App.jsx route are still manual, and a row in ROUTES without a real component will silently
fall through to the catch-all `StubPage`. Do all five steps or the route ships half-connected.

## What's already automatic once the ROUTES row exists
- **Nav menu** maps `ROUTES` directly (`src/ui/Nav.jsx:70`) — new link appears, numbered, no edit.
- **Prerender** loops `ROUTES` → `dist/<route>/index.html` (`scripts/prerender.mjs:171-176`) with
  per-route `<title>`/`<meta description>` (`:163-164`), `canonical`/OG/Twitter/JSON-LD via
  `seoHead`+`ldjson` (`:81-98`, `:47-79`), and the crawlable `.seo` content block (`:115-156`).
- **sitemap.xml + robots.txt** loop `ROUTES` too (`:186-191`, `:180-183`), base `SITE` const at `:30`.
- **Scene wiring** reads `forge.route` (set from `pathname` at `src/ForgeExperience.jsx:53`) →
  `sceneFor(path)` (`src/scene/scenes.js:27`), which **falls back to `SCENES['/']`** if you forget a row.

## Procedure
1. **Add the ROUTES row** — `src/routes.js`, append to `ROUTES` (`:6-61`):
   `{ path: '/foo', label: 'Foo', title: '… — GAELWORX', desc: '…' }`. `title`/`desc` are the real
   SEO tags; keep brand voice (run `brand-check`). This alone lights up Nav, sitemap, robots, and
   the generic prerender body+head.
2. **Build the page component** — `src/pages/Foo.jsx`, on the shared template: `PageShell`
   (`kicker`/`title`/`lede`, `src/ui/PageShell.jsx:16`) wrapping `Section` children
   (`src/ui/Section.jsx:16`). Pull copy from `COPY` in `src/brand.js` (don't hardcode); bespoke
   craft goes in namespaced `.pg-foo-*` CSS inside the component (pattern: `src/pages/Web.jsx`).
   `<BrandText>` auto-ignites brand nouns — never hand-write the A+E (see `brand-check`).
3. **Route it in App.jsx** — `src/App.jsx`: `import Foo` and add `<Route path="/foo" element={<Foo />} />`
   inside the `<ForgeExperience>` parent, **above** the `<Route path="*" element={<StubPage />} />`
   catch-all (`:31`). Until you do this the path renders the `StubPage` placeholder, not your page.
4. **Give it a 3D world** — `src/scene/scenes.js`: add a `SCENES['/foo']` preset row so the forge
   re-tempers for the page instead of falling back to the home look. **Mechanics, knobs, perf,
   and the bespoke-element path are owned by the `forge-scene` skill — defer to it; don't duplicate.**
5. **Prerender + custom body (optional)** — `scripts/prerender.mjs` `body()` (`:115-156`) has a
   generic fallback (`:155`, H1=label + desc) that works with zero edits. Only add a `if (p === '/foo')`
   branch here if the route needs richer indexable copy than label+desc.

## Done / Verify
- `npm run build` green (it runs `node scripts/prerender.mjs`; a prerender throw fails the gate).
- **Static HTML correct** — `dist/foo/index.html` exists with your `<title>`, `<meta description>`,
  `<link rel=canonical href="…/foo">`, OG/Twitter tags, the JSON-LD `<script>`, and the `.seo`
  content block. `dist/sitemap.xml` includes `<loc>…/foo</loc>`.
- **Reachable + live** — `/foo` is in the Nav overlay and renders **your component** (not StubPage),
  and the obsidian scene reads distinct from `/`.
- **Run `qa-route`** — build green + **0 console errors** @ **393×852** and **1440×900**, DOM probes
  (canvas alive, Lenis active, `.seo` content present) pass, and **`/` is byte-unchanged**. Only then commit.

## Gotchas
- **Row but no component** → falls through to `StubPage` (looks "done" in Nav, isn't your page).
- **Component but no row** → unrouted, un-prerendered, no sitemap/Nav/scene; the SPA-only path 404s
  for crawlers. The ROUTES row is the load-bearing step.
- **Trailing slash / nesting** — paths are flat strings keyed everywhere (`scenes.js`, prerender
  `dist/<path>/index.html`); match the existing single-segment `'/foo'` shape.
- New page must obey the brand source-of-truth — 0px corners, hard borders, Cinzel display, the
  ignite rule. Run `brand-check` on the copy and `motion-feel` on any animation before `qa-route`.
