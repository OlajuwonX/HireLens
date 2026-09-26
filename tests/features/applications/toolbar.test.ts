import { applicationFiltersSchema } from "@/features/applications/schemas/application.schema";
import {
  hasActiveFilters,
  resolveJobsEmptyState,
  totalSavedCount,
} from "@/features/applications/toolbar";
import { describe, expect, it } from "vitest";

describe("totalSavedCount", () => {
  it("sums every status except archived", () => {
    expect(
      totalSavedCount({ PENDING: 2, ACCEPTED: 1, REJECTED: 3, ARCHIVED: 9 }),
    ).toBe(6);
  });

  it("is zero for no counts", () => {
    expect(totalSavedCount({})).toBe(0);
  });
});

describe("hasActiveFilters", () => {
  const base = applicationFiltersSchema.parse({});

  it("is false for the defaults", () => {
    expect(hasActiveFilters(base)).toBe(false);
  });

  it("is true for another status tab or a date range", () => {
    expect(hasActiveFilters({ ...base, tab: "REJECTED" })).toBe(true);
    expect(hasActiveFilters({ ...base, from: "2026-09-01" })).toBe(true);
    expect(hasActiveFilters({ ...base, to: "2026-09-30" })).toBe(true);
  });

  it("ignores sort, which never hides anything", () => {
    expect(hasActiveFilters({ ...base, sort: "company_asc" })).toBe(false);
  });
});

describe("resolveJobsEmptyState", () => {
  it("says nothing is saved only when the user has nothing at all", () => {
    expect(resolveJobsEmptyState({ counts: {} })).toBe("none-saved");
    expect(resolveJobsEmptyState({ counts: { PENDING: 0, ARCHIVED: 0 } })).toBe(
      "none-saved",
    );
  });

  it("says filtered when saved jobs exist but the view hides them", () => {
    expect(resolveJobsEmptyState({ counts: { PENDING: 0, ACCEPTED: 4 } })).toBe(
      "filtered",
    );
  });

  it("says filtered when only archived jobs exist", () => {
    expect(resolveJobsEmptyState({ counts: { ARCHIVED: 2 } })).toBe("filtered");
  });
});

describe("the removed search term", () => {
  it("is not part of the filters schema and is dropped from stale URLs", () => {
    const parsed = applicationFiltersSchema.parse({ q: "stale bookmark" });

    expect("q" in parsed).toBe(false);
  });

  it("does not break parsing when a stale q comes with real filters", () => {
    const parsed = applicationFiltersSchema.safeParse({
      q: "old",
      tab: "REJECTED",
      from: "2026-09-01",
    });

    expect(parsed.success).toBe(true);
  });
});
