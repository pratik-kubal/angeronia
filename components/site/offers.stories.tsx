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
