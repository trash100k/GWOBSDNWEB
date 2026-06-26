import { Fragment } from 'react'
import { useReveal } from '../hooks.js'

/**
 * Heading that forges in character-by-character (etch + unblur) when it enters
 * view. Characters are grouped into words (nowrap) so lines never break
 * mid-word; the breakable space lives between word spans.
 */
export default function ForgeText({ as = 'h2', text, className = '', delay = 0 }) {
  const Tag = as
  const [ref, shown] = useReveal()
  const words = String(text).split(' ')
  let ci = 0 // running char index for the stagger across the whole string
  return (
    <Tag ref={ref} className={`forge-text ${shown ? 'shown' : ''} ${className}`}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className="word">
            {[...word].map((c) => (
              <span key={ci} style={{ '--i': ci++, '--d': `${delay}ms` }}>
                {c}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  )
}
