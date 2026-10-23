import type { Skin } from "../types";
import { AuroraOverlay } from "./overlay";

// Aurora keeps the base look and voice (sudoku.css, AURORA_VOICE); it only adds an Overlay for its
// secrets' surprises and the arrival.
export const auroraSkin: Skin = { Overlay: AuroraOverlay };
