"use server";

import { passwordSchema } from "@/features/auth/schemas/credentials.schema";
import { passwordProblemMessage } from "@/features/auth/schemas/password-rules";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { setAccountPassword } from "@/features/auth/server/user.service";
import { revalidatePath } from "next/cache";
import type { PasswordFormState } from "./password-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function setAccountPasswordAction(
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await requireDatabaseUser();
  const password = getString(formData, "password");

  if (!passwordSchema.safeParse(password).success) {
    return {
      status: "error",
      message:
        passwordProblemMessage(password) ?? "Choose a stronger password.",
    };
  }

  const result = await setAccountPassword({
    userId: user.id,
    currentPassword: getString(formData, "currentPassword"),
    newPassword: password,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/settings/account");

  return { status: "saved", message: "Your password has been updated." };
}
