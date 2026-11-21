# Design specification

The look was dealt by the `design-taste-frontend` skill and chosen by the owner
from built drafts. This file restates everything an implementer needs. Build
what is written here. Where a number is given, use that number.

**Direction:** "The name as a monument" (seed 54426271). The name is the
headline, set so large it becomes architecture. Everything after the first
screen is small and calm, so the contrast holds. Two sizes do nearly all the
work: the monument and a small text size, with one mid size for section
headings.

**The idea on this page:** the studio's name stands over the city it works in,
and under it every claim sits beside the thing that proves it.

**The one thing a visitor can do:** in Proof of work, choose a claim and see the
product panel that backs it.

---

## 1. Tokens: `styles/tokens.css`

Phase A creates this file exactly. All later CSS uses these and nothing raw.

```css
/* The studio's tokens. Scoped to the studio so nothing here reaches a game:
   the games define their own --bg and --ink (ADR-019). */
html:has(.studio),
.studio {
  /* Colour: the dealt "Warm black, gold" palette. One ground, one ink, one accent. */
  --bg: #0c0a08;
  --surface: #181512;        /* one tone step from the ground */
  --ink: #ffffff;
  --muted: #8f8a84;          /* secondary notes only, never running text */
  --accent: #c9a45a;         /* the action, and one price */
  --accent-strong: #dcbd7a;  /* hover: raises contrast */
  --accent-ink: #0c0a08;
  --photo-ground: #17120d;   /* sampled from the photograph; shows while it loads */

  /* The inverse field: the closing section only. */
  --inv-bg: #ffffff;
  --inv-ink: #0c0a08;
  --inv-muted: #5f5a54;

  /* Type. The two families arrive as variables from next/font (app/layout.tsx). */
  --display: var(--font-display), "Times New Roman", serif;
  --text: var(--font-text), system-ui, -apple-system, "Segoe UI", sans-serif;
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);     /* 13 to 14px */
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);       /* 17 to 19px */
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);         /* 20 to 26px */
  --step-head: clamp(2.5rem, 1.6rem + 3vw, 4.25rem);             /* 40 to 68px */
  --step-statement: clamp(2.6rem, 8.6vw, 8.25rem);               /* 42 to 132px */

  /* Space. */
  --m: clamp(1.25rem, 2.2vw, 2rem);            /* the outer margin, 20 to 32px */
  --gutter: clamp(0.75rem, 1.4vw, 1.5rem);
  --section: clamp(6rem, 12vw, 11rem);         /* between sections, 96 to 176px */
  --s-1: 0.5rem;
  --s-2: 0.75rem;
  --s-3: 1rem;
  --s-4: 1.5rem;
  --s-5: 2rem;
  --s-6: 3rem;
  --s-7: 4.5rem;
  --measure: 62ch;
  --measure-narrow: 34ch;
  --control: 3.25rem;                          /* button height, 52px */
  --control-small: 2.75rem;                    /* 44px, the smallest touch target */
  --header: 4.5rem;
  --bar: 0.25rem;                              /* a thick bar is a graphic element; a hairline is banned */
  --focus: 0.1875rem;                          /* 3px focus ring */

  /* Motion. */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-soft: cubic-bezier(0.33, 1, 0.68, 1);
  --t-press: 140ms;
  --t-hover: 180ms;
  --t-ui: 240ms;
  --t-reveal: 800ms;
  --stagger-line: 90ms;
  --stagger-item: 70ms;
}

@media (max-width: 47.4375rem) {
  html:has(.studio),
  .studio {
    --header: 3.5rem;
  }
}
```

### 1.1 Contrast (checked; `npm run check:contrast` re-checks)

| Pair | Ratio | Use |
|---|---|---|
| `--ink` on `--bg` | 19.8 | all running text |
| `--ink` on `--surface` | 18.2 | text on tone-step sections |
| `--muted` on `--bg` | 5.8 | secondary notes |
| `--muted` on `--surface` | 5.3 | secondary notes |
| `--accent` on `--bg` | 8.4 | button fill against the page |
| `--accent-ink` on `--accent` | 8.4 | button label, price on its block |
| `--inv-ink` on `--inv-bg` | 19.8 | closing section |
| `--inv-muted` on `--inv-bg` | 6.8 | legal line |

Gold on white is 2.4 and is never used: on the closing section the button is
ink-filled.

### 1.2 Colour rules

* Ground is 70 to 90% of every screen. Running text is `--ink`. `--muted` is
  for captions, labels inside a definition list and the legal line.
* `--accent` appears on the primary button and on the one price block in
  Offers. Nowhere else: not on headings, links, bullets or underlines.
* Surfaces are told apart by tone (`--bg` and `--surface`), never by a line or
  a shadow.
* Section grounds, in order: photograph, `--bg` (intro), `--bg` (problems),
  `--surface` (offers), `--bg` (proof), `--surface` (process), `--bg` (FAQ),
  `--surface` (product), `--inv-bg` (close).

---

## 2. Type

Two families, each with one job.

| | Family | Settings | Used for |
|---|---|---|---|
| Display | **Imbue** (variable: optical size and weight) | weight 400, `text-transform: uppercase`, `letter-spacing: -0.01em`, `line-height: 0.9`, `font-optical-sizing: auto` | the name, section headings, the two statements, the process figures |
| Text | **Albert Sans** (variable weight) | 400 body, 500 emphasis and small headings, 600 only for bold run-ins; `line-height: 1.55` | everything read at length |

Loaded in `app/layout.tsx` with `next/font/google`, self-hosted at build:

```ts
const display = Imbue({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display", display: "swap" });
const text = Albert_Sans({ subsets: ["latin"], variable: "--font-text", display: "swap" });
```

**Six sizes, no others:** the fitted name, `--step-statement`, `--step-head`,
`--step-lead`, `--step-body`, `--step-small`. If a design below seems to need
another, use the nearest of these.

**Global helper classes** (in `styles/base.css`, see Phase A) so no module
restates the display settings:

