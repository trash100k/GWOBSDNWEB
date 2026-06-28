import { useEffect, useMemo, useRef } from 'react'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import BrandText from './BrandText.jsx'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

const rnd = (a, b) => a + Math.random() * (b - a)
const clamp = (x, a, b) => Math.min(Math.max(x, a), b)
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeIn = (x) => x * x * x

// Six frames, weighted scroll allocation — the Arsenal gets the long pin so its
// 3D carousel has room to rotate. Centers + half-spans are in progress space.
const FRAMES = 6
const ARSENAL = 3
const WEIGHTS = [1, 0.8, 1, 2.6, 1, 1]
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0)
const CENTERS = []
const HALF = []
;(() => {
  let acc = 0
  for (let i = 0; i < FRAMES; i++) {
    HALF[i] = WEIGHTS[i] / 2 / TOTAL
    CENTERS[i] = (acc + WEIGHTS[i] / 2) / TOTAL
    acc += WEIGHTS[i]
  }
})()

const HOLD = 0.55 // |d| held fully sharp (d = signed distance in own half-spans)
const FADE = 1.6 //  |d| fully faded
const BRANCHES = COPY.arsenal.branches
const BR = BRANCHES.length
const STEP = 44 // degrees between carousel branches (vertical rolodex)
const RADIUS = 200 // cylinder radius, px
const SPAN = 0.5 // the carousel rotates across d ∈ [-SPAN, SPAN] (inside the sharp zone)

/**
 * Ambient scroll-jacked stage. No containers — the obsidian IS the environment;
 * copy "frames" are jacked IN on scroll (pinned, never physically moving) from a
 * random entry vector each, blur→sharp. The Arsenal is a vertical 3D carousel:
 * scrolling rotates a wheel of branches up/down, the front one sharp + lit, and
 * the obsidian veins light the active branch (page light moves with the scroll).
 */
