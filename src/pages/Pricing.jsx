import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import BrandText from '../ui/BrandText.jsx'
import { Link } from 'react-router-dom'
import { COPY } from '../brand.js'

/**
 * /pricing — anchored transparency, sequenced outcome → number → reconciliation.
 *
 * The ledger reuses the GLOBAL .rate-ledger/.rate-row system (struck anchor +
 * ember "from" price) so it reads identically to the home rates beat. Everything
 * else is bespoke, namespaced under .pg-pricing-* per the page spec. Locked prices
 * (do not edit): Voice $499/mo · Web $1,299 · Automations $1,500 · Software $10,000.
 */

// The ledger — built from the locked anchor card. Each line: outcome label,
// struck "elsewhere" anchor, the ember "from" price, the model note.
const LINES = [
  {
    tag: 'Voice',
    line: 'A front desk that never clocks out.',
    anchor: 'An in-house receptionist: $48,000 / year',
    price: 'From $499',
    unit: '/mo',
    note: '+ one-time setup',
  },
  {
    tag: 'Web',
    line: 'A site built to book the truck.',
    anchor: 'Premium studios bill $50k+ for this',
    price: 'From $1,299',
    note: 'scoped, fixed price',
  },
  {
    tag: 'Automations',
    line: 'The busywork runs itself.',
    anchor: 'By hand: those hours, every week',
    price: 'From $1,500',
    note: 'project or retainer',
  },
  {
    tag: 'Software',
    line: 'Your own platform. Owned outright.',
    anchor: 'Agencies bill $75k + months of discovery',
    price: 'From $10,000',
    note: '$5k deposit to start',
  },
]

const INCLUDED = [
  ['Fixed scope, fixed price', 'We scope it once, in writing. The number does not move mid-build. No surprise invoices, no scope-creep tax.'],
  ['You own everything', 'Source code, accounts, and your data — handed over and open-sourced to you. No rented platform. No hostage situation.'],
  ['Working on day one', 'We ship live, not into a “phase two” that never lands. It runs the work before the final balance is due.'],
  ['You talk to the forge', 'No account managers, no ticket queue. You talk to the people who build it — direct, the whole way through.'],
]

const FAQ = [
  [
    'How long does it take?',
    'Most engagements move in weeks, not quarters. A voice agent or a web build lands in days to a couple of weeks; a custom software platform runs longer but ships in stages you can see — never a year of silence.',
  ],
  [
    'Do I own the code?',
    'Yes. Source code, infrastructure, and accounts are handed over and open-sourced to you. You are buying an asset you keep — not access to a platform we can switch off.',
  ],
  [
    'What is the deposit?',
    'Software starts with a $5,000 minimum deposit to lock scope and put the forge to work. Voice, Web, and Automations start without one — the productized lines you can transact on now.',
  ],
  [
    'Why is it cheaper than agencies?',
    'Because the forge is efficient, not because the work is cheap. We have systematized what agencies bill by the hour and the slide deck. You pay for the build — not for discovery theater, layers of management, or a year of meetings.',
  ],
  [
    'Are the prices final?',
    'The numbers are honest anchors — where each line starts. Every job is scoped to what you actually need, so the final figure is a short conversation, not a surprise. You will know it before any work begins.',
  ],
  [
    'How do you take payment?',
    'A deposit to start, the balance on delivery — fixed against the scope we agreed. Software is deposit-gated; the rest bill against milestones you can see ship.',
  ],
]

// Bespoke on-brand mark: a forged ledger/anvil sigil for the section dividers.
function ForgeMark() {
  return (
    <svg className="pg-pricing-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M8 16h48M8 32h48M8 48h32" />
      <path className="pg-pricing-mark-ember" d="M44 48h12" />
      <path d="M32 6v52" opacity="0.35" />
    </svg>
  )
}

