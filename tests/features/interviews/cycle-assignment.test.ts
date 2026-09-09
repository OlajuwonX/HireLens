import { describe, expect, it } from "vitest";
import {
  buildCycleAssignments,
  shuffleDeterministic,
} from "@/features/interviews/cycle-assignment";

const questionIds = Array.from({ length: 30 }, (_, i) => `q-${i + 1}`);

describe("shuffleDeterministic", () => {
  it("is a permutation and depends on the seed", () => {
    const a = shuffleDeterministic(questionIds, 12345);
    const b = shuffleDeterministic(questionIds, 12345);
    const c = shuffleDeterministic(questionIds, 99999);

    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...questionIds].sort());
    expect(a).not.toEqual(c);
  });
});

describe("buildCycleAssignments", () => {
  it("splits 30 questions into 14 daily (2 per day, 7 days) and 16 practice", async () => {
    const plan = await buildCycleAssignments({
      userId: "user-1",
      poolId: "pool-1",
      questionIds,
    });

    expect(plan).toHaveLength(30);

    const daily = plan.filter((a) => a.bucket === "DAILY");
    const practice = plan.filter((a) => a.bucket === "PRACTICE");

    expect(daily).toHaveLength(14);
    expect(practice).toHaveLength(16);

    for (let day = 1; day <= 7; day++) {
      expect(daily.filter((a) => a.dayIndex === day)).toHaveLength(2);
    }

    expect(practice.every((a) => a.dayIndex === null)).toBe(true);
    expect(new Set(plan.map((a) => a.assignedOrder)).size).toBe(30);
    expect(new Set(plan.map((a) => a.questionId)).size).toBe(30);
  });

  it("is deterministic for the same user and pool", async () => {
    const first = await buildCycleAssignments({
      userId: "user-1",
      poolId: "pool-1",
      questionIds,
    });
    const second = await buildCycleAssignments({
      userId: "user-1",
      poolId: "pool-1",
      questionIds,
    });

    expect(second).toEqual(first);
  });

  it("gives two users sharing a pool a different order", async () => {
    const a = await buildCycleAssignments({
      userId: "user-a",
      poolId: "pool-1",
      questionIds,
    });
    const b = await buildCycleAssignments({
      userId: "user-b",
      poolId: "pool-1",
      questionIds,
    });

    expect(a.map((x) => x.questionId)).not.toEqual(b.map((x) => x.questionId));
  });
});
