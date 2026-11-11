import {
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import type { JobPostingInput } from "@/lib/ai/types";
import type { Job } from "@/lib/db/schema";

export function toJobPostingInput(job: Job): JobPostingInput {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    workArrangement: workArrangementLabels[job.workArrangement],
    employmentType: employmentTypeLabels[job.employmentType],
    deadline: job.deadlineAt?.toISOString().slice(0, 10) ?? null,
    source: job.source,
    sourceUrl: job.sourceUrl,
    description: job.description,
    requirements: job.requirements,
  };
}
