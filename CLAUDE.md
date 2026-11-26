# CLAUDE.md — angeronia.com

Marketing site for Angeronia Labs LLC (Next.js 15 App Router, React 19,
TypeScript, statically prerendered), built on **the spine**: plain CSS, Hanken
Grotesk, near-black ink on off-white paper, one 2px line down the page that
every statement steps across. Storybook is the single source of truth for UI.

## Current state (2026-11-25)

The site ran on IBM Carbon from 2026-09-08 to 2026-11-25 (and on SLDS 2
before that). It does not any more: on 2026-11-25 the owner chose the spine
draft, and Carbon, Sass, `next-themes` and the colour-scheme switcher left the
studio site. The port is in place (ADR-031): the home page is the draft's
sections as components on the spine, with the Games section ADR-020 adds, the
legal pages share its masthead, line and footer, and `Spine` moves the line.

* **The draft** — `.taste-skill/round2/type-only-statement/` (git-ignored):
  `index.html`, `css/page.css`, `js/page.js`, `notes.md`, screenshots in
  `final/`. It is the visual source of truth.
* **`docs/design-system/DESIGN-RULES.md`** — the binding contract. Read it
  before touching any UI.
* **`docs/design-system/DECISIONS.md`** — every decision and every deviation.
  **ADR-023 is the one to read first**: what the spine is built on, what is
  history (ADR-012 … ADR-018, O4, D6, D10, D11), and what still holds (ADR-019
  … ADR-022). ADR-024 … ADR-030 cover one colour scheme, motion, the retired
  Möbius, no GSAP, the third-person voice, the games' parity and the contrast
  gate. ADR-031 is the port and where it departs from the draft; ADR-032 the
  fixes after its review (no layout change on hydration, the replica's
  fallback for a stalled script, `Pair`'s mine-first DOM order).
  ADR-033 is the owner's review of the built site (the rulings below).

Record any deviation in `DECISIONS.md` **before** writing the code that
deviates.

## Design contract (summary of DESIGN-RULES.md — binding for every UI change)

For the studio site. The games are outside it; see **Games** below.

1. **Plain CSS.** Two global stylesheets, imported once by `app/layout.tsx`:
   `styles/tokens.css` (every design value) then `styles/base.css` (reset, type,
   focus). Every component has a CSS Module beside it (`<name>.module.css`,
   camelCase classes, joined with `cx()` from `lib/cx.ts`). No CSS framework,
   utility library, CSS-in-JS, Sass or icon set. No inline `style` except a
   custom property whose value is data (`style={{ "--i": 1 }}`, ADR-005).
2. Where a style goes: a token → a type step from `styles/type.module.css` →
   a rule in the component's module → a new token in `tokens.css` (a new colour
   needs its contrast pairs declared). A component never styles another's
   elements; pass a `className`.
3. Never a literal colour, type size, weight, line height, tracking, duration
   or easing outside `tokens.css`. Space comes from the scale (`--space-1`…`8`
   fixed, `--space-xs`…`4xl` fluid, `--margin`, `--section-space`); a length that
   belongs to one component (an `em` measure, an aspect ratio) may live in its
   module with a comment. Tokens are assigned only in `tokens.css`. The one
   exception: the Code.Socratic replica's own `--ui-*` palette, in its module.
4. **One colour scheme** (ADR-024). Components read the band roles
   (`--band-ground`, `--band-ink`, `--band-soft`, `--band-spine`,
   `--band-focus`, `--band-frame`) and the button's (`--button`,
   `--button-ink`, `--button-hover`), never `--palette-*`. Every studio band
   carries `data-band="paper"` or `data-band="dark"` (the one charcoal band, the
   belief); sage is only on buttons. Every pair is declared as an `@contrast`
   line in `tokens.css`. **No token may take a name a game defines** (the games
   set `--ink`, `--accent`, `--ground`, `--muted`… on `<html>`, ADR-029).
5. **Type:** Hanken Grotesk 400/500/600 (never 700) for everything; IBM Plex Mono
   400 only for code inside the replica. Five steps — `display`, `head`, `lead`,
   `body`, `small` — as tokens (`--step-*`, `--leading-*`, `--tracking-*`) and as
   classes in `styles/type.module.css`. A heading's look comes from a step, never
   its level.
6. **Breakpoints** are fixed: `(max-width: 899px)` narrow (axis at 22%, pairs
   stack), `(max-width: 599px)` phone, `(min-width: 900px) and (max-width:
   1099px)` the replica's panes stack.
7. **The spine:** the axis at `--axis` (38vw; 22vw narrow), `--axis-inset` from
   the content edge; a `--spine-width` (2px) line in `--band-spine`, broken
   wherever something crosses it. Statements **cross** it (split at the axis),
   **hang** from it (`--hang`) or are **pushed** past it (`--push`). Pairs: the
   reader's side ends at the axis, the studio's side starts after it. Square:
   no radius, no shadow (the replica excepted).
