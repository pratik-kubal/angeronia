// Single source of truth for angeronia.com, the Angeronia Labs studio site.
// Every string the site renders lives here (DESIGN-RULES.md §13); components
// take content from here or as props and never inline copy of their own.
//
// The voice is the third person (ADR-028): no "I", "me", "my", "we", "our" or
// "us" in what the studio says about itself, and no pronoun for Pratik at all.
// "You" is the reader. Product UI inside the Code.Socratic replica
// (`productDemo`) and the legal documents' "we" are outside that rule.
// The words come from the copy deck the owner approved for the spine
// (`.taste-skill/round2/copy-v2.md`, kept outside git).

/** Chrome and control labels: the strings that are not page content. */
export const copy = {
  skipLink: "Skip to main content",
  /** After the name of a link that opens in a new tab, for assistive tech only. */
  externalLink: "(opens in a new tab)",
  /** Before a legal document's date. */
  lastUpdated: "Last updated",
} as const;

/** The canonical origin. Used by metadata, robots.txt and the sitemap. */
export const SITE_URL = "https://angeronia.com";

export const BRAND = {
  name: "Angeronia Labs",
  legal: "Angeronia Labs LLC",
  city: "Philadelphia, PA",
} as const;

/**
 * The email the buttons prepare: the subject already written, and three
 * prompts that are the first step of Discover. The prompts carry no "I": they
 * sit in the page's markup.
 */
const PROJECT_EMAIL =
  "mailto:pratik-kubal@outlook.com?subject=A%20project%20for%20Angeronia%20Labs&body=The%20project%3A%0A%0A%0AWhere%20it%20stands%20now%3A%0A%0A%0AWhen%20it%E2%80%99s%20needed%3A%0A";

export const LINKS = {
  email: "pratik-kubal@outlook.com",
  emailHref: "mailto:pratik-kubal@outlook.com",
  /** The product's own address. code-socratic.angeronia.com returns 404. */
  codeSocratic: "https://www.code-socratic.com",
  linkedin: "https://www.linkedin.com/company/angeronia",
  github: "https://github.com/pratik-kubal",
} as const;

// ── The page, as search engines and link previews see it ─────────────────────
export const site = {
  /** `<title>` on the home page; Privacy and Terms use "%s | Angeronia Labs". */
  title: "Angeronia Labs, a software engineering studio in Philadelphia",
  titleTemplate: "%s | Angeronia Labs",
  /** The meta description, also the Open Graph and Twitter description. */
  description:
    "Angeronia Labs is Pratik Kubal’s software engineering studio in Philadelphia: AI features, cloud backends and full-stack products, built by one engineer.",
  /** The JSON-LD `ProfessionalService` description. */
  structuredDescription:
    "Angeronia Labs is Pratik Kubal’s software engineering studio in Philadelphia: AI features, cloud backends and full-stack products, built by one engineer from the screen to the server. The studio also makes Code.Socratic, a tutor for coding interviews.",
  /** Open Graph and Twitter title. */
  shareTitle: "Angeronia Labs",
  keywords: [
    "Angeronia Labs",
    "software engineering studio",
    "Philadelphia software studio",
    "AI engineering",
    "LLM product engineering",
    "AWS microservices",
    "Next.js",
    "Code.Socratic",
    "FinTech engineering",
  ],
  founder: "Pratik Kubal",
  product: "Code.Socratic",
  /** The rest of the JSON-LD that app/layout.tsx renders into every page. */
  structured: {
    areaServed: "Worldwide",
    address: { locality: "Philadelphia", region: "PA", country: "US" },
    knowsAbout: [
      "AI/LLM product engineering",
      "AWS microservices",
      "Next.js",
      "FinTech",
      "DevOps",
      "Cloud architecture",
    ],
    productCategory: "EducationalApplication",
  },
} as const;

/** The social card (app/opengraph-image.tsx): its text, and nothing else. */
export const shareImage = {
  wordmark: "Angeronia Labs",
  foot: "Philadelphia, PA",
  alt: "Angeronia Labs. One engineer, screen to server. Philadelphia, PA.",
} as const;

// ── Statements on the spine ──────────────────────────────────────────────────
/**
 * One line of a statement set on the spine (DESIGN-RULES.md §7):
 * * `cross` — split at the axis: the left part ends on it, the right starts
 *   after it. At rest the two meet with a word space and hide the line.
 * * `hang` — starts just right of the axis.
 * * `push` — starts further past the axis.
 * * `centre` — centred on the axis (the process steps' names).
 *
 * The words are the copy; the split is where the deck breaks them
 * (copy-v2.md §3). Read in order, a statement's lines are one sentence.
 */
