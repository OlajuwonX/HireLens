import {
  BASE_SYSTEM_PROMPT,
  JOB_EXTRACTION_PROMPT,
  createApplicationIntelligencePrompt,
} from "../prompts";
import { AiProviderError } from "../provider-errors";
import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  siteUrl?: string;
  appName?: string;
};

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

function describeResume(input: ApplicationIntelligenceInput["resume"]) {
  return [
    "<resume_document>",
    `Filename: ${input.filename}`,
    input.text?.trim()
      ? input.text
      : "No extracted resume text was available. Analyze only from provided document metadata.",
    "</resume_document>",
  ].join("\n");
}

function statusMessage(status: number, body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    const error = body.error as { message?: unknown; code?: unknown };
    const detail =
      typeof error.message === "string" ? error.message : JSON.stringify(body);

    return detail.slice(0, 1000);
  }

  if (typeof body === "string" && body.trim()) {
    return body.slice(0, 1000);
  }

  return `OpenRouter request failed with HTTP ${status}`;
}

function extractResponseText(body: unknown) {
  if (!body || typeof body !== "object" || !("choices" in body)) {
    return null;
  }

  const choices = (body as { choices?: unknown }).choices;

  if (!Array.isArray(choices)) {
    return null;
  }

  const first = choices[0] as
    | { message?: { content?: unknown }; text?: unknown }
    | undefined;
  const content = first?.message?.content ?? first?.text;

  return typeof content === "string" && content.trim() ? content : null;
}

async function readBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return "";
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class OpenRouterApplicationIntelligenceProvider
  implements ApplicationIntelligenceProvider
{
  constructor(private readonly config: OpenRouterProviderConfig) {}

  private async complete(input: {
    system: string;
    user: string;
  }): Promise<AIProviderResult> {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          ...(this.config.siteUrl
            ? { "HTTP-Referer": this.config.siteUrl }
            : {}),
          ...(this.config.appName ? { "X-Title": this.config.appName } : {}),
        },
        body: JSON.stringify({
          model: this.config.model,
          provider: {
            data_collection: "deny",
            require_parameters: true,
          },
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const body = await readBody(response);

      if (!response.ok) {
        const errorBody =
          body && typeof body === "object" && "error" in body
            ? (body.error as { code?: unknown })
            : {};

        throw new AiProviderError(statusMessage(response.status, body), {
          provider: "openrouter",
          model: this.config.model,
          status: response.status,
          code:
            typeof errorBody.code === "string"
              ? errorBody.code
              : String(response.status),
        });
      }

      const text = extractResponseText(body);

      if (!text) {
        throw new AiProviderError("OpenRouter returned no text content", {
          provider: "openrouter",
          model: this.config.model,
          retryable: false,
        });
      }

      return {
        provider: "openrouter",
        model: this.config.model,
        rawResponse: text,
        durationMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }

      throw new AiProviderError(
        error instanceof DOMException && error.name === "AbortError"
          ? "OpenRouter request timed out"
          : error instanceof Error
            ? error.message
            : "OpenRouter request failed",
        {
          provider: "openrouter",
          model: this.config.model,
          cause: error,
          retryable: true,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    return this.complete({
      system: JOB_EXTRACTION_PROMPT,
      user: `<job_posting_document>\n${input.content}\n</job_posting_document>`,
    });
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
    return this.complete({
      system: [
        BASE_SYSTEM_PROMPT,
        "",
        createApplicationIntelligencePrompt(input.priorCorrections),
      ].join("\n"),
      user: [describeResume(input.resume), "", describeJob(input.job)].join(
        "\n",
      ),
    });
  }
}
