import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { PAL, v3 } from './palette.js'
import { buildGem } from './gem.js'

/**
 * The hero: a CUT OBSIDIAN JEWEL. A flat-shaded faceted gem (src/scene/gem.js) of
 * near-black volcanic glass — crisp environment reflections off every facet, built-in
 * iridescence + a Fresnel fire-opal flash for the play-of-color, and glowing fire
 * EDGES along every cut (EdgesGeometry). It sits centred and slowly turns to catch the
 * light; scroll energy + strikes flare the edges and the internal fire (forge --heat).
 * REFLECTIVE, not transmissive — obsidian is opaque, and it keeps weak GPUs safe.
 */
const clamp = (x, a, b) => Math.min(Math.max(x, a), b)

// Fresnel fire-opal flash at the facet edges/grazing angles — the "fire" in the cut.
// (flat-shaded: use the in-scope `normal` — `vNormal` isn't declared under FLAT_SHADED.)
const COLOR = /* glsl */ `
  float gwFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
  vec3 gwOpal = 0.5 + 0.5 * cos(6.2831 * (gwFres * 1.5 + uHeat * 0.3 + vec3(0.0, 0.33, 0.67)));
  vec3 gwFire = mix(${v3(PAL.crimson)}, ${v3(PAL.ember)}, gwFres);
  gl_FragColor.rgb += mix(gwOpal, gwFire, 0.45) * gwFres * (0.10 + uHeat * 0.55);
`

export default function FacetedJewel({ quality }) {
  const groupRef = useRef(null)
  const lineRef = useRef(null)
  const spin = useRef(0)
  const uHeat = useRef({ value: 0 })

  const c = useControls('JEWEL', {
    gem: folder({
      sides: { value: 14, min: 6, max: 24, step: 1 },
      roughness: { value: 0.12, min: 0, max: 0.5, step: 0.01 },
      metalness: { value: 0.12, min: 0, max: 1, step: 0.02 },
      reflect: { value: 2.2, min: 0, max: 5, step: 0.1, label: 'reflectivity' },
      iridescence: { value: 1.0, min: 0, max: 2, step: 0.05 },
      edgeGlow: { value: 0.55, min: 0, max: 1.5, step: 0.05 },
      scale: { value: 1.7, min: 0.6, max: 3, step: 0.05 },
    }),
  })

  const geo = useMemo(() => buildGem({ sides: c.sides }), [c.sides])
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#050609'),
      metalness: 0.12,
      roughness: 0.12,
      flatShading: true,
      envMapIntensity: 2.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 1.0,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [120, 680],
      emissive: new THREE.Color('#180a06'),
      emissiveIntensity: 1.0,
    })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uHeat = uHeat.current
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uHeat;')
        .replace('#include <tonemapping_fragment>', `${COLOR}\n#include <tonemapping_fragment>`)
    }
    return m
  }, [])

  useEffect(() => () => {
    geo.dispose()
    edges.dispose()
    material.dispose()
  }, [geo, edges, material])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const reduced = forge.quality === 'static'
    // forge heat — scroll energy + the strike pulse (same signals as the type)
    const sinceStrike = performance.now() / 1000 - forge.strikeAt
    const pulse = sinceStrike >= 0 && sinceStrike < 1.2 ? Math.exp(-sinceStrike * 3) * 0.5 : 0
    const heat = clamp(Math.min(forge.scrollVel * 0.6, 0.7) + pulse, 0, 1)
    uHeat.current.value = damp(uHeat.current.value, heat, 6, dt)

    material.roughness = c.roughness
    material.metalness = c.metalness
    material.envMapIntensity = c.reflect
    material.iridescence = c.iridescence
    material.emissiveIntensity = 0.8 + uHeat.current.value * 1.3

    if (groupRef.current) {
      const sc = c.scale
      groupRef.current.scale.setScalar(sc)
      // turn to catch the light: slow auto-spin (faster while scrolling) + pointer parallax
      spin.current += dt * (0.14 + forge.scrollVel * 0.9)
      const px = forge.pointerDamped.x
      const py = forge.pointerDamped.y
      groupRef.current.rotation.y = spin.current + (reduced ? 0 : px * 0.5)
      groupRef.current.rotation.x = -0.12 + (reduced ? 0 : py * 0.3 + Math.sin(t * 0.3) * 0.05)
      // gentle rise across the scroll (the jewel lifts as the journey deepens)
      groupRef.current.position.y = range(forge.scrollDamped, 0, 1) * 0.4
    }
    if (lineRef.current) {
      lineRef.current.opacity = clamp(c.edgeGlow * (0.55 + uHeat.current.value * 1.1), 0, 1.6)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={geo} material={material} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          ref={lineRef}
          color={PAL.ember}
          transparent
          opacity={0.55}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
