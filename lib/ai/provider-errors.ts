export type AiProviderErrorOptions = {
  provider: string;
  model: string;
  status?: number | null;
  code?: string | null;
  cause?: unknown;
  retryable?: boolean;
};

export class AiProviderError extends Error {
  readonly provider: string;
  readonly model: string;
  readonly status: number | null;
  readonly code: string | null;
  readonly retryable: boolean;

  constructor(message: string, options: AiProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AiProviderError";
    this.provider = options.provider;
    this.model = options.model;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.retryable =
      options.retryable ?? isRetryableStatus(options.status ?? null);
  }
}

export class AiProviderChainError extends Error {
  readonly attempts: AiAttemptFailure[];

  constructor(message: string, attempts: AiAttemptFailure[]) {
    super(message, { cause: attempts.at(-1)?.cause });
    this.name = "AiProviderChainError";
    this.attempts = attempts;
  }
}

export type AiAttemptFailure = {
  provider: string;
  model: string;
  attempt: number;
  status: number | null;
  code: string | null;
  retryable: boolean;
  message: string;
  cause?: unknown;
};

export function isRetryableStatus(status: number | null) {
  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

export function isRetryableProviderError(error: unknown) {
  if (error instanceof AiProviderError) {
    return error.retryable;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof TypeError && error.message === "fetch failed") {
    return true;
  }

  return false;
}

export function toAttemptFailure(input: {
  error: unknown;
  provider: string;
  model: string;
  attempt: number;
}): AiAttemptFailure {
  const error = input.error;

  if (error instanceof AiProviderError) {
    return {
      provider: error.provider,
      model: error.model,
      attempt: input.attempt,
      status: error.status,
      code: error.code,
      retryable: error.retryable,
      message: error.message,
      cause: error.cause,
    };
  }

  return {
    provider: input.provider,
    model: input.model,
    attempt: input.attempt,
    status: null,
    code: null,
    retryable: isRetryableProviderError(error),
    message: error instanceof Error ? error.message : String(error ?? "unknown"),
    cause: error instanceof Error ? error.cause : undefined,
  };
}
