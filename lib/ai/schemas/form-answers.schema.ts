import { z } from "zod";

export const formAnswersSchema = z.object({
  answers: z.array(
    z.object({
      id: z.string().min(1),
      answer: z.string(),
    }),
  ),
});

export type FormAnswers = z.infer<typeof formAnswersSchema>;