8. **Motion** (ADR-025): scroll-linked motion is allowed for the spine. The
   finished page is the default — no script, a failed script and reduced motion
   all get it. Motion keys off `html.js` (set in `<head>` by the layout) inside
   `prefers-reduced-motion: no-preference`. Native scroll only; transforms and
   opacity; `--dur-*` / `--ease-*` tokens; nothing autoplays; the pull and the
   held scene are desktop only. Plain TypeScript, no GSAP (ADR-027).
9. Pictures: the footer's two credited photographs (Angerona, the Fasti
   Antiates) and the Code.Socratic replica. Never the Möbius (ADR-026).
10. Accessibility: WCAG 2.2 AA; semantic HTML, the skip link, a visible 2px
    focus ring (scoped to `[data-band]`), tabs pattern in the replica, every SVG
    labelled or `aria-hidden`, no colour-only meaning.
11. Every component has a story before it is used on a page. The preview wraps
    stories in `data-band="paper"`; `parameters: { band: "dark" }` or
    `band: false` (a page). Viewports `phone`/`tablet`/`desktop` are defined in
    the preview. Page stories render the page component itself.
12. Gates: `typecheck`, strict `build`, `test:storybook` (axe fails a story),
    `check:contrast`. For the games, also `npm test`, `test:e2e`, and the parity
    gate whenever anything global changes. There is no CSS linter.
13. Copy lives in `data/angeronia.ts`. **Third person** (ADR-028): no I, me, my,
    we, our or us in the studio's copy; name Pratik Kubal or say "the studio" /
    "Angeronia Labs"; **never a pronoun for Pratik**. "You" for the reader stays;
    the replica's product UI stays as the product shows it.
14. Never reinstall `@salesforce-ux/*` (ADR-015), `@carbon/*`, `next-themes` or
    `@fontsource/*` (ADR-023, ADR-024).

## The owner's rulings on the draft (2026-11-25, ADR-023)

