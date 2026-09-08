import "server-only";

export type InterviewEvent =
  | "cache_hit"
  | "cache_miss"
  | "pool_generated"
  | "generation_failure"
  | "questions_reused"
  | "provider_used"
  | "quota_refusal";

export type InterviewEventFields = Record<
  string,
  string | number | boolean | null | undefined
>;

export function recordInterviewEvent(
  event: InterviewEvent,
  fields: InterviewEventFields = {},
) {
  const payload: InterviewEventFields = { scope: "interview", event };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  console.info("interview event", payload);
}
