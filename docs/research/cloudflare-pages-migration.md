# Migrating GAELWORX off Vercel → Cloudflare Pages

**Why.** Vercel's Hobby plan has been the recurring deploy bottleneck (1 concurrent
build, 100 deploys/day → builds coalesce and stall; see
`vercel-hobby-deploy-limits.md`). Cloudflare Pages gives unlimited static requests, no
per-day deploy cap that bites at this volume, fast global edge, and the same
git-connected auto-deploy + PR preview flow we had on Vercel.

The site is a **static Vite SPA with build-time prerendered routes** (`npm run build` →
`dist/`, with per-route `index.html` + FAQ JSON-LD emitted by `scripts/prerender.mjs`).
That maps onto Cloudflare Pages 1:1 — no serverless functions, no runtime, nothing
Vercel-specific to port.

---

## What is already done in the repo (this branch)

- **`public/_redirects`** — Cloudflare Pages SPA fallback (`/*  /index.html  200`).
  Prerendered files like `dist/software/index.html` are static assets and are served
  FIRST; the catch-all only handles deep links with no matching file, so SEO-friendly
  per-route HTML is preserved and client-side routing still works for everything else.
  Vite copies `public/_redirects` into `dist/` on build; Vercel ignores it, so it is
  safe to land before the cutover.
- Build is host-agnostic: **build command `npm run build`**, **output directory `dist`**.
- `vercel.json` is left in place for now so the current Vercel preview keeps working
  during the transition. It can be deleted the moment Cloudflare is serving (it has no
  effect on Cloudflare — CF uses `_redirects`, not `vercel.json`).

---

## Owner steps — connect Cloudflare Pages (≈3 min, dashboard)

These require the Cloudflare account + GitHub auth, so they can't be scripted from here.
Source: Cloudflare Pages "Deploy a site" framework guide.

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** tab.
2. **Import an existing Git repository** → authorize GitHub → pick **`trash100k/GWOBSDNWEB`**
   → **Begin setup**.
3. **Set up builds and deployments:**
   | Option | Value |
   | --- | --- |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variables | none required |
4. **Save and Deploy.** Pages installs deps, runs the build, and publishes to
   `https://<project>.pages.dev`. Every push to `main` auto-deploys; PRs get preview URLs
   (same model as Vercel).

> Node version: Pages defaults to a current LTS, which builds this project fine. If a
> build ever needs pinning, add a `NODE_VERSION` environment variable (e.g. `20`) or a
> `.node-version` file.

### Custom domain (gaelworx.com)
Pages project → **Custom domains** → **Set up a domain** → add `gaelworx.com` (and
`www`). If the domain's DNS is already on Cloudflare, it's a one-click CNAME; if not,
move the nameservers to Cloudflare first (or add the CNAME Pages shows you at the current
registrar). Cloudflare provisions the TLS cert automatically.

---

## Owner steps — disconnect Vercel

Do this AFTER Cloudflare Pages is confirmed serving, so there's no gap:

1. Vercel dashboard → the `gwobsdnweb` project → **Settings → Git** → **Disconnect**
   (stops auto-deploys), **or** **Settings → Advanced → Delete Project** to remove it
   entirely.
2. If the custom domain was pointed at Vercel, move it to the Cloudflare Pages project
   (above) — don't leave `gaelworx.com` pointed at a disconnected Vercel deploy.
3. Optional repo cleanup once CF is live: delete `vercel.json` (say the word and I'll
   remove it in the branch).

---

## Notes / gotchas
- **No functions to port.** The app is 100% static after build; there were no Vercel
  serverless/edge functions, so nothing moves to Pages Functions / Workers.
- **`_redirects` vs prerender.** Verified order: static asset wins, catch-all is fallback
  only — so `/software`, `/pricing`, etc. keep serving their prerendered HTML + JSON-LD.
- **Alternative (not recommended here):** Cloudflare is steering new static sites toward
  **Workers static assets** instead of Pages. Pages is the closer 1:1 to the Vercel
  git-flow and needs zero new config, so it's the right call for this cutover. Revisit
  Workers only if we later need edge logic in front of the site.
</content>
</invoke>
