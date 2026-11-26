import { shareImage } from "@/data/angeronia";
import { renderSocialCard, SOCIAL_CARD } from "./social-card";

/** The Open Graph image: the hero on the spine, 1200 × 630 (app/social-card.tsx). */
export const alt = shareImage.alt;
export const size = SOCIAL_CARD;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderSocialCard();
}
