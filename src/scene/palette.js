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
  // DEEP FOREST emerald — chosen in the viewer: moody, saturated, dark green.
  void: new THREE.Color('#02080a'), // 60 — dominant dark, a hair green-black
  ink: new THREE.Color('#04120c'),
  emeraldDeep: new THREE.Color('#062a16'), // 30 — deep forest shadow / saturated core mass
  emerald: new THREE.Color('#0a5c33'), // deep forest — body green (the locked color)
  jade: new THREE.Color('#117a45'), // brighter forest — jardin / bright zones (not vivid)
  emeraldBright: new THREE.Color('#1f9d57'), // forest highlight (facet flash)
  gold: new THREE.Color('#d9b25a'), // warm gold glints (kept for warmth)
  pale: new THREE.Color(1.4, 1.5, 1.18), // near-white-gold core/glint (HDR — only this blooms)
}

// vec3 helper for inlining into GLSL
export const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
