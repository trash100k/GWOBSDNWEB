import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, damp } from '../store.js'

const tmp = new THREE.Vector3()

/**
 * The slab is the hero, so the camera barely moves: a gentle cursor parallax + a
 * subtle dolly-in across the scroll, so the obsidian's reflections slide and the
 * veins read as a living surface. Also the per-frame driver for damped scroll/pointer.
 */
export default function CameraRig() {
  const { camera } = useThree()

  useFrame((state, dt) => {
    forge.scrollDamped = damp(forge.scrollDamped, forge.scroll, 6, dt)
    forge.pointerDamped.x = damp(forge.pointerDamped.x, forge.pointer.x, 5, dt)
    forge.pointerDamped.y = damp(forge.pointerDamped.y, forge.pointer.y, 5, dt)

    const par = forge.quality === 'static' ? 0 : 1
    const z = 6.4 - forge.scrollDamped * 0.7
    tmp.set(forge.pointerDamped.x * 0.5 * par, forge.pointerDamped.y * 0.34 * par, z)
    camera.position.lerp(tmp, 1 - Math.pow(0.0001, dt))
    camera.lookAt(0, forge.pointerDamped.y * 0.12 * par, 0)
  })

  return null
}
