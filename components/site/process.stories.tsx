import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Process } from "./process";

const meta = {
  title: "Sections/Process",
  component: Process,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Process>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 390 x 844: each figure rises above its paragraph. */
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
