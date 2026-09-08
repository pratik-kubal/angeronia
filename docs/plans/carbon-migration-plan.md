# angeronia.com — SLDS 2 → IBM Carbon migration plan

**Status: PROPOSED (2026-09-08).** Nothing in this plan has been implemented.
The site on `main` today is SLDS 2 (Cosmos + the Angeronia theme layer) as
described by `docs/design-system/DESIGN-RULES.md`.

**Written:** 2026-09-08, after O7 (licensing acceptance) was raised.
**Audience:** whoever implements this, and whoever advises on the licence first.
**Scope:** remove the `@salesforce-ux/*` dependency entirely and rebuild the UI
layer on IBM Carbon, without changing the site's copy, information architecture
or page composition.

Measurements below were taken on 2026-09-08 against the tree at `0abdf50`.
Licence quotations are from `node_modules/@salesforce-ux/design-system-2/LICENSE.txt`
as installed at v2.264.1.

> **This plan is not legal advice.** §1 quotes a licence and describes what it
> appears to say. The decision it feeds is a commercial one and deserves a
> qualified reader.

---

## 0. TL;DR

* **Why:** SLDS 2 ships under a Salesforce Terms of Use, not an OSI licence. The
  uncapped indemnity in it covers claims arising from *any application you
  develop with the Software* — i.e. this site's own content, not Salesforce's
  code.
* **What replaces it:** IBM Carbon (`@carbon/react`, Apache-2.0). The site
  already runs Carbon icons, IBM Plex and a Carbon Teal ramp; Code Socratic is a
  working Carbon implementation in the same family and serves as the reference.
* **Size:** roughly the same order as the original SLDS redesign, but with less
  design work — the copy, layout and page composition all survive. The bulk is
  the component layer and the CSS.
* **Three calls already made (2026-09-08), so they are not open questions:**
  Carbon's geometry is accepted as-is rather than re-skinned back to Cosmos's
  (§6); Angeronia converging visually with Code Socratic is accepted and
  intended (§3); and the `slds-linter` CI gate is retired rather than replaced
  (§5, C4). Each is recorded where it bites.
* **A shortcut that does not work:** vendoring the compiled SLDS CSS under
  renamed classes. §1.3.

---

## 1. Why — the licence

### 1.1 What the grant gives

The grant itself is generous and is not the problem:

> Salesforce grants you a worldwide, non-exclusive, no-charge, royalty-free
> copyright license to reproduce, prepare derivative works of, publicly display,
> publicly perform, sublicense, and distribute the Software and derivative works
> subject to these Terms.

### 1.2 What it takes back

Three clauses are the reason to move.

| Clause | Text | Why it matters here |
|---|---|---|
| Indemnity | "You agree to defend Salesforce against any claim … arising out of or accruing from (a) your use of the Software, and (b) **any application you develop with the Software** that infringes any copyright, trademark, trade secret, trade dress, patent, or other intellectual property right of any person or defames any person or violates their rights of publicity or privacy" | Limb (b) is about the content of *this site*, not about Salesforce's code. It is uncapped and it runs to a company, not a hobby project. |
| Discontinuation | "Salesforce reserves the right at any time to modify, suspend, or discontinue, the Software (or any part thereof) with or without notice. You agree that Salesforce shall not be liable to you or to any third party" | The design system underneath a commercial storefront can be withdrawn, with no recourse. |
| AS IS | "The Software may contain bugs, errors and incompatibilities and is made available on an AS IS basis without support, updates, or service level commitments." | Normal for OSS too, but combines badly with the two above. |

There is also an export/sanctions clause restricting who may use the Software.

### 1.3 The shortcut that does not work

Vendoring `vendor/slds2.css` and renaming `slds-*` to `ang-*` does **not**
remove the obligation:

> These Terms shall be included in all copies or substantial portions of the
> Software.

A renamed copy is a derivative work and is explicitly still "subject to these
Terms". It would also obscure the provenance of the code, which is worse than
the status quo, not better. **Removal has to mean replacement.**

### 1.4 What is already clean

No Salesforce *assets* ship today, and that work does not need redoing:
`@salesforce-ux/icons` (CC-BY-ND artwork) was never installed, SLDS 1 was never
installed, no illustration or application chrome is used, the vendor build
strips eight dangling artwork references and fails on a ninth, and no
"Salesforce", "Lightning", "Cosmos" or "Einstein" wording appears in the
rendered site. Only the CSS and token dependency is in scope here.

