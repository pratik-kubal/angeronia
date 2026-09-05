import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { List, ListItem } from "./List";
import { product } from "@/data/angeronia";

const meta = {
  title: "Components/List",
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          "`ordered` decides the element — the semantics — while `variant` " +
          "decides the look. A dotted list is still a `<ul>`.",
      },
    },
  },
  args: {
    children: product.points.map((point) => <ListItem key={point}>{point}</ListItem>),
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dotted: Story = { args: { variant: "dotted" } };

export const Horizontal: Story = {
  args: {
    variant: "horizontal",
    children: ["Backend", "Frontend", "Cloud / DevOps", "AI / LLM"].map((item) => (
      <ListItem key={item} className="slds-m-right_medium">
        {item}
      </ListItem>
    )),
  },
};

export const WithDividers: Story = { args: { dividers: "bottom" } };

export const Ordered: Story = { args: { ordered: true, dividers: "bottom" } };

export const Dark: Story = {
  args: { variant: "dotted" },
  globals: { colorScheme: "dark" },
};
