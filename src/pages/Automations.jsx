import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import BrandText from '../ui/BrandText.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Automations')

// The hours-per-week the manual grind eats — the "busywork tax".
const TAX = [
  { hrs: '6', label: 'Quoting by hand', note: 'Retyping the same numbers into a doc, then chasing a signature.' },
  { hrs: '5', label: 'Follow-up that slips', note: 'Hot leads go cold because nobody had time to chase them.' },
  { hrs: '4', label: 'Invoicing & chasing pay', note: 'Building invoices twice, then hunting down the overdue ones.' },
  { hrs: '3', label: 'Begging for reviews', note: 'Forgetting to ask — so the 5-star jobs stay invisible.' },
]

// The six apps that don't talk to each other — "six apps, one mess".
const APPS = ['Inbox', 'Spreadsheet', 'Quote PDF', 'Calendar', 'Invoicing', 'Notes app']

// What we automate — the three core flows.
const FLOWS = [
  {
    id: 'A',
    name: 'Quote → Invoice',
    line: 'One trail from first touch to paid.',
    body: 'The lead lands, the quote builds itself from your numbers, the job converts to an invoice the second it’s approved — and the paperwork never gets keyed in twice.',
    steps: ['Lead in', 'Quote out', 'Approved', 'Invoiced', 'Paid'],
  },
  {
    id: 'B',
    name: 'Follow-up That Fires',
    line: 'No lead goes cold. Ever.',
    body: 'Every estimate that goes quiet gets chased on a schedule. No-shows get a nudge. The deal you’d have forgotten about books itself while you’re on the truck.',
    steps: ['Sent', 'Silent', 'Nudge', 'Re-engaged', 'Booked'],
  },
  {
    id: 'C',
    name: 'Reviews on Autopilot',
    line: 'Every 5-star job, asked for.',
    body: 'The moment a job closes, the review request fires to the happiest customers — timed right, worded right — so your reputation compounds without you lifting a finger.',
    steps: ['Job done', 'Timed ask', 'Reviewed', 'Ranked', 'Found'],
  },
]

// How it works — the build path.
const PROCESS = [
  { n: '01', head: 'Map the grind', body: 'We trace one job end-to-end and mark every place a human re-types, copies, or chases. The leaks are obvious once they’re on paper.' },
  { n: '02', head: 'Wire the flow', body: 'We connect the tools you already pay for into one trail — no rip-and-replace. It runs in days, not a quarter.' },
  { n: '03', head: 'Prove it live', body: 'It goes live on your real work, runs the busywork, and we watch it for a week. No pilot that rots in “phase two.”' },
  { n: '04', head: 'Hand you the keys', body: 'You own the system and the data underneath it — documented, exportable, yours. We don’t hold it hostage.' },
]

