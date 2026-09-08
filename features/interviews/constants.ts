import type {
  InterviewDifficulty,
  InterviewQuestionBucket,
} from "@/lib/db/schema";

export const INTERVIEW_POOL_PROMPT_VERSION = "interview-pool-v1";

export const INTERVIEW_POOL_SIZE = 30;

export const INTERVIEW_OPTION_COUNT = 4;

export const INTERVIEW_MIN_JOB_DESCRIPTION_LENGTH = 40;

export const INTERVIEW_CORE_SKILL_COUNT = 8;

export const INTERVIEW_SECONDARY_SKILL_COUNT = 8;

export const INTERVIEW_RESPONSIBILITY_COUNT = 8;

export const INTERVIEW_TARGET_REQUIREMENT_COUNT = 10;

export const INTERVIEW_SENIORITY_BANDS = [
  "entry",
  "mid",
  "senior",
  "principal",
] as const;

export type InterviewSeniorityBand = (typeof INTERVIEW_SENIORITY_BANDS)[number];

export const INTERVIEW_CYCLE_DAYS = 7;

export const INTERVIEW_DAILY_QUESTIONS_PER_DAY = 2;

export const INTERVIEW_DAILY_RESERVE =
  INTERVIEW_CYCLE_DAYS * INTERVIEW_DAILY_QUESTIONS_PER_DAY;

export const INTERVIEW_PRACTICE_POOL =
  INTERVIEW_POOL_SIZE - INTERVIEW_DAILY_RESERVE;

export const INTERVIEW_DIFFICULTY_DISTRIBUTION: Record<
  InterviewDifficulty,
  number
> = {
  EASY: 6,
  CHALLENGING: 8,
  HARD: 10,
  VERY_HARD: 6,
};

export const INTERVIEW_DIFFICULTY_WEIGHTS: Record<InterviewDifficulty, number> =
  {
    EASY: 1,
    CHALLENGING: 2,
    HARD: 3,
    VERY_HARD: 4,
  };

export const interviewDifficultyLabels: Record<InterviewDifficulty, string> = {
  EASY: "Easy",
  CHALLENGING: "Challenging",
  HARD: "Hard",
  VERY_HARD: "Very hard",
};

export const interviewBucketLabels: Record<InterviewQuestionBucket, string> = {
  DAILY: "Daily question",
  PRACTICE: "Interview practice",
};
