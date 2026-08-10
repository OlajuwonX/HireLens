"use server";

import {
  deleteEvidenceCorrection,
  upsertEvidenceCorrection,
} from "@/features/analyses/server/evidence-correction.repository";
import { findRequirementMatchForUser } from "@/features/analyses/server/requirement-match.repository";
import { evidenceCorrectionSchema } from "@/features/analyses/schemas/analysis.schema";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { revalidatePath } from "next/cache";
import type { AnalysisFormState } from "./analysis-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveEvidenceCorrectionAction(
  _state: AnalysisFormState,
  formData: FormData,
): Promise<AnalysisFormState> {
  const user = await requireDatabaseUser();
  const parsed = evidenceCorrectionSchema.safeParse({
    matchId: getString(formData, "matchId"),
    analysisPublicId: getString(formData, "analysisPublicId"),
    markedIncorrect: formData.get("markedIncorrect") === "on",
    evidence: formData.get("evidence"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(parsed.error, "Could not save that."),
    };
  }

  const match = await findRequirementMatchForUser({
    userId: user.id,
    matchId: parsed.data.matchId,
  });

  if (!match) {
    return { status: "error", message: "That requirement could not be found." };
  }

  const isEmpty =
    !parsed.data.markedIncorrect && !parsed.data.evidence && !parsed.data.notes;

  if (isEmpty) {
    await deleteEvidenceCorrection({
      userId: user.id,
      requirementMatchId: match.id,
    });
  } else {
    await upsertEvidenceCorrection({
      userId: user.id,
      requirementMatchId: match.id,
      markedIncorrect: parsed.data.markedIncorrect,
      evidence: parsed.data.evidence ?? null,
      notes: parsed.data.notes ?? null,
    });
  }

  revalidatePath("/dashboard/jobs");

  return {
    status: "saved",
    message: isEmpty ? "Correction removed." : "Correction saved.",
  };
}
