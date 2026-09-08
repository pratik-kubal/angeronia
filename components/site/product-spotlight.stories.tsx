import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductSpotlight } from "./product-spotlight";

const meta = {
  title: "Sections/ProductSpotlight",
  component: ProductSpotlight,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProductSpotlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
