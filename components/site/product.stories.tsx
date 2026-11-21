import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Product } from "./product";

const meta = {
  title: "Sections/Product",
  component: Product,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
} satisfies Meta<typeof Product>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The stacked layout: heading, then the blurb and link. */
export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
