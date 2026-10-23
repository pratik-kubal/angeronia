// Every theme's skin, by id. A theme without a scene or voice of its own is an empty skin.

import type { ThemeId } from "@/lib/sudoku/themes";
import { auroraSkin } from "./aurora";
import { beachSkin } from "./beach";
import { blossomSkin } from "./blossom";
import { candySkin } from "./candy";
import { halloweenSkin } from "./halloween";
import { snowSkin } from "./snow";
import type { Skin } from "./types";

export type { Beat, Cue, SceneProps, Skin } from "./types";

export const SKINS: Record<ThemeId, Skin> = {
  aurora: auroraSkin,
  candy: candySkin,
  beach: beachSkin,
  halloween: halloweenSkin,
  snow: snowSkin,
  blossom: blossomSkin,
};