export type StatementLine =
  | { readonly cross: readonly [string, string] }
  | { readonly hang: string }
  | { readonly push: string }
  | { readonly centre: string };

/** A statement's lines, joined back into the sentence they read as. */
export function statementText(lines: readonly StatementLine[]): string {
  return lines
    .map((line) =>
      "cross" in line ? line.cross.join(" ") : "hang" in line ? line.hang : "push" in line ? line.push : line.centre,
    )
    .join(" ");
}

// ── Masthead ─────────────────────────────────────────────────────────────────
export const nav = {
  label: "Sections",
  items: [
    { label: "Services", hash: "#services" },
    { label: "Code.Socratic", hash: "#code-socratic" },
    { label: "Process", hash: "#process" },
    { label: "About", hash: "#about" },
  ],
  action: { label: "Email the studio", href: PROJECT_EMAIL },
} as const;

// ── Hero ─────────────────────────────────────────────────────────────────────
export const hero = {
  /** The owner's headline (ADR-023). */
  headline: "One engineer, screen to server",
  lines: [{ hang: "One engineer," }, { cross: ["screen", "to server"] }],
  lead: "Angeronia Labs is Pratik Kubal’s software engineering studio in Philadelphia. It builds AI features, cloud backends and full-stack products.",
  action: { label: "Email the studio", href: PROJECT_EMAIL },
} as const satisfies { lines: readonly StatementLine[] } & Record<string, unknown>;

// ── Belief: the one charcoal band, held ──────────────────────────────────────
export const belief = {
  lines: [{ cross: ["The only", "hand-off"] }, { push: "is to you" }],
  yours: "You bring the problem and the business goal.",
  mine: "The person who scopes it writes it, so nothing is lost between the plan and the code.",
} as const satisfies { lines: readonly StatementLine[] } & Record<string, unknown>;

// ── Services ─────────────────────────────────────────────────────────────────
export interface ServiceArea {
  /** The area's name, set on the spine at heading size. */
  lines: readonly StatementLine[];
  /** Your side: what the reader needs. */
  yours: string;
  /** The studio's side: what gets built. */
  mine: string;
  /** Its four parts, each a list item. */
  parts: readonly string[];
}

export const services = {
  /** A short left half, so the pull opens wide on both sides (ADR-033). */
  lines: [{ cross: ["What", "the studio"] }, { hang: "takes on" }],
  intro:
    "One engineer covers the backend, the frontend, the cloud and the model, so your project never changes hands as it crosses them.",
  partsLabel: "Parts",
  areas: [
    {
      lines: [{ cross: ["AI & LLM", "product engineering"] }],
      yours: "An agent your users can trust with real work.",
      mine: "The studio builds the loop, its tools and guardrails, and the evals that check it on the server.",
      parts: ["Agent loops", "Tool use and guardrails", "Server-verified evals", "Token economics"],
    },
    {
      lines: [{ hang: "Cloud & microservices" }],
      yours: "A backend that holds up under load and under audit.",
      mine: "It runs on AWS as infrastructure as code, and its migrations run without downtime.",
      parts: ["AWS", "Step Functions", "Zero-downtime migrations", "Infrastructure as code"],
    },
    {
      lines: [{ cross: ["Full-stack", "product builds"] }],
      yours: "A whole product, from the first commit to the first customer.",
      mine: "It is built in Next.js and React on Postgres, multi-tenant from day one.",
      parts: ["Next.js and React", "Auth and billing", "Postgres", "Multi-tenant from day one"],
    },
    {
      lines: [{ push: "Platform reliability" }],
      yours: "Releases that land when planned and stay up after they do.",
      mine: "The studio sets up CI/CD and test coverage, rate limits and moderation, and load tests.",
      parts: ["CI/CD", "Test coverage", "Rate limits and moderation", "Load tests"],
    },
  ] satisfies ServiceArea[],
} as const;

// ── Showcase: Code.Socratic ──────────────────────────────────────────────────
export interface ProductLayer {
  /** Your side: the layer's name. */
  name: string;
  /** The studio's side: what it does… */
  does: string;
  /** …and one real detail, in the secondary ink. */
  detail: string;
}

