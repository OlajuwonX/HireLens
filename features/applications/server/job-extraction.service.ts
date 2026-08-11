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
import { clipboardHtmlToText } from "@/lib/jobs/clipboard-html";
import { parseJobPosting } from "@/lib/jobs/parse-job-posting";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import { firstIssueMessage } from "@/lib/forms/zod-error";

export type ExtractionMethod = "PARSED" | "ASSISTED";

export type JobExtractionResult =
  | { ok: true; job: ExtractedJob; method: ExtractionMethod }
  | { ok: false; message: string };

const EMPTY_JOB: ExtractedJob = {
  title: null,
  company: null,
  location: null,
  workArrangement: null,
  employmentType: null,
  salaryMin: null,
  salaryMax: null,
  currency: null,
  source: null,
  sourceUrl: null,
  description: null,
  requirements: null,
};

function trimOrNull(value: string | null | undefined, max: number) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, max) : null;
}

function safeUrl(value: string | null | undefined) {
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

function sanitize(job: Partial<ExtractedJob>): ExtractedJob {
  const salaryMin = job.salaryMin ?? null;
  const salaryMax = job.salaryMax ?? null;
  const inverted =
    salaryMin !== null && salaryMax !== null && salaryMin > salaryMax;

  return {
    title: trimOrNull(job.title, 200),
    company: trimOrNull(job.company, 200),
    location: trimOrNull(job.location, 200),
    workArrangement: job.workArrangement ?? null,
    employmentType: job.employmentType ?? null,
    salaryMin: inverted ? salaryMax : salaryMin,
    salaryMax: inverted ? salaryMin : salaryMax,
    currency: trimOrNull(job.currency, 8),
    source: trimOrNull(job.source, 120),
    sourceUrl: safeUrl(job.sourceUrl),
    description: trimOrNull(job.description, 50_000),
    requirements: trimOrNull(job.requirements, 20_000),
  };
}

function preferParsed(parsed: ExtractedJob, assisted: ExtractedJob) {
  return sanitize({
    title: parsed.title ?? assisted.title,
    company: parsed.company ?? assisted.company,
    location: parsed.location ?? assisted.location,
    workArrangement: parsed.workArrangement ?? assisted.workArrangement,
    employmentType: parsed.employmentType ?? assisted.employmentType,
    salaryMin: parsed.salaryMin ?? assisted.salaryMin,
    salaryMax: parsed.salaryMax ?? assisted.salaryMax,
    currency: parsed.currency ?? assisted.currency,
    source: parsed.source ?? assisted.source,
    sourceUrl: parsed.sourceUrl ?? assisted.sourceUrl,
    description: assisted.description ?? parsed.description,
    requirements: assisted.requirements ?? parsed.requirements,
  });
}

export async function extractJobPosting(input: {
  userId: string;
  content: string;
  html?: string | null;
  provider?: ApplicationIntelligenceProvider;
}): Promise<JobExtractionResult> {
  const fromHtml = input.html ? clipboardHtmlToText(input.html) : "";
  const normalized = normalizePastedText(
    fromHtml.length > input.content.length ? fromHtml : input.content,
  );
  const parsedInput = jobExtractionInputSchema.safeParse({
    content: normalized,
  });

  if (!parsedInput.success) {
    return {
      ok: false,
      message: firstIssueMessage(
        parsedInput.error,
        "Paste the job posting and try again.",
      ),
    };
  }

  const { job: rules, missing } = parseJobPosting({
    text: parsedInput.data.content,
    html: input.html ?? null,
  });
  const parsed = sanitize(rules);

  if (missing.length === 0) {
    return { ok: true, job: parsed, method: "PARSED" };
  }

  const reservation = await reserveUsage({
    userId: input.userId,
    action: "JOB_EXTRACTION",
  });

  if (!reservation.ok) {
    if (parsed.title || parsed.description) {
      return { ok: true, job: parsed, method: "PARSED" };
    }

    return { ok: false, message: reservation.message };
  }

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await provider.extractJobPosting({
      content: parsedInput.data.content,
    });

    const assisted = sanitize(
      normalizeJsonModelOutput(result.rawResponse, extractedJobSchema),
    );

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_EXTRACTION",
      provider: result.provider,
      model: result.model,
    });

    const job = preferParsed(parsed, assisted);

    if (!job.title && !job.company && !job.description) {
      return {
        ok: false,
        message:
          "We could not identify a complete job posting from that text. Check what you copied and try again.",
      };
    }

    return { ok: true, job, method: "ASSISTED" };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Job extraction failed", {
      userId: input.userId,
      contentLength: parsedInput.data.content.length,
      failureReason,
    });

    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_EXTRACTION",
      failureReason,
    });

    if (parsed.title || parsed.description) {
      return { ok: true, job: parsed, method: "PARSED" };
    }

    return {
      ok: false,
      message: aiFailureMessage(
        error,
        "We could not extract the job details right now. You can still enter them manually.",
      ),
    };
  }
}

export const EMPTY_EXTRACTED_JOB = EMPTY_JOB;
