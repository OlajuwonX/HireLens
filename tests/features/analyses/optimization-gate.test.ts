import { describe, expect, it } from "vitest";
import { decideOptimization } from "@/features/analyses/server/optimization-gate";
import type { ApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import { extractSourceEvidence } from "@/lib/ai/source-evidence";
import {
  faithfulResume,
  fullTrace,
  plant,
  sourceText,
} from "../../fixtures/rev/frontend-engineer";

const evidence = extractSourceEvidence(sourceText);
const trace = fullTrace(evidence.map((item) => item.id));

function pass(improvedResume: ImprovedResume): ApplicationIntelligence {
  return {
    requirementMatches: [],
    keywordAnalysis: { present: [], transferable: [], missing: [], avoidForcing: [] },
    optimizationPlan: { alignment: "HIGH", intensity: "SURGICAL", rationale: "r", droppedEvidence: [] },
    improvedResume,
    traceability: trace,
    bulletRewrites: [],
    professionalSummary: "s",
    coverLetter: "c",
    reasonToJoin: "r",
    applicationEmail: { subject: "s", body: "b" },
    followUpMessage: "f",
    recommendations: [],
    scoring: {
      overallScore: 80,
      atsScore: 80,
      requirementsScore: 80,
      skillsScore: 80,
      experienceScore: 80,
      keywordScore: 80,
      explanation: "e",
    },
  };
}

const previous = (resume: ImprovedResume) => ({
  improvedResume: resume,
  traceability: trace,
  validation: null,
});

function decide(prev: ImprovedResume | null, next: ImprovedResume) {
  return decideOptimization({
    sourceText,
    evidence,
    previous: prev ? previous(prev) : null,
    next: pass(next),
  });
}

describe("decideOptimization", () => {
  it("accepts the first pass and attaches its validation", () => {
    const decision = decide(null, faithfulResume());

    expect(decision.outcome).toBe("FIRST_PASS");
    expect(decision.result.validation.errorCount).toBe(0);
  });

  it("still validates a flawed first pass so the user can see the problem", () => {
    const decision = decide(null, plant("invented-metric"));

    expect(decision.outcome).toBe("FIRST_PASS");
    expect(decision.result.validation.errorCount).toBeGreaterThan(0);
  });

  it("keeps the previous resume when a new pass loses a metric", () => {
    const decision = decide(faithfulResume(), plant("lost-metric"));

    expect(decision.outcome).toBe("KEPT_PREVIOUS");
    expect(decision.result.improvedResume).toEqual(faithfulResume());
  });

  it("keeps the previous resume when a new pass inflates experience", () => {
    expect(decide(faithfulResume(), plant("inflated-years")).outcome).toBe("KEPT_PREVIOUS");
  });

  it("keeps the previous resume when a new pass changes an employment date", () => {
    expect(decide(faithfulResume(), plant("changed-date")).outcome).toBe("KEPT_PREVIOUS");
  });

  it("keeps the previous resume when only the deterministic checks get worse", () => {
    const decision = decide(faithfulResume(), plant("empty-summary"));

    expect(decision.outcome).toBe("KEPT_PREVIOUS");
    expect(decision.reason).toBe("MORE_VALIDATION_ERRORS");
  });

  it("reports an unchanged resume as already optimized", () => {
    expect(decide(faithfulResume(), faithfulResume()).outcome).toBe("ALREADY_OPTIMIZED");
  });

  it("accepts a real, safe improvement", () => {
    const better = faithfulResume();
    better.professionalSummary =
      "Frontend engineer shipping merchant payment dashboards in React and TypeScript, with a track record of measurable performance gains and component libraries adopted across product teams.";
    better.experience[0].bullets.reverse();

    const decision = decide(faithfulResume(), better);

    expect(decision.outcome).toBe("IMPROVED");
    expect(decision.result.improvedResume).toEqual(better);
  });

  it("recovers from a previous pass that was itself flawed", () => {
    expect(decide(plant("invented-metric"), faithfulResume()).outcome).not.toBe("KEPT_PREVIOUS");
  });
});
