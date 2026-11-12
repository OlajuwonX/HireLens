import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { DISCOVERY_SOURCES } from "@/lib/discovery/types";

export const followBoardSchema = z.object({
  board: z
    .string()
    .trim()
    .min(2, "Paste a job board link or name")
    .max(300, "That link is too long"),
  source: z.preprocess(blankToUndefined, z.enum(DISCOVERY_SOURCES).optional()),
});

export const boardRefSchema = z.object({ publicId: z.uuid() });

export const postingRefSchema = z.object({ publicId: z.uuid() });

export const feedFiltersSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  arrangement: z.preprocess(
    blankToUndefined,
    z.enum(["REMOTE", "HYBRID", "ON_SITE"]).optional(),
  ),
});

export const feedPageSchema = feedFiltersSchema.extend({
  cursor: z.preprocess(blankToUndefined, z.string().max(80).optional()),
});

export type FeedFilters = z.infer<typeof feedFiltersSchema>;
