import "server-only";

import {
  userHasJobContext,
  userHasSucceededAnalysis,
  userHasUsableResume,
} from "./interview.repository";

export type InterviewEligibility = {
  eligible: boolean;
  hasResume: boolean;
  hasJobContext: boolean;
  hasAnalysis: boolean;
};

export async function getInterviewEligibility(
  userId: string,
): Promise<InterviewEligibility> {
  const [hasResume, hasJobContext, hasAnalysis] = await Promise.all([
    userHasUsableResume(userId),
    userHasJobContext(userId),
    userHasSucceededAnalysis(userId),
  ]);

  return {
    eligible: hasResume && hasJobContext,
    hasResume,
    hasJobContext,
    hasAnalysis,
  };
}
