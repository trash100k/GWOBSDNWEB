import { Link } from 'react-router-dom'
import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import BrandText from '../ui/BrandText.jsx'

/* GW–02 · Voice (Maeve) — the AI voice agent. Productized entry rung: $499/mo +
   one-time setup. Conversion-focused, outcome-first, anchored against a $48k/yr
   in-house receptionist. Bespoke soundwave + forge SVG/CSS lives in the namespaced
   <style> block below (all selectors prefixed .pg-voice-). */

/* A live-feeling soundwave bar field — the visual signature of Maeve's voice. */
function Soundwave({ bars = 28, className = '' }) {
  const heights = Array.from({ length: bars }, (_, i) => {
    // a smooth pseudo-random envelope so the field reads as speech, not noise
    const t = i / (bars - 1)
    const env = Math.sin(t * Math.PI) // tall in the middle, short at the edges
    const jitter = 0.42 + 0.58 * Math.abs(Math.sin(i * 1.7 + 0.6))
    return Math.max(0.16, env * jitter)
  })
  return (
    <div className={`pg-voice-wave ${className}`.trim()} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="pg-voice-bar"
          style={{ '--h': `${Math.round(h * 100)}%`, '--d': `${(i % 7) * 90}ms` }}
        />
      ))}
    </div>
  )
}

/* small inline icon set — 1.5px monolinear stroke per the brand iconography rule */
const ICONS = {
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 4h3l1.6 4-2 1.4a12 12 0 0 0 5 5l1.4-2 4 1.6V19a2 2 0 0 1-2.2 2A15 15 0 0 1 4 6.2 2 2 0 0 1 5 4Z" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5h18l-7 8v6l-4 1v-7L3 5Z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="5" width="17" height="15" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 14h3" />
    </svg>
  ),
  loop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 9a8 8 0 0 1 13.5-3.5L20 8M20 15A8 8 0 0 1 6.5 18.5L4 16" />
      <path d="M20 4v4h-4M4 20v-4h4" />
    </svg>
  ),
}

