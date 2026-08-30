import {
  ONBOARDING_STEPS,
  type OnboardingProgress,
} from "@/features/onboarding/constants";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function pick(progress: OnboardingProgress, pathname: string) {
  return ONBOARDING_STEPS.filter(
    (step) => step.route === pathname && !step.isDone(progress),
  ).map((step) => step.id);
}

const empty: OnboardingProgress = {
  hasResumeVersion: false,
  hasApplication: false,
  hasDocument: false,
};

describe("step selection follows the data, not a stored counter", () => {
  it("starts a brand new account on the resume step", () => {
    expect(pick(empty, "/dashboard")[0]).toBe("ADD_RESUME");
  });

  it("advances to the application step once a resume version exists", () => {
    const progress = { ...empty, hasResumeVersion: true };

    expect(pick(progress, "/dashboard")).toEqual(["CREATE_APPLICATION"]);
  });

  it("offers the paste step then the save step on the application page", () => {
    const progress = { ...empty, hasResumeVersion: true };

    expect(pick(progress, "/dashboard/applications")).toEqual([
      "PASTE_JOB",
      "REVIEW_AND_SAVE",
    ]);
  });

  it("drops the application page steps once a job is saved", () => {
    const progress = {
      ...empty,
      hasResumeVersion: true,
      hasApplication: true,
    };

    expect(pick(progress, "/dashboard/applications")).toEqual([]);
    expect(pick(progress, "/dashboard/jobs")).toEqual(["SAVE_DOCUMENT"]);
  });

  it("has nothing left to show once a document is saved", () => {
    const done = {
      hasResumeVersion: true,
      hasApplication: true,
      hasDocument: true,
    };

    for (const route of ["/dashboard", "/dashboard/applications", "/dashboard/jobs"]) {
      expect(pick(done, route)).toEqual([]);
    }
  });

  it("shows nothing on routes the tour does not cover", () => {
    expect(pick(empty, "/settings/account")).toEqual([]);
    expect(pick(empty, "/dashboard/documents")).toEqual([]);
    expect(pick(empty, "/dashboard/resumes")).toEqual([]);
  });
});

describe("every step is anchored to a real element", () => {
  const sources = [
    "app/(dashboard)/dashboard/(overview)/page.tsx",
    "features/applications/components/save-and-analyze-form.tsx",
    "features/applications/components/application-drawer.tsx",
    "features/documents/components/application-ai-actions.tsx",
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  it("finds a data-onboarding attribute for each anchor", () => {
    for (const step of ONBOARDING_STEPS) {
      for (const anchor of step.anchors) {
        expect(sources).toContain(anchor);
      }
    }
  });
});

describe("the tour never runs for an account that already has data", () => {
  const tour = readFileSync(
    "features/onboarding/components/onboarding-tour.tsx",
    "utf8",
  );

  it("requires an empty account or a stored marker before running", () => {
    expect(tour).toContain(
      "const isNewAccount = !hasResumeVersion && !hasApplication && !hasDocument;",
    );
    expect(tour).toContain("if (!isNewAccount && !readFlag(local, ACTIVE_KEY))");
  });

  it("hides itself when an unrelated modal is open", () => {
    expect(tour).toContain("modal && !modal.contains(anchor)");
  });
});
