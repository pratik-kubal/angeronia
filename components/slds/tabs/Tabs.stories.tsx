import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tabs } from "./Tabs";
import { services } from "@/data/angeronia";

const tabs = services.slice(0, 3).map((service, index) => ({
  id: `service-${index}`,
  label: service.title,
  content: <p className="slds-p-around_medium">{service.blurb}</p>,
}));

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          "The blueprint gives the look; the keyboard contract is the " +
          "component. One tab stop for the tablist (roving `tabindex`), arrows " +
          "to move between tabs, Home and End to jump to the ends, and tabbing " +
          "again leaves the tablist for the panel.",
      },
    },
  },
  args: { tabs, label: "Services" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Scoped: Story = { args: { variant: "scoped" } };

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("tab", { name: services[0].title });
    const second = canvas.getByRole("tab", { name: services[1].title });
    const last = canvas.getByRole("tab", { name: services[2].title });

    await expect(first).toHaveAttribute("aria-selected", "true");
    // Roving tabindex: exactly one tab is in the tab order.
    await expect(first).toHaveAttribute("tabindex", "0");
    await expect(second).toHaveAttribute("tabindex", "-1");

    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(second).toHaveFocus();
    await expect(second).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{End}");
    await expect(last).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect(first).toHaveFocus();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
