import { useEffect, useMemo, useRef } from 'react'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import BrandText from './BrandText.jsx'
import Ignite from './Ignite.jsx'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

const rnd = (a, b) => a + Math.random() * (b - a)
const clamp = (x, a, b) => Math.min(Math.max(x, a), b)
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeIn = (x) => x * x * x

// Ten frames, weighted scroll allocation. Arsenal carousel + the Finale act both
// get long pins. Order: hero · draw · clan · arsenal · 5 trust rungs · finale.
const TRUST = COPY.trust.rungs
const FRAMES = 4 + TRUST.length + 1 // hero,draw,clan,arsenal + trust + finale
const ARSENAL = 3
const FINALE = FRAMES - 1
const WEIGHTS = [1, 0.8, 1, 2.6, ...TRUST.map(() => 1), 4.4]
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

const HOLD = 0.55
const FADE = 1.6
const BRANCHES = COPY.arsenal.branches
const BR = BRANCHES.length
const STEP = 44
const RADIUS = 200
const SPAN = 0.5

// Cinzel mandala ring — a radial whirl of forge words the problems drain into.
const MANDALA = ['FORGE', 'EXECUTE', 'BUILD', 'RUN', 'FORGE', 'EXECUTE', 'BUILD', 'RUN', 'FORGE', 'EXECUTE', 'BUILD', 'RUN']
const FORGES = COPY.finale.forges

