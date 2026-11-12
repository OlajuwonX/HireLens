import "server-only";

import { seniorityLabels, type Seniority } from "@/features/candidate-profile/constants";
import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import { readResumeVersionText } from "@/features/resumes/server/resume-text";
import {
  getOwnedResumeVersion,
  listOwnedVersionOptions,
} from "@/features/resumes/server/resume-version.service";
import { hashAnalysisInput } from "@/lib/ai/hash";
import { JOB_MATCHING_PROMPT_VERSION } from "@/lib/ai/prompts/job-matching.prompt";
import type { CandidateProfile } from "@/lib/db/schema";
import type { EligibilityProfile } from "@/lib/matching/eligibility";

function toEligibility(profile: CandidateProfile | null): EligibilityProfile | null {
  return profile
    ? {
        seniority: profile.seniority,
        currentLocation: profile.currentLocation,
        targetLocations: profile.targetLocations,
        workArrangements: profile.workArrangements,
        authorizedCountries: profile.authorizedCountries,
        requiresSponsorship: profile.requiresSponsorship,
        willingToRelocate: profile.willingToRelocate ?? false,
      }
    : null;
}

function promptLines(profile: CandidateProfile | null) {
  if (!profile) {
    return ["No career profile saved; judge from the resume alone."];
  }

  return [
    profile.targetRoles.length > 0 ? `Target roles: ${profile.targetRoles.join(", ")}` : null,
    profile.seniority ? `Level: ${seniorityLabels[profile.seniority as Seniority] ?? profile.seniority}` : null,
    profile.yearsExperience !== null ? `Years of experience: ${profile.yearsExperience}` : null,
  ].filter((line): line is string => line !== null);
}

export async function loadCandidate(userId: string) {
  const [option] = await listOwnedVersionOptions(userId);
  const version = option
    ? await getOwnedResumeVersion({ userId, versionPublicId: option.publicId })
    : null;
  const resumeText = version ? await readResumeVersionText({ userId, version }) : null;

  if (!version || !resumeText) {
    return null;
  }

  const profile = await findProfileByUser(userId);
  const eligibility = toEligibility(profile);
  const profileLines = promptLines(profile);
  const inputHash = await hashAnalysisInput({
    promptVersion: JOB_MATCHING_PROMPT_VERSION,
    versionId: version.id,
    eligibility,
    profileLines,
  });

  return {
    resumeText,
    eligibility,
    profileLines,
    inputHash,
    targets: [...(profile?.targetRoles ?? []), profile?.headline ?? ""].filter(Boolean),
  };
}

export type Candidate = NonNullable<Awaited<ReturnType<typeof loadCandidate>>>;
