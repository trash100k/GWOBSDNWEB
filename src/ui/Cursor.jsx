import { useEffect, useRef } from 'react'

/** A magnetic ember cursor — follows the pointer, swells and pulls toward CTAs. */
export default function Cursor() {
  const dotRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return // touch: skip
    const dot = dotRef.current
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const cur = { x: pos.x, y: pos.y }
    let magnet = null

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const m = e.target.closest?.('.magnetic')
      magnet = m || null
      dot.classList.toggle('big', !!m)
    }
    addEventListener('pointermove', onMove, { passive: true })

    let raf
    const tick = () => {
      let tx = pos.x
      let ty = pos.y
      if (magnet) {
        const r = magnet.getBoundingClientRect()
        tx = pos.x + (r.left + r.width / 2 - pos.x) * 0.35
        ty = pos.y + (r.top + r.height / 2 - pos.y) * 0.35
      }
      cur.x += (tx - cur.x) * 0.22
      cur.y += (ty - cur.y) * 0.22
      dot.style.transform = `translate(${cur.x}px, ${cur.y}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div className="forge-cursor" ref={dotRef} aria-hidden="true" />
}
