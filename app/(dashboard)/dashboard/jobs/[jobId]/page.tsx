import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { JobActionsPanel } from "@/features/jobs/components/job-actions-panel";
import { JobStatusBadge } from "@/features/jobs/components/job-status-badge";
import {
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import { getOwnedJob } from "@/features/jobs/server/job.service";
import type { Job } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Job",
};

type JobPageProps = {
  params: Promise<{ jobId: string }>;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-meta text-text-secondary">{label}</dt>
      <dd className="text-right text-meta text-text-primary">{value}</dd>
    </div>
  );
}

function salaryOf(job: Job) {
  if (job.salaryMin === null && job.salaryMax === null) {
    return null;
  }

  const currency = job.currency ? `${job.currency} ` : "";
  const min = job.salaryMin?.toLocaleString();
  const max = job.salaryMax?.toLocaleString();

  return min && max
    ? `${currency}${min} – ${max}`
    : `${currency}${min ?? max}`;
}

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params;
  const user = await requireDatabaseUser();
  const job = await getOwnedJob({ userId: user.id, publicId: jobId });

  if (!job) {
    notFound();
  }

  const salary = salaryOf(job);

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={job.company}
        action={<JobStatusBadge status={job.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-meta leading-relaxed text-text-secondary">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {job.requirements ? (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words text-meta leading-relaxed text-text-secondary">
                  {job.requirements}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {job.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Your notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words text-meta leading-relaxed text-text-secondary">
                  {job.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                {job.location ? (
                  <DetailRow label="Location" value={job.location} />
                ) : null}
                <DetailRow
                  label="Arrangement"
                  value={workArrangementLabels[job.workArrangement]}
                />
                <DetailRow
                  label="Employment"
                  value={employmentTypeLabels[job.employmentType]}
                />
                {salary ? <DetailRow label="Salary" value={salary} /> : null}
                {job.source ? (
                  <DetailRow label="Source" value={job.source} />
                ) : null}
                {job.deadlineAt ? (
                  <DetailRow
                    label="Deadline"
                    value={job.deadlineAt.toLocaleDateString()}
                  />
                ) : null}
                <DetailRow
                  label="Saved"
                  value={job.createdAt.toLocaleDateString()}
                />
              </dl>

              {job.sourceUrl ? (
                <Link
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-4 inline-block break-all text-label text-info underline-offset-4 hover:underline"
                >
                  View original posting
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <JobActionsPanel job={job} />
        </div>
      </div>
    </div>
  );
}
