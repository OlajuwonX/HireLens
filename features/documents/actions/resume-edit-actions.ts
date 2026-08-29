"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { saveEditedResume } from "../server/resume-design.service";

export type ResumeEditResult =
  | { status: "saved"; version: number }
  | { status: "conflict"; version: number; message: string }
  | { status: "error"; message: string };

export async function saveEditedResumeAction(input: {
  publicId: string;
  resume: unknown;
  expectedVersion: number;
}): Promise<ResumeEditResult> {
  const user = await requireDatabaseUser();

  if (typeof input?.publicId !== "string" || !input.publicId) {
    return { status: "error", message: "That document could not be found." };
  }

  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) {
    return { status: "error", message: "Reload the page and try again." };
  }

  const result = await saveEditedResume({
    userId: user.id,
    publicId: input.publicId,
    resume: input.resume,
    expectedVersion: input.expectedVersion,
  });

  if (!result.ok) {
    if (result.reason === "CONFLICT") {
      return {
        status: "conflict",
        version: result.version,
        message: result.message,
      };
    }

    return { status: "error", message: result.message };
  }

  revalidatePath(`/dashboard/documents/${input.publicId}`);

  return { status: "saved", version: result.version };
}
