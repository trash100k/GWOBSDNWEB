import { useEffect, useRef, useState } from 'react'

/** Quality tier — high (full journey), low (mobile/few cores), static (reduced motion). */
export function detectQuality() {
  if (typeof window === 'undefined') return 'high'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  const ua = navigator.userAgent || ''
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 760
  const cores = navigator.hardwareConcurrency || 4
  if (mobile || cores <= 4) return 'low'
  return 'high'
}

export function useQuality() {
  const [q, setQ] = useState('high')
  useEffect(() => setQ(detectQuality()), [])
  return q
}

/**
 * True once `ref` has scrolled into view. Uses a self-cancelling rAF poll on
 * getBoundingClientRect — bulletproof against IntersectionObserver quirks with
 * programmatic/instant scrolling, and stops the moment it reveals.
 */
export function useReveal(options = {}) {
  const { enter = 0.9, exit = 0.06 } = options
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf
    let stop = false
    const tick = () => {
      if (stop) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      if (r.top < vh * enter && r.bottom > vh * exit) {
        setShown(true)
        stop = true
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stop = true
      cancelAnimationFrame(raf)
    }
  }, [enter, exit])
  return [ref, shown]
}
