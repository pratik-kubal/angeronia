# Plan: angeronia.com as a consulting credibility page ("the name as a monument")

**Owner:** Pratik (Angeronia Labs LLC) · **Written:** 2026-11-20 · **Branch:** `redesign/monument`
**Status:** design and decisions are settled. Nothing below is built yet.

This folder is the whole brief. An implementing agent reads this file, then
[`content.md`](content.md) and [`design.md`](design.md), then its own phase file,
and should need nothing else. Do not make design decisions while implementing.
If something is not specified, stop and say so in your report; do not improvise.

| File | What it holds |
|---|---|
| `README.md` | Goal, decisions, architecture, phases, gates, the owner's checklist. |
| [`content.md`](content.md) | Every word on the page, and the complete target `data/angeronia.ts`. |
| [`design.md`](design.md) | Tokens, type, grid, each section on desktop and phone, motion, accessibility. |
| [`phase-a-foundation.md`](phase-a-foundation.md) | One agent. Carbon comes out, the new base goes in, the games are proved untouched. |
| [`phase-b-sections.md`](phase-b-sections.md) | Six agents in parallel, one group of sections each. |
| [`phase-c-integration.md`](phase-c-integration.md) | One agent. Metadata, images, legal copy, documents, CI. |
| [`phase-d-review.md`](phase-d-review.md) | The orchestrating session, not a subagent. Inspector, screenshots, fixes, pull request. |
| `reference/draft.html` | The draft the owner chose, for proportions only. It is not the specification; where it differs from `design.md`, `design.md` wins. Its picture paths do not resolve from this folder. |

---

## 1. Goal

Turn angeronia.com into the page every DM, proposal and profile links to, so a
founder or CTO can decide in 60 seconds whether to book a call.

**Positioning (judge every line against it):** Angeronia Labs builds production
AI agents on the Claude API for small software teams, with fixed scope,
acceptance measured against evals, and cost per task known before launch.

**Reader:** technical founders, CTOs and engineering leads at software companies
of about 5 to 50 people.

**Voice:** plain verbs, short sentences, specifics instead of adjectives. "I",
never "we". Banned: revolutionary, cutting-edge, 10x, transform, "AI-powered
solutions". No em dashes or en dashes in visible copy; use a full stop, a comma
or "to".

**One action:** book a call. No newsletter, no "learn more" maze.

---

## 2. Decisions

### 2.1 Made by the owner on 2026-11-20

| # | Decision | Outcome |
|---|---|---|
| O1 | Design system | **Break away from IBM Carbon.** The `design-taste-frontend` skill sets the look. Carbon's components, tokens, icons and IBM Plex leave the studio pages. |
| O2 | Direction | **"The name as a monument"**, dealt by the skill (seed 54426271), chosen from built drafts. |
| O3 | Typeface | **Imbue** (capitals) for the name and titles, **Albert Sans** for text. Redrawn from the dealt Epilogue by the owner after a side-by-side comparison. |
| O4 | Palette | The dealt **"Warm black, gold"**: `#0c0a08` ground, white ink, `#c9a45a` gold. |
| O5 | First-screen photograph | Andrew Parlette's night view from the South Street Bridge, 13 March 2023, CC BY 2.0, cropped. Source file: `scripts/sources/hero-schuylkill-night.jpg`. |
| O6 | Colour scheme | **One scheme.** No light version. The light/dark switch and `next-themes` are removed. |
| O7 | Mark and Möbius | The disc-and-cursor mark keeps its shape and becomes **gold on warm black**. The favicon and social image are regenerated. **The Möbius figure is retired**: component, stories, tokens and `roughjs` are deleted. |
| O8 | Games on the home page | **Removed.** `/games` and the three games are untouched and stay out of the navigation and sitemap, `noindex`. Nothing on the studio site links to them. |
| O9 | Proof of work | Five claims, each beside a product panel **rebuilt in HTML in Code.Socratic's current look** (aubergine and blush, not teal Carbon). |
| O10 | Credentials | Kept as one more FAQ: "Who would I be working with?" |
| O11 | Unconfirmed lines | **No switches.** Every `[CONFIRM]` line is written into the pull request, and the pull request does not merge until the owner has confirmed each one (section 7). |
| O12 | Link to the product | Labelled **"Visit Code.Socratic"**, to `https://www.code-socratic.com/`. |
| O13 | Three proof lines | The **exact wordings** in `content.md` replace the handover's (hints, refund, routing). |
| O14 | Dead product link | Fixed separately in pull request #9. This branch already assumes `https://www.code-socratic.com/`. |

