import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Software')

// GW–01 Software. Phase-1 page on the shared shell; a specialist deepens this.
export default function Software() {
  return (
    <PageShell kicker="GW–01 · Software" title="Custom Software, Built to Run It All" lede={b.body}>
      <Section eyebrow="What we build" title="Internal tools and proprietary platforms." align="start">
        <p>
          We build the system your business actually runs on — not a template, not a rented SaaS you
          outgrow. Custom-built, fully documented, and open-sourced to you. The same forge that built
          YardWorx, built for how you operate.
        </p>
      </Section>

      <Section eyebrow="What you get" title="You own every bolt." align="start">
        <div className="pg-grid">
          <div className="pg-panel"><h3>Proprietary platform</h3><p>Built around your workflow, not bent to fit someone else’s.</p></div>
          <div className="pg-panel"><h3>Open-sourced to you</h3><p>The code is yours — documented, handed over, never held hostage.</p></div>
          <div className="pg-panel"><h3>Your data, leveraged</h3><p>Own it and put it to work like no rented tool will let you.</p></div>
        </div>
      </Section>

      <Section eyebrow="Investment" title="Premium work. Honest price." align="center">
        <p className="price"><s>{b.anchor}</s> <strong>{b.price}</strong> · {b.note}</p>
      </Section>
    </PageShell>
  )
}
