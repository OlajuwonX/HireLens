import { GoogleGenAI } from "@google/genai";
import { toGeminiResponseSchema } from "../gemini-json-schema";
import { applicationIntelligenceSchema } from "../schemas/application-intelligence.schema";
import {
  BASE_SYSTEM_PROMPT,
  JOB_EXTRACTION_PROMPT,
  createApplicationIntelligencePrompt,
} from "../prompts";
import { extractedJobSchema } from "../schemas/job-extraction.schema";
import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

function describeEmptyResponse(response: {
  candidates?: { finishReason?: unknown }[];
  usageMetadata?: {
    thoughtsTokenCount?: number;
    candidatesTokenCount?: number;
  };
}) {
  const finishReason = String(
    response.candidates?.[0]?.finishReason ?? "unknown",
  );
  const thoughts = response.usageMetadata?.thoughtsTokenCount ?? 0;
  const output = response.usageMetadata?.candidatesTokenCount ?? 0;

  return [
    "The model returned no content",
    `(finishReason=${finishReason},`,
    `thinkingTokens=${thoughts},`,
    `outputTokens=${output})`,
  ].join(" ");
}

function describeJob(job: ApplicationIntelligenceInput["job"]) {
  const lines = [
    "<job_posting>",
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location ?? "Not stated"}`,
    `Work arrangement: ${job.workArrangement}`,
    `Employment type: ${job.employmentType}`,
    `Deadline: ${job.deadline ?? "Not stated"}`,
    `Source: ${job.source ?? "Not stated"}`,
    `Posting URL: ${job.sourceUrl ?? "Not stated"}`,
    "Description:",
    job.description,
  ];

  if (job.requirements) {
    lines.push("Stated requirements:", job.requirements);
  }

  lines.push("</job_posting>");

  return lines.join("\n");
}

export type GeminiProviderConfig = {
  apiKey: string;
  model: string;
};

export class GeminiApplicationIntelligenceProvider
  implements ApplicationIntelligenceProvider
{
  private readonly client: GoogleGenAI;

  constructor(private readonly config: GeminiProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    const startedAt = performance.now();

    const response = await this.client.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `<job_posting_document>\n${input.content}\n</job_posting_document>`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: JOB_EXTRACTION_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiResponseSchema(extractedJobSchema),
      },
    });

    const durationMs = Math.round(performance.now() - startedAt);
    const text = response.text;

    if (!text) {
      throw new Error(describeEmptyResponse(response));
    }

    return {
      provider: "gemini",
      model: this.config.model,
      rawResponse: text,
      durationMs,
    };
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
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
            { text: describeJob(input.job) },
          ],
        },
      ],
      config: {
        systemInstruction: [
          BASE_SYSTEM_PROMPT,
          "",
          createApplicationIntelligencePrompt(input.priorCorrections),
        ].join("\n"),
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiResponseSchema(
          applicationIntelligenceSchema,
        ),
      },
    });

    const durationMs = Math.round(performance.now() - startedAt);
    const text = response.text;

    if (!text) {
      throw new Error(describeEmptyResponse(response));
    }

    return {
      provider: "gemini",
      model: this.config.model,
      rawResponse: text,
      durationMs,
    };
  }
}
