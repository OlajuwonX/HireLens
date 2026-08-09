import "server-only";

import { hashAnalysisInput } from "@/lib/ai";
import { getResumeAIProvider } from "@/lib/ai/provider";
import { getOwnedApplication } from "@/features/applications/server/application.service";
import { getOwnedJob } from "@/features/jobs/server/job.service";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import type { UsageAction } from "@/lib/db/schema";
import type { GenerateDocumentInput, UpdateDocumentInput } from "../schemas/document.schema";
import { documentTypeLabels } from "../constants";
import {
  createGeneratedDocument,
  findDocumentRowForUser,
  listDocumentApplicationOptions,
  listDocumentsForUser,
  updateGeneratedDocumentForUser,
} from "./document.repository";

const documentUsageAction: Record<GenerateDocumentInput["type"], UsageAction> = {
  IMPROVED_RESUME: "IMPROVED_RESUME",
  COVER_LETTER: "COVER_LETTER",
  APPLICATION_EMAIL: "APPLICATION_MESSAGE",
  PROFESSIONAL_SUMMARY: "PROFESSIONAL_SUMMARY",
  KEYWORD_ANALYSIS: "KEYWORD_ANALYSIS",
  BULLET_REWRITE: "BULLET_REWRITE",
  FOLLOW_UP_MESSAGE: "FOLLOW_UP_MESSAGE",
};

export async function getDocumentBoard(userId: string) {
  return listDocumentsForUser(userId);
}

export async function getOwnedDocument(input: { userId: string; publicId: string }) {
  return findDocumentRowForUser(input);
}

export async function getDocumentApplicationOptions(userId: string) {
  return listDocumentApplicationOptions(userId);
}

export async function generateOwnedDocument(input: {
  userId: string;
  values: GenerateDocumentInput;
}) {
  const job = await getOwnedJob({
    userId: input.userId,
    publicId: input.values.jobPublicId,
  });

  if (!job) {
    return { ok: false as const, message: "That job could not be found." };
  }

  const version = input.values.resumeVersionPublicId
    ? await getOwnedResumeVersion({
        userId: input.userId,
        versionPublicId: input.values.resumeVersionPublicId,
      })
    : null;

  if (input.values.resumeVersionPublicId && !version) {
    return { ok: false as const, message: "That resume version could not be found." };
  }

  const application = input.values.applicationPublicId
    ? await getOwnedApplication({
        userId: input.userId,
        publicId: input.values.applicationPublicId,
      })
    : null;

  if (input.values.applicationPublicId && !application) {
    return { ok: false as const, message: "That application could not be found." };
  }

  const action = documentUsageAction[input.values.type];
  const inputHash = await hashAnalysisInput({
    aiAction: action,
    promptVersion: "application-document-v1",
    documentType: input.values.type,
    jobId: job.id,
    jobUpdatedAt: job.updatedAt.toISOString(),
    resumeVersionId: version?.id ?? null,
    applicationId: application?.application.id ?? null,
    notes: input.values.notes ?? null,
  });
  const reservation = await reserveUsage({ userId: input.userId, action });

  if (!reservation.ok) {
    return { ok: false as const, message: reservation.message };
  }

  let result;

  try {
    result = await getResumeAIProvider().generateApplicationDocument({
      documentType: documentTypeLabels[input.values.type],
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      requirements: job.requirements,
      resumeLabel: version?.label ?? null,
      resumeText: version?.extractedText ?? null,
      applicationStatus: application?.application.status ?? null,
      notes: input.values.notes ?? null,
    });

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action,
      provider: result.provider,
      model: result.model,
      inputHash,
    });
  } catch (error) {
    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action,
      inputHash,
      failureReason:
        error instanceof Error ? error.name : "Unknown document generation failure",
    });

    return {
      ok: false as const,
      message: "The document could not be generated. Try again.",
    };
  }

  const content = String(result.rawResponse).trim();
  const document = await createGeneratedDocument({
    userId: input.userId,
    type: input.values.type,
    jobId: job.id,
    applicationId: application?.application.id ?? null,
    resumeVersionId: version?.id ?? null,
    promptVersion: "application-document-v1",
    originalContent: content,
    editedContent: content,
  });

  return { ok: true as const, document };
}

export async function updateOwnedDocument(input: {
  userId: string;
  values: UpdateDocumentInput;
}) {
  const document = await updateGeneratedDocumentForUser({
    userId: input.userId,
    publicId: input.values.publicId,
    editedContent: input.values.editedContent,
  });

  if (!document) {
    return { ok: false as const, message: "That document could not be found." };
  }

  return { ok: true as const, document };
}
