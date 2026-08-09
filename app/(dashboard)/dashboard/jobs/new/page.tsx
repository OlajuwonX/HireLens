import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { JobForm } from "@/features/jobs/components/job-form";

export const metadata: Metadata = {
  title: "Save a job",
};

export default async function NewJobPage() {
  await requireDatabaseUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Save a job"
        description="Paste the posting. Only the title, company and description are required."
      />
      <JobForm />
    </div>
  );
}