### 2.2 Made by the designer, stated to the owner, not objected to

| # | Decision |
|---|---|
| D1 | The product is spelled **"Code.Socratic"** everywhere. |
| D2 | The `h1` is the studio name. The owner's 14-word headline is the sentence above it. |
| D3 | The page gets the skill's motion layer (`design.md` §6). Design rule 8's ban no longer applies. |
| D4 | No cost calculator in this version. |
| D5 | Storybook stays the place every component is seen first, and its axe pass stays a gate. |
| D6 | Code.Socratic's small section sits **before** the closing ask, so the page ends on the ask and the name. The handover lists it after; it also says the ask belongs "at the page bottom". |
| D7 | Proof panels are set in the page's text face, not the product's (Switzer). The colours, shapes and words are the product's. One typeface fewer to load, and Switzer's licence restricts redistribution. |
| D8 | Styles are plain CSS: three small global files and one CSS Module per component. Sass leaves with Carbon. |
| D9 | The dealt signature motion, a crossfade between several photographs of one framing, needs photographs that do not exist. It is redrawn to a slow settle and drift of the one photograph. |
| D10 | The dealt Proof blueprint lists client names. There are none, by rule. It is replaced by the claims-beside-evidence exhibit. |

### 2.3 Facts checked against `../code-socratic` on 2026-11-20

These bound what the copy may say. Do not write past them.

* **Built on the Claude API:** true. Anthropic SDK, Messages API, Claude Sonnet 4.6 and Claude Haiku 4.5 configured.
* **Sandboxed execution:** true. E2B microVM, no internet access.
* **Hidden tests:** expected outputs are stored as hashes and compared on the server. Hidden-test *inputs* do reach the browser, so never write "inputs".
* **Tutor:** one hint at a time; the answer is revealed after three failed attempts on a phase. Never write "never gives the answer".
* **Credits:** reserve and settle run in the product. Nothing in the product calls refund; support refunds go through an audited admin adjustment.
* **Routing:** exists per difficulty and is switchable; the shipped default sends every difficulty to Sonnet. No measured cost-per-session figure exists. Do not print one.
* **Live status:** billing is live. Sign-up may be waitlisted. Say "built", never "shipped" or "in production", never "Try it".
* **Never:** "trusted by", any quote, any logo, any customer count.

---

## 3. What does not change

* `/games`, `app/games/**`, `components/{games,sudoku,solitaire,color-tap}/**`,
  `lib/**` game code, `data/{sudoku,sudoku-trophies,solitaire,color-tap}.ts`,
  `e2e/**`, `public/{paint-by-numbers,solitaire}/**`, the game scripts. **No
  agent edits any of these.** The one permitted exception is in Phase A step 9.
* The games keep reading `games` from `data/angeronia.ts`; that export stays.
* Routes: `/`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, the redirects
  and headers in `next.config.mjs`.
* Next.js 15 App Router, React 19, TypeScript, static prerendering.
* No analytics, no tracker, no cookie, no embed, no form that submits anything.

---

## 4. Architecture after the change

```
app/
  layout.tsx            fonts, metadata, JSON-LD, the .js gate, global CSS
  page.tsx              <HomePage />
  icon.svg              the mark, gold on warm black
  opengraph-image.png   generated, 1200 x 630 (and twitter-image.png, the same file)
  opengraph-image.alt.txt, twitter-image.alt.txt
  privacy/page.tsx, terms/page.tsx, robots.ts, sitemap.ts
  games/**              untouched
components/
  site/                 one file per section, each with a .module.css and a .stories.tsx
    home-page.tsx  site-header.tsx  header-state.tsx  hero.tsx  fit-text.tsx
    intro.tsx  problems.tsx  offers.tsx  proof.tsx  proof-panels.tsx
    process.tsx  faq.tsx  product.tsx  close.tsx  legal-page.tsx
    brand-mark.tsx  skip-link.tsx  reveal.tsx
  ui/
    button-link.tsx  external-link.tsx      (everything else in ui/ is deleted)
styles/
  tokens.css   base.css   motion.css        (global; plain CSS)
data/angeronia.ts                           (rewritten; see content.md)
lib/cx.ts                                   (kept)   lib/theme.ts (deleted)
public/hero/                                generated photograph variants
scripts/
  build-hero.mjs  build-og.mjs  check-contrast.mjs  games-parity.ts
  sources/hero-schuylkill-night.jpg  sources/CREDITS.md
stories/foundations/                        rewritten for the new tokens
stories/pages/Home.stories.tsx  Legal.stories.tsx
docs/design-system/DESIGN-RULES.md          rewritten
docs/design-system/DECISIONS.md             ADR-023 to ADR-028 appended
```

