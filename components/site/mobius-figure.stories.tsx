import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobiusFigure } from "./mobius-figure";

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
          "resolved `rgb()` back out of both — the only way to collapse a " +
          "`light-dark()` pair, since reading the custom property itself " +
          "returns the token stream rather than the branch in force. Every face " +
          "is then a Lambert mix of that pair.\n\n" +
          "Each scheme gets its own pair, because the scheme-aware accent hooks " +
          "all travel together and land too close to shade a solid with. Light " +
          "runs `accent-container-1` (Teal 60, the brand button's teal) down to " +
          "`accent-dark-1` (Teal 90); dark runs `accent-light-2` (Teal 20) down " +
          "to `accent-dark-2` (Teal 100), the wider range a dark ground can " +
          "carry.\n\n" +
          "It turns on its own at 30°/s, which is the one waiver to design " +
          "rule 8's \"no autoplay\" (ADR-013): a still Möbius reads as a " +
          "twisted ring, and the one-sidedness only resolves when the surface " +
          "travels. Drag it to scrub, flick to fling. Under " +
          "`prefers-reduced-motion` it draws a single static frame and the drag " +
          "handler is never attached; off screen the loop stops; below 40em the " +
          "hero drops the figure and rough.js is never fetched.",
      },
    },
  },
} satisfies Meta<typeof MobiusFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };

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
