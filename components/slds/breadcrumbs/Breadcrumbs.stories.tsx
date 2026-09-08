import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Breadcrumbs } from "./Breadcrumbs";

const meta = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          "The `<nav>` is named, so a screen reader can tell this trail from " +
          "the site's primary navigation. The last crumb is the current page: " +
          "it is not a link, and it carries `aria-current=\"page\"` — a link to " +
          "where you already are is noise.",
      },
    },
  },
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Services", href: "#services" },
      { label: "AI & LLM product engineering" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation", { name: "Breadcrumbs" })).toBeInTheDocument();
    // The current page is not a link.
    await expect(
      canvas.queryByRole("link", { name: "AI & LLM product engineering" }),
    ).not.toBeInTheDocument();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
