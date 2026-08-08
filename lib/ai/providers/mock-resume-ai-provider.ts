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
        strengths: ["Resume uploaded and stored successfully."],
        weaknesses: ["No AI provider is configured in this environment."],
        recommendations: [
          {
            id: "mock-rec-1",
            category: "Configuration",
            severity: "MEDIUM",
            problem: "This analysis did not come from a real model.",
            reason: "No AI provider credentials are configured.",
            action: "Set GEMINI_API_KEY to run a real analysis.",
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
            category: "Configuration",
            severity: "MEDIUM",
            problem: "This job-fit analysis did not come from a real model.",
            reason: "No AI provider credentials are configured.",
            action: "Set GEMINI_API_KEY to run a real analysis.",
          },
        ],
      }),
    };
  }
}