* `.display` : Imbue, uppercase, the tracking and leading above.
* `.h-head` : `.display` at `--step-head`.
* `.h-statement` : `.display` at `--step-statement`.
* `.lines > span` : `display: block; white-space: nowrap;` for authored
  two-line headings. **A heading never runs past two lines at any width.**
  Put a literal space between the spans in the JSX (`</span>{" "}<span>`), so
  the heading's accessible name is words, not two words run together.
* `.lead` : text face, `--step-lead`, `line-height: 1.35`.
* `.small` : `--step-small`, `line-height: 1.45`, `--muted`.

Details: `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs,
`font-variant-numeric: tabular-nums` wherever figures line up, links
`text-underline-offset: 0.18em; text-decoration-thickness: 0.07em`. Nothing
under 13px. No all-caps in the text face. No italic as decoration.

---

## 3. Grid and frame

* One 12-column grid for the whole page: class **`.frame`**
  (`display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: var(--gutter); padding-inline: var(--m);`).
  The outer margins are equal at every width and are never changed by a section.
* Section rhythm: class **`.section`** (`padding-block: var(--section)`).
* **Three anchor lines, and only these three**, for the left edge of text:
  **L1** column 1, **L2** column 4, **L3** column 8.
* No fixed max-width container. Running text is held by `max-inline-size` in
  `ch` on the paragraph.
* Breakpoints: **phone** below 760px (`max-width: 47.4375rem`), **tablet** 760
  to 999px, **desktop** from 1000px (`min-width: 62.5rem`). On a phone every
  grid child spans all twelve columns unless stated.
* No section is huddled on one side with the other half empty, and no stretch
  taller than half a screen holds nothing.

---

## 4. Sections

Each entry gives structure, then desktop, then phone. Class names shown are
CSS Module names unless they are one of the global classes above.

### 4.1 Header: `site-header.tsx`, `header-state.tsx`

```
<HeaderState variant="overlay" | "solid">     <!-- the <header> element, client -->
  <a class="brand" href="/"> <BrandMark size={22} /> <span>Angeronia Labs</span> </a>
  <nav aria-label={copy.navLabel}> <ul> four links from nav.items </ul> </nav>
  <ButtonLink class="cta" size="sm" href={nav.cta.href}>{nav.cta.label}</ButtonLink>
</HeaderState>
```

* Height `--header`, `padding-inline: var(--m)`, `display: flex`,
  `justify-content: space-between`, `align-items: center`. Links at
  `--step-body`, weight 400, gap `var(--s-5)`. The brand text is weight 500.
* **Without JavaScript:** `position: absolute; inset-block-start: 0;` across the
  top, transparent. It scrolls away with the page.
* **With JavaScript (`.js`):** `position: fixed`. `HeaderState` watches an 8px
  sentinel at the top of the document with an `IntersectionObserver` and sets
  `data-stuck="true"` on the header once the page has scrolled.
  * `data-stuck="false"`: transparent, and the `.cta` is hidden
    (`visibility: hidden; opacity: 0`), because the hero carries the button.
  * `data-stuck="true"`: `background: var(--bg)`, the `.cta` visible. Transition
    `background-color var(--t-ui) var(--ease-out)`, the button
    `opacity var(--t-ui)`.
* `variant="solid"` (legal pages): always `data-stuck="true"`, no observer.
* The header never changes colour on the white closing section; it stays dark.
* **Phone:** the `nav` is `display: none` (the same links are in the footer).
  Brand at the left, the `.cta` at the right when stuck.
* `z-index: 10`. It must never sit on top of readable content while
  transparent: that is why it turns solid after 8px of scroll.

### 4.2 Hero: `hero.tsx`, `fit-text.tsx`

Blueprint "Film title, bottom edge". One photograph fills the first screen; the
name spans the full width along the bottom.

```
<section class="hero" aria-labelledby="hero-name">
  <picture class="photo"> … <img … /> </picture>
  <div class="scrimTop" aria-hidden="true"></div>
  <div class="scrim" aria-hidden="true"></div>
  <div class="title">
    <h1 id="hero-name" class="display name"><FitText>{hero.name}</FitText></h1>
    <p class="statement">{hero.statement}</p>
    <div class="actions">
      <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
      {hero.secondaryCta ? <a class="second" href=…>…</a> : null}
    </div>
  </div>
