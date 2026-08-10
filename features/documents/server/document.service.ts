import "server-only";

import { hashAnalysisInput, IMPROVED_RESUME_PROMPT_VERSION } from "@/lib/ai";
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
import { aiFailureMessage, describeAiFailure } from "@/lib/ai/ai-failure";
import {
  buildImprovedResume,
  copyImprovedResumeToVersion,
  createImprovedResumeReadUrl,
  removeImprovedResumeFile,
} from "./improved-resume.service";
import { improvedResumeVersionLabel } from "../improved-resume-format";
import type { GenerateDocumentInput, UpdateDocumentInput } from "../schemas/document.schema";
import { documentTypeLabels } from "../constants";
import {
  createGeneratedDocument,
  deleteGeneratedDocumentForUser,
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

  const isImprovedResume = input.values.type === "IMPROVED_RESUME";

  if (isImprovedResume && !version) {
    return {
      ok: false as const,
      message: "Attach a resume version before rewriting it for this job.",
    };
  }

  const action = documentUsageAction[input.values.type];
  const promptVersion = isImprovedResume
    ? IMPROVED_RESUME_PROMPT_VERSION
    : "application-document-v1";
  const inputHash = await hashAnalysisInput({
    aiAction: action,
    promptVersion,
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

  let content: string;
  let fileAssetId: string | null = null;
  let result: { provider: string; model: string };

  try {
    if (isImprovedResume && version) {
      const artifact = await buildImprovedResume({
        userId: input.userId,
        job,
        version,
        notes: input.values.notes ?? null,
      });

      content = artifact.content;
      fileAssetId = artifact.fileAssetId;
      result = { provider: artifact.provider, model: artifact.model };
    } else {
      const generated = await getResumeAIProvider().generateApplicationDocument({
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

      content = String(generated.rawResponse).trim();
      result = { provider: generated.provider, model: generated.model };
    }

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action,
      provider: result.provider,
      model: result.model,
      inputHash,
    });
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Document generation failed", {
      userId: input.userId,
      type: input.values.type,
      jobPublicId: input.values.jobPublicId,
      applicationPublicId: input.values.applicationPublicId ?? null,
      failureReason,
    });

    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action,
      inputHash,
      failureReason,
    });

    return {
      ok: false as const,
      message: aiFailureMessage(
        error,
        "The document could not be generated. Try again.",
      ),
    };
  }

  const document = await createGeneratedDocument({
    userId: input.userId,
    type: input.values.type,
    jobId: job.id,
    applicationId: application?.application.id ?? null,
    resumeVersionId: version?.id ?? null,
    fileAssetId,
    promptVersion,
    originalContent: content,
    editedContent: content,
  });

  return { ok: true as const, document };
}

export async function deleteOwnedDocument(input: {
  userId: string;
  publicId: string;
}) {
  const row = await findDocumentRowForUser(input);

  if (!row) {
    return { ok: false as const, message: "That document could not be found." };
  }

  await deleteGeneratedDocumentForUser(input);

  if (row.document.fileAssetId) {
    await removeImprovedResumeFile({
      userId: input.userId,
      fileAssetId: row.document.fileAssetId,
    }).catch(() => undefined);
  }

  return { ok: true as const };
}

export async function createOwnedDocumentReadUrl(input: {
  userId: string;
  publicId: string;
}) {
  const row = await findDocumentRowForUser(input);

  if (!row?.document.fileAssetId) {
    return null;
  }

  return createImprovedResumeReadUrl({
    userId: input.userId,
    fileAssetId: row.document.fileAssetId,
  });
}

export async function addImprovedResumeToLibrary(input: {
  userId: string;
  publicId: string;
}) {
  const row = await findDocumentRowForUser(input);

  if (!row) {
    return { ok: false as const, message: "That document could not be found." };
  }

  if (row.document.type !== "IMPROVED_RESUME" || !row.document.fileAssetId) {
    return {
      ok: false as const,
      message: "Only an improved resume can be added to your library.",
    };
  }

  if (!row.resumeId) {
    return {
      ok: false as const,
      message: "The resume group this was based on no longer exists.",
    };
  }

  try {
    const version = await copyImprovedResumeToVersion({
      userId: input.userId,
      fileAssetId: row.document.fileAssetId,
      resumeId: row.resumeId,
      label: improvedResumeVersionLabel(row.jobTitle),
    });

    return { ok: true as const, version };
  } catch (error) {
    console.error("Improved resume add-back failed", {
      userId: input.userId,
      publicId: input.publicId,
      failureReason: describeAiFailure(error),
    });

    return {
      ok: false as const,
      message: "That resume could not be added to your library. Try again.",
    };
  }
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
