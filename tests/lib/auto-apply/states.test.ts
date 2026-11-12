import { describe, expect, it } from "vitest";
import { detectPlatform } from "@/lib/auto-apply/platform";
import { dailySubmissionLimit, normalizeRole, submissionsRemaining } from "@/lib/auto-apply/policy";
import { canTransition, isTerminal, queueFor, TASK_STATES, type TaskState } from "@/lib/auto-apply/states";

const ALLOWED: Record<TaskState, TaskState[]> = {
  DISCOVERED: ["QUALIFIED", "CANCELLED"],
  QUALIFIED: ["PREPARING", "CANCELLED"],
  PREPARING: ["PREPARING", "READY_FOR_REVIEW", "NEEDS_INPUT", "NEEDS_MANUAL_ACTION", "AWAITING_AI", "FAILED", "CANCELLED"],
  AWAITING_AI: ["PREPARING", "CANCELLED"],
  NEEDS_INPUT: ["PREPARING", "CANCELLED"],
  NEEDS_MANUAL_ACTION: ["PREPARING", "SUBMITTED", "CANCELLED"],
  READY_FOR_REVIEW: ["APPROVED", "PREPARING", "CANCELLED"],
  APPROVED: ["SUBMITTING", "READY_FOR_REVIEW", "CANCELLED"],
  SUBMITTING: ["SUBMITTED", "SUBMISSION_UNCONFIRMED", "NEEDS_MANUAL_ACTION", "FAILED"],
  SUBMISSION_UNCONFIRMED: ["SUBMITTED", "FAILED", "NEEDS_MANUAL_ACTION"],
  FAILED: ["PREPARING", "CANCELLED"],
  SUBMITTED: [],
  CANCELLED: [],
};

function reachableWithout(start: TaskState, avoid: TaskState) {
  const seen = new Set<TaskState>([start]);
  const queue = [start];

  while (queue.length > 0) {
    const state = queue.shift()!;

    for (const next of TASK_STATES) {
      if (next !== avoid && canTransition(state, next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  return seen;
}

describe("the task state machine", () => {
  it.each(TASK_STATES.flatMap((from) => TASK_STATES.map((to) => [from, to] as const)))(
    "%s -> %s matches the table",
    (from, to) => {
      expect(canTransition(from, to)).toBe(ALLOWED[from].includes(to));
    },
  );

  it("can only start submitting from an approved task", () => {
    for (const start of TASK_STATES.filter((state) => state !== "APPROVED" && state !== "SUBMITTING")) {
      expect(reachableWithout(start, "APPROVED").has("SUBMITTING")).toBe(false);
    }
  });

  it("never retries an unconfirmed submission automatically", () => {
    expect(canTransition("SUBMISSION_UNCONFIRMED", "SUBMITTING")).toBe(false);
    expect(reachableWithout("SUBMISSION_UNCONFIRMED", "APPROVED").has("SUBMITTING")).toBe(false);
  });

  it("treats submitted and cancelled as final", () => {
    expect(isTerminal("SUBMITTED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("APPROVED")).toBe(false);
  });

  it("puts every visible state in exactly one queue", () => {
    for (const state of TASK_STATES.filter((value) => value !== "CANCELLED")) {
      expect(queueFor(state), state).not.toBeNull();
    }

    expect(queueFor("CANCELLED")).toBeNull();
    expect(queueFor("SUBMISSION_UNCONFIRMED")).toBe("MANUAL");
    expect(queueFor("AWAITING_AI")).toBe("NEEDS_YOU");
  });
});

describe("daily policy", () => {
  it("defaults to thirty and never allows more", () => {
    expect(dailySubmissionLimit(undefined)).toBe(30);
    expect(dailySubmissionLimit("10")).toBe(10);
    expect(dailySubmissionLimit("500")).toBe(30);
    expect(dailySubmissionLimit("nonsense")).toBe(30);
  });

  it("counts down to zero", () => {
    expect(submissionsRemaining(28, 30)).toBe(2);
    expect(submissionsRemaining(31, 30)).toBe(0);
  });

  it("treats the same role at the same company as one role", () => {
    expect(normalizeRole("Acme, Inc.", "Senior Engineer")).toBe(normalizeRole("acme inc", "SENIOR ENGINEER"));
  });
});

describe("detectPlatform", () => {
  it.each([
    ["https://boards.greenhouse.io/acme/jobs/1", "GREENHOUSE"],
    ["https://jobs.lever.co/acme/1", "LEVER"],
    ["https://jobs.ashbyhq.com/acme/1", "ASHBY"],
    ["https://acme.com/careers/1", null],
    ["javascript:alert(1)", null],
    [null, null],
  ])("%s -> %s", (url, platform) => {
    expect(detectPlatform(url)).toBe(platform);
  });
});
