import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/slds/button";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "SLDS's Empty State is built around its illustration set, which D10 " +
          "puts out of scope — so this is the text-and-action half, composed " +
          "from utilities. An empty state without an action is a dead end, so " +
          "`action` is where most of the value is.",
      },
    },
  },
  args: {
    heading: "Nothing here yet",
    body: "Case studies land here as projects wrap.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: (
      <Button variant="brand" href="#contact">
        Start a project
      </Button>
    ),
  },
};

export const HeadingOnly: Story = { args: { body: undefined } };

export const Dark: Story = { ...WithAction, globals: { colorScheme: "dark" } };
