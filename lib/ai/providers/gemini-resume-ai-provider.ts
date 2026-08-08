import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { toGeminiResponseSchema } from "../gemini-json-schema";
import { jobFitAnalysisSchema } from "../schemas/job-fit-analysis.schema";
import { generalResumeAnalysisSchema } from "../schemas/resume-analysis.schema";
import {
  createGeneralAnalysisPrompt,
  createJobSpecificAnalysisPrompt,
} from "../prompts";
import type {
  AIProviderResult,
  GeneralAnalysisInput,
  JobSpecificAnalysisInput,
  ResumeAIProvider,
  ResumeDocumentInput,
} from "../types";

export type GeminiResumeAIProviderConfig = {
  apiKey: string;
  model: string;
};

export class GeminiResumeAIProvider implements ResumeAIProvider {
  private readonly client: GoogleGenAI;

  constructor(private readonly config: GeminiResumeAIProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async analyzeResume(input: GeneralAnalysisInput): Promise<AIProviderResult> {
    return this.analyze({
      system: createGeneralAnalysisPrompt(),
      resume: input.resume,
      instruction: "Produce a general audit of this resume.",
      schema: generalResumeAnalysisSchema,
    });
  }

  async analyzeResumeForJob(
    input: JobSpecificAnalysisInput,
  ): Promise<AIProviderResult> {
    return this.analyze({
      system: createJobSpecificAnalysisPrompt(),
      resume: input.resume,
      instruction: [
        "Analyze this resume against the following job posting.",
        "",
        "<job_posting>",
        `Title: ${input.jobTitle}`,
        `Company: ${input.company}`,
        "Description:",
        input.jobDescription,
        "</job_posting>",
      ].join("\n"),
      schema: jobFitAnalysisSchema,
    });
  }

  private async analyze(input: {
    system: string;
    resume: ResumeDocumentInput;
    instruction: string;
    schema: z.ZodType;
  }): Promise<AIProviderResult> {
    const startedAt = performance.now();

    const response = await this.client.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: input.resume.pdfBase64,
              },
            },
            { text: input.instruction },
          ],
        },
      ],
      config: {
        systemInstruction: input.system,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiResponseSchema(input.schema),
      },
    });

    const durationMs = Math.round(performance.now() - startedAt);
    const text = response.text;

    if (!text) {
      throw new Error("The model returned no analysis content");
    }

    return {
      provider: "gemini",
      model: this.config.model,
      rawResponse: text,
      durationMs,
    };
  }
}
