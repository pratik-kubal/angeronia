import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { belief, hero, projectProcess } from "@/data/angeronia";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Button } from "./button";
import { Mine, Pair, Yours } from "./pair";
import frames from "@/stories/frames.module.css";

const meta = {
  title: "Components/Pair",
  component: Pair,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The reading rule: the reader's side (`Yours`, the need) ends at the axis, right-aligned; " +
          "the studio's side (`Mine`, the build) starts after it. Under 900px they stack, hanging " +
          "from the axis, in DOM order; for `narrowOrder=\"mine-first\"` the caller writes `Mine` " +
          "before `Yours`, and wide the sides keep their columns on one row. A caller sets the sides' " +
          "measures with `--pair-yours` and `--pair-mine`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Band as="section" band="paper" aria-label="Pairs" className={frames.padded}>
        <Story />
      </Band>
    ),
  ],
  args: { as: "div", narrowOrder: "yours-first", children: null },
} satisfies Meta<typeof Pair>;

export default meta;
type Story = StoryObj<typeof meta>;

const step = projectProcess.steps[3];

export const Paragraphs: Story = {
  render: () => (
    <Pair as="div" narrowOrder="yours-first">
      <Yours as="p">{step.yours}</Yours>
      <Mine as="p">{step.mine}</Mine>
    </Pair>
  ),
  play: async ({ canvasElement }) => {
    const [yours, mine] = [...canvasElement.querySelectorAll("p")];
    const axis = 0.38 * window.innerWidth;
    if (window.innerWidth >= 900) {
      // Neither side crosses the axis: paragraphs never cut the line.
      await expect(yours.getBoundingClientRect().right).toBeLessThan(axis);
      await expect(mine.getBoundingClientRect().left).toBeGreaterThan(axis);
    }
  },
};

/** One statement read straight through: a `<p>` whose two sides are spans. */
export const OneStatement: Story = {
  render: () => (
    <Pair as="p" narrowOrder="yours-first" className={typeStyles.lead}>
      <Yours as="span">{belief.yours}</Yours> <Mine as="span">{belief.mine}</Mine>
    </Pair>
  ),
};

export const Phone: Story = {
  ...OneStatement,
  globals: { viewport: { value: "phone", isRotated: false } },
};

/**
 * The studio's side first in the DOM (the hero, Contact): wide, the button
 * still sits on your side of the axis, on the same row; narrow, the sentence
 * comes first and the button after it, so focus follows what is seen.
 */
export const MineFirst: Story = {
  render: () => (
    <Pair as="div" narrowOrder="mine-first">
      <Mine as="p" className={typeStyles.lead}>
        {hero.lead}
      </Mine>
      <Yours as="div">
        <Button href={hero.action.href} size="body">
          {hero.action.label}
        </Button>
      </Yours>
    </Pair>
  ),
  play: async ({ canvasElement }) => {
    const mine = canvasElement.querySelector("p");
    const button = canvasElement.querySelector("a");
    if (!mine || !button) throw new Error("the pair did not render");
    // The sentence comes before the button in the DOM.
    await expect(mine.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const m = mine.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    if (window.innerWidth >= 900) {
      // One row: the button left of the axis, the sentence right of it.
      const axis = 0.38 * window.innerWidth;
      await expect(b.right).toBeLessThan(axis);
      await expect(m.left).toBeGreaterThan(axis);
      await expect(Math.abs(b.top - m.top)).toBeLessThan(m.height);
    } else {
      // Stacked in DOM order: the sentence above the button.
      await expect(m.bottom).toBeLessThanOrEqual(b.top);
    }
  },
};

export const MineFirstPhone: Story = {
  ...MineFirst,
  globals: { viewport: { value: "phone", isRotated: false } },
};
