import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Faq } from "./faq";

const meta = {
  title: "Sections/Faq",
  component: Faq,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Faq>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 390 x 844: each question sits over its answer. */
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
