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
      <PageHeader
        title="New resume"
        description="Create the metadata record first. File upload will attach to this flow through the storage provider."
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-950">Resume details</h2>
        </CardHeader>
        <CardContent>
          <CreateResumeForm />
        </CardContent>
      </Card>
    </div>
  );
}