The spine line is 2px. Third-person voice. Keep the story of the name (the
Angerona statue and the Fasti photographs, with credits). Keep the headline
"One engineer, screen to server". Drop "then hand them over." from the hero's
supporting sentence. No sample-test or hidden-test metrics on the page (the
replica's Results tab keeps them). Code.Socratic is
`https://www.code-socratic.com` (`code-socratic.angeronia.com` is a 404).

After seeing the built site (2026-11-25, ADR-033): the button is "Email the
studio"; the showcase heading is "Code.Socratic, built alone"; the replica's chat
turn is "Done. The tests pass."; the pull opens both halves evenly, and "What | the studio" and "Tell |
Pratik what" cross early so they still open wide; the privacy
policy's untrue lines (light/dark storage, IBM Plex, client sites) are corrected,
legal "we" kept; "Right now Angeronia Labs is one person …" stays.

## Where things are

```
app/layout.tsx         fonts, tokens + base, the js-class script, metadata, JSON-LD, skip link, page frame
app/fonts.ts           next/font: Hanken Grotesk (--font-hanken), IBM Plex Mono (--font-plex-mono)
app/page.tsx           the home page: the sections in order, then Spine
app/icon.svg           the mark; app/opengraph-image.tsx + twitter-image.tsx draw the social card (social-card.tsx)
components/site/spine-engine.ts  the line, its breaks, the pull and the held belief (one rAF loop, no GSAP)
styles/tokens.css      every token, and the @contrast pairs
styles/base.css        reset, body type, focus ring, selection, .visually-hidden
styles/type.module.css the five type steps as classes
components/site/       the studio's components, each with .module.css and .stories.tsx
stories/foundations/   Tokens.stories.tsx
stories/pages/         the page stories
scripts/check-contrast.mjs  the contrast gate
scripts/games-parity.ts     the games' parity gate
```

## Games (outside the design system)

Sudoku and Solitaire moved here from `../portfolio` (2026-10-23) and live under
`/games` (**ADR-021**): `/games/sudoku`, `/games/solitaire`, and `/games`
itself, a launcher of their icons meant to be saved to an iPhone's home screen.
The old `/sudoku`, `/solitaire` and `/Solitaire` redirect (308). Color Tap,
paint by numbers, was made here (2026-10-27) at `/games/paint-by-numbers`
(**ADR-022**, no short path): its puzzles are converted from the photos in
`public/paint-by-numbers/` **at build time** (`npm run color-tap:puzzles`, run
by `predev` and `prebuild`; the output is committed, and CI's `--check` fails a
PR with a bad or unconverted photo). They keep their
own look — their own CSS, tokens, type, motion and Phosphor icons — and the
contract above does not govern them: **ADR-019** draws the line (rule 10, rule
12's typecheck and build gates, and rule 14 still apply), and the launcher sits
on their side of it. The home page's
Games section links to them too (**ADR-020**); nothing else does. They are not
in the header, the footer or `sitemap.ts`, and they are `noindex`.

* **A new game** goes at `app/games/<slug>/` with its own `apple-icon.png`
  (180 × 180, opaque), plus one entry in `games` in `data/angeronia.ts`; both
  launchers read that list. Then `npm run games:icon` to redraw the launcher's
  own icon, and give the game a link back to `/games` (there is no back button
  in a saved web app).

* Read `docs/games/sudoku.md`, `docs/games/solitaire.md` or
  `docs/games/color-tap.md` before touching a game's `components/` or `lib/`
  folder; they are the games' design and test notes (Sudoku's and Solitaire's
  carried over from the portfolio's `CLAUDE.md`).
* **A new Color Tap picture** is a JPG or PNG dropped into
  `public/paint-by-numbers/`; `npm run dev` converts it. Commit the photo with
  `public/paint-by-numbers/puzzles/` and `lib/color-tap/pictures.ts`. Changing
  anything in `lib/color-tap/` that alters a puzzle means bumping
  `PIPELINE_VERSION` in `lib/color-tap/levels.ts` by hand (code edits alone
  don't remake puzzles: players' progress comes first) and checking
  `npm run color-tap:preview`. Remade puzzles keep the old ones as retired, so
  paintings already begun carry on on them; never delete a retired puzzle.
* Their gates are `npm test` (Vitest, node) and `npm run test:e2e` (Playwright:
  desktop Chromium, and an iPhone and an iPad in WebKit), on top of typecheck
  and build.
* They render under the root layout, so the studio's `tokens.css`, `base.css`
  and page frame reach them (ADR-029). `components/games/base.css` puts back
  the browser defaults they were built on and pins, on each shell, the type the
  old Carbon frame gave them (16px, line height 1.5, no tracking); keep its
  selectors at `html body :where(...)` and never use `:is()` there (the build
  prefixes it to `:-webkit-any()`, which counts as a class). After any change
  to something global, prove nothing moved:
  `npm run build && npx next start -p 3417`, then
  `npm run games:parity -- baseline` on the tree before the change and
  `npm run games:parity -- compare` after (`PARITY_PORT` picks another port).
* Sudoku's locked secrets use `data-locked`, never `data-hidden` (Carbon used to
  hide every `[data-hidden]`; keep it that way).
* Nothing in the studio site imports from the games, and the games import
  nothing from `components/site/` or `styles/`, and read no
  studio token.

## Adding a component

Look at the draft first: the component is probably already drawn there. Build
it in `components/site/<name>.tsx` with `<name>.module.css` and
`<name>.stories.tsx` (default, variants, long content, `phone` viewport where it
changes under 900px), reading only tokens and the band roles. A client
component (`"use client"`) only when it needs the browser: motion, the tabs.

## Commands

```bash
npm run dev            # Next dev (Turbopack). Port 3000 is often taken: use -- --port <n>
npm run build          # strict build — no ignoreBuildErrors
npm run storybook      # Storybook 10 (nextjs-vite), :6006

npm run typecheck      # tsc --noEmit
npm run check:contrast # every @contrast pair in styles/tokens.css, at AA, in every band
npm run test:storybook # every story in Chromium; axe violations fail
npm test               # the games' unit tests (Vitest, node)
npm run test:e2e       # the games end to end (Playwright: Chromium + iPhone/iPad WebKit);
                       # E2E_PORT=<n> reuses a server already on that port. It must be a DEV
                       # server: Color Tap's specs drive window.__colorTap, a hook that is off
                       # in production, so against `next start` they all time out
npm run games:parity -- baseline|compare  # the games' computed styles, before and after a global change
npm run solitaire:cards  # Solitaire's card faces, from the Vector Playing Cards pack
npm run solitaire:deals  # re-prove Solitaire's bank of winnable deals (~5 min)
npm run games:icon     # redraw the /games launcher's home-screen icon from the games' icons
npm run color-tap:puzzles  # Color Tap: photos -> puzzles (also before dev/build; --check in CI)
npm run color-tap:preview -- <dir>  # before | after | photo strips and metrics, per photo and level
npm run color-tap:icon     # Color Tap's home-screen icon
```

`app/icon.svg` and the social card (`app/opengraph-image.tsx`, drawn by
`next/og` from `app/social-card.tsx` with the TTFs in `assets/og/`) are made by
hand (ADR-026, ADR-031); there is no generator script for either.

Sister product: Code.Socratic (`../code-socratic`, live at
`https://www.code-socratic.com`). It stays on Carbon, teal and IBM Plex; this
site no longer shares that look (ADR-023). The page shows the product inside the
replica, in the product's own colours.
