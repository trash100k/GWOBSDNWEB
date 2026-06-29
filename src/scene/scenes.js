/**
 * Per-route scene presets — each page is its own "wonderland" as a distinct
 * configuration of the ONE obsidian forge (a single renderer, route-swapped via
 * damping). The home preset matches the original tuning exactly so `/` never
 * changes; the others re-temper the veins + re-frame the camera so each page
 * reads as its own world without a second WebGL context.
 *
 *  veinScale — coarseness of the fire-opal veins (low = broad rivers, high = dense)
 *  veinGlow  — base emissive of the veins
 *  irid      — play-of-color strength
 *  camZ      — dolly distance
 *  rotY      — orbit angle (the forge turns to face the page)
 *  rotX      — pitch
 */
export const SCENES = {
  '/':            { veinScale: 1.8, veinGlow: 0.6, irid: 1.35, camZ: 6.4, rotY: 0.0, rotX: -0.08 },
  '/software':    { veinScale: 2.7, veinGlow: 0.8, irid: 1.0, camZ: 5.7, rotY: 0.26, rotX: -0.05 }, // tight circuitry
  '/voice':       { veinScale: 1.2, veinGlow: 1.0, irid: 1.65, camZ: 6.0, rotY: -0.24, rotX: -0.11 }, // soft waveforms
  '/automations': { veinScale: 3.2, veinGlow: 0.7, irid: 0.95, camZ: 5.3, rotY: 0.34, rotX: 0.0 },   // dense machinery
  '/web':         { veinScale: 1.6, veinGlow: 1.25, irid: 1.95, camZ: 6.6, rotY: 0.12, rotX: -0.13 }, // vivid, cinematic
  '/work':        { veinScale: 2.1, veinGlow: 0.9, irid: 1.3, camZ: 6.0, rotY: -0.3, rotX: -0.06 },
  '/pricing':     { veinScale: 1.45, veinGlow: 0.7, irid: 1.1, camZ: 6.2, rotY: 0.16, rotX: -0.07 },
  '/about':       { veinScale: 1.85, veinGlow: 0.6, irid: 1.2, camZ: 6.4, rotY: -0.16, rotX: -0.08 },
  '/contact':     { veinScale: 1.5, veinGlow: 1.1, irid: 1.55, camZ: 5.8, rotY: 0.22, rotX: -0.05 },
}

export const sceneFor = (path) => SCENES[path] || SCENES['/']
