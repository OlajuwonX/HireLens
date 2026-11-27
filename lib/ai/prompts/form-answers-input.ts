export type FormQuestionKind = "text" | "textarea" | "select" | "radio";

export type FormQuestion = {
  id: string;
  label: string;
  kind: FormQuestionKind;
  required: boolean;
  options: string[];
  maxLength: number | null;
};

export type FormAnswersContext = {
  job: string;
  profile: string;
  savedAnswers: { question: string; answer: string }[];
  resume: string;
  coverLetter: string | null;
  questions: FormQuestion[];
};

const LIMITS = { job: 12_000, resume: 10_000, coverLetter: 4_000, answers: 20, answer: 600 };

const block = (tag: string, body: string) => [`<${tag}>`, body, `</${tag}>`].join("\n");

function describeQuestion(question: FormQuestion) {
  return [
    `- id: ${question.id}`,
    `  kind: ${question.kind.toUpperCase()}`,
    `  required: ${question.required ? "yes" : "no"}`,
    `  question: ${question.label}`,
    question.options.length > 0 ? `  options: ${question.options.map((option) => JSON.stringify(option)).join(", ")}` : null,
    question.maxLength ? `  character limit: ${question.maxLength}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createFormAnswersContent(context: FormAnswersContext) {
  const saved = context.savedAnswers
    .slice(0, LIMITS.answers)
    .map((item) => `Q: ${item.question}\nA: ${item.answer.slice(0, LIMITS.answer)}`)
    .join("\n\n");

  return [
    context.job.slice(0, LIMITS.job),
    block("candidate_profile", context.profile),
    block("saved_answers", saved || "None."),
    block("candidate_resume", context.resume.slice(0, LIMITS.resume)),
    block("cover_letter", context.coverLetter?.slice(0, LIMITS.coverLetter) || "None."),
    block("questions", context.questions.map(describeQuestion).join("\n")),
  ].join("\n\n");
}

export function fitAnswer(question: FormQuestion, answer: string) {
  const text = answer.trim();

  if (!text) {
    return null;
  }

  if (question.options.length > 0) {
    return question.options.find((option) => option.trim().toLowerCase() === text.toLowerCase()) ?? null;
  }

  return question.maxLength ? text.slice(0, question.maxLength) : text;
}
