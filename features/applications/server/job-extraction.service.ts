import "server-only";

import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { normalizePastedText } from "@/lib/ai/normalize-pasted-text";
import {
  extractedJobResponseSchema,
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

export type ExtractionMethod = "PARSED" | "ASSISTED" | "MANUAL";

export type JobExtractionResult =
  | {
      ok: true;
      job: ExtractedJob;
      method: ExtractionMethod;
      notice?: string;
    }
  | { ok: false; message: string };

const EXTRACTION_BACKSTOP_MS = 13_000;

async function withBackstop<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Job extraction exceeded its time backstop")),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function hasSomething(job: ExtractedJob) {
  return Boolean(job.title || job.company || job.description);
}

async function settleUsage(work: Promise<unknown>, stage: string) {
  try {
    await work;
  } catch (error) {
    console.error("Job extraction usage bookkeeping failed", {
      stage,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}

function degrade(job: ExtractedJob, notice?: string): JobExtractionResult {
  return {
    ok: true,
    job,
    method: hasSomething(job) ? "PARSED" : "MANUAL",
    notice,
  };
}

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

  let parsed = EMPTY_JOB;
  let missing: string[] = ["title", "company", "description"];

  try {
    const rules = parseJobPosting({
      text: parsedInput.data.content,
      html: input.html ?? null,
    });

    parsed = sanitize(rules.job);
    missing = rules.missing;
  } catch (error) {
    console.error("Job parser failed", {
      contentLength: parsedInput.data.content.length,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  if (missing.length === 0) {
    return { ok: true, job: parsed, method: "PARSED" };
  }

  let reservation: Awaited<ReturnType<typeof reserveUsage>>;

  try {
    reservation = await reserveUsage({
      userId: input.userId,
      action: "JOB_EXTRACTION",
    });
  } catch (error) {
    console.error("Job extraction could not reserve usage", {
      userId: input.userId,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return degrade(parsed);
  }

  if (!reservation.ok) {
    return degrade(parsed, reservation.message);
  }

  const { reservationId } = reservation;

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();
    const result = await withBackstop(
      provider.extractJobPosting({ content: parsedInput.data.content }),
      EXTRACTION_BACKSTOP_MS,
    );

    const assisted = sanitize(
      normalizeJsonModelOutput(result.rawResponse, extractedJobResponseSchema),
    );

    await settleUsage(
      completeUsage({
        userId: input.userId,
        reservationId,
        action: "JOB_EXTRACTION",
        provider: result.provider,
        model: result.model,
      }),
      "complete",
    );

    const job = preferParsed(parsed, assisted);

    if (!hasSomething(job)) {
      return { ok: true, job, method: "MANUAL" };
    }

    return { ok: true, job, method: "ASSISTED" };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Job extraction failed", {
      userId: input.userId,
      contentLength: parsedInput.data.content.length,
      failureReason,
    });

    await settleUsage(
      failUsage({
        userId: input.userId,
        reservationId,
        action: "JOB_EXTRACTION",
        failureReason,
      }),
      "fail",
    );

    return degrade(
      parsed,
      aiFailureMessage(
        error,
        "AI assist was unavailable, so only what could be read directly was filled in.",
      ),
    );
  }
}

export const EMPTY_EXTRACTED_JOB = EMPTY_JOB;