export default function Content() {
  const frameRefs = useRef([])
  const carRefs = useRef([])
  const wheelRef = useRef(null)
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // Per-frame random entry/exit vectors — fixed for this mount.
  const vecs = useMemo(
    () =>
      Array.from({ length: FRAMES }, () => {
        const ang = Math.random() * Math.PI * 2
        const dist = rnd(52, 96)
        const exAng = ang + Math.PI + rnd(-0.7, 0.7)
        return {
          ex: Math.cos(ang) * dist,
          ey: Math.sin(ang) * dist * 0.85,
          rot: rnd(-10, 10),
          blur: rnd(18, 32),
          scale: rnd(0.82, 0.92),
          ox: Math.cos(exAng) * rnd(22, 44),
          oy: Math.sin(exAng) * rnd(18, 36) - 10,
          orot: rnd(-6, 6),
          oblur: rnd(10, 20),
        }
      }),
    []
  )

  const scrollToFrame = (i) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max > 0 ? CENTERS[i] * max : 0, behavior: 'smooth' })
  }
  const scrollToBranch = (j) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const d = -SPAN + (j / (BR - 1)) * 2 * SPAN
    window.scrollTo({ top: max > 0 ? (CENTERS[ARSENAL] + d * HALF[ARSENAL]) * max : 0, behavior: 'smooth' })
  }

  // Drive frame composite + the carousel from scroll progress every rAF.
  useEffect(() => {
    let raf
    let px = 0, py = 0
    let lastFront = -1, lastBranch = -1
    const root = document.documentElement
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
      if (!reduced) {
        px += (forge.pointer.x - px) * 0.06
        py += (forge.pointer.y - py) * 0.06
        root.style.setProperty('--px', px.toFixed(4))
        root.style.setProperty('--py', (-py).toFixed(4))
        // shared forge-light position (viewport %) — drives the DOM warm pool
        root.style.setProperty('--mx', (forge.pointer.x * 50 + 50).toFixed(1) + '%')
        root.style.setProperty('--my', (forge.pointer.y * -50 + 50).toFixed(1) + '%')
      }

      let arsenalOpacity = 0, frontI = -1, frontOp = 0, emitAmt = 0
      for (let i = 0; i < FRAMES; i++) {
        const el = frameRefs.current[i]
        if (!el) continue
        let d = (p - CENTERS[i]) / HALF[i]
        // pin the ends: hero stays sharp at the very top, sign-off at the very bottom
        if (i === 0) d = Math.max(d, 0)
        else if (i === FRAMES - 1) d = Math.min(d, 0)
        const ad = Math.abs(d)
        const opacity = ad <= HOLD ? 1 : Math.max(0, 1 - (ad - HOLD) / (FADE - HOLD))
        if (i === ARSENAL) arsenalOpacity = opacity
        if (opacity > frontOp) { frontOp = opacity; frontI = i }
        // a frame fading into the back (d>0) sheds embers as it dissolves
        if (d > 0 && opacity > 0.12 && opacity < 0.9) emitAmt = Math.max(emitAmt, opacity * (1 - opacity) * 4)
        const v = vecs[i]
        let tx = 0, ty = 0, rot = 0, blur = 0, sc = 1
        if (!reduced && ad > HOLD) {
          const f0 = Math.min((ad - HOLD) / (FADE - HOLD), 1)
          if (d < 0) {
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

      // Arsenal carousel — scroll rotates the vertical wheel through the branches.
      const dA = (p - CENTERS[ARSENAL]) / HALF[ARSENAL]
      const branchF = clamp((dA + SPAN) / (2 * SPAN), 0, 1) * (BR - 1)
      const active = arsenalOpacity > 0.4
      for (let j = 0; j < BR; j++) {
        const el = carRefs.current[j]
        if (!el) continue
        const off = j - branchF
        const aoff = Math.abs(off)
        const ang = reduced ? 0 : -off * STEP
        // front branch lands at z=0 (crisp, unscaled) because the wheel is pushed
        // back by RADIUS; the others rotate away and recede.
        el.style.transform = `translateY(-50%) rotateX(${ang.toFixed(2)}deg) translateZ(${RADIUS}px)`
        el.style.opacity = clamp(1.12 - aoff * 0.62, 0, 1).toFixed(3)
        const blur = reduced ? 0 : Math.min(aoff * 4.4, 11)
        el.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none'
        el.style.zIndex = String(100 - Math.round(aoff * 10))
        const front = aoff < 0.5
        el.classList.toggle('is-front', front)
        el.style.pointerEvents = front && active ? 'auto' : 'none'
      }
      if (wheelRef.current) {
        wheelRef.current.style.transform = reduced
          ? `translateZ(${-RADIUS}px)`
          : `translateZ(${-RADIUS}px) rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 4).toFixed(2)}deg)`
      }
      // page lighting follows the carousel — veins light the active branch
      const bi = active ? clamp(Math.round(branchF), 0, BR - 1) : -1
      forge.hovered = bi

      // background reacts to the foreground: a vein surge when a new headline
      // arrives, and again each time the carousel turns to a new branch.
      if (frontI !== lastFront && frontOp > 0.6) {
        forge.strikeAt = performance.now() / 1000
        lastFront = frontI
      }
      if (bi !== lastBranch) {
        if (active && bi >= 0) forge.strikeAt = performance.now() / 1000
        lastBranch = bi
      }
      // dissolve: receding copy melts into the obsidian as embers/highlights
      forge.emit.x = 0.33
      forge.emit.y = 0.46
      forge.emit.amt = emitAmt

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [vecs, reduced])

  const setRef = (i) => (el) => (frameRefs.current[i] = el)
  const setCar = (j) => (el) => (carRefs.current[j] = el)

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

        {/* 03 — the arsenal (vertical 3D carousel) */}
        <div className="frame frame--arsenal" ref={setRef(3)}>
          <div className="fbody fbody--wide">
            <span className="kicker">{COPY.arsenal.kicker}</span>
            <ForgeText as="h2" className="head flame" text={COPY.arsenal.head} />
            <div className="carousel">
              <ul className="wheel" ref={wheelRef}>
                {BRANCHES.map((b, j) => (
                  <li key={b.id} className="car-item" ref={setCar(j)} onClick={() => scrollToBranch(j)}>
                    <span className="branch-id">{b.id} · <BrandText text={b.tag} /></span>
                    <span className="branch-line"><BrandText text={b.line} /></span>
                    <span className="branch-body"><BrandText text={b.body} /></span>
                  </li>
                ))}
              </ul>
            </div>
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
      <div className="scroll-track" style={{ height: `${TOTAL * 100}vh` }} aria-hidden="true" />
    </>
  )
}
