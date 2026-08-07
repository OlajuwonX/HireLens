import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ResumeList } from "@/features/resumes/components/resume-list";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getResumeLibrary } from "@/features/resumes/server/resume.service";

export const metadata: Metadata = {
  title: "Resumes",
};

export default async function ResumesPage() {
  const user = await requireDatabaseUser();
  const resumes = await getResumeLibrary(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumes"
        description="Manage resume records, processing states, and future resume versions."
        action={
          <Button asChild>
            <a href="/dashboard/resumes/new">New resume</a>
          </Button>
        }
      />
      <ResumeList resumes={resumes} />
    </div>
  );
}
