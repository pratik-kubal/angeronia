import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Problems } from "./problems";

const meta = {
  title: "Sections/Problems",
  component: Problems,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Problems>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
