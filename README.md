# angeronia.com

Marketing site for **Angeronia Labs LLC** — a software engineering studio in
Philadelphia, and the maker of [Code Socratic](https://code-socratic.angeronia.com/).

Built on **Salesforce Lightning Design System 2** (Cosmos theme) under an
Angeronia theme layer: IBM Carbon Teal as the brand accent, IBM Plex as the
typeface, IBM Carbon for icons. Storybook is the source of truth for the UI —
every component has a story before it appears on a page, and the page itself is
a story.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript — statically prerendered, no backend |
| Design system | [`@salesforce-ux/design-system-2`](https://www.npmjs.com/package/@salesforce-ux/design-system-2) 2.264.1 (Cosmos) + `app/theme.angeronia.css` |
| Icons | [`@carbon/icons-react`](https://www.npmjs.com/package/@carbon/icons-react) |
| Type | IBM Plex Sans / Mono, self-hosted via `next/font` |
| Colour scheme | `next-themes` writing `slds-color-scheme_*` — light, dark, system |
| Storybook | 10.x with `@storybook/nextjs-vite`, `addon-a11y`, `addon-vitest` |

No CSS framework, no utility library, no second icon set. SLDS 2's own classes
and styling hooks are the whole vocabulary.

## Develop

```bash
npm install
npm run dev              # http://localhost:3000
npm run storybook        # http://localhost:6006
npm run build            # production build (fully static)
```

### Gates

All four must pass to merge, and CI runs them on every pull request.

```bash
npm run typecheck        # tsc --noEmit, strict
npm run lint:slds        # slds-linter over app/, components/, stories/ CSS
npm run check:theme      # theme parity, blue-literal sweep, contrast matrix
npm run test:storybook   # every story in Chromium, axe violations fail
```

### Generated artifacts

Four scripts own files that are generated, not written by hand:

```bash
npm run build:css        # vendor/slds2.css — the SLDS 2 stylesheet (git-ignored)
npm run build:theme      # block A of app/theme.angeronia.css — the teal ramp
npm run build:favicon    # app/icon.svg re-tinted onto the teal ramp
npm run build:logos      # public/angeronia-logo-*.{svg,png} — OG/social lockups
npm run check:vendor-css # bundled vs modular parity, needs `npm run dev` running
```

`build:css` runs automatically before `dev`, `build`, `typecheck` and
`storybook`. It exists because the published design-system dist references eight
Salesforce image assets it does not ship — a bundler resolves `url()` statically,
so importing it directly fails the build. All eight are artwork this project
excludes anyway; the script replaces them with `none` and fails if the dist ever
grows a reference it does not recognise.

## The theme layer

`app/theme.angeronia.css` is the **only** file allowed to assign a `--slds-*`
styling hook. SLDS 2 reserves value assignment for theming tools; everywhere
else, hooks are referenced and never re-valued. Three blocks:

* **A — generated.** The seventeen `--slds-r-color-brand-*` reference steps,
  emitted by `scripts/build-theme.mjs` from IBM Carbon Teal. Swapping these
  re-brands every accent, brand-base and focus-ring hook Cosmos derives from
  them. The anchor is step 50 ↔ Teal 60 `#007d79`, the luminance twin of
  Cosmos's `#066afe`, which is what keeps every contrast pairing intact.
* **B — hand-maintained.** The eleven semantic hooks Cosmos hard-codes in blue,
  which the ramp swap cannot reach. Block B references the ramp, never a hex.
* **C — typography.** The two font-family hooks, pointing at IBM Plex.

`npm run check:theme` re-derives that blue-literal list from the shipped tokens
on every run, checks block A against its generator byte for byte, and asserts
WCAG AA across 58 colour pairings in both schemes. A design-system bump that
moves a blue literal fails the build instead of drifting the brand. The current
matrix is committed at
[`docs/design-system/theme-report.md`](docs/design-system/theme-report.md).

## Adding a component

1. Check `components/slds/` — it may already exist.
2. Find the SLDS 2 blueprint. The `design-systems-slds-apply` skill in
   `.claude/skills/` indexes every hook, blueprint, utility and Carbon icon
   name, so you can confirm an artifact exists before writing markup for it.
3. Write `components/slds/<name>/<Name>.tsx`. Markup from the blueprint;
   behaviour, ARIA and keyboard handling are yours — blueprints are style-only.
4. Add the component's dist stylesheet to `WRAPPER_TO_DIST` and
   `MODULAR.component` in `scripts/build-vendor-css.mjs`. The build fails until
   you do.
5. Write `<Name>.stories.tsx`: Default, every variant and size, states, long
   content, dark. The dark story is not optional.
6. Run the four gates.

The full contract is
[`docs/design-system/DESIGN-RULES.md`](docs/design-system/DESIGN-RULES.md).
Every decision and every deviation from the plan is recorded in
[`docs/design-system/DECISIONS.md`](docs/design-system/DECISIONS.md); the
original plan is
[`docs/plans/slds2-redesign-plan.md`](docs/plans/slds2-redesign-plan.md).

## Layout

```
app/
  layout.tsx              fonts, metadata, JSON-LD, providers, skip link
  page.tsx                composes storied sections and nothing else
  slds.css                the CSS entry: vendor -> theme -> site
  theme.angeronia.css     THE theme layer (blocks A, B, C)
  site.css                site composition only, hooks throughout
  icon.svg                favicon, on the teal ramp
  robots.ts  sitemap.ts
components/
  slds/                   design-system wrappers, one folder each, with stories
  site/                   page sections built from components/slds
lib/slds/                 cx(), colour-scheme helpers
data/angeronia.ts         every string the site renders
scripts/                  theme, favicon, logo, vendor-CSS and parity tooling
stories/foundations/      Brand, Color, Typography, Spacing/Shape/Motion, Icons
stories/pages/            the whole page, as a story
docs/design-system/       DESIGN-RULES.md, DECISIONS.md, theme-report.md
```

## Accessibility

WCAG 2.2 AA in both colour schemes, and it is enforced rather than asserted:
`check:theme` covers the theme's own pairings without a browser, and
`test:storybook` runs axe over every story — including the whole page in both
schemes — with violations failing the run rather than reporting.

Semantic HTML throughout, a skip link that works before hydration, the theme's
own focus ring, focus management for the dialog and menu, every icon either
labelled or `aria-hidden`, and no meaning carried by colour alone.

Lighthouse (mobile, production build): performance 98, accessibility 100, best
practices 100, SEO 100, CLS 0.

## Licensing and third-party assets

* **SLDS 2** (`@salesforce-ux/design-system-2`, `@salesforce-ux/design-tokens`)
  is distributed under the Salesforce Terms of Use in each package's
  `LICENSE.txt` — a non-OSI licence granting a royalty-free right to reproduce,
  derive and distribute, with an indemnification clause, "AS IS". The notices
  stay in `node_modules`.
* **IBM Carbon icons** (`@carbon/icons-react`, `@carbon/colors`) are Apache-2.0.
  Glyphs are used unmodified. No UI attribution is required.
* **IBM Plex** is SIL OFL 1.1, self-hosted through `next/font`.
* **`forcedotcom/sf-skills`** is Apache-2.0; the three `design-systems-*` skills
  are vendored under `.claude/skills/` with the upstream licence.

**No Salesforce assets ship in this product.** `@salesforce-ux/icons` (CC-BY-ND
Salesforce object, product and Einstein artwork) is not installed, SLDS 1 is not
installed, and no SLDS illustration, spinner image, product icon or application
chrome — Global Header, Global Navigation, Brand Band, App Launcher, Welcome
Mat, Trial Bar, Setup Assistant — is used. The build strips the dist's eight
dangling references to Salesforce artwork and fails if it finds a ninth. There
is no "Salesforce", "Lightning", "Cosmos" or "Einstein" wording anywhere in the
rendered site.

`slds-*` class names and `--slds-*` custom properties do appear in the markup
and CSS: they are the API of the stylesheet, not trademark use. This project is
not affiliated with or endorsed by Salesforce.

© 2026 Angeronia Labs LLC.
