# CLAUDE.md — angeronia.com

Marketing site for Angeronia Labs LLC (Next.js 15 App Router, React 19,
TypeScript), built on **Salesforce Lightning Design System 2 (Cosmos)** under an
Angeronia theme layer — Carbon Teal accent, IBM Plex type, Carbon icons — with
Storybook as the single source of truth for UI.

## Current state (2026-09-04)

The SLDS 2 redesign is **implemented**. `docs/plans/slds2-redesign-plan.md` is
the historical hand-off; the live documents are:

* **`docs/design-system/DESIGN-RULES.md`** — the binding contract. Read it
  before touching any UI.
* **`docs/design-system/DECISIONS.md`** — every decision (D1–D11, O1–O12) and
  every deviation (ADR-001 … ADR-011), plus the plan-closure table.
* **`docs/design-system/theme-report.md`** — generated: the brand ramp, the
  semantic overrides, and the contrast matrix in both schemes.

Record any deviation in `DECISIONS.md` **before** writing the code that
deviates.

## Design contract (summary of DESIGN-RULES.md — binding for every UI change)

1. SLDS 2 (Cosmos + `app/theme.angeronia.css`) is the design system. No other
   CSS framework, utility library or icon set. Icons: `@carbon/icons-react`.
2. Selection ladder: existing `components/slds/*` → SLDS 2 component blueprint
   (add wrapper + stories) → SLDS utility classes → custom CSS that consumes
   `--slds-g-*` hooks with fallbacks. Custom CSS is the last resort and names
   the guideline it follows in a comment.
3. Never hard-code colours, radii, shadows, font sizes/weights, spacing or
   durations. Never assign `--slds-r-*`, `--slds-g-*`, `--slds-s-*` or
   `--slds-c-*` outside `app/theme.angeronia.css`. Never override `.slds-*`
   selectors; add a `site-*` class beside them.
4. Colour by role, in pairs (`on-*` with its container). Links `accent-2`,
   headings `on-surface-3`, feedback colours only for feedback. Teal appears
   only through hooks, never as a literal.
5. Typography: IBM Plex Sans / Mono via `next/font` in `app/layout.tsx` and
   theme block C only; weights 3/4/6/7; bold for emphasis, not headings. Body
   copy inherits the page root's `font-scale-2` — `slds-text-body_regular` pins
   13px, which is an app-shell size.
6. Spacing hooks for margin/padding/gap; sizing hooks for width/height; 4-pt rhythm.
7. Buttons pill, cards `border-4`, inputs `border-2`; one shadow level per element.
8. Motion: SLDS durations only; nothing scroll-linked; no autoplay.
9. At most one illustration per page; it supports text.
10. Accessibility: semantic HTML, skip link, visible focus (theme default),
    focus management for dialogs/menus, every icon labelled or `aria-hidden`,
    no colour-only meaning, AA in both colour schemes.
11. Every component has a story before it is used on a page; pages are
    compositions of storied components with a page-level story.
12. Gates: `slds-linter` clean, `check:theme` clean, Storybook a11y clean,
    TypeScript clean. Styles in `.css` files only — no inline `style`, no
    CSS-in-JS. One carve-out: the `style` attribute may carry a `--site-*`
    custom property whose value is *data* (ADR-005).
13. Copy lives in `data/angeronia.ts`.
14. No Salesforce trademarks, artwork, illustrations or app chrome in the product.

## Adding a component

New wrappers must be registered in `WRAPPER_TO_DIST` **and**
`MODULAR.component` in `scripts/build-vendor-css.mjs` — the build fails until
they are, because a missing entry would ship an unstyled component rather than
an error.

## Agent tooling

- The three SLDS skills are vendored at `.claude/skills/design-systems-*`
  (Apache-2.0, from `forcedotcom/sf-skills`). Use `design-systems-slds-apply` to
  look up hooks / blueprints / utilities / Carbon icon names before writing
  markup or CSS — it ships search scripts under `scripts/`.
- SLDS 2 docs are a JS-rendered site (needs a browser):
  https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2
- Packages: `@salesforce-ux/design-system-2` (exact-pinned), `@salesforce-ux/design-tokens`
  (exact-pinned), `@salesforce-ux/slds-linter`, `@carbon/icons-react`. Do **not**
  install `@salesforce-ux/icons`, `@salesforce-ux/design-system` (SLDS 1) or
  `@salesforce-ux/sds-styling-hooks`.

## Commands

```bash
npm run dev            # Next dev (regenerates vendor/slds2.css first)
npm run build          # strict build — no ignoreBuildErrors
npm run storybook      # Storybook 10 (nextjs-vite)

npm run typecheck      # tsc --noEmit
npm run lint:slds      # slds-linter, every rule at error
npm run check:theme    # theme parity + blue-literal sweep + contrast matrix
npm run test:storybook # every story in Chromium; axe violations fail

npm run build:theme    # regenerate theme block A (the teal ramp)
npm run build:favicon  # re-tint app/icon.svg onto the ramp
npm run build:logos    # regenerate the OG/social lockups
npm run check:vendor-css  # bundled vs modular parity (needs `npm run dev`)
```

After bumping `@salesforce-ux/design-system-2`: run `check:theme` (it will fail
if a blue literal moved), then `check:vendor-css`.

Sister product: Code Socratic (`../code-socratic`) — IBM Carbon UI, teal accent,
IBM Plex; Angeronia shares its hue, typeface and icon set, not its geometry.