export const showcase = {
  /** The owner's heading (ADR-033), set like the hero's: the name hangs, "built | alone" crosses. */
  lines: [{ hang: "Code.Socratic," }, { cross: ["built", "alone"] }],
  yours: "Code.Socratic is a tutor for coding interviews.",
  mine: "It reads the code you actually wrote, asks you to explain it out loud, then pushes back.",
  session:
    "A session runs in three phases, Approach, Complexity and Code, with one hint at a time and a score weighted by difficulty.",
  /** Under the replica. Says what it is; states no test result (the owner's ruling). */
  caption:
    "A replica of a Code.Socratic session: “Widest Water Between Posts”, in Python. The tabs work; nothing else here runs.",
  cta: { label: "Try Code.Socratic", href: LINKS.codeSocratic },
  layersLead: "Every layer, from the screen down to the server, is one engineer’s work.",
  layers: [
    {
      name: "Interface",
      does: "Your editor, with tabs for the tutor, the instructions, the tests and the results.",
      detail: "Next.js. Run Tests is ⌘⏎; Submit is ⇧⌘⏎.",
    },
    {
      name: "Tutor",
      does: "Reads your code, asks you to explain it, and gives one hint at a time.",
      detail: "Built on the Claude Agent SDK. From a session: “Why the shorter one? Say what you throw away when you move it.”",
    },
    {
      name: "Sandboxed runner",
      does: "Runs your code against hidden tests, on the server, inside a sandbox.",
      detail: "E2B. Reference solutions and hidden outputs never leave the server.",
    },
    {
      name: "Data and payments",
      does: "Keeps your score, weighted by difficulty, and takes payment.",
      detail: "Drizzle on Neon Postgres, and Stripe.",
    },
    {
      name: "Deploy",
      does: "Builds every part from one repository and puts it on the web.",
      detail: "Turborepo. Live at www.code-socratic.com.",
    },
  ] satisfies ProductLayer[],
} as const;

// ── Code.Socratic replica ─────────────────────────────────────────────────────
// The session workspace from `../code-socratic`
// (`apps/web/components/SessionPreview.tsx`), carried over as content: the same
// problem, the same exchange, the same run, rebuilt from this site's own CSS in
// the product's own light theme (ADR-014, ADR-023). Product UI: its words stay
// as the product shows them, the user's "I" and the Results tab included. One
// turn is the owner's: "Done. The tests pass." states no figures (ADR-033).

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
  tabsLabel: "Session panels",
  /** Names for assistive tech, from the draft. */
  editorLabel: "The editor, with the solution",
  chatLabel: "The exchange",
  /** After a phase's name, for assistive tech only. */
  phaseDone: " (complete)",
  phaseNow: " (in progress)",
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
    { who: "You", said: "Done. The tests pass." },
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
      { label: "Sample tests", value: "2\u00a0/\u00a02" },
      { label: "Hidden tests", value: "7\u00a0/\u00a07" },
      { label: "Elapsed", value: "84\u00a0ms" },
    ],
    note: "Hidden probes cover the wide container, a monotonic run, and the empty and single-post edges. Reference solutions and hidden outputs never leave the server.",
  },
} as const;

// ── Process ──────────────────────────────────────────────────────────────────
export interface ProcessStep {
  /** Centred on the spine. */
  name: string;
  /** Your side: what you do. */
  yours: string;
  /** The studio's side: what the studio does. */
  mine: string;
}

export const projectProcess = {
  lines: [{ cross: ["How a", "project runs"] }],
  intro:
    "Each step ends in something you can check: the problem in writing, a roadmap, a demo every week, and the runbook.",
  steps: [
    {
      name: "Discover",
      yours: "You describe the problem in your own words.",
      mine: "The studio writes the ambiguity down until it’s testable.",
    },
    {
      name: "Architect",
      yours: "You read the roadmap and approve it.",
      mine: "No code is written until you do.",
    },
    {
      name: "Build",
      yours: "You see a demo every week.",
      mine: "The code lands in stages, behind feature flags, with tests.",
    },
    {
      name: "Hand off",
      yours: "You keep the tests, the docs and the runbook.",
      mine: "The studio walks you through it, trains whoever runs it next, then steps back.",
    },
  ] satisfies ProcessStep[],
} as const;

// ── About ────────────────────────────────────────────────────────────────────
export const about = {
  lines: [{ cross: ["Who", "you’d work with"] }],
  yours: "Pratik Kubal is a full-stack software engineer.",
  mine: "Behind the studio: five years of document AI for FinTech, on AWS, and an M.S. in Machine Learning from the University at Buffalo.",
  /** A statement paragraph on the spine from 1100px up; a lead paragraph below. */
  statement: [
    { cross: ["Right now", "Angeronia Labs is one person,"] },
    { cross: ["so every line of your", "project is Pratik’s to answer for."] },
  ],
} as const satisfies { lines: readonly StatementLine[]; statement: readonly StatementLine[] } & Record<string, unknown>;

// ── Games ─────────────────────────────────────────────────────────────────────
/**
 * One game, as both launchers show it: the home page's section (ADR-020) and
 * the /games home screen (ADR-021). A new game is one more entry here, plus its
 * route at `app/games/<slug>/` with its `apple-icon.png`.
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

/** The home page's Games section (ADR-020), on the spine. */
export const gamesSection = {
  lines: [{ cross: ["Games", "for a break"] }],
  intro: "Made by the studio, off the clock. Save any of them to a phone’s home screen.",
} as const satisfies { lines: readonly StatementLine[] } & Record<string, unknown>;

