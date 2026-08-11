export type AIProviderName = "gemini" | "mock";

export type AIProviderResult = {
  provider: AIProviderName;
  model: string;
  rawResponse: unknown;
  durationMs: number;
};

export type ResumeDocumentInput = {
  pdfBase64: string;
  filename: string;
  text: string | null;
};

export type JobPostingInput = {
  title: string;
  company: string;
  location: string | null;
  workArrangement: string;
  employmentType: string;
  deadline: string | null;
  source: string | null;
  sourceUrl: string | null;
  description: string;
  requirements: string | null;
};

export type ApplicationIntelligenceInput = {
  resume: ResumeDocumentInput;
  job: JobPostingInput;
  priorCorrections: {
    requirement: string;
    markedIncorrect: boolean;
    evidence: string | null;
    notes: string | null;
  }[];
};

export interface ApplicationIntelligenceProvider {
  analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult>;
  extractJobPosting(input: { content: string }): Promise<AIProviderResult>;
}
