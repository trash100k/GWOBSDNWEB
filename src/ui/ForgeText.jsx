import { Fragment } from 'react'
import { useReveal } from '../hooks.js'
import { igniteIndices } from './Ignite.jsx'

/**
 * Heading that forges in character-by-character (etch + unblur) when it enters
 * view. Words stay intact (no mid-word breaks). When `ignite` is set, the first A
 * and first E of each word carry the forge-glow (the brand's A+E ignited mandate).
 */
export default function ForgeText({ as = 'h2', text, className = '', delay = 0, ignite = false }) {
  const Tag = as
  const [ref, shown] = useReveal()
  const words = String(text).split(' ')
  let ci = 0
  return (
    <Tag ref={ref} className={`forge-text ${shown ? 'shown' : ''} ${className}`}>
      {words.map((word, wi) => {
        const lit = ignite ? igniteIndices(word) : null
        return (
          <Fragment key={wi}>
            <span className="word">
              {[...word].map((ch, i) => (
                <span key={ci} className={lit && lit.has(i) ? 'forge-letter' : undefined} style={{ '--i': ci++, '--d': `${delay}ms` }}>
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : ''}
          </Fragment>
        )
      })}
    </Tag>
  )
}
