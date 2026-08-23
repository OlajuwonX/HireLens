export type AiFailureClass =
  | "RATE_LIMIT"
  | "TRANSIENT"
  | "INVALID_OUTPUT"
  | "PERMANENT";

export type AiProviderErrorOptions = {
  provider: string;
  model: string;
  status?: number | null;
  code?: string | null;
  cause?: unknown;
  failureClass?: AiFailureClass;
};

export function classifyStatus(status: number | null): AiFailureClass {
  if (status === 429 || status === 402) {
    return "RATE_LIMIT";
  }

  if (
    status === 408 ||
    status === 409 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return "TRANSIENT";
  }

  return "PERMANENT";
}

export class AiProviderError extends Error {
  readonly provider: string;
  readonly model: string;
  readonly status: number | null;
  readonly code: string | null;
  readonly failureClass: AiFailureClass;

  constructor(message: string, options: AiProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AiProviderError";
    this.provider = options.provider;
    this.model = options.model;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.failureClass =
      options.failureClass ?? classifyStatus(options.status ?? null);
  }

  get retryable() {
    return this.failureClass === "TRANSIENT";
  }
}

export type AiAttemptFailure = {
  provider: string;
  model: string;
  attempt: number;
  status: number | null;
  code: string | null;
  failureClass: AiFailureClass;
  message: string;
  cause?: unknown;
};

export class AiProviderChainError extends Error {
  readonly attempts: AiAttemptFailure[];

  constructor(message: string, attempts: AiAttemptFailure[]) {
    super(message, { cause: attempts.at(-1)?.cause });
    this.name = "AiProviderChainError";
    this.attempts = attempts;
  }

  get exhaustedQuota() {
    return this.attempts.some(
      (attempt) => attempt.failureClass === "RATE_LIMIT",
    );
  }
}

export function classifyProviderFailure(error: unknown): AiFailureClass {
  if (error instanceof AiProviderError) {
    return error.failureClass;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "TRANSIENT";
  }

  if (error instanceof TypeError && error.message === "fetch failed") {
    return "TRANSIENT";
  }

  return "PERMANENT";
}

export function isRetryableProviderError(error: unknown) {
  return classifyProviderFailure(error) === "TRANSIENT";
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
      failureClass: error.failureClass,
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
    failureClass: classifyProviderFailure(error),
    message: error instanceof Error ? error.message : String(error ?? "unknown"),
    cause: error instanceof Error ? error.cause : undefined,
  };
}
