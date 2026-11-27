import { describe, expect, it } from "vitest";
import { describeHelper } from "../src/popup/helper-status";
import { parseClaudeAnswers } from "../src/shared/claude-answers";
import type { Question } from "../src/shared/types";

const questions: Question[] = [
  { id: "#why", label: "Why us?", kind: "textarea", required: true, options: [], maxLength: 20 },
  { id: "#source", label: "Source", kind: "select", required: true, options: ["LinkedIn", "Referral"], maxLength: null },
  { id: "#skip", label: "Clearance?", kind: "text", required: false, options: [], maxLength: null },
];

describe("parseClaudeAnswers", () => {
  it("reads answers even when Claude wraps the JSON in text", () => {
    const text = 'Here you go:\n```json\n{"answers":[{"id":"#why","answer":"Because I love building tools"},{"id":"#source","answer":"linkedin"},{"id":"#skip","answer":""}]}\n```';

    expect(parseClaudeAnswers(text, questions)).toEqual([
      { id: "#why", answer: "Because I love build" },
      { id: "#source", answer: "LinkedIn" },
    ]);
  });

  it("ignores answers for questions that were not asked", () => {
    expect(parseClaudeAnswers('{"answers":[{"id":"#other","answer":"x"}]}', questions)).toEqual([]);
  });

  it("fails clearly when Claude replies without answers", () => {
    expect(() => parseClaudeAnswers("I cannot help with that.", questions)).toThrow("Claude did not reply with answers.");
  });
});

describe("describeHelper", () => {
  it("explains each helper state", () => {
    expect(describeHelper({ installed: false, claude: false })).toContain("pnpm helper:install");
    expect(describeHelper({ installed: true, claude: false })).toContain("Claude Code was not found");
    expect(describeHelper({ installed: true, claude: true })).toContain("ready");
  });
});
