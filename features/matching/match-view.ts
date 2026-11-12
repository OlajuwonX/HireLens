import { z } from "zod";
import { matchFits } from "@/lib/ai/schemas/job-matching.schema";

const reasonSchema = z.object({
  rule: z.string(),
  verdict: z.enum(["CHECK", "FAIL"]),
  text: z.string(),
});

const insightSchema = z.object({
  strengths: z.array(z.string()).catch([]),
  gaps: z.array(z.string()).catch([]),
  summary: z.string().catch(""),
});

export type MatchView = {
  publicId: string;
  postingPublicId: string;
  title: string;
  company: string;
  location: string | null;
  rank: number | null;
  fit: (typeof matchFits)[number] | null;
  reasons: z.infer<typeof reasonSchema>[];
  insight: z.infer<typeof insightSchema> | null;
};

export function toMatchView(row: {
  publicId: string;
  postingPublicId: string;
  title: string;
  company: string;
  location: string | null;
  rank: number | null;
  fit: string | null;
  reasons: unknown;
  insight: unknown;
}): MatchView {
  const fit = z.enum(matchFits).safeParse(row.fit);
  const insight = insightSchema.safeParse(row.insight);

  return {
    publicId: row.publicId,
    postingPublicId: row.postingPublicId,
    title: row.title,
    company: row.company,
    location: row.location,
    rank: row.rank,
    fit: fit.success ? fit.data : null,
    reasons: z.array(reasonSchema).catch([]).parse(row.reasons),
    insight: row.insight && insight.success ? insight.data : null,
  };
}
