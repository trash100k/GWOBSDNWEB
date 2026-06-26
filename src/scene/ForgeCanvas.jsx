import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import CameraRig from './CameraRig.jsx'
import ObsidianSlab from './ObsidianSlab.jsx'
import Embers from './Embers.jsx'
import HeroBlade from './HeroBlade.jsx'
import Arsenal from './Arsenal.jsx'
import Effects from './Effects.jsx'

export default function ForgeCanvas({ quality }) {
  const dpr = quality === 'high' ? [1, 2] : quality === 'low' ? [1, 1.5] : 1
  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0.4, 6.4], fov: 34, near: 0.1, far: 60 }}
      frameloop={quality === 'static' ? 'demand' : 'always'}
    >
      <color attach="background" args={['#050608']} />
      <fog attach="fog" args={['#050608', 10, 26]} />

      <CameraRig />

      <ambientLight intensity={0.06} color="#241a12" />
      <directionalLight position={[5, 6, 4]} intensity={1.0} color="#ffb27a" />
      <pointLight position={[0, 0.5, 2.4]} intensity={3.2} distance={12} color="#ff5a1e" />

      <Suspense fallback={null}>
        <Environment resolution={quality === 'high' ? 256 : 128} frames={1}>
          <Lightformer form="rect" intensity={3.0} color="#ff7a2a" position={[0, 3, -5]} scale={[12, 1.4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#ff4d12" position={[-5, -1, -3]} scale={[3, 5, 1]} rotation={[0, 0.5, 0]} />
          <Lightformer form="ring" intensity={2.2} color="#ffd2a0" position={[4, 1.5, -3.5]} scale={2.2} />
          <Lightformer form="rect" intensity={0.22} color="#140d05" position={[0, 0, 6]} scale={[12, 12, 1]} />
        </Environment>

        <ObsidianSlab />
        <HeroBlade />
        <Arsenal />
        <Embers count={quality === 'high' ? 340 : 140} />
      </Suspense>

      {quality !== 'static' && <Effects quality={quality} />}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
