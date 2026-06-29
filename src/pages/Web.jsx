import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Web')

// GW–04 Web — the flagship proof. Phase-1 page on the shared shell; a specialist deepens this.
export default function Web() {
  return (
    <PageShell kicker="GW–04 · Web" title="Cinematic Web That Books the Job" lede={b.body}>
      <Section eyebrow="The standard" title="The page you’re on is the pitch." align="start">
        <p>
          Studio-grade, cinematic lead-gen sites that turn visitors into booked work and route every
          lead straight to your phone. Built to the standard of the site you’re reading right now — real
          3D, real motion, real speed.
        </p>
      </Section>

      <Section eyebrow="What you get" title="A site that earns its keep." align="start">
        <div className="pg-grid">
          <div className="pg-panel"><h3>Cinematic 3D</h3><p>A living scene, not a stock hero — the kind of first impression that closes.</p></div>
          <div className="pg-panel"><h3>Built to convert</h3><p>Every section points the sword: clear path from visitor to booked job.</p></div>
          <div className="pg-panel"><h3>Found everywhere</h3><p>Prerendered, fast, and structured so search and AI engines read you.</p></div>
        </div>
      </Section>

      <Section eyebrow="Investment" title="Premium work. Honest price." align="center">
        <p className="price"><s>{b.anchor}</s> <strong>{b.price}</strong></p>
      </Section>
    </PageShell>
  )
}
