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
    eyebrow: 'Four Blades · One Fire',
    headline: 'Automatic Execution',
    sub: 'Intelligence is the spark. We forge the blade that swings without you.',
    cta: 'Point the Sword',
  },

  draw: 'From black, a blade.',

  clan: {
    kicker: '01 · The Clan',
    head: 'One fire. Many blades.',
    body: 'GAELWORX is an engineering forge. We ship our own platforms — YardWorx, RepairWorx, SalesWorx, AgentWorx — and bring the same hammer to yours. We move like a clan, not an agency. You talk to the hand that holds the hammer.',
  },

  arsenal: {
    kicker: '02 · The Arsenal',
    head: 'Four blades. One fire.',
    intro: 'Pick the blade. We sharpen the rest.',
    branches: [
      {
        id: 'GW–01',
        tag: 'Software',
        line: 'Platforms that decide.',
        body: 'Bespoke operational systems and internal tooling — the forge that built YardWorx, pointed at your trade.',
      },
      {
        id: 'GW–02',
        tag: 'Voice',
        line: 'A receptionist that never blinks.',
        body: 'Inbound and outbound agents that qualify, book, and recover — your voice, your script, 24/7. Her name is Maeve.',
      },
      {
        id: 'GW–03',
        tag: 'Automations',
        line: "Pipelines that don't sleep.",
        body: 'Silent machines that quote, follow up, invoice, and chase reviews while the fires die down. Built once. Paid forever.',
      },
      {
        id: 'GW–04',
        tag: 'Web',
        line: 'Lead engines, not brochures.',
        body: "Studio-grade sites that drop the visitor's guard and route the lead straight to the truck.",
      },
    ],
  },

  point: {
    kicker: '03 · Point the Sword',
    head: 'Name the target.',
    body: 'One call. No discovery-call theater. You point. We take the battlefield.',
    cta: 'Point the Sword',
    avail: 'Available · Continental US · 7 Days',
  },

  footer: {
    mark: 'GAELWORX · One Forge',
    tag: 'Point the sword. We take care of the battlefield.',
  },
}
