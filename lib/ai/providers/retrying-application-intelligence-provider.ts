import {
  AiProviderChainError,
  AiProviderError,
  classifyProviderFailure,
  toAttemptFailure,
  type AiAttemptFailure,
} from "../provider-errors";
import type {
  AIProviderResult,
  ApplicationIntelligenceInput,
  ApplicationIntelligenceProvider,
} from "../types";

export type NamedProvider = {
  provider: ApplicationIntelligenceProvider;
  providerName: string;
  model: string;
};

export type ResponseValidator = (rawResponse: unknown) => void;

export type RetryingProviderConfig = {
  providers: NamedProvider[];
  maxRetries: number;
  timeoutMs: number;
  totalBudgetMs?: number;
  extractionTimeoutMs?: number;
  extractionBudgetMs?: number;
  baseDelayMs?: number;
  validateAnalysis?: ResponseValidator;
  validateExtraction?: ResponseValidator;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number, baseDelayMs: number) {
  const jitter = Math.floor(Math.random() * baseDelayMs);

  return baseDelayMs * 2 ** Math.max(0, attempt - 1) + jitter;
}

async function withTimeout<T>(
  work: Promise<T>,
  ms: number,
  provider: string,
  model: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new AiProviderError("AI provider request timed out", {
                provider,
                model,
                code: "TIMEOUT",
                failureClass: "TRANSIENT",
              }),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class RetryingApplicationIntelligenceProvider
  implements ApplicationIntelligenceProvider
{
  private readonly baseDelayMs: number;
  private readonly totalBudgetMs: number;

  constructor(private readonly config: RetryingProviderConfig) {
    this.baseDelayMs = config.baseDelayMs ?? 250;
    this.totalBudgetMs =
      config.totalBudgetMs ??
      config.timeoutMs * config.providers.length * (config.maxRetries + 1);
  }

  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    return this.run(
      (provider) => provider.extractJobPosting(input),
      this.config.validateExtraction,
      {
        timeoutMs: this.config.extractionTimeoutMs ?? this.config.timeoutMs,
        budgetMs: this.config.extractionBudgetMs ?? this.totalBudgetMs,
      },
    );
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
    return this.run(
      (provider) => provider.analyzeApplication(input),
      this.config.validateAnalysis,
      { timeoutMs: this.config.timeoutMs, budgetMs: this.totalBudgetMs },
    );
  }

  private async run(
    call: (
      provider: ApplicationIntelligenceProvider,
    ) => Promise<AIProviderResult>,
    validate?: ResponseValidator,
    budget: { timeoutMs: number; budgetMs: number } = {
      timeoutMs: this.config.timeoutMs,
      budgetMs: this.totalBudgetMs,
    },
  ) {
    const deadline = Date.now() + budget.budgetMs;
    const reserveMs = Math.min(
      budget.timeoutMs,
      Math.floor(budget.budgetMs / 3),
    );
    const failures: AiAttemptFailure[] = [];
    const exhausted = new Set<string>();
    const candidates = this.config.providers;

    for (let index = 0; index < candidates.length; index++) {
      const candidate = candidates[index];

      if (exhausted.has(candidate.providerName)) {
        continue;
      }

      const isFinal = index === candidates.length - 1;
      const candidateDeadline = isFinal ? deadline : deadline - reserveMs;

      for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
        const remaining = candidateDeadline - Date.now();

        if (remaining <= 0) {
          failures.push({
            provider: candidate.providerName,
            model: candidate.model,
            attempt,
            status: null,
            code: "BUDGET_EXHAUSTED",
            failureClass: "TRANSIENT",
            message: "AI time budget was exhausted before this attempt",
          });

          break;
        }

        try {
          const result = await withTimeout(
            call(candidate.provider),
            Math.min(budget.timeoutMs, remaining),
            candidate.providerName,
            candidate.model,
          );

          if (validate) {
            this.validateOrThrow(validate, result, candidate);
          }

          return result;
        } catch (error) {
          const failure = toAttemptFailure({
            error,
            provider: candidate.providerName,
            model: candidate.model,
            attempt,
          });

          failures.push(failure);
          this.logAttempt(failure, candidate);

          if (failure.failureClass === "RATE_LIMIT") {
            exhausted.add(candidate.providerName);
            break;
          }

          if (
            failure.code === "TIMEOUT" ||
            classifyProviderFailure(error) !== "TRANSIENT" ||
            attempt > this.config.maxRetries
          ) {
            break;
          }

          await delay(backoffDelay(attempt, this.baseDelayMs));
        }
      }

      if (Date.now() >= deadline) {
        break;
      }
    }

    return this.giveUp(failures);
  }

  private validateOrThrow(
    validate: ResponseValidator,
    result: AIProviderResult,
    candidate: NamedProvider,
  ) {
    try {
      validate(result.rawResponse);
    } catch (error) {
      throw new AiProviderError(
        error instanceof Error
          ? `Model output failed validation: ${error.message}`
          : "Model output failed validation",
        {
          provider: candidate.providerName,
          model: candidate.model,
          code: "INVALID_OUTPUT",
          failureClass: "INVALID_OUTPUT",
          cause: error,
        },
      );
    }
  }

  private logAttempt(failure: AiAttemptFailure, candidate: NamedProvider) {
    console.error("AI provider attempt failed", {
      provider: failure.provider,
      model: failure.model,
      attempt: failure.attempt,
      status: failure.status,
      code: failure.code,
      failureClass: failure.failureClass,
      message: failure.message,
      cause:
        failure.cause instanceof Error
          ? {
              name: failure.cause.name,
              message: failure.cause.message,
              code:
                "code" in failure.cause
                  ? (failure.cause as { code?: unknown }).code
                  : undefined,
            }
          : undefined,
      hasFallback: candidate !== this.config.providers.at(-1),
    });
  }

  private giveUp(failures: AiAttemptFailure[]): never {
    throw new AiProviderChainError(
      "All configured AI providers failed",
      failures,
    );
  }
}
