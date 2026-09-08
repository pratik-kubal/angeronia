## What changed

<!-- One or two sentences. What does this do that the branch point did not? -->

## Design-system checklist

Delete the section if this PR touches no UI.

- [ ] Reached for the first rung of the ladder that works: an existing
      `components/slds/*` wrapper → an SLDS 2 blueprint (wrapper + stories
      added) → SLDS utility classes → custom CSS consuming `--slds-g-*` hooks
      with fallbacks, carrying a comment naming the guideline it follows.
- [ ] No hard-coded colour, radius, shadow, font size, spacing or duration.
- [ ] No `--slds-*` hook assigned outside `app/theme.angeronia.css`, and no
      `.slds-*` selector overridden.
- [ ] Colour used by role and in pairs; feedback colours only for feedback.
- [ ] Every new component has a story before it is used on a page: Default,
      every variant and size, states, long content, **and dark**.
- [ ] New wrapper added to `WRAPPER_TO_DIST` and `MODULAR.component` in
      `scripts/build-vendor-css.mjs`.
- [ ] Reviewed in both colour schemes.
- [ ] Any deviation from `docs/plans/slds2-redesign-plan.md` is recorded in
      `docs/design-system/DECISIONS.md` — **before** the code that deviates.

## Gates

- [ ] `npm run typecheck`
- [ ] `npm run lint:slds`
- [ ] `npm run check:theme`
- [ ] `npm run test:storybook`

## Screenshots

<!-- Light and dark, for anything visual. -->