</section>
```

DOM order is name, sentence, action (so it reads correctly aloud). The grid
below places the sentence and action visually above the name.

* `.hero`: `position: relative; block-size: 100svh; min-block-size: 38.75rem; max-block-size: 75rem; overflow: hidden; isolation: isolate; background: var(--photo-ground);`
* `.photo img`: `position: absolute; inset: 0; inline-size: 100%; block-size: 100%; object-fit: cover; object-position: 40% 50%;`
  (phone: the portrait file, `object-position: 50% 50%`).
* `.scrim` (the one permitted gradient, neutral):
  `position: absolute; inset-inline: 0; inset-block-end: 0; block-size: 60%; background: linear-gradient(to top, rgb(12 10 8 / 0.93) 0%, rgb(12 10 8 / 0.72) 48%, rgb(12 10 8 / 0));`
* `.scrimTop`: `inset-block-start: 0; block-size: 24%; background: linear-gradient(to bottom, rgb(12 10 8 / 0.6), rgb(12 10 8 / 0));`
  so the header reads over the clouds.
* `.title`: `position: absolute; inset-inline: var(--m); inset-block-end: clamp(1.25rem, 1.8vw, 1.625rem); display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "statement actions" "name name"; align-items: end; row-gap: var(--s-3); column-gap: var(--s-5);`
* `.statement`: `grid-area: statement;` text face, weight 500, `--step-lead`,
  `line-height: 1.3`, `max-inline-size: 30ch`, `--ink`.
* `.actions`: `grid-area: actions; display: flex; align-items: center; gap: var(--s-4);`
  The secondary link is plain underlined text at `--step-body`.
* `.name`: `grid-area: name; margin: 0; line-height: 0.86; white-space: nowrap; font-size: calc((100vw - 2 * var(--m)) / 4.457);`
  That divisor makes "ANGERONIA LABS" span 98.5% of the width before any
  script runs. `FitText` then measures and sets the exact size.

**`FitText`** (client): renders `<span data-fit>` with `display: inline-block`.
On mount, on `resize`, on `document.fonts.ready`, on the fonts' `loadingdone`
event and from a `ResizeObserver` on its parent, it sets the span's
`font-size` to `parent.clientWidth / span.getBoundingClientRect().width *
currentSize * 0.99`, rounded down. It must never leave the name wider than its
parent. The name is fitted by measurement, never by a guessed size.

**Photograph files** (made by `scripts/build-hero.mjs` from
`scripts/sources/hero-schuylkill-night.jpg`, 4800 x 2630):

| File | Size | Crop |
|---|---|---|
| `public/hero/schuylkill-1440.{avif,jpg}` | 1440 x 789 | whole source |
| `public/hero/schuylkill-2160.{avif,jpg}` | 2160 x 1184 | whole source |
| `public/hero/schuylkill-2880.{avif,jpg}` | 2880 x 1578 | whole source |
| `public/hero/schuylkill-portrait-780.{avif,jpg}` | 780 x 1688 | a 1215 x 2630 column whose left edge is 1601px into the source |
| `public/hero/schuylkill-portrait-1170.{avif,jpg}` | 1170 x 2532 | the same column |

AVIF quality 55, JPEG quality 78 (mozjpeg), metadata stripped.

```html
<picture>
  <source media="(max-width: 47.4375rem)" type="image/avif"
          srcset="/hero/schuylkill-portrait-780.avif 780w, /hero/schuylkill-portrait-1170.avif 1170w" sizes="100vw">
  <source media="(max-width: 47.4375rem)"
          srcset="/hero/schuylkill-portrait-780.jpg 780w, /hero/schuylkill-portrait-1170.jpg 1170w" sizes="100vw">
  <source type="image/avif"
          srcset="/hero/schuylkill-1440.avif 1440w, /hero/schuylkill-2160.avif 2160w, /hero/schuylkill-2880.avif 2880w" sizes="100vw">
  <img src="/hero/schuylkill-2160.jpg"
       srcset="/hero/schuylkill-1440.jpg 1440w, /hero/schuylkill-2160.jpg 2160w, /hero/schuylkill-2880.jpg 2880w" sizes="100vw"
       width="2160" height="1184" alt={hero.photo.alt} fetchpriority="high" decoding="async">
</picture>
```

**Phone:** `grid-template-columns: minmax(0, 1fr); grid-template-areas: "statement" "actions" "name";`
the sentence at `--step-lead` (20px), the button left-aligned, the name on one
line at the bottom, `inset-block-end: 1.25rem`.

### 4.3 Intro: `intro.tsx`

Blueprint "Narrow column, empty field", with the far side closed by the four
terms. Ground `--bg`.

```
<Reveal as="section" class="frame section" aria-labelledby="intro-heading">
  <div class="who">
    <h2 id="intro-heading" class="lead heading">{intro.heading}</h2>
    {intro.paragraphs.map(p => <p>…</p>)}
  </div>
  <ul class="facts" aria-label={intro.factsLabel}> {intro.facts.map(f => <li>…</li>)} </ul>
</Reveal>
```

* `.who`: `grid-column: 4 / 8` (L2). `.heading`: weight 500, `--ink`,
  `max-inline-size: 20ch`. Paragraphs: `--step-body`, `--ink`,
  `max-inline-size: var(--measure-narrow)`, `margin-block-start: var(--s-4)`.
* `.facts`: `grid-column: 8 / 13` (L3), `align-self: start`. Each `li`: text
  face, weight 400, `--step-lead`, `line-height: 1.3`, `--ink`;
  `li + li { margin-block-start: var(--s-3); }`. No bullets, no ticks.
* **Tablet:** `.who` at `1 / 7`, `.facts` at `7 / 13`.
* **Phone:** both span 12; `.facts` gets `margin-block-start: var(--s-6)`.

### 4.4 Problems: `problems.tsx`

A calm two-column list. Ground `--bg`. `padding-block-start: 0` (it follows the
intro on the same ground; the intro's bottom padding is the gap).

```
<Reveal as="section" class="frame section" aria-labelledby="problems-heading">
  <h2 id="problems-heading" class="h-head lines heading"> <span>Why agent</span><span>projects stall</span> </h2>
  <ul class="rows">
    <li class="row"> <h3 class="title">…</h3> <p class="body">…</p> </li>  ×3
  </ul>
  <p class="lead bridge">{problems.bridge}</p>
</Reveal>
```

* `.heading`: `grid-column: 1 / 9` (L1).
* `.rows`: `grid-column: 1 / -1; margin-block-start: var(--s-7); display: grid; row-gap: var(--s-6);`
* `.row`: a 12-column subgrid (`display: grid; grid-template-columns: subgrid; grid-column: 1 / -1;`).
  `.title`: `grid-column: 4 / 8` (L2), text face, weight 500, `--step-lead`,
  `line-height: 1.25`. `.body`: `grid-column: 8 / 13` (L3), `--step-body`, `--ink`.
* `.bridge`: `grid-column: 4 / 13`, weight 500, `margin-block-start: var(--s-7)`.
* **Phone:** title then body, `var(--s-2)` between them, `var(--s-5)` between rows.

### 4.5 Offers: `offers.tsx`, `id="offers"`

Blueprint "One plan as a sentence", followed by the full content of all three
offers. Ground `--surface`. Offer A is the statement and the largest block; B
comes before C; C never leads.

```
<Reveal as="section" id="offers" class="section offers" aria-labelledby="offers-heading">
  <div class="frame">
    <p class="lead intro">{offers.intro}</p>
    <h2 id="offers-heading" class="h-statement statement">
      <span class="line"><span>{offers.headline.line}</span></span>
      <span class="line"><mark class="price">{offers.headline.price}</mark></span>
    </h2>

    <article class="lead-offer">          <!-- offers.items[0] -->
      <div class="what"> <h3>name</h3> <p>priceLabel</p> <ul class="bullets">…</ul> </div>
      <dl class="terms"> <div><dt>Best for</dt><dd>…</dd></div> <div><dt>Not included</dt><dd>…</dd></div> </dl>
      <ButtonLink class="book" …>Book a call</ButtonLink>
    </article>

    <div class="others">
      <article class="offer"> fractional: h3, priceLabel, <dl class="tiers">, body, Best for </article>
      <article class="offer"> sprint: h3, priceLabel, bullets, Best for </article>
    </div>

    <p class="lead after">{offers.after.text} <a href=…>{offers.after.cta.label}</a></p>
  </div>
