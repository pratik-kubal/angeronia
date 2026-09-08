import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, Link, Tag } from "@carbon/react";
import { Cluster } from "./cluster";

const meta = {
  title: "Components/Cluster",
  component: Cluster,
  parameters: {
    docs: {
      description: {
        component:
          "A row of naturally-sized items that wraps.\n\n" +
          "Not a Carbon `Grid` of `Column`s: a grid column grows to fill its " +
          "track, which is right for a layout grid and wrong for a tag list, " +
          "where it would spread four tags across 1200px. Carbon's `Stack` is " +
          "one-directional and does not wrap. So this is one flex rule in " +
          "`styles/_site.scss`, built from Carbon's spacing scale.",
      },
    },
  },
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = ["Python", "AWS", "Next.js", "PostgreSQL", "Terraform", "OpenAI"];

export const Tags: Story = {
  args: {
    children: TAGS.map((tag) => (
      <Tag key={tag} type="outline" size="sm">
        {tag}
      </Tag>
    )),
  },
};

/** The wider gap, for a pair of actions rather than a list of labels. */
export const Actions: Story = {
  args: {
    gap: "medium",
    children: (
      <>
        <Button kind="primary">Start a conversation</Button>
        <Link href="mailto:hello@angeronia.com">hello@angeronia.com</Link>
      </>
    ),
  },
};

/** It wraps, which is the whole point — narrow the canvas to see it. */
export const Wrapping: Story = {
  args: {
    children: [...TAGS, ...TAGS].map((tag, i) => (
      <Tag key={`${tag}-${i}`} type="outline" size="sm">
        {tag}
      </Tag>
    )),
  },
};

export const Dark: Story = {
  args: { ...Tags.args },
  globals: { colorScheme: "dark" },
};
