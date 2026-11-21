import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "./site-header";

const meta = {
  title: "Sections/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  args: { variant: "overlay" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
