import "server-only";

import { PDFDocument, rgb } from "pdf-lib";
import { embedResumeFonts, loadResumeMetrics } from "@/lib/resume-render/fonts";
import { sanitizePdfText, wrapText } from "./text-layout";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const BODY_SIZE = 10.5;
const LINE_HEIGHT = BODY_SIZE * 1.42;
const PARAGRAPH_GAP = 7;
const INK = rgb(0.086, 0.102, 0.094);

function toParagraphs(text: string) {
  return sanitizePdfText(text, { trim: false })
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

export async function renderCoverLetterPdf(text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedResumeFonts(doc, "INTER", ["regular"]);
  const metrics = await loadResumeMetrics("INTER");
  const measure = (value: string) =>
    metrics.widthOf(value, BODY_SIZE, "regular");
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  doc.setTitle("Cover letter");
  doc.setProducer("HireLens");
  doc.setCreator("HireLens");

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const paragraph of toParagraphs(text)) {
    for (const line of wrapText(paragraph, measure, maxWidth)) {
      if (y - LINE_HEIGHT < MARGIN) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }

      page.drawText(line, {
        x: MARGIN,
        y: y - BODY_SIZE,
        size: BODY_SIZE,
        font: fonts.regular,
        color: INK,
      });

      y -= LINE_HEIGHT;
    }

    y -= PARAGRAPH_GAP;
  }

  return doc.save();
}
