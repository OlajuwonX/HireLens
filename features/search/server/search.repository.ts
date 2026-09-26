import "server-only";

import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  generatedDocuments,
  jobs,
  resumes,
} from "@/lib/db/schema";

export type DocumentTypeValue = (typeof generatedDocuments.type.enumValues)[number];

export async function searchResumeRows(input: {
  userId: string;
  pattern: string;
  limit: number;
}) {
  return db
    .select({ publicId: resumes.publicId, title: resumes.title })
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, input.userId),
        eq(resumes.status, "READY"),
        isNull(resumes.archivedAt),
        ilike(resumes.title, input.pattern),
      ),
    )
    .orderBy(desc(resumes.createdAt))
    .limit(input.limit);
}

export async function searchJobRows(input: {
  userId: string;
  pattern: string;
  limit: number;
}) {
  return db
    .select({
      publicId: applications.publicId,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(
      and(
        eq(applications.userId, input.userId),
        isNull(applications.archivedAt),
        or(
          ilike(jobs.title, input.pattern),
          ilike(jobs.company, input.pattern),
          ilike(jobs.location, input.pattern),
        ),
      ),
    )
    .orderBy(desc(applications.lastActivityAt))
    .limit(input.limit);
}

export async function searchDocumentRows(input: {
  userId: string;
  pattern: string;
  types: DocumentTypeValue[];
  limit: number;
}) {
  const matchers = [
    ilike(jobs.title, input.pattern),
    ilike(jobs.company, input.pattern),
  ];

  if (input.types.length > 0) {
    matchers.push(inArray(generatedDocuments.type, input.types));
  }

  return db
    .select({
      publicId: generatedDocuments.publicId,
      type: generatedDocuments.type,
      jobTitle: jobs.title,
      jobCompany: jobs.company,
    })
    .from(generatedDocuments)
    .leftJoin(jobs, eq(jobs.id, generatedDocuments.jobId))
    .where(and(eq(generatedDocuments.userId, input.userId), or(...matchers)))
    .orderBy(desc(generatedDocuments.createdAt))
    .limit(input.limit);
}
