/**
 * The A+E ignited rule, in one place.
 *
 * Brand mandate: within each WORD, only the FIRST `A` and the FIRST `E` ignite
 * (the forge fire) — not every A/E. So "Automatic Execution" → the leading A and
 * leading E glow, never "AutomAtic ExEcution". Returns the set of char indices to
 * ignite for a single word.
 */
export function igniteIndices(word) {
  const set = new Set()
  let a = false
  let e = false
  for (let i = 0; i < word.length; i++) {
    const c = word[i].toLowerCase()
    if (c === 'a' && !a) { a = true; set.add(i) }
    else if (c === 'e' && !e) { e = true; set.add(i) }
  }
  return set
}

/**
 * Renders text with its first A and first E per word "ignited" — the forge-glow
 * gradient in 900 Cinzel Decorative.
 */
export default function Ignite({ text, className = '' }) {
  const words = String(text).split(/(\s+)/) // keep whitespace as its own tokens
  return (
    <span className={className}>
      {words.map((w, wi) => {
        if (w === '' || /^\s+$/.test(w)) return <span key={wi}>{w}</span>
        const set = igniteIndices(w)
        return (
          <span key={wi}>
            {[...w].map((ch, i) =>
              set.has(i) ? (
                <span key={i} className="forge-letter">{ch}</span>
              ) : (
                <span key={i}>{ch}</span>
              )
            )}
          </span>
        )
      })}
    </span>
  )
}
