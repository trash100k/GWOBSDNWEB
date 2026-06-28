import { Component, useEffect } from 'react'
import { Leva } from 'leva'
import * as THREE from 'three'
import { forge } from './store.js'
import { useQuality } from './hooks.js'
import ForgeCanvas from './scene/ForgeCanvas.jsx'
import Loader from './ui/Loader.jsx'
import Nav from './ui/Nav.jsx'
import Cursor from './ui/Cursor.jsx'
import Content from './ui/Content.jsx'
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

  useEffect(() => {
    forge.quality = quality
  }, [quality])

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
      <Content />
      <Atmosphere />
      <Nav />
      <Cursor />
    </div>
  )
}
