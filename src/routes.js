/**
 * GAELWORX route table — single source for the router, the Nav, the build-time
 * prerender (docs/BUILD_PLAN 0.2), the sitemap, and per-route SEO <head>.
 * Each route ships its own URL + its own 3D wonderland (added in Phase 1).
 */
export const ROUTES = [
  {
    path: '/',
    label: 'Home',
    title: 'GAELWORX — Automatic Execution. Clan Protected.',
    desc: 'GAELWORX is an AI implementation forge: custom software, lifelike voice agents, workflow automation, and cinematic web. We keep up so you don’t have to.',
  },
  {
    path: '/software',
    label: 'Software',
    title: 'Custom Software & Proprietary Platforms — GAELWORX',
    desc: 'Internal tools and proprietary platforms — custom-built, documented, and open-sourced to you. From $10,000.',
  },
  {
    path: '/voice',
    label: 'Voice',
    title: 'Lifelike AI Voice Agents (Maeve) — GAELWORX',
    desc: 'Maeve answers every call, qualifies the lead, and books the job in a voice no caller clocks as AI. From $499/mo.',
  },
  {
    path: '/automations',
    label: 'Automations',
    title: 'Workflow Automation That Kills the Headaches — GAELWORX',
    desc: 'Quoting, follow-up, invoicing, reviews — running on their own, handing you your data to own and leverage. From $1,500.',
  },
  {
    path: '/web',
    label: 'Web',
    title: 'Cinematic Web Design That Books the Job — GAELWORX',
    desc: 'Studio-grade, cinematic lead-gen sites that turn visitors into booked work. From $1,299.',
  },
  {
    path: '/work',
    label: 'Work',
    title: 'Work — GAELWORX',
    desc: 'The forge’s own platforms and client builds — YardWorx, RepairWorx, SalesWorx, AgentWorx — and the systems we build for you.',
  },
  {
    path: '/pricing',
    label: 'Pricing',
    title: 'Pricing — GAELWORX',
    desc: 'Premium work, honest prices. Voice from $499/mo, Web from $1,299, Automations from $1,500, Software from $10,000. The forge runs lean.',
  },
  {
    path: '/about',
    label: 'About',
    title: 'About — GAELWORX',
    desc: 'One forge, four branches. We build what we know — every build comes from decades of first-hand knowledge. Automatic Execution. Clan Protected.',
  },
  {
    path: '/contact',
    label: 'Contact',
    title: 'Start the Forge — Contact GAELWORX',
    desc: 'Name the bottleneck. We build the system that ends it. Available · Continental US · 7 Days.',
  },
]

export const ROUTE_PATHS = ROUTES.map((r) => r.path)
export const routeByPath = (p) => ROUTES.find((r) => r.path === p)
