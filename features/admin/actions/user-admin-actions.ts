"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { userActionSchema } from "@/features/admin/schemas/user-admin.schema";
import {
  countAdmins,
  findUserByPublicId,
  setUserDisabled,
  setUserRole,
} from "@/features/admin/server/user-admin.repository";
import { assertCanDisable, assertCanRevokeAdmin } from "@/features/admin/server/user-admin.service";

const ADMIN_USERS_PATH = "/admin/users";

function getPublicId(formData: FormData) {
  const parsed = userActionSchema.safeParse({
    publicId: formData.get("publicId"),
  });

  if (!parsed.success) {
    throw new Error("That user could not be found.");
  }

  return parsed.data.publicId;
}

export async function promoteToAdminAction(formData: FormData) {
  await requireAdminUser();

  const publicId = getPublicId(formData);
  const target = await findUserByPublicId(publicId);

  if (!target) {
    throw new Error("That user could not be found.");
  }

  await setUserRole({ publicId, role: "ADMIN" });
  revalidatePath(ADMIN_USERS_PATH);
}

export async function revokeAdminAction(formData: FormData) {
  await requireAdminUser();

  const publicId = getPublicId(formData);
  const target = await findUserByPublicId(publicId);

  if (!target) {
    throw new Error("That user could not be found.");
  }

  const adminCount = await countAdmins();

  if (!assertCanRevokeAdmin({ target, adminCount })) {
    return;
  }

  await setUserRole({ publicId, role: "USER" });
  revalidatePath(ADMIN_USERS_PATH);
}

export async function disableUserAction(formData: FormData) {
  const admin = await requireAdminUser();

  const publicId = getPublicId(formData);
  const target = await findUserByPublicId(publicId);

  if (!target) {
    throw new Error("That user could not be found.");
  }

  assertCanDisable({ target, actingAdminId: admin.id });

  await setUserDisabled({ publicId, disabled: true });
  revalidatePath(ADMIN_USERS_PATH);
}

export async function enableUserAction(formData: FormData) {
  await requireAdminUser();

  const publicId = getPublicId(formData);
  const target = await findUserByPublicId(publicId);

  if (!target) {
    throw new Error("That user could not be found.");
  }

  await setUserDisabled({ publicId, disabled: false });
  revalidatePath(ADMIN_USERS_PATH);
}
