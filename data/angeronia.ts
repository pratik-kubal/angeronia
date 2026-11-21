// Single source of truth for angeronia.com. Every string the studio pages
// render lives here; components take content from this file and never inline
// copy of their own.
//
// Lines marked [CONFIRM] are the owner's to verify before the pull request
// merges. The list is in docs/plans/monument-redesign/README.md, section 7.

/** Chrome and control labels: the strings that are not page content. */
export const copy = {
  skipLink: "Skip to main content",
  externalLink: "opens in a new tab",
  navLabel: "Primary",
  footerNavLabel: "Site",
  proofLegend: "Choose a claim to see it in the product",
  updated: "Last updated",
} as const;

/** The canonical origin. Used by metadata, robots.txt and the sitemap. */
export const SITE_URL = "https://angeronia.com";

export const BRAND = {
  name: "Angeronia Labs",
  legal: "Angeronia Labs LLC",
  domain: "angeronia.com",
  founder: "Pratik Kubal",
  city: "Philadelphia, PA", // [CONFIRM: city and state as displayed]
} as const;

interface Links {
  email: string;
  /** null until a booking page exists; "Book a call" then opens an email draft. */
  booking: string | null;
  demoVideo: string | null;
  writeUp: string | null;
  sampleHandoff: string | null;
  repos: string | null;
  codeSocratic: string;
  codeSocraticBuild: string | null;
  linkedin: string;
  github: string;
}

export const LINKS: Links = {
  email: "pratik-kubal@outlook.com", // [CONFIRM: the address to publish]
  booking: null, // [CONFIRM: booking link, tested]
  demoVideo: null, // [CONFIRM: recorded and hosted]
  writeUp: null, // [CONFIRM: optional] the credit ledger, model routing and token economics
  sampleHandoff: null, // [CONFIRM: optional] redacted sample handoff document and eval plan
  repos: null, // [CONFIRM: optional] only if clean
  codeSocratic: "https://www.code-socratic.com/",
  codeSocraticBuild: null, // [CONFIRM: optional] "Read how it’s built"
  linkedin: "https://www.linkedin.com/company/angeronia",
  github: "https://github.com/pratik-kubal",
};

const BOOKING_MAILTO = `mailto:${LINKS.email}?subject=${encodeURIComponent(
  "20-minute call",
)}&body=${encodeURIComponent("The workflow I want an agent to run:\n\n")}`;

/** Where every "Book a call" goes: the booking page, or an email draft until there is one. */
export const bookingHref: string = LINKS.booking ?? BOOKING_MAILTO;

export interface Cta {
  label: string;
  href: string;
}

// ── Search and sharing ────────────────────────────────────────────────────────
export const seo = {
  title: "Angeronia Labs | Fixed-scope AI agents on Claude",
  description:
    "Production AI agents for small software teams. Fixed scope and price, acceptance measured against your evals, cost per task known up front.",
  ogTitle: "A working AI agent in three weeks",
  ogDescription: "Fixed price. Eval-gated delivery. Cost modelled before launch.",
  ogImageAlt:
    "Angeronia Labs, set in tall capitals over the Philadelphia skyline at night.",
} as const;

