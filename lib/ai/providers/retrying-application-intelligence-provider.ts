import {
  AiProviderError,
  AiProviderChainError,
  isRetryableProviderError,
  toAttemptFailure,
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

export type RetryingProviderConfig = {
  providers: NamedProvider[];
  maxRetries: number;
  timeoutMs: number;
  baseDelayMs?: number;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
                retryable: true,
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

function backoffDelay(attempt: number, baseDelayMs: number) {
  const jitter = Math.floor(Math.random() * baseDelayMs);
  return baseDelayMs * 2 ** Math.max(0, attempt - 1) + jitter;
}

export class RetryingApplicationIntelligenceProvider
  implements ApplicationIntelligenceProvider
{
  private readonly baseDelayMs: number;

  constructor(private readonly config: RetryingProviderConfig) {
    this.baseDelayMs = config.baseDelayMs ?? 250;
  }

  async extractJobPosting(input: {
    content: string;
  }): Promise<AIProviderResult> {
    return this.run((provider) => provider.extractJobPosting(input));
  }

  async analyzeApplication(
    input: ApplicationIntelligenceInput,
  ): Promise<AIProviderResult> {
    return this.run((provider) => provider.analyzeApplication(input));
  }

  private async run(
    call: (provider: ApplicationIntelligenceProvider) => Promise<AIProviderResult>,
  ) {
    const failures = [];

    for (const candidate of this.config.providers) {
      for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
        try {
          return await withTimeout(
            call(candidate.provider),
            this.config.timeoutMs,
            candidate.providerName,
            candidate.model,
          );
        } catch (error) {
          const failure = toAttemptFailure({
            error,
            provider: candidate.providerName,
            model: candidate.model,
            attempt,
          });
          failures.push(failure);

          console.error("AI provider attempt failed", {
            provider: failure.provider,
            model: failure.model,
            attempt: failure.attempt,
            status: failure.status,
            code: failure.code,
            retryable: failure.retryable,
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
            fallbackTriggered:
              attempt === this.config.maxRetries + 1 &&
              candidate !== this.config.providers.at(-1),
          });

          if (
            !isRetryableProviderError(error) ||
            attempt > this.config.maxRetries
          ) {
            break;
          }

          await delay(backoffDelay(attempt, this.baseDelayMs));
        }
      }
    }

    throw new AiProviderChainError("All configured AI providers failed", failures);
  }
}
