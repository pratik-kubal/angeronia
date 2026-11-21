import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { hero } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import { FitText } from "./fit-text";
import styles from "./hero.module.css";

const meta = {
  title: "Sections/FitText",
  component: FitText,
  parameters: { layout: "fullscreen" },
  args: { children: hero.name },
  render: (args) => (
    <div className={styles.storyFrame}>
      <h1 className={cx("display", styles.storyFit)}>
        <FitText {...args} />
      </h1>
    </div>
  ),
  // The name must end up on one line, no wider than its box and close to it.
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("h1");
    const text = canvasElement.querySelector("[data-fit]");
    await waitFor(() => {
      if (!box || !text) throw new Error("not rendered");
      const width = text.getBoundingClientRect().width;
      expect(width).toBeLessThanOrEqual(box.clientWidth);
      expect(width).toBeGreaterThan(box.clientWidth * 0.9);
    });
  },
} satisfies Meta<typeof FitText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The studio name fitted into a box of fixed width. */
export const Default: Story = {};

export const Phone: Story = {
  parameters: {
    viewport: {
      options: { phone: { name: "Phone", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "phone", isRotated: false } },
};
