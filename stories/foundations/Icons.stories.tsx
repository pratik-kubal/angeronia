import type { Meta, StoryObj } from "@storybook/nextjs-vite";
// Named imports, not `import * as Carbon`: the barrel is ~2000 glyphs and
// pulling all of it in would put a megabyte of unused SVG in the Storybook
// bundle for the sake of a fourteen-icon table.
import {
  ArrowRight,
  Bot,
  type CarbonIconType,
  Checkmark,
  CloudServices,
  Compare,
  Idea,
  Laptop,
  Launch,
  Meter,
  Moon,
  Package,
  Rocket,
  Sun,
  Terminal,
} from "@carbon/icons-react";
import { Board } from "./Swatch";
import { Icon } from "@/components/slds/icon";

/** The glyphs this site actually uses, with what each one means here. */
const IN_USE: { name: string; glyph: CarbonIconType; use: string }[] = [
  { name: "Idea", glyph: Idea, use: "Philosophy — strategy is engineering" },
  { name: "Compare", glyph: Compare, use: "Philosophy — one decision, two views" },
  { name: "Package", glyph: Package, use: "Philosophy — you keep all of it" },
  { name: "Bot", glyph: Bot, use: "Services — AI & LLM" },
  { name: "CloudServices", glyph: CloudServices, use: "Services — cloud & microservices" },
  { name: "Rocket", glyph: Rocket, use: "Services — full-stack build" },
  { name: "Meter", glyph: Meter, use: "Services — platform reliability" },
  { name: "Terminal", glyph: Terminal, use: "Code Socratic" },
  { name: "ArrowRight", glyph: ArrowRight, use: "Secondary call to action" },
  { name: "Launch", glyph: Launch, use: "External link" },
  { name: "Checkmark", glyph: Checkmark, use: "Completed step" },
  { name: "Sun", glyph: Sun, use: "Light scheme" },
  { name: "Moon", glyph: Moon, use: "Dark scheme" },
  { name: "Laptop", glyph: Laptop, use: "Match system" },
];

function IconsBoard() {
  return (
    <div>
      <Board title="In use on this site">
        <p className="slds-m-bottom_medium site-measure">
          Icons come from <code className="slds-text-font_monospace">@carbon/icons-react</code>{" "}
          (Apache-2.0), the set Code Socratic uses. No Salesforce icon artwork is
          installed (D10) — SLDS supplies the sizing, colour and container
          classes, and <code className="slds-text-font_monospace">.slds-icon</code> styles any
          inline SVG that carries it.
        </p>
        <div className="sb-grid">
          {IN_USE.map(({ name, glyph, use }) => {
            return (
              <div key={name} className="slds-media slds-media_center">
                <div className="slds-media__figure">
                  <Icon icon={glyph} size="small" tone="default" decorative />
                </div>
                <div className="slds-media__body">
                  <code className="slds-text-font_monospace">{name}</code>
                  <p className="slds-text-body_small slds-text-color_weak">{use}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Board>

      <Board title="Sizes">
        <div className="slds-grid slds-grid_vertical-align-center slds-gutters_small">
          {(["xx-small", "x-small", "small", "medium", "large"] as const).map((size) => (
            <div key={size} className="slds-col slds-text-align_center">
              <Icon icon={Idea} size={size} tone="default" decorative />
              <p className="slds-text-body_small slds-text-color_weak">{size}</p>
            </div>
          ))}
        </div>
        <p className="slds-m-top_medium site-measure">
          Each size picks a matching Carbon glyph master (16 / 24 / 32), so line
          weights stay optically correct rather than being scaled.
        </p>
      </Board>

      <Board title="Labelling">
        <p className="site-measure">
          Exactly one of <code className="slds-text-font_monospace">assistiveText</code> or{" "}
          <code className="slds-text-font_monospace">decorative</code> is required — the props are a
          union, so an unlabelled meaningful icon will not compile. An icon that
          repeats an adjacent label is <em>decorative</em>; an icon that carries
          meaning on its own needs a name.
        </p>
      </Board>
    </div>
  );
}

const meta = {
  title: "Foundations/Icons",
  component: IconsBoard,
} satisfies Meta<typeof IconsBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { colorScheme: "dark" } };
