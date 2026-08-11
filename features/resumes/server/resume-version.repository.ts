import "server-only";

import { and, count, desc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  fileAssets,
  resumeVersions,
  resumes,
  type NewFileAsset,
  type NewResumeVersion,
} from "@/lib/db/schema";

export async function listResumeVersionsForUser(input: {
  userId: string;
  resumeId: string;
}) {
  return db
    .select()
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.resumeId, input.resumeId),
      ),
    )
    .orderBy(desc(resumeVersions.versionNumber));
}

export async function listAllResumeVersionsForUser(userId: string) {
  return db
    .select({
      publicId: resumeVersions.publicId,
      label: resumeVersions.label,
      isDefault: resumeVersions.isDefault,
      resumeTitle: resumes.title,
    })
    .from(resumeVersions)
    .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(eq(resumeVersions.userId, userId))
    .orderBy(desc(resumeVersions.isDefault), desc(resumeVersions.createdAt));
}

export async function findResumeVersionForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.publicId, input.publicId),
      ),
    )
    .limit(1);

  return version ?? null;
}

export async function getNextResumeVersionNumber(input: {
  userId: string;
  resumeId: string;
}) {
  const [result] = await db
    .select({ value: max(resumeVersions.versionNumber) })
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.resumeId, input.resumeId),
      ),
    );

  return (result?.value ?? 0) + 1;
}

export async function createResumeVersion(input: NewResumeVersion) {
  const [version] = await db.insert(resumeVersions).values(input).returning();
  return version;
}

export async function createResumeVersionWithFileAsset(input: {
  userId: string;
  resumeId: string;
  label: string;
  fileAsset: Omit<NewFileAsset, "userId" | "kind">;
}) {
  return db.transaction(async (tx) => {
    const [asset] = await tx
      .insert(fileAssets)
      .values({ ...input.fileAsset, userId: input.userId, kind: "RESUME_PDF" })
      .returning();

    const [current] = await tx
      .select({ value: max(resumeVersions.versionNumber) })
      .from(resumeVersions)
      .where(
        and(
          eq(resumeVersions.userId, input.userId),
          eq(resumeVersions.resumeId, input.resumeId),
        ),
      );

    const versionNumber = (current?.value ?? 0) + 1;
    const isDefault = versionNumber === 1;

    const [version] = await tx
      .insert(resumeVersions)
      .values({
        userId: input.userId,
        resumeId: input.resumeId,
        fileAssetId: asset.id,
        label: input.label,
        versionNumber,
        isDefault,
      })
      .returning();

    if (isDefault) {
      await tx
        .update(resumes)
        .set({
          defaultVersionId: version.id,
          status: "READY",
          updatedAt: new Date(),
        })
        .where(
          and(eq(resumes.userId, input.userId), eq(resumes.id, input.resumeId)),
        );
    }

    return version;
  });
}

export async function setDefaultResumeVersionForUser(input: {
  userId: string;
  resumeId: string;
  versionId: string;
}) {
  return db.transaction(async (tx) => {
    await tx
      .update(resumeVersions)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(resumeVersions.userId, input.userId),
          eq(resumeVersions.resumeId, input.resumeId),
        ),
      );

    const [version] = await tx
      .update(resumeVersions)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(resumeVersions.userId, input.userId),
          eq(resumeVersions.id, input.versionId),
          eq(resumeVersions.resumeId, input.resumeId),
        ),
      )
      .returning();

    if (!version) {
      return null;
    }

    await tx
      .update(resumes)
      .set({ defaultVersionId: input.versionId, updatedAt: new Date() })
      .where(and(eq(resumes.userId, input.userId), eq(resumes.id, input.resumeId)));

    return version;
  });
}

export async function countResumeVersions(input: {
  userId: string;
  resumeId: string;
}) {
  const [row] = await db
    .select({ value: count() })
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.resumeId, input.resumeId),
      ),
    );

  return row?.value ?? 0;
}

export async function deleteResumeVersionForUser(input: {
  userId: string;
  versionId: string;
}) {
  return db.transaction(async (tx) => {
    const [version] = await tx
      .delete(resumeVersions)
      .where(
        and(
          eq(resumeVersions.userId, input.userId),
          eq(resumeVersions.id, input.versionId),
        ),
      )
      .returning();

    if (!version) {
      return null;
    }

    await tx
      .update(resumes)
      .set({ defaultVersionId: null, updatedAt: new Date() })
      .where(
        and(
          eq(resumes.userId, input.userId),
          eq(resumes.defaultVersionId, input.versionId),
        ),
      );

    await tx
      .update(fileAssets)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(fileAssets.userId, input.userId),
          eq(fileAssets.id, version.fileAssetId),
        ),
      );

    return version;
  });
}

export async function resumeVersionExistsWithLabel(input: {
  userId: string;
  resumeId: string;
  label: string;
}) {
  const [row] = await db
    .select({ id: resumeVersions.id })
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.userId, input.userId),
        eq(resumeVersions.resumeId, input.resumeId),
        eq(resumeVersions.label, input.label),
      ),
    )
    .limit(1);

  return Boolean(row);
}
