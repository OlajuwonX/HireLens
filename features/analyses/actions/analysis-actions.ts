"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { evidenceCorrectionSchema } from "../schemas/analysis.schema";
import {
  deleteEvidenceCorrection,
  findAnalysisById,
  upsertEvidenceCorrection,
} from "../server/analysis.repository";
import { readStoredIntelligence } from "../server/analysis.mapper";
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
    analysisId: getString(formData, "analysisId"),
    requirementKey: getString(formData, "requirementKey"),
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

  const analysis = await findAnalysisById({
    userId: user.id,
    analysisId: parsed.data.analysisId,
  });

  if (!analysis) {
    return { status: "error", message: "That analysis could not be found." };
  }

  const result = readStoredIntelligence(analysis);
  const match = result?.requirementMatches.find(
    (candidate) => candidate.key === parsed.data.requirementKey,
  );

  if (!match) {
    return { status: "error", message: "That requirement could not be found." };
  }

  const isEmpty =
    !parsed.data.markedIncorrect && !parsed.data.evidence && !parsed.data.notes;

  if (isEmpty) {
    await deleteEvidenceCorrection({
      userId: user.id,
      analysisId: analysis.id,
      requirementKey: match.key,
    });
  } else {
    await upsertEvidenceCorrection({
      userId: user.id,
      analysisId: analysis.id,
      requirementKey: match.key,
      requirement: match.requirement,
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
