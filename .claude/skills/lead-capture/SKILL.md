---
name: lead-capture
description: >-
  Turn GAELWORX's dead CTAs into a real conversion path — form → POST endpoint →
  store (Supabase/Attio) → confirmation email → conversion event. Use when wiring
  Phase 2 (BUILD_PLAN 2.1–2.4): building the lead backend, making a CTA actually
  do something, or auditing the site for buttons that go nowhere. Encodes the hard
  rule "every CTA wires to a real action — kill the `strike()` handlers," the
  static-SPA constraint (no Node server; the endpoint is serverless/edge), where
  each piece plugs into the existing files, and the owner decisions to confirm first.
---

# lead-capture — make the buttons actually convert

This is forward-looking: the backend isn't built yet. But the seams are real and named
below — ground every change in them. Research lives in
`docs/research/lead-capture-and-nurture.md` (form science + the Supabase+Attio stack
"Decision C"); plan state in `docs/BUILD_PLAN.md` Phase 2.

## The hard principle (the thing this skill exists for)
**Every CTA wires to a real action — form, booking, `tel:`, or `mailto:`. No button goes nowhere.**
Two are currently DEAD — they only nudge the 3D forge and never start a conversation:
- **Home hero CTA** — `src/ui/Content.jsx:307`, `onClick={() => { strike(); scrollToEnd() }}`
  (just scrolls to the finale).
- **Finale CTA** — `src/ui/Content.jsx:418`, `onClick={strike}` ("Start the Forge", goes nowhere).
Both call `strike()` (`Content.jsx:9–11`), which only sets `forge.strikeAt`. **Kill that as a CTA
handler** — route these two to `/contact` (`react-router-dom` `navigate`/`Link`, as the rest of the
site already does) or open the booking link. Keep the strike as a *scene* effect if you like, but it
is NOT a conversion action. (Every page-level CTA is already correct — `PageShell.jsx:41`,
`Pricing.jsx:214`, `Software.jsx:285`, `Voice.jsx:272` all `Link to="/contact"`. The home journey is
the gap.)

## The constraint that shapes everything: there is NO server
Prod is a **static, prerendered SPA on Vercel** (see `ship`, `vercel.json`). There is no Node process
to receive a POST. The "server" is one of:
- a **Supabase Edge Function** (recommended — pairs with the DB), or
- a **Vercel serverless/edge function** (`/api/*`), or
- a third-party form endpoint.
Never write the form to assume an Express/Node backend. The form does `fetch(ENDPOINT, …)` to one of
the above.

## Recommended architecture (buildable with this session's MCP connectors)
1. **Form → POST** the JSON to the endpoint. Frontend seam: `Contact.jsx:46 onSubmit`, at the
   `// TODO Phase 2` (`Contact.jsx:57`). Replace the `mailto:` fallback (`Contact.jsx:71–73`) with the
   `fetch`; keep `mailto:` as the catch-on-network-failure so no lead is ever lost.
2. **Endpoint: validate → store.** Mirror server-side the client rules in `validate()`
   (`Contact.jsx:25`). Write the row to **Supabase** (Postgres `leads` table) — the system of record.
3. **CRM upsert: Attio** — create person + deal in a "Forge Intake" pipeline (the agency-sized CRM).
4. **Confirmation: AgentMail or Gmail** — instant branded auto-reply to the lead + a team notification
   to the real intake address.
5. **Conversion event** (BUILD_PLAN 2.4) — fire on success, beside `setSent(true)` (`Contact.jsx:77`),
   so the existing `<Success>` state (`Contact.jsx:253`) doubles as the analytics trigger.

Available backends THIS session (integration options, by role):
**Supabase** = Postgres `leads` table + Edge Function endpoint · **Attio** = CRM record/pipeline ·
**AgentMail / Gmail** = confirmation + team notification · (Vercel function = alternate endpoint).

## Procedure
1. **Confirm the open decisions FIRST (owner-gated, do not guess):**
   - **Real intake email** — `forge@gaelworx.com` (`Contact.jsx:23`) is a placeholder. Confirm before
     any mail goes live.
   - **CRM vs DB** — Supabase + Attio both, or one? (Research recommends both.)
   - **Booking tool** — is there a Cal.com/Calendly link? It becomes a CTA target + a `/contact` alternate.
2. **Kill the dead handlers** — rewire `Content.jsx:307` and `:418` to `/contact` (or the booking link).
   Grep `onClick={strike}` / `strike()` to confirm none remain as a *conversion* CTA.
3. **Build the endpoint** (Supabase Edge Function or Vercel `/api`) — validate, insert, fan out.
4. **Wire the form** — `fetch` from `onSubmit`; keep `mailto:` as the failure fallback; keep the
   `<Success>` state.
5. **Confirmation + notification** via AgentMail/Gmail to the confirmed intake address.
6. **Fire the conversion event** on success.
7. **Add CTA alternates** on `/contact` — a `tel:` and `mailto:` (and booking link if confirmed), so
   high-intent visitors who won't fill a form still convert.
8. **Brand pass + verify** — run **`brand-check`** (form copy = Clan voice, 0px corners, ember focus
   already correct) then **`qa-route`** on `/` and `/contact` (build + Playwright @ 393×852 and
   1440×900, **0 console errors**; assert submit reaches the endpoint, the `<Success>` state renders,
   and no CTA dead-ends).

## Done =
No CTA goes nowhere (`strike()` killed as a handler) · `/contact` submit writes to the store and the
lead gets a branded confirmation · a conversion event fires · `qa-route` green @ both viewports · the
real intake email is confirmed by the owner. (Do NOT deploy — that's `ship`, owner OK only.)
