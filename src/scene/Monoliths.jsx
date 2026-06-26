import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { forge, range } from '../store.js'
import { GLSL_NOISE } from './shaders.js'

const { clamp, damp, smoothstep, lerp } = THREE.MathUtils
const XS = [-4.2, -1.4, 1.4, 4.2]

const HEAD = /* glsl */ `
  uniform float uTime; uniform float uGlow;
  uniform vec3 uEmber; uniform vec3 uCaustic;
  ${GLSL_NOISE}
`
const COLOR = /* glsl */ `
  float ndv = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
  float interior = 1.0 - pow(1.0 - ndv, 3.0);
  float t = uTime * 0.3;
  float c = gw_caustic(vUv * 2.2, t);
  c *= smoothstep(0.1, 0.8, gw_fbm(vUv * 0.7 + vec2(t*0.1, 0.0)));
  float edge = pow(1.0 - ndv, 2.5);
  vec3 warm = uCaustic * c * interior * (0.25 + uGlow * 1.6)
            + uEmber * edge * uGlow * 1.4;
  gl_FragColor.rgb += warm;
`

function makeMaterial() {
  const u = {
    uTime: { value: 0 },
    uGlow: { value: 0 },
    uEmber: { value: new THREE.Color(1.0, 0.32, 0.06) },
    uCaustic: { value: new THREE.Color(1.6, 0.55, 0.16) },
  }
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#05060b'),
    metalness: 0,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.0,
    ior: 1.7,
  })
  m.defines = { USE_UV: '' }
  m.userData.u = u
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
  }
  return m
}

function Monolith({ i }) {
  const groupRef = useRef()
  const material = useMemo(() => makeMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    const u = material.userData.u
    u.uTime.value = state.clock.elapsedTime
    const on = forge.hovered === i
    u.uGlow.value = damp(u.uGlow.value, on ? 1 : 0, 6, dt)

    const p = forge.scrollDamped
    const rise = clamp(range(p, 0.58, 0.74) - range(p, 0.86, 0.94), 0, 1)
    const g = groupRef.current
    const baseY = lerp(-3.6, 0, smoothstep(0, 1, rise))
    g.position.y = baseY + (on ? 0.12 : 0)
    g.visible = rise > 0.02
    g.scale.setScalar(0.96 + (on ? 0.06 : 0))
  })

  const select = (e) => {
    e.stopPropagation()
    forge.hovered = i
  }

  return (
    <group
      ref={groupRef}
      position={[XS[i], -3.6, -3]}
      onPointerOver={(e) => {
        e.stopPropagation()
        forge.hovered = i
      }}
      onPointerOut={() => forge.hovered === i && (forge.hovered = -1)}
      onClick={select}
    >
      <RoundedBox args={[0.85, 3.4, 0.5]} radius={0.06} smoothness={3} material={material} />
    </group>
  )
}

/** Four obsidian monoliths that surface from the mirror for the four branches. */
export default function Monoliths() {
  return (
    <group position={[0, 1.7, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <Monolith key={i} i={i} />
      ))}
    </group>
  )
}
