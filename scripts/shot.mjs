/**
 * Reusable page screenshotter for self-QA (orchestrator + every page agent).
 * Builds nothing — run `npm run build` first, then:
 *   node scripts/shot.mjs <route> <out.png> [width] [height] [full]
 * e.g. node scripts/shot.mjs /web scratchpad/web-m.png 393 852 full
 *      node scripts/shot.mjs /web scratchpad/web-d.png 1440 900 full
 * Prints console errors (must be 0). Default fullPage so you can judge placement
 * down the whole page. Picks a random port so parallel agents don't collide.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js'
import { spawn } from 'node:child_process'
const { chromium } = pkg

const [, , route = '/', out = 'scratchpad/shot.png', w = '393', h = '852', full = 'full'] = process.argv
const PORT = 4400 + Math.floor(Math.random() * 400)

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
})
await new Promise((r) => setTimeout(r, 6000))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message))

await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1100)
await page.screenshot({ path: out, fullPage: full === 'full' })

console.log(`shot ${route} @ ${w}x${h} -> ${out} | console errors: ${errors.length}`)
errors.slice(0, 12).forEach((e) => console.log('   ', e))

await browser.close()
server.kill()
process.exit(0)
