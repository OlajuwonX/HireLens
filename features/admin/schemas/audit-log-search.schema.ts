import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { ADMIN_ACTIONS } from "@/features/admin/constants";

const actionValues = Object.values(ADMIN_ACTIONS) as [string, ...string[]];

export const auditLogSearchSchema = z.object({
  actor: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  action: z.preprocess(blankToUndefined, z.enum(actionValues).optional()),
});

export type AuditLogSearchFilters = z.infer<typeof auditLogSearchSchema>;
