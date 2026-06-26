import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { forge, range } from '../store.js'
import { GLSL_NOISE } from './shaders.js'

const HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uSeam;        // 0..1 — the molten seam ignites + widens
  uniform float uCausticSpeed;
  uniform vec3  uEmber;
  uniform vec3  uCaustic;
  ${GLSL_NOISE}
`

// Perturb the base normal a touch where caustics pool (interior undulation).
const NORMAL = /* glsl */ `
  float obsT = uTime * uCausticSpeed;
  float obsC = gw_caustic(vUv * 2.0, obsT);
  float obsPool = smoothstep(0.15, 0.85, gw_fbm(vUv * 0.55 + vec2(obsT*0.05, -obsT*0.04)));
  obsC *= obsPool;
  vec3 obsBump = vec3(dFdx(obsC), dFdy(obsC), 0.0);
  normal = normalize(normal - obsBump * 0.3);
`

const COLOR = /* glsl */ `
  float ndv = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
  float interior = 1.0 - pow(1.0 - ndv, 3.0);

  // The molten seam — a vertical crack of forge light down the slab's core.
  float sw = mix(0.006, 0.05, uSeam);
  float seam = exp(-pow((vUv.x - 0.5) / sw, 2.0));
  float flow = 0.6 + 0.4 * gw_fbm(vec2(vUv.y * 8.0 - uTime * 0.6, uTime * 0.2));
  seam *= flow * uSeam;
  // a hot core that fades toward the slab edges (top/bottom)
  seam *= smoothstep(0.02, 0.16, vUv.y) * smoothstep(0.02, 0.16, 1.0 - vUv.y);

  vec3 warm = uCaustic * obsC * interior * 0.28
            + uEmber * seam * 2.2
            + mix(uEmber, vec3(1.0,0.85,0.55), seam) * pow(seam, 2.0) * 1.4;
  gl_FragColor.rgb += warm;
`

export default function ObsidianSlab() {
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeam: { value: 0 },
      uCausticSpeed: { value: 0.35 },
      uEmber: { value: new THREE.Color(1.0, 0.26, 0.05) },
      uCaustic: { value: new THREE.Color(1.6, 0.5, 0.13) },
    }),
    [],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#05060b'),
      metalness: 0,
      roughness: 0.13,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.1,
      reflectivity: 0.6,
      ior: 1.7,
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${HEAD}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL}`)
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [uniforms])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2.0 : state.clock.elapsedTime
    // Seam ignites as the draw begins (act 2) and stays lit through the journey.
    uniforms.uSeam.value = range(forge.scrollDamped, 0.05, 0.34)
  })

  return (
    <RoundedBox
      ref={matRef}
      args={[9, 6.4, 0.5]}
      radius={0.12}
      smoothness={4}
      position={[0, 0.2, -0.4]}
      material={material}
    />
  )
}
