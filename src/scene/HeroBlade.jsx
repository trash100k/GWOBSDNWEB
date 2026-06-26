import * as THREE from 'three'
import Blade from './Blade.jsx'
import { forge, range } from '../store.js'

const { clamp, damp, smoothstep, lerp } = THREE.MathUtils

/** The single blade: draws molten up out of the slab, planted, then points at the cursor. */
export default function HeroBlade() {
  return (
    <Blade
      position={[0, 0, 0.4]}
      update={(u, state, dt, g) => {
        const p = forge.scrollDamped

        // ACT 2 — the draw: rise from below the slab to planted.
        const draw = smoothstep(range(p, 0.12, 0.34), 0, 1)
        g.position.y = lerp(-3.3, 0.0, draw)

        // Hide while the arsenal is on stage, return for the finale.
        const away = clamp(range(p, 0.6, 0.7) - range(p, 0.86, 0.92), 0, 1)
        const s = 1 - away
        g.scale.setScalar(Math.max(s, 0.0001))
        g.visible = s > 0.02

        // Heat: white-hot on emergence, cooling to steel.
        u.uCool.value = clamp(range(p, 0.16, 0.52), 0.05, 1)

        // ACT 5 — point the sword: the tip tracks the cursor.
        const aim = range(p, 0.86, 1)
        g.rotation.z = damp(g.rotation.z, -forge.pointerDamped.x * 0.5 * aim, 5, dt)
        g.rotation.x = damp(g.rotation.x, forge.pointerDamped.y * 0.4 * aim, 5, dt)
      }}
    />
  )
}
