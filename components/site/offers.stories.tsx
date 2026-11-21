import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Offers } from "./offers";

const meta = {
  title: "Sections/Offers",
  component: Offers,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Offers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 390 x 844: every part spans the twelve columns and stacks in reading order. */
export const Phone: Story = {
  parameters: {
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "phone", isRotated: false } },
};
