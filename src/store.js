import * as THREE from 'three'

/**
 * Frame-shared state, mutated outside React so useFrame can read it every frame
 * without triggering re-renders. The scroll-driven journey lives here.
 */
export const forge = {
  // Scroll progress 0..1 across the whole journey (target + damped current).
  scroll: 0,
  scrollDamped: 0,
  // Pointer in NDC (-1..1) and a damped copy for parallax / "point the sword".
  pointer: new THREE.Vector2(0, 0),
  pointerDamped: new THREE.Vector2(0, 0),
  // Time of the last CTA "strike" (for spark bursts). -10 = none.
  strikeAt: -10,
  // Which arsenal blade is hovered (act 4), -1 = none.
  hovered: -1,
  // Quality tier, set once on mount.
  quality: 'high',
  // Has the intro loader dismissed.
  ready: false,
}

// The six acts of the forging, mapped onto scroll progress.
export const ACTS = [
  { id: 'ignition', label: 'Ignition', at: 0.0 },
  { id: 'core', label: 'The Core', at: 0.08 },
  { id: 'draw', label: 'The Draw', at: 0.32 },
  { id: 'clan', label: 'The Clan', at: 0.55 },
  { id: 'arsenal', label: 'The Arsenal', at: 0.74 },
  { id: 'point', label: 'Point the Sword', at: 0.95 },
]

export function actIndexFor(p) {
  let idx = 0
  for (let i = 0; i < ACTS.length; i++) if (p >= ACTS[i].at - 0.04) idx = i
  return idx
}

// Smooth, frame-rate-independent damping.
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

// Map x from [a,b] to [0,1], clamped.
export function range(x, a, b) {
  return THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
}
