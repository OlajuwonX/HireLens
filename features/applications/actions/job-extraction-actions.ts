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
  const html = formData.get("html");

  const result = await extractJobPosting({
    userId: user.id,
    content: typeof raw === "string" ? raw : "",
    html: typeof html === "string" ? html : null,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, job: null };
  }

  return {
    status: "extracted",
    message:
      result.method === "PARSED"
        ? "Job details read from the posting. Review them before saving."
        : "Job details extracted. Review them before saving.",
    job: result.job,
  };
}
