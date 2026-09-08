// Single source of truth for angeronia.com — the Angeronia Labs consultancy
// landing page. Every string the site renders lives here (design rule 13);
// components take content as props and never inline copy of their own.

import type { ColorScheme } from "@/lib/slds/scheme";

/** Chrome and control labels — the strings that are not page content. */
export const copy = {
  skipLink: "Skip to main content",
  colorScheme: {
    label: "Colour scheme",
    light: "Light",
    dark: "Dark",
  },
  externalLink: "opens in a new tab",
} as const;

export const COLOR_SCHEME_OPTIONS: { value: ColorScheme; label: string }[] = [
  { value: "light", label: copy.colorScheme.light },
  { value: "dark", label: copy.colorScheme.dark },
];

/** The canonical origin. Used by metadata, robots.txt and the sitemap. */
export const SITE_URL = "https://angeronia.com";

export const BRAND = {
  name: "Angeronia Labs",
  legal: "Angeronia Labs LLC",
  domain: "angeronia.com",
  city: "Philadelphia, PA",
  tagline: "A software engineering studio in Philadelphia.",
} as const;

export const LINKS = {
  email: "pratik-kubal@outlook.com",
  codeSocratic: "https://code-socratic.angeronia.com/",
  linkedin: "https://www.linkedin.com/company/angeronia",
  github: "https://github.com/pratik-kubal",
  ntcsf: "https://ntcsf.info/",
  calendar: "mailto:pratik-kubal@outlook.com?subject=Project%20inquiry%20%E2%80%94%20Angeronia%20Labs",
} as const;

// ── Site header ──────────────────────────────────────────────────────────────
export const nav = {
  label: "Primary",
  items: [
    { label: "Services", href: "#services" },
    { label: "Process", href: "#process" },
    { label: "About", href: "#about" },
  ],
  cta: { label: "Start a project", href: LINKS.calendar },
} as const;

// ── Hero ──────────────────────────────────────────────────────────────────────
export const hero = {
  kicker: "Angeronia Labs · Philadelphia",
  h1: "We turn ambiguous problems into solutions that ship.",
  subhead: "Product engineering studio",
  ctaPrimary: { label: "Start a project", href: LINKS.calendar },
  /** Label for the hero Möbius (ADR-012). It is decorative, but a labelled
   *  figure beats an unexplained one for anyone reading with a screen reader. */
  figureAlt: "A Möbius band, hand-drawn and slowly turning — one continuous surface with no seam.",
} as const;

// ── Philosophy ───────────────────────────────────────────────────────────────
export const philosophy = {
  screenLabel: "Philosophy",
  kicker: "The through-line",
  heading: "Our Principles",
  beats: [
    { tag: "Strategy is engineering", text: "The people who scope it write it. No seam to drop." },
    { tag: "One decision, two views", text: "Business goals and code are the same call, not two teams." },
    {
      tag: "You keep all of it",
      text: "Tests, docs, runbook, you own it after handover. We end by making ourselves optional, and providing training on how to maintain it.",
    },
  ],
} as const;

// ── Services ─────────────────────────────────────────────────────────────────
export interface Service {
  title: string;
  blurb: string;
  tags: string[];
}

export const servicesHeading = "What we take on";
export const servicesLabel = "Other Services";
export const services: Service[] = [
  {
    title: "AI & LLM product engineering",
    blurb: "Agentic features that real users use in your domain.",
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
    blurb: "Releases that land predictably, and stay up after they do.",
    tags: ["CI/CD", "Test coverage", "Rate limits & moderation", "Load tests"],
  },
];

// ── Process ──────────────────────────────────────────────────────────────────
export interface ProcessStep {
  title: string;
  body: string;
}

export const processLabel = "Process";
export const processHeading = "How we work";
export const processSteps: ProcessStep[] = [
  { title: "Discover", body: "We write the ambiguity down until it's testable." },
  { title: "Architect", body: "A roadmap you approve before solution is written." },
  { title: "Build", body: "Staged, feature-flagged, tested - Iterative Development weekly for you to evaluate." },
  { title: "Hand off", body: "Docs, runbook, walkthrough, and training. Then we step back." },
];

// ── Product spotlight — Code Socratic ─────────────────────────────────────────
export interface ProductBenefit {
  /** The claim, as the visitor would put it to themselves. */
  title: string;
  body: string;
}

