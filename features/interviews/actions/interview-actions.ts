"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { submitInterviewAnswer } from "../server/interview-answer.service";
import { getOrCreateInterviewCycle } from "../server/interview-cycle.service";
import type {
  InterviewAnswerState,
  StartInterviewWeekState,
} from "./interview-form-state";

const submitAnswerSchema = z.object({
  questionPublicId: z.string().uuid(),
  selectedOption: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(9)),
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
      message: firstIssueMessage(parsed.error, "Could not submit that answer."),
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

const startErrorMessages: Record<string, string> = {
  ineligible: "Add a resume and a saved job before starting an interview week.",
  no_source:
    "We could not read a role to build questions from. Analyze an application first.",
  quota_blocked:
    "The shared daily budget for building new question sets is used up. Try again tomorrow.",
  failed:
    "Building this week's set did not finish. Try again in a little while.",
};

export async function startInterviewWeekAction(
  _state: StartInterviewWeekState,
  _formData: FormData,
): Promise<StartInterviewWeekState> {
  const user = await requireDatabaseUser();

  let result;

  try {
    result = await getOrCreateInterviewCycle({ userId: user.id });
  } catch (error) {
    console.error("start interview week failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: "error",
      message: "This week's set could not be started. Try again in a moment.",
    };
  }

  if (result.status === "ready") {
    revalidatePath("/dashboard/interview");
    revalidatePath("/dashboard");

    return { status: "started" };
  }

  if (result.status === "pending") {
    return { status: "pending_generation" };
  }

  return {
    status: "error",
    message:
      startErrorMessages[result.status] ??
      "This week's set could not be started.",
  };
}
