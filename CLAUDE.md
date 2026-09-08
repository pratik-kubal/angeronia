# CLAUDE.md — angeronia.com

Marketing site for Angeronia Labs LLC (Next.js 15 App Router, React 19,
TypeScript), built on **IBM Carbon v11** under an Angeronia brand override —
Carbon Teal in place of Carbon Blue, IBM Plex type, Carbon icons — with
Storybook as the single source of truth for UI.

## Current state (2026-09-08)

The site ran on Salesforce Lightning Design System 2 until 2026-09-08. It does
not any more: the SLDS 2 Terms of Use were not accepted, `@salesforce-ux/*` is
gone, and the UI layer is rebuilt on Carbon. `docs/plans/carbon-migration-plan.md`
is the historical hand-off; the live documents are:

* **`docs/design-system/DESIGN-RULES.md`** — the binding contract. Read it
  before touching any UI.
* **`docs/design-system/DECISIONS.md`** — every decision and every deviation.
  **ADR-015 is the one to read first**: it closes O7, supersedes D1/D2/D3/D7/D8
  and ADR-004/006/008/011, and describes what actually ships.
* **`docs/design-system/theme-report.md`** — generated: the brand override's
  tokens and its contrast matrix in both themes.

Record any deviation in `DECISIONS.md` **before** writing the code that
deviates.

## Design contract (summary of DESIGN-RULES.md — binding for every UI change)

1. Carbon v11 (`@carbon/react` + `styles/_themes.scss`) is the design system.
   No other CSS framework, utility library or icon set. Icons:
   `@carbon/icons-react`.
2. Selection ladder: a `@carbon/react` component → a composition of Carbon parts
   in `components/ui/` (with a story) → a `site-*` rule in `styles/_site.scss`
   built from Carbon tokens → a `--site-*` value at the top of `_site.scss` for
   something Carbon has no token for. Rungs 3 and 4 name the Carbon gap in a
   comment.
3. Never hard-code colours, spacing, type sizes, weights or durations. Never
   assign `--cds-*` outside `styles/_themes.scss`. Never override a `.cds--*`
   selector; add a `site-*` class beside it (`_site.scss` loads after Carbon, so
   it wins on source order). Every bare number in `_site.scss` is a bug.
4. Colour by role, in pairs. Links `$link-primary`, ink `$text-primary` /
   `$text-secondary`, `support-*` for status only. Teal appears only through the
   tokens the override reassigns, never as a literal. Grounds step *up* —
   `$background` → `$layer-01` → `$layer-02` — and Carbon's `<Layer>` does the
   stepping, so a component never knows which band it is on.
5. Typography: IBM Plex Sans / Mono via `next/font` in `app/layout.tsx`, read
   only by `$font-families` in `styles/_config.scss`. Type comes from
   `type.type-style()`, never a `font-size`. The page root sets `body-02` once.
6. `$spacing-*` for margin/padding/gap, `$layout-*` for section rhythm; measures
   and widths are `--site-*` values.
7. **Carbon is square.** No radius, no elevation, no density toggle. A card's
   edge is a border. This replaced the SLDS pill/`border-4` rule outright.
8. Motion: Carbon durations only; nothing scroll-linked; no autoplay (one
   waiver, ADR-013, for the hero Möbius).
9. At most one illustration per page; it supports the text.
10. Accessibility: semantic HTML, skip link, visible focus, focus management for
    dialogs/menus, every icon labelled or `aria-hidden`, no colour-only meaning,
    AA in both themes.
11. Every component has a story before it is used on a page; pages are
    compositions of storied components with a page-level story.
12. Gates: `check:theme` clean, Storybook a11y clean, TypeScript clean, strict
    build green. Styles in `.scss` files only — no inline `style`, no CSS-in-JS.
    One carve-out: the `style` attribute may carry a `--site-*` custom property
    whose value is *data* (ADR-005). There is no CSS linter — `slds-linter` was
    retired rather than replaced (ADR-018).
13. Copy lives in `data/angeronia.ts`.
14. No `@salesforce-ux/*` package is ever reinstalled. The reason is ADR-015.

## Adding a component

Check `@carbon/react` first — it probably already exists there. If it does not,
ask whether what you need is a *composition* of Carbon parts or something Carbon
genuinely has no word for. Both go in `components/ui/`, with a story, and
nothing else does.

Two Carbon gotchas that cost time here:

* **`renderIcon` cannot cross the RSC boundary.** It takes a component, and a
  function is not serialisable — handing `Launch` to Carbon's `Link` from a
  server component fails the prerender. `components/ui/external-link.tsx` is
  `"use client"` for exactly this reason.
* **Carbon's `Grid` is the *flexbox* grid in v11** unless the `enable-css-grid`
  feature flag is on, and that flag has no supported API. Use
  `components/ui/grid.tsx`, which renders what `CSSGrid` renders via
  `GridSettings` (ADR-016). Do not import `Grid` from `@carbon/react`.

## Commands

```bash
npm run dev            # Next dev (Turbopack)
npm run build          # strict build — no ignoreBuildErrors
npm run storybook      # Storybook 10 (nextjs-vite)

npm run typecheck      # tsc --noEmit
npm run check:theme    # token parity + contrast matrix + favicon check
npm run test:storybook # every story in Chromium; axe violations fail

npm run build:favicon  # re-tint app/icon.svg onto the teal ramp
npm run build:logos    # regenerate the OG/social lockups
```

`check:theme` and `build:logos` both resolve their colours by compiling
`styles/globals.scss` (`scripts/carbon-tokens.mjs`), so neither can drift from
what the site actually ships.

Sister product: Code Socratic (`../code-socratic`) — Carbon 11, teal accent, IBM
Plex. The two properties now share the geometry as well as the hue, typeface and
icon set; that convergence is deliberate (ADR-015, plan §3). `../code-socratic/apps/web/styles`
is the reference for how a Carbon pattern has already been solved in this family.
