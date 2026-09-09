import "server-only";

import {
  buildInterviewProfile,
  interviewFingerprint,
  type InterviewProfile,
} from "../interview-profile";
import { findInterviewProfileSource } from "./interview-profile.repository";

export type ResolvedInterviewProfile = {
  profile: InterviewProfile;
  fingerprint: string;
  fromAnalysis: boolean;
};

export async function getInterviewProfile(
  userId: string,
): Promise<ResolvedInterviewProfile | null> {
  const source = await findInterviewProfileSource(userId);

  if (!source) {
    return null;
  }

  const profile = buildInterviewProfile({
    jobTitle: source.jobTitle,
    jobDescription: source.jobDescription,
    jobRequirements: source.jobRequirements,
    analysis: source.analysis,
    resumeText: source.resumeText,
  });

  return {
    profile,
    fingerprint: await interviewFingerprint(profile),
    fromAnalysis: source.analysis !== null,
  };
}
