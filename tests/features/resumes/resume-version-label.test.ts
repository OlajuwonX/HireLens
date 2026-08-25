import {
  improvedResumeVersionLabel,
  legacyImprovedResumeVersionLabel,
} from "@/features/documents/improved-resume-format";
import {
  MAX_VERSION_LABEL_LENGTH,
  resumeVersionLabelFromFilename,
  withVersionSuffix,
} from "@/features/resumes/version-label";
import { describe, expect, it } from "vitest";

describe("a resume version is named after the file the user uploaded", () => {
  it("drops the pdf extension", () => {
    expect(resumeVersionLabelFromFilename("Banking resume.pdf")).toBe(
      "Banking resume",
    );
  });

  it("drops the extension whatever its casing", () => {
    expect(resumeVersionLabelFromFilename("Chef.PDF")).toBe("Chef");
  });

  it("falls back to a readable name when the file has none", () => {
    expect(resumeVersionLabelFromFilename(".pdf")).toBe("Resume");
  });

  it("never exceeds the label budget", () => {
    const label = resumeVersionLabelFromFilename(`${"a".repeat(400)}.pdf`);

    expect(label).toHaveLength(MAX_VERSION_LABEL_LENGTH);
  });
});

describe("a duplicate file name is separated by its version number", () => {
  it("appends the version number", () => {
    expect(withVersionSuffix("Banking resume", 2)).toBe("Banking resume v2");
  });

  it("keeps the suffixed label inside the budget", () => {
    const label = withVersionSuffix("b".repeat(MAX_VERSION_LABEL_LENGTH), 12);

    expect(label.length).toBeLessThanOrEqual(MAX_VERSION_LABEL_LENGTH);
    expect(label.endsWith(" v12")).toBe(true);
  });
});

describe("an improved resume is labelled by company and job title", () => {
  it("includes both when the job is still there", () => {
    expect(improvedResumeVersionLabel("Product Manager", "Acme")).toBe(
      "AI-assisted - Acme - Product Manager",
    );
  });

  it("collapses to the legacy shape when there is no company", () => {
    expect(improvedResumeVersionLabel("Product Manager", null)).toBe(
      legacyImprovedResumeVersionLabel("Product Manager"),
    );
  });

  it("truncates a very long company and job title", () => {
    const label = improvedResumeVersionLabel("t".repeat(200), "c".repeat(200));

    expect(label).toHaveLength(120);
  });
});