</Reveal>
```

* `.intro`: `grid-column: 1 / 8`, `max-inline-size: 46ch`, `--ink`.
* `.statement`: `grid-column: 1 / -1; margin-block-start: var(--s-5);`
  `.line { display: block; white-space: nowrap; }`
  `.line + .line { margin-block-start: 0.16em; }`
  `.price { display: inline-block; line-height: 1; padding: 0.06em 0.15em 0; background: var(--accent); color: var(--accent-ink); }`
  The price is the same face and size as the line; the block is what marks it.
* `.lead-offer`: `grid-column: 1 / -1; margin-block-start: var(--s-7); display: grid; grid-template-columns: subgrid;`
  `.what` at `1 / 8`, `.terms` at `8 / 13`, `.book` at `8 / 13` under the terms
  (`justify-self: start; margin-block-start: var(--s-5)`).
* Offer names (`h3`): text face, weight 500, `--step-lead`. Price label:
  `--step-body`, `--ink`, `margin-block-start: var(--s-1)`.
* `.bullets`: `list-style: square; padding-inline-start: 1.1em; margin-block-start: var(--s-4);`
  `li + li { margin-block-start: var(--s-1); }` Marker colour `--muted`.
* `dt`: `.small`. `dd`: `--step-body`, `--ink`, `margin: 0`. `.terms > div + div { margin-block-start: var(--s-4); }`
* `.others`: `grid-column: 1 / -1; margin-block-start: var(--s-7); display: grid; grid-template-columns: subgrid;`
  fractional at `1 / 7`, sprint at `8 / 13`.
* `.tiers`: each row `display: flex; justify-content: space-between; gap: var(--s-4); font-variant-numeric: tabular-nums;`
  rows `var(--s-1)` apart; hours in `--ink`, price in `--ink` weight 500. No rules.
* `.after`: `grid-column: 1 / -1; margin-block-start: var(--s-7);` The link is
  underlined text, not a second button.
* **Phone:** everything spans 12 and stacks in DOM order. `var(--s-6)` between
  the two smaller offers.

### 4.6 Proof of work: `proof.tsx`, `proof-panels.tsx`, `id="proof"`

Claims beside evidence. Ground `--bg`. This is the page's one interactive
thing, and it needs no JavaScript.

```
<Reveal as="section" id="proof" class="frame section" aria-labelledby="proof-heading">
  <h2 id="proof-heading" class="h-head heading">{proof.heading}</h2>
  <p class="lead intro">{proof.intro}</p>

  <fieldset class="exhibit">
    <legend class="visually-hidden">{copy.proofLegend}</legend>
    <ol class="claims">
      <li class="claim">                                  <!-- one per proof.claims -->
        {claim.panel ? <input class="radio" type="radio" name="proof-claim" id={`claim-${claim.id}`} defaultChecked={first} /> : null}
        <label class="built" htmlFor={…}>{claim.built}</label>     <!-- a <p class="built"> when panel is null -->
        <p class="why">{claim.relevance}</p>
        {claim.panel ? <ProofPanel id={claim.panel} class="panel" /> : null}
      </li>
    </ol>
  </fieldset>

  {assets with an href ? <ul class="assets">…ExternalLink…</ul> : null}
  <p class="small disclaimer">{proof.disclaimer}</p>
