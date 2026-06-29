import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

// About — the clan + the ethos. Phase-1 page on the shared shell; a specialist deepens this.
export default function About() {
  return (
    <PageShell kicker="The Clan" title="One Forge. Four Branches." lede={COPY.clan.body}>
      <Section eyebrow="Why GAELWORX" title="What makes the forge different." align="start">
        <div className="pg-grid">
          {COPY.trust.rungs.map((r) => (
            <div key={r.n} className="pg-panel">
              <h3>{r.head}</h3>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