// ── Header ────────────────────────────────────────────────────────────────────
export const nav = {
  items: [
    { label: "Offers", href: "#offers" },
    { label: "Proof", href: "#proof" },
    { label: "Process", href: "#process" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: { label: "Book a call", href: bookingHref } satisfies Cta,
} as const;

// ── Hero ──────────────────────────────────────────────────────────────────────
export const hero = {
  /** The h1, fitted to the full width of the first screen. */
  name: BRAND.name,
  /** The owner's headline, set as the sentence above the name. */
  statement:
    "A working AI agent in your stack in three weeks. Tested, cost-modelled, handed off.",
  primaryCta: { label: "Book a 20-minute call", href: bookingHref } satisfies Cta,
  /** Not rendered until the video exists. */
  secondaryCta: (LINKS.demoVideo
    ? { label: "Watch the 90-second demo", href: LINKS.demoVideo }
    : null) as Cta | null,
  photo: {
    alt: "The Philadelphia skyline at night from the South Street Bridge, its lights reflected in the Schuylkill River.",
  },
} as const;

/** The credit CC BY 2.0 requires: title, author, licence, and that the picture was changed. */
export const photoCredit = {
  // [CONFIRM: the lit "WSFS Bank" sign. Left as it is, or dimmed, and then "cropped and retouched".]
  text: "“Philadelphia Skyline” by Andrew Parlette, cropped",
  href: "https://commons.wikimedia.org/w/index.php?curid=135482068",
  license: "CC BY 2.0",
  licenseHref: "https://creativecommons.org/licenses/by/2.0/",
} as const;

// ── Who you are hiring ────────────────────────────────────────────────────────
export const intro = {
  heading: "I’m Pratik, a solo AI engineer in Philadelphia.", // [CONFIRM: city, as BRAND.city]
  paragraphs: [
    "I build Claude-based agents for small software teams at a fixed scope and price, accepted against an eval set you approve.",
    "I recently built a Socratic coding tutor end to end, with sandboxed code execution, hidden-test verification and per-user usage metering.",
    "I bring the same discipline to your workflow.",
  ],
  factsLabel: "The terms, in four lines",
  /** Each must be literally true on the day a contract is signed. */
  facts: [
    "Built on the Claude API",
    "Fixed price: 50% deposit, 50% on acceptance", // [CONFIRM: terms]
    "You own the code, assigned on final payment", // [CONFIRM: contract template]
    "Delivery gated by evals",
  ],
} as const;

// ── Why agent projects stall ──────────────────────────────────────────────────
export interface Problem {
  title: string;
  body: string;
}

export const problems = {
  heading: ["Why agent", "projects stall"],
  items: [
    {
      title: "The demo works. Production doesn’t.",
      body: "There is no eval set, so nobody knows whether the agent is getting better or worse.",
    },
    {
      title: "The bill is a surprise.",
      body: "Nobody modelled cost per task, so margins erode after launch.",
    },
    {
      title: "Nobody owns it.",
      body: "The prototype sits in a branch because the team is busy shipping the core product.",
    },
  ] satisfies readonly Problem[],
  bridge: "I scope around these three problems from day one.",
} as const;

// ── Offers ────────────────────────────────────────────────────────────────────
/** Every figure on the page comes from this block. Change a price here and nowhere else. */
export const PRICES = {
  mvpRange: "$6,000 to $8,000", // [CONFIRM: price; $7K is the working placeholder]
  changeRequestRate: "$150 an hour", // [CONFIRM: rate]
  // [CONFIRM: tiers. They assume roughly $140 an hour; do not publish a range
  // that quietly discounts the top tier.]
  fractional: [
    { hours: "About 7 hours a week", price: "from $4,000 a month" },
    { hours: "About 10 hours a week", price: "from $6,000 a month" },
    { hours: "About 15 hours a week", price: "from $9,000 a month" },
  ],
  sprint: "$1,800", // [CONFIRM: price, and whether to offer it]
} as const;

export interface Offer {
  id: "mvp" | "fractional" | "sprint";
  name: string;
  /** The price as one sentence. */
  priceLabel: string;
  cadence?: string;
  tiers?: readonly { hours: string; price: string }[];
  body?: string;
  bullets?: readonly string[];
  bestFor: string;
  notIncluded?: string;
}

export const offers = {
  intro:
    "Three ways to work together. Prices are shown up front so you can decide before we talk.",
  /** The lead offer as one sentence. Line one, then the price on its gold block. */
  headline: { line: "One agent, three weeks,", price: PRICES.mvpRange },
  labels: { included: "Included", bestFor: "Best for", notIncluded: "Not included" },
  items: [
    {
      id: "mvp",
      name: "3-week agent MVP",
      priceLabel: `Typically ${PRICES.mvpRange}, fixed price.`,
      bullets: [
        "One agent workflow, up to two tool integrations",
        "About 20 eval cases and an agreed pass threshold",
        "Deployed in your environment",
        "Handoff document and one revision round",
        "Cost-per-task model, including where model routing can cut spend",
      ],
      bestFor: "You know the workflow you want automated and need it working.",
      notIncluded: `Ongoing operations, model and API costs (you use your own key), UI beyond basic, extra integrations. Change requests are ${PRICES.changeRequestRate}.`,
    },
    {
      id: "fractional",
      name: "Fractional AI engineer",
      priceLabel: "Prepaid monthly. One-month minimum, then 30 days’ notice.",
      tiers: PRICES.fractional,
      body: "For ongoing agent work, eval improvement and cost tuning, often after an MVP. You get a senior builder on your roadmap for a set number of hours a week.",
      bestFor: "You have a roadmap of AI work and no one with the hours to own it.",
    },
    {
      id: "sprint",
      name: "AI engineering sprint",
      priceLabel: `${PRICES.sprint}, one week, about 12 hours.`,
      bullets: [
        "Architecture review and risk list",
        "A working spike of the riskiest part",
        "An eval plan",
        "Credited toward an MVP if you sign within 14 days",
      ],
      bestFor:
        // [CONFIRM: optional. In quotation marks this can read as a client quote.]
        "“We’re not sure it’s feasible or what it would cost.” Not ready for an MVP yet? Start here.",
    },
  ] satisfies readonly Offer[],
  after: {
    text: "Not sure which fits? Book 20 minutes and I’ll tell you.",
    cta: { label: "Book a call", href: bookingHref } satisfies Cta,
  },
} as const;

// ── Proof of work ─────────────────────────────────────────────────────────────
export type ProofPanelId = "talk" | "run" | "credits" | "boundary";

export interface ProofClaim {
  id: string;
  built: string;
  relevance: string;
  /** The product panel that shows it. null: the claim has no public panel. */
  panel: ProofPanelId | null;
}

export const proof = {
  heading: "Proof of work",
  intro:
    "I don’t have client logos yet. Here is something better to evaluate: a complete product I designed and built alone, and what it shows about how I’d build yours.",
  claims: [
    {
      id: "tutor",
      built:
        "A Socratic tutor agent that gives one hint at a time and holds the answer back until you have missed three times, through a structured Approach, Complexity, Code flow",
      relevance:
        "Deciding what an agent withholds, and when, is harder than making it answer. It is the same discipline as guardrails and workflow state.",
      panel: "talk",
    },
    {
      id: "tests",
      built:
        "Server-verified hidden tests in a sandboxed runner (browser IDE, cloud execution)",
      // [CONFIRM: true for library problems. For a problem the tutor builds, the model writes
      // the hidden tests itself (build_harness). Keep, or narrow it.]
      relevance:
        "Verification the model cannot see or game. It is the same principle as eval design: the agent never grades itself.",
      panel: "run",
    },
    {
      id: "credits",
      built:
        "Difficulty-weighted credit metering: credits are held when a problem starts and settled when it ends, with support refunds and an auditable ledger",
      relevance: "Usage-based AI needs a cost-control layer from day one. I have built one.",
      panel: "credits",
    },
    {
      id: "cost",
      built:
        "Per-turn token and cost telemetry, and model routing that can be switched per difficulty",
      relevance: "Cost per task is designed, not discovered.",
      panel: null,
    },
    {
      id: "data",
      built:
        "A data layer where reference solutions and expected outputs never reach the browser",
      relevance: "Security and data-boundary thinking applied to an agent system.",
      panel: "boundary",
    },
  ] satisfies readonly ProofClaim[],
  /** Each is rendered only when its URL exists. */
  assets: [
    { label: "Watch the 90-second demo", href: LINKS.demoVideo },
    {
      label: "Read the write-up: credit ledger, model routing, token economics",
      href: LINKS.writeUp,
    },
    { label: "See a sample handoff document and eval plan", href: LINKS.sampleHandoff },
    { label: "Read the code on GitHub", href: LINKS.repos },
  ] as { label: string; href: string | null }[],
  disclaimer: "Angeronia Labs is independent and not affiliated with Anthropic.",
} as const;

/**
 * The product panels, word for word from Code.Socratic's own public pages
 * (/how-it-works, /pricing and the landing page, read on 2026-11-20). Do not
 * edit a string here unless the product changed it first. "AI tutor" is never
 * shortened to "Tutor".
 */
export const proofPanels = {
  speakers: { user: "You", tutor: "AI tutor" },
  talk: {
    caption: "Code.Socratic: the tutor asks for the plan, then for its cost.",
    stages: [
      {
        name: "Approach",
        turns: [
          { who: "user", said: "Two pointers, one at each end. I move the shorter post inward." },
          { who: "tutor", said: "Why the shorter one?" },
        ],
        note: "Hints used: 0. The editor stays locked.",
      },
      {
        name: "Complexity",
        turns: [
          { who: "user", said: "O(n²) time, O(1) space." },
          { who: "tutor", said: "How many times is each index visited?" },
        ],
        note: "Hint 1 recorded. No correction, only questions.",
      },
    ],
  },
  run: {
    caption: "Code.Socratic: the run step, with two of nine tests still failing.",
    name: "Code",
    code: {
      before: "def max_area(h):\n    left, right = 0, len(h) - 1\n",
      current: "    while left < right:",
      after: "        ...",
    },
    tests: { passed: 7, total: 9 },
    note: "7 of 9 tests passed. The expected outputs stay on the server.",
  },
  credits: {
    caption: "Code.Socratic: what one problem costs, by difficulty.",
    label: "What one problem costs",
    steps: [
      { name: "Easy", cost: "1 credit", weight: 1 },
      { name: "Medium", cost: "2 credits", weight: 2 },
      { name: "Hard", cost: "4 credits", weight: 4 },
    ],
  },
  boundary: {
    caption: "Code.Socratic: what the tutor says when a test fails.",
    turns: [
      { who: "user", said: "My code fails a test." },
      {
        who: "tutor",
        said: "Which input have you not tried yet? Start with the smallest one you can think of.",
      },
    ],
    trace: [
      "No fix given. The expected output stays on the server.",
      "If you ask for a hint, it is counted.",
    ],
  },
} as const;

// ── Process ───────────────────────────────────────────────────────────────────
export interface ProcessStep {
  /** The bold phrase the paragraph opens with. */
  title: string;
  body: string;
  /** The one figure of the step, set large beside it. */
  fact: string;
}

export const process = {
  heading: "Process",
  steps: [
    {
      title: "20-minute call.",
      body: "You describe the workflow. I tell you honestly whether it is a fit and what a range looks like.",
      fact: "20 minutes",
    },
    {
      title: "Scope and price in 48 hours.",
      body: "A one-page scope: deliverables, eval set, pass threshold, exclusions, fixed price.",
      fact: "48 hours",
    },
    {
      title: "Deposit and kickoff.",
      // [CONFIRM: terms, as intro.facts[1]]
      body: "50% to start. If access to your systems is not ready at kickoff, the clock pauses.",
      fact: "50% to start",
    },
    {
      title: "Weekly demos.",
      body: "You see the agent and the eval results every week, not at the end.",
      fact: "Every week",
    },
    {
      title: "Acceptance and handoff.",
      body: "The agent meets the agreed threshold, the balance is due in 7 days, and I hand over code, docs and a cost model.",
      fact: "7 days",
    },
  ] satisfies readonly ProcessStep[],
} as const;

// ── FAQ ───────────────────────────────────────────────────────────────────────
export interface Faq {
  q: string;
  a: string;
}

export const faq = {
  heading: "FAQ",
  items: [
    {
      q: "Do you have other clients?",
      // [CONFIRM: "a full product you can inspect" holds only if sign-up is open, not waitlisted.]
      a: "Angeronia Labs is new as a consultancy. I don’t have logos to show, and I won’t pretend otherwise. What I have is a full product you can inspect, and terms that tie payment to results you define.",
    },
    {
      q: "Who would I be working with?",
      a: "Me, Pratik Kubal. I have five years of FinTech document-AI on AWS and a Master’s in Machine Learning.",
    },
    {
      q: "What does “accepted” mean?",
      a: "We agree on an eval set and a pass threshold before work starts. Delivery means the agent meets it. I don’t promise perfect AI. I promise a measurable bar.",
    },
    {
      q: "What if it doesn’t meet the threshold?",
      // [CONFIRM: remedy. Do not promise refunds unless you will honour them.]
      a: "One revision round is included. If the threshold is still missed, we scope the gap together before the balance is due.",
    },
    {
      q: "Who owns the code?",
      // [CONFIRM: carve-out wording, with counsel]
      a: "You do, assigned on final payment. The exception is a written carve-out for Code.Socratic and my own tooling, which stay mine.",
    },
    {
      q: "Who pays for model and API usage?",
      a: "You do, on your own API key. I model the expected cost per task during the project, so there are no surprises.",
    },
    {
      q: "Do you only use Claude?",
      // [CONFIRM: "where my production experience is". Nothing on the page shows Claude work in production.]
      a: "Claude is my default and where my production experience is. If a smaller model handles part of the workflow more cheaply, routing between tiers is part of how I would design it.",
    },
    {
      q: "What if my idea isn’t a good fit for an agent?",
      a: "I’ll tell you on the call or in the sprint. A “no” is cheaper for both of us than a failed project.",
    },
    {
      q: "What isn’t included?",
      a: "Ongoing operations, UI beyond basic, integrations beyond the two listed, and model costs.",
    },
    { q: "Can you sign an NDA?", a: "Yes." },
  ] satisfies readonly Faq[],
} as const;

// ── Also from Angeronia Labs ──────────────────────────────────────────────────
export const product = {
  heading: ["Also from", "Angeronia Labs"],
  name: "Code.Socratic",
  blurb:
    // [CONFIRM: "It has a live agent" invites a visit; true only if sign-up is open.]
    "Code.Socratic is an AI coding-interview tutor that teaches by asking, not telling. It has a live agent, a real browser IDE, hidden-test verification and a transparent credit meter, so you always see what you are using.",
  visit: { label: "Visit Code.Socratic", href: LINKS.codeSocratic } satisfies Cta,
  /** Not rendered until the write-up exists. */
  build: (LINKS.codeSocraticBuild
    ? { label: "Read how it’s built", href: LINKS.codeSocraticBuild }
    : null) as Cta | null,
} as const;

// ── The closing ask, and the footer under it ──────────────────────────────────
export const close = {
  /** Two authored lines. Do not let either wrap. */
  heading: ["Have a workflow you want", "an agent to run?"],
  body: "Book 20 minutes. I’ll tell you if it’s a fit, what it would take and roughly what it costs, or I’ll tell you it isn’t.",
  primaryCta: { label: "Book a call", href: bookingHref } satisfies Cta,
  email: { lead: "or email", address: LINKS.email },
  /** The name again, cropped by the bottom edge. Decorative. */
  wordmark: "Angeronia",
} as const;

// ── Games ─────────────────────────────────────────────────────────────────────
/**
 * One game, as the /games launcher shows it (ADR-021). The studio pages no
 * longer list them (ADR-024). A new game is one more entry here, plus its route
 * at `app/games/<slug>/` with its `apple-icon.png`.
 */
export interface Game {
  name: string;
  /** One short line, under the name. Kept to a phrase so a tile stays a tile. */
  line: string;
  href: string;
  /**
   * The game's own Add to Home Screen icon, `app/games/<slug>/apple-icon.png`
   * (180 × 180, full-bleed), served by Next at this URL.
   */
  icon: string;
}

export const games: Game[] = [
  {
    name: "Sudoku",
    line: "Calm and colourful. No losing.",
    href: "/games/sudoku",
    icon: "/games/sudoku/apple-icon.png",
  },
  {
    name: "Solitaire",
    line: "Klondike. Every deal can be won.",
    href: "/games/solitaire",
    icon: "/games/solitaire/apple-icon.png",
  },
  {
    name: "Color Tap",
    line: "Paint by numbers, one tap at a time.",
    href: "/games/paint-by-numbers",
    icon: "/games/paint-by-numbers/apple-icon.png",
  },
];

// ── Legal pages ───────────────────────────────────────────────────────────────
// Plain-language documents, written against what this site actually does: no
// forms that submit anything, no accounts, no analytics, no advertising, no
// cookies. Anything here that stops being true is a bug in the document, not a
// detail. Check it before adding a form, an embed or a measurement script.

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

// [CONFIRM: city, as BRAND.city]
const LEGAL_CONTACT = `Angeronia Labs LLC, Philadelphia, Pennsylvania. Questions about either document go to ${LINKS.email}.`;

// [CONFIRM: both documents speak as "we", the LLC, against the page's "I, never we". Exempt them, or rewrite.]
export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  // [CONFIRM: set both, here and in termsOfService, to the day the redesign merges.]
  updated: "23 November 2026",
  updatedIso: "2026-11-23",
  lede: "This site collects nothing about you. The detail below explains what that means in practice, and the two places where information exists anyway.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [LEGAL_CONTACT],
    },
    {
      heading: "What we do not collect",
      paragraphs: [
        "There are no forms that send anything, no accounts and no sign-in on this site. We run no analytics, no advertising and no tracking of any kind, and we set no cookies. Nothing on these pages profiles you, and nothing is sold or shared, because there is nothing to sell or share.",
      ],
    },
    {
      heading: "What your browser stores",
      // [CONFIRM: this paragraph is new. The old one described the light/dark
      // switch, which no longer exists, and did not mention the games.]
      paragraphs: [
        "The studio pages store nothing. The games at /games keep your game in progress and your settings in your browser’s local storage, so that a reload can resume them. That stays on your device, is never transmitted to us, and clearing your site data removes it.",
      ],
    },
    {
      heading: "What our host records",
      paragraphs: [
        "The site is served by Vercel. Like any web host, Vercel records standard request logs (IP address, user agent, the page requested and the time) to deliver the page and to defend against abuse. We do not use those logs to build a profile of you, and we do not combine them with anything else.",
      ],
    },
    {
      heading: "Fonts and third-party requests",
      paragraphs: [
        "The typefaces and the photograph are served from this domain rather than from a font service or an image host, so loading a page makes no request to Google or any other third party. Following a link off the site is the only way your browser contacts someone else.",
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
        "We link to LinkedIn, GitHub, Code.Socratic, Wikimedia Commons and Creative Commons, and to a booking page when there is one. Once you follow one of those links you are on someone else’s site under someone else’s policy, and this one no longer applies.",
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
  // [CONFIRM: the day the redesign merges, as privacyPolicy.updated]
  updated: "23 November 2026",
  updatedIso: "2026-11-23",
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
        "Descriptions of services, process, prices, availability and commercial terms on this site are a description of how we generally like to work. They are not an offer, they do not bind either of us, and they create no obligation until there is a written agreement signed by both parties. That agreement, not this site, sets the scope, the fees and the terms of any engagement.",
      ],
    },
    {
      heading: "Accuracy",
      paragraphs: [
        "We try to keep this site correct and current, and we make no promise that it is. Prices, figures and availability change. Nothing here is professional, legal, financial or technical advice for your situation.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "The text, design and code of this site belong to Angeronia Labs LLC, except for third-party components and photographs used under their own licences. You may read, link to and quote the site with attribution. You may not present it as your own or reuse the design wholesale.",
        "Names and marks of other organisations appearing on this site belong to their owners and are used to identify them, not to imply endorsement.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: ["We link to sites we do not control and are not responsible for what is on them."],
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
  /** In-page links, repeated here because the header hides them on a phone. */
  page: nav.items,
  links: [
    { label: "Email", href: `mailto:${LINKS.email}`, external: false },
    { label: "Code.Socratic", href: LINKS.codeSocratic, external: true },
    { label: "LinkedIn", href: LINKS.linkedin, external: true },
    { label: "GitHub", href: LINKS.github, external: true },
    { label: privacyPolicy.title, href: `/${privacyPolicy.slug}`, external: false },
    { label: termsOfService.title, href: `/${termsOfService.slug}`, external: false },
  ],
  legal: [
    `${BRAND.legal}, ${BRAND.city}`,
    "© 2026 Angeronia Labs LLC",
    "Independent and not affiliated with Anthropic",
  ],
} as const;
