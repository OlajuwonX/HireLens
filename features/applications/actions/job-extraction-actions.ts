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
    return {
      status: "error",
      message: result.message,
      job: null,
      method: null,
    };
  }

  const message =
    result.method === "MANUAL"
      ? "We could not read a job posting from that. Try copying more of the page, or close this and type the details in."
      : result.method === "PARSED"
        ? "Job details read from the posting. Review them before saving."
        : "Job details extracted. Review them before saving.";

  return {
    status: "extracted",
    message: result.notice ? `${message} ${result.notice}` : message,
    job: result.job,
    method: result.method,
  };
}
