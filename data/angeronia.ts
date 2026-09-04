// Single source of truth for angeronia.com — the Angeronia Labs consultancy
// landing page. Copy is deliberately terse: long prose is replaced by visuals
// (the scroll-drawn continuity line, the meter graph, the coverage strip).

export type Theme = "light" | "dark" | "bw";

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "bw", label: "Noir" },
];

export const BRAND = {
  name: "Angeronia Labs",
  legal: "Angeronia Labs LLC",
  domain: "angeronia.com",
  city: "Philadelphia, PA",
  tagline: "A software engineering studio in Philadelphia.",
} as const;

export const LINKS = {
  email: "pratik.kakashi@gmail.com",
  codeSocratic: "https://code-socratic.com",
  linkedin: "https://www.linkedin.com/in/pratik-kubal/",
  github: "https://github.com/pratik-kubal",
  calendar: "mailto:pratik.kakashi@gmail.com?subject=Project%20inquiry%20%E2%80%94%20Angeronia%20Labs",
} as const;

// ── Hero ──────────────────────────────────────────────────────────────────────
export const hero = {
  kicker: "Angeronia Labs · Philadelphia",
  h1: "We turn ambiguous problems into software that ships.",
  subhead: "Product engineering studio",
  body: "Senior-led. We take the fuzzy, half-specified problem off your plate — and hand back shipped, tested software you own.",
  ctaPrimary: { label: "Start a project", href: LINKS.calendar },
  ctaSecondary: { label: "See what we build", href: "#work" },
  scrollHint: "Scroll to unfold",
  figureAlt: "Animated hand-drawn Möbius band — the Angeronia Labs mark.",
  mobius: { R: 2.6, w: 0.8, t: 0.48, speed: 26, tilt: 0 },
} as const;

// ── Philosophy (scroll-drawn continuity line) ────────────────────────────────
// The line draws itself in one unbroken stroke as you scroll — no lifted pen,
// no seam — while three terse beats light up in turn.
export const philosophy = {
  screenLabel: "Philosophy",
  kicker: "The through-line",
  heading: "One line. No hand-off cliff.",
  lineAlt: "A single continuous line drawing itself in step with the scroll.",
  caption: "One unbroken stroke",
  beats: [
    { tag: "Strategy is engineering", text: "The people who scope it write it. No seam to drop." },
    { tag: "One decision, two views", text: "Business goals and code are the same call — not two teams." },
    { tag: "You keep all of it", text: "Tests, docs, runbook, in your repo. We end by making ourselves optional." },
  ],
} as const;

// ── Services (stacked rows) ───────────────────────────────────────────────────
export interface Service {
  title: string;
  blurb: string;
  tags: string[];
}

export const servicesHeading = "What we take on";
export const servicesLabel = "Services";
export const services: Service[] = [
  {
    title: "AI & LLM product engineering",
    blurb: "Agentic features that survive real users — not a demo that breaks on the second prompt.",
    tags: ["Agent loops", "Tool use & guardrails", "Server-verified evals", "Token economics"],
  },
  {
    title: "Cloud & microservices",
    blurb: "FinTech-grade backends that hold up under load and audit.",
    tags: ["AWS", "Step Functions", "Zero-downtime migrations", "IaC"],
  },
  {
    title: "Full-stack product build",
    blurb: "Zero-to-one, multi-tenant from day one.",
    tags: ["Next.js / React", "Auth & billing", "Postgres", "Vercel"],
  },
  {
    title: "Platform reliability",
    blurb: "The unglamorous work that decides whether a release ships Friday.",
    tags: ["CI/CD", "Test coverage", "Rate limits & moderation", "Load tests"],
  },
];

// ── Process (scroll-scrubbed timeline, no ordinals) ──────────────────────────
export interface ProcessStep {
  title: string;
  body: string;
}

export const processLabel = "How we work";
export const processHeading = "Four moves, one continuous line.";
export const processSteps: ProcessStep[] = [
  { title: "Discover", body: "We write the ambiguity down until it's testable." },
  { title: "Architect", body: "A roadmap you approve before a line is written." },
  { title: "Build", body: "Staged, feature-flagged, tested — working software weekly." },
  { title: "Hand off", body: "Docs, runbook, walkthrough. Then we step back." },
];

