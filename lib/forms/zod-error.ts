import type { ZodError } from "zod";

export function firstIssueMessage(error: ZodError, fallback: string) {
  const issue = error.issues[0];

  if (!issue) {
    return fallback;
  }

  const field = issue.path.join(".");

  return field ? `${field}: ${issue.message}` : issue.message;
}

export function fieldErrorsFrom(error: ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");

    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
