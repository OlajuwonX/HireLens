import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedApplication: vi.fn(),
  findAnalysisForApplication: vi.fn(),
  findAnalysisById: vi.fn(),
}));

vi.mock("@/features/applications/server/application.service", () => ({
  getOwnedApplication: mocks.getOwnedApplication,
}));

vi.mock("@/features/analyses/server/analysis.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/analyses/server/analysis.repository")
  >("@/features/analyses/server/analysis.repository");

  return {
    ...actual,
    findAnalysisForApplication: mocks.findAnalysisForApplication,
    findAnalysisById: mocks.findAnalysisById,
  };
});

const { saveApplicationView } = await import(
  "@/features/documents/server/document.service"
);
const { SAVE_ONLY_DOCUMENT_MESSAGE } = await import(
  "@/features/applications/analysis-state"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveApplicationView", () => {
  it("rejects a save-only application without reading any analysis", async () => {
    mocks.getOwnedApplication.mockResolvedValue({
      application: { id: "app-1", saveOnly: true },
      job: { title: "QS" },
    });

    const result = await saveApplicationView({
      userId: "user-1",
      applicationPublicId: "public-1",
      view: "COVER_LETTER" as never,
    });

    expect(result).toEqual({ ok: false, message: SAVE_ONLY_DOCUMENT_MESSAGE });
    expect(mocks.findAnalysisForApplication).not.toHaveBeenCalled();
    expect(mocks.findAnalysisById).not.toHaveBeenCalled();
  });

  it("still asks for an analysis on a normal application that has none", async () => {
    mocks.getOwnedApplication.mockResolvedValue({
      application: { id: "app-1", saveOnly: false },
      job: { title: "QS" },
    });
    mocks.findAnalysisForApplication.mockResolvedValue(null);

    const result = await saveApplicationView({
      userId: "user-1",
      applicationPublicId: "public-1",
      view: "COVER_LETTER" as never,
    });

    expect(result).toEqual({
      ok: false,
      message: "Run the analysis for this application first.",
    });
  });

  it("reports a missing application", async () => {
    mocks.getOwnedApplication.mockResolvedValue(null);

    const result = await saveApplicationView({
      userId: "user-1",
      applicationPublicId: "public-1",
      view: "COVER_LETTER" as never,
    });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.findAnalysisForApplication).not.toHaveBeenCalled();
  });
});
