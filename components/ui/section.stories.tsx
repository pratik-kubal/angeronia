import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Card } from "./card";
import { Section } from "./section";
import { Body } from "./text";

const meta = {
  title: "Components/Section",
  component: Section,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "One page section: an id to link to, an optional eyebrow and " +
          "heading, and the vertical rhythm that separates it from its " +
          "neighbours.\n\n" +
          "The container is Carbon's 2x `Grid`, which already supplies the " +
          "responsive margin, the gutters and the centring; `site-container` " +
          "does nothing but shorten the maximum line from Carbon's 99rem — an " +
          "application width — to something a marketing paragraph can be read " +
          "at.\n\n" +
          "`shade` gives the section its own ground *and* wraps its content in " +
          "a Carbon `<Layer>`. That is the whole mechanism behind alternating " +
          "bands: the band is `layer-01`, and everything inside it steps up one " +
          "level, so a card on a band is white without being told it is on one.",
      },
    },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

const CARDS = (
  <div className="site-cards site-cards_2">
    <Card heading="One">
      <p>A card on whichever ground the section supplies.</p>
    </Card>
    <Card heading="Two">
      <p>Its neighbour, stretched to the same height.</p>
    </Card>
  </div>
);

export const Default: Story = {
  args: {
    id: "example",
    kicker: "The eyebrow",
    heading: "What this section is about",
    children: CARDS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The heading is an h2 and names the section's landmark, so the page's
    // outline and its landmarks agree.
    const heading = canvas.getByRole("heading", { level: 2 });
    await expect(canvas.getByRole("region", { name: heading.textContent as string })).toBeVisible();
  },
};

export const Shaded: Story = {
  args: { ...Default.args, shade: true },
};

/** No heading: the section takes its accessible name from the kicker instead. */
export const KickerOnly: Story = {
  args: { id: "kicker-only", kicker: "Our product", children: CARDS },
};

/** Two in a row, which is how the page actually reads — bands alternating. */
export const Alternating: Story = {
  args: { ...Default.args },
  render: () => (
    <>
      <Section id="a" kicker="First" heading="On the page ground">
        <Body>The page itself.</Body>
      </Section>
      <Section id="b" kicker="Second" heading="On a band" shade>
        {CARDS}
      </Section>
      <Section id="c" kicker="Third" heading="Back on the ground">
        {CARDS}
      </Section>
    </>
  ),
};

export const Dark: Story = {
  args: { ...Shaded.args },
  globals: { colorScheme: "dark" },
};
