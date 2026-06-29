# Research: the Vercel Hobby deploy issue (production drops, previews build)

> Why `gwobsdnweb` production stopped updating from `main` while branch previews kept
> building. Root cause is the **Hobby plan's deploy limits** colliding with this session's
> deploy volume. Pairs with the `deploy-doctor` skill.

## Symptom (what we saw)
- GitHub `main` is current; the build is green; QA passes.
- **Zero production deployments** created for 5+ `main` pushes (incl. an isolated empty commit and a
  force-push) — not even queued records.
- **Branch previews DO build**, but **delayed ~10–19 min** and **coalesced** (Vercel built `fb2f5ce`
  then `16a0bea`, silently skipping the commits in between).
- Production serves **200 with stale content** (old bundle `index-BnJhKFIs.js`, no `/llms.txt`) — NOT
  a 503, so it's not "paused."

## Root cause — Hobby plan limits
Documented Hobby limits ([vercel.com/docs/limits](https://vercel.com/docs/limits),
[plans/hobby](https://vercel.com/docs/plans/hobby)):
- **100 deployments per 86,400s (1 day).** Hit it → no new deploys until the window rolls.
- **1 concurrent build** (Pro = 12). Builds run **serially through a queue**.
- Preview deployment for every Git push is included.

Build-queue mechanics ([builds/managing-builds](https://vercel.com/docs/builds/managing-builds)): the
queue is **per-branch ("namespace")**. With **one** build slot, Vercel **coalesces** a branch to its
**latest** commit (skips superseded ones) and serializes everything. Under a burst, interleaved `main`
builds get starved/dropped while the active branch keeps claiming the single slot — and once near the
**100/day** cap, new deployment *creation* is rate-limited.

**This session blew past Hobby's sizing**: the autonomous loop + parallel-agent fan-outs + dozens of
manual commits/pushes generated *far* more than 100 deploys in the day, with constant pushes to the
feature branch holding the one build slot. Production (`main`) was the casualty. Nothing is broken —
the plan is simply out of headroom.

## Fixes (researched, best first)
1. **Promote an already-built preview to production — no rebuild, no limit hit.** The latest branch
   preview is READY with all the work; point production at it:
   - Dashboard: project → Deployments → the READY preview → **⋯ → Promote to Production**.
   - CLI: `vercel promote <preview-deployment-url>`.
   - API/SDK: `requestPromote({ projectId, deploymentId, teamId })`
     ([docs](https://vercel.com/docs/deployments/rollback-production-deployment)).
   Promote **re-points production traffic to an existing deployment** — it doesn't build, so it sidesteps
   both the stalled webhook AND the rate limit. **This is the unblock.**
2. **Force a fresh prod deploy from CLI** (bypasses the webhook): `vercel deploy --force --prod`. Note:
   this DOES count as a deployment, so it can still hit the 100/day cap.
3. **Wait out the rolling reset.** The 100/day window is rolling — once volume drops, `main` deploys
   resume on their own.
4. **Cut deploy volume (prevention).** Each push = a deployment. Batch commits; push to `main` only at
   milestones. Optionally disable feature-branch previews so they stop eating the single slot + budget:
   `vercel.json` → `{"git":{"deploymentEnabled":{"claude/<branch>":false}}}`
   ([git-configuration](https://vercel.com/docs/project-configuration/git-configuration)). **Trade-off:**
   that kills the preview URL we currently use to review work — only do it once production is reliable.
5. **Upgrade to Pro** — 12 concurrent builds + far higher limits — if this build cadence continues.

## Lesson for our workflow
The autonomous-loop / per-commit-push / parallel-agent cadence is **too deploy-heavy for Hobby**. Treat
deploys as scarce: commit freely on the branch, but **promote a preview** or push `main` only at
milestones. (Captured in `deploy-doctor` + `git-hygiene`.)

## Sources
- [Vercel — Limits](https://vercel.com/docs/limits) · [Hobby plan](https://vercel.com/docs/plans/hobby) ·
  [Managing builds / queue](https://vercel.com/docs/builds/managing-builds) ·
  [Rollback / promote](https://vercel.com/docs/deployments/rollback-production-deployment) ·
  [Git configuration](https://vercel.com/docs/project-configuration/git-configuration) ·
  [Hobby limits explainer (deploywise, 2026)](https://deploywise.dev/blog/vercel-free-tier-limits-2026)
