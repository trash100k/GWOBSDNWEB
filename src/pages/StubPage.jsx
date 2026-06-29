import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routeByPath } from '../routes.js'
import BrandText from '../ui/BrandText.jsx'

/**
 * Phase-0 placeholder for routes whose full page + 3D wonderland land in Phase 1.
 * On-brand: dark, sharp corners, Cinzel flame head, real (prerenderable) copy so
 * the route already ships indexable content + a working link while it's built.
 * Each instance is replaced one-by-one by a real page component in Phase 1.
 */
export default function StubPage() {
  const { pathname } = useLocation()
  const route = routeByPath(pathname) || { label: 'Not Found', desc: 'This path is not forged.' }

  // route changes start at the top of the document
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <main className="page page--stub">
      <div className="page-inner">
        <span className="kicker">GAELWORX · One Forge</span>
        <h1 className="headline etched flame">{route.label}</h1>
        <p className="body"><BrandText text={route.desc} /></p>
        <p className="page-note">This branch of the forge is being lit. The full page lands next.</p>
        <Link className="cta" to="/"><span>Back to the Forge</span></Link>
      </div>
    </main>
  )
}
