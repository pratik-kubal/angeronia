import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { MobiusFigure } from "./mobius-figure";

/**
 * Assert the band is painted in the theme that is actually in force.
 *
 * The figure reads its two colours out of CSS with `getComputedStyle` and draws
 * them onto a canvas, which puts them beyond the reach of every other gate here:
 * axe does not look at pixels, and a story with the wrong colours still renders
 * perfectly well. This caught a real one — the component used to watch
 * `resolvedTheme` from `useTheme()`, whose effect runs *before* the parent
 * writes `data-theme`, so the band sat one toggle behind for the whole session
 * and this Dark story painted the light teal.
 *
 * The brightest painted pixel is the fully-lit face, which is the fill colour
 * undiluted. rough.js's sketch strokes move it by a unit or two, hence the
 * tolerance rather than equality.
 */
async function expectPaintedInTheme(canvasElement: HTMLElement) {
  const figure = canvasElement.querySelector<HTMLElement>(".site-hero__figure");
  const canvas = canvasElement.querySelector<HTMLCanvasElement>(".site-hero__canvas");
  await expect(figure).not.toBeNull();
  await expect(canvas).not.toBeNull();

  const brightest = () => {
    const ctx = canvas!.getContext("2d")!;
    const data = ctx.getImageData(0, 0, canvas!.width, canvas!.height).data;
    let best: [number, number, number] | null = null;
    let bestSum = -1;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      const sum = data[i] + data[i + 1] + data[i + 2];
      if (sum > bestSum) {
        bestSum = sum;
        best = [data[i], data[i + 1], data[i + 2]];
      }
    }
    return best;
  };

  // rough.js is a lazy import behind an IntersectionObserver, so the first
  // frame does not exist yet when the story mounts.
  await waitFor(() => expect(brightest()).not.toBeNull(), { timeout: 8000 });

  const expected = getComputedStyle(figure!)
    .color.match(/[\d.]+/g)!
    .slice(0, 3)
    .map(Number);

  await waitFor(
    () => {
      const painted = brightest()!;
      for (let c = 0; c < 3; c += 1) {
        expect(Math.abs(painted[c] - expected[c])).toBeLessThanOrEqual(30);
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
