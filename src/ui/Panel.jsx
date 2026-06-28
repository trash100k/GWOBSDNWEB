import { useEffect, useRef, useState } from 'react'

/**
 * Ethereal frosted-obsidian panel — the GAELWORX "next-gen etherealness" container.
 *
 * Translucent dark glass with backdrop blur so the 3D fire-opal veins bleed through
 * frosted; a 1px luminous Ash hairline edge; an inner forge-glow; a soft outward
 * ember bloom on hover/focus (the brand's "Molten Edge"); sharp 0px corners ALWAYS.
 *
 * Entry is a Forge Reveal (blur-to-sharp). A small scroll-tied translateY gives the
 * panel its atmospheric parallax float above the obsidian. Honors reduced motion.
 *
 * Composable + dependency-free: render any element via `as`, pass extra classes,
 * spread any other props through to the DOM node.
 */
export default function Panel({ children, className = '', as = 'div', parallax = 0.04, ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  // Forge Reveal — blur-to-sharp once the panel scrolls into view (self-cancelling).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf
    let stop = false
    const tick = () => {
      if (stop) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      if (r.top < vh * 0.92 && r.bottom > vh * 0.06) {
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
  }, [])

  // Atmospheric drift — tie a small translateY to scroll position. CSS-var driven so
  // it composes with the reveal transform. Skipped when the user prefers reduced motion.
  useEffect(() => {
    const el = ref.current
    if (!el || !parallax) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf
    const update = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      // -1 (above viewport) → 1 (below). Center of screen ≈ 0.
      const progress = (r.top + r.height / 2 - vh / 2) / vh
      const shift = Math.max(-1, Math.min(1, progress)) * parallax * vh
      el.style.setProperty('--panel-shift', `${shift.toFixed(2)}px`)
      raf = null
    }
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf != null) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [parallax])

  return (
    <Tag ref={ref} className={`panel ${shown ? 'shown' : ''} ${className}`.trim()} {...rest}>
      <div className="panel__inner">{children}</div>
    </Tag>
  )
}
