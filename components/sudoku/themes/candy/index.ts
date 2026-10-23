import type { Skin } from "../types";
import { CandyOverlay } from "./overlay";
import { CANDY_VOICE } from "./voice";

/** Candy: no Backdrop (the counter is plain), its surprises over the game, and soft pops. */
export const candySkin: Skin = { Overlay: CandyOverlay, voice: CANDY_VOICE };
