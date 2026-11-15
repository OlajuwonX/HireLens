import "server-only";

import { saveAndAnalyzeSchema } from "@/features/applications/schemas/application.schema";
import { saveJobOnly } from "@/features/applications/server/application.service";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import type { DiscoverySource } from "@/lib/discovery/types";
import { sourceLabels } from "../constants";
import { loadAudience } from "./audience";
import { cleanDescription, dedupeKey } from "@/lib/discovery/normalize";
import {
  findPostingForUser,
  hasSavedJobWithUrl,
  listSavedRoleKeys,
  type PostingDetail,
} from "./feed.repository";

export type SavePostingResult =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; message: string };

export function toSaveValues(posting: PostingDetail, resumeVersionPublicId: string) {
  return saveAndAnalyzeSchema.safeParse({
    resumeVersionPublicId,
    title: posting.title,
    company: posting.company,
    location: posting.location ?? "",
    workArrangement: posting.workArrangement,
    employmentType: posting.employmentType,
    salaryMin: posting.salaryMin ?? "",
    salaryMax: posting.salaryMax ?? "",
    currency: posting.currency ?? "",
    source: sourceLabels[posting.source as DiscoverySource] ?? posting.source,
    sourceUrl: posting.applyUrl ?? posting.url,
    description: cleanDescription(posting.description) || `See the full posting at ${posting.url}`,
  });
}

export async function savePostingToJobs(input: {
  userId: string;
  publicId: string;
}): Promise<SavePostingResult> {
  const posting = await findPostingForUser({
    audience: await loadAudience(input.userId),
    publicId: input.publicId,
  });

  if (!posting) {
    return { ok: false, message: "That job is no longer available." };
  }

  const [savedUrl, savedRoles] = await Promise.all([
    hasSavedJobWithUrl({ userId: input.userId, url: posting.applyUrl ?? posting.url }),
    listSavedRoleKeys(input.userId),
  ]);

  if (savedUrl || savedRoles.has(dedupeKey(posting))) {
    return { ok: true, alreadySaved: true };
  }

  const [version] = await listOwnedVersionOptions(input.userId);

  if (!version) {
    return { ok: false, message: "Upload a resume before saving jobs." };
  }

  const values = toSaveValues(posting, version.publicId);

  if (!values.success) {
    return { ok: false, message: "This posting is missing details HireLens needs to save it." };
  }

  const saved = await saveJobOnly({ userId: input.userId, values: values.data });

  return saved.ok ? { ok: true, alreadySaved: false } : { ok: false, message: saved.message };
}
