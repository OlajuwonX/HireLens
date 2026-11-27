import { describe, expect, it } from "vitest";
import { boostFinished, needsBoost, nextBoostStep } from "@/features/extension/match";

describe("needsBoost", () => {
  it("improves resumes below 85% and jobs that were never scored", () => {
    expect(needsBoost(null)).toBe(true);
    expect(needsBoost(84)).toBe(true);
    expect(needsBoost(85)).toBe(false);
  });
});

describe("nextBoostStep", () => {
  it("analyzes first, then refines until the resume reaches 90%", () => {
    expect(nextBoostStep({ analyzed: false, score: null })).toBe("analyze");
    expect(nextBoostStep({ analyzed: true, score: 72 })).toBe("refine");
    expect(nextBoostStep({ analyzed: true, score: 89 })).toBe("refine");
    expect(nextBoostStep({ analyzed: true, score: 90 })).toBe("done");
  });
});

describe("boostFinished", () => {
  it("stops once the target is reached", () => {
    expect(boostFinished({ score: 91, previous: 80, stuck: false })).toBe(true);
  });

  it("stops after a first analysis that already clears 85%", () => {
    expect(boostFinished({ score: 87, previous: null, stuck: false })).toBe(true);
    expect(boostFinished({ score: 70, previous: null, stuck: false })).toBe(false);
  });

  it("keeps refining while the score still rises", () => {
    expect(boostFinished({ score: 86, previous: 78, stuck: false })).toBe(false);
  });

  it("stops when a pass cannot honestly improve the resume", () => {
    expect(boostFinished({ score: 80, previous: 80, stuck: false })).toBe(true);
    expect(boostFinished({ score: 82, previous: 80, stuck: true })).toBe(true);
  });
});
