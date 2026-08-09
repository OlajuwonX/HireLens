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
        missingRequirements: ["Formal certification named in the posting"],
        requirementMatches: [
          {
            id: "mock-req-1",
            requirement: "Relevant experience in the advertised field",
            category: "EXPERIENCE",
            importance: "REQUIRED",
            status: "STRONG",
            resumeEvidence: "Mock evidence quoted from the resume.",
            explanation: "The resume shows directly relevant experience.",
            recommendation: null,
          },
          {
            id: "mock-req-2",
            requirement: "Formal certification named in the posting",
            category: "CERTIFICATION",
            importance: "PREFERRED",
            status: "MISSING",
            resumeEvidence: null,
            explanation: "No certification is listed on the resume.",
            recommendation: "Add the certification if you hold it.",
          },
          {
            id: "mock-req-3",
            requirement: "Stakeholder communication",
            category: "SKILL",
            importance: "REQUIRED",
            status: "UNCLEAR",
            resumeEvidence: null,
            explanation: "The resume does not make this explicit.",
            recommendation: "Describe who you communicated with and how often.",
          },
        ],
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
