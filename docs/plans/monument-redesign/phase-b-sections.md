# Phase B: the sections

**Six agents, in parallel**, each in its own git worktree branched from Phase
A's commit. Read `README.md`, `content.md` and `design.md` first; your brief
below tells you which parts of `design.md` are yours.

Phase A left every section as a stub with its final file name, export and
outer element. You **replace the three files of each section you own**
(`name.tsx`, `name.module.css`, `name.stories.tsx`) and touch nothing else.

## Ownership. Edit only your own rows.

| Agent | Owns (all under `components/site/` unless a path is given) | Dev port |
|---|---|---|
| **B1** | `site-header.*`, `header-state.tsx`, `hero.*`, `fit-text.tsx`, `scripts/build-hero.mjs`, `public/hero/*`, `scripts/sources/CREDITS.md` | 3421 |
| **B2** | `intro.*`, `problems.*` | 3422 |
| **B3** | `offers.*` | 3423 |
| **B4** | `proof.*`, `proof-panels.*` | 3424 |
| **B5** | `process.*`, `faq.*` | 3425 |
| **B6** | `product.*`, `close.*`, `legal-page.*`, `stories/pages/Legal.stories.tsx` | 3426 |

Nobody edits `home-page.tsx`, `data/angeronia.ts`, anything in `styles/`,
`app/`, `components/ui/`, `reveal.tsx`, `brand-mark.*`, `skip-link.tsx`,
`package.json`, or any games file. If you need a change there, stop and report
it; do not make it.

## How every B agent works

1. `npm ci` in your worktree.
2. Build your sections to `design.md`. Words come from `data/angeronia.ts`
   only. Use the global classes `frame`, `section`, `display`, `h-head`,
   `h-statement`, `lines`, `lead`, `small`, `visually-hidden` by name, and CSS
   Module classes for everything else. Tokens only (README §4.1).
3. Where a heading is two authored lines, separate the two spans with a
   literal space in the JSX (`</span>{" "}<span>`), so it reads as words.
   Then wrap each section in `Reveal` and mark its parts with `data-reveal` and
   `--i` as your brief lists (`design.md` §6.3). The inline `style` may carry
   `--i` (and, for B4, `--w`) and nothing else.
4. Stories: title `Sections/<Name>`, `parameters: { layout: "fullscreen" }`,
   a `Default` story, and any extra story your brief names.
5. **Look at what you made.** Start a dev server on your port
   (`npx next dev -p <port>`), then:

   ```bash
   npx playwright screenshot --viewport-size=1440,900 --full-page --wait-for-timeout=1500 http://localhost:<port>/ /tmp/<agent>-desktop.png
   npx playwright screenshot --viewport-size=768,1024 --full-page --wait-for-timeout=1500 http://localhost:<port>/ /tmp/<agent>-tablet.png
   npx playwright screenshot --viewport-size=390,844 --full-page --wait-for-timeout=1500 http://localhost:<port>/ /tmp/<agent>-phone.png
   ```

   Open the three images and check your sections against your brief's
   checklist. The other sections are still stubs; ignore them. Fix what is
   wrong and look again. Stop the server when done.
6. Gates for your files: `npm run typecheck`, `npm run build`,
   `npm run test:storybook` (your stories must pass axe).
7. Commit only your files, message `<Agent>: <what you built>`, ending with the
   co-author line your session's instructions give. Do not push.

**Checklist that applies to every section**

* No heading runs past two lines at 1440, 768 or 390.
* Text starts only on column 1, 4 or 8 on desktop.
* No rounded corner, shadow, gradient, hairline or outlined box.
* Running text is `--ink`; only notes and `dt` labels are `--muted`.
* Nothing overflows sideways at 390.
* Every link and button is reachable by keyboard and shows the focus ring.
* With JavaScript disabled, everything is visible.

---

## B1. Header and hero

