import {
  resumeFontFamilies,
  type ResumeFontRole,
  type ResumeTypography,
} from "@/lib/resume-design";
import type { ResumeLayout } from "./types";

const xmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => xmlEscapes[character]);
}

const roleWeight: Record<ResumeFontRole, string> = {
  regular: "400",
  bold: "700",
  italic: "400",
};

const roleStyle: Record<ResumeFontRole, string> = {
  regular: "normal",
  bold: "normal",
  italic: "italic",
};

function fontFaceRules(typography: ResumeTypography) {
  const family = resumeFontFamilies[typography];
  const roles: ResumeFontRole[] = ["regular", "bold", "italic"];

  return roles
    .map(
      (role) =>
        `@font-face{font-family:'${family.cssFamily}';src:url('/fonts/${family.files[role]}') format('truetype');font-weight:${roleWeight[role]};font-style:${roleStyle[role]};font-display:swap;}`,
    )
    .join("");
}

export function resumeLayoutToSvg(
  layout: ResumeLayout,
  typography: ResumeTypography,
  pageIndex = 0,
) {
  const page = layout.pages[pageIndex];
  const family = resumeFontFamilies[typography];

  if (!page) {
    return "";
  }

  const rules = page.rules
    .map(
      (rule) =>
        `<rect x="${rule.x}" y="${rule.y}" width="${rule.width}" height="${rule.thickness}" fill="${rule.color}"/>`,
    )
    .join("");

  const runs = page.runs
    .map(
      (run) =>
        `<text x="${run.x}" y="${run.y}" font-size="${run.size}" font-weight="${roleWeight[run.role]}" font-style="${roleStyle[run.role]}" fill="${run.color}" xml:space="preserve">${escapeXml(run.text)}</text>`,
    )
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="100%" role="img" aria-label="Resume preview, page 1">`,
    `<defs><style>${fontFaceRules(typography)}</style></defs>`,
    `<rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="#FFFFFF"/>`,
    `<g font-family="${escapeXml(family.cssStack)}">`,
    rules,
    runs,
    `</g></svg>`,
  ].join("");
}
