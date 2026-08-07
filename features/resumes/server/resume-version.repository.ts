import "server-only";

import { and, desc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  resumeVersions,
  resumes,
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
