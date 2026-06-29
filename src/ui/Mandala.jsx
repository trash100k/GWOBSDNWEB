import { useMemo } from 'react'

/**
 * The eye of the finale whirlpool — a dense, layered Celtic calligraphy-mandala.
 *
 * Reference: a tattoo-shop calligraphy mandala (hand-lettered, black ink, radial).
 * We hit that look without a script face — per the brand: Cinzel Decorative 900,
 * letters stretched tall + packed with negative tracking so they fill the ring,
 * inked BLACK with a hard shadow and a thin ember rim so the fire-opal veins bleed
 * through the gaps. Eight concentric word-rings (curved on SVG textPaths) interleave
 * with four braided Celtic knot bands, a rim of radial ticks, and a filled central
 * boss so the eye reads solid — not hollow. Each layer counter-rotates (the whole
 * mandala also rides the finale scroll-jack) for a living interlace. Decorative —
 * aria-hidden.
 */

const PHRASES = [
  'FORGE · EXECUTE · BUILD · RUN · ',
  'AUTOMATIC EXECUTION · CLAN PROTECTED · ',
  'GAELWORX · ONE FORGE · GAELWORX · ',
  'YARDWORX · REPAIRWORX · SALESWORX · AGENTWORX · ',
  'WE BUILD WHAT WE KNOW · ',
  'CLAN PROTECTED · AUTOMATIC EXECUTION · ',
]

// a full circle path (clockwise from top) for textPaths + knot/ring guides
const circle = (r) => `M 0,${-r} A ${r},${r} 0 1,1 0,${r} A ${r},${r} 0 1,1 0,${-r} Z`

// one strand of a Celtic plait: a sinusoid woven around radius r. Two strands a
// half-period apart cross to form the over/under braid.
function strand(r, amp, lobes, phase) {
  const steps = lobes * 12
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
  // Cinzel fills each ring like inked calligraphy. Eight rings = dense interlace.
  const rings = useMemo(
    () => [
      { r: 478, fs: 34, p: 0, ls: -1.2, spin: 'a' },
      { r: 430, fs: 52, p: 1, ls: -2.6, spin: 'b' },
      { r: 376, fs: 72, p: 2, ls: -3.4, spin: 'c' },
      { r: 316, fs: 52, p: 3, ls: -2.4, spin: 'd' },
      { r: 258, fs: 64, p: 0, ls: -3, spin: 'e' },
      { r: 202, fs: 44, p: 4, ls: -2, spin: 'f' },
      { r: 150, fs: 34, p: 5, ls: -1.5, spin: 'g' },
      { r: 104, fs: 26, p: 1, ls: -1, spin: 'h' },
    ],
    [],
  )
  const knots = useMemo(
    () => [
      { r: 454, amp: 12, lobes: 40, spin: 'k1' },
      { r: 346, amp: 15, lobes: 30, spin: 'k2' },
      { r: 230, amp: 14, lobes: 24, spin: 'k3' },
      { r: 128, amp: 11, lobes: 18, spin: 'k4' },
    ],
    [],
  )
  // a rim of radial ticks — engraved density between the outer rings
  const ticks = useMemo(() => Array.from({ length: 72 }, (_, i) => (i * 360) / 72), [])

  return (
    <svg className="mandala-svg" viewBox="-500 -500 1000 1000" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="mWell">
          <stop offset="0" stopColor="#000" stopOpacity="0.78" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.52" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mBoss">
          <stop offset="0" stopColor="#E85D04" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#C1292E" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0a0708" stopOpacity="0" />
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

      {/* engraved rim ticks — short radial marks, dense around the outer band */}
      <g className="mk mk--k1 mandala-ticks">
        {ticks.map((a, i) => (
          <line key={i} className="mandala-tick" x1="0" y1="-464" x2="0" y2="-446"
            transform={`rotate(${a})`} />
        ))}
      </g>

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
                {PHRASES[rg.p].repeat(20)}
              </textPath>
            </text>
          </g>
        ))}
      </g>

      {/* central boss — fills the eye so it never reads hollow: a forge-glow core,
          concentric ink rings, and a six-lobe knot star. */}
      <g className="mandala-boss">
        <circle cx="0" cy="0" r="86" fill="url(#mBoss)" />
        <g className="mk mk--k4" filter="url(#mInk)">
          <path className="braid-glow" d={strand(54, 16, 6, 0)} />
          <path className="braid-ink" d={strand(54, 16, 6, 0)} />
          <path className="braid-ink" d={strand(54, 16, 6, Math.PI)} />
        </g>
        <circle className="boss-ring" cx="0" cy="0" r="74" />
        <circle className="boss-ring" cx="0" cy="0" r="30" />
        <circle className="boss-core" cx="0" cy="0" r="9" />
      </g>
    </svg>
  )
}
