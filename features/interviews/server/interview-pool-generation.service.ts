import "server-only";

import {
  describeAiFailure,
  generateInterviewPoolCompletion,
  type ApplicationIntelligenceProvider,
} from "@/lib/ai";
import type { InterviewQuestionPool } from "@/lib/db/schema";
import type { InterviewProfile } from "../interview-profile";
import { markPoolFailed, markPoolReady } from "./interview-pool.repository";
import { insertPoolQuestions } from "./interview-question.repository";

export type PoolGenerationResult =
  | {
      ok: true;
      poolId: string;
      questionCount: number;
      provider: string;
      model: string;
    }
  | { ok: false; poolId: string; reason: string };

export async function generatePoolForClaim(input: {
  pool: InterviewQuestionPool;
  profile: InterviewProfile;
  provider?: ApplicationIntelligenceProvider;
}): Promise<PoolGenerationResult> {
  const { pool, profile } = input;

  let completion: Awaited<ReturnType<typeof generateInterviewPoolCompletion>>;

  try {
    completion = await generateInterviewPoolCompletion({
      profile: {
        roleFamily: profile.roleFamily,
        seniorityBand: profile.seniorityBand,
        coreSkills: profile.coreSkills,
        secondarySkills: profile.secondarySkills,
        topics: profile.topics,
        responsibilities: profile.responsibilities,
        targetRequirements: profile.targetRequirements,
      },
      provider: input.provider,
    });
  } catch (error) {
    const reason = describeAiFailure(error);

    await markPoolFailed({ poolId: pool.id, failureReason: reason });

    return { ok: false, poolId: pool.id, reason };
  }

  try {
    await insertPoolQuestions({
      poolId: pool.id,
      questions: completion.questions,
    });

    await markPoolReady({
      poolId: pool.id,
      provider: completion.provider,
      model: completion.model,
      questionCount: completion.questions.length,
      generationDurationMs: completion.durationMs,
    });
  } catch (error) {
    const reason = `PersistFailed ${describeAiFailure(error)}`;

    await markPoolFailed({ poolId: pool.id, failureReason: reason });

    return { ok: false, poolId: pool.id, reason };
  }

  return {
    ok: true,
    poolId: pool.id,
    questionCount: completion.questions.length,
    provider: completion.provider,
    model: completion.model,
  };
}
