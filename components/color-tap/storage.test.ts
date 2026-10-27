import { afterEach, describe, expect, it, vi } from "vitest";
import type { Saved } from "@/lib/color-tap/game";
import type { LevelId } from "@/lib/color-tap/types";
import {
  CURRENT,
  WORKS,
  claimGame,
  loadCoachSeen,
  loadCurrent,
  loadSettings,
  loadWork,
  loadWorks,
  ownsGame,
  saveCoachSeen,
  saveCurrent,
  saveSettings,
  saveWork,
  workKey,
  worksFrom,
  type Work,
} from "./storage";

// What Color Tap remembers survives anything localStorage can hand back: nothing, junk, another
// version's leftovers, or storage that throws. Settings default on, each painting is kept beside
// the others under its own picture and level, a work filed under the wrong key or with a camera
// that can't be put back is dropped on its own, the open painting must name a real level, the
// owner protocol matches Sudoku's and Solitaire's, and asking for persistent storage never throws.

/**
 * A localStorage stub; "throw" makes every access throw (blocked storage), "full" lets reads through
 * but makes every write throw (a full quota, or an old Safari private window).
 */
function storage(mode: "ok" | "full" | "throw") {
  const store = new Map<string, string>();
  const guard = () => {
    if (mode === "throw") throw new Error("blocked");
  };
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (guard(), store.get(k) ?? null),
    setItem: (k: string, v: string) => {
      guard();
      if (mode === "full") throw new Error("QuotaExceededError");
      store.set(k, v);
    },
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

/** A save as game.ts writes one; storage only looks at its picture and level. */
function saved(picture: string, level: LevelId): Saved {
  return { v: 1, picture, level, puzzle: "p-1", order: "AQACAA==", auto: 0, selected: 2, magnifiers: 3, elapsed: 61_000 };
}

function work(picture: string, level: LevelId, at: number): Work {
  return { saved: saved(picture, level), camera: { scale: 2.5, x: -120, y: 40 }, at };
}

const json = (value: unknown) => JSON.stringify(value);
const stored = (store: Map<string, string>, key: string): unknown => JSON.parse(store.get(key)!);

describe("settings", () => {
  const ON = { sound: true, haptics: true, autoAdvance: true };

  it("are all on with nothing stored, junk stored or storage blocked", () => {
    storage("ok");
    expect(loadSettings()).toEqual(ON);
    const store = storage("ok");
    for (const junk of ["{", "null", "7", '"off"', "[false]", "{}"]) {
      store.set("color-tap:settings", junk);
      expect(loadSettings(), junk).toEqual(ON);
    }
    storage("throw");
    expect(loadSettings()).toEqual(ON);
  });

  it("round-trip, each switch on its own", () => {
    storage("ok");
    for (const settings of [
      { sound: false, haptics: true, autoAdvance: true },
      { sound: true, haptics: false, autoAdvance: true },
      { sound: true, haptics: true, autoAdvance: false },
      { sound: false, haptics: false, autoAdvance: false },
    ]) {
      saveSettings(settings);
      expect(loadSettings()).toEqual(settings);
    }
  });

  it("turn off only for a stored false", () => {
    const store = storage("ok");
    store.set("color-tap:settings", JSON.stringify({ sound: 0, haptics: "false", autoAdvance: null }));
    expect(loadSettings()).toEqual(ON);
  });

  it("save without throwing when storage is blocked", () => {
    storage("throw");
    expect(() => saveSettings({ sound: false, haptics: false, autoAdvance: false })).not.toThrow();
  });
});

describe("the paintings", () => {
  it("are filed by picture and level", () => {
    expect(workKey("butterfly", "easy")).toBe("butterfly:easy");
    expect(workKey("night-sky", "master")).toBe("night-sky:master");
  });

  it("are none with nothing stored, junk stored or storage blocked", () => {
    storage("ok");
    expect(loadWorks()).toEqual({});
    expect(loadWork("butterfly", "easy")).toBeNull();
    const store = storage("ok");
    for (const junk of ["{", "null", "3", '"works"', "[]", JSON.stringify([work("butterfly", "easy", 1)])]) {
      store.set(WORKS, junk);
      expect(loadWorks(), junk).toEqual({});
    }
    storage("throw");
    expect(loadWorks()).toEqual({});
    expect(loadWork("butterfly", "easy")).toBeNull();
  });

  it("round-trip a work, its camera and its time", () => {
    storage("ok");
    const butterfly = work("butterfly", "hard", 1_700_000_000_000);
    saveWork(butterfly);
    expect(loadWork("butterfly", "hard")).toEqual(butterfly);
    expect(loadWorks()).toEqual({ "butterfly:hard": butterfly });
    expect(loadWork("butterfly", "easy")).toBeNull();
    expect(loadWork("rose", "hard")).toBeNull();
  });

  it("round-trip a work with no camera (fit the picture)", () => {
    storage("ok");
    const fitted: Work = { ...work("rose", "medium", 5), camera: null };
    saveWork(fitted);
    expect(loadWork("rose", "medium")).toEqual(fitted);
  });

  it("keep every other painting when one is saved, and replace that one", () => {
    const store = storage("ok");
    saveWork(work("butterfly", "easy", 1));
    saveWork(work("butterfly", "master", 2));
    saveWork(work("rose", "easy", 3));
    saveWork(work("butterfly", "easy", 4));
    expect(Object.keys(loadWorks()).sort()).toEqual(["butterfly:easy", "butterfly:master", "rose:easy"]);
    expect(loadWork("butterfly", "easy")!.at).toBe(4);
    expect(loadWork("butterfly", "master")!.at).toBe(2);
    expect(loadWork("rose", "easy")!.at).toBe(3);
    expect(Object.keys(stored(store, WORKS) as object)).toHaveLength(3);
  });

  it("store only a work's three fields", () => {
    const store = storage("ok");
    saveWork({ ...work("butterfly", "easy", 1), extra: "dropped" } as Work);
    expect(stored(store, WORKS)).toEqual({ "butterfly:easy": work("butterfly", "easy", 1) });
  });

  it("save without throwing when storage is blocked", () => {
    storage("throw");
    expect(() => saveWork(work("butterfly", "easy", 1))).not.toThrow();
    expect(loadWorks()).toEqual({});
  });

  it("keep what was stored, unharmed, when storage is full", () => {
    const store = storage("full");
    const before = json({ "butterfly:easy": work("butterfly", "easy", 1) });
    store.set(WORKS, before);
    expect(() => saveWork(work("rose", "easy", 2))).not.toThrow();
    expect(store.get(WORKS)).toBe(before);
    expect(loadWorks()).toEqual({ "butterfly:easy": work("butterfly", "easy", 1) });
  });

  it("keep a picture whose name holds a colon apart from every other (a level id never does)", () => {
    storage("ok");
    expect(workKey("night:sky", "easy")).not.toBe(workKey("night", "easy"));
    expect(workKey("a:easy", "hard")).not.toBe(workKey("a", "easy"));
    saveWork(work("night:sky", "easy", 1));
    saveWork(work("night", "easy", 2));
    expect(loadWork("night:sky", "easy")).toEqual(work("night:sky", "easy", 1));
    expect(loadWork("night", "easy")).toEqual(work("night", "easy", 2));
  });

  it("hand back fresh copies, so changing one changes nothing stored", () => {
    storage("ok");
    saveWork(work("butterfly", "easy", 1));
    const loaded = loadWork("butterfly", "easy")!;
    loaded.camera!.scale = 99;
    loaded.saved.elapsed = 0;
    expect(loadWork("butterfly", "easy")).toEqual(work("butterfly", "easy", 1));
  });
});

describe("worksFrom (a stored or storage-event value)", () => {
  const good = work("butterfly", "easy", 10);
  /** One raw value holding `entry` under `key` beside a good work, as JSON text. */
  const beside = (key: string, entry: string) => `{"butterfly:easy":${json(good)},${json(key)}:${entry}}`;

  it("reads nothing (another tab cleared it) and junk as no works", () => {
    for (const raw of [null, "", "{", "null", "true", "12", '"x"', "[]"]) expect(worksFrom(raw), String(raw)).toEqual({});
  });

  it("reads back what saveWork wrote", () => {
    const store = storage("ok");
    saveWork(good);
    saveWork(work("rose", "expert", 11));
    expect(worksFrom(store.get(WORKS)!)).toEqual({ "butterfly:easy": good, "rose:expert": work("rose", "expert", 11) });
  });

  it("drops a work filed under another picture's or level's key", () => {
    expect(worksFrom(beside("rose:easy", json(good)))).toEqual({ "butterfly:easy": good });
    expect(worksFrom(beside("butterfly:hard", json(good)))).toEqual({ "butterfly:easy": good });
    expect(worksFrom(beside("butterfly", json(good)))).toEqual({ "butterfly:easy": good });
  });

  it("drops a work whose save names no picture or no real level", () => {
    const unnamed = { ...good, saved: { ...good.saved, picture: "" } };
    expect(worksFrom(beside(":easy", json(unnamed)))).toEqual({ "butterfly:easy": good });
    const numbered = { ...good, saved: { ...good.saved, picture: 7 } };
    expect(worksFrom(beside("7:easy", json(numbered)))).toEqual({ "butterfly:easy": good });
    const legendary = { ...good, saved: { ...good.saved, level: "legendary" } };
    expect(worksFrom(beside("butterfly:legendary", json(legendary)))).toEqual({ "butterfly:easy": good });
    const shouting = { ...good, saved: { ...good.saved, level: "Easy" } };
    expect(worksFrom(beside("butterfly:Easy", json(shouting)))).toEqual({ "butterfly:easy": good });
  });

  it("drops a work with a camera that can't be put back", () => {
    const key = "rose:easy";
    const rose = work("rose", "easy", 20);
    for (const camera of [
      '{"scale":0,"x":0,"y":0}',
      '{"scale":-1,"x":0,"y":0}',
      '{"scale":1e999,"x":0,"y":0}',
      '{"scale":1,"x":1e999,"y":0}',
      '{"scale":1,"x":0,"y":-1e999}',
      '{"scale":"2","x":0,"y":0}',
      '{"scale":1,"x":0}',
      '{"x":0,"y":0}',
      '{"scale":1,"x":null,"y":0}',
      "[1,0,0]",
      "2",
      '"fit"',
    ]) {
      const entry = `{"saved":${json(rose.saved)},"camera":${camera},"at":20}`;
      expect(worksFrom(beside(key, entry)), camera).toEqual({ "butterfly:easy": good });
    }
  });

  it("drops a work with no camera field at all (null is how a work says fit)", () => {
    const { camera: _camera, ...cameraless } = work("rose", "easy", 20);
    expect(worksFrom(beside("rose:easy", json(cameraless)))).toEqual({ "butterfly:easy": good });
  });

  it("keeps only a camera's three numbers", () => {
    const entry = `{"saved":${json(good.saved)},"camera":{"scale":3,"x":1,"y":2,"spin":9},"at":10}`;
    expect(worksFrom(`{"butterfly:easy":${entry}}`)).toEqual({ "butterfly:easy": { ...good, camera: { scale: 3, x: 1, y: 2 } } });
  });

  it("drops a work with no save, a save that isn't an object, or no finite time", () => {
    const rose = work("rose", "easy", 20);
    const { saved: _saved, ...unsaved } = rose;
    const { at: _at, ...untimed } = rose;
    for (const entry of [
      json(unsaved),
      json({ ...rose, saved: null }),
      json({ ...rose, saved: "rose:easy" }),
      json({ ...rose, saved: [rose.saved] }),
      json(untimed),
      json({ ...rose, at: "yesterday" }),
      json({ ...rose, at: null }),
      `{"saved":${json(rose.saved)},"camera":null,"at":1e999}`,
      "null",
      "5",
      '"rose"',
      json([rose]),
    ]) {
      expect(worksFrom(beside("rose:easy", entry)), entry).toEqual({ "butterfly:easy": good });
    }
  });

  it("drops a __proto__ entry without it reaching the works' prototype", () => {
    const works = worksFrom(`{"__proto__":${json(good)},"butterfly:easy":${json(good)}}`);
    expect(works).toEqual({ "butterfly:easy": good });
    expect(Object.getPrototypeOf(works)).toBe(Object.prototype);
  });

  it("keeps an object-shaped save whatever it holds (parseSaved checks it on resume)", () => {
    const sparse = { saved: { picture: "rose", level: "easy" }, camera: null, at: 1 };
    expect(worksFrom(json({ "rose:easy": sparse }))).toEqual({ "rose:easy": sparse });
  });

  it("lets saveWork clean junk out of the stored works", () => {
    const store = storage("ok");
    store.set(WORKS, beside("rose:easy", '"junk"'));
    saveWork(work("tulip", "hard", 30));
    expect(stored(store, WORKS)).toEqual({ "butterfly:easy": good, "tulip:hard": work("tulip", "hard", 30) });
  });
});

describe("the painting that is open", () => {
  it("round-trips", () => {
    storage("ok");
    saveCurrent({ picture: "butterfly", level: "expert" });
    expect(loadCurrent()).toEqual({ picture: "butterfly", level: "expert" });
    saveCurrent({ picture: "rose", level: "easy" });
    expect(loadCurrent()).toEqual({ picture: "rose", level: "easy" });
  });

  it("is null with nothing stored, junk stored or storage blocked", () => {
    storage("ok");
    expect(loadCurrent()).toBeNull();
    const store = storage("ok");
    for (const junk of [
      "{",
      "null",
      '"butterfly:easy"',
      "[]",
      json({}),
      json({ picture: "butterfly" }),
      json({ level: "easy" }),
      json({ picture: "", level: "easy" }),
      json({ picture: 3, level: "easy" }),
      json({ picture: "butterfly", level: "legendary" }),
      json({ picture: "butterfly", level: "EASY" }),
    ]) {
      store.set(CURRENT, junk);
      expect(loadCurrent(), junk).toBeNull();
    }
    storage("throw");
    expect(loadCurrent()).toBeNull();
    expect(() => saveCurrent({ picture: "butterfly", level: "easy" })).not.toThrow();
  });

  it("reads back only its picture and level", () => {
    const store = storage("ok");
    store.set(CURRENT, json({ picture: "rose", level: "hard", camera: { scale: 1, x: 0, y: 0 } }));
    expect(loadCurrent()).toEqual({ picture: "rose", level: "hard" });
  });
});

describe("the owner tab", () => {
  it("is every tab until one claims the game", () => {
    storage("ok");
    expect(ownsGame("a")).toBe(true);
    expect(ownsGame("b")).toBe(true);
  });

  it("is the tab that claimed it last", () => {
    storage("ok");
    claimGame("a");
    expect(ownsGame("a")).toBe(true);
    expect(ownsGame("b")).toBe(false);
    claimGame("b");
    expect(ownsGame("a")).toBe(false);
    expect(ownsGame("b")).toBe(true);
  });

  it("is every tab when storage is blocked", () => {
    storage("throw");
    expect(() => claimGame("a")).not.toThrow();
    expect(ownsGame("a")).toBe(true);
    expect(ownsGame("b")).toBe(true);
  });
});

describe("a full storage", () => {
  it("refuses every save without throwing and keeps what it already held", () => {
    const store = storage("full");
    store.set("color-tap:settings", json({ sound: false, haptics: true, autoAdvance: true }));
    store.set(CURRENT, json({ picture: "rose", level: "hard" }));
    store.set("color-tap:owner", json("a"));
    expect(() => saveSettings({ sound: true, haptics: false, autoAdvance: false })).not.toThrow();
    expect(() => saveCurrent({ picture: "butterfly", level: "easy" })).not.toThrow();
    expect(() => claimGame("b")).not.toThrow();
    expect(() => saveCoachSeen()).not.toThrow();
    expect(loadSettings()).toEqual({ sound: false, haptics: true, autoAdvance: true });
    expect(loadCurrent()).toEqual({ picture: "rose", level: "hard" });
    expect(ownsGame("a")).toBe(true);
    expect(ownsGame("b")).toBe(false);
    expect(loadCoachSeen()).toBe(false);
  });
});

describe("the coach mark", () => {
  it("has not been seen with nothing stored, junk stored or storage blocked", () => {
    storage("ok");
    expect(loadCoachSeen()).toBe(false);
    const store = storage("ok");
    for (const junk of ["{", "null", "1", '"true"', "{}", "[true]"]) {
      store.set("color-tap:coach", junk);
      expect(loadCoachSeen(), junk).toBe(false);
    }
    storage("throw");
    expect(loadCoachSeen()).toBe(false);
    expect(() => saveCoachSeen()).not.toThrow();
  });

  it("stays seen once dismissed", () => {
    storage("ok");
    saveCoachSeen();
    expect(loadCoachSeen()).toBe(true);
  });
});

describe("persistent storage", () => {
  // The module asks once per page load, so each test loads a fresh copy of it.
  const fresh = async () => {
    vi.resetModules();
    return (await import("./storage")).persistStorage;
  };

  it("asks the browser once", async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal("navigator", { storage: { persist } });
    const persistStorage = await fresh();
    persistStorage();
    persistStorage();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("never throws without navigator, without navigator.storage or without persist", async () => {
    for (const navigator of [undefined, {}, { storage: undefined }, { storage: {} }, { storage: { persist: "yes" } }]) {
      vi.stubGlobal("navigator", navigator);
      const persistStorage = await fresh();
      expect(() => persistStorage(), JSON.stringify(navigator)).not.toThrow();
    }
  });

  it("never throws, nor leaves a rejection unhandled, when the browser refuses", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      vi.stubGlobal("navigator", { storage: { persist: () => Promise.reject(new Error("refused")) } });
      let persistStorage = await fresh();
      expect(() => persistStorage()).not.toThrow();
      vi.stubGlobal("navigator", {
        storage: {
          persist: () => {
            throw new Error("not here");
          },
        },
      });
      persistStorage = await fresh();
      expect(() => persistStorage()).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
