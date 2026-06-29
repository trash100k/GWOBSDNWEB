import BrandText from './BrandText.jsx'

/**
 * One content section with the shared vertical rhythm + measure. Use inside a
 * PageShell. Keeps every section's spacing/hierarchy identical across pages.
 *
 *  eyebrow — optional small ember label
 *  title   — optional H2 (Bricolage headline)
 *  align   — 'center' (default) | 'start'
 *  tone    — '' | 'panel' (a bordered Cold-Steel surface, sharp corners)
 */
export default function Section({ eyebrow, title, align = 'center', tone = '', className = '', children }) {
  return (
    <section className={`pg-section pg-measure pg-${align} ${tone ? 'pg-panel' : ''} ${className}`.trim()}>
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
