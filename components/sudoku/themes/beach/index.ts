import type { Skin } from "../types";
import { BeachBackdrop } from "./backdrop";
import { BeachOverlay } from "./overlay";
import { BEACH_VOICE } from "./voice";

export const beachSkin: Skin = { Backdrop: BeachBackdrop, Overlay: BeachOverlay, voice: BEACH_VOICE };
