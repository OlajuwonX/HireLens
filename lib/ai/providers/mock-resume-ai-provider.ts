import type {
  AIProviderResult,
  ApplicationDocumentInput,
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
        scoreExplanations: {
          overall: {
            score: 70,
            explanation: "The resume is directionally relevant but needs sharper evidence.",
          },
          ats: {
            score: 72,
            explanation: "Core terms are present, but some posting language is missing.",
          },
          jobFit: {
            score: 68,
            explanation: "Several requirements are strong while one named credential is absent.",
          },
        },
        summary: "Mock job-fit analysis generated without an external AI call.",
        summaryRecommendation:
          "Lead with the strongest role-specific evidence and add placeholders only where verified metrics are missing.",
        missingRequirements: ["Formal certification named in the posting"],
        keywordGroups: {
          skills: [
            {
              keyword: "Stakeholder communication",
              status: "WEAK",
              recommendation: "Make the communication audience and cadence explicit.",
            },
          ],
          tools: [],
          responsibilities: [],
          industryLanguage: [],
          certifications: [
            {
              keyword: "Formal certification",
              status: "MISSING",
              recommendation: "Add it only if held.",
            },
          ],
          experienceTerms: [],
        },
        bulletIssues: [
          {
            original: "Managed projects.",
            issue: "Too broad for a targeted application.",
            recommendation: "Name the scope, stakeholders, and verified outcome.",
          },
        ],
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

  async generateApplicationDocument(
    input: ApplicationDocumentInput,
  ): Promise<AIProviderResult> {
    const startedAt = performance.now();

    return {
      provider: "mock",
      model: "mock-application-document",
      durationMs: Math.round(performance.now() - startedAt),
      rawResponse: [
        `Subject: ${input.jobTitle} at ${input.company}`,
        "",
        `Hello ${input.company} team,`,
        "",
        `I am interested in the ${input.jobTitle} role. My resume evidence should be tailored here without inventing details.`,
        "",
        "Relevant evidence: [verified resume evidence]",
        "",
        "Thank you,",
        "[Your name]",
      ].join("\n"),
    };
  }
}
