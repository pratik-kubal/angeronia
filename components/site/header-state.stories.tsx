import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { HeaderState } from "./header-state";
import styles from "./site-header.module.css";

const meta = {
  title: "Sections/HeaderState",
  component: HeaderState,
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className={styles.storyBlock}>
      <HeaderState {...args} />
    </div>
  ),
} satisfies Meta<typeof HeaderState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At the top of the page the sentinel is in view, so the header is not stuck. */
export const Overlay: Story = {
  args: {
    variant: "overlay",
    className: styles.header,
    children: <p>variant overlay: data-stuck is false while the top of the page is on screen</p>,
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector("header");
    await waitFor(() => expect(header).toHaveAttribute("data-stuck", "false"));
  },
};

/** The legal pages: stuck from the first paint, nothing observed. */
export const Solid: Story = {
  args: {
    variant: "solid",
    className: styles.header,
    children: <p>variant solid: data-stuck is always true</p>,
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector("header");
    await waitFor(() => expect(header).toHaveAttribute("data-stuck", "true"));
    expect(canvasElement.querySelector('[aria-hidden="true"]')).toBeNull();
  },
};
