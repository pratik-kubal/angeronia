## What changed

<!-- One or two sentences. What does this do that the branch point did not? -->

## Design-system checklist

Delete the section if this PR touches no UI.

- [ ] Styles are plain CSS: tokens in `styles/tokens.css`, a CSS Module beside
      each component. No inline `style` except a custom property carrying data.
- [ ] No literal colour, type size, weight, line height, tracking, duration or
      easing outside `tokens.css`; space from the scale (a component's own
      measure or ratio carries a comment).
- [ ] Colour by role: components read `--band-*` and `--button*`, never
      `--palette-*`; every band carries `data-band`; any new colour pair is
      declared as an `@contrast` line. No new token reuses a name a game defines.
- [ ] The spine's geometry from its tokens (`--axis`, `--hang`, `--push`,
      `--spine-width`); nothing but statements, the replica, pictures and the
      button crosses the axis.
- [ ] Motion: the finished page without script and under reduced motion;
      native scroll; nothing autoplays.
- [ ] Copy in `data/angeronia.ts`, in the third person (no I, me, my, we, our,
      us; no pronoun for Pratik).
- [ ] Every new component has a story before it is used on a page (default,
      variants, long content, the `phone` viewport where it changes).
- [ ] Any deviation from `docs/design-system/DESIGN-RULES.md` is recorded in
      `docs/design-system/DECISIONS.md` — **before** the code that deviates.

## Gates

- [ ] `npm run typecheck`
- [ ] `npm run check:contrast`
- [ ] `npm run test:storybook`
- [ ] `npm run build`
- [ ] Anything global changed: `npm run games:parity -- compare` against a baseline taken before it

## Screenshots

<!-- 1440, 768 and 390, for anything visual. -->
