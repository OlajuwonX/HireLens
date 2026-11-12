import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findTaskForUser: vi.fn(),
  moveTask: vi.fn(),
  findProfileByUser: vi.fn(),
  ensureApplicationAnalysis: vi.fn(),
  getCurrentApplicationReview: vi.fn(),
  reviewApplicationResume: vi.fn(),
}));

vi.mock("@/features/auto-apply/server/task.repository", () => ({ findTaskForUser: mocks.findTaskForUser }));
vi.mock("@/features/auto-apply/server/task.service", () => ({ moveTask: mocks.moveTask }));
vi.mock("@/features/candidate-profile/server/profile.repository", () => ({ findProfileByUser: mocks.findProfileByUser }));
vi.mock("@/features/applications/server/application.service", () => ({
  ensureApplicationAnalysis: mocks.ensureApplicationAnalysis,
}));
vi.mock("@/features/analyses/server/review.service", () => ({
  getCurrentApplicationReview: mocks.getCurrentApplicationReview,
  reviewApplicationResume: mocks.reviewApplicationResume,
}));

const { advancePreparation } = await import("@/features/auto-apply/server/preparation.service");

const completeProfile = {
  headline: null,
  seniority: "MID",
  yearsExperience: 4,
  currentLocation: "Lagos",
  targetRoles: ["Frontend Engineer"],
  targetLocations: [],
  workArrangements: ["REMOTE"],
  authorizedCountries: ["Nigeria"],
  requiresSponsorship: false,
  willingToRelocate: false,
  salaryMin: null,
  salaryCurrency: null,
  noticePeriodWeeks: null,
  phone: "+234",
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
};

const task = (state: string, platform: string | null = "GREENHOUSE") => ({
  id: "task-1",
  publicId: "t-1",
  applicationPublicId: "app-1",
  state,
  platform,
});

const run = () => advancePreparation({ userId: "user-1", publicId: "t-1" });
const finalMove = () => mocks.moveTask.mock.calls.at(-1)![0];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findTaskForUser.mockResolvedValue(task("QUALIFIED"));
  mocks.moveTask.mockResolvedValue({ ok: true, publicId: "t-1" });
  mocks.findProfileByUser.mockResolvedValue(completeProfile);
  mocks.ensureApplicationAnalysis.mockResolvedValue({ ok: true, created: false });
  mocks.getCurrentApplicationReview.mockResolvedValue({ verdict: "APPROVED" });
});

describe("advancePreparation", () => {
  it("asks for the missing profile details before spending any AI", async () => {
    mocks.findProfileByUser.mockResolvedValue({ ...completeProfile, phone: null });

    expect(await run()).toEqual({ ok: true, state: "NEEDS_INPUT", more: false });
    expect(finalMove().needs).toEqual(["Phone"]);
    expect(mocks.ensureApplicationAnalysis).not.toHaveBeenCalled();
  });

  it("runs the analysis as its own step and asks to continue", async () => {
    mocks.ensureApplicationAnalysis.mockResolvedValue({ ok: true, created: true });

    expect(await run()).toEqual({ ok: true, state: "PREPARING", more: true });
    expect(mocks.reviewApplicationResume).not.toHaveBeenCalled();
  });

  it("waits for AI capacity instead of failing when the quota is used", async () => {
    mocks.ensureApplicationAnalysis.mockResolvedValue({ ok: false, limited: true, message: "Daily limit reached." });

    expect(await run()).toMatchObject({ state: "AWAITING_AI" });
  });

  it("runs the independent review as its own step", async () => {
    mocks.getCurrentApplicationReview.mockResolvedValue(null);
    mocks.reviewApplicationResume.mockResolvedValue({ ok: true });

    expect(await run()).toEqual({ ok: true, state: "PREPARING", more: true });
  });

  it("waits for capacity when the review hits the limit", async () => {
    mocks.getCurrentApplicationReview.mockResolvedValue(null);
    mocks.reviewApplicationResume.mockResolvedValue({ ok: false, error: "LIMIT_REACHED", message: "Limit" });

    expect(await run()).toMatchObject({ state: "AWAITING_AI" });
  });

  it("stops for the candidate when the review rejects the resume", async () => {
    mocks.getCurrentApplicationReview.mockResolvedValue({ verdict: "REJECTED" });

    expect(await run()).toMatchObject({ state: "NEEDS_INPUT" });
  });

  it("is ready for approval once everything passed on a supported site", async () => {
    expect(await run()).toEqual({ ok: true, state: "READY_FOR_REVIEW", more: false });
  });

  it("hands unsupported sites to the candidate", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("QUALIFIED", null));

    expect(await run()).toMatchObject({ state: "NEEDS_MANUAL_ACTION" });
  });

  it("never touches an approved or submitting task", async () => {
    for (const state of ["APPROVED", "SUBMITTING", "SUBMITTED"]) {
      mocks.findTaskForUser.mockResolvedValue(task(state));

      expect((await run()).ok).toBe(false);
    }

    expect(mocks.moveTask).not.toHaveBeenCalled();
    expect(mocks.ensureApplicationAnalysis).not.toHaveBeenCalled();
  });

  it("resumes a task left in preparing after an interruption", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("PREPARING"));

    expect(await run()).toMatchObject({ ok: true, state: "READY_FOR_REVIEW" });
    expect(mocks.moveTask).toHaveBeenCalledTimes(1);
  });
});