**Specification:** `design.md` §4.1, §4.2, §5.3, §6.1, §6.2.

**Build**

* `header-state.tsx` (client): the `<header>` element. Props
  `{ variant: "overlay" | "solid"; className?: string; children: React.ReactNode }`.
  For `overlay` it renders an 8px-tall, `aria-hidden`, absolutely positioned
  sentinel at the top of the document (portal it to `document.body`, or render
  it as the header's first child with `position: absolute; inset-block-start: 0`
  inside a wrapper that is not fixed) and observes it; `data-stuck` is `"true"`
  when the sentinel is out of view. For `solid` it is always `"true"`.
* `site-header.tsx`: server component composing `HeaderState`, `BrandMark`,
  the nav from `nav.items`, and `ButtonLink size="sm"` from `nav.cta`.
* `fit-text.tsx` (client): as specified in §4.2. It must never leave the text
  wider than its parent, at any width, before or after the web font loads.
* `hero.tsx`: as specified. `hero.secondaryCta` is `null` today; render
  nothing for it, and prove the non-null layout in a story by passing a
  secondary link through a story-only prop
  (`Hero({ secondary }: { secondary?: Cta | null })`, defaulting to
  `hero.secondaryCta`).
* `scripts/build-hero.mjs`:

  ```js
  // Makes the first-screen photograph's served sizes from the committed source.
  //   npm run build:hero
  import sharp from "sharp";
  import { mkdirSync } from "node:fs";

  const SOURCE = "scripts/sources/hero-schuylkill-night.jpg"; // 4800 x 2630
  const OUT = "public/hero";
  // A phone shows a column of the same picture: the two tallest towers.
  const COLUMN = { left: 1601, top: 0, width: 1215, height: 2630 };

  mkdirSync(OUT, { recursive: true });

  async function write(image, name) {
    await image.clone().avif({ quality: 55 }).toFile(`${OUT}/${name}.avif`);
    await image.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  }

  for (const width of [1440, 2160, 2880]) {
    await write(sharp(SOURCE).resize({ width }), `schuylkill-${width}`);
  }
  for (const width of [780, 1170]) {
    await write(sharp(SOURCE).extract(COLUMN).resize({ width }), `schuylkill-portrait-${width}`);
  }
  console.log("hero photographs written to", OUT);
  ```

  Run it and commit the ten files in `public/hero/`. sharp strips metadata by
  default; leave that.
* `scripts/sources/CREDITS.md`: one entry.

  ```markdown
  # Picture sources

  ## hero-schuylkill-night.jpg

  "Philadelphia Skyline" by Andrew Parlette, taken 2023-03-13 from the South
  Street Bridge. Licence: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/
  Source: https://commons.wikimedia.org/w/index.php?curid=135482068

  Changed: the left 27% of the original (12058 x 4823) is cropped off, and the
  rest is scaled to 4800 x 2630. The page credits it in the footer.
  ```

**Only if the owner asks for it (README §7, line 15):** dim the one lit sign
in the photograph. It sits at about x 2250 to 2440, y 1140 to 1176 in the
4800 x 2630 source. Composite a soft-edged rectangle sampled from the
building's unlit face over it in `build-hero.mjs`, before resizing, and change
`photoCredit.text` to "Photograph by Andrew Parlette, cropped and retouched"
(that one string is in the data file; report that it needs changing rather
than editing it yourself). Do not do this unasked.

**Reveal:** none on the hero; its entrance is the CSS sequence in §6.2. The
header does not animate in.

**Stories:** `Sections/SiteHeader` with `Overlay` (on a dark block so it can be
seen) and `Solid`; `Sections/Hero` with `Default` and `WithSecondLink`.

**Check in the screenshots**

* The name spans the full width, margin to margin, on one line, at all three
  widths, and no letter is cut.
* The sentence and the button sit directly above the name; the sentence is
  readable over the photograph.
