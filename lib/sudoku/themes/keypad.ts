// Keypad words: a phone's number keys carry letters (2 is ABC … 9 is WXYZ), so a word can be spelled
// on the game's own pad, one placed digit at a time ("gull" is 4-8-5-5). A secret hidden this way
// needs no keyboard, so it can be found on a phone like any other.

import type { SecretContext } from "./types";

const KEYS = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];

/** A word's digits on a phone keypad. */
export const keypad = (word: string): number[] => [...word.toLowerCase()].map((letter) => KEYS.findIndex((keys) => keys.includes(letter)));

/**
 * Whether the moment's placement finishes `digits`: the last digits placed by hand are these, in
 * order, the last one just now. A refused digit is a free try (skipped); a hint breaks the run.
 */
export function placedInOrder({ moment, recent }: SecretContext, digits: readonly number[]): boolean {
  if (moment?.kind !== "move" || moment.move?.kind !== "place" || !Array.isArray(recent)) return false;
  const run = recent.filter((m) => m?.kind !== "miss").slice(-digits.length);
  return (
    run.length === digits.length &&
    run[run.length - 1]?.seq === moment.move.seq &&
    run.every((m, k) => m?.kind === "place" && m.digit === digits[k])
  );
}

/** Whether the moment's placement finishes `word` spelled on the keypad (see placedInOrder). */
export const spells = (context: SecretContext, word: string): boolean => placedInOrder(context, keypad(word));
