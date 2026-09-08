// Configuration for `@salesforce-ux/slds-linter` (`npm run lint:slds`).
//
// This is the linter's own emitted `recommended` set, plus one narrowly scoped
// override. Everything the linter reports is treated as a hard failure by CI —
// `lint:slds` is a merge gate (design rule 12) — so the exception is spelled
// out here rather than tolerated as a standing warning.

import { defineConfig } from "eslint/config";
import { sldsCssPlugin } from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    plugins: { ...sldsCssPlugin() },
    extends: ["@salesforce-ux/slds/recommended"],
    rules: {
      "@salesforce-ux/slds/no-slds-class-overrides": "error",
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
      "@salesforce-ux/slds/lwc-token-to-slds-hook": "error",
      "@salesforce-ux/slds/enforce-sds-to-slds-hooks": "error",
      "@salesforce-ux/slds/no-sldshook-fallback-for-lwctoken": "error",
      "@salesforce-ux/slds/no-unsupported-hooks-slds2": "error",
      "@salesforce-ux/slds/no-slds-var-without-fallback": "error",
      "@salesforce-ux/slds/no-slds-namespace-for-custom-hooks": "error",
      "@salesforce-ux/slds/enforce-component-hook-naming-convention": "error",
      "@salesforce-ux/slds/no-slds-private-var": "error",
      "@salesforce-ux/slds/no-hardcoded-values-slds2": "error",
      "@salesforce-ux/slds/reduce-annotations": "error",
      "@salesforce-ux/slds/enforce-bem-usage": "error",
      "@salesforce-ux/slds/modal-close-button-issue": "error",
    },
  },
  {
    // The Angeronia theme layer is the one file allowed to *assign* `--slds-*`
    // hooks (D7, design rule 3). `no-slds-namespace-for-custom-hooks` exists to
    // stop application code doing that; SLDS 2's own Develop guidance carves
    // out the theming tool, which is exactly what this file is. `check:theme`
    // enforces the far stricter contract the rule cannot express: every hook
    // assigned here must already exist in Cosmos, block A must match its
    // generator byte for byte, block B may not contain a hex, and every
    // resulting colour pairing must clear WCAG AA in both schemes.
    files: ["app/theme.angeronia.css"],
    rules: {
      "@salesforce-ux/slds/no-slds-namespace-for-custom-hooks": "off",
      // Block A is a palette: seventeen literal hexes are the entire point of
      // a reference ramp, and they are generated, never hand-written.
      "@salesforce-ux/slds/no-hardcoded-values-slds2": "off",
      // Blocks A–C assign hooks rather than consume them, so "add a fallback"
      // does not apply: a fallback on an assignment would fork the theme.
      "@salesforce-ux/slds/no-slds-var-without-fallback": "off",
    },
  },
]);
