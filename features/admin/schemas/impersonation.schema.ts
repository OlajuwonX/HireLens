import { z } from "zod";

export const startImpersonationSchema = z.object({
  targetPublicId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Give a reason, at least 10 characters.")
    .max(500, "Keep the reason under 500 characters."),
});

export type StartImpersonationInput = z.infer<typeof startImpersonationSchema>;
