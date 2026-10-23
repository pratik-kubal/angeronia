import type { Skin } from "../types";
import { Backdrop } from "./backdrop";
import { Overlay } from "./overlay";
import { snowVoice } from "./voice";

export const snowSkin: Skin = { Backdrop, Overlay, voice: snowVoice };
