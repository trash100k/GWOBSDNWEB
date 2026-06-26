import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, damp } from '../store.js'

// Camera keyframes across the mirror world: skim low over the obsidian lake toward
// the aurora, rise for the clan, drop back to read the monolith row, low for the finale.
const KEYS = [
  { at: 0.0, pos: [0, 0.85, 8.5], tgt: [0, 0.95, -10] },
  { at: 0.08, pos: [0, 0.78, 7.6], tgt: [0, 0.9, -10] },
  { at: 0.32, pos: [0, 0.5, 3.4], tgt: [0, 0.72, -14] },
  { at: 0.55, pos: [3.0, 1.9, 7.2], tgt: [-0.6, 1.05, -6] },
  { at: 0.74, pos: [0, 1.65, 9.6], tgt: [0, 1.45, -3] },
  { at: 0.95, pos: [0, 0.55, 5.6], tgt: [0, 0.8, -12] },
  { at: 1.0, pos: [0, 0.55, 5.4], tgt: [0, 0.8, -12] },
]

const tmpPos = new THREE.Vector3()
const tmpTgt = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()

function sample(p, key) {
  let i = 0
  for (let k = 0; k < KEYS.length - 1; k++) if (p >= KEYS[k].at) i = k
  const k0 = KEYS[i]
  const k1 = KEYS[Math.min(i + 1, KEYS.length - 1)]
  const span = Math.max(k1.at - k0.at, 1e-5)
  const t = THREE.MathUtils.clamp((p - k0.at) / span, 0, 1)
  const e = t * t * (3 - 2 * t)
  a.fromArray(k0[key])
  b.fromArray(k1[key])
  return a.lerp(b, e)
}

export default function CameraRig() {
  const { camera } = useThree()

  useFrame((state, dt) => {
    forge.scrollDamped = damp(forge.scrollDamped, forge.scroll, 6, dt)
    forge.pointerDamped.x = damp(forge.pointerDamped.x, forge.pointer.x, 5, dt)
    forge.pointerDamped.y = damp(forge.pointerDamped.y, forge.pointer.y, 5, dt)

    const p = forge.scrollDamped
    tmpPos.copy(sample(p, 'pos'))
    tmpTgt.copy(sample(p, 'tgt'))

    const par = forge.quality === 'static' ? 0 : 1
    tmpPos.x += forge.pointerDamped.x * 0.5 * par
    tmpPos.y += forge.pointerDamped.y * 0.25 * par

    camera.position.lerp(tmpPos, 1 - Math.pow(0.0001, dt))
    camera.lookAt(tmpTgt)
  })

  return null
}
