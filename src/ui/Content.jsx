import { useEffect, useMemo, useRef, useState } from 'react'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import BrandText from './BrandText.jsx'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

/** Arsenal branch list — ambient, no cards. Hover (desktop) or tap (mobile)
    ignites the matching vein region; reads forge.hovered back so 3D↔DOM sync. */
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

const rnd = (a, b) => a + Math.random() * (b - a)
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeIn = (x) => x * x * x

/**
 * Ambient scroll-jacked stage. There are no containers — the obsidian is the
 * environment, and the copy "frames" are jacked IN on scroll (pinned in place,
 * never physically scrolling) from a RANDOM entry vector each, blur→sharp. A tall
 * invisible track supplies the scroll distance (so the 3D scene stays scroll-
 * reactive and the nav still scrubs).
 */
export default function Content() {
  const frameRefs = useRef([])
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // Per-frame random entry/exit vectors — fixed for this mount. Randomizing the
  // entry point is what gives each reveal its own punch.
  const N = 6
  const vecs = useMemo(
    () =>
      Array.from({ length: N }, () => {
        const ang = Math.random() * Math.PI * 2
        const dist = rnd(52, 96)
        const exAng = ang + Math.PI + rnd(-0.7, 0.7)
        return {
          ex: Math.cos(ang) * dist, // entry translate, vw / vh
          ey: Math.sin(ang) * dist * 0.85,
          rot: rnd(-10, 10),
          blur: rnd(18, 32),
          scale: rnd(0.82, 0.92),
          ox: Math.cos(exAng) * rnd(22, 44), // exit drift
          oy: Math.sin(exAng) * rnd(18, 36) - 10,
          orot: rnd(-6, 6),
          oblur: rnd(10, 20),
        }
      }),
    []
  )

  const scrollToFrame = (i) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max > 0 ? (i / (N - 1)) * max : 0, behavior: 'smooth' })
  }

  // Drive the frame composite from scroll progress every rAF.
  useEffect(() => {
    let raf
    let px = 0, py = 0
    const root = document.documentElement
    const H = 0.18 // half-width held fully sharp
    const W = 0.96 // half-width fully faded
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
      const pos = p * (N - 1)
      // depth parallax: copy, haze + slab drift at different rates with pointer
      if (!reduced) {
        px += (forge.pointer.x - px) * 0.06
        py += (forge.pointer.y - py) * 0.06
        root.style.setProperty('--px', px.toFixed(4))
        root.style.setProperty('--py', (-py).toFixed(4))
      }
      for (let i = 0; i < N; i++) {
        const el = frameRefs.current[i]
        if (!el) continue
        const t = pos - i
        const at = Math.abs(t)
        const opacity = at <= H ? 1 : Math.max(0, 1 - (at - H) / (W - H))
        const v = vecs[i]
        let tx = 0, ty = 0, rot = 0, blur = 0, sc = 1
        if (!reduced && at > H) {
          const f0 = Math.min((at - H) / (W - H), 1)
          if (t < 0) {
            const f = easeOut(f0)
            tx = v.ex * f; ty = v.ey * f; rot = v.rot * f; blur = v.blur * f; sc = 1 - (1 - v.scale) * f
          } else {
            const f = easeIn(f0)
            tx = v.ox * f; ty = v.oy * f; rot = v.orot * f; blur = v.oblur * f; sc = 1 - 0.03 * f
          }
        }
        el.style.opacity = opacity.toFixed(3)
        el.style.transform = reduced
          ? 'none'
          : `translate3d(${tx.toFixed(2)}vw, ${ty.toFixed(2)}vh, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`
        el.style.filter = !reduced && blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none'
        el.classList.toggle('is-active', opacity > 0.6)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [vecs, reduced])

  const setRef = (i) => (el) => (frameRefs.current[i] = el)

  return (
    <>
      <div className="stage" aria-label="GAELWORX">
        {/* 00 — hero */}
        <div className="frame frame--hero" ref={setRef(0)}>
          <div className="fbody">
            <span className="eyebrow">{COPY.hero.eyebrow}</span>
            <ForgeText as="h1" className="headline etched flame" text={COPY.hero.headline} delay={1200} ignite />
            <p className="hero-sub">{COPY.hero.sub}</p>
            <button className="cta magnetic" onClick={() => { strike(); scrollToFrame(4) }}>
              <span>{COPY.hero.cta}</span>
            </button>
          </div>
          <div className="scrollcue" aria-hidden="true"><span>Descend</span><i /></div>
        </div>

        {/* 01 — interstitial */}
        <div className="frame frame--draw" ref={setRef(1)}>
          <p className="draw-line flame">{COPY.draw}</p>
        </div>

        {/* 02 — the clan */}
        <div className="frame" ref={setRef(2)}>
          <div className="fbody">
            <span className="kicker">{COPY.clan.kicker}</span>
            <ForgeText as="h2" className="head flame" text={COPY.clan.head} />
            <p className="body"><BrandText text={COPY.clan.body} /></p>
          </div>
        </div>

        {/* 03 — the arsenal */}
        <div className="frame frame--arsenal" ref={setRef(3)}>
          <div className="fbody fbody--wide">
            <span className="kicker">{COPY.arsenal.kicker}</span>
            <ForgeText as="h2" className="head flame" text={COPY.arsenal.head} />
            <p className="body intro"><BrandText text={COPY.arsenal.intro} /></p>
            <BranchList />
          </div>
        </div>

        {/* 04 — point */}
        <div className="frame" ref={setRef(4)}>
          <div className="fbody">
            <span className="kicker">{COPY.point.kicker}</span>
            <ForgeText as="h2" className="head flame" text={COPY.point.head} />
            <p className="body"><BrandText text={COPY.point.body} /></p>
            <button className="cta cta--solid magnetic" onClick={() => { strike(); scrollToFrame(0) }}>
              <span>{COPY.point.cta}</span>
            </button>
            <span className="avail">{COPY.point.avail}</span>
          </div>
        </div>

        {/* 05 — sign-off */}
        <div className="frame frame--foot" ref={setRef(5)}>
          <div className="fbody">
            <span className="foot-mark"><BrandText text={COPY.footer.mark} /></span>
            <span className="foot-tag">{COPY.footer.tag}</span>
          </div>
        </div>
      </div>

      {/* invisible track: supplies scroll distance for the jack + the 3D scene */}
      <div className="scroll-track" style={{ height: `${N * 100}vh` }} aria-hidden="true" />
    </>
  )
}
