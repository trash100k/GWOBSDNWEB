import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

/** Deep crimson nebula + a warm starfield far behind the horizon — cosmic depth. */
export default function Cosmos({ quality }) {
  // ── nebula ──
  const nebula = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uTemp: { value: 0 }, // 0 deep-crimson → 1 hot-ember (scroll temp)
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uTemp; varying vec2 vUv;
          ${GLSL_NOISE}
          void main(){
            vec2 p = vUv*vec2(3.2,1.6);
            float t = uTime*0.015;
            vec2 w = vec2(gw_fbm(p*1.2 + t), gw_fbm(p*1.2 + 7.0 - t));
            float n = gw_fbm(p*1.6 + w*1.3 + vec2(t,0.0));
            float clouds = pow(clamp(n*0.5+0.6,0.0,1.0), 2.4);
            // denser toward the horizon (bottom), fades up
            clouds *= smoothstep(0.0,0.5,vUv.y) * smoothstep(1.0,0.35,vUv.y);
            vec3 deep = ${v3(PAL.crimsonDeep)};
            vec3 mid  = ${v3(PAL.crimson)};
            vec3 hot  = ${v3(PAL.ember)};
            vec3 col = mix(deep, mid, clouds);
            col = mix(col, hot, pow(clouds,3.0)*(0.4+0.6*uTemp));
            float a = clouds * (0.5 + 0.3*uTemp);
            gl_FragColor = vec4(col*a, a);
          }
        `,
      }),
    [],
  )

  // ── starfield (warm sparks) ──
  const count = quality === 'high' ? 700 : 280
  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 170
      pos[i * 3 + 1] = Math.random() * 46 + 1
      pos[i * 3 + 2] = -40 - Math.random() * 55
      seed[i] = Math.random() * 6.28
      size[i] = 1 + Math.random() * 2.6
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    return g
  }, [count])

  const starMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: PAL.gold.clone() } },
        vertexShader: /* glsl */ `
          attribute float aSeed; attribute float aSize; uniform float uTime; varying float vT;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (90.0 / -mv.z);
            vT = 0.55 + 0.45*sin(uTime*1.4 + aSeed);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor; varying float vT;
          void main(){ float r=smoothstep(0.5,0.0,length(gl_PointCoord-0.5)); gl_FragColor=vec4(uColor*r, r*vT*0.8); }
        `,
      }),
    [],
  )

  useFrame((state) => {
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    nebula.uniforms.uTime.value = t
    nebula.uniforms.uTemp.value = forge.scrollDamped
    starMat.uniforms.uTime.value = t
  })

  return (
    <group>
      <mesh material={nebula} position={[0, 11, -62]}>
        <planeGeometry args={[210, 80]} />
      </mesh>
      <points geometry={starGeo} material={starMat} />
    </group>
  )
}
