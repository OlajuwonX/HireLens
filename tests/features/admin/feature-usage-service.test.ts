import { describe, expect, it } from "vitest";
import {
  buildActionBreakdown,
  failureRate,
  formatActionLabel,
  mostUsedActionLabel,
  startOfUtcDay,
} from "@/features/admin/server/feature-usage.service";
import type { ActionStatusCount } from "@/features/admin/server/feature-usage.repository";

describe("buildActionBreakdown", () => {
  it("groups by action and splits by status", () => {
    const rows: ActionStatusCount[] = [
      { action: "APPLICATION_ANALYSIS", status: "COMPLETED", value: 10 },
      { action: "APPLICATION_ANALYSIS", status: "FAILED", value: 2 },
      { action: "JOB_EXTRACTION", status: "COMPLETED", value: 3 },
    ];

    const breakdown = buildActionBreakdown(rows);

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0]).toMatchObject({
      action: "APPLICATION_ANALYSIS",
      completed: 10,
      failed: 2,
      total: 12,
    });
  });

  it("sorts by total descending, busiest action first", () => {
    const rows: ActionStatusCount[] = [
      { action: "JOB_EXTRACTION", status: "COMPLETED", value: 3 },
      { action: "APPLICATION_ANALYSIS", status: "COMPLETED", value: 10 },
    ];

    expect(buildActionBreakdown(rows)[0]?.action).toBe("APPLICATION_ANALYSIS");
  });

  it("returns an empty array with no data", () => {
    expect(buildActionBreakdown([])).toEqual([]);
  });

  it("counts reserved (in-flight) events separately from completed and failed", () => {
    const rows: ActionStatusCount[] = [
      { action: "JOB_EXTRACTION", status: "RESERVED", value: 1 },
    ];

    const [row] = buildActionBreakdown(rows);

    expect(row).toMatchObject({ reserved: 1, completed: 0, failed: 0, total: 1 });
  });
});

describe("mostUsedActionLabel", () => {
  it("labels the busiest action", () => {
    const breakdown = buildActionBreakdown([
      { action: "APPLICATION_ANALYSIS", status: "COMPLETED", value: 5 },
    ]);

    expect(mostUsedActionLabel(breakdown)).toBe("Application analyses");
  });

  it("falls back when there is no data", () => {
    expect(mostUsedActionLabel([])).toBe("None yet");
  });
});

describe("failureRate", () => {
  it("computes the failed share of total events", () => {
    const breakdown = buildActionBreakdown([
      { action: "APPLICATION_ANALYSIS", status: "COMPLETED", value: 8 },
      { action: "APPLICATION_ANALYSIS", status: "FAILED", value: 2 },
    ]);

    expect(failureRate(breakdown)).toBe(0.2);
  });

  it("is zero with no events, never NaN", () => {
    expect(failureRate([])).toBe(0);
  });
});

describe("formatActionLabel", () => {
  it("uses the curated label when one exists", () => {
    expect(formatActionLabel("APPLICATION_ANALYSIS")).toBe(
      "Application analyses",
    );
  });

  it("title-cases enum values with no curated label", () => {
    expect(formatActionLabel("COVER_LETTER")).toBe("Cover Letter");
  });
});

describe("startOfUtcDay", () => {
  it("truncates to UTC midnight", () => {
    const result = startOfUtcDay(new Date("2026-09-18T14:32:10.000Z"));

    expect(result.toISOString()).toBe("2026-09-18T00:00:00.000Z");
  });
});
