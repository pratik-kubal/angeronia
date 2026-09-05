import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toast } from "./Toast";

const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: {
    docs: {
      description: {
        component:
          "A transient message about the page. Deliberately not " +
          "auto-dismissing: a message worth interrupting for is worth leaving " +
          "on screen until it is read, and a timed dismissal fails WCAG 2.2.1 " +
          "for anyone who reads slowly or is using a screen reader.",
      },
    },
  },
  args: { children: "Your message is on its way." },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Dismissible: Story = { args: { onClose: () => {} } };

export const AllTones: Story = {
  render: (args) => (
    <div>
      {(["info", "success", "warning", "error"] as const).map((tone) => (
        <div key={tone} className="slds-m-bottom_small">
          <Toast {...args} tone={tone} onClose={() => {}}>
            {`A ${tone} toast.`}
          </Toast>
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = { ...AllTones, globals: { colorScheme: "dark" } };
