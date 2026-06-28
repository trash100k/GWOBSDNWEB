import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, range } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

const { clamp, damp, smoothstep, lerp } = THREE.MathUtils
const XS = [-4.2, -1.4, 1.4, 4.2]

// a tall faceted crystal (octahedron bipyramid) — gem facets catch the light
const crystalGeo = (() => {
  const g = new THREE.OctahedronGeometry(1, 0)
  g.scale(0.66, 1.7, 0.66)
  g.computeVertexNormals()
  return g
})()

const HEAD = /* glsl */ `
  uniform float uTime; uniform float uGlow;
  ${GLSL_NOISE}
`
// warm fire-opal interior glow injected on top of the physical (iridescent) material
const COLOR = /* glsl */ `
  float ndv = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
  float interior = 1.0 - pow(1.0 - ndv, 2.0);
  float t = uTime * 0.3;
  float c = gw_caustic(vUv * 2.4, t);
  c *= smoothstep(0.05, 0.8, gw_fbm(vUv * 0.8 + vec2(t*0.1, 0.0)));
  float edge = pow(1.0 - ndv, 2.2);
  vec3 fire = ${v3(PAL.red)} * c * interior * (0.6 + uGlow * 1.9)
            + ${v3(PAL.ember)} * edge * (0.5 + uGlow * 1.8)
            + ${v3(PAL.crimson)} * interior * 0.2;   // always-lit fire-opal body
  gl_FragColor.rgb += fire;
`

function makeMaterial(transmissive) {
  const u = { uTime: { value: 0 }, uGlow: { value: 0 } }
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0a0406'),
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.2,
    ior: 1.46, // fire opal
    transmission: transmissive ? 0.85 : 0,
    thickness: transmissive ? 1.3 : 0,
    attenuationColor: PAL.crimson.clone(),
    attenuationDistance: 1.4,
    iridescence: 1.0, // the opal play-of-color
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 480],
    transparent: transmissive,
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

function Monolith({ i, transmissive }) {
  const groupRef = useRef()
  const material = useMemo(() => makeMaterial(transmissive), [transmissive])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    const u = material.userData.u
    u.uTime.value = state.clock.elapsedTime
    const on = forge.hovered === i
    u.uGlow.value = damp(u.uGlow.value, on ? 1 : 0, 6, dt)

    const p = forge.scrollDamped
    const rise = clamp(range(p, 0.58, 0.74) - range(p, 0.86, 0.94), 0, 1)
    const g = groupRef.current
    g.position.y = lerp(-4.2, 0, smoothstep(0, 1, rise)) + (on ? 0.16 : 0)
    g.visible = rise > 0.02
    g.rotation.y += dt * (0.05 + (on ? 0.25 : 0)) // slow gem turn
    const s = 0.96 + (on ? 0.08 : 0)
    g.scale.setScalar(damp(g.scale.x, s, 6, dt))
  })

  return (
    <group
      ref={groupRef}
      position={[XS[i], -4.2, -3]}
      onPointerOver={(e) => {
        e.stopPropagation()
        forge.hovered = i
      }}
      onPointerOut={() => forge.hovered === i && (forge.hovered = -1)}
      onClick={(e) => {
        e.stopPropagation()
        forge.hovered = i
      }}
    >
      <mesh geometry={crystalGeo} material={material} />
    </group>
  )
}

/** Four fire-opal crystals that surface from the mirror for the four branches. */
export default function Monoliths({ quality }) {
  const transmissive = quality === 'high'
  return (
    <group position={[0, 1.8, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <Monolith key={i} i={i} transmissive={transmissive} />
      ))}
    </group>
  )
}
