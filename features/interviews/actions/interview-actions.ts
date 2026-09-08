"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { submitInterviewAnswer } from "../server/interview-answer.service";
import type { InterviewAnswerState } from "./interview-form-state";

const submitAnswerSchema = z.object({
  questionPublicId: z.string().uuid(),
  selectedOption: z.coerce.number().int().min(0).max(9),
});

const errorMessages: Record<string, string> = {
  NO_CYCLE:
    "Your interview week has not started yet. Open the interview page to begin.",
  FORGED_QUESTION: "That question is not part of your current interview set.",
  LOCKED: "That daily question unlocks later this week.",
  INVALID_OPTION: "Choose one of the listed answers.",
  ALREADY_ANSWERED: "You have already answered that question.",
};

export async function submitInterviewAnswerAction(
  _state: InterviewAnswerState,
  formData: FormData,
): Promise<InterviewAnswerState> {
  const user = await requireDatabaseUser();
  const parsed = submitAnswerSchema.safeParse({
    questionPublicId: formData.get("questionPublicId"),
    selectedOption: formData.get("selectedOption"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(
        parsed.error,
        "Could not submit that answer.",
      ),
    };
  }

  const outcome = await submitInterviewAnswer({
    userId: user.id,
    questionPublicId: parsed.data.questionPublicId,
    selectedOption: parsed.data.selectedOption,
  });

  if (!outcome.ok) {
    return {
      status: "error",
      message: errorMessages[outcome.error] ?? "Could not submit that answer.",
    };
  }

  revalidatePath("/dashboard/interview");
  revalidatePath("/dashboard");

  return {
    status: "answered",
    questionPublicId: outcome.questionPublicId,
    selectedOption: outcome.selectedOption,
    correct: outcome.correct,
    correctOption: outcome.correctOption,
    explanation: outcome.explanation,
  };
}