**Removed from `package.json`:** `@carbon/react`, `@carbon/icons-react`,
`@carbon/themes`, `@carbon/colors`, `next-themes`, `roughjs`, `sass-embedded`,
`@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`.
**Added (dev only, for Storybook):** `@fontsource-variable/imbue`,
`@fontsource/albert-sans`.
**Kept:** `clsx`, `sharp`, `opentype.js`, `tsx`, `@phosphor-icons/react` (the
games use it), everything for Storybook, Vitest and Playwright.

### 4.1 Rules every agent follows

1. **Copy lives in `data/angeronia.ts`.** A component never contains a visible
   string. Take the data file from `content.md` exactly; do not reword anything.
2. **Tokens only.** No raw colour, size, duration or easing in a component's
   CSS. Use the custom properties in `styles/tokens.css`. The one exception is
   `proof-panels.module.css`, which carries Code.Socratic's own palette as
   local custom properties, because those panels are pictures of another
   product.
3. **No inline `style`**, except a custom property whose value is data: the
   stagger index `--i`, a weight `--w`. Never a CSS property.
4. **Nothing global reaches a game.** Global CSS may contain only: `html` and
   `body` rules, `.site-root`, `.visually-hidden`, `.skip-link`, and rules whose
   selector starts with `.studio` or `html:has(.studio)` or `.js .studio`.
   Everything else is a CSS Module.
5. **Server components by default.** Only `fit-text.tsx`, `header-state.tsx`
   and `reveal.tsx` are `"use client"`.
6. **Every section has a heading**, one `h1` on the page, no skipped heading
   level, a visible focus ring, 44 px touch targets, WCAG 2.2 AA contrast.
7. **A story before the page.** Each component ships a story file with at
   least `Default`, and `Phone` where the phone layout differs (viewport
   390 x 844). Stories must pass the axe check.
8. **The house rules of the design skill** (`design.md` §8). The short form:
   headings never run past two lines at any width; no small label above a
   heading; no monospace outside real code; no numbered labels; no hairline
   rules or outlined boxes; no gradients except the one scrim on the
   photograph; no shadows; no rounded corners; no icons in tiles; no emoji.
9. **Do not touch files your phase does not list.** If you believe you must,
   stop and report.
10. **Commit only when your phase file says so**, with the message it gives.
    Never push. Never open a pull request.

### 4.2 Commands

```bash
npm run typecheck          # tsc --noEmit
npm run build              # strict build
npm test                   # the games' unit tests (Vitest, node)
npm run test:storybook     # every story in Chromium; an axe violation fails
E2E_PORT=3417 npm run test:e2e   # the games end to end; port 3000 is often taken on this machine
npm run check:contrast     # new in Phase C; replaces check:theme
npm run storybook          # port 6006
```

Use port **3417** for any dev server you start, and stop it when you finish.

---

## 5. Phases

```
A  foundation ──► B1 header + hero ─┐
   (1 agent)      B2 intro + problems│
                  B3 offers          ├──► C  integration ──► D  review, PR
                  B4 proof           │    (1 agent)          (orchestrator)
                  B5 process + faq   │
                  B6 product + close │
                     + legal page   ─┘
```

* **A** runs alone and commits. It leaves every section as a working stub with
  its final file name, export name and props, so the B agents never edit a
  shared file.
* **B1 to B6** run in parallel, each in its own git worktree branched from A's
  commit, each committing only the files it owns. The orchestrator merges the
  six branches; they cannot conflict if the ownership table in
  `phase-b-sections.md` is respected.
* **C** runs alone after the merge.
* **D** is the orchestrating session: the skill's inspector, screenshots at
  three widths, the critique, fixes, then the pull request.

Model guidance: A, B4 and C carry the most judgement and are the ones to run
on a stronger model if any is. The rest are mechanical from the specification.

---

## 6. Gates

A phase is done only when its own acceptance list passes. The branch is done
when all of these pass on the final commit:

