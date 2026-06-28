/**
 * Renders text with every A and E "ignited" — the forge-glow gradient in 900
 * Cinzel Decorative. The brand mandate for the GAELWORX wordmark + "Automatic
 * Execution": the A and E are the continuous fire of the forge.
 */
export default function Ignite({ text, className = '' }) {
  return (
    <span className={className}>
      {[...String(text)].map((ch, i) => {
        const up = ch.toUpperCase()
        return up === 'A' || up === 'E' ? (
          <span key={i} className="forge-letter">{ch}</span>
        ) : (
          <span key={i}>{ch}</span>
        )
      })}
    </span>
  )
}
