## What changed

<!-- One or two sentences. What does this do that the branch point did not? -->

## Design-system checklist

Delete the section if this PR touches no UI.

- [ ] Reached for the first rung of the ladder that works: a `@carbon/react`
      component → a composition of Carbon parts in `components/ui/` (with a
      story) → a `site-*` rule in `styles/_site.scss` built from Carbon tokens →
      a `--site-*` value at the top of `_site.scss`. Rungs 3 and 4 carry a
      comment naming the Carbon gap they fill.
- [ ] No hard-coded colour, spacing, type size, weight or duration, and no bare
      number in `_site.scss`.
- [ ] No `--cds-*` token assigned outside `styles/_themes.scss`, and no `.cds--*`
      selector overridden — a `site-*` class goes beside it.
- [ ] Colour used by role and in pairs; `support-*` only for status. Grounds
      step up through `<Layer>` rather than being picked per section.
- [ ] Every new component has a story before it is used on a page: Default,
      every variant and size, states, long content, **and dark**.
- [ ] Reviewed in both themes.
- [ ] Any deviation from `docs/design-system/DESIGN-RULES.md` is recorded in
      `docs/design-system/DECISIONS.md` — **before** the code that deviates.

## Gates

- [ ] `npm run typecheck`
- [ ] `npm run check:theme`
- [ ] `npm run test:storybook`
- [ ] `npm run build`

## Screenshots

<!-- Light and dark, for anything visual. -->
