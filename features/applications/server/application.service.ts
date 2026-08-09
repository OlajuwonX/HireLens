import "server-only";

import { getOwnedJob } from "@/features/jobs/server/job.service";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import { applicationStageLabels } from "../constants";
import type {
  ApplicationFilters,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "../schemas/application.schema";
import {
  createApplicationWithActivity,
  deleteApplicationForUser,
  findApplicationForJob,
  findApplicationForUser,
  findApplicationRowForUser,
  listActivitiesForApplication,
  listApplicationsForUser,
  updateApplicationWithActivity,
} from "./application.repository";

export type ApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "NOT_FOUND" | "DUPLICATE"; message: string };

async function resolveVersionId(input: {
  userId: string;
  versionPublicId?: string;
}) {
  if (!input.versionPublicId) {
    return null;
  }

  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.versionPublicId,
  });

  return version?.id ?? null;
}

export async function getApplicationBoard(input: {
  userId: string;
  filters: ApplicationFilters;
}) {
  return listApplicationsForUser(input);
}

export async function getOwnedApplication(input: {
  userId: string;
  publicId: string;
}) {
  return findApplicationRowForUser(input);
}

export async function getApplicationTimeline(input: {
  userId: string;
  publicId: string;
}) {
  const application = await findApplicationForUser(input);

  if (!application) {
    return null;
  }

  return listActivitiesForApplication({
    userId: input.userId,
    applicationId: application.id,
  });
}

export async function trackJobAsApplication(input: {
  userId: string;
  values: CreateApplicationInput;
}): Promise<ApplicationResult<{ publicId: string }>> {
  const job = await getOwnedJob({
    userId: input.userId,
    publicId: input.values.jobPublicId,
  });

  if (!job) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That job could not be found.",
    };
  }

  const existing = await findApplicationForJob({
    userId: input.userId,
    jobId: job.id,
  });

  if (existing) {
    return {
      ok: false,
      error: "DUPLICATE",
      message: "You are already tracking an application for this job.",
    };
  }

  const resumeVersionId = await resolveVersionId({
    userId: input.userId,
    versionPublicId: input.values.resumeVersionPublicId,
  });

  const application = await createApplicationWithActivity({
    values: {
      userId: input.userId,
      jobId: job.id,
      resumeVersionId,
      stage: input.values.stage,
      appliedAt: input.values.stage === "APPLIED" ? new Date() : null,
    },
    activityTitle: `Tracking started at ${applicationStageLabels[input.values.stage]}`,
  });

  return { ok: true, value: { publicId: application.publicId } };
}

export async function changeApplicationStage(input: {
  userId: string;
  publicId: string;
  stage: UpdateApplicationInput["stage"];
}): Promise<ApplicationResult<{ publicId: string }>> {
  const current = await findApplicationForUser(input);

  if (!current) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  if (current.stage === input.stage) {
    return { ok: true, value: { publicId: current.publicId } };
  }

  const application = await updateApplicationWithActivity({
    userId: input.userId,
    publicId: input.publicId,
    values: {
      stage: input.stage,
      appliedAt:
        input.stage === "APPLIED" && !current.appliedAt
          ? new Date()
          : current.appliedAt,
    },
    activities: [
      {
        title: `Moved to ${applicationStageLabels[input.stage]}`,
        description: `From ${applicationStageLabels[current.stage]}`,
      },
    ],
  });

  if (!application) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  return { ok: true, value: { publicId: application.publicId } };
}

export async function updateOwnedApplication(input: {
  userId: string;
  values: UpdateApplicationInput;
}): Promise<ApplicationResult<{ publicId: string }>> {
  const current = await findApplicationForUser({
    userId: input.userId,
    publicId: input.values.publicId,
  });

  if (!current) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  const resumeVersionId = await resolveVersionId({
    userId: input.userId,
    versionPublicId: input.values.resumeVersionPublicId,
  });

  const activities: { title: string; description?: string | null }[] = [];

  if (current.stage !== input.values.stage) {
    activities.push({
      title: `Moved to ${applicationStageLabels[input.values.stage]}`,
      description: `From ${applicationStageLabels[current.stage]}`,
    });
  }

  if (
    input.values.followUpAt &&
    current.followUpAt?.getTime() !== input.values.followUpAt.getTime()
  ) {
    activities.push({
      title: `Follow-up set for ${input.values.followUpAt.toLocaleDateString()}`,
    });
  }

  if (
    input.values.interviewAt &&
    current.interviewAt?.getTime() !== input.values.interviewAt.getTime()
  ) {
    activities.push({
      title: `Interview set for ${input.values.interviewAt.toLocaleDateString()}`,
    });
  }

  const application = await updateApplicationWithActivity({
    userId: input.userId,
    publicId: input.values.publicId,
    values: {
      stage: input.values.stage,
      resumeVersionId,
      appliedAt: input.values.appliedAt ?? null,
      followUpAt: input.values.followUpAt ?? null,
      interviewAt: input.values.interviewAt ?? null,
      notes: input.values.notes ?? null,
    },
    activities,
  });

  if (!application) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  return { ok: true, value: { publicId: application.publicId } };
}

export async function deleteOwnedApplication(input: {
  userId: string;
  publicId: string;
}) {
  return deleteApplicationForUser(input);
}
