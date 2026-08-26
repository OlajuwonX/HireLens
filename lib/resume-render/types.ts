import type { ResumeFontRole } from "@/lib/resume-design";

export const RESUME_PAGE_WIDTH = 612;
export const RESUME_PAGE_HEIGHT = 792;

export type ResumeTextRun = {
  text: string;
  x: number;
  y: number;
  size: number;
  role: ResumeFontRole;
  color: string;
};

export type ResumeRuleLine = {
  x: number;
  y: number;
  width: number;
  thickness: number;
  color: string;
};

export type ResumeLayoutPage = {
  runs: ResumeTextRun[];
  rules: ResumeRuleLine[];
};

export type ResumeLayout = {
  pages: ResumeLayoutPage[];
  width: number;
  height: number;
};

export type ResumeMetrics = {
  widthOf: (text: string, size: number, role: ResumeFontRole) => number;
};
