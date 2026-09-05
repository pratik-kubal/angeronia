import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Link } from "./Link";
import { LINKS } from "@/data/angeronia";

const meta = {
  title: "Components/Link",
  component: Link,
  parameters: {
    docs: {
      description: {
        component:
          "SLDS 2's base stylesheet already gives a bare `<a>` the `accent-2` " +
          "colour and `accent-3` hover the guidelines ask for, so this adds no " +
          "styling at all — only the external-link contract: `target`, a safe " +
          "`rel`, and a labelled glyph, so \"opens in a new tab\" is announced " +
          "rather than implied by an arrow glued to the label.",
      },
    },
  },
  args: { href: "#main", children: "See what we build" },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const External: Story = {
  args: { href: LINKS.codeSocratic, external: true, children: "Visit Code Socratic" },
};

export const InProse: Story = {
  render: (args) => (
    <p className="slds-text-body_regular site-measure">
      Our own product, built end-to-end.{" "}
      <Link {...args} href={LINKS.codeSocratic} external>
        Code Socratic
      </Link>{" "}
      teaches Approach → Complexity → Code and grades you honestly.
    </p>
  ),
};

export const Dark: Story = {
  ...External,
  globals: { colorScheme: "dark" },
};
