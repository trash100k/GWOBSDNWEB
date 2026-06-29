import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Automations')

// GW–03 Automations. Phase-1 page on the shared shell; a specialist deepens this.
export default function Automations() {
  return (
    <PageShell kicker="GW–03 · Automations" title="Workflows That Kill the Headaches" lede={b.body}>
      <Section eyebrow="What we automate" title="The busywork runs itself." align="start">
        <p>
          Quoting, follow-up, invoicing, reviews — running on their own while you run the business.
          We wire the systems you already use into one flow that never forgets, never drops the ball,
          and hands you your data to own and leverage like no one else can.
        </p>
      </Section>

      <Section eyebrow="What you get" title="Hours back, every week." align="start">
        <div className="pg-grid">
          <div className="pg-panel"><h3>Quote → invoice</h3><p>From first touch to paid, the paperwork moves itself.</p></div>
          <div className="pg-panel"><h3>Follow-up that fires</h3><p>No lead goes cold; every review gets asked for.</p></div>
          <div className="pg-panel"><h3>Your data, unified</h3><p>One source of truth you own — not scattered across six apps.</p></div>
        </div>
      </Section>

      <Section eyebrow="Investment" title="Premium work. Honest price." align="center">
        <p className="price"><s>{b.anchor}</s> <strong>{b.price}</strong></p>
      </Section>
    </PageShell>
  )
}
