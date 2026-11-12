import type { QueueName } from "@/lib/auto-apply/states";

export const AUTO_APPLY_PATH = "/dashboard/auto-apply";

export const MAX_PREPARE_STEPS = 4;

export const queueLabels: Record<QueueName, { title: string; empty: string }> = {
  READY: {
    title: "Ready to apply",
    empty: "Prepared applications wait here for your approval.",
  },
  NEEDS_YOU: {
    title: "Needs you",
    empty: "Nothing is blocked on you.",
  },
  MANUAL: {
    title: "Manual action",
    empty: "No applications need you to finish them by hand.",
  },
  IN_PROGRESS: {
    title: "In progress",
    empty: "Add a saved job to Auto Apply to start preparing it.",
  },
  SUBMITTED: {
    title: "Submitted",
    empty: "Submitted applications appear here with their confirmation.",
  },
};

export const QUEUE_ORDER: QueueName[] = ["READY", "NEEDS_YOU", "MANUAL", "IN_PROGRESS", "SUBMITTED"];
