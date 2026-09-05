import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Checkmark, Idea, Rocket, CloudServices, Meter } from "@carbon/icons-react";
import { Icon } from "./Icon";

const meta = {
  title: "Components/Icon",
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          "An IBM Carbon glyph wearing SLDS 2's icon classes. SLDS ships no " +
          "icon artwork this project may use (D10), but `.slds-icon` styles any " +
          "inline SVG that carries it. `size` picks both the rendered box and " +
          "the Carbon glyph master, so line weights stay optically correct " +
          "instead of being scaled.\n\n" +
          "Exactly one of `assistiveText` or `decorative` is required — the " +
          "type is a union, so an unlabelled meaningful icon will not compile.",
      },
    },
  },
  args: { icon: ArrowRight, decorative: true },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical-align-center slds-gutters_small">
      {(["xx-small", "x-small", "small", "medium", "large"] as const).map((size) => (
        <div key={size} className="slds-col slds-text-align_center">
          <Icon {...args} size={size} />
          <p className="slds-text-body_small slds-text-color_weak">{size}</p>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="slds-grid slds-wrap slds-gutters_small">
      {(["current", "default", "weak", "light", "error", "success", "warning"] as const).map(
        (tone) => (
          <div key={tone} className="slds-col slds-text-align_center slds-m-bottom_small">
            <Icon {...args} tone={tone} size="small" />
            <p className="slds-text-body_small slds-text-color_weak">{tone}</p>
          </div>
        ),
      )}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`error`, `success` and `warning` exist because SLDS defines them, " +
          "but design rule 4 reserves feedback colour for feedback. A section " +
          "icon is `default` or `current`.",
      },
    },
  },
};

export const Labelled: Story = {
  args: { icon: Checkmark, decorative: undefined, assistiveText: "Complete" },
  parameters: {
    docs: {
      description: {
        story:
          "An icon that carries meaning on its own needs a name. It is rendered " +
          "as `slds-assistive-text`, so it is announced but not seen.",
      },
    },
  },
};

export const InUse: Story = {
  render: () => (
    <ul className="slds-list_vertical slds-has-dividers_bottom">
      {[
        { icon: Idea, label: "Strategy is engineering" },
        { icon: CloudServices, label: "Cloud & microservices" },
        { icon: Rocket, label: "Full-stack product build" },
        { icon: Meter, label: "Platform reliability" },
      ].map(({ icon, label }) => (
        <li key={label} className="slds-list__item slds-media slds-media_center">
          <div className="slds-media__figure">
            <Icon icon={icon} size="small" tone="default" decorative />
          </div>
          <div className="slds-media__body">{label}</div>
        </li>
      ))}
    </ul>
  ),
};

export const Dark: Story = {
  args: { icon: Idea, size: "small", tone: "default" },
  globals: { colorScheme: "dark" },
};
