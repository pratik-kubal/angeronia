import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Philosophy } from "./philosophy";

const meta = {
  title: "Sections/Philosophy",
  component: Philosophy,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Philosophy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