export const product = {
  screenLabel: "Code Socratic",
  label: "Built by the studio",
  kicker: "Flagship product",
  name: "Code Socratic",
  headline: "You may know coding, but can you talk about it?",
  body: "Interviews are a conversation, not a submit button. Code Socratic reads the code you actually wrote and asks you to explain it out loud — then pushes back on the answer.",
  loop: ["Approach", "Complexity", "Code"],
  /** Why a visitor would use it, in their terms — not the stack it runs on. */
  benefits: [
    {
      title: "Coding was never single-player",
      body: "Every turn goes both ways: you explain, it pushes back, you answer. Nothing here is graded by a submit button.",
    },
    {
      title: "It remembers your code, then asks why",
      body: "The tutor carries your actual solution through the session, so the question is never generic. It asks about the line you wrote, and why you chose it.",
    },
    {
      title: "You don't have to be a coder yet",
      body: "Ask what a line does and it will walk you through it. Learn how working code works, and why it was written that way, before you can write it.",
    },
  ] satisfies ProductBenefit[],
  /** The three things a sceptic checks before believing the rest. */
  facts: [
    "Hidden tests run server-side",
    "Difficulty-weighted score",
    "Your code carried through the session",
  ],
  tags: ["Next.js", "Claude Agent SDK", "Drizzle / Neon", "Stripe", "E2B", "Turborepo"],
  tagsLabel: "Built with",
  cta: { label: "Try Code Socratic", href: LINKS.codeSocratic },
} as const;

// ── Code Socratic demo ────────────────────────────────────────────────────────
// The session workspace from `../code-socratic`
// (`apps/web/components/SessionPreview.tsx`), carried over as content. The
// product renders it in Carbon; here it is the same session — same problem,
// same exchange, same run — rebuilt from this site's own CSS (ADR-014).

export interface DemoTurn {
  who: "You" | "Tutor";
  said: string;
}

/** A phase marker on the tutor's status rail. */
export interface DemoPhase {
  label: string;
  done: boolean;
}

export const productDemo = {
  label: "A session, with the problem solved",
  tabsLabel: "Session panels",
  bar: {
    language: "Python",
    title: "Widest Water Between Posts",
    difficulty: "Medium",
    creditsLabel: "credits",
    credits: "46",
  },
  tabs: {
    tutor: "Tutor",
    instructions: "Instructions",
    tests: "Tests",
    results: "Results",
  },

  // ── Editor pane ──
  solutionFile: "solution.py",
  solution: `def solve(heights):
    left, right = 0, len(heights) - 1
    best = 0

    while left < right:
        width = right - left
        best = max(best, width * min(heights[left], heights[right]))

        # The shorter post caps this pair, and every pair still to come
        # behind it is narrower — so it can never beat what we have.
        if heights[left] <= heights[right]:
            left += 1
        else:
            right -= 1

    return best`,
  actions: {
    run: "Run Tests",
    runKeys: "⌘⏎",
    submit: "Submit",
    submitKeys: "⇧⌘⏎",
  },

  // ── Tutor tab ──
  phases: [
    { label: "Approach", done: true },
    { label: "Complexity", done: true },
    { label: "Code", done: false },
  ] satisfies DemoPhase[],
  stats: { hintsLabel: "hints", hints: "0", time: "11:38" },
  chat: [
    { who: "You", said: "Two pointers, one at each end. Each step I move the shorter post inward." },
    { who: "Tutor", said: "Why the shorter one? Say what you throw away when you move it." },
    {
      who: "You",
      said: "Every pair that used that post. The width only shrinks from here, and that post already caps the height.",
    },
    { who: "Tutor", said: "Good. So the loop is O(n), one pass, no extra space — agreed. Write it." },
    { who: "You", said: "Done. Both samples and all seven hidden tests pass." },
    {
      who: "Tutor",
      said: "They do. Harder question, and it is the one an interviewer asks next: what happens on the step where the two posts are exactly equal, and why is it safe to move either?",
    },
  ] satisfies DemoTurn[],
  composer: { placeholder: "Describe your approach, ask a question…", send: "Send" },

  // ── Instructions tab ──
  instructions: {
    paragraphs: [
      [
        "An array ",
        { code: "heights" },
        " gives the height of a vertical post at each index. Choosing two posts ",
        { code: "i < j" },
        ", the water they hold is ",
        { code: "(j - i) * min(heights[i], heights[j])" },
        ".",
      ],
      [
        "Return the ",
        { strong: "maximum" },
        " water any pair of posts can hold. If fewer than two posts exist, return ",
        { code: "0" },
        ".",
      ],
    ] as (string | { code: string } | { strong: string })[][],
    exampleHeading: "Example",
    example: "heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]\n# -> 49  (posts 1 and 8: (8 - 1) * min(8, 7))",
    constraintsHeading: "Constraints",
    constraints: ["0 <= len(heights) <= 10^5", "0 <= heights[k]", "values fit in 64-bit ints"],
  },

  // ── Tests tab — what `renderTestsFile` emits for these two samples. ──
  testsFile: "test_solution.py",
  tests: `# Tests for "Widest Water Between Posts" — read-only. The harness owns this file.
# Hidden tests run too. Their inputs and expected outputs are not shown here,
# so passing everything below is not yet proof the solution is right.
from solution import solve


def test_sample_1():
    assert solve([1, 2, 1]) == 2


def test_sample_2():
    assert solve([4, 3]) == 3`,

  // ── Results tab ──
  results: {
    heading: "All green",
    rows: [
      { label: "Sample tests", value: "2 / 2" },
      { label: "Hidden tests", value: "7 / 7" },
      { label: "Elapsed", value: "84 ms" },
    ],
    note: "Hidden probes cover the wide container, a monotonic run, and the empty and single-post edges. Reference solutions and hidden outputs never leave the server.",
  },

  /** Nothing in the replica acts — say so rather than let a visitor discover it. */
  staticNote: "A replica of the real workspace. The tabs work; nothing else here runs.",
} as const;

