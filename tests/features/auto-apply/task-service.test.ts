import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findApplicationRowForUser: vi.fn(),
  countCommittedToday: vi.fn(),
  createTask: vi.fn(),
  findCommittedRole: vi.fn(),
  findTaskByApplication: vi.fn(),
  findTaskForUser: vi.fn(),
  transitionTask: vi.fn(),
}));

vi.mock("@/features/applications/server/application.repository", () => ({
  findApplicationRowForUser: mocks.findApplicationRowForUser,
}));
vi.mock("@/features/auto-apply/server/task.repository", () => ({
  countCommittedToday: mocks.countCommittedToday,
  createTask: mocks.createTask,
  findCommittedRole: mocks.findCommittedRole,
  findTaskByApplication: mocks.findTaskByApplication,
  findTaskForUser: mocks.findTaskForUser,
  transitionTask: mocks.transitionTask,
}));

const { approveTask, markSubmittedManually, moveTask, queueApplication } = await import(
  "@/features/auto-apply/server/task.service"
);

const userId = "user-1";
const row = {
  application: { id: "app-1" },
  job: { title: "Frontend Engineer", company: "Acme", sourceUrl: "https://boards.greenhouse.io/acme/jobs/1" },
};
const task = (state: string) => ({ id: "task-1", publicId: "t-1", state });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findApplicationRowForUser.mockResolvedValue(row);
  mocks.findTaskByApplication.mockResolvedValue(null);
  mocks.findCommittedRole.mockResolvedValue(null);
  mocks.createTask.mockResolvedValue({ publicId: "t-1" });
  mocks.transitionTask.mockResolvedValue(true);
  mocks.countCommittedToday.mockResolvedValue(0);
});

describe("queueApplication", () => {
  it("creates a qualified task with the detected platform and role key", async () => {
    expect(await queueApplication({ userId, applicationPublicId: "a" })).toEqual({ ok: true, publicId: "t-1" });
    expect(mocks.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ userId, applicationId: "app-1", state: "QUALIFIED", platform: "GREENHOUSE", roleKey: "acme|frontend engineer" }),
    );
  });

  it("returns the existing task instead of creating a second one", async () => {
    mocks.findTaskByApplication.mockResolvedValue({ publicId: "existing" });

    expect(await queueApplication({ userId, applicationPublicId: "a" })).toEqual({ ok: true, publicId: "existing" });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("blocks a duplicate application to a role already applied to", async () => {
    mocks.findCommittedRole.mockResolvedValue({ id: "other" });

    const result = await queueApplication({ userId, applicationPublicId: "a" });

    expect(result.ok).toBe(false);
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("refuses an application the user does not own", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(null);

    expect((await queueApplication({ userId, applicationPublicId: "a" })).ok).toBe(false);
  });
});

describe("moveTask", () => {
  it("refuses a move the state machine forbids, without touching the database", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("QUALIFIED"));

    expect((await moveTask({ userId, publicId: "t-1", to: "SUBMITTING", reason: "x" })).ok).toBe(false);
    expect(mocks.transitionTask).not.toHaveBeenCalled();
  });

  it("guards the update with the state it read, so a concurrent change loses cleanly", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("READY_FOR_REVIEW"));
    mocks.transitionTask.mockResolvedValue(false);

    const result = await moveTask({ userId, publicId: "t-1", to: "CANCELLED", reason: "x" });

    expect(result).toEqual({ ok: false, message: "This application changed. Refresh and try again." });
    expect(mocks.transitionTask).toHaveBeenCalledWith(expect.objectContaining({ from: "READY_FOR_REVIEW", to: "CANCELLED", userId }));
  });
});

describe("approval and completion", () => {
  it("approves a ready task and stamps the time", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("READY_FOR_REVIEW"));

    expect((await approveTask({ userId, publicId: "t-1" })).ok).toBe(true);
    expect(mocks.transitionTask.mock.calls[0][0].patch.approvedAt).toBeInstanceOf(Date);
  });

  it("refuses approval once today's limit is used", async () => {
    mocks.countCommittedToday.mockResolvedValue(30);

    expect((await approveTask({ userId, publicId: "t-1" })).ok).toBe(false);
    expect(mocks.transitionTask).not.toHaveBeenCalled();
  });

  it("cannot approve a task that is still preparing", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("PREPARING"));

    expect((await approveTask({ userId, publicId: "t-1" })).ok).toBe(false);
  });

  it("records a manual submission with evidence", async () => {
    mocks.findTaskForUser.mockResolvedValue(task("NEEDS_MANUAL_ACTION"));

    await markSubmittedManually({ userId, publicId: "t-1" });

    expect(mocks.transitionTask.mock.calls[0][0].patch.confirmation).toMatchObject({ method: "MANUAL" });
  });
});
