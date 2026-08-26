import type { ResumeTemplate, ResumeTypography } from "./constants";

export type ResumeTypeRole =
  | "name"
  | "headline"
  | "contact"
  | "sectionLabel"
  | "entryTitle"
  | "entryMeta"
  | "body"
  | "dateRange";

export type ResumeRuleSpec = {
  thickness: number;
  color: string;
  gapAbove: number;
  gapBelow: number;
};

export type ResumeTemplateDescriptor = {
  margin: { top: number; right: number; bottom: number; left: number };
  scale: Record<ResumeTypeRole, number>;
  leading: number;
  sectionGap: number;
  entryGap: number;
  bulletGap: number;
  headerGap: number;
  headerAlign: "left" | "center";
  headerLayout: "stacked" | "inline";
  sectionLabelCase: "upper" | "title";
  sectionLabelTracking: number;
  sectionLabelBold: boolean;
  sectionRule: ResumeRuleSpec | null;
  headerRule: ResumeRuleSpec | null;
  inlineSectionLabels: boolean;
  inlineEntryMeta: boolean;
  metaItalic: boolean;
  bulletGlyph: string;
  bulletIndent: number;
  accent: string | null;
  accentTick: boolean;
  contactSeparator: string;
  suggestedTypography: ResumeTypography;
};

export const INK = "#161A18";
export const MUTED = "#5B625E";
export const RULE = "#C8CEC9";
export const MODERN_ACCENT = "#2F5D50";

export const resumeTemplates: Record<
  ResumeTemplate,
  ResumeTemplateDescriptor
> = {
  CLASSIC: {
    margin: { top: 54, right: 54, bottom: 54, left: 54 },
    scale: {
      name: 20,
      headline: 11,
      contact: 9.5,
      sectionLabel: 9,
      entryTitle: 11,
      entryMeta: 9.5,
      body: 10,
      dateRange: 9.5,
    },
    leading: 1.4,
    sectionGap: 14,
    entryGap: 9,
    bulletGap: 2,
    headerGap: 4,
    headerAlign: "left",
    headerLayout: "stacked",
    sectionLabelCase: "upper",
    sectionLabelTracking: 0.08,
    sectionLabelBold: true,
    sectionRule: {
      thickness: 0.5,
      color: RULE,
      gapAbove: 4,
      gapBelow: 8,
    },
    headerRule: { thickness: 1.2, color: INK, gapAbove: 10, gapBelow: 2 },
    inlineSectionLabels: false,
    inlineEntryMeta: false,
    metaItalic: true,
    bulletGlyph: "•",
    bulletIndent: 12,
    accent: null,
    accentTick: false,
    contactSeparator: "  ·  ",
    suggestedTypography: "INTER",
  },
  EDITORIAL: {
    margin: { top: 58, right: 58, bottom: 58, left: 58 },
    scale: {
      name: 22,
      headline: 11.5,
      contact: 9,
      sectionLabel: 11.5,
      entryTitle: 11,
      entryMeta: 9.5,
      body: 10.5,
      dateRange: 9,
    },
    leading: 1.5,
    sectionGap: 16,
    entryGap: 10,
    bulletGap: 2.5,
    headerGap: 5,
    headerAlign: "center",
    headerLayout: "stacked",
    sectionLabelCase: "title",
    sectionLabelTracking: 0,
    sectionLabelBold: true,
    sectionRule: {
      thickness: 0.5,
      color: RULE,
      gapAbove: 4,
      gapBelow: 9,
    },
    headerRule: { thickness: 1, color: INK, gapAbove: 11, gapBelow: 3 },
    inlineSectionLabels: false,
    inlineEntryMeta: false,
    metaItalic: true,
    bulletGlyph: "•",
    bulletIndent: 13,
    accent: null,
    accentTick: false,
    contactSeparator: "  ·  ",
    suggestedTypography: "SOURCE_SERIF_4",
  },
  COMPACT: {
    margin: { top: 42, right: 40, bottom: 42, left: 40 },
    scale: {
      name: 17,
      headline: 10,
      contact: 9,
      sectionLabel: 9,
      entryTitle: 10,
      entryMeta: 9,
      body: 9.5,
      dateRange: 9,
    },
    leading: 1.25,
    sectionGap: 9,
    entryGap: 5,
    bulletGap: 1,
    headerGap: 2,
    headerAlign: "left",
    headerLayout: "inline",
    sectionLabelCase: "upper",
    sectionLabelTracking: 0.06,
    sectionLabelBold: true,
    sectionRule: null,
    headerRule: { thickness: 1, color: INK, gapAbove: 6, gapBelow: 2 },
    inlineSectionLabels: true,
    inlineEntryMeta: true,
    metaItalic: false,
    bulletGlyph: "•",
    bulletIndent: 10,
    accent: null,
    accentTick: false,
    contactSeparator: "  ·  ",
    suggestedTypography: "SOURCE_SANS_3",
  },
  MODERN: {
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    scale: {
      name: 22,
      headline: 11,
      contact: 9.5,
      sectionLabel: 9,
      entryTitle: 11,
      entryMeta: 9.5,
      body: 10,
      dateRange: 9.5,
    },
    leading: 1.45,
    sectionGap: 15,
    entryGap: 10,
    bulletGap: 2,
    headerGap: 4,
    headerAlign: "left",
    headerLayout: "stacked",
    sectionLabelCase: "upper",
    sectionLabelTracking: 0.1,
    sectionLabelBold: true,
    sectionRule: null,
    headerRule: {
      thickness: 2,
      color: MODERN_ACCENT,
      gapAbove: 10,
      gapBelow: 3,
    },
    inlineSectionLabels: false,
    inlineEntryMeta: false,
    metaItalic: false,
    bulletGlyph: "•",
    bulletIndent: 12,
    accent: MODERN_ACCENT,
    accentTick: true,
    contactSeparator: "  ·  ",
    suggestedTypography: "INTER",
  },
};
