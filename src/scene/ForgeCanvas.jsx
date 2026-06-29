import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, AdaptiveDpr, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import CameraRig from './CameraRig.jsx'
import ObsidianSlab from './ObsidianSlab.jsx'
import Effects from './Effects.jsx'

export default function ForgeCanvas({ quality }) {
  const dpr = quality === 'high' ? [1, 2] : quality === 'low' ? [1, 1.4] : 1
  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 6.4], fov: 40, near: 0.1, far: 50 }}
      frameloop={quality === 'static' ? 'demand' : 'always'}
    >
      {/* Very dark, a hair toward green so true-blacks read on OLED. */}
      <color attach="background" args={['#03070a']} />

      <CameraRig />

      {/* Low, cool-neutral ambient — no warm cast anywhere. */}
      <ambientLight intensity={0.06} color="#0f1814" />
      {/* Clean, very-slightly-cool white key for sharp facet light + extinction zones. */}
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#f2f6ff" />
      {/* Gold rim from the opposite side for a warm accent glint on facet edges (NOT a broad fill). */}
      <directionalLight position={[-4, 2.5, 2]} intensity={0.55} color="#ffd66b" />

      {/* Procedural emerald environment for the gem's reflections — purely built
          from lightformers (no file load), so it can't suspend/throw like an EXR.
          Isolated in its own Suspense; the slab renders independently below.
          Cool/neutral keys create the emerald "hall of mirrors"; no broad warm
          rectangle high up, so nothing bands the top edge orange. */}
      <Suspense fallback={null}>
        <Environment resolution={quality === 'high' ? 256 : 128}>
          {/* COOL-WHITE KEY — front-on and lower so the bright reflection lands on the
              gem face, not across the tilted-back top edge. Small/narrow, not a horizon bar. */}
          <Lightformer form="rect" intensity={3.4} color="#eaf2ff" position={[1.5, 0.5, 5]} scale={[5, 3, 1]} />
          {/* GREEN FILL — soft saturated emerald wash from the left for body color. */}
          <Lightformer form="rect" intensity={1.4} color="#1f9d57" position={[-6, 0, 3]} scale={[3, 5, 1]} rotation={[0, 0.4, 0]} />
          {/* GOLD RIM/ACCENT — small ring high-right for crisp warm glints (point source, not a band). */}
          <Lightformer form="ring" intensity={2.0} color="#ffd27a" position={[5, 2.4, 3]} scale={1.4} />
          {/* COOL specular streak up top — narrow + cool so the top edge reads bright-white, never orange. */}
          <Lightformer form="rect" intensity={1.2} color="#cfe0ff" position={[0, 3.2, 4]} scale={[5, 0.8, 1]} />
          {/* DARK floor for extinction/contrast (cool-dark green-black, not warm). */}
          <Lightformer form="rect" intensity={0.4} color="#04140d" position={[0, -3, 4]} scale={[14, 4, 1]} />
        </Environment>
      </Suspense>

      {/* Slab always renders; it is NOT gated by the environment. */}
      <ObsidianSlab quality={quality} />

      {quality !== 'static' && <Effects quality={quality} />}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
