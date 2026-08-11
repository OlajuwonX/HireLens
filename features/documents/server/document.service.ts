import "server-only";

import { describeAiFailure } from "@/lib/ai/errors";
import {
  findAnalysisById,
  findAnalysisForApplication,
} from "@/features/analyses/server/analysis.repository";
import {
  readStoredIntelligence,
  viewToPlainText,
  type AiView,
} from "@/features/analyses/server/analysis.mapper";
import { getOwnedApplication } from "@/features/applications/server/application.service";
import { resumeVersionExistsWithLabel } from "@/features/resumes/server/resume-version.repository";
import type { UpdateDocumentInput } from "../schemas/document.schema";
import type { DocumentFilters } from "./document.repository";
import { documentTypeForView } from "../constants";
import {
  buildImprovedResumePdf,
  copyImprovedResumeToVersion,
  improvedResumeVersionLabel,
  removeImprovedResumeFile,
} from "./improved-resume.service";
import {
  createGeneratedDocument,
  deleteGeneratedDocumentForUser,
  findDocumentRowForUser,
  listDocumentActivities,
  recordDocumentActivity,
  updateGeneratedDocumentIfChanged,
  listDocumentApplicationOptions,
  listDocumentsForUser,
} from "./document.repository";

export async function getDocumentBoard(input: {
  userId: string;
  filters?: DocumentFilters;
  limit?: number;
  cursor?: string;
}) {
  return listDocumentsForUser(
    input.userId,
    input.filters,
    input.limit,
    input.cursor,
  );
}

export async function getOwnedDocument(input: {
  userId: string;
  publicId: string;
}) {
  return findDocumentRowForUser(input);
}

export async function getDocumentApplicationOptions(userId: string) {
  return listDocumentApplicationOptions(userId);
}

export async function saveAnalysisView(input: {
  userId: string;
  analysisId: string;
  view: AiView;
  jobTitle: string | null;
}) {
  const analysis = await findAnalysisById({
    userId: input.userId,
    analysisId: input.analysisId,
  });

  if (!analysis) {
    return { ok: false as const, message: "That analysis could not be found." };
  }

  const result = readStoredIntelligence(analysis);

  if (!result) {
    return {
      ok: false as const,
      message: "That analysis has no stored result to save.",
    };
  }

  const content = viewToPlainText(result, input.view).trim();

  if (!content) {
    return {
      ok: false as const,
      message: "There is nothing stored for that section.",
    };
  }

  let fileAssetId: string | null = null;

  if (input.view === "IMPROVED_RESUME") {
    try {
      fileAssetId = await buildImprovedResumePdf({
        userId: input.userId,
        resume: result.improvedResume,
        jobTitle: input.jobTitle,
      });
    } catch (error) {
      console.error("Improved resume PDF failed", {
        userId: input.userId,
        analysisId: analysis.id,
        failureReason: describeAiFailure(error),
      });

      return {
        ok: false as const,
        message: "The resume PDF could not be produced. Try again.",
      };
    }
  }

  const document = await createGeneratedDocument({
    userId: input.userId,
    type: documentTypeForView[input.view],
    jobId: analysis.jobId,
    applicationId: analysis.applicationId,
    resumeVersionId: analysis.resumeVersionId,
    fileAssetId,
    promptVersion: analysis.promptVersion,
    originalContent: content,
    editedContent: content,
  });

  await recordDocumentActivity({
    userId: input.userId,
    documentId: document.id,
    kind: "CREATED",
  });

  return { ok: true as const, document };
}

export async function saveApplicationView(input: {
  userId: string;
  applicationPublicId: string;
  view: AiView;
}) {
  const row = await getOwnedApplication({
    userId: input.userId,
    publicId: input.applicationPublicId,
  });

  if (!row) {
    return {
      ok: false as const,
      message: "That application could not be found.",
    };
  }

  const analysis = await findAnalysisForApplication({
    userId: input.userId,
    applicationId: row.application.id,
  });

  if (!analysis) {
    return {
      ok: false as const,
      message: "Run the analysis for this application first.",
    };
  }

  return saveAnalysisView({
    userId: input.userId,
    analysisId: analysis.id,
    view: input.view,
    jobTitle: row.job.title,
  });
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

    await recordDocumentActivity({
      userId: input.userId,
      documentId: row.document.id,
      kind: "ADDED_TO_LIBRARY",
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
  const result = await updateGeneratedDocumentIfChanged({
    userId: input.userId,
    publicId: input.values.publicId,
    editedContent: input.values.editedContent,
  });

  if (!result.document) {
    return { ok: false as const, message: "That document could not be found." };
  }

  return { ok: true as const, changed: result.changed };
}

export async function getDocumentActivity(input: {
  userId: string;
  documentId: string;
}) {
  return listDocumentActivities(input);
}

export async function documentIsInResumeLibrary(input: {
  userId: string;
  row: Awaited<ReturnType<typeof findDocumentRowForUser>>;
}) {
  const { row } = input;

  if (!row || row.document.type !== "IMPROVED_RESUME" || !row.resumeId) {
    return false;
  }

  return resumeVersionExistsWithLabel({
    userId: input.userId,
    resumeId: row.resumeId,
    label: improvedResumeVersionLabel(row.jobTitle),
  });
}
