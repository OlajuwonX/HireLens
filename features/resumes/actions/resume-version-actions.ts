"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  createOwnedResumeVersionFromUpload,
  setOwnedDefaultResumeVersion,
} from "@/features/resumes/server/resume-version.service";
import {
  createResumeVersionSchema,
  defaultResumeVersionSchema,
  resumeUploadFileSchema,
} from "@/features/resumes/schemas/resume-version.schema";

export type CreateResumeVersionFormState = {
  status: "idle" | "error";
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createResumeVersionAction(
  _state: CreateResumeVersionFormState,
  formData: FormData,
): Promise<CreateResumeVersionFormState> {
  const user = await requireDatabaseUser();

  const parsedFields = createResumeVersionSchema.safeParse({
    resumePublicId: getString(formData, "resumePublicId"),
    label: getString(formData, "label"),
  });

  if (!parsedFields.success) {
    return {
      status: "error",
      message:
        parsedFields.error.issues[0]?.message ?? "Check the form and try again.",
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

  const result = await createOwnedResumeVersionFromUpload({
    userId: user.id,
    resumePublicId: parsedFields.data.resumePublicId,
    label: parsedFields.data.label,
    file: parsedFile.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath(`/dashboard/resumes/${parsedFields.data.resumePublicId}`);
  revalidatePath("/dashboard/resumes");

  redirect(`/dashboard/resumes/${parsedFields.data.resumePublicId}`);
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
  }
}
