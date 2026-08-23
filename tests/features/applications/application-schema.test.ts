import {
  APPLICATION_STATUSES,
  APPLICATION_TABS,
  applicationStatusLabels,
} from "@/features/applications/constants";
import {
  applicationFiltersSchema,
  changeStatusSchema,
  saveAndAnalyzeSchema,
  updateApplicationSchema,
} from "@/features/applications/schemas/application.schema";
import { describe, expect, it } from "vitest";

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";

const validJob = {
  resumeVersionPublicId: uuid,
  title: "Quantity Surveyor",
  company: "Turner",
  description: "Manage cost planning across two sites.",
};

describe("saveAndAnalyzeSchema", () => {
  it("accepts a resume version plus the minimum job fields", () => {
    const result = saveAndAnalyzeSchema.safeParse(validJob);

    expect(result.success).toBe(true);
    expect(result.data?.workArrangement).toBe("NOT_SPECIFIED");
  });

  it("requires a resume version, because analysis needs something to compare", () => {
    const { resumeVersionPublicId: _omitted, ...withoutResume } = validJob;

    expect(saveAndAnalyzeSchema.safeParse(withoutResume).success).toBe(false);
  });

  it("still enforces the job field rules", () => {
    expect(
      saveAndAnalyzeSchema.safeParse({ ...validJob, title: "" }).success,
    ).toBe(false);
    expect(
      saveAndAnalyzeSchema.safeParse({ ...validJob, sourceUrl: "turner.com" })
        .success,
    ).toBe(false);
  });

  it("still enforces the salary range rule inherited from the job schema", () => {
    const result = saveAndAnalyzeSchema.safeParse({
      ...validJob,
      salaryMin: "60000",
      salaryMax: "45000",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["salaryMax"]);
  });
});

describe("changeStatusSchema", () => {
  it("accepts every defined status", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(
        changeStatusSchema.safeParse({ publicId: uuid, status }).success,
        status,
      ).toBe(true);
    }
  });

  it("rejects a retired seven-stage value", () => {
    for (const old of ["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "OFFER"]) {
      expect(
        changeStatusSchema.safeParse({ publicId: uuid, status: old }).success,
        old,
      ).toBe(false);
    }
  });
});

describe("updateApplicationSchema", () => {
  const base = { publicId: uuid, status: "ACCEPTED" };

  it("coerces date inputs into Dates", () => {
    expect(
      updateApplicationSchema.parse({ ...base, followUpAt: "2026-10-01" })
        .followUpAt,
    ).toBeInstanceOf(Date);
  });

  it("treats blank dates and notes as cleared", () => {
    const result = updateApplicationSchema.parse({
      ...base,
      appliedAt: "",
      followUpAt: "",
      notes: "  ",
    });

    expect(result.appliedAt).toBeUndefined();
    expect(result.followUpAt).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });
});

describe("applicationFiltersSchema", () => {
  it("defaults to the Pending tab", () => {
    expect(applicationFiltersSchema.parse({}).tab).toBe("PENDING");
  });

  it("accepts every tab including All", () => {
    for (const tab of APPLICATION_TABS) {
      expect(applicationFiltersSchema.safeParse({ tab }).success, tab).toBe(
        true,
      );
    }
  });

  it("rejects an unknown sort so the query cannot be steered", () => {
    expect(
      applicationFiltersSchema.safeParse({ sort: "salary_desc" }).success,
    ).toBe(false);
  });
});

describe("status taxonomy", () => {
  it("is exactly the three statuses the update defines", () => {
    expect(APPLICATION_STATUSES).toEqual(["PENDING", "ACCEPTED", "REJECTED"]);
  });

  it("labels every status", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(applicationStatusLabels[status], status).toBeTruthy();
    }
  });

  it("puts All first in the tab list", () => {
    expect(APPLICATION_TABS[0]).toBe("ALL");
  });
});
