import * as THREE from 'three'

/**
 * A procedural CUT GEM, built for a flat-shaded obsidian jewel:
 *   table (flat top)  →  crown facets  →  girdle (widest ring)  →  pavilion  →  culet (point)
 *
 * Non-indexed (each triangle gets its own 3 vertices) so `computeVertexNormals` yields TRUE
 * flat facets — every triangle reads as a discrete polished plane. Winding is auto-corrected
 * outward (flip any triangle whose face normal points back toward the centroid). `sides` sets
 * the facet count: ~8 = an octagonal step-cut, ~14–16 = a rounder brilliant.
 */
export function buildGem({
  sides = 14,
  girdle = 1.0, // widest radius (the girdle ring)
  tableR = 0.5, // flat-top radius
  crownH = 0.42, // table height above the girdle
  pavH = 1.18, // culet depth below the girdle
  crownTwist = 0.5, // offset the crown ring by half a facet → brilliant-style zig-zag crown
  subdiv = 0, // midpoint-subdivide each facet N× — coplanar (so it still reads as ONE clean
  // facet) but gives enough vertices for a noise displacement to lump it into rough rock.
} = {}) {
  const ringAt = (r, y, twist = 0) =>
    Array.from({ length: sides }, (_, i) => {
      const a = ((i + twist) / sides) * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    })

  const top = ringAt(tableR, crownH, crownTwist) // table ring (offset for the crown zig-zag)
  const gir = ringAt(girdle, 0, 0) // girdle ring
  const tableC = new THREE.Vector3(0, crownH, 0)
  const culet = new THREE.Vector3(0, -pavH, 0)

  const tris = []
  const tri = (a, b, c) => tris.push(a, b, c)

  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides
    // TABLE — fan from the centre to the offset top ring
    tri(tableC, top[i], top[j])
    // CROWN — each girdle vertex rises to two table verts (the kite/star zig-zag)
    tri(gir[i], top[i], gir[j])
    tri(top[i], top[j], gir[j])
    // PAVILION — girdle edge down to the culet
    tri(gir[i], gir[j], culet)
  }

  // midpoint subdivision — split every triangle into 4 coplanar children (so the
  // facet still looks like ONE plane until a vertex displacement lumps it). Shared
  // edges/corners get identical midpoints, so the mesh stays watertight when morphed.
  const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5)
  for (let s = 0; s < subdiv; s++) {
    const out = []
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t]
      const b = tris[t + 1]
      const c = tris[t + 2]
      const ab2 = mid(a, b)
      const bc2 = mid(b, c)
      const ca2 = mid(c, a)
      out.push(a, ab2, ca2, ab2, b, bc2, ca2, bc2, c, ab2, bc2, ca2)
    }
    tris.length = 0
    tris.push(...out)
  }

  // ensure every face winds OUTWARD (so computeVertexNormals lights them right)
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()
  const cen = new THREE.Vector3()
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t]
    const b = tris[t + 1]
    const c = tris[t + 2]
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac)
    cen.copy(a).add(b).add(c).multiplyScalar(1 / 3)
    if (n.dot(cen) < 0) {
      tris[t + 1] = c
      tris[t + 2] = b // flip
    }
  }

  const arr = new Float32Array(tris.length * 3)
  for (let k = 0; k < tris.length; k++) {
    arr[k * 3] = tris[k].x
    arr[k * 3 + 1] = tris[k].y
    arr[k * 3 + 2] = tris[k].z
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}
