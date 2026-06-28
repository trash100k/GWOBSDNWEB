import { useEffect, useRef, useState } from 'react'
import { forge, ACTS } from '../store.js'
import { NAV, COPY } from '../brand.js'
import Ignite from './Ignite.jsx'

function scrollToProgress(p) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: p * max, behavior: 'smooth' })
}

/** Pure-cinematic chrome: mark + menu toggle + a thin progress spine with an ember tick. */
export default function Nav() {
  const [open, setOpen] = useState(false)
  const tickRef = useRef(null)

  // Drive the progress spine straight from the damped scroll (no re-renders).
  useEffect(() => {
    let raf
    const tick = () => {
      if (tickRef.current) tickRef.current.style.transform = `scaleY(${forge.scrollDamped})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => (document.body.style.overflow = '')
  }, [open])

  return (
    <>
      <button className="nav-mark magnetic" onClick={() => scrollToProgress(0)}>
        <Ignite text="GAELWORX" />
      </button>

      <button className={`nav-toggle magnetic ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Menu">
        <i /><i /><i />
      </button>

      {/* progress spine */}
      <div className="nav-spine" aria-hidden="true">
        <span ref={tickRef} className="nav-spine__fill" />
      </div>

      {/* full-screen overlay menu */}
      <div className={`menu ${open ? 'open' : ''}`}>
        <nav className="menu-list">
          {NAV.map(([n, label], i) => (
            <button
              key={n}
              className="menu-item magnetic"
              style={{ '--mi': i }}
              onClick={() => {
                setOpen(false)
                scrollToProgress(ACTS[Math.min(i, ACTS.length - 1)].at)
              }}
            >
              <span className="menu-num">{n}</span>
              <span className="menu-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="menu-foot">{COPY.footer.tag}</div>
      </div>
    </>
  )
}
