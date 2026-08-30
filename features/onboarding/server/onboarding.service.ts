import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  generatedDocuments,
  resumeVersions,
  users,
} from "@/lib/db/schema";
import type { OnboardingProgress } from "../constants";

export async function getOnboardingProgress(
  userId: string,
): Promise<OnboardingProgress | null> {
  const [row] = await db
    .select({
      completed: users.onboardingCompleted,
      hasResumeVersion: sql<boolean>`exists (select 1 from ${resumeVersions} where ${resumeVersions.userId} = ${users.id})`,
      hasApplication: sql<boolean>`exists (select 1 from ${applications} where ${applications.userId} = ${users.id})`,
      hasDocument: sql<boolean>`exists (select 1 from ${generatedDocuments} where ${generatedDocuments.userId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || row.completed) {
    return null;
  }

  return {
    hasResumeVersion: Boolean(row.hasResumeVersion),
    hasApplication: Boolean(row.hasApplication),
    hasDocument: Boolean(row.hasDocument),
  };
}
