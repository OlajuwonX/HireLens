import { describe, expect, it } from "vitest";
import type { InterviewDifficulty } from "@/lib/db/schema";
import { computeReadiness } from "@/features/interviews/readiness";

const STANDARD_POOL: { difficulty: InterviewDifficulty; count: number }[] = [
  { difficulty: "EASY", count: 6 },
  { difficulty: "CHALLENGING", count: 8 },
  { difficulty: "HARD", count: 10 },
  { difficulty: "VERY_HARD", count: 6 },
];

function attempts(
  spec: Partial<Record<InterviewDifficulty, number>>,
  correct = true,
) {
  return (Object.entries(spec) as [InterviewDifficulty, number][]).flatMap(
    ([difficulty, n]) =>
      Array.from({ length: n }, () => ({ difficulty, isCorrect: correct })),
  );
}

describe("computeReadiness", () => {
  it("a standard pool is worth 76 weighted points", () => {
    const result = computeReadiness({ assigned: STANDARD_POOL, attempts: [] });

    expect(result.totalPoints).toBe(76);
    expect(result.earnedPoints).toBe(0);
    expect(result.readiness).toBe(0);
  });

  it("is 100 only when every question is answered correctly", () => {
    const result = computeReadiness({
      assigned: STANDARD_POOL,
      attempts: attempts({
        EASY: 6,
        CHALLENGING: 8,
        HARD: 10,
        VERY_HARD: 6,
      }),
    });

    expect(result.earnedPoints).toBe(76);
    expect(result.readiness).toBe(100);
  });

  it("weights harder questions more", () => {
    const sixEasy = computeReadiness({
      assigned: STANDARD_POOL,
      attempts: attempts({ EASY: 6 }),
    });
    const sixVeryHard = computeReadiness({
      assigned: STANDARD_POOL,
      attempts: attempts({ VERY_HARD: 6 }),
    });

    expect(sixEasy.earnedPoints).toBe(6);
    expect(sixEasy.readiness).toBe(8); // round(6 / 76 * 100)
    expect(sixVeryHard.earnedPoints).toBe(24);
    expect(sixVeryHard.readiness).toBe(32); // round(24 / 76 * 100)
  });

  it("counts only correct attempts", () => {
    const result = computeReadiness({
      assigned: STANDARD_POOL,
      attempts: [
        ...attempts({ HARD: 4 }, true),
        ...attempts({ HARD: 6 }, false),
      ],
    });

    expect(result.earnedPoints).toBe(12);
    expect(result.readiness).toBe(16); // round(12 / 76 * 100)
  });

  it("is 0 with nothing assigned and never divides by zero", () => {
    expect(
      computeReadiness({ assigned: [], attempts: attempts({ HARD: 3 }) }),
    ).toEqual({ readiness: 0, earnedPoints: 9, totalPoints: 0 });
  });

  it("clamps to 100 if earned somehow exceeds total", () => {
    const result = computeReadiness({
      assigned: [{ difficulty: "EASY", count: 1 }],
      attempts: attempts({ VERY_HARD: 1 }),
    });

    expect(result.readiness).toBe(100);
  });
});
