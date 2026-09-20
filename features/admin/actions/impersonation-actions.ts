"use server";

import { redirect } from "next/navigation";
import { unstable_update } from "@/auth";
import {
  ADMIN_ACTIONS,
  ADMIN_TARGET_TYPES,
  IMPERSONATION_TTL_MS,
} from "@/features/admin/constants";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { recordAdminAction } from "@/features/admin/server/audit-log";
import { startImpersonationSchema } from "@/features/admin/schemas/impersonation.schema";
import { findUserByPublicId } from "@/features/admin/server/user-admin.repository";
import { assertCanImpersonate } from "@/features/admin/server/impersonation.service";
import {
  closeImpersonationSession,
  findOpenImpersonationSession,
  insertImpersonationSession,
} from "@/features/admin/server/impersonation.repository";
import { getActiveImpersonation } from "@/features/auth/server/impersonation";

export async function startImpersonationAction(formData: FormData) {
  const admin = await requireAdminUser();

  const alreadyImpersonating = await getActiveImpersonation();

  if (alreadyImpersonating) {
    throw new Error("End your current impersonation session first.");
  }

  const parsed = startImpersonationSchema.safeParse({
    targetPublicId: formData.get("targetPublicId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Check the form and try again.",
    );
  }

  const target = await findUserByPublicId(parsed.data.targetPublicId);

  if (!target) {
    throw new Error("That user could not be found.");
  }

  assertCanImpersonate({ actorId: admin.id, target });

  const expiresAt = new Date(Date.now() + IMPERSONATION_TTL_MS);

  const session = await insertImpersonationSession({
    actorUserId: admin.id,
    targetUserId: target.id,
    reason: parsed.data.reason,
    expiresAt,
  });

  await recordAdminAction({
    actorId: admin.id,
    action: ADMIN_ACTIONS.IMPERSONATE_START,
    targetType: ADMIN_TARGET_TYPES.USER,
    targetId: target.publicId,
    metadata: { reason: parsed.data.reason, targetEmail: target.email },
  });

  await unstable_update({
    impersonation: { sessionPublicId: session.publicId },
  } as Parameters<typeof unstable_update>[0]);

  redirect("/dashboard");
}

export async function endImpersonationAction() {
  const admin = await requireAdminUser();
  const impersonation = await getActiveImpersonation();

  if (!impersonation) {
    redirect("/admin");
  }

  const openSession = await findOpenImpersonationSession({
    actorUserId: admin.id,
    targetUserId: impersonation.targetUserId,
  });

  if (openSession) {
    await closeImpersonationSession(openSession.publicId);
  }

  await recordAdminAction({
    actorId: admin.id,
    action: ADMIN_ACTIONS.IMPERSONATE_END,
    targetType: ADMIN_TARGET_TYPES.USER,
    targetId: impersonation.targetUserId,
  });

  await unstable_update({ impersonation: null });

  redirect("/admin");
}
