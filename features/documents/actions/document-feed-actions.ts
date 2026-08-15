"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { z } from "zod";
import { DOCUMENT_PAGE_SIZE } from "../constants";
import type { DocumentListRow } from "../server/document.repository";
import { getDocumentBoard } from "../server/document.service";

const feedPageSchema = z.object({
  cursor: z.preprocess(blankToUndefined, z.iso.datetime().optional()),
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  type: z.preprocess(blankToUndefined, z.string().trim().max(64).optional()),
  from: z.preprocess(blankToUndefined, z.string().trim().max(32).optional()),
  to: z.preprocess(blankToUndefined, z.string().trim().max(32).optional()),
});

export type DocumentFeedPage = {
  rows: DocumentListRow[];
  nextCursor: string | null;
};

export async function loadMoreDocumentsAction(
  input: z.input<typeof feedPageSchema>,
): Promise<DocumentFeedPage> {
  const user = await requireDatabaseUser();
  const parsed = feedPageSchema.safeParse(input);

  if (!parsed.success) {
    return { rows: [], nextCursor: null };
  }

  const { cursor, ...filters } = parsed.data;

  const documents = await getDocumentBoard({
    userId: user.id,
    filters,
    limit: DOCUMENT_PAGE_SIZE + 1,
    cursor,
  });

  const rows = documents.slice(0, DOCUMENT_PAGE_SIZE);
  const nextCursor =
    documents.length > DOCUMENT_PAGE_SIZE
      ? (rows[rows.length - 1]?.createdAt.toISOString() ?? null)
      : null;

  return { rows, nextCursor };
}
