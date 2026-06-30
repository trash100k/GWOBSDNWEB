/**
 * Finale QA — image-free, deterministic check that the home journey RESOLVES
 * correctly on the living obsidian: the mandala is gone, and GAELWORX + the CTA
 * rise to centre and HOLD (CTA live) at the very bottom of the scroll. Replaces the
 * retired mandala-qa geometry harness.
 *
 * Deterministic via prefers-reduced-motion (Lenis off → window.scrollTo drives
 * scrollY directly; the finale opacities/transforms don't depend on the reduced
 * flag). Run AFTER `npm run build`:  node scripts/finale-qa.mjs  (npm run qa:finale)
 * Exits non-zero on any failure (loop-friendly). 393×852 + 1440×900.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js'
import { spawn } from 'node:child_process'
const { chromium } = pkg

const VIEWPORTS = [
  { w: 393, h: 852, name: 'iphone15' },
  { w: 1440, h: 900, name: 'desktop' },
]
const PORT = 4400 + Math.floor(Math.random() * 400)
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
})
await new Promise((r) => setTimeout(r, 6000))

const browser = await chromium.launch()
let failures = 0
const note = (ok, label, detail) => {
  if (!ok) failures++
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  —  ' + detail : ''}`)
}

for (const vp of VIEWPORTS) {
  console.log(`\n── ${vp.name} (${vp.w}×${vp.h}) ─────────────────────────────`)
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 })
  await page.emulateMedia({ reducedMotion: 'reduce' }) // Lenis off → deterministic scroll
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message))

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  // scroll to the very bottom — the held resting state — and measure it.
  const end = await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    window.scrollTo(0, max)
    await raf(); await raf(); await raf()
    const mark = document.querySelector('.fin-mark--seal')
    const ctaWrap = document.querySelector('.fin-cta--seal')
    const cta = ctaWrap && ctaWrap.querySelector('.cta')
    const vw = window.innerWidth, vh = window.innerHeight
    const rect = (el) => {
      const r = el.getBoundingClientRect()
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, inView: r.y >= -2 && r.y + r.height <= vh + 2 }
    }
    return {
      hasMandala: !!document.querySelector('.fin-mandala, .mandala-svg, .m-ring, .m-spin'),
      markOpacity: mark ? parseFloat(getComputedStyle(mark).opacity) : 0,
      markText: mark ? mark.textContent.trim() : '',
      markRect: mark ? rect(mark) : null,
      ctaOpacity: ctaWrap ? parseFloat(getComputedStyle(ctaWrap).opacity) : 0,
      ctaClickable: ctaWrap ? getComputedStyle(ctaWrap).pointerEvents !== 'none' : false,
      ctaText: cta ? cta.textContent.trim() : '',
      ctaRect: ctaWrap ? rect(ctaWrap) : null,
      vw, vh,
    }
  })

  note(!end.hasMandala, 'mandala fully removed', end.hasMandala ? 'mandala DOM still present!' : 'no .fin-mandala/.m-* in DOM')
  note(end.markOpacity >= 0.95, 'GAELWORX held at journey end', `"${end.markText}" opacity ${end.markOpacity.toFixed(3)}`)
  note(end.ctaOpacity >= 0.9 && end.ctaClickable, 'CTA live at the resting state',
    `"${end.ctaText}" op ${end.ctaOpacity.toFixed(2)} clickable=${end.ctaClickable}`)
  if (end.markRect && end.ctaRect) {
    const centred = Math.abs(end.markRect.cx - end.vw / 2) < 6 && Math.abs(end.ctaRect.cx - end.vw / 2) < 6
    note(centred, 'mark + CTA centred', `mark off ${(end.markRect.cx - end.vw / 2).toFixed(1)}px, cta off ${(end.ctaRect.cx - end.vw / 2).toFixed(1)}px`)
    note(end.markRect.inView && end.ctaRect.inView, 'mark + CTA in frame (no clip)',
      `mark inView=${end.markRect.inView}, cta inView=${end.ctaRect.inView}`)
    note(end.markRect.cy < end.ctaRect.cy, 'wordmark sits above the sword',
      `mark cy ${end.markRect.cy.toFixed(0)} < cta cy ${end.ctaRect.cy.toFixed(0)}`)
  }
  note(errors.length === 0, 'zero console errors', errors.length ? errors.slice(0, 4).join(' | ') : '')

  await page.close()
}

await browser.close()
server.kill()
console.log(`\n${failures === 0 ? '✅ FINALE QA GREEN' : `❌ FINALE QA: ${failures} failure(s)`}`)
process.exit(failures === 0 ? 0 : 1)