</Reveal>
```

* `.heading`: `grid-column: 1 / 9`. `.intro`: `grid-column: 1 / 8`,
  `max-inline-size: 44ch`, `--ink`, `margin-block-start: var(--s-4)`.
* `.exhibit`: `grid-column: 1 / -1; margin: var(--s-7) 0 0; padding: 0; border: 0; min-inline-size: 0;`
* **Desktop (from 1000px):**
  * `.claims { position: relative; display: grid; row-gap: var(--s-2); min-block-size: 30rem; }`
  * `.claim { inline-size: calc(41.667% - var(--gutter)); padding: var(--s-3) var(--s-4); }`
  * `.radio`: visually hidden but focusable (use the global `.visually-hidden`
    declarations inside the module; do not `display: none` it on desktop).
  * `.built`: `display: block; cursor: pointer;` text face, weight 500,
    `--step-body`, `--ink`. `.why`: `--step-body`, `--ink`,
    `margin-block-start: var(--s-1)`.
  * The chosen claim: `.claim:has(.radio:checked) { background: var(--surface); box-shadow: inset var(--bar) 0 0 var(--ink); }`
    (an inset bar 4px wide in ink; not a hairline).
  * Keyboard focus: `.claim:has(.radio:focus-visible) { outline: var(--focus) solid var(--accent); outline-offset: var(--focus); }`
  * Hover, pointer devices only: `.claim:has(.radio):hover { background: var(--surface); }`
  * `.panel { position: absolute; inset-block-start: 0; inset-inline-end: 0; inline-size: calc(50% - var(--gutter) / 2); visibility: hidden; }`
    `.claim:has(.radio:checked) .panel { visibility: visible; }`
  * The claim with no panel has no radio and is not interactive. It reads as
    text in the same list.
* **Below 1000px, and wherever `:has()` is unsupported**
  (`@supports not selector(:has(*))`): `.radio { display: none; }`,
  `.built { cursor: auto; }`, `.claim { inline-size: 100%; padding: 0; background: none; box-shadow: none; }`,
  `.panel { position: static; inline-size: 100%; visibility: visible; margin-block-start: var(--s-4); }`,
  `.claims { row-gap: var(--s-6); min-block-size: 0; }`. Every panel shows under
  its claim and nothing needs choosing.
* `.assets`: `grid-column: 1 / -1; margin-block-start: var(--s-6); display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-5);`
  rendered only if at least one asset has an `href`.
* `.disclaimer`: `grid-column: 1 / -1; margin-block-start: var(--s-6);`

#### 4.6.1 The product panels: `proof-panels.tsx`

Pictures of Code.Socratic, rebuilt in HTML in its **current** look: dark
aubergine and blush pink. They are not this page's design, so
`proof-panels.module.css` carries the product's palette as local custom
properties and uses pixel sizes from the product. This is the one file allowed
to do that. The typeface is this page's text face (README D7); code uses a
system monospace stack.

`ProofPanel({ id, className })` returns
`<figure class="pic {className}"> <div class="pane" data-ui> … </div> <figcaption class="small">caption</figcaption> </figure>`.
The `data-ui` attribute is required: it tells the design inspector this is a
real interface fragment.

```css
.pane {
  --cs-ground: #1d0e18;      /* the product's page ground, dark theme */
  --cs-panel: #2c1625;       /* its panel */
  --cs-ink: #edccbe;         /* its ink */
  --cs-inv-bg: #edccbe;      /* its inverse tile */
  --cs-inv-ink: #351a2b;
  background: var(--cs-ground);
  color: var(--cs-ink);
  padding: 1rem;
  font-family: var(--text);
}
.frag { display: grid; align-content: start; gap: 12px; padding: 20px; background: var(--cs-panel); font-size: 16px; line-height: 1.5; }
.frag + .frag { margin-block-start: 12px; }
.name, .who { font-size: 14px; line-height: 1.4; color: color-mix(in srgb, currentColor 72%, transparent); }
.turns { display: grid; gap: 10px; }
.turn { display: grid; gap: 2px; }
.said { margin: 0; padding: 10px 12px; background: color-mix(in srgb, currentColor 8%, transparent); }
.note { margin: 0; font-size: 14px; line-height: 1.4; }
.code { margin: 0; overflow: hidden; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 14px; line-height: 1.7; white-space: pre; }
.current { display: block; background: color-mix(in srgb, currentColor 14%, transparent); }
.tests { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 3px; }
.tests span { block-size: 14px; background: currentColor; }
.tests .fail { opacity: 0.25; }
.scale { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 4fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.step { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; min-block-size: 200px; padding: 20px 16px; background: var(--cs-inv-bg); color: var(--cs-inv-ink); }
.step:nth-child(2) { background: var(--cs-panel); color: var(--cs-ink); }
.stepName { font-size: clamp(1.25rem, 2.2vw, 2.4rem); line-height: 1; letter-spacing: -0.04em; font-weight: 600; }
.stepCost { font-size: 17px; line-height: 1.3; }
.trace { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 18px; line-height: 1.4; }
.trace li { position: relative; padding-inline-start: 1.1em; }
.trace li::before { content: ""; position: absolute; inset-inline-start: 0; inset-block-start: 0.55em; inline-size: 6px; block-size: 6px; background: currentColor; }
.pic { margin: 0; }
.pic figcaption { margin-block-start: var(--s-2); }
@media (max-width: 47.4375rem) { .frag { padding: 16px; } .code { font-size: 13px; } }
```

No border and no radius anywhere in a panel: the product's public panels have
none.

The four panels, all content from `proofPanels` in the data file:

| `id` | Markup inside `.pane` |
|---|---|
| `talk` | Two `.frag` blocks, one per stage. Each: `<p class="name">` stage name, `<div class="turns">` of `.turn` (`<p class="who">` "You" or "AI tutor", `<p class="said">`), `<p class="note">`. |
| `run` | One `.frag`: `<p class="name">Code</p>`, `<pre class="code"><code>` with `before`, then `<span class="current">` the current line, then `after`; `<div class="tests" aria-hidden="true">` with `total` spans, the last `total - passed` carrying `.fail`; `<p class="note">`. |
| `credits` | `<ul class="scale" aria-label={label}>` of three `.step`, each `<span class="stepName">` and `<span class="stepCost">`. Easy and Hard are blush with aubergine text; Medium is the dark panel. Widths 1 : 2 : 4. Below 760px the three stack and each gets `min-block-size: calc(var(--w) * 3rem)`, with `--w` set inline from `weight`. |
| `boundary` | One `.frag`: `<div class="turns">` of the two turns, then `<ul class="trace">` of the two lines. |

"AI tutor" is never shortened. The test row is decorative; the note states the
count in words.

### 4.7 Process: `process.tsx`, `id="process"`

Blueprint "Run-in column": one reading column, each paragraph opening with a
bold phrase that names its moment. Ground `--surface`.

```
<Reveal as="section" id="process" class="frame section process" aria-labelledby="process-heading">
  <h2 id="process-heading" class="h-head heading">{process.heading}</h2>
  <ol class="steps">
    <li class="step">
      <p class="body"><strong>{step.title}</strong> {step.body}</p>
      <p class="display fact" aria-hidden="true">{step.fact}</p>
    </li>  ×5
  </ol>
</Reveal>
```

* `.heading`: `grid-column: 4 / 13` (L2).
* `.steps`: `grid-column: 1 / -1; margin-block-start: var(--s-7); display: grid; row-gap: var(--s-6);`
* `.step`: 12-column subgrid. `.body`: `grid-column: 4 / 10` (L2),
  `--step-body`, `--ink`, `line-height: 1.6`, `max-inline-size: 34rem`.
  `strong`: weight 600. `.fact`: `grid-column: 10 / 13`, `--step-head`,
  `--ink`, `align-self: start`, `white-space: nowrap`.
* The order is carried by position and by the words. No numbers, no markers,
  no connecting line. `ol { list-style: none; }`.
* The figure repeats what the paragraph says, so it is `aria-hidden`.
* **Tablet:** `.body` at `1 / 9`, `.fact` at `9 / 13`.
* **Phone:** the figure comes first visually (`order: -1`) at `--step-head`,
  the paragraph under it; `var(--s-5)` between steps.

### 4.8 FAQ: `faq.tsx`, `id="faq"`

Blueprint "Large questions, answers beside". Every answer is open; nothing
collapses, on any width. Ground `--bg`.

```
<Reveal as="section" id="faq" class="frame section" aria-labelledby="faq-heading">
  <h2 id="faq-heading" class="h-head heading">{faq.heading}</h2>
  <div class="rows">
    <div class="row"> <h3 class="q">…</h3> <p class="a">…</p> </div>  ×10
  </div>
</Reveal>
```

* `.heading`: `grid-column: 1 / 7`.
* `.rows`: `grid-column: 1 / -1; margin-block-start: var(--s-7); display: grid; row-gap: var(--s-7);`
* `.row`: subgrid. `.q`: `grid-column: 1 / 7` (L1), text face, weight 500,
  `--step-lead`, `line-height: 1.2`, `max-inline-size: 24ch`, `text-wrap: balance`.
  `.a`: `grid-column: 8 / 13` (L3), `--step-body`, `--ink`,
  `max-inline-size: 42ch`. The first baselines of question and answer align
  (`align-items: baseline` on the row).
* **Phone:** question, then the answer `var(--s-2)` below, then `var(--s-6)`
  before the next. Still no accordion.

### 4.9 Also from Angeronia Labs: `product.tsx`

Small on purpose. Ground `--surface`, `padding-block: calc(var(--section) * 0.6)`.

```
<Reveal as="section" class="frame product" aria-labelledby="product-heading">
  <h2 id="product-heading" class="h-head lines heading"> <span>Also from</span><span>Angeronia Labs</span> </h2>
  <div class="about">
    <p>{product.blurb}</p>
    <p class="links"> <ExternalLink href=…>{product.visit.label}</ExternalLink> {product.build ? <ExternalLink …/> : null} </p>
  </div>
</Reveal>
```

* `.heading`: `grid-column: 1 / 7`. `.about`: `grid-column: 8 / 13`,
  `align-self: end`. Blurb `--step-body`, `--ink`, `max-inline-size: 42ch`.
  `.links`: `margin-block-start: var(--s-4); display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-5);`
* **Phone:** stacked, `var(--s-5)` between heading and text.

### 4.10 The close: `close.tsx`, `id="contact"`

Blueprints "The idea again, inverted" and "Invitation over a cropped name",
merged into one closing screen. Ground `--inv-bg`, ink `--inv-ink`. It is the
page's `<footer>`.

```
<footer id="contact" class="close" data-variant="full" | "compact">
  <Reveal class="frame top">
    <div class="ask">                               <!-- full only -->
      <h2 class="h-statement lines">{two lines}</h2>
      <p class="lead body">{close.body}</p>
      <p class="actions">
        <ButtonLink variant="ink" …>{close.primaryCta.label}</ButtonLink>
        <span>{close.email.lead} <a href="mailto:…">{address}</a></span>
      </p>
    </div>
    <nav class="links" aria-label={copy.footerNavLabel}>
      <ul> footer.page links </ul>                  <!-- full only -->
      <ul> footer.links (ExternalLink where external) </ul>
    </nav>
  </Reveal>
  <p class="frame small legal"> footer.legal lines, then the photograph credit and its licence, each a <span> </p>
  <div class="crop" aria-hidden="true"> <p class="display wordmark">{close.wordmark}</p> </div>
