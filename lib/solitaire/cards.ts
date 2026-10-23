// The 52 cards. A card is a number: suit × 13 + rank − 1, so the deck sorts by suit and the
// suits run ♥ ♠ ♦ ♣, the order of the foundation slots (the colours alternate).

export type Suit = 0 | 1 | 2 | 3;
export type Card = number;

export const SUITS: readonly Suit[] = [0, 1, 2, 3];
export const CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

export const SUIT_NAMES = ["hearts", "spades", "diamonds", "clubs"] as const;
const SUIT_LETTERS = "HSDC";
const RANK_LETTERS = "A23456789TJQK";
const RANK_NAMES = ["", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
/** The corner index: A, 2 … 10, J, Q, K. */
const RANK_LABELS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const suitOf = (card: Card) => Math.floor(card / 13) as Suit;
/** 1 (Ace) to 13 (King). */
export const rankOf = (card: Card) => (card % 13) + 1;
export const isRed = (card: Card) => suitOf(card) % 2 === 0;
export const cardOf = (suit: Suit, rank: number): Card => suit * 13 + rank - 1;

/** "QS", "TH": the card's file name (public/solitaire/cards/v1/QS.webp). */
export const cardCode = (card: Card) => RANK_LETTERS[rankOf(card) - 1] + SUIT_LETTERS[suitOf(card)];
/** "Queen of spades". */
export const cardName = (card: Card) => `${RANK_NAMES[rankOf(card)]} of ${SUIT_NAMES[suitOf(card)]}`;
export const rankLabel = (card: Card) => RANK_LABELS[rankOf(card)];
