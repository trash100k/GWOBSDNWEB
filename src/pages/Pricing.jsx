import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { Link } from 'react-router-dom'
import { COPY } from '../brand.js'

// Pricing — the rates ledger as a full page. A specialist deepens this.
export default function Pricing() {
  return (
    <PageShell kicker="The Forge Runs Lean" title="Premium Work. Honest Prices." lede={COPY.rates.lede} cta={false}>
      <Section align="center" className="pg-rates">
        <ul className="rate-ledger">
          {COPY.arsenal.branches.map((b) => (
            <li key={b.id} className="rate-row">
              <span className="rate-tag">{b.tag}</span>
              <span className="rate-anchor">{b.anchor}</span>
              <span className="rate-price">{b.price}{b.note && <em> · {b.note}</em>}</span>
            </li>
          ))}
        </ul>
        <span className="rate-foot">{COPY.rates.foot}</span>
      </Section>

      <section className="pg-cta pg-measure">
        <h2 className="pg-cta-head flame">Start the Forge</h2>
        <p className="pg-lede">{COPY.finale.closer}</p>
        <Link className="cta cta--solid" to="/contact"><span>Start the Forge</span></Link>
        <span className="avail">{COPY.finale.avail}</span>
      </section>
    </PageShell>
  )
}
