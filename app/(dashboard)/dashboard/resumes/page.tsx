import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeList } from "@/features/resumes/components/resume-list";
import { ResumeUploadForm } from "@/features/resumes/components/resume-upload-form";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getResumeLibrary } from "@/features/resumes/server/resume.service";

export const metadata: Metadata = {
  title: "Resumes",
};

export default async function ResumesPage() {
  const user = await requireDatabaseUser();
  const resumes = await getResumeLibrary(user.id);
  const options = resumes
    .filter((resume) => !resume.archivedAt)
    .map((resume) => ({ publicId: resume.publicId, title: resume.title }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumes"
        description="Upload a resume under a job title. Every version you add and every AI-improved resume for that role stays in the same place."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit lg:order-2">
          <CardHeader>
            <CardTitle>Upload a resume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumeUploadForm options={options} />
          </CardContent>
        </Card>

        <div className="lg:order-1 lg:col-span-2">
          <ResumeList resumes={resumes} />
        </div>
      </div>
    </div>
  );
}
