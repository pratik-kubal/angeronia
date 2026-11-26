import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { contact, LINKS } from "@/data/angeronia";
import { Contact } from "./contact";

const meta = {
  title: "Sections/Contact",
  component: Contact,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The close: what to write and to whom, the button that prepares the email, the address in " +
          "full, then LinkedIn and GitHub. Under 900px the address comes first and the button last.",
      },
    },
  },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("link", { name: contact.action.label });
    // The prepared email: the subject written, and prompts with no "I" in them.
    const href = decodeURIComponent(button.getAttribute("href") ?? "");
    await expect(href).toContain("subject=A project for Angeronia Labs");
    await expect(href).not.toMatch(/\bI\b/);
    await expect(canvas.getByRole("link", { name: LINKS.email })).toHaveAttribute("href", LINKS.emailHref);
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
