export const MATCH_DESCRIPTION_CHARS = 1_800;
export const MATCH_RESUME_CHARS = 8_000;

export type MatchJobInput = {
  ref: string;
  title: string;
  company: string;
  location: string | null;
  arrangement: string;
  description: string;
};

export type MatchContentInput = {
  profile: string[];
  resume: string;
  jobs: MatchJobInput[];
};

function job(input: MatchJobInput) {
  return [
    `<job ref="${input.ref}">`,
    `Title: ${input.title}`,
    `Company: ${input.company}`,
    `Location: ${input.location ?? "Not stated"} (${input.arrangement})`,
    input.description.slice(0, MATCH_DESCRIPTION_CHARS),
    "</job>",
  ].join("\n");
}

export function createMatchContent(input: MatchContentInput) {
  return [
    ["<candidate_profile>", ...input.profile.map((line) => `- ${line}`), "</candidate_profile>"].join("\n"),
    ["<candidate_resume>", input.resume.slice(0, MATCH_RESUME_CHARS), "</candidate_resume>"].join("\n"),
    ...input.jobs.map(job),
  ].join("\n\n");
}
