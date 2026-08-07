"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  createOwnedResumeVersion,
  setOwnedDefaultResumeVersion,
} from "@/features/resumes/server/resume-version.service";
import {
  createResumeVersionSchema,
  defaultResumeVersionSchema,
} from "@/features/resumes/schemas/resume-version.schema";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createResumeVersionAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = createResumeVersionSchema.parse({
    resumePublicId: getString(formData, "resumePublicId"),
    fileAssetPublicId: getString(formData, "fileAssetPublicId"),
    label: getString(formData, "label"),
  });

  const version = await createOwnedResumeVersion({
    userId: user.id,
    ...input,
  });

  revalidatePath(`/dashboard/resumes/${input.resumePublicId}`);

  if (version) {
    redirect(`/dashboard/resumes/${input.resumePublicId}/versions/${version.publicId}`);
  }
}

export async function setDefaultResumeVersionAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = defaultResumeVersionSchema.parse({
    versionPublicId: getString(formData, "versionPublicId"),
  });

  const version = await setOwnedDefaultResumeVersion({
    userId: user.id,
    versionPublicId: input.versionPublicId,
  });

  if (version) {
    revalidatePath("/dashboard/resumes");
    revalidatePath(`/dashboard/resumes/${input.versionPublicId}`);
  }
}
