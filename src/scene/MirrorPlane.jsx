import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { forge } from '../store.js'
import { GLSL_NOISE } from './shaders.js'

/**
 * The liquid obsidian mirror: a black-glass plane that reflects the aurora (high
 * tier, real planar reflection), with an additive surface layer of warm caustics
 * + a cursor-dragged refraction ripple co-planar on top. Low tier swaps the real
 * reflection for a cheap warm-gradient glass.
 */
export default function MirrorPlane({ quality }) {
  const reflect = quality === 'high'

  // cursor → world point on the plane (for the ripple origin)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  const overlay = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uRipple: { value: new THREE.Vector2(0, -10) },
          uRippleT: { value: -10 },
          uWarm: { value: new THREE.Color(1.5, 0.55, 0.18) },
          uAmbient: { value: quality === 'static' ? 0 : 1 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main(){
            vec4 wp = modelMatrix * vec4(position,1.0);
            vW = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec2 uRipple; uniform float uRippleT;
          uniform vec3 uWarm; uniform float uAmbient;
          varying vec3 vW;
          ${GLSL_NOISE}
          void main(){
            vec2 p = vW.xz;
            float t = uTime * 0.28;
            // cursor-dragged refraction ripple
            float d = length(p - uRipple);
            float ring = sin(d*1.8 - uTime*2.6) * exp(-d*0.22) * 0.6;
            vec2 cuv = p*0.075 + ring*0.06;
            float c = gw_caustic(cuv, t);
            float pool = smoothstep(0.05,0.8, gw_fbm(p*0.045 + vec2(t*0.1,0.0)));
            c *= pool;
            // mid-field window: avoid stretched caustics at the camera and the far edge
            float zf = vW.z + 6.0;
            float window = smoothstep(70.0, 16.0, abs(zf)) * smoothstep(2.0, -6.0, vW.z);
            // a warm wash toward the horizon (the reflected glow)
            float horizon = smoothstep(-46.0, -12.0, vW.z) * smoothstep(-2.0, -10.0, vW.z + 4.0);
            vec3 col = uWarm * (c*0.5 + max(ring,0.0)*0.25) * window
                     + uWarm * horizon * 0.10;
            gl_FragColor = vec4(col * (0.35 + 0.65*uAmbient), 1.0);
          }
        `,
      }),
    [quality],
  )

  // cheap low-tier base: dark glass with a warm horizon glow (fakes the reflection)
  const cheap = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uWarm: { value: new THREE.Color(0.9, 0.34, 0.12) } },
        vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
        fragmentShader: `
          uniform vec3 uWarm; varying vec3 vW;
          void main(){
            float horizon = smoothstep(-60.0,-8.0, vW.z);
            vec3 base = vec3(0.012,0.014,0.022);
            gl_FragColor = vec4(base + uWarm*horizon*0.22, 1.0);
          }
        `,
      }),
    [],
  )

  useFrame((state) => {
    overlay.uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    if (quality !== 'static') {
      raycaster.setFromCamera(forge.pointer, state.camera)
      if (raycaster.ray.intersectPlane(plane, hit)) {
        overlay.uniforms.uRipple.value.lerp(new THREE.Vector2(hit.x, hit.z), 0.12)
      }
    }
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        {reflect ? (
          <MeshReflectorMaterial
            resolution={1024}
            mirror={0.85}
            mixStrength={1.6}
            mixBlur={1.0}
            blur={[200, 60]}
            roughness={0.45}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#04050a"
            metalness={0.6}
          />
        ) : (
          <primitive object={cheap} attach="material" />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -6]} material={overlay}>
        <planeGeometry args={[160, 150]} />
      </mesh>
    </group>
  )
}
