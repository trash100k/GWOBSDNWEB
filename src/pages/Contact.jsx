import { useState } from 'react'
import PageShell from '../ui/PageShell.jsx'
import Section from '../ui/Section.jsx'
import BrandText from '../ui/BrandText.jsx'
import { COPY } from '../brand.js'

// Contact — the conversion endpoint. A premium, effortless lead-capture form on
// the shared shell. Client-side validation + an on-brand "forge is lit" success
// state. Backend wiring is Phase 2 (see TODO + the mailto fallback below).

const SERVICES = [
  ['', 'Point me at the right branch…'],
  ['software', 'Software — a platform that runs it all'],
  ['voice', 'Voice — Maeve, the front desk that never clocks out'],
  ['automations', 'Automations — kill the busywork'],
  ['web', 'Web — a site that books the job'],
  ['unsure', 'Not sure yet — point me'],
]

const EMPTY = { name: '', business: '', email: '', phone: '', service: '', bottleneck: '' }

// The forge's intake address — used for the Phase-1 mailto fallback.
const FORGE_EMAIL = 'forge@gaelworx.com'

function validate(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Name the smith we’re talking to.'
  if (!form.business.trim()) e.business = 'What do we call the operation?'
  if (!form.email.trim()) e.email = 'We need a line back to you.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'That email won’t deliver — check it.'
  if (!form.service) e.service = 'Pick the branch you need.'
  if (!form.bottleneck.trim()) e.bottleneck = 'Name the bottleneck — that’s the whole job.'
  return e
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const set = (key) => (ev) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length) {
      // focus the first field in error so the form stays effortless
      const first = ['name', 'business', 'email', 'service', 'bottleneck'].find((k) => e[k])
      if (first) document.getElementById(`pgc-${first}`)?.focus()
      return
    }

    // TODO Phase 2: POST to lead store (Supabase / Attio / n8n) + nurture pipeline.
    // Phase-1 fallback — open a pre-filled mail draft so no lead is ever lost.
    const svc = SERVICES.find(([v]) => v === form.service)?.[1] || form.service
    const body = [
      `Name: ${form.name}`,
      `Business: ${form.business}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || '—'}`,
      `Service: ${svc}`,
      '',
      'The bottleneck:',
      form.bottleneck,
    ].join('\n')
    try {
      window.location.href =
        `mailto:${FORGE_EMAIL}?subject=${encodeURIComponent(`Forge intake — ${form.business}`)}` +
        `&body=${encodeURIComponent(body)}`
    } catch {
      /* mailto unavailable — success state still confirms the request was captured */
    }
    setSent(true)
  }

  return (
    <PageShell
      kicker="07 · Start the Forge"
      title="Name the Bottleneck"
      lede={COPY.point.body}
      cta={false}
    >
      <Section align="start" className="pg-contact-shell">
        <div className="pg-contact-grid">
          {/* LEFT RAIL — the promise + the terms, so the form reads as effortless */}
          <aside className="pg-contact-rail">
            <span className="pg-eyebrow">The Intake</span>
            <h2 className="pg-contact-rail-head">
              <BrandText text="One message. We bring the system that ends the leak." />
            </h2>
            <p className="pg-contact-rail-body">
              No discovery-call theater. No form that drops into a void. Name the
              bottleneck — we name the build, the price, and the day it ships back fixed.
            </p>

            <ul className="pg-contact-promises">
              <li>
                <ForgeTick />
                <span>Read by the smiths who build it — never a queue, never a bot.</span>
              </li>
              <li>
                <ForgeTick />
                <span>A real answer in 24 hours: fixed scope, fixed price.</span>
              </li>
              <li>
                <ForgeTick />
                <span>No obligation. No pressure. No sales theater.</span>
              </li>
            </ul>

            <div className="pg-contact-avail">
              <i aria-hidden="true" className="pg-contact-pulse" />
              <span>{COPY.point.avail}</span>
            </div>
          </aside>

          {/* RIGHT — the lead form, or the lit-forge confirmation */}
          <div className="pg-contact-panel">
            {sent ? (
              <Success business={form.business} />
            ) : (
              <form className="pg-contact-form" onSubmit={onSubmit} noValidate>
                <Field
                  id="name"
                  label="Your Name"
                  required
                  value={form.name}
                  onChange={set('name')}
                  error={errors.name}
                  placeholder="Who’s at the anvil?"
                  autoComplete="name"
                />
                <Field
                  id="business"
                  label="Business"
                  required
                  value={form.business}
                  onChange={set('business')}
                  error={errors.business}
                  placeholder="The operation we’re arming"
                  autoComplete="organization"
                />

                <div className="pg-contact-row">
                  <Field
                    id="email"
                    type="email"
                    label="Email"
                    required
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                    placeholder="you@business.com"
                    autoComplete="email"
                  />
                  <Field
                    id="phone"
                    type="tel"
                    label="Phone"
                    optional
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="(555) 000-0000"
                    autoComplete="tel"
                  />
                </div>

                <label className="pg-contact-field" htmlFor="pgc-service">
                  <span className="pg-contact-label">
                    What You Need <em className="pg-contact-req">*</em>
                  </span>
                  <div className="pg-contact-select-wrap">
                    <select
                      id="pgc-service"
                      className={`pg-contact-input pg-contact-select${errors.service ? ' is-error' : ''}`}
                      value={form.service}
                      onChange={set('service')}
                      aria-invalid={errors.service ? 'true' : undefined}
                    >
                      {SERVICES.map(([v, label]) => (
                        <option key={v || 'none'} value={v} disabled={v === ''}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Chevron />
                  </div>
                  {errors.service && <span className="pg-contact-error">{errors.service}</span>}
                </label>

                <label className="pg-contact-field" htmlFor="pgc-bottleneck">
                  <span className="pg-contact-label">
                    The bottleneck <em className="pg-contact-req">*</em>
                  </span>
                  <textarea
                    id="pgc-bottleneck"
                    className={`pg-contact-input pg-contact-textarea${errors.bottleneck ? ' is-error' : ''}`}
                    value={form.bottleneck}
                    onChange={set('bottleneck')}
                    rows={5}
                    placeholder="Missed calls? Drowning in busywork? Six apps and one mess? Tell us what it’s costing you — that’s the whole job."
                    aria-invalid={errors.bottleneck ? 'true' : undefined}
                  />
                  {errors.bottleneck && <span className="pg-contact-error">{errors.bottleneck}</span>}
                </label>

                <button type="submit" className="cta cta--solid pg-contact-submit">
                  <span>Send It — Start the Build</span>
                </button>

                <p className="pg-contact-fineprint">
                  Fixed scope. Fixed price. We carry the risk — you pay when it executes. · Continental US · 7 Days
                  <br />
                  We answer in 24 hours. Your details stay in the clan — never sold, never spammed.
                </p>
              </form>
            )}
          </div>
        </div>
      </Section>

      <style>{STYLE}</style>
    </PageShell>
  )
}

/* ── field primitive ─────────────────────────────────────────────────────── */
function Field({ id, label, value, onChange, error, type = 'text', required, optional, ...rest }) {
  return (
    <label className="pg-contact-field" htmlFor={`pgc-${id}`}>
      <span className="pg-contact-label">
        {label}{' '}
        {required && <em className="pg-contact-req">*</em>}
        {optional && <em className="pg-contact-opt">optional</em>}
      </span>
      <input
        id={`pgc-${id}`}
        type={type}
        className={`pg-contact-input${error ? ' is-error' : ''}`}
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {error && <span className="pg-contact-error">{error}</span>}
    </label>
  )
}

/* ── the lit-forge success state ─────────────────────────────────────────── */
function Success({ business }) {
  return (
    <div className="pg-contact-success" role="status" aria-live="polite">
      <Anvil />
      <h2 className="pg-contact-success-head flame">The forge is lit.</h2>
      <p className="pg-contact-success-body">
        We have it{business ? <> — and we know <strong>{business}</strong></> : null}. A real answer
        lands inside 24 hours: the build, the price, and the day it ships. The bottleneck’s cost you
        long enough. We start now.
      </p>
      <div className="pg-contact-avail pg-contact-avail--center">
        <i aria-hidden="true" className="pg-contact-pulse" />
        <span>{COPY.point.avail}</span>
      </div>
    </div>
  )
}

/* ── bespoke on-brand iconography (1.5px monolinear, ember on active) ──────── */
function ForgeTick() {
  return (
    <svg className="pg-contact-tick" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 10.5 L8 15.5 L17 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg className="pg-contact-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 4.5 L7 9.5 L12 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function Anvil() {
  // A forged anvil struck with sparks — the mark of "lit".
  return (
    <svg
      className="pg-contact-anvil"
      width="72"
      height="72"
      viewBox="0 0 72 72"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M16 38 H56 L52 46 H44 V52 H28 V46 H20 Z" />
      <path d="M16 38 L12 32 H40 V38" />
      <path d="M40 32 L56 30 L52 36 H40" />
      <path d="M28 52 H44" />
      {/* sparks off the horn */}
      <path d="M58 24 L62 20" strokeLinecap="round" />
      <path d="M54 20 L56 15" strokeLinecap="round" />
      <path d="M62 28 L67 26" strokeLinecap="round" />
    </svg>
  )
}

/* ── one namespaced style block (selectors prefixed .pg-contact-) ─────────── */
const STYLE = `
.pg-contact-shell{padding-top:clamp(20px,3vh,40px);}
.pg-contact-grid{display:grid; grid-template-columns:0.82fr 1.18fr; gap:0;
  border:1px solid rgba(141,153,174,0.25); box-shadow:8px 8px 0 rgba(0,0,0,0.55);
  background:rgba(11,12,16,0.55);}

/* LEFT RAIL — the promise */
.pg-contact-rail{padding:clamp(28px,3.4vw,48px);
  border-right:1px solid rgba(141,153,174,0.2);
  background:linear-gradient(180deg, rgba(31,40,51,0.42), rgba(11,12,16,0.32));
  position:relative;}
/* L2 forge-light — faint inner glow on the rail */
.pg-contact-rail::after{content:""; position:absolute; inset:0; pointer-events:none;
  box-shadow:inset 0 0 60px rgba(227,74,39,0.06);}
.pg-contact-rail-head{margin:0 0 16px; font-family:var(--gw-headline); font-weight:800;
  color:var(--gw-bone); font-size:clamp(1.35rem,2.4vw,1.9rem); line-height:1.1;}
.pg-contact-rail-body{margin:0; color:var(--gw-steel);
  font-size:clamp(1rem,1.4vw,1.12rem); line-height:1.6; max-width:38ch;}

.pg-contact-promises{list-style:none; margin:clamp(26px,3vw,38px) 0 0; padding:0;
  display:flex; flex-direction:column; gap:14px;}
.pg-contact-promises li{display:flex; align-items:flex-start; gap:12px;
  color:var(--gw-bone); font-size:clamp(0.95rem,1.3vw,1.04rem); line-height:1.4;}
.pg-contact-tick{flex:0 0 auto; margin-top:1px; color:var(--gw-ember);
  filter:drop-shadow(0 0 6px rgba(232,93,4,0.45));}

.pg-contact-avail{display:inline-flex; align-items:center; gap:10px;
  margin-top:clamp(28px,3.4vw,40px); font-size:10.5px; letter-spacing:0.3em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);}
.pg-contact-avail--center{justify-content:center; margin-top:clamp(22px,3vh,30px);}
.pg-contact-pulse{flex:0 0 auto; width:8px; height:8px; background:var(--gw-ember);
  box-shadow:0 0 10px var(--gw-ember); animation:pgcPulse 2.2s ease-in-out infinite;}
@keyframes pgcPulse{0%,100%{opacity:1; transform:scale(1);}50%{opacity:0.4; transform:scale(0.7);}}

/* RIGHT — the form panel */
.pg-contact-panel{padding:clamp(28px,3.4vw,48px); position:relative;}
.pg-contact-form{display:flex; flex-direction:column; gap:clamp(16px,2vw,22px);}
.pg-contact-row{display:grid; grid-template-columns:1fr 1fr; gap:clamp(14px,1.6vw,20px);}

.pg-contact-field{display:flex; flex-direction:column; gap:8px;}
.pg-contact-label{font-family:var(--gw-sans); font-weight:700; font-size:12px;
  letter-spacing:0.16em; text-transform:uppercase; color:var(--gw-bone);
  display:flex; align-items:baseline; gap:8px;}
.pg-contact-req{font-style:normal; color:var(--gw-ember); font-size:1em;}
.pg-contact-opt{font-style:normal; color:var(--gw-steel); font-weight:600;
  font-size:9.5px; letter-spacing:0.18em;}

.pg-contact-input{width:100%; font-family:var(--gw-sans); font-size:1rem; line-height:1.4;
  color:var(--gw-bone); background:rgba(5,6,8,0.6); border:1px solid rgba(141,153,174,0.3);
  border-radius:0; padding:14px 15px; outline:none; -webkit-appearance:none; appearance:none;
  transition:border-color .25s var(--ease), box-shadow .35s var(--ease), background .25s var(--ease);}
.pg-contact-input::placeholder{color:rgba(141,153,174,0.55);}
.pg-contact-input:hover{border-color:rgba(141,153,174,0.55);}
/* ember focus state — the molten edge + L3 ember glow */
.pg-contact-input:focus{border-color:var(--gw-ember); background:rgba(5,6,8,0.85);
  box-shadow:0 0 0 1px var(--gw-ember), 0 0 22px -4px rgba(232,93,4,0.55);}
.pg-contact-input.is-error{border-color:var(--gw-forge);
  box-shadow:0 0 0 1px rgba(193,41,46,0.6);}
.pg-contact-input.is-error:focus{border-color:var(--gw-forge);
  box-shadow:0 0 0 1px var(--gw-forge), 0 0 22px -4px rgba(193,41,46,0.55);}

.pg-contact-textarea{resize:vertical; min-height:120px;}

/* select — strip native chrome, drop our forged chevron */
.pg-contact-select-wrap{position:relative; display:block;}
.pg-contact-select{padding-right:42px; cursor:pointer;}
.pg-contact-select:invalid,.pg-contact-select option[value=""]{color:rgba(141,153,174,0.55);}
.pg-contact-select option{color:var(--gw-bone); background:#0B0C10;}
.pg-contact-chevron{position:absolute; top:50%; right:15px; transform:translateY(-50%);
  color:var(--gw-steel); pointer-events:none; transition:color .25s var(--ease);}
.pg-contact-select:focus + .pg-contact-chevron{color:var(--gw-ember);}

.pg-contact-error{font-size:12px; line-height:1.3; letter-spacing:0.01em; font-weight:600;
  color:#ff6a5a;}

.pg-contact-submit{align-self:stretch; justify-content:center; margin-top:6px;
  width:100%; padding:18px 30px;}

.pg-contact-fineprint{margin:2px 0 0; font-size:12px; line-height:1.5;
  color:rgba(141,153,174,0.72); letter-spacing:0.01em;}

/* ── success state — the forge is lit ─────────────────────────────────────── */
.pg-contact-success{display:flex; flex-direction:column; align-items:center;
  text-align:center; gap:0; padding:clamp(16px,3vh,42px) clamp(4px,2vw,20px);
  animation:pgcReveal .7s var(--ease) both;}
@keyframes pgcReveal{from{opacity:0; filter:blur(10px); transform:translateY(10px);}
  to{opacity:1; filter:blur(0); transform:none;}}
.pg-contact-anvil{color:var(--gw-ember); margin-bottom:clamp(18px,2.4vh,26px);
  filter:drop-shadow(0 0 16px rgba(232,93,4,0.5));}
.pg-contact-success-head{margin:0 0 14px; font-family:var(--gw-display); font-weight:900;
  text-transform:uppercase; font-size:clamp(1.9rem,5vw,2.8rem); letter-spacing:0.02em;
  line-height:1.05;}
.pg-contact-success-body{margin:0 auto; max-width:42ch; color:var(--gw-steel);
  font-size:clamp(1.02rem,1.5vw,1.16rem); line-height:1.6;}
.pg-contact-success-body strong{color:var(--gw-bone); font-weight:700;}

/* ── responsive — stack the rail above the form on phones ─────────────────── */
@media (max-width:760px){
  .pg-contact-grid{grid-template-columns:1fr; box-shadow:6px 6px 0 rgba(0,0,0,0.55);}
  .pg-contact-rail{border-right:0; border-bottom:1px solid rgba(141,153,174,0.2);}
  .pg-contact-row{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .pg-contact-pulse{animation:none;}
  .pg-contact-success{animation:none;}
}
`
