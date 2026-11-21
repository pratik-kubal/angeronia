import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Close } from "./close";

const meta = {
  title: "Sections/Close",
  component: Close,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
} satisfies Meta<typeof Close>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As the home page renders it, with no props. */
export const Default: Story = {};

/** The home page's close: the ask, both link lists, the legal row and the name. */
export const Full: Story = { args: { variant: "full" } };

/** The legal pages' close: the site links, the legal row and the name. */
export const Compact: Story = { args: { variant: "compact" } };

/** The full close at phone width: the links in two columns, the name larger. */
export const Phone: Story = {
  args: { variant: "full" },
  globals: { viewport: { value: "phone", isRotated: false } },
};
