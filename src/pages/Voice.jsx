import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import { COPY } from '../brand.js'

const b = COPY.arsenal.branches.find((x) => x.tag === 'Voice')

// GW–02 Voice (Maeve). Phase-1 page on the shared shell; a specialist deepens this.
export default function Voice() {
  return (
    <PageShell kicker="GW–02 · Voice" title="Voice Agents That Never Clock Out" lede={b.body}>
      <Section eyebrow="Meet Maeve" title="Maeve answers every call." align="start">
        <p>
          She qualifies the lead, books the job, and chases the no-shows — in a voice no caller clocks
          as AI. Your script, around the clock. No missed call, no lost revenue, no voicemail graveyard.
        </p>
      </Section>

      <Section eyebrow="What you get" title="A full front desk that never sleeps." align="start">
        <div className="pg-grid">
          <div className="pg-panel"><h3>Answers 24/7</h3><p>Every call picked up — nights, weekends, the second line during the rush.</p></div>
          <div className="pg-panel"><h3>Books the job</h3><p>Qualifies, schedules, and follows up, straight into your calendar.</p></div>
          <div className="pg-panel"><h3>Sounds human</h3><p>A real voice, your script — callers never know they’re talking to AI.</p></div>
        </div>
      </Section>

      <Section eyebrow="Investment" title="A fraction of a receptionist." align="center">
        <p className="price"><s>{b.anchor}</s> <strong>{b.price}</strong> · {b.note}</p>
      </Section>
    </PageShell>
  )
}