</footer>
```

* `.close`: `background: var(--inv-bg); color: var(--inv-ink); display: grid; grid-template-rows: auto minmax(var(--s-7), 1fr) auto auto; min-block-size: 100svh; padding-block-start: var(--section); overflow: hidden;`
  With `data-variant="compact"`: `min-block-size: 0; padding-block-start: var(--s-7);`
* `.ask`: `grid-column: 1 / 10`. The heading is two authored lines that must
  not wrap. `.body`: `max-inline-size: 40ch; margin-block-start: var(--s-5);`
  `.actions`: `display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3) var(--s-4); margin-block-start: var(--s-5);`
* The button here is **ink-filled** (`variant="ink"`), never gold.
* `.links`: `grid-column: 10 / 13; display: grid; gap: var(--s-5); align-content: start;`
  links at `--step-body`, `li + li { margin-block-start: var(--s-1); }`.
* `.legal`: `grid-row: 3; display: flex; flex-wrap: wrap; gap: var(--s-1) var(--s-5); color: var(--inv-muted);`
  The credit reads "Photograph by Andrew Parlette, cropped" (linked to
  `photoCredit.href`) followed by "CC BY 2.0" (linked to `licenseHref`).
* `.crop`: `grid-row: 4; block-size: 20.8vw; overflow: hidden; padding-inline: var(--m); margin-block-start: var(--s-3);`
  `.wordmark`: `margin: 0; font-size: 33vw; line-height: 0.9; white-space: nowrap;`
  The container cuts the letters along their **bottom** and the long name runs
  off the right edge. Never crop the tops of letters.
* On the white ground: links underline in `--inv-ink`; focus ring
  `outline-color: var(--inv-ink)`.
* **Phone:** `.ask` and `.links` span 12; `.links` becomes two columns
  (`grid-template-columns: 1fr 1fr`) with `margin-block-start: var(--s-6)`;
  `.wordmark` at `40vw` and `.crop` at `25.2vw`.

### 4.11 Legal pages: `legal-page.tsx`

```
<div class="studio">
  <SiteHeader variant="solid" />
  <main id="main" class="frame legal">
    <h1 class="h-head title">{doc.title}</h1>
    <p class="small updated">{copy.updated} <time dateTime={doc.updatedIso}>{doc.updated}</time></p>
    <p class="lead lede">{doc.lede}</p>
    <div class="body"> per section: <h2>, <p>…, optional <ul> </div>
  </main>
  <Close variant="compact" />
