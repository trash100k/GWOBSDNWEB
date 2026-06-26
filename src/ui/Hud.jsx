import { useEffect, useState } from 'react'
import { forge, ACTS, actIndexFor } from '../store.js'
import { NAV } from '../brand.js'

function scrollToProgress(p) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: p * max, behavior: 'smooth' })
}

/** Fixed chrome: top nav (00–07) + a right-rail act index that tracks the journey. */
export default function Hud() {
  const [act, setAct] = useState(0)

  useEffect(() => {
    let raf
    const tick = () => {
      const i = actIndexFor(forge.scrollDamped)
      setAct((prev) => (prev === i ? prev : i))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <nav className="hud-nav">
        <button className="hud-mark magnetic" onClick={() => scrollToProgress(0)}>
          GAELWORX
        </button>
        <ul>
          {NAV.map(([n, label]) => (
            <li key={n}>
              <span className="hud-num">{n}</span>
              {label}
            </li>
          ))}
        </ul>
        <button className="hud-cta magnetic" onClick={() => scrollToProgress(0.95)}>
          Point the Sword
        </button>
      </nav>

      <aside className="hud-rail" aria-hidden="true">
        {ACTS.map((a, i) => (
          <button
            key={a.id}
            className={`hud-step ${i === act ? 'on' : ''}`}
            onClick={() => scrollToProgress(a.at)}
          >
            <i />
            <span>{String(i).padStart(2, '0')} · {a.label}</span>
          </button>
        ))}
      </aside>
    </>
  )
}
