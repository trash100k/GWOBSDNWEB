import { Link } from 'react-router-dom'
import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import BrandText from '../ui/BrandText.jsx'
import Ignite from '../ui/Ignite.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Software')

/* ── bespoke on-brand SVG motifs (single-weight 1.5px monolinear, ember when active) ── */

// A forged Celtic rivet/knot seal — used as the section sigil + the proof crest.
function ForgeSeal({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M32 12 L52 32 L32 52 L12 32 Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M32 22 C40 22 42 32 32 32 C22 32 24 42 32 42 M32 22 C24 22 22 32 32 32 C42 32 40 42 32 42"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <circle cx="32" cy="32" r="2.4" fill="currentColor" />
    </svg>
  )
}

// The problem icons — outgrown, leaking systems. Monolinear 1.5px.
function GlyphSaaS() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="5" y="9" width="30" height="22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15 H35 M13 31 V35 M27 31 V35 M9 35 H31" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 6 L36 12 M36 6 L30 12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
function GlyphSheet() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="7" y="6" width="26" height="28" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 14 H33 M7 22 H33 M16 6 V34 M24 6 V34" stroke="currentColor" strokeWidth="1.5" />
      <path d="M26 26 L33 33 M33 26 L26 33" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
function GlyphRent() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M14 18 V13 A6 6 0 0 1 26 13 V18" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="18" width="22" height="16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 24 V29" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="1.6" fill="currentColor" />
    </svg>
  )
}

const PROBLEMS = [
  {
    Glyph: GlyphSaaS,
    head: 'You outgrew the rented SaaS.',
    body: 'The platform that fit at ten jobs a week buckles at fifty. You bend the operation to its limits and wait on a roadmap that isn’t yours — and the bill climbs every seat, every year. You’re renting a ceiling.',
  },
  {
    Glyph: GlyphSheet,
    head: 'The business runs on spreadsheets.',
    body: 'A dozen tabs, three people who know the formulas, and one wrong paste from chaos. The real system lives in someone’s head, not in software you control — and the day they leave, it leaves with them.',
  },
  {
    Glyph: GlyphRent,
    head: 'You don’t own the tools.',
    body: 'Your data sits on someone else’s servers, behind someone else’s roadmap, priced at someone else’s whim. They raise the rate, kill the feature, or fold — and your operation is the hostage. You built a business on rented ground.',
  },
]

const BUILD = [
  {
    head: 'Internal tools',
    body: 'The dispatch board, the job tracker, the quoting engine — the software your crew actually touches all day, shaped to how you already work instead of bending you to a stranger’s product.',
  },
  {
    head: 'Proprietary platforms',
    body: 'A system that is yours alone, not a config of someone else’s product. A real competitive edge — a moat no competitor can subscribe to and no vendor can switch off.',
  },
  {
    head: 'Custom-built',
    body: 'Engineered for your operation from the first line — not a template stretched to fit, not a plugin pile held together with tape. It fits the business; the business never bends to it.',
  },
  {
    head: 'Documented',
    body: 'Every decision written down, every system mapped. You get the manual, not a black box only we can open. The opposite of the rented SaaS you can’t see inside.',
  },
  {
    head: 'Open-sourced to you',
    body: 'The code is handed over, in full, the day it goes live. Yours to run, extend, or hand to any engineer. No lock-in, no license to renew, never held hostage.',
  },
  {
    head: 'Built on proven ground',
    body: 'The same battle-tested rails that run banks and fleets — predictable behavior, not last quarter’s frontier model and crossed fingers. No AI theater. No pilot that rots in “phase two.”',
  },
]

const STEPS = [
  {
    n: '01',
    tag: 'Discovery',
    head: 'We map the operation.',
    body: 'A working session, not discovery-call theater. We walk the bottleneck, name the system that kills it, and scope it in days — not a six-week deck. You leave knowing exactly what we build, what it costs, and a number that doesn’t move.',
  },
  {
    n: '02',
    tag: 'Build',
    head: 'We forge it.',
    body: 'Small clan, full accountability — you talk to the people writing the code, not an account manager. It ships in weeks, not quarters, documented as we go. No pilots rotting in “phase two.”',
  },
  {
    n: '03',
    tag: 'Handover',
    head: 'We open-source it to you.',
    body: 'It goes live, runs the work, and the code is yours — the full repository, the docs, the keys. You own every bolt. We don’t hold your business hostage to keep the lights on. That’s the whole point.',
  },
]

