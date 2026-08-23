import { GoogleGenAI } from "@google/genai";
import { toGeminiResponseSchema } from "../gemini-json-schema";
import { applicationIntelligenceSchema } from "../schemas/application-intelligence.schema";
import {
  BASE_SYSTEM_PROMPT,
  JOB_EXTRACTION_PROMPT,
  createApplicationIntelligencePrompt,
} from "../prompts";
import { extractedJobSchema } from "../schemas/job-extraction.schema";
import { AiProviderError } from "../provider-errors";
import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

function statusOf(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const candidate = error as { status?: unknown; code?: unknown };

  for (const value of [candidate.status, candidate.code]) {
    if (typeof value === "number") {
      return value;
    }
  }

  return null;
}

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

export class GeminiApplicationIntelligenceProvider implements ApplicationIntelligenceProvider {
  private readonly client: GoogleGenAI;

  constructor(private readonly config: GeminiProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  private async send(
    request: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  ) {
    try {
      return await this.client.models.generateContent(request);
    } catch (error) {
      const status = statusOf(error);

      throw new AiProviderError(
        error instanceof Error ? error.message : "Gemini request failed",
        {
          provider: "gemini",
          model: this.config.model,
          status,
          cause: error,
          failureClass: status === null ? "TRANSIENT" : undefined,
        },
      );
    }
  }

  private emptyResponse(response: Parameters<typeof describeEmptyResponse>[0]) {
    return new AiProviderError(describeEmptyResponse(response), {
      provider: "gemini",
      model: this.config.model,
      code: "EMPTY_RESPONSE",
      failureClass: "TRANSIENT",
    });
  }

  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    const startedAt = performance.now();

    const response = await this.send({
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
      throw this.emptyResponse(response);
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

    const response = await this.send({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: Buffer.from(input.resume.pdfBytes).toString("base64"),
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
      throw this.emptyResponse(response);
    }

    return {
      provider: "gemini",
      model: this.config.model,
      rawResponse: text,
      durationMs,
    };
  }
}
