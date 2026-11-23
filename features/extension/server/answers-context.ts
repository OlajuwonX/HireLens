import "server-only";

import { improvedResumeToText } from "@/features/analyses/server/analysis.mapper";
import { toJobPostingInput } from "@/features/analyses/server/job-input";
import { findApplicationRowForUser, type ApplicationRow } from "@/features/applications/server/application.repository";
import { readResumeVersionText } from "@/features/resumes/server/resume-text";
import { getOwnedResumeVersion, listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import { loadCandidateFacts, type CandidateFacts } from "@/features/worker/server/candidate-facts";
import { loadIntelligence } from "@/features/worker/server/task-payload";
import { describeJob } from "@/lib/ai/prompts/job-posting";

type Intelligence = Awaited<ReturnType<typeof loadIntelligence>>;

export function describeProfile(candidate: CandidateFacts["candidate"]) {
  const facts: [string, unknown][] = [
    ["Name", candidate.fullName],
    ["Email", candidate.email],
    ["Phone", candidate.phone],
    ["Location", candidate.location],
    ["LinkedIn", candidate.linkedinUrl],
    ["GitHub", candidate.githubUrl],
    ["Portfolio", candidate.portfolioUrl],
    ["Authorized to work in", candidate.authorizedCountries.join(", ")],
    ["Requires visa sponsorship", candidate.requiresSponsorship],
    ["Willing to relocate", candidate.willingToRelocate],
    ["Minimum salary", candidate.salaryMin === null ? null : `${candidate.salaryMin} ${candidate.salaryCurrency ?? ""}`.trim()],
    ["Notice period in weeks", candidate.noticePeriodWeeks],
    ["Years of experience", candidate.yearsExperience],
  ];

  return facts
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}`)
    .join("\n");
}

async function versionText(userId: string, versionPublicId: string | null) {
  const publicId = versionPublicId ?? (await listOwnedVersionOptions(userId))[0]?.publicId ?? null;
  const version = publicId ? await getOwnedResumeVersion({ userId, versionPublicId: publicId }) : null;

  return version ? readResumeVersionText({ userId, version }) : null;
}

async function resumeText(userId: string, row: ApplicationRow | null, intelligence: Intelligence) {
  if (intelligence && intelligence.improvedResume.experience.length > 0) {
    return improvedResumeToText(intelligence.improvedResume);
  }

  return versionText(userId, row?.versionPublicId ?? null);
}

export async function loadAnswersContext(input: { userId: string; applicationPublicId: string | null; pageText: string }) {
  const row = input.applicationPublicId
    ? await findApplicationRowForUser({ userId: input.userId, publicId: input.applicationPublicId })
    : null;
  const [facts, intelligence] = await Promise.all([
    loadCandidateFacts(input.userId),
    row ? loadIntelligence({ userId: input.userId, applicationId: row.application.id }) : Promise.resolve(null),
  ]);
  const resume = await resumeText(input.userId, row, intelligence);

  return resume
    ? {
        job: row ? describeJob(toJobPostingInput(row.job)) : ["<job_posting>", input.pageText || "Not available.", "</job_posting>"].join("\n"),
        profile: describeProfile(facts.candidate),
        savedAnswers: facts.answers,
        resume,
        coverLetter: intelligence?.coverLetter || null,
      }
    : null;
}
