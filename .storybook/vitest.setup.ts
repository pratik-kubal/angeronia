import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as projectAnnotations from "./preview";

// Runs the same preview config (theme CSS, colour-scheme decorator, a11y
// settings) that the Storybook UI uses, so a headless run tests what a
// reviewer sees.
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
