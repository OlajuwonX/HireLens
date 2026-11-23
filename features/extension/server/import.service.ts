import "server-only";

import { saveAndAnalyzeSchema } from "@/features/applications/schemas/application.schema";
import { saveJobOnly } from "@/features/applications/server/application.service";
import { extractJobPosting } from "@/features/applications/server/job-extraction.service";
import { listSavedJobRefs } from "@/features/discovery/server/feed.repository";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";
import { companyFromUrl, describePage } from "../page-job";
import { samePage } from "../page-key";

export type ImportResult = { ok: true; applicationPublicId: string; created: boolean } | { ok: false; message: string };

const UNREADABLE = "HireLens could not read a job posting on this page.";

export async function importPageJob(
  worker: WorkerIdentity,
  page: { url: string; title: string; text: string },
): Promise<ImportResult> {
  const userId = worker.userId;
  const existing = (await listSavedJobRefs(userId)).find((ref) => samePage(ref.sourceUrl, page.url));

  if (existing) {
    return { ok: true, applicationPublicId: existing.applicationPublicId, created: false };
  }

  const [version] = await listOwnedVersionOptions(userId);

  if (!version) {
    return { ok: false, message: "Upload a resume to HireLens first." };
  }

  const extracted = await extractJobPosting({ userId, content: describePage(page) });

  if (!extracted.ok) {
    return { ok: false, message: UNREADABLE };
  }

  const job = extracted.job;
  const values = saveAndAnalyzeSchema.safeParse({
    resumeVersionPublicId: version.publicId,
    title: job.title ?? "",
    company: job.company ?? companyFromUrl(page.url) ?? "",
    location: job.location ?? "",
    workArrangement: job.workArrangement ?? undefined,
    employmentType: job.employmentType ?? undefined,
    salaryMin: job.salaryMin ?? "",
    salaryMax: job.salaryMax ?? "",
    currency: job.currency ?? "",
    source: "Browser extension",
    sourceUrl: page.url,
    description: job.description ?? "",
    requirements: job.requirements ?? "",
  });

  if (!values.success) {
    return { ok: false, message: UNREADABLE };
  }

  const saved = await saveJobOnly({ userId, values: values.data });

  return saved.ok
    ? { ok: true, applicationPublicId: saved.value.applicationPublicId, created: true }
    : { ok: false, message: saved.message };
}
