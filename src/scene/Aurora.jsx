import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

/**
 * Fire-aurora light pillars over the horizon (30% crimson -> 10% ember) with opal
 * play-of-color shimmer in the brightest tips, plus an ember sun + a thin anamorphic
 * streak (faux lens flare). The mirror reflects all of it.
 */
const Aurora = forwardRef(function Aurora(props, ref) {
  const sunRef = useRef()
  useImperativeHandle(ref, () => sunRef.current)

  const pillars = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTemp: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uTemp; varying vec2 vUv;
          ${GLSL_NOISE}
          vec3 opal(float x){ return 0.5 + 0.5*cos(6.2831*(x + vec3(0.0,0.33,0.67))); }
          void main(){
            vec2 uv = vUv; float t = uTime;
            float wx = uv.x + 0.05*gw_fbm(vec2(uv.x*2.0, uv.y*1.4 + t*0.18));
            float band = abs(fract(wx*5.0 + 0.12*sin(t*0.25))-0.5)*2.0;
            float pillar = pow(smoothstep(0.55,0.0,band), 1.6);
            float vert = smoothstep(0.0,0.16,uv.y)*smoothstep(1.0,0.42,uv.y);
            float flick = 0.6 + 0.4*gw_fbm(vec2(uv.x*7.0, uv.y*3.0 - t*0.5));
            float v = pillar*vert*flick;
            float base = smoothstep(0.5,0.0,uv.y);
            vec3 col = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, base*0.7 + uTemp*0.3);
            col = mix(col, ${v3(PAL.gold)}, pow(v,2.0)*0.5);
            float irI = gw_fbm(vec2(uv.x*9.0, uv.y*6.0 + t*0.3));
            col += opal(irI + uv.y*0.5) * pow(v,3.0) * 0.18;
            float a = (v*0.95 + base*0.45);
            gl_FragColor = vec4(col*a, a);
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
        uniforms: { uColor: { value: PAL.hot.clone() } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `uniform vec3 uColor; varying vec2 vUv; void main(){ float r=smoothstep(0.5,0.0,length(vUv-0.5)); gl_FragColor=vec4(uColor*r, r);} `,
      }),
    [],
  )

  const streakMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: PAL.ember.clone() } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `uniform vec3 uColor; varying vec2 vUv;
          void main(){ float x=smoothstep(0.5,0.0,abs(vUv.x-0.5)); float y=smoothstep(0.5,0.0,abs(vUv.y-0.5));
            float s=pow(x,0.6)*pow(y,3.0); gl_FragColor=vec4(uColor*s, s);} `,
      }),
    [],
  )

  useFrame((state) => {
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    pillars.uniforms.uTime.value = t
    pillars.uniforms.uTemp.value = forge.scrollDamped
  })

  return (
    <group position={[0, 0, -34]}>
      <mesh material={pillars} position={[0, 8, -2]}>
        <planeGeometry args={[150, 36]} />
      </mesh>
      <mesh ref={sunRef} material={sunMat} position={[0, 1.3, 0]}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <mesh position={[0, 1.3, 0.1]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color={'#ffe7c2'} toneMapped={false} />
      </mesh>
      <mesh material={streakMat} position={[0, 1.3, 0.2]}>
        <planeGeometry args={[42, 2.4]} />
      </mesh>
    </group>
  )
})

export default Aurora
