import { beforeEach, describe, expect, it, vi } from "vitest";
import { resultToState, splitName, workerResultSchema } from "@/features/worker/contract";

const mocks = vi.hoisted(() => ({
  reconcileExpiredLeases: vi.fn(),
  claimApprovedTask: vi.fn(),
  extendLease: vi.fn(),
  finishLease: vi.fn(),
  countSubmittedToday: vi.fn(),
  findTaskForUser: vi.fn(),
  buildTaskPayload: vi.fn(),
  loadIntelligence: vi.fn(),
}));

vi.mock("@/features/worker/server/lease.repository", () => ({
  reconcileExpiredLeases: mocks.reconcileExpiredLeases,
  claimApprovedTask: mocks.claimApprovedTask,
  extendLease: mocks.extendLease,
  finishLease: mocks.finishLease,
}));
vi.mock("@/features/auto-apply/server/task.repository", () => ({
  countSubmittedToday: mocks.countSubmittedToday,
  findTaskForUser: mocks.findTaskForUser,
}));
vi.mock("@/features/worker/server/task-payload", () => ({
  buildTaskPayload: mocks.buildTaskPayload,
  loadIntelligence: mocks.loadIntelligence,
}));

const { claimNextTask, reportResult } = await import("@/features/worker/server/worker.service");

const worker = { userId: "user-1", workerId: "worker-1" };
const taskId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.countSubmittedToday.mockResolvedValue(0);
  mocks.claimApprovedTask.mockResolvedValue({ id: "t", publicId: taskId });
  mocks.buildTaskPayload.mockResolvedValue({ task: { id: taskId } });
  mocks.finishLease.mockResolvedValue(true);
});

describe("resultToState", () => {
  const base = { taskId, reason: "Done.", missing: [] };

  it("only records a submission when there is confirmation evidence", () => {
    expect(resultToState({ ...base, outcome: "SUBMITTED", evidence: { confirmationText: "Thank you" } }).to).toBe("SUBMITTED");
    expect(resultToState({ ...base, outcome: "SUBMITTED" }).to).toBe("SUBMISSION_UNCONFIRMED");
    expect(resultToState({ ...base, outcome: "SUBMITTED", evidence: {} }).to).toBe("SUBMISSION_UNCONFIRMED");
  });

  it("maps every other outcome to a safe state", () => {
    expect(resultToState({ ...base, outcome: "UNCONFIRMED" }).to).toBe("SUBMISSION_UNCONFIRMED");
    expect(resultToState({ ...base, outcome: "NEEDS_MANUAL_ACTION" }).to).toBe("NEEDS_MANUAL_ACTION");
    expect(resultToState({ ...base, outcome: "FAILED" }).to).toBe("FAILED");
  });

  it("rejects malformed results", () => {
    expect(workerResultSchema.safeParse({ taskId: "nope", outcome: "SUBMITTED", reason: "x" }).success).toBe(false);
    expect(workerResultSchema.safeParse({ taskId, outcome: "DONE", reason: "x" }).success).toBe(false);
  });

  it("splits a name into the parts forms ask for", () => {
    expect(splitName("Ada  Lovelace Obi")).toEqual({ firstName: "Ada", lastName: "Lovelace Obi", fullName: "Ada Lovelace Obi" });
    expect(splitName(null)).toEqual({ firstName: "", lastName: "", fullName: "" });
  });
});

describe("claimNextTask", () => {
  it("reconciles abandoned submissions before handing out new work", async () => {
    await claimNextTask(worker);

    expect(mocks.reconcileExpiredLeases.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.claimApprovedTask.mock.invocationCallOrder[0],
    );
  });

  it("hands out the next approved task with its payload", async () => {
    expect(await claimNextTask(worker)).toEqual({ task: { task: { id: taskId } } });
  });

  it("stops at the daily submission limit", async () => {
    mocks.countSubmittedToday.mockResolvedValue(30);

    expect(await claimNextTask(worker)).toEqual({ task: null, reason: "DAILY_LIMIT" });
    expect(mocks.claimApprovedTask).not.toHaveBeenCalled();
  });

  it("reports when there is nothing to do", async () => {
    mocks.claimApprovedTask.mockResolvedValue(null);

    expect(await claimNextTask(worker)).toEqual({ task: null, reason: "EMPTY" });
  });
});

describe("reportResult", () => {
  it("finishes the lease this worker holds with evidence", async () => {
    await reportResult(worker, {
      taskId,
      outcome: "SUBMITTED",
      reason: "Confirmed.",
      missing: [],
      evidence: { finalUrl: "https://x.test/confirmation" },
    });

    expect(mocks.finishLease).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        workerId: "worker-1",
        publicId: taskId,
        to: "SUBMITTED",
        confirmation: expect.objectContaining({ method: "WORKER", finalUrl: "https://x.test/confirmation" }),
      }),
    );
  });

  it("passes the fields the candidate still needs to fill", async () => {
    await reportResult(worker, { taskId, outcome: "NEEDS_MANUAL_ACTION", reason: "Finish it.", missing: ["Gender"] });

    expect(mocks.finishLease.mock.calls[0][0]).toMatchObject({ to: "NEEDS_MANUAL_ACTION", needs: ["Gender"], confirmation: null });
  });
});