export default function Pricing() {
  return (
    <PageShell
      kicker={COPY.rates.kicker}
      title="The Forge Runs Lean"
      lede="Premium work. Honest prices. You name the bottleneck — we put a number on ending it, before any work begins."
      cta={false}
    >
      {/* ── THE LEDGER ─────────────────────────────────────────────── */}
      <Section align="center" className="pg-pricing-ledger-sec">
        <span className="pg-pricing-rule" aria-hidden="true" />
        <ForgeMark />
        <h2 className="pg-h2">
          <BrandText text="Four lines. Every number anchored." />
        </h2>
        <p className="pg-pricing-ledger-lede">
          <BrandText text="What it costs elsewhere is struck through. What the forge charges is lit. No naked numbers — outcome first, then the price." />
        </p>

        <ul className="rate-ledger pg-pricing-ledger">
          {LINES.map((l) => (
            <li key={l.tag} className="rate-row pg-pricing-row">
              <span className="rate-tag">{l.tag}</span>
              <span className="pg-pricing-cell">
                <span className="pg-pricing-line">{l.line}</span>
                <span className="rate-anchor">{l.anchor}</span>
              </span>
              <span className="rate-price">
                {l.price}
                {l.unit && <span className="pg-pricing-unit">{l.unit}</span>}
                <em>{l.note}</em>
              </span>
            </li>
          ))}
        </ul>
        <span className="rate-foot">{COPY.rates.foot}</span>
      </Section>

      {/* ── THE RECONCILIATION ─────────────────────────────────────── */}
      <Section align="start" tone="panel" className="pg-pricing-recon">
        <span className="pg-pricing-eyebrow">Efficiency, not discount</span>
        <h2 className="pg-h2">Cheaper is the symptom. Efficient is the cause.</h2>
        <p>
          <BrandText text="You are not paying less for less. Automatic Execution means we have systematized what others bill by the hour — the quoting, the follow-up, the build scaffolding, the parts that run the same every time. The forge runs lean, so the price does." />
        </p>
        <div className="pg-pricing-ledger-split" aria-hidden="true">
          <div className="pg-pricing-split-col pg-pricing-split-them">
            <span className="pg-pricing-split-k">What you stop paying for</span>
            <ul>
              <li>Discovery-call theater</li>
              <li>Layers of account management</li>
              <li>A year of status meetings</li>
              <li>Billable hours on rote work</li>
            </ul>
          </div>
          <div className="pg-pricing-split-col pg-pricing-split-us">
            <span className="pg-pricing-split-k">What you pay for</span>
            <ul>
              <li>The build, scoped once</li>
              <li>A system that runs day one</li>
              <li>Code and data you own</li>
              <li>Direct line to the forge</li>
            </ul>
          </div>
        </div>
        <p className="pg-pricing-recon-foot">
          <BrandText text="The site you are reading proves it: studio-grade craft at a front-door price. That gap is the forge — not a discount." />
        </p>
      </Section>

      {/* ── WHAT'S INCLUDED + DEPOSIT TERMS ────────────────────────── */}
      <Section align="center" className="pg-pricing-included">
        <span className="pg-pricing-eyebrow">In every engagement</span>
        <h2 className="pg-h2">What the price buys.</h2>
        <div className="pg-pricing-incl-grid">
          {INCLUDED.map(([h, b], i) => (
            <article key={h} className="pg-pricing-incl-card">
              <span className="pg-pricing-incl-n">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="pg-pricing-incl-h">{h}</h3>
              <p className="pg-pricing-incl-b">
                <BrandText text={b} />
              </p>
            </article>
          ))}
        </div>

        <div className="pg-pricing-deposit">
          <div className="pg-pricing-deposit-bar" aria-hidden="true" />
          <div className="pg-pricing-deposit-body">
            <span className="pg-pricing-deposit-k">Deposit terms</span>
            <p className="pg-pricing-deposit-p">
              <BrandText text="Software builds start with a $5,000 minimum deposit — it locks scope and puts the forge to work. Fixed scope, fixed price: the figure is set before the first line ships and does not move. Voice, Web, and Automations start without a deposit." />
            </p>
          </div>
        </div>
      </Section>

      {/* ── FAQ (AEO) ──────────────────────────────────────────────── */}
      <Section align="start" className="pg-pricing-faq-sec">
        <span className="pg-pricing-eyebrow">Straight answers</span>
        <h2 className="pg-h2">Before you ask.</h2>
        <dl className="pg-pricing-faq">
          {FAQ.map(([q, a]) => (
            <div key={q} className="pg-pricing-faq-row">
              <dt className="pg-pricing-faq-q">{q}</dt>
              <dd className="pg-pricing-faq-a">
                <BrandText text={a} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="pg-cta pg-measure">
        <h2 className="pg-cta-head flame">Name the Number</h2>
        <p className="pg-lede">
          <BrandText text="Tell us the bottleneck. We put an honest price on ending it — fixed scope, fixed price, working on day one." />
        </p>
        <Link className="cta cta--solid" to="/contact">
          <span>Start the Forge</span>
        </Link>
        <span className="avail">{COPY.finale.avail}</span>
      </section>

      <style>{`
        /* ── /pricing — bespoke, namespaced (.pg-pricing-*) ───────────────── */

        .pg-pricing-eyebrow{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
          text-transform:uppercase; color:var(--gw-ember); margin-bottom:16px;}

        /* forged divider mark + hairline rule above the ledger */
        .pg-pricing-rule{display:block; width:clamp(48px,7vw,72px); height:2px; margin:0 auto;
          background:linear-gradient(90deg,var(--gw-forge),var(--gw-ember)); }
        .pg-pricing-mark{display:block; width:38px; height:38px; margin:18px auto 22px;
          fill:none; stroke:var(--gw-steel); stroke-width:1.5;
          stroke-linecap:square; stroke-linejoin:miter;}
        .pg-pricing-mark-ember{stroke:var(--gw-ember);}

        .pg-pricing-ledger-lede{max-width:54ch; margin:0 auto clamp(26px,4vh,42px) !important;}

        /* the ledger — reuses global .rate-ledger; we widen + add an outcome line.
           keep sharp corners, hard brutalist depth on the whole slab. */
        .pg-pricing-ledger{max-width:880px; border:1px solid rgba(141,153,174,0.25);
          border-top:2px solid var(--gw-forge);
          background:linear-gradient(180deg,rgba(31,40,51,0.34),rgba(11,12,16,0.34));
          box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
        .pg-pricing-row{grid-template-columns:minmax(104px,0.7fr) 1.6fr auto;
          padding-block:clamp(15px,2.4vh,22px); padding-inline:clamp(14px,2.4vw,26px);
          transition:background .18s var(--ease);}
        .pg-pricing-row:hover{background:rgba(232,93,4,0.06);}
        .pg-pricing-row .rate-tag{align-self:center;}
        .pg-pricing-cell{display:flex; flex-direction:column; gap:4px; text-align:left;}
        .pg-pricing-line{font-family:var(--gw-headline); font-weight:700; color:var(--gw-bone);
          font-size:clamp(0.98rem,1.7vw,1.16rem); line-height:1.22;}
        .pg-pricing-unit{font-size:0.62em; font-weight:600; color:var(--gw-steel);
          letter-spacing:0.02em; margin-left:1px; text-shadow:none;}

        /* ── reconciliation ── */
        .pg-pricing-recon .pg-pricing-eyebrow,
        .pg-pricing-recon .pg-h2{text-align:left;}
        .pg-pricing-recon{border-top:2px solid var(--gw-forge);}
        .pg-pricing-ledger-split{display:grid; grid-template-columns:1fr 1fr; gap:0;
          margin:clamp(28px,4vh,42px) 0 clamp(20px,3vh,30px);
          border:1px solid rgba(141,153,174,0.22);}
        .pg-pricing-split-col{padding:clamp(18px,2.6vw,28px);}
        .pg-pricing-split-them{border-right:1px solid rgba(141,153,174,0.22);}
        .pg-pricing-split-k{display:block; font-size:10.5px; letter-spacing:0.28em; font-weight:700;
          text-transform:uppercase; margin-bottom:14px;}
        .pg-pricing-split-them .pg-pricing-split-k{color:var(--gw-steel);}
        .pg-pricing-split-us .pg-pricing-split-k{color:var(--gw-ember);}
        .pg-pricing-ledger-split ul{list-style:none; margin:0; padding:0;
          display:flex; flex-direction:column; gap:9px;}
        .pg-pricing-ledger-split li{position:relative; padding-left:20px;
          font-size:clamp(0.92rem,1.4vw,1.02rem); line-height:1.32; color:var(--gw-bone);}
        .pg-pricing-ledger-split li::before{content:""; position:absolute; left:0; top:0.55em;
          width:9px; height:1.5px;}
        .pg-pricing-split-them li{color:rgba(141,153,174,0.78); text-decoration:line-through;
          text-decoration-color:rgba(193,41,46,0.45);}
        .pg-pricing-split-them li::before{background:rgba(141,153,174,0.5);}
        .pg-pricing-split-us li::before{background:var(--gw-ember);
          box-shadow:0 0 10px rgba(232,93,4,0.6);}
        .pg-pricing-recon-foot{margin-top:0 !important; color:var(--gw-steel);
          border-left:2px solid var(--gw-ember); padding-left:16px;}

        /* ── what's included ── */
        .pg-pricing-incl-grid{display:grid; grid-template-columns:repeat(2,1fr);
          gap:clamp(14px,1.8vw,22px); margin:clamp(26px,4vh,44px) 0 clamp(34px,5vh,52px);
          text-align:left;}
        .pg-pricing-incl-card{position:relative; padding:clamp(20px,2.6vw,30px);
          border:1px solid rgba(141,153,174,0.25); background:rgba(15,17,22,0.5);
          box-shadow:8px 8px 0 rgba(0,0,0,0.5), inset 0 0 40px rgba(227,74,39,0.06);
          transition:border-color .2s var(--ease), transform .2s var(--ease);}
        .pg-pricing-incl-card:hover{border-color:rgba(232,93,4,0.6); transform:translate(-1px,-1px);}
        .pg-pricing-incl-n{display:block; font-family:var(--gw-display); font-weight:900;
          font-size:0.95rem; letter-spacing:0.08em; color:var(--gw-forge); margin-bottom:10px;}
        .pg-pricing-incl-h{margin:0 0 8px; font-family:var(--gw-headline); font-weight:800;
          color:var(--gw-bone); font-size:clamp(1.06rem,1.7vw,1.28rem); line-height:1.15;}
        .pg-pricing-incl-b{margin:0; color:var(--gw-steel);
          font-size:clamp(0.95rem,1.4vw,1.04rem) !important; line-height:1.55 !important;}

        /* deposit terms — molten-edge call-out */
        .pg-pricing-deposit{display:grid; grid-template-columns:auto 1fr; align-items:stretch;
          text-align:left; border:1px solid rgba(141,153,174,0.3);
          background:linear-gradient(180deg,rgba(31,40,51,0.4),rgba(11,12,16,0.4));
          box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
        .pg-pricing-deposit-bar{width:6px; background:linear-gradient(180deg,var(--gw-forge),var(--gw-ember));}
        .pg-pricing-deposit-body{padding:clamp(20px,2.8vw,30px);}
        .pg-pricing-deposit-k{display:block; font-size:11px; letter-spacing:0.32em; font-weight:700;
          text-transform:uppercase; color:var(--gw-ember); margin-bottom:12px;}
        .pg-pricing-deposit-p{margin:0 !important; color:var(--gw-bone) !important;}

        /* ── FAQ ── */
        .pg-pricing-faq-sec .pg-pricing-eyebrow,
        .pg-pricing-faq-sec .pg-h2{text-align:left;}
        .pg-pricing-faq{margin:clamp(24px,4vh,40px) 0 0; border-top:1px solid rgba(141,153,174,0.22);}
        .pg-pricing-faq-row{display:grid; grid-template-columns:minmax(0,0.85fr) minmax(0,1.15fr);
          gap:clamp(12px,3vw,40px); padding:clamp(20px,3vh,30px) 0;
          border-bottom:1px solid rgba(141,153,174,0.16);}
        .pg-pricing-faq-q{margin:0; font-family:var(--gw-headline); font-weight:800;
          color:var(--gw-bone); font-size:clamp(1.08rem,1.9vw,1.4rem); line-height:1.18;
          letter-spacing:-0.01em;}
        .pg-pricing-faq-a{margin:0; color:var(--gw-steel);
          font-size:clamp(0.98rem,1.4vw,1.1rem); line-height:1.6;}

        /* ── responsive — read beautifully at 393px ── */
        @media (max-width:720px){
          .pg-pricing-incl-grid{grid-template-columns:1fr;}
          .pg-pricing-ledger-split{grid-template-columns:1fr;}
          .pg-pricing-split-them{border-right:none; border-bottom:1px solid rgba(141,153,174,0.22);}
          .pg-pricing-faq-row{grid-template-columns:1fr; gap:10px;}
        }
        @media (max-width:560px){
          /* keep the global .rate-row reflow but stack the outcome cell cleanly */
          .pg-pricing-row{grid-template-columns:1fr auto; gap:6px 14px;}
          .pg-pricing-row .rate-tag{grid-column:1; align-self:start;}
          .pg-pricing-cell{grid-column:1 / -1; order:3;}
          .pg-pricing-row .rate-price{grid-column:2; grid-row:1; text-align:right;}
        }
      `}</style>
    </PageShell>
  )
}
