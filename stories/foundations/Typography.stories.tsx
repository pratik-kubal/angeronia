import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board } from "./Swatch";
import { hook } from "./tokens";

const SCALE = ["base", "1", "2", "3", "4", "5", "6", "7", "8"];
const WEIGHTS = [
  { token: "3", name: "Light" },
  { token: "4", name: "Regular" },
  { token: "6", name: "Semibold" },
  { token: "7", name: "Bold" },
];

/**
 * Reports whether the real IBM Plex faces are in use.
 *
 * A board that silently renders in the system fallback would show the wrong
 * metrics for every sample below it, so this is stated rather than assumed
 * (plan §6.1).
 */
function FontCheck() {
  const [state, setState] = React.useState<{ sans: boolean; mono: boolean } | null>(null);

  React.useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      setState({
        sans: document.fonts.check('1em "IBM Plex Sans"'),
        mono: document.fonts.check('1em "IBM Plex Mono"'),
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!state) return <p className="slds-text-body_small">Checking loaded faces…</p>;

  return (
    <p className="slds-text-body_small">
      IBM Plex Sans: <strong>{state.sans ? "loaded" : "NOT loaded — showing the fallback"}</strong>
      {" · "}
      IBM Plex Mono: <strong>{state.mono ? "loaded" : "not requested by this page"}</strong>
    </p>
  );
}

function TypographyBoard() {
  return (
    <div>
      <Board title="Families">
        <FontCheck />
        <dl className="slds-m-top_medium">
          <dt className="slds-text-title_caps slds-text-color_weak">--slds-g-font-family-base</dt>
          <dd className="slds-m-bottom_small">{hook("--slds-g-font-family-base") || "—"}</dd>
          <dt className="slds-text-title_caps slds-text-color_weak">
            --slds-g-font-family-monospace
          </dt>
          <dd>{hook("--slds-g-font-family-monospace") || "—"}</dd>
        </dl>
        <p className="slds-m-top_medium site-measure">
          Assigned only in <code className="slds-text-font_monospace">app/theme.angeronia.css</code>{" "}
          block C, from the faces <code className="slds-text-font_monospace">next/font</code>{" "}
          self-hosts. Cosmos&rsquo;s system stack stays as the tail, so a
          font-blocked render still matches the design system.
        </p>
      </Board>

      <Board title="Scale">
        <div className="sb-scroll">
          <table className="sb-table">
            <thead>
              <tr>
                <th scope="col">Hook</th>
                <th scope="col">Value</th>
                <th scope="col">Sample</th>
              </tr>
            </thead>
            <tbody>
              {SCALE.map((step) => (
                <tr key={step}>
                  <td>
                    <code className="slds-text-font_monospace">font-scale-{step}</code>
                  </td>
                  <td>{hook(`--slds-g-font-scale-${step}`)}</td>
                  <td style={{ fontSize: `var(--slds-g-font-scale-${step})` }}>
                    We turn ambiguous problems into software that ships.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Board>

      <Board title="Weights">
        {WEIGHTS.map(({ token, name }) => (
          <p
            key={token}
            className="slds-m-bottom_x-small"
            style={{
              fontWeight: `var(--slds-g-font-weight-${token})`,
              fontSize: "var(--slds-g-font-scale-3)",
            }}
          >
            {name} — weight {token}
          </p>
        ))}
        <p className="slds-m-top_medium site-measure">
          Bold is for emphasis inside a sentence, not for headings: a heading is
          already a heading.
        </p>
      </Board>

      <Board title="Type styles">
        <p className="site-heading_display slds-m-bottom_small">Display — scale-8, weight 3</p>
        <p className="slds-text-heading_large slds-m-bottom_small">Heading large — scale-6</p>
        <p className="slds-text-heading_medium slds-m-bottom_small">Heading medium</p>
        <p className="slds-text-heading_small slds-m-bottom_small">Heading small</p>
        <p className="slds-m-bottom_small">Body — inherits the page root&rsquo;s scale-2 (1rem)</p>
        <p className="slds-text-body_small slds-m-bottom_small">
          Body small — scale-neg-1, for notes and footnotes
        </p>
        <p className="slds-text-title slds-m-bottom_small">Title</p>
        <p className="slds-text-title_caps">Title caps — the eyebrow above a section heading</p>
      </Board>

      <Board title="Measure">
        <p className="site-measure slds-m-bottom_medium">
          Prose is held to <code className="slds-text-font_monospace">sizing-content-3</code>{" "}
          (60ch). Anything wider is measurably harder to read: the eye loses the
          start of the next line.
        </p>
        <p className="site-measure_heading">
          Headings are held to <code className="slds-text-font_monospace">sizing-heading-2</code>{" "}
          (25ch), so they break where the sentence does.
        </p>
      </Board>
    </div>
  );
}

const meta = {
  title: "Foundations/Typography",
  component: TypographyBoard,
} satisfies Meta<typeof TypographyBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { colorScheme: "dark" } };
