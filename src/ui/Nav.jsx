import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { forge } from '../store.js'
import { ROUTES } from '../routes.js'
import { COPY } from '../brand.js'
import Ignite from './Ignite.jsx'

/** Pure-cinematic chrome: mark + menu toggle + a thin progress spine with an ember
 *  tick. The overlay menu navigates the real routes (multi-page). */
export default function Nav() {
  const [open, setOpen] = useState(false)
  const tickRef = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

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

  // Lock scroll behind the open menu (stop Lenis too so it doesn't fight the lock).
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (forge.lenis) open ? forge.lenis.stop() : forge.lenis.start()
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (path) => {
    setOpen(false)
    if (path === pathname) {
      // already here — just return to the top
      if (forge.lenis) forge.lenis.scrollTo(0)
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate(path)
    }
  }

  return (
    <>
      <button className="nav-mark magnetic" onClick={() => go('/')}>
        <Ignite text="GAELWORX" />
      </button>

      <button
        className={`nav-toggle magnetic ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <i /><i /><i />
      </button>

      {/* progress spine */}
      <div className="nav-spine" aria-hidden="true">
        <span ref={tickRef} className="nav-spine__fill" />
      </div>

      {/* full-screen overlay menu — the real routes */}
      <div className={`menu ${open ? 'open' : ''}`}>
        <nav className="menu-list">
          {ROUTES.map((r, i) => (
            <button
              key={r.path}
              className={`menu-item magnetic ${r.path === pathname ? 'is-current' : ''}`}
              style={{ '--mi': i }}
              onClick={() => go(r.path)}
              aria-current={r.path === pathname ? 'page' : undefined}
            >
              <span className="menu-num">{String(i).padStart(2, '0')}</span>
              <span className="menu-label">{r.label}</span>
            </button>
          ))}
        </nav>
        <div className="menu-foot">{COPY.footer.tag}</div>
      </div>
    </>
  )
}
