import "server-only";

import { completeUsage, failUsage, reserveUsage } from "@/features/usage/server/ai-usage.service";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { createMatchContent } from "@/lib/ai/prompts/job-matching-input";
import { jobMatchingSchema } from "@/lib/ai/schemas/job-matching.schema";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";
import type { NewJobMatch } from "@/lib/db/schema";
import { rankScore } from "@/lib/matching/rank";
import { MATCHING_LIMITS } from "../constants";
import { screenPostings } from "../screening";
import { loadCandidate } from "./candidate-context";
import { listPostingsToMatch, upsertMatches, type PostingToMatch } from "./match.repository";

export type MatchingOutcome =
  | { ok: true; scored: number; screenedOut: number; waiting: number }
  | { ok: false; message: string; screenedOut: number };

const MISSING_RESUME = "Upload a resume with readable text before matching jobs.";

export async function runMatching(input: {
  userId: string;
  provider?: ApplicationIntelligenceProvider;
}): Promise<MatchingOutcome> {
  const candidate = await loadCandidate(input.userId);

  if (!candidate) {
    return { ok: false, message: MISSING_RESUME, screenedOut: 0 };
  }

  const base = { userId: input.userId, inputHash: candidate.inputHash, scoredAt: null };
  const postings = await listPostingsToMatch({ userId: input.userId, inputHash: candidate.inputHash });
  const { rejected, batch, waiting } = screenPostings<PostingToMatch>({
    postings,
    profile: candidate.eligibility,
    targets: candidate.targets,
    batchSize: MATCHING_LIMITS.batchSize,
  });

  await upsertMatches(
    rejected.map(({ posting, verdict, reasons }) => ({
      ...base,
      postingId: posting.id,
      verdict,
      reasons,
      score: null,
      rank: null,
      fit: null,
      insight: null,
    })),
  );

  if (batch.length === 0) {
    return { ok: true, scored: 0, screenedOut: rejected.length, waiting: 0 };
  }

  const reservation = await reserveUsage({ userId: input.userId, action: "JOB_MATCHING" });

  if (!reservation.ok) {
    return { ok: false, message: reservation.message, screenedOut: rejected.length };
  }

  const refs = batch.map((item, index) => ({ ...item, ref: `J${index + 1}` }));

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await provider.matchJobs({
      content: createMatchContent({
        profile: candidate.profileLines,
        resume: candidate.resumeText,
        jobs: refs.map(({ ref, posting }) => ({
          ref,
          title: posting.title,
          company: posting.company,
          location: posting.location,
          arrangement: posting.workArrangement,
          description: posting.description,
        })),
      }),
    });
    const { matches } = normalizeJsonModelOutput(result.rawResponse, jobMatchingSchema);
    const byRef = new Map(matches.map((match) => [match.ref, match]));
    const scored: NewJobMatch[] = refs.flatMap(({ ref, posting, verdict, reasons }) => {
      const match = byRef.get(ref);

      return match
        ? [{
            ...base,
            postingId: posting.id,
            verdict,
            reasons,
            score: match.score,
            rank: rankScore(match.score, verdict),
            fit: match.fit,
            insight: {
              strengths: match.strengths.slice(0, 3),
              gaps: match.gaps.slice(0, 3),
              summary: match.summary,
            },
            scoredAt: new Date(),
          }]
        : [];
    });

    await upsertMatches(scored);
    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_MATCHING",
      provider: result.provider,
      model: result.model,
      inputHash: candidate.inputHash,
    });

    return { ok: true, scored: scored.length, screenedOut: rejected.length, waiting };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Job matching failed", { stage: "JOB_MATCHING", failureReason });
    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_MATCHING",
      inputHash: candidate.inputHash,
      failureReason,
    }).catch(() => undefined);

    return {
      ok: false,
      message: aiFailureMessage(error, "Matching could not finish. Your AI allowance was not used."),
      screenedOut: rejected.length,
    };
  }
}
