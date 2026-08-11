import "server-only";

import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { normalizePastedText } from "@/lib/ai/normalize-pasted-text";
import {
  extractedJobSchema,
  jobExtractionInputSchema,
  type ExtractedJob,
} from "@/lib/ai/schemas/job-extraction.schema";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import { firstIssueMessage } from "@/lib/forms/zod-error";

export type JobExtractionResult =
  | { ok: true; job: ExtractedJob }
  | { ok: false; message: string };

function trimOrNull(value: string | null, max: number) {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, max) : null;
}

function safeUrl(value: string | null) {
  const trimmed = trimOrNull(value, 2048);

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function sanitize(job: ExtractedJob): ExtractedJob {
  const salaryMin = job.salaryMin ?? null;
  const salaryMax = job.salaryMax ?? null;
  const ordered =
    salaryMin !== null && salaryMax !== null && salaryMin > salaryMax;

  return {
    title: trimOrNull(job.title, 200),
    company: trimOrNull(job.company, 200),
    location: trimOrNull(job.location, 200),
    workArrangement: job.workArrangement,
    employmentType: job.employmentType,
    salaryMin: ordered ? salaryMax : salaryMin,
    salaryMax: ordered ? salaryMin : salaryMax,
    currency: trimOrNull(job.currency, 8),
    source: trimOrNull(job.source, 120),
    sourceUrl: safeUrl(job.sourceUrl),
    description: trimOrNull(job.description, 50_000),
    requirements: trimOrNull(job.requirements, 20_000),
  };
}

export async function extractJobPosting(input: {
  userId: string;
  content: string;
  provider?: ApplicationIntelligenceProvider;
}): Promise<JobExtractionResult> {
  const normalized = normalizePastedText(input.content);
  const parsed = jobExtractionInputSchema.safeParse({ content: normalized });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstIssueMessage(
        parsed.error,
        "Paste the job posting and try again.",
      ),
    };
  }

  const reservation = await reserveUsage({
    userId: input.userId,
    action: "JOB_EXTRACTION",
  });

  if (!reservation.ok) {
    return { ok: false, message: reservation.message };
  }

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await provider.extractJobPosting({
      content: parsed.data.content,
    });

    const job = sanitize(
      normalizeJsonModelOutput(result.rawResponse, extractedJobSchema),
    );

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_EXTRACTION",
      provider: result.provider,
      model: result.model,
    });

    if (!job.title && !job.company && !job.description) {
      return {
        ok: false,
        message:
          "We could not identify a complete job posting from that text. Check what you copied and try again.",
      };
    }

    return { ok: true, job };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Job extraction failed", {
      userId: input.userId,
      contentLength: parsed.data.content.length,
      failureReason,
    });

    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_EXTRACTION",
      failureReason,
    });

    return {
      ok: false,
      message: aiFailureMessage(
        error,
        "We could not extract the job details right now. You can still enter them manually.",
      ),
    };
  }
}
