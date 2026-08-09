import { describe, expect, it } from "vitest";
import {
  applicationFiltersSchema,
  changeStageSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/features/applications/schemas/application.schema";
import {
  APPLICATION_STAGES,
  CLOSED_STAGES,
  PIPELINE_STAGES,
  applicationStageLabels,
} from "@/features/applications/constants";

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";

describe("createApplicationSchema", () => {
  it("defaults a new application to Saved", () => {
    expect(createApplicationSchema.parse({ jobPublicId: uuid }).stage).toBe(
      "SAVED",
    );
  });

  it("treats a blank resume version as not chosen", () => {
    const result = createApplicationSchema.parse({
      jobPublicId: uuid,
      resumeVersionPublicId: "",
    });

    expect(result.resumeVersionPublicId).toBeUndefined();
  });

  it("rejects an unknown stage", () => {
    expect(
      createApplicationSchema.safeParse({ jobPublicId: uuid, stage: "GHOSTED" })
        .success,
    ).toBe(false);
  });

  it("requires a job", () => {
    expect(createApplicationSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateApplicationSchema", () => {
  const base = { publicId: uuid, stage: "APPLIED" };

  it("coerces date inputs into Dates", () => {
    const result = updateApplicationSchema.parse({
      ...base,
      followUpAt: "2026-10-01",
    });

    expect(result.followUpAt).toBeInstanceOf(Date);
  });

  it("treats blank dates as cleared", () => {
    const result = updateApplicationSchema.parse({
      ...base,
      appliedAt: "",
      followUpAt: "",
      interviewAt: "",
    });

    expect(result.appliedAt).toBeUndefined();
    expect(result.followUpAt).toBeUndefined();
    expect(result.interviewAt).toBeUndefined();
  });

  it("treats blank notes as cleared", () => {
    expect(updateApplicationSchema.parse({ ...base, notes: "  " }).notes)
      .toBeUndefined();
  });
});

describe("changeStageSchema", () => {
  it("accepts every defined stage", () => {
    for (const stage of APPLICATION_STAGES) {
      expect(
        changeStageSchema.safeParse({ publicId: uuid, stage }).success,
        stage,
      ).toBe(true);
    }
  });

  it("rejects an arbitrary stage", () => {
    expect(
      changeStageSchema.safeParse({ publicId: uuid, stage: "MAYBE" }).success,
    ).toBe(false);
  });
});

describe("applicationFiltersSchema", () => {
  it("defaults to the list view sorted by recent activity", () => {
    const result = applicationFiltersSchema.parse({});

    expect(result.view).toBe("list");
    expect(result.sort).toBe("activity_desc");
  });

  it("rejects an unknown sort so the query cannot be steered", () => {
    expect(
      applicationFiltersSchema.safeParse({ sort: "salary_desc" }).success,
    ).toBe(false);
  });

  it("rejects an unknown view", () => {
    expect(applicationFiltersSchema.safeParse({ view: "kanban" }).success).toBe(
      false,
    );
  });
});

describe("stage taxonomy", () => {
  it("covers every stage exactly once across pipeline and closed", () => {
    const covered = [...PIPELINE_STAGES, ...CLOSED_STAGES].sort();

    expect(covered).toEqual([...APPLICATION_STAGES].sort());
    expect(new Set(covered).size).toBe(APPLICATION_STAGES.length);
  });

  it("labels every stage", () => {
    for (const stage of APPLICATION_STAGES) {
      expect(applicationStageLabels[stage], stage).toBeTruthy();
    }
  });

  it("matches the seven stages named in the stage document", () => {
    expect(APPLICATION_STAGES).toEqual([
      "SAVED",
      "PREPARING",
      "APPLIED",
      "INTERVIEW",
      "OFFER",
      "REJECTED",
      "WITHDRAWN",
    ]);
  });
});
