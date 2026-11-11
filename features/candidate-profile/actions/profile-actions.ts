"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { formValues } from "@/lib/forms/form-values";
import { fieldErrorsFrom } from "@/lib/forms/zod-error";
import { PROFILE_SETTINGS_PATH } from "../constants";
import { profileSchema } from "../schemas/profile.schema";
import { saveCandidateProfile } from "../server/profile.service";
import type { ProfileFormState } from "./form-state";

export async function saveProfileAction(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireDatabaseUser();
  const parsed = profileSchema.safeParse({
    ...Object.fromEntries(formData),
    workArrangements: formData.getAll("workArrangements"),
    willingToRelocate: formData.get("willingToRelocate") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: formValues(formData),
    };
  }

  const completeness = await saveCandidateProfile({
    userId: user.id,
    values: parsed.data,
  });

  revalidatePath(PROFILE_SETTINGS_PATH);

  return {
    status: "saved",
    message: completeness.readyToApply
      ? "Profile saved. You're ready to apply."
      : "Profile saved.",
    fieldErrors: {},
  };
}
