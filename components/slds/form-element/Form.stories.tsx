import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "@/components/slds/input";
import { Textarea } from "@/components/slds/textarea";
import { Select } from "@/components/slds/select";
import { Checkbox } from "@/components/slds/checkbox";
import { CheckboxToggle } from "@/components/slds/checkbox-toggle";
import { RadioGroup } from "@/components/slds/radio-group";
import { Button } from "@/components/slds/button";

/**
 * Every field composes the same Form Element wrapper, so the wiring that makes
 * a field usable is written once: `for`/`id`, `aria-describedby` pointing at
 * help *and* error, `aria-invalid`, and an asterisk that is announced as
 * "required" instead of read as punctuation.
 */
function ProjectForm() {
  return (
    <form className="slds-form slds-form_stacked" onSubmit={(e) => e.preventDefault()}>
      <Input label="Your name" required fieldClassName="slds-m-bottom_small" />
      <Input
        label="Email"
        type="email"
        required
        help="We reply from a person, not a queue."
        fieldClassName="slds-m-bottom_small"
      />
      <Select
        label="What kind of work?"
        fieldClassName="slds-m-bottom_small"
        options={[
          { value: "", label: "Choose one" },
          { value: "ai", label: "AI & LLM product engineering" },
          { value: "cloud", label: "Cloud & microservices" },
          { value: "fullstack", label: "Full-stack product build" },
          { value: "reliability", label: "Platform reliability" },
        ]}
      />
      <RadioGroup
        legend="How far along is it?"
        name="stage"
        defaultValue="idea"
        className="slds-m-bottom_small"
        options={[
          { value: "idea", label: "An idea" },
          { value: "spec", label: "A half-written spec" },
          { value: "running", label: "Something already running" },
        ]}
      />
      <Textarea
        label="What does “done” look like?"
        required
        fieldClassName="slds-m-bottom_small"
      />
      <Checkbox label="Send me the write-up when it ships" className="slds-m-bottom_small" />
      <CheckboxToggle
        label="Share anonymised metrics"
        onText="Sharing"
        offText="Private"
        className="slds-m-bottom_medium"
      />
      <Button variant="brand" type="submit">
        Send
      </Button>
    </form>
  );
}

const meta = {
  title: "Components/Form",
  component: ProjectForm,
} satisfies Meta<typeof ProjectForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithErrors: Story = {
  render: () => (
    <form className="slds-form slds-form_stacked" onSubmit={(e) => e.preventDefault()}>
      <Input
        label="Email"
        type="email"
        required
        defaultValue="not-an-address"
        error="Enter an address like name@example.com."
        fieldClassName="slds-m-bottom_small"
      />
      <Textarea
        label="What does “done” look like?"
        required
        error="Tell us what finished means, in a sentence."
      />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText(/Email/);

    // The error is announced, not just coloured.
    await expect(email).toHaveAttribute("aria-invalid", "true");
    const describedBy = email.getAttribute("aria-describedby");
    await expect(describedBy).toBeTruthy();
    await expect(canvasElement.querySelector(`#${describedBy}`)).toHaveTextContent(
      "Enter an address like name@example.com.",
    );
  },
};

export const HiddenLabel: Story = {
  render: () => (
    <Input label="Search" hideLabel placeholder="Search…" type="search" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Hidden visually, still the accessible name — a placeholder is not a label.
    await expect(canvas.getByLabelText("Search")).toBeInTheDocument();
  },
};

export const Horizontal: Story = {
  render: () => (
    <div>
      <Input label="Your name" horizontal fieldClassName="slds-m-bottom_small" />
      <Input label="Email" type="email" horizontal />
    </div>
  ),
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
