import { z } from "zod";
import type { TaskState } from "@/lib/auto-apply/states";

export const WORKER_OUTCOMES = ["SUBMITTED", "UNCONFIRMED", "NEEDS_MANUAL_ACTION", "FAILED"] as const;

export const workerResultSchema = z.object({
  taskId: z.uuid(),
  outcome: z.enum(WORKER_OUTCOMES),
  reason: z.string().trim().min(1).max(500),
  missing: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  evidence: z
    .object({
      finalUrl: z.url().max(2048).optional(),
      confirmationText: z.string().trim().max(500).optional(),
    })
    .optional(),
});

export const taskRefSchema = z.object({ taskId: z.uuid() });

export type WorkerResult = z.infer<typeof workerResultSchema>;

export function resultToState(result: WorkerResult): { to: TaskState; reason: string } {
  const confirmed = Boolean(result.evidence?.confirmationText || result.evidence?.finalUrl);

  switch (result.outcome) {
    case "SUBMITTED":
      return confirmed
        ? { to: "SUBMITTED", reason: result.reason }
        : { to: "SUBMISSION_UNCONFIRMED", reason: `${result.reason} No confirmation was captured.` };
    case "UNCONFIRMED":
      return { to: "SUBMISSION_UNCONFIRMED", reason: result.reason };
    case "NEEDS_MANUAL_ACTION":
      return { to: "NEEDS_MANUAL_ACTION", reason: result.reason };
    default:
      return { to: "FAILED", reason: result.reason };
  }
}

export function splitName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
    fullName: parts.join(" "),
  };
}
