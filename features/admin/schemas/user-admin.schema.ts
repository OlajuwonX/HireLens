import { z } from "zod";

export const userActionSchema = z.object({
  publicId: z.string().uuid(),
});

export type UserActionInput = z.infer<typeof userActionSchema>;
