import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import ForgeText from '../ui/ForgeText.jsx'
import BrandText from '../ui/BrandText.jsx'
import { useReveal } from '../hooks.js'

/* ── GW–04 WEB · the flagship. The page IS the pitch: cinematic web that books
   the job. Built entirely on PageShell + Section; all bespoke craft (SVG/CSS,
   scroll-reveal, layered brutalist panels with the 8px hard shadow, the A+E
   ignite) lives INSIDE sections. No new WebGL — the obsidian scene plays behind. */

/* monolinear 1.5px stroke icons — strictly monochrome (currentColor); the active
   system reads ember via the panel hover. Sharp corners, forged geometry. */
function Icon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square', strokeLinejoin: 'miter' }
  return (
    <svg className="pg-web-ico" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      {name === 'depth' && (
        <g {...p}>
          <path d="M16 3 28 9v14L16 29 4 23V9z" />
          <path d="M16 3v26M4 9l12 6 12-6" />
        </g>
      )}
      {name === 'convert' && (
        <g {...p}>
          <path d="M4 6h24v15H17l-5 5v-5H4z" />
          <path d="M10 11h12M10 16h7" />
        </g>
      )}
      {name === 'found' && (
        <g {...p}>
          <circle cx="14" cy="14" r="9" />
          <path d="M21 21l6 6M14 9v10M9 14h10" />
        </g>
      )}
      {name === 'speed' && (
        <g {...p}>
          <path d="M18 3 7 18h7l-1 11 11-15h-7z" />
        </g>
      )}
    </svg>
  )
}

const PILLARS = [
  {
    n: '01',
    icon: 'depth',
    head: 'Cinematic 3D',
    body: 'A living scene — real obsidian, real fire, real depth — rendered in the browser. Not a stock hero. The first three seconds make a visitor stop, lean in, and trust you before they read a word.',
  },
  {
    n: '02',
    icon: 'convert',
    head: 'Built to book',
    body: 'Every section points the sword. One straight path from cold visitor to booked job — call, quote, form — routed to your phone and aimed at the only number that counts: work on your calendar.',
  },
  {
    n: '03',
    icon: 'found',
    head: 'Found by search + AI',
    body: 'Prerendered, structured, and machine-readable so Google ranks you and the AI answer engines — ChatGPT, Gemini, Perplexity — quote you by name when buyers ask who to hire.',
  },
  {
    n: '04',
    icon: 'speed',
    head: 'Blistering speed',
    body: 'Sub-second loads on a phone over cell service. Speed is conversion: every wasted second leaks a visitor to the competitor who picks up. We forge sites that snap — no spinners, no bloat, no excuses.',
  },
]

/* The standard — three forged tenets, revealed on scroll. */
function Standard() {
  const [ref, shown] = useReveal({ enter: 0.92 })
  const tenets = [
    {
      k: 'Real motion',
      v: 'Every transition is engineered, not stock. Brutalist Snap — zero delay, high momentum, only impact. Motion that feels forged, never decorative.',
    },
    {
      k: 'Sharp craft',
      v: 'Zero rounded corners. Hard 1px borders, the 8px drop shadow, an iron grid in absolute alignment. Brutalist discipline on every pixel.',
    },
    {
      k: 'No template',
      v: 'Bespoke on-brand SVG and CSS, hand-built for your business. The same forge that built this page builds yours — to this exact bar, and shipped in 7 days.',
    },
  ]
  return (
    <ol ref={ref} className={`pg-web-tenets ${shown ? 'is-shown' : ''}`}>
      {tenets.map((t, i) => (
        <li className="pg-web-tenet" style={{ '--ti': i }} key={t.k}>
          <span className="pg-web-tenet-k">{t.k}</span>
          <span className="pg-web-tenet-v">{t.v}</span>
        </li>
      ))}
    </ol>
  )
}

