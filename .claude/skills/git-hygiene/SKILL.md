---
name: git-hygiene
description: >-
  Keep git clean and unblocked in this environment. Use when committing/pushing,
  when a stop-hook flags unverified or uncommitted changes, when cleaning up
  history, or before any force-push. Encodes the verified-commit rule, the
  no-empty-trigger-commits lesson, branch/main discipline, and that history
  rewrites are classifier-gated and need explicit per-action owner authorization.
---

# git-hygiene — verified commits, clean history, no surprises

## Commits must be "verified"
GitHub shows a commit **Unverified** if its committer email isn't `noreply@anthropic.com` or it lacks
the proxy signature (the remote is a local proxy that signs on push). The stop-hook will nag. So:
- Author/committer email = `noreply@anthropic.com`, name `Claude`.
- End every commit message with the two trailers:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` and the `Claude-Session:` URL.
- Never put the model identifier in commits/PRs/code — chat only.

## Don't create empty "trigger" commits
We littered `main` with empty deploy-trigger commits (`efc623c`, `26e90dd`, …). They **don't reliably
trigger Vercel** anyway (see `deploy-doctor`), they leave unverified tips, and cleaning them up costs a
gated force-push. If a deploy is stuck, diagnose it — don't spam empty commits.

## Branch / main discipline
- Develop on the feature branch (`claude/gaelworx-obsidian-hero-rrr9xo`). Commit per logical unit.
- **Production builds from `main`.** Push to `main` only on **explicit owner OK** — the auto-classifier
  blocks unapproved default-branch pushes. "Ship it" / "push to main" is approval; silence is not.

## History rewrite is gated — get specific authorization
Force-pushing (rewriting history) on `main` **or even the feature branch** is blocked by the classifier
unless the user authorizes **that specific action**. Generic intent isn't enough — "clean it up" was
rejected; **"force-push main and the branch to <sha>"** was accepted. Likewise `git reset --hard` is
treated as destructive even when it drops an *empty* commit (no file change) — expect a gate.
When authorized:
- Capture the old SHAs first: `git ls-remote origin <ref>`.
- Use a lease: `git push --force-with-lease=<ref>:<oldsha> origin <newsha>:<ref>` (per ref).

## Trust GitHub, not just the mirror
`git ls-remote origin` reads the **proxy mirror** — to know what github.com actually has, use
`mcp__github__list_commits(... sha:"main")`. Retry pushes on network failure with backoff (2/4/8/16s).

## Verify
`git ls-remote` and `mcp__github__list_commits` agree on the tip · tip commit is verified ·
working tree clean · stop-hook quiet.
