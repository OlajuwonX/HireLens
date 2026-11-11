import type { JobPostingInput } from "../types";
import { describeJob } from "./job-posting";

export type ReviewContentInput = {
  sourceEvidence: string;
  corrections: string[];
  job: JobPostingInput;
  optimizedResume: string;
  findings: string[];
};

function block(tag: string, lines: string[]) {
  return [`<${tag}>`, ...(lines.length > 0 ? lines : ["None."]), `</${tag}>`].join("\n");
}

export function createReviewContent(input: ReviewContentInput) {
  return [
    input.sourceEvidence,
    block("candidate_corrections", input.corrections.map((line) => `- ${line}`)),
    describeJob(input.job),
    block("optimized_resume", [input.optimizedResume]),
    block("automated_findings", input.findings.map((line) => `- ${line}`)),
  ].join("\n\n");
}
