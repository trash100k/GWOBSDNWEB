import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import Ignite from '../ui/Ignite.jsx'
import { COPY } from '../brand.js'

// Work / proof. Phase-1 page on the shared shell; a specialist deepens this with
// real case studies + results. For now: the forge's own platforms (first-hand proof).
export default function Work() {
  return (
    <PageShell
      kicker="The Proof"
      title="We Build What We Know"
      lede="Every build comes from decades of first-hand knowledge — we’ve run the operation, not read the case study. These are the forge’s own platforms."
    >
      <Section eyebrow="The Forge’s Own" title="Four platforms. One forge." align="center">
        <div className="pg-grid">
          {COPY.finale.forges.map((f) => (
            <div key={f} className="pg-panel">
              <h3><Ignite text={f} /></h3>
              <p>A proprietary platform built and run by GAELWORX — proof the forge ships its own.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="How we work" title="Earned in weeks, not slide decks." align="start">
        <p>{COPY.clan.body}</p>
      </Section>
    </PageShell>
  )
}
