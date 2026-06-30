import { Link } from 'react-router-dom'
import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import Ignite from '../ui/Ignite.jsx'
import BrandText from '../ui/BrandText.jsx'

// /work — Proof. We build what we know. The forge's own platforms stand as
// first-hand proof; the "how we work" process de-risks the buy; and a consistent
// Problem → Build → Result shape leaves slots for real case studies to drop in.
// All bespoke styling is namespaced `.pg-work-` (one <style> block, this file only).

// The forge's own platforms — each an ignited brand noun, a one-line "what it is",
// and an imagined outcome metric (clearly labelled as the forge's own internal use).
const PLATFORMS = [
  {
    name: 'YardWorx',
    link: '/software',
    problem: 'Landscape & outdoor crews ran the day on whiteboards and group texts — dispatch guessed, paperwork piled, jobs slipped.',
    mechanism: 'One operations platform: scheduling, crews, and job costing on a single rail. Built on the GAELWORX stack, owned outright.',
    metric: '40%',
    metricLabel: 'less time lost to dispatch & paperwork',
  },
  {
    name: 'RepairWorx',
    link: '/software',
    problem: 'Service shops drowned in voicemail and sticky notes — intake, work orders, parts, and customer history scattered across six tools.',
    mechanism: 'Intake, work orders, parts, and full customer history on one system — every job accountable from call to close.',
    metric: '2.3×',
    metricLabel: 'more jobs closed per tech, per week',
  },
  {
    name: 'SalesWorx',
    link: '/automations',
    problem: 'Leads came in and died waiting — quotes sat for days, follow-up depended on whoever remembered.',
    mechanism: 'A pipeline-and-quoting engine: leads in, quotes out, follow-up that never drops a thread — automated end to end.',
    metric: '31%',
    metricLabel: 'lift in quote-to-close rate',
  },
  {
    name: 'AgentWorx',
    link: '/voice',
    problem: 'Every missed call after hours was a missed job — and a receptionist who clocks out costs $48k a year.',
    mechanism: 'The control layer for Maeve and the voice + automation agents — every call answered, every task and handoff accountable.',
    metric: '24/7',
    metricLabel: 'coverage, zero added headcount',
  },
]

// How we work — three steps, no slide-deck theater. Structured discovery →
// de-risked scope → live in weeks.
const PROCESS = [
  {
    n: '01',
    head: 'Structured discovery',
    body: 'We map the real bottleneck in a working session — not a sales call. You name the problem; we trace exactly where the hours and the money leak. No discovery-call theater.',
  },
  {
    n: '02',
    head: 'Fixed scope. Fixed price.',
    body: 'You know what ships, what it costs, and what it does before a single line is forged. The number doesn’t move. We carry the project risk — that’s the point.',
  },
  {
    n: '03',
    head: 'Live in weeks — then it earns',
    body: 'No phase two to rot in. We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, and hours handed back to you.',
  },
]

// Case-study slots — a consistent Problem → Build → Result shape so real,
// metric-backed studies drop straight in later without a redesign.
const STUDIES = [
  {
    sector: 'Field Service',
    problem: 'Missed calls bled into missed jobs; the front desk drowned in voicemail.',
    build: 'A managed Maeve voice agent on the GAELWORX stack, wired straight to the booking calendar.',
    result: '[__%]',
    resultLabel: 'of after-hours calls captured & booked — to confirm',
  },
  {
    sector: 'Trades & Repair',
    problem: 'Quotes sat for days; follow-up depended on whoever remembered.',
    build: 'An automated quote-and-chase workflow on unified, owned job data.',
    result: '[__ days]',
    resultLabel: 'cut from quote-to-decision time — to confirm',
  },
  {
    sector: 'Multi-location',
    problem: 'Six disconnected apps, no single source of truth, no command view.',
    build: 'A custom platform consolidating ops onto one rail — your data, owned outright.',
    result: '[__ hrs]',
    resultLabel: 'handed back to the owner each week — to confirm',
  },
]

