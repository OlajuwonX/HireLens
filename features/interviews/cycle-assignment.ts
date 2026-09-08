import { hashAnalysisInput } from "@/lib/ai";
import {
  INTERVIEW_DAILY_QUESTIONS_PER_DAY,
  INTERVIEW_DAILY_RESERVE,
} from "./constants";

export type CycleAssignment = {
  questionId: string;
  bucket: "DAILY" | "PRACTICE";
  dayIndex: number | null;
  assignedOrder: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function cycleSeed(userId: string, poolId: string) {
  const hex = await hashAnalysisInput({
    kind: "interview-cycle-seed",
    userId,
    poolId,
  });

  return Number.parseInt(hex.slice(0, 8), 16);
}

export function shuffleDeterministic<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  const rng = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export async function buildCycleAssignments(input: {
  userId: string;
  poolId: string;
  questionIds: string[];
}): Promise<CycleAssignment[]> {
  const seed = await cycleSeed(input.userId, input.poolId);
  const ordered = shuffleDeterministic(input.questionIds, seed);

  return ordered.map((questionId, index) => {
    if (index < INTERVIEW_DAILY_RESERVE) {
      return {
        questionId,
        bucket: "DAILY",
        dayIndex: Math.floor(index / INTERVIEW_DAILY_QUESTIONS_PER_DAY) + 1,
        assignedOrder: index,
      };
    }

    return {
      questionId,
      bucket: "PRACTICE",
      dayIndex: null,
      assignedOrder: index,
    };
  });
}
