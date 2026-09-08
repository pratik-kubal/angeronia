import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { MobiusFigure, readRgb } from "./mobius-figure";
import { hero } from "@/data/angeronia";
import { COLOR_SCHEME_ATTRIBUTE } from "@/lib/theme";

/**
 * How far the painted pixel may sit from the token it is meant to be.
 *
 * Two numbers bound this. Below: rough.js draws the same face several times
 * with `roughness` 1.15, so the peak pixel wobbles by up to ~9 between frames.
 * Above: the nearest confusable value is the neighbouring step on the teal
 * ramp — Teal 70 is 28 away from Teal 60 in its closest channel — so anything
 * at or over 28 would accept a one-step token slip as correct. 15 sits clear of
 * both.
 */
const CHANNEL_TOLERANCE = 15;

/** The lit face of the band, as painted. `null` before rough.js has drawn. */
function paintedLitFace(canvas: HTMLCanvasElement): [number, number, number] | null {
  const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let best: [number, number, number] | null = null;
  let bestSum = -1;
  // Every fourth pixel. The lit face is thousands of pixels wide, so a stride
  // cannot miss it, and the full scan is a 2MB GPU readback per poll — which is
  // paid on every tick of a *failing* wait, where it costs seconds.
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 200) continue;
    const sum = data[i] + data[i + 1] + data[i + 2];
    if (sum > bestSum) {
      bestSum = sum;
      best = [data[i], data[i + 1], data[i + 2]];
    }
  }
  return best;
}

/**
 * Assert the band is painted in the theme that is actually in force.
 *
 * The figure reads its two colours out of CSS and draws them onto a canvas,
 * which puts them beyond the reach of every other gate here: axe does not look
 * at pixels, and a story with the wrong colours still renders perfectly well.
 * This caught a real one — the component used to watch `resolvedTheme` from
 * `useTheme()`, whose effect runs *before* the parent writes the theme
 * attribute, so the band sat one toggle behind for the whole session and the
 * Dark story painted the light teal.
 *
 * The brightest painted pixel is the fully-lit face: the fill colour undiluted,
 * before the Lambert term mixes it toward the shaded end.
 */
async function expectPaintedInTheme(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const figure = canvas.getByRole("img", { name: hero.figureAlt });
  const surface = figure.querySelector("canvas")!;

  // `readRgb` is the component's own parser, imported rather than reproduced:
  // the test and the code under test then agree on what "the colour" means by
  // construction, whatever syntax a token grows later.
  const expected = readRgb(figure);
  // `readRgb` answers `[0, 0, 0]` for a colour it cannot parse, which would
  // otherwise surface as an unexplained timeout further down.
  await expect(
    expected,
    `the figure's own colour did not resolve — is --site-figure-lit still defined?`,
  ).not.toEqual([0, 0, 0]);

  // rough.js is a lazy import behind an IntersectionObserver, so there is no
  // first frame at mount. One wait covers both "has painted" and "painted the
  // right thing"; splitting them doubles the readbacks and the timeout budget.
  await waitFor(
    () => {
      const painted = paintedLitFace(surface);
      expect(painted, "nothing painted on the canvas yet").not.toBeNull();
      for (let c = 0; c < 3; c += 1) {
        expect(Math.abs(painted![c] - expected[c])).toBeLessThanOrEqual(CHANNEL_TOLERANCE);
      }
    },
    { timeout: 8000 },
  );
}

const meta = {
  title: "Sections/MobiusFigure",
  component: MobiusFigure,
  parameters: {
    docs: {
      description: {
        component:
          "The hero's Möbius band, ported from the studio's portfolio site and " +
          "re-tinted onto the teal ramp (ADR-012). rough.js draws 128 shaded " +
          "quads to a `<canvas>` and a painter's sort puts the far ones down " +
          "first; a fixed per-quad seed keeps the sketch strokes from boiling " +
          "between frames.\n\n" +
          "No colour is hard-coded. The wrapper carries the lit face and the " +
          "canvas the shaded end as `color`, and the component reads the " +
          "resolved `rgb()` back out of both — reading the custom property " +
          "itself returns its token stream rather than a colour. Every face is " +
          "then a Lambert mix of that pair.\n\n" +
          "Each theme names its own pair in `styles/_themes.scss`, because no " +
          "Carbon token pair spans a range wide enough to shade a solid with. " +
          "Light runs Teal 60 — the brand button's teal — down to Teal 90; " +
          "dark runs Teal 20 down to Teal 100, the wider range a dark ground " +
          "can carry.\n\n" +
          "It turns on its own at 30°/s, which is the one waiver to design " +
          "rule 8's \"no autoplay\" (ADR-013): a still Möbius reads as a " +
          "twisted ring, and the one-sidedness only resolves when the surface " +
          "travels. Drag it to scrub, flick to fling. Under " +
          "`prefers-reduced-motion` it draws a single static frame and the drag " +
          "handler is never attached; off screen the loop stops; below `md` " +
          "the hero drops the figure and rough.js is never fetched.",
      },
    },
  },
} satisfies Meta<typeof MobiusFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => expectPaintedInTheme(canvasElement),
};

export const Dark: Story = {
  globals: { colorScheme: "dark" },
  play: async ({ canvasElement }) => expectPaintedInTheme(canvasElement),
};

/**
 * The bug this component was actually fixed for: not the colour at mount, but
 * the colour *after a toggle*.
 *
 * `Default` and `Dark` both pass on the broken component — light is the `:root`
 * token set, so a mount-time read is correct whether or not the attribute has
 * landed, and the runner mounts each story with the attribute already set. The
 * failure only appears when the attribute changes under a figure that is
 * already on screen, which is what every real scheme toggle does.
 *
 * So this story flips the attribute by hand, exactly as `next-themes` does, and
 * asserts the band follows. It is the only story here that would fail if the
 * `MutationObserver` were swapped back for a `[resolvedTheme]` effect.
 */
export const RepaintsOnThemeChange: Story = {
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const before = root.getAttribute(COLOR_SCHEME_ATTRIBUTE);

    try {
      root.setAttribute(COLOR_SCHEME_ATTRIBUTE, "light");
      await expectPaintedInTheme(canvasElement);

      root.setAttribute(COLOR_SCHEME_ATTRIBUTE, "dark");
      await expectPaintedInTheme(canvasElement);

      // Back again: a component that reads once and caches would pass the step
      // above by luck on the very first change and fail here.
      root.setAttribute(COLOR_SCHEME_ATTRIBUTE, "light");
      await expectPaintedInTheme(canvasElement);
    } finally {
      // The decorator owns this attribute; leave it as found so the next story
      // in the same document starts from a known state.
      if (before === null) root.removeAttribute(COLOR_SCHEME_ATTRIBUTE);
      else root.setAttribute(COLOR_SCHEME_ATTRIBUTE, before);
    }
  },
};

/**
 * What anyone with `prefers-reduced-motion: reduce` gets: one frame, drawn
 * once, no loop and no drag. Storybook cannot force the media query, so this
 * story documents the branch rather than simulating it — flip the setting in
 * the OS to see it.
 */
export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Renders identically here; the branch is taken from the media query " +
          "at mount, not from a prop. With reduce set, `draw()` runs once and " +
          "`requestAnimationFrame` is never called.",
      },
    },
  },
};
