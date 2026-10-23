// Blossom's skin: the garden behind the game, its surprises over it, and its music-box voice.

import type { Skin } from "../types";
import { BlossomBackdrop } from "./backdrop";
import { BlossomOverlay } from "./overlay";
import { blossomVoice } from "./voice";

export const blossomSkin: Skin = {
  Backdrop: BlossomBackdrop,
  Overlay: BlossomOverlay,
  voice: blossomVoice,
};
