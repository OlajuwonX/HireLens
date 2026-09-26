import {
  RESUME_SCOPES,
  filterResumesByScope,
  resumeScopeLabels,
} from "@/features/resumes/resume-scope";
import { describe, expect, it } from "vitest";

const resumes = [
  { title: "Frontend", archivedAt: null },
  { title: "Backend", archivedAt: new Date("2026-01-01") },
  { title: "Design", archivedAt: null },
];

describe("filterResumesByScope", () => {
  it("shows only active job titles by default scope", () => {
    expect(filterResumesByScope(resumes, "ACTIVE").map((r) => r.title)).toEqual([
      "Frontend",
      "Design",
    ]);
  });

  it("shows only archived job titles", () => {
    expect(filterResumesByScope(resumes, "ARCHIVED").map((r) => r.title)).toEqual([
      "Backend",
    ]);
  });

  it("shows everything for ALL and keeps the original order", () => {
    expect(filterResumesByScope(resumes, "ALL").map((r) => r.title)).toEqual([
      "Frontend",
      "Backend",
      "Design",
    ]);
  });

  it("handles an empty library", () => {
    for (const scope of RESUME_SCOPES) {
      expect(filterResumesByScope([], scope)).toEqual([]);
    }
  });

  it("does not mutate its input", () => {
    const copy = [...resumes];

    filterResumesByScope(resumes, "ACTIVE");

    expect(resumes).toEqual(copy);
  });
});

describe("resumeScopeLabels", () => {
  it("labels the scopes the way the toolbar shows them", () => {
    expect(resumeScopeLabels.ACTIVE).toBe("Active job titles");
    expect(resumeScopeLabels.ARCHIVED).toBe("Archived");
    expect(resumeScopeLabels.ALL).toBe("All");
  });
});
