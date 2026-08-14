"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  requireAdminUser,
  OPS_CONSOLE_PATH,
} from "@/features/admin/server/require-admin";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import {
  createBugReportSchema,
  updateBugStatusSchema,
} from "../schemas/bug-report.schema";
import { submitBugReport } from "../server/bug-report.service";
import { updateBugReportStatus } from "../server/bug-report.repository";
import type { BugReportFormState } from "./bug-report-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitBugReportAction(
  _state: BugReportFormState,
  formData: FormData,
): Promise<BugReportFormState> {
  const user = await requireDatabaseUser();
  const parsed = createBugReportSchema.safeParse({
    category: getString(formData, "category"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    route: formData.get("route"),
    sentryEventId: formData.get("sentryEventId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(parsed.error, "Check the form and try again."),
    };
  }

  const result = await submitBugReport({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "sent",
    message: "Thanks — your report has been submitted.",
  };
}

export async function updateBugStatusAction(formData: FormData) {
  await requireAdminUser();

  const parsed = updateBugStatusSchema.safeParse({
    publicId: getString(formData, "publicId"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return;
  }

  await updateBugReportStatus(parsed.data);

  revalidatePath(OPS_CONSOLE_PATH);
  revalidatePath(`${OPS_CONSOLE_PATH}/${parsed.data.publicId}`);
}
