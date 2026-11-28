import { describe, expect, it } from "vitest";
import { describeMatch } from "../src/content/badge";
import { describeMatchLine, describeResult, matchRows } from "../src/popup/summary";

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
  checklist: [],
};

describe("match wording", () => {
  it("shows how far the resume moved", () => {
    expect(describeMatch({ before: 70, after: 91, gaps: [] })).toBe("resume match 70% → 91%");
    expect(describeMatchLine({ before: 70, after: 91, gaps: [] })).toBe("Resume match 70% → 91%");
  });

  it("is honest when the resume cannot reach 85% truthfully", () => {
    expect(describeMatchLine({ before: 70, after: 82, gaps: ["Kubernetes"] })).toBe(
      "Resume match 70% → 82%. This is the best version HireLens could make without inventing experience, so it was used.",
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

describe("match bars", () => {
  it("shows before and after when the resume improved", () => {
    expect(matchRows({ before: 70, after: 91, gaps: [] })).toEqual([
      { label: "Before", score: 70 },
      { label: "Now", score: 91 },
    ]);
  });

  it("shows one bar when nothing changed, and none without a score", () => {
    expect(matchRows({ before: 88, after: 88, gaps: [] })).toEqual([{ label: "Now", score: 88 }]);
    expect(matchRows({ before: null, after: null, gaps: [] })).toEqual([]);
    expect(matchRows(null)).toEqual([]);
  });
});
