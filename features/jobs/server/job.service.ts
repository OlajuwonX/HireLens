import "server-only";

import type { CreateJobInput, JobFilters } from "../schemas/job.schema";
import {
  createJob,
  deleteJobForUser,
  findJobForUser,
  listJobsForUser,
  setJobStatusForUser,
  updateJobForUser,
} from "./job.repository";

function toColumns(input: CreateJobInput) {
  return {
    title: input.title,
    company: input.company,
    location: input.location ?? null,
    workArrangement: input.workArrangement,
    employmentType: input.employmentType,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    currency: input.currency ?? null,
    source: input.source ?? null,
    sourceUrl: input.sourceUrl ?? null,
    description: input.description,
    requirements: input.requirements ?? null,
    deadlineAt: input.deadlineAt ?? null,
    notes: input.notes ?? null,
  };
}

export async function getOwnedJob(input: { userId: string; publicId: string }) {
  return findJobForUser(input);
}

export async function getJobBoard(input: {
  userId: string;
  filters: JobFilters;
}) {
  return listJobsForUser(input);
}

export async function createOwnedJob(input: {
  userId: string;
  values: CreateJobInput;
}) {
  return createJob({ userId: input.userId, ...toColumns(input.values) });
}

export async function updateOwnedJob(input: {
  userId: string;
  publicId: string;
  values: CreateJobInput;
}) {
  return updateJobForUser({
    userId: input.userId,
    publicId: input.publicId,
    values: toColumns(input.values),
  });
}

export async function duplicateOwnedJob(input: {
  userId: string;
  publicId: string;
}) {
  const source = await findJobForUser(input);

  if (!source) {
    return null;
  }

  return createJob({
    userId: input.userId,
    title: `${source.title} (copy)`.slice(0, 200),
    company: source.company,
    location: source.location,
    workArrangement: source.workArrangement,
    employmentType: source.employmentType,
    salaryMin: source.salaryMin,
    salaryMax: source.salaryMax,
    currency: source.currency,
    source: source.source,
    sourceUrl: source.sourceUrl,
    description: source.description,
    requirements: source.requirements,
    deadlineAt: source.deadlineAt,
    notes: source.notes,
  });
}

export async function archiveOwnedJob(input: {
  userId: string;
  publicId: string;
}) {
  return setJobStatusForUser({ ...input, status: "ARCHIVED" });
}

export async function restoreOwnedJob(input: {
  userId: string;
  publicId: string;
}) {
  return setJobStatusForUser({ ...input, status: "SAVED" });
}

export async function deleteOwnedJob(input: {
  userId: string;
  publicId: string;
}) {
  return deleteJobForUser(input);
}