// ── Clients ───────────────────────────────────────────────────────────────────
export interface Client {
  name: string;
  /** What the organisation is, in its own terms. */
  what: string;
  /** What the studio is doing for them. */
  engagement: string;
  /** Present tense while the work is live. */
  status: string;
  href: string;
  hrefText: string;
}

export const clientsLabel = "Who we build for";
export const clientsHeading = "Clients and early ventures.";
export const clients: Client[] = [
  {
    name: "National Tax Credit Scholarship Fund",
    what: "A 501(c)(3) in Richmond, Virginia, and a participant in the Federal Scholarship Tax Credit program — it channels tax-credit eligible donations to public school students.",
    engagement: "Technical implementation: we are building out the platform that carries donations from donor to school division.",
    status: "In progress",
    href: LINKS.ntcsf,
    hrefText: "ntcsf.info",
  },
];

// ── Low-bono work and startups ────────────────────────────────────────────────
export const lowBono = {
  heading: "Low-bono work and startups",
  quote: "No revenue for me, until you make revenue.",
  body: "We know how thin the cash is when you are still building the thing. For early ventures we take the work on now and settle the money later — not the week you find your feet, but once you are running.",
} as const;

// ── About (condensed + coverage strip) ────────────────────────────────────────
export const aboutLabel = "Who you work with";
export const aboutHeading = "Right Now, One Person Team";
export const aboutLead =
  "Angeronia Labs is Pratik Kubal — five years of FinTech document-AI on AWS, a Master's in Machine Learning, and a habit of shipping under incomplete requirements.";
export const aboutRange = ["Backend", "Frontend", "Cloud / DevOps", "AI / LLM", "Product & funding"];
export const aboutCoda = "When quality slips, we revive it. When the spec is fuzzy, we make it concrete.";

// ── Contact CTA ───────────────────────────────────────────────────────────────
export const contact = {
  label: "First conversation",
  heading: "A problem that's easier to describe than to build?",
  body: "That's the kind we like. Tell us what “done” looks like — we'll tell you the shape of the work.",
  cta: { label: "Email the studio", href: LINKS.calendar },
  emailText: LINKS.email,
} as const;

// ── Legal pages ───────────────────────────────────────────────────────────────
// Plain-language documents, written against what this site actually does: no
// forms, no accounts, no analytics, no advertising, no cookies. Anything here
// that stops being true is a bug in the document, not a detail — check it
// before adding a form, an embed or a measurement script.

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  /** Route segment, and the sitemap entry. */
  slug: string;
  title: string;
  /** Absolute date, so it never silently ages. */
  updated: string;
  /** The same date as `YYYY-MM-DD`, for the `<time datetime>` attribute. */
  updatedIso: string;
  lede: string;
  sections: LegalSection[];
}

