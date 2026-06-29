# GAELWORX skills

Reusable, codebase-grounded playbooks for the recurring work on this site. Each is a
`SKILL.md` that Claude Code auto-invokes when its `description` matches what you're doing
(or call it explicitly: `/skill-name`). They encode hard-won, project-specific knowledge so
it stops being re-derived every session.

| Skill | Use it when | Grounded in |
|---|---|---|
| **`brand-check`** | Adding/editing UI or copy; a change looks off-brand. Enforces `CLAUDE.md` — A+E ignite scope, type system, palette tokens, 0px brutalism, Clan voice. | `CLAUDE.md`, `Ignite.jsx`, `BrandText.jsx`, `ForgeText.jsx`, `styles.js` |
| **`motion-feel`** | Adding/reviewing ANY animation — reveals, hovers, CTAs, nav. Brutalist Snap / Forge Reveal / Drift; durations, easing, blur budget, compositor + reduced-motion discipline. | `CLAUDE.md` Motion Laws, `pacing-*` research |
| **`tune-pacing`** | The home scroll feels off / draggy / mushy / janky / jumpy. The knob table, the `transit:rest` formula, the measure→one-knob→verify-on-iPhone loop. | `Content.jsx`, `ForgeExperience.jsx`, `pacing-motion-deep-dive.md` |
| **`forge-scene`** | Give a route its own 3D world, or fix a dark/janky scene. Single-renderer, dt-damped route presets, quality tiers, the WebGL scars (no EXR, decoupled Suspense, dispose). | `ForgeCanvas.jsx`, `scenes.js`, `ObsidianSlab.jsx`, `CameraRig.jsx`, `palette.js` |
| **`qa-route`** | Verify a route/change without pasting screenshots — build + 0 console errors @ both viewports + DOM probes. | `scripts/shot.mjs`, `package.json` build |
| **`ship`** | Deploy to production + confirm it's live. Production = `main` only; verify through the Vercel MCP (the sandbox 403s `*.vercel.app`). Owner-gated. | `vercel.json`, Vercel MCP, today's deploy lesson |
| **`add-route`** | Adding a new page end-to-end — ROUTES row → PageShell page → App.jsx route → scenes.js preset → prerender/sitemap/Nav. Notes the silent half-wired traps. | `routes.js`, `App.jsx`, `prerender.mjs`, `Nav.jsx` |
| **`kinetic-type`** | Adding an animated/ignited heading or wordmark — which component (ForgeText/Ignite/BrandText) + the forge-glow + etch reveal. The *mechanics* (the *rule* is `brand-check`). | `ForgeText.jsx`, `Ignite.jsx`, `BrandText.jsx`, `styles.js` |
| **`aeo-geo`** | Making a page extractable/citable by AI answer engines — FAQPage + entity/NAP + per-page schema + `llms.txt`, verified in `dist/`. | `prerender.mjs`, `routes.js`, `brand.js` |
| **`lead-capture`** | Turning the dead CTAs into a real conversion path — form → store → confirm → analytics. Kills the two dead `strike()` CTAs in the home journey. | `Contact.jsx`, `Content.jsx` CTAs, `BUILD_PLAN.md` Phase 2 |

## Conventions
- **Source of truth:** `CLAUDE.md` (brand) + `docs/research/*` (strategy/pacing/perf). Skills point
  at these, they don't duplicate them.
- **Verify before commit:** `qa-route` (build green + 0 console errors @ 393×852 + 1440×900).
- **Develop on the feature branch; promote to `main` only on owner OK** (see `ship`).
- **The iPhone 15 OLED is the final judge** — transmission, true-black, touch, and bloom don't
  simulate; the owner's on-device read is the verdict.

## Add a skill
New dir `.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description` — write the
description as *when to use it*), then add a row above. Keep it grounded in real `file:line`, short,
and procedural (a checklist + a verify step), not a sermon.
