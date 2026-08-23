import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { AddResumeDialog } from "@/features/resumes/components/add-resume-dialog";
import { ResumeList } from "@/features/resumes/components/resume-list";
import { getResumeLibrary } from "@/features/resumes/server/resume.service";
import type { Metadata } from "next";

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
        action={
          <AddResumeDialog
            options={options}
            triggerClassName="w-full justify-center sm:w-auto"
          />
        }
      />

      <ResumeList resumes={resumes} />
    </div>
  );
}
