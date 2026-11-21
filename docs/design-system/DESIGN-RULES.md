# Design rules — angeronia.com

Binding for every UI change to the studio pages. `CLAUDE.md` carries the same
rules in summary; if the two disagree, this file wins.

Deviating from a rule needs an entry in [`DECISIONS.md`](DECISIONS.md) **before**
the code changes.

**Scope.** The studio pages: `/`, `/privacy`, `/terms`. The games keep their own
look and sit outside these rules; [ADR-019](DECISIONS.md) draws the boundary.

> Rewritten 2026-11-20. The version this replaces described IBM Carbon and is
> in the git history; the reasoning for the move is [ADR-023](DECISIONS.md).

## 1. The look is a dealt direction, not a library

"The name as a monument": the studio name is the headline, fitted to the full
width of the first screen; everything after it is small and calm. The
specification is `docs/plans/monument-redesign/design.md`. There is no
component library, CSS framework, utility library or icon set.

## 2. Tokens only

Colour, type sizes, spacing, durations and easings come from
`styles/tokens.css`. No raw value in a component. One exception:
`components/site/proof-panels.module.css` carries Code.Socratic's palette,
because those panels are pictures of another product (ADR-025).

## 3. Colour

One ground (`--bg`), one ink (`--ink`), one accent (`--accent`). Running text
is the full ink; `--muted` is for secondary notes. Gold marks the action and
one price, and nothing else. Surfaces are told apart by tone, never by a line
or a shadow. The closing section inverts to white.

## 4. Type

Imbue, in capitals, for the name, titles and statements. Albert Sans for
everything read at length. Six sizes, no others. A heading never runs past two
lines at any width; author the break.

## 5. Space and frame

One 12-column grid (`.frame`), one pair of equal outer margins, three anchor
lines (columns 1, 4 and 8). No section sits on one side with the other half
empty. Sections are `--section` apart.

## 6. Shape

Square corners everywhere. No shadows, no gradients except the neutral scrims
on the photograph, no hairline rules, no outlined boxes. The only bar is 4px.

## 7. Motion

Transform, opacity and clip-path. Entrances once, staggered, varied by content.
Nothing tied to scroll position. Finished state without JavaScript or with
reduced motion (ADR-027).

## 8. Pictures

Real ones only: the credited photograph and real product panels. No stock
illustration, no abstract shapes, no icons in tiles. A found photograph is
checked for mirroring, age and brand names, and credited in the footer
(ADR-028).

## 9. Accessibility

Semantic HTML, a skip link, a visible focus ring, one `h1`, a heading on every
section, 44px touch targets, no colour-only meaning, WCAG 2.2 AA.

## 10. Story before page

Every component has a story before it is used on a page. `Pages/Home` renders
`HomePage`, the same component `app/page.tsx` renders.

## 11. Truth

Nothing untrue ships. No customer names, logos, quotes or counts. "Built",
never "shipped". The copy is checked against the product's code, not its
plans. Prices live once, in `PRICES`.

## 12. Gates

`typecheck`, the strict build, `test:storybook` (axe), `check:contrast`, the
games' `npm test` and `test:e2e`, and the design skill's inspector at 0 FAIL.
Styles live in `.css` files; the `style` attribute may carry only a custom
property whose value is data.

## 13. Content

Copy lives in `data/angeronia.ts`, not in components.

## 14. Never

No `@salesforce-ux/*` package (ADR-015). No tracker, cookie or third-party
embed without a decision recorded here and a change to the privacy policy.
