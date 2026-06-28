import Ignite from './Ignite.jsx'

/**
 * Renders body copy with GAELWORX brand proper-nouns auto-ignited (their A/E get
 * the forge-glow). Brand mandate: Automatic Execution, GAELWORX, Maeve, and the
 * -Worx platforms always carry the A+E logic, wherever they appear.
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
          <Ignite key={i} text={p} className="brand-term" />
        ) : (
          <span key={i}>{p}</span>
        )
      })}
    </span>
  )
}
