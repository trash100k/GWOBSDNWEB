---
name: deploy-doctor
description: >-
  Diagnose "production isn't updating / is it live? / deploy is stuck" on the
  GAELWORX Vercel project. Use when a push doesn't show up on the live site, prod
  looks stale, or you're unsure whether something deployed. Encodes the full
  diagnostic tree learned the hard way: where the commits actually are, stale-vs-
  paused, proving old-vs-new build, the branch-preview-builds-but-main-drops
  signature, what you CAN'T do from the sandbox, and the owner-side unblock.
---

# deploy-doctor — when prod won't update

The happy-path deploy lives in `ship`. This is for when it's **stuck**. Project IDs:
`prj_cID49n8lg0Xk1mb64XZzWl3iD8nl` · team `team_idbwSaFyZUE7bS5MLJsl76DL`.

## Diagnose in this order (don't skip — we wasted hours guessing)
1. **Does GitHub actually have the commit?** The git remote is a **local proxy mirror**, so
   `git ls-remote` shows the mirror, not necessarily github.com. Confirm with
   `mcp__github__list_commits(owner:"trash100k", repo:"GWOBSDNWEB", sha:"main", perPage:1)`. If
   GitHub `main` = your SHA, the push is fine — the problem is Vercel, not git. (We mis-blamed git first.)
2. **What does Vercel have?** `mcp__Vercel__list_deployments(projectId, teamId)`. Note the newest
   `target:"production"` vs `target:null` (preview), and the `state`. `since:<ms>` filters.
3. **Stale vs paused?** The sandbox **403s every `*.vercel.app`** — fetch prod through the authed MCP:
   `mcp__Vercel__web_fetch_vercel_url("https://gwobsdnweb.vercel.app/")`.
   - **200 + old content = stale** (deploys not running) — NOT paused.
   - **503 DEPLOYMENT_PAUSED = paused** (Settings/spend). The project `live:false` flag is ambiguous —
     don't conclude "paused/limit" from it; use the 503-vs-200 test.
4. **Prove old-vs-new build** (don't trust "it deployed"): the entry bundle hash changes with any source
   edit (a single monolithic `index-*.js` = pre-code-split old build; current emits split
   `three`/`r3f`/`lenis` chunks). Or fetch a marker that only exists in the new build —
   **`/llms.txt`**: real `text/plain` = new build; SPA-fallback HTML = stale.

## The signature we hit: previews build, production drops
Vercel **coalesces rapid pushes** (builds only the latest branch commit, skips intermediates) and the
**`main`/production webhook can get dropped during a push storm** — so branch previews build in ~12s
while `main` produces **zero** production deployments. Five `main` pushes created nothing.

## Levers (and the hard limits)
- An **isolated** `main` push can build in ~2s when healthy — but **re-pushing repeatedly FEEDS the
  coalescing**; don't spam it (it won't help and litters history — see `git-hygiene`).
- **You cannot force a deploy from this sandbox:** no `VERCEL_TOKEN`, network 403s `api.vercel.com`,
  and the Vercel MCP is **read-only** (no redeploy/unpause/trigger tool; `deploy_to_vercel` only
  returns CLI text). Say so plainly instead of pretending.
- **Owner-side unblock:** `vercel --prod` from the repo, OR Settings → Git → **disconnect/reconnect**
  (resets a stalled webhook), OR dashboard **Redeploy** the latest `main`.

## Let the owner SEE it while prod is stuck (the unlock)
**Branch previews still build.** The branch alias
`gwobsdnweb-git-<branch-slug>-zach-1373s-projects.vercel.app` serves the latest branch commit; the
owner (logged into Vercel) opens it on their phone to judge the work. Verify it carries the change via
`web_fetch_vercel_url(... + "/llms.txt")` or the bundle hash. This is how we shipped a reviewable build
without production.

## Done =
You can state, with evidence: where the commit is (GitHub), what prod serves (old/new, by a marker),
why (stale/paused/dropped), and the exact next lever (owner reconnect / CLI, or a working preview URL).