| Gate | Command or check |
|---|---|
| Types | `npm run typecheck` |
| Build | `npm run build` |
| Games, unit | `npm test` |
| Games, end to end | `E2E_PORT=3417 npm run test:e2e` |
| Games, unchanged by the Carbon removal | `npx tsx scripts/games-parity.ts compare` reports no difference (Phase A) |
| Stories and accessibility | `npm run test:storybook` |
| Contrast | `npm run check:contrast` |
| No Carbon left | `grep -rIl -E "@carbon|cds--|next-themes|roughjs" app components lib styles data stories .storybook scripts package.json` prints nothing |
| Design skill | `inspect.mjs` shows 0 FAIL at 1440, 768 and 390; `lint.mjs` is clean (Phase D) |

---

## 7. The owner's checklist: every `[CONFIRM]`

The pull request stays open until each line is ticked. They are marked
`[CONFIRM]` in `data/angeronia.ts` at the place the value lives.

| # | Line | Where | If not confirmed |
|---|---|---|---|
| 1 | Booking link | `LINKS.booking` | Stays `null`; "Book a call" opens an email draft. Acceptable to merge. |
| 2 | 90-second demo video | `LINKS.demoVideo` | Stays `null`; the link is not rendered. Acceptable to merge. |
| 3 | The email address to publish | `LINKS.email` | Blocks the merge. |
| 4 | "Fixed price: 50% deposit, 50% on acceptance" | `intro.facts[1]`, `process.steps[2]` | Blocks the merge. |
| 5 | "You own the code, assigned on final payment" | `intro.facts[2]`, FAQ | Blocks the merge. |
| 6 | Offer A price, "$6,000 to $8,000" | `PRICES.mvpRange` | Blocks the merge. |
| 7 | Change requests at "$150 an hour" | `PRICES.changeRequestRate` | Blocks the merge. |
| 8 | Offer B tiers | `PRICES.fractional` | Blocks the merge. |
| 9 | Offer C, the sprint, "$1,800" and whether to offer it | `PRICES.sprint` | Blocks the merge. |
| 10 | FAQ: what if it misses the threshold | `faq.items` | Blocks the merge. |
| 11 | FAQ: the ownership carve-out wording | `faq.items` | Blocks the merge. |
| 12 | Footer city, "Philadelphia, PA" | `BRAND.city`, `intro.heading`, `LEGAL_CONTACT`, the JSON-LD address in `app/layout.tsx` | Blocks the merge. |
| 13 | Privacy policy: the new "What your browser stores" paragraph | `privacyPolicy` | Blocks the merge. |
| 14 | Write-up, sample handoff, repositories, "Read how it's built" | `LINKS.*` | Stay `null`; not rendered. Acceptable to merge. |
| 15 | The photograph shows one small lit sign, "WSFS Bank", on a mid-rise near the centre. Accept it, or have it dimmed out (the licence allows it; the credit then says "cropped and retouched"). | `scripts/build-hero.mjs`, `photoCredit.text` | Left as it is. Acceptable to merge. |
| 16 | The legal pages' "Last updated" date, set to the day it merges | `privacyPolicy.updated`, `termsOfService.updated` | Blocks the merge. |
| 17 | FAQ: "Claude is my default and where my production experience is." | `faq.items`, "Do you only use Claude?" | Blocks the merge. |
| 18 | Proof: "Verification the model cannot see or game", which does not hold for problems the tutor builds | `proof.claims` (`tests`) | Blocks the merge. |
| 19 | "A full product you can inspect" and "It has a live agent" hold only while sign-up is open | `faq.items`, `product.blurb` | Blocks the merge. |
| 20 | The legal documents speak as "we" (the LLC), against "I, never we" | `privacyPolicy`, `termsOfService` | Exempt them. Acceptable to merge. |
| 21 | The sprint's "Best for" line in quotation marks can read as a client quote | `offers` (`sprint`) | Left as it is. Acceptable to merge. |

Rows 16 to 21 were added in Phase D, from the review's copy and truth check.

---

## 8. Where the look comes from

* Direction sheet: `.taste-skill/opt-name-as-monument.sheet.md` (not committed;
  the parts that matter are restated in `design.md`).
* The before-state of the site, measured: 14 failures of the skill's house
  rules, in `.taste-skill/before/report.json`.
* Code.Socratic's current interface: `../code-socratic/apps/web/styles/_tokens.scss`
  and `apps/web/DESIGN.md`. The values needed are restated in `design.md` §5.4.
  `../code-socratic/ds-bundle/` is stale and must not be used.