export default function Automations() {
  return (
    <PageShell
      kicker="GW–03 · Automations"
      title="The Busywork Runs Itself"
      lede="Quoting, follow-up, invoicing, reviews — wired into one flow that never forgets, never drops the ball, and hands you your data to own. The same automations that run our own shops, built for yours."
    >
      <style>{AUTO_CSS}</style>

      {/* ── 1 · THE BUSYWORK TAX ──────────────────────────────────────── */}
      <Section eyebrow="The Busywork Tax" title="You’re paying it every week." align="start">
        <p>
          Nobody quoted you for it, but it’s the most expensive line on your books: the hours your
          team burns moving the same information between six apps that don’t talk. Add it up.
        </p>

        <div className="pg-auto-tax" role="list">
          {TAX.map((t) => (
            <div className="pg-auto-tax-row" role="listitem" key={t.label}>
              <div className="pg-auto-tax-hrs">
                <span className="pg-auto-tax-num">{t.hrs}</span>
                <span className="pg-auto-tax-unit">hrs / wk</span>
              </div>
              <div className="pg-auto-tax-body">
                <h3 className="pg-auto-tax-label">{t.label}</h3>
                <p className="pg-auto-tax-note">{t.note}</p>
              </div>
              <div className="pg-auto-tax-bar" aria-hidden="true">
                <i style={{ width: `${(Number(t.hrs) / 6) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="pg-auto-tax-total">
            <span className="pg-auto-tax-total-label">The tab</span>
            <span className="pg-auto-tax-total-num">≈ 18 hrs / week</span>
            <span className="pg-auto-tax-total-note">Two full days, gone to admin — every single week.</span>
          </div>
        </div>

        {/* six apps, one mess */}
        <div className="pg-auto-mess">
          <span className="pg-auto-mess-kick">Six apps. One mess.</span>
          <div className="pg-auto-mess-grid" aria-hidden="true">
            {APPS.map((a) => (
              <span className="pg-auto-chip" key={a}>{a}</span>
            ))}
          </div>
          <p className="pg-auto-mess-note">
            Each one holds a piece of the job. None of them holds the whole thing. The glue is you.
          </p>
        </div>
      </Section>

      {/* ── 2 · WHAT WE AUTOMATE ──────────────────────────────────────── */}
      <Section eyebrow="What We Automate" title="Three flows that end the grind." align="start">
        <p>
          We don’t hand you another dashboard to babysit. We wire the work itself so it moves on its
          own — start to finish, no one re-typing a thing.
        </p>

        <div className="pg-auto-flows">
          {FLOWS.map((f) => (
            <article className="pg-auto-flow" key={f.id}>
              <header className="pg-auto-flow-head">
                <span className="pg-auto-flow-id">{f.id}</span>
                <div>
                  <h3 className="pg-auto-flow-name">{f.name}</h3>
                  <p className="pg-auto-flow-line">{f.line}</p>
                </div>
              </header>
              <p className="pg-auto-flow-body">{f.body}</p>
              <ol className="pg-auto-pipe" aria-label={`${f.name} pipeline`}>
                {f.steps.map((s, i) => (
                  <li className="pg-auto-pipe-step" key={s}>
                    <span className="pg-auto-pipe-dot" aria-hidden="true">{i + 1}</span>
                    <span className="pg-auto-pipe-label">{s}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </Section>

      {/* ── 3 · YOUR DATA, UNIFIED & OWNED ────────────────────────────── */}
      <Section eyebrow="Your Data, Unified" title="One source of truth — and it’s yours." align="start" tone="panel">
        <p>
          Most automations lock your business inside someone else’s tool. We do the opposite. Every
          flow we build feeds one clean ledger of your customers, jobs, and money — and you own it
          outright. Documented. Exportable. Never held hostage.
        </p>

        <div className="pg-auto-unify">
          <svg className="pg-auto-unify-svg" viewBox="0 0 360 220" role="img"
               aria-label="Six scattered tools converging into one owned source of truth">
            {/* scattered sources (left) → core (right) */}
            <g className="pg-auto-u-lines" fill="none" stroke="#8D99AE" strokeWidth="1.5">
              <path d="M40 24 C150 24 180 100 286 110" />
              <path d="M40 64 C150 64 180 102 286 110" />
              <path d="M40 104 C150 104 200 108 286 110" />
              <path d="M40 144 C150 144 200 116 286 110" />
              <path d="M40 184 C150 184 180 120 286 110" />
              <path d="M40 200 C160 200 180 130 286 110" />
            </g>
            {[24, 64, 104, 144, 184, 200].map((y, i) => (
              <g key={y}>
                <rect x="8" y={y - 9} width="34" height="18" fill="none" stroke="#8D99AE" strokeWidth="1.5" />
                <rect x="8" y={y - 9} width="34" height="18" fill="#1F2833" opacity="0.5" />
              </g>
            ))}
            {/* the owned core */}
            <g className="pg-auto-u-core">
              <rect x="286" y="78" width="64" height="64" fill="none" stroke="#C1292E" strokeWidth="2" />
              <rect x="286" y="78" width="64" height="64" fill="#E85D04" opacity="0.08" />
              <path d="M318 92 l18 12 v20 l-18 12 -18-12 v-20 z" fill="none" stroke="#E85D04" strokeWidth="1.5" />
              <circle cx="318" cy="114" r="4" fill="#E85D04" />
            </g>
            <text x="318" y="166" textAnchor="middle" className="pg-auto-u-tag">OWNED</text>
          </svg>

          <ul className="pg-auto-own">
            <li><strong>One source of truth.</strong> Not scattered across six logins — assembled, every time, automatically.</li>
            <li><strong>You hold the keys.</strong> Full export, full access. Walk away with everything if you ever choose to.</li>
            <li><strong>Leverage no one else has.</strong> Your own history, ready to mine — quote faster, follow up smarter, see what actually pays.</li>
          </ul>
        </div>
      </Section>

      {/* ── 4 · BEFORE vs AFTER ───────────────────────────────────────── */}
      <Section eyebrow="The Shift" title="From scramble to system." align="start">
        <div className="pg-auto-vs">
          <div className="pg-auto-vs-col pg-auto-vs-before">
            <span className="pg-auto-vs-tag">Before</span>
            <ul>
              <li>Quote retyped into three places</li>
              <li>Leads chased when you remember</li>
              <li>Invoices built twice, paid late</li>
              <li>Reviews? When you get around to it</li>
              <li>The truth lives in your head</li>
            </ul>
          </div>
          <div className="pg-auto-vs-arrow" aria-hidden="true">
            <svg viewBox="0 0 64 24" role="presentation">
              <path d="M2 12 H56" fill="none" stroke="#E85D04" strokeWidth="2" />
              <path d="M48 5 L60 12 L48 19" fill="none" stroke="#E85D04" strokeWidth="2" />
            </svg>
          </div>
          <div className="pg-auto-vs-col pg-auto-vs-after">
            <span className="pg-auto-vs-tag">After</span>
            <ul>
              <li>Quote builds itself, once</li>
              <li>Every lead chased on schedule</li>
              <li>Invoice fires on approval, paid on time</li>
              <li>Reviews ask themselves at the right moment</li>
              <li>The truth lives in a ledger you own</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 5 · HOW IT WORKS ──────────────────────────────────────────── */}
      <Section eyebrow="How It Works" title="Wired in days, not a quarter." align="start">
        <div className="pg-auto-proc">
          {PROCESS.map((p) => (
            <div className="pg-auto-proc-step" key={p.n}>
              <span className="pg-auto-proc-n">{p.n}</span>
              <div className="pg-auto-proc-body">
                <h3 className="pg-auto-proc-head">{p.head}</h3>
                <p className="pg-auto-proc-text">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 6 · INVESTMENT ────────────────────────────────────────────── */}
      <Section eyebrow="Investment" title="One build pays for itself." align="center">
        <div className="pg-auto-price">
          <div className="pg-auto-price-anchor">
            <span className="pg-auto-price-x">{b.anchor}</span>
          </div>
          <div className="pg-auto-price-main">
            <span className="pg-auto-price-from">From</span>
            <span className="pg-auto-price-num">$1,500</span>
          </div>
          <span className="pg-auto-price-range">Project or retainer · $1,500–$5,000</span>
          <p className="pg-auto-price-note">
            Win back two days a week and you’ve paid for the build inside a month. Fixed scope, fixed
            price — the forge runs lean, so you don’t pay agency rates to systematize what we’ve
            already systematized.
          </p>
        </div>
      </Section>
    </PageShell>
  )
}

const AUTO_CSS = `
.pg-auto-tax{margin:clamp(28px,4vh,46px) 0 0; border-top:1px solid rgba(141,153,174,0.22);}
.pg-auto-tax-row{display:grid; grid-template-columns:auto 1fr; gap:clamp(14px,2.4vw,28px);
  align-items:start; padding:clamp(18px,2.6vw,26px) 0;
  border-bottom:1px solid rgba(141,153,174,0.18);}
.pg-auto-tax-hrs{display:flex; flex-direction:column; align-items:flex-start; min-width:74px;}
.pg-auto-tax-num{font-family:var(--gw-display); font-weight:900; line-height:0.9;
  font-size:clamp(2.2rem,6vw,3.4rem); color:var(--gw-ember);}
.pg-auto-tax-unit{font-size:9.5px; letter-spacing:0.32em; text-transform:uppercase;
  color:var(--gw-steel); margin-top:6px;}
.pg-auto-tax-label{margin:0 0 6px; font-family:var(--gw-headline); font-weight:800;
  color:var(--gw-bone); font-size:clamp(1.1rem,2.4vw,1.42rem); line-height:1.1;}
.pg-auto-tax-note{margin:0; font-size:clamp(0.95rem,1.4vw,1.05rem) !important; line-height:1.55;
  color:var(--gw-steel);}
.pg-auto-tax-bar{grid-column:2; height:3px; margin-top:14px; background:rgba(141,153,174,0.16);}
.pg-auto-tax-bar i{display:block; height:100%;
  background:linear-gradient(90deg,var(--gw-forge),var(--gw-ember));}
.pg-auto-tax-total{margin-top:clamp(22px,3vh,34px); padding:clamp(20px,3vw,30px);
  border:1px solid rgba(193,41,46,0.5); background:rgba(193,41,46,0.06);
  box-shadow:8px 8px 0 #000; display:flex; flex-direction:column; gap:6px;}
.pg-auto-tax-total-label{font-size:10px; letter-spacing:0.34em; text-transform:uppercase;
  color:var(--gw-steel); font-weight:700;}
.pg-auto-tax-total-num{font-family:var(--gw-display); font-weight:900;
  font-size:clamp(1.7rem,5vw,2.6rem); color:var(--gw-bone); line-height:1;}
.pg-auto-tax-total-note{font-size:clamp(0.95rem,1.4vw,1.05rem); color:var(--gw-steel);}

.pg-auto-mess{margin-top:clamp(40px,6vh,68px);}
.pg-auto-mess-kick{display:block; font-size:11px; letter-spacing:0.34em; text-transform:uppercase;
  font-weight:800; color:var(--gw-forge); margin-bottom:clamp(16px,2vw,22px);}
.pg-auto-mess-grid{display:flex; flex-wrap:wrap; gap:10px;}
.pg-auto-chip{display:inline-flex; align-items:center; padding:9px 16px;
  border:1px solid rgba(141,153,174,0.4); background:rgba(31,40,51,0.4);
  font-size:0.82rem; letter-spacing:0.06em; color:var(--gw-bone);
  font-family:var(--gw-headline); font-weight:700;}
.pg-auto-mess-note{margin:clamp(16px,2vw,22px) 0 0 !important; max-width:52ch;}

.pg-auto-flows{margin-top:clamp(30px,4vh,46px); display:grid; gap:0;
  border-top:1px solid rgba(141,153,174,0.22);}
.pg-auto-flow{padding:clamp(26px,3.4vw,40px) 0;
  border-bottom:1px solid rgba(141,153,174,0.18);}
.pg-auto-flow-head{display:flex; align-items:center; gap:clamp(16px,2.4vw,26px); margin-bottom:16px;}
.pg-auto-flow-id{display:inline-flex; align-items:center; justify-content:center;
  width:clamp(46px,6vw,58px); height:clamp(46px,6vw,58px); flex:none;
  border:1.5px solid var(--gw-forge); color:var(--gw-ember);
  font-family:var(--gw-display); font-weight:900; font-size:clamp(1.3rem,3vw,1.7rem);
  box-shadow:6px 6px 0 #000;}
.pg-auto-flow-name{margin:0; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.25rem,3vw,1.7rem); line-height:1.05;}
.pg-auto-flow-line{margin:4px 0 0 !important; font-size:0.95rem !important; color:var(--gw-ember);
  letter-spacing:0.02em; font-weight:600;}
.pg-auto-flow-body{margin:0 0 clamp(20px,2.6vw,28px) !important; max-width:62ch;}
.pg-auto-pipe{list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap;
  align-items:center; gap:0;}
.pg-auto-pipe-step{display:inline-flex; align-items:center; gap:10px;
  padding:8px 14px; border:1px solid rgba(141,153,174,0.32);
  background:rgba(11,12,16,0.5); margin:0 -1px -1px 0;}
.pg-auto-pipe-dot{display:inline-flex; align-items:center; justify-content:center;
  width:20px; height:20px; flex:none; border:1px solid var(--gw-ember);
  color:var(--gw-ember); font-size:11px; font-weight:800; font-family:var(--gw-headline);}
.pg-auto-pipe-label{font-size:0.82rem; letter-spacing:0.02em; color:var(--gw-bone);
  font-family:var(--gw-headline); font-weight:700; white-space:nowrap;}
.pg-auto-pipe-step:not(:last-child)::after{content:"›"; margin-left:6px; color:var(--gw-ember);
  font-size:1.1rem; line-height:0; font-weight:700;}

.pg-auto-unify{margin-top:clamp(26px,3.4vw,40px); display:grid; gap:clamp(24px,4vw,44px);
  grid-template-columns:minmax(0,1fr); align-items:center;}
.pg-auto-unify-svg{width:100%; max-width:420px; height:auto; display:block; margin-inline:auto;}
.pg-auto-u-core{animation:pgAutoPulse 2.6s ease-in-out infinite alternate;}
@keyframes pgAutoPulse{from{opacity:0.78}to{opacity:1}}
.pg-auto-u-tag{fill:var(--gw-steel); font-family:var(--gw-headline); font-weight:800;
  font-size:11px; letter-spacing:0.26em;}
.pg-auto-own{list-style:none; margin:0; padding:0; display:grid; gap:clamp(14px,2vw,20px);}
.pg-auto-own li{position:relative; padding-left:22px; font-size:clamp(1rem,1.5vw,1.12rem);
  line-height:1.55; color:var(--gw-steel);}
.pg-auto-own li::before{content:""; position:absolute; left:0; top:0.55em; width:9px; height:9px;
  background:var(--gw-ember); box-shadow:0 0 10px rgba(232,93,4,0.6);}
.pg-auto-own strong{color:var(--gw-bone); font-weight:700;}

.pg-auto-vs{margin-top:clamp(20px,3vh,32px); display:grid; gap:0;
  grid-template-columns:1fr; align-items:stretch;}
.pg-auto-vs-col{border:1px solid rgba(141,153,174,0.25); padding:clamp(22px,3vw,32px);
  margin:0 0 -1px 0;}
.pg-auto-vs-before{background:rgba(31,40,51,0.32);}
.pg-auto-vs-after{border-color:rgba(193,41,46,0.55); background:rgba(193,41,46,0.05);
  box-shadow:8px 8px 0 #000;}
.pg-auto-vs-tag{display:block; font-size:10.5px; letter-spacing:0.34em; text-transform:uppercase;
  font-weight:800; margin-bottom:16px;}
.pg-auto-vs-before .pg-auto-vs-tag{color:var(--gw-steel);}
.pg-auto-vs-after .pg-auto-vs-tag{color:var(--gw-ember);}
.pg-auto-vs-col ul{list-style:none; margin:0; padding:0; display:grid; gap:11px;}
.pg-auto-vs-col li{position:relative; padding-left:20px; font-size:clamp(0.96rem,1.4vw,1.06rem);
  line-height:1.45; color:var(--gw-steel);}
.pg-auto-vs-before li::before{content:"×"; position:absolute; left:0; top:-1px;
  color:var(--gw-steel); font-weight:700;}
.pg-auto-vs-after li{color:var(--gw-bone);}
.pg-auto-vs-after li::before{content:"✓"; position:absolute; left:0; top:0;
  color:var(--gw-ember); font-weight:700;}
.pg-auto-vs-arrow{display:flex; align-items:center; justify-content:center; padding:14px 0;}
.pg-auto-vs-arrow svg{width:54px; height:auto; transform:rotate(90deg);}

.pg-auto-proc{margin-top:clamp(24px,3vh,34px); display:grid; gap:0;
  border-top:1px solid rgba(141,153,174,0.22);}
.pg-auto-proc-step{display:grid; grid-template-columns:auto 1fr; gap:clamp(16px,2.6vw,30px);
  align-items:start; padding:clamp(20px,2.8vw,30px) 0;
  border-bottom:1px solid rgba(141,153,174,0.18);}
.pg-auto-proc-n{font-family:var(--gw-display); font-weight:900; line-height:0.85;
  font-size:clamp(2rem,5vw,2.9rem); color:rgba(232,93,4,0.85); min-width:1.6em;}
.pg-auto-proc-head{margin:0 0 8px; font-family:var(--gw-headline); font-weight:800;
  color:var(--gw-bone); font-size:clamp(1.14rem,2.4vw,1.42rem); line-height:1.08;}
.pg-auto-proc-text{margin:0 !important; max-width:60ch;}

.pg-auto-price{display:flex; flex-direction:column; align-items:center;
  margin-top:clamp(14px,2vh,24px); padding:clamp(30px,4.5vw,52px) clamp(22px,3vw,40px);
  border:1px solid rgba(193,41,46,0.5); background:rgba(11,12,16,0.5);
  box-shadow:8px 8px 0 #000; max-width:620px; margin-inline:auto;}
.pg-auto-price-anchor{margin-bottom:12px;}
.pg-auto-price-x{font-size:clamp(0.92rem,1.5vw,1.04rem); color:var(--gw-steel);
  text-decoration:line-through; text-decoration-color:rgba(193,41,46,0.7);}
.pg-auto-price-main{display:flex; align-items:baseline; gap:14px;}
.pg-auto-price-from{font-size:11px; letter-spacing:0.34em; text-transform:uppercase;
  font-weight:800; color:var(--gw-steel);}
.pg-auto-price-num{font-family:var(--gw-display); font-weight:900; line-height:0.9;
  font-size:clamp(3rem,11vw,5rem); color:var(--gw-ember);
  text-shadow:0 0 28px rgba(232,93,4,0.4);}
.pg-auto-price-range{margin-top:14px; font-size:11px; letter-spacing:0.22em; text-transform:uppercase;
  font-weight:700; color:var(--gw-bone);}
.pg-auto-price-note{margin:clamp(18px,2.4vw,26px) 0 0 !important; max-width:54ch;
  text-align:center;}

@media (min-width:760px){
  .pg-auto-unify{grid-template-columns:0.85fr 1fr;}
  .pg-auto-unify-svg{margin-inline:0;}
  .pg-auto-vs{grid-template-columns:1fr auto 1fr; align-items:start;}
  .pg-auto-vs-col{margin:0 -1px 0 0;}
  .pg-auto-vs-after{margin-left:8px;}
  .pg-auto-vs-arrow{padding:0 clamp(8px,1.4vw,18px); align-self:center;}
  .pg-auto-vs-arrow svg{transform:none; width:48px;}
}
`
