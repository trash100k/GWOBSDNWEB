import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, AdaptiveDpr, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import sunsetHdri from '@pmndrs/assets/hdri/sunset.exr'
import CameraRig from './CameraRig.jsx'
import ObsidianSlab from './ObsidianSlab.jsx'
import Embers from './Embers.jsx'
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
      <color attach="background" args={['#040406']} />

      <CameraRig />

      <ambientLight intensity={0.04} color="#1a1410" />
      {/* one warm key for a sharp specular streak across the glass */}
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#ffcaa0" />

      <Suspense fallback={null}>
        {/* real HDRI for the obsidian's reflections (bundled, no runtime fetch).
            Background stays black — only the glass picks it up. */}
        {quality === 'high' ? (
          <Environment files={sunsetHdri} environmentIntensity={0.7} />
        ) : (
          <Environment resolution={128} environmentIntensity={0.6}>
            <Lightformer form="rect" intensity={2.4} color="#ff7a2a" position={[0, 3, 4]} scale={[12, 2, 1]} />
            <Lightformer form="ring" intensity={1.6} color="#ffd2a0" position={[4, 1, 3]} scale={2.2} />
          </Environment>
        )}

        <ObsidianSlab quality={quality} />
        <Embers count={quality === 'high' ? 220 : 90} />
      </Suspense>

      {quality !== 'static' && <Effects quality={quality} />}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
