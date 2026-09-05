import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Proof } from "./proof";

const meta = {
  title: "Sections/Proof",
  component: Proof,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Proof>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
