## What changed

<!-- One or two sentences. What does this do that the branch point did not? -->

## Design checklist

Delete the section if this PR touches no studio page (`/`, `/privacy`, `/terms`).

- [ ] Tokens only: no raw colour, size or duration in a component's CSS (the
      one exception is `proof-panels.module.css`).
- [ ] Nothing global that could reach a game. If global CSS changed:
      `npm run games:parity -- compare` against a baseline taken before it.
- [ ] Headings two lines or fewer at 1440, 768 and 390.
- [ ] A story for every new component, axe clean.
- [ ] Copy in `data/angeronia.ts`, and nothing untrue.
- [ ] Any deviation from `docs/design-system/DESIGN-RULES.md` is recorded in
      `docs/design-system/DECISIONS.md` first.

## Gates

- [ ] `npm run typecheck`
- [ ] `npm run check:contrast`
- [ ] `npm run test:storybook`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run test:e2e`

## Screenshots

<!-- For anything visual: 1440, 768 and 390. -->
