import { z } from "zod";

export const traceActions = ["KEEP", "REFINE", "MERGE", "DROP"] as const;

export const traceEntrySchema = z.object({
  sourceId: z.string().min(1),
  action: z.enum(traceActions),
  reason: z.string(),
});

export type TraceEntry = z.infer<typeof traceEntrySchema>;
