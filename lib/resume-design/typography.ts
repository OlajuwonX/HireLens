import type { ResumeTypography } from "./constants";

export type ResumeFontRole = "regular" | "bold" | "italic";

export type ResumeFontFamily = {
  slug: string;
  cssFamily: string;
  cssStack: string;
  files: Record<ResumeFontRole, string>;
};

export const resumeFontFamilies: Record<ResumeTypography, ResumeFontFamily> = {
  INTER: {
    slug: "inter",
    cssFamily: "HireLens Inter",
    cssStack: '"HireLens Inter", "Inter", "Helvetica Neue", Arial, sans-serif',
    files: {
      regular: "inter-regular.ttf",
      bold: "inter-bold.ttf",
      italic: "inter-italic.ttf",
    },
  },
  SOURCE_SANS_3: {
    slug: "source-sans-3",
    cssFamily: "HireLens Source Sans 3",
    cssStack:
      '"HireLens Source Sans 3", "Source Sans 3", "Helvetica Neue", Arial, sans-serif',
    files: {
      regular: "source-sans-3-regular.ttf",
      bold: "source-sans-3-bold.ttf",
      italic: "source-sans-3-italic.ttf",
    },
  },
  SOURCE_SERIF_4: {
    slug: "source-serif-4",
    cssFamily: "HireLens Source Serif 4",
    cssStack:
      '"HireLens Source Serif 4", "Source Serif 4", Georgia, "Times New Roman", serif',
    files: {
      regular: "source-serif-4-regular.ttf",
      bold: "source-serif-4-bold.ttf",
      italic: "source-serif-4-italic.ttf",
    },
  },
};

export const RESUME_FONT_DIRECTORY = "public/fonts";
