/**
 * Ambient atmosphere — the warm haze behind the copy, the shared forge-light
 * that follows the pointer, and a fine grain. No particles, no mist: the
 * obsidian fire-opal veins are the effect.
 */
export default function Atmosphere() {
  return (
    <>
      <div className="haze" aria-hidden="true" />
      <div className="forge-light" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
