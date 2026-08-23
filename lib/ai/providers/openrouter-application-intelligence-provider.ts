import {
  BASE_SYSTEM_PROMPT,
  JOB_EXTRACTION_PROMPT,
  createApplicationIntelligencePrompt,
} from "../prompts";
import { toStrictJsonSchema } from "../json-schema";
import { AiProviderError, type AiFailureClass } from "../provider-errors";
import { applicationIntelligenceSchema } from "../schemas/application-intelligence.schema";
import { extractedJobSchema } from "../schemas/job-extraction.schema";
import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const ANALYSIS_SCHEMA = toStrictJsonSchema(applicationIntelligenceSchema);
const EXTRACTION_SCHEMA = toStrictJsonSchema(extractedJobSchema);

export type OpenRouterProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  allowDataCollection?: boolean;
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

function describeResume(resume: ApplicationIntelligenceInput["resume"]) {
  return [
    "<resume_document>",
    `Filename: ${resume.filename}`,
    resume.text ?? "",
    "</resume_document>",
  ].join("\n");
}

function statusMessage(status: number, body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    const error = body.error as { message?: unknown };
    const detail =
      typeof error.message === "string" ? error.message : JSON.stringify(body);

    return detail.slice(0, 1000);
  }

  if (typeof body === "string" && body.trim()) {
    return body.slice(0, 1000);
  }

  return `OpenRouter request failed with HTTP ${status}`;
}

function errorCode(body: unknown, status: number) {
  if (body && typeof body === "object" && "error" in body) {
    const code = (body.error as { code?: unknown }).code;

    if (typeof code === "string" || typeof code === "number") {
      return String(code);
    }
  }

  return String(status);
}

function firstChoice(body: unknown) {
  if (!body || typeof body !== "object" || !("choices" in body)) {
    return null;
  }

  const choices = (body as { choices?: unknown }).choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  return choices[0] as {
    message?: { content?: unknown };
    text?: unknown;
    finish_reason?: unknown;
  };
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

  private fail(
    message: string,
    options: {
      status?: number | null;
      code?: string | null;
      cause?: unknown;
      failureClass?: AiFailureClass;
    } = {},
  ) {
    return new AiProviderError(message, {
      provider: "openrouter",
      model: this.config.model,
      ...options,
    });
  }

  private async complete(input: {
    system: string;
    user: string;
    schemaName: string;
    schema: Record<string, unknown>;
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
          provider: this.config.allowDataCollection
            ? { require_parameters: true }
            : { data_collection: "deny", require_parameters: true },
          max_tokens: this.config.maxOutputTokens,
          reasoning: { enabled: false },
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: input.schemaName,
              strict: true,
              schema: input.schema,
            },
          },
        }),
      });

      const body = await readBody(response);

      if (!response.ok) {
        throw this.fail(statusMessage(response.status, body), {
          status: response.status,
          code: errorCode(body, response.status),
        });
      }

      const choice = firstChoice(body);
      const content = choice?.message?.content ?? choice?.text;
      const reason =
        typeof choice?.finish_reason === "string" ? choice.finish_reason : null;

      if (typeof content !== "string" || !content.trim()) {
        throw this.fail(
          `OpenRouter returned no usable content (finishReason=${reason ?? "unknown"})`,
          {
            code: reason,
            failureClass: reason === "length" ? "INVALID_OUTPUT" : "TRANSIENT",
          },
        );
      }

      if (reason === "length") {
        throw this.fail("OpenRouter response was truncated before completion", {
          code: reason,
          failureClass: "INVALID_OUTPUT",
        });
      }

      return {
        provider: "openrouter",
        model: this.config.model,
        rawResponse: content,
        durationMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }

      const aborted =
        error instanceof DOMException && error.name === "AbortError";

      throw this.fail(
        aborted
          ? "OpenRouter request timed out"
          : error instanceof Error
            ? error.message
            : "OpenRouter request failed",
        {
          code: aborted ? "TIMEOUT" : null,
          cause: error,
          failureClass: "TRANSIENT",
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
      schemaName: "extracted_job",
      schema: EXTRACTION_SCHEMA,
    });
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
    if (!input.resume.text?.trim()) {
      throw this.fail("No resume text was available for a text-only provider", {
        code: "NO_RESUME_TEXT",
        failureClass: "PERMANENT",
      });
    }

    return this.complete({
      system: [
        BASE_SYSTEM_PROMPT,
        "",
        createApplicationIntelligencePrompt(input.priorCorrections),
      ].join("\n"),
      user: [describeResume(input.resume), "", describeJob(input.job)].join(
        "\n",
      ),
      schemaName: "application_intelligence",
      schema: ANALYSIS_SCHEMA,
    });
  }
}
