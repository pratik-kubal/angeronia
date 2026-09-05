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

export const Dark: Story = { globals: { colorScheme: "dark" } };