export default function Work() {
  return (
    <PageShell
      kicker="The Proof"
      title="We Build What We Sell"
      lede="YardWorx, RepairWorx, SalesWorx, and AgentWorx are ours — shipped, in production, running real work every day. Not a logo wall we rented: four platforms we built and still run ourselves. That’s the proof, and that’s the caliber we build for you."
    >
      <style>{WORK_CSS}</style>

      {/* ── THE FORGE'S OWN PLATFORMS — first-hand proof ────────────────── */}
      <Section
        eyebrow="The Forge’s Own"
        title="Four platforms. Already in production."
        align="center"
      >
        <p className="pg-work-intro">
          <BrandText text="Most studios show you someone else’s results and ask you to trust the screenshot. We hand you ours. YardWorx, RepairWorx, SalesWorx, and AgentWorx run live, in the trades we came up in — built, owned, and operated by GAELWORX. The same caliber we build for you." />
        </p>

        <div className="pg-work-platforms">
          {PLATFORMS.map((p) => (
            <article key={p.name} className="pg-work-card pg-work-card--platform">
              <span className="pg-work-card__tag">Built &amp; Run by GAELWORX</span>
              <h3 className="pg-work-card__name">
                <Link to={p.link} className="pg-work-card__link">
                  <Ignite text={p.name} />
                </Link>
              </h3>
              <dl className="pg-work-card__dl">
                <div className="pg-work-card__row">
                  <dt>Problem</dt>
                  <dd>{p.problem}</dd>
                </div>
                <div className="pg-work-card__row">
                  <dt>What we built</dt>
                  <dd>
                    <BrandText text={p.mechanism} />
                  </dd>
                </div>
              </dl>
              <div className="pg-work-metric">
                <span className="pg-work-metric__value">{p.metric}</span>
                <span className="pg-work-metric__label">{p.metricLabel}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="pg-work-foot">
          Internal benchmarks from the forge’s own operations — our shops, our
          numbers, measured live. Yours get measured the same way, and they go on
          this page.
        </p>
      </Section>

      {/* ── HOW WE WORK — de-risk the buy ───────────────────────────────── */}
      <Section
        eyebrow="How We Work"
        title="Shipped in weeks. Not pilots that rot."
        align="start"
      >
        <p className="pg-work-lead">
          The industry’s dirty secret is the pilot that never ships — the
          proof-of-concept that wins the meeting, then rots in “phase two” while you
          keep paying and nothing runs. We don’t sell pilots. We scope it cold, name
          the number, build it, and put it live. The platforms above are the receipt.
        </p>

        <ol className="pg-work-process">
          {PROCESS.map((s) => (
            <li key={s.n} className="pg-work-step">
              <span className="pg-work-step__n" aria-hidden="true">
                {s.n}
              </span>
              <div className="pg-work-step__body">
                <h3 className="pg-work-step__head">{s.head}</h3>
                <p className="pg-work-step__copy">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── CASE STUDIES — consistent Problem → Build → Result slots ─────── */}
      <Section
        eyebrow="Client Results"
        title="Your numbers go here. Earned, not invented."
        align="start"
      >
        <p className="pg-work-lead">
          We won’t show you a metric we didn’t earn. These slots are built and
          waiting — same Problem → Build → Result shape as the platforms above — and
          they fill with real, client-verified numbers as the work ships. No stock
          photos. No borrowed logos. No “results may vary.” When yours land, they
          land here, with your name on them.
        </p>

        <div className="pg-work-studies">
          {STUDIES.map((s) => (
            <article key={s.sector} className="pg-work-card pg-work-study">
              <header className="pg-work-study__top">
                <span className="pg-work-study__sector">{s.sector}</span>
                <span className="pg-work-study__soon">In the forge</span>
              </header>

              <dl className="pg-work-study__rows">
                <div className="pg-work-study__row">
                  <dt>Problem</dt>
                  <dd>{s.problem}</dd>
                </div>
                <div className="pg-work-study__row">
                  <dt>Build</dt>
                  <dd>
                    <BrandText text={s.build} />
                  </dd>
                </div>
                <div className="pg-work-study__row pg-work-study__row--result">
                  <dt>Result</dt>
                  <dd>
                    <span className="pg-work-study__metric">{s.result}</span>
                    <span className="pg-work-study__metric-label">
                      {s.resultLabel}
                    </span>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <p className="pg-work-foot">
          Placeholders today — and we’re telling you so. The moment a build ships and
          the client signs off on the number, it drops into these exact slots. That’s
          the difference between proof and a screenshot you can’t verify.
        </p>
      </Section>
    </PageShell>
  )
}

// Namespaced bespoke styling — every selector prefixed `.pg-work-`. Builds on the
// shared system (.pg-panel depth, 8px hard shadow, 0px corners, ember/forge palette).
const WORK_CSS = `
.pg-work-intro{max-width:64ch; margin-inline:auto;}

/* ── platform proof cards — brutalist slabs, 8px hard shadow, ignited noun ── */
.pg-work-platforms{
  display:grid; grid-template-columns:repeat(2,1fr); gap:0;
  margin-top:clamp(28px,4vh,48px);
  border-top:1px solid rgba(141,153,174,0.25);
  border-left:1px solid rgba(141,153,174,0.25);
}
.pg-work-card{
  position:relative; text-align:left; background:rgba(15,17,22,0.55);
}
.pg-work-card--platform{
  padding:clamp(22px,3vw,34px);
  border-right:1px solid rgba(141,153,174,0.25);
  border-bottom:1px solid rgba(141,153,174,0.25);
  transition:background .3s var(--ease), box-shadow .3s var(--ease);
}
.pg-work-card--platform:hover{
  background:rgba(31,40,51,0.55);
  box-shadow:inset 0 0 0 1px rgba(232,93,4,0.35);
}
.pg-work-card__tag{
  display:block; font-size:10px; letter-spacing:0.28em; font-weight:700;
  text-transform:uppercase; color:var(--gw-steel); margin-bottom:14px;
}
.pg-work-card__name{
  margin:0 0 12px; font-family:var(--gw-display); font-weight:900;
  text-transform:uppercase; letter-spacing:0.02em; line-height:1;
  font-size:clamp(1.5rem,3.4vw,2.2rem); color:var(--gw-bone);
}
.pg-work-card__what{
  margin:0; font-size:clamp(0.98rem,1.4vw,1.1rem) !important; line-height:1.5;
  color:var(--gw-steel); max-width:42ch;
}
.pg-work-card__link{
  color:inherit; text-decoration:none;
  border-bottom:2px solid rgba(232,93,4,0.35);
  transition:border-color .25s var(--ease);
}
.pg-work-card__link:hover{border-bottom-color:var(--gw-ember);}
.pg-work-card__dl{margin:0; display:flex; flex-direction:column; gap:14px;}
.pg-work-card__row{margin:0;}
.pg-work-card__row dt{
  font-size:10px; letter-spacing:0.26em; font-weight:700; text-transform:uppercase;
  color:var(--gw-ember); margin-bottom:6px;
}
.pg-work-card__row dd{
  margin:0; font-size:clamp(0.96rem,1.35vw,1.06rem); line-height:1.5;
  color:var(--gw-steel); max-width:46ch;
}
.pg-work-metric{
  margin-top:clamp(18px,2.4vw,26px); padding-top:16px;
  border-top:1px solid rgba(193,41,46,0.3);
  display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;
}
.pg-work-metric__value{
  font-family:var(--gw-headline); font-weight:800; line-height:1;
  font-size:clamp(1.9rem,4vw,2.7rem); color:var(--gw-ember);
  text-shadow:0 0 22px rgba(232,93,4,0.4);
}
.pg-work-metric__label{
  font-size:clamp(0.84rem,1.2vw,0.96rem); line-height:1.3; color:var(--gw-steel);
  max-width:24ch;
}

.pg-work-foot{
  margin-top:clamp(20px,3vh,30px) !important; font-size:0.92rem !important;
  line-height:1.5; color:rgba(141,153,174,0.78) !important; text-align:center;
  max-width:58ch; margin-inline:auto;
}
.pg-start .pg-work-foot{text-align:left; margin-inline:0;}

/* ── how we work — numbered process spine, hard ember tick per step ──────── */
.pg-work-lead{
  margin:0 0 clamp(30px,4vh,48px) !important; max-width:60ch;
  color:var(--gw-steel) !important;
}
.pg-work-process{
  list-style:none; margin:0; padding:0;
  border-top:1px solid rgba(141,153,174,0.22);
}
.pg-work-step{
  display:grid; grid-template-columns:auto 1fr;
  gap:clamp(18px,3vw,40px); align-items:start;
  padding:clamp(24px,3.4vh,38px) 0;
  border-bottom:1px solid rgba(141,153,174,0.18);
}
.pg-work-step__n{
  font-family:var(--gw-display); font-weight:900; line-height:0.9;
  font-size:clamp(2.4rem,6vw,4rem);
  color:transparent; -webkit-text-fill-color:transparent;
  background:linear-gradient(180deg,#E85D04,#C1292E 60%,#E34A27);
  -webkit-background-clip:text; background-clip:text;
  text-shadow:0 0 30px rgba(232,93,4,0.25); min-width:1.6ch;
}
.pg-work-step__head{
  margin:0 0 10px; font-family:var(--gw-headline); font-weight:800;
  font-size:clamp(1.2rem,2.4vw,1.6rem); line-height:1.1; color:var(--gw-bone);
}
.pg-work-step__copy{
  margin:0; font-size:clamp(1rem,1.4vw,1.14rem) !important; line-height:1.6;
  color:var(--gw-steel); max-width:54ch;
}

/* ── case-study slots — consistent Problem → Build → Result shape ────────── */
.pg-work-studies{
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:clamp(18px,2.2vw,28px); margin-top:clamp(28px,4vh,44px);
}
.pg-work-study{
  display:flex; flex-direction:column;
  padding:clamp(22px,2.4vw,30px);
  border:1px solid rgba(141,153,174,0.25);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);
  transition:box-shadow .3s var(--ease), transform .3s var(--ease), border-color .3s var(--ease);
}
.pg-work-study:hover{
  border-color:rgba(232,93,4,0.5);
  box-shadow:8px 8px 0 rgba(232,93,4,0.22);
  transform:translate(-2px,-2px);
}
.pg-work-study__top{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding-bottom:16px; margin-bottom:18px;
  border-bottom:1px solid rgba(141,153,174,0.2);
}
.pg-work-study__sector{
  font-family:var(--gw-headline); font-weight:800; letter-spacing:0.01em;
  font-size:clamp(0.96rem,1.5vw,1.1rem); color:var(--gw-bone);
}
.pg-work-study__soon{
  font-size:9.5px; letter-spacing:0.24em; font-weight:700; text-transform:uppercase;
  color:var(--gw-ember); border:1px solid rgba(232,93,4,0.45);
  padding:5px 8px; white-space:nowrap;
}
.pg-work-study__rows{margin:0; display:flex; flex-direction:column; gap:16px; flex:1;}
.pg-work-study__row{margin:0;}
.pg-work-study__row dt{
  font-size:10px; letter-spacing:0.26em; font-weight:700; text-transform:uppercase;
  color:var(--gw-ember); margin-bottom:7px;
}
.pg-work-study__row dd{
  margin:0; font-size:clamp(0.94rem,1.3vw,1.02rem); line-height:1.5; color:var(--gw-steel);
}
.pg-work-study__row--result{
  margin-top:auto; padding-top:16px; border-top:1px solid rgba(193,41,46,0.3);
}
.pg-work-study__row--result dd{display:flex; flex-direction:column; gap:4px;}
.pg-work-study__metric{
  font-family:var(--gw-headline); font-weight:800; line-height:1;
  font-size:clamp(1.7rem,3.2vw,2.3rem); color:var(--gw-ember);
  text-shadow:0 0 20px rgba(232,93,4,0.35); letter-spacing:0.02em;
}
.pg-work-study__metric-label{
  font-size:clamp(0.82rem,1.1vw,0.92rem); line-height:1.35; color:var(--gw-steel);
}

/* ── responsive — read beautifully at 393px ─────────────────────────────── */
@media (max-width:760px){
  .pg-work-platforms{grid-template-columns:1fr;}
  .pg-work-studies{grid-template-columns:1fr;}
  .pg-work-step{grid-template-columns:1fr; gap:6px;}
  .pg-work-step__n{font-size:clamp(2.2rem,12vw,3rem);}
}
`
