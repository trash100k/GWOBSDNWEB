import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { PAL, v3 } from './palette.js'
import { GLSL_NOISE } from './shaders.js'
import { buildGem } from './gem.js'

/**
 * The hero: THE EMERALD ISLE — a single cut emerald that tells the brand story
 * literally. At the top of the journey it's a ROUGH, UNCUT emerald (lumpy organic
 * rock); as you scroll the WHOLE page it BEVELS itself into a faceted cut
 * masterpiece — each section another pass of the forge. It glows deep-forest
 * GREEN from within (emissive + body color + a green jardin) so it reads boldly
 * green on a real OLED even where transmission shows dark; refraction + dispersion
 * are a high-tier garnish only (transmission stays OFF on the iPhone/weak GPUs, so
 * the green never depends on it). Flat-shaded facets catch hard light; glowing jade
 * edges sharpen IN as the cut completes.
 */
const clamp = (x, a, b) => Math.min(Math.max(x, a), b)

// rough -> cut MORPH: push each vertex out along its radial direction by fbm noise,
// scaled by (1 - cut). cut=0 => lumpy uncut rock; cut=1 => the clean facets sharpen.
const VERT_HEAD = /* glsl */ `
  ${GLSL_NOISE}
  uniform float uTime;
  uniform float uCut;
  uniform float uLumpAmt;
  uniform float uLumpScale;
  varying vec3 vGemP;
`
const VERT_BODY = /* glsl */ `
  vGemP = position;
  float gwRough = 1.0 - clamp(uCut, 0.0, 1.0);
  float gwL = (gw_fbm(position.xz * uLumpScale)
             + gw_fbm(position.yz * uLumpScale + 3.1)
             + gw_fbm(position.xy * uLumpScale + 7.7)) * 0.3333;
  vec3 gwDir = normalize(position + 1e-4);
  transformed += gwDir * gwL * gwRough * uLumpAmt;
`

// GREEN from within: an emerald jardin (internal inclusions) + an HDR green core
// glow, plus an emerald-opal play-of-color flash at the grazing facet edges.
// flat-shaded -> use the in-scope `normal` (vNormal isn't declared under FLAT_SHADED).
const FRAG_HEAD = /* glsl */ `
  ${GLSL_NOISE}
  uniform float uTime;
  uniform float uHeat;
  varying vec3 vGemP;
`
const FRAG_COLOR = /* glsl */ `
  float gwJ = gw_fbm(vGemP.xz * 2.3 + vGemP.y * 0.8 + uTime * 0.04);
  float gwFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.2);
  // green core glow from within — reads green on ALL tiers (even no-transmission)
  vec3 gwCore = mix(${v3(PAL.emerald)}, ${v3(PAL.emeraldHot)}, smoothstep(0.15, 0.9, gwJ * 0.5 + 0.5));
  gl_FragColor.rgb += gwCore * (0.20 + 0.32 * uHeat) * (0.55 + 0.45 * gwJ);
  // emerald-opal play-of-color flash at the cut edges
  vec3 gwOpal = 0.5 + 0.5 * cos(6.2831 * (gwFres * 1.3 + uHeat * 0.3 + vec3(0.0, 0.30, 0.62)));
  vec3 gwFlash = mix(${v3(PAL.jade)}, gwOpal, 0.5);
  gl_FragColor.rgb += gwFlash * gwFres * (0.12 + uHeat * 0.5);
`