---

## 2. What is actually coupled to SLDS

Measured on 2026-09-08:

| Surface | Size |
|---|---|
| Wrapper components in `components/slds/` | **37 built, 12 rendered by live pages** |
| Distinct `slds-*` class names in TSX | 211 |
| Distinct `--slds-*` hooks in `app/site.css` | 50 |
| SLDS-coupled code the repo owns | ~2,000 lines (`theme.angeronia.css`, `slds.css`, `site.css`, 3 scripts) |
| Generated vendor CSS | 458 KB raw / 60 KB gzip |

The 12 wrappers the pages actually render: `avatar`, `badge`, `button`,
`button-group`, `button-icon`, `card`, `layout`, `link`, `list`, `media-object`,
`path`, `text`.

Also coupled, and easy to forget:

* `slds-linter` is a **CI merge gate** (`.github/workflows/ci.yml`).
* `scripts/build-vendor-css.mjs`, `check-theme.mjs`, `compare-vendor-css.mjs`
  exist only to assemble and verify the SLDS vendor CSS.
* `docs/design-system/DESIGN-RULES.md` is written *about* SLDS — rules 1, 2, 3
  and 12 name it directly.
* `DECISIONS.md` D1/D2/D3/D7/D8 and ADR-004/008/011 are SLDS-specific.
* `stories/foundations/*` document SLDS tokens.
* `CLAUDE.md` describes the whole project as SLDS-based.

---

## 3. Why Carbon specifically

| | |
|---|---|
| Licence | Apache-2.0 (`@carbon/react`, `@carbon/styles`, `@carbon/themes` — all verified) |
| Already in the tree | `@carbon/icons-react`, `@carbon/colors` |
| Typeface | IBM Plex — already self-hosted via `next/font`, unchanged |
| Accent | Carbon Teal — the SLDS theme layer was *already* a hand-mapped copy of Carbon's teal ramp. `@carbon/colors` teal 10–100 is byte-identical to the ramp in theme block A. |
| Reference implementation | `../code-socratic` is a full Carbon 11 app with a teal brand override, owned by the same author |

**The decisive practical point:** SLDS 2 ships CSS blueprints with *no React*,
which is why 37 wrappers exist. `@carbon/react` ships the components. Most of
the wrapper layer is not ported — it is deleted.

**The decisive strategic point — decided.** `CLAUDE.md` currently says
Angeronia shares Code Socratic's "hue, typeface and icon set, **not its
geometry**". After this they share the geometry too, and that convergence is
**accepted and intended** (decided 2026-09-08). The two properties become one
visual family. Phase 5 must therefore amend that sentence in `CLAUDE.md` — it
will be actively wrong, not merely stale.

---

## 4. Target architecture

```
styles/
  _config.scss     Carbon configured once ($css--font-face: false, CSS grid only,
                   type families pointed at the next/font variables)
  _themes.scss     White + Gray 100, with the teal brand override as two mixins;
                   selected by [data-theme] on <html>
  _site.scss       everything app/site.css does today, on --cds-* tokens
  globals.scss     @use config, @carbon/react, themes, site
components/
  site/            unchanged in structure; imports move to @carbon/react
  ui/              only what Carbon does not provide (Section, Cluster, Avatar,
                   MediaObject) — expected to be 4-6 files, not 37
```

Removed: `vendor/`, `app/slds.css`, `app/theme.angeronia.css`, `app/site.css`,
`components/slds/**`, the three vendor scripts, `eslint.slds.config.mjs`.

Added: `sass-embedded` (dev), `sassOptions` + `optimizePackageImports` in
`next.config.mjs`.

### 4.1 Component mapping

| Today (`components/slds/`) | Carbon |
|---|---|
| `button` | `Button` |
| `button-icon` | `Button kind="ghost" hasIconOnly` / `IconButton` |
| `button-group` | `ButtonSet` |
| `badge` | `Tag` |
| `card` | `Tile` (+ site CSS for the header/footer rows) |
| `link` | `Link` |
| `layout` (Grid/Col) | `Grid` / `Column` |
| `layout` (Container/Cluster/Box) | **keep as site CSS** — no Carbon equivalent |
| `path` | `ProgressIndicator` |
| `text` (Heading/Kicker/Body) | Carbon type tokens + site classes |
| `list` | plain `<ul>`/`<ol>` + site CSS |
| `avatar`, `media-object` | **keep as site components** — no Carbon equivalent |
| the other 25 | **delete** — unused by any page |

