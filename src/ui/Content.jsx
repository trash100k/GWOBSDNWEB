import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { COPY } from '../brand.js'
import { forge } from '../store.js'
import ForgeText from './ForgeText.jsx'
import BrandText from './BrandText.jsx'
import Ignite from './Ignite.jsx'
import Mandala from './Mandala.jsx'

function strike() {
  forge.strikeAt = performance.now() / 1000
}

const rnd = (a, b) => a + Math.random() * (b - a)
const clamp = (x, a, b) => Math.min(Math.max(x, a), b)
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4)
const easeIn = (x) => x * x * x
const smooth = (t) => t * t * (3 - 2 * t)
// trapezoid envelope: 0 → ramp up over [a,b] → 1 over [b,c] → ramp down over [c,d] → 0.
// used to strictly sequence the finale layers so no two ever pile up at full opacity.
const env = (x, a, b, c, d) =>
  x <= a || x >= d ? 0 : x < b ? smooth((x - a) / (b - a)) : x > c ? 1 - smooth((x - c) / (d - c)) : 1

// Weighted scroll allocation = how much SCROLL each act costs (weight × 100vh).
// Tightened ~40% (was 16.5 → ~9.9 screens) so the journey isn't draggy: short
// frames cost well under a screen; only the arsenal carousel + finale (which have
// internal phases) get real room. Order: hero · draw · clan · arsenal · rates ·
// 5 trust rungs · finale.
const TRUST = COPY.trust.rungs
const FRAMES = 5 + TRUST.length + 1 // hero,draw,clan,arsenal,rates + trust + finale
const ARSENAL = 3
const RATES = 4 // the pricing-ladder beat
const TRUST_BASE = 5 // first trust-rung frame index
const FINALE = FRAMES - 1
// finale trimmed to a single destination (problems drain → mandala forms → it
// HOLDS as the final resting image with GAELWORX + the CTA seated at its eye), so
// it needs less internal scroll than the old multi-act sequence (was 2.7).
const WEIGHTS = [0.6, 0.4, 0.65, 1.6, 0.95, ...TRUST.map(() => 0.6), 1.95]
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

const HOLD = 0.66
const FADE = 1.04
const BRANCHES = COPY.arsenal.branches
const BR = BRANCHES.length
const STEP = 46
const RADIUS = 232
const SPAN = 0.5

