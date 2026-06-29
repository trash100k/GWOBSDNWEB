import { Component, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import Lenis from 'lenis'
import * as THREE from 'three'
import { forge } from './store.js'
import { routeByPath } from './routes.js'
import { useQuality } from './hooks.js'
import ForgeCanvas from './scene/ForgeCanvas.jsx'
import Loader from './ui/Loader.jsx'
import Nav from './ui/Nav.jsx'
import Cursor from './ui/Cursor.jsx'
import Atmosphere from './ui/Atmosphere.jsx'
import { STYLES } from './styles.js'

/* WebGL error boundary → static forge fallback. */
class CanvasBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return <div className="canvas-fixed canvas-fallback" />
    return this.props.children
  }
}

export default function ForgeExperience() {
  const quality = useQuality()
  const { pathname } = useLocation()

  useEffect(() => {
    forge.quality = quality
  }, [quality])

  // route → shared store: the obsidian forge re-tempers + re-frames per page.
  // also sync the document head on client-side nav (crawlers get the prerendered
  // per-route head; this keeps the tab title/description correct after nav).
  useEffect(() => {
    forge.route = pathname
    // reset to the top of the new route (immediate, through Lenis if active)
    if (forge.lenis) forge.lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
    const r = routeByPath(pathname)
    if (r) {
      document.title = r.title
      let m = document.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', 'description')
        document.head.appendChild(m)
      }
      m.setAttribute('content', r.desc)
    }
  }, [pathname])

  // Lenis momentum scroll — buttery pacing at 60fps (scroll-jank is a top INP
  // killer). Default window mode, so window.scrollY reflects the SMOOTHED scroll
  // position — the scene/jack reads below get smoothness for free, no rewrite.
  // Disabled under prefers-reduced-motion (native scroll). Stored on the store so
  // route changes can reset it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    forge.lenis = lenis
    let raf
    const loop = (t) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      forge.lenis = null
    }
  }, [])

  // Scroll + pointer → shared store (read by the scene each frame).
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      forge.scroll = THREE.MathUtils.clamp(max > 0 ? window.scrollY / max : 0, 0, 1)
    }
    const onPointer = (e) => {
      forge.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      removeEventListener('pointermove', onPointer)
    }
  }, [])

  const debug =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

  return (
    <div className="forge-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {/* live tuning panel — hidden unless the URL has ?debug */}
      <Leva hidden={!debug} collapsed titleBar={{ title: 'GAELWORX' }} />
      <Loader />
      <div className="canvas-fixed">
        <CanvasBoundary>
          <ForgeCanvas quality={quality} />
        </CanvasBoundary>
      </div>
      {/* the active route renders here; the canvas + atmosphere + nav persist
          across routes (app shell). Each route brings its own content + scene. */}
      <Outlet />
      <Atmosphere />
      <Nav />
      <Cursor />
    </div>
  )
}
