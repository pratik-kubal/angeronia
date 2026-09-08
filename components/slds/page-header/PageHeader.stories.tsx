import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Rocket } from "@carbon/icons-react";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/slds/button";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component:
          "The base variant only. The \"object home\" and \"record home\" " +
          "variants are Salesforce record chrome and are out of scope (D10).",
      },
    },
  },
  args: { title: "Full-stack product build" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIconAndMeta: Story = {
  args: { icon: Rocket, meta: "Zero-to-one, multi-tenant from day one" },
};

export const WithActions: Story = {
  args: {
    icon: Rocket,
    meta: "Zero-to-one, multi-tenant from day one",
    actions: (
      <>
        <Button>Share</Button>
        <Button variant="brand">Start a project</Button>
      </>
    ),
  },
};

export const Dark: Story = { ...WithActions, globals: { colorScheme: "dark" } };
