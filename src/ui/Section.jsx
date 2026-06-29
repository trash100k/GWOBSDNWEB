import { useEffect, useRef } from 'react'
import BrandText from './BrandText.jsx'

/**
 * One content section with the shared vertical rhythm + measure. Use inside a
 * PageShell. Keeps every section's spacing/hierarchy identical across pages, and
 * gives each a consistent **Forge Reveal** (blur→sharp + slight rise) as it scrolls
 * in — applied via IntersectionObserver (Safari-safe), reduced-motion-guarded, and
 * only with JS (so prerendered/no-JS content stays visible).
 *
 *  eyebrow — optional small ember label
 *  title   — optional H2 (Bricolage headline)
 *  align   — 'center' (default) | 'start'
 *  tone    — '' | 'panel' (a bordered Cold-Steel surface, sharp corners)
 */
export default function Section({ eyebrow, title, align = 'center', tone = '', className = '', children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('pg-reveal')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className={`pg-section pg-measure pg-${align} ${tone ? 'pg-panel' : ''} ${className}`.trim()}
    >
      {eyebrow && <span className="pg-eyebrow">{eyebrow}</span>}
      {title && (
        <h2 className="pg-h2">
          <BrandText text={title} />
        </h2>
      )}
      {children}
    </section>
  )
}
