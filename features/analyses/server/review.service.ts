import "server-only";

import { completeUsage, failUsage, reserveUsage } from "@/features/usage/server/ai-usage.service";
import type { UsageDenialReason } from "@/features/usage/limit-notice";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { hashAnalysisInput } from "@/lib/ai/hash";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { RESUME_REVIEW_PROMPT_VERSION } from "@/lib/ai/prompts/resume-review.prompt";
import { createReviewContent } from "@/lib/ai/prompts/resume-review-input";
import { validateOptimizedResume } from "@/lib/ai/resume-validation";
import { finalVerdict } from "@/lib/ai/review-verdict";
import { resumeReviewSchema } from "@/lib/ai/schemas/resume-review.schema";
import { extractSourceEvidence, formatSourceEvidence } from "@/lib/ai/source-evidence";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";
import type { StorageProvider } from "@/lib/storage";
import { toReviewView, type ReviewView } from "../review-view";
import { improvedResumeToText } from "./analysis.mapper";
import { toJobPostingInput } from "./job-input";
import {
  findOwnedAnalysis,
  loadReviewContext,
  type ReviewContextFailure,
} from "./review-context";
import { findReviewByHash, insertReview } from "./review.repository";

export type ReviewOutcome =
  | { ok: true; review: ReviewView; reused: boolean }
  | { ok: false; error: ReviewContextFailure | "FAILED"; message: string }
  | { ok: false; error: "LIMIT_REACHED"; message: string; limitReason: UsageDenialReason };

const CONTEXT_MESSAGES: Record<ReviewContextFailure, string> = {
  NOT_FOUND: "Analyze this application before reviewing its resume.",
  NO_RESUME: "There is no optimized resume to review yet.",
  NO_TEXT: "Your original resume has no readable text to check against.",
};

const failed = (message: string): ReviewOutcome => ({ ok: false, error: "FAILED", message });

type OwnedAnalysis = NonNullable<Awaited<ReturnType<typeof findOwnedAnalysis>>>;

async function reviewKey(owned: Pick<OwnedAnalysis, "analysis" | "stored" | "corrections">) {
  const resumeText = improvedResumeToText(owned.stored.improvedResume);
  const corrections = owned.corrections.map((item) =>
    [item.requirement, item.evidence, item.notes].filter(Boolean).join(": "),
  );
  const inputHash = await hashAnalysisInput({
    promptVersion: RESUME_REVIEW_PROMPT_VERSION,
    analysisId: owned.analysis.id,
    resumeText,
    corrections,
  });

  return { resumeText, corrections, inputHash };
}

export async function reviewApplicationResume(input: {
  userId: string;
  publicId: string;
  provider?: ApplicationIntelligenceProvider;
  storage?: StorageProvider;
}): Promise<ReviewOutcome> {
  const context = await loadReviewContext(input);

  if (!context.ok) {
    return { ok: false, error: context.error, message: CONTEXT_MESSAGES[context.error] };
  }

  const { resumeText, corrections, inputHash } = await reviewKey(context);
  const evidence = extractSourceEvidence(context.sourceText);
  const validation = validateOptimizedResume({
    sourceText: context.sourceText,
    supplementText: corrections.join("\n"),
    resume: context.stored.improvedResume,
    resumeText,
    evidence,
    traceability: context.stored.traceability,
  });
  const cached = await findReviewByHash({ userId: input.userId, inputHash });
  const cachedView = cached ? toReviewView(cached) : null;

  if (cachedView) {
    return { ok: true, review: cachedView, reused: true };
  }

  const reservation = await reserveUsage({ userId: input.userId, action: "RESUME_REVIEW" });

  if (!reservation.ok) {
    return { ok: false, error: "LIMIT_REACHED", message: reservation.message, limitReason: reservation.reason };
  }

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await provider.reviewResume({
      content: createReviewContent({
        sourceEvidence: formatSourceEvidence(evidence) ?? context.sourceText,
        corrections,
        job: toJobPostingInput(context.job),
        optimizedResume: resumeText,
        findings: validation.issues.map((issue) => issue.detail),
      }),
    });
    const review = normalizeJsonModelOutput(result.rawResponse, resumeReviewSchema);
    const row = await insertReview({
      userId: input.userId,
      analysisId: context.analysis.id,
      inputHash,
      verdict: finalVerdict(review, validation),
      provider: result.provider,
      model: result.model,
      promptVersion: RESUME_REVIEW_PROMPT_VERSION,
      resultJson: { review, validation },
    });
    const view = row ? toReviewView(row) : null;

    if (!view) {
      throw new Error("The review could not be saved");
    }

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "RESUME_REVIEW",
      provider: result.provider,
      model: result.model,
      inputHash,
    });

    return { ok: true, review: view, reused: false };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Resume review failed", { stage: "RESUME_REVIEW", failureReason });
    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "RESUME_REVIEW",
      inputHash,
      failureReason,
    }).catch(() => undefined);

    return failed(
      aiFailureMessage(error, "The review could not be completed. Your AI allowance was not used."),
    );
  }
}

export async function getCurrentApplicationReview(input: {
  userId: string;
  publicId: string;
}) {
  const owned = await findOwnedAnalysis(input);

  if (!owned) {
    return null;
  }

  const { inputHash } = await reviewKey(owned);
  const row = await findReviewByHash({ userId: input.userId, inputHash });

  return row ? toReviewView(row) : null;
}
