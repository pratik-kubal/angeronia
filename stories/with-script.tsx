import * as React from "react";
import type { Decorator } from "@storybook/nextjs-vite";

/**
 * Stories render the finished, no-script page: `<html>` has no `js` class, so
 * motion and the live spine stay off (DESIGN-RULES.md §8). A story about
 * behaviour (the tabs, the line drawn live) adds this decorator, which puts
 * `js` on `<html>` before the story's own effects run, as the layout's
 * one-line script does in production, and takes it off again afterwards so
 * the next story starts clean.
 */
function Scripted({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");
    return () => html.classList.remove("js");
  }, []);
  return <>{children}</>;
}

export const withScript: Decorator = (Story) => (
  <Scripted>
    <Story />
  </Scripted>
);
