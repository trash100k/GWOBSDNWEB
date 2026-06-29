import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'

/**
 * Hero: a full-frame slab of polished black volcanic glass (obsidian) that
 * reflects the environment sharply, with rivers of fire-opal light through cracks —
 * warm body + ANIMATED iridescent play-of-color (visible on a flat surface), flowing,
 * cursor/scroll aware. Live-tunable via the ?debug leva panel.
 */
const HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uVeinGlow;
  uniform float uTemp;
  uniform float uIrid;
  uniform float uVeinScale;
  uniform float uBump;
  uniform vec2  uPointer;
  uniform float uPointerOn;
  uniform float uSurge;
  ${GLSL_NOISE}
  vec2  gwPw; float gwVein; float gwFlow; float gwCore; float gwN;
  void gwVeins(vec2 uv){
    vec2 p = uv * uVeinScale;
    vec2 toP = (uPointer - uv);
    p += toP * uPointerOn * 0.7 * exp(-length(toP) * 3.0);
    vec2 w = vec2(gw_fbm(p*0.9 + vec2(0.0, uTime*0.05)),
                  gw_fbm(p*0.9 + vec2(5.0, -uTime*0.04)));
    gwPw = p + w * 1.1;
    gwN = gw_fbm(gwPw);
    float vein = pow(clamp(1.0 - abs(gwN), 0.0, 1.0), 11.0);
    float mask = smoothstep(0.0, 0.55, gw_fbm(uv*0.7 + vec2(uTime*0.02, -uTime*0.015)));
    vein *= mask;
    gwVein = vein;
    gwCore = pow(clamp(vein, 0.0, 1.0), 2.0);
    gwFlow = 0.5 + 0.5 * sin(gwN * 8.0 - uTime * 1.0);
  }
  vec3 gwOpal(float x){ return 0.5 + 0.5 * cos(6.2831 * (x + vec3(0.0, 0.33, 0.67))); }
`

const NORMAL = /* glsl */ `
  gwVeins(vUv);
  float gwUnd = gw_fbm(vUv * 1.6 + uTime * 0.05);
  vec3 gwBmp = vec3(dFdx(gwVein * 0.6 + gwUnd * 0.3), dFdy(gwVein * 0.6 + gwUnd * 0.3), 0.0);
  normal = normalize(normal - gwBmp * uBump);
`

const COLOR = /* glsl */ `
  float gwFres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
  vec3 body = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, clamp(gwVein * 1.2, 0.0, 1.0));
  body = mix(body, ${v3(PAL.hot)}, gwCore * (0.55 + 0.45 * uTemp));
  float gwIrN = gw_fbm(gwPw * 2.2 + 5.0);
  vec3 opal = gwOpal(gwIrN * 1.6 + uTime * 0.08 + gwFres * 0.6);
  vec3 veinCol = mix(body, opal * 1.5, clamp(uIrid * (0.45 + 0.55 * gwIrN), 0.0, 0.85));
  // shared forge-light: a warm pool follows the finger and lights the bare glass,
  // not just the veins — the same touch that lights the copy lights the obsidian.
  float gwCur = exp(-distance(vUv, uPointer) * 2.6) * uPointerOn;
  float nearCur = gwCur * 1.15;
  vec3 fire = (veinCol * gwVein * gwFlow * 1.1 + ${v3(PAL.hot)} * gwCore * 1.3) * (uVeinGlow + uSurge + nearCur);
  gl_FragColor.rgb += ${v3(PAL.ember)} * gwCur * 0.11;
  gl_FragColor.rgb += fire;
`

export default function ObsidianSlab({ quality }) {
  const transmissive = quality === 'high'
  const pointerTarget = useRef(new THREE.Vector2(0.5, 0.5))
  const pointerOn = useRef(0)

  const c = useControls('OBSIDIAN', {
    glass: folder({
      reflect: { value: 1.4, min: 0, max: 5, step: 0.05, label: 'reflectivity' },
      roughness: { value: 0.05, min: 0, max: 0.4, step: 0.005 },
      bump: { value: 0.1, min: 0, max: 0.6, step: 0.01, label: 'surface ripple' },
      transmission: { value: 0.1, min: 0, max: 0.8, step: 0.02 },
    }),
    veins: folder({
      veinGlow: { value: 0.6, min: 0, max: 2, step: 0.02 },
      veinScale: { value: 1.8, min: 0.6, max: 4, step: 0.05 },
      iridescence: { value: 1.35, min: 0, max: 2, step: 0.02 },
    }),
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVeinGlow: { value: 0.0 },
      uTemp: { value: 0.0 },
      uIrid: { value: 1.0 },
      uVeinScale: { value: 1.8 },
      uBump: { value: 0.16 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerOn: { value: 0 },
      uSurge: { value: 0 },
    }),
    [],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#030205'),
      metalness: 0,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.4,
      ior: 1.5,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 500],
      transmission: transmissive ? 0.12 : 0,
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
    const ramp = c.veinGlow + range(forge.scrollDamped, 0.0, 0.5) * 0.5
    uniforms.uVeinGlow.value = damp(uniforms.uVeinGlow.value, forge.ready ? ramp : 0, 3, dt)
    uniforms.uTemp.value = forge.scrollDamped
    uniforms.uIrid.value = c.iridescence
    uniforms.uVeinScale.value = c.veinScale
    uniforms.uBump.value = c.bump
    uniforms.uPointer.value.lerp(pointerTarget.current, 1 - Math.pow(0.002, dt))
    uniforms.uPointerOn.value = damp(uniforms.uPointerOn.value, pointerOn.current, 6, dt)
    // vein surge when a headline arrives / the carousel turns (forge.strikeAt is
    // performance.now()/1000 — same base used here so the pulse lines up).
    const since = performance.now() / 1000 - forge.strikeAt
    uniforms.uSurge.value = since >= 0 && since < 1.6 ? Math.exp(-since * 3.0) * 0.85 : 0
    material.envMapIntensity = c.reflect
    material.roughness = c.roughness
    if (transmissive) material.transmission = c.transmission
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
