import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Body, Heading, Kicker } from "./text";

const meta = {
  title: "Components/Text",
  component: Heading,
  parameters: {
    docs: {
      description: {
        component:
          "The three type roles Carbon has no component for.\n\n" +
          "Carbon ships type as Sass tokens — `type-style('fluid-heading-05')` " +
          "— rather than as React components or utility classes, and " +
          "`@carbon/react`'s own `Heading` manages the document level and " +
          "nothing else. So the site's three recurring roles are named here and " +
          "painted by `styles/_site.scss`; anything used once takes a Carbon " +
          "token directly in CSS instead.\n\n" +
          "`level` and `size` are separate props on purpose. The outline " +
          "follows where a heading sits on the page; the size follows what it " +
          "is doing there. Conflating them is the usual source of skipped " +
          "heading levels.",
      },
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Display: Story = {
  args: { level: 1, size: "display", children: "Ambiguous problems, shipped software." },
};

export const SectionHeading: Story = {
  args: { level: 2, size: "section", children: "What we take on" },
};

/**
 * An `h3` at display size — legitimate, and the reason the two props exist.
 * A deep heading in a shallow-looking place is a document-outline decision.
 */
export const LevelAndSizeDiverge: Story = {
  args: { level: 3, size: "display", children: "An h3 set at display size" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 3 })).toHaveClass("site-heading_display");
  },
};

export const TheThreeRoles: Story = {
  args: { level: 2, children: "unused" },
  render: () => (
    <div>
      <Kicker>Our principles</Kicker>
      <Heading level={2} size="section">
        Three beats
      </Heading>
      <Body>
        Body copy at the marketing scale, held to a 60ch measure. The page root sets `body-02`
        once and everything inherits it, so this only adds the measure.
      </Body>
      <Body size="small">
        A footnote, at Carbon&rsquo;s `body-01`. Small because a footnote should be small, not
        because the design system&rsquo;s default is.
      </Body>
    </div>
  ),
};

export const Dark: Story = {
  args: { ...TheThreeRoles.args },
  render: TheThreeRoles.render,
  globals: { colorScheme: "dark" },
};
