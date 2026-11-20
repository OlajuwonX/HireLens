import { describe, expect, it } from "vitest";
import { feedVersion } from "@/features/discovery/feed-version";

const rows = (...ids: string[]) => ids.map((publicId) => ({ publicId }));

describe("feedVersion", () => {
  it("is stable for the same jobs", () => {
    expect(feedVersion(rows("a", "b"))).toBe(feedVersion(rows("a", "b")));
  });

  it("changes when new jobs arrive so the feed shows them", () => {
    expect(feedVersion(rows("new", "a", "b"))).not.toBe(feedVersion(rows("a", "b")));
    expect(feedVersion(rows("b", "a"))).not.toBe(feedVersion(rows("a", "b")));
  });

  it("handles an empty feed", () => {
    expect(feedVersion([])).toMatch(/^0-/);
  });
});