export default function Web() {
  return (
    <PageShell
      kicker="GW–04 · Web"
      title="Cinematic Web That Books the Truck"
      lede="The page you’re reading is the pitch. Real obsidian, real fire, real speed — we forge every site to this bar and aim it at one outcome: every lead routed straight to your phone, the truck booked."
    >
      {/* ── THE PROOF — the page is the argument ───────────────────────── */}
      <Section eyebrow="The standard" title="This page is the proof." align="start">
        <p>
          No slideshow. No before-and-after. You’re standing inside the work — the obsidian behind
          this copy is a live 3D scene, not an image, running smooth on the phone in your hand. If a
          site stops you here, it stops your customers before they leave to call someone who picks
          up. That’s the whole pitch.
        </p>
        <div className="pg-web-proof">
          <div className="pg-web-proof-stat">
            <span className="pg-web-proof-n">0.05s</span>
            <span className="pg-web-proof-l">to judge your site</span>
          </div>
          <div className="pg-web-proof-stat">
            <span className="pg-web-proof-n">75%</span>
            <span className="pg-web-proof-l">judge the business by it</span>
          </div>
          <div className="pg-web-proof-stat">
            <span className="pg-web-proof-n">1 shot</span>
            <span className="pg-web-proof-l">at the first impression</span>
          </div>
        </div>
      </Section>

      {/* ── WHY MOST SITES FAIL — dead card vs living forge ────────────── */}
      <Section eyebrow="The problem" title="Most contractor sites book nothing." align="start">
        <p>
          They’re digital business cards — a logo, a phone number, a stock handshake. Slow to load,
          invisible to Google, identical to every competitor. The visitor lands, waits, gives up,
          and calls the next shop. A site that just sits there isn’t marketing — it’s a brochure
          that quietly hands your jobs to someone else.
        </p>
        <div className="pg-web-versus">
          <div className="pg-web-card pg-web-card--dead">
            <span className="pg-web-card-tag">The business card</span>
            <ul className="pg-web-card-list">
              <li>Loads slow, bounces fast</li>
              <li>Buried on page 4 of Google</li>
              <li>Looks like every other shop</li>
              <li>No path to the call</li>
              <li>Sits there. Books nothing.</li>
            </ul>
          </div>
          <div className="pg-web-versus-rule" aria-hidden="true">
            <span>VS</span>
          </div>
          <div className="pg-web-card pg-web-card--forge">
            <span className="pg-web-card-tag">The GAELWORX build</span>
            <ul className="pg-web-card-list">
              <li>Snaps open in under a second</li>
              <li>Ranked, structured, AI-quotable</li>
              <li>Unmistakably, only yours</li>
              <li>Routes every lead to your phone</li>
              <li>Books the truck while you sleep</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── WHAT YOU GET — four forged pillars, layered brutalist panels ── */}
      <Section eyebrow="What you get" title="A site engineered to book the truck." align="start">
        <p>
          Four things, non-negotiable. We’ve already proven each one on the page you’re on — bolted
          together into a site that doesn’t just look the part, it routes the lead and books the work.
        </p>
        <div className="pg-web-pillars">
          {PILLARS.map((p) => (
            <article className="pg-web-pillar" key={p.n}>
              <header className="pg-web-pillar-top">
                <span className="pg-web-pillar-n">{p.n}</span>
                <span className="pg-web-pillar-ico"><Icon name={p.icon} /></span>
              </header>
              <h3 className="pg-web-pillar-head">{p.head}</h3>
              <p className="pg-web-pillar-body">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── THE GAELWORX STANDARD — kinetic manifesto + tenets ─────────── */}
      <Section eyebrow="The GAELWORX standard" align="center" className="pg-web-std">
        <ForgeText
          as="h2"
          className="flame pg-web-manifesto"
          text="We forge the web like iron."
        />
        <p className="pg-web-std-lede">
          <BrandText text="Anyone can ship a template. GAELWORX ships craft — Automatic Execution, in the browser. Real motion, a sharp brutalist build, aimed at the only number that matters: the truck booked." />
        </p>
        <Standard />
      </Section>

      {/* ── INVESTMENT — anchored ledger, two scoped tiers ────────────── */}
      <Section eyebrow="Investment" title="Premium craft. Front-door price." align="center">
        <p className="pg-web-invest-lede">
          Premium studios bill <s>$15,000–$50,000+</s> for cinematic web. We forged the process, so
          you skip the discovery theater and pay for the build, not the meetings. Fixed scope, fixed
          price before we strike — pick your scope.
        </p>
        <div className="pg-web-ledger">
          <div className="pg-web-tier">
            <span className="pg-web-tier-tag">The Front Door</span>
            <span className="pg-web-tier-price">$1,299</span>
            <span className="pg-web-tier-sub">starting at</span>
            <p className="pg-web-tier-body">
              A fast, ranked, single-page site engineered to book. Cinematic where it counts, every
              lead routed to your phone, shipped in 7 days — built to this standard.
            </p>
          </div>
          <div className="pg-web-tier pg-web-tier--flagship">
            <span className="pg-web-tier-flag">Flagship</span>
            <span className="pg-web-tier-tag">The Full Forge</span>
            <span className="pg-web-tier-price">$8,999</span>
            <span className="pg-web-tier-sub">up to</span>
            <p className="pg-web-tier-body">
              A full multi-page cinematic build — 3D scene, custom motion, lead capture wired
              straight to your phone, AI-quotable and search-dominant. The page you’re on, made
              yours, booking the truck.
            </p>
          </div>
        </div>
        <p className="pg-web-ledger-foot">Scoped to the job. Fixed price before we strike. No pilots that rot in phase two. Continental US · 7 days.</p>
      </Section>

      <style>{`
        /* ── GW–04 WEB · namespaced bespoke craft (.pg-web-*) ──────────── */

        /* proof stat strip — forged numerals, iron-grid row */
        .pg-web-proof{display:grid; grid-template-columns:repeat(3,1fr); gap:0;
          margin-top:clamp(28px,4vh,48px); border:1px solid rgba(141,153,174,0.25);
          box-shadow:8px 8px 0 rgba(0,0,0,0.55); background:rgba(15,17,22,0.4);}
        .pg-web-proof-stat{display:flex; flex-direction:column; gap:8px;
          padding:clamp(18px,2.6vw,30px) clamp(14px,2vw,26px);
          border-right:1px solid rgba(141,153,174,0.18);}
        .pg-web-proof-stat:last-child{border-right:0;}
        .pg-web-proof-n{font-family:var(--gw-display); font-weight:900; line-height:1;
          font-size:clamp(1.5rem,4.4vw,2.6rem); color:var(--gw-ember);
          text-shadow:0 0 24px rgba(218,44,28,0.35);}
        .pg-web-proof-l{font-size:clamp(11px,1.3vw,13px); letter-spacing:0.04em; line-height:1.35;
          text-transform:uppercase; font-weight:700; color:var(--gw-steel);}

        /* versus — dead card vs the forge, the rule between them */
        .pg-web-versus{display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch;
          gap:0; margin-top:clamp(30px,4.5vh,52px);}
        .pg-web-card{border:1px solid rgba(141,153,174,0.25); background:rgba(15,17,22,0.45);
          padding:clamp(22px,3vw,34px);}
        .pg-web-card--dead{box-shadow:8px 8px 0 rgba(0,0,0,0.4); opacity:0.78;}
        .pg-web-card--forge{border-color:rgba(193,41,46,0.7); background:rgba(28,16,14,0.5);
          box-shadow:8px 8px 0 rgba(0,0,0,0.6),
            inset 0 0 60px rgba(193,41,46,0.1);}
        .pg-web-card-tag{display:block; font-size:11px; letter-spacing:0.32em; font-weight:700;
          text-transform:uppercase; margin-bottom:clamp(14px,2vw,20px);
          color:var(--gw-steel);}
        .pg-web-card--forge .pg-web-card-tag{color:var(--gw-ember);}
        .pg-web-card-list{list-style:none; margin:0; padding:0; display:flex; flex-direction:column;
          gap:clamp(9px,1.4vw,13px);}
        .pg-web-card-list li{position:relative; padding-left:22px; line-height:1.4;
          font-size:clamp(0.95rem,1.4vw,1.08rem); color:var(--gw-steel);}
        .pg-web-card-list li::before{content:""; position:absolute; left:0; top:0.55em;
          width:9px; height:1.5px; background:var(--gw-steel);}
        .pg-web-card--dead .pg-web-card-list li::before{background:rgba(141,153,174,0.5);}
        .pg-web-card--forge .pg-web-card-list li{color:var(--gw-bone);}
        .pg-web-card--forge .pg-web-card-list li::before{
          background:linear-gradient(90deg,var(--gw-ember),var(--gw-forge)); width:11px; height:2px;}
        .pg-web-versus-rule{display:flex; align-items:center; justify-content:center;
          padding:0 clamp(10px,1.6vw,18px);}
        .pg-web-versus-rule span{font-family:var(--gw-display); font-weight:900;
          font-size:clamp(0.85rem,1.6vw,1.1rem); letter-spacing:0.06em; color:var(--gw-steel);
          opacity:0.7;}

        /* pillars — layered brutalist panels, 8px hard shadow, ember on hover */
        .pg-web-pillars{display:grid; grid-template-columns:repeat(2,1fr); gap:clamp(16px,2vw,24px);
          margin-top:clamp(30px,4.5vh,52px);}
        .pg-web-pillar{position:relative; border:1px solid rgba(141,153,174,0.25);
          background:rgba(15,17,22,0.5); box-shadow:8px 8px 0 rgba(0,0,0,0.55);
          padding:clamp(22px,2.8vw,34px); color:var(--gw-steel);
          transition:border-color .3s var(--ease), box-shadow .3s var(--ease),
            transform .3s var(--ease);}
        .pg-web-pillar:hover{border-color:rgba(218,44,28,0.7); transform:translate(-2px,-2px);
          box-shadow:10px 10px 0 rgba(0,0,0,0.6), inset 0 0 50px rgba(193,41,46,0.08);}
        .pg-web-pillar-top{display:flex; align-items:center; justify-content:space-between;
          margin-bottom:clamp(16px,2vw,22px);}
        .pg-web-pillar-n{font-family:var(--gw-display); font-weight:900; line-height:1;
          font-size:clamp(1.3rem,2.4vw,1.8rem); color:rgba(141,153,174,0.55);}
        .pg-web-pillar:hover .pg-web-pillar-n{color:var(--gw-ember);
          text-shadow:0 0 22px rgba(218,44,28,0.4);}
        .pg-web-pillar-ico{color:var(--gw-steel); display:flex; transition:color .3s var(--ease);}
        .pg-web-pillar:hover .pg-web-pillar-ico{color:var(--gw-ember);}
        .pg-web-ico{display:block;}
        .pg-web-pillar-head{margin:0 0 10px; font-family:var(--gw-headline); font-weight:800;
          color:var(--gw-bone); font-size:clamp(1.15rem,1.9vw,1.5rem); line-height:1.1;}
        .pg-web-pillar-body{margin:0; font-size:clamp(0.97rem,1.4vw,1.1rem); line-height:1.55;
          color:var(--gw-steel);}

        /* the standard — kinetic manifesto + revealed tenets */
        .pg-web-std .pg-web-manifesto{margin:0 auto; font-family:var(--gw-display);
          text-transform:uppercase; font-weight:900; letter-spacing:0.02em; line-height:1.05;
          font-size:clamp(1.8rem,5.4vw,3.4rem); max-width:18ch;}
        .pg-web-std-lede{margin:clamp(20px,3vh,32px) auto 0; max-width:56ch;
          font-size:clamp(1.05rem,1.6vw,1.28rem); line-height:1.55; color:var(--gw-steel);}
        .pg-web-tenets{list-style:none; margin:clamp(34px,5vh,60px) auto 0; padding:0;
          display:grid; grid-template-columns:repeat(3,1fr); gap:0; max-width:980px;
          border-top:1px solid rgba(141,153,174,0.22); text-align:left;}
        .pg-web-tenet{padding:clamp(22px,2.8vw,32px) clamp(16px,2vw,26px);
          border-right:1px solid rgba(141,153,174,0.16);
          border-bottom:1px solid rgba(141,153,174,0.16);
          opacity:0; transform:translateY(20px); filter:blur(8px);
          transition:opacity .7s var(--ease), transform .7s var(--ease), filter .7s var(--ease);
          transition-delay:calc(var(--ti) * 120ms);}
        .pg-web-tenet:last-child{border-right:0;}
        .pg-web-tenets.is-shown .pg-web-tenet{opacity:1; transform:none; filter:blur(0);}
        .pg-web-tenet-k{display:block; font-family:var(--gw-headline); font-weight:800;
          color:var(--gw-bone); font-size:clamp(1.1rem,1.8vw,1.4rem); margin-bottom:10px;}
        .pg-web-tenet-v{display:block; font-size:clamp(0.95rem,1.4vw,1.08rem); line-height:1.55;
          color:var(--gw-steel);}

        /* investment — anchored ledger, two scoped tiers */
        .pg-web-invest-lede{margin:0 auto; max-width:58ch;}
        .pg-web-invest-lede s{color:rgba(141,153,174,0.7);
          text-decoration-color:rgba(193,41,46,0.55);}
        .pg-web-ledger{display:grid; grid-template-columns:1fr 1fr; gap:0;
          margin:clamp(34px,5vh,56px) auto 0; max-width:880px; text-align:left;}
        .pg-web-tier{position:relative; border:1px solid rgba(141,153,174,0.25);
          background:rgba(15,17,22,0.5); padding:clamp(26px,3.4vw,40px);
          box-shadow:8px 8px 0 rgba(0,0,0,0.5); display:flex; flex-direction:column;}
        .pg-web-tier--flagship{border-color:rgba(193,41,46,0.7);
          background:rgba(28,16,14,0.5);
          box-shadow:8px 8px 0 rgba(0,0,0,0.62), inset 0 0 70px rgba(193,41,46,0.1);}
        .pg-web-tier-flag{position:absolute; top:-1px; right:-1px;
          font-size:10px; letter-spacing:0.28em; font-weight:700; text-transform:uppercase;
          color:#1a0b04; background:linear-gradient(180deg,var(--gw-ember),var(--gw-forge));
          padding:6px 12px;}
        .pg-web-tier-tag{font-size:11px; letter-spacing:0.3em; font-weight:700; text-transform:uppercase;
          color:var(--gw-steel); margin-bottom:clamp(12px,1.6vw,18px);}
        .pg-web-tier--flagship .pg-web-tier-tag{color:var(--gw-ember);}
        .pg-web-tier-price{font-family:var(--gw-display); font-weight:900; line-height:1;
          font-size:clamp(2.2rem,6vw,3.4rem); color:var(--gw-bone);}
        .pg-web-tier--flagship .pg-web-tier-price{color:var(--gw-ember);
          text-shadow:0 0 30px rgba(218,44,28,0.4);}
        .pg-web-tier-sub{font-size:11px; letter-spacing:0.22em; font-weight:700; text-transform:uppercase;
          color:var(--gw-steel); margin-top:8px;}
        .pg-web-tier-body{margin:clamp(16px,2vw,22px) 0 0; font-size:clamp(0.97rem,1.4vw,1.1rem);
          line-height:1.55; color:var(--gw-steel);}
        .pg-web-ledger-foot{margin:clamp(22px,3vh,30px) auto 0; font-size:11px; letter-spacing:0.26em;
          font-weight:700; text-transform:uppercase; color:var(--gw-steel);}

        /* ── responsive — read beautifully at 393px ───────────────────── */
        @media (max-width:720px){
          .pg-web-pillars{grid-template-columns:1fr;}
          .pg-web-ledger{grid-template-columns:1fr;}
          .pg-web-tier{box-shadow:6px 6px 0 rgba(0,0,0,0.5);}
          .pg-web-versus{grid-template-columns:1fr; gap:0;}
          .pg-web-versus-rule{padding:clamp(12px,3vw,18px) 0;}
          .pg-web-card--dead{box-shadow:6px 6px 0 rgba(0,0,0,0.4);}
          .pg-web-card--forge{box-shadow:6px 6px 0 rgba(0,0,0,0.6), inset 0 0 60px rgba(193,41,46,0.1);}
          .pg-web-tenets{grid-template-columns:1fr; max-width:none;}
          .pg-web-tenet{border-right:0;}
        }
        @media (max-width:420px){
          .pg-web-proof{grid-template-columns:1fr;}
          .pg-web-proof-stat{border-right:0;
            border-bottom:1px solid rgba(141,153,174,0.18); flex-direction:row;
            align-items:baseline; gap:12px;}
          .pg-web-proof-stat:last-child{border-bottom:0;}
          .pg-web-proof-n{font-size:clamp(1.6rem,8vw,2.2rem);}
        }
        @media (prefers-reduced-motion:reduce){
          .pg-web-pillar{transition:none;}
          .pg-web-tenet{opacity:1; transform:none; filter:none; transition:none;}
        }
      `}</style>
    </PageShell>
  )
}
