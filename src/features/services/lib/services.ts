/**
 * Services board. Static site copy, so a typed const — same call as
 * `nav-links.ts`.
 *
 * The board carries a "From [PRICE]" line on every service and a price on
 * every engagement shape. Those are placeholders and no real figures exist
 * yet, so they are omitted rather than rendered as brackets or guessed at.
 * The content rule: an honest omission beats an invented number.
 */
export interface ServicePanel {
  heading: string;
  /** A panel is either a list or a paragraph, never both. */
  items?: readonly string[];
  body?: string;
}

export interface Service {
  n: string;
  title: string;
  body: string;
  /** Marks the one accented service on the page. */
  accent?: boolean;
  panels: readonly ServicePanel[];
}

export const SERVICES: readonly Service[] = [
  {
    n: "01",
    title: "Cinematic front ends",
    body: "Scroll-driven narrative where the motion carries the argument. Pinned scenes, WebGL where it earns its place, and a performance budget written down before the first keyframe.",
    panels: [
      {
        heading: "You get",
        items: [
          "Storyboarded scene map",
          "GSAP ScrollTrigger spine",
          "Three.js / R3F scenes",
          "Reduced-motion parity",
        ],
      },
      {
        heading: "Right for",
        items: [
          "Product launches",
          "Brands with a story to tell",
          "Awards-ambition sites",
        ],
      },
      { heading: "Wrong for", items: ["Pure lead-gen pages", "Very short deadlines"] },
    ],
  },
  {
    n: "02",
    title: "Full-stack product",
    body: "Front to back, by one person who understands both ends. Typed boundaries between every layer, so the thing you launch is the thing you can still change in two years.",
    panels: [
      {
        heading: "You get",
        items: [
          "Next.js 16 · React 19 · TS",
          "Strapi 5 + PostgreSQL",
          "Auth, payments, email",
          "CI, previews, runbook",
        ],
      },
      {
        heading: "The guarantee",
        body: "The data contract is yours and it is portable. Swap Strapi for anything with the same shape and the front end does not notice.",
      },
      {
        heading: "Hosting",
        body: "Vercel, Netlify, Hostinger or your own VPS. Chosen on the project's needs, not on my margin.",
      },
    ],
  },
  {
    n: "03",
    title: "Agent systems",
    accent: true,
    body: "Internal fleets that do real work. I run my own studio on them — so what you get is a system that survived contact with a real business, not a demo.",
    panels: [
      {
        heading: "You get",
        items: [
          "Scoped tools & MCP servers",
          "Eval suite per workflow",
          "Audit trail & cost ceiling",
          "A written runbook",
        ],
      },
      {
        heading: "How I scope it",
        body: "Blast radius first. What can this agent touch, what can it never touch, and who gets told when it acts.",
      },
      {
        heading: "What I will not do",
        body: "Ship an agent with write access to a system nobody is monitoring. That is not caution, it is experience.",
      },
    ],
  },
  {
    n: "04",
    title: "Growth engineering",
    body: "Technical SEO, Core Web Vitals and content systems built by the person who built the site. Most agencies split these across two companies that blame each other.",
    panels: [
      {
        heading: "Technical",
        items: [
          "Crawl, index, schema",
          "CWV to green, and kept there",
          "Structured data in the CMS",
        ],
      },
      {
        heading: "Content",
        items: [
          "Agent-assisted drafting",
          "Campaign & social assets",
          "Human edit on everything",
        ],
      },
      {
        heading: "Reported as",
        body: "One monthly page: what moved, what did not, what I am doing next. No 40-slide deck.",
      },
    ],
  },
] as const;

export interface Engagement {
  kind: string;
  title: string;
  body: string;
  accent?: boolean;
}

export const ENGAGEMENTS: readonly Engagement[] = [
  {
    kind: "Fixed scope",
    title: "Project",
    body: "Defined outcome, fixed price, milestone payments. Best when you know what you want built.",
  },
  {
    kind: "Continuous",
    title: "Retainer",
    body: "A set number of days a month on whatever matters most. Best when the roadmap is still moving.",
  },
  {
    kind: "Advisory",
    title: "Fractional CTO",
    accent: true,
    body: "Architecture, hiring, technical due diligence, agent strategy. Best when you have a team but no senior.",
  },
] as const;
