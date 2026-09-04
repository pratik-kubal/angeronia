# Decision log — angeronia.com design system

Every architectural decision behind the SLDS 2 redesign, plus every deviation
from [`docs/plans/slds2-redesign-plan.md`](../plans/slds2-redesign-plan.md)
made during implementation.

**Rule:** record a deviation here *before* acting on it. Entries are append-only;
supersede rather than rewrite.

---

## 1. Plan decisions D1–D11 (settled 2026-09-04, plan §0)

| # | Decision | Rationale |
|---|----------|-----------|
| **D1** | Consume **`@salesforce-ux/design-system-2`** from npm (v2.264.1, "Summer '26") — not the archived GitHub repo, not SLDS 1 (`@salesforce-ux/design-system`). | `salesforce-ux/design-system` on GitHub is archived / read-only (last push 2026-06-02) and is the SLDS 1 Sass source. SLDS 2 ships only as an npm dist; its monorepo is private. |
| **D2** | Theme = **Cosmos + an Angeronia theme layer** (`app/theme.angeronia.css`) that swaps the brand reference palette to **Carbon Teal** (Teal 60 light / Teal 40 dark) and re-tints the semantic hooks Cosmos hard-codes in blue. Light + dark + system via `color-scheme`. | SLDS 2 reserves value assignment for the theme layer ("value assignment is reserved for theming tools"), so a theme file is the sanctioned place to re-brand. Luminance-matched mapping preserves every Cosmos contrast pairing (plan §2.8). |
| **D3** | Framework stays **Next.js App Router + React 19 + TypeScript**; SLDS 2 CSS is consumed as plain CSS with SLDS class names (component blueprints), wrapped in thin React components. | SLDS 2's Lightning Base Components are LWC-only. Blueprints are explicitly published for "environments where Salesforce's Lightning Component framework isn't available". |
| **D4** | **Storybook 10.x with `@storybook/nextjs-vite`** is the design source of truth. Every UI component ships stories; pages are composed only from storied components. | Requested; matches how Salesforce ships SLDS 2 and how the sister product Code Socratic works. |
| **D5** | **Remove** everything not expressible in SLDS 2: the rough.js Möbius canvas, scroll-scrubbed continuity line / process rail / meter graph, scroll spine, enter-reveals, the Noir theme and grain, the citron UI palette, hard "block" shadows, 0–2 px radii, the Google display fonts, Tailwind and `tw-animate-css`. | Plan §4 maps each removal to the guideline it violates. |
| **D6** | The Angeronia **logo mark** (disc + cursor) is kept as a brand SVG and **re-tinted to teal**: disc `--slds-g-color-accent-container-1`, cursor `--slds-g-color-on-accent-1`. `app/icon.svg` is re-mapped onto the Carbon teal ramp at equal OKLab lightness; the raster logos in `public/` are regenerated. Citron leaves the repo entirely. | Matches Code Socratic's teal favicon — one accent across the family. |
| **D7** | Global (`--slds-g-*`), shared (`--slds-s-*`) and reference (`--slds-r-*`) hooks are **referenced in components, never reassigned**. The only file allowed to assign them is `app/theme.angeronia.css`. | Hard rule from the Global Styling Hooks and Develop guidelines; the theme file is the one sanctioned exception. |
| **D8** | Styles live in `.css` files — never inline `style={}`, never Tailwind — so **`@salesforce-ux/slds-linter`** can lint them in CI. | The linter is ESLint-based and reads `.css` / `.html` / `.js`, not TSX. |
| **D9** | Install the Salesforce **AI development skills** (`forcedotcom/sf-skills`: `design-systems-slds-apply`, `design-systems-slds-validate`, `design-systems-slds2-migrate`, Apache-2.0) for every future agent session. | Official and Claude-Code-compatible; ships search scripts so agents verify hooks / blueprints / utilities exist before using them. |
| **D10** | **No Salesforce icons, illustrations, product assets or trademarks.** `@salesforce-ux/icons` (CC-BY-ND) is not installed; SLDS illustrations, Global Header / Navigation chrome, Brand Band, Dynamic (Einstein) Icons, App Launcher, Welcome Mat, Trial Bar and Setup Assistant are out of scope; no attribution line and no "Salesforce" wording in the UI. Icons come from **`@carbon/icons-react`** (Apache-2.0). | Keeps both Angeronia properties on one icon language and one accent hue. `slds-*` class names are CSS identifiers, not trademark use; the SLDS 2 Terms of Use require no attribution. |
| **D11** | **Typeface = IBM Plex Sans (300/400/600/700) + IBM Plex Mono (400)**, self-hosted through `next/font/google` and assigned to `--slds-g-font-family-base` / `--slds-g-font-family-monospace` in theme block C. | Brand-family consistency with Code Socratic; real 300/600 cuts on every OS; one mono family for code, tags and numerals. ≈171 KB latin woff2, with a size-adjusted fallback so CLS stays 0. SLDS 2 guidance prefers system fonts, but font family is a theme-layer value — this is sanctioned theming, not a violation. |

