"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { saveResumeDesignSchema } from "../schemas/resume-design.schema";
import { saveResumeDesignSelection } from "../server/resume-design.service";
import type { DocumentFormState } from "./document-form-state";

export async function saveResumeDesignAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireDatabaseUser();
  const parsed = saveResumeDesignSchema.safeParse({
    publicId: formData.get("publicId"),
    template: formData.get("template"),
    typography: formData.get("typography"),
    spacing: formData.get("spacing"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(
        parsed.error,
        "That resume design is not recognised.",
      ),
    };
  }

  const result = await saveResumeDesignSelection({
    userId: user.id,
    publicId: parsed.data.publicId,
    selection: {
      template: parsed.data.template,
      typography: parsed.data.typography,
      spacing: parsed.data.spacing,
    },
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "That document could not be found.",
    };
  }

  revalidatePath(`/dashboard/documents/${parsed.data.publicId}`);

  return { status: "saved", message: "Resume design saved." };
}
