import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  savePostingToJobs: vi.fn(),
  analyzeOwnedApplication: vi.fn(),
  queueApplication: vi.fn(),
}));

vi.mock("@/features/discovery/server/posting-save.service", () => ({ savePostingToJobs: mocks.savePostingToJobs }));
vi.mock("@/features/applications/server/application.service", () => ({
  analyzeOwnedApplication: mocks.analyzeOwnedApplication,
}));
vi.mock("@/features/auto-apply/server/task.service", () => ({ queueApplication: mocks.queueApplication }));

const { continueWithPosting } = await import("@/features/discovery/server/posting-next-step.service");

const run = (step: "analyze" | "auto-apply") => continueWithPosting({ userId: "user-1", publicId: "p-1", step });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.savePostingToJobs.mockResolvedValue({ ok: true, alreadySaved: false, applicationPublicId: "app-1" });
  mocks.analyzeOwnedApplication.mockResolvedValue({ ok: true, value: { publicId: "app-1", optimization: "OPTIMIZED" } });
  mocks.queueApplication.mockResolvedValue({ ok: true, publicId: "task-1" });
});

describe("continueWithPosting", () => {
  it("saves the job, analyzes it and opens it in Saved Jobs", async () => {
    expect(await run("analyze")).toEqual({ ok: true, href: "/dashboard/jobs?open=app-1" });
    expect(mocks.analyzeOwnedApplication).toHaveBeenCalledWith({ userId: "user-1", publicId: "app-1" });
    expect(mocks.queueApplication).not.toHaveBeenCalled();
  });

  it("saves the job and adds it to Auto Apply", async () => {
    expect(await run("auto-apply")).toEqual({ ok: true, href: "/dashboard/auto-apply" });
    expect(mocks.queueApplication).toHaveBeenCalledWith({ userId: "user-1", applicationPublicId: "app-1" });
    expect(mocks.analyzeOwnedApplication).not.toHaveBeenCalled();
  });

  it("reuses the application when the job was already saved", async () => {
    mocks.savePostingToJobs.mockResolvedValue({ ok: true, alreadySaved: true, applicationPublicId: "saved" });

    await run("auto-apply");

    expect(mocks.queueApplication).toHaveBeenCalledWith({ userId: "user-1", applicationPublicId: "saved" });
  });

  it("keeps the saved job when the analysis allowance is used up", async () => {
    mocks.analyzeOwnedApplication.mockResolvedValue({ ok: false, error: "LIMIT_REACHED", message: "Daily limit reached." });

    expect(await run("analyze")).toEqual({ ok: false, message: "Daily limit reached.", saved: true });
  });

  it("stops before the next step when saving fails", async () => {
    mocks.savePostingToJobs.mockResolvedValue({ ok: false, message: "Upload a resume before saving jobs." });

    expect(await run("auto-apply")).toEqual({ ok: false, message: "Upload a resume before saving jobs.", saved: false });
    expect(mocks.queueApplication).not.toHaveBeenCalled();
  });
});
