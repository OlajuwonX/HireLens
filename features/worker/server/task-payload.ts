import "server-only";

import { readStoredIntelligence } from "@/features/analyses/server/analysis.mapper";
import { findAnalysisForApplication } from "@/features/analyses/server/analysis.repository";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { findTaskForUser } from "@/features/auto-apply/server/task.repository";
import { listAnswers } from "@/features/candidate-profile/server/answer.repository";
import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import type { ApplicationTask } from "@/lib/db/schema";
import { splitName } from "../contract";

export async function loadIntelligence(input: { userId: string; applicationId: string }) {
  const analysis = await findAnalysisForApplication(input);

  return analysis ? readStoredIntelligence(analysis) : null;
}

export async function buildTaskPayload(userId: string, task: ApplicationTask) {
  const [account, profile, answers, intelligence, row] = await Promise.all([
    getAccountRecord(userId),
    findProfileByUser(userId),
    listAnswers(userId),
    loadIntelligence({ userId, applicationId: task.applicationId }),
    findTaskForUser({ userId, publicId: task.publicId }),
  ]);

  return {
    task: { id: task.publicId, platform: task.platform, url: row?.sourceUrl ?? null },
    job: { title: row?.title ?? "", company: row?.company ?? "" },
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
    coverLetter: intelligence?.coverLetter || null,
    resumePath: `/api/worker/tasks/${task.publicId}/resume`,
  };
}

export type TaskPayload = Awaited<ReturnType<typeof buildTaskPayload>>;
