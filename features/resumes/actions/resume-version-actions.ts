"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  deleteOwnedResumeVersion,
  setOwnedDefaultResumeVersion,
  uploadResumeToJobTitle,
} from "@/features/resumes/server/resume-version.service";
import {
  defaultResumeVersionSchema,
  resumeUploadFileSchema,
  uploadResumeSchema,
} from "@/features/resumes/schemas/resume-version.schema";
import type { UploadResumeFormState } from "./resume-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value === "" ? undefined : value;
}

export async function uploadResumeAction(
  _state: UploadResumeFormState,
  formData: FormData,
): Promise<UploadResumeFormState> {
  const user = await requireDatabaseUser();

  const parsedFields = uploadResumeSchema.safeParse({
    resumePublicId: getOptionalString(formData, "resumePublicId"),
    title: getOptionalString(formData, "title"),
  });

  if (!parsedFields.success) {
    return {
      status: "error",
      message:
        parsedFields.error.issues[0]?.message ??
        "Enter a job title or pick an existing one.",
    };
  }

  const parsedFile = resumeUploadFileSchema.safeParse(formData.get("file"));

  if (!parsedFile.success) {
    return {
      status: "error",
      message:
        parsedFile.error.issues[0]?.message ?? "Select a resume PDF to upload.",
    };
  }

  const result = await uploadResumeToJobTitle({
    userId: user.id,
    resumePublicId: parsedFields.data.resumePublicId,
    title: parsedFields.data.title,
    file: parsedFile.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${result.resume.publicId}`);
  revalidatePath("/dashboard/applications");

  return {
    status: "success",
    message: `"${result.version.label}" was added to ${result.resume.title}.`,
  };
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
    revalidatePath("/dashboard/applications");
  }
}

export async function deleteResumeVersionAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = defaultResumeVersionSchema.parse({
    versionPublicId: getString(formData, "versionPublicId"),
  });

  const result = await deleteOwnedResumeVersion({
    userId: user.id,
    versionPublicId: input.versionPublicId,
  });

  if (result.ok) {
    revalidatePath("/dashboard/resumes");
    revalidatePath("/dashboard/applications");
  }
}
