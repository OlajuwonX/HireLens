import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findApplicationRowForUser: vi.fn(),
  promoteSavedApplication: vi.fn(),
  recordApplicationActivity: vi.fn(),
  findTaskByApplication: vi.fn(),
  markSubmittedManually: vi.fn(),
  moveTask: vi.fn(),
}));

vi.mock("@/features/applications/server/application.repository", () => ({
  findApplicationRowForUser: mocks.findApplicationRowForUser,
  promoteSavedApplication: mocks.promoteSavedApplication,
  recordApplicationActivity: mocks.recordApplicationActivity,
}));
vi.mock("@/features/auto-apply/server/task.repository", () => ({ findTaskByApplication: mocks.findTaskByApplication }));
vi.mock("@/features/auto-apply/server/task.service", () => ({
  markSubmittedManually: mocks.markSubmittedManually,
  moveTask: mocks.moveTask,
}));

const { markAppliedFromExtension } = await import("@/features/extension/server/applied.service");

const worker = { userId: "user-1", workerId: "w-1" };
const run = () => markAppliedFromExtension(worker, "app-1");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findApplicationRowForUser.mockResolvedValue({ application: { id: "a-1" } });
  mocks.findTaskByApplication.mockResolvedValue(null);
});

describe("markAppliedFromExtension", () => {
  it("moves a saved job into Applications with a record of how it was sent", async () => {
    expect(await run()).toBe(true);
    expect(mocks.promoteSavedApplication).toHaveBeenCalledWith({ userId: "user-1", applicationId: "a-1" });
    expect(mocks.recordApplicationActivity).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: "a-1", title: "Applied with the HireLens extension" }),
    );
  });

  it("closes an Auto Apply task that was waiting for a manual submission", async () => {
    mocks.findTaskByApplication.mockResolvedValue({ publicId: "t-1", state: "NEEDS_MANUAL_ACTION" });

    await run();

    expect(mocks.markSubmittedManually).toHaveBeenCalledWith({ userId: "user-1", publicId: "t-1" });
    expect(mocks.moveTask).not.toHaveBeenCalled();
  });

  it("takes a queued task out of Auto Apply so the worker never applies twice", async () => {
    mocks.findTaskByApplication.mockResolvedValue({ publicId: "t-1", state: "APPROVED" });

    await run();

    expect(mocks.moveTask).toHaveBeenCalledWith(expect.objectContaining({ publicId: "t-1", to: "CANCELLED" }));
    expect(mocks.markSubmittedManually).not.toHaveBeenCalled();
  });

  it("leaves finished tasks alone", async () => {
    mocks.findTaskByApplication.mockResolvedValue({ publicId: "t-1", state: "SUBMITTED" });

    await run();

    expect(mocks.moveTask).not.toHaveBeenCalled();
    expect(mocks.markSubmittedManually).not.toHaveBeenCalled();
  });

  it("refuses applications the user does not own", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(null);

    expect(await run()).toBe(false);
    expect(mocks.promoteSavedApplication).not.toHaveBeenCalled();
  });
});
