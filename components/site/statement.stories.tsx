import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { about, belief, hero, showcase, statementText } from "@/data/angeronia";
import { Band } from "./band";
import { Statement } from "./statement";
import frames from "@/stories/frames.module.css";

const meta = {
  title: "Components/Statement",
  component: Statement,
  parameters: {
    // Shown on a band, so the line it steps across is there.
    band: false,
    docs: {
      description: {
        component:
          "A statement set on the spine, from data: each line **crosses** the axis (split into a left " +
          "part that ends on it and a right part that starts after it), **hangs** from it, is " +
          "**pushed** past it, or is **centred** on it. The lines are joined with real spaces, so the " +
          "heading reads as one sentence. Under 900px a crossing line starts at the margin and may " +
          "wrap; `regroup` runs the words on under 600px; `collapse` sets it as a lead paragraph below " +
          "1100px.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Band as="section" band="paper" aria-label="Statement" className={frames.padded}>
        <Story />
      </Band>
    ),
  ],
} satisfies Meta<typeof Statement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HangingThenCrossing: Story = {
  args: { as: "h1", size: "display", lines: hero.lines, motion: "still" },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole("heading", { level: 1 });
    // One sentence, with its spaces, for a screen reader.
    await expect(heading).toHaveTextContent(hero.headline);
    await expect(heading.textContent).toBe(statementText(hero.lines));
    // At 900px and up the left part ends on the axis and the right starts after it.
    const left = canvasElement.querySelector<HTMLElement>('[data-part="l"]')!;
    const right = canvasElement.querySelector<HTMLElement>('[data-part="r"]')!;
    const axis = 0.38 * window.innerWidth;
    if (window.innerWidth >= 900) {
      await expect(Math.abs(left.getBoundingClientRect().right - axis)).toBeLessThan(8);
      await expect(right.getBoundingClientRect().left).toBeGreaterThanOrEqual(axis - 1);
      // …its words start a gap after the line.
      await expect(right.getBoundingClientRect().left + parseFloat(getComputedStyle(right).paddingLeft)).toBeGreaterThan(axis + 4);
    }
  },
};

export const CrossingThenPushed: Story = {
  args: { as: "h2", size: "display", lines: belief.lines, motion: "still" },
};

export const HeadSize: Story = {
  args: { as: "h3", size: "head", lines: [{ cross: ["AI & LLM", "product engineering"] }], motion: "still" },
};

export const Centred: Story = {
  args: { as: "h3", size: "head", lines: [{ centre: "Architect" }], motion: "still" },
};

export const Regrouped: Story = {
  args: { as: "h2", size: "display", lines: showcase.lines, motion: "still", regroup: true },
  globals: { viewport: { value: "phone", isRotated: false } },
};

/** About's closing statement: two crossing lines from 1100px, a lead paragraph below. */
export const Collapsed: Story = {
  args: { as: "p", size: "head", lines: about.statement, motion: "still", collapse: true },
  globals: { viewport: { value: "tablet", isRotated: false } },
};

export const Phone: Story = {
  args: { as: "h1", size: "display", lines: hero.lines, motion: "still" },
  globals: { viewport: { value: "phone", isRotated: false } },
};
