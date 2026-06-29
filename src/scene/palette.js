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
}

// vec3 helper for inlining into GLSL
export const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
