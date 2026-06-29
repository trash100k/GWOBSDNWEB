import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { forge, range, damp } from '../store.js'
import { GLSL_NOISE } from './shaders.js'
import { PAL, v3 } from './palette.js'
import { makeEmeraldCut } from './gem.js'

/**
 * Hero: a full-frame slab of deep chromium-green EMERALD. A saturated bluish-green
 * body with a slow, architectural "hall of mirrors" — crisp bright/dark facet zones
 * (extinction vs flash) — and a faint internal JARDIN (green garden of inclusions)
 * with gold/white-gold specular glints. Chase light + facets, NOT movement: the
 * internal life is near-static and slow, never rippling water. Cursor/scroll aware.
 * Live-tunable via the ?debug leva panel.
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
  vec2  gwPw; float gwVein; float gwFlow; float gwCore; float gwN; float gwFacet;
  void gwVeins(vec2 uv){
    // very slow internal drift — a settling jardin, NOT flowing water.
    float t = uTime * 0.012;
    vec2 p = uv * uVeinScale;
    vec2 toP = (uPointer - uv);
    p += toP * uPointerOn * 0.7 * exp(-length(toP) * 3.0);
    // near-static warp: tiny amplitude + barely-moving phase so the garden holds still.
    vec2 w = vec2(gw_fbm(p*0.9 + vec2(0.0, t)),
                  gw_fbm(p*0.9 + vec2(5.0, -t)));
    gwPw = p + w * 0.45;
    gwN = gw_fbm(gwPw);
    // jardin: thin internal inclusions — crisp, deep, sitting inside the stone.
    float vein = pow(clamp(1.0 - abs(gwN), 0.0, 1.0), 11.0);
    // FACETS: hard step zones (the emerald-cut hall of mirrors) — broad bright
    // planes alternating with dark extinction. Static architecture, no uTime.
    float fz = gw_fbm(uv * (uVeinScale * 0.55) + 13.0);
    gwFacet = smoothstep(0.06, 0.10, fz) - smoothstep(0.30, 0.42, fz);
    gwFacet = clamp(gwFacet, 0.0, 1.0);
    // a static mask that gates the jardin into deep zones (extinction looks IN).
    float mask = smoothstep(-0.1, 0.55, gw_fbm(uv*0.7 + 21.0));
    vein *= mask;
    gwVein = vein;
    gwCore = pow(clamp(vein, 0.0, 1.0), 2.0);
    // glint shimmer: kept but slowed hard so it's a faint breathe, not a ripple.
    gwFlow = 0.62 + 0.38 * sin(gwN * 8.0 - uTime * 0.12);
  }
  vec3 gwOpal(float x){ return 0.5 + 0.5 * cos(6.2831 * (x + vec3(0.0, 0.33, 0.67))); }
`

const NORMAL = /* glsl */ `
  gwVeins(vUv);
  // STATIC surface relief — crisp step-facet texture, no uTime so it never crawls.
  float gwUnd = gw_fbm(vUv * 1.6 + 4.0);
  float gwRelief = gwVein * 0.55 + gwUnd * 0.22 + gwFacet * 0.5;
  vec3 gwBmp = vec3(dFdx(gwRelief), dFdy(gwRelief), 0.0);
  normal = normalize(normal - gwBmp * uBump);
`

const COLOR = /* glsl */ `
  float gwFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
  // EMERALD body: deep saturated green → brighter jade in the jardin inclusions.
  vec3 body = mix(${v3(PAL.emeraldDeep)}, ${v3(PAL.emerald)}, clamp(gwVein * 1.1, 0.0, 1.0));
  body = mix(body, ${v3(PAL.jade)}, clamp(gwVein * 1.3, 0.0, 1.0) * 0.7);
  // core glint is pale gold/white (the specular spark), NOT orange.
  body = mix(body, ${v3(PAL.pale)}, gwCore * (0.50 + 0.40 * uTemp));
  // HALL OF MIRRORS: crisp bright facet flashes vs dark extinction. Static, light-led.
  vec3 bright = mix(${v3(PAL.jade)}, ${v3(PAL.emeraldBright)}, gwFres);
  body = mix(body * 0.45, body, gwFacet);            // dark planes look INTO the stone
  body += bright * gwFacet * (0.18 + 0.30 * gwFres); // broad bright reflected planes
  // procedural play-of-color, tinted green/gold and kept subtle — slow phase, no ripple.
  float gwIrN = gw_fbm(gwPw * 2.2 + 5.0);
  vec3 opal = gwOpal(gwIrN * 1.2 + uTime * 0.01 + gwFres * 0.5);
  opal *= ${v3(PAL.jade)} + ${v3(PAL.gold)} * 0.5; // bias play-of-color to green/gold
  vec3 veinCol = mix(body, opal * 1.4, clamp(uIrid * (0.30 + 0.40 * gwIrN), 0.0, 0.55));
  // shared forge-light: a cool emerald pool follows the finger and lights the bare
  // stone, not just the jardin — the same touch that lights the copy lights the gem.
  float gwCur = exp(-distance(vUv, uPointer) * 2.6) * uPointerOn;
  float nearCur = gwCur * 1.15;
  vec3 glow = (veinCol * gwVein * gwFlow * 1.0 + ${v3(PAL.pale)} * gwCore * 1.1) * (uVeinGlow + uSurge + nearCur);
  gl_FragColor.rgb += ${v3(PAL.jade)} * gwCur * 0.10;
  gl_FragColor.rgb += glow;
  // WAY more green — a bold emerald wash + a luminous green fresnel rim so the gem
  // reads unmistakably green (not near-black) even where transmission shows dark.
  gl_FragColor.rgb += ${v3(PAL.emerald)} * 0.32;
  gl_FragColor.rgb += ${v3(PAL.jade)} * gwFres * 0.55;
`

