import {
  parseFilterCursor,
  parseFilterDate,
  pickDocumentType,
} from "@/features/documents/filter-values";
import { describe, expect, it } from "vitest";

describe("parseFilterDate", () => {
  it("accepts a real YYYY-MM-DD date as UTC midnight", () => {
    expect(parseFilterDate("2026-09-26")?.toISOString()).toBe(
      "2026-09-26T00:00:00.000Z",
    );
  });

  it.each(["garbage", "2026-13-45", "2026-02-31", "26-09-2026", "", undefined])(
    "ignores %s",
    (value) => {
      expect(parseFilterDate(value)).toBeNull();
    },
  );
});

describe("parseFilterCursor", () => {
  it("accepts an ISO timestamp", () => {
    expect(parseFilterCursor("2026-09-26T10:00:00.000Z")?.getTime()).toBe(
      Date.UTC(2026, 8, 26, 10),
    );
  });

  it("ignores a malformed cursor", () => {
    expect(parseFilterCursor("not-a-date")).toBeNull();
    expect(parseFilterCursor(undefined)).toBeNull();
  });
});

describe("pickDocumentType", () => {
  const types = ["COVER_LETTER", "IMPROVED_RESUME"] as const;

  it("keeps a known type", () => {
    expect(pickDocumentType("COVER_LETTER", types)).toBe("COVER_LETTER");
  });

  it("drops an unknown type instead of querying with it", () => {
    expect(pickDocumentType("garbage", types)).toBeNull();
  });
});
