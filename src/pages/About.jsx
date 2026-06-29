import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import Ignite from '../ui/Ignite.jsx'
import BrandText from '../ui/BrandText.jsx'
import { COPY } from '../brand.js'

/**
 * /about — One forge, four branches → the clan ethos → we build what we know →
 * the AI philosophy → the 5 trust pillars → CTA. Built on PageShell + Section.
 * Bespoke craft lives in the namespaced `.pg-about-*` <style> block below:
 * a monolinear Celtic-knot seal and the four branches rendered as a forged
 * lineage diagram. No new WebGL — the per-route obsidian scene plays behind.
 */

// The four branches — the forge's own platforms, the proof under the ethos.
const BRANCHES = [
  { name: 'YardWorx', domain: 'The yards.' },
  { name: 'RepairWorx', domain: 'The shops.' },
  { name: 'SalesWorx', domain: 'The pipeline.' },
  { name: 'AgentWorx', domain: 'The front desk.' },
]

// A single-weight (1.5px) monolinear Celtic-knot seal — the clan motif. Pure
// SVG, strictly monochrome, sharp framing. Decorative only (aria-hidden).
function ClanKnot() {
  return (
    <svg
      className="pg-about-knot"
      viewBox="0 0 120 120"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="114" height="114" className="pg-about-knot-frame" />
      <g className="pg-about-knot-strands">
        {/* four interlaced loops braided around the center — the four branches, one weave */}
        <path d="M60 18 C82 18 102 38 102 60 C102 82 82 102 60 102 C38 102 18 82 18 60 C18 38 38 18 60 18 Z" />
        <path d="M60 30 C60 48 72 60 90 60 C72 60 60 72 60 90 C60 72 48 60 30 60 C48 60 60 48 60 30 Z" />
        <path d="M35 35 C50 50 70 50 85 35 C70 50 70 70 85 85 C70 70 50 70 35 85 C50 70 50 50 35 35 Z" />
        <circle cx="60" cy="60" r="9" />
        <circle cx="60" cy="60" r="2.5" className="pg-about-knot-core" />
      </g>
    </svg>
  )
}