* The nav reads over the clouds at the top.
* On the phone the two tallest towers are in frame.
* Scroll 200px (`--viewport-size` plus a second screenshot after
  `window.scrollTo(0, 200)` in a small Playwright script if needed): the
  header is solid and shows "Book a call".
* First screen holds exactly one button.

---

## B2. Intro and problems

**Specification:** `design.md` §4.3, §4.4.

**Reveal**

| Section | Part | `data-reveal` | `--i` |
|---|---|---|---|
| Intro | `h2` | rise | 0 |
| | each paragraph | rise | 1, 2, 3 |
| | each fact `li` | rise | 2, 3, 4, 5 |
| Problems | `h2` | rise | 0 |
| | each `.row` | rise | 1, 2, 3 |
| | `.bridge` | rise | 4 |

**Stories:** `Sections/Intro` `Default`; `Sections/Problems` `Default`.

**Check**

* Intro: the paragraph column starts on column 4 and the four terms on column
  8, top-aligned. The right side is not empty.
* Problems: "WHY AGENT / PROJECTS STALL" on two lines. Titles on column 4,
  bodies on column 8, baselines aligned per row.
* There is no extra gap between the two sections beyond one `--section`.

---

## B3. Offers

**Specification:** `design.md` §4.5.

**Notes**

* The lead offer is `offers.items[0]`; the other two are found by `id`
  (`fractional`, `sprint`), not by position.
* Render `bullets`, `tiers`, `body` and `notIncluded` only when present.
* `dt` labels come from `offers.labels`.
* The statement's two lines must each stay on one line at 390px. If the first
  line does not fit at the token's minimum size, report it; do not shrink it.

**Reveal**

| Part | `data-reveal` | `--i` |
|---|---|---|
| `.intro` | rise | 0 |
| statement line 1 (the inner span) | line | 0 |
| statement line 2 (the `mark`) | wipe | (none) |
| `.what` | rise | 2 |
| `.terms` and `.book` | rise | 3 |
| each smaller offer | rise | 4, 5 |
| `.after` | rise | 6 |

For `line`, the `.line` wrapper needs `overflow: clip`.

**Stories:** `Sections/Offers` `Default`.

**Check**

* The gold block is only behind the price, same face and size as line one.
* Offer A is clearly the largest block; the fractional offer comes before the
  sprint.
* The three tier rows line up as two columns with tabular figures.
* Exactly one gold button in the section ("Book a call"); the closing line's
  link is underlined text.

---

## B4. Proof of work

**Specification:** `design.md` §4.6 and §4.6.1. This is the hardest section;
read both twice.

**Notes**

* No JavaScript. The exhibit is radio inputs and `:has()`. `proof.tsx` and
  `proof-panels.tsx` are server components.
* The first claim with a panel is `defaultChecked`.
* The claim whose `panel` is `null` renders `<p class="built">` instead of a
  `label`, with no input and no figure.
* `proof.assets` are all `null` today: render no list at all. Add a story-only
  prop (`Proof({ assets }: …)` defaulting to `proof.assets`) to prove the
  non-empty layout.
* `proof-panels.module.css` is the one stylesheet allowed raw colours and
  pixel sizes; use exactly the values in §4.6.1.
* Every string in a panel comes from `proofPanels`. The speaker label comes
  from `proofPanels.speakers`. Never write "Tutor".
* The `credits` panel passes each step's `weight` as `style={{ "--w": weight }}`.

**Reveal**

| Part | `data-reveal` | `--i` |
|---|---|---|
| `h2` | rise | 0 |
| `.intro` | rise | 1 |
| each `.claim` | rise | 2, 3, 4, 5, 6 |
| `.disclaimer` | rise | 7 |

Do not put `shutter` on the panels: they are positioned and switched by CSS,
and a clip-path transition would fight `visibility`.

