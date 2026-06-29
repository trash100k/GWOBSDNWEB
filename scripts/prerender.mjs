/**
 * GAELWORX build-time prerender — pure Node, no browser (runs in Vercel's build).
 *
 * The app is a heavy WebGL SPA, so SSR-ing the React tree in node would crash on
 * three/r3f. Instead, after `vite build`, we emit one static `dist/<route>/index.html`
 * per route whose `<div id="root">` is PREFILLED with a real, data-driven content
 * block (headings, copy, prices, internal links) derived from the same brand/route
 * data the app uses. Crawlers + AI answer engines (which don't run JS) read that
 * content; the React app boots from the unchanged module script and replaces #root
 * with the live 3D experience. This is the SEO / AEO / GEO content layer.
 *
 * Phase 0.2 scope: per-route <title> + <meta description> + the content block +
 * dark critical CSS (no white flash pre-JS). Canonical/OG/JSON-LD/sitemap/robots
 * are Phase 0.4.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES } from '../src/routes.js'
import { COPY } from '../src/brand.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// site-wide crawlable nav (internal linking) + footer
const nav = () =>
  `<nav aria-label="Primary">${ROUTES.map((r) => `<a href="${r.path}">${esc(r.label)}</a>`).join(' · ')}</nav>`

const footer = () =>
  `<footer><p>${esc(COPY.footer.mark)} — ${esc(COPY.footer.tag)}</p><p>${esc(COPY.finale.avail)}</p></footer>`

const branchByTag = (tag) => COPY.arsenal.branches.find((b) => b.tag === tag)

function priceLine(b) {
  const note = b.note ? ` (${esc(b.note)})` : ''
  return `<p class="price"><s>${esc(b.anchor)}</s> <strong>${esc(b.price)}</strong>${note}</p>`
}

// route-specific content, all from brand.js so it never drifts from the app
function body(route) {
  const p = route.path
  if (p === '/') {
    return `
      <h1>${esc(COPY.hero.headline)}. Clan Protected.</h1>
      <p>${esc(COPY.hero.sub)}</p>
      <section><h2>${esc(COPY.arsenal.head)}</h2>${COPY.arsenal.branches
        .map(
          (b) =>
            `<article><h3>${esc(b.tag)} — ${esc(b.line)}</h3><p>${esc(b.body)}</p>${priceLine(b)}<p><a href="/contact">Start the Forge</a></p></article>`,
        )
        .join('')}</section>
      <section><h2>Why GAELWORX</h2>${COPY.trust.rungs
        .map((r) => `<article><h3>${esc(r.head)}</h3><p>${esc(r.body)}</p></article>`)
        .join('')}</section>
      <p>${esc(COPY.finale.closer)}</p>`
  }
  const tag = { '/software': 'Software', '/voice': 'Voice', '/automations': 'Automations', '/web': 'Web' }[p]
  if (tag) {
    const b = branchByTag(tag)
    return `<h1>${esc(b.line)}</h1><p>${esc(b.body)}</p>${priceLine(b)}<p><a href="/pricing">See pricing</a> · <a href="/contact">Start the Forge</a></p>`
  }
  if (p === '/work') {
    return `<h1>The Forge’s Own Platforms</h1><p>${esc(COPY.clan.body)}</p><ul>${COPY.finale.forges
      .map((f) => `<li>${esc(f)}</li>`)
      .join('')}</ul>`
  }
  if (p === '/pricing') {
    return `<h1>${esc(COPY.rates.head)}</h1><p>${esc(COPY.rates.lede)}</p><ul>${COPY.arsenal.branches
      .map((b) => `<li><strong>${esc(b.tag)}</strong> — ${priceLine(b)}</li>`)
      .join('')}</ul><p>${esc(COPY.rates.foot)}</p>`
  }
  if (p === '/about') {
    return `<h1>${esc(COPY.clan.head)}</h1><p>${esc(COPY.clan.body)}</p>${COPY.trust.rungs
      .map((r) => `<h3>${esc(r.head)}</h3><p>${esc(r.body)}</p>`)
      .join('')}`
  }
  if (p === '/contact') {
    return `<h1>${esc(COPY.point.head)}</h1><p>${esc(COPY.point.body)}</p><p>${esc(COPY.point.avail)}</p>`
  }
  return `<h1>${esc(route.label)}</h1><p>${esc(route.desc)}</p>`
}

const CRITICAL = `<style>:root{color-scheme:dark}#root>.seo{background:#0B0C10;color:#F1F2F6;font-family:system-ui,sans-serif;line-height:1.55}.seo{max-width:760px;margin:0 auto;padding:7vh 24px}.seo a{color:#E85D04}.seo s{color:#8D99AE}.seo h1{font-size:2rem}</style>`

function pageHTML(template, route) {
  const block = `<div class="seo">${nav()}<main>${body(route)}</main>${footer()}</div>`
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(route.desc)}" />`)
    .replace('</head>', `${CRITICAL}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${block}</div>`)
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
let n = 0
for (const route of ROUTES) {
  const out = route.path === '/' ? join(DIST, 'index.html') : join(DIST, route.path, 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, pageHTML(template, route))
  n++
}
console.log(`prerendered ${n} routes → dist/<route>/index.html`)
