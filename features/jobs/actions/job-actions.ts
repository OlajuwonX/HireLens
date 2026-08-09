"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  archiveOwnedJob,
  createOwnedJob,
  deleteOwnedJob,
  duplicateOwnedJob,
  restoreOwnedJob,
  updateOwnedJob,
} from "@/features/jobs/server/job.service";
import {
  createJobSchema,
  jobActionSchema,
} from "@/features/jobs/schemas/job.schema";
import type { JobFormState } from "./job-form-state";

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

function readJobForm(formData: FormData) {
  return createJobSchema.safeParse({
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
}

export async function createJobAction(
  _state: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await requireDatabaseUser();
  const parsed = readJobForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const job = await createOwnedJob({ userId: user.id, values: parsed.data });

  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${job.publicId}`);
}

export async function updateJobAction(
  _state: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await requireDatabaseUser();
  const target = jobActionSchema.safeParse({
    publicId: formData.get("publicId"),
  });

  if (!target.success) {
    return {
      status: "error",
      message: "That job could not be found.",
      fieldErrors: {},
    };
  }

  const parsed = readJobForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const job = await updateOwnedJob({
    userId: user.id,
    publicId: target.data.publicId,
    values: parsed.data,
  });

  if (!job) {
    return {
      status: "error",
      message: "That job could not be found.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${job.publicId}`);
  redirect(`/dashboard/jobs/${job.publicId}`);
}

export async function archiveJobAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = jobActionSchema.parse({ publicId: formData.get("publicId") });

  await archiveOwnedJob({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${input.publicId}`);
}

export async function restoreJobAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = jobActionSchema.parse({ publicId: formData.get("publicId") });

  await restoreOwnedJob({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${input.publicId}`);
}

export async function duplicateJobAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = jobActionSchema.parse({ publicId: formData.get("publicId") });

  const copy = await duplicateOwnedJob({
    userId: user.id,
    publicId: input.publicId,
  });

  revalidatePath("/dashboard/jobs");

  if (copy) {
    redirect(`/dashboard/jobs/${copy.publicId}`);
  }
}

export async function deleteJobAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = jobActionSchema.parse({ publicId: formData.get("publicId") });

  await deleteOwnedJob({ userId: user.id, publicId: input.publicId });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}
