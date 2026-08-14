import { describe, expect, it } from "vitest";
import {
  createJobSchema,
  jobFiltersSchema,
} from "@/features/jobs/schemas/job.schema";

const valid = {
  title: "Quantity Surveyor",
  company: "Turner",
  description: "Manage cost planning across two sites.",
};

function parse(overrides: Record<string, unknown> = {}) {
  return createJobSchema.safeParse({ ...valid, ...overrides });
}

describe("createJobSchema", () => {
  it("accepts the minimum required fields", () => {
    const result = parse();

    expect(result.success).toBe(true);
    expect(result.data?.workArrangement).toBe("NOT_SPECIFIED");
    expect(result.data?.employmentType).toBe("NOT_SPECIFIED");
  });

  it("requires a title, company and description", () => {
    for (const field of ["title", "company", "description"]) {
      expect(parse({ [field]: "" }).success, field).toBe(false);
    }
  });

  it("trims whitespace-only values into failures", () => {
    expect(parse({ title: "   " }).success).toBe(false);
  });

  it("treats blank optional fields as absent rather than empty strings", () => {
    const result = parse({ location: "", notes: "", sourceUrl: "" });

    expect(result.success).toBe(true);
    expect(result.data?.location).toBeUndefined();
    expect(result.data?.sourceUrl).toBeUndefined();
  });

  it("rejects a source URL that is not a URL", () => {
    expect(parse({ sourceUrl: "careers.turner.com" }).success).toBe(false);
    expect(parse({ sourceUrl: "https://careers.turner.com" }).success).toBe(
      true,
    );
  });

  it("rejects an unknown work arrangement", () => {
    expect(parse({ workArrangement: "ANYWHERE" }).success).toBe(false);
  });

  it("rejects an unknown employment type", () => {
    expect(parse({ employmentType: "GIG" }).success).toBe(false);
  });

  it("coerces salary strings from the form into numbers", () => {
    const result = parse({ salaryMin: "45000", salaryMax: "60000" });

    expect(result.data?.salaryMin).toBe(45000);
    expect(result.data?.salaryMax).toBe(60000);
  });

  it("rejects a maximum salary below the minimum", () => {
    const result = parse({ salaryMin: "60000", salaryMax: "45000" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["salaryMax"]);
  });

  it("allows a salary range with only one end set", () => {
    expect(parse({ salaryMin: "45000" }).success).toBe(true);
    expect(parse({ salaryMax: "60000" }).success).toBe(true);
  });

  it("rejects a negative salary", () => {
    expect(parse({ salaryMin: "-1" }).success).toBe(false);
  });

  it("coerces a date input string into a Date", () => {
    const result = parse({ deadlineAt: "2026-09-01" });

    expect(result.data?.deadlineAt).toBeInstanceOf(Date);
  });

  it("keeps the description as plain text, including angle brackets", () => {
    const description = "<script>alert(1)</script> Manage cost planning.";
    const result = parse({ description });

    expect(result.data?.description).toBe(description);
  });
});

describe("jobFiltersSchema", () => {
  it("defaults to newest first", () => {
    expect(jobFiltersSchema.parse({}).sort).toBe("created_desc");
  });

  it("rejects an unknown sort so the query cannot be steered", () => {
    expect(jobFiltersSchema.safeParse({ sort: "salary_desc" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown status", () => {
    expect(jobFiltersSchema.safeParse({ status: "DELETED" }).success).toBe(
      false,
    );
  });

  it("drops a blank search term", () => {
    expect(jobFiltersSchema.parse({ q: "  " }).q).toBeUndefined();
  });
});
