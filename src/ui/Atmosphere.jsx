import { useEffect, useRef } from 'react'
import { forge } from '../store.js'

/**
 * Foreground atmosphere. A cool emerald-isle FOG drifts in front of the copy —
 * thick near the top of the journey (the veil / mystery) and clearing as the
 * visitor scrolls deeper, until they're surrounded by the emerald scene.
 *
 * The fog is large, slow, low-alpha mist blobs layered for depth (Atmospheric
 * Drift — slow constant velocity, no frenetic motion). Its overall density is
 * driven by `forge.scroll` (0..1): dense at scroll≈0, gone by scroll≈1.
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
    const lerp = (a, b, t) => a + (b - a) * t
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
    const smoothstep = (t) => { t = clamp01(t); return t * t * (3 - 2 * t) }

    // Layered fog: a few near banks (larger, softer, faster parallax) and several
    // deep ones (broad, very faint). Cool green-white mist — emerald-isle fog.
    let fog = []
    const seed = () => {
      const count = innerWidth < 760 ? 9 : 14
      fog = Array.from({ length: count }, (_, i) => {
        const depth = i / count            // 0 = near, →1 = far
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          // big soft blobs; nearer banks read larger
          r: rnd(0.42, 0.72) * w * lerp(1, 0.62, depth),
          // slow constant drift, gentle vertical wander
          vx: rnd(-5, 5) * dpr,
          vy: rnd(-1.6, 1.6) * dpr,
          // near banks parallax more with the pointer than deep ones
          par: lerp(34, 8, depth) * dpr,
          // base opacity before scroll density is applied
          a: rnd(0.05, 0.11) * lerp(1, 0.6, depth),
          // a touch of green/blue variance across banks
          g: Math.round(rnd(214, 230)),
          b: Math.round(rnd(198, 216)),
        }
      })
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
      // Density: thick at the top (scroll≈0), clears toward the bottom (scroll≈1).
      // Veil lifts as the journey deepens. Floor near 0 so it fully resolves.
      const density = lerp(1, 0.04, smoothstep(forge.scroll))
      if (density <= 0.001) return
      const px = forge.pointer.x, py = forge.pointer.y
      ctx.globalCompositeOperation = 'screen'
      for (const f of fog) {
        if (!reduce) {
          f.x += f.vx * dt; f.y += f.vy * dt
          if (f.x < -f.r) f.x = w + f.r; else if (f.x > w + f.r) f.x = -f.r
          if (f.y < -f.r) f.y = h + f.r; else if (f.y > h + f.r) f.y = -f.r
        }
        const cx = f.x + px * f.par
        const cy = f.y + py * f.par * 0.6
        const alpha = f.a * density
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, f.r)
        g.addColorStop(0, `rgba(228,${f.g},${f.b},${alpha})`)
        g.addColorStop(0.55, `rgba(220,${f.g},${f.b},${alpha * 0.42})`)
        g.addColorStop(1, `rgba(220,${f.g},${f.b},0)`)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(cx, cy, f.r, 0, 7); ctx.fill()
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
