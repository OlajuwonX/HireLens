import { z } from "zod";

export const bulletRewriteSchema = z.object({
  original: z.string().min(1),
  improved: z.string().min(1),
  reason: z.string().min(1),
});

export type BulletRewrite = z.infer<typeof bulletRewriteSchema>;