const LEGAL_CONTACT = `Angeronia Labs LLC, Philadelphia, Pennsylvania. Questions about either document go to ${LINKS.email}.`;

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  updated: "8 September 2026",
  updatedIso: "2026-09-08",
  lede: "This site collects nothing about you. The detail below explains what that means in practice, and the two places where information exists anyway.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [LEGAL_CONTACT],
    },
    {
      heading: "What we do not collect",
      paragraphs: [
        "There are no forms, no accounts and no sign-in on this site. We run no analytics, no advertising and no tracking of any kind, and we set no cookies. Nothing on these pages profiles you, and nothing is sold or shared, because there is nothing to sell or share.",
      ],
    },
    {
      heading: "What your browser stores",
      paragraphs: [
        "One value, and only if you use the light/dark switch: an entry named “theme” in your browser’s local storage, recording which scheme you picked. It stays on your device, is never transmitted to us, and clearing your site data removes it. The site works without it.",
      ],
    },
    {
      heading: "What our host records",
      paragraphs: [
        "The site is served by Vercel. Like any web host, Vercel records standard request logs — IP address, user agent, the page requested and the time — to deliver the page and to defend against abuse. We do not use those logs to build a profile of you, and we do not combine them with anything else.",
      ],
    },
    {
      heading: "Fonts and third-party requests",
      paragraphs: [
        "The IBM Plex typefaces are served from this domain rather than from a font CDN, so loading a page makes no request to Google or any other third party. Following a link off the site is the only way your browser contacts someone else.",
      ],
    },
    {
      heading: "If you email us",
      paragraphs: [
        "The contact links open your own mail client; nothing is submitted through this site. If you do write, we keep the correspondence for as long as it takes to answer you and to keep a record of the work, and we use it for nothing else.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: [
        "We link to LinkedIn, GitHub, Code Socratic and to client sites. Once you follow one of those links you are on someone else's site under someone else's policy, and this one no longer applies.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "This site is aimed at businesses and is not directed at children. We do not knowingly collect information from anyone, of any age.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "Depending on where you live you may have rights to access, correct or delete personal information a business holds about you. Since the only information we hold is email you chose to send us, a request to see or delete it is a matter of writing to the address above.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "If this policy changes, the date at the top changes with it. There is no mailing list to notify, so the date is the notice.",
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  updated: "8 September 2026",
  updatedIso: "2026-09-08",
  lede: "These terms cover this website. They do not cover consulting work, which is governed by a separate signed agreement.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [LEGAL_CONTACT],
    },
    {
      heading: "What this site is",
      paragraphs: [
        "This site describes Angeronia Labs and the work it does. It is provided for information. Using it means accepting these terms; if you do not accept them, please do not use the site.",
      ],
    },
    {
      heading: "Nothing here is an offer or a contract",
      paragraphs: [
        "Descriptions of services, process, availability and commercial terms on this site — including anything said about low-bono or deferred-fee work for early ventures — are a description of how we generally like to work. They are not an offer, they do not bind either of us, and they create no obligation until there is a written agreement signed by both parties. That agreement, not this site, sets the scope, the fees and the terms of any engagement.",
      ],
    },
    {
      heading: "Accuracy",
      paragraphs: [
        "We try to keep this site correct and current, and we make no promise that it is. Client work, figures and availability change. Nothing here is professional, legal, financial or technical advice for your situation.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "The text, design and code of this site belong to Angeronia Labs LLC, except for third-party components used under their own licences. You may read, link to and quote the site with attribution. You may not present it as your own or reuse the design wholesale.",
        "Names and marks of other organisations appearing on this site belong to their owners and are used to identify them, not to imply endorsement.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: [
        "We link to sites we do not control and are not responsible for what is on them.",
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        "The site is provided as it is, without warranty of any kind, express or implied. We do not promise it will be uninterrupted or error-free.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the fullest extent the law allows, Angeronia Labs LLC is not liable for any indirect, incidental or consequential loss arising from your use of this site. Nothing in these terms limits liability that cannot lawfully be limited.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of the Commonwealth of Pennsylvania, without regard to its conflict-of-law rules.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "We may revise these terms; the date at the top says when they last changed. Continuing to use the site after a change means accepting the revised terms.",
      ],
    },
  ],
};

export const legalDocuments: LegalDocument[] = [privacyPolicy, termsOfService];

// ── Footer ────────────────────────────────────────────────────────────────────
export const footer = {
  tagline: "A software engineering studio in Philadelphia.",
  columns: [
    {
      title: "Studio",
      links: [
        { label: "Services", href: "#services" },
        { label: "Process", href: "#process" },
        { label: "About", href: "#about" },
      ],
    },
    {
      title: "Products",
      links: [{ label: "Code Socratic", href: LINKS.codeSocratic, external: true }],
    },
    {
      title: "Elsewhere",
      links: [
        { label: "Email", href: LINKS.calendar },
        { label: "LinkedIn", href: LINKS.linkedin, external: true },
        { label: "GitHub", href: LINKS.github, external: true },
      ],
    },
  ],
  legal: [
    { label: privacyPolicy.title, href: `/${privacyPolicy.slug}` },
    { label: termsOfService.title, href: `/${termsOfService.slug}` },
  ],
  copyrightLeft: "© 2026 Angeronia Labs LLC. All rights reserved.",
  copyrightRight: "Built with responsible AI practices.",
} as const;
