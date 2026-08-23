import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import {
  formatDateRange,
  joinNonEmpty,
  sanitizePdfText,
  wrapText,
} from "./text-layout";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const ink = rgb(0.09, 0.1, 0.12);
const muted = rgb(0.38, 0.4, 0.45);
const rule = rgb(0.82, 0.84, 0.87);

type Fonts = { regular: PDFFont; bold: PDFFont };

class ResumeCanvas {
  private page: PDFPage;
  private cursor = PAGE_HEIGHT - MARGIN;

  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: Fonts,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  private ensure(height: number) {
    if (this.cursor - height >= MARGIN) {
      return;
    }

    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.cursor = PAGE_HEIGHT - MARGIN;
  }

  space(height: number) {
    this.cursor -= height;
  }

  text(
    value: string,
    options: {
      size: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      lineHeight?: number;
      indent?: number;
    },
  ) {
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const indent = options.indent ?? 0;
    const lineHeight = options.lineHeight ?? options.size * 1.35;
    const lines = wrapText(
      value,
      (text) => font.widthOfTextAtSize(text, options.size),
      CONTENT_WIDTH - indent,
    );

    for (const line of lines) {
      this.ensure(lineHeight);
      this.cursor -= lineHeight;
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.cursor,
        size: options.size,
        font,
        color: options.color ?? ink,
      });
    }

    return lines.length;
  }

  bullet(value: string, size: number) {
    const font = this.fonts.regular;
    const lineHeight = size * 1.4;
    const marker = "-";
    const markerWidth = font.widthOfTextAtSize(`${marker} `, size);
    const lines = wrapText(
      value,
      (text) => font.widthOfTextAtSize(text, size),
      CONTENT_WIDTH - markerWidth,
    );

    lines.forEach((line, index) => {
      this.ensure(lineHeight);
      this.cursor -= lineHeight;

      if (index === 0) {
        this.page.drawText(marker, {
          x: MARGIN,
          y: this.cursor,
          size,
          font,
          color: muted,
        });
      }

      this.page.drawText(line, {
        x: MARGIN + markerWidth,
        y: this.cursor,
        size,
        font,
        color: ink,
      });
    });
  }

  sectionHeading(label: string) {
    this.ensure(28);
    this.space(14);
    this.text(label.toUpperCase(), { size: 9, bold: true, color: muted });
    this.space(4);
    this.ensure(6);
    this.page.drawLine({
      start: { x: MARGIN, y: this.cursor },
      end: { x: PAGE_WIDTH - MARGIN, y: this.cursor },
      thickness: 0.75,
      color: rule,
    });
    this.space(8);
  }

  splitRow(left: string, right: string, size: number, bold: boolean) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    const lineHeight = size * 1.4;
    const rightText = sanitizePdfText(right);
    const rightWidth = rightText ? font.widthOfTextAtSize(rightText, size) : 0;
    const leftLines = wrapText(
      left,
      (text) => font.widthOfTextAtSize(text, size),
      CONTENT_WIDTH - rightWidth - 12,
    );

    leftLines.forEach((line, index) => {
      this.ensure(lineHeight);
      this.cursor -= lineHeight;
      this.page.drawText(line, {
        x: MARGIN,
        y: this.cursor,
        size,
        font,
        color: ink,
      });

      if (index === 0 && rightText) {
        this.page.drawText(rightText, {
          x: PAGE_WIDTH - MARGIN - rightWidth,
          y: this.cursor,
          size,
          font: this.fonts.regular,
          color: muted,
        });
      }
    });
  }
}

export async function renderImprovedResumePdf(
  resume: ImprovedResume,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  doc.setTitle(`${sanitizePdfText(resume.header.name)} - Resume`);
  doc.setProducer("HireLens");
  doc.setCreator("HireLens");

  const canvas = new ResumeCanvas(doc, fonts);

  canvas.text(resume.header.name, { size: 20, bold: true });
  canvas.space(2);
  canvas.text(resume.header.headline, { size: 11, color: muted });

  const contactLine = joinNonEmpty(
    [
      resume.header.email,
      resume.header.phone,
      resume.header.location,
      ...resume.header.links,
    ],
    "  |  ",
  );

  if (contactLine) {
    canvas.space(4);
    canvas.text(contactLine, { size: 9, color: muted });
  }

  if (resume.professionalSummary) {
    canvas.sectionHeading("Summary");
    canvas.text(resume.professionalSummary, { size: 10, lineHeight: 14 });
  }

  if (resume.skills.length > 0) {
    canvas.sectionHeading("Skills");

    for (const group of resume.skills) {
      if (group.items.length === 0) {
        continue;
      }

      canvas.text(`${group.category}: ${group.items.join(", ")}`, {
        size: 10,
        lineHeight: 14,
      });
      canvas.space(3);
    }
  }

  if (resume.experience.length > 0) {
    canvas.sectionHeading("Experience");

    resume.experience.forEach((entry, index) => {
      if (index > 0) {
        canvas.space(8);
      }

      canvas.splitRow(
        entry.title,
        formatDateRange(entry.startDate, entry.endDate),
        11,
        true,
      );

      const context = joinNonEmpty([entry.company, entry.location], " - ");

      if (context) {
        canvas.text(context, { size: 9.5, color: muted });
      }

      canvas.space(3);

      for (const bullet of entry.bullets) {
        canvas.bullet(bullet, 10);
      }
    });
  }

  if (resume.projects.length > 0) {
    canvas.sectionHeading("Projects");

    resume.projects.forEach((project, index) => {
      if (index > 0) {
        canvas.space(6);
      }

      canvas.text(project.name, { size: 10.5, bold: true });

      if (project.technologies.length > 0) {
        canvas.text(project.technologies.join(", "), {
          size: 9.5,
          color: muted,
        });
      }

      canvas.space(3);

      for (const bullet of project.bullets) {
        canvas.bullet(bullet, 10);
      }
    });
  }

  if (resume.education.length > 0) {
    canvas.sectionHeading("Education");

    resume.education.forEach((entry, index) => {
      if (index > 0) {
        canvas.space(6);
      }

      canvas.splitRow(entry.qualification, entry.date ?? "", 10.5, true);
      canvas.text(entry.institution, { size: 9.5, color: muted });
    });
  }

  return doc.save();
}