// ── Contact ──────────────────────────────────────────────────────────────────
export const contact = {
  /** A short left half, so the pull opens wide on both sides (ADR-033). */
  lines: [{ cross: ["Tell", "Pratik what"] }, { hang: "you’re building" }],
  yours: "Write a few lines: what you’re building, where it stands, and when you need it.",
  mine: "It comes straight to the person who would write it.",
  action: { label: "Email the studio", href: PROJECT_EMAIL },
  address: { label: LINKS.email, href: LINKS.emailHref },
  links: [
    { label: "LinkedIn", href: LINKS.linkedin },
    { label: "GitHub", href: LINKS.github },
  ],
} as const satisfies { lines: readonly StatementLine[] } & Record<string, unknown>;

// ── Footer: the name, and the company ────────────────────────────────────────
export interface Photograph {
  /** Served from `public/`. */
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

/** One picture's credit, as its licence asks: title, author, licence, source. */
export interface PictureCredit {
  title: string;
  href: string;
  /** Who made it, with the word before the name. */
  by: string;
  licence: string;
  licenceHref: string;
}

export const footer = {
  lines: [{ hang: "Angeronia Labs LLC" }],
  statue: {
    src: "/name/angerona-schonbrunn.jpg",
    width: 800,
    height: 1308,
    alt: "A marble statue of Angerona, a draped woman raising one finger to her lips, against autumn trees",
    caption: "Angerona, marble, Wilhelm Beyer or his workshop, 1773–1780. Schönbrunn Palace Park, Vienna.",
  } satisfies Photograph,
  note: "Angeronia is the Roman goddess shown with a finger to her sealed lips. Her festival, the Divalia, fell on 21 December.",
  calendar: {
    src: "/name/fasti-antiates.jpg",
    width: 1200,
    height: 800,
    alt: "Fragments of a Roman calendar painted on plaster, with the names of festivals in red and black capitals between ruled columns",
    caption: "Fasti Antiates, a Roman calendar painted on plaster, 84–55 BC. Palazzo Massimo alle Terme, Rome.",
  } satisfies Photograph,
  city: BRAND.city,
  linksLabel: "Elsewhere",
  links: [
    { label: "Code.Socratic", href: LINKS.codeSocratic, external: true },
    { label: "LinkedIn", href: LINKS.linkedin, external: true },
    { label: "GitHub", href: LINKS.github, external: true },
    { label: "Privacy", href: "/privacy", external: false },
    { label: "Terms", href: "/terms", external: false },
  ],
  email: { label: LINKS.email, href: LINKS.emailHref },
  copyright: "© 2026 Angeronia Labs LLC",
  credits: {
    lead: "Pictures:",
    items: [
      {
        title: "“N06 Angerona, Schönbrunn (03)”",
        href: "https://commons.wikimedia.org/wiki/File:N06_Angerona,_Sch%C3%B6nbrunn_(03).jpg",
        by: "by Herzi Pinki",
        licence: "CC BY-SA 4.0",
        licenceHref: "https://creativecommons.org/licenses/by-sa/4.0",
      },
      {
        title: "“Fasti annales, calendario numano, pannello maggiore dei Fasti Antiates”",
        href: "https://commons.wikimedia.org/w/index.php?curid=190319693",
        by: "by Fabrizio Garrisi",
        licence: "CC0",
        licenceHref: "https://creativecommons.org/publicdomain/zero/1.0/",
      },
    ] satisfies PictureCredit[],
    tail: "both via Wikimedia Commons.",
  },
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
  updated: "25 November 2026",
  updatedIso: "2026-11-25",
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
        "The studio’s pages store nothing in your browser. The games under /games keep your progress and settings in your browser’s local storage, so a game can pick up where you left off. That stays on your device, is never transmitted to us, and clearing your site data removes it.",
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
        "The typefaces, Hanken Grotesk and IBM Plex Mono, are served from this domain rather than from a font CDN, so loading a page makes no request to Google or any other third party. Following a link off the site is the only way your browser contacts someone else.",
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
        "We link to LinkedIn, GitHub and Code.Socratic, and, in the photographs’ credits, to Wikimedia Commons and Creative Commons. Once you follow one of those links you are on someone else's site under someone else's policy, and this one no longer applies.",
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
        "Descriptions of services, process, availability and commercial terms on this site are a description of how we generally like to work. They are not an offer, they do not bind either of us, and they create no obligation until there is a written agreement signed by both parties. That agreement, not this site, sets the scope, the fees and the terms of any engagement.",
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