### 4.2 Token mapping

Spacing maps cleanly (both are 4-pt scales). Colour maps by role. Type is the
loosest fit and needs a visual pass.

| SLDS hook | Carbon token | Note |
|---|---|---|
| `--slds-g-spacing-1…12` | `--cds-spacing-02…11` | 1:1 by value; `spacing-6` and `-7` both land on `--cds-spacing-07` |
| `--slds-g-color-on-surface-1/3` | `--cds-text-primary` | SLDS's `-3` (heading ink) has no separate Carbon token |
| `--slds-g-color-on-surface-2` | `--cds-text-secondary` | |
| `--slds-g-color-surface-container-1/2/3` | `--cds-layer-01` / `layer-02` / `layer-accent-01` | |
| `--slds-g-color-border-1/2` | `--cds-border-subtle-01` / `border-strong-01` | |
| `--slds-g-color-accent-container-1` | `--cds-background-brand` | |
| `--slds-g-color-accent-container-2`, `accent-2` | `--cds-link-primary` | |
| `--slds-g-color-on-accent-1` | `--cds-text-on-color` | |
| `--slds-g-font-scale-1…8` | `--cds-body-compact-01` … `--cds-heading-07` | **approximate — needs eyes on it** |
| `--slds-g-sizing-border-*`, `sizing-content-*`, `sizing-heading-*` | *no equivalent* | become site-owned values |
| `--slds-g-radius-*` | *no equivalent* | Carbon is square by default — see §6 |
| `--slds-g-shadow-3` | *no equivalent* | Carbon has no elevation scale in v11 |
| `--slds-g-color-palette-blue-40` / `purple-40` | `--cds-support-info` / *n/a* | used only by the code-sample highlighter |

---

## 5. Phased roadmap

Each phase ends green on the gates it declares. Do not start the next until it
does.

### Phase 0 — Decision and record
* Confirm the licence call with whoever advises the company.
* Record the ADR **before any code** (repo rule): close O7, supersede D1/D2/D3/
  D7/D8 and ADR-004/008/011.
* **Gate:** `DECISIONS.md` states the decision and what it costs.

### Phase 1 — Build pipeline
* Add `@carbon/react`, `sass-embedded`; remove all four `@salesforce-ux/*` packages.
* `sassOptions: { implementation: "sass-embedded", quietDeps: true }` and
  `optimizePackageImports: ["@carbon/icons-react"]` in `next.config.mjs`.
* `styles/_config.scss` + `styles/globals.scss`; `app/layout.tsx` imports it.
* **Gate:** `npm run build` compiles with Carbon's CSS present and nothing else.

### Phase 2 — Theme
* `styles/_themes.scss`: White / Gray 100 with the teal brand mixins, selected
  by `[data-theme]`.
* Rewire `next-themes` from the `slds-color-scheme_*` classes to `data-theme`
  (`lib/slds/scheme.ts` → `lib/theme.ts`).
* **Gate:** both schemes render; the switcher works; no `--slds-*` remains in
  the served CSS.

### Phase 3 — Components
* Port the 12 used wrappers per §4.1; delete the other 25 with their stories.
* **Gate:** typecheck clean; every page renders; Storybook builds.

### Phase 4 — Site CSS
* `app/site.css` → `styles/_site.scss` with the §4.2 mapping.
* **Gate:** no `--slds-*` anywhere; visual pass in both schemes at 3 widths.

### Phase 5 — Gates and docs
* **Retire `lint:slds` rather than replace it** (decided 2026-09-08). Remove
  the script, the `eslint.slds.config.mjs` config and the CI step, and say so in
  `DECISIONS.md`. The a11y stories are the gate that catches real problems; a
  stylelint config invented to fill the hole would be ceremony, not coverage.
* Replace `check:theme` with a Carbon-equivalent contrast check, or retire it —
  still open (C7).
* Rewrite `DESIGN-RULES.md`, the SLDS parts of `DECISIONS.md`, `CLAUDE.md`,
  the README licensing section, `stories/foundations/*`.
