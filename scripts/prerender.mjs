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

// Production base URL — canonical/OG/sitemap. Update here when a custom domain
// (gaelworx.io / .ai / a connected gaelworx.com) is attached in Vercel.
const SITE = 'https://gwobsdnweb.vercel.app'
const urlFor = (p) => SITE + (p === '/' ? '' : p)
const priceNum = (p) => (String(p).match(/[\d,]+/)?.[0] || '').replace(/,/g, '')

const ORG = {
  '@type': 'Organization',
  '@id': SITE + '/#org',
  name: 'GAELWORX',
  url: SITE,
  description:
    'AI implementation forge — custom software, lifelike voice agents, workflow automation, and cinematic web design.',
  slogan: 'Automatic Execution. Clan Protected.',
  areaServed: 'US',
}

// JSON-LD per route — Organization + WebSite everywhere; Service+Offer on service
// pages; an OfferCatalog on /pricing. This is the structured data AEO/GEO cite.
function ldjson(route) {
  const graph = [
    ORG,
    { '@type': 'WebSite', '@id': SITE + '/#site', url: SITE, name: 'GAELWORX', publisher: { '@id': SITE + '/#org' } },
  ]
  const tag = { '/software': 'Software', '/voice': 'Voice', '/automations': 'Automations', '/web': 'Web' }[route.path]
  if (tag) {
    const b = branchByTag(tag)
    graph.push({
      '@type': 'Service',
      name: b.line,
      serviceType: b.tag,
      description: b.body,
      provider: { '@id': SITE + '/#org' },
      areaServed: 'US',
      offers: { '@type': 'Offer', price: priceNum(b.price), priceCurrency: 'USD', description: b.price + (b.note ? ` · ${b.note}` : '') },
    })
  }
  if (route.path === '/pricing') {
    graph.push({
      '@type': 'OfferCatalog',
      name: 'GAELWORX Pricing',
      itemListElement: COPY.arsenal.branches.map((b) => ({
        '@type': 'Offer',
        name: b.tag,
        price: priceNum(b.price),
        priceCurrency: 'USD',
        description: b.price,
      })),
    })
  }
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`
}

function seoHead(route) {
  const url = urlFor(route.path)
  const og = `${SITE}/og.png`
  return (
    `<link rel="canonical" href="${url}" />` +
    `<meta property="og:type" content="website" />` +
    `<meta property="og:site_name" content="GAELWORX" />` +
    `<meta property="og:title" content="${esc(route.title)}" />` +
    `<meta property="og:description" content="${esc(route.desc)}" />` +
    `<meta property="og:url" content="${url}" />` +
    `<meta property="og:image" content="${og}" />` +
    `<meta name="twitter:card" content="summary_large_image" />` +
    `<meta name="twitter:title" content="${esc(route.title)}" />` +
    `<meta name="twitter:description" content="${esc(route.desc)}" />` +
    `<meta name="twitter:image" content="${og}" />` +
    ldjson(route)
  )
}

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
    .replace('</head>', `${CRITICAL}${seoHead(route)}</head>`)
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

// robots.txt — open to all, explicitly welcoming the AI answer engines (GEO).
const aiBots = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Claude-Web', 'Google-Extended', 'CCBot', 'Applebot-Extended']
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\n${aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`,
)

// sitemap.xml
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ROUTES.map((r) => `  <url><loc>${urlFor(r.path)}</loc><changefreq>weekly</changefreq></url>`).join('\n') +
    `\n</urlset>\n`,
)

console.log(`prerendered ${n} routes + robots.txt + sitemap.xml → dist/`)
