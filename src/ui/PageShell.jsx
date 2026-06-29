import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { COPY } from '../brand.js'
import BrandText from './BrandText.jsx'

/**
 * Shared page placement system — the ONE template every routed page uses so
 * spacing, rhythm, measure, and hierarchy are identical site-wide. Pages compose
 * <Section> children inside this shell. Normal document flow above the fixed
 * obsidian canvas (content-first); the per-route scene (scenes.js) plays behind.
 *
 *  kicker — small ember eyebrow (e.g. "02 · Software")
 *  title  — the page H1 (plain flame; NOT auto-ignited — ignite is for brand nouns)
 *  lede   — one-paragraph intro (BrandText auto-ignites brand terms within it)
 */
export default function PageShell({ kicker, title, lede, children, cta = true }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="pg">
      <header className="pg-hero pg-measure">
        {kicker && <span className="kicker">{kicker}</span>}
        <h1 className="pg-title flame">{title}</h1>
        {lede && (
          <p className="pg-lede">
            <BrandText text={lede} />
          </p>
        )}
      </header>

      {children}

      {cta && (
        <section className="pg-cta pg-measure">
          <h2 className="pg-cta-head flame">Start the Forge</h2>
          <p className="pg-lede">
            <BrandText text={COPY.finale.closer} />
          </p>
          <Link className="cta cta--solid" to="/contact">
            <span>Start the Forge</span>
          </Link>
          <span className="avail">{COPY.finale.avail}</span>
        </section>
      )}
    </main>
  )
}
