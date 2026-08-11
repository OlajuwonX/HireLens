import { z } from "zod";

export function normalizeJsonModelOutput<TSchema extends z.ZodType>(
  rawResponse: unknown,
  schema: TSchema,
): z.infer<TSchema> {
  const content = extractTextContent(rawResponse);
  const jsonText = stripJsonCodeFence(content);
  const parsed = JSON.parse(jsonText) as unknown;

  return schema.parse(parsed);
}

function extractTextContent(rawResponse: unknown): string {
  if (typeof rawResponse === "string") {
    return rawResponse;
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "content" in rawResponse &&
    typeof rawResponse.content === "string"
  ) {
    return rawResponse.content;
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "message" in rawResponse &&
    rawResponse.message &&
    typeof rawResponse.message === "object" &&
    "content" in rawResponse.message &&
    typeof rawResponse.message.content === "string"
  ) {
    return rawResponse.message.content;
  }

  throw new Error("AI response did not contain text content");
}

function stripJsonCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}
