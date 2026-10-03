import {
  clampActive,
  highlightSegments,
  isPaletteShortcut,
  moveActive,
} from "@/features/search/palette-state";
import { cacheKey, createResultCache } from "@/features/search/result-cache";
import { describe, expect, it } from "vitest";

const base = {
  key: "k",
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
};

describe("isPaletteShortcut", () => {
  it("accepts ctrl+k and cmd+k", () => {
    expect(isPaletteShortcut({ ...base, ctrlKey: true })).toBe(true);
    expect(isPaletteShortcut({ ...base, metaKey: true })).toBe(true);
  });

  it("is case insensitive", () => {
    expect(isPaletteShortcut({ ...base, key: "K", ctrlKey: true })).toBe(true);
  });

  it("ignores plain k and other keys", () => {
    expect(isPaletteShortcut(base)).toBe(false);
    expect(isPaletteShortcut({ ...base, key: "j", ctrlKey: true })).toBe(false);
  });

  it("ignores shift and alt variants", () => {
    expect(isPaletteShortcut({ ...base, ctrlKey: true, shiftKey: true })).toBe(false);
    expect(isPaletteShortcut({ ...base, ctrlKey: true, altKey: true })).toBe(false);
  });

  it("ignores key repeat and IME composition", () => {
    expect(isPaletteShortcut({ ...base, ctrlKey: true, repeat: true })).toBe(false);
    expect(isPaletteShortcut({ ...base, ctrlKey: true, isComposing: true })).toBe(false);
  });
});

describe("moveActive", () => {
  it("moves down and wraps to the top", () => {
    expect(moveActive(0, 3, 1)).toBe(1);
    expect(moveActive(2, 3, 1)).toBe(0);
  });

  it("moves up and wraps to the bottom", () => {
    expect(moveActive(1, 3, -1)).toBe(0);
    expect(moveActive(0, 3, -1)).toBe(2);
  });

  it("starts at the first or last item when nothing is active", () => {
    expect(moveActive(-1, 4, 1)).toBe(0);
    expect(moveActive(-1, 4, -1)).toBe(3);
  });

  it("returns -1 with no items", () => {
    expect(moveActive(0, 0, 1)).toBe(-1);
    expect(moveActive(3, 0, -1)).toBe(-1);
  });
});

describe("clampActive", () => {
  it("keeps the selection inside the list", () => {
    expect(clampActive(5, 3)).toBe(2);
    expect(clampActive(-1, 3)).toBe(0);
    expect(clampActive(1, 3)).toBe(1);
    expect(clampActive(2, 0)).toBe(-1);
  });
});

describe("highlightSegments", () => {
  it("splits text around every match without altering it", () => {
    const segments = highlightSegments("Software Engineer at Soft Co", "soft");

    expect(segments.map((segment) => segment.text).join("")).toBe(
      "Software Engineer at Soft Co",
    );
    expect(segments.filter((segment) => segment.match)).toHaveLength(2);
  });

  it("returns the whole text when nothing matches", () => {
    expect(highlightSegments("Designer", "xyz")).toEqual([
      { text: "Designer", match: false },
    ]);
  });

  it("returns the whole text for an empty query", () => {
    expect(highlightSegments("Designer", "  ")).toEqual([
      { text: "Designer", match: false },
    ]);
  });

  it("treats regex characters literally", () => {
    const segments = highlightSegments("a.b (c)", ".b (");

    expect(segments.filter((segment) => segment.match)).toHaveLength(1);
  });

  it("never injects markup: segments are plain strings", () => {
    const segments = highlightSegments("<b>x</b>", "<b>");

    expect(segments.every((segment) => typeof segment.text === "string")).toBe(true);
  });
});

describe("createResultCache", () => {
  it("returns a stored value until it expires", () => {
    let clock = 0;
    const cache = createResultCache<string>({
      ttlMs: 60_000,
      maxEntries: 5,
      now: () => clock,
    });

    cache.set("react", "results");
    clock = 59_999;
    expect(cache.get("react")).toBe("results");
    clock = 60_000;
    expect(cache.get("react")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("evicts the least recently used entry over the cap", () => {
    const cache = createResultCache<number>({ ttlMs: 60_000, maxEntries: 2 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("clears everything", () => {
    const cache = createResultCache<number>({ ttlMs: 1000, maxEntries: 5 });

    cache.set("a", 1);
    cache.clear();

    expect(cache.size()).toBe(0);
  });

  it("keys are case-insensitive", () => {
    expect(cacheKey("React")).toBe(cacheKey("react"));
  });
});
