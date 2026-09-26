import "server-only";

import { attachAnalysisApplication } from "@/features/analyses/server/analysis.repository";
import { analyzeApplication } from "@/features/analyses/server/analysis.service";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import type { UsageDenialReason } from "@/features/usage/limit-notice";
import { SAVE_ONLY_ANALYZE_MESSAGE } from "../analysis-state";
import { applicationStatusLabels } from "../constants";
import type {
  ApplicationFilters,
  SaveAndAnalyzeInput,
  UpdateApplicationInput,
} from "../schemas/application.schema";
import {
  attachAnalysisToApplication,
  countApplicationsByStatus,
  createJobWithApplication,
  deleteApplicationForUser,
  findApplicationForUser,
  findApplicationRowForUser,
  listActivitiesForApplication,
  listApplicationsForUser,
  updateApplicationWithActivity,
} from "./application.repository";

export type ApplicationResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: "NOT_FOUND" | "ANALYSIS_FAILED" | "LIMIT_REACHED" | "SAVE_ONLY";
      message: string;
      limitReason?: UsageDenialReason;
    };

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
  limit?: number;
  offset?: number;
}) {
  return listApplicationsForUser(input);
}

export async function getStatusCounts(userId: string) {
  return countApplicationsByStatus(userId);
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

function toJobValues(values: SaveAndAnalyzeInput) {
  return {
    title: values.title,
    company: values.company,
    location: values.location ?? null,
    workArrangement: values.workArrangement,
    employmentType: values.employmentType,
    salaryMin: values.salaryMin ?? null,
    salaryMax: values.salaryMax ?? null,
    currency: values.currency ?? null,
    source: values.source ?? null,
    sourceUrl: values.sourceUrl ?? null,
    description: values.description,
    requirements: values.requirements ?? null,
    deadlineAt: values.deadlineAt ?? null,
    notes: values.notes ?? null,
  };
}

export async function saveJobOnly(input: {
  userId: string;
  values: SaveAndAnalyzeInput;
}): Promise<ApplicationResult<{ applicationPublicId: string }>> {
  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.values.resumeVersionPublicId,
  });

  if (!version) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That resume version could not be found.",
    };
  }

  const { application } = await createJobWithApplication({
    userId: input.userId,
    resumeVersionId: version.id,
    activityTitle: "Job saved",
    saveOnly: true,
    job: toJobValues(input.values),
  });

  return {
    ok: true,
    value: { applicationPublicId: application.publicId },
  };
}

export async function saveAndAnalyze(input: {
  userId: string;
  values: SaveAndAnalyzeInput;
}): Promise<
  ApplicationResult<{
    applicationPublicId: string;
    analysed: boolean;
    analysisMessage?: string;
    analysisLimitReason?: UsageDenialReason;
  }>
> {
  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.values.resumeVersionPublicId,
  });

  if (!version) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That resume version could not be found.",
    };
  }

  const { job, application } = await createJobWithApplication({
    userId: input.userId,
    resumeVersionId: version.id,
    activityTitle: "Application created",
    job: toJobValues(input.values),
  });

  const analysis = await analyzeApplication({
    userId: input.userId,
    job,
    version,
    applicationId: application.id,
  });

  if (analysis.ok) {
    await Promise.all([
      attachAnalysisToApplication({
        userId: input.userId,
        applicationId: application.id,
        analysisId: analysis.analysisId,
      }),
      attachAnalysisApplication({
        userId: input.userId,
        analysisId: analysis.analysisId,
        applicationId: application.id,
      }),
    ]);
  }

  return {
    ok: true,
    value: {
      applicationPublicId: application.publicId,
      analysed: analysis.ok,
      analysisMessage: analysis.ok ? undefined : analysis.message,
      analysisLimitReason:
        !analysis.ok && analysis.error === "LIMIT_REACHED"
          ? analysis.limitReason
          : undefined,
    },
  };
}

export async function changeApplicationStatus(input: {
  userId: string;
  publicId: string;
  status: UpdateApplicationInput["status"];
}): Promise<ApplicationResult<{ publicId: string }>> {
  const current = await findApplicationForUser(input);

  if (!current) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  if (current.status === input.status) {
    return { ok: true, value: { publicId: current.publicId } };
  }

  const application = await updateApplicationWithActivity({
    userId: input.userId,
    publicId: input.publicId,
    values: { status: input.status },
    activities: [
      {
        title: `Marked ${applicationStatusLabels[input.status]}`,
        description: `From ${applicationStatusLabels[current.status]}`,
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

export async function analyzeOwnedApplication(input: {
  userId: string;
  publicId: string;
}): Promise<ApplicationResult<{ publicId: string }>> {
  const row = await findApplicationRowForUser(input);

  if (!row) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That application could not be found.",
    };
  }

  if (row.application.saveOnly) {
    return {
      ok: false,
      error: "SAVE_ONLY",
      message: SAVE_ONLY_ANALYZE_MESSAGE,
    };
  }

  if (!row.versionPublicId) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "Attach a resume version before running analysis.",
    };
  }

  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: row.versionPublicId,
  });

  if (!version) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That resume version could not be found.",
    };
  }

  const analysis = await analyzeApplication({
    userId: input.userId,
    job: row.job,
    version,
    applicationId: row.application.id,
    regenerate: true,
  });

  if (!analysis.ok) {
    return analysis.error === "LIMIT_REACHED"
      ? {
          ok: false,
          error: "LIMIT_REACHED",
          message: analysis.message,
          limitReason: analysis.limitReason,
        }
      : {
          ok: false,
          error: "ANALYSIS_FAILED",
          message: analysis.message,
        };
  }

  await attachAnalysisToApplication({
    userId: input.userId,
    applicationId: row.application.id,
    analysisId: analysis.analysisId,
  });

  return { ok: true, value: { publicId: row.application.publicId } };
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

  if (current.status !== input.values.status) {
    activities.push({
      title: `Marked ${applicationStatusLabels[input.values.status]}`,
      description: `From ${applicationStatusLabels[current.status]}`,
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

  const application = await updateApplicationWithActivity({
    userId: input.userId,
    publicId: input.values.publicId,
    values: {
      status: input.values.status,
      resumeVersionId,
      appliedAt: input.values.appliedAt ?? null,
      followUpAt: input.values.followUpAt ?? null,
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
