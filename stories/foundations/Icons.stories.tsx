import type { Meta, StoryObj } from "@storybook/nextjs-vite";
// Named imports, not `import * as Carbon`: the barrel is ~2000 glyphs and
// pulling all of it in would put a megabyte of unused SVG in the Storybook
// bundle for the sake of a fourteen-icon table.
import {
  Bot,
  type CarbonIconType,
  Chat,
  CheckmarkOutline,
  CloudServices,
  Compare,
  Idea,
  Incomplete,
  Launch,
  Meter,
  Moon,
  Notebook,
  Package,
  Play,
  Result,
  Rocket,
  SendFilled,
  Sun,
  Terminal,
  TestTool,
  Time,
} from "@carbon/icons-react";
import { Board } from "./Swatch";

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
  { name: "Launch", glyph: Launch, use: "External link" },
  { name: "Sun", glyph: Sun, use: "Light scheme" },
  { name: "Moon", glyph: Moon, use: "Dark scheme" },
  { name: "Chat", glyph: Chat, use: "Session replica — the tutor tab" },
  { name: "Notebook", glyph: Notebook, use: "Session replica — instructions" },
  { name: "TestTool", glyph: TestTool, use: "Session replica — tests" },
  { name: "Result", glyph: Result, use: "Session replica — results" },
  { name: "Play", glyph: Play, use: "Session replica — run" },
  { name: "SendFilled", glyph: SendFilled, use: "Session replica — send" },
  { name: "Time", glyph: Time, use: "Session replica — elapsed" },
  { name: "CheckmarkOutline", glyph: CheckmarkOutline, use: "Session replica — phase done" },
  { name: "Incomplete", glyph: Incomplete, use: "Session replica — phase in progress" },
];

/** Carbon draws separate masters at each size, so they are shown, not scaled. */
const SIZES = [16, 20, 24, 32] as const;

function IconsBoard() {
  return (
    <div>
      <Board title="In use on this site">
        <p className="sb-note site-measure">
          Icons come from <code className="sb-mono">@carbon/icons-react</code> (Apache-2.0), the set
          Code Socratic uses. Each glyph is an inline <code className="sb-mono">&lt;svg&gt;</code>{" "}
          that inherits <code className="sb-mono">currentColor</code>, so an icon takes the ink of
          whatever it sits in and needs no colour of its own.
        </p>
        <div className="sb-grid">
          {IN_USE.map(({ name, glyph: Glyph, use }) => (
            <div key={name} className="sb-swatch">
              <span className="sb-swatch__icon">
                <Glyph size={20} aria-hidden="true" focusable="false" />
              </span>
              <span className="sb-swatch__meta">
                <code className="sb-mono">{name}</code>
                <span className="sb-quiet site-body_small">{use}</span>
              </span>
            </div>
          ))}
        </div>
      </Board>

      <Board title="Sizes">
        <div className="sb-cluster">
          {SIZES.map((size) => (
            <div key={size} className="sb-size">
              <Terminal size={size} aria-hidden="true" focusable="false" />
              <p className="sb-quiet site-body_small">{size}</p>
            </div>
          ))}
        </div>
        <p className="sb-note site-measure">
          Carbon draws separate 16 / 20 / 24 / 32 masters, so a glyph is asked for at the size it is
          rendered rather than scaled — line weights stay optically correct. The site uses 16 inside
          controls and the session replica, and 20 in card headers.
        </p>
      </Board>

      <Board title="Labelled or hidden — never neither">
        <p className="site-measure">
          Every icon on the site is either <code className="sb-mono">aria-hidden</code> because an
          adjacent label already names it, or carries its own accessible name (design rule 10). An
          icon-only control uses Carbon&rsquo;s <code className="sb-mono">IconButton</code>, whose{" "}
          <code className="sb-mono">label</code> is both the tooltip and the accessible name — the
          scheme switcher is the only one on the site.
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
