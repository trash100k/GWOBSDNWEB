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
      <color attach="background" args={['#040406']} />

      <CameraRig />

      <ambientLight intensity={0.05} color="#10131a" />
      {/* one NEUTRAL-COOL key for a sharp specular streak across the glass (no orange) */}
      <directionalLight position={[3, 4, 5]} intensity={1.3} color="#eaf0fb" />

      {/* Procedural NEUTRAL-COOL environment for the obsidian's reflections — purely
          built from lightformers (no file load), so it can't suspend/throw like an
          EXR. The old warm rects reflected as an orange BAND across the glass; these
          are clean cool-white, so the slab reads as dark glass, not orange-washed. */}
      <Suspense fallback={null}>
        <Environment resolution={quality === 'high' ? 256 : 128}>
          <Lightformer form="rect" intensity={2.2} color="#e8eef8" position={[0, 3, 4]} scale={[14, 2.4, 1]} />
          <Lightformer form="rect" intensity={1.3} color="#aebccf" position={[-6, 0, 3]} scale={[3, 5, 1]} rotation={[0, 0.4, 0]} />
          <Lightformer form="ring" intensity={1.8} color="#eef2f8" position={[5, 1.6, 3]} scale={2.4} />
          <Lightformer form="rect" intensity={0.5} color="#0a0d12" position={[0, -3, 4]} scale={[14, 4, 1]} />
        </Environment>
      </Suspense>

      {/* The obsidian slab is NOT gated by the environment — always renders. */}
      <ObsidianSlab quality={quality} />

      {quality !== 'static' && <Effects quality={quality} />}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
