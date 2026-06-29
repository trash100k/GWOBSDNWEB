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
  void: new THREE.Color('#02060a'), // 60 — dominant dark, a hair green-black
  ink: new THREE.Color('#04100b'),
  emeraldDeep: new THREE.Color('#013a22'), // 30 — deep, for the saturated core/shadow mass
  emerald: new THREE.Color('#006837'), // Emerald Isle — body green
  jade: new THREE.Color('#019529'), // Irish Green — brighter body / bright zones
  emeraldBright: new THREE.Color('#1fd66b'), // bright jade highlight
  gold: new THREE.Color('#d9b25a'), // warm gold glints (kept for warmth)
  pale: new THREE.Color(1.45, 1.5, 1.15), // near-white-gold core/glint (HDR — only this blooms)
}

// vec3 helper for inlining into GLSL
export const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
