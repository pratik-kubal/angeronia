import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import * as projectAnnotations from "./preview";

// Runs the same preview config (fonts, tokens, base, the band decorator, a11y
// settings) that the Storybook UI uses, so a headless run tests what a
// reviewer sees. The a11y addon's annotations are listed by hand: calling
// setProjectAnnotations here stops addon-vitest from adding them itself, and
// without them axe never runs and `a11y: { test: "error" }` fails nothing.
const project = setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

beforeAll(project.beforeAll);
