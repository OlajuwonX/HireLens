import { MockApplicationIntelligenceProvider } from "@/lib/ai/providers/mock-application-intelligence-provider";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findDocumentRowForUser = vi.fn();
const recordDocumentActivity = vi.fn();
const findAnalysisForDocumentSource = vi.fn();
const copyImprovedResumeToVersion = vi.fn();
const createResumeVersionFromBytes = vi.fn();
const renderImprovedResumePdf = vi.fn();

vi.mock("@/features/documents/server/document.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/document.repository")
  >("@/features/documents/server/document.repository");

  return {
    ...actual,
    findDocumentRowForUser: (input: unknown) => findDocumentRowForUser(input),
    recordDocumentActivity: (input: unknown) => recordDocumentActivity(input),
  };
});

vi.mock("@/features/analyses/server/analysis.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/analyses/server/analysis.repository")
  >("@/features/analyses/server/analysis.repository");

  return {
    ...actual,
    findAnalysisForDocumentSource: (input: unknown) =>
      findAnalysisForDocumentSource(input),
  };
});

vi.mock("@/features/documents/server/improved-resume.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/improved-resume.service")
  >("@/features/documents/server/improved-resume.service");

  return {
    ...actual,
    copyImprovedResumeToVersion: (input: unknown) =>
      copyImprovedResumeToVersion(input),
    createResumeVersionFromBytes: (input: unknown) =>
      createResumeVersionFromBytes(input),
  };
});

vi.mock("@/lib/pdf/resume-document", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/pdf/resume-document")
  >("@/lib/pdf/resume-document");

  return {
    ...actual,
    renderImprovedResumePdf: (...args: unknown[]) =>
      renderImprovedResumePdf(...args),
  };
});

const { addImprovedResumeToLibrary } =
  await import("@/features/documents/server/document.service");

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
    status: "SUCCEEDED",
    resultJson: JSON.parse(String(output.rawResponse)),
  };
}

function unEditedModernResume() {
  return {
    document: {
      id: "doc-internal-id",
      type: "IMPROVED_RESUME",
      fileAssetId: "asset-1",
      applicationId: "application-1",
      resumeVersionId: "version-1",
      jobId: "job-1",
      editedResumeJson: null,
      editVersion: 0,
      resumeTemplate: "MODERN",
      resumeTypography: "SOURCE_SERIF_4",
      resumeSpacing: "COMPACT",
    },
    resumeId: "resume-1",
    jobTitle: "Site Manager",
    jobCompany: "Turner",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  recordDocumentActivity.mockResolvedValue(undefined);
  renderImprovedResumePdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  createResumeVersionFromBytes.mockResolvedValue({ publicId: "version-2" });
  copyImprovedResumeToVersion.mockResolvedValue({ publicId: "version-3" });
});

describe("adding an unedited improved resume to the library", () => {
  it("renders it in the design saved on the document", async () => {
    findDocumentRowForUser.mockResolvedValue(unEditedModernResume());
    findAnalysisForDocumentSource.mockResolvedValue(await storedAnalysis());

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-public-id",
    });

    expect(result.ok).toBe(true);
    expect(renderImprovedResumePdf).toHaveBeenCalledWith(expect.anything(), {
      template: "MODERN",
      typography: "SOURCE_SERIF_4",
      spacing: "COMPACT",
    });
    expect(createResumeVersionFromBytes).toHaveBeenCalled();
    expect(copyImprovedResumeToVersion).not.toHaveBeenCalled();
  });

  it("copies the stored PDF only when there is nothing to render from", async () => {
    findDocumentRowForUser.mockResolvedValue(unEditedModernResume());
    findAnalysisForDocumentSource.mockResolvedValue(null);

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-public-id",
    });

    expect(result.ok).toBe(true);
    expect(copyImprovedResumeToVersion).toHaveBeenCalled();
    expect(renderImprovedResumePdf).not.toHaveBeenCalled();
  });
});
