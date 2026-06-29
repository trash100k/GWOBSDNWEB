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
    sub: 'We forge AI systems that run your business while you sleep. Built to execute, not to babysit.',
    cta: 'Start the Forge',
  },

  draw: 'From black, the light.',

  clan: {
    kicker: '01 · The Clan',
    head: 'One forge. Four branches.',
    body: 'GAELWORX is an engineering forge, not an agency. We ship our own platforms — YardWorx, RepairWorx, SalesWorx, AgentWorx — and build the same caliber of systems for you. We move like a clan: small, fast, fully accountable. You talk to the people who build it.',
  },

  // Each branch is wired to sell: outcome (line) → first-hand proof (body) →
  // anchor (what it costs elsewhere) → the "from" price. Never a naked number.
  arsenal: {
    kicker: '02 · The Arsenal',
    head: 'Four branches. One forge.',
    intro: 'Tell us the bottleneck. We build the system that ends it.',
    branches: [
      {
        id: 'GW–01',
        tag: 'Software',
        line: 'Custom software. Built to run it all.',
        body: 'Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. The same forge that built YardWorx, built for how you actually run.',
        anchor: 'Agencies bill $75k and months of discovery.',
        price: 'From $10,000',
        note: '$5k deposit to start',
      },
      {
        id: 'GW–02',
        tag: 'Voice',
        line: 'Lifelike voice agents that never clock out.',
        body: 'Maeve answers every call, qualifies the lead, books the job, and chases the no-shows — in a voice no caller clocks as AI. The same agent that runs our own front desk.',
        anchor: 'An in-house receptionist runs $48,000 a year.',
        price: 'From $499/mo',
        note: '+ one-time setup',
      },
      {
        id: 'GW–03',
        tag: 'Automations',
        line: 'Workflows that kill the headaches.',
        body: 'Quoting, follow-up, invoicing, reviews — running on their own, handing you your data to own and leverage like no one else can. The same automations that run our shops.',
        anchor: 'By hand, it costs you those hours every week.',
        price: 'From $1,500',
      },
      {
        id: 'GW–04',
        tag: 'Web',
        line: 'Cinematic web that books the job.',
        body: 'Studio-grade, cinematic lead-gen sites that turn visitors into booked work and route every lead straight to your phone. Built to the standard of the page you’re on.',
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
    lede: 'Automatic Execution means we’ve systematized what others bill by the hour. You’re not paying less for less — you’re paying less because the forge is efficient.',
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
        a: 'Custom software starts from $10,000, with a $5k deposit to start. That buys internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. Agencies bill $75k and months of discovery for the same scope.',
      },
      {
        q: 'Do I own the code you build?',
        a: 'Yes — every platform we build is documented and open-sourced to you, so you own the code outright. The same forge that built YardWorx builds for how you actually run. No lock-in, no black box.',
      },
    ],
    '/voice': [
      {
        q: 'Does Maeve sound human?',
        a: 'No caller clocks Maeve as AI. She answers every call, qualifies the lead, books the job, and chases no-shows in a lifelike voice — the same agent that runs our own front desk. Voice agents start from $499/mo plus a one-time setup.',
      },
      {
        q: 'How much is an AI voice agent?',
        a: 'Maeve runs from $499/mo plus a one-time setup. An in-house receptionist runs $48,000 a year and clocks out. Maeve answers every call, qualifies leads, books jobs, and chases no-shows — and never clocks out.',
      },
      {
        q: 'Can Maeve actually book jobs?',
        a: 'Yes — Maeve books the job directly and chases the no-shows, not just takes messages. She answers every call, qualifies the lead, and routes it straight to you. From $499/mo plus one-time setup.',
      },
    ],
    '/automations': [
      {
        q: 'How much do workflow automations cost?',
        a: 'Workflow automation starts from $1,500. We put quoting, follow-up, invoicing, and reviews on autopilot — and hand you your data to own and leverage like no one else can. The same automations that run our own shops.',
      },
      {
        q: 'What can you automate for my business?',
        a: 'We automate quoting, follow-up, invoicing, and review collection — the rote work that costs you hours every week by hand. It runs on its own and hands your data back to you. From $1,500.',
      },
    ],
    '/web': [
      {
        q: 'How much does a website cost?',
        a: 'A GAELWORX site starts from $1,299. You get a studio-grade, cinematic lead-gen site that turns visitors into booked work and routes every lead to your phone. Premium studios charge $50k+ for this.',
      },
      {
        q: 'How fast can you ship a site?',
        a: 'Fixed scope, fixed price, shipped in 7 days — Continental US. No pilots that rot in phase two. We put it live, it runs the work, and it pays for itself. Web from $1,299.',
      },
      {
        q: 'Will the site actually generate leads?',
        a: 'Yes — every site routes every lead straight to your phone and is built to book the truck, not just look good. Studio-grade and cinematic, from $1,299. Built to the standard of the page you are on.',
      },
    ],
    '/pricing': [
      {
        q: 'What is the deposit to start?',
        a: 'Software requires a $5k deposit to start; all work is fixed scope, fixed price. Voice from $499/mo plus one-time setup, Web from $1,299, Automations from $1,500, Software from $10,000. We carry the risk — you pay when it executes.',
      },
      {
        q: 'Why are your prices lower than agencies?',
        a: 'Fixed scope. Fixed price. Continental US, shipped in 7 days. You are not paying less for less — you are paying less because the forge is efficient. We systematized what others bill by the hour.',
      },
      {
        q: 'What does each branch cost?',
        a: 'Software starts from $10,000 with a $5k deposit. Voice from $499/mo plus one-time setup, Automations from $1,500, Web from $1,299. Every price is a fixed-scope "from" — name the bottleneck and we scope the build.',
      },
    ],
  },

  point: {
    kicker: '03 · Start the Forge',
    head: 'Tell us the problem.',
    body: 'One call. No discovery-call theater. You name the bottleneck — we build the system that kills it.',
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
        head: 'We build what we know.',
        body: 'Every build starts from decades of first-hand knowledge — we’ve run the operation, not just read the case study. We’ve worked the bottlenecks we automate and lived the problems we solve, so you’re never paying us to learn your business on your dime.',
      },
      {
        n: '02',
        head: 'Built on enterprise ground.',
        body: 'We build on the same battle-tested platforms that run banks and logistics fleets — not last quarter’s frontier model and a crossed-fingers prompt. Proven rails. Behavior you can predict.',
      },
      {
        n: '03',
        head: 'Curiosity, not reliance.',
        body: 'We point AI at the redundant work — never to breed dependence. No black-box oracle, no confident nonsense, no machine pretending to be the human in the room. It does the rote, shows its reasoning, and hands judgment back where it belongs — yours. Built to make you sharper, not hooked.',
      },
      {
        n: '04',
        head: 'It ships. Then it earns.',
        body: 'No pilots that rot in “phase two.” We put it live, it runs the work, and it pays for itself — counted in jobs booked, calls answered, and hours handed back to you.',
      },
      {
        n: '05',
        head: 'We carry the risk.',
        body: 'Fixed scope. Fixed price. Working on day one. We don’t get paid to experiment on your business — we get paid when it executes.',
      },
    ],
  },

  // The finale act — a scroll-jacked journey of its own: the visitor’s problems
  // drain into a Cinzel mandala whirlpool, the solutions rise back out, simplify
  // into the four forges, spin into GAELWORX, then the CTA. (PASS → Secure.)
  finale: {
    problems: [
      'Missed calls. Lost jobs.',
      'Buried in busywork.',
      'Six apps. One mess.',
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
    closer: 'We keep up so you don’t have to. We take care of the battlefield.',
    avail: 'Available · Continental US · 7 Days',
    cta: 'Start the Forge',
  },

  footer: {
    mark: 'GAELWORX · One Forge',
    tag: 'You run the business. We forge the systems that run it.',
  },
}
