import "server-only";

import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import {
  readResumeDesignSelection,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import { renderImprovedResumeDocx } from "@/lib/docx/resume-docx";
import {
  renderImprovedResumePageSvg,
  renderImprovedResumePdf,
} from "@/lib/pdf/resume-document";
import { findAnalysisForDocumentSource } from "@/features/analyses/server/analysis.repository";
import {
  improvedResumeToText,
  readStoredIntelligence,
} from "@/features/analyses/server/analysis.mapper";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { parseEditableResume } from "../schemas/editable-resume.schema";
import {
  findDocumentRowForUser,
  updateGeneratedDocumentDesign,
  updateGeneratedDocumentResume,
  type DocumentRow,
} from "./document.repository";
import { improvedResumeFilename } from "../improved-resume-format";

export type ResumeDesignSource = {
  row: DocumentRow;
  resume: ImprovedResume;
  selection: ResumeDesignSelection;
  edited: boolean;
  editVersion: number;
};

export function readEditedResume(value: unknown): ImprovedResume | null {
  if (!value) {
    return null;
  }

  const parsed = improvedResumeSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

export function documentDesignSelection(row: DocumentRow) {
  return readResumeDesignSelection({
    template: row.document.resumeTemplate,
    typography: row.document.resumeTypography,
    spacing: row.document.resumeSpacing,
  });
}

export async function findResumeDesignSource(input: {
  userId: string;
  publicId: string;
}): Promise<ResumeDesignSource | null> {
  const row = await findDocumentRowForUser(input);

  if (!row || row.document.type !== "IMPROVED_RESUME") {
    return null;
  }

  const selection = documentDesignSelection(row);
  const editVersion = row.document.editVersion;
  const edited = readEditedResume(row.document.editedResumeJson);

  if (edited) {
    return { row, resume: edited, selection, edited: true, editVersion };
  }

  const analysis = await findAnalysisForDocumentSource({
    userId: input.userId,
    applicationId: row.document.applicationId,
    resumeVersionId: row.document.resumeVersionId,
    jobId: row.document.jobId,
  });

  if (!analysis) {
    return null;
  }

  const result = readStoredIntelligence(analysis);

  if (!result || result.improvedResume.experience.length === 0) {
    return null;
  }

  return {
    row,
    resume: result.improvedResume,
    selection,
    edited: false,
    editVersion,
  };
}

export async function documentSupportsResumeDesign(input: {
  userId: string;
  publicId: string;
}) {
  return Boolean(await findResumeDesignSource(input));
}

export async function saveResumeDesignSelection(input: {
  userId: string;
  publicId: string;
  selection: ResumeDesignSelection;
}) {
  const document = await updateGeneratedDocumentDesign({
    userId: input.userId,
    publicId: input.publicId,
    resumeTemplate: input.selection.template,
    resumeTypography: input.selection.typography,
    resumeSpacing: input.selection.spacing,
  });

  return document ? { ok: true as const } : { ok: false as const };
}

export async function saveEditedResume(input: {
  userId: string;
  publicId: string;
  resume: unknown;
  expectedVersion: number;
}) {
  const parsed = parseEditableResume(input.resume);

  if (!parsed.ok) {
    return {
      ok: false as const,
      reason: "INVALID" as const,
      message: parsed.error
        ? (parsed.error.issues[0]?.message ?? "Check the resume and try again.")
        : "That resume is too large to save.",
    };
  }

  const result = await updateGeneratedDocumentResume({
    userId: input.userId,
    publicId: input.publicId,
    resume: parsed.resume,
    editedContent: improvedResumeToText(parsed.resume),
    expectedVersion: input.expectedVersion,
  });

  if (result.status === "missing") {
    return {
      ok: false as const,
      reason: "MISSING" as const,
      message: "That document could not be found.",
    };
  }

  if (result.status === "conflict") {
    return {
      ok: false as const,
      reason: "CONFLICT" as const,
      version: result.version,
      message: "This resume changed in another tab. Reload to keep editing.",
    };
  }

  return { ok: true as const, version: result.version };
}

export async function renderResumeDesignPreview(input: {
  userId: string;
  publicId: string;
  selection: ResumeDesignSelection;
}) {
  const source = await findResumeDesignSource(input);

  if (!source) {
    return null;
  }

  return renderImprovedResumePageSvg(source.resume, input.selection);
}

export type RenderedResumeFile = {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
};

export async function renderResumeDesignDownload(input: {
  userId: string;
  publicId: string;
  selection: ResumeDesignSelection;
  format: "PDF" | "DOCX";
}): Promise<RenderedResumeFile | null> {
  const source = await findResumeDesignSource(input);

  if (!source) {
    return null;
  }

  const base = improvedResumeFilename(
    source.resume.header.name,
    source.row.jobTitle ?? source.resume.header.headline,
  ).replace(/\.pdf$/i, "");

  if (input.format === "DOCX") {
    return {
      bytes: await renderImprovedResumeDocx(source.resume, input.selection),
      filename: `${base}.docx`,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  return {
    bytes: await renderImprovedResumePdf(source.resume, input.selection),
    filename: `${base}.pdf`,
    contentType: "application/pdf",
  };
}
