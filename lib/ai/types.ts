export type AIProviderName = "puter" | "mock";

export type AIProviderResult = {
  provider: AIProviderName;
  model: string;
  rawResponse: unknown;
  durationMs: number;
};

export type GeneralAnalysisInput = {
  resumeText: string | null;
};

export type JobSpecificAnalysisInput = {
  resumeText: string | null;
  jobTitle: string;
  company: string;
  jobDescription: string;
};

export interface ResumeAIProvider {
  analyzeResume(input: GeneralAnalysisInput): Promise<AIProviderResult>;
  analyzeResumeForJob(input: JobSpecificAnalysisInput): Promise<AIProviderResult>;
}
