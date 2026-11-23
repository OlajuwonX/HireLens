import { describe, expect, it } from "vitest";
import { describeMatch } from "../src/content/badge";
import { describeMatchLine, describeResult } from "../src/popup/summary";

const summary = {
  fields: 10,
  filled: 6,
  written: 2,
  missing: [],
  resumeAttached: true,
  coverLetterAttached: true,
  application: null,
  tailored: true,
  match: null,
  notes: [],
};

describe("match wording", () => {
  it("shows how far the resume moved", () => {
    expect(describeMatch({ before: 70, after: 91, gaps: [] })).toBe("resume match 70% → 91%");
    expect(describeMatchLine({ before: 70, after: 91, gaps: [] })).toBe("Resume match 70% → 91%");
  });

  it("is honest when the resume cannot reach 90% truthfully", () => {
    expect(describeMatchLine({ before: 70, after: 82, gaps: ["Kubernetes"] })).toBe(
      "Resume match 70% → 82%. It cannot go higher without inventing experience.",
    );
  });

  it("stays quiet when there is no score", () => {
    expect(describeMatch(null)).toBeNull();
    expect(describeMatchLine({ before: null, after: null, gaps: [] })).toBeNull();
  });
});

describe("describeResult", () => {
  it("tells the user to review AI-written answers", () => {
    expect(describeResult(summary)).toBe(
      "Filled 6 of 10 fields. AI wrote 2 answers, outlined in blue. Review them before you submit. Tailored resume attached. Cover letter attached. New pages fill automatically when you select Next.",
    );
  });
});