**Stories:** `Sections/Proof` with `Default`, `WithAssets`, and a play test on
`Default` at a 1280px-wide canvas: the first panel is visible; after clicking
the second claim's label, the second panel is visible and the first is not
(`toBeVisible` / `not.toBeVisible`). `Sections/ProofPanel` with one story per
panel id.

**Check**

* Desktop: five claims at the left, one panel at the right, the chosen claim
  on the surface tone with a 4px ink bar. Tab reaches the radio group; arrow
  keys change the panel; the focus ring is visible on the claim.
* 768 and 390: no radios, every panel under its claim, nothing hidden.
* The panels look like Code.Socratic: aubergine `#1d0e18` behind `#2c1625`
  blocks, blush text, square corners, no borders.
* The difficulty tiles are 1 : 2 : 4 wide on desktop and stack on the phone.
* The disclaimer line is present.

---

## B5. Process and FAQ

**Specification:** `design.md` §4.7, §4.8.

**Reveal**

| Section | Part | `data-reveal` | `--i` |
|---|---|---|---|
| Process | `h2` | rise | 0 |
| | each `.step` | rise | 1 to 5 |
| FAQ | `h2` | rise | 0 |
| | each `.row` | rise | 1 to 8, then 8 for the rest |

**Stories:** `Sections/Process` `Default`; `Sections/Faq` `Default`.

**Check**

* Process: paragraphs start on column 4, each opening with its bold phrase;
  the figure for each step sits at column 10 on the same row. No numbers, no
  bullets, no connecting line. The figures are `aria-hidden`.
* FAQ: ten rows. Questions on column 1, never more than two lines; answers on
  column 8. Everything open. On the phone, question above answer.
* A screen reader would hear each process step once (check the DOM: the body
  paragraph is read, the figure is hidden).

---

## B6. Product, the close and the legal page

**Specification:** `design.md` §4.9, §4.10, §4.11.

**Notes**

* `Close` takes `variant`. `full` (home) renders the ask, both link lists, the
  legal row and the wordmark. `compact` (legal pages) renders the site links,
  the legal row and the wordmark only.
* The legal row is `footer.legal`'s three lines, then the photograph credit:
  the text from `photoCredit.text` linked to `photoCredit.href`, then
  `photoCredit.license` linked to `photoCredit.licenseHref`. On a `compact`
  close the credit still shows: the photograph is not on that page, but the
  footer is the site's one place for it.
* `product.build` is `null` today: render nothing for it.
* The button in the close is `ButtonLink variant="ink"`.
* `legal-page.tsx` keeps its signature; `app/privacy/page.tsx` and
  `app/terms/page.tsx` are not yours to edit.

**Reveal**

| Section | Part | `data-reveal` | `--i` |
|---|---|---|---|
| Product | `h2` | rise | 0 |
| | `.about` | rise | 1 |
| Close | each heading line (inner span) | line | 0, 1 |
| | `.body` | rise | 2 |
| | `.actions` | rise | 3 |
| | `.links` | rise | 4 |

For `line`, wrap each heading line as `<span class="line"><span data-reveal="line">…</span></span>`
with `overflow: clip` on `.line`; the `.lines > span` rule already makes each
`.line` a block that does not wrap.

**Stories:** `Sections/Product` `Default`; `Sections/Close` with `Full` and
`Compact`; `Pages/Legal` with `Privacy` and `Terms`
(`stories/pages/Legal.stories.tsx`, each rendering `<LegalPage document={…} />`).

**Check**

* Product is visibly smaller than Offers: no statement-size type.
* Close: white field; "HAVE A WORKFLOW YOU WANT / AN AGENT TO RUN?" on two
  lines at every width; one ink-filled button; the wordmark cut along its
  bottom and running off the right edge; the legal row fully above the
  wordmark and readable.
* The header stays dark over the white section and never overlaps the
  heading awkwardly at the moment the section arrives.
* Legal pages: a readable column from column 4, the solid header, the compact
  close. No heading level is skipped (`h1`, then `h2`).
