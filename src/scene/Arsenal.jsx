import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Blade from './Blade.jsx'
import { forge, range } from '../store.js'

const { clamp, damp } = THREE.MathUtils
const XS = [-2.5, -0.85, 0.85, 2.5]
const RZ = [-0.2, -0.07, 0.07, 0.2]

function ArsenalBlade({ i }) {
  return (
    <group
      position={[XS[i], -0.2, 0.3]}
      rotation={[0, 0, RZ[i]]}
      onPointerOver={(e) => {
        e.stopPropagation()
        forge.hovered = i
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        if (forge.hovered === i) forge.hovered = -1
        document.body.style.cursor = ''
      }}
    >
      <Blade
        scale={0.78}
        update={(u, state, dt, g) => {
          const on = forge.hovered === i
          u.uGlow.value = damp(u.uGlow.value, on ? 1 : 0, 6, dt)
          u.uCool.value = 0.82
          g.position.y = damp(g.position.y, on ? 0.22 : 0, 6, dt)
          const z = on ? 0.45 : 0
          g.position.z = damp(g.position.z, z, 6, dt)
        }}
      />
    </group>
  )
}

/** Four blades on an arc — the brand's four branches, explorable on hover. */
export default function Arsenal() {
  const groupRef = useRef()
  useFrame(() => {
    const a = clamp(range(forge.scrollDamped, 0.6, 0.7) - range(forge.scrollDamped, 0.86, 0.92), 0, 1)
    const g = groupRef.current
    g.scale.setScalar(Math.max(a, 0.0001))
    g.visible = a > 0.01
  })
  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <ArsenalBlade key={i} i={i} />
      ))}
    </group>
  )
}
