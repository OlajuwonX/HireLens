import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";
import {
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import { JobStatusBadge } from "./job-status-badge";
import type { Job } from "@/lib/db/schema";

function formatSalary(job: Job) {
  if (job.salaryMin === null && job.salaryMax === null) {
    return null;
  }

  const currency = job.currency ? `${job.currency} ` : "";
  const min = job.salaryMin?.toLocaleString();
  const max = job.salaryMax?.toLocaleString();

  if (min && max) {
    return `${currency}${min} – ${max}`;
  }

  return `${currency}${min ?? max}`;
}

export function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {jobs.map((job) => {
        const salary = formatSalary(job);

        return (
          <li key={job.publicId}>
            <Link
              href={`/dashboard/jobs/${job.publicId}`}
              className="block px-4 py-4 transition-colors hover:bg-surface-secondary sm:px-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="truncate text-meta font-semibold text-text-primary">
                    {job.title}
                  </p>
                  <p className="truncate text-meta text-text-secondary">
                    {job.company}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label text-text-muted">
                {job.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {job.location}
                  </span>
                ) : null}
                <span>{workArrangementLabels[job.workArrangement]}</span>
                <span>{employmentTypeLabels[job.employmentType]}</span>
                {salary ? (
                  <span className="font-mono tabular-nums">{salary}</span>
                ) : null}
                {job.deadlineAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock aria-hidden="true" className="size-3.5" />
                    {job.deadlineAt.toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
