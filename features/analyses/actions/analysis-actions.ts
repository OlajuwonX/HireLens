"use server";

import { runGeneralResumeAnalysis } from "@/features/analyses/server/analysis.service";
import { runJobFitAnalysis } from "@/features/analyses/server/job-fit.service";
import {
  deleteEvidenceCorrection,
  upsertEvidenceCorrection,
} from "@/features/analyses/server/evidence-correction.repository";
import { findRequirementMatchForUser } from "@/features/analyses/server/requirement-match.repository";
import {
  evidenceCorrectionSchema,
  runJobFitSchema,
} from "@/features/analyses/schemas/analysis.schema";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AnalysisFormState } from "./analysis-form-state";

const runAnalysisSchema = z.object({
  resumePublicId: z.string().uuid(),
  versionPublicId: z.string().uuid(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function runGeneralResumeAnalysisAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = runAnalysisSchema.parse({
    resumePublicId: getString(formData, "resumePublicId"),
    versionPublicId: getString(formData, "versionPublicId"),
  });

  const analysis = await runGeneralResumeAnalysis({
    userId: user.id,
    versionPublicId: input.versionPublicId,
  });

  revalidatePath(
    `/dashboard/resumes/${input.resumePublicId}/versions/${input.versionPublicId}`,
  );

  if (analysis) {
    redirect(`/dashboard/analyses/${analysis.publicId}`);
  }
}

export async function runJobFitAnalysisAction(
  _state: AnalysisFormState,
  formData: FormData,
): Promise<AnalysisFormState> {
  const user = await requireDatabaseUser();
  const parsed = runJobFitSchema.safeParse({
    jobPublicId: getString(formData, "jobPublicId"),
    versionPublicId: getString(formData, "versionPublicId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Select a resume version to analyse.",
    };
  }

  const result = await runJobFitAnalysis({
    userId: user.id,
    versionPublicId: parsed.data.versionPublicId,
    jobPublicId: parsed.data.jobPublicId,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath(`/dashboard/jobs/${parsed.data.jobPublicId}`);
  redirect(`/dashboard/analyses/${result.analysisPublicId}`);
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
      message: parsed.error.issues[0]?.message ?? "Could not save that.",
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

  revalidatePath(`/dashboard/analyses/${parsed.data.analysisPublicId}`);

  return {
    status: "saved",
    message: isEmpty ? "Correction removed." : "Correction saved.",
  };
}
