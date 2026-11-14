import "server-only";

import { improvedResumeToText, readStoredIntelligence } from "@/features/analyses/server/analysis.mapper";
import { toJobPostingInput } from "@/features/analyses/server/job-input";
import { findAnalysisForApplication } from "@/features/analyses/server/analysis.repository";
import { findApplicationRowByIdForUser } from "@/features/applications/server/application.repository";
import { readResumeVersionText } from "@/features/resumes/server/resume-text";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import { completeUsage, failUsage, reserveUsage } from "@/features/usage/server/ai-usage.service";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { createPrepContent } from "@/lib/ai/prompts/interview-prep-input";
import { interviewPrepSchema } from "@/lib/ai/schemas/interview-prep.schema";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";
import type { InterviewPrep } from "@/lib/db/schema";
import { savePrepResult } from "./prep.repository";

export type PrepOutcome = { ok: true } | { ok: false; message: string };

async function loadContext(userId: string, applicationId: string) {
  const row = await findApplicationRowByIdForUser({ userId, applicationId });

  if (!row) {
    return null;
  }

  const analysis = await findAnalysisForApplication({ userId, applicationId });
  const stored = analysis ? readStoredIntelligence(analysis) : null;
  const improved = stored && stored.improvedResume.experience.length > 0 ? improvedResumeToText(stored.improvedResume) : null;
  const version = !improved && row.versionPublicId
    ? await getOwnedResumeVersion({ userId, versionPublicId: row.versionPublicId })
    : null;
  const resume = improved ?? (version ? await readResumeVersionText({ userId, version }) : null);
  const gaps = (stored?.requirementMatches ?? [])
    .filter((match) => match.status === "MISSING" || match.status === "PARTIAL")
    .map((match) => match.requirement);

  return resume ? { job: toJobPostingInput(row.job), resume, gaps } : null;
}

export async function generatePrep(input: {
  userId: string;
  prep: Pick<InterviewPrep, "id" | "applicationId">;
  emailText: string | null;
  provider?: ApplicationIntelligenceProvider;
}): Promise<PrepOutcome> {
  const context = await loadContext(input.userId, input.prep.applicationId);

  if (!context) {
    await savePrepResult({ userId: input.userId, id: input.prep.id, status: "FAILED", failureReason: "NO_RESUME" });
    return { ok: false, message: "This application has no readable resume to prepare from." };
  }

  const reservation = await reserveUsage({ userId: input.userId, action: "INTERVIEW_PREP" });

  if (!reservation.ok) {
    return { ok: false, message: reservation.message };
  }

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await provider.prepareInterview({
      content: createPrepContent({ ...context, email: input.emailText }),
    });
    const prep = normalizeJsonModelOutput(result.rawResponse, interviewPrepSchema);

    await savePrepResult({ userId: input.userId, id: input.prep.id, status: "READY", resultJson: prep });
    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "INTERVIEW_PREP",
      provider: result.provider,
      model: result.model,
      inputHash: input.prep.id,
    });

    return { ok: true };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "INTERVIEW_PREP",
      inputHash: input.prep.id,
      failureReason,
    }).catch(() => undefined);
    await savePrepResult({ userId: input.userId, id: input.prep.id, status: "FAILED", failureReason });

    return { ok: false, message: aiFailureMessage(error, "Preparation could not be generated. Your allowance was not used.") };
  }
}
