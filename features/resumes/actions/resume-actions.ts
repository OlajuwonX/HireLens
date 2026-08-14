"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  createResumeMetadataSchema,
  renameResumeSchema,
  resumeActionSchema,
} from "@/features/resumes/schemas/resume.schema";
import {
  archiveOwnedResume,
  createResumeRecord,
  deleteOwnedResume,
  renameOwnedResume,
  retryOwnedResumeProcessing,
} from "@/features/resumes/server/resume.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createResumeMetadataAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = createResumeMetadataSchema.parse({
    title: getRequiredFormValue(formData, "title"),
  });

  const resume = await createResumeRecord({
    userId: user.id,
    title: input.title,
  });

  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${resume.publicId}`);
}

export async function renameResumeAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = renameResumeSchema.parse({
    publicId: getRequiredFormValue(formData, "publicId"),
    title: getRequiredFormValue(formData, "title"),
  });

  await renameOwnedResume({ userId: user.id, ...input });
  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${input.publicId}`);
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
}

export async function deleteResumeAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = resumeActionSchema.parse({
    publicId: getRequiredFormValue(formData, "publicId"),
  });

  await deleteOwnedResume({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/resumes");
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
