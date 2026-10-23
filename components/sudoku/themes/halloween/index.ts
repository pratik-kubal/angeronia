// Halloween's skin: the pumpkin patch behind the game, its surprises over it, and its voice.
import type { Skin } from "../types";
import { HalloweenBackdrop } from "./backdrop";
import { HalloweenOverlay } from "./overlay";
import { halloweenVoice } from "./voice";

export const halloweenSkin: Skin = { Backdrop: HalloweenBackdrop, Overlay: HalloweenOverlay, voice: halloweenVoice };