## 2. Plan open questions O1–O12 (plan §10)

| # | Question | Outcome |
|---|----------|---------|
| O1 | Accent colour | **Carbon Teal via the Angeronia theme layer** (D2, plan §2.8). |
| O2 | Tailwind | **Removed entirely**; SLDS utilities replace it. |
| O3 | Hero illustration | **None** in Phase 3. A static flat teal Möbius SVG (hooks only, one per page) may be added later as its own storied `Illustration` component — separate ADR. |
| O4 | Scheme persistence | **Keep `next-themes`** (plan §2.3). |
| O5 | Next.js version | **Stay on 15.5.x** for the migration; upgrade to 16 in a separate PR after Phase 5. |
| O6 | Storybook hosting | **Separate Vercel project** (e.g. `design.angeronia.com`). |
| O7 | Licensing | **Open — the user's call before Phase 1 ships to production.** SLDS 2 CSS and tokens are under the Salesforce Terms of Use (non-OSI, with an indemnification clause); Carbon icons are Apache-2.0 and IBM Plex is OFL 1.1. Nothing else in the plan blocks on this. |
| O8 | Density toggle | **Spike in Phase 2**; expose only if SLDS 2 offers a supported switch, else document "comfy only". |
| O9 | Proof numbers | **Static** Progress Bar values, no counting animation. |
| O10 | Logo mark colour | **Re-tinted to teal** (D6). |
| O11 | Typeface | **IBM Plex Sans 300/400/600/700 + IBM Plex Mono 400** (D11). |
| O12 | Icon set | **Carbon** (`@carbon/icons-react`, D10). |

---

## 3. Implementation decisions

Recorded as the phases land. Each entry states what the plan said, what was
done instead, and why.

### ADR-001 — Skills installed by direct copy, not `npx skills add` (Phase 0)

**Plan:** §8 Phase 0.4 — `npx skills add forcedotcom/sf-skills`.

**Done:** the `skills` CLI blocked on an interactive prompt in a
non-interactive shell and began copying the *entire* 40-skill catalogue.
`forcedotcom/sf-skills` was cloned instead and only the three
`design-systems-*` skills were copied into `.claude/skills/`, alongside the
upstream `LICENSE.txt` as `SF-SKILLS-LICENSE.txt`.

**Why:** the plan's intent is those three skills, not the Agentforce /
Commerce / Data360 catalogue, which would add ~40 MB of unrelated context to
every session. Re-sync with:

```bash
git clone --depth 1 https://github.com/forcedotcom/sf-skills.git /tmp/sf-skills
cp -R /tmp/sf-skills/skills/design-systems-slds{-apply,-validate,2-migrate} .claude/skills/
```

### ADR-002 — Verified package versions (Phase 0/1)

The plan's §1.1 table was written against npm on 2026-09-04. Installed and
verified on the same day:

| Package | Plan | Installed |
|---|---|---|
| `@salesforce-ux/design-system-2` | 2.264.1 | 2.264.1 |
| `@salesforce-ux/design-tokens` | 4.1.0 | 4.1.0 |
| `@salesforce-ux/slds-linter` | 1.2.1 | 1.2.1 |
| `@carbon/icons-react` | 11.87.0 | 11.87.0 |
| `@carbon/colors` | 11.57.0 | 11.57.0 |

`@salesforce-ux/design-system-2` exact-pinned (no `^`) so a patch bump cannot
silently move a blue literal out from under theme block B — see plan §11.