// ── Product spotlight — Code Socratic ─────────────────────────────────────────
export const product = {
  screenLabel: "Code Socratic",
  label: "Built by the studio",
  kicker: "Flagship product",
  name: "Code Socratic",
  headline: "A live interviewer that actually runs your code.",
  body: "Our own product, built end-to-end. It teaches Approach → Complexity → Code, runs your solution against server-verified hidden tests, and grades you honestly. Hints, not answers.",
  loop: ["Approach", "Complexity", "Code"],
  points: [
    "Claude Agent SDK loop · 7 MCP tools · per-turn credit budgets",
    "Multi-tenant SaaS — auth, Stripe, quotas, admin, cloud execution",
    "Reference solutions & hidden outputs never leave the server",
  ],
  tags: ["Next.js", "Claude Agent SDK", "Drizzle / Neon", "Stripe", "E2B", "Turborepo"],
  cta: { label: "Visit Code Socratic ↗", href: LINKS.codeSocratic },
  note: "The proof: the same team that consults for you shipped a production, multi-tenant AI SaaS.",
} as const;

// ── Proof / metrics (scroll-scrubbed meter graph) ─────────────────────────────
export interface Metric {
  label: string;
  from: number;
  to: number;
  decimals: number;
  suffix: string;
  word: string;
  barFrac: number; // 0..1 — how full the meter fills
  beforeFrac?: number; // optional ghost baseline (e.g. "was 50%")
  note: string;
}

export const metricsLabel = "Proof";
export const metricsHeading = "Numbers from shipped work.";
export const metrics: Metric[] = [
  { label: "API latency", from: 0, to: 90, decimals: 0, suffix: "%", word: "faster", barFrac: 0.9, note: "graph-DB → Aurora · ~100K req/day · zero downtime" },
  { label: "Doc throughput", from: 1, to: 2.4, decimals: 1, suffix: "×", word: "", barFrac: 0.8, note: "pipeline re-architecture · half the cost" },
  { label: "Test coverage", from: 0, to: 70, decimals: 0, suffix: "%", word: "org-wide", barFrac: 0.7, note: "dependency-injection patterns, made default" },
  { label: "Deploy success", from: 50, to: 100, decimals: 0, suffix: "%", word: "green", barFrac: 1.0, beforeFrac: 0.5, note: "rebuilt a broken 50% pipeline" },
];
export const metricsFootnote =
  "From five years on Aiva Docs — a mortgage-tech document-AI platform (1,100+ doc types, 1,200+ data elements).";

// ── About (condensed + coverage strip) ────────────────────────────────────────
export const aboutLabel = "Who you work with";
export const aboutHeading = "Senior hands, not a hand-off.";
export const aboutLead =
  "Angeronia Labs is Pratik Kubal — five years of FinTech document-AI on AWS, a Master's in Machine Learning, and a habit of shipping under incomplete requirements.";
export const aboutKicker = "One person can own the whole range:";
export const aboutRange = ["Backend", "Frontend", "Cloud / DevOps", "AI / LLM", "Product & funding"];
export const aboutCoda = "When quality slips, we revive it. When the spec is fuzzy, we make it concrete.";

// ── Contact CTA ───────────────────────────────────────────────────────────────
export const contact = {
  label: "Start here",
  heading: "A problem that's easier to describe than to build?",
  body: "That's the kind we like. Tell us what “done” looks like — we'll tell you the shape of the work.",
  cta: { label: "Email the studio", href: LINKS.calendar },
  emailText: LINKS.email,
} as const;

// ── Footer ────────────────────────────────────────────────────────────────────
export const footer = {
  tagline: "A software engineering studio in Philadelphia. We build products — including our own.",
  columns: [
    {
      title: "Studio",
      links: [
        { label: "Services", href: "#services" },
        { label: "How we work", href: "#process" },
        { label: "Proof", href: "#proof" },
        { label: "About", href: "#about" },
      ],
    },
    {
      title: "Products",
      links: [{ label: "Code Socratic ↗", href: LINKS.codeSocratic, external: true }],
    },
    {
      title: "Elsewhere",
      links: [
        { label: "Email ↗", href: LINKS.calendar, external: true },
        { label: "LinkedIn ↗", href: LINKS.linkedin, external: true },
        { label: "GitHub ↗", href: LINKS.github, external: true },
      ],
    },
  ],
  copyrightLeft: "© 2026 Angeronia Labs LLC. All rights reserved.",
  copyrightRight: "Built with responsible AI practices.",
} as const;
