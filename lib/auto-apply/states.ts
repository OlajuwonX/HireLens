export const TASK_STATES = [
  "DISCOVERED",
  "QUALIFIED",
  "PREPARING",
  "AWAITING_AI",
  "NEEDS_INPUT",
  "NEEDS_MANUAL_ACTION",
  "READY_FOR_REVIEW",
  "APPROVED",
  "SUBMITTING",
  "SUBMITTED",
  "SUBMISSION_UNCONFIRMED",
  "FAILED",
  "CANCELLED",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

const TRANSITIONS: Record<TaskState, readonly TaskState[]> = {
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

export function canTransition(from: TaskState, to: TaskState) {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(state: TaskState) {
  return TRANSITIONS[state].length === 0;
}

export const QUEUES = {
  READY: ["READY_FOR_REVIEW", "APPROVED"],
  NEEDS_YOU: ["NEEDS_INPUT", "AWAITING_AI", "FAILED"],
  MANUAL: ["NEEDS_MANUAL_ACTION", "SUBMISSION_UNCONFIRMED"],
  IN_PROGRESS: ["DISCOVERED", "QUALIFIED", "PREPARING", "SUBMITTING"],
  SUBMITTED: ["SUBMITTED"],
} as const satisfies Record<string, readonly TaskState[]>;

export type QueueName = keyof typeof QUEUES;

export function queueFor(state: TaskState): QueueName | null {
  const entry = Object.entries(QUEUES).find(([, states]) =>
    (states as readonly TaskState[]).includes(state),
  );

  return (entry?.[0] as QueueName | undefined) ?? null;
}

export const ACTIVE_STATES: readonly TaskState[] = TASK_STATES.filter(
  (state) => !isTerminal(state),
);
