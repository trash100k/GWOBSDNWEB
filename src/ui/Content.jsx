import { useEffect, useState } from 'react'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import BrandText from './BrandText.jsx'
import { useReveal } from '../hooks.js'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

/** Floating branch list — no cards. Hover (desktop) or tap (mobile) ignites the
    matching monolith; reads forge.hovered back so 3D↔DOM stay in sync. */
function BranchList() {
  const [hovered, setHovered] = useState(-1)
  useEffect(() => {
    let raf
    const tick = () => {
      setHovered((h) => (h === forge.hovered ? h : forge.hovered))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <ul className="branch-list">
      {COPY.arsenal.branches.map((b, i) => (
        <li
          key={b.id}
          className={`branch-row ${hovered === i ? 'on' : ''}`}
          style={{ '--bi': i }}
          onMouseEnter={() => (forge.hovered = i)}
          onMouseLeave={() => forge.hovered === i && (forge.hovered = -1)}
          onClick={() => (forge.hovered = i)}
        >
          <span className="branch-id">{b.id} · <BrandText text={b.tag} /></span>
          <span className="branch-line"><BrandText text={b.line} /></span>
          <span className="branch-body"><BrandText text={b.body} /></span>
        </li>
      ))}
    </ul>
  )
}

function Body({ children, className = '' }) {
  const [ref, shown] = useReveal()
  return (
    <p ref={ref} className={`reveal ${shown ? 'shown' : ''} ${className}`}>
      {typeof children === 'string' ? <BrandText text={children} /> : children}
    </p>
  )
}

export default function Content() {
  return (
    <div className="content">
      {/* 01 — hero */}
      <section className="sec sec--hero" id="sec-core">
        <div className="hero-inner">
          <span className="eyebrow">{COPY.hero.eyebrow}</span>
          <ForgeText as="h1" className="headline etched" text={COPY.hero.headline} delay={1500} ignite />
          <p className="hero-sub">{COPY.hero.sub}</p>
          <a className="cta magnetic" href="#sec-point" onClick={strike}>
            <span>{COPY.hero.cta}</span>
          </a>
        </div>
        <div className="scrollcue" aria-hidden="true"><span>Descend</span><i /></div>
      </section>

      {/* 02 — interstitial */}
      <section className="sec sec--draw">
        <ForgeText as="p" className="draw-line" text={COPY.draw} />
      </section>

      {/* 03 — the clan */}
      <section className="sec sec--left" id="sec-clan">
        <div className="block">
          <span className="kicker">{COPY.clan.kicker}</span>
          <ForgeText as="h2" className="head" text={COPY.clan.head} />
          <Body>{COPY.clan.body}</Body>
        </div>
      </section>

      {/* 04 — the arsenal */}
      <section className="sec sec--arsenal" id="sec-arsenal">
        <div className="block block--wide">
          <span className="kicker">{COPY.arsenal.kicker}</span>
          <ForgeText as="h2" className="head" text={COPY.arsenal.head} />
          <Body className="intro">{COPY.arsenal.intro}</Body>
          <BranchList />
        </div>
      </section>

      {/* 05 — point the sword */}
      <section className="sec sec--left" id="sec-point">
        <div className="block">
          <span className="kicker">{COPY.point.kicker}</span>
          <ForgeText as="h2" className="head" text={COPY.point.head} />
          <Body>{COPY.point.body}</Body>
          <a className="cta cta--solid magnetic" href="#sec-core" onClick={strike}>
            <span>{COPY.point.cta}</span>
          </a>
          <span className="avail">{COPY.point.avail}</span>
        </div>
      </section>

      <footer className="foot">
        <span><BrandText text={COPY.footer.mark} /></span>
        <span className="foot-tag">{COPY.footer.tag}</span>
      </footer>
    </div>
  )
}
