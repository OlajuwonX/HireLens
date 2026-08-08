export type AIProviderName = "puter" | "gemini" | "mock";

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

export type GeneralAnalysisInput = {
  resume: ResumeDocumentInput;
};

export type JobSpecificAnalysisInput = {
  resume: ResumeDocumentInput;
  jobTitle: string;
  company: string;
  jobDescription: string;
};

export interface ResumeAIProvider {
  analyzeResume(input: GeneralAnalysisInput): Promise<AIProviderResult>;
  analyzeResumeForJob(input: JobSpecificAnalysisInput): Promise<AIProviderResult>;
}
