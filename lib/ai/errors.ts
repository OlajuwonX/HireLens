export function describeAiFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown AI failure";
  }

  const detail = error.message?.trim();

  return (detail ? `${error.name}: ${detail}` : error.name).slice(0, 1000);
}

function statusCodeOf(error: unknown) {
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

export type AiFailureKind =
  "DAILY_QUOTA" | "RATE_LIMIT" | "OVERLOADED" | "UNKNOWN";

export function classifyAiFailure(error: unknown): AiFailureKind {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const status = statusCodeOf(error);
  const exhausted =
    status === 429 ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes('"code":429');

  if (exhausted) {
    return /PerDay|per day|free_tier_requests/i.test(raw)
      ? "DAILY_QUOTA"
      : "RATE_LIMIT";
  }

  if (
    status === 503 ||
    raw.includes("UNAVAILABLE") ||
    raw.includes("overloaded")
  ) {
    return "OVERLOADED";
  }

  return "UNKNOWN";
}

export function aiFailureMessage(error: unknown, fallback: string) {
  switch (classifyAiFailure(error)) {
    case "DAILY_QUOTA":
      return "The daily AI limit has been reached. Try again tomorrow.";
    case "RATE_LIMIT":
      return "Too many AI requests right now. Wait a moment and try again.";
    case "OVERLOADED":
      return "The AI service is busy. Try again in a minute.";
    default:
      return fallback;
  }
}