export default function ObsidianSlab({ quality }) {
  const transmissive = quality === 'high'
  const pointerTarget = useRef(new THREE.Vector2(0.5, 0.5))
  const pointerOn = useRef(0)
  const gemRef = useRef()
  const gemGeo = useMemo(() => makeEmeraldCut(), [])

  const c = useControls('EMERALD', {
    gem: folder({
      reflect: { value: 1.4, min: 0, max: 5, step: 0.05, label: 'reflectivity' },
      roughness: { value: 0.04, min: 0, max: 0.4, step: 0.005 },
      bump: { value: 0.12, min: 0, max: 0.6, step: 0.01, label: 'facet relief' },
      transmission: { value: 0.12, min: 0, max: 0.8, step: 0.02 },
    }),
    jardin: folder({
      veinGlow: { value: 0.45, min: 0, max: 2, step: 0.02, label: 'jardin glow' },
      veinScale: { value: 2.0, min: 0.6, max: 4, step: 0.05, label: 'facet scale' },
      iridescence: { value: 0.9, min: 0, max: 2, step: 0.02, label: 'play-of-color' },
    }),
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVeinGlow: { value: 0.0 },
      uTemp: { value: 0.0 },
      uIrid: { value: 0.9 },
      uVeinScale: { value: 2.0 },
      uBump: { value: 0.12 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerOn: { value: 0 },
      uSurge: { value: 0 },
      uCut: { value: 0 }, // 0 = rough uncut rock · 1 = clean beveled facets
    }),
    [],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      // raw deep-forest emerald-in-rock for the hero entry (the "before forging").
      color: new THREE.Color('#03180e'),
      // glow green from within so the gem reads boldly emerald, not near-black.
      emissive: new THREE.Color('#0c6e3f'),
      emissiveIntensity: 0.6,
      flatShading: true, // real facets — the emerald-cut hall of mirrors
      metalness: 0,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.4,
      ior: 1.57, // beryl / emerald (was 1.5 obsidian)
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 500],
      // high tier keeps transmission/thickness up so thicker light paths read
      // darker, more SATURATED green (Beer–Lambert = the rich emerald core).
      transmission: transmissive ? 0.12 : 0,
      thickness: transmissive ? 1.0 : 0,
      attenuationColor: PAL.emerald.clone(),
      attenuationDistance: 1.1,
      transparent: transmissive,
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      // rough → cut morph: displace each vertex along its normal by noise * (1-uCut).
      // uCut = scroll progress, so the uncut rock bevels into clean facets as you descend.
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nuniform float uCut;\n${GLSL_NOISE}`)
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float gwRough = gw_fbm(position.xy * 1.7 + 7.0) * 0.22
                        + gw_fbm(position.yz * 1.9 + 3.0) * 0.22
                        + gw_fbm(position.xz * 2.3 + 11.0) * 0.16;
          transformed += normal * gwRough * (1.0 - clamp(uCut, 0.0, 1.0));`
        )
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
    // rough → cut morph across the whole journey (uncut rock → beveled masterpiece).
    uniforms.uCut.value = damp(uniforms.uCut.value, forge.scrollDamped, 4, dt)
    if (gemRef.current) {
      const tt = forge.quality === 'static' ? 0 : state.clock.elapsedTime
      gemRef.current.rotation.y = tt * 0.12 + forge.pointerDamped.x * 0.5
      gemRef.current.rotation.x = -0.12 + forge.pointerDamped.y * 0.22
      gemRef.current.position.y = -forge.scrollDamped * 0.25
    }
    material.envMapIntensity = c.reflect
    material.roughness = c.roughness
    if (transmissive) material.transmission = c.transmission
  })

  return (
    <mesh
      ref={gemRef}
      geometry={gemGeo}
      material={material}
      scale={1.5}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
    />
  )
}