export default function Content() {
  const navigate = useNavigate()
  const frameRefs = useRef([])
  const carRefs = useRef([])
  const wheelRef = useRef(null)
  // finale layer refs (trimmed: problems → mandala → mark + cta seated at its eye)
  const problemsRef = useRef(null)
  const mandalaRef = useRef(null)
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
      Array.from({ length: FRAMES }, (_, i) => {
        // Trust ladder: a coherent, ESCALATING whirlwind — each rung whips in
        // from alternating sides and harder than the last (a building rush of
        // wind into the finale), not the random scatter the opening frames use.
        if (i >= TRUST_BASE && i < TRUST_BASE + TRUST.length) {
          const k = i - TRUST_BASE
          const side = k % 2 === 0 ? -1 : 1
          const mag = 1 + k * 0.16
          return {
            ex: side * 74 * mag, ey: 30,
            rot: side * (15 + k * 3),
            blur: 10, scale: 0.82,
            ox: -side * 26 * mag, oy: -34,
            orot: -side * (9 + k * 2), oblur: 9,
          }
        }
        // the rates beat rises straight up, square and deliberate (it's a ledger)
        if (i === RATES) {
          return { ex: 0, ey: 24, rot: 0, blur: 10, scale: 0.92, ox: 0, oy: -20, orot: 0, oblur: 8 }
        }
        const ang = Math.random() * Math.PI * 2
        const dist = rnd(52, 96)
        const exAng = ang + Math.PI + rnd(-0.7, 0.7)
        return {
          ex: Math.cos(ang) * dist,
          ey: Math.sin(ang) * dist * 0.85,
          rot: rnd(-10, 10),
          blur: rnd(6, 12),
          scale: rnd(0.82, 0.92),
          ox: Math.cos(exAng) * rnd(22, 44),
          oy: Math.sin(exAng) * rnd(18, 36) - 10,
          orot: rnd(-6, 6),
          oblur: rnd(6, 12),
        }
      }),
    []
  )

  const scrollToBranch = (j) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const d = -SPAN + (j / (BR - 1)) * 2 * SPAN
    const top = max > 0 ? (CENTERS[ARSENAL] + d * HALF[ARSENAL]) * max : 0
    forge.lenis ? forge.lenis.scrollTo(top, { duration: 0.9 }) : window.scrollTo({ top, behavior: 'smooth' })
  }
  const scrollToTop = () => {
    const top = 0
    forge.lenis ? forge.lenis.scrollTo(top, { duration: 0.9 }) : window.scrollTo({ top, behavior: 'smooth' })
  }

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
        px += (forge.pointer.x - px) * 0.11
        py += (forge.pointer.y - py) * 0.11
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
            const f = easeOutQuart(f0)
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

      // Arsenal carousel — scroll turns the vertical wheel through the services,
      // ANCHORING each one front-and-centre for the bulk of its segment (a clear
      // dwell where it sits crisp + face-on), then snapping quickly to the next, so
      // every service reads cleanly instead of forever mid-rotation.
      const dA = (p - CENTERS[ARSENAL]) / HALF[ARSENAL]
      const raw = clamp((dA + SPAN) / (2 * SPAN), 0, 1) * (BR - 1)
      const fl = Math.floor(raw)
      const fr = raw - fl
      // dwell while fr is near 0/1; cross the gap only across the middle band
      const snapped = fr < 0.34 ? 0 : fr > 0.66 ? 1 : smooth((fr - 0.34) / 0.32)
      const branchF = Math.min(fl + snapped, BR - 1)
      const active = arsenalOpacity > 0.4
      for (let j = 0; j < BR; j++) {
        const el = carRefs.current[j]
        if (!el) continue
        const off = j - branchF
        const aoff = Math.abs(off)
        const ang = reduced ? 0 : -off * STEP
        // front sits full-size + face-on; neighbours recede (smaller, tilted, faint)
        const sc = reduced ? 1 : Math.max(0.7, 1 - aoff * 0.16)
        el.style.transform = `translateY(-50%) rotateX(${ang.toFixed(2)}deg) translateZ(${RADIUS}px) scale(${sc.toFixed(3)})`
        el.style.opacity = clamp(1.16 - aoff * 0.92, 0, 1).toFixed(3)
        // crisp front; only a light blur on the peeks (legibility over soft-focus)
        const blur = reduced ? 0 : aoff < 0.45 ? 0 : Math.min((aoff - 0.45) * 4, 6)
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

      // ── Finale act — the journey SETTLES ONTO THE MANDALA and stops there.
      //   problems drain into the eye → the mandala (the GAELWORX forge-seal) forms
      //   and HOLDS as the final resting image → GAELWORX + the CTA seat at its eye
      //   and hold to the very end. The old solutions / four-forges / spin-to-mark
      //   tail is folded away — the mandala IS the end state. Opacities that end on
      //   the hold use c,d > 1 so the trapezoid never ramps back down.
      // start the sequence as the finale frame SETTLES in (not at its centre), so
      // the problems arrive the moment the act begins — no empty dead-zone scroll.
      const FIN_START = CENTERS[FINALE] - HALF[FINALE] * 0.8
      const fp = clamp((p - FIN_START) / (1 - FIN_START + 1e-6), 0, 1)
      const oProblems = env(fp, 0.0, 0.05, 0.20, 0.32)
      const oMandala = env(fp, 0.22, 0.40, 1.2, 1.3) // forms, then HOLDS to the end
      const oMark = env(fp, 0.50, 0.66, 1.2, 1.3) // GAELWORX seats at the eye + holds
      const oCta = env(fp, 0.62, 0.78, 1.2, 1.3) // CTA rises under it + holds

      if (problemsRef.current) {
        // drains DOWN + spirals + shrinks into the whirlpool's eye as it fades
        const out = clamp((fp - 0.13) / 0.09, 0, 1)
        const e = easeIn(out)
        problemsRef.current.style.opacity = oProblems.toFixed(3)
        problemsRef.current.style.transform =
          `translate(-50%,-50%) rotate(${(e * 190 * R).toFixed(1)}deg) translateY(${(e * 22 * R).toFixed(1)}vh) scale(${(1 - e * 0.85 * R).toFixed(3)})`
        problemsRef.current.style.filter = !reduced && out > 0.01 ? `blur(${(out * 8).toFixed(1)}px)` : 'none'
      }
      if (mandalaRef.current) {
        const inP = clamp((fp - 0.21) / 0.09, 0, 1)
        mandalaRef.current.style.opacity = oMandala.toFixed(3)
        // Bring the WHOLE mandala into frame, dead-centre, and HOLD it there — no
        // scroll-driven scale blow-up, no rotation through angles. It just settles
        // in and sits; the inner rings turn slowly on their own (CSS .m-spin).
        const sc = 0.92 + easeOut(inP) * 0.08
        mandalaRef.current.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(3)})`
      }
      if (markRef.current) {
        // GAELWORX settles into the upper eye of the held mandala and STAYS.
        const inP = clamp((fp - 0.50) / 0.10, 0, 1)
        markRef.current.style.opacity = oMark.toFixed(3)
        const sc = 0.62 + easeOut(inP) * 0.38
        markRef.current.style.transform =
          `translate(-50%,-50%) translateY(-6vh) rotate(${((1 - inP) * -40 * R).toFixed(1)}deg) scale(${sc.toFixed(3)})`
      }
      if (ctaRef.current) {
        // the sword rises just under the wordmark, in the mandala's dark eye, and HOLDS.
        const inP = clamp((fp - 0.62) / 0.10, 0, 1)
        ctaRef.current.style.opacity = oCta.toFixed(3)
        ctaRef.current.style.transform =
          `translate(-50%,-50%) translateY(9vh) translateY(${((1 - easeOut(inP)) * 24).toFixed(1)}px)`
        ctaRef.current.style.pointerEvents = oCta > 0.6 ? 'auto' : 'none'
      }
      const fmarks = [0.1, 0.32, 0.58, 0.80]
      for (const m of fmarks) { if (lastFp < m && fp >= m) forge.strikeAt = performance.now() / 1000 }
      lastFp = fp

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
            <button className="cta magnetic" onClick={() => { strike(); navigate('/contact') }}>
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
                    <span className="branch-foot">
                      <span className="branch-anchor">{b.anchor}</span>
                      <span className="branch-price">{b.price}{b.note && <em> · {b.note}</em>}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 04 — the rates beat: the whole ladder at once. Premium craft, accessible
            prices — reconciled by "the forge runs lean". Each row anchors the price
            against what it costs elsewhere (never a naked number). */}
        <div className="frame frame--rates" ref={setRef(RATES)}>
          <div className="fbody fbody--wide">
            <span className="kicker">{COPY.rates.kicker}</span>
            <ForgeText as="h2" className="head flame" text={COPY.rates.head} />
            <p className="intro rates-lede"><BrandText text={COPY.rates.lede} /></p>
            <ul className="rate-ledger">
              {BRANCHES.map((b) => (
                <li key={b.id} className="rate-row">
                  <span className="rate-tag"><BrandText text={b.tag} /></span>
                  <span className="rate-anchor">{b.anchor}</span>
                  <span className="rate-price">{b.price}{b.note && <em> · {b.note}</em>}</span>
                </li>
              ))}
            </ul>
            <span className="rate-foot">{COPY.rates.foot}</span>
          </div>
        </div>

        {/* 05–09 — the trust ladder: a 5-step escalating whirlwind. A giant
            ghosted numeral turns behind centered copy (priming the finale's
            spin); each rung whips in alternating sides, harder than the last. */}
        {TRUST.map((r, k) => (
          <div className="frame frame--trust" key={r.n} ref={setRef(TRUST_BASE + k)}>
            <span className="trust-num" aria-hidden="true">{r.n}</span>
            <div className="fbody">
              <span className="kicker">{COPY.trust.kicker}</span>
              <ForgeText as="h2" className="head flame" text={r.head} />
              <p className="body"><BrandText text={r.body} /></p>
            </div>
          </div>
        ))}

        {/* 10 — the finale act */}
        <div className="frame frame--finale" ref={setRef(FINALE)}>
          <div className="finale">
            <div className="fin-layer fin-problems" ref={problemsRef}>
              {COPY.finale.problems.map((t, i) => (
                <span key={i} className="fin-line" style={{ '--i': i }}>{t}</span>
              ))}
            </div>

            {/* the mandala IS the destination — the GAELWORX forge-seal. It forms as
                the problems drain into it, then HOLDS as the final resting image while
                the wordmark + CTA seat at its eye. (solutions / four-forges tail folded
                away — see the rAF finale block.) */}
            <div className="fin-layer fin-mandala" ref={mandalaRef} aria-hidden="true">
              <Mandala />
            </div>

            <div className="fin-mark fin-mark--seal" ref={markRef}>
              <button className="mark-btn mark-btn--seal magnetic" onClick={scrollToTop}><Ignite text={COPY.finale.mark} /></button>
            </div>

            <div className="fin-cta fin-cta--seal" ref={ctaRef}>
              <button className="cta cta--solid magnetic" onClick={() => { strike(); navigate('/contact') }}><span>{COPY.finale.cta}</span></button>
              <span className="avail">{COPY.finale.avail}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-track" style={{ height: `${TOTAL * 100}vh` }} aria-hidden="true" />
    </>
  )
}
