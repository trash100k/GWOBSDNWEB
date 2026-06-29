import { useMemo } from 'react'

/**
 * The eye of the finale whirlpool — a dense, layered Celtic calligraphy-mandala.
 *
 * Reference: a tattoo-shop calligraphy mandala (hand-lettered, black ink, radial).
 * We hit that look without a script face — per the brand: Cinzel Decorative 900,
 * letters stretched tall + packed with negative tracking so they fill the ring,
 * inked BLACK with a hard shadow and a thin ember rim so the fire-opal veins bleed
 * through the gaps. Concentric word-rings (curved on SVG textPaths) interleave with
 * braided Celtic knot bands; each layer counter-rotates (the whole mandala also
 * rides the finale scroll-jack) for a living interlace. Decorative — aria-hidden.
 */

const PHRASES = [
  'FORGE · EXECUTE · BUILD · RUN · ',
  'AUTOMATIC EXECUTION · CLAN PROTECTED · ',
  'GAELWORX · ONE FORGE · GAELWORX · ',
  'YARDWORX · REPAIRWORX · SALESWORX · AGENTWORX · ',
  'WE BUILD WHAT WE KNOW · ',
  'CLAN PROTECTED · AUTOMATIC EXECUTION · ',
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
  // word rings: radius · font size (tall) · phrase · letter-spacing (negative,
  // packed) · spin class. Sizes are big + tracking is tight so the 900-weight
  // Cinzel fills each ring like inked calligraphy.
  const rings = useMemo(
    () => [
      { r: 456, fs: 38, p: 0, ls: -1.5, spin: 'a' },
      { r: 398, fs: 60, p: 1, ls: -3, spin: 'b' },
      { r: 332, fs: 78, p: 2, ls: -3.5, spin: 'c' },
      { r: 268, fs: 56, p: 3, ls: -2.5, spin: 'd' },
      { r: 204, fs: 42, p: 5, ls: -2, spin: 'e' },
      { r: 142, fs: 30, p: 4, ls: -1.5, spin: 'f' },
    ],
    [],
  )
  const knots = useMemo(
    () => [
      { r: 426, amp: 13, lobes: 34, spin: 'k1' },
      { r: 300, amp: 16, lobes: 26, spin: 'k2' },
      { r: 172, amp: 13, lobes: 20, spin: 'k3' },
    ],
    [],
  )

  return (
    <svg className="mandala-svg" viewBox="-500 -500 1000 1000" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="mWell">
          <stop offset="0" stopColor="#000" stopOpacity="0.74" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.52" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* hard ink shadow — crisp offset, no soft blur (carved tattoo relief) */}
        <filter id="mInk" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="3" dy="4" stdDeviation="0.3" floodColor="#000" floodOpacity="0.95" />
        </filter>
        {rings.map((rg, i) => (
          <path key={i} id={`mp${i}`} d={circle(rg.r)} />
        ))}
      </defs>

      {/* deep black seat — the drain the problems pour into */}
      <circle className="mandala-well" cx="0" cy="0" r="500" fill="url(#mWell)" />

      {/* braided Celtic knot bands — black rope, fire bleeding at the edges */}
      <g className="mandala-knots" filter="url(#mInk)">
        {knots.map((k, i) => (
          <g key={i} className={`mk mk--${k.spin}`}>
            <path className="braid-glow" d={strand(k.r, k.amp, k.lobes, 0)} />
            <path className="braid-glow" d={strand(k.r, k.amp, k.lobes, Math.PI)} />
            <path className="braid-ink" d={strand(k.r, k.amp, k.lobes, 0)} />
            <path className="braid-ink" d={strand(k.r, k.amp, k.lobes, Math.PI)} />
          </g>
        ))}
      </g>

      {/* concentric calligraphy rings — black ink, ember rim, hard shadow */}
      <g className="mandala-words" filter="url(#mInk)">
        {rings.map((rg, i) => (
          <g key={i} className={`mw mw--${rg.spin}`}>
            <text className="mandala-ring-text" fontSize={rg.fs} letterSpacing={rg.ls}>
              <textPath href={`#mp${i}`} startOffset="0">
                {PHRASES[rg.p].repeat(18)}
              </textPath>
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
