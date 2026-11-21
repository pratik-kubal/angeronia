import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Close } from "./close";

const meta = {
  title: "Sections/Close",
  component: Close,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Close>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