</div>
```

* `.legal`: `padding-block: calc(var(--header) + var(--s-7)) var(--section);`
* Everything at `grid-column: 4 / 11` (L2). `.updated` `margin-block-start: var(--s-3)`.
  `.lede`: `--ink`, `margin-block-start: var(--s-5)`, `max-inline-size: 44ch`.
* `h2`: text face, weight 500, `--step-lead`, `margin-block: var(--s-6) var(--s-3)`.
  `p`: `--step-body`, `--ink`, `max-inline-size: var(--measure)`;
  `p + p { margin-block-start: var(--s-3); }` `ul`: `list-style: square; padding-inline-start: 1.1em;`
* **Phone:** everything spans 12.

---

## 5. Shared components

### 5.1 `ButtonLink` (`components/ui/button-link.tsx`)

`<a>` styled as the page's one button shape: **square corners**, flat fill.

| Prop | Values |
|---|---|
| `href` | string |
| `variant` | `"accent"` (default: `--accent` fill, `--accent-ink` text), `"ink"` (`--inv-ink` fill, `--inv-bg` text; for the white section) |
| `size` | `"md"` (default: `min-block-size: var(--control)`, `padding-inline: var(--s-4)`), `"sm"` (`--control-small`, `padding-inline: var(--s-3)`) |
| `className`, `children` | |

`display: inline-flex; align-items: center; justify-content: center;` text
face, weight 500, `--step-body`, no underline.
`transition: transform var(--t-press) var(--ease-out), background-color var(--t-hover) ease;`
`:active { transform: scale(0.97); }` Hover inside
`@media (hover: hover) and (pointer: fine)`: accent goes to `--accent-strong`;
ink goes to `color-mix(in srgb, var(--inv-ink) 82%, var(--inv-bg))`. A link
whose `href` starts with `mailto:` or `#` or `/` opens in place; an `http` link
gets `target="_blank" rel="noreferrer noopener"` and the visually hidden
"(opens in a new tab)".

### 5.2 `ExternalLink` (`components/ui/external-link.tsx`)

`<a target="_blank" rel="noreferrer noopener">` with the label, a visually
hidden " (opens in a new tab)" from `copy.externalLink`, and one inline SVG
arrow (`aria-hidden`, `0.7em` square, `stroke: currentColor`, 2px stroke, a
diagonal line with an arrowhead, `margin-inline-start: 0.3em`). Underlined;
`text-decoration-color` goes from `color-mix(in srgb, currentColor 45%, transparent)`
to `currentColor` on hover.

### 5.3 `BrandMark` (`components/site/brand-mark.tsx`)

The existing disc-and-cursor SVG (same two shapes, `viewBox="0 0 32 32"`), with
the disc filled `var(--accent)` and the cursor `var(--accent-ink)`. Props:
`size` (default 22). Always `aria-hidden` when it sits beside the wordmark.
The lockup text and the old "Philadelphia" sub-line are removed from this
component; the header writes the name itself.

### 5.4 `Reveal` (`components/site/reveal.tsx`)

See section 6.3.

---

## 6. Motion

Transform, opacity and clip-path only. Everything is in the HTML and painted
on the first frame; motion only adds arrival. With JavaScript off, or reduced
motion on, the page is simply in its finished state.

### 6.1 The gate

`app/layout.tsx` puts this inline script first in `<head>`:

```js
document.documentElement.classList.add("js");
setTimeout(function () { if (!window.__angReady) document.documentElement.classList.remove("js"); }, 3000);
```

`Reveal` sets `window.__angReady = true` when it first mounts. If the page's
scripts never run, the class comes off after three seconds and nothing stays
hidden. Every hiding rule below starts with `.js .studio`.

### 6.2 The first screen (the signature move, CSS only)

In `hero.module.css`, inside `@media (prefers-reduced-motion: no-preference)`:

| Element | Move | Timing |
|---|---|---|
| `.photo img` | `scale(1.06)` to none | 1100ms `--ease-expo`, from 100ms |
| `.photo img` | then a drift: `translate3d(-1.2%, 0, 0) scale(1.04)` and back | 40s `--ease-soft`, `infinite alternate`, starting at 1300ms |
| `.name` (the `h1` has `overflow: clip`) | its inner span rises from `translateY(16%)` with opacity 0 to 1 | 800ms `--ease-expo`, from 150ms |
| `.statement` | `translateY(0.75rem)`, opacity 0 to 1 | 500ms `--ease-out`, from 420ms |
| `.actions` | the same | from 480ms |

All settled by 1.2 seconds. Use `animation-fill-mode: both` so the start state
exists only while the animation runs. The drift must pause when the hero is
off screen: `HeaderState` already knows when the page has scrolled, so the
rule is `.js .studio [data-stuck="true"] ~ main .photo img { animation-play-state: paused; }`
written in `hero.module.css` with `:global()` around the header attribute, or
simpler, `Hero` is wrapped in `Reveal` and the drift runs only while
`[data-in]` is present and the hero intersects (the implementer chooses the
simpler of the two that works; the requirement is that the drift is paused
when the hero is not visible and never runs under reduced motion).

### 6.3 Section entrances: `Reveal` and `styles/motion.css`

`Reveal` is a client component:

```tsx
"use client";
type RevealProps<T extends keyof React.JSX.IntrinsicElements = "div"> =
  { as?: T; children: React.ReactNode } & Omit<React.JSX.IntrinsicElements[T], "children" | "ref">;
```

It renders the chosen element with `data-reveal-root`, observes it with an
`IntersectionObserver` (`rootMargin: "0px 0px -12% 0px"`, `threshold: 0.1`),
sets `data-in="true"` the first time it intersects, then stops observing. If
`IntersectionObserver` is missing it sets `data-in` at once. Never a scroll
listener. Never replays.

