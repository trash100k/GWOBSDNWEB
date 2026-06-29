---
name: parallel-agents
description: >-
  Safely fan out multiple subagents to work in parallel on this codebase. Use when
  the user asks for a sprint / "subagents on all" / parallel specialists. Encodes
  the rules that keep concurrent agents from colliding — disjoint file ownership,
  no builds/git inside agents, cold-start self-contained prompts, and central
  integration by the orchestrator. Only spawn agents when the user asks.
---

# parallel-agents — fan out without collisions

Proven twice this session (4 skill-writers; 2 pacing/AEO specialists). **Only spawn subagents when the
user explicitly asks** — otherwise do it inline.

## Rule 1 — disjoint file ownership (the #1 thing)
Each agent owns a set of files that **no other agent touches**. Map ownership BEFORE launching. When two
tasks need the same file, **combine them into one agent** rather than risk concurrent edits — e.g. the
pacing pass and the dead-CTA wiring both live in `Content.jsx`, so one agent did both; a second owned
`prerender.mjs` + `brand.js`. Fully disjoint = safe to run at once in one tree.

## Rule 2 — agents don't build, git, or push
Parallel `npm run build` collide on `dist/`; parallel commits race. The **orchestrator** builds, QAs
(`qa-route`), and commits **centrally after** agents return. State this explicitly in every prompt:
"do NOT run npm/build/git/push — create/edit only your files; the orchestrator integrates."

## Rule 3 — cold-start, self-contained prompts
Agents start with zero context. Each prompt includes: the project one-liner; the brand SoT pointer
(`CLAUDE.md`); the **exact files to read** (with line anchors) to ground the work; the precise task +
any starting numbers; the ownership constraint; and "return a concise per-file summary + anything the
owner must verify." Tell them which existing skill/file to mirror for style.

## Rule 4 — the orchestrator owns shared indexes
Never let parallel agents edit a shared file like `.claude/skills/README.md` or `BUILD_PLAN.md`. The
orchestrator updates those itself once agents return.

## Mechanics
- `Agent(subagent_type:"general-purpose", ...)` — they run async; you get a completion notification per
  agent. Don't read the agent transcript files (they overflow context) — use the returned summary.
- Launch all in one turn (independent). Integrate when ALL have returned: central build + `qa-route`,
  review each owned file, then **one commit per logical unit** (not one giant commit).

## Verify
After integration: build green · `qa-route` 0 console errors @ both viewports · each owned file reviewed ·
commits clean (`git-hygiene`).
