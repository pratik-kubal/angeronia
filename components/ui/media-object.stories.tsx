import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "./avatar";
import { MediaObject } from "./media-object";
import { Body } from "./text";

const meta = {
  title: "Components/MediaObject",
  component: MediaObject,
  parameters: {
    docs: {
      description: {
        component:
          "A figure beside a body, stacking below `md`. Carbon has no media " +
          "object, so this is one flex rule in `styles/_site.scss`.\n\n" +
          "Used once, by the About section. It is here rather than inlined " +
          "there because the stacking behaviour is the part worth reviewing on " +
          "its own — narrow the canvas past 672px and the figure moves above " +
          "the copy.",
      },
    },
  },
} satisfies Meta<typeof MediaObject>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    figure: <Avatar initials="PK" label="Pratik Kubal" size="large" />,
    children: (
      <Body>
        One engineer, fifteen years of it: AI and LLM product work, cloud microservices, and the
        full-stack builds that carry them.
      </Body>
    ),
  },
};

export const WithoutFigure: Story = {
  args: { children: <Body>A body with no figure still lays out as one column.</Body> },
};

export const Dark: Story = {
  args: { ...Default.args },
  globals: { colorScheme: "dark" },
};
