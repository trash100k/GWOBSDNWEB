/**
 * Renders body copy with GAELWORX brand proper-nouns marked for subtle emphasis.
 *
 * A+E ignite is a DISPLAY/WORDMARK rule only. Cinzel Decorative has no lowercase
 * glyphs, so igniting the first a/e inside lowercase running sentences forces
 * capital-height letters and produces ransom-note text (YArdWorx, MAEve). So in
 * body prose we render brand terms as plain, legible words in the body font —
 * just wrapped in `.brand-term` for a touch of weight so the name reads as a unit.
 * The A+E ignite still fires in all-caps display via <Ignite> (Nav/Loader) and
 * ForgeText's `ignite` prop (the hero headline).
 */
const TERMS = [
  'Automatic Execution',
  'GAELWORX',
  'YardWorx',
  'RepairWorx',
  'SalesWorx',
  'AgentWorx',
  'Maeve',
]
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const RE = new RegExp('(' + TERMS.map(esc).join('|') + ')', 'gi')

export default function BrandText({ text, className = '' }) {
  const parts = String(text).split(RE)
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (!p) return null
        const isTerm = TERMS.some((t) => t.toLowerCase() === p.toLowerCase())
        return isTerm ? (
          <span key={i} className="brand-term">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      })}
    </span>
  )
}
