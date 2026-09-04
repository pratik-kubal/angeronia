# CLAUDE.md — angeronia.com

Marketing site for Angeronia Labs LLC (Next.js 15 App Router, React 19, TypeScript).

## Current state (2026-09-04)

The site is mid-redesign. The citron/Möbius design currently in `app/`,
`components/angeronia/` and `lib/angeronia/` is **being replaced** by
**Salesforce Lightning Design System 2 (SLDS 2, Cosmos) extended with an
Angeronia theme layer** (Carbon Teal accent, IBM Plex type, Carbon icons)
and a Storybook that is the single source of truth for UI.

**Read `docs/plans/slds2-redesign-plan.md` before touching any UI.** It is
the hand-off: decisions D1–D11 and the decision log (§10) are settled;
implement the phases in §8 in order and record any deviation in
`docs/design-system/DECISIONS.md` first. The repo has no commits yet —
Phase 0 starts with the baseline commit and the `pre-slds2` tag.

## Design contract (summary of plan §3 — binding for every UI change)

1. SLDS 2 (Cosmos + `app/theme.angeronia.css`) is the design system. No
   other CSS framework, utility library or icon set. Icons: `@carbon/icons-react`.
2. Selection ladder: existing `components/slds/*` → SLDS 2 component
   blueprint (add wrapper + stories) → SLDS utility classes → custom CSS that
   consumes `--slds-g-*` hooks with fallbacks. Custom CSS is the last resort
   and names the guideline it follows in a comment.
3. Never hard-code colours, radii, shadows, font sizes/weights, spacing or
   durations. Never assign `--slds-r-*`, `--slds-g-*`, `--slds-s-*` or
   `--slds-c-*` outside `app/theme.angeronia.css`. Never override `.slds-*`
   selectors; add a `site-*` class beside them.
4. Colour by role, in pairs (`on-*` with its container). Links `accent-2`,
   headings `on-surface-3`, feedback colours only for feedback. Teal appears
   only through hooks, never as a literal.
5. Typography: IBM Plex Sans / Mono via `next/font` in `app/layout.tsx` and
   theme block C only; weights 3/4/6/7; bold for emphasis, not headings.
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
    TypeScript clean. Styles in `.css` files only — no inline `style`, no CSS-in-JS.
13. Copy lives in `data/angeronia.ts`.
14. No Salesforce trademarks, artwork, illustrations or app chrome in the product.

## Agent tooling

- Install the SLDS skills once per clone: `npx skills add forcedotcom/sf-skills`
  (`design-systems-slds-apply`, `design-systems-slds-validate`,
  `design-systems-slds2-migrate`). Use `design-systems-slds-apply` to look
  up hooks / blueprints / utilities before writing markup or CSS.
- SLDS 2 docs are a JS-rendered site (needs a browser):
  https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2
- Packages: `@salesforce-ux/design-system-2` (CSS), `@salesforce-ux/design-tokens`,
  `@salesforce-ux/slds-linter`, `@carbon/icons-react`. Do **not** install
  `@salesforce-ux/icons`, `@salesforce-ux/design-system` (SLDS 1) or
  `@salesforce-ux/sds-styling-hooks`.

## Commands (after Phase 1–2 land)

```bash
npm run dev            # Next dev
npm run build          # strict build (no ignoreBuildErrors)
npm run lint:slds      # slds-linter over app/, components/, stories/ CSS
npm run check:theme    # theme parity + contrast matrix
npm run storybook      # Storybook 10 (nextjs-vite)
npm run test:storybook # a11y + interaction tests
```

Sister product: Code Socratic (`../code-socratic`) — IBM Carbon UI, teal
accent, IBM Plex; Angeronia shares its hue, typeface and icon set, not its
geometry.
