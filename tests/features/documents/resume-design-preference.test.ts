import { MockApplicationIntelligenceProvider } from "@/lib/ai/providers/mock-application-intelligence-provider";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findResumeDesignPreference = vi.fn();
const updateResumeDesignPreference = vi.fn();
const updateGeneratedDocumentDesign = vi.fn();
const createGeneratedDocument = vi.fn();
const recordDocumentActivity = vi.fn();
const findAnalysisById = vi.fn();
const buildImprovedResumePdf = vi.fn();

vi.mock(
  "@/features/documents/server/resume-design-preference.repository",
  () => ({
    findResumeDesignPreference: (userId: string) =>
      findResumeDesignPreference(userId),
    updateResumeDesignPreference: (input: unknown) =>
      updateResumeDesignPreference(input),
  }),
);

vi.mock("@/features/documents/server/document.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/document.repository")
  >("@/features/documents/server/document.repository");

  return {
    ...actual,
    updateGeneratedDocumentDesign: (input: unknown) =>
      updateGeneratedDocumentDesign(input),
    createGeneratedDocument: (input: unknown) => createGeneratedDocument(input),
    recordDocumentActivity: (input: unknown) => recordDocumentActivity(input),
  };
});

vi.mock("@/features/analyses/server/analysis.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/analyses/server/analysis.repository")
  >("@/features/analyses/server/analysis.repository");

  return {
    ...actual,
    findAnalysisById: (input: unknown) => findAnalysisById(input),
  };
});

vi.mock("@/features/documents/server/improved-resume.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/improved-resume.service")
  >("@/features/documents/server/improved-resume.service");

  return {
    ...actual,
    buildImprovedResumePdf: (input: unknown) => buildImprovedResumePdf(input),
  };
});

const { findPreferredResumeDesign, saveResumeDesignSelection } =
  await import("@/features/documents/server/resume-design.service");
const { saveAnalysisView } =
  await import("@/features/documents/server/document.service");

const MODERN = {
  template: "MODERN",
  typography: "SOURCE_SERIF_4",
  spacing: "COMPACT",
} as const;

async function storedAnalysis() {
  const output =
    await new MockApplicationIntelligenceProvider().analyzeApplication({
      resume: {
        pdfBytes: new Uint8Array(),
        filename: "resume.pdf",
        text: null,
      },
      job: {
        title: "Site Manager",
        company: "Turner",
        location: null,
        workArrangement: "On site",
        employmentType: "Full time",
        deadline: null,
        source: null,
        sourceUrl: null,
        description: "Run the site.",
        requirements: null,
      },
      priorCorrections: [],
    });

  return {
    id: "analysis-1",
    status: "SUCCEEDED",
    jobId: "job-1",
    applicationId: "application-1",
    resumeVersionId: "version-1",
    promptVersion: "application-intelligence-v3",
    resultJson: JSON.parse(String(output.rawResponse)),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createGeneratedDocument.mockImplementation(async (input: object) => ({
    id: "document-1",
    ...input,
  }));
  buildImprovedResumePdf.mockResolvedValue("asset-1");
});

describe("findPreferredResumeDesign", () => {
  it("returns the design the user last chose", async () => {
    findResumeDesignPreference.mockResolvedValue(MODERN);

    await expect(findPreferredResumeDesign("u1")).resolves.toEqual(MODERN);
  });

  it("falls back to the defaults when the user has never chosen one", async () => {
    findResumeDesignPreference.mockResolvedValue({
      template: null,
      typography: null,
      spacing: null,
    });

    await expect(findPreferredResumeDesign("u1")).resolves.toEqual({
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
  });
});

describe("saveResumeDesignSelection", () => {
  it("saves the design on the document and as the user's preference", async () => {
    updateGeneratedDocumentDesign.mockResolvedValue({ id: "document-1" });

    const result = await saveResumeDesignSelection({
      userId: "u1",
      publicId: "doc-public-id",
      selection: MODERN,
    });

    expect(result).toEqual({ ok: true });
    expect(updateResumeDesignPreference).toHaveBeenCalledWith({
      userId: "u1",
      selection: MODERN,
    });
  });

  it("leaves the preference alone when the document is not the user's", async () => {
    updateGeneratedDocumentDesign.mockResolvedValue(null);

    const result = await saveResumeDesignSelection({
      userId: "u1",
      publicId: "someone-elses",
      selection: MODERN,
    });

    expect(result).toEqual({ ok: false });
    expect(updateResumeDesignPreference).not.toHaveBeenCalled();
  });
});

describe("saving a new improved resume", () => {
  it("creates it in the user's preferred design", async () => {
    findAnalysisById.mockResolvedValue(await storedAnalysis());
    findResumeDesignPreference.mockResolvedValue(MODERN);

    const result = await saveAnalysisView({
      userId: "u1",
      analysisId: "analysis-1",
      view: "IMPROVED_RESUME",
      jobTitle: "Site Manager",
    });

    expect(result.ok).toBe(true);
    expect(buildImprovedResumePdf).toHaveBeenCalledWith(
      expect.objectContaining({ selection: MODERN }),
    );
    expect(createGeneratedDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeTemplate: "MODERN",
        resumeTypography: "SOURCE_SERIF_4",
        resumeSpacing: "COMPACT",
      }),
    );
  });

  it("does not look up a design for documents that have none", async () => {
    findAnalysisById.mockResolvedValue(await storedAnalysis());

    await saveAnalysisView({
      userId: "u1",
      analysisId: "analysis-1",
      view: "COVER_LETTER",
      jobTitle: "Site Manager",
    });

    expect(findResumeDesignPreference).not.toHaveBeenCalled();
    expect(createGeneratedDocument.mock.calls[0][0]).not.toHaveProperty(
      "resumeTemplate",
    );
  });
});
