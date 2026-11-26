import { describe, expect, it } from "vitest";
import { QUEUES, type QueueName } from "@/lib/auto-apply/states";
import { readStage, STAGES, stageCounts, stageDetails, stageHref, tasksForStage } from "@/features/applications/stages";
import {
  directionFor,
  hasOpenOverlay,
  isTypingTarget,
  neighbourId,
  openHref,
} from "@/features/applications/step-through";

describe("application stages", () => {
  it("covers every Auto Apply queue exactly once", () => {
    const covered = STAGES.flatMap((stage) => stageDetails[stage].queues);

    expect([...covered].sort()).toEqual((Object.keys(QUEUES) as QueueName[]).sort());
  });

  it("falls back to tracking for unknown or missing values", () => {
    expect(readStage("ready")).toBe("ready");
    expect(readStage("READY")).toBe("tracking");
    expect(readStage(undefined)).toBe("tracking");
    expect(readStage(["ready"])).toBe("tracking");
  });

  it("links tracking to the plain path and other stages by query", () => {
    expect(stageHref("tracking")).toBe("/dashboard/jobs");
    expect(stageHref("needs-you")).toBe("/dashboard/jobs?stage=needs-you");
  });

  it("merges the needs-you and manual queues and counts every stage", () => {
    const groups = { NEEDS_YOU: ["a"], MANUAL: ["b", "c"], READY: ["d"] };

    expect(tasksForStage("needs-you", groups)).toEqual(["a", "b", "c"]);
    expect(stageCounts(groups, 12)).toEqual({ tracking: 12, preparing: 0, "needs-you": 3, ready: 1, sent: 0 });
  });
});

describe("stepping through jobs", () => {
  const ids = ["a", "b", "c"];

  it("moves to the neighbour and stops at the ends", () => {
    expect(neighbourId(ids, "b", 1)).toBe("c");
    expect(neighbourId(ids, "b", -1)).toBe("a");
    expect(neighbourId(ids, "c", 1)).toBeNull();
    expect(neighbourId(ids, "a", -1)).toBeNull();
    expect(neighbourId(ids, "missing", 1)).toBeNull();
    expect(neighbourId(ids, null, 1)).toBeNull();
  });

  it("maps arrow keys and j/k, ignoring everything else", () => {
    expect(directionFor("ArrowDown")).toBe(1);
    expect(directionFor("j")).toBe(1);
    expect(directionFor("ArrowUp")).toBe(-1);
    expect(directionFor("k")).toBe(-1);
    expect(directionFor("Enter")).toBeNull();
  });

  it("never steals keys from fields or open pop-ups", () => {
    const field = { isContentEditable: false, closest: (selector: string) => (selector.includes("input") ? {} : null) };

    expect(isTypingTarget(field as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget(null)).toBe(false);
    expect(hasOpenOverlay({ querySelector: () => ({}) as Element })).toBe(true);
    expect(hasOpenOverlay({ querySelector: () => null })).toBe(false);
  });

  it("keeps the current stage and filters when opening a job", () => {
    expect(openHref("stage=ready", "x")).toBe("/dashboard/jobs?stage=ready&open=x");
    expect(openHref("", "x")).toBe("/dashboard/jobs?open=x");
  });
});
