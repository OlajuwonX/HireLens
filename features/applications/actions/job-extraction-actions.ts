"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { extractJobPosting } from "../server/job-extraction.service";
import type { JobExtractionState } from "./job-extraction-state";

export async function extractJobPostingAction(
  _state: JobExtractionState,
  formData: FormData,
): Promise<JobExtractionState> {
  const user = await requireDatabaseUser();
  const raw = formData.get("content");

  const result = await extractJobPosting({
    userId: user.id,
    content: typeof raw === "string" ? raw : "",
  });

  if (!result.ok) {
    return { status: "error", message: result.message, job: null };
  }

  return {
    status: "extracted",
    message: "Job details extracted. Review them before saving.",
    job: result.job,
  };
}
