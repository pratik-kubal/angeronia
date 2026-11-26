"use client";

import * as React from "react";
import { startSpine } from "./spine-engine";

/**
 * The spine, live (ADR-025, ADR-027, ADR-031). Renders nothing: once the page
 * has hydrated it draws the line through every `Band`, breaks it around
 * whatever crosses the axis, pulls crossing statements open low on the screen,
 * holds the belief, drifts the photographs and reveals blocks once. All of it
 * is undone on unmount.
 *
 * Mounted once per studio page, after its last band. The server renders the
 * finished page and this only moves it, so there is nothing to mismatch on
 * hydration. Without `html.js` (no script; a story without the `js`
 * decorator) it does nothing at all.
 */
export function Spine() {
  React.useEffect(() => startSpine(), []);
  return null;
}