export default function Content() {
  const frameRefs = useRef([])
  const carRefs = useRef([])
  const wheelRef = useRef(null)
  // finale layer refs
  const problemsRef = useRef(null)
  const mandalaRef = useRef(null)
  const seedRef = useRef(null)
  const solutionsRef = useRef(null)
  const forgesRef = useRef(null)
  const markRef = useRef(null)
  const ctaRef = useRef(null)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

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

  const scrollToBranch = (j) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const d = -SPAN + (j / (BR - 1)) * 2 * SPAN
    window.scrollTo({ top: max > 0 ? (CENTERS[ARSENAL] + d * HALF[ARSENAL]) * max : 0, behavior: 'smooth' })
  }
  const scrollToEnd = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max, behavior: 'smooth' })
  }
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  useEffect(() => {
    let raf
    let px = 0, py = 0
    let lastFront = -1, lastBranch = -1, lastFp = 0
    const root = document.documentElement
    const lerp = (a, b, t) => a + (b - a) * t
    const R = reduced ? 0 : 1

    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
      if (!reduced) {
        px += (forge.pointer.x - px) * 0.06
        py += (forge.pointer.y - py) * 0.06
        root.style.setProperty('--px', px.toFixed(4))
        root.style.setProperty('--py', (-py).toFixed(4))
        root.style.setProperty('--mx', (forge.pointer.x * 50 + 50).toFixed(1) + '%')
        root.style.setProperty('--my', (forge.pointer.y * -50 + 50).toFixed(1) + '%')
      }

      let arsenalOpacity = 0, frontI = -1, frontOp = 0, emitAmt = 0
      for (let i = 0; i < FRAMES; i++) {
        const el = frameRefs.current[i]
        if (!el) continue
        let d = (p - CENTERS[i]) / HALF[i]
        if (i === 0) d = Math.max(d, 0)
        else if (i === FRAMES - 1) d = Math.min(d, 0)
        const ad = Math.abs(d)
        const opacity = ad <= HOLD ? 1 : Math.max(0, 1 - (ad - HOLD) / (FADE - HOLD))
        if (i === ARSENAL) arsenalOpacity = opacity
        if (opacity > frontOp) { frontOp = opacity; frontI = i }
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
      const bi = active ? clamp(Math.round(branchF), 0, BR - 1) : -1
      forge.hovered = bi

      if (frontI !== lastFront && frontOp > 0.6) {
        forge.strikeAt = performance.now() / 1000
        lastFront = frontI
      }
      if (bi !== lastBranch) {
        if (active && bi >= 0) forge.strikeAt = performance.now() / 1000
        lastBranch = bi
      }
      forge.emit.x = 0.33
      forge.emit.y = 0.46
      forge.emit.amt = emitAmt

      // ── Finale act: problems → mandala whirlpool → solutions → forges → GAELWORX → CTA
      const fp = clamp((p - CENTERS[FINALE]) / (1 - CENTERS[FINALE] + 1e-6), 0, 1)
      const reveal = clamp(fp / 0.12, 0, 1)
      const drain = clamp((fp - 0.18) / 0.18, 0, 1)
      const vortex = clamp((fp - 0.36) / 0.12, 0, 1)
      const rise = clamp((fp - 0.48) / 0.18, 0, 1)
      const forgeIn = clamp((fp - 0.66) / 0.16, 0, 1)
      const converge = clamp((fp - 0.82) / 0.12, 0, 1)
      const ctaIn = clamp((fp - 0.94) / 0.06, 0, 1)
      const spin = fp * 680

      if (problemsRef.current) {
        const e = easeIn(drain)
        problemsRef.current.style.opacity = (reveal * (1 - drain)).toFixed(3)
        problemsRef.current.style.transform =
          `translate(-50%,-50%) rotate(${(e * 200 * R).toFixed(1)}deg) translateY(${(e * 24 * R).toFixed(1)}vh) scale(${(1 - e * 0.82 * R).toFixed(3)})`
        problemsRef.current.style.filter = !reduced && drain > 0.01 ? `blur(${(drain * 14).toFixed(1)}px)` : 'none'
      }
      if (mandalaRef.current) {
        const appear = clamp((fp - 0.16) / 0.12, 0, 1)
        const gone = clamp((fp - 0.50) / 0.16, 0, 1)
        mandalaRef.current.style.opacity = (appear * (1 - gone) * 0.85).toFixed(3)
        const sc = (0.35 + appear * 0.65) * (1 + gone * 0.7)
        mandalaRef.current.style.transform = `translate(-50%,-50%) rotate(${(spin * R).toFixed(1)}deg) scale(${sc.toFixed(3)})`
      }
      if (seedRef.current) {
        seedRef.current.style.opacity = (vortex * (1 - clamp((fp - 0.46) / 0.05, 0, 1))).toFixed(3)
      }
      if (solutionsRef.current) {
        const e = 1 - easeOut(rise)
        solutionsRef.current.style.opacity = (rise * (1 - forgeIn)).toFixed(3)
        solutionsRef.current.style.transform =
          `translate(-50%,-50%) rotate(${(-e * 200 * R).toFixed(1)}deg) translateY(${(e * 24 * R).toFixed(1)}vh) scale(${(1 - e * 0.82 * R).toFixed(3)})`
        solutionsRef.current.style.filter = !reduced && e > 0.01 ? `blur(${(e * 14).toFixed(1)}px)` : 'none'
      }
      if (forgesRef.current) {
        const o = forgeIn * (1 - clamp((fp - 0.86) / 0.08, 0, 1))
        forgesRef.current.style.opacity = o.toFixed(3)
        const sc = (0.4 + easeOut(forgeIn) * 0.6) * (1 - converge * 0.92)
        forgesRef.current.style.transform =
          `translate(-50%,-50%) rotate(${((spin * 0.4 + forgeIn * 120) * R).toFixed(1)}deg) scale(${Math.max(0.05, sc).toFixed(3)})`
      }
      if (markRef.current) {
        markRef.current.style.opacity = converge.toFixed(3)
        const sc = 0.3 + easeOut(converge) * 0.7
        // sits above center once the CTA arrives, so the wordmark + sword stack
        const lift = ctaIn * 7
        markRef.current.style.transform =
          `translate(-50%,-50%) translateY(${(-lift).toFixed(1)}vh) rotate(${((1 - converge) * -80 * R).toFixed(1)}deg) scale(${sc.toFixed(3)})`
      }
      if (ctaRef.current) {
        ctaRef.current.style.opacity = ctaIn.toFixed(3)
        ctaRef.current.style.transform =
          `translate(-50%,-50%) translateY(11vh) translateY(${((1 - ctaIn) * 22).toFixed(1)}px)`
        ctaRef.current.style.pointerEvents = ctaIn > 0.6 ? 'auto' : 'none'
      }
      const fmarks = [0.18, 0.40, 0.66, 0.82, 0.95]
      for (const m of fmarks) { if (lastFp < m && fp >= m) forge.strikeAt = performance.now() / 1000 }
      lastFp = fp
      if (drain > 0.04 && drain < 0.99) {
        forge.emit.x = 0.5; forge.emit.y = 0.5
        forge.emit.amt = Math.max(forge.emit.amt, drain * (1 - drain) * 3.2)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [vecs, reduced])

  const setRef = (i) => (el) => (frameRefs.current[i] = el)
  const setCar = (j) => (el) => (carRefs.current[j] = el)
  const TRUST_BASE = 4 // first trust frame index

  return (
    <>
      <div className="stage" aria-label="GAELWORX">
        {/* 00 — hero */}
        <div className="frame frame--hero" ref={setRef(0)}>
          <div className="fbody">
            <span className="eyebrow">{COPY.hero.eyebrow}</span>
            <ForgeText as="h1" className="headline etched flame" text={COPY.hero.headline} delay={1200} ignite />
            <p className="hero-sub">{COPY.hero.sub}</p>
            <button className="cta magnetic" onClick={() => { strike(); scrollToEnd() }}>
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

        {/* 04–08 — the trust ladder (5 rungs) */}
        {TRUST.map((r, k) => (
          <div className="frame frame--trust" key={r.n} ref={setRef(TRUST_BASE + k)}>
            <div className="fbody">
              <span className="kicker">{COPY.trust.kicker} · {r.n}</span>
              <ForgeText as="h2" className="head flame" text={r.head} />
              <p className="body"><BrandText text={r.body} /></p>
            </div>
          </div>
        ))}

        {/* 09 — the finale act */}
        <div className="frame frame--finale" ref={setRef(FINALE)}>
          <div className="finale">
            <div className="fin-layer fin-problems" ref={problemsRef}>
              {COPY.finale.problems.map((t, i) => (
                <span key={i} className="fin-line" style={{ '--i': i }}>{t}</span>
              ))}
            </div>

            <div className="fin-layer fin-mandala" ref={mandalaRef} aria-hidden="true">
              {MANDALA.map((t, i) => (
                <span key={i} className="mandala-word" style={{ '--i': i, '--n': MANDALA.length }}>{t}</span>
              ))}
            </div>
            <div className="fin-seed" ref={seedRef} aria-hidden="true">{COPY.finale.seed}</div>

            <div className="fin-layer fin-solutions" ref={solutionsRef}>
              {COPY.finale.solutions.map((t, i) => (
                <span key={i} className="fin-line fin-line--sol" style={{ '--i': i }}>{t}</span>
              ))}
            </div>

            <div className="fin-layer fin-forges" ref={forgesRef} aria-hidden="true">
              {FORGES.map((t, i) => (
                <span key={i} className="forge-word" style={{ '--i': i, '--n': FORGES.length }}><Ignite text={t} /></span>
              ))}
            </div>

            <div className="fin-mark" ref={markRef}>
              <button className="mark-btn magnetic" onClick={scrollToTop}><Ignite text={COPY.finale.mark} /></button>
            </div>

            <div className="fin-cta" ref={ctaRef}>
              <span className="fin-closer">{COPY.finale.closer}</span>
              <button className="cta cta--solid magnetic" onClick={strike}><span>{COPY.finale.cta}</span></button>
              <span className="avail">{COPY.finale.avail}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-track" style={{ height: `${TOTAL * 100}vh` }} aria-hidden="true" />
    </>
  )
}
