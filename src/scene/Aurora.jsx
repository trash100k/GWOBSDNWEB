import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'
import { GLSL_NOISE } from './shaders.js'

/**
 * The hero light: warm aurora curtains hanging above a dark horizon, plus a faint
 * ember sun (the god-ray source). The mirror plane reflects all of it.
 * Exposes the sun mesh via ref so postprocessing GodRays can target it.
 */
const Aurora = forwardRef(function Aurora(props, ref) {
  const sunRef = useRef()
  useImperativeHandle(ref, () => sunRef.current)

  const curtain = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uWarm: { value: new THREE.Color(1.4, 0.5, 0.16) },
          uHot: { value: new THREE.Color(1.6, 1.0, 0.55) },
          uIntensity: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uWarm; uniform vec3 uHot; uniform float uIntensity;
          varying vec2 vUv;
          ${GLSL_NOISE}
          void main(){
            float x = vUv.x;
            float t = uTime;
            float n  = gw_fbm(vec2(x*3.0 + t*0.12, vUv.y*1.4 + t*0.04));
            float bands = 0.5 + 0.5*sin((x*9.0 + n*2.2)*3.14159);
            float v = pow(clamp(n*0.5+0.5,0.0,1.0), 1.8) * bands;
            v *= smoothstep(0.0,0.30,vUv.y) * smoothstep(1.0,0.45,vUv.y); // hang from a horizon
            // brighter near the base (the horizon line)
            float base = smoothstep(0.45,0.0,vUv.y);
            vec3 col = mix(uWarm, uHot, base*0.8);
            float a = (v*0.9 + base*0.5) * uIntensity;
            gl_FragColor = vec4(col * a, a);
          }
        `,
      }),
    [],
  )

  const sunMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(1.8, 1.1, 0.6) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
          uniform vec3 uColor; varying vec2 vUv;
          void main(){ float r=smoothstep(0.5,0.0,length(vUv-0.5)); gl_FragColor=vec4(uColor*r, r); }
        `,
      }),
    [],
  )

  useFrame((state) => {
    curtain.uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
  })

  return (
    <group position={[0, 0, -34]}>
      {/* warm curtains */}
      <mesh material={curtain} position={[0, 7, 0]}>
        <planeGeometry args={[150, 34]} />
      </mesh>
      {/* the ember sun — god-ray source */}
      <mesh ref={sunRef} material={sunMat} position={[0, 1.2, 1]}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      {/* a tight bright core for the godrays to grab */}
      <mesh position={[0, 1.2, 1.1]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color={'#ffe7c2'} toneMapped={false} />
      </mesh>
    </group>
  )
})

export default Aurora
