"use server";

import {
  applicationActionSchema,
  changeStatusSchema,
  saveAndAnalyzeSchema,
  updateApplicationSchema,
} from "@/features/applications/schemas/application.schema";
import {
  analyzeOwnedApplication,
  changeApplicationStatus,
  deleteOwnedApplication,
  saveAndAnalyze,
  updateOwnedApplication,
} from "@/features/applications/server/application.service";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import type { ApplicationFormState } from "./application-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export async function saveAndAnalyzeAction(
  _state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireDatabaseUser();

  const parsed = saveAndAnalyzeSchema.safeParse({
    resumeVersionPublicId: getString(formData, "resumeVersionPublicId"),
    title: formData.get("title"),
    company: formData.get("company"),
    location: formData.get("location"),
    workArrangement: formData.get("workArrangement") ?? "NOT_SPECIFIED",
    employmentType: formData.get("employmentType") ?? "NOT_SPECIFIED",
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    currency: formData.get("currency"),
    source: formData.get("source"),
    sourceUrl: formData.get("sourceUrl"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    deadlineAt: formData.get("deadlineAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const result = await saveAndAnalyze({ userId: user.id, values: parsed.data });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  redirect(`/dashboard/jobs?open=${result.value.applicationPublicId}`);
}

export async function changeApplicationStatusAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = changeStatusSchema.parse({
    publicId: getString(formData, "publicId"),
    status: getString(formData, "status"),
  });

  const result = await changeApplicationStatus({
    userId: user.id,
    publicId: input.publicId,
    status: input.status,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
}

export async function updateApplicationAction(
  _state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireDatabaseUser();
  const parsed = updateApplicationSchema.safeParse({
    publicId: getString(formData, "publicId"),
    status: getString(formData, "status"),
    resumeVersionPublicId: formData.get("resumeVersionPublicId"),
    appliedAt: formData.get("appliedAt"),
    followUpAt: formData.get("followUpAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the form and try again.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const result = await updateOwnedApplication({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/jobs");

  return { status: "saved", message: "Application updated.", fieldErrors: {} };
}

export async function deleteApplicationAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = applicationActionSchema.parse({
    publicId: getString(formData, "publicId"),
  });

  await deleteOwnedApplication({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}

export async function analyzeApplicationAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = applicationActionSchema.parse({
    publicId: getString(formData, "publicId"),
  });

  const result = await analyzeOwnedApplication({
    userId: user.id,
    publicId: input.publicId,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  redirect(`/dashboard/jobs?open=${result.value.publicId}`);
}

export async function analyzeApplicationFormAction(
  _state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireDatabaseUser();
  const parsed = applicationActionSchema.safeParse({
    publicId: getString(formData, "publicId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "That application could not be analysed.",
      fieldErrors: {},
    };
  }

  const result = await analyzeOwnedApplication({
    userId: user.id,
    publicId: parsed.data.publicId,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  redirect(`/dashboard/jobs?open=${result.value.publicId}`);
}
