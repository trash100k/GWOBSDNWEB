import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import CameraRig from './CameraRig.jsx'
import MirrorPlane from './MirrorPlane.jsx'
import Aurora from './Aurora.jsx'
import Cosmos from './Cosmos.jsx'
import Monoliths from './Monoliths.jsx'
import Embers from './Embers.jsx'
import Effects from './Effects.jsx'

export default function ForgeCanvas({ quality }) {
  const dpr = quality === 'high' ? [1, 2] : quality === 'low' ? [1, 1.4] : 1
  const sunRef = useRef()
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0.85, 8.5], fov: 38, near: 0.1, far: 120 }}
      frameloop={quality === 'static' ? 'demand' : 'always'}
    >
      <color attach="background" args={['#040507']} />
      <fog attach="fog" args={['#040507', 14, 64]} />

      <CameraRig />

      <ambientLight intensity={0.05} color="#241a12" />
      <directionalLight position={[0, 5, -8]} intensity={0.9} color="#ffb27a" />
      <pointLight position={[0, 1, -6]} intensity={3.0} distance={20} color="#ff5a1e" />

      <Suspense fallback={null}>
        <Environment resolution={quality === 'high' ? 256 : 128} frames={1}>
          <Lightformer form="rect" intensity={2.4} color="#ff7a2a" position={[0, 4, -10]} scale={[16, 2, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ff4d12" position={[-6, 1, -4]} scale={[3, 4, 1]} rotation={[0, 0.5, 0]} />
          <Lightformer form="ring" intensity={1.8} color="#ffd2a0" position={[5, 2, -5]} scale={2.4} />
        </Environment>

        <Cosmos quality={quality} />
        <Aurora ref={sunRef} />
        <MirrorPlane quality={quality} />
        <Monoliths quality={quality} />
        <Embers count={quality === 'high' ? 700 : 240} />
      </Suspense>

      {quality !== 'static' && ready && <Effects quality={quality} sun={sunRef.current} />}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
