import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, damp } from '../store.js'

// Camera keyframes along the journey. The camera climbs as the blade draws,
// pulls back for the clan, lifts to read the arsenal arc, then closes in.
const KEYS = [
  { at: 0.0, pos: [0, 0.4, 6.4], tgt: [0, 0.15, 0] },
  { at: 0.08, pos: [0, 0.4, 6.2], tgt: [0, 0.2, 0] },
  { at: 0.32, pos: [0.25, 1.45, 4.9], tgt: [0, 1.25, 0] },
  { at: 0.55, pos: [2.5, 1.05, 6.0], tgt: [-0.35, 0.95, 0] },
  { at: 0.74, pos: [0, 1.15, 8.4], tgt: [0, 0.65, 0] },
  { at: 0.95, pos: [0, 0.55, 5.2], tgt: [0, 0.95, 0] },
  { at: 1.0, pos: [0, 0.55, 5.0], tgt: [0, 0.95, 0] },
]

const tmpPos = new THREE.Vector3()
const tmpTgt = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()

function sample(p, key) {
  // find surrounding keyframes
  let i = 0
  for (let k = 0; k < KEYS.length - 1; k++) if (p >= KEYS[k].at) i = k
  const k0 = KEYS[i]
  const k1 = KEYS[Math.min(i + 1, KEYS.length - 1)]
  const span = Math.max(k1.at - k0.at, 1e-5)
  const t = THREE.MathUtils.clamp((p - k0.at) / span, 0, 1)
  const e = t * t * (3 - 2 * t) // smoothstep
  a.fromArray(k0[key])
  b.fromArray(k1[key])
  return a.lerp(b, e)
}

export default function CameraRig() {
  const { camera } = useThree()

  useFrame((state, dt) => {
    // Drive the shared damped values first (this rig is mounted first).
    forge.scrollDamped = damp(forge.scrollDamped, forge.scroll, 6, dt)
    forge.pointerDamped.x = damp(forge.pointerDamped.x, forge.pointer.x, 5, dt)
    forge.pointerDamped.y = damp(forge.pointerDamped.y, forge.pointer.y, 5, dt)

    const p = forge.scrollDamped
    tmpPos.copy(sample(p, 'pos'))
    tmpTgt.copy(sample(p, 'tgt'))

    // ACT 4 — cursor parallax (the slab/scene leans toward the cursor).
    const par = forge.quality === 'static' ? 0 : 1
    tmpPos.x += forge.pointerDamped.x * 0.5 * par
    tmpPos.y += forge.pointerDamped.y * 0.3 * par

    camera.position.lerp(tmpPos, 1 - Math.pow(0.0001, dt))
    camera.lookAt(tmpTgt)
  })

  return null
}
