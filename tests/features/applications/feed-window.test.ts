import { APPLICATION_PAGE_SIZE } from "@/features/applications/constants";
import { shiftOffset } from "@/features/applications/feed-window";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("shiftOffset", () => {
  it("moves the window back when a row leaves", () => {
    expect(shiftOffset(24, -1)).toBe(23);
  });

  it("moves it forward again when a removal is rolled back", () => {
    expect(shiftOffset(23, 1)).toBe(24);
  });

  it("never goes negative", () => {
    expect(shiftOffset(0, -1)).toBe(0);
    expect(shiftOffset(1, -5)).toBe(0);
  });

  it("stays null once the list is exhausted", () => {
    expect(shiftOffset(null, -1)).toBeNull();
    expect(shiftOffset(null, 1)).toBeNull();
  });
});

function simulate({
  total,
  compensate,
}: {
  total: number;
  compensate: boolean;
}) {
  const server = Array.from({ length: total }, (_, index) => `job-${index}`);

  const firstPage = server.slice(0, APPLICATION_PAGE_SIZE);
  let offset: number | null =
    server.length > APPLICATION_PAGE_SIZE ? APPLICATION_PAGE_SIZE : null;
  const loaded = [...firstPage];

  const removedId = firstPage[5];
  server.splice(server.indexOf(removedId), 1);
  loaded.splice(loaded.indexOf(removedId), 1);

  if (compensate) {
    offset = shiftOffset(offset, -1);
  }

  while (offset !== null) {
    const fetched = server.slice(offset, offset + APPLICATION_PAGE_SIZE + 1);
    const pageRows = fetched.slice(0, APPLICATION_PAGE_SIZE);
    const seen = new Set(loaded);

    loaded.push(...pageRows.filter((id) => !seen.has(id)));

    offset =
      fetched.length > APPLICATION_PAGE_SIZE
        ? offset + APPLICATION_PAGE_SIZE
        : null;
  }

  return {
    missing: server.filter((id) => !loaded.includes(id)),
    duplicates: loaded.length - new Set(loaded).size,
  };
}

describe("the offset compensation prevents the skip", () => {
  it("skips a row without compensation", () => {
    const { missing } = simulate({ total: 30, compensate: false });

    expect(missing).toEqual(["job-24"]);
  });

  it("loses nothing with compensation", () => {
    const { missing, duplicates } = simulate({ total: 30, compensate: true });

    expect(missing).toEqual([]);
    expect(duplicates).toBe(0);
  });

  it("holds across a range of list sizes", () => {
    for (const total of [25, 30, 40, 48, 49, 60]) {
      const { missing, duplicates } = simulate({ total, compensate: true });

      expect({ total, missing, duplicates }).toEqual({
        total,
        missing: [],
        duplicates: 0,
      });
    }
  });

  it("is a no-op when there is no next page", () => {
    const { missing, duplicates } = simulate({ total: 20, compensate: true });

    expect(missing).toEqual([]);
    expect(duplicates).toBe(0);
  });
});

describe("the card reports leaving and returning", () => {
  const card = readFileSync(
    "features/applications/components/saved-job-card.tsx",
    "utf8",
  );
  const feed = readFileSync(
    "features/applications/components/saved-job-feed.tsx",
    "utf8",
  );

  it("signals on both archive and delete", () => {
    expect(card.match(/onLeave\?\.\(\)/g)).toHaveLength(2);
  });

  it("signals a return on both rollbacks", () => {
    expect(card.match(/onReturn\?\.\(\)/g)).toHaveLength(2);
  });

  it("reports leaving only after the optimistic hide", () => {
    const hide = card.indexOf("setRemoved(true)");
    const leave = card.indexOf("onLeave?.()", hide);

    expect(leave).toBeGreaterThan(hide);
  });

  it("is wired to the feed window", () => {
    expect(feed).toContain("onLeave={() => shiftWindow(-1)}");
    expect(feed).toContain("onReturn={() => shiftWindow(1)}");
    expect(feed).toContain("shiftOffset(current, delta)");
  });
});
