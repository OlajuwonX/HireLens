export const RESUME_TEMPLATES = [
  "CLASSIC",
  "EDITORIAL",
  "COMPACT",
  "MODERN",
] as const;

export const RESUME_TYPOGRAPHY = [
  "INTER",
  "SOURCE_SANS_3",
  "SOURCE_SERIF_4",
] as const;

export const RESUME_SPACING = ["COMPACT", "STANDARD"] as const;

export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number];
export type ResumeTypography = (typeof RESUME_TYPOGRAPHY)[number];
export type ResumeSpacing = (typeof RESUME_SPACING)[number];

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplate = "CLASSIC";
export const DEFAULT_RESUME_TYPOGRAPHY: ResumeTypography = "INTER";
export const DEFAULT_RESUME_SPACING: ResumeSpacing = "STANDARD";

export const resumeTemplateLabels: Record<ResumeTemplate, string> = {
  CLASSIC: "Classic",
  EDITORIAL: "Editorial",
  COMPACT: "Compact",
  MODERN: "Modern",
};

export const resumeTemplateHints: Record<ResumeTemplate, string> = {
  CLASSIC: "Conservative and corporate",
  EDITORIAL: "Elegant and executive",
  COMPACT: "Fits more on one page",
  MODERN: "Clean with a restrained accent",
};

export const resumeTypographyLabels: Record<ResumeTypography, string> = {
  INTER: "Inter",
  SOURCE_SANS_3: "Source Sans 3",
  SOURCE_SERIF_4: "Source Serif 4",
};

export const resumeSpacingLabels: Record<ResumeSpacing, string> = {
  COMPACT: "Compact",
  STANDARD: "Standard",
};

export const MIN_RESUME_BODY_SIZE = 9;
export const MIN_RESUME_LEADING = 1.15;
