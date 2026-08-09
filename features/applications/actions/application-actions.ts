"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  applicationActionSchema,
  changeStageSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/features/applications/schemas/application.schema";
import {
  changeApplicationStage,
  deleteOwnedApplication,
  trackJobAsApplication,
  updateOwnedApplication,
} from "@/features/applications/server/application.service";
import type { ApplicationFormState } from "./application-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function trackApplicationAction(
  _state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireDatabaseUser();
  const parsed = createApplicationSchema.safeParse({
    jobPublicId: getString(formData, "jobPublicId"),
    resumeVersionPublicId: formData.get("resumeVersionPublicId"),
    stage: getString(formData, "stage") || "SAVED",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Could not track that job.",
    };
  }

  const result = await trackJobAsApplication({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/jobs/${parsed.data.jobPublicId}`);
  redirect(`/dashboard/applications/${result.value.publicId}`);
}

export async function changeApplicationStageAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = changeStageSchema.parse({
    publicId: getString(formData, "publicId"),
    stage: getString(formData, "stage"),
  });

  await changeApplicationStage({
    userId: user.id,
    publicId: input.publicId,
    stage: input.stage,
  });

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${input.publicId}`);
}

export async function updateApplicationAction(
  _state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireDatabaseUser();
  const parsed = updateApplicationSchema.safeParse({
    publicId: getString(formData, "publicId"),
    stage: getString(formData, "stage"),
    resumeVersionPublicId: formData.get("resumeVersionPublicId"),
    appliedAt: formData.get("appliedAt"),
    followUpAt: formData.get("followUpAt"),
    interviewAt: formData.get("interviewAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const result = await updateOwnedApplication({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${parsed.data.publicId}`);

  return { status: "saved", message: "Application updated." };
}

export async function deleteApplicationAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = applicationActionSchema.parse({
    publicId: getString(formData, "publicId"),
  });

  await deleteOwnedApplication({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications");
}