export default function About() {
  return (
    <PageShell
      kicker="The Clan"
      title="One Forge. Four Branches."
      lede="GAELWORX is an engineering forge, not an agency. We ship our own platforms and build the same caliber of systems for you — moving like a clan: small, fast, fully accountable."
    >
      <style>{ABOUT_CSS}</style>

      {/* ── THE CLAN ETHOS — engineering forge, not an agency ─────────────── */}
      <Section eyebrow="01 · The Clan" title="An engineering forge. Not an agency." align="start">
        <div className="pg-about-ethos">
          <div className="pg-about-ethos-copy">
            <p>
              <BrandText text="No account managers. No layers between you and the work. GAELWORX moves like a clan — small, fast, fully accountable for every line we ship." />
            </p>
            <p>
              You talk to the people who build it. The same hands that forged
              <BrandText text=" YardWorx, RepairWorx, SalesWorx, and AgentWorx" /> sit
              across from you and answer for the system that runs your business.
            </p>
          </div>
          <figure className="pg-about-seal">
            <ClanKnot />
            <figcaption>One weave. Four strands.</figcaption>
          </figure>
        </div>
      </Section>

      {/* ── THE FOUR BRANCHES — a forged lineage diagram ──────────────────── */}
      <Section eyebrow="The Lineage" title="One forge. Four branches." align="center">
        <p>
          <BrandText text="Four proprietary platforms, all forged on the same anvil. The branches differ; the steel does not." />
        </p>
        <div className="pg-about-branches" aria-label="The four branches of GAELWORX">
          <div className="pg-about-branches-trunk" aria-hidden="true">
            <span className="pg-about-trunk-mark"><Ignite text="GAELWORX" /></span>
          </div>
          <ul className="pg-about-branch-grid">
            {BRANCHES.map((b) => (
              <li key={b.name} className="pg-about-branch">
                <span className="pg-about-branch-name"><Ignite text={b.name} /></span>
                <span className="pg-about-branch-domain">{b.domain}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── WE BUILD WHAT WE KNOW — first-hand knowledge ──────────────────── */}
      <Section eyebrow="02 · The Ground" title="We build what we know." align="start" tone="panel">
        <p>
          Every build starts from decades of first-hand knowledge. We have
          <strong> run the operation, not read the case study</strong> — worked the
          bottlenecks we automate and lived the problems we solve.
        </p>
        <p>
          So you are never paying us to learn your business on your dime. We arrive
          knowing the work, and we forge for how you actually run it.
        </p>
      </Section>

      {/* ── THE AI PHILOSOPHY — curiosity, not reliance ───────────────────── */}
      <Section eyebrow="03 · The Ethic" title="Curiosity, not reliance." align="start">
        <p>
          Our goal is to inspire curiosity, never to breed dependence. No black-box
          oracle. No confident nonsense. No machine pretending to be the human in the room.
        </p>
        <div className="pg-about-ethic">
          <div className="pg-about-ethic-row">
            <span className="pg-about-ethic-label">The machine</span>
            <span className="pg-about-ethic-val">does the rote, and shows its reasoning.</span>
          </div>
          <div className="pg-about-ethic-row">
            <span className="pg-about-ethic-label">The judgment</span>
            <span className="pg-about-ethic-val">stays where it belongs — yours.</span>
          </div>
          <div className="pg-about-ethic-row">
            <span className="pg-about-ethic-label">The result</span>
            <span className="pg-about-ethic-val">grounded teaching that makes you sharper, not hooked.</span>
          </div>
        </div>
      </Section>

      {/* ── THE TRUST PILLARS — the five rungs as brutalist cards ─────────── */}
      <Section eyebrow="Why GAELWORX" title="Five pillars hold the forge." align="start">
        <ol className="pg-about-pillars">
          {COPY.trust.rungs.map((r) => (
            <li key={r.n} className="pg-about-pillar pg-panel">
              <span className="pg-about-pillar-n">{r.n}</span>
              <div className="pg-about-pillar-body">
                <h3 className="pg-about-pillar-head">
                  <BrandText text={r.head} />
                </h3>
                <p>
                  <BrandText text={r.body} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </PageShell>
  )
}

/* Namespaced bespoke styling — every selector prefixed `.pg-about-`. Sharp
   corners, hard borders, Industrial Metallurgy tokens, Brutalist Snap motion. */
const ABOUT_CSS = `
.pg-about-ethos{display:grid; grid-template-columns:1.6fr 1fr; gap:clamp(28px,5vw,64px);
  align-items:center; margin-top:clamp(20px,3vh,36px);}
.pg-about-ethos-copy p{margin:0 0 clamp(16px,2.2vh,24px);}
.pg-about-ethos-copy p:last-child{margin-bottom:0;}

/* the clan seal — monolinear Celtic knot in a sharp Ash frame */
.pg-about-seal{margin:0; display:flex; flex-direction:column; align-items:center; gap:14px;}
.pg-about-knot{width:min(74vw,260px); height:auto; display:block;
  filter:drop-shadow(0 0 26px rgba(232,93,4,0.18));}
.pg-about-knot-frame{fill:none; stroke:rgba(141,153,174,0.4); stroke-width:1.5;}
.pg-about-knot-strands path,.pg-about-knot-strands circle{fill:none;
  stroke:var(--gw-ember); stroke-width:1.5; stroke-linejoin:round; stroke-linecap:round;
  opacity:0.92;}
.pg-about-knot-core{fill:var(--gw-ember); stroke:none;
  filter:drop-shadow(0 0 8px rgba(232,93,4,0.9));}
.pg-about-seal figcaption{font-family:var(--gw-headline); font-weight:700;
  font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:var(--gw-steel);}

/* the four branches — a forged lineage diagram. Trunk mark above a 0-gap grid
   of branch cells (Iron Grid: hard borders, absolute alignment, sharp corners). */
.pg-about-branches{margin-top:clamp(34px,5vh,60px);}
.pg-about-branches-trunk{display:flex; justify-content:center; padding-bottom:clamp(20px,3vh,32px);
  position:relative;}
.pg-about-branches-trunk::after{content:""; position:absolute; left:50%; bottom:0;
  width:1.5px; height:clamp(20px,3vh,32px); background:linear-gradient(180deg,var(--gw-forge),var(--gw-ember));
  transform:translateX(-50%);}
.pg-about-trunk-mark{font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  font-size:clamp(1.1rem,3.4vw,1.9rem); letter-spacing:0.14em; color:var(--gw-bone);
  text-shadow:0 0 26px rgba(232,93,4,0.3);}
.pg-about-branch-grid{list-style:none; margin:0; padding:0; display:grid;
  grid-template-columns:repeat(4,1fr); border:1px solid rgba(141,153,174,0.28);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
.pg-about-branch{display:flex; flex-direction:column; gap:8px; align-items:center;
  text-align:center; padding:clamp(20px,2.6vw,34px) clamp(10px,1.4vw,18px);
  border-left:1px solid rgba(141,153,174,0.2); background:rgba(15,17,22,0.5);
  transition:background .3s var(--ease), box-shadow .3s var(--ease);}
.pg-about-branch:first-child{border-left:0;}
.pg-about-branch:hover{background:rgba(31,40,51,0.6);
  box-shadow:inset 0 0 0 1px rgba(232,93,4,0.35);}
.pg-about-branch-name{font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  font-size:clamp(0.92rem,2vw,1.3rem); letter-spacing:0.04em; color:var(--gw-bone); line-height:1.1;}
.pg-about-branch-domain{font-family:var(--gw-headline); font-weight:700; font-size:clamp(11px,1.3vw,13px);
  letter-spacing:0.06em; text-transform:uppercase; color:var(--gw-steel);}

/* the AI ethic — a three-row forged ledger, label struck left, value right */
.pg-about-ethic{margin-top:clamp(26px,4vh,42px); border-top:1px solid rgba(141,153,174,0.22);}
.pg-about-ethic-row{display:grid; grid-template-columns:minmax(120px,0.5fr) 1fr;
  gap:clamp(14px,3vw,40px); align-items:baseline; padding:clamp(16px,2.4vh,22px) clamp(2px,1vw,10px);
  border-bottom:1px solid rgba(141,153,174,0.16);}
.pg-about-ethic-label{font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  letter-spacing:0.04em; font-size:clamp(0.95rem,1.9vw,1.25rem); color:var(--gw-ember);
  text-shadow:0 0 20px rgba(232,93,4,0.3);}
.pg-about-ethic-val{font-family:var(--gw-headline); font-weight:700; line-height:1.4;
  font-size:clamp(1rem,1.6vw,1.22rem); color:var(--gw-bone);}

/* the five pillars — numbered brutalist cards, single column for rhythm/measure */
.pg-about-pillars{list-style:none; margin:clamp(28px,4vh,46px) 0 0; padding:0;
  display:flex; flex-direction:column; gap:clamp(18px,3vh,30px);}
.pg-about-pillar{display:grid; grid-template-columns:auto 1fr; gap:clamp(18px,3vw,40px);
  align-items:start; padding:clamp(24px,3vw,40px);}
.pg-about-pillar-n{font-family:var(--gw-display); font-weight:900; line-height:0.9;
  font-size:clamp(2.4rem,7vw,4.2rem); color:transparent; -webkit-text-fill-color:transparent;
  background:linear-gradient(180deg,#E85D04,#C1292E 60%,#E34A27);
  -webkit-background-clip:text; background-clip:text;
  text-shadow:0 0 30px rgba(232,93,4,0.25);}
.pg-about-pillar-head{margin:0 0 10px; font-family:var(--gw-headline); font-weight:800;
  color:var(--gw-bone); font-size:clamp(1.2rem,2.4vw,1.7rem); line-height:1.08;}
.pg-about-pillar-body p{margin:0; max-width:62ch;}

@media (max-width:760px){
  .pg-about-ethos{grid-template-columns:1fr; gap:clamp(28px,5vw,40px);}
  .pg-about-seal{order:-1;}
  /* the Iron Grid folds to 2×2 on phones — hard borders preserved */
  .pg-about-branch-grid{grid-template-columns:repeat(2,1fr);}
  .pg-about-branch:nth-child(2n+1){border-left:0;}
  .pg-about-branch:nth-child(n+3){border-top:1px solid rgba(141,153,174,0.2);}
  .pg-about-ethic-row{grid-template-columns:1fr; gap:4px;}
  .pg-about-pillar{grid-template-columns:1fr; gap:6px; padding:clamp(22px,6vw,32px);}
  .pg-about-pillar-n{font-size:clamp(2rem,12vw,3rem);}
}

@media (prefers-reduced-motion:reduce){
  .pg-about-branch{transition:none;}
}
`
