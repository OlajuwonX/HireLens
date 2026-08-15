import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  fileAssets,
  resumeVersions,
  resumes,
  type NewResume,
} from "@/lib/db/schema";

export async function createResume(input: NewResume) {
  const [resume] = await db.insert(resumes).values(input).returning();
  return resume;
}

export async function findOrCreateResumeGroupByTitle(input: {
  userId: string;
  title: string;
}) {
  const [existing] = await db
    .select()
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.title, input.title),
        isNull(resumes.archivedAt),
      ),
    )
    .orderBy(desc(resumes.createdAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  return createResume({
    userId: input.userId,
    title: input.title,
    status: "READY",
  });
}

export async function findResumeForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.publicId, input.publicId),
      ),
    )
    .limit(1);

  return resume ?? null;
}

export async function listStorageKeysForResume(input: {
  userId: string;
  resumeId: string;
}) {
  return db
    .selectDistinct({ storageKey: fileAssets.storageKey })
    .from(resumeVersions)
    .innerJoin(fileAssets, eq(fileAssets.id, resumeVersions.fileAssetId))
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.resumeId, input.resumeId),
      ),
    );
}

export async function listResumesForUser(userId: string) {
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt));
}

export async function renameResumeForUser(input: {
  userId: string;
  publicId: string;
  title: string;
}) {
  const [resume] = await db
    .update(resumes)
    .set({ title: input.title, updatedAt: new Date() })
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.publicId, input.publicId),
      ),
    )
    .returning();

  return resume ?? null;
}

export async function archiveResumeForUser(input: {
  userId: string;
  publicId: string;
  archived: boolean;
}) {
  const [resume] = await db
    .update(resumes)
    .set({
      status: input.archived ? "ARCHIVED" : "READY",
      archivedAt: input.archived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.publicId, input.publicId),
      ),
    )
    .returning();

  return resume ?? null;
}

export async function deleteResumeForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [resume] = await db
    .delete(resumes)
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.publicId, input.publicId),
      ),
    )
    .returning();

  return resume ?? null;
}

export async function retryResumeProcessingForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [resume] = await db
    .update(resumes)
    .set({ status: "PROCESSING", updatedAt: new Date() })
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.publicId, input.publicId),
      ),
    )
    .returning();

  return resume ?? null;
}
