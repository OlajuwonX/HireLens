import "server-only";

import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import { PDFDocument, rgb } from "pdf-lib";
import {
  readResumeDesignSelection,
  resolveResumeDesign,
  type ResumeDesignSelection,
  type ResumeFontRole,
} from "@/lib/resume-design";
import { embedResumeFonts, loadResumeMetrics } from "@/lib/resume-render/fonts";
import { buildResumeLayout } from "@/lib/resume-render/layout";
import { resumeLayoutToSvg } from "@/lib/resume-render/svg";
import type { ResumeLayout } from "@/lib/resume-render/types";
import { sanitizePdfText } from "./text-layout";

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;

  return rgb(red, green, blue);
}

function rolesUsedIn(layout: ResumeLayout): ResumeFontRole[] {
  const roles = new Set<ResumeFontRole>(["regular"]);

  for (const page of layout.pages) {
    for (const run of page.runs) {
      roles.add(run.role);
    }
  }

  return [...roles];
}

async function layoutFor(
  resume: ImprovedResume,
  selection: ResumeDesignSelection,
) {
  const design = resolveResumeDesign(selection);
  const metrics = await loadResumeMetrics(selection.typography);

  return buildResumeLayout(resume, design, metrics);
}

export async function renderImprovedResumePdf(
  resume: ImprovedResume,
  selection?: Partial<ResumeDesignSelection>,
): Promise<Uint8Array> {
  const design = readResumeDesignSelection(selection);
  const layout = await layoutFor(resume, design);
  const doc = await PDFDocument.create();
  const fonts = await embedResumeFonts(
    doc,
    design.typography,
    rolesUsedIn(layout),
  );

  doc.setTitle(`${sanitizePdfText(resume.header.name)} - Resume`);
  doc.setProducer("HireLens");
  doc.setCreator("HireLens");

  for (const layoutPage of layout.pages) {
    const page = doc.addPage([layout.width, layout.height]);

    for (const rule of layoutPage.rules) {
      page.drawRectangle({
        x: rule.x,
        y: layout.height - rule.y - rule.thickness,
        width: rule.width,
        height: rule.thickness,
        color: hexToRgb(rule.color),
      });
    }

    for (const run of layoutPage.runs) {
      page.drawText(run.text, {
        x: run.x,
        y: layout.height - run.y,
        size: run.size,
        font: fonts[run.role] ?? fonts.regular,
        color: hexToRgb(run.color),
      });
    }
  }

  return doc.save();
}

export async function buildImprovedResumeLayout(
  resume: ImprovedResume,
  selection?: Partial<ResumeDesignSelection>,
): Promise<ResumeLayout> {
  return layoutFor(resume, readResumeDesignSelection(selection));
}

export async function renderImprovedResumePageSvg(
  resume: ImprovedResume,
  selection?: Partial<ResumeDesignSelection>,
): Promise<{ svg: string; pageCount: number }> {
  const design = readResumeDesignSelection(selection);
  const layout = await layoutFor(resume, design);

  return {
    svg: resumeLayoutToSvg(layout, design.typography, 0),
    pageCount: layout.pages.length,
  };
}
