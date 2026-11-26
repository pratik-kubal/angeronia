import { shareImage } from "@/data/angeronia";
import { renderSocialCard, SOCIAL_CARD } from "./social-card";

/** The Twitter card image: the same card as the Open Graph image. */
export const alt = shareImage.alt;
export const size = SOCIAL_CARD;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderSocialCard();
}
