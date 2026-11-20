import type { JobPostingInput } from "../types";
import { describeJob } from "./job-posting";

const LIMITS = { resume: 8_000, email: 3_000, gaps: 12 };

export function createPrepContent(input: {
  job: JobPostingInput;
  resume: string;
  gaps: string[];
  email: string | null;
}) {
  return [
    describeJob(input.job),
    ["<candidate_resume>", input.resume.slice(0, LIMITS.resume), "</candidate_resume>"].join("\n"),
    ["<known_gaps>", ...input.gaps.slice(0, LIMITS.gaps).map((gap) => `- ${gap}`), "</known_gaps>"].join("\n"),
    ["<employer_email>", (input.email ?? "Not available.").slice(0, LIMITS.email), "</employer_email>"].join("\n"),
  ].join("\n\n");
}
