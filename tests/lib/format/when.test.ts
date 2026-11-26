import { describe, expect, it } from "vitest";
import { plural } from "@/lib/format/plural";
import { daysBetween, formatDate, formatDateTime, formatDay, formatWhen } from "@/lib/format/when";

const now = new Date("2026-11-26T12:00:00Z");

describe("formatWhen", () => {
  it.each([
    ["2026-11-26T11:59:30Z", "just now"],
    ["2026-11-26T11:48:00Z", "12 min ago"],
    ["2026-11-26T09:00:00Z", "3 h ago"],
    ["2026-11-25T08:00:00Z", "yesterday"],
    ["2026-11-23T16:05:00Z", "Mon 16:05"],
    ["2026-11-12T09:00:00Z", "12 Nov"],
    ["2025-11-12T09:00:00Z", "12 Nov 2025"],
  ])("formats %s as %s", (iso, expected) => {
    expect(formatWhen(new Date(iso), now)).toBe(expected);
  });

  it("shows an absolute date for future times", () => {
    expect(formatWhen(new Date("2026-11-30T09:00:00Z"), now)).toBe("30 Nov");
  });
});

describe("absolute formats", () => {
  it("leaves out the year only for the current year", () => {
    expect(formatDate(new Date("2026-01-03T00:00:00Z"), now)).toBe("3 Jan");
    expect(formatDate(new Date("2027-01-03T00:00:00Z"), now)).toBe("3 Jan 2027");
    expect(formatDateTime(new Date("2026-11-20T07:05:00Z"), now)).toBe("20 Nov, 07:05");
  });

  it("names nearby days in words", () => {
    expect(formatDay(new Date("2026-11-26T20:00:00Z"), now)).toBe("today");
    expect(formatDay(new Date("2026-11-27T08:00:00Z"), now)).toBe("tomorrow");
    expect(formatDay(new Date("2026-11-25T08:00:00Z"), now)).toBe("yesterday");
    expect(formatDay(new Date("2026-11-29T08:00:00Z"), now)).toBe("Sunday");
    expect(formatDay(new Date("2026-11-22T08:00:00Z"), now)).toBe("last Sunday");
    expect(daysBetween(new Date("2026-12-26T08:00:00Z"), now)).toBe(30);
  });
});

describe("plural", () => {
  it("uses the singular only for one", () => {
    expect(plural(1, "role", "roles")).toBe("1 role");
    expect(plural(0, "role", "roles")).toBe("0 roles");
    expect(plural(21, "role", "roles")).toBe("21 roles");
  });
});
