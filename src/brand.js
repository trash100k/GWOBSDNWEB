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

  arsenal: {
    kicker: '02 · The Arsenal',
    head: 'Four branches. One forge.',
    intro: 'Tell us the bottleneck. We build the system that ends it.',
    branches: [
      {
        id: 'GW–01',
        tag: 'Software',
        line: 'Custom software. Built to run it all.',
        body: 'Internal tools and proprietary platforms — custom-built, documented, open-sourced to you. The same forge that built YardWorx, built for how you actually run.',
      },
      {
        id: 'GW–02',
        tag: 'Voice',
        line: 'Lifelike voice agents that never clock out.',
        body: 'Maeve answers every call, qualifies the lead, books the job, and chases the no-shows — in a voice no caller clocks as AI. Your script, around the clock. No missed call, no lost revenue.',
      },
      {
        id: 'GW–03',
        tag: 'Automations',
        line: 'Workflows that kill the headaches.',
        body: 'Workflows and automations that quote, follow up, invoice, and pull reviews on their own — and hand you your data to own and leverage like no one else can.',
      },
      {
        id: 'GW–04',
        tag: 'Web',
        line: 'Cinematic web that books the job.',
        body: 'Studio-grade, cinematic lead-gen sites that turn visitors into booked work and route every lead straight to your phone.',
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