export default function Voice() {
  return (
    <PageShell
      kicker="GW–02 · Voice Agent"
      title="The Voice That Never Clocks Out"
      lede="Maeve answers every call, qualifies the lead, books the job, and chases the no-shows — in a voice no caller clocks as AI. The same agent that runs our own front desk, running yours around the clock."
    >
      <style>{CSS}</style>

      {/* ── hero signature: the soundwave + the live badge ─────────────────── */}
      <Section align="center" className="pg-voice-hero">
        <div className="pg-voice-badge">
          <span className="pg-voice-dot" />
          <span>Maeve · live · answering now</span>
        </div>
        <Soundwave bars={36} className="pg-voice-wave--hero" />
        <p className="pg-voice-hero-line">
          One ring. Every time. Day or night, holidays, the second line during the rush —{' '}
          <strong>nothing goes to voicemail.</strong>
        </p>
      </Section>

      {/* ── 1 · THE COST OF MISSED CALLS ───────────────────────────────────── */}
      <Section
        eyebrow="The Bleed"
        title="Every missed call is a job you handed to your competitor."
        align="start"
      >
        <p>
          You are on a roof, under a sink, on the other line. The phone rings out. The caller does
          not leave a message — <strong>they call the next name on the list.</strong> That is not a
          missed call. That is a booked job, lost, while you were doing the work.
        </p>

        <div className="pg-voice-cost">
          <div className="pg-voice-cost-card">
            <span className="pg-voice-stat">1 in 3</span>
            <span className="pg-voice-stat-label">calls to trades go unanswered</span>
          </div>
          <div className="pg-voice-cost-card">
            <span className="pg-voice-stat">80%</span>
            <span className="pg-voice-stat-label">of callers won't leave a voicemail</span>
          </div>
          <div className="pg-voice-cost-card">
            <span className="pg-voice-stat">$0</span>
            <span className="pg-voice-stat-label">earned from a phone you can't reach</span>
          </div>
        </div>

        <div className="pg-voice-graveyard">
          <span className="pg-voice-graveyard-tag">The voicemail graveyard</span>
          <ul>
            <li>Missed call · 7:14pm — no message</li>
            <li>Missed call · 7:41pm — no message</li>
            <li>Missed call · 8:02pm — booked your competitor</li>
          </ul>
          <p className="pg-voice-graveyard-foot">
            Three rings. Three jobs. Gone before you washed your hands.
          </p>
        </div>
      </Section>

      {/* ── 2 · HOW MAEVE WORKS ────────────────────────────────────────────── */}
      <Section
        eyebrow="How She Works"
        title="A full front desk. One voice. Zero clock-outs."
        align="start"
      >
        <p>
          Maeve does not read a phone tree. She talks — listens, asks, decides, and books — like the
          best receptionist you have ever hired, except she never sleeps, never quits, and never puts
          a caller on hold.
        </p>

        <div className="pg-voice-flow">
          <FlowStep n="01" icon={ICONS.phone} title="Answers every call">
            Picks up on the first ring — nights, weekends, the second and third line during the rush.
            No menu, no hold music, no voicemail.
          </FlowStep>
          <FlowStep n="02" icon={ICONS.filter} title="Qualifies the lead">
            Asks the right questions, captures the job details, and filters tire-kickers from real
            work before it ever hits your phone.
          </FlowStep>
          <FlowStep n="03" icon={ICONS.calendar} title="Books the job">
            Reads your live availability and drops the appointment straight into your calendar —
            confirmed, with the address and the scope.
          </FlowStep>
          <FlowStep n="04" icon={ICONS.loop} title="Chases the no-shows">
            Confirms ahead of time, follows up on the ones who ghost, and refills the slot — so a
            no-show never costs you the hour.
          </FlowStep>
        </div>
      </Section>

      {/* ── 3 · SOUNDS HUMAN ───────────────────────────────────────────────── */}
      <Section align="center" tone="panel" className="pg-voice-human">
        <span className="pg-voice-eyebrow-c">The Tell</span>
        <h2 className="pg-voice-human-head">
          <BrandText text="No caller clocks Maeve as AI." />
        </h2>
        <Soundwave bars={44} className="pg-voice-wave--human" />
        <p className="pg-voice-human-body">
          Natural pacing. Real interruptions handled. Your business name, your services, your tone —
          a script you control, delivered in a voice that breathes. Callers think they reached your
          best front-desk hire. They reached a system that answers like one, every single time.
        </p>
        <div className="pg-voice-transcript">
          <p className="pg-voice-t-caller">
            <span>Caller</span>
            "Hey — do you guys handle emergency callouts tonight?"
          </p>
          <p className="pg-voice-t-maeve">
            <span>Maeve</span>
            "We do. I can get a technician to you this evening — what's the address, and what's going
            on with the unit?"
          </p>
        </div>
      </Section>

      {/* ── 4 · INTEGRATIONS / YOUR SCRIPT AROUND THE CLOCK ────────────────── */}
      <Section
        eyebrow="Wired In"
        title="Your script, your tools, around the clock."
        align="start"
      >
        <p>
          Maeve does not live in a silo. She plugs into the systems you already run, books against
          your real calendar, and writes every lead and call summary where your team will see it —
          so the front desk and the field stay in lockstep.
        </p>
        <div className="pg-voice-int">
          {[
            ['Your calendar', 'Books live against real availability'],
            ['Your CRM', 'Every lead + call summary, logged'],
            ['Your numbers', 'Forwards your existing line — no new number to learn'],
            ['Your text + email', 'Confirmations and follow-ups, sent automatically'],
            ['Your script', 'Your services, pricing rules, and tone — under your control'],
            ['Your team', 'Hot leads handed off the instant they qualify'],
          ].map(([t, d]) => (
            <div className="pg-voice-int-cell" key={t}>
              <span className="pg-voice-int-t">{t}</span>
              <span className="pg-voice-int-d">{d}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5 · ROI vs A RECEPTIONIST ──────────────────────────────────────── */}
      <Section
        eyebrow="The Math"
        title="One receptionist. Or one Maeve."
        align="start"
      >
        <p>
          An in-house receptionist runs <strong>$48,000 a year</strong> — and still clocks out at
          five, takes lunch, calls in sick, and only works one line at a time. Maeve runs every line,
          every hour, for a fraction of one paycheck.
        </p>

        <div className="pg-voice-roi">
          <div className="pg-voice-roi-col pg-voice-roi-old">
            <span className="pg-voice-roi-tag">In-house receptionist</span>
            <span className="pg-voice-roi-price">$48,000<small>/yr</small></span>
            <ul>
              <li>9-to-5, one line at a time</li>
              <li>Lunches, sick days, holidays, turnover</li>
              <li>Misses the after-hours rush entirely</li>
              <li>You hire, train, and manage them</li>
            </ul>
          </div>
          <div className="pg-voice-roi-vs">VS</div>
          <div className="pg-voice-roi-col pg-voice-roi-new">
            <span className="pg-voice-roi-tag">Maeve</span>
            <span className="pg-voice-roi-price">
              $5,988<small>/yr</small>
            </span>
            <ul>
              <li>24/7/365, every line at once</li>
              <li>Never sick, never quits, never on hold</li>
              <li>Owns the nights and weekends you lose now</li>
              <li>We build her, run her, and tune her</li>
            </ul>
          </div>
        </div>
        <p className="pg-voice-roi-foot">
          <strong>Roughly an eighth of the cost</strong> — and she catches the calls a receptionist
          never could. One booked job a month covers her. The rest is profit you were leaving on the
          machine.
        </p>
      </Section>

      {/* ── 6 · INVESTMENT ─────────────────────────────────────────────────── */}
      <Section align="center" className="pg-voice-price">
        <span className="pg-voice-eyebrow-c">The Investment</span>
        <h2 className="pg-voice-price-head">
          <BrandText text="Maeve, on the desk." />
        </h2>
        <div className="pg-voice-price-card">
          <div className="pg-voice-price-main">
            <span className="pg-voice-price-from">From</span>
            <span className="pg-voice-price-fig">$499</span>
            <span className="pg-voice-price-per">/mo · per location</span>
          </div>
          <div className="pg-voice-price-setup">
            <span>+ one-time setup &amp; forge fee</span>
            <small>We build her to your script, wire your tools, and tune her live before launch.</small>
          </div>
          <ul className="pg-voice-price-list">
            <li>All-in managed — we run the whole stack</li>
            <li>Every call answered, qualified, and booked</li>
            <li>Wired to your calendar, CRM, and existing line</li>
            <li>No per-minute surprises, no hidden telephony bill</li>
          </ul>
          <Link className="cta cta--solid pg-voice-cta" to="/contact">
            <span>Put Maeve on the Desk</span>
          </Link>
          <span className="pg-voice-price-anchor">
            vs. a <s>$48,000/yr</s> receptionist · live in days, not months
          </span>
        </div>
      </Section>

      {/* PageShell renders the closing "Start the Forge" CTA → /contact */}
    </PageShell>
  )
}

/* one step of the how-she-works flow — number, monolinear icon, copy */
function FlowStep({ n, icon, title, children }) {
  return (
    <div className="pg-voice-step">
      <div className="pg-voice-step-top">
        <span className="pg-voice-step-n">{n}</span>
        <span className="pg-voice-step-icon">{icon}</span>
      </div>
      <h3 className="pg-voice-step-title">{title}</h3>
      <p className="pg-voice-step-body">{children}</p>
      <span className="pg-voice-step-rule" aria-hidden="true" />
    </div>
  )
}

/* ── namespaced styles (all selectors prefixed .pg-voice-) ─────────────────── */
const CSS = `
/* hero signature */
.pg-voice-hero{padding-top:clamp(20px,4vh,40px);}
.pg-voice-badge{display:inline-flex; align-items:center; gap:10px;
  font-family:var(--gw-sans); font-size:11px; letter-spacing:0.26em; text-transform:uppercase;
  font-weight:700; color:var(--gw-bone);
  border:1px solid rgba(232,93,4,0.5); background:rgba(15,17,22,0.6);
  padding:9px 16px; box-shadow:6px 6px 0 rgba(0,0,0,0.5);}
.pg-voice-dot{width:9px; height:9px; background:var(--gw-ember);
  box-shadow:0 0 12px 2px rgba(232,93,4,0.8); animation:pgvPulse 1.5s infinite steps(1,end);}
@keyframes pgvPulse{0%,55%{opacity:1;}56%,100%{opacity:0.25;}}
.pg-voice-hero-line{max-width:54ch; margin:clamp(26px,4vh,40px) auto 0;}
.pg-voice-hero-line strong{color:var(--gw-bone);}

/* the soundwave field — sharp brutalist bars, animated to feel like live speech */
.pg-voice-wave{display:flex; align-items:center; justify-content:center; gap:3px;
  width:100%; height:clamp(64px,12vh,112px); margin:clamp(28px,4vh,44px) auto 0;}
.pg-voice-bar{flex:0 0 auto; width:clamp(3px,0.5vw,5px); height:var(--h);
  background:linear-gradient(to top,var(--gw-forge),var(--gw-ember));
  transform-origin:center; animation:pgvBar 1.4s var(--d,0ms) infinite alternate ease-in-out;}
@keyframes pgvBar{from{transform:scaleY(0.32);}to{transform:scaleY(1);}}
.pg-voice-wave--hero{max-width:560px;}
.pg-voice-wave--human{max-width:620px; opacity:0.9;}

/* 1 · cost of missed calls */
.pg-voice-cost{display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(12px,1.6vw,22px);
  margin-top:clamp(30px,5vh,52px);}
.pg-voice-cost-card{border:1px solid rgba(193,41,46,0.35); background:rgba(15,17,22,0.5);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55); padding:clamp(18px,2.4vw,30px); text-align:left;}
.pg-voice-stat{display:block; font-family:var(--gw-display); font-weight:900;
  font-size:clamp(1.9rem,5vw,3.1rem); line-height:1; color:var(--gw-ember);
  text-shadow:0 0 24px rgba(232,93,4,0.35);}
.pg-voice-stat-label{display:block; margin-top:10px; font-size:0.86rem; line-height:1.4;
  color:var(--gw-steel); text-transform:uppercase; letter-spacing:0.08em;}

.pg-voice-graveyard{margin-top:clamp(28px,4.5vh,48px); border-left:3px solid var(--gw-forge);
  background:rgba(11,12,16,0.6); padding:clamp(20px,3vw,34px) clamp(20px,3vw,38px);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
.pg-voice-graveyard-tag{display:block; font-size:11px; letter-spacing:0.3em; text-transform:uppercase;
  font-weight:700; color:var(--gw-forge); margin-bottom:16px;}
.pg-voice-graveyard ul{list-style:none; margin:0; padding:0; display:grid; gap:8px;}
.pg-voice-graveyard li{font-family:'JetBrains Mono',ui-monospace,monospace;
  font-size:0.92rem; letter-spacing:0.02em; color:var(--gw-steel);
  padding:9px 0; border-bottom:1px solid rgba(141,153,174,0.16);}
.pg-voice-graveyard li:last-child{color:var(--gw-bone); border-bottom:none;}
.pg-voice-graveyard-foot{margin:16px 0 0 !important; color:var(--gw-bone) !important;
  font-weight:600; font-size:1rem !important;}

/* 2 · how she works — the flow */
.pg-voice-flow{display:grid; grid-template-columns:repeat(4,1fr); gap:0;
  margin-top:clamp(32px,5vh,56px); border:1px solid rgba(141,153,174,0.22);}
.pg-voice-step{position:relative; padding:clamp(20px,2.4vw,32px);
  border-right:1px solid rgba(141,153,174,0.22); background:rgba(15,17,22,0.4);}
.pg-voice-step:last-child{border-right:none;}
.pg-voice-step-top{display:flex; align-items:center; justify-content:space-between;}
.pg-voice-step-n{font-family:var(--gw-display); font-weight:900; font-size:1.5rem;
  color:rgba(141,153,174,0.45);}
.pg-voice-step-icon{width:30px; height:30px; color:var(--gw-ember); display:block;}
.pg-voice-step-icon svg{width:100%; height:100%;}
.pg-voice-step-title{margin:clamp(16px,2vh,22px) 0 10px; font-family:var(--gw-headline);
  font-weight:800; font-size:clamp(1.05rem,1.6vw,1.28rem); line-height:1.1; color:var(--gw-bone);}
.pg-voice-step-body{font-size:0.95rem !important; line-height:1.55 !important; color:var(--gw-steel);}
.pg-voice-step-rule{position:absolute; left:0; bottom:0; width:0; height:3px;
  background:linear-gradient(90deg,var(--gw-forge),var(--gw-ember)); transition:width .5s var(--ease);}
.pg-voice-step:hover .pg-voice-step-rule{width:100%;}

/* 3 · sounds human */
.pg-voice-human{text-align:center;}
.pg-voice-eyebrow-c{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:16px;}
.pg-voice-human-head{margin:0 0 clamp(18px,3vh,30px); font-family:var(--gw-headline);
  font-weight:800; color:var(--gw-bone); font-size:clamp(1.7rem,4.4vw,2.9rem); line-height:1.06;}
.pg-voice-human-body{max-width:60ch; margin:clamp(24px,4vh,38px) auto 0 !important;}
.pg-voice-transcript{max-width:600px; margin:clamp(28px,4.5vh,44px) auto 0; text-align:left;
  display:grid; gap:14px;}
.pg-voice-transcript p{margin:0 !important; padding:16px 18px; font-size:1rem !important;
  line-height:1.5 !important; border:1px solid rgba(141,153,174,0.22); background:rgba(11,12,16,0.55);
  box-shadow:6px 6px 0 rgba(0,0,0,0.5); color:var(--gw-bone) !important;}
.pg-voice-transcript span{display:block; font-size:10.5px; letter-spacing:0.24em; text-transform:uppercase;
  font-weight:700; margin-bottom:7px;}
.pg-voice-t-caller{margin-right:auto !important; max-width:84%;}
.pg-voice-t-caller span{color:var(--gw-steel);}
.pg-voice-t-maeve{margin-left:auto !important; max-width:90%; border-color:rgba(232,93,4,0.4) !important;}
.pg-voice-t-maeve span{color:var(--gw-ember);}

/* 4 · integrations */
.pg-voice-int{display:grid; grid-template-columns:repeat(3,1fr); gap:0;
  margin-top:clamp(32px,5vh,52px); border:1px solid rgba(141,153,174,0.22);}
.pg-voice-int-cell{padding:clamp(20px,2.4vw,30px);
  border-right:1px solid rgba(141,153,174,0.18); border-bottom:1px solid rgba(141,153,174,0.18);
  background:rgba(15,17,22,0.4);}
.pg-voice-int-cell:nth-child(3n){border-right:none;}
.pg-voice-int-cell:nth-last-child(-n+3){border-bottom:none;}
.pg-voice-int-t{display:block; font-family:var(--gw-headline); font-weight:800;
  font-size:clamp(1rem,1.5vw,1.18rem); color:var(--gw-bone); margin-bottom:8px;}
.pg-voice-int-d{display:block; font-size:0.92rem; line-height:1.5; color:var(--gw-steel);}

/* 5 · ROI */
.pg-voice-roi{display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch; gap:0;
  margin-top:clamp(32px,5vh,54px);}
.pg-voice-roi-col{border:1px solid rgba(141,153,174,0.25); background:rgba(15,17,22,0.45);
  padding:clamp(22px,3vw,38px); box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
.pg-voice-roi-old{opacity:0.82;}
.pg-voice-roi-new{border-color:rgba(232,93,4,0.55);}
.pg-voice-roi-tag{display:block; font-size:11px; letter-spacing:0.26em; text-transform:uppercase;
  font-weight:700; color:var(--gw-steel); margin-bottom:14px;}
.pg-voice-roi-new .pg-voice-roi-tag{color:var(--gw-ember);}
.pg-voice-roi-price{display:block; font-family:var(--gw-display); font-weight:900;
  font-size:clamp(2.1rem,5.5vw,3.4rem); line-height:1; color:var(--gw-bone);}
.pg-voice-roi-old .pg-voice-roi-price{color:var(--gw-steel);}
.pg-voice-roi-new .pg-voice-roi-price{color:var(--gw-ember); text-shadow:0 0 26px rgba(232,93,4,0.4);}
.pg-voice-roi-price small{font-family:var(--gw-sans); font-weight:700; font-size:0.9rem;
  letter-spacing:0.04em; color:var(--gw-steel); margin-left:4px;}
.pg-voice-roi-col ul{list-style:none; margin:clamp(18px,2.5vh,26px) 0 0; padding:0; display:grid; gap:11px;}
.pg-voice-roi-col li{position:relative; padding-left:20px; font-size:0.95rem; line-height:1.45;
  color:var(--gw-steel);}
.pg-voice-roi-col li::before{content:""; position:absolute; left:0; top:0.55em;
  width:8px; height:8px; background:rgba(141,153,174,0.5);}
.pg-voice-roi-new li::before{background:var(--gw-ember);}
.pg-voice-roi-vs{display:flex; align-items:center; justify-content:center;
  font-family:var(--gw-display); font-weight:900; font-size:1.1rem; letter-spacing:0.1em;
  color:var(--gw-forge); padding:0 clamp(10px,1.6vw,22px); min-width:54px;}
.pg-voice-roi-foot{margin-top:clamp(24px,4vh,38px) !important; max-width:64ch;}
.pg-voice-roi-foot strong{color:var(--gw-ember);}

/* 6 · investment */
.pg-voice-price{text-align:center;}
.pg-voice-price-head{margin:0 0 clamp(24px,4vh,40px); font-family:var(--gw-headline);
  font-weight:800; color:var(--gw-bone); font-size:clamp(1.7rem,4.4vw,2.9rem); line-height:1.06;}
.pg-voice-price-card{max-width:560px; margin:0 auto; text-align:left;
  border:1px solid rgba(232,93,4,0.5); background:rgba(11,12,16,0.7);
  box-shadow:8px 8px 0 #000; padding:clamp(28px,4vw,48px);
  position:relative; overflow:hidden;}
.pg-voice-price-card::before{content:""; position:absolute; inset:0; pointer-events:none;
  box-shadow:inset 0 0 80px rgba(227,74,39,0.1);}
.pg-voice-price-main{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;}
.pg-voice-price-from{font-size:0.95rem; letter-spacing:0.18em; text-transform:uppercase;
  font-weight:700; color:var(--gw-steel);}
.pg-voice-price-fig{font-family:var(--gw-display); font-weight:900;
  font-size:clamp(3rem,9vw,4.6rem); line-height:1; color:var(--gw-ember);
  text-shadow:0 0 30px rgba(232,93,4,0.45);}
.pg-voice-price-per{font-size:1rem; font-weight:600; color:var(--gw-steel);}
.pg-voice-price-setup{margin-top:18px; padding-top:18px; border-top:1px solid rgba(141,153,174,0.22);}
.pg-voice-price-setup span{display:block; font-weight:700; color:var(--gw-bone); font-size:1.02rem;}
.pg-voice-price-setup small{display:block; margin-top:6px; color:var(--gw-steel);
  font-size:0.9rem; line-height:1.5;}
.pg-voice-price-list{list-style:none; margin:clamp(20px,3vh,28px) 0 0; padding:0; display:grid; gap:11px;}
.pg-voice-price-list li{position:relative; padding-left:22px; color:var(--gw-steel);
  font-size:0.96rem; line-height:1.45;}
.pg-voice-price-list li::before{content:""; position:absolute; left:0; top:0.5em;
  width:9px; height:9px; background:var(--gw-ember); box-shadow:0 0 10px rgba(232,93,4,0.6);}
.pg-voice-cta.cta{display:flex; justify-content:center; margin-top:clamp(26px,4vh,36px); width:100%;}
.pg-voice-price-anchor{display:block; margin-top:16px; text-align:center; font-size:0.86rem;
  letter-spacing:0.04em; color:var(--gw-steel);}
.pg-voice-price-anchor s{color:rgba(141,153,174,0.7);}

/* ── responsive: collapse the grids gracefully at small widths ───────────── */
@media (max-width:900px){
  .pg-voice-flow{grid-template-columns:repeat(2,1fr);}
  .pg-voice-step{border-bottom:1px solid rgba(141,153,174,0.22);}
  .pg-voice-step:nth-child(2n){border-right:none;}
  .pg-voice-step:nth-child(n+3){border-bottom:none;}
  .pg-voice-int{grid-template-columns:repeat(2,1fr);}
  .pg-voice-int-cell:nth-child(3n){border-right:1px solid rgba(141,153,174,0.18);}
  .pg-voice-int-cell:nth-child(2n){border-right:none;}
  .pg-voice-int-cell:nth-last-child(-n+3){border-bottom:1px solid rgba(141,153,174,0.18);}
  .pg-voice-int-cell:nth-last-child(-n+2){border-bottom:none;}
}
@media (max-width:620px){
  .pg-voice-cost{grid-template-columns:1fr;}
  .pg-voice-flow{grid-template-columns:1fr;}
  .pg-voice-step{border-right:none !important; border-bottom:1px solid rgba(141,153,174,0.22) !important;}
  .pg-voice-step:last-child{border-bottom:none !important;}
  .pg-voice-int{grid-template-columns:1fr;}
  .pg-voice-int-cell{border-right:none !important; border-bottom:1px solid rgba(141,153,174,0.18) !important;}
  .pg-voice-int-cell:last-child{border-bottom:none !important;}
  .pg-voice-roi{grid-template-columns:1fr;}
  .pg-voice-roi-col{box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
  .pg-voice-roi-vs{padding:14px 0;}
  .pg-voice-t-caller,.pg-voice-t-maeve{max-width:100%;}
}
@media (prefers-reduced-motion:reduce){
  .pg-voice-bar{animation:none; transform:scaleY(0.6);}
  .pg-voice-dot{animation:none;}
}
`

