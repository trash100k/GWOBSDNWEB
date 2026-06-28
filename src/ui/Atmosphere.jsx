import { useEffect, useRef } from 'react'
import { forge } from '../store.js'

/**
 * Foreground atmosphere. A mid-ground warm haze sits behind the copy (CSS),
 * while this canvas drifts embers + thin mist IN FRONT of it — so the text lives
 * inside the environment, not on a flat plane above it. Embers/mist take a small
 * pointer parallax (a different rate from the slab + the copy) for real depth.
 */
export default function Atmosphere() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let w = 0, h = 0, dpr = 1
    const rnd = (a, b) => a + Math.random() * (b - a)

    let motes = []
    let mist = []
    let sparks = [] // dissolve: embers shed by receding copy
    const seed = () => {
      const count = innerWidth < 760 ? 26 : 46
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: rnd(0.6, 2.2) * dpr, sp: rnd(7, 24) * dpr,
        sway: rnd(8, 26) * dpr, ph: Math.random() * Math.PI * 2, swsp: rnd(0.2, 0.6),
        a: rnd(0.16, 0.6), hue: rnd(16, 36),
      }))
      mist = Array.from({ length: 3 }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: rnd(0.32, 0.6) * w,
        vx: rnd(-6, 6) * dpr, vy: rnd(-3, 3) * dpr, a: rnd(0.014, 0.04),
      }))
    }
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = cv.width = innerWidth * dpr
      h = cv.height = innerHeight * dpr
      cv.style.width = innerWidth + 'px'
      cv.style.height = innerHeight + 'px'
      seed()
    }
    resize()
    addEventListener('resize', resize)

    const draw = (dt) => {
      ctx.clearRect(0, 0, w, h)
      const px = forge.pointer.x, py = forge.pointer.y
      ctx.globalCompositeOperation = 'lighter'
      for (const m of mist) {
        if (!reduce) {
          m.x += m.vx * dt; m.y += m.vy * dt
          if (m.x < -m.r) m.x = w + m.r; if (m.x > w + m.r) m.x = -m.r
          if (m.y < -m.r) m.y = h + m.r; if (m.y > h + m.r) m.y = -m.r
        }
        const mx = m.x + px * 30 * dpr
        const g = ctx.createRadialGradient(mx, m.y, 0, mx, m.y, m.r)
        g.addColorStop(0, `rgba(232,93,4,${m.a})`)
        g.addColorStop(1, 'rgba(232,93,4,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(mx, m.y, m.r, 0, 7); ctx.fill()
      }
      for (const p of motes) {
        if (!reduce) {
          p.y -= p.sp * dt; p.ph += p.swsp * dt
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        }
        const sx = p.x + Math.sin(p.ph) * p.sway + px * 18 * dpr
        const sy = p.y + py * 12 * dpr
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 4)
        glow.addColorStop(0, `hsla(${p.hue},95%,60%,${p.a})`)
        glow.addColorStop(1, 'hsla(20,95%,50%,0)')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(sx, sy, p.r * 4, 0, 7); ctx.fill()
        ctx.fillStyle = `hsla(${p.hue},100%,76%,${Math.min(1, p.a * 1.6)})`
        ctx.beginPath(); ctx.arc(sx, sy, p.r, 0, 7); ctx.fill()
      }
      // dissolve sparks — receding copy melts into highlights that rise into the scene
      const em = forge.emit
      if (!reduce && em.amt > 0.14 && sparks.length < 120) {
        const n = Math.random() < em.amt ? 2 : 1
        for (let k = 0; k < n; k++) sparks.push({
          x: em.x * w + rnd(-46, 46) * dpr, y: em.y * h + rnd(-30, 34) * dpr,
          vx: rnd(-12, 12) * dpr, vy: -rnd(14, 42) * dpr, life: 1,
          r: rnd(0.8, 2.1) * dpr, hue: rnd(18, 40),
        })
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        if (!reduce) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 9 * dpr * dt; s.life -= dt * 0.85 }
        if (s.life <= 0) { sparks.splice(i, 1); continue }
        const a = s.life * 0.7
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
        g.addColorStop(0, `hsla(${s.hue},100%,66%,${a})`)
        g.addColorStop(1, 'hsla(20,95%,50%,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, 7); ctx.fill()
        ctx.fillStyle = `hsla(${s.hue},100%,82%,${Math.min(1, a * 1.8)})`
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill()
      }
    }

    let raf, last = performance.now()
    if (reduce) {
      draw(0)
    } else {
      const tick = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05); last = now
        draw(dt)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      <div className="haze" aria-hidden="true" />
      <canvas ref={canvasRef} className="atmos" aria-hidden="true" />
      <div className="forge-light" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