* **Gate:** CI green; a11y stories green in both schemes; README accurate.

---

## 6. What visibly changes

**Decided 2026-09-08: Carbon's geometry is taken as-is.** No radius, elevation
or density is re-added to make the site resemble the SLDS version. The list
below is therefore the agreed target, not a warning.

* **Corners.** Cosmos rounds; Carbon is square. Design rule 7 today says "buttons
  pill, cards `border-4`, inputs `border-2`" — that rule is **replaced**, not
  reinterpreted. Carbon buttons are rectangles and stay rectangles.
* **Density.** Carbon's default type scale and control heights are tighter than
  Cosmos's marketing-tuned sizes. The current site already fights this once
  (`site-root` consumes `font-scale-2` because Cosmos's 13px base is an app-shell
  size); Carbon has the same tendency.
* **Elevation.** Carbon 11 has no shadow scale. The card treatment is currently
  one shadow level; it becomes a border.
* **Focus ring.** Carbon's is a 2px inset outline in `--cds-focus`; SLDS's is
  outset. Visibly different, equally compliant.
* **The hero Möbius and the Code Socratic replica are unaffected** — both are
  site-owned CSS and canvas, reading colour from whatever tokens exist. They
  need the token names swapped and nothing else.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| The site looks meaningfully different and that is discovered late | Do §6 as a deliberate review at the end of Phase 2, before any component work |
| `slds-linter` has no Carbon equivalent, so a CI gate silently disappears | Decide in Phase 5 whether `stylelint` replaces it or the gate is retired on the record |
| `check:theme` (58 contrast pairings) is SLDS-specific | Carbon publishes its own contrast guarantees; decide whether to re-implement or rely on the axe stories |
| Sass build cost in CI | Measured at well under a second on Code Socratic; low |
| Half-migrated state on `main` | Phases are independently green; never merge a phase that is not |
| Brand convergence with Code Socratic is unintended | §3 — surface it before Phase 1, not after |

---

## 8. Decisions and open questions

### Decided 2026-09-08

| # | Question | Decision |
|---|---|---|
| C3 | Accept Carbon's square geometry, or re-add radius as a brand override? | **Accept Carbon's geometry.** Design rule 7 is replaced, not reinterpreted. |
| C4 | Replace `slds-linter` with `stylelint`, or retire the gate? | **Retire it**, on the record in `DECISIONS.md`. The a11y stories are the real gate. |
| C5 | Does Angeronia want to look like Code Socratic? | **Yes — accepted and intended.** Phase 5 amends the `CLAUDE.md` sentence that says otherwise. |

### Still open

| # | Question | Recommendation |
|---|---|---|
| C1 | Keep a wrapper library, or use `@carbon/react` directly in site components? | **Directly.** The wrappers existed because SLDS ships no React. Not blocking — proceed on the recommendation unless told otherwise. |
| C2 | Delete the 25 unused wrappers or port them? | **Delete.** Used by nothing but their own stories; Carbon supplies equivalents if ever needed. Not blocking. |
| C6 | Storybook `foundations` stories document SLDS tokens — port or drop? | Port; they are how the theme stays reviewable. Not blocking. |
| C7 | Does `check:theme` get a Carbon equivalent, or retire with `lint:slds`? | Decide at Phase 5, once it is clear what Carbon guarantees on contrast out of the box. |

## 9. Effort

No estimate in hours is offered — it depends on how much of §6 turns into design
work. In units of the original redesign: Phase 0–2 is small and well understood
(the theme is a port of a file that already exists in `../code-socratic`);
Phase 3–4 is the bulk; Phase 5 is documentation-heavy and unavoidable, because
leaving `DESIGN-RULES.md` describing SLDS would be worse than not migrating.

---

## 10. References

* SLDS 2 Terms of Use: `node_modules/@salesforce-ux/design-system-2/LICENSE.txt`
* Carbon licence: `node_modules/@carbon/react/package.json` → `Apache-2.0`
* Reference implementation: `../code-socratic/apps/web/styles/_config.scss`,
  `_themes.scss`, `next.config.mjs`
* Current contract: `docs/design-system/DESIGN-RULES.md`
* Current decision log: `docs/design-system/DECISIONS.md` (O7, ADR-004/008/011)
