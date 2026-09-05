import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Accordion } from "./Accordion";
import { philosophy } from "@/data/angeronia";

const items = philosophy.beats.map((beat, index) => ({
  id: `beat-${index}`,
  summary: beat.tag,
  content: <p>{beat.text}</p>,
}));

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          "The summary is a real `<button>` inside a heading, wired to its " +
          "panel with `aria-controls` and `aria-expanded`; closed panels are " +
          "removed from the accessibility tree rather than merely hidden. " +
          "Headings are what let a screen-reader user jump between sections, " +
          "so `headingLevel` follows the page outline.",
      },
    },
  },
  args: { items, defaultOpen: ["beat-0"] },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllClosed: Story = { args: { defaultOpen: [] } };

export const AllowMultiple: Story = {
  args: { allowMultiple: true, defaultOpen: ["beat-0", "beat-1"] },
};

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: philosophy.beats[0].tag });
    const second = canvas.getByRole("button", { name: philosophy.beats[1].tag });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(second).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    // One at a time, unless `allowMultiple`.
    await expect(first).toHaveAttribute("aria-expanded", "false");

    // The open panel is a named region pointing back at its button.
    const panel = canvas.getByRole("region", { name: philosophy.beats[1].tag });
    await expect(panel).toBeVisible();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