Children opt in with `data-reveal` and an index through the one permitted
inline style, `style={{ "--i": n } as React.CSSProperties}`:

| `data-reveal` | Manner | Use for |
|---|---|---|
| `"rise"` | opacity 0 to 1, `translateY(1.5rem)` to none; 700ms opacity, 900ms transform, `--ease-out`; delay `calc(var(--i, 0) * var(--stagger-item))` | headings, paragraphs, rows, list items |
| `"line"` | on a span inside a `.line` whose parent has `overflow: clip`: `translateY(105%)` to none, 800ms `--ease-expo`, delay `calc(var(--i, 0) * var(--stagger-line))` | the two statements only (Offers and the close) |
| `"wipe"` | `clip-path: inset(0 100% 0 0)` to `inset(0)`, 700ms `--ease-in-out`, delay 500ms | the gold price block |
| `"shutter"` | `clip-path: inset(0 0 100% 0)` to `inset(0)`, 1100ms `--ease-in-out` | the proof panels' container (apply to `.exhibit`'s panels only on desktop; on phone use `"rise"`) |

Choreography: in each section the heading is `--i: 0`, then text in reading
order, then the picture or the details. Lists arrive row by row: each row gets
the next index. Cap the index at 8 so nothing waits more than about 560ms.
Do not stamp the same single fade on every block.

`styles/motion.css` (Phase A creates it):

```css
@media (prefers-reduced-motion: no-preference) {
  .js .studio [data-reveal-root]:not([data-in]) [data-reveal="rise"] { opacity: 0; transform: translateY(1.5rem); }
  .js .studio [data-reveal="rise"] {
    transition: opacity 700ms var(--ease-out), transform 900ms var(--ease-out);
    transition-delay: calc(var(--i, 0) * var(--stagger-item));
  }
  .js .studio [data-reveal-root]:not([data-in]) [data-reveal="line"] { transform: translateY(105%); }
  .js .studio [data-reveal="line"] {
    display: inline-block;
    transition: transform var(--t-reveal) var(--ease-expo);
    transition-delay: calc(var(--i, 0) * var(--stagger-line));
  }
  .js .studio [data-reveal-root]:not([data-in]) [data-reveal="wipe"] { clip-path: inset(0 100% 0 0); }
  .js .studio [data-reveal="wipe"] { transition: clip-path 700ms var(--ease-in-out) 500ms; }
  .js .studio [data-reveal-root]:not([data-in]) [data-reveal="shutter"] { clip-path: inset(0 0 100% 0); }
  .js .studio [data-reveal="shutter"] { transition: clip-path 1100ms var(--ease-in-out); }
}
```

### 6.4 Under the hand

Buttons press (`scale(0.97)`) and change fill on hover. Text links change
underline colour. The proof claims take the surface tone on hover. Hover
styles sit inside `@media (hover: hover) and (pointer: fine)`. Hover raises
contrast, never lowers it. Nothing lifts, glows or changes weight.

### 6.5 What is not built

No scroll-scrubbed animation, no pinned scene, no parallax, no custom cursor,
no smooth-scroll library, no bounce or elastic easing, no preloader.

---

## 7. Accessibility

* One `h1` (the name). Every section has an `h2`. Questions, problem titles and
  offer names are `h3`. No level is skipped.
* Landmarks: `header`, `nav` (labelled), `main#main`, `footer`. The skip link
  is the first focusable element and lands on `#main`.
* Focus ring: `outline: var(--focus) solid var(--accent); outline-offset: var(--focus);`
  on dark, `--inv-ink` on the white section. Never removed.
* Touch targets at least 44px. The header button is `--control-small`.
* The proof exhibit is a `fieldset` of radio buttons: arrow keys move between
  claims, the label is the claim itself, and all claim text stays readable
  whatever is chosen. Hidden panels use `visibility: hidden`, which also takes
  them out of the accessibility tree.
* Decorative repeats are `aria-hidden`: the process figures, the test-cell
  row, the cropped wordmark, both scrims, the mark beside the name.
* The photograph has real alt text. Its credit is in the footer.
* Nothing depends on colour alone. Nothing flashes. Reduced motion is honoured.
* Headings in capitals are capitalised by CSS, never typed in capitals, so a
  screen reader reads words.

---

## 8. The house rules (the inspector measures these)

| Rule | What it means here |
|---|---|
| Headings two lines or fewer at every width | Author the breaks with `.lines`. Check 1440, 768 and 390. |
| A clear title on the first screen | The name is the `h1`; the sentence above it, at 20px or more, says what this is. |
| Equal outer margins | Only `.frame`'s `padding-inline: var(--m)`. Nothing full-bleed except the hero, section grounds and the cropped wordmark. |
| No section on one side with the other half empty | Each section above closes its far side. |
| No blank stretch over half a screen | Sections are `--section` apart and no more. |
| No small label above a heading | None. `dt` inside a definition list is not an eyebrow. |
| No monospace outside real code | Only the `<pre><code>` in the `run` panel. |
| No index numbering | Process order is position and words. |
| No thin rules, no outlined boxes | Separate by space and by the `--bg` / `--surface` step. The only bar is 4px. |
| No gradients | Except the two neutral scrims on the photograph. |
| No shadows, no glows | The inset 4px bar is drawn with `box-shadow: inset`; that is a flat bar, not a shadow. If the inspector objects, draw it as a `::before` block instead. |
| No rounded corners | None, anywhere, including buttons and panels. |
| No icon-topped cards, no rows of identical cards | None. |
| No styled accent word in a heading | The price block is a block behind the figure, in the same face and size. |
| Two typefaces at most | Imbue and Albert Sans. The system monospace is inside real code only. |
| At least four real pictures | The photograph and the four `data-ui` panels. |
| The page moves | Section 6. At least sixteen elements move over a load and one scroll. |
