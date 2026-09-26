import {
  RECENTS_MAX,
  addRecent,
  clearRecents,
  loadRecents,
  parseRecents,
  recentsStorageKey,
  saveRecent,
  type StorageLike,
} from "@/features/search/recents";
import { describe, expect, it } from "vitest";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };

  return { storage, data };
}

const brokenStorage: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("quota");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("addRecent", () => {
  it("puts the newest search first", () => {
    expect(addRecent(["react"], "cover letter")).toEqual([
      "cover letter",
      "react",
    ]);
  });

  it("de-duplicates case-insensitively and moves it to the front", () => {
    expect(addRecent(["react", "Cover Letter"], "cover letter")).toEqual([
      "cover letter",
      "react",
    ]);
  });

  it("ignores queries that are too short or blank", () => {
    expect(addRecent(["react"], "a")).toEqual(["react"]);
    expect(addRecent(["react"], "   ")).toEqual(["react"]);
  });

  it("caps the list", () => {
    let list: string[] = [];

    for (let index = 0; index < RECENTS_MAX + 5; index += 1) {
      list = addRecent(list, `query ${index}`);
    }

    expect(list).toHaveLength(RECENTS_MAX);
    expect(list[0]).toBe(`query ${RECENTS_MAX + 4}`);
  });

  it("normalises whitespace before storing", () => {
    expect(addRecent([], "  cover    letter ")).toEqual(["cover letter"]);
  });
});

describe("parseRecents", () => {
  it("returns an empty list for null, garbage or the wrong shape", () => {
    expect(parseRecents(null)).toEqual([]);
    expect(parseRecents("not json")).toEqual([]);
    expect(parseRecents('{"a":1}')).toEqual([]);
    expect(parseRecents("42")).toEqual([]);
  });

  it("drops non-strings, blanks and duplicates, and caps the size", () => {
    const raw = JSON.stringify([
      "react",
      42,
      null,
      "  ",
      "React",
      "node",
      ...Array.from({ length: 20 }, (_, index) => `item ${index}`),
    ]);
    const parsed = parseRecents(raw);

    expect(parsed.slice(0, 2)).toEqual(["react", "node"]);
    expect(parsed).toHaveLength(RECENTS_MAX);
  });
});

describe("recents storage", () => {
  it("saves and reloads searches for one user", () => {
    const { storage } = memoryStorage();

    saveRecent(storage, "user-1", "cover letter");
    saveRecent(storage, "user-1", "react");

    expect(loadRecents(storage, "user-1")).toEqual(["react", "cover letter"]);
  });

  it("keeps each user's history separate", () => {
    const { storage } = memoryStorage();

    saveRecent(storage, "user-1", "salary negotiation");

    expect(loadRecents(storage, "user-2")).toEqual([]);
    expect(recentsStorageKey("user-1")).not.toBe(recentsStorageKey("user-2"));
  });

  it("clears history", () => {
    const { storage, data } = memoryStorage();

    saveRecent(storage, "user-1", "react");
    clearRecents(storage, "user-1");

    expect(data.size).toBe(0);
    expect(loadRecents(storage, "user-1")).toEqual([]);
  });

  it("degrades to no history when storage is unavailable", () => {
    expect(loadRecents(null, "user-1")).toEqual([]);
    expect(saveRecent(null, "user-1", "react")).toEqual(["react"]);
    expect(() => clearRecents(null, "user-1")).not.toThrow();
  });

  it("never throws when storage throws", () => {
    expect(loadRecents(brokenStorage, "user-1")).toEqual([]);
    expect(() => saveRecent(brokenStorage, "user-1", "react")).not.toThrow();
    expect(() => clearRecents(brokenStorage, "user-1")).not.toThrow();
  });

  it("survives corrupted stored data", () => {
    const { storage } = memoryStorage({
      [recentsStorageKey("user-1")]: "{{{",
    });

    expect(loadRecents(storage, "user-1")).toEqual([]);
    expect(saveRecent(storage, "user-1", "react")).toEqual(["react"]);
  });
});
