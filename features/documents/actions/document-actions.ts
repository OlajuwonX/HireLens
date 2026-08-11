"use server";

import {
  AI_VIEWS,
  type AiView,
} from "@/features/analyses/server/analysis.mapper";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateDocumentSchema } from "../schemas/document.schema";
import {
  addImprovedResumeToLibrary,
  deleteOwnedDocument,
  saveApplicationView,
  updateOwnedDocument,
} from "../server/document.service";
import type { DocumentFormState } from "./document-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readView(formData: FormData): AiView | null {
  const raw = getString(formData, "view");

  return AI_VIEWS.includes(raw as AiView) ? (raw as AiView) : null;
}

export async function saveAnalysisViewAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireDatabaseUser();
  const view = readView(formData);

  if (!view) {
    return { status: "error", message: "That AI result is not recognised." };
  }

  const result = await saveApplicationView({
    userId: user.id,
    applicationPublicId: getString(formData, "applicationPublicId"),
    view,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/jobs");

  return { status: "saved", message: "Saved to AI Documents." };
}

export async function updateDocumentAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireDatabaseUser();
  const parsed = updateDocumentSchema.safeParse({
    publicId: getString(formData, "publicId"),
    editedContent: getString(formData, "editedContent"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(
        parsed.error,
        "Check the document and try again.",
      ),
    };
  }

  const result = await updateOwnedDocument({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${parsed.data.publicId}`);

  return { status: "saved", message: "Document saved." };
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const publicId = getString(formData, "publicId");
  const result = await deleteOwnedDocument({ userId: user.id, publicId });

  if (!result.ok) {
    return;
  }

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/documents");
}

export async function addImprovedResumeToLibraryAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireDatabaseUser();
  const publicId = getString(formData, "publicId");
  const result = await addImprovedResumeToLibrary({
    userId: user.id,
    publicId,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/documents/${publicId}`);

  return {
    status: "saved",
    message: `Added to your library as "${result.version.label}".`,
  };
}
