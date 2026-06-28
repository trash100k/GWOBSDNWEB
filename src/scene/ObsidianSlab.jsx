import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

/**
 * The hero: a full-frame slab of polished black volcanic glass (obsidian) that
 * reflects the HDRI sharply, with rivers of fire-opal light running through cracks
 * in the glass — warm body + iridescent play-of-color, flowing, cursor/scroll aware.
 * The black glass + concentrated jewel veins is the whole effect.
 */
const HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uVeinGlow;   // 0..~1.3 — veins ignite + intensify with scroll
  uniform float uTemp;       // 0 crimson -> 1 white-hot (scroll temperature)
  uniform vec2  uPointer;    // cursor in slab uv
  uniform float uPointerOn;
  ${GLSL_NOISE}
  // shared scratch (computed in the normal stage, reused in the color stage)
  vec2  gwPw;
  float gwVein;
  float gwFlow;
  float gwCore;
  float gwN;
  void gwVeins(vec2 uv){
    vec2 p = uv * 1.8;   // bigger, more separated rivers
    // cursor bends the vein flow toward the pointer
    vec2 toP = (uPointer - uv);
    p += toP * uPointerOn * 0.7 * exp(-length(toP) * 3.0);
    vec2 w = vec2(gw_fbm(p*0.9 + vec2(0.0, uTime*0.05)),
                  gw_fbm(p*0.9 + vec2(5.0, -uTime*0.04)));
    gwPw = p + w * 1.1;
    gwN = gw_fbm(gwPw);
    float vein = pow(clamp(1.0 - abs(gwN), 0.0, 1.0), 11.0);   // thin rivers
    // large-scale mask — veins only run through a few channels, not everywhere
    float mask = smoothstep(0.0, 0.55, gw_fbm(uv*0.7 + vec2(uTime*0.02, -uTime*0.015)));
    vein *= mask;
    gwVein = vein;
    gwCore = pow(clamp(vein, 0.0, 1.0), 2.0);
    gwFlow = 0.5 + 0.5 * sin(gwN * 8.0 - uTime * 1.0);  // light travels along veins
  }
`

// Normal stage: ripple the reflections + treat veins as refractive channels.
const NORMAL = /* glsl */ `
  gwVeins(vUv);
  float gwUnd = gw_fbm(vUv * 1.6 + uTime * 0.05);
  vec3 gwBump = vec3(dFdx(gwVein * 0.6 + gwUnd * 0.3), dFdy(gwVein * 0.6 + gwUnd * 0.3), 0.0);
  normal = normalize(normal - gwBump * 0.45);
`

// Color stage: add the fire-opal vein emissive (the only place color lives).
const COLOR = /* glsl */ `
  float gwFres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
  vec3 body = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, clamp(gwVein * 1.2, 0.0, 1.0));
  body = mix(body, ${v3(PAL.hot)}, gwCore * (0.55 + 0.45 * uTemp));
  // iridescent play-of-color flecks — view-dependent, only in/around the veins
  float gwIr = gw_fbm(gwPw * 3.0 + 11.0);
  vec3 opal = 0.5 + 0.5 * cos(6.2831 * (gwIr * 1.4 + gwFres * 1.8 + uTime * 0.05 + vec3(0.0, 0.33, 0.67)));
  vec3 flecks = opal * gwVein * smoothstep(0.35, 0.85, gwIr) * 0.55;
  // brighten the veins near the cursor
  float nearCur = exp(-distance(vUv, uPointer) * 3.5) * uPointerOn * 0.5;
  vec3 fire = (body * gwVein * gwFlow * 1.0 + ${v3(PAL.hot)} * gwCore * 1.2 + flecks) * (uVeinGlow + nearCur);
  gl_FragColor.rgb += fire;
`

export default function ObsidianSlab({ quality }) {
  const transmissive = quality === 'high'
  const pointerTarget = useRef(new THREE.Vector2(0.5, 0.5))
  const pointerOn = useRef(0)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVeinGlow: { value: 0.0 },
      uTemp: { value: 0.0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerOn: { value: 0 },
    }),
    [],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#060507'),
      metalness: 0,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.0,
      ior: 1.5,
      transmission: transmissive ? 0.22 : 0,
      thickness: transmissive ? 1.0 : 0,
      attenuationColor: PAL.crimson.clone(),
      attenuationDistance: 2.0,
      transparent: transmissive,
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
  }, [uniforms, transmissive])

  useEffect(() => () => material.dispose(), [material])

  const onPointerMove = (e) => {
    if (e.uv) {
      pointerTarget.current.set(e.uv.x, e.uv.y)
      pointerOn.current = 1
    }
  }
  const onPointerOut = () => (pointerOn.current = 0)

  useFrame((state, dt) => {
    uniforms.uTime.value = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    // veins ignite as you enter and intensify/heat down the scroll
    const ramp = 0.18 + range(forge.scrollDamped, 0.0, 0.5) * 0.6
    uniforms.uVeinGlow.value = damp(uniforms.uVeinGlow.value, forge.ready ? ramp : 0, 3, dt)
    uniforms.uTemp.value = forge.scrollDamped
    uniforms.uPointer.value.lerp(pointerTarget.current, 1 - Math.pow(0.002, dt))
    uniforms.uPointerOn.value = damp(uniforms.uPointerOn.value, pointerOn.current, 6, dt)
  })

  return (
    <RoundedBox
      args={[11, 6.6, 0.6]}
      radius={0.18}
      smoothness={4}
      position={[0, 0, 0]}
      rotation={[-0.08, 0, 0]}
      material={material}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
    />
  )
}
