import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { DocumentGenerateForm } from "@/features/documents/components/document-generate-form";
import { getDocumentApplicationOptions } from "@/features/documents/server/document.service";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import { getJobBoard } from "@/features/jobs/server/job.service";

export const metadata: Metadata = {
  title: "Generate Document",
};

export default async function NewDocumentPage() {
  const user = await requireDatabaseUser();
  const [jobs, versions, applications] = await Promise.all([
    getJobBoard({
      userId: user.id,
      filters: { sort: "created_desc" },
    }),
    listOwnedVersionOptions(user.id),
    getDocumentApplicationOptions(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate document"
        description="Create application materials from a saved job and optional resume version."
      />

      <Card>
        <CardContent className="p-5">
          <DocumentGenerateForm
            jobs={jobs.map((job) => ({
              publicId: job.publicId,
              label: `${job.title} at ${job.company}`,
            }))}
            versions={versions.map((version) => ({
              publicId: version.publicId,
              label: `${version.resumeTitle} - ${version.label}`,
            }))}
            applications={applications.map((application) => ({
              publicId: application.publicId,
              label: `${application.jobTitle} at ${application.jobCompany} (${application.stage})`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
