"use client";

import { memo, useCallback } from "react";
import { cardCode, isRed, rankLabel, suitOf, type Card } from "@/lib/solitaire/cards";

/** The faces' folder (scripts/build-solitaire-cards.ts): versioned, since the files are cached as immutable. */
export const CARD_DIR = "/solitaire/cards/v1";
export const faceUrl = (card: Card) => `${CARD_DIR}/${cardCode(card)}.webp`;

type Props = {
  card: Card;
  /** Its name when face up ("Face-down card" otherwise); null keeps it out of the accessibility tree (the stock). */
  label: string | null;
  /** A face-up card that can be played: focusable, Enter plays it. */
  playable: boolean;
  hint: "from" | "to" | undefined;
  register: (card: Card, el: HTMLDivElement | null) => void;
};

/**
 * One card: its face (always painted, so turning over never waits for a decode), a big corner
 * index for small cards, and the back on top, shown while data-up is "0". The animator owns the
 * element's transform, stacking and data-up; React never sets them.
 */
export const CardView = memo(function CardView({ card, label, playable, hint, register }: Props) {
  const ref = useCallback((el: HTMLDivElement | null) => register(card, el), [card, register]);
  return (
    <div
      ref={ref}
      className="sol-card"
      data-card={card}
      data-hint={hint}
      role={label === null ? undefined : playable ? "button" : "img"}
      aria-label={label ?? undefined}
      aria-hidden={label === null || undefined}
      tabIndex={playable ? 0 : -1}
    >
      <div className="sol-card-in">
        {/* eslint-disable-next-line @next/next/no-img-element -- 52 fixed, pre-sized faces; next/image would add nothing */}
        <img className="sol-face" src={faceUrl(card)} alt="" draggable={false} decoding="async" />
        <span className="sol-index" data-red={isRed(card) || undefined} aria-hidden>
          <b>{rankLabel(card)}</b>
          <svg viewBox="0 0 24 24">
            <use href={`#sol-suit-${suitOf(card)}`} />
          </svg>
        </span>
        <span className="sol-back" aria-hidden />
      </div>
    </div>
  );
});
