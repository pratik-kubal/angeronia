import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { About } from "./about";

const meta = {
  title: "Sections/About",
  component: About,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof About>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
