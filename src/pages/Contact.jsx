import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

// Contact — the conversion endpoint. Phase-1 page on the shared shell; the real
// lead-capture form is wired in Phase 2 (a specialist deepens this).
export default function Contact() {
  return (
    <PageShell kicker="03 · Start the Forge" title="Tell Us the Problem" lede={COPY.point.body} cta={false}>
      <Section align="center">
        <p>Name the bottleneck — we build the system that kills it. No discovery-call theater.</p>
        <p className="rate-foot" style={{ marginTop: '1.5rem' }}>{COPY.point.avail}</p>
      </Section>
    </PageShell>
  )
}
