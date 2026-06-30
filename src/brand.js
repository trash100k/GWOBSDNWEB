/**
 * GAELWORX brand — single source of truth for tokens + the copy deck.
 * Cinematic-mythic voice. Palette matched to the brand book ("metallurgy").
 */

export const TOKENS = {
  void: '#050608', // obsidian / void black
  obsidian: '#0a0b10',
  iron: '#15161c', // iron — panel fill
  steel: '#9aa1ad', // steel / silver — muted text
  bone: '#efe6da', // bone white — primary text
  ember: '#ff5a1e', // ember orange — primary accent
  emberDeep: '#ff3b0a',
  forge: '#d72638', // forge red — strike / secondary
  display: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Roboto, sans-serif",
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
}

export const NAV = [
  ['00', 'Home'],
  ['01', 'Services'],
  ['02', 'Software'],
  ['03', 'Automations'],
  ['04', 'Voice'],
  ['05', 'Web'],
  ['06', 'About'],
  ['07', 'Contact'],
]

export const COPY = {
  mark: 'GAELWORX · ONE FORGE',
  loader: 'One Forge',

  hero: {
    eyebrow: 'Four Branches · One Forge',
    headline: 'Automatic Execution',
    sub: 'One system that books the jobs, answers every call, and kills the busywork — running while you sleep. You command it. It never needs managing.',
    cta: 'Start the Forge',
  },

  draw: 'From black, the light.',

  clan: {
    kicker: '01 · The Clan',
    head: 'One forge. Four branches.',
    body: 'GAELWORX is an engineering forge, not an agency. We run our own platforms on this exact system — YardWorx, RepairWorx, SalesWorx, AgentWorx — and build the same caliber for you. The enemy is the black box: AI that demos and never ships, agencies that bill for motion. We move like a clan: small, fast, accountable. You talk to the people who write the code.',
  },

  // Each branch is wired to sell: outcome (line) → first-hand proof (body) →
  // anchor (what it costs elsewhere) → the "from" price. Never a naked number.
  arsenal: {
    kicker: '02 · The Arsenal',
    head: 'Four branches. One forge.',
    intro: 'Name the thing eating your week. We build the system that ends it.',
    branches: [
      {
        id: 'GW–01',
        tag: 'Software',
        line: 'Custom software. Built to run it all — and owned outright.',
        body: 'Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. You own the code, not a license: no lock-in, no black box. The same system that runs YardWorx, built for how you actually work.',
        anchor: 'Agencies bill $75k and burn months on discovery.',
        price: 'From $10,000',
        note: '$5k deposit to start',
      },
      {
        id: 'GW–02',
        tag: 'Voice',
        line: 'Every missed call is a job booked by someone else.',
        body: 'Maeve answers every call, qualifies the lead, books the job, and chases the no-show — while you’re on the job, in a voice no caller clocks as AI. She runs our own front desk. Put her on yours and the phone stops going to voicemail.',
        anchor: 'An in-house receptionist costs $48,000 a year and still clocks out at five. Maeve doesn’t clock out.',
        price: 'From $499/mo',
        note: '+ one-time setup',
      },
      {
        id: 'GW–03',
        tag: 'Automations',
        line: 'Workflows that kill the headaches.',
        body: 'Quoting, follow-up, invoicing, reviews — running on their own, and handing your data back to you to own. No black box. No hostage tool. The same automations that run our own shops.',
        anchor: 'By hand, it costs you those hours every week.',
        price: 'From $1,500',
      },
      {
        id: 'GW–04',
        tag: 'Web',
        line: 'Cinematic web that books the truck.',
        body: 'A cinematic site that routes every lead straight to your phone and books the truck — not one that just looks good. Built to the standard of the page you’re reading.',
        anchor: 'Premium studios charge $50k+ for this.',
        price: 'From $1,299',
      },
    ],
  },

  // The rates beat — the whole ladder at once, with the reconciliation line that
  // lets premium craft sit beside accessible prices: the forge is efficient.
  rates: {
    kicker: 'The Forge Runs Lean',
    head: 'Premium work. Honest prices.',
    lede: 'Automatic Execution systematizes what agencies bill by the hour — the quoting, the follow-up, the setup that runs the same on every job. You don’t pay less for less. You pay less because the forge runs lean.',
    foot: 'Fixed scope. Fixed price. Continental US · 7 Days.',
  },

  // Extractable Q/A for AEO/GEO — what answer engines lift verbatim. Keyed by
  // route path. Each answer ≤320 chars, leads with the literal fact (price,
  // yes/no, the number), brand voice second; every number is sourced from the
  // branch prices/anchors above so nothing drifts. Mirrors real buyer questions.
  // Rendered as plain text + FAQPage schema by scripts/prerender.mjs.
  faq: {
    '/software': [
      {
        q: 'How much does custom software cost?',
        a: 'Custom software starts from $10,000, with a $5k deposit to start. That buys internal tools and proprietary platforms — custom-built, documented, and open-sourced to you, so you own the code outright. Agencies bill $75k and burn months on discovery for the same scope.',
      },
      {
        q: 'Do I own the code you build?',
        a: 'Yes — every platform we build is documented and open-sourced to you on day one, so you own the code outright. No lock-in, no black box, no rented roadmap. The same forge that built YardWorx builds for how you actually run. Custom software from $10,000.',
      },
    ],
    '/voice': [
      {
        q: 'Does Maeve sound human?',
        a: 'No caller clocks Maeve as AI. She answers every call, qualifies the lead, books the job, and chases the no-show in a voice that breathes — the same agent that runs our own front desk. Voice agents start from $499/mo plus a one-time setup.',
      },
      {
        q: 'How much is an AI voice agent?',
        a: 'Maeve runs from $499/mo plus a one-time setup. An in-house receptionist runs $48,000 a year and clocks out at five. Maeve answers every call, qualifies the lead, books the job, and chases the no-show — and never clocks out. Roughly an eighth of the cost.',
      },
      {
        q: 'Can Maeve actually book jobs?',
        a: 'Yes — Maeve books the job straight into your calendar and chases the no-show, not just takes a message. She answers every call, qualifies the lead, and routes the hot ones to you while you work. From $499/mo plus one-time setup.',
      },
    ],
    '/automations': [
      {
        q: 'How much do workflow automations cost?',
        a: 'Workflow automation starts from $1,500. We put quoting, follow-up, invoicing, and reviews on autopilot — then hand you your data to own and leverage like no one else can. No black box. The same automations that run our own shops. One build pays for itself inside a month.',
      },
      {
        q: 'What can you automate for my business?',
        a: 'Quoting, follow-up, invoicing, and review collection — the rote work that costs you hours every week by hand. It runs on its own, never drops the ball, and hands your data back to you to own. Not locked in someone else’s tool. From $1,500. It runs the work, it pays for itself.',
      },
    ],
    '/web': [
      {
        q: 'How much does a website cost?',
        a: 'A GAELWORX site starts from $1,299. You get studio-grade cinematic lead-gen that routes every lead straight to your phone and books the truck — not just looks good. Premium studios charge $50k+ for this. Fixed scope, fixed price, shipped in 7 days.',
      },
      {
        q: 'How fast can you ship a site?',
        a: 'Seven days. Fixed scope, fixed price, Continental US — no pilots that rot in phase two. We put it live, it routes leads straight to your phone, and it books the truck. Web from $1,299, against the $50k+ premium studios charge.',
      },
      {
        q: 'Will the site actually generate leads?',
        a: 'Yes. Every site routes every lead straight to your phone and is built to book the truck, not just look good — the outcome is work on your calendar. Studio-grade and cinematic, built to the standard of the page you are reading. From $1,299.',
      },
    ],
    '/pricing': [
      {
        q: 'What is the deposit to start?',
        a: 'Software takes a $5k deposit to start — it locks scope, not a paywall; it filters for buyers who build, not browse. Voice from $499/mo plus one-time setup, Web from $1,299, Automations from $1,500 start without one. Fixed scope, fixed price. We carry the risk — you pay when it executes.',
      },
      {
        q: 'Why are your prices lower than agencies?',
        a: 'Automatic Execution systematizes what agencies bill by the hour. You don’t pay less for less — you pay less because the forge runs lean. No discovery theater, no layers of management, no year of meetings. Fixed scope, fixed price, shipped in 7 days. Continental US. You own what we build.',
      },
      {
        q: 'What does each branch cost?',
        a: 'Software from $10,000 with a $5k deposit — agencies bill $75k. Voice from $499/mo plus setup against a $48,000/yr receptionist. Web from $1,299 where studios charge $50k+. Automations from $1,500. Every price is a fixed-scope "from." Name the bottleneck — we put a number on ending it.',
      },
    ],
  },

  point: {
    kicker: '03 · Start the Forge',
    head: 'Name the bottleneck.',
    body: 'One call. No discovery-call theater. You name the bottleneck — we forge the system that kills it. Fixed scope, fixed price, before you owe a thing.',
    cta: 'Start the Forge',
    avail: 'Available · Continental US · 7 Days',
  },

  // The trust ladder — a 5-rung scroll-jacked whirlwind on what makes GAELWORX
  // different. Each rung banks a distinct pillar (first-hand knowledge → proven
  // ground → the AI ethic → ROI → guarantee), with no overlap onto the
  // hero/clan/arsenal story. Built to bank trust per frame.
  trust: {
    kicker: 'Why GAELWORX',
    rungs: [
      {
        n: '01',
        head: 'We build what we run.',
        body: 'Every build starts from years on the floor — we’ve run the operation, not read the case study. We worked the bottlenecks we automate, so you never pay us to learn your business on your dime.',
      },
      {
        n: '02',
        head: 'Built on enterprise ground.',
        body: 'We build on the same battle-tested rails that run banks and logistics fleets — not last quarter’s frontier model and a crossed-fingers prompt. Proven ground, predictable behavior, nothing held together with hope.',
      },
      {
        n: '03',
        head: 'No black box.',
        body: 'We point AI at the rote work, never at your judgment. No black-box oracle, no machine pretending to be the person in the room. It does the grunt work, shows its reasoning, and hands the call back to you. Built to make you sharper, not dependent.',
      },
      {
        n: '04',
        head: 'It ships. Then it earns.',
        body: 'No pilots that rot in “phase two.” We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, hours handed back. Every week you wait, the manual way keeps taking all three.',
      },
      {
        n: '05',
        head: 'We carry the risk.',
        body: 'Fixed scope. Fixed price. Working on day one. We don’t get paid to experiment on your business — we get paid when it executes. The risk is ours. That’s the point.',
      },
    ],
  },

  // The finale act — a scroll-jacked journey of its own: the visitor’s problems
  // drain into a Cinzel mandala whirlpool, the solutions rise back out, simplify
  // into the four forges, spin into GAELWORX, then the CTA. (PASS → Secure.)
  finale: {
    problems: [
      'Every missed call. A booked job, gone.',
      'Hours a week, lost to busywork.',
      'Six apps. None of them talking.',
      'A site that books nothing.',
    ],
    seed: 'AI everywhere. Execution nowhere.',
    solutions: [
      'Every call answered.',
      'The busywork runs itself.',
      'One system. Total command.',
      'A site that books the truck.',
    ],
    forges: ['YardWorx', 'RepairWorx', 'SalesWorx', 'AgentWorx'],
    mark: 'GAELWORX',
    closer: 'We keep up so you don’t have to. You command the machine — we hold the line.',
    avail: 'Available · Continental US · 7 Days',
    cta: 'Start the Forge',
  },

  footer: {
    mark: 'GAELWORX · One Forge',
    tag: 'You run the business. We build the systems that run it for you.',
  },
}
