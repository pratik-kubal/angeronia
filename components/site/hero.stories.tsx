import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hero } from "./hero";

const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page as it ships: no demo video yet, so one button and no second link. */
export const Default: Story = {};

/** The layout once the 90-second demo exists: a plain underlined link beside the button. */
export const WithSecondLink: Story = {
  args: { secondary: { label: "Watch the 90-second demo", href: "https://example.com/demo" } },
};

export const Phone: Story = {
  parameters: {
    viewport: {
      options: { phone: { name: "Phone", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "phone", isRotated: false } },
};
