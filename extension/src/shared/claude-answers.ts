import { fitAnswer } from "../../../lib/ai/prompts/form-answers-input";
import type { Question } from "./types";

type RawAnswer = { id?: unknown; answer?: unknown };

function readJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("Claude did not reply with answers.");
  }

  return JSON.parse(text.slice(start, end + 1)) as { answers?: unknown };
}

export function parseClaudeAnswers(text: string, questions: Question[]) {
  const parsed = readJson(text);

  if (!Array.isArray(parsed.answers)) {
    throw new Error("Claude did not reply with answers.");
  }

  const byId = new Map(
    (parsed.answers as RawAnswer[])
      .filter((item) => typeof item.id === "string" && typeof item.answer === "string")
      .map((item) => [item.id as string, item.answer as string]),
  );

  return questions.flatMap((question) => {
    const answer = fitAnswer(question, byId.get(question.id) ?? "");

    return answer ? [{ id: question.id, answer }] : [];
  });
}
