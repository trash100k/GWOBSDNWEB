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
        line: 'Platforms that run the operation.',
        body: 'Custom operational platforms and internal tools that schedule, dispatch, and track the work. The same forge that built YardWorx, built for how you run.',
      },
      {
        id: 'GW–02',
        tag: 'Voice',
        line: 'A front desk that never clocks out.',
        body: 'Maeve answers every call, qualifies the lead, books the job, and chases the no-shows — your script, your voice, around the clock. No missed call, no lost revenue.',
      },
      {
        id: 'GW–03',
        tag: 'Automations',
        line: 'Pipelines that do the busywork.',
        body: 'Systems that quote, follow up, invoice, and pull reviews on their own. You build them once and they earn every day after.',
      },
      {
        id: 'GW–04',
        tag: 'Web',
        line: 'Sites that book jobs.',
        body: 'Studio-grade lead-gen sites that turn visitors into booked work and route every lead straight to your phone.',
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

  footer: {
    mark: 'GAELWORX · One Forge',
    tag: 'You run the business. We forge the systems that run it.',
  },
}
