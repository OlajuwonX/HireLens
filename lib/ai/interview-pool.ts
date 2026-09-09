import { getApplicationIntelligenceProvider } from "./client";
import { normalizeJsonModelOutput } from "./normalize";
import {
  assertGeneralizedInterviewPool,
  assertValidInterviewPool,
  generatedInterviewPoolSchema,
  type GeneratedInterviewQuestion,
} from "./schemas/interview-pool.schema";
import type {
  ApplicationIntelligenceProvider,
  InterviewPoolInput,
} from "./types";

export type InterviewPoolCompletion = {
  questions: GeneratedInterviewQuestion[];
  provider: string;
  model: string;
  durationMs: number;
};

export async function generateInterviewPoolCompletion(input: {
  profile: InterviewPoolInput;
  provider?: ApplicationIntelligenceProvider;
}): Promise<InterviewPoolCompletion> {
  const provider = input.provider ?? getApplicationIntelligenceProvider();
  const result = await provider.generateInterviewPool(input.profile);
  const pool = normalizeJsonModelOutput(
    result.rawResponse,
    generatedInterviewPoolSchema,
  );

  assertValidInterviewPool(pool);
  assertGeneralizedInterviewPool(pool);

  return {
    questions: pool.questions,
    provider: result.provider,
    model: result.model,
    durationMs: result.durationMs,
  };
}
