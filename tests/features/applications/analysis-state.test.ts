import {
  SAVE_INTENTS,
  SAVE_ONLY_REASON,
  parseSaveIntent,
  resolveAnalysisState,
} from "@/features/applications/analysis-state";
import { describe, expect, it } from "vitest";

describe("resolveAnalysisState", () => {
  it("shows a score when the analysis completed", () => {
    expect(resolveAnalysisState({ saveOnly: false, matchScore: 82 })).toBe(
      "scored",
    );
  });

  it("treats a zero score as scored, not failed", () => {
    expect(resolveAnalysisState({ saveOnly: false, matchScore: 0 })).toBe(
      "scored",
    );
  });

  it("marks a job with no analysis that was meant to be analysed as failed", () => {
    expect(resolveAnalysisState({ saveOnly: false, matchScore: null })).toBe(
      "failed",
    );
  });

  it("marks a save-only job as saved, whatever the score column holds", () => {
    expect(resolveAnalysisState({ saveOnly: true, matchScore: null })).toBe(
      "saved",
    );
    expect(resolveAnalysisState({ saveOnly: true, matchScore: 70 })).toBe(
      "saved",
    );
  });

  it("keeps failed and saved distinguishable after a reload", () => {
    const failed = resolveAnalysisState({ saveOnly: false, matchScore: null });
    const saved = resolveAnalysisState({ saveOnly: true, matchScore: null });

    expect(failed).not.toBe(saved);
  });
});

describe("parseSaveIntent", () => {
  it("accepts the two known intents", () => {
    expect(parseSaveIntent("save")).toBe("save");
    expect(parseSaveIntent("analyze")).toBe("analyze");
    expect(SAVE_INTENTS).toEqual(["save", "analyze"]);
  });

  it("defaults a missing intent to analyze so an older cached form still works", () => {
    expect(parseSaveIntent(null)).toBe("analyze");
    expect(parseSaveIntent(undefined)).toBe("analyze");
    expect(parseSaveIntent("")).toBe("analyze");
  });

  it("rejects anything else", () => {
    expect(parseSaveIntent("delete")).toBeNull();
    expect(parseSaveIntent("SAVE")).toBeNull();
    expect(parseSaveIntent(" save")).toBeNull();
    expect(parseSaveIntent(1)).toBeNull();
    expect(parseSaveIntent({})).toBeNull();
  });
});

describe("copy", () => {
  it("gives a one-line reason", () => {
    expect(SAVE_ONLY_REASON).not.toContain("\n");
    expect(SAVE_ONLY_REASON.length).toBeGreaterThan(20);
  });
});
