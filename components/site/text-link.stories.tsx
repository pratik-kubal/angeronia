import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { copy, LINKS } from "@/data/angeronia";
import { TextLink } from "./text-link";

const meta = {
  title: "Components/TextLink",
  component: TextLink,
  parameters: {
    docs: {
      description: {
        component:
          "A link in the band's ink. `quiet` shows its underline on hover (navigation, lists of " +
          "links); `strong` is underlined until hover. `external` opens a new tab and says so to " +
          "assistive tech. A plain `<a>`.",
      },
    },
  },
  args: { href: "#services", emphasis: "quiet", external: false, children: "Services" },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Quiet: Story = {};

export const Strong: Story = {
  args: { href: LINKS.emailHref, emphasis: "strong", children: LINKS.email },
};

export const External: Story = {
  args: { href: LINKS.codeSocratic, emphasis: "strong", external: true, children: "Try Code.Socratic" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("href", "https://www.code-socratic.com");
    await expect(link).toHaveAccessibleName(`Try Code.Socratic ${copy.externalLink}`);
  },
};
