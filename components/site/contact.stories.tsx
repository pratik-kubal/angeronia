import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Contact } from "./contact";

const meta = {
  title: "Sections/Contact",
  component: Contact,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
