import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

export class MockApplicationIntelligenceProvider implements ApplicationIntelligenceProvider {
  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    const startedAt = performance.now();
    const firstLine = input.content.split(/\n/).find((line) => line.trim());

    return {
      provider: "mock",
      model: "mock-job-extraction",
      durationMs: Math.round(performance.now() - startedAt),
      rawResponse: JSON.stringify({
        title: firstLine?.trim() ?? null,
        company: null,
        location: null,
        workArrangement: null,
        employmentType: null,
        salaryMin: null,
        salaryMax: null,
        currency: null,
        source: null,
        sourceUrl: null,
        description: input.content,
        requirements: null,
      }),
    };
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
    const startedAt = performance.now();
    const { title, company } = input.job;

    return {
      provider: "mock",
      model: "mock-application-intelligence",
      durationMs: Math.round(performance.now() - startedAt),
      rawResponse: JSON.stringify({
        scoring: {
          overallScore: 70,
          atsScore: 72,
          requirementsScore: 65,
          skillsScore: 74,
          experienceScore: 66,
          keywordScore: 71,
          explanation:
            "Mock analysis generated without calling an external AI provider.",
        },
        recommendations: [
          {
            problem: "This analysis did not come from a real model.",
            evidence: null,
            recommendedAction: "Set GEMINI_API_KEY to run a real analysis.",
            reason: "No AI provider credentials are configured.",
            priority: "MEDIUM",
          },
        ],
        keywordAnalysis: {
          present: ["Stakeholder communication"],
          transferable: [
            {
              required: "Programme leadership",
              existingEvidence: "Led delivery across multiple teams.",
            },
          ],
          missing: [
            {
              keyword: "Formal certification",
              gapType: "QUALIFICATION_GAP",
              explanation: "The resume does not list this certification.",
            },
          ],
          avoidForcing: ["Buzzword stuffing"],
        },
        requirementMatches: [
          {
            key: "relevant-experience",
            requirement: "Relevant experience in the advertised field",
            category: "EXPERIENCE",
            importance: "REQUIRED",
            status: "STRONG",
            resumeEvidence: "Mock evidence quoted from the resume.",
            explanation: "The resume shows directly relevant experience.",
            recommendation: null,
          },
          {
            key: "formal-certification",
            requirement: "Formal certification named in the posting",
            category: "CERTIFICATION",
            importance: "PREFERRED",
            status: "MISSING",
            resumeEvidence: null,
            explanation: "No certification is listed on the resume.",
            recommendation: "Add the certification if you hold it.",
          },
        ],
        improvedResume: {
          header: {
            name: "[verified full name]",
            headline: title,
            location: null,
            email: "[verified email]",
            phone: null,
            links: [],
          },
          professionalSummary: `Mock improved resume targeting ${title} at ${company}.`,
          skills: [{ category: "Core", items: ["[verified skill]"] }],
          experience: [
            {
              company: "[verified employer]",
              title: "[verified role]",
              location: null,
              startDate: "[verified start]",
              endDate: "Present",
              bullets: [
                "Delivered [verified outcome] against [verified scope].",
              ],
            },
          ],
          projects: [],
          education: [],
        },
        bulletRewrites: [
          {
            original: "Managed projects.",
            improved: "Ran [verified count] projects across [verified scope].",
            reason: "The original is too broad for a targeted application.",
          },
        ],
        professionalSummary: `Mock professional summary for ${title}.`,
        coverLetter: `Mock cover letter for ${title} at ${company}. Configure GEMINI_API_KEY for real output.`,
        applicationEmail: {
          subject: `Application for ${title}`,
          body: "Mock application email body. Configure GEMINI_API_KEY for real output.",
        },
        followUpMessage: `Mock follow-up message about the ${title} application.`,
      }),
    };
  }
}
