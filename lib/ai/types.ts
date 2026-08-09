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

export type GeneralAnalysisInput = {
  resume: ResumeDocumentInput;
};

export type EvidenceCorrection = {
  requirement: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
};

export type JobSpecificAnalysisInput = {
  resume: ResumeDocumentInput;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string | null;
  priorCorrections: EvidenceCorrection[];
};

export type ApplicationDocumentInput = {
  documentType: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string | null;
  resumeLabel: string | null;
  resumeText: string | null;
  applicationStatus: string | null;
  notes: string | null;
};

export interface ResumeAIProvider {
  analyzeResume(input: GeneralAnalysisInput): Promise<AIProviderResult>;
  analyzeResumeForJob(input: JobSpecificAnalysisInput): Promise<AIProviderResult>;
  generateApplicationDocument(
    input: ApplicationDocumentInput,
  ): Promise<AIProviderResult>;
}
