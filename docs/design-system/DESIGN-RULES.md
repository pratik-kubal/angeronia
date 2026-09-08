# Design rules — angeronia.com

Binding for every UI change in this repository. `CLAUDE.md` carries the same
rules in summary form for agent sessions; if the two ever disagree, this file
wins and `CLAUDE.md` is corrected to match.

Deviating from any rule below requires an entry in [`DECISIONS.md`](DECISIONS.md)
**before** the code changes.

> Rewritten 2026-09-08 for IBM Carbon. The version this replaces described SLDS 2
> and is in the git history; the reasoning for the move is
> [ADR-015](DECISIONS.md).

---

## 1. One design system

IBM Carbon v11 (`@carbon/react`, Apache-2.0) is the design system, under the
Angeronia brand override in `styles/_themes.scss`. No other CSS framework,
utility library or icon set. Icons come from `@carbon/icons-react` only.

Sources of truth, in order:

1. [`carbondesignsystem.com`](https://carbondesignsystem.com) — the guidelines.
2. `node_modules/@carbon/react/scss` — the CSS that actually ships, and the only
   authority on what a token resolves to.
3. `styles/_themes.scss` — the brand layer.
4. `../code-socratic/apps/web/styles` — the sister product's Carbon
   implementation, for how a pattern has already been solved in this family.

## 2. The selection ladder

Reach for the first rung that works, and only then the next:

1. A component from `@carbon/react`.
2. A composition of Carbon parts in `components/ui/` — a `Card` is a `Tile`
   plus three rows. It ships with a story.
3. A `site-*` rule in `styles/_site.scss` built from Carbon tokens.
4. A `--site-*` value declared at the top of `_site.scss`, for something Carbon
   has no token for at all — a measure, a border width, a figure size.

Rungs 3 and 4 carry a comment naming the Carbon gap they are filling. "Carbon
has no media object" is a reason; "it was easier" is not.

## 3. Never hard-code, never re-assign

* Never hard-code a colour, spacing value, type size, weight or duration.
  Reference the token: `theme.$*` in Sass, `var(--cds-*)` in plain CSS.
* Never assign a `--cds-*` custom property outside `styles/_themes.scss`. That
  file is the theme layer and the one sanctioned exception.
* Never override a `.cds--*` selector. Add a `site-*` class beside it —
  `_site.scss` loads after Carbon, so an equal-specificity site rule wins on
  source order without an `!important` and without touching Carbon's own
  selector.
* Every bare number in `_site.scss` is a bug. If Carbon has no token for it, it
  becomes a `--site-*` custom property at the top of the file, with a comment.

## 4. Colour by role, in pairs

Text on a ground uses that ground's paired ink. Links are `$link-primary`;
headings and body ink are `$text-primary`, secondary copy `$text-secondary`.
The `support-*` family means status and nothing else — a technology tag is
never `support-success`.

Brand teal reaches the page only through the tokens `_themes.scss` reassigns
(`link-primary`, `background-brand`, `button-primary`, `focus`,
`border-interactive`, `icon-interactive` and their neighbours) — never as a
literal, and never through a `support-*` token.

**Layers, not shades.** Carbon's ground steps *up* from the page: `$background`
is the page, `$layer-01` a shaded band, `$layer-02` a card on that band. Use
Carbon's `<Layer>` to do the stepping; a component must never know which band it
is sitting on.

## 5. Typography

IBM Plex Sans (300/400/600/700) and IBM Plex Mono (400), loaded only in
`app/layout.tsx` via `next/font` and read only by Carbon's `$font-families` map
in `styles/_config.scss`. Never a `font-family` literal anywhere else.

Type comes from `type.type-style('<token>')`, never from a `font-size`. The page
root sets `body-02` once and body copy inherits it. The `fluid-*` styles are for
the marketing top end — the display heading and section headings; the fixed
styles are for everything inside a component.

## 6. Spacing and sizing

`$spacing-01` … `-13` for margin, padding and gap; `$layout-01` … `-07` for the
rhythm between page sections. Widths and measures are `--site-*` values, because
Carbon has no scale for them.

## 7. Shape

**Carbon is square, and the site takes it as it comes.** No radius, no
elevation, no density toggle. Carbon 11 has no shadow scale, so a card's edge is
a border. This rule replaces the SLDS-era "buttons pill, cards `border-4`,
inputs `border-2`" outright — see [ADR-015](DECISIONS.md). Carbon's own rounded
parts (a `Tag`, a focus ring) stay as Carbon draws them.

## 8. Motion

Carbon's own durations and easings only (`motion.$duration-*`,
`motion.motion()`). Nothing scroll-linked. No autoplay.

One standing exception: the hero Möbius rotates on its own, under the waiver in
ADR-013. It is scoped to that figure and is not a precedent.

## 9. Illustration

At most one per page, and it supports the text rather than replacing it.
On the home page that one is the hero Möbius (ADR-012).

## 10. Accessibility

Semantic HTML, a skip link, Carbon's visible focus ring, focus management for
dialogs and menus, every icon either labelled or `aria-hidden`, 44 px touch
targets, no colour-only meaning, WCAG 2.2 AA in both themes.
`npm run check:theme` covers the brand override's own pairings; the axe pass
over every story covers what the page actually renders.

## 11. Story before page

Every component has a story before it is used on a page. Pages are compositions
of storied components and have a page-level story of their own.

## 12. Gates

A change merges only when `check:theme` is clean, Storybook a11y is clean,
TypeScript is clean and the strict build passes. Styles live in `.scss` files —
no inline `style={}`, no CSS-in-JS.

One carve-out, and only this one: the `style` attribute may carry a `--site-*`
custom property whose value is **data** (a progress length, a chart value),
consumed by a rule in a `.scss` file. It may never carry a CSS property, and
never a design value. See [`DECISIONS.md`](DECISIONS.md) ADR-005.

There is no CSS linter. `slds-linter` was retired with SLDS rather than replaced
(ADR-018); the axe pass is the gate that catches real problems.

## 13. Content

Copy lives in `data/angeronia.ts`, not in components.

## 14. Third-party asset hygiene

Carbon is Apache-2.0 and needs no attribution in the UI; the licence notices
stay in `node_modules`. Glyphs are used unmodified. No IBM trademark, wordmark
or product artwork appears in the product, and no `@salesforce-ux/*` package is
ever reinstalled — the reason is [ADR-015](DECISIONS.md), and it has not changed.

---

## Definition of "designed"

A component is done when: the story exists → a11y clean → `check:theme` clean →
reviewed in light **and** dark → used on a page.
