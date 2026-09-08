import { describe, expect, it } from "vitest";
import { getCycleDayIndex, getWeekStart } from "@/features/interviews/week";

describe("getWeekStart", () => {
  it("returns the UTC Monday midnight for any day in the week", () => {
    const monday = getWeekStart(new Date("2026-09-07T13:45:00Z"));
    expect(monday.toISOString()).toBe("2026-09-07T00:00:00.000Z");

    const wednesday = getWeekStart(new Date("2026-09-09T23:59:59Z"));
    expect(wednesday.toISOString()).toBe("2026-09-07T00:00:00.000Z");

    const sunday = getWeekStart(new Date("2026-09-13T06:00:00Z"));
    expect(sunday.toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("crosses month and year boundaries", () => {
    expect(getWeekStart(new Date("2027-01-01T09:00:00Z")).toISOString()).toBe(
      "2026-12-28T00:00:00.000Z",
    );
  });

  it("is idempotent", () => {
    const once = getWeekStart(new Date("2026-09-11T10:00:00Z"));
    expect(getWeekStart(once).toISOString()).toBe(once.toISOString());
  });
});

describe("getCycleDayIndex", () => {
  const weekStart = new Date("2026-09-07T00:00:00Z");

  it("is day 1 at the start of the week", () => {
    expect(getCycleDayIndex(weekStart, new Date("2026-09-07T00:00:00Z"))).toBe(
      1,
    );
    expect(getCycleDayIndex(weekStart, new Date("2026-09-07T23:59:59Z"))).toBe(
      1,
    );
  });

  it("advances one per calendar day", () => {
    expect(getCycleDayIndex(weekStart, new Date("2026-09-08T00:00:00Z"))).toBe(
      2,
    );
    expect(getCycleDayIndex(weekStart, new Date("2026-09-10T12:00:00Z"))).toBe(
      4,
    );
    expect(getCycleDayIndex(weekStart, new Date("2026-09-13T12:00:00Z"))).toBe(
      7,
    );
  });

  it("clamps below 1 and above 7", () => {
    expect(getCycleDayIndex(weekStart, new Date("2026-09-06T12:00:00Z"))).toBe(
      1,
    );
    expect(getCycleDayIndex(weekStart, new Date("2026-09-20T12:00:00Z"))).toBe(
      7,
    );
  });
});
