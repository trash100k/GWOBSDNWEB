import { useEffect, useRef, useState } from 'react'

/**
 * Quality tier — high (transmission + full post-fx), low (no transmission — the
 * proven-safe path), static (poster, no canvas). The big lesson: the iPhone works
 * because it's 'low' (no transmission); a Chromebook that landed on 'high' rendered
 * BLACK because transmission (MeshPhysicalMaterial transmission) fails on weak /
 * software GPUs. So: software GPU or no WebGL → static poster; Chromebooks (CrOS) +
 * mobile + few-core → 'low' (the path that works on the phone); only real desktop
 * GPUs get 'high'/transmission.
 */
export function detectQuality() {
  if (typeof window === 'undefined') return 'high'
  // explicit override for QA / debugging on machines whose GPU probe mis-tiers
  // (e.g. a CI sandbox always reports SwiftShader → static): ?q=high|low|static
  try {
    const forced = new URLSearchParams(window.location.search).get('q')
    if (forced === 'high' || forced === 'low' || forced === 'static') return forced
  } catch {
    /* no-op */
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  // probe the actual GPU — software renderers paint the heavy obsidian black
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return 'static'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase() : ''
    if (/swiftshader|llvmpipe|software|basic render|microsoft basic|apple sw/.test(r)) return 'static'
  } catch {
    return 'static'
  }
  const ua = navigator.userAgent || ''
  // CrOS = ChromeOS / Chromebooks → the no-transmission tier that works on the phone
  const lowTier = /Mobi|Android|iPhone|iPad|iPod|CrOS/i.test(ua) || window.innerWidth < 760
  const cores = navigator.hardwareConcurrency || 4
  if (lowTier || cores <= 4) return 'low'
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
