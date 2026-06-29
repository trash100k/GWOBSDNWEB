import { useMemo } from 'react'

/**
 * The eye of the finale whirlpool — a dense, layered Celtic word-mandala.
 *
 * Built like tattoo-script knotwork: many concentric rings of Cinzel words
 * curved onto SVG textPaths, interleaved with braided Celtic knot bands, all
 * seated in a deep black-shadow well so it reads inked + carved. Each ring
 * counter-rotates at its own rate (the whole mandala also spins via the finale
 * scroll-jack) for a living, cinematic interlace. Decorative — aria-hidden.
 */

const PHRASES = [
  'FORGE · EXECUTE · BUILD · RUN · ',
  'AUTOMATIC EXECUTION · CLAN PROTECTED · ',
  'GAELWORX · ONE FORGE · GAELWORX · ',
  'YARDWORX · REPAIRWORX · SALESWORX · AGENTWORX · ',
  'WE BUILD WHAT WE KNOW · ',
]

// a full circle path (clockwise from top) for textPaths + knot guides
const circle = (r) => `M 0,${-r} A ${r},${r} 0 1,1 0,${r} A ${r},${r} 0 1,1 0,${-r} Z`

// one strand of a Celtic plait: a sinusoid woven around radius r. Two strands a
// half-period apart cross to form the over/under braid.
function strand(r, amp, lobes, phase) {
  const steps = lobes * 10
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const rr = r + amp * Math.sin(lobes * t + phase)
    const x = (Math.cos(t) * rr).toFixed(1)
    const y = (Math.sin(t) * rr).toFixed(1)
    d += (i === 0 ? 'M' : 'L') + x + ',' + y + ' '
  }
  return d
}

export default function Mandala() {
  // word rings: radius · font size · phrase · letter-spacing · spin class
  const rings = useMemo(
    () => [
      { r: 452, fs: 30, p: 0, ls: 9, spin: 'a' },
      { r: 388, fs: 48, p: 1, ls: 6, spin: 'b' },
      { r: 300, fs: 66, p: 2, ls: 4, spin: 'c' },
      { r: 212, fs: 40, p: 3, ls: 6, spin: 'd' },
      { r: 150, fs: 26, p: 4, ls: 9, spin: 'e' },
    ],
    [],
  )
  const knots = useMemo(
    () => [
      { r: 420, amp: 13, lobes: 32, spin: 'k1' },
      { r: 256, amp: 15, lobes: 24, spin: 'k2' },
      { r: 104, amp: 10, lobes: 16, spin: 'k3' },
    ],
    [],
  )

  return (
    <svg className="mandala-svg" viewBox="-500 -500 1000 1000" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="mEmber" gradientUnits="userSpaceOnUse" x1="0" y1="-480" x2="0" y2="480">
          <stop offset="0" stopColor="#FFB15A" />
          <stop offset="0.34" stopColor="#FF8A3C" />
          <stop offset="0.62" stopColor="#E85D04" />
          <stop offset="1" stopColor="#C1292E" />
        </linearGradient>
        <radialGradient id="mWell">
          <stop offset="0" stopColor="#000" stopOpacity="0.72" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.5" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {rings.map((rg, i) => (
          <path key={i} id={`mp${i}`} d={circle(rg.r)} />
        ))}
      </defs>

      {/* deep black seat — the drain the problems pour into */}
      <circle className="mandala-well" cx="0" cy="0" r="500" fill="url(#mWell)" />

      {/* braided Celtic knot bands */}
      <g className="mandala-knots">
        {knots.map((k, i) => (
          <g key={i} className={`mk mk--${k.spin}`}>
            <path className="braid braid--shadow" d={strand(k.r, k.amp, k.lobes, 0)} />
            <path className="braid braid--shadow" d={strand(k.r, k.amp, k.lobes, Math.PI)} />
            <path className="braid" d={strand(k.r, k.amp, k.lobes, 0)} />
            <path className="braid" d={strand(k.r, k.amp, k.lobes, Math.PI)} />
          </g>
        ))}
      </g>

      {/* concentric word rings */}
      <g className="mandala-words">
        {rings.map((rg, i) => (
          <g key={i} className={`mw mw--${rg.spin}`}>
            <text className="mandala-ring-text" fontSize={rg.fs} letterSpacing={rg.ls}>
              <textPath href={`#mp${i}`} startOffset="0">
                {PHRASES[rg.p].repeat(16)}
              </textPath>
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
