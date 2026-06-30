/**
 * Mandala QA loop — geometric, objective, no-eyeball.
 *
 * The mandala kept reading as "rings all over the place / not lined up / not in
 * frame." Those are MEASURABLE geometric properties, so this harness measures the
 * actually-rendered SVG instead of asking a human to squint at a screenshot:
 *
 *   1. CONCENTRIC   every .m-ring circle shares one centre (the "all over the
 *                   place" failure) — measured in viewBox user units via getBBox().
 *   2. RADII        the rings render at their designed, distinct, strictly-
 *                   decreasing radii (so they read AS rings, not hash).
 *   3. IN-FRAME     the whole mandala box sits inside the viewport, no clipping
 *                   ("bring the whole thing into frame").
 *   4. CENTERED     mandala centre == viewport centre (pinned dead-centre).
 *   5. CLEAN        zero console errors through the mandala scroll range.
 *
 * Deterministic by design: emulates prefers-reduced-motion, which turns Lenis OFF
 * (ForgeExperience.jsx only builds Lenis in full-motion), so window.scrollTo drives
 * scrollY directly with nothing fighting it. The mandala's position/scale/opacity
 * do NOT depend on the reduced flag, and concentric circles are rotation-invariant,
 * so killing the .m-spin animation doesn't perturb anything we measure.
 *
 * Run AFTER `npm run build`:
 *   node scripts/mandala-qa.mjs
 * Exits non-zero on any failure (loop-friendly). Prints a PASS/FAIL line per check.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js'
import { spawn } from 'node:child_process'
const { chromium } = pkg

// .m-ring circles, in viewBox user units: 6 keyline circles + 2 boss rings.
const DESIGN_RINGS = [472, 408, 344, 280, 216, 152, 92, 44]
const VIEWPORTS = [
  { w: 393, h: 852, name: 'iphone15' },
  { w: 1440, h: 900, name: 'desktop' },
]
// tolerances (viewBox user units for geometry, CSS px for layout)
const TOL_CENTER = 2 // concentricity: ring centre vs origin
const TOL_RADIUS = 2 // measured vs designed radius
const TOL_VPCENTER = 2 // mandala centre vs viewport centre (px)

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

  // 1) scan the scroll track for the mandala's opacity peak (the dwell where it's
  //    fully in frame), then settle there.
  const peak = await page.evaluate(async () => {
    const el = document.querySelector('.fin-mandala')
    if (!el) return { found: false }
    const max = document.documentElement.scrollHeight - window.innerHeight
    const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    let best = { y: 0, op: -1 }
    for (let f = 0.55; f <= 1.0001; f += 0.01) {
      const y = Math.round(f * max)
      window.scrollTo(0, y)
      await raf()
      const op = parseFloat(getComputedStyle(el).opacity)
      if (op > best.op) best = { y, op }
    }
    window.scrollTo(0, best.y)
    await raf(); await raf()
    return { found: true, ...best }
  })

  if (!peak.found) {
    note(false, 'mandala mounts', '.fin-mandala not found in DOM')
    await page.close()
    continue
  }

  // 2) measure the rendered geometry at the peak.
  const m = await page.evaluate(() => {
    const svg = document.querySelector('.mandala-svg')
    const cont = document.querySelector('.fin-mandala')
    const rings = [...document.querySelectorAll('.m-ring')].map((r) => {
      const b = r.getBBox() // viewBox user units, ignores CSS transforms/filters
      return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, r: b.width / 2 }
    })
    const sr = svg.getBoundingClientRect()
    return {
      rings,
      opacity: parseFloat(getComputedStyle(cont).opacity),
      svgRect: { x: sr.x, y: sr.y, w: sr.width, h: sr.height, cx: sr.x + sr.width / 2, cy: sr.y + sr.height / 2 },
      vw: window.innerWidth,
      vh: window.innerHeight,
    }
  })

  // CHECK: mandala actually reaches (near) full opacity at its dwell
  note(peak.op >= 0.95, 'reaches full opacity', `peak opacity ${peak.op.toFixed(3)} @ scrollY ${peak.y}`)

  // CHECK: ring count matches the design
  note(m.rings.length === DESIGN_RINGS.length, 'ring count', `${m.rings.length} .m-ring circles (expected ${DESIGN_RINGS.length})`)

  // CHECK: CONCENTRIC — every ring centred on the origin
  const maxOff = Math.max(...m.rings.map((r) => Math.max(Math.abs(r.cx), Math.abs(r.cy))), 0)
  note(maxOff <= TOL_CENTER, 'rings concentric', `max centre offset ${maxOff.toFixed(2)}u (tol ${TOL_CENTER})`)

  // CHECK: RADII — measured radii match the designed set (distinct, on-mark)
  const measured = m.rings.map((r) => r.r).sort((a, b) => b - a)
  const design = [...DESIGN_RINGS].sort((a, b) => b - a)
  let worstR = 0
  for (let i = 0; i < design.length; i++) worstR = Math.max(worstR, Math.abs((measured[i] ?? 0) - design[i]))
  note(worstR <= TOL_RADIUS, 'rings hit designed radii', `worst Δr ${worstR.toFixed(2)}u (tol ${TOL_RADIUS})`)

  // CHECK: strictly decreasing → reads as nested rings, not a jumble
  let strictly = true
  for (let i = 1; i < measured.length; i++) if (measured[i] >= measured[i - 1] - 1) strictly = false
  note(strictly, 'rings strictly nested', `radii ${measured.map((r) => r.toFixed(0)).join(',')}u`)

  // CHECK: IN-FRAME — whole mandala box inside the viewport
  const r = m.svgRect
  const over = {
    top: Math.max(0, -r.y),
    left: Math.max(0, -r.x),
    right: Math.max(0, r.x + r.w - m.vw),
    bottom: Math.max(0, r.y + r.h - m.vh),
  }
  const clipped = over.top + over.left + over.right + over.bottom
  note(clipped < 1, 'whole mandala in frame', clipped < 1
    ? `box ${r.w.toFixed(0)}×${r.h.toFixed(0)} fits ${m.vw}×${m.vh}`
    : `clipped t${over.top.toFixed(0)} l${over.left.toFixed(0)} r${over.right.toFixed(0)} b${over.bottom.toFixed(0)}`)

  // CHECK: CENTERED — mandala centre == viewport centre
  const dcx = Math.abs(r.cx - m.vw / 2)
  const dcy = Math.abs(r.cy - m.vh / 2)
  note(dcx <= TOL_VPCENTER && dcy <= TOL_VPCENTER, 'centred in viewport', `off (${dcx.toFixed(1)}, ${dcy.toFixed(1)})px`)

  // CHECK: SPIN PIVOT — the rotating motif groups (.m-spin: petals/dots/ticks/word
  //   rim) must pivot on the TRUE centre, not a viewBox corner. The skeleton circles
  //   are NOT in a spin group, so they can never catch this; we must test the groups.
  //   Deterministic test: force a 90° rotation and confirm each (radially symmetric)
  //   group's centre STAYS on the viewport centre. A wrong pivot flings it hundreds
  //   of px (the "split mandala — petals in the corner" bug).
  const pivot = await page.evaluate(() => {
    const kill = document.createElement('style')
    kill.textContent = '.m-spin{animation:none !important;}'
    document.head.appendChild(kill)
    const groups = [...document.querySelectorAll('.m-spin')]
    groups.forEach((g) => { g.style.transform = 'rotate(90deg)' })
    document.body.getBoundingClientRect() // force reflow
    const data = groups.map((g) => {
      const b = g.getBoundingClientRect()
      const cls = [...g.classList].find((c) => c.startsWith('m-spin--')) || 'm-spin'
      return { cls, cx: b.x + b.width / 2, cy: b.y + b.height / 2 }
    })
    groups.forEach((g) => { g.style.transform = '' })
    kill.remove()
    return { data, vw: window.innerWidth, vh: window.innerHeight }
  })
  for (const g of pivot.data) {
    const ox = Math.abs(g.cx - pivot.vw / 2)
    const oy = Math.abs(g.cy - pivot.vh / 2)
    note(ox <= 8 && oy <= 8, `${g.cls} pivots on centre`, `rotated centre off (${ox.toFixed(1)}, ${oy.toFixed(1)})px`)
  }

  // CHECK: clean console through the scroll range
  note(errors.length === 0, 'zero console errors', errors.length ? errors.slice(0, 4).join(' | ') : '')

  await page.close()
}

await browser.close()
server.kill()
console.log(`\n${failures === 0 ? '✅ MANDALA QA GREEN' : `❌ MANDALA QA: ${failures} failure(s)`}`)
process.exit(failures === 0 ? 0 : 1)
