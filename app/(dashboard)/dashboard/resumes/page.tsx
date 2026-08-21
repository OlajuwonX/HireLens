import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AddResumeDialog } from "@/features/resumes/components/add-resume-dialog";
import { ResumeList } from "@/features/resumes/components/resume-list";
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
        description="Every resume you upload sits under a job title. Versions you add and AI-improved resumes for that role stay in the same place."
        action={<AddResumeDialog options={options} />}
      />

      <ResumeList resumes={resumes} />
    </div>
  );
}
