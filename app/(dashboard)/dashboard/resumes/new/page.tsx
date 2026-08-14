import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CreateResumeForm } from "@/features/resumes/components/create-resume-form";

export const metadata: Metadata = {
  title: "New resume",
};

export default function NewResumePage() {
  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/resumes" label="Resumes" />

      <PageHeader
        title="New resume"
        description="Create the metadata record first. File upload will attach to this flow through the storage provider."
      />
      <Card>
        <CardHeader>
          <h2 className="text-section-title font-semibold text-text-primary">
            Resume details
          </h2>
        </CardHeader>
        <CardContent>
          <CreateResumeForm />
        </CardContent>
      </Card>
    </div>
  );
}
