import { z } from "zod";

export const applicationEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type ApplicationEmail = z.infer<typeof applicationEmailSchema>;