export default function EmeraldGem({ quality }) {
  const transmissive = quality === 'high'
  const groupRef = useRef(null)
  const lineRef = useRef(null)
  const spin = useRef(0)

  const uTime = useRef({ value: 0 })
  const uCut = useRef({ value: 0 })
  const uHeat = useRef({ value: 0 })
  const uLumpAmt = useRef({ value: 0.34 })
  const uLumpScale = useRef({ value: 1.7 })

  const c = useControls('GEM', {
    cut: folder({
      lumpAmount: { value: 0.34, min: 0, max: 0.8, step: 0.01, label: 'rough amount' },
      lumpScale: { value: 1.7, min: 0.4, max: 4, step: 0.05, label: 'rough scale' },
      sides: { value: 8, min: 6, max: 16, step: 1 },
      scale: { value: 1.75, min: 0.6, max: 3, step: 0.05 },
    }),
    green: folder({
      emissive: { value: 1.15, min: 0, max: 3, step: 0.05 },
      roughness: { value: 0.14, min: 0, max: 0.5, step: 0.01 },
      reflect: { value: 1.8, min: 0, max: 5, step: 0.1, label: 'reflectivity' },
      iridescence: { value: 0.5, min: 0, max: 2, step: 0.05 },
      transmission: { value: 0.85, min: 0, max: 1, step: 0.02 },
      edgeGlow: { value: 0.6, min: 0, max: 1.5, step: 0.05 },
    }),
  })

  // clean octagonal step-cut (emerald cut): big flat table, untwisted crown.
  const geo = useMemo(
    () => buildGem({ sides: c.sides, tableR: 0.62, crownH: 0.34, pavH: 1.12, crownTwist: 0, subdiv: 2 }),
    [c.sides],
  )
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: PAL.forest.clone(),
      metalness: 0,
      roughness: 0.14,
      flatShading: true,
      envMapIntensity: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      ior: 1.57, // emerald
      iridescence: 0.5,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [120, 560],
      emissive: PAL.emerald.clone(),
      emissiveIntensity: 1.15,
      transmission: transmissive ? 0.85 : 0,
      thickness: transmissive ? 2.2 : 0,
      attenuationColor: PAL.emeraldLit.clone(),
      attenuationDistance: transmissive ? 1.1 : 0,
      dispersion: transmissive ? 2.5 : 0,
      transparent: transmissive,
    })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uTime: uTime.current,
        uCut: uCut.current,
        uHeat: uHeat.current,
        uLumpAmt: uLumpAmt.current,
        uLumpScale: uLumpScale.current,
      })
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
        .replace('#include <tonemapping_fragment>', `${FRAG_COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [transmissive])

  useEffect(
    () => () => {
      geo.dispose()
      edges.dispose()
      material.dispose()
    },
    [geo, edges, material],
  )

  useFrame((state, dt) => {
    const t = forge.quality === 'static' ? 2 : state.clock.elapsedTime
    const reduced = forge.quality === 'static'
    uTime.current.value = t

    // the cut REFINES across the whole journey: rough rock (hero) -> cut jewel (finale)
    uCut.current.value = damp(uCut.current.value, range(forge.scrollDamped, 0, 1), 3, dt)
    uLumpAmt.current.value = c.lumpAmount
    uLumpScale.current.value = c.lumpScale

    // forge heat — scroll energy + the strike pulse (same signals the type rides)
    const sinceStrike = performance.now() / 1000 - forge.strikeAt
    const pulse = sinceStrike >= 0 && sinceStrike < 1.2 ? Math.exp(-sinceStrike * 3) * 0.5 : 0
    const heat = clamp(Math.min(forge.scrollVel * 0.6, 0.7) + pulse, 0, 1)
    uHeat.current.value = damp(uHeat.current.value, heat, 6, dt)

    material.roughness = c.roughness
    material.envMapIntensity = c.reflect
    material.iridescence = c.iridescence
    material.emissiveIntensity = c.emissive + uHeat.current.value * 0.8
    if (transmissive) material.transmission = c.transmission

    if (groupRef.current) {
      groupRef.current.scale.setScalar(c.scale)
      // turn to catch the light: slow auto-spin (faster while scrolling) + pointer parallax
      spin.current += dt * (0.12 + forge.scrollVel * 0.8)
      const px = forge.pointerDamped.x
      const py = forge.pointerDamped.y
      groupRef.current.rotation.y = spin.current + (reduced ? 0 : px * 0.5)
      groupRef.current.rotation.x = -0.1 + (reduced ? 0 : py * 0.3 + Math.sin(t * 0.3) * 0.05)
      // rises as the journey deepens (lifts as it cuts)
      groupRef.current.position.y = range(forge.scrollDamped, 0, 1) * 0.4
    }
    if (lineRef.current) {
      // edges SHARPEN IN as the cut completes (rough rock has no crisp edges; this
      // also hides the static-edge / displaced-surface mismatch while it's rough)
      const sharp = THREE.MathUtils.smoothstep(uCut.current.value, 0.35, 0.95)
      lineRef.current.opacity = clamp(c.edgeGlow * sharp * (0.5 + uHeat.current.value * 1.0), 0, 1.5)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={geo} material={material} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          ref={lineRef}
          color={PAL.jade}
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
