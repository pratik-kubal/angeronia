import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEVELS } from "../lib/color-tap/levels";
import { PICTURES } from "../lib/color-tap/pictures";
import { decodePuzzle } from "../lib/color-tap/puzzle";
import { PICTURES_DIR, PUZZLES_DIR, publicUrl, puzzleKey, puzzleProblems, scanPictures } from "./color-tap-images";

// Color Tap's committed puzzles (npm run color-tap:puzzles, DECISIONS.md ADR-022) against the
// photos in public/paint-by-numbers/: every photo has one fresh puzzle per level and nothing else
// is in the folder; each puzzle keeps the level's promises (puzzleProblems: areas big and wide
// enough, numbers inside them, every colour used, every border used once by each side); and each
// photo's levels form a ladder: more areas at every step, and a finished painting that gets closer
// to the photo (a hair of slack between neighbouring levels, since a photo is not obliged to be
// monotone, but Master always well under Easy). A stale puzzle fails here: run the script.

describe("Color Tap's puzzles", () => {
  const { sources, problems } = scanPictures(PICTURES_DIR, PICTURES.map((p) => p.src));

  it("can use every photo in the folder: each has letters or digits in its name, and its own name", () => {
    expect(problems).toEqual([]);
  });

  it("has a fresh puzzle for every photo at every level, and nothing stale beside them", () => {
    expect(PICTURES.map((p) => p.id)).toEqual(sources.map((s) => s.id));
    const expected = new Set<string>();
    for (const source of sources) {
      const picture = PICTURES.find((p) => p.id === source.id)!;
      const bytes = fs.readFileSync(source.file);
      expect(picture.levels.map((l) => l.level)).toEqual(LEVELS.map((l) => l.id));
      picture.levels.forEach((entry, i) => {
        expect(entry.key, `${source.id} ${entry.level} is stale`).toBe(puzzleKey(bytes, LEVELS[i]));
        expected.add(path.basename(entry.src));
        // Retired puzzles stay for the paintings begun on them, and still read.
        for (const { id } of entry.retired) {
          const name = path.basename(entry.src).replace(`.${entry.id}.json`, `.${id}.json`);
          expected.add(name);
          expect(decodePuzzle(JSON.parse(fs.readFileSync(path.join(PUZZLES_DIR, name), "utf8"))).id).toBe(id);
        }
      });
      expected.add(path.basename(picture.thumb));
      expect(picture.src).toBe(publicUrl(source.file));
    }
    expect(new Set(fs.readdirSync(PUZZLES_DIR).filter((name) => !name.startsWith(".")))).toEqual(expected);
  });

  for (const picture of PICTURES) {
    describe(picture.title, () => {
      it("climbs a ladder: more areas and a closer painting at every level", () => {
        for (let i = 1; i < picture.levels.length; i++) {
          expect(picture.levels[i].areas).toBeGreaterThan(picture.levels[i - 1].areas);
          expect(picture.levels[i].deltaE).toBeLessThanOrEqual(picture.levels[i - 1].deltaE + 0.002);
        }
        expect(picture.levels[picture.levels.length - 1].deltaE).toBeLessThan(picture.levels[0].deltaE * 0.95);
      });

      for (const entry of picture.levels) {
        it(`${entry.level}: keeps its level's promises`, () => {
          const level = LEVELS.find((l) => l.id === entry.level)!;
          const puzzle = decodePuzzle(JSON.parse(fs.readFileSync(path.join("public", ...entry.src.slice(1).split("/").map(decodeURIComponent)), "utf8")));
          expect(puzzle.picture).toBe(picture.id);
          expect(puzzleProblems(puzzle, entry, level)).toEqual([]);
        });
      }
    });
  }
});
