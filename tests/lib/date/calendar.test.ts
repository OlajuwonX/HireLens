import {
  addMonths,
  buildMonth,
  formatRangeLabel,
  fromIsoDate,
  isBefore,
  isSameDay,
  isWithin,
  toIsoDate,
} from "@/lib/date/calendar";
import { describe, expect, it } from "vitest";

describe("toIsoDate", () => {
  it("uses local parts, not UTC", () => {
    expect(toIsoDate(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("pads single digits", () => {
    expect(toIsoDate(new Date(2026, 8, 5))).toBe("2026-09-05");
  });

  it("round-trips through fromIsoDate", () => {
    const iso = "2026-02-28";

    expect(toIsoDate(fromIsoDate(iso) as Date)).toBe(iso);
  });
});

describe("fromIsoDate", () => {
  it("rejects anything that is not an ISO date", () => {
    for (const value of ["", null, undefined, "2026-1-1", "not a date"]) {
      expect(fromIsoDate(value)).toBeNull();
    }
  });

  it("does not shift across a timezone boundary", () => {
    const parsed = fromIsoDate("2026-03-01") as Date;

    expect(parsed.getDate()).toBe(1);
    expect(parsed.getMonth()).toBe(2);
  });
});

describe("buildMonth", () => {
  const grid = buildMonth(new Date(2026, 1, 1));

  it("always returns six weeks", () => {
    expect(grid).toHaveLength(42);
  });

  it("starts on a Monday", () => {
    expect(grid[0].date.getDay()).toBe(1);
  });

  it("marks days outside the month", () => {
    expect(grid.filter((day) => day.inMonth)).toHaveLength(28);
  });

  it("runs consecutively with no gaps", () => {
    for (let index = 1; index < grid.length; index += 1) {
      const previous = grid[index - 1].date.getTime();
      const current = grid[index].date.getTime();

      expect(Math.round((current - previous) / 86_400_000)).toBe(1);
    }
  });

  it("handles a month starting on a Sunday", () => {
    const march = buildMonth(new Date(2026, 2, 1));

    expect(march[0].date.getDay()).toBe(1);
    expect(march.some((day) => day.iso === "2026-03-01")).toBe(true);
  });
});

describe("addMonths", () => {
  it("rolls over the year backwards", () => {
    const result = addMonths(new Date(2026, 0, 15), -1);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11);
  });

  it("rolls over the year forwards", () => {
    expect(addMonths(new Date(2026, 11, 1), 1).getFullYear()).toBe(2027);
  });
});

describe("range predicates", () => {
  const from = new Date(2026, 0, 10);
  const to = new Date(2026, 0, 20);

  it("treats the same calendar day as equal", () => {
    expect(isSameDay(new Date(2026, 0, 10, 23), from)).toBe(true);
  });

  it("returns false when either side is missing", () => {
    expect(isSameDay(null, from)).toBe(false);
    expect(isWithin(new Date(2026, 0, 15), null, to)).toBe(false);
  });

  it("counts only days strictly inside the range", () => {
    expect(isWithin(new Date(2026, 0, 15), from, to)).toBe(true);
    expect(isWithin(from, from, to)).toBe(false);
    expect(isWithin(to, from, to)).toBe(false);
  });

  it("compares by day, ignoring the clock", () => {
    expect(isBefore(new Date(2026, 0, 9, 23), from)).toBe(true);
    expect(isBefore(new Date(2026, 0, 10, 1), from)).toBe(false);
  });
});

describe("formatRangeLabel", () => {
  it("is empty when nothing is chosen", () => {
    expect(formatRangeLabel(null, null)).toBe("");
  });

  it("describes an open start and an open end", () => {
    expect(formatRangeLabel("2026-01-10", null)).toContain("From");
    expect(formatRangeLabel(null, "2026-01-20")).toContain("Until");
  });

  it("joins a closed range", () => {
    expect(formatRangeLabel("2026-01-10", "2026-01-20")).toContain(" - ");
  });
});
