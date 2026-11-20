import type { JobPostingInput } from "../types";

export function describeJob(job: JobPostingInput) {
  const lines = [
    "<job_posting>",
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location ?? "Not stated"}`,
    `Work arrangement: ${job.workArrangement}`,
    `Employment type: ${job.employmentType}`,
    `Deadline: ${job.deadline ?? "Not stated"}`,
    `Source: ${job.source ?? "Not stated"}`,
    `Posting URL: ${job.sourceUrl ?? "Not stated"}`,
    "Description:",
    job.description,
  ];

  if (job.requirements) {
    lines.push("Stated requirements:", job.requirements);
  }

  lines.push("</job_posting>");

  return lines.join("\n");
}
