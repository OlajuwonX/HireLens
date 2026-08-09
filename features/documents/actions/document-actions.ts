"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  generateDocumentSchema,
  updateDocumentSchema,
} from "../schemas/document.schema";
import {
  generateOwnedDocument,
  updateOwnedDocument,
} from "../server/document.service";
import type { DocumentFormState } from "./document-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function generateDocumentAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireDatabaseUser();
  const parsed = generateDocumentSchema.safeParse({
    type: getString(formData, "type"),
    jobPublicId: getString(formData, "jobPublicId"),
    resumeVersionPublicId: formData.get("resumeVersionPublicId"),
    applicationPublicId: formData.get("applicationPublicId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const result = await generateOwnedDocument({
    userId: user.id,
    values: parsed.data,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard/documents");
  redirect(`/dashboard/documents/${result.document.publicId}`);
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
      message:
        parsed.error.issues[0]?.message ?? "Check the document and try again.",
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
