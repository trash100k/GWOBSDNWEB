---
name: ship
description: >-
  Deploy GAELWORX to production on Vercel and verify it actually went live. Use
  when the user says deploy / ship / push it live / "make it live", or when prod
  looks stale. Encodes the one fact that cost a long detour: production builds from
  `main` only, branch pushes make previews that don't reliably build, and the
  sandbox can't reach *.vercel.app directly — so you verify through the Vercel MCP.
---

# ship — get it live on prod, and prove it

## The core fact (learned the hard way)
**Production deploys from the `main` branch only.** Pushing to the feature branch
(`claude/gaelworx-obsidian-hero-rrr9xo`) creates *preview* deployments — and those **stopped
firing reliably**, so work sat un-deployed while `main` showed the latest SHA but no production
build had run. A real `git push … main` triggers a production build in **~2–3s** (≈12s total).
If prod looks stale: it's almost never an account pause/limit — it's that **`main` didn't get a
fresh push**. Re-push `main`.

## Guardrail — production is owner-gated
Deploy to prod **only on explicit owner approval** (a "deploy"/"ship"/"push it live"). The harness
auto-classifier also blocks unapproved pushes to `main`. Develop on the feature branch; promote to
`main` only when told. One milestone, one OK.

## Deploy
```bash
# from the up-to-date feature branch (all real code already committed there)
git push origin HEAD:main      # fast-forwards main → triggers the production build
```
Retry network failures up to 4× with backoff (2/4/8/16s). `vercel.json` already pins
framework=vite, build=`npm run build` (vite build + prerender), output=`dist`, SPA rewrite — don't
add a `.vercel` dir or change those.

## Verify it actually went live (you CANNOT curl the site here)
This sandbox's network policy **403s every `*.vercel.app` / `api.vercel.com`** request, and there's
no `VERCEL_TOKEN`. The **Vercel MCP is authenticated** — use it:

- **Project / team IDs:** project `gwobsdnweb` = `prj_cID49n8lg0Xk1mb64XZzWl3iD8nl`,
  team `team_idbwSaFyZUE7bS5MLJsl76DL`.
- **Watch the build:** `mcp__Vercel__list_deployments(projectId, teamId)` → newest should be your
  `main` SHA, `target:"production"`, `state` BUILDING→READY. `get_deployment(idOrUrl, teamId)` for detail.
- **Confirm the LIVE bytes (not a cache):** `mcp__Vercel__web_fetch_vercel_url("https://gwobsdnweb.vercel.app/")`
  — this routes through Vercel's authed channel and bypasses the 403. **Diff the build, don't trust
  "it deployed":** check the entry hash `/assets/index-*.js` changed, or fetch a route whose content
  you changed. (A single monolithic `index-*.js` = an old pre-code-split build; the current build
  emits split `three`/`r3f`/`lenis` chunks with `modulepreload`.)
- A **paused** project returns **503 DEPLOYMENT_PAUSED**; *stale-but-200* means it simply didn't
  rebuild — re-push `main`. Don't diagnose a "limit/pause" until you've confirmed a fresh `main`
  push produced **zero** new deployments.

## There is no redeploy/unpause tool here
The Vercel MCP is read-only + `deploy_to_vercel` (which only returns CLI instructions). You cannot
unpause or force-redeploy from the sandbox. The lever is the `git push … main` above; anything else
(pause/spend/limit) is an owner action in the dashboard (`vercel.com/zach-1373s-projects/gwobsdnweb`).

## Done =
New production deployment READY for the `main` SHA · `web_fetch_vercel_url` shows the changed
bytes · owner reads it on the iPhone 15.
