import "server-only";

import { findApplicationRowForUser, recordApplicationActivity } from "@/features/applications/server/application.repository";
import { POSITIVE_KINDS, type ResponseKind } from "@/lib/responses/classify";
import { kindLabels } from "../constants";
import { findEventForUser, updateEvent } from "./email.repository";
import { ensurePendingPrep, findPrepForUser } from "./prep.repository";
import { generatePrep, type PrepOutcome } from "./prep.service";

export type ReviewResult = { ok: true; prepPublicId: string | null } | { ok: false; message: string };

export async function confirmResponse(input: {
  userId: string;
  publicId: string;
  kind: ResponseKind;
  applicationPublicId?: string;
}): Promise<ReviewResult> {
  const event = await findEventForUser(input);

  if (!event) {
    return { ok: false, message: "That message could not be found." };
  }

  const application = input.applicationPublicId
    ? await findApplicationRowForUser({ userId: input.userId, publicId: input.applicationPublicId })
    : null;

  if (input.applicationPublicId && !application) {
    return { ok: false, message: "That application could not be found." };
  }

  const applicationId = application?.application.id ?? event.applicationId;

  await updateEvent({ userId: input.userId, id: event.id, set: { status: "CONFIRMED", kind: input.kind, applicationId } });

  if (!applicationId) {
    return { ok: true, prepPublicId: null };
  }

  await recordApplicationActivity({ userId: input.userId, applicationId, title: `${kindLabels[input.kind]} confirmed by you` });

  if (!POSITIVE_KINDS.includes(input.kind)) {
    return { ok: true, prepPublicId: null };
  }

  const prep = await ensurePendingPrep({ userId: input.userId, applicationId, emailEventId: event.id });

  return { ok: true, prepPublicId: prep.publicId };
}

export async function dismissResponse(input: { userId: string; publicId: string }) {
  const event = await findEventForUser(input);

  if (event) {
    await updateEvent({ userId: input.userId, id: event.id, set: { status: "DISMISSED" } });
  }
}

export async function regeneratePrep(input: { userId: string; publicId: string }): Promise<PrepOutcome> {
  const prep = await findPrepForUser(input);

  if (!prep) {
    return { ok: false, message: "That preparation could not be found." };
  }

  return generatePrep({ userId: input.userId, prep, emailText: null });
}
