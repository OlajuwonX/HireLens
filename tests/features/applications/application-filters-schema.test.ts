import { applicationFiltersSchema } from "@/features/applications/schemas/application.schema";
import { describe, expect, it } from "vitest";

describe("applicationFiltersSchema date range", () => {
  it("accepts an ISO from and to date", () => {
    const parsed = applicationFiltersSchema.safeParse({
      from: "2026-09-01",
      to: "2026-09-30",
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.from).toBe("2026-09-01");
      expect(parsed.data.to).toBe("2026-09-30");
    }
  });

  it("rejects text that is not a date", () => {
    expect(applicationFiltersSchema.safeParse({ from: "dddd-dd-dd" }).success).toBe(
      false,
    );
    expect(applicationFiltersSchema.safeParse({ from: "yesterday" }).success).toBe(
      false,
    );
  });

  it("rejects a malformed date shape", () => {
    expect(applicationFiltersSchema.safeParse({ to: "2026-9-1" }).success).toBe(
      false,
    );
    expect(applicationFiltersSchema.safeParse({ to: "26-09-01" }).success).toBe(
      false,
    );
  });

  it("treats blank values as no filter", () => {
    const parsed = applicationFiltersSchema.safeParse({ from: "", to: "" });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.from).toBeUndefined();
      expect(parsed.data.to).toBeUndefined();
    }
  });

  it("keeps its defaults when no filters are given", () => {
    const parsed = applicationFiltersSchema.parse({});

    expect(parsed.tab).toBe("PENDING");
    expect(parsed.sort).toBe("activity_desc");
  });
});
