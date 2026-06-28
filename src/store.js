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
  // Time of the last "strike" — a headline arriving / the carousel turning / the
  // CTA. Drives a vein surge in the obsidian so the background reacts to the text.
  strikeAt: -10,
  // Dissolve emitter: where receding copy sheds embers into the scene, and how
  // hard. x,y in viewport fraction (0..1, y down); amt 0..1. Read by Atmosphere.
  emit: { x: 0.5, y: 0.4, amt: 0 },
  // Which arsenal branch is in focus (carousel), -1 = none.
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
