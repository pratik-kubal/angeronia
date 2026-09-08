import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          "Either an image or initials — never both, never neither, so the " +
          "props are a union rather than two optionals. An avatar always " +
          "stands for a person or an entity, so `alt` (image) or `label` " +
          "(initials) is required: it is the only place identity is announced.\n\n" +
          "SLDS's own default-avatar artwork is not used (D10); this project " +
          "supplies initials or its own image.",
      },
    },
  },
  args: { initials: "PK", label: "Pratik Kubal" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Circle: Story = { args: { circle: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical-align-center slds-gutters_small">
      {(["x-small", "small", "medium", "large"] as const).map((size) => (
        <div key={size} className="slds-col slds-text-align_center">
          <Avatar {...args} size={size} circle />
          <p className="slds-text-body_small slds-text-color_weak">{size}</p>
        </div>
      ))}
    </div>
  ),
};

export const Image: Story = {
  args: {
    initials: undefined,
    label: undefined,
    src: "/angeronia-logo-light.png",
    alt: "Angeronia Labs",
    size: "large",
  } as never,
};

export const Dark: Story = {
  args: { circle: true, size: "large" },
  globals: { colorScheme: "dark" },
};
