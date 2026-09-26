import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedResumeVersion: vi.fn(),
  createJobWithApplication: vi.fn(),
  findApplicationRowForUser: vi.fn(),
  attachAnalysisToApplication: vi.fn(),
  attachAnalysisApplication: vi.fn(),
  analyzeApplication: vi.fn(),
}));

vi.mock("@/features/resumes/server/resume-version.service", () => ({
  getOwnedResumeVersion: mocks.getOwnedResumeVersion,
}));

vi.mock("@/features/analyses/server/analysis.service", () => ({
  analyzeApplication: mocks.analyzeApplication,
}));

vi.mock("@/features/analyses/server/analysis.repository", () => ({
  attachAnalysisApplication: mocks.attachAnalysisApplication,
}));

vi.mock("@/features/applications/server/application.repository", () => ({
  attachAnalysisToApplication: mocks.attachAnalysisToApplication,
  countApplicationsByStatus: vi.fn(),
  createJobWithApplication: mocks.createJobWithApplication,
  deleteApplicationForUser: vi.fn(),
  findApplicationForUser: vi.fn(),
  findApplicationRowForUser: mocks.findApplicationRowForUser,
  listActivitiesForApplication: vi.fn(),
  listApplicationsForUser: vi.fn(),
  updateApplicationWithActivity: vi.fn(),
}));

const { saveAndAnalyze, saveJobOnly, analyzeOwnedApplication } = await import(
  "@/features/applications/server/application.service"
);

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";

const values = {
  resumeVersionPublicId: uuid,
  title: "Quantity Surveyor",
  company: "Turner",
  description: "Manage cost planning.",
  workArrangement: "NOT_SPECIFIED",
  employmentType: "NOT_SPECIFIED",
} as never;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwnedResumeVersion.mockResolvedValue({ id: "version-1" });
  mocks.createJobWithApplication.mockResolvedValue({
    job: { id: "job-1" },
    application: { id: "app-1", publicId: "public-1" },
  });
  mocks.analyzeApplication.mockResolvedValue({
    ok: true,
    analysisId: "analysis-1",
  });
});

describe("saveJobOnly", () => {
  it("creates the job and application flagged save-only with a Job saved activity", async () => {
    const result = await saveJobOnly({ userId: "user-1", values });

    expect(result).toEqual({
      ok: true,
      value: { applicationPublicId: "public-1" },
    });
    expect(mocks.createJobWithApplication).toHaveBeenCalledTimes(1);
    expect(mocks.createJobWithApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        resumeVersionId: "version-1",
        activityTitle: "Job saved",
        saveOnly: true,
      }),
    );
  });

  it("never calls the AI or records analysis state", async () => {
    await saveJobOnly({ userId: "user-1", values });

    expect(mocks.analyzeApplication).not.toHaveBeenCalled();
    expect(mocks.attachAnalysisToApplication).not.toHaveBeenCalled();
    expect(mocks.attachAnalysisApplication).not.toHaveBeenCalled();
  });

  it("still requires a resume version the user owns", async () => {
    mocks.getOwnedResumeVersion.mockResolvedValue(null);

    const result = await saveJobOnly({ userId: "user-1", values });

    expect(result).toMatchObject({ ok: false, error: "NOT_FOUND" });
    expect(mocks.createJobWithApplication).not.toHaveBeenCalled();
  });

  it("looks the version up for the calling user only", async () => {
    await saveJobOnly({ userId: "user-1", values });

    expect(mocks.getOwnedResumeVersion).toHaveBeenCalledWith({
      userId: "user-1",
      versionPublicId: uuid,
    });
  });

  it("stores the same job fields as Save & Analyze", async () => {
    await saveJobOnly({ userId: "user-1", values });
    await saveAndAnalyze({ userId: "user-1", values });

    const [saved, analysed] = mocks.createJobWithApplication.mock.calls;

    expect(saved[0].job).toEqual(analysed[0].job);
  });
});

describe("saveAndAnalyze regression", () => {
  it("is not flagged save-only and still analyses", async () => {
    const result = await saveAndAnalyze({ userId: "user-1", values });

    expect(result).toMatchObject({ ok: true, value: { analysed: true } });
    expect(mocks.analyzeApplication).toHaveBeenCalledTimes(1);

    const call = mocks.createJobWithApplication.mock.calls[0][0];

    expect(call.activityTitle).toBe("Application created");
    expect(call.saveOnly).toBeUndefined();
  });

  it("keeps the application unflagged when the analysis fails", async () => {
    mocks.analyzeApplication.mockResolvedValue({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });

    const result = await saveAndAnalyze({ userId: "user-1", values });

    expect(result).toMatchObject({ ok: true, value: { analysed: false } });
    expect(mocks.createJobWithApplication.mock.calls[0][0].saveOnly).not.toBe(
      true,
    );
  });
});

describe("analyzeOwnedApplication", () => {
  const row = (saveOnly: boolean) => ({
    application: { id: "app-1", publicId: "public-1", saveOnly },
    job: { id: "job-1" },
    versionPublicId: uuid,
  });

  it("refuses a save-only application without touching the AI", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(row(true));

    const result = await analyzeOwnedApplication({
      userId: "user-1",
      publicId: "public-1",
    });

    expect(result).toMatchObject({ ok: false, error: "SAVE_ONLY" });
    expect(mocks.analyzeApplication).not.toHaveBeenCalled();
    expect(mocks.getOwnedResumeVersion).not.toHaveBeenCalled();
  });

  it("still reanalyses a normal application, including one whose analysis failed", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(row(false));

    const result = await analyzeOwnedApplication({
      userId: "user-1",
      publicId: "public-1",
    });

    expect(result).toEqual({ ok: true, value: { publicId: "public-1" } });
    expect(mocks.analyzeApplication).toHaveBeenCalledTimes(1);
  });
});
