import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { Belief } from "./belief";
import { Hero } from "./hero";
import { SiteHeader } from "./site-header";
import { Spine } from "./spine";
import { withScript } from "@/stories/with-script";

/**
 * Three bands and the spine. Without script (`Finished`) the line is each
 * band's `::before`; with script (`Live`) `Spine` hides those and draws the
 * line in pieces into each band's track, broken around the words that cross
 * the axis.
 */
function Spined() {
  return (
    <>
      <SiteHeader page="home" />
      <main id="main">
        <Hero />
        <Belief />
      </main>
      <Spine />
    </>
  );
}

const meta = {
  title: "Components/Spine",
  component: Spined,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The spine, live. Renders nothing: once the page has hydrated it draws the line through every " +
          "`Band` (down the first screen on load, then ahead of the reader), breaks it wherever a " +
          "statement, a picture, the replica or the button crosses the axis, pulls crossing statements " +
          "open low on the screen, holds the belief, drifts the photographs and reveals blocks once " +
          "(ADR-025, ADR-027, ADR-031). It runs only when `<html>` has `js`, and undoes everything on " +
          "unmount.",
      },
    },
  },
} satisfies Meta<typeof Spined>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No script: nothing runs; every band shows its whole line, the words patched over it. */
export const Finished: Story = {
  play: async ({ canvasElement }) => {
    await expect(document.documentElement).not.toHaveClass("spine-live");
    for (const track of canvasElement.querySelectorAll("[data-spine-track]")) {
      await expect(track.childElementCount).toBe(0);
    }
  },
};

export const Live: Story = {
  decorators: [withScript],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.documentElement).toHaveClass("spine-live"));
    // The line is drawn in pieces into the bands' tracks…
    await waitFor(
      () => {
        const pieces = [...canvasElement.querySelectorAll<HTMLElement>("[data-spine-track] > i")].filter(
          (i) => i.getBoundingClientRect().height >= 1,
        );
        return expect(pieces.length).toBeGreaterThan(1);
      },
      { timeout: 4000 },
    );
    // …and no piece is drawn through the crossing part of the headline.
    const part = canvasElement.querySelector<HTMLElement>('#hero-title [data-part="r"]')!.getBoundingClientRect();
    await waitFor(
      () => {
        for (const piece of canvasElement.querySelectorAll<HTMLElement>("#top [data-spine-track] > i")) {
          const r = piece.getBoundingClientRect();
          if (r.height < 1) continue;
          expect(r.bottom <= part.top || r.top >= part.bottom).toBe(true);
        }
      },
      { timeout: 4000 },
    );
  },
};
