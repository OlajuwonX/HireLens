"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { DISCOVERY_PATH } from "../constants";
import {
  boardRefSchema,
  feedPageSchema,
  followBoardSchema,
  postingRefSchema,
} from "../schemas/discovery.schema";
import { unfollowBoard } from "../server/board.repository";
import { followJobBoard } from "../server/discovery.service";
import { findPostingForUser } from "../server/feed.repository";
import { getPostingFeed, type PostingFeedPage } from "../server/feed.service";
import { savePostingToJobs, type SavePostingResult } from "../server/posting-save.service";

export type FollowFormState = { status: "idle" | "error" | "saved"; message: string };

export async function followBoardAction(
  _state: FollowFormState,
  formData: FormData,
): Promise<FollowFormState> {
  const user = await requireDatabaseUser();
  const parsed = followBoardSchema.safeParse({
    board: formData.get("board") ?? "",
    source: formData.get("source"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error, "Check the board link.") };
  }

  const result = await followJobBoard({ userId: user.id, ...parsed.data });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath(DISCOVERY_PATH);

  return {
    status: "saved",
    message: `Following ${result.companyName}: ${result.active} open roles.`,
  };
}

export async function unfollowBoardAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const parsed = boardRefSchema.safeParse({ publicId: formData.get("publicId") });

  if (parsed.success) {
    await unfollowBoard({ userId: user.id, publicId: parsed.data.publicId });
    revalidatePath(DISCOVERY_PATH);
  }
}

export async function loadPostingsAction(input: unknown): Promise<PostingFeedPage> {
  const user = await requireDatabaseUser();
  const parsed = feedPageSchema.safeParse(input);

  if (!parsed.success) {
    return { rows: [], nextCursor: null };
  }

  const { cursor, ...filters } = parsed.data;

  return getPostingFeed({ userId: user.id, filters, cursor });
}

export async function getPostingAction(publicId: string) {
  const user = await requireDatabaseUser();
  const parsed = postingRefSchema.safeParse({ publicId });

  if (!parsed.success) {
    return null;
  }

  const posting = await findPostingForUser({ userId: user.id, publicId: parsed.data.publicId });

  return posting
    ? {
        title: posting.title,
        company: posting.company,
        location: posting.location,
        description: posting.description,
        url: posting.url,
        applyUrl: posting.applyUrl,
      }
    : null;
}

export async function savePostingAction(publicId: string): Promise<SavePostingResult> {
  const user = await requireDatabaseUser();
  const parsed = postingRefSchema.safeParse({ publicId });

  if (!parsed.success) {
    return { ok: false, message: "That job could not be found." };
  }

  const result = await savePostingToJobs({ userId: user.id, publicId: parsed.data.publicId });

  if (result.ok && !result.alreadySaved) {
    revalidatePath("/dashboard/jobs");
  }

  return result;
}
