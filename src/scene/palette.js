import * as THREE from 'three'

/**
 * GAELWORX 60 / 30 / 10 — all warm (the forge).
 *   60% void (obsidian black) · 30% crimson/forge-red (the cool-side counter-mass,
 *   kept deep, never bright) · 10% ember/gold (the bright accent — sun, glints, CTAs).
 * HDR (>1) values are intentional so only the 10% blooms.
 */
export const PAL = {
  void: new THREE.Color('#050507'), // 60 — dominant dark
  ink: new THREE.Color('#0a0608'),
  crimsonDeep: new THREE.Color('#3a0905'), // 30 — deep, for nebula/shadow mass
  crimson: new THREE.Color('#8c140a'),
  red: new THREE.Color('#c8200a'),
  ember: new THREE.Color('#ff5a1e'), // 10 — accent
  emberHot: new THREE.Color(1.7, 0.7, 0.22),
  gold: new THREE.Color('#ffb15a'),
  hot: new THREE.Color(1.9, 1.25, 0.7), // sun core (HDR)

  // EMERALD ISLE — Deep Forest, lifted to read BOLDLY green on a real OLED.
  // Green is carried by emissive + body color + green fill light (works on every
  // tier incl. the iPhone's no-transmission path), not by transmission alone.
  forest: new THREE.Color('#04150d'), // deep-forest body (the locked color)
  emerald: new THREE.Color('#0c6e41'), // mid emerald — the emissive glow
  emeraldLit: new THREE.Color('#22b56b'), // lit emerald — transmission attenuation
  jade: new THREE.Color('#46e39a'), // bright jade — facet edges / opal flash
  emeraldHot: new THREE.Color(0.3, 1.85, 0.95), // HDR green core (blooms)
}

// vec3 helper for inlining into GLSL
export const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
