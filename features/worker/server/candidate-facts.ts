import "server-only";

import { getAccountRecord } from "@/features/auth/server/current-account";
import { listAnswers } from "@/features/candidate-profile/server/answer.repository";
import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import { splitName } from "../contract";

export async function loadCandidateFacts(userId: string) {
  const [account, profile, answers] = await Promise.all([
    getAccountRecord(userId),
    findProfileByUser(userId),
    listAnswers(userId),
  ]);

  return {
    candidate: {
      ...splitName(account?.name ?? null),
      email: account?.email ?? "",
      phone: profile?.phone ?? null,
      location: profile?.currentLocation ?? null,
      linkedinUrl: profile?.linkedinUrl ?? null,
      githubUrl: profile?.githubUrl ?? null,
      portfolioUrl: profile?.portfolioUrl ?? null,
      authorizedCountries: profile?.authorizedCountries ?? [],
      requiresSponsorship: profile?.requiresSponsorship ?? null,
      willingToRelocate: profile?.willingToRelocate ?? null,
      salaryMin: profile?.salaryMin ?? null,
      salaryCurrency: profile?.salaryCurrency ?? null,
      noticePeriodWeeks: profile?.noticePeriodWeeks ?? null,
      yearsExperience: profile?.yearsExperience ?? null,
    },
    answers: answers.map(({ question, answer }) => ({ question, answer })),
  };
}

export type CandidateFacts = Awaited<ReturnType<typeof loadCandidateFacts>>;
