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
import { readStoredIntelligence } from "@/features/analyses/server/analysis.mapper";
import {
  findDocumentRowForUser,
  updateGeneratedDocumentDesign,
  type DocumentRow,
} from "./document.repository";
import { improvedResumeFilename } from "../improved-resume-format";

export type ResumeDesignSource = {
  row: DocumentRow;
  resume: ImprovedResume;
  selection: ResumeDesignSelection;
};

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
    selection: documentDesignSelection(row),
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
