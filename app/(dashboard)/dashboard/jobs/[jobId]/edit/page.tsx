import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { JobForm } from "@/features/jobs/components/job-form";
import { getOwnedJob } from "@/features/jobs/server/job.service";

export const metadata: Metadata = {
  title: "Edit job",
};

type EditJobPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { jobId } = await params;
  const user = await requireDatabaseUser();
  const job = await getOwnedJob({ userId: user.id, publicId: jobId });

  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit job" description={`${job.title} · ${job.company}`} />
      <JobForm job={job} />
    </div>
  );
}
