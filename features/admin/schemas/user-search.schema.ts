import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";

export const USER_SORT_KEYS = ["name", "createdAt", "lastLoginAt"] as const;
export type UserSortKey = (typeof USER_SORT_KEYS)[number];

export const userSearchSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(USER_SORT_KEYS).optional()),
  dir: z.preprocess(blankToUndefined, z.enum(["asc", "desc"]).optional()),
});

export type UserSearchFilters = z.infer<typeof userSearchSchema>;
