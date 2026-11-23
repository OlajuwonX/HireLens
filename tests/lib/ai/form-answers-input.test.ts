import { describe, expect, it } from "vitest";
import { createFormAnswersContent, fitAnswer, type FormQuestion } from "@/lib/ai/prompts/form-answers-input";

const question = (overrides: Partial<FormQuestion> = {}): FormQuestion => ({
  id: "q1",
  label: "Why do you want this role?",
  kind: "textarea",
  required: true,
  options: [],
  maxLength: null,
  ...overrides,
});

describe("createFormAnswersContent", () => {
  it("lists each question with its id, kind, options and limit", () => {
    const content = createFormAnswersContent({
      job: "<job_posting>\nEngineer\n</job_posting>",
      profile: "Name: Ada",
      savedAnswers: [{ question: "Notice?", answer: "4 weeks" }],
      resume: "Built compilers",
      coverLetter: null,
      questions: [question(), question({ id: "q2", kind: "select", label: "Source", options: ["LinkedIn", "Other"], maxLength: 50 })],
    });

    expect(content).toContain("- id: q1\n  kind: TEXTAREA\n  required: yes\n  question: Why do you want this role?");
    expect(content).toContain('options: "LinkedIn", "Other"');
    expect(content).toContain("character limit: 50");
    expect(content).toContain("Q: Notice?\nA: 4 weeks");
    expect(content).toContain("<cover_letter>\nNone.\n</cover_letter>");
  });
});

describe("fitAnswer", () => {
  it("drops empty answers so the candidate answers them", () => {
    expect(fitAnswer(question(), "  ")).toBeNull();
  });

  it("only accepts an exact supplied option for choice questions", () => {
    const choice = question({ kind: "radio", options: ["Yes", "No"] });

    expect(fitAnswer(choice, "yes")).toBe("Yes");
    expect(fitAnswer(choice, "Maybe")).toBeNull();
  });

  it("respects the field's character limit", () => {
    expect(fitAnswer(question({ maxLength: 5 }), "Because I love it")).toBe("Becau");
  });
});
