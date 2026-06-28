import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'

/** Warm embers rising from the seam — additive GPU points, cheap atmosphere. */
export default function Embers({ count = 320 }) {
  const matRef = useRef()

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const speed = new Float32Array(count)
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = Math.random() * 9 - 1
      pos[i * 3 + 2] = 2 - Math.random() * 28 // spread toward the horizon for depth
      seed[i] = Math.random() * 6.28
      speed[i] = 0.25 + Math.random() * 0.7
      size[i] = 1.5 + Math.random() * 5.5
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    return g
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.45, 0.12) } },
        vertexShader: /* glsl */ `
          attribute float aSeed; attribute float aSpeed; attribute float aSize;
          uniform float uTime; varying float vA;
          void main(){
            vec3 p = position;
            float t = uTime * aSpeed;
            p.y = mod(p.y + t, 8.0) - 1.0;                 // rise + wrap
            p.x += sin(uTime * 0.5 + aSeed) * 0.35;         // drift
            p.z += cos(uTime * 0.4 + aSeed) * 0.2;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (3.0 / -mv.z);
            float life = fract((p.y + 1.0) / 8.0);
            vA = (0.5 + 0.5 * sin(uTime * 3.0 + aSeed)) * smoothstep(1.0, 0.2, life) * 0.9;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying float vA;
          void main(){
            vec2 d = gl_PointCoord - 0.5;
            float r = smoothstep(0.5, 0.0, length(d));
            gl_FragColor = vec4(uColor * r, r * vA);
          }
        `,
      }),
    [],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = forge.quality === 'static' ? 0 : state.clock.elapsedTime
  })

  return <points ref={matRef} geometry={geo} material={material} />
}
