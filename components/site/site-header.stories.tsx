import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { nav } from "@/data/angeronia";
import { SiteHeader } from "./site-header";

const meta = {
  title: "Sections/SiteHeader",
  component: SiteHeader,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The masthead on paper: the wordmark before the axis, the section links after it, and " +
          "\"Email the studio\" at the margin. Under 900px the links hide. On the home page its links are " +
          "the page's own hashes; elsewhere they lead back to them.",
      },
    },
  },
  args: { page: "home" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole("navigation", { name: nav.label });
    const links = within(navigation).getAllByRole("link");
    await expect(links.map((a) => a.getAttribute("href"))).toEqual(nav.items.map((item) => item.hash));
    await expect(canvas.getByRole("link", { name: nav.action.label })).toHaveAttribute("href", nav.action.href);
    // The games are not in the navigation (ADR-020).
    await expect(navigation).not.toHaveTextContent(/games/i);
  },
};

export const OtherPage: Story = {
  args: { page: "other" },
  play: async ({ canvasElement }) => {
    const navigation = within(canvasElement).getByRole("navigation");
    const links = within(navigation).getAllByRole("link");
    await expect(links.map((a) => a.getAttribute("href"))).toEqual(nav.items.map((item) => `/${item.hash}`));
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
