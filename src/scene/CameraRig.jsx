import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forge, damp } from '../store.js'
import { sceneFor } from './scenes.js'

const tmp = new THREE.Vector3()
// damped camera framing so a route change orbits the forge to face the new page
const cam = { z: 6.4, ang: 0 }

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
    // per-route framing — orbit + dolly damp toward the active page's preset
    const sc = sceneFor(forge.route)
    cam.z = damp(cam.z, sc.camZ, 2.2, dt)
    cam.ang = damp(cam.ang, sc.rotY, 2.2, dt)
    const z = cam.z - forge.scrollDamped * 0.7
    tmp.set(
      Math.sin(cam.ang) * z + forge.pointerDamped.x * 0.5 * par,
      forge.pointerDamped.y * 0.34 * par,
      Math.cos(cam.ang) * z,
    )
    camera.position.lerp(tmp, 1 - Math.pow(0.0001, dt))
    camera.lookAt(0, forge.pointerDamped.y * 0.12 * par, 0)
  })

  return null
}
