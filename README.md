# angeronia.com

Marketing site for **Angeronia Labs LLC** — a software engineering studio in
Philadelphia, and the maker of [Code Socratic](https://code-socratic.angeronia.com/).

Built on **IBM Carbon v11** under an Angeronia brand override: Carbon Teal in
place of Carbon Blue, IBM Plex as the typeface, Carbon for icons. Storybook is
the source of truth for the UI — every component has a story before it appears
on a page, and the page itself is a story.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript — statically prerendered, no backend |
| Design system | [`@carbon/react`](https://www.npmjs.com/package/@carbon/react) 1.115 + `styles/_themes.scss` |
| Icons | [`@carbon/icons-react`](https://www.npmjs.com/package/@carbon/icons-react) |
| Type | IBM Plex Sans / Mono, self-hosted via `next/font` |
| Themes | Carbon White / Gray 100, switched by `data-theme` via `next-themes` |
| Storybook | 10.x with `@storybook/nextjs-vite`, `addon-a11y`, `addon-vitest` |

No CSS framework, no utility library, no second icon set. Carbon's own classes
and tokens are the whole vocabulary.

## Develop

```bash
npm install
npm run dev              # http://localhost:3000
npm run storybook        # http://localhost:6006
npm run build            # production build (fully static)
```

### Gates

All three must pass to merge, and CI runs them on every pull request.

```bash
npm run typecheck        # tsc --noEmit, strict
npm run check:theme      # token parity, contrast matrix, favicon
npm run test:storybook   # every story in Chromium, axe violations fail
```

There is no CSS linter. `slds-linter` was retired with SLDS rather than replaced
— the axe pass over every story is the gate that catches real problems. See
[`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-018.

### Generated artifacts

```bash
npm run build:favicon    # app/icon.svg re-tinted onto the teal ramp
npm run build:logos      # public/angeronia-logo-*.{svg,png} — OG/social lockups
```

Both, and `check:theme`, resolve their colours by compiling
`styles/globals.scss` and reading the custom properties back out
(`scripts/carbon-tokens.mjs`). Nothing is duplicated in JavaScript, so a raster
or a contrast assertion cannot drift from the stylesheet the site ships.

## The theme layer

`styles/_themes.scss` is the **only** file allowed to assign a `--cds-*` token.
Everywhere else they are referenced and never re-valued. It does three things:

* Emits Carbon's **White** token set on `:root` and **Gray 100** on
  `:root[data-theme="dark"]`, plus a `prefers-color-scheme` fallback for the
  no-JS case.
* Applies the **brand override** — 21 tokens moved from Carbon's Blue 60 family
  to Teal. Teal 60/40 are luminance twins of Blue 60/40, which is what lets the
  swap keep every contrast pairing Carbon designed around blue. Everything else
  keeps its stock value; `support-*` is deliberately untouched, because a brand
  colour that can be mistaken for "success" is a colour-only meaning waiting to
  happen.
* Declares the handful of `--site-*` values that vary by theme: the hero
  Möbius's lit and shaded faces, and the four syntax colours in the Code
  Socratic replica.

`npm run check:theme` checks that every token the override assigns is one Carbon
actually defines, and asserts WCAG 2.2 across 40 pairings in both themes. The
current matrix is committed at
[`docs/design-system/theme-report.md`](docs/design-system/theme-report.md).

## Adding a component

1. Check `@carbon/react` — it probably already exists there.
2. If not, ask whether what you need is a *composition* of Carbon parts (a
   `Card` is a `Tile` plus three rows) or something Carbon genuinely has no word
   for (a media object, an avatar, a cluster). Both go in `components/ui/`;
   nothing else does.
3. Write `<name>.stories.tsx`: Default, every variant and size, states, long
   content, dark. The dark story is not optional.
4. Run the three gates.

The full contract is
[`docs/design-system/DESIGN-RULES.md`](docs/design-system/DESIGN-RULES.md).
Every decision and every deviation is recorded in
[`docs/design-system/DECISIONS.md`](docs/design-system/DECISIONS.md).

## Layout

```
app/
  layout.tsx              fonts, metadata, JSON-LD, providers, skip link
  page.tsx                composes storied sections and nothing else
  icon.svg                favicon, on the teal ramp
  robots.ts  sitemap.ts
styles/
  _config.scss            Carbon configured once — fonts, CSS grid only
  _themes.scss            THE theme layer: White + Gray 100 + the teal override
  _site.scss              site composition only, Carbon tokens throughout
  globals.scss            config -> carbon -> themes -> site
components/
  ui/                     only what Carbon does not provide, each with a story
  site/                   page sections, built from @carbon/react and ui/
lib/                      cx(), theme helpers
data/angeronia.ts         every string the site renders
scripts/                  token resolver, contrast gate, favicon, logos
stories/foundations/      Brand, Color, Typography, Spacing/Shape/Motion, Icons
stories/pages/            the whole page, as a story
docs/design-system/       DESIGN-RULES.md, DECISIONS.md, theme-report.md
```

## Accessibility

WCAG 2.2 AA in both themes, and it is enforced rather than asserted:
`check:theme` covers the brand override's own pairings without a browser, and
`test:storybook` runs axe over every story — including the whole page in both
themes — with violations failing the run rather than reporting.

Semantic HTML throughout, a skip link that works before hydration, Carbon's own
focus ring, every icon either labelled or `aria-hidden`, and no meaning carried
by colour alone.

## Licensing and third-party assets

* **IBM Carbon** (`@carbon/react`, `@carbon/styles`, `@carbon/themes`,
  `@carbon/icons-react`, `@carbon/colors`) is Apache-2.0. Glyphs are used
  unmodified. No UI attribution is required; the notices stay in `node_modules`.
* **IBM Plex** is SIL OFL 1.1, self-hosted through `next/font`.

No IBM trademark, wordmark or product artwork ships in this product, and this
project is not affiliated with or endorsed by IBM. `cds--*` class names and
`--cds-*` custom properties do appear in the markup and CSS: they are the API of
the stylesheet, not trademark use.

**On Salesforce Lightning Design System.** This site ran on SLDS 2 until
2026-09-08. It no longer does, and no `@salesforce-ux/*` package remains: the
SLDS 2 Terms of Use are not an OSI licence, and their indemnity clause covers
claims arising from *any application you develop with the Software* — which is
this site's own content, uncapped, running to a company. The reasoning, and what
the move cost, are in
[`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-015 and in
[`docs/plans/carbon-migration-plan.md`](docs/plans/carbon-migration-plan.md).

© 2026 Angeronia Labs LLC.
