import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          "Initials or an image in a disc. Carbon v11 ships no avatar in its " +
          "public component surface, so this is a site component.\n\n" +
          "The props are a union rather than two optionals: an avatar is either " +
          "an image or initials, never both and never neither. Whichever it is, " +
          "it stands for a person or an entity, so `alt` or `label` is " +
          "required — it is the only place that identity is announced.\n\n" +
          "The disc is `$background-brand` with `$text-on-color` on it, the " +
          "same pair as the brand mark, so it clears AA without the component " +
          "knowing what colour either one is.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {
  args: { initials: "PK", label: "Pratik Kubal" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The full name is the identity; the initials are the picture of it.
    await expect(canvas.getByTitle("Pratik Kubal")).toBeInTheDocument();
  },
};

export const Large: Story = {
  args: { ...Initials.args, size: "large" },
};

export const Dark: Story = {
  args: { ...Large.args },
  globals: { colorScheme: "dark" },
};