const OWN = [
  { k: 'The code', v: 'The full repository, handed over. Run it, fork it, hand it to any engineer. No lock-in.' },
  { k: 'The platform', v: 'A proprietary system that is yours alone — a moat, not a subscription. A vendor can’t switch it off.' },
  { k: 'The data', v: 'On your ground, in your shape — yours to leverage like no rented tool allows. Never the hostage again.' },
  { k: 'The documentation', v: 'Every system mapped and written down. The manual, not a black box only we can open.' },
]

export default function Software() {
  return (
    <PageShell
      kicker="GW–01 · Software"
      title="Custom Software, Built to Run It All"
      lede={b.body}
    >
      <style>{styles}</style>

      {/* ── THE PROBLEM ─────────────────────────────────────────────── */}
      <Section
        eyebrow="The Problem"
        title="You’ve outgrown the tools you don’t own."
        align="start"
      >
        <p className="pg-software-lede-strong">
          Rented SaaS you bend the business to. Spreadsheets one bad paste from a lost
          day. A stack of apps that hold your data hostage and talk to each other only
          through you. At some point the software stops serving the business — and the
          business starts serving the software. That’s the bottleneck.
        </p>

        <div className="pg-software-problems">
          {PROBLEMS.map(({ Glyph, head, body }) => (
            <article key={head} className="pg-software-prob">
              <span className="pg-software-prob-glyph" aria-hidden="true">
                <Glyph />
              </span>
              <h3 className="pg-software-prob-head">{head}</h3>
              <p className="pg-software-prob-body">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── WHAT WE BUILD ───────────────────────────────────────────── */}
      <Section
        eyebrow="What We Build"
        title="Internal tools and proprietary platforms."
        align="start"
        className="pg-software-build"
      >
        <p className="pg-software-lede-strong">
          We build the system your business actually runs on — custom-built, fully
          documented, and open-sourced to you. You command the platform; you don’t rent
          it. The same forge that built{' '}
          <BrandText text="YardWorx" />, built for how you operate.
        </p>

        <div className="pg-software-build-grid">
          {BUILD.map(({ head, body }, i) => (
            <article key={head} className="pg-software-spec">
              <span className="pg-software-spec-id">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="pg-software-spec-head">{head}</h3>
              <p className="pg-software-spec-body">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <Section
        eyebrow="How It Works"
        title="Discovery. Build. Open-source handover."
        align="start"
      >
        <ol className="pg-software-steps">
          {STEPS.map(({ n, tag, head, body }, i) => (
            <li key={n} className="pg-software-step">
              <span className="pg-software-step-rail" aria-hidden="true">
                <span className="pg-software-step-node">{n}</span>
                {i < STEPS.length - 1 && <span className="pg-software-step-line" />}
              </span>
              <div className="pg-software-step-body">
                <span className="pg-software-step-tag">{tag}</span>
                <h3 className="pg-software-step-head">{head}</h3>
                <p className="pg-software-step-text">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── WHAT YOU GET ────────────────────────────────────────────── */}
      <Section
        eyebrow="What You Get"
        title="You own every bolt."
        align="start"
      >
        <p className="pg-software-lede-strong">
          No license to renew. No seat to ring up. No roadmap you’re hostage to. No
          black box. When the forge cools, the platform — and the leverage — is
          entirely yours.
        </p>

        <ul className="pg-software-own">
          {OWN.map(({ k, v }) => (
            <li key={k} className="pg-software-own-row">
              <span className="pg-software-own-mark" aria-hidden="true">
                <ForgeSeal className="pg-software-seal" />
              </span>
              <span className="pg-software-own-k">{k}</span>
              <span className="pg-software-own-v">{v}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── PROOF ───────────────────────────────────────────────────── */}
      <Section eyebrow="Proof" align="center" className="pg-software-proof-wrap">
        <div className="pg-software-proof">
          <ForgeSeal className="pg-software-proof-crest" />
          <p className="pg-software-proof-kicker">The forge built</p>
          <h2 className="pg-software-proof-mark flame">
            <Ignite text="YardWorx" />
          </h2>
          <p className="pg-software-proof-body">
            <BrandText text="YardWorx is a proprietary platform we run ourselves — not a case study we read. We’ve worked the bottlenecks we automate, so you never pay us to learn your business on your dime. We build the same caliber for you, and we hand you the keys." />
          </p>
          <Link className="pg-software-proof-link" to="/work">
            See the platforms the forge runs →
          </Link>
        </div>
      </Section>

      {/* ── INVESTMENT ──────────────────────────────────────────────── */}
      <Section eyebrow="The Investment" align="center">
        <div className="pg-software-ledger">
          <div className="pg-software-anchor">
            <span className="pg-software-anchor-strike">{b.anchor}</span>
            <span className="pg-software-anchor-note">
              We forge the same caliber — owned, not rented.
            </span>
          </div>

          <div className="pg-software-price">
            <span className="pg-software-price-from">From</span>
            <span className="pg-software-price-num">$10,000</span>
          </div>

          <div className="pg-software-terms">
            <span className="pg-software-term">
              <strong>$5,000</strong> deposit — the line between building and browsing
            </span>
            <span className="pg-software-term-div" aria-hidden="true" />
            <span className="pg-software-term">
              Fixed scope. Fixed price. Scoped in days, yours on day one.
            </span>
          </div>

          <Link className="cta cta--solid pg-software-cta" to="/contact">
            <span>Start the Forge</span>
          </Link>
          <span className="pg-software-avail">{COPY.finale.avail}</span>
        </div>
      </Section>
    </PageShell>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Bespoke, page-scoped styling. EVERY selector prefixed `.pg-software-`.
   Neo-Gaelic Brutalist: 0px corners, hard borders, layered L1/L2/L3 depth,
   Brutalist-Snap motion (impact, no bounce). Reads at 393px AND 1440px.
   ────────────────────────────────────────────────────────────────────────── */
const styles = `
.pg-software-lede-strong{
  max-width:64ch; margin:0 0 clamp(34px,5vh,60px);
  font-size:clamp(1.08rem,1.7vw,1.32rem); line-height:1.6; color:var(--gw-bone);
  opacity:0.92;
}
.pg-software-lede-strong .brand-term{color:var(--gw-bone);}

/* ── THE PROBLEM — three forged panels, hard 8px shadow, ember on focus ── */
.pg-software-problems{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(248px,1fr));
  gap:0; border:1px solid rgba(141,153,174,0.22);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);
}
.pg-software-prob{
  position:relative; padding:clamp(26px,3vw,40px);
  background:rgba(15,17,22,0.5);
  border-right:1px solid rgba(141,153,174,0.18);
  transition:background .35s var(--ease);
}
.pg-software-prob:last-child{border-right:0;}
/* L2 forge-light inner glow on hover — pure impact, no bounce */
.pg-software-prob::before{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:0;
  box-shadow:inset 0 0 60px rgba(193,41,46,0.12);
  border-top:2px solid transparent;
  transition:opacity .3s var(--ease), border-color .3s var(--ease);
}
.pg-software-prob:hover{background:rgba(20,17,18,0.62);}
.pg-software-prob:hover::before{opacity:1; border-top-color:var(--gw-forge);}
.pg-software-prob-glyph{
  display:block; width:clamp(34px,4vw,42px); height:clamp(34px,4vw,42px);
  color:var(--gw-steel); margin-bottom:clamp(18px,2.4vw,26px);
  transition:color .3s var(--ease);
}
.pg-software-prob-glyph svg{width:100%; height:100%; display:block;}
.pg-software-prob:hover .pg-software-prob-glyph{color:var(--gw-ember);}
.pg-software-prob-head{
  margin:0 0 12px; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.12rem,1.8vw,1.34rem); line-height:1.12;
}
.pg-software-prob-body{
  margin:0; font-size:clamp(0.98rem,1.4vw,1.08rem) !important; line-height:1.56;
  color:var(--gw-steel) !important; max-width:38ch;
}

/* ── WHAT WE BUILD — six numbered spec cards, Iron-Grid 0-gap ── */
.pg-software-build-grid{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  gap:0; border:1px solid rgba(141,153,174,0.22);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);
}
.pg-software-spec{
  position:relative; padding:clamp(24px,2.6vw,36px);
  background:rgba(13,15,20,0.55);
  border-right:1px solid rgba(141,153,174,0.16);
  border-bottom:1px solid rgba(141,153,174,0.16);
  transition:background .3s var(--ease);
}
.pg-software-spec:hover{background:rgba(18,17,19,0.66);}
.pg-software-spec-id{
  display:block; font-family:var(--gw-display); font-weight:900;
  font-size:clamp(1rem,1.6vw,1.25rem); letter-spacing:0.04em;
  color:var(--gw-forge); margin-bottom:14px; opacity:0.9;
}
.pg-software-spec-head{
  margin:0 0 9px; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.05rem,1.6vw,1.24rem); line-height:1.14;
}
.pg-software-spec-body{
  margin:0; font-size:clamp(0.95rem,1.35vw,1.04rem) !important; line-height:1.54;
  color:var(--gw-steel) !important;
}

/* ── HOW IT WORKS — a forged vertical rail with riveted nodes ── */
.pg-software-steps{
  list-style:none; margin:0; padding:0;
}
.pg-software-step{
  display:grid; grid-template-columns:auto 1fr;
  gap:clamp(20px,3vw,40px);
}
.pg-software-step-rail{
  position:relative; display:flex; flex-direction:column; align-items:center;
}
.pg-software-step-node{
  flex:0 0 auto; display:flex; align-items:center; justify-content:center;
  width:clamp(52px,6vw,68px); height:clamp(52px,6vw,68px);
  border:1.5px solid var(--gw-forge); background:var(--gw-void);
  box-shadow:6px 6px 0 rgba(0,0,0,0.5), inset 0 0 30px rgba(193,41,46,0.1);
  font-family:var(--gw-display); font-weight:900; color:var(--gw-ember);
  font-size:clamp(1.1rem,2vw,1.5rem); letter-spacing:0.02em;
}
.pg-software-step-line{
  flex:1 1 auto; width:1.5px; min-height:clamp(28px,4vh,48px);
  background:linear-gradient(180deg,var(--gw-forge),rgba(141,153,174,0.25));
}
.pg-software-step-body{
  padding-bottom:clamp(40px,6vh,72px); padding-top:clamp(4px,1vw,10px);
}
.pg-software-step:last-child .pg-software-step-body{padding-bottom:0;}
.pg-software-step-tag{
  display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:12px;
}
.pg-software-step-head{
  margin:0 0 12px; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.3rem,2.6vw,1.9rem); line-height:1.08;
}
.pg-software-step-text{
  margin:0; font-size:clamp(1rem,1.5vw,1.14rem) !important; line-height:1.6;
  color:var(--gw-steel) !important; max-width:56ch;
}

/* ── WHAT YOU GET — a manifest ledger, each line sealed ── */
.pg-software-own{
  list-style:none; margin:0; padding:0;
  border-top:1.5px solid rgba(141,153,174,0.24);
}
.pg-software-own-row{
  display:grid;
  grid-template-columns:auto minmax(120px,0.42fr) 1.4fr;
  align-items:center; gap:clamp(14px,2vw,30px);
  padding:clamp(18px,2.4vh,26px) clamp(2px,1vw,10px);
  border-bottom:1.5px solid rgba(141,153,174,0.16);
  transition:background .3s var(--ease);
}
.pg-software-own-row:hover{background:rgba(20,17,18,0.4);}
.pg-software-own-mark{
  display:flex; width:clamp(30px,3.4vw,40px); height:clamp(30px,3.4vw,40px);
  color:var(--gw-ember);
}
.pg-software-seal{width:100%; height:100%; display:block;
  filter:drop-shadow(0 0 8px rgba(218,44,28,0.35));}
.pg-software-own-k{
  font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  letter-spacing:0.02em; color:var(--gw-bone);
  font-size:clamp(0.98rem,1.8vw,1.25rem); line-height:1.1;
}
.pg-software-own-v{
  font-size:clamp(0.96rem,1.4vw,1.08rem); line-height:1.5; color:var(--gw-steel);
}

/* ── PROOF — a forged crest panel, centered, layered depth ── */
.pg-software-proof-wrap{}
.pg-software-proof{
  position:relative; margin:0 auto; max-width:720px;
  padding:clamp(40px,6vw,72px) clamp(26px,5vw,64px);
  border:1.5px solid var(--gw-forge);
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(193,41,46,0.08), transparent 62%),
    rgba(13,15,20,0.6);
  box-shadow:8px 8px 0 rgba(0,0,0,0.6), inset 0 0 80px rgba(193,41,46,0.06);
}
.pg-software-proof-crest{
  width:clamp(46px,6vw,62px); height:clamp(46px,6vw,62px);
  color:var(--gw-ember); margin:0 auto clamp(20px,3vw,30px);
  display:block; filter:drop-shadow(0 0 12px rgba(218,44,28,0.4));
}
.pg-software-proof-kicker{
  margin:0 0 8px; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-steel);
}
.pg-software-proof-mark{
  margin:0 0 clamp(20px,3vw,28px); font-family:var(--gw-display); font-weight:900;
  text-transform:uppercase; font-size:clamp(2.4rem,8vw,4.4rem); line-height:1;
  letter-spacing:0.02em;
}
.pg-software-proof-body{
  margin:0 auto clamp(26px,4vw,34px); max-width:52ch;
  font-size:clamp(1.02rem,1.5vw,1.16rem) !important; line-height:1.6;
  color:var(--gw-steel) !important;
}
.pg-software-proof-link{
  display:inline-block; font-family:var(--gw-headline); font-weight:700;
  letter-spacing:0.04em; font-size:clamp(13px,1.5vw,15px); text-transform:uppercase;
  color:var(--gw-ember); text-decoration:none;
  border-bottom:1.5px solid rgba(218,44,28,0.5); padding-bottom:3px;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.pg-software-proof-link:hover{color:#ffd9c2; border-bottom-color:var(--gw-ember);}

/* ── INVESTMENT — the anchored ledger. Outcome-first, number last. ── */
.pg-software-ledger{
  margin:0 auto; max-width:560px; text-align:center;
  padding:clamp(32px,5vw,56px) clamp(24px,4vw,48px);
  border:1.5px solid rgba(141,153,174,0.3);
  background:rgba(13,15,20,0.6);
  box-shadow:8px 8px 0 rgba(0,0,0,0.6);
}
.pg-software-anchor{
  display:flex; flex-direction:column; gap:6px; align-items:center;
  margin-bottom:clamp(20px,3vw,30px);
}
.pg-software-anchor-strike{
  font-size:clamp(0.95rem,1.5vw,1.1rem); color:rgba(141,153,174,0.78);
  text-decoration:line-through; text-decoration-color:rgba(193,41,46,0.6);
}
.pg-software-anchor-note{
  font-size:12px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700;
  color:var(--gw-steel);
}
.pg-software-price{
  display:flex; align-items:baseline; justify-content:center; gap:clamp(10px,1.6vw,16px);
  padding:clamp(16px,2.6vw,26px) 0;
  border-top:1.5px solid rgba(141,153,174,0.2);
  border-bottom:1.5px solid rgba(141,153,174,0.2);
}
.pg-software-price-from{
  font-family:var(--gw-headline); font-weight:700; text-transform:uppercase;
  letter-spacing:0.16em; font-size:clamp(0.8rem,1.4vw,1rem); color:var(--gw-steel);
}
.pg-software-price-num{
  font-family:var(--gw-display); font-weight:900; line-height:1;
  font-size:clamp(2.8rem,10vw,4.6rem); letter-spacing:0.01em;
  color:var(--gw-ember); text-shadow:0 0 32px rgba(218,44,28,0.45), 0 2px 10px rgba(0,0,0,0.6);
}
.pg-software-terms{
  display:flex; flex-wrap:wrap; align-items:center; justify-content:center;
  gap:clamp(10px,1.6vw,18px); margin:clamp(20px,3vw,28px) 0 0;
}
.pg-software-term{
  font-size:clamp(0.92rem,1.4vw,1.04rem); color:var(--gw-steel); line-height:1.4;
}
.pg-software-term strong{color:var(--gw-bone); font-weight:700;}
.pg-software-term-div{
  width:1.5px; height:18px; background:rgba(141,153,174,0.3);
}
.pg-software-cta{margin-top:clamp(28px,4vw,38px);}
.pg-software-avail{
  display:block; margin-top:18px; font-size:10.5px; letter-spacing:0.32em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);
}

/* ── responsive: stack the Iron Grids cleanly on phones (393px) ── */
@media (max-width:680px){
  .pg-software-problems,
  .pg-software-build-grid{grid-template-columns:1fr; box-shadow:6px 6px 0 rgba(0,0,0,0.55);}
  .pg-software-prob{border-right:0; border-bottom:1px solid rgba(141,153,174,0.18);}
  .pg-software-prob:last-child{border-bottom:0;}
  .pg-software-spec{border-right:0;}
  /* manifest ledger: glyph + key on a row, value beneath */
  .pg-software-own-row{
    grid-template-columns:auto 1fr; gap:12px 14px; row-gap:8px;
    padding-block:clamp(16px,3vh,22px);
  }
  .pg-software-own-v{grid-column:1 / -1; max-width:none;}
  .pg-software-step{gap:16px;}
  .pg-software-terms{flex-direction:column; gap:8px;}
  .pg-software-term-div{display:none;}
}

@media (prefers-reduced-motion:reduce){
  .pg-software-prob,.pg-software-spec,.pg-software-own-row,
  .pg-software-prob-glyph,.pg-software-prob::before{transition:none;}
}
`
