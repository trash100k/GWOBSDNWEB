import { useEffect, useState } from 'react'
import { forge } from '../store.js'
import { COPY } from '../brand.js'

/** ACT 00 — Ignition. Gates the journey until fonts are ready, then lifts. */
export default function Loader() {
  const [phase, setPhase] = useState('in') // in → out → gone

  useEffect(() => {
    let outT, goneT
    const fonts = (document.fonts && document.fonts.ready) || Promise.resolve()
    const minTime = new Promise((r) => setTimeout(r, 1700))
    Promise.all([fonts, minTime]).then(() => {
      setPhase('out')
      forge.ready = true
      goneT = setTimeout(() => setPhase('gone'), 1200)
    })
    return () => {
      clearTimeout(outT)
      clearTimeout(goneT)
    }
  }, [])

  if (phase === 'gone') return null
  return (
    <div className={`loader ${phase === 'out' ? 'out' : ''}`}>
      <div className="loader-mark">GAELWORX</div>
      <div className="loader-sub">{COPY.loader}</div>
      <div className="loader-bar"><i /></div>
    </div>
  )
}
