import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findApplicationRowForUser: vi.fn(),
  promoteSavedApplication: vi.fn(),
  ensureApplicationAnalysis: vi.fn(),
  analyzeOwnedApplication: vi.fn(),
  loadIntelligence: vi.fn(),
}));

vi.mock("@/features/applications/server/application.repository", () => ({
  findApplicationRowForUser: mocks.findApplicationRowForUser,
  promoteSavedApplication: mocks.promoteSavedApplication,
}));
vi.mock("@/features/applications/server/application.service", () => ({
  ensureApplicationAnalysis: mocks.ensureApplicationAnalysis,
  analyzeOwnedApplication: mocks.analyzeOwnedApplication,
}));
vi.mock("@/features/worker/server/task-payload", () => ({ loadIntelligence: mocks.loadIntelligence }));

const { boostApplication } = await import("@/features/extension/server/boost.service");

const worker = { userId: "user-1", workerId: "w-1" };
const row = (score: number | null, options: { analyzed?: boolean; saveOnly?: boolean } = {}) => ({
  application: {
    id: "a-1",
    publicId: "app-1",
    analysisId: options.analyzed === false ? null : "an-1",
    saveOnly: options.saveOnly ?? false,
  },
  analysisPublicId: options.analyzed === false ? null : "pub-an-1",
  matchScore: score,
});
const scores = (...rows: ReturnType<typeof row>[]) =>
  rows.forEach((value) => mocks.findApplicationRowForUser.mockResolvedValueOnce(value));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.loadIntelligence.mockResolvedValue({
    requirementMatches: [
      { requirement: "Kubernetes in production", status: "MISSING", importance: "REQUIRED" },
      { requirement: "Go", status: "MISSING", importance: "PREFERRED" },
      { requirement: "React", status: "STRONG", importance: "REQUIRED" },
    ],
  });
  mocks.ensureApplicationAnalysis.mockResolvedValue({ ok: true, created: true });
  mocks.analyzeOwnedApplication.mockResolvedValue({ ok: true, value: { publicId: "app-1", optimization: "IMPROVED" } });
});

describe("boostApplication", () => {
  it("analyzes a job that was only saved and reports its first score", async () => {
    scores(row(null, { analyzed: false, saveOnly: true }), row(72));

    expect(await boostApplication(worker, "app-1")).toEqual({
      ok: true,
      score: 72,
      previousScore: null,
      finished: false,
      gaps: ["Kubernetes in production"],
    });
    expect(mocks.ensureApplicationAnalysis).toHaveBeenCalledWith({ userId: "user-1", publicId: "app-1" });
    expect(mocks.analyzeOwnedApplication).not.toHaveBeenCalled();
  });

  it("refines a low-scoring resume and keeps going while it improves", async () => {
    scores(row(72), row(84));

    expect(await boostApplication(worker, "app-1")).toMatchObject({ score: 84, previousScore: 72, finished: false });
    expect(mocks.analyzeOwnedApplication).toHaveBeenCalledWith({ userId: "user-1", publicId: "app-1" });
  });

  it("finishes when the resume reaches 90%", async () => {
    scores(row(84), row(91));

    expect(await boostApplication(worker, "app-1")).toMatchObject({ score: 91, finished: true });
  });

  it("finishes honestly when no truthful change can raise the score", async () => {
    scores(row(80), row(80));
    mocks.analyzeOwnedApplication.mockResolvedValue({
      ok: true,
      value: { publicId: "app-1", optimization: "ALREADY_OPTIMIZED" },
    });

    expect(await boostApplication(worker, "app-1")).toMatchObject({
      score: 80,
      finished: true,
      gaps: ["Kubernetes in production"],
    });
  });

  it("does not spend AI on a resume that already scores 90% or more", async () => {
    scores(row(93));

    expect(await boostApplication(worker, "app-1")).toMatchObject({ score: 93, previousScore: 93, finished: true });
    expect(mocks.analyzeOwnedApplication).not.toHaveBeenCalled();
    expect(mocks.ensureApplicationAnalysis).not.toHaveBeenCalled();
  });

  it("promotes a saved-only job before refining it", async () => {
    scores(row(70, { saveOnly: true }), row(80));

    await boostApplication(worker, "app-1");

    expect(mocks.promoteSavedApplication).toHaveBeenCalledWith({ userId: "user-1", applicationId: "a-1" });
  });

  it("reports when the daily AI allowance is used up", async () => {
    scores(row(70));
    mocks.analyzeOwnedApplication.mockResolvedValue({ ok: false, error: "LIMIT_REACHED", message: "Daily limit reached." });

    expect(await boostApplication(worker, "app-1")).toEqual({ ok: false, limited: true, message: "Daily limit reached." });
  });

  it("refuses jobs the user does not own", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(null);

    expect(await boostApplication(worker, "app-1")).toMatchObject({ ok: false, limited: false });
  });
});
