import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Emerald-cut gem geometry — an octagonal step cut: a flat table, a beveled crown,
 * and a pavilion tapering to a small culet. Flat-shaded, so the facets catch hard
 * directional light as the emerald "hall of mirrors". The extra height segments give
 * enough vertices for the rough→cut morph (noise displacement) to read.
 */
export function makeEmeraldCut() {
  const crown = new THREE.CylinderGeometry(0.62, 0.86, 0.34, 8, 2) // table → girdle
  crown.translate(0, 0.17, 0)                                       // girdle at y=0
  const pav = new THREE.CylinderGeometry(0.86, 0.12, 0.92, 8, 3)    // girdle → culet
  pav.translate(0, -0.46, 0)
  const g = mergeGeometries([crown, pav], false)
  g.rotateY(Math.PI / 8) // a flat facet faces the camera (emerald cut shows a face)
  g.center()
  g.computeVertexNormals()
  return g
}
