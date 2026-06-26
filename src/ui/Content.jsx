import { useEffect, useRef, useState } from 'react'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import { useReveal } from '../hooks.js'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

function ArsenalCards() {
  const [hovered, setHovered] = useState(-1)
  // Reflect the 3D blade hover into the DOM (one-way read each frame).
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
    <div className="arsenal-cards">
      {COPY.arsenal.branches.map((b, i) => (
        <article
          key={b.id}
          className={`branch ${hovered === i ? 'on' : ''}`}
          onMouseEnter={() => (forge.hovered = i)}
          onMouseLeave={() => forge.hovered === i && (forge.hovered = -1)}
        >
          <span className="branch-id">{b.id} · {b.tag}</span>
          <h3 className="branch-line">{b.line}</h3>
          <p>{b.body}</p>
        </article>
      ))}
    </div>
  )
}

function Body({ children, className = '' }) {
  const [ref, shown] = useReveal()
  return (
    <p ref={ref} className={`reveal ${shown ? 'shown' : ''} ${className}`}>
      {children}
    </p>
  )
}

export default function Content() {
  const drawRef = useRef(null)
  return (
    <div className="content">
      {/* 01 — THE CORE / hero */}
      <section className="sec sec--hero" id="sec-core">
        <div className="hero-inner">
          <span className="eyebrow">{COPY.hero.eyebrow}</span>
          <ForgeText as="h1" className="headline etched" text={COPY.hero.headline} delay={1500} />
          <p className="hero-sub">{COPY.hero.sub}</p>
          <a className="cta magnetic" href="#sec-point" onClick={strike}>
            <span>{COPY.hero.cta}</span>
          </a>
        </div>
        <div className="scrollcue" aria-hidden="true"><span>Draw</span><i /></div>
      </section>

      {/* 02 — THE DRAW (interstitial) */}
      <section className="sec sec--draw" ref={drawRef}>
        <ForgeText as="p" className="draw-line" text={COPY.draw} />
      </section>

      {/* 03 — THE CLAN */}
      <section className="sec sec--left" id="sec-clan">
        <div className="block">
          <span className="kicker">{COPY.clan.kicker}</span>
          <ForgeText as="h2" className="head" text={COPY.clan.head} />
          <Body>{COPY.clan.body}</Body>
        </div>
      </section>

      {/* 04 — THE ARSENAL */}
      <section className="sec sec--arsenal" id="sec-arsenal">
        <div className="block block--wide">
          <span className="kicker">{COPY.arsenal.kicker}</span>
          <ForgeText as="h2" className="head" text={COPY.arsenal.head} />
          <Body className="intro">{COPY.arsenal.intro}</Body>
          <ArsenalCards />
        </div>
      </section>

      {/* 05 — POINT THE SWORD */}
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
        <span>{COPY.footer.mark}</span>
        <span className="foot-tag">{COPY.footer.tag}</span>
      </footer>
    </div>
  )
}
