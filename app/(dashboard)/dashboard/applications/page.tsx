import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { SaveAndAnalyzeForm } from "@/features/applications/components/save-and-analyze-form";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";

export const metadata: Metadata = {
  title: "Applications",
};

export default async function ApplicationsPage() {
  const user = await requireDatabaseUser();
  const versions = await listOwnedVersionOptions(user.id);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/jobs" label="Saved Jobs" />

      <PageHeader
        title="Applications"
        description="Enter the job you are preparing for. HireLens saves it and analyses your resume against it in one step."
      />
      <SaveAndAnalyzeForm versions={versions} />
    </div>
  );
}
