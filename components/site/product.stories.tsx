import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Product } from "./product";

const meta = {
  title: "Sections/Product",
  component: Product,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Product>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
