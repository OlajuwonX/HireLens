import { z } from "zod";

export const prepQuestionTypes = ["TECHNICAL", "BEHAVIOURAL", "COMPANY", "ROLE"] as const;

export const interviewPrepSchema = z.object({
  summary: z.string().min(1),
  focusAreas: z.array(z.object({ topic: z.string().min(1), why: z.string().min(1) })),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(prepQuestionTypes),
      answerOutline: z.string().min(1),
      evidence: z.string(),
    }),
  ),
  gapsToPrepare: z.array(z.object({ gap: z.string().min(1), howToAddress: z.string().min(1) })),
  revisionPlan: z.array(z.object({ day: z.number().int().min(1).max(7), tasks: z.array(z.string().min(1)) })),
  questionsToAsk: z.array(z.string().min(1)),
  replyDraft: z.string(),
});

export type InterviewPrep = z.infer<typeof interviewPrepSchema>;
