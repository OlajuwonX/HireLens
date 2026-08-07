import type {
  AIProviderResult,
  GeneralAnalysisInput,
  JobSpecificAnalysisInput,
  ResumeAIProvider,
} from "../types";

export class MockResumeAIProvider implements ResumeAIProvider {
  async analyzeResume(_input: GeneralAnalysisInput): Promise<AIProviderResult> {
    const startedAt = performance.now();

    return {
      provider: "mock",
      model: "mock-resume-analysis",
      durationMs: Math.round(performance.now() - startedAt),
      rawResponse: JSON.stringify({
        overallScore: 72,
        atsScore: 74,
        summary: "Mock analysis generated without calling an external AI provider.",
        strengths: ["Clear resume version record exists."],
        weaknesses: ["Resume text extraction is not connected yet."],
        recommendations: [
          {
            id: "mock-rec-1",
            category: "Content",
            severity: "MEDIUM",
            problem: "Resume text is not available for deep analysis yet.",
            reason: "Stage 8 is validating the structured analysis pipeline.",
            action: "Connect PDF text extraction before production AI analysis.",
          },
        ],
      }),
    };
  }

  async analyzeResumeForJob(
    _input: JobSpecificAnalysisInput,
  ): Promise<AIProviderResult> {
    const startedAt = performance.now();

    return {
      provider: "mock",
      model: "mock-job-fit-analysis",
      durationMs: Math.round(performance.now() - startedAt),
      rawResponse: JSON.stringify({
        overallScore: 70,
        atsScore: 72,
        jobFitScore: 68,
        summary: "Mock job-fit analysis generated without an external AI call.",
        missingRequirements: [],
        requirementMatches: [],
        recommendations: [
          {
            id: "mock-job-rec-1",
            category: "Job fit",
            severity: "MEDIUM",
            problem: "Job-specific evidence has not been extracted yet.",
            reason: "Saved jobs and requirement matrix stages are still pending.",
            action: "Run this analysis again after saved jobs are implemented.",
          },
        ],
      }),
    };
  }
}
