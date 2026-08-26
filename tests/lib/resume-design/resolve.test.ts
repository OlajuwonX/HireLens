import { describe, expect, it } from "vitest";
import {
  DEFAULT_RESUME_SPACING,
  DEFAULT_RESUME_TEMPLATE,
  DEFAULT_RESUME_TYPOGRAPHY,
  MIN_RESUME_BODY_SIZE,
  MIN_RESUME_LEADING,
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  readResumeDesignSelection,
  resolveResumeDesign,
  resumeTemplates,
  strictResumeDesignSelectionSchema,
} from "@/lib/resume-design";

describe("readResumeDesignSelection", () => {
  it("falls back to the classic default for empty input", () => {
    expect(readResumeDesignSelection({})).toEqual({
      template: DEFAULT_RESUME_TEMPLATE,
      typography: DEFAULT_RESUME_TYPOGRAPHY,
      spacing: DEFAULT_RESUME_SPACING,
    });
  });

  it("falls back for null and undefined", () => {
    expect(readResumeDesignSelection(null).template).toBe("CLASSIC");
    expect(readResumeDesignSelection(undefined).spacing).toBe("STANDARD");
  });

  it("replaces unknown values instead of throwing", () => {
    expect(
      readResumeDesignSelection({
        template: "CANVA",
        typography: "COMIC_SANS",
        spacing: "ROOMY",
      }),
    ).toEqual({
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
  });

  it("keeps values that are in the registry", () => {
    expect(
      readResumeDesignSelection({
        template: "MODERN",
        typography: "SOURCE_SERIF_4",
        spacing: "COMPACT",
      }),
    ).toEqual({
      template: "MODERN",
      typography: "SOURCE_SERIF_4",
      spacing: "COMPACT",
    });
  });
});

describe("strictResumeDesignSelectionSchema", () => {
  it("rejects values outside the registry", () => {
    expect(
      strictResumeDesignSelectionSchema.safeParse({
        template: "CANVA",
        typography: "INTER",
        spacing: "STANDARD",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid selection", () => {
    expect(
      strictResumeDesignSelectionSchema.safeParse({
        template: "EDITORIAL",
        typography: "SOURCE_SANS_3",
        spacing: "COMPACT",
      }).success,
    ).toBe(true);
  });
});

describe("resolveResumeDesign", () => {
  it("leaves the template untouched at standard spacing", () => {
    for (const template of RESUME_TEMPLATES) {
      const resolved = resolveResumeDesign({
        template,
        typography: "INTER",
        spacing: "STANDARD",
      });

      expect(resolved.leading).toBeCloseTo(resumeTemplates[template].leading, 5);
      expect(resolved.margin.top).toBeCloseTo(
        resumeTemplates[template].margin.top,
        5,
      );
    }
  });

  it("tightens leading, gaps and margins at compact spacing", () => {
    for (const template of RESUME_TEMPLATES) {
      const standard = resolveResumeDesign({
        template,
        typography: "INTER",
        spacing: "STANDARD",
      });
      const compact = resolveResumeDesign({
        template,
        typography: "INTER",
        spacing: "COMPACT",
      });

      expect(compact.leading).toBeLessThanOrEqual(standard.leading);
      expect(compact.sectionGap).toBeLessThan(standard.sectionGap);
      expect(compact.margin.top).toBeLessThan(standard.margin.top);
    }
  });

  it("never drops below the readability floor", () => {
    for (const template of RESUME_TEMPLATES) {
      for (const spacing of RESUME_SPACING) {
        const resolved = resolveResumeDesign({
          template,
          typography: "INTER",
          spacing,
        });

        expect(resolved.scale.body).toBeGreaterThanOrEqual(
          MIN_RESUME_BODY_SIZE,
        );
        expect(resolved.leading).toBeGreaterThanOrEqual(MIN_RESUME_LEADING);
      }
    }
  });

  it("keeps typography independent of the template", () => {
    for (const template of RESUME_TEMPLATES) {
      for (const typography of RESUME_TYPOGRAPHY) {
        const resolved = resolveResumeDesign({
          template,
          typography,
          spacing: "STANDARD",
        });

        expect(resolved.font.files.regular).toContain(".ttf");
        expect(resolved.selection.typography).toBe(typography);
        expect(resolved.scale).toEqual(
          resolveResumeDesign({
            template,
            typography: "INTER",
            spacing: "STANDARD",
          }).scale,
        );
      }
    }
  });

  it("gives only the modern template an accent colour", () => {
    for (const template of RESUME_TEMPLATES) {
      const resolved = resolveResumeDesign({
        template,
        typography: "INTER",
        spacing: "STANDARD",
      });

      expect(Boolean(resolved.accent)).toBe(template === "MODERN");
    }
  });
});
