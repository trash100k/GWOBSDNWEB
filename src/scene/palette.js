import * as THREE from 'three'

/**
 * GAELWORX — THE EMERALD. "It takes many forges to make an Emerald Isle."
 * Deep chromium green beryl: a saturated bluish-green body, a slow architectural
 * hall-of-mirrors of bright/dark facet zones, a faint internal jardin of green
 * inclusions, and gold/white-gold specular glints. Quiet, expensive, calm.
 *
 * 60 / 30 / 10:
 *   60% void (near-black, a hair green) · 30% deep saturated emerald body
 *   (the rich Beer–Lambert core, kept dark) · 10% jade/gold glint (the bright
 *   accent — facet flashes, specular glints, the core spark).
 * HDR (>1) values are intentional so only the 10% blooms.
 */
export const PAL = {
  // DEEP FOREST emerald — lifted luminous so it reads boldly green on OLED (not near-black).
  void: new THREE.Color('#03100a'), // 60 — dominant dark, a hair green-black
  ink: new THREE.Color('#06190f'),
  emeraldDeep: new THREE.Color('#0a3d20'), // 30 — deep forest shadow / saturated core mass
  emerald: new THREE.Color('#0c6e3f'), // deep forest — luminous body green
  jade: new THREE.Color('#16a35a'), // brighter forest — jardin / bright zones
  emeraldBright: new THREE.Color('#28c772'), // vivid forest highlight (facet flash)
  gold: new THREE.Color('#d9b25a'), // warm gold glints (kept for warmth)
  pale: new THREE.Color(1.4, 1.5, 1.18), // near-white-gold core/glint (HDR — only this blooms)
}

// vec3 helper for inlining into GLSL
export const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
