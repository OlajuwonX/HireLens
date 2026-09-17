import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";

export const userSearchSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
});

export type UserSearchFilters = z.infer<typeof userSearchSchema>;
