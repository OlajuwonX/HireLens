"use server";

import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import type { ReviewView } from "../review-view";
import {
  getCurrentApplicationReview,
  reviewApplicationResume,
} from "../server/review.service";

export type ReviewActionResult =
  | { ok: true; review: ReviewView }
  | { ok: false; message: string };

const publicIdSchema = z.uuid();

export async function runResumeReviewAction(
  publicId: string,
): Promise<ReviewActionResult> {
  const user = await requireDatabaseUser();
  const parsed = publicIdSchema.safeParse(publicId);

  if (!parsed.success) {
    return { ok: false, message: "That application could not be found." };
  }

  const outcome = await reviewApplicationResume({
    userId: user.id,
    publicId: parsed.data,
  });

  return outcome.ok
    ? { ok: true, review: outcome.review }
    : { ok: false, message: outcome.message };
}

export async function getResumeReviewAction(
  publicId: string,
): Promise<ReviewView | null> {
  const user = await requireDatabaseUser();
  const parsed = publicIdSchema.safeParse(publicId);

  if (!parsed.success) {
    return null;
  }

  return getCurrentApplicationReview({ userId: user.id, publicId: parsed.data });
}
