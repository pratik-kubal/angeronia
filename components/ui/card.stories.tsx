import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Idea, Terminal } from "@carbon/icons-react";
import { Layer, Tag } from "@carbon/react";
import { Card } from "./card";
import { Cluster } from "./cluster";
import { ExternalLink } from "./external-link";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "A Carbon `Tile` with a header row, a body and a footer. Carbon's " +
          "`Tile` is a padded surface and nothing more — no header, no title, " +
          "no footer — so those three rows are the site's, painted by the " +
          "`site-card__*` block.\n\n" +
          "Carbon 11 has no elevation scale, so the card's edge is a border " +
          "rather than the shadow the SLDS build used (ADR-015). Its ground is " +
          "Carbon's `$layer` token, which a surrounding `<Layer>` steps up — " +
          "so the same card reads correctly on the page ground and on a shaded " +
          "band without knowing which it is on. The two stories below are the " +
          "same card in both places.\n\n" +
          "`headingLevel` is separate from the visual size on purpose: the " +
          "heading level follows the page's document outline, which is a " +
          "property of where the card sits rather than of what it looks like.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: "Strategy is engineering",
    children: <p>The decision about what to build is not separable from how it gets built.</p>,
  },
};

export const WithIcon: Story = {
  args: { ...Default.args, icon: Idea },
};

export const WithFooter: Story = {
  args: {
    ...Default.args,
    icon: Terminal,
    footer: <ExternalLink href="https://code-socratic.angeronia.com/">Try it</ExternalLink>,
  },
};

/** A heading that carries a status beside it, which several sections do. */
export const HeadingWithTag: Story = {
  args: {
    heading: (
      <span className="site-cluster">
        <span>NTCSF</span>
        <Tag type="outline" size="sm">
          In progress
        </Tag>
      </span>
    ),
    children: <p>A non-profit running a volunteer roster on spreadsheets.</p>,
  },
};

/**
 * On a shaded band the card has to step up a layer or it disappears into the
 * ground. `<Layer>` is what does it — the card itself is unchanged.
 */
export const OnAShadedBand: Story = {
  args: { ...WithIcon.args },
  render: (args) => (
    <div className="site-section_shade" style={{ padding: "2rem" }}>
      <Layer>
        <Card {...args} />
      </Layer>
    </div>
  ),
};

/** Cards in a row are stretched to one height, so their footers line up. */
export const InARow: Story = {
  args: { ...Default.args },
  render: () => (
    <div className="site-cards site-cards_3">
      <Card heading="Short" icon={Idea}>
        <p>One line.</p>
      </Card>
      <Card
        heading="Longer"
        icon={Terminal}
        footer={<Cluster><Tag type="outline" size="sm">TypeScript</Tag></Cluster>}
      >
        <p>
          A body that runs to several lines, so the row has a height and the shorter card&rsquo;s
          body is the thing that absorbs the difference.
        </p>
      </Card>
      <Card heading="Middling">
        <p>Two lines, give or take, which is what the pair either side is balanced against.</p>
      </Card>
    </div>
  ),
};

export const Dark: Story = {
  args: { ...WithFooter.args },
  globals: { colorScheme: "dark" },
};
