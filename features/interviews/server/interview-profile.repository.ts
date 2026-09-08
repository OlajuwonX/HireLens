import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applicationAnalyses,
  applications,
  jobs,
  resumeVersions,
} from "@/lib/db/schema";
import { readStoredIntelligence } from "@/features/analyses/server/analysis.mapper";

export type InterviewProfileSource = {
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string | null;
  resumeText: string | null;
  analysis: ReturnType<typeof readStoredIntelligence>;
};

export async function findInterviewProfileSource(
  userId: string,
): Promise<InterviewProfileSource | null> {
  const [analysed] = await db
    .select({
      jobTitle: jobs.title,
      jobDescription: jobs.description,
      jobRequirements: jobs.requirements,
      resumeText: resumeVersions.extractedText,
      resultJson: applicationAnalyses.resultJson,
      status: applicationAnalyses.status,
    })
    .from(applicationAnalyses)
    .innerJoin(jobs, eq(jobs.id, applicationAnalyses.jobId))
    .innerJoin(
      resumeVersions,
      eq(resumeVersions.id, applicationAnalyses.resumeVersionId),
    )
    .where(
      and(
        eq(applicationAnalyses.userId, userId),
        eq(applicationAnalyses.status, "SUCCEEDED"),
      ),
    )
    .orderBy(desc(applicationAnalyses.createdAt))
    .limit(1);

  if (analysed) {
    return {
      jobTitle: analysed.jobTitle,
      jobDescription: analysed.jobDescription,
      jobRequirements: analysed.jobRequirements,
      resumeText: analysed.resumeText,
      analysis: readStoredIntelligence({
        resultJson: analysed.resultJson,
        status: analysed.status,
      }),
    };
  }

  const [application] = await db
    .select({
      jobTitle: jobs.title,
      jobDescription: jobs.description,
      jobRequirements: jobs.requirements,
      resumeText: resumeVersions.extractedText,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, applications.resumeVersionId),
    )
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.lastActivityAt))
    .limit(1);

  if (!application) {
    return null;
  }

  return {
    jobTitle: application.jobTitle,
    jobDescription: application.jobDescription,
    jobRequirements: application.jobRequirements,
    resumeText: application.resumeText,
    analysis: null,
  };
}
