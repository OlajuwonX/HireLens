import "server-only";

import { saveAndAnalyzeSchema } from "@/features/applications/schemas/application.schema";
import { saveJobOnly } from "@/features/applications/server/application.service";
import { extractJobPosting } from "@/features/applications/server/job-extraction.service";
import { listSavedJobRefs } from "@/features/discovery/server/feed.repository";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";
import { FORM_ONLY_MESSAGE } from "../form-page";
import { companyFromUrl, describePage } from "../page-job";
import { describePosting, findAtsPosting } from "./ats-posting";
import { samePage } from "../page-key";

export type ImportResult = { ok: true; applicationPublicId: string; created: boolean } | { ok: false; message: string };

const UNREADABLE = "HireLens could not read a job posting on this page.";

export async function importPageJob(
  worker: WorkerIdentity,
  page: { url: string; title: string; text: string; formOnly?: boolean },
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

  const posting = await findAtsPosting(page.url);

  if (!posting && page.formOnly) {
    return { ok: false, message: FORM_ONLY_MESSAGE };
  }

  const content = posting
    ? describePage({ url: page.url, title: posting.title, text: describePosting(posting) })
    : describePage(page);
  const extracted = await extractJobPosting({ userId, content });

  if (!extracted.ok && !posting) {
    return { ok: false, message: UNREADABLE };
  }

  const job = extracted.ok ? extracted.job : null;
  const values = saveAndAnalyzeSchema.safeParse({
    resumeVersionPublicId: version.publicId,
    title: posting?.title ?? job?.title ?? "",
    company: job?.company ?? posting?.company ?? companyFromUrl(page.url) ?? "",
    location: job?.location ?? posting?.location ?? "",
    workArrangement: job?.workArrangement ?? posting?.workArrangement ?? undefined,
    employmentType: job?.employmentType ?? posting?.employmentType ?? undefined,
    salaryMin: job?.salaryMin ?? posting?.salaryMin ?? "",
    salaryMax: job?.salaryMax ?? posting?.salaryMax ?? "",
    currency: job?.currency ?? posting?.currency ?? "",
    source: "Browser extension",
    sourceUrl: page.url,
    description: job?.description ?? posting?.description ?? "",
    requirements: job?.requirements ?? "",
  });

  if (!values.success) {
    return { ok: false, message: UNREADABLE };
  }

  const saved = await saveJobOnly({ userId, values: values.data });

  return saved.ok
    ? { ok: true, applicationPublicId: saved.value.applicationPublicId, created: true }
    : { ok: false, message: saved.message };
}
