# Design rules — angeronia.com

Binding for every UI change in this repository. This is §3 of
[`docs/plans/slds2-redesign-plan.md`](../plans/slds2-redesign-plan.md),
promoted to a standalone contract. `CLAUDE.md` carries the same rules in
summary form for agent sessions; if the two ever disagree, this file wins and
`CLAUDE.md` is corrected to match.

Deviating from any rule below requires an entry in [`DECISIONS.md`](DECISIONS.md)
**before** the code changes.

---

## 1. One design system

SLDS 2 (Cosmos + the Angeronia theme layer) is the design system. No other CSS
framework, utility library or icon set. Icons come from `@carbon/icons-react`
only.

Sources of truth, in order:

1. [`lightningdesignsystem.com`](https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2)
   — the SLDS 2 guidelines (section IDs in plan §1.3).
2. `node_modules/@salesforce-ux/design-system-2/dist` — the CSS that actually ships.
3. `app/theme.angeronia.css` — the brand layer.

The `design-systems-slds-apply` skill (`.claude/skills/`) indexes hooks,
blueprints, utilities and Carbon icon names; use it to verify an artifact
exists before writing markup that depends on it.

## 2. The selection ladder

Reach for the first rung that works, and only then the next:

1. An existing wrapper in `components/slds/*`.
2. An SLDS 2 component blueprint — add the wrapper and its stories, then use it.
3. SLDS utility classes.
4. Custom CSS that consumes `--slds-g-*` hooks with fallbacks.

Custom CSS is the last resort and carries a comment naming the guideline it
follows.

## 3. Never hard-code, never re-assign

* Never hard-code a colour, radius, shadow, font size, font weight, spacing
  value or duration. Reference the hook.
* Never assign `--slds-r-*`, `--slds-g-*`, `--slds-s-*` or `--slds-c-*` outside
  `app/theme.angeronia.css`. Inside it, block A is generated and block B never
  contains a hex — it references `--slds-r-color-brand-*`.
* Never override a `.slds-*` selector. Add a `site-*` class beside it.
* `--slds-c-*` component-level hooks are a developer preview upstream; we never
  set them.

## 4. Colour by role, in pairs

Text on a container uses that container's `on-*` hook. Links are `accent-2`.
Headings are `on-surface-3`. Feedback colours (`error`, `success`, `warning`,
`info`) are only ever used for feedback. Brand teal reaches the page only
through `accent-*` / `brand-base-*` hooks — never as a literal.

## 5. Typography

IBM Plex Sans (300/400/600/700) and IBM Plex Mono (400), loaded only in
`app/layout.tsx` via `next/font` and assigned only in theme block C. Never a
`font-family` literal anywhere else. Weights 3/4/6/7. Bold is for emphasis, not
for headings. Text utilities (`slds-text-heading_*`, `slds-text-title`,
`slds-text-body_*`, `slds-text-color_*`) before custom sizes.

## 6. Spacing and sizing

Spacing hooks for margin, padding and gap; sizing hooks for width and height.
The 4-pt rhythm is `--slds-g-spacing-1` … `-12` (0.25rem → 5rem).

## 7. Radius, borders, shadows

Buttons pill, cards `border-4`, inputs `border-2`. `border-1` decorative,
`border-2` interactive. One shadow level per element — never stack: `shadow-1`
at rest, `-2` default, `-3` hover, `-4` floating.

## 8. Motion

SLDS durations only (`--slds-g-duration-*`). Nothing scroll-linked. No autoplay.

One standing exception: the hero Möbius rotates on its own, under the waiver
in ADR-013. It is scoped to that figure and is not a precedent.

## 9. Illustration

At most one per page, and it supports the text rather than replacing it.
On the home page that one is the hero Möbius (ADR-012).

## 10. Accessibility

Semantic HTML, a skip link, the theme's visible focus ring, focus management
for dialogs and menus, every icon either labelled or `aria-hidden`, 44 px touch
targets, no colour-only meaning, WCAG 2.2 AA in both colour schemes.
`npm run check:theme` covers the theme's own pairings; stories cover components.

## 11. Story before page

Every component has a story before it is used on a page. Pages are compositions
of storied components and have a page-level story of their own.

## 12. Gates

A change merges only when `slds-linter` is clean, `check:theme` is clean,
Storybook a11y is clean and TypeScript is clean. Styles live in `.css` files —
no inline `style={}`, no CSS-in-JS.

One carve-out, and only this one: the `style` attribute may carry a `--site-*`
custom property whose value is **data** (a progress-bar length, a chart value),
consumed by a rule in a `.css` file. It may never carry a CSS property, and
never a design value. See [`DECISIONS.md`](DECISIONS.md) ADR-005.

## 13. Content

Copy lives in `data/angeronia.ts`, not in components.

## 14. Third-party asset hygiene

No Salesforce trademarks, artwork, illustrations or application chrome in the
product (plan §2.9). `slds-*` class names and `--slds-*` custom properties are
the API of the CSS and stay. `@salesforce-ux/icons`, SLDS 1
(`@salesforce-ux/design-system`) and `@salesforce-ux/sds-styling-hooks` are
never installed.

---

## Definition of "designed"

A component is done when: the story exists → a11y clean → `slds-linter` clean →
`check:theme` clean → reviewed in light **and** dark → used on a page.
