import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TaskPayload } from "../contract";

const run = promisify(execFile);
const MAX_ANSWER = 1_500;

export function draftPrompt(payload: TaskPayload, question: string) {
  return [
    "Draft a short, honest answer to a job application question.",
    "Use only facts from the candidate data below. Never invent experience, numbers or skills.",
    "If the data cannot answer the question, reply with exactly: SKIP",
    "",
    `Role: ${payload.job.title} at ${payload.job.company}`,
    `Question: ${question.slice(0, 300)}`,
    `Saved answers: ${JSON.stringify(payload.answers).slice(0, 4_000)}`,
    `Cover letter: ${(payload.coverLetter ?? "").slice(0, 4_000)}`,
  ].join("\n");
}

export function cleanDraft(output: string) {
  const text = output.trim();

  return !text || text === "SKIP" ? null : text.slice(0, MAX_ANSWER);
}

export function createClaudeWriter(payload: TaskPayload) {
  return async (question: string) => {
    try {
      const { stdout } = await run("claude", ["-p", draftPrompt(payload, question), "--output-format", "text"], {
        timeout: 120_000,
        maxBuffer: 1_000_000,
        windowsHide: true,
      });

      return cleanDraft(stdout);
    } catch {
      return null;
    }
  };
}
