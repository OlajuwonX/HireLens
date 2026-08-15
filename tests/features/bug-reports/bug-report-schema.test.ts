import {
  createBugReportSchema,
  updateBugStatusSchema,
} from "@/features/bug-reports/schemas/bug-report.schema";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const valid = {
  category: "BUG",
  title: "Download fails",
  description: "The download button returns a 500 on the documents page.",
};

describe("the bug report validates its input", () => {
  it("accepts a well formed report", () => {
    expect(createBugReportSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown category", () => {
    expect(
      createBugReportSchema.safeParse({ ...valid, category: "ANYTHING" })
        .success,
    ).toBe(false);
  });

  it("rejects a title that is too short or too long", () => {
    expect(
      createBugReportSchema.safeParse({ ...valid, title: "no" }).success,
    ).toBe(false);
    expect(
      createBugReportSchema.safeParse({ ...valid, title: "x".repeat(121) })
        .success,
    ).toBe(false);
  });

  it("rejects a description that is too short or too long", () => {
    expect(
      createBugReportSchema.safeParse({ ...valid, description: "broken" })
        .success,
    ).toBe(false);
    expect(
      createBugReportSchema.safeParse({
        ...valid,
        description: "x".repeat(4_001),
      }).success,
    ).toBe(false);
  });

  it("caps the free-text passthrough fields", () => {
    expect(
      createBugReportSchema.safeParse({ ...valid, route: "x".repeat(513) })
        .success,
    ).toBe(false);
    expect(
      createBugReportSchema.safeParse({
        ...valid,
        sentryEventId: "x".repeat(65),
      }).success,
    ).toBe(false);
  });

  it("ignores a client-supplied user id", () => {
    const parsed = createBugReportSchema.parse({
      ...valid,
      userId: "00000000-0000-4000-8000-000000000000",
    });

    expect(parsed).not.toHaveProperty("userId");
  });

  it("only accepts a public uuid on the status mutation", () => {
    expect(
      updateBugStatusSchema.safeParse({ publicId: "7", status: "OPEN" })
        .success,
    ).toBe(false);
    expect(
      updateBugStatusSchema.safeParse({
        publicId: "3f1d6a1e-9b2c-4c8d-9f0a-6a1b2c3d4e5f",
        status: "NOT_A_STATUS",
      }).success,
    ).toBe(false);
  });
});

describe("the create action runs the schema before it writes", () => {
  const actions = readFileSync(
    "features/bug-reports/actions/bug-report-actions.ts",
    "utf8",
  );

  it("parses with the schema", () => {
    expect(actions).toContain("createBugReportSchema.safeParse");
  });

  it("authenticates before it validates, and validates before it writes", () => {
    const authIndex = actions.indexOf("await requireDatabaseUser()");
    const parseIndex = actions.indexOf("createBugReportSchema.safeParse");
    const writeIndex = actions.indexOf("await submitBugReport(");

    expect(authIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeLessThan(parseIndex);
    expect(parseIndex).toBeLessThan(writeIndex);
  });

  it("takes the user id from the session, not the parsed form", () => {
    expect(actions).toContain("userId: user.id");
    expect(actions).not.toContain("userId: parsed.data");
  });
});
