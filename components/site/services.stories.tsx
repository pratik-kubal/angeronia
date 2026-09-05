import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Services } from "./services";

const meta = {
  title: "Sections/Services",
  component: Services,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
