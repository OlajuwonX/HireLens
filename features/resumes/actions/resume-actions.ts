"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  renameResumeSchema,
  resumeActionSchema,
} from "@/features/resumes/schemas/resume.schema";
import {
  archiveOwnedResume,
  deleteOwnedResume,
  renameOwnedResume,
  retryOwnedResumeProcessing,
} from "@/features/resumes/server/resume.service";
import type { RenameResumeFormState } from "./resume-form-state";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function renameResumeAction(
  _state: RenameResumeFormState,
  formData: FormData,
): Promise<RenameResumeFormState> {
  const user = await requireDatabaseUser();
  const parsed = renameResumeSchema.safeParse({
    publicId: getRequiredFormValue(formData, "publicId"),
    title: getRequiredFormValue(formData, "title"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Job title is required.",
    };
  }

  const result = await renameOwnedResume({ userId: user.id, ...parsed.data });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${parsed.data.publicId}`);

  return {
    status: "success",
    message: `Job title updated to "${result.resume.title}".`,
  };
}

export async function archiveResumeAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = resumeActionSchema.parse({
    publicId: getRequiredFormValue(formData, "publicId"),
  });

  await archiveOwnedResume({
    userId: user.id,
    publicId: input.publicId,
    archived: formData.get("archived") !== "false",
  });
  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${input.publicId}`);
  revalidatePath("/dashboard/applications");
}

export async function deleteResumeAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = resumeActionSchema.parse({
    publicId: getRequiredFormValue(formData, "publicId"),
  });

  await deleteOwnedResume({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/resumes");
}

export async function retryResumeProcessingAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = resumeActionSchema.parse({
    publicId: getRequiredFormValue(formData, "publicId"),
  });

  await retryOwnedResumeProcessing({
    userId: user.id,
    publicId: input.publicId,
  });
  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${input.publicId}`);
}
