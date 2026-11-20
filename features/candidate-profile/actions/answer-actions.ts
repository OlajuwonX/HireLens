"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { formValues } from "@/lib/forms/form-values";
import { fieldErrorsFrom } from "@/lib/forms/zod-error";
import { PROFILE_SETTINGS_PATH } from "../constants";
import { answerSchema, deleteAnswerSchema } from "../schemas/answer.schema";
import { removeAnswer, saveAnswer } from "../server/answer.service";
import type { ProfileFormState } from "./form-state";

export async function saveAnswerAction(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireDatabaseUser();
  const parsed = answerSchema.safeParse({
    publicId: formData.get("publicId"),
    question: formData.get("question") ?? "",
    answer: formData.get("answer") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: formValues(formData),
    };
  }

  const result = await saveAnswer({ userId: user.id, values: parsed.data });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: {},
      values: formValues(formData),
    };
  }

  revalidatePath(PROFILE_SETTINGS_PATH);

  return {
    status: "saved",
    message: result.updated ? "Answer updated." : "Answer saved.",
    fieldErrors: {},
  };
}

export async function deleteAnswerAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const parsed = deleteAnswerSchema.safeParse({
    publicId: formData.get("publicId"),
  });

  if (!parsed.success) {
    return;
  }

  await removeAnswer({ userId: user.id, publicId: parsed.data.publicId });
  revalidatePath(PROFILE_SETTINGS_PATH);
}
