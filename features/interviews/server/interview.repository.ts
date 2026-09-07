import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applicationAnalyses,
  applications,
  jobs,
  resumeVersions,
  resumes,
} from "@/lib/db/schema";
import { INTERVIEW_MIN_JOB_DESCRIPTION_LENGTH } from "../constants";

export async function userHasUsableResume(userId: string) {
  const [row] = await db
    .select({ id: resumeVersions.id })
    .from(resumeVersions)
    .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(
      and(
        eq(resumeVersions.userId, userId),
        isNull(resumes.archivedAt),
        eq(resumes.status, "READY"),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function userHasJobContext(userId: string) {
  const [row] = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(
      and(
        eq(applications.userId, userId),
        sql`char_length(btrim(${jobs.description})) >= ${INTERVIEW_MIN_JOB_DESCRIPTION_LENGTH}`,
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function userHasSucceededAnalysis(userId: string) {
  const [row] = await db
    .select({ id: applicationAnalyses.id })
    .from(applicationAnalyses)
    .where(
      and(
        eq(applicationAnalyses.userId, userId),
        eq(applicationAnalyses.status, "SUCCEEDED"),
      ),
    )
    .limit(1);

  return Boolean(row);
}
