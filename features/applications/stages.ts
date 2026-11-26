import type { QueueName } from "@/lib/auto-apply/states";

export const APPLICATIONS_PATH = "/dashboard/jobs";

export const STAGES = ["tracking", "preparing", "needs-you", "ready", "sent"] as const;

export type Stage = (typeof STAGES)[number];

export const stageDetails: Record<Stage, { label: string; queues: QueueName[]; empty: string }> = {
  tracking: {
    label: "Tracking",
    queues: [],
    empty: "Every job you saved, from pending through to a decision.",
  },
  preparing: {
    label: "Preparing",
    queues: ["IN_PROGRESS"],
    empty: "Select Auto Apply on a saved job and HireLens starts preparing it here.",
  },
  "needs-you": {
    label: "Needs you",
    queues: ["NEEDS_YOU", "MANUAL"],
    empty: "Nothing is blocked on you.",
  },
  ready: {
    label: "Ready to approve",
    queues: ["READY"],
    empty: "Prepared applications wait here until you approve them.",
  },
  sent: {
    label: "Sent",
    queues: ["SUBMITTED"],
    empty: "Submitted applications appear here with their confirmation.",
  },
};

export function readStage(value: unknown): Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value) ? (value as Stage) : "tracking";
}

export function stageHref(stage: Stage) {
  return stage === "tracking" ? APPLICATIONS_PATH : `${APPLICATIONS_PATH}?stage=${stage}`;
}

export function tasksForStage<T>(stage: Stage, groups: Partial<Record<QueueName, T[]>>) {
  return stageDetails[stage].queues.flatMap((queue) => groups[queue] ?? []);
}

export function stageCounts(groups: Partial<Record<QueueName, unknown[]>>, tracked: number) {
  return Object.fromEntries(
    STAGES.map((stage) => [stage, stage === "tracking" ? tracked : tasksForStage(stage, groups).length]),
  ) as Record<Stage, number>;
}
