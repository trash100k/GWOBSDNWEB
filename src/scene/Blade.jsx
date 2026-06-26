import { forwardRef, useMemo, useRef, useEffect, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'
import { GLSL_NOISE } from './shaders.js'

/* ── Geometry (built once, shared) ─────────────────────────────────────── */
const W = 0.092
const L = 2.45
const SHOULDER = 2.0

const bladeShape = new THREE.Shape()
bladeShape.moveTo(-W, 0)
bladeShape.lineTo(W, 0)
bladeShape.lineTo(W, SHOULDER)
bladeShape.lineTo(0, L) // the point
bladeShape.lineTo(-W, SHOULDER)
bladeShape.lineTo(-W, 0)

const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
  depth: 0.045,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.028,
  bevelSegments: 2,
})
bladeGeo.translate(0, 0, -0.045 / 2)
bladeGeo.computeVertexNormals()

const guardGeo = new THREE.BoxGeometry(0.52, 0.085, 0.17)
guardGeo.translate(0, -0.02, 0)
const gripGeo = new THREE.CylinderGeometry(0.04, 0.036, 0.42, 14)
gripGeo.translate(0, -0.25, 0)
const pommelGeo = new THREE.IcosahedronGeometry(0.062, 1)
pommelGeo.translate(0, -0.48, 0)

/* ── Heat shader ───────────────────────────────────────────────────────── */
const V_HEAD = `varying vec3 vLocalPos;`
const V_BODY = `vLocalPos = position;`
const F_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uCool;   // 0 = white hot, 1 = cooled steel
  uniform float uGlow;   // hover ignite
  varying vec3 vLocalPos;
  ${GLSL_NOISE}
`
const F_COLOR = /* glsl */ `
  float tip = smoothstep(-0.4, ${L.toFixed(2)}, vLocalPos.y);
  float flick = 0.68 + 0.32 * gw_fbm(vec2(vLocalPos.y * 3.0 - uTime * 1.3, uTime * 0.6));
  float fres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
  float heat = (tip * 0.65 + fres * 0.7) * flick;
  heat *= (1.0 - uCool);
  heat += uGlow * (0.35 + fres * 0.9);
  heat = clamp(heat, 0.0, 1.6);
  vec3 hot = mix(vec3(1.5, 0.42, 0.10), vec3(1.7, 1.25, 0.75), clamp(heat, 0.0, 1.0));
  gl_FragColor.rgb += hot * heat * 1.25;
`

function makeHeatMaterial() {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1b1d24'),
    metalness: 0.96,
    roughness: 0.34,
    envMapIntensity: 1.1,
  })
  m.userData.u = {
    uTime: { value: 0 },
    uCool: { value: 1 },
    uGlow: { value: 0 },
  }
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, m.userData.u)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${V_HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${V_BODY}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${F_HEAD}`)
      .replace('#include <tonemapping_fragment>', `${F_COLOR}\n#include <tonemapping_fragment>`)
  }
  return m
}

/* ── Component ─────────────────────────────────────────────────────────── */
const Blade = forwardRef(function Blade({ update, ...props }, ref) {
  const groupRef = useRef()
  useImperativeHandle(ref, () => groupRef.current)

  const material = useMemo(() => makeHeatMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, dt) => {
    const u = material.userData.u
    u.uTime.value = state.clock.elapsedTime
    if (update) update(u, state, dt, groupRef.current)
  })

  return (
    <group ref={groupRef} {...props}>
      <mesh geometry={bladeGeo} material={material} />
      <mesh geometry={guardGeo} material={material} />
      <mesh geometry={gripGeo} material={material} />
      <mesh geometry={pommelGeo} material={material} />
    </group>
  )
})

export default Blade
