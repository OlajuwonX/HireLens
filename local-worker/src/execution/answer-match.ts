import { normalizeText } from "./fields";

const STOP_WORDS = new Set(["a", "an", "the", "you", "your", "to", "do", "of", "in", "at", "for", "is", "are", "and", "or", "us", "our", "we", "this", "please"]);
export const ANSWER_THRESHOLD = 0.6;

function words(value: string) {
  return new Set(normalizeText(value).split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word)));
}

export function similarity(a: string, b: string) {
  const left = words(a);
  const right = words(b);
  const shared = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;

  return union === 0 ? 0 : shared / union;
}

export function findAnswer(label: string, answers: { question: string; answer: string }[]) {
  const ranked = answers
    .map((entry) => ({ entry, score: similarity(label, entry.question) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0] && ranked[0].score >= ANSWER_THRESHOLD ? ranked[0].entry.answer : null;
}
