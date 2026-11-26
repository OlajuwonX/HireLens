import "server-only";

import { and, avg, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applicationAnalyses, applications, jobs, resumes } from "@/lib/db/schema";
import { listActiveResumeTitles } from "@/features/resumes/server/resume.repository";
import { getDashboardInterview } from "@/features/interviews/server/interview-dashboard.service";

async function countRows(query: Promise<{ value: number }[]>) {
  const [row] = await query;

  return row?.value ?? 0;
}

export async function getDashboardSummary(userId: string) {
  const [resumeGroupCount, applicationCount, recentApplications, averageMatchRows, resumeTitles, interview] =
    await Promise.all([
      countRows(db.select({ value: count() }).from(resumes).where(eq(resumes.userId, userId))),
      countRows(db.select({ value: count() }).from(applications).where(eq(applications.userId, userId))),
      db
        .select({ publicId: applications.publicId, title: jobs.title, company: jobs.company })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.lastActivityAt))
        .limit(5),
      db
        .select({ value: avg(applicationAnalyses.overallScore) })
        .from(applicationAnalyses)
        .where(and(eq(applicationAnalyses.userId, userId), eq(applicationAnalyses.status, "SUCCEEDED"))),
      listActiveResumeTitles(userId),
      getDashboardInterview(userId).catch((error) => {
        console.error("dashboard interview read rejected", {
          reason: error instanceof Error ? error.message : "unknown",
        });

        return { state: "unavailable" as const };
      }),
    ]);

  const average = averageMatchRows[0]?.value;

  return {
    resumeTitles,
    resumeGroupCount,
    applicationCount,
    averageMatchScore: average === null || average === undefined ? null : Math.round(Number(average)),
    recentApplications,
    interview,
  };
}
