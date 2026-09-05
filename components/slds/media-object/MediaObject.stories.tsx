import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MediaObject } from "./MediaObject";
import { Avatar } from "@/components/slds/avatar";
import { aboutLead } from "@/data/angeronia";

const meta = {
  title: "Components/MediaObject",
  component: MediaObject,
  parameters: {
    docs: {
      description: {
        component:
          "A figure beside a body, kept on one baseline, with the body free to " +
          "truncate. The layout primitive behind card headers, list rows and " +
          "the About section.",
      },
    },
  },
  args: {
    figure: <Avatar initials="PK" label="Pratik Kubal" size="large" circle />,
    children: <p>{aboutLead}</p>,
  },
} satisfies Meta<typeof MediaObject>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Centered: Story = { args: { center: true } };

export const Responsive: Story = {
  args: { responsive: true },
  parameters: {
    docs: { description: { story: "Stacks the figure above the body on small screens." } },
  },
};

export const Dark: Story = {
  globals: { colorScheme: "dark" },
};
