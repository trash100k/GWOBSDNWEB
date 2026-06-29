import { useEffect, useRef } from 'react'
import { forge } from '../store.js'

/**
 * Foreground atmosphere — a thin, slow warm MIST that drifts in front of the
 * copy for depth (a different pointer-parallax rate from the slab + the copy),
 * over the ambient CSS layers (haze behind copy, shared forge-light, grain).
 * No embers, no dissolve sparks — the obsidian fire-opal veins are the effect.
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

    let mist = []
    const seed = () => {
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
      const px = forge.pointer.x
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
