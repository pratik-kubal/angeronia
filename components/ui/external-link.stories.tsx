import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ExternalLink } from "./external-link";

const meta = {
  title: "Components/ExternalLink",
  component: ExternalLink,
  parameters: {
    docs: {
      description: {
        component:
          "A Carbon `Link` that opens in a new tab, and says so.\n\n" +
          "Carbon draws the launch glyph in the right place given " +
          "`renderIcon`, but has no opinion about the rest of the contract: " +
          "`target`, a safe `rel`, and — the part an arrow glued to a label " +
          "cannot do — announcing \"opens in a new tab\" to a screen reader. " +
          "That is all this adds.\n\n" +
          "It is a client component, and that is load-bearing rather than " +
          "incidental: `renderIcon` takes a *component*, and a function cannot " +
          "cross the server/client boundary. Handing `Launch` to Carbon from a " +
          "server component fails the prerender outright.",
      },
    },
  },
} satisfies Meta<typeof ExternalLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { href: "https://code-socratic.angeronia.com/", children: "Try Code Socratic" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /Try Code Socratic/ });

    // The whole contract, asserted rather than assumed.
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer noopener");
    // `noopener` matters: without it the opened tab gets a handle on this one.
    await expect(link).toHaveAccessibleName(/opens in a new tab/);
  },
};

/** In running copy, where the glyph has to sit with the label rather than own a line. */
export const InProse: Story = {
  args: { ...Default.args },
  render: (args) => (
    <p className="site-measure">
      The studio&rsquo;s own product is <ExternalLink {...args} />, a Socratic tutor for people
      learning to program.
    </p>
  ),
};

export const Dark: Story = {
  args: { ...Default.args },
  globals: { colorScheme: "dark" },
};
